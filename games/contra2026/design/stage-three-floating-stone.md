# 第三关：按原视频细化移动石台

参考原视频留存画面 07:04、07:08、07:24；重点观察横移石台宽平的浅色顶部、略向外挑的石沿，以及向下收拢的分层岩块。以这些轮廓重绘高清素材，补充湿石颗粒、裂隙、侧面受光与蓝灰色底部反光。

## 资源与接入

- 工具：内置 imagegen。
- 游戏素材：assets/stage3/floating-stone.webp，1619×971，277,926 字节，WebP quality 94；透明通道与生成原图逐像素相同。
- 生成原图：C:/Users/zhting/.codex/generated_images/01a14d5a-42ff-7e33-bf4b-817e85c1bd0b/exec-88776f0f-ec68-44eb-9ed6-25dbd22c091d.png。
- 实际主体采样：[78,228,1463,666]。画面高度 24 逻辑像素，台面露出到行走面后方 3.6 像素；显示宽度在原平台两端各延伸 1 像素。
- 造型保持水平，并随实际平台位置移动；角色支撑引用沿用原有机制。后续路线调整见下文。
- 点击开始时加载该资源，当前普通试玩入口共 47 项资源。

重建压缩资源：

~~~powershell
python games/contra2026/tools/prepare-stage-three.py --floating-stone <generated.png>
~~~

## 验证

浏览器逐一核对三处移动石台和角色落脚位置。实际推进 45 帧后，角色仍在同一支撑物上，保持局部横向偏移与脚底高度；普通本地入口加载了新素材，第三关音乐正常播放且没有 QA 接口。本地现有 Contra 回归测试全部通过。

视频参考、实机截图和检查记录：本机 .playwright-mcp/stage3-floating-stone/。

## 必经上行路线

三处浮石改为固定岩台之间的必要中继。删去旁边可绕行的六块固定岩台，每处固定起点与终点相隔 144 逻辑像素；浮石位于中间，上下各约 72 像素。普通二段跳无法直接跨过整个断层，必须先落到横移浮石上恢复跳跃次数，再起跳去上一层。没有添加隐形阻挡或强制打卡状态。

| 浮石 | 下层行走面 | 浮石中心高度 | 上层行走面 | 水平移动区间（左沿） |
| --- | --- | --- | --- | --- |
| 第一处 | -492 | -564 | -636 | 188–268 |
| 第二处 | -828 | -900 | -972 | 50–134 |
| 第三处 | -1068 | -1140 | -1212 | 196–280 |

浮石保留不同的速度、相位和约 2.4 像素的上下浮动，宽度调整至 40–42 像素。被删岩台上的敌兵、炮台和头盔补给窗移到新的固定落脚点，避免设施悬空。特殊装备继续使用自身原有规则。

验证覆盖四种起始时间的真实整关攀登，均实际踩过三块浮石且没有坠落；逐一移除浮石后，穷举第 2–48 帧的二段跳时机均无法直接登上断层上层。截图和本轮测试记录保存于本机 .playwright-mcp/stage3-stone-route/。本次仍仅在本地试玩分支更新。

## 完整绘制提示词

~~~text
Use case: precise-object-edit.
Asset type: one production-ready transparent MOVING STONE PLATFORM sprite for the waterfall stage of our HD pixel Contra game.
Input image 1 is the PRIMARY SHAPE REFERENCE, a magnified actual frame from the user's original gameplay video at 07:08. Input image 2 is the CURRENT SPRITE TO REPLACE: it looks like a flat oval covered in evenly sized white pebbles. Image 3 provides the existing game's HD pixel-painted material style and lighting. Match the primary reference's silhouette much more faithfully, with refined stone materials.

Draw exactly ONE full floating rock platform, centered on a genuinely transparent 1024x768 canvas, contained within x64..960 and y120..650. The sprite's complete width-to-height ratio should be about 1.7:1, matching the video. No alternate views or atlas panels.

The reference is a SMALL CAPPED ROCK ISLAND, not an oval boulder. It has:
- A wide, horizontally stable pale gray upper stone shelf with a shallow visible top plane. The top is broad and nearly flat for the character to stand on, with a shallow uneven darker gray center and a pale worn mineral rim. The front lip slightly overhangs the underside. Its plan shape is a restrained rough oval, seen from the side with only a small amount of the top surface visible.
- A THICK, weathered beveled front rim just below that walkable top. Show tiny chips, thin irregular strata and short natural cracks along the pale edge. Highlights are broken and stone-like, not smooth metallic chrome.
- An underside made of three or four large interlocked knuckled ROCK MASSES that narrow toward the lower center, following the video's compact tapering silhouette. A broad central lower stone lobe and shorter rounded side lobes give depth and weight. Keep the lower tip rounded and substantial, not a sharp spike, crystal, pointed triangle, stalactite or inverted pyramid. This underside should occupy around 60% of the total height.
- Clear separation of the top-facing surface, projecting cap lip, side facets and recessed underside. Upper-left light, cool gray-brown middle tones, dark blue-charcoal crevices and underside, restrained cyan reflected waterfall light at the lowest edges. A little rough mineral grain, damp streaking and a few hairline fractures make it more refined than the low-resolution source, but preserve readable broad shapes at small gameplay size.

Art style: crisp richly textured hand-painted HD PIXEL arcade sprite matching our finished grass ledges, boulders and waterfall. Rounded yet fractured rock volumes, carefully stepped small pixel highlights, controlled dark outline. Natural gray stone, off-white mineral top edge, slate-gray sidewalls and deep shaded belly. The original video is only a silhouette and value reference; do not copy its blur, compression artifacts or blurry enlarged pixels.
Do NOT cover the top with cobblestones or evenly sized pebble mosaic. No soccer-ball mesh, basket weave, shiny metal, checkerboard pattern, gold rock, grass, vegetation, floating gems or decorative architecture. No huge perspective angle or full isometric top view; it must fit a side-scrolling platform game. No detached rocks, particles, mist, droplets or shadow outside the platform.
Remove all scenery, waterfall, player, text, borders, interface and labels. Only this ONE complete isolated platform, with true alpha transparency around the whole silhouette. Do not bake in a dark rectangular backing or fake transparency checkerboard.
~~~
