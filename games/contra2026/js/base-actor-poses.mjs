import { BASE_ACTORS } from './stage-two-atlas.mjs?v=webp-1';

// New rear-view upward poses retain a 38-unit head-to-sole height.
const scale=38/730;
export const BASE_UPWARD=Object.freeze({
  blue:Object.freeze({key:'rearUp',bounds:[257,13,484,987],anchor:[500,1000],waist:585,scale,muzzle:[532,16]}),
  red:Object.freeze({key:'rearUp',bounds:[868,13,483,987],anchor:[1111,1000],waist:585,scale,muzzle:[1145,16]})
});

export function baseActorPose(p,enemy=false,transition=false){
  if(p.dead)return 'dead';if(p.spin)return 'roll';if(p.prone)return 'prone';
  if(!transition&&(!p.onGround||Math.abs(p.vx||0)<.5))return p.aimUp&&!enemy?'up':'idle';
  const speed=transition?60:Math.abs(p.vx||0),stride=enemy?36:42;
  return 'run'+Math.floor((((p.anim||0)/10*speed/stride)%1+1)%1*8);
}

export function baseUpMuzzle(player,role='blue'){
  const upper=BASE_UPWARD[role]||BASE_UPWARD.blue,pose=baseActorPose(player);
  const sheet=BASE_ACTORS[role]||BASE_ACTORS.blue,lower=sheet.frames[pose];
  const bob=pose.startsWith('run')?(lower.waist-lower.anchor[1])*sheet.scale-(upper.waist-upper.anchor[1])*upper.scale:0;
  const size=player.giantT>0?2:1;
  return {x:player.x+(upper.muzzle[0]-upper.anchor[0])*upper.scale*size,
    y:player.y+((upper.muzzle[1]-upper.anchor[1])*upper.scale+bob)*size};
}

// Shared visual timeline for passing a checkpoint and entering the next room.
export const BASE_GATE_ROLL_START=.7, BASE_EXIT_ROLL_DURATION=.9;
export function baseGateTransitionActor(player,progress,index=0,online=false){
  const t=Math.max(0,Math.min(1,progress)),near=online?(index?8:-8):0;
  if(t<BASE_GATE_ROLL_START){
    const a=t/BASE_GATE_ROLL_START;
    return {phase:'run',scale:1-a*.3,player:{...player,x:player.x+(192+near-player.x)*a*.8,
      y:player.y-a*39,vx:60,onGround:true,spin:false,prone:false,aimUp:false,gateTransition:true}};
  }
  const r=(t-BASE_GATE_ROLL_START)/(1-BASE_GATE_ROLL_START);
  return {phase:'roll',scale:.7,player:{...player,x:192+near,y:165-Math.sin(r*Math.PI)*24+r*14,
    vx:0,onGround:false,spin:true,prone:false,aimUp:false,anim:r*7}};
}
export function baseExitRollActor(player,time,index=0,online=false){
  const t=Math.max(0,Math.min(1,time/BASE_EXIT_ROLL_DURATION)),near=online?(index?12:-12):0;
  return {phase:'roll',scale:.8,player:{...player,x:192+near,y:78+t*75-Math.sin(t*Math.PI)*12,
    vx:0,onGround:false,spin:true,prone:false,aimUp:false,deathHidden:false,anim:t*9}};
}
