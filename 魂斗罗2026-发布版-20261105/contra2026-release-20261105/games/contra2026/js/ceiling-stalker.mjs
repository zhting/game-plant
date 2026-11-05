import {drawHiveSlab} from './stage-eight-atmosphere.mjs?v=fused-tissue-3';

export const CEILING_STALKER_ASSET='/games/contra2026/assets/stage7/alien-ceiling-stalker-v1.webp';
export const CEILING_STALKER=Object.freeze({hp:2,speed:76,groundSpeed:62,gravity:480,maxFall:245,foot:8.5,warning:.4,stride:20,scale:.055});
export const STALKER_ROOFS=Object.freeze([
  {x:180,w:410,y:32},{x:680,w:300,y:32},{x:1220,w:380,y:48},
  {x:1650,w:340,y:32},{x:2020,w:360,y:32},{x:2580,w:440,y:48}
].map(Object.freeze));
export const CEILING_STALKER_ART=Object.freeze([
  [0,0,443,444],[443,0,444,444],[887,0,443,444],[1330,0,444,444],
  [0,444,443,443],[443,444,444,443],[887,444,443,443],[1330,444,444,443]
].map(a=>Object.freeze(a)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function createCeilingStalkers(){
  return STALKER_ROOFS.map((roof,idx)=>({t:'ceilingStalker',id:'stalker-'+idx,x:roof.x+roof.w-28,y:roof.y+CEILING_STALKER.foot,
    minX:roof.x+18,maxX:roof.x+roof.w-18,roofY:roof.y,face:-1,vx:-CEILING_STALKER.speed,vy:0,
    hp:CEILING_STALKER.hp,max:CEILING_STALKER.hp,phase:'cling',phaseT:0,readyT:.6,walkDistance:idx*4,airT:0,flash:0}));
}
export function ceilingStalkerBox(e){return {x:e.x-8,y:e.y-8,w:16,h:16};}

/** Travel visibly along the roof before committing to a telegraphed ballistic dive. */
export function advanceCeilingStalker(e,target,dt,{active=false,camera=0,land=()=>null,wall=()=>{}}={}){
  if(e.dead)return;
  if(e.x<camera-45||e.y>245){e.dead=true;return;}
  if((e.phase==='cling'||e.phase==='windup')&&!active)return;
  const C=CEILING_STALKER;
  if(e.phase==='cling'){
    const old=e.x;e.vx=e.face*C.speed;e.x=clamp(e.x+e.vx*dt,e.minX,e.maxX);e.walkDistance+=Math.abs(e.x-old);
    if(e.x<=e.minX)e.face=1;if(e.x>=e.maxX)e.face=-1;
    e.readyT=Math.max(0,e.readyT-dt);
    if(target&&e.readyT<=0&&target.y>e.y+36&&Math.abs(target.x-e.x)<96){
      e.phase='windup';e.phaseT=C.warning;e.vx=0;e.targetX=target.x;e.targetY=target.y;e.face=Math.sign(target.x-e.x)||e.face;
    }
    return;
  }
  if(e.phase==='windup'){
    e.phaseT-=dt;if(e.phaseT>0)return;
    const height=Math.max(36,e.targetY-C.foot-e.y),initial=35,flight=(-initial+Math.sqrt(initial*initial+2*C.gravity*height))/C.gravity;
    e.vx=clamp((e.targetX-e.x)/flight,-145,145);e.vy=initial;e.phase='pounce';e.airT=0;return 'launch';
  }
  if(e.phase==='land'){
    e.phaseT-=dt;if(e.phaseT<=0){e.phase='run';e.vx=e.face*C.groundSpeed;}return;
  }
  const oldX=e.x,oldFoot=e.y+C.foot;
  if(e.phase==='run'){
    if(target)e.face=Math.sign(target.x-e.x)||e.face;e.vx=e.face*C.groundSpeed;e.x+=e.vx*dt;
    const feet={...e,y:e.y+C.foot};wall(feet,oldX,8);e.x=feet.x;
    const support=land(e.x,oldFoot-.5,oldFoot+1,6,false);
    if(support){
      e.y=support.y-C.foot;e.walkDistance+=Math.abs(e.x-oldX);
      if(!support.g&&!support.solid&&target&&target.y>support.y+28&&Math.abs(target.x-e.x)<30){e.phase='pounce';e.vy=45;e.airT=.2;e.targetY=target.y;}
      else return;
    }
    else{e.phase='pounce';e.vy=10;e.airT=.2;}
  }else e.x+=e.vx*dt;
  e.airT+=dt;e.vy=Math.min(C.maxFall,e.vy+C.gravity*dt);e.y+=e.vy*dt;
  let hit=land(e.x,oldFoot,e.y+C.foot,6,false);
  // One-way ledges above the committed target level must not catch the dive.
  if(hit&&!hit.g&&!hit.solid&&e.targetY>hit.y+14)hit=land(e.x,oldFoot,e.y+C.foot,6,true);
  if(hit&&e.vy>=0){e.y=hit.y-C.foot;e.vy=0;e.vx=0;e.phase='land';e.phaseT=.18;return 'land';}
  if(e.x<camera-45||e.x>camera+440||e.y>245)e.dead=true;
}

export function ceilingStalkerFrame(e){
  if(e.phase==='cling')return Math.floor((e.walkDistance||0)/(CEILING_STALKER.stride/2))%2;
  if(e.phase==='windup')return 2;
  if(e.phase==='pounce')return e.airT<.09?3:4;
  if(e.phase==='land')return 5;
  return 6+Math.floor((e.walkDistance||0)/(CEILING_STALKER.stride/2))%2;
}

export function drawCeilingStalker(art,e){
  if(!art.loaded.has('ceilingStalker'))return false;
  const g=art.g,b=CEILING_STALKER_ART[ceilingStalkerFrame(e)],s=CEILING_STALKER.scale;
  g.save();g.translate(e.x,e.y);g.scale(e.face<0?1:-1,1);if(e.flash>0)g.filter='brightness(1.8)';
  g.drawImage(art.images.ceilingStalker,...b,-221.75*s,-221.75*s,b[2]*s,b[3]*s);g.restore();return true;
}

/** Actual roof edges support the gripping claws; these foreground overhangs are scenery. */
export function drawStalkerRoofs(art,camera,time){
  const g=art.g;
  for(const roof of STALKER_ROOFS){
    if(roof.x+roof.w<camera||roof.x>camera+384)continue;
    g.save();g.translate(0,roof.y);g.scale(1,-1);
    drawHiveSlab(art,{x:roof.x,y:0,w:roof.w,h:40},Math.max(roof.x,camera-8),Math.min(roof.x+roof.w,camera+392),time);g.restore();
  }
}
