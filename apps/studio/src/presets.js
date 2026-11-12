// Built-in original game starter themes (Track A + optional Track B brick) and
// one-click no-code gameplay mechanics bricks (Track B modules/brick-*.mjs).

export const GAMEPLAY_BRICKS = [
  {
    id: 'brick-dash',
    path: 'modules/brick-dash.mjs',
    icon: '⚡',
    title: '疾风闪避冲刺',
    tag: '身法机动',
    desc: '按住方向键开火时触发短距残影冲刺（冷却 1.2 秒），附带 0.22 秒无敌帧，轻松穿梭弹幕。',
    source: `export default function setup(api) {
  let cd = 0;
  const ghosts = [];
  api.on('stageStart', () => { cd = 0; ghosts.length = 0; });
  api.on('step', game => {
    if (cd > 0) cd = Math.max(0, cd - game.dt);
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].life -= game.dt;
      if (ghosts[i].life <= 0) ghosts.splice(i, 1);
    }
  });
  api.on('playerAttack', (p, game) => {
    if (!p || p.dead || cd > 0 || Math.abs(p.vx || 0) < 20) return;
    cd = 1.2;
    const dir = p.face || 1;
    for (let i = 0; i < 3; i++) {
      ghosts.push({ x: p.x - dir * i * 6, y: p.y, life: 0.22 - i * 0.04 });
    }
    p.x = Math.max(game.camera.x + 12, Math.min(game.camera.x + game.camera.w - 12, p.x + dir * 26));
    p.invT = Math.max(p.invT || 0, 0.22);
    game.sound('jump');
  });
  api.on('drawWorld', g => {
    for (const gh of ghosts) {
      g.globalAlpha = Math.max(0.1, gh.life * 2.5);
      g.fillStyle = '#56e0ff';
      g.fillRect(gh.x - 5, gh.y - 24, 10, 22);
    }
    g.globalAlpha = 1;
  });
}
`,
  },
  {
    id: 'brick-stomp',
    path: 'modules/brick-stomp.mjs',
    icon: '🥾',
    title: '猎魔踩头杀怪',
    tag: '平台动作',
    desc: '从空中下落踩中敌人头顶时直接造成 6 点重创，角色自动向上二段弹跳并短暂无敌！',
    source: `export default function setup(api) {
  const rings = [];
  api.on('stageStart', () => { rings.length = 0; });
  api.on('step', game => {
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += game.dt;
      if (rings[i].t > 0.25) rings.splice(i, 1);
    }
    const p = game.G && game.G.p;
    if (!p || p.dead || p.onGround || !(p.vy > 30)) return;
    const hit = game.damageEnemiesInRadius(p.x, p.y + 4, 20, 6);
    if (hit > 0) {
      p.vy = -255;
      p.invT = Math.max(p.invT || 0, 0.35);
      rings.push({ x: p.x, y: p.y, t: 0 });
      game.sound('hit');
      game.shake(2);
    }
  });
  api.on('drawWorld', g => {
    for (const r of rings) {
      g.strokeStyle = '#ffd166';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(r.x, r.y - 2, 6 + r.t * 64, 0, Math.PI * 2);
      g.stroke();
    }
  });
}
`,
  },
  {
    id: 'brick-drone',
    path: 'modules/brick-drone.mjs',
    icon: '🛸',
    title: '浮游光球僚机',
    tag: '召唤助战',
    desc: '召唤一颗环绕主角飞行的青色能量浮游炮，每 0.55 秒自动朝前方或最近敌人发射支援光弹。',
    source: `export default function setup(api) {
  let fireCd = 0.4;
  api.on('stageStart', () => { fireCd = 0.4; });
  api.on('step', game => {
    const p = game.G && game.G.p;
    if (!p || p.dead) return;
    fireCd -= game.dt;
    if (fireCd > 0) return;
    fireCd = 0.55;
    const ox = p.x + Math.cos(game.time * 3.5) * 18;
    const oy = p.y - 28 + Math.sin(game.time * 5) * 5;
    let best = null, bestD = 220;
    for (const e of game.G.en || []) {
      if (e.dead || e.harmless || e.t === 'box') continue;
      const d = Math.hypot(e.x - ox, (e.y - 10) - oy);
      if (d < bestD) { bestD = d; best = e; }
    }
    const ang = best ? Math.atan2((best.y - 10) - oy, best.x - ox) : (p.face < 0 ? Math.PI : 0);
    const b = game.fireBullet(ox, oy, Math.cos(ang) * 320, Math.sin(ang) * 320, { dmg: 1 });
    b.color = '#00f5d4';
    b.size = 3;
  });
  api.on('drawWorld', (g, game) => {
    const p = game.G && game.G.p;
    if (!p || p.dead) return;
    const ox = p.x + Math.cos(game.time * 3.5) * 18;
    const oy = p.y - 28 + Math.sin(game.time * 5) * 5;
    g.fillStyle = 'rgba(0, 245, 212, 0.35)';
    g.beginPath(); g.arc(ox, oy, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(ox, oy, 3, 0, Math.PI * 2); g.fill();
  });
}
`,
  },
  {
    id: 'brick-vamp',
    path: 'modules/brick-vamp.mjs',
    icon: '🧛',
    title: '狂战护体震波与急救',
    tag: '生存反击',
    desc: '受伤瞬间自动引爆护体冲击波（清空周围敌弹并造成 8 点反伤），按 L 用道具时额外回复 20 点气血。',
    source: `export default function setup(api) {
  let wave = null;
  api.on('stageStart', () => { wave = null; });
  api.on('step', game => {
    if (wave) { wave.t += game.dt; if (wave.t > 0.35) wave = null; }
  });
  api.on('playerHurt', (p, _hit, game) => {
    if (!p) return;
    game.clearEnemyBullets(p.x, p.y - 12, 140);
    game.damageEnemiesInRadius(p.x, p.y - 12, 95, 8);
    game.shake(4);
    wave = { x: p.x, y: p.y - 12, t: 0 };
  });
  api.on('useItem', (p, _kind, game) => {
    game.healPlayer(20, p);
    game.banner('狂战急救 +20 HP', 1.2);
    return false;
  });
  api.on('drawWorld', g => {
    if (!wave) return;
    g.strokeStyle = '#ff4d6d';
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(wave.x, wave.y, 12 + wave.t * 240, 0, Math.PI * 2);
    g.stroke();
  });
}
`,
  },
  {
    id: 'brick-sky-eye',
    path: 'modules/brick-sky-eye.mjs',
    icon: '👁️',
    title: '巡天机械魔眼（原创怪）',
    tag: '新敌人',
    desc: '在关卡空中周期性刷出紫金配色的巡天机械魔眼，瞄准主角俯冲突袭，击落奖励 350 分并掉落散弹 S！',
    source: `export default function setup(api) {
  api.defineEnemy('skyEye', {
    name: '巡天魔眼',
    hp: 3,
    score: 350,
    drop: 'S',
    box: { w: 18, h: 14 },
    spawn: { stages: [1, 3, 5, 6, 8], every: [4.5, 7.5], max: 2, height: 'sky' },
    init(e) { e.vx = -58; e.mode = 'scan'; },
    update(e, game) {
      const p = game.target(e.x);
      e.x += e.vx * game.dt;
      if (e.mode === 'scan' && p && Math.abs(p.x - e.x) < 76) {
        e.mode = 'swoop';
        e.vy = 155;
        game.sound('toss');
      } else if (e.mode === 'swoop') {
        e.y += e.vy * game.dt;
        if (e.y > game.camera.y + 156) e.mode = 'rise';
      } else if (e.mode === 'rise') {
        e.y -= 95 * game.dt;
        if (e.y < game.camera.y + 44) e.mode = 'scan';
      }
      e.face = e.vx < 0 ? -1 : 1;
    },
    draw(g, e) {
      const wing = Math.sin(e.age * 16) * 4;
      g.fillStyle = e.flash > 0 ? '#ffffff' : '#7b2cbf';
      g.fillRect(e.x - 11, e.y - 3 - wing, 6, 4);
      g.fillRect(e.x + 5, e.y - 3 - wing, 6, 4);
      g.beginPath(); g.arc(e.x, e.y, 7, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffd166';
      g.beginPath(); g.arc(e.x + e.face * 2, e.y, 3, 0, Math.PI * 2); g.fill();
    },
  });
}
`,
  },
];

export const STARTER_THEMES = [
  {
    id: 'cyber',
    icon: '🌆',
    title: '赛博霓虹猎手',
    badge: '科幻穿透光刃',
    template: 'contra',
    desc: '霓虹紫青夜幕 + 贯穿脉冲光刃 + 80 点护盾血条 + 浮游光球僚机 + 合成波电子乐',
    bricks: ['brick-drone', 'brick-dash'],
    patch: {
      meta: { description: '穿梭于2099霓虹下城区的义体赏金猎人' },
      player: { lives: { normal: 5 }, physics: { runSpeed: 132, jumpVelocity: 315 } },
      weapons: {
        rifle: { name: '脉冲光刃', cd: 0.16, max: 8, per: 1, spd: 360, damageScale: 2, pierce: 1, color: '#00f5d4', size: 4 },
        spread: { name: '霓虹电弧', cd: 0.24, max: 15, per: 5, spd: 300, color: '#ff4dff', size: 3 },
      },
      rules: {
        health: { maxHp: 80, hitDamage: 16, invincibleSeconds: 0.9, killHeal: 6, killHealEvery: 4 },
        rage: { enabled: 1, max: 100, onHit: 25, onKill: 20, ultimateDamage: 28, ultimateName: '超载电磁暴' },
      },
      bosses: { hpScale: 1.2, hue: -55, saturate: 1.4 },
      audio: { stages: { 1: 'stage1cyberpunk', 2: 'stage5', 3: 'stage1industrial' } },
      stages: {
        1: { name: '霓虹下城区', theme: { skyTint: '#1b0b3b', tintAlpha: 0.34, hue: -48 } },
        2: { name: '中枢数据塔', theme: { skyTint: '#092338', tintAlpha: 0.26, hue: -30 } },
      },
      story: {
        openingTitle: '新京市 · 2099 年',
        openingSubtitle: '义体觉醒行动',
        opening: [
          { tag: '第一章 · 黑雨夜幕', line1: '巨型财团封锁了天穹电网，', line2: '失控的自律机械军团占领了下城区。' },
          { tag: '第二章 · 脉冲出击', line1: '唤醒脉冲光刃与浮游僚机，', line2: '撕开霓虹铁幕，直捣数据核心！' },
        ],
        endingTitle: '新京市 · 黎明破晓',
        endingSubtitle: '自由重归街头',
        ending: [
          { tag: '终章 · 电网瓦解', line1: '主脑核心在电磁风暴中轰然崩塌，', line2: '久违的星光重新照亮了整座城市。' },
        ],
      },
    },
  },
  {
    id: 'castlevania',
    icon: '🗡️',
    title: '魔城恶魔猎人',
    badge: '抛物线飞斧+近战',
    template: 'contra',
    desc: '哥特血月古堡氛围 + 抛物线高伤圣银飞斧 + 剑气弹反近战 + 踩头二段跳 + 管弦配乐',
    bricks: ['brick-stomp'],
    patch: {
      meta: { description: '踏入血月古堡讨伐暗夜魔物的猎魔剑士' },
      player: { lives: { normal: 5 }, physics: { runSpeed: 118, jumpVelocity: 325 } },
      weapons: {
        rifle: { name: '圣银飞斧', cd: 0.28, max: 6, per: 1, spd: 215, damageScale: 2.5, gravity: 420, pierce: 1, color: '#ffd166', size: 5 },
        fire: { name: '圣水十字火', cd: 0.26, max: 5, per: 1, spd: 190, damageScale: 2, gravity: 260, color: '#4cc9f0', size: 5 },
      },
      rules: {
        health: { maxHp: 64, hitDamage: 16, invincibleSeconds: 1, killHeal: 5, killHealEvery: 4 },
        melee: { enabled: 1, range: 46, damage: 5, reflectBullets: 1, color: '#ff4d6d' },
        rage: { enabled: 1, max: 100, onHit: 30, onKill: 20, ultimateDamage: 30, ultimateName: '圣十字审判' },
      },
      bosses: { hpScale: 1.25, hue: -35, saturate: 1.5 },
      audio: { stages: { 1: 'stage1orchestral', 2: 'stage6', 3: 'stage3' } },
      stages: {
        1: { name: '血月古堡长廊', theme: { skyTint: '#3b0918', tintAlpha: 0.34, hue: -25 } },
        2: { name: '地下炼金圣堂', theme: { skyTint: '#240046', tintAlpha: 0.3, hue: -40 } },
      },
      story: {
        openingTitle: '特兰西瓦尼亚 · 血月之夜',
        openingSubtitle: '恶魔城讨伐录',
        opening: [
          { tag: '序幕 · 百年封印破碎', line1: '猩红满月升起，古老魔城自迷雾中苏醒，', line2: '暗夜魔物再次席卷边境村庄。' },
          { tag: '启程 · 圣银与剑光', line1: '手握圣银飞斧与斩魔剑技，', line2: '孤身踏过断桥，讨伐暗夜君王！' },
        ],
        endingTitle: '晨曦重临 · 古堡崩塌',
        endingSubtitle: '暗夜传说落幕',
        ending: [
          { tag: '终幕 · 黎明钟声', line1: '随着魔城高塔轰然倒塌，', line2: '第一缕金色阳光刺破了漫长黑夜。' },
        ],
      },
    },
  },
  {
    id: 'mecha',
    icon: '🔥',
    title: '星际重装机甲',
    badge: '高防重火力倾泻',
    template: 'contra',
    desc: '140 点重型装甲 + 极速火神机炮 + 受伤护体反震波 + 工业重金属配乐 + 强化巨型 Boss',
    bricks: ['brick-vamp', 'brick-sky-eye'],
    patch: {
      meta: { description: '驾驶泰坦级重装机甲空降异星母巢执行歼灭任务' },
      player: { lives: { normal: 4 }, physics: { runSpeed: 108, jumpVelocity: 315, gravity: 740 } },
      weapons: {
        rifle: { name: '火神重机炮', cd: 0.1, max: 14, per: 1, spd: 420, damageScale: 1.5, color: '#ff9f1c', size: 3 },
        laser: { name: '阳电子破城炮', cd: 0.24, max: 2, per: 1, spd: 440, damageScale: 3, pierce: 1, color: '#38bdf8', size: 5 },
      },
      rules: {
        health: { maxHp: 140, hitDamage: 14, invincibleSeconds: 0.65, killHeal: 8, killHealEvery: 5 },
        rage: { enabled: 1, max: 100, onHit: 20, onKill: 15, ultimateDamage: 35, ultimateName: '全弹幕倾泻' },
      },
      bosses: { hpScale: 1.5, hue: 135, saturate: 1.3 },
      audio: { stages: { 1: 'stage1industrial', 2: 'stage7', 3: 'stage4' } },
      stages: {
        1: { name: '异星前哨基地', theme: { skyTint: '#102a43', tintAlpha: 0.26, hue: 145 } },
      },
      story: {
        openingTitle: '天狼星殖民地 · 轨道空降',
        openingSubtitle: '泰坦机甲歼灭战',
        opening: [
          { tag: '警报 · 殖民地沦陷', line1: '深空虫群与失控要塞吞噬了第七矿区，', line2: '常规陆战队已全部失去联系。' },
          { tag: '空降 · 重装出击', line1: '启动泰坦三型重装机甲与火神机炮，', line2: '正面碾碎一切阻挡之敌！' },
        ],
        endingTitle: '轨道净空 · 任务完成',
        endingSubtitle: '钢铁洪流凯旋',
        ending: [
          { tag: '终章 · 母巢覆灭', line1: '异星母巢在阳电子炮火中化为灰烬，', line2: '重装机甲迎着恒星朝阳返航。' },
        ],
      },
    },
  },
  {
    id: 'xianxia',
    icon: '🐒',
    title: '齐天破阵录',
    badge: '东方神话棍法',
    template: 'wukong',
    desc: '基于悟空动作底座：金箍棒连段、蓄力棍气、七十二变与分身仙术，配国风神魔交响乐',
    bricks: ['brick-dash'],
    patch: {
      meta: { description: '身披锁子黄金甲，挥舞如意金箍棒踏破九霄仙阵' },
      player: { lives: { normal: 5 }, physics: { runSpeed: 124, jumpVelocity: 302 } },
      scoring: { scale: 2 },
      stages: {
        1: { name: '灵山云海崖' },
        2: { name: '九霄雷霆殿' },
      },
    },
  },
];
