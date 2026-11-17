// 对标拆解数据读取:跨组拉取(供待审核/落库台账等模块共用)
export async function fetchDistillGroups() {
  const index = await fetchJson('/motion-workbench/data/distill/index.json');
  const groups = await Promise.all((index.groups || []).map(async group => {
    try {
      const data = await fetchJson(`/motion-workbench/data/distill/${encodeURIComponent(group.id)}/components.json`);
      return { ...group, records: (data.records || []).map(r => ({ ...r, group: group.id })) };
    } catch (error) {
      console.warn(`对标组 ${group.id} 加载失败:`, error);
      return { ...group, records: [] };
    }
  }));
  return groups;
}

export function fetchJson(url) {
  return fetch(url, { cache: 'no-store' }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

export async function postReview(group, componentId, review) {
  const res = await fetch('/motion-workbench/api/distill-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group, componentId, review })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || '审核失败');
  window.dispatchEvent(new Event('distill-review-changed')); // 通知壳刷新角标
  return data;
}
