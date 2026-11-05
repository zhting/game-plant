import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAlienGuardian,alienGuardianMouth} from '../../games/contra2026/js/stage-eight-guardian.mjs';
import {GUARDIAN_FLYER,GUARDIAN_FLYER_ASSET,createGuardianFlyer,advanceGuardianSpit,advanceGuardianFlyer,guardianFlyerBox,guardianFlyerFrame} from '../../games/contra2026/js/guardian-flyer.mjs';
import {StageSevenArt} from '../../games/contra2026/js/stage-seven-art.mjs';

test('守卫从可见嘴部吐出两个间隔的小怪，离屏不生成且在场数量有上限',()=>{
  const g=createAlienGuardian(),en=[g],births=[];
  for(let i=0;i<140;i++){
    const children=advanceGuardianSpit(g,1/60,en,{active:true});
    for(const child of children){births.push(i);assert.deepEqual([child.x,child.y],Object.values(alienGuardianMouth(g)));assert.equal(child.hp,2);assert.ok(child.vx<0&&child.vy<0);en.push(child);}
  }
  assert.equal(births.length,2);assert.ok(births[1]-births[0]>=13);
  const before=JSON.stringify(g);for(let i=0;i<30;i++)assert.deepEqual(advanceGuardianSpit(g,1/60,en),[]);assert.equal(JSON.stringify(g),before);
  for(let i=0;i<2000;i++)en.push(...advanceGuardianSpit(g,1/60,en,{active:true}));assert.equal(en.length-1,GUARDIAN_FLYER.limit);
});

test('飞行小怪先越过半墙再缓慢转向玩家，持续悬浮并在飞离后移除',()=>{
  const g=createAlienGuardian(),e=createGuardianFlyer(g),target={x:970,y:176},samples=[];
  for(let i=0;i<115;i++){advanceGuardianFlyer(e,target,1/60,856);samples.push([e.x,e.y]);assert.ok(e.y>30&&e.y<166);}
  assert.ok(samples[28][0]<alienGuardianMouth(g).x);assert.ok(samples[28][1]<100,'initial launch clears the low wall');
  assert.ok(e.y>samples[28][1],'the creature gently descends toward the player after emerging');
  assert.notEqual(guardianFlyerFrame(e),guardianFlyerFrame({...e,age:e.age+.15}));
  for(let i=0;i<500&&!e.dead;i++)advanceGuardianFlyer(e,target,1/60,856);assert.equal(e.dead,true);
});

test('四姿态透明图集按注册中心和统一比例绘制，冻结姿态重复渲染不变',()=>{
  const png=fs.readFileSync(new URL('../../games/contra2026/assets/stage7/alien-guardian-flyer-v1.png',import.meta.url));assert.equal(png[25],6);assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1254,1254]);
  const loader=new StageSevenArt({autoLoad:false,createCanvas:()=>({getContext:()=>({})}),baseArt:{}});assert.equal(loader.assets.guardianFlyer,GUARDIAN_FLYER_ASSET);
  const image={naturalWidth:1254,naturalHeight:1254},draws=[],g=new Proxy({save(){},restore(){},translate(){},scale(){},rotate(){},drawImage(...a){draws.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{}}),art={g,loaded:new Set(['guardianFlyer']),images:{guardianFlyer:image},state:{freezeT:0}};
  const poses=[];
  for(let i=0;i<4;i++){
    const e={...createGuardianFlyer(createAlienGuardian()),age:(i+.1)/9,phase:0,flash:.1},before=JSON.stringify(e);
    StageSevenArt.prototype.enemy.call(art,e);const a=draws.at(-1);poses.push(a.slice(1,5));assert.equal(a[7],627*GUARDIAN_FLYER.scale);assert.equal(a[8],a[7]);assert.equal(a[5],-a[7]/2);assert.equal(JSON.stringify(e),before);assert.equal(g.filter,'brightness(1.8)');
    StageSevenArt.prototype.enemy.call(art,e);assert.deepEqual(draws.at(-1),a);assert.deepEqual(guardianFlyerBox(e),{x:e.x-8,y:e.y-7,w:16,h:14});
  }
  assert.equal(new Set(poses.map(p=>p.join(','))).size,4);
});
