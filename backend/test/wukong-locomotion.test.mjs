import test from 'node:test';
import assert from 'node:assert/strict';
import { RUN_BONES, RUN_STANCE, runStride } from '../../games/contra2026/js/stage-one-motion.mjs';
import { STAFF_VARIANTS, staffGeometry } from '../../games/wukong/js/wukong-combat.mjs';
import { attackPose } from '../../games/wukong/js/wukong-motion.mjs';
import { guardWalkingPose } from '../../games/wukong/js/wukong-guard-art.mjs';
import { WUKONG_HIPS, WUKONG_RUN_LIFT, bodyPoint, groundGait, walkingLegs } from '../../games/wukong/js/wukong-locomotion.mjs';

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const actor=(speed=90,size=1)=>({x:150,y:112,vx:speed,face:Math.sign(speed),onGround:true,anim:0,statusTime:0,giantT:size===2?3:0,ax:Math.sign(speed),ay:0});

test('悟空走动挥棍的髋关节始终连接到同一腰身变换，膝踝连接且脚底沿用原步态',()=>{
  for(const speed of [-120,-60,60,120])for(const size of [1,2])for(const variant of [null,...STAFF_VARIANTS])for(let i=0;i<48;i++){
    const p=actor(speed,size);p.anim=i/48*runStride()*size/Math.abs(speed)*10;
    if(variant)p.staff={kind:'sweep',variant,t:i%20/20*.4,duration:.4,combo:2,face:p.face,aim:0,weapon:'rifle'};
    const before=JSON.stringify(p),pose=attackPose(p),gait=groundGait(p),legs=walkingLegs(p,pose);
    for(const [j,leg]of legs.entries()){
      const hip=bodyPoint(pose,WUKONG_HIPS[j].x,WUKONG_HIPS[j].y);
      close(leg.hip.x,hip.x);close(leg.hip.y,hip.y);
      close(leg.ankle.x,gait.legs[j].ankle.x);close(leg.foot.x,gait.legs[j].foot.x);
      close(leg.foot.y,gait.legs[j].foot.y*WUKONG_RUN_LIFT);close(leg.ankle.y,leg.foot.y-RUN_BONES.sole);
      if(leg.stance)assert.equal(leg.foot.y,0);
      close(Math.hypot(leg.knee.x-leg.hip.x,leg.knee.y-leg.hip.y),RUN_BONES.upper*leg.stretch);
      close(Math.hypot(leg.ankle.x-leg.knee.x,leg.ankle.y-leg.knee.y),RUN_BONES.lower*leg.stretch);
      assert.ok(leg.stretch>=1&&leg.stretch<1.12,'极端边走边挥棍保持轻微轴向延展，不能抻长双腿');
    }
    // The torso may bob and turn, while the gripping hands still meet the staff.
    const q=staffGeometry(p),axis={x:q.tip.x-q.butt.x,y:q.tip.y-q.butt.y};
    for(const arm of [pose.near,pose.far])if(arm.gripping){
      const x=p.x+arm.hand.x*q.face*size-q.butt.x,y=p.y+arm.hand.y*size-q.butt.y;
      close((x*axis.y-y*axis.x)/Math.hypot(axis.x,axis.y),0);
    }
    assert.equal(JSON.stringify(p),before);
  }
});

test('走路腰身随迈步起伏，支撑脚不滑动，循环接回首帧时身体和关节连续',()=>{
  for(const speed of [-90,90])for(const size of [1,2]){
    const p=actor(speed,size),period=runStride()*size/Math.abs(speed),samples=[];let planted;
    for(let i=0;i<=120;i++){
      p.anim=i/120*period*10;const pose=attackPose(p),legs=walkingLegs(p,pose);samples.push({pose,legs});
      if(i<120*RUN_STANCE){
        const worldX=i/120*period*speed+p.face*legs[0].foot.x*size;
        if(!i)planted=worldX;else close(worldX,planted);
      }
      if(i){
        const previous=samples[i-1];
        for(const [j,leg]of legs.entries())for(const joint of ['hip','knee','ankle'])assert.ok(Math.hypot(leg[joint].x-previous.legs[j][joint].x,leg[joint].y-previous.legs[j][joint].y)<1.2);
      }
    }
    assert.ok(Math.max(...samples.map(s=>s.pose.bob))-Math.min(...samples.map(s=>s.pose.bob))>1);
    for(const [j,leg]of samples[0].legs.entries())for(const joint of ['hip','knee','ankle']){
      close(leg[joint].x,samples.at(-1).legs[j][joint].x);close(leg[joint].y,samples.at(-1).legs[j][joint].y);
    }
  }
});

test('静止、腾空、趴下和驾云继续使用对应姿势，涉云海时仍采用原低步幅轨迹',()=>{
  const p=actor();
  for(const state of [{vx:0},{onGround:false},{prone:true},{spin:true},{dead:true},{ride:'heli'},{restingOnCloud:true}])assert.equal(groundGait({...p,...state}),null);
  const water={...p,inWater:true,anim:.7},gait=groundGait(water),legs=walkingLegs(water,attackPose(water));
  assert.ok(gait.legs.some(l=>l.stance));assert.deepEqual(legs.map(l=>l.ankle),gait.legs.map(l=>l.ankle));
});

test('天兵走路从自身躯干髋点连接饱满腿甲，腿部适合原身高且落脚不悬空',()=>{
  for(const face of [-1,1])for(let i=0;i<=120;i++){
    const p={x:150,y:144,face,vx:62*face,onGround:true,guard:true,anim:i/120*36/62*10,guardClock:1};
    const before=JSON.stringify(p),pose=guardWalkingPose(p);
    assert.equal(pose.legs.length,2);
    for(const [j,leg]of pose.legs.entries()){
      const hip=bodyPoint(pose.body,((j?230:170)-218)*28/356,(735-870)*28/356);
      close(leg.hip.x,hip.x);close(leg.hip.y,hip.y);
      close(Math.hypot(leg.knee.x-leg.hip.x,leg.knee.y-leg.hip.y),6.5*leg.stretch);
      close(Math.hypot(leg.ankle.x-leg.knee.x,leg.ankle.y-leg.knee.y),6.4*leg.stretch);
      close(leg.ankle.y,leg.foot.y-2.5);assert.ok(leg.foot.y>=-4.1&&leg.foot.y<=0);assert.ok(leg.stretch<1.1);
      if(leg.stance)assert.equal(leg.foot.y,0);
    }
    assert.equal(JSON.stringify(p),before);
  }
});
