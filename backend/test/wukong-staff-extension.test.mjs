import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceStaff,staffGeometry,resolveStaff,STAFF_VARIANTS} from '../../games/wukong/js/wukong-combat.mjs';
import {STAFF_EXTENSION,staffExtension} from '../../games/wukong/js/wukong-staff-extension.mjs';
import {STAFF_SEQUENCES} from '../../games/wukong/js/wukong-staff-sequences.mjs';
import {beginAirCleave} from '../../games/wukong/js/wukong-special-staff.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';
const hero=(extra={})=>({heroFrames:true,x:300,y:144,onGround:true,face:1,ax:1,ay:0,weapon:'laser',cool:0,...extra});
const length=q=>q.reach+q.rear;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('长棍待机走路仍为常态长度，每种棍法只向前伸展，收招恢复，巨大化与左右握点正确',()=>{
  for(const face of [-1,1])for(const giantT of [0,2]){
    const p=hero({face,giantT}),base=length(staffGeometry(p));close(base,giantT?136:68);
    p.vx=90;close(length(staffGeometry(p)),base);
    for(const variant of STAFF_VARIANTS){
      p.staff={kind:'sweep',variant,weapon:'laser',t:0,duration:1,face,combo:1,hits:[]};
      close(length(staffGeometry(p,0)),base);close(length(staffGeometry(p,1)),base);
      let peak=base;
      for(let i=0;i<=100;i++){
        const t=i/100,q=staffGeometry(p,t),normal=staffGeometry({...p,staff:{...p.staff,weapon:'rifle'}},t);
        assert.deepEqual(q.origin,normal.origin);close(q.rear,normal.rear);assert.ok(length(q)<=base*1.45+1e-6);peak=Math.max(peak,length(q));
      }
      close(peak,base*1.45);
    }
  }
});
test('长棍多出收招时间，不能连点取消恢复，按住蓄力也必须先完成伸缩动作',()=>{
  const normal=hero({weapon:'rifle'}),long=hero();for(const p of [normal,long])advanceStaff(p,{fire:true},0,{random:()=>0});
  close(long.staff.duration-normal.staff.duration,STAFF_EXTENSION.recovery);assert.ok(long.cool>normal.cool);
  const action=long.staff;advanceStaff(long,{fire:true},.28,{playerActions:true});assert.equal(long.staff,action);assert.ok(!long.staffCharge.active);
  long.staff.t=long.staff.duration*.83;const remaining=long.cool;
  assert.equal(advanceStaff(long,{fire:true,fireEdge:true},0,{playerActions:true}),false);assert.equal(long.staff,action);assert.equal(long.cool,remaining);
  advanceStaff(long,{fire:true},long.staff.duration,{playerActions:true});assert.ok(long.staffCharge.active);
});
test('抽回阶段不再造成接触伤害，三段长棍连招各自伸缩且每段仅命中一次',()=>{
  for(const variant of ['cross',...Object.keys(STAFF_SEQUENCES)]){
    const p=hero(),foe={x:0,y:-500,w:1000,h:1000,hp:100};
    p.staff={kind:'sweep',variant,weapon:'laser',t:0,duration:1,face:1,combo:1,hits:[],extension:true};
    const world={enemies:[foe],pods:[],parts:[],solids:[],enemyBox:e=>e,podBox:e=>e,damageEnemy:(e,d)=>{e.hp-=d;},popPod(){},hitPart(){}};
    for(let i=0;i<=100;i++){p.staff.t=i/100;resolveStaff(p,world);resolveStaff(p,world);}
    assert.equal(foe.hp,variant==='cross'?98:93,variant);
    const untouched={...foe,hp:100};p.staff.hits=[];p.staff.beatHits=[[],[],[]];p.staff.t=.99;
    resolveStaff(p,{...world,enemies:[untouched]});assert.equal(untouched.hp,100);
  }
});
test('空中下劈有对应收棍时长，受击及蓄力恢复常态长度，联机保留相同伸缩相位',()=>{
  const p=hero({onGround:false});assert.equal(beginAirCleave(p),true);close(p.staff.duration,.58+STAFF_EXTENSION.recovery);
  p.staff.t=p.staff.duration*.5;const [copy]=unpackWorld(packWorld([p]));assert.deepEqual(staffGeometry(copy),staffGeometry(p));assert.equal(copy.staff.extension,true);
  assert.ok(staffExtension(p).scale>1);p.hurt={t:0,duration:.2};assert.equal(staffExtension(p).scale,1);
  delete p.hurt;p.staffCharge={active:true};assert.equal(staffExtension(p).scale,1);
});
