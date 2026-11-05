// Host-owned South Gate campaign. Plain objects and hit references survive packWorld.
import {KING_ATLAS} from './wukong-stage-two-atlas.mjs';
import {segmentBoxTime} from './wukong-combat.mjs';
export const ROOM_NAMES=Object.freeze({bridge:'登云桥',hub:'天门前庭',wind:'巨弩风阵',thunder:'回雷灵阵',armor:'镇甲力阵',gate:'南天门',boss:'天王台'});
export const ROOM_WIDTHS=Object.freeze({bridge:768,hub:768,wind:1152,thunder:768,armor:1152,gate:384,boss:768});
export const SEALS=Object.freeze(['wind','thunder','armor']);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const part=(id,x,y,w=18,h=24,hp=6)=>({siege:id,k:'siege',x,y,w,h,hp,max:hp,flash:0,lastHit:-10});
const guard=(x,y=176,hp=6)=>({t:'snp',x,y,hp,maxHp:hp,fireT:99,face:-1,ax:-1,ay:0,flash:0});
export const sealedCount=G=>G.siege.cleared.length;
export const counterWindow=G=>G.siege.cleared.includes('armor')?4:3;
export function kingFrame(G){
  const k=G.boss.king,a=k?.attack;if(!k)return null;
  const index=G.boss.dead?11:a?{sweep:a.t<a.windup?2:a.t<a.windup+a.strike?4:2,
    cleave:a.t<a.windup?5:a.t<a.windup+a.strike?6:7,wind:a.t<a.windup?8:9}[a.kind]:k.flash>0?10:Math.floor(k.time*.65)%2;
  return KING_ATLAS.frames[index];
}
export function kingSword(G){
  const k=G.boss.king,f=kingFrame(G);if(!f)return null;
  const mirror=k.face===KING_ATLAS.face?1:-1,point=p=>({x:k.x+(p[0]-f.anchor[0])*KING_ATLAS.scale*mirror,y:176+(p[1]-f.anchor[1])*KING_ATLAS.scale});
  return {origin:point(f.sword.butt),tip:point(f.sword.tip)};
}
export function createState(){return {room:'bridge',cleared:[],claimed:[],clock:0,epoch:0,checkpoint:'bridge',checkpointX:48,gateOpen:false,allReward:false,doorT:{},saved:{},orbs:[],devices:[],notices:{},message:'登云桥 · 前往天门前庭',messageT:5};}
export function roomSolids(id,gateOpen=false){
  const width=ROOM_WIDTHS[id],out=[{x:0,y:176,w:width,h:40,g:1}];
  const ledges=id==='bridge'?[[170,144,100],[340,118,110],[520,144,100]]:
    id==='wind'?[[190,142,100],[340,112,110],[520,138,100],[680,128,120]]:
    id==='armor'?[[220,144,100],[380,120,120],[530,120,110],[710,144,90]]:
    id==='thunder'?[[120,148,90],[360,112,100]]:id==='hub'?[[310,126,145]]:[];
  for(const [x,y,w]of ledges)out.push({x,y,w,h:8,g:0});
  if(id==='gate'&&!gateOpen)out.push({x:260,y:0,w:18,h:176,g:1,solid:true,siegeGate:true});
  return out;
}
function roomDevices(id){
  if(id==='wind')return [part('aim',815,145,20,28,999),part('fire',910,145,20,28,999)];
  if(id==='armor')return [part('lock-left',565,93,20,28),part('lock-right',785,145,20,28),part('hammer',945,145,20,28,999)];
  if(id==='gate')return [part('gate',229,124,26,52,12)];
  return [];
}
function savePlayers(G,actors){
  const state=G.siege;
  for(const p of actors)state.saved[p.pid||1]={weapon:p.weapon,rapid:p.rapid,inv:[...(p.pid===2?G.inv2||[]:G.inv||[])]};
}
export function claimSupply(G,p,id,inventory){
  const s=G.siege;if(!s.claimed.includes(id))s.claimed.push(id);
  s.saved[p.pid||1]={weapon:p.weapon,rapid:p.rapid,inv:[...inventory]};
}
export function enterRoom(G,id,actors,hooks={},spawnX=48,{retry=false}={}){
  const s=G.siege;s.room=id;s.epoch++;s.doorT={};s.doorArmed=false;s.orbs=[];s.devices=roomDevices(id);s.timer=1.8;s.captured=false;s.aim=0;s.hammerT=0;s.returnHits=0;s.shotT=0;s.pendingSeal=null;s.lightning=null;
  if(s.cleared.includes(id))for(const device of s.devices)device.hp=0;
  s.solids=roomSolids(id,s.gateOpen);s.checkpoint=id;s.checkpointX=spawnX;s.message=ROOM_NAMES[id];s.messageT=3;
  G.pb=[];G.eb=[];G.gr=[];G.fx=[];G.en=[];G.pods=[];G.podTrig=[];G.items=[];G.spawnT=99999;G.camX=0;G.camY=0;
  delete G.wukongFlights;delete G.wukongSupplies;delete G.hitStop;delete G.hitStopInputs;
  G.boss={active:false,dead:false,deadT:0,parts:[{hp:0},{hp:0},{hp:0,max:0}]};
  const squads={bridge:[guard(270),guard(470,118),guard(650)],wind:[guard(250),guard(490),guard(720,128),guard(865,176,8)],armor:[guard(310,176,8),guard(570,120),guard(790)],thunder:[guard(280)]};
  if(!s.cleared.includes(id))G.en=squads[id]||[];
  if(actors.length>1&&['wind','armor','bridge'].includes(id)&&!s.cleared.includes(id))G.en.push(guard(ROOM_WIDTHS[id]-180));
  for(const p of actors){
    if(p.dead)continue;
    const saved=s.saved[p.pid||1];
    Object.assign(p,{x:clamp(spawnX+((p.pid||1)-1)*22,12,ROOM_WIDTHS[id]-12),y:176,vx:0,vy:0,onGround:true,support:null,staff:null,staffCharge:null,staffThrows:[],staffWaves:[],hurt:null,spin:false,prone:false,inWater:false,wet:false,enteringExit:false,exitEntered:false,invT:1.6});
    if(retry&&saved){p.weapon=saved.weapon;p.rapid=saved.rapid;if(p.pid===2){G.inv2=[...saved.inv];G.sel2=clamp(G.sel2||0,0,Math.max(0,G.inv2.length-1));}else{G.inv=[...saved.inv];G.sel=clamp(G.sel||0,0,Math.max(0,G.inv.length-1));}}
    p.magic=undefined;p.ride=null;p.rideT=0;p.transformation=undefined;
  }
  if(id==='hub'&&!s.notices.healed){s.notices.healed=true;for(const p of actors)if(!p.dead)p.hp=p.maxHp;}
  if(id==='boss'){
    for(const p of actors)if(!p.dead)p.hp=p.maxHp;
    const hp=actors.length>1?270:180;
    G.boss={active:true,dead:false,deadT:0,parts:[{hp:0},{hp:0},{...part('king',600,102,34,74,hp),k:'core'}],king:{x:620,y:176,face:-1,time:0,cooldown:1,turn:0,phase:1,attack:null,flash:0}};
    G.en=[];
  }
  if(!retry)savePlayers(G,actors);
  const supplies={bridge:[['M',380,114]],hub:[['healPeach',120,172]],wind:[['L',560,134]],thunder:[['B',390,108]],armor:[['transform',430,116]]};
  for(const [i,[kind,x,y]]of (supplies[id]||[]).entries())if(!s.claimed.includes(id+'-'+i))G.items.push({kind,x,y,rest:true,landed:true,fromPod:true,siegeSupply:id+'-'+i});
  hooks.onRoom?.(id);hooks.onTell?.(id==='hub'?'破任意两阵开门 · 侧门前按住 ↑ 进入':id==='boss'?'增长天王 · 看准重劈，拔剑时连击':ROOM_NAMES[id],3);
}
export function init(G,actors,hooks={}){G.siege=createState();enterRoom(G,'bridge',actors,hooks);}
export function retryRoom(G,actors,hooks={}){const s=G.siege;enterRoom(G,s.checkpoint,actors,hooks,s.checkpointX,{retry:true});}
export function doors(G){
  const s=G.siege,id=s.room,w=ROOM_WIDTHS[id];
  const door=(x,to,label,locked=false)=>({x,y:176,to,label,locked});
  if(id==='bridge')return [door(w-42,'hub','天门前庭')];
  if(id==='hub')return [door(235,'wind','夺弩'),door(395,'thunder','回雷'),door(555,'armor','放锤'),door(720,'gate',sealedCount(G)>=2?'破开主门':'需破两阵',sealedCount(G)<2)];
  if(id==='gate')return [door(35,'hub','返回前庭'),door(340,'boss','天王台',!s.gateOpen||sealedCount(G)<2)];
  if(id==='boss')return G.boss.dead&&G.boss.deadT<=0?[door(w-40,'finish','进入天门')]:[];
  return [door(34,'hub','返回前庭'),...(s.cleared.includes(id)?[door(w-55,'hub','回庭近路')]:[])];
}
export function objective(G){
  const s=G.siege,n=sealedCount(G);
  if(s.room==='bridge')return '登云桥 · 到门前按住 ↑ 前往前庭';
  if(s.room==='hub')return n<2?`破护门阵 ${n}/2 · 自选侧门，按住 ↑ 进入`:n===3?'三阵全破 · 前往主门':'主门可破 · 第三阵可选';
  if(s.room==='wind')return s.cleared.includes('wind')?'风阵已破 · 从近路返回':!s.captured?'夺下巨弩 · 击退弩台守军':`棍击拨杆换向（${s.aim+1}/3）· 中档瞄准 · 右侧金扣发弩`;
  if(s.room==='thunder')return s.cleared.includes('thunder')?'雷阵已破 · 从近路返回':`挥棍回雷 ${s.returnHits}/3 · 棍身接触雷珠即可返射`;
  if(s.room==='armor')return s.cleared.includes('armor')?'力阵已破 · 天王反击窗口 +1秒':s.devices.slice(0,2).some(p=>p.hp>0)?'上下两处锁扣 · 棍击破锁，再敲金扣放锤':'双锁已断 · 右侧止动扣挥棍放锤';
  if(s.room==='gate')return s.gateOpen?'主门已开 · 按住 ↑ 进入天王台':'封印已松 · 挥棍击破门闩';
  return G.boss.dead?'天王败退 · 进入右侧天门完成第二关':`增长天王 · 重劈后可反击 ${counterWindow(G)} 秒`;
}
function clearSeal(G,id,actors,hooks){
  const s=G.siege;if(s.cleared.includes(id))return;
  s.cleared.push(id);for(const p of s.devices)p.hp=0;s.orbs=[];s.checkpoint='hub';s.checkpointX={wind:235,thunder:395,armor:555}[id];savePlayers(G,actors);
  hooks.onScore?.(1500);hooks.onImpact?.('seal',ROOM_WIDTHS[id]-120,132);
  hooks.onTell?.(`${ROOM_NAMES[id]}已破 · ${sealedCount(G)>=2?'主门可破，第三阵可选':'再破一阵即可开门'}`,3);
  if(sealedCount(G)===3&&!s.allReward){s.allReward=true;hooks.onScore?.(3000);}
}
export function targets(G){
  const s=G.siege;if(!s)return [];
  if(s.room==='boss')return G.boss.dead?[]:[G.boss.parts[2]];
  const devices=s.devices.filter(p=>p.hp>0&&(p.siege!=='hammer'||s.devices.slice(0,2).every(p=>p.hp<=0))&&(s.room!=='wind'||s.captured)&&(p.siege!=='gate'||sealedCount(G)>=2));
  return [...devices,...s.orbs.filter(o=>!o.dead&&!o.reflected&&o.siege==='orb')];
}
export function hit(G,target,damage,shot,actors,hooks={}){
  const s=G.siege;if(!s||target.hp<=0)return false;
  if(target.siege==='king'){
    if(s.room!=='boss'||sealedCount(G)<2||!s.gateOpen||G.boss.dead)return false;
    target.hp=Math.max(0,target.hp-damage);target.flash=.12;G.boss.king.flash=.12;
    hooks.onImpact?.(shot?.heavy?'heavy':'hit',shot?.x??G.boss.king.x,shot?.y??140);
    if(target.hp===0){G.boss.dead=true;G.boss.deadT=2;G.boss.king.attack=null;s.orbs=[];G.eb=[];hooks.onScore?.(12000);hooks.onTell?.('增长天王败退 · 天门已开',3);}
    return true;
  }
  if(target.siege==='orb'){
    if(target.reflected)return false;
    target.reflected=true;target.vx=Math.abs(target.vx)*1.65;target.hp=0;target.owner=shot?.owner||1;hooks.onImpact?.('reflect',target.x+12,target.y+12);return true;
  }
  const actor=actors.find(p=>(p.pid||1)===(shot?.owner||1)&&!p.dead);
  if(['aim','fire','hammer'].includes(target.siege)){
    if(['aim','fire'].includes(target.siege)&&!s.captured)return false;
    if(!actor||Math.abs(actor.x-target.x-target.w/2)>42)return false;
    const nearest=s.devices.filter(p=>['aim','fire','hammer'].includes(p.siege)&&p.hp>0).sort((a,b)=>Math.abs(a.x+a.w/2-actor.x)-Math.abs(b.x+b.w/2-actor.x))[0];
    if(nearest!==target||!actor.staff||shot?.k!=='staff'||target.lastAction===actor.staff)return false;
    target.lastHit=s.clock;target.lastAction=actor.staff;
    if(target.siege==='aim'){s.aim=(s.aim+1)%3;hooks.onTell?.(`巨弩第 ${s.aim+1} 档 · ${s.aim===1?'已对准阵眼，向右敲金扣发弩':'继续击打拨杆换向'}`,2);}
    else if(target.siege==='fire'){
      s.shotT=.6;
      if(s.aim===1){s.pendingSeal='wind';hooks.onTell?.('破阵弩离弦',1);}else hooks.onTell?.('弩箭撞在外盾 · 拨杆转到中档再试',2);
    }else if(s.devices.slice(0,2).every(p=>p.hp<=0)&&!s.hammerT){s.hammerT=1;hooks.onTell?.('攻城锤释放 · 退开摆动范围',1.5);}
    return true;
  }
  if(target.siege==='gate'&&sealedCount(G)<2)return false;
  target.hp=Math.max(0,target.hp-damage);target.flash=.15;hooks.onImpact?.('hit',target.x+target.w/2,target.y+target.h/2);
  if(target.siege==='gate'&&target.hp===0){s.gateOpen=true;for(const q of s.solids)if(q.siegeGate)q.gone=true;savePlayers(G,actors);hooks.onTell?.('门闩已断 · 南天门开启',3);}
  return true;
}
function spawnOrb(s,x,y,vx,kind='orb'){const o={...part(kind,x-12,y-12,24,24,1),vx,reflected:false,dead:false,life:12,hits:[]};s.orbs.push(o);return o;}
function advanceKing(G,actors,dt,hooks){
  const s=G.siege,B=G.boss,k=B.king,core=B.parts[2];if(B.dead){B.deadT=Math.max(0,B.deadT-dt);return;}
  const alive=actors.filter(p=>!p.dead);if(!alive.length)return;
  const target=alive.reduce((a,b)=>Math.abs(a.x-k.x)<Math.abs(b.x-k.x)?a:b);
  k.time+=dt;k.flash=Math.max(0,k.flash-dt);k.phase=core.hp<=core.max*.5?2:1;
  let a=k.attack;
  if(!a){
    k.face=target.x<k.x?-1:1;k.cooldown=Math.max(0,k.cooldown-dt);
    if(Math.abs(target.x-k.x)>115){k.x=clamp(k.x+k.face*52*dt,70,ROOM_WIDTHS.boss-70);}
    if(k.cooldown<=0&&Math.abs(target.x-k.x)<230){
      const order=k.phase===2?['sweep','cleave','wind','cleave']:['sweep','cleave','wind'],kind=order[k.turn++%order.length],windup={sweep:.9,cleave:1.2,wind:1}[kind];
      k.attack=a={kind,t:0,windup,strike:kind==='wind'?(s.cleared.includes('wind')?.3:1.9):kind==='cleave'?.18:.25,recovery:kind==='cleave'?counterWindow(G):kind==='wind'?2:1.4,face:k.face,aimX:target.x,startX:k.x,hits:[],waves:0,thunder:false};
      hooks.onTell?.(kind==='cleave'?'天王举剑 · 离开落点，拔剑时连击':kind==='sweep'?'低位横扫 · 跳过剑锋':'青锋风刃 · 看准波头起跳',windup);
    }
  }else{
    a.t+=dt;if(a.kind==='cleave'&&a.t<.35)a.aimX=clamp(target.x,32,736);
    if(a.kind==='cleave'&&a.t>=.35&&a.t<a.windup){
      const f=KING_ATLAS.frames[6],mirror=a.face===KING_ATLAS.face?1:-1,offset=(f.sword.tip[0]-f.anchor[0])*KING_ATLAS.scale*mirror;
      const end=clamp(a.aimX-offset,60,708),u=clamp((a.t-.35)/(a.windup-.35),0,1);k.x=a.startX+(end-a.startX)*u;
    }else if(a.kind==='sweep'&&a.t<a.windup&&Math.abs(k.x-target.x)>50)k.x=clamp(k.x+a.face*58*dt,60,708);
    if(a.kind==='wind'){
      const count=s.cleared.includes('wind')?1:3;
      while(a.waves<count&&a.t>=a.windup+a.waves*.8){const i=a.waves++;spawnOrb(s,k.x+a.face*30,i===1?120:163,a.face*125,'wind-wave');}
    }
    if(a.kind==='cleave'&&!s.cleared.includes('thunder')&&!a.thunder&&a.t>=a.windup+.4){a.thunder=true;s.lightning={x:a.aimX,t:.2,hits:[]};}
    if(a.t>=a.windup+a.strike+a.recovery){k.attack=null;k.cooldown=.5;}
  }
  Object.assign(core,{x:k.x-17,y:102,w:34,h:74});
}
export function advance(G,actors,inputs,dt,hooks={}){
  const s=G.siege;s.clock+=dt;s.messageT=Math.max(0,s.messageT-dt);if(s.messageT<=0)s.message=objective(G);
  for(const p of s.devices)p.flash=Math.max(0,p.flash-dt);
  if(G.freezeT<=0){
    if(s.room==='boss')advanceKing(G,actors,dt,hooks);
    if(['bridge','thunder'].includes(s.room)&&!s.cleared.includes(s.room)){
      s.timer-=dt;const x=s.room==='bridge'?570:650;
      if(s.timer<=0&&x<G.camX+380&&x>G.camX&&actors.some(p=>!p.dead&&Math.abs(p.x-x)<360)){s.timer=3.5;spawnOrb(s,x,148,-70);}
    }
    for(const o of s.orbs){
      if(o.dead)continue;o.x+=o.vx*dt;o.life-=dt;
      if(o.reflected&&o.x>=((s.room==='bridge'?570:650)-16)){
        o.dead=true;
        if(s.room==='thunder'&&!s.cleared.includes('thunder')){s.returnHits++;hooks.onImpact?.('reflect',650,148);hooks.onTell?.(`回雷命中 ${s.returnHits}/3`,1.5);if(s.returnHits>=3)clearSeal(G,'thunder',actors,hooks);}
      }
      if(o.x<-40||o.x>ROOM_WIDTHS[s.room]+40||o.life<=0)o.dead=true;
    }
  }
  s.orbs=s.orbs.filter(o=>!o.dead);
  if(s.lightning){s.lightning.t-=dt;if(s.lightning.t<=0)s.lightning=null;}
  if(s.room==='wind'&&!s.captured&&!s.cleared.includes('wind')&&G.en.every(e=>e.dead||e.x<650)){s.captured=true;hooks.onTell?.('巨弩已夺下 · 左拨杆调到中档，右金扣发弩',4);}
  if(s.shotT>0){s.shotT=Math.max(0,s.shotT-dt);if(s.shotT<=0&&s.pendingSeal){clearSeal(G,s.pendingSeal,actors,hooks);s.pendingSeal=null;}}
  if(s.hammerT>0){s.hammerT=Math.max(0,s.hammerT-dt);if(s.hammerT<=0)clearSeal(G,'armor',actors,hooks);}
  const available=doors(G),alive=actors.filter(p=>!p.dead);
  if(actors.every(p=>!inputs[p.pid||1]?.up))s.doorArmed=true;
  for(const p of actors){
    const I=inputs[p.pid||1]||{},door=available.find(d=>Math.abs(p.x-d.x)<23&&Math.abs(p.y-d.y)<12);
    const key=p.pid||1,ready=s.doorArmed&&door&&!door.locked&&p.onGround&&I.up&&!I.fire&&!p.staff&&!p.staffCharge?.active&&!p.hurt;
    s.doorT[key]=ready?(s.doorT[key]||0)+dt:0;
    if(s.doorT[key]>=.25){
      if(alive.some(q=>Math.abs(q.x-door.x)>85)){s.message='等待同伴靠近同一扇门';s.messageT=1;continue;}
      if(door.to==='finish'){hooks.onFinish?.();return;}
      const from=s.room,spawn=door.to==='hub'?({wind:235,thunder:395,armor:555,gate:680}[from]||48):48;
      enterRoom(G,door.to,actors,hooks,spawn);return;
    }
  }
}
export function playerHit(G,p,box){
  const s=G.siege;if(!s||p.dead||p.invT>0||G.freezeT>0)return null;
  for(const o of s.orbs)if(!o.dead&&!o.reflected&&!o.hits.includes(p)&&overlaps(o,box)){o.hits.push(p);o.dead=true;return {damage:o.siege==='orb'?12:18,face:Math.sign(o.vx),x:o.x,y:o.y};}
  const k=G.boss.king,a=k?.attack;
  if(a&&a.t>=a.windup&&a.t<a.windup+a.strike&&!a.hits.includes(p)){
    const sword=a.kind==='wind'?null:kingSword(G);
    if(sword&&segmentBoxTime(sword.origin,sword.tip,box,5)!==null){a.hits.push(p);return {damage:a.kind==='cleave'?30:20,heavy:true,face:a.face,x:p.x,y:p.y-18};}
  }
  const l=s.lightning;if(l&&!l.hits.includes(p)&&overlaps(box,{x:l.x-20,y:42,w:40,h:134})){l.hits.push(p);return {damage:18,heavy:true,face:p.x<l.x?-1:1,x:l.x,y:box.y};}
  return null;
}
export function inspect(G){const s=G.siege;return s?{room:s.room,name:ROOM_NAMES[s.room],width:ROOM_WIDTHS[s.room],checkpoint:s.checkpoint,cleared:[...s.cleared],gateUnlocked:sealedCount(G)>=2,gateOpen:s.gateOpen,counterWindow:counterWindow(G),objective:objective(G),captured:s.captured,aim:s.aim,returnHits:s.returnHits,devices:s.devices.map(p=>({kind:p.siege,x:p.x,y:p.y,hp:p.hp})),orbs:s.orbs.map(o=>({kind:o.siege,x:o.x,y:o.y,reflected:o.reflected})),doors:doors(G)}:null;}
