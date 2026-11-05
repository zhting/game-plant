import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceStaff,resolveStaff,startUltimate,staffGeometry} from '../../games/wukong/js/wukong-combat.mjs';
import {STAFF_CHARGE,AIR_CLEAVE,advanceStaffQi,releaseStaffQi,beginAirCleave,cancelStaffCharge} from '../../games/wukong/js/wukong-special-staff.mjs';
import {wholeHeroFrame} from '../../games/wukong/js/wukong-hero-frames.mjs';
import {actorRootY} from '../../games/wukong/js/wukong-mount.mjs';
import {receiveHeroHit,newVitality} from '../../games/wukong/js/wukong-vitality.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';
import {drawSpecialStaff} from '../../games/wukong/js/wukong-special-staff-art.mjs';

const dt=1/60;
const hero=extra=>({x:100,y:144,heroFrames:true,pid:1,face:1,ax:1,ay:0,vx:0,vy:0,cool:0,onGround:true,weapon:'rifle',...newVitality(),...extra});
const input=(p,frames,fire,options={})=>{for(let i=0;i<frames;i++)advanceStaff(p,{fire,fireEdge:fire&&i===0},dt,{playerActions:true,random:()=>0,...options});};
const target=(x,y=125,hp=30)=>({x:x-4,y:y-8,w:8,h:16,hp});
function scene(enemies=[],solids=[]){return {enemies,solids,pods:[],parts:[],enemyBox:e=>e,podBox:e=>e,
  damageEnemy(e,n){e.hp-=n;},popPod(p){p.flee=true;},hitPart(p,n){p.hp-=n;}};}

test('短按 J 保留整段随机近战，松开不会发棍气，持续点按可衔接三段',()=>{
  const p=hero();input(p,3,true);const action=p.staff;assert.ok(action);input(p,1,false);
  assert.equal(p.staff,action);assert.equal(p.staffCharge,null);assert.equal(p.staffWaves,undefined);
  const combos=[p.staffCombo];
  for(let n=0;n<150;n++){
    const fire=!p.staff&&p.cool<=0;advanceStaff(p,{fire,fireEdge:fire},dt,{playerActions:true,random:()=>0});
    if(fire)combos.push(p.staffCombo);
  }assert.ok(combos.includes(2)&&combos.includes(3));
});
test('半秒蓄力进入明确持棍姿势，松开仅放一发棍气，发射收招不附加隐形近战伤害',()=>{
  const p=hero(),sounds=[];input(p,33,true,{onCharge:stage=>sounds.push(stage)});
  assert.equal(p.staffCharge.ready,true);assert.equal(p.staff,null);assert.equal(wholeHeroFrame(p).clip,'charge');
  assert.deepEqual(sounds,['start','ready']);input(p,1,false);
  assert.equal(p.staff.kind,'qiCast');assert.equal(p.staffWaves.length,1);assert.equal(p.staffWaves[0].damage,4);assert.equal(p.staffWaves[0].strength,1);
  const emitted=p.staffWaves;p.staffWaves=[];p.staff.t=.18;
  const close=target(120);resolveStaff(p,scene([close]));assert.equal(close.hp,30,'收招动作本身不额外造成棍击');p.staffWaves=emitted;
  input(p,5,false);assert.equal(p.staffWaves.length,1);assert.equal(p.staffCharge,null);
});
test('短按下一棍可在当前招式结束前预输入，不必在收招那一帧重新按键',()=>{
  const p=hero();input(p,2,true);input(p,2,false);const first=p.staff;
  input(p,2,true);input(p,1,false);assert.equal(p.staff,first);
  let chained=false;for(let i=0;i<80;i++){input(p,1,false);if(p.staff&&p.staff!==first){chained=true;assert.equal(p.staff.combo,2);break;}}
  assert.equal(chained,true);assert.equal(p.staffWaves,undefined);
});
test('长按满蓄与超时保持都不会自动连发，松开得到更大的七点穿透棍气，满蓄提示仅一次',()=>{
  const p=hero(),notices=[];input(p,150,true,{onCharge:s=>notices.push(s)});
  assert.equal(p.staffCharge.full,true);assert.equal(p.staffCharge.t,STAFF_CHARGE.hold);assert.equal(p.staffWaves,undefined);
  assert.deepEqual(notices,['start','ready','full']);input(p,1,false);const w=p.staffWaves[0];
  assert.equal(w.damage,7);assert.equal(w.radius,13);assert.equal(w.pierce,5);assert.equal(w.range,350);
  input(p,20,false);assert.equal(p.staffWaves.length,1);
});
test('提前松开只结束聚气，单击模式仍支持长按蓄力，蓄力期间不会继续随机出棍',()=>{
  const p=hero();input(p,20,true,{autofire:false});assert.equal(p.staffCharge.active,true);input(p,1,false,{autofire:false});assert.equal(p.staffWaves,undefined);
  input(p,40,true,{autofire:false});const t=p.staffCharge.t;assert.equal(p.staff,null);assert.ok(t>=STAFF_CHARGE.ready);
  input(p,1,false,{autofire:false});assert.equal(p.staffWaves.length,1);
});
test('疾风棍及疾速诀加快充能，长棍扩大气刃射程，三棍变三道，烈焰追加伤害',()=>{
  for(const extra of [{weapon:'machine'},{rapid:true},{weapon:'machine',rapid:true}]){
    const normal=hero(),fast=hero(extra);input(normal,25,true);input(fast,25,true);assert.ok(fast.staffCharge.t>normal.staffCharge.t);
  }
  for(const [weapon,count,damage]of [['rifle',1,7],['spread',3,7],['fire',1,8],['laser',1,7]]){
    const p=hero({weapon});releaseStaffQi(p,{t:2});assert.equal(p.staffWaves.length,count);assert.equal(p.staffWaves[0].damage,damage);
    if(weapon==='laser'){assert.ok(p.staffWaves[0].range>350);assert.ok(p.staffWaves[0].radius>13);}
  }
});
test('移动转向空中麒麟和筋斗云均可充能，棍气从当前身体高度与朝向释放',()=>{
  for(const ride of [null,'moto','heli'])for(const face of [-1,1]){
    const p=hero({ride,face,onGround:ride===null?false:true,vx:90});input(p,40,true);
    assert.match(wholeHeroFrame(p).clip,/charge/i);input(p,1,false);const w=p.staffWaves[0];
    assert.equal(Math.sign(w.vx),face);assert.equal(w.y,actorRootY(p)-19);assert.ok(Math.abs(w.x-p.x)>10);
  }
});
test('受击死亡大招和取消均打断充能，按键仍按住时不会在恢复后偷发棍气',()=>{
  const p=hero({invT:0});input(p,40,true);receiveHeroHit(p,{damage:12});assert.equal(p.staffCharge,null);
  input(p,10,true);assert.equal(p.staffWaves,undefined);p.hurt=null;input(p,10,true);assert.equal(p.staffCharge,null);
  input(p,1,false);input(p,40,true);assert.equal(p.staffCharge.ready,true);p.rage=100;assert.equal(startUltimate(p),true);assert.equal(p.staffCharge,null);
  input(p,1,false);assert.equal(p.staffWaves,undefined);
  const dead=hero();input(dead,40,true);dead.dead=true;input(dead,1,false);assert.equal(dead.staffCharge,null);assert.equal(dead.staffWaves,undefined);
  const paused=hero();input(paused,40,true);cancelStaffCharge(paused,true);input(paused,1,false);assert.equal(paused.staffWaves,undefined);
});
test('召唤物的持续攻击不进入长按充能，保持自动近战逻辑',()=>{
  const p=hero({summonKind:'clone'});let count=0,last;
  for(let i=0;i<180;i++){advanceStaff(p,{fire:true},dt,{random:()=>0});if(p.staff&&p.staff!==last){last=p.staff;count++;}}
  assert.ok(count>4);assert.equal(p.staffCharge,undefined);assert.equal(p.staffWaves,undefined);
});
test('空中单按下方向就举棍下劈，使用完整劈棍帧，蓄势后下降，落地仅反馈一次',()=>{
  const p=hero({onGround:false,vy:-100});let swings=0,lands=0;
  advanceStaff(p,{down:true,downEdge:true},dt,{playerActions:true,onSwing:()=>swings++});
  assert.equal(p.staff.kind,'slam');assert.equal(p.staff.airCleave,true);assert.equal(swings,1);assert.equal(wholeHeroFrame(p).frame.id,'cleave:8');
  for(let i=0;i<18;i++)advanceStaff(p,{down:true},dt,{playerActions:true});
  assert.ok(p.vy>=AIR_CLEAVE.fallSpeed);assert.equal(wholeHeroFrame(p).frame.id.split(':')[0],'cleave');
  const current=p.staff;advanceStaff(p,{down:true,downEdge:true},dt,{playerActions:true});assert.equal(p.staff,current,'同次腾空不重复触发');
  p.onGround=true;for(let i=0;i<8;i++)advanceStaff(p,{down:true},dt,{playerActions:true,onSlamLand:()=>lands++});
  assert.equal(lands,1);assert.equal(p.airCleaveUsed,false);assert.ok(wholeHeroFrame(p).frame.index<8);
});
test('下劈在高处维持下落收势直到着地，地面下键与骑乘下键不误触发',()=>{
  const p=hero({onGround:false});beginAirCleave(p);
  for(let i=0;i<100;i++)advanceStaff(p,{},dt,{playerActions:true});
  assert.equal(p.staff.kind,'slam');assert.ok(p.staff.t<p.staff.duration);assert.equal(p.staff.landed,undefined);
  for(const state of [{onGround:true},{onGround:false,ride:'moto'},{onGround:false,ride:'heli'}]){
    const q=hero(state);advanceStaff(q,{down:true,downEdge:true},dt,{playerActions:true});assert.equal(q.staff,undefined);
  }
});
test('棍气扫过真实敌人仅扣血一次，可连续穿透三个目标，范围外及高度外无伤害',()=>{
  const p=hero();releaseStaffQi(p,{t:.6});const enemies=[target(150),target(180),target(210),target(240),target(170,70),target(500)];const world=scene(enemies);
  for(let i=0;i<80;i++){advanceStaffQi(p,dt);resolveStaff(p,world);resolveStaff(p,world);}
  assert.deepEqual(enemies.map(e=>e.hp),[26,26,26,30,30,30]);assert.equal(p.staffWaves.length,0);
});
test('高速棍气按先后次序击中墙前敌人而被墙截断，墙后和贴墙目标不会穿墙受伤',()=>{
  for(const face of [-1,1]){
    const p=hero({x:300,face}),front=target(300+face*40),back=target(300+face*90),world=scene([front,back],[{x:face>0?355:235,y:70,w:10,h:100,g:1}]);
    releaseStaffQi(p,{t:2});advanceStaffQi(p,.4);resolveStaff(p,world);
    assert.equal(front.hp,23);assert.equal(back.hp,30);assert.equal(p.staffWaves[0].dead,true);
  }
  const p=hero(),behind=target(120),thin=scene([behind],[{x:106,y:70,w:3,h:100,g:1}]);releaseStaffQi(p,{t:2});resolveStaff(p,thin);assert.equal(behind.hp,30,'出手时身前薄墙也能挡住棍气');
});
test('满蓄棍气能命中Boss和携桃仙女，已记录对象及发射后的死亡出口清理可随快照恢复',()=>{
  const p=hero({pid:2}),enemy=target(145),pod={...target(180),fairy:true},part={...target(220),hp:60};
  const world=scene([enemy]);world.pods=[pod];world.parts=[part];releaseStaffQi(p,{t:2});
  for(let i=0;i<30;i++){advanceStaffQi(p,dt);resolveStaff(p,world);}
  assert.equal(enemy.hp,23);assert.equal(pod.flee,true);assert.equal(part.hp,53);
  const [copy]=unpackWorld(packWorld([{p,world}]));assert.equal(copy.p.staffWaves[0].hits[0],copy.world.enemies[0]);assert.equal(copy.p.staffWaves[0].owner,2);
  p.dead=true;resolveStaff(p,world);assert.equal(p.staffWaves.length,0);
});
test('下劈棍身的真实轨迹命中下方目标并产生重击，蓄力画面和气刃绘制不修改模拟',()=>{
  const p=hero({onGround:false});beginAirCleave(p);p.staff.t=p.staff.duration*.6;
  const q=staffGeometry(p),foe=target(q.tip.x,q.tip.y),world=scene([foe]);let heavy;
  world.damageEnemy=(e,d,_x,_y,shot)=>{e.hp-=d;heavy=shot.heavy;};resolveStaff(p,world);resolveStaff(p,world);
  assert.equal(foe.hp,26);assert.equal(heavy,true);
  const player=hero();input(player,80,true);releaseStaffQi(player,{t:2});const before=JSON.stringify(player),gradient={addColorStop(){}};
  const g=new Proxy({createRadialGradient:()=>gradient,createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
  const art={g,state:{time:1},line(){},rect(){},disc(){},hudText(){}};drawSpecialStaff(art,player,staffGeometry(player));assert.equal(JSON.stringify(player),before);
});
