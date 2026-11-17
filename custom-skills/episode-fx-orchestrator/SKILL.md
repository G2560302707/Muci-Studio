# episode-fx-orchestrator

按口播 / SRT **只从白名单动效卡里选卡并对时间**，产出 `epNN.motion-map.json`。  
人再在 `motion-workbench` 成片参数页改文案、主题、时长、音量——**零 token 微调，禁止让模型重抽整段**。

## 何时用

- 新一期已有 `episodes/epNN/plan.md` 口播，或已有草稿/最终 SRT
- 需要「AI 编排 → 人审 → 面板改参 → 预览导出」默认支路（见根目录 `START-HERE.md`，形态 **②′**）
- **仅 Remotion 整片**

## 不做什么

- 不现场发明未入库组件
- 不自动选用 `video-talkcraft`（PolyForm NC，仅参考；见 `cards.whitelist.json` 的 `autoPick=false`）
- 不做时间轴拖拽编辑器

## 输入

1. `episodes/epNN/plan.md`（口播 + 分镜意图）+ `episodes/epNN/README` 题材勾选  
2. 字幕：优先 `*.srt`；没有则从口播稿按句切 cue 草稿并标明 `draft: true`  
3. 本目录 `cards.whitelist.json`（只读 `autoPick: true` 的卡）  
4. 可选子集：`cards.whitelist.<题材>.json` 的 `preferredCardIds`（仍须主白名单 autoPick）

## 输出

路径：`muci-engine/components/src/epNN/epNN.motion-map.json`

```json
{
  "schemaVersion": 1,
  "meta": {
    "episode": "ep01",
    "slug": "pilot",
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "theme": "whiteWindow",
    "title": "期次标题",
    "subtitle": "一句话",
    "source": "srt|plan"
  },
  "segments": [
    {
      "id": "S0",
      "start": 0,
      "end": 3.0,
      "intent": "开场",
      "cardId": "core:FlashIntro",
      "params": { "title": "标题", "caption": "口播对应字幕" },
      "confidence": 0.8,
      "reason": "开场钩子，对应口播首句"
    }
  ]
}
```

约束：

| 字段 | 规则 |
|---|---|
| `start` / `end` | **秒**；半开语义在转 config 时按 fps 取整帧 |
| `cardId` | 必须在白名单且 `autoPick=true` |
| `intent` | 开场 / 收尾 / 对比 / 计数 / 列表 / 字幕 / 强调 / 数据 / 转场 / 素材 / 通用 |
| `params` | 只填卡支持的文案类字段：`title` `subtitle` `caption` `text` `items` |
| 密度 | 默认每 8–15 秒一张主卡；同 `intent` 全片最多 2 次 |

## 步骤

1. 读 SRT / 口播，按句或按意群切段，写出每段起止秒与一句话意图。  
2. 打开 `CARDS.md` / `cards.whitelist.json`，**只从 autoPick 列表**为每段挑一张卡。  
3. 填 `params`（字幕优先进 `caption`；标题进 `title`）。  
4. 写 `epNN.motion-map.json`。  
5. 转换：`node motion-workbench/scripts/motion-map-to-config.mjs --episode epNN`  
6. 工作台「成片参数」加载该期 → 人审改参 → lint → 预览 / 导出。

## 验收

- [ ] 每个 `cardId` 均可 autoPick  
- [ ] segments 时间不倒挂、基本覆盖口播时长  
- [ ] 无「占位」「TODO」「测试文案」  
- [ ] `motion-map-to-config` 成功写出 `epNN.config.json`  
- [ ] `npm run lint:episode -- path/to/epNN.config.json` 无硬伤（或已 `lintOff`）

## 相关文件

- 卡表生成：`motion-workbench/scripts/build-orchestrator-cards.mjs`  
- map→config：`motion-workbench/scripts/motion-map-to-config.mjs`  
- 体检：`motion-workbench/scripts/lint-episode.mjs`
