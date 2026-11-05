# 第八关洞穴守卫：半墙与右上方头颈

按用户提供的原作截图调整布局：地面是半高障碍墙，上方保留洞壁与空间，怪物头颈从屏幕右上方探出。移除此前从地面连接顶部的整根组织柱。

半墙素材使用内置 image_gen 生成，保留原生 1254 × 1254 RGBA PNG，WebP 只压缩格式并保留相同 alpha。怪物头颈复用现有高清守卫素材，保持原图比例并增大显示范围，不额外生成怪物替身。

- [半墙原生 PNG](H:/project/games/games/contra2026/assets/stage7/alien-guardian-halfwall-v1.png)
- [运行时 WebP](H:/project/games/games/contra2026/assets/stage7/alien-guardian-halfwall-v1.webp)
- [真实绘制模块交互预览](H:/project/games/games/contra2026/design/stage8-boss-brain-preview.html)，点击“查看中途守卫”。

半墙世界坐标为 x=1018、y=104、宽80、高72，底部 y=176，全部落在 x=700..1100 的实地上。补给箱移到墙左侧 x=982，避免被墙埋住。头颈绘制范围从 x=1046、y=-22 开始，宽196，按原生宽高比绘制；战斗时镜头最多推进到 x=856，使后颈延伸出屏幕右上缘。上方不再存在原整面柱子的矩形挡路范围。

地面墙体使用独立 solid 支持移动碰撞、站立和挡弹；只有暴露的头部作为敌人的受击范围，脖颈另有空中阻挡和接触范围。可以从左侧现有高台射击头部。击败守卫后，半墙标记为 gone，头颈消失，守卫子弹清除，镜头恢复前进。暂停、冻结、双人、摩托和直升机均使用相同分区几何；冻结不会解除障碍。墙体通过原有联机快照保留与 platforms 的共享引用，重玩重新创建。

## 验证

521 项魂斗罗及共享引擎悟空回归测试通过：[测试记录](H:/project/games/games/contra2026/design/guardian-halfwall-tests.tap)。覆盖实际平射被墙挡住、从高台用步枪击败头部、墙体撤除后双跳越过后方缺口、不同移动方式的阻挡、镜头锁定、联机共享引用与重玩恢复。生成素材已检视；浏览器实机画面仍未复核，沿用此前账户额度限制导致自动审批未通过的限制，没有绕过该审批。

## 完整内置生成提示词

Use case: stylized-concept. Asset type: ONE transparent side-view half-height barrier wall for a detailed side-scrolling alien arcade game. A compact nearly square wall formed of THREE columns and FOUR staggered courses of large irregular charcoal-gray and ivory chitin/bone armor chunks, cracked hard surfaces with deep dark joints, wrapped together with a few burgundy sinewy roots and brown fleshy mortar. Ground-contact base is flat and sturdy. Upper rim uneven with broken thick bone plates and a narrow strip of red living tissue; no spikes taller than the wall. Detailed painted pixel-game material, strong upper-left shading and readable sculpted blocks, matching a glossy dark-purple alien cavern with red veined intestine floors. Strict SIDE VIEW, no perspective top plane, no castle battlements, no room, no environment, no monster head or other character, no text, no shadows, no pedestal. The wall fills central 80 percent of a square image, centered, all edges visible. Real alpha transparency around its outline. It is a waist-to-chest-high obstacle, NOT a floor-to-ceiling column.

