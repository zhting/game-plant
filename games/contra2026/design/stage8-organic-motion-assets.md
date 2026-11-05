# 第八关活体组织、机关与结尾动画

地面与悬空平台现使用后续的 [融合厚实组织断面方案](H:/project/games/games/contra2026/design/fused-tissue-platform-assets.md)：完整组织底层加融合断面动作图集，替换下文原先单独排列肠状器官的做法。机关、囊体与结尾动画保留。

素材使用内置 image_gen 生成，PNG 保留原生 RGBA 和尺寸，WebP 只做格式压缩；运行时资源已加入第八关预加载，其他关卡不下载。

| 素材 | 原生尺寸 | 原图与运行文件 |
|---|---|---|
| 撕裂深坑 | 1642 × 958 | [PNG](H:/project/games/games/contra2026/assets/stage7/alien-chasm-v2.png) · [WebP](H:/project/games/games/contra2026/assets/stage7/alien-chasm-v2.webp) |
| 骨质地刺 | 1024 × 1536 | [PNG](H:/project/games/games/contra2026/assets/stage7/alien-bone-spike-v2.png) · [WebP](H:/project/games/games/contra2026/assets/stage7/alien-bone-spike-v2.webp) |
| 肠状器官八姿态 | 1774 × 887 | [PNG](H:/project/games/games/contra2026/assets/stage7/alien-intestine-motion-v2.png) · [WebP](H:/project/games/games/contra2026/assets/stage7/alien-intestine-motion-v2.webp) |
| 背景囊体四姿态 | 1254 × 1254 | [PNG](H:/project/games/games/contra2026/assets/stage7/alien-cyst-motion-v2.png) · [WebP](H:/project/games/games/contra2026/assets/stage7/alien-cyst-motion-v2.webp) |

洞壁直接绘制原始纹理，移除条带和网格扭曲。悬挂囊体用四个注册姿态表示上腔收缩、下腔充盈和根须收放，并与触须、孢子和局部光照独立运动。地面血管边固定，下面的肠状组织按世界坐标分段播放八姿态收缩，各段相位错开。组织时钟只在游戏运行且未冻结时推进，并包含在联机快照中。

深坑的撕裂边缘与实际缺口定位，保留原有跳跃距离和碰撞边界。骨刺从固定根部滑出、回收，主刺始终保持同一尺寸；预警、伸出和回收共用实际碰撞高度函数。黏液用独立曲线和渐变绘制分泌口、凝结液滴、变细的液颈、脱落尾丝、落地飞溅和扩散湿痕，取代圆点及方形粒子。暂停保持姿态，冻结液滴不会伤害任何一名玩家。

修复第八关被已开放关卡边界提前送往结算的问题，最终母巢摧毁后播放原有 44 秒结尾：直升机撤离、岛屿爆炸、朝阳返航、通关统计和字幕，最后显示成绩页。结尾使用已有合成配乐及事件音效，无新增音频下载。开头 0.6 秒防误跳过，之后支持本机按键、触屏及联机队友跳过。分数、生命、阵亡、游戏用时及武器不会因结尾重新初始化。

## 验证

- 521 项魂斗罗相关测试及共享引擎悟空回归测试通过，记录：[测试输出](H:/project/games/games/contra2026/design/organic-motion-regression.tap)。
- 实际生产引擎依赖图 96 个模块通过 Node VM 编译和导出链接检查。
- 自动化覆盖最终 Boss → 44 秒结尾 → 成绩页、本机及队友跳过、联机快照、黏液落地及冻结、器官姿态注册、地刺比例与碰撞高度、第八关资源隔离，包含之前的幼体屈腿跳跃回归。
- 已检视生成素材的原图、尺寸与 alpha。浏览器实机复核尚未完成：前一轮自动审批因账户用量限制拒绝执行浏览器检查。本轮未绕过该审批。离屏绘图库的下载也因网络 DNS 不可达未成功，因此没有声称完成合成画面的视觉验收。
- [独立交互预览](H:/project/games/games/contra2026/design/stage8-organic-motion-preview.html) 使用真实绘制模块，可暂停、逐帧和拖动时间，供额度恢复后的检查使用；它不是通关录像。

## 深坑（提示词摘要，原始调用位于前一轮）

Use case: high-detail side-scrolling game hazard terrain cutout.
Reference image: existing red vascular rim and brown intestine floor, used as style reference.
One single broad chasm cross-section, strict SIDE VIEW. Walkable red vein rim at left and right; a wide opening at the top, NO bridge.
Jagged flesh, cut intestinal roots, layered purple-black inner walls, thin tendons and slime trails at the sides. Dark center and bottom, muted magenta reflections, irregular edges.
Readable at 70 x 45 pixels. Transparent outside edges. No character, enemy, UI, checkerboard, flat gradient rectangle or diagonal decorative lines.

## 骨质地刺

Use case: stylized-concept. Asset type: one transparent organic retractable floor spike for a detailed side-scrolling alien arcade game. One complete tall narrow curved ivory chitin thorn with a sharp jagged tip, ribbed segmented bone, dark burgundy grooves, sinewy crimson tendons spiralling down its shaft, small lateral barbs and a fleshy maroon flared root socket with veins and wet highlights. Strict SIDE view, static upright fully extended pose. Richly shaded hand painted pixel game aesthetic, upper left lighting, violet shadows, readable silhouette when rendered 64px high, not photoreal photograph. The main shaft is slender, root is 1/3 of total height wide. Whole object with margins, tip near y8%, ground contact baseline y90%, root above ground, no ground/environment/characters/UI/text/shadow. Genuine transparent alpha background, no black field, no checkerboard. Portrait canvas.

## 肠状器官八姿态

Use case: stylized-concept. Asset type: EIGHT FRAME sprite sheet of a living intestinal tissue patch for a side view alien arcade game floor. Exactly FOUR equal columns and TWO equal rows on a transparent canvas, preferably 2048x1024; each cell shows the SAME horizontal compact cluster of 5 glossy brown / auburn intestine loops, dark crevices, fine blood vessels and tiny connective cords. Detailed painted pixel game shading, crimson reflections, upper left light. No red top rim: only brown intestinal loops, not a character. Full patch fits inside each cell, broad and squat, wide margins. Sequence left to right then next row: 1 relaxed loops; 2 left loop tightens at its neck; 3 left loop contracts and central loop visibly fills; 4 central chamber bulges and pushes adjoining loops apart; 5 contraction travels into right loop; 6 right chamber squeezes with visibly narrower neck; 7 loops unwind; 8 relaxed returns toward 1. Real changing anatomy: each loop bends, pinches and changes the spaces BETWEEN neighboring loops; retain identical outer anchor points, identical camera, color, apparent scale and cell registration. Do not just distort or resize eight copies. No whole-sheet perspective, no grid lines, no labels, no text, no background, no shadow, no checkerboard. Genuine alpha transparency between separated folds and around every patch.

## 背景囊体四姿态

Use case: stylized-concept. Asset type: FOUR registered animation poses of one hanging living alien organ, a background detail for a richly detailed side-scrolling arcade game. Transparent sprite atlas exactly TWO equal columns and TWO equal rows, ideally 1024x1024, one complete object per square cell with large clear margins. Same maroon / violet veined membranous cyst hanging from a short branched dark fleshy stalk fixed at top center, tangled root cords at bottom, narrow pink bioluminescent slits. Detailed painted pixel art material: layered ribbed shell edges, wet specular streaks, fine capillary vessels. Dark enough for background. Pose1 relaxed pear-shaped chamber; pose2 stalk stays fixed but upper chamber visibly squeezes, lower chamber fills; pose3 chamber inflates rounder and slits open, roots unfurl; pose4 chamber contracts at lower neck, folds close and roots curl back. Anatomical changes of individual lobes and cords, not full image stretch/scale. Identity and fixed stalk anchor at x50% y12% in every cell, root tips within y90%. No characters, no environment, no text, no cell borders, no floor shadow, no checkerboard or background; REAL alpha transparency between root branches and around the complete organs.

