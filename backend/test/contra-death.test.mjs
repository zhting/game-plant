import test from 'node:test';
import assert from 'node:assert/strict';
import { beginDeath,advanceDeath,deathVisual } from '../../games/contra2026/js/player-death.mjs';
import { HDActorArt,HD_ACTORS,HD_DEATH } from '../../games/contra2026/js/hd-actors.mjs';

test('死亡落在桥面后桥段消失，遗体继续下落而不会悬浮在原高度',()=>{
  const p={x:80,y:144,face:1},bridge={y:144,gone:false};beginDeath(p);
  for(let i=0;i<60&&!p.deathGrounded;i++)advanceDeath(p,1/60,{land:(x,a,b)=>!bridge.gone&&a<=144&&b>=144?bridge:null});
  assert.equal(p.deathGrounded,true);bridge.gone=true;
  advanceDeath(p,1/60,{land:()=>null});assert.equal(p.deathGrounded,false);assert.ok(p.y>144);
});

test('掉出屏幕底部的死亡角色隐藏并结束等待，不会永久等待不存在的地面',()=>{
  const p={x:100,y:210,face:1};beginDeath(p);let ready=false;
  for(let i=0;i<180&&!ready;i++)ready=advanceDeath(p,1/60,{land:()=>null,bottom:252});
  assert.equal(ready,true);assert.equal(deathVisual(p).visible,false);assert.equal(p.deathHidden,true);
});

test('红蓝角色死亡使用专用失能、撞地和侧躺帧，不复用卧倒射击且淡出后停止绘制',()=>{
  const make=()=>({getContext:()=>({drawImage(){}})}),images={actorDeath:{naturalWidth:1536}};
  for(const role of ['red','blue']){
    images[HD_ACTORS[role].key]={naturalWidth:1086};
    const art=new HDActorArt(make,images),poses=[],draws=[];
    const original=art.frame.bind(art);art.frame=(role,pose,density)=>{poses.push(pose);return original(role,pose,density);};
    const g=new Proxy({globalAlpha:1,drawImage:(...a)=>draws.push(a)},{get:(o,k)=>k in o?o[k]:()=>{}});
    const p={face:1};beginDeath(p);art.draw(g,p,role,10);
    p.deathGrounded=true;p.deathLandT=.05;art.draw(g,p,role,10);
    p.deathLandT=.2;art.draw(g,p,role,10);
    assert.deepEqual(poses,['deathAir','deathImpact','deathRest']);assert.equal(draws.length,3);
    assert.ok(draws[2][3]>=39&&draws[2][4]<12,'full body length, relaxed low silhouette');
    p.deathLandT=.68;art.draw(g,p,role,10);assert.equal(draws.length,3);
    assert.ok(HD_DEATH[role].frames.deathRest.bounds[3]>=130,'native detail, not an old tiny sprite');
  }
});
