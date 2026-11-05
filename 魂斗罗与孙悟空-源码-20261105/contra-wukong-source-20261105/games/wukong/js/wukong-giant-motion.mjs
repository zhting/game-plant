// Painted armour is attached to hip/knee/ankle joints rather than sliding a standing sprite.
import { drawGiantCloth } from './wukong-giant-cloth.mjs';
const SCALE=.115,ANCHOR=[790,878];
const legs=[
  {hip:[664,482],knee:[518,636],ankle:[424,796],parts:[
    [[640,451],[742,480],[711,557],[629,630],[550,681],[458,655],[445,612],[520,532]],
    [[471,589],[553,606],[578,651],[530,726],[475,807],[407,830],[365,788],[403,706]],
    [[383,757],[460,776],[475,817],[456,863],[380,880],[316,874],[314,841],[345,802]]]},
  {hip:[887,482],knee:[1040,638],ankle:[1114,796],parts:[
    [[875,449],[969,475],[1057,530],[1104,581],[1094,632],[1044,681],[974,648],[909,560]],
    [[1002,599],[1072,587],[1116,633],[1139,718],[1170,786],[1138,829],[1068,798],[1026,715]],
    [[1083,764],[1158,777],[1201,807],[1249,830],[1255,869],[1172,880],[1057,867],[1048,817]]]}
];
const cape=[[30,350],[375,180],[555,133],[638,150],[650,190],[555,245],[565,310],[623,385],[697,432],[729,512],[706,609],[677,723],[624,809],[513,819],[437,756],[373,778],[302,819],[193,817],[108,724],[62,605]];
const plume=[[396,142],[481,56],[590,2],[751,0],[814,30],[816,72],[767,94],[721,128],[636,170],[518,194]];
const ribbonHigh=[[650,154],[531,125],[416,137],[379,171],[384,216],[469,234],[527,218],[588,239],[631,232],[662,194]];
const ribbonLow=[[601,195],[528,212],[428,221],[351,249],[284,244],[231,275],[202,337],[215,381],[239,380],[273,333],[307,319],[351,345],[405,328],[469,301],[557,289],[603,258]];
const path=(g,points)=>{g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();};
function pieces(art,image){
  const key='giant:jointed-pieces';if(art.cache.has(key))return art.cache.get(key);
  const make=polygon=>{
    const xs=polygon.map(p=>p[0]),ys=polygon.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
    const canvas=art.createCanvas();canvas.width=w;canvas.height=h;const g=canvas.getContext('2d');g.translate(-x,-y);path(g,polygon);g.clip();g.drawImage(image,0,0);
    return {canvas,x,y,w,h};
  };
  const cut=(frame,polygons)=>{const g=frame.canvas.getContext('2d');g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='destination-out';for(const p of polygons){path(g,p.map(([x,y])=>[x-frame.x,y-frame.y]));g.fill();}g.restore();};
  const core=make([[25,0],[1275,0],[1275,887],[25,887]]),cloth=make(cape),hair=make(plume),high=make(ribbonHigh),low=make(ribbonLow),legMasks=legs.flatMap(l=>l.parts);
  cut(core,[cape,plume,ribbonHigh,ribbonLow,...legMasks]);cut(cloth,[...legMasks,ribbonHigh,ribbonLow]);cut(low,[ribbonHigh]);
  const result={core,cloth,hair,high,low,legs:legs.map(meta=>({...meta,frames:meta.parts.map(make)}))};art.cache.set(key,result);return result;
}
function paint(g,f){g.drawImage(f.canvas,(f.x-ANCHOR[0])*SCALE,(f.y-ANCHOR[1])*SCALE,f.w*SCALE,f.h*SCALE);}
function segment(g,f,sourceA,sourceB,a,b){
  const sx=(sourceA[0]-ANCHOR[0])*SCALE,sy=(sourceA[1]-ANCHOR[1])*SCALE;
  const sourceAngle=Math.atan2(sourceB[1]-sourceA[1],sourceB[0]-sourceA[0]),length=Math.hypot(sourceB[0]-sourceA[0],sourceB[1]-sourceA[1])*SCALE;
  g.save();g.translate(a.x,a.y);g.rotate(Math.atan2(b.y-a.y,b.x-a.x));g.scale(Math.hypot(b.x-a.x,b.y-a.y)/length,1);g.rotate(-sourceAngle);g.translate(-sx,-sy);paint(g,f);g.restore();
}
function torso(g,q){
  g.translate(q.lunge*.45,-42+q.lift);g.rotate(q.roll);g.translate(0,42);
  g.transform(q.widthScale,0,-q.lean*q.bodyScaleY,q.bodyScaleY,0,0);
}
export function drawGiantBody(art,giant,rig){
  const g=art.g,p=pieces(art,art.images.giantRig),q=rig.pose,clock=giant.clock||0,energy=Math.min(2,Math.abs(giant.vx||0)/70+q.clothKick*.8+(q.air?.5:0));
  g.save();g.translate(giant.x,giant.y);g.scale(q.face,1);
  g.save();torso(g,q);
  drawGiantCloth(art,p.cloth,'cape',clock,energy);drawGiantCloth(art,p.low,'ribbonLow',clock,energy);drawGiantCloth(art,p.high,'ribbonHigh',clock,energy);g.restore();
  for(const i of [1,0]){
    const leg=rig.legs[i],source=p.legs[i];
    g.save();if(i===1)g.filter='brightness(.9)';
    segment(g,source.frames[1],source.knee,source.ankle,leg.knee,leg.ankle);
    segment(g,source.frames[0],source.hip,source.knee,leg.hip,leg.knee);
    g.save();g.translate(leg.ankle.x,leg.ankle.y);g.rotate(leg.footAngle);
    g.translate(-(source.ankle[0]-ANCHOR[0])*SCALE,-(source.ankle[1]-ANCHOR[1])*SCALE);paint(g,source.frames[2]);g.restore();g.restore();
  }
  g.save();torso(g,q);
  paint(g,p.core);drawGiantCloth(art,p.hair,'hair',clock,energy);g.restore();g.restore();
}
