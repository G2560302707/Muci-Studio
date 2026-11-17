// 批量静帧 poster 渲染(2026-11-15):给主库 catalog 补齐每条一张静帧,选料时 AI 可「静帧 + 标签」双读。
// 产物统一落 talkcraft-main/gallery/posters/<library>/<name>.jpg(talkcraft 沿用现成 thumbs png,仅复制)。
// 分层策略,贵的只花在没有现成物料的地方:
//   video-talkcraft 108 → gallery/thumbs 现成缩略图直接复制
//   video-shotcraft 150 / core 13 → 现成 mp4 用 ffmpeg 抽 60% 处一帧
//   snapcn 61 → 全库一个 bundle(复用 preview-renderer)逐 Composition renderStill
//   remocn ~919 → 每 40 个合一个 chunk bundle,失败二分到单组件;逐个 renderStill
// 可断点续跑:已存在的 poster 跳过。汇总写 data/poster-run-summary.json。
// 用法:node scripts/render-posters.mjs [--only=copy|ffmpeg|snapcn|remocn] [--limit=N]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = path.resolve(workbenchDir, '..');
const talkcraftMain = path.join(rootDir, 'talkcraft-main');
const postersDir = path.join(talkcraftMain, 'gallery', 'posters');
const mediaDir = path.join(workbenchDir, 'data', 'media');
const summaryPath = path.join(workbenchDir, 'data', 'poster-run-summary.json');

const runtimeRequire = createRequire(path.join(workbenchDir, 'preview-runtime', 'package.json'));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const remocnMain = path.join(rootDir, 'archive', 'reference-distill', 'components', 'remocn-main');
const snapcnMain = path.join(rootDir, 'archive', 'reference-distill', 'components', 'snapcn-main');

const JPEG_QUALITY = 82;
const STILL_SCALE_CAP = 960; // 最长边目标宽度,和浏览样片一个量级
const FRAME_RATIO = 0.6;     // 取 60% 时长处:入场动画已完成、还没进循环收尾
const REMOCN_CHUNK = 40;
const STILL_POOL = 1;        // 串行:首轮 3 并发把 Chrome 压出 ERR_INSUFFICIENT_RESOURCES 后整场挂死
const STILL_TIMEOUT_MS = 100_000;  // 单张超时:字体/图片网络挂起时记失败继续,不拖死全场
const COMPS_TIMEOUT_MS = 120_000;  // getCompositions 超时

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} 超时(${Math.round(ms / 1000)}s),疑似网络挂起`)), ms)
    ),
  ]);
}

const args = process.argv.slice(2);
const only = (args.find(a => a.startsWith('--only=')) || '').split('=')[1] || null;
const limit = Number((args.find(a => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;

const failures = [];
const counts = {};

function log(msg) {
  console.log(`[posters ${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

function pascal(name) {
  return name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

function posterPath(library, name) {
  return path.join(postersDir, library, `${name}.jpg`);
}

function hasPoster(library, name) {
  return ['.jpg', '.png'].some(ext => {
    const p = path.join(postersDir, library, `${name}${ext}`);
    return fs.existsSync(p) && fs.statSync(p).size > 0;
  });
}

function recordFailure(library, name, error) {
  const message = String(error && error.message || error).slice(0, 300);
  failures.push({ library, name, error: message });
  log(`失败 ${library}/${name}: ${message.split('\n')[0]}`);
}

async function mapPool(items, size, fn) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(size, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await fn(item);
    }
  });
  await Promise.all(workers);
}

// ── catalog 记录按库分组 ────────────────────────────────────────────────────
const catalog = JSON.parse(fs.readFileSync(path.join(talkcraftMain, 'catalog.json'), 'utf8'));
const byLibrary = {};
for (const rec of catalog.records) {
  (byLibrary[rec.library] ||= []).push(rec);
}

// ── Phase 1: talkcraft 缩略图复制 ──────────────────────────────────────────
async function phaseCopyTalkcraft() {
  const recs = (byLibrary['video-talkcraft'] || []).slice(0, limit);
  for (const rec of recs) {
    if (hasPoster('video-talkcraft', rec.name)) continue;
    const src = path.join(talkcraftMain, 'gallery', 'thumbs', `${rec.name}.png`);
    if (!fs.existsSync(src)) {
      recordFailure('video-talkcraft', rec.name, `thumbs 缺图:${src}`);
      continue;
    }
    const dest = path.join(postersDir, 'video-talkcraft', `${rec.name}.png`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    counts['video-talkcraft'] = (counts['video-talkcraft'] || 0) + 1;
  }
  log(`talkcraft 复制完成,本轮 ${counts['video-talkcraft'] || 0} 张`);
}

// ── Phase 2: ffmpeg 从现成 mp4 抽帧(shotcraft / core) ─────────────────────
async function extractFrame(mp4Path, outPath) {
  let duration = 0;
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', mp4Path,
    ]);
    duration = Number(JSON.parse(stdout).format?.duration || 0);
  } catch {
    duration = 0;
  }
  const seek = duration > 0 ? Math.min(duration * FRAME_RATIO, Math.max(0, duration - 0.2)) : 0;
  await execFileAsync('ffmpeg', [
    '-y', '-ss', seek.toFixed(2), '-i', mp4Path, '-frames:v', '1',
    '-vf', "scale='min(960,iw)':-2", '-q:v', '4', outPath,
  ]);
}

async function phaseFfmpeg() {
  // shotcraft:data/media/shotcraft/<name>.mp4(README 表:本地样片)
  const shotcraft = (byLibrary['video-shotcraft'] || []).slice(0, limit);
  for (const rec of shotcraft) {
    if (hasPoster('video-shotcraft', rec.name)) continue;
    const mp4 = path.join(mediaDir, 'shotcraft', `${rec.name}.mp4`);
    const out = posterPath('video-shotcraft', rec.name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    try {
      if (!fs.existsSync(mp4)) throw new Error(`样片缺失:${mp4}`);
      await extractFrame(mp4, out);
      counts['video-shotcraft'] = (counts['video-shotcraft'] || 0) + 1;
    } catch (e) {
      recordFailure('video-shotcraft', rec.name, e);
    }
  }
  log(`shotcraft 抽帧完成,本轮 ${counts['video-shotcraft'] || 0} 张`);

  // core:previewPath(相对 talkcraft-main)指向渲染工作区现成 mp4
  const core = (byLibrary['core'] || []).slice(0, limit);
  for (const rec of core) {
    if (hasPoster('core', rec.name)) continue;
    const out = posterPath('core', rec.name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    try {
      let mp4 = rec.previewPath ? path.resolve(talkcraftMain, rec.previewPath) : null;
      if (!mp4 || !fs.existsSync(mp4)) {
        mp4 = path.join(rootDir, 'muci-engine', 'components', 'out', 'previews', `${rec.name}.mp4`);
      }
      if (!fs.existsSync(mp4)) throw new Error(`core 无现成 mp4:${rec.name}`);
      await extractFrame(mp4, out);
      counts['core'] = (counts['core'] || 0) + 1;
    } catch (e) {
      recordFailure('core', rec.name, e);
    }
  }
  log(`core 抽帧完成,本轮 ${counts['core'] || 0} 张`);
}

// ── 公共:对一张 composition renderStill ────────────────────────────────────
async function stillOne({ serveUrl, composition, outPath }) {
  const { renderStill } = runtimeRequire('@remotion/renderer');
  const width = composition.width || composition.compositionWidth || 1280;
  await withTimeout(renderStill({
    composition,
    serveUrl,
    output: outPath,
    frame: Math.max(0, Math.round((composition.durationInFrames || 30) * FRAME_RATIO)),
    imageFormat: 'jpeg',
    jpegQuality: JPEG_QUALITY,
    scale: Math.min(1, STILL_SCALE_CAP / width),
    browserExecutable: CHROME,
    overwrite: true,
  }), STILL_TIMEOUT_MS, `renderStill ${outPath}`);
}

// ── Phase 3: snapcn 全库一个 bundle ────────────────────────────────────────
async function phaseSnapcn() {
  const { bundleSnapcn } = await import('./preview-renderer.mjs');
  const { getCompositions } = runtimeRequire('@remotion/renderer');
  const recs = (byLibrary['snapcn'] || []).slice(0, limit).filter(r => !hasPoster('snapcn', r.name));
  if (!recs.length) return log('snapcn 无待渲染');
  log(`snapcn 打 bundle(${recs.length} 条待渲)…`);
  const serveUrl = await bundleSnapcn();
  const comps = await getCompositions({ serveUrl, browserExecutable: CHROME });
  const compById = new Map(comps.map(c => [c.id, c]));
  await mapPool(recs, STILL_POOL, async rec => {
    const comp = compById.get(rec.name);
    const out = posterPath('snapcn', rec.name);
    if (!comp) return recordFailure('snapcn', rec.name, 'bundle 里无此 Composition');
    try {
      await stillOne({ serveUrl, composition: comp, name: rec.name, outPath: out });
      counts.snapcn = (counts.snapcn || 0) + 1;
      if (counts.snapcn % 10 === 0) log(`snapcn ${counts.snapcn}/${recs.length}`);
    } catch (e) {
      recordFailure('snapcn', rec.name, e);
    }
  });
  log(`snapcn 完成,本轮 ${counts.snapcn || 0} 张`);
}

// ── Phase 4: remocn 分块 bundle + 二分兜底 ─────────────────────────────────
function remocnComponentPath(name, manifestEntry) {
  let sub = 'remocn';
  const artifactPath = path.join(remocnMain, 'registry-artifacts', `${name}.json`);
  if (fs.existsSync(artifactPath)) {
    try {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      sub = artifact.files?.[0]?.path.split('/')[1] || 'remocn';
    } catch { /* 保持默认 */ }
  }
  const component = path.join(remocnMain, 'registry', sub, name, 'index.tsx');
  return fs.existsSync(component) ? component : null;
}

function remocnChunkEntry(names, manifest) {
  const imports = [];
  const defs = [];
  names.forEach((name, i) => {
    const m = manifest[name];
    const component = remocnComponentPath(name, m);
    if (!component) throw new Error(`remocn 组件源码不存在:${name}`);
    imports.push(`import * as Mod${i} from ${JSON.stringify(component)};`);
    defs.push(`  {
    id: ${JSON.stringify(name)},
    Component: Mod${i}[${JSON.stringify(pascal(name))}] || Mod${i}.default,
    defaults: ${JSON.stringify(m.defaults ?? {})},
    backdrop: ${JSON.stringify(m.previewBackdrop ?? null)},
    durationInFrames: ${m.durationInFrames}, fps: ${m.fps},
    width: ${m.compositionWidth}, height: ${m.compositionHeight},
  }`);
  });
  return `
import { AbsoluteFill, Composition, Img, registerRoot } from "remotion";
${imports.join('\n')}

const DEFS = [
${defs.join(',\n')}
];

function Backdrop({ backdrop }) {
  if (!backdrop) return null;
  if (backdrop.type === "image") {
    return (
      <AbsoluteFill>
        <Img src={backdrop.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    );
  }
  if (backdrop.type === "color") {
    return <AbsoluteFill style={{ backgroundColor: backdrop.value }} />;
  }
  return null;
}

// 与 preview-renderer 同款居中舞台:浅色组件不至黑底发灰
function Stage({ Component, backdrop, ...props }) {
  return (
    <AbsoluteFill
      style={{ backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Backdrop backdrop={backdrop} />
      <Component {...props} />
    </AbsoluteFill>
  );
}

registerRoot(() => (
  DEFS.map(({ id, Component, defaults, backdrop, durationInFrames, fps, width, height }) => (
    <Composition
      key={id}
      id={id}
      component={(p) => <Stage Component={Component} backdrop={backdrop} {...p} />}
      durationInFrames={durationInFrames}
      fps={fps}
      width={width}
      height={height}
      defaultProps={defaults}
    />
  ))
));
`;
}

async function bundleRemocnChunk(names, manifest) {
  const { buildWebpackOverride, tsconfigAliases, loadTailwindOverride, REMOCN_EXTRA_ALIASES, writeTempEntry } =
    await import('./preview-renderer.mjs');
  const { bundle } = runtimeRequire('@remotion/bundler');
  const entryPath = writeTempEntry(`remocn-posters-${names.length}-${Date.now()}.tsx`, remocnChunkEntry(names, manifest));
  const nodeModules = path.join(workbenchDir, 'preview-runtime', 'node_modules');
  const googleFontsDir = path.join(nodeModules, '@remotion', 'google-fonts');
  const base = buildWebpackOverride(remocnMain, [
    ...tsconfigAliases(remocnMain),
    ...Object.entries(REMOCN_EXTRA_ALIASES).map(([from, to]) => [from, path.join(remocnMain, to)]),
  ]);
  const enableTailwind = loadTailwindOverride();
  return bundle({
    entryPoint: entryPath,
    browserExecutable: CHROME,
    webpackOverride: (config) => {
      // 字体 gstatic 重写与 preview-renderer 保持一致
      const withFonts = {
        ...config,
        module: {
          ...config.module,
          rules: [
            ...(config.module?.rules ?? []),
            {
              test: /\.(js|mjs|cjs)$/,
              include: googleFontsDir,
              use: [{ loader: path.join(workbenchDir, 'scripts', 'font-cdn-rewrite.cjs') }],
            },
          ],
        },
      };
      return enableTailwind ? enableTailwind(base(withFonts)) : base(withFonts);
    },
  });
}

async function renderRemocnNames(names, manifest) {
  if (!names.length) return;
  try {
    const serveUrl = await bundleRemocnChunk(names, manifest);
    const { getCompositions } = runtimeRequire('@remotion/renderer');
    const comps = await withTimeout(
      getCompositions({ serveUrl, browserExecutable: CHROME }),
      COMPS_TIMEOUT_MS,
      'getCompositions'
    );
    const compById = new Map(comps.map(c => [c.id, c]));
    await mapPool(names, STILL_POOL, async name => {
      const out = posterPath('remocn', name);
      const comp = compById.get(name);
      if (!comp) return recordFailure('remocn', name, 'chunk bundle 无此 Composition');
      try {
        await stillOne({ serveUrl, composition: comp, name, outPath: out });
        counts.remocn = (counts.remocn || 0) + 1;
        if (counts.remocn % 25 === 0) log(`remocn ${counts.remocn} 张…`);
      } catch (e) {
        recordFailure('remocn', name, e);
      }
    });
  } catch (e) {
    // bundle 失败:二分定位坏组件,单组件仍失败才记 failure
    if (names.length === 1) {
      recordFailure('remocn', names[0], e);
      return;
    }
    const mid = Math.ceil(names.length / 2);
    log(`chunk(${names.length}) bundle 失败,二分:${names[0]}…${names[names.length - 1]}`);
    await renderRemocnNames(names.slice(0, mid), manifest);
    await renderRemocnNames(names.slice(mid), manifest);
  }
}

// remocn 部分组件引用 http://localhost:3001/public/... 演示图片,渲染期间把参考库 public 起在 3001
function startRemocnAssetServer() {
  const server = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '');
      const fp = path.join(remocnMain, urlPath);
      if (!fp.startsWith(remocnMain) || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
        res.statusCode = 404;
        return res.end();
      }
      const extTypes = { '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
      res.setHeader('Content-Type', extTypes[path.extname(fp).toLowerCase()] || 'application/octet-stream');
      fs.createReadStream(fp).pipe(res);
    } catch {
      res.statusCode = 500;
      res.end();
    }
  });
  return new Promise(resolve => {
    server.once('error', () => resolve(null)); // 端口被占就算了,已起的服务照用
    server.listen(3001, '127.0.0.1', () => resolve(server));
  });
}

async function phaseRemocn() {
  const { loadRemocnManifest } = await import('./preview-renderer.mjs');
  const manifest = await loadRemocnManifest();
  const wanted = (byLibrary['remocn'] || [])
    .filter(r => manifest[r.name])
    .filter(r => !hasPoster('remocn', r.name))
    .slice(0, limit)
    .map(r => r.name);
  log(`remocn 待渲 ${wanted.length} 条,每 ${REMOCN_CHUNK} 个一块`);
  const assetServer = await startRemocnAssetServer();
  try {
    for (let i = 0; i < wanted.length; i += REMOCN_CHUNK) {
      const chunk = wanted.slice(i, i + REMOCN_CHUNK);
      log(`remocn chunk ${Math.floor(i / REMOCN_CHUNK) + 1}/${Math.ceil(wanted.length / REMOCN_CHUNK)}(${chunk.length} 条)`);
      await renderRemocnNames(chunk, manifest);
    }
  } finally {
    assetServer?.close();
  }
}

// ── main ───────────────────────────────────────────────────────────────────
const phases = [
  ['copy', phaseCopyTalkcraft],
  ['ffmpeg', phaseFfmpeg],
  ['snapcn', phaseSnapcn],
  ['remocn', phaseRemocn],
];

fs.mkdirSync(postersDir, { recursive: true });
const t0 = Date.now();
for (const [name, fn] of phases) {
  if (only && only !== name) continue;
  log(`== Phase ${name} 开始 ==`);
  try {
    await fn();
  } catch (e) {
    log(`Phase ${name} 整体失败:${String(e && e.message || e).slice(0, 300)}`);
  }
}
const summary = {
  finishedAt: new Date().toISOString(),
  elapsedMinutes: Math.round((Date.now() - t0) / 60000),
  produced: counts,
  failureCount: failures.length,
  failures,
};
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
log(`全部结束:${JSON.stringify(counts)} 失败 ${failures.length} 用时 ${summary.elapsedMinutes} 分钟,汇总 ${summaryPath}`);
