#!/usr/bin/env node
/**
 * 幕次 Studio · 跑通产品样例（demo）
 * lint → episode:preview
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wb = path.join(root, 'motion-workbench');
const config = path.join(root, 'muci-engine', 'components', 'src', 'demo', 'demo.config.json');

if (!fs.existsSync(config)) {
  console.error('Missing demo config:', config);
  process.exit(1);
}
if (!fs.existsSync(path.join(wb, 'node_modules'))) {
  console.error('motion-workbench/node_modules missing. Run: npm run bootstrap');
  process.exit(1);
}

function run(args) {
  console.log(`\n→ npm ${args.join(' ')}`);
  const r = spawnSync('npm', args, { cwd: wb, stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log('幕次 Studio demo');
run(['run', 'lint:episode', '--', '../muci-engine/components/src/demo/demo.config.json']);
run(['run', 'episode:preview']);
console.log('\nOK. Preview under motion-workbench/data/media/demo/ (if renderer wrote one).');
