# 幕次 Studio / Muci Studio

本地 AI 成片系统：把口播或字幕，变成可改参、可复用的 Remotion 短视频。

Local AI video production: turn narration or subtitles into editable, reusable Remotion short videos.

---

## 项目介绍 · About

**中文**

幕次 Studio 面向口播 / 知识 / 新闻类短视频制作。默认走「整片模板」路径：AI 只负责从白名单动效卡里选卡并对时间，人在编排台改字幕、主题、时长与音量，最后用 Remotion 导出 MP4。组件统一来自 Talkcraft，避免临时硬凑画面。

适合：本地可控、可复盘、可迭代的内容产线；不适合一键黑盒生成整片。

**English**

Muci Studio is a local pipeline for talk-style, knowledge, and news short videos. The default path is a full-episode template: the AI picks motion cards from a whitelist and aligns timing; you tune subtitles, theme, duration, and audio in the workbench; then Remotion exports MP4. All reusable visuals come from Talkcraft—no ad-hoc filler slides.

Built for controllable, reviewable, iterative local production—not one-click black-box generation.

---

## 默认流程 · Default workflow

口播 / SRT → AI 选卡对时间 → 编排台改参 → Remotion 导出 MP4

Narration / SRT → AI card pick & timing → workbench edits → Remotion MP4

> 开工：[`START-HERE.md`](START-HERE.md)  
> Agent：[`AGENTS.md`](AGENTS.md)  
> 形态对照：[`MODES.md`](MODES.md)

| 形态 Mode | 说明 | 产出 Output |
|---|---|---|
| **②′ 整片模板（默认）** | 日常主路径 | MP4 |
| **① 自由拼接** | 专家手装组件 | MP4 |

---

## 架构 · Architecture

| 目录 Path | 职责 Role |
|---|---|
| `talkcraft-main/` | 唯一组件库 · component library |
| `muci-engine/` | Remotion 渲染引擎 · render engine |
| `custom-skills/` | Agent 技能（编排 + 规格） |
| `motion-workbench/` | 编排台 + 组件检索 · workbench |
| `episodes/` | 期次策划 · episode planning |
| `作品库/` | 成品橱窗 · delivered packages |

---

## 快速开始 · Quick start

需要 **Node.js 20+**。请遵守 [Remotion 许可](https://www.remotion.dev/docs/license)。密钥不要入库。

Requires **Node.js 20+**. Follow the [Remotion license](https://www.remotion.dev/docs/license). Do not commit secrets.

```bash
npm run bootstrap
npm run demo
npm run workbench
```

| 命令 Command | 作用 |
|---|---|
| `npm run bootstrap` | 安装依赖 · install deps |
| `npm run demo` | 跑产品样例 · run sample |
| `npm run workbench` | 打开编排台 · open workbench |
| `npm run new-episode -- ep01` | 新建一期 · scaffold episode |

样例：`episodes/demo/` ↔ `muci-engine/components/src/demo/`  
工作台默认打开编排台；治理模块需 `?labs=1`。

---

## 许可 · License

- 本仓库自有组件与技能请在开源分发前另行整理 LICENSE。  
- `talkcraft-main/external/` 等含第三方来源，再分发前核对上游许可。  
- Remotion 商用须符合其公司条款。

Project-owned code/skills need an explicit LICENSE before redistribution. Third-party assets under `talkcraft-main/external/` and Remotion usage must follow their respective terms.

---

## 文档 · Docs

| 文档 | 用途 |
|---|---|
| [`START-HERE.md`](START-HERE.md) | 开工 5 步 |
| [`AGENTS.md`](AGENTS.md) | Agent 架构引导 |
| [`MODES.md`](MODES.md) | 创作形态 |
| [`docs/advanced/freeform.md`](docs/advanced/freeform.md) | 自由拼接 |
| [`docs/internal/`](docs/internal/) | 内部归档（非日常必读） |
