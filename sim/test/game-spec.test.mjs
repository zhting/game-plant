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

test('engine: an invalid spec refuses to boot', () => {
  assert.throws(() => boot({ weapons: { rifle: { cd: -1 } } }), /weapons\.rifle\.cd/);
});
