import test from 'node:test';
import assert from 'node:assert/strict';
import {WUKONG_RAGE,RAGE_ULTIMATES,rageReady,beginRageUltimate,ultimateSpec} from '../../games/wukong/js/wukong-rage.mjs';
import {newVitality,receiveHeroHit,advanceVitality,healHero} from '../../games/wukong/js/wukong-vitality.mjs';
import {advanceStaff,resolveStaff} from '../../games/wukong/js/wukong-combat.mjs';
import {wholeHeroFrame} from '../../games/wukong/js/wukong-hero-frames.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';

const hero=extra=>({x:100,y:144,face:1,onGround:true,heroFrames:true,pid:1,invT:0,vx:0,vy:0,cool:0,weapon:'rifle',...newVitality(),...extra});
const foe=(x,y=144)=>({x,y,hp:100});
const box=e=>({x:e.x-5,y:e.y-28,w:10,h:28});
function world(enemies=[],solids=[]){return {enemies,pods:[],parts:[],solids,bullets:[],enemyBox:box,podBox:e=>({x:e.x-6,y:e.y-7,w:12,h:14}),damageEnemy(e,d){e.hp-=d;},hitPart(e,d){e.hp-=d;},popPod(e){e.dead=true;}};}
function cast(id,extra={}){const p=hero({rage:100,rageBag:[id],...extra});assert.equal(beginRageUltimate(p,()=>0),true);return p;}
function play(p,w,n){for(let i=0;i<n;i++){advanceStaff(p,{},1/60,{playerActions:true});resolveStaff(p,w);}}

test('每次有效受伤增加50怒气，两次攒满，保护/护盾/补血/时间不会刷怒，数值封顶',()=>{
  const p=hero();for(let i=1;i<=2;i++){p.invT=0;const hit=receiveHeroHit(p,{damage:12});assert.equal(p.rage,i*50);assert.equal(hit.rageReady,i===2);}
  assert.equal(rageReady(p),true);assert.equal(p.hp,76);assert.equal(receiveHeroHit(p),null);assert.equal(p.rage,100);
  p.invT=0;p.shieldT=1;assert.equal(receiveHeroHit(p),null);p.shieldT=0;receiveHeroHit(p,{damage:1});assert.equal(p.rage,100);
  const partial=hero({rage:25,hp:60});healHero(partial,'healPeach');advanceVitality(partial,30);assert.equal(partial.rage,25);assert.equal(newVitality().rage,0);
  const capped=hero({rage:75});assert.equal(receiveHeroHit(capped,{damage:1}).rageAdded,25);assert.equal(capped.rage,100);
});

test('怒气不足不消耗或中断蓄力，满怒打断受击释放，单次消费并保护施招期间',()=>{
  const p=hero({rage:75,staffCharge:{active:true,t:.9}});let rolls=0;
  assert.equal(beginRageUltimate(p,()=>{rolls++;return 0;}),false);assert.equal(rolls,0);assert.ok(p.staffCharge);assert.equal(p.rage,75);
  p.rage=100;p.hurt={t:0,duration:.3};assert.equal(beginRageUltimate(p,()=>0),true);assert.equal(p.rage,0);assert.equal(p.hurt,null);assert.equal(p.staffCharge,null);
  assert.ok(p.invT>=p.staff.duration);assert.equal(receiveHeroHit(p),null);assert.equal(beginRageUltimate(p),false);
  for(const extra of [{dead:true},{dive:true},{enteringExit:{}},{exitEntered:true}]){const q=hero({rage:100,...extra});assert.equal(beginRageUltimate(q),false);assert.equal(q.rage,100);}
});

test('每轮四种大招随机出齐且不连续重复，随机队列和已消费怒气随快照恢复',()=>{
  const p=hero(),moves=[];let n=0;
  for(let i=0;i<12;i++){p.rage=100;p.staff=null;assert.ok(beginRageUltimate(p,()=>((n++*7)%11)/11));moves.push(p.staff.ultimate);}
  for(let i=0;i<12;i+=4)assert.equal(new Set(moves.slice(i,i+4)).size,4);
  for(let i=1;i<moves.length;i++)assert.notEqual(moves[i],moves[i-1]);
  const [copy]=unpackWorld(packWorld([p]));assert.equal(copy.rage,0);assert.deepEqual(copy.rageBag,p.rageBag);assert.equal(copy.lastUltimate,p.lastUltimate);
  assert.equal(WUKONG_RAGE.max,100);assert.equal(Object.keys(RAGE_ULTIMATES).length,4);
});

test('横扫与风暴有不同范围和频次，同一波重复碰撞不重复伤害，墙后目标受保护',()=>{
  for(const [id,total,radius]of [['sweep',12,86],['storm',12,102]]){
    const p=cast(id),front=foe(145),back=foe(60),far=foe(100+radius+15),w=world([front,back,far]);
    for(let i=0;i<80;i++){advanceStaff(p,{},1/60,{playerActions:true});resolveStaff(p,w);resolveStaff(p,w);}
    assert.equal(front.hp,100-total);assert.equal(back.hp,100-total);assert.equal(far.hp,100);
    const blocked=foe(150),q=cast(id);play(q,world([blocked],[{x:125,y:30,w:6,h:120,g:true}]),80);assert.equal(blocked.hp,100);
  }
});

test('定海神针仅打击朝向一侧的高竖直区域，左右镜像一致，重击两段共14点',()=>{
  for(const face of [1,-1]){
    const p=cast('pillar',{face}),front=foe(100+face*60),high=foe(100+face*60,70),back=foe(100-face*30),far=foe(100+face*130);
    play(p,world([front,high,back,far]),80);assert.equal(front.hp,86);assert.equal(high.hp,86);assert.equal(back.hp,100);assert.equal(far.hp,100);
  }
});

test('万道棍气实际飞行、三轮扇形发射、命中远敌；不会同时额外造成近战范围伤害',()=>{
  const p=cast('qi'),front=foe(230),back=foe(70),w=world([front,back]);
  play(p,w,10);assert.equal(front.hp,100);assert.equal(p.staffWaves,undefined);
  play(p,w,110);assert.ok(front.hp<100);assert.equal(back.hp,100);assert.equal(p.staff?.kind==='ultimate',false);
  assert.ok(p.staffWaves.every(q=>q.dead||q.travel<=q.range));
});

test('棍气大招出手贴身薄墙也能挡住，九枚气刃的已命中引用能随联机快照恢复',()=>{
  const p=cast('qi'),enemy=foe(150),w=world([enemy],[{x:106,y:40,w:2,h:110,g:true}]);play(p,w,110);assert.equal(enemy.hp,100);
  const q=cast('qi'),near=foe(140),open=world([near]);play(q,open,34);assert.ok(near.hp<100);
  const [remote,target]=unpackWorld(packWorld([q,near]));assert.ok(remote.staffWaves.some(w=>w.hits.includes(target)));
});

test('四种大招分别选用完整舞花/劈棍/云棍/前抡序列，暂停绘制取帧不改状态',()=>{
  for(const id of Object.keys(RAGE_ULTIMATES)){
    const p=cast(id),move=ultimateSpec(p.staff);p.staff.t=p.staff.duration*.37;const before=JSON.stringify(p),frame=wholeHeroFrame(p);
    assert.ok(frame.clip.includes(move.sheet));assert.equal(JSON.stringify(p),before);
  }
});
