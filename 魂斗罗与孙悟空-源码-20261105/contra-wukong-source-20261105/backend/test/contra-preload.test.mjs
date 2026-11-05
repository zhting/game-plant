import test from 'node:test';
import assert from 'node:assert/strict';
import { ResourcePreloader, gameResourceJobs, musicResourceJobs } from '../../games/contra2026/js/resource-preloader.mjs';
import { StageOneArt } from '../../games/contra2026/js/stage-one-art.mjs';
import { StageTwoArt } from '../../games/contra2026/js/stage-two-art.mjs';
import { ReferenceMusic } from '../../games/contra2026/js/reference-music.mjs';
import { WukongSkin } from '../../games/wukong/js/wukong-game.mjs';

const deferred = () => { let resolve, reject; const promise = new Promise((yes,no) => {resolve=yes;reject=no;}); return {promise,resolve,reject}; };

test('悟空标题先准备天宫、基础人物与待机序列，关卡其余资源延后下载并复用标题贴图',async()=>{
  const requests=[];
  const imageFactory=()=>({naturalWidth:0,set src(url){if(url){requests.push(url);queueMicrotask(()=>{this.naturalWidth=1774;this.onload();});}}});
  const art=new WukongSkin({createCanvas:()=>({getContext:()=>({drawImage(){},getImageData(){return null;}})}),imageFactory,autoLoad:false});
  assert.deepEqual(requests,[]);assert.equal(art.ready,false);
  await art.loadTitle();
  assert.deepEqual(requests,[art.assets.heaven,art.assets.skinActors,art.assets.heroWholeMovement,art.assets.ruyiStaff]);
  assert.equal(art.loaded.has('heaven'),true);assert.equal(art.hdActors.ready('blue'),true);
  assert.equal(art.loaded.has('skinActors'),true);assert.equal(art.ready,false);
  const loader=new ResourcePreloader(gameResourceJobs({arts:[art],imageFactory,cover:'cover.webp',records:[],tracks:{},music:{}}));
  await loader.load();assert.equal(art.ready,true);assert.equal(loader.ready,true);
  assert.ok(requests.includes('/games/wukong/assets/actors.webp'));
  assert.equal(requests.filter(url=>url===art.assets.heaven).length,1);
  assert.equal(requests.filter(url=>url===art.assets.skinActors).length,1);
  assert.equal(requests.filter(url=>url===art.assets.heroWholeMovement).length,1);
  const count=requests.length;await loader.load();assert.equal(requests.length,count);
});

test('切换关卡复用已完成画面，只等待新关默认音乐，旧音轨不计入新进度',async()=>{
  const calls=[];
  const job=id=>({id,load:async()=>calls.push(id)});
  const first=new ResourcePreloader([job('image'),job('music:opening')]);await first.load();
  const second=new ResourcePreloader([job('image'),job('music:stage2')],{completed:[...first.done,'unrelated']});
  assert.equal(second.inspect().loaded,1);assert.equal(second.ready,false);assert.equal(second.inspect().total,2);
  await second.load();assert.equal(second.ready,true);
  assert.deepEqual(calls,['image','music:opening','music:stage2']);
  const warm=new ResourcePreloader(second.jobs,{completed:second.done});
  await warm.load();assert.equal(warm.inspect().status,'ready');assert.equal(warm.inspect().loaded,2);
  assert.deepEqual(calls,['image','music:opening','music:stage2']);
});

test('先下载一首默认音乐即可就绪，其他音乐进入后串行缓存，失败不影响前台资源',async()=>{
  const requests=[],slow=deferred();
  const music=new ReferenceMusic({getContext:()=>null,getOutput:()=>null,fetchAudio:async url=>{
    requests.push(url);
    if(url.endsWith('stage1-rock.ogg'))await slow.promise;
    return{ok:!url.endsWith('stage1-epic.ogg'),status:503,arrayBuffer:async()=>new ArrayBuffer(4)};
  }});
  const foreground=new ResourcePreloader(musicResourceJobs(music,['opening','opening']));
  await foreground.load();assert.equal(foreground.ready,true);assert.equal(foreground.inspect().total,1);assert.equal(requests.length,1);
  const background=new ResourcePreloader(musicResourceJobs(music,['stage1rock','opening','stage1epic','stage2']),{concurrency:1});
  assert.equal(requests.length,1);
  const downloading=background.load();await new Promise(setImmediate);
  assert.equal(requests.length,2);assert.equal(background.ready,false);assert.equal(foreground.ready,true);
  assert.ok(requests[1].endsWith('stage1-rock.ogg'));assert.equal(music.buffers.size,0);
  slow.resolve();await assert.rejects(downloading,/部分资源/);
  assert.equal(requests.length,4);assert.equal(foreground.ready,true);assert.deepEqual(foreground.inspect().failed,[]);
  assert.deepEqual(background.inspect().failed,['music:stage1epic']);assert.equal(music.buffers.size,0);
});

test('标题阶段不请求关卡资源，启动加载后才下载两关画面、唱片和音乐，并等解码完成',async()=>{
  const requested=[],songs=[],decoded=deferred();
  const imageFactory=()=>({decode:()=>decoded.promise,set src(url){if(url){requested.push(url);queueMicrotask(()=>this.onload());}}});
  const createCanvas=()=>({getContext:()=>({})});
  const first=new StageOneArt({createCanvas,imageFactory,autoLoad:false});
  const second=new StageTwoArt({createCanvas,imageFactory,autoLoad:false,baseArt:first});
  const loader=new ResourcePreloader(gameResourceJobs({arts:[first,second],imageFactory,cover:'cover.webp',records:['disc.svg'],
    tracks:{stage1:{},stage2:{}},music:{prefetch:async key=>songs.push(key)}}));
  assert.deepEqual(requested,[]);assert.deepEqual(songs,[]);
  assert.equal(loader.inspect().status,'idle');assert.equal(first.ready,false);assert.equal(second.ready,false);
  const loading=loader.load();await new Promise(setImmediate);
  assert.ok(requested.some(url=>url.includes('/stage1/')));assert.ok(requested.filter(url=>url.includes('/stage')).length<=4,'image requests stay within the eager concurrency limit');
  assert.ok(requested.includes('disc.svg'));assert.deepEqual(songs,['stage1','stage2']);assert.equal(loader.ready,false);
  decoded.resolve();await loading;
  assert.ok(requested.some(url=>url.includes('/stage2/')));
  assert.equal(first.ready,true);assert.equal(second.ready,true);assert.equal(loader.ready,true);
  const count=requested.length;await loader.load();assert.equal(requested.length,count);
});

test('已经开始的图片与字体独立更新进度，不被队列中的慢资源挡住',async()=>{
  const slow=deferred(),image=deferred();
  const loader=new ResourcePreloader([{id:'slow',load:()=>slow.promise},{id:'image',eager:true,load:()=>image.promise},{id:'fonts',eager:true,load:async()=>{}}],{concurrency:1});
  const loading=loader.load();image.resolve();await new Promise(setImmediate);
  assert.equal(loader.inspect().loaded,2);assert.equal(loader.ready,false);
  slow.resolve();await loading;assert.equal(loader.ready,true);
});

test('所有资源完成前不就绪，并发上限有效，同一资源只加载一次，后续开局复用',async()=>{
  const gates=Array.from({length:5},deferred), calls=[];
  const loader=new ResourcePreloader(gates.map((gate,id)=>({id,load:()=>{calls.push(id);return gate.promise;}})),{concurrency:2});
  const states=[],first=loader.load(state=>states.push(state.loaded)),second=loader.load();
  await Promise.resolve(); assert.deepEqual(calls,[0,1]);assert.equal(loader.ready,false);
  gates[0].resolve();await new Promise(setImmediate);assert.deepEqual(calls,[0,1,2]);
  gates[1].resolve();gates[2].resolve();await new Promise(setImmediate);assert.deepEqual(calls,[0,1,2,3,4]);
  gates[3].resolve();await new Promise(setImmediate);assert.equal(loader.ready,false);
  gates[4].resolve();await Promise.all([first,second]);assert.equal(loader.ready,true);
  assert.ok(states.every((value,index)=>index===0||value>=states[index-1]));
  await loader.load();assert.equal(calls.length,5);assert.equal(loader.inspect().loaded,5);
});

test('网络失败或超时不允许开始，重试只补失败资源',async()=>{
  let failedCalls=0,successfulCalls=0;
  const loader=new ResourcePreloader([{id:'good',load:async()=>{successfulCalls++;}},
    {id:'retry',load:async({retry})=>{failedCalls++;if(!retry)throw Error('offline');}},
    {id:'timeout',load:({retry})=>retry?Promise.resolve():new Promise(()=>{})}],{timeout:15});
  await assert.rejects(loader.load(),/部分资源/);assert.equal(loader.ready,false);
  assert.deepEqual(new Set(loader.inspect().failed),new Set(['retry','timeout']));
  await loader.load();assert.equal(loader.ready,true);assert.equal(successfulCalls,1);assert.equal(failedCalls,2);
});

test('图片解码完成才就绪，失败后重试，不覆盖另一张已经加载的图片',async()=>{
  const images=[],decoded=deferred();
  const art=new StageOneArt({createCanvas:()=>({getContext:()=>({})}),imageFactory:()=>{const image={};images.push(image);return image;},assets:{actor:'actor.webp',tree:'tree.webp'}});
  images[0].decode=()=>decoded.promise;
  images[0].onload();images[1].onerror();assert.equal(art.ready,false);
  const actor=art.loadImage('actor');decoded.resolve();await actor;
  assert.equal(art.loaded.has('actor'),true);assert.equal(art.ready,false);
  const tree=art.loadImage('tree',{retry:true});assert.equal(images.length,3);
  images[2].onload();await tree;assert.equal(art.ready,true);assert.deepEqual(art.failed,[]);
  await art.loadImage('actor',{retry:true});assert.equal(images.length,3);
});

test('两关共用图片只计一次，并等待双方渲染器和所有音轨、唱片图',async()=>{
  const imageA=deferred(),imageB=deferred(),music=deferred();
  const jobs=gameResourceJobs({arts:[{assets:{one:'shared.webp'},loadImage:()=>imageA.promise},{assets:{two:'shared.webp'},loadImage:()=>imageB.promise}],
    imageFactory:()=>({set src(value){if(value)queueMicrotask(()=>this.onload());}}),cover:'cover.webp',records:['cover.webp','disc.svg','disc.svg'],
    tracks:{song:{}},music:{prefetch:()=>music.promise}});
  assert.equal(jobs.length,5);
  const loader=new ResourcePreloader(jobs),loading=loader.load();imageA.resolve();music.resolve();
  await new Promise(setImmediate);assert.equal(loader.ready,false);
  imageB.resolve();await loading;assert.equal(loader.ready,true);
});

test('音乐预下载保持静音，不提前解码全部唱片；实际播放复用下载并保留编码缓存',async()=>{
  let fetches=0,decodes=0;const raw=new ArrayBuffer(4);
  const context={decodeAudioData:async data=>{decodes++;assert.notEqual(data,raw);return{duration:10};}};
  const music=new ReferenceMusic({getContext:()=>context,getOutput:()=>null,fetchAudio:async()=>{fetches++;return{ok:true,arrayBuffer:async()=>raw};}});
  await Promise.all([music.prefetch('stage1rock'),music.prefetch('stage1rock')]);
  assert.equal(fetches,1);assert.equal(decodes,0);assert.equal(music.inspect().playing,false);
  await music.load('stage1rock',context);await music.load('stage1rock',context);
  assert.equal(fetches,1);assert.equal(decodes,1);assert.equal((await music.prefetch('stage1rock')).byteLength,4);
});
