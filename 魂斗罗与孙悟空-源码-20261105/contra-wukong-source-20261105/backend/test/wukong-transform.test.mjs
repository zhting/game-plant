import test from 'node:test';
import assert from 'node:assert/strict';
import {beginTransformation,cycleTransformation,advanceTransformation,transformation,transformationSpeed,resolveTransformation} from '../../games/wukong/js/wukong-transform.mjs';
import {receiveHeroHit} from '../../games/wukong/js/wukong-vitality.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';
const hero=()=>({x:100,y:144,pid:1,hp:100,maxHp:100,face:1,onGround:true,invT:0,weapon:'rifle'});
const foe=()=>({x:132,y:144,hp:100});
const box=e=>({x:e.x-5,y:e.y-28,w:10,h:28});
function world(enemies,solids=[]){return {enemies,parts:[],pods:[],bullets:[],solids,enemyBox:box,podBox:box,damageEnemy(e,d){e.hp-=d;},hitPart(p,d){p.hp-=d;},popPod(){}};}
const advance=(p,n,input={})=>{for(let i=0;i<n;i++)advanceTransformation(p,input,1/60);};
test('七十二变从鹏开始，换形不刷新18秒时间、气血或库存，快速连按不绕过冷却',()=>{
  const p=hero();p.inventory=['arms'];assert.equal(beginTransformation(p),true);assert.equal(transformation(p).form,'peng');
  assert.equal(cycleTransformation(p),false);advance(p,40);const time=transformation(p).remaining;
  assert.equal(cycleTransformation(p),true);assert.equal(transformation(p).form,'tiger');assert.equal(transformation(p).remaining,time);
  assert.equal(cycleTransformation(p),false);advance(p,40);cycleTransformation(p);assert.equal(transformation(p).form,'tortoise');
  assert.equal(p.hp,100);assert.deepEqual(p.inventory,['arms']);advance(p,1100);assert.equal(transformation(p),undefined);
});
test('鹏飞袭、虎扑杀与龟反震分别真实命中；同一攻击不能多次伤害，墙体挡住',()=>{
  for(const form of ['peng','tiger','tortoise'])for(const blocked of [false,true]){
    const p=hero(),e=foe(),w=world([e],blocked?[{x:115,y:70,w:4,h:74,g:true}]:[]);beginTransformation(p);transformation(p).form=form;
    advance(p,30);for(let i=0;i<35;i++){advanceTransformation(p,{fire:i===0},1/60);resolveTransformation(p,w);resolveTransformation(p,w);}
    assert.equal(e.hp,blocked?100:100-({peng:5,tiger:7,tortoise:8}[form]),form);
  }
});
test('白虎扑击加速由移动系统处理，朝向锁定；玄龟蓄守减伤并只排入一次反震',()=>{
  const p=hero();beginTransformation(p);Object.assign(transformation(p),{form:'tiger',shift:0,cool:0});advance(p,8,{fire:true});
  assert.equal(transformationSpeed(p,-1),236);p.face=-1;assert.equal(transformationSpeed(p,-1),236,'扑击沿出招方向');
  const tank=hero();beginTransformation(tank);Object.assign(transformation(tank),{form:'tortoise',shift:0});advance(tank,25,{down:true});tank.invT=0;
  assert.equal(transformation(tank).guard,true);const hit=receiveHeroHit(tank,{damage:40,heavy:true});assert.equal(hit.amount,16);assert.equal(tank.hp,84);
  assert.equal(transformation(tank).counter,true);tank.hurt=null;advance(tank,1);assert.equal(transformation(tank).attack.counter,true);assert.equal(transformation(tank).counter,false);
  const target=foe(),env=world([target]);for(let i=0;i<60;i++){advanceTransformation(tank,{},1/60);resolveTransformation(tank,env);}
  assert.equal(target.hp,88,'蓄守之后的一次反震造成12点伤害，持续碰撞不重复结算');
});
test('死亡和入门终止变身，联机快照保存当前形态、剩余时间与已命中敌人引用',()=>{
  const p=hero(),e=foe(),w=world([e]);beginTransformation(p);Object.assign(transformation(p),{form:'tiger',shift:0,cool:0});
  for(let i=0;i<15;i++){advanceTransformation(p,{fire:true},1/60);resolveTransformation(p,w);}
  const [remote,target]=unpackWorld(packWorld([p,e]));assert.equal(transformation(remote).form,'tiger');assert.equal(transformation(remote).remaining,transformation(p).remaining);
  assert.equal(transformation(remote).attack.hits[0],target);resolveTransformation(remote,world([target]));assert.equal(target.hp,e.hp);
  for(const flag of ['dead','enteringExit','exitEntered']){const q=hero();beginTransformation(q);q[flag]=true;advance(q,1);assert.equal(transformation(q),undefined);}
});
