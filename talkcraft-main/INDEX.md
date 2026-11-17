# Talkcraft 组件库总索引（幕次唯一组件库）

> **本目录 `talkcraft-main/` 是幕次唯一的组件库。** 所有可复用组件落盘在此。  
> `core/` = 白窗紫一等套件（**不是**独立「主库」；2026-11-17 确认与 cards 无等价重复，保留）。  
> 选卡标准见 `SKILL.md`；机器索引见 `catalog.json`。

## 结构

| 目录 | 内容 | 数量 | 画幅 | 状态 |
|---|---|---|---|---|
| `template/cards/` | talkcraft 动效配方卡（单文件自包含 tsx，`export const meta` 契约） | 108 | 横 960×540 为主，个别小件自适应 | approved |
| `core/` | 白窗紫核心组件（16 业务组件 + WindowShell 载体 + themes 主题系统） | 17 | **横竖双支持** + 黑金/白紫双主题 | approved（竖屏像素回归 32/32；2026-11-17 +FocusHost/ChapterRail/EvidenceStat） |
| `external/shotcraft/` | shotcraft 动效演示库（demos 226 tsx + lib 7 + SKILL.md） | 150 目 | 跟随画布 | approved |
| `external/remocn/` | remocn 社区组件（registry 解包 tsx） | 937 | 跟随画布 | inherited |
| `external/snapcn/` | snapcn 组件（registry/snap-cn） | 61 | 跟随画布，**竖屏最友好** | inherited |
| `external/benben-b/` | benben B 系列重建工程（8 目录：catalog 代表 + B018/B070 兜底 + 6 精选；82 个冗余快照 2026-11-15 移入 `_旧/`，一组件一份源码 = 使用规则 7） | 31 | **仅横 1920×1080@60fps** | inherited-unreviewed |
| `sfx/` | UI 动效音效包（ffmpeg 程序合成，零版权；pop/whoosh×2/ding/stamp，用法见 `sfx/INDEX.md`） | 5 | 音频 | approved（ep05 已用） |

## 按口播稿转视频的任务场景选组件

| 口播环节 | 首选 | 备选 |
|---|---|---|
| 开场 / 标题 | cards「开场」类、shotcraft opening、remocn 开场类 | core FlashIntro |
| 榜单 / 清单叙述 | core RankingIntro / ProjectCard / ChapterCard / BulletList | cards 榜单卡 |
| 论点对照 / 金句 | cards 双色块对句等「字幕花字」类、core MaskText | remocn 文字类 |
| 数字 / 增长数据 | core NumberRoll、remocn 计数(48)/数字(10) | shotcraft data |
| 图表 / 信息图 | remocn 图表(24)/柱状图(46)/环形(43)/饼图(4)、cards 图表卡 | shotcraft data |
| UI / 产品演示 | remocn 界面入场(22)/手机(4)/窗口(2)、snapcn | core ScreenCard |
| 代码演示 | cards chat-gpt / claude-code / glass-code-walk | remocn 打字(4) |
| 转场 | cards 六式转场、shotcraft transition、remocn 转场(48) | — |
| 字幕 | core Subtitle（时间轴 cue 驱动） | cards 字幕类 |
| 收尾 / 互动引导 | core OutroCard、cards 收尾(8)、shotcraft outro | — |
| 相机 / 镜头语言 | **不单建运镜库**：① 人物口播运镜用 `core:FocusHost`；② 方法论 `template/motion-systems/camera.tsx`（L1）；③ catalog「运镜」类 + shotcraft 镜头配方（人工选） | Overlay 线 B 用 FocusCard |
| 背景 / 氛围 | remocn 渐变(24)/粒子(3)/着色器(62)、core Backdrop / LightStage | — |

完整明细（含每条的 use/energy/keywords/画布）用 `catalog.json` 检索；
motion-workbench 的中文搜索界面继续可用（数据同源）。

**选料流程（硬性，2026-11-15 定）**：按 START-HERE 第 2 步四步走——定画面意图 → 查对标用法表
`motion-workbench/data/distill-mapping.json` + ≥2 组同义词查本索引/catalog → 摆 3–5 候选，
**静帧 + 标签双读**：读该条 use/keywords 标签 + 看 `posterUrl` 静帧（`gallery/posters/<库>/<名>.jpg`，
2026-11-15 起基本全量有图），两样对上才入围；静帧不足以判断动效节奏再走工作台
`POST /motion-workbench/api/preview` 现渲 → 候选不足报缺口不硬凑。
历史错题扫错题本「[选料]」类条目。

## 使用规则（硬性）

1. **唯一主库**：新增/修改组件一律落在本库；渲染工作区 `muci-engine/components/`
   是工程（Root/Episode/渲染脚本），不是第二个库——组件改动以本库为准并回流。
2. **第二次使用再落盘**：新写组件先在渲染工程内实现；**第二次复用时**才落盘进本库
   （core/ 或对应 external/ 区），补 meta 与本索引登记。
3. **上游冻结**：talkcraft 上游文件（template/、demos/、runtime/ 等）不改动；
   上游更新时重新对照，冲突以本库登记为准。
4. **卡片契约**：进 `template/cards/` 的组件必须单文件自包含、只 import react/remotion、
   带 `export const meta`（契约见 `template/README.md`）。
5. **画幅**：竖屏成片优先 core/（双画幅已参数化）→ snapcn（自适应）→ remocn/shotcraft
   （跟随画布，先出静帧验证排版）；B 系列只做横屏或竖屏嵌小窗（`scale(0.5625)`）。
6. **主题**：core/ 组件经 `useTheme()` 取色（whiteWindow / blackGold 两套，见 `core/style/themes.ts`），
   组件内禁止写死色值。
7. **一组件一份源码（2026-11-15 定）**：入库 / 上游刷新一律按组件去重——每种组件只留一份代表源码
   （catalog `sourcePath` 指向它）+ 确有差异的变体；同内容多拷贝、空壳脚手架目录不落主库，进 `_旧/`；
   **禁止整包重拷工程快照**。验收标准：源码级 grep 一个组件名，实现只命中一处。

## 索引与登记

- `catalog.json` — 机器索引：`stats.byCategory` 61 类、每条含 `sourcePath`（主库内路径）、
  `aspect`（both / landscape / adaptive）、`canvas`、`use`（**全部中文**：cards/core 为人工精修，
  remocn/snapcn 于 2026-11-15 批量补齐，底料在 `motion-workbench/data/catalog.json`，改词走
  `scripts/merge-zh-enrich.py` + `build-master-catalog.py` 重跑，勿手改本生成物）。
- `core/README.md` — 核心组件区登记（来源、主题、与渲染工程的同步关系）。
- B 系列素材源文件包（300M）不属组件，留在 `muci-engine/repo/components/projects/fred-legacy-fix-20261018/`。
