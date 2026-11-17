// benben-b 存量快照去重(2026-11-15,INDEX 使用规则 7 的存量执行):
// 90 个目录是上游重建工作流的整包快照堆积:组件实现文件跨目录逐字节相同,仅每批胶水码/记账 JSON 各异;
// 另有 6 个带名字的精选目录(ep102-selected 等)内容独立。注意整树 specs/runtime 相对引用在上游仓库
// 根目录才成立,本库内本就不可独立渲染(inherited-unreviewed),清理只需不丢独有数据。
// 保留:catalog 代表 08077883af6e + 6 精选 + 19c745fe58ce(B018/B070 实现兜底);独有 specs 抢救进代表目录;
// 其余整体移入 _旧/(不删除,可逆)。
// 用法:node scripts/dedupe-benben-b.mjs          # dry-run,只打印方案
//      node scripts/dedupe-benben-b.mjs --apply  # 真移动
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const apply = process.argv.includes('--apply');
const talkcraftMain = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const benbenB = path.join(talkcraftMain, 'external', 'benben-b');
const archiveRoot = path.join(talkcraftMain, '..', '_旧', 'benben-b-快照冗余-20261115');

const catalog = JSON.parse(fs.readFileSync(path.join(talkcraftMain, 'catalog.json'), 'utf8'));
const representatives = new Set(
  catalog.records
    .filter(r => r.library === 'benben-b' && r.sourcePath)
    .map(r => path.basename(r.sourcePath.replace(/\/$/, '')))
);

const KEEP = new Set([
  ...representatives,          // catalog 代表
  '19c745fe58ce',              // B018 + B070 实现兜底(人工核过只在这批快照里)
  'ep102-selected-20261005',
  'ep109-selected-20261006',
  'expansion-selected-20261007',
  'interaction-components-20261007',
  'news-keyword-match-cut-20261010',
  'screen-camera-selected-20261007',
]);

// 哈希全树 + 收集每目录文件清单
const byHash = new Map();
const perDir = new Map();
const dirs = fs.readdirSync(benbenB).filter(d => fs.statSync(path.join(benbenB, d)).isDirectory());
function walk(dir, base, out) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, base, out);
    else {
      const h = crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
      if (!byHash.has(h)) byHash.set(h, { size: st.size, dirs: new Set() });
      byHash.get(h).dirs.add(base);
      out.push({ rel: path.relative(path.join(benbenB, base), p).split(path.sep).join('/'), h, size: st.size });
    }
  }
}
for (const d of dirs) {
  const files = [];
  walk(path.join(benbenB, d), d, files);
  perDir.set(d, files);
}

const kept = [...KEEP].filter(d => dirs.includes(d));
const moved = dirs.filter(d => !kept.includes(d));
const repDir = [...representatives][0];
if (!repDir || !kept.includes(repDir)) {
  console.error('catalog 代表目录不在保留集,中止');
  process.exit(1);
}

// 抢救清单:被移目录里「全局唯一」的 specs/*.json(渲染时序数据,按 B 编号对得上)
const salvage = [];
for (const d of moved) {
  for (const f of perDir.get(d)) {
    if (!f.rel.startsWith('specs/')) continue;
    if (byHash.get(f.h).dirs.size !== 1) continue;
    const dest = path.join(benbenB, repDir, f.rel);
    if (fs.existsSync(dest)) continue;
    salvage.push({ from: d, rel: f.rel, size: f.size });
  }
}

function dirSize(d) {
  let s = 0;
  for (const f of perDir.get(d)) s += f.size;
  return s;
}
const movedTotal = moved.reduce((s, d) => s + dirSize(d), 0);

console.log(`目录总数 ${dirs.length} | 保留 ${kept.length} | 移入 _旧 ${moved.length} 个,释放约 ${(movedTotal / 1048576).toFixed(0)} MB`);
console.log('\n保留目录:');
for (const d of kept.sort()) {
  const why = representatives.has(d) ? 'catalog 代表' : d === '19c745fe58ce' ? 'B018/B070 兜底' : '精选目录';
  console.log(`  ${d}  (${why})`);
}
console.log(`\n独有 specs 抢救 ${salvage.length} 个 → ${repDir}/specs/`);
for (const s of salvage.slice(0, 10)) console.log(`  ${s.from}/specs → ${s.rel}`);
if (salvage.length > 10) console.log(`  …共 ${salvage.length} 个`);
console.log(`\n以下目录将移动 → _旧/benben-b-快照冗余-20261115/(不删除,可逆):`);
console.log('  ' + moved.join(', '));

if (apply) {
  fs.mkdirSync(archiveRoot, { recursive: true });
  for (const s of salvage) {
    const dest = path.join(benbenB, repDir, s.rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(benbenB, s.from, s.rel), dest);
  }
  const manifest = {
    archivedAt: new Date().toISOString(),
    reason: 'benben-b 快照冗余,INDEX 使用规则 7 存量执行;组件实现均为代表目录已有内容的逐字节拷贝',
    salvagedSpecs: salvage.map(s => `${s.from}/ → ${repDir}/${s.rel}`),
    keptDirs: kept,
    moved: moved,
  };
  for (const d of moved) {
    fs.renameSync(path.join(benbenB, d), path.join(archiveRoot, d));
  }
  fs.writeFileSync(path.join(archiveRoot, '_ARCHIVE-MANIFEST.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\n完成:抢救 ${salvage.length} 个 specs,移动 ${moved.length} 个目录 → _旧/。清单 _ARCHIVE-MANIFEST.json`);
} else {
  console.log('\n(dry-run,加 --apply 执行)');
}
