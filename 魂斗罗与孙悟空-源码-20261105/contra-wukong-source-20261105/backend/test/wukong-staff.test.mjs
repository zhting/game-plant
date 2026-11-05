import test from 'node:test';
import assert from 'node:assert/strict';
import {STAFF_READY,STAFF_FORMS} from '../../games/wukong/js/wukong-staff-forms.mjs';
import {STAFF_VARIANTS,staffMotion,staffGeometry,resolveStaff,segmentBoxTime} from '../../games/wukong/js/wukong-combat.mjs';
import {attackPose,staffStance} from '../../games/wukong/js/wukong-motion.mjs';
import {visualStaffGeometry} from '../../games/wukong/js/wukong-idle.mjs';

const actor=(variant,u=0,values={})=>({x:300,y:144,onGround:true,vx:0,face:1,giantT:0,
  staff:{kind:'sweep',variant,t:u*.4,duration:.4,combo:1,weapon:'rifle',face:1,hits:[]},...values});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('各棍法包含不同的握把和重心轨迹，起收势回到相同的斜立持棍姿势',()=>{
  assert.deepEqual(Object.keys(STAFF_FORMS).sort(),[...STAFF_VARIANTS].sort());
  assert.ok(STAFF_READY.angle<-.8,'待机不再平端兵器');
  const signatures=new Set();
  for(const variant of STAFF_VARIANTS){
    const p=actor(variant),begin=staffGeometry(p,0),end=staffGeometry(p,.4),samples=[];
    for(const point of ['origin','tip','butt'])for(const axis of ['x','y'])close(begin[point][axis],end[point][axis]);
    for(let i=0;i<=40;i++){
      const m=staffMotion(p,i/40*.4);assert.ok(Object.values(m).filter(v=>typeof v==='number').every(Number.isFinite));
      samples.push([m.angle,m.gripX,m.gripY,m.nearGrip,m.farGrip,m.lean,m.frontStep].map(v=>v.toFixed(2)).join(','));
    }
    signatures.add(samples.join(';'));
    assert.ok(new Set(samples).size>20,variant+'要有完整的运动轨迹');
  }
  assert.equal(signatures.size,30,'视频连招、传统武术与原有棍法各自有不同的动作轨迹');
});

test('左右朝向与巨大化时，持棍手仍在实体棍身内，舞花的辅助手可以松开再握回',()=>{
  const released=new Set();
  for(const face of [-1,1])for(const giantT of [0,3])for(const variant of STAFF_VARIANTS){
    for(let i=0;i<=40;i++){
      const p=actor(variant,i/40,{face,giantT});p.staff.face=face;
      const before=JSON.stringify(p),pose=attackPose(p),q=staffGeometry(p),size=giantT?2:1;
      const dx=q.tip.x-q.butt.x,dy=q.tip.y-q.butt.y,length=Math.hypot(dx,dy);
      assert.equal(pose.near.gripping,true);
      for(const arm of [pose.near,pose.far]){
        assert.ok([arm.shoulder,arm.elbow,arm.hand].every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)));
        assert.ok(Math.hypot(arm.hand.x-arm.shoulder.x,arm.hand.y-arm.shoulder.y)<13.7,'握把不应把手臂拉长');
        if(!arm.gripping){released.add(variant);continue;}
        const x=p.x+arm.hand.x*face*size-q.butt.x,y=p.y+arm.hand.y*size-q.butt.y;
        close((x*dy-y*dx)/length,0);
        const along=(x*dx+y*dy)/(length*length);assert.ok(along>0&&along<1,variant);
      }
      assert.equal(JSON.stringify(p),before,'采样动作不能修改世界状态');
    }
  }
  assert.deepEqual([...released].sort(),['backFlower','cloud','risingSpin']);
  const p=actor('cloud',1);assert.equal(attackPose(p).far.gripping,true,'收势握回棍身');
});

test('云棍在头顶水平盘旋，劈棍双手过顶，低扫沉身，弓步与转腰配合发力',()=>{
  for(let u=.18;u<=.64;u+=.01){
    const p=actor('cloud',u),q=staffGeometry(p);
    assert.ok(q.origin.y<p.y-32);assert.ok(q.tip.y<p.y-24&&q.butt.y<p.y-24,'头顶盘旋不落成竖直风车');
  }
  const overhead=attackPose(actor('overhead',.38));
  assert.ok(overhead.near.hand.y<-31&&overhead.far.hand.y<-34);
  const low=attackPose(actor('lowSweep',.5)),bow=actor('thrust',.5);
  assert.ok(low.bob>3&&low.stretch<1);assert.ok(attackPose(bow).near.hand.x>2);
  const before=JSON.stringify(bow),stance=staffStance(bow),start=staffStance(actor('thrust',0));
  assert.ok(stance[1].ankle.x-start[1].ankle.x>2.5);assert.ok(stance[1].hip.y-start[1].hip.y>1);
  assert.ok(stance.every(leg=>leg.ankle.y===-2.5&&leg.knee.y<leg.ankle.y));
  assert.equal(JSON.stringify(bow),before);
  assert.equal(staffStance({...bow,vx:90}),null,'奔跑时保留原跑步步态');
  assert.equal(staffStance({...bow,onGround:false}),null,'腾空时保留跳跃下半身');
  const ready={...bow,staff:null,statusTime:.7};
  const pose=attackPose(ready),q=visualStaffGeometry(ready),axis={x:Math.cos(q.angle),y:Math.sin(q.angle)};
  for(const arm of [pose.near,pose.far])close((ready.x+arm.hand.x-q.origin.x)*axis.y-(ready.y+arm.hand.y-q.origin.y)*axis.x,0);
});

test('旋身时棍头与棍尾都可命中，同招不重复扣血，墙体分别挡住两端',()=>{
  for(const face of [-1,1])for(const giantT of [0,3])for(const blocked of ['none','front','rear']){
    const p=actor('whirlwind',.38,{face,giantT});p.staff.face=face;
    const size=giantT?2:1,q=staffGeometry(p);
    const box=(x,y)=>({x:x-1,y:y-1,w:2,h:2,hp:20});
    const rear=box(q.origin.x+(q.butt.x-q.origin.x)*.75,q.origin.y),front=box(q.origin.x+(q.tip.x-q.origin.x)*.75,q.origin.y);
    assert.equal(segmentBoxTime(q.origin,q.tip,rear,3*size),null,'后方目标只能由棍尾命中');
    const target=blocked==='front'?front:rear;
    const wall={x:(q.origin.x+target.x+1)/2-1,y:q.origin.y-50,w:2,h:100,g:1};
    const world={enemies:[rear,front],pods:[],parts:[],solids:blocked==='none'?[]:[wall],enemyBox:e=>e,
      podBox:p=>p,damageEnemy:(e,damage)=>{e.hp-=damage;},popPod(){},hitPart(){}};
    resolveStaff(p,world);resolveStaff(p,world);
    assert.equal(rear.hp,blocked==='rear'?20:20-2*size);assert.equal(front.hp,blocked==='front'?20:20-2*size);
  }
});
