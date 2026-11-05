import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ReferenceMusic,REFERENCE_TRACKS,normalizeStageMusic} from '../../games/contra2026/js/reference-music.mjs';
import {WUKONG_MUSIC_TRACKS,normalizeWukongMusic,wukongMusicTrack} from '../../games/wukong/js/wukong-music.mjs';

function oggDuration(url){
  const bytes=fs.readFileSync(new URL('../..'+url,import.meta.url));
  const identification=bytes.indexOf(Buffer.from('\x01vorbis','binary'));assert.ok(identification>=0);
  const rate=bytes.readUInt32LE(identification+12);let granule=0n;
  for(let pos=0;pos<bytes.length;){
    assert.equal(bytes.toString('ascii',pos,pos+4),'OggS');
    const n=bytes[pos+26];granule=bytes.readBigUInt64LE(pos+6);
    let length=0;for(let i=0;i<n;i++)length+=bytes[pos+27+i];pos+=27+n+length;
  }
  return Number(granule)/rate;
}
function player(){
  const sources=[],fetched=[],context={currentTime:0,
    decodeAudioData:async data=>({duration:new Uint8Array(data)[0]===1?52:159.172789}),
    createBufferSource(){const source={connect(){},disconnect(){},start(when,offset){this.offset=offset;},stop(){this.stopped=true;}};sources.push(source);return source;}};
  const music=new ReferenceMusic({getContext:()=>context,getOutput:()=>({}),tracks:{...REFERENCE_TRACKS,...WUKONG_MUSIC_TRACKS},
    fetchAudio:async url=>{fetched.push(url);return{ok:true,arrayBuffer:async()=>new Uint8Array([url.includes('-theme.')?2:1]).buffer};}});
  return{music,sources,context,fetched};
}

test('网页使用完整录音，循环边界在第9秒，前两章独立选曲不改魂斗罗与未开放关卡偏好',()=>{
  assert.ok(Math.abs(oggDuration(WUKONG_MUSIC_TRACKS.stage1.url)-159.172789)<.00001);
  assert.equal(WUKONG_MUSIC_TRACKS.stage1.loopStart,8);assert.equal(WUKONG_MUSIC_TRACKS.stage1.startOffset,8);
  assert.equal(WUKONG_MUSIC_TRACKS.stage1.loop,true);
  assert.equal(REFERENCE_TRACKS.opening.url,'/games/contra2026/assets/audio/reference-opening.ogg');
  assert.equal(REFERENCE_TRACKS.opening.loop,true);
  const saved={1:'orchestral',2:'chiptune',3:'off'};
  const themed=normalizeWukongMusic(saved);assert.equal(themed[1],'original');assert.equal(themed[2],'original');assert.equal(themed[3],'off');
  assert.equal(normalizeWukongMusic({1:'off'})[1],'off');assert.deepEqual(normalizeWukongMusic(themed),themed);
  assert.equal(normalizeStageMusic(saved)[1],'orchestral');
});

test('封面、出世、完整故事、关卡介绍和正式开打使用同一首音乐，关闭音乐与其他场景保留',()=>{
  for(const stage of [1,2])assert.equal(wukongMusicTrack({stage,mode:'title'},{1:'original'},'title'),'stage1');
  assert.equal(wukongMusicTrack({stage:1,mode:'settings',settingsFrom:'title'},{1:'original'},'title'),'stage1');
  assert.equal(wukongMusicTrack({stage:1,mode:'cine',cine:{kind:'open'}},{1:'original'},'opening'),'stage1');
  assert.equal(wukongMusicTrack({stage:1,mode:'intro'},{1:'original'},'opening'),'stage1');
  for(const boss of [{},{active:true}])assert.equal(wukongMusicTrack({stage:1,mode:'play',boss},{1:'original'},'stage1orchestral'),'stage1');
  assert.equal(wukongMusicTrack({stage:1,mode:'play',boss:{dead:true}},{1:'original'},'stage1'),null);
  assert.equal(wukongMusicTrack({stage:1,mode:'play'},{1:'off'},'stage1'),null);
  for(const mode of ['pause','settings','clear'])assert.equal(wukongMusicTrack({stage:1,mode},{1:'original'},'sentinel'),'sentinel');
  assert.equal(wukongMusicTrack({stage:2,mode:'play'},{1:'original'},'stage2'),'stage2');
});

test('前8秒后继续整首音乐，故事与关卡介绍的重复同步不重置声源或播放进度',async()=>{
  const {music,sources,fetched}=player();
  await music.play('stage1',{offset:0});const source=sources[0];
  assert.equal(source.loop,true);assert.equal(source.offset,0);assert.equal(source.loopStart,8);
  assert.equal(source.loopEnd,159.172789);
  for(const seconds of [8.4,20,22.4,31]){music.getContext().currentTime=seconds;await music.play('stage1',{offset:0});assert.equal(music.source,source);assert.equal(music.offset,0);assert.equal(music.startedAt,0);}
  assert.equal(sources.length,1);assert.equal(source.stopped,undefined);
  assert.deepEqual(fetched,[WUKONG_MUSIC_TRACKS.stage1.url]);
});

test('封面复用第一关录音，开始出世时可从第0秒重新起播并复用下载',async()=>{
  const {music,sources,fetched,context}=player();
  await music.play(wukongMusicTrack({stage:1,mode:'title'},{1:'original'},'title'));
  const cover=sources[0];assert.equal(cover.offset,8);
  context.currentTime=2.6;music.stop();
  await music.play(wukongMusicTrack({stage:1,mode:'cine',cine:{kind:'open'}},{1:'original'},'opening'),{offset:0});
  assert.equal(cover.stopped,true);assert.equal(sources.length,2);assert.equal(sources[1].offset,0);
  assert.deepEqual(fetched,[WUKONG_MUSIC_TRACKS.stage1.url]);
});

test('循环跨过尾部后暂停仍保存准确位置，续播不回前8秒，重开从后段起点开始',async()=>{
  const {music,sources,context}=player();await music.play('stage1',{offset:0});
  context.currentTime=5;music.pause();assert.equal(music.offset,5);
  context.currentTime=20;await music.play('stage1',{offset:0});assert.equal(sources.at(-1).offset,5);
  context.currentTime=20+159.172789-5+3.25;music.pause();assert.ok(Math.abs(music.offset-11.25)<1e-9);
  context.currentTime+=10;await music.play('stage1');assert.ok(Math.abs(sources.at(-1).offset-11.25)<1e-9);
  const source=sources.at(-1);await music.play('stage1');assert.equal(sources.at(-1),source);
  music.stop();await music.play('stage1');assert.equal(sources.at(-1).offset,8);assert.equal(sources.at(-1).loop,true);
});

test('明确重开使旧播放请求失效，迟到的解码不会覆盖从第9秒开始的新播放',async()=>{
  const {music,sources}=player();let finishOpening;
  const ready=new Promise(resolve=>{finishOpening=resolve;});music.load=()=>ready;
  const pending=music.play('stage1',{offset:0});music.stop();const restarted=music.play('stage1');finishOpening({duration:159.172789});
  assert.equal(await pending,false);assert.equal(await restarted,true);
  assert.equal(music.inspect().track,'stage1');assert.equal(sources.length,1);assert.equal(sources[0].loop,true);assert.equal(sources[0].offset,8);
});
