# 第八关怪物大脑

使用内置 `image_gen`，以用户提供的当前关底截图为画风和配色参考，生成独立大脑主体；再以大脑为材质参考生成弯曲护骨。保留各自 1355 × 1161 和 1942 × 809 原生尺寸与透明通道；WebP 只做格式压缩。外围现为上二、下二四个独立吐怪机关，复用本关四帧寄生口器，破损后显示暗化组织与撕裂伤口；新增粉色有角浮游幼体，详见 [四个吐怪机关与素材记录](H:/project/games/games/contra2026/design/hive-four-ports-assets.md)。护骨共用一张贴图，分别以关节为轴转动张开，不伸缩骨片。

最终文件：

- [大脑 PNG 原图](H:/project/games/games/contra2026/assets/stage7/alien-hive-brain-v1.png)
- [大脑 WebP](H:/project/games/games/contra2026/assets/stage7/alien-hive-brain-v1.webp)
- [护骨 PNG 原图](H:/project/games/games/contra2026/assets/stage7/alien-hive-rib-v1.png)
- [护骨 WebP](H:/project/games/games/contra2026/assets/stage7/alien-hive-rib-v1.webp)

大脑绘制保持原有核心受击中心和宽高比；外侧血管、神经根与巢穴纹理衔接。核心防护、外围器官破坏、核心暴露与通关流程保留。专用组织时钟随暂停和冰冻冻结，并通过现有联机快照同步。第八关新增大脑与护骨两张图片，其他关卡不下载这些素材。

中途守卫现按原作参考拆成地面的半高骨甲墙与右上方探出的怪物头颈；墙体、头部受击范围和空中阻挡分别定义，击败后移除墙体并恢复镜头前进。详见 [半墙与头颈设计记录](H:/project/games/games/contra2026/design/guardian-halfwall-assets.md)。第六关既有火焰高架仍包含左侧上跳、顶部越过与右侧下降路线。

## 护骨完整提示词

Use case: one reusable articulated bone sprite for an arcade monster-brain boss.
Style reference: the attached detailed alien brain establishes glossy dark purple and crimson organic materials and richly shaded painted arcade pixel-art rendering.
Create ONE isolated curved protective rib/claw plate, not a full cage and not a creature. Horizontally elongated shape about 3.5 times wider than tall. Thick knobby fleshy purple hinge on the LEFT, small crimson tendon fibers wrapping that hinge, followed by a sculpted warm ivory bone that arcs gently upward across the middle and tapers to a sharp curved point on the RIGHT. The root center is near the left end at mid-height; the tip ends at approximately the same height as the root so this forms a shallow arched rib, not a straight spike. Distinct bony knuckles/ridges, a few tiny pores and hairline cracks, pale ivory upper ridge, bruised purple shadow under the bone, fine wet membrane where bone meets the joint. Side view facing right, consistent upper-left lighting, anatomical and sinister, organic rather than metal.
Production constraints: exactly one complete bone sprite centered in a wide landscape canvas with generous transparent padding. TRUE alpha background, transparent around and beneath the arch. No text, background, other ribs, skull, brain, shield, ground shadow, UI or checkerboard. Keep it rigid, detailed and readable at 35 pixels wide. The game will mirror it for the opposite side and rotate it around the root joint to open a protective cage. Approximately 1200 x 500 PNG.

## 大脑完整提示词

+Use case: production game boss sprite, isolated transparent asset.
Reference image: the attached current Contra2026 alien hive screenshot is for palette, painted arcade sprite texture and dark purple biological-cavern atmosphere only. Replace its simple central red orb with a convincing MONSTER BRAIN. Do not reproduce the screenshot layout, UI or background.
Primary request: one beautifully detailed gigantic alien brain, a standalone transparent cutout for the final boss of a side-scrolling arcade shooter. It must unmistakably read as a brain: two irregular lobed cerebral hemispheres, a deep central longitudinal fissure, many branching convoluted gyri and sulci with substantial sculpted depth. Oval broad brain mass slightly wider than tall, seen nearly front-on in a mild left-facing three-quarter view so it reads clearly at 65 pixels wide. Keep the silhouette compact and recognizable at game scale.
Materials and detail: wet living dark crimson and bruised magenta cerebral folds, purple membranous connective tissue around the perimeter, finely branching red veins running in sulci, small luminous red-violet neural nodes deep between folds, subtle pale glistening highlights from upper-left lighting. A few short bundled nerve roots and a small brainstem emerge below and at the rear-right, tapering to connect into the hive wall; leave them short, body mass dominates the image. Deep dark crease occlusion, not flat line patterns. Richly painted realistic arcade pixel-art shading matching the supplied scene, crisp detailed edges, no photographic gore.
Composition: single complete brain centered, generous transparent padding on every side, no cropping. No pedestal or container. No skull, eyeballs, face, teeth, ribs, shield or bone cage; these protective parts will be animated separately in the game. No long spine or wall/background. No text, labels, border, ground shadow, checkerboard or UI. Genuine alpha transparency throughout outside the creature. Approximately 1400 x 1200 px transparent PNG. Only one creature, no sprite sheet.
