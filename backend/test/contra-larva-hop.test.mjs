import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LARVA_HOP_ART,LARVA_HOP_ASSET,larvaHopFrame} from '../../games/contra2026/js/larva-hop.mjs';
import {StageSevenArt} from '../../games/contra2026/js/stage-seven-art.mjs';

test('幼体六姿态图集保留原生 RGBA 尺寸，分格和落脚锚点均位于正确单元内',()=>{
  const png=fs.readFileSync(new URL('../../games/contra2026/assets/stage7/alien-larva-hop-v1.png',import.meta.url));assert.equal(png[25],6);assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1536,1024]);
  const art=new StageSevenArt({autoLoad:false,createCanvas:()=>({getContext:()=>({})}),baseArt:{}});assert.equal(art.assets.larva,LARVA_HOP_ASSET);
  assert.equal(new Set(LARVA_HOP_ART.frames.map(f=>f.bounds.join(','))).size,6);
  for(const {bounds:[x,y,w,h],anchor:[ax,ay]}of LARVA_HOP_ART.frames){assert.ok(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);assert.ok(ax>=0&&ax<w&&ay>0&&ay<h);}
});

test('实际幼体渲染选取对应屈腿单元，所有姿态保持同一比例，落地后朝向及命中闪光正确',()=>{
  const states=[{on:true,hopT:1},{on:true,hopT:.1},{on:false,hopAirT:.03,vy:-180},{on:false,hopAirT:.15,vy:-40},{on:false,hopAirT:.4,vy:120},{on:true,landT:.1,hopT:.8}];
  for(const direction of [-1,1])for(const [i,state]of states.entries()){
    const draws=[],flips=[],g=new Proxy({save(){},restore(){},translate(){},scale(...a){flips.push(a);},drawImage(...a){draws.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{throw new Error('Unexpected canvas call: '+k);}});
    const image={naturalWidth:1536,naturalHeight:1024},art={g,loaded:new Set(['larva']),images:{larva:image},state:{freezeT:0}};
    const e={t:'larva',x:100,y:176,vx:0,face:direction,flash:.1,...state},before=JSON.stringify(e);
    assert.equal(larvaHopFrame(e),i);StageSevenArt.prototype.enemy.call(art,e);assert.equal(JSON.stringify(e),before);assert.equal(draws.length,1);assert.deepEqual(draws[0].slice(1,5),LARVA_HOP_ART.frames[i].bounds);
    assert.deepEqual(flips,[[direction<0?1:-1,1]]);assert.equal(draws[0][7],512*LARVA_HOP_ART.scale);assert.equal(draws[0][8],512*LARVA_HOP_ART.scale);assert.equal(g.filter,'brightness(1.8)');
  }
});
