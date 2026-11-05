import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CEILING_PARASITE_ASSETS,CEILING_BROOD,createCeilingParasites,createFloorParasites,ceilingParasiteMouth,advanceCeilingParasite,createWhiteFloater,advanceWhiteFloater,drawCeilingNests} from '../../games/contra2026/js/ceiling-parasite.mjs';
import {StageSevenArt} from '../../games/contra2026/js/stage-seven-art.mjs';

test('天花寄生怪有张嘴预警与收口阶段，白色小怪从嘴部生成且有总量限制',()=>{
  const parent=createCeilingParasites()[0],en=[parent],phases=new Set([parent.phase]);parent.fireT=0;
  advanceCeilingParasite(parent,1/60,en,{active:true});assert.equal(parent.phase,'opening');
  for(let i=0;i<25;i++)assert.equal(advanceCeilingParasite(parent,1/60,en,{active:true}).length,0);
  let first=null;for(let i=0;i<2600;i++){
    const born=advanceCeilingParasite(parent,1/60,en,{active:true});phases.add(parent.phase);en.push(...born);if(!first&&born.length)first=born[0];
  }
  assert.deepEqual(phases,new Set(['idle','opening','spit','recover']));assert.deepEqual([first.x,first.y],Object.values(ceilingParasiteMouth(parent)));assert.equal(en.length-1,CEILING_BROOD.limit);
  const before=JSON.stringify(parent);for(let i=0;i<60;i++)advanceCeilingParasite(parent,1/60,en);assert.equal(JSON.stringify(parent),before);
  parent.dead=true;assert.deepEqual(advanceCeilingParasite(parent,5,[],{active:true}),[]);
});

test('白色怪物先从上方漂下再缓慢追向玩家，悬浮高度有界并最终离场',()=>{
  const parent=createCeilingParasites()[0],child=createWhiteFloater(parent),birth=child.y;
  for(let i=0;i<30;i++)advanceWhiteFloater(child,{x:400,y:176},1/60,320);assert.ok(child.y>birth+15);
  for(let i=0;i<400;i++){advanceWhiteFloater(child,{x:400,y:176},1/60,320);assert.ok(child.y>=27&&child.y<=165);assert.ok(Math.abs(child.vx)<=38);assert.ok(Math.abs(child.vy)<=48);}
  assert.ok(Math.abs(child.y-child.baseY)>.1);for(let i=0;i<130&&!child.dead;i++)advanceWhiteFloater(child,null,1/60,320);assert.equal(child.dead,true);
});

test('底部寄生怪朝上喷吐，漂浮怪逐步穿出地板组织，不会被高度限制瞬间传到地面上方',()=>{
  const parent=createFloorParasites()[0],top=createCeilingParasites()[0],child=createWhiteFloater(parent),initial=child.baseY;
  assert.equal(parent.mount,'floor');assert.ok(parent.y>176&&parent.y<216);assert.equal(child.y,parent.y-8);assert.ok(child.vy<0);assert.ok(createWhiteFloater(top).vy>0);assert.notEqual(parent.fireT,top.fireT);
  advanceWhiteFloater(child,{x:710,y:176},1/60,600);assert.ok(child.baseY>initial-1);assert.ok(child.baseY>176);assert.equal(child.emerged,false);
  let previous=child.baseY;for(let i=0;i<80;i++){
    advanceWhiteFloater(child,{x:710,y:176},1/60,600);assert.ok(Math.abs(child.baseY-previous)<1,'vertical motion stays continuous at emergence');previous=child.baseY;
  }
  assert.ok(child.y<176);assert.equal(child.emerged,true);assert.ok(child.baseY<=162);
  const en=[parent,top,...Array.from({length:CEILING_BROOD.limit},()=>createWhiteFloater(top))];parent.fireT=0;
  for(let i=0;i<180;i++)assert.equal(advanceCeilingParasite(parent,1/60,en,{active:true}).length,0,'ceiling and floor share the same brood cap');
});

test('寄生怪和白色怪物均保留原生透明四帧图集，绘制不改变中心或伸缩单帧',()=>{
  const gradient={addColorStop(){}},draws=[],g=new Proxy({createLinearGradient:()=>gradient,drawImage(...a){draws.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{}});
  const art={g,state:{freezeT:0},loaded:new Set(Object.keys(CEILING_PARASITE_ASSETS)),images:Object.fromEntries(Object.keys(CEILING_PARASITE_ASSETS).map(k=>[k,{naturalWidth:1254,naturalHeight:1254}]))};
  const loader=new StageSevenArt({autoLoad:false,createCanvas:()=>({getContext:()=>({})}),baseArt:{}});
  for(const [key,url]of Object.entries(CEILING_PARASITE_ASSETS)){
    const png=fs.readFileSync(new URL('../..'+url.replace('.webp','.png'),import.meta.url));assert.equal(png[25],6);assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1254,1254]);assert.equal(loader.assets[key],url);
    const poses=[];for(let i=0;i<4;i++){
      const e=key==='ceilingParasite'?{...createCeilingParasites()[0],phase:['idle','opening','spit','recover'][i],phaseT:i===1?.5:0}:{...createWhiteFloater(createCeilingParasites()[0]),age:(i+.1)/7,phase:0};
      const before=JSON.stringify(e);StageSevenArt.prototype.enemy.call(art,e);const d=draws.at(-1);poses.push(d.slice(1,5));assert.equal(d[7],d[8]);assert.equal(d[7],627*(key==='ceilingParasite'?.045:.035));assert.equal(JSON.stringify(e),before);
    }
    assert.equal(new Set(poses.map(p=>p.join(','))).size,4);
  }
  art.loaded.add('terrain');art.images.terrain={naturalWidth:2206,naturalHeight:451};draws.length=0;drawCeilingNests(art,320);assert.equal(draws.length,2,'ceiling tissue is independent of live enemy entities');for(const d of draws)assert.ok(d.slice(1).every(Number.isFinite));
});
