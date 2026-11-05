import { giantAnimationTrack } from './wukong-giant-animation.mjs';

export const GIANT_WHOLE_ASSETS=Object.freeze({
  giantWholeMovement:'/games/wukong/assets/giant-whole-movement.webp',
  giantWholeCleave:'/games/wukong/assets/giant-whole-cleave.webp',
  giantWholeSweep:'/games/wukong/assets/giant-whole-sweep.webp',
  giantWholeSpin:'/games/wukong/assets/giant-whole-spin.webp',
  giantWholeMobility:'/games/wukong/assets/giant-whole-mobility.webp',
  giantWholeSweepLink:'/games/wukong/assets/giant-whole-sweep-link.webp',
});
// Source coordinates register the complete paintings at their feet/virtual floor.
// Weapon points are measured on the painted shaft; they also drive collision.
const sheet=(name,rows)=>rows.map(([x,y,ox,oy,tx,ty,bx,by,scale=.35,height=91,bottom=0],index)=>Object.freeze({
  id:name+':'+index,sheet:'giantWhole'+name[0].toUpperCase()+name.slice(1),index,
  anchor:[x,y],pick:[x,y-125],origin:[ox,oy],tip:[tx,ty],butt:[bx,by],scale,sourceWidth:1448,sourceHeight:1086,
  body:[-24,-height,48,height+bottom],bounds:[index%4*362,Math.floor(index/4)*362,362,362]}));
export const GIANT_WHOLE_FRAMES=Object.freeze({
  movement:sheet('movement',[
    [235,390,245,220,338,75,200,310,.32],[599,390,605,218,681,72,556,310,.32],
    [961,390,971,222,1057,75,922,311,.32],[1322,390,1331,218,1416,78,1281,310,.32],
    [245,725,258,568,332,460,219,630,.365],[600,725,612,570,674,453,569,637,.365],
    [960,724,977,573,1048,456,936,637,.365],[1322,724,1337,570,1406,454,1301,636,.365],
    [244,1064,256,904,337,787,216,970,.365],[598,1064,614,902,676,787,575,969,.365],
    [960,1065,980,905,1051,791,939,969,.365],[1319,1065,1337,906,1407,787,1298,969,.365],
  ]),
  cleave:sheet('cleave',[
    [240,397,253,235,330,90,203,321,.34],[615,397,666,210,624,80,689,268,.34],
    [952,397,964,119,824,142,989,98,.34],[1301,397,1293,99,1140,100,1336,105,.34],
    [242,747,271,530,163,444,319,565,.36],[570,747,604,594,676,489,559,660,.36],
    [914,747,940,608,1098,612,916,608,.36],[1286,747,1377,667,1428,714,1340,639,.36],
    [242,1067,276,995,392,1032,251,983,.39],[588,1067,612,957,716,990,576,945,.39],
    [939,1067,976,924,1036,824,944,977,.38],[1295,1068,1338,919,1401,790,1307,992,.38],
  ]),
  sweep:sheet('sweep',[
    [230,375,236,220,303,91,184,312,.34],[560,374,515,229,636,281,463,204,.34],
    [927,375,867,240,737,237,965,260,.34],[1293,375,1346,263,1148,252,1400,270,.34],
    [235,711,244,575,342,595,206,570,.34],[560,711,568,539,677,518,526,548,.34],
    [915,711,962,539,1064,525,913,550,.34],[1270,711,1320,575,1409,598,1285,570,.34],
    [235,1040,284,932,375,950,247,929],[570,1042,591,922,690,947,548,914],
    [926,1042,963,910,1048,851,916,945],[1286,1045,1320,871,1390,781,1273,960],
  ]),
  spin:sheet('spin',[
    [235,373,244,213,302,80,191,310,.33],[585,373,547,244,450,220,624,270,.33],
    [953,373,1003,133,928,62,1073,180,.33],[1310,372,1295,107,1161,101,1349,104,.33],
    [235,693,284,515,416,498,244,522],[590,695,690,578,755,652,651,540],
    [947,697,867,469,787,473,919,471],[1323,697,1316,464,1201,435,1352,479],
    [244,1050,300,893,412,899,258,890],[600,1055,623,943,708,1009,585,922],
    [942,1055,970,871,1026,783,921,963],[1305,1056,1331,867,1395,789,1286,964],
  ]),
  mobility:sheet('mobility',[
    [237,383,247,205,340,82,197,310,.33],[596,384,594,176,676,71,563,220,.33],
    [938,385,942,164,1006,59,906,216,.33],[1287,383,1322,225,1399,110,1285,300,.33],
    [244,731,256,628,353,505,201,704,.33],[587,730,594,565,661,454,552,632,.33],
    [939,731,1001,576,959,479,1020,635,.33],[1308,730,1320,459,1247,428,1384,493,.33],
    [235,1064,259,805,201,770,327,835,.33,95,-20],[580,1064,613,961,689,1012,581,941,.33],
    [932,1071,966,998,1046,1051,926,971,.33],[1295,1064,1325,908,1395,795,1281,973,.33],
  ]),
});
// Two touching drawings in the first sweep sheet were redrawn as isolated
// complete figures. Coordinates stay in master pixels even when compressed smaller.
const sweepLinks=sheet('sweepLink',[
  [399,750,421,526,681,584,256,493,.19],[1176,750,1264,433,1456,415,1175,442,.20],
]).map((f,i)=>Object.freeze({...f,id:'sweep:'+(i+4),sourceWidth:1536,sourceHeight:1024,bounds:[i*768,0,768,1024]}));
GIANT_WHOLE_FRAMES.sweep.splice(4,2,...sweepLinks);
for(const frames of Object.values(GIANT_WHOLE_FRAMES))Object.freeze(frames);
const attackTimes=[0,.12,.26,.4,.445,.49,.535,.575,.615,.72,.85,.96];
const select=(frames,times,u)=>{let index=0;while(index<times.length-1&&u>=times[index+1]-1e-9)index++;return frames[index];};
const wrap=n=>((n%1)+1)%1;
export function wholeGiantFrame(g,time=g.attack?.t??0){
  if(g.hurt){const u=Math.min(1,g.hurt.t/g.hurt.duration);return {frame:GIANT_WHOLE_FRAMES.mobility[u<.58?6:11],clip:'hurt',u};}
  const track=giantAnimationTrack(g,time),movement=GIANT_WHOLE_FRAMES.movement;
  const walking=(g.walkBlend||0)>.15&&Math.abs(g.vx||0)>2;
  if(track.clip==='walk'||track.clip==='retreat'||(g.attack&&g.attack.kind!=='leap'&&track.u>.76&&walking)){
    // Host gait already integrates signed travel in the character's facing.
    // Retreat therefore plays the same complete walk cycle backwards once.
    const u=wrap((g.gait||0)/Math.PI/2*56/36),back=(g.vx||0)*(g.face||-1)<0;
    return {frame:movement[4+Math.floor(u*8)],clip:back?'retreat':'walk',u};
  }
  if(track.clip==='idle')return {frame:movement[Math.floor(wrap((g.clock||0)/2.8)*4)],...track};
  if(track.clip==='stomp')return {frame:select(GIANT_WHOLE_FRAMES.mobility.slice(0,6),[0,.2,.4,.46,.62,.84],track.u),...track};
  if(track.clip==='jumpStart')return {frame:GIANT_WHOLE_FRAMES.mobility[track.u<.7?6:7],...track};
  if(track.clip==='jumpAir')return {frame:GIANT_WHOLE_FRAMES.mobility[track.u<.18?7:track.u<.65?8:9],...track};
  if(track.clip==='land')return {frame:GIANT_WHOLE_FRAMES.mobility[track.u<.55?10:11],...track};
  const frames=GIANT_WHOLE_FRAMES[track.clip==='whirlwind'?'spin':track.clip]||GIANT_WHOLE_FRAMES.cleave;
  return {frame:select(frames,attackTimes,track.u),...track};
}
export function wholeGiantPose(g,time=g.attack?.t??0){
  const sample=wholeGiantFrame(g,time),f=sample.frame,face=g.face||-1;
  // A tiny whole-frame breath keeps the feet planted and never separates limbs.
  const stretch=sample.clip==='idle'?1+Math.sin((g.clock||0)*Math.PI*2/2.8)*.004:1;
  const point=p=>({x:g.x+face*(p[0]-f.anchor[0])*f.scale,y:g.y+(p[1]-f.anchor[1])*f.scale*stretch});
  const origin=point(f.origin),tip=point(f.tip),butt=point(f.butt),angle=Math.atan2(tip.y-origin.y,(tip.x-origin.x)*face);
  return {...sample,stretch,origin,tip,butt,angle,face,reach:Math.hypot(tip.x-origin.x,tip.y-origin.y),
    body:{x:g.x+(face<0?-f.body[0]-f.body[2]:f.body[0]),y:g.y+f.body[1]*stretch,w:f.body[2],h:f.body[3]*stretch}};
}
