# 作品库 · 每期成品归档

每期视频过审后归档于此：成品素材包 + 该期方法论 `SKILL.md`。

## 结构（每期一个文件夹）

```text
作品库/<ep>-<slug>/
├── SKILL.md
├── meta.json
└── assets/
    ├── <ep>-preview-v1.mp4
    ├── audio/
    ├── keyframes/
    ├── docs/
    └── project/
```

## 规则

1. **过审才归档**；成片用版本化命名，新版本存新文件不覆盖。  
2. **工程随包交付**：本期场景源码、时间轴与字幕配置、SRT、素材对应表、QA 帧入 `assets/project/`。  
   - **不入包**：`node_modules`、缓存、密钥、私人路径、私人 BGM 实体；可复用组件留在 `talkcraft-main/`。  
3. **SKILL.md 记本期增量**；同一模式第二次出现 → 参数化进组件层。  
4. 交付件：成片 + 音频 + 终版/审查/QA 帧 + SRT + 分镜素材对应表 + 工程副本 + SKILL.md + meta.json。

空白样板见 `_templates/`。
