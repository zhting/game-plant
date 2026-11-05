// 一局两国暗棋的权威状态机。所有规则判定都在这里完成，
// 对方棋子的兵种只存在服务端，发给客户端的视图里不会出现（亮旗和终局复盘除外）。
import crypto from 'node:crypto';
import * as R from '../shared/rules.js';
import { reasonText } from '../shared/rules.js';

export { reasonText };

export const TIMING = {
  foundMs: 3500,        // 匹配成功后展示对阵画面的时间
  deployMs: 90000,      // 布阵时间
  turnMs: 30000,        // 每步时间
  maxTimeouts: 3,       // 超时几次判负
  noCaptureLimit: 60,   // 连续多少步无吃子判和
  drawGap: 10           // 同一玩家两次求和至少间隔的手数
};

const other = (s) => 1 - s;
// 座位 0 的视角就是权威坐标；座位 1 的视角旋转 180°（flipId 是自身的逆运算）
const conv = (seat, id) => (seat === 0 ? id : R.flipId(id));
const fail = (error) => ({ ok: false, error });
const OK = { ok: true };
const newPid = () => crypto.randomBytes(4).toString('hex');

export class Game {
  /**
   * @param {object} o
   * @param {string} o.id
   * @param {'rank'|'casual'|'friend'|'bot'} o.mode
   * @param {Array<{id:string,name:string,pts:number,isBot?:boolean}>} o.players 下标即座位
   */
  constructor({ id, mode, players, now = Date.now, timing = {}, rnd = Math.random }) {
    this.id = id;
    this.mode = mode;
    this.players = players;
    this.now = now;
    this.rnd = rnd;
    this.T = { ...TIMING, ...timing };
    this.phase = 'deploy';
    this.createdAt = now();
    this.deployStart = this.createdAt + this.T.foundMs;
    this.deployDeadline = this.deployStart + this.T.deployMs;
    this.draft = [null, null];
    this.lay = [null, null];
    this.ready = [false, false];
    this.occ = null;
    this.turn = 0;
    this.turnDeadline = 0;
    this.timeouts = [0, 0];
    this.moveNo = 0;
    this.noCapture = 0;
    this.log = [];
    this.last = null;
    this.lost = [[], []];
    this.kills = [0, 0];
    this.drawOffer = null;
    this.lastOfferAt = [-999, -999];
    this.result = null;
    this.startedAt = 0;
    this.endedAt = 0;
    this.version = 0;
    this.lastAttack = null;
    this.listeners = { change: [], event: [], over: [] };
  }

  on(evt, fn) { this.listeners[evt].push(fn); return this; }
  emit(evt, ...args) { for (const fn of this.listeners[evt]) fn(...args); }
  changed() { this.version++; this.emit('change', this); }
  isOver() { return this.phase === 'over'; }

  // ---------------- 布阵 ----------------
  toCanonLayout(seat, lay) {
    const out = {};
    for (const id of Object.keys(lay)) out[conv(seat, id)] = lay[id];
    return out;
  }
  toViewLayout(seat, lay) {
    if (!lay) return null;
    const out = {};
    for (const id of Object.keys(lay)) out[conv(seat, id)] = lay[id];
    return out;
  }
  draftDeploy(seat, lay) {
    if (this.phase !== 'deploy' || this.ready[seat]) return fail('现在不能修改布阵');
    if (!R.validateLayout(lay).ok) return fail('布阵不合规则');
    this.draft[seat] = this.toCanonLayout(seat, lay);
    return OK;
  }
  submitDeploy(seat, lay) {
    if (this.phase !== 'deploy') return fail('现在不是布阵阶段');
    if (this.ready[seat]) return fail('你已经布阵完成');
    const v = R.validateLayout(lay);
    if (!v.ok) return fail(v.error);
    this.lay[seat] = this.toCanonLayout(seat, lay);
    this.ready[seat] = true;
    if (this.ready[0] && this.ready[1]) this.startBattle();
    else this.changed();
    return OK;
  }
  startBattle() {
    // 按棋盘位置顺序建表：不能沿用玩家提交布阵时的键顺序，否则顺序本身会泄露兵种
    this.occ = {};
    for (const id of R.IDS) {
      for (const seat of [0, 1]) {
        const k = this.lay[seat][id];
        if (k) this.occ[id] = { s: seat, k, pid: newPid(), moved: false, rv: false };
      }
    }
    this.phase = 'battle';
    this.turn = this.rnd() < 0.5 ? 0 : 1;
    this.startedAt = this.now();
    this.turnDeadline = this.startedAt + this.T.turnMs;
    this.pushLog({ kind: 'start', seat: this.turn });
    if (!this.checkNoMoves()) this.changed();
  }

  // ---------------- 走子 ----------------
  move(seat, fromV, toV) {
    if (this.phase !== 'battle') return fail('对局不在进行中');
    if (this.turn !== seat) return fail('还没轮到你');
    if (!R.isId(fromV) || !R.isId(toV)) return fail('位置无效');
    const from = conv(seat, fromV), to = conv(seat, toV);
    const p = this.occ[from];
    if (!p || p.s !== seat) return fail('那不是你的棋子');
    const lg = R.legal(this.occ, from);
    const attack = lg.attacks.includes(to);
    if (!attack && !lg.moves.includes(to)) return fail('这步不合规则');
    const path = lg.paths[to] || [from, to];
    const d = this.occ[to];
    delete this.occ[from];
    p.moved = true;
    this.moveNo++;
    this.drawOffer = null;
    let entry;
    if (!d) {
      this.occ[to] = p;
      this.noCapture++;
      entry = { kind: 'move', seat, k: p.k, pid: p.pid, from, to, path };
    } else {
      const res = R.fight(p.k, d.k);
      this.noCapture = 0;
      entry = { kind: 'attack', seat, ak: p.k, dk: d.k, apid: p.pid, dpid: d.pid, from, to, path, res, slDead: [] };
      if (res === 'flag' || res === 'win') {
        this.occ[to] = p;
        this.lost[d.s].push(d.k);
        if (res === 'win') this.kills[seat]++;
      } else if (res === 'lose') {
        this.lost[seat].push(p.k);
        this.kills[d.s]++;
      } else {
        delete this.occ[to];
        this.lost[seat].push(p.k);
        this.lost[d.s].push(d.k);
        this.kills[seat]++;
        this.kills[d.s]++;
      }
      if (d.k === 'sl' && (res === 'win' || res === 'both')) entry.slDead.push(d.s);
      if (p.k === 'sl' && (res === 'lose' || res === 'both')) entry.slDead.push(seat);
      this.lastAttack = entry;
    }
    this.last = { seat, from, to, path };
    this.pushLog(entry);
    for (const s of entry.slDead || []) this.revealFlag(s);
    if (entry.kind === 'attack') this.emit('event', { type: 'combat', entry });
    if (entry.res === 'flag') { this.finish(seat, 'flag'); return OK; }
    if (entry.ak === 'jq' && (entry.res === 'lose' || entry.res === 'both')) {
      this.finish(other(seat), 'flag');
      return OK;
    }
    if (this.noCapture >= this.T.noCaptureLimit) { this.finish(null, 'nocapture'); return OK; }
    this.passTurn();
    return OK;
  }
  revealFlag(s) {
    for (const q of Object.values(this.occ)) if (q.s === s && q.k === 'jq') q.rv = true;
    this.pushLog({ kind: 'reveal', seat: s });
  }
  passTurn() {
    this.turn = other(this.turn);
    this.turnDeadline = this.now() + this.T.turnMs;
    if (!this.checkNoMoves()) this.changed();
  }
  /** 轮到的一方无子可走则判负；双方都无子可走判和。返回是否已结束 */
  checkNoMoves() {
    const t = this.turn;
    if (R.hasAnyMove(this.occ, t)) return false;
    if (!R.hasAnyMove(this.occ, other(t))) this.finish(null, 'nomoves');
    else this.finish(other(t), 'nomoves');
    return true;
  }

  // ---------------- 求和 / 认输 ----------------
  resign(seat, reason = 'resign') {
    if (this.phase === 'over') return fail('对局已经结束');
    this.finish(other(seat), reason === 'leave' ? 'leave' : 'resign');
    return OK;
  }
  offerDraw(seat) {
    if (this.phase !== 'battle') return fail('对局不在进行中');
    if (this.drawOffer !== null) return fail('已有一个求和等待回应');
    if (this.moveNo - this.lastOfferAt[seat] < this.T.drawGap) return fail('每 ' + this.T.drawGap + ' 手只能求和一次');
    this.drawOffer = seat;
    this.lastOfferAt[seat] = this.moveNo;
    this.pushLog({ kind: 'draw_offer', seat });
    this.emit('event', { type: 'draw_offer', seat });
    this.changed();
    return OK;
  }
  answerDraw(seat, accept) {
    if (this.phase !== 'battle' || this.drawOffer === null || this.drawOffer === seat) return fail('没有需要你回应的求和');
    if (accept) { this.finish(null, 'agreed'); return OK; }
    this.drawOffer = null;
    this.pushLog({ kind: 'draw_decline', seat });
    this.emit('event', { type: 'draw_declined', seat });
    this.changed();
    return OK;
  }

  // ---------------- 计时 ----------------
  tick() {
    const now = this.now();
    if (this.phase === 'deploy' && now >= this.deployDeadline) {
      for (const s of [0, 1]) {
        if (this.ready[s]) continue;
        this.lay[s] = this.draft[s] || this.toCanonLayout(s, R.defaultLayout());
        this.ready[s] = true;
      }
      this.startBattle();
    } else if (this.phase === 'battle' && now >= this.turnDeadline) {
      const s = this.turn;
      this.timeouts[s]++;
      this.drawOffer = null;
      this.pushLog({ kind: 'timeout', seat: s, count: this.timeouts[s] });
      if (this.timeouts[s] >= this.T.maxTimeouts) { this.finish(other(s), 'timeout'); return; }
      this.passTurn();
    }
  }

  finish(winner, reason) {
    if (this.phase === 'over') return;
    this.phase = 'over';
    this.result = { winner, reason };
    this.endedAt = this.now();
    this.pushLog({ kind: 'end', winner, reason });
    this.changed();
    this.emit('over', this);
  }

  pushLog(e) {
    e.n = e.kind === 'move' || e.kind === 'attack' ? this.moveNo : null;
    this.log.push(e);
    if (this.log.length > 300) this.log.splice(0, this.log.length - 300);
  }

  // ---------------- 各方视图 ----------------
  logFor(e, seat) {
    const mine = e.seat === seat;
    const N = R.NAMES;
    switch (e.kind) {
      case 'start':
        return { n: null, side: 'sys', text: (mine ? '我方' : '对方') + '先行，对局开始', res: null };
      case 'move': {
        const from = conv(seat, e.from), to = conv(seat, e.to);
        if (mine) {
          let desc = '调动';
          if (from[0] === 'm' && to[0] === 'o') desc = '越过前线';
          else if (R.typeOf(to) === 'camp') desc = '进入行营';
          else if (e.path.length > 2) desc = '沿铁路疾行';
          return { n: e.n, side: 'me', text: N[e.k] + ' ' + desc, res: null };
        }
        const intoMine = to[0] === 'm';
        let text;
        if (intoMine && from[0] === 'o') text = '对方棋子越过前线，进入' + R.area(to);
        else if (intoMine) text = '对方棋子移至' + R.area(to);
        else if (R.typeOf(to) === 'camp') text = '对方棋子进入行营';
        else if (e.path.length > 2) text = '对方棋子沿铁路疾行';
        else text = '对方棋子调动';
        return { n: e.n, side: 'opp', text, res: intoMine ? 'warn' : null };
      }
      case 'attack': {
        if (mine) {
          const t = { win: ' 进攻 · 胜', lose: ' 进攻 · 阵亡', both: ' 与对方棋子同归于尽', flag: ' 夺得军旗！' }[e.res];
          return { n: e.n, side: 'me', text: N[e.ak] + t, res: e.res };
        }
        const dk = N[e.dk];
        if (e.res === 'flag') return { n: e.n, side: 'opp', text: '对方夺走了我方军旗', res: 'lose' };
        if (e.res === 'win') return { n: e.n, side: 'opp', text: '对方棋子击败我方' + dk, res: 'lose' };
        if (e.res === 'lose') return { n: e.n, side: 'opp', text: '对方棋子进攻我方' + dk + ' · 被击退', res: 'repel' };
        return { n: e.n, side: 'opp', text: '对方棋子与我方' + dk + '同归于尽', res: 'both' };
      }
      case 'reveal':
        return { n: null, side: 'sys', text: mine ? '我方司令阵亡，军旗位置已亮出' : '对方司令阵亡，军旗现形', res: mine ? 'warn' : 'win' };
      case 'timeout':
        return { n: null, side: mine ? 'me' : 'opp', text: (mine ? '我方' : '对方') + '超时（' + e.count + '/' + this.T.maxTimeouts + '）', res: 'warn' };
      case 'draw_offer':
        return { n: null, side: mine ? 'me' : 'opp', text: mine ? '你发起了求和' : '对方发起求和', res: null };
      case 'draw_decline':
        return { n: null, side: mine ? 'me' : 'opp', text: mine ? '你拒绝了和棋' : '对方拒绝了和棋', res: null };
      case 'end': {
        const outcome = e.winner === null ? 'draw' : e.winner === seat ? 'win' : 'lose';
        return { n: null, side: 'sys', text: reasonText(e.reason, outcome), res: outcome === 'win' ? 'win' : outcome === 'lose' ? 'lose' : 'both' };
      }
      default:
        return null;
    }
  }

  /** 某一方看到的完整对局状态（座位 1 的坐标已旋转为“自己在下方”） */
  viewFor(seat) {
    const o = other(seat);
    const v = (id) => conv(seat, id);
    const view = {
      id: this.id,
      mode: this.mode,
      phase: this.phase,
      version: this.version,
      seat,
      ready: { me: this.ready[seat], opp: this.ready[o] },
      deployStart: this.deployStart,
      deployDeadline: this.deployDeadline,
      timeouts: { me: this.timeouts[seat], opp: this.timeouts[o] },
      maxTimeouts: this.T.maxTimeouts,
      turnMs: this.T.turnMs,
      noCaptureLimit: this.T.noCaptureLimit
    };
    if (this.phase === 'deploy') {
      view.myLayout = this.toViewLayout(seat, this.ready[seat] ? this.lay[seat] : this.draft[seat]);
      return view;
    }
    const revealAll = this.phase === 'over';
    // 布阵阶段就结束（认输/离开）的对局没有棋盘。按棋盘位置排序输出，列表顺序不携带任何信息
    const occ = this.occ || {};
    view.pieces = R.IDS.filter((id) => occ[id]).map((id) => [id, occ[id]]).map(([id, q]) => {
      const mine = q.s === seat;
      return { at: v(id), pid: q.pid, side: mine ? 'm' : 'o', k: mine || q.rv || revealAll ? q.k : null, moved: q.moved };
    });
    view.turn = this.phase === 'battle' ? (this.turn === seat ? 'me' : 'opp') : null;
    view.turnDeadline = this.turnDeadline;
    view.moveNo = this.moveNo;
    view.noCapture = this.noCapture;
    view.last = this.last ? { side: this.last.seat === seat ? 'm' : 'o', from: v(this.last.from), to: v(this.last.to), path: this.last.path.map(v) } : null;
    view.log = this.log.slice(-80).map((e) => this.logFor(e, seat)).filter(Boolean).reverse();
    view.lost = { me: this.lost[seat].slice(), opp: this.lost[o].length };
    view.kills = { me: this.kills[seat], opp: this.kills[o] };
    view.drawOffer = this.drawOffer === null ? null : this.drawOffer === seat ? 'me' : 'opp';
    view.canOfferDraw = this.phase === 'battle' && this.drawOffer === null && this.moveNo - this.lastOfferAt[seat] >= this.T.drawGap;
    if (this.phase === 'over') {
      const w = this.result.winner;
      view.result = { outcome: w === null ? 'draw' : w === seat ? 'win' : 'lose', reason: this.result.reason };
    }
    return view;
  }

  /** 把一条碰子事件转换成某一方视角（用于弹出对决结果） */
  combatFor(entry, seat) {
    if (entry.seat === seat) return { role: 'attacker', my: entry.ak, res: entry.res, at: conv(seat, entry.to) };
    const res = entry.res === 'flag' ? 'flaglost' : entry.res === 'win' ? 'lose' : entry.res === 'lose' ? 'repel' : 'both';
    return { role: 'defender', my: entry.dk, res, at: conv(seat, entry.to) };
  }

  /** 终局统计 */
  summaryFor(seat) {
    const w = this.result ? this.result.winner : null;
    const byFlag = this.result && this.result.reason === 'flag' && w === seat && this.lastAttack;
    return {
      outcome: w === null ? 'draw' : w === seat ? 'win' : 'lose',
      reason: this.result ? this.result.reason : null,
      moves: this.moveNo,
      duration: Math.max(0, this.endedAt - (this.startedAt || this.createdAt)),
      kills: this.kills[seat],
      lost: this.lost[seat].length,
      flagBy: byFlag ? (this.lastAttack.seat === seat ? this.lastAttack.ak : this.lastAttack.dk) : null
    };
  }
}
