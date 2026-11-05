# 第四关：地下基地 · 双生投影

本地试玩内容；本次不发布到线上。第五关及后续入口保持关闭。

## 关卡与操作

四个纵深房间依次为外围警戒室、弹药输送室、升降控制室、中央防卫室，然后进入双生投影中枢。红色地面、灰钢侧墙、橄榄绿后墙沿用原视频约 08:05–10:35 的场景身份。

拆掉炮台、移动轨道炮与高位锁，才能击破门芯；高位锁需要跳跃射击。电网解除后可按上前进，也会自动推进。推进时清空旧房间的子弹与枪口效果。每个普通房间的第二、第五波有红色补给兵，击杀才掉落各自携带的装备，过门不生成奖励。

中枢先有四个独立装置：上方一个、下方三个。全毁后经过 1.4 秒启动双生投影。面具连续分裂、变淡、合拢，合拢时有实体，按上举枪射击。面具发射有透视放大效果的红色空心圆环；剩一张面具时持续暴走。冻结道具同时暂停位移和发射。击破后清空攻击，两端底板升降梯开放；单人登梯或双人分别登梯到顶后才结算第四关。

复用键盘、触屏、标准 Gamepad 输入和 30 条有限生命秘籍。双人快照包含装置血量、投影位置、实体状态、弹道、补给和升降梯进度。

## 美术与加载

三张新增 WebP：`assets/stage4/corridor-alert.webp`（270,324 字节）、`twin-mask.webp`（76,686 字节，透明）、`control-wall.webp`（179,898 字节）。共用第二关的正背视人物、炮台、破损核心图集；资源按 URL 去重。第四关选关入口先完成资源加载，再进入介绍。面具按原始宽高比绘制，碰撞位置持续跟随动画。

独立 Ogg/Opus 音轨取自用户提供的 `H:/download/videoplayback.mp4`：走廊从 489 秒取 25.55925 秒循环；Boss 从 633 秒取 11.18225 秒循环。循环长度由频谱相似度和波形相关精确匹配。48 kHz、96 kbps、目标 -18 LUFS，边界 4 ms 淡入淡出。首次只等待本关默认曲，其他音乐在游戏开始后后台下载。进入中枢切换本关 Boss 曲，暂停续播。其他关卡的改编曲不能在本关选择。

## 生成记录

验证：完整魂斗罗回归测试 194 项通过；真实浏览器通过第四关入口完成 51 项启动资源加载，默认原声正常播放；手机 844×390、1.5 DPR 下验证上推摇杆配合射击及跳跃。单人战斗、双人快照、两名玩家分别登梯结算和手柄举枪由真实引擎测试覆盖。

工具：内置 imagegen。模式：根据本地参考图生成新资产；未编辑参考图。原始 PNG 留在 `C:/Users/zhting/.codex/generated_images/01a14d5a-42ff-7e33-bf4b-817e85c1bd0b/`。运行时文件只做 WebP 压缩，面具另裁掉透明边并缩至 768 px 宽。

### 走廊

参考：第二关 `corridor-hd.webp` 的画面品质与原视频 485 秒帧的构图颜色。透明背景：否。原始文件：`exec-ea0d77ff-9256-4d0f-a400-a4f458b6cd96.png`。

完整提示词：

> Create ONE production game background image, wide 16:9, 1536x864 or similar. This is stage FOUR of a Contra inspired side scrolling game with a forward-facing corridor section. Reference 1 provides the richly detailed hand-painted pixel game texture quality, weathered industrial materials and restrained lighting. Reference 2 provides the exact red-floor, olive-back-wall color identity and central one-point-perspective room composition. Reinterpret that low resolution reference as crisp, richly detailed late-1990s pixel-painted game art. No blurred scaling, no photorealism, no text, no logos, no HUD, no players, no enemies, no guns, no target devices, no electricity, no floating objects. Empty futuristic underground base corridor, symmetrical frontal camera. Large olive-green riveted back wall, small sealed plain metal door at its bottom center. Back wall is exactly the rectangle from 25% to 75% image width, 18.5% to 65% image height: this empty plane will receive game targets. Gray gunmetal side walls converge to the four corners of that back-wall rectangle, furnished with thick ribbed vertical pipe conduits, brackets, recessed panels, bolts and vents. Oxblood red steel floor extends from the back-wall bottom at 65% down to the full bottom width, with convincing trapezoidal floor plates, recessed black seams, worn copper highlights, red grooves and soft central reflections. Dark metal ceiling with a centered receding row of small white lights. Thin amber warning lamps only along the outer walls. Dramatic believable depth, clean readable central play area, highly detailed metal bevels. Flat full-bleed environment, no surrounding mockup or frame.

### 双生面具

参考：原视频 635 秒帧与第二关背视角色的材质。透明背景：是。原始文件：`exec-fc386750-05c2-48b2-a777-1c03fe5bea67.png`。

完整提示词：

> Create ONE isolated production boss sprite on transparent background. A single perfectly front-facing floating alien machine mask, centered with generous transparent margin, wide silhouette about 1.45 width to 1 height. The first reference shows TWO tiny mask enemies in the upper black band; faithfully redesign just ONE of those masks at high definition, preserving the old arcade design. The second reference gives this game's detailed hand painted pixel art material treatment; match that game-art sharpness, limited palette shading and crisp edges. This is NOT a human, NOT a giant full scene. A sinister silver-lilac metallic mask head with a broad sweeping brow, short swept pointed antenna-like fins on both sides, stepped cheek plates, dark recessed temples and a broad horizontal dark grille for the lower mouth, with 5 slim silver horizontal vent slats. ONE large round glowing red lens centered high in the forehead with a thick white silver socket, small white-hot glint. No other glowing eyes or pupils. Dark thin face slits under the brow. Weathered engraved silver bevels, pale lavender faceplate, charcoal gaps, small red accents, strong top-left highlights, subtle reflected purple light on underside. Strong readable small-size silhouette, symmetric engineering with a slight hand painted texture. No text, no UI, no symbols, no ground shadow, no background scenery, no other objects, no sprite sheet. One complete entire mask, not cropped.

### 中枢背板

参考：原视频 630 秒帧与新走廊。透明背景：否。原始文件：`exec-c36a75f5-0fda-4efa-8fe2-8771ba6782ef.png`。

完整提示词：

> Generate ONE production 2D game environment asset: a front facing rectangular industrial boss chamber BACK WALL ONLY, filling a wide approximately 2.2:1 image. No perspective on this wall, no floor, no ceiling, no side walls, no surrounding frame or mockup. Reference 1 is the original low resolution arcade scene: match its olive brass pipework, teal recessed chamfered polygonal inset panels and broad upper black projection bay. Reference 2 gives the detailed weathered painted-pixel metal style of the game's current HD base. Give this wall that same richly detailed, sharp texture quality. The outer edges are olive brass cylindrical vertical pipes and steel ribbing with tiny screws, worn gold highlights, shadows, cable clamps, gratings, small amber indicator lamps. Upper 35 percent of the wall: ONE continuous pure near-black empty horizontal display recess across 88 percent of wall width, thin layered metallic bezel, NO screens, NO faces, NO writing, NO targets. Lower 65 percent: TWO rows of THREE large TEAL hexagonal/chamfered recessed armored plates, mostly empty central faces, surrounding borders of layered olive gunmetal housings, recessed screws, long engraved panel seams, small fine vents and looping cables only in the gaps. The six plates must feel machined, heavy and inset, not flat outlines or graphic buttons. Symmetrical front view, convincing fine bevels, cinematic industrial material detail rendered as crisp hand painted high definition pixel game art. No characters, no soldiers, no boss head, no devices attached to panels, no shooting effects, no explosions, no glowing red balls, no HUD, no text or numbers. This is an empty architectural panel over which animated sprites will be composited. Keep the central panel faces uncluttered for target legibility.

### 通关洞口

第二、四关现共用下述入口图，并移除门楣的房间文字和标牌。关底装置阶段可以按上举枪攻击高位装置，关闭护板仍会挡弹；完整最新记录见 [第二至第四关修正](multi-stage-polish.md)。

普通房间通道打开后使用独立透明入口精灵：厚钢板断面、破损装甲、门楣阴影，以及带管线、顶梁和地面接缝的纵深通道。暗部向内部渐隐，远处低亮度暖灯提供深度参照，前侧门槛与后墙地面保持对齐。按原图比例容纳于 76×86 的逻辑区域，底边位于 y=140，随原有前进过场一起缩放。Boss 房间沿用原有布局。

素材为约 221 KB 的 WebP，仅在进入第四关时加载。内置 imagegen 的完整提示词见 [洞口提示词](stage-four-passage-prompt.txt)，原图来源、透明边界、尺寸与校验值见 [素材记录](stage-four-passage.json)。

### 设施护板与分层守军

第四关的固定炮台、横移炮台、高位机关、普通核心及关底四装置具有独立滚动护板。入房有短暂开启缓冲，之后错时开启、关闭；护板完全打开时才能受伤。关闭和开合过程阻挡所有弹种及爆炸，关闭的炮口暂停开火。EMP 停用电子攻击但不会打开实体护板，冻结同时暂停开合与守军动作。普通核心仍须先解除原有防护，投影的实体与分散规则沿用原机制。

上下两层各有左右侧门，每个入口同时最多一名守军。敌人从门后连续走入、瞄准开火，再沿原入口撤回；下层可平射，上层需要跳跃射击。可见身体与受击区域使用同一层高，追踪弹不会越层锁定。敌人与设施存在前后遮挡，已关闭的设施仍挡住射向其后方的子弹。两层守军贯穿四装置和双生投影战，开门或 Boss 战结束时停止出兵并清理守军。

人物复用现有动画图集，护板按实时开度绘制，无新增图片或音乐下载。护板时间、波次、动作、层高与生命状态进入原有双人世界快照。
