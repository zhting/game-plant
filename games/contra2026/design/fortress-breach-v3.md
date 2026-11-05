# 第一关破损入口 v3

用内置 imagegen 生成独立的破损入口，替换原先程序描边的黑色矩形。入口贴合原反应堆周围的装甲，破边保留蓝银钢板断面、卷曲金属、外露管线；内部有弱暖光、管道、台阶和向右侧深处收敛的暗通道。洞口之外保留生成的真实透明边缘。

运行时素材为 `../assets/stage1/fortress-breach-v3.webp`（640×1008，241,264 字节），同名 PNG 留档。原始生成图为 `source-art/stage1/fortress-breach-v3.png`，完整最终提示词为 `fortress-breach-v3-prompt.txt`，尺寸、裁切、哈希和透明校验见 `fortress-breach-v3.json`。打包脚本 `../tools/prepare-fortress-breach.py` 仅裁切、缩放和压缩，WebP alpha 与打包 PNG 逐字节一致。

入口美术范围比原核心残骸略大，人物显示裁切沿破边内轮廓绘制，使角色向右移动时逐渐被洞壁挡住。通关触发区、命中区域、墙体碰撞和进入第二关的规则保持原坐标。仅第一关加载，悟空皮肤过滤此资源。

356 项魂斗罗及共用引擎测试通过。浏览器核对完整破洞、人物进入遮挡，并通过真实更新推进到第二关；所有资源加载成功。截图在项目 `.playwright-mcp/breach-fish-v2/`，完整测试日志为 `.playwright-mcp/breach-fish-tests.log`。
