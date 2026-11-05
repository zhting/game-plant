import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { GamepadInput } from '../../games/contra2026/js/gamepad-input.mjs';
import { normalizeAudioMix, audioMixLevels } from '../../games/contra2026/js/audio-mix.mjs';
import {ContraWeaponAudio,receivedWeaponShots} from '../../games/contra2026/js/weapon-audio.mjs';
import {aimEscortDrone,escortDroneMuzzle} from '../../games/contra2026/js/escort-drone.mjs';
import {advanceAlienCrawler,alienCrawlerFrame,ALIEN_CRAWLER_ART} from '../../games/contra2026/js/alien-crawler.mjs';
import * as stageEightGuardian from '../../games/contra2026/js/stage-eight-guardian.mjs';
import * as guardianFlyers from '../../games/contra2026/js/guardian-flyer.mjs';
import * as ceilingParasites from '../../games/contra2026/js/ceiling-parasite.mjs';
import * as ceilingStalkers from '../../games/contra2026/js/ceiling-stalker.mjs';
import * as hiveBrood from '../../games/contra2026/js/hive-brood.mjs';
import {advanceLarvaHop,larvaHopFrame} from '../../games/contra2026/js/larva-hop.mjs';
import {hiveSpikeHeight} from '../../games/contra2026/js/stage-eight-hazards.mjs';
import { THIRTY_LIVES, ThirtyLivesCheat, inTitleLogo } from '../../games/contra2026/js/thirty-lives.mjs';
import { InputBuffer, packWorld, unpackWorld, encodeInput } from '../../games/contra2026/js/coop-core.mjs';
import { inventorySlotAt, inventorySlotBounds } from '../../games/contra2026/js/hud-layout.mjs';
import { MOTORCYCLE_RIDER } from '../../games/contra2026/js/stage-one-motion.mjs';
import { StageOneArt, FORTRESS_ART, FORTRESS_TARGETS, FORTRESS_EXIT } from '../../games/contra2026/js/stage-one-art.mjs';
import { StageTwoArt } from '../../games/contra2026/js/stage-two-art.mjs';
import { StageThreeArt } from '../../games/contra2026/js/stage-three-art.mjs';
import { StageFourArt } from '../../games/contra2026/js/stage-four-art.mjs';
import { StageFiveArt } from '../../games/contra2026/js/stage-five-art.mjs';
import { StageSixArt } from '../../games/contra2026/js/stage-six-art.mjs';
import { StageSevenArt } from '../../games/contra2026/js/stage-seven-art.mjs';
import { EndingArt } from '../../games/contra2026/js/ending-art.mjs';
import { ENDING_DURATION, ENDING_PAGES } from '../../games/contra2026/js/ending-story.mjs';
import { hangarMachinery } from '../../games/contra2026/js/stage-seven-atmosphere.mjs';
import * as hangarObstacles from '../../games/contra2026/js/stage-seven-obstacles.mjs';
import * as hangarRoute from '../../games/contra2026/js/stage-seven-layout.mjs';
import * as minecart from '../../games/contra2026/js/minecart-rider.mjs';
import * as stageSixCombat from '../../games/contra2026/js/stage-six-combat.mjs';
import * as stageSixBoss from '../../games/contra2026/js/stage-six-boss.mjs';
import * as stageSixExit from '../../games/contra2026/js/stage-six-exit.mjs';
import * as snowCombat from '../../games/contra2026/js/stage-five-combat.mjs';
import * as fortressRoof from '../../games/contra2026/js/fortress-roof-guard.mjs';
import * as riverFish from '../../games/contra2026/js/river-fish.mjs';
import * as fortressCannon from '../../games/contra2026/js/fortress-cannon.mjs';
import * as motorcycle from '../../games/contra2026/js/motorcycle-motion.mjs';
import { isLocalStageFivePreview } from '../../games/contra2026/js/local-stage-preview.mjs';
import * as baseFour from '../../games/contra2026/js/stage-four-layout.mjs';
import * as waterfall from '../../games/contra2026/js/stage-three-layout.mjs';
import * as waterfallArms from '../../games/contra2026/js/stage-three-arms.mjs';
import * as wallRock from '../../games/contra2026/js/stage-three-rockfall.mjs';
import { baseUpMuzzle, BASE_EXIT_ROLL_DURATION } from '../../games/contra2026/js/base-actor-poses.mjs';
import { OPENING_DURATION, OPENING_PAGES } from '../../games/contra2026/js/opening-story.mjs';
import { drawSupplySaucer } from '../../games/contra2026/js/supply-saucer.mjs';
import { drawExplosion, drawSupplyDisc, drawEquipmentTurret, drawEquipmentSupply } from '../../games/contra2026/js/combat-art.mjs';
import { BASE_SOLDIER, BASE_PATROL_DEPTH, BASE_PATROL_LIMIT, BASE_PATROL_MAX, advanceBasePatrol, baseSoldierScale, baseSoldierJumpOffset, baseSoldierMuzzle, advanceBaseSoldierJump } from '../../games/contra2026/js/base-soldier.mjs';
import { BASE_HIGH_SWITCH, baseShotHeight, baseTargetAtHeight, baseCoreShielded, baseHomingTarget } from '../../games/contra2026/js/base-shooting.mjs';
import { baseSupplyKind } from '../../games/contra2026/js/base-supply.mjs';
import { BASE_BOSS_DEVICES, BASE_BOSS_MOVER, bossDevicesRemaining, movingBossX, advanceBossLift, advanceStageTwoBossDevice } from '../../games/contra2026/js/base-boss.mjs';
import { canEnterExit, beginExitEntry, advanceExitEntry, teamInsideExit } from '../../games/contra2026/js/stage-one-exit.mjs';
import { ReferenceMusic, StageMusicSession, referenceTrackForScene, musicForScene, stageMusicOptions, stageMusicPool, normalizeStageMusic } from '../../games/contra2026/js/reference-music.mjs';
import { CONTRA_TRACKS, fixedStageMusicKeys, fixedMusicTrack } from '../../games/contra2026/js/fixed-soundtrack.mjs';
import { versionedAssetUrl } from '../../games/contra2026/js/asset-url.mjs';
import { musicRecord } from '../../games/contra2026/js/music-records.mjs';
import { REFERENCE_TRACKS } from '../../games/contra2026/js/reference-music.mjs';
import { ResourcePreloader, gameResourceJobs, musicResourceJobs } from '../../games/contra2026/js/resource-preloader.mjs';
import { stageResourceJobs } from '../../games/contra2026/js/stage-resources.mjs';
import { OPEN_STAGES, LAST_OPEN_STAGE, STAGE_RELEASE_MESSAGE, isStageOpen, nextOpenStage } from '../../games/contra2026/js/release-stages.mjs';
import { beginDeath, advanceDeath, deathVisual } from '../../games/contra2026/js/player-death.mjs';
import { addImpact } from '../../games/contra2026/js/impact-effects.mjs';
import { GIANT_POWER, startGiant, endGiant, updateGiant, hitGiant, giantCrushBox, giantPowerLabel, drawGiantStomp } from '../../games/contra2026/js/giant-power.mjs';
import {drawImpactHelmet} from '../../games/contra2026/js/impact-helmet-art.mjs';

// Run the real shared game engine with a no-op drawing surface. No production
// mutation hooks are exposed; the test hook is injected into this VM only.
function engine({getGamepads=()=>[],coldResources=false,previewStage5=false,touch=false,hostname='localhost',savedSettings=null,weaponAudioClass=ContraWeaponAudio}={}) {
  let fullscreenRequests=0;
  const elements = new Map(), storage = new Map(), documentEvents=new Map();
  if(savedSettings)storage.set('chiyan-settings',JSON.stringify(savedSettings));
  const gradient = { addColorStop() {} };
  const context = new Proxy({
    measureText: text => ({ width: String(text).length * 6 }),
    createLinearGradient: () => gradient, createRadialGradient: () => gradient,
  }, { get: (o, key) => key in o ? o[key] : () => {}, set: (o, key, value) => (o[key] = value, true) });
  let document;
  function element() {
    const classes = new Set();
    return {
      hidden: true, value: '1', style: { setProperty() {} }, clientWidth: 768, clientHeight: 432,
      classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle(c, enabled) { if (enabled) classes.add(c); else classes.delete(c); } },
      getContext: () => context, addEventListener() {}, setAttribute() {}, getAttribute() { return null; },
      querySelector() { return null; }, querySelectorAll: () => [],
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 768, height: 432 }),
      focus() { document.activeElement = this; }, blur() {},
    };
  }
  document = {
    getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
    createElement: element, addEventListener(type,handler) {if(!documentEvents.has(type))documentEvents.set(type,[]);documentEvents.get(type).push(handler);}, body: element(), activeElement: null, hidden: false,
    documentElement:{requestFullscreen(){fullscreenRequests++;return Promise.resolve();}},
  };
  class Network {
    playing = false; role = 'host'; room = ''; remote = new InputBuffer();
    constructor(callbacks) { this.callbacks = callbacks; }
    leave() { this.playing = false; this.room = ''; }
  }
  const sandbox = {
    document, navigator: { maxTouchPoints: touch?5:0, getGamepads },
    location: { href: 'http://localhost/games/contra2026/', origin: 'http://localhost', hostname, search: previewStage5?'?preview=5':'' },
    matchMedia: () => ({ matches: false }), addEventListener() {}, requestAnimationFrame() {},
    innerWidth: 768, innerHeight: 432, performance: { now: () => 0 },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    Image: class { complete = false; naturalWidth = 0;
      set src(url){this.url=url;if(url)queueMicrotask(()=>{this.naturalWidth=this.naturalHeight=64;this.onload?.();});}
      get src(){return this.url;}
      decode(){return Promise.resolve();}
    },
    URL, URLSearchParams, Math, Date, Set, Map, console, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, coldResources,
    ...waterfall,...waterfallArms,...wallRock,...baseFour,...snowCombat,...fortressRoof,...riverFish,...fortressCannon,...motorcycle,...stageSixCombat,...stageSixBoss,...stageSixExit,...hangarObstacles,...hangarRoute,...minecart,...stageEightGuardian,...guardianFlyers,...ceilingParasites,...ceilingStalkers,...hiveBrood,
    THIRTY_LIVES, ThirtyLivesCheat, inTitleLogo, normalizeAudioMix, audioMixLevels,ContraWeaponAudio:weaponAudioClass,receivedWeaponShots,aimEscortDrone,advanceAlienCrawler,advanceLarvaHop,hiveSpikeHeight,EndingArt,ENDING_DURATION,ENDING_PAGES,
    CoopClient: Network, packWorld, unpackWorld, inventorySlotAt, MOTORCYCLE_RIDER, StageOneArt, StageTwoArt, StageThreeArt, StageFourArt, StageFiveArt, StageSixArt, StageSevenArt, isLocalStageFivePreview, GamepadInput, baseUpMuzzle, BASE_EXIT_ROLL_DURATION, FORTRESS_ART, FORTRESS_TARGETS,
    REFERENCE_TRACKS, CONTRA_TRACKS, fixedStageMusicKeys, fixedMusicTrack, versionedAssetUrl, ResourcePreloader, gameResourceJobs, musicResourceJobs, stageResourceJobs,
    ReferenceMusic, StageMusicSession, referenceTrackForScene, musicForScene, stageMusicOptions, stageMusicPool, normalizeStageMusic, musicRecord, OPEN_STAGES, LAST_OPEN_STAGE, STAGE_RELEASE_MESSAGE, isStageOpen, nextOpenStage, OPENING_DURATION, OPENING_PAGES, drawSupplySaucer, BASE_SOLDIER, BASE_PATROL_DEPTH, BASE_PATROL_LIMIT, BASE_PATROL_MAX, advanceBasePatrol, baseSoldierScale, baseSoldierJumpOffset, baseSoldierMuzzle, advanceBaseSoldierJump,
    beginDeath, advanceDeath,
    addImpact,
    drawExplosion, drawSupplyDisc, drawEquipmentTurret, drawEquipmentSupply,
    GIANT_POWER, startGiant, endGiant, updateGiant, hitGiant, giantCrushBox, giantPowerLabel, drawGiantStomp,drawImpactHelmet,
    BASE_HIGH_SWITCH, baseShotHeight, baseTargetAtHeight, baseCoreShielded, baseHomingTarget,
    baseSupplyKind,
    BASE_BOSS_DEVICES, BASE_BOSS_MOVER, bossDevicesRemaining, movingBossX, advanceBossLift, advanceStageTwoBossDevice,
    FORTRESS_EXIT, canEnterExit, beginExitEntry, advanceExitEntry, teamInsideExit,
  };
  sandbox.window = sandbox;
  const module = fs.readFileSync(new URL('../../games/shared/arcade-engine.mjs', import.meta.url), 'utf8');
  let source = module.replace(/^import .*$/gm, '').replace(/^export /gm, '');
  source = source.replace('// ================= loop =================', `
    if(!coldResources)for(const stage of OPEN_STAGES)for(const job of stageJobs(stage))resourceCache.add(job.id);
    window.engine = { G, K, SET, coop, reset, step, render, collide, collideBasePlayer, withPlayer2, startGame, startStage, startAfterLoading, cancelLoading, stageResourcesReady, referenceMusic, resourceCache, startUWOpening, unlockUW, stageClear, slotHit, element: id => document.getElementById(id),
      keepTeamOnScreen, updateCamera, loadRoom, collidePartnerHazards, updateActor, updateEnemies, updateBullets, collidePlayer, jetBox, damageEnemy, ebox, updateBoss, updateStage3, hitMech, bossParts, findTarget, solids, BRIDGES, inWall, xMax, stageOneArt, stageThreeArt, Music, stageMusicSession, useSpecial, killPlayer, killSoldier, hitTarget, baseBlast, stageFourArt, stageFiveArt, hitTank, hitFlyingFortress, hitBossPart, placeTank, pBox, toTitle, infiniteLives, gameplaySettings, syncSettingsUI, updateHud, inspect:()=>window.Contra2026.inspect(),
      resizeWindow(width, height, dpr = 1) { $('wrap').clientWidth = width; $('wrap').clientHeight = height; window.devicePixelRatio = dpr; resize(); },
      resolution: () => ({ canvas: [cv.width, cv.height], backgrounds: backgroundResolution, sky: SKY && [SKY.width, SKY.height] }),
      play(stage, online = true) { coop.playing = online; reset(stage); setMode('play'); } };
    // ================= loop =================`);
  vm.runInNewContext(source + '\nstartArcade();', sandbox, { filename: 'contra2026-engine.js' });
  sandbox.engine.dispatchDocument=(type,event)=>{for(const handler of documentEvents.get(type)||[])handler({preventDefault(){},cancelable:true,...event});};
  sandbox.engine.fullscreenRequests=()=>fullscreenRequests;
  return sandbox.engine;
}

const pendingResource=()=>{let resolve;const promise=new Promise(yes=>resolve=yes);return {promise,resolve};};

function weaponAudioSpy(events){return class{
  constructor(options){this.options=options;this.stops=0;}
  play(weapon){if(!this.options.enabled())return false;events.push(weapon);return true;}
  stopAll(){this.stops++;}
  inspect(){return {played:events.length,stops:this.stops};}
};}

test('前八关六种武器实际发弹时各播放一次相应枪声，冷却和暂停不重复播放，音效开关仍有效',()=>{
  for(const stage of [1,2,3,4,5,6,7,8])for(const weapon of ['rifle','machine','spread','laser','fire','homing']){
    const sounds=[],e=engine({weaponAudioClass:weaponAudioSpy(sounds)});e.play(stage,false);e.G.en=[];e.G.spawnT=9999;e.G.podTrig=[];e.G.p.invT=999;
    if(stage===6)e.G.jets=[];if(stage===7){e.G.s7.presses=[];e.G.s7.encounters=[];e.G.s7.cartT=9999;}
    e.step();e.G.p.weapon=weapon;e.K.KeyJ=true;e.step();
    assert.equal(e.G.p.shotSeq,1,`${stage} ${weapon}`);assert.deepEqual(sounds,[weapon]);for(let i=0;i<3;i++)e.step();assert.equal(sounds.length,1,'cooldown has no extra report');
    e.G.pb=[];e.G.p.cool=0;e.SET.sfx='off';e.step();assert.equal(e.G.p.shotSeq,2);assert.equal(sounds.length,1,'muted SFX do not play even though firing continues');
    e.G.mode='pause';for(let i=0;i<20;i++)e.step();assert.equal(e.G.p.shotSeq,2);assert.equal(sounds.length,1);
  }
});

test('联机客机按玩家一和玩家二的枪种播放枪声，快照重复或枪口闪光已结束都不漏发或重放',()=>{
  const hostSounds=[],guestSounds=[],host=engine({weaponAudioClass:weaponAudioSpy(hostSounds)}),guest=engine({weaponAudioClass:weaponAudioSpy(guestSounds)});
  host.play(1,true);guest.play(1,true);guest.coop.role='guest';host.G.en=[];host.G.podTrig=[];host.G.spawnT=9999;host.G.p.invT=host.G.p2.invT=999;
  host.G.p.weapon='spread';host.G.p2.weapon='machine';host.step();host.K.KeyJ=true;host.coop.remote.push(encodeInput({fire:true}));host.step();
  const sync=()=>guest.coop.callbacks.state(packWorld([host.G,host.solids,host.BRIDGES,{inf:'on',diff:'normal',autofire:'on'}]));
  sync();assert.deepEqual(guestSounds,['spread','machine']);sync();assert.equal(guestSounds.length,2);
  for(let i=0;i<8;i++){host.coop.remote.push(encodeInput({fire:true}));host.step();}host.G.p.flashT=host.G.p2.flashT=0;
  sync();assert.ok(guestSounds.length>2);assert.equal(guestSounds.at(-1),'machine');const count=guestSounds.length;sync();assert.equal(guestSounds.length,count);
  host.G.mode='pause';sync();assert.equal(guestSounds.length,count);assert.ok(guest.inspect().audio.weaponShots.stops>0);
});

test('真实摩托行驶从后轮扬尘，起跳只留蹬地尘，腾空不续尘，射击仍沿原方向',()=>{
  const e=engine();e.play(1,false);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.camX=2750;
  Object.assign(e.G.p,{x:2900,y:176,onGround:true,ride:'moto',rideT:15,invT:999});
  e.K.KeyD=e.K.KeyJ=true;for(let i=0;i<18;i++)e.step();
  assert.ok(e.G.p.motoPitch>.15);const dust=e.G.fx.filter(f=>f.k==='motoDust');assert.ok(dust.length>2);
  assert.ok(dust.every(f=>f.x<e.G.p.x&&f.material==='soil'));
  assert.ok(e.G.pb.filter(b=>!b.dead).every(b=>b.vx>0&&b.vy===0));
  const before=e.G.p.motoPitch;e.K.KeyK=true;e.step();assert.equal(e.G.p.onGround,false);assert.ok(e.G.p.motoPitch>before);
  const airborneDust=new Set(e.G.fx.filter(f=>f.k==='motoDust'));e.K.KeyK=false;
  for(let i=0;i<12;i++)e.step();assert.equal(e.G.p.onGround,false);
  assert.ok(e.G.fx.filter(f=>f.k==='motoDust').every(f=>airborneDust.has(f)),'空中没有新扬尘');
  const angle=e.G.p.motoPitch,ages=e.G.fx.map(f=>f.t);e.G.mode='pause';e.step();
  assert.equal(e.G.p.motoPitch,angle);assert.deepEqual(Array.from(e.G.fx,f=>f.t),Array.from(ages));
  e.G.mode='play';e.K.KeyD=e.K.KeyJ=false;
  for(let i=0;i<120;i++)e.step();assert.equal(e.G.p.onGround,true);assert.equal(e.G.p.motoPitch,0);
  assert.equal(e.G.fx.some(f=>f.k==='motoDust'),false);
});

test('双人摩托抬头与尘土独立同步，雪地扬雪，离车后清除抬头状态',()=>{
  const e=engine();e.play(1,true);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.camX=2750;
  for(const [i,p]of [e.G.p,e.G.p2].entries())Object.assign(p,{x:2900+i*80,y:176,onGround:true,ride:'moto',rideT:15,invT:999});
  e.K.KeyD=true;
  for(let i=0;i<12;i++){e.coop.remote.push(encodeInput({}));e.step();}
  assert.ok(e.G.p.motoPitch>.14);assert.equal(e.G.p2.motoPitch,0);
  const restored=unpackWorld(packWorld(e.G));assert.equal(restored.p.motoPitch,e.G.p.motoPitch);assert.equal(restored.p2.motoPitch,0);
  assert.ok(restored.fx.some(f=>f.k==='motoDust'));
  e.G.p.rideT=.001;e.K.KeyD=false;e.step();assert.equal(e.G.p.ride,null);assert.equal(e.G.p.motoPitch,0);
  const snow=engine();snow.play(5,false);snow.G.en=[];snow.G.podTrig=[];snow.G.spawnT=9999;
  Object.assign(snow.G.p,{ride:'moto',rideT:15,invT:999});snow.K.KeyD=true;
  for(let i=0;i<8;i++)snow.step();assert.ok(snow.G.fx.some(f=>f.k==='motoDust'&&f.material==='snow'));
});

test('要塞炮真实发射时触发后坐与炮口特效，两门独立，暂停和冰冻保持动作，摧毁后停火',()=>{
  for(const index of [0,1]){
    const e=engine();e.play(1,true);e.G.en=[];e.G.camX=2950;e.G.boss.active=true;
    Object.assign(e.G.p,{x:3100,y:176,invT:999});Object.assign(e.G.p2,{x:3130,y:176,invT:999});
    const gun=e.G.boss.parts[index],other=e.G.boss.parts[1-index];gun.fireT=0;other.fireT=999;
    e.updateBoss();assert.equal(e.G.eb.length,1);assert.equal(gun.shotAge,0);assert.equal(gun.shotSerial,1);
    assert.equal(other.shotAge,undefined,'另一门炮不会跟着抖动或冒烟');
    const muzzle=fortressCannon.fortressCannonMuzzle(gun);
    assert.deepEqual([e.G.eb[0].x,e.G.eb[0].y],[muzzle.x,muzzle.y]);
    for(let i=0;i<3;i++)e.updateBoss();
    const pose=fortressCannon.fortressCannonPose(gun);assert.ok(pose.recoil>3&&pose.flash>0);
    const restored=unpackWorld(packWorld(e.G)).boss.parts[index];
    assert.deepEqual(fortressCannon.fortressCannonPose(restored),pose,'联机快照保留当前后坐和火光相位');
    const age=gun.shotAge;e.G.freezeT=2;for(let i=0;i<30;i++)e.updateBoss();assert.equal(gun.shotAge,age);
    e.G.mode='pause';e.step();assert.equal(gun.shotAge,age);e.G.mode='play';e.G.freezeT=0;
    for(let i=0;i<30;i++)e.updateBoss();assert.equal(fortressCannon.fortressCannonPose(gun).recoil,0);
    assert.equal(fortressCannon.fortressCannonPose(gun).flash,0);assert.equal(e.G.eb.length,1);
    e.hitBossPart(gun,999);const count=e.G.eb.length;
    gun.fireT=0;for(let i=0;i<60;i++)e.updateBoss();assert.equal(e.G.eb.length,count);
    assert.equal(fortressCannon.fortressCannonPose(gun).age,-1);
  }
});

test('普通步枪斜下射击能击中实际跳跃的河鱼，继续向前可捡到奖励增加一条命',()=>{
  const e=engine();e.play(1,false);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.time=5.6;
  Object.assign(e.G.p,{x:40,y:112,invT:999});e.step();
  e.K.KeyS=e.K.KeyD=e.K.KeyJ=true;
  for(let frame=0;frame<120&&e.G.lives===3;frame++)e.step();
  assert.equal(e.G.lives,4);assert.equal(e.G.deaths,0);
  assert.equal(e.G.riverFishHits[0],0);assert.equal(e.G.p.weapon,'rifle');
  assert.ok(e.G.fx.some(f=>f.k==='lifeUp'));
});

test('第一关河鱼可被全部弹种击中，每次跃起只掉一次生命奖励，接触鱼不会扣命',()=>{
  for(const kind of ['b','sp','laser','fire','msl','heli']){
    const e=engine();e.play(1,false);e.G.en=[];e.G.pods=[];e.G.podTrig=[];e.G.spawnT=9999;
    e.G.time=6.65;Object.assign(e.G.p,{x:340,y:176,invT:0});
    const fish=riverFish.riverFishJumps(e.G.time,0,e.solids)[0];assert.ok(fish?.airborne);
    const bullet={k:kind==='heli'?'msl':kind,x:fish.x,y:fish.y,cx:fish.x,cy:fish.y,vx:270,vy:0,dmg:2,hits:new Set(),heliMissile:kind==='heli'};
    e.G.pb=[bullet];e.collide();
    assert.equal(e.G.riverFishHits[fish.tile],fish.cycle);
    assert.equal(e.G.items.filter(i=>i.fromFish).length,1,kind);
    assert.equal(e.G.items[0].kind,'life');assert.equal(e.G.lives,3,'命中后需要拾取，不直接加命');
    e.G.pb=[{...bullet,dead:false,hits:new Set()}];e.collide();e.collide();
    assert.equal(e.G.items.filter(i=>i.fromFish).length,1,'激光穿透、散弹或同帧双发不重复掉落');
    assert.equal(riverFish.riverFishJumps(e.G.time,0,e.solids,undefined,e.G.riverFishHits).length,0,'命中后鱼立即消失');
  }
  const e=engine();e.play(1,false);e.G.en=[];e.G.time=6.65;
  const fish=riverFish.riverFishJumps(e.G.time,0,e.solids)[0];
  Object.assign(e.G.p,{x:fish.x,y:fish.y+12,invT:0,onGround:false});e.collide();
  assert.equal(e.G.deaths,0);assert.equal(e.G.lives,3);assert.equal(e.G.items.length,0);
});

test('河鱼奖励落到岸边，拾取只加一条命，不占道具栏、不改变武器或触发积分加命',()=>{
  const e=engine();e.play(1,false);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.time=6.65;
  Object.assign(e.G.p,{x:340,y:176,weapon:'laser',rapid:true,invT:999});e.G.inv=['t'];
  const fish=riverFish.riverFishJumps(e.G.time,0,e.solids)[0];
  e.G.pb=[{k:'b',x:fish.x,y:fish.y,vx:270,vy:0,dmg:1}];e.collide();
  const item=e.G.items[0];assert.ok(item.vy<0);
  for(let i=0;i<180&&!item.rest;i++)e.updateEnemies();
  assert.equal(item.rest,true);assert.equal(item.vy,0);assert.equal(item.dead,undefined);
  assert.ok(e.solids.some(s=>!s.water&&!s.gone&&item.x>=s.x&&item.x<=s.x+s.w&&Math.abs(item.y-s.y)<.01));
  e.G.score=19999;e.G.nextLife=20000;Object.assign(e.G.p,{x:item.x,y:item.y});
  e.collide();assert.equal(e.G.lives,4);assert.equal(item.dead,true);assert.equal(e.G.p.weapon,'laser');
  assert.equal(e.G.p.rapid,true);assert.deepEqual(Array.from(e.G.inv),['t']);
  assert.equal(e.G.score,19999);assert.equal(e.G.nextLife,20000,'每份奖励恰好一条命');
  assert.match(e.G.bannerText,/增加一条命/);assert.ok(e.G.fx.some(f=>f.k==='lifeUp'));
  e.collide();assert.equal(e.G.lives,4);
  const floating=riverFish.riverFishLifeReward(fish,[],0);
  e.G.items=[floating];Object.assign(e.G.p,{x:floating.x,y:186,inWater:true});e.collide();
  assert.equal(e.G.lives,5,'浮水奖励位于实际游泳碰撞高度，可以正常拾取');
});

test('双人同步保留河鱼命中和生命奖励，同一奖励两人同时接触只加一次命，重开与换关正确清理',()=>{
  const e=engine();e.play(1,true);e.G.en=[];e.G.time=6.65;
  Object.assign(e.G.p,{x:300,y:176,invT:999});Object.assign(e.G.p2,{x:330,y:176,invT:999});
  const fish=riverFish.riverFishJumps(e.G.time,0,e.solids)[0];
  e.G.pb=[{k:'b',x:fish.x,y:fish.y,vx:270,vy:0,dmg:1}];e.collide();
  const restored=unpackWorld(packWorld(e.G));
  assert.equal(restored.riverFishHits[fish.tile],fish.cycle);assert.equal(restored.items[0].kind,'life');
  assert.equal(riverFish.riverFishJumps(restored.time,restored.camX,e.solids,undefined,restored.riverFishHits).length,0);
  const item=e.G.items[0];item.rest=true;item.y=176;
  for(const p of [e.G.p,e.G.p2])Object.assign(p,{x:item.x,y:item.y});
  e.collide();assert.equal(e.G.lives,4);e.collide();assert.equal(e.G.lives,4);
  e.reset(1);assert.equal(Object.keys(e.G.riverFishHits).length,0);assert.equal(e.G.items.length,0);
  e.play(3,false);e.G.en=[];e.G.time=6.65;e.G.pb=[{k:'b',x:fish.x,y:fish.y,vx:270,vy:0,dmg:1}];
  e.collide();assert.equal(e.G.items.length,0,'其他关卡不生成第一关河鱼奖励');
});

test('第一关屋顶潜伏兵在掩体后探身预警，再向下射击，离屏与冰冻时停手',()=>{
  const e=engine();e.play(1,false);
  const guard=e.G.en.find(u=>u.roofGuard);assert.ok(guard);
  e.G.en=[guard];e.G.spawnT=9999;e.G.podTrig=[];
  Object.assign(e.G.p,{x:3090,y:176,invT:999});
  for(let i=0;i<180;i++)e.updateEnemies();
  assert.equal(guard.phase,'hide');assert.equal(guard.peek,0);assert.equal(e.G.eb.length,0,'离屏不提前发动攻击');
  e.G.camX=2950;
  for(let i=0;i<90;i++)e.updateEnemies();
  assert.equal(guard.phase,'aim');assert.equal(e.G.eb.length,0,'探头预警后才开火');
  const frozen=JSON.stringify(guard);e.G.freezeT=1;
  for(let i=0;i<90;i++)e.updateEnemies();
  assert.equal(JSON.stringify(guard),frozen,'冰冻暂停动作与射击计时');
  e.G.freezeT=0;
  for(let i=0;i<45;i++)e.updateEnemies();
  const shot=e.G.eb.find(b=>b.from==='roof-guard');assert.ok(shot);
  assert.ok(shot.vx<0&&shot.vy>0,'从屋顶向地面玩家射击');
  assert.ok(e.ebox(guard).h>10,'探身后露出可以攻击的头部和上身');
  e.G.p.camoT=5;e.G.eb=[];
  for(let i=0;i<240;i++)e.updateEnemies();
  assert.equal(e.G.eb.length,0);assert.equal(guard.peek,0,'隐身玩家不会引发瞄准');
  e.reset(3);assert.equal(e.G.en.some(u=>u.roofGuard),false);
});

test('空中射击可越过屋顶击杀潜伏兵，双人快照保留动作，核心摧毁清理敌兵',()=>{
  const e=engine();e.play(1,true);const guard=e.G.en.find(u=>u.roofGuard);
  e.G.en=[guard];e.G.spawnT=9999;e.G.camX=2950;e.G.podTrig=[];
  Object.assign(e.G.p,{x:3060,y:176,invT:999});Object.assign(e.G.p2,{x:3170,y:176,invT:999});
  guard.phase='aim';guard.phaseT=.3;guard.peek=1;
  const restored=unpackWorld(packWorld(e.G)).en.find(u=>u.roofGuard);
  assert.deepEqual([restored.phase,restored.peek,restored.hp],['aim',1,2]);
  const box=e.ebox(guard),y=box.y+2;
  assert.equal(e.inWall(guard.x,y),false,'头部上方没有矩形隐形墙');
  assert.equal(e.inWall(guard.x,guard.coverY+5),true,'掩体下仍为实体建筑');
  e.G.pb=[{x:guard.x-30,y,vx:270,vy:0,k:'rifle',dmg:2,owner:1}];
  for(let i=0;i<10&&!guard.dead;i++){e.updateBullets();e.collide();}
  assert.equal(guard.dead,true);assert.equal(e.G.score,300);
  e.reset(1);const last=e.G.en.find(u=>u.roofGuard);
  e.G.camX=2950;e.updateBoss();e.hitBossPart(e.G.boss.parts[2],999);
  assert.equal(last.dead,true);assert.equal(e.G.eb.length,0);
});

test('直升机手雷键在横向和纵向关卡发射导弹，双人冷却独立，不挤占主武器，离机恢复手雷',()=>{
  for(const stage of [1,3,5])for(const online of [false,true])for(const face of [-1,1]){
    const e=engine();e.play(stage,online);e.G.en=[];e.G.pods=[];e.G.podTrig=[];e.G.spawnT=9999;
    const actors=[e.G.p,...(online?[e.G.p2]:[])];
    actors.forEach((p,i)=>Object.assign(p,{x:100+i*80,y:80,ride:'heli',rideT:12,face,onGround:false,invT:999,weapon:'laser'}));
    e.step(); // Let the input buffer leave its start-of-game held-key guard.
    e.K.KeyI=true;if(online)e.coop.remote.push(encodeInput({nade:true}));e.step();
    const missiles=e.G.pb.filter(b=>b.heliMissile);
    assert.equal(missiles.length,actors.length);assert.equal(e.G.gr.length,0);
    for(const p of actors){const b=missiles.find(b=>b.owner===p.pid);assert.equal(b.k,'msl');assert.equal(Math.sign(b.vx),face);assert.ok(b.y>p.y);}
    assert.equal(e.G.nadeCd,4);if(online)assert.equal(e.G.nadeCd2,4);
    const restored=unpackWorld(packWorld(e.G));
    assert.deepEqual(restored.pb.filter(b=>b.heliMissile).map(b=>b.owner),Array.from(missiles,b=>b.owner));
    e.K.KeyI=false;e.K.KeyJ=true;if(online)e.coop.remote.push(encodeInput({fire:true}));e.step();
    assert.ok(e.G.pb.some(b=>b.k==='laser'&&b.owner===1),'副武器导弹不占用激光的单发上限');
    if(online)assert.ok(e.G.pb.some(b=>b.k==='laser'&&b.owner===2));
    e.K.KeyI=true;if(online)e.coop.remote.push(encodeInput({nade:true}));e.step();
    assert.equal(e.G.pb.filter(b=>b.heliMissile).length,missiles.length,'冷却内重复按键不能再次发射');
    e.K.KeyI=e.K.KeyJ=false;actors.forEach(p=>p.ride=null);e.G.nadeCd=0;
    if(online)e.coop.remote.push(encodeInput({}));e.step();e.K.KeyI=true;e.step();
    assert.ok(e.G.gr.some(g=>!g.tnt),'离开直升机后同一按键恢复手雷');
  }
});

test('机载导弹绕过空中补给追踪敌人，命中只爆炸一次并保留手雷范围伤害',()=>{
  const e=engine();e.play(1,false);e.G.freezeT=999;e.G.spawnT=9999;e.G.podTrig=[];
  Object.assign(e.G.p,{x:100,y:80,ride:'heli',rideT:12,face:1,onGround:false,invT:999});
  const enemy={t:'snp',x:220,y:144,hp:40,fireT:999},nearby={t:'snp',x:245,y:144,hp:40,fireT:999};
  e.G.en=[enemy,nearby,{t:'box',x:80,y:80,hp:4,open:false}];
  e.G.pods=[{x:130,y:25,y0:25,t:0,kind:'M'}];
  e.step();
  e.K.KeyI=true;e.step();e.K.KeyI=false;
  const missile=e.G.pb.find(b=>b.heliMissile);assert.ok(missile.vy>0,'目标在下方，不追逐上方更近的补给飞碟');
  for(let i=0;i<90&&enemy.hp===40;i++)e.step();
  assert.equal(enemy.hp,24);assert.equal(nearby.hp,24);assert.equal(missile.dead,true);
  for(let i=0;i<10;i++)e.step();assert.equal(enemy.hp,24,'同一枚导弹不重复结算爆炸');
});

test('机载导弹能够锁定并炸毁要塞炮座，失去目标后重新寻找有效目标',()=>{
  const e=engine();e.play(1,false);e.G.freezeT=999;e.G.spawnT=9999;e.G.podTrig=[];e.G.en=[];
  Object.assign(e.G,{camX:2950});Object.assign(e.G.p,{x:3150,y:80,ride:'heli',rideT:12,face:1,onGround:false,invT:999});
  e.G.boss.active=true;const gun=e.G.boss.parts[0],hp=gun.hp;
  e.step();
  e.K.KeyI=true;e.step();e.K.KeyI=false;
  for(let i=0;i<90&&gun.hp===hp;i++)e.step();assert.ok(gun.hp<hp);
  const moving=engine();moving.play(1,false);moving.G.freezeT=999;moving.G.spawnT=9999;moving.G.podTrig=[];moving.G.pods=[];
  Object.assign(moving.G.p,{x:100,y:80,ride:'heli',rideT:12,face:1,onGround:false,invT:999});
  const first={t:'snp',x:200,y:60,hp:40,fireT:999},next={t:'snp',x:250,y:144,hp:40,fireT:999};moving.G.en=[first,next];
  moving.step();
  moving.K.KeyI=true;moving.step();moving.K.KeyI=false;first.dead=true;
  for(let i=0;i<100&&next.hp===40;i++)moving.step();assert.equal(next.hp,24);
});

test('主客机触屏按钮按各自载具显示导弹，离开直升机后显示手雷',()=>{
  const e=engine();e.play(1,true);e.G.p.ride='heli';e.G.p2.ride=null;
  e.updateHud();assert.equal(e.element('bNade').textContent,'导弹');
  e.coop.role='guest';e.updateHud();assert.equal(e.element('bNade').textContent,'手雷');
  e.G.p2.ride='heli';e.updateHud();assert.equal(e.element('bNade').textContent,'导弹');
  e.G.p2.ride=null;e.updateHud();assert.equal(e.element('bNade').textContent,'手雷');
});

test('横向关卡的摩托骑乘射击使用坐姿枪口高度，红蓝双人分别发射',()=>{
  for(const stage of [1,3,5])for(const online of [false,true])for(const face of [-1,1]){
    const e=engine();e.play(stage,online);e.G.en=[];e.G.pods=[];e.G.podTrig=[];e.G.spawnT=9999;
    Object.assign(e.G.p,{ride:'moto',rideT:15,face,invT:999});
    e.K.KeyJ=true;e.step();
    assert.ok(e.G.pb.some(b=>(b.owner||1)===1));
    assert.ok(Math.abs(e.G.p.fy-motorcycle.motorcycleMuzzle(e.G.p).y)<1e-9);
    assert.equal(Math.sign(e.G.p.fx-e.G.p.x),face);
    if(online){
      Object.assign(e.G.p2,{ride:'moto',rideT:15,face,invT:999});
      e.coop.remote.push(encodeInput({fire:true}));e.step();
      assert.ok(e.G.pb.some(b=>b.owner===2));
      assert.ok(Math.abs(e.G.p2.fy-motorcycle.motorcycleMuzzle(e.G.p2).y)<1e-9);
    }
    e.render();
  }
});

test('前五关道具栏的鼠标与触屏判定对齐实际三格位置，玩家二只操作右侧道具',()=>{
  for (const stage of [1,2,3,4,5]) for (const role of ['solo','host','guest']) {
    const e=engine();e.play(stage,role!=='solo');e.coop.role=role;
    e.G.inv=['g','f','m'];e.G.inv2=['g','f','m'];
    const actions=[];e.coop.action=(...args)=>actions.push(args);
    const hudX=role==='guest'?248:8;
    for(let slot=0;slot<3;slot++) {
      const box=inventorySlotBounds(slot,hudX);
      for(const [x,y]of [[box.x+.1,box.y+.1],[box.x+box.w/2,box.y+box.h/2],[box.x+box.w-.1,box.y+box.h-.1]]) {
        e.G.sel=0;actions.length=0;
        assert.equal(e.slotHit(x*2,y*2),true,`${stage}/${role}/${slot}`);
        if(role==='guest') {assert.deepEqual(actions,[['select',slot]]);assert.equal(e.G.sel,0);}
        else assert.equal(e.G.sel,slot);
      }
    }
    const other=inventorySlotBounds(0,role==='guest'?8:248);actions.length=0;
    assert.equal(e.slotHit((other.x+8)*2,20*2),false);assert.equal(actions.length,0);
    assert.equal(e.slotHit(192*2,80*2),false);
    e.G.mode='pause';assert.equal(e.slotHit((hudX+48)*2,20*2),false);
  }
});
test('触屏开始、选关、加载及跨关均不自动请求全屏',async()=>{
  const e=engine({touch:true,previewStage5:true,coldResources:true});
  e.referenceMusic.prefetch=async()=>{};
  await e.startGame();
  for(const stage of [1,2,3,4,5,1])await e.startStage(stage);
  assert.equal(e.G.mode,'intro');assert.equal(e.fullscreenRequests(),0);
});
test('第五关战车是中途战斗，继续穿越雪林后击败空中堡垒才通关',async()=>{
  const e=engine({hostname:'games.tangletang.top',coldResources:true});assert.equal(e.element('btnSel5').hidden,false);
  const requested=[];e.referenceMusic.prefetch=async key=>requested.push(key);
  assert.equal(await e.startStage(5),true);assert.equal(e.G.mode,'intro');assert.equal(e.inspect().resources.total,28);assert.equal(e.inspect().audio.resolved.track,'stage5');assert.deepEqual(requested,['stage5']);
  e.play(5,false);e.G.en=[];e.G.podTrig=[];e.G.p.invT=9999;
  const ice=e.solids.find(s=>s.g&&s.ice);Object.assign(e.G.p,{x:ice.x+20,y:176,onGround:true,support:ice,vx:60});
  e.step();assert.ok(e.G.p.vx>20,'ice retains momentum after releasing movement');
  e.G.camX=3400-384;e.G.p.x=e.G.camX+110;e.step();assert.equal(e.G.tank.active,true);
  const [gun,cannon,core]=e.G.tank.parts;e.hitTank(gun,99);e.hitTank(cannon,99);assert.equal(e.G.tank.dead,false);
  e.hitTank(core,36);assert.equal(e.G.tank.phase2,true);const home=e.G.tank.home;
  for(let i=0;i<95;i++)e.step();assert.ok(e.G.tank.x<home,'phase two still drives the tank forward');
  e.render();e.hitTank(core,99);assert.equal(e.G.tank.dead,true);for(let i=0;i<205;i++)e.step();
  assert.equal(e.G.mode,'play');assert.equal(e.G.fortress.active,false);assert.equal(e.inspect().audio.resolved.track,'stage5');
  assert.ok(e.xMax(10)>4900,'the midpoint wreck no longer blocks the route');
  e.G.p.x=4770;e.updateCamera();e.step();assert.equal(e.G.fortress.active,true);assert.equal(e.bossParts().length,0,'entry animation cannot be skipped with damage');
  for(let i=0;i<125;i++)e.step();assert.equal(e.bossParts().length,3);assert.ok(e.G.fortress.y>50);
  e.hitBossPart(e.G.fortress.parts[0],99);assert.equal(e.G.fortress.dead,false);e.render();
  const F=e.G.fortress;
  for(let i=0;i<200&&!F.escortWarning;i++)e.step();
  assert.ok(F.escortWarning,'the two bays warn before release');
  const timer=F.escortT;e.G.freezeT=1;ticks(e,30);
  assert.equal(F.escortT,timer);assert.ok(!e.G.en.some(o=>o.t==='fortressSaucer'));
  e.G.freezeT=0;
  for(let i=0;i<35&&!e.G.en.some(o=>o.t==='fortressSaucer');i++)e.step();
  const [left,right]=e.G.en.filter(o=>o.t==='fortressSaucer');
  assert.equal(left.x,F.x-61);assert.equal(right.x,F.x+61);
  assert.ok(left.vx<0&&right.vx>0);
  ticks(e,60);assert.ok(left.turning&&right.turning&&left.y>F.y+20);
  e.G.pb=[{k:'b',x:left.x,y:left.y,vx:0,vy:0,dmg:1}];e.collide();
  assert.equal(left.dead,true,'a normal player shot destroys a small saucer');e.render();
  e.hitBossPart(e.G.fortress.parts[2],99);for(let i=0;i<190&&e.G.mode!=='clear';i++)e.step();
  assert.ok(!e.G.en.some(o=>o.t==='fortressSaucer'),'destroying the fortress clears the remaining escorts');
  assert.equal(e.G.mode,'clear');assert.equal(e.element('clearTitle').textContent,'关卡完成');assert.equal(e.element('btnNext').hidden,false);assert.equal(e.element('btnNext').textContent,'进入第六关');
  e.coop.playing=true;assert.notEqual(e.startStage(5),false,'public fifth stage also opens multiplayer');assert.equal(e.G.stage,5);assert.equal(e.G.mode,'intro');
});

test('第六关喷火对两位玩家分别生效，防火服与液氮按实际机关计时',()=>{
  const e=engine();e.play(6,true);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;
  Object.assign(e.G.p,{x:40,y:176,invT:0});Object.assign(e.G.p2,{x:300,y:176,invT:0,fireproofT:15});
  e.G.time=2.2;for(let i=0;i<18;i++)e.step();
  assert.equal(e.G.p2.dead,false,'fire suit protects player two from an active jet');
  e.G.p2.fireproofT=0;for(let i=0;i<8&&!e.G.p2.dead;i++)e.step();
  assert.equal(e.G.p2.dead,true,'the same jet can hurt player two without protection');assert.equal(e.G.p.dead,false);
  e.G.inv=['w'];e.G.sel=0;e.G.p.spCd=0;e.useSpecial();e.step();
  assert.ok(e.G.s6.coolT>7);assert.ok(e.G.jets.every(j=>j.st==='cold'||j.boss),'liquid nitrogen suppresses active vents');
  const copy=unpackWorld(packWorld([e.G,e.solids,e.BRIDGES,e.SET]));
  assert.equal(copy[0].s6.coolT,e.G.s6.coolT);assert.equal(copy[0].p2.dead,true);assert.equal(copy[0].jets[0].st,'cold');
});

function stageSixRunnerScene(x,dir,playerX){
  const e=engine();e.play(6,false);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.jets=[];
  e.G.camX=Math.max(0,x-180);Object.assign(e.G.p,{x:playerX,y:176,onGround:true,invT:999});
  const floor=e.solids.find(s=>s.g&&x>=s.x&&x<=s.x+s.w);
  const soldier={t:'run',x,y:176,vx:dir*62,vy:0,hp:1,on:true,sup:floor,dec:false,anim:0,flash:0,fireT:999};e.G.en=[soldier];
  return {e,soldier};
}

test('第六关持枪跑兵预瞄后射击，弹丸可真实击中玩家，冰冻暂停攻击',()=>{
  const {e,soldier}=stageSixRunnerScene(220,-1,100);e.G.p.invT=0;soldier.fireT=0;
  e.step();assert.equal(soldier.attack.phase,'aim');assert.ok(soldier.x<220,'the soldier continues walking while aiming');
  e.G.freezeT=1;const time=soldier.attack.t;for(let i=0;i<20;i++)e.step();assert.equal(soldier.attack.t,time);assert.equal(e.G.eb.length,0);
  e.G.freezeT=0;let fired=false;for(let i=0;i<140&&!e.G.p.dead;i++){e.step();fired ||=e.G.eb.some(b=>b.from==='runner');}
  assert.ok(fired,'the soldier fires a real projectile');assert.equal(e.G.p.dead,true,'the projectile reaches the player');
});

test('第六关跑兵等待喷火时仍能射击，双人模式会寻找存活队友',()=>{
  const {e,soldier}=stageSixRunnerScene(284,1,170);e.G.jets=[{x:300,v:1,per:3.2,off:0,st:'fire',k:1}];e.G.time=2.2;soldier.fireT=0;
  let fired=false,held=false;for(let i=0;i<50;i++){e.step();held ||=soldier.hazardHold;fired ||=e.G.eb.some(b=>b.from==='runner');assert.ok(!soldier.dead);}
  assert.ok(held&&fired,'the waiting soldier can shoot without entering the flame');
  const co=stageSixRunnerScene(220,-1,100);co.e.play(6,true);co.e.G.en=[co.soldier];co.e.G.jets=[];co.e.G.spawnT=9999;
  Object.assign(co.e.G.p2,{x:100,y:176,invT:999});beginDeath(co.e.G.p);co.soldier.fireT=0;
  for(let i=0;i<25;i++)co.e.step();assert.ok(co.e.G.eb.some(b=>b.from==='runner'));assert.equal(co.soldier.fireFace,-1);
});

test('第六关跑兵靠近岩浆两侧时转向，不会随机跳进缺口',()=>{
  for(const [left,right] of [[560,620],[1000,1060],[1400,1460],[1900,1960],[2400,2460]])for(const [x,dir] of [[left-12,1],[right+12,-1]]){
    const {e,soldier}=stageSixRunnerScene(x,dir,x-100);let turned=false;
    for(let i=0;i<60;i++){e.updateEnemies();turned ||=Math.sign(soldier.vx)===-dir;assert.ok(soldier.y<=176);assert.equal(soldier.dead,undefined);assert.ok(soldier.x<=left-5||soldier.x>=right+5);}
    assert.ok(turned,'the runner turns around before leaving solid ground');
  }
});

test('第六关跑兵等待地面与横向喷火安全后再通过，液氮冷却时不误等',()=>{
  for(const [x,jetX,playerX,start] of [[270,300,170,2.2],[400,520,300,1]]){
    const {e,soldier}=stageSixRunnerScene(x,1,playerX);const jet=e.G.jets=(jetX===300?[{x:300,v:1,per:3.2,off:0}]:[{x:520,dir:-1,per:3.4,off:1.2}]).map(j=>({...j,st:'off',k:0}));
    e.G.time=start;let waited=false,passed=false;
    for(let i=0;i<260;i++){
      e.step();waited ||=!!soldier.hazardHold;passed ||=soldier.x>(jetX===300?320:532);
      assert.ok(!soldier.dead,'runner does not enter an active flame');assert.ok(soldier.y<=176,'runner stays on solid ground');
    }
    assert.ok(waited,'runner waits before the flame');assert.ok(passed,'runner proceeds during a safe interval');
    const copy=unpackWorld(packWorld(e.G));assert.equal(copy.en[0].hazardHold,soldier.hazardHold);
  }
  const {e,soldier}=stageSixRunnerScene(284,1,170);e.G.jets=[{x:300,v:1,per:3.2,off:0,st:'cold',k:0}];e.G.time=2.2;e.G.s6.coolT=8;
  for(let i=0;i<35;i++)e.step();assert.ok(soldier.x>300);assert.equal(soldier.hazardHold,false);
});

test('第六关重炮手在真实平台上预警并连发，冻结时停火且可被正常弹丸击毁',()=>{
  const e=engine();e.play(6,false);e.G.podTrig=[];e.G.spawnT=9999;
  const all=e.G.en.filter(u=>u.t==='heavyGunner');assert.equal(all.length,5);
  for(const gun of all)assert.ok(e.solids.some(s=>gun.x>=s.x&&gun.x<=s.x+s.w&&gun.y===s.y),'the tripod stands on its platform');
  for(const gun of all)assert.ok(e.G.en.every(other=>other===gun||other.t!=='snp'||other.y!==gun.y||Math.abs(other.x-gun.x)>45),'soldiers do not overlap the gun emplacement');
  const gun=all[0];e.G.en=[gun];e.G.camX=530;Object.assign(e.G.p,{x:650,y:176,invT:999});
  const shotTimes=[];let previous=0;
  for(let i=0;i<185;i++){e.step();const count=e.G.eb.filter(b=>b.from==='heavy-gunner').length;if(count>previous)shotTimes.push(e.G.time);previous=count;}
  assert.ok(shotTimes.length>=2,'the gun fires a visible burst');assert.equal(gun.face,-1);
  e.G.eb=[];e.G.freezeT=1;const phase=gun.phaseT;for(let i=0;i<30;i++)e.step();assert.equal(gun.phaseT,phase);assert.equal(e.G.eb.length,0);
  e.G.freezeT=0;e.G.pb.push({k:'rifle',x:gun.x-8,y:gun.y-20,vx:0,vy:0,dmg:8});e.collide();assert.equal(gun.dead,true);
});

test('第六关三层喷火通道的喷口与平台对齐，液氮停止喷火并同步状态',()=>{
  const e=engine();e.play(6,true);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;
  const jets=e.G.jets.filter(j=>j.gallery);assert.equal(jets.length,12);
  assert.deepEqual([...new Set(jets.map(j=>j.y))],[80,120,160]);
  assert.deepEqual([...e.solids.filter(s=>s.gallery).map(s=>s.y)],[96,136,56,96,136]);
  e.G.camX=2400;Object.assign(e.G.p,{x:2530,y:176,invT:999});Object.assign(e.G.p2,{x:2560,y:136,onGround:true,invT:0});
  e.G.time=1.25;e.step();assert.equal(jets.find(j=>j.side==='ascent'&&j.y===120).st,'fire');assert.equal(e.G.p2.dead,true,'the middle outlet hits a player on its own tier');
  e.play(6,true);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.camX=2400;e.G.s6.coolT=4;e.G.time=1.25;
  Object.assign(e.G.p,{x:2530,y:176,invT:999});Object.assign(e.G.p2,{x:2560,y:136,onGround:true,invT:0});e.step();
  assert.equal(e.G.p2.dead,false);assert.ok(e.G.jets.filter(j=>j.gallery).every(j=>j.st==='cold'));
  const remote=unpackWorld(packWorld([e.G,e.solids,e.BRIDGES,e.SET]));assert.equal(remote[0].jets.filter(j=>j.gallery).length,12);assert.equal(remote[0].s6.coolT,e.G.s6.coolT);
});

test('第六关三层通道可从地面依次跳上中层和上层平台',()=>{
  const e=engine();e.play(6,false);e.G.en=[];e.G.podTrig=[];e.G.jets=[];e.G.spawnT=9999;e.G.camX=2400;
  Object.assign(e.G.p,{x:2580,y:176,vy:0,onGround:true,invT:999});
  e.step(); // Release the menu's held-jump latch before simulating a new press.
  const jumpTo=y=>{
    e.K.KeyK=true;e.step();e.K.KeyK=false;
    for(let i=0;i<90;i++){e.step();if(e.G.p.onGround&&e.G.p.y===y)return true;}
    return false;
  };
  assert.ok(jumpTo(136),'the middle level is reachable from the ground');
  assert.ok(jumpTo(96),'the upper level is reachable from the middle level');
  assert.ok(jumpTo(56),'the crossing deck is reachable from the upper level');
});

test('第六关喷火通道立柱阻挡地面，沿两层平台攀爬后可从顶部越过',()=>{
  const e=engine();e.play(6,false);e.G.en=[];e.G.podTrig=[];e.G.jets=[];e.G.spawnT=9999;e.G.camX=2400;
  const wall=e.solids.find(s=>s.galleryWall),p=e.G.p;assert.ok(wall?.solid&&wall.wall);
  assert.equal(wall.x,stageSixCombat.STAGE_SIX_GALLERY.right);assert.equal(wall.y,56);assert.equal(wall.h,120);
  Object.assign(p,{x:wall.x-24,y:176,vy:0,onGround:true,support:e.solids.find(s=>s.g&&s.x===2460),invT:999});
  e.K.KeyD=true;for(let i=0;i<40;i++)e.step();e.K.KeyD=false;
  assert.ok(p.x<=wall.x-5,'the ground-level route is blocked');assert.equal(p.y,176);
  e.K.KeyD=true;e.K.KeyK=true;e.step();e.K.KeyK=false;for(let i=0;i<22;i++)e.step();
  e.K.KeyK=true;e.step();e.K.KeyK=false;
  for(let i=0;i<90;i++){e.step();assert.ok(p.x<=wall.x-5,'a double jump from the ground cannot pass through the lower pillar');}
  e.K.KeyD=false;Object.assign(p,{x:wall.x-5,y:176,vy:0,onGround:true,support:e.solids.find(s=>s.g&&s.x===2460),airJumps:1});e.step();
  const jumpTo=y=>{e.K.KeyK=true;e.step();e.K.KeyK=false;for(let i=0;i<90;i++){e.step();if(p.onGround&&p.y===y)return true;}return false;};
  assert.ok(jumpTo(136),'the lower railing is reachable');assert.ok(jumpTo(96),'the upper railing is reachable');
  e.K.KeyD=true;for(let i=0;i<8;i++)e.step();assert.ok(p.x<=wall.x-5,'the upper railing meets the wall');
  e.K.KeyK=true;e.step();e.K.KeyK=false;let cleared=false;
  for(let i=0;i<90;i++){e.step();if(p.x>wall.x+wall.w+5){cleared=true;break;}}
  assert.ok(cleared,'jumping from the upper railing clears the pillar');
});

test('第六关立柱在双人及直升机模式下阻挡下层，并允许飞过柱顶',()=>{
  const e=engine();e.play(6,true);e.G.en=[];e.G.podTrig=[];e.G.jets=[];e.G.spawnT=9999;e.G.camX=2400;
  const wall=stageSixCombat.STAGE_SIX_GALLERY;
  Object.assign(e.G.p,{x:wall.right-64,y:176,invT:999});Object.assign(e.G.p2,{x:wall.right-24,y:176,onGround:true,invT:999});
  e.coop.remote.push(encodeInput({right:true}));for(let i=0;i<40;i++)e.step();
  assert.ok(e.G.p2.x<=wall.right-5,'the second player also meets the pillar');
  const flight=engine();flight.play(6,false);flight.G.en=[];flight.G.podTrig=[];flight.G.jets=[];flight.G.spawnT=9999;flight.G.camX=2400;
  Object.assign(flight.G.p,{x:wall.right-19,y:140,ride:'heli',rideT:30,invT:999});flight.K.KeyD=true;
  for(let i=0;i<30;i++)flight.step();assert.ok(flight.G.p.x<=wall.right-12,'the helicopter cannot fly through the pillar');
  flight.G.p.y=wall.rightTop-4;for(let i=0;i<40;i++){flight.step();if(flight.G.p.x>wall.right+wall.rightWidth+12)break;}
  assert.ok(flight.G.p.x>wall.right+wall.rightWidth+12,'the helicopter can pass over the top');
  flight.K.KeyD=false;Object.assign(flight.G.p,{x:wall.right+wall.rightWidth/2,y:wall.rightTop-6});flight.K.KeyS=true;
  for(let i=0;i<12;i++)flight.step();assert.ok(flight.G.p.y<=wall.rightTop-4,'the helicopter cannot descend into the pillar');
});

test('第六关机器人跳跃时受击范围同步移动，击破后打开大门并等待玩家走入',()=>{
  const e=engine();e.play(6,false);e.G.en=[];e.G.podTrig=[];e.G.jets=[];e.G.spawnT=9999;e.G.p.invT=9999;
  e.G.camX=2916;e.G.p.x=3075;
  const boss=e.G.golem,core=boss.parts[2];
  e.step();assert.equal(boss.active,true);
  let minY=boss.y, moved=false;
  for(let i=0;i<180&&boss.phase!=='jump';i++)e.step();
  assert.equal(boss.phase,'jump');const startX=boss.x;
  for(let i=0;i<25;i++){e.step();minY=Math.min(minY,boss.y);moved ||= boss.x<startX;}
  assert.ok(minY<150&&moved,'the robot rises and jumps towards the player');
  assert.equal(core.x,boss.x-18);assert.equal(core.y,boss.y-75);
  const synced=unpackWorld(packWorld(boss));assert.equal(synced.phase,'jump');assert.equal(synced.y,boss.y);assert.equal(synced.parts[2].y,core.y);
  e.G.freezeT=2;const frozen=[boss.x,boss.y,boss.phaseT];for(let i=0;i<20;i++)e.step();assert.deepEqual([boss.x,boss.y,boss.phaseT],frozen);
  e.G.freezeT=0;e.G.pb.push({k:'rifle',x:core.x+core.w/2,y:core.y+core.h/2,vx:0,vy:0,dmg:8});e.collide();assert.equal(core.hp,72,'ordinary bullets hit the airborne robot');
  e.hitBossPart(core,40);assert.equal(boss.phase2,true);
  e.render();e.hitBossPart(core,99);assert.equal(boss.dead,true);
  for(let i=0;i<90&&boss.y<boss.ground;i++)e.step();assert.equal(boss.y,boss.ground,'an airborne destroyed boss falls to the floor');
  for(let i=0;i<300&&!e.G.s6.exitReady;i++)e.step();
  assert.equal(e.G.mode,'play');assert.equal(e.G.s6.exitReady,true);assert.equal(e.G.s6.doorProgress,1);
  e.K.KeyD=true;for(let i=0;i<400&&e.G.mode==='play';i++)e.step();
  assert.equal(e.G.mode,'intro');assert.equal(e.G.stage,7);assert.ok(e.G.gate&&e.G.s7.presses.length);
});

test('第六关大门在 Boss 倒下后逐步开启，暂停冻结，双人都走入后才过关',()=>{
  const e=engine();e.play(6,true);e.G.en=[];e.G.podTrig=[];e.G.jets=[];e.G.spawnT=9999;e.G.camX=2916;
  const boss=e.G.golem;boss.active=true;boss.phaseT=999;boss.shotT=999;
  for(const p of [e.G.p,e.G.p2])Object.assign(p,{x:3200,y:176,invT:999,onGround:true,vy:0});
  e.G.p.x=3290;e.step();assert.ok(e.G.p.x<stageSixExit.STAGE_SIX_EXIT.triggerX,'closed doorway blocks the player');
  e.G.p.weapon='laser';e.G.p2.weapon='spread';e.G.inv=['g'];e.G.inv2=['g'];e.G.lives=4;
  e.hitBossPart(boss.parts[2],999);assert.equal(boss.dead,true);
  e.G.p.x=3200;for(let i=0;i<220;i++)e.step();
  assert.equal(e.G.mode,'play');assert.ok(e.G.s6.doorProgress>0&&e.G.s6.doorProgress<1);
  const before=e.G.s6.doorProgress;e.G.mode='pause';for(let i=0;i<90;i++)e.step();assert.equal(e.G.s6.doorProgress,before);
  e.G.mode='play';for(let i=0;i<100&&!e.G.s6.exitReady;i++)e.step();assert.equal(e.G.s6.exitReady,true);
  e.G.p.x=stageSixExit.STAGE_SIX_EXIT.triggerX-2;e.K.KeyD=true;
  for(let i=0;i<100&&!e.G.p.exitEntered;i++){e.step();assert.doesNotThrow(()=>e.render());}
  assert.equal(e.G.p.exitEntered,true);assert.equal(e.G.p2.exitEntered,undefined);assert.equal(e.G.mode,'play');
  const snapshot=unpackWorld(packWorld(e.G));assert.equal(snapshot.p.exitEntered,true);assert.equal(snapshot.s6.exitReady,true);
  const second=e.G.p2;e.G.p2.x=stageSixExit.STAGE_SIX_EXIT.triggerX-2;
  for(let i=0;i<120&&e.G.mode==='play';i++){e.coop.remote.push(encodeInput({right:true}));e.step();}
  assert.equal(e.G.mode,'intro');assert.equal(e.G.stage,7);assert.equal(second.exitEntered,true);assert.ok(e.G.p2);
  assert.equal(e.G.lives,4);assert.equal(e.G.p.weapon,'laser');assert.equal(e.G.p2.weapon,'spread');assert.deepEqual([...e.G.inv],['g']);assert.deepEqual([...e.G.inv2],['g']);
});

test('第八关声波和抗酸道具在重开本关时保留给两位玩家',()=>{
  const e=engine();e.play(8,true);e.G.inv=['p','z'];e.G.inv2=['z','p'];e.reset(8,true);
  assert.deepEqual([...e.G.inv],['p','z']);assert.deepEqual([...e.G.inv2],['z','p']);
});

test('第七关机库尖刺在两层循环并伤害玩家，防御炮向上射击后分裂，击破核心进入第八关',()=>{
  for(const online of [false,true]){
    const e=engine();e.play(7,online);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;
    assert.equal(e.G.hive,null);assert.ok(e.G.s7.presses.some(q=>q.floor===112));assert.ok(e.G.s7.presses.some(q=>q.floor===176));
    const q=e.G.s7.presses[0],target=online?e.G.p2:e.G.p;
    Object.assign(target,{x:q.x,y:q.floor,vy:0,onGround:true,dead:false,invT:0});if(online)Object.assign(e.G.p,{x:q.x-30,y:q.floor,invT:999});
    e.G.time=1.95-q.off;e.step();assert.equal(target.dead,true,'extending spikes hit either player');
    Object.assign(target,{dead:false,invT:999,x:3290,y:176,vy:0});if(online)Object.assign(e.G.p,{x:3260,y:176,invT:999});
    e.G.camX=3116;e.G.s7.presses=[];e.G.eb=[];e.step();const gate=e.G.gate;assert.equal(gate.active,true);
    for(let i=0;i<180&&!e.G.eb.some(b=>b.waterAmbush==='fall');i++)e.step();
    assert.equal(e.G.eb.filter(b=>b.waterAmbush==='fall').length,3,'one shell splits into three descending rounds');
    const core=gate.parts[2];e.G.freezeT=999;e.G.pb=[{k:'b',x:gate.x-24,y:core.y+core.h/2,vx:300,vy:0,dmg:1}];
    for(let i=0;i<15&&core.hp===core.max;i++)e.step();assert.ok(core.hp<core.max,'a real projectile passes the wall opening and hits the core');
    e.G.pb=[{k:'b',x:core.x+core.w/2,y:core.y+core.h/2,vx:0,vy:0,dmg:100}];e.collide();assert.equal(gate.dead,true);
    for(let i=0;i<200&&e.G.mode==='play';i++)e.step();assert.equal(e.G.mode,'clear');assert.equal(e.element('btnNext').hidden,false);
    e.G.p.weapon='laser';e.G.lives=4;if(online)e.G.p2.weapon='spread';e.element('btnNext').onclick();
    assert.equal(e.G.stage,8);assert.ok(e.G.hive&&e.G.en.some(en=>en.t==='alienHead'));assert.equal(e.G.lives,4);assert.equal(e.G.p.weapon,'laser');if(online)assert.equal(e.G.p2.weapon,'spread');
  }
});

test('第七关压柱的柱身、停住和回收中的压头可接触，只有下压扫中乘员时致命',()=>{
  for(const online of [false,true])for(const phase of ['hold','rise','shaft','crush','frozen']){
    const e=engine();e.play(7,online);e.G.en=[];e.G.spawnT=9999;e.G.podTrig=[];e.G.s7.encounters=[];e.G.s7.cartT=9999;
    const q={...hangarRoute.HANGAR_PRESSES[0]},time=phase==='hold'?2.2:phase==='rise'?2.55:1.95;
    Object.assign(q,hangarRoute.hangarPressState(q,time-1/60));e.G.s7.presses=[q];e.G.time=time-1/60;
    const target=online?e.G.p2:e.G.p;
    Object.assign(target,{x:q.x,y:phase==='shaft'?60:q.floor,vy:0,onGround:phase!=='shaft',invT:0});
    if(online)Object.assign(e.G.p,{x:q.x-60,y:q.floor,invT:999});
    if(phase==='frozen')e.G.freezeT=1;
    e.step();assert.equal(target.dead,phase==='crush',`${online?'双人':'单人'} ${phase}`);
  }
});

test('第七关尖刺墙靠近时从地面升起，可用普通子弹击碎并在冻结时停止',()=>{
  const e=engine();e.play(7,false);const wall=e.G.en.find(o=>o.t==='spikeWall');assert.ok(wall);e.G.en=[wall];e.G.spawnT=9999;e.G.p.invT=999;e.G.camX=wall.x-250;Object.assign(e.G.p,{x:wall.x-120,y:152});
  for(let i=0;i<20;i++)e.step();assert.ok(wall.rise>0&&wall.rise<1);const rise=wall.rise;e.G.freezeT=2;for(let i=0;i<20;i++)e.step();assert.equal(wall.rise,rise);
  e.G.freezeT=0;for(let i=0;i<60;i++)e.step();assert.equal(wall.rise,1);
  e.G.pb=[{k:'b',x:wall.x,y:wall.y-30,vx:0,vy:0,dmg:30}];e.collide();assert.equal(wall.dead,true);
});

test('第七关大铁板挡住上下通道与二段跳，真实射击击毁后双人可继续通过',()=>{
  const e=engine();e.play(7,true);const wall=e.G.en.find(o=>o.t==='spikeWall');wall.rise=1;e.G.en=[wall];e.G.spawnT=9999;e.G.podTrig=[];e.G.s7.presses=[];e.G.s7.cartT=9999;
  const body=hangarObstacles.hangarPlateBox(wall,true);e.G.camX=wall.x-230;
  Object.assign(e.G.p,{x:body.x-35,y:176,vy:0,onGround:true,invT:999});Object.assign(e.G.p2,{x:body.x-35,y:128,vy:0,onGround:true,invT:999});e.K.KeyD=true;
  for(let i=0;i<70;i++){e.coop.remote.push(encodeInput({right:true}));e.step();}
  assert.ok(e.G.p.x<=body.x-5);assert.ok(e.G.p2.x<=body.x-5,'both floor levels are blocked');
  Object.assign(e.G.p,{x:body.x-7,y:128,vy:0,onGround:true});for(let i=0;i<100;i++){e.K.KeyK=i===0||i===18;e.step();}e.K.KeyK=false;
  assert.ok(e.G.p.x<body.x,'a normal double jump cannot bypass the plate');
  const copy=unpackWorld(packWorld(e.G));assert.deepEqual(hangarObstacles.hangarPlateBox(copy.en[0]),hangarObstacles.hangarPlateBox(wall));assert.equal(copy.en[0].hp,wall.max);
  e.K.KeyD=false;Object.assign(e.G.p,{x:body.x-55,y:176,vy:0,onGround:true});e.K.KeyJ=true;
  for(let i=0;i<600&&!wall.dead;i++)e.step();assert.equal(wall.dead,true);assert.ok(e.G.fx.some(f=>f.k==='debris'),'destroyed armor sheds metal fragments');assert.equal(e.inWall(wall.x,150),false);
  e.K.KeyJ=false;e.K.KeyD=true;for(let i=0;i<150;i++){e.coop.remote.push(encodeInput({right:true}));e.step();}
  assert.ok(e.G.p.x>body.x+body.w);assert.ok(e.G.p2.x>body.x+body.w);
});

test('第七关实体铁板在冻结时仍阻挡行走、摩托和直升机，护盾不会直接撞碎它',()=>{
  for(const mode of ['walk','moto','heli']){
    const e=engine();e.play(7,false);const wall=e.G.en.find(o=>o.t==='spikeWall');wall.rise=1;e.G.en=[wall];e.G.spawnT=9999;e.G.podTrig=[];e.G.s7.presses=[];e.G.s7.cartT=9999;e.G.freezeT=999;
    const body=hangarObstacles.hangarPlateBox(wall,true);e.G.camX=wall.x-230;Object.assign(e.G.p,{x:body.x-40,y:mode==='heli'?90:176,invT:999,shieldT:999,ride:mode==='walk'?null:mode,rideT:999});e.K.KeyD=true;
    for(let i=0;i<80;i++)e.step();assert.ok(e.G.p.x<body.x,mode+' cannot pass through steel');assert.equal(wall.hp,wall.max);
    e.G.freezeT=0;for(let i=0;i<15;i++)e.step();assert.equal(wall.hp,wall.max,'shielded contact does not remove the plate');
    if(mode==='walk'){e.G.p.x=body.x+body.w+35;e.K.KeyD=false;e.K.KeyA=true;for(let i=0;i<70;i++)e.step();assert.ok(e.G.p.x>=body.x+body.w+5,'the rear face also blocks travel');}
  }
});

test('第七关装卸区和阶梯哨站不能贴地平跑，需要真实跳跃越过不同高度的台阶',()=>{
  const e=engine();e.play(7,false);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.s7.presses=[];e.G.s7.cartT=9999;e.G.p.invT=9999;
  e.G.s7.encounters=[];e.step();e.K.KeyD=true;for(let i=0;i<150;i++)e.step();assert.equal(e.G.p.x,175,'raised loading slab stops flat running');
  const heights=new Set([176]);let previous=e.G.p.x,jumps=0;
  for(let i=0;i<4000&&e.G.p.x<1640;i++){
    e.K.KeyK=e.G.p.onGround&&Math.abs(e.G.p.x-previous)<.1&&!e.K.KeyK;if(e.K.KeyK)jumps++;
    previous=e.G.p.x;e.step();if(e.G.p.onGround)heights.add(e.G.p.y);
  }
  assert.equal(e.G.p.dead,false);assert.ok(e.G.p.x>=1640,JSON.stringify({x:e.G.p.x,y:e.G.p.y,heights:[...heights]}));
  assert.ok(heights.size>=3);assert.ok(jumps>=4,'different stepped bays require repeated deliberate jumps');
});

test('第七关跳入小车后随原车速移动，侧面接触车体也不会受伤',()=>{
  const e=engine();e.play(7,false);e.G.s7.presses=[];e.G.s7.cartT=9999;e.G.spawnT=9999;e.G.podTrig=[];
  const cart={t:'cart',x:100,y:176,vx:40,vy:0,hp:4,on:false,sup:null,flash:0,wheel:0};e.G.en=[cart];
  Object.assign(e.G.p,{x:100,y:151,vy:100,onGround:false,invT:0});for(let i=0;i<30;i++)e.step();
  assert.equal(e.G.p.dead,false);assert.equal(e.G.p.cart,cart);assert.ok(e.G.p.x>115,'the seated player travels with the cart');assert.equal(e.G.p.y,154);assert.equal(cart.driveVX,40);
  Object.assign(e.G.p,{cart:null,x:cart.x,y:176,vy:0,onGround:true,invT:0});e.collidePlayer();assert.equal(e.G.p.dead,false);
});

test('第七关可从地面真实起跳落上左右行驶的小车，随车移动和射击后再跳离',()=>{
  for(const speed of [-28,40]){
    const e=engine();e.play(7,false);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.s7.presses=[];e.G.s7.encounters=[];e.G.s7.cartT=9999;
    const cart={t:'cart',x:speed<0?142:95,y:176,vx:speed,vy:0,hp:4,on:true,sup:null,flash:0,wheel:0};e.G.en=[cart];
    Object.assign(e.G.p,{x:60,y:176,onGround:true,invT:0});e.step();e.K.KeyD=e.K.KeyK=e.K.KeyJ=true;e.step();e.K.KeyK=false;
    for(let i=0;i<60&&!e.G.p.cart;i++)e.step();assert.equal(e.G.p.cart,cart,`jump lands on cart moving at ${speed}`);
    e.K.KeyD=false;const before=cart.x;for(let i=0;i<20;i++)e.step();
    assert.equal(e.G.p.dead,false);assert.equal(cart.driveVX,speed);assert.ok(Math.abs(cart.x-before-speed/3)<.001);assert.equal(e.G.p.x,cart.x);assert.equal(e.G.p.y,154);assert.ok(e.G.pb.length>0);assert.equal(cart.hp,4);
    e.K.KeyK=true;e.step();assert.equal(e.G.p.cart,null);assert.ok(e.G.p.vy<0);assert.equal(e.G.p.dead,false);
  }
});

function cartBattle(online=false){
  const e=engine();e.play(7,online);e.G.s7.presses=[];e.G.s7.cartT=9999;e.G.spawnT=9999;e.G.podTrig=[];
  const cart={t:'cart',x:380,y:176,vx:0,vy:0,hp:4,on:true,sup:null,flash:0,wheel:0};e.G.en=[cart];e.G.camX=230;e.G.s7.encounters=[];
  Object.assign(e.G.p,{x:380,y:152,vy:100,onGround:false,invT:999});
  if(online)Object.assign(e.G.p2,{x:382,y:152,vy:100,onGround:false,invT:999});
  e.step();assert.equal(e.G.p.cart,cart);return {e,cart};
}

test('矿车内可伏低、抬枪射击，跳跃离车时保留武器且不会立即重新搭乘',()=>{
  const {e,cart}=cartBattle();const standing=e.pBox(e.G.p);e.K.KeyS=e.K.KeyJ=true;e.step();
  assert.equal(e.G.p.cartDuck,true);assert.ok(e.pBox(e.G.p).h<standing.h);assert.equal(e.G.p.fy,e.G.p.y-4);
  e.K.KeyS=false;e.K.KeyW=true;e.G.p.cool=0;e.step();assert.equal(e.G.p.ay,-1);assert.equal(e.G.p.fy,e.G.p.y-19);
  e.K.KeyW=false;e.K.KeyJ=false;e.G.p.weapon='spread';e.K.KeyK=true;e.step();
  assert.equal(e.G.p.cart,null);assert.ok(e.G.p.vy<0);assert.equal(e.G.p.weapon,'spread');assert.ok(e.G.p.cartCooldown>0);
  assert.ok(cart.x>110);assert.notEqual(e.G.p.y,154);e.K.KeyK=false;e.step();assert.equal(e.G.p.cart,null);
});

test('矿车搭乘时各种枪械从坐姿枪口发射，并可击中地面敌人且不会打坏自己的小车',()=>{
  for(const weapon of ['rifle','machine','spread','laser','fire','homing']){
    const {e,cart}=cartBattle();e.G.p.weapon=weapon;const target={t:'snp',x:440,y:176,hp:20,fireT:999,face:-1,flash:0};e.G.en.push(target);e.K.KeyJ=true;
    let shot=false;for(let i=0;i<65;i++){const cool=e.G.p.cool;e.step();if(e.G.p.cool>cool){shot=true;const muzzle=minecart.minecartMuzzle(e.G.p);assert.equal(e.G.p.fx,muzzle.x);assert.equal(e.G.p.fy,muzzle.y);}}
    assert.ok(shot,weapon);assert.ok(target.hp<20||target.dead,weapon+' hits from the cart');assert.equal(cart.hp,4,weapon+' does not hit the occupied cart');assert.equal(e.G.p.cart,cart);
  }
});

test('双人坐车保持独立武器、枪口和座位，联机快照保留同一辆小车的引用，暂停冻结车轮和乘员',()=>{
  const {e,cart}=cartBattle(true);assert.equal(e.G.p2.cart,cart);e.G.p.weapon='spread';e.G.p2.weapon='laser';e.K.KeyJ=true;
  e.coop.remote.push(encodeInput({fire:true,up:true}));e.step();
  assert.ok(e.G.p.x<e.G.p2.x);assert.ok(e.G.pb.some(b=>b.owner===1&&b.k==='sp'));assert.ok(e.G.pb.some(b=>b.owner===2&&b.k==='laser'));
  assert.equal(e.G.p.fy,150);assert.equal(e.G.p2.fy,135);assert.equal(cart.hp,4);
  const copy=unpackWorld(packWorld(e.G));assert.equal(copy.p.cart,copy.en[0]);assert.equal(copy.p2.cart,copy.en[0]);
  const frozen=[cart.x,cart.wheel,e.G.p.x,e.G.p2.x,e.G.p.fx,e.G.p2.fx];e.G.mode='pause';for(let i=0;i<90;i++)e.step();
  assert.deepEqual([cart.x,cart.wheel,e.G.p.x,e.G.p2.x,e.G.p.fx,e.G.p2.fx],frozen);
  e.G.mode='play';e.damageEnemy(cart,99,cart.x,cart.y);assert.equal(cart.dead,true);assert.equal(e.G.p.cart,null);assert.equal(e.G.p2.cart,null);assert.ok(e.G.p.invT>=1);assert.equal(e.G.p.weapon,'spread');
});

test('坐车遇到升起的铁板停下，可继续射击击毁铁板后驶过，冻结期间车身与枪口一致',()=>{
  const {e,cart}=cartBattle();const wall={...hangarObstacles.createHangarPlates()[0],x:420,rise:1};e.G.en.push(wall);
  for(let i=0;i<130;i++)e.step();assert.equal(e.G.p.dead,false);assert.equal(e.G.p.cart,cart);assert.ok(cart.x<wall.x-25);assert.equal(cart.vx,0);
  e.G.freezeT=10;e.K.KeyJ=true;const stopped=cart.x;for(let i=0;i<450&&!wall.dead;i++)e.step();
  assert.equal(wall.dead,true);assert.equal(cart.x,stopped);assert.equal(e.G.p.x,cart.x);assert.equal(cart.hp,4);
  e.G.freezeT=0;for(let i=0;i<70;i++)e.step();assert.ok(cart.x>wall.x+35);assert.equal(e.G.p.cart,cart);
});

test('第七关背景机械与车轮随游戏推进，暂停期间保持同一画面相位',()=>{
  const e=engine();e.play(7,false);e.G.s7.presses=[];e.G.s7.cartT=9999;e.G.spawnT=9999;e.G.p.invT=999;
  const cart={t:'cart',x:400,y:176,vx:-40,vy:0,hp:4,on:false,sup:null,flash:0,wheel:0};e.G.en=[cart];
  for(let i=0;i<30;i++)e.step();const before=hangarMachinery(e.G.camX,e.G.time),wheel=cart.wheel;
  e.G.mode='pause';for(let i=0;i<90;i++)e.step();assert.deepEqual(hangarMachinery(e.G.camX,e.G.time),before);assert.equal(cart.wheel,wheel);
  e.G.mode='play';for(let i=0;i<20;i++)e.step();assert.notDeepEqual(hangarMachinery(e.G.camX,e.G.time),before);assert.notEqual(cart.wheel,wheel);
});

test('第七关矿车只在装卸区和运输廊出现，空车轮组着地且玩家射击不会打坏它',()=>{
  const e=engine();e.play(7,false);e.G.en=[];e.G.spawnT=9999;e.G.s7.encounters=[];e.G.p.invT=999;e.G.p.x=80;e.K.KeyJ=true;
  for(let i=0;i<250;i++)e.step();const cart=e.G.en.find(enemy=>enemy.t==='cart');assert.ok(cart);assert.ok(cart.x<480&&cart.x>330);assert.equal(cart.y,176);assert.notEqual(cart.wheel,0);
  e.G.pb=[{k:'b',x:cart.x,y:cart.y-8,vx:0,vy:0,dmg:99}];e.collide();assert.equal(cart.hp,4);assert.equal(e.findTarget(cart.x,cart.y),null);
  e.G.en=[];e.G.p.x=1300;e.G.camX=1150;for(let i=0;i<200;i++)e.step();assert.equal(e.G.en.some(c=>c.t==='cart'),false,'the whole press line does not spawn repeated carts');
  e.G.p.x=1500;e.G.camX=1350;for(let i=0;i<45;i++)e.step();const tunnel=e.G.en.find(c=>c.t==='cart');assert.ok(tunnel);assert.equal(tunnel.depot,'tunnel-cart');assert.equal(tunnel.x,1716);assert.equal(tunnel.y,176);
});

test('第七关运输廊的低梁会挡住坐直的乘员，双人都伏低后才能继续坐车射击通过',()=>{
  const e=engine();e.play(7,true);e.G.en=[];e.G.spawnT=9999;e.G.s7.presses=[];e.G.s7.encounters=[];e.G.s7.cartT=9999;e.G.podTrig=[];
  const cart={t:'cart',x:1750,y:176,vx:100,driveVX:100,vy:0,hp:4,on:true,wheel:0};e.G.en=[cart];e.G.camX=1600;
  for(const p of [e.G.p,e.G.p2])Object.assign(p,{x:1750,y:154,cart,cartDuck:false,invT:999});
  e.K.KeyJ=true;for(let i=0;i<90;i++){e.coop.remote.push(encodeInput({fire:true}));e.step();}
  assert.equal(cart.x,1800);assert.equal(cart.vx,0);assert.equal(e.G.s7.duckHint,true);
  e.K.KeyS=true;for(let i=0;i<30;i++){e.coop.remote.push(encodeInput({fire:true}));e.step();}assert.equal(cart.x,1800,'one upright passenger still blocks the low beam');
  for(let i=0;i<245;i++){e.coop.remote.push(encodeInput({fire:true,down:true}));e.step();}
  assert.ok(cart.x>2130);assert.equal(e.G.p.cart,cart);assert.equal(e.G.p2.cart,cart);assert.equal(cart.hp,4);assert.ok(e.G.pb.some(b=>b.owner===1));assert.ok(e.G.pb.some(b=>b.owner===2));
  assert.equal(e.G.p.cartDuck,true);assert.equal(e.G.p2.cartDuck,true);assert.equal(e.G.p.fy,150);assert.equal(e.G.p2.fy,150);
});

test('第七关实心横梁的下表面挡住起跳，不能从底部穿进金属块',()=>{
  const e=engine();e.play(7,false);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.s7.presses=[];e.G.s7.encounters=[];e.G.s7.cartT=9999;e.G.camX=1700;
  // Isolate the physical ceiling from the independent live-track damage.
  Object.assign(e.G.p,{x:1850,y:176,onGround:true,invT:999});e.updateActor({jumpEdge:true});let minY=e.G.p.y;
  for(let i=0;i<60;i++){e.updateActor({});minY=Math.min(minY,e.G.p.y);}
  assert.ok(minY>=165,`head does not penetrate the underside (minY=${minY})`);assert.equal(e.G.p.y,176);assert.equal(e.G.p.onGround,true);
});

test('第七关低顶内松开下键或按跳跃不会穿顶和瞬移，驶出横梁后才可起身跳离',()=>{
  const e=engine();e.play(7,false);e.G.en=[];e.G.spawnT=9999;e.G.s7.presses=[];e.G.s7.encounters=[];e.G.s7.cartT=9999;e.G.podTrig=[];e.G.camX=1700;
  const cart={t:'cart',depot:'tunnel-cart',x:1850,y:176,vx:100,driveVX:100,vy:0,hp:4,on:true,wheel:0};e.G.en=[cart];
  Object.assign(e.G.p,{x:1850,y:154,cart,cartDuck:true,invT:0});e.step();
  for(let i=0;i<25;i++){e.K.KeyK=i%2===0;e.K.KeyW=e.K.KeyJ=true;e.step();assert.equal(e.G.p.cart,cart);assert.equal(e.G.p.cartDuck,true);assert.equal(e.G.p.y,154);assert.equal(e.G.p.ay,0);}
  assert.ok(cart.x>1890&&cart.x<1900,'releasing down does not teleport back to the entrance');assert.equal(e.G.p.dead,false);
  e.K.KeyK=e.K.KeyW=false;while(cart.x<1950)e.step();assert.equal(e.G.p.cartDuck,false);
  e.K.KeyK=true;e.step();assert.equal(e.G.p.cart,null);assert.ok(e.G.p.vy<0);
});

test('第七关低顶的带电轨道不能步行、趴地或靠起跳穿越，两位玩家都必须乘车',()=>{
  for(const slot of [1,2])for(const pose of ['standing','prone','jump']){
    const e=engine();e.play(7,slot===2);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.s7.presses=[];e.G.s7.encounters=[];e.G.s7.cartT=9999;e.G.freezeT=999;e.G.camX=1700;
    const p=slot===1?e.G.p:e.G.p2;Object.assign(p,{x:1850,y:176,onGround:true,invT:0});
    if(slot===2)Object.assign(e.G.p,{x:1760,y:176,invT:999});
    if(slot===1){e.K.KeyS=pose==='prone';e.K.KeyK=pose==='jump';}
    else e.coop.remote.push(encodeInput({down:pose==='prone',jump:pose==='jump'}));
    e.step();assert.equal(p.dead,true,`${slot}, ${pose}: direct contact is lethal`);
  }
  const e=engine();e.play(7,false);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.s7.presses=[];e.G.s7.encounters=[];e.G.s7.cartT=9999;e.G.camX=1700;
  Object.assign(e.G.p,{x:1780,y:176,onGround:true,invT:0});e.step();e.K.KeyD=e.K.KeyK=true;e.step();e.K.KeyK=false;
  let crossed=false;for(let i=0;i<120&&!e.G.p.dead;i++){e.step();crossed ||= e.G.p.x>1925;}
  assert.equal(crossed,false);assert.ok(e.G.p.dead||e.G.p.x<=1805,'jumping cannot reach the top of a full-height bulkhead');
});

test('第七关运输廊内死亡会恢复到安全伏低的矿车，空车不会自行驶走造成卡关',()=>{
  const e=engine();e.play(7,false);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.s7.presses=[];e.G.s7.encounters=[];e.G.s7.cartT=9999;e.G.camX=1700;
  Object.assign(e.G.p,{x:1850,y:176,onGround:true,invT:0});e.step();assert.equal(e.G.p.dead,true);
  for(let i=0;i<240&&e.G.p.dead;i++)e.step();assert.equal(e.G.p.dead,false);assert.ok(e.G.p.cart);assert.equal(e.G.p.cartDuck,true);assert.equal(e.G.deaths,1);
  e.K.KeyS=e.K.KeyJ=true;for(let i=0;i<220;i++)e.step();assert.ok(e.G.p.x>2140);assert.equal(e.G.deaths,1);assert.ok(e.G.pb.length>0);
  e.K.KeyS=e.K.KeyJ=false;e.K.KeyK=true;e.step();const cart=e.G.en.find(c=>c.depot==='tunnel-recovery'),x=cart.x;assert.equal(e.G.p.cart,null);
  for(let i=0;i<12;i++)e.step();assert.equal(cart.x,x,'an empty tunnel cart stays available for boarding again');
});

test('第七关入口矿车损毁后会补回可搭乘的空车，不会因一次损毁永久封路',()=>{
  const e=engine();e.play(7,false);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.s7.presses=[];e.G.s7.encounters=[];e.G.camX=1600;
  Object.assign(e.G.p,{x:1760,y:176,onGround:true,invT:999});for(let i=0;i<75;i++)e.step();
  const first=e.G.en.find(c=>c.depot==='tunnel-cart');assert.ok(first);e.damageEnemy(first,99,first.x,first.y);assert.equal(first.dead,true);
  for(let i=0;i<40;i++)e.step();const replacement=e.G.en.find(c=>c.depot==='tunnel-cart'&&!c.dead);
  assert.ok(replacement);assert.notEqual(replacement,first);assert.equal(replacement.x,1716);assert.equal(replacement.vx,0);
});

test('第七关高架封锁区必须越过实心挡墙，两位玩家均能逐层上跳后再沿另一侧下降',()=>{
  for(const slot of [1,2]){
    const e=engine();e.play(7,slot===2);e.G.en=[];e.G.spawnT=9999;e.G.podTrig=[];e.G.s7.presses=[];e.G.s7.encounters=[];e.G.s7.cartT=9999;e.G.camX=2300;
    const p=slot===1?e.G.p:e.G.p2,q=hangarRoute.HANGAR_CLIMB;
    Object.assign(p,{x:q.wall-24,y:176,vy:0,onGround:true,invT:0});if(slot===2)Object.assign(e.G.p,{x:2390,y:176,onGround:true,invT:999});
    const move=({jump=false,right=false,down=false}={})=>{if(slot===1){e.K.KeyK=jump;e.K.KeyD=right;e.K.KeyS=down;}else e.coop.remote.push(encodeInput({jump,right,down}));e.step();};move();
    for(let i=0;i<50;i++)move({right:true});assert.ok(p.x<=q.wall-5);assert.equal(p.y,176);
    move({jump:true,right:true});for(let i=0;i<20;i++)move({right:true});move({jump:true,right:true});for(let i=0;i<90;i++)move({right:true});assert.ok(p.x<=q.wall-5,'a ground double jump cannot clear the wall');
    // Return by ordinary down+jump inputs if the attempted bypass landed on a shelf.
    for(let i=0;i<120&&p.y!==176;i++)move({jump:i%30===0,down:true});
    const visited=[176];for(const y of [136,96,56]){move({jump:true});let landed=false;for(let i=0;i<90;i++){move();if(p.onGround&&p.y===y){landed=true;visited.push(y);break;}}assert.ok(landed,'ascending '+y);}
    assert.equal(p.support.oneWayTop,true);move({jump:true,down:true});assert.ok(p.vy<0,'the crown does not allow dropping into the solid wall');
    for(let i=0;i<90&&!p.onGround;i++)move();
    for(let i=0;i<180;i++){move({right:true});if(p.onGround&&visited.at(-1)!==p.y)visited.push(p.y);if(p.x>2605&&p.onGround&&p.y===176)break;}
    assert.deepEqual(visited,[176,136,96,56,96,136,176]);assert.equal(p.dead,false);assert.ok(p.x>2605);
    e.reset(7);assert.equal(e.solids.filter(s=>s.hangarClimb).length,5);assert.ok(e.solids.some(s=>s.climbWall&&s.solid));
  }
});

test('第七关重排路线可从入口用真实移动与射击击毁两块铁板并完成防御大门战',()=>{
  const e=engine();e.play(7,false);e.G.p.invT=9999;e.G.p.weapon='laser';e.step();
  const sections=new Set(),duckedPassages=new Set(),plates=e.G.en.filter(o=>o.t==='spikeWall');let lastX=e.G.p.x,stalled=0,jumpClock=0,climbedTop=false;
  e.K.KeyD=e.K.KeyJ=true;
  for(let i=0;i<14000&&e.G.mode==='play';i++){
    const p=e.G.p;sections.add(hangarRoute.hangarSectionAt(p.x).id);stalled=Math.abs(p.x-lastX)<.1?stalled+1:0;lastX=p.x;
    if(p.cart&&p.cartDuck)for(const r of hangarRoute.HANGAR_CART_TUNNEL.roofs)if(p.x>r.x+20&&p.x<r.x+r.w-10)duckedPassages.add(r.x);
    climbedTop ||= !!(p.support?.hangarClimb&&p.support.side==='crown');
    const plate=plates.find(o=>!o.dead&&o.x>p.x&&o.x-p.x<85),atGate=p.x>3320;
    e.K.KeyD=!(p.x>=1712&&p.x<1730&&!p.cart&&p.y<154);e.K.KeyS=!!p.cart;e.K.KeyK=false;
    const boarding=p.x>=1645&&p.x<1660&&!p.cart,leaveCart=p.cart&&p.x>2170;
    if(p.onGround&&!plate&&(boarding||leaveCart||stalled>10||atGate)&&jumpClock<=0){e.K.KeyK=true;jumpClock=45;}
    jumpClock--;e.step();
  }
  assert.equal(e.G.mode,'clear',JSON.stringify({x:e.G.p.x,y:e.G.p.y,sections:[...sections],plates:plates.map(p=>({x:p.x,hp:p.hp})),core:e.G.gate.parts[2].hp}));
  assert.equal(sections.size,8);assert.equal(duckedPassages.size,2);assert.equal(climbedTop,true);assert.ok(plates.every(p=>p.dead));assert.equal(e.G.gate.dead,true);assert.equal(e.G.deaths,0);
});

test('第七关无人机独立跟随两位玩家，炮管朝目标瞄准且弹丸从真实枪口发出，暂停与过关保留正确状态',()=>{
  const e=engine();e.play(7,true);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.s7.presses=[];e.G.s7.encounters=[];e.G.s7.cartT=9999;
  Object.assign(e.G.p,{x:100,y:176,invT:999});Object.assign(e.G.p2,{x:120,y:176,invT:999});e.G.inv=['a'];e.G.inv2=['a'];e.useSpecial();e.withPlayer2(()=>e.useSpecial());
  const target={t:'snp',x:340,y:176,hp:50,fireT:999,face:-1,flash:0};e.G.en=[target];
  for(const p of [e.G.p,e.G.p2]){assert.equal(p.droneT,12);p.droneCd=0;}
  e.step();for(const p of [e.G.p,e.G.p2]){
    const bullet=e.G.pb.find(b=>b.drone&&b.owner===p.pid),m=escortDroneMuzzle(p);assert.ok(bullet);assert.ok(Math.abs(bullet.x-bullet.vx/60-m.x)<1e-8);assert.ok(Math.abs(bullet.y-bullet.vy/60-m.y)<1e-8);assert.equal(p.droneFace,1);assert.ok(p.droneShotT>0);
  }
  for(let i=0;i<60;i++)e.step();assert.ok(target.hp<50,'drone bullets still damage enemies');
  e.G.en=[{...target,x:20,hp:50}];for(const p of [e.G.p,e.G.p2])p.droneCd=0;e.step();assert.equal(e.G.p.droneFace,-1);assert.equal(e.G.p2.droneFace,-1);
  const frozen=[e.G.time,e.G.p.dx2,e.G.p.dy2,e.G.p.droneAim,e.G.p.droneShotT,e.G.p.droneT,e.G.p2.droneT];e.G.mode='pause';for(let i=0;i<60;i++)e.step();assert.deepEqual([e.G.time,e.G.p.dx2,e.G.p.dy2,e.G.p.droneAim,e.G.p.droneShotT,e.G.p.droneT,e.G.p2.droneT],frozen);
  const copy=unpackWorld(packWorld(e.G));assert.equal(copy.p.droneAim,e.G.p.droneAim);assert.equal(copy.p2.droneFace,-1);
  e.reset(8,true);assert.equal(e.G.p.droneT,0);assert.equal(e.G.p2.droneT,0,'the hangar-only drone does not leak into the alien stage');
});

test('第八关跳跃幼体依次屈腿蓄力、蹬地、空中收腿、伸脚和落地缓冲，停跳不翻身且暂停冰冻同步定格',()=>{
  const e=engine();e.play(8,false);e.G.spawnT=9999;e.G.podTrig=[];e.G.s8.drips=[];e.G.p.x=350;
  const larva={t:'larva',x:220,y:176,vx:0,vy:0,hp:1,on:true,hopT:.4,face:1,anim:0,flash:0};e.G.en=[larva];
  const phases=[larvaHopFrame(larva)];let landed=false;
  for(let i=0;i<150;i++){
    e.updateEnemies();const frame=larvaHopFrame(larva);if(phases.at(-1)!==frame)phases.push(frame);
    if(frame===5)landed=true;if(landed&&frame===0)break;
  }
  assert.deepEqual(phases,[0,1,2,3,4,5,0]);assert.equal(larva.y,176);assert.equal(larva.vx,0);assert.equal(larva.face,1,'landing does not flip a right-facing creature back to the left');
  assert.ok(larva.x>220);const copy=unpackWorld(packWorld(e.G));assert.equal(larvaHopFrame(copy.en[0]),larvaHopFrame(larva));assert.equal(copy.en[0].face,1);
  larva.hopT=.1;e.updateEnemies();assert.equal(larvaHopFrame(larva),1);
  e.G.freezeT=8;const frozen=JSON.stringify(larva);for(let i=0;i<60;i++)e.updateEnemies();assert.equal(JSON.stringify(larva),frozen);
  e.G.mode='pause';for(let i=0;i<60;i++)e.step();assert.equal(JSON.stringify(larva),frozen);
  e.G.mode='play';e.G.freezeT=0;for(let i=0;i<10;i++)e.updateEnemies();assert.equal(larva.on,false);assert.equal(larvaHopFrame(larva),2);
});

test('第八关卵囊实际孵出的幼体从蹬腿姿态开始，不从空中收腿倒播到起跳',()=>{
  const e=engine();e.play(8,false);e.G.spawnT=9999;e.G.podTrig=[];
  e.G.en=[{t:'sac',x:250,y:176,hp:8,spawnT:.001,puls:0,flash:0}];e.updateEnemies();
  const baby=e.G.en.find(q=>q.t==='larva');assert.ok(baby);assert.equal(larvaHopFrame(baby),2);assert.ok(baby.hopAirT<.075);assert.equal(baby.face,-1);
});

test('第八关怪兽六帧爬行随实际位移推进，暂停冰冻和停步定格，腾空收肢且联机保留步态',()=>{
  const run=speed=>{
    const e=engine();e.play(8,false);e.G.spawnT=9999;e.G.podTrig=[];e.G.s8.drips=[];
    const crawler={t:'run',x:200,y:176,vx:speed,vy:0,on:true,hp:1,anim:0,flash:0};e.G.en=[crawler];return {e,crawler};
  };
  const {e,crawler}=run(62),frames=new Set();
  for(let i=0;i<60;i++){e.updateEnemies();frames.add(alienCrawlerFrame(crawler));}
  assert.equal(frames.size,6);assert.ok(Math.abs(crawler.crawlDistance-62)<1e-8);
  const slow=run(31);for(let i=0;i<60;i++)slow.e.updateEnemies();assert.ok(Math.abs(crawler.crawlDistance-slow.crawler.crawlDistance*2)<1e-8);
  const distance=crawler.crawlDistance;assert.equal(alienCrawlerFrame({...crawler,crawlDistance:distance+ALIEN_CRAWLER_ART.stride}),alienCrawlerFrame(crawler));
  crawler.vx=0;for(let i=0;i<20;i++)e.updateEnemies();assert.equal(crawler.crawlDistance,distance,'no sliding legs while stationary');
  crawler.vx=-62;e.G.freezeT=8;const frozen=JSON.stringify(crawler);for(let i=0;i<60;i++)e.updateEnemies();assert.equal(JSON.stringify(crawler),frozen);
  e.G.mode='pause';for(let i=0;i<60;i++)e.step();assert.equal(JSON.stringify(crawler),frozen);
  e.G.mode='play';e.G.freezeT=0;e.updateEnemies();assert.ok(crawler.crawlDistance>distance);assert.ok(crawler.x<262,'the gait also advances when travelling left');
  const remote=unpackWorld(packWorld(e.G));assert.equal(remote.en[0].crawlDistance,crawler.crawlDistance);assert.equal(alienCrawlerFrame(remote.en[0]),alienCrawlerFrame(crawler));
  Object.assign(crawler,{y:130,vy:-80,on:false});const airborne=crawler.crawlDistance;
  for(let i=0;i<8;i++)e.updateEnemies();assert.equal(crawler.on,false);assert.equal(crawler.crawlDistance,airborne);assert.equal(alienCrawlerFrame(crawler),4);
});

test('第八关顶部怪物实际爬行、蓄力后扑下，支持躲避、冻结、快照与击破，重玩恢复',()=>{
  for(const online of [false,true]){
    const e=engine();e.play(8,online);const stalkers=e.G.en.filter(q=>q.t==='ceilingStalker');assert.equal(stalkers.length,6);const mob=stalkers[0];
    e.G.en=[mob];e.G.spawnT=9999;e.G.podTrig=[];e.G.s8.drips=[];e.G.camX=320;Object.assign(e.G.p,{x:480,y:176,invT:999});if(online)Object.assign(e.G.p2,{x:460,y:176,invT:999});
    const start=mob.x;for(let i=0;i<100&&mob.phase==='cling';i++)e.updateEnemies();assert.equal(mob.phase,'windup');assert.ok(mob.x<start-30);assert.equal(mob.y-mob.roofY,8.5);
    e.G.freezeT=3;const pose=JSON.stringify(mob);ticks(e,25);assert.equal(JSON.stringify(mob),pose);e.G.mode='pause';ticks(e,20);assert.equal(JSON.stringify(mob),pose);
    const copy=unpackWorld(packWorld(e.G));assert.equal(JSON.stringify(copy.en[0]),pose);e.G.mode='play';e.G.freezeT=0;e.G.p.invT=0;e.K.KeyD=true;
    const phases=new Set();let landedOnSolid=false;for(let i=0;i<85;i++){
      e.step();phases.add(mob.phase);if(mob.phase==='land'&&e.solids.some(s=>!s.gone&&mob.x+6>s.x&&mob.x-6<s.x+s.w&&Math.abs(mob.y+8.5-s.y)<.01))landedOnSolid=true;
    }
    assert.ok(phases.has('pounce'));assert.ok(phases.has('land'));assert.equal(e.G.p.dead,false,'moving during the warning evades the committed pounce');
    assert.ok(landedOnSolid,'landing claws rest on an actual platform or floor');
    const score=e.G.score;e.G.pb=[{k:'b',x:mob.x,y:mob.y,vx:0,vy:0,dmg:2}];e.collide();assert.equal(mob.dead,true);assert.equal(e.G.score,score+150);
    e.reset(8);assert.equal(e.G.en.filter(q=>q.t==='ceilingStalker'&&q.phase==='cling'&&q.hp===2).length,6);
  }
});

test('第八关扑击怪物能伤害本机和队友，冻结期间接触安全',()=>{
  for(const slot of [1,2]){
    const e=engine();e.play(8,true);const mob=e.G.en.find(q=>q.t==='ceilingStalker');Object.assign(mob,{x:430,y:160,phase:'pounce'});e.G.en=[mob];
    const p=slot===1?e.G.p:e.G.p2;Object.assign(p,{x:430,y:176,invT:0,shieldT:0,dead:false});(slot===1?e.G.p2:e.G.p).x=200;
    const contact=()=>slot===1?e.collidePlayer():e.withPlayer2(()=>e.collidePlayer());e.G.freezeT=1;contact();assert.equal(p.dead,false);e.G.freezeT=0;contact();assert.equal(p.dead,true);
  }
});

test('第八关半墙拦住地面，头颈拦住空中，双人、跳跃、摩托和直升机不能穿过守卫',()=>{
  for(const slot of [1,2])for(const mode of ['walk','jump','moto','heli']){
    const e=engine();e.play(8,slot===2);const guardian=e.G.en.find(q=>q.t==='alienHead'),b=stageEightGuardian.alienGuardianWallBox(guardian);
    e.G.en=[guardian];e.G.spawnT=9999;e.G.podTrig=[];e.G.s8.drips=[];e.G.freezeT=999;e.G.camX=b.x-200;
    const p=slot===1?e.G.p:e.G.p2;Object.assign(p,{x:b.x-35,y:mode==='heli'?32:176,onGround:true,invT:999,shieldT:999,ride:mode==='moto'?'moto':mode==='heli'?'heli':null,rideT:999});
    if(slot===2)Object.assign(e.G.p,{x:b.x-70,y:176,onGround:true,invT:999});
    const move=jump=>{const input={right:true,up:mode==='heli',jump};if(slot===1){e.K.KeyD=true;e.K.KeyW=input.up;e.K.KeyK=jump;}else e.coop.remote.push(encodeInput(input));e.step();};move(false);
    for(let i=0;i<100;i++){move(mode==='jump'&&(i===1||i===19));assert.ok(p.x<guardian.x+62,`${slot} ${mode}: cannot pass the visible head and neck`);}
    if(mode==='walk'||mode==='moto')assert.ok(p.x<=b.x-12,'ground travel is stopped by the low wall');
    if(mode==='heli')assert.ok(p.x>b.x+15,'air above the left edge of the half-wall is no longer an invisible full-height barrier');
    assert.ok(e.G.camX<=856,'the guardian neck stays beyond the upper-right edge during the encounter');
    assert.equal(p.dead,false);assert.equal(guardian.hp,guardian.max);
    const copy=unpackWorld(packWorld({...e.G,platforms:e.solids}));assert.equal(stageEightGuardian.alienGuardianLimit(copy.en,3490,10,e.pBox(e.G.p)),e.xMax(10));assert.equal(copy.s8.guardianWall.h,72);assert.equal(copy.s8.guardianWall,copy.platforms.find(s=>s.guardianWall));
  }
});

test('第八关平射被半墙挡住，登上左侧高台可射击头部，击败后墙体消失并可越过缺口',()=>{
  const e=engine();e.play(8,false);const guardian=e.G.en.find(q=>q.t==='alienHead'),b=stageEightGuardian.alienGuardianWallBox(guardian);
  e.G.en=[guardian];e.G.spawnT=9999;e.G.podTrig=[];e.G.s8.drips=[];e.G.freezeT=999;e.G.camX=b.x-200;
  assert.equal(e.G.s8.guardianWall.y,104);assert.equal(e.G.s8.guardianWall.y+e.G.s8.guardianWall.h,176);
  Object.assign(e.G.p,{x:b.x-25,y:176,onGround:true,invT:999});e.step();e.K.KeyJ=true;ticks(e,90);assert.equal(guardian.hp,guardian.max,'the low wall does not share the head hit box');
  assert.ok(e.solids.some(s=>s.x===900&&s.y===96&&s.w===80));Object.assign(e.G.p,{x:940,y:96,onGround:true});
  for(let i=0;i<460&&!guardian.dead;i++)e.step();assert.equal(guardian.dead,true);assert.ok(e.xMax(10)>b.x+b.w);assert.ok(e.G.bannerText.includes('通路开启'));
  assert.equal(e.G.s8.guardianWall.gone,true);e.K.KeyJ=false;e.K.KeyD=true;
  let jumped=-1;for(let i=0;i<230&&e.G.p.x<1210;i++){
    e.K.KeyK=false;if(e.G.p.onGround&&e.G.p.x>1080){e.K.KeyK=true;jumped=i;}
    if(i===jumped+15&&!e.G.p.onGround)e.K.KeyK=true;e.step();
  }
  assert.ok(e.G.p.x>=1210,`reached ${e.G.p.x}, y=${e.G.p.y}`);assert.equal(e.G.p.dead,false);
  e.reset(8);const fresh=e.G.en.find(q=>q.t==='alienHead');assert.notEqual(fresh,guardian);assert.equal(fresh.hp,28);assert.ok(e.xMax(10)<b.x);
});

test('第八关中途守卫不会被护盾、摩托或巨大化的接触直接秒杀',()=>{
  for(const mode of ['shield','moto','giant']){
    const e=engine();e.play(8,false);const guardian=e.G.en.find(q=>q.t==='alienHead');e.G.en=[guardian];const b=e.ebox(guardian);
    Object.assign(e.G.p,{x:b.x+3,y:b.y+b.h-1,onGround:false,invT:0,shieldT:mode==='shield'?10:0,ride:mode==='moto'?'moto':null,rideT:10,giantT:mode==='giant'?10:0,giantHits:3});
    e.collidePlayer();assert.equal(guardian.hp,28);assert.ok(!guardian.dead);
  }
});

test('第八关守卫实际吐出可被击落的飞虫，暂停和冻结保持飞行及吐怪进度，击败守卫清理幼虫',()=>{
  const e=engine();e.play(8,true);const guardian=e.G.en.find(q=>q.t==='alienHead');e.G.en=[guardian];e.G.spawnT=9999;e.G.podTrig=[];e.G.s8.drips=[];e.G.camX=856;
  Object.assign(e.G.p,{x:982,y:176,invT:999});Object.assign(e.G.p2,{x:950,y:176,invT:999});
  for(let i=0;i<105;i++)e.updateEnemies();const brood=e.G.en.filter(q=>q.t==='guardianFlyer');assert.equal(brood.length,2);assert.equal(e.G.eb.some(b=>b.from==='alienHead'),false);
  assert.ok(brood.every(q=>q.x<stageEightGuardian.alienGuardianMouth(guardian).x&&q.y<104));assert.ok(brood[0].age>brood[1].age);
  e.G.freezeT=3;const before=JSON.stringify([guardian,...brood]);ticks(e,30);assert.equal(JSON.stringify([guardian,...brood]),before);
  e.G.mode='pause';ticks(e,20);assert.equal(JSON.stringify([guardian,...brood]),before);
  const copy=unpackWorld(packWorld(e.G));assert.equal(JSON.stringify(copy.en.filter(q=>q.t==='guardianFlyer')),JSON.stringify(brood));
  e.G.mode='play';e.G.freezeT=0;e.updateEnemies();assert.notEqual(JSON.stringify(brood),JSON.stringify(copy.en.filter(q=>q.t==='guardianFlyer')));
  const child=brood[0],score=e.G.score;e.G.pb=[{k:'b',x:child.x,y:child.y,vx:0,vy:0,dmg:2}];e.collide();assert.equal(child.dead,true);assert.equal(e.G.score,score+100);
  e.damageEnemy(guardian,999,guardian.x,guardian.y);assert.ok(brood.every(q=>q.dead));assert.equal(e.G.s8.guardianWall.gone,true);
});

test('第八关飞虫实体能击中本机及队友，冻结后接触安全',()=>{
  for(const slot of [1,2]){
    const e=engine();e.play(8,true);const flyer=guardianFlyers.createGuardianFlyer(e.G.en.find(q=>q.t==='alienHead'));Object.assign(flyer,{x:940,y:160});e.G.en=[flyer];
    const p=slot===1?e.G.p:e.G.p2;Object.assign(p,{x:940,y:176,invT:0,shieldT:0,dead:false});const other=slot===1?e.G.p2:e.G.p;other.x=700;
    const contact=()=>slot===1?e.collidePlayer():e.withPlayer2(()=>e.collidePlayer());
    e.G.freezeT=1;contact();assert.equal(p.dead,false);e.G.freezeT=0;contact();assert.equal(p.dead,true);
  }
});

test('第八关顶部寄生怪实际张嘴吐出白色漂浮敌人，可分别击破并在重玩时恢复',()=>{
  const e=engine();e.play(8,true);const nests=e.G.en.filter(q=>q.t==='ceilingParasite'&&q.mount==='ceiling');assert.equal(nests.length,8);assert.ok(nests.every(q=>q.y<=48));
  const parent=nests[0];e.G.en=[parent];e.G.spawnT=9999;e.G.podTrig=[];e.G.s8.drips=[];e.G.camX=320;Object.assign(e.G.p,{x:430,y:176,invT:999});Object.assign(e.G.p2,{x:400,y:176,invT:999});
  parent.fireT=.001;e.updateEnemies();assert.equal(parent.phase,'opening');assert.equal(e.G.en.length,1,'the mouth warns before emitting');
  e.G.freezeT=5;const warned=JSON.stringify(parent);for(let i=0;i<45;i++)e.updateEnemies();assert.equal(JSON.stringify(parent),warned);
  e.G.mode='pause';ticks(e,30);assert.equal(JSON.stringify(parent),warned);e.G.mode='play';e.G.freezeT=0;
  for(let i=0;i<75;i++)e.updateEnemies();const child=e.G.en.find(q=>q.t==='whiteFloater');assert.ok(child);assert.ok(child.y>parent.y+20);assert.equal(child.from,parent.id);
  const copy=unpackWorld(packWorld(e.G));assert.equal(JSON.stringify(copy.en),JSON.stringify(e.G.en));
  e.G.freezeT=3;const pose=JSON.stringify(child);for(let i=0;i<25;i++)e.updateEnemies();assert.equal(JSON.stringify(child),pose);
  e.G.freezeT=0;const score=e.G.score;e.G.pb=[{k:'b',x:child.x,y:child.y,vx:0,vy:0,dmg:1}];e.collide();assert.equal(child.dead,true);assert.equal(e.G.score,score+50);
  e.G.pb=[{k:'b',x:parent.x,y:parent.y,vx:0,vy:0,dmg:6}];e.collide();assert.equal(parent.dead,true);assert.equal(e.G.score,score+350);
  for(let i=0;i<400;i++)e.updateEnemies();assert.equal(e.G.en.filter(q=>q.t==='whiteFloater'&&!q.dead).length,0,'a destroyed parasite cannot keep emitting');
  e.reset(8);assert.equal(e.G.en.filter(q=>q.t==='ceilingParasite'&&q.mount==='ceiling'&&q.hp===6&&q.phase==='idle').length,8);assert.equal(e.G.en.some(q=>q.t==='whiteFloater'),false);
});

test('第八关底部寄生怪嵌在实地组织内，向上吐怪可冻结、同步和击破，重玩恢复',()=>{
  const e=engine();e.play(8,true);const nests=e.G.en.filter(q=>q.t==='ceilingParasite'&&q.mount==='floor');assert.equal(nests.length,8);
  for(const p of nests)assert.ok(e.solids.some(s=>s.g&&!s.gone&&p.x-13>=s.x&&p.x+13<=s.x+s.w&&p.y-15>=s.y&&p.y+13<=s.y+s.h),'the whole mouth lies inside a supported ground section');
  const parent=nests[0];e.G.en=[parent];e.G.spawnT=9999;e.G.podTrig=[];e.G.s8.drips=[];e.G.camX=600;Object.assign(e.G.p,{x:710,y:176,invT:999});Object.assign(e.G.p2,{x:690,y:176,invT:999});
  parent.fireT=.001;for(let i=0;i<50&&!e.G.en.some(q=>q.t==='whiteFloater');i++)e.updateEnemies();const child=e.G.en.find(q=>q.t==='whiteFloater');assert.ok(child);assert.ok(child.y>176&&child.vy<0);assert.equal(child.emerged,false);
  e.G.freezeT=5;const still=JSON.stringify([parent,child]);ticks(e,25);assert.equal(JSON.stringify([parent,child]),still);e.G.mode='pause';ticks(e,20);assert.equal(JSON.stringify([parent,child]),still);
  const copy=unpackWorld(packWorld(e.G));assert.equal(copy.en[1].mount,'floor');assert.equal(copy.en[1].emerged,false);assert.equal(copy.en[1].launchY,188);
  e.G.mode='play';e.G.freezeT=0;for(let i=0;i<65;i++)e.updateEnemies();assert.ok(child.y<176);assert.equal(child.emerged,true);
  const score=e.G.score;e.G.pb=[{k:'b',x:child.x,y:child.y,vx:0,vy:0,dmg:1}];e.collide();assert.equal(child.dead,true);assert.equal(e.G.score,score+50);
  e.G.pb=[{k:'b',x:parent.x,y:parent.y,vx:0,vy:0,dmg:6}];e.collide();assert.equal(parent.dead,true);assert.equal(e.G.score,score+350);
  e.reset(8);assert.equal(e.G.en.filter(q=>q.t==='ceilingParasite'&&q.mount==='floor'&&q.hp===6&&q.phase==='idle').length,8);assert.equal(e.G.en.filter(q=>q.t==='ceilingParasite'&&q.mount==='ceiling').length,8);assert.equal(e.G.en.some(q=>q.t==='whiteFloater'),false);
});

test('第八关白色漂浮怪能伤害本机及队友，冻结期间接触安全',()=>{
  for(const slot of [1,2]){
    const e=engine();e.play(8,true);const child=ceilingParasites.createWhiteFloater(e.G.en.find(q=>q.t==='ceilingParasite'));Object.assign(child,{x:430,y:160});e.G.en=[child];
    const p=slot===1?e.G.p:e.G.p2;Object.assign(p,{x:430,y:176,invT:0,shieldT:0,dead:false});const other=slot===1?e.G.p2:e.G.p;other.x=200;
    const contact=()=>slot===1?e.collidePlayer():e.withPlayer2(()=>e.collidePlayer());e.G.freezeT=1;contact();assert.equal(p.dead,false);e.G.freezeT=0;contact();assert.equal(p.dead,true);
  }
});

test('第八关关底四个嘴独立吐出粉色幼体，冻结、暂停及联机同步保持机关和幼体进度',()=>{
  const e=engine();e.play(8,true);e.G.en=[];e.G.spawnT=9999;e.G.podTrig=[];e.G.s8.drips=[];e.G.camX=3116;Object.assign(e.G.p,{x:3280,y:176,invT:999});Object.assign(e.G.p2,{x:3250,y:176,invT:999});
  ticks(e,270);const H=e.G.hive,children=e.G.en.filter(q=>q.t==='hiveHatchling');assert.equal(new Set(children.map(q=>q.from)).size,4);assert.ok(children.every(q=>q.hp===1&&!q.dead));
  e.G.freezeT=8;const pose=JSON.stringify([H,children]);ticks(e,30);assert.equal(JSON.stringify([H,children]),pose);e.G.mode='pause';ticks(e,20);assert.equal(JSON.stringify([H,children]),pose);
  const copy=unpackWorld(packWorld(e.G));assert.equal(JSON.stringify(copy.hive),JSON.stringify(H));assert.equal(JSON.stringify(copy.en.filter(q=>q.t==='hiveHatchling')),JSON.stringify(children));
  e.G.mode='play';e.G.freezeT=0;e.step();assert.notEqual(JSON.stringify(children),JSON.stringify(copy.en.filter(q=>q.t==='hiveHatchling')));
  const child=children[0],score=e.G.score;e.G.pb=[{k:'b',x:child.x,y:child.y,vx:0,vy:0,dmg:1}];e.collide();assert.equal(child.dead,true);assert.equal(e.G.score,score+100);
  const port=hiveBrood.hiveBroodParts(H)[0];e.hitBossPart(port,99);const sequence=port.spawnSequence;ticks(e,360);assert.equal(port.spawnSequence,sequence);assert.equal(H.open,false);
  e.reset(8);assert.equal(hiveBrood.hiveBroodRemaining(e.G.hive),4);assert.equal(e.G.en.some(q=>q.t==='hiveHatchling'),false);
});

test('第八关四个孵化机关都能用实际步枪击破，上方机关可跳射，后排机关不会被装饰墙挡弹',()=>{
  const e=engine();e.play(8,false);e.G.en=[];e.G.spawnT=9999;e.G.podTrig=[];e.G.s8.drips=[];e.G.camX=3116;e.G.freezeT=999;
  Object.assign(e.G.p,{x:3328,y:176,onGround:true,invT:999,weapon:'rifle',face:1});const H=e.G.hive,ports=hiveBrood.hiveBroodParts(H);e.K.KeyJ=true;
  for(let i=0;i<500&&ports.some(q=>q.row==='bottom'&&q.hp>0);i++)e.step();assert.ok(ports.filter(q=>q.row==='bottom').every(q=>q.hp<=0),JSON.stringify(ports));assert.equal(H.open,false);
  e.K.KeyW=e.K.KeyD=true;
  e.K.KeyJ=false;ticks(e,30);
  for(let attempt=0;attempt<16&&ports.find(q=>q.k==='broodTR').hp>0;attempt++)for(let i=0;i<65;i++){e.K.KeyK=i===1;e.K.KeyJ=i>=6&&i<12;e.step();}
  assert.ok(ports.find(q=>q.k==='broodTR').hp<=0,'a diagonal jump shot passes over the closed brain to the rear ceiling mouth');e.K.KeyJ=true;
  for(let i=0;i<1000&&!H.open;i++){e.K.KeyK=i%107===1||i%107===15;e.step();}
  assert.equal(H.open,true,JSON.stringify(ports));assert.ok(ports.every(q=>q.hp<=0));assert.equal(H.parts[2].hp,80);assert.equal(e.G.p.dead,false);
});

test('第八关粉色幼体能伤害本机与队友，冰冻期间接触安全',()=>{
  for(const slot of [1,2]){
    const e=engine();e.play(8,true);const child=hiveBrood.createHiveHatchling(hiveBrood.hiveBroodParts(e.G.hive)[0]);Object.assign(child,{x:3280,y:160});e.G.en=[child];
    const p=slot===1?e.G.p:e.G.p2;Object.assign(p,{x:3280,y:176,invT:0,shieldT:0,dead:false});const other=slot===1?e.G.p2:e.G.p;other.x=3000;
    const contact=()=>slot===1?e.collidePlayer():e.withPlayer2(()=>e.collidePlayer());e.G.freezeT=1;contact();assert.equal(p.dead,false);e.G.freezeT=0;contact();assert.equal(p.dead,true);
  }
});

test('第八关大脑组织时钟跟随战斗，暂停和冰冻保留脉动姿态，联机快照可同步恢复',()=>{
  const e=engine();e.play(8,false);e.G.en=[];e.G.spawnT=9999;e.G.podTrig=[];e.G.s8.drips=[];e.G.p.invT=999;
  ticks(e,30);const time=e.G.hive.tissueTime;assert.ok(time>0);
  e.G.hive.beatK=.6;e.G.hive.mawK=.5;e.G.freezeT=8;const pose=[time,e.G.hive.beatK,e.G.hive.mawK];ticks(e,60);assert.deepEqual([e.G.hive.tissueTime,e.G.hive.beatK,e.G.hive.mawK],pose);
  e.G.mode='pause';ticks(e,60);assert.deepEqual([e.G.hive.tissueTime,e.G.hive.beatK,e.G.hive.mawK],pose);
  const copy=unpackWorld(packWorld(e.G));assert.equal(copy.hive.tissueTime,time);e.G.mode='play';e.G.freezeT=0;e.step();assert.ok(e.G.hive.tissueTime>time);
});

test('第八关异形巢穴包含可射击守卫、孵化巢与关底母巢，并能完成 Boss 战',()=>{
  for(const online of [false,true]){
    const e=engine();e.play(8,online);e.G.p.invT=999;if(online)e.G.p2.invT=999;
    assert.equal(e.G.stage,8);assert.ok(e.G.en.some(o=>o.t==='sac'));assert.ok(e.G.s8.drips.length>0);
    const guardian=e.G.en.find(o=>o.t==='alienHead');assert.ok(guardian);e.G.camX=guardian.x-260;e.G.p.x=guardian.x-100;
    if(online)e.G.p2.x=guardian.x-120;
    for(let i=0;i<130&&!e.G.en.some(b=>b.t==='guardianFlyer');i++)e.step();
    assert.ok(e.G.en.some(b=>b.t==='guardianFlyer'),'guardian emits shootable flying larvae');
    const hitbox={x:guardian.x,y:guardian.y};e.G.pb=[{k:'b',x:hitbox.x,y:hitbox.y,vx:0,vy:0,dmg:30}];e.collide();assert.ok(guardian.dead,'guardian can be destroyed by normal shots');
    e.G.en=[];e.G.eb=[];e.G.camX=3116;e.G.p.x=3280;if(online)e.G.p2.x=3255;e.G.p.invT=999;if(online)e.G.p2.invT=999;
    e.step();const hive=e.G.hive;assert.equal(hive.active,true);e.G.freezeT=999;
    const heart=hive.parts[2],ports=hiveBrood.hiveBroodParts(hive);assert.equal(ports.length,4);e.hitBossPart(heart,999);assert.equal(heart.hp,heart.max,'closed ribs protect the heart');
    for(const [i,part]of ports.entries()){
      e.G.pb=[{k:'b',x:part.x+part.w/2,y:part.y+part.h/2,vx:0,vy:0,dmg:100}];e.collide();assert.ok(part.hp<=0);if(i<3)assert.equal(hive.open,false,'all four organs must be destroyed');
    }
    assert.equal(hive.open,true);
    e.G.pb=[{k:'b',x:heart.x+heart.w/2,y:heart.y+heart.h/2,vx:0,vy:0,dmg:100}];e.collide();assert.equal(hive.dead,true);
    assert.doesNotThrow(()=>e.render());for(let i=0;i<310&&e.G.mode==='play';i++)e.step();
    assert.equal(e.G.mode,'cine');assert.equal(e.G.cine.kind,'end');
    const stats=[e.G.score,e.G.time,e.G.deaths,e.G.lives];
    for(let i=0;i<2642&&e.G.mode==='cine';i++){e.step();if(i%240===0)assert.doesNotThrow(()=>e.render());}
    assert.equal(e.G.mode,'clear');assert.equal(e.G.cine,null);assert.deepEqual([e.G.score,e.G.time,e.G.deaths,e.G.lives],stats);
    assert.equal(e.element('clearTitle').textContent,'前八关通关');
  }
});

test('第八关黏液按凝结、脱落和落地扩散推进，暂停及冻结保留状态',()=>{
  const e=engine();e.play(8,true);e.G.en=[];e.G.spawnT=9999;e.G.p.invT=e.G.p2.invT=999;
  e.G.s8.drips=[{x:200,per:2,off:0,k:0,forming:false}];e.G.s8.tissueTime=1.7;
  e.step();assert.equal(e.G.s8.drips[0].forming,true);assert.ok(e.G.s8.drips[0].k>.6);
  ticks(e,20);assert.ok(e.G.s8.drops.length>0);const drop=e.G.s8.drops[0];assert.ok(drop.age>0);
  const pose=JSON.stringify(e.G.s8);e.G.mode='pause';ticks(e,20);assert.equal(JSON.stringify(e.G.s8),pose);
  e.G.mode='play';e.G.freezeT=9;ticks(e,30);assert.equal(JSON.stringify(e.G.s8),pose);
  const copy=unpackWorld(packWorld(e.G));assert.deepEqual(JSON.parse(JSON.stringify(copy.s8)),JSON.parse(pose));
  e.G.freezeT=0;e.G.s8.drips=[];ticks(e,65);assert.equal(e.G.s8.drops.length,0);assert.ok(e.G.fx.some(f=>f.k==='slimeSplash'));
  e.G.s8.drops=[{x:40,y:160,vy:100,age:.4}];e.G.p2.x=40;e.G.p2.y=176;e.G.p2.invT=0;e.G.freezeT=3;
  e.collidePartnerHazards();assert.equal(e.G.p2.dead,false);assert.equal(e.G.s8.drops[0].dead,undefined);
  e.G.freezeT=0;e.collidePartnerHazards();assert.equal(e.G.p2.dead,true);
});

test('第八关结尾可由本机或队友跳过，联机快照保留播放进度且不重置成绩',()=>{
  for(const partner of [false,true]){
    const e=engine();e.play(8,partner);e.G.score=123450;e.G.time=180.5;e.G.deaths=2;e.G.lives=4;e.G.p.weapon='spread';
    e.stageClear();assert.equal(e.G.mode,'cine');assert.equal(e.G.cine.kind,'end');
    e.K.KeyJ=true;e.step();assert.equal(e.G.mode,'cine','initial held shot cannot immediately skip');e.K.KeyJ=false;
    ticks(e,80);const snapshot=unpackWorld(packWorld(e.G));assert.equal(snapshot.mode,'cine');assert.equal(snapshot.cine.kind,'end');assert.equal(snapshot.cine.t,e.G.cine.t);assert.equal(e.inspect().audio.resolved.track,'synth');
    if(partner)e.coop.remote.push(encodeInput({fire:true}));else e.K.Enter=true;e.step();
    assert.equal(e.G.mode,'clear');assert.deepEqual([e.G.score,e.G.time,e.G.deaths,e.G.lives,e.G.p.weapon],[123450,180.5,2,4,'spread']);assert.equal(e.element('btnNext').hidden,true);
  }
});

test('第八关地形可从入口通过跳跃和二段跳到达母巢前',()=>{
  const e=engine();e.play(8,false);const guardian=e.G.en.find(e=>e.t==='alienHead');e.damageEnemy(guardian,999,guardian.x,guardian.y);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.s8.drips=[];e.G.p.invT=9999;e.K.KeyD=true;
  const gaps=[[640,700],[1100,1160],[1500,1580],[2000,2060],[2500,2580]],used=new Set();let secondJumpAt=-1;
  for(let tick=0;tick<5000&&e.G.p.x<3180&&!e.G.p.dead;tick++){
    e.K.KeyK=false;
    for(const [i,[left]] of gaps.entries())if(!used.has(i)&&e.G.p.onGround&&e.G.p.x>=left-31&&e.G.p.x<left-3){
      used.add(i);e.K.KeyK=true;secondJumpAt=tick+15;break;
    }
    if(tick===secondJumpAt&&!e.G.p.onGround)e.K.KeyK=true;
    e.step();
  }
  assert.equal(e.G.p.dead,false);assert.ok(e.G.p.x>=3180,`reached x=${e.G.p.x}`);assert.equal(used.size,gaps.length);
});

test('第六关机器人脚部接触安全，躯干碰撞对双人有效且冻结时无伤害',()=>{
  const e=engine();e.play(6,true);e.G.en=[];e.G.jets=[];e.G.s6.waves=[];
  const b=e.G.golem,p=e.G.p2;Object.assign(p,{x:b.x,y:b.y,invT:0,dead:false});
  e.collidePartnerHazards();assert.equal(p.dead,false);
  b.active=true;e.G.freezeT=1;e.collidePartnerHazards();assert.equal(p.dead,false);
  e.G.freezeT=0;e.collidePartnerHazards();assert.equal(p.dead,false,'touching the feet does not kill');
  p.y=b.y-40;e.G.freezeT=1;e.collidePartnerHazards();assert.equal(p.dead,false);
  e.G.freezeT=0;e.collidePartnerHazards();assert.equal(p.dead,true,'torso contact still hurts');
  Object.assign(p,{dead:false,invT:0});b.dead=true;e.collidePartnerHazards();assert.equal(p.dead,false);
  for(const online of [false,true]){
    const f=engine();f.play(6,online);f.G.en=[];f.G.jets=[];f.G.podTrig=[];f.G.spawnT=9999;f.G.camX=2916;
    const boss=f.G.golem;boss.active=true;boss.phaseT=999;boss.shotT=999;
    Object.assign(f.G.p,{x:boss.x,y:boss.y,onGround:true,invT:0});if(online)Object.assign(f.G.p2,{x:boss.x+8,y:boss.y,onGround:true,invT:0});
    f.step();assert.equal(f.G.p.dead,false);if(online)assert.equal(f.G.p2.dead,false);
    Object.assign(f.G.p,{y:boss.y-40,onGround:false,vy:0,invT:0});f.step();assert.equal(f.G.p.dead,true);
  }
});

test('第六关机器人使用独立起跳动作帧，站立与落地贴合地面且不拉伸',()=>{
  const b=stageSixBoss.createStageSixBoss(100),idle=stageSixBoss.stageSixBossSpritePose(b);
  const sole=(x,y)=>idle.offsetY+Math.sin(idle.rotation)*idle.width*(x/600-.5)+Math.cos(idle.rotation)*idle.height*(y/506-1);
  assert.ok(Math.abs(sole(84,478))<1e-8);assert.ok(Math.abs(sole(526,493))<1e-8);
  const seen=[];
  for(const [phase,vy,y,frame]of [['windup',0,176,'crouch'],['jump',-220,165,'launch'],['jump',-100,125,'tuck'],['jump',0,120,'air'],['jump',90,160,'land'],['land',0,176,'land']]){
    Object.assign(b,{phase,vy,y});const pose=stageSixBoss.stageSixBossSpritePose(b);seen.push(pose.frame);assert.equal(pose.frame,frame);
    if(pose.source){assert.equal(pose.width/pose.source[2],.16);assert.equal(pose.height/pose.source[3],.16);assert.equal(pose.rotation,0);assert.equal(pose.offsetY,0);}
  }
  assert.deepEqual(seen,['crouch','launch','tuck','air','land','land']);
  const bytes=fs.readFileSync(new URL('../../games/contra2026/assets/stage6/humanoid-robot-jump-frames-v1.webp',import.meta.url));
  assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok(bytes[20]&0x10,'frame sheet preserves transparency');
});

test('第五关结算可带着双方武器和生命进入第六关',()=>{
  const e=engine();e.play(5,true);e.G.lives=4;e.G.score=18000;e.G.p.weapon='laser';e.G.p2.weapon='spread';
  e.stageClear();assert.equal(e.G.mode,'clear');assert.equal(e.element('btnNext').hidden,false);
  e.element('btnNext').onclick();assert.equal(e.G.stage,6);assert.equal(e.G.mode,'intro');assert.equal(e.G.lives,4);
  assert.equal(e.G.score,18000);assert.equal(e.G.p.weapon,'laser');assert.equal(e.G.p2.weapon,'spread');
});

test('第五关固定炮位有人操作、树后敌人投雷，离屏不攻击且冰冻停止装填',()=>{
  const e=engine();e.play(5,false);e.G.p.invT=9999;e.G.podTrig=[];e.G.spawnT=9999;
  const guns=e.G.en.filter(u=>u.t==='artillery'),rear=e.G.en.filter(u=>u.t==='grenadier');assert.equal(guns.length,7);assert.equal(rear.length,7);
  for(const gun of guns)assert.ok(e.solids.some(s=>gun.x>=s.x&&gun.x<=s.x+s.w&&gun.y===s.y));
  const far=guns.at(-1),offscreenTimer=far.phaseT,seen=new Set();
  for(let i=0;i<260;i++){e.step();for(const b of e.G.eb)if(b.snowOrdnance)seen.add(b.snowOrdnance);}
  assert.ok(seen.has('shell'));assert.ok(seen.has('grenade'));assert.equal(far.phaseT,offscreenTimer);
  e.G.eb=[];e.G.freezeT=2;const timers=JSON.stringify(e.G.en.filter(u=>['artillery','grenadier'].includes(u.t)).map(u=>[u.phase,u.phaseT,u.peek]));
  for(let i=0;i<45;i++)e.step();assert.equal(e.G.eb.length,0);assert.equal(JSON.stringify(e.G.en.filter(u=>['artillery','grenadier'].includes(u.t)).map(u=>[u.phase,u.phaseT,u.peek])),timers);
  const gun=e.G.en.find(u=>u.t==='artillery');e.damageEnemy(gun,8,gun.x,gun.y-15);assert.equal(gun.dead,true);
});

test('击毁中途战车不会清除后半段守军，也不会让角色永久无敌',()=>{
  const e=engine();e.play(5,false);e.G.camX=3016;e.G.p.x=3120;e.G.p.invT=0;
  const rear=e.G.en.filter(u=>u.x>3400);e.hitTank(e.G.tank.parts[2],999);
  assert.ok(rear.length>=6);assert.ok(rear.every(u=>!u.dead));e.killPlayer();assert.equal(e.G.p.dead,true);
});

test('最终空中堡垒可被正常向上射击命中，战机与云层不参与角色伤害',()=>{
  const e=engine();e.play(5,false);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.tank.dead=true;e.G.tank.deadT=0;
  const F=e.G.fortress;Object.assign(F,{active:true,entryT:0,home:4750,x:4750,y:68,phase:'hover',phaseT:999});
  Object.assign(e.G.p,{x:4770,y:176,onGround:true,invT:999,weapon:'laser'});e.G.camX=4616;e.K.ArrowUp=true;e.K.KeyJ=true;
  for(let i=0;i<90;i++)e.step();assert.ok(F.parts[2].hp<90,'ordinary player bullets hit the exposed engine');assert.equal(e.G.p.dead,false);
});

test('第五关敌方手雷落地爆炸能伤害角色，护盾可抵挡，树林后身体不阻挡前景行走',()=>{
  const e=engine();e.play(5,false);e.G.en=[];e.G.podTrig=[];e.G.p.invT=9999;
  const bomb={x:100,y:130,vx:20,vy:50,g:250,r:2.6,snowOrdnance:'grenade',fuse:.7,age:0,bounces:0};e.G.eb=[bomb];
  for(let i=0;i<60&&bomb.snowOrdnance!=='blast';i++)e.updateBullets();
  assert.equal(bomb.snowOrdnance,'blast');assert.equal(bomb.bounces,1);assert.ok(e.G.fx.some(f=>f.k==='boom'));
  Object.assign(e.G.p,{x:bomb.x,y:176,invT:0,shieldT:2});e.collidePlayer();assert.equal(e.G.p.dead,false);assert.equal(bomb.dead,true);
  e.G.eb=[{...bomb,dead:false}];e.G.p.shieldT=0;e.collidePlayer();assert.equal(e.G.p.dead,true);
  e.play(5,false);e.G.p.invT=0;e.G.en=[{t:'grenadier',x:e.G.p.x,y:176,hp:2,face:-1,peek:1}];e.G.eb=[];e.collidePlayer();assert.equal(e.G.p.dead,false);
});

test('第五关使用热成像镜立即改变晴天画面，到期恢复正常且不新增资源加载',async()=>{
  const e=engine({previewStage5:true,coldResources:true});e.referenceMusic.prefetch=async()=>{};await e.startStage(5);e.play(5,false);
  e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.p.invT=999;e.G.inv=['v'];e.G.sel=0;
  const resources=e.resourceCache.size;e.useSpecial();assert.equal(e.G.p.thermT,15);e.render();
  assert.equal(e.inspect().art.thermal.active,true);assert.ok(e.inspect().art.thermal.converted>0);assert.equal(e.G.s5.bliz,0);
  assert.equal(e.stageFiveArt.thermalPainting,false);assert.equal(e.stageFiveArt.hdActors.frameEffect,undefined);
  e.element('game').getContext('2d').canvas=e.element('game');
  e.resizeWindow(3840,2160);e.render();assert.deepEqual([...e.inspect().art.resolution],[3840,2160]);
  assert.equal(e.stageFiveArt.thermalView.width,1536);assert.equal(e.stageFiveArt.thermalView.height,864);
  e.G.p.thermT=.01;e.step();e.render();assert.equal(e.inspect().art.thermal.active,false);assert.equal(e.resourceCache.size,resources);
});

test('自动进入第三关先等待本关音乐，暂停旧场景并保留武器、道具和生命',async()=>{
  const e=engine({coldResources:true}),song=pendingResource(),requests=[];
  e.referenceMusic.prefetch=key=>{requests.push(key);return song.promise;};
  e.play(2,false);e.G.p.weapon='laser';e.G.inv=['mushroom','h'];e.G.lives=17;e.G.score=12345;
  const player=e.G.p,loading=e.startStage(3,true);
  assert.equal(e.G.mode,'loading');assert.equal(e.G.stage,2);const time=e.G.time;e.step();assert.equal(e.G.time,time);
  await new Promise(setImmediate);assert.deepEqual(requests,['stage3']);assert.equal(e.G.p,player);
  song.resolve();assert.equal(await loading,true);assert.equal(e.G.stage,3);assert.equal(e.G.mode,'intro');
  assert.equal(e.G.p.weapon,'laser');assert.deepEqual([...e.G.inv],['mushroom','h']);assert.equal(e.G.lives,17);assert.equal(e.G.score,12345);
  assert.equal(e.stageResourcesReady(3),true);e.startStage(3);assert.equal(e.G.mode,'intro');assert.deepEqual(requests,['stage3']);
});

test('双人玩家加载目标关卡时保留最新快照，加载完才切换画面，忽略房主的加载中快照',async()=>{
  const host=engine(),guest=engine({coldResources:true}),song=pendingResource();
  guest.referenceMusic.prefetch=()=>song.promise;guest.play(1,true);guest.coop.role='guest';
  host.play(3,true);host.G.p2.x=101;
  const sync=()=>guest.coop.callbacks.state(JSON.parse(JSON.stringify(packWorld([host.G,host.solids,host.BRIDGES,host.SET]))));
  host.G.mode='loading';sync();assert.equal(guest.G.stage,1);assert.equal(guest.G.mode,'play');
  host.G.mode='play';sync();assert.equal(guest.G.stage,1);assert.equal(guest.G.mode,'loading');
  host.G.p2.x=147;host.G.score=9000;sync();song.resolve();
  for(let i=0;i<8&&guest.G.mode==='loading';i++)await new Promise(setImmediate);
  assert.equal(guest.G.stage,3);assert.equal(guest.G.mode,'play');assert.equal(guest.G.p2.x,147);assert.equal(guest.G.score,9000);
});

test('取消关卡加载或联机退出后，迟到的下载不会重新进入游戏',async()=>{
  const e=engine({coldResources:true}),song=pendingResource();e.referenceMusic.prefetch=()=>song.promise;
  const loading=e.startStage(4);await new Promise(setImmediate);e.cancelLoading();assert.equal(e.G.mode,'title');
  song.resolve();assert.equal(await loading,false);assert.equal(e.G.mode,'title');assert.equal(e.G.stage,1);
});

test('加入房间先查询真实关卡，未开始游戏前不下载选择器中的关卡',async()=>{
  const e=engine({coldResources:true}),requests=[];e.referenceMusic.prefetch=async key=>requests.push(key);
  e.coop.join=async code=>assert.equal(code,'ABC234');e.element('coopCode').value='ABC234';e.element('coopStage').value='1';
  await e.element('coopJoinForm').onsubmit({preventDefault(){}});
  assert.equal(e.inspect().resources.total,0);assert.equal(e.resourceCache.size,0);assert.deepEqual(requests,[]);
});

test('第四关四个房间需解除防护才能破门，前进时清空弹道，随后进入四装置中枢',()=>{
  const e=engine();e.play(4,false);e.G.p.invT=9999;
  for(let room=0;room<4;room++){
    const B=e.G.base;assert.equal(B.room,room);assert.ok(!B.def.boss);
    const core=B.targets.find(t=>t.k==='core');e.hitTarget(core,99);assert.equal(core.hp,12,'cannot bypass the defenses');
    for(const t of B.targets.filter(t=>t.k!=='core'))e.hitTarget(t,99);
    e.hitTarget(core,99);assert.equal(B.cleared,true);assert.equal(e.G.items.length,0);
    B.clearT=0;e.step();assert.ok(B.trans>0);
    e.G.pb=[{k:'b'}];e.G.eb=[{base:true}];e.G.gr=[{base:true}];e.step();
    assert.equal(e.G.pb.length+e.G.eb.length+e.G.gr.length,0);
    for(let i=0;i<85&&e.G.base.room===room;i++)e.step();assert.equal(e.G.base.room,room+1);
  }
  assert.equal(e.G.base.bossPhase,'devices');assert.equal(e.G.base.targets.length,4);assert.equal(e.G.base.def.boss,'twin');
});

test('第四关关闭护板挡住所有弹种和爆炸，冻结停住护板，EMP 不会打开机械装甲',()=>{
  const e=engine();e.play(4,false);e.loadRoom(4);e.G.p.invT=9999;
  const B=e.G.base,target=B.targets[1];
  for(let i=0;i<240&&!baseFour.stageFourFacilityClosed(target);i++)e.step();assert.equal(baseFour.stageFourFacilityClosed(target),true);
  e.G.freezeT=99;e.G.empT=99;const hp=target.hp,aperture=target.aperture;
  e.hitTarget(target,99);e.baseBlast(target.x+target.w/2,target.y+target.h/2);assert.equal(target.hp,hp);
  for(const k of ['b','sp','laser','fire','msl']){
    e.G.pb=[{k,t:.99,spd:1,x0:192,y0:166,x:192,y:166,xe:target.x+target.w/2,ye:target.y+target.h/2,dmg:99}];e.step();assert.equal(target.hp,hp,k);
  }
  assert.equal(target.aperture,aperture);e.G.freezeT=0;
  for(let i=0;i<240&&baseFour.stageFourFacilityClosed(target);i++)e.step();assert.equal(baseFour.stageFourFacilityClosed(target),false);
  e.G.freezeT=99;e.G.pb=[{k:'b',t:.99,spd:1,x0:192,y0:166,x:192,y:166,xe:target.x+target.w/2,ye:target.y+target.h/2,dmg:1}];e.step();assert.equal(target.hp,hp-1);
});

test('第四关两层侧门守军实际进入并开火，冻结及双人快照保留同一开合和波次状态',()=>{
  const e=engine();e.play(4,true);e.loadRoom(4);e.G.p.invT=e.G.p2.invT=9999;const B=e.G.base,tiers=new Set();
  for(let i=0;i<500;i++){e.step();for(const b of e.G.eb)if(b.galleryTier!==undefined)tiers.add(b.galleryTier);assert.ok(B.gallery.length<=4);}
  assert.equal(tiers.size,2);assert.ok(B.galleryId>=4);assert.ok(B.gallery.length>0);
  const before=JSON.stringify({gallery:B.gallery,timers:B.galleryTimers,clock:B.shutterTime,apertures:B.targets.map(t=>t.aperture)});e.G.freezeT=10;e.G.eb=[];ticks(e,60);
  assert.equal(JSON.stringify({gallery:B.gallery,timers:B.galleryTimers,clock:B.shutterTime,apertures:B.targets.map(t=>t.aperture)}),before);assert.equal(e.G.eb.length,0);
  const copy=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));assert.deepEqual(copy.base.gallery,B.gallery);assert.deepEqual(copy.base.targets.map(t=>t.aperture),B.targets.map(t=>t.aperture));
});

test('第四关真实子弹击中楼层内可见守军，重复弹丸不重复计分，清场停止后续出兵',()=>{
  const e=engine();e.play(4,false);e.loadRoom(4);e.G.p.invT=9999;ticks(e,210);const B=e.G.base,s=B.gallery.find(s=>s.tier===1&&s.side<0);
  assert.ok(s);const score=e.G.score;
  e.G.pb=Array.from({length:2},()=>({k:'b',t:.99,spd:1,x0:192,y0:166,x:192,y:166,xe:s.x,ye:s.y-12,dmg:1}));e.step();assert.equal(s.dead,true);assert.equal(e.G.score-score,100);
  e.loadRoom(0);ticks(e,150);assert.ok(B.gallery.length>0);
  for(const t of B.targets.filter(t=>t.k!=='core')){t.aperture=1;e.hitTarget(t,999);}const core=B.targets.find(t=>t.k==='core');core.aperture=1;e.hitTarget(core,999);
  assert.equal(B.cleared,true);assert.equal(B.gallery.length,0);ticks(e,60);assert.equal(B.gallery.length,0);
});

test('第四关高位装置挡住地面弹道；真实跳跃射击启动双生投影，上举追踪弹可完成战斗',()=>{
  const e=engine();e.play(4,false);e.loadRoom(4);e.G.p.invT=9999;
  const B=e.G.base,high=B.targets[0];for(const t of B.targets.slice(1))e.hitTarget(t,99);
  e.K.KeyJ=true;ticks(e,180);assert.equal(high.hp,7);assert.equal(B.bossPhase,'devices');
  for(let i=0;i<1200&&high.hp>0;i++){e.K.KeyK=i%55===0;e.step();}
  e.K.KeyK=false;assert.ok(high.hp<=0);for(let i=0;i<100&&B.bossPhase!=='twins';i++)e.step();
  assert.equal(B.bossPhase,'twins');assert.equal(B.targets.filter(t=>t.k==='twin').length,2);
  e.K.KeyW=true;e.G.p.weapon='homing';
  for(let i=0;i<2400&&!B.dead;i++){
    const target=B.targets.find(t=>t.k==='twin'&&t.hp>0);e.G.p.x=Math.max(28,Math.min(356,192+2*(target.x+target.w/2-192)));e.step();
  }
  assert.equal(B.dead,true);assert.equal(e.G.p.dead,false);assert.equal(e.G.pb.length+e.G.eb.length+e.G.gr.length,0);
  e.K.KeyJ=e.K.KeyW=false;ticks(e,100);assert.equal(B.exitReady,true);assert.equal(e.G.mode,'play','must board a lift to finish');
  e.K.KeyA=true;for(let i=0;i<500&&e.G.mode==='play';i++)e.step();
  assert.equal(e.G.stage,5);assert.equal(e.G.mode,'intro');assert.equal(e.G.p.weapon,'homing');
});

test('第四关投影冻结时不移动、不发弹；快照保留实体状态，两人须分别完成升降梯',()=>{
  const e=engine();e.play(4,true);e.loadRoom(4);for(const t of e.G.base.targets)e.hitTarget(t,99);
  ticks(e,90);const B=e.G.base,twins=B.targets.filter(t=>t.k==='twin');
  const ghost=twins.find(t=>!t.solid);assert.ok(ghost);e.hitTarget(ghost,5);assert.equal(ghost.hp,30,'scattered projections cannot be damaged');
  e.G.freezeT=10;e.G.eb=[];
  const before=JSON.stringify(twins);ticks(e,60);assert.equal(JSON.stringify(twins),before);assert.equal(e.G.eb.length,0);
  const copy=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));assert.equal(copy.base.bossPhase,'twins');assert.equal(copy.base.targets.at(-1).solid,twins.at(-1).solid);
  e.G.freezeT=0;for(const twin of twins){twin.solid=true;e.hitTarget(twin,99);}ticks(e,100);
  e.G.p.x=28;e.step();ticks(e,180);assert.equal(e.G.p.liftDone,true);assert.equal(e.G.mode,'play');
  e.G.p2.x=356;e.step();for(let i=0;i<280&&e.G.mode==='play';i++)e.step();assert.equal(e.G.stage,5);assert.equal(e.G.mode,'intro');
  const guest=engine();guest.play(4,true);guest.coop.role='guest';guest.coop.callbacks.state(JSON.parse(JSON.stringify(packWorld([e.G,e.solids,e.BRIDGES,e.SET]))));
  assert.equal(guest.G.stage,5);assert.equal(guest.G.mode,'intro');
});

test('第四关手柄上方向和射击组合使用举枪姿势并发射顶部弹道',()=>{
  let pads=[];const e=engine({getGamepads:()=>pads});e.play(4,false);e.loadRoom(4);e.G.p.invT=9999;
  for(const target of e.G.base.targets)e.hitTarget(target,99);ticks(e,90);
  pads=[{index:0,id:'Xbox Wireless Controller',connected:true,mapping:'standard',axes:[0,-.9],buttons:Array.from({length:17},(_,i)=>({pressed:i===2,value:i===2?1:0}))}];
  e.step();assert.equal(e.G.p.aimUp,true);assert.ok(e.G.pb.some(b=>b.upward&&b.ye<80));
});

test('公开入口开放前八关，旧秘籍与隐藏按钮不能启动后续关卡',()=>{
  const e=engine();e.play(1,false);e.G.p.weapon='laser';const player=e.G.p;
  for(const stage of [0,9,16,17,'2',1.5]){
    assert.equal(e.startStage(stage),false);assert.equal(e.G.stage,1);assert.equal(e.G.mode,'play');assert.equal(e.G.p,player);
  }
  assert.equal(e.startUWOpening(false),false);e.unlockUW('old cheat');
  assert.equal(e.G.stage,1);assert.equal(e.G.p.weapon,'laser');
  for(let stage=9;stage<=16;stage++){
    const button=e.element(stage<=8?'btnSel'+stage:'btnSelW'+(stage-8));
    assert.equal(button.hidden,true);assert.equal(button.disabled,true);
  }
  assert.equal(e.SET.stageMusic,undefined,'old soundtrack preferences are removed');
  assert.equal(e.element('btnSel7').hidden,false);assert.equal(e.element('btnSel7').disabled,false);
  assert.equal(e.element('btnSel3').hidden,false);assert.equal(e.element('btnSel3').disabled,false);assert.equal(e.element('btnSel5').hidden,false);assert.equal(e.element('btnSel5').disabled,false);
});

test('真实引擎通过手柄移动、射击、跳跃、扔雷、切换道具与暂停，断线释放移动',()=>{
  let snapshot=[];const e=engine({getGamepads:()=>snapshot});
  const input=(buttons=[],axes=[0,0])=>snapshot=[{index:0,id:'Xbox Wireless Controller',mapping:'standard',connected:true,
    buttons:Array.from({length:17},(_,i)=>({pressed:buttons.includes(i),value:buttons.includes(i)?1:0})),axes}];
  const tick=(buttons=[],axes=[0,0],count=1)=>{input(buttons,axes);for(let i=0;i<count;i++)e.step();};
  e.play(3,false);e.G.en=[];e.G.podTrig=[];e.G.s3.rockT=e.G.s3.runT=9999;e.G.p.invT=9999;tick();
  const x=e.G.p.x;tick([2],[.8,0],10);assert.ok(e.G.p.x>x);assert.ok(e.G.pb.length>0);
  tick();tick([0]);assert.ok(e.G.p.vy<0);assert.equal(e.G.p.onGround,false);
  tick();tick([1]);assert.ok(e.G.nadeCd>0);assert.ok(e.G.gr.length>0);assert.equal(e.G.mode,'play','B 是游戏中的手雷，不会误触暂停');
  e.G.inv=['h','t'];e.G.sel=0;tick();tick([4]);assert.equal(e.G.sel,1);
  tick();tick([3]);assert.ok(e.G.gr.some(g=>g.tnt));assert.deepEqual([...e.G.inv],['h']);
  tick();tick([2],[0,-.9]);assert.equal(e.G.p.ay,-1);
  tick();tick([9]);assert.equal(e.G.mode,'pause');tick();tick([1]);assert.equal(e.G.mode,'play');
  tick([2],[.8,0]);snapshot=[];e.step();assert.equal(e.G.p.vx,0);
  tick();tick([8]);assert.equal(e.G.mode,'pause');
});

const enterLifeCode=e=>{for(const code of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA','KeyB','KeyA'])e.dispatchDocument('keydown',{code});};

test('第三关红蓝双人都使用新头盔精灵，停止效果后不再绘制',()=>{
  const e=engine();e.play(3,true);
  const helmet={naturalWidth:512,naturalHeight:331},calls=[];
  e.stageThreeArt.images.impactHelmet=helmet;
  e.stageOneArt.images.actorRed={naturalWidth:1086,naturalHeight:1448};
  e.stageOneArt.images.actorBlue={naturalWidth:1086,naturalHeight:1448};
  e.stageThreeArt.g.drawImage=image=>{if(image===helmet)calls.push(image);};
  for(const p of [e.G.p,e.G.p2]){p.helmT=10;p.invT=0;}
  e.G.p2.face=-1;e.render();assert.equal(calls.length,2);
  calls.length=0;e.G.p.helmT=e.G.p2.helmT=0;e.render();assert.equal(calls.length,0);
});
test('正式网站默认有限生命，本机测试默认无限生命，各自保存的选择仍然生效',()=>{
  for(const savedSettings of [null,{v:2,inf:'on'},{v:2,inf:'off'}]){
    const e=engine({hostname:'example.github.io',savedSettings});e.play(1,false);assert.equal(e.infiniteLives(),false);assert.equal(e.G.lives,3);
    e.G.p.invT=0;e.killPlayer();assert.equal(e.G.lives,2);assert.equal(e.SET.v,3);
  }
  for(const hostname of ['localhost','127.0.0.1','[::1]','::1']){
    const e=engine({hostname});e.play(1,false);e.G.p.invT=0;e.killPlayer();assert.equal(e.infiniteLives(),true);assert.equal(e.G.lives,3);
  }
  const chosen=engine({hostname:'example.github.io',savedSettings:{v:3,inf:'on'}});chosen.play(1,false);assert.equal(chosen.infiniteLives(),true);
  const localFinite=engine({savedSettings:{v:3,inf:'off'}});localFinite.play(1,false);assert.equal(localFinite.infiniteLives(),false);
  const easy=engine({hostname:'example.github.io',savedSettings:{v:3,inf:'off',diff:'easy'}});easy.play(1,false);assert.equal(easy.G.lives,5);
});

test('首关不下载旧跑步图集，单人及双人仍用共享肢体绘制跑步',async()=>{
  const e=engine({coldResources:true});e.referenceMusic.prefetch=async()=>{};await e.startStage(1);
  for(const key of ['runRed','runBlue','runEnemy'])assert.equal(e.stageOneArt.loaded.has(key),false);
  assert.equal(e.stageOneArt.loaded.has('runLimbs'),true);assert.equal(e.stageOneArt.ready,true);
  for(const online of [false,true]){
    e.play(1,online);e.K.KeyD=true;ticks(e,10);e.render();
    assert.ok(e.stageOneArt.hdActors.movingFrames.size>0);
  }
});

test('PC 标题秘籍让前五关以 30 条有限生命开局，扣命与切关继承正常且不覆盖无限生命偏好',()=>{
  const e=engine();e.SET.inf='on';enterLifeCode(e);assert.equal(e.inspect().lives.armed,true);
  assert.match(e.element('btnStart').textContent,/30 条命/);e.play(1,false);
  assert.equal(e.G.lives,30);assert.equal(e.G.thirtyLives,true);assert.equal(e.infiniteLives(),false);assert.equal(e.SET.inf,'on');
  assert.equal(e.gameplaySettings().inf,'off');e.syncSettingsUI();assert.equal(e.element('set-inf-on').disabled,true);assert.equal(e.element('set-inf-off').checked,true);
  e.G.p.invT=0;e.killPlayer();assert.equal(e.G.lives,29);e.reset(2,true);assert.equal(e.G.lives,29);e.reset(3,true);assert.equal(e.G.lives,29);
  e.reset(3,false);assert.equal(e.G.lives,30);e.toTitle();assert.equal(e.G.thirtyLives,false);assert.equal(e.infiniteLives(),true);assert.equal(e.SET.inf,'on');assert.equal(e.G.lives,3);
  e.syncSettingsUI();assert.equal(e.element('set-inf-on').disabled,false);assert.equal(e.element('set-inf-on').checked,true);
});
test('手机标题 Logo 八次轻点激活，鼠标、区域外点击与滑动不能激活',()=>{
  const e=engine(),tap=(pointerType='touch',x=592,upX=x)=>{
    e.dispatchDocument('pointerdown',{pointerType,pointerId:1,isPrimary:true,clientX:x,clientY:80});
    e.dispatchDocument('pointerup',{pointerType,pointerId:1,clientX:upX,clientY:80});
  };
  for(let i=0;i<8;i++)tap('mouse');assert.equal(e.inspect().lives.armed,false);
  for(let i=0;i<8;i++)tap('touch',0);assert.equal(e.inspect().lives.armed,false);
  for(let i=0;i<8;i++)tap('touch',592,640);assert.equal(e.inspect().lives.armed,false);
  for(let i=0;i<7;i++)tap();assert.equal(e.inspect().lives.armed,false);tap();assert.equal(e.inspect().lives.armed,true);
  for(let i=0;i<8;i++)tap();e.play(2,false);assert.equal(e.G.lives,30);assert.equal(e.infiniteLives(),false);
});
test('游玩中不能输入秘籍补命，生命用完仍会结束；回到标题后旧秘籍不会开放后续关卡',()=>{
  const e=engine();e.play(1,false);enterLifeCode(e);assert.equal(e.inspect().lives.armed,false);
  e.toTitle();enterLifeCode(e);e.play(1,false);e.G.lives=1;e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;e.G.p.invT=0;e.killPlayer();
  assert.equal(e.G.lives,0);for(let i=0;i<180&&e.G.mode==='play';i++)e.step();assert.equal(e.G.mode,'over');
  e.toTitle();assert.equal(e.inspect().lives.armed,false);assert.equal(e.element('btnStart').textContent,'单人闯关');
  for(let stage=9;stage<=16;stage++)assert.equal(e.startStage(stage),false);assert.equal(e.G.stage,1);
});
test('双人快照传递 30 命模式，客机 HUD 使用相同有限生命规则',()=>{
  const host=engine(),guest=engine();enterLifeCode(host);host.play(2,true);guest.play(2,true);guest.coop.role='guest';
  guest.coop.callbacks.state(JSON.parse(JSON.stringify(packWorld([host.G,host.solids,host.BRIDGES,host.SET]))));
  assert.equal(guest.G.lives,30);assert.equal(guest.G.thirtyLives,true);assert.equal(guest.infiniteLives(),false);assert.equal(guest.gameplaySettings().inf,'off');
});

test('第三关使用真实移动和二段跳可从起点攀登至山顶，镜头只向上且无坠落',()=>{
  for(const startTime of [0,4,11,21]){
  const e=engine();e.play(3,false);e.G.en=[];e.G.podTrig=[];e.G.s3.rockT=e.G.s3.runT=9999;e.G.p.invT=9999;
  e.G.time=startTime;
  let target=null,airTicks=0,previousCamera=0;
  const visited=new Set(),stones=new Set();
  for(let frame=0;frame<14000&&!e.G.mech.active;frame++){
    const p=e.G.p;
    if(p.onGround){
      visited.add(Math.round(p.y));if(p.support?.drift)stones.add(p.support.id);airTicks=0;
      const above=e.solids.filter(s=>s.y<p.y-5&&s.y>=p.y-104).sort((a,b)=>b.y-a.y||Math.abs((a.x+a.w/2)-p.x)-Math.abs((b.x+b.w/2)-p.x));
      target=above[0];
      if(!target)break;
    }
    if(!target)break;
    const tx=Math.max(target.x+12,Math.min(target.x+target.w-12,p.x));
    e.K.KeyA=p.x>tx+1.5;e.K.KeyD=p.x<tx-1.5;
    if(p.onGround){e.K.KeyK=Math.abs(tx-p.x)<82&&frame%2===0;}
    else{airTicks++;e.K.KeyK=airTicks===21;}
    e.step();
    assert.ok(e.G.camY<=previousCamera+.001);previousCamera=e.G.camY;
    assert.equal(e.G.deaths,0,JSON.stringify({frame,p:{x:p.x,y:p.y},target,visited:[...visited]}));
  }
  assert.equal(e.G.mech.active,true,JSON.stringify({player:e.G.p,camera:e.G.camY,visited:[...visited]}));
  assert.ok(visited.size>=20);assert.equal(e.G.stage,3);
  assert.deepEqual([...stones].sort(),['drift-0','drift-1','drift-2']);
  }
});

test('第三关三处浮石是上行必经落脚点，移除后任意二段跳时机均跨不过断层',()=>{
  const e=engine();
  for(let gate=0;gate<3;gate++){
    for(let secondJump=2;secondJump<=48;secondJump++){
      e.play(3,false);e.G.en=[];e.G.podTrig=[];e.G.s3.rockT=e.G.s3.runT=9999;
      const stone=e.solids.find(s=>s.id==='drift-'+gate);
      const fixed=e.solids.filter(s=>!s.drift);
      const lower=fixed.filter(s=>s.y>stone.baseY).sort((a,b)=>a.y-b.y)[0];
      const upper=fixed.filter(s=>s.y<stone.baseY).sort((a,b)=>b.y-a.y)[0];
      assert.equal(lower.y-upper.y,144);
      assert.ok(lower.y-stone.baseY<76&&stone.baseY-upper.y<76);
      e.solids.splice(e.solids.indexOf(stone),1);
      const goal=Math.max(upper.x+12,Math.min(upper.x+upper.w-12,lower.x+12));
      Object.assign(e.G.p,{x:Math.max(lower.x+12,Math.min(lower.x+lower.w-12,goal)),y:lower.y,
        vx:0,vy:0,onGround:true,support:lower,invT:9999});
      e.G.camY=lower.y-148;let highest=lower.y;
      for(let frame=0;frame<100&&!e.G.p.dead;frame++){
        const p=e.G.p;e.K.KeyA=p.x>goal+1.5;e.K.KeyD=p.x<goal-1.5;
        e.K.KeyK=frame===0||frame===secondJump;e.step();highest=Math.min(highest,p.y);
        if(frame>secondJump&&p.onGround)break;
      }
      assert.ok(highest>upper.y,JSON.stringify({gate,secondJump,highest,upper:upper.y}));
    }
  }
});

test('第三关喷火桥有熄灭与预警窗口，火柱按世界坐标伤害两名玩家',()=>{
  const bridge=waterfall.FLAME_BRIDGES[0],x=waterfall.flameJetPositions(bridge,2.7)[0];
  assert.equal(waterfall.flameJetBoxes(1.9).filter(b=>b.y+b.h===bridge.y).length,0);
  assert.equal(waterfall.flameJetState(1.9).phase,'warning');assert.equal(waterfall.flameJetState(2.7).phase,'fire');
  for(const slot of [1,2]){
    const e=engine();e.play(3,true);e.G.en=[];e.G.time=2.7;e.G.freezeT=0;
    const p=slot===1?e.G.p:e.G.p2;Object.assign(p,{x,y:bridge.y,onGround:true,invT:0});
    e.updateStage3();assert.equal(p.dead,true);assert.equal(slot===1?e.G.p2.dead:e.G.p.dead,false);
  }
});

test('第三关浮石带动落脚角色，双人快照保留支撑引用，新开局恢复平台位置',()=>{
  const e=engine();e.play(3,true);const rock=e.solids.find(s=>s.drift);
  Object.assign(e.G.p2,{x:rock.x+rock.w/2,y:rock.y,onGround:true,support:rock});
  waterfall.advanceStageThreePlatforms(e.solids,[e.G.p,e.G.p2],2.3);
  assert.ok(Math.abs(e.G.p2.x-rock.x-rock.w/2)<.001);assert.equal(e.G.p2.y,rock.y);
  const [world,platforms]=unpackWorld(JSON.parse(JSON.stringify(packWorld([e.G,e.solids]))));
  assert.equal(world.p2.support,platforms.find(s=>s.id===rock.id));
  const moved=rock.x;e.play(3,false);const fresh=e.solids.find(s=>s.drift);
  assert.equal(fresh.x,fresh.baseX);assert.notEqual(fresh.x,moved);
});

test('第三关固定敌人开局预置，增援仅在接边岩台的屏幕外生成，悬空岩台不刷兵',()=>{
  const e=engine();e.play(3,false);
  for(const [kind,positions]of [['snp',waterfall.STAGE_THREE_SNIPERS],['tur',waterfall.STAGE_THREE_TURRETS]]){
    assert.deepEqual(Array.from(e.G.en.filter(q=>q.t===kind),q=>[q.x,q.y]),positions);
  }
  const ledges=e.solids.filter(s=>s.cliff&&!s.summit&&s.w>=100);
  for(const ledge of ledges){
    e.play(3,false);e.G.en=[];e.G.camY=ledge.y-80;e.G.s3.rockT=9999;e.G.s3.runT=0;e.G.p.invT=9999;
    e.solids.splice(0,e.solids.length,ledge);e.updateStage3();
    const runners=e.G.en.filter(q=>q.t==='run'),edge=ledge.x<=0||ledge.x+ledge.w>=384;
    assert.equal(runners.length,edge?1:0,JSON.stringify(ledge));
    if(!edge)continue;
    const enemy=runners[0];assert.ok(enemy.x<=-28||enemy.x>=412);assert.equal(enemy.y,ledge.y);
    assert.equal(Math.sign(enemy.vx),ledge.x<=0?1:-1);assert.equal(enemy.waterfallEntry.ledge,ledge.id);
  }
});

test('第三关左右增援连续走入并落在同一岩台，入场阶段不悬空下坠或提前射击',()=>{
  for(const side of ['left','right']){
    const e=engine();e.play(3,false);e.G.en=[];e.G.camY=0;e.G.s3.rockT=9999;e.G.s3.runT=0;
    const ledge=e.solids.find(s=>s.cliff&&s.y===84),other={...ledge,x:0,w:120,id:'left-entry'};
    e.solids.splice(0,e.solids.length,side==='left'?other:ledge);e.G.camY=84-80;e.updateStage3();
    const enemy=e.G.en.find(q=>q.t==='run');assert.ok(enemy);const direction=side==='left'?1:-1,initial=enemy.x,anim=enemy.anim;
    let entered=false;
    for(let frame=0;frame<60;frame++){
      const previous=enemy.x;e.updateEnemies();
      assert.ok(Math.abs(enemy.x-previous-direction*62/60)<1e-8,'连续移动，不能跳到屏幕内');
      assert.equal(enemy.y,84);assert.equal(enemy.dead,undefined);assert.equal(enemy.on,true);
      assert.equal(e.G.eb.length,0,'走入岩台前不能射击');
      if(!enemy.waterfallEntry){entered=true;break;}
    }
    assert.ok(entered);assert.ok(direction*(enemy.x-initial)>35);assert.ok(enemy.anim>anim);assert.equal(enemy.sup.y,84);
    for(let frame=0;frame<10;frame++){e.updateEnemies();assert.equal(enemy.y,84);assert.equal(enemy.on,true);}
  }
});

test('第三关入场步兵随闪光冻结，双人快照保留走入阶段，Boss 战停止增援',()=>{
  const e=engine();e.play(3,true);e.G.en=[];e.G.camY=0;e.G.s3.rockT=9999;e.G.s3.runT=0;e.updateStage3();
  const enemy=e.G.en.find(q=>q.t==='run');assert.ok(enemy);e.updateEnemies();
  const before=JSON.stringify(enemy);e.G.freezeT=1;e.updateEnemies();assert.equal(JSON.stringify(enemy),before);
  const [world]=unpackWorld(JSON.parse(JSON.stringify(packWorld([e.G,e.solids]))));
  for(const key of ['x','y','vx','vy','on','anim'])assert.equal(world.en[0][key],enemy[key]);
  assert.deepEqual(world.en[0].waterfallEntry,{...enemy.waterfallEntry});
  e.G.freezeT=0;e.G.mech.active=true;e.G.s3.runT=0;
  const count=e.G.en.length;e.updateStage3();assert.equal(e.G.en.length,count);
});

test('第三关石块预先嵌在岩台侧面，触发后摇晃预警再脱落，冻结与双人快照保持状态',()=>{
  const e=engine();e.play(3,true);e.G.s3.runT=999;
  const rocks=e.G.en.filter(q=>q.t==='rock'&&q.waterfallRock);assert.ok(rocks.length>5);
  for(const rock of rocks){
    const ledge=e.solids.find(s=>s.id===rock.sourceId);assert.ok(ledge?.cliff);
    assert.ok(rock.x-rock.r>=ledge.x&&rock.x+rock.r<=ledge.x+ledge.w);
    assert.ok(Math.abs(rock.y-2*rock.r-ledge.y-1)<1e-8);assert.equal(rock.phase,'embedded');
    assert.ok(rock.r>=13&&rock.r<=16);assert.equal(rock.hp,wallRock.WALL_ROCK_HP);
  }
  e.G.s3.rockT=0;e.updateStage3();const rock=rocks.find(q=>q.phase==='warning');assert.ok(rock);
  assert.equal(rock.warnT,wallRock.WALL_ROCK_WARNING);assert.ok(e.G.s3.rockT>=3.6&&e.G.s3.rockT<=5.2);
  const anchor=[rock.x,rock.y];for(let i=0;i<60;i++)e.updateEnemies();
  assert.equal(rock.phase,'warning');assert.deepEqual([rock.x,rock.y],anchor);assert.ok(rock.warnT>.45);
  const wobble=wallRock.stageThreeRockWobble(rock);assert.ok(Math.abs(wobble.x)+Math.abs(wobble.y)+Math.abs(wobble.angle)>0);
  e.G.freezeT=1;const before=[rock.phase,rock.warnT,rock.x,rock.y];e.updateEnemies();e.updateStage3();assert.deepEqual([rock.phase,rock.warnT,rock.x,rock.y],before);
  const copy=unpackWorld(packWorld(e.G)).en.find(q=>q.sourceId===rock.sourceId);
  assert.equal(copy.phase,'warning');assert.equal(copy.warnT,rock.warnT);assert.equal(copy.sourceId,rock.sourceId);
  e.G.freezeT=0;for(let i=0;i<60&&rock.phase==='warning';i++)e.updateEnemies();assert.equal(rock.phase,'fall');
  assert.deepEqual([rock.x,rock.y],anchor);e.updateEnemies();assert.ok(rock.y>anchor[1]);
  e.G.en.push({...rock,phase:'fall',x:rock.x+34});e.G.s3.rockT=0;e.updateStage3();
  assert.equal(e.G.en.filter(q=>q.t==='rock'&&!q.dead&&(q.phase==='warning'||q.phase==='fall')).length,2,'at most two active rocks');
});

test('第三关大落石在垂直下落时仍翻滚，朝运动方向旋转并随闪光冻结，反弹后腾出路线',()=>{
  const e=engine();e.play(3,false);e.G.podTrig=[];e.G.spawnT=999;
  const boulder=(vx,spinDir=1)=>({t:'rock',waterfallRock:true,x:208,y:-100,r:16,vx,vy:0,rot:.4,spinDir,hp:3,bounce:0,flash:0});
  for(const [vx,spinDir,direction]of [[-12,1,-1],[12,-1,1],[0,-1,-1],[0,1,1]]){
    const rock=boulder(vx,spinDir);e.G.en=[rock];e.updateEnemies();assert.equal(Math.sign(rock.rot-.4),direction);
    const before=JSON.stringify(rock);e.G.freezeT=1;e.updateEnemies();assert.equal(JSON.stringify(rock),before);e.G.freezeT=0;
  }
  const legacy={...boulder(0),waterfallRock:false,r:8};e.G.en=[legacy];e.updateEnemies();assert.equal(legacy.rot,.4);
  const rock={...boulder(0),x:202,y:131,vy:90};e.G.en=[rock];e.updateEnemies();
  assert.equal(rock.y,132);assert.equal(rock.bounce,1);assert.ok(rock.vy<0);assert.equal(rock.spinDir,Math.sign(rock.vx));
  Object.assign(rock,{x:202,y:131,vy:90,bounce:2});e.updateEnemies();assert.ok(rock.y>132);assert.equal(rock.bounce,2);
  Object.assign(rock,{x:1,y:-100,vx:-12});e.updateEnemies();assert.equal(rock.x,20);assert.equal(rock.vx,12);assert.equal(rock.spinDir,1);
  Object.assign(rock,{x:383,vx:12});e.updateEnemies();assert.equal(rock.x,364);assert.equal(rock.vx,-12);assert.equal(rock.spinDir,-1);
});

test('第三关岩壁石块松动预警期间可接触、可提前击碎，脱落后才会伤害玩家',()=>{
  for(const phase of ['embedded','warning','fall']){
    const e=engine();e.play(3,false);e.G.pb=[];e.G.eb=[];
    const rock=e.G.en.find(q=>q.t==='rock');Object.assign(rock,{phase,warnT:1,dead:false});e.G.en=[rock];
    Object.assign(e.G.p,{x:rock.x,y:rock.y,invT:0,helmT:0});e.collide();
    assert.equal(e.G.p.dead,phase==='fall',phase);
  }
  const e=engine();e.play(3,false);e.G.eb=[];const rock=e.G.en.find(q=>q.t==='rock');rock.phase='warning';rock.warnT=1;e.G.en=[rock];
  for(let i=0;i<wallRock.WALL_ROCK_HP;i++){e.G.pb=[{k:'b',x:rock.x,y:rock.y-rock.r,vx:0,vy:0,dmg:1}];e.collide();}
  assert.equal(rock.dead,true,'warning-phase rocks can be shot down before falling');
});

test('第三关大落石的外缘可被子弹命中，需要多发击碎，防落石头盔仍保护两名玩家',()=>{
  const e=engine();e.play(3,false);e.G.en=[];e.G.eb=[];
  const rock={t:'rock',waterfallRock:true,phase:'fall',x:220,y:120,r:16,vx:0,vy:0,rot:0,spinDir:1,hp:wallRock.WALL_ROCK_HP,bounce:0,flash:0};e.G.en=[rock];
  for(let hit=1;hit<=wallRock.WALL_ROCK_HP;hit++){
    e.G.pb=[{k:'b',x:rock.x+rock.r-1,y:rock.y-rock.r,vx:-270,vy:0,dmg:1}];e.collide();
    assert.equal(rock.hp,wallRock.WALL_ROCK_HP-hit);assert.equal(!!rock.dead,hit===wallRock.WALL_ROCK_HP);
  }
  for(const slot of [1,2]){
    const team=engine();team.play(3,true);team.G.en=[];team.G.eb=[];team.G.pb=[];
    const actor=slot===1?team.G.p:team.G.p2;Object.assign(actor,{x:220,y:120,invT:0,helmT:5});
    const hazard={...rock,dead:false,hp:3};team.G.en=[hazard];team.collide();
    assert.equal(hazard.dead,true);assert.equal(actor.dead,false);assert.equal(actor.helmT,5);
  }
});

test('第三关普通士兵与炮台每轮只发一枚水平弹，保留较长射击间隔',()=>{
  const e=engine();e.play(3,false);e.G.en=[];e.G.podTrig=[];e.G.spawnT=9999;
  const sniper={t:'snp',x:280,y:84,hp:1,fireT:0,face:-1,ax:-1,ay:0,flash:0};
  const turret={t:'tur',x:320,y:104,hp:5,idx:6,rotT:0,fireT:0,flash:0};
  e.G.en=[sniper,turret];e.G.p.y=170;e.updateEnemies();
  assert.equal(e.G.eb.length,2);for(const b of e.G.eb)assert.equal(b.vy,0);
  assert.ok(sniper.fireT>=3.4);assert.ok(turret.fireT>=3.2);
});

test('第三关门卫先拆两侧火球器，张嘴才能受伤，击破后必须走入洞口才通关',()=>{
  const e=engine();e.play(3,false);e.G.en=[];e.G.podTrig=[];e.G.camY=waterfall.STAGE_THREE.top;
  Object.assign(e.G.p,{x:88,y:waterfall.STAGE_THREE.summit,onGround:true,invT:999});e.updateStage3();
  const boss=e.G.mech,[left,right,core]=boss.parts;assert.equal(boss.active,true);
  const fire=(part,damage=100)=>{e.G.pb=[{k:'b',x:part.x+part.w/2,y:part.y+part.h/2,vx:0,vy:-270,dmg:damage}];e.collide();};
  fire(core);assert.equal(core.hp,core.max);assert.ok(!boss.open);
  const homing=e.findTarget(192,waterfall.STAGE_THREE.top+135);assert.ok(homing.x<181||homing.x>203);
  fire(left);fire(right);assert.equal(waterfall.waterfallNodesAlive(boss),false);
  fire(core);assert.equal(core.hp,core.max);
  for(let i=0;i<45;i++)e.updateStage3();assert.equal(boss.open,true);
  fire(core);assert.equal(boss.dead,true);assert.equal(e.G.eb.length,0);
  for(let i=0;i<170;i++)e.updateStage3();assert.equal(boss.exitOpen,true);assert.equal(e.G.mode,'play');
  e.K.KeyD=true;for(let i=0;i<180&&e.G.mode==='play';i++)e.step();
  assert.equal(e.G.mode,'clear');assert.equal(e.G.p.summitEntered,true);assert.equal(e.G.stage,3);
  assert.equal(e.element('btnNext').hidden,false);
});

test('第三关山顶仍可上举枪用真实子弹命中弱点，双人通关等待两人进入',()=>{
  const e=engine();e.play(3,true);e.G.en=[];e.G.podTrig=[];e.G.camY=waterfall.STAGE_THREE.top;
  for(const p of [e.G.p,e.G.p2])Object.assign(p,{y:waterfall.STAGE_THREE.summit,onGround:true,invT:999});
  e.G.p2.x=300;e.updateStage3();const boss=e.G.mech;e.G.freezeT=2;
  e.G.p.x=boss.parts[0].x+boss.parts[0].w/2;
  e.K.KeyW=e.K.KeyJ=true;ticks(e,70);assert.ok(boss.parts[0].hp<14);assert.equal(e.G.p.ay,-1);
  e.K.KeyW=e.K.KeyJ=false;
  e.G.freezeT=0;
  boss.dead=true;boss.deadT=0;boss.exitOpen=true;boss.parts.forEach(p=>p.hp=0);e.G.eb=[];
  e.G.p.x=192;ticks(e,80);assert.equal(e.G.p.summitEntered,true);assert.equal(e.G.mode,'play');
  for(let i=0;i<150&&e.G.mode==='play';i++){e.coop.remote.push(encodeInput({left:true}));e.step();}
  assert.equal(e.G.mode,'clear');assert.equal(e.G.p2.summitEntered,true);
});

test('第三关链臂分节弯曲且两侧错相，弱点与爪心同位，炮弹从爪心发射',()=>{
  const e=engine();e.play(3,false);e.G.en=[];e.G.camY=waterfall.STAGE_THREE.top;
  Object.assign(e.G.p,{x:190,y:waterfall.STAGE_THREE.summit,onGround:true,invT:99});e.updateStage3();
  const boss=e.G.mech,initial=boss.parts.map(p=>[p.x,p.y]);boss.parts[0].fireT=0;boss.parts[1].fireT=999;e.G.eb=[];
  e.updateStage3();const shot=e.G.eb[0],node=boss.parts[0];
  assert.equal(shot.r,5,'放大的环形火球同步扩大有效半径');
  assert.equal(shot.cx,node.x+node.w/2);assert.equal(shot.cy,node.y+node.h/2);
  for(const age of [0,.5,1,2,3,4,6]){
    boss.age=age;waterfallArms.updateWaterfallArms(boss,waterfall.STAGE_THREE.top);
    const poses=[-1,1].map(side=>waterfallArms.waterfallArmPose(side,age,waterfall.STAGE_THREE.top));
    for(const [i,pose]of poses.entries()){
      const part=boss.parts[i];assert.ok(Math.abs(part.x+part.w/2-pose.tip.x)<1e-9);assert.ok(Math.abs(part.y+part.h/2-pose.tip.y)<1e-9);
      for(let n=1;n<pose.points.length;n++)assert.ok(Math.abs(Math.hypot(pose.points[n].x-pose.points[n-1].x,pose.points[n].y-pose.points[n-1].y)-waterfallArms.WATERFALL_ARMS.links[n-1])<1e-8);
    }
    assert.ok(Math.abs(poses[0].tip.y-poses[1].tip.y)>1,'arms have different swing phases');
  }
  assert.notDeepEqual(boss.parts.map(p=>[p.x,p.y]),initial);
  const age=boss.age;e.G.freezeT=1;e.updateStage3();assert.equal(boss.age,age);
  boss.parts[0].hp=0;const boxes=waterfallArms.waterfallArmBoxes(boss,waterfall.STAGE_THREE.top);
  assert.equal(boxes.length,waterfallArms.WATERFALL_ARMS.links.length);assert.ok(boxes.every(b=>b.x>192));
});

test('第三关单双人中央二段跳实际穿过本体弱点，不会因贴到 Boss 本体死亡',()=>{
  for(const online of [false,true])for(const slot of online?[1,2]:[1])for(const phase of ['arms','mouth']){
    const e=engine();e.play(3,online);e.G.en=[];e.G.podTrig=[];e.G.camY=waterfall.STAGE_THREE.top;
    const boss=e.G.mech;boss.active=true;boss.age=phase==='mouth'?.9:1.2;boss.fireT=999;
    for(const part of boss.parts.slice(0,2)){part.fireT=999;if(phase==='mouth')part.hp=0;}
    const p=slot===1?e.G.p:e.G.p2;
    Object.assign(p,{x:192,y:waterfall.STAGE_THREE.summit,vx:0,vy:0,onGround:true,
      support:e.solids.find(s=>s.summit),invT:0,shieldT:0});
    if(online){const other=slot===1?e.G.p2:e.G.p;Object.assign(other,{x:212,y:p.y,onGround:true});}
    let crossedCore=false;
    for(let frame=0;frame<100;frame++){
      const jump=frame===2||frame===23;
      if(slot===1)e.K.KeyK=jump;else e.coop.remote.push(encodeInput({jump}));
      e.step();
      assert.equal(p.dead,false,JSON.stringify({online,slot,phase,frame,y:p.y}));
      assert.equal(p.invT,0);assert.equal(p.shieldT,0);
      const box=e.pBox(p),core=boss.parts[2];
      if(box.x<core.x+core.w&&box.x+box.w>core.x&&box.y<core.y+core.h&&box.y+box.h>core.y)crossedCore=true;
      if(frame>23&&p.onGround)break;
    }
    assert.ok(crossedCore,'the real jump must overlap the core, not just stay below it');
    assert.equal(p.onGround,true);assert.equal(p.y,waterfall.STAGE_THREE.summit);assert.equal(e.G.deaths,0);
  }
});

test('第三关 Boss 火球仍会命中两名玩家，本体安全不会使玩家免疫弹丸',()=>{
  for(const slot of [1,2]){
    const e=engine();e.play(3,true);e.G.en=[];
    const p=slot===1?e.G.p:e.G.p2,other=slot===1?e.G.p2:e.G.p;
    Object.assign(p,{x:192,y:waterfall.STAGE_THREE.summit,invT:0,shieldT:0});other.x=250;
    e.G.eb=[{waterfallFire:true,x:p.x,y:p.y-14,r:4,vx:0,vy:0}];
    e.collide();assert.equal(p.dead,true);assert.equal(other.dead,false);assert.equal(e.G.deaths,1);
  }
});

test('第三关银灰链臂与爪心的接触范围跟随关节运动，两名角色都能被触碰命中',()=>{
  for(const slot of [1,2])for(const contact of ['link','claw']){
    const e=engine();e.play(3,true);e.G.en=[];e.G.mech.active=true;e.G.mech.age=1.3;
    const pose=waterfallArms.waterfallArmPose(-1,e.G.mech.age,waterfall.STAGE_THREE.top);
    const joint=contact==='claw'?pose.tip:pose.points[2];
    const p=slot===1?e.G.p:e.G.p2;Object.assign(p,{x:joint.x,y:joint.y+13,invT:0,onGround:false});
    e.updateStage3();assert.equal(p.dead,true);assert.equal(slot===1?e.G.p2.dead:e.G.p.dead,false);
  }
});

test('第三关结算在主客机均开放第四关入口并保留重玩',()=>{
  const host=engine(),guest=engine();host.play(3,true);guest.play(3,true);guest.coop.role='guest';
  host.stageClear();
  assert.equal(host.G.stage,3);assert.equal(host.G.mode,'clear');
  guest.coop.callbacks.state(JSON.parse(JSON.stringify(packWorld([host.G,host.solids,host.BRIDGES,host.SET]))));
  for(const e of [host,guest]){
    assert.equal(e.element('btnNext').hidden,false);assert.equal(e.element('btnNext').textContent,'进入第四关');assert.equal(e.element('clearTitle').textContent,'关卡完成');
    assert.equal(e.G.stage,3);
  }
});

test('真实引擎第一关固定摇滚，旧唱片设置无法覆盖；换关使用对应原声',()=>{
  const e=engine();assert.equal(e.SET.stageMusic,undefined);
  e.SET.stageMusic={1:'orchestral',2:'random'};e.play(1,false);assert.equal(e.inspect().audio.resolved.track,'stage1rock');
  e.G.mode='cine';e.G.cine={kind:'open'};assert.equal(e.inspect().audio.resolved.track,'stage1rock');
  e.play(2,false);assert.equal(e.inspect().audio.resolved.track,'stage2');
  e.loadRoom(3);e.Music.sync();assert.equal(e.inspect().audio.resolved.track,'stage2boss');
  e.G.mode='pause';e.Music.sync();assert.equal(e.inspect().audio.resolved.track,null);
  e.G.mode='play';e.Music.start(true);assert.equal(e.inspect().audio.resolved.track,'stage2boss');
});

test('客机保留本机音乐开关，同步房间后使用正确中枢原声，不创建随机曲目',()=>{
  const host=engine(),guest=engine();host.play(2,true);guest.play(2,true);guest.coop.role='guest';
  host.SET.music='off';guest.SET.music='on';
  const sync=()=>guest.coop.callbacks.state(JSON.parse(JSON.stringify(packWorld([host.G,host.solids,host.BRIDGES,host.SET]))));
  sync();assert.equal(guest.SET.music,'on');assert.equal(guest.inspect().audio.resolved.track,'stage2');
  host.loadRoom(3);sync();assert.equal(guest.inspect().audio.resolved.track,'stage2boss');
  host.G.mode='pause';sync();assert.equal(guest.inspect().audio.resolved.track,null);
  host.G.mode='play';sync();assert.equal(guest.inspect().audio.resolved.track,'stage2boss');assert.equal(guest.SET.stageMusic,undefined);
});

test('实际高清片头绘制六段完整字幕，并按原时长进入第一关', () => {
  const e=engine();e.play(1,false);const drawn=[];
  e.stageOneArt.hudText=(text)=>drawn.push(text);
  e.G.mode='cine';e.G.cine={kind:'open',t:0,typed:0,skip:false,ev:{}};
  for(const page of OPENING_PAGES){
    drawn.length=0;e.G.cine.t=(page.from+page.to)/2;e.render();
    for(const line of page.lines)assert.ok(drawn.includes(line),line);
    assert.ok(drawn.some(text=>text.includes(page.tag)));
  }
  e.G.cine.t=OPENING_DURATION-.01;e.step();
  assert.equal(e.G.cine,null);assert.equal(e.G.stage,1);assert.equal(e.G.mode,'intro');
});

test('字幕片头仍可通过回车提前跳过，直接进入第一关',()=>{
  const e=engine();e.play(1,false);
  e.G.mode='cine';e.G.cine={kind:'open',t:2,typed:0,skip:false,ev:{}};
  e.step();e.K.Enter=true;e.step();
  assert.equal(e.G.cine,null);assert.equal(e.G.stage,1);assert.equal(e.G.mode,'intro');
});

test('飞碟侧翼可被真实子弹击落，下坠中不可拾取，第一次落地后才展开字母道具',()=>{
  const e=engine();e.play(1,false);e.G.en=[];e.G.eb=[];e.G.podTrig=[];e.G.spawnT=999;
  const pod={x:120,y:60,y0:60,t:0,kind:'S'};e.G.pods=[pod];
  e.G.pb=[{k:'b',x:130,y:60,vx:270,vy:0,dmg:1}];e.collide();
  assert.equal(pod.dead,true);assert.equal(e.G.items.length,1);
  const item=e.G.items[0];assert.equal(item.fromPod,true);assert.equal(item.landed,false);assert.ok(item.vy>0);
  Object.assign(e.G.p,{x:item.x,y:item.y+7,invT:999});e.collide();
  assert.ok(!item.dead);assert.equal(e.G.p.weapon,'rifle');
  Object.assign(e.G.p,{x:40,y:112,vy:0,onGround:true});
  for(let i=0;i<120&&!item.landed;i++)e.step();
  assert.equal(item.landed,true);assert.equal(item.rest,true);assert.equal(item.y,112);assert.equal(item.vx,0);assert.equal(item.vy,0);
  assert.ok(!item.dead);Object.assign(e.G.p,{x:item.x,y:item.y});e.collide();
  assert.equal(item.dead,true);assert.equal(e.G.p.weapon,'spread');
});

test('双人同步保留飞碟的下坠和展开状态，已落地补给可由二号玩家拾取',()=>{
  const e=engine();e.play(1,true);e.G.en=[];e.G.eb=[];e.G.podTrig=[];e.G.spawnT=999;
  e.G.items=[{x:120,y:111,vx:0,vy:50,kind:'L',fromPod:true,landed:false}];
  const falling=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));
  assert.equal(falling.items[0].fromPod,true);assert.equal(falling.items[0].landed,false);
  for(let i=0;i<4;i++)e.step();
  const item=e.G.items[0],landed=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));
  assert.equal(item.landed,true);assert.equal(landed.items[0].landed,true);
  Object.assign(e.G.p2,{x:item.x,y:item.y,invT:999});e.collide();
  assert.equal(item.dead,true);assert.equal(e.G.p2.weapon,'laser');assert.equal(e.G.p.weapon,'rifle');
});

test('主线八关双人模拟与绘制，世界时间只推进一次，两人各自发射子弹', () => {
  for (let stage = 1; stage <= 8; stage++) {
    const e = engine(); e.play(stage);
    e.K.KeyD = e.K.KeyJ = true;
    e.coop.remote.push(encodeInput({ left: true, fire: true, jump: true }));
    const shooters = new Set();
    for (let tick = 0; tick < 30; tick++) { e.step(); e.G.pb.forEach(b => shooters.add(b.owner)); if (tick % 5 === 0) e.render(); }
    assert.ok(Math.abs(e.G.time - .5) < .001, `stage ${stage}: world time`);
    assert.equal(e.G.p.pid, 1, `stage ${stage}: 1P context restored`);
    assert.equal(e.G.p2.pid, 2, `stage ${stage}: 2P context restored`);
    assert.ok(shooters.has(1), `stage ${stage}: 1P shots`);
    assert.ok(shooters.has(2), `stage ${stage}: 2P shots`);
    const copy = unpackWorld(JSON.parse(JSON.stringify(packWorld([e.G, e.solids, e.BRIDGES]))));
    assert.equal(copy[0].p2.pid, 2);
    assert.ok(JSON.stringify(packWorld([e.G, e.solids, e.BRIDGES])).length < 240 * 1024, 'snapshot fits relay payload');
  }
});

test('第一关实际敌兵移动时推进步态，冻结停止位移与动画，联机快照保留动作相位', () => {
  const e = engine(); e.play(1, false);
  const runner = { t: 'run', x: 140, y: 112, vx: 62, vy: 0, hp: 1, on: true, sup: null, dec: false, anim: 0, flash: 0 };
  e.G.en = [runner]; e.G.spawnT = 100;
  for (let i = 0; i < 20; i++) e.step();
  assert.ok(runner.x > 160); assert.ok(runner.anim > 3); assert.equal(runner.on, true);
  const copy = unpackWorld(JSON.parse(JSON.stringify(packWorld([e.G, e.solids, e.BRIDGES]))));
  assert.equal(copy[0].en[0].anim, runner.anim);
  const before = { x: runner.x, anim: runner.anim }; e.G.freezeT = 2;
  for (let i = 0; i < 20; i++) e.step();
  assert.equal(runner.x, before.x); assert.equal(runner.anim, before.anim);
  e.G.freezeT = 0; e.step();
  assert.ok(runner.x > before.x); assert.ok(runner.anim > before.anim);
});

function runnerScene(online=false){
  const e=engine();e.play(1,online);e.G.spawnT=999;e.G.eb=[];e.G.pods=[];e.G.items=[];
  Object.assign(e.G.p,{x:40,y:112,onGround:true,invT:0});
  if(online)Object.assign(e.G.p2,{x:75,y:112,onGround:true,invT:0});
  const soldier={t:'run',x:200,y:112,vx:-62,vy:0,hp:1,on:true,dec:false,anim:0,flash:0,fireT:0};e.G.en=[soldier];
  return{e,soldier};
}

test('第一关跑兵停步预瞄、水平单发后恢复移动并延长间隔，真实弹丸能击中玩家',()=>{
  const {e,soldier}=runnerScene();e.G.p.invT=999;
  e.step();assert.equal(soldier.attack.phase,'aim');assert.equal(soldier.x,200);assert.equal(e.G.eb.length,0);
  for(let i=0;i<12;i++)e.step();assert.equal(e.G.eb.length,0,'visible warning before the first shot');
  for(let i=0;i<8;i++)e.step();assert.equal(e.G.eb.filter(b=>b.from==='runner').length,1);assert.equal(soldier.x,200);
  assert.ok(e.G.eb.every(b=>b.vx<0&&b.vy===0));
  for(let i=0;i<15;i++)e.step();assert.equal(soldier.attack,null);assert.ok(soldier.x<200);assert.ok(soldier.anim>0);
  assert.ok(soldier.fireT>2.8);
  const hit=runnerScene();let died=false;
  for(let i=0;i<160&&!died;i++){hit.e.step();died=hit.e.G.p.dead;}
  assert.ok(died,'new bullets use real player collision');assert.ok(hit.soldier.x>hit.e.G.p.x+35,'death is not contact with the soldier');
});

test('第一关跑兵、固定射手和炮台对高低目标均只左右水平单发，冷却期不连射',()=>{
  for(const type of ['run','snp','tur'])for(const x of [40,350])for(const y of [40,170]){
    const e=engine();e.play(1,false);Object.assign(e.G.p,{x,y,invT:999});e.G.podTrig=[];e.G.spawnT=999;
    const enemy={t:type,x:200,y:type==='tur'?96:112,hp:6,vx:0,vy:0,on:true,idx:3,rotT:0,fireT:0,anim:0};
    e.G.en=[enemy];e.G.eb=[];
    for(let i=0;i<90;i++)e.updateEnemies();
    assert.equal(e.G.eb.length,1,`${type} at ${x},${y}: one shot during cooldown`);
    const b=e.G.eb[0];assert.equal(b.vy,0);assert.equal(b.g,0);assert.equal(Math.sign(b.vx),x<200?-1:1);
    if(type==='run')assert.equal(enemy.ay,0);
    if(type==='snp')assert.equal(enemy.ay,0);
    if(type==='tur')assert.equal(enemy.idx,x<200?6:0);
  }
});

test('第一关关底两门炮每次只有一发水平弹，取消散射与抛物弹并延长冷却',()=>{
  for(const gun of [0,1])for(const phase2 of [false,true]){
    const e=engine();e.play(1,false);e.G.camX=2950;e.G.en=[];e.G.eb=[];
    Object.assign(e.G.p,{x:3180,y:40,invT:999});e.G.boss.active=true;e.G.boss.phase2=phase2;
    e.G.boss.parts[1-gun].hp=0;e.G.boss.parts[gun].fireT=0;
    for(let i=0;i<120;i++)e.updateBoss();
    assert.equal(e.G.eb.length,1);assert.equal(e.G.eb[0].vy,0);assert.equal(e.G.eb[0].g,0);assert.ok(e.G.eb[0].vx<0);
    assert.ok(e.G.boss.parts[gun].fireT>1);
  }
});

test('跑兵攻击冻结后计时暂停，迷彩、离屏或敌兵腾空时不发射，其他关卡保留原逻辑',()=>{
  const {e,soldier}=runnerScene();e.G.p.invT=999;e.step();const time=soldier.attack.t;
  e.G.freezeT=2;for(let i=0;i<25;i++)e.step();assert.equal(soldier.attack.t,time);assert.equal(e.G.eb.length,0);
  e.G.freezeT=0;for(let i=0;i<20;i++)e.step();assert.ok(e.G.eb.some(b=>b.from==='runner'));
  const copy=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));assert.equal(copy.en[0].attack.phase,soldier.attack.phase);assert.equal(copy.eb[0].from,'runner');
  for(const change of ['camo','offscreen','airborne','otherStage']){
    const quiet=runnerScene();quiet.e.G.p.invT=999;
    if(change==='camo')quiet.e.G.p.camoT=10;
    if(change==='offscreen'){quiet.soldier.x=400;quiet.soldier.vx=0;quiet.e.G.p.x=220;}
    if(change==='airborne'){quiet.soldier.on=false;quiet.soldier.y=10;quiet.soldier.vy=-100;}
    if(change==='otherStage'){quiet.e.play(5,false);quiet.e.G.en=[quiet.soldier];quiet.e.G.spawnT=999;quiet.e.G.p.invT=999;}
    for(let i=0;i<18;i++)quiet.e.step();
    assert.equal(quiet.e.G.eb.filter(b=>b.from==='runner').length,0,change);
  }
});

test('双人中一号阵亡后跑兵仍会瞄准并射击存活的二号角色',()=>{
  const {e,soldier}=runnerScene(true);beginDeath(e.G.p);e.G.p2.invT=999;
  for(let i=0;i<25;i++)e.step();assert.ok(e.G.eb.some(b=>b.from==='runner'));assert.equal(soldier.fireFace,-1);
  const b=e.G.eb.find(b=>b.from==='runner');assert.ok(b.vx<0);
  const t=(e.G.p2.x-soldier.shotX)/b.vx,y=soldier.shotY+b.vy*t;
  assert.ok(y>e.G.p2.y-28&&y<e.G.p2.y,'bullet aims at surviving partner body');
});

test('前七关全屏与高像素密度不生成未使用的旧背景', () => {
  const e = engine(); e.play(1, false); e.resizeWindow(1920, 1100); e.render();
  assert.deepEqual([...e.resolution().canvas], [1920, 1080]);
  e.resizeWindow(1920, 1100, 2); e.render();
  assert.deepEqual([...e.resolution().canvas], [3840, 2160]);
  assert.equal(e.resolution().backgrounds, 0, 'stage 1 does not allocate unused legacy backdrops');
  e.play(2, false); e.render();
  assert.deepEqual([...e.resolution().canvas], [3840, 2160]);
  assert.equal(e.resolution().backgrounds,0,'stage 2 has independent HD artwork');
  e.play(3,false);e.render();
  assert.deepEqual([...e.resolution().canvas], [3840, 2160]);
  assert.equal(e.resolution().backgrounds,0,'stage 3 reuses HD actors without building legacy backdrops');
  e.play(4,false);e.render();assert.deepEqual([...e.resolution().canvas],[3840,2160]);assert.equal(e.resolution().backgrounds,0);
  e.play(1, false); e.resizeWindow(768, 448); e.render();
  assert.deepEqual([...e.resolution().canvas], [768, 432]);
  e.play(3, false); e.render();
  assert.equal(e.resolution().backgrounds,0);
  e.play(5,false);e.render();assert.equal(e.resolution().backgrounds,0);
  e.play(6,false);e.render();assert.equal(e.resolution().backgrounds,0);
  e.play(7,false);e.render();assert.equal(e.resolution().backgrounds,0);
});

test('2P 拾取武器、受伤和过关继承独立于 1P；同屏镜头保留后方玩家', () => {
  const e = engine(); e.play(1);
  e.G.p.x = 40; e.G.p2.x = 120; e.G.p2.invT = 0;
  e.G.items.push({ kind: 'M', x: 120, y: e.G.p2.y - 8 }); e.collide();
  assert.equal(e.G.p.weapon, 'rifle'); assert.equal(e.G.p2.weapon, 'machine');
  e.G.p2.weapon = 'spread'; e.reset(2, true);
  assert.equal(e.G.p2.weapon, 'spread'); assert.equal(e.G.p.weapon, 'rifle');
  e.play(1); e.G.p2.x = 120; e.G.p2.invT = 0;
  e.G.eb.push({ x: 120, y: e.G.p2.y - 16, r: 3 }); e.collide();
  assert.equal(e.G.p.dead, false); assert.equal(e.G.p2.dead, true);
  e.play(1); e.G.p.x = 600; e.G.p2.x = 200;
  e.keepTeamOnScreen(); e.updateCamera();
  assert.ok(e.G.p.x - e.G.p2.x <= 336);
  assert.ok(e.G.p2.x >= e.G.camX + 18);
});

test('单人十六关仍能初始化、运行和绘制，离开联机后没有第二角色', () => {
  for (let stage = 1; stage <= 16; stage++) {
    const e = engine(); e.play(stage, false);
    for (let tick = 0; tick < 6; tick++) e.step();
    e.render(); assert.equal(e.G.p2, undefined, `solo stage ${stage}`);
  }
});

test('有限生命耗尽时，2P 阵亡仍允许存活的 1P 继续', () => {
  const e = engine(); e.play(1); e.G.lives = 0;
  e.G.p2.dead = true; e.G.p2.deadT = 0;
  e.step(); assert.equal(e.G.mode, 'play'); assert.equal(e.G.p.dead, false);
});

test('玩家中弹后击退下落、贴地停留、淡出消失后复活；双人快照保留死亡进度',()=>{
  for(const online of [false,true])for(const id of online?[1,2]:[1]){
    const e=engine();e.play(1,online);
    const corpse=id===2?e.G.p2:e.G.p;
    Object.assign(corpse,{x:120,y:online?70:112,invT:0,onGround:!online});
    e.G.eb.push({x:corpse.x,y:corpse.y-16,r:3});e.collide();
    assert.equal(corpse.dead,true);assert.equal(corpse.onGround,false);
    let rose=false,fell=false,landed=false,faded=false,hidden=false,returned=false;
    for(let tick=0;tick<180;tick++){
      e.step();assert.ok(Number.isFinite(corpse.x)&&Number.isFinite(corpse.y));
      rose ||= corpse.vy<0;fell ||= corpse.vy>0;
      if(corpse.deathGrounded){
        landed=true;assert.equal(corpse.y,112);assert.equal(corpse.vy,0);
        const visual=deathVisual(corpse);faded ||= visual.alpha>0&&visual.alpha<1;
        hidden ||= !visual.visible;
        if(online){const copied=unpackWorld(JSON.parse(JSON.stringify(packWorld(corpse))));assert.equal(copied.deathLandT,corpse.deathLandT);assert.equal(copied.deathHidden,corpse.deathHidden);}
      }
      const current=id===2?e.G.p2:e.G.p;
      if(current!==corpse){assert.equal(corpse.deathHidden,true);assert.equal(current.dead,false);assert.ok(current.invT>0);returned=true;break;}
    }
    assert.ok(rose&&fell&&landed&&faded&&hidden&&returned,`complete sequence online=${online}, player=${id}`);
  }
});

test('双人生命耗尽后遗体消失，存活队友继续游戏且遗体不会重新显示',()=>{
  const e=engine();e.play(1);e.SET.inf='off';e.G.lives=1;e.G.p.invT=99;
  Object.assign(e.G.p2,{x:120,y:112,invT:0});e.G.eb.push({x:120,y:96,r:3});e.collide();
  const corpse=e.G.p2;
  for(let tick=0;tick<160;tick++)e.step();
  assert.equal(e.G.mode,'play');assert.equal(e.G.p.dead,false);assert.equal(e.G.p2,corpse);
  assert.equal(corpse.deathHidden,true);assert.equal(deathVisual(corpse).visible,false);
});

test('第一关新岩台与出生点、炮台和补给箱的支撑面一致', () => {
  const e = engine(); e.play(1);
  assert.equal(e.G.p.y, 112); assert.equal(e.G.p2.y, 112);
  assert.equal(e.G.p.support.y, e.G.p.y);
  assert.equal(e.solids.find(s=>s.g&&s.x===240).y,144);
  assert.ok(!e.solids.some(s=>!s.g&&!s.bridge&&s.x<500),'开局的高岸与低岸不再叠加悬浮草台');
  assert.equal(e.G.en.find(e=>e.t==='snp'&&e.x===410).y,144);
  for (const [x,y] of [[560,128],[1660,128],[2470,128],[2880,176]]) {
    const box = e.G.en.find(e => e.t === 'box' && e.x === x);
    assert.equal(box.y, y, '补给设施落在上层草台，未被草台覆盖的设施继续落在地面');
    assert.ok(e.solids.some(s=>!s.gone&&!s.water&&box.x-10>=s.x&&box.x+10<=s.x+s.w&&s.y===box.y),'箱体底座完整落在草地支撑面');
    assert.equal(e.ebox(box).y+e.ebox(box).h,box.y,'命中范围随箱体移到草台上');
  }
  const turret = e.G.en.find(e => e.t === 'tur' && e.x === 888);
  assert.equal(turret.y + 16, 152);
  const floors = e.solids.filter(s => s.g && !s.water).sort((a,b) => a.x - b.x);
  for (let i = 1; i < floors.length; i++) {
    assert.ok(Math.abs(floors[i].y - floors[i - 1].y) <= 32, '岩台高差在正常跳跃范围内');
  }
});

test('第一关重绘的箱体在关闭时完整阻挡子弹，打开后相同上半部命中会造成伤害',()=>{
  const e=engine();e.play(1,false);const box=e.G.en.find(e=>e.t==='box');e.G.en=[box];
  for(const open of [false,true]){
    box.open=open;const hp=box.hp;
    const shot={k:'b',x:box.x,y:box.y-19,vx:270,vy:0,dmg:1};e.G.pb=[shot];e.collide();
    assert.equal(shot.dead,true);assert.equal(box.hp,hp-(open?1:0));
  }
});

test('第一关核心的美术位置与子弹通道一致，可命中核心；装甲仍阻挡其他高度的子弹', () => {
  const e = engine(); e.play(1); e.G.camX = 2950; e.G.en = []; e.G.spawnT = 99;
  e.G.boss.active = true; e.G.boss.parts[0].fireT = e.G.boss.parts[1].fireT = 99;
  const core = e.G.boss.parts[2], center = core.y + core.h / 2;
  assert.equal(e.xMax(10), FORTRESS_ART.wallX - 10);
  assert.equal(e.inWall(FORTRESS_ART.wallX - 1, 100), false, 'barrel-to-wall space must not be invisible armor');
  assert.equal(e.inWall(FORTRESS_ART.wallX + 1, center), false);
  assert.equal(e.inWall(FORTRESS_ART.wallX + 1, 90), true);
  e.G.pb.push({ k:'b', x:3188, y:center, vx:270, vy:0, dmg:1 });
  for (let tick = 0; tick < 30; tick++) e.step();
  assert.equal(core.hp, 59);
  e.G.pb.push({ k:'b', x:3188, y:90, vx:270, vy:0, dmg:1 });
  for (let tick = 0; tick < 30; tick++) e.step();
  assert.equal(core.hp, 59);
});

test('贴近要塞时实际斜上输入能击中反应堆，单人与二号玩家都可攻击',()=>{
  for(const partner of [false,true]){
    const e=engine();e.play(1,partner);e.G.camX=FORTRESS_ART.levelEnd-384;e.G.en=[];e.G.spawnT=999;e.G.boss.active=true;
    e.G.boss.parts[0].fireT=e.G.boss.parts[1].fireT=999;
    const actor=partner?e.G.p2:e.G.p;
    Object.assign(actor,{x:FORTRESS_ART.wallX-10,y:176,vx:0,vy:0,onGround:true,invT:999,weapon:'rifle',cool:0});
    e.G.p.invT=999;e.SET.autofire='on';
    for(let i=0;i<40;i++){
      if(partner)e.coop.remote.push(encodeInput({right:true,up:true,fire:true}));
      else e.K.KeyD=e.K.KeyW=e.K.KeyJ=true;
      e.step();
    }
    assert.ok(e.G.boss.parts[2].hp<60,partner?'2P diagonal shot reaches core':'solo diagonal shot reaches core');
    assert.equal(e.G.boss.parts[0].hp,20);assert.equal(e.G.boss.parts[1].hp,20);
  }
});

test('反应堆斜向射击通道支持各武器，偏离开口的弹道仍被装甲挡住',()=>{
  for(const weapon of ['rifle','spread','laser','fire','homing']){
    const e=engine();e.play(1,false);e.G.camX=FORTRESS_ART.levelEnd-384;e.G.en=[];e.G.spawnT=999;e.G.boss.active=true;
    e.G.boss.parts[0].hp=e.G.boss.parts[1].hp=0;
    Object.assign(e.G.p,{x:FORTRESS_ART.wallX-10,y:176,onGround:true,vx:0,vy:0,invT:999,weapon,cool:0});
    e.SET.autofire='on';e.K.KeyW=e.K.KeyD=e.K.KeyJ=true;
    for(let i=0;i<45;i++)e.step();assert.ok(e.G.boss.parts[2].hp<60,weapon);
  }
  for(const shot of [{x:FORTRESS_ART.wallX+1,y:90,vx:270,vy:0},{x:3180,y:148,vx:190,vy:-190},{x:FORTRESS_ART.wallX+1,y:165,vx:270,vy:0}]){
    const e=engine();e.play(1,false);e.G.camX=FORTRESS_ART.levelEnd-384;e.G.en=[];e.G.spawnT=999;e.G.boss.active=true;e.G.p.invT=999;
    e.G.boss.parts[0].fireT=e.G.boss.parts[1].fireT=999;
    const b={k:'b',...shot,dmg:1};e.G.pb=[b];
    for(let i=0;i<60;i++)e.step();
    assert.equal(e.G.boss.parts[2].hp,60);assert.ok(b.dead,'misaligned projectile is not granted a core hit');
  }
});

test('第一关上下炮口可实际击中，核心摧毁后打开入口并等待角色进入', () => {
  const e = engine(); e.play(1, false); e.G.camX = FORTRESS_ART.levelEnd - 384;
  e.G.en = []; e.G.spawnT = 99; e.G.boss.active = true;
  e.G.boss.parts[0].fireT = e.G.boss.parts[1].fireT = 99;
  for (const part of e.G.boss.parts) {
    e.G.pb.push({ k: 'b', x: part.x - 6, y: part.y + part.h / 2, vx: 270, vy: 0, dmg: 1 });
    for (let tick = 0; tick < 3; tick++) e.step();
    assert.equal(part.hp, part.max - 1, part.k);
  }
  const core = e.G.boss.parts[2]; core.hp = 1;
  e.G.pb.push({ k: 'b', x: core.x - 6, y: core.y + core.h / 2, vx: 270, vy: 0, dmg: 1 });
  for (let tick = 0; tick < 3; tick++) e.step();
  assert.equal(e.G.boss.dead, true); assert.ok(e.G.boss.deadT > .9);
  assert.ok(Number.isFinite(core.destroyedAt) && core.destroyedAt <= e.G.time);
  assert.ok(e.G.boss.parts.every(part=>part.hp<=0&&part.destroyedAt===core.destroyedAt),'core destruction leaves no active-looking turrets');
  const copy=unpackWorld(JSON.parse(JSON.stringify(packWorld([e.G,e.solids,e.BRIDGES]))));
  assert.equal(copy[0].boss.parts[2].destroyedAt,core.destroyedAt,'damage effects share the simulation clock in both clients');
  for(let tick=0;tick<300;tick++)e.step();
  assert.equal(e.G.stage,1);assert.equal(e.G.mode,'play');assert.equal(e.G.boss.exitOpen,true,'destroying the core alone must not clear the stage');
});

function openFortressExit(e){
  e.G.camX=FORTRESS_ART.levelEnd-384;e.G.en=[];e.G.spawnT=99;e.G.boss.active=true;
  const core=e.G.boss.parts[2];core.hp=1;
  e.G.pb=[{k:'b',x:core.x-1,y:core.y+core.h/2,vx:270,vy:0,dmg:1}];e.collide();
  for(let i=0;i<75;i++)e.step();assert.equal(e.G.boss.exitOpen,true);
}

function atExitApproach(e,p){
  Object.assign(p,{x:FORTRESS_ART.wallX-12,y:176,vx:0,vy:0,onGround:true,spin:false,
    support:e.solids.find(s=>s.g&&p.x>=s.x&&p.x<s.x+s.w),invT:0});
}

test('通道打开后走近不会过关，实际跳跃进入后自动到第二关并保留装备与分数',()=>{
  const e=engine();e.play(1,false);openFortressExit(e);
  e.G.score=12345;e.G.p.weapon='spread';atExitApproach(e,e.G.p);
  e.K.KeyD=true;for(let i=0;i<90;i++)e.step();
  assert.equal(e.G.stage,1);assert.equal(e.G.p.exitEntered,undefined);
  atExitApproach(e,e.G.p);e.K.KeyK=true;e.step();e.K.KeyK=false;
  let entering=false,hidden=false;
  for(let i=0;i<180&&e.G.stage===1;i++){
    e.step();entering ||= !!e.G.p.enteringExit;hidden ||= !!e.G.p.exitEntered;
    if(e.G.p.enteringExit){const copy=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));assert.equal(copy.p.enteringExit.t,e.G.p.enteringExit.t);}
  }
  assert.ok(entering&&hidden);assert.equal(e.G.stage,2);assert.equal(e.G.mode,'intro');
  assert.equal(e.G.score,12345);assert.equal(e.G.p.weapon,'spread');assert.equal(e.G.p.exitEntered,undefined);
});

test('双人通关等待仍存活的队友进入，已经进洞的角色不会被移动输入拉回',()=>{
  const e=engine();e.play(1,true);openFortressExit(e);
  const p=e.G.p;Object.assign(p,{x:FORTRESS_EXIT.x+FORTRESS_EXIT.w/2,y:FORTRESS_EXIT.y+FORTRESS_EXIT.h/2+14,onGround:false,vy:0});
  e.step();assert.ok(p.enteringExit);
  for(let i=0;i<55;i++)e.step();assert.equal(e.G.stage,1);assert.equal(p.exitEntered,true);
  const insideX=p.x;e.K.KeyA=true;for(let i=0;i<30;i++)e.step();e.K.KeyA=false;assert.equal(p.x,insideX);
  assert.ok(insideX>FORTRESS_EXIT.x+FORTRESS_EXIT.w+15,'player finishes behind the right wall, not at the center of the hole');
  const partner=e.G.p2;partner.weapon='laser';atExitApproach(e,partner);
  e.coop.remote.push(encodeInput({right:true,jump:true}));e.step();
  e.coop.remote.push(encodeInput({right:true}));
  for(let i=0;i<180&&e.G.stage===1;i++){e.coop.remote.push(encodeInput({right:true}));e.step();}
  assert.equal(e.G.stage,2);assert.equal(e.G.mode,'intro');assert.equal(e.G.p2.weapon,'laser');
});

test('进入要塞后沿通道持续向右，落到洞内地面后保持高度，尺寸状态不变',()=>{
  const p={x:FORTRESS_EXIT.trigger.x+1,y:FORTRESS_EXIT.y+25,giantT:0,anim:0};
  const startX=p.x;beginExitEntry(p,FORTRESS_EXIT);
  let previousX=p.x;
  for(let i=0;i<39;i++){
    advanceExitEntry(p,FORTRESS_EXIT,1/60);
    assert.ok(p.x>previousX);previousX=p.x;
    if(i>=10)assert.equal(p.y,FORTRESS_EXIT.y+FORTRESS_EXIT.h-2);
    assert.equal(p.giantT,0);assert.equal(p.face,1);
  }
  assert.ok(p.x>FORTRESS_EXIT.x+FORTRESS_EXIT.w+15);assert.ok(p.x>startX+40);
  assert.equal(p.exitEntered,true);assert.equal(p.enteringExit,null);
});

test('真实子弹命中炮口、核心、装甲和士兵时生成不同反馈，伤害规则保持正确',()=>{
  const e=engine();e.play(1,false);e.G.en=[];e.G.spawnT=99;e.G.boss.active=true;
  for(const part of e.G.boss.parts){
    e.G.fx=[];const before=part.hp;
    e.G.pb=[{k:'b',x:(part.hitBox||part).x-1,y:part.y+part.h/2,vx:270,vy:0,dmg:1}];e.collide();
    assert.equal(part.hp,before-1);
    const impact=e.G.fx.find(f=>f.k==='impact');assert.ok(impact);
    assert.equal(impact.material,part.k==='core'?'core':'metal');assert.equal(impact.x,(part.hitBox||part).x);
  }
  const core=e.G.boss.parts[2],health=core.hp;
  e.G.fx=[];e.G.pb=[{k:'b',x:FORTRESS_ART.wallX+1,y:90,vx:270,vy:0,dmg:1}];e.collide();
  assert.equal(core.hp,health);assert.equal(e.G.fx[0].material,'metal');assert.equal(e.G.fx[0].x,FORTRESS_ART.wallX);
  e.G.fx=[];e.G.en=[{t:'run',x:180,y:112,hp:3,on:true}];
  e.G.pb=[{k:'b',x:180,y:96,vx:270,vy:0,dmg:1}];e.collide();
  assert.equal(e.G.en[0].hp,2);assert.equal(e.G.fx[0].material,'body');
});

test('二号客户端收到同为 play 的中枢快照时，也同步切换第二关参考音乐',()=>{
  const e=engine();e.play(2,true);e.coop.role='guest';const tracks=[];
  e.Music.sync=()=>tracks.push(referenceTrackForScene(e.G));
  const state=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));
  state.base.def={boss:'eye'};state.base.room=3;
  e.coop.callbacks.state(packWorld([state,e.solids,e.BRIDGES,{}]));
  assert.deepEqual(tracks,['stage2boss']);
  e.coop.callbacks.state(packWorld([state,e.solids,e.BRIDGES,{}]));assert.equal(tracks.length,1,'normal snapshots do not restart audio');
});

test('第二关防爆盾仍抵挡三次实际子弹，第四次才触发死亡且不影响队友',()=>{
  const e=engine();e.play(2,true);Object.assign(e.G.p,{invT:0,shieldT:0,riot:3});e.G.p2.riot=3;
  for(let i=0;i<4;i++){
    const p=e.G.p;e.G.eb=[{base:true,t:.9,x:p.x,y:p.y-15,r:2,x0:p.x,y0:120,x1:p.x,y1:p.y-15}];
    e.collideBasePlayer();
    assert.equal(p.riot,Math.max(0,2-i));assert.equal(p.dead,i===3);assert.equal(e.G.p2.riot,3);
  }
});

test('第二、四关高清敌兵枪口与命中范围同步',()=>{
  for(const stage of [2,4]){
    const e=engine();e.play(stage,false);const B=e.G.base;
    B.spawned=B.def.sol;B.rolled=B.def.rol;B.rol=[];B.targets.forEach(t=>t.fireT=999);e.G.eb=[];
    B.sol=[{u:0,z:.5,st:'aim',t:0,anim:0}];e.G.p.invT=999;
    e.step();const shot=e.G.eb.find(b=>b.x0===192);assert.ok(shot);
    const height=BASE_SOLDIER.muzzleHeight*baseSoldierScale(.5);
    assert.ok(Math.abs(shot.y0-(204-64*.5-height))<.0001,'shot begins at the visible barrel');
    const soldier=B.sol[0];soldier.st='aim';soldier.t=999;
    e.G.pb=[{k:'b',owner:1,t:.49,spd:.6,x0:201.5,y0:166,xe:201.5,ye:129,dmg:1}];
    e.step();assert.equal(!!soldier.dead,true,'visible body matches its hit box');
  }
});

test('第二、四关真实出场的敌兵横向跑动、跳跃并射击，冰冻暂停，双人瞄准存活队友',()=>{
  for(const stage of [2,4]){
    const e=engine();e.play(stage,true);const B=e.G.base;B.spawned=1;B.spawnT=0;B.rolled=B.def.rol;B.sol=[];B.targets.forEach(t=>t.fireT=999);
    e.G.p.invT=999;e.G.p2.invT=999;e.step();const s=B.sol[0];assert.ok(s?.patrolArmed&&s.dropKind);
    const before=s.u;s.jumpT=0;s.fireT=0;beginDeath(e.G.p);e.G.p2.x=260;e.step();
    assert.notEqual(s.u,before,'soldier moves sideways');assert.ok(s.jumpY>0,'soldier starts an actual jump');
    const shot=e.G.eb.find(b=>b.from==='base-soldier');assert.ok(shot);assert.equal(shot.x1,260);
    assert.ok(Math.abs(shot.y0-(204-64*s.z-baseSoldierJumpOffset(s)-BASE_SOLDIER.muzzleHeight*baseSoldierScale(s.z)))<.001,'shot originates at the airborne soldier');
    assert.ok(Math.abs(shot.x0-baseSoldierMuzzle(s,192+s.u*(1-.5*s.z),204-64*s.z).x)<.001,'the shot follows the visible forward-facing muzzle');
    e.G.freezeT=2;const frozen=[s.u,s.z,s.jumpY,s.jumpV,s.fireT,shot.t];ticks(e,30);
    assert.deepEqual([s.u,s.z,s.jumpY,s.jumpV,s.fireT,shot.t],frozen);
    const copy=unpackWorld(packWorld(e.G));assert.equal(copy.base.sol[0].jumpY,s.jumpY);assert.equal(copy.eb.find(b=>b.from==='base-soldier').t,shot.t);
  }
});

test('第二关真实投射射击保留核心防护、炮台拆除、开门推进和 Boss 摧毁流程',()=>{
  for(const online of [false,true]){
    const e=engine();e.play(2,online);const B=e.G.base;
    e.G.p.invT=999;if(e.G.p2)e.G.p2.invT=999;
    B.spawned=B.def.sol;B.rolled=B.def.rol;B.sol=[];B.rol=[];
    const fire=(target,dmg,ye=117)=>{
      e.G.fx=[];e.G.pb=[{k:'b',owner:1,t:.99,spd:1.8,x0:192,y0:166,xe:target.x+target.w/2,ye,x:192,y:166,dmg}];e.step();
    };
    const core=B.targets.find(t=>t.k==='core');fire(core,12,134);assert.equal(core.hp,12);assert.ok(e.G.fx.some(f=>f.material==='shield'));
    for(const gun of B.targets.filter(t=>t.k==='gun')){fire(gun,4,117);assert.ok(gun.hp<=0);}
    fire(core,12,134);assert.equal(core.hp,12);assert.equal(B.cleared,false);
    const upper=B.targets.find(t=>t.k==='switch');fire(upper,4,upper.y+upper.h/2);assert.ok(upper.hp<=0);
    fire(core,12,134);assert.ok(B.cleared);assert.equal(B.trans,0);
    const before=JSON.stringify(packWorld([e.G]));e.render();assert.equal(JSON.stringify(packWorld([e.G])),before,'art does not change simulation');
    e.K.KeyW=true;e.step();e.K.KeyW=false;assert.ok(B.trans>0);
    for(let i=0;i<85;i++)e.step();assert.equal(B.room,1);assert.equal(B.cleared,false);
    e.loadRoom(3);
    for(const target of B.targets)fire(target,8,target.y+target.h/2);
    assert.equal(B.bossPhase,'reveal');assert.equal(B.targets.some(t=>t.k==='bcore'),false);
    ticks(e,75);const boss=B.targets.find(t=>t.k==='bcore');assert.ok(boss);boss.fireT=999;
    fire(boss,50,boss.y+boss.h/2);assert.ok(B.dead);
    ticks(e,190);assert.equal(e.G.mode,'play');assert.equal(B.exitReady,true);
    e.K.KeyA=true;
    for(let i=0;i<360&&e.G.stage===2;i++){
      if(online)e.coop.remote.push(encodeInput({right:true}));
      e.step();
    }
    assert.equal(e.G.stage,3);assert.equal(e.G.mode,'intro');
  }
});

test('第二关跟踪导弹先清除两侧设施，跳跃后打掉高位机关，再锁定核心，单人与二号玩家均有效',()=>{
  for(const online of [false,true])for(const room of [0,1,2]){
    const e=engine();e.play(2,online);e.loadRoom(room);e.SET.autofire='on';
    const B=e.G.base,shooter=online?e.G.p2:e.G.p;
    for(const p of [e.G.p,...(e.G.p2?[e.G.p2]:[])])p.invT=999;
    Object.assign(shooter,{x:192,weapon:'homing',cool:0});
    B.spawned=B.def.sol;B.rolled=999;B.sol=[];B.rol=[];B.coreT=999;
    B.targets.forEach(t=>t.fireT=999);
    const sides=B.targets.filter(t=>t.k==='gun'||t.k==='sat'),core=B.targets.find(t=>t.k==='core'||t.k==='bcore'),upper=B.targets.find(t=>t.k==='switch');
    let coreHit=false;
    if(!online)e.K.KeyJ=true;
    for(let tick=0;tick<1400&&!B.cleared&&!B.dead;tick++){
      const down=sides.every(t=>t.hp<=0)&&(!upper||upper.hp<=0);
      const jump=!!upper&&upper.hp>0&&sides.every(t=>t.hp<=0)&&tick%55===0;
      if(online)e.coop.remote.push(encodeInput({fire:true,jump,down}));else{e.K.KeyK=jump;e.K.KeyS=down;}
      const hp=core.hp;e.step();
      if(core.hp<hp){
        coreHit=true;assert.ok(sides.every(t=>t.hp<=0),`room ${room}, player ${shooter.pid}: core hit before side targets cleared`);
        assert.ok(!upper||upper.hp<=0,'upper lock must also be destroyed before the core');
      }
    }
    assert.ok(sides.every(t=>t.hp<=0),`room ${room}: all side targets destroyed`);
    assert.ok(coreHit&&core.hp<=0,`room ${room}: automatic lock switches to the center`);
    assert.ok(room===3?B.dead:B.cleared);
  }
});

function quietBaseRoom(room=0,online=false){
  const e=engine();e.play(2,online);e.loadRoom(room);e.SET.autofire='on';
  const B=e.G.base;B.spawned=B.def.sol;B.rolled=999;B.sol=[];B.rol=[];B.coreT=999;
  B.targets.forEach(t=>t.fireT=999);e.G.eb=[];
  for(const p of [e.G.p,...(online?[e.G.p2]:[])])Object.assign(p,{x:192,y:204,invT:999,onGround:true});
  e.step();return e;
}

function shootBaseTarget(e,target,damage=99){
  e.G.pb=[{k:'b',owner:1,t:.99,spd:1.8,x0:e.G.p.x,y0:166,xe:target.x+target.w/2,ye:target.y+target.h/2,dmg:damage}];e.step();
}
function activateMovingBoss(e){
  for(const target of e.G.base.targets.filter(t=>t.k==='device'))shootBaseTarget(e,target);
  ticks(e,75);return e.G.base.targets.find(t=>t.mover);
}

test('第二、四关手动或自动前进时清掉所有敌兵与滚雷，冻结和双人快照不残留，新房间恢复出兵',()=>{
  for(const stage of [2,4])for(const room of stage===2?[0,1,2]:[0,1,2,3])for(const online of [false,true])for(const automatic of [false,true])for(const frozen of [false,true]){
    const e=engine();e.play(stage,online);e.loadRoom(room);const B=e.G.base;
    for(const p of [e.G.p,...(online?[e.G.p2]:[])])p.invT=999;
    e.step();e.G.freezeT=frozen?999:0;
    B.sol=[{u:-20,z:.8,st:'walk',tu:40,tz:.6,t:2,anim:0},{u:35,z:.1,st:'aim',t:2,anim:0,dropKind:'L'}];
    B.rol=[{u0:-160,ut:0,z:.5,a:0,spd:.4}];
    for(const target of B.targets.filter(t=>t.k!=='core')){target.aperture=1;e.hitTarget(target,999);}
    const core=B.targets.find(t=>t.k==='core');core.aperture=1;e.hitTarget(core,999);
    assert.equal(B.cleared,true);assert.ok(B.sol.length>0,'先复现仍在撤离的士兵');
    e.G.items=[{x:50,y:204,rest:true,kind:'S'}];const score=e.G.score;
    if(automatic)B.clearT=0;else if(online)e.coop.remote.push(encodeInput({up:true}));else e.K.KeyW=true;
    e.step();assert.ok(B.trans>0);
    assert.equal(B.sol.length+B.rol.length+(B.gallery?.length||0),0,'推进第一帧清空前后景敌人和滚雷');
    assert.equal(e.G.score,score,'清场不额外计入击杀');assert.equal(e.G.items.length,1,'已掉落补给继续保留');
    const copy=unpackWorld(packWorld(e.G));assert.equal(copy.base.sol.length+copy.base.rol.length+(copy.base.gallery?.length||0),0);
    e.K.KeyW=false;
    for(let i=0;i<90&&B.room===room;i++){e.step();if(B.room===room)assert.equal(B.sol.length+B.rol.length+(B.gallery?.length||0),0);}
    assert.equal(B.room,room+1);
    if(!B.def.boss){e.G.freezeT=0;ticks(e,100);assert.ok(B.sol.length>0,'新房间正常生成守军');}
  }
});

test('第二关开枪前进会清除两人的弹丸、手雷和枪口光；自动与手动过门后均可继续射击',()=>{
  for(const online of [false,true])for(const automatic of [false,true])for(const weapon of ['rifle','machine','spread','laser','fire','homing']){
    const e=quietBaseRoom(0,online),B=e.G.base,actors=[e.G.p,...(online?[e.G.p2]:[])];
    for(const target of B.targets.filter(t=>t.k!=='core'))shootBaseTarget(e,target);
    shootBaseTarget(e,B.targets.find(t=>t.k==='core'));assert.equal(B.cleared,true);
    for(const p of actors)Object.assign(p,{weapon,cool:0});
    e.K.KeyJ=true;if(online)e.coop.remote.push(encodeInput({fire:true}));e.step();
    assert.equal(new Set(e.G.pb.map(b=>b.owner)).size,actors.length,'both players have visible in-flight shots');
    e.K.KeyI=true;if(online)e.coop.remote.push(encodeInput({fire:true,nade:true}));e.step();assert.ok(e.G.gr.length>0);
    e.K.KeyI=false;if(automatic)B.clearT=0;else e.K.KeyW=true;
    if(online)e.coop.remote.push(encodeInput({fire:true}));e.step();
    assert.ok(B.trans>0);assert.equal(e.G.pb.length+e.G.eb.length+e.G.gr.length,0);
    for(const p of actors){assert.equal(p.flashT,0);assert.equal(p.wantFire,false);}
    for(let tick=0;tick<12;tick++){
      e.K.KeyI=tick%2===0;
      if(online)e.coop.remote.push(encodeInput({fire:true,nade:tick%2===0}));e.step();
      assert.equal(e.G.pb.length+e.G.eb.length+e.G.gr.length,0,'holding fire or throwing cannot leave a frozen projectile');
    }
    const snapshot=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));
    assert.equal(snapshot.pb.length+snapshot.eb.length+snapshot.gr.length,0);assert.ok(snapshot.base.trans>0);e.render();
    e.K.KeyW=e.K.KeyI=false;
    for(let tick=0;tick<90&&B.room===0;tick++){if(online)e.coop.remote.push(encodeInput({fire:true}));e.step();}
    assert.equal(B.room,1);const shooters=new Set();
    for(let tick=0;tick<40;tick++){if(online)e.coop.remote.push(encodeInput({fire:true}));e.step();for(const b of e.G.pb)shooters.add(b.owner);}
    assert.equal(shooters.size,actors.length,`${weapon}: holding fire resumes for every player in the new room`);
  }
});

test('第二关关底依次摧毁两排六个独立装置，再延迟启动顶部核心；冻结暂停启动和运动',()=>{
  const e=quietBaseRoom(3),B=e.G.base;
  assert.equal(B.targets.length,6);assert.equal(bossDevicesRemaining(B),6);
  assert.deepEqual([...new Set(B.targets.map(t=>t.y))],[91,119]);
  assert.deepEqual([...new Set(B.targets.map(t=>t.x))],[116,177,238]);
  for(const target of B.targets.slice(0,5))shootBaseTarget(e,target);
  ticks(e,90);assert.equal(B.bossPhase,'devices');assert.ok(!B.targets.some(t=>t.mover));
  shootBaseTarget(e,B.targets[5]);assert.equal(B.bossPhase,'reveal');assert.equal(bossDevicesRemaining(B),0);
  const timer=B.revealT;e.G.freezeT=10;ticks(e,100);assert.equal(B.revealT,timer);
  e.G.freezeT=0;ticks(e,75);const boss=B.targets.find(t=>t.mover);assert.ok(boss);assert.equal(B.bossPhase,'mover');
  const start=boss.x;ticks(e,30);assert.notEqual(boss.x,start);assert.ok(boss.x>=111&&boss.x<=243);
  e.G.freezeT=10;const frozen=boss.x,shots=B.bubbleShots;ticks(e,100);assert.equal(boss.x,frozen);assert.equal(B.bubbleShots,shots);
});

test('第二关六个炮塔独立开启下方炮口，每次从三个位置齐射',()=>{
  const e=engine();e.play(2,false);e.loadRoom(3);e.G.p.invT=999;const B=e.G.base;assert.equal(B.targets.length,6);
  assert.ok(new Set(B.targets.map(t=>t.fireT)).size>1,'initial opening times differ');
  B.targets.forEach(t=>t.fireT=999);const turret=B.targets[2];turret.fireT=0;e.G.eb=[];
  e.step();assert.equal(turret.shutterPhase,'opening');assert.equal(e.G.eb.length,0);
  e.G.freezeT=2;const frozen=[turret.aperture,turret.fireT,turret.shutterPhase];ticks(e,20);assert.deepEqual([turret.aperture,turret.fireT,turret.shutterPhase],frozen);
  e.G.freezeT=0;for(let i=0;i<80&&!e.G.eb.some(b=>b.from==='boss-turret');i++)e.step();
  const shots=e.G.eb.filter(b=>b.from==='boss-turret');assert.equal(shots.length,3);assert.equal(turret.aperture,1);
  assert.deepEqual(Array.from(shots,b=>b.muzzle),[-8,0,8]);
  for(const shot of shots){assert.equal(shot.turretId,turret.id);assert.equal(shot.x0,turret.x+turret.w/2+shot.muzzle);assert.equal(shot.y0,turret.y+turret.h+1);}
  turret.hp=0;e.G.eb=[];ticks(e,220);assert.equal(e.G.eb.filter(b=>b.turretId===turret.id).length,0,'destroyed turret no longer fires');
});

test('真实跳跃和跟踪弹能依次清掉六装置及移动核心，普通平射不能直接锁定顶部核心',()=>{
  for(const online of [false,true]){
    const e=quietBaseRoom(3,online),B=e.G.base,p=online?e.G.p2:e.G.p;
    p.weapon='homing';let locks=0;
    for(let tick=0;tick<3600&&!B.dead;tick++){
      const bottom=B.targets.find(t=>t.k==='device'&&t.y===119&&t.hp>0),upper=B.targets.find(t=>t.k==='device'&&t.y===91&&t.hp>0);
      const target=bottom||upper;
      if(target)p.x=2*(target.x+target.w/2)-192;
      const jump=!bottom&&(!!upper||B.bossPhase==='mover')&&tick%55===0;
      if(online)e.coop.remote.push(encodeInput({fire:true,jump}));else{e.K.KeyJ=true;e.K.KeyK=jump;}
      e.step();locks+=e.G.pb.filter(b=>b.lock==='bcore').length;
    }
    assert.equal(B.dead,true,`player ${p.pid}: ${JSON.stringify({phase:B.bossPhase,targets:B.targets.map(t=>({k:t.k,hp:t.hp,x:t.x,y:t.y})),p:{x:p.x,y:p.y,cool:p.cool,dead:p.dead},locks})}`);assert.ok(locks>0);
    assert.equal(bossDevicesRemaining(B),0);assert.ok(B.bubbleShots>0);
  }
  const e=quietBaseRoom(3),boss=activateMovingBoss(e);boss.fireT=999;
  e.G.p.weapon='homing';e.K.KeyJ=true;ticks(e,140);
  assert.equal(boss.hp,boss.max);assert.ok(e.G.pb.every(b=>b.lock!=='bcore'));
});

test('顶部核心出现后两人均可站立举枪，六种武器向上命中；松开上键恢复普通弹道',()=>{
  for(const mode of ['solo','host','guest'])for(const weapon of ['rifle','machine','spread','laser','fire','homing']){
    const online=mode!=='solo',remote=mode==='guest',e=quietBaseRoom(3,online),boss=activateMovingBoss(e),p=remote?e.G.p2:e.G.p;
    e.G.freezeT=999;boss.fireT=999;boss.hp=999;
    Object.assign(p,{x:2*(boss.x+boss.w/2)-192,y:204,onGround:true,vy:0,weapon,cool:0});e.G.pb=[];
    const input=up=>{if(remote)e.coop.remote.push(encodeInput({up,fire:true}));else{e.K.KeyW=up;e.K.KeyJ=true;}e.step();};
    input(true);assert.equal(p.aimUp,true);assert.equal(p.y,204);assert.equal(p.spin,false);
    const shots=e.G.pb.filter(b=>b.owner===p.pid);assert.ok(shots.length);
    const origin=baseUpMuzzle(p,mode==='host'?'red':'blue');
    for(const b of shots){assert.equal(b.upward,true);assert.equal(b.ye,boss.y+boss.h/2);assert.equal(b.x0,origin.x);assert.equal(b.y0,origin.y);}
    const snapshot=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));
    assert.equal((remote?snapshot.p2:snapshot.p).aimUp,true);assert.ok(snapshot.pb.some(b=>b.upward));
    for(let i=0;i<120;i++)input(true);
    assert.ok(boss.hp<999,`${weapon}, player ${p.pid}: upward ground fire must damage the top core`);
    p.cool=0;e.G.pb=[];input(false);assert.equal(p.aimUp,false);
    assert.ok(e.G.pb.filter(b=>b.owner===p.pid).every(b=>!b.upward&&b.ye===129));
    assert.doesNotThrow(()=>e.render());
  }
});

test('普通走廊保持原瞄准方式，关底移动和跳跃举枪时枪口仍与姿势对齐',()=>{
  for(const room of [0,1,2]){
    const e=quietBaseRoom(room);e.G.p.cool=0;e.K.KeyW=e.K.KeyJ=true;e.step();
    assert.equal(e.G.p.aimUp,false);assert.ok(e.G.pb.every(b=>!b.upward&&b.ye===117));
  }
  for(const online of [false,true])for(const giant of [false,true]){
    const e=quietBaseRoom(3,online);activateMovingBoss(e);e.G.freezeT=999;
    const p=online?e.G.p2:e.G.p;if(giant)startGiant(p);p.cool=0;e.G.pb=[];
    if(online)e.coop.remote.push(encodeInput({up:true,right:true,fire:true}));else e.K.KeyW=e.K.KeyD=e.K.KeyJ=true;
    e.step();assert.equal(p.aimUp,true);assert.ok(p.vx>0);assert.equal(p.aimDx,0);
    const origin=baseUpMuzzle(p),shot=e.G.pb.find(b=>b.owner===p.pid);
    assert.equal(shot.x0,origin.x);assert.equal(shot.y0,origin.y);
    p.cool=0;e.G.pb=[];
    if(online)e.coop.remote.push(encodeInput({up:true,jump:true,fire:true}));else{e.K.KeyD=false;e.K.KeyK=true;}
    e.step();assert.ok(p.y<204);assert.equal(p.aimUp,true);assert.equal(p.spin,false);
    assert.ok(e.G.pb.some(b=>b.owner===p.pid&&b.upward&&b.ye===71));
  }
});

test('第二关上排装置可站立举枪命中，六种武器与双方输入保持一致，松开上键打下排',()=>{
  for(const mode of ['solo','host','guest'])for(const weapon of ['rifle','machine','spread','laser','fire','homing']){
    const e=quietBaseRoom(3,mode!=='solo'),B=e.G.base,p=mode==='guest'?e.G.p2:e.G.p;
    e.G.freezeT=999;
    const upper=B.targets.find(t=>t.y===91&&t.x===177),lower=B.targets.find(t=>t.y===119&&t.x===177);
    upper.hp=lower.hp=999;
    Object.assign(p,{x:192,y:204,onGround:true,vy:0,weapon,cool:0});e.G.pb=[];
    const input=up=>{if(mode==='guest')e.coop.remote.push(encodeInput({up,fire:true}));else{e.K.KeyW=up;e.K.KeyJ=true;}e.step();};
    input(true);assert.equal(p.aimUp,true);assert.equal(p.onGround,true);
    const shot=e.G.pb.find(b=>b.owner===p.pid),muzzle=baseUpMuzzle(p,mode==='host'?'red':'blue');
    assert.ok(shot.upward);assert.equal(shot.ye,100);assert.equal(shot.x0,muzzle.x);assert.equal(shot.y0,muzzle.y);
    for(let i=0;i<90;i++)input(true);
    assert.ok(upper.hp<999,mode+' '+weapon+' damages upper row while standing');assert.equal(lower.hp,999);
    const snapshot=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));assert.equal((mode==='guest'?snapshot.p2:snapshot.p).aimUp,true);
    p.cool=0;e.G.pb=[];input(false);assert.equal(p.aimUp,false);assert.ok(e.G.pb.filter(b=>b.owner===p.pid).every(b=>b.ye===(weapon==='homing'?128:129)));
    for(let i=0;i<90;i++)input(false);assert.ok(lower.hp<999,'normal fire returns to the lower row');
  }
});

test('第四关关底装置阶段举枪可直接命中高位装置，关闭护板仍阻挡弹丸',()=>{
  const e=engine();e.play(4,false);e.loadRoom(4);e.SET.autofire='on';e.G.freezeT=999;e.G.p.invT=999;
  const upper=e.G.base.targets.find(t=>t.id==='upper');upper.hp=999;upper.aperture=0;
  e.K.KeyW=e.K.KeyJ=true;ticks(e,90);assert.equal(e.G.p.aimUp,true);assert.equal(upper.hp,999);
  upper.aperture=1;ticks(e,90);assert.ok(upper.hp<999);assert.equal(e.G.p.y,204);
});

test('移动核心每次发出的蓝色气泡与核心一样大，冻结暂停，卧倒、跳跃和护盾均有效',()=>{
  const e=quietBaseRoom(3),B=e.G.base,boss=activateMovingBoss(e);boss.fireT=0;e.step();
  assert.equal(B.bubbleShots,1);assert.equal(e.G.eb.filter(b=>b.bubble).length,1);
  const bubble=e.G.eb.find(b=>b.bubble),radius=bubble.r;assert.equal(bubble.rx,boss.w/2);assert.equal(bubble.ry,boss.h/2);ticks(e,25);assert.equal(bubble.r,radius);assert.equal(B.bubbleShots,1);
  e.G.freezeT=10;const frozen=[bubble.x,bubble.y,bubble.r,bubble.t];ticks(e,60);
  assert.deepEqual([bubble.x,bubble.y,bubble.r,bubble.t],frozen);
  for(const defense of ['standing','prone','jump','shield','giant']){
    const scene=quietBaseRoom(3),p=scene.G.p;
    Object.assign(p,{invT:0,prone:defense==='prone',y:defense==='jump'?154:204,shieldT:defense==='shield'?10:0});
    if(defense==='giant')startGiant(p);
    scene.G.eb=[{base:true,bubble:true,t:.99,x:p.x,y:186,r:15,rx:15,ry:9,x0:192,y0:71,x1:192,y1:186}];scene.collideBasePlayer();
    assert.equal(p.dead,defense==='standing',defense);
    if(defense==='shield')assert.equal(scene.G.eb[0].dead,true);
  }
  e.G.freezeT=0;boss.fireT=999;ticks(e,160);assert.equal(e.G.eb.filter(b=>b.bubble).length,0);
});

test('第二关核心气泡可被红蓝玩家的各种武器击碎，产生破碎效果且不影响普通敌弹',()=>{
  for(const weapon of ['rifle','spread','laser','fire','homing'])for(const online of [false,true]){
    const e=quietBaseRoom(3,online),boss=activateMovingBoss(e),p=online?e.G.p2:e.G.p;
    boss.fireT=999;e.G.freezeT=999;Object.assign(p,{x:192,y:204,weapon,cool:0});
    const bubble={base:true,bubble:true,x:192,y:145,x0:192,y0:145,x1:192,y1:145,t:.5,dur:1.6,r:15,rx:15,ry:9,phase:0};
    const ordinary={base:true,x:240,y:145,x0:240,y0:145,x1:240,y1:145,t:.5,dur:1.6,r:2};
    e.G.eb=[bubble,ordinary];if(!online)e.K.KeyJ=true;
    for(let i=0;i<45&&e.G.eb.includes(bubble);i++){
      if(online)e.coop.remote.push(encodeInput({fire:true}));e.step();
    }
    assert.ok(!e.G.eb.includes(bubble),`${weapon} player ${p.pid}`);
    assert.ok(e.G.eb.includes(ordinary),'ordinary enemy shots are unaffected');
    assert.equal(e.G.fx.filter(f=>f.k==='baseBubblePop').length,1,'one shatter per bubble');
    assert.equal(p.dead,false);
  }
});

test('快速子弹与移动气泡之间采用连续碰撞，打碎后不会再伤害玩家，未命中则继续飞行',()=>{
  const e=quietBaseRoom(3),boss=activateMovingBoss(e);boss.fireT=999;e.G.freezeT=999;e.G.p.invT=0;
  const bubble={base:true,bubble:true,x:192,y:180,x0:192,y0:180,x1:192,y1:180,t:.99,dur:1.6,r:15,rx:15,ry:9,phase:0};
  e.G.eb=[bubble];e.G.pb=[{k:'laser',hits:new Set(),x0:192,y0:195,x:192,y:195,xe:192,ye:100,t:0,spd:20,dmg:2}];
  e.step();assert.ok(!e.G.eb.includes(bubble));assert.equal(e.G.p.dead,false);
  const missed={...bubble,dead:false,x:260,x0:260,x1:260,y:145,y0:145,y1:145,t:.5};
  e.G.eb=[missed];e.G.pb=[{k:'b',x0:192,y0:165,x:192,y:165,xe:192,ye:100,t:0,spd:20,dmg:1}];
  e.step();assert.ok(e.G.eb.includes(missed));assert.equal(missed.dead,false);
});

test('中枢摧毁后等待角色进入任意一侧升降梯，全尺寸升到顶部后进入第三关',()=>{
  for(const side of [-1,1]){
    const e=quietBaseRoom(3),B=e.G.base,boss=activateMovingBoss(e);
    shootBaseTarget(e,boss);e.G.p.weapon='laser';e.G.inv=['u','d'];e.G.p.shieldT=20;
    const score=e.G.score,lives=e.G.lives,scale=e.G.p.giantT;
    ticks(e,250);assert.equal(e.G.stage,2);assert.equal(e.G.mode,'play');assert.equal(B.exitReady,true);
    e.K[side<0?'KeyA':'KeyD']=true;
    for(let i=0;i<140&&!e.G.p.liftSide;i++)e.step();assert.equal(e.G.p.liftSide,side);
    const y=e.G.p.y;ticks(e,50);assert.ok(e.G.p.y<y);assert.equal(e.G.p.giantT,scale);
    assert.doesNotThrow(()=>e.render(),'active shields and elevator riders render together');
    for(let i=0;i<200&&e.G.stage===2;i++)e.step();
    assert.equal(e.G.stage,3);assert.equal(e.G.mode,'intro');assert.equal(e.G.p.weapon,'laser');
    assert.equal(e.G.score,score);assert.equal(e.G.lives,lives);assert.deepEqual(Array.from(e.G.inv),['u']);
  }
});

test('中枢摧毁后清除空中弹丸，等待和乘梯时按住两人的射击或手雷都不残留静止子弹',()=>{
  const e=quietBaseRoom(3,true),boss=activateMovingBoss(e);
  e.G.gr=[{base:true,t:0,x0:190,y0:174,xe:192,ye:71,a:0}];
  for(const p of [e.G.p,e.G.p2])Object.assign(p,{cool:0,flashT:.05,wantFire:true});
  shootBaseTarget(e,boss);assert.equal(e.G.base.dead,true);
  assert.equal(e.G.pb.length+e.G.eb.length+e.G.gr.length,0);
  e.K.KeyJ=e.K.KeyA=true;
  for(let tick=0;tick<300;tick++){
    e.K.KeyI=tick%2===0;e.coop.remote.push(encodeInput({fire:true,nade:tick%2===0}));e.step();
    assert.equal(e.G.stage,2);assert.equal(e.G.pb.length+e.G.eb.length+e.G.gr.length,0);
    for(const p of [e.G.p,e.G.p2])assert.equal(p.flashT,0);
  }
  assert.equal(e.G.p.liftSide,-1);assert.equal(e.G.p.liftDone,true);assert.ok(!e.G.p2.liftSide);
});

test('双人升降梯等待存活队友，已乘梯角色不会被输入拉回，快照保留核心气泡与升降状态',()=>{
  const e=quietBaseRoom(3,true),B=e.G.base,boss=activateMovingBoss(e);boss.fireT=0;e.step();
  let snapshot=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));
  assert.equal(snapshot.base.bossPhase,'mover');assert.equal(snapshot.base.bossTime,B.bossTime);assert.equal(snapshot.eb[0].bubble,true);
  shootBaseTarget(e,boss);assert.equal(e.G.eb.filter(b=>b.bubble).length,0,'the bubble intercepts the shot');
  shootBaseTarget(e,boss);assert.equal(B.dead,true);ticks(e,100);e.K.KeyA=true;
  for(let i=0;i<300;i++)e.step();assert.equal(e.G.stage,2);assert.equal(e.G.p.liftDone,true);assert.ok(!e.G.p2.liftDone);
  const before=[e.G.p.x,e.G.p.y];e.K.KeyA=false;e.K.KeyD=true;ticks(e,40);assert.deepEqual([e.G.p.x,e.G.p.y],before);
  snapshot=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));assert.equal(snapshot.p.liftDone,true);assert.equal(snapshot.p.liftSide,-1);
  const world=JSON.stringify(packWorld(e.G));e.render();assert.equal(JSON.stringify(packWorld(e.G)),world);
  for(let i=0;i<380&&e.G.stage===2;i++){e.coop.remote.push(encodeInput({right:true}));e.step();}
  assert.equal(e.G.stage,3);assert.equal(e.G.mode,'intro');assert.ok(e.G.p2);assert.equal(e.G.p2.y,waterfall.STAGE_THREE.bottom);
});

test('第二、四关各房间在普通波次间生成红色补给兵，每个携带一种装备',()=>{
  for(const stage of [2,4])for(const room of [0,1,2]){
    const e=quietBaseRoom(room);
    if(stage===4){e.play(4,false);e.loadRoom(room);e.G.p.invT=999;}
    const B=e.G.base,carriers=[];B.spawned=0;B.targets.forEach(t=>t.fireT=999);B.rolled=999;
    for(let wave=1;wave<=B.def.sol;wave++){
      B.sol=[];B.spawnT=0;e.step();const soldier=B.sol[0];assert.ok(soldier);
      if(soldier.dropKind){carriers.push({wave,kind:soldier.dropKind});assert.equal(soldier.st,'walk');}
    }
    assert.deepEqual(carriers,[...B.def.supply].map((kind,i)=>({wave:2+i*3,kind})));
    assert.equal(e.G.items.length,0,'enemies must be defeated to release supplies');
  }
});

test('红色补给兵被真实子弹击败就掉落一次，绿色士兵和自行撤退的红兵都不掉落',()=>{
  for(const red of [false,true]){
    const e=quietBaseRoom(),B=e.G.base,s={u:72,z:.5,st:'aim',t:999,anim:0,dropKind:red?'L':null};B.sol=[s];
    const copy=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));assert.equal(copy.base.sol[0].dropKind,s.dropKind);
    e.G.p.x=264;e.K.KeyJ=true;
    for(let i=0;i<60&&!s.dead;i++)e.step();
    assert.ok(s.dead);assert.equal(e.G.items.length,red?1:0);assert.equal(B.cleared,false);
    const score=e.G.score;e.killSoldier(s);assert.equal(e.G.score,score);assert.equal(e.G.items.length,red?1:0);
    if(red){const it=e.G.items[0];assert.equal(it.kind,'L');assert.equal(it.x,246);assert.ok(it.y<172);assert.equal(it.fromSoldier,true);assert.ok(!it.rest);}
  }
  const e=quietBaseRoom();e.G.base.sol=[{u:250,z:.5,st:'leave',dir:1,anim:0,dropKind:'S'}];e.step();assert.equal(e.G.items.length,0);assert.equal(e.G.score,0);
});

test('红兵掉落在战斗中落地并由二号玩家拾取，联机快照保留道具状态与来源',()=>{
  const e=quietBaseRoom(0,true),B=e.G.base,s={u:72,z:.5,st:'aim',t:999,anim:0,dropKind:'L'};B.sol=[s];
  e.G.p.x=60;e.G.p2.x=264;
  for(let i=0;i<60&&!s.dead;i++){e.coop.remote.push(encodeInput({fire:true}));e.step();}
  assert.ok(s.dead);const item=e.G.items[0];assert.ok(item&&!item.rest);assert.equal(e.G.p2.weapon,'rifle');
  for(let i=0;i<90&&!item.rest;i++)e.step();
  assert.equal(item.rest,true);assert.equal(item.y,204);assert.equal(item.x,246);assert.equal(B.cleared,false);
  const copy=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));assert.equal(copy.items[0].fromSoldier,true);assert.equal(copy.items[0].rest,true);
  e.G.p2.x=item.x;e.withPlayer2(e.collideBasePlayer);
  assert.equal(item.dead,true);assert.equal(e.G.p2.weapon,'laser');assert.equal(e.G.p.weapon,'rifle');
});

test('手雷和巨大化踩踏击败红色补给兵也能掉落装备',()=>{
  const grenade=quietBaseRoom();grenade.G.base.sol=[{u:30,z:.65,st:'aim',t:999,anim:0,dropKind:'S'}];
  grenade.K.KeyI=true;grenade.step();grenade.K.KeyI=false;ticks(grenade,46);
  assert.equal(grenade.G.items.length,1);assert.equal(grenade.G.items[0].kind,'S');assert.equal(grenade.G.base.cleared,false);
  const giant=quietBaseRoom();giant.G.inv=['u'];giant.G.sel=0;giant.useSpecial();
  giant.G.base.sol=[{u:8,z:0,st:'charge',anim:0,dropKind:'d'}];giant.collideBasePlayer();
  assert.equal(giant.G.items.length,1);assert.equal(giant.G.items[0].kind,'d');assert.equal(giant.G.p.dead,false);
});

test('第二、四关开门与自动清场不生成装备，已击落的物品保留原地',()=>{
  for(const stage of [2,4]){
    const e=quietBaseRoom();if(stage===4){e.play(4,false);e.G.p.invT=999;}
    const B=e.G.base;B.spawned=B.def.sol;B.rolled=999;B.targets.forEach(t=>{if(t.k!=='core')t.hp=0;});
    B.sol=[{u:100,z:.1,st:'charge',anim:0,dropKind:'L'}];
    const item={base:true,x:280,y:204,vy:0,rest:true,kind:'S',fromSoldier:true};e.G.items=[item];
    e.G.pb=[{k:'b',t:.99,spd:1.8,x0:192,y0:166,xe:192,ye:129,dmg:12}];e.step();
    assert.equal(B.cleared,true);assert.equal(e.G.items.length,1);
    assert.equal(e.G.items[0],item);assert.equal(item.x,280);assert.equal(item.y,204);
    if(stage===2){e.G.p.x=280;e.collideBasePlayer();assert.equal(e.G.p.weapon,'spread');}
  }
});

test('第二关三个普通房间都有高位机关，站立时所有武器和地面手雷都不能打坏它或绕过开门条件',()=>{
  for(const room of [0,1,2]){
    const e=quietBaseRoom(room),upper=e.G.base.targets.find(t=>t.k==='switch');
    assert.ok(upper);assert.ok(upper.y+upper.h<116);assert.ok(baseCoreShielded(e.G.base));
    const copy=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));assert.equal(copy.base.targets.find(t=>t.k==='switch').hp,4);
  }
  for(const weapon of ['rifle','machine','spread','laser','fire','homing','grenade']){
    const e=quietBaseRoom(),B=e.G.base,upper=B.targets.find(t=>t.k==='switch'),core=B.targets.find(t=>t.k==='core');
    e.G.p.weapon=weapon==='grenade'?'rifle':weapon;e.G.empT=99;
    if(weapon==='grenade')e.K.KeyI=true;else e.K.KeyJ=true;
    ticks(e,240);
    assert.equal(upper.hp,4,weapon);assert.equal(core.hp,12,weapon);assert.equal(B.cleared,false,weapon);
    assert.ok(baseCoreShielded(B,e.G.empT),'EMP cannot bypass the upper physical lock');
  }
  const fourth=engine();fourth.play(4,false);assert.ok(fourth.G.base.targets.some(t=>t.k==='switch'));
});

test('第二、四关中层炮台与下层核心由站立和卧倒分别命中',()=>{
  for(const stage of [2,4])for(const online of [false,true])for(const weapon of ['rifle','machine','spread','laser','fire','homing'])for(const tier of ['middle','low'])for(const down of [false,true]){
    const e=engine();e.play(stage,online);e.SET.autofire='on';const B=e.G.base,p=online?e.G.p2:e.G.p;
    const target=B.targets.find(t=>tier==='low'?t.k==='core':t.k==='gun');
    assert.ok(B.targets.some(t=>t.k==='switch'));assert.ok(target);target.hp=target.max=100;
    B.spawned=B.def.sol;B.rolled=999;B.sol=[];B.rol=[];B.targets.forEach(t=>{t.fireT=999;if(t.armored)t.aperture=1;if(tier==='low'&&t!==target)t.hp=0;});
    e.G.freezeT=999;Object.assign(p,{x:192+2*(target.x+target.w/2-192),y:204,weapon,cool:0,invT:999,onGround:true});
    for(let i=0;i<90;i++){
      if(online)e.coop.remote.push(encodeInput({fire:true,down}));else{e.K.KeyJ=true;e.K.KeyS=down;}
      e.step();
    }
    const shouldHit=(tier==='low')===down;
    assert.equal(target.hp<100,shouldHit,`${stage} ${p.pid}P ${weapon} ${tier} down=${down}`);
  }
});

test('第二、四关普通房间的墙面装置及其外框全部位于墙内，炮台层级互不遮挡',()=>{
  for(const stage of [2,4])for(const room of stage===2?[0,1,2]:[0,1,2,3]){
    const e=engine();e.play(stage,false);e.loadRoom(room);const targets=e.G.base.targets;
    for(const t of targets.filter(t=>['gun','rail','core'].includes(t.k))){
      assert.ok(t.y-1>=40&&t.y+t.h+1<=140,`${stage} room ${room} ${t.k} ${t.tier||'middle'} lies within the visible wall`);
    }
    const middle=targets.find(t=>t.k==='gun'),low=targets.find(t=>t.tier==='low');
    assert.equal(low.k,'core');assert.ok(targets.filter(t=>t.tier==='low').every(t=>t.k==='core'));
    assert.ok(middle.x+middle.w+1<low.x-1||low.x+low.w+1<middle.x-1,'side cannon and central core housings do not overlap');
    assert.ok(baseTargetAtHeight(middle,117));assert.ok(!baseTargetAtHeight(middle,134));
    assert.ok(baseTargetAtHeight(low,134));assert.ok(!baseTargetAtHeight(low,117));
  }
});

test('底层核心不发射子弹，滚雷从有机关的房间墙底两侧发射并受冻结与清场控制',()=>{
  for(const stage of [2,4]){
    const e=engine();e.play(stage,false);if(stage===2)e.loadRoom(1);const B=e.G.base;
    B.spawned=B.def.sol;B.sol=[];B.rolled=0;B.rol=[];B.rollT=.25;B.targets.forEach(t=>t.fireT=999);
    const low=B.targets.find(t=>t.tier==='low');low.fireT=0;e.G.p.invT=999;e.step();
    assert.ok(!e.G.eb.some(b=>b.x0===low.x+low.w/2&&b.y0===low.y+low.h/2));
    const outlet=B.rollSide;assert.ok([-1,1].includes(outlet));assert.equal(B.rol.length,0);
    e.G.freezeT=2;ticks(e,30);assert.equal(B.rollSide,outlet);assert.equal(B.rol.length,0);
    e.G.freezeT=0;e.G.p.x=222;ticks(e,16);
    const mine=B.rol[0];assert.ok(mine);assert.ok([-160,160].includes(mine.u0));
    assert.equal(Math.sign(mine.u0),outlet,'the selected outlet releases the drum');
    assert.equal(mine.ut,30,'the drum aims at the player position at release');
    assert.ok(Math.abs((192+mine.u0*.5)-(mine.u0<0?112:272))<.01,'launch aligns with the visible outlet');
    const z=mine.z,rollT=B.rollT;e.G.freezeT=2;ticks(e,30);assert.equal(mine.z,z);assert.equal(B.rollT,rollT);
    e.G.freezeT=0;e.hitTarget(B.targets.find(t=>t.k==='core'),999);
    B.targets.filter(t=>t.k!=='core').forEach(t=>{t.hp=0;});e.hitTarget(B.targets.find(t=>t.k==='core'),999);
    assert.equal(B.cleared,true);assert.equal(mine.dead,true);
  }
  const e=engine();e.play(2,false);assert.equal(e.G.base.def.rol,0);e.G.base.rollT=0;ticks(e,30);assert.equal(e.G.base.rol.length,0);
});

test('第二、四关玩家跳起后可用真实弹道射中上层机关',()=>{
  for(const stage of [2,4])for(const online of [false,true]){
    const e=engine();e.play(stage,online);e.SET.autofire='on';const B=e.G.base,p=online?e.G.p2:e.G.p;
    const upper=B.targets.find(t=>t.k==='switch');assert.ok(upper);e.G.freezeT=999;
    Object.assign(p,{x:192,y:204,weapon:'rifle',cool:0,onGround:true,invT:999});
    for(let tick=0;tick<500&&upper.hp>0;tick++){
      const jump=tick%55===0;
      if(online)e.coop.remote.push(encodeInput({fire:true,jump}));else{e.K.KeyJ=true;e.K.KeyK=jump;}
      e.step();
    }
    assert.ok(upper.hp<=0,`${stage} ${p.pid}P can reach the top tier`);
  }
});

test('实际跳跃射击能用六种武器命中高位机关，单人和二号玩家均能独立完成',()=>{
  for(const online of [false,true])for(const weapon of ['rifle','machine','spread','laser','fire','homing']){
    const e=quietBaseRoom(0,online),p=online?e.G.p2:e.G.p,upper=e.G.base.targets.find(t=>t.k==='switch');p.weapon=weapon;
    const heights=[];
    for(let tick=0;tick<500&&upper.hp>0;tick++){
      const jump=tick%55===0;
      if(online)e.coop.remote.push(encodeInput({fire:true,jump}));else{e.K.KeyJ=true;e.K.KeyK=jump;}
      e.step();for(const b of e.G.pb)if(b.owner===p.pid)heights.push(b.ye);
    }
    assert.ok(upper.hp<=0,`${weapon}, ${p.pid}P must destroy the elevated mechanism`);
    assert.ok(heights.some(y=>y<=100),`${weapon}: jumping raises the actual rear-wall trajectory`);
    assert.equal(p.dead,false);assert.ok(e.G.fx.some(f=>f.k==='boom'));
  }
});

test('第二关上方弹道会越过站在下方的敌兵，第四关同样使用跳跃投影高度',()=>{
  for(const elevated of [false,true]){
    const e=quietBaseRoom(),soldier={u:0,z:.5,st:'aim',t:99,anim:0};e.G.base.sol=[soldier];
    e.G.pb=[{k:'b',owner:1,t:.49,spd:.6,x0:192,y0:elevated?125:166,xe:192,ye:elevated?89:129,dmg:1}];
    e.step();assert.equal(!!soldier.dead,!elevated);assert.equal(!!e.G.pb[0],elevated);
  }
  assert.ok(baseShotHeight({y:150},4)<90);assert.ok(baseShotHeight({y:150},2)<90);
});

test('高位机关可被腾空投出的手雷破坏，命中后炮台停止射击并保持损坏状态',()=>{
  const e=quietBaseRoom(),B=e.G.base,upper=B.targets.find(t=>t.k==='switch');
  Object.assign(e.G.p,{y:150,vy:0,onGround:false});e.K.KeyI=true;e.step();e.K.KeyI=false;
  assert.ok(e.G.gr[0].ye<100);ticks(e,48);assert.ok(upper.hp<=0);
  assert.equal(B.cleared,false);e.G.eb=[];upper.fireT=0;ticks(e,20);assert.equal(e.G.eb.length,0);
  const state=JSON.stringify(packWorld(e.G));e.render();assert.equal(JSON.stringify(packWorld(e.G)),state);
});

function mineScene(online=false){
  const e=engine();e.play(2,online);const B=e.G.base;
  B.spawned=B.def.sol;B.rolled=99;B.sol=[];B.targets.forEach(t=>t.fireT=999);
  e.G.eb=[];e.G.fx=[];
  for(const p of [e.G.p,...(online?[e.G.p2]:[])])Object.assign(p,{x:192,y:204,vy:0,onGround:true,invT:0});
  return e;
}

test('第二、四关卧倒躲避炮弹、敌兵子弹及能量弹，但仍会被炸弹与滚雷击中',()=>{
  for(const stage of [2,4])for(const player2 of [false,true]){
    for(const kind of ['turret','base-soldier','boss-turret','ring','bubble','bomb','mine']){
      const e=engine();e.play(stage,true);const p=player2?e.G.p2:e.G.p;
      Object.assign(p,{x:192,y:204,invT:0,shieldT:0,riot:0,prone:true,onGround:true});
      e.G.base.sol=[];e.G.base.rol=[];e.G.eb=[];e.G.fx=[];
      if(kind==='mine')e.G.base.rol=[{u0:0,ut:0,z:.02,a:0,spd:.42}];
      else e.G.eb=[{base:true,t:.95,x:192,y:199,x0:192,y0:100,x1:192,y1:199,r:3,
        ...(kind==='bubble'?{bubble:true,rx:15,ry:9}:kind==='ring'?{ring:true}:kind==='bomb'?{bomb:true}:{from:kind})}];
      if(player2)e.withPlayer2(e.collideBasePlayer);else e.collideBasePlayer();
      assert.equal(p.dead,kind==='mine'||kind==='bomb',`${stage} ${player2?'2P':'1P'} ${kind}`);
      if(kind!=='mine'&&kind!=='bomb')assert.ok(!e.G.eb[0].dead,'dodged projectiles remain available to hit the teammate');
    }
    const e=engine();e.play(stage,true);Object.assign(e.G.p,{x:192,y:204,invT:0,prone:true});
    Object.assign(e.G.p2,{x:192,y:204,invT:0,prone:false});
    e.G.eb=[{base:true,t:.95,x:192,y:199,x0:192,y0:100,x1:192,y1:199,r:3}];
    e.collideBasePlayer();e.withPlayer2(e.collideBasePlayer);
    assert.equal(e.G.p.dead,false);assert.equal(e.G.p2.dead,true,'standing teammate remains vulnerable');
  }
});

test('敌方手雷到前沿必定爆炸一次，出现火焰烟尘，联机快照保留爆炸',()=>{
  const e=mineScene(),r={u0:0,ut:110,z:.001,a:0,spd:.42};e.G.base.rol=[r];
  e.step();assert.ok(r.dead);assert.ok(e.G.fx.some(f=>f.k==='boom'));assert.equal(e.G.fx.filter(f=>f.k==='smoke').length,3);
  assert.equal(e.G.fx.filter(f=>f.k==='baseMineBlast').length,1);assert.equal(e.G.p.dead,false);
  const blast=e.G.fx.find(f=>f.k==='baseMineBlast');assert.equal(blast.x,302);assert.equal(blast.z,0);
  const copy=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));assert.equal(copy.fx.find(f=>f.k==='baseMineBlast').x,blast.x);
  for(let i=0;i<8;i++)e.step();assert.equal(e.G.fx.filter(f=>f.k==='baseMineBlast').length,1);
});

test('手雷接触即爆，双人各自结算防护，不能被一人的护盾吞掉整次爆炸',()=>{
  const e=mineScene(true);e.G.p.shieldT=2;
  const r={u0:0,ut:0,z:.025,a:0,spd:.42};e.G.base.rol=[r];
  e.step();assert.ok(r.dead);assert.equal(e.G.p.dead,false);assert.equal(e.G.p2.dead,true);
  assert.equal(e.G.fx.filter(f=>f.k==='baseMineBlast').length,1);
  assert.deepEqual([...e.G.fx.find(f=>f.k==='baseMineBlast').hitPlayers],[1,2]);
});

test('跳跃能躲过地面手雷，冻结暂停手雷运动与引爆，卧倒射击对齐新姿势',()=>{
  const e=mineScene();Object.assign(e.G.p,{y:160,vy:-20,onGround:false});
  e.G.base.rol=[{u0:0,ut:0,z:.001,a:0,spd:.42}];e.step();assert.equal(e.G.p.dead,false);assert.ok(e.G.fx.some(f=>f.k==='baseMineBlast'));
  const f=mineScene();f.G.freezeT=1;const r={u0:0,ut:0,z:.001,a:0,spd:.42};f.G.base.rol=[r];
  for(let i=0;i<10;i++)f.step();assert.equal(r.z,.001);assert.ok(!r.dead);assert.ok(!f.G.fx.some(v=>v.k==='baseMineBlast'));
  f.G.freezeT=0;f.G.p.invT=2;f.step();assert.ok(r.dead);assert.equal(f.G.p.dead,false);
  const p=mineScene();p.K.KeyS=p.K.KeyJ=true;p.step();assert.ok(p.G.p.prone);assert.equal(p.G.pb[0].y0,178);
});

function giantScene(stage=1,online=false){
  const e=stage===2?mineScene(online):engine();
  if(stage!==2)e.play(stage,online);
  e.SET.inf='off';
  e.G.en=[];e.G.eb=[];e.G.pods=[];e.G.items=[];e.G.podTrig=[];e.G.spawnT=999;
  if(e.G.base){e.G.base.sol=[];e.G.base.rol=[];e.G.base.coreT=999;e.G.base.targets.forEach(t=>t.fireT=999);}
  for(const p of [e.G.p,...(online?[e.G.p2]:[])])Object.assign(p,{x:stage===1?40:192,y:stage===1?112:204,vy:0,onGround:true,invT:0});
  e.G.inv=['u'];e.G.sel=0;e.useSpecial();
  return e;
}
function ticks(e,n){for(let i=0;i<n;i++)e.step();}

test('暂停时震动和过门画面保持冻结，恢复后继续推进',()=>{
  for(const stage of [2,4])for(const online of [false,true]){
    const e=engine();e.play(stage,online);e.G.shake=9;e.G.base.trans=.8;
    e.G.mode='pause';const before={t:e.G.t,time:e.G.time,shake:e.G.shake,trans:e.G.base.trans};
    ticks(e,180);
    assert.deepEqual({t:e.G.t,time:e.G.time,shake:e.G.shake,trans:e.G.base.trans},before);
    e.G.mode='play';e.step();assert.equal(e.G.t,before.t+1);assert.ok(e.G.base.trans<before.trans);
  }
});
function playerShot(e,p=e.G.p){
  const b={x:p.x,y:p.y-18,r:1,vx:-90,vy:0};e.G.eb=[b];e.collide();return b;
}

test('拾取蘑菇后按道具键巨大化，前两秒连续中弹不耗护甲，跳跃保持脚朝下',()=>{
  const e=engine();e.play(1,false);e.G.en=[];e.G.eb=[];e.G.pods=[];e.G.podTrig=[];e.G.spawnT=999;e.G.inv=[];e.G.p.invT=0;
  const item={kind:'u',x:e.G.p.x,y:e.G.p.y,rest:true};e.G.items=[item];e.collide();
  assert.ok(item.dead);assert.deepEqual([...e.G.inv],['u']);assert.equal(e.G.p.giantT,0);
  e.step();e.K.KeyL=true;e.step();e.K.KeyL=false;
  const p=e.G.p;assert.equal(e.G.inv.length,0);assert.equal(p.giantT,15);assert.equal(p.giantHits,3);assert.equal(p.giantGraceT,2);
  for(let i=0;i<20;i++){assert.ok(playerShot(e).dead);assert.equal(p.giantHits,3);}
  ticks(e,90);assert.ok(playerShot(e).dead);assert.equal(p.giantHits,3);assert.ok(p.giantT>13);
  e.K.KeyK=true;e.step();e.K.KeyK=false;assert.ok(p.vy<0);assert.equal(p.spin,false);
  assert.equal(p.dead,false);assert.equal(e.G.deaths,0);assert.match(giantPowerLabel(p),/免疫/);
});

test('巨大化承受三次独立攻击后缩小，连发只结算一次，保留武器生命并提供缩小保护',()=>{
  const e=giantScene(),p=e.G.p,lives=e.G.lives;p.weapon='spread';ticks(e,122);
  for(const remaining of [2,1,0]){
    assert.ok(playerShot(e).dead);assert.equal(p.giantHits,remaining);assert.equal(p.dead,false);assert.equal(e.G.lives,lives);
    if(remaining){
      assert.ok(p.giantT>0);assert.match(giantPowerLabel(p),new RegExp(`护甲${remaining}次`));
      for(let i=0;i<12;i++)playerShot(e);assert.equal(p.giantHits,remaining,'one burst cannot drain all armor');
      ticks(e,49);
    }
  }
  assert.equal(p.giantT,0);assert.ok(p.invT>1);assert.equal(p.weapon,'spread');assert.equal(e.G.deaths,0);
  playerShot(e);assert.equal(p.dead,false);e.G.eb=[];ticks(e,76);playerShot(e);
  assert.equal(p.dead,true);assert.equal(e.G.lives,lives-1);assert.equal(p.weapon,'rifle');
});

test('巨大化脚下摧毁步兵、炮台及关闭的补给箱，只计分和掉落一次；普通人和上升跳跃不踩坏设施',()=>{
  for(const state of ['normal','ascending','giant']){
    const e=giantScene(),p=e.G.p;
    if(state==='normal')endGiant(p,false);
    if(state==='ascending'){p.vy=-80;p.onGround=false;}
    const turret={t:'tur',x:50,y:96,hp:6,open:false},box={t:'box',x:50,y:112,hp:6,open:false,item:'S'};
    e.G.en=[turret,box];
    if(state==='giant')e.G.en.push({t:'run',x:30,y:112,hp:1});
    const score=e.G.score;e.collide();
    if(state!=='giant'){assert.ok(!turret.dead&&!box.dead,state);assert.equal(e.G.score,score);continue;}
    assert.ok(e.G.en.every(v=>v.dead));assert.equal(e.G.score-score,1100);assert.equal(e.G.items.length,1);assert.equal(e.G.items[0].kind,'S');
    assert.equal(e.G.fx.filter(f=>f.k==='stomp').length,3);
    e.collide();assert.equal(e.G.score-score,1300);assert.equal(e.G.items.length,1);assert.ok(e.G.items[0].dead);
    e.collide();assert.equal(e.G.score-score,1300,'destroyed facilities and collected loot cannot score again');
    const before=JSON.stringify(packWorld(e.G));e.render();assert.equal(JSON.stringify(packWorld(e.G)),before);
  }
  assert.equal(giantCrushBox({giantT:1,x:30,y:100,vy:10,onGround:false})?.w,32);
  assert.equal(giantCrushBox({giantT:1,x:30,y:100,vy:-10,onGround:false}),null);
});

test('巨大化下降踩中要塞炮台沿用部件破坏流程，不能通过一次碰撞直接摧毁整个要塞',()=>{
  const e=giantScene(),p=e.G.p,B=e.G.boss;B.active=true;
  const gun=B.parts.find(pt=>pt.k==='gunA'),core=B.parts.find(pt=>pt.k==='core'),hp=core.hp;
  Object.assign(p,{x:gun.x+gun.w/2,y:gun.y+2,onGround:false,vy:100});e.collide();
  assert.ok(gun.hp<=0);assert.equal(typeof gun.destroyedAt,'number');assert.ok(p.giantCrushT>0);
  assert.equal(core.hp,hp);assert.equal(B.dead,false);assert.ok(e.G.fx.some(f=>f.k==='stomp'));
  Object.assign(p,{x:core.x+core.w/2,y:core.y+2});e.collide();assert.equal(core.hp,hp,'same contact has a stomp cooldown');
});

test('巨大化在前两关持续十五秒，暂停不计时，时间到自动缩小且不扣命',()=>{
  for(const stage of [1,2]){
    const e=giantScene(stage),p=e.G.p,lives=e.G.lives;
    e.G.mode='pause';ticks(e,90);assert.equal(p.giantT,15);assert.equal(p.giantGraceT,2);
    e.G.mode='play';ticks(e,60);assert.ok(Math.abs(p.giantT-14)<1e-6);
    ticks(e,839);assert.ok(p.giantT>0);assert.equal(p.dead,false);
    e.step();assert.equal(p.giantT,0);assert.equal(p.giantHits,0);assert.ok(p.invT>1);assert.equal(e.G.lives,lives);assert.equal(p.dead,false);
  }
});

test('第二关手雷爆炸同样消耗巨大化护甲，巨大化能够压倒冲到身边的敌兵',()=>{
  const e=giantScene(2),p=e.G.p,B=e.G.base;
  const grenade=()=>{const r={u0:0,ut:0,z:.025,a:0,spd:.42};B.rol=[r];e.step();assert.ok(r.dead);};
  grenade();assert.equal(p.giantHits,3);ticks(e,122);
  B.sol=[{u:0,z:0,st:'charge',anim:0}];e.collideBasePlayer();assert.ok(B.sol[0].dead);assert.ok(e.G.fx.some(f=>f.k==='stomp'));
  for(const remaining of [2,1,0]){grenade();assert.equal(p.giantHits,remaining);assert.equal(p.dead,false);ticks(e,49);}
  assert.equal(p.giantT,0);assert.equal(e.G.deaths,0);
});

test('双人巨大化的护甲与计时各自独立，快照完整保留，重复吃蘑菇刷新强化',()=>{
  const e=giantScene(1,true),a=e.G.p,b=e.G.p2;
  e.withPlayer2(()=>{e.G.inv=['u'];e.G.sel=0;e.useSpecial();});
  b.x=140;ticks(e,122);assert.ok(Math.abs(a.giantT-b.giantT)<1e-9);assert.ok(Math.abs(a.giantT-(15-122/60))<1e-6);
  playerShot(e,b);assert.equal(b.giantHits,2);assert.equal(a.giantHits,3);
  const copy=unpackWorld(JSON.parse(JSON.stringify(packWorld(e.G))));
  for(const key of ['giantT','giantHits','giantGraceT','giantHitT','giantCrushT'])assert.equal(copy.p2[key],b[key],key);
  e.withPlayer2(()=>{e.G.inv=['u'];e.G.sel=0;e.useSpecial();});
  assert.equal(b.giantT,15);assert.equal(b.giantHits,3);assert.equal(b.giantGraceT,2);assert.equal(b.giantHitT,0);assert.ok(a.giantT<13);
});

test('巨大化仍会在掉出场景时死亡，复活不继承巨大化或旧护甲',()=>{
  const e=giantScene(),old=e.G.p;old.y=260;old.onGround=false;e.step();
  assert.ok(old.dead);assert.equal(old.giantT,0);assert.equal(old.giantHits,0);assert.equal(old.giantGraceT,0);
  for(let i=0;i<200&&e.G.p.dead;i++)e.step();
  assert.equal(e.G.p.dead,false);assert.notEqual(e.G.p,old);assert.equal(e.G.p.giantT,0);assert.equal(e.G.p.giantHits,0);
});

test('第一关抬高岩台从两侧挡住行走和卧倒，跳上台面后才能越过',()=>{
  for(const side of [-1,1])for(const prone of [false,true]){
    const e=engine();e.play(1,false);e.G.en=[];e.G.pods=[];e.G.camX=400;
    const ledge=e.solids.find(s=>s.x===520&&!s.g),floor=e.solids.find(s=>s.x===240&&s.g),p=e.G.p;
    Object.assign(p,{x:side<0?ledge.x-18:ledge.x+ledge.w+18,y:floor.y,vx:0,vy:0,onGround:true,support:floor,invT:999});
    e.K[side<0?'KeyD':'KeyA']=true;e.K.KeyS=prone;ticks(e,35);
    assert.equal(p.x,side<0?ledge.x-5:ledge.x+ledge.w+5);assert.equal(p.y,floor.y);assert.equal(p.dead,false);
  }
  const e=engine();e.play(1,false);e.G.en=[];e.G.pods=[];e.G.camX=400;
  const ledge=e.solids.find(s=>s.x===520&&!s.g),floor=e.solids.find(s=>s.x===240&&s.g),p=e.G.p;
  Object.assign(p,{x:ledge.x-5,y:floor.y,vx:0,vy:0,onGround:true,support:floor,invT:999});
  e.step(); // Release the menu's held-jump latch before a new press.
  e.K.KeyD=e.K.KeyK=true;e.step();e.K.KeyK=false;ticks(e,24);e.K.KeyD=false;
  for(let i=0;i<100&&!p.onGround;i++)e.step();
  assert.equal(p.support,ledge);assert.equal(p.y,ledge.y);
  e.K.KeyD=true;for(let i=0;i<70&&p.x<ledge.x+ledge.w+6;i++)e.step();e.K.KeyD=false;
  for(let i=0;i<60&&!p.onGround;i++)e.step();
  assert.ok(p.x>ledge.x+ledge.w);assert.equal(p.y,floor.y);
});

test('第一关实体岩台挡住从下方顶穿，站在台面不能用下加跳穿过岩层',()=>{
  const e=engine();e.play(1,false);e.G.en=[];e.G.pods=[];e.G.camX=800;
  const ledge=e.solids.find(s=>s.x===960&&!s.g),floor=e.solids.find(s=>s.x===876&&s.g),p=e.G.p;
  Object.assign(p,{x:ledge.x+ledge.w/2,y:floor.y,vx:0,vy:0,onGround:true,support:floor,invT:999});
  e.step();
  e.K.KeyK=true;e.step();e.K.KeyK=false;let peak=p.y;
  for(let i=0;i<70;i++){e.step();peak=Math.min(peak,p.y);}
  assert.ok(peak>=ledge.y+ledge.h+22-.001);assert.equal(p.y,floor.y);assert.equal(p.support,floor);
  Object.assign(p,{x:ledge.x+ledge.w/2,y:ledge.y,vx:0,vy:0,onGround:true,support:ledge});
  e.K.KeyS=e.K.KeyK=true;e.step();assert.ok(p.vy<0);assert.ok(p.y<ledge.y);assert.equal(p.dropT,0);
});

test('第三关水中伏兵先预警、向上发射，并在弹道顶点分裂为三颗下落弹',()=>{
  const e=engine();e.play(3,false);e.G.camY=0;e.G.eb=[];e.G.pb=[];
  const guards=e.G.en.filter(q=>q.t==='waterAmbush');assert.ok(guards.length>=6);
  const guard=guards[0];e.G.en=[guard];Object.assign(e.G.p,{x:190,y:176,invT:99});guard.fireT=0;
  e.updateEnemies();assert.ok(guard.warning>.6);assert.equal(e.G.eb.length,0);
  for(let i=0;i<45&&!e.G.eb.length;i++)e.updateEnemies();
  const shot=e.G.eb[0];assert.equal(shot.waterAmbush,'rise');assert.ok(shot.vy<0);const startY=shot.y;
  for(let i=0;i<100&&!shot.dead;i++)e.updateBullets();
  assert.ok(shot.dead);assert.ok(shot.y<startY-50);
  const parts=e.G.eb.filter(b=>!b.dead&&b.waterAmbush==='fall');assert.equal(parts.length,3);
  assert.ok(parts[0].vx<0&&parts[1].vx===0&&parts[2].vx>0);assert.ok(parts.every(b=>b.vy>0));
  const frozen=parts.map(b=>[b.x,b.y,b.vy]);e.G.freezeT=1;e.updateBullets();assert.deepEqual(parts.map(b=>[b.x,b.y,b.vy]),frozen);
  e.G.freezeT=0;e.updateBullets();assert.ok(parts.every((b,i)=>b.y>frozen[i][1]));
  const copy=unpackWorld(packWorld(e.G));assert.equal(copy.en[0].t,'waterAmbush');assert.equal(copy.eb.filter(b=>!b.dead&&b.waterAmbush==='fall').length,3);
});

test('第三关水中伏兵可被击败，分裂弹可以命中任一玩家',()=>{
  const e=engine();e.play(3,false);const guard=e.G.en.find(q=>q.t==='waterAmbush');e.G.en=[guard];e.G.eb=[];
  e.G.pb=[{k:'b',x:guard.x,y:guard.y-8,vx:0,vy:0,dmg:1}];e.collide();assert.equal(guard.dead,true);
  for(const slot of [1,2]){
    const team=engine();team.play(3,true);team.G.en=[];team.G.pb=[];
    const p=slot===1?team.G.p:team.G.p2,other=slot===1?team.G.p2:team.G.p;
    Object.assign(p,{x:200,y:160,invT:0,shieldT:0});Object.assign(other,{x:280,y:160});
    team.G.eb=[{waterAmbush:'fall',x:p.x,y:p.y-14,r:2.8,vx:0,vy:42,g:175}];team.collide();
    assert.equal(p.dead,true);assert.equal(other.dead,false);
  }
});

test('第三关两团火在桥面相向交叉并往返，伤害范围始终跟随火焰',()=>{
  for(const bridge of waterfall.FLAME_BRIDGES){
    const times=[2.55,3.3,4.3,5.3,6.05].map(t=>t-bridge.phase);
    const positions=times.map(t=>waterfall.flameJetPositions(bridge,t));
    assert.ok(positions[0][0]<positions[0][1]);
    assert.ok(Math.abs(positions[1][0]-positions[1][1])<1e-8);
    assert.ok(positions[2][0]>positions[2][1]);
    assert.ok(Math.abs(positions[3][0]-positions[3][1])<1e-8);
    assert.ok(positions[4][0]<positions[4][1]);
    for(let i=0;i<times.length;i++){
      const boxes=waterfall.flameJetBoxes(times[i]).filter(b=>Math.abs(b.y+b.h-bridge.y)<1e-8);
      assert.equal(boxes.length,2);
      for(let j=0;j<2;j++){
        assert.ok(Math.abs(boxes[j].x+boxes[j].w/2-positions[i][j])<1e-8);
        assert.ok(positions[i][j]>bridge.x+5&&positions[i][j]<bridge.x+bridge.w-5);
      }
    }
  }
  for(const slot of [1,2])for(const time of [2.55,4.3,6.05]){
    const e=engine();e.play(3,true);e.G.en=[];e.G.time=time;e.G.freezeT=0;
    const bridge=waterfall.FLAME_BRIDGES[0],p=slot===1?e.G.p:e.G.p2,other=slot===1?e.G.p2:e.G.p;
    Object.assign(p,{x:waterfall.flameJetPositions(bridge,time)[0],y:bridge.y,onGround:true,invT:0});
    Object.assign(other,{x:30,y:bridge.y,invT:0});e.updateStage3();
    assert.equal(p.dead,true);assert.equal(other.dead,false);
  }
});

test('第六关实际刷出的巡逻兵会迅速边行走边开枪',()=>{
  const e=engine();e.play(6,false);e.G.en=[];e.G.podTrig=[];e.G.eb=[];e.G.jets=[];e.G.camX=0;e.G.spawnT=0;
  Object.assign(e.G.p,{x:120,y:176,onGround:true,invT:999});
  e.updateEnemies();const soldier=e.G.en.find(q=>q.t==='run');assert.ok(soldier,'real spawner creates a runner');
  assert.ok(soldier.fireT>=.45&&soldier.fireT<=.8);e.G.spawnT=9999;
  let aimX=null,shot=null;
  for(let i=0;i<150&&!shot;i++){
    e.updateEnemies();if(soldier.attack?.phase==='aim'&&aimX===null)aimX=soldier.x;
    shot=e.G.eb.find(b=>b.from==='runner');
  }
  assert.ok(shot,'the naturally spawned runner fires');assert.ok(soldier.x<aimX-5,'keeps moving during aim');
  assert.ok(shot.vx<0,'fires towards the player');assert.equal(shot.vy,0);
});

test('第六关跑兵穿过已冷却喷火区时不会取消开枪',()=>{
  const {e,soldier}=stageSixRunnerScene(288,1,170);e.G.eb=[];e.G.jets=[{x:300,v:1,per:3.2,off:0,st:'cold',k:0}];
  e.G.s6.coolT=8;soldier.fireT=0;let insideShot=false;
  for(let i=0;i<28;i++){
    e.updateEnemies();if(e.G.eb.some(b=>b.from==='runner')){insideShot=soldier.x<315;break;}
  }
  assert.ok(insideShot,'a safe crossing retains and completes the attack');assert.ok(soldier.x>288);
});

test('第六关喷火通道缩短且两侧各层的火焰覆盖整个横向路径',()=>{
  const q=stageSixCombat.STAGE_SIX_GALLERY,e=engine();e.play(6,false);const jets=e.G.jets.filter(j=>j.gallery);
  const corridors=[{side:'ascent',left:q.left+q.leftWidth,right:q.right},{side:'descent',left:q.right+q.rightWidth,right:q.end}];
  for(const c of corridors){
    assert.ok(c.right-c.left<150,'the horizontal corridor is shorter than the previous 198-pixel section');
    for(const y of [80,120,160]){
      const pair=jets.filter(j=>j.side===c.side&&j.y===y);assert.equal(pair.length,2);
      assert.deepEqual(Array.from(pair,j=>j.dir).sort(),[-1,1]);
      for(const j of pair){
        j.k=1;const box=e.jetBox(j);
        if(j.dir>0){assert.ok(box.x<=c.left+6);assert.ok(box.x+box.w>=c.right);}
        else {assert.ok(box.x<=c.left);assert.ok(box.x+box.w>=c.right-6);}
      }
      assert.equal(pair[0].off,pair[1].off,'opposing fire shares an escape window');
    }
  }
  for(const c of corridors)for(const dir of [-1,1])for(const slot of [1,2]){
    const f=engine();f.play(6,true);f.G.en=[];f.G.podTrig=[];f.G.spawnT=9999;f.G.camX=2400;
    const j={...f.G.jets.find(v=>v.side===c.side&&v.y===120&&v.dir===dir),k:0,st:'off'};f.G.jets=[j];
    f.G.time=j.per-1.3-j.off+.45;
    const p=slot===1?f.G.p:f.G.p2,other=slot===1?f.G.p2:f.G.p;
    Object.assign(p,{x:dir>0?c.right-10:c.left+10,y:136,onGround:true,invT:0,shieldT:0});
    Object.assign(other,{x:2450,y:176,onGround:true,invT:999});f.step();
    assert.equal(p.dead,true,`${c.side}, direction ${dir}, player ${slot}: flame reaches far end`);
  }
});

test('第六关翻过立柱后，另一侧可以沿上、中平台逐层下降',()=>{
  const e=engine();e.play(6,false);e.G.en=[];e.G.podTrig=[];e.G.jets=[];e.G.spawnT=9999;e.G.camX=2400;
  const q=stageSixCombat.STAGE_SIX_GALLERY,p=e.G.p;
  Object.assign(p,{x:q.right+q.rightWidth+9,y:72,vy:0,onGround:false,invT:999});
  e.K.KeyD=true;const landings=[];
  for(let i=0;i<170;i++){
    e.step();if(p.onGround&&landings.at(-1)!==p.y)landings.push(p.y);
    if(p.x>=q.end+5&&p.onGround&&p.y===176)break;
  }
  assert.deepEqual(landings,[96,136,176]);assert.ok(p.x>=q.end+5,'the descending side rejoins the ground');
});

test('第六关完整喷火攀爬路线可依次上到顶部，越过实心隔柱，再沿右侧平台回到地面',()=>{
  for(const slot of [1,2]){
  const e=engine();e.play(6,slot===2);e.G.en=[];e.G.podTrig=[];e.G.jets=[];e.G.spawnT=9999;e.G.camX=2400;
  const q=stageSixCombat.STAGE_SIX_GALLERY,p=slot===1?e.G.p:e.G.p2;Object.assign(p,{x:2580,y:176,vy:0,onGround:true,invT:999});
  if(slot===2)Object.assign(e.G.p,{x:2550,y:176,onGround:true,invT:999});
  const move=({jump=false,right=false}={})=>{if(slot===1){e.K.KeyK=jump;e.K.KeyD=right;}else e.coop.remote.push(encodeInput({jump,right}));e.step();};move();
  const visited=[176];
  for(const y of [136,96,q.crownTop]){
    move({jump:true});let landed=false;
    for(let i=0;i<90;i++){move();if(p.onGround&&p.y===y){landed=true;visited.push(y);break;}}
    assert.ok(landed,'ascending tier '+y);
  }
  assert.equal(p.support.galleryCrown,true);
  for(let i=0;i<180;i++){move({right:true});if(p.onGround&&visited.at(-1)!==p.y)visited.push(p.y);if(p.x>q.end+10&&p.onGround&&p.y===176)break;}
  assert.deepEqual(visited,[176,136,96,56,96,136,176]);assert.ok(p.x>q.end+10);assert.equal(p.dead,false);
  }
});

test('第六关重新进入和跨关返回都会创建完整的新地形，顶部平台不会继承上一局的消失状态',()=>{
  const e=engine();e.play(6,false);const crown=e.solids.find(s=>s.galleryCrown);assert.ok(crown?.solid);crown.gone=true;
  e.reset(6);const again=e.solids.find(s=>s.galleryCrown);assert.notEqual(again,crown);assert.equal(again.gone,undefined);assert.equal(e.solids.filter(s=>s.gallery).length,5);
  e.play(7,false);e.play(6,false);assert.equal(e.solids.filter(s=>s.gallery).length,5);assert.ok(e.solids.some(s=>s.galleryCrown&&s.solid&&!s.gone));assert.ok(e.solids.some(s=>s.galleryWall&&s.solid));assert.equal(e.G.jets.filter(j=>j.gallery).length,12);
});

test('第六关通道喷火画面长度与实际伤害范围一致',()=>{
  const q=stageSixCombat.STAGE_SIX_GALLERY,jets=q.outlets.map(j=>({...j,st:'fire',k:1})),flames=[];
  const gradient={addColorStop(){}};
  const g=new Proxy({createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  const art={g,state:{time:2},rect(){},disc(){},light(){},line(){},flame:(...args)=>flames.push(args)};
  StageSixArt.prototype.jets.call(art,jets,[],2400);assert.equal(flames.length,jets.length);
  for(let i=0;i<jets.length;i++){
    const j=jets[i],f=flames[i];assert.equal(f[0],j.x+j.dir*6);assert.equal(f[1],j.y);
    assert.equal(f[2],j.dir);assert.equal(f[4],j.range);
  }
});

test('第六关机器人落下或着地时踩中两位玩家均致命，静止、上升或冰冻不造成踩踏',()=>{
  for(const slot of [1,2])for(const foot of [-30,30]){
    const e=engine();e.play(6,true);e.G.en=[];e.G.podTrig=[];e.G.jets=[];e.G.eb=[];e.G.spawnT=9999;e.G.camX=2916;
    const b=e.G.golem,p=slot===1?e.G.p:e.G.p2,other=slot===1?e.G.p2:e.G.p;
    Object.assign(b,{active:true,x:3160,y:174,ground:176,phase:'jump',vy:150,vx:0,stompT:0,shotT:999});
    Object.assign(p,{x:b.x+foot,y:176,vy:0,onGround:true,invT:0,shieldT:0});
    Object.assign(other,{x:3040,y:176,vy:0,onGround:true,invT:999});e.step();
    assert.equal(b.phase,'land');assert.equal(p.dead,true,`player ${slot}, foot ${foot}`);assert.equal(other.dead,false);
    assert.ok(b.stompT>0);const copy=unpackWorld(packWorld(e.G));assert.equal(copy.golem.stompT,b.stompT);
  }
  for(const state of ['idle','rising','frozen','dead','inactive']){
    const e=engine();e.play(6,true);e.G.en=[];e.G.jets=[];e.G.s6.waves=[];
    const b=e.G.golem,p=e.G.p2;Object.assign(b,{active:state!=='inactive',dead:state==='dead',phase:state==='rising'?'jump':'idle',vy:state==='rising'?-100:0});
    e.G.freezeT=state==='frozen'?1:0;Object.assign(p,{x:b.x+30,y:b.y,invT:0,shieldT:0});e.collidePartnerHazards();
    assert.equal(p.dead,false,state);
  }
});

test('第三关落石脱落或击碎后按间隔在原岩壁循环补充，冻结和双人快照保留倒计时',()=>{
  const e=engine();e.play(3,true);e.G.s3.rockT=9999;e.G.s3.runT=9999;e.G.spawnT=9999;e.G.p.invT=9999;e.G.p2.invT=9999;
  const rock=e.G.en.find(q=>q.waterfallRock&&q.y<150),slot=e.G.s3.rockSlots.find(q=>q.sourceId===rock.sourceId);
  assert.ok(slot);e.G.en=[rock];e.G.s3.rockSlots=[slot];
  Object.assign(rock,{phase:'warning',warnT:wallRock.WALL_ROCK_WARNING});
  for(let i=0;i<100&&rock.phase==='warning';i++)e.updateEnemies();
  assert.equal(rock.phase,'fall');e.updateStage3();assert.equal(slot.respawnT,wallRock.WALL_ROCK_RESPAWN);
  for(let i=0;i<120;i++)e.updateStage3();assert.ok(slot.respawnT>3.9&&slot.respawnT<4.1);
  e.G.freezeT=1;const remaining=slot.respawnT;for(let i=0;i<60;i++)e.updateStage3();assert.equal(slot.respawnT,remaining);
  const remote=unpackWorld(packWorld(e.G));assert.equal(remote.s3.rockSlots[0].respawnT,remaining);
  e.G.freezeT=0;for(let i=0;i<300&&!e.G.en.some(r=>r!==rock&&r.sourceId===slot.sourceId&&r.phase==='embedded'&&!r.dead);i++)e.updateStage3();
  const fresh=e.G.en.find(r=>r!==rock&&r.sourceId===slot.sourceId&&r.phase==='embedded'&&!r.dead);
  assert.ok(fresh,'a new rock appears in the original wall');assert.equal(fresh.x,slot.x);assert.equal(fresh.y,slot.y);assert.equal(fresh.hp,wallRock.WALL_ROCK_HP);
  for(let i=0;i<wallRock.WALL_ROCK_HP-1;i++)e.damageEnemy(fresh,1,fresh.x,fresh.y-fresh.r);
  assert.equal(fresh.dead,undefined);e.damageEnemy(fresh,1,fresh.x,fresh.y-fresh.r);assert.equal(fresh.dead,true);
  e.updateStage3();assert.equal(slot.respawnT,wallRock.WALL_ROCK_RESPAWN);
  for(let i=0;i<wallRock.WALL_ROCK_RESPAWN*60+2;i++)e.updateStage3();
  const third=e.G.en.find(r=>r!==rock&&r!==fresh&&r.sourceId===slot.sourceId&&!r.dead&&r.phase==='embedded');
  assert.ok(third,'destroyed wall rocks also return after the interval');
  e.G.s3.rockT=0;e.updateStage3();assert.equal(third.phase,'warning');assert.equal(third.warnT,wallRock.WALL_ROCK_WARNING);
  e.G.mech.active=true;const count=e.G.en.length;for(let i=0;i<420;i++)e.updateStage3();assert.equal(e.G.en.length,count,'no respawns during the boss');
});

test('第二、四关各房间敌兵在墙边左右往返并开枪，只有红兵跳跃',()=>{
  for(const stage of [2,4])for(const room of [0,1,2])for(const red of [false,true]){
    const e=engine();e.play(stage,true);e.loadRoom(room);const B=e.G.base;
    B.sol=[];B.spawned=red?1:0;B.spawnT=0;B.rolled=999;B.targets.forEach(t=>t.fireT=999);
    e.G.p.invT=999;e.G.p2.invT=999;e.step();const s=B.sol[0];assert.ok(s?.patrolArmed);assert.equal(!!s.dropKind,red);
    B.spawned=B.def.sol;let left=0,right=0,jumped=false,shot=false;
    for(let i=0;i<600;i++){
      const previous=s.u;e.step();assert.ok(!s.dead,`stage ${stage} room ${room}`);
      assert.equal(s.z,BASE_PATROL_DEPTH);assert.equal(s.st,'walk');assert.ok(Math.abs(s.u)<=BASE_PATROL_LIMIT);
      if(s.u<previous)left++;if(s.u>previous)right++;
      jumped ||=s.jumpY>0;shot ||=e.G.eb.some(b=>b.from==='base-soldier');
    }
    assert.ok(left>20&&right>20,'the soldier reverses and patrols in both directions');
    assert.equal(jumped,red,'only red carriers jump');assert.ok(shot,'both enemy types fire');
    const point=204-64*s.z;assert.ok(point>=140&&point<150,'the projected feet remain near the back wall');
    const copy=unpackWorld(packWorld(e.G)).base.sol[0];assert.equal(copy.z,s.z);assert.equal(copy.patrolDir,s.patrolDir);
  }
});

test('第二、四关墙边巡逻兵可被玩家普通子弹击中并掉落补给',()=>{
  for(const stage of [2,4]){
    const e=engine();e.play(stage,false);const B=e.G.base;
    B.sol=[];B.spawned=1;B.spawnT=0;B.rolled=999;B.targets.forEach(t=>t.fireT=999);
    e.G.p.invT=999;e.step();const s=B.sol[0];assert.ok(s.dropKind);B.spawned=B.def.sol;
    Object.assign(s,{jumpY:0,jumpV:0});e.G.p.x=192+s.u;e.G.freezeT=5;e.K.KeyJ=true;
    for(let i=0;i<100&&!s.dead;i++)e.step();
    assert.equal(s.dead,true,`stage ${stage}: actual rifle fire hits the wall patrol`);
    assert.equal(e.G.items.filter(it=>it.fromSoldier).length,1);assert.equal(e.G.items.find(it=>it.fromSoldier).kind,s.dropKind);
  }
});

test('第二、四关限制同时巡逻人数，消灭后继续生成，过关后停止巡逻并清场',()=>{
  for(const stage of [2,4]){
    const e=engine();e.play(stage,false);const B=e.G.base;B.sol=[];B.spawned=0;B.spawnT=0;B.rolled=999;
    B.targets.forEach(t=>t.fireT=999);e.G.p.invT=999;
    for(let i=0;i<1000;i++){e.step();assert.ok(B.sol.filter(s=>!s.dead).length<=BASE_PATROL_MAX);}
    assert.equal(B.sol.length,BASE_PATROL_MAX);assert.equal(B.spawned,BASE_PATROL_MAX);
    e.killSoldier(B.sol[0]);for(let i=0;i<240&&B.spawned===BASE_PATROL_MAX;i++)e.step();
    assert.equal(B.spawned,BASE_PATROL_MAX+1,'the next patrol appears after a slot opens');
    B.targets.forEach(t=>{if(t.k!=='core')t.hp=0;});
    const core=B.targets.find(t=>t.k==='core');core.aperture=1;e.hitTarget(core,12);
    assert.equal(B.cleared,true);assert.ok(B.sol.every(s=>s.st==='leave'||s.dead));
    e.K.KeyW=true;e.step();e.K.KeyW=false;assert.equal(B.sol.length,0,'all soldiers disappear on the first advance frame');
  }
});

test('第二、四关只有红色补给兵高跳并躲开真实迎面子弹，普通敌兵留在地面',()=>{
  for(const stage of [2,4])for(const red of [false,true]){
    const e=engine();e.play(stage,false);const B=e.G.base;B.sol=[];B.spawned=red?1:0;B.spawnT=0;B.rolled=999;
    B.targets.forEach(t=>t.fireT=999);e.G.p.invT=999;e.step();const s=B.sol[0];assert.equal(!!s.dropKind,red);
    B.spawned=B.def.sol;Object.assign(s,{u:0,patrolDir:1,patrolSpeed:.00001,jumpT:999,jumpY:0,jumpV:0,dodgeT:0,fireT:999});
    Object.assign(e.G.p,{x:192,cool:0});e.K.KeyJ=true;e.step();e.K.KeyJ=false;
    const bullet=e.G.pb[0];assert.ok(bullet,'a real rifle shot was created');let peak=0,passed=false;
    for(let i=0;i<55;i++){
      e.step();peak=Math.max(peak,baseSoldierJumpOffset(s));passed ||=bullet.t>=s.z;
      if(s.dead||passed)break;
    }
    if(red){
      assert.ok(passed,'the bullet reaches the red carrier depth');assert.equal(!!s.dead,false,'red carrier jumps over the shot');
      assert.ok(peak>30,`the displayed jump is high enough to clear the bullet: ${peak}`);
      const copy=unpackWorld(packWorld(e.G));assert.ok(copy.base.sol[0].jumpY>0);
    }else{
      assert.equal(s.dead,true,'the same shot hits the non-jumping soldier');assert.equal(peak,0);
    }
  }
});

test('红色补给兵高跳时仍能被击中，偏离路线的子弹不会触发躲避',()=>{
  for(const stage of [2,4]){
    const e=engine();e.play(stage,false);const B=e.G.base;B.sol=[];B.spawned=1;B.spawnT=0;B.rolled=999;
    B.targets.forEach(t=>t.fireT=999);e.G.p.invT=999;e.step();const s=B.sol[0];B.spawned=B.def.sol;
    Object.assign(s,{u:0,patrolDir:1,patrolSpeed:.00001,jumpT:999,jumpY:0,jumpV:0,dodgeT:0,fireT:999});
    e.G.pb=[{k:'b',owner:1,t:0,spd:1.8,x0:35,y0:166,xe:35,ye:129,dmg:1}];
    for(let i=0;i<15;i++)e.step();assert.equal(s.jumpY,0,'a distant shot does not cause a dodge');
    Object.assign(s,{jumpY:35,jumpV:0});e.G.freezeT=1;
    const x=192+s.u*(1-.5*s.z),y=204-64*s.z-baseSoldierJumpOffset(s)-BASE_SOLDIER.height*baseSoldierScale(s.z)/2;
    e.G.pb=[{k:'b',owner:1,t:s.z-.01,spd:.6,x0:x,y0:y,xe:x,ye:y,dmg:1}];e.step();
    assert.equal(s.dead,true,'airborne soldier can still be hit in its visible body');
  }
});

test('第二关关底三炮弹随飞行逐渐散开，冻结暂停且双人快照保留轨迹',()=>{
  for(const targetX of [30,192,354]){
    const e=engine();e.play(2,true);e.loadRoom(3);e.G.p.invT=999;e.G.p2.invT=999;
    e.G.p.x=targetX;e.G.p2.x=targetX;const B=e.G.base;B.targets.forEach(t=>t.fireT=999);
    const turret=B.targets[2];turret.fireT=0;
    for(let i=0;i<80&&!e.G.eb.some(b=>b.from==='boss-turret');i++)e.step();
    const shots=e.G.eb.filter(b=>b.from==='boss-turret');assert.equal(shots.length,3);
    assert.equal(shots[1].x1,targetX,'the central shot aims at the nearest player');
    assert.equal(shots[0].x1,targetX-40);assert.equal(shots[2].x1,targetX+40);
    const spacing=()=>[shots[1].x-shots[0].x,shots[2].x-shots[1].x];
    const first=spacing();for(let i=0;i<40;i++)e.step();const middle=spacing();
    assert.ok(middle[0]>first[0]+10&&middle[1]>first[1]+10,'both sides spread as they fly');
    assert.ok(Math.abs(middle[0]-middle[1])<1e-8,'fan remains centered');
    e.G.freezeT=3;const before=shots.map(b=>[b.x,b.y,b.t]);for(let i=0;i<30;i++)e.step();
    assert.deepEqual(shots.map(b=>[b.x,b.y,b.t]),before,'freezing preserves all three positions');
    const copy=unpackWorld(packWorld(e.G)).eb.filter(b=>b.from==='boss-turret');
    assert.deepEqual(Array.from(copy,b=>[b.x,b.y,b.x1,b.y1,b.t]),Array.from(shots,b=>[b.x,b.y,b.x1,b.y1,b.t]));
    e.G.freezeT=0;for(let i=0;i<30;i++)e.step();const late=spacing();assert.ok(late[0]>middle[0]&&late[1]>middle[1]);
  }
});

test('第二关关底散开的三颗子弹各自可命中两名玩家',()=>{
  for(const slot of [1,2])for(const index of [0,1,2]){
    const e=engine();e.play(2,true);e.loadRoom(3);const B=e.G.base;
    B.targets.forEach(t=>t.fireT=999);B.targets[2].fireT=0;
    Object.assign(e.G.p,{x:192,invT:999});Object.assign(e.G.p2,{x:192,invT:999});
    for(let i=0;i<80&&!e.G.eb.some(b=>b.from==='boss-turret');i++)e.step();
    const shots=e.G.eb.filter(b=>b.from==='boss-turret');assert.equal(shots.length,3);
    for(let i=0;i<110&&shots[index].t<.9;i++)e.step();
    const p=slot===1?e.G.p:e.G.p2,other=slot===1?e.G.p2:e.G.p;
    Object.assign(p,{x:shots[index].x,y:204,invT:0,shieldT:0,dead:false});other.invT=999;
    if(slot===1)e.collideBasePlayer();else e.withPlayer2(e.collideBasePlayer);
    assert.equal(p.dead,true,`player ${slot}, projectile ${index}`);assert.equal(other.dead,false);assert.equal(shots[index].dead,true);
  }
});

test('第二、四关敌兵保持正面朝向，左右移动时枪口与实际射击一致',()=>{
  for(const stage of [2,4])for(const red of [false,true])for(const side of [-1,1]){
    const e=engine();e.play(stage,true);const B=e.G.base;B.sol=[];B.spawned=red?1:0;B.spawnT=0;B.rolled=999;
    B.targets.forEach(t=>t.fireT=999);if(B.galleryTimers)B.galleryTimers.fill(999);
    Object.assign(e.G.p,{x:90,invT:999});Object.assign(e.G.p2,{x:280,invT:999});e.step();const s=B.sol[0];
    B.spawned=B.def.sol;Object.assign(s,{u:side*50,patrolDir:-side,fireT:0,jumpT:999,jumpY:0,jumpV:0,dodgeT:0});
    const target=side<0?e.G.p:e.G.p2,other=side<0?e.G.p2:e.G.p;target.invT=0;other.invT=999;
    e.G.eb=[];const x0=s.u;e.step();assert.notEqual(s.u,x0,'the soldier moves horizontally');
    const shot=e.G.eb.find(b=>b.from==='base-soldier');assert.ok(shot);assert.equal(shot.x1,target.x);
    const x=192+s.u*(1-.5*s.z);assert.ok(Math.abs(shot.x0-x)<1e-9,'the front-facing muzzle is centered');
    assert.ok(Math.abs(shot.y0-(204-64*s.z-baseSoldierJumpOffset(s)-BASE_SOLDIER.muzzleHeight*baseSoldierScale(s.z)))<1e-9);
    for(let i=0;i<100&&!target.dead;i++)e.step();
    assert.equal(target.dead,true,`stage ${stage}, red ${red}, side ${side}: actual bullet hits target`);
    assert.equal(other.dead,false);
  }
});
