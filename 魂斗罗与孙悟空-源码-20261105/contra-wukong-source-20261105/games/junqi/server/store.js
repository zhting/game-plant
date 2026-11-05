// 玩家档案存储：内存 Map + 定时原子写入 JSON 文件。
// 登录凭证（token）只保存 sha256 摘要，文件泄露也无法冒充玩家。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { tierOf, WIN_PTS, LOSS_PTS, STREAK_BONUS } from '../shared/rules.js';

const HISTORY_MAX = 20;
const SAVE_DELAY = 1500;
const STALE_GUEST_MS = 14 * 24 * 3600 * 1000;

const ADJ = ['机智的', '勇敢的', '沉稳的', '冲锋的', '淡定的', '神勇的', '灵巧的', '无畏的', '憨憨的', '闪电', '铁壁', '飞毛腿', '夜行', '稳稳的', '不服输的'];
const NOUN = ['小工兵', '侦察兵', '小排长', '炮手', '小旅长', '小团长', '萌兵', '新兵', '号手', '卫兵', '参谋', '小连长'];

export function randomName(rnd = Math.random) {
  return ADJ[Math.floor(rnd() * ADJ.length)] + NOUN[Math.floor(rnd() * NOUN.length)];
}

// 控制字符、零宽字符、双向控制符、BOM 以及尖括号
const hex4 = (c) => '\\u' + c.toString(16).padStart(4, '0');
const BAD_CHARS = new RegExp('[' + [[0x00, 0x1f], [0x7f, 0x9f], [0x200b, 0x200f], [0x2028, 0x202e], [0x2060, 0x206f], [0xfeff, 0xfeff]]
  .map(([a, b]) => hex4(a) + '-' + hex4(b)).join('') + '<>]', 'g');

/** 清洗昵称：去掉控制字符、零宽字符、尖括号，压缩空白，最多 12 个字 */
export function sanitizeName(s) {
  if (typeof s !== 'string') return '';
  let t = s.normalize('NFKC')
    .replace(BAD_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim();
  const cps = [...t];
  if (cps.length > 12) t = cps.slice(0, 12).join('').trim();
  return t;
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export class Store {
  /**
   * @param {object} o
   * @param {string|null} o.file  存档路径；null 表示纯内存（测试用）
   */
  constructor({ file = null, now = Date.now, log = console } = {}) {
    this.file = file;
    this.now = now;
    this.log = log;
    this.players = new Map();
    this.byToken = new Map();
    this.timer = null;
    this.lb = null;
    if (file) this.load();
  }

  load() {
    let raw;
    try {
      raw = fs.readFileSync(this.file, 'utf8');
    } catch (e) {
      if (e.code !== 'ENOENT') this.log.error('[store] 读取存档失败：', e.message);
      return;
    }
    try {
      const data = JSON.parse(raw);
      const cutoff = this.now() - STALE_GUEST_MS;
      for (const p of data.players || []) {
        if (!p || typeof p.id !== 'string' || typeof p.tokenHash !== 'string') continue;
        // 从没下过棋、两周没来的游客档案不再保留
        if (!p.stats?.games && !p.bot?.games && (p.lastSeen || 0) < cutoff) continue;
        this.players.set(p.id, normalize(p));
        this.byToken.set(p.tokenHash, p.id);
      }
      this.log.info?.(`[store] 已载入 ${this.players.size} 位玩家`);
    } catch (e) {
      const bak = this.file + '.corrupt-' + this.now();
      try { fs.copyFileSync(this.file, bak); } catch { /* ignore */ }
      this.log.error('[store] 存档损坏，已备份到', bak, '并以空存档启动');
    }
  }

  /** 新建游客档案，返回明文 token（只在此时出现一次） */
  create(name) {
    const token = crypto.randomBytes(24).toString('base64url');
    const id = crypto.randomBytes(6).toString('hex');
    const t = this.now();
    const p = normalize({
      id,
      name: sanitizeName(name) || randomName(),
      tokenHash: hashToken(token),
      createdAt: t,
      lastSeen: t
    });
    this.players.set(id, p);
    this.byToken.set(p.tokenHash, id);
    this.save();
    return { player: p, token };
  }

  auth(token) {
    if (typeof token !== 'string' || token.length < 16 || token.length > 128) return null;
    const id = this.byToken.get(hashToken(token));
    return id ? this.players.get(id) || null : null;
  }

  get(id) { return this.players.get(id) || null; }

  touch(id) {
    const p = this.get(id);
    if (p) { p.lastSeen = this.now(); this.save(); }
  }

  rename(id, name) {
    const p = this.get(id);
    if (!p) return { ok: false, error: '玩家不存在' };
    const n = sanitizeName(name);
    if (!n) return { ok: false, error: '昵称不能为空' };
    p.name = n;
    this.lb = null;
    this.save();
    return { ok: true, name: n };
  }

  /** 对外公开的档案（不含凭证） */
  publicOf(p) {
    if (!p) return null;
    const t = tierOf(p.pts);
    return {
      id: p.id,
      name: p.name,
      pts: p.pts,
      tier: t.tier,
      tierLabel: t.label,
      progress: t.progress,
      next: t.next,
      nextLabel: t.nextLabel,
      best: p.best,
      streak: p.streak,
      stats: { ...p.stats },
      rank: { ...p.rank },
      bot: { ...p.bot },
      position: this.positionOf(p.id),
      createdAt: p.createdAt
    };
  }

  /**
   * 记一局战绩。排位局结算军功，其余模式只记场次。
   * @returns {{before:number, after:number, delta:number, bonus:number, streak:number, promo:boolean, demo:boolean}}
   */
  recordGame(id, g) {
    const p = this.get(id);
    if (!p) return null;
    const before = p.pts;
    let delta = 0, bonus = 0;
    const o = g.outcome; // 'win' | 'lose' | 'draw'
    if (g.mode === 'bot') {
      p.bot.games++;
      if (o === 'win') p.bot.w++;
    } else {
      p.stats.games++;
      if (o === 'win') p.stats.w++; else if (o === 'lose') p.stats.l++; else p.stats.d++;
    }
    if (g.mode === 'rank' && g.counted !== false) {
      if (o === 'win') {
        bonus = p.streak >= 2 ? STREAK_BONUS : 0;
        delta = WIN_PTS + bonus;
        p.streak++;
        p.rank.w++;
      } else if (o === 'lose') {
        delta = -Math.min(LOSS_PTS, p.pts);
        p.streak = 0;
        p.rank.l++;
      } else {
        p.streak = 0;
        p.rank.d++;
      }
      p.pts = Math.max(0, p.pts + delta);
      p.best = Math.max(p.best, p.pts);
      this.lb = null;
    }
    const tb = tierOf(before), ta = tierOf(p.pts);
    p.history.unshift({
      at: this.now(),
      mode: g.mode,
      outcome: o,
      reason: g.reason,
      opp: g.opp,
      oppBot: !!g.oppBot,
      delta,
      moves: g.moves || 0,
      duration: g.duration || 0
    });
    if (p.history.length > HISTORY_MAX) p.history.length = HISTORY_MAX;
    this.save();
    return {
      before,
      after: p.pts,
      delta,
      bonus,
      streak: p.streak,
      promo: ta.label !== tb.label && p.pts > before,
      demo: ta.label !== tb.label && p.pts < before,
      tierBefore: tb.label,
      tierAfter: ta.label
    };
  }

  history(id) {
    const p = this.get(id);
    return p ? p.history.slice() : [];
  }

  /** 排行榜：只统计下过排位的玩家（结果缓存到下次战绩变化） */
  leaderboard(limit = 50) {
    if (!this.lb) {
      this.lb = [...this.players.values()]
        .filter((p) => p.rank.w + p.rank.l + p.rank.d > 0)
        .sort((a, b) => b.pts - a.pts || b.rank.w - a.rank.w || a.createdAt - b.createdAt)
        .map((p, i) => ({ pos: i + 1, id: p.id, name: p.name, pts: p.pts, tier: tierOf(p.pts).tier, tierLabel: tierOf(p.pts).label, w: p.rank.w, l: p.rank.l }));
    }
    return this.lb.slice(0, limit);
  }

  positionOf(id) {
    this.leaderboard(0);
    const i = this.lb.findIndex((e) => e.id === id);
    return i < 0 ? null : i + 1;
  }

  // ---------------- 持久化 ----------------
  save() {
    if (!this.file || this.timer) return;
    this.timer = setTimeout(() => { this.timer = null; this.flush(); }, SAVE_DELAY);
    this.timer.unref?.();
  }

  flush() {
    if (!this.file) return;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    const data = JSON.stringify({ version: 1, savedAt: this.now(), players: [...this.players.values()] });
    const tmp = this.file + '.tmp';
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(tmp, data);
      fs.renameSync(tmp, this.file);
    } catch (e) {
      this.log.error('[store] 写入存档失败：', e.message);
    }
  }
}

function normalize(p) {
  return {
    id: p.id,
    name: sanitizeName(p.name) || randomName(),
    tokenHash: p.tokenHash,
    pts: Math.max(0, Math.floor(+p.pts || 0)),
    best: Math.max(0, Math.floor(+p.best || +p.pts || 0)),
    streak: Math.max(0, Math.floor(+p.streak || 0)),
    stats: { games: 0, w: 0, l: 0, d: 0, ...(p.stats || {}) },
    rank: { w: 0, l: 0, d: 0, ...(p.rank || {}) },
    bot: { games: 0, w: 0, ...(p.bot || {}) },
    history: Array.isArray(p.history) ? p.history.slice(0, HISTORY_MAX) : [],
    createdAt: p.createdAt || Date.now(),
    lastSeen: p.lastSeen || p.createdAt || Date.now()
  };
}
