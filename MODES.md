# 幕次 Studio · 创作形态

**默认：②′ 整片模板。** 一期只走一种形态，禁止半程切换。

## 对照表

| 形态 | 名称 | 何时用 | 工程入口 | 产出 |
|---|---|---|---|---|
| **②′（默认）** | 整片模板 | 日常口播/新闻/知识 | `episode-fx-orchestrator` + `muci-engine` + 编排台 | Remotion **MP4** |
| **① 专家** | 自由拼接 | 结构特殊、品牌深定制 | Talkcraft 手选 + `muci-engine` | Remotion **MP4** |

## 默认 ②′ 怎么走

见 [`START-HERE.md`](START-HERE.md)。一句话：SRT/文案 → 选卡 → `map:to-config` → 编排台 → lint → 导出。

## ① 自由拼接

- 组件：`talkcraft-main/`  
- 选料四步：[`docs/advanced/freeform.md`](docs/advanced/freeform.md)

## 目录关系

```
Muci-Studio/                    ← 幕次 Studio 根
├── talkcraft-main/             ← 唯一组件库
├── muci-engine/                ← Remotion（②′ / ①）
├── motion-workbench/           ← 编排台 + 检索
├── episodes/                   ← 期次策划
├── custom-skills/
│   └── episode-fx-orchestrator/  ← ②′
└── 作品库/                     ← 成品橱窗
```
