#!/usr/bin/env node
/**
 * 将 epNN.motion-map.json 合并进 epNN.config.json。
 *
 * 用法：
 *   node scripts/motion-map-to-config.mjs <map.json> [config.json]
 *   node scripts/motion-map-to-config.mjs --episode demo
 *
 * 规则：
 * - segments[].start/end 为秒；按 meta.fps 换成帧写入 scenes / cues / cards
 * - cardId 必须在 cards.whitelist.json 且 autoPick=true（可用 --allow-reference 放宽）
 * - 已有 config 时保留 meta.theme / audio；用 map 覆盖 scenes、cues、copy 片段与 cards
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = path.resolve(workbenchDir, '..');
const whitelistPath = path.join(
  rootDir,
  'custom-skills',
  'episode-fx-orchestrator',
  'cards.whitelist.json',
);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function episodePaths(episodeId) {
  const dir = path.join(rootDir, 'muci-engine', 'components', 'src', episodeId);
  return {
    dir,
    map: path.join(dir, `${episodeId}.motion-map.json`),
    config: path.join(dir, `${episodeId}.config.json`),
  };
}

function secToFrame(sec, fps) {
  return Math.max(0, Math.round(Number(sec) * fps));
}

function validateMap(map, whitelist, { allowReference = false } = {}) {
  const errors = [];
  if (!map || map.schemaVersion !== 1) errors.push('motion-map.schemaVersion 必须为 1');
  if (!Array.isArray(map.segments) || map.segments.length === 0) {
    errors.push('segments 不能为空');
  }
  const byId = new Map((whitelist.cards || []).map((c) => [c.id, c]));
  for (let i = 0; i < (map.segments || []).length; i++) {
    const seg = map.segments[i];
    if (!Number.isFinite(seg.start) || !Number.isFinite(seg.end) || seg.end <= seg.start) {
      errors.push(`segments[${i}] start/end 非法`);
    }
    if (!seg.cardId) {
      errors.push(`segments[${i}] 缺少 cardId`);
      continue;
    }
    const card = byId.get(seg.cardId);
    if (!card) {
      errors.push(`segments[${i}].cardId 不在白名单: ${seg.cardId}`);
    } else if (!card.autoPick && !allowReference) {
      errors.push(`segments[${i}].cardId 不可自动选用（仅参考）: ${seg.cardId}`);
    }
  }
  return errors;
}

export function motionMapToConfig(map, existingConfig = null, options = {}) {
  const whitelist = loadJson(whitelistPath);
  const errors = validateMap(map, whitelist, options);
  if (errors.length) {
    const err = new Error(errors.join('\n'));
    err.validation = errors;
    throw err;
  }

  const fps = Number(existingConfig?.meta?.fps || map.meta?.fps || 30);
  const theme = existingConfig?.meta?.theme || map.meta?.theme || 'whiteWindow';
  const episode = existingConfig?.meta?.episode || map.meta?.episode || 'epNN';
  const width = Number(existingConfig?.meta?.width || map.meta?.width || 1920);
  const height = Number(existingConfig?.meta?.height || map.meta?.height || 1080);

  const scenes = [];
  const cues = [];
  const cards = [];
  const copyCards = [];

  map.segments.forEach((seg, index) => {
    const id = seg.id || `S${index}`;
    const from = secToFrame(seg.start, fps);
    const end = secToFrame(seg.end, fps);
    const durationInFrames = Math.max(1, end - from);
    scenes.push({
      id,
      durationInFrames,
      label: seg.intent || seg.label || id,
    });
    const text =
      (typeof seg.params?.caption === 'string' && seg.params.caption) ||
      (typeof seg.params?.text === 'string' && seg.params.text) ||
      (typeof seg.params?.title === 'string' && seg.params.title) ||
      '';
    cues.push({
      id: `c${index + 1}`,
      sceneId: id,
      text,
      from,
      duration: durationInFrames,
    });
    cards.push({
      id: `card-${id}`,
      sceneId: id,
      cardId: seg.cardId,
      intent: seg.intent || '',
      params: seg.params || {},
      confidence: seg.confidence,
      reason: seg.reason || '',
      from,
      duration: durationInFrames,
    });
    if (seg.params && Object.keys(seg.params).length) {
      copyCards.push({ sceneId: id, ...seg.params });
    }
  });

  // scenes 表用各镜时长；若 segments 非首尾相接，仍按每段自身 duration 写入（与 Overlay 分段一致）
  const config = {
    schemaVersion: 1,
    meta: {
      episode,
      slug: existingConfig?.meta?.slug || map.meta?.slug || 'pilot',
      width,
      height,
      fps,
      theme,
      compositionId:
        existingConfig?.meta?.compositionId || map.meta?.compositionId || episode,
    },
    scenes,
    cues,
    copy: {
      ...(existingConfig?.copy || {}),
      title: map.meta?.title || existingConfig?.copy?.title || episode,
      subtitle: map.meta?.subtitle || existingConfig?.copy?.subtitle || '',
      cards: copyCards,
    },
    media: existingConfig?.media || [],
    audio: {
      voiceGain: existingConfig?.audio?.voiceGain ?? 1,
      sfxGain: existingConfig?.audio?.sfxGain ?? 1,
      bgmGain: existingConfig?.audio?.bgmGain ?? 0.45,
      sfxEnabled: existingConfig?.audio?.sfxEnabled ?? true,
      ...(map.audio || {}),
    },
    cards,
    motionMapRef: map.meta?.source || null,
  };

  return config;
}

function parseArgs(argv) {
  const args = { allowReference: false, episode: null, map: null, config: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--allow-reference') args.allowReference = true;
    else if (a === '--episode') args.episode = argv[++i];
    else if (!args.map) args.map = a;
    else if (!args.config) args.config = a;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  let mapPath = args.map;
  let configPath = args.config;

  if (args.episode) {
    const p = episodePaths(args.episode);
    mapPath = mapPath || p.map;
    configPath = configPath || p.config;
  }

  if (!mapPath) {
    console.error(
      '用法: node scripts/motion-map-to-config.mjs <map.json> [config.json]\n' +
        '   或: node scripts/motion-map-to-config.mjs --episode demo',
    );
    process.exit(1);
  }

  const map = loadJson(mapPath);
  const existing = configPath && fs.existsSync(configPath) ? loadJson(configPath) : null;
  const config = motionMapToConfig(map, existing, { allowReference: args.allowReference });

  const out = configPath || mapPath.replace(/\.motion-map\.json$/i, '.config.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  console.log(`wrote ${out}`);
  console.log(`  scenes=${config.scenes.length} cues=${config.cues.length} cards=${config.cards.length}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
