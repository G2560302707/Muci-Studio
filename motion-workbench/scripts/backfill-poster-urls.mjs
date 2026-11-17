// 回填 catalog.json 的 posterUrl:指向 gallery/posters/<library>/<name>.<ext>(2026-11-15 静帧批渲产物)。
// 只改每条记录的 posterUrl 字段,其余原样保留;temp+rename 原子写。
// 用法:node scripts/backfill-poster-urls.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = path.resolve(workbenchDir, '..');
const talkcraftMain = path.join(rootDir, 'talkcraft-main');
const postersDir = path.join(talkcraftMain, 'gallery', 'posters');
const catalogPath = path.join(talkcraftMain, 'catalog.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const before = catalog.records.length;

let filled = 0, kept = 0, missing = 0;
const missingNames = [];
for (const rec of catalog.records) {
  const dir = path.join(postersDir, rec.library);
  const ext = ['.jpg', '.png'].find(e => fs.existsSync(path.join(dir, `${rec.name}${e}`)));
  if (!ext) {
    // 保留已有 posterUrl(如 shotcraft 上游自带),否则记缺
    if (rec.posterUrl) kept++; else { missing++; missingNames.push(`${rec.library}/${rec.name}`); }
    continue;
  }
  const url = `gallery/posters/${rec.library}/${rec.name}${ext}`;
  if (rec.posterUrl !== url) { rec.posterUrl = url; filled++; } else kept++;
}

if (catalog.records.length !== before) {
  console.error('catalog.json 在回填期间被并发修改(records 数变化),中止不写');
  process.exit(1);
}
const tmp = `${catalogPath}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(catalog, null, 1) + '\n', 'utf8');
fs.renameSync(tmp, catalogPath);
console.log(`posterUrl 回填完成:新填 ${filled},已有/保留 ${kept},无图 ${missing}`);
if (missingNames.length) console.log(`无静帧(多为缺源):${missingNames.slice(0, 20).join(', ')}${missingNames.length > 20 ? ` 等 ${missingNames.length} 条` : ''}`);
