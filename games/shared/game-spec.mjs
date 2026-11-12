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
    rifle:   { name: '步枪', cd: 0.24, max: 4, per: 1, spd: 270, damageScale: 1, gravity: 0, pierce: 0, color: '', size: 0 },
    machine: { name: '连发机枪', cd: 0.09, max: 7, per: 1, spd: 290, damageScale: 1, gravity: 0, pierce: 0, color: '', size: 0 },
    spread:  { name: '扇形散弹', cd: 0.30, max: 15, per: 5, spd: 260, damageScale: 1, gravity: 0, pierce: 0, color: '', size: 0 },
    laser:   { name: '贯穿光束', cd: 0.28, max: 1, per: 1, spd: 380, damageScale: 1, gravity: 0, pierce: 0, color: '', size: 0 },
    fire:    { name: '螺旋火焰', cd: 0.28, max: 4, per: 1, spd: 170, damageScale: 1, gravity: 0, pierce: 0, color: '', size: 0 },
    homing:  { name: '跟踪导弹', cd: 0.32, max: 4, per: 1, spd: 150, damageScale: 1, gravity: 0, pierce: 0, color: '', size: 0 },
  },
  items: { specialCooldown: 2, inventorySize: 3, shieldSeconds: 10 },
  enemies: { hpScale: 1, spawnRateScale: 1, types: {} },
  bosses: { hpScale: 1, hue: 0, saturate: 1 },
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
  skins: { player: {}, player2: {}, enemies: {} },
  audio: { stages: {} },
  rules: {
    health: { maxHp: 1, hitDamage: 12, invincibleSeconds: 1.1, killHeal: 0, killHealEvery: 4 },
    rage: { enabled: 0, max: 100, onHit: 50, onKill: 10, ultimateDamage: 18, ultimateName: '万道金光' },
    melee: { enabled: 0, range: 38, damage: 3, reflectBullets: 0, color: '#ffd24a' },
  },
  story: { openingTitle: '', openingSubtitle: '', opening: [], endingTitle: '', endingSubtitle: '', ending: [] },
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
    name: { type: 'string', desc: '显示名称（同步更新拾取横幅与顶部 HUD）', maxLength: 12 },
    cd: num('射击间隔（秒），越小射速越快', 0.03, 2),
    max: num('同屏最多子弹数', 1, 40, { integer: true }),
    per: num('每次射出的子弹数', 1, 9, { integer: true }),
    spd: num('子弹速度（像素/秒）', 60, 800),
    damageScale: num('伤害倍率（1 为原版伤害，2 为双倍伤害）', 0.25, 20),
    gravity: num('弹道重力（0=直线，正数如 360 为抛物线飞斧/榴弹，负数上飘）', -600, 1200),
    pierce: num('是否穿透敌人（0=命中消失，1=贯穿路径上所有敌人）', 0, 1, { integer: true }),
    color: { type: 'string', desc: '自定义弹丸发光颜色（如 #00f5d4，留空使用原版弹丸样式）', maxLength: 24 },
    size: num('自定义弹丸半径像素（0=原版尺寸，建议 2~8）', 0, 16),
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
const spawnList = {
  type: 'array', desc: '关卡定点刷怪波次：玩家推进到 at 坐标时生成指定敌人（支持原版与模块自定义敌人）', maxItems: 60,
  items: { type: 'object', props: {
    at: num('触发位置（关卡 x 坐标）', 40, 20000),
    type: { type: 'string', desc: '敌人类型 ID（如 run/snp/tur/larva 或模块自定义敌人名）', maxLength: 24 },
    count: num('一次刷出数量', 1, 8, { integer: true }),
    y: num('生成高度 y（0=自动贴地面，>0 为空中指定高度）', 0, 200),
  } },
};
const storyPages = desc => ({
  type: 'array', desc, maxItems: 6,
  items: { type: 'object', props: {
    tag: { type: 'string', desc: '章节小标题（如 壹 · 灵猴出世）', maxLength: 20 },
    line1: { type: 'string', desc: '第一行字幕', maxLength: 36 },
    line2: { type: 'string', desc: '第二行字幕', maxLength: 36 },
  } },
});
const skinRule = desc => ({
  type: 'object', desc, props: {
    sprite: { type: 'string', desc: '项目 assets/ 下的图片文件名（如 hero.png），留空则使用原版模型', maxLength: 80 },
    frames: num('水平切帧数量（动画帧数）', 1, 16, { integer: true }),
    fps: num('动画播放帧率（帧/秒）', 1, 30),
    width: num('游戏内显示宽度（像素）', 6, 160),
    height: num('游戏内显示高度（像素）', 6, 160),
    anchor: { type: 'enum', desc: '对齐锚点（feet=脚底居中，center=中心）', values: ['feet', 'center'] },
    offsetX: num('水平像素偏移', -80, 80),
    offsetY: num('垂直像素偏移', -80, 80),
    flip: num('图片默认朝向（0=默认朝右，1=默认朝左自动翻转）', 0, 1, { integer: true }),
    hue: num('色相旋转角度（-180~180 度，0 为原色）', -180, 180),
    saturate: num('饱和度倍率（0~4，1 为原色）', 0, 4),
    brightness: num('亮度倍率（0.2~3，1 为原色）', 0.2, 3),
  },
});

/** Schema for overrides (and the resolved spec). Unknown keys are rejected so typos surface early. */
export const GAME_SPEC_SCHEMA = deepFreeze({
  type: 'object', props: {
    specVersion: num('GameSpec 版本', 1, GAME_SPEC_VERSION, { integer: true }),
    template: { type: 'enum', desc: '模板', values: ['contra', 'wukong'] },
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
      hue: num('关底 Boss 色相偏移（-180~180 度，0 为原色）', -180, 180),
      saturate: num('关底 Boss 饱和度倍率（0~4，1 为原色）', 0, 4),
    } },
    scoring: { type: 'object', desc: '计分', props: { scale: num('得分倍率', 0, 100) } },
    stages: { type: 'map', desc: '按关卡调整，键为关卡号 1~8', key: /^[1-8]$/, props: {
      order: { type: 'array', desc: '关卡顺序与启用的关卡列表（1~8，不重复）', minItems: 1, maxItems: 8, unique: true, items: num('关卡号', 1, 8, { integer: true }) },
    }, value: { type: 'object', props: {
      name: { type: 'string', desc: '关卡名称（显示在关卡开场和选关菜单）', maxLength: 20 },
      pods: podList, boxes: boxList, spawns: spawnList,
      theme: { type: 'object', desc: '关卡视觉背景与色调覆盖（可替换横向视差背景图或调天色）', props: {
        bgImage: { type: 'string', desc: '自定义横向视差背景图（assets/ 下的图片名如 cyber-bg.png，留空使用原版背景）', maxLength: 80 },
        skyTint: { type: 'string', desc: '背景色调遮罩颜色（如 #ffd166 或 rgba(255,210,110,0.3)）', maxLength: 32 },
        tintAlpha: num('色调遮罩透明度（0~0.75，0 为关闭）', 0, 0.75),
        hue: num('背景色相偏移（-180~180 度，0 为原色）', -180, 180),
      } },
    } } },
    skins: { type: 'object', desc: '角色与敌人换皮（可替换为 assets/ 图片或调整色相/饱和度/亮度）', props: {
      player: skinRule('1P 主角外观'),
      player2: skinRule('2P 搭档外观（未填部分继承 1P）'),
      enemies: {
        type: 'map',
        desc: '按敌人类型换皮，键为 all（全体普通敌人）或类型 id：' + Object.entries(ENEMY_TYPES).map(([k, v]) => `${k}=${v}`).join('，'),
        key: /^[A-Za-z]{2,16}$/,
        value: skinRule('敌人外观覆盖'),
      },
    } },
    audio: { type: 'object', desc: '音乐与音频分配', props: {
      stages: {
        type: 'map',
        desc: '各关卡背景音乐（键为关卡号 1~8，值为内置曲目名或 assets/ 音频文件名如 bgm.ogg）',
        key: /^[1-8]$/,
        value: { type: 'string', desc: '内置曲目（stage1rock/stage1orchestral/stage1cyberpunk/stage2/stage3/stage5/wukong1 等）或 assets/ 音频文件名', maxLength: 80 },
      },
    } },
    rules: { type: 'object', desc: '高阶战斗规则（气血条、怒气大招、近战挥击）', props: {
      health: { type: 'object', desc: '气血生命条模式（maxHp > 1 时启用，受击扣血而非一击必死）', props: {
        maxHp: num('最大生命值（1=原版一击必死，>1 如 100 启用气血条）', 1, 9999, { integer: true }),
        hitDamage: num('每次受击扣除的生命值', 1, 9999, { integer: true }),
        invincibleSeconds: num('受击后短暂无敌时间（秒）', 0.1, 10),
        killHeal: num('累计击杀回血量（0 为关闭）', 0, 999, { integer: true }),
        killHealEvery: num('每击杀多少名敌人触发一次回血', 1, 100, { integer: true }),
      } },
      rage: { type: 'object', desc: '怒气槽与全屏大招（enabled=1 时启用，按 I 键在满怒气时释放大招）', props: {
        enabled: num('是否开启怒气大招（0=原版手雷冷却，1=开启怒气槽）', 0, 1, { integer: true }),
        max: num('怒气上限', 10, 1000, { integer: true }),
        onHit: num('受击增加的怒气值', 0, 1000, { integer: true }),
        onKill: num('击杀敌人增加的怒气值', 0, 1000, { integer: true }),
        ultimateDamage: num('满怒气按 I 释放全屏大招的伤害', 1, 999, { integer: true }),
        ultimateName: { type: 'string', desc: '大招名称（显示在释放横幅）', maxLength: 20 },
      } },
      melee: { type: 'object', desc: '近战挥击与消弹（enabled=1 时每次攻击附带前方近战弧光）', props: {
        enabled: num('是否开启近战挥击（0=关闭，1=开启）', 0, 1, { integer: true }),
        range: num('挥击半径（像素）', 12, 120),
        damage: num('近战命中伤害', 1, 999, { integer: true }),
        reflectBullets: num('是否震碎/反弹挥击范围内的敌方子弹（0=否，1=是）', 0, 1, { integer: true }),
        color: { type: 'string', desc: '挥击弧光颜色（如 #ffd24a）', maxLength: 24 },
      } },
    } },
    story: { type: 'object', desc: '剧情与开场/通关字幕', props: {
      openingTitle: { type: 'string', desc: '片头左上角地点/时代标题（如 花果山 · 齐天大圣）', maxLength: 24 },
      openingSubtitle: { type: 'string', desc: '片头右上角行动副标题（如 大闹天宫）', maxLength: 24 },
      opening: storyPages('开场剧情字幕页（1~6 页，非空时替换片头字幕）'),
      endingTitle: { type: 'string', desc: '通关片尾左上角标题（如 新纪元 · 2099 年）', maxLength: 24 },
      endingSubtitle: { type: 'string', desc: '通关片尾右上角副标题（如 传奇落幕）', maxLength: 24 },
      ending: storyPages('通关结局字幕页（1~6 页，非空时替换片尾字幕）'),
    } },
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
