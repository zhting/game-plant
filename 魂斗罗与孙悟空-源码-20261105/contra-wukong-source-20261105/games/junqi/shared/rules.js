// 萌兵军棋 · 两国暗棋规则引擎（服务端与浏览器共用，纯函数、无 DOM 依赖）
//
// 坐标约定：每个位置用 3 个字符表示，如 "m13"
//   第 1 位：m = 我方（棋盘下方），o = 对方（棋盘上方）
//   第 2 位：排 1-6，1 为靠近前线的一排，6 为大本营所在的底排
//   第 3 位：路 1-5，从该方玩家自己的视角看，1 在左
// 服务端以座位 A 为 "m" 保存权威棋盘；发给座位 B 时用 flipId 旋转 180°，
// 所以任何客户端看到的都是“自己在下方”。

export const NAMES = { sl: '司令', jz: '军长', shz: '师长', lvz: '旅长', tz: '团长', yz: '营长', lz: '连长', pz: '排长', gb: '工兵', dl: '地雷', zd: '炸弹', jq: '军旗' };
export const RANKS = Object.keys(NAMES);
export const POW = { sl: 40, jz: 39, shz: 38, lvz: 37, tz: 36, yz: 35, lz: 34, pz: 33, gb: 32, dl: 0, zd: 0, jq: 0 };
export const COUNTS = { sl: 1, jz: 1, shz: 2, lvz: 2, tz: 2, yz: 2, lz: 3, pz: 3, gb: 3, dl: 3, zd: 2, jq: 1 };
export const PIECE_TOTAL = 25;

const CAMPS = new Set(['22', '24', '33', '42', '44']);
export const isCampRC = (r, c) => CAMPS.has('' + r + c);

export function typeOf(id) {
  const r = +id[1], c = +id[2];
  if (r === 6 && (c === 2 || c === 4)) return 'hq';
  return isCampRC(r, c) ? 'camp' : 'st';
}
export const isRail = (id) => { const r = +id[1], c = +id[2]; return r === 1 || r === 5 || ((c === 1 || c === 5) && r <= 5); };
export function world(id) {
  const r = +id[1], c = +id[2];
  const d = 0.75 + r - 1;
  return { X: c - 3, Y: id[0] === 'm' ? d : -d };
}
export const IDS = [];
for (const s of ['o', 'm']) for (let r = 1; r <= 6; r++) for (let c = 1; c <= 5; c++) IDS.push(s + r + c);
export const MY_IDS = IDS.filter((id) => id[0] === 'm');
export const isId = (id) => typeof id === 'string' && /^[mo][1-6][1-5]$/.test(id);
export const ek = (a, b) => (a < b ? a + b : b + a);

// 旋转 180°：换边并镜像左右
export const flipId = (id) => (id[0] === 'm' ? 'o' : 'm') + id[1] + (6 - +id[2]);

export const ROAD = {};
for (const id of IDS) {
  const s = id[0], r = +id[1], c = +id[2], out = [];
  const ok = (r2, c2) => r2 >= 1 && r2 <= 6 && c2 >= 1 && c2 <= 5;
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (ok(r + dr, c + dc)) out.push(s + (r + dr) + (c + dc));
  // 前线只有 1、3、5 路可以通过（2、4 路是山界）
  if (r === 1 && (c === 1 || c === 3 || c === 5)) out.push((s === 'm' ? 'o' : 'm') + '1' + c);
  // 行营与四角斜向相连
  for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const r2 = r + dr, c2 = c + dc;
    if (ok(r2, c2) && (isCampRC(r, c) || isCampRC(r2, c2))) out.push(s + r2 + c2);
  }
  ROAD[id] = out;
}

export const LINES = [];
for (const s of ['m', 'o']) for (const r of [1, 5]) LINES.push([1, 2, 3, 4, 5].map((c) => s + r + c));
for (const c of [1, 5]) LINES.push([5, 4, 3, 2, 1].map((r) => 'o' + r + c).concat([1, 2, 3, 4, 5].map((r) => 'm' + r + c)));
LINES.push(['o13', 'm13']);

export const RAIL = {};
for (const line of LINES) line.forEach((id, i) => {
  const a = RAIL[id] || (RAIL[id] = []);
  if (i > 0) a.push(line[i - 1]);
  if (i < line.length - 1) a.push(line[i + 1]);
});

export const canMoveKind = (k) => k !== 'dl';

/**
 * 计算一枚棋子的合法走法。
 * occ: { [id]: { s: 阵营标识, k: 兵种（可为 null 表示未知） } }
 * 对方棋子只需要阵营信息；自己的棋子需要兵种。
 * 返回 { moves: 空位[], attacks: 可进攻的对方棋子位置[], paths: { [目标]: 路径[] } }
 */
export function legal(occ, from) {
  const p = occ[from];
  const res = { moves: [], attacks: [], paths: {} };
  if (!p || !canMoveKind(p.k) || (typeOf(from) === 'hq' && p.k !== 'jq')) return res;
  const mv = new Set(), at = new Set(), paths = {};
  const look = (to, path) => {
    const q = occ[to];
    if (!q) { if (!mv.has(to)) { mv.add(to); paths[to] = path; } return true; }
    if (q.s !== p.s && typeOf(to) !== 'camp' && !at.has(to)) { at.add(to); paths[to] = path; }
    return false;
  };
  for (const n of ROAD[from]) look(n, [from, n]);
  if (isRail(from)) {
    // 包括工兵和军旗，每步只沿一条直线铁路；停在转角后下回合才能转弯。
    for (const line of LINES) {
      const i = line.indexOf(from);
      if (i < 0) continue;
      for (const d of [-1, 1]) {
        const chain = [from];
        for (let j = i + d; j >= 0 && j < line.length; j += d) {
          chain.push(line[j]);
          if (!look(line[j], chain.slice())) break;
        }
      }
    }
  }
  res.moves = [...mv];
  res.attacks = [...at];
  res.paths = paths;
  return res;
}

export function hasAnyMove(occ, side) {
  for (const id of Object.keys(occ)) {
    if (occ[id].s !== side) continue;
    const lg = legal(occ, id);
    if (lg.moves.length || lg.attacks.length) return true;
  }
  return false;
}

/** 碰子判定。返回 'flag' | 'win' | 'lose' | 'both'（均以进攻方视角） */
export function fight(ak, dk) {
  if (dk === 'jq') return 'flag';
  if (ak === 'zd' || dk === 'zd') return 'both';
  if (dk === 'dl') return ak === 'gb' ? 'win' : 'both';
  return POW[ak] > POW[dk] ? 'win' : POW[ak] < POW[dk] ? 'lose' : 'both';
}

/** 某兵种能否放在我方某位置（布阵规则） */
export function validAt(k, id) {
  if (!k || !isId(id) || id[0] !== 'm' || typeOf(id) === 'camp') return false;
  if (k === 'jq') return typeOf(id) === 'hq';
  if (k === 'dl') return +id[1] >= 5;
  if (k === 'zd') return +id[1] !== 1;
  return true;
}
export const canSwap = (lay, a, b) => a !== b && !!lay[a] && !!lay[b] && lay[a] !== lay[b] && validAt(lay[a], b) && validAt(lay[b], a);

/** 校验一份完整布阵：25 枚、数量正确、位置合规、行营为空 */
export function validateLayout(lay) {
  if (!lay || typeof lay !== 'object' || Array.isArray(lay)) return { ok: false, error: '布阵数据无效' };
  const keys = Object.keys(lay);
  if (keys.length !== PIECE_TOTAL) return { ok: false, error: '需要正好 25 枚棋子' };
  const cnt = {};
  for (const id of keys) {
    const k = lay[id];
    if (!isId(id) || id[0] !== 'm') return { ok: false, error: '位置无效：' + id };
    if (!Object.prototype.hasOwnProperty.call(NAMES, k)) return { ok: false, error: '兵种无效' };
    if (!validAt(k, id)) return { ok: false, error: NAMES[k] + '不能放在这里' };
    cnt[k] = (cnt[k] || 0) + 1;
  }
  for (const k of RANKS) if ((cnt[k] || 0) !== COUNTS[k]) return { ok: false, error: NAMES[k] + '数量不对' };
  return { ok: true };
}

export const FORMS = [
  { id: 'default', name: '默认阵型', short: '默认', tag: '均衡 · 推荐新手', lay: { m61: 'dl', m62: 'jq', m63: 'dl', m64: 'lz', m65: 'pz', m51: 'tz', m52: 'dl', m53: 'zd', m54: 'gb', m55: 'yz', m41: 'shz', m43: 'pz', m45: 'lz', m31: 'gb', m32: 'lvz', m34: 'zd', m35: 'jz', m21: 'yz', m23: 'sl', m25: 'tz', m11: 'lz', m12: 'pz', m13: 'gb', m14: 'shz', m15: 'lvz' } },
  { id: 'fortress', name: '铁桶守旗', short: '铁桶', tag: '防守 · 三雷护旗', lay: { m61: 'dl', m62: 'jq', m63: 'dl', m64: 'pz', m65: 'lz', m51: 'zd', m52: 'dl', m53: 'zd', m54: 'gb', m55: 'tz', m41: 'lvz', m43: 'sl', m45: 'yz', m31: 'lz', m32: 'shz', m34: 'jz', m35: 'pz', m21: 'gb', m23: 'tz', m25: 'shz', m11: 'pz', m12: 'yz', m13: 'gb', m14: 'lz', m15: 'lvz' } },
  { id: 'blitz', name: '左路强攻', short: '强攻', tag: '进攻 · 大子压左', lay: { m61: 'pz', m62: 'dl', m63: 'lz', m64: 'jq', m65: 'dl', m51: 'gb', m52: 'yz', m53: 'pz', m54: 'dl', m55: 'lz', m41: 'zd', m43: 'tz', m45: 'gb', m31: 'jz', m32: 'lvz', m34: 'yz', m35: 'pz', m21: 'sl', m23: 'zd', m25: 'tz', m11: 'shz', m12: 'lz', m13: 'gb', m14: 'lvz', m15: 'shz' } }
];
export const defaultLayout = () => ({ ...FORMS[0].lay });

/** 生成一份合规的随机布阵。rnd: () => [0,1) */
export function randomLayout(rnd = Math.random) {
  const ids = MY_IDS.filter((id) => typeOf(id) !== 'camp');
  const lay = {};
  const free = () => ids.filter((id) => !lay[id]);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  lay[pick(['m62', 'm64'])] = 'jq';
  for (let i = 0; i < 3; i++) lay[pick(free().filter((id) => +id[1] >= 5))] = 'dl';
  for (let i = 0; i < 2; i++) lay[pick(free().filter((id) => +id[1] !== 1))] = 'zd';
  const pool = [];
  for (const k of ['sl', 'jz', 'shz', 'lvz', 'tz', 'yz', 'lz', 'pz', 'gb']) for (let i = 0; i < COUNTS[k]; i++) pool.push(k);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  free().forEach((id, i) => { lay[id] = pool[i]; });
  return lay;
}

/** 可读的位置描述（屏幕阅读器与战报用） */
export function label(id) {
  const t = typeOf(id);
  return (id[0] === 'm' ? '我方' : '对方') + '第' + id[1] + '排第' + id[2] + '路' + (t === 'camp' ? '（行营）' : t === 'hq' ? '（大本营）' : '');
}
export function area(id) {
  const c = +id[2];
  return (id[0] === 'm' ? '我方' : '对方') + (c <= 2 ? '左路' : c === 3 ? '中路' : '右路');
}

// ---------------- 军衔与军功 ----------------
export const TIERS = [
  { n: '列兵', ch: '列', c: '#8FBF4E', d: '#557F26', l: '#D2EDA8' },
  { n: '工兵', ch: '工', c: '#D98A4A', d: '#98541F', l: '#F7C79A' },
  { n: '排长', ch: '排', c: '#AFC0D6', d: '#6F819C', l: '#EEF3FA' },
  { n: '连长', ch: '连', c: '#6FA0E6', d: '#3A67AE', l: '#C4DBFA' },
  { n: '营长', ch: '营', c: '#FFC83D', d: '#C98A00', l: '#FFEDB0' },
  { n: '团长', ch: '团', c: '#FF9F2E', d: '#C4650A', l: '#FFD6A3' },
  { n: '旅长', ch: '旅', c: '#22B893', d: '#0F7A5E', l: '#A6EBD6' },
  { n: '师长', ch: '师', c: '#3D6BFF', d: '#1E3FB8', l: '#B7C8FF' },
  { n: '军长', ch: '军', c: '#9B5BFF', d: '#5E2DB8', l: '#D8C2FF' },
  { n: '司令', ch: '司', c: '#E8453A', d: '#A92A21', l: '#FFB3A8' }
];
const SUB = ['III', 'II', 'I'];
export const WIN_PTS = 24, STREAK_BONUS = 2, LOSS_PTS = 18;
export const TOP_PTS = 2500;

/** 军功 → 军衔。列兵 0-99；工兵至军长每档 300（III/II/I 各 100）；司令 2500+ */
export function tierOf(pts) {
  pts = Math.max(0, Math.floor(pts || 0));
  if (pts < 100) return { tier: 0, sub: '', label: '列兵', progress: pts, next: 100, nextLabel: '工兵 III' };
  if (pts >= TOP_PTS) return { tier: 9, sub: '', label: '司令', progress: 100, next: null, nextLabel: '' };
  const x = pts - 100;
  const tier = 1 + Math.floor(x / 300);
  const s = Math.floor((x % 300) / 100);
  const next = 100 + (tier - 1) * 300 + (s + 1) * 100;
  const nt = tierOf(next);
  return { tier, sub: SUB[s], label: TIERS[tier].n + ' ' + SUB[s], progress: x % 100, next, nextLabel: nt.label };
}

/** 终局原因的文字说明。outcome: win | lose | draw（以观看方视角） */
export function reasonText(reason, outcome) {
  const T = {
    flag: { win: '夺得对方军旗，获胜', lose: '我方军旗被夺', draw: '' },
    nomoves: { win: '对方无子可走，获胜', lose: '我方无子可走', draw: '双方都已无子可走，和棋' },
    timeout: { win: '对方超时 3 次，获胜', lose: '超时 3 次判负', draw: '' },
    resign: { win: '对方认输，获胜', lose: '你认输了', draw: '' },
    leave: { win: '对方离开了对局，获胜', lose: '你离开了对局', draw: '' },
    nocapture: { win: '', lose: '', draw: '连续 60 步无吃子，和棋' },
    agreed: { win: '', lose: '', draw: '双方同意和棋' },
    abort: { win: '', lose: '', draw: '双方都已离线，对局作废' }
  };
  return (T[reason] && T[reason][outcome]) || '对局结束';
}
