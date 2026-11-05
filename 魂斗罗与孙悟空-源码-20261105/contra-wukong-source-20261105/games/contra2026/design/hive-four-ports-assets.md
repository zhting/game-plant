# 第八关最终大脑：上下四个吐怪机关

按用户提供的原作截图，将最终大脑原有两个外围器官改为上方两个、下方两个独立孵化嘴。顶排与新增的洞顶组织衔接，底排向上开口并接入地面。机关复用本关四帧寄生口器，依次经历闭合、预警张口、吐怪和收口；下方机关翻转朝向。每个机关被击破后留下暗化组织和伤口，停止产生幼体。

四个机关各 12 HP，总计 48 HP；全部击破后护骨张开，80 HP 的大脑核心暴露。核心仍保留在 `parts[2]`，配合现有联机快照和最终通关动画。装饰巢壁允许子弹通过，闭合核心与最右侧洞壁仍挡弹，后排两个机关可用实际步枪打到。顶部后排可通过跳起斜射避开护骨，前排可通过跳射打到。

各机关错开 0.9 秒启动，张嘴预警 0.55 秒后吐出粉色有角幼体。顶排向下吐出，底排向上吐出；幼体缓慢向左飞行并有限追踪玩家，可以被击落。场上最多 6 个，超时离场。暂停、冰冻和联机同步保留口器与幼体状态；大脑死亡后清理幼体并进入原有结尾动画。

## 新增素材

生成模式：内置 `image_gen`，参考用户截图中的粉色浮游小怪，生成四帧透明图集。1254 × 1254 原生尺寸，2 × 2 排列，每格 627 × 627；游戏按固定比例绘制，四帧分别改变口部和卷曲触须。仅将 PNG 转为同尺寸 WebP，未缩放、抠图或修改透明通道。

- [PNG 原图](H:/project/games/games/contra2026/assets/stage7/alien-hive-hatchling-v1.png)
- [游戏 WebP](H:/project/games/games/contra2026/assets/stage7/alien-hive-hatchling-v1.webp)
- [机关与幼体逻辑](H:/project/games/games/contra2026/js/hive-brood.mjs)
- [Boss 预览页](H:/project/games/games/contra2026/design/stage8-boss-brain-preview.html)

## 验证

- `node --test backend/test/contra-*.test.mjs backend/test/wukong-engine.test.mjs`：546 项通过，0 失败，见 [测试记录](H:/project/games/games/contra2026/design/hive-four-ports-tests.tap)。
- 使用真实引擎输入与步枪子弹，击破底排、跳起斜射后排顶部、跳射前排顶部，四个机关全部可达；只有全部击破才开启核心。包含本机与队友幼体碰撞、暂停、冰冻、快照、击破停产、重玩复位，以及击败大脑后完整 44 秒结尾至统计页的回归。
- PNG/WebP 均为 1254 × 1254，透明通道逐字节一致，Alpha 范围 0–255，外侧透明。WebP 213056 字节。
- 生产 ESM 依赖图 99 个模块链接成功；Boss 预览页模块语法通过。
- 浏览器实机检查未执行：自动审批服务因账户用量限制未能完成审批，未通过其他浏览器工具绕过该限制。以上射击和通关检查基于本地真实游戏引擎测试，不能代替浏览器画面实测。

## 完整生成提示词

Use case: stylized-concept. Asset type: FOUR-frame transparent animation sheet of the small PINK floating horned hatchling emitted by the FOUR vents surrounding the final brain boss in the supplied original-game screenshot. Only the small floating creature, not the brain, the four vents, player or wall. A rounded magenta/pink fleshy shell/head, TWO short upward hooked ivory horns, tiny dark side eyes, a small dark toothed mouth on its underside/front, and two short curled fleshy tendrils tucked under its belly. Glossy layered membrane plates and fine maroon creases, richly painted arcade pixel-game shading matching a dark violet alien hive. The compact silhouette is broader than tall and reads clearly at about 16 pixels wide. Not a white jellyfish or gold curled worm, no humanoid body, legs, clothing, wings or machinery. Exactly FOUR equal square cells, TWO columns by TWO rows on a transparent square atlas, preferably 1024x1024. Same body center anchor at 50%,50%, same apparent scale, left-facing mild three-quarter view and upper-left lighting. Poses: 1 mouth closed, lower tendrils tucked; 2 small mouth opens and underside tendrils unfurl; 3 mouth opens wider, shell folds contract slightly and tendrils sweep back; 4 lips close and tendrils curl inward toward pose1. True local mouth and appendage changes, no overall stretch or translated/rotated copies. All creatures fully visible with ample transparent gaps. Genuine ALPHA=0 outside each creature and between its horns and tendrils; keep all real creature material and dark mouth opaque. No backdrop, black/white field, checkerboard, bloom halo, shadow, cell borders, labels, text or UI.
