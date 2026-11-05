// 大厅：登录、排位/休闲匹配、好友房、人机、对局路由、断线重连。
// 与传输层无关：index.js 把每条 WebSocket 连接包装成 { send(obj), close(code, reason) } 交给这里。
import crypto from 'node:crypto';
import { Game, TIMING, reasonText } from './game.js';
import { Bot, BOT_NAMES } from './bot.js';
import { tierOf } from '../shared/rules.js';

export const PROTOCOL = 1;
const MODES = ['rank', 'casual'];
const ROOM_TTL = 10 * 60 * 1000;        // 好友房等待多久过期
const GAME_KEEP = 10 * 60 * 1000;       // 结束的对局保留多久（再来一局用）
const REMATCH_TTL = 3 * 60 * 1000;
const ABANDON_MS = 90 * 1000;           // 双方都离线这么久，对局作废
const SESSION_TTL = 30 * 60 * 1000;     // 离线会话保留多久
const RATE_BURST = 40, RATE_PER_SEC = 20;
const CREATE_LIMIT = 30, CREATE_WINDOW = 10 * 60 * 1000; // 同一 IP 每 10 分钟最多新建 30 个游客档案

const OK = { ok: true };
const fail = (error) => ({ ok: false, error });

export class Lobby {
  constructor({ store, now = Date.now, timing = {}, rnd = Math.random, log = console, bot = {} }) {
    this.store = store;
    this.now = now;
    this.timing = { ...TIMING, ...timing };
    this.rnd = rnd;
    this.log = log;
    this.botOpts = bot;
    this.sessions = new Map();  // 玩家 id → 会话
    this.conns = new Set();
    this.queue = [];            // { pid, mode, since }
    this.rooms = new Map();     // 房间号 → { code, host, createdAt }
    this.games = new Map();     // 对局 id → rec
    this.lastMatchAt = 0;
    this.creates = new Map();   // IP → 最近新建档案的时间
    this.startedAt = now();
  }

  // ================= 连接 =================
  connect(conn) {
    this.conns.add(conn);
    conn.pid = null;
    conn.bucket = { at: this.now(), n: RATE_BURST };
    conn.strikes = 0;
  }

  disconnect(conn) {
    this.conns.delete(conn);
    const s = conn.pid ? this.sessions.get(conn.pid) : null;
    if (!s || s.conn !== conn) return;
    s.conn = null;
    s.offSince = this.now();
    this.leaveQueue(s);
    const rec = this.activeRec(s);
    if (rec) this.notifyOpp(rec, s.pid, { type: 'opp_status', online: false });
  }

  allowCreate(ip) {
    if (!ip) return true;
    const now = this.now();
    const list = (this.creates.get(ip) || []).filter((t) => now - t < CREATE_WINDOW);
    if (list.length >= CREATE_LIMIT) { this.creates.set(ip, list); return false; }
    list.push(now);
    this.creates.set(ip, list);
    return true;
  }

  allow(conn) {
    const now = this.now();
    const b = conn.bucket;
    b.n = Math.min(RATE_BURST, b.n + ((now - b.at) / 1000) * RATE_PER_SEC);
    b.at = now;
    if (b.n < 1) return false;
    b.n -= 1;
    return true;
  }

  message(conn, raw) {
    if (!this.allow(conn)) {
      if (++conn.strikes > 60) conn.close(4008, 'rate limit');
      return conn.send({ t: 'error', error: '操作太频繁，请稍后再试' });
    }
    let msg;
    try { msg = JSON.parse(raw); } catch { return conn.send({ t: 'error', error: '消息格式错误' }); }
    if (!msg || typeof msg !== 'object' || typeof msg.t !== 'string') return conn.send({ t: 'error', error: '消息格式错误' });
    const rid = typeof msg.rid === 'number' || (typeof msg.rid === 'string' && msg.rid.length < 40) ? msg.rid : undefined;
    if (msg.t === 'ping') return conn.send({ t: 'pong', c: typeof msg.c === 'number' ? msg.c : null, now: this.now() });
    let r;
    try {
      if (msg.t === 'hello') r = this.hello(conn, msg);
      else {
        const s = conn.pid ? this.sessions.get(conn.pid) : null;
        const fn = Object.prototype.hasOwnProperty.call(HANDLERS, msg.t) ? HANDLERS[msg.t] : null;
        if (!s || s.conn !== conn) r = fail('请先登录');
        else if (!fn) r = fail('未知指令');
        else r = fn.call(this, s, msg);
      }
    } catch (e) {
      this.log.error('[lobby] 处理', msg.t, '出错：', e);
      r = fail('服务器开小差了，请重试');
    }
    r = r || OK;
    if (rid !== undefined) conn.send({ t: 'reply', rid, ok: !!r.ok, error: r.error, data: r.data });
    else if (!r.ok) conn.send({ t: 'error', error: r.error });
  }

  hello(conn, msg) {
    if (conn.pid) return fail('已经登录');
    let p = this.store.auth(msg.token);
    let token;
    if (!p) {
      if (!this.allowCreate(conn.ip)) return fail('新建账号太频繁，请稍后再试');
      ({ player: p, token } = this.store.create(msg.name));
    }
    let s = this.sessions.get(p.id);
    if (s && s.conn && s.conn !== conn) {
      const old = s.conn;
      old.send({ t: 'kicked', reason: '你的账号已在另一个窗口登录' });
      old.pid = null;
      old.close(4001, 'replaced');
    }
    if (!s) {
      s = { pid: p.id, conn: null, offSince: 0, queue: null, room: null, gid: null, joins: [] };
      this.sessions.set(p.id, s);
    }
    // 新连接从大厅开始：旧窗口留下的排队一律取消（房间和对局会在下面恢复）
    this.leaveQueue(s);
    s.conn = conn;
    s.offSince = 0;
    conn.pid = p.id;
    this.store.touch(p.id);
    const T = this.timing;
    conn.send({
      t: 'welcome',
      protocol: PROTOCOL,
      token,
      me: this.store.publicOf(p),
      timing: { foundMs: T.foundMs, deployMs: T.deployMs, turnMs: T.turnMs, maxTimeouts: T.maxTimeouts, drawGap: T.drawGap },
      now: this.now()
    });
    // 断线重连：恢复排队 / 房间 / 对局
    if (s.room && this.rooms.has(s.room)) this.sendRoom(s);
    else s.room = null;
    const rec = this.recOf(s);
    if (rec) {
      // 对局进行中：回到棋盘；刚结束的对局：重新给出终局画面和结算
      const seat = rec.seats.indexOf(s.pid);
      this.sendFound(rec, seat, true);
      this.sendState(rec, seat);
      if (!rec.game.isOver()) this.notifyOpp(rec, s.pid, { type: 'opp_status', online: true });
      else if (rec.overMsg[seat]) this.sendTo(s.pid, rec.overMsg[seat]);
    }
    this.sendLobby(s);
    return OK;
  }

  // ================= 发送 =================
  sendTo(pid, msg) {
    const s = pid ? this.sessions.get(pid) : null;
    if (s && s.conn) s.conn.send(msg);
  }
  sendMe(s) { this.sendTo(s.pid, { t: 'me', me: this.store.publicOf(this.store.get(s.pid)), now: this.now() }); }
  sendQueue(s) {
    const q = s.queue;
    this.sendTo(s.pid, {
      t: 'queue',
      state: q ? 'searching' : 'idle',
      mode: q ? q.mode : null,
      since: q ? q.since : null,
      waiting: q ? this.queue.filter((e) => e.mode === q.mode).length : 0,
      now: this.now()
    });
  }
  sendRoom(s) {
    const room = s.room ? this.rooms.get(s.room) : null;
    this.sendTo(s.pid, room
      ? { t: 'room', state: 'waiting', code: room.code, expiresAt: room.createdAt + ROOM_TTL, now: this.now() }
      : { t: 'room', state: 'idle', now: this.now() });
  }
  lobbyInfo(s) {
    let online = 0;
    for (const x of this.sessions.values()) if (x.conn) online++;
    let playing = 0;
    for (const r of this.games.values()) if (!r.game.isOver()) playing++;
    return {
      online,
      playing,
      queue: { rank: this.queue.filter((e) => e.mode === 'rank').length, casual: this.queue.filter((e) => e.mode === 'casual').length },
      leaderboard: this.store.leaderboard(30),
      history: this.store.history(s.pid).slice(0, 12),
      me: this.store.publicOf(this.store.get(s.pid))
    };
  }
  sendLobby(s) { this.sendTo(s.pid, { t: 'lobby', ...this.lobbyInfo(s), now: this.now() }); }

  // ================= 状态辅助 =================
  recOf(s) { return (s.gid && this.games.get(s.gid)) || null; }
  activeRec(s) { const r = this.recOf(s); return r && !r.game.isOver() ? r : null; }
  seatRec(s) {
    const rec = this.recOf(s);
    if (!rec) return null;
    return { rec, seat: rec.seats.indexOf(s.pid) };
  }
  leaveQueue(s) {
    if (!s.queue) return;
    const q = s.queue;
    this.queue = this.queue.filter((e) => e !== q);
    s.queue = null;
  }
  closeRoom(s) {
    if (!s.room) return;
    const r = this.rooms.get(s.room);
    if (r && r.host === s.pid) this.rooms.delete(s.room);
    s.room = null;
  }
  /** 离开一局已经结束的对局（顺便告诉对方“再来一局”不可用了） */
  detachFinished(s) {
    const rec = this.recOf(s);
    if (!rec) { s.gid = null; return; }
    if (!rec.game.isOver()) return;
    s.gid = null;
    const seat = rec.seats.indexOf(s.pid);
    const opid = rec.seats[1 - seat];
    const os = opid ? this.sessions.get(opid) : null;
    if (os && os.gid === rec.id) this.sendTo(opid, { t: 'match.event', ev: { type: 'opp_left' }, now: this.now() });
  }
  notifyOpp(rec, pid, ev) {
    const seat = rec.seats.indexOf(pid);
    const opid = rec.seats[1 - seat];
    if (opid) this.sendTo(opid, { t: 'match.event', ev, now: this.now() });
  }
  isOnline(pid) { const s = pid ? this.sessions.get(pid) : null; return !!(s && s.conn); }

  playerInfo(pid) {
    const p = this.store.get(pid);
    const t = tierOf(p.pts);
    return { name: p.name, pts: p.pts, tier: t.tier, tierLabel: t.label, games: p.stats.games, w: p.stats.w, l: p.stats.l, streak: p.streak, isBot: false };
  }
  botInfo(ref) {
    // 人机显示与玩家相同的军衔，只是陪练，不编造战绩
    const pts = ref ? ref.pts : 0;
    const t = tierOf(pts);
    return { name: BOT_NAMES[Math.floor(this.rnd() * BOT_NAMES.length)], pts, tier: t.tier, tierLabel: t.label, games: 0, w: 0, l: 0, streak: 0, isBot: true };
  }

  // ================= 开局 =================
  startGame(mode, pids) {
    const id = crypto.randomBytes(6).toString('hex');
    const seats = this.rnd() < 0.5 ? [pids[0], pids[1]] : [pids[1], pids[0]];
    const humanRef = this.playerInfo(pids[0]);
    const info = seats.map((pid) => (pid ? this.playerInfo(pid) : this.botInfo(humanRef)));
    const game = new Game({ id, mode, players: info.map((x, i) => ({ id: seats[i] || 'bot', name: x.name, pts: x.pts, isBot: x.isBot })), now: this.now, timing: this.timing, rnd: this.rnd });
    const rec = { id, mode, game, seats, info, bots: [null, null], rematch: [false, false], overAt: 0, allOffSince: 0, overMsg: [null, null] };
    seats.forEach((pid, seat) => {
      if (!pid) { rec.bots[seat] = new Bot(game, seat, { rnd: this.rnd, ...this.botOpts }); return; }
      const s = this.sessions.get(pid);
      this.leaveQueue(s);
      this.closeRoom(s);
      s.gid = id;
    });
    game.on('change', () => this.pushState(rec));
    game.on('event', (ev) => this.pushEvent(rec, ev));
    game.on('over', () => this.onOver(rec));
    this.games.set(id, rec);
    for (const seat of [0, 1]) {
      if (!seats[seat]) continue;
      this.sendFound(rec, seat, false);
      this.sendState(rec, seat);
    }
    return rec;
  }

  sendFound(rec, seat, resume) {
    const g = rec.game;
    const side = (i) => ({ ...rec.info[i], online: rec.seats[i] ? this.isOnline(rec.seats[i]) : true });
    this.sendTo(rec.seats[seat], {
      t: 'match.found',
      resume: !!resume,
      match: { id: rec.id, mode: rec.mode, seat, you: side(seat), opp: side(1 - seat), createdAt: g.createdAt, deployStart: g.deployStart, deployDeadline: g.deployDeadline },
      now: this.now()
    });
  }
  sendState(rec, seat) {
    const pid = rec.seats[seat];
    if (!pid || !this.isOnline(pid)) return;
    this.sendTo(pid, { t: 'match.state', view: rec.game.viewFor(seat), now: this.now() });
  }
  pushState(rec) { for (const seat of [0, 1]) this.sendState(rec, seat); }

  pushEvent(rec, ev) {
    for (const seat of [0, 1]) {
      const pid = rec.seats[seat];
      if (!pid) continue;
      let e;
      if (ev.type === 'combat') e = { type: 'combat', ...rec.game.combatFor(ev.entry, seat), moveNo: ev.entry.n };
      else if (ev.type === 'draw_offer' || ev.type === 'draw_declined') e = { type: ev.type, by: ev.seat === seat ? 'me' : 'opp' };
      else continue;
      this.sendTo(pid, { t: 'match.event', ev: e, now: this.now() });
    }
  }

  onOver(rec) {
    const g = rec.game;
    rec.overAt = this.now();
    for (const b of rec.bots) if (b) b.stop();
    const aborted = g.result.reason === 'abort';
    for (const seat of [0, 1]) {
      const pid = rec.seats[seat];
      if (!pid) continue;
      const sum = g.summaryFor(seat);
      const opp = rec.info[1 - seat];
      const pts = aborted ? null : this.store.recordGame(pid, {
        mode: rec.mode, outcome: sum.outcome, reason: sum.reason, opp: opp.name, oppBot: opp.isBot, moves: sum.moves, duration: sum.duration
      });
      const msg = {
        t: 'match.over',
        summary: { ...sum, text: reasonText(sum.reason, sum.outcome) },
        points: rec.mode === 'rank' && pts ? pts : null,
        me: this.store.publicOf(this.store.get(pid)),
        canRematch: rec.mode !== 'rank' && !aborted,
        now: this.now()
      };
      rec.overMsg[seat] = msg;
      this.sendTo(pid, msg);
    }
  }

  // ================= 匹配 =================
  matchmake() {
    const now = this.now();
    for (const mode of MODES) {
      const q = this.queue.filter((e) => e.mode === mode).sort((a, b) => a.since - b.since);
      const used = new Set();
      for (const a of q) {
        if (used.has(a)) continue;
        const pa = this.store.get(a.pid)?.pts ?? 0;
        let best = null, bestDiff = Infinity;
        for (const b of q) {
          if (b === a || used.has(b)) continue;
          if (mode === 'casual') { best = b; break; }
          // 排位：军功差距窗口随等待时间放宽
          const diff = Math.abs(pa - (this.store.get(b.pid)?.pts ?? 0));
          const wait = (now - Math.min(a.since, b.since)) / 1000;
          if (diff <= 200 + 40 * wait && diff < bestDiff) { best = b; bestDiff = diff; }
        }
        if (best) {
          used.add(a);
          used.add(best);
          this.startGame(mode, [a.pid, best.pid]);
        }
      }
    }
  }

  // ================= 定时 =================
  tick() {
    const now = this.now();
    for (const rec of [...this.games.values()]) {
      const g = rec.game;
      if (!g.isOver()) {
        g.tick();
        if (!g.isOver()) for (const b of rec.bots) if (b) b.tick(now);
        if (!g.isOver()) this.checkAbandon(rec, now);
      } else if (now - rec.overAt > GAME_KEEP) {
        for (const pid of rec.seats) {
          const s = pid ? this.sessions.get(pid) : null;
          if (s && s.gid === rec.id) s.gid = null;
        }
        this.games.delete(rec.id);
      }
    }
    if (now - this.lastMatchAt >= 1000) {
      this.lastMatchAt = now;
      this.matchmake();
    }
    for (const [code, room] of this.rooms) {
      if (now - room.createdAt <= ROOM_TTL) continue;
      this.rooms.delete(code);
      const s = this.sessions.get(room.host);
      if (s && s.room === code) {
        s.room = null;
        this.sendTo(room.host, { t: 'room', state: 'expired', now });
      }
    }
    for (const [ip, list] of this.creates) if (!list.length || now - list[list.length - 1] > CREATE_WINDOW) this.creates.delete(ip);
    for (const [pid, s] of this.sessions) {
      if (!s.conn && now - s.offSince > SESSION_TTL && !this.activeRec(s)) {
        this.closeRoom(s);
        this.sessions.delete(pid);
      }
    }
  }

  checkAbandon(rec, now) {
    const allOff = rec.seats.every((pid) => !pid || !this.isOnline(pid));
    if (!allOff) { rec.allOffSince = 0; return; }
    if (!rec.allOffSince) rec.allOffSince = now;
    else if (now - rec.allOffSince > ABANDON_MS) rec.game.finish(null, 'abort');
  }

  stats() {
    let online = 0;
    for (const s of this.sessions.values()) if (s.conn) online++;
    let playing = 0;
    for (const r of this.games.values()) if (!r.game.isOver()) playing++;
    return { online, connections: this.conns.size, sessions: this.sessions.size, playing, queue: this.queue.length, rooms: this.rooms.size, uptime: Math.round((this.now() - this.startedAt) / 1000) };
  }
}

// ================= 指令 =================
const HANDLERS = {
  'rename'(s, msg) {
    const r = this.store.rename(s.pid, msg.name);
    if (!r.ok) return r;
    this.sendMe(s);
    return { ok: true, data: { name: r.name } };
  },

  'lobby.refresh'(s) { this.sendLobby(s); return OK; },

  'queue.join'(s, msg) {
    if (!MODES.includes(msg.mode)) return fail('未知的对战模式');
    if (this.activeRec(s)) return fail('你还有一局没下完');
    this.detachFinished(s);
    this.closeRoom(s);
    this.leaveQueue(s);
    s.queue = { pid: s.pid, mode: msg.mode, since: this.now() };
    this.queue.push(s.queue);
    this.sendQueue(s);
    this.matchmake();
    return OK;
  },

  'queue.leave'(s) {
    this.leaveQueue(s);
    this.sendQueue(s);
    return OK;
  },

  'room.create'(s) {
    if (this.activeRec(s)) return fail('你还有一局没下完');
    this.detachFinished(s);
    this.leaveQueue(s);
    if (s.room && this.rooms.has(s.room)) { this.sendRoom(s); return { ok: true, data: { code: s.room } }; }
    let code = null;
    for (let i = 0; i < 60 && !code; i++) {
      const c = String(1000 + Math.floor(this.rnd() * 9000));
      if (!this.rooms.has(c)) code = c;
    }
    if (!code) return fail('房间太多了，请稍后再试');
    this.rooms.set(code, { code, host: s.pid, createdAt: this.now() });
    s.room = code;
    this.sendRoom(s);
    return { ok: true, data: { code } };
  },

  'room.join'(s, msg) {
    const now = this.now();
    s.joins = s.joins.filter((t) => now - t < 60000);
    if (s.joins.length >= 12) return fail('尝试太频繁，请稍后再试');
    s.joins.push(now);
    const code = String(msg.code ?? '').trim();
    if (!/^\d{4}$/.test(code)) return fail('房间号是 4 位数字');
    const room = this.rooms.get(code);
    if (!room) return fail('房间不存在或已过期');
    if (room.host === s.pid) return fail('这是你自己的房间，把房间号发给好友吧');
    if (this.activeRec(s)) return fail('你还有一局没下完');
    const host = this.sessions.get(room.host);
    if (!host || this.activeRec(host) || (!host.conn && now - host.offSince > 30000)) {
      this.rooms.delete(code);
      if (host && host.room === code) host.room = null;
      return fail('房主已经离开');
    }
    this.detachFinished(s);
    this.detachFinished(host);
    this.leaveQueue(s);
    this.closeRoom(s);
    this.startGame('friend', [host.pid, s.pid]);
    return OK;
  },

  'room.leave'(s) {
    this.closeRoom(s);
    this.sendRoom(s);
    return OK;
  },

  'bot.start'(s) {
    if (this.activeRec(s)) return fail('你还有一局没下完');
    this.detachFinished(s);
    this.leaveQueue(s);
    this.closeRoom(s);
    this.startGame('bot', [s.pid, null]);
    return OK;
  },

  'deploy.draft'(s, msg) {
    const x = this.seatRec(s);
    if (!x) return fail('你不在对局中');
    return x.rec.game.draftDeploy(x.seat, msg.layout);
  },

  'deploy.submit'(s, msg) {
    const x = this.seatRec(s);
    if (!x) return fail('你不在对局中');
    return x.rec.game.submitDeploy(x.seat, msg.layout);
  },

  'move'(s, msg) {
    const x = this.seatRec(s);
    if (!x) return fail('你不在对局中');
    return x.rec.game.move(x.seat, msg.from, msg.to);
  },

  'resign'(s) {
    const x = this.seatRec(s);
    if (!x) return fail('你不在对局中');
    return x.rec.game.resign(x.seat, 'resign');
  },

  'draw.offer'(s) {
    const x = this.seatRec(s);
    if (!x) return fail('你不在对局中');
    return x.rec.game.offerDraw(x.seat);
  },

  'draw.answer'(s, msg) {
    const x = this.seatRec(s);
    if (!x) return fail('你不在对局中');
    return x.rec.game.answerDraw(x.seat, msg.accept === true);
  },

  'match.sync'(s) {
    const x = this.seatRec(s);
    if (!x || x.rec.game.isOver()) return fail('你不在对局中');
    this.sendFound(x.rec, x.seat, true);
    this.sendState(x.rec, x.seat);
    return OK;
  },

  'match.leave'(s) {
    if (this.activeRec(s)) return fail('对局还没结束，要离开请先认输');
    this.detachFinished(s);
    this.sendLobby(s);
    return OK;
  },

  'match.rematch'(s) {
    const x = this.seatRec(s);
    if (!x || !x.rec.game.isOver()) return fail('对局还没结束');
    const { rec, seat } = x;
    if (rec.mode === 'rank') return fail('排位赛请重新匹配');
    if (rec.game.result.reason === 'abort') return fail('这局已作废');
    if (this.now() - rec.overAt > REMATCH_TTL) return fail('再战邀请已过期');
    if (rec.mode === 'bot') {
      s.gid = null;
      this.startGame('bot', [s.pid, null]);
      return OK;
    }
    const opid = rec.seats[1 - seat];
    const os = this.sessions.get(opid);
    if (!os || os.gid !== rec.id || this.activeRec(os)) return fail('对方已经离开');
    if (!os.conn) return fail('对方暂时离线，稍后再试');
    rec.rematch[seat] = true;
    if (rec.rematch[1 - seat]) {
      s.gid = null;
      os.gid = null;
      this.startGame(rec.mode, [rec.seats[0], rec.seats[1]]);
    } else {
      this.sendTo(opid, { t: 'match.event', ev: { type: 'rematch', by: 'opp' }, now: this.now() });
    }
    return OK;
  }
};
