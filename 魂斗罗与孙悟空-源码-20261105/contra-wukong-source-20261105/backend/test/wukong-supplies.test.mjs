import test from 'node:test';
import assert from 'node:assert/strict';
import {scheduleSupplyFairy,advanceSupplyFairy,releaseFairyPeach,FAIRY_SUPPLY_TIMING} from '../../games/wukong/js/wukong-supplies.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';

const DT=1/60;
const seeded=seed=>()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
function scene(){
  return {camX:1000,pods:[],podTrig:[
    {at:100,kind:'M',y0:70,done:false},{at:700,kind:'S',y0:58,done:false},
    {at:260,kind:'arms',y0:76,done:false},{at:980,kind:'clone',y0:72,done:false}
  ]};
}

test('一次跨过多个补给点仍逐位随机出现，等逃离后再等待，不丢失普通或仙术寿桃',()=>{
  const runs=[];
  for(const seed of [123,456]){
    const world=scene(),random=seeded(seed),spawns=[],drops=[],gaps=[];
    let departed=null,largest=0;
    for(let frame=0;frame<60*40;frame++){
      const fairy=scheduleSupplyFairy(world,DT,random);
      if(fairy){
        spawns.push({time:frame*DT,kind:fairy.kind});world.pods.push(fairy);
        if(departed!==null)gaps.push(frame*DT-departed);
      }
      largest=Math.max(largest,world.pods.filter(pd=>!pd.dead).length);
      for(const pd of world.pods){
        advanceSupplyFairy(pd,DT,world.camX);
        if(pd.t>=.6&&!pd.flee){const peach=releaseFairyPeach(pd);drops.push(peach.kind);assert.equal(releaseFairyPeach(pd),null);}
        if(pd.dead)departed=frame*DT;
      }
      world.pods=world.pods.filter(pd=>!pd.dead);
    }
    assert.equal(largest,1);assert.deepEqual(drops,['M','arms','S','clone']);
    assert.ok(world.podTrig.every(t=>t.done));assert.equal(world.wukongSupplies.spawned,4);
    assert.ok(spawns[0].time>=FAIRY_SUPPLY_TIMING.firstMin-DT&&spawns[0].time<=FAIRY_SUPPLY_TIMING.firstMax);
    assert.ok(gaps.every(gap=>gap>=2&&gap<=4.5+DT));
    assert.ok(new Set(gaps.map(gap=>gap.toFixed(1))).size>1,'后续间隔有变化');
    runs.push(spawns.map(s=>s.time));
  }
  assert.notDeepEqual(runs[0],runs[1],'新一局使用不同随机结果');
});

test('携桃和逃离期间不提前计时或抽随机数，快照保留待出现道具与剩余等待',()=>{
  const world=scene();let calls=0;const random=()=>{calls++;return .5;};
  for(let n=0;n<120&&!world.pods.length;n++){const pd=scheduleSupplyFairy(world,DT,random);if(pd)world.pods.push(pd);}
  const wait=world.wukongSupplies.wait,rolls=calls;
  for(let n=0;n<180;n++)assert.equal(scheduleSupplyFairy(world,DT,random),null);
  releaseFairyPeach(world.pods[0]);
  for(let n=0;n<180;n++)assert.equal(scheduleSupplyFairy(world,DT,random),null);
  assert.equal(world.wukongSupplies.wait,wait);assert.equal(calls,rolls);
  world.pods[0].dead=true;
  for(let n=0;n<33;n++)assert.equal(scheduleSupplyFairy(world,DT,random),null);
  const clone=unpackWorld(JSON.parse(JSON.stringify(packWorld(world))));
  for(let n=0;n<220;n++){
    const left=scheduleSupplyFairy(world,DT,()=>.25),right=scheduleSupplyFairy(clone,DT,()=>.25);
    assert.deepEqual(left,right);
    if(left){world.pods.push(left);clone.pods.push(right);}
  }
  assert.deepEqual(clone,world);assert.equal(world.wukongSupplies.spawned,2);
});

test('镜头跑过仙女后清理旧携桃者，后续补给能继续出现，已掉落者不会重复掉桃',()=>{
  const world=scene(),old={fairy:true,x:800,y:70,y0:70,t:1,kind:'M'};world.pods.push(old);
  advanceSupplyFairy(old,DT,world.camX);assert.equal(old.dead,true);assert.equal(releaseFairyPeach(old),null);
  let appeared=null;
  for(let n=0;n<130&&!appeared;n++)appeared=scheduleSupplyFairy(world,DT,()=>.5);
  assert.equal(appeared.kind,'M');assert.ok(releaseFairyPeach(appeared).peach);assert.equal(releaseFairyPeach(appeared),null);
});
