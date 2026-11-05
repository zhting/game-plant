import {alienGuardianMouth} from './stage-eight-guardian.mjs?v=guardian-flyers-1';

export const GUARDIAN_FLYER_ASSET='/games/contra2026/assets/stage7/alien-guardian-flyer-v1.webp';
export const GUARDIAN_FLYER=Object.freeze({hp:2,speed:84,limit:6,interval:2.8,spacing:.22,life:6.5,scale:.0355});
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function createGuardianFlyer(guardian,ordinal=0,sequence=0){
  const {x,y}=alienGuardianMouth(guardian),angle=-Math.PI+.15+ordinal*.28;
  return {t:'guardianFlyer',from:'alienHead',x,y,baseY:y,vx:Math.cos(angle)*GUARDIAN_FLYER.speed,vy:Math.sin(angle)*GUARDIAN_FLYER.speed,
    age:0,phase:sequence*.93%TAU,hp:GUARDIAN_FLYER.hp,max:GUARDIAN_FLYER.hp,flash:0};
}

/** A short two-creature burst starts at the visible mouth, with bounded brood size. */
export function advanceGuardianSpit(e,dt,enemies,{active=false}={}){
  if(!active||e.dead)return [];
  e.shotFlash=Math.max(0,(e.shotFlash||0)-dt);
  if(!(e.spitLeft>0)){
    e.fireT=(e.fireT??1.2)-dt;
    if(e.fireT>0)return [];
    e.fireT=GUARDIAN_FLYER.interval;e.spitLeft=2;e.spitT=0;
  }
  e.spitT-=dt;if(e.spitT>0)return [];
  if(enemies.filter(q=>q.t==='guardianFlyer'&&!q.dead).length>=GUARDIAN_FLYER.limit){e.spitLeft=0;return [];}
  const child=createGuardianFlyer(e,2-e.spitLeft,e.broodSequence||0);
  e.broodSequence=(e.broodSequence||0)+1;e.spitLeft--;e.spitT=GUARDIAN_FLYER.spacing;e.shotFlash=.16;
  return [child];
}

export function guardianFlyerBox(e){return {x:e.x-8,y:e.y-7,w:16,h:14};}

/** Emerge above the wall, then steer gently once; a missed pass flies away. */
export function advanceGuardianFlyer(e,target,dt,camera=0){
  if(e.dead)return;
  e.age+=dt;
  if(target&&e.age>.4&&e.age<1.7){
    const heading=Math.atan2(e.vy,e.vx),desired=Math.atan2(target.y-16-e.y,target.x-e.x);
    const delta=((desired-heading+Math.PI)%TAU+TAU)%TAU-Math.PI,angle=heading+clamp(delta,-1.1*dt,1.1*dt);
    e.vx=Math.cos(angle)*GUARDIAN_FLYER.speed;e.vy=Math.sin(angle)*GUARDIAN_FLYER.speed;
  }
  e.x+=e.vx*dt;e.baseY+=e.vy*dt;
  if(e.baseY<37){e.baseY=37;e.vy=Math.abs(e.vy);}
  if(e.baseY>162){e.baseY=162;e.vy=-Math.abs(e.vy);}
  e.y=e.baseY+Math.sin(e.age*7+e.phase)*2.8*Math.min(1,e.age/.3);
  if(e.age>GUARDIAN_FLYER.life||e.x<camera-32||e.x>camera+432)e.dead=true;
}

export function guardianFlyerFrame(e){return Math.floor((e.age||0)*9+(e.phase||0))%4;}

export function drawGuardianFlyer(art,e){
  if(!art.loaded.has('guardianFlyer'))return false;
  const image=art.images.guardianFlyer,g=art.g,frame=guardianFlyerFrame(e),cell=image.naturalWidth/2,s=GUARDIAN_FLYER.scale;
  const pitch=clamp(Math.atan2(-e.vy,Math.abs(e.vx)),-.4,.4);
  g.save();g.translate(e.x,e.y);g.scale(e.vx>0?-1:1,1);g.rotate(pitch);
  if(e.flash>0)g.filter='brightness(1.8)';
  g.drawImage(image,frame%2*cell,Math.floor(frame/2)*cell,cell,cell,-cell*s/2,-cell*s/2,cell*s,cell*s);
  g.restore();return true;
}
