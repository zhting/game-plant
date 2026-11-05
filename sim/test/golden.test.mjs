import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GOLDEN_CASES, goldenFile } from '../record-golden.mjs';
import { runReplay, canonicalState } from '../replay.mjs';
import { createHeadlessEngine } from '../headless.mjs';

test('headless engine boots both games and advances fixed frames', () => {
  for (const game of ['contra2026', 'wukong']) {
    const e = createHeadlessEngine({ game, seed: 1 });
    if (game === 'wukong') e.primeResources(1);
    e.play(1);
    const x = e.G.p.x;
    e.frames(60, { KeyD: true });
    assert.equal(e.G.mode, 'play', game);
    assert.ok(e.G.p.x > x, `${game}: player moves right`);
  }
});

test('canonical state is stable for engine objects', () => {
  const e = createHeadlessEngine({ seed: 1 });
  e.play(1);
  assert.deepEqual(canonicalState(e.G), canonicalState(e.G));
});

// Frame-exact regression guard: if one of these fails after an engine change that was meant
// to keep gameplay identical, the change altered behaviour. If the change was intentional,
// re-record with `npm run replay:record -- <game> <stage>` and explain why in the commit.
for (const item of GOLDEN_CASES) {
  const file = goldenFile(item);
  test(`golden replay ${item.game} stage ${item.stage}`, { skip: !fs.existsSync(file) && 'not recorded' }, () => {
    const golden = JSON.parse(fs.readFileSync(file, 'utf8'));
    const actual = runReplay({ game: golden.game, stage: golden.stage, seed: golden.seed, script: golden.script });
    for (let i = 0; i < golden.checkpoints.length; i++) {
      const want = golden.checkpoints[i], got = actual[i];
      assert.deepEqual(got, want, `${item.game} stage ${item.stage} diverged at frame ${want.frame}`);
    }
  });
}
