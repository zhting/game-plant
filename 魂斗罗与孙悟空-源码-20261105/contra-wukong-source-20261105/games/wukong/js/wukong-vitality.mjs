// Host-owned health and recoil. The original Contra stages keep their own rules.
import { cancelStaffCharge } from './wukong-special-staff.mjs';
import { WUKONG_RAGE, gainHitRage } from './wukong-rage.mjs';
export const WUKONG_HEALTH=Object.freeze({max:100,guard:12,fly:10,halberd:16,boss:22,projectile:10,contact:12,grace:.85});
export const HEALING_ITEMS=Object.freeze({
  healPeach:Object.freeze({name:'补血仙桃',amount:30,short:'仙桃'}),
  healPill:Object.freeze({name:'九转金丹',amount:60,short:'金丹'})
});
export const HEALING_DROPS=Object.freeze([
  {at:140,y0:80,kind:'healPeach'}, {at:790,y0:83,kind:'healPeach'},
  {at:1430,y0:78,kind:'healPill'}, {at:2070,y0:88,kind:'healPeach'},
  {at:2710,y0:105,kind:'healPill'}
]);
export function newVitality(){return {hp:WUKONG_HEALTH.max,maxHp:WUKONG_HEALTH.max,hpTrail:WUKONG_HEALTH.max,rage:0,maxRage:WUKONG_RAGE.max};}
const direction=(hit,actor)=>Math.sign(hit.face||hit.vx||-actor.face||1);
export function receiveHeroHit(p,hit={}){
  if(p.dead||p.invT>0||p.shieldT>0||p.enteringExit||p.exitEntered)return null;
  const shell=p.magic?.transform?.form==='tortoise'&&p.magic.transform.guard;
  const amount=Math.max(1,Math.ceil((hit.damage??WUKONG_HEALTH.contact)*(shell?.4:1))),face=direction(hit,p),heavy=!!hit.heavy&&!shell;
  if(shell)p.magic.transform.counter=true;
  p.maxHp??=WUKONG_HEALTH.max;p.hp??=p.maxHp;
  const lost=Math.min(p.hp,amount);
  p.hpTrail=Math.max(p.hpTrail??p.hp,p.hp);p.hpTrailHold=.32;p.hp=Math.max(0,p.hp-amount);
  p.hurt={t:0,duration:heavy?.38:.26,heavy,face,amount:lost};
  p.knockVX=face*(heavy?125:84);p.invT=WUKONG_HEALTH.grace;
  p.face=-face;p.prone=p.spin=false;p.staff=null;p.wantFire=false;p.staffCombo=0;p.staffComboT=0;
  cancelStaffCharge(p,true);
  if(heavy&&!p.ride){p.vy=-100;p.onGround=false;p.support=null;}
  return {amount:lost,heavy,face,lethal:p.hp===0,...(lost>0?gainHitRage(p):{})};
}
export function advanceVitality(p,dt){
  if(p.hpTrailHold>0)p.hpTrailHold=Math.max(0,p.hpTrailHold-dt);
  else if(p.hpTrail>p.hp)p.hpTrail=Math.max(p.hp,p.hpTrail-(p.maxHp||100)*.8*dt);
  if(p.healFlash>0)p.healFlash=Math.max(0,p.healFlash-dt);
  if(!p.hurt)return false;
  p.hurt.t+=dt;
  if(p.hurt.t>=p.hurt.duration){p.hurt=null;p.knockVX=0;return false;}
  p.knockVX*=Math.exp(-7*dt);return true;
}
export function healHero(p,kind){
  const item=HEALING_ITEMS[kind];if(!item||p.dead)return 0;
  p.maxHp??=WUKONG_HEALTH.max;p.hp??=p.maxHp;
  const gained=Math.min(item.amount,p.maxHp-p.hp);
  p.hp+=gained;p.hpTrail=Math.max(p.hp,p.hpTrail||0);p.healFlash=.65;
  return gained;
}

export function receiveGuardHit(e,hit={},damage=2){
  const face=direction(hit,e),heavy=!!hit.heavy||damage>=4;
  e.hurt={t:0,duration:heavy?.34:.23,heavy,face,low:!!hit.low};
  e.hitStun=e.hurt.duration;e.knockVX=face*(heavy?112:62);e.flash=.11;e.melee=null;e.face=-face;
  if(heavy&&e.t!=='fly'){e.vy=-118;e.on=false;e.sup=null;}
  return e.hurt;
}
// Recoil goes through the same wall and floor collision callbacks as walking.
export function advanceGuardRecoil(e,dt,{land,wall,clampX=x=>x,gravity=700,bottom=252}={}){
  if(!e.hurt)return false;
  e.hurt.t+=dt;e.hitStun=Math.max(0,e.hurt.duration-e.hurt.t);
  const x0=e.x;e.x=clampX(e.x+(e.knockVX||0)*dt);wall?.(e,x0,5);
  e.knockVX*=Math.exp(-8*dt);
  if(e.t==='snp'&&e.on===undefined)e.on=true;
  if(e.t!=='fly'&&e.on&&land&&!land(e.x,e.y-.5,e.y+.5,4,false)){e.on=false;e.vy=0;}
  if(e.t==='fly')e.y+=Math.sin(e.hurt.t*15)*dt*(e.hurt.heavy?15:7);
  else if(e.on!==true){
    const y0=e.y;e.vy=Math.min((e.vy||0)+gravity*dt,360);e.y+=e.vy*dt;
    const s=e.vy>=0&&land?.(e.x,y0,e.y,4,false);
    if(s){e.y=s.y;e.vy=0;e.on=true;e.sup=s;}
  }
  if(e.y>bottom){e.dead=true;e.hurt=null;e.hitStun=0;return true;}
  if(e.hurt.t>=e.hurt.duration&&!(e.t==='snp'&&e.on===false)){e.hurt=null;e.hitStun=0;e.knockVX=0;}
  return true;
}
export function guardDefeat(e,hit={}){
  const heavy=!!hit.heavy,face=direction(hit,e);
  return {k:'guardDefeat',x:e.x,y:e.y,vx:face*(heavy?100:65),vy:heavy?-175:-115,
    face:-face,t:0,life:1.5,landed:false,landT:0,heavy};
}
export function advanceGuardDefeat(f,dt,{land,wall,gravity=700}={}){
  if(f.landed){f.landT+=dt;if(f.support?.gone){f.landed=false;f.vy=0;}else{f.y=f.support?.y??f.y;return;}}
  const x0=f.x;f.x+=f.vx*dt;wall?.(f,x0,5);
  const y0=f.y;f.vy=Math.min(f.vy+gravity*dt,360);f.y+=f.vy*dt;
  const s=f.vy>=0&&land?.(f.x,y0,f.y,4,false);
  if(s){f.y=s.y;f.vx=f.vy=0;f.landed=true;f.landT=0;f.support=s;return true;}
  return false;
}
export function healingEnemyDrop(world,e,random=Math.random){
  if(!['run','snp','fly'].includes(e.t))return null;
  const state=world.wukongRecovery??={defeats:0};state.defeats++;
  if(![world.p,world.p2].some(p=>p&&!p.dead&&p.hp<p.maxHp))return null;
  if(state.defeats%4!==0||world.items.some(it=>!it.dead&&HEALING_ITEMS[it.kind]&&Math.abs(it.x-e.x)<100))return null;
  return {x:e.x,y:e.y-12,vx:0,vy:-75,kind:random()<.2?'healPill':'healPeach',fromPod:true,peach:true,landed:false};
}
// Preserve button edges pressed inside the 3–5 frame impact pause.
export function advanceImpactPause(world,dt,inputs){
  if(world.impactPauseLock>0)world.impactPauseLock=Math.max(0,world.impactPauseLock-dt);
  if(!(world.hitStop>0)){
    if(world.hitStopInputs)for(let i=0;i<inputs.length;i++)Object.assign(inputs[i],world.hitStopInputs[i]||{});
    delete world.hitStopInputs;return false;
  }
  world.hitStop=Math.max(0,world.hitStop-dt);world.hitStopInputs??=inputs.map(()=>({}));
  for(let i=0;i<inputs.length;i++)for(const key of Object.keys(inputs[i]))if(key.endsWith('Edge')&&inputs[i][key])world.hitStopInputs[i][key]=true;
  return true;
}
