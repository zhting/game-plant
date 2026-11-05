export const ALIEN_CRAWLER_ASSET='/games/contra2026/assets/stage7/alien-crawler-walk-v1.webp';
export const ALIEN_CRAWLER_ART=Object.freeze({
  // All six poses share one scale and torso anchor; planted claws use the
  // measured native alpha baseline, rather than stretching each silhouette.
  scale:.05,stride:28,
  frames:Object.freeze([
    {bounds:[0,0,591,444],anchor:[295,370]},
    {bounds:[591,0,592,444],anchor:[295,370]},
    {bounds:[1183,0,591,444],anchor:[295,366]},
    {bounds:[0,444,591,443],anchor:[295,371]},
    {bounds:[591,444,592,443],anchor:[295,371]},
    {bounds:[1183,444,591,443],anchor:[295,370]}
  ].map(f=>Object.freeze({...f,bounds:Object.freeze(f.bounds),anchor:Object.freeze(f.anchor)})))
});

/** Animate by actual ground travel, including direction changes and walls. */
export function advanceAlienCrawler(e,oldX){
  if(e.dead||!e.on)return;
  e.crawlDistance=(e.crawlDistance||0)+Math.abs(e.x-oldX);
}

export function alienCrawlerFrame(e){
  if(e.on===false)return 4; // Fold the limbs while jumping or falling.
  return Math.floor(Math.max(0,e.crawlDistance||0)*6/ALIEN_CRAWLER_ART.stride)%6;
}

export function drawAlienCrawler(art,e){
  const image=art.images.crawler;if(!art.loaded.has('crawler')||!(image?.naturalWidth>0))return false;
  const g=art.g,meta=ALIEN_CRAWLER_ART.frames[alienCrawlerFrame(e)],s=ALIEN_CRAWLER_ART.scale,[,,w,h]=meta.bounds;
  g.save();g.translate(e.x,e.y);g.scale((e.vx||e.face||-1)<0?1:-1,1);
  if(e.flash>0)g.filter='brightness(1.8)';
  g.drawImage(image,...meta.bounds,-meta.anchor[0]*s,-meta.anchor[1]*s,w*s,h*s);g.restore();return true;
}
