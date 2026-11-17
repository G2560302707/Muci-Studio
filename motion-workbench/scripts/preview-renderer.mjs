// 按需预览渲染器:为 remocn / snapcn 记录渲染本地 MP4 样片。
// 只读参考库(渲染产物写入 motion-workbench/data/media 投影区),不改冻结源码。
// 也可独立 CLI 使用:node scripts/preview-renderer.mjs remocn accordion
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = path.resolve(workbenchDir, '..');
const remocnMain = path.join(rootDir, 'archive', 'reference-distill', 'components', 'remocn-main');
const snapcnMain = path.join(rootDir, 'archive', 'reference-distill', 'components', 'snapcn-main');
const runtimeDir = path.join(workbenchDir, 'preview-runtime');
const mediaDir = path.join(workbenchDir, 'data', 'media');
const tmpDir = path.join(workbenchDir, '.preview-tmp');

// Remotion 及组件公共依赖统一从 preview-runtime 解析(参考库保持只读、不装依赖)
const runtimeRequire = createRequire(path.join(runtimeDir, 'package.json'));

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const RENDER_SCALE = 0.75; // 1280×720 → 960×540,浏览样片够用

const libraries = {
  remocn: {
    root: remocnMain,
    registryName: 'remocn',
  },
  snapcn: {
    root: snapcnMain,
    registryName: 'snap-cn',
  },
};

function pascal(name) {
  return name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

function camel(name) {
  const p = pascal(name);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

// remocn remotion.config.ts 里的精确别名(仓库冻结,固定复刻)
const REMOCN_EXTRA_ALIASES = {
  '@/components/remocn/typed-split-wipe$': 'registry/remocn/typed-split-wipe/index.tsx',
  '@/components/remocn/caret$': 'registry/remocn-ui/caret/index.tsx',
  '@/components/remocn/shader-text-reveal$': 'registry/remocn/shader-text-reveal/index.tsx',
  '@/components/remocn/number-wheel$': 'registry/remocn/number-wheel/index.tsx',
  '@/components/remocn/word-push$': 'registry/remocn/word-push/index.tsx',
  '@/components/remocn/radial-burst$': 'registry/remocn/radial-burst/index.tsx',
  '@/lib/remocn/audit-core$': 'registry/remocn/audit-core/index.tsx',
};

// 容错解析 tsconfig 的 paths(snapcn 的 tsconfig 带注释)
function tsconfigAliases(libRoot) {
  const raw = fs.readFileSync(path.join(libRoot, 'tsconfig.json'), 'utf8');
  const pathsMatch = raw.match(/"paths"\s*:\s*\{([\s\S]*?)\n\s*\}/);
  if (!pathsMatch) return [];
  const aliases = [];
  const pairRegex = /"([^"]+)"\s*:\s*\[([^\]]+)\]/g;
  let match;
  while ((match = pairRegex.exec(pathsMatch[1])) !== null) {
    const target = match[2].split(',')[0].replace(/["'\s]/g, '');
    if (!target) continue;
    aliases.push([match[1], path.join(libRoot, target)]);
  }
  return aliases;
}

// manifest / config 的默认 props
let remocnManifestPromise = null;
function loadRemocnManifest() {
  if (!remocnManifestPromise) {
    remocnManifestPromise = import(
      `file://${path.join(remocnMain, 'registry', '__manifest__.ts').replace(/\\/g, '/')}`
    ).then(mod => mod.previewManifest);
  }
  return remocnManifestPromise;
}

function artifactSubRegistry(library, name) {
  if (library !== 'remocn') return null;
  const artifactPath = path.join(remocnMain, 'registry-artifacts', `${name}.json`);
  if (!fs.existsSync(artifactPath)) return null;
  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return artifact.files?.[0]?.path.split('/')[1] || 'remocn';
  } catch {
    return null;
  }
}

function snapcnCompositionDefs() {
  const registryPath = path.join(snapcnMain, 'registry', 'snap-cn', 'registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  return (registry.items || [])
    .filter(item => item.name)
    .map(item => {
      const dir = path.join(snapcnMain, 'registry', 'snap-cn', item.name);
      const hasComponent = fs.existsSync(path.join(dir, 'index.tsx'));
      const hasConfig = fs.existsSync(path.join(dir, 'config.ts'));
      return hasComponent && hasConfig
        ? { name: item.name, component: path.join(dir, 'index.tsx'), config: path.join(dir, 'config.ts') }
        : null;
    })
    .filter(Boolean);
}

function remocnCompositionDef(name, manifestEntry) {
  const sub = artifactSubRegistry('remocn', name) || 'remocn';
  const component = path.join(remocnMain, 'registry', sub, name, 'index.tsx');
  if (!fs.existsSync(component)) return null;
  return { name, component, entry: manifestEntry };
}

function writeTempEntry(filename, content) {
  fs.mkdirSync(tmpDir, { recursive: true });
  const entryPath = path.join(tmpDir, filename);
  fs.writeFileSync(entryPath, content, 'utf8');
  return entryPath;
}

// 生成 webpack alias:react/react-dom 统一指 preview-runtime,避免双 React
function buildWebpackOverride(libRoot, extraAliases = []) {
  const nodeModules = path.join(runtimeDir, 'node_modules');
  const googleFontsDir = path.join(nodeModules, '@remotion', 'google-fonts');
  const fontStub = path.join(workbenchDir, 'scripts', 'google-font-stub.mjs');
  const webpack = runtimeRequire('webpack');
  return config => ({
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      // snapcn 全量打包会拉起上百个 Google Fonts 变体;离线 stub 保证渲染不因 CDN 超时失败
      new webpack.NormalModuleReplacementPlugin(/@remotion\/google-fonts(?:\/|$)/, fontStub),
    ],
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
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        ...Object.fromEntries(extraAliases),
        react: path.join(nodeModules, 'react'),
        'react-dom': path.join(nodeModules, 'react-dom'),
        '@': libRoot,
      },
      modules: [nodeModules, 'node_modules', ...(config.resolve?.modules ?? [])],
    },
  });
}

let tailwindOverride = null;
function loadTailwindOverride() {
  if (tailwindOverride !== null) return tailwindOverride;
  try {
    const { enableTailwind } = runtimeRequire('@remotion/tailwind-v4');
    tailwindOverride = enableTailwind;
  } catch {
    tailwindOverride = false;
  }
  return tailwindOverride;
}

const bundleCache = new Map(); // library → Promise<serveUrl>

async function bundleSnapcn() {
  const defs = snapcnCompositionDefs();
  const imports = defs
    .map(
      def => `import { ${pascal(def.name)} } from ${JSON.stringify(def.component)};
import { ${camel(def.name)}Config } from ${JSON.stringify(def.config)};`
    )
    .join('\n');
  const compositions = defs
    .map(
      def => `registerComposition(${JSON.stringify(def.name)}, ${pascal(def.name)}, ${camel(def.name)}Config);`
    )
    .join('\n');
  const entry = `
import { AbsoluteFill, Composition, Img, registerRoot } from "remotion";
import { loadFont } from "@remotion/google-fonts/Geist";
import { getDefaults } from ${JSON.stringify(path.join(snapcnMain, 'lib', 'customizer-config.ts'))};
${imports}

const { fontFamily: GEIST } = loadFont();

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
    return <AbsoluteFill style={{ backgroundColor: backdrop.color }} />;
  }
  return null;
}

const defs = [];
function registerComposition(id, Component, config) {
  defs.push({ id, Component, config });
}

${compositions}

function Root() {
  return defs.map(({ id, Component, config }) => {
    const props = getDefaults(config.controls);
    function Stage() {
      return (
        <AbsoluteFill
          style={{ ["--font-geist-sans"]: GEIST, fontFamily: GEIST, backgroundColor: "#fff" }}
        >
          <Backdrop backdrop={config.previewBackdrop} />
          <Component {...props} />
        </AbsoluteFill>
      );
    }
    return (
      <Composition
        key={id}
        id={id}
        component={Stage}
        durationInFrames={config.durationInFrames}
        fps={config.fps}
        width={config.compositionWidth}
        height={config.compositionHeight}
      />
    );
  });
}

registerRoot(Root);
`;
  const entryPath = writeTempEntry('snapcn-root.tsx', entry);
  const { bundle } = runtimeRequire('@remotion/bundler');
  const enableTailwind = loadTailwindOverride();
  const base = buildWebpackOverride(snapcnMain, tsconfigAliases(snapcnMain));
  return bundle({
    entryPoint: entryPath,
    browserExecutable: CHROME,
    webpackOverride: enableTailwind ? config => enableTailwind(base(config)) : base,
  });
}

async function bundleRemocn(name, manifestEntry) {
  const def = remocnCompositionDef(name, manifestEntry);
  if (!def) throw new Error(`remocn 组件源码不存在:${name}`);
  const sub = artifactSubRegistry('remocn', name) || 'remocn';
  const backdrop = JSON.stringify(manifestEntry.previewBackdrop ?? null);
  const entry = `
import { AbsoluteFill, Composition, Img, registerRoot } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import * as Mod from ${JSON.stringify(def.component)};

const RAW_DEFAULTS = ${JSON.stringify(manifestEntry.defaults ?? {})};
// __manifest__ 把 remotion-captions 压成纯字符串;组件实际要 Caption[]
const DEFAULTS = {
  ...RAW_DEFAULTS,
  ...(typeof RAW_DEFAULTS.captions === "string"
    ? { captions: previewCaptions(RAW_DEFAULTS.captions) }
    : {}),
};
const BACKDROP = ${backdrop};
const COMP_NAME = ${JSON.stringify(name)};
const PASCAL = ${JSON.stringify(pascal(name))};
const CAMEL = ${JSON.stringify(camel(name))};
const TOTAL = ${manifestEntry.durationInFrames};
const FPS = ${manifestEntry.fps};
const WIDTH = ${manifestEntry.compositionWidth};
const HEIGHT = ${manifestEntry.compositionHeight};

// 导出名解析:remocn 导出命名不统一(PascalCase / camelCase / default)。
// 转场类(如 shader-spiral-pass)只导出 camelCase 工厂,调用后返回
// {component, props}(TransitionSeries 的 presentation)——这类组件按
// "单组件包舞台"直渲会拿到 undefined,报 React #130。这里运行时探测:
// 逐个导出试调,返回对象带 component 字段即认定为 presentation 工厂。
function findPresentationFactory() {
  const seen = new Set();
  for (const key of [PASCAL, CAMEL, ...Object.keys(Mod)]) {
    const fn = Mod[key];
    if (typeof fn !== "function" || seen.has(fn)) continue;
    seen.add(fn);
    try {
      const probe = fn({});
      if (probe && typeof probe === "object" && probe.component) return fn;
    } catch (err) {}
  }
  return null;
}

const TransitionFactory = findPresentationFactory();
const StageComponent = Mod[PASCAL] || Mod[CAMEL] || Mod.default;

// manifest 每个组件声明了自己的 previewBackdrop(如 chat-gpt 是白底);
// 不合成它的话透明底会被 mp4 编成黑色,浅色主题组件在黑底上发灰看不清
function Backdrop() {
  if (!BACKDROP) return null;
  if (BACKDROP.type === "image") {
    return (
      <AbsoluteFill>
        <Img src={BACKDROP.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
    );
  }
  if (BACKDROP.type === "color") {
    return <AbsoluteFill style={{ backgroundColor: BACKDROP.value }} />;
  }
  return null;
}

// remocn 不少组件是 inline 小元件(如 Progress 320×12、无自带背景),
// 裸渲染会在 Remotion 默认黑画布上变成"全黑+角落一小条";
// 统一包居中舞台 + manifest 声明的 backdrop(缺省白):全画布组件自带的背景会盖住它
function Stage(props) {
  return (
    <AbsoluteFill
      style={{ backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Backdrop />
      <StageComponent {...props} />
    </AbsoluteFill>
  );
}

// 转场演示场景:高对比 A→B 两张纯色卡,让转场本体(shader 隧道等)当主角
function SceneA() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#17171c", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ffffff", fontSize: 160, fontWeight: 800, fontFamily: "sans-serif" }}>A</div>
    </AbsoluteFill>
  );
}
function SceneB() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#f2f2f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#17171c", fontSize: 160, fontWeight: 800, fontFamily: "sans-serif" }}>B</div>
    </AbsoluteFill>
  );
}

let rootComponent = null;
let compDuration = TOTAL;
let compProps = {};

if (TransitionFactory) {
  // A →(过渡 30 帧,与两侧场景重叠)→ B;TransitionSeries 总长 = 2×场景 − 过渡
  const TRANSITION_FRAMES = 30;
  const scene = Math.max(45, Math.floor((TOTAL + TRANSITION_FRAMES) / 2));
  compDuration = scene * 2 - TRANSITION_FRAMES;
  rootComponent = () => (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={scene}>
        <SceneA />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={TransitionFactory(DEFAULTS)}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />
      <TransitionSeries.Sequence durationInFrames={scene}>
        <SceneB />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
} else if (StageComponent) {
  compProps = { defaultProps: DEFAULTS };
  rootComponent = Stage;
} else {
  throw new Error(
    "remocn " + COMP_NAME + ": 无可渲染导出(试过 " + PASCAL + " / " + CAMEL +
    " / default),实际导出:" + Object.keys(Mod).join(", ")
  );
}

registerRoot(() => (
  <Composition
    id="preview"
    component={rootComponent}
    durationInFrames={compDuration}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    {...compProps}
  />
));
`;
  const entryPath = writeTempEntry(`remocn-${name}.tsx`, entry);
  const { bundle } = runtimeRequire('@remotion/bundler');
  const extraAliases = [
    // WebGL 补丁副本:冻结源码 getContext 缺 preserveDrawingBuffer,无头截图截到空画布
    // (转场 shader 消失),用 scripts/preview-overrides/ 的补丁副本替代,冻结源码不动
    [
      '@/components/remocn/shader-light-tunnel$',
      path.join(workbenchDir, 'scripts', 'preview-overrides', 'shader-light-tunnel.tsx'),
    ],
    ...tsconfigAliases(remocnMain),
    ...Object.entries(REMOCN_EXTRA_ALIASES).map(([from, to]) => [
      from,
      path.join(remocnMain, to),
    ]),
  ];
  return bundle({
    entryPoint: entryPath,
    browserExecutable: CHROME,
    webpackOverride: buildWebpackOverride(remocnMain, extraAliases),
  });
}

// 渲染任务串行执行,避免多个渲染抢 CPU
let queue = Promise.resolve();
function enqueue(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

async function renderPreview({ library, name }) {
  if (!libraries[library]) throw new Error(`不支持的库:${library}`);
  const outputDir = path.join(mediaDir, library);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${name}.mp4`);
  const previewUrl = `/motion-workbench/data/media/${library}/${name}.mp4`;

  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
    return { previewUrl, cached: true };
  }

  return enqueue(async () => {
    const { selectComposition, renderMedia } = runtimeRequire('@remotion/renderer');
    let serveUrl;
    let compositionId = name;
    if (library === 'snapcn') {
      if (!bundleCache.has('snapcn')) {
        bundleCache.set('snapcn', bundleSnapcn());
      }
      serveUrl = await bundleCache.get('snapcn');
    } else {
      const manifest = await loadRemocnManifest();
      const manifestEntry = manifest[name];
      if (!manifestEntry) throw new Error(`remocn manifest 无此组件:${name}`);
      serveUrl = await bundleRemocn(name, manifestEntry);
      compositionId = 'preview';
    }

    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      browserExecutable: CHROME,
      timeoutInMilliseconds: 120_000,
    });
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      imageFormat: 'jpeg',
      outputLocation: outputPath,
      concurrency: 3,
      browserExecutable: CHROME,
      scale: RENDER_SCALE,
      timeoutInMilliseconds: 120_000,
    });
    return { previewUrl, cached: false };
  });
}

// CLI:node scripts/preview-renderer.mjs <library> <name>
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , cliLibrary, cliName] = process.argv;
  if (!cliLibrary || !cliName) {
    console.error('用法:node scripts/preview-renderer.mjs <remocn|snapcn> <name>');
    process.exit(1);
  }
  renderPreview({ library: cliLibrary, name: cliName })
    .then(result => {
      console.log(`渲染完成:${result.previewUrl}${result.cached ? '(缓存)' : ''}`);
    })
    .catch(error => {
      console.error('渲染失败:', error.message);
      process.exit(1);
    });
}

// 导出内部构造器供 render-posters.mjs 批量静帧复用(纯增量,不改变本文件行为)
export {
  renderPreview,
  loadRemocnManifest,
  bundleSnapcn,
  bundleRemocn,
  buildWebpackOverride,
  tsconfigAliases,
  loadTailwindOverride,
  writeTempEntry,
  artifactSubRegistry,
  remocnCompositionDef,
  REMOCN_EXTRA_ALIASES,
};
