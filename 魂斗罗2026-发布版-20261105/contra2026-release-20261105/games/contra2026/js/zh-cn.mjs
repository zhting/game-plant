// Display labels only. Item codes and network state keep their original values.
export const WEAPON_LABELS = Object.freeze({ rifle: '步枪', machine: '机枪', spread: '散弹', laser: '激光', fire: '火焰', homing: '导弹' });
export const ITEM_LABELS = Object.freeze({
  M: '机枪', S: '散弹', L: '激光', F: '火焰', H: '导弹', R: '速射', B: '护盾', life:'生命 +1',
  g: '手雷', f: '闪光', m: '摩托', h: '飞机', u: '蘑菇', c: '迷彩', t: '炸药',
  e: '电磁', d: '盾牌', k: '钩爪', j: '头盔', o: '诱饵', n: '扫雷', i: '冰爪',
  v: '热像', x: '防火', w: '液氮', y: '磁靴', a: '无人机', p: '声波', z: '抗酸',
  b: '氧气', l: '鱼雷', q: '气囊', s: '声呐', r: '冷却', A: '推进', C: '涡流',
  D: '时缓', E: '照明', P: '荧光', K: '绝缘', T: '阀门', G: '破冰', W: '暖流', N: '护盾', Q: '哨炮'
});
export const itemLabel = kind => ITEM_LABELS[kind] || '道具';
