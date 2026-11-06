// Prompt section that teaches the Studio agent the project module API
// (games/shared/mod-runtime.mjs + MOD_GAME in arcade-engine.mjs). Keep it in sync
// with those files; sim/test/mod-runtime.test.mjs runs the example below.

export const EXAMPLE_MODULE = `export default function setup(api) {
  api.defineEnemy('diveBird', {
    name: '俯冲怪鸟', hp: 2, score: 300, drop: 'S',
    box: { w: 18, h: 12 },
    spawn: { stages: [1], every: [3, 6], max: 2, height: 'sky' },
    init(e) { e.vx = -60; e.mode = 'glide'; },
    update(e, game) {
      const p = game.target(e.x);
      e.x += e.vx * game.dt;
      if (e.mode === 'glide' && p && Math.abs(p.x - e.x) < 70) { e.mode = 'dive'; e.vy = 170; game.sound('toss'); }
      if (e.mode === 'dive') { e.y += e.vy * game.dt; if (e.y > game.camera.y + 160) e.mode = 'climb'; }
      if (e.mode === 'climb') { e.y -= 100 * game.dt; if (e.y < game.camera.y + 40) e.mode = 'glide'; }
      e.face = e.vx < 0 ? -1 : 1;
    },
    draw(g, e, game) {
      const flap = Math.sin(e.age * 18) * 4;
      g.fillStyle = e.flash > 0 ? '#ffffff' : '#8a2be2';
      g.fillRect(e.x - 6, e.y - 4, 12, 8);                  // body
      g.fillRect(e.x - 10, e.y - 4 - flap, 6, 3);           // wings
      g.fillRect(e.x + 4, e.y - 4 - flap, 6, 3);
      g.fillStyle = '#ffd040'; g.fillRect(e.x + e.face * 7, e.y - 1, 3, 2); // beak
    },
  });
}`;

export function moduleGuide(stockTypes = []) {
  return [
    '## 代码模块（轨道 B）',
    '需要 game.json 做不到的东西（新敌人、新行为、新规则、额外 HUD）时，写项目自己的 modules/<名字>.mjs，用 code_write 提交。',
    '规则：',
    '- 单个自包含文件，不能 import / require / fetch；必须 `export default function setup(api) { ... }`。',
    '- 随机数只用 game.rnd()（不要用 Math.random），保证试玩可复现。不要写死循环；每帧的工作要很轻。',
    '- 画面 384×216 像素风；玩家高约 26px，站立时 y 是脚底；普通敌人 12~32px。',
    '',
    '### api',
    '- api.defineEnemy(type, def)：type 小写字母开头的英文/数字（2~24 字符），不能和原版敌人重名' + (stockTypes.length ? `（${stockTypes.join(', ')}）` : '') + '。',
    '  def：name 中文名；hp 1~9999；score 得分；box {w, h, anchor: "center"|"feet"}（e.x/e.y 是碰撞框中心，feet 时是脚底中心）；',
    '  contact 默认 true（碰到玩家会让玩家死亡，false 则无害）；drop 被消灭时掉落的道具字母；boom 爆炸大小 0~40；color 没写 draw 时画方块的颜色；',
    '  spawn {stages: 从 [1,2,3,4,5,6,7,8] 里选, every: [最短秒, 最长秒], max: 同屏上限, from: "right"|"left"|"both", height: "sky"|"ground"|屏幕内 y, after/before: 关卡 x 范围, firstDelay: 首次出现前的秒数}；',
    '  不写 spawn 的敌人只能由 game.spawn(type, props) 生成（例如由别的敌人或钩子召唤）。',
    '  回调：init(e, game) 生成时；update(e, game) 每帧（1/60 秒）；draw(g, e, game) 用 Canvas 2D 在世界坐标里画；onHit(e, game, dmg)；onKill(e, game)。',
    '- api.on(hook, fn)：stageStart(game, stage)、step(game) 每帧、kill(enemy, game) 任何敌人被消灭（含原版）、drawScreen(ctx, game) 屏幕坐标的最上层。',
    '- api.image(name) / game.image(name)：读取项目 assets/ 里的图片（PNG，可以用 image_gen 生成），配合 game.sprite(g, img, 左上x, 左上y, 宽, 高, {flip, frame, frames}) 画出来；生成的图朝左，e.face > 0 时 flip: true；多帧图横向排列，frame 可以用 e.age * 10 循环。图片没加载完（以及无头试玩里）sprite 会先画 fallback 颜色的方块。',
    '',
    '### 敌人对象 e',
    't 类型, x, y, vx, vy, hp, face(-1 朝左/1 朝右), age(存活秒数), flash(>0 表示刚被打中，通常画成白色)，可以随意加自己的字段。',
    '被打到 hp<=0 会自动击杀（加分、掉落、爆炸）；设置 e.dead = true 只是移除（不算击杀）。离开屏幕很远会自动移除。',
    '',
    '### game（回调的参数）',
    'dt, time, frame, stage, camera {x, y, w: 384, h: 216}, gravity；rnd()；target(x) 最近的活着的玩家 {x, y, dead} 或 null；players()；',
    'aim(x, y) 指向玩家的角度（弧度）；shoot(x, y, vx, vy, {gravity, r, sound}) 发射敌方子弹；spawn(type, props)；ground(x) 地面 y 或 null；',
    'land(e, halfWidth) 给 anchor: "feet" 的敌人施加重力并落地，返回是否着地；onScreen(x, margin)；boom(x, y, size)；',
    'sound(name)：eshot/boom/hit/pick/big/jump/toss/flash/mount；score(n)；banner(text, 秒)；shake(n)；drop(x, y, 道具字母)；kill(e)；image(name)；sprite(g, img, x, y, w, h, {flip, frame, frames, fallback})。',
    '',
    '### 示例：会俯冲的怪鸟',
    '```js',
    EXAMPLE_MODULE,
    '```',
  ].join('\n');
}
