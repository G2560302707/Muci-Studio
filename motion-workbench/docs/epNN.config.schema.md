# epNN.config.json · 字段说明（P1）

> 建立：2026-11-16　性质：**纯设计**，供 P2 成片参数页直接套用。  
> 依据：`PLAN-工作台W1盘点与方案.md` §2 / §5 / §6；交接清单 P1。  
> **本文件不改任何期次工程代码**；示例数据仅作字段示意。

## 1. 目录约定

| 项 | 约定 |
|---|---|
| 运行时配置 | `muci-engine/components/src/epNN/epNN.config.json`（与 `Episode.tsx` 同级） |
| 类型（可选后续） | 同目录 `epNN.config.types.ts`，或工作台共享一份 JSON Schema |
| 成品包副本 | 随工程入 `作品库/epNN-*/assets/project/`（裁决 C6；不含 node_modules / 密钥 / 私人路径） |
| 不放这里 | `epNN/` 策划目录（稿、素材、配音仍在策划侧） |

配置与代码分离：面板 / 脚本只改 JSON；场景装配层读配置渲染。P1 阶段**不要求**现有 `Episode.tsx` 立刻改读 JSON。

## 2. 最小闭环（W2 先开放的 2 项）

面板第一期只保证能改并回写：

1. **字幕文字** → `cues[].text`（可只改 text，不动 `from` / `duration`）
2. **主题色** → `meta.theme`（`"whiteWindow"` \| `"blackGold"`，对应 `src/style/themes.ts` 的 `ThemeName`）

其余字段先写入 schema，控件可后续迭代。

## 3. 顶层结构

```json
{
  "schemaVersion": 1,
  "meta": {},
  "scenes": [],
  "cues": [],
  "copy": {},
  "media": [],
  "audio": {}
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `schemaVersion` | number | 是 | 固定 `1`；破坏性变更才 +1 |
| `meta` | object | 是 | 期次元信息 + 主题 |
| `scenes` | array | 是 | 镜头时长表（帧，半开区间由累加得到） |
| `cues` | array | 是 | 字幕 cue 表（与 `SubtitleCue` 对齐） |
| `copy` | object | 否 | 字卡/开场/结尾等非字幕文案袋 |
| `media` | array | 否 | 素材清单（文件名相对 `public/` 或策划 `assets/`） |
| `audio` | object | 否 | 音量组（口播 / 音效 / BGM） |

## 4. `meta`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `episode` | string | 是 | 如 `"demo"` / `"ep01"` |
| `slug` | string | 否 | 如 `"magpie"`；归档文件夹名用 |
| `width` | number | 是 | 如 `1920` |
| `height` | number | 是 | 如 `1080` |
| `fps` | number | 是 | 默认 `30` |
| `theme` | `"whiteWindow"` \| `"blackGold"` | 是 | **P2 可改**；映射 `themes.ts`，禁止在此写具体色值（标准隔离） |
| `compositionId` | string | 否 | Remotion Composition id，预览/导出用 |

画幅由 `width`×`height` 表达；一期一个画幅，中途不改（根 README 规则 7）。

## 5. `scenes[]`（镜头时长表）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 如 `"S0"` / `"S1"`，与分镜表一致 |
| `durationInFrames` | number | 是 | 该镜占用帧数（30fps）；对应现装配层 `sceneDurations[i]` |
| `label` | string | 否 | 人读备注 |

`sceneStarts` **不入库**：由 `durationInFrames` 前缀和推导，避免双源不一致。

## 6. `cues[]`（字幕）

与组件契约对齐（`src/components/Subtitle.tsx`）：

```ts
type SubtitleCue = { text: string; from: number; duration: number };
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 否 | 稳定键，面板编辑用（如 `"c1"`） |
| `text` | string | 是 | **P2 可改**；空字符串表示该镜不挂字幕条 |
| `from` | number | 是 | 起帧（整片时间轴，含前面镜子） |
| `duration` | number | 是 | 持续帧数；有效区间 `[from, from+duration)` |
| `sceneId` | string | 否 | 归属镜号，便于互校 |

导出 SRT（P3）时：用 `fps` 把 `from` / `duration` 换成时码，只输出 `text` 非空的 cue。

## 7. `copy`（文案袋，可选）

自由对象，键由期次约定。示例键：

- `opening`：开场标题/副行/痛点（对应 Opening props）
- `outro`：结尾 CTA
- `cards`：字卡数组

P2 第一期**可以不做** copy 编辑；字段预留即可。

## 8. `media[]`（素材清单，可选）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 稳定键 |
| `file` | string | 是 | 相对路径或 `staticFile` 用名 |
| `kind` | `"img"` \| `"video"` \| `"audio"` \| `"other"` | 否 | |
| `sceneId` | string | 否 | 主要使用镜 |
| `note` | string | 否 | |

## 9. `audio`（音量组，可选）

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `voiceGain` | number | `1` | 口播增益 |
| `sfxGain` | number | `1` | 音效总增益（细项可后期再拆） |
| `bgmGain` | number | 如 `0.55` | BGM 增益；优先级规则仍是人声 > 音效 > BGM |

不在此写入私人 BGM 绝对路径；只写工程内相对名或「沿用上期轨」类标记。

## 10. 示例（示意，非某期事实源）

见同目录 [`epNN.config.example.json`](./epNN.config.example.json)。

## 11. `cards[]`（编排卡引用，可选）

由 `epNN.motion-map.json` 经 `scripts/motion-map-to-config.mjs` 写入。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 如 `"card-S0"` |
| `sceneId` | string | 是 | 对应 `scenes[].id` |
| `cardId` | string | 是 | 白名单 id，如 `"core:FlashIntro"` |
| `intent` | string | 否 | 开场 / 对比 / 列表… |
| `params` | object | 否 | 文案类参数 |
| `from` / `duration` | number | 否 | 帧；与所属 cue 对齐 |
| `confidence` / `reason` | number / string | 否 | AI 编排说明 |

## 12. `audio` 补充

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `sfxEnabled` | boolean | `true` | 音效总开关 |

## 13. motion-map（编排中间产物）

路径：同目录 `epNN.motion-map.json`。字段见 [`epNN.motion-map.schema.md`](./epNN.motion-map.schema.md)。

转换：`node scripts/motion-map-to-config.mjs --episode epNN`

## 14. 验收对照（P1 + Overlay 对标）

- [x] 字段覆盖「改字幕文字 + 改主题色」
- [x] 配置落点在 `components/src/epNN/` 旁，不放策划目录
- [x] cue 形状与现有 `SubtitleCue` 一致，便于 P3 导出 SRT
- [x] 主题只写枚举名，不复制色值数字
- [x] 面板读写本结构
- [x] 支持 `cues` 时间 / `copy` / `scenes` 时长 / `audio` 面板编辑
- [x] `cards[]` + motion-map 编排链路

## 15. 明确不做（本文件范围）

- 不写剪映透明层导出字段
- 不做时间轴拖拽 / 多轨 / 通用编辑器字段
