# motion-workbench · 幕次 Studio 编排台

浏览 Talkcraft 组件、跑默认形态 **②′** 成片参数与预览。

## 启动

```bash
# 仓库根
npm run bootstrap
npm run workbench
```

浏览器打开后默认进入 **编排台**。治理模块需加 `?labs=1`。

## 常用脚本

| 命令 | 作用 |
|---|---|
| `npm run catalog` | 重建 `data/catalog.json`（派生自 Talkcraft） |
| `npm run map:to-config -- --episode demo` | motion-map → config |
| `npm run lint:episode -- <config.json>` | 成片配置检查 |
| `npm run episode:preview` | 默认 demo 预览 |
| `npm run sync:core-check` | core 与引擎侧对齐检查 |

预览 runtime 与成片引擎可能不同版本；差异以 `muci-engine` 成片为准。
