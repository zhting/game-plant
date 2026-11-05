import {HERO_ATLASES} from './wukong-hero-atlas.mjs';
import {actorRootY,beastMotion} from './wukong-mount.mjs';
import {STAFF_SEQUENCES,staffSequenceBeat} from './wukong-staff-sequences.mjs';
import {ultimateSpec} from './wukong-rage.mjs';
import {COMMAND_CLIPS,commandFrameIndex} from './wukong-command-clips.mjs';
import {staffExtension} from './wukong-staff-extension.mjs';

export const HERO_WHOLE_ASSETS=Object.freeze(Object.fromEntries(Object.entries(HERO_ATLASES).map(([name,sheet])=>[sheet.key,`/games/wukong/assets/hero-whole-${name}.webp`])));
export const HERO_IDLE_PERIOD=2.8;
export const HERO_RUN_STRIDE=32;
export const HERO_STAFF_LENGTH=68;
export const HERO_STAFF_FAMILIES=Object.freeze({cross:'sweep',reverse:'sweep',lowSweep:'low',thrust:'thrust',doubleTap:'thrust',
  uppercut:'uppercut',risingSpin:'uppercut',overhead:'cleave',sideWheel:'cleave',figureEight:'flower',whirlwind:'flower',
  cloud:'flower',backFlower:'flower',carryFlower:'flower',fullSwing:'advance',doubleFlower:'blossom',skyWheel:'cyclone',wushuFlow:'martial',
  ...Object.fromEntries(Object.keys(STAFF_SEQUENCES).map(id=>[id,id]))});
const clamp=n=>Math.max(0,Math.min(1,n)),wrap=n=>((n%1)+1)%1;
const frames=(name,start=0,count=8)=>HERO_ATLASES[name]?.frames.slice(start,start+count)||[];
const sample=(list,u)=>list[Math.min(list.length-1,Math.floor(clamp(u)*list.length))];
const loop=(list,u)=>sample(list,wrap(u));

// Animation clocks are presentation data. They never change position, velocity,
// gravity, collision boxes, jump counts, weapon cooldowns or random selection.
export function advanceHeroAnimation(p,dt){
  if(!p.heroFrames)return;
  const m=p.heroAnimation??={clock:0,run:0,prone:0,land:0,ground:!!p.onGround};
  m.clock+=dt;m.land=Math.max(0,m.land-dt);
  if(p.onGround&&!m.ground&&!p.ride)m.land=.12;
  m.ground=!!p.onGround;
  m.prone=Math.max(0,Math.min(1,m.prone+(p.prone?1:-1)*dt/.14));
  if(Math.abs(p.vx||0)>2&&(p.onGround||p.ride||p.beastRider))m.run+=Math.abs(p.vx)*dt/HERO_RUN_STRIDE/(p.giantT>0?2:1);
}

export function wholeHeroFrame(p,time=p.staff?.t??0){
  if(p.dead||p.dive||p.exitEntered)return null;
  const m=p.heroAnimation,clock=m?.clock??p.statusTime??0;
  const mounted=p.ride==='moto'||p.beastRider,cloud=p.ride==='heli'||p.restingOnCloud;
  const air=!mounted&&!cloud&&(p.onGround===false||p.spin||p.artPose==='jump');
  const moving=!air&&!cloud&&!p.prone&&Math.abs(p.vx||0)>2;
  let frame,clip,u=0;
  if(mounted){
    u=p.staff?clamp(time/p.staff.duration):wrap(clock/HERO_IDLE_PERIOD);
    if(p.staff?.kind==='ultimate'&&ultimateSpec(p.staff).cycles>1)u=wrap(u*ultimateSpec(p.staff).cycles);
    const mountedBeat=p.staff&&staffSequenceBeat(p.staff.variant,u);if(mountedBeat)u=mountedBeat.phase;
    frame=p.staff?sample(frames('qilin',4),u):HERO_ATLASES.qilin.frames[beastMotion(p).frame];
    clip=p.staff?'mountedAttack':p.onGround===false?'mountedJump':Math.abs(p.vx||0)>2?'mountedRun':'mountedIdle';
    if(p.staff&&(u<.06||u>.94))frame=HERO_ATLASES.qilin.frames[4];
    if(p.hurt){frame=HERO_ATLASES.qilin.frames[p.hurt.t<p.hurt.duration*.55?2:0];clip='mountedHurt';}
    else if(p.staffCharge?.active){frame=HERO_ATLASES.qilin.frames[p.onGround===false||Math.abs(p.vx||0)>2?beastMotion(p).frame:5+Math.min(1,Math.floor(p.staffCharge.t*.8))];clip='mountedCharge';}
  }else if(p.hurt){
    u=clamp(p.hurt.t/p.hurt.duration);frame=HERO_ATLASES.mobility?.frames[u<.58?10:11];clip='hurt';
  }else if(p.staffCharge?.active){
    const ready=p.staffCharge.ready;
    frame=moving?loop(frames('movement',8),m?.run||0):HERO_ATLASES.cleave.frames[(air?8:0)+(ready?2:1)];
    clip=air?'air:charge':moving?'run:charge':'charge';
  }else if(p.prone||(m?.prone||0)>0){
    const depth=m?.prone??1;
    const index=depth<.75?(p.prone?6:9):8+(Math.floor(clock*4)%2?-1:0);
    frame=HERO_ATLASES.mobility?.frames[index];clip=p.prone?'prone':'rise';
  }else if(p.staff){
    const a=p.staff,name=a.variant||a.kind;
    u=clamp(time/a.duration);
    const attackPhase=u;
    // Finish the airborne cut before the feet reach the floor. The remaining
    // airtime holds its low follow-through; landing then plays the recovery.
    if(a.airCleave&&!a.landed)u=Math.min(.74,u*1.7);
    let sheet='sweep',reverse=false;
    const beat=staffSequenceBeat(name,u);
    if(a.kind==='ultimate'){const move=ultimateSpec(a);sheet=move.sheet;if(move.cycles>1)u=wrap(u*move.cycles);}
    else if(a.kind==='slam')sheet='cleave';
    else if(air&&a.kind==='spin'){sheet=name==='airThrust'?'extra':name==='airCross'?'cleave':'uppercut';reverse=name==='airReverse';}
    else if(name==='wushuFlow')sheet='martial';
    else if(name==='fullSwing')sheet='advance';
    else if(name==='doubleFlower')sheet='blossom';
    else if(name==='skyWheel')sheet='cyclone';
    else if(name==='lowSweep')sheet='low';
    else if(a.kind==='lift'||['uppercut','risingSpin'].includes(name))sheet='uppercut';
    else if(['figureEight','whirlwind','cloud','backFlower','carryFlower'].includes(name))sheet='flower';
    else if(name==='thrust'||name==='airThrust'||name==='doubleTap')sheet='extra';
    else if(a.kind==='slam'||['overhead','sideWheel'].includes(name))sheet='cleave';
    else reverse=name==='reverse';
    if(beat){sheet=beat.sheet;u=beat.phase;reverse=!!beat.reverse;}
    const command=COMMAND_CLIPS[a.command];
    if(command?.sheet)sheet=command.sheet;
    const attackMoving=a.command?!!a.travel:moving;
    const runStart=beat?.start??(command?.sheet?command.start:a.kind==='slam'||a.ultimate==='pillar'?(air?8:0):sheet==='uppercut'?(air?8:0):attackMoving&&['sweep','cleave','flower'].includes(sheet)?8:0);
    frame=sample(frames(sheet,runStart,beat?.count??8),reverse?1-u:u);
    if(command)frame=HERO_ATLASES[sheet]?.frames[runStart+commandFrameIndex(a.command,reverse?1-u:u)];
    if(!a.command&&a.kind!=='ultimate'&&a.kind!=='slam'&&(attackPhase<.06||attackPhase>.94))frame=HERO_ATLASES.movement?.frames[moving?8:0];
    clip=(air?'air:':attackMoving?'run:':'attack:')+sheet+(reverse?':reverse':'');
  }else if(air){
    const vy=p.vy||0,index=vy< -235?0:vy< -155?1:vy< -35?2:vy<65?3:4;
    frame=HERO_ATLASES.mobility?.frames[index];clip=vy< -35?'jumpRise':vy<65?'jumpApex':'jumpFall';
  }else if((m?.land||0)>0&&!cloud){
    frame=HERO_ATLASES.mobility?.frames[5];clip='land';
  }else if(moving||p.enteringExit){
    const travel=m?.run??(p.anim||0)/10*Math.abs(p.vx||90)/HERO_RUN_STRIDE;
    const backwards=(p.vx||0)*(p.staff?.face||p.face||1)<0;
    u=wrap(backwards?-travel:travel);frame=loop(frames('movement',8),u);clip=backwards?'retreat':'run';
  }else{
    u=wrap(clock/HERO_IDLE_PERIOD);frame=loop(frames('movement'),u);clip=cloud?'cloudIdle':'idle';
  }
  if(!frame)return null;
  const includesMount=!!frame.includesMount;
  const anchor=air&&clip!=='hurt'?frame.airAnchor:frame.anchor;
  const stretch=!includesMount&&['idle','cloudIdle','charge'].includes(clip)?1+Math.sin(clock*Math.PI*2/HERO_IDLE_PERIOD)*.006:1;
  return {frame,clip,u,air,mounted,includesMount,stretch,anchor:anchor||frame.anchor,behind:frame.behind||false};
}

// Keep the painted grip and direction, replace the complete short shaft with
// one continuous textured staff. Display and hit segments share these endpoints.
export function wholeHeroPose(p,time=p.staff?.t??0){
  const s=wholeHeroFrame(p,time);if(!s)return null;
  const f=s.frame,size=(p.giantT>0?2:1)*(p.magicScale||1),face=p.staff?.face||p.face||1;
  const rootY=s.includesMount?(p.mountGroundY??p.y):actorRootY(p);
  const point=q=>({x:p.x+face*(q[0]-s.anchor[0])*f.scale*size,y:rootY+(q[1]-s.anchor[1])*f.scale*size*s.stretch});
  const origin=point(f.origin),tip=point(f.tip),butt=point(f.butt);
  const angle=Math.atan2(tip.y-origin.y,(tip.x-origin.x)*face);
  const painted={origin,tip,butt,angle,face,reach:Math.hypot(tip.x-origin.x,tip.y-origin.y),rear:Math.hypot(butt.x-origin.x,butt.y-origin.y)};
  const phase=p.staff?clamp(time/p.staff.duration):0;
  const flower=['flower','blossom','cyclone'].includes(f.id.split(':')[0]);
  let share=Math.max(.42,Math.min(.8,painted.reach/(painted.reach+painted.rear)));
  // A forward swing slides the grip toward the rear of the same rigid shaft.
  // Flowers retain a central grip so both ends describe a broad rotating arc.
  if(p.staff&&!flower&&Math.cos(angle)>.45)share=Math.max(.72,share);
  const length=HERO_STAFF_LENGTH*size,extension=staffExtension(p,time);
  const reach=length*(share+extension.scale-1),rear=length*(1-share);
  const factor=reach/painted.reach;
  const extend=q=>({x:origin.x+(q.x-origin.x)*factor,y:origin.y+(q.y-origin.y)*factor});
  const tailFactor=rear/painted.rear;
  const effectReach=p.staff?.kind==='ultimate'?37+49*Math.sin(Math.PI*phase):reach;
  return {...s,origin,tip:extend(tip),butt:{x:origin.x+(butt.x-origin.x)*tailFactor,y:origin.y+(butt.y-origin.y)*tailFactor},angle,face,reach,rear,projection:1,phase,painted,effectReach,replacedStaff:true};
}
