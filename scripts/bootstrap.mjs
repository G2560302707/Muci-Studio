#!/usr/bin/env node
/**
 * 幕次 Studio · 安装依赖
 * 用法：在仓库根目录 npm run bootstrap
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const targets = [
  'motion-workbench',
  'muci-engine/components',
];

function run(cwd, args) {
  console.log(`\n→ npm ${args.join(' ')}  (${path.relative(root, cwd) || '.'})`);
  const r = spawnSync('npm', args, { cwd, stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log('幕次 Studio bootstrap');
console.log(`root: ${root}`);

for (const rel of targets) {
  const dir = path.join(root, rel);
  const pkg = path.join(dir, 'package.json');
  if (!fs.existsSync(pkg)) {
    console.warn(`skip (no package.json): ${rel}`);
    continue;
  }
  run(dir, ['install']);
}

console.log('\nOK. Next: npm run demo   or   npm run workbench');
