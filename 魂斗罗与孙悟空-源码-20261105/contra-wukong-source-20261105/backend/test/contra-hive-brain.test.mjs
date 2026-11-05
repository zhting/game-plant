import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hiveBrainBounds,drawHiveBrainBoss,HIVE_RIB_ART} from '../../games/contra2026/js/hive-brain.mjs';
import {createHiveBrainParts,hiveBroodParts} from '../../games/contra2026/js/hive-brood.mjs';
import {createAlienGuardian,alienGuardianBox,alienGuardianWallBox,alienGuardianArtBox,alienGuardianMouth,drawAlienGuardianBody,drawAlienGuardianHead} from '../../games/contra2026/js/stage-eight-guardian.mjs';

test('高清大脑有原生透明通道，主体围绕原核心中心绘制并保持相同比例',()=>{
  const png=fs.readFileSync(new URL('../../games/contra2026/assets/stage7/alien-hive-brain-v1.png',import.meta.url));
  assert.equal(png[25],6);assert.equal(png.readUInt32BE(16),1355);assert.equal(png.readUInt32BE(20),1161);
  const rib=fs.readFileSync(new URL('../../games/contra2026/assets/stage7/alien-hive-rib-v1.png',import.meta.url));assert.equal(rib[25],6);assert.deepEqual([rib.readUInt32BE(16),rib.readUInt32BE(20)],[1942,809]);
  const [x,y,w,h]=HIVE_RIB_ART.bounds;assert.ok(x>=0&&y>=0&&x+w<=1942&&y+h<=809);
  const core={x:3390,y:82,w:50,h:50},image={naturalWidth:1355,naturalHeight:1161},b=hiveBrainBounds(core,image);
  assert.equal(b.x+b.w/2,core.x+25);assert.equal(b.y+b.h/2,core.y+25);assert.ok(Math.abs(b.w/b.h-1355/1161)<1e-10);
});

function surface(){
  const images=[],curves=[],rotations=[],scales=[],gradient={addColorStop(){}};
  const g=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,drawImage(...a){images.push(a);},bezierCurveTo(...a){curves.push(a);},rotate(a){rotations.push(a);},scale(...a){scales.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  const art={g,state:{camX:3116,time:10},images:{brain:{naturalWidth:1355,naturalHeight:1161},brainRib:{naturalWidth:1942,naturalHeight:809},hiveWall:{naturalWidth:1672,naturalHeight:940},ceilingParasite:{naturalWidth:1254,naturalHeight:1254}},loaded:new Set(['brain','brainRib','hiveWall','ceilingParasite']),rect(){},line(){},disc(){},light(){}};
  return {art,images,curves,rotations,scales};
}

test('大脑上下各两个独立孵化机关和曲面护骨分别绘制，开闭不修改受击部位',()=>{
  const H={x:3350,openK:0,beatK:.5,tissueTime:2,parts:createHiveBrainParts(3350)},before=JSON.stringify(H.parts);
  const closed=surface();drawHiveBrainBoss(closed.art,H);assert.equal(closed.images.length,14);assert.ok(closed.images.some(a=>a[0]===closed.art.images.brain));
  assert.equal(closed.images.filter(a=>a[0]===closed.art.images.ceilingParasite).length,4);assert.equal(closed.scales.filter(a=>a[0]===1.2&&a[1]===1.2).length,2);assert.equal(closed.scales.filter(a=>a[0]===1.2&&a[1]===-1.2).length,2);
  assert.equal(closed.images.filter(a=>a[0]===closed.art.images.brainRib).length,8);
  const open=surface();drawHiveBrainBoss(open.art,{...H,open:true,openK:1});assert.notDeepEqual(closed.rotations,open.rotations);assert.equal(JSON.stringify(H.parts),before);assert.equal(hiveBroodParts(H).filter(p=>p.row==='top').length,2);assert.equal(hiveBroodParts(H).filter(p=>p.row==='bottom').length,2);
  const dead=surface();drawHiveBrainBoss(dead.art,{...H,dead:true,parts:H.parts.map(p=>({...p,hp:0}))});assert.equal(dead.rotations.length,0);assert.equal(dead.images.length,6);
});

test('中途守卫拆为落地的半高墙和右上方探出的头颈，原洞壁不再被整面柱子覆盖',()=>{
  const {art,images}=surface();art.images.guardianWall={naturalWidth:1254,naturalHeight:1254};art.images.guardian={naturalWidth:1356,naturalHeight:1015};art.loaded.add('guardianWall');art.loaded.add('guardian');
  const guardian=createAlienGuardian(),wall=alienGuardianWallBox(guardian),head=alienGuardianBox(guardian),full=alienGuardianArtBox(guardian),mouth=alienGuardianMouth(guardian);
  drawAlienGuardianBody(art,guardian);drawAlienGuardianHead(art,guardian);
  assert.equal(images.length,2);assert.deepEqual(images[0].slice(5),[wall.x,wall.y,wall.w,wall.h]);assert.equal(wall.y+wall.h,176);assert.equal(wall.h,72);assert.ok(wall.x+wall.w<=1100,'wall base remains on solid ground before the gap');
  assert.equal(images.some(a=>a[0]===art.images.hiveWall),false);assert.deepEqual(images[1].slice(1),[full.x,full.y,full.w,full.h]);assert.ok(full.y<0);assert.ok(full.x>wall.x);assert.ok(full.x+full.w>wall.x+wall.w+100);
  assert.ok(head.y>0&&head.y+head.h<176);assert.ok(mouth.x>=head.x&&mouth.x<head.x+head.w&&mouth.y>=head.y&&mouth.y<head.y+head.h);
});
