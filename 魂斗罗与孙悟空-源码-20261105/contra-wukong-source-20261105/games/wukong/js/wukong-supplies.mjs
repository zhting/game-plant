import { HEALING_ITEMS } from './wukong-vitality.mjs';

export const FAIRY_SUPPLY_TIMING=Object.freeze({firstMin:.75,firstMax:2,gapMin:2,gapMax:4.5});

// All peach types share one host-owned schedule. A trigger stays pending until its
// fairy actually enters, so crossing several map thresholds cannot lose supplies.
export function scheduleSupplyFairy(world,dt,random){
  if(world.pods.some(pd=>pd.fairy&&!pd.dead))return null;
  let next=null;
  for(const trigger of world.podTrig){
    if(!trigger.done&&world.camX>=trigger.at&&(!next||trigger.at<next.at))next=trigger;
  }
  if(!next)return null;
  const timing=FAIRY_SUPPLY_TIMING;
  const schedule=world.wukongSupplies??={wait:timing.firstMin+random()*(timing.firstMax-timing.firstMin),spawned:0};
  schedule.wait=Math.max(0,schedule.wait-dt);
  if(schedule.wait>0)return null;
  next.done=true;schedule.spawned++;
  schedule.wait=timing.gapMin+random()*(timing.gapMax-timing.gapMin);
  // Healing carriers enter ahead of the running hero, so the new recovery
  // supplies are visible and reachable while continuing through the stage.
  return {x:world.camX+(HEALING_ITEMS[next.kind]?280:-12),y0:next.y0,y:next.y0,t:0,kind:next.kind,fairy:true};
}

// A supply fairy remains a networked carrier while fleeing, and releases her peach once.
export function advanceSupplyFairy(pd,dt,camera,width=384){
  pd.t+=dt;
  if(pd.flee){
    pd.fleeT=(pd.fleeT||0)+dt;pd.x+=(90+Math.min(190,pd.fleeT*400))*dt;
    pd.y-=(35+pd.fleeT*65)*dt;
    if(pd.fleeT>2||pd.x>camera+width+65||pd.y< -45)pd.dead=true;
  }else{
    pd.x+=62*dt;pd.y=pd.y0+Math.sin(pd.t*2.4)*9;
    if(pd.x>camera+width+65||pd.x<camera-65)pd.dead=true;
  }
}
export function releaseFairyPeach(pd){
  if(pd.dead||pd.flee)return null;
  pd.flee=true;pd.fleeT=0;
  return {x:pd.x,y:pd.y,vx:16,vy:-38,kind:pd.kind,fromPod:true,peach:true,landed:false};
}
