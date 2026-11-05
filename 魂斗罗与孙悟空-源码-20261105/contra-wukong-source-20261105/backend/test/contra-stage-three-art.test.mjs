import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { StageThreeArt, GUARDIAN_ART, guardianRect, STAGE_THREE_ASSETS, SUPPLY_HATCH_ART } from '../../games/contra2026/js/stage-three-art.mjs';
import { STAGE_THREE, WATERFALL_GATE, makeWaterfallBoss } from '../../games/contra2026/js/stage-three-layout.mjs';
import { summitStars } from '../../games/contra2026/js/stage-three-waterfall.mjs';
import { FLAME_JET_FRAMES } from '../../games/contra2026/js/flame-jet-art.mjs';

test('第三关百叶门沿内槽升起，框体保持原比例和固定位置，开启后才显示道具字母',()=>{
  const states=[];
  for(const [open,st]of [[false,1.5],[true,1.49],[true,1.2]]){
    const draws=[],clips=[],letters=[],g=new Proxy({drawImage:(...a)=>draws.push(a),rect:(...a)=>clips.push(a)},{get:(o,k)=>k in o?o[k]:()=>{}});
    const art={g,loaded:new Set(['supplyHatch']),images:{supplyHatch:{}},hudText:t=>letters.push(t)};
    StageThreeArt.prototype.supplyWindow.call(art,{x:190,y:60,item:'S',open,st,flash:0});states.push({draws,clips,letters});
    const frame=draws[0],a=SUPPLY_HATCH_ART.frame;assert.ok(Math.abs(frame[7]/frame[8]-a[2]/a[3])<1e-10);assert.equal(frame[6]+frame[8],64);
  }
  for(const state of states.slice(1))assert.deepEqual(state.draws[0].slice(1),states[0].draws[0].slice(1));
  assert.deepEqual(states[0].letters,[]);assert.deepEqual(states[1].letters,[]);assert.deepEqual(states[2].letters,['S']);
  assert.deepEqual(states[1].clips,states[0].clips);assert.equal(states[2].draws.length,1);
  assert.ok(states[1].draws[1][6]<states[0].draws[1][6]);assert.equal(states[0].draws[1][6],states[0].clips[0][1]);
});

test('第三关新 Boss 使用原生宽幅透明图，等比例缩放且始终落在山顶地面',()=>{
  for(const asset of ['guardian','guardianWreck']){
    const bytes=fs.readFileSync(new URL('../..'+STAGE_THREE_ASSETS[asset],import.meta.url));
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert.equal(bytes.toString('ascii',12,16),'VP8X');
    assert.ok(bytes[20]&0x10,'transparent sprite');
    const width=bytes.readUIntLE(24,3)+1,height=bytes.readUIntLE(27,3)+1;
    assert.equal(width,GUARDIAN_ART.width);assert.equal(height,1254);
    assert.ok(GUARDIAN_ART.height<=height);
    if(asset==='guardian')assert.equal(GUARDIAN_ART.openY+GUARDIAN_ART.openHeight,height);
  }
  const rect=guardianRect();
  assert.ok(Math.abs(rect.w/rect.h-GUARDIAN_ART.width/GUARDIAN_ART.height)<1e-10);
  assert.equal(rect.y+rect.h,STAGE_THREE.summit);
  assert.ok(rect.x>=WATERFALL_GATE.x&&rect.x+rect.w<=WATERFALL_GATE.x+WATERFALL_GATE.w);
  const core=makeWaterfallBoss().parts[2],jaw=GUARDIAN_ART.jaw;
  assert.ok(Math.abs(core.x+core.w/2-(rect.x+jaw.x/GUARDIAN_ART.width*rect.w))<1e-8);
  assert.ok(Math.abs(core.y+core.h/2-(rect.y+jaw.y/GUARDIAN_ART.height*rect.h))<jaw.ry/GUARDIAN_ART.height*rect.h*.88);
});

test('喷火桥八帧透明火焰图集裁切完整，足够支撑大屏细节',()=>{
  const file=new URL('../..'+STAGE_THREE_ASSETS.flameJets,import.meta.url),webp=fs.readFileSync(file);
  assert.equal(webp.toString('ascii',8,12),'WEBP');
  const png=fs.readFileSync(new URL(file.href.replace(/\.webp$/,'.png'))),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  assert.equal(png[25],6);assert.equal(FLAME_JET_FRAMES.length,8);
  for(const [x,y,w,h]of FLAME_JET_FRAMES){assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);assert.ok(h>=384&&w>=192);}
});

test('第三关夜空星点固定，亮度独立闪烁且不全黑或同步明灭',()=>{
  const first=summitStars(0),later=summitStars(2.7);
  assert.deepEqual(first.map(({x,y,size})=>[x,y,size]),later.map(({x,y,size})=>[x,y,size]));
  assert.ok(first.some((s,i)=>later[i].alpha>s.alpha+.1));
  assert.ok(first.some((s,i)=>later[i].alpha<s.alpha-.1));
  for(const star of [...first,...later]){
    assert.ok(star.x>0&&star.x<384&&star.y>STAGE_THREE.top&&star.y<STAGE_THREE.top+122);
    assert.ok(star.alpha>=.18&&star.alpha<=.9);
  }
});

test('Boss 张嘴只显示原画，不在嘴里添加红点',()=>{
  const overlays=[],frames=[],boss=makeWaterfallBoss();boss.open=true;boss.active=true;
  const art={g:new Proxy({drawImage:(...args)=>frames.push(args)},{get:(o,k)=>k in o?o[k]:()=>{}}),scale:4,state:{camY:STAGE_THREE.top},
    guardianFrame:pose=>({pose,width:1254}),guardianArm(){},disc:(...args)=>overlays.push(args),light:(...args)=>overlays.push(args)};
  StageThreeArt.prototype.guardian.call(art,boss);
  assert.equal(frames.length,1);assert.equal(frames[0][0].pose,'open');assert.equal(overlays.length,0);
});

test('角色进洞全过程保持原尺寸，放大状态同样不随入洞进度缩小',()=>{
  for(const giantT of [0,5])for(const t of [0,.2,.4,.65,.79]){
    const scales=[],actors=[],g=new Proxy({globalAlpha:1,scale:(x,y)=>scales.push([x,y])},{get:(o,k)=>k in o?o[k]:()=>{}});
    const art={g,state:{t:123,fx:[]},scale:4,snap:n=>n,hdActors:{draw:(_g,p)=>{actors.push(p);return true;}}};
    StageThreeArt.prototype.actor.call(art,{x:192,y:STAGE_THREE.summit,face:1,giantT,summitEntry:{t}},'blue');
    assert.equal(actors.length,1);assert.equal(actors[0].x,192);assert.equal(actors[0].y,STAGE_THREE.summit);
    assert.deepEqual(scales,[[giantT?2:1,giantT?2:1]],'入洞只淡出，不叠加缩放');
  }
});

test('第三关桥上火焰的绘制位置与移动碰撞框一致',async()=>{
  const {FLAME_BRIDGES,flameJetBoxes}=await import('../../games/contra2026/js/stage-three-layout.mjs');
  const bridge=FLAME_BRIDGES[0],image={},draws=[],gradient={addColorStop(){}};
  const g=new Proxy({globalAlpha:1,createRadialGradient:()=>gradient,drawImage:(...args)=>draws.push(args)},
    {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  const art={g,state:{camY:bridge.y-80},loaded:new Set(['flameJets']),images:{flameJets:image}};
  for(const time of [2.55,3.3,4.3,5.3,6.05]){
    draws.length=0;StageThreeArt.prototype.flames.call(art,time);
    const centers=draws.map(args=>args[5]+args[7]/2);
    const boxes=flameJetBoxes(time).filter(b=>Math.abs(b.y+b.h-bridge.y)<1e-8);
    assert.equal(centers.length,4);assert.equal(boxes.length,2);
    for(let i=0;i<2;i++)for(const center of centers.slice(i*2,i*2+2))assert.ok(Math.abs(center-(boxes[i].x+boxes[i].w/2))<1e-8);
  }
});

test('第三关敌人双脚贴合悬浮飞行器甲板，向上枪口与子弹位置一致',()=>{
  const calls=[],image={},g=new Proxy({globalAlpha:1,drawImage:(...a)=>calls.push(['image',...a])},
    {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  const art={g,state:{time:1,freezeT:0},loaded:new Set(['enemyHovercraft']),images:{enemyHovercraft:image},
    light(){},line(){},rect(){},disc(){},muzzle:(...a)=>calls.push(['muzzle',...a]),actor:(...a)=>calls.push(['actor',...a])};
  const enemy={t:'waterAmbush',x:218,y:160,warning:0,shotFlash:.1};
  StageThreeArt.prototype.waterAmbush.call(art,enemy);
  const craft=calls.find(c=>c[0]==='image'),actor=calls.find(c=>c[0]==='actor'),muzzle=calls.find(c=>c[0]==='muzzle');
  assert.equal(craft[3],enemy.y,'craft top is the feet anchor');assert.equal(actor[1].y,enemy.y);
  assert.deepEqual(muzzle.slice(1),[enemy.x+7,enemy.y-35]);assert.ok(calls.indexOf(craft)<calls.indexOf(actor));
  const webp=fs.readFileSync(new URL('../..'+STAGE_THREE_ASSETS.enemyHovercraft,import.meta.url));
  assert.equal(webp.toString('ascii',8,12),'WEBP');assert.ok(webp[20]&0x10,'transparent hovercraft asset');
});
