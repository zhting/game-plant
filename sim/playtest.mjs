// Headless smoke playtest: boots the real engine with a GameSpec and plays each
// stage for a few seconds with a scripted run-and-gun input. Used to gate every
// AI change (a spec that crashes the engine or makes a stage unplayable is
// rejected before it is committed) and by the agent's `playtest` tool.
import { createHeadlessEngine } from './headless.mjs';

const RUN_AND_GUN = frame => ({
  KeyD: true, KeyJ: true,
  KeyK: frame % 50 < 6, // hop over low obstacles every ~0.8 s
});

/**
 * @param {object|undefined} spec GameSpec overrides
 * @param {{stages?: number[], seconds?: number, seed?: number}} [options]
 * @returns {{ok: boolean, stages: object[]}}
 */
export function playtestSpec(spec, { stages = [1], seconds = 10, seed = 1 } = {}) {
  const results = [];
  for (const stage of stages) {
    const result = { stage, ok: true };
    try {
      const e = createHeadlessEngine({ seed, spec, hostname: '' });
      e.play(stage);
      const startX = e.G.p.x, startLives = e.G.lives;
      let kills = 0, deaths = 0, wasDead = false;
      const frames = Math.round(seconds * 60);
      for (let f = 0; f < frames && e.G.mode === 'play'; f++) {
        const before = e.G.en.length;
        e.frames(1, RUN_AND_GUN(f));
        if (e.G.en.length < before) kills += before - e.G.en.length;
        if (e.G.p.dead && !wasDead) deaths++;
        wasDead = !!e.G.p.dead;
      }
      Object.assign(result, {
        mode: e.G.mode, seconds, distance: Math.round(e.G.p.x - startX), score: e.G.score,
        lives: e.G.lives, startLives, deaths, enemiesRemoved: kills, weapon: e.G.p.weapon,
      });
      if (e.G.mode !== 'play' && e.G.mode !== 'over') { result.ok = false; result.error = `游戏意外进入 ${e.G.mode} 状态`; }
    } catch (error) {
      result.ok = false;
      result.error = String(error?.message || error).split('\n').slice(0, 6).join('\n');
    }
    results.push(result);
  }
  return { ok: results.every(r => r.ok), stages: results };
}
