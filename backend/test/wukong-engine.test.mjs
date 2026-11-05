import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHeadlessEngine, ENGINE_IMPORTS } from '../../sim/headless.mjs';
import {WukongSkin,SKIN_RIG} from '../../games/wukong/js/wukong-game.mjs?v=dialogue-4';
import {PRONE_ART} from '../../games/wukong/js/wukong-prone.mjs';
import {staffGeometry,staffMotion,ULTIMATE,STAFF_VARIANTS,AIR_VARIANTS,advanceStaff,staffCopies} from '../../games/wukong/js/wukong-combat.mjs';
import {flyingGuard} from '../../games/wukong/js/wukong-enemies.mjs';
import {GIANT_MOVES,GIANT_ARENA,giantRig,giantPose,giantHitsPlayer,giantShockwaves} from '../../games/wukong/js/wukong-boss.mjs';
import {giantDefeatVisual,ENCOUNTER_FRAMES} from '../../games/wukong/js/wukong-encounter-art.mjs';
import {GIANT_REST} from '../../games/wukong/js/wukong-giant-animation.mjs';
import {guardGeometry} from '../../games/wukong/js/wukong-guards.mjs';
import {attackPose} from '../../games/wukong/js/wukong-motion.mjs';
import {WUKONG_OPENING_DURATION,WUKONG_OPENING_PAGES} from '../../games/wukong/js/wukong-opening.mjs';
import {WUKONG_MAGIC,multiArmActors,activateWukongMagic} from '../../games/wukong/js/wukong-magic.mjs';
import {HEALING_ITEMS,HEALING_DROPS,WUKONG_HEALTH} from '../../games/wukong/js/wukong-vitality.mjs';
import {STAFF_SEQUENCES} from '../../games/wukong/js/wukong-staff-sequences.mjs';
import {COLOSSUS} from '../../games/wukong/js/wukong-giant-phases.mjs';
import {wholeHeroFrame} from '../../games/wukong/js/wukong-hero-frames.mjs';
import * as wukongDependencies from '../../games/wukong/js/engine-dependencies.mjs';

const imports={...wukongDependencies,...ENGINE_IMPORTS};
// Run the real shared engine through the Wukong entry (see sim/headless.mjs); seeded for repeatable fights.
function engine(theme=true,{getGamepads=()=>[],hideGamepadIndicator=false}={}){
  const e=createHeadlessEngine({game:theme?'wukong':'contra2026',dom:'rich',primeAllStages:false,dependencies:wukongDependencies,seed:123,hostname:'',getGamepads,hideGamepadIndicator});
  e.play();e.step();return e;
}
function tick(e,n,input={}){
  for(const k of Object.keys(e.K))e.K[k]=false;
  Object.assign(e.K,input);for(let i=0;i<n;i++){
    // Existing timing assertions count simulation frames, not the new impact hold.
    for(let pause=0;e.G.mode==='play'&&e.G.hitStop>0&&pause<12;pause++)e.step();
    e.step();
  }
}
export { engine };
const nextMeleeInput=(e,extra={})=>({...extra,KeyJ:!e.G.p.staff&&e.G.p.cool<=1/60&&!e.K.KeyJ});
const tapMelee=(e,n,extra={})=>{for(let i=0;i<n;i++)tick(e,1,nextMeleeInput(e,extra));};

const snapshot=e=>JSON.parse(JSON.stringify(imports.packWorld([e.G,e.solids,e.BRIDGES])));
// Whole-frame playback clocks are intentionally networked presentation state.
// Physics comparisons omit only those fields; render-purity checks keep them.
function physicsSnapshot(e,world=e.G){
  const graph=imports.unpackWorld(imports.packWorld([world,e.solids,e.BRIDGES]));
  for(const p of [graph[0].p,graph[0].p2])if(p){delete p.heroFrames;delete p.heroAnimation;delete p.hp;delete p.maxHp;delete p.hpTrail;delete p.rage;delete p.maxRage;}
  for(const p of [graph[0].p,graph[0].p2])if(p){delete p.staffDownHeld;delete p.airCleaveUsed;delete p.staffCommandMotion;delete p.staffIntent;}
  if(graph[0].podTrig)graph[0].podTrig=graph[0].podTrig.filter(t=>!HEALING_ITEMS[t.kind]);
  delete graph[0].hitStop;delete graph[0].impactPauseLock;delete graph[0].martialSoundAt;
  return JSON.parse(JSON.stringify(imports.packWorld(graph)));
}
test('悟空片头先石猴出世再驾云闹天宫，逐段绘制不改变实际地图或角色',()=>{
  const e=engine(),drawn=[],riders=[],birthFrames=new Set();
  const cacheSet=e.wukong.cache.set.bind(e.wukong.cache);
  e.wukong.cache.set=(key,value)=>{birthFrames.add(key);return cacheSet(key,value);};
  e.G.mode='cine';e.G.cine={kind:'open',t:0,typed:0,skip:false,ev:{}};
  e.wukong.hudText=text=>drawn.push(String(text));
  const actor=e.wukong.actor.bind(e.wukong);
  e.wukong.actor=(p,role,enemy)=>{if(!enemy)riders.push(p);return actor(p,role,enemy);};
  e.wukong.meteor=()=>assert.fail('天宫片头不应绘制陨星');
  e.wukong.images.birthMountain={naturalWidth:1672,naturalHeight:941};
  e.wukong.images.birthActors={naturalWidth:1536,naturalHeight:1024};
  for(const page of WUKONG_OPENING_PAGES){
    e.G.cine.t=(page.from+page.to)/2;drawn.length=0;riders.length=0;
    const before=snapshot(e);e.render();assert.deepEqual(snapshot(e),before);
    for(const line of page.lines)assert.ok(drawn.includes(line),line);
    assert.ok(drawn.some(line=>line.includes(page.tag)));
    if(page.tag==='石猴出世')assert.equal(riders.length,0,'初生石猴用专用贴图，不提前出现披甲悟空');
    else{assert.ok(riders.length>0);assert.ok(riders.every(p=>p.ride==='heli'&&!p.spin),'大圣站在筋斗云上');}
    assert.ok(!drawn.some(line=>/2087|赤焰|外星|母巢|直升机|军事基地/.test(line)));
  }
  for(const t of [1,2.2,2.6,3.4,4.45,5,5.8,6.2,6.6,19.9]){
    e.G.cine.t=t;const before=snapshot(e);e.render();e.render();assert.deepEqual(snapshot(e),before);
  }
  for(const key of ['birth:stone','birth:leap','birth:standing'])assert.ok(birthFrames.has(key));
});
test('悟空故事完整播完、回车棍击跳跃或点击跳过均进入原第一关',()=>{
  for(const [skip,time]of [[null,WUKONG_OPENING_DURATION-.01],...[1,3,18].flatMap(time=>['Enter','KeyJ','KeyK','tap'].map(key=>[key,time]))]){
    const e=engine();e.G.mode='cine';e.G.cine={kind:'open',t:time,typed:0,skip:skip==='tap',ev:{}};
    if(skip&&skip!=='tap')e.K[skip]=true;
    e.step();assert.equal(e.G.cine,null);assert.equal(e.G.mode,'intro');assert.equal(e.G.stage,1);
    tick(e,146);assert.equal(e.G.mode,'play');assert.equal(e.G.p.x,40);assert.equal(e.G.p.y,112);
  }
});

test('猴子落地后提前跳过片头，故事尾声及自然播完都不重启音乐，直接重开仍重新起播',()=>{
  for(const time of [1,4.65,6.9,8.1,19.99]){
    const e=engine();let stopped=0;e.Music.stop=()=>{stopped++;};e.Music.start=()=>{};
    e.G.cine={kind:'open',t:time};e.G.mode='cine';e.endCine();
    assert.equal(e.G.mode,'intro');assert.equal(stopped,0,'片头 '+time+' 秒结束后应连续播放');
    e.startStage(1);assert.ok(stopped>0,'明确重开关卡保留从第9秒重新起播的行为');
  }
  const contra=engine(false);contra.primeResources();let stopped=0;contra.Music.stop=()=>{stopped++;};contra.Music.start=()=>{};
  contra.G.cine={kind:'open',t:4.65};contra.G.mode='cine';contra.endCine();assert.ok(stopped>0,'原版片头流程保持原状');
});
test('悟空独立首章保留路线与桥梁，平台可穿越；魂斗罗保留厚实体平台',()=>{
  const original=engine(false),skin=engine(true);
  const route=e=>JSON.parse(JSON.stringify(e.solids.map(({x,y,w,g})=>({x,y,w,g}))));
  assert.deepEqual(route(skin),route(original));
  assert.deepEqual(JSON.parse(JSON.stringify(imports.packWorld(skin.BRIDGES))),JSON.parse(JSON.stringify(imports.packWorld(original.BRIDGES))));
  assert.ok(skin.solids.filter(s=>!s.g&&!s.bridge).every(s=>s.h===8&&!s.solid));
  assert.ok(original.solids.filter(s=>!s.g&&!s.bridge).every(s=>s.h===28&&s.solid));
  assert.ok(skin.G.en.filter(e=>e.t==='snp').every(e=>e.hp===8&&e.maxHp===8));
  assert.equal(skin.G.wukongFlights.length,4);
  assert.equal(skin.G.p.x,40);assert.equal(skin.G.p.y,112);
  assert.equal(skin.wukong.inspect().presentationOnly,true);
});
test('悟空可从平台下方起跳穿出台面，二段跳继续升高，再落回平台',()=>{
  const e=engine();quiet(e);
  Object.assign(e.G.p,{x:550,y:176,vx:0,vy:0,onGround:true});
  tick(e,1,{KeyK:true});tick(e,18);
  const first=e.G.p.y;assert.ok(first<128,'首跳穿出台面，不被底部挡住');
  tick(e,1,{KeyK:true});tick(e,15);assert.ok(e.G.p.y<first-20,'二段跳继续升高');
  tick(e,80);assert.equal(e.G.p.onGround,true);assert.equal(e.G.p.y,128);
  tick(e,1,{KeyS:true,KeyK:true});tick(e,40);
  assert.equal(e.G.p.y,144,'下加跳可以穿过薄平台落回地面');
});
const quiet=e=>{e.G.en=[];e.G.eb=[];e.G.pods=[];e.G.podTrig=[];delete e.G.wukongFlights;e.G.spawnT=999;e.G.freezeT=999;e.G.p.invT=999;};
const target=(x,y,hp=20)=>({t:'snp',x,y,hp,fireT:999,face:-1,ax:-1,ay:0,flash:0});
const take=(e,kind,p=e.G.p)=>{e.G.items=[{x:p.x,y:p.y-5,kind,fromPod:true,landed:true,rest:true}];e.collide();assert.equal(e.G.items[0].dead,true);};
const powerScene=()=>{const e=engine();quiet(e);Object.assign(e.G.p,{x:300,y:144,onGround:true});return e;};

test('音效音量归零、关闭音效或总静音时停止悟空和敌人当前声音，恢复时不重启旧声音',()=>{
  const e=engine();let hero=0,enemy=0;e.wukongHeroAudio.stopAll=()=>{hero++;};e.wukongBattleAudio.stopAll=()=>{enemy++;};
  e.SET.sfxVolume=0;e.applyAudio();assert.equal(hero,1);assert.equal(enemy,1);
  e.SET.sfxVolume=100;e.applyAudio();assert.equal(hero,1);assert.equal(enemy,1);
  e.SET.sfx='off';e.applyAudio();assert.equal(hero,2);assert.equal(enemy,2);
  e.SET.sfx='on';e.applyAudio();e.setMuted(true);assert.equal(hero,3);assert.equal(enemy,3);
  e.setMuted(false);assert.equal(hero,3);assert.equal(enemy,3);
});

test('悟空空挥也排入兵器声和发力语音，蓄力释放及满怒大招分别排入独立声音事件',()=>{
  const e=powerScene();tick(e,1,{KeyD:true,KeyJ:true});
  const swing=e.G.fx.find(f=>f.k==='heroSound');assert.ok(swing);assert.equal(swing.callout,'effort');assert.ok(swing.at>e.G.time);assert.equal(e.G.en.length,0);
  e.G.p.staff=null;e.G.p.cool=0;tick(e,1);tick(e,45,{KeyJ:true});tick(e,1);
  assert.ok(e.G.fx.some(f=>f.k==='heroSound'&&f.sound==='charge'));assert.ok(e.G.fx.some(f=>f.k==='heroSound'&&f.sound==='qi'));
  e.G.p.staff=null;e.G.p.cool=0;e.G.p.rage=100;tick(e,1,{KeyI:true});
  assert.ok(e.G.fx.some(f=>f.k==='heroSound'&&f.sound==='ultimate'&&f.callout==='shout'&&f.priority));
});

test('实际棍击才播放身体命中声，同次挥棍不重播，巨灵神护甲与成长免伤使用正确声音',()=>{
  const e=powerScene();tick(e,1,{KeyJ:true});tick(e,15);
  assert.equal(e.G.fx.filter(f=>f.impact).length,0);
  e.G.p.staff=null;e.G.p.cool=0;tick(e,1);
  e.G.spawnT=0;e.G.freezeT=0;e.G.camX=160;tick(e,1);
  const soldier=e.G.en.find(e=>e.t==='run');e.G.freezeT=999;Object.assign(soldier,{x:335,y:144,vx:0});
  tick(e,1,{KeyJ:true});tick(e,15);
  assert.equal(soldier.hp,4);const impacts=e.G.fx.filter(f=>f.impact);assert.equal(impacts.length,1);assert.equal(impacts[0].sound,'hitBody');
  e.collide();e.collide();assert.equal(e.G.fx.filter(f=>f.impact).length,1);
  e.G.freezeT=0;e.G.camX=2950;e.updateBoss();const core=e.G.boss.parts[2];e.G.fx=[];
  e.hitPart(core,2,{k:'staff',vx:1,heavy:true});assert.equal(e.G.fx.find(f=>f.impact).sound,'heavyMetal');
  e.hitPart(core,100,{k:'staff',vx:1});const before=e.G.fx.filter(f=>f.impact).length;
  e.hitPart(core,2,{k:'staff',vx:1});assert.equal(e.G.fx.filter(f=>f.impact).length,before);
});

test('三种新增仙术由携桃仙女投放，击落拾取后收入道具栏，原版不生成新道具',()=>{
  const e=engine(),original=engine(false),kinds=Object.keys(WUKONG_MAGIC);
  assert.deepEqual(Array.from(e.G.podTrig.filter(t=>kinds.includes(t.kind)),t=>t.kind),kinds);
  assert.ok(original.G.podTrig.every(t=>!kinds.includes(t.kind)));
  quiet(e);e.G.podTrig=[{at:0,kind:'arms',y0:90,done:false}];tick(e,120);
  const fairy=e.G.pods[0];assert.equal(fairy.fairy,true);
  Object.assign(e.G.p,{x:fairy.x-15,y:fairy.y+19,onGround:false,face:1,
    staff:{kind:'sweep',variant:'thrust',t:.16,duration:.32,face:1,combo:1,hits:[]}});
  e.collide();assert.equal(fairy.flee,true);assert.equal(e.G.items.length,1);assert.equal(e.G.items[0].kind,'arms');
  Object.assign(e.G.items[0],{x:e.G.p.x,y:e.G.p.y-5,landed:true,rest:true});e.collide();
  assert.deepEqual(Array.from(e.G.inv),['arms']);assert.match(e.G.bannerText,/三头六臂/);
});

test('仙术寿桃保留三格道具栏，Q 切换 L 施放，冷却不会误消耗，三种效果可共存',()=>{
  const e=powerScene();for(const kind of ['arms','clone','troop'])take(e,kind);
  assert.deepEqual(Array.from(e.G.inv),['arms','clone','troop']);assert.equal(e.G.p.weapon,'rifle');
  tick(e,1,{KeyQ:true});assert.equal(e.G.sel,1);tick(e,1,{KeyL:true});
  assert.equal(e.G.p.magic.clone.units.length,2);assert.deepEqual(Array.from(e.G.inv),['arms','troop']);
  tick(e,1);tick(e,1,{KeyL:true});assert.equal(e.G.inv.length,2,'冷却中不消耗下一个道具');
  e.G.p.spCd=0;e.G.sel=0;e.useSpecial();e.G.p.spCd=0;e.useSpecial();
  assert.equal(e.G.inv.length,0);assert.deepEqual(Object.keys(e.G.p.magic).sort(),['arms','clone','troop']);
  assert.equal(e.G.p.magic.troop.units.length,6);assert.equal(e.G.p.magic.arms.remaining,12);
});

test('零怒、半怒和满怒均可使用道具与变身，使用只消耗库存，不扣怒气或误放大招',()=>{
  const effects={arms:p=>p.magic?.arms,clone:p=>p.magic?.clone,troop:p=>p.magic?.troop,transform:p=>p.magic?.transform,
    g:p=>p.magic?.clone,h:p=>p.ride==='heli',m:p=>p.ride==='moto',u:p=>p.giantT>0,c:p=>p.camoT>0,
    f:(_p,e)=>e.G.freezeT>4.9&&e.G.freezeT<=5,t:(_p,e)=>e.G.gr.some(g=>g.tnt)};
  for(const rage of [0,50,100])for(const [kind,effect]of Object.entries(effects)){
    const e=powerScene(),p=e.G.p;p.rage=rage;take(e,kind);
    assert.equal(e.G.inv[0],kind==='g'?'clone':kind);
    tick(e,1);tick(e,1,{KeyL:true});
    assert.ok(effect(p,e),kind+' rage='+rage);assert.equal(e.G.inv.length,0);
    assert.equal(p.rage,rage);assert.notEqual(p.staff?.kind,'ultimate');
  }
  const legacy=powerScene();legacy.G.inv=['g'];legacy.G.p.rage=100;legacy.useSpecial();
  assert.equal(legacy.G.p.magic.clone.units.length,2);assert.equal(legacy.G.inv.length,0);assert.equal(legacy.G.p.rage,100);
});

test('零怒可以切换七十二变，满怒只由大招键消耗，施放不消耗道具库存',()=>{
  const e=powerScene(),p=e.G.p;take(e,'transform');tick(e,1);tick(e,1,{KeyL:true});
  tick(e,40);const time=p.magic.transform.remaining;tick(e,1,{KeyL:true});
  assert.equal(p.magic.transform.form,'tiger');assert.ok(p.magic.transform.remaining<time);assert.equal(p.rage,0);
  take(e,'arms');const inventory=Array.from(e.G.inv);tick(e,1,{KeyI:true});
  assert.equal(p.magic.transform.form,'tiger');assert.equal(p.rage,0);assert.deepEqual(Array.from(e.G.inv),inventory);
  tick(e,1);p.rage=100;tick(e,1,{KeyI:true});
  assert.equal(p.rage,0);assert.equal(p.staff.kind,'ultimate');assert.deepEqual(Array.from(e.G.inv),inventory);
});

test('三头六臂的额外两根棍子独立近战，同次挥棍不重复伤害，长棍强化与墙体生效',()=>{
  for(const blocked of [false,true]){
    const e=powerScene();take(e,'arms');e.useSpecial();
    const near=target(325,144),far=target(490,144);e.G.en=[near,far];
    if(blocked)e.solids.push({x:315,y:60,w:8,h:110,g:1});
    advanceStaff(e.G.p,{fire:true},0,{random:()=>0});tick(e,18);
    assert.equal(near.hp,blocked?20:16);assert.equal(far.hp,20);
    const hp=near.hp;e.collide();e.collide();assert.equal(near.hp,hp);assert.equal(e.G.pb.length,0);
    if(!blocked){
      const [world]=imports.unpackWorld(imports.packWorld([e.G]));
      assert.equal(world.p.staff.armHits[0][0],world.en[0]);assert.equal(world.p.staff.armHits[1][0],world.en[0]);
      e.G.p.staff.t=e.G.p.staff.duration*.5;
      const length=p=>{const q=staffGeometry(p);return q.reach+q.rear;};
      const old=multiArmActors(e.G.p).map(length);take(e,'L');
      e.G.p.staff.weapon='laser';const long=multiArmActors(e.G.p).map(length);
      for(let i=0;i<2;i++)assert.ok(Math.abs(long[i]/old[i]-1.45)<1e-8);
    }
  }
});

test('分身和六只小猴不需要按普攻也会追敌近战，可对付空中天兵且不生成子弹',()=>{
  for(const kind of ['clone','troop'])for(const flying of [false,true]){
    const e=powerScene();take(e,kind);e.useSpecial();const foe=target(350,flying?112:144,40);e.G.en=[foe];
    tick(e,180);assert.ok(foe.hp<40,kind+(flying?'空中':'地面')+' hp='+foe.hp);
    assert.equal(e.G.p.staff,undefined,'本体没有按 J');assert.equal(e.G.pb.length,0);assert.equal(e.G.eb.length,0);
    const units=e.G.p.magic[kind].units;assert.equal(units.length,WUKONG_MAGIC[kind].count);
    assert.ok(units.some(u=>u.staffCombo>0));assert.ok(units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)));
  }
});

test('分身继承棍法强化，群猴会分散攻击，墙后敌人不被召唤物穿墙击中',()=>{
  const e=powerScene();take(e,'M');take(e,'clone');e.useSpecial();
  const foe=target(350,144,30);e.G.en=[foe];tick(e,60);
  assert.ok(e.G.p.magic.clone.units.every(u=>u.weapon==='machine'));
  take(e,'L');tick(e,1);assert.ok(e.G.p.magic.clone.units.every(u=>u.weapon==='laser'));
  const wall=powerScene();take(wall,'troop');wall.useSpecial();wall.solids.push({x:324,y:0,w:10,h:180,g:1});
  const hidden=target(360,144,30);wall.G.en=[hidden];tick(wall,180);assert.equal(hidden.hp,30);
  assert.ok(wall.G.p.magic.troop.units.every(u=>u.x<=324));
});

test('分身和猴群可以命中巨灵神的身体，辅助攻击使用原 Boss 生命与死亡流程',()=>{
  const e=powerScene();Object.assign(e.G.p,{x:3214,y:176,onGround:true});e.G.camX=2950;e.G.boss.active=true;e.updateBoss();
  for(const kind of ['clone','troop']){take(e,kind);e.G.p.spCd=0;e.useSpecial();}
  const core=e.G.boss.parts[2];tick(e,180);assert.ok(core.hp<60||e.G.boss.encounter?.stage===2,'辅助攻击能将巨灵神打入巨足阶段');assert.equal(e.G.pb.length,0);
});

test('仙术暂停时不计时，重复施放只刷新同种效果，死亡与跨关会清理',()=>{
  const e=powerScene();for(const kind of ['arms','clone','troop']){take(e,kind);e.G.p.spCd=0;e.useSpecial();}
  tick(e,30);const before=JSON.stringify(e.G.p.magic),time=e.G.time;e.G.mode='pause';tick(e,90);
  assert.equal(JSON.stringify(e.G.p.magic),before);assert.equal(e.G.time,time);
  e.G.mode='play';take(e,'troop');e.G.p.spCd=0;e.useSpecial();assert.equal(e.G.p.magic.troop.units.length,6);
  assert.equal(e.G.p.magic.troop.remaining,10);tick(e,725);assert.equal(e.G.p.magic,undefined);
  take(e,'arms');e.G.p.spCd=0;e.useSpecial();e.killPlayer(true);assert.equal(e.G.p.magic,undefined);
  const stage=powerScene();take(stage,'arms');take(stage,'clone');take(stage,'troop');stage.reset(2,true);
  assert.deepEqual(Array.from(stage.G.inv),['arms','clone','troop']);assert.equal(stage.G.p.magic,undefined);
});

test('两位玩家的仙术与召唤物独立，快照保存 AI 与额外棍招命中引用',()=>{
  const e=engine();e.coop.playing=true;e.reset(1);quiet(e);Object.assign(e.G.p,{x:280,y:144,onGround:true});
  Object.assign(e.G.p2,{x:310,y:144,onGround:true,invT:999});e.G.inv2=['troop'];e.updatePartner({grenEdge:true});
  assert.equal(e.G.p.magic,undefined);assert.equal(e.G.p2.magic.troop.units.length,6);
  const foe=target(350,144,40);e.G.en=[foe];tick(e,100);assert.ok(foe.hp<40);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));
  assert.equal(world.p2.magic.troop.units[0].owner,2);assert.equal(world.p.magic,undefined);
  assert.ok(world.p2.magic.troop.units.some(u=>u.seed>0));
});

test('三头六臂、分身和猴群的贴图绘制不改变计时、寻敌或世界快照',()=>{
  const e=powerScene();for(const kind of Object.keys(WUKONG_MAGIC))activateWukongMagic(e.G.p,kind,e.solids);
  e.G.en=[target(355,144,40)];tick(e,28,{KeyJ:true});
  e.wukong.loadImage('skinActors');Object.assign(e.wukong.images.skinActors,{naturalWidth:1774,naturalHeight:887});
  const before=snapshot(e);e.render();e.render();assert.deepEqual(snapshot(e),before);
  assert.equal(e.wukong.itemLabel('arms'),'六臂');assert.equal(e.wukong.itemLabel('clone'),'分身');assert.equal(e.wukong.itemLabel('troop'),'猴群');
});
test('实际拾取 M 与 R 缩短完整挥棍动作及间隔，R 可与 M 叠加，拾取提示说明棍法效果',()=>{
  const count=(kind,rapid=false)=>{const e=powerScene();if(kind)take(e,kind);if(rapid)take(e,'R');let last=null,n=0;
    for(let i=0;i<240;i++){tick(e,1,nextMeleeInput(e));if(e.G.p.staff&&e.G.p.staff!==last){n++;last=e.G.p.staff;}}
    return n;};
  const normal=count(null),fast=count('M'),rapid=count('R'),both=count('M',true);
  assert.ok(fast>=normal*1.5);assert.ok(rapid>normal);assert.ok(both>fast);
  const e=powerScene();take(e,'M');assert.match(e.G.bannerText,/挥棍速度/);
});
test('实际拾取 L 后待机保持原长度，出招伸长可击中普通棍够不到的敌人，墙体仍能阻挡',()=>{
  for(const powered of [false,true]){
    const e=powerScene(),baseReach=staffGeometry(e.G.p).reach;if(powered)take(e,'L');
    assert.equal(staffGeometry(e.G.p).reach,baseReach);
    const foe=target(390,144);e.G.en=[foe];e.G.p.cool=0;advanceStaff(e.G.p,{fire:true},0,{random:()=>2.1/STAFF_VARIANTS.length});tick(e,19);
    assert.equal(foe.hp,powered?18:20);
  }
  const e=powerScene();take(e,'L');e.G.en=[target(390,144)];e.solids.push({x:344,y:70,w:8,h:90,g:1});tick(e,25,{KeyJ:true});assert.equal(e.G.en[0].hp,20);
});
test('实际拾取 S 后三根分身棍能同时命中不同高度目标，同一目标每招只受伤一次',()=>{
  const e=powerScene();take(e,'S');const foes=[target(330,144),target(330,120),target(330,155)];e.G.en=foes;
  advanceStaff(e.G.p,{fire:true},0,{random:()=>.201});tick(e,19);
  assert.equal(staffCopies(e.G.p).length,3);assert.deepEqual(foes.map(e=>e.hp),[18,18,18]);
  e.collide();assert.deepEqual(foes.map(e=>e.hp),[18,18,18]);assert.equal(e.G.pb.length,0);
});
test('实际拾取 H 后金箍棒飞出并返回，去回各命中远敌一次，回到移动中的主人并消失',()=>{
  const e=powerScene();take(e,'H');e.G.p.staffVariantBag=['cross'];const foe=target(395,144);e.G.en=[foe];tick(e,1,{KeyJ:true});tick(e,28);
  assert.equal(foe.hp,18);assert.equal(e.G.p.staffThrows.length,1);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.p.staffThrows[0].hits[0][0],world.en[0]);
  tick(e,15,{KeyA:true});tick(e,75);assert.equal(foe.hp,16);assert.equal(e.G.p.staffThrows.length,0);assert.equal(e.G.pb.length,0);
});
test('飞旋棍碰墙折返，不能伤到墙后敌人；死亡后清理飞棍，二号玩家的飞棍独立同步',()=>{
  const wall=powerScene();take(wall,'H');wall.G.en=[target(395,144)];wall.solids.push({x:350,y:70,w:7,h:100,g:1});tick(wall,1,{KeyJ:true});tick(wall,100);
  assert.equal(wall.G.en[0].hp,20);assert.equal(wall.G.p.staffThrows.length,0);
  const e=engine();e.coop.playing=true;e.reset(1);quiet(e);Object.assign(e.G.p2,{x:300,y:144,invT:999});take(e,'H',e.G.p2);
  for(let i=0;i<20;i++){e.updatePartner({fire:i===0,fireEdge:i===0});e.collide();}
  assert.equal(e.G.p.staffThrows,undefined);assert.ok(e.G.p2.staffThrows.length>0);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.p2.staffThrows[0].phase,'out');
  const death=powerScene();take(death,'H');tick(death,1,{KeyJ:true});death.G.p.invT=0;death.G.p.hp=12;death.killPlayer();death.collide();assert.equal(death.G.p.staffThrows.length,0);
});
test('普通天兵要连打数招才阵亡，每次命中有短暂停顿，击败只计分一次',()=>{
  const e=powerScene();e.G.spawnT=0;e.G.freezeT=0;e.G.camX=160;
  tick(e,1);const soldier=e.G.en.find(e=>e.t==='run');assert.ok(soldier);assert.equal(soldier.hp,6);
  e.G.freezeT=999;Object.assign(soldier,{x:335,y:144,vx:0});const score=e.G.score;
  tick(e,1,{KeyJ:true});tick(e,15);assert.equal(soldier.hp,4);assert.equal(soldier.dead,undefined);assert.ok(soldier.hitStun>0);assert.equal(e.G.score,score);
  tapMelee(e,240);assert.equal(soldier.dead,true);assert.equal(e.G.score,score+100);tapMelee(e,40);assert.equal(e.G.score,score+100);
});
test('腾云天兵按波次出现、接近并用长兵器近战，冻结停止飞行，不发射子弹',()=>{
  const e=powerScene();e.G.freezeT=0;e.G.wukongFlights=[{at:320,done:false}];Object.assign(e.G.p,{x:480,y:144});e.G.camX=320;
  tick(e,1);const flyer=e.G.en.find(e=>e.t==='fly');assert.ok(flyer);assert.equal(flyer.hp,6);const x=flyer.x,y=flyer.y;
  let attacking=false;for(let n=0;n<240;n++){tick(e,1);attacking||=!!flyer.melee;}
  assert.ok(flyer.x<x);assert.notEqual(flyer.y,y);assert.equal(attacking,true);assert.equal(e.G.eb.length,0);assert.equal(e.G.en.filter(e=>e.t==='fly').length,1);
  e.G.freezeT=1;const position=[flyer.x,flyer.y];tick(e,20);assert.deepEqual([flyer.x,flyer.y],position);
});
test('腾云天兵可被跳跃上挑实际命中，承受一棍后仍存活，飞行及血量进入联机快照',()=>{
  const e=powerScene(),flyer=flyingGuard(302,98);e.G.en=[flyer];tick(e,1,{KeyW:true,KeyJ:true});tick(e,19);
  assert.equal(flyer.hp,4);assert.equal(flyer.dead,undefined);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.en[0].t,'fly');assert.equal(world.en[0].hp,4);assert.equal(world.en[0].homeY,98);
});
test('实际拾取 F 后普通棍击增加一点烈焰伤害，拾取其他棍法后移除烈焰加成',()=>{
  const e=powerScene();take(e,'F');e.G.p.staffVariantBag=['cross'];const foe=target(335,144);e.G.en=[foe];tick(e,1,{KeyJ:true});tick(e,16);assert.equal(foe.hp,17);
  tick(e,20);take(e,'S');const next=target(335,144);e.G.en=[next];e.G.p.cool=0;
  e.G.p.staffVariantBag=['cross'];e.G.p.staffRecentFamilies=[];tick(e,1,{KeyJ:true});tick(e,16);assert.equal(next.hp,18);
});
test('飞行天兵的武器能够实际击中二号玩家，命中记录在联机中引用正确角色',()=>{
  const e=engine();e.coop.playing=true;e.reset(1);quiet(e);e.G.freezeT=0;
  Object.assign(e.G.p2,{x:300,y:144,onGround:true,invT:0});const flyer=flyingGuard(332,134);e.G.en=[flyer];tick(e,30);
  assert.equal(e.G.p2.dead,false);assert.equal(e.G.p2.hp,90);assert.equal(e.G.p.hp,100);assert.equal(e.G.eb.length,0);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.en[0].melee.hits[0],world.p2);
});
const guard=(t='snp',x=335)=>({t,x,y:144,hp:10,fireT:0,face:-1,ax:-1,ay:0,flash:0,vx:-62,vy:0,on:true,anim:0});
const duel=(type='snp',x=335)=>{const e=engine();quiet(e);e.G.freezeT=0;Object.assign(e.G.p,{x:300,y:144,onGround:true,invT:0});e.G.en=[guard(type,x)];return e;};
const walker=(e,x,y,vx=62)=>{const soldier={...guard('run',x),y,vx};e.G.en=[soldier];return soldier;};
const walkingScene=(solids,px=350,py=144)=>{
  const e=engine();quiet(e);e.G.freezeT=0;e.solids.splice(0,e.solids.length,...solids);
  Object.assign(e.G.p,{x:px,y:py,onGround:true,invT:999});return e;
};
// Keep the whole patrol platform in view while player two attracts the guard
// across the gap; normal offscreen cleanup must not end the navigation check.
const observedPatrol=terrain=>{
  const e=engine();e.coop.playing=true;e.reset(1);quiet(e);e.G.freezeT=0;
  e.solids.splice(0,e.solids.length,...terrain);
  Object.assign(e.G.p2,{x:350,y:144,onGround:true,invT:999});
  Object.assign(e.G.p,{x:40,y:144,onGround:true,invT:999,camoT:999});return e;
};

test('天兵在原地图缺口确认落点后才跳，正反方向均能落在对岸且不会跌入深处',()=>{
  for(const [x,y,vx,px,py,beyond]of [[605,144,62,714,176,x=>x>687],[699,176,-62,580,144,x=>x<613]]){
    const e=engine();quiet(e);e.G.freezeT=0;Object.assign(e.G.p,{x:px,y:py,onGround:true,invT:999});e.G.camX=400;
    const soldier=walker(e,x,y,vx);let jumped=false,landed=false;
    for(let i=0;i<120;i++){
      tick(e,1);jumped||=!!soldier.guardJump;
      if(jumped&&soldier.on&&beyond(soldier.x)){landed=true;break;}
      assert.equal(soldier.dead,undefined);assert.ok(soldier.y<190,'天兵不应跌入深处');
    }
    assert.equal(jumped,true);assert.equal(landed,true,`x=${soldier.x},y=${soldier.y}`);
  }
});
test('追击隔着宽坑或水面的玩家时，天兵掉头走开，不原地犹豫或随机跳下去',()=>{
  for(const water of [false,true]){
    const terrain=[{x:0,y:144,w:180,h:72,g:1},{x:340,y:144,w:260,h:72,g:1}];
    if(water)terrain.push({x:180,y:190,w:160,h:26,g:1,water:1});
    const e=observedPatrol(terrain),soldier=walker(e,165,144);
    let turned=false,walkedAway=false;
    for(let i=0;i<240;i++){
      e.G.camX=0;tick(e,1);turned||=soldier.vx<0;walkedAway||=soldier.x<125;
      assert.ok(soldier.x>=7&&soldier.x<174);assert.equal(soldier.y,144);assert.equal(soldier.on,true);assert.equal(soldier.dead,undefined);assert.ok(!soldier.guardJump);
    }
    assert.equal(turned,true);assert.equal(walkedAway,true);
  }
});
test('断桥与即将塌落的桥段不能作为天兵的安全落点',()=>{
  for(const gone of [false,true]){
    const bridge={armed:true,next:0,t:.08};
    const e=observedPatrol([{x:0,y:144,w:180,h:72,g:1},{x:180,y:190,w:160,h:26,g:1,water:1},
      {x:215,y:144,w:100,h:12,g:0,bridge,seg:0,gone},{x:340,y:144,w:260,h:72,g:1}]);
    const soldier=walker(e,165,144);let turned=false;
    for(let i=0;i<150;i++){e.G.camX=0;tick(e,1);turned||=soldier.vx<0;assert.ok(soldier.x>=7&&soldier.x<174);assert.equal(soldier.y,144);assert.equal(soldier.dead,undefined);assert.ok(!soldier.guardJump);}
    assert.equal(turned,true);
  }
});

test('天兵无可见玩家时也能自主跨过原地图窄坑，落地前保持方向，走不到的边缘持续掉头巡逻',()=>{
  for(const [x,y,vx,px,py,beyond]of [[605,144,62,714,176,x=>x>687],[699,176,-62,580,144,x=>x<613]]){
    const e=engine();quiet(e);e.G.freezeT=0;e.G.camX=400;Object.assign(e.G.p,{x:px,y:py,onGround:true,camoT:999,invT:999});
    const soldier=walker(e,x,y,vx);let jumped=false,landed=false;
    for(let i=0;i<120;i++){
      tick(e,1);jumped||=!!soldier.guardJump;
      assert.equal(soldier.dead,undefined);assert.ok(soldier.y<190);
      if(jumped&&soldier.on&&beyond(soldier.x)){landed=true;break;}
    }
    assert.equal(jumped,true);assert.equal(landed,true);
  }
});

test('天兵掉头巡逻的方向和剩余时间随冻结停止，联机快照保留，之后继续移动',()=>{
  const e=observedPatrol([{x:0,y:144,w:180,h:72,g:1},{x:340,y:144,w:260,h:72,g:1}]);
  const soldier=walker(e,165,144);for(let i=0;i<8&&!soldier.guardPatrol;i++){e.G.camX=0;tick(e,1);}
  assert.ok(soldier.guardPatrol);assert.equal(soldier.guardPatrol.direction,-1);
  const before=JSON.parse(JSON.stringify(soldier));e.G.freezeT=1;tick(e,20);assert.deepEqual(JSON.parse(JSON.stringify(soldier)),before);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.deepEqual(JSON.parse(JSON.stringify(world.en[0].guardPatrol)),before.guardPatrol);
  e.G.freezeT=0;e.G.camX=0;tick(e,10);assert.ok(soldier.x<before.x);assert.ok(soldier.guardPatrol.remaining<before.guardPatrol.remaining);
});
test('掉头途中迎面遇到玩家时仍能近战，不会被巡逻计时永久禁止攻击',()=>{
  const e=observedPatrol([{x:0,y:144,w:180,h:72,g:1},{x:340,y:144,w:260,h:72,g:1}]);
  const soldier=walker(e,165,144);for(let i=0;i<12&&!soldier.guardPatrol;i++)tick(e,1);
  assert.ok(soldier.guardPatrol);Object.assign(e.G.p2,{x:soldier.x-20,y:144,onGround:true});tick(e,1);
  assert.equal(soldier.guardPatrol,null);assert.ok(soldier.melee);assert.equal(soldier.melee.face,-1);assert.equal(e.G.eb.length,0);
});

test('普通台阶可继续走，无法跳上的高墙前停步，失去目标时在平台边缘折返巡逻',()=>{
  const stepDown=walkingScene([{x:0,y:112,w:180,h:104,g:1},{x:180,y:144,w:400,h:72,g:1}],270,144);
  const down=walker(stepDown,160,112);tick(stepDown,80);assert.ok(down.x>190);assert.equal(down.y,144);assert.equal(down.guardJump,undefined);
  const high=walkingScene([{x:0,y:144,w:180,h:72,g:1},{x:180,y:65,w:400,h:151,g:1}],260,65);
  const stopped=walker(high,150,144);tick(high,100);assert.ok(stopped.x<174);assert.equal(stopped.y,144);assert.equal(stopped.dead,undefined);
  const patrol=walkingScene([{x:0,y:144,w:180,h:72,g:1}],100,144);patrol.G.p.camoT=999;
  const soldier=walker(patrol,160,144);let turned=false;
  for(let i=0;i<300;i++){tick(patrol,1);turned||=soldier.vx<0;assert.ok(soldier.x>=7&&soldier.x<=173);assert.equal(soldier.y,144);assert.equal(soldier.dead,undefined);}
  assert.equal(turned,true);
});
test('天兵腿甲与靴子保留饱满宽度，行走按自身腰腿组装，不再硬切旧跑步身体',()=>{
  for(const name of ['Far','Near']){
    for(const [part,width]of [['Thigh',6.16],['Shin',4.84]]){
      const f=SKIN_RIG.enemy.frames['rig'+name+part];
      const actual=Math.hypot(f.clip[0][0]-f.clip[3][0],f.clip[0][1]-f.clip[3][1])*f.scale*f.thickness;
      assert.ok(Math.abs(actual-width)<.001);
    }
    const boot=SKIN_RIG.enemy.frames['rig'+name+'Boot'];assert.ok(boot.bounds[2]*boot.scale>=7&&boot.bounds[2]*boot.scale<8);
  }
  const e=engine();quiet(e);e.wukong.loadImage('skinActors');Object.assign(e.wukong.images.skinActors,{naturalWidth:1774,naturalHeight:887});
  e.wukong.hdActors.movingFrame=()=>assert.fail('天兵应从自身髋点绘制相连腿甲');
  for(const face of [-1,1])for(let i=0;i<12;i++){
    const soldier=walker(e,180,112,62*face);Object.assign(soldier,{face,on:true,anim:i/12*36/62*10});
    const before=snapshot(e);e.render();assert.deepEqual(snapshot(e),before);
  }
});

test('安全跳跃保持已确认的方向，冻结暂停位移，联机快照保留空中导航状态',()=>{
  const e=engine();quiet(e);e.G.freezeT=0;Object.assign(e.G.p,{x:714,y:176,onGround:true,invT:999});e.G.camX=400;
  const soldier=walker(e,610,144);for(let i=0;i<20&&!soldier.guardJump;i++)tick(e,1);
  assert.ok(soldier.guardJump);const speed=soldier.vx;
  e.G.p.x=590;tick(e,3);assert.equal(soldier.vx,speed);
  const position={x:soldier.x,y:soldier.y};e.G.freezeT=1;tick(e,15);assert.deepEqual({x:soldier.x,y:soldier.y},position);
  const [world]=imports.unpackWorld(imports.packWorld([e.G,e.solids]));assert.equal(world.en[0].guardJump.vx,speed);
});

test('固定天兵远处只守阵不发子弹，奔跑天兵接近后以兵器近战',()=>{
  const far=duel('snp',365);tick(far,180);assert.equal(far.G.eb.length,0);assert.equal(far.G.p.dead,false);
  const e=duel('run',360);let attacked=false,hurt=false;
  for(let i=0;i<130;i++){tick(e,1);attacked||=!!e.G.en[0]?.melee;hurt||=e.G.p.hp<100;assert.equal(e.G.eb.length,0);}
  assert.equal(attacked,true);assert.equal(hurt,true);
});
test('天兵先蓄势再出招，贴身蓄势不会立即伤人，突刺和劈砍均能实际命中',()=>{
  for(const type of ['run','snp']){
    const e=duel(type,323);tick(e,18);assert.equal(e.G.p.dead,false);assert.ok(e.G.en[0].melee);
    tick(e,16);assert.equal(e.G.p.dead,false,type);assert.equal(e.G.p.hp,88,type);assert.equal(e.G.eb.length,0);
  }
  const close=duel('run',309);tick(close,15);assert.equal(close.G.p.dead,false);
});
test('跳离兵器高度或隔着实心墙均可躲开天兵近战，冻结暂停出招',()=>{
  const jump=duel('run',335);tick(jump,1,{KeyK:true});tick(jump,43);assert.equal(jump.G.p.dead,false);
  const wall=duel('snp',335);wall.solids.push({x:317,y:70,w:6,h:100,g:1});tick(wall,100);assert.equal(wall.G.p.dead,false);
  const ice=duel('run',335);tick(ice,8);const time=ice.G.en[0].melee.t;ice.G.freezeT=1;tick(ice,25);
  assert.equal(ice.G.en[0].melee.t,time);assert.equal(ice.G.p.dead,false);
});
test('护盾可挡住天兵武器，同一次攻击仅判定一次；隐身不会触发追击',()=>{
  const shield=duel('snp',335);shield.G.p.shieldT=2;tick(shield,34);assert.equal(shield.G.p.dead,false);
  const e=shield.G.en[0];assert.equal(e.melee.hits.length,1);assert.equal(e.melee.hits[0],shield.G.p);
  const hidden=duel('snp',335);hidden.G.p.camoT=2;tick(hidden,60);assert.equal(hidden.G.p.dead,false);assert.equal(hidden.G.en[0].melee,undefined);
});
test('天兵能近战攻击二号玩家，联机快照保留攻击进度和命中引用',()=>{
  const e=engine();e.coop.playing=true;e.reset(1);quiet(e);e.G.freezeT=0;
  Object.assign(e.G.p2,{x:300,y:144,onGround:true,invT:0});e.G.en=[guard()];tick(e,34);
  assert.equal(e.G.p.hp,100);assert.equal(e.G.p2.dead,false);assert.equal(e.G.p2.hp,88);assert.equal(e.G.eb.length,0);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.en[0].melee.hits[0],world.p2);
});
test('金箍棒必须近身接触，单次挥棍只结算一次，不生成远程子弹',()=>{
  const e=engine();quiet(e);Object.assign(e.G.p,{x:300,y:144,staffVariantBag:['cross']});
  const near=target(335,144),far=target(490,144),behind=target(205,144);e.G.en=[near,far,behind];
  tick(e,1,{KeyJ:true});tick(e,16);
  assert.equal(near.hp,18);assert.equal(far.hp,20);assert.equal(behind.hp,20);
  tick(e,10);assert.equal(near.hp,18);assert.equal(e.G.pb.length,0);
});
test('真实跳跃使用正常比例腾空贴图，不沿用缩小翻滚，角色模拟数据不受绘制影响',()=>{
  const e=engine();quiet(e);tick(e,1,{KeyK:true});
  assert.equal(e.G.p.onGround,false);assert.equal(e.G.p.spin,true);
  let drawn;const original=e.wukong.hdActors.draw.bind(e.wukong.hdActors);
  e.wukong.hdActors.draw=(g,p,role,...args)=>{if(role!=='enemy')drawn=p;return original(g,p,role,...args);};
  const before=snapshot(e);e.render();assert.deepEqual(snapshot(e),before);assert.equal(drawn.artPose,'jump');
  e.wukong.loadImage('skinActors');
  e.wukong.images.skinActors.naturalWidth=1774;e.wukong.images.skinActors.naturalHeight=887;
  const jump=e.wukong.hdActors.frame('blue','jump',3),standing=e.wukong.hdActors.frame('blue','idle',3);
  assert.ok(jump.w/standing.w>.95&&jump.w/standing.w<1.1);assert.ok(jump.h>standing.h*.85);
});

test('真实下键使用专用伏地贴图且等比缩放，原移动状态保留，起身和跳跃不残留趴下姿势',()=>{
  const e=engine(),original=engine(false);quiet(e);quiet(original);
  for(const game of [e,original]){Object.assign(game.G.p,{x:150,y:112,onGround:true});tick(game,6,{KeyS:true});}
  assert.equal(e.G.p.prone,true);
  for(const key of ['x','y','vx','vy','prone','onGround'])assert.equal(e.G.p[key],original.G.p[key],key);
  for(const [key,width,height]of [['skinActors',1774,887],['skinProne',1536,1024]]){
    e.wukong.loadImage(key);Object.assign(e.wukong.images[key],{naturalWidth:width,naturalHeight:height});
  }
  const f=e.wukong.hdActors.frame('blue','prone',3),standing=e.wukong.hdActors.frame('blue','idle',3);
  assert.ok(f.w>standing.h&&f.w<standing.h*1.2,'伏地身长与站立人物总高接近，避免换姿势突然变大');
  assert.ok(f.h>standing.h*.5&&f.h<standing.h*.65,'伏地保留体积，冠羽也按身体比例缩放');
  assert.ok(Math.abs(f.w/PRONE_ART.bounds[2]-f.h/PRONE_ART.bounds[3])<1e-10,'横纵使用相同比例，不再压扁');
  assert.ok(f.y+f.h<1.2,'接地锚点不会把姿势推入平台');
  const before=snapshot(e);e.render();assert.deepEqual(snapshot(e),before);
  tick(e,1);assert.equal(e.G.p.prone,false);
  tick(e,1,{KeyK:true});assert.equal(e.G.p.prone,false);assert.equal(e.G.p.onGround,false);
});

test('悟空行走直接合成相连的腰腿，左右和边走边挥棍不会再硬裁旧跑步身体或改写世界',()=>{
  const e=engine();quiet(e);
  e.wukong.loadImage('skinActors');Object.assign(e.wukong.images.skinActors,{naturalWidth:1774,naturalHeight:887});
  e.wukong.hdActors.movingFrame=()=>assert.fail('悟空不能再裁切旧跑步身体后叠加另一套躯干');
  for(const face of [-1,1])for(const giantT of [0,3])for(const variant of [null,'thrust','overhead','lowSweep','whirlwind'])for(let i=0;i<12;i++){
    Object.assign(e.G.p,{x:150,y:112,vx:90*face,face,onGround:true,giantT,anim:i/12*42/90*10,
      staff:variant?{kind:'sweep',variant,face,t:i/12*.4,duration:.4,combo:2,aim:0,weapon:'rifle',hits:[]}:null});
    const before=snapshot(e);e.render();assert.deepEqual(snapshot(e),before);
  }
});

test('伏地挥棍的两只手始终贴住真实棍身，左右朝向、连招和巨大化一致，近敌仍可命中',()=>{
  for(const face of [-1,1])for(const giantT of [0,3])for(const variant of STAFF_VARIANTS)for(const u of [.05,.4,.8]){
    const p={x:150,y:112,face,prone:true,onGround:true,ax:face,ay:0,giantT,
      staff:{kind:'sweep',variant,face,t:u*.32,duration:.32,combo:2,weapon:'rifle'}};
    const q=staffGeometry(p),pose=attackPose(p),size=giantT?2:1;
    const dx=q.tip.x-q.butt.x,dy=q.tip.y-q.butt.y,length=Math.hypot(dx,dy);
    for(const arm of [pose.near,pose.far]){
      const x=p.x+arm.hand.x*face*size-q.butt.x,y=p.y+arm.hand.y*size-q.butt.y;
      assert.ok(Math.abs(x*dy-y*dx)/length<1e-8,'手部和碰撞棍身重合');
      assert.ok((x*dx+y*dy)/(length*length)>0&&(x*dx+y*dy)/(length*length)<1);
      assert.ok(arm.elbow.y<0,'肘部保持在平台上方');
    }
  }
  const e=engine();quiet(e);Object.assign(e.G.p,{x:150,y:112,onGround:true});tick(e,1,{KeyS:true});
  const foe=target(175,112);e.G.en=[foe];e.G.p.cool=0;
  advanceStaff(e.G.p,{down:true,fire:true},0,{random:()=>.21});tick(e,18,{KeyS:true});
  assert.equal(e.G.p.prone,true);assert.equal(foe.hp,18);assert.equal(e.G.pb.length,0);
});
test('连续点按近战可随机遍历全部地面招式，相邻不重复，快照保留选定动作',()=>{
  const e=engine();quiet(e);Object.assign(e.G.p,{x:300,y:144});
  const seen=new Set();let previous=null,variant;
  for(let i=0;i<3600&&seen.size<STAFF_VARIANTS.length;i++){
    tick(e,1,nextMeleeInput(e));const a=e.G.p.staff;if(!a||a===previous)continue;
    assert.notEqual(a.variant,variant);seen.add(a.variant);previous=a;variant=a.variant;
    const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.p.staff.variant,a.variant);
  }
  assert.deepEqual([...seen].sort(),[...STAFF_VARIANTS].sort());assert.equal(e.G.pb.length,0);
});
test('真实连续跳跃时四种空中棍招随机出现，相邻空中动作不重复',()=>{
  const e=engine();quiet(e);Object.assign(e.G.p,{x:300,y:144});
  let lastAction=null,lastAir=null;const seen=new Set();
  for(let i=0;i<1500;i++){
    tick(e,1,nextMeleeInput(e,{KeyK:i%65===0||i%65===24}));const a=e.G.p.staff;
    if(!a||a===lastAction)continue;lastAction=a;
    if(a.kind==='spin'){assert.notEqual(a.variant,lastAir);seen.add(a.variant);lastAir=a.variant;}
    else lastAir=null;
  }
  assert.deepEqual([...seen].sort(),[...AIR_VARIANTS].sort());assert.equal(e.G.pb.length,0);
});
test('天兵远处会操练兵器，近身交替突刺劈砍横扫，冻结同时停止操练姿势',()=>{
  const e=duel('snp',365),soldier=e.G.en[0],poses=[];
  for(let i=0;i<180;i++){tick(e,1);poses.push(guardGeometry(soldier).angle);}
  assert.ok(Math.max(...poses)-Math.min(...poses)>.8);assert.equal(e.G.eb.length,0);
  e.G.freezeT=2;const angle=guardGeometry(soldier).angle;tick(e,60);assert.equal(guardGeometry(soldier).angle,angle);
  e.G.freezeT=0;e.G.p.x=340;e.G.p.shieldT=99;const kinds=new Set();
  for(let i=0;i<380;i++){tick(e,1);if(soldier.melee)kinds.add(soldier.melee.kind);}
  assert.deepEqual([...kinds].sort(),['cut','sweep','thrust']);assert.equal(e.G.eb.length,0);
});
test('镇天戟台仅在近处蓄势旋扫，实际兵器伤人，退开和护盾有效，始终无子弹',()=>{
  const setup=(x=335)=>{const e=engine();quiet(e);e.G.freezeT=0;Object.assign(e.G.p,{x:300,y:144,onGround:true,invT:0});
    e.G.en=[{t:'tur',x,y:130,hp:6,idx:6,rotT:0,fireT:0,flash:0}];return e;};
  const far=setup(410);tick(far,300);assert.equal(far.G.en[0].melee,undefined);assert.equal(far.G.eb.length,0);
  const close=setup(325);tick(close,30);assert.equal(close.G.p.dead,false);tick(close,45);assert.equal(close.G.p.dead,false);assert.equal(close.G.p.hp,84);assert.equal(close.G.eb.length,0);
  const dodge=setup(325);tick(dodge,1);tick(dodge,70,{KeyA:true});assert.equal(dodge.G.p.dead,false);
  const shield=setup(325);shield.G.p.shieldT=5;tick(shield,75);assert.equal(shield.G.p.dead,false);assert.equal(shield.G.en[0].melee.hits.length,1);
  const ice=setup(325);tick(ice,10);const time=ice.G.en[0].melee.t;ice.G.freezeT=1;tick(ice,25);assert.equal(ice.G.en[0].melee.t,time);
});
test('每种随机棍法均能实际命中近敌，同一次挥棍只扣一次血，远敌不受伤',()=>{
  for(let index=0;index<STAFF_VARIANTS.length;index++){
    const e=engine();quiet(e);Object.assign(e.G.p,{x:300,y:144,cool:0});
    const upward=['uppercut','risingSpin'].includes(STAFF_VARIANTS[index]);
    const near=target(upward?310:325,upward?126:144),far=target(450,144);e.G.en=[near,far];
    advanceStaff(e.G.p,{fire:true,fireEdge:true},0,{random:()=>index/STAFF_VARIANTS.length+.001});
    assert.equal(e.G.p.staff.variant,STAFF_VARIANTS[index]);
    // Recorded routines run longer than one second; check the entire attack.
    tick(e,STAFF_SEQUENCES[STAFF_VARIANTS[index]]?Math.ceil(e.G.p.staff.duration*60)+10:25);
    if(STAFF_SEQUENCES[STAFF_VARIANTS[index]])assert.ok(near.hp<=16&&near.hp>=(STAFF_SEQUENCES[STAFF_VARIANTS[index]].throwAt?9:13),STAFF_VARIANTS[index]+' 三段棍击与去回甩棍各结算一次');
    else assert.equal(near.hp,18,STAFF_VARIANTS[index]);assert.equal(far.hp,20,STAFF_VARIANTS[index]);
  }
});

test('十四套棍招用实际贴图组装，左右朝向和巨大化绘制不推进招式或改变角色位置',()=>{
  const e=engine();quiet(e);e.G.mode='pause';
  e.wukong.loadImage('skinActors');Object.assign(e.wukong.images.skinActors,{naturalWidth:1774,naturalHeight:887});
  for(const variant of STAFF_VARIANTS)for(const face of [-1,1])for(const giantT of [0,3])for(const u of [.2,.5,.8]){
    Object.assign(e.G.p,{x:300,y:144,onGround:true,vx:0,face,giantT,staff:{kind:'sweep',variant,t:u*.4,duration:.4,face,combo:1,hits:[]}});
    const before=snapshot(e);e.render();e.render();assert.deepEqual(snapshot(e),before,variant);
  }
  assert.ok(e.wukong.hdActors.movingFrames.size>0);
});
test('全部原武器强化的短按仍以棍身近战，连续点按含第三段重棍，单击模式不自动连击',()=>{
  for(const weapon of ['rifle','machine','spread','laser','fire','homing']){
    const e=engine();quiet(e);Object.assign(e.G.p,{x:300,y:144,weapon});
    tapMelee(e,75);assert.equal(e.G.pb.length,0,weapon);assert.ok(e.G.p.staffCombo>=1);
  }
  const e=engine();quiet(e);e.SET.autofire='off';tick(e,1,{KeyJ:true});tick(e,80);assert.equal(e.G.p.staff,null);
  tick(e,1);tick(e,1,{KeyJ:true});assert.ok(e.G.p.staff);
});
test('上挑和空中回旋能击中高位目标，实心地形会挡住棍身',()=>{
  const e=engine();quiet(e);Object.assign(e.G.p,{x:300,y:144});
  const high=target(302,98);e.G.en=[high];tick(e,1,{KeyW:true,KeyJ:true});tick(e,19);assert.ok(high.hp<20);
  tick(e,20);e.G.p.cool=0;const blocked=target(355,144);e.G.en=[blocked];
  e.solids.push({x:329,y:80,w:8,h:100,g:1});tick(e,1,{KeyJ:true});tick(e,18);assert.equal(blocked.hp,20);
});
test('巨灵神落足停留时可以用金箍棒反击并完整通关，角色边界保持有效',()=>{
  const e=engine();quiet(e);Object.assign(e.G.p,{x:3222,y:176,onGround:true,face:1});
  e.G.camX=2950;e.G.boss.active=true;e.G.freezeT=0;
  const core=e.G.boss.parts[2];
  for(let n=0;n<7200&&!e.G.boss.dead;n++){
    const b=e.G.boss,a=b.giant?.attack,phase=b.encounter?.stage||1;
    const opening=phase!==2||a?.kind==='skyStomp'&&a.t>=a.windup-.04&&a.t<a.windup+COLOSSUS.footRest-.08;
    tick(e,1,opening?nextMeleeInput(e,{KeyK:phase===1&&(n%65===0||n%65===24)}):{});
  }
  // The longer recorded routines can enter the fixed finale near this combat
  // budget. Let the complete existing 9.6-second cinematic finish afterwards.
  if(e.G.boss.encounter?.stage===3)tick(e,600);
  assert.equal(e.G.boss.dead,true,'core hp='+core.hp+' x='+e.G.p.x+' y='+e.G.p.y);assert.ok(core.hp<=0);assert.ok(e.G.p.x<=3222.01);
});
test('巨足离开屏幕后普通近战无法击中空气，落地身体与受击框跟随追踪落点',()=>{
  const e=engine();quiet(e);Object.assign(e.G.p,{x:3150,y:176,onGround:true,invT:999});e.G.camX=2950;e.G.freezeT=0;e.updateBoss();
  e.hitPart(e.G.boss.parts[2],99);tick(e,120);const b=e.G.boss,core=b.parts[2],hp=core.hp;
  b.giant.attack=null;b.giant.cooldown=99;e.updateBoss();assert.equal(e.bossParts().length,0);
  tapMelee(e,50);assert.equal(core.hp,hp,'没有巨足时无法攻击空气扣血');
  b.encounter.turn=1;b.giant.cooldown=0;tick(e,1);const a=b.giant.attack;tick(e,Math.ceil(a.windup*60)+3);
  assert.equal(e.bossParts().length,1);assert.equal(core.x+core.w/2,a.aimX);assert.equal(core.y+core.h,176);
  tick(e,66);assert.equal(e.bossParts().length,1,'落足一秒后仍留在地面供反击');
  Object.assign(e.G.p,{x:a.aimX+35,face:-1,staff:null,cool:0,staffVariantBag:['cross']});
  tapMelee(e,30);assert.ok(core.hp<hp,'延长的停留时间内实际挥棍仍能扣血');
  b.giant.attack.t=a.windup+COLOSSUS.footRest+COLOSSUS.footRise;e.updateBoss();assert.equal(e.bossParts().length,0);
});

const giantDuel=()=>{
  const e=engine();quiet(e);e.G.freezeT=0;
  Object.assign(e.G.p,{x:3214,y:176,onGround:true,invT:0});
  e.G.camX=2950;e.updateBoss();e.G.bannerT=0;return e;
};
const prepareGiantFinale=e=>{
  e.G.freezeT=0;e.G.p.invT=999;
  if(e.G.boss.encounter.stage===1)e.hitPart(e.G.boss.parts[2],999,{k:'staff',heavy:true,vx:1});
  assert.equal(e.G.boss.encounter.stage,2);tick(e,120);
  e.hitPart(e.G.boss.parts[2],999,{k:'staff',heavy:true,vx:1});
  assert.equal(e.G.boss.encounter.stage,3);assert.equal(e.G.boss.dead,false);assert.equal(e.G.boss.exitOpen,false);
};

test('巨灵神超量伤害不能跳过巨足战与终结演出，变身中不扣血，分数和仙门只在演出后结算',()=>{
  const e=giantDuel(),b=e.G.boss;e.G.p.invT=999;
  e.hitPart(b.parts[2],999);assert.equal(b.encounter.stage,2);assert.equal(b.parts[2].hp,COLOSSUS.hp);assert.equal(e.G.score,0);
  e.hitPart(b.parts[2],999);assert.equal(b.parts[2].hp,COLOSSUS.hp);tick(e,120);
  e.hitPart(b.parts[2],999);assert.equal(b.encounter.stage,3);assert.equal(b.parts[2].hp,1);
  e.hitPart(b.parts[2],999);assert.equal(b.parts[2].hp,1);assert.equal(b.dead,false);assert.equal(b.exitOpen,false);
  tick(e,577);assert.equal(b.dead,true);assert.equal(e.G.score,10000);assert.equal(b.exitOpen,false);
  assert.equal(giantDefeatVisual(b).blend,1,'终结技已经倒地后不能再次站起来重放死亡');
  tick(e,70);assert.equal(b.exitOpen,true);e.hitPart(b.parts[2],999);assert.equal(e.G.score,10000);
  const contra=engine(false);contra.G.boss.active=true;contra.hitPart(contra.G.boss.parts[2],999);
  assert.equal(contra.G.boss.dead,true);assert.equal(contra.G.boss.encounter,undefined);
});

test('追身巨足不能原地跳躲，真实移动离开落点再跳能避开，地面保留原平台',()=>{
  const duel=()=>{const e=giantDuel();e.hitPart(e.G.boss.parts[2],99);tick(e,120);e.G.p.invT=0;e.G.p.x=3100;
    e.G.boss.encounter.turn=1;e.G.boss.giant.attack=null;e.G.boss.giant.cooldown=0;tick(e,1);return e;};
  const ground=duel();tick(ground,95);assert.equal(ground.G.p.hp,66);assert.equal(ground.G.p.dead,false);
  const jump=duel();tick(jump,60);tick(jump,1,{KeyK:true});assert.ok(jump.G.p.y<176);tick(jump,34);assert.equal(jump.G.p.hp,66);
  const evade=duel();tick(evade,16);tick(evade,56,{KeyD:true});tick(evade,1,{KeyK:true});tick(evade,20);
  assert.equal(evade.G.p.hp,100);assert.equal(evade.G.boss.encounter.stage,2);assert.equal(evade.G.boss.encounter.scars.length,1);
});

test('七十二变经实际寿桃拾取与L键施放，鹏能飞行，L换形，暂停与死亡清理正确',()=>{
  const e=powerScene(),p=e.G.p;take(e,'transform');tick(e,1);tick(e,1,{KeyL:true});
  assert.equal(e.G.inv.length,0);assert.equal(p.magic.transform.form,'peng');assert.ok(p.spCd<=.6);
  const x=p.x,y=p.y;tick(e,15,{KeyD:true,KeyW:true});assert.ok(p.x>x+25);assert.ok(p.y<y-20);assert.equal(p.onGround,false);
  const time=p.magic.transform.remaining;e.G.mode='pause';tick(e,100);assert.equal(p.magic.transform.remaining,time);
  e.G.mode='play';tick(e,30);tick(e,1,{KeyL:true});assert.equal(p.magic.transform.form,'tiger');
  tick(e,40);tick(e,1,{KeyL:true});assert.equal(p.magic.transform.form,'tortoise');
  tick(e,30,{KeyS:true});assert.equal(p.magic.transform.guard,true);e.killPlayer(true);assert.equal(p.magic,undefined);
});

test('自动终结期间攻击、移动、跳跃和大招输入不会操纵主角，暂停与客机不推进计时，绘制不改世界',()=>{
  const e=giantDuel();prepareGiantFinale(e);const p=e.G.p,x=p.x,y=p.y,hp=p.hp;
  tick(e,180,{KeyD:true,KeyJ:true,KeyK:true,KeyI:true});assert.equal(p.x,x);assert.equal(p.y,y);assert.equal(p.hp,hp);
  assert.equal(e.G.gr.length,0);assert.equal(e.G.score,0);assert.equal(e.G.boss.encounter.event,1);
  const time=e.G.boss.encounter.time;e.G.mode='pause';tick(e,60);assert.equal(e.G.boss.encounter.time,time);
  e.G.mode='play';e.coop.playing=true;e.coop.role='guest';e.coop.input=()=>{};tick(e,60);assert.equal(e.G.boss.encounter.time,time);
  e.coop.playing=false;e.coop.role='host';const before=snapshot(e);e.render();assert.deepEqual(snapshot(e),before);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.boss.encounter.time,time);assert.equal(world.boss.encounter.stage,3);
});
test('巨灵神存活时可越过旧炮台空气墙到达战场右侧，步行、跳跃和坐骑使用地图边界',()=>{
  for(const state of [{},{onGround:false,vy:-180},{ride:'moto',rideT:20},{ride:'heli',rideT:20,y:132,onGround:false}]){
    const e=giantDuel();Object.assign(e.G.p,{invT:999},state);
    const layout=()=>e.solids.map(({x,y,w,h})=>({x,y,w,h})),solids=JSON.stringify(layout());
    tick(e,200,{KeyD:true});
    assert.equal(e.G.p.x,imports.FORTRESS_ART.levelEnd-(state.ride==='heli'?22:10),JSON.stringify(state));
    assert.equal(e.G.boss.dead,false);assert.ok(!e.G.boss.exitOpen);assert.equal(e.G.stage,1);
    assert.ok(!e.G.p.enteringExit);assert.equal(JSON.stringify(layout()),solids,'只修复移动边界，不修改平台');
  }
  const original=engine(false);quiet(original);original.G.camX=2950;Object.assign(original.G.p,{x:3214,y:176,onGround:true});
  tick(original,200,{KeyD:true});assert.equal(original.G.p.x,imports.FORTRESS_ART.wallX-10,'原魂斗罗炮阵仍保留实体墙边界');
});

test('站在巨灵神右边击败它后不向左瞬移，仙门开启前不能过关，开启后可从右侧跳入',()=>{
  const e=giantDuel();e.primeResources(2);Object.assign(e.G.p,{x:imports.FORTRESS_ART.levelEnd-10,y:176,onGround:true,invT:999});
  const right=e.G.p.x;prepareGiantFinale(e);tick(e,12);
  assert.equal(e.G.p.x,right);assert.equal(e.G.boss.exitOpen,false);assert.equal(e.G.stage,1);
  tick(e,640);assert.equal(e.G.p.x,right);assert.equal(e.G.boss.exitOpen,true);assert.equal(e.G.stage,1);
  tick(e,1,{KeyA:true,KeyK:true});for(let i=0;i<150&&e.G.mode==='play';i++)tick(e,1,{KeyA:true});
  assert.equal(e.G.stage,2);assert.equal(e.G.mode,'intro');assert.equal(e.G.base,undefined);
});

test('二号悟空也可在巨灵神存活时走到右侧，经过仙门区域不会提前通关',()=>{
  const e=engine();e.coop.playing=true;e.reset(1);quiet(e);e.G.freezeT=0;e.G.camX=2950;
  for(const p of [e.G.p,e.G.p2])Object.assign(p,{x:3214,y:176,onGround:true,invT:999});e.updateBoss();
  for(let i=0;i<200;i++){e.updatePartner({right:true});e.updateBoss();}
  assert.equal(e.G.p2.x,imports.FORTRESS_ART.levelEnd-10);assert.equal(e.G.p.x,3214);
  assert.equal(e.G.boss.dead,false);assert.ok(!e.G.boss.exitOpen);assert.ok(!e.G.p2.enteringExit);assert.equal(e.G.stage,1);
});
test('关底巨灵神叠在连续天宫全景上，不再重绘异比例背景，击败后保留入口',()=>{
  const e=giantDuel(),art=e.wukong,painted=[];
  art.state=e.G;
  for(const [key,width,height]of [['heaven',2172,724],['skinActors',1774,887],['giantWholeMovement',1448,1086],['giantWholeCleave',1448,1086]]){
    art.loadImage(key);Object.assign(art.images[key],{naturalWidth:width,naturalHeight:height});
  }
  art.g.drawImage=image=>painted.push(image);
  let exits=0;const exitHole=art.exitHole.bind(art);
  art.exitHole=boss=>{exits++;exitHole(boss);};
  for(const dead of [false,true]){
    Object.assign(e.G.boss,{dead,deadT:1.1});painted.length=0;
    const before=snapshot(e);art.fortress(e.G.boss);
    assert.ok(painted.includes(art.images.giantWholeMovement)||painted.includes(art.images.giantWholeCleave),'巨灵神以含双臂与巨斧的完整关键帧绘制');
    assert.ok(!painted.includes(art.images.skinActors),'不得继续绘制旧图集上的分体手臂或斧头');
    assert.ok(!painted.includes(art.images.heaven),'不能覆盖连续全景形成矩形接缝');
    assert.equal(exits,dead?1:0);assert.deepEqual(snapshot(e),before);
  }
});
test('南天门激活巨灵神并移除炮台靶点，两种斧招都能实际伤人且不生成炮弹',()=>{
  for(const turn of [0,1]){
    const e=giantDuel(),b=e.G.boss;
    assert.equal(e.bossParts().length,1);assert.ok(b.parts.slice(0,2).every(p=>p.hp===0));
    assert.ok(Math.abs(b.parts[2].hitBox.y-85)<.1);b.giant.turn=turn;b.giant.cooldown=0;
    tick(e,35);assert.equal(e.G.p.dead,false);assert.equal(b.giant.attack.kind,turn?'sweep':'cleave');
    tick(e,40);assert.equal(e.G.p.dead,false);assert.equal(e.G.p.hp,78,b.giant.attack?.kind);assert.equal(e.G.eb.length,0);
  }
});
test('整身巨斧按新绘制的真实攻击距离走近再出手，静止近战目标能被下劈横扫与旋身实际命中',()=>{
  const e=giantDuel();e.G.p.x=3143;e.G.p.shieldT=999;e.G.p.invT=0;
  const hit=new Set();for(let i=0;i<1800;i++){tick(e,1);const a=e.G.boss.giant.attack;if(a?.hits.includes(e.G.p))hit.add(a.kind);}
  for(const kind of ['cleave','sweep','whirlwind'])assert.ok(hit.has(kind),kind+' 不应停在画面巨斧够不到的距离空挥');
  assert.equal(e.G.p.dead,false);assert.equal(e.G.eb.length,0);
});
test('巨斧蓄势可以后退避开，冻结暂停动作；半血后进入有变身保护的巨足阶段',()=>{
  const dodge=giantDuel();dodge.G.boss.giant.cooldown=0;tick(dodge,1);tick(dodge,80,{KeyA:true});
  assert.equal(dodge.G.p.dead,false);
  const e=giantDuel();e.G.boss.giant.cooldown=0;tick(e,12);const time=e.G.boss.giant.attack.t;
  e.G.freezeT=1;tick(e,20);assert.equal(e.G.boss.giant.attack.t,time);assert.equal(e.G.p.dead,false);
  e.G.freezeT=0;e.G.boss.giant.attack=null;e.G.boss.giant.cooldown=0;e.G.boss.parts[2].hp=30;tick(e,1);
  assert.equal(e.G.boss.phase2,true);assert.equal(e.G.boss.giant.form,'colossus');assert.ok(e.G.boss.encounter.growth>1.7);assert.equal(e.G.boss.giant.attack,null);assert.equal(e.G.eb.length,0);
});
test('巨灵神五种攻击轮换，双手在每个动作阶段都握住同一根真实命中斧柄',()=>{
  const e=giantDuel();e.G.p.invT=999;e.G.boss.giant.cooldown=0;const seen=new Set();
  for(let n=0;n<1000;n++){
    tick(e,1);const g=e.G.boss.giant;if(!g.attack)continue;seen.add(g.attack.kind);
    for(const face of [-1,1]){
      const fixture={...g,face},q=giantPose(fixture),rig=giantRig(fixture);
      for(const arm of [rig.near,rig.far]){
        assert.ok(Object.values(arm.elbow).every(Number.isFinite));
        const cross=(arm.hand.x-q.origin.x)*(q.tip.y-q.origin.y)-(arm.hand.y-q.origin.y)*(q.tip.x-q.origin.x);
        assert.ok(Math.abs(cross)<1e-8);
        assert.ok(Math.hypot(arm.shoulder.x-arm.elbow.x,arm.shoulder.y-arm.elbow.y)>5);
      }
    }
  }
  assert.deepEqual([...seen].sort(),[...GIANT_MOVES].sort());assert.equal(e.G.eb.length,0);
});
test('近处交战也会在收斧时换步，并在两次地面招式后跳斩，不长期站桩',()=>{
  const e=giantDuel(),g=e.G.boss.giant;e.G.p.invT=999;g.cooldown=0;
  const positions=[],attacks=[];let last=null;
  for(let i=0;i<470;i++){
    tick(e,1);positions.push(g.x);
    if(g.attack&&g.attack!==last){attacks.push(g.attack.kind);last=g.attack;}
  }
  assert.ok(Math.max(...positions)-Math.min(...positions)>55);
  assert.deepEqual(attacks.slice(0,3),['cleave','sweep','leap']);assert.equal(e.G.eb.length,0);
});
test('迈步切换完整斧招时混合身体与脚步，暂停冻结序列帧，联机保留过渡姿势',()=>{
  const e=giantDuel(),g=e.G.boss.giant;e.G.p.invT=999;e.G.p.x=3100;g.cooldown=5;tick(e,50);
  assert.equal(g.animation.clip,'walk');const before=giantPose(g);
  e.G.p.x=g.x-62;g.cooldown=0;tick(e,1);
  assert.equal(g.animation.clip,'cleave');assert.equal(g.animation.elapsed,0);assert.ok(g.animation.from);
  const start=giantPose(g);
  for(const field of Object.keys(GIANT_REST))assert.ok(Math.abs(start[field]-before[field])<(field==='angle'?.16:1e-8),field+'切换时不能跳姿');
  assert.equal(start.frame.id,'cleave:0');assert.ok(Math.hypot(start.origin.x-before.origin.x,start.origin.y-before.origin.y)<12,'整身斧招从接近持械待机的完整首帧开始');
  tick(e,5);const frozen=JSON.stringify(g.animation);e.G.freezeT=1;tick(e,20);assert.equal(JSON.stringify(g.animation),frozen);
  e.G.freezeT=0;e.G.mode='pause';tick(e,10);assert.equal(JSON.stringify(g.animation),frozen);e.G.mode='play';
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));
  assert.deepEqual(JSON.parse(JSON.stringify(world.boss.giant.animation)),JSON.parse(frozen));
  tick(e,8);assert.equal(g.animation.from,null);assert.equal(g.attack.kind,'cleave');
});
test('巨灵神追近远处悟空并后撤调整距离，脚步随位移交替且始终留在原关底平台',()=>{
  const e=giantDuel(),g=e.G.boss.giant;e.G.p.invT=999;e.G.p.x=3050;g.cooldown=10;
  const start=g.x,feet=new Set();
  for(let i=0;i<110;i++){
    tick(e,1);const rig=giantRig(g);feet.add(rig.legs.map(l=>l.ankle.y.toFixed(1)).join(','));
    assert.equal(g.y,GIANT_ARENA.floor);assert.ok(g.x>=GIANT_ARENA.left&&g.x<=GIANT_ARENA.right);
  }
  assert.ok(g.x<start-60);assert.ok(feet.size>15);assert.ok(g.gait>4);
  e.G.p.x=g.x-25;const close=g.x;tick(e,45);assert.ok(g.x>close+15,'过近时后撤拉开出斧距离');
  g.x=GIANT_ARENA.left;e.G.p.x=2955;g.cooldown=20;tick(e,100);assert.ok(g.x>=GIANT_ARENA.left);
});
test('跳斩有真实腾空与固定落点，受击区域跟随身体，冻结与暂停保留空中姿势',()=>{
  const e=giantDuel(),g=e.G.boss.giant;e.G.p.invT=999;g.cooldown=0;g.turn=4;tick(e,1);
  assert.equal(g.attack.kind,'leap');const landing=g.attack.landingX,takeoff=g.x;
  tick(e,Math.round((g.attack.windup+GIANT_ARENA.flight/2)*60));
  assert.equal(g.onGround,false);assert.ok(g.y<145);assert.ok(g.x<takeoff-20);assert.ok(e.G.boss.parts[2].hitBox.y<57);
  const frozen=JSON.stringify(g);e.G.freezeT=1;tick(e,20);assert.equal(JSON.stringify(g),frozen);
  e.G.freezeT=0;e.G.mode='pause';tick(e,10);assert.equal(JSON.stringify(g),frozen);
  e.G.mode='play';e.G.p.x=3020;let landed=false;
  for(let i=0;i<30;i++){tick(e,1);if(g.attack?.landed){landed=true;break;}}
  assert.equal(landed,true);assert.ok(Math.abs(g.x-landing)<1e-8);assert.equal(g.y,176);assert.equal(g.onGround,true);assert.equal(g.vy,0);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.deepEqual(JSON.parse(JSON.stringify(world.boss.giant)),JSON.parse(JSON.stringify(g)));
});
test('跳斩落地向两侧震地，蓄势和升空不会提前伤人，跳起和墙体能避开震波',()=>{
  const e=giantDuel(),g=e.G.boss.giant;e.G.p.invT=999;g.turn=4;g.cooldown=0;tick(e,1);
  const player={x:0,y:176,dead:false},boxAt=(x,y=176)=>({x:x-7,y:y-28,w:14,h:28});
  player.x=g.attack.landingX;
  assert.equal(giantHitsPlayer(e.G.boss,player,boxAt(player.x),[]),false);
  for(let i=0;i<110&&!g.attack.landed;i++)tick(e,1);
  tick(e,9);const waves=giantShockwaves(g);assert.equal(waves.length,2);
  for(const wave of waves){
    const p={dead:false},box=boxAt(wave.x);
    assert.equal(giantHitsPlayer(e.G.boss,p,box,[]),true);
    assert.equal(giantHitsPlayer(e.G.boss,p,box,[]),false,'每次跳斩只伤同一角色一次');
    assert.equal(giantHitsPlayer(e.G.boss,{dead:false},boxAt(wave.x,130),[]),false);
    const wall={x:(g.x+wave.x)/2-2,y:130,w:4,h:46,g:1};
    assert.equal(giantHitsPlayer(e.G.boss,{dead:false},box,[wall]),false);
  }
  assert.equal(e.G.eb.length,0);
});
test('击败后巨灵神完整倒地并持续保留，仙门使用新图且不改变原通关区域',()=>{
  const e=giantDuel(),art=e.wukong;
  for(const key of ['giantRig','skinActors','heavenEncounters']){art.loadImage(key);Object.assign(art.images[key],{naturalWidth:1536,naturalHeight:1024});}
  prepareGiantFinale(e);tick(e,652);
  assert.equal(giantDefeatVisual(e.G.boss).blend,1);assert.ok(e.G.boss.defeatRig);assert.equal(e.G.boss.exitOpen,true);
  const painted=[];art.g.drawImage=(image,...args)=>{if(image===art.images.heavenEncounters)painted.push(args.slice(0,4));};
  const before=snapshot(e);e.render();assert.deepEqual(snapshot(e),before);
  assert.ok(painted.some(bounds=>JSON.stringify(bounds)===JSON.stringify(ENCOUNTER_FRAMES.fallen)));
  assert.ok(painted.some(bounds=>JSON.stringify(bounds)===JSON.stringify(ENCOUNTER_FRAMES.gate)));
});
test('击中携桃仙女掉落一次寿桃，仙女加速飞离，拾取后实际获得原棍法强化',()=>{
  const e=powerScene();e.G.freezeT=0;
  const fairy={fairy:true,x:334,y:124,y0:124,t:0,kind:'M'};e.G.pods=[fairy];tick(e,20,{KeyJ:true});
  assert.equal(fairy.flee,true);assert.notEqual(fairy.dead,true);assert.equal(e.G.items.length,1);
  const peach=e.G.items[0];assert.equal(peach.peach,true);assert.equal(peach.kind,'M');assert.equal(peach.fromPod,true);
  const x=fairy.x;tick(e,25,{KeyJ:true});assert.ok(fairy.x-x>70);assert.equal(e.G.items.length,1);assert.equal(peach.landed,true);
  Object.assign(e.G.p,{x:peach.x,y:peach.y,onGround:true});e.collide();assert.equal(e.G.p.weapon,'machine');assert.equal(peach.dead,true);
  tick(e,120);assert.equal(e.G.pods.length,0);assert.equal(e.G.eb.length,0);
});
test('第一关补给随机等待后生成仙女携桃，联机保留逃离和掉落状态，普通魂斗罗仍为原飞碟',()=>{
  for(const theme of [true,false]){
    const e=engine(theme);quiet(e);e.G.podTrig=[{at:0,y0:70,kind:'L',done:false}];tick(e,theme?120:1);
    assert.equal(!!e.G.pods[0].fairy,theme);
    const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(!!world.pods[0].fairy,theme);
  }
  const e=powerScene();e.G.pods=[{fairy:true,x:335,y:125,y0:125,t:0,kind:'S'}];tick(e,18,{KeyJ:true});
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.pods[0].flee,true);assert.equal(world.items[0].peach,true);assert.equal(world.items[0].kind,'S');
});
test('同帧满足多个仙女触发点仍限一位，暂停与客机不推进随机等待，重开清除旧排程',()=>{
  const e=engine();quiet(e);
  e.G.podTrig=['M','arms','S','clone'].map(kind=>({at:0,y0:70,kind,done:false}));
  tick(e,30);assert.equal(e.G.pods.length,0);assert.ok(e.G.podTrig.every(t=>!t.done));
  const supplySnapshot=()=>JSON.parse(JSON.stringify(imports.packWorld([e.G.wukongSupplies,e.G.podTrig,e.G.pods])));
  const before=supplySnapshot();e.G.mode='pause';tick(e,90);e.render();assert.deepEqual(supplySnapshot(),before);
  e.G.mode='play';e.coop.playing=true;e.coop.role='guest';e.coop.input=()=>{};tick(e,90);assert.deepEqual(supplySnapshot(),before);
  e.coop.playing=false;e.coop.role='host';
  let max=0;
  for(let n=0;n<2400;n++){tick(e,1);max=Math.max(max,e.G.pods.filter(pd=>!pd.dead).length);}
  assert.equal(max,1);assert.ok(e.G.podTrig.every(t=>t.done));assert.equal(e.G.wukongSupplies.spawned,4);
  e.reset(1);assert.equal(e.G.wukongSupplies,undefined);assert.ok(e.G.podTrig.every(t=>!t.done));
  tick(e,1);e.reset(3);assert.equal(e.G.wukongSupplies,undefined);
});
test('旋身连斩能实际命中，踏地震波贴地伤人但可跳起躲开，墙体阻挡震波',()=>{
  for(const turn of [2,3]){
    const e=giantDuel();e.G.boss.giant.turn=turn;e.G.boss.giant.cooldown=0;tick(e,45);assert.equal(e.G.p.dead,false);
    tick(e,90);assert.equal(e.G.p.dead,false);assert.ok(e.G.p.hp<=78,turn===2?'whirlwind':'stomp');
  }
  const jump=giantDuel();jump.G.boss.giant.turn=3;jump.G.boss.giant.cooldown=0;tick(jump,50);tick(jump,1,{KeyK:true});tick(jump,70);assert.equal(jump.G.p.dead,false);
  const wall=giantDuel();wall.solids.push({x:3230,y:140,w:6,h:36,g:1});wall.G.boss.giant.turn=3;wall.G.boss.giant.cooldown=0;tick(wall,140);assert.equal(wall.G.p.dead,false);
});
test('悟空死亡使用完整比例的专用腾空、着地和侧躺贴图，跑步腿甲与靴子保留体积',()=>{
  const e=engine();e.wukong.loadImage('skinDeath');e.wukong.loadImage('skinActors');
  e.wukong.images.skinDeath.naturalWidth=2172;e.wukong.images.skinDeath.naturalHeight=724;
  e.wukong.images.skinActors.naturalWidth=1774;e.wukong.images.skinActors.naturalHeight=887;
  const art=e.wukong.hdActors,air=art.frame('blue','deathAir',3),rest=art.frame('blue','deathRest',3);
  assert.ok(air.h>=37);assert.ok(rest.h>=19);assert.ok(rest.w>50);assert.notEqual(art.deadPose,'prone');
  for(const role of ['red','blue'])for(const part of ['NearThigh','FarThigh','NearShin','FarShin']){
    const meta=SKIN_RIG[role].frames['rig'+part],clip=meta.clip;
    assert.ok(Math.hypot(clip[0][0]-clip[3][0],clip[0][1]-clip[3][1])*meta.scale>=4.5,role+part);
  }
  assert.ok(art.frame('blue','rigNearBoot',3).w>=7);
  Object.assign(e.G.p,{dead:true,deathGrounded:true,deathLandT:.2,deathAge:.6,deadT:.8});
  const before=snapshot(e);e.render();assert.deepEqual(snapshot(e),before);
});
test('巨灵神能攻击二号玩家，护盾只挡本次斧击，快照保留攻击与命中引用',()=>{
  const e=giantDuel();e.coop.playing=true;e.reset(1);quiet(e);e.G.freezeT=0;
  Object.assign(e.G.p,{x:3100,y:176,onGround:true,invT:0});
  Object.assign(e.G.p2,{x:3214,y:176,onGround:true,invT:0,shieldT:3});e.G.camX=2950;e.updateBoss();e.G.boss.giant.cooldown=0;
  tick(e,75);assert.equal(e.G.p2.dead,false);assert.equal(e.G.p.dead,false);
  assert.equal(e.G.boss.giant.attack.hits.length,1);assert.equal(e.G.boss.giant.attack.hits[0],e.G.p2);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.boss.giant.attack.hits[0],world.p2);
});
test('击败巨灵神后跳入仙门进入悟空第二章，保留分数与装备，仍为横版棍战',()=>{
  const e=giantDuel(),b=e.G.boss;e.primeResources(2);const before=e.G.score;e.G.p.weapon='laser';
  prepareGiantFinale(e);tick(e,577);assert.equal(b.dead,true);assert.equal(b.giant.attack,null);
  tick(e,75);assert.equal(b.exitOpen,true);assert.equal(e.G.stage,1);assert.equal(e.G.score,before+10000);
  Object.assign(e.G.p,{x:3222,y:176,onGround:true,invT:999});
  tick(e,1,{KeyD:true,KeyK:true});
  for(let n=0;n<150&&e.G.mode==='play';n++)tick(e,1,{KeyD:true});
  assert.equal(e.G.stage,2);assert.equal(e.G.mode,'intro');assert.equal(e.G.base,undefined);assert.equal(e.G.p.weapon,'laser');assert.equal(e.G.score,before+10000);
  assert.equal(e.inspect().game,'wukong');
});
test('满怒才可施放三段大招并消耗怒气，等待不会自动回满，近处前后均命中且不生成手雷或巨石',()=>{
  const e=engine();quiet(e);Object.assign(e.G.p,{x:300,y:144,invT:0});
  const front=target(350,144),back=target(260,144),far=target(430,144);e.G.en=[front,back,far];
  e.G.p.rage=75;tick(e,1,{KeyI:true});assert.ok(!e.G.p.staff);assert.equal(e.G.p.rage,75);tick(e,1);
  e.G.p.rage=100;e.G.p.rageBag=['sweep'];tick(e,1,{KeyI:true});assert.equal(e.G.p.staff.kind,'ultimate');assert.equal(e.G.nadeCd,0);assert.equal(e.G.p.rage,0);assert.ok(e.G.p.invT>.9);
  tick(e,14);assert.equal(front.hp,16);assert.equal(back.hp,16);assert.equal(far.hp,20);
  tick(e,28);assert.equal(front.hp,8);assert.equal(back.hp,8);assert.equal(far.hp,20);assert.equal(e.G.gr.length,0);
  tick(e,30);assert.equal(e.G.p.staff,null);assert.equal(front.hp,8);
  tick(e,1,{KeyI:true});assert.equal(e.G.p.staff,null);
  tick(e,420);tick(e,1,{KeyI:true});assert.equal(e.G.p.staff,null);assert.equal(e.G.p.rage,0);
  tick(e,1);e.G.p.rage=100;tick(e,1,{KeyI:true});assert.equal(e.G.p.staff.kind,'ultimate');
});
test('大招不能穿实心墙，击散近处敌弹，按住普攻不会打断大招',()=>{
  const e=engine();quiet(e);Object.assign(e.G.p,{x:300,y:144});
  e.G.p.rage=100;e.G.p.rageBag=['sweep'];
  const behindWall=target(355,144);e.G.en=[behindWall];e.solids.push({x:329,y:60,w:8,h:100,g:1});
  tick(e,1,{KeyI:true,KeyJ:true});tick(e,8,{KeyJ:true});
  const bullet={x:305,y:123,vx:0,vy:0,g:0,life:3,k:'shot',t:0};e.G.eb=[bullet];
  tick(e,4,{KeyJ:true});assert.equal(e.G.p.staff.kind,'ultimate');assert.equal(bullet.dead,true);
  tick(e,40,{KeyJ:true});assert.equal(behindWall.hp,20);
});
test('连招动作不同，起收势连续，持棍手贴住真实棍身，松开的辅助手留作护手',()=>{
  const e=engine();quiet(e);Object.assign(e.G.p,{x:300,y:144});const moves=new Set();
  for(let i=0;i<240;i++){
    tick(e,1,nextMeleeInput(e));const p=e.G.p;if(!p.staff)continue;moves.add(p.staff.kind);
    for(const face of [1,-1])for(const giantT of [0,5]){
      const actor={...p,face,giantT,staff:{...p.staff,face}},pose=attackPose(actor),line=staffGeometry(actor),size=giantT?2:1;
      for(const arm of [pose.near,pose.far]){
        if(arm.gripping===false)continue;
        const hand=arm.hand;
        const x=actor.x+hand.x*face*size,y=actor.y+hand.y*size;
        const cross=(x-line.origin.x)*(line.tip.y-line.origin.y)-(y-line.origin.y)*(line.tip.x-line.origin.x);
        assert.ok(Math.abs(cross)<1e-8,'hands grip the collision staff');
      }
    }
    const beginning=staffGeometry(p,0),ending=staffGeometry(p,p.staff.duration);
    assert.ok(Math.abs(beginning.angle-ending.angle)<1e-8);
    assert.ok(Math.abs(beginning.reach-ending.reach)<1e-8||p.staff.kind==='spin');
    assert.ok(Math.abs(staffMotion(p,0).lean)<1e-8);assert.ok(Math.abs(staffMotion(p,p.staff.duration).lean)<1e-8);
  }
  assert.deepEqual([...moves],['sweep','backhand','smash']);
});
test('二号玩家怒气独立消耗，快照保存各段命中记录且不会重复伤害',()=>{
  const e=engine();e.coop.playing=true;e.reset(1);quiet(e);
  Object.assign(e.G.p2,{x:300,y:144,invT:999,rage:100,rageBag:['sweep']});e.G.en=[target(350,144)];e.G.p.rage=50;
  e.updatePartner({nadeEdge:true});assert.equal(e.G.p2.rage,0);assert.equal(e.G.p.rage,50);assert.equal(e.G.nadeCd2,0);assert.equal(e.G.nadeCd,0);
  for(let i=0;i<14;i++){e.updatePartner({});e.collide();}
  const hp=e.G.en[0].hp;e.collide();assert.equal(e.G.en[0].hp,hp);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.p2.staff.pulseHits[0][0],world.en[0]);
});

test('实际受击两次攒满怒气，保护期不重复积累，满怒可打断受击施放且等待不恢复怒气',()=>{
  const e=powerScene();e.G.p.invT=0;e.killPlayer(false,{damage:12,face:-1});assert.equal(e.G.p.rage,50);
  e.killPlayer(false,{damage:12,face:-1});assert.equal(e.G.p.rage,50);
  e.G.p.invT=0;e.killPlayer(false,{damage:12,face:-1});
  assert.equal(e.G.p.hp,76);assert.equal(e.G.p.rage,100);assert.ok(e.G.p.hurt);
  tick(e,1,{KeyI:true});assert.equal(e.G.p.staff.kind,'ultimate');assert.equal(e.G.p.hurt,null);assert.equal(e.G.p.rage,0);
  tick(e,160);assert.equal(e.G.p.rage,0);assert.ok(!e.G.p.staff);
});
test('筋斗云保留飞行移动、十二秒持续时间，并绘制云与悟空而非直升机',()=>{
  const e=engine();quiet(e);e.G.inv=['h'];e.G.sel=0;e.useSpecial();
  assert.equal(e.G.p.ride,'heli');assert.equal(e.G.p.rideT,12);const x=e.G.p.x,y=e.G.p.y;
  tick(e,30,{KeyD:true,KeyW:true});assert.ok(e.G.p.x>x+40);assert.ok(e.G.p.y<y);
  let clouds=0,heroes=0;e.wukong.helicopter=()=>clouds++;
  const draw=e.wukong.hdActors.draw.bind(e.wukong.hdActors);
  e.wukong.hdActors.draw=(g,p,...args)=>{if(!p.ride)heroes++;return draw(g,p,...args);};e.render();
  assert.ok(clouds>0);assert.ok(heroes>0);tick(e,730);assert.equal(e.G.p.ride,null);
});
test('二号玩家可独立挥棍，网络快照保留招式和已命中目标，不重复扣血',()=>{
  const e=engine();e.coop.playing=true;e.reset(1);quiet(e);
  Object.assign(e.G.p,{x:40,y:112});Object.assign(e.G.p2,{x:300,y:144,invT:999});
  const foe=target(315,144);e.G.en=[foe];
  for(let i=0;i<11;i++){e.updatePartner({fire:i===0,fireEdge:i===0});e.collide();}
  assert.equal(foe.hp,18);assert.equal(e.G.p.staff,undefined);assert.equal(e.G.pb.length,0);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.ok([...(world.p2.staff.hits||[]),...(world.p2.staff.beatHits||[]).flat()].includes(world.en[0]));
  const before=foe.hp;e.collide();assert.equal(foe.hp,before);
});
test('角色继续使用现有 HDActorArt 及骨骼动画，换肤模块不提供模拟函数',()=>{
  const e=engine(true);
  assert.equal(e.wukong.hdActors.runRig,SKIN_RIG);
  assert.equal(e.wukong.hdActors.constructor.name,'HDActorArt');
  for(const name of ['reset','update','attack','hurt','respawn','updateBoss'])assert.equal(typeof e.wukong[name],'undefined',name);
  for(const role of ['red','blue','enemy'])for(const part of ['NearThigh','NearShin','NearBoot','FarThigh','FarShin','FarBoot'])
    assert.ok(SKIN_RIG[role].frames['rig'+part]);
});
test('绘制换肤画面不改变任何地图、角色、敌人或弹丸数据',()=>{
  const e=engine(true);tick(e,80,{KeyD:true,KeyJ:true});const before=snapshot(e);
  e.render();assert.deepEqual(snapshot(e),before);
});
test('悟空气血耗尽后的死亡与复活位置保持原流程，不增加独立检查点',()=>{
  const original=engine(false),skin=engine(true);
  original.SET.inf=skin.SET.inf='off';
  quiet(original);quiet(skin);
  original.G.p.invT=skin.G.p.invT=0;skin.G.p.hp=12;original.killPlayer();skin.killPlayer();
  assert.equal(skin.G.p.dead,true);
  tick(original,200);tick(skin,200);
  for(const key of ['x','y','vx','vy','dead'])assert.equal(skin.G.p[key],original.G.p[key],key);
  assert.equal(skin.G.lives,original.G.lives);assert.equal(skin.G.deaths,original.G.deaths);
  assert.equal(skin.G.wukong,undefined);
});
test('独立悟空入口拒绝魂斗罗后续关卡，单人和联机不进入未开放章节',()=>{
  for(const stage of [3,5]){
    for(const online of [false,true]){
      const skin=engine();skin.coop.playing=online;
      assert.equal(skin.startStage(stage),false);assert.equal(skin.G.stage,1);assert.equal(skin.G.mode,'play');
    }
  }
});

test('新气血规则真实接入受伤死亡与复活，每命100点，护盾与受击无敌不重复扣血',()=>{
  const e=engine();quiet(e);e.G.p.invT=0;
  e.killPlayer(false,{damage:12,face:-1});assert.equal(e.G.p.hp,88);assert.equal(e.G.p.dead,false);assert.equal(e.G.deaths,0);
  e.killPlayer(false,{damage:22,heavy:true});assert.equal(e.G.p.hp,88);
  e.G.p.invT=0;e.G.p.shieldT=1;e.killPlayer();assert.equal(e.G.p.hp,88);e.G.p.shieldT=0;
  for(let i=0;i<7;i++){e.G.p.invT=0;e.killPlayer(false,{damage:12});}
  assert.equal(e.G.p.hp,4);assert.equal(e.G.p.dead,false);
  e.G.p.invT=0;e.killPlayer(false,{damage:12});assert.equal(e.G.p.hp,0);assert.equal(e.G.p.dead,true);assert.equal(e.G.deaths,1);
  tick(e,200);assert.equal(e.G.p.dead,false);assert.equal(e.G.p.hp,100);assert.equal(e.G.p.maxHp,100);
});

test('补血仙桃与金丹落地后直接恢复生命，不占三格道具栏，不覆盖武器与仙术',()=>{
  const e=powerScene();take(e,'L');take(e,'arms');e.useSpecial();const inv=Array.from(e.G.inv);e.G.p.hp=15;
  take(e,'healPeach');assert.equal(e.G.p.hp,45);assert.match(e.G.bannerText,/生命 \+30/);
  take(e,'healPill');assert.equal(e.G.p.hp,100);assert.match(e.G.bannerText,/生命 \+55/);
  assert.equal(e.G.p.weapon,'laser');assert.ok(e.G.p.magic.arms);assert.deepEqual(Array.from(e.G.inv),inv);
  const airborne={x:e.G.p.x,y:e.G.p.y-5,kind:'healPeach',fromPod:true,landed:false};e.G.p.hp=30;e.G.items=[airborne];e.collide();assert.equal(e.G.p.hp,30);
  airborne.landed=true;e.collide();assert.equal(e.G.p.hp,60);
});

test('静止补血掉落缺失或残留未落地标记也能拾取，只结算一次，更新时补齐落地状态',()=>{
  for(const landed of [undefined,false]){
    const e=powerScene();e.G.p.hp=20;
    const item={x:300,y:144,vx:0,vy:0,kind:'healPill',fromPod:true,rest:true,landed};e.G.items=[item];
    const score=e.G.score;e.collide();assert.equal(item.dead,true);assert.equal(e.G.p.hp,80);assert.equal(e.G.score,score+200);
    e.collide();assert.equal(e.G.p.hp,80);assert.equal(e.G.score,score+200);
    const resting={...item,x:360,dead:false,landed:false};e.G.items=[resting];tick(e,1);
    assert.equal(resting.landed,true);assert.equal(resting.rest,true);assert.equal(resting.y,144);
  }
});

test('补血物按可见身体近处接触拾取，远处、上层与尚未落地的物品不误收，原版范围保持',()=>{
  for(const kind of ['healPill','healPeach']){
    const e=powerScene();e.G.p.hp=10;
    const near={x:317,y:144,kind,fromPod:true,rest:true,landed:true};e.G.items=[near];e.collide();
    assert.equal(near.dead,true);assert.equal(e.G.p.hp,kind==='healPill'?70:40);
    const outside={x:322,y:144,kind,fromPod:true,rest:true,landed:true},upper={...outside,x:300,y:108},falling={...outside,x:300,rest:false,landed:false};
    e.G.items=[outside,upper,falling];const hp=e.G.p.hp;e.collide();assert.equal(e.G.p.hp,hp);assert.ok(e.G.items.every(it=>!it.dead));
  }
  const original=engine(false);quiet(original);Object.assign(original.G.p,{x:300,y:144,onGround:true});
  const item={x:317,y:144,kind:'M',fromPod:true,rest:true,landed:true};original.G.items=[item];original.collide();assert.equal(item.dead,undefined);
  item.x=300;original.collide();assert.equal(item.dead,true);assert.equal(original.G.p.weapon,'machine');
});

test('真实仙女掉落金丹落地后，走近即可回血并移除道具，不需要踩到道具中心',()=>{
  const e=powerScene(),fairy={x:300,y:95,y0:95,t:0,kind:'healPill',fairy:true};e.G.pods=[fairy];
  Object.assign(e.G.p,{x:285,y:114,onGround:false,hp:20,staff:{kind:'sweep',variant:'thrust',t:.16,duration:.32,face:1,combo:1,hits:[]}});
  e.collide();assert.equal(fairy.flee,true);const item=e.G.items[0];assert.equal(item.kind,'healPill');assert.equal(item.landed,false);
  Object.assign(e.G.p,{x:250,y:144,onGround:true,staff:null});tick(e,60);assert.equal(item.rest,true);assert.equal(item.y,144);
  for(let i=0;i<40&&!item.dead;i++)tick(e,1,{KeyD:true});
  assert.equal(item.dead,true);assert.equal(e.G.p.hp,80);assert.ok(item.x-e.G.p.x>11,'身体靠近即可收取，无需进入原来的细窄判定');
  assert.equal(e.G.items.length,0);assert.match(e.G.bannerText,/九转金丹.*生命 \+60/);
});

test('二号玩家身体靠近金丹时只为自己补血，死亡或进入出口的玩家不收取',()=>{
  const e=engine();e.coop.playing=true;e.reset(1);quiet(e);Object.assign(e.G.p,{x:100,y:144,hp:70});
  Object.assign(e.G.p2,{x:300,y:144,onGround:true,hp:10});
  const item={x:317,y:144,kind:'healPill',fromPod:true,rest:true,landed:false};e.G.items=[item];e.collide();
  assert.equal(item.dead,true);assert.equal(e.G.p2.hp,70);assert.equal(e.G.p.hp,70);
  for(const state of [{dead:true},{dead:false,enteringExit:{t:0}}]){
    Object.assign(e.G.p2,state);const ignored={...item,dead:false};e.G.items=[ignored];e.collide();assert.equal(ignored.dead,false);
  }
});

test('新增补血供给走原携桃仙女排程，仙女被棍击后飞走再掉落，普通魂斗罗不产生补血物',()=>{
  const e=engine(),original=engine(false);
  assert.equal(e.G.podTrig.filter(t=>HEALING_ITEMS[t.kind]).length,HEALING_DROPS.length);
  assert.equal(original.G.podTrig.filter(t=>HEALING_ITEMS[t.kind]).length,0);
  quiet(e);e.G.podTrig=[{at:0,y0:90,kind:'healPeach',done:false}];tick(e,125);
  const fairy=e.G.pods[0];assert.equal(fairy.fairy,true);
  Object.assign(e.G.p,{x:fairy.x-15,y:fairy.y+19,onGround:false,face:1,staff:{kind:'sweep',variant:'thrust',t:.16,duration:.32,face:1,combo:1,hits:[]}});
  e.collide();assert.equal(fairy.flee,true);assert.equal(e.G.items[0].kind,'healPeach');assert.equal(e.G.items[0].landed,false);
});

test('被打后的实际位移走墙体碰撞，硬直打断攻击，轻重命中具有不同停顿与受击效果',()=>{
  const e=powerScene();e.G.p.invT=0;e.G.p.staff={kind:'sweep'};
  e.solids.push({x:280,y:100,w:8,h:50,g:1});e.killPlayer(false,{damage:12,face:-1});
  assert.equal(e.G.p.staff,null);assert.ok(e.G.hitStop>=.04);assert.ok(e.G.fx.some(f=>f.k==='martialImpact'&&f.player));
  const x=e.G.p.x;tick(e,8,{KeyD:true,KeyJ:true});assert.ok(e.G.p.x<x&&e.G.p.x>=293);assert.equal(e.G.p.staff,null);
  e.G.p.invT=0;e.killPlayer(false,{damage:WUKONG_HEALTH.boss,heavy:true,face:1});assert.equal(e.G.p.hp,66);assert.ok(e.G.hitStop>=.065);assert.ok(e.G.p.vy<0);
});

test('天兵真实受击硬直会后退，阵亡保留完整倒地效果并经过平台落地，分数只结算一次',()=>{
  const e=powerScene();e.G.freezeT=0;const foe=target(325,144,2);foe.on=true;e.G.en=[foe];
  e.G.p.staff={kind:'sweep',variant:'fullSwing',t:.22,duration:.4,face:1,combo:3,aim:0,hits:[]};e.collide();
  assert.equal(foe.dead,true);assert.ok(e.G.fx.some(f=>f.k==='guardDefeat'));assert.ok(e.G.hitStop>=.075);
  const score=e.G.score;e.collide();assert.equal(e.G.score,score);tick(e,50);
  const body=e.G.fx.find(f=>f.k==='guardDefeat');assert.ok(body?.landed);assert.equal(body.y,144);assert.ok(body.landT>.1);
});

test('命中停顿只暂停第一关模拟并缓存跳跃边沿，暂停菜单仍立即响应，后续关和原版不受影响',()=>{
  const e=powerScene();const x=e.G.p.x,time=e.G.time;e.G.hitStop=.065;e.K.KeyK=true;e.step();e.K.KeyK=false;
  assert.equal(e.G.time,time);assert.equal(e.G.p.x,x);assert.equal(e.G.p.onGround,true);
  for(let i=0;i<5;i++)e.step();assert.equal(e.G.p.onGround,false);assert.ok(e.G.p.vy<0,'停顿中按跳跃仍执行');
  e.G.hitStop=.07;e.K.Escape=true;e.step();assert.equal(e.G.mode,'pause');
  for(const entry of [[false,1],[true,3]]){const original=engine(entry[0]);original.reset(entry[1]);original.G.hitStop=1;const t=original.G.t;original.step();assert.ok(original.G.t>t);}
});

test('双人分别有气血与受击状态，拾取补血只恢复拾取者，快照保留生命与受击目标引用',()=>{
  const e=engine();e.coop.playing=true;e.reset(1);quiet(e);e.G.freezeT=0;
  Object.assign(e.G.p2,{x:300,y:144,onGround:true,invT:0});e.G.en=[guard()];tick(e,34);
  assert.equal(e.G.p.hp,100);assert.equal(e.G.p2.hp,88);take(e,'healPeach',e.G.p2);
  assert.equal(e.G.p2.hp,100);assert.equal(e.G.p.hp,100);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.p2.maxHp,100);assert.equal(world.en[0].melee.hits[0],world.p2);
});

test('巨灵神受重棍会短暂后仰和退步，冷却避免被连续锁死，空中攻击保持原着地轨迹',()=>{
  const e=giantDuel(),g=e.G.boss.giant;g.attack=null;g.onGround=true;g.poiseCooldown=0;
  const core=e.G.boss.parts[2],x=g.x;e.hitPart(core,3,{k:'staff',heavy:true,vx:1});assert.ok(g.hurt);assert.equal(core.hp,57);
  tick(e,8);assert.ok(g.x>x);assert.ok(g.hurt);const t=g.hurt.t;e.hitPart(core,3,{k:'staff',heavy:true,vx:1});assert.equal(g.hurt.t,t);
  tick(e,18);assert.equal(g.hurt,null);g.onGround=false;g.poiseCooldown=0;e.hitPart(core,3,{k:'staff',heavy:true,vx:1});assert.equal(g.hurt,null);
});

test('真实空中下键无需攻击就举棍下劈，下降落地有收招与冲击，持下不会一落地就压扁',()=>{
  const e=powerScene();tick(e,10,{KeyK:true});assert.equal(e.G.p.onGround,false);
  tick(e,1,{KeyS:true});const action=e.G.p.staff;assert.equal(action.kind,'slam');assert.equal(action.variant,'airCleave');
  assert.match(wholeHeroFrame(e.G.p).frame.id,/^cleave:/);
  let landing=false;for(let i=0;i<35;i++){
    tick(e,1,{KeyS:true});landing||=e.G.fx.some(f=>f.k==='slamLand');
    if(e.G.p.onGround&&e.G.p.staff===action)assert.equal(e.G.p.prone,false);
  }
  assert.ok(landing);assert.equal(e.G.p.y,144);assert.equal(e.G.p.onGround,true);assert.equal(e.G.pb.length,0);
});

test('真实长按J半秒松开发出棍气，蓄力期间不连射，短按仍是完整随机棍招',()=>{
  const e=powerScene();tick(e,3,{KeyJ:true});const melee=e.G.p.staff;tick(e,1);assert.equal(e.G.p.staff,melee);assert.equal(e.G.p.staffWaves,undefined);
  tick(e,60);tick(e,36,{KeyJ:true});assert.equal(e.G.p.staffCharge.ready,true);assert.equal(e.G.p.staff,null);assert.equal(e.G.p.staffWaves,undefined);
  tick(e,1);assert.equal(e.G.p.staff.kind,'qiCast');assert.equal(e.G.p.staffWaves.length,1);assert.equal(e.G.p.staffWaves[0].damage,4);
  assert.equal(e.G.pb.length,0);tick(e,10);assert.equal(e.G.p.staffWaves.length,1);
});

test('真实满蓄棍气能远程伤害天兵并被地形墙阻挡，发射不使用步枪弹丸',()=>{
  for(const blocked of [false,true]){
    const e=powerScene(),near=target(342,144,24),far=target(450,144,24);e.G.en=[near,far];
    if(blocked)e.solids.push({x:370,y:70,w:8,h:100,g:1});
    tick(e,80,{KeyJ:true});assert.equal(e.G.p.staffCharge.full,true);const before=far.hp;
    tick(e,1);const wave=e.G.p.staffWaves[0];assert.equal(wave.strength,2);assert.equal(wave.damage,7);
    let burst=false;for(let i=0;i<40;i++){tick(e,1);burst||=e.G.fx.some(f=>f.k==='qiBurst');}
    assert.equal(far.hp,blocked?before:before-7);assert.equal(e.G.pb.length,0);assert.ok(burst);
  }
});

test('被打断和暂停后松开J不会偷发蓄力波，恢复后可以重新聚气',()=>{
  const e=powerScene();tick(e,45,{KeyJ:true});e.G.p.invT=0;e.killPlayer(false,{damage:12});assert.equal(e.G.p.staffCharge,null);
  tick(e,24);assert.equal(e.G.p.staffWaves,undefined);tick(e,45,{KeyJ:true});assert.equal(e.G.p.staffCharge.ready,true);
  tick(e,1,{Escape:true});assert.equal(e.G.mode,'pause');assert.equal(e.G.p.staffCharge,null);assert.equal(e.G.p.staffWaves,undefined);
});

test('二号玩家独立蓄力和发射，棍气不消耗道具，快照保留发射者及目标命中引用',()=>{
  const e=engine();e.coop.playing=true;e.reset(1);quiet(e);Object.assign(e.G.p2,{x:300,y:144,onGround:true,invT:999});
  e.G.en=[target(340,144,24)];const inventory=Array.from(e.G.inv2);
  for(let i=0;i<40;i++)e.updatePartner({fire:true,fireEdge:i===0});assert.equal(e.G.p2.staffCharge.ready,true);assert.equal(e.G.p.staffCharge,undefined);
  e.updatePartner({fire:false});for(let i=0;i<15;i++){e.updatePartner({});e.collide();}
  assert.ok(e.G.en[0].hp<=20);assert.equal(e.G.p2.staffWaves[0].owner,2);assert.deepEqual(Array.from(e.G.inv2),inventory);
  const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.p2.staffWaves[0].hits[0],world.en[0]);assert.equal(world.p.staffWaves,undefined);
});

test('蓄力进度和气刃绘制不改变游戏数据，地面下键仍伏地，普通魂斗罗输入保持射击',()=>{
  const e=powerScene();tick(e,80,{KeyJ:true});const before=snapshot(e);e.render();e.render();assert.deepEqual(snapshot(e),before);
  tick(e,1);const cast=snapshot(e);e.render();assert.deepEqual(snapshot(e),cast);
  const crouch=powerScene();tick(crouch,1,{KeyS:true});assert.equal(crouch.G.p.prone,true);assert.equal(crouch.G.p.staff,undefined);
  const original=engine(false);quiet(original);tick(original,50,{KeyJ:true});assert.equal(original.G.p.staffCharge,undefined);assert.ok(original.G.pb.length>0);
});

test('击中身体有接触爆点、交叉弧光与粒子，非致命命中不触发惨叫，致命同一对象只叫一次',()=>{
  const e=powerScene(),foe=target(330,144,4);e.G.en=[foe];
  e.G.p.staff={kind:'sweep',variant:'fullSwing',t:.22,duration:.4,face:1,combo:1,aim:0,hits:[]};e.collide();
  const hit=e.G.fx.find(f=>f.k==='martialImpact');assert.ok(hit);assert.equal(hit.killed,false);assert.ok(Number.isFinite(hit.angle));assert.ok(hit.life>=.28);
  assert.equal(e.G.fx.filter(f=>f.k==='enemyCry').length,0);assert.equal(foe.hp,2);
  e.G.p.staff={kind:'smash',variant:'fullSwing',t:.22,duration:.4,face:1,combo:3,aim:0,hits:[]};e.collide();
  assert.equal(foe.dead,true);assert.equal(e.G.fx.filter(f=>f.k==='enemyCry').length,1);assert.ok(e.G.fx.some(f=>f.k==='martialImpact'&&f.killed));
  e.collide();e.killEnemy(foe);assert.equal(e.G.fx.filter(f=>f.k==='enemyCry').length,1);
  const before=snapshot(e);e.render();assert.deepEqual(snapshot(e),before);
});
test('天兵守卫飞兵阵亡产生可同步的人声事件，金属机关不惨叫，原版魂斗罗保持原音效流程',()=>{
  const e=powerScene();for(const [i,t]of ['run','snp','fly','tur','box'].entries())e.killEnemy({t,x:330+i*10,y:144,hp:0,face:-1,item:'M'});
  const cries=e.G.fx.filter(f=>f.k==='enemyCry');assert.equal(cries.length,3);assert.deepEqual(Array.from(cries,f=>f.voice),['guard','guard','fly']);
  assert.equal(new Set(cries.map(f=>f.id)).size,3);const [world]=imports.unpackWorld(imports.packWorld([e.G]));assert.equal(world.fx.filter(f=>f.k==='enemyCry').length,3);
  const original=engine(false);original.killEnemy({t:'snp',x:330,y:144,hp:0});assert.equal(original.G.fx.some(f=>f.k==='enemyCry'),false);
});
test('满蓄棍气击败目标时同时出现重击爆点与一次惨叫，巨灵神败下使用较低的人声音色',()=>{
  const e=powerScene();e.G.en=[target(450,144,6)];tick(e,80,{KeyJ:true});tick(e,1);tick(e,40);
  assert.equal(e.G.fx.filter(f=>f.k==='enemyCry').length,1);assert.equal(e.G.fx.find(f=>f.k==='enemyCry').voice,'guard');
  const boss=giantDuel(),core=boss.G.boss.parts[2];boss.hitPart(core,99,{k:'staffWave',heavy:true,vx:1,x:core.x-20,y:core.y-10});
  const contact=boss.G.fx.find(f=>f.k==='martialImpact');assert.equal(contact.x,core.x);assert.equal(contact.y,core.y);assert.equal(contact.weapon,'staffWave');
  assert.equal(boss.G.boss.dead,false);assert.equal(boss.G.fx.filter(f=>f.k==='enemyCry').length,0);
  prepareGiantFinale(boss);tick(boss,577);
  assert.equal(boss.G.boss.dead,true);assert.equal(boss.G.fx.filter(f=>f.k==='enemyCry'&&f.voice==='giant').length,1);
  boss.hitPart(boss.G.boss.parts[2],99);assert.equal(boss.G.fx.filter(f=>f.k==='enemyCry').length,1);
});

test('悟空手柄首连、断开与重连不会被缺失的提示元素中断，仍可移动和挥棍',()=>{
  let pads=[];const e=engine(true,{getGamepads:()=>pads,hideGamepadIndicator:true});quiet(e);
  const pad=(buttons=[],axes=[0,0])=>({index:0,id:'Xbox Wireless Controller',mapping:'standard',connected:true,axes,
    buttons:Array.from({length:17},(_,i)=>({pressed:buttons.includes(i),value:buttons.includes(i)?1:0}))});
  const x=e.G.p.x;pads=[pad([2],[.8,0])];tick(e,4);
  assert.equal(e.inspect().gamepad.status,'connected');assert.ok(e.G.p.x>x);assert.ok(e.G.p.staff);
  pads=[];tick(e,1);assert.equal(e.inspect().gamepad.status,'waiting');assert.equal(e.G.p.vx,0);
  pads=[pad([],[0,0])];tick(e,1);assert.equal(e.inspect().gamepad.status,'connected');assert.equal(e.G.mode,'play');
});

test('真实键盘方向组合指定整帧棍招，下攻后按住下仍播放扫棍而非伏地',()=>{
  for(const [keys,command]of [[{KeyD:true},'travelSweep'],[{KeyW:true},'lift'],[{KeyS:true},'low'],
    [{ArrowLeft:true,ArrowUp:true},'wheel'],[{ArrowRight:true,ArrowDown:true},'sweep']]){
    const e=powerScene();tick(e,3,{...keys,KeyJ:true});assert.equal(e.G.p.staff.command,command);
    tick(e,4,keys);assert.equal(e.G.p.prone,false);assert.match(wholeHeroFrame(e.G.p).clip,/^(run|attack):/);
    assert.equal(e.inspect().players[0].staff.command,command);assert.equal(e.G.pb.length,0);
  }
  const e=powerScene();tick(e,3,{KeyS:true});tick(e,2,{KeyS:true,KeyD:true});tick(e,1,{KeyD:true,KeyJ:true});
  assert.equal(e.G.p.staff.command,'flower');assert.equal(e.G.p.staff.variant,'lotusChain');
});

test('手柄摇杆和方向键加攻击与键盘共用指定棍招，X键攻击别名有效，原版仍发子弹',()=>{
  for(const dpad of [false,true]){
    const buttons=dpad?[2,12,15]:[2];
    const pad={index:0,id:'Xbox Wireless Controller',mapping:'standard',connected:true,axes:dpad?[0,0]:[.8,-.8],
      buttons:Array.from({length:17},(_,i)=>({pressed:buttons.includes(i),value:buttons.includes(i)?1:0}))};
    const e=engine(true,{getGamepads:()=>[pad]});quiet(e);assert.equal(e.G.p.staff.command,'wheel');
  }
  const alias=powerScene();tick(alias,1,{KeyA:true,KeyX:true});assert.equal(alias.G.p.staff.command,'travelSweep');assert.equal(alias.G.p.staff.face,-1);
  const contra=engine(false);quiet(contra);tick(contra,5,{KeyD:true,KeyJ:true});assert.equal(contra.G.p.staff,undefined);assert.ok(contra.G.pb.length>0);
});



test('悟空第二关保持棍战与双向镜头，门前上方向进入，持续按住不会往返误触',()=>{
  const e=engine();e.reset(2);e.G.freezeT=0;e.siegeRoom('hub',600);e.G.mode='play';
  const camera=e.G.camX;tick(e,110,{KeyA:true});assert.ok(e.G.camX<camera);assert.ok(e.G.p.x<460);assert.equal(e.G.base,undefined);
  Object.assign(e.G.p,{x:235,y:176,onGround:true,staff:null});tick(e,1);tick(e,50,{KeyW:true});
  assert.equal(e.G.siege.room,'wind');assert.equal(e.inspect().combat,'staff');assert.equal(e.G.pb.length,0);
});
test('弩台拨杆与释放扣由真实棍身命中，首关战斗资源可以延续到南天门',()=>{
  const e=engine();e.reset(2);e.siegeRoom('wind');e.G.freezeT=0;e.G.en=[];tick(e,1);assert.equal(e.G.siege.captured,true);
  const swing=x=>{Object.assign(e.G.p,{x,y:176,onGround:true,staff:null,cool:0,staffVariantBag:['cross'],invT:999});tick(e,1);tick(e,1,{KeyJ:true});tick(e,25);};
  swing(825);assert.equal(e.G.siege.aim,1);swing(920);tick(e,50);
  assert.deepEqual(Array.from(e.G.siege.cleared),['wind']);assert.equal(e.G.siege.checkpoint,'hub');assert.equal(e.G.pb.length,0);
});
test('雷阵三枚雷珠可以通过实际普通棍招回击，失败后已命中次数保留',()=>{
  const e=engine();e.reset(2);e.siegeRoom('thunder',520);e.G.freezeT=0;e.G.en=[];e.G.p.invT=999;
  for(let i=0;i<3600&&!e.G.siege.cleared.includes('thunder');i++)tick(e,1,nextMeleeInput(e));
  assert.ok(e.G.siege.cleared.includes('thunder'),'hits='+e.G.siege.returnHits);assert.equal(e.G.pb.length,0);
});
test('力阵上下两锁与悬锤都由实际棍击触发，任意两阵后才能击断主门',()=>{
  const e=engine();e.reset(2);e.siegeRoom('armor');e.G.freezeT=0;e.G.en=[];
  const swing=(x,y)=>{Object.assign(e.G.p,{x,y,onGround:true,staff:null,cool:0,staffVariantBag:['cross'],invT:999});tick(e,1);tick(e,1,{KeyJ:true});tick(e,25);};
  for(let i=0;i<3;i++)swing(575,120);assert.equal(e.G.siege.devices[0].hp,0);
  for(let i=0;i<3;i++)swing(795,176);assert.equal(e.G.siege.devices[1].hp,0);
  swing(955,176);tick(e,70);assert.ok(e.G.siege.cleared.includes('armor'));
  e.G.siege.cleared.push('wind');e.siegeRoom('gate',215);
  for(let i=0;i<6&&!e.G.siege.gateOpen;i++)swing(215,176);
  assert.equal(e.G.siege.gateOpen,true);assert.ok(e.solids.find(q=>q.siegeGate).gone);
});
test('第二关死亡与继续保留已破阵眼，双人单人复活不会重置队友的房间',()=>{
  const e=engine();e.reset(2);e.siegeRoom('thunder',300);e.G.freezeT=0;e.G.en=[];e.G.siege.cleared=['wind'];
  e.killPlayer(true);for(let i=0;i<300&&e.G.p.dead;i++)tick(e,1);assert.equal(e.G.p.dead,false);assert.equal(e.G.p.hp,100);assert.deepEqual(Array.from(e.G.siege.cleared),['wind']);
  e.G.lives=0;e.G.mode='over';e.continueGame();assert.equal(e.G.mode,'play');assert.deepEqual(Array.from(e.G.siege.cleared),['wind']);
  const duo=engine();duo.coop.playing=true;duo.reset(2);duo.siegeRoom('hub');duo.G.freezeT=0;const epoch=duo.G.siege.epoch;
  duo.hurtPartner(true);tick(duo,240);assert.equal(duo.G.p2.dead,false);assert.equal(duo.G.p2.pid,2);assert.equal(duo.G.siege.epoch,epoch);assert.equal(duo.G.p.dead,false);
});
test('南天门完整画面绘制不改房间、机关、玩家或首领时序，天王败退后从内门完成第二章',()=>{
  const e=engine();e.reset(2);e.G.siege.cleared=['wind','armor'];e.G.siege.gateOpen=true;e.siegeRoom('boss',580);e.G.freezeT=0;
  e.G.mode='pause';const before=snapshot(e);e.render();e.render();assert.deepEqual(snapshot(e),before);
  e.G.mode='play';e.hitPart(e.G.boss.parts[2],999,{k:'staff',owner:1,heavy:true});tick(e,150);assert.equal(e.G.boss.dead,true);
  Object.assign(e.G.p,{x:728,y:176,onGround:true,staff:null});tick(e,1);tick(e,20,{KeyW:true});assert.equal(e.G.mode,'clear');assert.equal(e.G.stage,2);
});
