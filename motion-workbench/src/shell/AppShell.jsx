import React, { useEffect, useMemo, useState } from 'react';
import { ConfigProvider, Layout } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { fetchDistillGroups, fetchJson } from './distillData.js';
import { getModules, labsEnabled } from './modules.jsx';
import { themeByMode } from './theme.js';

const { Sider, Header, Content } = Layout;
const DEFAULT_ROUTE = 'episode-params';

function routeFromHash(modules) {
  const raw = decodeURIComponent(window.location.hash.replace(/^#\/?/, '')).split('/')[0];
  if (modules.some(m => m.key === raw)) return raw;
  return DEFAULT_ROUTE;
}

const THEME_KEY = 'motion-workbench:theme';

export default function AppShell() {
  const modules = useMemo(() => getModules(), []);
  const showLabs = labsEnabled();
  const [route, setRoute] = useState(() => routeFromHash(modules));
  const [themeMode, setThemeMode] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' ? 'light' : 'dark';
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [waitingCount, setWaitingCount] = useState(0);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash(modules));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [modules]);

  // 无 hash 时落到编排台
  useEffect(() => {
    const raw = decodeURIComponent(window.location.hash.replace(/^#\/?/, '')).split('/')[0];
    if (!raw) {
      window.location.hash = `/${DEFAULT_ROUTE}`;
    }
  }, []);

  const applyThemeMode = mode => {
    if (mode !== 'dark' && mode !== 'light') return;
    setThemeMode(mode);
    localStorage.setItem(THEME_KEY, mode);
    document.documentElement.dataset.theme = mode;
  };
  useEffect(() => { document.documentElement.dataset.theme = themeMode; }, [themeMode]);

  useEffect(() => {
    if (!showLabs) return undefined;
    let alive = true;
    const refresh = () => Promise.all([
      fetchJson('/motion-workbench/data/waiting-area.json'),
      fetchDistillGroups(),
    ]).then(([waiting, groups]) => {
      if (!alive) return;
      const pending = groups.reduce((acc, g) => acc + (g.records || []).filter(r => (r.review || {}).status === 'pending').length, 0);
      const manualWaiting = (waiting.items || []).filter(item => item.status !== 'deposited').length;
      const distillWaiting = groups.reduce((acc, g) => acc + (g.records || []).filter(r => (r.deposit || {}).status === 'eligible').length, 0);
      setPendingCount(pending);
      setWaitingCount(manualWaiting + distillWaiting);
    }).catch(() => {});
    refresh();
    window.addEventListener('distill-review-changed', refresh);
    return () => { alive = false; window.removeEventListener('distill-review-changed', refresh); };
  }, [showLabs]);

  const active = useMemo(
    () => modules.find(m => m.key === route) || modules.find(m => m.key === DEFAULT_ROUTE) || modules[0],
    [modules, route],
  );
  const flush = route === 'episode-params';

  return (
    <ConfigProvider locale={zhCN} theme={themeByMode(themeMode)}>
      <Layout className="kd-layout app-shell">
        <Sider width={216} className="kd-sider">
          <div className="kd-brand">
            <span className="kd-brand-latin">MUCI</span>
            <span className="kd-brand-pipe" aria-hidden />
            <span className="kd-brand-cn">幕次 Studio</span>
            <span className="kd-brand-chip">STUDIO</span>
            <span className="kd-frame-tick" aria-hidden />
          </div>
          <nav className="kd-nav">
            {modules.map(m => {
              const selected = m.key === route;
              return (
                <div
                  key={m.key}
                  className={`kd-nav-item${selected ? ' is-on' : ''}`}
                  onClick={() => { window.location.hash = `/${m.key}`; setRoute(m.key); }}
                >
                  <span className="kd-nav-icon">{m.icon}</span>
                  {m.label}
                  {showLabs && m.key === 'review' && pendingCount > 0 && (
                    <span className="kd-nav-badge">{pendingCount}</span>
                  )}
                  {showLabs && m.key === 'waiting-area' && waitingCount > 0 && (
                    <span className="kd-nav-badge">{waitingCount}</span>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="kd-foot">
            {showLabs ? 'LABS ON · ?labs=1' : 'DEFAULT · ②′ 整片模板'}
          </div>
        </Sider>

        <Layout>
          <Header className="kd-header">
            <div className="kd-crumb">
              <span className="kd-crumb-kicker">幕次 Studio</span>
              <span className="kd-crumb-label">{active.label}</span>
            </div>
            <div className="kd-meters">
              {showLabs && (
                <>
                  <div className={`kd-meter${pendingCount > 0 ? ' is-volt' : ''}`}>
                    <span className="kd-meter-k">PENDING</span>
                    <span className="kd-meter-v">{pendingCount}</span>
                  </div>
                  <div className={`kd-meter${waitingCount > 0 ? ' is-cyan' : ''}`}>
                    <span className="kd-meter-k">QUEUE</span>
                    <span className="kd-meter-v">{waitingCount}</span>
                  </div>
                </>
              )}
              <div className="kd-meter">
                <span className="kd-meter-k">MODULE</span>
                <span className="kd-meter-v">{active.key}</span>
              </div>
            </div>
            <div className="kd-theme-switch" role="group" aria-label="主题切换">
              <button
                type="button"
                className={`kd-theme-btn${themeMode === 'dark' ? ' is-on' : ''}`}
                onClick={() => applyThemeMode('dark')}
              >
                <MoonOutlined /> 深色
              </button>
              <button
                type="button"
                className={`kd-theme-btn${themeMode === 'light' ? ' is-on' : ''}`}
                onClick={() => applyThemeMode('light')}
              >
                <SunOutlined /> 浅色
              </button>
            </div>
            <span className="kd-header-tick" aria-hidden />
          </Header>
          <Content className={`kd-content${flush ? ' is-flush' : ''}`}>
            <active.component themeMode={themeMode} />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
