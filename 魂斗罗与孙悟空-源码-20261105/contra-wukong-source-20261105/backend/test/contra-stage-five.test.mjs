import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isLocalStageFivePreview } from '../../games/contra2026/js/local-stage-preview.mjs';
import { OPEN_STAGES, isStageOpen, nextOpenStage } from '../../games/contra2026/js/release-stages.mjs';
import { StageFiveArt, snowGroundGroups, snowParticle, snowfallProfile, polarClouds, fighterFlyby, STAGE_FIVE_ASSETS, SNOW_LEDGE, WINTER_TANK } from '../../games/contra2026/js/stage-five-art.mjs';
import { createSnowDefenders, advanceSnowDefender, advanceSnowOrdnance, snowDefenderBox, createFlyingFortress, advanceFlyingFortress } from '../../games/contra2026/js/stage-five-combat.mjs';

test('第五关双人显示各自道具和冷却，热像标尺避开玩家二的右侧 HUD',()=>{
  for(const online of [false,true])for(const guest of [false,true]) {
    const draws=[],rects=[],gradients=[],gradient={addColorStop(){}};
    const art={g:{save(){},restore(){},createLinearGradient(...args){gradients.push(args);return gradient;}},
      rect(...args){rects.push(args);},hudText(){},playerHud(_G,p,options){draws.push({p,...options});}};
    const p={pid:1,thermT:8},p2={pid:2,thermT:0};
    const G={p,p2,score:0,inv:['g'],inv2:['f','m'],sel:0,sel2:1,nadeCd:0,nadeCd2:2,bannerT:0};
    StageFiveArt.prototype.hud.call(art,G,{online,guest,highScore:0,settings:{inf:'off'},players:online?[p,p2]:[p]});
    assert.equal(draws.length,online?2:1);
    assert.equal(draws[0].x,8);assert.equal(draws[0].inventory,G.inv);
    if(online){assert.equal(draws[1].p,p2);assert.equal(draws[1].x,248);assert.equal(draws[1].inventory,G.inv2);assert.equal(draws[1].selection,1);assert.equal(draws[1].cooldown,2);assert.equal(draws[1].local,guest);}
    const legend=rects.find(rect=>rect[2]===32&&rect[3]===3);
    assert.deepEqual(legend.slice(0,4),online?[176,35,32,3]:[342,8,32,3]);
    assert.deepEqual(gradients.at(-1),online?[176,0,208,0]:[342,0,374,0]);
  }
});

test('第五关正式开放，旧本地预览参数不再决定公开边界',()=>{
  for(const hostname of ['localhost','127.0.0.1','[::1]','::1','LOCALHOST'])assert.equal(isLocalStageFivePreview({hostname,search:'?preview=5'}),true);
  for(const hostname of ['games.tangletang.top','localhost.example.com','192.168.1.2',''])assert.equal(isLocalStageFivePreview({hostname,search:'?preview=5'}),false);
  for(const search of ['','?preview=6','?preview=05','?stage=5'])assert.equal(isLocalStageFivePreview({hostname:'localhost',search}),false);
  assert.deepEqual(OPEN_STAGES,[1,2,3,4,5,6,7,8]);assert.equal(isStageOpen(5),true);assert.equal(nextOpenStage(4),5);assert.equal(nextOpenStage(5),6);assert.equal(isStageOpen(6),true);assert.equal(nextOpenStage(6),7);assert.equal(isStageOpen(7),true);assert.equal(nextOpenStage(7),8);assert.equal(isStageOpen(8),true);assert.equal(isStageOpen(9),false);
});

test('雪地和相邻冰面共用完整岩壁，保留真正裂隙和不同高度，不改变物理平台',()=>{
  const slabs=[{x:0,y:176,w:520,g:1},{x:520,y:176,w:240,g:1,ice:1},{x:820,y:176,w:280,g:1},
    {x:1100,y:168,w:40,g:1},{x:500,y:90,w:80,g:0},{x:760,y:176,w:60,g:1,gone:true}];
  const original=JSON.stringify(slabs),joined=snowGroundGroups(slabs);
  assert.deepEqual(joined.map(s=>[s.x,s.y,s.w]),[[0,176,760],[820,176,280],[1100,168,40]]);
  assert.equal(JSON.stringify(slabs),original);
});

test('风雪按时间连续漂移、远近分层；强风加速横向移动，雪花大小与速度不一致',()=>{
  const particles=Array.from({length:40},(_,i)=>snowParticle(i,2,-25,true));
  assert.ok(new Set(particles.map(p=>p.length)).size>20);assert.ok(particles.every(p=>p.x>=-38&&p.x<422&&p.y>=-17&&p.y<233));
  const delta=(a,b)=>((b-a+690)%460)-230;
  for(let i=0;i<40;i++)assert.ok(Math.abs(delta(particles[i].x,snowParticle(i,2+1/60,-25,true).x))<2);
  assert.notDeepEqual(snowParticle(1,2,0),snowParticle(1,2,0,true));
  const calm=snowParticle(1,0,0,true),wind=snowParticle(1,1,-30,true),quiet=snowParticle(1,1,0,true);
  assert.ok(delta(calm.x,wind.x)<delta(calm.x,quiet.x));
  assert.ok(snowfallProfile(0).near>=130,'large flakes remain visible between gusts');
  assert.ok(snowfallProfile(1).near>snowfallProfile(0).near);
  assert.ok(particles.every(p=>p.r>=.6&&p.r<1.7));
});

test('固定炮兵预警后发射，手雷兵从树后探身投掷；失去目标或被冻结时不继续攻击',()=>{
  const units=createSnowDefenders(),gun=units.find(e=>e.t==='artillery'),soldier=units.find(e=>e.t==='grenadier'),target={x:80,y:176};
  assert.equal(units.filter(e=>e.t==='artillery').length,7);assert.equal(units.filter(e=>e.t==='grenadier').length,7);
  const before=JSON.stringify(gun);for(let i=0;i<100;i++)assert.equal(advanceSnowDefender(gun,target,1/60,{active:false}),null);assert.equal(JSON.stringify(gun),before);
  gun.phaseT=.01;assert.equal(advanceSnowDefender(gun,target,.02),null);assert.equal(gun.phase,'windup');
  target.x=150;let shell;for(let i=0;i<40&&!shell;i++)shell=advanceSnowDefender(gun,target,1/60);
  assert.equal(shell.snowOrdnance,'shell');assert.ok(shell.vx<0&&shell.g>0);assert.equal(gun.aimX,80,'aim is fixed during the visible warning');
  soldier.phaseT=0;advanceSnowDefender(soldier,target,.01);let grenade;
  for(let i=0;i<50&&!grenade;i++)grenade=advanceSnowDefender(soldier,target,1/60);
  assert.equal(grenade.snowOrdnance,'grenade');assert.ok(soldier.peek>.9);assert.ok(snowDefenderBox(soldier).h>26);
  soldier.dead=true;assert.equal(advanceSnowDefender(soldier,target,10),null);
});

test('手雷先沿弧线落地弹跳，再点燃爆炸判定，爆炸到期后清除',()=>{
  const enemy={t:'grenadier',x:190,y:176,face:-1,phase:'windup',phaseT:0,peek:1,aimX:80,aimY:176};
  const grenade=advanceSnowDefender(enemy,{x:80,y:176},.01),floor=(x,y0,y1)=>y0<=176&&y1>=176?{y:176}:null;
  let bounce=false,burst=0,peak=grenade.y;
  for(let i=0;i<150&&!grenade.dead;i++){
    const exploded=advanceSnowOrdnance(grenade,1/60,floor);if(exploded)burst++;bounce ||=grenade.bounces>0;peak=Math.min(peak,grenade.y);
  }
  assert.ok(peak<125,'grenade visibly clears the tree line');assert.equal(bounce,true);assert.equal(burst,1);assert.equal(grenade.dead,true);
});

test('第五关素材为压缩 WebP，图集裁切完整，提示词、透明边界和文件尺寸有记录',()=>{
  const manifest=JSON.parse(fs.readFileSync(new URL('../../games/contra2026/design/stage-05-assets.json',import.meta.url),'utf8'));
  assert.equal(manifest.generatedWith,'built-in imagegen');assert.equal(manifest.assets.length,17);
  for(const entry of manifest.assets){
    const bytes=fs.readFileSync(new URL('../..'+entry.url,import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert.equal(bytes.length,entry.bytes);assert.ok(entry.bytes<700000);assert.ok(entry.prompt.length>200);
    for(const [x,y,w,h]of [entry.bounds,...Object.values(entry.frames||{})])assert.ok(x>=0&&y>=0&&x+w<=entry.dimensions[0]&&y+h<=entry.dimensions[1]);
  }
  assert.deepEqual(Object.values(STAGE_FIVE_ASSETS).sort(),manifest.assets.map(a=>a.url).sort());
  assert.ok(SNOW_LEDGE.walk>0&&SNOW_LEDGE.walk<.2);assert.equal(WINTER_TANK.width,180);
});

test('云层在镜头静止时持续错速漂移，战斗机由画面外进入并保留足够长的间隔',()=>{
  const a=polarClouds(3),b=polarClouds(4);assert.equal(a.length,6);assert.ok(a.every((p,i)=>p.x>b[i].x));
  assert.notEqual(a[0].x-b[0].x,a[3].x-b[3].x);assert.deepEqual(fighterFlyby(8),[]);
  assert.ok(fighterFlyby(9).every(p=>p.x>384));assert.ok(fighterFlyby(12).some(p=>p.x>0&&p.x<384));
  assert.deepEqual(fighterFlyby(18),[]);assert.equal(fighterFlyby(38).length,2);assert.equal(fighterFlyby(64).length,3);
});

test('空中堡垒先入场、再预警锁定，横向悬浮并分阶段发射；冻结与击毁后停止攻击',()=>{
  const F=createFlyingFortress(),target={x:4690,y:176};F.active=true;
  for(let i=0;i<119;i++)assert.deepEqual(advanceFlyingFortress(F,target,1/60),[]);assert.ok(F.entryT>0);
  const shots=[];let sawWarning=false;
  for(let i=0;i<700;i++){shots.push(...advanceFlyingFortress(F,target,1/60));sawWarning ||=F.warning>0;}
  assert.ok(sawWarning);assert.ok(shots.some(s=>s.fortressShot));assert.ok(shots.some(s=>s.snowOrdnance==='grenade'));
  assert.ok(shots.every(s=>s.vy>0));const before=F.time;advanceFlyingFortress(F,target,10,{frozen:true});assert.equal(F.time,before);
  F.dead=true;assert.deepEqual(advanceFlyingFortress(F,target,10),[]);
});
