# 炸药包美术

使用内置 imagegen 生成，参考现有补给箱与炮塔的手绘材质、磨损钢件、暖色高光和暗部层次。新造型为橄榄卡其色帆布包、深色绑带、金属扣和紧凑起爆器。

- 运行素材：[透明 WebP](../assets/shared/demolition-charge-v2.webp)，512×256，46,656 字节。
- 完整生成原图：[source-art/shared/demolition-charge-v2.png](source-art/shared/demolition-charge-v2.png)。
- 完整提示词：[demolition-charge-v2-prompt.txt](demolition-charge-v2-prompt.txt)。
- 裁切、透明度和校验记录：[demolition-charge-v2.json](demolition-charge-v2.json)。
- 实机预览：[demolition-charge-v2-game.png](demolition-charge-v2-game.png)。

`tools/prepare-demolition-charge.py` 只做透明边界裁切、缩放和 WebP 压缩，不重绘生成内容。保留同尺寸 PNG，压缩后逐像素校验 alpha。

`js/demolition-charge-art.mjs` 按实际落地点绘制 16 个逻辑像素宽的包体；引线末端单独绘制小范围暖色火星，最后 0.6 秒加快闪烁。落地阴影只在静止时出现。绘制不修改倒计时、位置或联机状态，引爆仍为 1.6 秒，爆炸范围与伤害不变。

资源仅在魂斗罗第一关加载，其他关卡和大闹天宫不增加这张贴图的下载。

验证：后台全量 654 项测试通过；浏览器首关 23/23 项资源准备完成，新 WebP 返回 200。使用真实模拟的落地与临爆快照绘制，两种引线状态像素不同，绘制前后倒计时和落点不变，并保留画布原有透明度。原倒计时结束后炸药包正常移除并产生爆炸。
