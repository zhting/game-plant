// Human commands use the merged keyboard/pad/touch directions. Capture a short
// press now, so releasing or changing direction during recovery cannot change it.
export const STAFF_COMMAND_BUFFER=.42;
export const STAFF_MOTION_WINDOW=.32;
export const STAFF_COMMANDS=Object.freeze(Object.fromEntries([
  ['thrust','行进连环棍','← / → + J','thrust','sweep'],
  ['lift','挑棍撩天','↑ + J','uppercut','lift'],
  ['low','伏身扫堂','↓ + J','lowSweep','sweep'],
  ['wheel','绕顶花棍','↖ / ↗ + J','skyWheel','sweep',2],
  ['sweep','横扫千军','↙ / ↘ + J','sweepingFinish','smash',3],
  ['flower','莲花回环','↓，再 ← / → + J','lotusChain','smash',3],
  ['airThrust','腾空连环棍','空中 ← / → + J','airThrust','spin'],
  ['airLift','腾空挑棍','空中 ↑ + J','risingSpin','lift',2]
].map(([id,name,keys,variant,kind,combo])=>[id,Object.freeze({id,name,keys,variant,kind,combo})])));

export const STAFF_TRAVEL_COMMANDS=Object.freeze(Object.fromEntries([
  ['travelSweep','弓步平抡','cross','sweep',2],
  ['travelFlower','立舞花棍','doubleFlower','sweep',2],
  ['travelCleave','上步抡劈','overhead','smash',3],
  ['travelWushu','武韵连环 · 马步仆扫','wushuFlow','smash',3],
  ['travelCoil','回身盘龙','dragonCoil','smash',3],
  ['travelWheel','云棍绕顶','skyWheel','sweep',2],
  ['travelThrust','弓步点棍','thrust','sweep',1],
  ['travelAirWheel','腾空旋棍','airWheel','spin',2],
  ['travelAirCross','腾空交叉劈','airCross','spin',3],
  ['travelAirReverse','腾空回身撩','airReverse','spin',2],
].map(([id,name,variant,kind,combo])=>[id,Object.freeze({id,name,variant,kind,combo})])));
const travelGround=['travelSweep','travelFlower','travelCleave','travelWushu','travelCoil','travelWheel','travelThrust'];
const travelAir=['travelAirWheel','travelAirCross','travelAirReverse'];

// Holding forward is ordinary traversal. Cycle whole-body wushu rather than
// treating every tap during a run as a new explicit spear-thrust command.
export function travelStaffCommand(p,command,airborne){
  if(Math.abs(p.vx||0)<=2||!['thrust','airThrust'].includes(command.move?.id)){
    delete p.staffTravelChain;return command;
  }
  const previous=p.staffTravelChain,continuing=previous&&p.staffComboT>0&&previous.face===command.face;
  let count=continuing?previous.count:-1,airCount=continuing?(previous.airCount??-1):-1;
  if(airborne)airCount++;else count++;
  p.staffTravelChain={count,airCount,face:command.face};
  const list=airborne?travelAir:travelGround;
  return {...command,move:STAFF_TRAVEL_COMMANDS[list[(airborne?airCount:count)%list.length]]};
}

export function clearStaffCommands(p){if(p.staffIntent)p.wantFire=false;delete p.staffIntent;delete p.staffCommandMotion;delete p.staffTravelChain;}
const directions=input=>({h:(input.right?1:0)-(input.left?1:0),v:(input.down?1:0)-(input.up?1:0)});
export function advanceStaffCommands(p,input,dt){
  if(p.staffIntent){
    p.staffIntent.remaining-=dt;
    if(p.staffIntent.remaining<0){delete p.staffIntent;p.wantFire=false;}
  }
  if(p.dead||p.dive||p.hurt||p.enteringExit||p.exitEntered||p.staff?.kind==='ultimate'||p.staffCharge?.active){
    clearStaffCommands(p);p.wantFire=false;return;
  }
  const {h,v}=directions(input);
  let motion=p.staffCommandMotion;
  if(motion){motion.downT=Math.max(0,motion.downT-dt);motion.flowerT=Math.max(0,motion.flowerT-dt);}
  if(v<0){delete p.staffCommandMotion;motion=null;}
  const downEdge=!!input.downEdge||v>0&&!p.staffDownHeld;
  if(downEdge&&v>0&&!h&&p.onGround)motion=p.staffCommandMotion={downT:STAFF_MOTION_WINDOW,flowerT:0,face:p.face||1};
  else if(motion?.downT>0&&h&&v>=0){motion.downT=0;motion.flowerT=STAFF_MOTION_WINDOW;motion.face=h;}
  if(motion&&!motion.downT&&!motion.flowerT){delete p.staffCommandMotion;motion=null;}
  if(input.fireEdge){
    p.staffIntent={h,v,face:h||p.face||1,flower:!!motion?.flowerT&&h===motion.face,remaining:STAFF_COMMAND_BUFFER};
    // One directional motion buys one command, never a string of later flowers.
    if(p.staffIntent.flower)delete p.staffCommandMotion;
    p.wantFire=true;
  }
}

export function staffCommand(p,input,airborne){
  const intent=p.staffIntent||{...directions(input),face:p.face||1};
  const {h,v}=intent;
  const id=airborne?(v<0?'airLift':h&&v===0?'airThrust':null)
    :intent.flower?'flower':h&&v<0?'wheel':h&&v>0?'sweep':v<0?'lift':v>0?'low':h?'thrust':null;
  return {move:id?STAFF_COMMANDS[id]:null,face:intent.face,up:v<0,down:v>0};
}
