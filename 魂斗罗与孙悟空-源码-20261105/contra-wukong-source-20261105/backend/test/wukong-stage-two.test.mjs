import test from 'node:test';
import assert from 'node:assert/strict';
import * as siege from '../../games/wukong/js/wukong-stage-two.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';
const actor=(pid=1)=>({pid,x:48,y:176,onGround:true,weapon:'rifle',hp:100,maxHp:100,invT:0,staff:{kind:'sweep'},dead:false});
const scene=(room='hub',duo=false)=>{const p=actor(),actors=duo?[p,actor(2)]:[p],G={p,inv:[],inv2:[],freezeT:0,camX:0,score:0};let score=0;const hooks={onScore:n=>score+=n};siege.init(G,actors,hooks);siege.enterRoom(G,room,actors,hooks);return {G,p,actors,hooks,score:()=>score};};
const tick=(s,n)=>{for(let i=0;i<n;i++)siege.advance(s.G,s.actors,{},1/60,s.hooks);};
const attack=(s,part,d=2)=>{s.p.staff={kind:'sweep'};return siege.hit(s.G,part,d,{k:'staff',owner:1},s.actors,s.hooks);};
function clear(s,id){
  siege.enterRoom(s.G,id,s.actors,s.hooks);s.p.staff={kind:'sweep'};
  if(id==='wind'){
    s.G.en=[];tick(s,1);s.p.x=825;attack(s,s.G.siege.devices[0]);s.p.x=920;attack(s,s.G.siege.devices[1]);tick(s,40);
  }else if(id==='armor'){
    for(const part of s.G.siege.devices.slice(0,2))attack(s,part,6);
    s.p.x=955;attack(s,s.G.siege.devices[2]);tick(s,65);
  }else{
    s.G.camX=384;
    for(let i=0;i<3;i++){const orb={siege:'orb',x:600,y:136,w:24,h:24,hp:1,vx:-70,life:12,hits:[]};s.G.siege.orbs.push(orb);attack(s,orb);tick(s,20);}
  }
  assert.ok(s.G.siege.cleared.includes(id));
}

test('所有两阵组合和六种全破顺序均可开门，已破阵眼仅奖励一次',()=>{
  const orders=[['wind','thunder','armor'],['wind','armor','thunder'],['thunder','wind','armor'],['thunder','armor','wind'],['armor','wind','thunder'],['armor','thunder','wind']];
  for(const order of orders){
    const s=scene();clear(s,order[0]);siege.enterRoom(s.G,'hub',s.actors);assert.equal(siege.doors(s.G).at(-1).locked,true);
    clear(s,order[1]);siege.enterRoom(s.G,'hub',s.actors);assert.equal(siege.doors(s.G).at(-1).locked,false);
    clear(s,order[2]);assert.equal(s.score(),7500);const prior=s.score();tick(s,240);assert.equal(s.score(),prior);
    const copy=[...s.G.siege.cleared];siege.retryRoom(s.G,s.actors,s.hooks);assert.deepEqual(s.G.siege.cleared,copy);
  }
});
test('错误弩角可以重试，守军未清不能调弩，释放扣与拨杆分别实际命中',()=>{
  const s=scene('wind');s.p.staff={};s.p.x=825;assert.equal(attack(s,s.G.siege.devices[0]),false);assert.equal(s.G.siege.aim,0);
  // Uncaptured devices are never offered to the combat resolver.
  s.G.siege.captured=false;assert.equal(siege.targets(s.G).length,0);
  s.G.en=[];tick(s,1);s.G.siege.aim=0;s.p.x=920;attack(s,s.G.siege.devices[1]);tick(s,60);assert.equal(s.G.siege.cleared.length,0);
  s.p.x=825;attack(s,s.G.siege.devices[0]);s.p.x=920;attack(s,s.G.siege.devices[1]);tick(s,40);assert.deepEqual(s.G.siege.cleared,['wind']);
});
test('雷珠一次接触只反射一次，漏接不清空进度，护盾不自动完成回雷',()=>{
  const s=scene('thunder');s.p.invT=0;s.G.camX=384;s.p.x=530;
  const orb={siege:'orb',x:520,y:145,w:24,h:24,hp:1,vx:-70,life:12,hits:[]};s.G.siege.orbs.push(orb);
  assert.equal(attack(s,orb),true);assert.equal(attack(s,orb),false);assert.equal(siege.playerHit(s.G,s.p,{x:520,y:145,w:24,h:24}),null);tick(s,80);assert.equal(s.G.siege.returnHits,1);
  s.G.siege.orbs.push({siege:'orb',x:-35,y:145,w:24,h:24,hp:1,vx:-70,life:12,hits:[]});tick(s,15);assert.equal(s.G.siege.returnHits,1);
});
test('单锁不能放锤，未破两阵时门闩与首领不可被越级攻击',()=>{
  const s=scene('armor');s.p.staff={};s.p.x=955;const [left,,hammer]=s.G.siege.devices;
  attack(s,left,6);assert.ok(!siege.targets(s.G).includes(hammer));assert.equal(attack(s,hammer),true);assert.equal(s.G.siege.hammerT,0);
  siege.enterRoom(s.G,'gate',s.actors);const gate=s.G.siege.devices[0];assert.equal(attack(s,gate,999),false);assert.equal(s.G.siege.gateOpen,false);
  assert.ok(s.G.siege.solids.some(q=>q.siegeGate&&!q.gone));
});
test('已破两阵后挥棍击断门闩，进入首领场地保留装备并恢复气血',()=>{
  const s=scene();clear(s,'wind');clear(s,'armor');s.p.weapon='laser';siege.enterRoom(s.G,'gate',s.actors);attack(s,s.G.siege.devices[0],12);
  assert.equal(s.G.siege.gateOpen,true);assert.equal(s.G.siege.solids.find(q=>q.siegeGate).gone,true);
  siege.enterRoom(s.G,'boss',s.actors);assert.equal(s.G.boss.parts[2].hp,180);assert.equal(s.p.hp,100);assert.equal(s.p.weapon,'laser');assert.equal(siege.counterWindow(s.G),4);
});
test('攻击或蓄力时上方向不进门，双人未靠近同门时不静默传送',()=>{
  const s=scene('hub',true);tick(s,1);s.p.x=235;s.p.staff={};for(let i=0;i<30;i++)siege.advance(s.G,s.actors,{1:{up:true,fire:true}},1/60);
  assert.equal(s.G.siege.room,'hub');s.p.staff=null;s.actors[1].x=400;
  for(let i=0;i<30;i++)siege.advance(s.G,s.actors,{1:{up:true}},1/60);assert.equal(s.G.siege.room,'hub');
  s.actors[1].x=260;for(let i=0;i<20;i++)siege.advance(s.G,s.actors,{1:{up:true}},1/60);assert.equal(s.G.siege.room,'wind');
  assert.ok(s.actors.every(p=>p.x<100));
});
test('阵眼、弹射状态与首领命中引用随快照恢复，绘制查询不推进状态',()=>{
  const s=scene();clear(s,'wind');clear(s,'armor');s.G.siege.gateOpen=true;siege.enterRoom(s.G,'boss',s.actors);
  s.G.boss.king.attack={kind:'cleave',t:1.25,windup:1.2,strike:.18,recovery:4,face:-1,hits:[s.p]};
  const [copy]=unpackWorld(packWorld([s.G]));assert.deepEqual(copy.siege.cleared,['wind','armor']);assert.equal(copy.boss.king.attack.hits[0],copy.p);
  const before=JSON.stringify(copy);siege.targets(copy);siege.inspect(copy);siege.kingFrame(copy);siege.kingSword(copy);assert.equal(JSON.stringify(copy),before);
});
test('天王伤害沿当前完整画稿剑线判定，左右镜像、无伤收势与单次命中一致',()=>{
  for(const face of [-1,1])for(const kind of ['sweep','cleave']){
    const s=scene();s.G.siege.cleared=['wind','thunder'];s.G.siege.gateOpen=true;siege.enterRoom(s.G,'boss',s.actors);s.p.invT=0;
    const k=s.G.boss.king;k.face=face;k.attack={kind,t:1.21,windup:1.2,strike:.25,recovery:3,face,hits:[]};
    const q=siege.kingSword(s.G),x=(q.origin.x+q.tip.x)/2,y=(q.origin.y+q.tip.y)/2,box={x:x-2,y:y-2,w:4,h:4};
    assert.ok(siege.playerHit(s.G,s.p,box));assert.equal(siege.playerHit(s.G,s.p,box),null);
    k.attack.hits=[];k.attack.t=1.6;assert.equal(siege.playerHit(s.G,s.p,box),null);assert.equal(siege.playerHit(s.G,s.p,{x:0,y:0,w:1,h:1}),null);
  }
});
test('力阵破除使实际首领重劈收势从3秒变4秒，双人气血独立缩放且死亡只奖励一次',()=>{
  for(const armor of [false,true]){
    const s=scene('hub',true);s.G.siege.cleared=armor?['wind','armor']:['wind','thunder'];s.G.siege.gateOpen=true;siege.enterRoom(s.G,'boss',s.actors,s.hooks);
    assert.equal(s.G.boss.parts[2].hp,270);s.p.x=580;s.actors[1].x=570;s.G.boss.king.turn=1;s.G.boss.king.cooldown=0;tick(s,1);
    assert.equal(s.G.boss.king.attack.kind,'cleave');assert.equal(s.G.boss.king.attack.recovery,armor?4:3);
    const core=s.G.boss.parts[2];attack(s,core,999);assert.equal(s.G.boss.dead,true);assert.equal(s.score(),12000);assert.equal(attack(s,core,999),false);assert.equal(s.score(),12000);
  }
});
