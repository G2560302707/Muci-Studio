// P2 API：成片参数实验室
// GET  /motion-workbench/api/episode-lab/config
// PUT  /motion-workbench/api/episode-lab/config
// POST /motion-workbench/api/episode-lab/preview
// POST /motion-workbench/api/episode-lab/export
import {
  getEpisodeLabConfigPath,
  readEpisodeLabConfig,
  renderEpisodeLab,
  writeEpisodeLabConfig,
} from './episode-renderer.mjs';
import { validateEpisodeConfig } from './episode-api.mjs';

function respond(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readBody(request, maxBytes = 200_000) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        reject(new Error('请求体过大'));
        request.destroy();
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function validateConfig(config) {
  return validateEpisodeConfig(config);
}

export async function handleEpisodeLabApi(request, response, requestPath) {
  if (!requestPath.startsWith('/motion-workbench/api/episode-lab')) return false;

  try {
    if (requestPath === '/motion-workbench/api/episode-lab/config' && request.method === 'GET') {
      const config = readEpisodeLabConfig();
      respond(response, 200, {
        ok: true,
        config,
        path: getEpisodeLabConfigPath(),
      });
      return true;
    }

    if (requestPath === '/motion-workbench/api/episode-lab/config' && request.method === 'PUT') {
      const raw = JSON.parse((await readBody(request)) || '{}');
      const config = raw.config ?? raw;
      const err = validateConfig(config);
      if (err) {
        respond(response, 400, { ok: false, error: err });
        return true;
      }
      writeEpisodeLabConfig(config);
      respond(response, 200, { ok: true, config });
      return true;
    }

    if (requestPath === '/motion-workbench/api/episode-lab/preview' && request.method === 'POST') {
      const result = await renderEpisodeLab('preview');
      respond(response, 200, result);
      return true;
    }

    if (requestPath === '/motion-workbench/api/episode-lab/export' && request.method === 'POST') {
      const result = await renderEpisodeLab('export');
      respond(response, 200, result);
      return true;
    }

    respond(response, 404, { ok: false, error: '未知 episode-lab 接口' });
    return true;
  } catch (error) {
    respond(response, 500, { ok: false, error: error.message || String(error) });
    return true;
  }
}
