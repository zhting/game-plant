import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CEILING_STALKER,CEILING_STALKER_ART,CEILING_STALKER_ASSET,STALKER_ROOFS,createCeilingStalkers,advanceCeilingStalker,ceilingStalkerFrame} from '../../games/contra2026/js/ceiling-stalker.mjs';
import {StageSevenArt} from '../../games/contra2026/js/stage-seven-art.mjs';

test('顶部怪物先爬行并蓄力，锁定蓄力时的位置扑下，落地缓冲后继续跑动',()=>{
  const e=createCeilingStalkers()[0],target={x:e.x-60,y:176},locked=target.x,frames=new Set([ceilingStalkerFrame(e)]),events=[];
  const land=(x,a,b)=>a<=176&&b>=176?{x:0,y:176,w:1000,h:40,g:1}:null;
  for(let i=0;i<100&&e.phase==='cling';i++){advanceCeilingStalker(e,target,1/60,{active:true,camera:320,land});frames.add(ceilingStalkerFrame(e));}
  assert.equal(e.phase,'windup');assert.ok(e.walkDistance>30);assert.equal(e.targetX,locked);const before=[e.x,e.y];target.x+=200;
  for(let i=0;i<20;i++){advanceCeilingStalker(e,target,1/60,{active:true,camera:320,land});assert.equal(e.phase,'windup');assert.deepEqual([e.x,e.y],before);}
  for(let i=0;i<170&&e.phase!=='run';i++){const event=advanceCeilingStalker(e,target,1/60,{active:true,camera:320,land});if(event)events.push(event);frames.add(ceilingStalkerFrame(e));}
  assert.deepEqual(events,['launch','land']);assert.equal(e.phase,'run');assert.ok(Math.abs(e.x-locked)<4,'the committed dive does not snap after a dodging player');assert.equal(e.y+CEILING_STALKER.foot,176);
  for(let i=0;i<30;i++){advanceCeilingStalker(e,target,1/60,{active:true,camera:320,land});frames.add(ceilingStalkerFrame(e));}
  assert.equal(frames.size,8);assert.ok(e.vx>0);assert.equal(e.dead,undefined);
});

test('怪物爬行贴住实际悬顶，离屏不提前活动，无目标时巡回而不凭空跳下',()=>{
  const all=createCeilingStalkers();assert.equal(all.length,STALKER_ROOFS.length);
  for(const [i,e]of all.entries())assert.equal(e.y-CEILING_STALKER.foot,STALKER_ROOFS[i].y);
  const e=all[0],before=JSON.stringify(e);advanceCeilingStalker(e,{x:e.x,y:176},.5,{camera:0});assert.equal(JSON.stringify(e),before);
  e.x=e.minX+1;advanceCeilingStalker(e,null,1/60,{active:true,camera:0});assert.equal(e.x,e.minX);assert.equal(e.face,1);
  for(let i=0;i<25;i++)advanceCeilingStalker(e,null,1/60,{active:true,camera:0});assert.equal(e.phase,'cling');assert.ok(e.x>e.minX);
  Object.assign(e,{phase:'pounce',y:244,vy:240});advanceCeilingStalker(e,null,1/60,{active:true,camera:0});assert.equal(e.dead,true);
});

test('扑击越过高于目标的单向平台，目标在平台上时正常落地，实体结构仍然承托',()=>{
  for(const [targetY,solid,expected]of [[176,false,176],[100,false,100],[176,true,100]]){
    const e={...createCeilingStalkers()[0],phase:'pounce',x:480,y:48,vx:0,vy:35,targetY},target={x:480,y:targetY};
    const ledge={x:400,y:100,w:180,h:8,solid},ground={x:0,y:176,w:1000,h:40,g:1};
    const land=(x,a,b,hw,skip)=>[ledge,ground].find(s=>(!skip||s.g||s.solid)&&a<=s.y&&b>=s.y)||null;
    for(let i=0;i<100&&e.phase!=='land';i++)advanceCeilingStalker(e,target,1/60,{active:true,camera:320,land});
    assert.equal(e.phase,'land');assert.equal(e.y+CEILING_STALKER.foot,expected);
  }
});

test('八个原生动作单元保持统一比例，爬行、收肢、扑击和落地选择各自姿态',()=>{
  const png=fs.readFileSync(new URL('../../games/contra2026/assets/stage7/alien-ceiling-stalker-v1.png',import.meta.url));assert.equal(png[25],6);assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1774,887]);
  const loader=new StageSevenArt({autoLoad:false,createCanvas:()=>({getContext:()=>({})}),baseArt:{}});assert.equal(loader.assets.ceilingStalker,CEILING_STALKER_ASSET);
  const states=[{phase:'cling',walkDistance:0},{phase:'cling',walkDistance:10},{phase:'windup'},{phase:'pounce',airT:.03},{phase:'pounce',airT:.2},{phase:'land'},{phase:'run',walkDistance:0},{phase:'run',walkDistance:10}];
  for(const [i,state]of states.entries()){
    const draws=[],flips=[],g=new Proxy({save(){},restore(){},translate(){},scale(...a){flips.push(a);},drawImage(...a){draws.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{throw Error('Unexpected canvas operation '+k);}});
    const image={naturalWidth:1774,naturalHeight:887},art={g,state:{freezeT:0},images:{ceilingStalker:image},loaded:new Set(['ceilingStalker'])},e={...createCeilingStalkers()[0],...state,flash:.1},before=JSON.stringify(e);
    StageSevenArt.prototype.enemy.call(art,e);assert.equal(draws.length,1);assert.equal(ceilingStalkerFrame(e),i);assert.deepEqual(draws[0].slice(1,5),CEILING_STALKER_ART[i]);assert.equal(draws[0][7],CEILING_STALKER_ART[i][2]*CEILING_STALKER.scale);assert.equal(draws[0][8],CEILING_STALKER_ART[i][3]*CEILING_STALKER.scale);assert.deepEqual(flips,[[1,1]]);assert.equal(JSON.stringify(e),before);
  }
});
