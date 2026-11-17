#!/usr/bin/env node
/**
 * 成片配置体检
 *
 *   node scripts/lint-episode.mjs path/to/epNN.config.json [--duration 22]
 *   npm run lint:episode -- ../muci-engine/components/src/demo/demo.config.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = path.resolve(workbenchDir, '..');
const defaultRulesPath = path.join(workbenchDir, 'scripts', 'lint-rules.default.json');
const localRulesPath = path.join(workbenchDir, 'scripts', 'lint-rules.local.json');
const whitelistPath = path.join(
  rootDir,
  'custom-skills',
  'episode-fx-orchestrator',
  'cards.whitelist.json',
);

function loadRules() {
  const base = JSON.parse(fs.readFileSync(defaultRulesPath, 'utf8'));
  if (fs.existsSync(localRulesPath)) {
    Object.assign(base, JSON.parse(fs.readFileSync(localRulesPath, 'utf8')));
  }
  return base;
}

function parseArgs(argv) {
  const args = { file: null, duration: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--duration') args.duration = Number(argv[++i]);
    else if (!args.file) args.file = argv[i];
  }
  return args;
}

function isOff(obj, rule) {
  const off = obj?.lintOff;
  return Array.isArray(off) && off.includes(rule);
}

export function lintEpisode(config, options = {}) {
  const rules = options.rules || loadRules();
  const issues = [];
  const whitelist = fs.existsSync(whitelistPath)
    ? JSON.parse(fs.readFileSync(whitelistPath, 'utf8'))
    : { cards: [] };
  const autoIds = new Set(
    (whitelist.cards || []).filter((c) => c.autoPick).map((c) => c.id),
  );

  const fps = Number(config.meta?.fps) || 30;
  const durationFrames =
    options.durationFrames ??
    (Number.isFinite(options.durationSec)
      ? Math.round(options.durationSec * fps)
      : (config.scenes || []).reduce((s, x) => s + (Number(x.durationInFrames) || 0), 0));

  const push = (severity, rule, message, where = '') => {
    issues.push({ severity, rule, message, where });
  };

  if (config.schemaVersion !== 1) {
    push('error', 'schema', 'schemaVersion 必须为 1');
  }

  for (let i = 0; i < (config.cues || []).length; i++) {
    const cue = config.cues[i];
    const where = `cues[${i}]`;
    if (isOff(cue, 'placeholder')) {
      // skip
    } else {
      for (const pat of rules.placeholderPatterns || []) {
        if (String(cue.text || '').includes(pat)) {
          push('error', 'placeholder', `疑似占位文案：含「${pat}」`, where);
        }
      }
    }
    if (!isOff(cue, 'shortCue') && cue.duration < rules.minCueDurationFrames) {
      push('warn', 'shortCue', `字幕过短 < ${rules.minCueDurationFrames} 帧`, where);
    }
    const end = cue.from + cue.duration;
    if (!isOff(cue, 'cueOverflow') && durationFrames > 0 && end > durationFrames + 1) {
      push('error', 'cueOverflow', `字幕越界：结束帧 ${end} > 片长 ${durationFrames}`, where);
    }
  }

  for (let i = 0; i < (config.scenes || []).length; i++) {
    const scene = config.scenes[i];
    if (
      !isOff(scene, 'shortScene') &&
      scene.durationInFrames < rules.minSceneDurationFrames
    ) {
      push(
        'warn',
        'shortScene',
        `镜头过短 < ${rules.minSceneDurationFrames} 帧`,
        `scenes[${i}]`,
      );
    }
  }

  const intentCount = {};
  for (let i = 0; i < (config.cards || []).length; i++) {
    const card = config.cards[i];
    const where = `cards[${i}]`;
    if (rules.requireWhitelistCards && card.cardId && !autoIds.has(card.cardId)) {
      if (!isOff(card, 'whitelist')) {
        push('error', 'whitelist', `cardId 不在 autoPick 白名单：${card.cardId}`, where);
      }
    }
    const intent = card.intent || '通用';
    intentCount[intent] = (intentCount[intent] || 0) + 1;
  }
  for (const [intent, count] of Object.entries(intentCount)) {
    if (count > rules.maxSameIntent) {
      push(
        'warn',
        'intentDensity',
        `intent「${intent}」出现 ${count} 次，超过 ${rules.maxSameIntent}`,
      );
    }
  }

  const audio = config.audio || {};
  if (Number(audio.voiceGain) > rules.maxVoiceGain) {
    push('warn', 'audioGain', `voiceGain 过高 > ${rules.maxVoiceGain}`);
  }
  if (Number(audio.sfxGain) > rules.maxSfxGain) {
    push('warn', 'audioGain', `sfxGain 过高 > ${rules.maxSfxGain}`);
  }
  if (Number(audio.bgmGain) > rules.maxBgmGain) {
    push('error', 'audioGain', `bgmGain 过高 > ${rules.maxBgmGain}（易压人声）`);
  }

  const errors = issues.filter((i) => i.severity === 'error');
  return {
    ok: errors.length === 0,
    durationFrames,
    issues,
    errorCount: errors.length,
    warnCount: issues.length - errors.length,
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    console.error('用法: node scripts/lint-episode.mjs <epNN.config.json> [--duration 秒]');
    process.exit(1);
  }
  const configPath = path.resolve(args.file);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const result = lintEpisode(config, {
    durationSec: Number.isFinite(args.duration) ? args.duration : undefined,
  });

  for (const issue of result.issues) {
    const loc = issue.where ? ` @ ${issue.where}` : '';
    console.log(`[${issue.severity}] ${issue.rule}${loc}: ${issue.message}`);
  }
  console.log(
    result.ok
      ? `ok: ${result.errorCount} errors, ${result.warnCount} warns, durationFrames=${result.durationFrames}`
      : `FAIL: ${result.errorCount} errors, ${result.warnCount} warns, durationFrames=${result.durationFrames}`,
  );
  process.exit(result.ok ? 0 : 2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
