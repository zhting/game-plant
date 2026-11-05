import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newVitality,receiveHeroHit,advanceVitality,healHero,receiveGuardHit,advanceGuardRecoil,guardDefeat,advanceGuardDefeat,healingEnemyDrop,advanceImpactPause} from '../../games/wukong/js/wukong-vitality.mjs';
import {wholeHeroFrame,wholeHeroPose} from '../../games/wukong/js/wukong-hero-frames.mjs';
import {STAFF_SEQUENCES,staffSequenceBeat} from '../../games/wukong/js/wukong-staff-sequences.mjs';
import {resolveStaff,advanceStaff,staffGeometry} from '../../games/wukong/js/wukong-combat.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';
import {guardReactionFrame,GUARD_REACTION_ASSET,GUARD_REACTION_FRAMES} from '../../games/wukong/js/wukong-guard-reactions.mjs';
import {scheduleSupplyFairy} from '../../games/wukong/js/wukong-supplies.mjs';

const hero=more=>({heroFrames:true,x:300,y:144,onGround:true,face:1,vx:0,vy:0,invT:0,...newVitality(),...more});
const floor={x:0,y:144,w:600,h:70,g:1};
const land=(_x,from,to)=>from<=144&&to>=144?floor:null;

test('悟空100点气血可承受八次普通命中，最后一次归零；保护期、护盾和出口不重复扣血',()=>{
  const p=hero();
  for(let i=0;i<8;i++){p.invT=0;assert.equal(receiveHeroHit(p,{damage:12,face:-1}).lethal,false);}
  assert.equal(p.hp,4);assert.equal(receiveHeroHit(p,{damage:12}),null);assert.equal(p.hp,4);
  p.invT=0;p.shieldT=2;assert.equal(receiveHeroHit(p),null);p.shieldT=0;p.enteringExit={};assert.equal(receiveHeroHit(p),null);
  p.enteringExit=null;assert.equal(receiveHeroHit(p,{damage:12}).lethal,true);assert.equal(p.hp,0);
});
test('受击打断当前棍招、面向来敌并后退，重击短暂离地，完整受击帧不拆分身体',()=>{
  const p=hero({staff:{kind:'sweep'},staffCombo:3,prone:true});receiveHeroHit(p,{damage:22,face:-1,heavy:true});
  assert.equal(p.hp,78);assert.equal(p.staff,null);assert.equal(p.face,1);assert.ok(p.knockVX<0&&p.vy<0);
  assert.equal(p.onGround,false);assert.equal(p.prone,false);assert.equal(wholeHeroFrame(p).frame.id,'mobility:10');
  for(let i=0;i<14;i++)advanceVitality(p,1/60);assert.equal(wholeHeroFrame(p).frame.id,'mobility:11');
  assert.ok(Number.isFinite(wholeHeroPose(p).origin.y));
  for(let i=0;i<20;i++)advanceVitality(p,1/60);assert.equal(p.hurt,null);assert.equal(p.knockVX,0);
});
test('补血保持棍法与仙术不变，恢复量封顶，死亡后不能拾取，延迟黄血条追上当前气血',()=>{
  const p=hero({hp:20,weapon:'laser',rapid:true});assert.equal(healHero(p,'healPeach'),30);assert.equal(p.hp,50);
  assert.equal(healHero(p,'healPill'),50);assert.equal(p.hp,100);assert.equal(p.weapon,'laser');assert.equal(p.rapid,true);
  receiveHeroHit(p,{damage:12});assert.equal(p.hpTrail,100);advanceVitality(p,.2);assert.equal(p.hpTrail,100);
  for(let i=0;i<30;i++)advanceVitality(p,1/60);assert.equal(p.hpTrail,88);
  p.dead=true;assert.equal(healHero(p,'healPill'),0);assert.equal(p.hp,88);
});
test('真实击退经过墙体与地面回调，轻击后滑、重击腾空落回平台，硬直中停止AI',()=>{
  const e={t:'run',x:320,y:144,face:-1,on:true,vy:0,melee:{}};receiveGuardHit(e,{vx:1,heavy:true},3);
  let wallCalls=0,leftGround=false,landed=false;
  for(let i=0;i<35;i++){
    const active=advanceGuardRecoil(e,1/60,{land,wall(actor){wallCalls++;actor.x=Math.min(326,actor.x);}});
    leftGround||=e.y<144;landed||=leftGround&&e.on;
    if(!active)break;
  }
  assert.ok(wallCalls>0&&leftGround&&landed);assert.ok(e.x<=326);assert.equal(e.y,144);assert.equal(e.melee,null);assert.equal(e.hurt,null);
});
test('天兵阵亡以完整击飞帧落地并侧躺，支撑平台消失时继续下落',()=>{
  const f=guardDefeat({x:320,y:144,face:-1},{vx:1,heavy:true});assert.equal(guardReactionFrame(f,true),6);
  let touched=false;for(let i=0;i<75;i++)touched=advanceGuardDefeat(f,1/60,{land})||touched;
  assert.ok(touched);assert.equal(f.y,144);assert.equal(f.landed,true);assert.equal(guardReactionFrame(f,true),11);
  f.support={...floor,gone:true};advanceGuardDefeat(f,1/60,{land:()=>null});assert.equal(f.landed,false);assert.ok(f.y>144);
});
test('守阵天兵被击退到台阶外时会落到下一层，不在平台边缘悬空',()=>{
  const upper={x:290,y:144,w:26,h:30},lower={x:310,y:176,w:100,h:40};
  const landing=(x,a,b,hw)=>[upper,lower].find(s=>x+hw>s.x&&x-hw<s.x+s.w&&a<=s.y&&b>=s.y);
  const e={t:'snp',x:315,y:144,face:-1,vy:0};receiveGuardHit(e,{vx:1},2);
  for(let i=0;i<55;i++)advanceGuardRecoil(e,1/60,{land:landing});
  assert.ok(e.x>316);assert.equal(e.y,176);assert.equal(e.on,true);assert.equal(e.hurt,null);
});
test('12张完整天兵受击/阵亡图使用透明压缩资源，每张绘制区域在源图内',()=>{
  assert.equal(GUARD_REACTION_FRAMES.length,12);
  for(const [x,y,w,h]of GUARD_REACTION_FRAMES){assert.ok(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);}
  const asset=new URL('../..'+GUARD_REACTION_ASSET,import.meta.url);assert.ok(fs.statSync(asset).size<500000);
  assert.equal(fs.readFileSync(asset).subarray(8,12).toString(),'WEBP');
});
test('敌人补血掉落由主机每四名结算，附近有补血物或双人满血时不堆积',()=>{
  const world={p:hero({hp:40}),items:[]},e={t:'snp',x:330,y:144};
  for(let i=0;i<3;i++)assert.equal(healingEnemyDrop(world,e,()=>.5),null);
  const item=healingEnemyDrop(world,e,()=>.5);assert.equal(item.kind,'healPeach');assert.equal(item.landed,false);
  world.items=[item];for(let i=0;i<4;i++)assert.equal(healingEnemyDrop(world,e),null);
  world.items=[];world.p.hp=100;for(let i=0;i<4;i++)assert.equal(healingEnemyDrop(world,e),null);
});
test('补血仙女在镜头前方出现，继续跑动可追上，不与已有携桃仙女同时生成',()=>{
  const world={camX:160,pods:[],podTrig:[{at:140,y0:80,kind:'healPeach'}]};
  const fairy=scheduleSupplyFairy(world,3,()=>0);assert.equal(fairy.x,440);assert.equal(fairy.kind,'healPeach');
  world.pods=[fairy];world.podTrig.push({at:140,y0:80,kind:'healPill'});assert.equal(scheduleSupplyFairy(world,10,()=>0),null);
});
test('命中停顿冻结模拟数帧并保留期间的跳跃/棍击/双人输入边沿，暂停后不会丢操作',()=>{
  const world={hitStop:.065},one={},two={};let frames=0;
  while(advanceImpactPause(world,1/60,[one,two])){frames++;if(frames===1){one.jumpEdge=true;two.fireEdge=true;}}
  assert.equal(frames,4);assert.equal(one.jumpEdge,true);assert.equal(two.fireEdge,true);assert.equal(world.hitStopInputs,undefined);
  one.jumpEdge=false;advanceImpactPause(world,1/60,[one,two]);assert.equal(one.jumpEdge,false);
});
test('各套连招切换完整画面、每段独立命中且同段不重复，收招恢复统一持棍',()=>{
  for(const variant of Object.keys(STAFF_SEQUENCES)){
    const p=hero({staff:{kind:'sweep',variant,t:0,duration:1,face:1,combo:1,weapon:'rifle',hits:[]}});
    const enemy={hp:30,x:290,y:88,w:45,h:55},seen=new Set(),hits=[];
    const world={enemies:[enemy],pods:[],parts:[],solids:[],enemyBox:e=>e,podBox:e=>e,
      damageEnemy(e,d,_x,_y,shot){e.hp-=d;hits.push(shot.heavy);},popPod(){},hitPart(){}};
    for(let i=0;i<=120;i++){p.staff.t=i/120;seen.add(wholeHeroFrame(p).frame.id);resolveStaff(p,world);resolveStaff(p,world);}
    assert.ok(seen.size>=14,variant);assert.deepEqual(hits,[false,false,true],variant);assert.equal(enemy.hp,23);
    assert.equal(wholeHeroFrame(p,0).frame.id,wholeHeroFrame(p,1).frame.id);
    assert.equal(staffSequenceBeat(variant,.999).index,2);
  }
});
test('连段对墙后目标无伤害，长棍握点保持一致，疾风强化加速完整连段',()=>{
  for(const variant of Object.keys(STAFF_SEQUENCES)){
    const p=hero({weapon:'laser'});advanceStaff(p,{fire:true},0,{random:()=>1});p.staff.variant=variant;
    const e={hp:30,x:340,y:90,w:20,h:54};
    for(let i=0;i<90;i++){
      p.staff.t=i/90*p.staff.duration;const q=staffGeometry(p);assert.ok(Number.isFinite(q.tip.x));
      resolveStaff(p,{enemies:[e],pods:[],parts:[],solids:[{x:328,y:45,w:8,h:110,g:1}],enemyBox:e=>e,podBox:e=>e,damageEnemy(e,d){e.hp-=d;},popPod(){},hitPart(){}});
    }assert.equal(e.hp,30);
  }
  const normal=hero(),fast=hero({weapon:'machine'});advanceStaff(normal,{fire:true},0,{random:()=>1});advanceStaff(fast,{fire:true},0,{random:()=>1});
  assert.ok(Math.abs(normal.staff.duration/fast.staff.duration-1.7)<1e-8);
});
test('血量、受击相位、击退速度、连段已命中引用与停顿输入均随联机快照恢复',()=>{
  const p=hero();receiveHeroHit(p,{damage:12});const e={hp:6};
  p.staff={variant:'lotusChain',hits:[],beatHits:[[e],[],[]]};
  const world={p,en:[e],hitStop:.04,hitStopInputs:[{jumpEdge:true}]};
  const [copy]=unpackWorld(packWorld([world]));assert.equal(copy.p.hp,88);assert.equal(copy.p.hurt.t,0);
  assert.equal(copy.p.knockVX,p.knockVX);assert.equal(copy.p.staff.beatHits[0][0],copy.en[0]);assert.equal(copy.hitStopInputs[0].jumpEdge,true);
});
