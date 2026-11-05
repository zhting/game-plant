export const EXIT_ENTRY_SECONDS=.65;
const clamp=n=>Math.max(0,Math.min(1,n));
export const exitProgress=p=>p.enteringExit?clamp(p.enteringExit.t/EXIT_ENTRY_SECONDS):p.exitEntered?1:0;

export function canEnterExit(p,exit){
  if(p.dead||p.exitEntered||p.enteringExit||p.onGround)return false;
  const centerY=p.y-(p.giantT>0?25:14),r=exit.trigger;
  return p.x>=r.x&&p.x<=r.x+r.w&&centerY>=r.y&&centerY<=r.y+r.h;
}

export function beginExitEntry(p){
  p.enteringExit={t:0,x:p.x,y:p.y};
  Object.assign(p,{vx:0,vy:0,spin:false,prone:false,dive:false,inWater:false,ride:null,hook:null,flashT:0,face:1});
}

export function advanceExitEntry(p,exit,dt){
  if(p.exitEntered)return true;
  const entry=p.enteringExit;if(!entry)return false;
  entry.t+=dt;const progress=exitProgress(p);
  const endX=Math.max(entry.x+40,exit.x+exit.w+24*(p.giantT>0?2:1));
  entry.speed=(endX-entry.x)/EXIT_ENTRY_SECONDS;
  p.x=entry.x+(endX-entry.x)*progress;
  const settle=Math.min(1,progress*4),ease=settle*settle*(3-2*settle);
  p.y=entry.y+(exit.y+exit.h-2-entry.y)*ease;
  p.anim=(p.anim||0)+dt*10;p.vx=p.vy=0;
  if(progress>=1){p.exitEntered=true;p.enteringExit=null;return true;}
  return false;
}

export function teamInsideExit(players,lives){
  const required=players.filter(p=>!p.dead||lives>0);
  return required.length>0&&required.every(p=>p.exitEntered);
}
