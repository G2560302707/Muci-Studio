# 编排卡片库（自动生成）

生成日期：2026-11-17

autoPick：全部 core + 可商用 snapcn/shotcraft/remocn 精选至约 55 张。video-talkcraft 仅参考（PolyForm NC），禁止自动编排进正式成片。非 core 的 autoPick 在 Remotion 装配层先走白窗参数壳，动效升级另立项。

合计 1272 · 可自动选 55 · 仅参考 108

## 可自动选（commercial / autoPick）

| id | intents | use |
|---|---|---|
| `core:Backdrop` | 字幕 / 强调 | 白窗紫核心组件: 白色轻纹理背景层。 支持横竖屏与黑金/白紫双主题。 |
| `core:BulletList` | 列表 / 强调 | 白窗紫核心组件: 逐字打字的要点列表卡，支持当前行紫色强调。 支持横竖屏与黑金/白紫双主题。 |
| `core:ChapterCard` | 转场 | 白窗紫核心组件: 章节分隔卡，用编号、总章数和标题完成段落交接。 支持横竖屏与黑金/白紫双主题。 |
| `core:ChapterRail` | 通用 | 知识讲解章节导航；新闻多段解读进度；口播长片结构提示。 |
| `core:EvidenceStat` | 计数 / 数据 / 证据 | 新闻/知识用数字背书；口播「先看这个数」；证据实证段。 |
| `core:FlashIntro` | 开场 | 白窗紫核心组件: 榜单开场闪入卡，按序建立多个项目。 支持横竖屏与黑金/白紫双主题。 |
| `core:FocusHost` | 计数 / 列表 / 运镜 | 口播人物/A-roll 缩进左框并弹出要点；知识讲解「看这边+三条」；新闻要点钉住。 |
| `core:LightStage` | 对比 / 素材 | 白窗紫核心组件: 白色舞台承载层，用来集中展示窗口内容。 支持横竖屏与黑金/白紫双主题。 |
| `core:MaskText` | 强调 / 数据 / 素材 | 白窗紫核心组件: 白色窗口内的逐字揭示文本组件。 支持横竖屏与黑金/白紫双主题。 |
| `core:NumberRoll` | 计数 / 强调 / 数据 | 白窗紫核心组件: 数字收束卡，用主数字与辅助说明形成层级。 支持横竖屏与黑金/白紫双主题。 |
| `core:OutroCard` | 收尾 | 白窗紫核心组件: 结尾引导卡，总结榜单并建立互动问题。 支持横竖屏与黑金/白紫双主题。 |
| `core:PillTags` | 通用 | 白窗紫核心组件: 按时间 cue 依次激活的浅色标签组。 支持横竖屏与黑金/白紫双主题。 |
| `core:ProjectCard` | 计数 / 列表 / 数据 | 白窗紫核心组件: 榜单项目详情卡，承载排名、媒体、要点、数据与标签。 支持横竖屏与黑金/白紫双主题。 |
| `core:RankingIntro` | 对比 / 计数 | 白窗紫核心组件: 榜单总览卡，逐行建立标题和条目。 支持横竖屏与黑金/白紫双主题。 |
| `core:ScreenCard` | 素材 | 白窗紫核心组件: 截图或录屏的真实内容载体，支持标题和倍速徽章。 支持横竖屏与黑金/白紫双主题。 |
| `core:Subtitle` | 字幕 | 白窗紫核心组件: 底部口播字幕组件，按 cue 时间轴显示。 支持横竖屏与黑金/白紫双主题。 |
| `remocn:beat-count` | 计数 / 列表 / 字幕 | A big thin numeral counts to 64 in steps locked to a BPM, with a small caption. |
| `remocn:cut-stat` | 字幕 / 数据 / 转场 | A blue bar graph wipes upward beside a big minus 44% caption, 'less time to a fi |
| `remocn:gear-shift` | 计数 / 列表 / 字幕 | A big 42 shifts up through numbered gear steps on a teal panel with a caption. |
| `remocn:res-climb` | 计数 / 列表 / 字幕 | A glowing number climbs in resolution-like steps to 200+ with a small caption. |
| `remocn:up-close` | 字幕 / 素材 / 运镜 | A screenshot zooms close, captioned "Up close, it's code. From here, it's your l |
| `remocn:versus-split` | 对比 / 数据 | A diagonal split frames remocn against the old way with stat rows for time, cost |
| `snapcn:card-rail` | 收尾 / 运镜 | Docs and props: https://snapcn.dev/docs/scenes/card-rail?ref=cli — images, title |
| `snapcn:check-cycle` | 开场 / 计数 / 列表 | Docs and props: https://snapcn.dev/docs/text/check-cycle?ref=cli — headline is t |
| `snapcn:count-grid` | 计数 / 数据 / 运镜 | Docs and props: https://snapcn.dev/docs/scenes/count-grid?ref=cli — pass cards a |
| `snapcn:follower-rush` | 计数 / 证据 | Docs and props: https://snapcn.dev/docs/social/follower-rush?ref=cli — pass mode |
| `snapcn:font-shuffle` | 开场 / 列表 / 强调 / 数据 / 运镜 | Docs and props: https://snapcn.dev/docs/text/font-shuffle?ref=cli — lead stays s |
| `snapcn:logo-collapse` | 开场 / 列表 / 数据 / 运镜 | Docs and props: https://snapcn.dev/docs/logos/logo-collapse?ref=cli — images is  |
| `snapcn:phone-stack` | 列表 / 数据 / 素材 | Docs and props: https://snapcn.dev/docs/screens/phone-stack?ref=cli — pass one c |
| `snapcn:prompt-zoom` | 数据 / 素材 / 运镜 | Docs and props: https://snapcn.dev/docs/ai-input/prompt-zoom?ref=cli — pass mode |
| `snapcn:punch-lines` | 强调 / 数据 / 运镜 | Docs and props: https://snapcn.dev/docs/text/punch-lines?ref=cli — pass mode="da |
| `snapcn:reel-collage` | 字幕 / 运镜 | Docs and props: https://snapcn.dev/docs/scenes/reel-collage?ref=cli — the page,  |
| `snapcn:roster-grant` | 收尾 / 数据 / 运镜 | Docs and props: https://snapcn.dev/docs/scenes/roster-grant?ref=cli — pass rows  |
| `snapcn:status-cycle` | 计数 / 列表 / 数据 | Docs and props: https://snapcn.dev/docs/scenes/status-cycle?ref=cli — pass mode= |
| `snapcn:terminal-simulator` | 计数 / 列表 / 素材 / 运镜 | Docs and props: https://snapcn.dev/docs/screens/terminal-simulator?ref=cli — pas |
| `video-shotcraft:beat-cut-moves/paparazzi-flash` | 开场 / 计数 / 转场 | 高光时刻仪式感：颁奖连拍、关键数字的加冕 |
| `video-shotcraft:before-after-slider-scrub/before-after-slider-scrub` | 对比 / 数据 | AI 增强/优化/重构类功能的效果对比段落（"用前 vs 用后"一镜讲清） |
| `video-shotcraft:card-flip-reveal/card-flip-reveal` | 计数 / 数据 / 转场 | "功能→成果"的成对叙事：一排功能卡逐张翻出各自的指标/结论；元素级转场卡 |
| `video-shotcraft:crane-rise-reveal/crane-rise-reveal` | 开场 / 数据 / 运镜 | "从细节到全局"的开场定场；与 drone-dive-landing（全局→单点俯冲）互为反向 |
| `video-shotcraft:dataviz-landscape-open/dataviz-landscape-open` | 开场 / 数据 / 运镜 | 品牌级抽象开场（"数据宇宙"隐喻），接亮场产品段或字标；与 glow-flyline-moves 分工：那卡是段落内卡片之间的连线叙事，本卡是开场专用的全画幅地 |
| `video-shotcraft:depth-layer-moves/multiplane` | 列表 / 素材 / 运镜 | 平面截图要"有厚度"的段落：卡组 / 列表 / 整页的横向巡览 |
| `video-shotcraft:glass-pill-dictation-typing/glass-pill-dictation-typing` | 收尾 / 强调 / 转场 | 语音/AI 输入框的登场；"跟它说话"的交互提示镜头；高能段之间的一个安静过渡拍 |
| `video-shotcraft:icon-field-colorize/icon-field-colorize` | 开场 / 收尾 | 开场铺陈产品能力面（图标=功能宇宙）再一举打上品牌色；功能集合页、生态/集成规模展示、片头 logo 前垫场 |
| `video-shotcraft:letterspace-materialize/letterspace-materialize` | 开场 / 收尾 | 片尾/片头品牌字标登场（大字距细骨架字标；demo 为 video-shotcraft 全小写）；章节题字；needs 静谧/高级感的收束帧 |
| `video-shotcraft:line-carry-transition/line-carry-transition` | 数据 / 转场 / 运镜 | 两个有图形亲缘的场景之间（进度条→卡框、下划线→图表轴）；一支片子的招牌转场位，Catch Me If You Can 片头的图形接力 |
| `video-shotcraft:overhead-camera-moves/overhead-tabletop-drop` | 开场 / 转场 / 运镜 | 多页巡视后择一；转场/开场两用 |
| `video-shotcraft:overhead-camera-moves/tilt-reveal` | 开场 / 转场 / 运镜 | 开场 establishing；单主体 |
| `video-shotcraft:shot-transitions/mask-wipe` | 强调 / 转场 / 素材 | 语义化接缝：功能总览→该功能详情（"点开这张卡进入它的世界"） |
| `video-shotcraft:spotlight-hero-card/spotlight-hero-card` | 开场 / 数据 / 运镜 | "单一主角"式产品开场；把一个核心对象（卡片/条目/模块）立成全片主角 |
| `video-shotcraft:tension-camera-moves/pull-back-isolation` | 收尾 / 计数 / 运镜 | 结尾收束；"全片只为这一个数字"的谢幕 |
| `video-shotcraft:text-as-mask/text-as-mask` | 开场 / 收尾 / 强调 | 品牌词/口号与产品画面二合一的开场或章节卡；字是门、产品在门里 |
| `video-shotcraft:timeline-travel/timeline-travel` | 计数 / 列表 / 数据 / 运镜 | changelog/里程碑/发展史段落（"我们一直在发货"的另一种拍法）；与 scroll-brake-moves 分工：那卡是纵向列表急刹，本卡是横向时间旅行 |
| `video-shotcraft:title-demote-to-label/title-demote-to-label` | 开场 / 强调 / 转场 | 章节开场（标题先当主角再让位给内容）；教程/功能演示片的小节交接；B 式给"文字/编辑"类产品加身份暗示 |
| `video-shotcraft:transition-hidden-cut/versus-slam` | 对比 / 转场 | 对比/对阵语义的开屏或章节头（新旧方案、双产品、before/after） |
| `video-shotcraft:vertical-word-roll-blur-cycle/vertical-word-roll-blur-cycle` | 计数 / 列表 / 强调 | "Crafted for ___" / "Built for ___" 这类句干 + 受众/对象列举的一句话卖点；浅底品牌片的干净一拍 |

## 仅参考（不可 autoPick）

共 108 张（主要为 video-talkcraft）。详见 cards.whitelist.json。

