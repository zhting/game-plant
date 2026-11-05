export const CEILING_PARASITE_ASSETS=Object.freeze({
  ceilingParasite:'/games/contra2026/assets/stage7/alien-ceiling-parasite-v1.webp',
  whiteFloater:'/games/contra2026/assets/stage7/alien-white-floater-v1.webp'
});
export const CEILING_NESTS=Object.freeze([[460,32],[498,32],[1470,48],[1508,48],[2110,32],[2148,32],[2780,48],[2818,48]].map(Object.freeze));
export const FLOOR_NESTS=Object.freeze([[740,196],[778,196],[1680,196],[1718,196],[2300,196],[2338,196],[2910,196],[2948,196]].map(Object.freeze));
export const CEILING_BROOD=Object.freeze({limit:8,life:8.5,warning:.55,spit:.24,recover:.4,parasiteScale:.045,floaterScale:.035});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function createCeilingParasites(){
  return CEILING_NESTS.map(([x,y],idx)=>({t:'ceilingParasite',mount:'ceiling',id:'ceiling-'+idx,idx,x,y,hp:6,max:6,phase:'idle',phaseT:0,fireT:1.1+idx%2*.65,clock:0,spawnSequence:0,flash:0}));
}
export function createFloorParasites(){
  return FLOOR_NESTS.map(([x,y],i)=>({t:'ceilingParasite',mount:'floor',id:'floor-'+i,idx:CEILING_NESTS.length+i,x,y,hp:6,max:6,phase:'idle',phaseT:0,fireT:1.5+i%2*.85,clock:0,spawnSequence:0,flash:0}));
}
export function ceilingParasiteBox(e){return {x:e.x-12,y:e.y-10,w:24,h:22};}
export function whiteFloaterBox(e){return {x:e.x-7,y:e.y-6,w:14,h:12};}
export function ceilingParasiteMouth(e){return {x:e.x,y:e.y+(e.mount==='floor'?-8:8)};}

export function createWhiteFloater(parent){
  const {x,y}=ceilingParasiteMouth(parent),phase=parent.idx*.91+(parent.spawnSequence||0)*1.7;
  const floor=parent.mount==='floor';
  return {t:'whiteFloater',from:parent.id,mount:parent.mount||'ceiling',launchY:y,emerged:!floor,x,y,baseY:y,vx:parent.idx%2?12:-12,vy:floor?-48:48,age:0,phase,hp:1,flash:0};
}

/** Opening is a visible warning; one creature emerges before the lips contract. */
export function advanceCeilingParasite(e,dt,enemies,{active=false}={}){
  if(e.dead||!active)return [];
  e.clock+=dt;
  if(e.phase==='idle'){
    e.fireT-=dt;if(e.fireT<=0){e.phase='opening';e.phaseT=CEILING_BROOD.warning;}
    return [];
  }
  e.phaseT-=dt;if(e.phaseT>0)return [];
  if(e.phase==='opening'){
    e.phase='spit';e.phaseT=CEILING_BROOD.spit;
    if(enemies.filter(q=>q.t==='whiteFloater'&&!q.dead).length>=CEILING_BROOD.limit)return [];
    const child=createWhiteFloater(e);e.spawnSequence++;return [child];
  }
  if(e.phase==='spit'){e.phase='recover';e.phaseT=CEILING_BROOD.recover;}
  else{e.phase='idle';e.fireT=3.5+e.idx%2*.35;}
  return [];
}

/** Slow buoyant pursuit, without gravity or snapping to the player's position. */
export function advanceWhiteFloater(e,target,dt,camera=0){
  if(e.dead)return;
  e.age+=dt;
  if(e.age>.45){
    const dx=target?clamp((target.x-e.x)*.55,-38,38):e.vx;
    const dy=target?clamp((target.y-17-e.baseY)*.5,-22,34):10;
    const k=Math.min(1,dt*1.6);e.vx+=(dx-e.vx)*k;e.vy+=(dy-e.vy)*k;
  }
  const rising=e.mount==='floor'&&!e.emerged,bottom=rising?Math.max(162,e.launchY||e.baseY):162;
  e.x+=e.vx*dt;e.baseY=clamp(e.baseY+e.vy*dt,30,bottom);
  if(rising&&e.baseY<=162)e.emerged=true;
  e.y=e.baseY+Math.sin(e.age*4.1+e.phase)*3*Math.min(1,e.age/.4);
  if(e.age>CEILING_BROOD.life||e.x<camera-36||e.x>camera+432)e.dead=true;
}

export function ceilingParasiteFrame(e){
  if(e.phase==='opening')return e.phaseT>CEILING_BROOD.warning*.45?1:2;
  return e.phase==='spit'?2:e.phase==='recover'?3:0;
}
export function whiteFloaterFrame(e){return Math.floor((e.age||0)*7+(e.phase||0))%4;}

/** A textured ceiling ledge joins the parasite's own tendon root. It is scenery. */
export function drawCeilingNest(art,e){
  if(!art.loaded.has('terrain'))return;
  const g=art.g,root=e.y-12,image=art.images.terrain,sw=Math.min(image.naturalWidth,image.naturalHeight*52/40);
  g.save();g.beginPath();g.moveTo(e.x-26,0);g.lineTo(e.x+26,0);g.lineTo(e.x+26,root-7);g.quadraticCurveTo(e.x+24,root,e.x+17,root);g.lineTo(e.x-17,root);g.quadraticCurveTo(e.x-25,root,e.x-26,root-7);g.closePath();g.clip();
  g.translate(e.x-26,root);g.scale(1,-1);
  const sx=e.idx*347%Math.max(1,image.naturalWidth-sw);g.drawImage(image,sx,0,sw,image.naturalHeight,0,0,52,40);g.restore();
}

export function drawCeilingNests(art,camera){
  for(const [idx,[x,y]]of CEILING_NESTS.entries())if(x>camera-30&&x<camera+414)drawCeilingNest(art,{x,y,idx});
}

export function drawCeilingCreature(art,e){
  const parent=e.t==='ceilingParasite',key=parent?'ceilingParasite':'whiteFloater';
  if(!art.loaded.has(key))return false;
  const g=art.g,image=art.images[key],cell=image.naturalWidth/2,s=parent?CEILING_BROOD.parasiteScale:CEILING_BROOD.floaterScale;
  const frame=parent?ceilingParasiteFrame(e):whiteFloaterFrame(e);
  g.save();if(e.flash>0)g.filter='brightness(1.8)';
  g.drawImage(image,frame%2*cell,Math.floor(frame/2)*cell,cell,cell,e.x-cell*s*.5,e.y-(parent?333:cell*.5)*s,cell*s,cell*s);g.restore();return true;
}
