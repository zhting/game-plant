// 人机练习用的电脑对手。
// 它和真人一样只能看到 game.viewFor(自己的座位)：对方棋子的兵种它看不到，
// 只能根据“动没动过、站在哪、碰子结果”来估计，然后按期望收益挑一步。
import * as R from '../shared/rules.js';

export const BOT_NAMES = ['人机 · 小参谋', '人机 · 老班长', '人机 · 阿福', '人机 · 铁蛋', '人机 · 豆豆'];

// 子力价值（司令阵亡会亮旗，所以额外加一点）
const VAL = { sl: 12, jz: 8, shz: 6, lvz: 4.6, tz: 3.6, yz: 2.9, lz: 2.3, pz: 1.8, gb: 2.8, zd: 6.5, dl: 2.2, jq: 200 };
const MOVABLE = ['sl', 'jz', 'shz', 'lvz', 'tz', 'yz', 'lz', 'pz', 'gb', 'zd', 'jq'];
// 各兵种向前推进的积极程度
const PUSH = { sl: 0.14, jz: 0.18, shz: 0.22, lvz: 0.25, tz: 0.27, yz: 0.3, lz: 0.3, pz: 0.3, gb: 0.06, zd: 0.12, jq: 0 };
const LOSS_AVERSION = 1.4;
const INFO_GAIN = 0.4;

const mirror = (lay) => Object.fromEntries(Object.entries(lay).map(([id, k]) => [id.slice(0, 2) + (6 - +id[2]), k]));
const row = (id) => +id[1];

/** 一份“像人摆的”随机布阵：旗在大本营，地雷护旗，大子在前面几排 */
export function smartLayout(rnd = Math.random) {
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const lay = {};
  const all = R.MY_IDS.filter((id) => R.typeOf(id) !== 'camp');
  const free = (f) => all.filter((id) => !lay[id] && (!f || f(id)));
  const flag = pick(['m62', 'm64']);
  lay[flag] = 'jq';
  const fc = +flag[2];
  const guards = ['m5' + fc, 'm6' + (fc - 1), 'm6' + (fc + 1)];
  if (rnd() < 0.6) guards.forEach((id) => { lay[id] = 'dl'; });
  else {
    const keep = guards.filter(() => rnd() < 0.7).slice(0, 2);
    keep.forEach((id) => { lay[id] = 'dl'; });
    while (Object.values(lay).filter((k) => k === 'dl').length < 3) lay[pick(free((id) => row(id) >= 5))] = 'dl';
  }
  for (let i = 0; i < 2; i++) lay[pick(free((id) => row(id) >= 2 && row(id) <= 5))] = 'zd';
  lay[pick(free((id) => row(id) <= 4))] = 'sl';
  lay[pick(free((id) => row(id) <= 4))] = 'jz';
  const pool = [];
  for (const k of ['shz', 'lvz', 'tz', 'yz', 'lz', 'pz', 'gb']) for (let i = 0; i < R.COUNTS[k]; i++) pool.push(k);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  free().forEach((id, i) => { lay[id] = pool[i]; });
  return lay;
}

export class Bot {
  /**
   * @param {import('./game.js').Game} game
   * @param {number} seat
   */
  constructor(game, seat, { rnd = Math.random, think = [700, 1600], deployDelay = [2500, 7000] } = {}) {
    this.game = game;
    this.seat = seat;
    this.rnd = rnd;
    this.think = think;
    this.deployDelay = deployDelay;
    this.stopped = false;
    this.deployAt = 0;
    this.turnKey = null;
    this.moveAt = 0;
    this.drawKey = null;
    this.drawAt = 0;
    this.offered = -1;
    this.offeredAt = 0;
    // 对方棋子的推断：pid → { gt: 已知战力下限, notMine, isGb }
    this.info = new Map();
    game.on('event', (ev) => this.onEvent(ev));
  }

  stop() { this.stopped = true; }

  between([a, b]) { return a + this.rnd() * (b - a); }

  onEvent(ev) {
    if (this.stopped || ev.type !== 'combat') return;
    // 只使用本方视角能得到的信息：我方兵种 + 碰子结果 + 双方棋子编号
    const c = this.game.combatFor(ev.entry, this.seat);
    const pid = c.role === 'attacker' ? ev.entry.dpid : ev.entry.apid;
    const inf = this.info.get(pid) || {};
    if (c.role === 'attacker' && c.res === 'lose') {
      // 普通棋子踩雷会同归于尽，因此存活的防守方一定不是地雷。
      inf.gt = Math.max(inf.gt || 0, R.POW[c.my]);
      inf.notMine = true;
    } else if (c.role === 'defender' && c.res === 'lose') {
      if (c.my === 'dl') inf.isGb = true;
      else if (R.POW[c.my]) inf.gt = Math.max(inf.gt || 0, R.POW[c.my]);
    }
    this.info.set(pid, inf);
  }

  tick(now) {
    const g = this.game;
    if (this.stopped || g.isOver()) return;
    if (g.phase === 'deploy') {
      if (g.ready[this.seat]) return;
      if (!this.deployAt) this.deployAt = Math.max(now, g.deployStart) + this.between(this.deployDelay);
      if (now >= this.deployAt) g.submitDeploy(this.seat, this.makeLayout());
      return;
    }
    if (g.phase !== 'battle') return;
    // 先回应求和
    if (g.drawOffer !== null && g.drawOffer !== this.seat) {
      const key = 'd' + g.moveNo;
      if (this.drawKey !== key) { this.drawKey = key; this.drawAt = now + this.between([1200, 2600]); }
      if (now >= this.drawAt) {
        const v = g.viewFor(this.seat);
        g.answerDraw(this.seat, this.wantsDraw(v));
      }
      return;
    }
    if (g.turn !== this.seat) return;
    // 自己刚发起求和：给对方几秒钟回应，再照常走棋
    if (g.drawOffer === this.seat && now - this.offeredAt < 9000 && g.turnDeadline - now > 4000) return;
    const key = g.moveNo + ':' + g.turnDeadline;
    if (this.turnKey !== key) { this.turnKey = key; this.moveAt = now + this.between(this.think); }
    if (now < this.moveAt) return;
    const view = g.viewFor(this.seat);
    if (view.canOfferDraw && view.noCapture >= 45 && this.offered < view.moveNo - 20 && this.wantsDraw(view)) {
      this.offered = view.moveNo;
      this.offeredAt = now;
      g.offerDraw(this.seat);
      return;
    }
    const mv = this.choose(view);
    if (mv) g.move(this.seat, mv.from, mv.to);
  }

  makeLayout() {
    let lay;
    if (this.rnd() < 0.45) {
      lay = { ...R.FORMS[Math.floor(this.rnd() * R.FORMS.length)].lay };
      if (this.rnd() < 0.5) lay = mirror(lay);
    } else lay = smartLayout(this.rnd);
    return R.validateLayout(lay).ok ? lay : R.defaultLayout();
  }

  wantsDraw(view) {
    const mine = view.pieces.filter((p) => p.side === 'm').length;
    const opp = view.pieces.length - mine;
    if (mine + 3 <= opp) return true;
    return view.noCapture >= 40 && Math.abs(mine - opp) <= 2;
  }

  /** 对方某枚棋子的兵种概率分布：[[兵种, 概率], ...] */
  dist(p, ctx) {
    if (p.k) return [[p.k, 1]];
    const inf = this.info.get(p.pid) || {};
    const home = R.flipId(p.at); // 这枚子在对方自己坐标里的位置
    const fixed = !p.moved;
    let pFlag = 0, pMine = 0;
    if (fixed && R.typeOf(home) === 'hq' && !inf.gt && !inf.isGb) pFlag = ctx.flagP;
    if (fixed && row(home) >= 5 && !inf.notMine && !inf.gt && !inf.isGb) {
      pMine = ctx.mineP;
      pMine = Math.min(0.85, pMine, 1 - pFlag);
    }
    const w = {};
    let tot = 0;
    for (const k of MOVABLE) {
      // 未移动的军旗由大本营概率单独估计；移动过的暗子仍可能是军旗。
      if (k === 'jq' && fixed) continue;
      let c = R.COUNTS[k];
      if (fixed && !R.validAt(k, home)) c = 0;
      if (inf.isGb && k !== 'gb') c = 0;
      if (inf.gt && !(R.POW[k] > inf.gt)) c = 0;
      if (c) { w[k] = c; tot += c; }
    }
    const rest = Math.max(0, 1 - pFlag - pMine);
    const out = [];
    if (pFlag) out.push(['jq', pFlag]);
    if (pMine) out.push(['dl', pMine]);
    if (tot) for (const k of Object.keys(w)) out.push([k, (rest * w[k]) / tot]);
    else if (rest) out.push(['sl', rest]);
    return out;
  }

  gain(m, d) {
    const r = R.fight(m, d);
    if (r === 'flag') return VAL.jq;
    if (r === 'win') return VAL[d];
    if (r === 'lose') return -VAL[m] * LOSS_AVERSION + INFO_GAIN;
    return VAL[d] - VAL[m] * (VAL[m] > VAL[d] ? LOSS_AVERSION : 1);
  }

  context(view) {
    const byAt = {};
    const occ = {};
    for (const p of view.pieces) { byAt[p.at] = p; occ[p.at] = { s: p.side, k: p.k }; }
    const opp = view.pieces.filter((p) => p.side === 'o');
    const flagShown = opp.some((p) => p.k === 'jq');
    const hq = opp.filter((p) => !p.moved && R.typeOf(R.flipId(p.at)) === 'hq' && !(this.info.get(p.pid) || {}).gt);
    const back = opp.filter((p) => !p.moved && row(R.flipId(p.at)) >= 5 && !(this.info.get(p.pid) || {}).notMine);
    const mineP = Math.min(0.75, 3 / Math.max(1, back.length - (flagShown ? 0 : 1)));
    // 我方军旗位置（用于防守）
    const myFlag = view.pieces.find((p) => p.side === 'm' && p.k === 'jq');
    return { byAt, occ, flagP: flagShown || !hq.length ? 0 : 1 / hq.length, mineP, myFlag: myFlag ? myFlag.at : null };
  }

  /** 与某格相邻、且已知比 k 大的对方棋子数量 / 未知的对方活动棋子数量 */
  threats(at, k, ctx, ignore) {
    let strong = 0, unknown = 0;
    for (const n of R.ROAD[at]) {
      const q = ctx.byAt[n];
      if (!q || q.side !== 'o' || n === ignore) continue;
      const inf = this.info.get(q.pid) || {};
      if (inf.gt && inf.gt >= R.POW[k] && R.POW[k] > 0) strong++;
      else if (q.moved || R.canMoveKind(q.k || 'x')) unknown++;
    }
    return { strong, unknown };
  }

  choose(view) {
    const ctx = this.context(view);
    const opts = [];
    const intruders = view.pieces.filter((p) => p.side === 'o' && p.at[0] === 'm' && row(p.at) >= 4);
    for (const p of view.pieces) {
      if (p.side !== 'm') continue;
      const lg = R.legal(ctx.occ, p.at);
      for (const to of lg.attacks) opts.push({ from: p.at, to, score: this.attackScore(p, ctx.byAt[to], ctx) });
      for (const to of lg.moves) opts.push({ from: p.at, to, score: this.moveScore(p, to, ctx, intruders) });
    }
    if (!opts.length) return null;
    for (const o of opts) o.score += this.rnd() * 0.45;
    opts.sort((a, b) => b.score - a.score);
    return opts[0];
  }

  attackScore(p, target, ctx) {
    let ev = 0;
    for (const [d, pr] of this.dist(target, ctx)) ev += pr * this.gain(p.k, d);
    // 敌子已经杀进我方后方：清除它更重要
    if (target.at[0] === 'm' && row(target.at) >= 4) ev += 1.5;
    if (ctx.myFlag && R.ROAD[ctx.myFlag].includes(target.at)) ev += 3;
    return ev;
  }

  moveScore(p, to, ctx, intruders) {
    const k = p.k;
    const v = VAL[k] || 1;
    const y0 = R.world(p.at).Y, y1 = R.world(to).Y;
    let s = Math.max(-1.5, Math.min(3, y0 - y1)) * (PUSH[k] ?? 0.2);
    const here = this.threats(p.at, k, ctx);
    const there = this.threats(to, k, ctx, p.at);
    const safe = R.typeOf(to) === 'camp';
    if (here.strong) s += 0.5 * v * here.strong;         // 躲开已知的大子
    if (!safe) {
      s -= 0.5 * v * there.strong;
      s -= 0.06 * v * there.unknown;
    } else if (here.unknown || here.strong) s += 0.25;
    // 工兵早期留在后面，后期去挖雷
    if (k === 'gb' && to[0] === 'o' && row(to) >= 5) s += 0.4;
    // 守住军旗附近
    if (ctx.myFlag && p.at[0] === 'm' && row(p.at) >= 5 && R.ROAD[ctx.myFlag].includes(p.at)) s -= 0.3;
    // 有敌子闯进后方，就往那边靠
    for (const q of intruders) {
      const d0 = Math.abs(y0 - R.world(q.at).Y) + Math.abs(R.world(p.at).X - R.world(q.at).X);
      const d1 = Math.abs(y1 - R.world(q.at).Y) + Math.abs(R.world(to).X - R.world(q.at).X);
      if (R.POW[k] >= R.POW.lvz) s += 0.3 * (d0 - d1);
    }
    return s;
  }
}
