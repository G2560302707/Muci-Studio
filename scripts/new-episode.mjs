#!/usr/bin/env node
/**
 * 幕次 Studio · 新建期次骨架
 * 用法：npm run new-episode -- ep01
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const id = (process.argv[2] || '').trim();

if (!/^ep\d{2,}$/i.test(id)) {
  console.error('Usage: npm run new-episode -- ep01');
  process.exit(1);
}

const ep = id.toLowerCase();
const episodeDir = path.join(root, 'episodes', ep);
const engineSrc = path.join(root, 'muci-engine', 'components', 'src', ep);
const templateSrc = path.join(root, 'muci-engine', 'components', 'src', 'demo');

if (fs.existsSync(episodeDir)) {
  console.error('Already exists:', episodeDir);
  process.exit(1);
}

fs.mkdirSync(path.join(episodeDir, 'assets'), { recursive: true });
fs.mkdirSync(path.join(episodeDir, 'audio'), { recursive: true });
fs.mkdirSync(path.join(episodeDir, 'keyframes'), { recursive: true });

fs.writeFileSync(
  path.join(episodeDir, 'README.md'),
  `# ${ep}

- **画幅**：□ 横屏 16:9　□ 竖屏 9:16
- **风格**：☑ 白窗紫　□ 黑金
- **题材**：□ 口播　□ 新闻　□ 知识
- **形态**：☑ **②′ 整片模板（默认）**　□ ① 自由拼接

场景代码：\`muci-engine/components/src/${ep}/\`
`,
  'utf8',
);

fs.writeFileSync(
  path.join(episodeDir, 'plan.md'),
  `# ${ep} 口播 / 分镜\n\n（在此填写）\n`,
  'utf8',
);

fs.mkdirSync(engineSrc, { recursive: true });
if (fs.existsSync(templateSrc)) {
  const epPascal = ep.replace(/^ep/, 'Ep');
  const epUpper = ep.toUpperCase();
  for (const name of fs.readdirSync(templateSrc)) {
    const from = path.join(templateSrc, name);
    if (!fs.statSync(from).isFile()) continue;
    let text = fs.readFileSync(from, 'utf8');
    const outName = name
      .replace(/demo\.config\.json$/i, `${ep}.config.json`)
      .replace(/demo\.motion-map\.json$/i, `${ep}.motion-map.json`)
      .replace(/demo/gi, ep);
    text = text
      .replace(/demoConfig/g, `${ep}Config`)
      .replace(/DEMO_TOTAL_FRAMES/g, `${epUpper}_TOTAL_FRAMES`)
      .replace(/EpisodeDemo/g, `Episode${epPascal}`)
      .replace(/Episode-Demo/g, `Episode-${epPascal}`)
      .replace(/\bdemo\b/g, ep)
      .replace(/Demo/g, epPascal)
      .replace(/DEMO/g, epUpper);
    fs.writeFileSync(path.join(engineSrc, outName), text, 'utf8');
  }
  console.log('Copied engine skeleton from demo →', engineSrc);
} else {
  fs.writeFileSync(
    path.join(engineSrc, `${ep}.config.json`),
    `{\n  "schemaVersion": 1,\n  "meta": { "episode": "${ep}", "width": 1920, "height": 1080, "fps": 30, "theme": "whiteWindow" },\n  "scenes": [],\n  "cues": [],\n  "cards": []\n}\n`,
    'utf8',
  );
  console.warn('demo template missing; wrote empty config only.');
}

console.log('Created', episodeDir);
console.log('Next: fill plan.md, run episode-fx-orchestrator, then map:to-config.');
console.log('Remember to register Composition in muci-engine Root.tsx if needed.');
