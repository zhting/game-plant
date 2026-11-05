# 第八关融合组织地面与厚实平台

针对表面血管与下方器官脱节、悬空平台单薄的问题，重新生成并接入完整的活体组织断面。内置 image_gen 使用原有 alien-terrain-v1.webp 作为正向材质参考：红色血管边、棕色肠状组织及外侧筋膜连成一个致密结构，内部器官保持局部挤压、鼓胀和释放的动作。

- [原生 PNG 图集](H:/project/games/games/contra2026/assets/stage7/alien-tissue-slab-motion-v3.png)
- [运行时 WebP](H:/project/games/games/contra2026/assets/stage7/alien-tissue-slab-motion-v3.webp)
- [绘制模块](H:/project/games/games/contra2026/js/stage-eight-atmosphere.mjs)
- [实际绘制模块交互预览](H:/project/games/games/contra2026/design/stage8-organic-motion-preview.html)

图集保留 1254 × 1254 原生 RGBA 和透明通道，包含两列、四行共八个融合断面姿态；WebP 只做格式压缩。使用实测的统一 616 × 213 源区域并保持原生宽高比绘制，各姿态对齐同一站立边界。四行源坐标 y 分别为 106、388、669、950，两列 x 为 6、633。

## 渲染调整

地面先绘制贯穿整个厚度的组织底色与完整原地形纹理，再叠加新的融合断面动作。相邻图块只在横向接缝处渐变拼接。上沿、连接筋膜、血管和器官在同一动作单元内绘制，不再切成血管薄条与孤立肠团；透明边缘也有完整组织纹理承托。

主地面仍保持 40 像素深。悬空平台的可见厚度按宽度提升至 20–24 像素，增加包裹两端的血管边、下侧筋膜、圆润底角和阴影。平台顶面和真实碰撞数据保持原值，避免改变跳跃高度、距离和落点。底部寄生怪继续嵌在主地面组织中。

动作由原有可暂停、可冻结并可联机同步的组织时钟驱动。替换原 intestineMotion 资源槽，不增加其他关卡下载；旧的独立肠团图集不再请求。洞壁和其他背景动画沿用原实现。

## 验证

534 项魂斗罗与共享引擎悟空回归测试通过：[测试记录](H:/project/games/games/contra2026/design/fused-tissue-platform-tests.tap)。覆盖完整厚度底层、动作注册与原生比例、悬空平台加厚、地形碰撞数据保持不变、机关与怪物交互、资源隔离及旧图集不再加载。

已检视新图集原图并检查尺寸、alpha 和源区域。浏览器实机画面尚未复核：此前自动审批因账户额度限制未能通过，本轮没有绕过该限制。交互预览使用实际绘制模块，可在额度恢复后用于暂停、逐帧和厚度检查。

## 完整内置生成提示词

Use case: stylized-concept. Asset type: EIGHT registered animation frames of a single HEAVY, FUSED living-organ platform cross-section for a side-scrolling alien arcade game. Positive style/material reference: the supplied original red-vein and brown-intestine terrain. Rebuild it as ONE cohesive load-bearing slab: a thick dark crimson vascular walking rim at the top, with branching vessels and a broad burgundy connective fascia wrapping DOWN into a dense bed of interlocking brown/auburn intestinal coils; substantial dark fibrous supporting tissue at the bottom. Gut loops are compactly interwoven in several depths, tethered together with membranes, not dangling. Richly shaded painted pixel-game style, dark occlusion BETWEEN folds, fine capillaries and wet highlights. The red rim, fascia and organs physically JOIN with no gap, detached strip, blank seam or hanging sausage fringe. Anatomy occupies a SOLID continuous thick cross-section, not a row of individual objects. Exactly EIGHT equal wide rectangular cells arranged TWO columns and FOUR rows on a square atlas, preferably 1536x1536. Each cell's slab is horizontal about 2:1 width to height, centered in common bounds x5%..95%, y10%..90%, with true transparent gutters between cells. All eight share exactly the SAME flat walkable top, lower outline, edge registration and size. Frames1..8: a localized squeeze travels through the internal gut folds from left to middle to right and releases back to rest; actual chambers pinch, neighboring loops bulge and connective membranes tighten. Keep the heavy rim and outer supporting fascia fixed. No whole-image warp, rescaling, floating organs or copied identical frames. Keep the far-left and far-right 12 percent of each slab anatomically identical across all frames so tiled neighbors remain joined. Palette close to reference: subdued brown-bronze guts, deep red veins, maroon shadows, never bright orange sausage meat. Entire slab fully visible, flat side view, no perspective plane, character, UI, text, labels, frame numbers, grid, cast shadow, environment or checkerboard. Genuine alpha only OUTSIDE each cohesive slab; no transparency underneath the rim or between its internal layers.

