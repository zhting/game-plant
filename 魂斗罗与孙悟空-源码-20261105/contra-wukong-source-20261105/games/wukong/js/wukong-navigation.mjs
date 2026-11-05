// Local platform sensing for heavenly guards. Terrain and player physics are unchanged.
const STEP=1/60,FOOT=5,MARGIN=7;
function bridgeSafe(s,arrival=0){
  const b=s.bridge;
  return !b?.armed||s.seg>=b.next&&b.t+(s.seg-b.next)*.4>arrival+.3;
}
function supportAt(solids,x,y,drop=0){
  return solids.find(s=>!s.gone&&!s.water&&Math.abs(Math.max(0,s.y-y))<=drop+.01&&
    s.y>=y-.5&&x>=s.x&&x<=s.x+s.w&&bridgeSafe(s,.12));
}

// Match the real fixed-step gravity, side-wall blocking and first landing surface.
function safeJump(e,solids,vx,vy,gravity,maxFall){
  let x=e.x,y=e.y;
  for(let n=1;n<=90;n++){
    const x0=x;vy=Math.min(vy+gravity*STEP,maxFall);x+=vx*STEP;
    for(const s of solids){
      if(s.gone||!s.g||y<=s.y+.5)continue;
      if(x+FOOT>s.x&&x-FOOT<s.x+s.w&&
        (x0+FOOT<=s.x+.5||x0-FOOT>=s.x+s.w-.5))return false;
      // Never pass a solid ceiling with the guard's head during a planned jump.
      if(s.h&&y-26<s.y+s.h&&y>s.y&&x+FOOT>s.x&&x-FOOT<s.x+s.w)return false;
    }
    const from=y;y+=vy*STEP;
    if(vy>=0){
      let landing=null;
      for(const s of solids)if(!s.gone&&x+4>s.x&&x-4<s.x+s.w&&from<=s.y+.001&&y>=s.y&&(!landing||s.y<landing.y))landing=s;
      if(landing)return !landing.water&&landing.w>=MARGIN*2+4&&x>=landing.x+MARGIN&&x<=landing.x+landing.w-MARGIN&&
        landing.y<=e.y+40&&bridgeSafe(landing,n*STEP)&&Math.sign(x-e.x)===Math.sign(vx)&&Math.abs(x-e.x)>18;
    }
    if(y>e.y+65)return false;
  }
  return false;
}

export function navigateGuard(e,target,solids,dt,{holding=false,gravity=700,maxFall=360,patrol=false}={}){
  if(e.guardPatrol){
    e.guardPatrol.remaining=Math.max(0,e.guardPatrol.remaining-dt);
    e.vx=e.guardPatrol.direction*62;e.face=e.guardPatrol.direction;e.ax=e.face;
    if(!e.guardPatrol.remaining)e.guardPatrol=null;
  }
  if(e.guardJump){
    if(!e.on){e.vx=e.guardJump.vx;return false;} // Keep the predicted horizontal speed through the whole flight.
    e.vx=Math.sign(e.vx||e.guardJump.vx)*62;e.guardJump=null;
  }
  if(holding||e.dead||e.vy<-.01)return false;
  if(!e.on&&!supportAt(solids,e.x,e.y))return false;
  const direction=Math.sign(e.vx)||e.face||-1;
  const lookahead=FOOT+3+Math.abs(e.vx)*dt;
  const ahead=e.x+direction*lookahead;
  // Connected floors and modest steps down are safe to walk across.
  if(supportAt(solids,ahead,e.y,36))return false;
  // Patrols can cross a safe gap on their own, even when no player is visible.
  if(patrol||target&&Math.sign(target.x-e.x)===direction){
    for(const [speed,lift]of [[112,-235],[124,-280]]){
      const vx=direction*speed;
      if(safeJump(e,solids,vx,lift,gravity,maxFall)){
        e.guardJump={vx};e.vx=vx;e.vy=lift;e.on=false;e.melee=null;return false;
      }
    }
    if(!patrol)return true; // Summoned helpers continue to wait for their owner.
  }
  e.vx=-direction*Math.min(62,Math.abs(e.vx)||62);e.face=Math.sign(e.vx);e.ax=e.face;
  if(patrol)e.guardPatrol={direction:e.face,remaining:.95};
  return true;
}
