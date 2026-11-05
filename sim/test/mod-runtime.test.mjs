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
  assert.throws(() => normalizeEnemyDef('bird', { spawn: { stages: [2] } }), /spawn\.stages/);
  assert.throws(() => normalizeEnemyDef('bird', { spawn: { every: [5, 1] } }), /spawn\.every/);
  assert.throws(() => normalizeEnemyDef('bird', { drop: '?' }, [], ['S']), /drop/);
  assert.throws(() => normalizeEnemyDef('bird', { update: 1 }), /update 需要是函数/);
  const def = normalizeEnemyDef('bird', { spawn: {} });
  assert.equal(def.hp, 1);
  assert.deepEqual([...def.spawn.stages], [1, 3, 5, 6, 7, 8]);
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

test('stage renderers draw custom enemies through the module hook', () => {
  for (const stage of [1, 5]) {
    let drawn = 0;
    const e = boot([bird({ spawn: undefined, draw(g, enemy) { drawn++; g.fillRect(enemy.x - 9, enemy.y - 6, 18, 12); } })]);
    e.play(stage); e.frames(1);
    e.spawnModEnemy('diveBird', { x: e.G.camX + 200, y: e.G.camY + 80 });
    e.render();
    assert.ok(drawn >= 1, `stage ${stage} drew ${drawn}`);
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
