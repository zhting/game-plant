import { actorRootY } from './wukong-mount.mjs';
import { cancelStaffCharge } from './wukong-special-staff.mjs';

export const WUKONG_RAGE=Object.freeze({max:100,perHit:50});
export const RAGE_ULTIMATES=Object.freeze({
  sweep:Object.freeze({id:'sweep',name:'横扫天宫',duration:1,radius:86,pulses:[.16,.38,.60],damage:4,sheet:'flower',cycles:3}),
  pillar:Object.freeze({id:'pillar',name:'定海神针',duration:1.08,radius:100,pulses:[.32,.64],damage:7,sheet:'cleave',cycles:1}),
  storm:Object.freeze({id:'storm',name:'金箍风暴',duration:1.24,radius:102,pulses:[.18,.34,.50,.66,.82,.98],damage:2,sheet:'cyclone',cycles:2}),
  qi:Object.freeze({id:'qi',name:'万道棍气',duration:1.18,radius:76,pulses:[.18,.48,.78],damage:4,sheet:'advance',cycles:3})
});
export const ultimateSpec=attack=>RAGE_ULTIMATES[attack?.ultimate]||RAGE_ULTIMATES.sweep;
export const rageReady=p=>(p.rage||0)>=(p.maxRage||WUKONG_RAGE.max);
export function gainHitRage(p){
  const max=p.maxRage||WUKONG_RAGE.max,before=p.rage||0;
  p.rage=Math.min(max,before+WUKONG_RAGE.perHit);
  return {rageAdded:p.rage-before,rageReady:before<max&&p.rage>=max};
}
export function beginRageUltimate(p,random=Math.random){
  if(!rageReady(p)||p.dead||p.dive||p.enteringExit||p.exitEntered||p.staff?.kind==='ultimate')return false;
  let bag=p.rageBag?.length?p.rageBag:Object.keys(RAGE_ULTIMATES);
  let choices=bag.filter(id=>id!==p.lastUltimate);if(!choices.length)choices=bag;
  const id=choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))],move=RAGE_ULTIMATES[id];
  if(!move)return false;
  if(p.magic?.transform)delete p.magic.transform;
  p.rageBag=bag.filter(key=>key!==id);p.lastUltimate=id;p.rage=0;
  cancelStaffCharge(p,true);p.hurt=null;p.knockVX=0;p.prone=p.spin=false;
  p.staff={kind:'ultimate',ultimate:id,variant:id==='pillar'?'overhead':id==='qi'?'fullSwing':id==='storm'?'skyWheel':'whirlwind',
    t:0,duration:move.duration,combo:3,face:p.face||1,aim:0,weapon:p.weapon,hits:[],pulseHits:move.pulses.map(()=>[]),emitted:[]};
  p.cool=move.duration+.06;p.staffCombo=0;p.staffComboT=0;p.wantFire=false;
  p.invT=Math.max(p.invT||0,move.duration+.08);return true;
}
const sizeOf=p=>(p.giantT>0?2:1)*(p.magicScale||1);
export function ultimateShape(p){
  const move=ultimateSpec(p.staff),size=sizeOf(p),face=p.staff?.face||p.face||1;
  const center={x:p.x,y:actorRootY(p)-18*size};
  if(move.id==='pillar')return {kind:'rect',x:p.x+(face>0?24:-100)*size,y:actorRootY(p)-126*size,w:76*size,h:126*size,center};
  return {kind:'circle',...center,radius:move.radius*size,center};
}
export function ultimateContains(shape,box){
  if(shape.kind==='rect')return box.x<shape.x+shape.w&&box.x+box.w>shape.x&&box.y<shape.y+shape.h&&box.y+box.h>shape.y;
  return Math.hypot(Math.max(box.x-shape.x,0,shape.x-box.x-box.w),Math.max(box.y-shape.y,0,shape.y-box.y-box.h))<=shape.radius;
}
// Projectiles use the existing swept-volume collision and wall blocking.
export function advanceRageUltimate(p){
  const a=p.staff;if(a?.kind!=='ultimate'||a.ultimate!=='qi'||p.dead)return;
  const move=ultimateSpec(a),size=sizeOf(p),face=a.face;
  a.emitted??=[];
  for(let i=0;i<move.pulses.length;i++)if(a.t>=move.pulses[i]&&!a.emitted.includes(i)){
    a.emitted.push(i);const waves=p.staffWaves??=[];
    for(const angle of [-.23,0,.23]){
      if(waves.filter(w=>!w.dead).length>=15)break;
      const x=p.x+face*13*size,y=actorRootY(p)-19*size;
      waves.push({x,y,oldX:p.x+face*3*size,oldY:y,vx:face*Math.cos(angle)*350,vy:Math.sin(angle)*350,
        face,angle,t:0,travel:0,range:320,radius:11*size,strength:2,fire:false,ultimate:true,
        damage:move.damage*size,pierce:5,hits:[],owner:p.pid||p.owner||1});
    }
  }
}
export function resolveRageUltimate(p,{enemies,pods,parts,solids,enemyBox,podBox,damageEnemy,popPod,hitPart,bullets=[]},segmentBoxTime){
  const a=p.staff;if(a?.kind!=='ultimate'||p.dead||p.dive||p.enteringExit||p.exitEntered)return;
  const move=ultimateSpec(a),shape=ultimateShape(p),center=shape.center;
  for(let i=0;i<move.pulses.length;i++){
    if(a.t<move.pulses[i]||a.t>move.pulses[i]+1/60+.00001)continue;
    const apply=(target,box,fn)=>{
      const hits=a.pulseHits[i];if(hits.includes(target)||!ultimateContains(shape,box))return;
      const to={x:box.x+box.w/2,y:box.y+box.h/2},contact=segmentBoxTime(center,to,box);
      if(solids.some(s=>s.g&&!s.gone&&!s.water&&segmentBoxTime(center,to,s)!==null&&segmentBoxTime(center,to,s)<contact-.001))return;
      hits.push(target);fn(to);
    };
    if(move.id!=='qi'){
      const shot={k:'staff',vx:a.face,vy:move.id==='pillar'?1:0,heavy:true,owner:p.pid||p.owner};
      for(const e of enemies)if(!e.dead&&e.t!=='beam'&&!(e.t==='eel'&&e.out<.3))apply(e,enemyBox(e),to=>damageEnemy(e,move.damage*sizeOf(p),to.x,to.y,shot));
      for(const pod of pods)if(!pod.dead&&!pod.flee)apply(pod,podBox(pod),()=>popPod(pod));
      for(const part of parts)if(part.hp>0)apply(part,part.hitBox||part,to=>hitPart(part,move.damage*sizeOf(p),{...shot,...to}));
    }
    for(const b of bullets)if(!b.dead&&Math.hypot(b.x-center.x,b.y-center.y)<=move.radius*sizeOf(p))b.dead=true;
  }
}
