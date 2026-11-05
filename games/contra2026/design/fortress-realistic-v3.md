# 混凝土要塞

使用用户最终选定的混凝土风格，三张素材均由内置 imagegen 生成。立面包含混凝土承重柱、外露钢筋断面、深灰炮座、液压后坐机构、夹持管线、散热鳍片与收束的暖色反应堆。上下炮台分别有匹配残骸，核心毁坏后使用相同材质的破损通道。

正式文件：

- [完整立面](../assets/stage1/fortress-realistic-v3.webp)，1232×1277，494,334 字节。
- [炮台及核心残骸](../assets/stage1/fortress-wreck-realistic-v3.webp)，1536×1024，273,164 字节。
- [破损通道](../assets/stage1/fortress-breach-realistic-v4.webp)，640×1008，264,192 字节。

三张合计 1,031,690 字节，只随第一关加载；其他关卡不请求。生成原图保存在 `source-art/stage1/`，同名 PNG 为打包留档。完整提示词在 [生成记录](fortress-realistic-v3-prompts.json)，尺寸、透明校验、裁切和哈希在 [资源清单](fortress-realistic-v3.json)。`../tools/prepare-fortress-realistic.py` 只负责裁切、缩放和 WebP 压缩，保留 alpha，不重新绘制任何图形；残骸在真实透明间隔处分列，避免串入相邻部件。

立面绘制范围、炮口与核心目标、墙体、生命值、射击规则和进入第二关的触发区保持原值。移除了原先盖在核心上的平面发光椭圆，保留素材本身的层次与光照、命中反馈和爆炸。

完整立面、单炮损毁及核心开门的游戏画面分别见 `fortress-realistic-v3-intact-game.png`、`fortress-realistic-v3-wreck-game.png` 和 `fortress-realistic-v3-breach-game.png`。654 项后台与游戏回归测试通过，包含资源哈希/缓存版本、真实命中、炮口摧毁、跳入洞口、双人等待与下一关加载。
