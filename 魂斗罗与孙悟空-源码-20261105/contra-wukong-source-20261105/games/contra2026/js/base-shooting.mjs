import { BASE_BOSS_MOVER } from './base-boss.mjs?v=base-up-lift-1';
import { stageFourFacilityClosed, stageFourGalleryTargets } from './stage-four-layout.mjs?v=stage-four-defense-1';

export const BASE_HIGH_SWITCH = Object.freeze({ x: 180, y: 80, w: 24, h: 18, hp: 4, max: 4 });

// Jump height is projected onto the rear wall; ground fire keeps the old lane.
export function baseShotHeight(player, stage, boss=false, phase=null) {
  const base=[2,4].includes(stage);
  if(base&&player.prone)return boss?146:134;
  if(boss&&player.aimUp){
    if(phase==='devices')return stage===4?87:100;
    return stage===4?64.5:BASE_BOSS_MOVER.y+BASE_BOSS_MOVER.h/2;
  }
  const standing=base&&!boss?117:129;
  return standing - (base ? Math.max(0, 204 - player.y) * (boss?1.05:.53) : 0);
}
export function baseTargetAtHeight(target, height) {
  // The core occupies the bottom row; its upper casing is not the hit aperture.
  const top=target.k==='core'&&target.tier==='low'?target.y+target.h*.5-2:target.y-2;
  return height >= top && height <= target.y + target.h + 2;
}
export function baseCoreShielded(base, empT = 0) {
  // EMP disables the cannons, but the upper mechanism is a physical door lock.
  return base.targets.some(t => t.hp > 0 && (t.k === 'switch' || (['gun','rail'].includes(t.k) && !(empT > 0))));
}
export function baseHomingTarget(base, x, height, stage) {
  const live = [...base.targets,...(stage===4?stageFourGalleryTargets(base):[])].filter(t => t.hp > 0 && !stageFourFacilityClosed(t) && !(t.k === 'twin' && !t.solid)
    && baseTargetAtHeight(t, height));
  const upper = [2,4].includes(stage) ? live.filter(t => t.k === 'switch') : [];
  const sides = [2,4].includes(stage) ? live.filter(t => ['gun', 'sat', 'rail'].includes(t.k)) : [];
  let best = null, distance = Infinity;
  for (const target of upper.length ? upper : sides.length ? sides : live) {
    const d = Math.abs(target.x + target.w / 2 - x);
    if (d < distance) { best = target; distance = d; }
  }
  return best;
}
