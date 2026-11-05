import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HERO_ATLASES} from '../../games/wukong/js/wukong-hero-atlas.mjs';
import {HERO_WHOLE_ASSETS,HERO_IDLE_PERIOD,HERO_STAFF_LENGTH,HERO_STAFF_FAMILIES,advanceHeroAnimation,wholeHeroFrame,wholeHeroPose} from '../../games/wukong/js/wukong-hero-frames.mjs';
import {composeWholeHeroFrame,prepareHeroAtlas} from '../../games/wukong/js/wukong-hero-sprites.mjs';
import {STAFF_VARIANTS,staffGeometry,staffCopies,advanceStaff,resolveStaff} from '../../games/wukong/js/wukong-combat.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';
import {drawPowerStaff} from '../../games/wukong/js/wukong-power-art.mjs';
import {WukongSkin} from '../../games/wukong/js/wukong-game.mjs';
import {actorRootY} from '../../games/wukong/js/wukong-mount.mjs';
import {staffExtension} from '../../games/wukong/js/wukong-staff-extension.mjs';

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const actor=(values={})=>({heroFrames:true,pid:1,x:150,y:112,face:1,onGround:true,vx:0,vy:0,weapon:'rifle',ax:1,ay:0,cool:0,
  heroAnimation:{clock:0,run:0,prone:0,land:0,ground:true},...values});
const attack=(variant,phase=.5,values={})=>actor({staff:{kind:'sweep',variant,t:phase*.4,duration:.4,combo:1,face:1,weapon:'rifle',hits:[]},...values});

test('十六张透明压缩图包含352个完整动作，三套视频连招各有64帧，骑乘帧仍为完整人物',()=>{
  assert.equal(Object.keys(HERO_WHOLE_ASSETS).length,16);
  const all=Object.values(HERO_ATLASES).flatMap(a=>a.frames);assert.equal(all.length,352);assert.equal(new Set(all.map(f=>f.id)).size,352);
  assert.equal(HERO_ATLASES.reference.frames.length,64);assert.equal(HERO_ATLASES.reference.isolatedCells,true);
  assert.equal(HERO_ATLASES.reference2.frames.length,64);assert.equal(HERO_ATLASES.reference2.isolatedCells,true);
  assert.equal(HERO_ATLASES.reference3.frames.length,64);assert.equal(HERO_ATLASES.reference3.isolatedCells,true);
  for(const [name,a]of Object.entries(HERO_ATLASES)){
    const webp=fs.readFileSync(new URL('../..'+HERO_WHOLE_ASSETS[a.key],import.meta.url));
    assert.equal(webp.toString('ascii',0,4),'RIFF');assert.equal(webp.toString('ascii',8,12),'WEBP');
    assert.ok(fs.existsSync(new URL(`../../games/wukong/assets/hero-whole-${name}.png`,import.meta.url)));
    for(const f of a.frames){
      assert.equal(f.sheet,a.key);assert.ok(f.scale>0&&f.scale<1);
      for(const key of ['anchor','airAnchor','origin','tip','butt','pick'])assert.ok(f[key].every(Number.isFinite));
      assert.ok(Math.hypot(f.tip[0]-f.butt[0],f.tip[1]-f.butt[1])*f.scale>20);
    }
  }
});

test('待机八帧随世界时钟持续播放，跑动八帧按位移循环，后退反向播放而不更换身体比例',()=>{
  const idle=[],run=[],retreat=[];
  for(let i=0;i<8;i++){
    const p=actor();p.heroAnimation.clock=(i+.1)/8*HERO_IDLE_PERIOD;idle.push(wholeHeroFrame(p).frame.index);
    p.vx=90;p.heroAnimation.run=(i+.1)/8;run.push(wholeHeroFrame(p).frame.index);
    p.vx=-90;retreat.push(wholeHeroFrame(p).frame.index);
  }
  assert.deepEqual(idle,[0,1,2,3,4,5,6,7]);assert.deepEqual(run,[8,9,10,11,12,13,14,15]);
  assert.deepEqual(retreat,[15,14,13,12,11,10,9,8]);
});

test('起跳、上升、顶点、落下、落地缓冲、伏地和骑乘分别选择完整姿势，采样不写入玩家',()=>{
  for(const [vy,index]of [[-270,0],[-200,1],[-90,2],[0,3],[150,4]]){
    const p=actor({onGround:false,vy}),before=JSON.stringify(p),s=wholeHeroFrame(p);
    assert.equal(s.frame.id,'mobility:'+index);assert.equal(s.air,true);assert.equal(JSON.stringify(p),before);
  }
  const p=actor({onGround:false});advanceHeroAnimation(p,1/60);p.onGround=true;advanceHeroAnimation(p,1/60);
  assert.equal(wholeHeroFrame(p).clip,'land');assert.equal(wholeHeroFrame(p).frame.id,'mobility:5');
  p.prone=true;for(let i=0;i<12;i++)advanceHeroAnimation(p,1/60);assert.equal(wholeHeroFrame(p).clip,'prone');
  p.prone=false;for(let i=0;i<12;i++)advanceHeroAnimation(p,1/60);assert.equal(wholeHeroFrame(p).clip,'idle');
  assert.equal(wholeHeroFrame(actor({ride:'moto'})).frame.id,'qilin:0');
  assert.equal(wholeHeroFrame(actor({ride:'heli',onGround:false})).clip,'cloudIdle');
});

test('随机棍法包含前抡立舞花云棍和三段花棍，走动和空中有完整序列，起收势一致',()=>{
  const sheets=new Set();
  for(const variant of STAFF_VARIANTS){
    const p=attack(variant),before=JSON.stringify(p),ids=new Set();
    for(let i=0;i<=30;i++){const s=wholeHeroFrame(p,i/30*.4);sheets.add(s.frame.id.split(':')[0]);ids.add(s.frame.id);}
    assert.ok(ids.size>=6,variant);assert.equal(wholeHeroFrame(p,0).frame.id,wholeHeroFrame(p,.4).frame.id);
    assert.equal(JSON.stringify(p),before);
  }
  assert.deepEqual([...sheets].sort(),['advance','blossom','cleave','cyclone','extra','flower','low','martial','movement','reference','reference2','reference3','sweep','uppercut']);
  for(const variant of ['cross','overhead','figureEight'])assert.ok(wholeHeroFrame(attack(variant,.5,{vx:90})).frame.index>=8);
  const air=attack('airWheel',.5,{onGround:false});air.staff.kind='spin';assert.match(wholeHeroFrame(air).frame.id,/uppercut:(?:8|9|1[0-5])/);
  const faster=attack('cross');faster.staff.t=.1;faster.staff.duration=.2;
  assert.equal(wholeHeroFrame(faster).frame.id,wholeHeroFrame(attack('cross')).frame.id);
});

test('显示棍身与命中使用同一帧标定，左右朝向巨大化与长棍保持握点，三棍和大招仍生效',()=>{
  for(const face of [-1,1])for(const giantT of [0,2])for(const variant of STAFF_VARIANTS){
    const p=attack(variant,.5,{face,giantT});p.staff.face=face;const before=JSON.stringify(p),q=wholeHeroPose(p),f=q.frame,size=giantT?2:1;
    close(q.origin.x,p.x+face*(f.origin[0]-q.anchor[0])*f.scale*size);
    close(q.origin.y,p.y+(f.origin[1]-q.anchor[1])*f.scale*size*q.stretch);
    assert.deepEqual(staffGeometry(p),q);
    close(q.reach+q.rear,HERO_STAFF_LENGTH*size);
    for(const key of ['tip','butt']){
      const d={x:q[key].x-q.origin.x,y:q[key].y-q.origin.y},b={x:q.painted[key].x-q.origin.x,y:q.painted[key].y-q.origin.y};
      close(d.x*b.y-d.y*b.x,0);assert.ok(d.x*b.x+d.y*b.y>0);
    }
    p.staff.weapon='laser';const long=staffGeometry(p);close(long.reach+long.rear,(q.reach+q.rear)*staffExtension(p).scale);close(long.rear,q.rear);
    assert.deepEqual(long.origin,q.origin);p.staff.weapon='spread';assert.equal(staffCopies(p).length,3);
    p.staff.weapon='rifle';assert.equal(JSON.stringify(p),before);
  }
  const p=attack('whirlwind');p.staff.kind='ultimate';assert.ok(staffGeometry(p).effectReach>80);
});

test('普通棍及长棍均只绘制一张完整金箍棒贴图，不再拼接前段或重复端帽',()=>{
  for(const weapon of ['rifle','laser']){
    const draws=[],moves=[],art={images:{ruyiStaff:{naturalWidth:1024,naturalHeight:341}},scale:3,state:{time:1},
      g:{save(){},restore(){},translate(...a){moves.push(a);},rotate(){},drawImage(...a){draws.push(a);}},line(){assert.fail('完整贴图无需额外补画棍头');}};
    const p=actor({weapon}),q=wholeHeroPose(p);drawPowerStaff(art,p,q,1,{paintedBase:q.painted});
    assert.equal(draws.length,1);assert.deepEqual(moves[0],[q.butt.x,q.butt.y]);close(draws[0][7],q.reach+q.rear);
  }
});

test('随机连续出招避开最近两种画面族，视频动作都能随机选到且攻速强化仍缩短完整招式',()=>{
  const families=new Set(),p=actor(),recent=[];let seed=73;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<80;i++){
    p.cool=0;p.staff=null;assert.equal(advanceStaff(p,{fire:true},1/60,{random}),true);
    const family=HERO_STAFF_FAMILIES[p.staff.variant];assert.ok(!recent.slice(-2).includes(family));families.add(family);recent.push(family);
  }
  for(const name of ['advance','blossom','cyclone','cloudDragonFlow','skyPiercingFlow','dragonPiercingFlow'])assert.ok(families.has(name));
  const [restored]=unpackWorld(packWorld([p]));
  assert.deepEqual(restored.staffVariantBag,p.staffVariantBag);assert.deepEqual(restored.staffRecentFamilies,p.staffRecentFamilies);
  for(const next of [p,restored]){next.staff=null;next.cool=0;advanceStaff(next,{fire:true},0,{random:()=>.18});}
  assert.equal(restored.staff.variant,p.staff.variant,'联机恢复继续相同的随机候选队列');
  for(const weapon of ['rifle','machine']){
    const p=actor({weapon,staffVariantBag:['sweepingFinish']});advanceStaff(p,{fire:true},1/60,{random:()=>.99});assert.equal(p.staff.variant,'sweepingFinish');
    close(p.staff.duration,.86*(weapon==='machine'?1/1.7:1));
  }
});

test('向前大抡发力时可击中身前近60单位的目标，远处目标与实心墙后目标不受伤',()=>{
  const p=attack('fullSwing',.56),q=wholeHeroPose(p);
  assert.ok(q.tip.x-p.x>55,'手臂和握把前送后，长棍要真正伸到身前');
  for(const blocked of [false,true]){
    p.staff.hits=[];const near={x:q.tip.x-3,y:q.tip.y-3,w:6,h:6,hp:10},far={x:q.tip.x+15,y:q.tip.y-3,w:6,h:6,hp:10};
    resolveStaff(p,{enemies:[near,far],pods:[],parts:[],solids:blocked?[{x:(p.x+near.x)/2,y:q.tip.y-35,w:3,h:70,g:1}]:[],enemyBox:e=>e,podBox:e=>e,damageEnemy(e,d){e.hp-=d;},popPod(){},hitPart(){}});
    assert.equal(near.hp,blocked?10:8);assert.equal(far.hp,10);
  }
});

test('整帧命中不会穿过实心墙，同一目标单招只受伤一次，仍不生成枪弹',()=>{
  for(const blocked of [false,true]){
    const p=attack('cross'),q=staffGeometry(p),x=q.origin.x+(q.tip.x-q.origin.x)*.7,y=q.origin.y+(q.tip.y-q.origin.y)*.7;
    const foe={x:x-2,y:y-2,w:4,h:4,hp:10},world={enemies:[foe],pods:[],parts:[],
      solids:blocked?[{x:(q.origin.x+x)/2-1,y:y-40,w:2,h:80,g:1}]:[],enemyBox:e=>e,podBox:e=>e,
      damageEnemy(e,d){e.hp-=d;},popPod(){},hitPart(){}};
    resolveStaff(p,world);resolveStaff(p,world);assert.equal(foe.hp,blocked?10:8);
  }
});

test('动画计时和联机恢复保留相同姿势，附加时钟不改变原坐标速度与跳跃数据',()=>{
  const p=actor({vx:90,airJumps:1}),physics=['x','y','vx','vy','onGround','airJumps'].map(k=>p[k]);
  for(let i=0;i<90;i++)advanceStaff(p,{fire:false},1/60);
  assert.deepEqual(['x','y','vx','vy','onGround','airJumps'].map(k=>p[k]),physics);
  const [restored]=unpackWorld(packWorld([p]));assert.deepEqual(wholeHeroPose(restored),wholeHeroPose(p));
});

test('预热后只提交完整人物图或完整人物间过渡，不会裁腰拼腿，重复绘制不修改玩家',()=>{
  const drawCalls=[],g={setTransform(){},clearRect(){},drawImage(...args){drawCalls.push(args[0]);}};
  const createCanvas=()=>({width:1,height:1,getContext:()=>g});
  const images=Object.fromEntries(Object.values(HERO_ATLASES).map(a=>[a.key,{naturalWidth:1024,naturalHeight:1024}]));
  const atlases=new Map(Object.values(HERO_ATLASES).map(a=>[a.key,{image:images[a.key],frames:new Map(a.frames.map(f=>[f.id,{canvas:{whole:f.id},x:-25,y:-42,w:60,h:42,wholeHero:true}]))}]));
  const host={images,heroSpriteAtlases:atlases,createCanvas};
  const hd={heroArt:host,cache:new Map(),movingFrames:new Map(),createCanvas,frame(){assert.fail('完整人物不能再裁切旧躯干或四肢');}};
  for(const state of [{},{vx:90},{prone:true,heroAnimation:{clock:1,prone:1}},{onGround:false,vy:-200},...STAFF_VARIANTS.map(v=>({staff:attack(v).staff}))]){
    const p=actor(state),before=JSON.stringify(p);drawCalls.length=0;
    for(let i=0;i<2;i++)assert.equal(composeWholeHeroFrame(hd,'red',p,3).wholeHero,true);
    assert.equal(JSON.stringify(p),before);assert.ok(drawCalls.every(c=>c.whole));
  }
});

test('骑姿的待机奔跑腾跃与攻击均取人兽一体帧，逻辑握点与实际绘制共用原地面根点',()=>{
  assert.equal(HERO_ATLASES.qilin.frames.length,12);
  assert.ok(HERO_ATLASES.qilin.frames.every(f=>f.includesMount));
  for(const face of [-1,1])for(const onGround of [true,false])for(const vx of [0,170])for(const phase of [null,.2,.4,.6,.8]){
    const p=actor({face,ride:'moto',vx,onGround,anim:.7,staff:phase===null?null:{...attack('cross',phase).staff,face}});
    const q=wholeHeroPose(p),before=JSON.stringify(p),rendered={...p,ride:null,beastRider:true,y:actorRootY(p),mountGroundY:p.y};
    assert.equal(q.includesMount,true);assert.match(q.frame.id,/^qilin:/);
    close(q.origin.y,p.y+(q.frame.origin[1]-q.anchor[1])*q.frame.scale);
    assert.deepEqual(wholeHeroPose(rendered),q);assert.equal(JSON.stringify(p),before);
  }
  assert.equal(wholeHeroFrame(actor({ride:'moto',onGround:false})).frame.id,'qilin:3');
});

test('完整骑乘图就绪时只画一次人兽组合，不再叠一只麒麟或调用蹲坐旧帧',()=>{
  const calls=[],gradient={addColorStop(){}},ctx=new Proxy({drawImage(...a){calls.push(a[0]);},measureText:()=>({width:1}),createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
  const createCanvas=()=>({width:10,height:10,getContext:()=>ctx});
  const art=new WukongSkin({createCanvas,imageFactory:()=>({}),autoLoad:false});art.g=ctx;art.state={time:1,t:60,camX:0,fx:[]};
  art.images.heroWholeQilin={naturalWidth:1024,naturalHeight:1536};art.images.celestialQilin={naturalWidth:1536,naturalHeight:1024};
  art.images.ruyiStaff={naturalWidth:1024,naturalHeight:341};
  const prepared=new Map(HERO_ATLASES.qilin.frames.map(f=>[f.id,{canvas:{width:10,height:10,getContext:()=>ctx,pair:f.id},x:-35,y:-48,w:70,h:48,wholeHero:true}]));
  art.heroSpriteAtlases=new Map([['heroWholeQilin',{image:art.images.heroWholeQilin,frames:prepared}]]);
  for(const phase of [null,.4,.6]){
    const p=actor({ride:'moto',staff:phase===null?null:attack('fullSwing',phase).staff}),before=JSON.stringify(p);calls.length=0;
    art.actor(p);assert.equal(calls.filter(c=>c?.pair).length,1);
    assert.equal(calls.includes(art.images.celestialQilin),false,'不能在组合图后又画一只坐骑');
    assert.equal(JSON.stringify(p),before);
  }
});

test('首屏图片尺寸已知但解码未完成时不读取空画布，避免图集定位异常中断游戏循环',()=>{
  const image={naturalWidth:1024,naturalHeight:1024};
  const host={images:{heroWholeMovement:image},loaded:new Set(),createCanvas(){assert.fail('解码前不能提取图集');}};
  assert.equal(prepareHeroAtlas(host,'heroWholeMovement'),null);
  const prepared={image,frames:new Map()};host.heroSpriteAtlases.set('heroWholeMovement',prepared);
  assert.equal(prepareHeroAtlas(host,'heroWholeMovement'),prepared,'已完成的缓存可以直接复用');
});
