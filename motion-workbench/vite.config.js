import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { handlePreviewApi } from './scripts/preview-api.mjs';
import { handleEpisodeLabApi } from './scripts/episode-lab-api.mjs';
import { handleEpisodeApi } from './scripts/episode-api.mjs';
import { handleDistillApi } from './scripts/distill-api.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dirname, '..');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ts': 'text/plain; charset=utf-8',
  '.tsx': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

// 解析 Range 头:返回 {start, end};无 Range 返回 null;非法返回 false。
function parseRange(rangeHeader, fileSize) {
  if (!rangeHeader) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return false;
  let start;
  let end;
  if (match[1] === '') {
    // bytes=-N:末尾 N 个字节
    const suffix = Number(match[2]);
    if (!Number.isFinite(suffix) || suffix <= 0) return false;
    start = Math.max(0, fileSize - suffix);
    end = fileSize - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? fileSize - 1 : Number(match[2]);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= fileSize) {
    return false;
  }
  return { start, end: Math.min(end, fileSize - 1) };
}

// 按文件服务,支持 Range(视频拖动进度条必需)。
function serveFileWithRange(filePath, request, response) {
  const stat = fs.statSync(filePath);
  const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  const range = parseRange(request.headers.range, stat.size);

  if (range === false) {
    response.writeHead(416, {
      'Content-Range': `bytes */${stat.size}`,
      'Accept-Ranges': 'bytes'
    });
    response.end();
    return;
  }

  if (range) {
    response.writeHead(206, {
      'Content-Type': contentType,
      'Content-Range': `bytes ${range.start}-${range.end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': range.end - range.start + 1
    });
    fs.createReadStream(filePath, { start: range.start, end: range.end }).pipe(response);
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Content-Length': stat.size
  });
  fs.createReadStream(filePath).pipe(response);
}

// catalog.previewUrl 落盘目录（根绝对前缀），dev 服务按仓库根读盘。
const EXTERNAL_ASSET_PREFIXES = [
  '/muci-engine/',
  '/talkcraft-main/',
];

function resolveExternalDiskPath(requestPath) {
  return path.resolve(rootDir, `.${requestPath}`);
}

function serveExternalAssets() {
  return {
    name: 'serve-external-motion-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        let requestPath = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
        // vite 在中间件前剥掉 base 前缀,API 请求可能是 /api/... 形态
        if (requestPath.startsWith('/api/')) {
          requestPath = `/motion-workbench${requestPath}`;
        }
        if (requestPath.startsWith('/motion-workbench/api/')) {
          (async () => {
            if (await handleEpisodeApi(request, response, requestPath)) return;
            if (await handleEpisodeLabApi(request, response, requestPath)) return;
            if (requestPath.startsWith('/motion-workbench/api/distill')) {
              await handleDistillApi(request, response, requestPath);
              return;
            }
            if (await handlePreviewApi(request, response, requestPath)) return;
            response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify({ ok: false, error: '未知接口' }));
          })().catch(() => {});
          return;
        }
        // 外部库静态资源白名单：catalog 里的 previewUrl 是根绝对路径（不带 /motion-workbench/ base），
        // 中间件在 vite 剥 base 之前跑，所以这里按目录前缀直接放行并自行读盘。
        // talkcraft-main/demos 是本地 HTML 预览（iframe），必须放行，否则会落到 vite 的 base 提示页。
        if (!EXTERNAL_ASSET_PREFIXES.some(prefix => requestPath.startsWith(prefix))) {
          next();
          return;
        }

        const filePath = resolveExternalDiskPath(requestPath);
        if (!filePath.startsWith(rootDir)) {
          response.statusCode = 403;
          response.end('Forbidden');
          return;
        }
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          next();
          return;
        }

        serveFileWithRange(filePath, request, response);
      });
    }
  };
}

export default defineConfig(({ command }) => ({
  root: dirname,
  publicDir: false,
  base: command === 'build' ? '/motion-workbench/dist/' : '/motion-workbench/',
  plugins: [react(), serveExternalAssets()],
  build: {
    outDir: path.resolve(dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(dirname, 'index.html')
    }
  }
}));
