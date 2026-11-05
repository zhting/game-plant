# 第三关 · 峡谷瀑布

参考：用户提供的 `H:/download/videoplayback.mp4`，重点观察 06:36–08:00。

视觉方向：以蓝色湍流贯穿整段攀登，暖色覆苔岩台承载角色，山顶转为灰岩与黑色天空，用橄榄金异形和银色闸门形成关底主视觉。角色、设施、道具沿用前两关的高清素材。

内容顺序：第三关入场 → 瀑布岩台与落石 → 两段喷火桥 → 横移浮石 → 山顶灰岩 → 两条链臂及口部弱点 → 门卫与闸门破坏 → 走入洞口结算。第二关升降梯结束后衔接第三关，第四关及以后保持关闭。

运动方向：水流持续向下，与向上推进的镜头形成对向运动；浮石在各自的不同相位移动并带动角色；喷火器先预警再喷发；门卫张嘴时开放弱点，火球沿卷曲轨迹下落。双人镜头照顾后方角色，洞口等待两人进入。

## 视频核对

- 06:36–06:48：宽幅瀑布、错列岩台、岩壁设施和滚落的灰白石块。
- 06:52–07:00：连续的银灰桥面，桥上两处火柱，桥下有喷口；侧边岩台接到桥面。
- 07:04–07:24：水平移动的浅色浮石、墙面补给箱、不同高度的敌兵。
- 07:24–07:32：瀑布逐渐退出画面，岩石转灰，顶部有黑色背景。
- 07:36–07:52：金色骨架、宽冠与长角，口部开合；银白闸门，两侧和口部发出红色火球。
- 07:56–08:00：头部消失，闸门出现可进入的破口。

地图按本作 384×216 逻辑坐标重新布置，沿用二段跳及特殊装备，并非逐像素复刻原地图。关卡机制与美术分别位于 `js/stage-three-layout.mjs`、`js/stage-three-art.mjs`。

## 配乐

原视频 06:38.000 起提取 31.94875 秒（乐句周期由频谱重复及波形相关确定），48 kHz 双声道 Opus、96 kbps、-18 LUFS，循环边缘 4 ms 淡入淡出，文件 448,952 字节。录制中的音效会保留，这不是独立音乐分轨。

07:36、07:40、07:44、07:48 的音乐特征与攀登段匹配度约 0.92–0.96，明显高于第二关中枢主题的匹配度。因此山顶战延续瀑布主题，不另切第二关 Boss 曲。暂停保留位置，门卫摧毁后停止。

点击第三关入口才加载画面和这一首默认音乐，其他音乐在游戏进入后串行缓存。未向第三关提供第一关的摇滚、交响等改编曲。

可重建压缩资源：

```powershell
python games/contra2026/tools/prepare-stage-three.py --video H:/download/videoplayback.mp4 --guardian <original-atlas.png> --wreck <defeated-atlas.png>
```

## 新绘素材

两张图均由内置 imagegen 生成，并保存为保留透明通道的无损 WebP；原始生成文件保留在用户 Codex 的 generated_images 目录。

- `assets/stage3/waterfall-guardian.webp`：1536×1024，两格闭嘴／张嘴姿态，1,594,414 字节。
- `assets/stage3/waterfall-guardian-wreck.webp`：同一配准的破坏姿态，两格均为破坏后的门卫，1,286,110 字节。

首张提示词：

> Transparent two-cell sprite atlas, 1536×1024, exactly one row. The same front-view olive-gold alien guardian above a silver industrial arched sealed door, perfectly registered in both cells; left jaw closed, right jaw open with a black cavity. Use the supplied original waterfall-boss frame for shape and colors, and the existing fortress HD sprite for crisp outlined pixel-painted material. Flattened manta-like crown, magenta eyes, yellowed fangs, symmetrical ribbed spines and curving horns, silver ribbed pillars and pistons. Gold upper 56%, silver lower 54%, grounded at y970 in both cells. Full transparent background, no scenery, characters, bullets, text or frame borders.

破坏姿态提示词：

> Edit both cells of the generated atlas while preserving exact registration, scale, palette and style. Use the supplied original defeated-boss frame as reference. Remove the head, face, eyes, fangs and center crown completely, leaving natural irregular shattered gold neck stumps; retain outer horns and spined ribs. Breach the silver door into a tall black passage with a jagged arched silver rim, removing the center plate and pistons but preserving side pillars. No rectangular cutout, no ground or scenery, no characters, smoke, explosions, text or bullets; genuinely transparent surrounding background.

## 验证

后续已更新分层瀑布、大落石与按原视频细化的移动石台。素材、机制及完整绘制提示词见[瀑布与落石说明](stage-three-waterfall-materials.md)与[移动石台说明](stage-three-floating-stone.md)。

关底进一步重绘原生宽幅 Boss，改为等比例显示及独立口部动画；放大链臂并更新接触范围，石墙采用完整岩块自然收口，夜空加入错相闪烁星点。素材、完整提示词与配准方式见[关底高清调整](stage-three-boss-detail.md)。

自动化覆盖真实二段跳完成整段攀登、只向上滚动的镜头、喷火预警与双人伤害、浮石载人及快照支撑引用、单枚水平敌弹、两侧火球器与张嘴弱点、上举枪实际命中、破坏后进入洞口和双人等待。浏览器核对第三关入口、开局预加载、原声播放和各段场景，参考截图保存在本机 `.playwright-mcp/stage3-reference/`。

## 本地调整：岩台、道具窗口与链臂

保持第三关仅供本地试玩，未向线上开放。

- 岩台增加斜切端面、独立受光面、凹进去的暗色底面与参差石块轮廓；阴影落到下方水面。行走面的坐标保持与原有平台一致，侧面和底面用于表现厚度。
- 第三关的感应窗口单独绘制为嵌入岩壁的机械舱：四角铆钉、倒角金属框、内凹轨道、滑动百叶门、侧边散热缝、指示灯及内部红色补给。开门后显示该舱的道具字母，沿用开门时可击破的规则。
- 核对 07:34–07:49 连续帧：Boss 使用多节银灰链臂和红色爪心，两侧以不同相位弯曲挥动。移除原来摆在颈部两侧的固定红色圆点，弱点、发射点和接触范围跟随链臂姿态；摧毁一条链臂会连带炸掉关节，另一条仍继续挥动。闪光冻结同时停止其动作。

新素材 `assets/stage3/guardian-arm-kit.webp`（2172×724，1,080,560 字节）来自内置 imagegen，转为保留透明通道的无损 WebP。三格分别是银灰关节、红色爪心和金色肩座；渲染与碰撞共享 `js/stage-three-arms.mjs` 的姿态数据，不在绘制时改写游戏状态。

绘制提示词：

> Use case: stylized-concept. Asset type: modular sprite atlas for the articulated chain arms of the existing waterfall boss in a 2D HD Contra game. Image 1 shows the ORIGINAL GAME ARMS: multiple small silver/gray circular armored knuckles in a curved chain, terminating in a red star/claw. Image 2 is our EXISTING BOSS for the painted pixel sprite style and olive gold colors. Generate ONLY a 1536x512 transparent atlas with THREE separate centered sprites in three equal 512x512 cells, each bounded within x36..476 and y36..476 of its own cell. Cell 1 (LEFT): a single silver gray armored circular chain-link knuckle, a dense ring of 8 beveled gray metal lobes surrounding a dark round central pin, black crevices, pale silver edge highlights. It must read as the spiked mechanical ball-joint from image1, NOT a gear icon, with shaded volume, round silhouette and no connector stems. Cell 2 (MIDDLE): the end hand/claw of this arm, viewed FRONT ON, 5 short triangular jointed iron fingers arranged radially like a grasping star around one prominent glowing RED/ORANGE round center. A compact round armored gauntlet, silver outer knuckles, gunmetal recesses, 5 inward-bending claw tips, clear glowing red weak point at geometric center. It should be almost circular and fit a 1:1 square, NOT a long humanoid hand. Cell 3 (RIGHT): a round OLIVE GOLD shoulder socket for connecting this gray chain to the existing golden alien rib cage, carved gold exoskeleton ring with a dark recessed central bearing and a small silver pivot, organic skeletal surface matching image2. All three sprites share the same crisp high-definition hand-painted pixel-arcade style, thick dark outline, many sharp stepped highlights, textured gunmetal and worn gold. No antialiasing haze or glow outside the silhouette. Precisely one separate object per cell. These parts will be rotated individually by the game; do not bake in any entire arm, other links, character, gate, scenery, words, borders, floor or cast shadow. GENUINELY transparent background and transparent space between sprites; keep each centered at its cell's center (256,256).

生成结果保持了三格布局，实际分辨率为 2172×724；代码使用实际素材边界采样，不按提示词中的请求尺寸硬裁图像。可用 `prepare-stage-three.py --arm-kit <generated.png>` 重新压缩该素材。

本轮验证：160 项 Contra 自动化测试全部通过，本地双人 WebSocket 联机验证通过。浏览器分别核对岩台、关闭／开启的补给窗、不同相位的链臂和单臂摧毁画面；正常试玩入口的 43 项资源全部就绪，第三关原声正常播放，未注入测试接口。截图与检查记录位于本机 `.playwright-mcp/stage3-arm-detail/`。


## 按设计图落地：圆钝厚岩台

以用户确认的“岩台 · 厚度设计”作为编辑参考，使用内置 imagegen 绘制单张透明岩台素材，保留上表面、厚草皮、根系土层和圆钝叠石，移除设计图中的背景、文字和细节面板。替换前一版多边形剪裁岩台。

- 素材：`assets/stage3/mossy-rock-ledge.webp`，1774×887，422,546 字节，WebP quality 94；透明通道与生成原图逐像素相同，比无损版本减少约 68% 体积。
- 实际主体采样：`[34,164,1713,580]`。画面顶部 14% 对齐原有行走面，角色踩在前侧草皮边沿，可见的后侧草面位于脚后方。
- 采用横向三段绘制，保留圆钝端石的比例，连续拉伸中部石层，适配现有不同宽度的岩台和山顶地面。按实际显示密度缓存，尺寸变化时重建。
- 山顶仅对岩层渐变去色，草皮与根系保留原色；喷火桥和移动浮石保持各自的材质与机制。
- 点击开始时一并预加载新素材，共 44 项资源。原有平台碰撞坐标和跳跃路线沿用现有地图。

压缩重建：`python games/contra2026/tools/prepare-stage-three.py --ledge <generated.png>`。

生成原图：`C:/Users/zhting/.codex/generated_images/01a14d5a-42ff-7e33-bf4b-817e85c1bd0b/exec-72a22587-dde4-46e6-915c-e6eeb4b509fe.png`。

完整绘制提示词：

> Use case: precise-object-edit.
> Asset type: a single production-ready transparent terrain sprite for the existing side-scrolling Contra game.
> Input image 1 is the APPROVED DESIGN SHEET and edit target. Extract and carefully finish ONLY the large main grassy ledge from its upper panel into a standalone game sprite. Precisely preserve its art direction: thick bright tufted sod, visible shallow top surface, dark rooted earth seam, and multiple massive rounded ochre-olive rock slabs interlocked in two to three broad horizontal layers. This must closely match the approved hero ledge, not redesign it again.
>
> Output one horizontal sprite on a genuinely transparent 1536x768 canvas. The complete ledge silhouette has an approximate width:height ratio of 3.1:1 and occupies x64..1472, y118..600. Include small root tips and tuft silhouettes, with real transparent gaps around the outside. There is exactly ONE complete platform, with rounded left and right ends and a broad rounded bottom that retains about 88% of the top width.
>
> Front-facing side-scrolling elevation, with a shallow visible grass top plane receding backward. The front walking lip of the sod is level and continuous horizontally. It sits roughly 14% of the full ledge height below the uppermost back edge of the grass plane. Thick overlapping turf lobes hang down another 12%, with dense detailed leaves and fine roots. A distinct compacted warm earth layer and root fibers separate the sod from the main rock. Main rocks are large weathered pillow-shaped slabs, with rounded bevels, visible softly lit top-facing shoulders, shaded side faces, layered contacts and deep but narrow ambient-occlusion crevices. Use broad overlapping bottom stones and a short gentle undercut, NOT tapering spikes, teeth, triangular facets, or a hanging diamond. It must read as a solid heavy rounded rock mass.
>
> Match the source's crisp densely hand-painted HD pixel arcade style, fine stepped material highlights, moss greens and warm golden olive-brown stone. Consistent upper-left illumination, subtle blue reflected light on the lowest rock edges. Sharp individual pixels but rounded macro silhouettes. Not photorealistic, not smooth 3D plastic, not vector cartoon, no black polygon web.
>
> Remove EVERYTHING except that single complete terrain sprite: NO blue waterfall, background, water, sky, scenery, text, heading, diagram, lower detail studies, labels, frames, shadows outside the silhouette, characters, machinery, enemies or interface. Do not include the lower three sample panels. Do not flatten the rock depth. Do not leave any colored rectangular backing or fake transparency checkerboard. Real alpha transparency around the object.
