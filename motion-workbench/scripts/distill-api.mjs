// 对标拆解审核 API:工作台内审核按钮 → 状态持久化到 data/distill/<组>/components.json
// POST /motion-workbench/api/distill-review  body: {group, componentId, review}
//   review ∈ approved | rejected | pending;业务规则见 PLAN-对标视频仿制模块.md 第 3 节:
//   通过且库内无类似 → deposit=eligible(准予落库,待二次复用);拒绝/待审 → deposit=none(未落库前)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workbenchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distillDir = path.join(workbenchDir, 'data', 'distill');

const VALID_REVIEW = new Set(['approved', 'rejected', 'pending']);

function respond(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 10_000) { reject(new Error('请求体过大')); request.destroy(); }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

// 组名/组件 id 进入文件路径前收紧,防目录穿越
function safeSegment(value) {
  return typeof value === 'string' && value.length > 0 && value.length < 80 &&
    !/[\\/:*?"<>|]/.test(value) && !value.includes('..') ? value : null;
}

export async function handleDistillApi(request, response, requestPath) {
  if (requestPath !== '/motion-workbench/api/distill-review' || request.method !== 'POST') {
    respond(response, 404, { ok: false, error: '未知接口' });
    return;
  }
  let body;
  try { body = JSON.parse(await readBody(request)); } catch { respond(response, 400, { ok: false, error: 'JSON 解析失败' }); return; }
  const group = safeSegment(body.group);
  const componentId = typeof body.componentId === 'string' ? body.componentId : null;
  const review = body.review;
  if (!group || !componentId || !VALID_REVIEW.has(review)) {
    respond(response, 400, { ok: false, error: '参数缺失或非法(group/componentId/review)' });
    return;
  }
  const filePath = path.join(distillDir, group, 'components.json');
  if (!fs.existsSync(filePath)) { respond(response, 404, { ok: false, error: `组不存在:${group}` }); return; }
  let data;
  try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { respond(response, 500, { ok: false, error: 'components.json 解析失败' }); return; }
  const record = (data.records || []).find(r => r.id === componentId);
  if (!record) { respond(response, 404, { ok: false, error: `组件不存在:${componentId}` }); return; }

  record.review = { status: review, reviewedAt: new Date().toISOString(), note: String(body.note || '') };
  // 业务规则:库内无类似 + 审核通过 → 准予落库(资格);其余情况未落库前都是 none
  if (review === 'approved' && record.mapping?.status === 'none') {
    record.deposit = { status: 'eligible', variants: record.deposit?.variants || [], depositedAt: null, depositedPath: null };
  } else if (record.deposit?.status !== 'deposited') {
    record.deposit = { status: 'none', variants: [], depositedAt: null, depositedPath: null };
  }
  try {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 1)}\n`, 'utf8');
  } catch (error) {
    respond(response, 500, { ok: false, error: `写入失败:${error.message}` });
    return;
  }
  respond(response, 200, { ok: true, review: record.review, deposit: record.deposit });
}
