// Child-process side of sim/isolated.mjs. Reads one JSON job from stdin, runs
// it against the headless engine and prints one JSON result to stdout.
//
// Jobs:
//   { kind: 'inspect',  modules: [{ path, source }] }
//   { kind: 'playtest', modules, spec, stages, seconds, seed }
//
// Module sources are imported from data: URLs, so a module must be a single
// self-contained file (no import statements).
import { createModRuntime, MOD_HOOKS, STOCK_ENEMY_TYPES } from '../games/shared/mod-runtime.mjs';
import { ITEM_KINDS } from '../games/shared/game-spec.mjs';
import { playtestSpec } from './playtest.mjs';

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const job = JSON.parse(Buffer.concat(chunks).toString('utf8'));

async function loadModules(list = []) {
  const loaded = [], errors = [];
  for (const { path, source } of list) {
    try {
      const namespace = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(source));
      loaded.push(Object.assign(Object.create(null), namespace, { __file: path }));
    } catch (err) {
      errors.push({ where: path, message: String(err?.message || err).slice(0, 400) });
    }
  }
  return { loaded, errors };
}

const started = Date.now();
let result;
try {
  const { loaded, errors } = await loadModules(job.modules);
  if (job.kind === 'inspect') {
    const runtime = createModRuntime(loaded, { reserved: STOCK_ENEMY_TYPES, items: Object.keys(ITEM_KINDS) });
    result = {
      ok: !errors.length && !runtime.errors.length,
      errors: [...errors, ...runtime.errors.map(({ where, message }) => ({ where, message }))],
      enemies: [...runtime.enemies.values()].map(def => ({ type: def.type, name: def.name, hp: def.hp, score: def.score, box: def.box, spawn: def.spawn, drop: def.drop, contact: def.contact })),
      hooks: Object.fromEntries(Object.keys(MOD_HOOKS).map(name => [name, runtime.hooks[name].length])),
    };
  } else if (job.kind === 'playtest') {
    if (errors.length) result = { ok: false, error: '模块加载失败：' + errors.map(e => `${e.where}: ${e.message}`).join('；'), moduleErrors: errors, stages: [] };
    else result = playtestSpec(job.spec, { stages: job.stages, seconds: job.seconds, seed: job.seed, modules: loaded });
  } else result = { ok: false, error: `未知任务 ${job.kind}` };
} catch (err) {
  result = { ok: false, error: String(err?.message || err).slice(0, 600) };
}
result.ms = Date.now() - started;
process.stdout.write(JSON.stringify(result));
