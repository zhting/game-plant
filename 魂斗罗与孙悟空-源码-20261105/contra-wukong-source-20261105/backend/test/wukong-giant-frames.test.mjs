import test from 'node:test';
import assert from 'node:assert/strict';
import { GIANT_WHOLE_ASSETS, GIANT_WHOLE_FRAMES, wholeGiantFrame, wholeGiantPose } from '../../games/wukong/js/wukong-giant-frames.mjs';
import { drawWholeGiant } from '../../games/wukong/js/wukong-giant-sprites.mjs';
import { giantPose, giantBody } from '../../games/wukong/js/wukong-boss.mjs';

const all=Object.values(GIANT_WHOLE_FRAMES).flat(),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const attack=(kind='cleave',time=0,face=1)=>({x:3170,y:176,face,onGround:true,clock:1,gait:0,vx:0,walkBlend:0,
  attack:{kind,t:time,windup:kind==='leap'?.72:.8,strike:kind==='leap'?1.18:kind==='whirlwind'?.6:.32,recovery:.85,flight:.68}});

test('巨灵神提供六张透明图集中的六十个完整关键姿势，双帧补绘替换粘连横扫，不复用分体骨骼图',()=>{
  assert.equal(Object.keys(GIANT_WHOLE_ASSETS).length,6);assert.equal(all.length,60);assert.equal(new Set(all.map(f=>f.id)).size,60);
  assert.equal(GIANT_WHOLE_FRAMES.sweep[4].sheet,'giantWholeSweepLink');assert.equal(GIANT_WHOLE_FRAMES.sweep[5].sheet,'giantWholeSweepLink');
  for(const f of all){
    assert.ok(GIANT_WHOLE_ASSETS[f.sheet]);assert.ok(Object.isFrozen(f));assert.ok(f.scale>.15&&f.scale<.4);
    for(const p of [f.anchor,f.pick,f.origin,f.tip,f.butt])assert.ok(p[0]>=0&&p[0]<=f.sourceWidth&&p[1]>=0&&p[1]<=f.sourceHeight,f.id);
    assert.ok(Math.hypot(f.tip[0]-f.origin[0],f.tip[1]-f.origin[1])>60,f.id);
  }
});

test('下劈横扫与旋身完整播放十二张不同整身帧，蓄势与发力分段，半血提速不换错帧',()=>{
  for(const kind of ['cleave','sweep','whirlwind'])for(const pace of [1,.7]){
    const g=attack(kind);g.attack.windup*=pace;const seen=new Set(),length=g.attack.windup+g.attack.strike+g.attack.recovery;
    for(let t=0;t<length;t+=1/240){g.attack.t=t;seen.add(wholeGiantFrame(g).frame.id);}
    assert.equal(seen.size,12,kind+' pace '+pace);
    for(const u of [.2,.5,.9]){
      const ordinary=attack(kind),fast=attack(kind);fast.attack.windup*=.7;
      ordinary.attack.t=ordinary.attack.windup*u;fast.attack.t=fast.attack.windup*u;
      assert.equal(wholeGiantFrame(ordinary).frame.id,wholeGiantFrame(fast).frame.id);
    }
  }
});

test('行走以实际位移循环八张整身图，后撤反向迈步，收势移动同样切换完整步行帧',()=>{
  const forward=[],backward=[];
  for(let i=0;i<8;i++){
    const g={x:3170,y:176,face:1,vx:48,walkBlend:1,gait:(i+.1)/8*36/56*Math.PI*2};
    const a=wholeGiantFrame(g);forward.push(a.frame.index);assert.equal(a.clip,'walk');
    const b=wholeGiantFrame({...g,vx:-48,gait:-g.gait});backward.push(b.frame.index);assert.equal(b.clip,'retreat');
    const recovering=attack('cleave',.8+.32+.65);Object.assign(recovering,{walkBlend:1,vx:-34,gait:-g.gait});
    const retreat=wholeGiantFrame(recovering);assert.equal(retreat.frame.id,b.frame.id);assert.equal(retreat.clip,'retreat');
  }
  assert.equal(new Set(forward).size,8);assert.equal(new Set(backward).size,8);assert.deepEqual(backward,[11,10,9,8,7,6,5,4]);
});

test('踏地抬腿、屈膝起跳、收腿腾空、伸腿落地各用整身姿势，不改变主机飞行位置',()=>{
  const samples=[['stomp',0,0],['stomp',.8,2],['stomp',.8+.32,4],['leap',.1,6],['leap',.7,7],
    ['leap',.72+.3,8],['leap',.72+.6,9],['leap',.72+.69,10],['leap',.72+.68+.4,11]];
  for(const [kind,t,index]of samples){const g=attack(kind,t);g.y=142;g.onGround=false;const before=JSON.stringify(g);
    assert.equal(wholeGiantFrame(g).frame.id,'mobility:'+index);assert.equal(JSON.stringify(g),before);}
});

test('画面斧柄、斧头与实际命中统一采样整帧标定，朝向和起跳高度同步，不使用旧骨骼斧线',()=>{
  for(const face of [-1,1])for(const kind of ['cleave','sweep','whirlwind','stomp','leap'])for(let t=0;t<2.6;t+=.013){
    const g=attack(kind,t,face);g.y=139;const before=JSON.stringify(g),p=wholeGiantPose(g),q=giantPose(g),f=p.frame;
    for(const key of ['origin','tip','butt']){
      close(p[key].x,g.x+face*(f[key][0]-f.anchor[0])*f.scale);
      close(p[key].y,g.y+(f[key][1]-f.anchor[1])*f.scale*p.stretch);
      assert.deepEqual(q[key],p[key]);
    }
    assert.deepEqual(giantBody(g),p.body);assert.equal(JSON.stringify(g),before);
  }
});

test('每次绘制只提交一张完整人物画布，复用预热图集，左右转向和所有动作都不会重拼四肢',()=>{
  const calls=[],g={save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args);}};
  const images=Object.fromEntries(Object.keys(GIANT_WHOLE_ASSETS).map(key=>[key,{naturalWidth:1448,naturalHeight:1086}]));
  const atlases=new Map(Object.keys(images).map(key=>[key,{image:images[key],frames:new Map(all.filter(f=>f.sheet===key).map(f=>
    [f.id,{canvas:{whole:f.id},x:-90,y:-150,w:180,h:150}]))}]));
  const art={images,g,giantSpriteAtlases:atlases,createCanvas(){assert.fail('已预热的整帧不能重新组装身体');}};
  for(const face of [-1,1])for(const kind of ['cleave','sweep','whirlwind','stomp','leap'])for(let t=0;t<2.5;t+=.02){
    const actor=attack(kind,t,face),before=JSON.stringify(actor);calls.length=0;assert.equal(drawWholeGiant(art,actor),true);
    assert.equal(calls.length,1);assert.equal(calls[0].length,5);assert.equal(calls[0][0].whole,wholeGiantFrame(actor).frame.id);
    assert.equal(JSON.stringify(actor),before);
  }
});
