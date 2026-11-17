// 成片参数：读 epNN.config.json / demo.config.json，经 inputProps 注入 EpisodeLab Composition。
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = path.resolve(workbenchDir, '..');
const runtimeDir = path.join(workbenchDir, 'preview-runtime');
const labEntry = path.join(runtimeDir, 'episode-lab', 'Root.tsx');
const labPublic = path.join(runtimeDir, 'episode-lab', 'public');
const componentsSrc = path.join(rootDir, 'muci-engine', 'components', 'src');

const runtimeRequire = createRequire(path.join(runtimeDir, 'package.json'));
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let bundlePromise = null;
let queue = Promise.resolve();

function enqueue(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

export function resolveEpisodeId(raw) {
  return String(raw || 'demo').trim() || 'demo';
}

export function listEpisodes() {
  if (!fs.existsSync(componentsSrc)) return [];
  return fs
    .readdirSync(componentsSrc, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((id) => fs.existsSync(getEpisodeConfigPath(id)))
    .sort()
    .map((id) => ({
      id,
      label: id === 'demo' ? '产品样例 demo' : id,
      configPath: getEpisodeConfigPath(id),
    }));
}

export function getEpisodeConfigPath(episodeId) {
  const id = resolveEpisodeId(episodeId);
  return path.join(componentsSrc, id, `${id}.config.json`);
}

export function getEpisodeMediaDir(episodeId) {
  return path.join(workbenchDir, 'data', 'media', resolveEpisodeId(episodeId));
}

export function readEpisodeConfig(episodeId) {
  const configPath = getEpisodeConfigPath(episodeId);
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

export function writeEpisodeConfig(episodeId, config) {
  const configPath = getEpisodeConfigPath(episodeId);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

function toInputProps(config) {
  return {
    meta: config.meta || {},
    cues: Array.isArray(config.cues) ? config.cues : [],
    copy: config.copy || {},
    audio: config.audio || {},
    scenes: Array.isArray(config.scenes) ? config.scenes : [],
    cards: Array.isArray(config.cards) ? config.cards : [],
  };
}

async function getServeUrl() {
  if (!bundlePromise) {
    const { bundle } = runtimeRequire('@remotion/bundler');
    bundlePromise = bundle({
      entryPoint: labEntry,
      publicDir: labPublic,
      browserExecutable: CHROME,
    });
  }
  return bundlePromise;
}

/**
 * @param {string} episodeId
 * @param {'preview'|'export'} mode
 */
export async function renderEpisode(episodeId, mode = 'preview') {
  return enqueue(async () => {
    const id = resolveEpisodeId(episodeId);
    const config = readEpisodeConfig(id);
    const inputProps = toInputProps(config);
    const { selectComposition, renderMedia } = runtimeRequire('@remotion/renderer');
    const serveUrl = await getServeUrl();

    const composition = await selectComposition({
      serveUrl,
      id: 'EpisodeLab',
      inputProps,
      browserExecutable: CHROME,
    });

    const mediaDir = getEpisodeMediaDir(id);
    fs.mkdirSync(mediaDir, { recursive: true });
    const fileName = mode === 'export' ? 'export.mp4' : 'preview.mp4';
    const outputPath = path.join(mediaDir, fileName);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      imageFormat: 'jpeg',
      outputLocation: outputPath,
      inputProps,
      concurrency: 2,
      browserExecutable: CHROME,
      scale: mode === 'preview' ? 0.5 : 1,
    });

    return {
      ok: true,
      episodeId: id,
      mode,
      outputPath,
      mediaUrl: `/motion-workbench/data/media/${id}/${fileName}`,
      durationInFrames: composition.durationInFrames,
      fps: composition.fps,
      theme: config.meta?.theme || 'whiteWindow',
    };
  });
}

// 兼容旧 lab 入口
export function getEpisodeLabConfigPath() {
  return getEpisodeConfigPath('demo');
}
export function readEpisodeLabConfig() {
  return readEpisodeConfig('demo');
}
export function writeEpisodeLabConfig(config) {
  return writeEpisodeConfig('demo', config);
}
export async function renderEpisodeLab(mode = 'preview') {
  return renderEpisode('demo', mode);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const episodeId = process.argv[2] || 'demo';
  const mode = process.argv[3] === 'export' ? 'export' : 'preview';
  renderEpisode(episodeId, mode)
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
