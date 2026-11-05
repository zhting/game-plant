// image_gen tool: generate (or edit) a game sprite with the Gemini image model,
// post-process it (backend/ai/sprites.mjs) and save it to the project's assets/.
// The result carries a small preview image so the agent can look at what it got.
import fs from 'node:fs';
import sharp from 'sharp';
import { KEY_COLOR, processSprite } from './sprites.mjs';

const REPO = new URL('../../', import.meta.url);
export const ASSET_NAME = /^[a-z][a-z0-9-]{0,39}\.png$/;
const RATIOS = [[1, 1], [3, 2], [2, 3], [4, 3], [3, 4], [16, 9], [9, 16], [21, 9]];
const clamp = (v, lo, hi, d) => Math.min(hi, Math.max(lo, Math.round(Number(v) || d)));

/** Closest aspect ratio the image model supports. */
export function nearestRatio(w, h) {
  const target = Math.log(w / h);
  let best = RATIOS[0];
  for (const r of RATIOS) if (Math.abs(Math.log(r[0] / r[1]) - target) < Math.abs(Math.log(best[0] / best[1]) - target)) best = r;
  return `${best[0]}:${best[1]}`;
}

export function spritePrompt({ prompt, frames, width, height, edit }) {
  const key = 'solid flat pure magenta (#FF00FF) background filling the whole image, no gradient, no floor, no shadow';
  const lines = edit ? [
    `Edit this game sprite: ${prompt}.`,
    `Keep the same character, size, side-view angle and art style unless asked otherwise. ${frames > 1 ? `Keep the ${frames} poses in one horizontal row.` : ''}`,
    `Output on a ${key}.`,
  ] : [
    `A game sprite of: ${prompt}.`,
    'Art style: match the reference image (only its style, not its content) — 1990s arcade run-and-gun (Contra / Metal Slug) hand-painted sprite, bold dark outline, saturated colours, cel shading, strong readable silhouette.',
    `Strict side view facing LEFT, the whole subject visible, centred, nothing cropped. In game it is about ${width}×${height} pixels on a 384×216 screen, so keep shapes chunky and readable.`,
    frames > 1
      ? `Draw exactly ${frames} animation frames of the same subject in ONE horizontal row, evenly spaced with clear empty gaps between them, same size and baseline, each frame a small step of a looping animation.`
      : 'Draw a single pose.',
    `Use a ${key}. Do not use magenta or pink anywhere on the subject. No text, no frame, no border.`,
  ];
  return lines.filter(Boolean).join('\n');
}

let styleRefCache = null;
async function styleReference(config) {
  const rel = config?.image?.styleRef;
  if (!rel) return null;
  if (!styleRefCache || styleRefCache.rel !== rel) {
    const data = await sharp(fs.readFileSync(new URL(rel, REPO))).resize(512, 512, { fit: 'inside' }).png().toBuffer();
    styleRefCache = { rel, image: { mimeType: 'image/png', data } };
  }
  return styleRefCache.image;
}

/** Preview for the model: sprite on a neutral checker-free grey so transparency is visible. */
async function previewOf(png) {
  const data = await sharp(png).resize(320, 160, { fit: 'inside', kernel: 'nearest', withoutEnlargement: false })
    .flatten({ background: '#6b7280' }).png().toBuffer();
  return { mimeType: 'image/png', data };
}

/**
 * Run image_gen. `llm.image` does the generation; `store` saves the asset.
 * @returns tool result; `_images` is turned into functionResponse.parts by the agent loop.
 */
export async function runImageTool({ llm, store, projectId, args, changes, config }) {
  if (!llm?.image) return { ok: false, error: '图片生成没有配置（需要 GEMINI_API_KEY 和 models.image）' };
  const name = String(args.name || '').replace(/^assets\//, '');
  if (!ASSET_NAME.test(name)) return { ok: false, error: 'name 需要是 <小写英文名>.png，例如 dive-bird.png' };
  const prompt = String(args.prompt || '').trim().slice(0, 1200);
  if (!prompt) return { ok: false, error: '缺少 prompt（要画什么）' };
  const width = clamp(args.width, 6, 192, 32), height = clamp(args.height, 6, 160, 32), frames = clamp(args.frames, 1, 8, 1);
  const source = args.source ? String(args.source).replace(/^assets\//, '') : '';
  const images = [];
  if (source) {
    if (!ASSET_NAME.test(source)) return { ok: false, error: 'source 需要是项目 assets/ 里已有的 png' };
    let buf;
    try { buf = await store.readFile(projectId, `assets/${source}`); } catch { return { ok: false, error: `assets/${source} 不存在` }; }
    // Put the transparent sprite on the key colour so the model keeps the same background convention.
    images.push({ mimeType: 'image/png', data: await sharp(buf).flatten({ background: KEY_COLOR }).png().toBuffer() });
  } else {
    const ref = await styleReference(config);
    if (ref) images.push(ref);
  }
  const generated = await llm.image({
    prompt: spritePrompt({ prompt, frames, width, height, edit: !!source }),
    images, aspectRatio: nearestRatio(width * frames, height), pro: args.quality === 'pro',
  });
  const sprite = await processSprite(generated.data, { width, height, frames, scale: config?.image?.scale || 4 });
  const result = await store.writeFiles(projectId, [{ path: `assets/${name}`, content: sprite.png }], String(args.summary || `${source ? '修改' : '生成'}图片 ${name}`).slice(0, 120));
  if (result.changed) changes.push({ commit: result.commit, message: args.summary || `生成图片 ${name}` });
  return {
    ok: true, commit: result.commit.slice(0, 7), path: `assets/${name}`,
    size: { width, height }, frames: sprite.frames, pixels: { width: sprite.width, height: sprite.height, frameWidth: sprite.frameWidth },
    backgroundRemoved: sprite.keyed > 0,
    usage: `const img = game.image('${name}'); game.sprite(g, img, e.x - ${width / 2}, e.y - ${height / 2}, ${width}, ${height}, { flip: e.face > 0${sprite.frames > 1 ? `, frame: e.age * 10, frames: ${sprite.frames}` : ''} })`,
    note: '附带的预览图是处理后的结果（灰底=透明）。不满意可以用 source 参数在它的基础上修改，或换个描述重新生成。',
    _images: [await previewOf(sprite.png)],
  };
}
