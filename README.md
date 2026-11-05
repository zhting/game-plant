# Game Plant · 游戏生产平台

内部使用的 **AI 游戏创作工具**。底座是一套横版射击引擎（魂斗罗2026），已经有一个变体样例（大闹天宫）。目标是让创作者主要通过和 Gemini 对话，在这套引擎上快速做出属于自己的游戏。

- 路线图：[docs/ROADMAP.md](docs/ROADMAP.md)
- 开发约定（AI 编程助手必读）：[AGENTS.md](AGENTS.md)

## 内置模板

| 路径 | 内容 |
|---|---|
| `/games/contra2026/` | 魂斗罗2026：主线 8 关，支持单人、双人联网、键盘、触屏和手柄（[说明](games/contra2026/README.md)） |
| `/games/wukong/` | 大闹天宫：在同一引擎上改出来的西游动作变体（[说明](games/wukong/README.md)） |

## 本地运行

需要 Node.js 22 或更高版本。

```sh
npm ci
npm start      # http://localhost:3000
npm test       # 回归测试 + 黄金回放
```

服务端部署（Docker + Caddy 或 systemd）见 [backend/README.md](backend/README.md)。

## 仓库历史

- 原始发布包和源码包分别保存在 tag `archive/release-20261105` 和 `archive/source-20261105`。
- 源码包里原本还带有军棋、干瞪眼等其他小游戏的后台模块，已经移除。
