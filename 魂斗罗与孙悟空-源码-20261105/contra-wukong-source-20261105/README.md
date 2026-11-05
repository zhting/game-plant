# games

测试不同的小游戏。

当前是一个轻量静态小游戏站点，所有子游戏统一存放在 `games/` 目录下。

- `/`：主页
- `/games/game`（兼容 `/game`）：果冻俄罗斯方块 (Jelly Tetris 2D)
- `/games/game/3d`（兼容 `/game/3d`）：果冻俄罗斯方块真 3D 版 (Three.js)
- `/games/idiom`（兼容 `/idiom`、`/成语`）：成语守卫战 (Idiom Defender)
- `/games/lego`（兼容 `/lego`）：乐高战争 (Lego War)
- `/games/mirror`（兼容 `/mirror`）：岁月之镜 (Mirror)
- `/games/junqi`（兼容 `/junqi`、`/军棋`）：萌兵军棋 (Mengbing Junqi · 双人对战与人机练习)
- `/games/jelly-block`（兼容 `/jelly-block`、`/真果冻`）：真-果冻俄罗斯方块 (XPBD 软体物理切开堆叠 · WebGL2)
- `/games/gandengyan`（兼容 `/gandengyan`、`/干瞪眼`）：干瞪眼 · 星际版（五人联网对战与电脑练习）
- `/games/contra2026/`（兼容 `/contra2026`）：魂斗罗2026（当前开放雨林要塞、地下指挥所、峡谷瀑布、地下基地、极地冰原五关，支持单人、双人联网、键盘、触屏和手柄；后续关卡制作中）
- `/games/wukong/`（兼容 `/wukong`）：大闹天宫（独立西游动作游戏，金箍连环棍、七十二变与巨灵神三阶段战斗；独立封面、首章结算与双人联机房间）

军棋、干瞪眼、魂斗罗2026 和大闹天宫共用统一后台。根目录运行 `npm ci`、`npm start` 即可同时启动合集与后台；腾讯云部署和前端连接配置见 [后台说明](backend/README.md)。

部署目标：`https://games.tangletang.top`
