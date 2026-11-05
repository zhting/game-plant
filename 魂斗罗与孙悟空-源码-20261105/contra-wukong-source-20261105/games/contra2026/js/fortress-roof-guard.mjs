// A rifleman in the recessed roof position, behind the concrete parapet.
export const FORTRESS_ROOF_GUARD = Object.freeze({ x:3282, y:62, coverY:53, hideOffset:17 });

export function createFortressRoofGuard() {
  return { t:'snp', roofGuard:true, ...FORTRESS_ROOF_GUARD, hp:2, face:-1, ax:-1, ay:.5,
    on:true, vx:0, flash:0, peek:0, phase:'hide', phaseT:1.4, shotFlash:0 };
}

export function roofGuardPose(e) {
  return { ...e, y:e.y+(1-e.peek)*e.hideOffset, onGround:true, vx:0 };
}

export function roofGuardBox(e) {
  const top=roofGuardPose(e).y-28;
  return { x:e.x-6, y:top, w:12, h:Math.max(1,e.coverY-top) };
}

export function advanceFortressRoofGuard(e,target,dt,{active=true}={}) {
  if(e.dead||e.hp<=0||!active)return null;
  e.shotFlash=Math.max(0,e.shotFlash-dt);
  if(!target||target.dead||target.camoT>0) {
    e.phase='hide';e.phaseT=1.4;e.peek=Math.max(0,e.peek-dt*4);return null;
  }
  e.phaseT-=dt;
  e.peek=Math.max(0,Math.min(1,e.peek+dt*(e.phase==='hide'?-4:4)));
  if(e.phaseT>0)return null;
  if(e.phase==='hide') {
    // Lock the aim when he rises; movement during the warning can evade the shot.
    e.aimX=target.x;e.aimY=target.y-16;
    e.phase='aim';e.phaseT=.8;return null;
  }
  if(e.phase==='aim') {
    e.phase='fire';e.phaseT=.35;e.shotFlash=.09;
    e.shotX=e.x-14;e.shotY=e.y-14;
    const angle=Math.atan2(e.aimY-e.shotY,e.aimX-e.shotX);
    return { x:e.shotX, y:e.shotY, vx:Math.cos(angle)*106, vy:Math.sin(angle)*106 };
  }
  e.phase='hide';e.phaseT=2.5;return null;
}

// The old rectangular wall included the sky over the recessed roof. Follow its
// silhouette so an airborne or upward shot can reach the exposed rifleman.
const ROOF = [[3232,52],[3247,38],[3264,38],[3264,53],[3297,49],[3297,30],[3317,30],[3317,43],[3338,43]];
export function fortressRoofY(x) {
  for(let i=1;i<ROOF.length;i++) {
    const [x0,y0]=ROOF[i-1],[x1,y1]=ROOF[i];
    if(x<x1)return y0+(y1-y0)*(x-x0)/(x1-x0);
  }
  return ROOF.at(-1)[1];
}
