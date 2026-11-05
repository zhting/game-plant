export const WINTER_TANK_CORE_ASSET='/games/contra2026/assets/stage5/winter-tank-core-v2.webp';
export const WINTER_TANK_CORE_ART=Object.freeze({width:30,size:Object.freeze([512,192]),
 lamps:Object.freeze([[155,102.5,25],[251,102.5,25],[348,102.5,25]].map(Object.freeze))});

export function winterTankCoreRect(tank){
 const {width,size}=WINTER_TANK_CORE_ART,scale=width/size[0];
 return {x:tank.x+73,y:123.5-102.5*scale,w:width,h:size[1]*scale};
}

/** The painted housing and three optics share the tank's physical material.
 * Only light and damage change; the simulation's core hit box is untouched. */
export function drawWinterTankCore(g,image,tank,{time=0,thermal=false}={}){
 if(!(image?.naturalWidth>0)||!tank?.parts?.[2])return false;
 const core=tank.parts[2],dead=tank.dead||core.hp<=0,hot=!!tank.phase2,flash=core.flash>0;
 const r=winterTankCoreRect(tank),scale=r.w/WINTER_TANK_CORE_ART.size[0];
 g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 if(dead)g.filter='grayscale(1) brightness(.35)';
 else if(flash)g.filter='brightness(1.75) saturate(.65)';
 g.drawImage(image,r.x,r.y,r.w,r.h);g.restore();
 if(dead){
  g.save();g.strokeStyle='#0d141a';g.lineWidth=.35;g.beginPath();
  g.moveTo(r.x+r.w*.26,r.y+r.h*.27);g.lineTo(r.x+r.w*.40,r.y+r.h*.58);
  g.lineTo(r.x+r.w*.48,r.y+r.h*.51);g.lineTo(r.x+r.w*.62,r.y+r.h*.81);g.stroke();g.restore();return true;
 }
 for(const [cx,cy,radius]of WINTER_TANK_CORE_ART.lamps){
  const x=r.x+cx*scale,y=r.y+cy*scale,glass=radius*scale;
  if(hot||flash){
   g.save();g.beginPath();g.arc(x,y,glass,0,Math.PI*2);g.clip();
   g.globalAlpha*=flash?.78:.32+.06*Math.sin(time*13);
   g.fillStyle=flash?'#fff9e6':thermal?'#ffce63':'#fa5a25';g.fillRect(x-glass,y-glass,glass*2,glass*2);g.restore();
  }
  const glow=g.createRadialGradient(x,y,0,x,y,glass*2.2);
  glow.addColorStop(0,flash?'rgba(255,247,210,.5)':hot?'rgba(255,105,40,.22)':'rgba(255,184,70,.08)');
  glow.addColorStop(1,'rgba(255,124,35,0)');
  g.save();g.fillStyle=glow;g.fillRect(x-glass*2.2,y-glass*2.2,glass*4.4,glass*4.4);g.restore();
 }
 return true;
}
