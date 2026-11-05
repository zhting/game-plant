import { segmentBoxTime } from './wukong-combat.mjs';
import { giantAnimationPose, advanceGiantAnimation } from './wukong-giant-animation.mjs';
import { wholeGiantPose } from './wukong-giant-frames.mjs';
import { colossusBody, colossusHitsPlayer } from './wukong-giant-phases.mjs';

export const GIANT_HOME=Object.freeze({x:3263,y:176,face:-1});
export const GIANT_TIMING=Object.freeze({windup:.68,strike:.32,recovery:.65,cooldown:.42});
export const GIANT_ARENA=Object.freeze({left:3008,right:3278,floor:176,walk:76,gravity:640,flight:.68,spacing:56,engage:64});
export const GIANT_MOVES=Object.freeze(['cleave','sweep','whirlwind','stomp','leap']);
export const giantTiming=a=>({strike:a?.strike??GIANT_TIMING.strike,recovery:a?.recovery??GIANT_TIMING.recovery});
const clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x));
export function giantBodyPoint(q,x,y){
  const px=x*q.widthScale-y*q.lean*q.bodyScaleY,py=y*q.bodyScaleY+42,c=Math.cos(q.roll),s=Math.sin(q.roll);
  return {x:q.lunge*.45+px*c-py*s,y:-42+q.lift+px*s+py*c};
}
export const giantBody=g=>g.form==='colossus'?colossusBody(g):wholeGiantPose(g).body;

// One shared pose describes both the visible axe and its damaging sweep.
export function giantPose(g,time=g.attack?.t??0){
  const pose=giantAnimationPose(g,time),whole=wholeGiantPose(g,time);
  return {...pose,...whole,air:g.onGround===false,walk:g.walkBlend||0,phase:g.gait||0};
}
export function giantShockwave(g,time=g.attack?.t??0){
  const a=g.attack;if(!a||!['stomp','leap'].includes(a.kind))return null;
  const strike=giantTiming(a).strike,delay=a.kind==='leap'?(a.flight||GIANT_ARENA.flight):.18,u=(time-a.windup-delay)/(strike-delay);
  if(u<0||u>1)return null;
  return {x:g.x+(g.face||-1)*(22+u*(a.kind==='leap'?72:94)),y:GIANT_ARENA.floor-5,w:16,h:10,phase:u};
}
export function giantShockwaves(g,time=g.attack?.t??0){
  const wave=giantShockwave(g,time);if(!wave)return [];
  return g.attack.kind==='leap'?[wave,{...wave,x:g.x*2-wave.x}]:[wave];
}
function arm(shoulder,hand,bend){
  const dx=hand.x-shoulder.x,dy=hand.y-shoulder.y,d=Math.max(.001,Math.hypot(dx,dy));
  const along=(21**2-22**2+d*d)/(2*d),height=Math.sqrt(Math.max(0,21**2-along**2));
  return {shoulder,elbow:{x:shoulder.x+dx/d*along-dy/d*height*bend,y:shoulder.y+dy/d*along+dx/d*height*bend},hand};
}
export function giantRig(g,time=g.attack?.t??0){
  const q=giantPose(g,time),axis={x:q.face*Math.cos(q.angle),y:Math.sin(q.angle)};
  const bodyPoint=(x,y)=>{const p=giantBodyPoint(q,x,y);return {x:g.x+q.face*p.x,y:g.y+p.y};};
  const nearHand={x:q.origin.x+axis.x*8,y:q.origin.y+axis.y*8},farHand={x:q.origin.x-axis.x*13,y:q.origin.y-axis.y*13};
  return {pose:q,near:arm(bodyPoint(-20.9,-69.2),nearHand,q.face),far:arm(bodyPoint(18.6,-66.2),farHand,-q.face),legs:giantLegs(g,q)};
}

function legJoint(hip,ankle,bend){
  const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.max(.001,Math.hypot(dx,dy)),upper=25.5,lower=24;
  const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
  return {hip,knee:{x:hip.x+dx/d*along+dy/d*height*bend,y:hip.y+dy/d*along-dx/d*height*bend},ankle};
}
// Actor-local feet stay on the walking plane; hips share the breathing/attack transform.
export function giantLegs(g,q=giantPose(g)){
  return [-1,1].map((side,i)=>{
    const prefix=i?'far':'near',footX=q[prefix+'X'],footY=q[prefix+'Y'];
    const hip=giantBodyPoint(q,side<0?-13:12,-42);
    return {...legJoint(hip,{x:footX,y:footY},side<0?-1:1),side,footAngle:q[prefix+'Boot'],swing:footY< -9};
  });
}

function moveGiant(g,velocity,dt){
  const change=clamp(velocity-(g.vx||0),-420*dt,420*dt);
  g.vx=(g.vx||0)+change;
  const old=g.x;g.x=clamp(g.x+g.vx*dt,GIANT_ARENA.left,GIANT_ARENA.right);
  if(g.x===old)g.vx=0;
  g.gait=(g.gait||0)+(g.x-old)*(g.face||-1)*Math.PI*2/56;
}
export function advanceGiant(boss,target,dt,hooks={}){
  if(!boss.giant||boss.dead)return;
  const previous=giantAnimationPose(boss.giant);simulateGiant(boss,target,dt,hooks);
  advanceGiantAnimation(boss.giant,dt,previous);
}
function simulateGiant(boss,target,dt,{onAttack=()=>{},onLand=()=>{}}={}){
  const g=boss.giant;
  if(!g||boss.dead)return;
  g.clock=(g.clock||0)+dt;g.landT=Math.max(0,(g.landT||0)-dt);g.jumpCd=Math.max(0,(g.jumpCd||0)-dt);
  g.poiseCooldown=Math.max(0,(g.poiseCooldown||0)-dt);
  g.onGround??=true;g.vy??=0;
  if(g.hurt){
    g.hurt.t+=dt;g.vx=g.hurt.face*24*Math.exp(-g.hurt.t*12);
    g.x=clamp(g.x+g.vx*dt,GIANT_ARENA.left,GIANT_ARENA.right);g.walkBlend=0;
    if(g.hurt.t>=g.hurt.duration){g.hurt=null;g.vx=0;}return;
  }
  const animateWalk=()=>{g.walkBlend=(g.walkBlend||0)+(clamp(Math.abs(g.vx||0)/GIANT_ARENA.walk)-(g.walkBlend||0))*Math.min(1,dt*12);};
  if(g.attack){
    const a=g.attack;a.t+=dt;
    const timing=giantTiming(a);
    if(a.kind==='leap'&&a.t>=a.windup){
      const flight=a.flight||GIANT_ARENA.flight,u=clamp((a.t-a.windup)/flight),elapsed=u*flight;
      const old=g.x;g.x=a.takeoffX+(a.landingX-a.takeoffX)*u;
      g.y=GIANT_ARENA.floor-GIANT_ARENA.gravity*.5*elapsed*(flight-elapsed);
      g.vx=u<1?(a.landingX-a.takeoffX)/flight:0;g.vy=u<1?GIANT_ARENA.gravity*(elapsed-flight/2):0;g.onGround=u>=1;
      g.gait=(g.gait||0)+(g.x-old)*g.face*Math.PI*2/56;
      if(g.onGround&&!a.landed){a.landed=true;g.landT=.32;onLand(g);}
    }else{
      const retreating=a.t>a.windup+timing.strike+.12&&a.repositionX!==undefined;
      const delta=retreating?a.repositionX-g.x:0;
      moveGiant(g,Math.abs(delta)>2?Math.sign(delta)*52:0,dt);
    }
    animateWalk();
    if(a.t>=a.windup+timing.strike+timing.recovery){
      g.attack=null;g.cooldown=boss.phase2?.5:GIANT_TIMING.cooldown;
    }
    return;
  }
  g.cooldown=Math.max(0,g.cooldown-dt);
  if(!target){moveGiant(g,0,dt);animateWalk();return;}
  const dx=target.x-g.x,distance=Math.abs(dx);g.face=dx<0?-1:1;
  const distantLeap=distance>138&&g.jumpCd<=0;
  if(g.cooldown>0||distance>GIANT_ARENA.engage&&!distantLeap){
    const desired=target.x-g.face*GIANT_ARENA.spacing,delta=desired-g.x;
    moveGiant(g,Math.abs(delta)>4?Math.sign(delta)*GIANT_ARENA.walk*(boss.phase2?1.2:1):0,dt);animateWalk();return;
  }
  // Face and attack choice are locked by the host for the whole animation.
  g.turn=(g.turn||0)+1;
  const planned=GIANT_MOVES[(g.turn-1)%GIANT_MOVES.length],insertLeap=(g.meleeSinceLeap||0)>=2&&planned!=='leap';
  const kind=distantLeap||insertLeap?'leap':planned;
  if(insertLeap&&!distantLeap)g.turn--; // Resume the ground sequence after this mobility attack.
  g.meleeSinceLeap=kind==='leap'?0:(g.meleeSinceLeap||0)+1;
  g.vx=0;animateWalk();
  g.attack={kind,t:0,windup:(kind==='leap'?.6:kind==='stomp'?.85:kind==='whirlwind'?.78:GIANT_TIMING.windup)*(boss.phase2?.7:1),
    strike:kind==='leap'?1.18:kind==='stomp'?.7:kind==='whirlwind'?.6:.32,recovery:kind==='leap'?.62:kind==='stomp'?.8:kind==='whirlwind'?.75:GIANT_TIMING.recovery,hits:[]};
  if(kind==='leap')Object.assign(g.attack,{flight:GIANT_ARENA.flight,takeoffX:g.x,landingX:clamp(target.x+g.face*34,GIANT_ARENA.left,GIANT_ARENA.right)});
  else{
    const back=clamp(g.x-g.face*30,GIANT_ARENA.left,GIANT_ARENA.right);
    g.attack.repositionX=Math.abs(back-g.x)>=12?back:clamp(g.x+g.face*28,GIANT_ARENA.left,GIANT_ARENA.right);
  }
  if(kind==='leap')g.jumpCd=3.2;
  onAttack(g.attack.kind);
}

export function giantHitsPlayer(boss,p,box,solids){
  if(boss.encounter?.stage===3)return false;
  if(boss.giant?.form==='colossus')return colossusHitsPlayer(boss,p,box);
  const g=boss.giant,a=g?.attack;
  if(boss.dead||!a||p.dead||p.camoT>0||p.enteringExit||p.exitEntered||a.hits.includes(p)||
    a.t<a.windup||a.t>a.windup+giantTiming(a).strike)return false;
  if(a.kind==='stomp'||a.kind==='leap'&&a.landed){
    for(const wave of giantShockwaves(g)){
      const from={x:g.x,y:GIANT_ARENA.floor-6},to={x:wave.x,y:wave.y};
      if(segmentBoxTime({x:wave.x-wave.w/2,y:wave.y},{x:wave.x+wave.w/2,y:wave.y},box,5)===null)continue;
      const contact=segmentBoxTime(from,to,box,5);
      if(solids.some(s=>s.g&&!s.gone&&!s.water&&segmentBoxTime(from,to,s)!==null&&(contact===null||segmentBoxTime(from,to,s)<contact-.001)))continue;
      a.hits.push(p);return true;
    }
    return false;
  }
  if(a.kind==='leap'&&a.t<a.windup+(a.flight||GIANT_ARENA.flight)*.6)return false;
  // Sample the swept arc as well as the current shaft, so fast cuts cannot tunnel.
  for(let i=0;i<=4;i++){
    const q=giantPose(g,Math.max(a.windup,a.t-(1-i/4)/60));
    const contact=segmentBoxTime(q.origin,q.tip,box,7);if(contact===null)continue;
    if(solids.some(s=>s.g&&!s.gone&&!s.water&&segmentBoxTime(q.origin,q.tip,s)!==null&&segmentBoxTime(q.origin,q.tip,s)<contact-.001))continue;
    a.hits.push(p);return true;
  }
  return false;
}
