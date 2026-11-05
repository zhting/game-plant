import test from 'node:test';
import assert from 'node:assert/strict';
import {activateWukongMagic,advanceWukongMagic,multiArmActors,WUKONG_MAGIC} from '../../games/wukong/js/wukong-magic.mjs';
import {staffGeometry} from '../../games/wukong/js/wukong-combat.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';

const owner=()=>({pid:1,x:100,y:144,onGround:true,face:1,weapon:'rifle',rapid:false});
const world=(solids,enemies=[])=>({solids,enemies,parts:[],enemyBox:e=>({x:e.x-7,y:e.y-28,w:14,h:28}),camera:0,width:384,bottom:216});

test('群猴追击不会踏入无法跨越的宽坑，主人越过后化烟回到稳定平台',()=>{
  const p={...owner(),x:120},solids=[{x:0,y:144,w:150,h:60,g:1},{x:280,y:144,w:160,h:60,g:1}],env=world(solids,[{x:290,y:144,hp:20,t:'snp'}]);
  activateWukongMagic(p,'troop',solids);
  for(let n=0;n<240;n++)advanceWukongMagic(p,1/60,env);
  assert.ok(p.magic.troop.units.every(u=>u.x<=143&&u.y===144&&u.onGround),'缺口前停步或安全折返');
  assert.ok(p.magic.troop.units.some(u=>u.x>130),'确实追击到了缺口边缘');
  p.x=345;advanceWukongMagic(p,1/60,env);
  assert.ok(p.magic.troop.units.every(u=>u.x>=287&&u.x<=433&&u.y===144));
  assert.ok(p.magic.troop.units.some(u=>u.recallT>0));
});

test('分身的种子、招式和跳跃可从快照继续确定性模拟，不依赖绘制次数',()=>{
  const p=owner(),solids=[{x:0,y:144,w:384,h:60,g:1}],env=world(solids,[{x:150,y:112,hp:40,t:'fly'}]);
  activateWukongMagic(p,'clone',solids);
  for(let n=0;n<35;n++)advanceWukongMagic(p,1/60,env);
  const [copy,copyWorld]=unpackWorld(packWorld([p,env]));copyWorld.enemyBox=env.enemyBox;
  for(let n=0;n<100;n++){advanceWukongMagic(p,1/60,env);advanceWukongMagic(copy,1/60,copyWorld);}
  assert.deepEqual(JSON.parse(JSON.stringify(copy)),JSON.parse(JSON.stringify(p)));
  assert.ok(p.magic.clone.units.some(u=>u.seed>0&&u.jumpCd>0));
});

test('小猴锁定分配到的天兵，不会因为最近敌人排序变化而不断掉头，目标阵亡后重新选敌',()=>{
  const p=owner(),solids=[{x:0,y:144,w:384,h:60,g:1}];
  const foes=[{x:150,y:144,hp:20,t:'snp'},{x:180,y:144,hp:20,t:'snp'},{x:210,y:144,hp:20,t:'snp'}],env=world(solids,foes);
  activateWukongMagic(p,'troop',solids);advanceWukongMagic(p,1/60,env);
  const unit=p.magic.troop.units[2],selected=unit.target;assert.equal(selected,foes[2]);
  foes[0].x=200;foes[1].x=120;advanceWukongMagic(p,1/60,env);assert.equal(unit.target,selected);
  selected.dead=true;advanceWukongMagic(p,1/60,env);assert.notEqual(unit.target,selected);
});

test('重复仙术刷新持续时间和固定数量，空中召唤能落在附近平台，计时到期结束',()=>{
  const p=owner(),solids=[{x:0,y:144,w:384,h:60,g:1}],env=world(solids);
  p.onGround=false;p.y=65;
  activateWukongMagic(p,'troop',solids);advanceWukongMagic(p,.1,env);
  assert.ok(p.magic.troop.units.every(u=>!u.waiting&&u.y>65&&u.y<144));
  for(let n=0;n<60;n++)advanceWukongMagic(p,1/60,env);
  assert.ok(p.magic.troop.units.every(u=>u.onGround&&u.y===144));
  p.onGround=true;p.y=144;
  activateWukongMagic(p,'troop',solids);assert.equal(p.magic.troop.units.length,6);assert.equal(p.magic.troop.remaining,10);
  advanceWukongMagic(p,10,env);assert.equal(p.magic,undefined);
  assert.equal(activateWukongMagic({...p,dead:true},'arms',solids),false);
});

test('小猴棍身按身体比例缩放，六臂三根实体棍互不复用命中记录，死亡与出口清理',()=>{
  const p=owner(),solids=[{x:0,y:144,w:384,h:60,g:1}],env=world(solids);
  for(const kind of Object.keys(WUKONG_MAGIC))activateWukongMagic(p,kind,solids);
  const child=p.magic.troop.units[0],line=staffGeometry(child),full=staffGeometry({...child,magicScale:1});
  assert.ok(Math.abs(line.reach/full.reach-.52)<1e-8);assert.ok(Math.abs(line.rear/full.rear-.52)<1e-8);
  p.staff={variant:'cross',kind:'sweep',face:1,t:.15,duration:.32,combo:1,hits:[]};advanceWukongMagic(p,1/60,env);
  const arms=multiArmActors(p);assert.equal(arms.length,2);assert.notEqual(arms[0].staff.hits,arms[1].staff.hits);
  assert.notEqual(arms[0].staff.hits,p.staff.hits);assert.notEqual(arms[0].staff.variant,arms[1].staff.variant);
  p.enteringExit=true;advanceWukongMagic(p,1/60,env);assert.equal(p.magic,undefined);assert.equal(p.staff.armHits,undefined);
});
