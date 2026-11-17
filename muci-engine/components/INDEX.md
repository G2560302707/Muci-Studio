# Component Index

> **主库指针（2026-11-14）**：本工程是**渲染工作区**，不是组件库。组件源码的唯一主库在
> `../../talkcraft-main/`（INDEX.md + catalog.json 1300 条）。本工程 `src/components|lib|style/`
> 的组件代码与主库 `core/` 同步（合并点以主库为准）；新组件第二次复用时落盘主库。

Approved components follow the BenBen white-window standard. Each business component has:

- Source: `src/components/<Name>.tsx`
- Metadata: `library/<Name>/meta.json`
- Preview: `out/previews/<Name>.mp4`

| Component | Status | Notes | Relations |
|---|---|---|---|
| ChapterCard | approved | tutorial chapter divider | 章节 · 转场 · 教程 |
| PillTags | approved | animated tag group | 标签 · 功能点 · 关键词 |
| ScreenCard | approved | screenshot/screen recording card | 录屏 · 截图 · 演示 |
| RankingIntro | approved | ranked project intro card | 榜单 · 清单 · 排名 |
| ProjectCard | approved | ranked project detail card | 项目 · 开源 · 详情 |
| OutroCard | approved | final recommendation card | 结尾 · 互动 · 引导 |
| Backdrop | approved | subtle white stage background | 背景 · 白底 · 层级 |
| MaskText | approved | masked text reveal | 文本 · 揭示 · 金句 |
| LightStage | approved | white stage for window carriers | 背景 · 白底 · 卡片 |
| NumberRoll | approved | numeric settle reveal | 数字 · 数据 · 增长 |
| FlashIntro | approved | opening OG card flash intro | 开场 · 榜单 · 闪入 |
| Subtitle | approved | bottom subtitle cue | 字幕 · 口播 · 时间轴 |
| BulletList | approved | sequential bullet reveal | 要点 · 列表 · 讲解 |

## Base Components

| Component | Role |
|---|---|
| WindowShell | shared white rounded window carrier; not registered as a standalone business component |

## 画幅参数化实施清单（2026-11-14，待执行）

目标：**1 套组件 × 2 风格（黑金 / 白窗紫）× 2 画幅（横 16:9 / 竖 9:16）**，不建 4 套组件。
起手工具已就位：`src/style/layout.ts` → `getFrameLayout(width, height)` 返回 `{ portrait, unit, s(px), cols, safeX, safeY, subtitleBottom, imageMaxHeight }`。纯新增、未接入，现有画面不变。

| 步 | 做什么 | 验收 |
|---|---|---|
| 0 | 统一基准：黑金字号表按 1080×1920、白窗组件按 720×1280，先都映射到同一逻辑舞台 | 同一组件在两种画幅下视觉大小一致 |
| 1 | 改 `WindowShell`：`maxWidth 920 / padding 88 / 圆角 36 / 标题栏 82 / 三点 18` → 全部 `L.s(...)` | 竖屏 720×1280 与改动前**逐帧一致** |
| 2 | 按依赖顺序改 13 个组件：`ScreenCard`（已用 `useVideoConfig`，抽成样板）→ `ProjectCard`（图高 600、字号 40）→ `BulletList`(82/64/18) / `MaskText`(34×66) → 其余 | 每个渲横竖两张静帧，含中间态 |
| 3 | 主题抽离：`src/ep04/style/tokens.ts` 拆成 `themes/white-window.ts` + `themes/black-gold.ts`，组件内不写颜色 | 4 种组合各出 1 张预览 |
| 4 | `Root.tsx` 加 `Preview-<Name>-portrait / -landscape`（现全部写死 1080×1920 / 720×1280）；`out/previews/` 补横竖预览 mp4 | 最长文案、字幕避让、字号 ≥24px、接缝对齐 |
| 5 | 本 INDEX 每组件标 `aspect: both` + `themes`；`library/<Name>/meta.json` 补 `layout` 字段 | 注册三件套（tsx + meta.json + 预览 mp4）齐全 |

**两个坑**：① 等比缩放只解决「字/图在不在画内」，横屏该单列还是双列要单独布局分支（`cols` 已留口）；② 改完先确认竖屏与 ep04 过审帧一致，再动横屏，别把已过审画面改坏。
