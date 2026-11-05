import { actorRootY, beastRider } from './wukong-mount.mjs';
import { clearStaffCommands } from './wukong-staff-commands.mjs';
import { extendStaffAction } from './wukong-staff-extension.mjs';

export const STAFF_CHARGE=Object.freeze({start:.24,ready:.55,full:1.25,hold:1.6,recovery:.36});
export const AIR_CLEAVE=Object.freeze({duration:.58,dropAt:.11,fallSpeed:190,damage:4});
const sizeOf=p=>(p.giantT>0?2:1)*(p.magicScale||1);
const unavailable=p=>p.dead||p.dive||p.hurt||p.enteringExit||p.exitEntered||p.staff?.kind==='ultimate';

export function cancelStaffCharge(p,blockUntilRelease=false){
  clearStaffCommands(p);
  if(p.staffCharge){p.staffCharge=null;p.wantFire=false;if(blockUntilRelease)p.staffChargeBlocked=true;}
}
export function beginAirCleave(p){
  if(unavailable(p)||p.onGround||p.ride||beastRider(p)||p.airCleaveUsed)return false;
  cancelStaffCharge(p,true);p.airCleaveUsed=true;p.prone=p.spin=false;p.wantFire=false;
  p.staff=extendStaffAction({kind:'slam',variant:'airCleave',airCleave:true,t:0,duration:AIR_CLEAVE.duration,
    combo:3,face:p.face||1,aim:0,weapon:p.weapon,hits:[],wasAir:true});
  p.cool=p.staff.duration+.08;return true;
}

export function releaseStaffQi(p,charge){
  const full=charge.t+1e-9>=STAFF_CHARGE.full,size=sizeOf(p),face=p.face||1;
  const aim=p.ay<-.35?-.38:0,spread=p.weapon==='spread'?[-.19,0,.19]:[0];
  const strength=full?2:1;
  const waves=(p.staffWaves??=[]).filter(w=>!w.dead);p.staffWaves=waves;
  for(const offset of spread){
    if(waves.length>=6)break;
    const angle=aim+offset,speed=full?365:300;
    const x=p.x+face*13*size,y=actorRootY(p)-19*size;
    waves.push({x,y,oldX:p.x+face*3*size,oldY:y,vx:face*Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
      face,angle,t:0,travel:0,range:(full?350:235)*(p.weapon==='laser'?1.25:1),
      radius:(full?13:8)*size*(p.weapon==='laser'?1.15:1),strength,fire:p.weapon==='fire',
      damage:(full?7:4)*size+(p.weapon==='fire'?1:0),pierce:full?5:3,hits:[],owner:p.pid||p.owner||1});
  }
  p.staff={kind:'qiCast',variant:'fullSwing',t:0,duration:STAFF_CHARGE.recovery,
    combo:full?3:2,face,aim,weapon:p.weapon,hits:[],qiStrength:strength};
  p.cool=STAFF_CHARGE.recovery+.08;p.wantFire=false;p.staffCombo=0;p.staffComboT=0;
  return strength;
}
export function advanceStaffQi(p,dt){
  if(!p.staffWaves)return;
  if(p.dead||p.enteringExit||p.exitEntered){p.staffWaves=[];return;}
  for(const w of p.staffWaves){
    if(w.dead)continue;w.oldX=w.x;w.oldY=w.y;w.t+=dt;
    const distance=Math.min(Math.hypot(w.vx,w.vy)*dt,w.range-w.travel),scale=distance/(Math.hypot(w.vx,w.vy)||1);
    w.x+=w.vx*scale;w.y+=w.vy*scale;w.travel+=distance;
    // Let collision consume the final travelled segment before removing it.
    if(w.travel>=w.range)w.expires=true;
  }
  p.staffWaves=p.staffWaves.filter(w=>!w.dead);
}

// Only human input enables charging/Down shortcuts. Summon AI retains its
// existing repeated close-range swings instead of accidentally charging forever.
export function advanceSpecialStaff(p,input,dt,{enabled=false,onCharge=()=>{},onRelease=()=>{},onSwing=()=>{},onSlamLand=()=>{}}={}){
  advanceStaffQi(p,dt);
  const current=p.staff;
  if(current?.airCleave){
    if(!p.onGround&&!current.dived&&current.t>=AIR_CLEAVE.dropAt){p.vy=Math.max(p.vy||0,AIR_CLEAVE.fallSpeed);p.spin=false;current.dived=true;}
    if(p.onGround&&!current.landed){current.landed=true;current.t=Math.max(current.t,current.duration*.72);onSlamLand();}
  }
  if(!enabled)return {blocked:false};
  const downEdge=!!input.downEdge||!!input.down&&!p.staffDownHeld;
  if(input.down||p.staffDownHeld!==undefined)p.staffDownHeld=!!input.down;
  if(p.onGround&&p.airCleaveUsed)p.airCleaveUsed=false;
  if(unavailable(p)){cancelStaffCharge(p,true);return {blocked:true};}
  if(downEdge&&beginAirCleave(p)){onSwing('slam');return {blocked:true,started:true};}
  if(p.staff?.airCleave){cancelStaffCharge(p,true);return {blocked:true};}
  if(p.staffChargeBlocked){
    if(!input.fire){p.staffChargeBlocked=false;p.wantFire=false;}
    return {blocked:true};
  }
  if(input.fire){
    const c=p.staffCharge??={t:0,active:false,ready:false,full:false};
    const pace=(p.weapon==='machine'?1/1.7:1)*(p.rapid?.8:1);
    c.t=Math.min(STAFF_CHARGE.hold,c.t+dt/pace);
    // A deliberate direction command must finish its complete body sequence.
    // Holding J can build energy during it, but cannot replace a long flower or
    // three-hit combo with the charging pose after just 0.24 seconds.
    if(p.staff?.command||p.staff?.extension)return {blocked:false};
    if(c.t>=STAFF_CHARGE.start){
      if(!c.active){c.active=true;p.staff=null;p.wantFire=false;p.prone=false;if(p.heroAnimation)p.heroAnimation.prone=0;onCharge('start');}
      if(!c.ready&&c.t+1e-9>=STAFF_CHARGE.ready){c.ready=true;onCharge('ready');}
      if(!c.full&&c.t+1e-9>=STAFF_CHARGE.full){c.full=true;onCharge('full');}
      return {blocked:true};
    }
  }else if(p.staffCharge){
    const charge=p.staffCharge;p.staffCharge=null;
    if(charge.active){
      p.wantFire=false;
      if(charge.t+1e-9>=STAFF_CHARGE.ready){const strength=releaseStaffQi(p,charge);onRelease(strength);return {blocked:true,released:true};}
    }
  }
  return {blocked:false};
}

// A crescent is a swept volume: order contacts along travel and stop at the
// first terrain wall, including when a fast wave crosses a wall in one tick.
export function resolveStaffQi(p,{enemies,pods,parts,solids,enemyBox,podBox,damageEnemy,popPod,hitPart,onWaveImpact=()=>{}},segmentBoxTime){
  if(!p.staffWaves)return;
  if(p.dead||p.enteringExit||p.exitEntered){p.staffWaves=[];return;}
  for(const w of p.staffWaves){
    if(w.dead)continue;
    const from={x:w.oldX,y:w.oldY},to={x:w.x,y:w.y},contacts=[];
    let wall=Infinity;
    for(const s of solids)if(s.g&&!s.gone&&!s.water){const t=segmentBoxTime(from,to,s,w.radius*.72);if(t!==null)wall=Math.min(wall,t);}
    const add=(target,box,type)=>{
      if(w.hits.includes(target))return;
      const t=segmentBoxTime(from,to,box,w.radius*.72);if(t!==null&&t<wall-.00001)contacts.push({target,type,t});
    };
    for(const e of enemies)if(!e.dead&&e.t!=='beam'&&!(e.t==='eel'&&e.out<.3))add(e,enemyBox(e),'enemy');
    for(const pod of pods)if(!pod.dead&&!pod.flee)add(pod,podBox(pod),'pod');
    for(const part of parts)if(part.hp>0)add(part,part.hitBox||part,'part');
    contacts.sort((a,b)=>a.t-b.t);
    for(const {target,type,t}of contacts){
      const x=from.x+(to.x-from.x)*t,y=from.y+(to.y-from.y)*t;
      const shot={k:'staffWave',vx:w.vx,vy:w.vy,heavy:w.strength===2,owner:w.owner,x,y};
      if(type==='enemy'){
        const closed=target.t==='box'&&!target.open;damageEnemy(target,w.damage,x,y,shot);
        if(closed){w.dead=true;break;}
      }else if(type==='part')hitPart(target,w.damage,shot);
      else popPod(target);
      w.hits.push(target);w.pierce--;onWaveImpact(x,y,w);
      if(w.pierce<=0){w.dead=true;break;}
    }
    if(!w.dead&&wall!==Infinity){w.x=from.x+(to.x-from.x)*wall;w.y=from.y+(to.y-from.y)*wall;w.dead=true;onWaveImpact(w.x,w.y,w);}
    if(w.expires)w.dead=true;
  }
}
