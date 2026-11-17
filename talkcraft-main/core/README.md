# core/ — Talkcraft 白窗紫套件

> **不是独立「主库」。** 本目录是 Talkcraft（`talkcraft-main/`）内的一等公民套件：  
> 白窗紫 / 黑金双主题、横竖双画幅的可商用业务组件。  
> 2026-11-17 核对：与 `template/cards/`（PolyForm NC 参考卡）**无等价重复** → **保留并留在 Talkcraft**，不另建库、不删除。

渲染工作区 `muci-engine/components/src/` 从此处同步。

## 落盘信息

- **结构**：`components/`（业务 tsx + WindowShell）+ `lib/` + `style/` + `index.ts`
- **验证**：`tsc -p .`；改完跑 `node motion-workbench/scripts/sync-core-check.mjs`
- **预览 mp4**：`../muci-engine/components/out/previews/`

## 登记

原 13 业务组件 + WindowShell；2026-11-17 治理新增：`FocusHost`、`ChapterRail`、`EvidenceStat`（合计 16 业务组件）。  
选料真源：`../CATALOG.md` / `../catalog.json`。

## 同步规则

1. 先改本区，再同步渲染工程（或反向开发后回流，合并点仍在本区）
2. 新组件第二次复用时落盘：tsx + 本 README + catalog + 渲染侧 meta
3. 主题色变更须过像素回归
