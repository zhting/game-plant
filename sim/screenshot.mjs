// Headless screenshot renderer: runs the real engine in VM (sim/headless.mjs),
// records the Canvas 2D frame (stage art + module draw() + game.sprite() PNG
// assets + drawScreen hooks) into an SVG, and rasterises it with sharp.
//
// The SVG recording step uses no native addons, so it runs inside the
// `node --permission` isolated worker (sim/worker.mjs); the parent process
// converts the returned SVG to a PNG buffer.
import { createHeadlessEngine } from './headless.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r2 = n => Math.round((Number(n) || 0) * 100) / 100;

/** Read width and height from a PNG buffer's IHDR chunk (bytes 16..24). */
export function pngDimensions(buf) {
  if (!buf || buf.length < 24 || buf[0] !== 0x89 || buf[1] !== 0x50) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Create a Canvas 2D recorder that serialises drawing calls into SVG elements. */
export function createSvgRecorder() {
  let nextId = 1;
  const defs = new Map();
  const canvases = [];

  function makeCanvas(w = 384, h = 216) {
    const canvas = {
      width: w, height: h, _els: [], _clips: 0,
      hidden: true, value: '1', style: { setProperty() {} }, clientWidth: w, clientHeight: h,
      classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
      addEventListener() {}, setAttribute() {}, getAttribute: () => null,
      querySelector: () => null, querySelectorAll: () => [],
      getBoundingClientRect: () => ({ left: 0, top: 0, width: w, height: h }),
      focus() {}, blur() {},
    };
    const defaultState = () => ({
      a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
      alpha: 1, fillStyle: '#000000', strokeStyle: '#000000',
      lineWidth: 1, lineCap: 'butt', lineJoin: 'miter',
      font: '700 8px sans-serif', textAlign: 'left', textBaseline: 'alphabetic',
      clips: 0,
    });
    let st = defaultState();
    const stack = [];
    let path = '';

    const isIdentity = () => st.a === 1 && st.b === 0 && st.c === 0 && st.d === 1 && st.e === 0 && st.f === 0;
    const isTranslateOnly = () => st.a === 1 && st.b === 0 && st.c === 0 && st.d === 1;
    const xformAttr = () => isIdentity() ? '' : isTranslateOnly() ? ` transform="translate(${r2(st.e)} ${r2(st.f)})"` : ` transform="matrix(${r2(st.a)} ${r2(st.b)} ${r2(st.c)} ${r2(st.d)} ${r2(st.e)} ${r2(st.f)})"`;
    const alphaAttr = () => st.alpha < 0.995 ? ` opacity="${r2(Math.max(0, st.alpha))}"` : '';
    const paint = style => typeof style === 'object' && style?._ref ? style._ref : esc(style || '#000');

    const ctx = {
      canvas,
      imageSmoothingEnabled: true, imageSmoothingQuality: 'high', filter: 'none', globalCompositeOperation: 'source-over',
      get fillStyle() { return st.fillStyle; }, set fillStyle(v) { st.fillStyle = v; },
      get strokeStyle() { return st.strokeStyle; }, set strokeStyle(v) { st.strokeStyle = v; },
      get globalAlpha() { return st.alpha; }, set globalAlpha(v) { if (Number.isFinite(v)) st.alpha = Math.max(0, Math.min(1, v)); },
      get lineWidth() { return st.lineWidth; }, set lineWidth(v) { if (Number.isFinite(v) && v > 0) st.lineWidth = v; },
      get lineCap() { return st.lineCap; }, set lineCap(v) { st.lineCap = v; },
      get lineJoin() { return st.lineJoin; }, set lineJoin(v) { st.lineJoin = v; },
      get font() { return st.font; }, set font(v) { st.font = String(v); },
      get textAlign() { return st.textAlign; }, set textAlign(v) { st.textAlign = v; },
      get textBaseline() { return st.textBaseline; }, set textBaseline(v) { st.textBaseline = v; },

      save() { stack.push({ ...st, clips: 0 }); },
      restore() {
        while (st.clips > 0) { canvas._els.push('</g>'); st.clips--; canvas._clips--; }
        if (stack.length) st = stack.pop();
      },
      setTransform(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) {
        st.a = a; st.b = b; st.c = c; st.d = d; st.e = e; st.f = f;
      },
      resetTransform() { st.a = 1; st.b = 0; st.c = 0; st.d = 1; st.e = 0; st.f = 0; },
      transform(a2, b2, c2, d2, e2, f2) {
        const { a, b, c, d, e, f } = st;
        st.a = a * a2 + c * b2; st.b = b * a2 + d * b2;
        st.c = a * c2 + c * d2; st.d = b * c2 + d * d2;
        st.e = a * e2 + c * f2 + e; st.f = b * e2 + d * f2 + f;
      },
      translate(tx, ty) { ctx.transform(1, 0, 0, 1, tx, ty); },
      scale(sx, sy) { ctx.transform(sx, 0, 0, sy, 0, 0); },
      rotate(rad) { const cos = Math.cos(rad), sin = Math.sin(rad); ctx.transform(cos, sin, -sin, cos, 0, 0); },

      clearRect(x, y, w, h) {
        if (x <= 0 && y <= 0 && w >= canvas.width && h >= canvas.height && !st.clips) canvas._els.length = 0;
      },
      fillRect(x, y, w, h) {
        if (!(w > 0 && h > 0) || st.alpha <= 0.01) return;
        // Skip sub-pixel procedural grain (< 0.6 px thick slivers) so terrain/water caches stay compact.
        if (w * h < 1.2 && (w < 0.6 || h < 0.6)) return;
        // A full-screen opaque solid fill (stage background) starts a fresh frame on that surface.
        if (x <= 0 && y <= 0 && w >= 384 && h >= 216 && st.alpha >= 0.995 && !st.clips && typeof st.fillStyle === 'string' && !st.fillStyle.startsWith('rgba(')) {
          canvas._els.length = 0;
        }
        if (isTranslateOnly()) {
          canvas._els.push(`<rect x="${r2(x + st.e)}" y="${r2(y + st.f)}" width="${r2(w)}" height="${r2(h)}" fill="${paint(st.fillStyle)}"${alphaAttr()}/>`);
        } else {
          canvas._els.push(`<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${paint(st.fillStyle)}"${alphaAttr()}${xformAttr()}/>`);
        }
      },
      strokeRect(x, y, w, h) {
        if (!(w > 0 && h > 0) || st.alpha <= 0.01) return;
        canvas._els.push(`<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="none" stroke="${paint(st.strokeStyle)}" stroke-width="${r2(st.lineWidth)}"${alphaAttr()}${xformAttr()}/>`);
      },

      beginPath() { path = ''; },
      closePath() { path += 'Z'; },
      moveTo(x, y) { path += `M${r2(x)} ${r2(y)}`; },
      lineTo(x, y) { path += `L${r2(x)} ${r2(y)}`; },
      quadraticCurveTo(cpx, cpy, x, y) { path += `Q${r2(cpx)} ${r2(cpy)} ${r2(x)} ${r2(y)}`; },
      bezierCurveTo(x1, y1, x2, y2, x, y) { path += `C${r2(x1)} ${r2(y1)} ${r2(x2)} ${r2(y2)} ${r2(x)} ${r2(y)}`; },
      rect(x, y, w, h) { path += `M${r2(x)} ${r2(y)}h${r2(w)}v${r2(h)}h${r2(-w)}Z`; },
      roundRect(x, y, w, h) { ctx.rect(x, y, w, h); },
      setLineDash() {},
      getLineDash: () => [],
      arc(x, y, r, a0 = 0, a1 = Math.PI * 2, ccw = false) {
        ctx.ellipse(x, y, r, r, 0, a0, a1, ccw);
      },
      ellipse(x, y, rx, ry, rot = 0, a0 = 0, a1 = Math.PI * 2, ccw = false) {
        if (!(rx > 0 && ry > 0)) return;
        const span = ccw ? a0 - a1 : a1 - a0;
        if (Math.abs(span) >= Math.PI * 2 - 1e-3) {
          const dx = rx * Math.cos(rot), dy = rx * Math.sin(rot);
          path += `M${r2(x - dx)} ${r2(y - dy)}A${r2(rx)} ${r2(ry)} ${r2(rot * 180 / Math.PI)} 1 0 ${r2(x + dx)} ${r2(y + dy)}A${r2(rx)} ${r2(ry)} ${r2(rot * 180 / Math.PI)} 1 0 ${r2(x - dx)} ${r2(y - dy)}Z`;
          return;
        }
        const pt = a => {
          const px = rx * Math.cos(a), py = ry * Math.sin(a);
          return [x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)];
        };
        const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
        const norm = ((span % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const large = norm > Math.PI ? 1 : 0, sweep = ccw ? 0 : 1;
        path += `${path ? 'L' : 'M'}${r2(x0)} ${r2(y0)}A${r2(rx)} ${r2(ry)} ${r2(rot * 180 / Math.PI)} ${large} ${sweep} ${r2(x1)} ${r2(y1)}`;
      },
      fill() {
        if (!path || st.alpha <= 0.01) return;
        // On 128x216 terrain tiles, skip the 6 per-cell rgba bevel overlays so each rock cell is 1 polygon instead of 7.
        if (canvas.width === 256 && canvas.height === 432 && typeof st.fillStyle === 'string' && st.fillStyle.startsWith('rgba(')) return;
        canvas._els.push(`<path d="${path}" fill="${paint(st.fillStyle)}"${alphaAttr()}${xformAttr()}/>`);
      },
      stroke() {
        if (!path || st.alpha <= 0.01) return;
        if (canvas.width === 256 && canvas.height === 432 && st.lineWidth < 0.35) return;
        canvas._els.push(`<path d="${path}" fill="none" stroke="${paint(st.strokeStyle)}" stroke-width="${r2(st.lineWidth)}" stroke-linecap="${st.lineCap}" stroke-linejoin="${st.lineJoin}"${alphaAttr()}${xformAttr()}/>`);
      },
      clip() {
        if (!path || canvas.width < 384) return;
        const id = `c${nextId++}`;
        defs.set(id, `<clipPath id="${id}"><path d="${path}"${xformAttr()}/></clipPath>`);
        canvas._els.push(`<g clip-path="url(#${id})">`);
        st.clips++; canvas._clips++;
      },

      measureText: text => ({ width: String(text).length * 5.5 }),
      fillText(text, x, y) {
        if (st.alpha <= 0.01) return;
        const size = Number((/(\d+(?:\.\d+)?)px/.exec(st.font) || [])[1]) || 8;
        const anchor = st.textAlign === 'center' ? 'middle' : st.textAlign === 'right' || st.textAlign === 'end' ? 'end' : 'start';
        const dy = st.textBaseline === 'top' ? size * 0.85 : st.textBaseline === 'middle' ? size * 0.35 : 0;
        canvas._els.push(`<text x="${r2(x)}" y="${r2(y + dy)}" fill="${paint(st.fillStyle)}" font-family="DejaVu Sans,Noto Sans CJK SC,sans-serif" font-weight="700" font-size="${r2(size)}" text-anchor="${anchor}"${alphaAttr()}${xformAttr()}>${esc(text)}</text>`);
      },
      strokeText() {},

      createLinearGradient(x0, y0, x1, y1) {
        const id = `g${nextId++}`, stops = [];
        const grad = {
          _ref: `url(#${id})`,
          addColorStop(offset, color) {
            stops.push(`<stop offset="${r2(offset * 100)}%" stop-color="${esc(color)}"/>`);
            defs.set(id, `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r2(x0)}" y1="${r2(y0)}" x2="${r2(x1)}" y2="${r2(y1)}">${stops.join('')}</linearGradient>`);
          },
        };
        return grad;
      },
      createRadialGradient(x0, y0, r0, x1, y1, r1) {
        const id = `g${nextId++}`, stops = [];
        const grad = {
          _ref: `url(#${id})`,
          addColorStop(offset, color) {
            stops.push(`<stop offset="${r2(offset * 100)}%" stop-color="${esc(color)}"/>`);
            defs.set(id, `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${r2(x1)}" cy="${r2(y1)}" r="${r2(Math.max(0.1, r1))}" fx="${r2(x0)}" fy="${r2(y0)}">${stops.join('')}</radialGradient>`);
          },
        };
        return grad;
      },

      drawImage(img, ...args) {
        if (!img || st.alpha <= 0.01) return;
        const iw = img.naturalWidth || img.width || 0, ih = img.naturalHeight || img.height || 0;
        let sx = 0, sy = 0, sw = iw, sh = ih, dx = 0, dy = 0, dw = iw, dh = ih;
        if (args.length === 2) { [dx, dy] = args; }
        else if (args.length === 4) { [dx, dy, dw, dh] = args; }
        else if (args.length >= 8) { [sx, sy, sw, sh, dx, dy, dw, dh] = args; }
        if (!(dw > 0 && dh > 0 && sw > 0 && sh > 0)) return;
        if (img._els) {
          if (!img._els.length) return;
          const body = img._els.join('') + '</g>'.repeat(img._clips || 0);
          const scaleX = dw / sw, scaleY = dh / sh;
          // Cached offscreen tiles (terrainChunk, grass, etc.) are defined once in <defs> and referenced via <use>.
          let content;
          if (iw < 768 || ih < 432) {
            if (!img._defId || img._defLen !== img._els.length || !defs.has(img._defId)) {
              img._defId = `s${nextId++}`;
              img._defLen = img._els.length;
              defs.set(img._defId, `<g id="${img._defId}">${body}</g>`);
            }
            content = `<use href="#${img._defId}"/>`;
          } else {
            content = body;
          }
          const inner = sx === 0 && sy === 0 && Math.abs(scaleX - 1) < 1e-3 && Math.abs(scaleY - 1) < 1e-3
            ? (dx === 0 && dy === 0 ? content : `<g transform="translate(${r2(dx)} ${r2(dy)})">${content}</g>`)
            : `<g transform="translate(${r2(dx)} ${r2(dy)}) scale(${r2(scaleX)} ${r2(scaleY)}) translate(${r2(-sx)} ${r2(-sy)})">${content}</g>`;
          canvas._els.push(xformAttr() || alphaAttr() ? `<g${alphaAttr()}${xformAttr()}>${inner}</g>` : inner);
          return;
        }
        if (img._dataUri) {
          const cropped = sx !== 0 || sy !== 0 || Math.abs(sw - iw) > 0.5 || Math.abs(sh - ih) > 0.5;
          const el = cropped
            ? `<svg x="${r2(dx)}" y="${r2(dy)}" width="${r2(dw)}" height="${r2(dh)}" viewBox="${r2(sx)} ${r2(sy)} ${r2(sw)} ${r2(sh)}" preserveAspectRatio="none"><image href="${img._dataUri}" width="${iw}" height="${ih}" style="image-rendering:pixelated"/></svg>`
            : `<image href="${img._dataUri}" x="${r2(dx)}" y="${r2(dy)}" width="${r2(dw)}" height="${r2(dh)}" preserveAspectRatio="none" style="image-rendering:pixelated"/>`;
          canvas._els.push(xformAttr() || alphaAttr() ? `<g${alphaAttr()}${xformAttr()}>${el}</g>` : el);
        }
      },
      getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }),
      putImageData() {},
    };
    const proxy = new Proxy(ctx, { get: (o, k) => k in o ? o[k] : () => {}, set: (o, k, v) => (o[k] = v, true) });
    canvas.getContext = () => proxy;
    canvases.push(canvas);
    return canvas;
  }

  return {
    makeCanvas,
    resetAll() {
      defs.clear();
      for (const c of canvases) { c._els.length = 0; c._clips = 0; c._defId = null; }
    },
    toSvg(cv, { overlay = '', outWidth = 768, outHeight = 432 } = {}) {
      const w = cv.width || 384, h = cv.height || 216;
      const body = cv._els.join('') + '</g>'.repeat(cv._clips || 0);
      const ov = overlay ? `<g transform="scale(${r2(w / 384)} ${r2(h / 216)})">${overlay}</g>` : '';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${outWidth}" height="${outHeight}"><defs>${[...defs.values()].join('')}</defs><rect width="${w}" height="${h}" fill="#050b10"/>${body}${ov}</svg>`;
    },
  };
}

/**
 * Run the headless engine to the requested stage/time (or camera x) and capture
 * one rendered frame as SVG + scene metadata.
 *
 * @param {object} options
 * @param {object} [options.spec]
 * @param {object} [options.modules]           { modules, assetBase }
 * @param {Record<string, {base64:string, width:number, height:number}>} [options.assets]
 * @param {number} [options.stage]             1..8, default 1
 * @param {number} [options.seconds]           Seconds to simulate before capturing (0..25), default 3
 * @param {number} [options.cameraX]           Optional world x to advance/place the player & camera at
 * @param {string} [options.spawnEnemy]        Optional custom enemy type to spawn in front of the player right before capture
 * @param {boolean} [options.debug]            Draw hitbox/type labels for module enemies (default true)
 */
export function renderScreenshotSvg({
  spec = {}, modules = undefined, assets = {}, stage = 1, seconds = 3,
  cameraX = null, spawnEnemy = null, debug = true, seed = 1,
} = {}) {
  const rec = createSvgRecorder();
  const mainCanvas = rec.makeCanvas(384, 216);
  const elements = new Map([['game', mainCanvas]]);

  class AssetImage {
    complete = false; naturalWidth = 0; naturalHeight = 0; _dataUri = null;
    set src(url) {
      this.url = url;
      const name = decodeURIComponent(String(url || '').split('/').pop().split('?')[0]);
      const asset = assets[name];
      if (asset) {
        this.complete = true;
        this.naturalWidth = asset.width;
        this.naturalHeight = asset.height;
        this._dataUri = `data:image/png;base64,${asset.base64}`;
        this.onload?.();
      }
    }
    get src() { return this.url; }
    decode() { return Promise.resolve(); }
  }

  const doc = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, rec.makeCanvas(384, 216));
      return elements.get(id);
    },
    createElement: tag => tag === 'canvas' ? rec.makeCanvas(384, 216) : elements.get('game'),
    head: mainCanvas, body: mainCanvas, activeElement: null, hidden: false,
    addEventListener() {},
    documentElement: { requestFullscreen: () => Promise.resolve() },
  };

  const e = createHeadlessEngine({
    game: 'contra2026', seed, hostname: '', spec, modules,
    overrides: { document: doc, Image: AssetImage, innerWidth: 384, innerHeight: 216, devicePixelRatio: 1 },
  });
  e.play(stage);
  // Keep canvas at 1x (384x216) so StageOneArt..StageSevenArt record in 384x216 coordinates.
  e.resizeWindow(384, 216, 1);

  if (Number.isFinite(cameraX) && cameraX > 0 && stage !== 2 && stage !== 4) {
    e.G.camX = Math.max(0, cameraX);
    e.G.p.x = e.G.camX + 80;
    const g = e.MOD_GAME.ground(e.G.p.x);
    if (g !== null) e.G.p.y = g;
  }

  const totalFrames = Math.min(25 * 60, Math.max(1, Math.round((Number(seconds) || 0) * 60)));
  for (let f = 0; f < totalFrames && e.G.mode === 'play'; f++) {
    e.G.p.invT = Math.max(e.G.p.invT, 0.5);
    e.frames(1, { KeyD: f % 3 !== 0, KeyJ: f % 6 === 0 });
  }

  if (spawnEnemy && e.MOD?.enemies?.has(spawnEnemy)) {
    const def = e.MOD.enemies.get(spawnEnemy);
    const sx = e.G.camX + 250;
    const sy = def.spawn?.height === 'ground' ? (e.MOD_GAME.ground(sx) ?? (e.G.camY + 176)) : (e.G.camY + (typeof def.spawn?.height === 'number' ? def.spawn.height : 64));
    e.spawnModEnemy(spawnEnemy, { x: sx, y: sy, face: -1 });
    // Advance a few frames so init/update set its pose.
    for (let i = 0; i < 6 && e.G.mode === 'play'; i++) e.step();
  }

  for (const art of [e.stageOneArt, e.stageThreeArt, e.stageFourArt, e.stageFiveArt]) {
    art?.cache?.clear?.();
    art?.terrainCache?.clear?.();
  }
  rec.resetAll();
  e.render();

  let overlay = '';
  const visibleEnemies = [];
  for (const en of e.G.en) {
    if (en.dead) continue;
    const sx = en.x - e.G.camX, sy = en.y - e.G.camY;
    if (sx < -32 || sx > 416 || sy < -32 || sy > 248) continue;
    const box = e.ebox(en);
    visibleEnemies.push({ type: en.t, mod: !!en.mod, x: Math.round(en.x), y: Math.round(en.y), hp: en.hp, box: box ? { x: Math.round(box.x - e.G.camX), y: Math.round(box.y - e.G.camY), w: box.w, h: box.h } : null });
    if (debug && en.mod && box) {
      const bx = r2(box.x - e.G.camX), by = r2(box.y - e.G.camY);
      overlay += `<rect x="${bx}" y="${by}" width="${r2(box.w)}" height="${r2(box.h)}" fill="none" stroke="#00ffcc" stroke-width="0.8" stroke-dasharray="2 1"/>`;
      overlay += `<text x="${bx}" y="${r2(Math.max(7, by - 2))}" fill="#00ffcc" font-family="DejaVu Sans,sans-serif" font-size="5.5" font-weight="700">${esc(en.t)} hp:${en.hp}</text>`;
    }
  }

  return {
    ok: e.MOD.errors.length === 0,
    stage: e.G.stage,
    camera: { x: Math.round(e.G.camX), y: Math.round(e.G.camY) },
    player: { x: Math.round(e.G.p.x), y: Math.round(e.G.p.y), weapon: e.G.p.weapon },
    enemies: visibleEnemies,
    moduleErrors: e.MOD.errors,
    svg: rec.toSvg(mainCanvas, { overlay }),
  };
}
