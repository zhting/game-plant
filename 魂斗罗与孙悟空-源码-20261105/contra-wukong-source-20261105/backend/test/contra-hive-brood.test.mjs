import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HIVE_BROOD,HIVE_HATCHLING_ASSET,createHiveBrainParts,hiveBroodParts,hiveBroodRemaining,hiveBroodHealth,hiveDamageableParts,hiveBroodMouth,createHiveHatchling,advanceHiveBrood,advanceHiveHatchling,hiveHatchlingBox,hiveHatchlingFrame,hiveShotBlocked,drawHiveHatchling} from '../../games/contra2026/js/hive-brood.mjs';

const boss=()=>({x:3350,parts:createHiveBrainParts(3350),open:false,dead:false});

test('最终大脑有上二下二四个机关，护骨闭合时仅机关可被锁定，后排射击路线畅通',()=>{
  const H=boss(),ports=hiveBroodParts(H);assert.equal(ports.length,4);assert.equal(hiveBroodRemaining(H),4);assert.deepEqual(hiveBroodHealth(H),{hp:48,max:48});assert.equal(H.parts[2].k,'heart');assert.equal(H.parts[2].hp,80);
  assert.deepEqual(ports.map(p=>[p.row,p.y]),[['top',16],['bottom',148],['top',16],['bottom',148]]);assert.equal(new Set(ports.map(p=>p.k)).size,4);assert.deepEqual(hiveDamageableParts(H),ports);
  for(const p of ports){assert.equal(hiveShotBlocked(H,p.x+p.w/2,p.y+p.h/2),false);assert.equal(hiveShotBlocked(H,p.x-1,p.y+p.h/2),false);}
  assert.equal(hiveShotBlocked(H,3415,107),true);assert.equal(hiveShotBlocked(H,3500,30),true);
  ports[0].hp=0;assert.equal(hiveBroodRemaining(H),3);assert.equal(hiveDamageableParts(H).length,3);H.open=true;assert.deepEqual(hiveDamageableParts(H),[H.parts[2]]);assert.equal(hiveShotBlocked(H,3415,107),false);
});

test('四个孵化嘴错开预警和吐怪，死亡、核心开启、冻结与数量上限不会继续生成',()=>{
  const H=boss(),children=[],sources=[];let time=0;
  for(let i=0;i<270;i++){time+=1/60;const born=advanceHiveBrood(H,1/60,children,{active:true});for(const e of born)sources.push([e.from,time]);children.push(...born);}
  assert.deepEqual(sources.map(s=>s[0]),['hive-eye','hive-maw','hive-broodTR','hive-broodBR']);for(let i=1;i<4;i++)assert.ok(sources[i][1]-sources[i-1][1]>.85);
  const before=JSON.stringify(H);assert.deepEqual(advanceHiveBrood(H,2,children,{active:false}),[]);assert.equal(JSON.stringify(H),before);
  for(const flag of ['open','dead']){H[flag]=true;assert.deepEqual(advanceHiveBrood(H,2,children,{active:true}),[]);H[flag]=false;assert.equal(JSON.stringify(H),before);}
  H.parts[0].hp=0;for(let i=0;i<360;i++){const born=advanceHiveBrood(H,1/60,[],{active:true});assert.ok(born.every(e=>e.from!=='hive-eye'));}
  const full=Array.from({length:HIVE_BROOD.limit},()=>({t:'hiveHatchling'}));for(const p of hiveBroodParts(H)){p.hp=12;p.phase='opening';p.phaseT=0;}assert.deepEqual(advanceHiveBrood(H,1/60,full,{active:true}),[]);
});

test('上方幼体向下吐出，下方幼体向上吐出，有限追踪后离场；四帧只改变口部和触须',()=>{
  const ports=hiveBroodParts(boss()),top=createHiveHatchling(ports[0]),bottom=createHiveHatchling(ports[1]);assert.ok(top.vy>0&&bottom.vy<0);assert.deepEqual({x:top.x,y:top.y},hiveBroodMouth(ports[0]));
  advanceHiveHatchling(top,{x:3300,y:176},.1,3116);advanceHiveHatchling(bottom,{x:3300,y:176},.1,3116);assert.ok(top.y>40);assert.ok(bottom.y<152);assert.equal(top.dead,undefined);assert.deepEqual(hiveHatchlingBox(top),{x:top.x-7,y:top.y-6,w:14,h:12});
  const frames=new Set();for(let i=0;i<60;i++){top.age=i/60;frames.add(hiveHatchlingFrame(top));}assert.equal(frames.size,4);
  const images=[],image={naturalWidth:1254,naturalHeight:1254},g=new Proxy({drawImage(...args){images.push(args);}},{get:(o,k)=>o[k]||(()=>{})});const art={g,images:{hiveHatchling:image},loaded:new Set(['hiveHatchling'])};
  for(let i=0;i<4;i++)drawHiveHatchling(art,{x:100,y:80,age:i/8,phase:0});assert.equal(images.length,4);for(const a of images)assert.deepEqual(a.slice(5),[100-627*.034/2,80-627*.034/2,627*.034,627*.034]);
  top.age=HIVE_BROOD.life;advanceHiveHatchling(top,null,.1,3116);assert.equal(top.dead,true);
  const png=fs.readFileSync(new URL('../..'+HIVE_HATCHLING_ASSET.replace('.webp','.png'),import.meta.url));assert.equal(png[25],6);assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1254,1254]);
});
