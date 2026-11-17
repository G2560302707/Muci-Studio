import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { resolveStudioTheme } from './studio/themes.js';
import {
  activeAt,
  api,
  densityLabel,
  formatTime,
  frameToSec,
  friendlyCardName,
  fpsOf,
  intentColor,
  lintConfigFriendly,
  secToFrame,
  totalFramesOf,
  totalSecondsOf,
} from './studio/studioUtils.js';
import './studio/EpisodeStudio.css';

const DEFAULT_EPISODE = 'demo';
const GUIDE_KEY = 'episode-studio:guided-v1';

export default function EpisodeParams() {
  const [episodes, setEpisodes] = useState([]);
  const [episodeId, setEpisodeId] = useState(DEFAULT_EPISODE);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [leftTab, setLeftTab] = useState('cards');
  const [selCardId, setSelCardId] = useState(null);
  const [nowSec, setNowSec] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [lintCollapsed, setLintCollapsed] = useState(false);
  const [showGuide, setShowGuide] = useState(() => {
    try {
      return localStorage.getItem(GUIDE_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [listenUrl, setListenUrl] = useState('');
  const [exportHint, setExportHint] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const trackRef = useRef(null);
  const dragPlayhead = useRef(false);
  const rafRef = useRef(0);
  const lastTs = useRef(0);

  const base = useMemo(
    () => `/motion-workbench/api/episode/${encodeURIComponent(episodeId)}`,
    [episodeId],
  );

  const fps = fpsOf(config);
  const durationSec = totalSecondsOf(config);
  const durationFrames = totalFramesOf(config);
  const frame = Math.min(durationFrames - 1, Math.max(0, Math.floor(nowSec * fps)));
  const { card: liveCard, cue: liveCue } = useMemo(
    () => activeAt(config, frame),
    [config, frame],
  );
  const theme = resolveStudioTheme(config?.meta?.theme);
  const density = densityLabel(config);
  const lintIssues = useMemo(() => lintConfigFriendly(config), [config]);
  const cards = config?.cards || [];
  const selected = cards.find((c) => c.id === selCardId) || null;
  const selectedIndex = selected ? cards.findIndex((c) => c.id === selected.id) : -1;

  const loadList = useCallback(() => {
    api('/motion-workbench/api/episode')
      .then((data) => setEpisodes(data.episodes || []))
      .catch(() => {
        setEpisodes([{ id: 'demo', label: '产品样例 demo' }]);
      });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setListenUrl('');
    try {
      const data = await api(`${base}/config`);
      setConfig(data.config);
      const first = data.config?.cards?.[0]?.id || null;
      setSelCardId(first);
      setNowSec(0);
      setPlaying(false);
    } catch (err) {
      setConfig(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    load();
  }, [load]);

  const seekFromClientX = useCallback((clientX) => {
    const el = trackRef.current;
    if (!el || durationSec <= 0) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setNowSec(ratio * durationSec);
  }, [durationSec]);

  // 空格播放 + 播放头拖拽松手
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space') return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      setPlaying((p) => !p);
    };
    const onUp = () => {
      dragPlayhead.current = false;
    };
    const onMove = (e) => {
      if (!dragPlayhead.current) return;
      seekFromClientX(e.clientX);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [seekFromClientX]);

  // 播放推进
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      lastTs.current = 0;
      return undefined;
    }
    const tick = (ts) => {
      if (!lastTs.current) lastTs.current = ts;
      const dt = (ts - lastTs.current) / 1000;
      lastTs.current = ts;
      setNowSec((prev) => {
        const next = prev + dt;
        if (next >= durationSec) {
          setPlaying(false);
          return durationSec;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, durationSec]);

  const patchConfig = (updater) => {
    setConfig((prev) => (prev ? updater(prev) : prev));
  };

  const updateSelectedCard = (patch) => {
    if (!selected) return;
    patchConfig((prev) => {
      const nextCards = (prev.cards || []).map((c) =>
        (c.id === selected.id ? { ...c, ...patch, params: { ...(c.params || {}), ...(patch.params || {}) } } : c),
      );
      // 同步同 scene 的 cue 文案 / 时间
      let nextCues = prev.cues || [];
      const sceneId = selected.sceneId;
      if (sceneId && (patch.params?.caption != null || patch.from != null || patch.duration != null)) {
        nextCues = nextCues.map((cue) => {
          if (cue.sceneId !== sceneId) return cue;
          const next = { ...cue };
          if (patch.params?.caption != null) next.text = patch.params.caption;
          if (patch.from != null) next.from = patch.from;
          if (patch.duration != null) next.duration = patch.duration;
          return next;
        });
      }
      let nextScenes = prev.scenes || [];
      if (sceneId && patch.duration != null) {
        nextScenes = nextScenes.map((s) =>
          (s.id === sceneId ? { ...s, durationInFrames: patch.duration } : s),
        );
      }
      return { ...prev, cards: nextCards, cues: nextCues, scenes: nextScenes };
    });
  };

  const setTheme = (themeName) => {
    patchConfig((prev) => ({ ...prev, meta: { ...prev.meta, theme: themeName } }));
  };

  const setAudio = (key, value) => {
    patchConfig((prev) => ({ ...prev, audio: { ...(prev.audio || {}), [key]: value } }));
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setError('');
    try {
      const data = await api(`${base}/config`, {
        method: 'PUT',
        body: JSON.stringify({ config }),
      });
      setConfig(data.config);
      message.success('已保存');
    } catch (err) {
      setError(err.message);
      message.error(人话错误(err.message));
    } finally {
      setSaving(false);
    }
  };

  const runRender = async (mode) => {
    if (!config) return;
    setBusy(mode === 'export' ? '正在出片，请稍等…' : '正在生成可听预览…');
    setExportHint(mode === 'export' ? '保存配置并渲染成片' : '保存配置并渲染试听');
    setError('');
    try {
      await api(`${base}/config`, {
        method: 'PUT',
        body: JSON.stringify({ config }),
      });
      const data = await api(`${base}/${mode}`, { method: 'POST', body: '{}' });
      const url = `${data.mediaUrl}?t=${Date.now()}`;
      setListenUrl(url);
      setExportHint(
        mode === 'export'
          ? '成片好了，可在下方播放或右键另存'
          : '试听好了，可在下方播放',
      );
      message.success(mode === 'export' ? '导出完成' : '试听完成');
    } catch (err) {
      setError(err.message);
      setExportHint('');
      message.error(人话错误(err.message));
    } finally {
      setBusy('');
    }
  };

  const loadDemo = async () => {
    setEpisodeId('demo');
    setShowGuide(false);
    try {
      localStorage.setItem(GUIDE_KEY, '1');
    } catch {
      /* ignore */
    }
    if (episodeId === 'demo') await load();
    message.success('已载入示例，按空格即可播放');
  };

  const dismissGuide = async (andLoad) => {
    try {
      localStorage.setItem(GUIDE_KEY, '1');
    } catch {
      /* ignore */
    }
    setShowGuide(false);
    if (andLoad) await loadDemo();
  };

  const learnOnce = async () => {
    try {
      await api(`${base}/review-log`, {
        method: 'POST',
        body: JSON.stringify({
          note: reviewNote || '编排台学一下',
          config,
        }),
      });
      message.success('已记下这次改动，下次可对助手说「学一下」');
      setReviewNote('');
      setMoreOpen(false);
    } catch (err) {
      message.error(人话错误(err.message));
    }
  };

  const selectCard = (card) => {
    setSelCardId(card.id);
    setNowSec(frameToSec(card.from || 0, fps));
    setPlaying(false);
  };

  if (loading) {
    return (
      <div className="es-app" style={{ alignItems: 'center', justifyContent: 'center' }}>
        正在打开编排台…
      </div>
    );
  }

  if (!config) {
    return (
      <div className="es-app" style={{ alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div>打不开这一期配置</div>
        <div style={{ color: 'var(--es-muted)' }}>{error || '未知错误'}</div>
        <button type="button" className="es-btn es-btn-primary" onClick={loadDemo}>
          载入示例试试
        </button>
      </div>
    );
  }

  const shown = liveCard ? 1 : 0;
  const startSec = selected ? frameToSec(selected.from || 0, fps) : 0;
  const endSec = selected
    ? frameToSec((selected.from || 0) + (selected.duration || 0), fps)
    : 0;

  return (
    <div className="es-app">
      {/* 1 顶栏 */}
      <header className="es-top">
        <div className="es-brand">
          编排台 <span>K-DISTILL</span>
        </div>
        <div className="es-tabs">
          <button type="button" className="es-tab is-on">
            做片子
          </button>
        </div>
        <div className="es-stats">
          <span>
            时间 <b className="es-accent">{formatTime(nowSec)}</b> / {formatTime(durationSec)}
          </span>
          <span>
            画面上 <b>{shown}/{cards.length}</b> 张
          </span>
          <span title={density.tip}>
            节奏 <b>{density.text}</b>
          </span>
          {selected ? (
            <span>
              选中 <b>{friendlyCardName(selected, Math.max(0, selectedIndex))}</b>
            </span>
          ) : null}
        </div>
        <div className="es-top-actions">
          <button type="button" className="es-btn" onClick={() => setPlaying((p) => !p)}>
            {playing ? '暂停' : '播放'}
          </button>
          <button
            type="button"
            className="es-btn"
            onClick={() => {
              setNowSec(0);
              setPlaying(false);
            }}
          >
            回到开头
          </button>
          <button type="button" className="es-btn" onClick={loadDemo}>
            载入示例
          </button>
          <button type="button" className="es-btn" disabled={saving} onClick={save}>
            {saving ? '保存中…' : '保存'}
          </button>
          <button
            type="button"
            className="es-btn"
            disabled={!!busy}
            onClick={() => runRender('preview')}
          >
            听一下
          </button>
          <button
            type="button"
            className="es-btn es-btn-primary"
            disabled={!!busy}
            onClick={() => runRender('export')}
          >
            导出成片
          </button>
          <div className="es-more">
            <button
              type="button"
              className="es-btn es-btn-ghost"
              onClick={() => setMoreOpen((v) => !v)}
            >
              更多
            </button>
            {moreOpen ? (
              <div className="es-more-menu">
                <label>
                  选期次
                  <select
                    className="es-select"
                    value={episodeId}
                    onChange={(e) => {
                      setEpisodeId(e.target.value);
                      setMoreOpen(false);
                    }}
                  >
                    {(episodes.length
                      ? episodes
                      : [{ id: 'demo', label: '产品样例 demo' }]
                    ).map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        {ep.label || ep.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  背景音乐大小
                  <input
                    className="es-input"
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={config.audio?.bgmGain ?? 0.45}
                    onChange={(e) => setAudio('bgmGain', Number(e.target.value))}
                  />
                </label>
                <label>
                  学一下（记下这次改动）
                  <textarea
                    className="es-textarea"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="例如：开场字幕再短一点"
                  />
                </label>
                <button type="button" className="es-btn" onClick={learnOnce}>
                  写入学习记录
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="es-body">
        {/* 2 左栏 */}
        <aside className="es-panel es-left">
          <div className="es-left-tabs">
            <button
              type="button"
              className={`es-left-tab${leftTab === 'cards' ? ' is-on' : ''}`}
              onClick={() => setLeftTab('cards')}
            >
              卡片
            </button>
            <button
              type="button"
              className={`es-left-tab${leftTab === 'cues' ? ' is-on' : ''}`}
              onClick={() => setLeftTab('cues')}
            >
              字幕
            </button>
          </div>

          {leftTab === 'cards' ? (
            <div className="es-card-list">
              {cards.map((card, index) => {
                const from = frameToSec(card.from || 0, fps);
                const to = frameToSec((card.from || 0) + (card.duration || 0), fps);
                return (
                  <button
                    key={card.id || index}
                    type="button"
                    className={`es-card-item${selCardId === card.id ? ' is-on' : ''}`}
                    onClick={() => selectCard(card)}
                  >
                    <span className="es-card-idx">{String(index + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="es-card-name">
                        <span className="es-dot" style={{ background: intentColor(card.intent) }} />
                        {friendlyCardName(card, index)}
                      </span>
                      <div className="es-card-desc">{card.intent || card.cardId || '画面卡'}</div>
                    </span>
                    <span className="es-card-time">
                      {formatTime(from)}–{formatTime(to)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="es-card-list">
              {(config.cues || []).map((cue, index) => (
                <button
                  key={cue.id || index}
                  type="button"
                  className={`es-cue-item${liveCue?.id === cue.id ? ' is-on' : ''}`}
                  onClick={() => {
                    setNowSec(frameToSec(cue.from || 0, fps));
                    setPlaying(false);
                    const hit = cards.find((c) => c.sceneId && c.sceneId === cue.sceneId);
                    if (hit) setSelCardId(hit.id);
                  }}
                >
                  <div className="es-card-desc">{formatTime(frameToSec(cue.from || 0, fps))}</div>
                  <div className="es-card-name">{cue.text || '（空字幕）'}</div>
                </button>
              ))}
            </div>
          )}

          <div className="es-foot">
            <div className="es-panel-title" style={{ padding: 0 }}>
              整片主题
            </div>
            <div className="es-theme-row">
              <button
                type="button"
                className={`es-theme-btn${config.meta?.theme !== 'blackGold' ? ' is-on' : ''}`}
                onClick={() => setTheme('whiteWindow')}
              >
                白窗紫
              </button>
              <button
                type="button"
                className={`es-theme-btn${config.meta?.theme === 'blackGold' ? ' is-on' : ''}`}
                onClick={() => setTheme('blackGold')}
              >
                黑金
              </button>
            </div>
          </div>
        </aside>

        {/* 3 中画布 */}
        <section className="es-center" style={{ position: 'relative' }}>
          <div className="es-stage-wrap">
            <div className="es-stage" style={{ background: theme.stageBg, color: theme.ink }}>
              <div className="es-stage-guide" />
              <div className="es-stage-top">
                <div>
                  <div className="es-stage-ep">{config.meta?.episode || episodeId}</div>
                  <div className="es-stage-title">{config.copy?.title || '未命名片子'}</div>
                  <div className="es-stage-sub">{config.copy?.subtitle || ''}</div>
                </div>
                <div className="es-stage-pill" style={{ background: theme.accent, color: theme.onAccent }}>
                  {theme.label}
                </div>
              </div>
              <div
                className="es-stage-body"
                style={{
                  background: theme.paper,
                  border: `2px solid ${theme.accent}33`,
                  color: theme.ink,
                }}
              >
                <div className="es-stage-cardid">
                  {liveCard
                    ? `${friendlyCardName(liveCard, cards.indexOf(liveCard))} · ${liveCard.intent || ''}`
                    : '（这一秒没有卡片）'}
                </div>
                <div className="es-stage-main">
                  {liveCard?.params?.title || liveCue?.text || '改左边/右边的文字，这里马上变'}
                </div>
                {Array.isArray(liveCard?.params?.items) ? (
                  <ul className="es-stage-items">
                    {liveCard.params.items.map((item, i) => (
                      <li key={i}>{String(item)}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {liveCue?.text ? (
                <div
                  className="es-stage-cap"
                  style={{ background: theme.subBubble, color: theme.subText }}
                >
                  {liveCue.text}
                </div>
              ) : null}

              {!cards.length ? (
                <div className="es-empty-stage">
                  <p>还没有卡片。先载入示例，看一眼完整片子长什么样。</p>
                  <button type="button" className="es-btn es-btn-primary" onClick={loadDemo}>
                    载入示例，先看一眼
                  </button>
                </div>
              ) : null}
            </div>

            {lintIssues.length && !lintCollapsed ? (
              <div className="es-lint">
                <div className="es-lint-title">
                  <span>体检</span>
                  <button type="button" className="es-btn es-btn-ghost" onClick={() => setLintCollapsed(true)}>
                    收起
                  </button>
                </div>
                {lintIssues.slice(0, 6).map((issue, i) => (
                  <div
                    key={i}
                    className={`es-lint-item${issue.severity === 'error' ? ' is-error' : ''}`}
                  >
                    {issue.severity === 'error' ? '需要改：' : '建议：'}
                    {issue.message}
                  </div>
                ))}
              </div>
            ) : null}

            {lintIssues.length && lintCollapsed ? (
              <button
                type="button"
                className="es-lint"
                style={{ cursor: 'pointer', textAlign: 'left' }}
                onClick={() => setLintCollapsed(false)}
              >
                体检有 {lintIssues.length} 条，点开看
              </button>
            ) : null}

            {busy || exportHint ? (
              <div className="es-export-float">
                <div><strong>{busy ? '进行中' : '完成'}</strong></div>
                <div style={{ marginTop: 6, color: 'var(--es-muted)' }}>{busy || exportHint}</div>
              </div>
            ) : null}

            {busy ? <div className="es-busy">{busy}</div> : null}
          </div>

          {listenUrl ? (
            <div className="es-listen">
              <span style={{ fontSize: 12, color: 'var(--es-muted)' }}>可听预览</span>
              <video src={listenUrl} controls />
              <a className="es-btn" href={listenUrl} download>
                下载
              </a>
            </div>
          ) : null}

          {/* 5 时间轴 */}
          <div className="es-timeline">
            <div className="es-tl-meta">
              <div>{formatTime(nowSec)}</div>
              <div>共 {formatTime(durationSec)}</div>
              <div style={{ color: 'var(--es-faint)' }}>空格 = 播放</div>
            </div>
            <div
              className="es-tl-track"
              ref={trackRef}
              onMouseDown={(e) => {
                dragPlayhead.current = true;
                seekFromClientX(e.clientX);
                setPlaying(false);
              }}
              onMouseMove={(e) => {
                if (!dragPlayhead.current) return;
                seekFromClientX(e.clientX);
              }}
              onMouseUp={() => {
                dragPlayhead.current = false;
              }}
              onMouseLeave={() => {
                dragPlayhead.current = false;
              }}
            >
              {cards.map((card, index) => {
                const left = durationSec > 0 ? (frameToSec(card.from || 0, fps) / durationSec) * 100 : 0;
                const width = durationSec > 0
                  ? (frameToSec(card.duration || 0, fps) / durationSec) * 100
                  : 0;
                return (
                  <div
                    key={card.id || index}
                    className={`es-tl-bar${selCardId === card.id ? ' is-on' : ''}`}
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 1.2)}%`,
                      background: intentColor(card.intent),
                    }}
                    title={friendlyCardName(card, index)}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      selectCard(card);
                    }}
                  >
                    {friendlyCardName(card, index)}
                  </div>
                );
              })}
              <div
                className="es-tl-playhead"
                style={{ left: `${durationSec > 0 ? (nowSec / durationSec) * 100 : 0}%` }}
              />
            </div>
          </div>
        </section>

        {/* 4 右栏 */}
        <aside className="es-panel es-right">
          <div className="es-panel-title">
            这一张
            <span className="es-panel-sub">{selected ? '可立刻改' : '先选卡'}</span>
          </div>
          {!selected ? (
            <div className="es-empty">左边点一张卡，这里才会出现可改的内容。</div>
          ) : (
            <div className="es-params">
              <div className="es-field">
                <label>说什么 · 标题</label>
                <input
                  className="es-input"
                  value={selected.params?.title || ''}
                  onChange={(e) => updateSelectedCard({ params: { title: e.target.value } })}
                  placeholder="画面上的大标题"
                />
              </div>
              <div className="es-field">
                <label>说什么 · 字幕</label>
                <textarea
                  className="es-textarea"
                  value={selected.params?.caption || ''}
                  onChange={(e) => updateSelectedCard({ params: { caption: e.target.value } })}
                  placeholder="底部字幕，尽量短一点"
                />
              </div>
              <div className="es-field">
                <label>说什么 · 要点（一行一条）</label>
                <textarea
                  className="es-textarea"
                  value={Array.isArray(selected.params?.items) ? selected.params.items.join('\n') : ''}
                  onChange={(e) => {
                    const items = e.target.value.split('\n').filter((line) => line.trim() !== '');
                    updateSelectedCard({ params: { items } });
                  }}
                  placeholder={'例如：\n第一步\n第二步'}
                />
              </div>
              <div className="es-field">
                <label>什么时候出现（秒）</label>
                <div className="es-row">
                  <input
                    className="es-input"
                    type="number"
                    min={0}
                    step={0.1}
                    value={Number(startSec.toFixed(1))}
                    onChange={(e) => {
                      const start = Number(e.target.value) || 0;
                      const end = Math.max(start + 0.2, endSec);
                      updateSelectedCard({
                        from: secToFrame(start, fps),
                        duration: secToFrame(end - start, fps),
                      });
                    }}
                  />
                  <input
                    className="es-input"
                    type="number"
                    min={0.2}
                    step={0.1}
                    value={Number(endSec.toFixed(1))}
                    onChange={(e) => {
                      const end = Number(e.target.value) || 0;
                      const start = Math.min(startSec, end - 0.2);
                      updateSelectedCard({
                        from: secToFrame(start, fps),
                        duration: secToFrame(end - start, fps),
                      });
                    }}
                  />
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--es-faint)' }}>
                  左：开始 · 右：结束（约 {selected.duration || 0} 帧）
                </div>
              </div>
              <div className="es-field">
                <label>卡片类型</label>
                <div style={{ fontSize: 13, color: 'var(--es-muted)' }}>
                  {selected.cardId || '—'} · {selected.intent || '通用'}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {error ? (
        <div className="es-export-float" style={{ left: 12, right: 'auto', bottom: 120 }}>
          <strong style={{ color: 'var(--es-danger)' }}>出了点问题</strong>
          <div style={{ marginTop: 6 }}>{人话错误(error)}</div>
        </div>
      ) : null}

      {showGuide ? (
        <div className="es-guide">
          <div className="es-guide-card">
            <h2>编排台五块地方</h2>
            <ol>
              <li><strong>顶栏</strong>：播放、保存、导出</li>
              <li><strong>左边</strong>：这一期有哪些卡片 / 字幕</li>
              <li><strong>中间</strong>：现在画面长什么样（改字马上变）</li>
              <li><strong>右边</strong>：只改你选中的那一张</li>
              <li><strong>底下</strong>：时间轴，点色块就能跳转</li>
            </ol>
            <button type="button" className="es-btn es-btn-primary" onClick={() => dismissGuide(true)}>
              知道了，载入示例
            </button>
            <button
              type="button"
              className="es-btn"
              style={{ marginLeft: 8 }}
              onClick={() => dismissGuide(false)}
            >
              先自己看
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function 人话错误(msg) {
  const raw = String(msg || '');
  if (/ECONNREFUSED|Failed to fetch|NetworkError/i.test(raw)) {
    return '服务好像没开。请确认工作台页面是从本机启动的。';
  }
  if (/找不到配置|ENOENT/i.test(raw)) {
    return '这一期的配置文件找不到。点「载入示例」试试看。';
  }
  if (/schemaVersion|theme|非法/i.test(raw)) {
    return '有些填写不合法，看看右栏时间和字幕是否填完整。';
  }
  return raw || '未知错误';
}
