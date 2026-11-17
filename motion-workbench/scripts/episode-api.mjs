// 成片参数 API
// GET  /motion-workbench/api/episode
// GET  /motion-workbench/api/episode/:id/config
// PUT  /motion-workbench/api/episode/:id/config
// POST /motion-workbench/api/episode/:id/preview
// POST /motion-workbench/api/episode/:id/export
// POST /motion-workbench/api/episode/:id/review-log
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getEpisodeConfigPath,
  listEpisodes,
  readEpisodeConfig,
  renderEpisode,
  resolveEpisodeId,
  writeEpisodeConfig,
} from './episode-renderer.mjs';

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reviewDir = path.join(workbenchDir, 'data', 'review-logs');
const THEMES = new Set(['whiteWindow', 'blackGold']);

function respond(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readBody(request, maxBytes = 400_000) {
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

export function validateEpisodeConfig(config) {
  if (!config || typeof config !== 'object') return '配置必须是对象';
  if (config.schemaVersion !== 1) return 'schemaVersion 必须为 1';
  if (!config.meta || typeof config.meta !== 'object') return '缺少 meta';
  if (!THEMES.has(config.meta.theme)) return 'meta.theme 仅支持 whiteWindow | blackGold';
  if (!Number.isFinite(config.meta.fps) || config.meta.fps <= 0) return 'meta.fps 非法';
  if (!Array.isArray(config.cues)) return 'cues 必须是数组';
  for (let i = 0; i < config.cues.length; i++) {
    const c = config.cues[i];
    if (typeof c?.text !== 'string') return `cues[${i}].text 必须是字符串`;
    if (!Number.isFinite(c.from) || c.from < 0) return `cues[${i}].from 非法`;
    if (!Number.isFinite(c.duration) || c.duration <= 0) return `cues[${i}].duration 非法`;
  }
  if (config.scenes && !Array.isArray(config.scenes)) return 'scenes 必须是数组';
  if (Array.isArray(config.scenes)) {
    for (let i = 0; i < config.scenes.length; i++) {
      const s = config.scenes[i];
      if (!s?.id) return `scenes[${i}].id 必填`;
      if (!Number.isFinite(s.durationInFrames) || s.durationInFrames <= 0) {
        return `scenes[${i}].durationInFrames 非法`;
      }
    }
  }
  if (config.audio && typeof config.audio === 'object') {
    for (const key of ['voiceGain', 'sfxGain', 'bgmGain']) {
      if (config.audio[key] != null && !Number.isFinite(Number(config.audio[key]))) {
        return `audio.${key} 非法`;
      }
    }
  }
  return null;
}

function matchEpisodeRoute(requestPath) {
  if (requestPath === '/motion-workbench/api/episode' || requestPath === '/motion-workbench/api/episodes') {
    return { kind: 'list' };
  }
  const m = /^\/motion-workbench\/api\/episode\/([^/]+)(?:\/([^/]+))?$/.exec(requestPath);
  if (!m) return null;
  return { kind: 'item', id: decodeURIComponent(m[1]), action: m[2] || 'config' };
}

export async function handleEpisodeApi(request, response, requestPath) {
  if (!requestPath.startsWith('/motion-workbench/api/episode')) return false;

  try {
    const route = matchEpisodeRoute(requestPath);
    if (!route) {
      respond(response, 404, { ok: false, error: '未知 episode 接口' });
      return true;
    }

    if (route.kind === 'list' && request.method === 'GET') {
      respond(response, 200, { ok: true, episodes: listEpisodes() });
      return true;
    }

    const episodeId = resolveEpisodeId(route.id);
    const configPath = getEpisodeConfigPath(episodeId);
    if (!fs.existsSync(configPath)) {
      respond(response, 404, { ok: false, error: `找不到配置: ${episodeId}` });
      return true;
    }

    if (route.action === 'config' && request.method === 'GET') {
      respond(response, 200, {
        ok: true,
        episodeId,
        config: readEpisodeConfig(episodeId),
        path: configPath,
      });
      return true;
    }

    if (route.action === 'config' && request.method === 'PUT') {
      const raw = JSON.parse((await readBody(request)) || '{}');
      const config = raw.config ?? raw;
      const err = validateEpisodeConfig(config);
      if (err) {
        respond(response, 400, { ok: false, error: err });
        return true;
      }
      writeEpisodeConfig(episodeId, config);
      respond(response, 200, { ok: true, episodeId, config });
      return true;
    }

    if (route.action === 'preview' && request.method === 'POST') {
      const result = await renderEpisode(episodeId, 'preview');
      respond(response, 200, result);
      return true;
    }

    if (route.action === 'export' && request.method === 'POST') {
      const result = await renderEpisode(episodeId, 'export');
      respond(response, 200, result);
      return true;
    }

    if (route.action === 'review-log' && request.method === 'POST') {
      const raw = JSON.parse((await readBody(request)) || '{}');
      fs.mkdirSync(reviewDir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = path.join(reviewDir, `${episodeId}-${stamp}.json`);
      const payload = {
        episodeId,
        createdAt: new Date().toISOString(),
        note: raw.note || '',
        map: raw.map || null,
        config: raw.config || readEpisodeConfig(episodeId),
      };
      fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
      respond(response, 200, { ok: true, path: file });
      return true;
    }

    respond(response, 404, { ok: false, error: '未知 episode 动作' });
    return true;
  } catch (error) {
    respond(response, 500, { ok: false, error: error.message || String(error) });
    return true;
  }
}
