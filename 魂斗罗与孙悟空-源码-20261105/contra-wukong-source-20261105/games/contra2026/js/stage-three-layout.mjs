// Measured against the supplied recording, 06:36–08:00: a broad waterfall,
// staggered mossy shelves, two flame bridges, drifting rocks and a summit gate.
import { updateWaterfallArms } from './stage-three-arms.mjs?v=boss-detail-1';
export const STAGE_THREE=Object.freeze({width:384,bottom:176,top:-1526,summit:-1350,stoneLine:-1138});
export const WATERFALL_GATE=Object.freeze({x:42,y:STAGE_THREE.top+20,w:300,h:156});
export const SUMMIT_EXIT=Object.freeze({x:169,y:STAGE_THREE.summit-52,w:46,h:52});

const shelves=[
  [0,176,148,54],[264,176,120,54],
  [96,132,108,30],[232,84,152,42],[132,36,112,34],[0,-12,128,42],
  [144,-60,120,30],[266,-108,118,42],[128,-156,150,34],[0,-204,120,38],
  [108,-252,140,28],[252,-300,132,48],[136,-348,116,34],[0,-396,142,38],
  // Each floating stone bridges a 144px break: even a double jump cannot skip
  // the stone, while the two ~72px jumps have comfortable landing margins.
  [0,-444,116,42],[272,-444,112,42],[272,-492,112,42],
  [140,-636,128,34],[258,-684,126,46],
  [0,-732,108,38],[276,-732,108,38],[0,-780,128,44],[132,-828,116,32],
  [0,-972,132,42],
  [150,-1020,124,32],[260,-1068,124,46],
  [142,-1212,128,40],[250,-1260,134,44],[128,-1308,140,36]
];
export const FLAME_BRIDGES=Object.freeze([
  Object.freeze({x:116,y:-444,w:156,h:8,phase:0}),
  Object.freeze({x:108,y:-732,w:168,h:8,phase:2.25})
]);
export const STAGE_THREE_SNIPERS=Object.freeze([[326,84],[332,-108],[54,-204],[316,-300],[168,-636],[51,-780],[60,-972],[162,-1212]]);
export const STAGE_THREE_TURRETS=Object.freeze([[324,104],[54,-186],[312,-282],[240,-618],[100,-954],[334,-1050],[260,-1194]]);
// The lower-left supply hatch and its neighboring turret occupy separate parts of the shelf.
export const STAGE_THREE_BOXES=Object.freeze([[190,60,'S'],[202,-132,'M'],[60,-420,'k'],[328,-708,'F'],[48,-948,'j'],[208,-1190,'L']]);
export const STAGE_THREE_PODS=Object.freeze([
  {atY:-30,kind:'M',y0:54},{atY:-285,kind:'S',y0:65},{atY:-575,kind:'H',y0:57},
  {atY:-855,kind:'B',y0:62},{atY:-1090,kind:'F',y0:54}
]);

export function createStageThreeSolids(){
  return [
    ...shelves.map(([x,y,w,h],i)=>({x,y,w,h,g:0,cliff:true,id:'cliff-'+i})),
    ...FLAME_BRIDGES.map((p,i)=>({...p,g:0,flameBridge:true,id:'flame-'+i})),
    ...[{x:228,y:-564,w:42,range:40,speed:.72,phase:.4},
        {x:92,y:-900,w:40,range:42,speed:.66,phase:2.1},
        {x:238,y:-1140,w:42,range:42,speed:.8,phase:3.8}]
      .map((p,i)=>({...p,baseX:p.x,baseY:p.y,h:11,g:0,drift:true,id:'drift-'+i})),
    {x:0,y:STAGE_THREE.summit,w:384,h:76,g:0,solid:1,cliff:true,summit:true,id:'summit'}
  ];
}

export function advanceStageThreePlatforms(solids,players,time){
  for(const s of solids){
    if(!s.drift)continue;
    const x=s.baseX+Math.sin(time*s.speed+s.phase)*s.range;
    const y=s.baseY+Math.sin(time*1.2+s.phase)*2.4;
    for(const p of players)if(!p.dead&&p.onGround&&p.support===s){p.x+=x-s.x;p.y+=y-s.y;}
    s.x=x;s.y=y;
  }
}

// The two fires have time to cross, reach opposite ends, and cross again;
// the ember warning and the safe interval remain visible between sweeps.
const FLAME_PERIOD=6.8, FLAME_START=2.3, FLAME_DURATION=4;
const flameCycle=(time,phase=0)=>((time+phase)%FLAME_PERIOD+FLAME_PERIOD)%FLAME_PERIOD;
export function flameJetState(time,phase=0){
  const t=flameCycle(time,phase);
  if(t<1.7)return{phase:'off',height:0};
  if(t<FLAME_START)return{phase:'warning',height:3+Math.sin((t-1.7)*26)};
  if(t<FLAME_START+FLAME_DURATION){const edge=Math.min(1,(t-FLAME_START)/.16,(FLAME_START+FLAME_DURATION-t)/.22);return{phase:'fire',height:edge*(25+Math.sin(t*31)*2)};}
  return{phase:'cooling',height:2};
}
export function flameJetPositions(bridge,time){
  const progress=Math.max(0,Math.min(1,(flameCycle(time,bridge.phase)-FLAME_START)/FLAME_DURATION));
  const offset=.3*Math.cos(progress*Math.PI*2);
  return [bridge.x+bridge.w*(.5-offset),bridge.x+bridge.w*(.5+offset)];
}
export function flameJetBoxes(time){
  return FLAME_BRIDGES.flatMap(bridge=>{
    const fire=flameJetState(time,bridge.phase);
    return fire.phase==='fire'&&fire.height>8?flameJetPositions(bridge,time).map(x=>({x:x-5,y:bridge.y-fire.height,w:10,h:fire.height})):[];
  });
}

export function makeWaterfallBoss(){
  const boss={active:false,dead:false,deadT:0,age:0,open:false,exitOpen:false,fireT:1.4,parts:[
    {mech:1,k:'armL',x:150,y:STAGE_THREE.top+94,w:20,h:20,hp:14,max:14,fireT:1.3,flash:0},
    {mech:1,k:'armR',x:216,y:STAGE_THREE.top+94,w:20,h:20,hp:14,max:14,fireT:2.5,flash:0},
    {mech:1,k:'core',x:181,y:STAGE_THREE.top+65,w:22,h:17,hp:42,max:42,flash:0}
  ]};
  updateWaterfallArms(boss,STAGE_THREE.top);return boss;
}
export const waterfallNodesAlive=boss=>boss.parts.slice(0,2).some(part=>part.hp>0);
export const waterfallMouthOpen=boss=>!waterfallNodesAlive(boss)&&boss.age%3.2>=.65&&boss.age%3.2<2.45;
export const waterfallTargetVulnerable=(part,boss)=>part.hp>0&&(part.k!=='core'||boss.open);

export function canEnterSummit(p,boss){
  return boss.exitOpen&&!p.dead&&!p.summitEntry&&!p.summitEntered&&p.onGround&&
    p.x>=SUMMIT_EXIT.x&&p.x<=SUMMIT_EXIT.x+SUMMIT_EXIT.w&&Math.abs(p.y-STAGE_THREE.summit)<3;
}
export function beginSummitEntry(p){
  p.summitEntry={t:0,x:p.x,y:p.y};
  Object.assign(p,{vx:0,vy:0,spin:false,prone:false,ride:null,hook:null,flashT:0});
}
export function advanceSummitEntry(p,dt){
  const entry=p.summitEntry;if(!entry)return;
  entry.t=Math.min(.8,entry.t+dt);const t=entry.t/.8;
  p.x=entry.x+(192-entry.x)*t;p.y=entry.y-9*t;p.anim+=dt*8;
  if(t>=1){p.summitEntry=null;p.summitEntered=true;}
}
export const teamInsideSummit=(players,lives)=>{const required=players.filter(p=>!p.dead||lives>0);return required.length>0&&required.every(p=>p.summitEntered);};
