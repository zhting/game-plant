# AGENTS.md — Game Plant 开发约定

本文件写给 **AI 编程助手**（以及 Studio 内的 Gemini Agent）和人类开发者，开工前必读。

## 项目是什么

Game Plant 是一个内部使用的 **AI 游戏创作工具**。底座是一套横版射击引擎（魂斗罗2026），已经有一个变体样例（大闹天宫）。路线图见 `docs/ROADMAP.md`。

## 目录结构

| 路径 | 内容 |
|---|---|
| `games/shared/arcade-engine.mjs` | 共用引擎，约 8800 行单文件。所有逻辑都在 `startArcade(deps)` 闭包里，全局状态是 `G` |
| `games/contra2026/` | 魂斗罗：`js/` 是各关卡、敌人、美术模块；`assets/` 是运行时资源；`design/` 是设计文档和生图提示词；`tools/` 是素材处理脚本 |
| `games/wukong/` | 大闹天宫：通过 `js/engine-dependencies.mjs` 把皮肤、规则、敌人、音乐注入引擎 |
| `backend/` | Node 服务：静态页面 + 两款游戏的双人联机 WebSocket（`contra.mjs`）；`test/` 下是全部回归测试 |
| `sim/` | 无头模拟：`headless.mjs`（不渲染画面地运行引擎）、`replay.mjs`（黄金回放）、`golden/`（已录制的回放基线） |
| `docs/` | 路线图和架构文档 |

## 红线（必须遵守）

1. **测试保持全绿**：每次改动后运行 `npm test`。测试红了就修，或者回滚；不要跳过或删除测试来"变绿"。
2. **黄金回放**：重构类改动（目标是行为不变）**不能改变** `sim/golden/*.json`。只有确实有意改玩法时，才运行 `npm run replay:record -- <game> <stage>` 重新录制，并在提交说明里写明原因。
3. **引擎渐进改造**：一次只改一张表、一个钩子或一类分支，小步提交。禁止大重写。
4. **不引入打包构建**：游戏运行时保持原生 ESM，浏览器直接加载。Studio（以后的 `apps/studio`）可以单独使用 Vite。
5. **联机协议不随便动**：`coop-core.mjs` 的输入位掩码和快照格式、`backend/contra.mjs` 的消息类型，改动要同时更新房主和玩家二两端，并补充测试。
6. **资源路径**：运行时只加载 `games/<game>/assets/`。新资源要登记到对应的 `resource-preloader` 或 `stage-resources` 作业里，并带上内容版本号（见 `asset-url.mjs`）。
7. **缓存版本号**：引擎和模块的 import 带有 `?v=xxx` 缓存参数。改了被引用的模块后，要同步更新引用处的版本号。
8. **密钥**：任何 API Key 只能放在环境变量里，不进仓库。

## 常用命令

```sh
npm ci                 # 安装依赖（Node ≥ 22）
npm start              # http://localhost:3000 ：入口页 + /games/contra2026/ + /games/wukong/
npm test               # 全部测试（约 30 秒）
npm run test:contra    # 只跑魂斗罗
npm run test:wukong    # 只跑大闹天宫
npm run replay:record  # 重新录制全部黄金回放（仅在有意修改玩法时）
```

## 用无头引擎调试

```js
import { createHeadlessEngine } from './sim/headless.mjs';
const e = createHeadlessEngine({ game: 'contra2026', seed: 1 });
e.play(3);                              // 直接进入第 3 关
e.frames(120, { KeyD: true, KeyJ: true }); // 按住"右 + 射击"运行 2 秒
console.log(e.G.p.x, e.G.score, e.G.en.length);
```

按键用 `KeyboardEvent.code`：`KeyW/A/S/D` 移动，`KeyJ` 射击，`KeyK` 跳跃，`KeyI` 手雷，`KeyL` 道具，`KeyQ` 切换道具。

## 引擎要点

- 画面固定 384×216，按固定帧率运行，每帧 1/60 秒（`step()`）；`render()` 只负责绘制。
- 关卡由 `G.stage` 区分：1–8 是主线，9–16 是水下关原型（还没开放，见 `release-stages.mjs`）。
- `WUKONG` 为真时走悟空分支（约 179 处）。这些分支就是以后提炼"规则模块和钩子"的清单。
- 随机数：引擎内部用 `rnd = Math.random`。无头模拟可以传入 `seed`，让结果可复现。
