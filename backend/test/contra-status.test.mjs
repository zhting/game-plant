import test from 'node:test';
import assert from 'node:assert/strict';
import { shieldShape, drawShieldField } from '../../games/contra2026/js/actor-status.mjs';
import { runFrame } from '../../games/contra2026/js/stage-one-motion.mjs';

test('能量护盾随卧倒、翻滚和巨大化调整，阵亡或进入通道后不残留',()=>{
  const p={x:100,y:176,shieldT:10};
  const standing=shieldShape(p),prone=shieldShape({...p,prone:true}),roll=shieldShape({...p,spin:true});
  assert.ok(prone.rx>standing.rx&&prone.ry<standing.ry);
  assert.ok(Math.abs(roll.rx-roll.ry)<2);
  const giant=shieldShape({...p,giantT:1});assert.equal(giant.rx,standing.rx*2);assert.equal(giant.ry,standing.ry*2);
  let draws=0;
  const g=new Proxy({globalAlpha:1,createRadialGradient:()=>({addColorStop(){}})}, {get:(o,key)=>key in o?o[key]:()=>{draws++;}});
  for(const state of [{shieldT:0},{dead:true},{exitEntered:true},{enteringExit:{t:.1}}]){
    drawShieldField(g,{...p,...state},1,true);drawShieldField(g,{...p,...state},1,false);assert.equal(draws,0);
  }
  drawShieldField(g,p,1,true);drawShieldField(g,p,1,false,.5);assert.ok(draws>0);
});

test('旧姿势图的兼容回退仍包含十二帧，步幅随尺寸缩放且双向一致',()=>{
  for(const enemy of [false,true])for(const size of [1,2]){
    const speed=enemy?62:90,period=(enemy?36:42)*size/speed;
    const frames=new Set();
    for(let i=0;i<120;i++){
      const time=i/120*period,frame=runFrame(time*10,speed,size,enemy);
      frames.add(frame);assert.equal(frame,runFrame(time*10,-speed,size,enemy));
    }
    assert.equal(frames.size,12);assert.equal(runFrame(period*10,speed,size,enemy),0);
    assert.ok(period/size>.45,'full stride reads as running rather than rapid leg jitter');
  }
});
