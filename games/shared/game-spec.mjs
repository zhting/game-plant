// GameSpec: the data layer of a game project ("轨道 A" in docs/ROADMAP.md).
//
// A project's game.json only stores what differs from the template. The engine
// calls resolveGameSpec(overrides) once at boot and reads every extracted value
// from the result, so these defaults are the single source of truth: change a
// value here and the stock game changes. Golden replays (sim/golden) guard the
// defaults; refactors must keep them identical to the old engine literals.
//
// The schema below also feeds the Studio agent (spec_get / spec_patch) and the
// visual editor, so every field carries a short Chinese description.

export const GAME_SPEC_VERSION = 1;

const pod = (at, kind, y0) => ({ at, kind, y0 });

/** Contra template defaults. Never mutate; resolveGameSpec returns a deep copy. */
export const CONTRA_SPEC_DEFAULTS = deepFreeze({
  specVersion: GAME_SPEC_VERSION,
  template: 'contra',
  player: {
    physics: { gravity: 700, runSpeed: 90, jumpVelocity: 280, airJumpVelocity: 250, maxFallSpeed: 360 },
    lives: { normal: 3, easy: 5 },
    extraLife: { first: 20000, every: 70000 },
  },
  weapons: {
    rifle:   { name: '步枪', cd: 0.24, max: 4, per: 1, spd: 270 },
    machine: { name: '连发机枪', cd: 0.09, max: 7, per: 1, spd: 290 },
    spread:  { name: '扇形散弹', cd: 0.30, max: 15, per: 5, spd: 260 },
    laser:   { name: '贯穿光束', cd: 0.28, max: 1, per: 1, spd: 380 },
    fire:    { name: '螺旋火焰', cd: 0.28, max: 4, per: 1, spd: 170 },
    homing:  { name: '跟踪导弹', cd: 0.32, max: 4, per: 1, spd: 150 },
  },
  items: { specialCooldown: 2, inventorySize: 3, shieldSeconds: 10 },
  enemies: { hpScale: 1, spawnRateScale: 1, types: {} },
  bosses: { hpScale: 1 },
  scoring: { scale: 1 },
  stages: {
    order: [1, 2, 3, 4, 5, 6, 7, 8],
    1: {
      boxes: [[560, 'F'], [1660, 'H'], [2470, 'L'], [2880, 'g']],
      pods: [pod(160, 'M', 70), pod(520, 'g', 64), pod(980, 'S', 58), pod(1420, 'B', 64), pod(1700, 'u', 62), pod(1880, 'm', 66), pod(2040, 'R', 66), pod(700, 'c', 62), pod(2300, 'f', 60), pod(2780, 't', 60), pod(2560, 'h', 56), pod(2680, 'S', 58)],
    },
    5: {
      boxes: [[380, 'i'], [1650, 'v'], [2440, 'L'], [2720, 'S'], [3480, 'L'], [4330, 'S']],
      pods: [pod(120, 'M', 66), pod(460, 'i', 60), pod(900, 'S', 58), pod(1250, 'v', 62), pod(1600, 'g', 60), pod(1900, 'i', 56), pod(2000, 'H', 64), pod(2200, 'F', 60), pod(2450, 'v', 58), pod(2700, 'R', 64), pod(2860, 'f', 60), pod(3420, 'g', 60), pod(3980, 'v', 58), pod(4450, 'L', 64)],
    },
    6: {
      boxes: [[340, 'x'], [1180, 'w'], [1860, 'L'], [2700, 'S']],
      pods: [pod(120, 'M', 66), pod(500, 'x', 60), pod(900, 'S', 58), pod(1250, 'w', 62), pod(1550, 'g', 60), pod(1850, 'x', 56), pod(2000, 'H', 64), pod(2200, 'F', 60), pod(2450, 'w', 58), pod(2650, 'R', 64), pod(2850, 'B', 60)],
    },
    8: {
      boxes: [[340, 'p'], [1050, 'z'], [1880, 'L'], [2620, 'S']],
      pods: [pod(120, 'M', 66), pod(500, 'p', 60), pod(900, 'S', 58), pod(1250, 'z', 62), pod(1550, 'g', 60), pod(1850, 'p', 56), pod(2000, 'H', 64), pod(2200, 'F', 60), pod(2450, 'z', 58), pod(2700, 'R', 64), pod(2950, 'B', 60)],
    },
  },
});

/** Item letters accepted in pods / boxes. Upper case = weapon chips, lower case & others = special items. */
export const ITEM_KINDS = deepFreeze({
  M: '连发机枪', S: '扇形散弹', L: '贯穿光束', F: '螺旋火焰', H: '跟踪导弹', R: '速射芯片', B: '护盾 10 秒',
  g: '手雷', f: '闪光弹', m: '摩托车', h: '直升机', u: '蘑菇', c: '迷彩披风（第1关专属）', t: '炸药包（第1关专属）',
  e: '电磁脉冲（第2关专属）', d: '防爆盾（第2关专属）', k: '攀岩钩爪（第3关专属）', j: '防落石头盔（第3关专属）',
  o: '全息诱饵（第4关专属）', n: '磁暴扫雷器（第4关专属）', i: '防滑冰爪（第5关专属）', v: '热成像镜（第5关专属）',
  x: '防火服（第6关专属）', w: '液氮罐（第6关专属）', y: '磁力靴（第7关专属）', a: '护卫无人机（第7关专属）',
  p: '声波脉冲器（第8关专属）', z: '抗酸护甲（第8关专属）',
});

/** Common enemy type ids (the `t` field of entries in G.en). Other ids are accepted too. */
export const ENEMY_TYPES = deepFreeze({
  run: '冲锋步兵', sold: '步兵', snp: '狙击兵', tur: '炮台', box: '地面补给箱', cart: '矿车', larva: '异形幼虫', sac: '异形卵囊',
  mine: '水雷', jelly: '水母', msub: '迷你潜艇',
});

const num = (desc, min, max, extra = {}) => ({ type: 'number', desc, min, max, ...extra });
const weapon = name => ({
  type: 'object', desc: name, props: {
    name: { type: 'string', desc: '显示名称', maxLength: 12 },
    cd: num('射击间隔（秒），越小射速越快', 0.03, 2),
    max: num('同屏最多子弹数', 1, 40, { integer: true }),
    per: num('每次射出的子弹数', 1, 9, { integer: true }),
    spd: num('子弹速度（像素/秒）', 60, 800),
  },
});
const podList = {
  type: 'array', desc: '空中补给飞行器：玩家走到 at 位置时从屏幕外飞来，打掉后掉落 kind', maxItems: 40,
  items: { type: 'object', props: {
    at: num('触发位置（关卡 x 坐标）', 0, 20000), kind: { type: 'enum', desc: '掉落道具', values: Object.keys(ITEM_KINDS) }, y0: num('飞行高度 y', 20, 180),
  } },
};
const boxList = {
  type: 'array', desc: '地面补给箱：[x 坐标, 掉落道具]，开合循环，打开时才能击破', maxItems: 20,
  items: { type: 'tuple', items: [num('x 坐标', 0, 20000), { type: 'enum', desc: '掉落道具', values: Object.keys(ITEM_KINDS) }] },
};

/** Schema for overrides (and the resolved spec). Unknown keys are rejected so typos surface early. */
export const GAME_SPEC_SCHEMA = deepFreeze({
  type: 'object', props: {
    specVersion: num('GameSpec 版本', 1, GAME_SPEC_VERSION, { integer: true }),
    template: { type: 'enum', desc: '模板', values: ['contra'] },
    meta: { type: 'object', desc: '项目信息', props: {
      title: { type: 'string', desc: '游戏名称（显示在标题画面、开场、制作人员名单和浏览器标签）', maxLength: 20 },
      description: { type: 'string', desc: '简介', maxLength: 400 },
    } },
    player: { type: 'object', desc: '玩家', props: {
      physics: { type: 'object', desc: '物理参数（重力也作用于敌人和矿车）', props: {
        gravity: num('重力加速度（像素/秒²）', 100, 3000),
        runSpeed: num('奔跑速度（像素/秒）', 30, 300),
        jumpVelocity: num('起跳速度（像素/秒）', 100, 700),
        airJumpVelocity: num('二段跳速度（像素/秒）', 100, 700),
        maxFallSpeed: num('最大下落速度（像素/秒）', 100, 1200),
      } },
      lives: { type: 'object', desc: '初始命数（无限命设置开启时不生效）', props: {
        normal: num('普通难度', 1, 99, { integer: true }),
        easy: num('简单难度', 1, 99, { integer: true }),
      } },
      extraLife: { type: 'object', desc: '加命分数', props: {
        first: num('第一次奖命所需分数', 100, 10000000, { integer: true }),
        every: num('之后每多少分奖一条命', 100, 10000000, { integer: true }),
      } },
    } },
    weapons: { type: 'object', desc: '武器（M/S/L/F/H 道具切换到对应武器）', props: {
      rifle: weapon('步枪（初始武器）'), machine: weapon('连发机枪 M'), spread: weapon('扇形散弹 S'),
      laser: weapon('贯穿光束 L'), fire: weapon('螺旋火焰 F'), homing: weapon('跟踪导弹 H'),
    } },
    items: { type: 'object', desc: '特殊道具', props: {
      specialCooldown: num('使用特殊道具后的冷却（秒）', 0, 30),
      inventorySize: num('道具栏格数', 1, 6, { integer: true }),
      shieldSeconds: num('护盾道具 B 的持续时间（秒）', 1, 120),
    } },
    enemies: { type: 'object', desc: '敌人', props: {
      hpScale: num('全体普通敌人血量倍率（不含 Boss，向上取整，至少 1）', 0.1, 20),
      spawnRateScale: num('普通杂兵刷新频率倍率（越大刷得越密，默认 1）', 0.1, 5),
      types: { type: 'map', desc: '按敌人类型调整，键为类型 id：' + Object.entries(ENEMY_TYPES).map(([k, v]) => `${k}=${v}`).join('，'),
        key: /^[A-Za-z]{2,16}$/, value: { type: 'object', props: {
          hp: num('固定血量（优先于倍率）', 1, 9999, { integer: true }),
          hpScale: num('血量倍率（与全体倍率相乘）', 0.1, 20),
        } } },
    } },
    bosses: { type: 'object', desc: 'Boss（各关关底 Boss 及其可破坏部位）', props: {
      hpScale: num('全体 Boss 部位血量倍率（向上取整，至少 1）', 0.1, 20),
    } },
    scoring: { type: 'object', desc: '计分', props: { scale: num('得分倍率', 0, 100) } },
    stages: { type: 'map', desc: '按关卡调整，键为关卡号 1~8', key: /^[1-8]$/, props: {
      order: { type: 'array', desc: '关卡顺序与启用的关卡列表（1~8，不重复）', minItems: 1, maxItems: 8, unique: true, items: num('关卡号', 1, 8, { integer: true }) },
    }, value: { type: 'object', props: {
      name: { type: 'string', desc: '关卡名称（显示在关卡开场和选关菜单）', maxLength: 20 },
      pods: podList, boxes: boxList,
    } } },
  },
});

/**
 * Check an overrides object (or a resolved spec) against the schema.
 * @returns {string[]} human-readable errors (Chinese), empty when valid
 */
export function validateGameSpec(spec, schema = GAME_SPEC_SCHEMA) {
  const errors = [];
  check(spec, schema, '', errors);
  return errors;
}

function check(value, node, path, errors) {
  const at = path || '(根)';
  switch (node.type) {
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) return void errors.push(`${at}: 需要数字`);
      if (node.integer && !Number.isInteger(value)) errors.push(`${at}: 需要整数`);
      if (node.min !== undefined && value < node.min) errors.push(`${at}: 不能小于 ${node.min}`);
      if (node.max !== undefined && value > node.max) errors.push(`${at}: 不能大于 ${node.max}`);
      return;
    case 'string':
      if (typeof value !== 'string') return void errors.push(`${at}: 需要字符串`);
      if (node.maxLength && value.length > node.maxLength) errors.push(`${at}: 不能超过 ${node.maxLength} 个字符`);
      return;
    case 'enum':
      if (!node.values.includes(value)) errors.push(`${at}: 只能是 ${node.values.join('/')}`);
      return;
    case 'array':
      if (!Array.isArray(value)) return void errors.push(`${at}: 需要数组`);
      if (node.minItems && value.length < node.minItems) errors.push(`${at}: 至少 ${node.minItems} 项`);
      if (node.maxItems && value.length > node.maxItems) errors.push(`${at}: 最多 ${node.maxItems} 项`);
      if (node.unique && new Set(value).size !== value.length) errors.push(`${at}: 不能有重复项`);
      value.forEach((item, i) => check(item, node.items, `${path}[${i}]`, errors));
      return;
    case 'tuple':
      if (!Array.isArray(value) || value.length !== node.items.length) return void errors.push(`${at}: 需要 ${node.items.length} 项的数组`);
      value.forEach((item, i) => check(item, node.items[i], `${path}[${i}]`, errors));
      return;
    case 'map':
    case 'object':
      if (!value || typeof value !== 'object' || Array.isArray(value)) return void errors.push(`${at}: 需要对象`);
      for (const [key, child] of Object.entries(value)) {
        const sub = path ? `${path}.${key}` : key;
        if (node.type === 'map') {
          if (node.props && Object.hasOwn(node.props, key)) check(child, node.props[key], sub, errors);
          else if (!node.key.test(key)) errors.push(`${sub}: 不支持的键`);
          else check(child, node.value, sub, errors);
        } else if (!Object.hasOwn(node.props, key)) errors.push(`${sub}: 未知字段`);
        else check(child, node.props[key], sub, errors);
      }
      return;
    default:
      throw new Error(`game-spec schema: unknown node type ${node.type}`);
  }
}

/**
 * Merge project overrides over the template defaults. Objects merge key by key;
 * arrays and scalars replace. Throws when the overrides are invalid so a broken
 * game.json never boots silently with half-applied values.
 */
export function resolveGameSpec(overrides, defaults = CONTRA_SPEC_DEFAULTS) {
  if (overrides == null) return clone(defaults);
  const errors = validateGameSpec(overrides);
  if (errors.length) throw new Error('game.json 校验失败：\n' + errors.join('\n'));
  return merge(clone(defaults), overrides);
}

/** Apply a JSON merge patch (RFC 7386: null deletes) to an overrides object; returns a new object. */
export function patchGameSpec(overrides, patch) {
  const out = clone(overrides || {});
  mergePatch(out, patch);
  return out;
}

function mergePatch(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete target[key];
    else if (isPlain(value) && isPlain(target[key])) mergePatch(target[key], value);
    else target[key] = clone(value);
  }
}

function merge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (isPlain(value) && isPlain(target[key])) merge(target[key], value);
    else target[key] = clone(value);
  }
  return target;
}

const isPlain = value => !!value && typeof value === 'object' && !Array.isArray(value);
function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
function deepFreeze(value) {
  if (value && typeof value === 'object' && !(value instanceof RegExp)) { Object.freeze(value); for (const child of Object.values(value)) deepFreeze(child); }
  return value;
}
