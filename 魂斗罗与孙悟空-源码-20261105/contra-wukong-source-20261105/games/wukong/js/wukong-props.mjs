import { segmentBoxTime } from './wukong-combat.mjs';

export const HALBERD_TIMING=Object.freeze({windup:.6,strike:.5,recovery:.55,cooldown:1.25});
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function advanceHalberd(e,target,dt){
  if(e.bladeCooldown>0)e.bladeCooldown=Math.max(0,e.bladeCooldown-dt);
  if(e.melee){
    e.melee.t+=dt;
    if(e.melee.t>=HALBERD_TIMING.windup+HALBERD_TIMING.strike+HALBERD_TIMING.recovery){e.melee=null;e.bladeCooldown=HALBERD_TIMING.cooldown;}
    return;
  }
  if(!target||e.bladeCooldown>0||Math.abs(target.x-e.x)>73||Math.abs(target.y-(e.y+14))>45)return;
  e.melee={t:0,face:target.x<e.x?-1:1,hits:[]};
}
export function halberdGeometry(e,time=e.melee?.t??0){
  const a=e.melee,face=a?.face||-1;
  let angle=-.75;
  if(a){
    const ready=smooth(time/HALBERD_TIMING.windup),strike=smooth((time-HALBERD_TIMING.windup)/HALBERD_TIMING.strike);
    const recovery=smooth((time-HALBERD_TIMING.windup-HALBERD_TIMING.strike)/HALBERD_TIMING.recovery);
    angle=(-.75-.85*ready+Math.PI*2*strike)*(1-recovery)-.75*recovery;
  }
  const origin={x:e.x,y:e.y-5},axis={x:face*Math.cos(angle),y:Math.sin(angle)};
  return {origin,face,angle,tip:{x:origin.x+axis.x*31,y:origin.y+axis.y*31},butt:{x:origin.x-axis.x*15,y:origin.y-axis.y*15}};
}
export function halberdHitsPlayer(e,p,box,solids){
  const a=e.melee;if(!a||e.dead||p.dead||p.camoT>0||p.enteringExit||p.exitEntered||a.hits.includes(p)||a.t<HALBERD_TIMING.windup||a.t>HALBERD_TIMING.windup+HALBERD_TIMING.strike)return false;
  for(let i=0;i<=4;i++){
    const q=halberdGeometry(e,Math.max(HALBERD_TIMING.windup,a.t-i/240));
    const hit=segmentBoxTime(q.origin,q.tip,box,3);if(hit===null)continue;
    if(solids.some(s=>s.g&&!s.gone&&!s.water&&segmentBoxTime(q.origin,q.tip,s)!==null&&segmentBoxTime(q.origin,q.tip,s)<hit-.001))continue;
    a.hits.push(p);return true;
  }
  return false;
}

export function drawHalberd(art,e){
  const g=art.g,im=art.images.heavenProps,q=halberdGeometry(e);
  if(im?.naturalWidth)g.drawImage(im,20,170,850,590,e.x-16,e.y-6,32,22);
  const active=e.melee&&e.melee.t>=HALBERD_TIMING.windup&&e.melee.t<HALBERD_TIMING.windup+HALBERD_TIMING.strike;
  if(active){const prev=halberdGeometry(e,Math.max(HALBERD_TIMING.windup,e.melee.t-.04));g.save();g.globalAlpha=.18;art.line(prev.origin.x,prev.origin.y,prev.tip.x,prev.tip.y,'#ffe3a3',5);g.restore();}
  art.line(q.butt.x,q.butt.y,q.tip.x,q.tip.y,'#61422e',2.1);art.line(q.butt.x,q.butt.y,q.tip.x,q.tip.y,'#d5b16a',.9);
  g.save();g.translate(q.tip.x,q.tip.y);g.scale(q.face,1);g.rotate(q.angle);
  g.fillStyle='#e9eee7';g.strokeStyle='#bb9046';g.lineWidth=.65;g.beginPath();g.moveTo(5,0);g.lineTo(-5,-3);g.lineTo(-2,0);g.lineTo(-5,3);g.closePath();g.fill();g.stroke();
  g.beginPath();g.moveTo(-7,-1);g.quadraticCurveTo(-10,-8,-5,-7);g.lineTo(-3,-2);g.closePath();g.fill();g.stroke();g.restore();
  if(e.flash>0)art.disc(e.x,e.y,3,'#fff0af');
}

export function drawGourd(art,x,y,kind,flying){
  const g=art.g,im=art.images.heavenProps;if(!im?.naturalWidth)return;
  const time=art.state.time??(art.state.t||0)/60;
  g.save();g.translate(x,y);g.rotate(flying?Math.sin(time*3+x*.02)*.09:0);
  const size=flying?1:.67;g.scale(size,size);
  g.drawImage(im,1100,0,800,810,-12,-12,30,27);
  if(!flying){g.fillStyle='#702d22';g.beginPath();g.arc(-.4,4.6,3.9,0,Math.PI*2);g.fill();art.hudText(String(kind).toUpperCase(),-.4,2.1,'#ffe4ab',4.7,'center');}
  g.restore();
}

export function drawCasket(art,e){
  const g=art.g,im=art.images.heavenCasket;if(!im?.naturalWidth)return;
  // Both painted states share the same world scale and planted-foot anchor.
  const [x,y,w,h,anchor]=e.open?[1040,95,805,680,1440]:[50,245,810,530,455];
  const scale=28/810;
  g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  if(e.flash>0)g.filter='brightness(1.35)';
  g.drawImage(im,x,y,w,h,e.x+(x-anchor)*scale,e.y+(y-760)*scale,w*scale,h*scale);
  g.restore();
}
