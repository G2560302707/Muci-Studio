import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Layout,
  List,
  Select,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Typography,
  message,
  theme,
} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import {
  ClearOutlined,
  CodeOutlined,
  CopyOutlined,
  ExportOutlined,
  MoonOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { filterRecords, loadCatalog } from '../catalog.js';

const { Sider, Content } = Layout;
const { Paragraph, Text } = Typography;

const favoritesStorageKey = 'motion-workbench:favorites';
const themeStorageKey = 'motion-workbench:theme';
const previewOverridesStorageKey = 'motion-workbench:preview-overrides';

// 这些库的记录可按需渲染本地预览(渲染由本地服务完成,约 1-2 分钟)
const renderableLibraries = new Set(['remocn', 'snapcn']);
const canRenderPreview = record =>
  record.previewType === 'missing' && renderableLibraries.has(record.library);

const libraryLabels = {
  all: '全部',
  talkcraft: 'Talkcraft',
  'video-shotcraft': 'Shotcraft',
  remocn: 'Remocn',
  snapcn: 'Snapcn',
  'distill-fred': '对标拆解·未落盘',
};

/** Talkcraft = core 白窗紫套件 + video-talkcraft 配方卡（不再单独显示「主库」） */
function matchesLibraryFilter(record, library) {
  if (library === 'all') return true;
  if (library === 'talkcraft') {
    return record.library === 'core' || record.library === 'video-talkcraft';
  }
  return record.library === library;
}

const previewLabels = {
  video: 'MP4',
  iframe: 'HTML',
  poster: '海报',
  missing: '缺失',
};

function previewTypeLabel(type) {
  return (
    {
      video: '视频',
      poster: '静态海报',
      iframe: 'HTML',
      missing: '无预览',
    }[type] || '预览'
  );
}

function PreviewTypeBadge({ type }) {
  return <span className={`preview-type-badge is-${type}`}>{previewTypeLabel(type)}</span>;
}

function toFileUrl(posixPath) {
  return `/${posixPath.split('/').map(encodeURIComponent).join('/')}`;
}

// URL hash 状态:筛选与选中记录可分享、刷新不丢
function normalizeLibraryParam(lib) {
  if (!lib || lib === 'all') return 'all';
  if (lib === 'video-talkcraft' || lib === 'core') {
    return 'talkcraft';
  }
  return lib;
}

function readHashState() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return {
    query: params.get('q') || '',
    library: normalizeLibraryParam(params.get('lib') || 'all'),
    category: params.get('cat'),
    previewType: params.get('ptype'),
    keyword: params.get('kw'),
    showFavorites: params.get('fav') === '1',
    onlyWithPreview: params.get('pv') === '1',
    selectedId: params.get('sel'),
  };
}

function writeHashState(state) {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.library && state.library !== 'all') params.set('lib', state.library);
  if (state.category) params.set('cat', state.category);
  if (state.previewType) params.set('ptype', state.previewType);
  if (state.keyword) params.set('kw', state.keyword);
  if (state.showFavorites) params.set('fav', '1');
  if (state.onlyWithPreview) params.set('pv', '1');
  if (state.selectedId) params.set('sel', state.selectedId);
  const hash = params.toString();
  if (hash) {
    history.replaceState(null, '', `#${hash}`);
  } else {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

function Preview({ record, detailed = false }) {
  const className = detailed ? 'preview-media detail-preview' : 'preview-media card-preview';
  const stopPropagation = event => event.stopPropagation();

  if (record.previewType === 'video') {
    return (
      <div className={className}>
        <PreviewTypeBadge type="video" />
        <video
          src={record.previewUrl}
          poster={record.posterUrl || undefined}
          controls
          playsInline
          preload={detailed ? 'metadata' : 'auto'}
          onClick={stopPropagation}
          aria-label={`${record.title} 视频预览`}
        />
      </div>
    );
  }

  if (record.previewType === 'poster') {
    return (
      <div className={className}>
        <PreviewTypeBadge type="poster" />
        <img
          src={record.posterUrl}
          alt={record.title}
          loading="lazy"
          onClick={stopPropagation}
        />
        {detailed && (
          <div className="preview-static-note">本地暂无视频样片，当前显示静态海报</div>
        )}
      </div>
    );
  }

  if (record.previewType === 'iframe') {
    return (
      <div className={className}>
        <PreviewTypeBadge type="iframe" />
        <iframe
          src={record.previewUrl}
          title={record.title}
          loading="lazy"
          onClick={stopPropagation}
        />
      </div>
    );
  }

  return (
    <div className={`${className} preview-missing`}>
      <PreviewTypeBadge type="missing" />
      <span>无本地预览</span>
    </div>
  );
}

function PreviewPlaceholder({ record, onLoad, onRender, rendering }) {
  const labels = {
    video: '视频预览',
    poster: '静态海报',
    iframe: 'HTML 预览',
  };

  const hints = {
    video: '点击加载视频，保持列表流畅',
    poster: '仅有静态海报，无本地视频',
    iframe: '点击加载 HTML 预览',
  };

  return (
    <div className="preview-placeholder">
      <PreviewTypeBadge type={record.previewType} />
      <div className="placeholder-icon">
        <PlayCircleOutlined />
      </div>
      <div className="placeholder-copy">
        <strong>{labels[record.previewType] || '预览'}</strong>
        <span>
          {canRenderPreview(record)
            ? '本地暂无样片，可按需渲染'
            : hints[record.previewType] || '按需加载，保持列表流畅'}
        </span>
      </div>
      {canRenderPreview(record) ? (
        <Button
          size="small"
          loading={rendering}
          onClick={event => {
            event.stopPropagation();
            onRender(record);
          }}
        >
          {rendering ? '渲染中' : '渲染预览'}
        </Button>
      ) : (
        <Button
          size="small"
          onClick={event => {
            event.stopPropagation();
            onLoad(record);
          }}
        >
          加载
        </Button>
      )}
    </div>
  );
}

export default function App() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const initialHash = useMemo(readHashState, []);
  const [query, setQuery] = useState(initialHash.query);
  const [library, setLibrary] = useState(initialHash.library);
  const [category, setCategory] = useState(initialHash.category);
  const [previewType, setPreviewType] = useState(initialHash.previewType);
  const [keyword, setKeyword] = useState(initialHash.keyword);
  const [keywordQuery, setKeywordQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [aliases, setAliases] = useState({});
  const [favorites, setFavorites] = useState(() => {
    const stored = localStorage.getItem(favoritesStorageKey);
    return new Set(stored ? JSON.parse(stored) : []);
  });
  const [showFavorites, setShowFavorites] = useState(initialHash.showFavorites);
  const [onlyWithPreview, setOnlyWithPreview] = useState(initialHash.onlyWithPreview);
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const [loadedPreviews, setLoadedPreviews] = useState(() => new Set());
  const [source, setSource] = useState(null);
  const [previewOverrides, setPreviewOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(previewOverridesStorageKey) || '{}');
    } catch {
      return {};
    }
  });
  const [renderingId, setRenderingId] = useState(null);
  const [hoveredPreviewId, setHoveredPreviewId] = useState(null);
  const hoverTimerRef = useRef(null);
  const favoritesInputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  // 全站主题(深/浅)由统一壳持有,本模块通过 [data-theme] CSS 变量跟随

  useEffect(() => {
    Promise.all([
      loadCatalog(),
      fetch('/motion-workbench/data/keyword-aliases.json').then(response => response.json()),
    ])
      .then(([loadedCatalog, loadedAliases]) => {
        setCatalog(loadedCatalog);
        setAliases(loadedAliases);
      })
      .catch(loadedError => setError(loadedError.message));
  }, []);

  // 从 URL hash 打开指定记录(分享链接用);取 mount 时缓存,防同步 effect 提前抹掉
  const initialSelectedIdRef = useRef(initialHash.selectedId);
  useEffect(() => {
    if (!catalog?.records || !initialSelectedIdRef.current) return;
    const record = catalog.records.find(item => item.id === initialSelectedIdRef.current);
    if (record) setSelected(record);
    initialSelectedIdRef.current = null;
  }, [catalog]);

  // 筛选与选中状态写入 URL
  useEffect(() => {
    writeHashState({
      query,
      library,
      category,
      previewType,
      keyword,
      showFavorites,
      onlyWithPreview,
      selectedId: selected?.id,
    });
  }, [query, library, category, previewType, keyword, showFavorites, onlyWithPreview, selected]);

  // 主题由统一壳提供(AppShell 的 ConfigProvider),本模块不再自建主题


  // catalog 记录合并本地按需渲染的预览覆盖
  const records = useMemo(
    () =>
      catalog
        ? catalog.records.map(record =>
            previewOverrides[record.id] ? { ...record, ...previewOverrides[record.id] } : record
          )
        : [],
    [catalog, previewOverrides]
  );
  const favoriteRecords = useMemo(
    () => records.filter(record => favorites.has(record.id)),
    [records, favorites]
  );
  const categories = useMemo(
    () =>
      [...new Set(records.map(record => record.category).filter(Boolean))].sort((left, right) =>
        left.localeCompare(right, 'zh-CN')
      ),
    [records]
  );
  const keywords = useMemo(() => {
    // 关键词云跟随当前库筛选,避免跨库词互相淹没
    const scoped = records.filter(record => matchesLibraryFilter(record, library));
    const counts = new Map();
    scoped.forEach(record => {
      record.keywords.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
    });
    const sorted = [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-CN'));
    return showAllKeywords ? sorted : sorted.slice(0, 120);
  }, [records, library, showAllKeywords]);
  const visibleKeywords = useMemo(() => {
    const normalized = keywordQuery.trim().toLowerCase();
    if (!normalized) return keywords;
    return keywords.filter(([name]) => name.toLowerCase().includes(normalized));
  }, [keywords, keywordQuery]);
  const totalKeywordCount = useMemo(() => {
    const scoped = records.filter(record => matchesLibraryFilter(record, library));
    const counts = new Set();
    scoped.forEach(record => record.keywords.forEach(item => counts.add(item)));
    return counts.size;
  }, [records, library]);

  const filtered = useMemo(() => {
    const matched = filterRecords(
      showFavorites ? favoriteRecords : records,
      query,
      { library, category, previewType, keyword },
      aliases
    );
    return onlyWithPreview && previewType !== 'missing'
      ? matched.filter(record => record.previewType !== 'missing')
      : matched;
  }, [
    records,
    favoriteRecords,
    showFavorites,
    query,
    library,
    category,
    previewType,
    keyword,
    aliases,
    onlyWithPreview,
  ]);

  useEffect(() => {
    setPage(1);
    setLoadedPreviews(new Set());
  }, [query, library, category, previewType, keyword, showFavorites, onlyWithPreview]);

  // 切换记录时收起源码视图
  useEffect(() => {
    setSource(null);
  }, [selected?.id]);

  const toggleSource = record => {
    if (source) {
      setSource(null);
      return;
    }
    setSource({ path: record.codePath, status: 'loading', content: '' });
    fetch(toFileUrl(record.codePath))
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(content => setSource({ path: record.codePath, status: 'ready', content }))
      .catch(loadedError =>
        setSource({ path: record.codePath, status: 'error', content: loadedError.message })
      );
  };

  const toggleFavorite = recordId => {
    setFavorites(current => {
      const next = new Set(current);
      if (next.has(recordId)) {
        next.delete(recordId);
        message.success('已取消收藏');
      } else {
        next.add(recordId);
        message.success('已收藏');
      }
      localStorage.setItem(favoritesStorageKey, JSON.stringify([...next]));
      return next;
    });
  };

  const activeFilters = [
    library !== 'all' && {
      key: 'library',
      label: libraryLabels[library],
      clear: () => setLibrary('all'),
    },
    category && { key: 'category', label: category, clear: () => setCategory(null) },
    previewType && {
      key: 'previewType',
      label: `预览：${previewLabels[previewType]}`,
      clear: () => setPreviewType(null),
    },
    keyword && { key: 'keyword', label: keyword, clear: () => setKeyword(null) },
    showFavorites && {
      key: 'favorites',
      label: '仅收藏',
      clear: () => setShowFavorites(false),
    },
    onlyWithPreview && {
      key: 'preview',
      label: '仅看有预览',
      clear: () => setOnlyWithPreview(false),
    },
  ].filter(Boolean);

  const resetFilters = () => {
    setLibrary('all');
    setCategory(null);
    setPreviewType(null);
    setKeyword(null);
    setKeywordQuery('');
    setShowFavorites(false);
    setOnlyWithPreview(false);
    setQuery('');
  };

  const copyValue = value =>
    navigator.clipboard.writeText(value).then(() => message.success('已复制'));

  const loadCardPreview = record => {
    setLoadedPreviews(current => new Set(current).add(record.id));
  };

  // 悬停 400ms 后静音自动播放视频样片
  const scheduleHoverPreview = record => {
    if (record.previewType !== 'video' || loadedPreviews.has(record.id)) return;
    window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => setHoveredPreviewId(record.id), 400);
  };

  const cancelHoverPreview = () => {
    window.clearTimeout(hoverTimerRef.current);
    setHoveredPreviewId(null);
  };

  const exportFavorites = () => {
    const payload = JSON.stringify(
      { version: 1, exportedAt: new Date().toISOString(), favorites: [...favorites] },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'motion-workbench-favorites.json';
    anchor.click();
    URL.revokeObjectURL(url);
    message.success('收藏已导出');
  };

  const importFavoritesFile = file => {
    file
      .text()
      .then(text => {
        const data = JSON.parse(text);
        const ids = Array.isArray(data) ? data : data.favorites;
        if (!Array.isArray(ids)) throw new Error('缺少 favorites 数组');
        setFavorites(current => {
          const next = new Set(current);
          ids.forEach(id => {
            if (typeof id === 'string') next.add(id);
          });
          localStorage.setItem(favoritesStorageKey, JSON.stringify([...next]));
          return next;
        });
        message.success('收藏已导入');
      })
      .catch(error => message.error(`导入失败：${error.message}`));
  };

  const requestRenderPreview = record => {
    if (renderingId) {
      message.info('已有渲染任务在进行，请稍候');
      return;
    }
    setRenderingId(record.id);
    message.info('已加入渲染队列，本地渲染约需 1-2 分钟');
    fetch('/motion-workbench/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ library: record.library, name: record.name }),
    })
      .then(response => response.json())
      .then(data => {
        if (!data.ok) throw new Error(data.error || '渲染失败');
        setPreviewOverrides(current => {
          const next = {
            ...current,
            [record.id]: { previewType: 'video', previewUrl: data.previewUrl },
          };
          localStorage.setItem(previewOverridesStorageKey, JSON.stringify(next));
          return next;
        });
        message.success('预览已生成');
      })
      .catch(error => message.error(`渲染失败：${error.message}`))
      .finally(() => setRenderingId(null));
  };

  const renderCardCover = record => {
    if (loadedPreviews.has(record.id)) {
      return <Preview record={record} />;
    }
    if (
      record.previewType === 'video' &&
      hoveredPreviewId === record.id
    ) {
      return (
        <div className="preview-media card-preview is-hover-preview">
          <PreviewTypeBadge type="video" />
          <video
            src={record.previewUrl}
            poster={record.posterUrl || undefined}
            muted
            autoPlay
            loop
            playsInline
          />
        </div>
      );
    }
    if (record.previewType === 'missing') {
      return canRenderPreview(record) ? (
        <PreviewPlaceholder
          record={record}
          onRender={requestRenderPreview}
          rendering={renderingId === record.id}
        />
      ) : (
        <Preview record={record} />
      );
    }
    return <PreviewPlaceholder record={record} onLoad={loadCardPreview} />;
  };

  const favoriteButton = record => (
    <Tooltip title={favorites.has(record.id) ? '取消收藏' : '收藏'}>
      <Button
        className={`favorite-toggle ${favorites.has(record.id) ? 'is-active' : ''}`}
        shape="circle"
        aria-label={favorites.has(record.id) ? '取消收藏' : '收藏'}
        icon={favorites.has(record.id) ? <StarFilled /> : <StarOutlined />}
        onClick={event => {
          event.stopPropagation();
          toggleFavorite(record.id);
        }}
      />
    </Tooltip>
  );

  return (
    <>
      <Layout className="app-body">
          <Sider
            width={288}
            className="app-sider is-light"
          >
            <div className="sidebar-section">
              <Text strong>库</Text>
              <Select
                value={library}
                onChange={nextLibrary => setLibrary(nextLibrary)}
                options={Object.entries(libraryLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>

            <div className="sidebar-section">
              <Text strong>类别</Text>
              <Select
                allowClear
                showSearch
                value={category}
                onChange={setCategory}
                placeholder="全部类别"
                options={categories.map(item => ({ value: item, label: item }))}
              />
            </div>

            <div className="sidebar-section">
              <Text strong>预览</Text>
              <Select
                allowClear
                value={previewType}
                onChange={setPreviewType}
                placeholder="全部预览"
                options={Object.entries(previewLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>

            <div className="sidebar-section">
              <Text strong>浏览方式</Text>
              <div className="sidebar-switch-row">
                <span>仅收藏</span>
                <Switch
                  size="small"
                  checked={showFavorites}
                  onChange={setShowFavorites}
                  aria-label="仅收藏"
                />
              </div>
              <div className="sidebar-switch-row">
                <span>仅看有预览</span>
                <Switch
                  size="small"
                  checked={onlyWithPreview}
                  onChange={setOnlyWithPreview}
                  aria-label="仅看有预览"
                />
              </div>
              <div className="favorites-io">
                <Button size="small" onClick={exportFavorites}>
                  导出收藏
                </Button>
                <Button size="small" onClick={() => favoritesInputRef.current?.click()}>
                  导入收藏
                </Button>
                <input
                  ref={favoritesInputRef}
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) importFavoritesFile(file);
                    event.target.value = '';
                  }}
                />
              </div>
            </div>

            <div className="sidebar-section keyword-section">
              <Text strong>关键词</Text>
              <Input
                size="small"
                allowClear
                prefix={<SearchOutlined />}
                placeholder="筛选关键词"
                value={keywordQuery}
                onChange={event => setKeywordQuery(event.target.value)}
              />
              <div className="keyword-cloud">
                {visibleKeywords.map(([name, count]) => (
                  <Tag.CheckableTag
                    key={name}
                    className="keyword-chip"
                    checked={keyword === name}
                    onChange={() => setKeyword(keyword === name ? null : name)}
                  >
                    {name}
                    <span>{count}</span>
                  </Tag.CheckableTag>
                ))}
                {visibleKeywords.length === 0 && (
                  <Text type="secondary">没有匹配的关键词</Text>
                )}
                {totalKeywordCount > 120 && (
                  <Button
                    type="link"
                    size="small"
                    className="keyword-expand"
                    onClick={() => setShowAllKeywords(value => !value)}
                  >
                    {showAllKeywords ? '收起关键词' : `显示全部 ${totalKeywordCount} 个`}
                  </Button>
                )}
              </div>
            </div>
          </Sider>

          <Content className="app-content">
            {error && (
              <Alert
                type="error"
                showIcon
                message="加载失败"
                description={error}
              />
            )}
            {!catalog && !error && (
              <div className="loading">
                <Spin size="large" />
              </div>
            )}

            {catalog && (
              <>
                <div className="toolbar">
                  <Input
                    allowClear
                    size="large"
                    prefix={<SearchOutlined />}
                    placeholder="搜索名称、场景、描述、关键词，如：数字 增长 / camera"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                  />
                  <Button
                    icon={<ClearOutlined />}
                    onClick={resetFilters}
                    disabled={activeFilters.length === 0 && !query}
                  >
                    清空
                  </Button>
                </div>

                {catalog && (
                  <div className="results-summary">
                    <Text>
                      共 <strong>{catalog.stats.total}</strong> 个动效 · 当前{' '}
                      <strong>{filtered.length}</strong> 个结果 ·{' '}
                      <strong>{catalog.stats.missingPreviews}</strong> 个缺预览
                    </Text>
                  </div>
                )}

                {activeFilters.length > 0 && (
                  <div className="active-filters">
                    <Text type="secondary">当前筛选</Text>
                    {activeFilters.map(item => (
                      <Tag key={item.key} closable onClose={item.clear}>
                        {item.label}
                      </Tag>
                    ))}
                  </div>
                )}

                <List
                  grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
                  pagination={{
                    current: page,
                    pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: [6, 12, 24],
                    showTotal: total => `共 ${total} 条`,
                    onChange: (nextPage, nextPageSize) => {
                      setPage(nextPage);
                      setPageSize(nextPageSize);
                      setLoadedPreviews(new Set());
                    },
                  }}
                  dataSource={filtered}
                  locale={{ emptyText: <Empty description="没有匹配的动效" /> }}
                  renderItem={record => (
                    <List.Item>
                      <Card
                        className="motion-card"
                        hoverable
                        role="button"
                        tabIndex={0}
                        aria-label={`查看 ${record.title} 详情`}
                        cover={
                          <div
                            className="cover-shell"
                            onMouseEnter={() => scheduleHoverPreview(record)}
                            onMouseLeave={cancelHoverPreview}
                          >
                            {renderCardCover(record)}
                            {favoriteButton(record)}
                          </div>
                        }
                        onClick={() => setSelected(record)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelected(record);
                          }
                        }}
                      >
                        <div className="card-heading">
                          <div>
                            <span className="card-title">{record.title}</span>
                            <span className="card-name">{record.name}</span>
                          </div>
                          <Tag className="library-tag">{record.libraryLabel}</Tag>
                        </div>
                        <Paragraph ellipsis={{ rows: 3 }} className="card-description">
                          {record.description}
                        </Paragraph>
                        <div className="card-tags">
                          {record.category && <Tag>{record.category}</Tag>}
                          {record.keywords.slice(0, 4).map(item => (
                            <Tag key={item}>{item}</Tag>
                          ))}
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              </>
            )}
          </Content>
        </Layout>

        <Drawer
          className="detail-drawer"
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          width="min(880px, 92vw)"
          title={
            selected ? (
              <div className="drawer-title">
                <span>{selected.title}</span>
                <Tag>{selected.libraryLabel}</Tag>
              </div>
            ) : null
          }
          extra={selected && favoriteButton(selected)}
        >
          {selected && (
            <div className="drawer-content">
              <div className="detail-preview-shell">
                <Preview record={selected} detailed />
                {canRenderPreview(selected) && (
                  <div className="detail-render-row">
                    <Button
                      icon={<PlayCircleOutlined />}
                      loading={renderingId === selected.id}
                      onClick={() => requestRenderPreview(selected)}
                    >
                      {renderingId === selected.id ? '渲染中…' : '渲染本地预览（约 1-2 分钟）'}
                    </Button>
                  </div>
                )}
              </div>

              <Alert
                type={selected.license.includes('Noncommercial') ? 'warning' : 'info'}
                showIcon
                message={`许可证：${selected.license}`}
              />

              <Descriptions
                bordered
                size="small"
                column={{ xs: 1, sm: 2, md: 3 }}
                className="detail-descriptions"
              >
                <Descriptions.Item label="类别">
                  {selected.category || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="复用能力">
                  {selected.reuseClass || '未标注'}
                </Descriptions.Item>
                <Descriptions.Item label="能量">
                  {selected.energy || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="时长">
                  {selected.duration || '-'}
                </Descriptions.Item>
              </Descriptions>

              <div className="detail-section">
                <Text strong>描述</Text>
                <Paragraph>{selected.description}</Paragraph>
              </div>

              {selected.use && (
                <div className="detail-section">
                  <Text strong>适用场景</Text>
                  <Paragraph>{selected.use}</Paragraph>
                </div>
              )}

              <div className="detail-section">
                <Text strong>关键词</Text>
                <div className="card-tags">
                  {selected.keywords.map(item => (
                    <Tag
                      key={item}
                      className="keyword-tag"
                      onClick={() => {
                        setKeyword(item);
                        setSelected(null);
                      }}
                    >
                      {item}
                    </Tag>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <div className="source-header">
                  <Text strong>源码</Text>
                  <div className="source-actions">
                    <Button
                      size="small"
                      icon={<CodeOutlined />}
                      onClick={() => toggleSource(selected)}
                    >
                      {source ? '收起源码' : '查看源码'}
                    </Button>
                    {source?.status === 'ready' && (
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => copyValue(source.content)}
                      >
                        复制代码
                      </Button>
                    )}
                  </div>
                </div>
                {source?.status === 'loading' && (
                  <div className="source-loading">
                    <Spin size="small" />
                  </div>
                )}
                {source?.status === 'error' && (
                  <Alert
                    type="error"
                    showIcon
                    message={`源码读取失败：${source.content}`}
                    description={`路径：${source.path}`}
                  />
                )}
                {source?.status === 'ready' && (
                  <pre className="source-view">{source.content}</pre>
                )}
              </div>

              <div className="detail-actions">
                <Button icon={<CopyOutlined />} onClick={() => copyValue(selected.id)}>
                  复制 ID
                </Button>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyValue(selected.sourcePath)}
                >
                  复制源码路径
                </Button>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyValue(selected.codePath)}
                >
                  复制代码路径
                </Button>
                {selected.previewUrl && (
                  <Button
                    icon={<ExportOutlined />}
                    href={selected.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    打开原始预览
                  </Button>
                )}
              </div>
            </div>
          )}
        </Drawer>
      </>
  );
}
