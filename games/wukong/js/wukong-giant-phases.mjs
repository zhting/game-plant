// Host-owned three-stage encounter. Geometry, timers and hit lists are networked.
export const COLOSSUS=Object.freeze({hp:110,growth:1.8,axeRadius:88,axeTrack:.38,axeWindup:1.85,axeCut:.09,stompWindup:1.26,aimTrack:.22,dropRadius:76,footRest:3,footRise:.32,floor:176,axeDamage:40,stompDamage:34,shockDamage:18});
export const GIANT_FINALE=Object.freeze({duration:9.6,impacts:Object.freeze([2.75,3.7,4.18,4.66,6.62,7.05])});
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
export const giantEncounter=boss=>boss.encounter??={stage:1,time:0};
// The same transient foot drives the painting and the host's target box. There
// is no planted leg or invisible ground-level target during an axe or lull.
export function colossusFootPose(g){
  const a=g?.attack;if(g?.form!=='colossus'||a?.kind!=='skyStomp')return {visible:false};
  const dropping=smooth((a.t-a.windup+.11)/.11),rising=smooth((a.t-a.windup-COLOSSUS.footRest)/COLOSSUS.footRise);
  const y=COLOSSUS.floor-300*(1-dropping)-300*rising;
  return {visible:y> -12&&rising<1,x:a.aimX,y,index:a.t>=a.windup?2:1,landed:a.t>=a.windup&&rising===0};
}
export function colossusBody(g){
  const foot=colossusFootPose(g);
  return foot.visible?{x:foot.x-COLOSSUS.dropRadius,y:foot.y-68,w:COLOSSUS.dropRadius*2,h:68}:{x:g.x,y:-512,w:0,h:0};
}
export function enterColossus(boss,{left=2950,width=384}={}){
  const state=giantEncounter(boss);if(state.stage!==1)return false;
  const g=boss.giant;
  Object.assign(state,{stage:2,time:0,growth:COLOSSUS.growth,arena:{left,right:left+width,width,floor:COLOSSUS.floor},turn:0,
    from:{...g,attack:null,hurt:null,animation:null},impacts:0,scars:[]});
  boss.phase2=true;boss.exitOpen=false;
  Object.assign(boss.parts[2],{hp:COLOSSUS.hp,max:COLOSSUS.hp,flash:0});
  Object.assign(g,{form:'colossus',x:left+width*.73,y:COLOSSUS.floor,face:-1,footLift:0,vx:0,vy:0,onGround:true,
    attack:null,hurt:null,animation:null,cooldown:.35});
  return true;
}
export function colossusAttack(boss,target){
  const state=giantEncounter(boss),view=state.arena,kind=state.turn++%2?'skyStomp':'skyAxe';
  const aimX=clamp(target?.x??view.left+view.width/2,view.left+12,view.right-12);
  return {kind,t:0,windup:kind==='skyAxe'?COLOSSUS.axeWindup:COLOSSUS.stompWindup,
    strike:kind==='skyAxe'?.16:.30,recovery:kind==='skyAxe'?.43:COLOSSUS.footRest+COLOSSUS.footRise-.30+.02,hits:[],aimX,locked:false,
    danger:{x:aimX-COLOSSUS.axeRadius,y:-80,w:COLOSSUS.axeRadius*2,h:view.floor+90},impacted:false};
}
// Scars are host-owned world state, never expiring FX. Nearby impacts deepen
// an existing crater; no old crater disappears when the attack or boss ends.
export function leaveColossusScar(state,attack){
  const scars=state.scars??=[],x=attack.aimX;
  let scar=scars.find(s=>Math.abs(s.x-x)<18);
  if(scar){scar.depth=Math.min(3,scar.depth+1);scar.at=state.time;}
  else{scar={x,y:COLOSSUS.floor,r:COLOSSUS.dropRadius*.90,depth:1,at:state.time,seed:Math.round(x*13)};scars.push(scar);}
  return scar;
}
export function advanceColossus(boss,target,dt,{onTell=()=>{},onImpact=()=>{}}={}){
  const state=giantEncounter(boss),g=boss.giant;if(state.stage!==2||boss.dead)return;
  state.time+=dt;g.clock=(g.clock||0)+dt;
  if(state.growth>0){state.growth=Math.max(0,state.growth-dt);return;}
  const a=g.attack;
  if(!a){g.cooldown=Math.max(0,g.cooldown-dt);if(g.cooldown<=0&&target){g.attack=colossusAttack(boss,target);onTell(g.attack);}return;}
  a.t+=dt;
  if(!a.locked){
    a.aimX=clamp(target?.x??a.aimX,state.arena.left+12,state.arena.right-12);
    a.danger.x=a.aimX-COLOSSUS.axeRadius;
    if(a.t>=(a.kind==='skyAxe'?COLOSSUS.axeTrack:COLOSSUS.aimTrack))a.locked=true;
  }
  if(a.kind==='skyStomp'){
    // The only visible foot plunges at the locked target, pauses for a
    // counterattack, then retreats completely above the viewport.
    g.footLift=0;
  }
  const impactAt=a.windup+(a.kind==='skyAxe'?COLOSSUS.axeCut:0);
  if(!a.impacted&&a.t>=impactAt){a.impacted=true;state.impacts++;if(a.kind==='skyStomp')leaveColossusScar(state,a);onImpact(a);}
  if(a.t>=a.windup+a.strike+a.recovery){g.attack=null;g.footLift=0;g.cooldown=.25;}
}
export function colossusHitsPlayer(boss,p,box){
  const state=boss.encounter,a=boss.giant?.attack;
  if(state?.stage!==2||state.growth>0||boss.dead||!a||!box||p.dead||p.camoT>0||p.enteringExit||p.exitEntered||a.hits.includes(p))return false;
  const elapsed=a.t-a.windup;
  if(a.kind==='skyAxe'){
    if(elapsed<COLOSSUS.axeCut||elapsed>a.strike)return false;
    if(box.x+box.w<=a.danger.x||box.x>=a.danger.x+a.danger.w||box.y+box.h<=a.danger.y||box.y>=a.danger.y+a.danger.h)return false;
  }else{
    if(elapsed<0||elapsed>.24)return false;
    if(box.x+box.w<state.arena.left||box.x>state.arena.right)return false;
    const crushed=box.x+box.w>a.aimX-COLOSSUS.dropRadius&&box.x<a.aimX+COLOSSUS.dropRadius;
    if(!crushed&&(elapsed<.035||box.y+box.h<state.arena.floor-11))return false;
  }
  a.hits.push(p);return true;
}
export function colossusDamage(boss,box){
  if(boss.encounter?.stage!==2)return 22;
  const a=boss.giant?.attack;if(a?.kind==='skyAxe')return COLOSSUS.axeDamage;
  return a&&box.x+box.w>a.aimX-COLOSSUS.dropRadius&&box.x<a.aimX+COLOSSUS.dropRadius?COLOSSUS.stompDamage:COLOSSUS.shockDamage;
}
export function enterGiantFinale(boss,actors){
  const state=giantEncounter(boss);if(state.stage!==2||state.growth>0)return false;
  Object.assign(state,{stage:3,time:0,event:0,shouted:false,saved:actors.filter(p=>!p.dead).map(p=>({pid:p.pid||1,x:p.x,y:p.y,
    ride:p.ride,rideT:p.rideT,giantT:p.giantT,giantHits:p.giantHits}))});
  boss.parts[2].hp=1;boss.exitOpen=false;
  Object.assign(boss.giant,{attack:null,footLift:0,form:'finale'});
  for(const p of actors)if(!p.dead)Object.assign(p,{vx:0,vy:0,staff:null,staffCharge:null,hurt:null,prone:false,ride:null,invT:2});
  return true;
}
export function advanceGiantFinale(boss,actors,dt,{onImpact=()=>{},onShout=()=>{}}={}){
  const state=boss.encounter;if(state?.stage!==3||boss.dead)return false;
  state.time=Math.min(GIANT_FINALE.duration,state.time+dt);
  for(const p of actors)if(!p.dead)p.invT=Math.max(p.invT||0,.3);
  if(!state.shouted&&state.time>=1.1){state.shouted=true;onShout();}
  while(state.event<GIANT_FINALE.impacts.length&&state.time>=GIANT_FINALE.impacts[state.event])onImpact(state.event++);
  if(state.time<GIANT_FINALE.duration)return false;
  for(const saved of state.saved){const p=actors.find(p=>(p.pid||1)===saved.pid);if(p&&!p.dead){
    const x=clamp(saved.x,state.arena.left+15,state.arena.right-10);
    Object.assign(p,saved,{x,y:saved.ride==='heli'?132:COLOSSUS.floor,onGround:saved.ride!=='heli',vx:0,vy:0,invT:1.2});
  }}
  state.stage=4;
  Object.assign(boss.giant,{form:null,x:Math.min(3278,state.arena.left+state.arena.width*.85),y:COLOSSUS.floor,face:-1,attack:null,vx:0,vy:0,onGround:true,animation:null});
  return true;
}
// One pure authored timeline drives both actors and VFX; no automatic combat input.
export function giantFinalePose(time){
  const t=clamp(time,0,GIANT_FINALE.duration),end=smooth((t-8)/1.6),growth=smooth(t/1.5),scale=(1+growth*2.4)*(1-end*.70588);
  let sheet='movement',u=(t%2.8)/2.8,x=70;
  if(t>=1.6&&t<3.25){sheet='advance';u=clamp((t-1.6)/1.65);x=70+100*smooth(u);}
  else if(t>=3.25&&t<5.2){sheet='flower';u=((t-3.25)/.65)%1;x=170;}
  else if(t>=5.2&&t<7.4){sheet='cleave';u=clamp((t-5.2)/2.2);x=170+24*smooth(u);}
  else if(t>=7.4){sheet='movement';u=(t-7.4)/2.8;x=166;}
  const leap=t>=5.2&&t<6.62?Math.sin((t-5.2)/1.42*Math.PI)*43:0;
  return {time:t,hero:{x,y:176-leap,scale,sheet,u},giant:{x:278+(t>=7.05?23*smooth((t-7.05)/.8):0),y:176,
    scale:1.7*(1-end*.41176),hurt:t>=2.75,fall:smooth((t-7.05)/.85)},
    caption:t<1.6?'法天象地':t<5.2?'如意金箍 · 连环破阵':t<7.4?'齐天一棍':'巨灵伏诛',end};
}
