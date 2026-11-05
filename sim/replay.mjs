// Golden replays: run a scripted input sequence through the headless engine and
// fingerprint the game state at fixed checkpoints. Any behavioural change in the
// engine (intended or not) changes the fingerprints, so refactors that must keep
// gameplay identical can be verified frame-exactly.
import { createHash } from 'node:crypto';
import { createHeadlessEngine } from './headless.mjs';

export const CHECKPOINT_EVERY = 60; // frames (1 s of game time)

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
}

/** Canonical, cycle-safe projection of engine state: rounded numbers, no functions, bounded depth. */
export function canonicalState(value, depth = 0, seen = new WeakSet()) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : String(value);
  if (value === null || typeof value !== 'object') return typeof value === 'function' ? undefined : value;
  if (seen.has(value) || depth > 6) return '~';
  seen.add(value);
  if (Array.isArray(value)) return value.map(item => canonicalState(item, depth + 1, seen));
  if (ArrayBuffer.isView(value)) return Array.from(value);
  // Media, canvases and other host objects are presentation-only; record only their kind.
  // Engine objects are created inside the vm context, so compare constructor names, not prototypes.
  const kind = Object.getPrototypeOf(value)?.constructor?.name || 'Object';
  if (kind === 'Map') return [...value].map(([k, v]) => [canonicalState(k, depth + 1, seen), canonicalState(v, depth + 1, seen)]);
  if (kind === 'Set') return [...value].map(item => canonicalState(item, depth + 1, seen));
  if (kind !== 'Object') return `<${kind}>`;
  const out = {};
  for (const key of Object.keys(value).sort()) {
    const item = canonicalState(value[key], depth + 1, seen);
    if (item !== undefined) out[key] = item;
  }
  return out;
}

export function fingerprint(engine) {
  const state = canonicalState({ G: engine.G, solids: engine.solids });
  return createHash('sha256').update(JSON.stringify(state)).digest('hex').slice(0, 16);
}

/** Small human-readable summary stored next to each fingerprint to make diffs easy to read. */
export function summary(engine) {
  const { G } = engine, p = G.p || {};
  const round = n => typeof n === 'number' ? Math.round(n * 10) / 10 : n;
  return {
    mode: G.mode, stage: G.stage, camX: round(G.camX), score: G.score, lives: G.lives,
    p: { x: round(p.x), y: round(p.y), weapon: p.weapon, dead: !!p.dead },
    enemies: Array.isArray(G.en) ? G.en.filter(e => !e.dead).length : null,
  };
}

/**
 * Expand an input script into per-frame key sets.
 * Script entries: { frames, keys: ['KeyD', 'KeyJ'], tap?: { key: 'KeyK', every: 45, hold: 6 } }
 */
export function* expandScript(script) {
  let frame = 0;
  for (const segment of script) {
    for (let i = 0; i < segment.frames; i++, frame++) {
      const keys = {};
      for (const key of segment.keys || []) keys[key] = true;
      if (segment.tap && i % segment.tap.every < (segment.tap.hold || 1)) keys[segment.tap.key] = true;
      yield keys;
    }
  }
}

/** Default bot: run right firing, jumping on a fixed rhythm. Deterministic, not meant to win. */
export function defaultScript(seconds = 20) {
  return [
    { frames: 30, keys: [] },
    { frames: seconds * 60, keys: ['KeyD', 'KeyJ'], tap: { key: 'KeyK', every: 50, hold: 8 } },
  ];
}

/**
 * Run a replay and return checkpoints. Host Math.random is seeded for the duration of the
 * (synchronous) run because several helper modules draw randomness outside the VM.
 */
export function runReplay({ game = 'contra2026', stage = 1, seed = 1, script = defaultScript() } = {}) {
  const hostRandom = Math.random;
  Math.random = seededRandom(seed ^ 0x9e3779b9);
  try {
    const engine = createHeadlessEngine({ game, seed });
    if (game === 'wukong') engine.primeResources(stage);
    engine.play(stage, false);
    if (game === 'wukong') engine.primeResources(stage);
    const checkpoints = [];
    let frame = 0;
    for (const keys of expandScript(script)) {
      for (const key of Object.keys(engine.K)) engine.K[key] = false;
      Object.assign(engine.K, keys);
      engine.step();
      frame++;
      if (frame % CHECKPOINT_EVERY === 0) checkpoints.push({ frame, hash: fingerprint(engine), ...summary(engine) });
    }
    return checkpoints;
  } finally {
    Math.random = hostRandom;
  }
}
