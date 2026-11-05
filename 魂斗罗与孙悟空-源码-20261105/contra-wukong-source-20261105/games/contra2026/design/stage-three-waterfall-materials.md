# 第三关：瀑布与落石

设计依据：用户确认的“瀑布与落石 · 场景设计”。当前仅供本地试玩。

## 行为与画面

- 瀑布以湿岩壁、主水幕、细碎飞沫与水雾分层绘制。远岩壁随镜头缓慢移动，近水幕独立向下流动；透明水幕上下均淡出，避免循环重叠产生横向亮条。
- 背景亮度低于角色和危险物，岩台外缘增加轻微溅水；接近山顶时平滑过渡到灰岩区域。
- 落石直径 26–32 逻辑像素，接近角色身高。八个独立转角的岩石体积画面配合小角度余转，垂直下落时也会翻滚。
- 实际命中框与绘制共享半径 r。落石每块 3HP，头盔依然可以抵挡并撞碎；双人快照保留半径、旋转和转向状态。
- 刷新间隔 3.6–5.2 秒，最多同时两块；两次反弹后继续落下，给攀登留出路线。移动浮石继续使用独立的踏板造型。

## 资源

均由内置 imagegen 按确认设计图绘制，使用 WebP 压缩，透明通道与生成原图逐像素相同。

| 文件 | 尺寸 | 体积 | 用途 |
| --- | --- | --- | --- |
| assets/stage3/waterfall-layers.webp | 1448×1086 | 921,900 字节 | 左半为远景岩壁，右半为透明流动水幕 |
| assets/stage3/boulder-turns.webp | 1774×887 | 491,822 字节 | 四列两行，共八个翻滚转角 |

压缩命令：

~~~powershell
python games/contra2026/tools/prepare-stage-three.py --waterfall <layers.png> --boulders <turns.png>
~~~

原始生成图：

- C:/Users/zhting/.codex/generated_images/01a14d5a-42ff-7e33-bf4b-817e85c1bd0b/exec-d4a088fa-98bc-449c-ac99-227b26a6cbf1.png
- C:/Users/zhting/.codex/generated_images/01a14d5a-42ff-7e33-bf4b-817e85c1bd0b/exec-bab11293-0622-4645-aa8a-788ccbe5df0a.png

## 验证

163 项 Contra 测试通过，覆盖真实攀登、落石尺寸与数量、下落翻滚、冻结、反弹、命中、头盔与双人同步。普通本地入口 46 项资源全部就绪，第三关音乐正常播放，未包含 QA 接口。1536×864 画面采样中位帧间隔约 16.7ms，p95 约 16.9ms；这是本机单次采样，不代表所有设备。渲染重复执行不会改变世界状态。

已检查开局、喷火桥、山顶过渡与 Boss 场景，并核对水幕循环边界。截图和检查记录位于本机 .playwright-mcp/stage3-waterfall-design/。

## 完整绘制提示词：瀑布分层

~~~text
Use case: precise-object-edit.
Asset type: production game-background layer atlas derived from the APPROVED waterfall design in the input image.
Input image 1 is the approved design reference and edit target. Preserve its rich crisp HD pixel-painted waterfall art, cool layered wet cliffs, plunging veils of water, broken foam and spray. Remove every foreground platform, grass ledge, soldier, falling boulder, label, heading, border and concept-board UI.

Generate a 2048x1536 atlas containing EXACTLY TWO equal 1024x1536 upright rectangular cells side by side, with no gutter, no border, no labels. LEFT HALF (x0..1023) and RIGHT HALF (x1024..2047) are separate render layers, NOT two repeated scenes.

LEFT CELL: a FULLY OPAQUE deep background plate: dark wet blue-gray vertical cliff faces and deep crevices, interrupted by distant muted blue curtains of downward water. Close section of an enormous waterfall face; there is no cliff top, no waterfall lip, no horizon, no basin and no floor. Preserve the approved sketch's irregular negative spaces and rugged rock recesses behind the water. This layer will remain stable behind the moving water. Keep distant water significantly subdued and the overall plate medium-dark, with slate blue / desaturated cobalt, not bright white everywhere. Continuous art filling all four edges; top and bottom need a compatible vertically repeating texture with no horizontal boundary or dark frame. No regular grids, rows, brick pattern, sea waves or foliage.

RIGHT CELL: a GENUINELY TRANSPARENT foreground water-flow layer with alpha between the water strands. Across the cell distribute approximately five broad irregular VERTICAL ribbons of aerated falling water, separated by asymmetric transparent gaps, and finer thinner streams. Thick translucent blue-cyan sheets break into white foam filaments, little hanging strands, beads, and fine flying droplets. The water moves DOWN, all trails are vertical or very slightly wind-swept. Keep the flowing material from top to bottom, with compatible repeating top and bottom density. This layer must NOT have rock, cliffs, sky, a dark colored background, rectangular color backing or scenery at all: only the flowing water and spray over true alpha. No horizontal waves or horizontal foam bars; no regular equally spaced lines; no broad horizontal mist stripe. The darker transparent blue water masses and white filaments should occupy roughly 50–60% of this cell, with the rest genuine transparent space, preserving visibility of the left backdrop through it.

Lighting and material: cool natural cyan-white light caught by falling water, physical turbulent strands and depth, distant atmosphere and close spray matching the approved game-art design. Hand-painted HD PIXEL arcade style, fine deliberate texture, stepped highlights, NOT a photograph, NOT smooth vector graphics, NOT plastic 3D. Whole right cell transparent outside water, left cell opaque. No words, diagrams, character, boulder, mossy platform or duplicate panels.
~~~

## 完整绘制提示词：落石转角

~~~text
Use case: precise-object-edit.
Asset type: an eight-pose transparent tumbling-boulder sprite atlas for a 2D HD pixel arcade game.
Input image 1 is the APPROVED design and edit target. Use ONLY the natural gray-brown/ochre wet falling boulder from the design's right-hand material study. Preserve that thick, heavy, irregular single stone, deep shaded far side and underside, warm gray upper-left shoulder, small chipped edges, subtle moss staining and cool blue reflected light. Remove everything else in the concept sheet.

Generate a 2048x1024 TRANSPARENT atlas in EXACTLY FOUR equal columns and TWO equal rows, EIGHT equal 512x512 cells, no gutter or frame lines. In EVERY cell put exactly ONE full boulder centered precisely at the cell center (256,256 locally). Each stone must fit inside local x40..472 and y40..472, same scale and same registration across poses, approximately circular overall with a few asymmetric fractured shoulders and one memorable chipped notch. Each reads as ONE heavy mass, not a mosaic of small pebbles, metal ball, soccer ball, floating crystal or symmetrical sphere.

Pose order reading left-to-right top row then left-to-right bottom row: the SAME irregular boulder tumbling through 0,45,90,135,180,225,270,315 degrees around the axis pointing toward the viewer, with a modest three-dimensional wobble. Make each silhouette and major crack landmark follow that orientation. Critically, the LIGHT stays fixed upper-left in world space in ALL eight poses. Repaint the volume at each orientation: upper-left-facing planes catch broad warm highlights; lower-right/far planes are deep gray-brown; underside reflects restrained blue waterfall light. Do not simply rotate the entire prelit drawing like a flat sticker, and do not draw eight nearly identical circles. The poses must loop smoothly back to pose zero with consistent scale.

Crisp hand-painted high-definition PIXEL ARCADE material matching the approved thick ledge and boulder design. Rich fine stone grain, a few deep asymmetric cracks, convincing thick rounded stone mass with broad subtly fractured planes. Not photorealistic, not low-poly crystals, not vector outlines, not a plain gray disk with a black grid. No characters, background, floor, puddles, pedestal, drop shadow, external glow, water trail, surrounding water droplets, detached chips, other small rocks, words, numbers, labels or borders. All space around each complete isolated rock must be genuine alpha transparency; no baked checkerboard or dark rectangular backing.
~~~
