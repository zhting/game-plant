import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CONTRA_TRACKS, fixedMusicTrack, fixedStageMusicKeys } from '../../games/contra2026/js/fixed-soundtrack.mjs';
import { ReferenceMusic } from '../../games/contra2026/js/reference-music.mjs';
import { ResourcePreloader, musicResourceJobs, gameResourceJobs } from '../../games/contra2026/js/resource-preloader.mjs';
import { StageOneArt } from '../../games/contra2026/js/stage-one-art.mjs';
import { versionedAssetUrl } from '../../games/contra2026/js/asset-url.mjs';

test('第一关从片头到战斗固定摇滚，暂停和结算停止；后续关卡按场景切换对应配乐',()=>{
  assert.deepEqual(Object.keys(CONTRA_TRACKS),['stage1rock','stage2','stage2boss','stage3','stage4','stage4boss','stage5','stage6','stage7']);
  for(const mode of ['intro','play','cine'])assert.equal(fixedMusicTrack({stage:1,mode,cine:{kind:'open'}}),'stage1rock');
  for(const mode of ['title','select','settings','pause','clear','over'])assert.equal(fixedMusicTrack({stage:1,mode}),null);
  assert.equal(fixedMusicTrack({stage:1,mode:'play',boss:{dead:true}}),null);
  for(const stage of [2,4]){
    assert.equal(fixedMusicTrack({stage,mode:'play',base:{def:{}}}),'stage'+stage);
    assert.equal(fixedMusicTrack({stage,mode:'play',base:{def:{boss:true}}}),'stage'+stage+'boss');
    assert.equal(fixedMusicTrack({stage,mode:'play',base:{dead:true}}),null);
  }
  assert.equal(fixedMusicTrack({stage:3,mode:'play'}),'stage3');
  assert.deepEqual(fixedStageMusicKeys(5),['stage5']);
  assert.equal(fixedMusicTrack({stage:5,mode:'play',tank:{dead:true}}),'stage5');
  assert.equal(fixedMusicTrack({stage:5,mode:'play',fortress:{dead:true}}),null);
  assert.deepEqual(fixedStageMusicKeys(6),['stage6']);assert.equal(fixedMusicTrack({stage:6,mode:'play',golem:{dead:false}}),'stage6');assert.equal(fixedMusicTrack({stage:6,mode:'play',golem:{dead:true}}),null);
  assert.equal(CONTRA_TRACKS.stage6.url,'/games/contra2026/assets/audio/reference-stage6.ogg');
  assert.deepEqual(fixedStageMusicKeys(7),['stage1rock']);assert.equal(fixedMusicTrack({stage:7,mode:'play',gate:{dead:false}}),'stage1rock');assert.equal(fixedMusicTrack({stage:7,mode:'play',gate:{dead:true}}),null);
  assert.deepEqual(fixedStageMusicKeys(8),['stage7']);assert.equal(fixedMusicTrack({stage:8,mode:'play',hive:{dead:false}}),'stage7');assert.equal(fixedMusicTrack({stage:8,mode:'play',hive:{dead:true}}),null);
  assert.equal(fixedMusicTrack({stage:8,mode:'cine',cine:{kind:'end'}}),'synth');
  assert.equal(fixedMusicTrack({stage:8,mode:'clear'}),null);
});

test('第一关仅下载压缩摇滚文件，默认缓存不会拉取其他音乐，重播复用下载',async()=>{
  const requests=[],context={decodeAudioData:async()=>({duration:122}),currentTime:0,createBufferSource:()=>({connect(){},start(){},stop(){},disconnect(){}})};
  const music=new ReferenceMusic({tracks:CONTRA_TRACKS,getContext:()=>context,getOutput:()=>({}),fetchAudio:async url=>{requests.push(url);return{ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};}});
  const loader=new ResourcePreloader(musicResourceJobs(music,fixedStageMusicKeys(1)));await loader.load();
  await music.play('stage1rock');music.pause();await music.play('stage1rock');
  assert.deepEqual(requests,['/games/contra2026/assets/audio/stage1-rock-lite.ogg']);
  assert.deepEqual(fixedStageMusicKeys(2),['stage2','stage2boss']);assert.deepEqual(fixedStageMusicKeys(3),['stage3']);
  const file=fs.readFileSync(new URL('../..'+requests[0],import.meta.url));assert.equal(file.toString('ascii',0,4),'OggS');assert.ok(file.length<1200000);
});

test('多个画面共用同一 Image 和一次解码，后续渲染器复用透明精灵',async()=>{
  let creates=0,decodes=0;
  const make=()=>new StageOneArt({createCanvas:()=>({getContext:()=>({})}),assets:{actor:'shared.webp'},autoLoad:false,imageFactory:()=>{creates++;return{decode:async()=>{decodes++;},set src(url){queueMicrotask(()=>this.onload());}};}});
  const first=make(),second=make();
  const jobs=gameResourceJobs({arts:[first,second],cover:'cover',records:[],tracks:{},music:{},imageFactory:()=>({set src(url){queueMicrotask(()=>this.onload());}})});
  await new ResourcePreloader(jobs).load();assert.equal(creates,1);assert.equal(decodes,1);
  assert.equal(first.images.actor,second.images.actor);assert.equal(first.ready,true);assert.equal(second.ready,true);
});

test('大批图片遵守并发上限，同时给音乐保留下载通道，压缩版本能绕过旧缓存',async()=>{
  let live=0,max=0,musicStarted=false;const waiting=[];
  const jobs=Array.from({length:12},(_,i)=>({id:'image'+i,eager:true,load:()=>{live++;max=Math.max(max,live);return new Promise(resolve=>waiting.push(()=>{live--;resolve();}));}}));
  jobs.push({id:'music',load:async()=>{musicStarted=true;}});
  const loader=new ResourcePreloader(jobs,{concurrency:3}),loading=loader.load();await new Promise(setImmediate);
  assert.equal(max,3);assert.equal(musicStarted,true);
  while(!loader.ready){for(const done of waiting.splice(0))done();await new Promise(setImmediate);}await loading;
  assert.equal(max,3);assert.match(versionedAssetUrl('/games/contra2026/assets/cover-zh.webp'),/\.webp\?v=[a-f0-9]{10}$/);
  assert.equal(versionedAssetUrl('/games/wukong/assets/heaven.webp'),'/games/wukong/assets/heaven.webp');
});
