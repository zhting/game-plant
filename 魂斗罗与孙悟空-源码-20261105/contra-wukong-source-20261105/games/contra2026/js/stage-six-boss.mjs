// World-space motion and hit boxes for the stage-six humanoid boss.
// Plain data keeps the animation and collision positions in the co-op snapshot.
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));

export function stageSixBossBody(boss){
  return {x:boss.x-18,y:boss.y-75,w:36,h:75};
}
// Bullets can hit the full body, but a player's contact with the legs or feet
// is safe. The upper-body contact box still follows the boss while jumping.
export function stageSixBossContactBox(boss){
  return {x:boss.x-18,y:boss.y-75,w:36,h:43};
}

// Independent painted frames use one uniform pixel scale: the armor is never
// stretched to fake crouching or takeoff. Crop coordinates are alpha bounds.
const FRAME_SCALE=.16;
const JUMP_FRAMES=Object.freeze({
  crouch:[147,82,494,472],launch:[733,11,587,561],
  tuck:[15,591,740,486],land:[761,642,603,478]
});
export function stageSixBossSpritePose(boss){
  let frame=null;
  if(boss.phase==='windup')frame='crouch';
  else if(boss.phase==='land')frame='land';
  else if(boss.phase==='jump'){
    if(boss.vy < -180)frame='launch';
    else if(boss.vy < -30)frame='tuck';
    else if(boss.vy > 0 && boss.y>=boss.ground-32)frame='land';
  }
  if(frame){
    const source=JUMP_FRAMES[frame];
    return {key:'robotJumpFrames',frame,source,width:source[2]*FRAME_SCALE,height:source[3]*FRAME_SCALE,rotation:0,offsetY:0};
  }
  const airborne=boss.phase==='jump',height=82,width=airborne?102:96;
  if(airborne)return {key:'robotJump',frame:'air',width,height,rotation:0,offsetY:height*(1-480/498)};
  // Align the two standing soles to the floor by rotation, without scaling.
  const leftX=width*(84/600-.5),rightX=width*(526/600-.5);
  const leftY=height*(478/506-1),rightY=height*(493/506-1);
  const rotation=-Math.atan2(rightY-leftY,rightX-leftX);
  const offsetY=-(leftX*Math.sin(rotation)+leftY*Math.cos(rotation));
  return {key:'robotStand',frame:'idle',width,height,rotation,offsetY};
}

/** Feet become dangerous only while descending into a stomp or landing. */
export function stageSixBossStompBoxes(boss){
  if(!boss.active||boss.dead)return [];
  const landing=boss.phase==='jump'&&boss.vy>0&&boss.y>=boss.ground-32;
  if(!landing&&!(boss.phase==='land'&&boss.stompT>0))return [];
  return [-30,30].map(dx=>({x:boss.x+dx-13,y:boss.y-12,w:26,h:16}));
}
export function syncStageSixBossPart(boss){
  Object.assign(boss.parts[2],stageSixBossBody(boss));
}
export function createStageSixBoss(x){
  const boss={x,y:176,ground:176,vx:0,vy:0,face:-1,active:false,dead:false,deadT:0,
    phase2:false,phase:'idle',phaseT:1.1,shotT:1.7,stompT:0,parts:[
      {golem:1,k:'unused',x:0,y:0,w:0,h:0,hp:0,max:0,flash:0},
      {golem:1,k:'unused',x:0,y:0,w:0,h:0,hp:0,max:0,flash:0},
      {golem:1,k:'core',x:0,y:0,w:0,h:0,hp:80,max:80,flash:0}
    ]};
  syncStageSixBossPart(boss);return boss;
}

// The crouch warns of the coming leap; the target is locked at takeoff so a
// moving player can dodge it. Landing and firing are reported to the engine.
export function advanceStageSixBoss(boss,target,dt,left,right){
  const events={jump:false,land:false,shot:false};
  if(!boss.active||boss.dead)return events;
  boss.stompT=Math.max(0,(boss.stompT||0)-dt);
  if(target&&boss.phase!=='jump')boss.face=target.x<boss.x?-1:1;
  boss.shotT-=dt;
  if(target&&boss.shotT<=0&&boss.phase==='idle'){
    events.shot=true;boss.shotT=boss.phase2?1.5:2.1;
  }
  if(boss.phase==='jump'){
    boss.x=clamp(boss.x+boss.vx*dt,left,right);
    boss.vy+=500*dt;boss.y+=boss.vy*dt;
    if(boss.y>=boss.ground){boss.y=boss.ground;boss.vy=0;boss.vx=0;boss.phase='land';boss.phaseT=.52;boss.stompT=.16;events.land=true;}
  }else{
    boss.phaseT-=dt;
    if(boss.phaseT<=0){
      if(boss.phase==='idle'&&target){boss.phase='windup';boss.phaseT=.65;}
      else if(boss.phase==='windup'){
        boss.phase='jump';boss.vy=-235;
        boss.vx=target?clamp((target.x-boss.x)*1.05,-100,100):0;
        events.jump=true;
      }else if(boss.phase==='land'){boss.phase='idle';boss.phaseT=boss.phase2?.5:.9;}
    }
  }
  syncStageSixBossPart(boss);return events;
}
