# Catalog 真源裁决（2026-11-17）

## 选料 / 编排唯一真源

**`talkcraft-main/catalog.json`**

- Agent 与人工选组件、编排白名单生成（`build-orchestrator-cards.mjs`）、静帧 `posterUrl` 均以此为准。
- 改条目：改主库登记或跑 `motion-workbench/scripts/build-master-catalog.py` 重建后提交。

## 工作台索引（生成物）

**`motion-workbench/data/catalog.json`**

- 仅供工作台检索 UI / 预览覆盖；由 `npm run catalog`（`scripts/build-catalog.mjs`）生成。
- **禁止手改业务字段**；中文 enrich 走 `merge-zh-*.py` 后必须重跑 master catalog。
- 备份文件进 `_旧/catalog-backups/`，不放 `data/`。

## 历史只读（禁选料）

**`muci-engine/repo/library/catalog.json`**

- FredTalk 历史快照；**禁止**作为现行选料或编排输入。
