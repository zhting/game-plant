# 第八关洞穴守卫：吐出飞行幼虫

按用户提供的原作截图制作金黄色、C 形蜷曲的飞行幼虫。素材使用内置 image_gen，以原作截图为造型参考，生成 2 列 × 2 行四姿态透明图集。保留 1254 × 1254 原生 RGBA PNG，WebP 只压缩格式并保留相同 alpha。

- [原生 PNG](H:/project/games/games/contra2026/assets/stage7/alien-guardian-flyer-v1.png)
- [运行时 WebP](H:/project/games/games/contra2026/assets/stage7/alien-guardian-flyer-v1.webp)
- [行为与绘制模块](H:/project/games/games/contra2026/js/guardian-flyer.mjs)
- [守卫交互预览](H:/project/games/games/contra2026/design/stage8-boss-brain-preview.html)：点击“查看中途守卫”，可观察吐怪和暂停。

## 接入行为

守卫原有的三发普通子弹攻击改为吐怪：每轮两只，相隔约 0.22 秒，下一轮冷却 2.8 秒。在场最多六只。每只从实际嘴部坐标生成，先向左上方飞出，确保越过半墙；随后短暂、缓慢地朝玩家方向转向，带独立上下摆动。一次飞越后继续飞离，不会持续盘旋追踪。虫体用四个真实分节屈伸姿态播放，不用整图伸缩代替动作。

飞虫是独立敌人，2 点生命、可被玩家武器击落，接触会伤害本机和队友；护盾、巨大化、声波和闪光等现有道具继续按敌人规则处理。暂停和冻结保留吐怪计时、飞行位置、姿态与飞行阶段。状态通过原有联机快照同步，击败中途守卫时清除剩余飞虫，半墙照常撤除并开放路线。重玩不会继承飞虫。此素材只加入第八关的资源预加载。

## 验证

526 项魂斗罗与共享引擎悟空回归测试全部通过：[测试记录](H:/project/games/games/contra2026/design/guardian-flyer-tests.tap)。覆盖真实引擎吐怪、可击落和得分、双人接触、冻结与暂停、守卫死亡清理、联机快照、生成上限、动作图集比例和资源隔离。已检视生成原图并检查原生尺寸与 alpha。

浏览器实机画面尚未复核：此前自动审批因账户额度限制未能通过，本轮没有绕过该限制。独立预览用于后续实机检查，不作为通关录像。

## 完整内置生成提示词

Use case: stylized-concept. Asset type: FOUR-frame transparent enemy sprite atlas for a detailed side-scrolling alien arcade game. Reference image is the supplied original-game screenshot: recreate the GOLDEN curled flying larvae emitted by the horned monster, not the large head or wall. One small wingless C-shaped segmented alien grub per cell, facing LEFT, thick amber-orange fleshy underside, golden yellow chitin segments on curved back, black narrow intersegment grooves, small ivory rib ridges/spines, a dark gaping toothed maw and a hooked curled tail. No legs like a human, no mechanical parts, no wings. Rich hand-painted arcade pixel-game shading, matching glossy crimson and violet alien cavern art, recognizable when drawn 20 pixels wide. Exactly FOUR different anatomically reposed frames on TWO equal columns and TWO equal rows, ideally 1024x1024 square sheet, equal square cells, each entire creature fits in the central 70 percent with large transparent margins. Frame1 tightly curled C-shape; frame2 front body/maw pushes forward and tail loosens; frame3 spine flexes and tail uncurls wider; frame4 tail draws inward and body recoils toward frame1. Real individual segment and tail flexion, same torso center anchor at cell 50%,50%, identical apparent scale, camera and upper-left lighting. No translation between cells, no overall stretch, no four identical rotated copies. No environment, shadows, labels, text, borders, checkerboard or background color. Genuine alpha transparency in the open C cavity, between spines, around all four sprites.

