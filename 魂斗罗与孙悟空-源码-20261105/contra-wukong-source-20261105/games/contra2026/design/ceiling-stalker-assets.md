# 第八关顶部爬行与扑击怪

按用户提供的原作截图新增粉红色四肢攀爬异形。它先沿顶部组织移动，接近玩家后收肢蓄力，再从顶部释放并扑向玩家，落地后继续追击。素材通过内置 image_gen 生成八姿态图集，再使用同一内置工具修正透明底。

- [最终原生 PNG](H:/project/games/games/contra2026/assets/stage7/alien-ceiling-stalker-v1.png)
- [运行时 WebP](H:/project/games/games/contra2026/assets/stage7/alien-ceiling-stalker-v1.webp)
- [行为与绘制模块](H:/project/games/games/contra2026/js/ceiling-stalker.mjs)
- [独立交互预览 HTML](H:/project/games/games/contra2026/design/ceiling-stalker-preview.html)

保留 1774 × 887 原生 RGBA 与透明通道，四列、两行，共八帧。两帧顶部爬行、一帧收肢蓄力、一帧向下蹬离、一帧空中扑击、一帧落地缓冲、两帧地面跑动。所有单元以相同 0.055 原生比例绘制，通过独立肢体姿态表达运动；左右朝向仅作水平镜像。第一版图集的白色背景存在非零 alpha，未用于游戏；最终选用内置透明底编辑后的版本，并保留其原生尺寸及 alpha。WebP 只进行格式压缩。

## 行为与关卡接入

第八关设置六处悬顶组织和六只攀爬怪。悬顶使用已有融合组织断面绘制，为钩爪提供可见的攀附边缘，不增加玩家通路的实体碰撞。怪物在可见区域内巡回爬行，先移动至少约 0.6 秒；玩家处于下方且水平距离小于 96 像素时，进入约 0.4 秒的收肢蓄力。扑击瞄准蓄力时记录的位置，释放后按弹道移动，玩家可通过移动躲开。

怪物会穿过高于目标的一向承托平台，落在目标所在高度附近；玩家本就在平台上时会落到该平台，实体结构仍可承托。落地有约 0.18 秒缓冲，再进行地面追击；玩家移到下方时，怪物也会从单向平台继续落下。

怪物 2 点生命、可被正常武器击倒，奖励 150 分；可伤害本机或队友。声波可消灭它，冻结与暂停保留动作帧、阶段、瞄准位置及速度。状态通过现有联机快照同步，重玩重新创建。新图集只在第八关下载。

## 验证

540 项魂斗罗及共享引擎悟空回归测试通过：[测试记录](H:/project/games/games/contra2026/design/ceiling-stalker-tests.tap)。覆盖可见爬行、蓄力期间不瞬移、固定扑击目标、玩家移动躲避、真实地形落点、单向平台与实体承托、双人接触、冻结与暂停、快照、击破与得分、重玩恢复、八姿态选择及资源隔离。

已检视两次生成结果，并验证最终原生尺寸与透明通道。浏览器实机画面尚未复核：此前自动审批因账户额度限制未能通过，本轮没有绕过该限制。独立预览使用实际模型和绘制模块，可暂停、重播和模拟向右移动躲避，不是通关录像。

## 完整内置生成提示词

Use case: stylized-concept. Asset type: EIGHT registered animation poses of the PINK ceiling-running alien from the supplied original-game screenshot, for a detailed side-scrolling alien arcade game. Create only this creature, no ceiling/background. A lean magenta-pink fleshy reptilian alien with a low elongated toothy head facing LEFT, arched ribbed spine, two long hooked front arms, two springy bent hind legs with ivory grasping claws, and a thin curled tail. No human clothes, guns, hair or wings. Richly shaded painted pixel-game style matching dark violet organic cavern art, wet highlights and deep maroon creases, readable at 20 pixels. Exactly EIGHT square equal cells arranged FOUR columns and TWO rows, preferably 2048x1024. Identical scale, camera, facing and upper-left lighting. Register the TORSO CENTER at cell 50%,50% in every pose, no translation between cells; all anatomy inside generous clear margins. Ceiling gripping line at about y15%, ground foot line y85%. Left to right then second row: 1 inverted ceiling crawl, front-left and rear-right hooked claws grip above torso while opposite limbs swing; 2 opposite ceiling crawl step, front-right/rear-left claws grip above torso and opposite limbs pull forward; 3 ceiling windup crouch, knees and elbows fold tight, all gripping claws drawn together above torso, preparing to release; 4 launching DOWN from ceiling, hind claws push away above while long front claws reach downward and forward; 5 airborne pounce, arched torso and limbs spread toward prey below, hind legs folded and tail swept back; 6 landing cushion, hind knees deeply flex, front claws brace on common ground line; 7 upright ground running step, left limbs planted below torso at y85%, opposite limbs swinging; 8 opposite upright ground running step with visible joint changes. True articulated limbs, no overall stretch or identical rotated copies. The ceiling poses hang below their gripping claws; ground poses carry torso above feet. No text, labels, grid, frame numbers, ground, ceiling, shadow, checkerboard or backdrop. Genuine alpha transparency around every creature and between limbs.

## 完整透明底编辑提示词

Targeted background-extraction edit of the supplied EIGHT-CELL pink alien animation atlas. Preserve all eight creatures EXACTLY: identical colors, anatomy, lighting, poses, pixel detail, cell positions, scale and 1774x887 overall dimensions. Change ONLY the background/alpha. Remove the entire opaque off-white paper-like background, ALL texture/noise outside the creatures, and EVERY floor/shadow around claws. The outside of each creature, the large gaps between all eight cells and the negative spaces between bent limbs and tail must have true ALPHA=0 transparency. Keep ivory claws and teeth opaque, and keep real pink creature surfaces and dark mouth interiors opaque. Do not replace white with black, checkerboard, any other color or translucent white. No changes to body shapes or atlas registration; keep the 4-column 2-row layout exactly. The corners and all empty cell gutters must be genuinely transparent.

