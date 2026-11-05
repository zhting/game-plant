import {hiveBroodParts,drawHiveBroodRoof,drawHiveBroodPort} from './hive-brood.mjs?v=hive-four-ports-1';

export const HIVE_BRAIN_ASSET='/games/contra2026/assets/stage7/alien-hive-brain-v1.webp';
export const HIVE_RIB_ASSET='/games/contra2026/assets/stage7/alien-hive-rib-v1.webp';
export const HIVE_RIB_ART=Object.freeze({bounds:Object.freeze([61,126,1817,542]),anchor:Object.freeze([209,364]),width:36});

export function hiveBrainBounds(part,image){
  const w=68,h=w*(image?.naturalHeight||1161)/(image?.naturalWidth||1355);
  return {x:part.x+part.w/2-w/2,y:part.y+part.h/2-h/2,w,h};
}

function nerve(art,x,y,xx,yy,phase){
  const g=art.g;
  g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x-12,y+phase,xx+18,yy-phase,xx,yy);
  g.strokeStyle='#150a1a';g.lineWidth=2.8;g.stroke();g.strokeStyle='#6d2347';g.lineWidth=1.7;g.stroke();g.strokeStyle='#bb5269';g.lineWidth=.35;g.stroke();
}

function wound(art,p){
  const g=art.g,cx=p.x+p.w/2,cy=p.y+p.h/2;
  g.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6,r=1+.18*Math.sin(i*7);const x=cx+Math.cos(a)*p.w*.24*r,y=cy+Math.sin(a)*p.h*.26*r;if(i)g.lineTo(x,y);else g.moveTo(x,y);}g.closePath();
  const cavity=g.createRadialGradient(cx,cy,1,cx,cy,p.w*.28);cavity.addColorStop(0,'#08060d');cavity.addColorStop(.7,'#1a0b18');cavity.addColorStop(1,'#59213a');
  g.fillStyle=cavity;g.fill();g.strokeStyle='#602840';g.lineWidth=.8;g.stroke();
  for(let i=0;i<3;i++)art.line(cx-8+i*5,cy-5,cx-4+i*3,cy+5,'#3a152d',.7);
}

/** Tapered, articulated bone plates curve over the brain and retract from it. */
function brainRibs(art,bounds,opening){
  const g=art.g,cx=bounds.x+bounds.w/2,cy=bounds.y+bounds.h/2,open=Math.max(0,Math.min(1,opening));
  const image=art.images.brainRib;if(!art.loaded.has('brainRib'))return;
  const meta=HIVE_RIB_ART,s=meta.width/meta.bounds[2];
  for(let i=0;i<4;i++)for(const side of [-1,1]){
    const dir=-side,root=cx+side*(bounds.w*.57),y=cy-22+i*14;
    g.save();g.translate(root,y);g.scale(dir,i<2?1:-1);g.rotate(-open*1.25);
    g.drawImage(image,...meta.bounds,-meta.anchor[0]*s,-meta.anchor[1]*s,meta.bounds[2]*s,meta.bounds[3]*s);g.restore();
  }
}

export function drawHiveBrainBoss(art,H){
  if(!H||H.x>(art.state.camX||0)+410)return;
  const g=art.g,x=H.x,brain=H.parts[2],ports=hiveBroodParts(H),time=H.tissueTime||0,beat=H.beatK||0,dead=H.dead;
  if(art.loaded.has('hiveWall')){
    const image=art.images.hiveWall,sw=Math.min(image.naturalWidth,image.naturalHeight*150/176);
    g.save();g.globalAlpha=dead?.38:.92;g.drawImage(image,image.naturalWidth-sw,0,sw,image.naturalHeight,x+4,0,150,176);g.restore();
  }
  drawHiveBroodRoof(art,H);
  const b=hiveBrainBounds(brain,art.images.brain),cx=b.x+b.w/2,cy=b.y+b.h/2;
  for(const p of ports){
    if(p.hp>0)nerve(art,cx+(p.x<cx?-8:8),cy+(p.row==='top'?-10:12),p.x+p.w/2,p.y+p.h/2,p.row==='top'?9:-10);
    drawHiveBroodPort(art,p);if(p.hp<=0)wound(art,p);
  }
  if(art.loaded.has('brain')){
    const image=art.images.brain,pulse=dead?1:1+Math.sin(time*1.8)*.009+beat*.012;
    g.save();g.translate(cx,cy);g.scale(pulse,pulse);
    if(dead)g.filter='brightness(.28) saturate(.35)';else if(brain.flash>0)g.filter='brightness(1.8)';
    g.drawImage(image,-b.w/2,-b.h/2,b.w,b.h);g.restore();
  }
  if(!dead){
    // Neural impulses move along the fissures, below the protective bone plates.
    for(let i=0;i<4;i++){
      const phase=((time*.55+i*.24)%1+1)%1,side=i%2?-1:1;
      const px=cx+side*(6+Math.sin(phase*Math.PI)*13),py=cy-16+phase*25;
      g.save();g.globalAlpha=Math.sin(phase*Math.PI)*.23;art.light(px,py,4,'rgba(235,76,164,.65)');g.restore();
    }
    if(H.open){g.save();g.globalAlpha=.13+beat*.1;art.light(cx,cy,36,'rgba(225,51,107,.5)');g.restore();}
    brainRibs(art,b,H.openK||0);
  }
}

