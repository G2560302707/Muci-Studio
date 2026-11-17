#!/usr/bin/env node
/**
 * 从 talkcraft-main/catalog.json 生成编排白名单卡表。
 * 政策（2026-11-17）：
 * - video-talkcraft = 仅参考（PolyForm NC），永不 autoPick
 * - core = 全部 autoPick（可商用）
 * - snapcn / video-shotcraft / remocn = 可商用；按意图覆盖度挑满约 40–60 张 autoPick
 *
 * 用法：
 *   node scripts/build-orchestrator-cards.mjs
 *   node scripts/build-orchestrator-cards.mjs --check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = path.resolve(workbenchDir, '..');
const catalogPath = path.join(rootDir, 'talkcraft-main', 'catalog.json');
const outJson = path.join(
  rootDir,
  'custom-skills',
  'episode-fx-orchestrator',
  'cards.whitelist.json',
);
const outMd = path.join(
  rootDir,
  'custom-skills',
  'episode-fx-orchestrator',
  'CARDS.md',
);

const AUTOPICK_TARGET = 55;
const REFERENCE_ONLY = new Set(['video-talkcraft']);
const COMMERCIAL_LIBS = new Set(['core', 'snapcn', 'video-shotcraft', 'remocn']);

const INTENT_HINTS = [
  { intent: '开场', match: /开场|钩子|intro|opening|flash|crane|drone/i },
  { intent: '收尾', match: /收尾|outro|结尾|cta|关注/i },
  { intent: '对比', match: /对比|对照|vs|双栏|对句|versus/i },
  { intent: '计数', match: /计数|数字|number|roll|排名|rank|odometer/i },
  { intent: '列表', match: /列表|要点|bullet|步骤|列举|checklist|step/i },
  { intent: '字幕', match: /字幕|caption|subtitle|花字/i },
  { intent: '强调', match: /强调|标注|金句|高亮|mask|punch|quote/i },
  { intent: '数据', match: /数据|图表|信息图|柱|饼|环形|growth|stat|metric/i },
  { intent: '转场', match: /转场|过渡|wipe|transition/i },
  { intent: '素材', match: /素材|截图|窗口|screen|录屏|terminal/i },
  { intent: '运镜', match: /运镜|camera|focus|dolly|zoom|推拉|人物/i },
  { intent: '证据', match: /证据|proof|引用|截图核验|evidence/i },
];

function inferIntents(record) {
  const blob = [
    record.category,
    record.use,
    record.title,
    record.description,
    ...(record.keywords || []),
  ]
    .filter(Boolean)
    .join(' ');
  const hits = INTENT_HINTS.filter((h) => h.match.test(blob)).map((h) => h.intent);
  return hits.length ? [...new Set(hits)] : ['通用'];
}

function scoreForAutopick(record, intents) {
  let score = 0;
  if (record.library === 'core') score += 1000;
  if (record.library === 'snapcn') score += 80;
  if (record.library === 'video-shotcraft') score += 60;
  if (record.library === 'remocn') score += 40;
  const priority = ['开场', '收尾', '列表', '对比', '计数', '数据', '强调', '运镜', '证据', '字幕', '转场', '素材'];
  for (const intent of intents) {
    const idx = priority.indexOf(intent);
    if (idx >= 0) score += 30 - idx;
  }
  if (record.status === 'approved') score += 10;
  if (record.posterUrl) score += 5;
  return score;
}

function toCard(record, { commercial, autoPick }) {
  return {
    id: record.id,
    name: record.name,
    library: record.library,
    title: record.title || record.name,
    category: record.category || '',
    use: record.use || '',
    keywords: record.keywords || [],
    intents: inferIntents(record),
    sourcePath: record.sourcePath || '',
    aspect: record.aspect || 'both',
    themes: record.themes || ['whiteWindow', 'blackGold'],
    commercial,
    autoPick,
    status: record.status || 'approved',
    paramHints: commercial
      ? ['title', 'subtitle', 'items', 'caption', 'value', 'label']
      : ['title', 'text'],
  };
}

function build() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const records = catalog.records || [];

  // 白名单池：core + talkcraft(参考) + 可商用三库
  const pool = records.filter(
    (r) =>
      r.library === 'core' ||
      r.library === 'video-talkcraft' ||
      COMMERCIAL_LIBS.has(r.library),
  );

  const coreIds = new Set(
    pool.filter((r) => r.library === 'core').map((r) => r.id),
  );

  // 先锁定全部 core 为 autoPick
  const ranked = pool
    .filter((r) => COMMERCIAL_LIBS.has(r.library) && r.library !== 'core')
    .map((r) => {
      const intents = inferIntents(r);
      return { r, intents, score: scoreForAutopick(r, intents) };
    })
    .sort((a, b) => b.score - a.score);

  const autoPickIds = new Set(coreIds);
  const intentCover = new Map();
  for (const id of coreIds) {
    const rec = pool.find((x) => x.id === id);
    for (const intent of inferIntents(rec || {})) {
      intentCover.set(intent, (intentCover.get(intent) || 0) + 1);
    }
  }

  for (const row of ranked) {
    if (autoPickIds.size >= AUTOPICK_TARGET) break;
    // 意图配额：同一 intent 最多 8 张（避免全是字幕）
    const heavy = row.intents.filter((i) => (intentCover.get(i) || 0) >= 8);
    if (heavy.length && heavy.length === row.intents.length) continue;
    autoPickIds.add(row.r.id);
    for (const intent of row.intents) {
      intentCover.set(intent, (intentCover.get(intent) || 0) + 1);
    }
  }

  const cards = pool
    .map((r) => {
      const referenceOnly = REFERENCE_ONLY.has(r.library);
      const commercial = !referenceOnly && COMMERCIAL_LIBS.has(r.library);
      const autoPick = commercial && autoPickIds.has(r.id);
      return toCard(r, { commercial, autoPick });
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const autoPick = cards.filter((c) => c.autoPick);
  const payload = {
    generatedAt: new Date().toISOString().slice(0, 10),
    source: 'talkcraft-main/catalog.json',
    policy:
      'autoPick：全部 core + 可商用 snapcn/shotcraft/remocn 精选至约 55 张。video-talkcraft 仅参考（PolyForm NC），禁止自动编排进正式成片。非 core 的 autoPick 在 Remotion 装配层先走白窗参数壳，动效升级另立项。',
    stats: {
      total: cards.length,
      autoPick: autoPick.length,
      referenceOnly: cards.filter((c) => !c.commercial).length,
      byLibrary: cards.reduce((acc, c) => {
        acc[c.library] = (acc[c.library] || 0) + 1;
        return acc;
      }, {}),
      autoPickByLibrary: autoPick.reduce((acc, c) => {
        acc[c.library] = (acc[c.library] || 0) + 1;
        return acc;
      }, {}),
    },
    cards,
  };

  const mdLines = [
    '# 编排卡片库（自动生成）',
    '',
    `生成日期：${payload.generatedAt}`,
    '',
    payload.policy,
    '',
    `合计 ${payload.stats.total} · 可自动选 ${payload.stats.autoPick} · 仅参考 ${payload.stats.referenceOnly}`,
    '',
    '## 可自动选（commercial / autoPick）',
    '',
    '| id | intents | use |',
    '|---|---|---|',
    ...autoPick.map(
      (c) =>
        `| \`${c.id}\` | ${c.intents.join(' / ')} | ${(c.use || c.title).replace(/\|/g, '/').slice(0, 80)} |`,
    ),
    '',
    '## 仅参考（不可 autoPick）',
    '',
    `共 ${payload.stats.referenceOnly} 张（主要为 video-talkcraft）。详见 cards.whitelist.json。`,
    '',
  ];

  return { payload, md: mdLines.join('\n'), autoPickCount: autoPick.length };
}

function write() {
  const { payload, md, autoPickCount } = build();
  fs.writeFileSync(outJson, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(outMd, `${md}\n`, 'utf8');
  console.log(
    `[orchestrator-cards] wrote ${payload.stats.total} cards, autoPick=${autoPickCount} → ${path.relative(rootDir, outJson)}`,
  );
  console.log('[orchestrator-cards] autoPickByLibrary', payload.stats.autoPickByLibrary);
}

function check() {
  const { payload } = build();
  if (!fs.existsSync(outJson)) {
    console.error('[orchestrator-cards] missing whitelist; run without --check');
    process.exit(1);
  }
  const existing = JSON.parse(fs.readFileSync(outJson, 'utf8'));
  const a = existing.stats?.autoPick;
  const b = payload.stats.autoPick;
  if (a !== b) {
    console.error(`[orchestrator-cards] stale: file autoPick=${a}, rebuild=${b}`);
    process.exit(1);
  }
  console.log('[orchestrator-cards] check OK');
}

if (process.argv.includes('--check')) check();
else write();
