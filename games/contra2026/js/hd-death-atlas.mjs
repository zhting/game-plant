// Measured RGBA components of the dedicated incapacitated poses; no weapon or aiming pose.
const make=boxes=>({
  key:'actorDeath',url:'/games/contra2026/assets/stage1/commando-death-hd.webp',size:[1536,1024],scale:40/494,
  frames:Object.fromEntries(['deathAir','deathImpact','deathRest'].map((pose,i)=>{
    const [x,y,w,h]=boxes[i];return[pose,{bounds:boxes[i],anchor:[x+w/2,y+h],waist:y+h*.6}];
  }))
});
export const HD_DEATH=Object.freeze({
  blue:make([[10,145,494,317],[527,242,504,214],[1022,339,494,135]]),
  red:make([[11,607,493,316],[533,703,500,213],[1022,801,494,134]])
});
