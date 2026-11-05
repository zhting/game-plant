# 六关敌兵素材

六张透明 WebP 分别保存在 `../assets/stage1/enemy-jungle-upper.webp`、`../assets/stage2/enemy-base-upper.webp`、`../assets/stage3/enemy-waterfall-upper.webp`、`../assets/stage4/enemy-fortress-upper.webp`、`../assets/stage5/enemy-snow-upper.webp` 和 `../assets/stage6/enemy-foundry-upper.webp`。使用内置 imagegen，并以原 `soldier-hd.webp` 图集作为画风参考；腿部继续使用游戏原有动作骨架。

共同提示词：

> Use case: stylized-concept. Asset type: upper-body overlay for a 2D side-scrolling action game enemy. The input image is only a reference for art style, lighting, scale and military proportions, NOT a request for a sprite sheet. Draw ONE single [角色描述]. Show only the character from helmet down to waist, both arms and the complete gun, cropped cleanly at the waist. Realistic detailed painted game sprite with worn fabric and metallic weapon, dark outline and warm dramatic light, matching the supplied game art. Centered single character with margins, no legs, no floor, no background, no text, no frame, no multiple views or poses. True transparent background.

分别使用的角色描述：

1. side view facing RIGHT, an olive-green jungle assault soldier with bandana under a soft boonie hat, lightweight webbing, carrying a compact assault rifle
2. front view facing the viewer, a dark navy base security soldier wearing a hard helmet, visor and light chest armor, holding a compact submachine gun across the chest
3. side view facing RIGHT, a tan and dark-green waterfall reconnaissance soldier with goggles, hood and climbing gear, carrying a long scoped rifle
4. front view facing the viewer, a dark charcoal and crimson armored fortress soldier with gas mask and angular helmet, carrying a heavy drum-magazine automatic rifle across the chest
5. side view facing RIGHT, a white and gray winter soldier in insulated hood, goggles, padded jacket and ammunition pouches, carrying a long-barrel battle rifle
6. side view facing RIGHT, a charcoal and rust-orange industrial combat soldier with protective visor, shoulder armor and heatproof work gear, carrying a bulky machine gun

第二、四关横向跑动补充了两张侧身上半身素材：`../assets/stage2/enemy-base-side.webp` 和 `../assets/stage4/enemy-fortress-side.webp`。分别以对应正面制服作为身份参考，使用内置 imagegen，提示词为：

> Use case: identity-preserve. Asset type: transparent upper-body side-view animation sprite for the same game soldier. Preserve the exact helmet, face/visor or gas mask, armor colors, uniform, equipment and gun from the reference. Change only the viewpoint and pose: profile facing RIGHT, holding the same gun horizontally toward the right while running. Show one complete upper body from helmet to waist, both arms and full weapon, cut cleanly at waist. Same high-detail painted action-game sprite style. Single character centered, all parts visible with margins, no legs, no background, no ground, no text, no labels, no multiple poses. Real transparent background.
