import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ReferenceMusic, StageMusicSession, REFERENCE_TRACKS, referenceTrackForScene, musicForScene, stageMusicOptions, stageMusicPool, normalizeStageMusic } from '../../games/contra2026/js/reference-music.mjs';
import { musicRecord } from '../../games/contra2026/js/music-records.mjs';

function player(fetchAudio=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})){
  const sources=[],output={},context={currentTime:0,decodeAudioData:async()=>({duration:52}),createBufferSource(){
    const source={connect(to){this.output=to;},start(when,offset){this.offset=offset;},stop(){this.stopped=true;},disconnect(){}};
    sources.push(source);return source;
  }};
  return {music:new ReferenceMusic({getContext:()=>context,getOutput:()=>output,fetchAudio}),sources,context,output};
}

test('随机播放仅从对应关卡的可听音乐中选择，偏好可独立保存',()=>{
  const saved=normalizeStageMusic({1:'random',2:'random',3:'random',16:'random'});
  assert.deepEqual(normalizeStageMusic(JSON.parse(JSON.stringify(saved))),saved);
  assert.equal(stageMusicPool(1).length,7);assert.equal(stageMusicPool(2).length,2);
  for(let stage=1;stage<=16;stage++){
    const pool=stageMusicPool(stage).map(({value})=>value);
    assert.ok(!pool.includes('random')&&!pool.includes('off'));
    if(stage>=3)assert.deepEqual(pool,['original']);
    for(let index=0;index<pool.length;index++){
      const session=new StageMusicSession(()=>index/pool.length+.001);
      const track=session.forScene({mode:'play',stage},{[stage]:'random'});
      assert.equal(session.inspect().choice,pool[index]);assert.ok(track);
    }
  }
});

test('一局只抽选一次：暂停、房间推进、首领出现及重复同步保持曲目，重新入关再抽选',()=>{
  let draws=0;const session=new StageMusicSession(()=>draws++===0?.49:.8), choices={1:'random'};
  session.begin(1);
  session.forScene({mode:'title',stage:1},choices);
  session.forScene({mode:'cine',stage:1,cine:{kind:'open'}},choices);
  assert.equal(draws,0);
  const state={mode:'intro',stage:1,boss:{}};
  assert.equal(session.forScene(state,choices),'stage1epic');
  for(const mode of ['play','pause','settings','play']){
    state.mode=mode;state.boss.active=true;session.forScene(state,choices);
  }
  for(let i=0;i<50;i++)session.forScene({...state,room:i},choices);
  assert.equal(draws,1);assert.equal(session.inspect().choice,'epic');
  session.begin(1);assert.equal(session.forScene(state,choices),'stage1cyberpunk');
  assert.equal(draws,2);assert.equal(choices[1],'random');
});

test('随机选到第二关原声后，中枢按原规则换曲；双人听歌状态彼此独立',()=>{
  const host=new StageMusicSession(()=>0), guest=new StageMusicSession(()=>.99), choices={2:'random'};
  const state={mode:'intro',stage:2,base:{room:0,def:{}}};
  assert.equal(host.forScene(state,choices),'stage2');assert.equal(guest.forScene(state,choices),'synth');
  state.mode='play';state.base.room=1;
  assert.equal(host.forScene(state,choices),'stage2');
  state.base.def={boss:'eye'};
  assert.equal(host.forScene(state,choices),'stage2boss');assert.equal(guest.forScene(state,choices),'synth');
  assert.equal(host.inspect().choice,'original');assert.equal(guest.inspect().choice,'chiptune');
  assert.deepEqual(choices,{2:'random'});
  host.invalidate(2);assert.equal(host.forScene(state,{2:'off'}),null);
});

test('每首音乐和关卡原声都有独立可交付的唱片图，随机与静音也有专用图',()=>{
  const originals=new Set(),firstStage=new Set();
  for(let stage=1;stage<=16;stage++){
    originals.add(musicRecord(stage,'original').art);
    for(const {value} of stageMusicOptions(stage)){
      const record=musicRecord(stage,value);
      const svg=fs.readFileSync(new URL('../..'+record.art,import.meta.url),'utf8');
      assert.match(svg,/<svg[^>]+viewBox="0 0 512 512"/);assert.match(svg,/<title>[^<]+独立唱片/);
      assert.ok(record.title&&record.description&&record.edition);
      if(stage===1)firstStage.add(record.art);
    }
  }
  assert.equal(originals.size,16);assert.equal(firstStage.size,stageMusicOptions(1).length);
});

test('默认加载器保留浏览器原生 fetch 的全局接收者',async(t)=>{
  const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
  globalThis.fetch=async function(){assert.equal(this,globalThis);return{ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};};
  const {context,output,sources}=player();
  const music=new ReferenceMusic({getContext:()=>context,getOutput:()=>output});
  assert.equal(await music.play('title'),true);assert.equal(sources.length,1);
});

test('参考音轨文件可交付，标题、片头、第一关与第二关走廊和中枢按场景选择',()=>{
  for(const track of Object.values(REFERENCE_TRACKS)){
    const file=new URL('../..'+track.url,import.meta.url),bytes=fs.readFileSync(file);
    assert.equal(bytes.toString('ascii',0,4),'OggS');assert.ok(bytes.length>30000);
  }
  assert.equal(referenceTrackForScene({mode:'title',stage:4}),'title');
  assert.equal(referenceTrackForScene({mode:'cine',stage:1,cine:{kind:'open'}}),'opening');
  assert.equal(referenceTrackForScene({mode:'play',stage:1,boss:{active:true}}),'stage1');
  assert.equal(referenceTrackForScene({mode:'intro',stage:2,base:{}}),'stage2');
  assert.equal(referenceTrackForScene({mode:'play',stage:2,base:{room:1,def:{}}}),'stage2');
  assert.equal(referenceTrackForScene({mode:'play',stage:2,base:{room:3,def:{boss:'eye'}}}),'stage2boss');
  for(const state of [{mode:'play',stage:5},{mode:'play',stage:2,base:{dead:true}},{mode:'pause',stage:2},{mode:'clear',stage:2},{mode:'play',stage:1,boss:{dead:true}},{mode:'pause',stage:1},{mode:'clear',stage:1}])assert.equal(referenceTrackForScene(state),null);
});

test('第四关只使用对应原声，进入双生中枢切曲、暂停续播、摧毁后停止',async()=>{
  const {music,sources,context}=player(),session=new StageMusicSession(()=>0),choices={4:'random'};
  const state={mode:'intro',stage:4,base:{room:0,def:{}}};
  await music.play(session.forScene(state,choices));state.mode='play';state.base.room=3;
  await music.play(session.forScene(state,choices));assert.equal(sources.length,1);assert.equal(music.inspect().track,'stage4');
  context.currentTime=6;music.pause();context.currentTime=20;await music.play(session.forScene(state,choices));assert.equal(sources.at(-1).offset,6);
  state.base.def={boss:'twin'};await music.play(session.forScene(state,choices));assert.equal(music.inspect().track,'stage4boss');assert.equal(sources.at(-1).offset,0);
  assert.equal(musicForScene(state,{4:'rock'}),'stage4boss');assert.equal(musicForScene(state,{4:'off'}),null);
  state.base.dead=true;assert.equal(session.forScene(state,choices),null);
});

test('第二关房间推进不重播，暂停后保留进度，进入中枢时替换走廊音轨',async()=>{
  const {music,sources,context}=player();
  const scene={mode:'intro',stage:2,base:{room:0,def:{}}};
  await music.play(referenceTrackForScene(scene));scene.mode='play';await music.play(referenceTrackForScene(scene));
  scene.base.room=1;await music.play(referenceTrackForScene(scene));assert.equal(sources.length,1);
  context.currentTime=9.5;music.pause();context.currentTime=40;
  await music.play(referenceTrackForScene(scene));assert.equal(sources[1].offset,9.5);
  scene.base.def={boss:'eye'};await music.play(referenceTrackForScene(scene));
  assert.equal(sources[1].stopped,true);assert.equal(sources[2].offset,0);assert.equal(sources[2].loop,true);
  assert.equal(music.inspect().track,'stage2boss');
});

test('第三关按原视频连续循环瀑布主题，门卫出现不切歌，暂停续播且摧毁后停止',async()=>{
  const {music,sources,context}=player();const scene={mode:'intro',stage:3,mech:{active:false,dead:false}};
  await music.play(referenceTrackForScene(scene));scene.mode='play';context.currentTime=7;
  scene.mech.active=true;await music.play(referenceTrackForScene(scene));assert.equal(sources.length,1);
  music.pause();context.currentTime=11;await music.play(referenceTrackForScene(scene));assert.equal(sources.at(-1).offset,7);
  assert.equal(sources.at(-1).loop,true);assert.equal(music.inspect().track,'stage3');
  scene.mech.dead=true;assert.equal(referenceTrackForScene(scene),null);music.stop();assert.equal(music.inspect().playing,false);
  assert.equal(musicForScene({...scene,mech:{active:true}},{3:'rock'}),'stage3');
  assert.equal(musicForScene({...scene,mech:{active:true}},{3:'off'}),null);
});

test('参考音乐暂停保留播放位置、继续不重头，重复请求和 Boss 激活不叠加音轨',async()=>{
  const {music,sources,context,output}=player();await music.play('stage1');
  assert.equal(sources[0].loop,true);assert.equal(sources[0].output,output);
  context.currentTime=12.25;music.pause();assert.equal(sources[0].stopped,true);
  context.currentTime=30;await music.play('stage1');assert.equal(sources[1].offset,12.25);
  await music.play('stage1');assert.equal(sources.length,2);
  music.stop();await music.play('stage1');assert.equal(sources[2].offset,0);
});

test('切换场景或暂停时，未完成的旧请求不会迟到播放；加载失败后允许重试',async()=>{
  let release;
  const {music,sources}=player(()=>new Promise(resolve=>{release=resolve;}));
  const pending=music.play('title');music.stop();release({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)});
  await pending;assert.equal(sources.length,0);assert.equal(music.inspect().track,null);
  let count=0;music.fetchAudio=async()=>({ok:++count>1,status:503,arrayBuffer:async()=>new ArrayBuffer(1)});
  await music.play('stage1');assert.match(music.inspect().error,/503/);
  await music.play('stage1');assert.equal(sources.length,1);assert.equal(music.inspect().error,null);
});

test('开始页短音乐只播放一次，曲末与切到第一关时释放旧声源',async()=>{
  const {music,sources}=player();await music.play('title');assert.equal(sources[0].loop,false);
  sources[0].onended();await music.play('title');assert.equal(sources.length,1);
  music.pause();await music.play('title');assert.equal(sources.length,1);
  await music.play('opening');assert.equal(sources[1].loop,true);
  await music.play('stage1');assert.equal(sources[1].stopped,true);assert.equal(sources.length,3);
});

test('旧存档获得第一关交响乐默认值，每关选择独立保存并过滤无效选项',()=>{
  const defaults=normalizeStageMusic();assert.equal(Object.keys(defaults).length,16);
  assert.equal(defaults[1],'orchestral');
  for(let stage=2;stage<=16;stage++)assert.equal(defaults[stage],'original');
  const saved=normalizeStageMusic({1:'original',2:'off',3:'orchestral',9:'off',16:'orchestral',17:'off'});
  assert.deepEqual(normalizeStageMusic(JSON.parse(JSON.stringify(saved))),saved);
  assert.equal(saved[1],'original');assert.equal(saved[2],'off');assert.equal(saved[3],'original');
  assert.equal(saved[9],'off');assert.equal(saved[16],'original');assert.equal(saved[17],undefined);
  const invalid=normalizeStageMusic({1:'https://example.com/music',2:null,3:'chiptune',4:{url:'x'}});
  assert.deepEqual(invalid,defaults);
  assert.deepEqual(normalizeStageMusic('off'),defaults);
});

test('各关只允许对应配乐，五首改编音乐只属于第一关，原配保留第二关中枢换曲',()=>{
  const original=Object.fromEntries(Array.from({length:16},(_,i)=>[i+1,'original']));
  for(let stage=1;stage<=16;stage++){
    const scene={mode:'play',stage,base:{def:{}}};
    const options=stageMusicOptions(stage).map(option=>option.value);
    for(const value of ['original','off'])assert.ok(options.includes(value));
    for(const value of ['orchestral','rock','epic','industrial','cyberpunk'])assert.equal(options.includes(value),stage===1);
    assert.equal(options.includes('chiptune'),stage<=2);
    const fallback=stage===1?'stage1rock':stage===2?'stage2':stage===3?'stage3':stage===4?'stage4':'synth';
    assert.equal(musicForScene(scene,{...original,[stage]:'rock'}),fallback);
    assert.equal(musicForScene(scene,{...original,[stage]:'off'}),null);
    assert.equal(musicForScene(scene,original),stage===1?'stage1':stage===2?'stage2':stage===3?'stage3':stage===4?'stage4':'synth');
  }
  const boss={mode:'play',stage:2,base:{def:{boss:'eye'}}};
  assert.equal(musicForScene(boss,original),'stage2boss');
  assert.equal(musicForScene(boss,{2:'orchestral'}),'stage2boss');
  assert.equal(musicForScene(boss,{2:'chiptune'}),'synth');
  assert.equal(musicForScene(boss,{2:'off'}),null);
  const saved=normalizeStageMusic({1:'rock',2:'rock',3:'rock'});
  assert.equal(saved[1],'rock');assert.equal(saved[2],'original');assert.equal(saved[3],'original');
  assert.deepEqual(normalizeStageMusic(JSON.parse(JSON.stringify(saved))),saved);
});

test('第一关新增三首完整配乐可独立保存、循环、暂停续播和互相切换，其他关卡不可选',async()=>{
  const {music,sources,context}=player();
  for(const [choice,key]of [['epic','stage1epic'],['industrial','stage1industrial'],['cyberpunk','stage1cyberpunk']]){
    const saved=normalizeStageMusic({1:choice,2:choice,3:choice,16:choice});
    assert.equal(saved[1],choice);for(const stage of [2,3,16])assert.equal(saved[stage],'original');
    assert.deepEqual(normalizeStageMusic(JSON.parse(JSON.stringify(saved))),saved);
    for(const mode of ['intro','play'])assert.equal(musicForScene({mode,stage:1},saved),key);
    for(let stage=2;stage<=16;stage++){
      const scene={mode:'play',stage,base:{def:{}}};
      assert.equal(musicForScene(scene,{[stage]:choice}),stage===2?'stage2':stage===3?'stage3':stage===4?'stage4':'synth');
    }
    const prior=sources.at(-1);await music.play(key);
    if(prior)assert.equal(prior.stopped,true);
    assert.equal(music.inspect().track,key);assert.equal(sources.at(-1).loop,true);
    const start=context.currentTime;context.currentTime+=17.25;music.pause();context.currentTime+=8;
    await music.play(key);assert.equal(sources.at(-1).offset,17.25);
    assert.equal(sources.filter(source=>!source.stopped).length,1);
    const count=sources.length;await music.play(key);assert.equal(sources.length,count);
    assert.ok(context.currentTime>start);
  }
  await music.play(musicForScene({mode:'play',stage:2,base:{def:{}}},{2:'original'}));
  assert.equal(music.inspect().track,'stage2');assert.equal(sources.filter(source=>!source.stopped).length,1);
});

test('关卡选择不替换标题和剧情配乐，也不会在通关后重启音乐',()=>{
  const choices=normalizeStageMusic({1:'off',2:'orchestral',3:'orchestral'});
  assert.equal(musicForScene({mode:'settings',settingsFrom:'title',stage:1},choices),'title');
  assert.equal(musicForScene({mode:'cine',stage:1,cine:{kind:'open'}},choices),'opening');
  assert.equal(musicForScene({mode:'intro',stage:1},choices),null);
  assert.equal(musicForScene({mode:'intro',stage:1},normalizeStageMusic()),'stage1orchestral');
  assert.equal(musicForScene({mode:'intro',stage:1},{1:'original'}),'opening');
  for(const state of [{mode:'pause',stage:2},{mode:'clear',stage:3},{mode:'play',stage:1,boss:{dead:true}},{mode:'play',stage:2,base:{dead:true}},{mode:'play',stage:3,mech:{dead:true}}])assert.equal(musicForScene(state,choices),null);
});

test('交响版完整循环，暂停续播与切回原视频时只保留一个声源',async()=>{
  const {music,sources,context}=player();await music.play('stage1orchestral');
  assert.equal(sources[0].loop,true);context.currentTime=37.5;music.pause();
  context.currentTime=90;await music.play('stage1orchestral');
  assert.equal(sources[1].offset,37.5);assert.equal(sources[0].stopped,true);
  await music.play('stage1orchestral');assert.equal(sources.length,2);
  await music.play('stage1');assert.equal(sources[1].stopped,true);assert.equal(sources[2].offset,0);
  assert.equal(sources.filter(source=>!source.stopped).length,1);
});

test('摇滚版循环播放，暂停续播，切换到第二关时释放第一关声源',async()=>{
  const {music,sources,context}=player();
  await music.play(musicForScene({mode:'play',stage:1},{1:'rock'}));
  assert.equal(music.inspect().track,'stage1rock');assert.equal(sources[0].loop,true);
  context.currentTime=18.5;music.pause();context.currentTime=30;
  await music.play('stage1rock');assert.equal(sources[1].offset,18.5);
  await music.play(musicForScene({mode:'play',stage:2,base:{def:{}}},{1:'rock',2:'original'}));
  assert.equal(music.inspect().track,'stage2');assert.equal(sources[1].stopped,true);
  assert.equal(sources.filter(source=>!source.stopped).length,1);
});
