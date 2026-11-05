import {advanceStaff,resolveStaff,STAFF_VARIANTS,staffGeometry} from './wukong-combat.mjs';
import {navigateGuard} from './wukong-navigation.mjs';
import {beginTransformation,resolveTransformation} from './wukong-transform.mjs';

export const WUKONG_MAGIC=Object.freeze({
  arms:{name:'三头六臂',short:'六臂',glyph:'臂',duration:12,color:'#f4c974',description:'三头六臂 12 秒 · 三根金箍棒同时近战'},
  clone:{name:'身外身',short:'分身',glyph:'影',duration:12,count:2,size:.85,speed:112,color:'#a3e8ee',description:'身外身 12 秒 · 两个分身自动挥棍助战'},
  troop:{name:'猴子猴孙',short:'猴群',glyph:'猴',duration:10,count:6,size:.52,speed:142,color:'#e9d598',description:'猴子猴孙 10 秒 · 六只小猴自动寻敌助战'},
  transform:{name:'七十二变',short:'变化',glyph:'变',duration:18,color:'#aee9df',description:'七十二变 18 秒 · L 切换鹏 / 虎 / 龟，J 攻击；玄龟 ↓ 蓄守反震'}
});
export const WUKONG_MAGIC_NAMES=Object.freeze(Object.fromEntries(Object.entries(WUKONG_MAGIC).map(([key,item])=>[key,item.name])));
export const WUKONG_MAGIC_SHORT=Object.freeze(Object.fromEntries(Object.entries(WUKONG_MAGIC).map(([key,item])=>[key,item.short])));
export const WUKONG_MAGIC_STAGE=Object.freeze(Object.fromEntries(Object.keys(WUKONG_MAGIC).map(key=>[key,1])));
// Extra peach types unlock here, then share the randomized single-fairy schedule.
export const WUKONG_MAGIC_DROPS=Object.freeze([
  {at:260,kind:'arms',y0:76},{at:1120,kind:'clone',y0:72},{at:2180,kind:'troop',y0:74},{at:2470,kind:'transform',y0:68}
]);

function safeFloor(solids,x,y){
  return solids.find(s=>!s.gone&&!s.water&&!s.wall&&!s.bridge?.armed&&Math.abs(s.y-y)<1&&x>=s.x+6&&x<=s.x+s.w-6);
}
function recall(unit,owner,solids){
  if(owner.inWater)return false;
  const floor=safeFloor(solids,owner.x,owner.y)||solids.filter(s=>!s.gone&&!s.water&&!s.wall&&!s.bridge?.armed&&
    s.y>=owner.y&&s.y-owner.y<190&&owner.x>=s.x-60&&owner.x<=s.x+s.w+60&&s.w>=18)
    .sort((a,b)=>Math.max(a.x-owner.x,0,owner.x-a.x-a.w)-Math.max(b.x-owner.x,0,owner.x-b.x-b.w)||a.y-b.y)[0];
  if(!floor)return false;
  const desired=owner.x-owner.face*(14+unit.index*9);
  unit.x=Math.max(floor.x+7,Math.min(floor.x+floor.w-7,desired));unit.y=Math.min(owner.y,floor.y);
  unit.vx=unit.vy=0;unit.on=unit.onGround=unit.y===floor.y;unit.guardJump=null;unit.waiting=false;unit.recallT=.3;unit.staff=null;
  return true;
}
export function clearWukongMagic(p){delete p.magic;if(p.staff)delete p.staff.armHits;}
export function activateWukongMagic(p,kind,solids=[]){
  const spec=WUKONG_MAGIC[kind];
  if(!spec||p.dead||p.dive||p.enteringExit||p.exitEntered)return false;
  if(kind==='transform')return beginTransformation(p);
  const effect={remaining:spec.duration,t:0};
  if(spec.count)effect.units=Array.from({length:spec.count},(_,index)=>{
    const unit={summonKind:kind,owner:p.pid||1,index,heroFrames:!!p.heroFrames,magicScale:spec.size,x:p.x,y:p.y,vx:0,vy:0,face:p.face||1,
      on:false,onGround:false,waiting:true,anim:index*1.7,clock:index*.11,ax:p.face||1,ay:0,cool:index*.075,
      staffCombo:0,staffComboT:0,jumpCd:index*.08,weapon:kind==='clone'?p.weapon||'rifle':'rifle',rapid:!!p.rapid};
    recall(unit,p,solids);return unit;
  });
  (p.magic??={})[kind]=effect;return true;
}
export function multiArmActors(p){
  if(!p.magic?.arms||p.dead||p.prone||p.dive||p.enteringExit||p.exitEntered)return [];
  const size=p.giantT>0?2:1,face=p.staff?.face||p.face||1,a=p.staff;
  return [0,1].map(index=>{
    const source=STAFF_VARIANTS.indexOf(a?.variant),variant=STAFF_VARIANTS[((source<0?0:source)+4+index*5)%STAFF_VARIANTS.length];
    const staff=a&&a.kind!=='ultimate'?{...a,variant,kind:'sweep',hits:a.armHits?.[index]||[],beatHits:a.armBeatHits?.[index],
      weapon:a.weapon==='spread'?'rifle':a.weapon}:null;
    return {...p,magic:undefined,x:p.x+face*(index?1:-2)*size,y:p.y+(index?4.5:-5.5)*size,staff,
      weapon:p.weapon==='spread'?'rifle':p.weapon};
  });
}

function targets(unit,owner,{enemies,parts,enemyBox,camera,width}){
  const list=[];
  for(const enemy of enemies){
    if(enemy.dead||enemy.hp<=0||enemy.t==='beam'||enemy.t==='box'&&!enemy.open)continue;
    const box=enemyBox(enemy),x=box.x+box.w/2,y=box.y+box.h;
    if(x<camera-18||x>camera+width+18||Math.abs(x-owner.x)>180||Math.abs(y-owner.y)>110)continue;
    list.push({target:enemy,x,y,box,distance:Math.abs(x-unit.x)+Math.abs(y-unit.y)*.6});
  }
  for(const part of parts)if(part.hp>0){
    const box=part.hitBox||part,x=box.x+box.w/2,y=box.y+box.h;
    if(x>=camera-18&&x<=camera+width+18&&Math.abs(x-owner.x)<180)list.push({target:part,x,y,box,distance:Math.abs(x-unit.x)+Math.abs(y-unit.y)*.6});
  }
  list.sort((a,b)=>a.distance-b.distance);
  if(!list.length){unit.target=null;return null;}
  // Commit to a live target. Re-sorting into a different rank every frame made
  // neighbouring monkeys change direction instead of reaching their opponent.
  const held=list.find(candidate=>candidate.target===unit.target);if(held)return held;
  const selected=list[unit.summonKind==='troop'?unit.index%Math.min(3,list.length):0];
  unit.target=selected.target;return selected;
}
function walk(unit,owner,target,dt,world){
  const spec=WUKONG_MAGIC[unit.summonKind],size=unit.magicScale;
  const flank=unit.index%2?1:-1,desired=target?target.x+flank*(17*size+target.box.w*.5):owner.x-owner.face*(kindSpacing(unit));
  const dx=desired-unit.x;
  const gapX=target?Math.max(target.box.x-unit.x,0,unit.x-target.box.x-target.box.w):Infinity;
  const gripY=unit.y-18*size,gapY=target?Math.max(target.box.y-gripY,0,gripY-target.box.y-target.box.h):Infinity;
  const close=gapX<32*size+6&&gapY<26*size+6;
  const holding=!!unit.staff&&close&&(Math.abs(dx)<5||unit.blocked||unit.edgeHold);
  if(!unit.guardJump||unit.on)unit.vx=holding||Math.abs(dx)<4?0:Math.sign(dx)*spec.speed;
  if(target)unit.face=target.x<unit.x?-1:1;else if(unit.vx)unit.face=Math.sign(unit.vx);
  if(unit.on&&target&&target.y<unit.y-18&&Math.abs(target.x-unit.x)<66&&unit.jumpCd<=0){
    unit.vy=-255;unit.on=false;unit.guardJump={vx:unit.vx};unit.jumpCd=.9;
  }
  const stop=navigateGuard(unit,{x:desired,y:target?.y??owner.y},world.solids,dt,{holding,gravity:700,maxFall:360});
  unit.edgeHold=stop;
  if(stop)unit.vx=0;
  const x0=unit.x;unit.x+=unit.vx*dt;
  unit.blocked=false;
  const half=4*size;
  for(const s of world.solids){
    if(s.gone||!s.g||unit.y<=s.y+.5)continue;
    if(unit.x+half>s.x&&unit.x-half<s.x+s.w){
      if(x0+half<=s.x+.5){unit.x=s.x-half;unit.blocked=true;}
      else if(x0-half>=s.x+s.w-.5){unit.x=s.x+s.w+half;unit.blocked=true;}
    }
  }
  unit.vy=Math.min(360,unit.vy+700*dt);
  const from=unit.y;unit.y+=unit.vy*dt;unit.on=false;
  if(unit.vy<0)for(const s of world.solids){
    if(s.gone||!s.g||!s.h||unit.x+half<=s.x||unit.x-half>=s.x+s.w)continue;
    const ceiling=s.y+s.h;
    if(from-26*size>=ceiling-.001&&unit.y-26*size<ceiling){unit.y=ceiling+26*size;unit.vy=0;break;}
  }
  if(unit.vy>=0){
    let floor=null;
    for(const s of world.solids)if(!s.gone&&unit.x+half>s.x&&unit.x-half<s.x+s.w&&from<=s.y+.001&&unit.y>=s.y&&(!floor||s.y<floor.y))floor=s;
    if(floor){unit.y=floor.y;unit.vy=0;unit.on=true;if(floor.water)unit.waiting=true;}
  }
  unit.onGround=unit.on;unit.ax=unit.face;unit.ay=target&&target.y<unit.y-20?-1:0;
  unit.anim+=dt*(Math.abs(unit.vx)>2?10:2);unit.statusTime=unit.clock;
  return close;
}
const kindSpacing=unit=>unit.summonKind==='clone'?24+unit.index*32:20+unit.index*14;
export function advanceWukongMagic(p,dt,world){
  if(!p.magic)return;
  if(p.dead||p.enteringExit||p.exitEntered){clearWukongMagic(p);return;}
  for(const [kind,effect]of Object.entries(p.magic)){
    if(kind==='transform')continue;
    effect.t+=dt;effect.remaining=Math.max(0,effect.remaining-dt);
    if(effect.remaining<=1e-8){delete p.magic[kind];continue;}
    if(kind==='arms'){
      if(p.staff&&p.staff.kind!=='ultimate')p.staff.armHits??=[[],[]];
      continue;
    }
    for(const unit of effect.units){
      unit.clock+=dt;unit.recallT=Math.max(0,(unit.recallT||0)-dt);unit.jumpCd=Math.max(0,unit.jumpCd-dt);
      if(unit.waiting||Math.abs(unit.x-p.x)>170||unit.x<world.camera-25||unit.y>world.bottom+35){
        if(!recall(unit,p,world.solids)){unit.waiting=true;continue;}
      }
      unit.weapon=kind==='clone'?p.weapon||'rifle':'rifle';unit.rapid=!!p.rapid;
      const target=targets(unit,p,world),close=walk(unit,p,target,dt,world);
      // A deterministic per-unit generator selects forms only on the simulation host.
      unit.seed??=(p.pid||1)*997+unit.index*131+(kind==='clone'?17:53);
      advanceStaff(unit,{fire:!!close,up:unit.ay<0},dt,{random:()=>{
        unit.seed=(Math.imul(1664525,unit.seed)+1013904223)>>>0;return unit.seed/4294967296;
      }});
    }
  }
  if(!Object.keys(p.magic).length)delete p.magic;
}
export function resolveWukongMagic(p,world){
  if(!p.magic||p.dead||p.enteringExit||p.exitEntered)return;
  resolveTransformation(p,world);
  if(p.magic.arms&&p.staff&&p.staff.kind!=='ultimate'){p.staff.armHits??=[[],[]];p.staff.armBeatHits??=[[[],[],[]],[[],[],[]]];}
  const reduced={...world,pods:[],damageEnemy:(enemy,damage,...args)=>world.damageEnemy(enemy,Math.max(1,Math.floor(damage*.5)),...args),
    hitPart:(part,damage,...args)=>world.hitPart(part,Math.max(1,Math.floor(damage*.5)),...args)};
  for(const actor of multiArmActors(p))if(actor.staff)resolveStaff(actor,reduced);
  for(const effect of Object.values(p.magic))for(const unit of effect.units||[]){
    if(!unit.waiting)resolveStaff(unit,reduced);
  }
}

// Render helpers sample these poses without advancing timers, AI, random state or damage.
export function magicArmGeometry(p,index){
  const actor=multiArmActors(p)[index];return actor?{actor,line:staffGeometry(actor)}:null;
}
