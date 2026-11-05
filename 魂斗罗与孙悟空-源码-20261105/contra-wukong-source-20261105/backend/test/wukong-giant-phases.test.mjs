import test from 'node:test';
import assert from 'node:assert/strict';
import {COLOSSUS,GIANT_FINALE,enterColossus,advanceColossus,colossusAttack,colossusFootPose,colossusBody,colossusHitsPlayer,colossusDamage,enterGiantFinale,advanceGiantFinale,giantFinalePose} from '../../games/wukong/js/wukong-giant-phases.mjs';
import {drawColossus,drawStompWarning} from '../../games/wukong/js/wukong-giant-phase-art.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';
const fixture=()=>({dead:false,parts:[{hp:0},{hp:0},{hp:30,max:60}],giant:{x:3263,y:176,face:-1,attack:null}});
const foot=()=>{const b=fixture();assert.equal(enterColossus(b),true);b.encounter.growth=0;return b;};
const box=(x,y=176)=>({x:x-7,y:y-28,w:14,h:28});

test('半血变成只有巨足可攻击的第二阶段，单独血条且变身期间不提前落斧',()=>{
  const b=fixture();enterColossus(b);assert.equal(b.encounter.stage,2);assert.equal(b.parts[2].hp,COLOSSUS.hp);assert.equal(b.giant.form,'colossus');
  assert.equal(enterColossus(b),false);advanceColossus(b,{x:3120},1);assert.equal(b.giant.attack,null);
  assert.ok(b.encounter.growth>0);assert.equal(colossusBody(b.giant).w,0);assert.equal(colossusFootPose(b.giant).visible,false);
});
test('巨斧瞄准玩家而非固定安全边，两侧旧安全位置都可被击中，离开斧路可闪避',()=>{
  for(const x of [2970,3150,3320]){
    const b=foot(),a=colossusAttack(b,{x});b.giant.attack=a;
    assert.equal(a.safe,undefined);assert.equal(a.safeSide,undefined);assert.equal(a.danger.w,COLOSSUS.axeRadius*2);
    const p={dead:false};assert.equal(colossusHitsPlayer(b,p,box(x)),false,'蓄势不伤人');
    a.t=a.windup+.1;
    assert.equal(colossusHitsPlayer(b,{},box(x+(x>3150?-120:120))),false,'移开斧路即可避开');
    assert.equal(colossusHitsPlayer(b,p,box(x,120)),true,'原地跳跃仍在劈斩轨迹内');
    assert.equal(colossusHitsPlayer(b,p,box(x)),false);assert.equal(a.hits.length,1);
  }
});

test('斧路在起手时追踪，锁定后不随玩家移动；预警范围与实际判定同步',()=>{
  const b=foot(),a=b.giant.attack=colossusAttack(b,{x:3040});
  advanceColossus(b,{x:3080},.2);assert.equal(a.aimX,3080);assert.equal(a.locked,false);
  advanceColossus(b,{x:3130},.2);assert.equal(a.aimX,3130);assert.equal(a.locked,true);
  advanceColossus(b,{x:3290},.2);assert.equal(a.aimX,3130);assert.equal(a.danger.x,3130-COLOSSUS.axeRadius);
  a.t=a.windup+COLOSSUS.axeCut;assert.equal(colossusHitsPlayer(b,{},box(3130)),true);assert.equal(colossusHitsPlayer(b,{},box(3290)),false);
});

test('踩踏圈以真实踩踏半径贴地显示，倒计时缩紧，落脚时消失且不修改状态',()=>{
  const b=foot();b.encounter.turn=1;const a=b.giant.attack=colossusAttack(b,{x:3120}),ellipses=[];
  const gradient={addColorStop(){}},g=new Proxy({globalAlpha:1,ellipse(...q){ellipses.push(q);},createRadialGradient:()=>gradient},
    {get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  const sample=t=>{a.t=t;ellipses.length=0;const before=JSON.stringify(b);drawStompWarning({g},a);assert.equal(JSON.stringify(b),before);return ellipses.map(q=>q.slice());};
  const early=sample(.15),late=sample(1.15);
  assert.equal(early[0][0],3120);assert.equal(early[0][2],COLOSSUS.dropRadius);assert.ok(early[0][3]<early[0][2]/4);
  assert.ok(late[2][2]<early[2][2],'内圈随剩余预警时间收缩');assert.equal(late[0][2],early[0][2],'真实伤害边界保持固定');
  assert.equal(sample(a.windup).length,0);
});
test('巨足追踪锁定玩家；远处跳跃避震，落地音震只触发一次',()=>{
  const b=foot();b.encounter.turn=1;b.giant.cooldown=0;let tells=0,impacts=0;
  const hooks={onTell:()=>tells++,onImpact:()=>impacts++};advanceColossus(b,{x:3150},1/60,hooks);
  const a=b.giant.attack;assert.equal(a.kind,'skyStomp');assert.equal(tells,1);
  for(let i=0;i<55;i++)advanceColossus(b,{x:3150},1/60,hooks);
  assert.equal(b.giant.footLift,0);assert.equal(a.aimX,3150);assert.equal(a.locked,true);assert.equal(impacts,0);
  a.t=a.windup+.15;assert.equal(colossusHitsPlayer(b,{},box(2980)),true);
  assert.equal(colossusHitsPlayer(b,{},box(3300,150)),false);
  advanceColossus(b,{x:3150},1/60,hooks);advanceColossus(b,{x:3150},1/60,hooks);assert.equal(impacts,1);
  assert.equal(b.encounter.scars.length,1);assert.equal(b.encounter.scars[0].x,3150);
});
test('巨足踩地后留足连击时间再抬起出屏；可攻击身体始终跟随可见巨足',()=>{
  const b=foot(),g=b.giant;b.encounter.turn=1;const a=g.attack=colossusAttack(b,{x:3080});
  assert.equal(colossusFootPose(g).visible,false);assert.equal(colossusBody(g).w,0);
  a.t=a.windup-.02;let pose=colossusFootPose(g),body=colossusBody(g);
  assert.equal(pose.visible,true);assert.ok(pose.y<176);assert.equal(body.x+body.w/2,3080);assert.equal(body.y+body.h,pose.y);
  for(const elapsed of [.35,1.5,2.8]){
    a.t=a.windup+elapsed;pose=colossusFootPose(g);assert.equal(pose.landed,true);assert.equal(pose.y,176);assert.ok(colossusBody(g).w>0);
    assert.equal(colossusHitsPlayer(b,{},box(a.aimX)),false,'停留反击期间不再造成踩踏伤害');
  }
  a.t=a.windup+COLOSSUS.footRest+.13;pose=colossusFootPose(g);assert.equal(pose.visible,true);assert.ok(pose.y<176);assert.equal(colossusBody(g).y+68,pose.y);
  a.t=a.windup+COLOSSUS.footRest+COLOSSUS.footRise;assert.equal(colossusFootPose(g).visible,false);assert.equal(colossusBody(g).w,0);
  g.attack=colossusAttack(b,{x:3080});assert.equal(g.attack.kind,'skyAxe');assert.equal(colossusFootPose(g).visible,false);assert.equal(colossusBody(g).w,0);
});
test('斧劈与空档不再绘制任何常驻巨足，踩踏只绘制一只巨足，绘制不改状态',()=>{
  const b=foot(),draws=[],gradient={addColorStop(){}},g=new Proxy({globalAlpha:1,drawImage(...args){draws.push(args);},createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  const image={naturalWidth:1448,naturalHeight:1086},art={g,images:{giantColossus:image}};
  const sample=()=>{draws.length=0;const before=JSON.stringify(b);drawColossus(art,b);assert.equal(JSON.stringify(b),before);return draws;};
  assert.equal(sample().length,0);
  b.giant.attack=colossusAttack(b,{x:2970});b.giant.attack.t=b.giant.attack.windup+.12;
  assert.equal(sample().length,1);assert.equal(draws[0][1],724);assert.equal(draws[0][2],543,'斧子使用右下图块，没有左上常驻巨足');
  b.giant.attack=colossusAttack(b,{x:3100});b.giant.attack.t=b.giant.attack.windup+.4;
  assert.equal(sample().length,1);assert.equal(draws[0][1],0);assert.equal(draws[0][2],543);
  b.giant.attack.t=b.giant.attack.windup+COLOSSUS.footRest+COLOSSUS.footRise;assert.equal(sample().length,0);
});
test('踩踏先追踪再固定落点，直踩覆盖空中，离开脚印后起跳可以躲震',()=>{
  const b=foot();b.encounter.turn=1;const a=b.giant.attack=colossusAttack(b,{x:3040});
  advanceColossus(b,{x:3090},.1);assert.equal(a.aimX,3090);assert.equal(a.locked,false);
  advanceColossus(b,{x:3120},.14);assert.equal(a.aimX,3120);assert.equal(a.locked,true);
  advanceColossus(b,{x:3240},.1);assert.equal(a.aimX,3120);assert.equal(b.giant.x,3230.32);
  a.t=a.windup+.07;assert.equal(colossusHitsPlayer(b,{},box(3120,90)),true,'原地跳进巨足下仍被踩中');
  assert.equal(colossusHitsPlayer(b,{},box(3260,130)),false,'离开落点的腾空角色无伤');
  assert.equal(colossusHitsPlayer(b,{},box(3260)),true,'范围震地仍威胁远处站立者');
  assert.equal(colossusDamage(b,box(3120)),34);assert.equal(colossusDamage(b,box(3260)),18);
});
test('坑痕灰烬跨多招、快照和终结演出永久保存，重复帧不重复刻坑',()=>{
  const b=foot();b.encounter.turn=1;b.giant.cooldown=0;advanceColossus(b,{x:3000},.01);
  for(let i=0;i<140;i++)advanceColossus(b,{x:3000},1/60);
  assert.equal(b.encounter.scars.length,1);const scar={...b.encounter.scars[0]};
  b.giant.attack=null;b.encounter.turn=1;b.giant.cooldown=0;advanceColossus(b,{x:3260},.01);
  for(let i=0;i<140;i++)advanceColossus(b,{x:3260},1/60);
  assert.equal(b.encounter.scars.length,2);assert.deepEqual(b.encounter.scars[0],scar);
  const [remote]=unpackWorld(packWorld([b]));assert.deepEqual(remote.encounter.scars,b.encounter.scars);
  enterGiantFinale(b,[{pid:1,x:3100,y:176}]);for(let i=0;i<600;i++)advanceGiantFinale(b,[],1/60);
  assert.equal(b.encounter.scars.length,2);assert.deepEqual(b.encounter.scars[0],scar);
});
test('巨斧快速下切对齐伤害时刻，二阶段三次重击可以耗尽气血',()=>{
  const b=foot(),a=b.giant.attack=colossusAttack(b,{x:3000});
  a.t=a.windup+.03;assert.equal(colossusHitsPlayer(b,{},box(3000)),false);
  a.t=a.windup+COLOSSUS.axeCut;assert.equal(colossusHitsPlayer(b,{},box(3000)),true);
  assert.equal(colossusDamage(b,box(3000)),40);assert.ok(a.recovery<.5);assert.ok(COLOSSUS.axeCut<=.1);
});
test('联机快照保存斧路落点、二号玩家命中引用与阶段计时，不由绘制重新随机',()=>{
  const b=foot(),p1={pid:1},p2={pid:2},a=colossusAttack(b,{x:3320});b.giant.attack=a;a.t=a.windup+.1;
  assert.equal(colossusHitsPlayer(b,p2,box(3320)),true);
  const [world]=unpackWorld(packWorld([{boss:b,players:[p1,p2]}]));
  assert.equal(world.boss.giant.attack.hits[0],world.players[1]);assert.equal(world.boss.giant.attack.aimX,3320);assert.equal(world.boss.giant.attack.safe,undefined);
  assert.equal(world.boss.encounter.stage,2);assert.equal(world.boss.encounter.time,0);
});
test('第三阶段自动完成六次终结打击与一次喊声，复原双方装备、位置并只完成一次',()=>{
  const b=foot(),actors=[{pid:1,x:3324,y:176,ride:'moto',rideT:10,giantT:0,giantHits:0},{pid:2,x:3210,y:132,ride:'heli',rideT:9,giantT:0}];
  enterGiantFinale(b,actors);let hits=0,shouts=0,completed=0;
  assert.equal(b.encounter.stage,3);assert.equal(b.parts[2].hp,1);assert.equal(b.exitOpen,false);assert.ok(actors.every(p=>!p.ride&&!p.staff));
  for(let i=0;i<700;i++)if(advanceGiantFinale(b,actors,1/60,{onImpact:()=>hits++,onShout:()=>shouts++}))completed++;
  assert.equal(hits,6);assert.equal(shouts,1);assert.equal(completed,1);assert.equal(b.encounter.stage,4);
  assert.equal(actors[0].x,3324);assert.equal(actors[0].ride,'moto');assert.equal(actors[1].ride,'heli');assert.equal(actors[1].y,132);
});
test('终结演出使用增长、前抡、花棍、腾空下劈、倒地的固定完整序列，采样无状态变更',()=>{
  const poses=[0,1.5,2.75,3.7,4.18,4.66,6.2,7.9,GIANT_FINALE.duration].map(giantFinalePose);
  assert.ok(poses[1].hero.scale>3);assert.ok(poses.some(q=>q.hero.sheet==='advance'));assert.ok(poses.some(q=>q.hero.sheet==='flower'));
  assert.ok(poses.some(q=>q.hero.sheet==='cleave'&&q.hero.y<176));assert.equal(poses.at(-1).giant.fall,1);
  assert.ok(Math.abs(poses.at(-1).hero.scale-1)<.001);assert.equal(JSON.stringify(poses),JSON.stringify([0,1.5,2.75,3.7,4.18,4.66,6.2,7.9,GIANT_FINALE.duration].map(giantFinalePose)));
});
