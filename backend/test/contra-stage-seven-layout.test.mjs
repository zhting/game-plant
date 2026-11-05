import test from 'node:test';
import assert from 'node:assert/strict';
import {STAGE_SEVEN_ROUTE,HANGAR_SECTIONS,createStageSevenSolids,HANGAR_PRESSES,hangarPressState,hangarPressCrushBox,hangarPressBottom,HANGAR_SNIPERS,HANGAR_BOXES,HANGAR_IRON_PLATES,HANGAR_CART_DEPOTS,HANGAR_ENCOUNTERS} from '../../games/contra2026/js/stage-seven-layout.mjs';

test('机库八个路段衔接完整，台阶改变实体地形，双层通道和低顶运输廊各有空间',()=>{
  const solids=createStageSevenSolids(),ground=solids.filter(s=>s.g);
  assert.equal(HANGAR_SECTIONS[0].x,0);assert.equal(HANGAR_SECTIONS.at(-1).end,STAGE_SEVEN_ROUTE.width);
  for(let i=1;i<HANGAR_SECTIONS.length;i++)assert.equal(HANGAR_SECTIONS[i-1].end,HANGAR_SECTIONS[i].x);
  assert.equal(ground[0].x,0);assert.equal(ground.at(-1).x+ground.at(-1).w,3500);
  for(let i=1;i<ground.length;i++)assert.equal(ground[i-1].x+ground[i-1].w,ground[i].x,'stepped slabs have no accidental gaps');
  assert.ok(new Set(ground.map(s=>s.y)).size>=3);assert.ok(solids.some(s=>!s.g&&!s.ceiling&&s.w>=400),'long upper press deck');
  assert.equal(solids.filter(s=>s.ceiling).length,2);assert.ok(solids.filter(s=>s.ceiling).every(s=>s.y+s.h<146));
  assert.ok(solids.filter(s=>s.cartRoof).every(s=>s.y===0),'the hanging bulkheads cannot be jumped over');
  assert.equal(solids.filter(s=>s.hangarClimb).length,5);assert.ok(solids.some(s=>s.climbWall&&s.solid&&s.h===120));
  const copy=createStageSevenSolids();copy[0].y=0;assert.equal(createStageSevenSolids()[0].y,176,'restarting does not retain mutated platforms');
});

test('重排后的守军、机关和矿车都落在实际平台上，铁板只集中于两个隔断',()=>{
  const solids=createStageSevenSolids(),supported=(x,y,hw=0)=>solids.some(s=>!s.ceiling&&s.y===y&&x-hw>=s.x&&x+hw<=s.x+s.w);
  for(const [x,y]of HANGAR_SNIPERS)assert.ok(supported(x,y,5),'sniper '+x);
  for(const q of HANGAR_ENCOUNTERS)for(const [x,y]of q.units)assert.ok(supported(x,y,5),'patrol '+x);
  for(const q of HANGAR_PRESSES)assert.ok(supported(q.x,q.floor),'press '+q.x);
  for(const q of HANGAR_CART_DEPOTS)assert.ok(supported(q.x,q.y,11),'cart '+q.x);
  for(const [x]of HANGAR_BOXES)assert.ok(solids.some(s=>s.g&&x-9>=s.x&&x+9<=s.x+s.w),'supply '+x);
  assert.equal(HANGAR_IRON_PLATES.length,2);for(const q of HANGAR_IRON_PLATES)assert.ok(supported(q.x,q.y,33));
});

test('装卸台、双层压爪和管廊采用不同周期，每次压落前都有可见预警且存在安全间隔',()=>{
  assert.ok(new Set(HANGAR_PRESSES.map(q=>q.per)).size>=4);
  for(const q of HANGAR_PRESSES){
    const idle=q.idle??1.25,warn=q.warn??.55;
    assert.ok(warn>=.55);assert.deepEqual(hangarPressState(q,idle+warn/2-q.off),{st:'warn',k:0});
    assert.equal(hangarPressState(q,idle+warn+.3-q.off).k,1);
    assert.equal(hangarPressState(q,q.per-.01-q.off).k,0,'each press fully clears the passage before cycling');
    for(const t of [-3,0,1,2,4]){const state=hangarPressState(q,t);assert.ok(state.k>=0&&state.k<=1);assert.ok(Math.abs(state.k-hangarPressState(q,t+q.per).k)<1e-10);}
  }
});

test('压柱仅以下降的爪尖为伤害面，收回、停止、柱身和行程之外都不产生伤害区域',()=>{
  const q={...HANGAR_PRESSES[0],k:1};assert.equal(hangarPressCrushBox(q,1),null);
  q.k=.5;assert.equal(hangarPressCrushBox(q,.8),null);
  q.k=.8;const sweep=hangarPressCrushBox(q,.5);assert.equal(sweep.y,hangarPressBottom(q,.5));assert.equal(sweep.y+sweep.h,hangarPressBottom(q));assert.ok(sweep.y>q.top+12);
  q.k=1;assert.ok(hangarPressCrushBox(q,.99),'the last moving frame still crushes as the head reaches the floor');
});
