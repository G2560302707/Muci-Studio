import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = path.resolve(workbenchDir, '..');
const outputDir = path.join(workbenchDir, 'data');
const outputPath = path.join(outputDir, 'catalog.json');

function toUrl(filePath) {
  return `/${filePath.split(path.sep).map(encodeURIComponent).join('/')}`;
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// 英文术语 → 中文(类别与结构化 tag 共用)
const zhMap = readJson(path.join(workbenchDir, 'data', 'zh-map.json'));
const zh = value => zhMap[value] || value;

// 复用能力分类:人工维护,不自动推断
const reuseClasses = readJson(path.join(workbenchDir, 'data', 'reuse-classes.json'));
const reuseClassOf = record =>
  reuseClasses.records?.[record.id] || reuseClasses.defaults?.[record.library] || null;

const NOISE_TOKENS = new Set([
  'in', 'to', 'up', 'out', 'on', 'off', 'of', 'a', 'an', 'the', 'and', 'or', 'for', 'with', 'from', 'by',
]);

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function unique(values) {
  return [...new Set(
    values.flatMap(value => String(value || '').split(/[、,，/]/))
      .map(value => value.trim().replace(/[。．、,，;；/]+$/g, ''))
      .filter(Boolean),
  )];
}

function hasCjk(value) {
  return /[\u4e00-\u9fff]/.test(value);
}

function chineseKeywordsFromName(name, libraryTag) {
  const tokens = String(name || '')
    .split('-')
    .map(token => token.trim().toLowerCase())
    .filter(token => token.length > 1 && !NOISE_TOKENS.has(token));
  const mapped = tokens.map(token => zhMap[token]).filter(Boolean);
  const zhOnly = unique([...mapped, libraryTag]).filter(hasCjk);
  return zhOnly.length ? zhOnly : unique([libraryTag]).filter(Boolean);
}

function formatDuration(frames, fps = 30) {
  const safeFps = Number(fps) > 0 ? Number(fps) : 30;
  const safeFrames = Math.max(0, Number(frames) || 0);
  const seconds = safeFrames / safeFps;
  const rounded = seconds >= 10 ? seconds.toFixed(1) : seconds.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return `约 ${rounded}s（${safeFrames}f@${safeFps}fps）`;
}

function energyFromSeconds(seconds) {
  if (!(seconds > 0)) return '中';
  if (seconds <= 2) return '低';
  if (seconds <= 4) return '中';
  return '高';
}

function timingFromFrames(frames, fps = 30) {
  const safeFps = Number(fps) > 0 ? Number(fps) : 30;
  const safeFrames = Math.max(0, Number(frames) || 0);
  const seconds = safeFrames / safeFps;
  return {
    duration: formatDuration(safeFrames, safeFps),
    energy: energyFromSeconds(seconds),
  };
}

function parseFrontmatter(relativePath) {
  const file = path.join(rootDir, relativePath);
  if (!fs.existsSync(file)) return {};
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const result = {};
  let inFrontmatter = false;
  for (const line of lines) {
    if (line.trim() === '---') {
      if (inFrontmatter) break;
      inFrontmatter = true;
      continue;
    }
    if (!inFrontmatter) continue;
    const match = line.match(/^([^:：]+)[:：]\s*(.*)$/);
    if (match) result[match[1].trim()] = match[2].trim();
  }
  return result;
}

// remocn previewManifest: "name": { durationInFrames, fps, ... }
function loadRemocnTimingMap() {
  const manifestPath = path.join(
    rootDir,
    'archive',
    'reference-distill',
    'components',
    'remocn-main',
    'registry',
    '__manifest__.ts',
  );
  const map = new Map();
  if (!fs.existsSync(manifestPath)) return map;
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const blockRegex = /["']([^"']+)["']\s*:\s*\{([\s\S]*?)\n\s*\},?/g;
  let match;
  while ((match = blockRegex.exec(raw)) !== null) {
    const name = match[1];
    const body = match[2];
    const frames = Number((body.match(/durationInFrames:\s*(\d+)/) || [])[1]);
    const fps = Number((body.match(/fps:\s*(\d+)/) || [])[1]) || 30;
    if (frames > 0) map.set(name, { frames, fps });
  }
  return map;
}

function loadSnapcnTiming(name) {
  const candidates = [
    path.join(rootDir, 'talkcraft-main', 'external', 'snapcn', name, 'config.ts'),
    path.join(rootDir, 'archive', 'reference-distill', 'components', 'snapcn-main', 'registry', 'snap-cn', name, 'config.ts'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    const frames = Number((raw.match(/durationInFrames:\s*(\d+)/) || [])[1]);
    const fps = Number((raw.match(/fps:\s*(\d+)/) || raw.match(/const\s+FPS\s*=\s*(\d+)/) || [])[1]) || 30;
    if (frames > 0) return { frames, fps };
  }
  return null;
}

function loadCoreTimingMap() {
  const previewsPath = path.join(rootDir, 'muci-engine', 'components', 'src', 'components', 'previews.tsx');
  const map = new Map();
  if (!fs.existsSync(previewsPath)) return map;
  const raw = fs.readFileSync(previewsPath, 'utf8');
  const rowRegex = /\{\s*name:\s*"([^"]+)"\s*,\s*durationInFrames:\s*(\d+)/g;
  let match;
  while ((match = rowRegex.exec(raw)) !== null) {
    map.set(match[1], { frames: Number(match[2]), fps: 30 });
  }
  return map;
}

const remocnTiming = loadRemocnTimingMap();
const myTiming = loadCoreTimingMap();

/**
 * 白窗紫套件：物理在 muci-engine/components，
 * 真源在 talkcraft-main/core。工作台归入 Talkcraft，不再单独显示「主库」。
 */
function buildCoreKit() {
  const engineComp = path.join('muci-engine', 'components');
  const libraryDir = path.join(rootDir, engineComp, 'library');
  if (!fs.existsSync(libraryDir)) return [];
  return fs.readdirSync(libraryDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const name = entry.name;
      const libraryMeta = readJson(path.join(libraryDir, name, 'meta.json'));
      const componentMetaPath = path.join(rootDir, engineComp, 'src', 'components', 'meta', `${name}.json`);
      const componentMeta = fs.existsSync(componentMetaPath) ? readJson(componentMetaPath) : {};
      const previewRelative = libraryMeta.previewPath;
      const timing = myTiming.get(name);
      const filled = timing ? timingFromFrames(timing.frames, timing.fps) : timingFromFrames(90, 30);
      const masterSource = toPosix(path.join('talkcraft-main', 'core', 'components', `${name}.tsx`));
      const renderSource = toPosix(path.join(engineComp, libraryMeta.sourcePath || `src/components/${name}.tsx`));
      const sourcePath = exists(masterSource) ? masterSource : renderSource;
      const previewDisk = previewRelative ? path.join(engineComp, previewRelative) : null;
      return {
        id: `core:${name}`,
        library: 'core',
        libraryLabel: 'Talkcraft',
        name,
        title: name,
        description: libraryMeta.description || componentMeta.description || '',
        use: componentMeta.usage || '',
        category: '白窗紫套件',
        keywords: unique([
          '白窗紫',
          ...(componentMeta.relations || []),
          ...(componentMeta.usage ? componentMeta.usage.split(/[；;]/) : []),
        ]).filter(hasCjk),
        energy: filled.energy,
        duration: filled.duration,
        previewType: previewDisk && exists(previewDisk) ? 'video' : 'missing',
        previewUrl: previewDisk ? toUrl(previewDisk) : null,
        posterUrl: null,
        sourcePath,
        codePath: sourcePath,
        license: 'MIT',
      };
    });
}

function buildTalkcraft() {
  const base = path.join('talkcraft-main');
  const indexPath = path.join(rootDir, base, 'references', 'cards-index.json');
  const index = readJson(indexPath);
  return index.cards.map(card => {
    const cardPath = path.join(base, 'references', 'cards', `${card.slug}.md`);
    const frontmatter = parseFrontmatter(cardPath);
    const demoRelative = path.join(base, 'demos', card.slug, 'index.html');
    const hasDemo = exists(demoRelative);
    return {
      id: `video-talkcraft:${card.slug}`,
      library: 'video-talkcraft',
      libraryLabel: 'Talkcraft',
      name: card.slug,
      title: card.title || card.slug,
      description: card.oneliner || '',
      use: frontmatter['适用'] || '',
      category: card.category || '',
      keywords: unique([
        ...(card.semantics || []),
        ...(card.inputs || []).map(input => input.type),
        ...(card.material_shape || []),
        card.category,
      ]).filter(value => hasCjk(value) || zhMap[value]),
      energy: card.energy || '',
      duration: frontmatter['时长'] || '',
      previewType: hasDemo ? 'iframe' : 'missing',
      previewUrl: hasDemo ? toUrl(demoRelative) : null,
      posterUrl: null,
      sourcePath: toPosix(cardPath),
      codePath: toPosix(path.join(base, card.code || '')),
      license: 'MIT',
    };
  }).map(record => {
    // talkcraft 关键词尽量中文;英文 type 走 zh-map
    const keywords = unique(record.keywords.map(token => (hasCjk(token) ? token : zh(token)))).filter(hasCjk);
    return {
      ...record,
      keywords: keywords.length ? keywords : unique([record.category]).filter(hasCjk),
    };
  });
}

function buildShotcraft() {
  const base = path.join('talkcraft-main', 'external', 'shotcraft');
  const library = readJson(path.join(rootDir, base, 'gallery', 'api', 'library.json'));
  const records = [];
  for (const card of library.cards) {
    for (const style of card.styles || []) {
      const posterRelative = path.join(base, 'gallery', 'media', 'poster', `${style.key}.jpg`);
      const hasPoster = exists(posterRelative);
      const videoRelative = path.join('motion-workbench', 'data', 'media', 'shotcraft', `${style.key}.mp4`);
      const hasVideo = exists(videoRelative);
      records.push({
        id: `video-shotcraft:${card.name}/${style.key}`,
        library: 'video-shotcraft',
        libraryLabel: 'Shotcraft',
        name: style.key,
        title: style.label || style.key,
        description: style.description || card.summary || '',
        use: style.use || card.use || '',
        category: zh(card.category || ''),
        keywords: unique([...(card.tags || []).map(zh), ...(style.use || '').split(/[；;]/)]).filter(hasCjk),
        energy: card.energy || '',
        duration: card.duration || '',
        previewType: hasVideo ? 'video' : hasPoster ? 'poster' : 'missing',
        previewUrl: hasVideo ? toUrl(videoRelative) : hasPoster ? toUrl(posterRelative) : null,
        posterUrl: hasPoster ? toUrl(posterRelative) : null,
        sourcePath: toPosix(path.join(base, card.source || '')),
        codePath: toPosix(path.join(base, 'gallery', 'source', `${card.name}.md`)),
        license: 'MIT',
      });
    }
  }
  return records;
}

function buildRemocn() {
  const base = path.join('talkcraft-main', 'external', 'remocn');
  const artifactsDir = path.join(rootDir, base, 'registry-artifacts');
  const subRegistryLabels = {
    remocn: 'Remocn 组件',
    'remocn-ui': 'Remocn UI',
    'remocn-icons': '图标',
    'remocn-templates': '模板',
  };
  return fs.readdirSync(artifactsDir)
    .filter(file => file.endsWith('.json') && file !== 'registry.json')
    .map(file => {
      try {
        return JSON.parse(fs.readFileSync(path.join(artifactsDir, file), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(artifact => artifact && artifact.name && Array.isArray(artifact.files) && artifact.files.length)
    .map(artifact => {
      const name = artifact.name;
      const tsxRelative = toPosix(path.join(base, `${name}.tsx`));
      const tsRelative = toPosix(path.join(base, `${name}.ts`));
      const sourceRelative = exists(tsxRelative) ? tsxRelative : tsRelative;
      const subRegistry = artifact.files[0]?.path.split('/')[1] || 'remocn';
      const category = subRegistryLabels[subRegistry] || 'Remocn 组件';
      const timing = remocnTiming.get(name);
      const filled = timing ? timingFromFrames(timing.frames, timing.fps) : timingFromFrames(120, 30);
      return {
        id: `remocn:${name}`,
        library: 'remocn',
        libraryLabel: 'Remocn',
        name,
        title: artifact.title || name,
        description: artifact.description || '',
        use: '',
        category,
        keywords: chineseKeywordsFromName(name, category.includes('图标') ? '图标' : '动效'),
        energy: filled.energy,
        duration: filled.duration,
        previewType: 'missing',
        previewUrl: null,
        posterUrl: null,
        sourcePath: sourceRelative,
        codePath: sourceRelative,
        license: 'MIT',
      };
    });
}

function buildSnapcn() {
  const base = path.join('talkcraft-main', 'external', 'snapcn');
  const registry = readJson(path.join(rootDir, base, 'registry.json'));
  return (registry.items || [])
    .filter(item => item.name)
    .map(item => {
      const entry = (item.files || []).find(file => file.path.endsWith('index.tsx')) || (item.files || [])[0];
      const sourceRelative = entry
        ? toPosix(path.join(base, entry.path))
        : toPosix(path.join(base, item.name, 'index.tsx'));
      const timing = loadSnapcnTiming(item.name);
      const filled = timing ? timingFromFrames(timing.frames, timing.fps) : timingFromFrames(90, 30);
      return {
        id: `snapcn:${item.name}`,
        library: 'snapcn',
        libraryLabel: 'Snapcn',
        name: item.name,
        title: item.title || item.name,
        description: item.description || '',
        use: item.docs || '',
        category: 'Snapcn 组件',
        keywords: chineseKeywordsFromName(item.name, '动效'),
        energy: filled.energy,
        duration: filled.duration,
        previewType: 'missing',
        previewUrl: null,
        posterUrl: null,
        sourcePath: sourceRelative,
        codePath: sourceRelative,
        license: 'MIT',
      };
    });
}

// 已按需渲染的预览(data/preview-overrides.json 由渲染 API 维护)合并进索引
const previewOverrides = fs.existsSync(path.join(workbenchDir, 'data', 'preview-overrides.json'))
  ? readJson(path.join(workbenchDir, 'data', 'preview-overrides.json'))
  : {};

const records = [
  ...buildCoreKit(),
  ...buildTalkcraft(),
  ...buildShotcraft(),
  ...buildRemocn(),
  ...buildSnapcn(),
]
  .map(record => ({
    ...record,
    reuseClass: reuseClassOf(record),
    ...(previewOverrides[record.id] || {}),
  }))
  .sort((left, right) => left.id.localeCompare(right.id));

const catalog = {
  generatedAt: new Date().toISOString(),
  stats: {
    total: records.length,
    core: records.filter(record => record.library === 'core').length,
    talkcraft: records.filter(record => record.library === 'video-talkcraft').length,
    shotcraft: records.filter(record => record.library === 'video-shotcraft').length,
    remocn: records.filter(record => record.library === 'remocn').length,
    snapcn: records.filter(record => record.library === 'snapcn').length,
    missingPreviews: records.filter(record => record.previewType === 'missing').length,
  },
  records,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

const missingSources = records
  .filter(record => record.sourcePath && !exists(record.sourcePath))
  .map(record => `${record.id}: ${record.sourcePath}`);
if (missingSources.length) {
  console.error(`Catalog source paths missing (${missingSources.length}):`);
  console.error(missingSources.slice(0, 20).join('\n'));
  if (missingSources.length > 20) console.error(`... and ${missingSources.length - 20} more`);
  process.exitCode = 1;
}

const emptyEnergy = records.filter(record => !record.energy).length;
const emptyDuration = records.filter(record => !record.duration).length;
const nonMit = records.filter(record => record.license !== 'MIT').length;
const remocnLatinOnly = records.filter(record =>
  record.library === 'remocn'
  && record.keywords.every(keyword => !hasCjk(keyword))).length;

console.log(`Catalog written: ${path.relative(rootDir, outputPath)}`);
console.log(JSON.stringify(catalog.stats, null, 2));
console.log(JSON.stringify({
  emptyEnergy,
  emptyDuration,
  nonMit,
  remocnLatinOnly,
  remocnTimingHits: remocnTiming.size,
  myTimingHits: myTiming.size,
}, null, 2));

const expectedPath = path.join(workbenchDir, 'data', 'expected-counts.json');
if (fs.existsSync(expectedPath)) {
  const expected = readJson(expectedPath);
  const actual = { ...catalog.stats };
  delete actual.total;
  delete actual.missingPreviews;
  const mismatch = Object.keys(expected).filter(library => expected[library] !== actual[library]);
  if (mismatch.length) {
    const detail = mismatch.map(library => `${library}: ${actual[library]} !== ${expected[library]}`);
    console.error(`Catalog count mismatch: ${detail.join(', ')}`);
    process.exitCode = 1;
  }
} else {
  console.warn('未设置 data/expected-counts.json,跳过数量校验');
}
