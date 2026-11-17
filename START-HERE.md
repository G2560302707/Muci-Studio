# 幕次 Studio · 开工看这一页

**默认只走形态 ②′：整片模板 → MP4。**  
自由拼接见文末「进阶」。

## 0. 先定四件事（写进 `episodes/epNN/README.md`）

- **画幅**：□ 横屏 16:9　□ 竖屏 9:16　—— 一期只做一个  
- **风格**：□ 白窗紫（默认）　□ 黑金  
- **题材**：□ 口播　□ 新闻　□ 知识  
- **形态**：☑ **②′ 整片模板**（默认）　□ ① 自由拼接  

## 1. 看规矩

- 读本页。  
- 可选扫 `作品库/` 最近一期 `SKILL.md` 的「踩过的坑」（若有）。

## 2. 在 `episodes/epNN/` 做策划，在引擎里装配

```
episodes/epNN/
  README.md    四件事勾选
  plan.md      口播稿 + 分镜
  assets/      真实截图 / 录屏
  audio/       配音 wav
  keyframes/   审查帧（可选）

muci-engine/components/src/epNN/
  epNN.motion-map.json   选卡结果
  epNN.config.json       成片参数
  Episode.tsx            渲染入口
```

产品样例：`episodes/demo/` ↔ `muci-engine/components/src/demo/`。

**互校**：配音时长 ↔ 字幕时间轴 ↔ 素材清单，对不上先记差异再排轴。

### 默认支路 — AI 编排（②′）

1. 把口播 / SRT 交给 Skill：`custom-skills/episode-fx-orchestrator/`（只用 whitelist 里 `autoPick=true` 的卡）。  
2. 产出 `muci-engine/components/src/epNN/epNN.motion-map.json`。  
3. `cd motion-workbench && npm run map:to-config -- --episode epNN`。  
4. 打开工作台「编排台」改字幕 / 时间 / 主题 / 音量 →  
   `npm run lint:episode -- ../muci-engine/components/src/epNN/epNN.config.json` → 预览 / 导出。  

组件只查 **Talkcraft**：`talkcraft-main/catalog.json` + `INDEX.md`。没有合适项 → 报缺，禁止硬凑纯大字页。

## 3. 一镜一做一审（勾选）

- [ ] 素材优先真实截图/录屏；AI 生图须用户明确授权  
- [ ] B-roll 与分镜、文件名对应；不匹配则退回口播/重点字，不硬填  
- [ ] 长句未溢出；字幕未压重点  
- [ ] 中间态无叠字、双重曝光  
- [ ] 上一镜末帧 = 下一镜首帧  
- [ ] 同一种讲解结构全片只用一次  
- [ ] 动画不喧宾夺主  
- [ ] 缩图档字幕仍可读  
- [ ] 音量：人声 > 音效 > BGM  
- [ ] 开场 0–5s 单独过（见 `custom-skills/opening-specs/`）  
- [ ] **静帧定稿后**才渲 mp4  

## 4. 过审 → `作品库/`

`作品库/epNN-<slug>/`：成片 + 帧 + 音频 + SRT + 工程副本 + `SKILL.md` + `meta.json`。  
排除 `node_modules`、密钥、私人路径。

## 5. 把新坑写回来

- 本期坑 → 该期 `SKILL.md`  
- 跨期规矩 → 更新本页勾选表，并在根 README 留一句  

---

## 进阶（不要默认走）

| 形态 | 文档 | 入口 |
|---|---|---|
| **① 自由拼接** | [`docs/advanced/freeform.md`](docs/advanced/freeform.md) | Talkcraft 手选 + `muci-engine` |
| 形态对照 | [`MODES.md`](MODES.md) | — |

样例：[`episodes/demo/`](episodes/demo/)。新建期：`npm run new-episode -- ep01`。
