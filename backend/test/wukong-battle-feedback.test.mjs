import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {martialHitEffect,addMartialHit,drawMartialHit} from '../../games/wukong/js/wukong-impact.mjs';
import {WukongBattleAudio,DEATH_VOICE_URLS,queueEnemyCry} from '../../games/wukong/js/wukong-battle-audio.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';
import {drawStaffTechnique,staffVfxState} from '../../games/wukong/js/wukong-staff-vfx.mjs';
import {advanceStaff,staffGeometry} from '../../games/wukong/js/wukong-combat.mjs';

function sound(){
  const sources=[],decoded=[],fetched=[],output={},context={state:'running',currentTime:5,destination:{}};
  const node=()=>({connect(){},disconnect(){}});
  Object.assign(context,{
    async decodeAudioData(bytes){const buffer={duration:.78,voice:new Uint8Array(bytes)[0]};decoded.push(buffer);return buffer;},
    createBufferSource(){const source={...node(),playbackRate:{value:1},start(){this.started=true;},stop(){this.stopped=true;this.onended?.();}};sources.push(source);return source;},
    createGain:()=>({...node(),gain:{value:0}}),createStereoPanner:()=>({...node(),pan:{value:0}})
  });
  let enabled=true;
  const audio=new WukongBattleAudio({getContext:()=>context,getOutput:()=>output,enabled:()=>enabled,fetchAudio:async url=>{
    fetched.push(url);return {ok:true,arrayBuffer:async()=>new Uint8Array([DEATH_VOICE_URLS.indexOf(url)+1,7,8]).buffer};
  }});
  return {audio,sources,decoded,fetched,context,mute(){enabled=false;},unmute(){enabled=true;}};
}
const settled=()=>new Promise(resolve=>setImmediate(resolve));

test('命中爆点固定在目标身体范围内，重击/阵亡持续更长，使用稳定种子不改随机模拟',()=>{
  const target={x:100,y:110,w:12,h:28},base={x:90,y:150,target,seed:9};
  const light=martialHitEffect(base),heavy=martialHitEffect({...base,heavy:true}),dead=martialHitEffect({...base,killed:true});
  assert.equal(light.x,100);assert.equal(light.y,138);assert.ok(heavy.life>light.life&&dead.life>heavy.life);
  assert.deepEqual(martialHitEffect(base),light);assert.equal(light.seed,9);
});
test('同帧近处命中特效合并，重击可升级爆点，多人帮战最多保留24个活动爆点',()=>{
  const fx=[];const first=addMartialHit(fx,{x:10,y:20});
  assert.equal(addMartialHit(fx,{x:11,y:21,killed:true,heavy:true}),first);assert.equal(first.killed,true);assert.equal(fx.length,1);
  for(let i=0;i<40;i++)addMartialHit(fx,{x:100+i*10,y:40,seed:i});
  assert.equal(fx.filter(f=>!f.dead).length,24);
});
test('爆点绘制包含热核、交叉弧光、扩散圈及飞散火花，绘制不写回效果或目标',()=>{
  const calls=[],gradient={addColorStop(){}},g=new Proxy({globalAlpha:1,createRadialGradient:()=>gradient,createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args])});
  const f=martialHitEffect({x:10,y:20,killed:true,seed:7}),before=JSON.stringify(f);f.t=.05;const sample=JSON.stringify(f);
  drawMartialHit({g,disc(...a){calls.push(['core',...a]);}},f);
  assert.equal(JSON.stringify(f),sample);assert.ok(calls.some(c=>c[0]==='ellipse'));assert.ok(calls.filter(c=>['quadraticCurveTo','bezierCurveTo'].includes(c[0])).length>=2);
  assert.ok(calls.filter(c=>c[0]==='lineTo').length>=20);assert.ok(calls.some(c=>c[0]==='core'));assert.ok(before.includes('martialImpact'));
});
test('三段真人惨叫为本地Ogg，合计小于30KB，并保存作者来源及CC0许可',()=>{
  let total=0;for(const url of DEATH_VOICE_URLS){const data=fs.readFileSync(new URL('../..'+url,import.meta.url));assert.equal(data.subarray(0,4).toString(),'OggS');total+=data.length;}
  assert.ok(total<30000);const credits=fs.readFileSync(new URL('../../games/wukong/assets/audio/CREDITS.md',import.meta.url),'utf8');assert.match(credits,/HaelDB/);assert.match(credits,/CC0/);
});
test('重复预载复用请求与解码，资源任务失败不会阻塞第一关，其后可重试恢复',async()=>{
  const s=sound();await Promise.all([s.audio.load(),s.audio.load()]);await s.audio.load();
  assert.equal(s.fetched.length,3);assert.equal(s.decoded.length,3);assert.equal(s.audio.inspect().decoded,3);
  let bad=true;const a=new WukongBattleAudio({fetchAudio:async()=>{if(bad)throw Error('offline');return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};}});
  await a.resourceJob().load({});assert.equal(a.inspect().failed.length,3);bad=false;await a.load({retry:true});assert.equal(a.inspect().failed.length,0);
});
test('每次阵亡播放不同人声，巨灵神较低沉，三路并发上限避免大量敌人同时阵亡过载',async()=>{
  const s=sound();await s.audio.load();for(let i=0;i<5;i++)await s.audio.playDeath(i===4?'giant':'guard');
  assert.deepEqual(s.sources.slice(0,3).map(s=>s.buffer.voice),[1,2,3]);assert.equal(s.audio.inspect().active,3);assert.equal(s.audio.inspect().played,5);
  assert.equal(s.sources[0].stopped,true);assert.ok(s.sources[4].playbackRate.value<s.sources[3].playbackRate.value);
  s.audio.stopAll();assert.equal(s.audio.inspect().active,0);assert.ok(s.sources.every(s=>s.stopped));
});
test('同一个联机阵亡事件反复收到只叫一次，静音事件不在恢复音量后补播，暂停停止当前叫声',async()=>{
  const s=sound();await s.audio.load();const world={t:2,fx:[]},e={x:200,y:144};queueEnemyCry(world,e);
  s.audio.observe(world.fx,{clock:1});await settled();s.audio.observe(world.fx,{clock:1.02});await settled();assert.equal(s.sources.length,1);
  s.mute();world.t++;queueEnemyCry(world,e);s.audio.observe(world.fx,{clock:1.04});await settled();s.unmute();s.audio.observe(world.fx,{clock:1.06});await settled();assert.equal(s.sources.length,1);
  s.audio.stopAll();assert.equal(s.audio.inspect().active,0);s.context.state='suspended';assert.equal(await s.audio.playDeath(),false);
});
test('阵亡事件可随快照在另一客户端播放，新一局清空旧记录且不依赖战斗随机数',async()=>{
  const world={t:50,fx:[]};const first=queueEnemyCry(world,{x:300,y:144},'guard');const second=queueEnemyCry(world,{x:300,y:144},'fly');
  assert.notEqual(first.id,second.id);const [remote]=unpackWorld(packWorld([world]));const s=sound();await s.audio.load();s.audio.observe(remote.fx,{clock:4});await settled();
  assert.equal(s.audio.inspect().played,2);s.audio.observe(remote.fx,{clock:0});await settled();assert.equal(s.audio.inspect().played,4);
});

test('棍招特效区分刺、挑、低扫、绕顶、舞花和横扫，按起手与收势出现，不依赖随机数',()=>{
  for(const [controls,expected]of [[{right:true},'thrust'],[{up:true},'lift'],[{down:true},'low'],
    [{right:true,up:true},'wheel'],[{right:true,down:true},'sweep']]){
    const p={heroFrames:true,pid:1,x:200,y:144,face:1,weapon:'rifle',onGround:true,cool:0};
    advanceStaff(p,{...controls,fire:true,fireEdge:true},1/60,{playerActions:true,random:()=>{throw Error('指定特效不抽随机数');}});
    assert.equal(staffVfxState(p),null);p.staff.t=p.staff.duration*.42;
    assert.equal(staffVfxState(p).family,expected);const before=JSON.stringify(p),calls=[],gradient={addColorStop(){}};
    const g=new Proxy({globalAlpha:1,createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a])});
    drawStaffTechnique({g,scale:3},p,staffGeometry);
    assert.equal(JSON.stringify(p),before);assert.ok(calls.some(c=>c[0]==='stroke'));
    if(expected==='low'||expected==='wheel')assert.ok(calls.some(c=>c[0]==='ellipse'),'贴地/绕顶使用各自投影');
    p.staff.t=p.staff.duration;assert.equal(staffVfxState(p),null);
    p.staff.kind='qiCast';p.staff.t=.2;assert.equal(staffVfxState(p),null);
  }
});

test('招式命中形态可随联机事件传递，突刺、轮转、低扫各自绘制接触光，绘制不改事件',()=>{
  for(const form of ['thrust','lift','low','wheel','flower','sweep']){
    const f=martialHitEffect({x:20,y:30,form,heavy:true,seed:7});f.t=.04;
    const [copy]=unpackWorld(packWorld([f]));assert.equal(copy.form,form);
    const before=JSON.stringify(copy),calls=[],gradient={addColorStop(){}};
    const g=new Proxy({globalAlpha:1,createRadialGradient:()=>gradient,createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a])});
    drawMartialHit({g,disc(){},scale:3},copy);assert.equal(JSON.stringify(copy),before);
    assert.ok(calls.filter(c=>c[0]==='stroke').length>5);
  }
});
