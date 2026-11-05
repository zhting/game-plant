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
 * @param {{stages?: number[], seconds?: number, seed?: number, modules?: Array<Function|object>}} [options]
 *   modules: project code modules (setup functions or namespaces); their runtime errors fail the playtest.
 * @returns {{ok: boolean, stages: object[]}}
 */
export function playtestSpec(spec, { stages = [1], seconds = 10, seed = 1, modules = undefined } = {}) {
  const results = [];
  for (const stage of stages) {
    const result = { stage, ok: true };
    try {
      const e = createHeadlessEngine({ seed, spec, hostname: '', modules: modules?.length ? { modules } : undefined });
      e.play(stage);
      const custom = new Map(), seen = new WeakSet(), tracked = new Set();
      const startX = e.G.p.x, startLives = e.G.lives;
      let kills = 0, deaths = 0, wasDead = false;
      const frames = Math.round(seconds * 60);
      for (let f = 0; f < frames && e.G.mode === 'play'; f++) {
        const before = e.G.en.length;
        e.frames(1, RUN_AND_GUN(f));
        if (e.G.en.length < before) kills += before - e.G.en.length;
        if (e.MOD.enemies.size) {
          const alive = new Set(e.G.en);
          for (const enemy of tracked) if (!alive.has(enemy)) { tracked.delete(enemy); if (enemy.hp <= 0) custom.get(enemy.t).killed++; }
          for (const enemy of e.G.en) {
            if (!enemy.mod || seen.has(enemy)) continue;
            seen.add(enemy); tracked.add(enemy);
            const stat = custom.get(enemy.t) || { spawned: 0, killed: 0 };
            stat.spawned++; custom.set(enemy.t, stat);
          }
          if (f % 30 === 0) e.render(); // exercise module draw code too
        } else if (e.MOD.active && f % 30 === 0) e.render();
        if (e.G.p.dead && !wasDead) deaths++;
        wasDead = !!e.G.p.dead;
      }
      Object.assign(result, {
        mode: e.G.mode, seconds, distance: Math.round(e.G.p.x - startX), score: e.G.score,
        lives: e.G.lives, startLives, deaths, enemiesRemoved: kills, weapon: e.G.p.weapon,
      });
      if (custom.size) result.customEnemies = Object.fromEntries(custom);
      if (e.G.mode !== 'play' && e.G.mode !== 'over') { result.ok = false; result.error = `游戏意外进入 ${e.G.mode} 状态`; }
      if (e.MOD.errors.length) {
        result.ok = false;
        result.moduleErrors = e.MOD.errors.map(({ where, message, stack }) => ({ where, message, stack }));
        result.error = '模块代码出错：' + e.MOD.errors.map(err => `${err.where}: ${err.message}`).join('；');
      }
    } catch (error) {
      result.ok = false;
      result.error = String(error?.message || error).split('\n').slice(0, 6).join('\n');
    }
    results.push(result);
  }
  const failed = results.filter(r => !r.ok);
  return failed.length
    ? { ok: false, error: failed.map(r => `第 ${r.stage} 关：${r.error}`).join('\n'), stages: results }
    : { ok: true, stages: results };
}
