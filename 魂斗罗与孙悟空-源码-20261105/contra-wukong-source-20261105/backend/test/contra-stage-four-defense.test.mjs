import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGE_FOUR_DEVICES, initStageFourDefenses, advanceStageFourShutters, stageFourFacilityClosed, advanceStageFourGallery, stageFourGalleryBox, stageFourGalleryTargets } from '../../games/contra2026/js/stage-four-layout.mjs';
import { baseHomingTarget } from '../../games/contra2026/js/base-shooting.mjs';

test('各类第四关设施具有独立开合窗口，关闭和开合途中防弹，损毁后停止开合',()=>{
  const B={targets:['gun','rail','switch','core','device'].map(k=>({k,hp:7}))};initStageFourDefenses(B);
  assert.ok(B.targets.every(t=>!stageFourFacilityClosed(t)));let mixed=false,closed=false,moving=false;
  for(let i=0;i<500;i++){
    advanceStageFourShutters(B,1/60);const flags=B.targets.map(stageFourFacilityClosed);
    mixed ||=flags.some(Boolean)&&flags.some(f=>!f);closed ||=flags.every(Boolean);
    for(const t of B.targets)if(t.aperture>.01&&t.aperture<.99){moving=true;assert.equal(stageFourFacilityClosed(t),true);}
  }
  assert.equal(mixed,true);assert.equal(moving,true);assert.equal(closed,false,'staggered facilities keep an attack window available');
  const t=B.targets[0];t.hp=0;const before=t.aperture;advanceStageFourShutters(B,2);assert.equal(t.aperture,before);assert.equal(stageFourFacilityClosed(t),false);
  assert.equal(stageFourFacilityClosed({k:'device',hp:7}),false,'second-stage devices retain their existing rules');
});

test('上下两层守军从左右侧门进入，移动连续且每个入口最多一名守军，射击后退回',()=>{
  const B={targets:STAGE_FOUR_DEVICES.map(t=>({...t}))};initStageFourDefenses(B);
  const previous=new Map(),tiers=new Set(),sides=new Set(),fired=new Set();let count=0;
  for(let tick=0;tick<1200;tick++){
    for(const shot of advanceStageFourGallery(B,1/60))fired.add(shot.tier);
    count=Math.max(count,B.gallery.length);assert.equal(new Set(B.gallery.map(s=>s.lane)).size,B.gallery.length);
    for(const s of B.gallery){
      tiers.add(s.tier);sides.add(s.side);const old=previous.get(s.id);
      if(old===undefined)assert.ok(s.x<85||s.x>299,'a new soldier begins behind the entry edge');
      else assert.ok(Math.abs(s.x-old)<.58,'movement never teleports between positions');
      previous.set(s.id,s.x);const box=stageFourGalleryBox(s);assert.ok(box.w>=0&&box.w<=12);
      assert.equal(s.y,s.tier?137:107);
    }
  }
  assert.deepEqual(tiers,new Set([0,1]));assert.deepEqual(sides,new Set([-1,1]));assert.equal(fired.size,2);assert.ok(count<=4);assert.ok(B.galleryId>4);
});

test('追踪弹避开关闭设施，守军按所在楼层选择弹道，隐藏在侧门后的身体不可命中',()=>{
  const upper={id:0,x:131,y:107,side:-1,tier:0,hp:1},lower={id:1,x:104,y:137,side:-1,tier:1,hp:1};
  const B={targets:[{k:'device',hp:7,x:178,y:119,w:28,h:18,armored:true,aperture:0}],gallery:[upper,lower]};
  assert.equal(baseHomingTarget(B,192,129,4).galleryId,1);assert.equal(baseHomingTarget(B,192,95,4).galleryId,0);
  B.gallery=[{...upper,x:84}];assert.equal(stageFourGalleryTargets(B).length,0);assert.equal(baseHomingTarget(B,192,95,4),null);
  B.targets[0].aperture=1;assert.equal(baseHomingTarget(B,192,129,4),B.targets[0]);
});
