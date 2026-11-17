import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handlePreviewApi } from './scripts/preview-api.mjs';
import { handleDistillApi } from './scripts/distill-api.mjs';
import { handleEpisodeLabApi } from './scripts/episode-lab-api.mjs';
import { handleEpisodeApi } from './scripts/episode-api.mjs';

const workbenchDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(workbenchDir, '..');
const port = Number(process.env.PORT || 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.md': 'text/plain; charset=utf-8',
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

function sendFileWithRange(filePath, response, rangeHeader) {
  const stat = fs.statSync(filePath);
  const contentType = types[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  const range = parseRange(rangeHeader, stat.size);

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
    'Content-Length': stat.size,
    // index.html 引用带 hash 的构建产物,重建后旧文件名会失效;
    // 不加 no-cache 的话浏览器会拿缓存的旧 html 去加载已删除的旧 bundle,直接白屏
    'Cache-Control': contentType.includes('html') ? 'no-cache' : 'no-cache, must-revalidate'
  });
  fs.createReadStream(filePath).pipe(response);
}

function send(response, statusCode, content, contentType) {
  response.writeHead(statusCode, { 'Content-Type': contentType });
  response.end(content);
}

http.createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname);
  if (requestPath === '/') {
    response.writeHead(302, { Location: '/motion-workbench/dist/index.html' });
    response.end();
    return;
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

  const relativePath = path.normalize(requestPath).replace(/^([/\\])+/, '');
  const filePath = path.resolve(rootDir, relativePath);
  if (!filePath.startsWith(rootDir)) {
    send(response, 403, 'Forbidden', 'text/plain; charset=utf-8');
    return;
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    send(response, 404, 'Not Found', 'text/plain; charset=utf-8');
    return;
  }

  sendFileWithRange(filePath, response, request.headers.range);
}).listen(port, '127.0.0.1', () => {
  console.log(`Motion workbench: http://127.0.0.1:${port}/motion-workbench/dist/index.html`);
});
