# 幕次引擎 · muci-engine

**幕次 Studio（Muci Studio）** 的规则层 + Remotion 渲染工程。  
**不是组件库**——可复用组件只落在 `../talkcraft-main/`（Talkcraft）。

现行选料真源：`../talkcraft-main/catalog.json`。  
本仓 `repo/library/catalog.json` = 历史参考快照，禁选料。

## 两层结构

| 层 | 目录 | 内容 |
|---|---|---|
| 规则层 | `repo/` | 方法论、skill、DESIGN、门禁脚本 |
| 渲染工程 | `components/` | Root / Episode / 预览导出；业务组件源码镜像自 Talkcraft `core/` |

## 规则层级（越靠前越权威）

| 层 | 文件 | 作用 |
|---|---|---|
| 1 | `repo/skills/fred-remotion-output/SKILL.md` | 日常主入口 |
| 2 | `repo/skills/fred-remotion-output/DESIGN.md` | 设计硬规则 |
| 3 | `repo/skills/fred-remotion-output/references/` | 专项规则 |
| 4 | `../talkcraft-main/` | 现行组件与 catalog |
| 5 | `repo/scripts/` + `repo/tests/` | 门禁可执行化 |

产品样例场景：`components/src/demo/`。
