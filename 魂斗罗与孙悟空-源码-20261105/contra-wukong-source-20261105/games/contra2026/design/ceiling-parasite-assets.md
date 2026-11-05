# 第八关上下寄生怪与白色漂浮怪

按用户提供的原作截图，新增嵌在顶部器官组织里的粉紫色寄生怪，以及它吐出的白色触须漂浮怪。两套素材使用内置 image_gen 以截图为造型参考生成，各保留 1254 × 1254 原生 RGBA PNG 和 2 列 × 2 行注册图集；WebP 仅进行格式压缩，保留相同 alpha。

| 素材 | 原图 | 运行时 |
|---|---|---|
| 顶部寄生怪 | [PNG](H:/project/games/games/contra2026/assets/stage7/alien-ceiling-parasite-v1.png) | [WebP](H:/project/games/games/contra2026/assets/stage7/alien-ceiling-parasite-v1.webp) |
| 白色漂浮怪 | [PNG](H:/project/games/games/contra2026/assets/stage7/alien-white-floater-v1.png) | [WebP](H:/project/games/games/contra2026/assets/stage7/alien-white-floater-v1.webp) |

[行为与绘制模块](H:/project/games/games/contra2026/js/ceiling-parasite.mjs) · [交互预览](H:/project/games/games/contra2026/design/ceiling-parasite-preview.html)

## 游戏行为

沿关卡安排四组、每组两只寄生怪，固定于 y=32 或 y=48 的顶部组织中；每组错开喷吐时间。顶部组织复用现有高清肠状地形贴图，作为独立场景层保留，寄生怪被击破后组织不会消失。

底部另外安排四组、每组两只，嵌入 y=176..216 的地板组织中，嘴部中心为 y=196。所有位置都落在完整实地内，避开坑口，并复用同一寄生怪图集。底部与顶部采用不同的初始喷吐时间；白色小怪从底部嘴部向上漂出。新生小怪保留底部出生高度，逐帧穿出地板组织后才进入常规悬浮高度范围，避免刚出生就被高度限制瞬移到地面上方。出生方向、出生高度和是否已升出地面的状态包含在联机快照中。

寄生怪有闭嘴、张嘴、完全打开与收口四个原生动作姿态。攻击前先张嘴预警约 0.55 秒，再吐出一只白色怪物，随后收口；下一轮间隔约 3.5 秒。顶部的小怪先从嘴部漂下，底部的小怪先向上漂出，再以慢速、平滑的横向运动及上下摆动接近玩家，触须按四个独立屈伸姿态播放，不用整张纹理拉伸。上下寄生怪共用全场最多八只白色小怪的上限，每只最多存留 8.5 秒，并在飞出镜头后移除。

寄生怪 6 点生命，白色小怪 1 点生命，均可击破，分别奖励 300 分和 50 分。白色小怪接触本机或队友会造成伤害；声波可清除它们，冻结和暂停保持生成阶段、嘴部姿态和漂浮动作。全部行为数据通过现有联机快照同步；重玩重新创建寄生怪，不继承上轮漂浮怪。两套新资源只在第八关预加载。

## 验证

533 项魂斗罗及共享引擎悟空回归测试通过：[测试输出](H:/project/games/games/contra2026/design/floor-parasite-tests.tap)。包含真实引擎的预警、生成、分别击破与得分、双人接触、冻结和暂停、联机快照、重玩恢复，以及独立动作图集、顶部组织保留、生成上限和素材加载隔离检查。底部扩展额外验证全部寄生怪嵌在实地组织范围内、向上生成、逐帧平滑升出地面及上下共用生成上限；预览增加顶部/底部切换。

已检视生成原图并检查原生尺寸与透明通道。浏览器实机画面尚未复核：此前自动审批因账户额度限制未能通过，本轮没有绕过该限制。交互预览是实际绘制模块的独立预览，不是通关录像。

## 完整内置提示词：顶部寄生怪四姿态

Use case: stylized-concept. Asset type: FOUR registered poses of ONE ceiling-attached parasite mouth for a richly detailed side-scrolling alien arcade game. Reference: the supplied original-game screenshot shows pink-purple round parasitic mouths embedded in the intestine ceiling. Create only a single reusable organism in each cell, NOT the environment or white creature. Front-facing circular fleshy mouth with thick layered magenta/violet lips, small ivory teeth, deep black wet interior, short ribbed folds and lobes around its edges, a broad torn tendon root across its UPPER edge attaching to the ceiling. Detailed painted pixel-game rendering, glossy membrane highlights, fine veins, shadowed wrinkles, crimson rim light. Exactly FOUR equal square cells arranged TWO columns by TWO rows on a genuinely transparent square atlas, preferably 1024x1024. Same fixed mouth center at cell 50%,53%, same size and lighting throughout, ample margins and entire root visible. Frame1 thick lips shut to a small horizontal slit with a few teeth visible. Frame2 lips part and curl outward, throat begins opening. Frame3 fully gaping circular dark throat, fleshy lip folds visibly pulled apart. Frame4 spent mouth contracts with wrinkled lips, thin wet strands between teeth; transitions back to frame1. Actual lip and tissue articulation; no four identical resized images. No text, UI, cell borders, frame numbers, ground, backdrop, shadow or checkerboard. True alpha outside the mouths and between root tendons. Designed to read clearly at 24 pixels across.

## 完整内置提示词：白色漂浮怪四姿态

Use case: stylized-concept. Asset type: FOUR-frame transparent animation atlas of the WHITE floating creature emitted by the pink ceiling parasites in the supplied original-game screenshot. Create one tiny pale ivory-white amoeba/medusa-like alien per cell, soft plump opalescent central body, a small dark pink underside mouth, faint lilac veins and pink translucent shadows, EIGHT short fleshy filament/tentacle arms radiating from the sides in curled wisps. It is a physical fleshy organism with readable lobes and a few glossy ridges, NOT a ghost, glowing ball, particle burst, jellyfish aquarium photograph or a winged insect. Keep most body white/ivory, pink only in shadows and roots. Richly shaded painted arcade pixel-game style, crisp silhouette and real anatomy readable at 16 pixels. Exactly FOUR equal square cells in TWO columns by TWO rows, preferably a 1024x1024 square transparent atlas. All body centers registered at 50%,50%, same apparent size, same upper-left lighting and view. Frame1 rounded bulb with tentacles loosely curled inward. Frame2 tentacles actively unfurl and sweep outward/back. Frame3 body softly cups and side tentacles reach forward while lower filaments fold. Frame4 tentacles contract and coil back in readiness for frame1. True articulated tentacle motion and individual folds, not four rotated/resized copies. Large transparent margins between cells, no environment, floor, shadows, text, labels, borders, checkerboard, bloom halo or background. Preserve genuine alpha transparency between all arms and around every creature. Only the white minion, no parent parasite or wall.

