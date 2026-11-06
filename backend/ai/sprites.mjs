// Post-processing for AI-generated sprites (sharp): key out the flat background
// the model was asked to paint, trim, optionally split a horizontal row of
// animation frames into equal cells, and scale to the requested in-game size.
//
//   processSprite(buffer, { width, height, frames, scale, background }) →
//     { png: Buffer, width, height, frameWidth, frames, keyed }
//
// `width`/`height` are the sprite's on-screen size in game pixels (the screen is
// 384×216). The PNG is stored `scale`× larger (default 4) so it stays crisp when
// the canvas is scaled up; modules draw it with game.sprite(g, img, x, y, w, h).
import sharp from 'sharp';

export const KEY_COLOR = { r: 255, g: 0, b: 255 };
const dist = (d, i, c) => Math.max(Math.abs(d[i] - c.r), Math.abs(d[i + 1] - c.g), Math.abs(d[i + 2] - c.b));

/** Most common colour on the image border (quantised), i.e. the background the model painted. */
function borderColor(data, w, h) {
  const counts = new Map();
  const add = (x, y) => {
    const i = (y * w + x) * 4;
    if (data[i + 3] < 128) return;
    const key = (data[i] >> 4) << 8 | (data[i + 1] >> 4) << 4 | data[i + 2] >> 4;
    const entry = counts.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    entry.n++; entry.r += data[i]; entry.g += data[i + 1]; entry.b += data[i + 2];
    counts.set(key, entry);
  };
  for (let x = 0; x < w; x++) { add(x, 0); add(x, h - 1); }
  for (let y = 0; y < h; y++) { add(0, y); add(w - 1, y); }
  let best = null;
  for (const e of counts.values()) if (!best || e.n > best.n) best = e;
  if (!best) return null;
  return { r: best.r / best.n, g: best.g / best.n, b: best.b / best.n, share: best.n / (2 * (w + h)) };
}

/**
 * Make the background transparent: flood fill from the border through pixels
 * close to the background colour, then soften the one-pixel fringe next to it
 * (anti-aliased edges and colour spill). Returns how many pixels were keyed.
 */
export function keyBackground(data, w, h, { tolerance = 70, fringe = 150 } = {}) {
  const bg = borderColor(data, w, h);
  if (!bg || bg.share < 0.5) return 0; // already transparent or no flat background
  const seen = new Uint8Array(w * h), stack = [];
  const push = (x, y) => { const p = y * w + x; if (!seen[p] && data[p * 4 + 3] >= 128 && dist(data, p * 4, bg) <= tolerance) { seen[p] = 1; stack.push(p); } };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  let keyed = 0;
  while (stack.length) {
    const p = stack.pop(), x = p % w, y = (p - x) / w;
    data[p * 4 + 3] = 0; keyed++;
    if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1);
  }
  // Fringe: opaque pixels touching the keyed area that still lean towards the background colour.
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (!data[i + 3] || seen[p]) continue;
    const x = p % w, y = (p - x) / w;
    const edge = (x > 0 && seen[p - 1]) || (x < w - 1 && seen[p + 1]) || (y > 0 && seen[p - w]) || (y < h - 1 && seen[p + w]);
    if (!edge) continue;
    const d = dist(data, i, bg);
    if (d < fringe) {
      data[i + 3] = Math.round(data[i + 3] * Math.max(0, (d - tolerance) / (fringe - tolerance)));
      // Remove the background tint so dark outlines don't turn pink.
      const k = 1 - d / fringe;
      for (const [c, v] of [[0, bg.r], [1, bg.g], [2, bg.b]]) data[i + c] = Math.max(0, Math.min(255, Math.round((data[i + c] - v * k) / (1 - k || 1))));
    }
  }
  return keyed;
}

/** Bounding box of pixels with alpha ≥ threshold inside [x0, x1). */
function bounds(data, w, h, x0 = 0, x1 = w, threshold = 24) {
  let minX = x1, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = x0; x < x1; x++) {
    if (data[(y * w + x) * 4 + 3] >= threshold) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * Split a horizontal row of poses into `frames` column ranges: find runs of
 * non-empty columns, then merge across the smallest gaps until there are exactly
 * `frames` runs. Falls back to equal slices when the poses touch.
 */
export function splitFrames(data, w, h, frames) {
  if (frames <= 1) return [{ x0: 0, x1: w }];
  const filled = [];
  for (let x = 0; x < w; x++) { let any = false; for (let y = 0; y < h && !any; y++) any = data[(y * w + x) * 4 + 3] >= 24; filled.push(any); }
  let runs = [];
  for (let x = 0; x < w; x++) if (filled[x]) { if (runs.length && runs.at(-1).x1 === x) runs.at(-1).x1 = x + 1; else runs.push({ x0: x, x1: x + 1 }); }
  runs = runs.filter(r => r.x1 - r.x0 >= 2);
  while (runs.length > frames) {
    let best = 1;
    for (let i = 1; i < runs.length; i++) if (runs[i].x0 - runs[i - 1].x1 < runs[best].x0 - runs[best - 1].x1) best = i;
    runs.splice(best - 1, 2, { x0: runs[best - 1].x0, x1: runs[best].x1 });
  }
  if (runs.length === frames) return runs;
  const all = bounds(data, w, h) || { x: 0, w };
  return Array.from({ length: frames }, (_, i) => ({ x0: Math.round(all.x + all.w * i / frames), x1: Math.round(all.x + all.w * (i + 1) / frames) }));
}

/** Full pipeline. Throws a Chinese error when nothing usable is left after keying. */
export async function processSprite(input, { width = 32, height = 32, frames = 1, scale = 4, background = 'key' } = {}) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const keyed = background === 'key' ? keyBackground(data, w, h) : 0;
  const slices = splitFrames(data, w, h, frames);
  const boxes = slices.map(s => bounds(data, w, h, s.x0, s.x1)).filter(Boolean);
  if (boxes.length !== slices.length) throw new Error('去背景后图片是空的（模型可能没有按要求画纯色背景）');
  // One shared scale for all frames so the animation doesn't wobble; frames are bottom-centre aligned.
  const cellW = Math.max(...boxes.map(b => b.w)), cellH = Math.max(...boxes.map(b => b.h));
  const outW = Math.max(1, Math.round(width * scale)), outH = Math.max(1, Math.round(height * scale));
  const fit = Math.min(outW / cellW, outH / cellH);
  const cells = await Promise.all(boxes.map(async b => {
    const tw = Math.max(1, Math.round(b.w * fit)), th = Math.max(1, Math.round(b.h * fit));
    const buf = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
      .extract({ left: b.x, top: b.y, width: b.w, height: b.h })
      .resize(tw, th, { kernel: 'lanczos3' }).png().toBuffer();
    return { buf, tw, th };
  }));
  const png = await sharp({ create: { width: outW * cells.length, height: outH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(cells.map((c, i) => ({ input: c.buf, left: i * outW + Math.round((outW - c.tw) / 2), top: outH - c.th })))
    .png({ compressionLevel: 9 }).toBuffer();
  return { png, width: outW * cells.length, height: outH, frameWidth: outW, frames: cells.length, keyed };
}

function parseHexColor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * Palette color replacement + HSL modulation for an existing sprite PNG.
 * `replace` is an optional array of `{ from: '#rrggbb', to: '#rrggbb', tolerance = 32 }`.
 */
export async function recolorSprite(input, { hue = 0, saturate = 1, brightness = 1, replace = [], keyBg = false, tolerance = 70 } = {}) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const keyed = keyBg ? keyBackground(data, w, h, { tolerance }) : 0;
  let replaced = 0;
  const rules = (Array.isArray(replace) ? replace : []).map(r => ({
    from: parseHexColor(r?.from), to: parseHexColor(r?.to), tol: Math.max(0, Math.min(255, Number(r?.tolerance ?? 32))),
  })).filter(r => r.from && r.to);
  if (rules.length) {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 8) continue;
      for (const rule of rules) {
        if (dist(data, i, rule.from) <= rule.tol) {
          data[i] = rule.to.r; data[i + 1] = rule.to.g; data[i + 2] = rule.to.b;
          replaced++; break;
        }
      }
    }
  }
  let pipeline = sharp(data, { raw: { width: w, height: h, channels: 4 } });
  const dh = Number(hue) || 0, ds = Number(saturate ?? 1), db = Number(brightness ?? 1);
  if (dh !== 0 || ds !== 1 || db !== 1) pipeline = pipeline.modulate({ hue: dh, saturation: ds, brightness: db });
  const png = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  return { png, width: w, height: h, replaced, keyed };
}

/**
 * Composite an AI-edited sprite into only the selected rectangular region of the original sprite,
 * preserving every pixel outside `region` ({ x, y, w, h } in pixels or { rx, ry, rw, rh } in 0..1).
 */
export async function compositeRegionEdit(originalInput, editedInput, region) {
  const orig = await sharp(originalInput).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = orig.info;
  const rx = region.rx !== undefined ? Math.round(region.rx * w) : Math.round(region.x || 0);
  const ry = region.ry !== undefined ? Math.round(region.ry * h) : Math.round(region.y || 0);
  const rw = region.rw !== undefined ? Math.round(region.rw * w) : Math.round(region.w || w);
  const rh = region.rh !== undefined ? Math.round(region.rh * h) : Math.round(region.h || h);
  const x0 = Math.max(0, Math.min(w - 1, rx)), y0 = Math.max(0, Math.min(h - 1, ry));
  const x1 = Math.max(x0 + 1, Math.min(w, x0 + rw)), y1 = Math.max(y0 + 1, Math.min(h, y0 + rh));
  const edited = await sharp(editedInput).ensureAlpha().resize(w, h, { fit: 'fill', kernel: 'nearest' }).raw().toBuffer();
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      orig.data[i] = edited[i]; orig.data[i + 1] = edited[i + 1]; orig.data[i + 2] = edited[i + 2]; orig.data[i + 3] = edited[i + 3];
    }
  }
  const png = await sharp(orig.data, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
  return { png, width: w, height: h, region: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } };
}

