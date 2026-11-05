// Route measured against n6gyssv9R_g: 00:14 loading steps, 00:26 armored
// partition, 00:38 two decks, 00:50 stepped guard post, 01:02 cart tunnel,
// 01:14 upper partition, 01:26 pipe hall, then the open gate approach.
export const STAGE_SEVEN_ROUTE=Object.freeze({width:3500,gate:3410,arena:3116});
export const HANGAR_SECTIONS=Object.freeze([
  {id:'loading',x:0,end:480,label:'装卸台阶',style:'steps'},
  {id:'partition',x:480,end:840,label:'装甲隔断',style:'open'},
  {id:'press-line',x:840,end:1390,label:'双层冲压线',style:'press'},
  {id:'guard-post',x:1390,end:1700,label:'阶梯哨站',style:'steps'},
  {id:'cart-tunnel',x:1700,end:2220,label:'矿车运输廊',style:'rail'},
  {id:'upper-lock',x:2220,end:2630,label:'高架封锁区',style:'press'},
  {id:'pipe-hall',x:2630,end:3060,label:'液压管廊',style:'pipe'},
  {id:'gate',x:3060,end:3500,label:'防御大门',style:'open'}
].map(Object.freeze));
export const hangarSectionAt=x=>HANGAR_SECTIONS.find(s=>x>=s.x&&x<s.end)||HANGAR_SECTIONS[x<0?0:HANGAR_SECTIONS.length-1];

// The roof cannot be jumped over. Its 33 px opening clears a ducked rider,
// while the exposed live rails make walking underneath it unsafe.
export const HANGAR_CART_TUNNEL=Object.freeze({
  ground:176,roofBottom:143,railTop:158,
  roofs:Object.freeze([{x:1810,w:115},{x:2025,w:105}].map(Object.freeze)),
  retryStart:1780,retryEnd:2170
});
export const HANGAR_CLIMB=Object.freeze({
  wall:2460,wallWidth:20,top:56,ground:176,
  shelves:Object.freeze([
    {x:2320,y:136,w:140,side:'ascent'},
    {x:2320,y:96,w:140,side:'ascent'},
    {x:2320,y:56,w:180,side:'crown'},
    {x:2480,y:96,w:60,side:'descent'},
    {x:2480,y:136,w:116,side:'descent'}
  ].map(Object.freeze))
});

// Ground slabs join without pits. Their raised fronts are solid, so the
// changing silhouette also changes the route the player has to traverse.
const ground=[
  [0,180,176],[180,330,152],[330,480,176],[480,610,152],
  [610,840,176],[840,1390,176],[1390,1510,152],[1510,1600,128],
  [1600,1700,152],[1700,2220,176],[2220,2630,176],
  [2630,2720,152],[2720,3060,176],[3060,3500,176]
];
const decks=[
  [225,112,85],[485,104,110],
  [875,112,410],[1350,136,65],[1450,96,65],[1550,88,55]
];
export function createStageSevenSolids(){
  return [
    ...ground.map(([x,end,y],i)=>({id:'hangar-ground-'+i,x,y,w:end-x,h:216-y,g:1,railing:y<176})),
    ...decks.map(([x,y,w],i)=>({id:'hangar-deck-'+i,x,y,w,h:14,g:0,railing:true})),
    ...HANGAR_CART_TUNNEL.roofs.map(({x,w},i)=>({id:'hangar-ceiling-'+i,x,y:0,w,h:HANGAR_CART_TUNNEL.roofBottom,g:0,solid:1,ceiling:true,cartRoof:true})),
    ...HANGAR_CLIMB.shelves.map((s,i)=>({id:'hangar-climb-'+i,...s,h:8,g:0,railing:true,hangarClimb:true,...(s.side==='crown'?{solid:1,oneWayTop:true}:{})})),
    {id:'hangar-climb-wall',x:HANGAR_CLIMB.wall,y:HANGAR_CLIMB.top,w:HANGAR_CLIMB.wallWidth,h:HANGAR_CLIMB.ground-HANGAR_CLIMB.top,g:0,solid:1,climbWall:true}
  ];
}

export const HANGAR_IRON_PLATES=Object.freeze([{x:690,y:176},{x:2260,y:176}].map(Object.freeze));
export const HANGAR_CART_DEPOTS=Object.freeze([
  {id:'loading-cart',at:80,x:390,y:176,vx:-28,end:610},
  {id:'tunnel-cart',at:1450,x:1716,y:176,vx:0,end:2220}
].map(Object.freeze));
export const HANGAR_SNIPERS=Object.freeze([[290,112],[585,104],[1060,112],[1530,128],[1960,176],[2565,136],[2990,176]].map(Object.freeze));
export const HANGAR_BOXES=Object.freeze([[340,'y'],[1490,'a'],[1670,'S'],[2585,'L']].map(Object.freeze));
export const HANGAR_PODS=Object.freeze([
  {at:120,kind:'M',y0:66},{at:520,kind:'S',y0:66},{at:950,kind:'y',y0:58},
  {at:1440,kind:'B',y0:62},{at:1750,kind:'M',y0:120},{at:1950,kind:'H',y0:120},
  {at:2250,kind:'a',y0:62},{at:2540,kind:'L',y0:70},{at:2810,kind:'F',y0:70},{at:3020,kind:'R',y0:62}
].map(Object.freeze));
export const HANGAR_ENCOUNTERS=Object.freeze([
  {at:160,units:[[360,176],[383,176]]},
  {at:900,units:[[1120,112],[1145,112]]},
  {at:1400,units:[[1620,152],[1642,152],[1664,152]]},
  {at:1820,units:[[2040,176],[2065,176]]},
  {at:2700,units:[[2920,176],[2945,176]]}
].map(q=>Object.freeze({...q,units:Object.freeze(q.units.map(Object.freeze))})));

export const HANGAR_PRESSES=Object.freeze([
  // A short introductory pair above the loading shelf.
  {x:260,top:24,floor:112,per:4.6,off:0},{x:300,top:24,floor:112,per:4.6,off:1.5},
  // Different rhythms above and below the long deck; the lower passage is
  // a real alternative, rather than a second copy of the upper line.
  ...[950,1010,1070].map((x,i)=>({x,top:24,floor:112,per:3.8,off:i*.65})),
  ...[1170,1240].map((x,i)=>({x,top:128,floor:176,per:4.8,off:i*2.4,warn:.75})),
  {x:2145,top:128,floor:176,per:5.1,off:.4,warn:.9},
  {x:2300,top:28,floor:176,per:4.1,off:.6},
  // The pipe hall is one travelling wave, with a longer clear interval.
  ...[2780,2835,2890].map((x,i)=>({x,top:56,floor:176,per:5.4,off:-i*.65,warn:.85}))
].map(Object.freeze));

export function hangarPressState(q,time){
  const warn=q.warn??.55,idle=q.idle??1.25,drop=.2,hold=.5,rise=.8;
  const u=((time+q.off)%q.per+q.per)%q.per;
  if(u<idle)return {st:'idle',k:0};
  if(u<idle+warn)return {st:'warn',k:0};
  if(u<idle+warn+drop)return {st:'slam',k:(u-idle-warn)/drop};
  if(u<idle+warn+drop+hold)return {st:'hold',k:1};
  if(u>=idle+warn+drop+hold+rise)return {st:'idle',k:0};
  return {st:'rise',k:Math.max(0,1-(u-idle-warn-drop-hold)/rise)};
}

export function hangarPressBottom(q,k=q.k||0){
  return q.top+12+(q.floor-q.top-12)*Math.max(0,Math.min(1,k));
}

/** Only the descending face crushes: the shaft and a stationary or retracting
 * head can be touched. Sweep the tip so a fast stroke cannot skip a player. */
export function hangarPressCrushBox(q,previousK){
  const from=hangarPressBottom(q,previousK),to=hangarPressBottom(q);
  return to>from+.001?{x:q.x-8,y:from,w:16,h:to-from}:null;
}
