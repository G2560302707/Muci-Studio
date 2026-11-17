export async function loadCatalog() {
  const response = await fetch('/motion-workbench/data/catalog.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`读取 catalog 失败：HTTP ${response.status}`);
  return response.json();
}

function matchesLibraryFilter(record, library) {
  if (!library || library === 'all') return true;
  if (library === 'talkcraft') {
    return record.library === 'core' || record.library === 'video-talkcraft';
  }
  if (library === 'video-talkcraft') {
    return record.library === 'core' || record.library === 'video-talkcraft';
  }
  return record.library === library;
}

export function expandKeywords(keyword, aliases) {
  const terms = new Set([keyword]);
  for (const [canonical, related] of Object.entries(aliases || {})) {
    if (canonical === keyword || (related || []).includes(keyword)) {
      terms.add(canonical);
      related.forEach((item) => terms.add(item));
    }
  }
  return terms;
}

export function filterRecords(records, query, filters = {}, aliases = {}) {
  const {
    library = 'all',
    category = null,
    previewType = null,
    keyword = null,
  } = filters;

  const q = String(query || '').trim().toLowerCase();
  const keywordTerms = keyword ? expandKeywords(keyword, aliases) : null;

  return (records || []).filter((record) => {
    if (!matchesLibraryFilter(record, library)) return false;
    if (category && record.category !== category) return false;
    if (previewType && record.previewType !== previewType) return false;
    if (keywordTerms) {
      const hay = `${record.name || ''} ${(record.keywords || []).join(' ')}`.toLowerCase();
      if (![...keywordTerms].some((t) => hay.includes(String(t).toLowerCase()))) return false;
    }
    if (!q) return true;
    const blob = `${record.name || ''} ${record.description || ''} ${(record.keywords || []).join(' ')}`.toLowerCase();
    return blob.includes(q);
  });
}
