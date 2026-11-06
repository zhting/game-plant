import test from 'node:test';
import assert from 'node:assert/strict';
import { createModRuntime, normalizeEnemyDef, MOD_HOOKS } from '../../games/shared/mod-runtime.mjs';
import { createHeadlessEngine } from '../headless.mjs';

const boot = (modules, extra = {}) => createHeadlessEngine({ seed: 5, hostname: '', modules: { modules }, ...extra });
const plain = value => JSON.parse(JSON.stringify(value)); // engine objects live in the vm realm

const bird = (overrides = {}) => api => api.defineEnemy('diveBird', {
  name: '俯冲怪鸟', hp: 2, score: 300, box: { w: 18, h: 12 }, drop: 'S',
  spawn: { stages: [1], every: [1, 1.5], max: 2, firstDelay: 0.5 },
  init(e) { e.vx = -70; },
  update(e, game) { e.x += e.vx * game.dt; },
  ...overrides,
});

test('enemy definitions are validated with Chinese errors', () => {
  assert.throws(() => normalizeEnemyDef('Bird', {}), /不合法/);
  assert.throws(() => normalizeEnemyDef('run', {}, ['run']), /原版敌人重名/);
  assert.throws(() => normalizeEnemyDef('bird', { hp: 0 }), /hp 需要/);
  assert.throws(() => normalizeEnemyDef('bird', { spawn: { stages: [9] } }), /spawn\.stages/);
  assert.throws(() => normalizeEnemyDef('bird', { spawn: { every: [5, 1] } }), /spawn\.every/);
  assert.throws(() => normalizeEnemyDef('bird', { drop: '?' }, [], ['S']), /drop/);
  assert.throws(() => normalizeEnemyDef('bird', { update: 1 }), /update 需要是函数/);
  const def = normalizeEnemyDef('bird', { spawn: {} });
  assert.equal(def.hp, 1);
  assert.deepEqual([...def.spawn.stages], [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(def.box.anchor, 'center');
});

test('setup errors are recorded instead of thrown; hooks are checked', () => {
  const runtime = createModRuntime([
    () => { throw new Error('boom'); },
    { default: api => api.on('nope', () => {}) },
    { notASetup: true },
    api => api.on('step', () => {}),
  ]);
  assert.deepEqual(runtime.errors.map(e => e.message.slice(0, 6)), ['boom', '未知钩子 "', '模块需要 e']);
  assert.equal(runtime.active, true);
  assert.equal(runtime.hooks.step.length, 1);
  assert.ok(Object.keys(MOD_HOOKS).includes('drawScreen'));
});

test('engine without modules keeps the runtime inert', () => {
  const e = createHeadlessEngine({ seed: 5, hostname: '' });
  assert.equal(e.MOD.active, false);
  e.play(1); e.frames(60);
  assert.equal(e.G.modT, undefined);
});

test('custom enemies spawn, move, respect max and pay out on kill', () => {
  const kills = [];
  const e = boot([bird(), api => api.on('kill', enemy => kills.push(enemy.t))]);
  e.play(1);
  e.frames(240, { KeyD: true });
  const birds = e.G.en.filter(x => x.t === 'diveBird' && !x.dead);
  assert.ok(birds.length >= 1 && birds.length <= 2, `spawned ${birds.length}`);
  assert.ok(birds.every(b => b.x < e.G.camX + 384 + 16), 'birds fly left');
  const target = birds[0], score = e.G.score;
  e.damageEnemy(target, 1, target.x, target.y);
  assert.equal(target.dead, undefined, 'survives the first hit (hp 2)');
  e.damageEnemy(target, 1, target.x, target.y);
  assert.equal(target.dead, true);
  assert.equal(e.G.score - score, 300);
  assert.ok(e.G.items.some(it => it.kind === 'S'), 'drops its item');
  assert.deepEqual(kills, ['diveBird']);
});

test('custom enemies hurt on contact unless contact: false', () => {
  for (const contact of [true, false]) {
    const e = boot([bird({ spawn: undefined, contact })]);
    e.play(1); e.frames(1);
    e.G.p.invT = 0;
    e.spawnModEnemy('diveBird', { x: e.G.p.x, y: e.G.p.y - 12, vx: 0 });
    e.frames(1);
    assert.equal(!!e.G.p.dead, contact, `contact ${contact}`);
  }
});

test('a throwing update removes only that enemy and records the error', () => {
  const e = boot([bird({ update() { throw new Error('翅膀坏了'); } })]);
  e.play(1);
  e.frames(120, { KeyD: true });
  assert.equal(e.G.mode, 'play');
  assert.equal(e.G.en.filter(x => x.t === 'diveBird' && !x.dead).length, 0);
  assert.equal(e.MOD.errors[0].where, 'diveBird.update');
  assert.match(e.MOD.errors[0].message, /翅膀坏了/);
});

test('stage renderers draw custom enemies through the module hook across all stage modes', () => {
  for (const stage of [1, 2, 4, 5]) {
    let drawn = 0;
    const e = boot([bird({ spawn: undefined, draw(g, enemy) { drawn++; g.fillRect(enemy.x - 9, enemy.y - 6, 18, 12); } })]);
    e.play(stage); e.frames(1);
    e.spawnModEnemy('diveBird', { x: e.G.camX + 200, y: e.G.camY + 80 });
    e.render();
    assert.ok(drawn >= 1, `stage ${stage} drew ${drawn}`);
  }
});

test('custom enemies spawn, update, take bullet damage and fire in Stage 2 (base) and Wukong mode', () => {
  // Stage 2 (isBase): spawn, shoot, and take player bullet damage
  const e2 = boot([bird({
    hp: 1,
    spawn: { stages: [2], every: [0.3, 0.3], max: 1, firstDelay: 0.1 },
    init(enemy) { enemy.x = 192; enemy.y = 110; enemy.vx = 0; enemy.vy = 0; },
    update(enemy, game) { if (!enemy.fired) { enemy.fired = true; game.shoot(enemy.x, enemy.y, 0, 120); } },
  })]);
  e2.play(2);
  e2.frames(12);
  const b2 = e2.G.en.find(x => x.t === 'diveBird' && !x.dead);
  assert.ok(b2, 'spawned in stage 2');
  assert.ok(e2.G.eb.some(b => !b.base), 'fired a 2D bullet in stage 2');
  e2.G.pb.push({ k: 'b', t: 0, x0: b2.x, y0: b2.y, x: b2.x, y: b2.y, xe: b2.x, ye: b2.y, spd: 1, dmg: 2 });
  e2.frames(2);
  assert.equal(b2.dead, true, 'player bullet killed custom enemy in stage 2');

  // Wukong mode: stages 1 and 2 run custom enemies
  for (const stage of [1, 2]) {
    let updated = 0;
    const ew = boot([bird({
      spawn: { stages: [stage], every: [0.3, 0.3], max: 1, firstDelay: 0.1 },
      update(enemy, game) { updated++; enemy.x += -40 * game.dt; },
    })], { game: 'wukong' });
    ew.play(stage);
    ew.frames(20);
    assert.ok(updated > 0, `wukong stage ${stage} updated custom enemy`);
  }
});

test('stageStart, step and drawScreen hooks run', () => {
  const calls = { stageStart: [], step: 0, drawScreen: 0 };
  const e = boot([api => {
    api.on('stageStart', (game, stage) => calls.stageStart.push(stage));
    api.on('step', game => { calls.step++; if (game.frame === 10) game.score(50); });
    api.on('drawScreen', ctx => { calls.drawScreen++; ctx.fillRect(0, 0, 4, 4); });
  }]);
  e.play(3);
  e.frames(20);
  e.render();
  assert.deepEqual(plain(calls.stageStart), [1, 3], 'boot resets to stage 1, then play(3)');
  assert.equal(calls.step, 20);
  assert.equal(calls.drawScreen, 1);
  assert.equal(e.G.score, 50);
});

test('the module example in the agent prompt runs and its bird dives', async () => {
  const { EXAMPLE_MODULE } = await import('../../backend/ai/mod-guide.mjs');
  const namespace = await import('data:text/javascript,' + encodeURIComponent(EXAMPLE_MODULE));
  const e = boot([namespace]);
  e.play(1);
  let dived = false;
  for (let i = 0; i < 900 && !dived; i++) { e.frames(1, { KeyD: i % 3 === 0 }); dived = e.G.en.some(x => x.t === 'diveBird' && x.mode === 'dive'); }
  assert.deepEqual(plain(e.MOD.errors), []);
  assert.ok(dived, 'a bird started a dive');
});

test('M4 Wukong Stage 1 Benchmark: Contra template + Track A spec + Track B spell module reproduces Wukong Stage 1 gameplay', () => {
  const wukongStage1Spec = {
    meta: { title: '大圣破南天' },
    items: { specialCooldown: 0.4 },
    stages: {
      order: [1],
      1: {
        name: '第一章：南天门',
        theme: { skyTint: '#ff7b38', tintAlpha: 0.22, hue: 24 },
        pods: [{ at: 180, kind: 'g', y0: 72 }, { at: 360, kind: 'f', y0: 68 }],
        boxes: [[240, 'S'], [520, 'L']],
      },
    },
    story: {
      openingTitle: '齐天大圣 · 南天门之战',
      openingSubtitle: '大闹天宫前传',
      opening: [{ tag: '壹 · 大闹天宫', line1: '金箍棒起风云动', line2: '南天门外战鼓擂' }],
    },
    rules: {
      health: { maxHp: 64, hitDamage: 12, invincibleSeconds: 0.4, killHeal: 4, killHealEvery: 2 },
      rage: { enabled: 1, max: 100, onHit: 50, onKill: 25, ultimateDamage: 20, ultimateName: '万道金光' },
      melee: { enabled: 1, range: 42, damage: 4, reflectBullets: 1, color: '#ffd24a' },
    },
  };

  const wukongSpellsModule = api => {
    const clones = [];
    let worldDraws = 0;
    let attacks = 0;
    let hurts = 0;

    // Custom celestial supply fairy that heals the player when defeated
    api.defineEnemy('peachFairy', {
      name: '蟠桃仙娥', hp: 3, score: 500, drop: 'g',
      box: { w: 18, h: 16 }, contact: false,
      spawn: { stages: [1], every: [2, 3], max: 1, height: 'sky', firstDelay: 0.5 },
      init(e) { e.vx = -45; },
      update(e, game) { e.x += e.vx * game.dt; e.y += Math.sin(e.age * 6) * 12 * game.dt; },
      onKill(e, game) { game.healPlayer(10); game.banner('仙桃回血 +10', 1.2); },
    });

    api.on('playerAttack', () => { attacks++; });
    api.on('playerHurt', () => { hurts++; });

    // Override Special Item L: 'g' summons 2 monkey clones; 'f' casts Freeze Spell (定身术)
    api.on('useItem', (player, kind, game) => {
      if (kind === 'g') {
        clones.push(
          { x: player.x - 18, y: player.y, face: player.face || 1, ttl: 6, cd: 0.1 },
          { x: player.x + 18, y: player.y, face: player.face || 1, ttl: 6, cd: 0.2 },
        );
        game.banner('身外身法', 1.4);
        game.sound('mount');
        return true;
      }
      if (kind === 'f') {
        game.freezeEnemies(4);
        game.clearEnemyBullets(player.x, player.y - 12, 160);
        game.banner('定身术 · 4秒', 1.4);
        game.sound('flash');
        return true;
      }
      return false;
    });

    api.on('step', game => {
      const p = game.players()[0];
      for (let i = clones.length - 1; i >= 0; i--) {
        const c = clones[i];
        c.ttl -= game.dt;
        if (c.ttl <= 0) { clones.splice(i, 1); continue; }
        if (p) { c.y = p.y; c.face = p.face || 1; }
        c.cd -= game.dt;
        if (c.cd <= 0) {
          c.cd = 0.35;
          game.fireBullet(c.x, c.y - 12, c.face * 240, 0, { kind: 's', dmg: 2 });
        }
      }
    });

    api.on('drawWorld', g => {
      worldDraws++;
      g.fillStyle = '#ffd24a';
      for (const c of clones) g.fillRect(c.x - 5, c.y - 22, 10, 22);
    });

    api.on('drawScreen', ctx => {
      ctx.fillStyle = '#ffd24a';
      ctx.fillRect(4, 4, Math.min(40, attacks + hurts + worldDraws), 2);
    });
  };

  const e = boot([wukongSpellsModule], { spec: wukongStage1Spec });
  e.play(1);

  // 1. Stage 1 theme & 64-HP / Rage initialization
  assert.equal(e.G.stageName, '第一章：南天门');
  assert.equal(e.G.p.hp, 64);
  assert.equal(e.G.p.maxRage, 100);

  // 2. Melee slash + playerAttack hook
  e.frames(2, { KeyJ: true });
  assert.ok(e.G.fx.some(f => f.k === 'meleeArc'), 'melee arc spawned on attack');

  // 3. Pick and cast Clone Spell (身外身法 via 'g' item + KeyL)
  e.pickItem('g');
  assert.deepEqual(plain(e.G.inv), ['g']);
  e.frames(2, { KeyL: true });
  assert.deepEqual(plain(e.G.inv), [], 'custom useItem consumed special item');
  assert.equal(e.G.bannerText, '身外身法');
  const pbBefore = e.G.pb.length;
  e.frames(60);
  assert.ok(e.G.pb.length > pbBefore, 'monkey clones fired friendly bullets via game.fireBullet');

  // 4. Pick and cast Freeze Spell (定身术 via 'f' item + KeyL)
  e.pickItem('f');
  e.frames(2, { KeyL: true });
  assert.equal(e.G.bannerText, '定身术 · 4秒');
  assert.ok(e.G.freezeT > 3.5, 'enemies frozen via game.freezeEnemies');

  // 5. Hurt player to test HP loss, playerHurt hook, and Peach Fairy heal on kill
  e.G.p.invT = 0;
  e.killPlayer();
  assert.equal(e.G.p.hp, 52);
  const fairy = e.spawnModEnemy('peachFairy', { x: e.G.p.x + 30, y: e.G.p.y - 20 });
  assert.ok(fairy, 'spawned peachFairy');
  e.damageEnemy(fairy, 10, fairy.x, fairy.y);
  assert.equal(fairy.dead, true);
  assert.equal(e.G.p.hp, 62, 'defeating peachFairy healed player by +10 HP');

  // 6. Trigger Rage Ultimate (万道金光)
  e.G.p.rage = 100;
  const enemy = { t: 'run', x: e.G.p.x + 50, y: e.G.p.y, hp: 8, vx: 0, vy: 0 };
  e.G.en.push(enemy);
  e.frames(2, { KeyI: true });
  assert.equal(enemy.dead, true, 'Rage ultimate defeated enemy');
  assert.equal(e.G.p.rage, 0);

  // Render full frame (background tint, HUD HP/Rage bars, drawWorld clones, drawScreen overlay)
  e.render();
  assert.deepEqual(plain(e.MOD.errors), []);
});

