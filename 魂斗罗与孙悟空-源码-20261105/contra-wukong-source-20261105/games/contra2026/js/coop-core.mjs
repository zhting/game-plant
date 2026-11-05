// Preserve shared references (platform supports, bridge cycles and laser hit Sets).
// A plain JSON clone would silently break both collision and piercing weapons.
export function packWorld(value) {
  const seen = new Map(), nodes = [];
  function ref(v) {
    if (v === null || typeof v !== 'object') return v ?? null;
    if (seen.has(v)) return { r: seen.get(v) };
    const id = nodes.length;
    seen.set(v, id); nodes.push(null);
    nodes[id] = v instanceof Set ? ['s', [...v].map(ref)]
      : Array.isArray(v) ? ['a', v.map(ref)]
      : ['o', Object.entries(v).filter(([k, x]) => !['__proto__', 'constructor', 'prototype'].includes(k) && typeof x !== 'function').map(([k, x]) => [k, ref(x)])];
    return { r: id };
  }
  return { v: 1, root: ref(value), nodes };
}

export function unpackWorld(graph) {
  if (graph?.v !== 1 || !Array.isArray(graph.nodes) || graph.nodes.length > 16000) throw Error('无效的游戏画面');
  const objects = graph.nodes.map(n => {
    if (!Array.isArray(n) || !Array.isArray(n[1])) throw Error('无效的游戏数据');
    if (n[0] === 'a') return [];
    if (n[0] === 's') return new Set();
    if (n[0] === 'o') return {};
    throw Error('无效的对象类型');
  });
  const deref = v => {
    if (v === null || typeof v !== 'object') return v;
    if (!Number.isInteger(v.r) || v.r < 0 || v.r >= objects.length) throw Error('无效的对象引用');
    return objects[v.r];
  };
  graph.nodes.forEach(([type, data], i) => {
    for (const entry of data) {
      if (type === 'o') {
        if (!Array.isArray(entry) || typeof entry[0] !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(entry[0])) throw Error('无效的对象字段');
        objects[i][entry[0]] = deref(entry[1]);
      } else if (type === 's') objects[i].add(deref(entry));
      else objects[i].push(deref(entry));
    }
  });
  return deref(graph.root);
}

export const INPUT_KEYS = ['up', 'down', 'left', 'right', 'fire', 'jump', 'gren', 'nade', 'cyc', 'start', 'esc'];
export const INPUT_MASK = (1 << INPUT_KEYS.length) - 1;
export const encodeInput = input => INPUT_KEYS.reduce((bits, key, i) => bits | (input[key] ? 1 << i : 0), 0);

export class InputBuffer {
  held = 0; edges = 0; updated = 0;
  push(bits, now = Date.now()) {
    bits &= INPUT_MASK;
    this.edges |= bits & ~this.held;
    this.held = bits; this.updated = now;
  }
  read(now = Date.now()) {
    if (now - this.updated > 600) this.clear();
    const input = {};
    INPUT_KEYS.forEach((key, i) => { input[key] = !!(this.held & (1 << i)); input[key + 'Edge'] = !!(this.edges & (1 << i)); });
    this.edges = 0;
    return input;
  }
  clear() { this.held = this.edges = 0; }
}
