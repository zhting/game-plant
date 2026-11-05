// World-space doorway shared by the simulation and the foundry renderer.
export const STAGE_SIX_EXIT=Object.freeze({x:3242,y:63,w:58,h:113,triggerX:3263,openSeconds:1.05,entrySeconds:.65});

export function canEnterStageSixExit(p,exit=STAGE_SIX_EXIT){
  return !p.dead&&!p.enteringExit&&!p.exitEntered&&p.onGround&&!p.ride&&p.vx>0&&p.x>=exit.triggerX;
}

export function advanceStageSixExitEntry(p,dt,exit=STAGE_SIX_EXIT){
  if(p.exitEntered)return true;
  const entry=p.enteringExit;if(!entry)return false;
  entry.t+=dt;const t=Math.max(0,Math.min(1,entry.t/exit.entrySeconds));
  const end=Math.max(entry.x+12,exit.x+exit.w*.7);
  entry.speed=(end-entry.x)/exit.entrySeconds;
  p.x=entry.x+(end-entry.x)*t;p.y=entry.y;p.face=1;p.anim=(p.anim||0)+dt*10;p.vx=p.vy=0;
  if(t>=1){p.enteringExit=null;p.exitEntered=true;return true;}
  return false;
}
