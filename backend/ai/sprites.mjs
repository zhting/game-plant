// Post-processing for AI-generated sprites: key out the flat background
// the model was asked to paint, trim, optionally split a horizontal row of
// animation frames into equal cells, and scale to the requested in-game size.
//
// Uses `sharp` when available and transparently falls back to a built-in pure
// Node.js (`node:zlib`) PNG codec so `npm start` works even on machines where
// native `sharp` binaries were not installed.
import zlib from 'node:zlib';

let _sharp;
export async function getSharp() {
  if (_sharp !== undefined) return _sharp;
  try { _sharp = (await import('sharp')).default; } catch { _sharp = null; }
  return _sharp;
}

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** Pure Node.js RGBA buffer → PNG buffer encoder. */
export function encodePngRgba(data, width, height) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([PNG_SIG, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Decode a PNG buffer into `{ data: Buffer, width, height }` (uses sharp if installed, pure JS fallback otherwise). */
export async function decodePngRgba(input) {
  const sharp = await getSharp();
  if (sharp) {
    const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  }
  const buf = Buffer.from(input);
  let pos = 8, width = 0, height = 0, colorType = 6;
  const idats = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const chunk = buf.subarray(pos + 8, pos + 8 + len);
    pos += 12 + len;
    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      colorType = chunk[9];
    } else if (type === 'IDAT') idats.push(chunk);
    else if (type === 'IEND') break;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const unfiltered = Buffer.alloc(width * height * bpp);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const rowIn = y * (stride + 1) + 1;
    const rowOut = y * stride;
    for (let i = 0; i < stride; i++) {
      const x = raw[rowIn + i];
      const a = i >= bpp ? unfiltered[rowOut + i - bpp] : 0;
      const b = y > 0 ? unfiltered[rowOut - stride + i] : 0;
      const c = y > 0 && i >= bpp ? unfiltered[rowOut - stride + i - bpp] : 0;
      const v = filter === 1 ? x + a : filter === 2 ? x + b : filter === 3 ? x + ((a + b) >> 1) : filter === 4 ? x + paeth(a, b, c) : x;
      unfiltered[rowOut + i] = v & 255;
    }
  }
  if (bpp === 4) return { data: unfiltered, width, height };
  const rgba = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    rgba[p * 4] = unfiltered[p * 3];
    rgba[p * 4 + 1] = unfiltered[p * 3 + 1];
    rgba[p * 4 + 2] = unfiltered[p * 3 + 2];
    rgba[p * 4 + 3] = 255;
  }
  return { data: rgba, width, height };
}

/** Synthesize a 120×120 pixel-art sprite PNG on a #ff00ff key background without requiring sharp. */
export async function createMockSpritePng(prompt = '', isEdit = false) {
  let primary = [56, 216, 120], accent = [255, 224, 80], visor = [255, 64, 64];
  if (/银|机甲|蓝|冰|钢/.test(prompt)) { primary = [136, 216, 255]; accent = [232, 248, 255]; visor = [0, 229, 255]; }
  else if (/金|悟空|大圣|火|红|晚霞/.test(prompt)) { primary = [255, 184, 48]; accent = [255, 64, 32]; visor = [255, 240, 128]; }
  else if (/紫|怪鸟|暗|魔/.test(prompt)) { primary = [152, 72, 240]; accent = [255, 210, 74]; visor = [255, 56, 128]; }

  const w = 120, h = 120;
  const data = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = 255; data[i * 4 + 1] = 0; data[i * 4 + 2] = 255; data[i * 4 + 3] = 255;
  }
  const fillRect = (x0, y0, rw, rh, rgb, border = true) => {
    for (let y = Math.max(0, y0); y < Math.min(h, y0 + rh); y++) {
      for (let x = Math.max(0, x0); x < Math.min(w, x0 + rw); x++) {
        const edge = border && (x < x0 + 3 || x >= x0 + rw - 3 || y < y0 + 3 || y >= y0 + rh - 3);
        const c = edge ? [16, 16, 24] : rgb;
        const i = (y * w + x) * 4;
        data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
      }
    }
  };
  if (isEdit) {
    fillRect(28, 28, 64, 64, primary, true);
    fillRect(42, 42, 36, 18, visor, false);
    fillRect(40, 68, 40, 12, accent, false);
  } else {
    fillRect(42, 18, 36, 26, primary, true); // head
    fillRect(48, 26, 22, 8, visor, false);   // visor
    fillRect(38, 44, 44, 38, primary, true); // torso
    fillRect(46, 52, 28, 14, accent, false); // chest emblem
    fillRect(28, 48, 12, 24, accent, true);  // back pack / cape
    fillRect(78, 48, 18, 12, visor, true);   // weapon arm
    fillRect(42, 82, 14, 22, primary, true); // left leg
    fillRect(64, 82, 14, 22, primary, true); // right leg
  }
  return encodePngRgba(data, w, h);
}

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
  const { data, width: w, height: h } = await decodePngRgba(input);
  const keyed = background === 'key' ? keyBackground(data, w, h) : 0;
  const slices = splitFrames(data, w, h, frames);
  const boxes = slices.map(s => bounds(data, w, h, s.x0, s.x1)).filter(Boolean);
  if (boxes.length !== slices.length) throw new Error('去背景后图片是空的（模型可能没有按要求画纯色背景）');
  const cellW = Math.max(...boxes.map(b => b.w)), cellH = Math.max(...boxes.map(b => b.h));
  const outW = Math.max(1, Math.round(width * scale)), outH = Math.max(1, Math.round(height * scale));
  const fit = Math.min(outW / cellW, outH / cellH);

  const sharp = await getSharp();
  if (sharp) {
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

  // Pure JS fallback when sharp is unavailable
  const totalW = outW * boxes.length;
  const out = Buffer.alloc(totalW * outH * 4);
  boxes.forEach((b, idx) => {
    const tw = Math.max(1, Math.round(b.w * fit)), th = Math.max(1, Math.round(b.h * fit));
    const dstX0 = idx * outW + Math.round((outW - tw) / 2);
    const dstY0 = outH - th;
    for (let dy = 0; dy < th; dy++) {
      const sy = b.y + Math.min(b.h - 1, Math.floor(dy * b.h / th));
      for (let dx = 0; dx < tw; dx++) {
        const sx = b.x + Math.min(b.w - 1, Math.floor(dx * b.w / tw));
        const si = (sy * w + sx) * 4;
        const di = ((dstY0 + dy) * totalW + (dstX0 + dx)) * 4;
        out[di] = data[si]; out[di + 1] = data[si + 1]; out[di + 2] = data[si + 2]; out[di + 3] = data[si + 3];
      }
    }
  });
  return { png: encodePngRgba(out, totalW, outH), width: totalW, height: outH, frameWidth: outW, frames: boxes.length, keyed };
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
  const { data, width: w, height: h } = await decodePngRgba(input);
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
  const sharp = await getSharp();
  if (sharp) {
    let pipeline = sharp(data, { raw: { width: w, height: h, channels: 4 } });
    const dh = Number(hue) || 0, ds = Number(saturate ?? 1), db = Number(brightness ?? 1);
    if (dh !== 0 || ds !== 1 || db !== 1) pipeline = pipeline.modulate({ hue: dh, saturation: ds, brightness: db });
    const png = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    return { png, width: w, height: h, replaced, keyed };
  }
  return { png: encodePngRgba(data, w, h), width: w, height: h, replaced, keyed };
}

/**
 * Composite an AI-edited sprite into only the selected rectangular region of the original sprite,
 * preserving every pixel outside `region` ({ x, y, w, h } in pixels or { rx, ry, rw, rh } in 0..1).
 */
export async function compositeRegionEdit(originalInput, editedInput, region) {
  const orig = await decodePngRgba(originalInput);
  const { width: w, height: h } = orig;
  const rx = region.rx !== undefined ? Math.round(region.rx * w) : Math.round(region.x || 0);
  const ry = region.ry !== undefined ? Math.round(region.ry * h) : Math.round(region.y || 0);
  const rw = region.rw !== undefined ? Math.round(region.rw * w) : Math.round(region.w || w);
  const rh = region.rh !== undefined ? Math.round(region.rh * h) : Math.round(region.h || h);
  const x0 = Math.max(0, Math.min(w - 1, rx)), y0 = Math.max(0, Math.min(h - 1, ry));
  const x1 = Math.max(x0 + 1, Math.min(w, x0 + rw)), y1 = Math.max(y0 + 1, Math.min(h, y0 + rh));
  const ed = await decodePngRgba(editedInput);
  for (let y = y0; y < y1; y++) {
    const sy = Math.min(ed.height - 1, Math.floor(y * ed.height / h));
    for (let x = x0; x < x1; x++) {
      const sx = Math.min(ed.width - 1, Math.floor(x * ed.width / w));
      const si = (sy * ed.width + sx) * 4;
      const i = (y * w + x) * 4;
      orig.data[i] = ed.data[si]; orig.data[i + 1] = ed.data[si + 1]; orig.data[i + 2] = ed.data[si + 2]; orig.data[i + 3] = ed.data[si + 3];
    }
  }
  return { png: encodePngRgba(orig.data, w, h), width: w, height: h, region: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } };
}
