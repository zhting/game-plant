const clamp = n => Math.max(0,Math.min(1,n));
export function beginDeath(p){
  Object.assign(p,{dead:true,deadT:1.4,deathAge:0,deathGrounded:false,deathLandT:0,deathHidden:false,deathSupport:null,
    vy:-170,vx:-(p.face||1)*50,onGround:false,support:null,spin:false,prone:false,dive:false,inWater:false,hook:null,flashT:0});
}

/** Death remains part of the host simulation, so landing and fading survive snapshots. */
export function advanceDeath(p,dt,{gravity=700,maxFall=360,land,clampX=x=>x,bottom=252}={}){
  p.deadT-=dt;p.deathAge=(p.deathAge||0)+dt;
  if(p.deathGrounded&&!p.deathHidden&&p.deathSupport?.gone){p.deathGrounded=false;p.deathLandT=0;}
  if(p.deathGrounded){
    p.deathLandT=(p.deathLandT||0)+dt;p.vx=p.vy=0;
    if(p.deathSupport)p.y=p.deathSupport.y;
    if(p.deathLandT>=.68)p.deathHidden=true;
  }else if(!p.deathHidden){
    const previousY=p.y;
    p.vy=Math.min(p.vy+gravity*dt,maxFall);p.x=clampX(p.x+p.vx*dt);p.y+=p.vy*dt;
    const surface=p.vy>=0&&land?.(p.x,previousY,p.y);
    if(surface){p.y=surface.y;p.vx=p.vy=0;p.deathGrounded=true;p.deathLandT=0;p.deathSupport=surface;}
    else if(p.y>bottom)p.deathHidden=true;
  }
  return p.deadT<=0&&(p.deathHidden||(p.deathGrounded&&p.deathLandT>=.8));
}

export function deathVisual(p){
  if(p.deathHidden)return {visible:false,alpha:0,grounded:!!p.deathGrounded,angle:0};
  const age=Math.max(p.deathAge||0,1.4-(p.deadT??1.4));
  const grounded=!!p.deathGrounded,t=p.deathLandT||0;
  const alpha=grounded?1-clamp((t-.3)/.35):!(p.deathAge>0)?clamp((p.deadT??1.4)/.3):1;
  return {visible:alpha>0,alpha,grounded,angle:-.35-clamp(age/.4)*1.05};
}
