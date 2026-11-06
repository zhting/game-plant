// Project code modules ("轨道 B" in docs/ROADMAP.md).
//
// A project may ship `modules/*.mjs`. Each module default-exports a setup
// function that receives the API below and registers new enemies and hooks:
//
//   export default function setup(api) {
//     api.defineEnemy('diveBird', {
//       name: '俯冲怪鸟', hp: 3, score: 300, box: { w: 18, h: 12 },   // e.x/e.y = box centre (anchor: 'feet' → bottom centre)
//       spawn: { stages: [1], every: [3, 6], max: 2, height: 'sky' },
//       update(e, game) { ... },          // once per 1/60 s frame
//       draw(g, e, game) { ... },         // world coordinates, g = CanvasRenderingContext2D
//     });
//     api.on('kill', (e, game) => { ... });
//   }
//
// The engine owns the frame loop; modules only see the `game` facade built in
// arcade-engine.mjs (see MOD_GAME there), so stock behaviour is untouched when a
// project has no modules (golden replays stay identical).
//
// Errors thrown by module code never crash the game: the failing enemy is
// removed, the hook is disabled, and the error is kept in `runtime.errors`
// (headless playtests report them to the Studio agent).

export const MOD_API_VERSION = 1;

/** Hook names a module can subscribe to with api.on(name, fn). */
export const MOD_HOOKS = Object.freeze({
  stageStart: '(game, stage) 关卡开始或重开时',
  step: '(game) 每帧一次（1/60 秒），在敌人更新之前',
  kill: '(enemy, game) 任意敌人被消灭时（包括原版敌人）',
  playerAttack: '(player, game) 玩家每次开火或近战挥击时',
  playerHurt: '(player, hit, game) 玩家受击扣血或阵亡时',
  useItem: '(player, itemKind, game) 玩家使用特殊道具时（返回 true 可接管该道具效果）',
  drawWorld: '(ctx, game) 世界坐标绘制层（随镜头平移，可画分身、法阵、护体特效）',
  drawScreen: '(ctx, game) 每帧画面最上层，屏幕坐标 384×216，可用来画额外的 HUD',
});

/** Enemy type ids used by the stock game (G.en[].t); module enemies may not reuse them. */
export const STOCK_ENEMY_TYPES = Object.freeze(['run', 'sold', 'snp', 'tur', 'box', 'cart', 'larva', 'sac', 'mine', 'jelly', 'msub', 'fish', 'valve', 'beam', 'eel', 'diver', 'boat', 'rock', 'mor', 'fly',
  'artillery', 'grenadier', 'heavyGunner', 'waterAmbush', 'fortressSaucer', 'hiveHatchling', 'ceilingStalker', 'ceilingParasite', 'whiteFloater', 'guardianFlyer', 'spikeWall', 'alienHead']);

/** Stage numbers whose renderer draws G.en through the shared enemy hook. */
export const MOD_STAGES = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);

const TYPE_PATTERN = /^[a-z][A-Za-z0-9]{1,23}$/;
const MAX_ERRORS = 20;

/**
 * Normalise an enemy definition, filling defaults. Throws (in Chinese) on bad input.
 * @returns {object} frozen definition
 */
export function normalizeEnemyDef(type, def, reserved = [], items = null) {
  if (typeof type !== 'string' || !TYPE_PATTERN.test(type)) throw new Error(`敌人类型 "${type}" 不合法：用小写字母开头的英文/数字，2~24 个字符`);
  if (reserved.includes(type)) throw new Error(`敌人类型 "${type}" 与原版敌人重名`);
  if (!def || typeof def !== 'object') throw new Error(`敌人 ${type}: 需要一个定义对象`);
  const num = (value, fallback, min, max, label) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`敌人 ${type}: ${label} 需要 ${min}~${max} 的数字`);
    return value;
  };
  for (const key of ['update', 'draw', 'init', 'onKill', 'onHit']) {
    if (def[key] !== undefined && typeof def[key] !== 'function') throw new Error(`敌人 ${type}: ${key} 需要是函数`);
  }
  const box = def.box || {};
  if (box.anchor !== undefined && !['center', 'feet'].includes(box.anchor)) throw new Error(`敌人 ${type}: box.anchor 只能是 center 或 feet`);
  if (def.drop != null && items && !items.includes(def.drop)) throw new Error(`敌人 ${type}: drop "${def.drop}" 不是已知道具字母`);
  const spawn = def.spawn ? normalizeSpawn(type, def.spawn) : null;
  return Object.freeze({
    type,
    name: typeof def.name === 'string' ? def.name.slice(0, 20) : type,
    hp: Math.ceil(num(def.hp, 1, 1, 9999, 'hp')),
    score: Math.round(num(def.score, 100, 0, 1000000, 'score')),
    box: Object.freeze({ w: num(box.w, 16, 2, 200, 'box.w'), h: num(box.h, 16, 2, 200, 'box.h'), anchor: box.anchor || 'center' }),
    contact: def.contact !== false,
    drop: def.drop ?? null,
    boom: num(def.boom, 8, 0, 40, 'boom'),
    color: typeof def.color === 'string' ? def.color : '#e04848',
    keepOffscreen: def.keepOffscreen === true,
    spawn,
    init: def.init || null, update: def.update || null, draw: def.draw || null, onKill: def.onKill || null, onHit: def.onHit || null,
  });
}

function normalizeSpawn(type, spawn) {
  const bad = message => { throw new Error(`敌人 ${type}: spawn.${message}`); };
  const stages = spawn.stages ?? [...MOD_STAGES];
  if (!Array.isArray(stages) || !stages.length || stages.some(s => !MOD_STAGES.includes(s))) bad(`stages 只能从 ${MOD_STAGES.join('/')} 里选`);
  const every = spawn.every ?? [4, 8];
  if (!Array.isArray(every) || every.length !== 2 || !(every[0] >= 0.3) || !(every[1] >= every[0]) || every[1] > 120) bad('every 需要 [最短秒数, 最长秒数]，0.3~120');
  const max = spawn.max ?? 2;
  if (!Number.isInteger(max) || max < 1 || max > 12) bad('max 需要 1~12 的整数');
  const from = spawn.from ?? 'right';
  if (!['right', 'left', 'both'].includes(from)) bad('from 只能是 right/left/both');
  const height = spawn.height ?? 'sky';
  if (!(height === 'sky' || height === 'ground' || (typeof height === 'number' && height >= 0 && height <= 216))) bad('height 只能是 sky、ground 或屏幕内的 y（0~216）');
  const after = spawn.after ?? 0, before = spawn.before ?? Infinity;
  if (typeof after !== 'number' || typeof before !== 'number' || after < 0 || before <= after) bad('after/before 需要 0 ≤ after < before 的关卡 x 坐标');
  return Object.freeze({ stages: Object.freeze([...stages]), every: Object.freeze([...every]), max, from, height, after, before, firstDelay: typeof spawn.firstDelay === 'number' ? Math.max(0, spawn.firstDelay) : null });
}

/**
 * Run each module's setup and collect what it registered.
 * @param {Array<Function|{default: Function}>} modules setup functions or module namespaces
 * @param {{ reserved?: string[], items?: string[], imageFactory?: () => any, assetBase?: string }} [options]
 */
export function createModRuntime(modules = [], { reserved = [], items = null, imageFactory = null, assetBase = '' } = {}) {
  const enemies = new Map(), hooks = Object.fromEntries(Object.keys(MOD_HOOKS).map(name => [name, []]));
  const errors = [], images = new Map();
  const record = (where, err) => {
    if (errors.length >= MAX_ERRORS) return;
    errors.push({ where, message: String(err?.message || err).slice(0, 400), stack: String(err?.stack || '').split('\n').slice(0, 4).join('\n') });
  };
  const api = Object.freeze({
    version: MOD_API_VERSION,
    defineEnemy(type, def) {
      if (enemies.has(type)) throw new Error(`敌人类型 "${type}" 重复定义`);
      enemies.set(type, normalizeEnemyDef(type, def, reserved, items));
    },
    on(name, fn) {
      if (!hooks[name]) throw new Error(`未知钩子 "${name}"，可用：${Object.keys(MOD_HOOKS).join('、')}`);
      if (typeof fn !== 'function') throw new Error(`钩子 ${name} 需要函数`);
      hooks[name].push({ fn, broken: false });
    },
    /** Load an image from the project's assets/ folder (returns immediately; draw once `complete`). */
    image(name) {
      if (typeof name !== 'string' || !/^[\w.-]{1,80}$/.test(name)) throw new Error(`图片名 "${name}" 不合法`);
      if (!images.has(name)) {
        const img = imageFactory ? imageFactory() : null;
        if (img) img.src = `${assetBase}/${encodeURIComponent(name)}`;
        images.set(name, img);
      }
      return images.get(name);
    },
  });
  modules.forEach((mod, i) => {
    const setup = typeof mod === 'function' ? mod : mod?.default;
    const label = mod?.__file || `模块 ${i + 1}`;
    if (typeof setup !== 'function') return record(label, new Error('模块需要 export default function setup(api) { ... }'));
    try { setup(api); } catch (err) { record(label, err); }
  });
  const active = enemies.size > 0 || Object.values(hooks).some(list => list.length > 0);
  return {
    active, api, enemies, hooks, errors, record,
    spawners: [...enemies.values()].filter(def => def.spawn),
    /** Call every subscriber of a hook; a throwing subscriber is disabled. Returns true if any subscriber returned true. */
    emit(name, ...args) {
      let handled = false;
      for (const hook of hooks[name] || []) {
        if (hook.broken) continue;
        try { if (hook.fn(...args) === true) handled = true; } catch (err) { hook.broken = true; record(`钩子 ${name}`, err); }
      }
      return handled;
    },
    /** Run an enemy callback; on error, record it and remove the enemy. */
    call(def, key, e, ...args) {
      const fn = def[key];
      if (!fn) return undefined;
      try { return fn(e, ...args); } catch (err) { record(`${def.type}.${key}`, err); if (e && typeof e === 'object') e.dead = true; return undefined; }
    },
  };
}

/** Draw a sprite with optional horizontal flip; falls back to a box until the image has loaded. */
export function drawModSprite(g, img, x, y, w, h, { flip = false, frame = 0, frames = 1, fallback = '#e04848' } = {}) {
  if (img && img.complete && img.naturalWidth) {
    const fw = img.naturalWidth / frames, sx = (Math.floor(frame) % frames) * fw;
    g.save();
    if (flip) { g.translate(x + w / 2, 0); g.scale(-1, 1); g.translate(-(x + w / 2), 0); }
    g.drawImage(img, sx, 0, fw, img.naturalHeight, x, y, w, h);
    g.restore();
    return true;
  }
  g.fillStyle = fallback; g.fillRect(x, y, w, h);
  return false;
}
