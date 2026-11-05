// First-level Wukong combat. Map, locomotion, enemies and inventory stay in Contra.
import { martialStaffMotion, STAFF_FORMS } from './wukong-staff-forms.mjs';
import { actorRootY, beastRider, mountedBodyMotion } from './wukong-mount.mjs';
import { advanceHeroAnimation, wholeHeroPose, HERO_STAFF_FAMILIES } from './wukong-hero-frames.mjs';
import { STAFF_SEQUENCES, staffSequenceBeat } from './wukong-staff-sequences.mjs';
import { advanceStaffCommands, clearStaffCommands, staffCommand, travelStaffCommand } from './wukong-staff-commands.mjs';
import { COMMAND_CLIPS } from './wukong-command-clips.mjs';
import { extendStaffAction, staffExtension } from './wukong-staff-extension.mjs';
import { AIR_CLEAVE, advanceSpecialStaff, cancelStaffCharge, resolveStaffQi } from './wukong-special-staff.mjs';
import { RAGE_ULTIMATES, beginRageUltimate, advanceRageUltimate, resolveRageUltimate } from './wukong-rage.mjs';
export const STAFF_TIMING={windup:.055,recovery:.055};
// The dedicated prone drawing must match the upright actor's body size. Share
// this proportion with its hands and cloth so the staff stays in the grip.
export const PRONE_POSTURE_SCALE=.75;
export const STAFF_VARIANTS=Object.freeze(['cross','reverse','thrust','uppercut','overhead','figureEight','lowSweep','whirlwind','doubleTap','risingSpin','cloud','backFlower','sideWheel','carryFlower','fullSwing','doubleFlower','skyWheel','wushuFlow',...Object.keys(STAFF_SEQUENCES)]);
export const AIR_VARIANTS=Object.freeze(['airWheel','airReverse','airCross','airThrust']);
export const ULTIMATE=RAGE_ULTIMATES.sweep;
export const STAFF_PICKUPS=Object.freeze({M:'疾风棍 · 挥棍速度提升 70%',L:'如意伸缩 · 出棍伸长，收棍稍慢',S:'分身棍 · 三根棍影同时攻击',H:'飞旋金箍 · 掷出并飞回，去回均可命中',R:'疾速诀 · 棍招额外提速 25%',F:'烈焰棍 · 烈焰棍影，伤害 +1'});
export function staffPower(p){
  const weapon=p.staff?.weapon||p.weapon||'rifle';
  return {weapon,pace:(weapon==='machine'?1/1.7:1)*(p.rapid?.8:1),length:staffExtension(p).scale,
    copies:weapon==='spread'?3:1,returning:weapon==='homing',fire:weapon==='fire'};
}
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const staffSize=p=>(p.giantT>0?2:1)*(p.magicScale||1);
export function startUltimate(p,random=Math.random){return beginRageUltimate(p,random);}
// Shared animation and hit geometry: anticipation, strike and a soft return to guard.
export function staffMotion(p,time=p.staff?.t??0){
  return mountedBodyMotion(p,p.prone||p.staff?.kind==='ultimate'?legacyStaffMotion(p,time):martialStaffMotion(p,time));
}
function legacyStaffMotion(p,time=p.staff?.t??0){
  const a=p.staff,u=a?clamp(time/a.duration):0;
  const weight=Math.sin(Math.PI*u)**2, strike=smooth((u-.15)/.55),recover=smooth((u-.72)/.28);
  let angle=a?.aim??Math.atan2(p.ay||0,Math.abs(p.ax??1));
  if(a){
    let offset;
    if(a.kind==='ultimate')offset=-Math.PI/2+u*Math.PI*6;
    else if(a.kind==='spin')offset=a.variant==='airCross'?-1.25+strike*2.5:a.variant==='airThrust'?Math.sin(strike*Math.PI)*.08:(a.variant==='airReverse'?1:-1)*(Math.PI-u*Math.PI*2);
    else if(a.kind==='slam')offset=-1.3+strike*2.6;
    else if(a.variant==='cross')offset=-.9+strike*1.8;
    else if(a.variant==='reverse')offset=.9-strike*1.8;
    else if(a.variant==='thrust')offset=Math.sin(strike*Math.PI)*.07;
    else if(a.variant==='uppercut')offset=1.05-strike*2.2;
    else if(a.variant==='overhead')offset=-1.65+strike*2.2;
    else if(a.variant==='figureEight')offset=.85*Math.sin(strike*Math.PI*2);
    else if(a.variant==='lowSweep')offset=.12+strike*.82;
    else if(a.variant==='whirlwind')offset=-.9+strike*Math.PI*2;
    else if(a.variant==='doubleTap')offset=-.75+1.5*Math.sin(strike*Math.PI*2);
    else if(a.variant==='risingSpin')offset=1.2-strike*Math.PI*2;
    else if(a.kind==='smash')offset=-1.65+strike*2.2;
    else offset=(a.combo===2?.78:-.78)+(a.combo===2?-1.56:1.56)*strike;
    // Blend in from the idle grip instead of snapping the staff at the first frame.
    angle+=offset*smooth(u/.15)*(1-recover);
  }
  const variant=a?.variant,reverse=variant==='reverse',thrust=variant==='thrust'||variant==='airThrust',lift=variant==='uppercut'||variant==='risingSpin',overhead=variant==='overhead',low=variant==='lowSweep';
  const lean=(overhead?.3:thrust?.22:reverse?-.22:a?.kind==='smash'?.24:.16)*Math.sin(u*Math.PI*2)*weight;
  return {phase:u,weight,angle,lean,sway:(reverse?-1.1:thrust?1.4:.4)*weight,
    bob:(low?3:lift?1.7:overhead?1.4:.65)*weight,stretch:1+(low?-.09:lift?-.035:thrust?.025:0)*weight,
    gripX:((p.prone?14:4)+(thrust?6:Math.sin(angle)*1.5)*weight)*(p.prone?PRONE_POSTURE_SCALE:1),
    gripY:((p.prone?-6:p.spin?-15:-18)-Math.cos(angle)*weight-(lift?3*strike*weight:0)+(low?4*weight:0))*(p.prone?PRONE_POSTURE_SCALE:1)};
}
export function advanceStaff(p,input,dt,{autofire=true,onSwing=()=>{},random=Math.random,playerActions=false,onCharge=()=>{},onRelease=()=>{},onSlamLand=()=>{}}={}){
  if(playerActions)advanceStaffCommands(p,input,dt);
  advanceHeroAnimation(p,dt);
  advanceStaffThrows(p,dt);
  p.cool-=dt;
  if(p.staff){
    p.staff.t+=dt;
    const sequence=STAFF_SEQUENCES[p.staff.variant];
    if(sequence?.throwAt&&!p.staff.sequenceThrown&&p.staff.t>=p.staff.duration*sequence.throwAt){
      p.staff.sequenceThrown=true;const q=staffGeometry(p),size=staffSize(p);
      if((p.staffThrows||[]).filter(b=>!b.dead).length<3)(p.staffThrows??=[]).push({x:q.origin.x,y:q.origin.y,oldX:q.origin.x,oldY:q.origin.y,
        vx:p.staff.face*235,vy:sequence.lob?-78:0,t:0,angle:q.angle,phase:'out',returnAt:.34,hits:[[],[]],size,technique:p.staff.variant});
    }
    if(p.staff.airCleave&&!p.onGround&&!p.staff.landed)p.staff.t=Math.min(p.staff.t,p.staff.duration*.74);
    if(p.staff.t>=p.staff.duration)p.staff=null;
  }
  if(p.staffComboT>0){p.staffComboT=Math.max(0,p.staffComboT-dt);if(!p.staffComboT){p.staffCombo=0;delete p.staffTravelChain;}}
  const special=advanceSpecialStaff(p,input,dt,{enabled:playerActions,onCharge,onRelease,onSwing,onSlamLand});
  advanceRageUltimate(p);
  if(special.blocked){clearStaffCommands(p);p.wantFire=false;return !!special.started;}
  if(!playerActions&&input.fireEdge)p.wantFire=true;
  const trigger=playerActions?(autofire?input.fire||p.wantFire:p.wantFire):autofire?input.fire:p.wantFire;
  if(!trigger||p.cool>0||p.staff||p.dead||p.dive||p.hurt)return false;
  p.wantFire=false;
  p.staffCombo=((p.staffCombo||0)%3)+1;p.staffComboT=1;
  const airborne=!p.onGround&&!beastRider(p);
  const command=playerActions?travelStaffCommand(p,staffCommand(p,input,airborne&&p.ride!=='heli'),airborne&&p.ride!=='heli'):{move:null,face:p.face||1,up:input.up,down:input.down};
  const move=command.move;
  const kind=move?.kind||(airborne&&command.down?'slam':airborne&&p.ride!=='heli'?'spin':command.up?'lift':p.staffCombo===3?'smash':p.staffCombo===2?'backhand':'sweep');
  const pool=move?null:kind==='spin'?AIR_VARIANTS:['sweep','backhand','smash'].includes(kind)?STAFF_VARIANTS:null;
  let choices=pool?.filter(v=>v!==p.staffLastVariant);
  if(p.heroFrames&&pool===STAFF_VARIANTS){
    const recent=p.staffRecentFamilies||[];
    if(!p.staffVariantBag?.length)p.staffVariantBag=[...pool];
    const different=v=>!recent.slice(-2).includes(HERO_STAFF_FAMILIES[v]);
    choices=p.staffVariantBag.filter(different);
    // A fresh visual family can bridge the last few entries in a bag. Keep
    // those entries pending, so every technique still gets its turn soon.
    if(!choices.length)choices=pool.filter(different);
  }
  const variant=move?.variant||(choices?choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))]:kind);
  if(p.heroFrames&&pool===STAFF_VARIANTS){
    p.staffVariantBag=p.staffVariantBag.filter(v=>v!==variant);
    p.staffRecentFamilies=[...(p.staffRecentFamilies||[]),HERO_STAFF_FAMILIES[variant]].slice(-3);
  }
  if(pool||move)p.staffLastVariant=variant;
  const pace=(p.weapon==='machine'?1/1.7:1)*(p.rapid?.8:1);
  const combo=move?.combo||p.staffCombo;
  const duration=(COMMAND_CLIPS[move?.id]?.duration??(variant==='wushuFlow'?1.22:undefined)??STAFF_SEQUENCES[variant]?.duration??(kind==='slam'?.4:kind==='lift'?.36:combo===3?.42:.32)*(STAFF_FORMS[variant]?.duration||1))*pace;
  p.staff=extendStaffAction({kind,variant,t:0,duration,combo,face:command.face,
    aim:move?0:Math.atan2(p.ay||0,Math.abs(p.ax??1)),weapon:p.weapon,hits:[],...(move?{command:move.id,travel:Math.abs(p.vx||0)>2}:{})},pace);
  delete p.staffIntent;
  if(move){p.prone=false;if(p.heroAnimation)p.heroAnimation.prone=0;}
  p.cool=p.staff.duration+.045*pace;p.staffComboT=Math.max(p.staffComboT,p.cool+.42);
  if(p.weapon==='homing'&&(p.staffThrows||[]).filter(b=>!b.dead).length<2){
    const q=staffGeometry(p);(p.staffThrows||=[]).push({x:q.origin.x,y:q.origin.y,oldX:q.origin.x,oldY:q.origin.y,
      vx:p.staff.face*Math.cos(p.staff.aim)*220,vy:Math.sin(p.staff.aim)*220,t:0,angle:0,phase:'out',hits:[[],[]],size:staffSize(p)});
  }
  onSwing(kind);return true;
}
export function staffGeometry(p,time=p.staff?.t??0){
  if(p.heroFrames){const whole=wholeHeroPose(p,time);if(whole)return whole;}
  const a=p.staff,giant=staffSize(p),face=a?.face||p.face||1;
  const motion=staffMotion(p,time),{phase}=motion;
  // Cloud waving rotates in a horizontal plane above the head. Project that
  // plane into the side view instead of drawing another vertical windmill.
  const planeY=motion.planeY??1,dx=Math.cos(motion.angle),dy=Math.sin(motion.angle)*planeY;
  const projection=planeY===1?1:Math.hypot(dx,dy),angle=planeY===1?motion.angle:Math.atan2(dy,dx);
  let reach=37;
  if(a){
    reach=a.combo===3?66:a.combo===2?52:46;
    if(a.kind==='spin')reach=a.combo===3?66:50;
    else if(a.kind==='slam')reach=48;
    else if(a.kind==='ultimate')reach=37+(ULTIMATE.radius-37)*smooth(phase/.16)*(1-smooth((phase-.72)/.28));
    else reach=37+(reach-37)*motion.weight;
  }
  // Sliding toward the middle redistributes the same shaft between its ends.
  // It must not grow a second pole behind the gripping hand.
  const slide=(motion.center||0)*17;
  reach-=slide;
  if(a?.kind!=='ultimate')reach*=staffExtension(p,time).scale;
  const origin={x:p.x+face*motion.gripX*giant,y:actorRootY(p)+motion.gripY*giant};
  reach*=projection;
  const axis={x:Math.cos(angle)*face,y:Math.sin(angle)},rear=(9+slide)*giant*projection;
  return {origin,tip:{x:origin.x+axis.x*reach*giant,y:origin.y+axis.y*reach*giant},
    butt:{x:origin.x-axis.x*rear,y:origin.y-axis.y*rear},angle,face,reach:reach*giant,rear,phase,projection};
}
export function staffCopies(p,line=staffGeometry(p)){
  if(staffPower(p).copies===1||p.staff?.kind==='ultimate')return [line];
  return [-.38,0,.38].map(offset=>{const angle=line.angle+offset,axis={x:Math.cos(angle)*line.face,y:Math.sin(angle)};
    return {...line,angle,tip:{x:line.origin.x+axis.x*line.reach,y:line.origin.y+axis.y*line.reach},
      butt:{x:line.origin.x-axis.x*(line.rear||9),y:line.origin.y-axis.y*(line.rear||9)}};});
}
export function thrownStaffGeometry(b){
  const dx=Math.cos(b.angle)*17*b.size,dy=Math.sin(b.angle)*17*b.size;
  return {origin:{x:b.x-dx,y:b.y-dy},tip:{x:b.x+dx,y:b.y+dy}};
}
export function advanceStaffThrows(p,dt){
  if(!p.staffThrows)return;
  if(p.dead||p.enteringExit||p.exitEntered){p.staffThrows=[];return;}
  for(const b of p.staffThrows){
    if(b.dead)continue;b.oldX=b.x;b.oldY=b.y;b.t+=dt;b.angle+=dt*19;
    if(b.phase==='out'&&b.t>=(b.returnAt??.62))b.phase='return';
    if(b.phase==='return'){
      const dx=p.x-b.x,dy=actorRootY(p)-18-b.y,d=Math.hypot(dx,dy);
      if(d<9||b.t>2.4){b.dead=true;continue;}b.vx=dx/d*280;b.vy=dy/d*280;
    }
    b.x+=b.vx*dt;b.y+=b.vy*dt;
  }
  p.staffThrows=p.staffThrows.filter(b=>!b.dead);
}
function resolveThrows(p,{enemies,pods,parts,solids,enemyBox,podBox,damageEnemy,popPod,hitPart}){
  if(p.dead||p.enteringExit||p.exitEntered){if(p.staffThrows)p.staffThrows=[];return;}
  for(const b of p.staffThrows||[]){
    if(b.dead)continue;
    const from={x:b.oldX,y:b.oldY},to={x:b.x,y:b.y};
    if(solids.some(s=>s.g&&!s.gone&&!s.water&&segmentBoxTime(from,to,s,1)!==null)){
      if(b.phase==='out'){b.x=b.oldX;b.y=b.oldY;b.phase='return';}else b.dead=true;
      continue;
    }
    const lines=[{origin:from,tip:to},thrownStaffGeometry(b)],hits=b.hits[b.phase==='out'?0:1];
    const apply=(target,box,fn)=>{
      if(hits.includes(target))return;
      for(const line of lines){
        const contact=segmentBoxTime(line.origin,line.tip,box,3);if(contact===null)continue;
        if(solids.some(s=>s.g&&!s.gone&&!s.water&&segmentBoxTime(line.origin,line.tip,s)!==null&&segmentBoxTime(line.origin,line.tip,s)<contact-.001))continue;
        if(fn()!==false)hits.push(target);break;
      }
    };
    for(const e of enemies)if(!e.dead&&e.t!=='beam')apply(e,enemyBox(e),()=>{damageEnemy(e,2*b.size,b.x,b.y,{k:'staff',vx:b.vx,vy:b.vy,heavy:b.phase==='return',owner:p.pid||p.owner});return e.t!=='box'||e.open;});
    for(const pod of pods)if(!pod.dead)apply(pod,podBox(pod),()=>popPod(pod));
    for(const part of parts)if(part.hp>0)apply(part,part.hitBox||part,()=>hitPart(part,2*b.size,{k:'staff',heavy:b.phase==='return',vx:b.vx,x:b.x,y:b.y}));
  }
}
export function segmentBoxTime(from,to,box,padding=0){
  const r={x:box.x-padding,y:box.y-padding,w:box.w+2*padding,h:box.h+2*padding};
  const dx=to.x-from.x,dy=to.y-from.y;let first=0,last=1;
  for(const [p,q]of [[-dx,from.x-r.x],[dx,r.x+r.w-from.x],[-dy,from.y-r.y],[dy,r.y+r.h-from.y]]){
    if(Math.abs(p)<1e-9){if(q<0)return null;}
    else{const t=q/p;if(p<0)first=Math.max(first,t);else last=Math.min(last,t);if(first>last)return null;}
  }
  return first;
}
export function resolveStaff(p,{enemies,pods,parts,solids,enemyBox,podBox,damageEnemy,popPod,hitPart,bullets=[],onWaveImpact}){
  if(p.dead||p.enteringExit||p.exitEntered)cancelStaffCharge(p,true);
  resolveThrows(p,{enemies,pods,parts,solids,enemyBox,podBox,damageEnemy,popPod,hitPart});
  resolveStaffQi(p,{enemies,pods,parts,solids,enemyBox,podBox,damageEnemy,popPod,hitPart,onWaveImpact},segmentBoxTime);
  const a=p.staff;
  if(a?.kind==='qiCast'||p.staffCharge?.active)return;
  if(a?.kind==='ultimate'){
    return resolveRageUltimate(p,{enemies,pods,parts,solids,enemyBox,podBox,damageEnemy,popPod,hitPart,bullets},segmentBoxTime);
  }
  const windup=Math.min(STAFF_TIMING.windup,(a?.duration||1)*.17),recovery=Math.min(STAFF_TIMING.recovery,(a?.duration||1)*.17);
  if(!a||p.dead||p.dive||p.enteringExit||a.t<windup||a.t>a.duration-recovery||staffExtension(p).recovering)return;
  const beat=staffSequenceBeat(a.variant,a.t/a.duration);
  if(beat&&(beat.phase<.15||beat.phase>.85))return;
  const hitList=beat?(a.beatHits??=[[],[],[]])[beat.index]:a.hits;
  const heavy=beat?!!beat.heavy:a.combo===3||['overhead','fullSwing','slam'].includes(a.variant||a.kind);
  const shot={k:'staff',vx:a.face,vy:Math.sin(a.aim),heavy,low:a.variant==='lowSweep',owner:p.pid||p.owner,form:a.command||a.variant||a.kind};
  const size=staffSize(p),damage=(a.airCleave?AIR_CLEAVE.damage:beat?(beat.heavy?3:2):a.combo===3?3:2)*(size)+(staffPower(p).fire?1:0);
  const previous=staffCopies(p,staffGeometry(p,Math.max(windup,a.t-1/60))),current=staffCopies(p),lines=[...previous,...current];
  shot.impactAngle=Math.atan2(current[0].tip.y-current[0].origin.y,current[0].tip.x-current[0].origin.x);
  if(p.heroFrames){
    // A drawn keyframe can move the shaft a long way in one tick. Sweep the
    // actual endpoints between those frames so an enemy between two drawings
    // is hit without adding an invisible extension to the painted staff.
    for(let i=0;i<current.length;i++)for(let step=1;step<6;step++){
      const u=step/6,a=previous[i],b=current[i],mix=key=>({x:a[key].x+(b[key].x-a[key].x)*u,y:a[key].y+(b[key].y-a[key].y)*u});
      lines.push({origin:mix('origin'),tip:mix('tip'),butt:mix('butt')});
    }
  }
  const segments=lines.flatMap(line=>[line,{origin:line.origin,tip:line.butt}]);
  const hit=(target,box,apply)=>{
    if(hitList.includes(target))return;
    for(const line of segments){
      const contact=segmentBoxTime(line.origin,line.tip,box,3*size);
      if(contact===null)continue;
      // A staff cannot reach an enemy through a solid terrain block.
      const blocked=solids.some(s=>s.g&&!s.gone&&!s.water&&segmentBoxTime(line.origin,line.tip,s)!==null&&
        segmentBoxTime(line.origin,line.tip,s)<contact-.001);
      if(blocked)continue;
      const point={x:line.origin.x+(line.tip.x-line.origin.x)*contact,y:line.origin.y+(line.tip.y-line.origin.y)*contact};
      if(apply(point)!==false)hitList.push(target);
      break;
    }
  };
  for(const e of enemies){
    if(e.dead||e.t==='beam'||e.t==='eel'&&e.out<.3)continue;
    hit(e,enemyBox(e),point=>{
      const closed=e.t==='box'&&!e.open;
      damageEnemy(e,damage,point.x,point.y,shot);
      return !closed;
    });
  }
  for(const pod of pods)if(!pod.dead&&!pod.flee)hit(pod,podBox(pod),()=>popPod(pod));
  for(const part of parts)if(part.hp>0)hit(part,part.hitBox||part,point=>hitPart(part,damage,{...shot,x:point.x,y:point.y}));
}

