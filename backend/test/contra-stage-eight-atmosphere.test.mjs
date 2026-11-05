import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hiveMotionPose,drawHiveSlab,hiveSlabHeight,HIVE_TISSUE_ART,HIVE_MOTION_ASSETS} from '../../games/contra2026/js/stage-eight-atmosphere.mjs';
import {hiveSpikeHeight,drawHiveSpike,drawHiveChasm,hiveSlimeShape,HIVE_HAZARD_ASSETS} from '../../games/contra2026/js/stage-eight-hazards.mjs';
import {StageSevenArt} from '../../games/contra2026/js/stage-seven-art.mjs';

function surface(){
  const draws=[],clips=[],spans=[],fills=[],gradient={addColorStop(){}};
  const g=new Proxy({globalAlpha:1,drawImage(...args){draws.push(args);},rect(...args){clips.push(args);},createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
  const art={g,state:{time:0,s8:{tissueTime:0}},loaded:new Set(['cavern','terrain','intestineMotion','cystMotion','chasm','boneSpike']),images:{cavern:{naturalWidth:2135,naturalHeight:736},terrain:{naturalWidth:2206,naturalHeight:451},intestineMotion:{naturalWidth:1254,naturalHeight:1254},cystMotion:{naturalWidth:1254,naturalHeight:1254},chasm:{naturalWidth:1642,naturalHeight:958},boneSpike:{naturalWidth:1024,naturalHeight:1536}},rect(...a){fills.push(a);},line(){},disc(){},textureSpan(...a){spans.push(a);}};
  return {art,draws,clips,spans,fills};
}

test('融合组织断面按原生完整动作单元播放，暂停重绘不变并有贯穿全厚度的实心组织底层',()=>{
  for(const kind of ['gut','cyst'])for(const time of [0,.2,2.5,40,3600]){
    const a=hiveMotionPose(time,1.2,kind),b=hiveMotionPose(time,1.2,kind),count=kind==='gut'?8:4;
    assert.deepEqual(a,b);assert.ok(a.frame>=0&&a.frame<count);assert.ok(a.next>=0&&a.next<count);assert.ok(a.mix>=0&&a.mix<=1);
  }
  assert.notDeepEqual(hiveMotionPose(0,0),hiveMotionPose(0,3));
  const s={x:0,y:176,w:300,h:40,g:1},before=JSON.stringify(s),a=surface();
  drawHiveSlab(a.art,s,0,200,0);const initial=a.draws.map(d=>d.slice(1));a.draws.length=0;
  drawHiveSlab(a.art,s,0,200,0);assert.deepEqual(a.draws.map(d=>d.slice(1)),initial);
  a.draws.length=0;drawHiveSlab(a.art,s,0,200,.35);
  assert.notDeepEqual(a.draws.map(d=>d.slice(1,5)),initial.map(d=>d.slice(0,4)));
  for(const d of a.draws){assert.equal(d[3],616);assert.equal(d[4],213);assert.equal(d[7],40*616/213);assert.equal(d[8],40);assert.equal(d[6],176,'the rim and gut bed share one full-depth destination');}
  assert.equal(JSON.stringify(s),before);assert.deepEqual(a.clips[0],[0,176,300,40]);assert.deepEqual(a.fills[0].slice(0,4),[0,176,200,40]);
  assert.ok(a.spans.every(d=>d[1]===a.art.images.terrain&&d[5]===40),'the backing texture is not cropped to a separate thin rim');
});

test('洞壁直接绘制原始纹理，地面保留固定血管边，深坑按真实缺口定位',()=>{
  const a=surface();StageSevenArt.prototype.backdrop.call(a.art,100);
  assert.equal(a.spans.length,1);assert.equal(a.spans[0][1],a.art.images.cavern,'no sliced or deformed background canvas');
  const before=a.spans[0].slice(1);a.art.state.time=10;a.art.state.s8.tissueTime=10;
  a.spans.length=0;StageSevenArt.prototype.backdrop.call(a.art,100);assert.deepEqual(a.spans[0].slice(1),before);
  const solids=[{x:0,y:176,w:640,h:40,g:1},{x:700,y:176,w:400,h:40,g:1},{x:210,y:128,w:96,h:8}],snapshot=JSON.stringify(solids);
  a.draws.length=0;StageSevenArt.prototype.floor.call(a.art,solids,500);
  assert.equal(JSON.stringify(solids),snapshot);
  assert.ok(a.draws.some(d=>d[0]===a.art.images.chasm));assert.ok(a.clips.some(c=>c[1]===176&&c[3]===40));
  const b=surface();drawHiveChasm(b.art,640,700);assert.deepEqual(b.clips[0],[628,175,84,41]);
  assert.ok(b.draws[0][1]<640&&b.draws[0][1]+b.draws[0][3]>700);
});

test('悬空平台以完整组织、包边和阴影增加厚度，碰撞高度及站立表面保持原值',()=>{
  for(const w of [64,80,96]){
    const a=surface(),s={x:210,y:128,w,h:8},before=JSON.stringify(s),depth=hiveSlabHeight(s);
    drawHiveSlab(a.art,s,210,210+w,1.2);assert.ok(depth>=20&&depth<=24);assert.equal(JSON.stringify(s),before);assert.equal(s.y,128);assert.equal(s.h,8);
    assert.ok(a.fills.some(f=>f[1]===128&&f[3]===depth),'the body is filled through the visual depth');
    assert.ok(a.fills.some(f=>f[1]>=128+depth-1),'the underside has a contact shadow');
    for(const d of a.draws){assert.equal(d[6],128);assert.equal(d[8],depth);assert.ok(Math.abs(d[7]/d[8]-616/213)<1e-10,'native tissue proportions remain constant');}
  }
  assert.equal(hiveSlabHeight({g:1,h:40,w:600}),40);
  for(const [x,y,w,h]of HIVE_TISSUE_ART.frames)assert.ok(x>=0&&y>=0&&x+w<=1254&&y+h<=1254);
});

test('骨刺滑出时保持原生比例，显示高度与主机和队友碰撞共用同一函数',()=>{
  const a=surface();
  for(const t of [0,.7,.82,.88,1,1.5,1.7,1.8]){
    a.draws.length=0;a.clips.length=0;const s={x:120,t},h=hiveSpikeHeight(s);drawHiveSpike(a.art,s);
    assert.ok(h>=0&&h<=64.00001);
    if(h>1e-10){const body=a.draws[0];assert.deepEqual(body.slice(1,5),[260,50,460,1400]);assert.equal(body[8],64);assert.equal(body[6],176-h);assert.equal(a.clips[0][3],h);}
    else assert.equal(a.draws.length,1,'only the socket is exposed before emergence');
  }
  assert.ok(hiveSlimeShape(.98).neck>hiveSlimeShape(.2).neck);assert.ok(hiveSlimeShape(.98).waist<hiveSlimeShape(.2).waist);
  assert.ok(hiveSlimeShape(0,250,true,.3).stretch>hiveSlimeShape(0,0,true,0).stretch);
});

test('四个新资源保留原生 RGBA，只有第八关注册这些素材',()=>{
  const size={intestineMotion:[1254,1254],cystMotion:[1254,1254],chasm:[1642,958],boneSpike:[1024,1536]};
  const alien=new StageSevenArt({autoLoad:false,createCanvas:()=>({getContext:()=>({})}),baseArt:{}});
  const hangar=new StageSevenArt({autoLoad:false,hangar:true,createCanvas:()=>({getContext:()=>({})}),baseArt:{}});
  for(const [key,url]of Object.entries({...HIVE_MOTION_ASSETS,...HIVE_HAZARD_ASSETS})){
    assert.equal(alien.assets[key],url);assert.equal(hangar.assets[key],undefined);
    const png=fs.readFileSync(new URL('../..'+url.replace('.webp','.png'),import.meta.url));assert.equal(png[25],6);assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],size[key]);
  }
});
