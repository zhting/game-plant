# 腿部绘制与连接修正

重新生成了蓝色、红色和敌兵三套大腿、小腿、完整靴子的透明部件。素材位于 `assets/stage1/runner-limbs-v2.png`，使用内置 image_gen，完整提示词和参考图记录在 [runner-limbs-v2-generation.json](runner-limbs-v2-generation.json)。旧素材保留。

原先弯曲的大腿原图被当作直骨骼旋转，小腿贴图又包含整只靴子，脚踝标定落在脚跟附近。动画还把大腿宽度压为 78%、小腿压为 85%，加重了错位和细腿的观感。

现在为中性直立部件单独标定髋、膝、踝，完整靴子绕踝关节转动。两个髋关节分开，与原身体的裤腰和骨盆衔接；动画只旋转部件，不再随动作压窄裤腿。靴子大小与站立造型接近。水中使用独立的交替迈腿周期，并在水面绘制随步伐变化的水纹。

## 预览

- [蓝色角色慢动作循环](run-legs-blue-v2.gif)
- [三角色慢动作和正常速度视频](run-legs-v2.mp4)
- [蓝色角色站立与六个跑步姿势](run-legs-v2-detail.png)
- [三角色十二相位](run-legs-v2.png)
- [修正前的实际渲染](run-legs-before-v2.png)
- [陆地场景](run-legs-land-v2.png) / [涉水场景](run-legs-water-v2.png)

## 验证

92 项魂斗罗回归测试通过。浏览器使用实际游戏绘制器检查三种角色、左右朝向、陆地和涉水的 48 个连续相位，共 3456 个关节中心采样，无透明断点；另检查四种瞄准方向。记录见 [run-legs-v2-validation.json](run-legs-v2-validation.json)。预览 GIF 及 H.264 视频经过浏览器解码和定位播放检查。

游戏入口：http://localhost:3190/games/contra2026/?art=leg-alignment-2
