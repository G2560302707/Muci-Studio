// 按需预览渲染 API:dev 中间件与静态服务共用。
// POST /motion-workbench/api/preview  body: {library, name}
// 只接受 catalog 中 previewType 为 missing 的 remocn/snapcn 记录;
// 渲染产物写入 data/media 投影区,同时登记 preview-overrides 供下次构建合并。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPreview } from './preview-renderer.mjs';

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(workbenchDir, 'data', 'catalog.json');
const overridesPath = path.join(workbenchDir, 'data', 'preview-overrides.json');

const RENDERABLE_LIBRARIES = new Set(['remocn', 'snapcn']);

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function respond(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 10_000) {
        reject(new Error('请求体过大'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

// catalog/overrides 写入串行化,避免并发渲染交叉覆盖
let writeChain = Promise.resolve();
function persistRender(recordId, preview) {
  writeChain = writeChain.then(() => {
    const overrides = readJson(overridesPath, {});
    overrides[recordId] = preview;
    fs.writeFileSync(overridesPath, `${JSON.stringify(overrides, null, 2)}\n`, 'utf8');

    const catalog = readJson(catalogPath, null);
    if (catalog?.records) {
      catalog.records = catalog.records.map(record =>
        record.id === recordId ? { ...record, ...preview } : record
      );
      catalog.stats.missingPreviews = catalog.records.filter(
        item => item.previewType === 'missing'
      ).length;
      fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
    }
  });
  return writeChain;
}

export async function handlePreviewApi(request, response, requestPath) {
  if (requestPath !== '/motion-workbench/api/preview') return false;
  if (request.method !== 'POST') {
    respond(response, 405, { ok: false, error: '仅支持 POST' });
    return true;
  }

  try {
    const body = JSON.parse((await readBody(request)) || '{}');
    const { library, name } = body;
    if (!RENDERABLE_LIBRARIES.has(library) || typeof name !== 'string' || !/^[\w-]+$/.test(name)) {
      respond(response, 400, { ok: false, error: '参数不合法' });
      return true;
    }

    const catalog = readJson(catalogPath, null);
    const record = catalog?.records?.find(item => item.id === `${library}:${name}`);
    if (!record) {
      respond(response, 404, { ok: false, error: '记录不存在' });
      return true;
    }
    if (record.previewType !== 'missing') {
      respond(response, 409, { ok: false, error: '该记录已有本地预览' });
      return true;
    }

    const result = await renderPreview({ library, name });
    const preview = { previewType: 'video', previewUrl: result.previewUrl };
    await persistRender(record.id, preview);
    respond(response, 200, { ok: true, previewUrl: result.previewUrl, cached: result.cached });
  } catch (error) {
    respond(response, 500, { ok: false, error: error.message });
  }
  return true;
}
