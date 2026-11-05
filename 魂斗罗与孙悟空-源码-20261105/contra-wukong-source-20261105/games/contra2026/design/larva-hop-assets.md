# 第八关幼体屈腿跳跃

使用内置 `image_gen`，以原有浅色幼体 `alien-larva-v1.webp` 为造型参考，制作 3 列 × 2 行六姿态图集，并通过内置编辑完成透明底处理。保留 1536 × 1024 原生尺寸及 alpha 通道，WebP 只进行格式压缩。

最终文件：

- [PNG 原图](H:/project/games/games/contra2026/assets/stage7/alien-larva-hop-v1.png)
- [运行时 WebP](H:/project/games/games/contra2026/assets/stage7/alien-larva-hop-v1.webp)

六姿态分别为站立、蹲伏、蹬腿、空中收腿、下降伸脚、落地缓冲。动作跟随真实起跳速度、空中时间和落地计时，不改变跳跃轨迹、速度或碰撞范围，不以整张素材拉伸代替屈腿。统一比例为 0.0355；地面姿态按脚爪接触点定位，空中共用身体参考点，让收腿姿态的爪尖上抬。朝向在落地后保留。暂停、冰冻和联机快照保留阶段，冰冻外观缓存额外区分所选动作单元。

## 图集生成提示词

Use case: six-pose game animation atlas, preserve the identity of the reference alien larva.
Reference: the attached existing small cream-pink hopping alien from Contra2026. Preserve the oversized ivory-pink organic shell/head, open dark red fanged mouth facing LEFT, fleshy crimson underside, and TWO long articulated insect hind legs ending in hooked ivory claws. Same richly shaded glossy painted arcade pixel-art style. This is the small pale larva, NOT the purple adult crawler.
Create exactly SIX clear sequential jump poses on a genuinely transparent atlas, three equal columns by two equal rows, left-to-right top-to-bottom. Approximately 1500 x 1000 px canvas, square equal cells, one entire creature per cell. Keep the same identity, size, camera view, body proportions and upper-left lighting across all six poses. Large clean transparent gaps between cells, no clipping. No labels, outlines of cells, environment, ground, shadow or checkerboard.
POSE 1: neutral standing stance, jointed knees partly bent, both claw feet planted.
POSE 2: preparation crouch: knees deeply fold, hips lower, thighs curl under the body, planted feet remain on the SAME ground line as pose 1.
POSE 3: takeoff push: hind legs visibly extend at knee and ankle to push down/back, toes stretched, body slightly pitching upward.
POSE 4: midair tuck: BOTH knees visibly fold tightly up toward the belly; claws are pulled up underneath and close to the hips. Show very clearly shorter distance from hip to foot. Keep the body/head near the same common torso anchor as poses 1 and 3; this is anatomical leg bending, NOT a stretched or rescaled body.
POSE 5: descent reach: knees unfold downward, hooked feet extend forward/down in readiness for landing, body still compact.
POSE 6: landing cushion: both claws contact the original common ground line, knees flex strongly outward and hips lower to absorb impact; different from takeoff, then flows to the neutral stance.
Registration: all grounded poses 1, 2 and 6 share a foot contact baseline at about 84 percent of the cell height and common horizontal body center. Across aerial poses keep the torso registered near the neutral torso position; tucked feet in pose 4 must sit visibly ABOVE the ground baseline, leaving transparent space under the bent legs. No horizontal body translation. Feet and claws entirely visible in every pose. Vary only true articulated joint positions, small natural body pitching and compression due to posture. Avoid six copies of the same silhouette. Maintain real alpha transparency between the legs and around the creature.

## 透明底编辑提示词

Targeted edit of the supplied SIX-CELL larva jump animation atlas.
Change ONLY the background: remove every part of the brown/black soft gradient background and every cast floor shadow beneath the claws, replacing ALL empty space with TRUE alpha transparency. The entire space outside all six creatures, including the gaps between and inside bent legs and the open mouth's external negative space, must be transparent. Do not replace the background with a checkerboard, black, white or another solid color. Keep actual dark red mouth interiors and organism material opaque.
CRITICAL INVARIANTS: preserve the exact canvas dimensions, exact 3-column x 2-row layout, pixel positions, scale, colors, detailed shading and anatomical poses of all six monsters. Do NOT redraw or reshape the pale shell, muscles, bent legs or hooked feet. Do not recenter, resize, or move any individual cell. Preserve all six distinct jump states, especially the tightly tucked legs in the lower-left cell and crouched landing pose in the lower-right cell. Clean alpha edges only; no bright fringe, no ground shadows and no surrounding glow. Production transparent sprite atlas.
