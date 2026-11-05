import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { STAGE_FOUR_ROOMS, STAGE_FOUR_DEVICES, makeTwinProjections, advanceTwinProjections } from '../../games/contra2026/js/stage-four-layout.mjs';
import { STAGE_FOUR_ASSETS } from '../../games/contra2026/js/stage-four-art.mjs';
import { baseShotHeight, baseTargetAtHeight } from '../../games/contra2026/js/base-shooting.mjs';
import { gameResourceJobs } from '../../games/contra2026/js/resource-preloader.mjs';

test('第四关四个普通房间和中枢独立配置；四装置布局保留高位射击要求',()=>{
  assert.equal(STAGE_FOUR_ROOMS.length,5);assert.equal(STAGE_FOUR_ROOMS.at(-1).boss,'twin');
  for(const room of STAGE_FOUR_ROOMS.slice(0,4)){assert.ok(room.sol>=6);assert.equal(room.supply.length,2);assert.ok(room.guns.length>=2);}
  assert.equal(STAGE_FOUR_DEVICES.length,4);
  const high=STAGE_FOUR_DEVICES[0],standing=baseShotHeight({y:204},4,true),jump=baseShotHeight({y:164},4,true);
  assert.equal(baseTargetAtHeight(high,standing),false);assert.equal(baseTargetAtHeight(high,jump),true);
  assert.equal(STAGE_FOUR_DEVICES.slice(1).every(t=>baseTargetAtHeight(t,standing)),true);
});

test('双生投影连续分裂和合拢，实体碰撞窗口明确，最后一张面具持续暴走',()=>{
  const base={bossTime:0,targets:makeTwinProjections()},phases=new Set();let previous=base.targets.map(t=>t.x),rings=0;
  for(let i=0;i<960;i++){
    rings+=advanceTwinProjections(base,1/60).length;phases.add(base.projectionSplit);
    base.targets.forEach((t,j)=>{assert.ok(Math.abs(t.x-previous[j])<2.2,'collision boxes do not teleport');assert.ok(t.x>=75&&t.x+t.w<=310);previous[j]=t.x;});
  }
  assert.deepEqual(phases,new Set([true,false]));assert.ok(rings>=8);
  base.targets[0].hp=0;let rageShots=0;
  for(let i=0;i<240;i++){rageShots+=advanceTwinProjections(base,1/60).length;assert.equal(base.targets[1].solid,true);}
  assert.ok(rageShots>=6);assert.equal(base.projectionSplit,false);
});

test('第四关压缩画面可交付，共用人物图集只计一次，新增场景、通道与面具均进入预加载',()=>{
  for(const key of ['corridor','twinMask','bossWall','passage']){
    const file=new URL('../..'+STAGE_FOUR_ASSETS[key],import.meta.url),bytes=fs.readFileSync(file);
    assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok(bytes.length<300000);
  }
  const loaded=[],arts=[{assets:{actor:STAGE_FOUR_ASSETS.rearBlue},loadImage:k=>loaded.push(k)},{assets:STAGE_FOUR_ASSETS,loadImage:k=>loaded.push(k)}];
  const jobs=gameResourceJobs({arts,imageFactory:()=>({}),cover:'/cover',records:[],tracks:{},music:{}});
  assert.equal(jobs.filter(j=>j.id==='image:'+STAGE_FOUR_ASSETS.rearBlue).length,1);
  assert.ok(jobs.some(j=>j.id==='image:'+STAGE_FOUR_ASSETS.corridor));assert.ok(jobs.some(j=>j.id==='image:'+STAGE_FOUR_ASSETS.twinMask));
  assert.ok(jobs.some(j=>j.id==='image:'+STAGE_FOUR_ASSETS.passage));
});
