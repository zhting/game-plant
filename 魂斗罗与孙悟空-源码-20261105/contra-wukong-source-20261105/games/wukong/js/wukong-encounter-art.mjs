import { FORTRESS_EXIT } from '../../contra2026/js/stage-one-art.mjs?v=permanent-monsoon-1';
import { drawHealingPickup } from './wukong-hit-art.mjs';

export const ENCOUNTER_ASSET='/games/wukong/assets/heaven-encounters.webp';
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const ENCOUNTER_FRAMES=Object.freeze({fairy:[12,35,855,520],gate:[870,10,662,565],fallen:[10,582,1025,430],peach:[1040,589,484,425]});

export function drawPeach(art,x,y,_kind,small=false){
  if(drawHealingPickup(art,x,y,_kind,small))return;
  const image=art.images.heavenEncounters;if(!image?.naturalWidth)return;
  const g=art.g,w=small?10:15,h=w*425/484;
  g.save();g.imageSmoothingEnabled=true;
  const glow=g.createRadialGradient(x,y,1,x,y,w*.8);glow.addColorStop(0,'rgba(255,225,156,.32)');glow.addColorStop(1,'rgba(255,229,174,0)');
  g.fillStyle=glow;g.fillRect(x-w,y-w,w*2,w*2);
  g.drawImage(image,...ENCOUNTER_FRAMES.peach,x-w/2,y-h/2,w,h);
  g.restore();
}
export function drawSupplyFairy(art,pd){
  const image=art.images.heavenEncounters;if(!image?.naturalWidth)return;
  const g=art.g,[sx,sy,sw,sh]=ENCOUNTER_FRAMES.fairy,scale=.062,time=pd.t||0;
  g.save();g.translate(pd.x,pd.y);g.rotate(pd.flee?-.12:Math.sin(time*2)*.025);
  // Silk and trailing ribbons bend without moving the hands carrying the peach.
  for(let x=0;x<sw;x+=24){
    const width=Math.min(24,sw-x),weight=(1-x/sw)**2;
    const dy=Math.sin(time*(pd.flee?10:5)-x*.015)*weight*(pd.flee?1.8:.9);
    g.drawImage(image,sx+x,sy,width,sh,(sx+x-824)*scale,(sy-239)*scale+dy,width*scale+.03,sh*scale);
  }
  if(!pd.flee)drawPeach(art,1,-4,pd.kind,true);
  g.restore();
}
export function heavenGatePath(g){
  const cx=FORTRESS_EXIT.trigger.x+FORTRESS_EXIT.trigger.w/2;
  g.beginPath();g.moveTo(cx-14,174);g.lineTo(cx-14,134);g.bezierCurveTo(cx-14,106,cx+14,106,cx+14,134);g.lineTo(cx+14,174);g.closePath();
}
export function drawHeavenGate(art,boss){
  const image=art.images.heavenEncounters;if(!image?.naturalWidth)return;
  const g=art.g,time=art.state.time||0,cx=FORTRESS_EXIT.trigger.x+FORTRESS_EXIT.trigger.w/2;
  const x=cx-41,y=78,w=82,h=99;
  g.save();heavenGatePath(g);g.clip();
  const light=g.createLinearGradient(cx-14,0,cx+14,0);light.addColorStop(0,'#aecfd6');light.addColorStop(.5,'#fff7c8');light.addColorStop(1,'#c3e3de');
  g.globalAlpha=boss.exitOpen?.82:.4;g.fillStyle=light;g.fillRect(cx-14,110,28,66);
  g.strokeStyle='#fffde3';g.lineWidth=.7;g.globalAlpha*=.5;
  for(let i=0;i<5;i++){g.beginPath();g.ellipse(cx,121+(time*9+i*12)%48,10+Math.sin(time+i)*2,2,0,0,Math.PI*2);g.stroke();}
  g.restore();g.save();g.imageSmoothingEnabled=true;g.drawImage(image,...ENCOUNTER_FRAMES.gate,x,y,w,h);g.restore();
}
export function giantDefeatVisual(boss){
  const t=Math.max(0,1.1-(boss.deadT||0)),pose=boss.defeatRig||boss.giant;
  const finished=boss.encounter?.stage===4;
  return {t,pose,blend:finished?1:smooth((t-.22)/.48),fall:finished?1:smooth(t/.65)};
}
export function drawFallenGiant(art,boss,visual=giantDefeatVisual(boss)){
  const image=art.images.heavenEncounters;if(!image?.naturalWidth||!visual.pose)return;
  const g=art.g,pose=visual.pose,scale=.14,cx=Math.max(3075,Math.min(3261,pose.x+(pose.face||-1)*25));
  g.save();g.globalAlpha*=visual.blend;g.imageSmoothingEnabled=true;
  if(pose.face>0){g.translate(cx,0);g.scale(-1,1);g.translate(-cx,0);}
  // Seat the cloak and resting body on the platform instead of the axe's edge.
  const y=176+5-(944-582)*scale-(1-visual.blend)*4;
  g.drawImage(image,...ENCOUNTER_FRAMES.fallen,cx-1025*scale/2,y,1025*scale,430*scale);g.restore();
}
