import test from 'node:test';
import assert from 'node:assert/strict';
import {GIANT_ANIMATIONS,GIANT_REST,sampleGiantClip,giantAnimationTrack} from '../../games/wukong/js/wukong-giant-animation.mjs';
import {GIANT_CLOTH,giantClothOffset} from '../../games/wukong/js/wukong-giant-cloth.mjs';

test('主机十套动作时间轴保留完整起止与连续参数轨迹，供计时和联机过渡使用',()=>{
  assert.equal(Object.keys(GIANT_ANIMATIONS).length,10);
  for(const [name,clip]of Object.entries(GIANT_ANIMATIONS)){
    assert.equal(clip.fps,30);assert.equal(clip.frames.length,Math.ceil(clip.duration*30)+1,name);
    assert.equal(clip.keys[0].at,0);assert.equal(clip.keys.at(-1).at,1);
    assert.ok(new Set(clip.frames.map(f=>JSON.stringify(f))).size>8,name);
    for(const frame of clip.frames)assert.ok(Object.values(frame).every(Number.isFinite),name);
    if(clip.loop)for(const field of Object.keys(GIANT_REST))assert.ok(Math.abs(clip.frames[0][field]-clip.frames.at(-1)[field])<1e-8,name+field);
  }
  for(const name of ['walk','retreat'])for(let u=0;u<1;u+=.005){
    const pose=sampleGiantClip(name,u);assert.ok(pose.nearY<=-8.49);assert.ok(pose.farY<=-8.49);
  }
});
test('固定斧招在普通与半血速度下仍把蓄势、伤害段和收势映射到相同动画帧',()=>{
  for(const kind of ['cleave','sweep','whirlwind','stomp'])for(const speed of [1,.7]){
    const a={kind,t:0,windup:.8*speed,strike:.32,recovery:.85},g={attack:a};
    assert.equal(giantAnimationTrack(g,a.windup).clip,kind);
    assert.ok(Math.abs(giantAnimationTrack(g,a.windup).u-.4)<1e-8);
    assert.ok(Math.abs(giantAnimationTrack(g,a.windup+a.strike).u-.64)<1e-8);
    assert.equal(giantAnimationTrack(g,a.windup+a.strike+a.recovery).u,1);
  }
  const g={attack:{kind:'leap',windup:.72,flight:.68}};
  assert.equal(giantAnimationTrack(g,.6).clip,'jumpStart');
  assert.equal(giantAnimationTrack(g,1).clip,'jumpAir');
  assert.equal(giantAnimationTrack(g,1.41).clip,'land');
});
test('旧版织物位移工具保留固定根部与可复现循环，整身贴图无需再调用分层绘制',()=>{
  for(const [name,meta]of Object.entries(GIANT_CLOTH)){
    const tip={x:meta.root.x+meta.flow.x*meta.length,y:meta.root.y+meta.flow.y*meta.length},samples=[];
    for(const time of [0,.19,.41,.78,1.21])for(const energy of [0,1,2]){
      const pinned=giantClothOffset(name,meta.root,time,energy);assert.ok(Math.hypot(pinned.x,pinned.y)<1e-8,name);
      const end=giantClothOffset(name,tip,time,energy),repeat=giantClothOffset(name,tip,time+1.6,energy);
      assert.ok(Math.hypot(end.x-repeat.x,end.y-repeat.y)<1e-8,name);samples.push(Math.hypot(end.x,end.y));
    }
    assert.ok(Math.max(...samples)>2,name+'末端应该明显飘动');
  }
});
