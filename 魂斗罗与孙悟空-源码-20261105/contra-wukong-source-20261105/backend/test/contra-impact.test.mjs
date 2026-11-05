import test from 'node:test';
import assert from 'node:assert/strict';
import { addImpact,impactContact,drawImpact } from '../../games/contra2026/js/impact-effects.mjs';
import { packWorld,unpackWorld } from '../../games/contra2026/js/coop-core.mjs';

test('命中反馈贴着目标表面并保持射入方向，斜射和反向命中不会跑到目标背面',()=>{
  const target={x:100,y:30,w:20,h:40};
  assert.deepEqual(impactContact(99,42,target,270,0),{x:100,y:42});
  assert.deepEqual(impactContact(121,42,target,-270,0),{x:120,y:42});
  assert.deepEqual(impactContact(110,32,target,10,270),{x:110,y:30});
  assert.deepEqual(impactContact(90,99,target,270,20),{x:100,y:70});
});

test('密集散弹合并近点火花，连续命中有数量上限，快照保留粒子的种子和时刻',()=>{
  const fx=[];
  const first=addImpact(fx,{x:10,y:30,material:'metal',vx:270,vy:0,seed:17});
  assert.equal(addImpact(fx,{x:11,y:30,material:'metal',seed:99}),first);assert.equal(fx.length,1);
  for(let i=0;i<90;i++)addImpact(fx,{x:30+i*4,y:60,material:i%2?'core':'metal',seed:i*37});
  assert.equal(fx.length,32);
  const copy=unpackWorld(JSON.parse(JSON.stringify(packWorld(fx))));assert.deepEqual(copy,fx);
  const render=effect=>{
    const calls=[],gradient={addColorStop:(...args)=>calls.push(['color',...args])};
    const g=new Proxy({globalAlpha:1,createRadialGradient:()=>gradient},{get:(o,key)=>key in o?o[key]:(...args)=>calls.push([key,...args]),set:(o,key,value)=>(o[key]=value,true)});
    drawImpact(g,effect);return calls;
  };
  for(let i=0;i<copy.length;i++){
    const original={...fx[i],t:.075},restored={...copy[i],t:.075};assert.deepEqual(render(original),render(restored));
    assert.equal(render({...original,t:original.life}).length,0,'expired impact must stop drawing');
  }
});
