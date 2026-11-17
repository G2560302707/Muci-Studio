# AGENTS.md · 幕次 Studio 开机引导

**产品**：幕次 Studio（Muci Studio）— 本地 AI 成片。  
**默认形态**：**②′ 整片模板**（选卡 → 对时间 → Remotion MP4）。  
① 自由拼接 = 进阶，见 `MODES.md` 与 `docs/advanced/freeform.md`。

## 必读顺序

1. 本文件（架构）  
2. `START-HERE.md`（默认 5 步）  
3. 本期 `episodes/epNN/README.md`  
4. 需要时才读 `MODES.md` / `docs/advanced/*`  

**禁止**默认阅读：`docs/internal/`，除非用户点名。

## 架构（只记这些）

| 路径 | 职责 |
|---|---|
| `talkcraft-main/` | **唯一**组件库（含 `core/` 白窗紫套件） |
| `muci-engine/` | Remotion 渲染工作区；场景在 `components/src/epNN/` 或 `demo/` |
| `custom-skills/` | Agent 技能 |
| `motion-workbench/` | 编排台 + 组件检索（默认打开编排台） |
| `episodes/` | 期次策划与素材 |
| `作品库/` | 成品橱窗 |

## 硬规矩

- 组件只查 Talkcraft；`core/` 不是第二套「主库」  
- 默认走 `episode-fx-orchestrator`（`autoPick=true`），不要一上来推形态① 四步选料  
- 库内无合适项须说明并获用户同意后才可原创  
- 一镜一做一审；静帧定稿前不渲 mp4  
- 每句口播出声时画面必须是该句所指内容  
- AI 生图须先授权；不得冒充真实截图  
- 图片规格 SSOT：`custom-skills/image-specs/`  
- 开场规范 SSOT：`custom-skills/opening-specs/`  
- 密钥不入库；文档里不要写本机绝对密钥路径  
- 改 `talkcraft-main/core/` 后跑 `node motion-workbench/scripts/sync-core-check.mjs`  
- catalog 真源：`talkcraft-main/catalog.json`；工作台 `motion-workbench/data/catalog.json` 为派生  

## Skills

**必装**：`episode-fx-orchestrator`、`image-specs`、`opening-specs`。

## 工程边界

- 形态 ②′ / ①：代码在 `muci-engine/components/`  
- 工作台 labs 模块：仅 `?labs=1` 时显示，非主路径  
- 成片栈：Remotion 4.0.515 + React 18；工作台预览 runtime 可能更新，以引擎成片为准  

> 与 `AGENTS.md` 内容一致，改一份须同步另一份。
