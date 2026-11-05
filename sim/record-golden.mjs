// Record golden replays for every open stage of both built-in games.
// Usage: npm run replay:record            (all)
//        npm run replay:record -- contra2026 3   (one stage)
// Re-record only when a gameplay change is intentional, and say so in the commit message.
import fs from 'node:fs';
import { OPEN_STAGES } from '../games/contra2026/js/release-stages.mjs';
import { WUKONG_STAGES } from '../games/wukong/js/release-stages.mjs';
import { runReplay, defaultScript } from './replay.mjs';

export const GOLDEN_DIR = new URL('./golden/', import.meta.url);
export const GOLDEN_CASES = [
  ...OPEN_STAGES.map(stage => ({ game: 'contra2026', stage })),
  ...WUKONG_STAGES.map(stage => ({ game: 'wukong', stage })),
];
export const goldenFile = ({ game, stage }) => new URL(`${game}-stage${stage}.json`, GOLDEN_DIR);

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const [onlyGame, onlyStage] = process.argv.slice(2);
  fs.mkdirSync(GOLDEN_DIR, { recursive: true });
  for (const item of GOLDEN_CASES) {
    if (onlyGame && item.game !== onlyGame) continue;
    if (onlyStage && item.stage !== Number(onlyStage)) continue;
    const seed = 20261105, script = defaultScript(20);
    const started = performance.now();
    const checkpoints = runReplay({ ...item, seed, script });
    fs.writeFileSync(goldenFile(item), JSON.stringify({ ...item, seed, script, checkpoints }, null, 1) + '\n');
    const last = checkpoints.at(-1);
    console.log(`${item.game} stage ${item.stage}: ${checkpoints.length} checkpoints, camX ${last.camX}, score ${last.score}, ${Math.round(performance.now() - started)} ms`);
  }
}
