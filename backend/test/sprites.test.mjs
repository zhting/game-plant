import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { processSprite, keyBackground } from '../ai/sprites.mjs';
import { nearestRatio, spritePrompt } from '../ai/image-tool.mjs';
import { createProjectStore } from '../projects.mjs';
import { runAgentTurn, systemPrompt } from '../ai/agent.mjs';

const root = path.resolve(new URL('../../', import.meta.url).pathname);
const newStore = () => createProjectStore({ dir: path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sprite-test-')), 'projects'), templatesDir: path.join(root, 'templates') });

/** What an image model returns for "2 frames on magenta": a flat key background with two dark-outlined blobs. */
async function fakeSheet({ frames = 2, w = 600, h = 300, bg = { r: 255, g: 0, b: 255 }, fill = '#3a8a30' } = {}) {
  const shapes = [];
  for (let i = 0; i < frames; i++) {
    const x = Math.round(w * (i + 0.5) / frames);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="${100 + i * 10}"><ellipse cx="60" cy="${50 + i * 5}" rx="56" ry="${46 + i * 5}" fill="${fill}" stroke="#101010" stroke-width="6"/></svg>`;
    shapes.push({ input: Buffer.from(svg), left: x - 60, top: 80 });
  }
  return sharp({ create: { width: w, height: h, channels: 3, background: bg } }).composite(shapes).png().toBuffer();
}
const pixel = async (png, x, y) => { const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); const i = (y * info.width + x) * 4; return [...data.subarray(i, i + 4)]; };

test('sprite pipeline: keys the flat background, splits frames into equal cells and scales to game size ×4', async () => {
  const out = await processSprite(await fakeSheet({ frames: 2 }), { width: 20, height: 16, frames: 2, scale: 4 });
  assert.deepEqual([out.width, out.height, out.frameWidth, out.frames], [160, 64, 80, 2]);
  assert.ok(out.keyed > 0);
  assert.equal((await pixel(out.png, 0, 0))[3], 0, 'corner is transparent');
  assert.equal((await pixel(out.png, 79, 2))[3], 0, 'gap between frames is transparent');
  for (const cx of [40, 120]) {
    const [r, g, b, a] = await pixel(out.png, cx, 50);
    assert.equal(a, 255); assert.ok(g > r && g > b, `frame body keeps its colour at x=${cx}`);
  }
  // Frames share one scale and sit on the same baseline (bottom row has content in both cells).
  const bottom = await Promise.all([40, 120].map(x => pixel(out.png, x, 63)));
  assert.ok(bottom.every(p => p[3] > 0));
  // No pink fringe left around the outline.
  const { data } = await sharp(out.png).raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 200) assert.ok(!(data[i] > 200 && data[i + 2] > 200 && data[i + 1] < 80), 'no opaque magenta pixels');
});

test('sprite pipeline: transparent input is left alone, an all-background image is rejected', async () => {
  const raw = Buffer.alloc(8 * 8 * 4);
  assert.equal(keyBackground(raw, 8, 8), 0);
  const empty = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#ff00ff' } }).png().toBuffer();
  await assert.rejects(processSprite(empty, { width: 16, height: 16 }), /空的/);
});

test('image prompt helpers: aspect ratio follows the frame row, prompt asks for the key colour and frames', () => {
  assert.equal(nearestRatio(32, 32), '1:1');
  assert.equal(nearestRatio(4 * 24, 24), '21:9');
  assert.equal(nearestRatio(2 * 24, 24), '16:9');
  assert.equal(nearestRatio(20, 40), '9:16');
  const prompt = spritePrompt({ prompt: '紫色怪鸟', frames: 3, width: 24, height: 16 });
  assert.match(prompt, /#FF00FF/); assert.match(prompt, /exactly 3 animation frames/); assert.match(prompt, /facing LEFT/);
  assert.match(spritePrompt({ prompt: 'make it red', frames: 1, width: 24, height: 16, edit: true }), /^Edit this game sprite/);
  assert.match(systemPrompt(), /image_gen/);
});

test('agent image_gen: generates with the style reference, saves the asset as a version and shows the model a preview', async () => {
  const store = newStore();
  await store.create({ id: 'art' });
  const imageCalls = [], requests = [];
  const script = [
    { calls: [{ name: 'image_gen', args: { name: 'dive-bird.png', prompt: '紫色机械怪鸟', width: 24, height: 16, frames: 2, summary: '生成怪鸟图片' } }] },
    { calls: [{ name: 'image_gen', args: { name: 'dive-bird.png', source: 'dive-bird.png', prompt: '改成红色', width: 24, height: 16, frames: 2, summary: '怪鸟改成红色' } }] },
    { calls: [{ name: 'image_gen', args: { name: 'Bad Name.png', prompt: 'x', width: 8, height: 8, summary: 'x' } }] },
    { text: '画好了' },
  ];
  const llm = {
    async generate(request) {
      requests.push(structuredClone(request.contents));
      const next = script.shift();
      const parts = next.calls ? next.calls.map((c, i) => ({ functionCall: { id: `c${requests.length}-${i}`, ...c } })) : [{ text: next.text }];
      return { content: { role: 'model', parts }, functionCalls: parts.filter(p => p.functionCall).map(p => p.functionCall), text: next.text || '' };
    },
    async image(request) { imageCalls.push(request); return { data: await fakeSheet({ frames: 2, fill: imageCalls.length > 1 ? '#c03020' : '#3a8a30' }), mimeType: 'image/png', text: '' }; },
  };
  const config = { image: { styleRef: 'games/contra2026/assets/stage1/commando-run-enemy-hd.webp', scale: 4 } };
  const turn = await runAgentTurn({ llm, config, store, projectId: 'art', message: '给怪鸟画一张图' });
  assert.equal(turn.reply, '画好了');
  assert.deepEqual(turn.steps.map(s => s.ok), [true, true, false]);
  assert.equal(turn.changes.length, 2);

  assert.equal(imageCalls[0].images.length, 1, 'new sprites use the game style reference');
  assert.equal(imageCalls[0].aspectRatio, '21:9');
  assert.match(imageCalls[0].prompt, /紫色机械怪鸟/);
  assert.match(imageCalls[1].prompt, /^Edit this game sprite: 改成红色/);
  assert.equal((await sharp(imageCalls[1].images[0].data).metadata()).width, 192, 'edits send the existing asset');

  const saved = await store.readFile('art', 'assets/dive-bird.png');
  assert.deepEqual([(await sharp(saved).metadata()).width, (await sharp(saved).metadata()).height], [192, 64]);
  assert.deepEqual((await store.history('art')).slice(0, 2).map(v => v.message), ['怪鸟改成红色', '生成怪鸟图片']);

  const response = requests[1].at(-1).parts[0].functionResponse;
  assert.equal(response.response.ok, true);
  assert.equal(response.response._images, undefined);
  assert.match(response.response.usage, /game\.sprite\(g, img, e\.x - 12, e\.y - 8, 24, 16, \{ flip: e\.face > 0, frame: e\.age \* 10, frames: 2 \}\)/);
  assert.equal(response.parts[0].inlineData.mimeType, 'image/png');
  assert.ok(response.parts[0].inlineData.data.length > 100, 'preview is sent back as a multimodal function response');
  assert.match(requests[3].at(-1).parts[0].functionResponse.response.error, /小写英文名/);
});

test('agent image_gen without an image model reports a clear error', async () => {
  const store = newStore();
  await store.create({ id: 'noimg' });
  const script = [{ calls: [{ name: 'image_gen', args: { name: 'a.png', prompt: 'x', width: 8, height: 8, summary: 'x' } }] }, { text: 'ok' }];
  let seen;
  const llm = { async generate(r) { seen = r.contents.at(-1); const n = script.shift(); const parts = n.calls ? n.calls.map(c => ({ functionCall: c })) : [{ text: n.text }]; return { content: { role: 'model', parts }, functionCalls: parts.filter(p => p.functionCall).map(p => p.functionCall), text: n.text || '' }; } };
  await runAgentTurn({ llm, store, projectId: 'noimg', message: 'x' });
  assert.match(seen.parts[0].functionResponse.response.error, /图片生成没有配置/);
});
