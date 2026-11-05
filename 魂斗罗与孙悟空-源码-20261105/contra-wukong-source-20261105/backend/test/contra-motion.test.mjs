import test from 'node:test';
import assert from 'node:assert/strict';
import { isRunning, isWading, runGait, wadeGait, RUN_STANCE, RUN_BONES, runStride, WADE_STANCE, WADE_STRIDE, MOTORCYCLE_RIDER } from '../../games/contra2026/js/stage-one-motion.mjs';
import {HDActorArt,HD_ACTORS,HD_RUN_RIG,actorPose} from '../../games/contra2026/js/hd-actors.mjs';
import {advanceMotorcycle,motorcyclePose,motorcycleMuzzle,MOTORCYCLE_WHEELS} from '../../games/contra2026/js/motorcycle-motion.mjs';

test('摩托快行时抬前轮，起跳抬得更高，松油门后平稳放下，后轮轴保持固定',()=>{
  const p={ride:'moto',onGround:true,vx:170,vy:0};
  for(let i=0;i<30;i++)advanceMotorcycle(p,1/60);
  const ground=motorcyclePose(p);assert.ok(ground.frontLift>3.8&&ground.frontLift<4.1);
  p.onGround=false;p.vy=-260;for(let i=0;i<10;i++)assert.equal(advanceMotorcycle(p,1/60),false);
  const jump=motorcyclePose(p);assert.ok(jump.frontLift>ground.frontLift+3);
  assert.equal(jump.rearX,MOTORCYCLE_WHEELS.rearX);assert.equal(jump.axleY,MOTORCYCLE_WHEELS.axleY);
  p.onGround=true;p.vx=0;p.vy=0;const before=p.motoPitch;advanceMotorcycle(p,1/60);
  assert.ok(p.motoPitch>0&&p.motoPitch<before,'落地收油不会瞬间拍下前轮');
  for(let i=0;i<60;i++)advanceMotorcycle(p,1/60);assert.equal(p.motoPitch,0);
});

test('摩托枪口随座垫移动但不改变瞄准方向，左右轮抬姿势完全镜像',()=>{
  for(const pitch of [0,.16,.36])for(const ay of [0,-Math.SQRT1_2]){
    const p={x:100,y:176,face:1,ax:Math.sqrt(1-ay*ay),ay,motoPitch:pitch};
    const right=motorcycleMuzzle(p),left=motorcycleMuzzle({...p,face:-1,ax:-p.ax});
    assert.ok(Math.abs(right.x-100-(100-left.x))<1e-9);assert.equal(right.y,left.y);
    const dx=MOTORCYCLE_RIDER.seatX-MOTORCYCLE_WHEELS.rearX,dy=MOTORCYCLE_RIDER.waist-MOTORCYCLE_WHEELS.axleY;
    const hipY=MOTORCYCLE_WHEELS.axleY-dx*Math.sin(pitch)+dy*Math.cos(pitch);
    const gunAboveHip=-MOTORCYCLE_RIDER.muzzleHeight+ay*11-MOTORCYCLE_RIDER.waist;
    assert.ok(Math.abs(right.y-(p.y+hipY+gunAboveHip))<1e-9);
  }
});

test('跑步时支撑脚贴地且世界位置保持不动，摆动脚抬起，膝关节连接连续', () => {
  for (const speed of [-120,-90,-60,60,90,120]) for (const size of [1, 2]) {
    const step = runStride() * size / Math.abs(speed) / 120;
    let worldFoot;
    for (let i = 0; i < 120; i++) {
      const time = i * step, gait = runGait(time * 10, speed, size);
      if (i < 120*RUN_STANCE) {
        const x = time * speed + Math.sign(speed)*gait.legs[0].foot.x * size;
        if (!i) worldFoot = x;
        assert.ok(Math.abs(x - worldFoot) < 1e-9, 'support foot must not slide across the ground');
      }
      for (const leg of gait.legs) {
        assert.ok(Math.abs(Math.hypot(leg.knee.x - leg.hip.x, leg.knee.y - leg.hip.y) - RUN_BONES.upper) < 1e-9);
        assert.ok(Math.abs(Math.hypot(leg.ankle.x - leg.knee.x, leg.ankle.y - leg.knee.y) - RUN_BONES.lower) < 1e-9);
        assert.ok(leg.foot.y <= 0);
      }
    }
  }
});

test('向上与斜向瞄准不冻结跑步；停步、翻滚、卧倒、入水和载具使用各自动作', () => {
  const moving = { vx: 90, onGround: true };
  for (const ay of [-1, -.7, 0, .7]) assert.equal(isRunning({ ...moving, ay }), true);
  for (const state of [{ vx: 0 }, { onGround: false }, { spin: true }, { prone: true }, { dead: true }, { inWater: true }, { ride: 'moto' }, { ride: 'heli' }]) {
    assert.equal(isRunning({ ...moving, ...state }), false);
  }
});

test('敌兵双向奔跑持续交替抬腿，支撑脚与移动速度同步，腾空和停止不继续踏步', () => {
  for (const speed of [-62, 62]) {
    const duration = runStride(true) / Math.abs(speed), phases = [];
    for (let i = 0; i < 32; i++) {
      const time = i * duration / 32, gait = runGait(time * 10, speed, 1, true);
      phases.push(gait);
      if (i < 32*RUN_STANCE) assert.ok(Math.abs(time * Math.abs(speed) + gait.legs[0].foot.x - (-RUN_BONES.hipOffset+runStride(true)*RUN_STANCE/2)) < 1e-9);
      for (const leg of gait.legs) {
        assert.ok(leg.foot.y <= 0);
        assert.ok(Math.abs(Math.hypot(leg.knee.x - leg.hip.x, leg.knee.y - leg.hip.y) - RUN_BONES.upper) < 1e-9);
      }
    }
    for (const index of [0, 1]) assert.ok(phases.some(gait => gait.legs[index].foot.y < -6));
    assert.equal(isRunning({ vx: speed, onGround: true }), true);
    assert.equal(isRunning({ vx: speed, onGround: false }), false);
  }
  assert.equal(isRunning({ vx: 0, onGround: true }), false);
});

test('蹬地与落脚的足部轨迹一阶连续，每个周期有两次腾空，脚掌落地保持水平',()=>{
  const cycle=runStride()/90,at=phase=>runGait(phase*cycle*10,90).legs[0];
  const epsilon=1e-5;
  for(const boundary of [0,RUN_STANCE,1]){
    const before=at(boundary-epsilon),center=at(boundary),after=at(boundary+epsilon);
    for(const axis of ['x','y']){
      const incoming=(center.foot[axis]-before.foot[axis])/epsilon,outgoing=(after.foot[axis]-center.foot[axis])/epsilon;
      assert.ok(Math.abs(incoming-outgoing)<.02,axis+' has no velocity snap at contact');
    }
  }
  let flightEntries=0,wasFlying=false;
  for(let i=0;i<240;i++){
    const gait=runGait(i/240*cycle*10,90),flying=gait.legs.every(l=>!l.stance);
    if(flying&&!wasFlying)flightEntries++;wasFlying=flying;
    for(const leg of gait.legs)if(leg.stance){assert.equal(leg.foot.y,0);assert.equal(leg.footAngle,0);}
  }
  assert.equal(flightEntries,2);
});

function recordedCanvas(){
  const calls=[],ink=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args])});
  return {calls,getContext:()=>ink};
}

test('骑摩托始终坐在车座上，膝盖向前弯曲，脚踩脚踏且行驶中不踏步',()=>{
  for(const leg of MOTORCYCLE_RIDER.legs){
    assert.ok(leg.knee.x>leg.hip.x+6);
    assert.ok(leg.ankle.x<leg.knee.x-4);
    assert.ok(leg.ankle.y+RUN_BONES.sole< -3,'boots remain above the wheels');
    assert.ok(Math.abs(Math.hypot(leg.knee.x-leg.hip.x,leg.knee.y-leg.hip.y)-RUN_BONES.upper)<1e-9);
    assert.ok(Math.abs(Math.hypot(leg.ankle.x-leg.knee.x,leg.ankle.y-leg.knee.y)-RUN_BONES.lower)<1e-9);
  }
  for(const role of ['red','blue']){
    const art=new HDActorArt(recordedCanvas,{[HD_ACTORS[role].key]:{naturalWidth:1086},runLimbs:{naturalWidth:1086}});
    const output=recordedCanvas(),g=output.getContext('2d');
    for(const vx of [0,170,-170])for(const onGround of [true,false]){
      const p={ride:'moto',vx,onGround,anim:35,ay:0};
      assert.equal(actorPose({...p,spin:true,prone:true}),'moto');
      art.draw(g,p,role,10);
      const seated=art.movingFrames.get(`${role}:moto:10`);
      assert.ok(seated);assert.equal(seated.waist,MOTORCYCLE_RIDER.waist);
      const version=seated.version;art.draw(g,{...p,anim:200},role,10);
      assert.equal(seated.version,version,'travel does not cycle the legs');
      art.draw(g,{...p,ay:-.7},role,10);assert.ok(seated.version>version,'aim still changes the upper body');
    }
    assert.equal(actorPose({ride:'moto',dead:true}),'dead');
  }
});

test('跑步以完整角色帧绘制，微小时间变化仍会改变关节，放大不挤压裤腿',()=>{
  const make=recordedCanvas;
  for(const role of ['blue','red','enemy']){
    const images={[HD_ACTORS[role].key]:{naturalWidth:1086},runLimbs:{naturalWidth:1086}},art=new HDActorArt(make,images);
    const poses=[],original=art.frame.bind(art);art.frame=(r,pose,density)=>{poses.push(pose);return original(r,pose,density);};
    const output=recordedCanvas(),g=output.getContext('2d'),p={vx:90,onGround:true,anim:1,ay:0};
    art.draw(g,p,role,10);
    const body=art.movingFrames.get(`${role}:10`),first=body.canvas.calls.filter(c=>c[0]==='translate'),version=body.version;
    assert.equal(output.calls.filter(c=>c[0]==='drawImage').length,1,'one whole figure reaches the world canvas');
    body.canvas.calls.length=0;output.calls.length=0;art.draw(g,{...p,anim:1.01},role,10);
    assert.equal(art.movingFrames.get(`${role}:10`),body,'reuse the full-frame canvas while running');
    assert.notDeepEqual(body.canvas.calls.filter(c=>c[0]==='translate'),first);
    assert.equal(body.version,version+1);
    assert.equal(output.calls.filter(c=>c[0]==='drawImage').length,1);
    art.draw(g,{...p,anim:1.01},role,10);assert.equal(body.version,version+1,'a paused pose does not rebuild');
    assert.ok(poses.includes('rigNearBoot')&&poses.includes('rigFarThigh'));assert.ok(!poses.some(p=>/^run\d/.test(p)));
    const cache=art.frame(role,'rigNearThigh',10);assert.equal(cache,art.frame(role,'rigNearThigh',10));
    const larger=art.frame(role,'rigNearThigh',20);assert.equal(cache.w,larger.w);assert.equal(larger.canvas.width,Math.ceil(larger.w*20));
    assert.ok(cache.w>=6,'trousers retain their painted width');
    assert.ok(!body.canvas.calls.some(c=>c[0]==='scale'),'joint rotation must not squeeze trouser width');
    for(const name of ['Near','Far']){
      const boot=art.frame(role,`rig${name}Boot`,10);
      assert.ok(Math.abs(boot.y+boot.h-RUN_BONES.sole)<.06,'the painted sole matches the simulated planted foot');
    }
  }
});

test('蘑菇保护和隐身只作用于完整轮廓，瞄准、涉水和帧变化会同步更新高亮',()=>{
  for(const role of ['blue','red']){
    let allocations=0;
    const make=()=>{allocations++;return recordedCanvas();};
    const images={[HD_ACTORS[role].key]:{naturalWidth:1086},runLimbs:{naturalWidth:1086}},art=new HDActorArt(make,images);
    const output=recordedCanvas(),g=output.getContext('2d');
    let body,tint,tintDraws;
    for(const size of [1,2])for(const inWater of [false,true])for(const ay of [-1,-.7,0,.7]){
      const p={vx:90,onGround:true,anim:1.37,ay,inWater,giantT:size===2?12:0,giantGraceT:2};
      output.calls.length=0;art.draw(g,p,role,8);
      body=art.movingFrames.get(`${role}:8`);
      const draws=output.calls.filter(c=>c[0]==='drawImage');
      assert.equal(draws.length,6,'the outline, figure and glow share one assembled pose');
      assert.equal(draws[4][1],body.canvas);
      for(const draw of draws)assert.deepEqual(draw.slice(-2),[body.w,body.h],'no separate limb receives its own highlight');
      const gold=art.tinted(body,'#ffdf8a');
      if(tint){assert.equal(gold,tint,'reuse the tint buffer');assert.ok(gold.calls.filter(c=>c[0]==='drawImage').length>tintDraws,'refresh the outline after a pose change');}
      tint=gold;tintDraws=gold.calls.filter(c=>c[0]==='drawImage').length;
    }
    const giant=art.movingFrame(role,{vx:90,anim:1,giantT:12},'run1',16);
    assert.deepEqual([giant.w,giant.h,giant.x,giant.y],[body.w,body.h,body.x,body.y],'density changes only resolution');
    assert.equal(giant.canvas.width,Math.ceil(giant.w*16));
    const p={vx:90,onGround:true,ay:0,giantT:12,giantGraceT:2,camoT:2,statusTime:1};
    art.draw(g,{...p,anim:0},role,8);const warmed=allocations;
    for(let i=1;i<=240;i++)art.draw(g,{...p,anim:i/60*10},role,8);
    assert.equal(allocations,warmed,'continuous running and its status effects do not allocate per-frame canvases');
    art.clear();assert.equal(art.movingFrames.size,0);assert.equal(art.cache.size,0);
  }
});

test('贴图中髋、膝和踝的标定点经过实际绘制变换后准确连接，不再把脚跟作为脚踝',()=>{
  for(const [role,sheet]of Object.entries(HD_RUN_RIG)){
    for(const name of ['Near','Far'])for(const [part,length]of [['Thigh',RUN_BONES.upper],['Shin',RUN_BONES.lower]]){
      const f=sheet.frames[`rig${name}${part}`];
      assert.equal(f.anchor[0],f.end[0],role+' neutral part must have a straight axis');
      assert.ok((f.end[1]-f.anchor[1])>120,'source keeps real detail between the joints');
      for(let i=0;i<48;i++){
        const leg=runGait(i/48*runStride()/90*10,90).legs[name==='Near'?1:0];
        const start=part==='Thigh'?leg.hip:leg.knee,end=part==='Thigh'?leg.knee:leg.ankle;
        const angle=Math.atan2(end.y-start.y,end.x-start.x)-Math.PI/2;
        const local={x:(f.end[0]-f.anchor[0])*f.scale,y:(f.end[1]-f.anchor[1])*f.scaleY};
        assert.ok(Math.abs(local.y-length)<1e-10);
        assert.ok(Math.hypot(start.x+local.x*Math.cos(angle)-local.y*Math.sin(angle)-end.x,start.y+local.x*Math.sin(angle)+local.y*Math.cos(angle)-end.y)<1e-9);
      }
    }
    for(const name of ['Near','Far']){
      const boot=sheet.frames[`rig${name}Boot`];
      const [x,y,w,h]=boot.bounds;
      assert.ok((boot.anchor[1]-y)/h>.45&&(boot.anchor[1]-y)/h<.65,'ankle sits at the shaft/foot joint, above the heel');
      assert.ok(w*boot.scale>7&&w*boot.scale<8,'boots match the standing character');
      assert.ok(boot.anchor[0]>x&&boot.anchor[0]<x+w);
    }
  }
});

test('水中行走持续交替抬腿；停步、潜水和死亡不会继续踏水',()=>{
  const moving={vx:60,onGround:true,inWater:true};
  assert.equal(isWading(moving),true);assert.equal(actorPose(moving),'wade');
  for(const state of [{vx:0},{dive:true},{dead:true},{spin:true},{onGround:false},{ride:'moto'}])assert.equal(isWading({...moving,...state}),false);
  const planted=[];let lifted=[false,false];
  for(let i=0;i<120;i++){
    const time=i/120*WADE_STRIDE/60,gait=wadeGait(time*10,60);
    if(i<120*WADE_STANCE)planted.push(time*60+gait.legs[0].foot.x);
    assert.ok(gait.legs.some(l=>l.stance),'wading never becomes an airborne sprint');
    gait.legs.forEach((leg,index)=>{
      if(leg.foot.y< -3)lifted[index]=true;
      assert.ok(Math.abs(Math.hypot(leg.knee.x-leg.hip.x,leg.knee.y-leg.hip.y)-RUN_BONES.upper)<1e-9);
      assert.ok(Math.abs(Math.hypot(leg.ankle.x-leg.knee.x,leg.ankle.y-leg.knee.y)-RUN_BONES.lower)<1e-9);
    });
  }
  assert.ok(planted.every(x=>Math.abs(x-planted[0])<1e-9));assert.deepEqual(lifted,[true,true]);
});
