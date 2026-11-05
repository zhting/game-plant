// Deterministic world-space geometry: adjacent render chunks share the same stones.
export function sceneryRandom(n) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
// The cliff's visible foot is above the bottom edge, leaving a continuous river below.
// Sampling world coordinates keeps the shoreline attached while the camera scrolls.
export const coastHeight = x => 198 + Math.sin(x * .047) * .65 + Math.sin(x * .123) * .35;
// Small rounded outcrops follow the rock strata, rather than a ruler-straight cut.
// World coordinates keep the silhouette still as the camera crosses a chunk.
export function cliffEdgeProfile(x, top, bottom, side) {
  const points = [[x, top]], length = bottom - top;
  if (length <= 0) return points;
  const phase = sceneryRandom(Math.round(x * 71)) * Math.PI;
  for (let y = top + 1; y < bottom; y += 1) {
    const taper = Math.min(1, (y - top) / 3, (bottom - y) / 3);
    const lobe = Math.sin((y - top) * .43 + phase);
    const offset = taper * (.7 + 2.1 * lobe + .45 * Math.sin(y * .91 + phase));
    points.push([x + side * offset, y]);
  }
  points.push([x, bottom]);
  return points;
}
function site(column, row) {
  const seed = Math.imul(column + 4096, 73856093) ^ Math.imul(row + 128, 19349663);
  return { x: column * 13 + (row & 1) * 6.5 + (sceneryRandom(seed) - .5) * 8,
    y: row * 10 + (sceneryRandom(seed + 19) - .5) * 6, seed };
}
function clipHalfPlane(polygon, nx, ny, limit) {
  const output = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const da = a[0] * nx + a[1] * ny - limit, db = b[0] * nx + b[1] * ny - limit;
    if (da <= 0) output.push(a);
    if ((da <= 0) !== (db <= 0)) {
      const t = da / (da - db); output.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return output;
}
export function rockCells(left, right) {
  const cells = [];
  for (let row = -2; row <= 24; row++) for (let col = Math.floor(left / 13) - 3; col <= Math.ceil(right / 13) + 3; col++) {
    const p = site(col, row);
    if (p.x < left - 35 || p.x > right + 35) continue;
    let points = [[p.x - 60, p.y - 60], [p.x + 60, p.y - 60], [p.x + 60, p.y + 60], [p.x - 60, p.y + 60]];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (!dx && !dy) continue;
      const q = site(col + dx, row + dy), nx = q.x - p.x, ny = q.y - p.y;
      points = clipHalfPlane(points, nx, ny, (q.x * q.x + q.y * q.y - p.x * p.x - p.y * p.y) / 2);
    }
    if (points.length >= 3) cells.push({ ...p, points });
  }
  return cells;
}
export function palmAnchors(solids, camera) {
  const anchors = [];
  for (let i = Math.floor((camera - 90) / 310) - 1; i <= Math.ceil((camera + 474) / 310); i++) {
    const x = i * 310 + 90;
    const floor = solids.find(s => s.g && !s.water && !s.gone && x >= s.x + 18 && x <= s.x + s.w - 18);
    if (floor && x > camera - 80 && x < camera + 464) anchors.push({ x, y: floor.y });
  }
  return anchors;
}
export const rotorAngle = tick => tick * .47;
export const rollAngle = animation => animation * Math.PI / 2;
export const meteorPosition = time => ({ x: -35 + time * 90, y: -8 + time * 9 + time * time * 1.4 });
export function openingDrop(seconds, solids) {
  const elapsed = Math.max(0, seconds - 18), duration = 1.6, progress = Math.min(1, elapsed / duration);
  const x = 220, floor = solids.find(s => s.g && !s.water && x >= s.x && x <= s.x + s.w);
  const landingY = floor?.y ?? 144;
  return { x, y: 80 + (landingY - 80) * progress * progress, landingY,
    spin: progress < 1, anim: elapsed * 8, landingTime: elapsed - duration };
}
