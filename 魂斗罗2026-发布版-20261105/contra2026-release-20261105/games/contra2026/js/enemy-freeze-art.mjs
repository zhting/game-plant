export const ENEMY_FREEZE_ASSET='/games/contra2026/assets/shared/enemy-freeze-v2.webp';
export const ENEMY_FREEZE_FRAMES=Object.freeze({film:[28,8,199,240],rime:[264,51,240,154],ground:[8,343,240,81],chips:[264,288,240,192]});

function bounds(e){
 if(e.t==='artillery')return{x:e.x-54,y:e.y-52,w:108,h:58,foot:e.y};
 if(e.t==='grenadier')return{x:e.x-50,y:e.y-48,w:100,h:52,foot:e.y-6,anchorX:e.x+e.face*(5+13*(e.peek||0))};
 if(e.t==='rock'){const r=e.r||10;return{x:e.x-r-3,y:e.y-r*2-3,w:r*2+6,h:r*2+6,foot:e.y};}
 return{x:e.x-25,y:e.y-35,w:50,h:e.t==='tur'?56:40,foot:e.t==='tur'?e.y+17:e.y};
}

/** Capture the actual pose into alpha, then grow ice from that silhouette.
 * Neither the collision box nor a surrounding rectangle is painted. */
export function drawFrozenEnemy(art,e,paint,options={}){
 const remaining=art.state?.freezeT||0,image=(art.baseArt||art).images?.freezeAtlas;
 if(!(remaining>0)||e.dead||art.freezePainting||!(image?.naturalWidth>0))return false;
 const b=options.bounds||bounds(e),density=art.scale||1,amount=Math.min(1,Math.ceil(remaining*10)/5);
 const key=JSON.stringify([options.role||e.t,b.x,b.y,b.w,b.h,density,e.anim,e.face,e.vx,e.ay,e.idx,e.phase,e.peek,e.artPose,options.poseKey,e.flash>0,amount]);
 const cache=art.frozenSprites||(art.frozenSprites=new Map());let sprite=cache.get(key);
 if(!sprite){
  const source=art.createCanvas();source.width=Math.ceil(b.w*density);source.height=Math.ceil(b.h*density);
  const ink=source.getContext('2d');ink.setTransform(density,0,0,density,-b.x*density,-b.y*density);
  const previous=art.g;art.g=ink;art.freezePainting=true;
  try{paint();}finally{art.g=previous;art.freezePainting=false;}
  const rim=art.createCanvas();rim.width=source.width;rim.height=source.height;
  const edge=rim.getContext('2d'),r=Math.max(1,density*.55);
  for(const [x,y]of [[-r,0],[r,0],[0,-r],[0,r],[-r*.7,-r*.7],[r*.7,-r*.7],[-r*.7,r*.7],[r*.7,r*.7]])edge.drawImage(source,x,y);
  edge.globalCompositeOperation='source-in';edge.fillStyle='#a0e6fa';edge.fillRect(0,0,rim.width,rim.height);
  const canvas=art.createCanvas();canvas.width=source.width;canvas.height=source.height;
  const g=canvas.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.globalAlpha=.72*amount;g.drawImage(rim,0,0);g.globalAlpha=1;g.drawImage(source,0,0);
  g.globalCompositeOperation='source-atop';g.fillStyle=`rgba(95,190,225,${amount*.44})`;g.fillRect(0,0,canvas.width,canvas.height);
  g.globalAlpha=amount*.82;g.drawImage(image,...ENEMY_FREEZE_FRAMES.film,0,0,canvas.width,canvas.height);
  g.globalAlpha=amount;g.globalCompositeOperation='source-over';
  const foot=(b.foot??e.y)-b.y,cx=(b.anchorX??e.x)-b.x,wide=(e.t==='artillery'?28:e.t==='tur'?21:17)*(options.size||1);
  g.setTransform(density,0,0,density,0,0);
  // Small generated crystals collect at the boots and a shoulder, leaving
  // the face, rifle and space between the limbs readable.
  g.drawImage(image,...ENEMY_FREEZE_FRAMES.ground,cx-wide/2,foot-3.5,wide,wide*81/240);
  if(!['tur','artillery','rock','grenadier'].includes(e.t)){
   const size=options.size||1;
   g.globalAlpha=amount*.88;g.drawImage(image,...ENEMY_FREEZE_FRAMES.rime,cx-7*size,foot-23*size,9*size,5.8*size);
  }
  sprite=canvas;cache.set(key,sprite);while(cache.size>48)cache.delete(cache.keys().next().value);
 }
 const g=art.g,draw=()=>g.drawImage(sprite,b.x,b.y,b.w,b.h);
 g.save();g.filter='none';
 if(art.withThermalMaterial)art.withThermalMaterial('cold',draw);else draw();
 if(remaining<.6){
  const drift=(.6-remaining)*4;g.globalAlpha*=Math.min(1,remaining*3);
  g.drawImage(image,...ENEMY_FREEZE_FRAMES.chips,e.x-7,b.foot-16+drift,14,11.2);
 }
 g.restore();return true;
}
