# 第三关：高清 Boss、参差石墙与闪烁星空

后续已重新生成更细致的 v3 身体、口部和匹配残骸，并将喷火桥换成八帧火焰；当前素材及验证见 [第二至第四关修正](multi-stage-polish.md)。下文保留上一版制作记录。

本次只在本地试玩分支修改，未推送或部署第三关。

## 素材与绘制方式

使用内置 imagegen 编辑模式，参考用户提供的关底截图、旧 Boss 素材和已经完成的高清岩台。重绘为原生宽幅造型，避免把竖长原图强行压成宽形。生成结果实际为 1254×1254，两帧上下排列。

- 正常与张嘴素材：`assets/stage3/waterfall-guardian-hd.webp`，607,420 字节。
- 破坏素材：`assets/stage3/waterfall-guardian-hd-wreck.webp`，467,926 字节。
- 两张均为 WebP quality 96、method 6、exact alpha；与生成 PNG 的透明通道逐像素相同。
- 正常原图：`C:/Users/zhting/.codex/generated_images/01a14d5a-42ff-7e33-bf4b-817e85c1bd0b/exec-8243d9ee-3164-435e-9aa7-811deb3590b3.png`。
- 破坏原图：`C:/Users/zhting/.codex/generated_images/01a14d5a-42ff-7e33-bf4b-817e85c1bd0b/exec-98df2050-8629-4144-a7a3-726c1e169c34.png`。

压缩素材合计 1,075,346 字节，比此前两张 Boss WebP 合计减少约 63%。预加载仍是 47 项资源。

重建：

~~~powershell
python games/contra2026/tools/prepare-stage-three.py --guardian-hd <normal.png> --wreck-hd <wreck.png>
~~~

## 比例与动画

静态主体采用 [0,0,1254,638]，显示时只用一个比例因子，居中并将基座对齐山顶地面。显示区域约 300×152.63 逻辑像素；原生像素不足显示密度时关闭插值，避免放大时额外抹平细节。

生成图两行的门框存在小幅配准差异，因此不整帧切换：张嘴时保留闭嘴帧的门框、肩部、头冠和肋骨，仅叠加第二行的口部。口部覆盖范围为椭圆中心 [627,245]、半径 [151,109]，外缘使用窄过渡；身体与门框不会因张嘴而位移。破坏后使用新绘制的开门残骸。

两条链臂整体加大约 30%：关节由 11.5 增至 15，爪心由 16 增至 21，肩座由 17 增至 22；五节总长由 64.5 增至 83.5。肩部对齐新的素材轴承，爪心弱点扩为 20×20，绘制、接触伤害、弱点和开火位置继续共享同一姿态。

接触规则：中央门板、静态本体和口部核心不造成贴身伤害，玩家可在中间正常跳跃。角色接触伤害只使用链臂与爪心的动态范围，火球仍按实际弹丸命中；子弹仍可攻击原有弱点，开口条件与通关流程保持原规则。自动化覆盖没有无敌或护盾状态的单双人二段跳穿过核心，以及链臂、爪心与火球的伤害。

## 石墙和夜空

石墙使用已有高清落石的完整岩块分层交错搭接，高低与尺寸按固定世界坐标确定。顶部由岩块自身的透明轮廓结束，没有整齐切断纹理；底部继续向瀑布渐隐。实机采样的顶部起伏为 17.2 逻辑像素。

夜空有 68 颗固定星点，分别使用不同速度和相位闪烁，亮度有稳定下限；少量亮星出现细小星芒。星点先于石墙绘制，自动被岩块遮挡，不覆盖在石头上。镜头移动只改变可见区域，不重新随机排列星星。

## 验证

浏览器核对闭嘴、张嘴、破坏状态和四种不同链臂姿态；新贴图与预加载正常。截图、像素检查和回归测试记录保存于本机 `.playwright-mcp/stage3-boss-detail/`。自动化验证宽高等比例、素材透明通道与裁切边界、星点固定且错相闪烁；原有引擎验证链臂接触、实际子弹命中与通关路径。

## 完整正常素材提示词

~~~text
Use case: precise-object-edit.
Asset type: a production-ready transparent two-frame sprite atlas for the waterfall BOSS in our HD pixel Contra game.
Input image 1 is the USER'S GAME SCREENSHOT and primary shape/composition reference. Its current boss was squashed horizontally and looks blurry. Preserve the iconic WIDE crown, olive-gold alien face, swept horns/ribs and broad silver industrial gate, but redraw crisp detailed shapes in their own correct native wide proportions. Input image 2 is the OLD narrow/tall sprite atlas: preserve the creature identity and closed/open jaw states, but do NOT preserve its tall aspect ratio. Input image 3 is our finished grass/rock asset, supporting reference for richly detailed HD pixel-painted material quality.

OUTPUT: one square 2048x2048 atlas with TWO WIDE FRAMES STACKED VERTICALLY, NOT side-by-side. Each frame is exactly 2048x1024. The upper row is jaw CLOSED; the lower row is jaw OPEN. In each row draw the SAME entire boss-and-gate object, in precisely the same position, size, silhouette and lighting, occupying x96..1952 and local y38..1003. Complete object ratio about 1.92:1. Transparent gutters between rows, all object parts inside their frame. Upper row ground line local y1003; lower row ground line y2027. Absolutely no stretching a tall drawing: actually design the creature and doorway for this wide horizontal shape.

The boss, from the source screenshot:
- broad flattened swept alien crown with two long lateral horns, angular olive-gold exoskeleton plates, magenta eyes under deeply carved brows, a solid dimensional snout and large ivory-yellow fangs. Keep the face anatomically readable and proportionate; the crown is wide, the individual facial features are NOT smeared or elongated.
- The mouth center is at 50% of the full object's width and around 30% of its height. In the upper row the jaw is closed with interlocking fangs. In the lower row open a deep dark oral cavity around the SAME mouth center, with ivory upper teeth and a hinged lower jaw; keep all stationary head, brow, horns, shoulders and gate perfectly registered.
- Splayed skeletal golden ribs, long swept horns and layered gold armor wrap behind both sides of the silver doorway. Two GOLD SHOULDER SOCKETS are clearly visible around x23% and x77% of the whole object, y44% of its height; the moving gray chain arms attach there in code. Draw only these circular shoulder bearings, NO arms, hands, chain segments, red shoulder lights or additional targets.
- The lower half is a broad silver gunmetal industrial gate with raised arched surround, thick ribbed outer pillars, inset central plate, four small dark rectangular vents, structural piston cylinders along the bottom. Its bottom rests on one level baseline. It must have believable beveled thickness, inset panels, bolt heads, tiny metal wear and material texture; preserve the source's game silhouette, do not turn it into a modern sci-fi portal or robot.
- Upper-left illumination; dark olive recesses, muted gold midtones and small sharp warm highlights on the alien shell; steel blue-gray recesses, silver bevel edges and restrained scratches on the gate. Clear material separation and deep local crevices. The creature and gate should feel like a finely painted arcade boss, with weight and layered volume.

STYLE: crisp richly detailed HD PIXEL-PAINTED 2D arcade sprite, matching the supplied finished terrain. Refined small stepped highlights, carefully shaped outlines, sculpted plate thickness, fine irregular surface marks. Natural sharp material edges. No blur, no smeared AI painterly surfaces, no low-resolution NES pixels blown up, no soft bloom, no plastic, no flat yellow linework. Do not add excessive noisy scratches to every surface.
Keep every stationary part registered between the two frames; change ONLY jaw pose and mouth interior. Front view, no camera tilt and no perspective skew.
GENUINELY TRANSPARENT BACKGROUND around both whole silhouettes and between the rows. Remove all sky, stone wall, grass, ground, character, bullets, fireballs, sparks, text, labels, UI, panels and frame borders. No colored rectangular backing, no fake transparency checkerboard, no cast shadow outside the boss. Exactly these TWO complete boss-and-gate frames, stacked vertically.
~~~

## 完整破坏素材提示词

~~~text
Use case: precise-object-edit.
Edit target: image 1, our newly redrawn WIDE two-row boss atlas, actual 1254x1254. Supporting reference image 2 is the OLD defeated boss, only for what should be destroyed.
Produce the matching DEFEATED sprite atlas. Preserve the target's exact wide proportions, canvas size, TWO vertically stacked frames, outer gold rib/horn silhouettes, shoulder sockets, silver side pillars, base lines, position and pixel-painted detail. Do not rearrange or narrow anything.
In BOTH rows, remove the entire alien face/head, brow crown, eyes, snout, mouth, fangs and central neck, leaving the existing outer golden rib structures and a few short jagged broken neck/root stumps. The resulting space above the door and between the ribs must be genuinely transparent so our starry sky shows through. No residual face, eye, crown or floating detached piece.
Breach the center silver door into one tall, walkable black opening: remove the flat center plate and central bottom pistons. Keep the silver outer arched door rim and both outer pillar stacks at exactly the target coordinates, with naturally fractured metal edges and tiny bent braces framing the passage. The dark passage itself may be opaque near-black, but the outside of both complete sprites must stay alpha-transparent.
No explosions, fire, smoke, scattered particles, characters, lettering, ground, backdrop, checkerboard or rectangular black backing. Keep the hand-painted HD pixel material sharpness and all undamaged parts registered to image 1. This is the exact destruction state of this same wide boss, NOT a redesign. Output two identical defeated states in the same stacked-row atlas.
~~~
