export const GIANT_POWER = Object.freeze({
  duration: 15, hits: 3, grace: 2, hitGrace: .8, revertGrace: 1.25,
  crushDamage: 20, crushCooldown: .45,
});

export function startGiant(p) {
  p.giantT = GIANT_POWER.duration;
  p.giantHits = GIANT_POWER.hits;
  p.giantGraceT = GIANT_POWER.grace;
  p.giantHitT = p.giantCrushT = 0;
  p.prone = p.dive = p.spin = p.inWater = false;
}

export function endGiant(p, protect = true) {
  const active = p.giantT > 0;
  p.giantT = p.giantHits = p.giantGraceT = p.giantHitT = p.giantCrushT = 0;
  if (active && protect) p.invT = Math.max(p.invT || 0, GIANT_POWER.revertGrace);
  return active;
}

// Called once per world tick, independently of the stage's movement routine.
export function updateGiant(p, dt) {
  if (p.dead || !(p.giantT > 0)) return false;
  if (p.giantT <= dt + 1e-9) return endGiant(p);
  p.giantT -= dt;
  for (const key of ['giantGraceT', 'giantHitT', 'giantCrushT']) p[key] = Math.max(0, (p[key] || 0) - dt);
  return false;
}

export function hitGiant(p) {
  if (p.dead || !(p.giantT > 0)) return 'none';
  if (p.giantGraceT > 0 || p.giantHitT > 0) return 'immune';
  p.giantHits = Math.max(0, (p.giantHits ?? GIANT_POWER.hits) - 1);
  if (!p.giantHits) { endGiant(p); return 'ended'; }
  p.giantHitT = GIANT_POWER.hitGrace;
  return 'hit';
}

export function giantCrushBox(p) {
  if (p.dead || !(p.giantT > 0) || p.ride || p.prone || p.dive || p.enteringExit || p.exitEntered || (!p.onGround && !(p.vy >= 0))) return null;
  return { x: p.x - 16, y: p.y - 16, w: 32, h: 20 };
}

export function giantPowerLabel(p) {
  if (!(p.giantT > 0)) return '';
  const remaining = `巨大${Math.ceil(p.giantT)}秒`;
  return p.giantGraceT > 0 ? `${remaining} · 免疫${Math.ceil(p.giantGraceT)}秒`
    : `${remaining} · 护甲${p.giantHits ?? GIANT_POWER.hits}次`;
}

// A low shock ring and kicked-up dust stay attached to the feet, not the torso.
export function drawGiantStomp(g, fx) {
  const t = Math.max(0, Math.min(1, fx.t / fx.life));
  g.save(); g.globalAlpha *= 1 - t;
  g.strokeStyle = t < .25 ? '#ffe9b5' : '#d1af75'; g.lineWidth = 1.1 - t * .5;
  g.beginPath(); g.ellipse(fx.x, fx.y, 7 + t * 22, 1.8 + t * 3, 0, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1, drift = 5 + Math.floor(i / 2) * 4;
    const x = fx.x + side * (4 + t * drift * 1.8), y = fx.y - Math.sin(t * Math.PI) * (3 + i % 3 * 2);
    g.fillStyle = i % 2 ? '#b79b72' : '#e4d3aa';
    g.beginPath(); g.ellipse(x, y, 1.3 + t * 2, .8 + t * 1.3, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}
