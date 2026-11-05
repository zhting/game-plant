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
| `games/shared/game-spec.mjs` | GameSpec：模板默认值 + 字段说明 + 校验。引擎从这里读可调数据 |
| `templates/contra/` | 新项目从这里复制的 game.json（只写和默认值不同的部分） |
| `backend/projects.mjs` `backend/studio.mjs` | Studio：项目（每个一个 git 仓库：`game.json`、`modules/`、`assets/`）、API、`/play/<id>/` 预览 |
| `backend/ai/` | Gemini 接入和创作 Agent（`agent.mjs` 的工具就是 AI 能做的全部事情；`mod-guide.mjs` 是教 AI 写代码模块的文档） |
| `games/shared/mod-runtime.mjs` | 项目代码模块（B 轨）运行时：`defineEnemy`、钩子、出错隔离。引擎里的 `MOD_GAME` 是模块能用的全部接口 |
| `backend/ai/image-tool.mjs` `backend/ai/sprites.mjs` | AI 生图工具：提示词 + 风格参考图 → 抠图、裁边、切帧、缩放（sharp）→ 存到项目 `assets/` |
| `sim/isolated.mjs` `sim/worker.mjs` | 在独立子进程里加载和试玩 AI 写的模块（`node --permission`、超时强杀） |
| `apps/studio/` | Studio 界面（Vite + React，唯一允许打包构建的地方） |
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
npm ci                 # 安装依赖（Node 24）
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

## 把引擎里的常量提取到 GameSpec

1. 在 `game-spec.mjs` 的 `CONTRA_SPEC_DEFAULTS` 里加默认值（必须和引擎原值完全一致），在 `GAME_SPEC_SCHEMA` 里加字段说明和范围。
2. 引擎里把字面量换成 `SPEC.xxx`。和悟空不同的值先不要提取，或者只在项目显式设置时才生效。
3. 在 `sim/test/game-spec.test.mjs` 加一个测试，证明改这个字段确实会改变游戏行为。
4. `npm test`：黄金回放必须不变。Agent 的系统提示会自动带上新字段。

## 项目代码模块（B 轨）

- 模块能用的接口只有 `mod-runtime.mjs` 的 `api` 和引擎里冻结的 `MOD_GAME`。改动接口时，**同步更新** `backend/ai/mod-guide.mjs`（AI 的文档）和 `sim/test/mod-runtime.test.mjs`；示例模块 `EXAMPLE_MODULE` 必须一直能跑通测试。
- 引擎新增原版敌人类型时，把类型名加进 `STOCK_ENEMY_TYPES`（模块不能重名）。
- 模块敌人只在 `MOD_STAGES` 列出的关卡生成；美术类在 `enemy(e)` 开头把 `e.mod` 交给 `this.modEnemy`。不要改美术类的原型（无头测试里多个引擎共享同一个类），用实例属性。
- 没有模块时引擎行为必须和以前完全一样（黄金回放不变）。模块出错只记录、停用对应钩子或敌人，不能让游戏崩溃。
