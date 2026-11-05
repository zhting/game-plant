import test from 'node:test';
import assert from 'node:assert/strict';
import { StageOneArt } from '../../games/contra2026/js/stage-one-art.mjs';
import { StageTwoArt } from '../../games/contra2026/js/stage-two-art.mjs';
import { StageThreeArt } from '../../games/contra2026/js/stage-three-art.mjs';
import { StageFourArt } from '../../games/contra2026/js/stage-four-art.mjs';
import { StageFiveArt } from '../../games/contra2026/js/stage-five-art.mjs';
import { StageSixArt } from '../../games/contra2026/js/stage-six-art.mjs';
import { StageSevenArt } from '../../games/contra2026/js/stage-seven-art.mjs';
import { EndingArt } from '../../games/contra2026/js/ending-art.mjs';
import { stageResourceJobs } from '../../games/contra2026/js/stage-resources.mjs';
import { ResourcePreloader, musicResourceJobs } from '../../games/contra2026/js/resource-preloader.mjs';
import { fixedStageMusicKeys } from '../../games/contra2026/js/fixed-soundtrack.mjs';

function resources() {
  const images=[], music=[], cache=new Set();
  const options={createCanvas:()=>({getContext:()=>({})}),autoLoad:false,imageFactory:()=>({
    naturalWidth:0,
    set src(url){if(url){images.push(url);queueMicrotask(()=>{this.naturalWidth=64;this.onload();});}},
    decode:()=>Promise.resolve()
  })};
  const one=new StageOneArt(options), arts=[one,...[StageTwoArt,StageThreeArt,StageFourArt,StageFiveArt,StageSixArt].map(Art=>new Art({...options,baseArt:one})),new StageSevenArt({...options,baseArt:one,hangar:true}),new StageSevenArt({...options,baseArt:one}),new EndingArt({...options,baseArt:one})];
  const jobs=stage=>[...stageResourceJobs(stage,{arts,imageFactory:options.imageFactory,cover:'/cover.webp'}),
    ...musicResourceJobs({prefetch:async key=>music.push(key)},fixedStageMusicKeys(stage))];
  return {arts,images,music,cache,jobs,load:stage=>new ResourcePreloader(jobs(stage),{cache}).load()};
}

test('冷启动每关只请求本关画面和配乐；第一关不请求任何后续场景',async()=>{
  for(const stage of [1,2,3,4,5,6,7,8]){
    const r=resources();assert.equal(r.images.length+r.music.length,0,'building the plan must not request assets');
    const state=await r.load(stage);assert.equal(state.ready,true);assert.deepEqual(r.music,fixedStageMusicKeys(stage));
    const paths=r.images.map(url=>new URL(url,'https://game.test').pathname);
    assert.equal(paths.some(path=>path.includes('/impact-helmet-v2.webp')),stage===3,'helmet artwork loads only with its own stage');
    for(const other of [1,2,3,4,5,6].filter(n=>n!==stage)){
      if(other===1||stage===4&&other===2)continue; // Shared atlases keep their original URLs.
      assert.ok(paths.every(path=>!path.includes('/stage'+other+'/')||stage===2&&path.endsWith('/stage4/breached-passage.webp')||stage===1&&path.endsWith('/stage3/mossy-rock-ledge.webp')||stage===6&&path.endsWith('/stage3/flame-jets-v2.webp')),paths.join('\n'));
    }
    if(stage!==1)for(const name of ['night-jungle-strip','night-snow-mountains','fortress-hd','fortress-damage','fortress-realistic','fortress-wreck-realistic','fortress-breach-realistic','demolition-charge'])
      assert.ok(paths.every(path=>!path.includes(name)),name+' does not belong to this stage');
    if(stage===4)for(const name of ['corridor-hd','corridor-power','corridor-armory','corridor-command','control-wall-hd'])
      assert.ok(paths.every(path=>!path.includes(name)),name+' is unused in stage four');
    assert.equal(state.total,{1:24,2:27,3:28,4:25,5:28,6:27,7:24,8:38}[stage]);
    assert.equal(paths.some(path=>path.endsWith('/foundry-exit-door-v1.webp')),stage===6);
    assert.equal(paths.filter(path=>path.includes('/assets/ending/')).length,stage===8?3:0,'the finale is loaded with stage eight only');
    assert.equal(paths.some(path=>path.endsWith('/alien-hive-hatchling-v1.webp')),stage===8);
    assert.equal(paths.some(path=>path.endsWith('/alien-ceiling-stalker-v1.webp')),stage===8);
    assert.equal(paths.some(path=>path.endsWith('/alien-guardian-halfwall-v1.webp')),stage===8);
    assert.equal(paths.some(path=>path.endsWith('/alien-guardian-flyer-v1.webp')),stage===8);
    assert.equal(paths.some(path=>path.endsWith('/alien-ceiling-parasite-v1.webp')),stage===8);
    assert.equal(paths.some(path=>path.endsWith('/alien-white-floater-v1.webp')),stage===8);
    assert.equal(paths.some(path=>path.endsWith('/alien-tissue-slab-motion-v3.webp')),stage===8);
    assert.ok(paths.every(path=>!path.endsWith('/alien-intestine-motion-v2.webp')),'the detached gut-strip atlas is replaced by the fused slab');
    assert.equal(paths.some(path=>path.endsWith('/escort-drone-v1.webp')),stage===7,'the escort drone loads only in the hangar');
    assert.equal(paths.some(path=>path.endsWith('/alien-crawler-walk-v1.webp')),stage===8,'only the alien cave downloads the crawler action sheet');
    assert.equal(paths.some(path=>path.endsWith('/alien-hive-brain-v1.webp')),stage===8,'only the final hive downloads the monster brain');
    assert.equal(paths.some(path=>path.endsWith('/alien-hive-rib-v1.webp')),stage===8,'only the final hive downloads the articulated bone plates');
    assert.ok(paths.every(path=>!path.endsWith('/alien-crawler-v1.webp')),'the replaced static crawler is not downloaded');
    assert.equal(paths.some(path=>path.endsWith('/alien-larva-hop-v1.webp')),stage===8,'only the alien cave downloads the larva hop poses');
    assert.ok(paths.every(path=>!path.endsWith('/alien-larva-v1.webp')),'the old static larva is replaced by the hop atlas');
    if(stage===1)assert.ok(paths.every(path=>!path.endsWith('/rock-arcade.webp')),'the replaced cliff texture is not downloaded');
    assert.ok(paths.every(path=>!path.includes('/commando-run-')),'the limb rig replaces full-body run downloads');
  }
});

test('顺序过关复用人物和机关图集，跨关缓存不会遗漏新渲染器；重玩零下载',async()=>{
  const r=resources();await r.load(1);const first=r.images.length;
  await r.load(2);assert.ok(r.images.length>first);const second=r.images.length;
  assert.equal(r.arts[1].images.environment,r.arts[0].images.environment);
  assert.equal(r.arts[3].images.rearBlue,r.arts[1].images.rearBlue,'future renderer adopts a shared image without a new request');
  await r.load(3);assert.equal(r.images.length-second,12,'the shared grass shelf is reused and the waterfall uniform and hovercraft load here');
  assert.equal(r.arts[0].images.turf,r.arts[2].images.ledge);
  const third=r.images.length;await r.load(4);assert.equal(r.images.length-third,5,'the passage and defense devices are reused while both fortress uniforms load');
  const fourth=r.images.length;await r.load(5);assert.equal(r.images.length-fourth,13,'equipment and effects reuse the shared cache while the snow uniform loads');
  assert.equal(new Set(r.images).size,r.images.length,'no duplicate network URL');
  const fifth=r.images.length;await r.load(6);assert.equal(r.images.length-fifth,11,'factory loads the robot action frames and exit door while actors and flame atlas are reused');
  assert.ok(r.images.some(url=>url.includes('humanoid-robot-jump-frames-v1.webp')),'the action sheet is loaded for stage six');
  const sixth=r.images.length;await r.load(7);assert.equal(r.images.length-sixth,9,'the hangar loads its scenery, gate devices, spiked steel barrier and escort drone');
  const seventh=r.images.length;await r.load(8);assert.equal(r.images.length-seventh,23,'the alien cave also loads the brain hatchlings and three ending plates');
  const count=[r.images.length,r.music.length];
  for(const stage of [1,2,3,4,5,6,7,8])await r.load(stage);
  assert.deepEqual([r.images.length,r.music.length],count);
  assert.ok(r.arts.every(art=>art.ready));
});

test('失败和切换加载器后仍保留已完成资源，未完成的资源可以重试',async()=>{
  const cache=new Set();let portrait=0,song=0;
  const jobs=[{id:'image:portrait',eager:true,load:async()=>portrait++},
    {id:'music:stage3',load:async({retry})=>{song++;if(!retry)throw Error('offline');}}];
  const loader=new ResourcePreloader(jobs,{cache});
  await assert.rejects(loader.load());assert.deepEqual([...cache],['image:portrait']);
  await loader.load();assert.equal(portrait,1);assert.equal(song,2);
  await new ResourcePreloader([{id:'fonts',load:async()=>{}}],{cache}).load();
  await new ResourcePreloader(jobs,{cache}).load();assert.equal(portrait,1);assert.equal(song,2);
});
