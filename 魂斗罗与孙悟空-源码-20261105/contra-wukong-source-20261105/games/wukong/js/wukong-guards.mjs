import { segmentBoxTime } from './wukong-combat.mjs';

export const GUARD_MELEE=Object.freeze({windup:.34,strike:.18,recovery:.4,cooldown:.95,trigger:43});
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function advanceGuard(e,target,dt,{active=true,onAttack=()=>{}}={}){
  if(active&&!e.dead)e.guardClock=(e.guardClock||0)+dt;
  if(e.guardCooldown>0)e.guardCooldown=Math.max(0,e.guardCooldown-dt);
  // An unsafe edge has priority over chasing a player across the gap. Keep
  // retreating long enough to walk away instead of flipping direction each tick.
  if(e.guardPatrol?.remaining>0){
    const inFront=active&&target&&Math.sign(target.x-e.x)===e.guardPatrol.direction&&
      Math.abs(target.x-e.x)<=GUARD_MELEE.trigger&&Math.abs(target.y-e.y)<34;
    if(inFront)e.guardPatrol=null;
    else{e.melee=null;e.face=e.guardPatrol.direction;e.ax=e.face;e.ay=0;return false;}
  }
  if(!active||e.dead||e.hp<=0||!target){if(e.melee)e.melee=null;return false;}
  const dx=target.x-e.x,dy=Math.abs(target.y-e.y);
  if(!e.melee&&Math.abs(dx)<140&&dy<34){
    e.face=dx<0?-1:1;e.ax=e.face;e.ay=0;
    if(e.t==='run')e.vx=e.face*Math.max(40,Math.abs(e.vx||62));
  }
  if(e.melee){
    e.melee.t+=dt;
    if(e.melee.t>=GUARD_MELEE.windup+GUARD_MELEE.strike+GUARD_MELEE.recovery){e.melee=null;e.guardCooldown=GUARD_MELEE.cooldown;}
    else return true;
  }
  if(dy>=34||Math.abs(dx)>GUARD_MELEE.trigger)return false;
  if(e.guardCooldown>0)return Math.abs(dx)<23;
  e.guardTurn=(e.guardTurn||0)+1;
  const kind=e.guardTurn%3===0?'sweep':e.t==='snp'?(e.guardTurn%2?'cut':'thrust'):(e.guardTurn%2?'thrust':'cut');
  e.melee={kind,face:dx<0?-1:1,t:0,hits:[]};
  e.face=e.melee.face;onAttack();return true;
}

// The same blade segment drives drawing and contact damage; no projectile is created.
export function guardGeometry(e,time=e.melee?.t??0){
  const a=e.melee,face=a?.face||e.face||Math.sign(e.vx)||-1;
  const clock=e.guardClock||0,phase=(clock+(Math.abs(e.x)%7)*.23)%3.4;
  const flourish=phase<1.15?Math.sin(phase/1.15*Math.PI)**2:0;
  let angle=-.66+flourish*.95,reach=26,push=flourish*1.6,lean=flourish*.07;
  if(a){
    const ready=smooth(time/GUARD_MELEE.windup),strike=smooth((time-GUARD_MELEE.windup)/GUARD_MELEE.strike);
    const recover=smooth((time-GUARD_MELEE.windup-GUARD_MELEE.strike)/GUARD_MELEE.recovery);
    const cut=a.kind!=='thrust',sweep=a.kind==='sweep',prepared=sweep?-1.6:cut?-1.32:-.1,finish=sweep?.8:cut?.45:.02;
    angle=(-.66+(prepared+.66)*ready+(finish-prepared)*strike)*(1-recover)-.66*recover;
    push=(cut?2:5)*strike*(1-recover);reach=26+6*strike*(1-recover);
    lean=(-.08*ready+.24*strike)*(1-recover);
  }
  const origin={x:e.x+face*(4+push),y:e.y-18};
  const axis={x:Math.cos(angle)*face,y:Math.sin(angle)};
  return {origin,tip:{x:origin.x+axis.x*reach,y:origin.y+axis.y*reach},
    butt:{x:origin.x-axis.x*12,y:origin.y-axis.y*12},angle,face,push,lean,reach};
}

export function guardHitsPlayer(e,p,box,solids){
  const a=e.melee;
  if(!a||e.dead||p.dead||p.camoT>0||p.enteringExit||p.exitEntered||a.hits.includes(p)||
    a.t<GUARD_MELEE.windup||a.t>GUARD_MELEE.windup+GUARD_MELEE.strike)return false;
  for(const q of [guardGeometry(e,Math.max(GUARD_MELEE.windup,a.t-1/60)),guardGeometry(e)]){
    const contact=segmentBoxTime(q.origin,q.tip,box,2);if(contact===null)continue;
    if(solids.some(s=>s.g&&!s.gone&&!s.water&&segmentBoxTime(q.origin,q.tip,s)!==null&&segmentBoxTime(q.origin,q.tip,s)<contact-.001))continue;
    a.hits.push(p);return true;
  }
  return false;
}
