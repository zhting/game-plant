import {CEILING_BROOD,drawCeilingCreature} from './ceiling-parasite.mjs?v=floor-parasites-1';
import {drawHiveSlab} from './stage-eight-atmosphere.mjs?v=fused-tissue-3';

export const HIVE_HATCHLING_ASSET='/games/contra2026/assets/stage7/alien-hive-hatchling-v1.webp';
export const HIVE_BROOD=Object.freeze({hp:12,limit:6,interval:3.2,life:7.5,scale:.034});

export function createHiveBrainParts(x){
  const port=(k,dx,row,slot)=>({hive:1,brood:true,k,row,slot,x:x+dx,y:row==='top'?16:148,w:36,h:28,
    hp:HIVE_BROOD.hp,max:HIVE_BROOD.hp,flash:0,phase:'idle',phaseT:0,fireT:.9+slot*.9,spawnSequence:0});
  return [port('eye',2,'top',0),port('maw',2,'bottom',1),
    {hive:1,k:'heart',x:x+40,y:82,w:50,h:50,hp:80,max:80,flash:0},
    port('broodTR',92,'top',2),port('broodBR',92,'bottom',3)];
}
export function hiveBroodParts(H){return H.parts.filter(p=>p.brood);}
export function hiveBroodRemaining(H){return hiveBroodParts(H).filter(p=>p.hp>0).length;}
export function hiveBroodHealth(H){return hiveBroodParts(H).reduce((s,p)=>({hp:s.hp+Math.max(0,p.hp),max:s.max+p.max}),{hp:0,max:0});}
export function hiveDamageableParts(H){return H.open?[H.parts[2]]:hiveBroodParts(H).filter(p=>p.hp>0);}
export function hiveBroodMouth(p){return {x:p.x+p.w/2-6,y:p.y+p.h/2+(p.row==='top'?10:-10)};}

export function createHiveHatchling(port){
  const {x,y}=hiveBroodMouth(port);
  return {t:'hiveHatchling',from:'hive-'+port.k,x,y,baseY:y,vx:-50,vy:port.row==='top'?50:-64,
    age:0,phase:port.slot*.9+port.spawnSequence*.7,hp:1,flash:0};
}

/** Four independent mouths open in staggered turns and stop when destroyed. */
export function advanceHiveBrood(H,dt,enemies,{active=false}={}){
  if(!active||H.dead||H.open)return [];
  const born=[];
  for(const p of hiveBroodParts(H)){
    if(p.hp<=0)continue;
    if(p.phase==='idle'){
      p.fireT-=dt;if(p.fireT<=0){p.phase='opening';p.phaseT=CEILING_BROOD.warning;}
      continue;
    }
    p.phaseT-=dt;if(p.phaseT>0)continue;
    if(p.phase==='opening'){
      p.phase='spit';p.phaseT=CEILING_BROOD.spit;
      if(enemies.filter(e=>e.t==='hiveHatchling'&&!e.dead).length+born.length<HIVE_BROOD.limit){born.push(createHiveHatchling(p));p.spawnSequence++;}
    }else if(p.phase==='spit'){p.phase='recover';p.phaseT=CEILING_BROOD.recover;}
    else{p.phase='idle';p.fireT=HIVE_BROOD.interval;}
  }
  return born;
}

export function advanceHiveHatchling(e,target,dt,camera=0){
  if(e.dead)return;e.age+=dt;
  if(e.age>.45){
    const dx=target?Math.max(-64,Math.min(-26,(target.x-e.x)*.6)):-50;
    const dy=target?Math.max(-38,Math.min(48,(target.y-15-e.baseY)*.55)):0,k=Math.min(1,dt*1.7);
    e.vx+=(dx-e.vx)*k;e.vy+=(dy-e.vy)*k;
  }
  e.x+=e.vx*dt;e.baseY=Math.max(30,Math.min(162,e.baseY+e.vy*dt));e.y=e.baseY+Math.sin(e.age*5.2+e.phase)*2.6*Math.min(1,e.age/.3);
  if(e.age>HIVE_BROOD.life||e.x<camera-36||e.x>camera+432)e.dead=true;
}
export function hiveHatchlingBox(e){return {x:e.x-7,y:e.y-6,w:14,h:12};}
export function hiveHatchlingFrame(e){return Math.floor((e.age||0)*8+(e.phase||0))%4;}

/** Decorative hive tissue does not shield the rear pair of exposed mouths. */
export function hiveShotBlocked(H,x,y){
  if(!H||H.dead||x<H.x+4||y>176)return false;
  const p=H.parts[2];return x>H.x+144||!H.open&&x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=p.y+p.h;
}

export function drawHiveBroodRoof(art,H){
  if(!art.loaded.has('terrain'))return;
  const g=art.g;g.save();g.translate(0,16);g.scale(1,-1);
  drawHiveSlab(art,{x:H.x+4,y:0,w:146,h:32,g:1},H.x+4,H.x+150,H.tissueTime||0);g.restore();
}
export function drawHiveBroodPort(art,p){
  const g=art.g;g.save();g.translate(p.x+p.w/2,p.y+p.h/2);g.scale(1.2,p.row==='bottom'?-1.2:1.2);
  if(p.hp<=0)g.filter='brightness(.28) saturate(.35)';
  drawCeilingCreature(art,{t:'ceilingParasite',x:0,y:0,phase:p.hp<=0?'recover':p.phase,phaseT:p.phaseT,flash:p.hp>0?p.flash:0});g.restore();
}
export function drawHiveHatchling(art,e){
  if(!art.loaded.has('hiveHatchling'))return false;
  const g=art.g,image=art.images.hiveHatchling,cell=image.naturalWidth/2,s=HIVE_BROOD.scale,frame=hiveHatchlingFrame(e);
  g.save();if(e.flash>0)g.filter='brightness(1.8)';g.drawImage(image,frame%2*cell,Math.floor(frame/2)*cell,cell,cell,e.x-cell*s/2,e.y-cell*s/2,cell*s,cell*s);g.restore();return true;
}
