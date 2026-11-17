# epNN.motion-map.json · 编排中间产物

> Agent Skill `episode-fx-orchestrator` 的输出；再经 `motion-map-to-config.mjs` 合并进 `epNN.config.json`。

## 顶层

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `schemaVersion` | number | 是 | 固定 `1` |
| `meta` | object | 是 | 期次元信息（秒制时间轴的 fps/画幅/主题） |
| `segments` | array | 是 | 分段选卡列表 |
| `audio` | object | 否 | 可覆盖写入 config 的音量组 |

## `meta`

与 config 的 `meta` 对齐；另可含 `title` / `subtitle` / `source`（`srt` \| `plan`）。

## `segments[]`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 否 | 默认 `S0`… |
| `start` / `end` | number | 是 | **秒** |
| `intent` | string | 建议 | 开场 / 收尾 / 对比 / 计数 / 列表 / 字幕 / 强调 / 数据 / 转场 / 素材 / 通用 |
| `cardId` | string | 是 | 必须 `cards.whitelist.json` 且 `autoPick=true` |
| `params` | object | 否 | `title` `subtitle` `caption` `text` `items` |
| `confidence` | number | 否 | 0–1 |
| `reason` | string | 否 | 人审用 |

## 转换规则摘要

- `durationInFrames = round(end*fps) - round(start*fps)`
- cue 文案优先 `params.caption` → `text` → `title`
- 已有 config 时保留 `theme` 与 `audio` 基值（map.audio 可覆盖）
