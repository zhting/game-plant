export const STAGE_FIVE_ROUTE=Object.freeze({length:5000,tankHome:3236,tankCamera:3016,arena:4616,steelStart:4480});
export const FIELD_CANNONS=Object.freeze([[282,128],[1230,124],[1924,124],[2408,120],[2848,124],[3560,124],[4100,120]].map(([x,y])=>Object.freeze({x,y})));
export const FOREST_GRENADIERS=Object.freeze([190,680,1550,2450,2960,3640,4260]);

export function createSnowDefenders(){
  return [
    ...FIELD_CANNONS.map(({x,y},i)=>({t:'artillery',x,y,hp:8,face:-1,phase:'reload',phaseT:2.2+i*.23,recoil:0,flash:0})),
    ...FOREST_GRENADIERS.map((x,i)=>({t:'grenadier',x,y:176,hp:2,face:-1,phase:'cover',phaseT:2.8+i*.21,peek:0,flash:0}))
  ];
}
export function snowDefenderBox(enemy){
  if(enemy.t==='artillery')return {x:enemy.x-30,y:enemy.y-34,w:70,h:34};
  if(enemy.t==='grenadier'){
    const peek=enemy.peek||0,x=enemy.x+(enemy.face||-1)*(5+13*peek),h=20+8*peek;
    return{x:x-6,y:enemy.y-6-h,w:12,h};
  }
  return null;
}
export function advanceSnowDefender(enemy,target,dt,{active=true}={}){
  if(enemy.dead||!active||!target||target.dead||target.camoT>0)return null;
  enemy.recoil=Math.max(0,(enemy.recoil||0)-dt);
  if(enemy.t==='grenadier'){
    const show=enemy.phase==='windup'||enemy.phase==='release';
    enemy.peek=Math.max(0,Math.min(1,(enemy.peek||0)+(show?1:-1)*dt*4));
  }
  enemy.phaseT-=dt;if(enemy.phaseT>0)return null;
  if(enemy.phase==='reload'||enemy.phase==='cover'){
    enemy.face=target.x<enemy.x?-1:1;enemy.aimX=target.x;enemy.aimY=target.y;
    enemy.phase='windup';enemy.phaseT=enemy.t==='artillery'?.55:.65;return null;
  }
  if(enemy.phase==='windup'){
    enemy.phase='release';enemy.phaseT=enemy.t==='artillery'?.22:.3;enemy.recoil=.25;
    const grenade=enemy.t==='grenadier';
    const x=enemy.x+enemy.face*(grenade?18:35),y=enemy.y-(grenade?35:30);
    const flight=grenade?1.2:1.35,gravity=grenade?250:210,targetX=Math.max(x-240,Math.min(x+240,enemy.aimX));
    return{x,y,vx:(targetX-x)/flight,vy:((enemy.aimY-(grenade?2:14))-y-.5*gravity*flight*flight)/flight,
      g:gravity,r:grenade?2.6:4,snowOrdnance:grenade?'grenade':'shell',fuse:grenade?1.85:4,age:0,bounces:0,rotation:0};
  }
  enemy.phase=enemy.t==='artillery'?'reload':'cover';enemy.phaseT=enemy.t==='artillery'?2.4:2.8;return null;
}

/** A real lobbed grenade bounces and burns its fuse. Shells burst on contact. */
export function advanceSnowOrdnance(b,dt,findLand){
  if(b.dead)return false;
  b.age=(b.age||0)+dt;
  if(b.snowOrdnance==='blast'){
    b.fuse-=dt;if(b.fuse<=0)b.dead=true;return false;
  }
  b.fuse-=dt;b.rotation=(b.rotation||0)+dt*8;
  const oldY=b.y;
  b.vy+=b.g*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(b.vy>0){
    const floor=findLand(b.x,oldY+b.r,b.y+b.r,b.r,false);
    if(floor){
      b.y=floor.y-b.r;
      if(b.snowOrdnance==='shell')b.fuse=0;
      else if(!b.bounces){b.bounces=1;b.vy=-Math.min(54,b.vy*.28);b.vx*=.3;}
      else{b.vy=0;b.vx*=.7;}
    }
  }
  if(b.fuse>0)return false;
  b.snowOrdnance='blast';b.fuse=.2;b.age=0;b.vx=b.vy=b.g=0;b.r=18;
  return true;
}

export function createFlyingFortress(){
  const home=STAGE_FIVE_ROUTE.arena+220;
  return {home,x:home,y:-48,active:false,dead:false,deadT:0,time:0,entryT:2,phase:'entry',phaseT:1.4,cycle:0,warning:0,escortT:2.55,escortWarning:false,
    parts:[{fortress:1,k:'left',ox:-61,oy:2,w:15,h:15,hp:16,max:16,flash:0},
      {fortress:1,k:'right',ox:46,oy:2,w:15,h:15,hp:16,max:16,flash:0},
      {fortress:1,k:'core',ox:-11,oy:4,w:22,h:24,hp:90,max:90,flash:0}]};
}
export function placeFlyingFortress(fortress){
  for(const part of fortress.parts){part.x=fortress.x+part.ox;part.y=fortress.y+part.oy;}
}
export function fortressEscortPort(F,side){
  return {x:F.x+side*61,y:F.y+8};
}

export function advanceFortressEscorts(F,target,dt,enemies,{frozen=false}={}){
  if(!F.active||F.dead||F.entryT>0||frozen)return [];
  const available=target&&enemies.filter(e=>e.t==='fortressSaucer'&&!e.dead).length<=2;
  F.escortT=Math.max(0,(F.escortT??2.55)-dt);
  F.escortWarning=!!available&&F.escortT<=.45;
  if(!available||F.escortT>0)return [];
  F.escortWarning=false;
  F.escortT=F.parts[2].hp<=F.parts[2].max/2?4.3:5.2;
  return [-1,1].map(side=>({
    t:'fortressSaucer',...fortressEscortPort(F,side),side,age:0,vx:side*62,vy:16,turning:false,hp:1,flash:0
  }));
}

export function advanceFortressSaucer(e,target,dt,camera){
  if(e.dead)return;
  e.age+=dt;
  if(e.age>=.58&&!e.turning){
    e.turning=true;
    e.attackDir=Math.sign((target?.x??e.x)-e.x)||-e.side;
  }
  if(e.turning){
    e.vx+=(e.attackDir*96-e.vx)*Math.min(1,dt*5);
    e.vy=Math.min(112,Math.max(0,(165-e.y)*4));
  }
  e.x+=e.vx*dt;e.y+=e.vy*dt;
  if(e.age>4.5||(e.age>1.2&&(e.x<camera-32||e.x>camera+416)))e.dead=true;
}

export function fortressSaucerBox(e){
  return {x:e.x-10,y:e.y-4,w:20,h:8};
}

/** A visible lock-on precedes each aimed volley. */
export function advanceFlyingFortress(fortress,target,dt,{frozen=false}={}){
  const F=fortress,shots=[];
  for(const part of F.parts)part.flash=Math.max(0,part.flash-dt);
  if(!F.active||F.dead||frozen)return shots;
  F.time+=dt;
  if(F.entryT>0){
    F.entryT=Math.max(0,F.entryT-dt);F.y=-48+116*(1-Math.pow(F.entryT/2,2));
    if(F.entryT===0){F.phase='hover';F.phaseT=1.3;}
    placeFlyingFortress(F);return shots;
  }
  const hot=F.parts[2].hp<=F.parts[2].max*.5;
  F.x=F.home+Math.sin(F.time*.7)*65;F.y=68+Math.sin(F.time*1.35)*10;
  placeFlyingFortress(F);
  if(!target||target.dead||target.camoT>0){F.warning=0;return shots;}
  F.phaseT-=dt;F.warning=F.phase==='aim'?1:0;
  if(F.phaseT>0)return shots;
  if(F.phase==='hover'){
    F.phase='aim';F.phaseT=hot?.55:.8;F.aimX=target.x;F.aimY=target.y-14;F.warning=1;return shots;
  }
  F.warning=0;F.phase='hover';F.phaseT=hot?1.3:1.85;F.cycle++;
  const core=F.parts[2],sx=F.x,sy=F.y+27;
  const angle=Math.atan2(F.aimY-sy,F.aimX-sx),speed=hot?125:105;
  for(const spread of hot?[-.24,-.12,0,.12,.24]:[-.18,0,.18])shots.push({x:sx,y:sy,vx:Math.cos(angle+spread)*speed,vy:Math.sin(angle+spread)*speed,g:0,r:3.4,fortressShot:true});
  for(const part of F.parts.slice(0,2))if(part.hp>0){
    const a=Math.atan2(F.aimY-(part.y+10),F.aimX-(part.x+7));
    shots.push({x:part.x+7,y:part.y+10,vx:Math.cos(a)*90,vy:Math.sin(a)*90,g:0,r:2.8,fortressShot:true});
  }
  if(F.cycle%3===0&&core.hp>0)for(const dx of [-34,34])shots.push({x:F.x+dx,y:sy,vx:dx*.35,vy:16,g:100,r:3,snowOrdnance:'grenade',fuse:2.3,age:0,bounces:0,rotation:0});
  return shots;
}
