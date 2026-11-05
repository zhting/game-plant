export const LARVA_HOP_ASSET='/games/contra2026/assets/stage7/alien-larva-hop-v1.webp';
export const LARVA_HOP_ART=Object.freeze({
  scale:.0355,windup:.2,launch:.075,landing:.12,
  frames:Object.freeze([
    {name:'idle',bounds:[0,0,512,512],anchor:[256,424]},
    {name:'crouch',bounds:[512,0,512,512],anchor:[256,422]},
    {name:'launch',bounds:[1024,0,512,512],anchor:[256,424]},
    {name:'tuck',bounds:[0,512,512,512],anchor:[256,424]},
    {name:'reach',bounds:[512,512,512,512],anchor:[256,424]},
    {name:'land',bounds:[1024,512,512,512],anchor:[256,424]}
  ].map(f=>Object.freeze({...f,bounds:Object.freeze(f.bounds),anchor:Object.freeze(f.anchor)})))
});

/** Physics owns the jump. These snapshot fields only track its visual phases. */
export function advanceLarvaHop(e,previouslyGrounded,dt,previousVX=e.vx){
  e.face=Math.sign(e.vx)||Math.sign(previousVX)||e.face||-1;
  if(e.on){
    e.landT=previouslyGrounded?Math.max(0,(e.landT||0)-dt):LARVA_HOP_ART.landing;
    e.hopAirT=0;
  }else{
    e.hopAirT=previouslyGrounded?0:(e.hopAirT||0)+dt;e.landT=0;
  }
}

export function larvaHopFrame(e){
  if(e.on){
    if(e.landT>0)return 5;
    return e.hopT<=LARVA_HOP_ART.windup?1:0;
  }
  if((e.hopAirT??1)<LARVA_HOP_ART.launch&&e.vy<-80)return 2;
  return e.vy<45?3:4;
}

export function drawLarvaHop(art,e){
  const image=art.images.larva;if(!art.loaded.has('larva')||!(image?.naturalWidth>0))return false;
  const g=art.g,m=LARVA_HOP_ART.frames[larvaHopFrame(e)],s=LARVA_HOP_ART.scale;
  g.save();g.translate(e.x,e.y);g.scale((e.vx||e.face||-1)<0?1:-1,1);
  if(e.flash>0)g.filter='brightness(1.8)';
  g.drawImage(image,...m.bounds,-m.anchor[0]*s,-m.anchor[1]*s,m.bounds[2]*s,m.bounds[3]*s);g.restore();return true;
}
