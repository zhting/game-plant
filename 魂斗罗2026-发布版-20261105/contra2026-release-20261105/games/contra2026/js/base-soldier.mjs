// Stage-two soldiers share the commandos' 38-unit physical height. Depth still
// reduces their size, but does not halve a second, already smaller reference body.
export const BASE_SOLDIER=Object.freeze({height:38,halfWidth:10,muzzleHeight:26.6});
export const baseSoldierScale=z=>1-.3*Math.max(0,Math.min(1,z));
export const baseSoldierJumpOffset=s=>Math.max(0,s.jumpY||0)*baseSoldierScale(s.z);
export function baseSoldierMuzzle(s,x,y){
  const scale=baseSoldierScale(s.z);
  return {x,y:y-baseSoldierJumpOffset(s)-BASE_SOLDIER.muzzleHeight*scale};
}

// Enemy patrols stay just in front of the far wall rather than charging into
// the foreground. Plain fields are preserved by the co-op world snapshot.
export const BASE_PATROL_DEPTH=.92, BASE_PATROL_LIMIT=148, BASE_PATROL_MAX=4;
export function advanceBasePatrol(s,dt){
  s.z=BASE_PATROL_DEPTH;s.st='walk';
  const dir=s.patrolDir===1||s.patrolDir===-1?s.patrolDir:(s.u<0?1:-1);
  const speed=s.patrolSpeed||80,next=s.u+dir*speed*dt;
  if(next>=BASE_PATROL_LIMIT){s.u=BASE_PATROL_LIMIT;s.patrolDir=-1;}
  else if(next<=-BASE_PATROL_LIMIT){s.u=-BASE_PATROL_LIMIT;s.patrolDir=1;}
  else{s.u=next;s.patrolDir=dir;}
  s.face=s.patrolDir;
}

// Red supply carriers can anticipate a shot reaching their projected lane.
// Compare the bullet and moving soldier at the same depth, including a turn
// at the patrol boundary; shots outside the body height do not trigger a jump.
export function baseSoldierShouldDodge(s,bullets){
  if(!s.dropKind||!s.patrolArmed||s.st!=='walk'||(s.jumpY||0)>0||(s.jumpV||0)>0)return false;
  const z=s.z,scale=baseSoldierScale(z),dir=s.patrolDir||s.face||1,speed=s.patrolSpeed||80;
  return bullets.some(b=>{
    if(b.dead||!(b.spd>0)||!Number.isFinite(b.t)||!Number.isFinite(b.x0)||!Number.isFinite(b.xe)||!Number.isFinite(b.y0)||!Number.isFinite(b.ye))return false;
    const eta=(z-b.t)/b.spd;if(eta<.16||eta>.56)return false;
    let u=s.u+dir*speed*eta;
    if(u>BASE_PATROL_LIMIT)u=2*BASE_PATROL_LIMIT-u;
    else if(u< -BASE_PATROL_LIMIT)u=-2*BASE_PATROL_LIMIT-u;
    const enemyX=192+u*(1-.5*z),bulletX=b.x0+(b.xe-b.x0)*z;
    const enemyY=204-64*z,bulletY=b.y0+(b.ye-b.y0)*z;
    return Math.abs(bulletX-enemyX)<BASE_SOLDIER.halfWidth*scale+5&&
      bulletY>=enemyY-BASE_SOLDIER.height*scale-2&&bulletY<=enemyY+2;
  });
}

// Only red supply carriers jump; their animation and collision share jumpY.
export function advanceBaseSoldierJump(s,dt,random=Math.random,bullets=[]){
  s.shotFlash=Math.max(0,(s.shotFlash||0)-dt);
  if(!s.dropKind){s.jumpY=0;s.jumpV=0;return;}
  s.dodgeT=Math.max(0,(s.dodgeT||0)-dt);
  if((s.jumpY||0)>0||s.jumpV>0){
    s.jumpY=Math.max(0,(s.jumpY||0)+s.jumpV*dt);s.jumpV-=300*dt;
    if(s.jumpY===0&&s.jumpV<0){s.jumpV=0;s.jumpT=1.15+random()*.8;s.dodgeT=.35;}
  }else if(s.st==='walk'||s.st==='leave'){
    s.jumpT=(s.jumpT??.6)-dt;
    if(s.jumpT<=0||(!s.dodgeT&&baseSoldierShouldDodge(s,bullets))){s.jumpY=.01;s.jumpV=180;}
  }
}
