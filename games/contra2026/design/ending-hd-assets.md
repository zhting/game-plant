# 第八关高清片尾

片尾沿用开场的 384 × 216 逻辑画布和显示设备的实际绘制分辨率。飞机、旋翼和字幕样式复用开场资源，爆炸使用战斗中的 12 帧图集。

0–11 秒是夜海撤离与岛屿崩塌。岛屿独立于海面绘制，连锁爆炸后逐渐沉入水面。烟柱、抛射碎片、溅水和冲击波按同一时钟推进。11–20.6 秒交叉淡入晨曦海面，直升机飞远，字幕交代任务结局。20.6–44 秒在海景上滚动显示成绩和制作字幕。

三张新图使用内置 image_gen，以开场画面为画风参考。PNG 原图与游戏 WebP 保持相同原生尺寸，岛屿的透明通道逐字节一致。[开场参考图](H:/project/games/games/contra2026/design/opening-story-16s-4k.png)

| 素材 | 原生尺寸 | 文件 |
| --- | --- | --- |
| 夜海 | 1672 × 941 | [PNG](H:/project/games/games/contra2026/assets/ending/night-sea-v1.png) · [WebP](H:/project/games/games/contra2026/assets/ending/night-sea-v1.webp) |
| 黑礁岛 | 2098 × 749 | [PNG](H:/project/games/games/contra2026/assets/ending/black-reef-island-v1.png) · [WebP](H:/project/games/games/contra2026/assets/ending/black-reef-island-v1.webp) |
| 晨曦海面 | 1672 × 941 | [PNG](H:/project/games/games/contra2026/assets/ending/sunrise-sea-v1.png) · [WebP](H:/project/games/games/contra2026/assets/ending/sunrise-sea-v1.webp) |

三张 WebP 合计约 1.09 MB，随第八关预加载。渲染测试检查三幕和字幕、岛屿退场、成绩显示，以及烟雾与飞机缩放时的画布复用。魂斗罗相关用例与悟空共享引擎回归共 547 项通过。浏览器实机检查受此前自动审批服务用量上限影响，尚未执行。

预览可以直接跳到撤离、爆炸、返航与结算字幕。[片尾预览](http://127.0.0.1:3000/games/contra2026/design/ending-hd-preview.html)

## 生成提示词

### 夜海

```text
Use case: stylized-concept. Asset type: full-screen painted arcade game ending background, 16:9 landscape, ideally 1920x1080. The attached opening screenshot is a STYLE reference only: match its richly textured detailed arcade pixel illustration, cool blue atmospheric depth, crisp tiny painted texture, not photography and not flat vector silhouettes. Draw only a moonless tropical Pacific night sky and OPEN OCEAN, absolutely no island, coastline, rocks, boats, aircraft, people, explosions, UI, lettering or borders. Ocean horizon is straight at exactly 63% of canvas height. Upper sky deep navy with a few restrained pinprick stars, richly layered fine indigo and slate cloud bands at different distances, faint cool haze above the horizon. Dark teal-blue ocean below, finely detailed varied rolling wavelets, subdued silver-blue edges on wave crests, deeper troughs with visible painterly texture; distant sea calmer and less contrast, near bottom waves broader and more dimensional. Middle-left remains quiet so a separate detailed island and explosion can be composited above the water later; upper-right clear for a rescue helicopter. Night values should still reveal cloud and wave detail at small game scale; not a black rectangle or uniform gradient. Cohesive upper-left cool light, cinematic yet restrained, no moon, no huge bright stars, no sunset or fire glow baked into the artwork. One seamless complete wide scene, no sprite sheet.
```

### 黑礁岛

```text
Use case: stylized-concept. Asset type: one transparent game ending island sprite, wide landscape canvas, ideally 1600x800. The attached opening screenshot is a STYLE reference only. Match its richly detailed hand-painted arcade pixel illustration, sharply textured rock, layered foliage, restrained blue-green nocturnal lighting. Draw ONE complete tropical military island seen from offshore in a slightly elevated side three-quarter view, centered as a long low landmass, about 2.8 times wider than its height. Jagged black volcanic cliffs with visible rock strata and fissures rather than a solid silhouette; a narrow sandy stony shoreline at the base, dense dark green rainforest with individually readable palms, two irregular small hills. Conceal a modest concrete military bunker, antenna mast, roof vents and a tiny helipad between trees near the center-right, a few tiny amber utility lights. No writing or insignia. Cool moonless navy-teal night light but enough tonal detail to read every landform; subtle warm glints around two or three small damaged bunker cracks only. Nothing actively burning or exploding. Keep forest and buildings lower than the tallest central hill/palms. Complete isolated island with natural irregular shoreline and tiny surf fringes hugging its base; all scenery ends at shoreline, no broad water rectangle, no sky, no horizon, no mist panel or painted backdrop. TRUE ALPHA=0 all around and between palm fronds. Generous transparent margin around the whole island. No floating underside cross-section, no helicopter, person, ocean scene, sun, moon, UI, lettering, borders, grid or checkerboard. This separate rigid island will sink behind animated water while smoke/explosions are added by the game; do not bake any explosion, fireball, smoke column or motion blur into it.
```

### 晨曦海面

```text
Use case: stylized-concept. Asset type: full-screen painted arcade game ending sunrise background, 16:9 wide landscape, ideally 1920x1080. The attached opening screenshot is a STYLE reference only: richly detailed painterly arcade pixel illustration with cool blue atmospheric depth, high-quality tiny rock/cloud/foliage-like texture treatment; do not copy its scene, lettering or helicopter. Draw only an open tropical Pacific OCEAN at first sunrise, no shore or islands, no aircraft, people, boats, buildings, explosions, smoke plumes, text, UI or borders. Straight ocean horizon at exactly 63% of canvas height. Sun low just touching the horizon at 70% of canvas width, pale warm gold disk partly veiled by layered thin cloud. Deep slate and indigo upper sky becoming dusty violet, salmon, then amber along the horizon. Strongly dimensional elongated cloud banks with soft peach-lit undersides and fine textured edges, airy and spacious. Detailed rolling teal and indigo ocean wavelets in foreground, warm narrow broken path of sun reflections running from the distant sun toward lower center-right, finely painted wave crests and dark textured troughs, small-scale waves in distance. Left half of upper sky is quiet, leaving space for a detailed rescue helicopter that the game will composite and animate separately. Optimistic aftermath, restrained amber light rather than oversaturated orange wash. Full coherent scene, no collage or sprite sheet, no giant lens flare or cinematic black bars.
```

