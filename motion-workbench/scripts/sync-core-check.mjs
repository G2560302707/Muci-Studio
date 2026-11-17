#!/usr/bin/env node
/**
 * 对账 talkcraft-main/core 与渲染工程 src 镜像文件（components/lib/style）。
 * 退出码 0 = 全同；1 = 有漂移。
 *
 *   node motion-workbench/scripts/sync-core-check.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const master = path.join(root, 'talkcraft-main', 'core');
const render = path.join(root, 'muci-engine', 'components', 'src');
const mirrors = ['components', 'lib', 'style'];

function hashFile(p) {
  return crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
}

function walk(dir, base = dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, base, out);
    else if (/\.(tsx?|ts)$/.test(name) && name !== 'index.ts') {
      out.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return out;
}

const diffs = [];
for (const sub of mirrors) {
  const mDir = path.join(master, sub);
  const rDir = path.join(render, sub);
  const files = new Set([...walk(mDir), ...walk(rDir)]);
  for (const rel of [...files].sort()) {
    const a = path.join(mDir, rel);
    const b = path.join(rDir, rel);
    const aOk = fs.existsSync(a);
    const bOk = fs.existsSync(b);
    if (!aOk || !bOk) {
      diffs.push(`${sub}/${rel}: ${!aOk ? 'MISSING_MASTER' : 'MISSING_RENDER'}`);
      continue;
    }
    if (hashFile(a) !== hashFile(b)) diffs.push(`${sub}/${rel}: DIFF`);
  }
}

if (diffs.length) {
  console.error(`[sync-core-check] ${diffs.length} drift(s):`);
  for (const d of diffs) console.error(' -', d);
  process.exit(1);
}
console.log('[sync-core-check] OK — core mirrors match render src');
