import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CONTRA_SPEC_DEFAULTS, GAME_SPEC_SCHEMA, ITEM_KINDS, resolveGameSpec, validateGameSpec, patchGameSpec,
} from '../../games/shared/game-spec.mjs';
import { createHeadlessEngine } from '../headless.mjs';

const boot = (spec, extra = {}) => {
  const e = createHeadlessEngine({ seed: 7, hostname: '', spec, ...extra });
  return e;
};

test('defaults satisfy their own schema and resolve to a deep copy', () => {
  assert.deepEqual(validateGameSpec(CONTRA_SPEC_DEFAULTS), []);
  const a = resolveGameSpec(), b = resolveGameSpec({});
  assert.deepEqual(a, b);
  a.weapons.rifle.cd = 1;
  assert.equal(resolveGameSpec().weapons.rifle.cd, 0.24, 'resolved specs never share state');
  assert.ok(Object.isFrozen(CONTRA_SPEC_DEFAULTS.weapons.rifle));
});

test('every schema leaf has a description for the agent and editor', () => {
  const missing = [];
  (function walk(node, path) {
    if (node.type === 'object') for (const [k, child] of Object.entries(node.props)) walk(child, path ? `${path}.${k}` : k);
    else if (node.type === 'map') walk(node.value, `${path}.*`);
    else if (node.type === 'array') walk(node.items, `${path}[]`);
    else if (node.type === 'tuple') node.items.forEach((item, i) => walk(item, `${path}[${i}]`));
    else if (!node.desc) missing.push(path);
  })(GAME_SPEC_SCHEMA, '');
  assert.deepEqual(missing, []);
});

test('validation reports unknown fields, ranges and item kinds in Chinese', () => {
  const errors = validateGameSpec({
    weapons: { rifle: { cd: 0, colour: 'red' } },
    player: { lives: { normal: 2.5 } },
    stages: { 1: { pods: [{ at: 100, kind: '?', y0: 60 }] }, 12: {} },
  });
  assert.deepEqual(errors, [
    'weapons.rifle.cd: 不能小于 0.03',
    'weapons.rifle.colour: 未知字段',
    'player.lives.normal: 需要整数',
    'stages.1.pods[0].kind: 只能是 ' + Object.keys(ITEM_KINDS).join('/'),
    'stages.12: 不支持的键',
  ]);
  assert.throws(() => resolveGameSpec({ enemies: { hpScale: 'x' } }), /game\.json 校验失败[\s\S]*enemies\.hpScale: 需要数字/);
});

test('merge replaces arrays, merges objects; merge patch deletes with null', () => {
  const pods = [{ at: 50, kind: 'L', y0: 60 }];
  const spec = resolveGameSpec({ weapons: { rifle: { cd: 0.1 } }, stages: { 1: { pods } } });
  assert.equal(spec.weapons.rifle.cd, 0.1);
  assert.equal(spec.weapons.rifle.spd, 270);
  assert.deepEqual(spec.stages[1].pods, pods);
  assert.deepEqual(spec.stages[1].boxes, CONTRA_SPEC_DEFAULTS.stages[1].boxes);
  const patched = patchGameSpec({ weapons: { rifle: { cd: 0.1, spd: 300 } } }, { weapons: { rifle: { cd: null } }, player: { lives: { normal: 9 } } });
  assert.deepEqual(patched, { weapons: { rifle: { spd: 300 } }, player: { lives: { normal: 9 } } });
});

test('template game.json files are valid overrides', () => {
  for (const name of fs.readdirSync(new URL('../../templates/', import.meta.url))) {
    const json = JSON.parse(fs.readFileSync(new URL(`../../templates/${name}/game.json`, import.meta.url), 'utf8'));
    assert.deepEqual(validateGameSpec(json), [], name);
  }
});

test('engine: lives and extra-life thresholds come from the spec', () => {
  const e = boot({ player: { lives: { normal: 7 }, extraLife: { first: 500, every: 1000 } } });
  e.play(1);
  assert.equal(e.G.lives, 7);
  assert.equal(e.G.nextLife, 500);
  assert.equal(boot().G.lives, 3);
});

test('engine: weapon fire rate comes from the spec', () => {
  const shots = spec => {
    const e = boot(spec, { savedSettings: { autofire: 'on', v: 3 } });
    e.play(1);
    e.frames(180, { KeyJ: true });
    return e.G.p.shotSeq;
  };
  const stock = shots(), fast = shots({ weapons: { rifle: { cd: 0.08, max: 16 } } });
  assert.ok(stock > 0, 'player fires');
  assert.ok(fast >= stock * 2, `faster rifle fires more (${fast} vs ${stock})`);
});

test('engine: enemy hp scaling and per-type overrides apply to spawned enemies', () => {
  const hp = (spec, t) => { const e = boot(spec); e.play(1); e.frames(1); return e.G.en.filter(x => x.t === t).map(x => x.hp); };
  assert.deepEqual([...new Set(hp(undefined, 'tur'))], [6]);
  assert.deepEqual([...new Set(hp({ enemies: { hpScale: 2.5 } }, 'tur'))], [15]);
  assert.deepEqual([...new Set(hp({ enemies: { hpScale: 2.5, types: { snp: { hp: 4 } } } }, 'snp'))], [4]);
  assert.deepEqual([...new Set(hp({ enemies: { types: { tur: { hpScale: 0.5 } } } }, 'tur'))], [3]);
});

test('engine: stage drops come from the spec', () => {
  const pods = [{ at: 64, kind: 'L', y0: 60 }];
  const e = boot({ stages: { 1: { pods, boxes: [[300, 'S']] } } });
  e.play(1);
  const plain = value => JSON.parse(JSON.stringify(value)); // engine objects live in the vm realm
  assert.deepEqual(plain(e.G.podTrig.map(({ at, kind, y0 }) => ({ at, kind, y0 }))), pods);
  assert.deepEqual(plain(e.G.en.filter(x => x.t === 'box').map(x => [x.x, x.item])), [[300, 'S']]);
});

test('engine: score scale multiplies awarded points', () => {
  const e = boot({ scoring: { scale: 3 } });
  e.play(1);
  e.killSoldier({ x: 200, y: 150, hp: 1 });
  assert.equal(e.G.score, 300);
});

test('engine: boss part hp scales with bosses.hpScale', () => {
  const parts = spec => { const e = boot(spec); e.play(1); e.frames(1); return e.G.boss.parts.map(({ hp, max }) => [hp, max]); };
  const stock = parts(), tough = parts({ bosses: { hpScale: 2.5 } });
  assert.ok(stock.length > 0);
  assert.deepEqual(JSON.parse(JSON.stringify(tough)), JSON.parse(JSON.stringify(stock.map(([hp, max]) => {
    if (!(hp > 0 && hp < 999)) return [hp, max];
    const next = Math.max(1, Math.ceil(hp * 2.5));
    return [next, typeof max === 'number' ? Math.max(1, Math.round(max * next / hp)) : max];
  }))));
});

test('engine: shield duration and game title come from the spec', () => {
  const e = boot({ items: { shieldSeconds: 25 }, meta: { title: '星际突击' } });
  e.play(1);
  e.pickItem('B');
  assert.equal(e.G.p.shieldT, 25);
  assert.equal(e.G.bannerText, '护盾 25 秒');
  assert.equal(e.GAME_TITLE, '星际突击');
  assert.equal(boot().GAME_TITLE, '魂斗罗2026');
});

test('engine: enemies.spawnRateScale scales runner and base patrol spawn timers', () => {
  const countRunners = scale => {
    const e = boot({ enemies: { spawnRateScale: scale } });
    e.play(1);
    let spawned = 0;
    const seen = new Set();
    for (let i = 0; i < 360; i++) {
      e.frames(1, { KeyD: true });
      for (const en of e.G.en) if (en.t === 'run' && !seen.has(en)) { seen.add(en); spawned++; }
    }
    return spawned;
  };
  const slow = countRunners(0.25), fast = countRunners(4);
  assert.ok(fast > slow, `spawnRateScale=4 spawned more runners than 0.25 (${fast} vs ${slow})`);
});

test('engine: stages.order validates unique stages and controls stage progression', () => {
  assert.deepEqual(validateGameSpec({ stages: { order: [3, 3] } }), ['stages.order: 不能有重复项']);
  assert.deepEqual(validateGameSpec({ stages: { order: [9] } }), ['stages.order[0]: 不能大于 8']);

  const e = boot({ stages: { order: [3, 1, 5] } });
  assert.equal(e.startStage(2), false, 'stage 2 is excluded from custom order');
  e.play(3);
  assert.equal(e.G.stage, 3);
  e.stageClear();
  assert.equal(e.G.mode, 'clear');
  e.play(1);
  // Defeating stage 1 boss transitions to the next stage in stages.order (5 instead of 2)
  e.G.boss.active = true;
  e.G.boss.dead = true;
  e.G.boss.deadT = 0;
  e.G.boss.exitOpen = true;
  e.G.boss.exitTransitionT = 0.25;
  e.G.p.exitEntered = true;
  e.frames(1);
  assert.equal(e.G.stage, 5, 'stage 1 boss exit advances to next stage in stages.order (5)');
});

test('engine: skins, audio.stages and studioControl apply in-game', () => {
  const e = boot({
    skins: {
      player: { sprite: 'hero.png', width: 28, height: 36, frames: 4, hue: 120 },
      enemies: { run: { sprite: 'orc.png', width: 24, height: 30, frames: 2 }, tur: { sprite: 'cannon.png', width: 24, height: 24 } },
    },
    audio: { stages: { 1: 'stage5', 2: 'custom-boss.ogg' } },
  }, { modules: { modules: [], assetBase: '/api/projects/demo/files/assets' } });
  e.play(1);
  assert.equal(e.inspect().audio.resolved.track, 'stage5');
  e.render();
  assert.ok(e.MOD.api.image('hero.png').src.endsWith('/hero.png'), 'player skin image requested');

  const ctrl = e.studioControl({ stage: 2, debug: true, god: true });
  assert.equal(ctrl.stage, 2);
  assert.equal(ctrl.debug, true);
  assert.equal(ctrl.god, true);
  assert.equal(e.inspect().audio.resolved.track, 'project_stage_2');
  e.frames(5);
  assert.ok(e.G.p.invT >= 0.4, 'god mode maintains player invulnerability');
  e.studioControl({ stage: 1, x: 1200 });
  assert.equal(e.G.p.x, 1200);
  assert.ok(e.G.camX >= 1000);
});

test('engine: rules.health, rules.rage, rules.melee, story.opening and stages.1.theme apply in Track A', () => {
  const e = boot({
    stages: { 1: { name: '第一章：南天门', theme: { skyTint: '#ff7b38', tintAlpha: 0.22, hue: 24 } } },
    story: {
      openingTitle: '齐天大圣 · 大闹天宫',
      openingSubtitle: '西游记动作篇',
      opening: [
        { tag: '壹 · 踏碎凌霄', line1: '一棒碎凌霄，万仙莫敢当。', line2: '踏碎南天门，直捣通明殿。' },
      ],
    },
    rules: {
      health: { maxHp: 64, hitDamage: 12, invincibleSeconds: 0.2, killHeal: 4, killHealEvery: 2 },
      rage: { enabled: 1, max: 100, onHit: 50, onKill: 25, ultimateDamage: 20, ultimateName: '万道金光' },
      melee: { enabled: 1, range: 44, damage: 4, reflectBullets: 1, color: '#ffd24a' },
    },
  });
  e.play(1);
  assert.equal(e.G.stageName, '第一章：南天门');
  assert.equal(e.G.stageTheme.skyTint, '#ff7b38');
  assert.equal(e.G.storyOpening.title, '齐天大圣 · 大闹天宫');
  assert.equal(e.G.p.hp, 64);
  assert.equal(e.G.p.maxHp, 64);
  assert.equal(e.G.p.rage, 0);
  assert.equal(e.G.p.maxRage, 100);

  // Non-lethal hit deducts HP and grants rage instead of losing a life
  e.G.p.invT = 0;
  e.killPlayer();
  assert.equal(e.G.p.dead, false);
  assert.equal(e.G.p.hp, 52);
  assert.equal(e.G.p.rage, 50);
  assert.equal(e.G.lives, 3);

  // Second hit fills rage to 100
  e.G.p.invT = 0;
  e.killPlayer();
  assert.equal(e.G.p.hp, 40);
  assert.equal(e.G.p.rage, 100);

  // Melee slash on fire damages close enemies and reflects enemy bullets into G.pb
  const dummy = { t: 'run', x: e.G.p.x + 24, y: e.G.p.y, hp: 6, vx: 0, vy: 0 };
  e.G.en.push(dummy);
  const eb = { x: e.G.p.x + 14, y: e.G.p.y - 30, vx: -120, vy: 0, r: 3 };
  e.G.eb.push(eb);
  e.frames(1, { KeyJ: true });
  assert.equal(dummy.hp, 2, 'melee slash dealt 4 damage');
  assert.equal(eb.dead, true, 'melee slash cleared incoming enemy bullet');
  assert.ok(e.G.pb.some(b => b.vx > 0), 'reflected bullet spawned in G.pb');
  assert.ok(e.G.fx.some(f => f.k === 'meleeArc'), 'spawned meleeArc visual effect');

  // Kill-heal triggers every 2 kills
  e.killEnemy({ t: 'run', x: e.G.p.x + 60, y: e.G.p.y, hp: 1 });
  assert.equal(e.G.p.hp, 40);
  e.killEnemy({ t: 'run', x: e.G.p.x + 60, y: e.G.p.y, hp: 1 });
  assert.equal(e.G.p.hp, 44, 'healed 4 HP after 2 kills');

  // Rage ultimate (KeyI when rage >= 100) deals ultimateDamage to nearby enemies and clears enemy bullets
  e.G.p.rage = 100;
  const guard = { t: 'snp', x: e.G.p.x + 80, y: e.G.p.y - 10, hp: 15, vx: 0, vy: 0 };
  e.G.en.push(guard);
  e.G.eb.push({ x: e.G.p.x + 40, y: e.G.p.y - 10, vx: -90, vy: 0, r: 3 });
  e.frames(2, { KeyI: true });
  assert.equal(e.G.p.rage, 0, 'ultimate consumed full rage');
  assert.equal(guard.dead, true, 'ultimate killed nearby guard');
  assert.equal(e.G.bannerText, '万道金光 · 怒气释放');
  e.render();
});

test('engine: an invalid spec refuses to boot', () => {
  assert.throws(() => boot({ weapons: { rifle: { cd: -1 } } }), /weapons\.rifle\.cd/);
});

