import { packWorld, unpackWorld } from '/games/contra2026/js/coop-core.mjs';
import { inventorySlotAt } from '/games/contra2026/js/hud-layout.mjs';
import { MOTORCYCLE_RIDER } from '/games/contra2026/js/stage-one-motion.mjs?v=leg-alignment-2';
import { OPEN_STAGES, LAST_OPEN_STAGE, STAGE_RELEASE_MESSAGE, isStageOpen, nextOpenStage } from '/games/contra2026/js/release-stages.mjs?v=hangar-bay-depth-1';
import { CoopClient } from '/games/contra2026/js/coop-net.mjs';
import { normalizeAudioMix, audioMixLevels } from '/games/contra2026/js/audio-mix.mjs';
import { ContraWeaponAudio, receivedWeaponShots } from '/games/contra2026/js/weapon-audio.mjs?v=weapon-shot-sfx-1';
import { aimEscortDrone } from '/games/contra2026/js/escort-drone.mjs?v=escort-drone-2';
import { advanceAlienCrawler } from '/games/contra2026/js/alien-crawler.mjs?v=crawler-walk-1';
import { createAlienGuardian, createAlienGuardianWall, alienGuardianWallBox, alienGuardianHeadBoxes, alienGuardianBox, alienGuardianLimit, alienGuardianCameraLimit } from '/games/contra2026/js/stage-eight-guardian.mjs?v=guardian-flyers-1';
import { advanceLarvaHop } from '/games/contra2026/js/larva-hop.mjs?v=larva-hop-1';
import { advanceGuardianSpit, advanceGuardianFlyer, guardianFlyerBox } from '/games/contra2026/js/guardian-flyer.mjs?v=guardian-flyers-1';
import { createCeilingParasites, createFloorParasites, ceilingParasiteBox, whiteFloaterBox, advanceCeilingParasite, advanceWhiteFloater } from '/games/contra2026/js/ceiling-parasite.mjs?v=floor-parasites-1';
import { createCeilingStalkers, ceilingStalkerBox, advanceCeilingStalker } from '/games/contra2026/js/ceiling-stalker.mjs?v=ceiling-stalker-1';
import { createHiveBrainParts, hiveBroodRemaining, hiveBroodHealth, hiveDamageableParts, advanceHiveBrood, advanceHiveHatchling, hiveHatchlingBox, hiveShotBlocked } from '/games/contra2026/js/hive-brood.mjs?v=hive-four-ports-1';
import { hiveSpikeHeight } from '/games/contra2026/js/stage-eight-hazards.mjs?v=organic-motion-2';
import { StageOneArt, FORTRESS_ART, FORTRESS_TARGETS, FORTRESS_EXIT } from '/games/contra2026/js/stage-one-art.mjs?v=single-enemy-rifle-1';
import { createFortressRoofGuard, advanceFortressRoofGuard, roofGuardBox, fortressRoofY } from '/games/contra2026/js/fortress-roof-guard.mjs?v=roof-guard-1';
import { riverFishJumps, riverFishBox, riverFishLifeReward } from '/games/contra2026/js/river-fish.mjs?v=fish-life-1';
import {fortressCannonMuzzle,advanceFortressCannon} from '/games/contra2026/js/fortress-cannon.mjs?v=cannon-recoil-1';
import {advanceMotorcycle,motorcycleMuzzle,motorcycleDust} from '/games/contra2026/js/motorcycle-motion.mjs?v=moto-wheelie-2';
import { StageTwoArt } from '/games/contra2026/js/stage-two-art.mjs?v=single-enemy-rifle-1';
import { StageFourArt } from '/games/contra2026/js/stage-four-art.mjs?v=single-enemy-rifle-1';
import { StageFiveArt } from '/games/contra2026/js/stage-five-art.mjs?v=single-enemy-rifle-1';
import { StageSixArt } from '/games/contra2026/js/stage-six-art.mjs?v=foundry-exit-art-1';
import { StageSevenArt } from '/games/contra2026/js/stage-seven-art.mjs?v=single-enemy-rifle-1';
import { HANGAR_PLATE, createHangarPlates, hangarPlateBox, collideHangarPlates } from '/games/contra2026/js/stage-seven-obstacles.mjs?v=hangar-required-routes-1';
import { MINECART, isMinecartRider, syncMinecartRider, leaveMinecart, boardMinecart, minecartMuzzle, minecartRiderBox, minecartCanRise, collideMinecartClearance } from '/games/contra2026/js/minecart-rider.mjs?v=hangar-required-routes-1';
import { STAGE_SEVEN_ROUTE, hangarSectionAt, createStageSevenSolids, HANGAR_CART_TUNNEL, HANGAR_PRESSES, hangarPressState, hangarPressCrushBox, HANGAR_SNIPERS, HANGAR_BOXES, HANGAR_PODS, HANGAR_CART_DEPOTS, HANGAR_ENCOUNTERS } from '/games/contra2026/js/stage-seven-layout.mjs?v=hangar-required-routes-1';
import { STAGE_SIX_EXIT, canEnterStageSixExit, advanceStageSixExitEntry } from '/games/contra2026/js/stage-six-exit.mjs?v=stage-six-door-1';
import { createStageSixBoss, stageSixBossContactBox, stageSixBossStompBoxes, advanceStageSixBoss } from '/games/contra2026/js/stage-six-boss.mjs?v=robot-jump-frames-1';
import { STAGE_SIX_GALLERY, createStageSixGallerySolids, createStageSixGunners, stageSixGunnerBox, advanceStageSixGunner, stageSixRunnerSpawnSafe, navigateStageSixRunner, collideStageSixGalleryHelicopter } from '/games/contra2026/js/stage-six-combat.mjs?v=gallery-climb-return-1';
import { drawExplosion, drawSupplyDisc, drawEquipmentTurret, drawEquipmentSupply } from '/games/contra2026/js/combat-art.mjs?v=combat-polish-1';
import { STAGE_FIVE_ROUTE, createSnowDefenders, snowDefenderBox, advanceSnowDefender, advanceSnowOrdnance, createFlyingFortress, placeFlyingFortress, advanceFlyingFortress, advanceFortressEscorts, advanceFortressSaucer, fortressSaucerBox } from '/games/contra2026/js/stage-five-combat.mjs?v=fortress-saucers-1';
import { STAGE_FOUR_ROOMS, STAGE_FOUR_DEVICES, makeTwinProjections, advanceTwinProjections, initStageFourDefenses, advanceStageFourShutters, stageFourFacilityClosed, advanceStageFourGallery, stageFourGalleryTargets } from '/games/contra2026/js/stage-four-layout.mjs?v=stage-four-defense-1';
import { StageThreeArt } from '/games/contra2026/js/stage-three-art.mjs?v=single-enemy-rifle-1';
import { drawImpactHelmet } from '/games/contra2026/js/impact-helmet-art.mjs?v=helmet-detail-2';
import { GamepadInput } from '/games/contra2026/js/gamepad-input.mjs?v=controller-refinements-1';
import { THIRTY_LIVES, ThirtyLivesCheat, inTitleLogo } from '/games/contra2026/js/thirty-lives.mjs?v=lives-load-1';
import { STAGE_THREE, createStageThreeSolids, advanceStageThreePlatforms, flameJetBoxes, makeWaterfallBoss, waterfallNodesAlive, waterfallMouthOpen, waterfallTargetVulnerable, canEnterSummit, beginSummitEntry, advanceSummitEntry, teamInsideSummit, STAGE_THREE_SNIPERS, STAGE_THREE_TURRETS, STAGE_THREE_BOXES, STAGE_THREE_PODS } from '/games/contra2026/js/stage-three-layout.mjs?v=crossing-flames-1';
import { createStageThreeWallRocks, stageThreeRockSlots, advanceStageThreeRockSlots, selectStageThreeWallRock, WALL_ROCK_WARNING } from '/games/contra2026/js/stage-three-rockfall.mjs?v=wall-rock-cycle-1';
import { WATERFALL_ARMS, waterfallArmPose, updateWaterfallArms, waterfallArmBoxes } from '/games/contra2026/js/stage-three-arms.mjs?v=boss-detail-1';
import { baseUpMuzzle, BASE_EXIT_ROLL_DURATION } from '/games/contra2026/js/base-actor-poses.mjs?v=base-transition-1';
import { GIANT_POWER, startGiant, endGiant, updateGiant, hitGiant, giantCrushBox, giantPowerLabel, drawGiantStomp } from '/games/contra2026/js/giant-power.mjs?v=giant-smash-1';
import { BASE_SOLDIER, BASE_PATROL_DEPTH, BASE_PATROL_LIMIT, BASE_PATROL_MAX, advanceBasePatrol, baseSoldierScale, baseSoldierJumpOffset, baseSoldierMuzzle, advanceBaseSoldierJump } from '/games/contra2026/js/base-soldier.mjs?v=front-patrol-1';
import { BASE_HIGH_SWITCH, baseShotHeight, baseTargetAtHeight, baseCoreShielded, baseHomingTarget } from '/games/contra2026/js/base-shooting.mjs?v=base-prone-core-1';
import { BASE_BOSS_DEVICES, BASE_BOSS_MOVER, bossDevicesRemaining, movingBossX, advanceBossLift, advanceStageTwoBossDevice } from '/games/contra2026/js/base-boss.mjs?v=stage-two-boss-triple-2';
import { baseSupplyKind } from '/games/contra2026/js/base-supply.mjs?v=stage-four-1';
import { drawSupplySaucer } from '/games/contra2026/js/supply-saucer.mjs?v=pointed-drop-1';
import { OPENING_DURATION, OPENING_PAGES } from '/games/contra2026/js/opening-story.mjs?v=opening-story-1';
import { EndingArt } from '/games/contra2026/js/ending-art.mjs?v=single-enemy-rifle-1';
import { ENDING_DURATION, ENDING_PAGES } from '/games/contra2026/js/ending-story.mjs?v=ending-hd-1';
import { canEnterExit, beginExitEntry, advanceExitEntry, teamInsideExit } from '/games/contra2026/js/stage-one-exit.mjs?v=exit-right-1';
import { addImpact } from '/games/contra2026/js/impact-effects.mjs?v=hit-feedback-1';
import { beginDeath, advanceDeath } from '/games/contra2026/js/player-death.mjs?v=death-fall-1';
import { CONTRA_TRACKS, fixedStageMusicKeys, fixedMusicTrack } from '/games/contra2026/js/fixed-soundtrack.mjs?v=organic-motion-2';
import { versionedAssetUrl } from '/games/contra2026/js/asset-url.mjs?v=enemy-freeze-2';
import { REFERENCE_TRACKS, ReferenceMusic, StageMusicSession, musicForScene, stageMusicOptions, stageMusicPool, normalizeStageMusic } from '/games/contra2026/js/reference-music.mjs?v=lean-load-1';
import { musicRecord } from '/games/contra2026/js/music-records.mjs?v=stage-four-1';
import { ResourcePreloader, gameResourceJobs, musicResourceJobs } from '/games/contra2026/js/resource-preloader.mjs?v=enemy-freeze-2';
import { stageResourceJobs } from '/games/contra2026/js/stage-resources.mjs?v=ending-hd-1';
// Each document supplies only the systems used by its game.
export function startArcade(wukongDependencies) {
'use strict';
const {
  WUKONG_STAGES, WUKONG_RELEASE_MESSAGE, isWukongStageOpen,
  WukongSkin, WukongSiege, WukongSiegeArt,
  wukongMountText,
  advanceStaff, resolveStaff, staffGeometry, startUltimate, ULTIMATE, STAFF_PICKUPS,
  advanceGuard, guardHitsPlayer, GUARD_MELEE,
  navigateGuard,
  HEAVEN_HP, flyingGuard, advanceFlyingGuard,
  GIANT_HOME, giantBody, advanceGiant, giantHitsPlayer,
  giantEncounter, enterColossus, advanceColossus, enterGiantFinale, advanceGiantFinale, colossusDamage,
  scheduleSupplyFairy, advanceSupplyFairy, releaseFairyPeach,
  WUKONG_MAGIC, WUKONG_MAGIC_NAMES, WUKONG_MAGIC_SHORT, WUKONG_MAGIC_STAGE, WUKONG_MAGIC_DROPS, activateWukongMagic, advanceWukongMagic, resolveWukongMagic, clearWukongMagic,
  advanceHalberd, halberdHitsPlayer,
  TRANSFORM_FORMS, transformation, advanceTransformation, transformationSpeed, cycleTransformation,
  WUKONG_HEALTH, HEALING_ITEMS, HEALING_DROPS, newVitality, receiveHeroHit, advanceVitality, healHero, receiveGuardHit, advanceGuardRecoil, guardDefeat, advanceGuardDefeat, healingEnemyDrop, advanceImpactPause,
  cancelStaffCharge,
  WUKONG_RAGE, rageReady, ultimateSpec,
  WukongBattleAudio, queueEnemyCry,
  WukongHeroAudio, queueHeroSounds,
  queueHeroImpact,
  addMartialHit,
  WUKONG_OPENING_DURATION, WUKONG_OPENING_PAGES,
  WUKONG_MUSIC_TRACKS, WUKONG_STARTUP_MUSIC, WUKONG_MUSIC_OPTIONS, WUKONG_MUSIC_RECORD, WUKONG_SIEGE_MUSIC_OPTIONS, WUKONG_SIEGE_MUSIC_RECORD, normalizeWukongMusic, wukongMusicTrack,
} = wukongDependencies || {};
// ================= constants =================
const WUKONG = document.body.dataset?.game === 'wukong';
const GAME_ID = WUKONG ? 'wukong' : 'contra2026';
const isCelestial=()=>WUKONG&&(G.stage===1||G.stage===2);
const isSiege=()=>WUKONG&&G.stage===2;
const GAME_STAGES = WUKONG ? WUKONG_STAGES : OPEN_STAGES;
const RELEASE_MESSAGE = WUKONG ? WUKONG_RELEASE_MESSAGE : STAGE_RELEASE_MESSAGE;
const canPlayStage = stage => WUKONG ? isWukongStageOpen(stage) : isStageOpen(stage);
const lastPlayableStage = () => GAME_STAGES.at(-1);
const nextPlayableStage = stage => canPlayStage(stage + 1) ? stage + 1 : null;
const W = 384, H = 216, DT = 1 / 60;
const GRAV = 700, RUN = 90, JUMPV = 280, JUMPV2 = 250, MAXFALL = 360;
let LEVEL_W = 3334, CAM_MAX = LEVEL_W - W; const BX = 3196;
const WATER = { x0: 1180, x1: 1560, surf: 186 };
const $ = id => document.getElementById(id);
const musicTemplate=$('stageMusicTemplate');
if(WUKONG&&musicTemplate?.content)musicTemplate.replaceWith(musicTemplate.content.cloneNode(true));else musicTemplate?.remove?.();
document.body.classList.toggle('fixed-music',!WUKONG);
const rnd = Math.random;
let coop = null, primaryContext = null, soloSettings = null;
let remoteInput = {}, remoteWaiting = false;
let snapshotClock = 0, pingClock = 0;
const cooperative = () => !!coop?.playing;
const players = () => cooperative() && G.p2 ? primaryContext ? [primaryContext, G.p] : [G.p, G.p2] : [G.p];
const coverArt = new Image(); coverArt.fetchPriority = 'high'; coverArt.decoding = 'async'; if (!WUKONG) coverArt.src = versionedAssetUrl('/games/contra2026/assets/cover-zh.webp');
$('scrLoading').style.setProperty('--loading-cover',`url("${WUKONG?'/games/wukong/assets/heaven-panorama.webp':versionedAssetUrl('/games/contra2026/assets/cover-zh.webp')}")`);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cv = $('game'), ctx = cv.getContext('2d');
const stageOneArt = WUKONG ? new WukongSkin({ createCanvas: () => document.createElement('canvas'), imageFactory: () => new Image(), autoLoad:false }) : new StageOneArt({ createCanvas: () => document.createElement('canvas'), imageFactory: () => new Image(), autoLoad:false });
const stageTwoArt = new StageTwoArt({ createCanvas: () => document.createElement('canvas'), imageFactory: () => new Image(), baseArt:stageOneArt, priority:'low', autoLoad:false });
const stageFourArt = new StageFourArt({ createCanvas: () => document.createElement('canvas'), imageFactory: () => new Image(), baseArt:stageOneArt, priority:'low', autoLoad:false });
const stageThreeArt = new StageThreeArt({ createCanvas: () => document.createElement('canvas'), imageFactory: () => new Image(), baseArt:stageOneArt, priority:'low', autoLoad:false });
const stageFiveArt = new StageFiveArt({ createCanvas: () => document.createElement('canvas'), imageFactory: () => new Image(), baseArt:stageOneArt, priority:'low', autoLoad:false });
const stageSixArt = new StageSixArt({ createCanvas: () => document.createElement('canvas'), imageFactory: () => new Image(), baseArt:stageOneArt, priority:'low', autoLoad:false });
const stageSevenArt = new StageSevenArt({ createCanvas: () => document.createElement('canvas'), imageFactory: () => new Image(), baseArt:stageOneArt, priority:'low', autoLoad:false });
const hangarArt = new StageSevenArt({ createCanvas: () => document.createElement('canvas'), imageFactory: () => new Image(), baseArt:stageOneArt, priority:'low', autoLoad:false, hangar:true });
const endingArt = WUKONG ? null : new EndingArt({ createCanvas: () => document.createElement('canvas'), imageFactory: () => new Image(), baseArt:stageOneArt, priority:'low', autoLoad:false });
const wukong = WUKONG ? stageOneArt : null;
const siegeArt=WUKONG?new WukongSiegeArt({imageFactory:()=>new Image()}):null;
ctx.imageSmoothingEnabled = false;

function hash(n) { n = n | 0; n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n ^= n >>> 16; return (n >>> 0) / 4294967296; }

// ================= level =================
const RIVER_CROSSING_Y = 152;
const solids = [
  { x: 0, y: 112, w: 240, h: 104, g: 1 },
  { x: 240, y: 144, w: 380, h: 72, g: 1 },
  { x: 680, y: 176, w: 196, h: 40, g: 1 },
  { x: 876, y: RIVER_CROSSING_Y, w: 304, h: 216 - RIVER_CROSSING_Y, g: 1 },
  { x: 1340, y: RIVER_CROSSING_Y, w: 60, h: 216 - RIVER_CROSSING_Y, g: 1 },
  { x: 1180, y: 200, w: 380, h: 16, g: 1, water: 1 },
  { x: 1560, y: RIVER_CROSSING_Y, w: 180, h: 216 - RIVER_CROSSING_Y, g: 1 },
  { x: 1740, y: 144, w: 220, h: 72, g: 1 },
  { x: 2010, y: 176, w: 400, h: 40, g: 1 },
  { x: 2410, y: 152, w: 260, h: 64, g: 1 },
  { x: 2670, y: 176, w: 664, h: 40, g: 1 },
];
const LEDGES = [[520,128,80],[760,128,120],[960,88,96],[1080,128,72],[1400,120,96],
  [1640,128,96],[1780,96,80],[2100,128,96],[2240,96,96],[2400,128,96],[2560,112,80],[2760,128,96]];
for (const [x, y, w] of LEDGES) solids.push({ x, y, w, h: WUKONG?8:28, g: 0, solid:!WUKONG });
// exploding bridges over the river: sections blow up one by one once the player gets close
const SEG_W = 32;
const BRIDGES = [{ x0: 1180, n: 5 }, { x0: 1400, n: 5 }].map(b => {
  b.y = RIVER_CROSSING_Y; b.segs = [];
  for (let i = 0; i < b.n; i++) { const seg = { x: b.x0 + i * SEG_W, y: b.y, w: SEG_W, h: 12, g: 0, bridge: b, seg: i, gone: false }; b.segs.push(seg); solids.push(seg); }
  return b;
});
function resetBridges() { for (const b of BRIDGES) { b.armed = false; b.t = 0; b.next = 0; for (const sg of b.segs) sg.gone = false; } }
const SNIPERS = [[410,144],[1000,88],[1440,120],[1810,96],[2140,128],[2600,112]];
// [x, surface y]; the turret sits on an 8px base so its barrel is at chest height (y-16) and prone players can duck under its shots
const TURRETS = [[888,176],[1720,176],[2288,96],[2350,176],[2700,176]];
const PODS = [{ at: 160, kind: 'M', y0: 70 }, { at: 520, kind: 'g', y0: 64 }, { at: 980, kind: 'S', y0: 58 }, { at: 1420, kind: 'B', y0: 64 }, { at: 1700, kind: 'u', y0: 62 }, { at: 1880, kind: 'm', y0: 66 }, { at: 2040, kind: 'R', y0: 66 }, { at: 700, kind: 'c', y0: 62 }, { at: 2300, kind: 'f', y0: 60 }, { at: 2780, kind: 't', y0: 60 }, { at: 2560, kind: 'h', y0: 56 }, { at: 2680, kind: 'S', y0: 58 }];
// ---------- stage 3 · 峡谷瀑布: a vertical climb; the camera only scrolls up ----------
const SOLIDS1 = solids.slice();
const TOP_Y = STAGE_THREE.top;
// ---------- stage 5 · 极地冰原: a horizontal snowfield with slippery ice, crevasses and blizzards ----------
const LEVEL_W5 = STAGE_FIVE_ROUTE.length;
const SOLIDS5 = [
  ...[[0,520,0],[520,760,1],[820,1100,0],[1100,1420,1],[1490,1800,0],[1800,2000,1],[2060,2300,1],[2300,2620,0],[2680,3660,0],[3720,3980,0],[3980,4360,1],[4360,4480,0],[4480,5000,0]].map(([a, b, ic]) => ({ x: a, y: 176, w: b - a, h: 40, g: 1, ice: ic })),
  ...[[240,128,96],[420,100,80],[600,124,90],[860,120,96],[980,92,80,1],[1180,124,100],[1300,96,80],[1432,120,64],[1560,124,96],[1700,96,80,1],[1880,124,96],[2000,108,72],[2150,124,90],[2360,120,96],[2480,92,80],[2630,116,72],[2800,124,96],[2920,96,80],[3500,124,100],[3640,98,84],[3880,124,100],[4060,120,96],[4240,94,80],[4420,124,96]].map(([x, y, w, ic]) => ({ x, y, w, h: 8, g: 0, ice: ic || 0 })),
];
const SNIPERS5 = [[440,100],[1000,92],[1320,96],[1720,96],[2170,124],[2500,92],[2940,96],[3660,98],[4260,94]];
const TURRETS5 = [[900,176],[1600,176],[2240,176],[2380,120],[2760,176],[3900,176],[4400,176]];
const MORTARS5 = [1150, 1950, 2560, 2890];
const BOXES5 = [[380,'i'],[1650,'v'],[2440,'L'],[2720,'S'],[3480,'L'],[4330,'S']];
const PODS5 = [{ at: 120, kind: 'M', y0: 66 }, { at: 460, kind: 'i', y0: 60 }, { at: 900, kind: 'S', y0: 58 }, { at: 1250, kind: 'v', y0: 62 }, { at: 1600, kind: 'g', y0: 60 }, { at: 1900, kind: 'i', y0: 56 }, { at: 2000, kind: 'H', y0: 64 }, { at: 2200, kind: 'F', y0: 60 }, { at: 2450, kind: 'v', y0: 58 }, { at: 2700, kind: 'R', y0: 64 }, { at: 2860, kind: 'f', y0: 60 },{ at: 3420, kind: 'g', y0: 60 },{ at: 3980, kind: 'v', y0: 58 },{ at: 4450, kind: 'L', y0: 64 }];
// ---------- stage 6 · 高温能源厂: furnace halls with lava pits and timed flame jets ----------
const LEVEL_W6 = 3300;
const SOLIDS6 = [
  ...[[0,560],[620,1000],[1060,1400],[1460,1900],[1960,2400],[2460,3300]].map(([a, b]) => ({ x: a, y: 176, w: b - a, h: 40, g: 1 })),
  ...[[180,128,96],[380,100,80],[700,124,96],[880,96,80],[1010,120,64],[1150,124,96],[1300,96,80],[1520,124,96],[1680,96,96],[1840,120,72],[2040,124,96],[2200,96,80],[2410,136,64],[2780,96,80]].map(([x, y, w]) => ({ x, y, w, h: 8, g: 0 })),
  ...createStageSixGallerySolids(),
];
// flame jets: v = floor vent (fires straight up), dir = wall pipe at chest height (fires sideways, go prone);
// per = cycle length, off = phase; boss vents only run in the boss's second phase
const JETS6 = [
  { x: 300, v: 1, per: 3.2, off: 0 }, { x: 520, dir: -1, per: 3.4, off: 1.2 }, { x: 820, v: 1, per: 3.0, off: 0.6 }, { x: 1240, v: 1, per: 3.2, off: 1.6 },
  { x: 1600, v: 1, per: 2.8, off: 0.3 }, { x: 1720, dir: 1, per: 3.4, off: 2.0 }, { x: 2120, v: 1, per: 3.0, off: 1.0 }, { x: 2300, v: 1, per: 3.0, off: 2.5 },
  ...STAGE_SIX_GALLERY.outlets,
  { x: 2840, v: 1, per: 3.2, off: 0.4 },
  { x: 3010, v: 1, per: 2.6, off: 0, boss: 1 }, { x: 3095, v: 1, per: 2.6, off: 1.3, boss: 1 },
];
const SNIPERS6 = [[400,100],[900,96],[2220,96],[2800,96]];
const TURRETS6 = [[760,176],[1500,176],[2260,176],[2600,176]];
const BOXES6 = [[340,'x'],[1180,'w'],[1860,'L'],[2700,'S']];
const PODS6 = [{ at: 120, kind: 'M', y0: 66 }, { at: 500, kind: 'x', y0: 60 }, { at: 900, kind: 'S', y0: 58 }, { at: 1250, kind: 'w', y0: 62 }, { at: 1550, kind: 'g', y0: 60 }, { at: 1850, kind: 'x', y0: 56 }, { at: 2000, kind: 'H', y0: 64 }, { at: 2200, kind: 'F', y0: 60 }, { at: 2450, kind: 'w', y0: 58 }, { at: 2650, kind: 'R', y0: 64 }, { at: 2850, kind: 'B', y0: 60 }];
// ---------- stage 7 · 机械机库: conveyors, hydraulic presses, moving lifts over shafts, cargo carts ----------
const LEVEL_W7 = STAGE_SEVEN_ROUTE.width;
const SOLIDS7 = createStageSevenSolids();
const PRESSES7 = HANGAR_PRESSES;
const SNIPERS7 = HANGAR_SNIPERS;
const TURRETS7 = [[520,176],[1350,176],[2400,176],[2820,176]];
const BOXES7 = HANGAR_BOXES;
const PODS7 = HANGAR_PODS;
// ---------- stage 8 · 异形巢穴: the final hive, with acid pools, acid drips, egg sacs and the hive heart ----------
const LEVEL_W8 = 3500;
const SOLIDS8 = [
  ...[[0,640],[700,1100],[1160,1500],[1580,2000],[2060,2500],[2580,3500]].map(([a, b]) => ({ x: a, y: 176, w: b - a, h: 40, g: 1 })),
  ...[[200,128,96],[420,100,80],[720,124,96],[900,96,80],[1098,118,64],[1220,124,96],[1380,96,80],[1508,116,64],[1640,124,96],[1800,96,80],[2100,124,96],[2260,96,80],[2400,124,72],[2508,110,64],[2680,124,96],[2840,96,80],[3000,124,80]].map(([x, y, w]) => ({ x, y, w, h: 8, g: 0 })),
];
const SNIPERS8 = [[440,100],[920,96],[1400,96],[1820,96],[2280,96],[2860,96]];
const TURRETS8 = [[800,176],[1300,176],[1950,176],[2700,176]];
const SACS8 = [560, 1240, 1700, 2200, 2900];
const BOXES8 = [[340,'p'],[1050,'z'],[1880,'L'],[2620,'S']];
const ACID8 = [{ x: 380, per: 3.2, off: 0 }, { x: 980, per: 2.8, off: 1 }, { x: 1330, per: 3.0, off: 0.5 }, { x: 1760, per: 2.6, off: 1.6 }, { x: 2150, per: 3.0, off: 0.2 }, { x: 2380, per: 2.8, off: 2.0 }, { x: 2760, per: 3.0, off: 1.1 }, { x: 3190, per: 2.2, off: 0, boss: 1 }, { x: 3270, per: 2.2, off: 1.1, boss: 1 }];
const PODS8 = [{ at: 120, kind: 'M', y0: 66 }, { at: 500, kind: 'p', y0: 60 }, { at: 900, kind: 'S', y0: 58 }, { at: 1250, kind: 'z', y0: 62 }, { at: 1550, kind: 'g', y0: 60 }, { at: 1850, kind: 'p', y0: 56 }, { at: 2000, kind: 'H', y0: 64 }, { at: 2200, kind: 'F', y0: 60 }, { at: 2450, kind: 'z', y0: 58 }, { at: 2700, kind: 'R', y0: 64 }, { at: 2950, kind: 'B', y0: 60 }];
// ---------- 水下八关 · 第一关 珊瑚浅海 (stage 9): swimming, oxygen, mines, jellyfish, frogmen, and a mechanical shark ----------
const LEVEL_W9 = 3200, SEA_SURF = 26, SEA_FLOOR = 196;
const SOLIDS9 = [
  { x: 0, y: SEA_FLOOR, w: LEVEL_W9, h: 20, g: 1 },
  ...[[420,150,60,46],[760,120,50,76],[1100,160,90,36],[1350,96,40,100],[1700,140,70,56],[2300,110,60,86],[2620,150,80,46]].map(([x, y, w, h]) => ({ x, y, w, h, g: 1, rock: 1 })),
];
const VENTS9 = [600, 1250, 1900, 2500, 2990];
const MINES9 = [[520,110],[880,90],[980,150],[1460,110],[1600,70],[1820,120],[2150,90],[2420,150],[2760,100]];
const JELLY9 = [[700,80],[1180,110],[1550,140],[2050,70],[2480,100],[2700,60]];
const SUBS9 = [[1000,60],[1780,80],[2560,60]];
const BOXES9 = [[340,'b'],[1220,'l'],[1980,'S'],[2740,'M']];
const PODS9 = [{ at: 120, kind: 'M', y0: 70 }, { at: 460, kind: 'b', y0: 90 }, { at: 880, kind: 'S', y0: 80 }, { at: 1260, kind: 'l', y0: 90 }, { at: 1600, kind: 'g', y0: 80 }, { at: 1900, kind: 'b', y0: 70 }, { at: 2100, kind: 'H', y0: 90 }, { at: 2300, kind: 'F', y0: 80 }, { at: 2500, kind: 'l', y0: 70 }, { at: 2700, kind: 'R', y0: 90 }];
// ---------- 水下第二关 沉船墓场 (stage 10): a VERTICAL dive down through a wreck standing on its bow.
// The ship collapses from above once you are inside; each sealed hatch opens when you shoot its valve. ----------
const LEVEL_W10 = 384, V_FLOOR = 1600, V_ARENA_CAM = 1398;
const HATCH = (x, y, w) => ({ x, y, w, h: 12, g: 1, hull: 1, hatch: 1 });
const H2 = HATCH(80, 360, 50), H4 = HATCH(260, 720, 50), H6 = HATCH(150, 1080, 50);
const SOLIDS10 = [
  { x: 0, y: -400, w: 20, h: 2020, g: 1, hull: 1, wall: 1 }, { x: 364, y: -400, w: 20, h: 2020, g: 1, hull: 1, wall: 1 },
  { x: 20, y: V_FLOOR, w: 344, h: 20, g: 1, hull: 1 },
  ...[[20,280,180],[330,364,180],[20,80,360],[130,364,360],[20,200,540],[250,364,540],[20,260,720],[310,364,720],[20,60,900],[110,364,900],[20,150,1080],[200,364,1080],[20,290,1260],[340,364,1260],[20,120,1440],[264,364,1440]]
    .map(([a, b, y]) => ({ x: a, y, w: b - a, h: 12, g: 1, hull: 1 })),
  { x: 180, y: 732, w: 12, h: 100, g: 1, hull: 1 }, { x: 250, y: 1092, w: 12, h: 90, g: 1, hull: 1 },
  H2, H4, H6,
];
const VALVES10 = [[170, 349, H2], [220, 709, H4], [240, 1069, H6]];
const POCKETS10 = [{ x: 30, y: 192, w: 60, h: 26 }, { x: 290, y: 372, w: 60, h: 26 }, { x: 30, y: 552, w: 60, h: 26 }, { x: 30, y: 732, w: 60, h: 26 }, { x: 290, y: 912, w: 60, h: 26 }, { x: 30, y: 1092, w: 60, h: 26 }, { x: 120, y: 1272, w: 60, h: 26 }];
const EELS10 = [[20,290,1,46],[364,460,-1,46],[20,640,1,46],[364,820,-1,46],[20,1000,1,46],[364,1180,-1,46],[20,1350,1,46]];
const BEAMS10 = [[150,196],[300,556],[100,736],[250,916],[80,1096],[200,1276]];
const MINES10 = [[200,270],[120,460],[300,640],[280,820],[150,1000],[300,1180],[100,1350]];
const JELLY10 = [[250,300],[150,620],[280,980],[120,1320]];
const BOXES10 = [[60,'q',360],[330,'s',720],[300,'S',1080],[320,'L',1440]];
const PODS10 = [{ downY: 60, kind: 'M', y0: 120 }, { downY: 380, kind: 'q', y0: 100 }, { downY: 680, kind: 'S', y0: 110 }, { downY: 980, kind: 's', y0: 100 }, { downY: 1240, kind: 'F', y0: 120 }];
// ---------- 水下第三关 海底火山 (stage 11): pilot a mini sub through an auto-scrolling volcanic trench; watch the engine heat ----------
const LEVEL_W11 = 3400, SUB_SCROLL = 36;
const SOLIDS11 = [
  { x: 0, y: SEA_FLOOR, w: LEVEL_W11, h: 20, g: 1 }, { x: 0, y: -30, w: LEVEL_W11, h: 40, g: 1, rock: 1, ceil: 1 },
  ...[[300,170,80],[520,150,60],[700,165,100],[950,130,70],[1150,160,90],[1400,140,60],[1600,120,80],[1850,150,100],[2100,135,70],[2350,160,90],[2600,140,80],[2800,165,60]].map(([x, y, w]) => ({ x, y, w, h: SEA_FLOOR - y, g: 1, rock: 1 })),
  ...[[420,50,70],[640,70,60],[860,40,80],[1050,80,60],[1280,60,90],[1500,85,70],[1720,50,60],[1960,75,80],[2200,55,70],[2450,80,60],[2700,50,90]].map(([x, y, w]) => ({ x, y: 10, w, h: y - 10, g: 1, rock: 1, ceil: 1 })),
];
const VENTS11 = [610, 1250, 1700, 2000, 2480, 2900];
const HOT11 = [[820,36],[1330,36],[1780,36],[2270,36],[2740,36]];
const COLD11 = [[460,30],[1100,30],[1560,30],[2050,30],[2550,30],[3060,30]];
const TUR11 = [[340,170,0],[980,130,0],[1325,60,1],[1640,120,0],[2000,75,1],[2395,160,0],[2745,50,1]];
const STAL11 = [[455,54],[900,44],[1300,64],[1750,54],[2235,59],[2745,54]];
const FISH11 = [200, 500, 900, 1300, 1700, 2100, 2500, 2800];
const SUBS11 = [[1180,100],[2200,110]];
const PODS11 = [{ at: 60, kind: 'M', y0: 100 }, { at: 360, kind: 'r', y0: 100 }, { at: 760, kind: 'S', y0: 110 }, { at: 1160, kind: 'A', y0: 100 }, { at: 1480, kind: 'g', y0: 110 }, { at: 1820, kind: 'r', y0: 100 }, { at: 2100, kind: 'H', y0: 100 }, { at: 2400, kind: 'A', y0: 110 }, { at: 2650, kind: 'r', y0: 100 }];
function floorBelow(x, y) { let best = 1e9; for (const s2 of solids) if (!s2.gone && !s2.wall && x >= s2.x && x <= s2.x + s2.w && s2.y > y && s2.y < best) best = s2.y; return best === 1e9 ? SEA_FLOOR : best; }
function setLevel(n) {
  solids.length = 0; for (const s2 of (n === 3 ? createStageThreeSolids() : n === 5 ? SOLIDS5 : n === 6 ? SOLIDS6.map(s=>({...s})) : n === 7 ? SOLIDS7.map(s=>({...s})) : n === 8 ? SOLIDS8.map(s=>({...s})) : n === 9 ? SOLIDS9 : n === 10 ? SOLIDS10 : n === 11 ? SOLIDS11 : SOLIDS1)) solids.push(s2);
  LEVEL_W = n === 5 ? LEVEL_W5 : n === 6 ? LEVEL_W6 : n === 7 ? LEVEL_W7 : n === 8 ? LEVEL_W8 : n === 9 ? LEVEL_W9 : n === 10 ? LEVEL_W10 : n === 11 ? LEVEL_W11 : 3334; CAM_MAX = LEVEL_W - W;
}
function xMax(m) { // right edge the player can reach in the side-scrolling stages
  // The celestial arena has no fortress wall; the exit stays locked by updateBoss.
  if (isCelestial()) return LEVEL_W - m;
  if (G.stage === 1) return G.boss.dead?FORTRESS_EXIT.x+FORTRESS_EXIT.w/2+5:FORTRESS_ART.wallX-m;
  if (G.stage === 5) { const T = G.tank; return T && !T.dead ? Math.min(LEVEL_W - m, T.x - 7 - (m - 10)) : LEVEL_W - m; }
  if (G.uw) return LEVEL_W - m;
  if (G.stage === 7) return G.gate&&!G.gate.dead?G.gate.x-m:LEVEL_W-m;
  if (G.stage === 8) { const Hv = G.hive,limit=Hv && !Hv.dead ? Math.min(LEVEL_W - m, Hv.x - 20 - (m - 10)) : LEVEL_W - m;return WUKONG?limit:alienGuardianLimit(G.en,limit,m,pBox(G.p)); }
  if (G.stage === 6) return LEVEL_W - m;
  return BX - m;
}
// ground sensor boxes: open and close on a cycle, can only be damaged while open, drop the listed item
const BOXES = [[560, 'F'], [1660, 'H'], [2470, 'L'], [2880, 'g']];
// special items: kept in a 3-slot inventory and used with the special-item key; each use starts a short cooldown
const SPECIALS = { g: '手雷', f: '闪光弹', m: '摩托车', h: '直升机', u: '蘑菇', c: '迷彩披风', t: '炸药包', e: '电磁脉冲', d: '防爆盾', k: '攀岩钩爪', j: '防落石头盔', o: '全息诱饵', n: '磁暴扫雷器', i: '防滑冰爪', v: '热成像镜', x: '防火服', w: '液氮罐', y: '磁力靴', a: '护卫无人机', p: '声波脉冲器', z: '抗酸护甲', b: '压缩氧气瓶', l: '鱼雷组', q: '便携气囊', s: '声呐浮标', r: '冷却剂', A: '增压推进器', C: '涡流推进器', D: '时缓水泡', E: '照明弹', P: '荧光服', K: '绝缘服', T: '遥控阀门', G: '破冰炸药', W: '暖流护罩', N: '钻机护盾', Q: '自动哨炮' };
// stage-only items (purple badges): they only drop in their own stage and are dropped from the inventory when the stage changes
const STAGE_ONLY = { c: 1, t: 1, e: 2, d: 2, k: 3, j: 3, o: 4, n: 4, i: 5, v: 5, x: 6, w: 6, y: 7, a: 7, p: 8, z: 8, b: 9, l: 9, q: 10, s: 10, r: 11, A: 11, C: 12, D: 12, E: 13, P: 13, K: 14, T: 14, G: 15, W: 15, N: 16, Q: 16 };
const stageItemAllowed=(kind,stage)=>!STAGE_ONLY[kind]||STAGE_ONLY[kind]===stage;
const SP_SHORT = { g: '手雷', f: '闪光', m: '摩托', h: '飞机', u: '蘑菇', c: '迷彩', t: '炸药', e: '电磁', d: '盾牌', k: '钩爪', j: '头盔', o: '诱饵', n: '扫雷', i: '冰爪', v: '热像', x: '防火', w: '液氮', y: '磁靴', a: '无人机', p: '声波', z: '抗酸', b: '氧气', l: '鱼雷', q: '气囊', s: '声呐', r: '冷却', A: '推进', C: '涡流', D: '时缓', E: '照明', P: '荧光', K: '绝缘', T: '阀门', G: '炸药', W: '暖流', N: '护盾', Q: '哨炮' };
const SP_CD = 2, INV_MAX = 3;

if(WUKONG){Object.assign(SPECIALS,WUKONG_MAGIC_NAMES);Object.assign(SP_SHORT,WUKONG_MAGIC_SHORT);Object.assign(STAGE_ONLY,WUKONG_MAGIC_STAGE);}

const WEAP = {
  rifle:   { name: '步枪', cd: 0.24, max: 4, per: 1, spd: 270 },
  machine: { name: '连发机枪', cd: 0.09, max: 7, per: 1, spd: 290 },
  spread:  { name: '扇形散弹', cd: 0.30, max: 15, per: 5, spd: 260 },
  laser:   { name: '贯穿光束', cd: 0.28, max: 1, per: 1, spd: 380 },
  fire:    { name: '螺旋火焰', cd: 0.28, max: 4, per: 1, spd: 170 },
  homing:  { name: '跟踪导弹', cd: 0.32, max: 4, per: 1, spd: 150 },
};
const ITEM_NAMES = { M: '连发机枪', S: '扇形散弹', L: '贯穿光束', F: '螺旋火焰', H: '跟踪导弹', R: '速射芯片', B: '护盾 10 秒', ...SPECIALS };

function findLand(x, b0, b1, hw, skipLedge) {
  let best = null;
  for (const s of solids) {
    if (s.gone || (skipLedge && !s.g && !s.solid)) continue;
    if (x + hw <= s.x || x - hw >= s.x + s.w) continue;
    if (b0 <= s.y + 0.001 && b1 >= s.y && (!best || s.y < best.y)) best = s;
  }
  return best;
}
function wallCollide(e, x0, hw) {
  if(!WUKONG&&G.stage===7)collideHangarPlates(e,x0,hw,G.en,e.t?{x:e.x-hw,y:e.y-22,w:hw*2,h:22}:pBox(e)||{x:e.x-hw,y:e.y-28,w:hw*2,h:28});
  for (const s of solids) {
    if (s.gone || (!s.g&&!s.solid) || e.y <= s.y + 0.5) continue;
    const head=e.t?e.y-22:pBox(e)?.y??e.y-28;
    if(!s.g&&head>=s.y+s.h-.001)continue;
    if (e.x + hw > s.x && e.x - hw < s.x + s.w) {
      if (x0 + hw <= s.x + 0.5) e.x = s.x - hw;
      else if (x0 - hw >= s.x + s.w - 0.5) e.x = s.x + s.w + hw;
    }
  }
}
function groundAt(x) { return solids.find(s => s.g && x >= s.x + 6 && x <= s.x + s.w - 6) || null; }
function supplySurfaceAt(x) {
  let surface = null;
  for (const s of solids) {
    if (s.gone || s.water || s.bridge || (!s.g && !s.solid)) continue;
    if (x - 10 < s.x || x + 10 > s.x + s.w) continue;
    if (!surface || s.y < surface.y) surface = s;
  }
  return surface;
}
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// ================= settings =================
const LOCAL_LIFE_TEST = !WUKONG && ['localhost','127.0.0.1','[::1]','::1'].includes(location.hostname);
const SET = { music: 'on', sfx: 'on', musicVolume:WUKONG?30:100, sfxVolume:100, inf: WUKONG||LOCAL_LIFE_TEST?'on':'off', diff: 'normal', autofire: 'on', shake: 'on', scan: 'off', pad: 'm', v: WUKONG?2:3 };
try {
  const saved = JSON.parse(localStorage.getItem(WUKONG ? 'wukong-settings' : 'chiyan-settings') || '{}');
  if(saved.v!==2&&saved.v!==3)delete saved.scan;
  // Older releases silently defaulted to infinite lives. Migrate public sites
  // to finite lives; local development keeps the convenient test default.
  if(!WUKONG&&saved.v!==3)saved.inf=LOCAL_LIFE_TEST?'on':'off';
  saved.v=SET.v;Object.assign(SET,saved);
} catch (e) {}
Object.assign(SET,normalizeAudioMix(SET,{musicVolume:WUKONG?30:100,sfxVolume:100}));
if(WUKONG)SET.stageMusic=normalizeWukongMusic(SET.stageMusic);else delete SET.stageMusic;
const stageMusicSession = new StageMusicSession();
const gameMusicOptions=stage=>WUKONG?(stage===2?WUKONG_SIEGE_MUSIC_OPTIONS:WUKONG_MUSIC_OPTIONS):stageMusicOptions(stage);
const gameMusicRecord=(stage,choice)=>WUKONG?(stage===2?WUKONG_SIEGE_MUSIC_RECORD:WUKONG_MUSIC_RECORD):musicRecord(stage,choice);
function sceneMusicTrack(state){
  if(!WUKONG)return fixedMusicTrack(state);
  const selected=stageMusicSession.forScene(state,SET.stageMusic);
  return WUKONG?wukongMusicTrack(state,SET.stageMusic,selected):selected;
}
const lifeCheat=new ThirtyLivesCheat();
function infiniteLives(){return SET.inf==='on'&&!G.thirtyLives;}
function gameplaySettings(){return G.thirtyLives?{...SET,inf:'off'}:SET;}
let HI = 20000;
try { HI = Math.max(HI, +localStorage.getItem(WUKONG ? 'wukong-hi' : 'chiyan-hi') || 0); } catch (e) {}
function saveSettings() { try { localStorage.setItem(WUKONG ? 'wukong-settings' : 'chiyan-settings', JSON.stringify(SET)); } catch (e) {} }

// ================= audio =================
let AC = null, master, sfxGain, musGain, synthGain, noiseBuf, muted = false;
const musicTracks=WUKONG?WUKONG_MUSIC_TRACKS:CONTRA_TRACKS;
const referenceMusic = new ReferenceMusic({ getContext: () => AC, getOutput: () => musGain, tracks:musicTracks });
const wukongBattleAudio=WUKONG?new WukongBattleAudio({getContext:()=>AC,getOutput:()=>sfxGain,enabled:()=>SET.sfx==='on'&&!muted}):null;
const wukongHeroAudio=WUKONG?new WukongHeroAudio({getContext:()=>AC,getOutput:()=>sfxGain,enabled:()=>SET.sfx==='on'&&SET.sfxVolume>0&&!muted}):null;
const weaponAudio=WUKONG?null:new ContraWeaponAudio({getContext:()=>AC,getOutput:()=>sfxGain,enabled:()=>SET.sfx==='on'&&SET.sfxVolume>0&&!muted});
const gameResourceOptions = {
  arts: WUKONG ? [stageOneArt] : [stageOneArt, stageTwoArt, stageThreeArt, stageFourArt, stageFiveArt, stageSixArt, hangarArt, stageSevenArt, endingArt], imageFactory: () => new Image(),
  cover: WUKONG?null:'/games/contra2026/assets/cover-zh.webp',
  records: [],
  tracks: {}, music: referenceMusic, fonts: document.fonts?.ready
};
const resourceCache = new Set();
const gameVisualResources = stage => WUKONG ? gameResourceJobs({...gameResourceOptions,arts:stage===2?[stageOneArt,siegeArt]:[stageOneArt],records:gameMusicOptions(stage).map(({value})=>gameMusicRecord(stage,value).art)}) : stageResourceJobs(stage,gameResourceOptions);
const startupMusicKeys = stage => WUKONG ? (stage===1?WUKONG_STARTUP_MUSIC:[startupMusicTrack(stage)]) : SET.music==='on'?fixedStageMusicKeys(stage):[];
const stageJobs = stage => [...gameVisualResources(stage),...musicResourceJobs(referenceMusic,startupMusicKeys(stage)),...(WUKONG?[wukongBattleAudio.resourceJob(),wukongHeroAudio.resourceJob()]:[])];
const stageResourcesReady = stage => stageJobs(stage).every(job=>resourceCache.has(job.id));
let gameResources = new ResourcePreloader([]), backgroundMusic = null, remoteWorld = null;
function flushRemoteWorld() {
  const world=remoteWorld;remoteWorld=null;
  if(world&&coop.role==='guest'&&cooperative())coop.callbacks.state(world);
}
const startupMusicTrack = stage => WUKONG?(stage === 1 ? 'stage1' : stage === 3 ? 'stage3' : stage === 4 ? 'stage4' : 'stage2'):fixedStageMusicKeys(stage)[0];
function startBackgroundMusic() {
  if(!WUKONG)return;
  if (backgroundMusic || !gameResources.ready) return;
  const scene={mode:'play',stage:G.stage,boss:{},base:{def:{}}};
  const baseTrack=musicForScene(scene,SET.stageMusic),preferred=WUKONG?wukongMusicTrack(scene,SET.stageMusic,baseTrack):baseTrack;
  const keys = [preferred,...Object.keys(musicTracks).filter(key=>!WUKONG||key===startupMusicTrack(G.stage))].filter(key => musicTracks[key]&&(!WUKONG||!['opening','stage1orchestral','stage1rock','stage1epic','stage1industrial','stage1cyberpunk'].includes(key)));
  backgroundMusic = new ResourcePreloader(musicResourceJobs(referenceMusic,keys),{concurrency:1});
  void backgroundMusic.load(() => Music.sync()).catch(() => {});
}
let loadingSerial = 0, pendingStart = null;
try { muted = localStorage.getItem(WUKONG ? 'wukong-muted' : 'chiyan-muted') === '1'; } catch (e) {}
function initAudio() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = muted ? 0 : 0.6; master.connect(AC.destination);
      sfxGain = AC.createGain(); sfxGain.connect(master);
      musGain = AC.createGain(); musGain.connect(master);
      synthGain = AC.createGain(); synthGain.gain.value = 0; synthGain.connect(musGain);
      applyAudio();
      noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
    }
    if (AC.state !== 'running') AC.resume();
  } catch (e) { AC = null; }
}
const mfreq = m => 440 * Math.pow(2, (m - 69) / 12);
function tone(f, dur, type, vol, slide, t, out) {
  if (!AC) return;
  t = t || AC.currentTime;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out || sfxGain); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, freq, t, out, hp) {
  if (!AC) return;
  t = t || AC.currentTime;
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(out || sfxGain); s.start(t, rnd() * 0.5); s.stop(t + dur + 0.02);
}
const sfx = {
  shoot() { tone(1100, 0.05, 'square', 0.05, 500); },
  spread() { tone(700, 0.07, 'sawtooth', 0.05, 250); noise(0.05, 0.06, 3000); },
  eshot() { tone(520, 0.06, 'triangle', 0.06, 300); },
  hit() { tone(260, 0.04, 'square', 0.06, 140); },
  staffHit(heavy=false,metal=false) {
    noise(heavy?.095:.055,heavy?.15:.10,metal?1800:900);
    tone(heavy?145:205,heavy?.13:.075,'triangle',heavy?.11:.075,heavy?46:75);
    tone(metal?1100:620,.022,'square',.018,180);
  },
  hurt() { noise(.11,.12,570);tone(165,.14,'sawtooth',.07,65); },
  charge(phase) {
    if(phase==='start')tone(180,.15,'sine',.025,330);
    else if(phase==='ready'){tone(590,.12,'sine',.045,790);tone(295,.12,'triangle',.025,395);}
    else{tone(880,.17,'sine',.055,1200);tone(440,.17,'triangle',.035,600);}
  },
  staffQi(strength) {noise(strength===2?.24:.16,strength===2?.15:.09,1700);tone(strength===2?210:310,.19,'triangle',.10,65);tone(740,.12,'sine',.035,280);},
  heal() { [523,659,784].forEach((f,i)=>tone(f,.18,'sine',.07,0,AC&&AC.currentTime+i*.075)); },
  boom() { noise(0.35, 0.35, 900); tone(120, 0.3, 'triangle', 0.25, 40); },
  big() { noise(0.9, 0.5, 600); tone(90, 0.8, 'triangle', 0.35, 30); },
  jump() { tone(300, 0.08, 'square', 0.03, 520); },
  jump2() { tone(440, 0.1, 'square', 0.035, 880); },
  laser() { tone(1800, 0.09, 'sawtooth', 0.04, 700); },
  fire() { noise(0.12, 0.08, 1400); tone(240, 0.1, 'triangle', 0.05, 120); },
  msl() { noise(0.18, 0.06, 2600, 0, 0, true); tone(320, 0.12, 'square', 0.03, 640); },
  toss() { tone(220, 0.1, 'triangle', 0.08, 520); },
  flash() { noise(0.5, 0.3, 5000, 0, 0, true); tone(1400, 0.5, 'sine', 0.08, 300); },
  mount() { [60, 64, 67, 72].forEach((m, i) => tone(mfreq(m), 0.07, 'square', 0.06, 0, AC && AC.currentTime + i * 0.05)); },
  grow() { tone(200, 0.5, 'square', 0.06, 800); },
  wreck() { noise(0.6, 0.45, 700); tone(160, 0.5, 'sawtooth', 0.1, 40); },
  pick() { [72, 76, 79, 84].forEach((m, i) => tone(mfreq(m), 0.08, 'square', 0.07, 0, AC && AC.currentTime + i * 0.06)); },
  die() { tone(660, 0.6, 'square', 0.08, 70); noise(0.4, 0.2, 700); },
  splash() { noise(0.25, 0.15, 1800); },
};
function playerGunshot(p){
  p.shotSeq=(p.shotSeq||0)+1;
  if(weaponAudio)weaponAudio.play(p.weapon);
  else ({spread:sfx.spread,laser:sfx.laser,fire:sfx.fire,homing:sfx.msl}[p.weapon]||sfx.shoot)();
}
// original chiptune loop, A minor, 4 bars of 16 steps
const LEAD = [
  [69,0,72,0,76,0,74,72,0,69,0,72,74,0,0,0],
  [72,0,74,0,77,0,76,74,0,72,0,69,72,0,0,0],
  [71,0,74,0,79,0,77,76,0,74,0,71,74,0,76,0],
  [76,0,0,0,75,0,76,0,79,0,76,0,71,0,0,0],
];
const ROOTS = [45, 41, 43, 40];
const BASS = { 0: 0, 2: 12, 3: 0, 6: 0, 8: 0, 10: 12, 11: 0, 14: 7 };
const STAGE_MUSIC_SHIFT = { 1: 0, 2: -3, 3: 2, 4: -1, 5: -2, 6: 1, 7: 3, 8: 5, 9: -4, 10: -6, 11: 6, 12: -2, 13: -7, 14: 3, 15: -3, 16: 1 };
const Music = {
  on: false, active: false, step: 0, next: 0, bpm: 150, boss: false, timer: null,
  start(boss, shift, bpm) {
    this.active = true;
    this.shift = shift || 0;
    this.boss = !!boss; this.bpm = bpm || (boss ? 176 : 150); this.step = 0; this.next = (AC?.currentTime || 0) + 0.05;
    this.sync();
  },
  stop() { this.on = false; this.active = false; if (synthGain) synthGain.gain.value = 0; referenceMusic.stop(); },
  pause() { this.on = false; if (synthGain) synthGain.gain.value = 0; referenceMusic.pause(); },
  sync() {
    if (G.mode === 'loading') { this.pause(); return; }
    if (document.hidden || G.mode === 'pause' || (G.mode === 'settings' && G.settingsFrom === 'pause')) { this.pause(); return; }
    const selected = sceneMusicTrack(G);
    if(!WUKONG){
      if(selected==='synth'&&SET.music==='on'&&this.active&&AC&&gameResources.ready){
        referenceMusic.stop();this.on=true;synthGain.gain.value=1;
        if(!this.timer)this.timer=setInterval(()=>this.tick(),25);return;
      }
      this.on=false;if(synthGain)synthGain.gain.value=0;
      if(!gameResources.ready){this.pause();return;}
      if(SET.music==='on'&&selected&&(this.active||G.mode!=='play')){if(AC)referenceMusic.play(selected);return;}
      referenceMusic.stop();return;
    }
    if (G.mode === 'title' || G.mode === 'settings' && G.settingsFrom === 'title') {
      this.on=false;if(synthGain)synthGain.gain.value=0;
      if(AC&&SET.music==='on')referenceMusic.play(selected);else referenceMusic.stop();
      return;
    }
    if (!gameResources.ready || (!backgroundMusic && !['cine','intro','play'].includes(G.mode))) { this.pause(); return; }
    const cached = gameResources.done.has('music:'+selected) || backgroundMusic?.done.has('music:'+selected);
    const fallback = startupMusicTrack(G.stage);
    const track = musicTracks[selected] && !cached ? (gameResources.done.has('music:'+fallback) ? fallback : null) : selected;
    this.on = false;
    if (synthGain) synthGain.gain.value = 0;
    if (track && track !== 'synth' && (this.active || G.mode !== 'play')) { if (AC) referenceMusic.play(track,WUKONG&&G.mode==='cine'&&G.cine?.kind==='open'?{offset:0}:undefined); return; }
    referenceMusic.stop();
    if (track === 'synth' && this.active && AC) {
      this.on = true;
      synthGain.gain.value = 1;
      if (!this.timer) this.timer = setInterval(() => this.tick(), 25);
    }
  },
  tick() {
    if (!this.on || !AC || AC.state !== 'running') return;
    const sp = 60 / this.bpm / 4;
    if (this.next < AC.currentTime - 0.2) this.next = AC.currentTime + 0.02;
    while (this.next < AC.currentTime + 0.12) { this.play(this.step, this.next); this.next += sp; this.step = (this.step + 1) % 64; }
  },
  play(step, t) {
    const bar = step >> 4, s = step & 15;
    const shift = (this.boss ? 1 : 0) + (this.shift || 0);
    if (s in BASS) tone(mfreq(ROOTS[bar] + BASS[s] + shift), 0.11, 'triangle', 0.2, 0, t, synthGain);
    const m = LEAD[bar][s];
    if (m) tone(mfreq(m + shift + (this.boss && bar === 3 ? 0 : 0)), 0.09, 'square', 0.045, 0, t, synthGain);
    if (s % 2 === 1) noise(0.025, 0.035, 6000, t, synthGain, true);
    if (this.boss && s % 4 === 0) tone(110, 0.08, 'sine', 0.25, 45, t, synthGain);
  },
};
function applyAudio() {
  const levels=audioMixLevels(SET);
  if(levels.sfx===0){wukongBattleAudio?.stopAll();wukongHeroAudio?.stopAll();weaponAudio?.stopAll();}
  if (sfxGain) sfxGain.gain.value = levels.sfx;
  if (musGain) musGain.gain.value = levels.music;
}
function setMuted(m) {
  muted = m;
  if(m){wukongBattleAudio?.stopAll();wukongHeroAudio?.stopAll();weaponAudio?.stopAll();}
  try { localStorage.setItem(WUKONG ? 'wukong-muted' : 'chiyan-muted', m ? '1' : '0'); } catch (e) {}
  if (master) master.gain.value = m ? 0 : 0.6;
  $('muteWave').setAttribute('display', m ? 'none' : 'inline'); $('muteX').setAttribute('display', m ? 'inline' : 'none');
  $('btnMute').setAttribute('aria-label', m ? '打开声音' : '静音');
}

// ================= input =================
const K = {};
const GAME_KEYS = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyJ','KeyK','KeyL','KeyC','KeyQ','KeyX','KeyZ','Enter','KeyP','Escape']);
addEventListener('keydown', e => {
  if (G.mode === 'loading') { if (e.code === 'Escape') { e.preventDefault(); cancelLoading(); } return; }
  if (G.mode === 'lobby') return;
  // menus are driven by the game loop (arrows + Enter/J/K); the settings panel keeps native keyboard behaviour
  if (GAME_KEYS.has(e.code) && (G.mode !== 'settings' || e.code === 'Escape')) e.preventDefault();
  K[e.code] = true;
});
addEventListener('keyup', e => { K[e.code] = false; });
addEventListener('blur', () => { for (const k in K) K[k] = false; if (G.mode === 'play' && !cooperative()) pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play') pause(); Music.sync(); });
// Browsers unlock audio on a real gesture; loading a menu alone must stay silent.
function unlockReferenceAudio() {
  if (G.mode === 'pause' || (G.mode === 'settings' && G.settingsFrom === 'pause')) return;
  initAudio(); Music.sync();
}
addEventListener('pointerdown', unlockReferenceAudio, true);
addEventListener('keydown', unlockReferenceAudio, true);

function updateGamepadUI(state) {
  const connected=state.status==='connected';
  const status=$('gamepad-status'),indicator=$('gamepad-indicator');
  if(status){status.textContent=connected?state.active.name:({waiting:'等待手柄 · 点击游戏后按 A 激活',unsupported:'浏览器未提供手柄接口',blocked:'暂时无法读取手柄'}[state.status]||'等待手柄');status.title=connected?state.active.id:'';}
  if(indicator)indicator.textContent=connected?'手柄已连接 · '+state.active.name:'手柄：点击游戏后按 A 激活';
}
const gamepads=new GamepadInput({
  getGamepads:typeof navigator.getGamepads==='function'?()=>navigator.getGamepads():undefined,
  onChange:updateGamepadUI
});
function pollPad() { return gamepads.poll(); }
addEventListener('gamepadconnected',pollPad);
addEventListener('gamepaddisconnected',pollPad);
const T = { up: false, down: false, left: false, right: false, fire: false, jump: false, gren: false, nade: false };
const prev = { jump: false, start: false, fire: false, gren: false, nade: false, cyc: false, esc: false, up: false, down: false, left:false, right:false };
function readInput() {
  const gp = pollPad();
  const I = {
    up: K.ArrowUp || K.KeyW || gp.up || T.up,
    down: K.ArrowDown || K.KeyS || gp.down || T.down,
    left: K.ArrowLeft || K.KeyA || gp.left || T.left,
    right: K.ArrowRight || K.KeyD || gp.right || T.right,
    fire: K.KeyJ || K.KeyX || gp.fire || T.fire,
    jump: K.KeyK || K.KeyZ || K.Space || gp.jump || T.jump,
    gren: K.KeyL || K.KeyC || gp.gren || T.gren,
    nade: K.KeyI || K.KeyV || gp.nade || T.nade,
    cyc: K.KeyQ || gp.cyc,
    start: K.Enter || gp.start,
    esc: K.Escape || K.KeyP || gp.back || (gp.cancel && ['title','select','pause','settings','lobby','loading','clear','over'].includes(G.mode)),
  };
  I.jumpEdge = I.jump && !prev.jump; I.startEdge = I.start && !prev.start; I.fireEdge = I.fire && !prev.fire; I.grenEdge = I.gren && !prev.gren; I.nadeEdge = I.nade && !prev.nade; I.cycEdge = I.cyc && !prev.cyc; I.escEdge = I.esc && !prev.esc; I.upEdge = I.up && !prev.up; I.downEdge = I.down && !prev.down;
  prev.jump = I.jump; prev.start = I.start; prev.fire = I.fire; prev.gren = I.gren; prev.nade = I.nade; prev.cyc = I.cyc; prev.esc = I.esc; prev.up = I.up; prev.down = I.down;
  I.leftEdge=I.left&&!prev.left;I.rightEdge=I.right&&!prev.right;prev.left=I.left;prev.right=I.right;
  return I;
}

// touch controls
const tl = $('touch'), stickEl = $('stick'), knob = $('knob'), bF = $('bFire'), bJ = $('bJump'), bG = $('bGren'), bN = $('bNade');
let stick = null; const btnPtr = new Map();
function enableTouchMode() { document.body.classList.add('touchmode'); updateRotateHint(); }
if (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0) enableTouchMode();
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') enableTouchMode(); }, true);
function setDir(dx, dy) {
  T.up = T.down = T.left = T.right = false;
  if (Math.hypot(dx, dy) < 14) return;
  const k = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
  T.right = k === 0 || k === 1 || k === 7; T.left = k === 3 || k === 4 || k === 5;
  T.down = k === 1 || k === 2 || k === 3; T.up = k === 5 || k === 6 || k === 7;
}
function whichBtn(x, y) {
  let best = null, bd = 1e9;
  for (const [el, name] of [[bF, 'fire'], [bJ, 'jump'], [bG, 'gren'], [bN, 'nade']]) {
    const r = el.getBoundingClientRect(), d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
    if (d < r.width * 0.8 && d < bd) { bd = d; best = name; }
  }
  return best;
}
function refreshBtns() {
  T.fire = T.jump = T.gren = T.nade = false;
  for (const v of btnPtr.values()) { if (v === 'fire') T.fire = true; if (v === 'jump') T.jump = true; if (v === 'gren') T.gren = true; if (v === 'nade') T.nade = true; }
  bF.classList.toggle('down', T.fire); bJ.classList.toggle('down', T.jump); bG.classList.toggle('down', T.gren); bN.classList.toggle('down', T.nade);
}
function placeStick() { stickEl.style.left = stick.x + 'px'; stickEl.style.top = stick.y + 'px'; }
tl.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (slotHit(e.clientX, e.clientY)) return;
  if (e.clientX < innerWidth * 0.5 && !stick) {
    stick = { id: e.pointerId, x: e.clientX, y: e.clientY }; placeStick(); stickEl.hidden = false;
    knob.style.transform = ''; $('stickHint').hidden = true;
  } else { btnPtr.set(e.pointerId, whichBtn(e.clientX, e.clientY)); refreshBtns(); }
  try { tl.setPointerCapture(e.pointerId); } catch (err) {}
});
tl.addEventListener('pointermove', e => {
  if (stick && e.pointerId === stick.id) {
    let dx = e.clientX - stick.x, dy = e.clientY - stick.y; const R = 46, d = Math.hypot(dx, dy);
    if (d > R) { stick.x += dx * (1 - R / d); stick.y += dy * (1 - R / d); placeStick(); dx = e.clientX - stick.x; dy = e.clientY - stick.y; }
    knob.style.transform = `translate(${dx}px,${dy}px)`; setDir(dx, dy);
  } else if (btnPtr.has(e.pointerId)) { btnPtr.set(e.pointerId, whichBtn(e.clientX, e.clientY)); refreshBtns(); }
});
function endPtr(e) {
  if (stick && e.pointerId === stick.id) { stick = null; stickEl.hidden = true; setDir(0, 0); $('stickHint').hidden = false; }
  else if (btnPtr.delete(e.pointerId)) refreshBtns();
}
tl.addEventListener('pointerup', endPtr); tl.addEventListener('pointercancel', endPtr);
function releaseTouch() { stick = null; stickEl.hidden = true; btnPtr.clear(); setDir(0, 0); refreshBtns(); $('stickHint').hidden = false; }
document.addEventListener('contextmenu', e => e.preventDefault());

// ================= game state =================
const G = { mode: 'title' };
function newPlayer(x) {
  return { pid: 1, shotSeq:0, ...(WUKONG?{heroFrames:true,...newVitality()}:{}), x, y: 176, vx: 0, vy: 0, face: 1, onGround: true, support: null, inWater: false, prone: false, dive: false, spin: false,
    dropT: 0, coyote: 0, airJumps: 0, cart: null, cartSeat: 0, cartDuck: false, cartCooldown: 0, cool: 0, wantFire: false, spCd: 0, ride: null, rideT: 0, motoPitch:0, motoDustClock:0, giantT: 0, giantHits: 0, giantGraceT: 0, giantHitT: 0, giantCrushT: 0, wet: false, camoT: 0, riot: 0, helmT: 0, cleatT: 0, thermT: 0, fireproofT: 0, magnetT: 0, droneT: 0, droneCd: 0, acidT: 0, o2T: 0, coolT: 0, boostT: 0, torpCd: 0, dashT: 0, dashCd: 0, iceAir: false, skid: false, hook: null, invT: 2, shieldT: 0, dead: false, deadT: 0, weapon: 'rifle', rapid: false, ax: 1, ay: 0, anim: 0, flashT: 0 };
}
function reset(stage, carry) {
  wukongBattleAudio?.resetEvents();
  wukongHeroAudio?.resetEvents();
  const thirtyLives=!WUKONG&&(lifeCheat.enabled||!!(carry&&G.thirtyLives));
  const keep2 = carry && G.p2 ? { weapon: G.p2.weapon, rapid: G.p2.rapid, inv: G.inv2 || [] } : null;
  const keep = carry && G.p ? { score: G.score, lives: G.lives, nextLife: G.nextLife, deaths: G.deaths, time: G.time, inv: G.inv.slice(), sel: G.sel, weapon: G.p.weapon, rapid: G.p.rapid } : null;
  Object.assign(G, {
    camX: 0, camY: 0, t: 0, time: 0, score: 0, lives: thirtyLives?THIRTY_LIVES:SET.diff === 'easy' ? 5 : 3, thirtyLives, nextLife: 20000, deaths: 0, shake: 0,
    p: newPlayer(40), pb: [], eb: [], gr: [], en: [], riverFishHits:{}, flashT: 0, nadeCd: 0, freezeT: 0, empT: 0, decoyT: 0, decoyX: 0, sweepT: 0, inv: [], sel: 0, pods: [], items: [], fx: [],
    spawnT: 2.5, podTrig: [...PODS,...(WUKONG&&(stage||1)===1?[...WUKONG_MAGIC_DROPS,...HEALING_DROPS]:[])].map(p => ({ ...p, done: false })), boss: makeBoss(), bannerT: 0,
  });
  delete G.wukongSupplies;delete G.siege;
  delete G.wukongRecovery;delete G.martialCombo;delete G.hitStop;delete G.hitStopInputs;delete G.impactPauseLock;delete G.martialSoundAt;
  G.p.invT = 1.5;
  setLevel(stage === 3 || stage >= 5 ? stage : 1);
  resetBridges();
  for (const [x, y] of SNIPERS) G.en.push({ t: 'snp', x, y, hp: WUKONG&&(stage||1)===1?HEAVEN_HP.snp:1, ...(WUKONG&&(stage||1)===1?{maxHp:HEAVEN_HP.snp}:{}), fireT: (stage || 1) === 1 ? 2.4 + rnd() : 1 + rnd(), face: -1, ax: -1, ay: 0, flash: 0 });
  BOXES.forEach(([x, item], i) => {
    // A shelf can cover the lower bank; the case belongs on its visible grass top.
    const surface = (stage || 1) === 1 ? (WUKONG ? groundAt(x) : supplySurfaceAt(x)) : null;
    G.en.push({ t: 'box', x, y: surface?.y ?? 176, hp: 4, item, open: false, st: 0.8 + i * 0.35, flash: 0 });
  });
  for (const [x, y] of TURRETS) G.en.push({ t: 'tur', x, y: ((stage || 1) === 1 && y === 176 ? groundAt(x)?.y || y : y) - 16, hp: WUKONG&&(stage||1)===1?HEAVEN_HP.tur:6, ...(WUKONG&&(stage||1)===1?{maxHp:HEAVEN_HP.tur}:{}), idx: 6, rotT: 0, fireT: (stage || 1) === 1 ? 2.2 + rnd() : 0.9, flash: 0 });
  if(WUKONG&&(stage||1)===1)G.wukongFlights=[320,900,1520,2140].map(at=>({at,done:false}));else delete G.wukongFlights;
  G.stage = stage || 1;
  if(!WUKONG&&G.stage===1)G.en.push(createFortressRoofGuard());
  stageMusicSession.begin(G.stage);
  if (G.stage === 1) { G.p.y = groundAt(G.p.x)?.y || 144; G.p.support = groundAt(G.p.x); }
  G.uw = G.stage >= 9; // the underwater bonus stages
  G.vert = G.stage === 10; // 水下第二关 scrolls downward
  G.subMode = G.stage === 11; // 水下第三关: you pilot a mini sub
  G.rail = G.stage === 12; // 水下第四关: swept into the screen by the current
  G.tdm = G.stage === 13; // 水下第五关: top-down dark cave
  G.fortm = G.stage === 14; // 水下第六关: flood and drain the fortress compartments
  G.liftm = G.stage === 15; // 水下第七关: ride a lift down an ice shaft
  G.momm = G.stage === 16; // 水下第八关: guard the drill, then fight the Ancient Mother
  if (keep) { Object.assign(G, { score: keep.score, lives: keep.lives, nextLife: keep.nextLife, deaths: keep.deaths, time: keep.time, inv: keep.inv.filter(k => WUKONG || stageItemAllowed(k,stage||1)), sel: 0 }); G.p.weapon = keep.weapon; G.p.rapid = keep.rapid; }
  if (isBase()) initBase();
  if (G.stage === 3) initStage3();
  if (G.stage === 5) initStage5();
  if (G.stage === 6) initStage6();
  if (G.stage === 7) initStage7();
  if (G.stage === 8) initStage7Alien();
  if (G.stage === 9) initSea9();
  if (G.stage === 10) initSea10();
  if (G.stage === 11) initSea11();
  if (G.stage === 12) initRail();
  if (G.stage === 13) initTD();
  if (G.stage === 14) initFort();
  if (G.stage === 15) initLift();
  if (G.stage === 16) initMom();
  if (cooperative()) {
    G.p2 = { ...G.p, pid: 2, x: G.p.x + 24, weapon: keep2?.weapon || 'rifle', rapid: keep2?.rapid || false };
    G.inv2 = keep2 ? keep2.inv.filter(k => WUKONG || stageItemAllowed(k,G.stage)) : [];
    G.sel2 = 0; G.nadeCd2 = 0;
  } else { delete G.p2; delete G.inv2; }
  if(isSiege())WukongSiege.init(G,players(),siegeHooks());
}
function syncSiegeRoom(){
  LEVEL_W=WukongSiege.ROOM_WIDTHS[G.siege.room];CAM_MAX=Math.max(0,LEVEL_W-W);
  solids.splice(0,solids.length,...G.siege.solids);G.camX=Math.max(0,Math.min(CAM_MAX,G.p.x-W*.4));G.camY=0;
}
function siegeHooks(){return {onRoom:syncSiegeRoom,onTell:banner,onScore:addScore,onFinish:stageClear,onImpact:(kind,x,y)=>{puff(x,y);tone(kind==='reflect'?740:kind==='seal'?440:130,.13,'triangle',.06);queueHeroImpact(G,{x,y,heavy:kind==='heavy'||kind==='seal',metal:true});if(kind==='seal')shake(2);}};}
function makeBoss() {
  return { active: false, dead: false, deadT: 0, phase2: false, spawnT: 1.5,
    parts: [
      { ...FORTRESS_TARGETS[0], hp: 20, max: 20, fireT: 1.6, flash: 0 },
      { ...FORTRESS_TARGETS[1], hp: 20, max: 20, fireT: 2.6, flash: 0 },
      { ...FORTRESS_TARGETS[2], hp: 60, max: 60, flash: 0 },
    ] };
}
reset();

function addScore(n) {
  G.score += n;
  if (G.score > HI) { HI = G.score; try { localStorage.setItem(WUKONG ? 'wukong-hi' : 'chiyan-hi', String(HI)); } catch (e) {} }
  if (G.score >= G.nextLife) { G.lives++; G.nextLife += 70000; banner('奖励一条命'); sfx.pick(); }
}
function banner(text, sec) { G.bannerText = isCelestial()?wukongMountText(text):text; G.bannerT = sec || 1.8; }
function shake(n) { if (!reduceMotion && SET.shake === 'on') G.shake = Math.max(G.shake, n); }

// ================= effects =================
function boom(x, y, s) {
  G.fx.push({ k: 'boom', x, y, t: 0, life: 0.42 + s * 0.012, s });
  for (let i = 0; i < 4 + s / 2; i++) G.fx.push({ k: 'spark', x, y, vx: (rnd() - 0.5) * 160, vy: -rnd() * 160, t: 0, life: 0.4 + rnd() * 0.3 });
}
function splash(x) { for (let i = 0; i < 8; i++) G.fx.push({ k: 'drop', x: x + (rnd() - 0.5) * 8, y: WATER.surf, vx: (rnd() - 0.5) * 60, vy: -60 - rnd() * 90, t: 0, life: 0.6 }); sfx.splash(); }
function blowSeg(sg) {
  sg.gone = true;
  boom(sg.x + 16, sg.y + 2, 14);
  for (let i = 0; i < 6; i++) G.fx.push({ k: 'debris', x: sg.x + rnd() * 32, y: sg.y, vx: (rnd() - 0.5) * 120, vy: -60 - rnd() * 130, t: 0, life: 0.7 });
  sfx.boom(); shake(2);
  for (const it of G.items) if (it.rest && it.x >= sg.x - 4 && it.x <= sg.x + SEG_W + 4 && Math.abs(it.y - sg.y) < 1) { it.rest = false; it.vy = 0; }
}
function updateBridges() {
  if (G.stage !== 1) return;
  const p = G.p;
  for (const b of BRIDGES) {
    if (!b.armed) { if (players().some(actor => !actor.dead && actor.x >= b.x0 - 18)) { b.armed = true; b.t = 0.7; } continue; }
    if (b.next >= b.n) continue;
    b.t -= DT;
    if (b.t <= 0) { blowSeg(b.segs[b.next]); b.next++; b.t = 0.4; }
  }
}
function spark(x, y, options={}) {
  if(G.stage===1||G.stage===2)addImpact(G.fx,{x,y,seed:Math.floor(rnd()*0x7fffffff),...options});
  else G.fx.push({ k: 'hit', x, y, t: 0, life: 0.1 });
}
function puff(x, y) { for (let i = 0; i < 5; i++) G.fx.push({ k: 'puff', x: x + (i - 2) * 3, y: y - 2, vx: (i - 2) * 28, vy: 24, t: 0, life: 0.25 }); }
function giantSmashFX(x, y) { G.fx.push({ k: 'stomp', x, y, t: 0, life: .32 }); shake(2.5); }
function martialImpact(x,y,{heavy=false,player=false,killed=false,metal=false,blood=false,face=1,damage=0,target,weapon,angle=0,form=null}={}) {
  // A crowd of helpers may hit on adjacent ticks. Bound global pauses while
  // retaining every enemy's independent recoil, contact flash and damage.
  if(player||G.hitStop>0||!(G.impactPauseLock>0)){
    G.hitStop=Math.max(G.hitStop||0,killed?.075:heavy?.065:.04);G.impactPauseLock=.16;
  }
  addMartialHit(G.fx,{x,y,target,face,heavy,killed,metal,player,blood,weapon,angle,form,seed:(G.t*131+Math.round(x*17+y*13))|0});
  if(damage)G.fx.push({k:'combatNumber',x,y:y-6,text:String(damage),player,t:0,life:.55});
  shake(player?2:heavy||killed?1.8:.7);
  if(player){
    if(G.martialSoundAt===undefined||G.time-G.martialSoundAt>=.035){G.martialSoundAt=G.time;sfx.hurt();}
  }else queueHeroImpact(G,{x,y,heavy,killed,metal});
  if(!player){
    const combo=G.martialCombo??={hits:0,remaining:0};
    combo.hits=combo.remaining>0?combo.hits+1:1;combo.remaining=1.5;
  }
}

// ================= player =================
function pBox(p) {
  if(p.liftSide||p.liftDone)return null;
  if(p.enteringExit||p.exitEntered)return null;
  if (G.subMode) return { x: p.x - 12, y: p.y - 6, w: 24, h: 12 };
  if (G.uw) return { x: p.x - 9, y: p.y - 6, w: 18, h: 10 };
  if (isBase()) {
    const g = p.giantT > 0 ? 2 : 1;
    if (p.spin) return { x: p.x - 7 * g, y: p.y - 22 * g, w: 14 * g, h: 14 * g };
    if (p.prone) return { x: p.x - 9 * g, y: p.y - 9 * g, w: 18 * g, h: 9 * g };
    return { x: p.x - 6 * g, y: p.y - 28 * g, w: 12 * g, h: 28 * g };
  }
  if(isMinecartRider(p))return minecartRiderBox(p);
  if (p.ride === 'heli') return { x: p.x - 12, y: p.y - 16, w: 24, h: 20 };
  if (p.ride === 'moto') return { x: p.x - 11, y: p.y - 30, w: 22, h: 30 };
  if (p.giantT > 0) {
    if (p.spin) return { x: p.x - 14, y: p.y - 44, w: 28, h: 28 };
    if (p.prone) return { x: p.x - 22, y: p.y - 18, w: 44, h: 18 };
    return { x: p.x - 10, y: p.y - 56, w: 20, h: 56 };
  }
  if (p.inWater) return p.dive ? null : { x: p.x - 5, y: WATER.surf - 12, w: 10, h: 12 };
  if (p.spin) return { x: p.x - 7, y: p.y - 22, w: 14, h: 14 };
  if (p.prone) return { x: p.x - 11, y: p.y - 9, w: 22, h: 9 };
  return { x: p.x - 5, y: p.y - 28, w: 10, h: 28 };
}
function dismount(wreck) {
  const p = G.p, was = p.ride;
  if (!was) return;
  p.ride = null; p.rideT = 0;p.motoPitch=0;p.motoDustClock=0;
  if (wreck) { boom(p.x, p.y - 10, 16); sfx.wreck(); shake(3); banner(was === 'heli' ? '直升机被击毁' : '摩托车被击毁', 1.2); }
  p.invT = Math.max(p.invT, 1.5);
  if (was === 'heli') { p.vy = -80; p.onGround = false; p.airJumps = 1; p.spin = true; }
}
function killPlayer(force,hit={}) {
  const p = G.p;
  if (p.dead || G.boss.dead || (G.stage === 5 && G.fortress?.dead) || (G.stage === 6 && G.golem && G.golem.dead) || ((G.stage === 7 || G.stage === 8) && G.hive && G.hive.dead) || (G.uw && ((G.stage === 9 && G.shark && G.shark.dead) || (G.stage === 10 && G.ghost && G.ghost.dead) || (G.stage === 11 && G.crab && G.crab.dead) || (G.stage === 12 && G.queen && G.queen.dead) || (G.stage === 13 && G.angler && G.angler.dead) || (G.stage === 14 && G.fcore && G.fcore.dead) || (G.stage === 15 && G.serp && G.serp.dead) || (G.stage === 16 && G.mcore && G.mcore.dead)))) return;
  if (!force && (p.invT > 0 || p.shieldT > 0)) return;
  if (!force && p.ride) { dismount(true); return; } // the vehicle takes the hit
  if (!force && p.giantT > 0) {
    const hit = hitGiant(p);
    if (hit === 'immune') { spark(p.x, p.y - 30, { material: 'metal', power: .5 }); return; }
    sfx.hit(); shake(1.5);
    if (hit === 'ended') { puff(p.x, p.y); banner('巨大化护甲耗尽 · 恢复原尺寸', 1.4); }
    else { spark(p.x, p.y - 30, { material: 'metal' }); banner('巨大化护甲剩余 ' + p.giantHits + ' 次', 1); }
    return;
  }
  if(isCelestial()){
    if(!force){
      const result=receiveHeroHit(p,hit);if(!result)return;
      martialImpact(hit.x??p.x,hit.y??p.y-18,{...result,player:true,damage:result.amount});
      if(result.rageReady&&!result.lethal){banner('怒气已满 · I / 大招可释放',1.8);tone(660,.18,'triangle',.08,990);tone(880,.22,'sine',.06,1320);}
      if(!result.lethal)return;
    }else p.hp=0;
  }
  leaveMinecart(p);p.ride = null; endGiant(p, false);
  beginDeath(p);
  if(isCelestial())cancelStaffCharge(p,true);
  if(isCelestial()){if(p.hurt)p.hurt=null;if(p.staff)p.staff=null;if(hit.face)p.vx=Math.sign(hit.face)*70;}
  if(isCelestial())clearWukongMagic(p);
  p.weapon = 'rifle'; p.rapid = false; p.shieldT = 0; if (!infiniteLives()) G.lives--; G.deaths++; // Dying also costs the current weapon.
  sfx.die(); shake(3);
}
function respawn() {
  if(isSiege()){const pid=G.p.pid||1,other=players().find(p=>p!==G.p&&!p.dead);G.p={...newPlayer(other?other.x-18:G.siege.checkpointX),pid};G.p.invT=2.2;if(!other)G.siege.retryPending=true;return;}
  if (G.subMode) {
    const Cr = G.crab, right = Cr && Cr.active && !Cr.dead && Cr.x < G.camX + W / 2; let px = right ? G.camX + W - 50 : G.camX + 70, py = 100;
    const xs = right ? [G.camX + W - 50, G.camX + W - 80] : [G.camX + 70, G.camX + 110, G.camX + 150];
    search: for (const y of [90, 70, 110, 60, 50, 40]) for (const x of xs) { const t = { x, y }; if (!solids.some(s2 => subHit(t, s2))) { px = x; py = y; break search; } }
    G.p = newPlayer(px); G.p.y = py; G.p.vy = 0; G.p.face = right ? -1 : 1; G.p.invT = 3; G.sea.heat = 0; return;
  }
  if (G.vert) {
    // back in below the rubble, in open water
    const keep = G.p.face, y0 = Math.max(G.sea.colY + 60, G.camY + 50); let px = 192, py = y0;
    search: for (let y = y0; y < y0 + 500; y += 6) for (const x of [192, 100, 280, 60, 320]) { const t = { x, y }; if (!solids.some(s2 => swimHit(t, s2))) { px = x; py = y; break search; } }
    G.p = newPlayer(px); G.p.y = py; G.p.vy = 0; G.p.face = keep; G.p.invT = 2.2; G.sea.o2 = 1; return;
  }
  if (G.uw) { const keep = G.p.face; G.p = newPlayer(G.camX + 60); G.p.y = 90; G.p.vy = 0; G.p.face = keep; G.p.invT = 2.2; if (G.sea) G.sea.o2 = 1; return; }
  if (G.stage === 3) {
    const cands = solids.filter(s2 => s2.y > G.camY + 70 && s2.y < G.camY + 200).sort((a, b) => Math.abs(a.y - G.camY - 140) - Math.abs(b.y - G.camY - 140));
    const s2 = cands[0] || solids.find(q => q.y > G.camY && q.y < G.camY + H);
    const keep = G.p.face;
    G.p = newPlayer(s2 ? s2.x + s2.w / 2 : 192); G.p.y = s2 ? s2.y - 30 : G.camY + 100; G.p.vy = 0; G.p.onGround = false; G.p.face = keep; G.p.invT = 2.2;
    return;
  }
  if (isBase()) { const x = G.p.x, keep = G.p.face; G.p = newPlayer(x); G.p.y = BASE_FLOOR; G.p.face = keep; G.p.invT = 2.2; return; }
  if(G.stage===7&&G.p.x>=HANGAR_CART_TUNNEL.retryStart&&G.p.x<=HANGAR_CART_TUNNEL.retryEnd){
    // A mandatory vehicle section must remain playable after losing the cart.
    const x=G.p.x,face=G.p.face;
    let cart=G.en.find(c=>c.t==='cart'&&!c.dead&&Math.abs(c.x-x)<40);
    if(!cart){cart={t:'cart',depot:'tunnel-recovery',x,y:176,vx:0,vy:0,hp:4,on:true,wheel:0};G.en.push(cart);}
    G.p=newPlayer(cart.x);G.p.face=face;G.p.y=cart.y-MINECART.rimHeight;
    boardMinecart(G.p,[cart],G.p.y);G.p.cartDuck=!minecartCanRise(G.p,solids);G.p.invT=2.2;return;
  }
  let x = G.camX + 50;
  for (let xx = G.camX + 40; xx < G.camX + 220; xx += 8) { const s = groundAt(xx); if (s && !s.water) { x = xx; break; } }
  const keep = G.p.face;
  G.p = newPlayer(x); G.p.y = -10; G.p.vy = 0; G.p.onGround = false; G.p.face = keep; G.p.invT = 2.2;
}

// Run only the second actor's logic in the original player's context. World
// movement, enemy AI, projectiles and timers still advance exactly once per tick.
function withPlayer2(fn) {
  if (!cooperative() || !G.p2) return;
  const primary = G.p, inventory = G.inv, selection = G.sel, cooldown = G.nadeCd;
  primaryContext = primary;
  G.p = G.p2; G.inv = G.inv2; G.sel = G.sel2; G.nadeCd = G.nadeCd2;
  try { fn(); } finally {
    G.p2 = G.p; G.p2.pid = 2; G.inv2 = G.inv; G.sel2 = G.sel; G.nadeCd2 = G.nadeCd;
    G.p = primary; G.inv = inventory; G.sel = selection; G.nadeCd = cooldown;
    primaryContext = null;
  }
}
function updatePartner(input) {
  withPlayer2(() => {
    if (G.nadeCd > 0) G.nadeCd -= DT;
    if (input.nadeEdge) requestNade();
    updateActor(input);
  });
}
function updateActor(input) {
  if(G.stage===3&&(G.p.summitEntry||G.p.summitEntered)){advanceSummitEntry(G.p,DT);return;}
  if(G.stage===1&&(G.p.enteringExit||G.p.exitEntered)){advanceExitEntry(G.p,FORTRESS_EXIT,DT);return;}
  if(G.stage===6&&(G.p.enteringExit||G.p.exitEntered)){advanceStageSixExitEntry(G.p,DT);return;}
  const first = G.pb.length, owner = G.p.pid || 1;
  if (isBase()) updatePlayerBase(input); else updatePlayer(input);
  for (let i = first; i < G.pb.length; i++) G.pb[i].owner = owner;
}
function keepTeamOnScreen() {
  if (!cooperative() || !G.p2 || isBase()) return;
  const alive = players().filter(p => !p.dead&&!p.enteringExit&&!p.exitEntered);
  if (G.stage === 3) {
    for (const p of alive) if (p.y < G.camY + 32) { p.y = G.camY + 32; p.vy = Math.max(0, p.vy); }
  } else if (alive.length === 2) {
    const back = Math.min(...alive.map(p => p.x));
    for (const p of alive) p.x = Math.min(p.x, back + W - 48);
  }
}
function collidePartnerHazards() {
  withPlayer2(() => {
    const p = G.p, b = pBox(p); if (p.dead || !b) return;
    let hit = false;
    if (G.stage === 3) hit = G.freezeT<=0&&G.mech.active&&!G.mech.dead&&waterfallArmBoxes(G.mech,STAGE_THREE.top).some(q=>overlap(b,q));
    if (G.stage === 5) hit = G.tank.mode === 'fwd' && overlap(b, tankHull(G.tank));
    if (G.stage === 6) hit = (G.freezeT <= 0 && G.golem?.active && !G.golem.dead && (overlap(b, golemBody(G.golem))||stageSixBossStompBoxes(G.golem).some(q=>overlap(b,q)))) || (!(p.fireproofT > 0) && [...G.jets.map(jetBox).filter(Boolean), ...G.s6.waves.map(waveBox)].some(q => overlap(b, q)));
    if (G.stage === 8) {
      hit = overlap(b, { x: G.hive.x + 4, y: 0, w: 150, h: 176 });
      if (G.freezeT<=0&&!(p.acidT > 0)) for (const d of G.s8.drops) if (!d.dead && overlap(b, { x: d.x - 2, y: d.y - 5, w: 4, h: 7 })) { d.dead = true; hit = true; }
      hit ||= G.s8.spikes.some(s => spikeH(s) > 8 && overlap(b, { x: s.x - 5, y: 176 - spikeH(s), w: 10, h: spikeH(s) }));
    }
    if (hit) killPlayer();
  });
}

// =====================================================================
// STAGE 2 · 地下指挥所: pseudo-3D base corridor. Depth z runs 0 (player plane) to 1 (back wall);
// a floor point (u, z) projects to x = 192 + u * sc(z), y = 204 - 64 z.
// =====================================================================
const BASE_FLOOR = 204, BASE_HIT_Y = 129;
function isBase() { return !WUKONG && (G.stage === 2 || G.stage === 4); }
const sc = z => 1 - 0.5 * z;
const bx = (u, z) => 192 + u * sc(z);
const by = z => BASE_FLOOR - 64 * z;
const BASE_ROOMS = [
  { name: '第 1 区 · 外围哨所', guns: [140, 244], sol: 6, chg: 0.15, rol: 0, supply: ['L', 'd'] },
  { name: '第 2 区 · 动力机房', guns: [136, 158, 226, 248], sol: 7, chg: 0.25, rol: 4, supply: ['f', 'e'] },
  { name: '第 3 区 · 武备仓库', guns: [136, 158, 226, 248], sol: 9, chg: 0.35, rol: 7, supply: ['S', 'e'] },
  { name: '指挥中枢', boss: 'eye' },
];
// stage 4 · 地下基地 · 双生投影: alert-mode corridors, rail cannons, faster rolling mines, and the twin-projection boss
const BASE_ROOMS4 = STAGE_FOUR_ROOMS;
const ROOMS = () => G.stage === 4 ? BASE_ROOMS4 : BASE_ROOMS;
const aimX = () => G.decoyT > 0 ? G.decoyX : G.p.x; // a hologram decoy draws all fire
function initBase() {
  G.en = []; G.pods = []; G.items = []; G.camX = 0;
  G.base = { room: 0, scroll: 0 };
  Object.assign(G.p, { x: 192, y: BASE_FLOOR, ride: null, onGround: true });
  loadRoom(0);
}
function loadRoom(i) {
  const B = G.base, def = ROOMS()[i];
  Object.assign(B, { room: i, def, cleared: false, clearT: 0, trans: 0, spawned: 0, rolled: 0, spawnT: 1.4, rollT: 3, rollSide: 0, coreT: 2, sol: [], rol: [], dead: false, deadT: 0, phase2: false,bossPhase:null,bossTime:0,revealT:0,exitReady:false,exitRollT:null,bubbleShots:0 });
  G.eb.length = 0; G.pb.length = 0; G.gr.length = 0; G.items = [];
  if (def.boss === 'twin') {
    B.targets=STAGE_FOUR_DEVICES.map(t=>({...t,fireT:2.6+rnd()*2}));B.bossPhase='devices';
    banner('先摧毁四个防卫装置 · 跳跃射击高位装置',2.5);
    if(G.mode==='play')Music.start(true,-1);
  } else if (def.boss) {
    B.targets = BASE_BOSS_DEVICES.map(t=>({...t,fireT:.8+rnd()*2.8,shutterPhase:'closed',aperture:0,shotFlash:0}));B.bossPhase='devices';
    banner('先摧毁两排共六个装置', 2.2);
    if (G.mode === 'play') Music.start(true, -3);
  } else {
    B.targets = def.guns.map(x => ({ k: 'gun', x: x - 9, y: 108, w: 18, h: 14, hp: 4, max: 4, fireT: 1.6 + rnd() * 1.6, flash: 0 }));
    // The bottom row contains only the non-firing objective at the wall base.
    B.targets.push({ k: 'core', tier:'low', x: 179, y: 116, w: 26, h: 22, hp: 12, max: 12, flash: 0 });
    if (G.stage === 2 || def.high) B.targets.push({ ...BASE_HIGH_SWITCH, k: 'switch', fireT: 2.8 + rnd(), flash: 0 });
    // rail cannons glide along the back wall in front of everything else, so they are listed (and hit) first
    for (let r = 0; r < (def.rails || 0); r++) B.targets.unshift({ k: 'rail', cx: 182, x: 182, y: 108, w: 20, h: 14, hp: 6, max: 6, fireT: 1.8 + r, flash: 0, ph: r * Math.PI, spd: 1 + r * 0.35 });
    if (i > 0) banner(def.name, 1.4);
  }
  if(G.stage===4)initStageFourDefenses(B);
}
const coreShielded = () => baseCoreShielded(G.base, G.empT);
const nearestTarget = (x, height) => baseHomingTarget(G.base, x, height, G.stage);
function baseShot(x0, y0, x1, y1, dur) {
  const ez = SET.diff === 'easy' ? 0.8 : 1;
  G.eb.push({ base: true, x0, y0, x1, y1, x: x0, y: y0, t: 0, dur: dur / ez, r: 2 });
}
function killSoldier(s) {
  if (s.dead) return;
  s.dead = true;
  const x = bx(s.u, s.z), y = by(s.z) - (isBase()?BASE_SOLDIER.height*.5*baseSoldierScale(s.z)+baseSoldierJumpOffset(s):14*sc(s.z));
  boom(x, y, 6); sfx.boom(); addScore(100);
  if (isBase() && s.dropKind && !G.base.cleared && !G.base.dead) {
    G.items.push({ base: true, x, y, vy: -90, kind: s.dropKind, fromSoldier: true });
  }
}
function killGallerySoldier(s){
  if(!s||s.dead)return;s.hp=0;s.dead=true;boom(s.x,s.y-12,6);sfx.boom();addScore(100);
}
function hitTarget(tg, dmg) {
  const B = G.base;
  if (tg.hp <= 0 || B.dead) return;
  if(stageFourFacilityClosed(tg)){sfx.hit();return;}
  if (tg.k === 'core' && coreShielded()) { sfx.hit(); return; }
  if (tg.k === 'twin' && !tg.solid) return; // a projection: bullets pass through
  tg.hp -= dmg; tg.flash = 0.06; sfx.hit();
  if (tg.k === 'bcore' && !B.phase2 && tg.hp <= tg.max / 2) { B.phase2 = true; banner('核心过载', 1.4); }
  if (tg.hp > 0) return;
  tg.destroyedAt=G.time;
  boom(tg.x + tg.w / 2, tg.y + tg.h / 2, tg.k === 'bcore' ? 20 : 12); sfx.big(); shake(3);
  if (tg.k === 'core') roomCleared();
  else if (tg.k === 'bcore') bossDown();
  else if (tg.k === 'twin') {
    const other = B.targets.find(t2 => t2.k === 'twin' && t2 !== tg && t2.hp > 0);
    if (other) { other.solid = true; B.phase2 = true; banner('另一个投影暴走', 1.4); addScore(5000); } else bossDown();
  }
  else {
    addScore(tg.k === 'sat' ? 1000 : 500);
    if(tg.k==='device'&&!bossDevicesRemaining(B)){B.bossPhase='reveal';B.revealT=G.stage===4?1.4:1.2;B.phase2=true;G.eb=[];banner(G.stage===4?'四个装置已摧毁 · 双生投影启动':'六个装置已摧毁 · 顶部装置启动',1.8);}
    if (tg.k === 'switch') banner(coreShielded() ? '高位机关已摧毁' : '高位机关已摧毁 · 核心防护解除', 1.5);
  }
}
function roomCleared() {
  const B = G.base;
  B.cleared = true; B.clearT = 3.5;
  if(B.gallery)B.gallery.length=0;
  for (const tg of B.targets) if (tg.hp > 0) { tg.hp = 0; boom(tg.x + tg.w / 2, tg.y + tg.h / 2, 10); }
  for (const s of B.sol) if (s.st !== 'charge') { s.st = 'leave'; s.dir = s.u < 0 ? -1 : 1; } else killSoldier(s);
  for (const r of B.rol) { r.dead = true; boom(bx(r.u0 + (r.ut - r.u0) * (1 - r.z), r.z), by(r.z) - 3, 6); }
  for (const b of G.eb) b.dead = true;
  // Supplies come from red carriers during the fight, never from room clearance.
  addScore(2000); banner('电网解除', 1.4);
}
function bossDown() {
  const B = G.base;
  B.dead = true; B.deadT = isBase()?1.5:3; if(isBase()){B.bossPhase='exit';B.exitReady=false;} addScore(10000);
  if(B.gallery)B.gallery.length=0;
  if(isBase()){G.pb.length=G.gr.length=0;for(const actor of players()){actor.flashT=0;actor.wantFire=false;}}
  for (const s of B.sol) if (!s.dead) killSoldier(s);
  B.rol.length = 0; G.eb.length = 0; Music.stop(); banner(B.def.boss === 'twin' ? '双生投影摧毁 · 两侧升降梯解锁' : '中枢摧毁 · 两侧升降梯解锁', 2.4);
}
function baseBlast(x, y) {
  const B = G.base;
  G.fx.push({ k: 'boom', x, y, t: 0, life: 0.7, s: 24 });
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; boom(x + Math.cos(a) * 22, y + Math.sin(a) * 12, 10); }
  sfx.big(); shake(4);
  for (const tg of B.targets) if (tg.hp > 0 && (!['switch','device','twin'].includes(tg.k) || baseTargetAtHeight(tg, y)) && Math.hypot(tg.x + tg.w / 2 - x, tg.y + tg.h / 2 - y) < 52) hitTarget(tg, 16);
  for (const s of B.sol) if (!s.dead && s.z > 0.5 && Math.abs(bx(s.u, s.z) - x) < 60) killSoldier(s);
  for(const s of B.gallery||[])if(!s.dead&&Math.hypot(s.x-x,s.y-12-y)<52)killGallerySoldier(s);
  for (const b of G.eb) if (Math.hypot(b.x - x, b.y - y) < 40) b.dead = true;
}
function updatePlayerBase(I) {
  const p = G.p, B = G.base;
  if(p.liftSide){advanceBossLift(p,DT);return;}
  if (p.flashT > 0) p.flashT -= DT;
  if (p.dead) {
    const ready=advanceDeath(p,DT,{land:(x,from,to)=>from<=BASE_FLOOR&&to>=BASE_FLOOR?{y:BASE_FLOOR}:null,clampX:x=>Math.max(28,Math.min(356,x))});
    if (ready) { if (G.lives > 0) respawn(); else if (!cooperative() || players().every(q => q.dead && (q.deathHidden || q.deadT <= 0))) gameOver(); }
    return;
  }
  if (p.invT > 0) p.invT -= DT;
  if (p.shieldT > 0) p.shieldT -= DT;
  if (p.spCd > 0) p.spCd -= DT;
  const giant = p.giantT > 0;
  const h = (I.right ? 1 : 0) - (I.left ? 1 : 0), v = (I.down ? 1 : 0) - (I.up ? 1 : 0);
  if (h) p.face = h;
  if (B.trans > 0) { p.prone = p.spin = p.aimUp = false; p.vx = 0; p.anim += DT * 10; p.x += (192 - p.x) * Math.min(1, DT * 2); return; }
  p.aimUp=['devices','mover','twins'].includes(B.bossPhase)&&!B.dead&&v<0;
  p.prone = p.onGround && v > 0;
  p.vx = p.prone ? 0 : h * RUN;
  if (I.jumpEdge) {
    if (p.onGround) { p.vy = -(giant ? 320 : JUMPV); p.spin = !giant; p.onGround = false; p.airJumps = 1; p.prone = false; sfx.jump(); }
    else if (p.airJumps > 0) { p.airJumps--; p.vy = -JUMPV2; p.spin = !giant; sfx.jump2(); puff(p.x, p.y); }
  }
  p.x = Math.max(28, Math.min(356, p.x + p.vx * DT));
  p.vy = Math.min(p.vy + GRAV * DT, MAXFALL); p.y += p.vy * DT;
  if (p.y >= BASE_FLOOR) { p.y = BASE_FLOOR; p.vy = 0; p.onGround = true; p.spin = false; p.airJumps = 1; } else p.onGround = false;
  if(p.aimUp)p.spin=false;
  if (p.onGround && p.vx) p.anim += DT * 10; else if (p.spin) p.anim += DT * 16; else p.anim = 0;
  if(isBase()&&B.dead&&B.exitReady&&p.onGround&&(p.x<=42||p.x>=342)){
    const side=p.x<192?-1:1;
    if(!players().some(q=>q!==p&&q.liftSide===side&&!q.liftDone)){p.liftSide=side;p.liftT=0;p.spin=p.prone=p.aimUp=false;p.flashT=0;sfx.mount();return;}
  }
  p.aimDx = !p.aimUp && v < 0 && h ? h : 0; p.ax = p.aimDx; p.ay = -1;
  // room cleared: press up (or wait) to walk into the next room
  if (B.cleared && !B.def.boss && (I.upEdge || B.clearT <= 0)) { B.trans = 1.3; sfx.mount(); return; }
  // fire into the corridor
  p.cool -= DT;
  if (I.fireEdge) p.wantFire = true;
  const trigger = SET.autofire === 'on' ? I.fire : p.wantFire;
  if (trigger && p.cool <= 0 && !B.dead) {
    p.wantFire = false;
    const w = WEAP[p.weapon];
    if (p.weapon === 'laser') for (const b of G.pb) if (b.k === 'laser' && (b.owner || 1) === p.pid) b.dead = true;
    if (G.pb.filter(b => !b.dead && (b.owner || 1) === p.pid).length + w.per <= w.max) {
      const g = giant ? 2 : 1;
      const muzzle=p.aimUp?baseUpMuzzle(p,StageOneArt.playerRole(cooperative(),p.pid===2?1:0)):null;
      const ox = muzzle?.x ?? p.x + 1 + p.aimDx * 8 * g, oy = muzzle?.y ?? (p.spin ? p.y - 15 * g : p.prone ? p.y - (isBase() ? 26 : 16) * g : p.y - 38 * g);
      const xe = 192 + (p.x - 192) * 0.5 + p.aimDx * 60, ye = baseShotHeight(p, G.stage, !!B.def.boss, B.bossPhase), spd = 1.8 * (p.rapid ? 1.4 : 1);
      const shot = (k, dx, extra) => G.pb.push(Object.assign({ k, t: 0, x0: ox, y0: oy, x: ox, y: oy, xe: xe + dx, ye, spd, dmg: g,upward:!!p.aimUp }, extra || {}));
      if (p.weapon === 'spread') { for (const d of [-40, -20, 0, 20, 40]) shot('sp', d); }
      else if (p.weapon === 'laser') { shot('laser', 0, { dmg: 2 * g, hits: new Set(), spd: isBase() ? 8 : spd * 1.3 }); }
      else if (p.weapon === 'fire') { shot('fire', 0, { dmg: 2 * g, spd: spd * 0.8 }); }
      else if (p.weapon === 'homing') { const tg = nearestTarget(xe, ye); shot('msl', tg ? tg.x + tg.w / 2 - xe : 0, { dmg: 2 * g, spd: spd * 0.9, lock:tg?.mover?'bcore':tg?.k==='twin'?'twin'+tg.id:tg?.k==='gallery'?'gallery'+tg.galleryId:null,ye: tg ? tg.y + tg.h / 2 : ye }); }
      else { shot('b', 0); }
      p.cool = w.cd * (p.rapid ? 0.7 : 1); p.flashT = 0.05; p.flashUp=!!p.aimUp; p.fx = ox; p.fy = oy;
      playerGunshot(p);
    }
  }
  if (I.cycEdge && G.inv.length > 1) { G.sel = (G.sel + 1) % G.inv.length; sfx.hit(); }
  if (I.grenEdge) useSpecial();
}
function detonateBaseMine(r) {
  if (r.dead) return;
  r.dead = true;
  const x = bx(r.u0 + (r.ut - r.u0) * (1 - r.z), r.z), y = by(r.z) - 3;
  boom(x, y - 5, 15); sfx.boom(); shake(1.5);
  // One shared blast is checked for both players; a shield never hides it from the partner.
  G.fx.push({ k: 'baseMineBlast', x, y, z: r.z, t: 0, life: .5, hitPlayers: [] });
  for (let i = 0; i < 3; i++) G.fx.push({ k: 'smoke', x: x + (i - 1) * 5, y: y - i * 2, vx: (i - 1) * 7, vy: -15 - i * 5, t: 0, life: .7 + i * .1 });
}
function updateBase() {
  const B = G.base, p = G.p, def = B.def, frozen = G.freezeT > 0;
  for (const tg of B.targets) if (tg.flash > 0) tg.flash -= DT;
  if (G.decoyT > 0) G.decoyT -= DT;
  if (G.sweepT > 0) G.sweepT -= DT;
  if (B.trans > 0) {
    // Retreating soldiers also stop simulating here, so remove them before advancing.
    B.sol.length = B.rol.length = 0;
    if(B.gallery)B.gallery.length=0;
    G.pb.length = G.eb.length = G.gr.length = 0;
    for(const actor of players()){actor.flashT=0;actor.wantFire=false;}
    B.trans -= DT; B.scroll = (B.scroll + DT * 1.1) % 1;
    if (B.trans <= 0) loadRoom(B.room + 1);
    return;
  }
  if (B.dead) {
    if(isBase()){G.pb.length=G.eb.length=G.gr.length=0;for(const actor of players()){actor.flashT=0;actor.wantFire=false;}}
    if(B.deadT>0){B.deadT=Math.max(0,B.deadT-DT);if(rnd()<.3)boom(110+rnd()*164,65+rnd()*70,8+rnd()*8);shake(2);}
    if(isBase()){
      if(B.deadT<=0)B.exitReady=true;
      const alive=players().filter(q=>!q.dead);
      if(alive.length&&alive.every(q=>q.liftDone)){
        B.exitRollT=(B.exitRollT??0)+DT;
        if(B.exitRollT>=BASE_EXIT_ROLL_DURATION){const next=nextPlayableStage(G.stage);if(next)startStage(next,true);else stageClear();}
      }
    }else if(B.deadT<=0)stageClear();
    return;
  }
  if(G.stage===2&&def.boss==='eye'&&!frozen){
    if(B.bossPhase==='reveal'){
      B.revealT-=DT;if(B.revealT<=0){B.bossPhase='mover';B.bossTime=0;B.targets.push({...BASE_BOSS_MOVER});banner('顶部装置 · 按上举枪射击，躲开气泡',2.2);}
    }else if(B.bossPhase==='mover'){
      B.bossTime+=DT;const mover=B.targets.find(t=>t.mover&&t.hp>0);
      if(mover){mover.x=movingBossX(B.bossTime);mover.fireT-=DT;
        if(mover.fireT<=0&&players().some(q=>!q.dead)){
          const alive=players().filter(q=>!q.dead&&!q.liftSide),target=alive[B.bubbleShots%alive.length];
          mover.fireT=1.45;B.bubbleShots++;
          if(target)G.eb.push({base:true,bubble:true,x0:mover.x+mover.w/2,y0:mover.y+mover.h/2,x1:target.x,y1:BASE_FLOOR-18,x:mover.x+mover.w/2,y:mover.y+mover.h/2,t:0,dur:1.6,r:mover.w/2,rx:mover.w/2,ry:mover.h/2,phase:B.bubbleShots*1.7});
          sfx.eshot();
        }
      }
    }
  }
  if(G.stage===4&&def.boss==='twin'&&!frozen){
    if(B.bossPhase==='reveal'){
      B.revealT-=DT;
      if(B.revealT<=0){B.bossPhase='twins';B.bossTime=0;B.targets.push(...makeTwinProjections());banner('按上举枪 · 面具合拢时攻击实体',2.4);}
    }else if(B.bossPhase==='twins'){
      const alive=players().filter(q=>!q.dead&&!q.liftSide);
      for(const shot of advanceTwinProjections(B,DT))if(alive.length&&G.empT<=0){
        const target=alive[shot.id%alive.length];
        G.eb.push({base:true,ring:true,x0:shot.x,y0:shot.y,x1:Math.max(30,Math.min(354,target.x+shot.offset)),y1:BASE_FLOOR-18,x:shot.x,y:shot.y,t:0,dur:1.65/(SET.diff==='easy'?.8:1),r:3.5,phase:shot.phase});sfx.eshot();
      }
    }
  }
  if (B.cleared) B.clearT -= DT;
  if (!frozen && !B.cleared) {
    if(G.stage===4){
      advanceStageFourShutters(B,DT);
      const alive=players().filter(q=>!q.dead&&!q.liftSide);
      if(alive.length)for(const shot of advanceStageFourGallery(B,DT)){const target=alive[shot.id%alive.length];baseShot(shot.x,shot.y,target.x,BASE_FLOOR-18,1.55);G.eb.at(-1).galleryTier=shot.tier;sfx.eshot();}
    }
    // soldiers out of the two side doors on the back wall
    if (!def.boss && B.spawned < def.sol && B.sol.filter(s=>!s.dead).length<BASE_PATROL_MAX) {
      B.spawnT -= DT;
      if (B.spawnT <= 0) {
        B.spawnT = 1.5 + rnd() * 1.4; B.spawned++;
        const dropKind=baseSupplyKind(G.stage,def,B.spawned),side=rnd()<.5?-1:1;
        B.sol.push({u:side*BASE_PATROL_LIMIT,z:BASE_PATROL_DEPTH,st:'walk',patrolDir:-side,patrolSpeed:74+rnd()*12,
          t:0,flash:0,anim:0,dropKind,patrolArmed:true,fireT:.7+rnd()*.6,jumpT:.35+rnd()*.65,jumpY:0,jumpV:0,shotFlash:0});
      }
    }
    // Pick the outlet before release so its shutter opens ahead of the mine.
    const quota = def.boss ? 0 : def.rol;
    if (B.rolled < quota) {
      B.rollT -= DT;
      if (B.rollT <= .48 && !B.rollSide) B.rollSide = rnd() < .5 ? -1 : 1;
      if (B.rollT <= 0) {
        B.rol.push({ u0: B.rollSide * 160, ut: aimX() - 192, z: 1, a: 0, spd: def.rolSpd || .42 });
        B.rolled++;
        B.rollT = (def.rolSpd ? 1.8 : 2.4) + rnd() * 1.6;
        B.rollSide = 0;
        sfx.toss();
      }
    }
  }
  if (!frozen) {
    for (const s of B.sol) {
      if (s.dead) continue;
      if(s.patrolArmed)advanceBaseSoldierJump(s,DT,rnd,G.pb);
      s.anim += DT * 8;
      if(s.patrolArmed&&!B.cleared){
        advanceBasePatrol(s,DT);
      }else if (s.st === 'walk') {
        const du = s.tu - s.u, dz = s.tz - s.z;
        if(s.patrolArmed&&Math.abs(du)>.1)s.face=Math.sign(du);
        s.u += Math.sign(du) * Math.min(Math.abs(du), 80 * DT); s.z += Math.sign(dz) * Math.min(Math.abs(dz), 0.3 * DT);
        if (Math.abs(du) < 1 && Math.abs(dz) < 0.01) { s.st = 'aim'; s.t = 0.5; }
      } else if (s.st === 'aim') {
        s.t -= DT;
        if (s.t <= 0) {
          if (!s.patrolArmed&&!p.dead && !B.cleared) { baseShot(bx(s.u, s.z), by(s.z) - (isBase()?BASE_SOLDIER.muzzleHeight*baseSoldierScale(s.z):18*sc(s.z)), aimX(), BASE_FLOOR - 18, 1.2); sfx.eshot(); }
          s.st = 'leave'; s.dir = s.u < 0 ? -1 : 1;
        }
      } else if (s.st === 'leave') {
        if(s.patrolArmed)s.face=s.dir;s.u += s.dir * 120 * DT; if (Math.abs(s.u) > 240) s.dead = true;
      } else if (s.st === 'charge') {
        s.z -= 0.4 * DT; const pu = aimX() - 192;if(s.patrolArmed&&Math.abs(pu-s.u)>.1)s.face=Math.sign(pu-s.u);s.u += Math.sign(pu - s.u) * Math.min(Math.abs(pu - s.u), 45 * DT);
        if (s.z <= -0.02) s.dead = true;
      }
      if(s.patrolArmed&&!B.cleared&&!s.dead){
        const targets=players().filter(q=>!q.dead&&!q.liftSide&&!(q.camoT>0));
        s.fireT-=DT;
        if(s.fireT<=0&&targets.length){
          const muzzle=baseSoldierMuzzle(s,bx(s.u,s.z),by(s.z));
          const target=targets.sort((a,b)=>Math.abs(a.x-muzzle.x)-Math.abs(b.x-muzzle.x))[0];
          baseShot(muzzle.x,muzzle.y,G.decoyT>0?G.decoyX:target.x,target.y-18,1.2);
          G.eb.at(-1).from='base-soldier';s.shotX=muzzle.x;s.shotY=muzzle.y;s.shotFlash=.075;s.fireT=2+rnd()*.8;sfx.eshot();
        }
      }
    }
    for (const r of B.rol) {
      if (r.dead) continue;
      r.z = Math.max(0, r.z - (r.spd || 0.42) * DT); r.a += DT * 12;
      if (G.sweepT > 0 && !r.dead && r.z < 0.45) {
        // magnetic sweeper: the mine goes off early and takes nearby soldiers with it
        const x = bx(r.u0 + (r.ut - r.u0) * (1 - r.z), r.z);
        detonateBaseMine(r); addScore(50);
        for (const s2 of B.sol) if (!s2.dead && Math.abs(s2.z - r.z) < 0.25 && Math.abs(bx(s2.u, s2.z) - x) < 50) killSoldier(s2);
      }
      if (!r.dead && r.z <= 0) detonateBaseMine(r);
    }
    for (const tg of B.targets) if (tg.k === 'rail' && tg.hp > 0) tg.x = tg.cx + Math.sin(G.t * 0.02 * tg.spd + tg.ph) * 84;
    for (const tg of B.targets) {
      if (tg.hp <= 0 || B.cleared || players().every(q=>q.dead) || tg.k === 'core' || tg.k === 'bcore' || tg.k === 'twin' || stageFourFacilityClosed(tg) || G.empT > 0) continue;
      if(G.stage===2&&def.boss==='eye'&&tg.k==='device'){
        if(advanceStageTwoBossDevice(tg,DT,rnd)){
          const living=players().filter(q=>!q.dead&&!q.liftSide),target=living.sort((a,b)=>Math.abs(a.x-(tg.x+tg.w/2))-Math.abs(b.x-(tg.x+tg.w/2)))[0];
          const aim=G.decoyT>0?G.decoyX:target?.x??aimX(),aimY=G.decoyT>0?BASE_FLOOR-18:(target?.y??BASE_FLOOR)-18;
          // Three real muzzle origins, spreading progressively around the aimed center.
          for(const d of [-8,0,8]){baseShot(tg.x+tg.w/2+d,tg.y+tg.h+1,aim+d*5,aimY,1.6);Object.assign(G.eb.at(-1),{from:'boss-turret',turretId:tg.id,muzzle:d});}
          sfx.eshot();
        }
        continue;
      }
      tg.fireT -= DT;
      if (tg.fireT > 0) continue;
      const cx = tg.x + tg.w / 2, cy = tg.y + tg.h / 2;
      if (tg.k === 'sat') { tg.fireT = B.phase2 ? 1.3 : 2.1; for (const d of [-40, 0, 40]) baseShot(cx, cy, aimX() + d, BASE_FLOOR - 18, 1.6); }
      else if (tg.k === 'rail') { tg.fireT = 1.6 + rnd() * 0.8; for (const d of [-24, 24]) baseShot(cx, cy, aimX() + d, BASE_FLOOR - 18, 1.4); }
      else if (tg.k === 'switch') { tg.fireT = 3.2 + rnd(); baseShot(cx, cy, aimX(), BASE_FLOOR - 18, 1.5); }
      else if (tg.k === 'device') { tg.fireT=3.4+rnd();baseShot(cx,cy,aimX(),BASE_FLOOR-18,1.6); }
      else { tg.fireT = (G.stage === 4 ? 1.8 : 2.2) + rnd() * 1.2; baseShot(cx, cy, aimX(), BASE_FLOOR - 18, 1.5); }
      sfx.eshot();
    }
  }
  const bubblePositions=new Map();
  for (const b of G.eb) {
    if (!b.base) continue;
    if(b.bubble&&!b.dead)bubblePositions.set(b,{x:b.x,y:b.y});
    if (!frozen) b.t += DT / b.dur;
    b.x = b.x0 + (b.x1 - b.x0) * b.t+(b.bubble?Math.sin(b.t*7+b.phase)*4*Math.sin(b.t*Math.PI):0); b.y = b.y0 + (b.y1 - b.y0) * b.t; b.r = b.bubble?(b.rx??b.r):b.ring?3.2+Math.min(1,b.t)*3.5:1+Math.min(2,b.t*2);
    if (b.t > 1.2) b.dead = true;
  }
  // player bullets travel down the corridor; soldiers are hit when the bullet reaches their depth
  for (const b of G.pb) {
    if(b.dead)continue;
    const previousT=Math.min(1,b.t),previousX=Number.isFinite(b.x)?b.x:b.x0+(b.xe-b.x0)*previousT,
      previousY=Number.isFinite(b.y)?b.y:b.y0+(b.ye-b.y0)*previousT;
    if(b.lock==='bcore'){const live=B.targets.find(t=>t.mover&&t.hp>0);if(live){b.xe=live.x+live.w/2;b.ye=live.y+live.h/2;}}
    if(b.lock?.startsWith('twin')){const live=B.targets.find(t=>t.k==='twin'&&'twin'+t.id===b.lock&&t.hp>0);if(live){b.xe=live.x+live.w/2;b.ye=live.y+live.h/2;}}
    if(b.lock?.startsWith('gallery')){const live=stageFourGalleryTargets(B).find(t=>'gallery'+t.galleryId===b.lock);if(live){b.xe=live.x+live.w/2;b.ye=live.y+live.h/2;}}
    b.t += DT * b.spd;
    b.x = b.x0 + (b.xe - b.x0) * Math.min(1, b.t); b.y = b.y0 + (b.ye - b.y0) * Math.min(1, b.t);
    // Test relative swept motion in the visible ellipse, so even fast laser shots
    // and a moving bubble cannot pass through one another between frames.
    const bubbleHits=[];
    for(const bubble of G.eb){
      const before=bubblePositions.get(bubble);
      if(!before||bubble.dead)continue;
      const rx=(bubble.rx??bubble.r)+1,ry=(bubble.ry??bubble.r)+1;
      const x0=(previousX-before.x)/rx,y0=(previousY-before.y)/ry;
      const dx=(b.x-bubble.x)/rx-x0,dy=(b.y-bubble.y)/ry-y0,denom=dx*dx+dy*dy;
      const along=denom?Math.max(0,Math.min(1,-(x0*dx+y0*dy)/denom)):0;
      if((x0+dx*along)**2+(y0+dy*along)**2<=1)bubbleHits.push({bubble,along});
    }
    bubbleHits.sort((a,c)=>a.along-c.along);
    for(const {bubble} of bubbleHits){
      bubble.dead=true;
      G.fx.push({k:'baseBubblePop',x:bubble.x,y:bubble.y,rx:bubble.rx??bubble.r,ry:bubble.ry??bubble.r,t:0,life:.3});
      if(!b.hits){b.dead=true;break;}
    }
    if(b.dead)continue;
    if (b.k === 'msl' && (G.t & 1) === 0) G.fx.push({ k: 'smoke', x: b.x, y: b.y + 3, t: 0, life: 0.3 });
    for (const s of B.sol) {
      if (s.dead || (b.hits && b.hits.has(s))) continue;
      if (Math.abs(b.t - s.z) < 0.07 && Math.abs(b.x - bx(s.u, s.z)) < (isBase()?BASE_SOLDIER.halfWidth*baseSoldierScale(s.z):8*sc(s.z)) + 2
        && (!isBase() || (b.y >= by(s.z) - baseSoldierJumpOffset(s) - BASE_SOLDIER.height * baseSoldierScale(s.z) - 2 && b.y <= by(s.z) - baseSoldierJumpOffset(s) + 2))) {
        killSoldier(s); spark(b.x, b.y,{material:'body',vx:b.x-b.x0,vy:b.y-b.y0});
        if (b.hits) b.hits.add(s); else { b.dead = true; break; }
      }
    }
    if (b.dead || b.t < 1) continue;
    b.dead = true;
    const tg = B.targets.find(t2 => t2.hp > 0 && !(t2.k === 'twin' && !t2.solid) && b.xe >= t2.x - 2 && b.xe <= t2.x + t2.w + 2 && baseTargetAtHeight(t2,b.ye));
    const gallery=!tg&&G.stage===4?stageFourGalleryTargets(B).find(t=>b.xe>=t.x&&b.xe<=t.x+t.w&&b.ye>=t.y&&b.ye<=t.y+t.h):null;
    if(gallery){killGallerySoldier(B.gallery.find(s=>s.id===gallery.galleryId));spark(b.xe,b.ye,{material:'body',vx:b.xe-b.x0,vy:b.ye-b.y0});continue;}
    spark(b.xe, b.ye,{material:tg&&stageFourFacilityClosed(tg)?'metal':tg?.k==='core'&&coreShielded()?'shield':tg&&(tg.k==='core'||tg.k==='bcore')?'core':'metal',vx:b.xe-b.x0,vy:b.ye-b.y0,target:tg});
    if (tg) hitTarget(tg, b.dmg);
  }
  for (const g of G.gr) {
    if (!g.base) continue;
    g.t += DT / 0.75; g.a += DT * 14;
    g.x = g.x0 + (g.xe - g.x0) * g.t; g.y = g.y0 + (g.ye - g.y0) * g.t - Math.sin(Math.PI * Math.min(1, g.t)) * 34;
    if (g.t >= 1) { g.dead = true; baseBlast(g.xe, g.ye); }
  }
  for (const it of G.items) {
    if (!it.rest) { it.vy += 500 * DT; it.y += it.vy * DT; if (it.y >= BASE_FLOOR) { it.y = BASE_FLOOR; it.rest = true; } }
  }
  collideBasePlayer();
  withPlayer2(collideBasePlayer);
}
function collideBasePlayer() {
  const p = G.p, B = G.base, frozen = G.freezeT > 0;
  for (const it of G.items) if (!it.dead && !p.dead && it.rest && Math.abs(it.x - p.x) < 11 && p.y > BASE_FLOOR - 24) { it.dead = true;pickItem(it.kind);if(isSiege()&&it.siegeSupply)WukongSiege.claimSupply(G,p,it.siegeSupply,G.inv); }
  // what can hurt the player
  const pb = pBox(p);
  if (p.dead || !pb) return;
  for (const b of G.eb) {
    if (b.dead || !b.base || b.t < 0.86 || b.t > 1.1) continue;
    if(p.prone&&!b.bomb&&!b.explosive)continue;
    const rx=b.bubble?(b.rx??b.r):b.r,ry=b.bubble?(b.ry??b.r):b.r;
    if (overlap(pb, { x: b.x - rx, y: b.y - ry, w: rx * 2, h: ry * 2 })) {
      if (p.shieldT > 0 || riotBlock()) { b.dead = true; spark(b.x, b.y,{material:'shield',vx:b.x1-b.x0,vy:b.y1-b.y0}); continue; }
      if (p.invT > 0) continue;
      b.dead = true; killPlayer(); return;
    }
  }
  if (frozen) return;
  for (const r of B.rol) {
    if (r.dead || r.z > 0.05 || r.z < -0.05) continue;
    const u = r.u0 + (r.ut - r.u0) * (1 - r.z);
    if (overlap(pb, { x: bx(u, r.z) - 4, y: by(r.z) - 7, w: 8, h: 7 })) {
      detonateBaseMine(r);
    }
  }
  for (const blast of G.fx) {
    if (B.cleared || B.dead || blast.k !== 'baseMineBlast' || blast.dead || blast.t > .12 || blast.z > .05 || blast.hitPlayers.includes(p.pid)) continue;
    if (!overlap(pb, { x: blast.x - 13, y: blast.y - 8, w: 26, h: 11 })) continue;
    blast.hitPlayers.push(p.pid);
    if (p.shieldT > 0 || riotBlock()) continue;
    killPlayer(); if (p.dead) return;
  }
  for (const s of B.sol) {
    if (s.dead || s.st !== 'charge' || s.z > 0.08) continue;
    const size=isBase()?baseSoldierScale(s.z):1,half=isBase()?BASE_SOLDIER.halfWidth*size:6,height=isBase()?BASE_SOLDIER.height*size:28;
    if (overlap(pb, { x: bx(s.u, s.z) - half, y: by(s.z) - baseSoldierJumpOffset(s) - height, w: half*2, h: height })) {
      if (p.shieldT > 0 || p.giantT > 0 || riotBlock()) { killSoldier(s); if (p.giantT > 0) giantSmashFX(p.x, p.y); continue; }
      killPlayer(); return;
    }
  }
}
// ----- stage 2 drawing -----
function poly(pts, c) { ctx.fillStyle = typeof c === 'string' ? nes(c) : c; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fill(); }
const FRONT = {};
function frontSprite(frame, flash) {
  const key = frame + (flash ? 'w' : '');
  if (FRONT[key]) return FRONT[key];
  const c = mk(16, 30), save = C; C = c.getContext('2d');
  const P = flash ? PAL_W : PAL_E;
  const lA = frame === 1 ? 3 : 0, lB = frame === 2 ? 3 : 0;
  F(4, 18, 3, 10 - lA, P.pants); F(4, 28 - lA, 3, 2, P.boots); F(9, 18, 3, 10 - lB, P.pants); F(9, 28 - lB, 3, 2, P.boots);
  F(3, 9, 10, 10, P.vest); F(3, 18, 10, 1, P.boots);
  F(2, 10, 2, 6, P.vest); F(12, 10, 2, 6, P.vest); F(4, 14, 8, 2, P.skin);
  F(6, 11, 4, 6, P.gun); F(7, 16, 2, 2, '#000000');
  F(5, 2, 6, 7, P.skin); F(5, 1, 6, 3, P.band); F(4, 2, 1, 2, P.band); F(11, 2, 1, 2, P.band); F(6, 5, 1, 1, '#000000'); F(9, 5, 1, 1, '#000000');
  C = save; FRONT[key] = c; return c;
}
function drawBack(x, y, pose, o) {
  // stage 2: the player seen from behind, aiming into the corridor
  const P = o.flash ? PAL_W : playerPalette(o.pal || PAL_P);
  if (pose === 'spin' || pose === 'dead') return drawSoldier(x, y, pose, { ...o, face: 1, pal: o.pal || PAL_P });
  ctx.save(); ctx.translate(x, y);
  const tails = Math.sin(G.t * 0.25) * 1;
  if (pose === 'prone' || pose === 'dead') {
    rr(-9, -6.2, 18, 5.8, 2.6, P.vest); seg(-6, -1.6, 6, -1.6, 1.3, shade(P.vest, -0.3));
    el(0, -8.2, 3.5, 3.1, P.hair); rr(-3.5, -8.8, 7, 1.5, 0.6, P.band);
    if (pose === 'prone') { seg(-3, -8, 0, -11.5, 2, P.skin); seg(4, -8, 1, -11.5, 2, P.skin); seg(0.5, -9.5, 0.5, -17.5, 2.4, P.gun); }
    ctx.restore(); return;
  }
  const run = pose === 'run', ph = (o.frame || 0) * Math.PI / 2;
  for (const side of [-1, 1]) {
    const lift = run ? Math.max(0, Math.sin(ph + (side > 0 ? Math.PI : 0))) * 3 : 0;
    seg(side * 2.6, -12.4, side * 2.9, -2.2 - lift, 3.6, side < 0 ? shade(P.pants, -0.2) : P.pants);
    rr(side * 2.9 - 2, -2.8 - lift, 4, 2.7, 1, P.boots);
  }
  rr(-6, -25, 12, 13.2, 2.8, P.vest); rr(-6, -25, 4, 13.2, 2.4, shade(P.vest, -0.2));
  seg(0, -23.8, 0, -14.4, 1, shade(P.vest, -0.35));
  rr(-6.2, -13.6, 12.4, 1.9, 0.8, '#3a2a1c');
  el(0, -29.2, 4.1, 4.3, P.hair); el(-1.2, -30.6, 1.6, 1, shade(P.hair, 0.25));
  rr(-4.1, -30.3, 8.2, 1.9, 0.8, P.band);
  seg(-0.5, -29.4, -2.2 + tails, -24.6, 1.2, P.band); seg(0.5, -29.4, 2.3 + tails, -25, 1.2, shade(P.band, -0.2));
  const ax = o.ax || 0;
  if(o.aimUp){
    seg(-5.6,-23.2,-3.4,-36,2.4,shade(P.skin,-.1));seg(-3.4,-36,.5,-42,2.4,P.skin);
    seg(5.6,-23.2,5,-36,2.4,P.skin);seg(5,-36,2,-42,2.4,P.skin);
    seg(1.7,-39,1.7,-51.2,2.6,P.gun);el(1.7,-51.2,.9,.9,shade(P.gun,.45));
  }else{
    seg(-5.6, -23.2, -1.2 + ax, -28, 2.4, shade(P.skin, -0.1)); seg(5.6, -23.2, 2.2 + ax, -28, 2.4, P.skin);
    seg(0.5 + ax, -26, 0.5 + ax * 7, -38, 2.6, P.gun); el(0.5 + ax * 7, -38, 0.9, 0.9, shade(P.gun, 0.45));
  }
  ctx.restore();
}
function drawFront(x, y, s, frame, flash) {
  // stage 2 enemy soldier, front view, scaled by depth
  const P = flash ? PAL_W : PAL_E;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (const side of [-1, 1]) {
    const lift = (frame === 1 && side < 0) || (frame === 2 && side > 0) ? 3 : 0;
    seg(side * 2.5, -12, side * 2.7, -2.2 - lift, 3.4, side > 0 ? shade(P.pants, -0.18) : P.pants);
    rr(side * 2.7 - 2, -2.8 - lift, 4, 2.7, 1, P.boots);
  }
  rr(-5.5, -24.5, 11, 12.8, 2.6, P.vest); rr(1.5, -24.5, 4, 12.8, 2.2, shade(P.vest, -0.18));
  rr(-5.7, -13.4, 11.4, 1.8, 0.8, '#2f2a22');
  seg(-5, -22, -1.5, -16.4, 2.4, shade(P.vest, -0.08)); seg(5, -22, 1.5, -16.4, 2.4, shade(P.vest, -0.25));
  el(0, -15.8, 2.4, 1.7, P.skin); el(0, -15.6, 2.4, 2.4, P.gun); el(0, -15.6, 1.1, 1.1, '#111111');
  el(0, -28, 3.6, 3.8, P.skin);
  el(0, -30, 4.2, 2.7, P.band); rr(-4.4, -29.8, 8.8, 1.3, 0.5, shade(P.band, -0.25));
  el(-1.3, -27.6, 0.55, 0.7, '#111111'); el(1.3, -27.6, 0.55, 0.7, '#111111');
  ctx.restore();
}
function corridorTheme() {
  return G.stage === 4 ? { wall: '#881400', light: '#fca044', floor: '#787878', panel: '#a81000' } : { wall: '#0000bc', light: '#3cbcfc', floor: '#7c7c7c', panel: '#004058' };
}
function drawCorridor(B) {
  const TH = corridorTheme();
  F(0, 0, W, H, '#000000');
  const zs = [0, 1, 2, 3, 4, 5].map(k => ((k / 6) - B.scroll + 1) % 1);
  // ceiling lights
  for (const z of zs) { const s2 = sc(z); F(Math.round(192 - 34 * s2), Math.round(40 * z) + 2, Math.round(68 * s2), 1, TH.light); }
  // side walls
  poly([[0, 0], [96, 40], [96, 140], [0, BASE_FLOOR]], TH.wall);
  poly([[384, 0], [288, 40], [288, 140], [384, BASE_FLOOR]], TH.wall);
  for (const z of zs) {
    const xl = Math.round(96 * z), xr = 383 - xl, y0 = Math.round(40 * z), y1 = Math.round(by(z)), mid = (y0 + y1) >> 1;
    F(xl, y0, 1, y1 - y0, '#000000'); F(xr, y0, 1, y1 - y0, '#000000');
    F(xl + 3, mid - 4, 2, 8, TH.light); F(xr - 4, mid - 4, 2, 8, TH.light);
  }
  // floor with converging grid
  poly([[0, BASE_FLOOR], [96, 140], [288, 140], [384, BASE_FLOOR]], TH.floor); F(0, BASE_FLOOR, W, H - BASE_FLOOR, TH.floor);
  for (let f = -192; f <= 192; f += 48) pline(192 + f, BASE_FLOOR, Math.round(192 + f * 0.5), 140, '#000000');
  for (const z of zs) { const y = Math.round(by(z)); F(Math.round(96 * z), y, Math.round(384 - 192 * z), 1, '#000000'); if (y + 1 < H) F(Math.round(96 * z), y + 1, Math.round(384 - 192 * z), 1, '#bcbcbc'); }
  F(0, BASE_FLOOR, W, 1, '#000000');
}
function drawBackWall(B) {
  F(96, 40, 192, 100, '#7c7c7c');
  F(96, 40, 192, 18, '#000000');
  for (let i = 0; i < 8; i++) F(104 + i * 24, 47, 8, 4, ((G.t >> 4) + i) % 3 ? '#a81000' : '#f8b800');
  for (let x = 96; x < 288; x += 32) { F(x, 58, 1, 54, '#000000'); F(x + 1, 58, 1, 54, '#bcbcbc'); }
  F(96, 84, 192, 1, '#000000'); F(96, 85, 192, 1, '#bcbcbc');
  F(96, 112, 192, 28, '#000000'); F(96, 112, 192, 1, '#bcbcbc');
  const TH = corridorTheme();
  for (const dx of [104, 264]) { F(dx, 114, 16, 26, TH.panel); F(dx, 114, 16, 1, TH.light); F(dx + 7, 114, 2, 26, '#000000'); }
  if (G.stage === 4 && (G.t >> 5) % 2) for (let i = 0; i < 8; i++) F(104 + i * 24, 47, 8, 4, '#f83800'); // alert strobe
  if (B.def.boss === 'eye') { F(160, 90, 64, 52, '#a81000'); F(162, 92, 60, 48, '#000000'); }
  if (B.def.boss === 'twin') for (const px of [128, 192, 256]) { F(px - 10, 58, 20, 6, '#7c7c7c'); F(px - 6, 64, 12, 3, '#3cbcfc'); }
  if (!B.def.boss) F(96, 119, 192, 1, '#4b4f5c'); // rail track
  for (const tg of B.targets) drawTarget(tg, B);
}
function drawTarget(tg, B) {
  const fl = tg.flash > 0, t = G.t;
  if (tg.hp <= 0) { if (!['core','bcore','twin','rail'].includes(tg.k)) { F(tg.x + 2, tg.y + tg.h - 4, tg.w - 4, 4, '#503000'); F(tg.x + 4, tg.y + tg.h - 6, 3, 2, '#7c7c7c'); } return; }
  if (tg.k === 'rail') {
    rr(tg.x, tg.y, tg.w, tg.h, 3, fl ? '#ffffff' : '#c46a2a'); rr(tg.x + 2, tg.y + 2, tg.w - 4, tg.h - 4, 2, fl ? '#ffffff' : '#7a3a14');
    el(tg.x + tg.w / 2, tg.y + tg.h / 2, 3.4, 3.4, '#1a1010'); el(tg.x + tg.w / 2, tg.y + tg.h / 2, 1.6, 1.6, (t >> 3) % 2 ? '#ff5a2a' : '#ffb03a');
    rr(tg.x + 3, tg.y - 2, 4, 2, 0.6, '#3a3a3a'); rr(tg.x + tg.w - 7, tg.y - 2, 4, 2, 0.6, '#3a3a3a');
    if (G.freezeT > 0) ice(tg);
    return;
  }
  if (tg.k === 'twin') {
    const cx = tg.x + tg.w / 2, cy = tg.y + tg.h / 2, solid = tg.solid;
    ctx.save();
    // projector beam from the ceiling emitter
    ctx.globalAlpha = solid ? 0.18 : 0.1; ctx.fillStyle = solid ? '#ffb03a' : '#3cbcfc';
    ctx.beginPath(); ctx.moveTo(cx - 6, 64); ctx.lineTo(cx + 6, 64); ctx.lineTo(cx + 20, cy + 10); ctx.lineTo(cx - 20, cy + 10); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = solid ? 1 : 0.38 + 0.12 * Math.sin(t * 0.4);
    if (tg.warp > 0) ctx.globalAlpha *= 0.4 + 0.6 * ((t >> 1) % 2);
    // hexagonal mask with two eyes
    const face = fl ? '#ffffff' : solid ? (B.phase2 ? '#e8401c' : '#d8682a') : '#5ad8ff';
    ctx.fillStyle = face; ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(cx + Math.cos(a) * 19, cy + Math.sin(a) * 19); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = solid ? '#3a0c04' : '#c8f4ff'; ctx.lineWidth = 1; ctx.stroke();
    const eye = solid ? '#fff2b0' : '#ffffff', look = Math.max(-3, Math.min(3, (aimX() - cx) / 40));
    el(cx - 7, cy - 3, 4.4, 2.6, '#140808'); el(cx + 7, cy - 3, 4.4, 2.6, '#140808');
    el(cx - 7 + look, cy - 3, 1.6, 1.6, eye); el(cx + 7 + look, cy - 3, 1.6, 1.6, eye);
    rr(cx - 8, cy + 7, 16, 2.4, 1, '#140808');
    if (!solid) { ctx.strokeStyle = 'rgba(200,245,255,0.6)'; ctx.lineWidth = 0.5; ctx.beginPath(); for (let yy = tg.y; yy < tg.y + tg.h; yy += 3) { ctx.moveTo(tg.x, yy + ((t >> 1) % 3)); ctx.lineTo(tg.x + tg.w, yy + ((t >> 1) % 3)); } ctx.stroke(); }
    ctx.restore();
    if (G.freezeT > 0 && solid) ice(tg);
    return;
  }
  if (tg.k === 'gun' || tg.k === 'sat' || tg.k === 'switch') {
    F(tg.x, tg.y, tg.w, tg.h, fl ? '#fcfcfc' : '#bcbcbc'); F(tg.x + 1, tg.y + 1, tg.w - 2, tg.h - 2, fl ? '#fcfcfc' : '#7c7c7c');
    F(tg.x + 4, tg.y + 4, tg.w - 8, 6, '#000000');
    F(tg.x + tg.w / 2 - 1, tg.y + 6, 3, 2, (t >> 3) % 2 ? '#f83800' : '#a81000');
    if (tg.k === 'sat') { F(tg.x, tg.y, tg.w, 1, '#f8b800'); F(tg.x, tg.y + tg.h - 1, tg.w, 1, '#f8b800'); }
  } else if (tg.k === 'core') {
    F(tg.x, tg.y, tg.w, tg.h, fl ? '#fcfcfc' : '#bcbcbc'); F(tg.x + 2, tg.y + 2, tg.w - 4, tg.h - 4, '#000000');
    disc(ctx, tg.x + tg.w / 2, tg.y + tg.h / 2, 7, fl ? '#fcfcfc' : '#f83800');
    disc(ctx, tg.x + tg.w / 2, tg.y + tg.h / 2, 3 + ((t >> 4) % 2), fl ? '#fcfcfc' : '#f8b800');
    if (coreShielded()) for (let yy = tg.y + 3; yy < tg.y + tg.h - 2; yy += 3) { F(tg.x + 2, yy, tg.w - 4, 2, '#7c7c7c'); F(tg.x + 2, yy, tg.w - 4, 1, '#bcbcbc'); }
  } else {
    // boss: a big eye that follows the player
    const cx = tg.x + tg.w / 2, cy = tg.y + tg.h / 2, look = Math.max(-6, Math.min(6, (G.p.x - 192) / 24));
    disc(ctx, cx, cy, 18, fl ? '#fcfcfc' : '#bcbcbc');
    disc(ctx, cx, cy, 16, fl ? '#fcfcfc' : (B.phase2 ? '#f83800' : '#e45c10'));
    disc(ctx, cx + look, cy, 9, fl ? '#fcfcfc' : '#f8b800');
    disc(ctx, cx + look, cy, 4, '#000000');
    F(cx + look - 2, cy - 3, 2, 2, '#fcfcfc');
    if (B.phase2) for (let i = 0; i < 4; i++) pline(cx - 14 + i * 8, cy - 14, cx - 10 + i * 8, cy - 6, '#000000');
  }
  if (G.freezeT > 0) ice(tg);
  if (G.empT > 0) { dither(tg, '#3cbcfc'); if (rnd() < 0.06) spark(tg.x + rnd() * tg.w, tg.y + rnd() * tg.h); }
}
function drawBarrier() {
  // fully static beams (nothing moves along them, so they never read as bullets); only the post lights blink slowly
  const z = 0.3, xl = Math.round(96 * z), xr = 383 - xl, fy = Math.round(by(z)), s2 = sc(z), t = G.t;
  F(xl, 150, 4, fy - 150, '#bcbcbc'); F(xr - 3, 150, 4, fy - 150, '#bcbcbc');
  const cap = (t >> 5) % 2 ? '#f83800' : '#a81000';
  F(xl, 148, 4, 3, cap); F(xr - 3, 148, 4, 3, cap);
  const x0 = xl + 4, span = xr - 3 - x0;
  for (const hh of [8, 20, 32]) {
    const y = Math.round(fy - hh * s2);
    F(x0, y, span, 1, '#881400');
    for (let x = x0 + 8; x < x0 + span - 4; x += 16) { F(x, y - 1, 3, 1, '#881400'); F(x + 3, y + 1, 3, 1, '#881400'); }
  }
}
function renderBase() {
  const B = G.base, p = G.p;
  const sx = G.shake > 0 ? Math.round((rnd() - 0.5) * G.shake * 2) : 0, sy = G.shake > 0 ? Math.round((rnd() - 0.5) * G.shake * 2) : 0;
  C = ctx; setT(sx, sy);
  drawCorridor(B);
  drawBackWall(B);
  const things = [];
  for (const s of B.sol) if (!s.dead && B.trans<=0 && !B.dead) things.push({ z: s.z, draw: () => {
    const s2 = sc(s.z), w = 16 * s2, h = 30 * s2, x = bx(s.u, s.z), y = by(s.z);
    drawFront(x, y, s2, s.st === 'aim' ? 0 : 1 + (Math.floor(s.anim) % 2), s.flash > 0);
    if (G.freezeT > 0) ice({ x: x - w / 2, y: y - h, w, h });
  } });
  for (const r of B.rol) if (!r.dead && B.trans<=0 && !B.dead) things.push({ z: r.z, draw: () => {
    const u = r.u0 + (r.ut - r.u0) * (1 - r.z), x = bx(u, r.z), y = by(r.z), rr = Math.max(2, Math.round((r.spd > 0.5 ? 5 : 4) * sc(r.z)));
    if (r.spd > 0.5) for (let i = 0; i < 6; i++) { const a = r.a + i * Math.PI / 3; seg(x, y - rr, x + Math.cos(a) * (rr + 1.6), y - rr + Math.sin(a) * (rr + 1.6), 0.9, '#bcbcbc'); }
    disc(ctx, x, y - rr, rr, '#7c7c7c'); F(x + Math.cos(r.a) * (rr - 1), y - rr + Math.sin(r.a) * (rr - 1), 1, 1, '#fcfcfc'); F(x - 1, y - rr * 2 - 1, 2, 1, (G.t >> 2) % 2 ? '#f83800' : '#f8b800');
  } });
  things.sort((a, b) => b.z - a.z);
  for (const th of things) if (th.z >= 0.3) th.draw();
  if (!B.cleared && !B.def.boss && !B.dead) drawBarrier();
  for (const th of things) if (th.z < 0.3) th.draw();
  if(B.trans<=0&&!(G.stage===2&&B.dead)){
    for (const b of G.eb) if (b.base && !b.dead) { glow(b.x, b.y, b.r + 2, 'rgba(255,90,150,0.9)', 'rgba(255,60,120,0)'); el(b.x, b.y, b.r * 0.7, b.r * 0.7, '#ffffff'); }
    for (const b of G.pb) {
      const k = Math.min(1, b.t), r = Math.max(1, Math.round(2.4 * (1 - 0.6 * k)));
      if (b.k === 'laser') { const t0 = Math.max(0, b.t - 0.18); pline(Math.round(b.x0 + (b.xe - b.x0) * t0), Math.round(b.y0 + (b.ye - b.y0) * t0), Math.round(b.x), Math.round(b.y), '#3cbcfc'); F(b.x - 1, b.y - 1, 2, 2, '#fcfcfc'); }
      else if (b.k === 'fire') { const wob = Math.sin(b.t * 30) * 5 * (1 - k); disc(ctx, b.x + wob, b.y, r + 1, '#e45c10'); disc(ctx, b.x + wob, b.y, Math.max(1, r - 1), '#fce0a8'); }
      else if (b.k === 'msl') { F(b.x - 1, b.y - 3, 2, 4, '#fcfcfc'); F(b.x - 1, b.y + 1, 2, 2, (G.t >> 1) % 2 ? '#f8b800' : '#f83800'); }
      else if (b.k === 'sp') { glow(b.x, b.y, r + 2, 'rgba(255,170,80,0.9)', 'rgba(255,90,30,0)'); el(b.x, b.y, r * 0.6, r * 0.6, '#fff2c0'); }
      else { glow(b.x, b.y, r + 1.6, 'rgba(255,230,140,0.85)', 'rgba(255,200,80,0)'); el(b.x, b.y, r * 0.5, r * 0.5, '#ffffff'); }
    }
    for (const g of G.gr) if (g.base) { F(g.x - 2, g.y - 2, 5, 5, '#887000'); F(g.x - 2, g.y - 2, 5, 1, '#d8f878'); }
  }
  for (const it of G.items) drawBadge(Math.round(it.x) - 6, Math.round(it.y) - 10, it.kind, (G.t >> 3) % 2);
  if (G.decoyT > 0) {
    // the hologram decoy: a flickering cyan copy of the player
    ctx.save(); ctx.globalAlpha = 0.45 + 0.2 * Math.sin(G.t * 0.5); drawBack(G.decoyX, BASE_FLOOR, 'stand', { frame: 0, ax: 0, flash: true });
    ctx.globalAlpha = 0.35; rr(G.decoyX - 7, BASE_FLOOR - 33, 14, 33, 3, '#3cbcfc'); ctx.restore();
  }
  if (!(p.invT > 0 && !p.dead && (G.t >> 2) % 2 === 0)) {
    const pose = p.dead ? 'dead' : p.spin ? 'spin' : p.prone ? 'prone' : (p.vx || B.trans > 0) ? 'run' : 'stand';
    const o = { frame: p.anim, ax: p.aimDx || 0,aimUp:!!p.aimUp };
    if (G.sweepT > 0 && !p.dead) { ctx.save(); ctx.globalAlpha = 0.35 + 0.25 * Math.sin(G.t * 0.3); ctx.strokeStyle = '#3cbcfc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y - 2, 26 + (G.t % 20) * 0.6, 6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (p.riot > 0 && !p.dead) {
      // riot shield held out in front of the player (further into the screen, so drawn first)
      const g = p.giantT > 0 ? 2 : 1, sx = Math.round(p.x - 11 * g), sy = Math.round(p.y - 32 * g);
      F(sx, sy, 22 * g, 24 * g, '#bcbcbc'); F(sx + 1, sy + 1, 22 * g - 2, 24 * g - 2, '#7c7c7c');
      F(sx + 3, sy + 4 * g, 22 * g - 6, 2, '#000000');
      for (let i = 0; i < p.riot; i++) F(sx + 3 + i * 4, sy + 2, 3, 1, '#58d854');
    }
    if (p.giantT > 0 && !p.dead) { const rx = Math.round(p.x), ry = Math.round(p.y); ctx.save(); ctx.translate(rx, ry); ctx.scale(2, 2); ctx.translate(-rx, -ry); drawBack(rx, ry, pose, o); ctx.restore(); }
    else drawBack(p.x, p.y, pose, o);
    if (p.shieldT > 0 && !p.dead && !p.liftSide && (p.shieldT > 2 || (G.t >> 2) % 2)) { const b = pBox(p); ctx.strokeStyle = (G.t >> 2) % 2 ? '#00fcfc' : '#fcfcfc'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(b.x) - 3.5, Math.round(b.y) - 3.5, b.w + 7, b.h + 7); }
    if (p.flashT > 0 && !p.dead && B.trans<=0 && !(G.stage===2&&B.dead)) { F(p.fx - 2, p.fy - 2, 5, 5, '#fce0a8'); F(p.fx - 1, p.fy - 1, 3, 3, '#fcfcfc'); }
  }
  drawCoopPartner(true);
  drawFx();
  setT();
  if (B.cleared && !B.def.boss && B.trans <= 0 && (G.t >> 4) % 2 === 0) {
    drawText('按上 前进', W / 2, 160, '#fcfcfc', 'center', 12);
    for (let i = 0; i < 5; i++) F(W / 2 - i, 150 + i, i * 2 + 1, 1, '#f8b800');
  }
}

// =====================================================================
// STAGE 3 · 峡谷瀑布: reference waterfall, flame bridges and alien gate
// =====================================================================
function initStage3() {
  G.en=[];G.pods=[];G.items=[];G.camX=G.camY=0;G.spawnT=9999;
  const wallRocks=createStageThreeWallRocks(solids,rnd);G.en.push(...wallRocks);
  // Armed hovercraft occupy the open waterfall channels between rock shelves.
  for(const [i,[x,y]] of [[218,160],[65,40],[307,-38],[70,-140],[310,-225],[70,-325],[190,-414],[70,-550],[310,-620],[182,-702],[315,-855],[190,-940],[80,-1055]].entries())
    G.en.push({t:'waterAmbush',x,y,hp:1,fireT:1.4+(i%3)*.55,warning:0,shotFlash:0,flash:0});
  for(const [x,y]of STAGE_THREE_SNIPERS)G.en.push({t:'snp',x,y,hp:1,fireT:2.6+rnd(),face:-1,ax:-1,ay:0,flash:0});
  for(const [x,y]of STAGE_THREE_TURRETS)G.en.push({t:'tur',x,y,hp:5,idx:x<192?0:6,rotT:0,fireT:2.8+rnd(),flash:0});
  STAGE_THREE_BOXES.forEach(([x,y,item],i)=>G.en.push({t:'box',x,y,hp:3,item,open:false,st:.9+i*.25,flash:0}));
  G.podTrig=STAGE_THREE_PODS.map(trigger=>({...trigger,done:false}));
  G.s3={rockT:2.8,rockSlots:stageThreeRockSlots(wallRocks),runT:5.5,bridgeWarned:false,stoneWarned:false};
  G.mech=makeWaterfallBoss();
  Object.assign(G.p,{x:54,y:STAGE_THREE.bottom,onGround:true,support:solids.find(s=>s.id==='cliff-0')});
  banner('沿岩台向上攀登 · 小心落石',2.4);
}
function hitMech(part,damage) {
  const boss=G.mech;
  if(!boss.active||boss.dead||!waterfallTargetVulnerable(part,boss))return;
  part.hp=Math.max(0,part.hp-damage);part.flash=.07;sfx.hit();
  if(part.hp>0)return;
  boom(part.x+part.w/2,part.y+part.h/2,15);sfx.big();shake(3);
  if(part.k!=='core'){
    for(const joint of waterfallArmPose(part.k==='armL'?-1:1,boss.age,STAGE_THREE.top).points.slice(1))boom(joint.x,joint.y,7);
    addScore(2000);
    if(!waterfallNodesAlive(boss)){boss.age=0;boss.fireT=.9;banner('链臂已摧毁 · 瞄准张开的嘴',3);}
    return;
  }
  boss.dead=true;boss.deadT=2.1;boss.open=false;addScore(15000);
  for(const node of boss.parts)node.hp=0;
  for(const enemy of G.en)if(!enemy.dead){enemy.dead=true;boom(enemy.x,enemy.y-10,6);}
  G.eb.length=0;G.pb.length=0;G.pods.length=0;G.podTrig.forEach(trigger=>trigger.done=true);
  Music.stop();banner('门卫已摧毁 · 通道正在打开',2.2);
}
function waterfallFire(x,y,speed=88) {
  const aim=aimAtPlayer(x,y),bullet=ebullet(x,y,Math.cos(aim)*speed,Math.sin(aim)*speed,0,5);
  Object.assign(bullet,{waterfallFire:true,age:0,cx:x,cy:y,seed:rnd()*Math.PI*2});sfx.eshot();
}
function updateStage3() {
  const boss=G.mech,S=G.s3;
  for(const part of boss.parts)part.flash=Math.max(0,part.flash-DT);
  if(!boss.active&&players().some(p=>!p.dead&&p.onGround&&p.y<=STAGE_THREE.summit+1)){
    boss.active=true;boss.age=0;banner('警告 · 异形门卫 · 先击破两只红色手爪',3);
    updateWaterfallArms(boss,STAGE_THREE.top);
    for(const enemy of G.en)if(enemy.t==='rock'||enemy.t==='run'||enemy.t==='waterAmbush')enemy.dead=true;
    Music.sync();
  }
  if(boss.dead){
    if(boss.deadT>0){
      boss.deadT=Math.max(0,boss.deadT-DT);
      if(rnd()<.22){boom(155+rnd()*74,TOP_Y+30+rnd()*115,7+rnd()*7);if(rnd()<.3)sfx.boom();}
      shake(1.3);
    }
    if(boss.deadT<=0&&!boss.exitOpen){boss.exitOpen=true;banner('洞口已打开 · 走入中间通道',3.5);sfx.pick();}
    if(boss.exitOpen){
      for(const actor of players())if(canEnterSummit(actor,boss))beginSummitEntry(actor);
      if(teamInsideSummit(players(),G.lives))stageClear();
    }
    return;
  }
  if(G.freezeT>0)return;
  if(boss.active){boss.age+=DT;updateWaterfallArms(boss,STAGE_THREE.top);boss.open=waterfallMouthOpen(boss);}
  const flames=flameJetBoxes(G.time);
  const hazards=()=>{
    const actor=G.p,box=pBox(actor);if(actor.dead||!box||actor.summitEntry)return;
    if(flames.some(f=>overlap(box,f))){killPlayer();return;}
    // The static body/core is a bullet target, never a contact hazard.
    if(boss.active&&waterfallArmBoxes(boss,STAGE_THREE.top).some(part=>overlap(box,part)))killPlayer();
  };
  hazards();withPlayer2(hazards);
  if(!boss.active){
    advanceStageThreeRockSlots(S.rockSlots||[],G.en,DT);
    if(!S.bridgeWarned&&G.camY<-330){S.bridgeWarned=true;banner('喷火桥 · 等火焰熄灭或跳过火柱',2.5);}
    if(!S.stoneWarned&&G.camY<STAGE_THREE.stoneLine+110){S.stoneWarned=true;banner('接近山顶 · 沿灰岩台继续攀登',2.2);}
    S.rockT-=DT;
    if(S.rockT<=0){
      S.rockT=3.6+rnd()*1.6;
      // Trigger only a rock already visible in a cliff face, above a player.
      if(G.camY>STAGE_THREE.stoneLine-40&&G.en.filter(e=>e.t==='rock'&&!e.dead&&(e.phase==='warning'||e.phase==='fall')).length<2){
        const rock=selectStageThreeWallRock(G.en,players(),G.camY,rnd);
        if(rock){rock.phase='warning';rock.warnT=WALL_ROCK_WARNING;tone(150,.18,'sawtooth',.035,90);}
      }
    }
    S.runT-=DT;
    if(S.runT<=0){
      S.runT=5+rnd()*2;
      // Reinforcements walk in from beyond a connected screen edge, never materialize on an island.
      const ledges=solids.filter(s=>s.cliff&&!s.summit&&s.w>=100&&(s.x<=0||s.x+s.w>=W)&&s.y>G.camY+48&&s.y<G.camY+115);
      if(ledges.length&&G.en.filter(e=>e.t==='run'&&!e.dead).length<3){
        const s=ledges[Math.floor(rnd()*ledges.length)],left=s.x<=0;
        G.en.push(Object.assign(runner(left?-28:W+28,s.y,left?1:-1),{waterfallEntry:{ledge:s.id,y:s.y},on:true}));
      }
    }
    return;
  }
  for(const node of boss.parts.slice(0,2))if(node.hp>0){
    node.fireT-=DT;
    if(node.fireT<=0){node.fireT=2.7;waterfallFire(node.x+node.w/2,node.y+node.h/2,78);}
  }
  if(boss.open){boss.fireT-=DT;if(boss.fireT<=0){boss.fireT=1.45;const mouth=boss.parts[2];waterfallFire(mouth.x+mouth.w/2,mouth.y+mouth.h,98);}}
}
function drawRock(e) {
  const fl = e.flash > 0, cx2 = e.x, cy2 = e.y - e.r;
  ctx.save(); ctx.translate(cx2, cy2); ctx.rotate(e.rot);
  el(0, 0, e.r * 1.05, e.r * 0.92, fl ? '#ffffff' : '#6b5d52');
  el(-e.r * 0.3, -e.r * 0.3, e.r * 0.55, e.r * 0.38, fl ? '#ffffff' : '#9a8a7c');
  seg(-e.r * 0.2, e.r * 0.1, e.r * 0.5, e.r * 0.5, 0.6, '#3e342d');
  ctx.restore();
}

// =====================================================================
// STAGE 5 · 极地冰原: side-scrolling snowfield. Ice keeps you sliding, blizzards come in waves and
// white out everything but a small pocket around you, and a heavy tracked tank guards the end.
// =====================================================================
const PAL_S = { skin: '#e8c4a4', hair: '#eef3f7', band: '#9fb0c0', vest: '#e4ebf1', pants: '#aebdcb', boots: '#3e4954', gun: '#4d555e' };
const EPAL = () => G.stage === 5 ? PAL_S : G.stage === 6 ? PAL_F : G.stage === 7 ? PAL_H : PAL_E;
function initStage5() {
  G.en = []; G.pods = []; G.items = []; G.camX = 0; G.camY = 0;
  for (const [x, y] of SNIPERS5) G.en.push({ t: 'snp', x, y, hp: 1, fireT: 1 + rnd(), face: -1, ax: -1, ay: 0, flash: 0 });
  BOXES5.forEach(([x, item], i) => G.en.push({ t: 'box', x, y: 176, hp: 4, item, open: false, st: 0.8 + i * 0.35, flash: 0 }));
  for (const [x, y] of TURRETS5) G.en.push({ t: 'tur', x, y: y - 16, hp: 6, idx: 6, rotT: 0, fireT: 0.9, flash: 0 });
  G.en.push(...createSnowDefenders());
  G.podTrig = PODS5.map(t => ({ ...t, done: false }));
  G.s5 = { phase: 'calm', t: 7, bliz: 0, wind: 0 };
  banner('大雪封锁 · 小心林间手雷与炮击',2.4);
  G.fortress=createFlyingFortress();
  const x = STAGE_FIVE_ROUTE.tankHome;
  G.tank = { x, home: x, active: false, dead: false, deadT: 0, phase2: false, mode: 'idle', modeT: 3, tread: 0, burst: 0, burstT: 0, mgT: 1.8, canT: 2.6, spawnT: 3, parts: [
    { tank: 1, k: 'mg', ox: -8, oy: 146, w: 22, h: 14, hp: 20, max: 20, flash: 0 },
    { tank: 1, k: 'cannon', ox: -2, oy: 106, w: 34, h: 12, hp: 24, max: 24, flash: 0 },
    { tank: 1, k: 'core', ox: 52, oy: 102, w: 54, h: 32, hp: 70, max: 70, flash: 0 },
  ] };
  placeTank();
}
function hitFlyingFortress(pt,dmg){
  const F=G.fortress;if(!F?.active||F.dead||F.entryT>0||pt.hp<=0)return;
  pt.hp-=dmg||1;pt.flash=.09;sfx.hit();
  if(pt.hp>0)return;boom(pt.x+pt.w/2,pt.y+pt.h/2,16);sfx.big();shake(3);
  if(pt.k==='core'){F.dead=true;F.deadT=3;G.eb.length=0;G.en=[];G.podTrig.forEach(t=>t.done=true);addScore(25000);Music.stop();banner('空中堡垒摧毁 · 冰原突破',2.6);}
  else addScore(3000);
}
function placeTank() { const T = G.tank; for (const pt of T.parts) { pt.x = T.x + pt.ox; pt.y = pt.oy; } }
const tankHull = T => ({ x: T.x + 2, y: 134, w: 150, h: 42 });
function inTank(x, y) { const T = G.tank; return !!T && !T.dead && x >= T.x + 2 && x <= T.x + 152 && y >= 136 && y <= 176; }
function hitTank(pt, dmg) {
  const T = G.tank;
  if (pt.hp <= 0 || T.dead) return;
  pt.hp -= dmg || 1; pt.flash = 0.06; sfx.hit();
  if (pt.k === 'core' && !T.phase2 && pt.hp <= pt.max / 2) { T.phase2 = true; T.mode = 'idle'; T.modeT = 0.8; banner('战车暴走 · 小心冲撞', 1.6); }
  if (pt.hp > 0) return;
  boom(pt.x + pt.w / 2, pt.y + pt.h / 2, 18); sfx.big(); shake(4);
  if (pt.k === 'core') {
    T.dead = true; T.deadT = 3.2; addScore(15000);
    for (const e of G.en) if (!e.dead&&e.x>=G.camX-40&&e.x<=T.home+170) { e.dead = true; boom(e.x, e.y - 10, 6); }
    G.eb.length = 0; banner('战车摧毁 · 继续向基地前进', 3);
  } else addScore(2000);
}
function updateStage5() {
  const p = G.p, S = G.s5, T = G.tank, F=G.fortress;
  // blizzard waves: calm, then a storm that whites out the screen and pushes you back
  S.t -= DT;
  if (S.t <= 0) {
    if (S.phase === 'calm') { S.phase = 'storm'; S.t = 7; banner('暴风雪来袭 · 能见度下降', 1.6); noise(1.6, 0.12, 700); }
    else { S.phase = 'calm'; S.t = 8 + rnd() * 3; }
  }
  const goal = S.phase === 'storm' ? (T.active ? 0.7 : 1) : 0;
  S.bliz += (goal - S.bliz) * Math.min(1, DT * 0.9);
  if (S.bliz < 0.004) S.bliz = 0;
  S.wind = -30 * S.bliz;
  if (S.phase === 'storm' && G.t % 50 === 0) noise(1.2, 0.05 * S.bliz + 0.001, 500);
  // The tank guards the midpoint. The flying fortress alone clears the stage.
  if(T.dead){
    if(T.deadT>0){T.deadT=Math.max(0,T.deadT-DT);if(G.t%9===0)boom(T.x+rnd()*150,108+rnd()*66,12);}
    if(!F.active&&G.camX>=STAGE_FIVE_ROUTE.arena-.5){F.active=true;G.eb.length=0;G.en=G.en.filter(e=>e.t==='box');G.podTrig.forEach(t=>t.done=true);G.spawnT=9999;banner('警告 · 空中堡垒',2.4);}
    if(F.dead){F.deadT-=DT;if(G.t%8===0){boom(F.x+(rnd()-.5)*120,F.y+(rnd()-.5)*50,14);shake(2);}if(F.deadT<=0)stageClear();return;}
    for(const shot of advanceFlyingFortress(F,p,DT,{frozen:G.freezeT>0})){const {vx,vy,g,r,...shape}=shot;Object.assign(ebullet(shot.x,shot.y,vx,vy,g,r),shape);}
    const escorts=advanceFortressEscorts(F,stageOneTarget(F.x),DT,G.en,{frozen:G.freezeT>0});
    if(escorts.length){G.en.push(...escorts);sfx.eshot();}
    return;
  }
  // the tank
  for (const pt of T.parts) if (pt.flash > 0) pt.flash -= DT;
  if (!T.dead && G.t % 10 === 0 && onScreen(T.x + 146, 10)) G.fx.push({ k: 'smoke', x: T.x + 147, y: 131, t: 0, life: 0.9 });
  if (!T.active && G.camX >= STAGE_FIVE_ROUTE.tankCamera - 0.5) { T.active = true; banner('警告 · 重装履带战车', 2.2); Music.start(true, -2); }
  if (!T.active || G.freezeT > 0) return;
  const [mg, can] = T.parts;
  // phase 2: it rams forward, holds, then backs up to its spot; soldiers come in from the left
  let moving = 0;
  if (T.phase2) {
    T.modeT -= DT;
    if (T.mode === 'idle' && T.modeT <= 0) { T.mode = 'fwd'; sfx.wreck(); }
    else if (T.mode === 'fwd') { T.x -= 80 * DT; moving = -1; if (T.x <= T.home - 110) { T.x = T.home - 110; T.mode = 'hold'; T.modeT = 0.7; shake(2); } }
    else if (T.mode === 'hold' && T.modeT <= 0) T.mode = 'back';
    else if (T.mode === 'back') { T.x += 45 * DT; moving = 1; if (T.x >= T.home) { T.x = T.home; T.mode = 'idle'; T.modeT = 2.6 + rnd(); } }
    T.spawnT -= DT;
    if (T.spawnT <= 0) { T.spawnT = 3.4; if (G.en.filter(e => e.t === 'run').length < 2) { const s2 = groundAt(G.camX + 8); if (s2) G.en.push(runner(G.camX - 8, s2.y, 1)); } }
  }
  if (moving) { T.tread += moving * 80 * DT; if (G.t % 4 === 0) G.fx.push({ k: 'puff', x: T.x + (moving < 0 ? 6 : 150), y: 175, vx: moving * 30, vy: -14, t: 0, life: 0.35 }); }
  placeTank();
  if (p.dead) return;
  const pb = pBox(p);
  if (pb && moving < 0 && overlap(pb, tankHull(T))) killPlayer();
  if (!p.dead && p.x > xMax(p.ride === 'heli' ? 22 : 10)) p.x = Math.max(G.camX + 6, xMax(p.ride === 'heli' ? 22 : 10));
  if (p.dead) return;
  // front machine gun: chest-high bursts (go prone); main cannon: shells lobbed at you
  if (mg.hp > 0) {
    if (T.burst > 0) { T.burstT -= DT; if (T.burstT <= 0) { T.burst--; T.burstT = 0.13; ebullet(mg.x - 2, 153, -165, 0); sfx.eshot(); spark(mg.x - 1, 153); } }
    else { T.mgT -= DT; if (T.mgT <= 0) { T.mgT = T.phase2 ? 1.7 : 2.3; T.burst = T.phase2 ? 5 : 3; T.burstT = 0; } }
  }
  if (can.hp > 0) {
    T.canT -= DT;
    if (T.canT <= 0) {
      T.canT = T.phase2 ? 2.0 : 2.8;
      const tx = can.x + 1, ty = 112, fl = 1.15, gv = 320;
      for (const off of (T.phase2 ? [0, -48] : [0])) ebullet(tx, ty, (p.x + off - tx) / fl, ((p.y - 8) - ty - 0.5 * gv * fl * fl) / fl, gv, 3);
      boom(tx - 2, ty, 5); sfx.boom(); shake(1);
    }
  }
}
function shape(pts, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fill(); }
function snowCap(x, y, r) { el(x, y, r, 2.6, '#eef4f8'); el(x - r * 0.3, y - 0.8, r * 0.5, 1.4, '#ffffff'); }
function drawMortar(e) {
  const x = e.x, y = e.y, fl = e.flash > 0, P = fl ? PAL_W : PAL_S, rc = e.recoil > 0 ? 1.5 : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(e.face, 1);
  // kneeling gunner behind a snow bank with the tube angled toward you
  rr(-8, -17, 8.5, 11, 2.6, P.vest); rr(-8, -17, 3, 11, 2, shade(P.vest, -0.18));
  el(-3.6, -20.5, 3.4, 3.5, P.skin); el(-4, -22.4, 3.9, 2.6, P.hair); el(-6.6, -20.6, 1.6, 2.6, P.hair);
  seg(-1.5, -13, 3.5, -10.5, 2, P.skin);
  seg(1, -3, 8 - rc, -17 + rc, 3.8, fl ? '#ffffff' : '#3c444d'); seg(1.6, -4, 7.6 - rc, -15.6 + rc, 1.2, fl ? '#ffffff' : '#69737e');
  el(8 - rc, -17 + rc, 2.1, 1.3, '#15181b'); seg(4, -3, 1, 0, 1, '#3c444d');
  ctx.restore();
  el(x, y - 2.5, 11, 5.5, '#e5edf4'); el(x - 3, y - 5.5, 6, 3, '#ffffff'); el(x + 4, y - 0.8, 8, 2.2, '#c3d2e0');
}
function drawTank() {
  const T = G.tank; if (!T || T.x > G.camX + W + 10 || T.x + 160 < G.camX) return;
  const X = Math.round(T.x * R) / R, t = G.t, dead = T.dead, [mg, can, core] = T.parts;
  // tracks and road wheels
  rr(X - 2, 154, 157, 22, 9, '#1f2327'); rr(X, 156, 153, 18, 8, '#373d45');
  for (let i = 0; i < 7; i++) { const wx = X + 13 + i * 21.2; el(wx, 166, 7, 7, '#272c32'); el(wx, 166, 4.6, 4.6, dead ? '#3a3a3a' : '#6c7580'); el(wx - 1, 165, 2.2, 1.6, dead ? '#444' : '#8e98a3'); el(wx, 166, 1.4, 1.4, '#23272c'); }
  ctx.strokeStyle = '#121417'; ctx.lineWidth = 1; ctx.beginPath();
  const off = ((T.tread % 6) + 6) % 6;
  for (let lx = X + 5 + off; lx < X + 150; lx += 6) { ctx.moveTo(lx, 155); ctx.lineTo(lx, 158); ctx.moveTo(lx, 172.5); ctx.lineTo(lx, 175.5); }
  ctx.stroke();
  // hull in winter camo
  const hg = ctx.createLinearGradient(0, 132, 0, 158); hg.addColorStop(0, dead ? '#55585c' : '#eef2f5'); hg.addColorStop(1, dead ? '#2a2b2e' : '#94a2b0');
  shape([[X + 2, 158], [X + 16, 136], [X + 140, 134], [X + 155, 140], [X + 155, 158]], hg);
  if (!dead) for (const [a, b2, w, h] of [[34, 142, 24, 7], [74, 148, 28, 6], [118, 141, 22, 8], [52, 152, 14, 4]]) el(X + a, b2, w / 2, h / 2, 'rgba(110,124,138,0.75)');
  seg(X + 17, 137, X + 139, 135, 0.8, 'rgba(255,255,255,0.75)');
  rr(X + 4, 155, 150, 2.4, 1, dead ? '#2a2a2a' : '#5d6874');
  for (let i = 0; i < 10; i++) el(X + 12 + i * 15, 156.2, 0.9, 0.9, '#2f363d');
  // turret
  const tg = ctx.createLinearGradient(0, 98, 0, 136); tg.addColorStop(0, dead ? '#4a4c50' : '#f3f6f8'); tg.addColorStop(1, dead ? '#26272a' : '#8796a6');
  shape([[X + 46, 136], [X + 52, 110], [X + 64, 100], [X + 102, 100], [X + 112, 112], [X + 114, 136]], tg);
  if (!dead) { el(X + 96, 120, 8, 5, 'rgba(110,124,138,0.7)'); el(X + 58, 128, 6, 3, 'rgba(110,124,138,0.7)'); }
  rr(X + 72, 94, 22, 8, 3, dead ? '#333539' : '#c2ccd6'); rr(X + 74, 95, 18, 2, 1, dead ? '#3a3a3a' : '#e8eef3');
  seg(X + 100, 100, X + 108, 70, 0.7, '#3a3f45'); el(X + 108, 70, 1.2, 1.2, '#3a3f45');
  if (!dead && T.phase2) el(X + 104, 103, 2, 2, (t >> 4) % 2 ? '#ff4a2a' : '#7a1a10');
  // main cannon
  if (can.hp > 0) {
    const fl = can.flash > 0;
    seg(X + 54, 118, X + 3, 112, 6.4, fl ? '#ffffff' : '#46505a'); seg(X + 54, 116.6, X + 3, 110.8, 1.8, fl ? '#ffffff' : '#8d99a6');
    rr(X - 3, 108.2, 9, 7.6, 2, fl ? '#ffffff' : '#2b3138'); el(X - 2.6, 112, 1.4, 2.4, '#0e1012');
  } else { seg(X + 54, 118, X + 36, 116, 6, '#2a2b2e'); el(X + 36, 116, 3.2, 3.2, '#1a1a1a'); }
  // the core: armoured sensor window on the turret flank
  if (core.hp > 0) {
    const fl = core.flash > 0, hot = T.phase2;
    rr(X + 64, 110, 36, 17, 4, '#1a1e23');
    glow(X + 82, 118.5, 20, hot ? 'rgba(255,80,40,0.55)' : 'rgba(80,200,255,0.45)', 'rgba(0,0,0,0)');
    rr(X + 67, 113, 30, 11, 3, fl ? '#ffffff' : hot ? '#ff5a2a' : '#4cc4f4');
    rr(X + 70, 114.6, 11 + Math.sin(t * 0.12) * 3, 3, 1.5, fl ? '#ffffff' : hot ? '#ffd27a' : '#d8f6ff');
  } else rr(X + 64, 110, 36, 17, 4, '#121212');
  // machine-gun ball mount
  if (mg.hp > 0) { const fl = mg.flash > 0; seg(X + 8, 153, X - 8, 153, 2.6, fl ? '#ffffff' : '#262c33'); el(X + 12, 152, 6, 5.4, fl ? '#ffffff' : '#5a646f'); el(X + 10.6, 150.6, 2.4, 1.6, fl ? '#ffffff' : '#8e99a5'); }
  else el(X + 12, 152, 5, 4.4, '#1e1e1e');
  if (!dead && t % 10 < 5) for (const pt of T.parts) if (pt.hp <= 0) el(pt.x + pt.w / 2 + (t % 7) - 3, pt.y - (t % 12), 2.5, 2.5, 'rgba(120,110,110,0.7)');
  if (G.freezeT > 0 && T.active && !dead) for (const pt of T.parts) if (pt.hp > 0) ice(pt);
}
function drawSnowBg(cx) {
  ctx.drawImage(SNOWSKY, 0, 0, W, H);
  let ox = -Math.round((cx * 0.1 % 768) * R) / R; ctx.drawImage(SNOWMTN, ox, 0, 768, H); ctx.drawImage(SNOWMTN, ox + 768, 0, 768, H);
  ox = -Math.round((cx * 0.4 % 768) * R) / R; ctx.drawImage(PINES, ox, 0, 768, H); ctx.drawImage(PINES, ox + 768, 0, 768, H);
  // gentle snowfall behind the action: soft, slow and behind the ground, so it never reads as bullets
  const t = G.t || 0; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath();
  for (let i = 0; i < 64; i++) {
    const sp = 0.22 + hash(i * 3) * 0.28, r = 0.5 + hash(i) * 0.7;
    const x = ((hash(i * 7 + 1) * 460 - cx * 0.4 + Math.sin(t * 0.012 + i) * 8) % 400 + 400) % 400 - 8, y = ((hash(i * 11 + 5) * 240 + t * sp) % 240) - 12;
    ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.fill();
}
function drawSnowGround(cx) {
  // crevasses: dark icy chasms between the ground slabs, so a gap never reads as more snow
  const gs = solids.filter(q => q.g).sort((q1, q2) => q1.x - q2.x);
  for (let i = 0; i + 1 < gs.length; i++) {
    const a = gs[i].x + gs[i].w, b = gs[i + 1].x;
    if (b - a < 1 || b < cx - 4 || a > cx + W + 4) continue;
    const cg = ctx.createLinearGradient(0, 172, 0, H); cg.addColorStop(0, '#2a3e56'); cg.addColorStop(0.35, '#132033'); cg.addColorStop(1, '#03060b');
    ctx.fillStyle = cg; ctx.fillRect(a, 172, b - a, H - 172);
    const wg = ctx.createLinearGradient(a, 0, a + 10, 0); wg.addColorStop(0, 'rgba(140,200,235,0.55)'); wg.addColorStop(1, 'rgba(140,200,235,0)');
    ctx.fillStyle = wg; ctx.fillRect(a, 176, 10, H - 176);
    const wg2 = ctx.createLinearGradient(b, 0, b - 10, 0); wg2.addColorStop(0, 'rgba(140,200,235,0.4)'); wg2.addColorStop(1, 'rgba(140,200,235,0)');
    ctx.fillStyle = wg2; ctx.fillRect(b - 10, 176, 10, H - 176);
    ctx.fillStyle = 'rgba(214,240,255,0.9)'; ctx.beginPath();
    for (const [ex, dir] of [[a, 1], [b, -1]]) for (let k = 0; k < 3; k++) { const ix = ex + dir * (2 + k * 3.5), L = 4 + hash(ex * 3 + k) * 7; ctx.moveTo(ix - 1.2, 182); ctx.lineTo(ix, 182 + L); ctx.lineTo(ix + 1.2, 182); }
    ctx.fill();
  }
  for (const s of solids) {
    if (s.x + s.w < cx - 2 || s.x > cx + W + 2) continue;
    const x0 = Math.max(s.x, cx - 8), x1 = Math.min(s.x + s.w, cx + W + 8);
    ctx.save(); ctx.beginPath(); ctx.rect(s.x, s.y - 6, s.w, s.h + 8); ctx.clip();
    if (s.g) {
      const gr = ctx.createLinearGradient(0, s.y, 0, s.y + s.h); gr.addColorStop(0, '#6e86a0'); gr.addColorStop(1, '#33445a');
      ctx.fillStyle = gr; ctx.fillRect(x0, s.y + 4, x1 - x0, s.h - 4);
      for (let by2 = s.y + 8, row = 0; by2 < s.y + s.h; by2 += 10, row++) {
        const off = row % 2 ? 9 : 0;
        for (let bx2 = Math.floor((x0 - s.x - off) / 18) * 18 + s.x + off; bx2 < x1; bx2 += 18) {
          const r = hash(bx2 * 13 + by2 * 7), base = r < 0.33 ? '#7b93ad' : r < 0.66 ? '#7189a4' : '#8299b2';
          rr(bx2 + 0.6, by2 + 0.6, 16.8, 8.8, 3, base); rr(bx2 + 1.6, by2 + 1.4, 14.6, 2, 1, shade(base, 0.2));
          if (r > 0.75) seg(bx2 + 5, by2 + 3, bx2 + 9 + r * 3, by2 + 6.5, 0.5, '#4a5d74');
        }
      }
      if (s.ice) {
        const ig = ctx.createLinearGradient(0, s.y, 0, s.y + 7); ig.addColorStop(0, '#f2fdff'); ig.addColorStop(0.45, '#a8e6f8'); ig.addColorStop(1, '#5fb4d8');
        ctx.fillStyle = ig; ctx.fillRect(x0, s.y, x1 - x0, 7);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 0.8; ctx.lineCap = 'round'; ctx.beginPath();
        for (let gx = Math.floor(x0 / 26) * 26; gx < x1; gx += 26) { const r = hash(gx * 7 + 3); ctx.moveTo(gx + r * 8, s.y + 5.5); ctx.lineTo(gx + r * 8 + 6, s.y + 1.5); ctx.moveTo(gx + r * 8 + 5, s.y + 5.5); ctx.lineTo(gx + r * 8 + 7.5, s.y + 3.6); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(x0, s.y, x1 - x0, 0.8);
        ctx.fillStyle = 'rgba(40,110,150,0.55)'; ctx.fillRect(x0, s.y + 7, x1 - x0, 1.2);
      } else {
        const sg = ctx.createLinearGradient(0, s.y - 2, 0, s.y + 7); sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#cfdeea');
        ctx.fillStyle = sg; ctx.fillRect(x0, s.y, x1 - x0, 6.5);
        for (let gx = Math.floor(x0 / 9) * 9; gx < x1; gx += 9) { const r = hash(gx * 17 + 5); el(gx + 4.5, s.y + 0.8, 5.6, 1.4 + r * 1.1, '#ffffff'); if (r > 0.55) el(gx + 3 + r * 3, s.y + 6.6, 2.2, 1.5 + r * 1.6, '#dbe7f1'); }
        ctx.fillStyle = 'rgba(120,150,190,0.35)'; ctx.fillRect(x0, s.y + 5.8, x1 - x0, 0.8);
      }
    } else {
      const gr = ctx.createLinearGradient(0, s.y, 0, s.y + 8); gr.addColorStop(0, '#8797a8'); gr.addColorStop(1, '#465364');
      ctx.fillStyle = gr; if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(s.x, s.y, s.w, 8, [0, 0, 3, 3]); ctx.fill(); } else ctx.fillRect(s.x, s.y, s.w, 8);
      for (let lx = s.x + 9; lx < s.x + s.w - 2; lx += 12) seg(lx, s.y + 3.5, lx, s.y + 7, 0.5, '#344050');
      if (s.ice) {
        const ig = ctx.createLinearGradient(0, s.y, 0, s.y + 3.6); ig.addColorStop(0, '#f2fdff'); ig.addColorStop(1, '#6cc0e2');
        ctx.fillStyle = ig; ctx.fillRect(s.x, s.y, s.w, 3.4);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 0.6; ctx.beginPath();
        for (let gx = s.x + 6; gx < s.x + s.w - 6; gx += 17) { ctx.moveTo(gx, s.y + 2.8); ctx.lineTo(gx + 4, s.y + 0.8); }
        ctx.stroke();
      } else {
        const sg = ctx.createLinearGradient(0, s.y - 2, 0, s.y + 3.6); sg.addColorStop(0, '#ffffff'); sg.addColorStop(1, '#d3e0eb');
        ctx.fillStyle = sg; ctx.fillRect(s.x, s.y, s.w, 3.6);
      }
      ctx.restore(); ctx.save();
      if (!s.ice) for (let gx = s.x + 4; gx < s.x + s.w - 2; gx += 8) el(gx, s.y + 0.4, 4.6, 1.2 + hash(gx * 5 + s.y) * 0.9, '#ffffff');
      ctx.fillStyle = 'rgba(214,240,255,0.95)'; ctx.beginPath();
      for (let ix = s.x + 4; ix < s.x + s.w - 3; ix += 6) { const r = hash(ix * 11 + s.y); if (r < 0.45) continue; const L = 3 + r * 6; ctx.moveTo(ix - 1.3, s.y + 7.5); ctx.lineTo(ix, s.y + 7.5 + L); ctx.lineTo(ix + 1.3, s.y + 7.5); }
      ctx.fill();
    }
    ctx.restore();
  }
}
let FOGC = null;
function drawBlizzard(cx, cy, sx, sy) {
  const S = G.s5, p = G.p; if (!S || S.bliz <= 0) return;
  const b = S.bliz, therm = p.thermT > 0;
  if (!FOGC || FOGC.width !== cv.width || FOGC.height !== cv.height) FOGC = mk(cv.width, cv.height);
  const g = FOGC.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, FOGC.width, FOGC.height);
  g.fillStyle = `rgba(226,235,244,${(0.93 * b).toFixed(3)})`; g.fillRect(0, 0, FOGC.width, FOGC.height);
  // slow drifting gusts make the white wall uneven
  g.fillStyle = `rgba(255,255,255,${(0.3 * b).toFixed(3)})`;
  for (let i = 0; i < 7; i++) { const gx = ((hash(i * 5) * 600 - G.t * (1.4 + hash(i) * 1.1)) % 560 + 560) % 560 - 90, gy = 20 + hash(i * 9) * 170; g.beginPath(); g.ellipse(gx * R, gy * R, 72 * R, 18 * R, 0, 0, Math.PI * 2); g.fill(); }
  // a clear pocket around the player; thermal goggles widen it a lot
  g.globalCompositeOperation = 'destination-out';
  const px = (p.x - cx + sx) * R, py = (p.y - 16 - cy + sy) * R, r0 = (therm ? 120 : 34) * R, r1 = (therm ? 200 : 86) * R;
  const rg = g.createRadialGradient(px, py, r0, px, py, r1); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg; g.fillRect(0, 0, FOGC.width, FOGC.height);
  g.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(FOGC, 0, 0); ctx.restore();
  // wind-driven streaks (long thin lines, not dots)
  setT(); ctx.strokeStyle = `rgba(255,255,255,${(0.55 * b).toFixed(3)})`; ctx.lineWidth = 0.7; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i < 44; i++) {
    const L = 10 + hash(i * 13) * 12, sp = 4 + hash(i * 3) * 3, x = ((hash(i * 7) * 500 - G.t * sp) % 460 + 460) % 460 - 40, y = ((hash(i * 17) * 260 + G.t * sp * 0.35) % 250) - 20;
    ctx.moveTo(x, y); ctx.lineTo(x + L, y - L * 0.35);
  }
  ctx.stroke();
  setT(-cx + sx, -cy + sy);
  if (therm) {
    // heat signatures show through the storm
    const mark = q => { glow(q.x + q.w / 2, q.y + q.h / 2, Math.max(q.w, q.h) * 0.85, 'rgba(255,120,40,0.5)', 'rgba(255,60,20,0)'); ctx.strokeStyle = '#ffb04a'; ctx.lineWidth = 0.8; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(q.x - 1.5, q.y - 1.5, q.w + 3, q.h + 3, 3); else ctx.rect(q.x - 1.5, q.y - 1.5, q.w + 3, q.h + 3); ctx.stroke(); };
    ctx.save(); ctx.globalAlpha = Math.min(1, b * 1.6);
    for (const e of G.en) if (!e.dead && e.t !== 'box' && onScreen(e.x, 10)) mark(ebox(e));
    if (G.tank && G.tank.active && !G.tank.dead) for (const pt of G.tank.parts) if (pt.hp > 0) mark(pt);
    ctx.restore();
  }
}

// =====================================================================
// STAGE 6 · 高温能源厂: side-scrolling furnace halls. Floor vents and wall pipes breathe fire on a
// timer (a glow and smoke warn you first), lava fills the pits, and a jumping robot waits at the end.
// =====================================================================
const PAL_F = { skin: '#e2b48c', hair: '#e3a422', band: '#2a2e35', vest: '#5d6672', pants: '#3e444e', boots: '#22252a', gun: '#5d646c' };
const JET_FIRE = 1.3, JET_WARN = 0.75;
function initStage6() {
  G.en = []; G.pods = []; G.items = []; G.camX = 0; G.camY = 0;
  for (const [x, y] of SNIPERS6) G.en.push({ t: 'snp', x, y, hp: 1, fireT: 1 + rnd(), face: -1, ax: -1, ay: 0, flash: 0 });
  BOXES6.forEach(([x, item], i) => G.en.push({ t: 'box', x, y: 176, hp: 4, item, open: false, st: 0.8 + i * 0.35, flash: 0 }));
  for (const [x, y] of TURRETS6) G.en.push({ t: 'tur', x, y: y - 16, hp: 6, idx: 6, rotT: 0, fireT: 0.9, flash: 0 });
  G.en.push(...createStageSixGunners());
  G.podTrig = PODS6.map(t => ({ ...t, done: false }));
  G.jets = JETS6.map(j => ({ ...j, st: 'off', k: 0 }));
  G.s6 = { waves: [], coolT: 0,doorProgress:0,exitReady:false,exitTransitionT:0 };
  G.golem = createStageSixBoss(LEVEL_W6 - 66);
}
const golemBody = Gm => stageSixBossContactBox(Gm);
function inGolem() { return false; }
function hitGolem(pt, dmg) {
  const Gm = G.golem;
  if (!Gm.active || pt.hp <= 0 || Gm.dead) return;
  pt.hp -= dmg || 1; pt.flash = 0.06; sfx.hit();
  if (!Gm.phase2 && pt.hp <= pt.max / 2) { Gm.phase2 = true; banner('机器人加速', 1.6); }
  if (pt.hp > 0) return;
  boom(pt.x + pt.w / 2, pt.y + pt.h / 2, 18); sfx.big(); shake(4);
  if (pt.k === 'core') {
    Gm.dead = true; Gm.deadT = 3.2; addScore(15000);
    for (const e of G.en) if (!e.dead) { e.dead = true; boom(e.x, e.y - 10, 6); }
    G.eb.length = 0; G.s6.waves.length = 0; Music.stop(); banner('机器人摧毁', 2.4);
  } else addScore(2000);
}
function jetBox(j) {
  if (j.k < 0.3) return null;
  if (j.v) { const L = 64 * j.k; return { x: j.x - 6, y: 176 - L, w: 12, h: L }; }
  const len = (j.range??74) * j.k, y=(j.y??158.5)-6.5; return j.dir < 0 ? { x: j.x - 6 - len, y, w: len, h: 13 } : { x: j.x + 6, y, w: len, h: 13 };
}
const waveBox = w2 => ({ x: w2.x - 7, y: 176 - w2.h, w: 14, h: w2.h });
function updateStage6() {
  const p = G.p, S = G.s6, Gm = G.golem;
  if(!S.exitReady)for(const actor of players())if(!actor.dead&&actor.x>STAGE_SIX_EXIT.triggerX-2){actor.x=STAGE_SIX_EXIT.triggerX-2;actor.vx=Math.min(0,actor.vx);}
  if (S.coolT > 0) S.coolT -= DT;
  // flame jets
  for (const j of G.jets) {
    if (j.boss||Gm.dead) { j.st = 'off'; j.k = 0; continue; }
    if (S.coolT > 0) { j.st = 'cold'; j.k = 0; continue; }
    const ph = ((G.time + j.off) % j.per + j.per) % j.per, fs = j.per - JET_FIRE;
    if (ph >= fs) { const u = ph - fs; if (j.st !== 'fire' && onScreen(j.x, 30)) sfx.fire(); j.st = 'fire'; j.k = Math.max(0, Math.min(1, u / 0.15, (JET_FIRE - u) / 0.2)); }
    else if (ph >= fs - JET_WARN) { j.st = 'warn'; j.k = 0; if (G.t % 9 === 0 && onScreen(j.x, 10)) G.fx.push({ k: 'smoke', x: j.v ? j.x + (rnd() - 0.5) * 6 : j.x + j.dir * 8, y: j.v ? 170 : (j.y??158), t: 0, life: 0.8 }); }
    else { j.st = 'off'; j.k = 0; }
  }
  // rolling fire waves from the golem's arm
  for (const w2 of S.waves) { w2.x += w2.vx * DT; w2.t += DT; if (w2.x < G.camX - 30) w2.dead = true; }
  sweep(S.waves);
  // flames burn soldiers and you (the fire suit makes you immune)
  const boxes = G.jets.map(jetBox).filter(Boolean).concat(S.waves.map(waveBox));
  for (const e of G.en) if (!e.dead && e.t === 'run' && boxes.some(q => overlap(ebox(e), q))) killEnemy(e);
  const pb = pBox(p);
  if (pb && !p.dead && !(p.fireproofT > 0) && boxes.some(q => overlap(pb, q))) killPlayer();
  // The humanoid boss' target box follows its animated body through the jump.
  for (const pt of Gm.parts) if (pt.flash > 0) pt.flash -= DT;
  if (!Gm.active && G.camX >= CAM_MAX - 0.5) { Gm.active = true; banner('警告 · 巨型机器人', 2.2); Music.start(true, 1); }
  if (Gm.dead) {
    Gm.deadT=Math.max(0,Gm.deadT-DT);
    if(Gm.y<Gm.ground){
      Gm.vy=Math.max(0,Gm.vy)+500*DT;Gm.y=Math.min(Gm.ground,Gm.y+Gm.vy*DT);
      if(Gm.y===Gm.ground){Gm.phase='land';Gm.vy=0;puff(Gm.x,Gm.ground);}
    }
    if(Gm.deadT>0){
      if (rnd() < 0.32) { boom(Gm.x - 22 + rnd() * 44, Gm.y - rnd() * 76, 8 + (rnd() * 10 | 0)); if (rnd() < 0.4) sfx.boom(); }
      shake(2);
    }else if(!S.exitReady){
      S.doorProgress=Math.min(1,(S.doorProgress||0)+DT/STAGE_SIX_EXIT.openSeconds);
      if(S.doorProgress>=1){S.exitReady=true;banner('大门已开启 · 向右进入',3);sfx.pick();}
    }
    if(S.exitReady){
      for(const actor of players())if(canEnterStageSixExit(actor))beginExitEntry(actor);
      if(teamInsideExit(players(),G.lives)){
        S.exitTransitionT=(S.exitTransitionT||0)+DT;
        if(S.exitTransitionT>=.2){const next=nextPlayableStage(6);if(next)startStage(next,true);else stageClear();}
      }
    }
    return;
  }
  if (!Gm.active || G.freezeT > 0) return;
  const target = stageOneTarget(Gm.x);
  const events = advanceStageSixBoss(Gm, target, DT, G.camX + 45, LEVEL_W6 - 34);
  if (events.jump) { puff(Gm.x, Gm.ground); sfx.boom(); }
  if (events.land) { puff(Gm.x, Gm.ground); shake(2); sfx.boom(); }
  if (events.shot && target) {
    const x=Gm.x+Gm.face*22, y=Gm.y-45;
    const a=Math.atan2(target.y-14-y,target.x-x);
    ebullet(x,y,Math.cos(a)*115,Math.sin(a)*115,0,3); boom(x,y,4); sfx.boom();
  }
  if (p.dead) return;
  if (pb && (overlap(pb, golemBody(Gm))||stageSixBossStompBoxes(Gm).some(q=>overlap(pb,q)))) killPlayer();
}
function drawFlame(x0, y0, dx, dy, len, w, seed) {
  if (len < 1) return;
  ctx.save(); ctx.translate(x0, y0); ctx.rotate(Math.atan2(dy, dx));
  const t = G.t * 0.12 + seed;
  const tongue = (L, ww, wob, stops) => {
    const g = ctx.createLinearGradient(0, 0, L, 0); for (const [o, c] of stops) g.addColorStop(o, c);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -ww);
    ctx.quadraticCurveTo(L * 0.5, -ww * 1.15 + wob, L, wob * 0.8);
    ctx.quadraticCurveTo(L * 0.5, ww * 1.15 + wob, 0, ww); ctx.closePath(); ctx.fill();
  };
  tongue(len, w * 1.25, Math.sin(t) * w * 0.5, [[0, 'rgba(255,150,40,0.7)'], [0.6, 'rgba(230,70,20,0.55)'], [1, 'rgba(160,30,10,0)']]);
  tongue(len * 0.92, w, Math.sin(t * 1.3 + 2) * w * 0.4, [[0, 'rgba(255,236,170,0.95)'], [0.3, 'rgba(255,170,50,0.92)'], [0.75, 'rgba(240,80,20,0.8)'], [1, 'rgba(180,30,10,0)']]);
  tongue(len * 0.6, w * 0.45, Math.sin(t * 1.7 + 4) * w * 0.25, [[0, 'rgba(255,255,240,1)'], [0.6, 'rgba(255,230,140,0.8)'], [1, 'rgba(255,200,80,0)']]);
  ctx.restore();
}
function drawJets() {
  for (const j of G.jets) {
    if (!onScreen(j.x, 90)) continue;
    const hot = j.st === 'warn' ? 0.5 + 0.5 * Math.sin(G.t * 0.25) : j.st === 'fire' ? 1 : 0, cold = j.st === 'cold';
    if (j.v) {
      rr(j.x - 11, 170, 22, 6.5, 2, '#2a2527'); rr(j.x - 9, 170.8, 18, 1.6, 0.8, '#77707a');
      for (let i = 0; i < 4; i++) rr(j.x - 7 + i * 4, 173, 2, 2.4, 0.6, hot ? `rgba(255,${140 + hot * 80 | 0},40,${0.4 + hot * 0.6})` : '#141113');
      if (hot && j.st === 'warn') { glow(j.x, 172, 12, `rgba(255,120,30,${0.45 * hot})`, 'rgba(255,90,20,0)'); drawFlame(j.x, 171, 0, -1, 5 + hot * 3, 2.4, j.x); }
      if (j.st === 'fire') { glow(j.x, 170, 22, 'rgba(255,120,30,0.45)', 'rgba(255,90,20,0)'); drawFlame(j.x, 172, 0, -1, 64 * j.k, 7, j.x); }
      if (cold) { rr(j.x - 10, 168.5, 20, 3, 1.4, 'rgba(200,236,255,0.9)'); el(j.x - 4, 168.6, 3, 1.4, '#ffffff'); }
    } else {
      const d = j.dir, nx = j.x + d * 6;
      const sg = ctx.createLinearGradient(j.x - 6, 0, j.x + 6, 0); sg.addColorStop(0, '#5c5458'); sg.addColorStop(1, '#2a2427');
      rr(j.x - 6, 134, 12, 42, 2, sg);
      ctx.save(); ctx.beginPath(); ctx.rect(j.x - 6, 140, 12, 6); ctx.clip(); rr(j.x - 6, 140, 12, 6, 0, '#f2c230');
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = -12; k < 14; k += 5) { ctx.moveTo(j.x + k, 146); ctx.lineTo(j.x + k + 6, 140); } ctx.stroke(); ctx.restore();
      rr(d > 0 ? j.x + 2 : j.x - 10, 154.5, 8, 8, 2, '#3a3436'); rr(d > 0 ? j.x + 8 : j.x - 11, 155.5, 3, 6, 1, hot ? `rgba(255,${140 + hot * 80 | 0},40,1)` : '#141113');
      if (hot && j.st === 'warn') { glow(nx + d * 3, 158.5, 11, `rgba(255,120,30,${0.45 * hot})`, 'rgba(255,90,20,0)'); drawFlame(nx + d * 3, 158.5, d, 0, 4 + hot * 3, 2.2, j.x); }
      if (j.st === 'fire') drawFlame(nx + d * 3, 158.5, d, 0, 74 * j.k, 6.5, j.x);
      if (cold) rr(d > 0 ? j.x + 2 : j.x - 10, 152.5, 8, 3, 1.2, 'rgba(200,236,255,0.9)');
    }
  }
  for (const w2 of G.s6.waves) { glow(w2.x, 168, 20, 'rgba(255,110,30,0.4)', 'rgba(255,80,20,0)'); drawFlame(w2.x, 177, 0.3, -1, w2.h + 4, 8.5, w2.x * 0.1); drawFlame(w2.x + 6, 177, 0.5, -1, w2.h * 0.7, 6, w2.x * 0.1 + 3); }
}
function drawGolem() {
  const Gm = G.golem; if (!Gm || Gm.x > G.camX + W + 20 || Gm.x + 130 < G.camX) return;
  const B = Math.round(Gm.x * R) / R, t = G.t, dead = Gm.dead, [arm, can, core] = Gm.parts;
  const iron = dead ? '#2a2626' : '#4c4448', dark = '#1f1a1c', rim = dead ? '#3a3535' : '#6e6569';
  // chimneys on its back
  for (const [cx2, y0, w, h] of [[B + 86, 20, 12, 30], [B + 100, 28, 10, 24]]) { rr(cx2, y0, w, h, 2, dark); rr(cx2 - 1, y0 - 2, w + 2, 4, 1, rim); }
  // piston legs
  for (const lx of [B + 18, B + 72]) {
    rr(lx, 138, 26, 32, 5, dark); rr(lx + 4, 140, 18, 28, 4, iron);
    seg(lx + 13, 143, lx + 13, 166, 3.4, dead ? '#3a3a3a' : '#9a9298'); seg(lx + 12, 143, lx + 12, 166, 1, dead ? '#444' : '#d0c8cc');
    rr(lx - 4, 168, 34, 8, 3, '#2c2628'); rr(lx - 3, 168.6, 32, 1.6, 0.8, rim);
  }
  // torso
  const tg = ctx.createLinearGradient(B + 4, 0, B + 118, 0); tg.addColorStop(0, dead ? '#3a3436' : '#655c60'); tg.addColorStop(0.5, dead ? '#2c2729' : '#4a4246'); tg.addColorStop(1, dead ? '#1e1a1c' : '#2c2629');
  rr(B + 4, 44, 114, 100, 16, tg);
  ctx.strokeStyle = 'rgba(20,16,18,0.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(B + 10, 88); ctx.lineTo(B + 112, 88); ctx.moveTo(B + 22, 50); ctx.lineTo(B + 22, 138); ctx.moveTo(B + 98, 50); ctx.lineTo(B + 98, 138); ctx.stroke();
  for (let i = 0; i < 7; i++) { el(B + 14 + i * 16, 49, 1.1, 1.1, rim); el(B + 14 + i * 16, 139, 1.1, 1.1, rim); }
  // head with a glowing visor
  rr(B + 40, 24, 40, 24, 8, iron); rr(B + 42, 25, 36, 3, 1.5, rim);
  rr(B + 46, 34, 28, 6, 3, '#120c0c');
  if (!dead) { const ex = B + 52 + (Math.sin(t * 0.04) + 1) * 7; glow(ex + 4, 37, 9, Gm.phase2 ? 'rgba(255,60,30,0.6)' : 'rgba(255,150,40,0.5)', 'rgba(255,80,20,0)'); rr(ex, 35, 8, 4, 2, Gm.phase2 ? '#ff4a2a' : '#ffaa3a'); }
  // furnace door = the core
  rr(core.x - 5, core.y - 5, core.w + 10, core.h + 10, 7, dark);
  if (core.hp > 0) {
    const fl = core.flash > 0, k = Gm.doorK;
    const mg = ctx.createRadialGradient(core.x + core.w / 2, core.y + core.h / 2, 2, core.x + core.w / 2, core.y + core.h / 2, core.w * 0.7);
    mg.addColorStop(0, fl ? '#ffffff' : '#fff3c0'); mg.addColorStop(0.4, fl ? '#ffffff' : '#ffb03a'); mg.addColorStop(1, fl ? '#ffffff' : '#c8380e');
    rr(core.x, core.y, core.w, core.h, 4, mg);
    if (k > 0.05) glow(core.x + core.w / 2, core.y + core.h / 2, 34, `rgba(255,140,40,${0.5 * k})`, 'rgba(255,80,20,0)');
    const pw = core.w / 2 * (1 - k), soon = !Gm.open && Gm.doorT < 0.9 ? 0.5 + 0.5 * Math.sin(t * 0.3) : 0;
    for (const sd of [0, 1]) {
      if (pw < 0.5) continue;
      const px = sd ? core.x + core.w - pw : core.x;
      rr(px, core.y, pw, core.h, 2, iron);
      for (let yy = core.y + 5; yy < core.y + core.h - 3; yy += 6) rr(px + 2, yy, Math.max(0, pw - 4), 1.6, 0.8, soon ? `rgba(255,${150 + soon * 80 | 0},50,${0.5 + soon * 0.5})` : 'rgba(255,120,40,0.45)');
    }
  } else { rr(core.x, core.y, core.w, core.h, 4, '#141010'); }
  // shoulder cannon
  if (can.hp > 0) {
    const fl = can.flash > 0, cg = ctx.createLinearGradient(0, can.y, 0, can.y + can.h); cg.addColorStop(0, fl ? '#fff' : '#7a7075'); cg.addColorStop(1, fl ? '#fff' : '#332c2f');
    seg(can.x + 8, can.y + 6, can.x - 8, can.y + 2, 6.5, fl ? '#ffffff' : '#2e282b'); seg(can.x + 8, can.y + 4.8, can.x - 8, can.y + 0.8, 1.6, fl ? '#fff' : '#8a8086');
    rr(can.x, can.y, can.w, can.h, 6, cg); el(can.x + 20, can.y + 11, 4, 4, '#1a1416'); el(can.x + 20, can.y + 11, 2, 2, Gm.ballT < 0.6 && !dead ? '#ffb03a' : '#5a2a1a');
  } else { rr(can.x + 4, can.y + 6, can.w - 8, can.h - 8, 3, '#1c1818'); }
  // flamethrower arm
  const sx = B + 16, sy = 78, ex2 = B + 2, ey2 = 116;
  seg(sx, sy, ex2, ey2, 10, dark); seg(sx, sy, ex2, ey2, 6.5, iron);
  if (arm.hp > 0) {
    const fl = arm.flash > 0, hx = arm.x + 10, hy = arm.y + 14;
    seg(ex2, ey2, hx + 6, hy - 6, 9, dark); seg(ex2, ey2, hx + 6, hy - 6, 5.5, iron);
    rr(arm.x + 2, arm.y + 4, 26, 20, 5, fl ? '#ffffff' : '#5a5156'); rr(arm.x - 4, arm.y + 9, 10, 10, 3, fl ? '#fff' : '#2a2426');
    const charge = Gm.waveN > 0 ? 1 : 0;
    glow(arm.x - 4, arm.y + 14, 8 + charge * 8, charge ? 'rgba(255,140,40,0.7)' : 'rgba(120,170,255,0.5)', 'rgba(0,0,0,0)');
    el(arm.x - 4, arm.y + 14, 1.8 + charge * 1.6, 1.8 + charge * 1.6, charge ? '#ffd27a' : '#bcd8ff');
  } else { seg(ex2, ey2, ex2 - 4, ey2 + 12, 5, '#1c1818'); }
  el(sx, sy, 9, 8, iron); el(sx - 2, sy - 2, 4, 3, rim);
  if (!dead && t % 10 < 5) for (const pt of Gm.parts) if (pt.hp <= 0) el(pt.x + pt.w / 2 + (t % 7) - 3, pt.y - (t % 12), 2.5, 2.5, 'rgba(120,110,110,0.7)');
  if (G.freezeT > 0 && Gm.active && !dead) for (const pt of Gm.parts) if (pt.hp > 0) ice(pt);
}
function drawFactoryBg(cx) {
  ctx.drawImage(FACT_BG, -Math.round((cx * 0.12 % 768) * R) / R, 0, 768, H); ctx.drawImage(FACT_BG, -Math.round((cx * 0.12 % 768) * R) / R + 768, 0, 768, H);
  const ox = -Math.round((cx * 0.42 % 768) * R) / R; ctx.drawImage(FACT_MID, ox, 0, 768, H); ctx.drawImage(FACT_MID, ox + 768, 0, 768, H);
}
function drawFactoryGround(cx) {
  // lava pits between the deck slabs
  const gs = solids.filter(q => q.g).sort((q1, q2) => q1.x - q2.x);
  for (let i = 0; i + 1 < gs.length; i++) {
    const a = gs[i].x + gs[i].w, b = gs[i + 1].x;
    if (b - a < 1 || b < cx - 4 || a > cx + W + 4) continue;
    glow((a + b) / 2, 186, (b - a) * 0.9, 'rgba(255,120,30,0.45)', 'rgba(255,80,20,0)');
    const lg = ctx.createLinearGradient(0, 186, 0, H); lg.addColorStop(0, '#ffd34a'); lg.addColorStop(0.12, '#ff8a1e'); lg.addColorStop(0.45, '#b8260c'); lg.addColorStop(1, '#3a0806');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(a, H);
    for (let x = a; x <= b; x += 2) ctx.lineTo(x, 188 + Math.sin((x + G.t * 0.35) / 9) * 1.2);
    ctx.lineTo(b, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,180,0.5)';
    for (let x = a + 6; x < b - 4; x += 14) { const r = hash(x * 3 + a); el(x + r * 6, 192 + r * 8, 3 + r * 2, 0.9, 'rgba(255,230,150,0.45)'); }
  }
  for (const s of solids) {
    if (s.x + s.w < cx - 2 || s.x > cx + W + 2) continue;
    const x0 = Math.max(s.x, cx - 8), x1 = Math.min(s.x + s.w, cx + W + 8);
    if (s.g) {
      ctx.save(); ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
      const gr = ctx.createLinearGradient(0, s.y, 0, s.y + s.h); gr.addColorStop(0, '#4c464a'); gr.addColorStop(1, '#1c181b');
      ctx.fillStyle = gr; ctx.fillRect(x0, s.y, x1 - x0, s.h);
      for (let by2 = s.y + 8, row = 0; by2 < s.y + s.h; by2 += 14, row++) {
        const off = row % 2 ? 12 : 0;
        for (let bx2 = Math.floor((x0 - s.x - off) / 24) * 24 + s.x + off; bx2 < x1; bx2 += 24) {
          const r = hash(bx2 * 13 + by2 * 7), base = r < 0.5 ? '#4a4448' : '#524b50';
          rr(bx2 + 0.7, by2 + 0.7, 22.6, 12.6, 2, base); rr(bx2 + 1.6, by2 + 1.4, 20.8, 1.6, 0.8, shade(base, 0.22));
          for (const [rx, ry] of [[3, 3.5], [20, 3.5], [3, 10], [20, 10]]) el(bx2 + rx, by2 + ry, 0.8, 0.8, '#2a2528');
        }
      }
      // diamond-plate deck with hazard stripes at pit edges
      const dg = ctx.createLinearGradient(0, s.y, 0, s.y + 7); dg.addColorStop(0, '#a29ea8'); dg.addColorStop(1, '#5c5862');
      ctx.fillStyle = dg; ctx.fillRect(x0, s.y, x1 - x0, 7);
      ctx.strokeStyle = 'rgba(40,36,42,0.55)'; ctx.lineWidth = 0.6; ctx.beginPath();
      for (let gx = Math.floor(x0 / 6) * 6; gx < x1; gx += 6) { const o = (gx / 6) % 2 ? 1.5 : 0; ctx.moveTo(gx + o, s.y + 2.5); ctx.lineTo(gx + o + 2, s.y + 1.5); ctx.moveTo(gx + o + 1, s.y + 5); ctx.lineTo(gx + o + 3, s.y + 4); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x0, s.y, x1 - x0, 0.7);
      for (const [ex, d] of [[s.x, 1], [s.x + s.w, -1]]) {
        if (s.x === 0 && d > 0 || s.x + s.w >= LEVEL_W && d < 0) continue;
        const hx = d > 0 ? ex : ex - 14;
        ctx.save(); ctx.beginPath(); ctx.rect(hx, s.y, 14, 7); ctx.clip(); ctx.fillStyle = '#f2c230'; ctx.fillRect(hx, s.y, 14, 7);
        ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2.2; ctx.beginPath(); for (let k = -8; k < 20; k += 5.5) { ctx.moveTo(hx + k, s.y + 7); ctx.lineTo(hx + k + 7, s.y); } ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    } else {
      // steel catwalk with grating and a thin railing behind
      ctx.strokeStyle = '#5e585f'; ctx.lineWidth = 0.7; ctx.beginPath();
      for (let px = s.x + 2; px <= s.x + s.w - 1; px += 16) { ctx.moveTo(px, s.y); ctx.lineTo(px, s.y - 10); }
      ctx.moveTo(s.x + 1, s.y - 10); ctx.lineTo(s.x + s.w - 1, s.y - 10); ctx.moveTo(s.x + 1, s.y - 5); ctx.lineTo(s.x + s.w - 1, s.y - 5); ctx.stroke();
      const gr = ctx.createLinearGradient(0, s.y, 0, s.y + 8); gr.addColorStop(0, '#8a8690'); gr.addColorStop(1, '#3a363c');
      ctx.fillStyle = gr; if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(s.x, s.y, s.w, 7, [0, 0, 2, 2]); ctx.fill(); } else ctx.fillRect(s.x, s.y, s.w, 7);
      for (let gx = s.x + 3; gx < s.x + s.w - 3; gx += 4) rr(gx, s.y + 2.4, 2.4, 3, 0.4, '#2a262b');
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(s.x, s.y, s.w, 0.7);
      for (let bx2 = s.x + 10; bx2 < s.x + s.w - 6; bx2 += 32) seg(bx2, s.y + 7, bx2 + 6, s.y + 14, 1, '#3a353a');
    }
  }
}

// =====================================================================
// STAGE 7 · 机械机库: loading steps, two armored partitions, a two-deck
// press line, the low cart tunnel, pipe hall and the final defense gate.
// =====================================================================
const PAL_H = { skin: '#e2b48c', hair: '#d9dee4', band: '#c03a2a', vest: '#3e5a7a', pants: '#2c3e56', boots: '#1e2228', gun: '#5d646c' };
function initStage7(){
  G.en=[];G.pods=[];G.items=[];G.camX=G.camY=0;G.hive=null;G.ship=null;
  for(const [x,y] of SNIPERS7)G.en.push({t:'snp',x,y,hp:2,fireT:1+rnd(),face:-1,ax:-1,ay:0,flash:0});
  BOXES7.forEach(([x,item],i)=>G.en.push({t:'box',x,y:groundAt(x).y,hp:4,item,open:false,st:.8+i*.35,flash:0}));
  G.en.push(...createHangarPlates());
  G.podTrig=PODS7.map(t=>({...t,done:false}));
  G.s7={cartT:1,depots:HANGAR_CART_DEPOTS.map(d=>({...d,spawned:false})),encounters:HANGAR_ENCOUNTERS.map(q=>({...q,done:false})),section:'loading',presses:PRESSES7.map(q=>({...q,k:0,st:'idle'}))};
  const x=STAGE_SEVEN_ROUTE.gate;
  G.gate={x,active:false,dead:false,deadT:0,shotT:1.2,turn:0,parts:[
    {gate:1,k:'turret',x:x-175,y:155,w:20,h:19,hp:16,max:16,flash:0},
    {gate:1,k:'turret',x:x-95,y:155,w:20,h:19,hp:16,max:16,flash:0},
    {gate:1,k:'core',x:x+8,y:83,w:30,h:30,hp:55,max:55,flash:0}
  ]};
}
function advanceStageSevenCarts(){
  const living=players().filter(p=>!p.dead);
  for(const cart of G.en){
    if(cart.t!=='cart'||cart.dead)continue;
    const riders=living.filter(p=>p.cart===cart).sort((a,b)=>(a.pid||1)-(b.pid||1));
    for(const [i,p]of riders.entries())p.cartSeat=riders.length>1?(i?4:-4):0;
    if(G.freezeT<=0){
      const oldX=cart.x,speed=!riders.length&&cart.depot?.startsWith('tunnel')?0:(cart.driveVX??cart.vx);cart.vx=speed;cart.vy=Math.min(cart.vy+GRAV*DT,MAXFALL);cart.x+=speed*DT;
      wallCollide(cart,oldX,11);collideHangarPlates(cart,oldX,24,G.en,{x:cart.x-11,y:cart.y-22,w:22,h:22});
      const lowBlocked=collideMinecartClearance(cart,oldX,riders,solids);
      if(lowBlocked&&!G.s7.duckHint){G.s7.duckHint=true;banner('低矮横梁 · 按下伏低通过',2);}
      cart.x=Math.min(cart.x,xMax(25));
      if(riders.length)cart.x=Math.max(G.camX+14,cart.x);
      if(riders.length&&living.length>1)cart.x=Math.min(cart.x,Math.min(...living.map(p=>p.x))+W-55);
      if(Math.abs(cart.x-oldX)<.01&&Math.abs(speed)>0){cart.vx=0;if(!riders.length){cart.vx=-speed;cart.driveVX=cart.vx;}}
      cart.wheel+=(cart.x-oldX)*.3;
      const before=cart.y;cart.y+=cart.vy*DT;cart.on=false;
      if(cart.vy>=0){const floor=findLand(cart.x,before,cart.y,6,true);if(floor){cart.y=floor.y;cart.vy=0;cart.on=true;cart.sup=floor;}}
      if(cart.y>G.camY+250||cart.x<G.camX-40)cart.dead=true;
    }
  }
}
function hitHangarGate(pt,dmg){
  const gate=G.gate;if(!gate||gate.dead||pt.hp<=0)return;
  pt.hp-=dmg||1;pt.flash=.1;sfx.hit();
  if(pt.hp>0)return;
  boom(pt.x+pt.w/2,pt.y+pt.h/2,18);sfx.big();shake(3);addScore(pt.k==='core'?15000:2000);
  if(pt.k==='core'){gate.dead=true;gate.deadT=2.5;G.eb.length=0;for(const e of G.en)e.dead=true;G.podTrig.forEach(t=>t.done=true);Music.stop();banner('防御大门已击破',2);}
}
function updateStage7(){
  const S=G.s7,gate=G.gate,frozen=G.freezeT>0;
  for(const actor of players())if(!actor.dead){
    const b=pBox(actor),q=HANGAR_CART_TUNNEL;
    if(b&&q.roofs.some(r=>overlap(b,{x:r.x,y:q.railTop,w:r.w,h:q.ground-q.railTop}))){
      if(actor===G.p)killPlayer(true);else withPlayer2(()=>killPlayer(true));
    }
  }
  for(const q of S.presses){
    const previousK=q.k;
    if(!frozen)Object.assign(q,hangarPressState(q,G.time));
    const box=frozen?null:hangarPressCrushBox(q,previousK);if(!box)continue;
    for(const actor of players())if(!actor.dead){const b=pBox(actor);if(b&&overlap(b,box)){if(actor===G.p)killPlayer();else withPlayer2(()=>killPlayer());}}
  }
  if(!gate.dead&&!frozen){
    const front=Math.max(...players().filter(p=>!p.dead).map(p=>p.x),G.camX);
    S.section=hangarSectionAt(front).id;
    if(!S.cartHint&&front>=1700&&front<1810){S.cartHint=true;banner('带电轨道 · 跳上矿车并按下伏低',2.5);}
    S.cartT-=DT;if(S.cartT<=0){S.cartT=.5;for(const d of S.depots||[])if((!d.spawned||(d.id==='tunnel-cart'&&front<1810&&!G.en.some(c=>c.t==='cart'&&!c.dead&&c.depot===d.id)))&&front>=d.at&&front<d.end){
      d.spawned=true;G.en.push({t:'cart',depot:d.id,x:d.x,y:d.y,vx:d.vx,vy:0,hp:4,on:true,sup:null,flash:0,wheel:0});}}
    for(const q of S.encounters||[])if(!q.done&&front>=q.at){q.done=true;for(const [x,y]of q.units)if(x>G.camX-20)G.en.push(runner(x,y,-1));}
  }
  for(const actor of players())if(actor.droneT>0&&!actor.dead){
    actor.droneT-=DT;actor.droneCd-=DT;actor.droneShotT=Math.max(0,(actor.droneShotT||0)-DT);const x=actor.x-actor.face*12,y=actor.y-44+Math.sin(G.t*.08)*2;
    actor.dx2=actor.dx2===undefined?x:actor.dx2+(x-actor.dx2)*Math.min(1,DT*6);actor.dy2=actor.dy2===undefined?y:actor.dy2+(y-actor.dy2)*Math.min(1,DT*6);
    if(actor.droneCd<=0){const target=findTarget(actor.dx2,actor.dy2,true);if(target){G.pb.push({k:'b',drone:true,owner:actor.pid,...aimEscortDrone(actor,target),dmg:1});actor.droneCd=.3;actor.droneShotT=.08;}}
  }
  if(!gate.active&&G.camX>=CAM_MAX-1){gate.active=true;banner('警告 · 击破防御大门核心',2);}
  for(const pt of gate.parts){pt.flash=Math.max(0,pt.flash-DT);pt.shotFlash=Math.max(0,(pt.shotFlash||0)-DT);}
  if(gate.dead){gate.deadT-=DT;if(gate.deadT<=0)stageClear();return;}
  if(!gate.active||frozen)return;
  gate.shotT-=DT;if(gate.shotT<=0){gate.shotT=1.8;const guns=gate.parts.filter(p=>p.k==='turret'&&p.hp>0);
    if(guns.length){const gun=guns[gate.turn++%guns.length],b=ebullet(gun.x+gun.w/2,gun.y,0,-175,280,3);gun.shotFlash=.35;b.waterAmbush='rise';b.from='hangarGate';sfx.eshot();}}
}
function initStage7Legacy() {
  G.en = []; G.pods = []; G.items = []; G.camX = 0; G.camY = 0;
  for (const [x, y] of SNIPERS7) G.en.push({ t: 'snp', x, y, hp: 1, fireT: 1 + rnd(), face: -1, ax: -1, ay: 0, flash: 0 });
  BOXES7.forEach(([x, item], i) => G.en.push({ t: 'box', x, y: 176, hp: 4, item, open: false, st: 0.8 + i * 0.35, flash: 0 }));
  for (const [x, y] of TURRETS7) G.en.push({ t: 'tur', x, y: y - 16, hp: 6, idx: 6, rotT: 0, fireT: 0.9, flash: 0 });
  G.podTrig = PODS7.map(t => ({ ...t, done: false }));
  for (const s2 of solids) if (s2.mv) { s2.x = s2.bx; s2.y = s2.by; }
  G.s7 = { cartT: 4, presses: PRESSES7.map(q => ({ ...q, k: 0, st: 'idle' })) };
  G.ship = { x: LEVEL_W7 + 40, y: 54, hx: 3190, active: false, entering: true, dead: false, deadT: 0, phase2: false, t: 0, mode: 'hover', modeT: 6, gunT: 1.6, bayT: 2.6, bombN: 0, bombGap: 0, paraT: 4, fan: 0, parts: [
    { ship: 1, k: 'gun', ox: 14, oy: 44, w: 18, h: 14, hp: 20, max: 20, flash: 0 },
    { ship: 1, k: 'bay', ox: 70, oy: 44, w: 30, h: 12, hp: 20, max: 20, flash: 0 },
    { ship: 1, k: 'core', ox: 56, oy: 18, w: 36, h: 22, hp: 70, max: 70, flash: 0 },
  ] };
  placeShip();
}
function placeShip() { const Sh = G.ship; for (const pt of Sh.parts) { pt.x = Sh.x + pt.ox; pt.y = Sh.y + pt.oy; } }
const shipBody = Sh => ({ x: Sh.x + 4, y: Sh.y + 10, w: 162, h: 36 });
function hitShip(pt, dmg) {
  const Sh = G.ship;
  if (pt.hp <= 0 || Sh.dead) return;
  pt.hp -= dmg || 1; pt.flash = 0.06; sfx.hit();
  if (pt.k === 'core' && !Sh.phase2 && pt.hp <= pt.max / 2) { Sh.phase2 = true; Sh.modeT = 1.5; banner('运输机受损 · 准备低空扫射', 1.6); }
  if (pt.hp > 0) return;
  boom(pt.x + pt.w / 2, pt.y + pt.h / 2, 18); sfx.big(); shake(4);
  if (pt.k === 'core') {
    Sh.dead = true; Sh.deadT = 3.2; addScore(15000);
    for (const e of G.en) if (!e.dead) { e.dead = true; boom(e.x, e.y - 10, 6); }
    G.eb.length = 0; Music.stop(); banner('运输机击落', 2.4);
  } else addScore(2000);
}
// press head bottom: 64 when up, 176 when slammed down
const pressBottom = q => 64 + 112 * q.k;
const pressBox = q => ({ x: q.x, y: pressBottom(q) - 22, w: 40, h: 22 });
function updateStage7Legacy() {
  const p = G.p, S = G.s7, Sh = G.ship;
  // lifts, carrying whoever stands on them
  for (const s2 of solids) {
    if (!s2.mv) continue;
    const m = s2.mv, o = Math.sin(G.time * Math.PI * 2 / m.per + m.ph) * m.amp, ox2 = s2.x, oy2 = s2.y;
    if (m.ax === 'x') s2.x = s2.bx + o; else s2.y = s2.by + o;
    for (const actor of players()) if (!actor.dead && actor.onGround && actor.support === s2) { actor.x += s2.x - ox2; actor.y = s2.y; }
  }
  // hydraulic presses
  for (const q of S.presses) {
    const u = ((G.time + q.off) % q.per + q.per) % q.per, a = q.per - 2.1, was = q.st;
    if (u < a) { q.st = 'idle'; q.k = 0; }
    else if (u < a + 0.7) { q.st = 'warn'; q.k = 0; }
    else if (u < a + 0.85) { q.st = 'slam'; q.k = (u - a - 0.7) / 0.15; }
    else if (u < a + 1.2) { q.st = 'hold'; q.k = 1; }
    else { q.st = 'rise'; q.k = Math.max(0, 1 - (u - a - 1.2) / 0.9); }
    if (q.st === 'hold' && was !== 'hold' && onScreen(q.x + 20, 20)) { shake(2); noise(0.25, 0.3, 260); tone(70, 0.2, 'triangle', 0.25, 40); for (let i = 0; i < 4; i++) G.fx.push({ k: 'puff', x: q.x + 4 + i * 11, y: 175, vx: (i - 1.5) * 30, vy: -14, t: 0, life: 0.35 }); }
    if (q.k < 0.15) continue;
    const bx2 = pressBox(q);
    for (const e of G.en) if (!e.dead && (e.t === 'run' || e.t === 'cart') && overlap(ebox(e), bx2)) killEnemy(e);
    const pb = pBox(p);
    if (pb && !p.dead && overlap(pb, bx2)) killPlayer();
  }
  // cargo carts roll in from the right
  S.cartT -= DT;
  if (S.cartT <= 0) {
    S.cartT = 4.5 + rnd() * 2.5;
    const sx = G.camX + W + 16, s2 = groundAt(sx);
    if (G.camX < CAM_MAX - 100 && s2 && G.freezeT <= 0) G.en.push({ t: 'cart', x: sx, y: s2.y, vx: -70, vy: 0, hp: 4, on: false, sup: null, flash: 0, wheel: 0 });
  }
  // support drone
  for (const p of players()) if (p.droneT > 0 && !p.dead) {
    p.droneT -= DT; p.droneCd -= DT;
    const dx = p.x - p.face * 12, dy = p.y - 44 + Math.sin(G.t * 0.08) * 2;
    p.dx2 = p.dx2 === undefined ? dx : p.dx2 + (dx - p.dx2) * Math.min(1, DT * 6); p.dy2 = p.dy2 === undefined ? dy : p.dy2 + (dy - p.dy2) * Math.min(1, DT * 6);
    if (p.droneCd <= 0) { const tg = findTarget(p.dx2, p.dy2); if (tg) { const a2 = Math.atan2(tg.y - p.dy2, tg.x - p.dx2); G.pb.push({ k: 'b', drone: true, owner: p.pid, x: p.dx2, y: p.dy2, vx: Math.cos(a2) * 300, vy: Math.sin(a2) * 300, dmg: 1 }); p.droneCd = 0.3; tone(1500, 0.03, 'square', 0.025, 900); } }
  }
  // the gunship
  for (const pt of Sh.parts) if (pt.flash > 0) pt.flash -= DT;
  Sh.fan += DT * (Sh.dead ? 2 : 7);
  if (!Sh.active && G.camX >= CAM_MAX - 0.5) { Sh.active = true; banner('警告 · 装甲运输机', 2.2); Music.start(true, 3); }
  if (!Sh.active) return;
  if (Sh.dead) {
    Sh.deadT -= DT; Sh.y += 34 * DT; Sh.x -= 12 * DT; placeShip();
    if (rnd() < 0.35) { boom(Sh.x + rnd() * 160, Sh.y + 10 + rnd() * 40, 8 + (rnd() * 10 | 0)); if (rnd() < 0.4) sfx.boom(); }
    shake(2);
    if (Sh.deadT <= 0) stageClear();
    return;
  }
  if (G.freezeT > 0) return;
  Sh.t += DT;
  const [gunP, bay] = Sh.parts;
  if (Sh.entering) { Sh.x -= 110 * DT; Sh.y = 54 + Math.sin(Sh.t * 1.1) * 6; if (Sh.x <= Sh.hx) Sh.entering = false; placeShip(); return; }
  if (Sh.mode === 'hover') {
    const tx = 3146 + (Math.sin(Sh.t * 0.5) + 1) * 38, ty = 52 + Math.sin(Sh.t * 1.1) * 8;
    Sh.x += (tx - Sh.x) * Math.min(1, DT * 2); Sh.y += (ty - Sh.y) * Math.min(1, DT * 3);
    if (Sh.phase2) { Sh.modeT -= DT; if (Sh.modeT <= 0) { Sh.mode = 'dive'; banner('低空扫射 · 快卧倒', 1.2); tone(440, 0.6, 'sawtooth', 0.06, 880); } }
  } else if (Sh.mode === 'dive') { Sh.y += 90 * DT; if (Sh.y >= 106) { Sh.y = 106; Sh.mode = 'sweep'; } }
  else if (Sh.mode === 'sweep') { Sh.x -= 150 * DT; if (Sh.x <= G.camX + 4) Sh.mode = 'sweep2'; }
  else if (Sh.mode === 'sweep2') { Sh.x += 150 * DT; if (Sh.x >= 3146) Sh.mode = 'climb'; }
  else if (Sh.mode === 'climb') { Sh.y -= 70 * DT; if (Sh.y <= 54) { Sh.mode = 'hover'; Sh.modeT = 6; } }
  placeShip();
  if (p.dead) return;
  // chin gun: aimed three-shot spread
  if (gunP.hp > 0) {
    gunP.fireT = (gunP.fireT === undefined ? 1.6 : gunP.fireT) - DT;
    if (gunP.fireT <= 0) { gunP.fireT = Sh.phase2 ? 1.3 : 1.8; const gx = gunP.x + 4, gy = gunP.y + 10, a2 = aimAtPlayer(gx, gy); for (const d of [-0.18, 0, 0.18]) ebullet(gx, gy, Math.cos(a2 + d) * 125, Math.sin(a2 + d) * 125); sfx.eshot(); }
  }
  // bomb bay: bombs while hovering; paratroopers in phase 2
  if (bay.hp > 0 && Sh.mode === 'hover') {
    if (Sh.bombN > 0) { Sh.bombGap -= DT; if (Sh.bombGap <= 0) { Sh.bombN--; Sh.bombGap = 0.28; const bx3 = bay.x + 15; ebullet(bx3, bay.y + 12, (p.x - bx3) * 0.25 + (rnd() - 0.5) * 30, 20, 320, 3); tone(300, 0.08, 'triangle', 0.06, 150); } }
    else { Sh.bayT -= DT; if (Sh.bayT <= 0) { Sh.bayT = Sh.phase2 ? 2.4 : 3.2; Sh.bombN = 3; Sh.bombGap = 0; } }
    if (Sh.phase2) { Sh.paraT -= DT; if (Sh.paraT <= 0) { Sh.paraT = 4.5; if (G.en.filter(e => e.t === 'run').length < 3) G.en.push(runner(bay.x + 15, bay.y + 14, p.x < bay.x ? -1 : 1)); } }
  }
  // touching the gunship hurts (during the low sweep only lying flat keeps you under it)
  const pb = pBox(p);
  if (pb && (overlap(pb, shipBody(Sh)) || Sh.parts.some(pt => pt.hp > 0 && overlap(pb, pt)))) killPlayer();
}
function drawCart(e) {
  const x = e.x, y = e.y, fl = e.flash > 0;
  rr(x - 11, y - 17, 22, 12, 2.2, fl ? '#ffffff' : '#d1a83a'); rr(x - 11, y - 17, 22, 2.2, 1, fl ? '#fff' : '#f0d070');
  ctx.save(); ctx.beginPath(); ctx.rect(x - 11, y - 11, 22, 4); ctx.clip(); ctx.strokeStyle = '#1e1e1e'; ctx.lineWidth = 1.8; ctx.beginPath(); for (let k = -14; k < 14; k += 5) { ctx.moveTo(x + k, y - 7); ctx.lineTo(x + k + 4, y - 11); } ctx.stroke(); ctx.restore();
  rr(x - 8, y - 23, 14, 7, 1.2, fl ? '#fff' : '#7a5a3a'); seg(x - 8, y - 19.5, x + 6, y - 19.5, 0.5, '#4a3622'); seg(x - 1, y - 23, x - 1, y - 16, 0.5, '#4a3622');
  for (const wx of [x - 6.5, x + 6.5]) { el(wx, y - 3.6, 3.6, 3.6, '#22262b'); el(wx, y - 3.6, 1.8, 1.8, '#8a929c'); seg(wx + Math.cos(e.wheel) * 3, y - 3.6 + Math.sin(e.wheel) * 3, wx - Math.cos(e.wheel) * 3, y - 3.6 - Math.sin(e.wheel) * 3, 0.6, '#55606a'); }
  el(x - 11, y - 13, 1.3, 1.3, (G.t >> 4) % 2 ? '#ff4a2a' : '#7a1a10');
}
function drawPresses() {
  for (const q of G.s7.presses) {
    if (!onScreen(q.x + 20, 30)) continue;
    const warn = q.st === 'warn', sh = warn ? Math.sin(G.t * 1.3) * 0.6 : 0, x = q.x + sh, hb = pressBottom(q), ht = hb - 22;
    // danger marking on the floor
    ctx.save(); ctx.beginPath(); ctx.rect(q.x, 174.6, 40, 1.6); ctx.clip(); ctx.fillStyle = '#f2c230'; ctx.fillRect(q.x, 174.6, 40, 1.6); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); for (let k = 0; k < 44; k += 4) { ctx.moveTo(q.x + k, 176.2); ctx.lineTo(q.x + k + 2, 174.6); } ctx.stroke(); ctx.restore();
    // shaft and head
    const sg = ctx.createLinearGradient(x + 15, 0, x + 25, 0); sg.addColorStop(0, '#a8b4c2'); sg.addColorStop(1, '#5a6676');
    rr(x + 15, 12, 10, Math.max(0, ht - 10), 2, sg);
    const hg = ctx.createLinearGradient(0, ht, 0, hb); hg.addColorStop(0, '#8693a4'); hg.addColorStop(1, '#3a4452');
    rr(x, ht, 40, 22, 3, hg); rr(x + 1, ht + 1, 38, 2, 1, 'rgba(255,255,255,0.35)');
    ctx.save(); ctx.beginPath(); ctx.rect(x, hb - 5, 40, 5); ctx.clip(); ctx.fillStyle = '#f2c230'; ctx.fillRect(x, hb - 5, 40, 5);
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2.2; ctx.beginPath(); for (let k = -6; k < 46; k += 6) { ctx.moveTo(x + k, hb); ctx.lineTo(x + k + 5, hb - 5); } ctx.stroke(); ctx.restore();
    for (const bxx of [x + 5, x + 35]) el(bxx, ht + 8, 1.2, 1.2, '#2a323c');
    // housing on the ceiling with a status light
    rr(q.x - 4, 0, 48, 15, 3, '#2a3340'); rr(q.x - 3, 12.5, 46, 2, 1, '#46525f');
    const lv = warn ? 0.5 + 0.5 * Math.sin(G.t * 0.3) : q.st === 'idle' ? 0 : 1;
    if (lv > 0.05) glow(q.x + 20, 8, 9, `rgba(255,60,40,${0.5 * lv})`, 'rgba(255,40,20,0)');
    el(q.x + 20, 8, 2.6, 2.6, lv > 0.05 ? `rgb(255,${70 + (1 - lv) * 60 | 0},50)` : '#2f6a3a');
  }
}
function drawShip() {
  const Sh = G.ship; if (!Sh || !Sh.active || Sh.x > G.camX + W + 10) return;
  const X = Sh.x, Y = Sh.y, dead = Sh.dead, [gunP, bay, core] = Sh.parts, t = G.t;
  // ducted fans on top
  for (const fx of [X + 44, X + 108]) {
    rr(fx - 2, Y - 3, 36, 13, 5, dead ? '#1e1e20' : '#28313c');
    ctx.save(); ctx.globalAlpha = 0.35; el(fx + 16, Y + 2.5, 15, 3.5, '#a8bccf'); ctx.restore();
    for (let i = 0; i < 3; i++) { const a = Sh.fan + i * 2.09, l = Math.cos(a) * 14; seg(fx + 16 - l, Y + 2.5 - Math.sin(a) * 1.4, fx + 16 + l, Y + 2.5 + Math.sin(a) * 1.4, 1, 'rgba(40,48,58,0.8)'); }
    rr(fx - 2, Y + 5, 36, 3, 1, dead ? '#2a2a2a' : '#46525f');
  }
  // fuselage
  const fg = ctx.createLinearGradient(0, Y + 8, 0, Y + 48); fg.addColorStop(0, dead ? '#3c3e42' : '#7f91a6'); fg.addColorStop(1, dead ? '#1c1d20' : '#2e3a48');
  ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(X, Y + 32); ctx.quadraticCurveTo(X + 2, Y + 14, X + 22, Y + 11); ctx.lineTo(X + 150, Y + 10); ctx.lineTo(X + 170, Y - 8); ctx.lineTo(X + 178, Y - 8); ctx.lineTo(X + 170, Y + 30); ctx.lineTo(X + 152, Y + 46); ctx.lineTo(X + 14, Y + 46); ctx.quadraticCurveTo(X + 2, Y + 42, X, Y + 32); ctx.fill();
  seg(X + 22, Y + 12, X + 150, Y + 11, 0.8, 'rgba(255,255,255,0.5)');
  if (!dead) { rr(X + 104, Y + 28, 44, 3.4, 1, '#d6b23a'); drawText('07', X + 120, Y + 33.5, '#e8edf2', 'left', 6); }
  // cockpit glass
  const cg = ctx.createLinearGradient(0, Y + 13, 0, Y + 25); cg.addColorStop(0, dead ? '#222' : '#9fe0ff'); cg.addColorStop(1, dead ? '#111' : '#1f4a66');
  ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(X + 7, Y + 25); ctx.quadraticCurveTo(X + 10, Y + 15, X + 22, Y + 14); ctx.lineTo(X + 40, Y + 14); ctx.lineTo(X + 40, Y + 25); ctx.closePath(); ctx.fill();
  // engine core window
  if (core.hp > 0) {
    const fl = core.flash > 0, hot = Sh.phase2;
    rr(core.x - 2, core.y - 2, core.w + 4, core.h + 4, 4, '#161b22');
    glow(core.x + core.w / 2, core.y + core.h / 2, 22, hot ? 'rgba(255,80,40,0.5)' : 'rgba(255,170,60,0.45)', 'rgba(0,0,0,0)');
    rr(core.x + 2, core.y + 3, core.w - 4, core.h - 6, 3, fl ? '#ffffff' : hot ? '#ff5a2a' : '#f0a030');
    for (let i = 0; i < 4; i++) seg(core.x + 6 + i * 8, core.y + 4, core.x + 6 + i * 8, core.y + core.h - 4, 1.2, 'rgba(30,20,20,0.5)');
  } else rr(core.x, core.y, core.w, core.h, 3, '#121212');
  // bomb bay
  if (bay.hp > 0) { const fl = bay.flash > 0, op = Sh.bombN > 0 ? 3 : 0; rr(bay.x, bay.y, bay.w, bay.h, 2, fl ? '#fff' : '#3a4654'); rr(bay.x + 3, bay.y + 3 + op, bay.w - 6, 5, 1, '#0e1216'); rr(bay.x + 3, bay.y + 3, bay.w / 2 - 4, 5 - op * 0.5, 1, fl ? '#fff' : '#56636f'); rr(bay.x + bay.w / 2 + 1, bay.y + 3, bay.w / 2 - 4, 5 - op * 0.5, 1, fl ? '#fff' : '#56636f'); }
  else rr(bay.x + 4, bay.y + 2, bay.w - 8, 6, 2, '#141414');
  // chin gun, pointed at you
  if (gunP.hp > 0) {
    const fl = gunP.flash > 0, gx = gunP.x + 9, gy = gunP.y + 7, a2 = dead ? 2.3 : aimAtPlayer(gx, gy);
    seg(gx, gy, gx + Math.cos(a2) * 13, gy + Math.sin(a2) * 13, 2.6, fl ? '#fff' : '#22282f');
    el(gx, gy, 7, 6.5, fl ? '#ffffff' : '#5b6876'); el(gx - 2, gy - 2, 2.6, 1.8, fl ? '#fff' : '#9aa6b2');
  } else el(gunP.x + 9, gunP.y + 6, 5, 4, '#1c1c1c');
  if (!dead) { el(X + 176, Y - 6, 1.4, 1.4, (t >> 4) % 2 ? '#ff4a2a' : '#7a1a10'); el(X + 4, Y + 34, 1.3, 1.3, '#9effa0'); }
  if (!dead && t % 10 < 5) for (const pt of Sh.parts) if (pt.hp <= 0) el(pt.x + pt.w / 2 + (t % 7) - 3, pt.y - (t % 12), 2.5, 2.5, 'rgba(120,110,110,0.7)');
  if (G.freezeT > 0 && !dead) for (const pt of Sh.parts) if (pt.hp > 0) ice(pt);
}
function drawDrone() {
  const p = G.p; if (!(p.droneT > 0) || p.dead || p.dx2 === undefined) return;
  if (p.droneT < 2 && (G.t >> 2) % 2) return;
  const x = p.dx2, y = p.dy2;
  seg(x - 6, y - 2, x + 6, y + 2, 1, '#3a4450'); seg(x + 6, y - 2, x - 6, y + 2, 1, '#3a4450');
  ctx.save(); ctx.globalAlpha = 0.45; for (const dx of [-6, 6]) el(x + dx, y - 2.5, 4, 1, '#c8d6e4'); ctx.restore();
  rr(x - 3.5, y - 2, 7, 4.4, 1.6, '#5a6878'); rr(x - 2.6, y - 1.6, 5.2, 1.2, 0.6, '#9aa8b8'); el(x, y + 2.6, 1, 1, '#7dff8a');
}
function drawHangarBg(cx) {
  const o1 = -Math.round((cx * 0.12 % 768) * R) / R; ctx.drawImage(HANG_BG, o1, 0, 768, H); ctx.drawImage(HANG_BG, o1 + 768, 0, 768, H);
  const o2 = -Math.round((cx * 0.42 % 768) * R) / R; ctx.drawImage(HANG_MID, o2, 0, 768, H); ctx.drawImage(HANG_MID, o2 + 768, 0, 768, H);
}
function drawHangarGround(cx) {
  // open shafts between floor slabs
  const gs = solids.filter(q => q.g).sort((q1, q2) => q1.x - q2.x);
  for (let i = 0; i + 1 < gs.length; i++) {
    const a = gs[i].x + gs[i].w, b = gs[i + 1].x;
    if (b - a < 1 || b < cx - 4 || a > cx + W + 4) continue;
    const sg = ctx.createLinearGradient(0, 172, 0, H); sg.addColorStop(0, '#1c2633'); sg.addColorStop(0.4, '#0b1018'); sg.addColorStop(1, '#020305');
    ctx.fillStyle = sg; ctx.fillRect(a, 172, b - a, H - 172);
    for (const rx of [a + 4, b - 6]) { rr(rx, 176, 2, H - 176, 0.5, '#2c3846'); for (let yy = 182; yy < H; yy += 9) el(rx + 1, yy, 1, 1, '#45525f'); }
    el(a + (b - a) * 0.3, 204, 1.6, 1.6, '#a83a2a'); el(a + (b - a) * 0.7, 210, 1.6, 1.6, '#a83a2a');
  }
  for (const s2 of solids) {
    if (s2.x + s2.w < cx - 2 || s2.x > cx + W + 2) continue;
    const x0 = Math.max(s2.x, cx - 8), x1 = Math.min(s2.x + s2.w, cx + W + 8);
    if (s2.g) {
      ctx.save(); ctx.beginPath(); ctx.rect(s2.x, s2.y, s2.w, s2.h); ctx.clip();
      const gr = ctx.createLinearGradient(0, s2.y, 0, s2.y + s2.h); gr.addColorStop(0, '#3e4a5a'); gr.addColorStop(1, '#141a22');
      ctx.fillStyle = gr; ctx.fillRect(x0, s2.y, x1 - x0, s2.h);
      for (let by2 = s2.y + 9, row = 0; by2 < s2.y + s2.h; by2 += 14, row++) {
        const off = row % 2 ? 14 : 0;
        for (let bx2 = Math.floor((x0 - s2.x - off) / 28) * 28 + s2.x + off; bx2 < x1; bx2 += 28) {
          const r = hash(bx2 * 13 + by2 * 7), base = r < 0.5 ? '#3c4858' : '#435062';
          rr(bx2 + 0.7, by2 + 0.7, 26.6, 12.6, 2, base); rr(bx2 + 1.6, by2 + 1.4, 24.8, 1.6, 0.8, shade(base, 0.22));
          for (const [rx2, ry2] of [[3, 3.5], [24, 3.5], [3, 10], [24, 10]]) el(bx2 + rx2, by2 + ry2, 0.8, 0.8, '#1e2630');
        }
      }
      if (s2.conv) {
        // conveyor belt: rollers and moving chevrons that show which way it pulls
        rr(x0, s2.y, x1 - x0, 8, 0, '#202328');
        for (let rx2 = Math.floor(x0 / 10) * 10; rx2 < x1; rx2 += 10) el(rx2 + 5, s2.y + 7.6, 2.4, 1.2, '#4a525c');
        const d = Math.sign(s2.conv), offs = ((G.time * s2.conv) % 14 + 14) % 14;
        ctx.strokeStyle = 'rgba(226,184,50,0.85)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
        for (let ax2 = Math.floor((x0 - 14) / 14) * 14 + offs; ax2 < x1 + 14; ax2 += 14) { if (ax2 < s2.x + 2 || ax2 > s2.x + s2.w - 4) continue; ctx.moveTo(ax2 - d * 2, s2.y + 1.6); ctx.lineTo(ax2 + d * 1.5, s2.y + 3.6); ctx.lineTo(ax2 - d * 2, s2.y + 5.6); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x0, s2.y, x1 - x0, 0.7);
      } else {
        const dg = ctx.createLinearGradient(0, s2.y, 0, s2.y + 7); dg.addColorStop(0, '#9aa6b6'); dg.addColorStop(1, '#566272');
        ctx.fillStyle = dg; ctx.fillRect(x0, s2.y, x1 - x0, 7);
        ctx.fillStyle = 'rgba(242,194,48,0.85)'; ctx.fillRect(x0, s2.y + 5.2, x1 - x0, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x0, s2.y, x1 - x0, 0.7);
      }
      ctx.restore();
    } else {
      if (s2.mv) {
        // lift: hangs from an overhead rail (x) or from cables (y)
        if (s2.mv.ax === 'x') { seg(s2.bx - s2.mv.amp, 30, s2.bx + s2.mv.amp + s2.w, 30, 2, '#3a4654'); seg(s2.x + 6, 31, s2.x + 6, s2.y, 0.7, '#6a7684'); seg(s2.x + s2.w - 6, 31, s2.x + s2.w - 6, s2.y, 0.7, '#6a7684'); rr(s2.x + 2, 27, 8, 6, 1.5, '#4a5664'); rr(s2.x + s2.w - 10, 27, 8, 6, 1.5, '#4a5664'); }
        else { seg(s2.x + 8, 0, s2.x + 8, s2.y, 0.8, '#6a7684'); seg(s2.x + s2.w - 8, 0, s2.x + s2.w - 8, s2.y, 0.8, '#6a7684'); }
        const lg = ctx.createLinearGradient(0, s2.y, 0, s2.y + 8); lg.addColorStop(0, '#a6b2c0'); lg.addColorStop(1, '#4a5664');
        rr(s2.x, s2.y, s2.w, 8, 2, lg);
        ctx.save(); ctx.beginPath(); ctx.rect(s2.x, s2.y + 5, s2.w, 3); ctx.clip(); ctx.fillStyle = '#f2c230'; ctx.fillRect(s2.x, s2.y + 5, s2.w, 3); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); for (let k = -4; k < s2.w + 4; k += 4) { ctx.moveTo(s2.x + k, s2.y + 8); ctx.lineTo(s2.x + k + 3, s2.y + 5); } ctx.stroke(); ctx.restore();
        el(s2.x + 8, s2.y + 9.4, 2, 1, '#7fe6ff'); el(s2.x + s2.w - 8, s2.y + 9.4, 2, 1, '#7fe6ff');
      } else {
        ctx.strokeStyle = '#56606c'; ctx.lineWidth = 0.7; ctx.beginPath();
        for (let px = s2.x + 2; px <= s2.x + s2.w - 1; px += 16) { ctx.moveTo(px, s2.y); ctx.lineTo(px, s2.y - 10); }
        ctx.moveTo(s2.x + 1, s2.y - 10); ctx.lineTo(s2.x + s2.w - 1, s2.y - 10); ctx.moveTo(s2.x + 1, s2.y - 5); ctx.lineTo(s2.x + s2.w - 1, s2.y - 5); ctx.stroke();
        const gr = ctx.createLinearGradient(0, s2.y, 0, s2.y + 8); gr.addColorStop(0, '#8894a2'); gr.addColorStop(1, '#36404c');
        ctx.fillStyle = gr; if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(s2.x, s2.y, s2.w, 7, [0, 0, 2, 2]); ctx.fill(); } else ctx.fillRect(s2.x, s2.y, s2.w, 7);
        for (let gx = s2.x + 3; gx < s2.x + s2.w - 3; gx += 4) rr(gx, s2.y + 2.4, 2.4, 3, 0.4, '#222a33');
        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(s2.x, s2.y, s2.w, 0.7);
      }
    }
  }
}

// =====================================================================
// STAGE 8 · 异形巢穴 (final): an organic hive. Acid drips form on the ceiling and fall, acid fills the
// pits, egg sacs hatch hopping larvae, and the hive heart waits behind its ribs at the far end.
// =====================================================================
function larva(x, y, vx, vy) { return { t: 'larva', x, y, vx, vy, hp: 1, on: false, hopT: 0.5 + rnd() * 0.4, flash: 0, anim: rnd() * 4,face:Math.sign(vx)||-1,hopAirT:0,landT:0 }; }
function initStage8() {
  G.en = []; G.pods = []; G.items = []; G.camX = 0; G.camY = 0;
  for (const [x, y] of SNIPERS8) G.en.push({ t: 'snp', x, y, hp: 2, fireT: 1 + rnd(), face: -1, ax: -1, ay: 0, flash: 0 });
  BOXES8.forEach(([x, item], i) => G.en.push({ t: 'box', x, y: 176, hp: 4, item, open: false, st: 0.8 + i * 0.35, flash: 0 }));
  for (const [x, y] of TURRETS8) G.en.push({ t: 'tur', x, y: y - 16, hp: 6, idx: 6, rotT: 0, fireT: 0.9, flash: 0 });
  for (const x of SACS8) G.en.push({ t: 'sac', x, y: 176, hp: 8, spawnT: 1.5 + rnd(), puls: 0, flash: 0 });
  G.en.push(...createCeilingParasites(),...createFloorParasites(),...createCeilingStalkers());
  G.podTrig = PODS8.map(t => ({ ...t, done: false }));
  G.s8 = { tissueTime:0, drips: ACID8.map(d => ({ ...d, k: 0, forming: false })), drops: [], spikes: [] };
  const B = LEVEL_W8 - 150;
  G.hive = { x: B, active: false, dead: false, deadT: 0, open: false, openK: 0, rage: false, beatK: 0, beatT: 1, mawK: 0, spikeT: 1.2, burstT: 3, parts:createHiveBrainParts(B) };
}
function initStage7Alien(){
  initStage8();G.ship=null;G.s7={};
  // The reference cavern's horned guardian appears midway through the route.
  const guardian=createAlienGuardian();G.en.push(guardian);
  G.s8.guardianWall=createAlienGuardianWall(guardian);solids.push(G.s8.guardianWall);
  const supply=G.en.find(e=>e.t==='box'&&e.x===1050);if(supply)supply.x=G.s8.guardianWall.x-36;
}
function inHive(x, y) {
  return hiveShotBlocked(G.hive,x,y);
}
function hitHive(pt, dmg) {
  const Hv = G.hive;
  if (pt.hp <= 0 || Hv.dead) return;
  if (pt.k === 'heart' && !Hv.open) { tone(110, 0.05, 'triangle', 0.08, 70); return; } // behind the ribs
  pt.hp -= dmg || 1; pt.flash = 0.06; sfx.hit();
  if (pt.k === 'heart' && !Hv.rage && pt.hp <= pt.max / 2) { Hv.rage = true; banner('母巢暴怒 · 酸雨落下', 1.6); }
  if (pt.hp > 0) return;
  boom(pt.x + pt.w / 2, pt.y + pt.h / 2, 18); sfx.big(); shake(4);
  if (pt.k === 'heart') {
    Hv.dead = true; Hv.deadT = 4.5; addScore(30000);
    for (const e of G.en) if (!e.dead) { e.dead = true; boom(e.x, e.y - 10, 6); }
    G.eb.length = 0; G.s8.drops.length = 0; G.s8.spikes.length = 0; Music.stop(); banner('母巢覆灭 · 任务完成', 3.5);
  } else {
    pt.phase='destroyed';addScore(1500);
    if (hiveBroodRemaining(Hv)===0) { Hv.open = true; Hv.spikeT = 1.4; banner('四个孵化机关已摧毁 · 大脑暴露', 1.8); sfx.wreck(); }
  }
}
const spikeH = hiveSpikeHeight;
function updateStage8() {
  const p = G.p, S = G.s8, Hv = G.hive, frozen = G.freezeT > 0;
  if(!frozen)S.tissueTime=(S.tissueTime||0)+DT;
  const pb = pBox(p), safe = p.acidT > 0;
  // acid drips: a drop swells on the ceiling, then falls
  for (const d of S.drips) {
    if (d.boss && !(Hv.active && Hv.rage && !Hv.dead)) { d.k = 0; d.forming = false; continue; }
    const u = ((S.tissueTime + d.off) % d.per + d.per) % d.per, fs = d.per - 0.9;
    if (u >= fs) { if (!frozen) { d.forming = true; d.k = (u - fs) / 0.9; } }
    else if(!frozen) { if (d.forming) S.drops.push({ x: d.x, y: 31, vy: 0, age:0 }); d.forming = false; d.k = 0; }
  }
  for (const dr of S.drops) {
    if(frozen)continue;
    const y0 = dr.y; dr.age=(dr.age||0)+DT;dr.vy = Math.min(dr.vy + 520 * DT, 300); dr.y += dr.vy * DT;
    const s2 = findLand(dr.x, y0, dr.y, 1, false);
    if (s2 || dr.y > G.camY + 240) { dr.dead = true; if (s2) { dr.y = s2.y;G.fx.push({k:'slimeSplash',x:dr.x,y:s2.y,t:0,life:1.1}); if (onScreen(dr.x, 0)) noise(0.08, 0.05, 2400, 0, 0, true); } continue; }
    if (pb && !p.dead && !safe && overlap(pb, { x: dr.x - 2, y: dr.y - 5, w: 4, h: 7 })) { dr.dead = true; killPlayer(); }
  }
  sweep(S.drops);
  // tentacle spikes bursting out of the floor
  for (const sp of S.spikes) {
    if (!frozen) sp.t += DT;
    if (sp.t > 1.8) { sp.dead = true; continue; }
    const h = spikeH(sp);
    if (h > 8 && pb && !p.dead && overlap(pb, { x: sp.x - 5, y: 176 - h, w: 10, h })) killPlayer();
  }
  sweep(S.spikes);
  // the hive heart
  for (const pt of Hv.parts) if (pt.flash > 0) pt.flash -= DT;
  Hv.openK = Math.max(0, Math.min(1, Hv.openK + (Hv.open ? DT * 1.2 : -DT)));
  if(!frozen){Hv.tissueTime=(Hv.tissueTime||0)+DT;Hv.mawK = Math.max(0, Hv.mawK - DT * 2); Hv.beatK = Math.max(0, Hv.beatK - DT * 3);}
  if (!Hv.active && G.camX >= CAM_MAX - 0.5) { Hv.active = true; banner('警告 · 母巢大脑', 2.2); Music.start(true, 5); }
  if (Hv.dead) {
    Hv.deadT -= DT;
    if (rnd() < 0.4) { boom(Hv.x + rnd() * 150, 10 + rnd() * 160, 8 + (rnd() * 12 | 0)); if (rnd() < 0.4) sfx.boom(); }
    shake(3);
    if (Hv.deadT < 0.4 && !Hv.flashed) { Hv.flashed = true; G.flashT = 0.35; sfx.big(); }
    if (Hv.deadT <= 0) stageClear();
    return;
  }
  if (!Hv.active || frozen) return;
  // heartbeat
  Hv.beatT -= DT;
  if (Hv.beatT <= 0) { Hv.beatT = Hv.rage ? 0.65 : 1.0; Hv.beatK = 1; tone(55, 0.16, 'sine', 0.3, 38); }
  const heart=Hv.parts[2],target=stageOneTarget(Hv.x);
  if (!target) return;
  if (!Hv.open) {
    const brood=advanceHiveBrood(Hv,DT,G.en,{active:true});for(const child of brood){G.en.push(child);sfx.eshot();}
  } else {
    Hv.spikeT -= DT;
    if (Hv.spikeT <= 0) {
      Hv.spikeT = Hv.rage ? 1.4 : 2.2;
      const clampX = x => Math.max(G.camX + 12, Math.min(Hv.x - 26, x));
      S.spikes.push({ x: clampX(target.x), t: 0 });
      if (Hv.rage) S.spikes.push({ x: clampX(target.x + (rnd() < 0.5 ? -1 : 1) * 56), t: 0 });
      tone(90, 0.4, 'sawtooth', 0.05, 50);
    }
    if (Hv.rage) { Hv.burstT -= DT; if (Hv.burstT <= 0) { Hv.burstT = 2.8; const hx = heart.x + 25, hy = heart.y + 25; for (let i = 0; i < 10; i++) { const a2 = Math.PI * 0.5 + i * Math.PI / 9; ebullet(hx, hy, Math.cos(a2) * 85, Math.sin(a2) * 85); } sfx.eshot(); } }
  }
  if (pb && overlap(pb, { x: Hv.x + 4, y: 0, w: 150, h: 176 })) killPlayer();
}
// ---------- stage 8 drawing ----------
function drawCrawler(e) {
  const fl = e.flash > 0, f = Math.sign(e.vx) || -1;
  ctx.save(); ctx.translate(e.x, e.y); ctx.scale(f, 1);
  for (let i = 0; i < 4; i++) {
    const ph = e.anim * 1.6 + i * Math.PI / 2, bx2 = -5 + i * 3.4, fx2 = -8 + i * 5 + Math.sin(ph) * 2, kx = (bx2 + fx2) / 2 - 1, ky = -6 - Math.abs(Math.cos(ph)) * 2;
    seg(bx2, -10, kx, ky, 1.5, '#22101e'); seg(kx, ky, fx2, -0.6, 1.2, '#22101e');
  }
  seg(-8, -13, -14, -18, 1.8, fl ? '#fff' : '#3a1838'); el(-14.5, -18.5, 1.2, 1.2, '#b8f060');
  el(0, -12, 9, 6.6, fl ? '#ffffff' : '#4a2448'); el(-2, -15, 5.4, 2.6, fl ? '#fff' : '#7a4a78');
  ctx.strokeStyle = 'rgba(20,6,18,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); for (const ax2 of [-4, 0, 4]) { ctx.moveTo(ax2, -18); ctx.quadraticCurveTo(ax2 + 1.5, -12, ax2, -6); } ctx.stroke();
  el(8.5, -11, 4.4, 3.6, fl ? '#fff' : '#3a1838'); seg(11, -9.5, 13.5, -8, 0.9, '#d8cfb8'); seg(11, -11.5, 13.5, -12.5, 0.9, '#d8cfb8');
  glow(10, -12, 3.2, 'rgba(160,255,120,0.7)', 'rgba(160,255,120,0)'); el(10, -12, 1.2, 1.2, '#c8ff90');
  ctx.restore();
}
function drawSpitter(e) {
  const fl = e.flash > 0, x = e.x, y = e.y;
  el(x, y - 1.5, 8, 2.6, '#2a0c24'); seg(x - 6, y - 1, x - 9, y + 1, 1, '#2a0c24'); seg(x + 6, y - 1, x + 9, y + 1, 1, '#2a0c24');
  seg(x, y - 2, x + e.ax * 1.5, y - 15, 4.2, fl ? '#fff' : '#5a2a52');
  const hx = x + e.ax * 2.4, hy = y - 21 + e.ay * 1.5;
  for (const a of [-2.3, -1.57, -0.85]) el(hx + Math.cos(a) * 6, hy + Math.sin(a) * 6, 2.6, 1.6, fl ? '#fff' : '#9a4a7a');
  el(hx, hy, 7, 6.2, fl ? '#ffffff' : '#7a3a6a'); el(hx - 2, hy - 2.4, 3, 1.8, fl ? '#fff' : '#a86a98');
  const mx = hx + e.ax * 5.4, my = hy + e.ay * 4.6;
  glow(mx, my, 4.5, 'rgba(190,240,100,0.6)', 'rgba(190,240,100,0)'); el(mx, my, 2.4, 2, '#1a0612');
}
function drawEyePod(e) {
  const fl = e.flash > 0, x = e.x, y = e.y;
  el(x, y + 11, 12, 7, '#3a1632'); el(x - 3, y + 8, 6, 3, '#5a2a52');
  el(x, y, 9, 8.4, fl ? '#ffffff' : '#e8dcae');
  ctx.strokeStyle = 'rgba(180,40,60,0.7)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x - 8, y - 2); ctx.quadraticCurveTo(x - 5, y, x - 3, y - 1); ctx.moveTo(x + 8, y + 2); ctx.quadraticCurveTo(x + 5, y + 1, x + 3, y + 2); ctx.stroke();
  const a = e.idx * Math.PI / 6, ix = x + Math.cos(a) * 3.4, iy = y + Math.sin(a) * 3.2;
  el(ix, iy, 3.8, 3.8, fl ? '#fff' : '#3ab85a'); el(ix, iy, 1.2, 2.8, '#060606'); el(ix - 1.2, iy - 1.4, 0.8, 0.8, 'rgba(255,255,255,0.8)');
  ctx.strokeStyle = '#3a1632'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y + 1, 9.4, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
}
function drawCocoon(e) {
  const fl = e.flash > 0, x = e.x, y = e.y;
  if (!e.open) { el(x, y - 6, 10.5, 6.6, fl ? '#fff' : '#6a4a5a'); for (const d of [-5, 0, 5]) seg(x + d - 2, y - 11, x + d + 1, y - 1, 0.7, '#3a2430'); el(x - 3, y - 9, 4, 1.6, 'rgba(255,230,240,0.35)'); return; }
  glow(x, y - 12, 12, 'rgba(190,240,100,0.5)', 'rgba(190,240,100,0)'); el(x, y - 12, 5, 8, fl ? '#fff' : '#c8f060');
  el(x - 7, y - 10, 4, 10, fl ? '#fff' : '#6a4a5a'); el(x + 7, y - 10, 4, 10, fl ? '#fff' : '#6a4a5a');
}
function drawSac(e) {
  const fl = e.flash > 0, x = e.x, y = e.y, k = 1 + 0.05 * Math.sin(G.t * 0.06 + x) + (e.puls > 0 ? 0.08 : 0);
  el(x, y - 1.5, 9, 2.6, '#2a0c24');
  el(x, y - 10.5 * k, 11 * k, 10.5 * k, fl ? '#ffffff' : 'rgba(190,110,150,0.75)');
  for (const [dx, dy] of [[-3.5, -12], [3, -9], [-1, -6]]) el(x + dx * k, y + dy * k, 2.6, 1.6, 'rgba(40,10,30,0.55)');
  ctx.strokeStyle = 'rgba(120,30,60,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x - 9, y - 4); ctx.quadraticCurveTo(x - 4, y - 14, x + 2, y - 19); ctx.moveTo(x + 9, y - 5); ctx.quadraticCurveTo(x + 5, y - 12, x + 1, y - 19); ctx.stroke();
  el(x - 4, y - 15 * k, 3, 2, 'rgba(255,230,240,0.55)');
}
function drawLarva(e) {
  const fl = e.flash > 0, f = e.vx ? Math.sign(e.vx) : (G.p.x < e.x ? -1 : 1), x = e.x, y = e.y;
  for (let i = 0; i < 3; i++) seg(x - 3 + i * 2.6, y - 2, x - 3.6 + i * 2.6 + Math.sin(e.anim + i) * 0.8, y, 0.7, '#5a4232');
  el(x, y - 3.6, 5, 3.2, fl ? '#fff' : '#cdb89c'); for (const d of [-2, 0, 2]) seg(x + d, y - 6.4, x + d, y - 0.8, 0.5, 'rgba(90,66,50,0.6)');
  el(x + f * 4.2, y - 4, 2.3, 2.1, fl ? '#fff' : '#8a6a52'); el(x + f * 5.2, y - 4.6, 0.6, 0.6, '#1a0a0a');
}
function drawAlien(e) {
  if (e.t === 'run') drawCrawler(e);
  else if (e.t === 'snp') drawSpitter(e);
  else if (e.t === 'tur') drawEyePod(e);
  else if (e.t === 'box') drawCocoon(e);
  else if (e.t === 'sac') drawSac(e);
  else if (e.t === 'larva') drawLarva(e);
}
function drawHive() {
  const Hv = G.hive; if (!Hv || Hv.x > G.camX + W + 20) return;
  const B = Hv.x, t = G.t, dead = Hv.dead, [eye, maw, heart] = Hv.parts, p = G.p;
  // flesh wall
  const wg = ctx.createLinearGradient(B, 0, B + 150, 0); wg.addColorStop(0, dead ? '#2a1424' : '#5a1e48'); wg.addColorStop(1, dead ? '#120610' : '#1c0818');
  ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(B + 160, -2); ctx.lineTo(B + 10, -2);
  for (let y = 0; y <= 178; y += 6) ctx.lineTo(B + 6 + Math.sin(y * 0.09) * 5 + Math.sin(y * 0.23 + 1) * 2, y);
  ctx.lineTo(B + 160, 178); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(30,8,26,0.8)'; ctx.lineWidth = 2;
  for (let fx2 = B + 26; fx2 < B + 150; fx2 += 18) { ctx.beginPath(); ctx.moveTo(fx2, 0); for (let y = 0; y <= 176; y += 8) ctx.lineTo(fx2 + Math.sin(y * 0.07 + fx2) * 3, y); ctx.stroke(); }
  ctx.strokeStyle = dead ? 'rgba(80,30,40,0.5)' : `rgba(170,40,80,${0.45 + Hv.beatK * 0.3})`; ctx.lineWidth = 1.2; ctx.beginPath();
  ctx.moveTo(B + 10, 20); ctx.bezierCurveTo(B + 40, 40, B + 30, 70, B + 60, 84); ctx.moveTo(B + 12, 170); ctx.bezierCurveTo(B + 40, 150, B + 36, 130, B + 62, 128); ctx.moveTo(B + 140, 30); ctx.bezierCurveTo(B + 110, 60, B + 120, 90, B + 92, 100); ctx.stroke();
  // heart cavity, heart and ribs
  const hx = heart.x + 25, hy = heart.y + 25;
  el(hx, hy, 34, 32, '#120410');
  if (heart.hp > 0) {
    const sc = 1 + 0.07 * Hv.beatK, fl = heart.flash > 0;
    if (Hv.openK > 0.05) glow(hx, hy, 40, `rgba(255,60,90,${0.35 * Hv.openK})`, 'rgba(255,40,60,0)');
    ctx.save(); ctx.translate(hx, hy); ctx.scale(sc, sc);
    const hg = ctx.createRadialGradient(-6, -6, 2, 0, 0, 26); hg.addColorStop(0, fl ? '#fff' : '#ff6a7a'); hg.addColorStop(0.5, fl ? '#fff' : Hv.rage ? '#e01838' : '#c8203a'); hg.addColorStop(1, fl ? '#fff' : '#5a0816');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(0, 20); ctx.bezierCurveTo(-28, 2, -22, -24, 0, -11); ctx.bezierCurveTo(22, -24, 28, 2, 0, 20); ctx.fill();
    seg(-5, -13, -9, -24, 3.4, '#8a1a2a'); seg(5, -13, 10, -23, 3.4, '#8a1a2a'); seg(0, -12, 1, -25, 2.6, '#a8243a');
    el(-8, -6, 4, 2.6, 'rgba(255,220,230,0.5)');
    ctx.restore();
  } else el(hx, hy, 20, 18, '#2a0610');
  const ok = Hv.openK;
  for (let i = 0; i < 4; i++) {
    const ry = heart.y - 2 + i * 15, len = 30 * (1 - ok);
    if (len < 1) continue;
    seg(heart.x - 8, ry, heart.x - 8 + len, ry + 3, 4.6, '#8a7e66'); seg(heart.x - 8, ry - 0.8, heart.x - 8 + len, ry + 2.2, 2.4, '#e4dcc4');
    seg(heart.x + heart.w + 8, ry, heart.x + heart.w + 8 - len, ry + 3, 4.6, '#8a7e66'); seg(heart.x + heart.w + 8, ry - 0.8, heart.x + heart.w + 8 - len, ry + 2.2, 2.4, '#e4dcc4');
  }
  // eye
  const ex = eye.x + 19, ey = eye.y + 17;
  el(ex, ey, 21, 19, '#3a1030');
  if (eye.hp > 0) {
    const fl = eye.flash > 0, a = Math.atan2(p.y - 16 - ey, p.x - ex);
    el(ex, ey, 17, 14.5, fl ? '#fff' : '#e6d8a8');
    ctx.strokeStyle = 'rgba(180,40,60,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(ex - 16, ey - 3); ctx.quadraticCurveTo(ex - 10, ey, ex - 7, ey - 2); ctx.moveTo(ex + 15, ey + 4); ctx.quadraticCurveTo(ex + 10, ey + 2, ex + 7, ey + 3); ctx.moveTo(ex - 6, ey + 12); ctx.lineTo(ex - 3, ey + 7); ctx.stroke();
    const ix = ex + Math.cos(a) * 6, iy = ey + Math.sin(a) * 5;
    const ig = ctx.createRadialGradient(ix, iy, 1, ix, iy, 7.5); ig.addColorStop(0, fl ? '#fff' : '#a8ff7a'); ig.addColorStop(1, fl ? '#fff' : '#2a8a3a');
    el(ix, iy, 7.5, 7.5, ig); el(ix, iy, 2, 5.6, '#050505'); el(ix - 2.4, iy - 2.6, 1.4, 1.2, 'rgba(255,255,255,0.8)');
    ctx.strokeStyle = '#3a1030'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(ex, ey, 18, 15.5, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  } else { el(ex, ey, 12, 10, '#2a0610'); el(ex, ey + 9, 2, 4, '#5a1020'); }
  // maw
  const mx = maw.x + 21, my = maw.y + 16;
  if (maw.hp > 0) {
    const fl = maw.flash > 0, op = 4 + Hv.mawK * 9;
    el(mx, my, 21, 15, fl ? '#fff' : '#6a1e44'); el(mx, my, 16, op, '#14040e');
    ctx.fillStyle = '#e4dcc4'; ctx.beginPath();
    for (let i = 0; i < 6; i++) { const tx = mx - 13 + i * 5.2; ctx.moveTo(tx, my - op + 0.5); ctx.lineTo(tx + 1.6, my - op + 4.5); ctx.lineTo(tx + 3.2, my - op + 0.5); ctx.moveTo(tx + 1, my + op - 0.5); ctx.lineTo(tx + 2.6, my + op - 4.5); ctx.lineTo(tx + 4.2, my + op - 0.5); }
    ctx.fill();
    if (Hv.mawK > 0.2) glow(mx, my, 10, 'rgba(190,240,100,0.5)', 'rgba(190,240,100,0)');
  } else { el(mx, my, 16, 8, '#2a0610'); }
  if (!dead && t % 10 < 5) for (const pt of Hv.parts) if (pt.hp <= 0) el(pt.x + pt.w / 2 + (t % 7) - 3, pt.y - (t % 12), 2.5, 2.5, 'rgba(120,90,100,0.7)');
  if (G.freezeT > 0 && Hv.active && !dead) for (const pt of Hv.parts) if (pt.hp > 0) ice(pt);
}
function drawLairHazards() {
  const S = G.s8;
  for (const d of S.drips) {
    if (!onScreen(d.x, 20)) continue;
    el(d.x, 13, 6, 4, '#4a1a3c'); el(d.x - 1.5, 12, 2.4, 1.4, '#6a2a5a');
    if (d.k > 0) { const k = d.k; glow(d.x, 18 + k * 4, 5 + k * 4, `rgba(170,240,90,${0.3 + k * 0.3})`, 'rgba(170,240,90,0)'); el(d.x, 17 + k * 3.4, 1.2 + k * 1.6, 1.6 + k * 2.6, 'rgba(184,240,96,0.95)'); }
  }
  for (const dr of S.drops) { glow(dr.x, dr.y - 2, 6, 'rgba(170,240,90,0.45)', 'rgba(170,240,90,0)'); el(dr.x, dr.y - 2, 1.9, 3.6, '#b8f060'); el(dr.x - 0.5, dr.y - 3.4, 0.6, 1, '#f0ffd0'); }
  for (const sp of S.spikes) {
    const x = sp.x;
    if (sp.t < 0.8) {
      const k = sp.t / 0.8;
      el(x, 176, 8 + k * 3, 1.6 + k * 2.4, '#5a2a52');
      ctx.strokeStyle = `rgba(190,240,100,${0.35 + 0.5 * k})`; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x - 7, 176); ctx.lineTo(x - 2, 174); ctx.lineTo(x + 1, 176.5); ctx.moveTo(x + 2, 174.5); ctx.lineTo(x + 7, 176); ctx.stroke();
      continue;
    }
    const h = spikeH(sp); if (h < 1) continue;
    const w = Math.sin(G.t * 0.1 + x) * 2;
    const tg = ctx.createLinearGradient(0, 176 - h, 0, 176); tg.addColorStop(0, '#9a4a8a'); tg.addColorStop(1, '#2a0c24');
    ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(x - 6, 176); ctx.quadraticCurveTo(x - 5, 176 - h * 0.5, x + w, 176 - h); ctx.quadraticCurveTo(x + 5, 176 - h * 0.5, x + 6, 176); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(30,6,24,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); for (let k = 0.2; k < 0.9; k += 0.2) { const yy = 176 - h * k, ww = 6 * (1 - k * 0.9); ctx.moveTo(x - ww + w * k, yy); ctx.lineTo(x + ww + w * k, yy + 1); } ctx.stroke();
    el(x + w, 176 - h + 2, 1.4, 1.4, '#c8ff90'); el(x, 176, 9, 2.2, '#3a1632');
  }
}
function drawLairBg(cx) {
  const o1 = -Math.round((cx * 0.12 % 768) * R) / R; ctx.drawImage(LAIR_BG, o1, 0, 768, H); ctx.drawImage(LAIR_BG, o1 + 768, 0, 768, H);
  const o2 = -Math.round((cx * 0.42 % 768) * R) / R; ctx.drawImage(LAIR_MID, o2, 0, 768, H); ctx.drawImage(LAIR_MID, o2 + 768, 0, 768, H);
}
function drawLairGround(cx) {
  // acid pools in the pits
  const gs = solids.filter(q => q.g).sort((q1, q2) => q1.x - q2.x);
  for (let i = 0; i + 1 < gs.length; i++) {
    const a = gs[i].x + gs[i].w, b = gs[i + 1].x;
    if (b - a < 1 || b < cx - 4 || a > cx + W + 4) continue;
    glow((a + b) / 2, 188, (b - a) * 0.8, 'rgba(160,240,80,0.35)', 'rgba(160,240,80,0)');
    const lg = ctx.createLinearGradient(0, 186, 0, H); lg.addColorStop(0, '#d8ff8a'); lg.addColorStop(0.15, '#8fdc3a'); lg.addColorStop(0.6, '#3a7a1a'); lg.addColorStop(1, '#0e2606');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(a, H);
    for (let x = a; x <= b; x += 2) ctx.lineTo(x, 189 + Math.sin((x + G.t * 0.3) / 8) * 1.1);
    ctx.lineTo(b, H); ctx.closePath(); ctx.fill();
    for (let x = a + 6; x < b - 4; x += 13) { const r = hash(x * 5 + a); el(x + r * 5, 195 + r * 10, 1.6 + r * 1.4, 1.2 + r, 'rgba(230,255,180,0.45)'); }
  }
  // fleshy ceiling with stalactites (the acid drips hang from it)
  ctx.fillStyle = '#2a0c22'; ctx.fillRect(cx - 8, 0, W + 16, 10);
  ctx.fillStyle = '#3a1430'; ctx.beginPath();
  for (let x = Math.floor((cx - 16) / 14) * 14; x < cx + W + 16; x += 14) { const r = hash(x * 3 + 11); ctx.moveTo(x, 9); ctx.quadraticCurveTo(x + 7, 12 + r * 12, x + 14, 9); }
  ctx.fill();
  for (const s2 of solids) {
    if (s2.x + s2.w < cx - 2 || s2.x > cx + W + 2) continue;
    const x0 = Math.max(s2.x, cx - 8), x1 = Math.min(s2.x + s2.w, cx + W + 8);
    if (s2.g) {
      ctx.save(); ctx.beginPath(); ctx.rect(s2.x, s2.y - 3, s2.w, s2.h + 3); ctx.clip();
      const gr = ctx.createLinearGradient(0, s2.y, 0, s2.y + s2.h); gr.addColorStop(0, '#3a1632'); gr.addColorStop(1, '#0e040c');
      ctx.fillStyle = gr; ctx.fillRect(x0, s2.y, x1 - x0, s2.h);
      for (let by2 = s2.y + 10, row = 0; by2 < s2.y + s2.h + 6; by2 += 11, row++) {
        const off = row % 2 ? 8 : 0;
        for (let bx2 = Math.floor((x0 - s2.x - off) / 16) * 16 + s2.x + off; bx2 < x1 + 8; bx2 += 16) {
          const r = hash(bx2 * 13 + by2 * 7), base = r < 0.5 ? '#4a1e40' : '#55244c';
          el(bx2 + 8, by2 + 4, 7.4, 4.6, base); el(bx2 + 6, by2 + 2.4, 3.4, 1.4, shade(base, 0.25));
        }
      }
      const mg = ctx.createLinearGradient(0, s2.y - 2, 0, s2.y + 7); mg.addColorStop(0, '#9a5a8a'); mg.addColorStop(1, '#4a1e40');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.moveTo(x0, s2.y + 7);
      for (let x = x0; x <= x1; x += 4) ctx.lineTo(x, s2.y - 0.6 + Math.sin(x * 0.21) * 0.6);
      ctx.lineTo(x1, s2.y + 7); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,240,0.35)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x0, s2.y + 0.6); ctx.lineTo(x1, s2.y + 0.6); ctx.stroke();
      ctx.strokeStyle = 'rgba(190,50,90,0.55)'; ctx.lineWidth = 0.6; ctx.beginPath();
      for (let vx = Math.floor(x0 / 37) * 37; vx < x1; vx += 37) { const r = hash(vx * 7); ctx.moveTo(vx, s2.y + 2 + r * 3); ctx.bezierCurveTo(vx + 8, s2.y + 1, vx + 14, s2.y + 6, vx + 22, s2.y + 3); }
      ctx.stroke();
      ctx.restore();
    } else {
      // bone ridge
      const bg2 = ctx.createLinearGradient(0, s2.y, 0, s2.y + 7); bg2.addColorStop(0, '#ece4cc'); bg2.addColorStop(1, '#8a7e66');
      rr(s2.x, s2.y, s2.w, 7, 3.5, bg2);
      el(s2.x + 2, s2.y + 3.5, 4, 4.4, '#d8cfb8'); el(s2.x + s2.w - 2, s2.y + 3.5, 4, 4.4, '#d8cfb8');
      ctx.fillStyle = '#b8ad92'; ctx.beginPath();
      for (let ix = s2.x + 7; ix < s2.x + s2.w - 6; ix += 9) { const L = 3 + hash(ix * 3 + s2.y) * 5; ctx.moveTo(ix - 1.5, s2.y + 6.5); ctx.lineTo(ix, s2.y + 6.5 + L); ctx.lineTo(ix + 1.5, s2.y + 6.5); }
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,80,60,0.55)'; ctx.lineWidth = 0.5; ctx.beginPath(); for (let ix = s2.x + 12; ix < s2.x + s2.w - 8; ix += 23) { ctx.moveTo(ix, s2.y + 1.5); ctx.lineTo(ix + 3, s2.y + 4); ctx.lineTo(ix + 1, s2.y + 6); } ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(s2.x + 3, s2.y + 0.8, s2.w - 6, 0.7);
    }
  }
}

// =====================================================================
// 水下八关 · 第一关 珊瑚浅海: swim freely, watch your oxygen (surface or stand in a bubble vent to
// breathe), dodge mines and jellyfish, and beat the mechanical shark.
// =====================================================================
const PAL_D = { skin: '#e2b48c', hair: '#15181c', band: '#ffcc33', vest: '#22262c', pants: '#1c2026', boots: '#15181c', gun: '#5d646c' };
const swimHit = (p, s2) => !s2.gone && p.x + 9 > s2.x && p.x - 9 < s2.x + s2.w && p.y + 5 > s2.y && p.y - 7 < s2.y + s2.h;
function swimCollideX(p, x0) { for (const s2 of solids) if (swimHit(p, s2)) { p.x = x0 <= s2.x + s2.w / 2 ? s2.x - 9 : s2.x + s2.w + 9; p.vx = 0; } }
function swimCollideY(p, y0) { for (const s2 of solids) if (swimHit(p, s2)) { p.y = y0 <= s2.y + s2.h / 2 ? s2.y - 5 : s2.y + s2.h + 7; p.vy = 0; } }
function initSea9() {
  G.en = []; G.pods = []; G.items = []; G.camX = 0; G.camY = 0;
  BOXES9.forEach(([x, item], i) => G.en.push({ t: 'box', x, y: SEA_FLOOR, hp: 4, item, open: false, st: 0.8 + i * 0.35, flash: 0 }));
  for (const [x, y] of MINES9) G.en.push({ t: 'mine', x, y0: y, y, hp: 3, ph: rnd() * 6, flash: 0 });
  for (const [x, y] of JELLY9) G.en.push({ t: 'jelly', x, x0: x, y0: y, y, hp: 2, ph: rnd() * 6, flash: 0 });
  for (const [x, y] of SUBS9) G.en.push({ t: 'msub', x, x0: x, y0: y, y, hp: 6, ph: rnd() * 6, fireT: 1.5 + rnd(), flash: 0 });
  G.podTrig = PODS9.map(t => ({ ...t, done: false }));
  G.sea = { o2: 1, vents: VENTS9, pockets: [], surface: true, boats: true, diverT: 3, boatT: 5, warnT: 0 }; G.ghost = null;
  G.shark = { x: 3110, y: 110, face: -1, active: false, dead: false, deadT: 0, phase2: false, t: 0, mode: 'idle', modeT: 0, chargeT: 4, finT: 2, parts: [
    { shark: 1, k: 'fin', w: 26, h: 14, hp: 24, max: 24, flash: 0 },
    { shark: 1, k: 'core', w: 22, h: 18, hp: 70, max: 70, flash: 0 },
  ] };
  placeShark();
  Object.assign(G.p, { x: 40, y: 100, vy: 0 });
}
function placeShark() { const Sk = G.shark, [fin, core] = Sk.parts; fin.x = Sk.x - Sk.face * 5 - 13; fin.y = Sk.y - 31; core.x = Sk.x + Sk.face * 18 - 11; core.y = Sk.y - 7; }
const sharkBody = Sk => ({ x: Sk.x - 56, y: Sk.y - 16, w: 112, h: 32 });
function hitShark(pt, dmg) {
  const Sk = G.shark;
  if (pt.hp <= 0 || Sk.dead) return;
  pt.hp -= dmg || 1; pt.flash = 0.06; sfx.hit();
  if (pt.k === 'core' && !Sk.phase2 && pt.hp <= pt.max / 2) { Sk.phase2 = true; banner('机械巨鲨狂暴 · 冲撞加快', 1.6); }
  if (pt.hp > 0) return;
  boom(pt.x + pt.w / 2, pt.y + pt.h / 2, 18); sfx.big(); shake(4);
  if (pt.k === 'core') {
    Sk.dead = true; Sk.deadT = 3.2; addScore(15000);
    for (const e of G.en) if (!e.dead) { e.dead = true; boom(e.x, e.y, 6); }
    G.eb.length = 0; Music.stop(); banner('机械巨鲨击沉', 2.4);
  } else addScore(2000);
}
function updateSea() {
  const p = G.p, S = G.sea, Sk = G.shark;
  // oxygen: drains over ~32 s; refills at the surface or inside a bubble vent's column
  if (!p.dead && !G.subMode) {
    let refill = S.surface && p.y < SEA_SURF + 8 ? 0.6 : 0;
    for (const pk of S.pockets) if (p.x > pk.x && p.x < pk.x + pk.w && p.y - 6 < pk.y + pk.h && p.y > pk.y) refill = Math.max(refill, 0.8);
    for (const vx of S.vents) if (Math.abs(p.x - vx) < 12) refill = Math.max(refill, 0.7);
    if (refill) S.o2 = Math.min(1, S.o2 + refill * DT);
    else if (!(p.o2T > 0)) S.o2 -= DT / 32;
    if (S.o2 < 0.25) { S.warnT -= DT; if (S.warnT <= 0) { S.warnT = 0.7; tone(980, 0.08, 'square', 0.05, 700); } }
    if (S.o2 <= 0) { S.o2 = 0; banner('氧气耗尽', 1.2); killPlayer(true); }
  }
  if (G.freezeT <= 0 && G.camX < CAM_MAX - 100 && !G.subMode) {
    S.diverT -= DT;
    if (S.diverT <= 0) { S.diverT = 2.4 + rnd() * 1.6; if (G.en.filter(e => e.t === 'diver').length < 4) G.en.push({ t: 'diver', x: G.camX + W + 16, y: 50 + rnd() * 120, vx: -50 - rnd() * 15, ph: rnd() * 6, fireT: 1.2 + rnd(), hp: 2, anim: 0, flash: 0 }); }
    if (S.boats) S.boatT -= DT;
    if (S.boatT <= 0) { S.boatT = 6 + rnd() * 3; G.en.push({ t: 'boat', x: G.camX + W + 30, y: SEA_SURF - 8, vx: -40, dropT: 1.0, hp: 6, flash: 0 }); }
  }
  for (const pk of S.pockets) if (pk.life !== undefined) { pk.life -= DT; if (pk.life <= 0) pk.dead = true; }
  sweep(S.pockets);
  if (G.vert) updateCollapse();
  if (G.stage === 11) { updateVolcano(); return; }
  if (G.stage === 10) { updateGhost(); return; }
  // the mechanical shark
  for (const pt of Sk.parts) if (pt.flash > 0) pt.flash -= DT;
  Sk.t += DT;
  if (!Sk.active && G.camX >= CAM_MAX - 0.5) { Sk.active = true; Sk.mode = 'swim'; banner('警告 · 机械巨鲨', 2.2); Music.start(true, -4); }
  if (Sk.dead) {
    Sk.deadT -= DT; Sk.y += 24 * DT; placeShark();
    if (rnd() < 0.32) { boom(Sk.x - 50 + rnd() * 100, Sk.y - 14 + rnd() * 28, 8 + (rnd() * 10 | 0)); if (rnd() < 0.4) sfx.boom(); }
    shake(2);
    if (Sk.deadT <= 0) stageClear();
    return;
  }
  if (!Sk.active) { Sk.y = 110 + Math.sin(Sk.t) * 8; placeShark(); return; }
  if (G.freezeT > 0) return;
  const [fin] = Sk.parts, lo = G.camX + 70, hi = G.camX + W - 70;
  if (Sk.mode === 'swim') {
    Sk.x += Sk.face * 70 * (Sk.phase2 ? 1.3 : 1) * DT;
    if (Sk.x > hi) Sk.face = -1; if (Sk.x < lo) Sk.face = 1;
    Sk.y += ((110 + Math.sin(Sk.t * 0.9) * 45) - Sk.y) * Math.min(1, DT * 2);
    Sk.chargeT -= DT;
    if (Sk.chargeT <= 0 && !p.dead) { Sk.mode = 'aim'; Sk.modeT = 0.8; tone(520, 0.5, 'sawtooth', 0.06, 260); }
  } else if (Sk.mode === 'aim') {
    Sk.face = p.x < Sk.x ? -1 : 1; Sk.y += (p.y - Sk.y) * Math.min(1, DT * 4);
    Sk.modeT -= DT; if (Sk.modeT <= 0) { Sk.mode = 'charge'; sfx.wreck(); }
  } else if (Sk.mode === 'charge') {
    Sk.x += Sk.face * 270 * DT;
    if ((Sk.face > 0 && Sk.x > G.camX + W - 60) || (Sk.face < 0 && Sk.x < G.camX + 60)) { Sk.mode = 'swim'; Sk.chargeT = Sk.phase2 ? 3.2 : 5; shake(2); }
  }
  placeShark();
  if (fin.hp > 0 && Sk.mode === 'swim') {
    Sk.finT -= DT;
    if (Sk.finT <= 0 && !p.dead) { Sk.finT = Sk.phase2 ? 1.6 : 2.4; const fx = fin.x + 13, fy = fin.y + 4, a2 = aimAtPlayer(fx, fy); for (const d of [-0.25, 0.25]) ebullet(fx, fy, Math.cos(a2 + d) * 95, Math.sin(a2 + d) * 95, 0, 3); sfx.msl(); }
  }
  const pb = pBox(p);
  if (pb && !p.dead && overlap(pb, sharkBody(Sk))) killPlayer();
}
function drawSwimmer(x, y, o) {
  const P = o.flash ? PAL_W : o.pal, f = o.face || 1, fr = o.frame || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
  if (o.dead) ctx.rotate(0.6);
  const k1 = Math.sin(fr * 1.4) * 2.2;
  seg(-5, 1, -13, 1.5 + k1, 3, P.pants); seg(-5, -0.5, -13, -1 - k1, 3, shade(P.pants, -0.2));
  el(-15.6, 1.5 + k1, 3.2, 1.2, o.fin || '#2a6a8a'); el(-15.6, -1 - k1, 3.2, 1.2, shade(o.fin || '#2a6a8a', -0.2));
  rr(-6, -3.6, 12, 7, 3, P.vest); rr(-6, -3.6, 12, 2, 1, shade(P.vest, 0.15));
  rr(-5, -7.2, 9, 3.4, 1.6, o.tank || '#c8ccd2'); rr(-5, -7.2, 9, 1, 0.5, 'rgba(255,255,255,0.4)');
  el(8, -1.4, 3.4, 3.3, P.skin); el(7.4, -3.6, 3.4, 1.7, P.hair); rr(4.6, -3.2, 6.4, 1.3, 0.6, P.band);
  rr(8.8, -3.2, 3.2, 2.4, 1, '#9fe0ff');
  let ax = (o.ax || 0) * f, ay = o.ay || 0; const l = Math.hypot(ax, ay) || 1; ax /= l; ay /= l;
  seg(3, 0, 3 + ax * 11, ay * 11, 2.4, P.gun); seg(2, 0.5, 2 + ax * 6, 0.5 + ay * 6, 2, P.skin);
  ctx.restore();
}
function drawSeaEnemy(e) {
  const fl = e.flash > 0, x = e.x, y = e.y;
  if (e.t === 'diver') drawSwimmer(x, y, { face: -1, frame: e.anim, pal: PAL_D, ax: -1, ay: 0, flash: fl, tank: '#e8b820', fin: '#1a1a1a' });
  else if (e.t === 'mine') {
    const fl2 = e.floor || SEA_FLOOR; seg(x, y + 7, x, fl2, 0.6, 'rgba(60,70,80,0.9)'); rr(x - 3, fl2 - 3, 6, 3, 1, '#3a4048');
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; seg(x + Math.cos(a) * 5, y + Math.sin(a) * 5, x + Math.cos(a) * 8.6, y + Math.sin(a) * 8.6, 1.4, '#2a2e34'); }
    el(x, y, 6.6, 6.6, fl ? '#fff' : '#3c444e'); el(x - 2, y - 2.4, 2.6, 1.6, 'rgba(255,255,255,0.3)');
    el(x, y - 1, 1.4, 1.4, (G.t >> 5) % 2 ? '#ff4a2a' : '#6a1a10');
  } else if (e.t === 'jelly') {
    const pk = 1 + Math.sin(G.time * 2 + e.ph) * 0.08;
    ctx.strokeStyle = 'rgba(255,170,220,0.6)'; ctx.lineWidth = 0.7; ctx.beginPath();
    for (let i = 0; i < 5; i++) { const tx = x - 6 + i * 3; ctx.moveTo(tx, y + 2); ctx.quadraticCurveTo(tx + Math.sin(G.time * 1.6 + i) * 3, y + 9, tx + Math.sin(G.time * 1.2 + i) * 2, y + 15); }
    ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.75; ctx.fillStyle = fl ? '#fff' : '#d27ac8'; ctx.beginPath(); ctx.ellipse(x, y + 2, 8 * pk, 9 / pk, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.restore();
    glow(x, y - 2, 9, 'rgba(255,140,220,0.35)', 'rgba(255,140,220,0)'); el(x - 2, y - 3, 2.6, 1.6, 'rgba(255,240,250,0.7)');
  } else if (e.t === 'msub') {
    const f = G.p.x < x ? -1 : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    el(0, 0, 16, 6.4, fl ? '#fff' : '#5a6672'); el(-2, -2.4, 11, 2, fl ? '#fff' : '#8a96a2');
    rr(-4, -10, 9, 5, 2, fl ? '#fff' : '#4a5562'); seg(1, -10, 1, -14, 1, '#4a5562'); seg(1, -14, 4, -14, 1, '#4a5562');
    el(10, -0.6, 3, 2.4, '#9fe0ff'); el(-16, 0, 1.6, 4 + Math.sin(G.t * 0.4) * 1.2, '#2a2e34');
    el(-6, 2.6, 1, 1, '#ffd05a'); el(0, 2.6, 1, 1, '#ffd05a');
    ctx.restore();
  } else if (e.t === 'fish') {
    const f = Math.sign(e.vx) || -1;
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    glow(0, 0, 7, 'rgba(255,120,40,0.4)', 'rgba(255,80,20,0)');
    ctx.fillStyle = fl ? '#fff' : '#e8502a'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 3.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-10, -3.6 + Math.sin(G.time * 12 + e.ph) * 1); ctx.lineTo(-10, 3.6 + Math.sin(G.time * 12 + e.ph) * 1); ctx.closePath(); ctx.fill();
    el(3.4, -1, 1, 1, '#ffe66a'); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(4, 1.2); ctx.lineTo(4.8, 2.4); ctx.lineTo(5.6, 1.2); ctx.fill();
    ctx.restore();
  } else if (e.t === 'tur') {
    const c = e.ceil ? -1 : 1, a = e.idx * Math.PI / 6;
    ctx.fillStyle = '#2a1e1e'; ctx.beginPath(); ctx.ellipse(x, y + c * 6, 11, 6, 0, c > 0 ? 0 : Math.PI, c > 0 ? Math.PI : Math.PI * 2); ctx.fill();
    seg(x, y, x + Math.cos(a) * 11, y + Math.sin(a) * 11, 3.2, fl ? '#fff' : '#3a3036');
    el(x, y, 6.4, 6.4, fl ? '#fff' : '#5a3a34'); el(x, y, 3, 3, (G.t >> 4) % 2 ? '#ff7a2a' : '#c8401c'); el(x - 2, y - 2, 1.6, 1, 'rgba(255,220,180,0.5)');
  } else if (e.t === 'valve') {
    const hx = e.hatch.x + e.hatch.w / 2;
    seg(x, y + 6, x, e.hatch.y, 2, '#4a5652'); seg(x, e.hatch.y - 1, hx, e.hatch.y - 1, 1.6, '#4a5652');
    const pulse = 0.5 + 0.5 * Math.sin(G.time * 3);
    glow(x, y, 11, `rgba(255,220,90,${0.25 + 0.25 * pulse})`, 'rgba(255,220,90,0)');
    ctx.strokeStyle = fl ? '#fff' : '#d83a2a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + (3 - e.hp) * 0.4; seg(x, y, x + Math.cos(a) * 5, y + Math.sin(a) * 5, 1, fl ? '#fff' : '#d83a2a'); }
    el(x, y, 1.6, 1.6, '#f2c230');
  } else if (e.t === 'eel') {
    const hx = x + e.dir * e.out * e.reach;
    el(x + e.dir * 1, y, 4.6, 6, '#0a0e10'); el(x + e.dir * 1.5, y, 3.2, 4.6, '#020406');
    if (e.st === 'warn' || (e.out > 0 && e.out < 0.4)) { glow(x + e.dir * 2, y - 1, 5, 'rgba(255,230,90,0.7)', 'rgba(255,230,90,0)'); el(x + e.dir * 2, y - 1.6, 0.9, 0.9, '#ffe66a'); el(x + e.dir * 2, y + 1.2, 0.9, 0.9, '#ffe66a'); }
    if (e.out > 0.02) {
      ctx.strokeStyle = fl ? '#fff' : '#4a6a3a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y);
      const n = 8; for (let i = 1; i <= n; i++) { const u = i / n, px = x + (hx - x) * u, py = y + Math.sin(u * 6 + G.time * 10) * 1.6 * (1 - u * 0.5); ctx.lineTo(px, py); } ctx.stroke();
      for (let i = 1; i < 5; i++) el(x + (hx - x) * i / 5, y - 1, 0.9, 0.9, '#c8d070');
      ctx.save(); ctx.translate(hx, y); ctx.scale(e.dir, 1);
      el(2, 0, 5, 3.6, fl ? '#fff' : '#5a7a44'); ctx.fillStyle = '#1a0a0a'; ctx.beginPath(); ctx.moveTo(1, 0.6); ctx.lineTo(7, -0.8); ctx.lineTo(7, 2.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#eef2f4'; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(4.8, 1.4); ctx.lineTo(5.6, 0); ctx.fill();
      el(2.4, -1.8, 0.9, 0.9, '#ffe66a'); ctx.restore();
    }
  } else if (e.t === 'beam' && e.rock) {
    if (e.a <= 0) return;
    const jx = e.st === 'shake' ? Math.sin(G.t * 1.6) * 0.8 : 0;
    ctx.save(); ctx.globalAlpha = e.a; ctx.fillStyle = '#4a3434'; ctx.beginPath(); ctx.moveTo(x - 7 + jx, y - 4); ctx.lineTo(x + 7 + jx, y - 4); ctx.lineTo(x + jx, y + 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,140,60,0.6)'; ctx.beginPath(); ctx.moveTo(x - 2 + jx, y); ctx.lineTo(x + 1 + jx, y + 8); ctx.lineTo(x + 2 + jx, y); ctx.fill(); ctx.restore();
  } else if (e.t === 'beam') {
    if (e.a <= 0) return;
    const jx = e.st === 'shake' ? Math.sin(G.t * 1.6) * 0.8 : 0;
    ctx.save(); ctx.globalAlpha = e.a;
    if (e.st === 'idle' || e.st === 'shake') { seg(x - 8, e.y0 - 3, x - 8, Math.max(SEA_SURF - 26, e.y0 - 40), 0.6, 'rgba(90,70,50,0.8)'); seg(x + 8, e.y0 - 3, x + 8, Math.max(SEA_SURF - 26, e.y0 - 40), 0.6, 'rgba(90,70,50,0.8)'); }
    rr(x - 14 + jx, y - 3, 28, 6, 1, '#7a4a2a'); rr(x - 14 + jx, y - 3, 28, 1.4, 0.6, '#a8683a'); rr(x - 14 + jx, y + 1.6, 28, 1.4, 0.6, '#4a2a18');
    for (let i = 0; i < 4; i++) el(x - 10 + i * 6.6 + jx, y, 0.8, 0.8, '#3a2214');
    ctx.restore();
  } else if (e.t === 'boat') {
    ctx.save(); ctx.fillStyle = fl ? '#fff' : '#4a5260'; ctx.beginPath(); ctx.moveTo(x - 20, y - 2); ctx.lineTo(x + 20, y - 2); ctx.lineTo(x + 14, y + 5); ctx.lineTo(x - 16, y + 5); ctx.closePath(); ctx.fill(); ctx.restore();
    rr(x - 8, y - 9, 14, 7, 1.6, fl ? '#fff' : '#6a7484'); rr(x - 6, y - 8, 4, 2.4, 0.6, '#9fe0ff'); seg(x + 2, y - 9, x + 2, y - 15, 0.8, '#3a4048');
    el(x - 16, y - 3.2, 1.2, 1.2, '#ff4a2a');
  }
}
function drawShark() {
  const Sk = G.shark; if (!Sk || Sk.x - 80 > G.camX + W || Sk.x + 80 < G.camX) return;
  const [fin, core] = Sk.parts, dead = Sk.dead, t = G.t, hot = Sk.mode === 'aim' || Sk.mode === 'charge';
  ctx.save(); ctx.translate(Sk.x, Sk.y); ctx.scale(Sk.face, 1);
  const sw = Math.sin(t * 0.12) * (Sk.mode === 'charge' ? 0.15 : 0.3);
  ctx.save(); ctx.translate(-50, 0); ctx.rotate(sw);
  ctx.fillStyle = dead ? '#3a3e44' : '#6a7886'; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-18, -22); ctx.lineTo(-12, 0); ctx.lineTo(-18, 18); ctx.closePath(); ctx.fill(); ctx.restore();
  const bg = ctx.createLinearGradient(0, -20, 0, 18); bg.addColorStop(0, dead ? '#3a3e44' : '#7d8c9c'); bg.addColorStop(0.55, dead ? '#2a2e34' : '#5a6878'); bg.addColorStop(1, dead ? '#4a4a4a' : '#c8d2dc');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(60, 2); ctx.quadraticCurveTo(52, -18, 20, -19); ctx.quadraticCurveTo(-20, -20, -50, -4); ctx.lineTo(-50, 4); ctx.quadraticCurveTo(-20, 18, 18, 16); ctx.quadraticCurveTo(48, 15, 60, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(30,36,44,0.6)'; ctx.lineWidth = 0.7; ctx.beginPath(); for (const px of [-30, -10, 10]) { ctx.moveTo(px, -18); ctx.quadraticCurveTo(px + 3, 0, px, 15); } ctx.stroke();
  ctx.fillStyle = dead ? '#3a3e44' : '#5a6878'; ctx.beginPath(); ctx.moveTo(2, 12); ctx.lineTo(-12, 26); ctx.lineTo(-16, 13); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#14181c'; ctx.beginPath(); ctx.moveTo(58, 5); ctx.quadraticCurveTo(46, 12, 34, 9); ctx.lineTo(36, 6); ctx.quadraticCurveTo(46, 8, 58, 4); ctx.fill();
  ctx.fillStyle = '#eef2f4'; ctx.beginPath(); for (let i = 0; i < 6; i++) { const tx = 37 + i * 3.4; ctx.moveTo(tx, 6.5); ctx.lineTo(tx + 1.4, 9.5); ctx.lineTo(tx + 2.8, 6.8); } ctx.fill();
  if (!dead) { if (hot) glow(42, -6, 9, 'rgba(255,60,40,0.7)', 'rgba(255,40,20,0)'); el(42, -6, 2.6, 2.2, hot ? '#ff3a2a' : '#ffaa3a'); }
  // dorsal launcher
  ctx.fillStyle = dead ? '#3a3e44' : '#6a7886'; ctx.beginPath(); ctx.moveTo(12, -18); ctx.lineTo(-6, -36); ctx.lineTo(-14, -18); ctx.closePath(); ctx.fill();
  if (fin.hp > 0) { const ff = fin.flash > 0; rr(-18, -32, 26, 12, 3, ff ? '#fff' : '#44505c'); for (const dy of [-29, -24]) { rr(6, dy, 6, 3, 1, '#22282e'); } }
  // gill reactor (core)
  if (core.hp > 0) { const cf = core.flash > 0; rr(7, -9, 22, 18, 4, '#1a1e24'); glow(18, 0, 14, Sk.phase2 ? 'rgba(255,90,40,0.55)' : 'rgba(80,220,255,0.5)', 'rgba(0,0,0,0)'); for (let i = 0; i < 3; i++) rr(10 + i * 6, -6, 3.4, 12, 1.6, cf ? '#fff' : Sk.phase2 ? '#ff6a3a' : '#5ad8ff'); }
  else rr(7, -9, 22, 18, 4, '#141414');
  ctx.restore();
  if (G.freezeT > 0 && Sk.active && !dead) for (const pt of Sk.parts) if (pt.hp > 0) ice(pt);
}
function drawSeaBg(cx, cy) {
  if (G.subMode) return drawVolcanoBg(cx);
  if (G.vert) return drawWreckBg(cy || 0);
  const deep = G.stage === 10, BGL = deep ? SEA_BG2 : SEA_BG, MIDL = deep ? SEA_MID2 : SEA_MID;
  ctx.drawImage(BGL, 0, 0, W, H);
  const o2 = -Math.round((cx * 0.3 % 768) * R) / R; ctx.drawImage(MIDL, o2, 0, 768, H); ctx.drawImage(MIDL, o2 + 768, 0, 768, H);
  // slow rising rings far behind the action
  ctx.strokeStyle = 'rgba(220,245,255,0.18)'; ctx.lineWidth = 0.5; ctx.beginPath();
  for (let i = 0; i < 18; i++) { const x = ((hash(i * 7) * 420 - cx * 0.3) % 400 + 400) % 400 - 8, y = 200 - (((G.time * (8 + hash(i) * 6)) + hash(i * 3) * 200) % 180), r = 1 + hash(i * 5) * 1.4; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }
  ctx.stroke();
}
function drawSeaFloor(cx) {
  if (G.subMode) return drawVolcanoWorld(cx);
  // bubble vents: stand in the column to breathe
  for (const vx of G.sea.vents) {
    if (!onScreen(vx, 20)) continue;
    const cg = ctx.createLinearGradient(vx - 10, 0, vx + 10, 0); cg.addColorStop(0, 'rgba(200,240,255,0)'); cg.addColorStop(0.5, 'rgba(200,240,255,0.14)'); cg.addColorStop(1, 'rgba(200,240,255,0)');
    ctx.fillStyle = cg; ctx.fillRect(vx - 10, SEA_SURF, 20, SEA_FLOOR - SEA_SURF);
    ctx.strokeStyle = 'rgba(225,248,255,0.75)'; ctx.lineWidth = 0.7; ctx.beginPath();
    for (let k = 0; k < 10; k++) { const ph = ((G.time * 0.5 + k / 10) % 1), y = SEA_FLOOR - 4 - ph * (SEA_FLOOR - SEA_SURF - 6), x = vx + Math.sin(ph * 9 + k) * 3, r = 1.4 + ph * 1.8; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }
    ctx.stroke();
    el(vx, SEA_FLOOR, 7, 2.4, '#2a3440'); el(vx, SEA_FLOOR - 0.5, 3.4, 1, '#0e141a');
  }
  for (const s2 of solids) {
    if (s2.x + s2.w < cx - 4 || s2.x > cx + W + 4 || s2.y > G.camY + H + 10 || s2.y + s2.h < G.camY - 10) continue;
    if (s2.gone) { drawOpenHatch(s2); continue; }
    const x0 = Math.max(s2.x, cx - 8), x1 = Math.min(s2.x + s2.w, cx + W + 8);
    if (s2.hull) { drawHull(s2); continue; }
    if (!s2.rock) {
      const sg = ctx.createLinearGradient(0, s2.y, 0, s2.y + s2.h); sg.addColorStop(0, '#d8c08a'); sg.addColorStop(1, '#7a6040');
      ctx.fillStyle = sg; ctx.fillRect(x0, s2.y, x1 - x0, s2.h);
      ctx.strokeStyle = 'rgba(120,96,60,0.5)'; ctx.lineWidth = 0.6; ctx.beginPath();
      for (let gx = Math.floor(x0 / 18) * 18; gx < x1; gx += 18) { ctx.moveTo(gx, s2.y + 4); ctx.quadraticCurveTo(gx + 5, s2.y + 2.6, gx + 10, s2.y + 4); ctx.moveTo(gx + 8, s2.y + 10); ctx.quadraticCurveTo(gx + 13, s2.y + 8.6, gx + 18, s2.y + 10); }
      ctx.stroke();
      // coral, anemones and swaying weed along the floor
      for (let gx = Math.floor(x0 / 22) * 22; gx < x1; gx += 22) {
        const r = hash(gx * 3 + 7);
        if (r < 0.3) { const L = 14 + r * 30; ctx.strokeStyle = '#2f8a5a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(gx + 6, s2.y); ctx.quadraticCurveTo(gx + 6 + Math.sin(G.time * 1.1 + gx) * 4, s2.y - L * 0.5, gx + 6 + Math.sin(G.time * 0.9 + gx) * 6, s2.y - L); ctx.stroke(); }
        else if (r < 0.5) { const c = ['#ff7aa8', '#ff9a4a', '#b07aff'][(r * 30 | 0) % 3]; seg(gx + 10, s2.y, gx + 10, s2.y - 9, 1.6, c); seg(gx + 10, s2.y - 5, gx + 6, s2.y - 11, 1.3, c); seg(gx + 10, s2.y - 6, gx + 14, s2.y - 12, 1.3, c); }
        else if (r < 0.62) { el(gx + 10, s2.y - 2, 4, 2.6, '#e86a6a'); for (let k = 0; k < 5; k++) seg(gx + 7 + k * 1.5, s2.y - 3, gx + 7 + k * 1.5 + Math.sin(G.time * 2 + k) * 0.8, s2.y - 7, 0.7, '#ffb0b0'); }
      }
    } else {
      const rg = ctx.createLinearGradient(0, s2.y, 0, s2.y + s2.h); rg.addColorStop(0, '#5a6a7a'); rg.addColorStop(1, '#2a3440');
      rr(s2.x, s2.y, s2.w, s2.h + 4, 6, rg);
      for (let i = 0; i < 4; i++) { const r = hash(s2.x * 7 + i), bx2 = s2.x + 6 + r * (s2.w - 12), by2 = s2.y + 10 + hash(i * 3 + s2.x) * (s2.h - 14); el(bx2, by2, 5 + r * 4, 3 + r * 2, 'rgba(30,40,52,0.45)'); }
      for (let gx = s2.x + 4; gx < s2.x + s2.w - 3; gx += 9) { const r = hash(gx * 5 + s2.y), c = ['#ff7aa8', '#ff9a4a', '#b07aff', '#5ad8a0'][(r * 40 | 0) % 4]; el(gx + 2, s2.y + 1, 3.4 + r * 2, 2.2 + r, c); el(gx + 1.4, s2.y, 1.4, 0.8, 'rgba(255,255,255,0.4)'); }
    }
  }
}
function drawSeaOverlay() {
  // surface line and a soft blue tint over everything
  setT(); const t = G.time;
  ctx.fillStyle = G.sea && !G.sea.surface ? 'rgba(0,20,50,0.22)' : 'rgba(10,60,120,0.12)'; ctx.fillRect(0, 0, W, H);
  if (G.sea && !G.sea.surface) return;
  ctx.strokeStyle = 'rgba(220,245,255,0.85)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0; x <= W; x += 3) { const y = SEA_SURF - 8 + Math.sin((x + G.camX) / 14 + t * 1.4) * 1.2; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke();
}
function drawO2() {
  const S = G.sea; if (!S) return;
  if (G.subMode) return drawHeat();
  if (G.tdm) return drawBattery();
  if (G.fortm) return drawFortHud();
  if (G.liftm) return drawLiftHud();
  if (G.momm) return drawMomHud();
  if (G.rail) drawText(G.p.rollCd > 0 ? 'K 翻滚 ' + G.p.rollCd.toFixed(1) : 'K 翻滚', W - 12, 31, G.p.rollCd > 0 ? '#7a8088' : '#9fd6ff', 'right', 7);
  const x = W - 74, y = 22, low = S.o2 < 0.25;
  if (G.vert) drawText('深度 ' + Math.max(0, Math.round(G.p.y / 6)) + '米', W - 12, y + 9, '#9fd6ff', 'right', 8);
  drawText('氧气', x - 4, y - 1, low && (G.t >> 4) % 2 ? '#ff5a3a' : '#bfefff', 'right', 8);
  rr(x, y, 62, 6, 2, 'rgba(0,0,0,0.6)');
  rr(x + 1, y + 1, Math.max(0, 60 * S.o2), 4, 1.5, low ? '#ff5a3a' : G.p.o2T > 0 ? '#ffd25a' : '#5ad8ff');
}

// ---------- 水下第二关: wreck interiors, eels, falling beams, and the ghost submarine ----------
const GH_SLOTS = [[270, 80], [260, 150], [120, 70], [130, 150]], GH_SLOTS_V = [[280, 1492], [270, 1566], [110, 1492], [120, 1566]];
function initSea10() {
  G.en = []; G.pods = []; G.items = []; G.camX = 0; G.camY = 0; G.shark = null;
  for (const h of [H2, H4, H6]) { h.gone = false; h.openK = 0; }
  BOXES10.forEach(([x, item, y], i) => G.en.push({ t: 'box', x, y, hp: 4, item, open: false, st: 0.8 + i * 0.35, flash: 0 }));
  for (const [x, y] of MINES10) G.en.push({ t: 'mine', x, y0: y, y, hp: 3, ph: rnd() * 6, floor: floorBelow(x, y), flash: 0 });
  for (const [x, y] of JELLY10) G.en.push({ t: 'jelly', x, x0: x, y0: y, y, hp: 2, ph: rnd() * 6, flash: 0 });
  for (const [x, y, dir, reach] of EELS10) G.en.push({ t: 'eel', x, y, dir, reach, out: 0, st: 'hide', stT: 0, cd: rnd(), stun: 0, hp: 3, flash: 0 });
  for (const [x, y] of BEAMS10) G.en.push({ t: 'beam', x, y0: y, y, st: 'idle', stT: 0, vy: 0, hp: 999, a: 1, flash: 0 });
  for (const [x, y, h] of VALVES10) G.en.push({ t: 'valve', x, y, hp: 3, hatch: h, flash: 0 });
  G.podTrig = PODS10.map(t => ({ ...t, done: false }));
  G.sea = { o2: 1, vents: [], pockets: POCKETS10.map(q => ({ ...q })), surface: false, boats: false, diverT: 99, boatT: 99, warnT: 0, colY: -80, colOn: false, colDone: false, debT: 2 };
  G.ghost = { x: 600, y: 1520, by: 1520, face: -1, active: false, dead: false, deadT: 0, phase2: false, t: 0, st: 'ghost', stT: 0, alpha: 0, lock: 0, fireT: 1, mineT: 2, parts: [
    { ghost: 1, k: 'tube', w: 20, h: 12, hp: 24, max: 24, flash: 0 },
    { ghost: 1, k: 'core', w: 24, h: 16, hp: 70, max: 70, flash: 0 },
  ] };
  placeGhost();
  Object.assign(G.p, { x: 150, y: 70, vy: 0 });
}
// the collapse: once you pass the first deck, rubble descends from above; touching it crushes you
function updateCollapse() {
  const S = G.sea, p = G.p;
  if (!S.colOn && !S.colDone && !p.dead && p.y > 230) { S.colOn = true; banner('沉船开始崩塌！快往下游', 1.8); shake(3); sfx.wreck(); }
  if (S.colOn && !p.dead && G.freezeT <= 0) {
    S.colY += (15 + Math.max(0, S.colY) / 1440 * 7) * DT;
    if (S.colY >= V_ARENA_CAM - 30) { S.colY = V_ARENA_CAM - 30; S.colOn = false; S.colDone = true; }
    S.debT -= DT;
    if (S.debT <= 0) { S.debT = 2.2 + rnd(); G.en.push({ t: 'beam', x: 40 + rnd() * 304, y0: S.colY, y: S.colY + 6, st: 'fall', stT: 0, vy: 30, hp: 999, a: 1, flash: 0 }); }
    if (G.t % 45 === 0) { noise(0.5, 0.08, 200); shake(1); }
  }
  if (!p.dead && p.y - 7 < S.colY + 8) { banner('被崩塌的残骸压住了', 1.2); killPlayer(true); }
  for (const e of G.en) if (!e.dead && e.t !== 'beam' && e.y < S.colY - 4) e.dead = true;
  for (const it of G.items) if (it.y < S.colY) it.dead = true;
}
function drawCollapse() {
  const S = G.sea; if (!S || S.colY < G.camY - 90) return;
  const y = S.colY;
  const rg = ctx.createLinearGradient(0, y - 90, 0, y); rg.addColorStop(0, '#0e0a08'); rg.addColorStop(1, '#3a2a1c');
  ctx.fillStyle = rg; ctx.fillRect(0, y - 420, W, 420);
  const dg = ctx.createLinearGradient(0, y, 0, y + 40); dg.addColorStop(0, 'rgba(140,115,90,0.7)'); dg.addColorStop(1, 'rgba(120,100,80,0)');
  ctx.fillStyle = dg; ctx.fillRect(0, y, W, 40);
  for (let x = 0; x < W; x += 14) { const r = hash(x * 7 + 3); el(x + 7, y - 2 + Math.sin(G.time * 3 + x) * 0.6, 9 + r * 5, 5 + r * 3, r < 0.5 ? '#4a3a2a' : '#5a4836'); el(x + 5, y - 4, 3, 1.4, 'rgba(255,230,200,0.15)'); }
  for (let i = 0; i < 4; i++) { const gx = 30 + hash(i * 13) * 300; seg(gx, y - 26, gx + 34, y - 6, 3.4, '#7a4a2a'); seg(gx, y - 27, gx + 34, y - 7, 1, '#a8683a'); }
}
function drawWreckBg(cy) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0e2a38'); g.addColorStop(1, '#06141e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const off = cy * 0.5;
  for (let x = 48; x < W; x += 96) { rr(x, 0, 6, H, 0, '#10303e'); rr(x, 0, 1.4, H, 0, 'rgba(120,180,200,0.12)'); }
  for (let y = -((off % 64) + 64) % 64; y < H; y += 64) { rr(0, y, W, 5, 0, '#123442'); rr(0, y, W, 1, 0, 'rgba(120,180,200,0.12)'); }
  for (let k = -1; k < 5; k++) {
    const row = Math.floor(off / 64) + k, y = row * 64 - off + 32;
    for (let c = 0; c < 4; c++) { if (hash(row * 7 + c) < 0.5) continue; const x = 24 + c * 96; el(x, y, 7, 7, '#0a1c26'); el(x, y, 5, 5, 'rgba(90,200,220,0.25)'); glow(x, y, 16, 'rgba(90,200,220,0.12)', 'rgba(90,200,220,0)'); }
  }
}
function drawOpenHatch(s2) {
  rr(s2.x - 3, s2.y, 9, s2.h, 2, '#3a4644'); rr(s2.x + s2.w - 6, s2.y, 9, s2.h, 2, '#3a4644');
  ctx.save(); ctx.beginPath(); ctx.rect(s2.x - 3, s2.y, 9, s2.h); ctx.clip(); ctx.fillStyle = '#f2c230'; ctx.fillRect(s2.x - 3, s2.y, 9, 2.4); ctx.restore();
}

function placeGhost() { const Gh = G.ghost, [tube, core] = Gh.parts; tube.x = Gh.x + Gh.face * 58 - 10; tube.y = Gh.y - 6; core.x = Gh.x - Gh.face * 8 - 12; core.y = Gh.y - 32; }
const ghostBody = Gh => ({ x: Gh.x - 64, y: Gh.y - 14, w: 128, h: 28 });
function pickGhostSlot() {
  const Gh = G.ghost, p = G.p; let best = (G.vert ? GH_SLOTS_V : GH_SLOTS)[0], bd = -1e9;
  for (const sl of (G.vert ? GH_SLOTS_V : GH_SLOTS)) { const x = G.camX + sl[0], d = Math.abs(x - p.x) - (Math.abs(x - Gh.x) < 10 ? 999 : 0); if (d > bd) { bd = d; best = sl; } }
  Gh.x = G.camX + best[0]; Gh.by = best[1]; Gh.y = Gh.by; Gh.face = p.x < Gh.x ? -1 : 1;
}
function hitGhost(pt, dmg) {
  const Gh = G.ghost;
  if (pt.hp <= 0 || Gh.dead) return;
  pt.hp -= dmg || 1; pt.flash = 0.06; sfx.hit();
  if (pt.k === 'core' && !Gh.phase2 && pt.hp <= pt.max / 2) { Gh.phase2 = true; banner('幽灵潜艇 · 怨念增强', 1.6); }
  if (pt.hp > 0) return;
  boom(pt.x + pt.w / 2, pt.y + pt.h / 2, 18); sfx.big(); shake(4);
  if (pt.k === 'core') {
    Gh.dead = true; Gh.deadT = 3.2; Gh.alpha = 1; addScore(15000);
    for (const e of G.en) if (!e.dead && e.t !== 'box') { e.dead = true; if (e.t !== 'beam') boom(e.x, e.y, 6); }
    G.eb.length = 0; Music.stop(); banner('幽灵潜艇击沉', 2.4);
  } else addScore(2000);
}
function updateGhost() {
  const p = G.p, Gh = G.ghost;
  for (const pt of Gh.parts) if (pt.flash > 0) pt.flash -= DT;
  if (!Gh.active && (G.vert ? G.camY >= V_ARENA_CAM - 0.5 : G.camX >= CAM_MAX - 0.5)) { Gh.active = true; pickGhostSlot(); Gh.st = 'in'; Gh.stT = 0.8; banner('警告 · 幽灵潜艇', 2.2); Music.start(true, -6); }
  if (!Gh.active) return;
  if (Gh.dead) {
    Gh.deadT -= DT; Gh.y += 20 * DT; placeGhost();
    if (rnd() < 0.32) { boom(Gh.x - 55 + rnd() * 110, Gh.y - 20 + rnd() * 34, 8 + (rnd() * 10 | 0)); if (rnd() < 0.4) sfx.boom(); }
    shake(2);
    if (Gh.deadT <= 0) stageClear();
    return;
  }
  if (G.freezeT > 0) return;
  Gh.t += DT; Gh.y = Gh.by + Math.sin(Gh.t * 1.2) * 4;
  if (Gh.lock > 0) { Gh.lock -= DT; if (Gh.st !== 'solid') { Gh.st = 'solid'; Gh.stT = 1; } Gh.alpha = Math.min(1, Gh.alpha + DT * 3); Gh.stT = Math.max(Gh.stT, 0.5); }
  if (Gh.st === 'in') { Gh.alpha = Math.min(1, Gh.alpha + DT / 0.8); Gh.stT -= DT; if (Gh.stT <= 0) { Gh.st = 'solid'; Gh.stT = Gh.phase2 ? 3.2 : 4; Gh.fireT = 0.6; Gh.mineT = 1.8; } }
  else if (Gh.st === 'solid') { if (!(Gh.lock > 0)) Gh.stT -= DT; if (Gh.stT <= 0) { Gh.st = 'out'; Gh.stT = 0.8; } }
  else if (Gh.st === 'out') { Gh.alpha = Math.max(0, Gh.alpha - DT / 0.8); Gh.stT -= DT; if (Gh.stT <= 0) { Gh.st = 'ghost'; Gh.stT = Gh.phase2 ? 0.9 : 1.4; } }
  else if (Gh.st === 'ghost') { Gh.alpha = 0; Gh.stT -= DT; if (Gh.stT <= 0) { pickGhostSlot(); Gh.st = 'in'; Gh.stT = 0.8; tone(330, 0.6, 'sine', 0.06, 160); } }
  placeGhost();
  if (p.dead) return;
  const [tube] = Gh.parts;
  if (Gh.st === 'solid') {
    if (tube.hp > 0) { Gh.fireT -= DT; if (Gh.fireT <= 0) { Gh.fireT = 1.3; const tx = tube.x + 10 + Gh.face * 8, ty = tube.y + 6, a2 = aimAtPlayer(tx, ty); for (const d of (Gh.phase2 ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.2, 0, 0.2])) ebullet(tx, ty, Math.cos(a2 + d) * 90, Math.sin(a2 + d) * 90, 0, 3); sfx.msl(); } }
    Gh.mineT -= DT; if (Gh.mineT <= 0) { Gh.mineT = 99; if (G.en.filter(e => e.t === 'mine').length < 5) G.en.push({ t: 'mine', x: Gh.x, y0: Gh.y + 26, y: Gh.y + 26, hp: 3, ph: rnd() * 6, floor: floorBelow(Gh.x, Gh.y + 26), flash: 0 }); tone(220, 0.2, 'triangle', 0.06, 110); }
  }
  if (Gh.alpha > 0.6) { const pb = pBox(p); if (pb && overlap(pb, ghostBody(Gh))) killPlayer(); }
}
function drawGhost() {
  const Gh = G.ghost; if (!Gh || !Gh.active) return;
  const dead = Gh.dead, a = dead ? 1 : Gh.alpha, [tube, core] = Gh.parts, t = G.t;
  if (!dead && a < 0.02) { ctx.save(); ctx.globalAlpha = 0.1 + 0.05 * Math.sin(t * 0.1); el(Gh.x, Gh.y, 66, 15, '#9effd8'); ctx.restore(); return; }
  ctx.save(); ctx.translate(Gh.x, Gh.y); ctx.scale(Gh.face, 1);
  if (!dead && a < 0.98) glow(0, 0, 84, `rgba(120,255,200,${0.3 * (1 - a) + 0.05})`, 'rgba(120,255,200,0)');
  ctx.globalAlpha = Math.max(0.15, a);
  // hanging weed
  ctx.strokeStyle = 'rgba(60,110,70,0.8)'; ctx.lineWidth = 1; ctx.beginPath();
  for (const wx of [-40, -18, 6, 30]) { ctx.moveTo(wx, 12); ctx.quadraticCurveTo(wx + Math.sin(G.time * 1.3 + wx) * 3, 20, wx + Math.sin(G.time + wx) * 4, 28); }
  ctx.stroke();
  const hg = ctx.createLinearGradient(0, -15, 0, 15); hg.addColorStop(0, dead ? '#2a2e2c' : '#53645f'); hg.addColorStop(0.5, dead ? '#1a1e1c' : '#33423f'); hg.addColorStop(1, dead ? '#121414' : '#1a2422');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(66, 0); ctx.quadraticCurveTo(62, -15, 40, -14); ctx.lineTo(-50, -13); ctx.quadraticCurveTo(-68, -10, -70, 0); ctx.quadraticCurveTo(-68, 10, -50, 13); ctx.lineTo(40, 14); ctx.quadraticCurveTo(62, 14, 66, 0); ctx.fill();
  for (const [rx, ry, rw] of [[-30, -6, 12], [12, 4, 16], [-52, 4, 8], [34, -8, 9]]) el(rx, ry, rw, 3.4, 'rgba(140,76,40,0.55)');
  for (let i = 0; i < 9; i++) el(-44 + i * 11, -10, 0.9, 0.9, 'rgba(20,26,24,0.8)');
  seg(-70, 0, -76, -7, 1.8, '#5a4a3a'); seg(-70, 0, -75, 6, 1.8, '#5a4a3a');
  rr(-24, -34, 32, 21, 4, dead ? '#222' : '#45564f'); seg(-4, -34, -4, -44, 1.4, '#3a4440'); seg(-4, -44, 2, -44, 1.4, '#3a4440');
  if (core.hp > 0) { const fl = core.flash > 0; rr(-20, -31, 24, 12, 3, '#0a1412'); if (!dead) glow(-8, -25, 14, Gh.phase2 ? 'rgba(255,90,80,0.5)' : 'rgba(120,255,200,0.5)', 'rgba(0,0,0,0)'); rr(-18, -29, 20, 8, 2.5, fl ? '#ffffff' : Gh.phase2 ? '#ff6a5a' : '#7affc0'); }
  else rr(-20, -31, 24, 12, 3, '#0a0a0a');
  if (tube.hp > 0) { const fl = tube.flash > 0; rr(48, -9, 16, 11, 3, fl ? '#fff' : '#2a3432'); el(64, -3.5, 2.2, 3.2, Gh.st === 'solid' && Gh.fireT < 0.4 ? '#ffd27a' : '#050505'); }
  ctx.restore();
  if (G.freezeT > 0 && !dead && a > 0.6) for (const pt of Gh.parts) if (pt.hp > 0) ice(pt);
}
function drawHull(s2) {
  if (s2.hatch) {
    const g2 = ctx.createLinearGradient(0, s2.y, 0, s2.y + s2.h); g2.addColorStop(0, '#6a7672'); g2.addColorStop(1, '#3a4442');
    rr(s2.x, s2.y, s2.w, s2.h, 2, g2);
    ctx.save(); ctx.beginPath(); ctx.rect(s2.x, s2.y, s2.w, s2.h); ctx.clip(); ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 2.4; ctx.beginPath(); for (let k = -10; k < s2.w + 10; k += 8) { ctx.moveTo(s2.x + k, s2.y + s2.h); ctx.lineTo(s2.x + k + 6, s2.y); } ctx.globalAlpha = 0.55; ctx.stroke(); ctx.restore();
    el(s2.x + s2.w / 2, s2.y + s2.h / 2, 4.4, 4.4, '#2a3432'); ctx.strokeStyle = '#c8302a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(s2.x + s2.w / 2, s2.y + s2.h / 2, 3.4, 0, Math.PI * 2); ctx.stroke();
    return;
  }
  const g = ctx.createLinearGradient(0, s2.y, 0, s2.y + s2.h); g.addColorStop(0, '#526260'); g.addColorStop(1, '#25302e');
  rr(s2.x, s2.y, s2.w, s2.h, 2, g);
  ctx.strokeStyle = 'rgba(20,26,24,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath();
  for (let x = s2.x + 18; x < s2.x + s2.w - 4; x += 18) { ctx.moveTo(x, s2.y + 1); ctx.lineTo(x, s2.y + s2.h - 1); }
  if (s2.h > 20) for (let y = s2.y + 16; y < s2.y + s2.h - 4; y += 16) { ctx.moveTo(s2.x + 1, y); ctx.lineTo(s2.x + s2.w - 1, y); }
  ctx.stroke();
  for (let x = s2.x + 4; x < s2.x + s2.w - 2; x += 6) el(x, s2.y + 2.4, 0.7, 0.7, 'rgba(180,190,180,0.5)');
  for (let i = 0; i < Math.max(1, s2.w / 30); i++) { const rx = s2.x + 6 + hash(s2.x * 3 + i) * (s2.w - 12); ctx.fillStyle = 'rgba(140,76,40,0.5)'; ctx.fillRect(rx, s2.y + 2, 2.4, Math.min(s2.h - 3, 6 + hash(i + s2.y) * 20)); }
  if (s2.w > 60 && s2.h > 40) for (let x = s2.x + 18; x < s2.x + s2.w - 12; x += 30) { el(x, s2.y + 18, 4.4, 4.4, '#2a3432'); el(x, s2.y + 18, 3, 3, '#0e1a22'); }
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(s2.x + 1, s2.y, s2.w - 2, 0.8);
}
function drawPockets() {
  for (const pk of G.sea.pockets) {
    if (pk.x + pk.w < G.camX - 4 || pk.x > G.camX + W + 4) continue;
    const fade = pk.life !== undefined ? Math.min(1, pk.life / 2) : 1;
    ctx.save(); ctx.globalAlpha = fade;
    const g = ctx.createLinearGradient(0, pk.y, 0, pk.y + pk.h); g.addColorStop(0, 'rgba(230,248,255,0.55)'); g.addColorStop(1, 'rgba(230,248,255,0.05)');
    if (pk.life !== undefined) { el(pk.x + pk.w / 2, pk.y + pk.h / 2, pk.w / 2, pk.h / 2, 'rgba(230,248,255,0.22)'); ctx.strokeStyle = 'rgba(230,248,255,0.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(pk.x + pk.w / 2, pk.y + pk.h / 2, pk.w / 2, pk.h / 2, 0, 0, Math.PI * 2); ctx.stroke(); }
    else { ctx.fillStyle = g; ctx.fillRect(pk.x, pk.y, pk.w, pk.h); ctx.strokeStyle = 'rgba(240,252,255,0.7)'; ctx.lineWidth = 0.7; ctx.beginPath(); for (let x = pk.x; x <= pk.x + pk.w; x += 3) { const y = pk.y + pk.h - 2 + Math.sin(x / 5 + G.time * 2) * 0.8; x === pk.x ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
    ctx.restore();
  }
}

// ---------- 水下第三关 海底火山: the mini sub, engine heat, eruptions, plumes, and the lava crab ----------
const subHit = (p, s2) => !s2.gone && p.x + 12 > s2.x && p.x - 12 < s2.x + s2.w && p.y + 6 > s2.y && p.y - 6 < s2.y + s2.h;
function lavaBomb(x, y, vx, vy, g) { ebullet(x, y, vx, vy, g || 220, 3); G.eb[G.eb.length - 1].lava = true; }
function initSea11() {
  G.en = []; G.pods = []; G.items = []; G.camX = 0; G.camY = 0; G.shark = null; G.ghost = null;
  for (const [x, y, c] of TUR11) G.en.push({ t: 'tur', x, y: c ? y + 8 : y - 8, hp: 6, idx: 6, rotT: 0, fireT: 0.9, ceil: c, flash: 0 });
  for (const [x, y] of STAL11) G.en.push({ t: 'beam', rock: 1, x, y0: y, y, st: 'idle', stT: 0, vy: 0, hp: 999, a: 1, flash: 0 });
  for (const [x, y] of SUBS11) G.en.push({ t: 'msub', x, x0: x, y0: y, y, hp: 6, ph: rnd() * 6, fireT: 1.5 + rnd(), flash: 0 });
  G.podTrig = PODS11.map(t => ({ ...t, done: false }));
  G.sea = { o2: 1, heat: 0, vents: [], pockets: [], surface: false, boats: false, diverT: 99, boatT: 99, warnT: 0,
    eru: VENTS11.map((x, i) => ({ x, off: i * 0.9, st: 'idle' })), fishTrig: FISH11.map(at => ({ at, done: false })), deco: [] };
  G.crab = { x: 3300, y: SEA_FLOOR, face: -1, active: false, dead: false, deadT: 0, phase2: false, t: 0, mode: 'idle', modeT: 0, slamK: 0, spitT: 2, slamT: 3.5, bubT: 2.5, jumpT: 6, jx0: 0, jx1: 0, parts: [
    { crab: 1, k: 'clawL', w: 30, h: 20, hp: 26, max: 26, flash: 0 },
    { crab: 1, k: 'clawR', w: 30, h: 20, hp: 26, max: 26, flash: 0 },
    { crab: 1, k: 'core', w: 48, h: 22, hp: 70, max: 70, flash: 0 },
  ] };
  placeCrab();
  Object.assign(G.p, { x: 60, y: 100, vy: 0, face: 1 });
}
function subMove(I, h, v) {
  const p = G.p;
  p.prone = p.dive = p.spin = p.inWater = p.onGround = false; p.support = null;
  if (p.boostT > 0) p.boostT -= DT; if (p.torpCd > 0) p.torpCd -= DT;
  const sp = p.boostT > 0 ? 140 : 92;
  p.vx += (h * sp - p.vx) * Math.min(1, DT * 10); p.vy += (v * sp * 0.85 - p.vy) * Math.min(1, DT * 10);
  const x0 = p.x; p.x += p.vx * DT; p.x = Math.max(G.camX + 14, Math.min(p.x, G.camX + W - 14));
  for (const s2 of solids) if (subHit(p, s2)) { p.x = x0 <= s2.x + s2.w / 2 ? s2.x - 12 : s2.x + s2.w + 12; p.vx = 0; }
  const y0 = p.y; p.y += p.vy * DT; p.y = Math.max(14, Math.min(p.y, 190));
  for (const s2 of solids) if (subHit(p, s2)) { p.y = y0 <= s2.y + s2.h / 2 ? s2.y - 6 : s2.y + s2.h + 6; p.vy = 0; }
  // the scrolling screen edge pinning you against rock crushes the sub
  if (p.x < G.camX + 14) p.x = G.camX + 14;
  if (solids.some(s2 => subHit(p, s2))) {
    let ok = false;
    for (let d = 2; d <= 40 && !ok; d += 2) for (const sg of [-1, 1]) { const t = { x: p.x, y: p.y + sg * d }; if (t.y >= 14 && t.y <= 190 && !solids.some(s2 => subHit(t, s2))) { p.y = t.y; ok = true; break; } }
    if (!ok) { banner('被岩壁挤碎', 1.2); killPlayer(true); return; }
  }
  // jump key: homing torpedo
  if (I.jumpEdge && !(p.torpCd > 0)) { p.torpCd = 1.0; G.pb.push({ k: 'msl', drone: true, x: p.x + p.face * 14, y: p.y + 3, ang: p.face > 0 ? 0 : Math.PI, spd: 110, life: 2.6, dmg: 3 }); sfx.msl(); }
  p.anim += DT * 8;
  if (G.t % 6 === 0) G.fx.push({ k: 'bub', x: p.x - p.face * 15, y: p.y + (rnd() - 0.5) * 4, vx: -p.face * 10, vy: -12, t: 0, life: 0.7 });
}
function placeCrab() {
  const Cr = G.crab, [cl, cr, core] = Cr.parts, f = Cr.face, y = Cr.y - (Cr.mode === 'jump' ? Cr.jy : 0);
  cl.x = Cr.x + f * 70 - 15; cl.y = y - 30;
  const k = Cr.slamK, rx = Cr.x + f * (60 + k * 22), ry = y - 66 + k * 48;
  cr.x = rx - 15; cr.y = ry - 10;
  core.x = Cr.x - 24; core.y = y - 70;
}
const crabBody = Cr => ({ x: Cr.x - 55, y: Cr.y - (Cr.mode === 'jump' ? Cr.jy : 0) - 56, w: 110, h: 46 });
function hitCrab(pt, dmg) {
  const Cr = G.crab;
  if (pt.hp <= 0 || Cr.dead) return;
  pt.hp -= dmg || 1; pt.flash = 0.06; sfx.hit();
  if (pt.k === 'core' && !Cr.phase2 && pt.hp <= pt.max / 2) { Cr.phase2 = true; Cr.jumpT = 1.5; banner('熔岩巨蟹暴怒 · 会跳跃砸地', 1.6); }
  if (pt.hp > 0) return;
  boom(pt.x + pt.w / 2, pt.y + pt.h / 2, 18); sfx.big(); shake(4);
  if (pt.k === 'core') {
    Cr.dead = true; Cr.deadT = 3.2; addScore(15000);
    for (const e of G.en) if (!e.dead) { e.dead = true; if (e.t !== 'beam') boom(e.x, e.y, 6); }
    G.eb.length = 0; Music.stop(); banner('熔岩巨蟹击破', 2.4);
  } else addScore(2000);
}
function updateVolcano() {
  const p = G.p, S = G.sea, Cr = G.crab, frozen = G.freezeT > 0;
  // eruptions: a vent glows and rumbles, then throws lava bombs
  for (const v of S.eru) {
    const u = ((G.time + v.off) % 3.4 + 3.4) % 3.4, was = v.st;
    v.st = u > 2.6 ? 'warn' : u < 0.35 ? 'erupt' : 'idle';
    if (v.st === 'erupt' && was !== 'erupt' && onScreen(v.x, 40) && !frozen) { for (let i = 0; i < 3; i++) lavaBomb(v.x + (rnd() - 0.5) * 6, SEA_FLOOR - 6, (i - 1) * 35 + (rnd() - 0.5) * 20, -170 - rnd() * 50); noise(0.4, 0.15, 300); shake(1); }
    if (v.st === 'warn' && G.t % 8 === 0 && onScreen(v.x, 10)) G.fx.push({ k: 'smoke', x: v.x + (rnd() - 0.5) * 8, y: SEA_FLOOR - 6, t: 0, life: 0.9 });
  }
  // engine heat
  if (!p.dead) {
    let dh = 0.02;
    for (const [hx, hw] of HOT11) if (p.x > hx - 8 && p.x < hx + hw + 8) { dh += 0.22; p.y -= 45 * DT; }
    for (const v of S.eru) if (v.st !== 'idle' && Math.abs(p.x - v.x) < 40 && p.y > SEA_FLOOR - 90) dh += 0.18;
    for (const [cx2, cw] of COLD11) if (p.x > cx2 - 10 && p.x < cx2 + cw + 10) dh = -0.9;
    if (p.coolT > 0) { p.coolT -= DT; dh = Math.min(dh, -0.2); }
    S.heat = Math.max(0, Math.min(1, S.heat + dh * DT));
    if (S.heat > 0.75) { S.warnT -= DT; if (S.warnT <= 0) { S.warnT = 0.6; tone(880, 0.08, 'square', 0.05, 600); } }
    if (S.heat >= 1) { S.heat = 0; banner('引擎过热', 1.2); killPlayer(true); }
  }
  // magma piranha schools
  for (const ft of S.fishTrig) if (!ft.done && G.camX >= ft.at) {
    ft.done = true; const y0 = 50 + rnd() * 100;
    for (let i = 0; i < 5; i++) S.deco.push({ x: G.camX + W + 12 + i * 20, y0, y: y0, vx: -70, amp: 14, ph: i * 0.35 });
  }
  for (const f of S.deco) { f.x += f.vx * DT; f.y = f.y0 + Math.sin((G.time + f.ph) * 3) * f.amp; if (f.x < G.camX - 30) f.dead = true; }
  sweep(S.deco);
  // the lava crab
  for (const pt of Cr.parts) if (pt.flash > 0) pt.flash -= DT;
  if (!Cr.active && G.camX >= CAM_MAX - 0.5) { Cr.active = true; Cr.mode = 'walk'; banner('警告 · 熔岩巨蟹', 2.2); Music.start(true, 6); }
  if (!Cr.active) return;
  if (Cr.dead) {
    Cr.deadT -= DT; placeCrab();
    if (rnd() < 0.32) { boom(Cr.x - 50 + rnd() * 100, Cr.y - 60 + rnd() * 50, 8 + (rnd() * 10 | 0)); if (rnd() < 0.4) sfx.boom(); }
    shake(2);
    if (Cr.deadT <= 0) stageClear();
    return;
  }
  if (frozen) return;
  Cr.t += DT;
  const [cl, cr] = Cr.parts;
  if (Cr.mode === 'walk') {
    Cr.x += Math.sin(Cr.t * 0.7) * 22 * DT; Cr.x = Math.max(G.camX + 140, Math.min(G.camX + W - 80, Cr.x));
    if (!p.dead) Cr.face = p.x < Cr.x ? -1 : 1;
    // spit magma
    Cr.spitT -= DT;
    if (Cr.spitT <= 0 && !p.dead) { Cr.spitT = Cr.phase2 ? 2.0 : 2.8; const mx = Cr.x + Cr.face * 40, my = Cr.y - 34, fl = 1.0, gv = 200; for (const off of (Cr.phase2 ? [-30, 0, 30] : [-20, 20])) lavaBomb(mx, my, (p.x + off - mx) / fl, ((p.y) - my - 0.5 * gv * fl * fl) / fl, gv); sfx.boom(); }
    // low claw: pressure-wave bubble along the floor
    if (cl.hp > 0) { Cr.bubT -= DT; if (Cr.bubT <= 0 && !p.dead) { Cr.bubT = 3; ebullet(cl.x + 15 + Cr.face * 14, cl.y + 8, Cr.face * 120, 0, 0, 4); tone(240, 0.15, 'triangle', 0.06, 120); } }
    // raised claw: slam
    if (cr.hp > 0) { Cr.slamT -= DT; if (Cr.slamT <= 0) { Cr.mode = 'raise'; Cr.modeT = 0.6; } }
    if (Cr.phase2) { Cr.jumpT -= DT; if (Cr.jumpT <= 0 && Cr.mode === 'walk') { Cr.mode = 'jump'; Cr.modeT = 0; Cr.jx0 = Cr.x; Cr.jx1 = Math.abs(p.x - (G.camX + 150)) > Math.abs(p.x - (G.camX + W - 90)) ? G.camX + 150 : G.camX + W - 90; if (Math.abs(Cr.jx1 - Cr.x) < 60) { Cr.mode = 'walk'; Cr.jumpT = 3; } Cr.jy = 0; tone(160, 0.4, 'sawtooth', 0.06, 320); } }
  } else if (Cr.mode === 'raise') {
    Cr.slamK = -0.4 * Math.min(1, (0.6 - Cr.modeT) / 0.6); Cr.modeT -= DT; if (Cr.modeT <= 0) { Cr.mode = 'slam'; Cr.modeT = 0.15; }
  } else if (Cr.mode === 'slam') {
    Cr.modeT -= DT; Cr.slamK = Math.min(1, Cr.slamK + DT / 0.15 * 1.4);
    if (Cr.modeT <= 0) { Cr.slamK = 1; Cr.mode = 'recover'; Cr.modeT = 0.8; const ix = cr.x + 15; shake(3); noise(0.4, 0.3, 260); for (let i = 0; i < 5; i++) lavaBomb(ix + (i - 2) * 10, SEA_FLOOR - 6, (i - 2) * 30, -210 - rnd() * 50); }
  } else if (Cr.mode === 'recover') {
    Cr.modeT -= DT; Cr.slamK = Math.max(0, Cr.slamK - DT / 0.8); if (Cr.modeT <= 0) { Cr.slamK = 0; Cr.mode = 'walk'; Cr.slamT = Cr.phase2 ? 3.2 : 4.5; }
  } else if (Cr.mode === 'jump') {
    Cr.modeT += DT; const u = Math.min(1, Cr.modeT / 1.2); Cr.x = Cr.jx0 + (Cr.jx1 - Cr.jx0) * u; Cr.jy = Math.sin(u * Math.PI) * 90;
    if (u >= 1) { Cr.jy = 0; Cr.mode = 'walk'; Cr.jumpT = 7; shake(4); sfx.big(); for (let i = 0; i < 3; i++) G.en.push({ t: 'beam', rock: 1, x: G.camX + 40 + rnd() * 300, y0: 14, y: 14, st: 'fall', stT: 0, vy: 40, hp: 999, a: 1, flash: 0 }); for (let i = 0; i < 6; i++) lavaBomb(Cr.x + (i - 2.5) * 16, SEA_FLOOR - 6, (i - 2.5) * 26, -180 - rnd() * 60); }
  }
  placeCrab();
  const pb = pBox(p);
  if (pb && !p.dead && (overlap(pb, crabBody(Cr)) || Cr.parts.some(pt => pt.hp > 0 && pt.k !== 'core' && overlap(pb, pt)))) killPlayer();
}
function drawSubPlayer(p) {
  const S = G.sea;
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.face, 1); if (p.dead) ctx.rotate(0.5);
  if (!p.dead) { ctx.save(); ctx.globalAlpha = 0.35; const lg = ctx.createLinearGradient(14, 0, 70, 0); lg.addColorStop(0, 'rgba(255,250,200,0.6)'); lg.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(70, -14); ctx.lineTo(70, 14); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = p.dead ? '#3a3a3a' : '#c8782a'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-17, -6); ctx.lineTo(-15, 0); ctx.lineTo(-17, 6); ctx.closePath(); ctx.fill();
  const a = G.t * 0.3; for (let i = 0; i < 2; i++) { const l = Math.cos(a + i * Math.PI / 2) * 4.4; seg(-17.5, -l, -17.5, l, 1, '#3a3f45'); }
  const hg = ctx.createLinearGradient(0, -7, 0, 7); hg.addColorStop(0, p.dead ? '#555' : '#ffd25a'); hg.addColorStop(1, p.dead ? '#2a2a2a' : '#c8782a');
  el(0, 0, 14, 6.6, hg); rr(-10, 1, 20, 1.6, 0.8, p.dead ? '#333' : '#8a4a1a');
  el(4.5, -4.4, 5.6, 4.6, 'rgba(160,220,255,0.85)'); el(4.6, -4.4, 2.2, 2.2, PAL_P.skin); rr(2.4, -6, 4.4, 1.1, 0.5, PAL_P.band); el(6.6, -6.4, 2, 1, 'rgba(255,255,255,0.7)');
  seg(8, 3.6, 15, 3.6, 1.8, '#3a3f45'); el(14, 0, 1.6, 1.6, '#fff8c0');
  if (S && S.heat > 0.55 && !p.dead) glow(0, 0, 18, `rgba(255,70,30,${(S.heat - 0.55) * 1.1})`, 'rgba(255,40,20,0)');
  if (p.boostT > 0 && !p.dead) { glow(-20, 0, 9, 'rgba(255,190,90,0.8)', 'rgba(255,120,40,0)'); }
  ctx.restore();
}
function drawCrab() {
  const Cr = G.crab; if (!Cr || Cr.x - 100 > G.camX + W) return;
  const [cl, cr, core] = Cr.parts, dead = Cr.dead, f = Cr.face, y = Cr.y - (Cr.mode === 'jump' ? Cr.jy : 0), t = G.t;
  const shell = dead ? '#3a2a26' : '#a8341e', dark = dead ? '#1e1614' : '#5a1a10';
  // legs
  for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { const lx = Cr.x + sd * (18 + i * 10), kx = lx + sd * 14, ky = y - 34 - (i % 2) * 4 + Math.sin(Cr.t * 6 + i) * (Cr.mode === 'walk' ? 2 : 0); seg(lx, y - 30, kx, ky, 4, dark); seg(kx, ky, kx + sd * 8, y, 3, dark); }
  // shell with glowing cracks
  const sg = ctx.createLinearGradient(0, y - 58, 0, y - 12); sg.addColorStop(0, dead ? '#4a3a36' : '#d8502a'); sg.addColorStop(1, shell);
  ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(Cr.x, y - 32, 56, 26, 0, Math.PI, 0); ctx.lineTo(Cr.x + 50, y - 22); ctx.quadraticCurveTo(Cr.x, y - 6, Cr.x - 50, y - 22); ctx.closePath(); ctx.fill();
  if (!dead) { ctx.strokeStyle = `rgba(255,190,60,${0.6 + 0.3 * Math.sin(G.time * 2)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Cr.x - 30, y - 44); ctx.lineTo(Cr.x - 18, y - 36); ctx.lineTo(Cr.x - 22, y - 26); ctx.moveTo(Cr.x + 26, y - 46); ctx.lineTo(Cr.x + 16, y - 34); ctx.lineTo(Cr.x + 24, y - 24); ctx.stroke(); }
  for (const bx2 of [-36, -12, 12, 36]) el(Cr.x + bx2, y - 48 + Math.abs(bx2) * 0.18, 4, 2.4, dead ? '#2a1e1c' : '#ff8a4a');
  // eyes on stalks and mouth
  for (const ex of [Cr.x + f * 22, Cr.x + f * 34]) { seg(ex, y - 50, ex, y - 62, 1.6, dark); el(ex, y - 63, 2.6, 2.6, dead ? '#222' : '#ffe8a0'); el(ex + f * 0.8, y - 63, 1.2, 1.2, '#1a0a0a'); }
  el(Cr.x + f * 40, y - 30, 6, 3.4, '#2a0a06');
  // core: the magma vent on top of the shell
  if (core.hp > 0) { const fl = core.flash > 0; rr(core.x - 2, core.y - 2, core.w + 4, core.h + 4, 5, dark); glow(core.x + core.w / 2, core.y + core.h / 2, 18, Cr.phase2 ? 'rgba(255,80,40,0.6)' : 'rgba(255,170,60,0.5)', 'rgba(255,80,20,0)'); rr(core.x, core.y, core.w, core.h, 4, fl ? '#fff' : Cr.phase2 ? '#ff5a2a' : '#ffb03a'); rr(core.x + 4, core.y + 3, core.w - 8, 4, 2, fl ? '#fff' : '#fff0b0'); }
  else rr(core.x, core.y, core.w, core.h, 4, '#141010');
  // claws
  const claw = (pt, open) => {
    const cx2 = pt.x + 15, cy2 = pt.y + 10;
    seg(Cr.x + f * 40, y - 30, cx2 - f * 10, cy2, 6, dark);
    if (pt.hp <= 0) { el(cx2 - f * 8, cy2, 5, 4, '#1a1010'); return; }
    const fl = pt.flash > 0, cg = ctx.createLinearGradient(0, cy2 - 10, 0, cy2 + 10); cg.addColorStop(0, fl ? '#fff' : '#e85a2a'); cg.addColorStop(1, fl ? '#fff' : '#8a2412');
    ctx.save(); ctx.translate(cx2, cy2); ctx.scale(f, 1);
    ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(-2, 0, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, -3); ctx.quadraticCurveTo(20, -10 - open * 4, 18, -2); ctx.lineTo(9, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, 3); ctx.quadraticCurveTo(20, 10 + open * 4, 18, 2); ctx.lineTo(9, 0); ctx.fill();
    el(-6, -3, 4, 2, 'rgba(255,220,180,0.4)');
    ctx.restore();
  };
  claw(cl, Cr.bubT < 0.3 ? 1 : 0); claw(cr, Cr.mode === 'raise' ? 1 : 0.3);
  if (G.freezeT > 0 && Cr.active && !dead) for (const pt of Cr.parts) if (pt.hp > 0) ice(pt);
}
function drawVolcanoBg(cx) {
  ctx.drawImage(VOLC_BG, 0, 0, W, H);
  const o2 = -Math.round((cx * 0.3 % 768) * R) / R; ctx.drawImage(VOLC_MID, o2, 0, 768, H); ctx.drawImage(VOLC_MID, o2 + 768, 0, 768, H);
}
function drawVolcanoWorld(cx) {
  const S = G.sea;
  for (const f of S.deco) {
    ctx.save(); ctx.translate(f.x, f.y); ctx.scale(-1, 1); ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#c8502a'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-8, -3 + Math.sin(G.time * 10 + f.ph)); ctx.lineTo(-8, 3 + Math.sin(G.time * 10 + f.ph)); ctx.closePath(); ctx.fill();
    el(2.6, -0.8, 0.8, 0.8, '#ffe66a'); ctx.restore();
  }
  // plumes: hot (orange, pushes up) and cold seeps (blue, cools the engine)
  for (const [zx, zw, cold] of [...HOT11.map(z => [z[0], z[1], 0]), ...COLD11.map(z => [z[0], z[1], 1])]) {
    if (zx + zw < cx - 10 || zx > cx + W + 10) continue;
    const g = ctx.createLinearGradient(zx, 0, zx + zw, 0), c = cold ? '120,200,255' : '255,140,60';
    g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(0.5, `rgba(${c},${cold ? 0.26 : 0.3})`); g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g; ctx.fillRect(zx, 10, zw, SEA_FLOOR - 10);
    ctx.strokeStyle = `rgba(${cold ? '200,235,255' : '255,210,150'},0.55)`; ctx.lineWidth = 0.7; ctx.beginPath();
    for (let k = 0; k < 6; k++) { const ph = ((G.time * (cold ? 0.35 : 0.6) + k / 6) % 1), yy = SEA_FLOOR - ph * (SEA_FLOOR - 20), xx = zx + zw / 2 + Math.sin(ph * 10 + k) * zw * 0.3; ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + 2, yy - 6, xx, yy - 12); }
    ctx.stroke();
  }
  for (const s2 of solids) {
    if (s2.x + s2.w < cx - 4 || s2.x > cx + W + 4) continue;
    const x0 = Math.max(s2.x, cx - 8), x1 = Math.min(s2.x + s2.w, cx + W + 8);
    if (!s2.rock) {
      const fg = ctx.createLinearGradient(0, s2.y, 0, s2.y + s2.h); fg.addColorStop(0, '#3a2a2a'); fg.addColorStop(1, '#140c0c');
      ctx.fillStyle = fg; ctx.fillRect(x0, s2.y, x1 - x0, s2.h);
      ctx.strokeStyle = 'rgba(255,120,40,0.7)'; ctx.lineWidth = 0.8; ctx.beginPath();
      for (let gx = Math.floor(x0 / 30) * 30; gx < x1; gx += 30) { const r = hash(gx * 3); ctx.moveTo(gx, s2.y + 2 + r * 4); ctx.lineTo(gx + 8, s2.y + 5); ctx.lineTo(gx + 16, s2.y + 3 + r * 3); }
      ctx.stroke();
      continue;
    }
    const rg = ctx.createLinearGradient(0, s2.y, 0, s2.y + s2.h); rg.addColorStop(0, s2.ceil ? '#140c0e' : '#3a2c2c'); rg.addColorStop(1, s2.ceil ? '#3a2c2c' : '#160e0e');
    rr(s2.x, s2.y, s2.w, s2.h, s2.ceil ? 3 : 6, rg);
    if (s2.ceil && s2.h > 2) { ctx.fillStyle = '#2a1e1e'; ctx.beginPath(); for (let ix = s2.x + 4; ix < s2.x + s2.w - 4; ix += 10) { const L = 4 + hash(ix * 5) * 8; ctx.moveTo(ix - 3, s2.y + s2.h - 1); ctx.lineTo(ix, s2.y + s2.h + L); ctx.lineTo(ix + 3, s2.y + s2.h - 1); } ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,130,50,0.65)'; ctx.lineWidth = 0.8; ctx.beginPath();
    for (let i = 0; i < Math.max(1, s2.w / 28); i++) { const rx = s2.x + 6 + hash(s2.x * 7 + i) * (s2.w - 12), ry = s2.y + 4 + hash(i * 3 + s2.x) * Math.max(4, s2.h - 8); ctx.moveTo(rx, ry); ctx.lineTo(rx + 5, ry + 4); ctx.lineTo(rx + 3, ry + 9); }
    ctx.stroke();
    if (!s2.ceil) { ctx.fillStyle = 'rgba(255,150,60,0.35)'; ctx.fillRect(s2.x + 2, s2.y, s2.w - 4, 1); }
  }
  // eruption vents
  for (const v of S.eru) {
    if (!onScreen(v.x, 20)) continue;
    const hot = v.st === 'warn' ? 0.5 + 0.5 * Math.sin(G.time * 8) : v.st === 'erupt' ? 1 : 0.15;
    glow(v.x, SEA_FLOOR - 4, 16 + hot * 14, `rgba(255,120,40,${0.25 + hot * 0.5})`, 'rgba(255,80,20,0)');
    ctx.fillStyle = '#2a1c1c'; ctx.beginPath(); ctx.moveTo(v.x - 16, SEA_FLOOR); ctx.quadraticCurveTo(v.x - 8, SEA_FLOOR - 12, v.x - 4, SEA_FLOOR - 9); ctx.lineTo(v.x + 4, SEA_FLOOR - 9); ctx.quadraticCurveTo(v.x + 8, SEA_FLOOR - 12, v.x + 16, SEA_FLOOR); ctx.closePath(); ctx.fill();
    el(v.x, SEA_FLOOR - 9, 4, 1.6, `rgba(255,${160 + hot * 80 | 0},60,${0.5 + hot * 0.5})`);
  }
}
function drawHeat() {
  const S = G.sea, x = W - 74, y = 22, hi = S.heat > 0.75;
  drawText('热度', x - 4, y - 1.5, hi && (G.t >> 4) % 2 ? '#ff5a3a' : '#ffc89a', 'right', 8);
  rr(x, y, 62, 6, 2, 'rgba(0,0,0,0.6)');
  const g = ctx.createLinearGradient(x, 0, x + 62, 0); g.addColorStop(0, '#ffd25a'); g.addColorStop(0.6, '#ff8a2a'); g.addColorStop(1, '#ff3a2a');
  rr(x + 1, y + 1, Math.max(0, 60 * S.heat), 4, 1.5, G.p.coolT > 0 ? '#7fd8ff' : g);
  drawText('K 鱼雷', W - 12, y + 9, G.p.torpCd > 0 ? '#7a8088' : '#9fd6ff', 'right', 7);
}

// =====================================================================
// 水下第四关 深海洋流: a rail shooter. The current sweeps you INTO the screen; move across the
// screen to dodge and fire forward. World: u (left/right) and v (up/down) in -1..1, d = distance ahead.
// Swim through rock-arch openings, around pillars and slabs, and through bubble rings to breathe.
// =====================================================================
const RAIL_SPEED = 260, RAIL_SPAWN = 1000, RAIL_BOSS_AT = 13200;
function buildRail() {
  const ev = [], Rn = i => hash(i * 9301 + 49297);
  const arches = [];
  for (let x = 1800, i = 0; x < 12500; x += 1100, i++) { arches.push(x); ev.push({ at: x, t: 'arch', u: (Rn(i + 7) - 0.5) * 1.1, v: (Rn(i + 9) - 0.5) * 0.9, r: Math.max(0.3, 0.42 - i * 0.01) }); }
  const near = x => arches.some(a => Math.abs(a - x) < 220);
  for (let x = 600, i = 0; x < 12800; x += 900, i++) ev.push({ at: x, t: 'ring', u: (Rn(i) - 0.5) * 1.4, v: (Rn(i + 50) - 0.5) * 1.2, r: 0.22 });
  for (let x = 900; x < 3200; x += 420) if (!near(x)) ev.push({ at: x, t: 'jelly', u: (Rn(x) - 0.5) * 1.6, v: (Rn(x + 1) - 0.5) * 1.4, r: 0.13, hp: 2 });
  for (let x = 4200; x < 7000; x += 520) if (!near(x)) ev.push({ at: x, t: 'pillar', u: (Rn(x) - 0.5) * 1.5, w: 0.28 });
  for (let x = 4000; x < 7200; x += 260) if (!near(x)) ev.push({ at: x, t: 'mine', u: (Rn(x + 3) - 0.5) * 1.8, v: (Rn(x + 4) - 0.5) * 1.6, r: 0.11, hp: 2 });
  for (let x = 7300; x < 10200; x += 700) if (!near(x)) ev.push({ at: x, t: 'slab', v: Rn(x) < 0.5 ? -0.55 : 0.55, h: 0.7 });
  for (let x = 10300; x < 12600; x += 300) if (!near(x)) ev.push({ at: x, t: Rn(x) < 0.5 ? 'jelly' : 'mine', u: (Rn(x + 5) - 0.5) * 1.8, v: (Rn(x + 6) - 0.5) * 1.6, r: 0.12, hp: 2 });
  for (let x = 5000; x < 12500; x += 1500) ev.push({ at: x, t: 'drone', u: (Rn(x) - 0.5) * 1.2, v: (Rn(x + 2) - 0.5) * 0.8, r: 0.14, hp: 4 });
  [[2400,'M'],[3600,'C'],[5600,'S'],[6800,'D'],[8200,'F'],[9400,'C'],[10600,'D'],[11600,'R']].forEach(([x, k], i) => ev.push({ at: x + 150, t: 'cap', kind: k, u: (Rn(i + 30) - 0.5) * 1.2, v: (Rn(i + 31) - 0.5) * 1.0, r: 0.18 }));
  ev.sort((a, b) => a.at - b.at); return ev;
}
function initRail() {
  G.en = []; G.pods = []; G.items = []; G.camX = 0; G.camY = 0; G.shark = G.ghost = G.crab = null;
  G.sea = { o2: 1, vents: [], pockets: [], surface: false, boats: false, diverT: 99, boatT: 99, warnT: 0 };
  G.rl = { dist: 0, ev: buildRail(), ei: 0, objs: [], shots: [], esh: [], slowT: 0, vpx: 192, vpy: 108, tilt: 0 };
  G.queen = null;
  Object.assign(G.p, { u: 0, v: 0, uv: 0, vv: 0, rollT: 0, rollCd: 0, vortexT: 0 });
}
const rdist = (u1, v1, u2, v2) => Math.hypot(u1 - u2, (v1 - v2) * 0.9);
function rproj(u, v, d) { const R = G.rl, f = 1 / (1 + Math.max(-60, d) / 180); return { x: R.vpx + (192 + u * 150 - R.vpx) * f, y: R.vpy + (118 + v * 72 - R.vpy) * f, f }; }
function railBlast() {
  const R = G.rl, p = G.p; sfx.big(); shake(4); G.flashT = 0.15;
  for (const o of R.objs) if (o.hp && o.d < 450 && o.d > -20) { o.dead = true; addScore(100); const q = rproj(o.u, o.v, o.d); boom(q.x, q.y, 10); }
  R.esh.length = 0;
  const Q = G.queen; if (Q && Q.active && !Q.dead) { for (const ob of Q.orb) if (ob.hp > 0) ob.hp -= 6; railHitCore(10); }
  banner('冲击波', 0.8);
}
function railKill(force) {
  const p = G.p;
  if (p.vortexT > 0 && !force) return;
  killPlayer(force);
}
function railHitCore(dmg) {
  const Q = G.queen, c = Q.parts[0];
  if (c.hp <= 0 || Q.dead) return;
  c.hp -= dmg; c.flash = 0.06; sfx.hit();
  if (!Q.phase2 && c.hp <= c.max / 2) { Q.phase2 = true; banner('漩涡女王 · 卷入漩涡', 1.6); }
  if (c.hp <= 0) { Q.dead = true; Q.deadT = 3; addScore(15000); G.rl.esh.length = 0; for (const o of G.rl.objs) o.dead = true; Music.stop(); banner('漩涡女王消散', 2.4); sfx.big(); }
}
function updateRail(I) {
  const R = G.rl, p = G.p, frozen = G.freezeT > 0;
  if (p.flashT > 0) p.flashT -= DT;
  // ---- player ----
  if (p.dead) {
    p.deadT -= DT;
    if (p.deadT <= 0) {
      if (G.lives > 0) {
        const keep = { weapon: 'rifle' }; G.p = newPlayer(0); Object.assign(G.p, { u: 0, v: 0.2, uv: 0, vv: 0, rollT: 0, rollCd: 0, vortexT: 0, invT: 3 }); G.sea.o2 = 1; R.esh.length = 0;
        for (const o of R.objs) if (o.d < 160 && o.t !== 'ring' && o.t !== 'cap') o.dead = true;
      } else { gameOver(); return; }
    }
  } else {
    if (p.invT > 0) p.invT -= DT; if (p.shieldT > 0) p.shieldT -= DT; if (p.spCd > 0) p.spCd -= DT;
    if (p.rollT > 0) p.rollT -= DT; if (p.rollCd > 0) p.rollCd -= DT; if (p.vortexT > 0) p.vortexT -= DT;
    const h = (I.right ? 1 : 0) - (I.left ? 1 : 0), v = (I.down ? 1 : 0) - (I.up ? 1 : 0), sp = p.rollT > 0 ? 2.6 : 1.7;
    p.uv += (h * sp - p.uv) * Math.min(1, DT * 9); p.vv += (v * sp - p.vv) * Math.min(1, DT * 9);
    p.u += p.uv * DT; p.v += p.vv * DT;
    const Q = G.queen;
    if (Q && Q.active && !Q.dead && Q.phase2 && !frozen) { p.u += (Q.u - p.u) * 0.28 * DT; p.v += (Q.v - p.v) * 0.28 * DT; } // whirlpool pull
    p.u = Math.max(-1, Math.min(1, p.u)); p.v = Math.max(-1, Math.min(1, p.v));
    p.x = 192 + p.u * 150; p.y = 118 + p.v * 72;
    if (I.jumpEdge && !(p.rollCd > 0)) { p.rollT = 0.45; p.rollCd = 1.2; sfx.jump2(); }
    // fire forward
    p.cool -= DT;
    if (I.fireEdge) p.wantFire = true;
    const trig = SET.autofire === 'on' ? I.fire : p.wantFire;
    if (trig && p.cool <= 0) {
      p.wantFire = false; const w = WEAP[p.weapon], dm = p.weapon === 'rifle' || p.weapon === 'machine' || p.weapon === 'spread' ? 1 : 2;
      const shot = (du, dv) => R.shots.push({ u: p.u, v: p.v - 0.05, d: 0, du, dv, dmg: dm, pierce: p.weapon === 'laser', hits: new Set() });
      if (p.weapon === 'spread') { for (const du of [-0.5, -0.25, 0, 0.25, 0.5]) shot(du, (Math.abs(du) - 0.25) * 0.3); sfx.spread(); }
      else { shot(0, 0); if (p.weapon === 'laser') sfx.laser(); else if (p.weapon === 'fire') sfx.fire(); else sfx.shoot(); }
      p.cool = w.cd * (p.rapid ? 0.7 : 1); p.flashT = 0.05;
    }
    if (I.cycEdge && G.inv.length > 1) { G.sel = (G.sel + 1) % G.inv.length; sfx.hit(); }
    if (I.grenEdge) useSpecial();
    // oxygen
    S_o2: { const S = G.sea; if (!(p.o2T > 0)) S.o2 -= DT / 32; else p.o2T -= DT; if (S.o2 < 0.25) { S.warnT -= DT; if (S.warnT <= 0) { S.warnT = 0.7; tone(980, 0.08, 'square', 0.05, 700); } } if (S.o2 <= 0) { S.o2 = 0; banner('氧气耗尽', 1.2); railKill(true); } }
  }
  // ---- the current ----
  if (R.slowT > 0) R.slowT -= DT;
  const spd = RAIL_SPEED * (R.slowT > 0 ? 0.5 : 1) * (p.dead ? 0.3 : 1) * (p.vortexT > 0 ? 1.35 : 1);
  R.dist += spd * DT;
  R.vpx = 192 - p.u * 28; R.vpy = 108 - p.v * 14;
  while (R.ei < R.ev.length && R.ev[R.ei].at <= R.dist) { const e = R.ev[R.ei++]; R.objs.push({ ...e, d: RAIL_SPAWN, ph: rnd() * 6, flash: 0, fireT: 1.2, stay: 4 }); }
  if (!G.queen && R.dist >= RAIL_BOSS_AT) {
    G.queen = { u: 0, v: -0.25, d: RAIL_SPAWN, active: false, dead: false, deadT: 0, phase2: false, t: 0, ringT: 2, lashT: 4, regrowT: 10, ringN: 0,
      orb: [0, 1, 2, 3].map(i => ({ a: i * Math.PI / 2, hp: 6, flash: 0 })), parts: [{ k: 'core', hp: 140, max: 140, flash: 0 }] };
    banner('警告 · 漩涡水母女王', 2.2); Music.start(true, -2);
  }
  for (const o of R.objs) {
    if (o.flash > 0) o.flash -= DT;
    const was = o.d;
    if (o.t === 'drone' && o.d <= 300 && o.stay > 0) {
      o.stay -= DT; o.u += (p.u - o.u) * 0.5 * DT; o.v += (p.v - o.v) * 0.5 * DT;
      if (!frozen && !p.dead) { o.fireT -= DT; if (o.fireT <= 0) { o.fireT = 1.1; R.esh.push({ u: o.u, v: o.v, d: o.d, du: (p.u - o.u) * 0.9, dv: (p.v - o.v) * 0.9, r: 0.06 }); sfx.eshot(); } }
    } else if (o.t === 'lash') o.d -= (spd + 260) * DT;
    else o.d -= spd * DT;
    if (o.t === 'jelly' && !frozen) { o.v += Math.sin(G.time * 1.4 + o.ph) * 0.12 * DT; }
    // crossing the player plane
    if (was > 0 && o.d <= 0 && !p.dead) {
      const dd = rdist(o.u || 0, o.v || 0, p.u, p.v);
      if (o.t === 'ring') { if (dd < o.r + 0.05) { G.sea.o2 = Math.min(1, G.sea.o2 + 0.35); addScore(200); sfx.pick(); for (let i = 0; i < 8; i++) G.fx.push({ k: 'bub', x: p.x + (rnd() - 0.5) * 30, y: p.y + (rnd() - 0.5) * 20, vx: 0, vy: -30, t: 0, life: 0.8 }); } }
      else if (o.t === 'cap') { if (dd < o.r + 0.06) pickItem(o.kind); }
      else if (o.t === 'arch') { if (dd > o.r - 0.05) { banner('撞上岩拱', 1); railKill(); } else addScore(100); }
      else if (o.t === 'pillar') { if (Math.abs(o.u - p.u) < o.w / 2 + 0.05) { banner('撞上石柱', 1); railKill(); } }
      else if (o.t === 'slab' || o.t === 'lash') { if (Math.abs(o.v - p.v) < o.h / 2 + 0.05) { banner(o.t === 'lash' ? '被触手扫中' : '撞上岩板', 1); railKill(); } }
      else if (o.hp && !o.dead && dd < o.r + 0.07) { if (p.vortexT > 0 || p.rollT > 0) { o.dead = true; addScore(100); } else railKill(); }
    }
    if (o.d < -80 || (o.t === 'drone' && o.stay <= 0 && (o.d += 0) && false)) o.dead = true;
    if (o.t === 'drone' && o.stay <= 0) { o.d += 420 * DT; if (o.d > RAIL_SPAWN + 100) o.dead = true; }
  }
  // enemy shots fly at you
  for (const b of R.esh) {
    if (frozen) continue;
    const was = b.d; b.d -= (spd + 120) * DT;
    if (b.ring) { const k = 1 - Math.max(0, b.d) / b.d0, r = b.r0 + (b.r1 - b.r0) * k; b.u = b.cu + Math.cos(b.ang) * r; b.v = b.cv + Math.sin(b.ang) * r * 0.85; }
    else { b.u += b.du * DT; b.v += b.dv * DT; }
    if (was > 0 && b.d <= 0) {
      b.dead = true;
      if (!p.dead && rdist(b.u, b.v, p.u, p.v) < b.r + 0.06 && !(p.rollT > 0)) { if (p.shieldT > 0) {} else railKill(); }
    }
  }
  // your shots
  for (const sh of R.shots) {
    const d0 = sh.d; sh.d += 900 * DT; sh.u += sh.du * DT; sh.v += sh.dv * DT;
    if (sh.d > RAIL_SPAWN + 50) { sh.dead = true; continue; }
    for (const o of R.objs) {
      if (o.dead || !o.hp || sh.hits.has(o) || o.d < d0 - 20 || o.d > sh.d + 20) continue;
      if (rdist(o.u, o.v, sh.u, sh.v) < o.r + 0.05) {
        o.hp -= sh.dmg; o.flash = 0.07; sfx.hit();
        if (o.hp <= 0) { o.dead = true; addScore(o.t === 'drone' ? 500 : 100); const q = rproj(o.u, o.v, o.d); boom(q.x, q.y, 6 + 6 * q.f); sfx.boom(); }
        if (sh.pierce) sh.hits.add(o); else { sh.dead = true; break; }
      }
    }
    const Q = G.queen;
    if (!sh.dead && Q && Q.active && !Q.dead && d0 < Q.d && sh.d >= Q.d - 30) {
      for (const ob of Q.orb) { if (ob.hp <= 0 || sh.hits.has(ob)) continue; if (rdist(ob.u, ob.v, sh.u, sh.v) < 0.16) { ob.hp -= sh.dmg; ob.flash = 0.07; sfx.hit(); if (ob.hp <= 0) { const q = rproj(ob.u, ob.v, Q.d); boom(q.x, q.y, 10); addScore(1000); } if (sh.pierce) sh.hits.add(ob); else { sh.dead = true; break; } } }
      if (!sh.dead && rdist(Q.u, Q.v, sh.u, sh.v) < 0.3) { railHitCore(sh.dmg); if (!sh.pierce) sh.dead = true; else sh.hits.add(Q); }
    }
  }
  // the whirlpool jellyfish queen
  const Q = G.queen;
  if (Q) {
    Q.t += DT; if (Q.parts[0].flash > 0) Q.parts[0].flash -= DT;
    if (Q.dead) { Q.deadT -= DT; if (rnd() < 0.3) { const q = rproj(Q.u + (rnd() - 0.5) * 0.6, Q.v + (rnd() - 0.5) * 0.6, Q.d); boom(q.x, q.y, 10); if (rnd() < 0.4) sfx.boom(); } if (Q.deadT <= 0) stageClear(); }
    else {
      if (Q.d > 420) { Q.d -= spd * DT; if (Q.d <= 420) { Q.d = 420; Q.active = true; } }
      Q.u = Math.sin(Q.t * 0.4) * 0.4; Q.v = -0.25 + Math.sin(Q.t * 0.7) * 0.15;
      for (const ob of Q.orb) { ob.a += DT * (Q.phase2 ? 1.8 : 1.2); ob.u = Q.u + Math.cos(ob.a) * 0.42; ob.v = Q.v + Math.sin(ob.a) * 0.34; if (ob.flash > 0) ob.flash -= DT; }
      R.tilt = Q.phase2 ? Math.sin(Q.t * 0.8) * 0.07 : R.tilt * 0.95;
      if (Q.active && !frozen && !p.dead) {
        Q.ringT -= DT;
        if (Q.ringT <= 0) {
          Q.ringT = Q.phase2 ? 2.2 : 3; Q.ringN++;
          const collapse = Q.ringN % 2 === 0, gap = (rnd() * 24) | 0;
          for (let i = 0; i < 24; i++) { if ((i - gap + 24) % 24 < 3) continue; R.esh.push({ ring: 1, cu: Q.u, cv: Q.v, ang: i * Math.PI / 12, r0: collapse ? 1.25 : 0.15, r1: collapse ? 0.12 : 0.95, d: Q.d, d0: Q.d, u: Q.u, v: Q.v, r: 0.06 }); }
          banner(collapse ? '收缩孢子环 · 离开中心' : '扩散孢子环 · 找缺口', 0.9); sfx.eshot();
        }
        Q.lashT -= DT;
        if (Q.lashT <= 0) { Q.lashT = Q.phase2 ? 3.2 : 4.5; const vv = [-0.55, 0, 0.55][(rnd() * 3) | 0]; R.objs.push({ t: 'lash', v: vv, h: 0.5, d: Q.d, ph: 0, flash: 0 }); tone(180, 0.3, 'sawtooth', 0.05, 90); }
        if (Q.phase2) { Q.regrowT -= DT; if (Q.regrowT <= 0) { Q.regrowT = 10; const dead = Q.orb.find(ob => ob.hp <= 0); if (dead) { dead.hp = 6; banner('护卫水母重生', 0.8); } } }
      }
    }
  }
  sweep(R.objs); sweep(R.esh); sweep(R.shots);
}
// ---------- drawing ----------
function drawRailBack(x, y, roll, flash) {
  const P = flash ? PAL_W : PAL_P;
  ctx.save(); ctx.translate(x, y); ctx.rotate(roll); ctx.scale(1.4, 1.4);
  const k = Math.sin(G.t * 0.35) * 2;
  seg(-3, 5, -4.5, 13 + k, 3, P.pants); seg(3, 5, 4.5, 13 - k, 3, P.pants);
  el(-5, 15 + k, 3, 1.6, '#2a6a8a'); el(5, 15 - k, 3, 1.6, '#2a6a8a');
  rr(-6, -6, 12, 12, 3, P.vest); rr(-3.6, -7, 7.2, 10, 2.4, '#c8ccd2'); rr(-3, -6.4, 2, 9, 1, 'rgba(255,255,255,0.4)');
  seg(-6, -3, -9, -8, 2.4, P.skin); seg(6, -3, 9, -8, 2.4, P.skin); rr(-2, -12, 4, 4, 1, P.gun);
  el(0, -10, 4, 3.8, P.hair); rr(-4, -10.6, 8, 1.4, 0.6, P.band);
  ctx.restore();
}
function renderRail() {
  C = ctx; setT();
  const R = G.rl, p = G.p, t = G.time;
  ctx.save();
  if (R.tilt) { ctx.translate(192, 108); ctx.rotate(R.tilt); ctx.translate(-192, -108); }
  const bg = ctx.createRadialGradient(R.vpx, R.vpy, 4, R.vpx, R.vpy, 300); bg.addColorStop(0, '#2a8aa8'); bg.addColorStop(0.25, '#0e4a66'); bg.addColorStop(1, '#020c18');
  ctx.fillStyle = bg; ctx.fillRect(-60, -60, W + 120, H + 120);
  // trench walls: rock bands rushing past
  const step = 120, off = R.dist % step;
  for (let k = 10; k >= 0; k--) {
    const d1 = k * step - off + step, d0 = d1 - step; if (d1 < 0) continue;
    const a1 = rproj(-1.3, -1.4, d1), b1 = rproj(1.3, 1.4, d1), a0 = rproj(-1.3, -1.4, Math.max(-50, d0)), b0 = rproj(1.3, 1.4, Math.max(-50, d0));
    const band = Math.floor((R.dist + d1) / step), fog = Math.min(1, 0.25 + a1.f * 1.1), shadeK = band % 2 ? 0.08 : 0;
    const wall = (pts, base) => { ctx.fillStyle = shade(base, shadeK); ctx.globalAlpha = fog; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; };
    wall([[a1.x, a1.y], [a0.x, a0.y], [a0.x, b0.y], [a1.x, b1.y]], '#123a4c');
    wall([[b1.x, a1.y], [b0.x, a0.y], [b0.x, b0.y], [b1.x, b1.y]], '#0e3242');
    wall([[a1.x, a1.y], [a0.x, a0.y], [b0.x, a0.y], [b1.x, a1.y]], '#0a2636');
    wall([[a1.x, b1.y], [a0.x, b0.y], [b0.x, b0.y], [b1.x, b1.y]], '#1a4a52');
    if (hash(band * 7) > 0.5) { const q = rproj(hash(band) < 0.5 ? -1.28 : 1.28, (hash(band * 3) - 0.5) * 2.2, d1); el(q.x, q.y, 3 * q.f + 0.5, 2 * q.f + 0.4, `rgba(120,240,220,${0.5 * fog})`); }
  }
  // current streaks radiating from the vanishing point
  ctx.strokeStyle = `rgba(200,240,255,${p.vortexT > 0 ? 0.55 : 0.28})`; ctx.lineWidth = 0.7; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i < 36; i++) { const a = hash(i * 7) * Math.PI * 2 + (R.tilt ? t * 0.5 : 0), ph = ((t * (R.slowT > 0 ? 0.45 : 0.9) + hash(i * 3)) % 1), r0 = 24 + ph * ph * 280, r1 = r0 + 8 + ph * 26; ctx.moveTo(R.vpx + Math.cos(a) * r0, R.vpy + Math.sin(a) * r0 * 0.6); ctx.lineTo(R.vpx + Math.cos(a) * r1, R.vpy + Math.sin(a) * r1 * 0.6); }
  ctx.stroke();
  // queen (far) then objects far to near
  const Q = G.queen, list = R.objs.filter(o => o.d > -40).sort((a, b) => b.d - a.d);
  const drawQueen = () => {
    if (!Q || Q.d < 0) return;
    const q = rproj(Q.u, Q.v, Q.d), s2 = q.f * 150 * 1.5, a = Q.dead ? Math.max(0, Q.deadT / 3) : 1;
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(230,150,255,0.6)'; ctx.lineWidth = Math.max(0.6, s2 * 0.012);
    for (let i = 0; i < 9; i++) { const tx = q.x + (i - 4) * s2 * 0.05; ctx.beginPath(); ctx.moveTo(tx, q.y + s2 * 0.08); ctx.bezierCurveTo(tx + Math.sin(Q.t * 1.5 + i) * s2 * 0.06, q.y + s2 * 0.25, tx - Math.sin(Q.t * 1.2 + i) * s2 * 0.08, q.y + s2 * 0.4, tx + Math.sin(Q.t + i) * s2 * 0.05, q.y + s2 * 0.6); ctx.stroke(); }
    glow(q.x, q.y, s2 * 0.4, `rgba(255,120,230,${Q.phase2 ? 0.5 : 0.35})`, 'rgba(255,120,230,0)');
    const c = Q.parts[0], fl = c.flash > 0;
    ctx.fillStyle = fl ? '#fff' : 'rgba(210,120,230,0.85)'; ctx.beginPath(); ctx.ellipse(q.x, q.y + s2 * 0.06, s2 * 0.24, s2 * 0.2, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 8; i++) el(q.x - s2 * 0.21 + i * s2 * 0.06, q.y + s2 * 0.07, s2 * 0.03, s2 * 0.022, 'rgba(255,200,250,0.8)');
    el(q.x, q.y - s2 * 0.04, s2 * 0.08, s2 * 0.07, fl ? '#fff' : Q.phase2 ? '#ff6ab8' : '#ffe0ff');
    ctx.restore();
    for (const ob of Q.orb) { if (ob.hp <= 0 || Q.dead) continue; const o2 = rproj(ob.u, ob.v, Q.d - 20), r = o2.f * 150 * 0.15; glow(o2.x, o2.y, r * 1.8, 'rgba(160,200,255,0.4)', 'rgba(160,200,255,0)'); ctx.fillStyle = ob.flash > 0 ? '#fff' : 'rgba(150,190,255,0.85)'; ctx.beginPath(); ctx.ellipse(o2.x, o2.y, r, r * 0.8, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(180,210,255,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(o2.x + i * r * 0.5, o2.y); ctx.lineTo(o2.x + i * r * 0.5 + Math.sin(Q.t * 3 + i) * r * 0.3, o2.y + r * 1.6); } ctx.stroke(); }
  };
  let queenDrawn = false;
  for (const o of list) {
    if (!queenDrawn && Q && o.d < Q.d) { drawQueen(); queenDrawn = true; }
    const ff = rproj(0, 0, o.d).f, rock = o.t === 'arch' || o.t === 'pillar' || o.t === 'slab', fog = Math.min(1, (rock ? 0.5 : 0.2) + ff * (rock ? 1.6 : 1.25));
    ctx.save(); ctx.globalAlpha = fog;
    if (o.t === 'arch') {
      const a = rproj(-1.35, -1.45, o.d), b = rproj(1.35, 1.45, o.d), c = rproj(o.u, o.v, o.d), rx = o.r * 150 * c.f, ry = o.r * 80 * c.f;
      const rg = ctx.createLinearGradient(0, a.y, 0, b.y); rg.addColorStop(0, '#2a3c44'); rg.addColorStop(1, '#16242c');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.rect(a.x, a.y, b.x - a.x, b.y - a.y); ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2, true); ctx.fill('evenodd');
      ctx.strokeStyle = 'rgba(120,230,255,0.8)'; ctx.lineWidth = Math.max(0.8, 2.4 * c.f); ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 6; i++) { const aa = i * Math.PI / 3 + 0.3; el(c.x + Math.cos(aa) * (rx + 10 * c.f), c.y + Math.sin(aa) * (ry + 8 * c.f), 4 * c.f, 3 * c.f, ['#ff7aa8', '#ff9a4a', '#5ad8a0'][i % 3]); }
    } else if (o.t === 'pillar') {
      const a = rproj(o.u - o.w / 2, -1.45, o.d), b = rproj(o.u + o.w / 2, 1.45, o.d);
      const g = ctx.createLinearGradient(a.x, 0, b.x, 0); g.addColorStop(0, '#3a4c54'); g.addColorStop(1, '#16242c');
      rr(a.x, a.y, b.x - a.x, b.y - a.y, 3 * a.f, g); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(a.x + 1, a.y, Math.max(1, (b.x - a.x) * 0.15), b.y - a.y);
    } else if (o.t === 'slab' || o.t === 'lash') {
      const a = rproj(-1.35, o.v - o.h / 2, o.d), b = rproj(1.35, o.v + o.h / 2, o.d);
      if (o.t === 'slab') { const g = ctx.createLinearGradient(0, a.y, 0, b.y); g.addColorStop(0, '#3a4c54'); g.addColorStop(1, '#16242c'); rr(a.x, a.y, b.x - a.x, b.y - a.y, 3 * a.f, g); }
      else { const my = (a.y + b.y) / 2, hh = (b.y - a.y) / 2; ctx.fillStyle = 'rgba(230,120,240,0.55)'; ctx.beginPath(); ctx.moveTo(a.x, my); for (let x = a.x; x <= b.x; x += 6) ctx.lineTo(x, my - hh * (0.6 + 0.4 * Math.sin(x * 0.08 + G.t * 0.3))); for (let x = b.x; x >= a.x; x -= 6) ctx.lineTo(x, my + hh * (0.6 + 0.4 * Math.sin(x * 0.07 + G.t * 0.25))); ctx.closePath(); ctx.fill(); glow((a.x + b.x) / 2, my, (b.x - a.x) * 0.3, 'rgba(255,140,240,0.3)', 'rgba(255,140,240,0)'); }
    } else {
      const q = rproj(o.u, o.v, o.d), r = o.r * 150 * q.f, fl = o.flash > 0;
      if (o.t === 'ring') { ctx.strokeStyle = 'rgba(220,250,255,0.9)'; ctx.lineWidth = Math.max(0.8, 2.6 * q.f); ctx.beginPath(); ctx.ellipse(q.x, q.y, r, r * 0.55, 0, 0, Math.PI * 2); ctx.stroke(); glow(q.x, q.y, r * 1.2, 'rgba(160,240,255,0.25)', 'rgba(160,240,255,0)'); for (let i = 0; i < 8; i++) { const aa = i * Math.PI / 4 + G.time; el(q.x + Math.cos(aa) * r, q.y + Math.sin(aa) * r * 0.55, 1.4 * q.f + 0.4, 1.4 * q.f + 0.4, '#ffffff'); } }
      else if (o.t === 'cap') { ctx.save(); ctx.translate(q.x, q.y); const sc = Math.max(0.5, q.f * 2.2); ctx.scale(sc, sc); drawBadge(-6, -5, o.kind, (G.t >> 3) % 2); ctx.restore(); }
      else if (o.t === 'mine') { for (let i = 0; i < 8; i++) { const aa = i * Math.PI / 4; seg(q.x + Math.cos(aa) * r * 0.7, q.y + Math.sin(aa) * r * 0.7, q.x + Math.cos(aa) * r * 1.25, q.y + Math.sin(aa) * r * 1.25, Math.max(0.6, r * 0.18), '#2a2e34'); } el(q.x, q.y, r, r, fl ? '#fff' : '#3c444e'); el(q.x, q.y - r * 0.2, r * 0.25, r * 0.25, (G.t >> 5) % 2 ? '#ff4a2a' : '#6a1a10'); }
      else if (o.t === 'jelly') { ctx.fillStyle = fl ? '#fff' : 'rgba(210,120,200,0.85)'; ctx.beginPath(); ctx.ellipse(q.x, q.y, r, r * 0.8, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,170,220,0.7)'; ctx.lineWidth = Math.max(0.5, r * 0.08); ctx.beginPath(); for (let i = -2; i <= 2; i++) { ctx.moveTo(q.x + i * r * 0.35, q.y); ctx.quadraticCurveTo(q.x + i * r * 0.35 + Math.sin(G.time * 2 + i) * r * 0.3, q.y + r, q.x + i * r * 0.3, q.y + r * 1.7); } ctx.stroke(); }
      else if (o.t === 'drone') { el(q.x, q.y, r * 1.2, r * 0.8, fl ? '#fff' : '#5a6672'); el(q.x, q.y, r * 0.5, r * 0.45, '#1a1e24'); glow(q.x, q.y, r * 0.6, 'rgba(255,80,60,0.7)', 'rgba(255,60,40,0)'); el(q.x, q.y, r * 0.22, r * 0.22, '#ff5a3a'); seg(q.x - r * 1.2, q.y, q.x - r * 1.7, q.y - r * 0.5, Math.max(0.6, r * 0.2), '#3a4450'); seg(q.x + r * 1.2, q.y, q.x + r * 1.7, q.y - r * 0.5, Math.max(0.6, r * 0.2), '#3a4450'); }
    }
    ctx.restore();
  }
  if (!queenDrawn) drawQueen();
  // enemy spores and your shots
  for (const b of R.esh) { if (b.d < 0) continue; const q = rproj(b.u, b.v, b.d), r = Math.max(1, b.r * 150 * q.f); glow(q.x, q.y, r * 1.8, 'rgba(255,90,150,0.9)', 'rgba(255,60,120,0)'); el(q.x, q.y, r * 0.6, r * 0.6, '#ffffff'); }
  for (const sh of R.shots) { const q = rproj(sh.u, sh.v, sh.d), r = 2.6 * q.f + 0.6; glow(q.x, q.y, r * 1.6, sh.pierce ? 'rgba(80,220,255,0.9)' : 'rgba(255,230,140,0.9)', 'rgba(255,200,80,0)'); el(q.x, q.y, r * 0.5, r * 0.5, '#ffffff'); }
  // you
  if (!p.dead) {
    const blink = p.invT > 0 && (G.t >> 2) % 2 === 0;
    if (!blink) { const roll = p.rollT > 0 ? (1 - p.rollT / 0.45) * Math.PI * 2 * Math.sign(p.uv || 1) : p.uv * 0.12; drawRailBack(p.x, p.y, roll, false); }
    if (p.vortexT > 0) { ctx.strokeStyle = 'rgba(160,240,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, 16 + Math.sin(G.t * 0.3) * 2, 0, Math.PI * 2); ctx.stroke(); }
    if (p.shieldT > 0 && (p.shieldT > 2 || (G.t >> 2) % 2)) { ctx.strokeStyle = '#7ff0ff'; ctx.lineWidth = 1; ctx.strokeRect(p.x - 13, p.y - 18, 26, 36); }
    if (p.flashT > 0) glow(p.x, p.y - 16, 5, 'rgba(255,240,180,0.9)', 'rgba(255,200,80,0)');
  } else drawRailBack(p.x, p.y + (1.4 - p.deadT) * 30, (1.4 - p.deadT) * 4, true);
  ctx.restore();
  // a soft tint, then effects in screen space
  ctx.fillStyle = 'rgba(0,30,60,0.12)'; ctx.fillRect(0, 0, W, H);
  drawFx();
}
const TD_MAP = [
  '##################################################################',
  '##################################################################',
  '###..........#####################.........#######################',
  '###..........#####............####.........#######################',
  '###...j......#####............####..j......#######################',
  '###.....B.............l.....j.####....B.h..#######################',
  '###...........l.........h.....####.........#########............##',
  '###.........c#####.........................#########............##',
  '###..........#####........l................#########............##',
  '########..########.c..........###..#################............##',
  '########..########............###..#################............##',
  '########..#######################..#################............##',
  '####.........####################..#################............##',
  '####.c.....l.####################..#################............##',
  '####.........###############..........##############............##',
  '####....l....###############......j..............GG.............##',
  '####..h......###############...l.................GG.............##',
  '####.........###############..........##############............##',
  '####.........###############..................######......X.....##',
  '####.........###############.....h............######............##',
  '########..##################.......l..######..######............##',
  '########..##################........c.######..######............##',
  '########..##################..........######..######............##',
  '########..##################################..######............##',
  '########..####..........################........####............##',
  '########..####........c.################........####............##',
  '##........####..l.......################..l.....####............##',
  '##........####......h...################........####............##',
  '##.....j............................####....B...####............##',
  '##....S.....l.....j..........j......####....j...####............##',
  '##......................##....l.....####.c......####............##',
  '##........####..........##.....h................##################',
  '##........################.......c............####################',
  '##########################..........##############################',
  '##################################################################',
  '##################################################################'
];
const TD_CAPS = [[22, 25, "E"], [5, 13, "S"], [19, 9, "P"], [36, 21, "E"], [33, 32, "M"], [41, 30, "P"], [12, 7, "F"]];

// =====================================================================
// 水下第五关 黑暗深渊: a top-down cave in total darkness. Only your headlamp cone (and a small
// halo) shows the world. Light three beacons to open the gate to the anglerfish. The lamp drains
// its battery and draws hunters; switch it off (jump key) to hide. Lights in the dark may be lures.
// =====================================================================
const TDT = 24, TD_NADE_CD = 4;
// a fresh cave every time you enter: rooms joined by a spanning tree of 2-wide tunnels (plus a
// couple of loops), three beacon rooms spread far apart, and one sealed tunnel to the arena
function genTDMap() {
  const Wd = 66, Hd = 36, rf = Math.random, ri = (a, b) => a + Math.floor(rf() * (b - a + 1));
  for (let tries = 0; tries < 80; tries++) {
    const g = []; for (let j = 0; j < Hd; j++) g.push(new Array(Wd).fill('#'));
    const carve = (x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = '.'; };
    const hline = (x0, x1, y) => { for (let i = Math.min(x0, x1); i <= Math.max(x0, x1) + 1; i++) { g[y][i] = '.'; g[y + 1][i] = '.'; } };
    const vline = (y0, y1, x) => { for (let j = Math.min(y0, y1); j <= Math.max(y0, y1) + 1; j++) { g[j][x] = '.'; g[j][x + 1] = '.'; } };
    const tunnel = (a, b) => { if (rf() < 0.5) { hline(a.cx, b.cx, a.cy); vline(a.cy, b.cy, b.cx); } else { vline(a.cy, b.cy, a.cx); hline(a.cx, b.cx, b.cy); } };
    carve(52, 6, 12, 25);
    const rooms = []; let att = 0;
    while (rooms.length < 11 && att++ < 600) {
      const w = ri(6, 11), h = ri(5, 8), x = ri(2, 45 - w), y = ri(2, 33 - h);
      if (rooms.some(r => x < r.x + r.w + 3 && x + w + 3 > r.x && y < r.y + r.h + 3 && y + h + 3 > r.y)) continue;
      rooms.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
    }
    if (rooms.length < 8) continue;
    for (const r of rooms) carve(r.x, r.y, r.w, r.h);
    const dd = (a, b) => Math.hypot(a.cx - b.cx, a.cy - b.cy);
    // spanning tree (Prim) then two extra loops
    const inT = [rooms[0]], out = rooms.slice(1);
    while (out.length) { let bi = 0, bj = 0, bd = 1e9; for (let i = 0; i < inT.length; i++) for (let j = 0; j < out.length; j++) { const d = dd(inT[i], out[j]); if (d < bd) { bd = d; bi = i; bj = j; } } tunnel(inT[bi], out[bj]); inT.push(out.splice(bj, 1)[0]); }
    for (let k = 0; k < 2; k++) { const a = rooms[ri(0, rooms.length - 1)], b = rooms.filter(r => r !== a).sort((u, v) => dd(a, u) - dd(a, v))[ri(1, 2)]; if (b) tunnel(a, b); }
    // start on the far left, the gate tunnel from the room reaching furthest right
    const start = rooms.reduce((a, b) => (b.cx < a.cx ? b : a));
    const gateR = rooms.filter(r => r !== start).reduce((a, b) => (b.x + b.w > a.x + a.w ? b : a));
    const gy = Math.max(8, Math.min(27, gateR.cy));
    if (gy !== gateR.cy) vline(gateR.cy, gy, gateR.cx);
    hline(gateR.cx, 51, gy);
    for (const j of [gy, gy + 1]) { g[j][49] = 'G'; g[j][50] = 'G'; }
    // beacons: three rooms as far from the start and from each other as possible
    const beac = [];
    for (let k = 0; k < 3; k++) { let best = null, bs = -1; for (const r of rooms) { if (r === start || r === gateR || beac.includes(r)) continue; const sc = Math.min(dd(r, start), ...beac.map(b => dd(r, b))) + rf() * 4; if (sc > bs) { bs = sc; best = r; } } beac.push(best); }
    const S = { i: start.cx, j: start.cy }, B = beac.map(r => ({ i: r.cx, j: r.cy }));
    g[S.j][S.i] = 'S'; for (const b of B) g[b.j][b.i] = 'B'; g[18][58] = 'X';
    // everything reachable from the start?
    const seen = new Set([S.j * Wd + S.i]), q = [[S.i, S.j]];
    while (q.length) { const [i, j] = q.pop(); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj, k = nj * Wd + ni; if (!seen.has(k) && g[nj][ni] !== '#' && g[nj][ni] !== 'G') { seen.add(k); q.push([ni, nj]); } } }
    if (!B.every(b => seen.has(b.j * Wd + b.i)) || !seen.has(gy * Wd + 48)) continue;
    // creatures and pickups
    const floor = []; for (let j = 1; j < Hd - 1; j++) for (let i = 1; i < 47; i++) if (g[j][i] === '.') floor.push([i, j]);
    const taken = [], near = (i, j, list, r) => list.some(t => Math.hypot(t[0] - i, t[1] - j) < r);
    const place = (n, ch, dS, dB, gap, inRoom) => { let c = 0, a = 0; while (c < n && a++ < 2000) { const [i, j] = floor[ri(0, floor.length - 1)]; if (g[j][i] !== '.') continue; if (Math.hypot(i - S.i, j - S.j) < dS || near(i, j, B.map(b => [b.i, b.j]), dB) || near(i, j, taken, gap)) continue; if (inRoom && !rooms.some(r => i >= r.x && i < r.x + r.w && j >= r.y && j < r.y + r.h)) continue; taken.push([i, j]); if (ch) g[j][i] = ch; c++; } };
    const caps = [];
    for (const k of ['E', 'P', 'S', 'E', 'M', 'P', 'F']) { const before = taken.length; place(1, null, 6, 2, 4, true); if (taken.length > before) { const [i, j] = taken[taken.length - 1]; caps.push([i, j, k]); } }
    place(10, 'l', 6, 3, 3, false);
    place(6, 'h', 11, 5, 4, true);
    place(8, 'j', 4, 3, 3, false);
    return { map: g.map(r => r.join('')), caps, gy };
  }
  return { map: TD_MAP, caps: TD_CAPS, gy: 15 };
}
function initTD() {
  const GM = genTDMap(), MP = GM.map;
  G.en = []; G.pods = []; G.items = []; G.camX = 0; G.camY = 0; G.shark = G.ghost = G.crab = G.queen = null;
  G.sea = { o2: 1, vents: [], pockets: [], surface: false, boats: false, diverT: 99, boatT: 99, warnT: 0 };
  const T = G.td = { grid: [], w: MP[0].length, h: MP.length, gy: GM.gy, guide: null, mobs: [], shots: [], flares: [], beacons: [], caps: [], bat: 1, lamp: true, nades: [], nadeCd: 0, lampLock: false, gateOpen: false, gateK: 0, lit: 0, spawn: null, arenaX: 51 * TDT };
  for (let j = 0; j < T.h; j++) for (let i = 0; i < T.w; i++) {
    const ch = MP[j][i], x = i * TDT + TDT / 2, y = j * TDT + TDT / 2;
    T.grid.push(ch === '#' ? 1 : ch === 'G' ? 2 : 0);
    if (ch === 'S') T.spawn = { x, y };
    else if (ch === 'B') T.beacons.push({ x, y, lit: false });
    else if (ch === 'l') T.mobs.push({ t: 'lure', x, y, ax: x, ay: y, hp: 3, st: 'wait', stT: 0, ang: rnd() * 6, flash: 0, r: 7 });
    else if (ch === 'h') T.mobs.push({ t: 'hunter', x, y, vx: 0, vy: 0, hp: 4, ang: 0, wT: 0, tx: x, ty: y, flash: 0, r: 7 });
    else if (ch === 'j') T.mobs.push({ t: 'jelly', x, y, ax: x, ay: y, hp: 2, ph: rnd() * 6, flash: 0, r: 7 });
    else if (ch === 'X') T.bossAt = { x, y };
  }
  for (const [i, j, k] of GM.caps) T.caps.push({ x: i * TDT + TDT / 2, y: j * TDT + TDT / 2, kind: k });
  T.respawn = { ...T.spawn };
  G.angler = { x: T.bossAt.x, y: T.bossAt.y, ang: Math.PI, active: false, dead: false, deadT: 0, phase2: false, t: 0, mode: 'stalk', modeT: 0, lungeT: 3.5, inhaleT: 7, mouth: 0, vx: 0, vy: 0, spawnT: 9, kx: T.bossAt.x, ky: T.bossAt.y, senseT: 0, noiseT: 0, sees: true, wx: T.bossAt.x, wy: T.bossAt.y, wT: 0,
    parts: [{ k: 'lure', hp: 30, max: 30, flash: 0 }, { k: 'core', hp: 70, max: 70, flash: 0 }, { k: 'finL', hp: 18, max: 18, flash: 0 }, { k: 'finR', hp: 18, max: 18, flash: 0 }, { k: 'sac', hp: 24, max: 24, flash: 0 }] };
  Object.assign(G.p, { x: T.spawn.x, y: T.spawn.y, vx: 0, vy: 0, aim: 0, glowT: 0 });
}
function tdWall(x, y) { const T = G.td, i = Math.floor(x / TDT), j = Math.floor(y / TDT); if (i < 0 || j < 0 || i >= T.w || j >= T.h) return true; const c = T.grid[j * T.w + i]; return c === 1 || (c === 2 && !T.gateOpen); }
function tdHits(x, y, r) { return tdWall(x - r, y - r) || tdWall(x + r, y - r) || tdWall(x - r, y + r) || tdWall(x + r, y + r); }
function tdMove(o, dx, dy, r) { if (!tdHits(o.x + dx, o.y, r)) o.x += dx; else o.vx = 0; if (!tdHits(o.x, o.y + dy, r)) o.y += dy; else o.vy = 0; }
// where each breakable part of the anglerfish sits (in its own frame: +x is where it faces)
const AOFF = { lure: [44, 0], core: [22, 0], finL: [2, -25], finR: [2, 25], sac: [-25, 0] }, ARAD = { lure: 9, core: 14, finL: 9, finR: 9, sac: 10 };
function apos(A, k) { const o = AOFF[k], c = Math.cos(A.ang), sn = Math.sin(A.ang); return [A.x + c * o[0] - sn * o[1], A.y + sn * o[0] + c * o[1]]; }
const apart = (A, k) => A.parts.find(q => q.k === k);
function tdBlast(x, y) {
  const T = G.td; boom(x, y, 22); sfx.big(); shake(3);
  { const A = G.angler; if (A && A.active && !A.dead && A.parts[0].hp <= 0) { A.kx = x; A.ky = y; A.senseT = 1.5; } }
  for (const m of T.mobs) if (!m.dead && Math.hypot(m.x - x, m.y - y) < 50) { m.dead = true; addScore(200); boom(m.x, m.y, 8); }
  const A = G.angler; if (A.active && !A.dead) for (const pt of A.parts) { if (pt.k === 'core' && A.mouth < 0.6) continue; const [px, py] = apos(A, pt.k); if (Math.hypot(px - x, py - y) < 52) tdHitBoss(pt, 8); }
}
function tdHitBoss(pt, dmg) {
  const A = G.angler;
  if (pt.hp <= 0 || A.dead) return;
  pt.hp -= dmg; pt.flash = 0.06; sfx.hit();
  if (pt.hp <= 0 && pt.k !== 'core') { const [bx, by] = apos(A, pt.k); boom(bx, by, 14); sfx.boom(); shake(2); }
  if (pt.k === 'lure' && pt.hp <= 0) { addScore(3000); banner('诱饵灯被打碎 · 它瞎了：只能循着枪声找你，停火它就会扑空', 2); }
  if ((pt.k === 'finL' || pt.k === 'finR') && pt.hp <= 0) { addScore(2000); banner((pt.k === 'finL' ? '左' : '右') + '侧发光鳍被打碎 · 它游得更慢了', 1.6); }
  if (pt.k === 'sac' && pt.hp <= 0) { addScore(2500); banner('卵囊被打碎 · 不会再放出幼鱼', 1.6); }
  if (pt.k === 'core') {
    if (!A.phase2 && pt.hp <= pt.max / 2) { A.phase2 = true; banner(apart(A, 'sac').hp > 0 ? '巨型灯笼鱼狂暴 · 幼鱼出动' : '巨型灯笼鱼狂暴', 1.6); }
    if (pt.hp <= 0) { A.dead = true; A.deadT = 3.2; addScore(15000); for (const m of G.td.mobs) m.dead = true; Music.stop(); banner('巨型灯笼鱼击败', 2.4); sfx.big(); }
  }
}

// distance field from the arena doorway, so arrows on the floor can lead you there through the maze
function tdGuide() {
  const T = G.td, W2 = T.w, d = new Int16Array(W2 * T.h).fill(-1), t0 = T.gy * W2 + 54, q = [t0]; d[t0] = 0;
  for (let k = 0; k < q.length; k++) { const c = q[k], i = c % W2, j = (c / W2) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = (j + dj) * W2 + i + di; if (d[n] >= 0 || T.grid[n] === 1) continue; d[n] = d[c] + 1; q.push(n); } }
  T.guide = d;
}
function drawGuide(cx, cy) {
  const T = G.td, p = G.p, A = G.angler;
  if (!T.guide || A.active || p.dead) return;
  const W2 = T.w, d = T.guide, a = 0.45 + 0.2 * Math.sin(G.time * 2.4);
  let c = Math.floor(p.y / TDT) * W2 + Math.floor(p.x / TDT);
  if (d[c] < 0) return;
  // a trail of chevrons along the shortest way to the arena
  for (let s2 = 0; s2 < 22 && d[c] > 0; s2++) {
    const i = c % W2, j = (c / W2) | 0; let nx = c;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = (j + dj) * W2 + i + di; if (d[n] >= 0 && d[n] < d[nx]) nx = n; }
    if (nx === c) break;
    if (s2 % 2 === 1) {
      const x = i * TDT + 12, y = j * TDT + 12, ang = Math.atan2(((nx / W2) | 0) - j, (nx % W2) - i);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = `rgba(255,110,70,${a * (1 - s2 / 26)})`; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(2, 0); ctx.lineTo(-3, 4); ctx.stroke(); ctx.restore();
    }
    c = nx;
  }
  // the doorway itself: a red beacon ring with a label
  const bx = 52 * TDT, by = (T.gy + 1) * TDT;
  glow(bx, by, 26, `rgba(255,70,50,${0.35 + 0.15 * Math.sin(G.time * 2.4)})`, 'rgba(255,40,30,0)');
  ctx.strokeStyle = 'rgba(255,120,90,0.85)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(bx, by, 14, 0, Math.PI * 2); ctx.stroke();
  drawText('首领', bx, by - 22, '#ff8a6a', 'center', 8);
  // off screen: an arrow on the screen edge pointing at it, with the distance
  const sx = bx - cx, sy = by - cy;
  if (sx < 6 || sx > W - 6 || sy < 14 || sy > H - 6) {
    const top = 50, bot = H - 16, ox = W / 2, oy = (top + bot) / 2, ang = Math.atan2(sy - oy, sx - ox), k = Math.min((W / 2 - 30) / Math.abs(Math.cos(ang) || 1e-6), ((bot - top) / 2) / Math.abs(Math.sin(ang) || 1e-6));
    const ex = ox + Math.cos(ang) * k, ey = oy + Math.sin(ang) * k;
    setT();
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang);
    ctx.fillStyle = `rgba(255,90,60,${0.7 + 0.2 * Math.sin(G.time * 2.4)})`; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-5, -7); ctx.lineTo(-2, 0); ctx.lineTo(-5, 7); ctx.closePath(); ctx.fill();
    ctx.restore();
    const m = Math.round(Math.hypot(bx - p.x, by - p.y) / 12);
    drawText(`首领 ${m}米`, ex - Math.cos(ang) * 16, ey - Math.sin(ang) * 14 + 3, '#ffb09a', 'center', 7);
    setT(-cx, -cy);
  }
}
function lampOn() { return true; }
function updateTD(I) {
  const T = G.td, p = G.p, frozen = G.freezeT > 0, A = G.angler;
  if (p.flashT > 0) p.flashT -= DT;
  // ---- you ----
  if (p.dead) {
    p.deadT -= DT;
    if (p.deadT <= 0) {
      if (G.lives > 0) { const keepAim = p.aim; G.p = newPlayer(T.respawn.x); Object.assign(G.p, { x: T.respawn.x, y: T.respawn.y, vx: 0, vy: 0, aim: keepAim, glowT: 0, invT: 3 }); T.bat = 1; T.lampLock = false;
        if (A.active && !A.dead) { let best = null, bd = -1; for (const [ci, cj] of [[53, 7], [62, 7], [53, 29], [62, 29], [53, 18], [62, 18]]) { const x = ci * TDT + 12, y = cj * TDT + 12, d = Math.hypot(x - A.x, y - A.y); if (d > bd) { bd = d; best = { x, y }; } } Object.assign(G.p, best); G.p.aim = Math.atan2(A.y - best.y, A.x - best.x); A.mode = 'recover'; A.modeT = 1.5; A.lungeT = 3; for (const m of T.mobs) if (m.t === 'hunter' && Math.hypot(m.x - best.x, m.y - best.y) < 90) m.dead = true; } }
      else { gameOver(); return; }
    }
  } else {
    if (p.invT > 0) p.invT -= DT; if (p.shieldT > 0) p.shieldT -= DT; if (p.spCd > 0) p.spCd -= DT; if (p.glowT > 0) p.glowT -= DT;
    const h = (I.right ? 1 : 0) - (I.left ? 1 : 0), v = (I.down ? 1 : 0) - (I.up ? 1 : 0);
    if (h || v) p.aim = Math.atan2(v, h);
    const sp = 74, l = Math.hypot(h, v) || 1;
    p.vx += (h / l * sp - p.vx) * Math.min(1, DT * 6); p.vy += (v / l * sp - p.vy) * Math.min(1, DT * 6);
    if (A.active && !A.dead && A.mouth > 0.6 && !frozen) { const dx = A.x + Math.cos(A.ang) * 24 - p.x, dy = A.y + Math.sin(A.ang) * 24 - p.y, d = Math.hypot(dx, dy); if (d < 210) { p.vx += dx / d * 70 * DT * 3; p.vy += dy / d * 70 * DT * 3; } }
    tdMove(p, p.vx * DT, p.vy * DT, 6);
    p.anim += DT * ((h || v) ? 9 : 3);
    // fire
    p.cool -= DT;
    if (I.fireEdge) p.wantFire = true;
    if ((SET.autofire === 'on' ? I.fire : p.wantFire) && p.cool <= 0) {
      p.wantFire = false; const wk = p.weapon, w = WEAP[wk], dm = wk === 'laser' || wk === 'fire' || wk === 'homing' ? 2 : 1, ox = p.x + Math.cos(p.aim) * 10, oy = p.y + Math.sin(p.aim) * 10;
      const shot = (da, o) => { const a = p.aim + da, sp = (o && o.sp) || 230; T.shots.push(Object.assign({ k: wk, x: ox, y: oy, cx: ox, cy: oy, ang: a, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.2, t: 0, dmg: dm, pierce: wk === 'laser', hits: new Set(), tr: [] }, o || {})); };
      if (wk === 'spread') { for (const d of [-0.32, -0.16, 0, 0.16, 0.32]) shot(d); sfx.spread(); }
      else if (wk === 'fire') { T.fireDir = -(T.fireDir || 1); shot(0, { sp: 150, life: 1.5, dir: T.fireDir }); sfx.fire(); }
      else if (wk === 'homing') { shot(0, { sp: 120, life: 1.9 }); sfx.msl(); }
      else if (wk === 'laser') { shot(0, { sp: 340 }); sfx.laser(); }
      else { shot(0, wk === 'machine' ? { sp: 260 } : null); sfx.shoot(); }
      p.cool = w.cd * (p.rapid ? 0.7 : 1); p.flashT = 0.05; A.noiseT = 0.35; // the muzzle flash gives you away
    }
    if (I.cycEdge && G.inv.length > 1) { G.sel = (G.sel + 1) % G.inv.length; sfx.hit(); }
    if (I.grenEdge) useSpecial();
    // beacons, items, the gate
    for (const b of T.beacons) if (!b.lit && Math.hypot(b.x - p.x, b.y - p.y) < 20) {
      b.lit = true; T.lit++; T.bat = 1; T.respawn = { x: b.x, y: b.y }; addScore(1000); sfx.pick(); shake(1);
      banner(T.lit < 3 ? `信标点亮 ${T.lit}/3` : '三座信标全部点亮 · 深渊之门打开 · 跟着红色箭头去找 首领', 1.8);
      if (T.lit >= 3) { T.gateOpen = true; tone(110, 1, 'sawtooth', 0.08, 60); tdGuide(); }
    }
    for (const c of T.caps) if (!c.dead && Math.hypot(c.x - p.x, c.y - p.y) < 14) { c.dead = true; pickItem(c.kind); }
    // into the arena: the gate shuts behind you
    if (!A.active && T.gateOpen && p.x > T.arenaX + 20) { A.active = true; T.gateOpen = false; T.respawn = { x: T.arenaX + 40, y: p.y }; banner('警告 · 巨型灯笼鱼', 2.2); Music.start(true, -5); }
  }
  T.gateK = Math.max(0, Math.min(1, T.gateK + (T.gateOpen ? DT : -DT)));
  for (const n of T.nades) {
    n.t += DT; const fr = Math.pow(0.12, DT); n.vx *= fr; n.vy *= fr;
    if (tdWall(n.x + n.vx * DT, n.y)) n.vx *= -0.4; if (tdWall(n.x, n.y + n.vy * DT)) n.vy *= -0.4;
    n.x += n.vx * DT; n.y += n.vy * DT;
    const touch = T.mobs.some(m => !m.dead && Math.hypot(m.x - n.x, m.y - n.y) < m.r + 4) || (A.active && !A.dead && Math.hypot(A.x - n.x, A.y - n.y) < 30);
    if (n.t >= 0.75 || (touch && n.t > 0.08)) { n.dead = true; tdBlast(n.x, n.y); }
  }
  sweep(T.nades);
  for (const f of T.flares) { f.t -= DT; if (f.t <= 0) f.dead = true; }
  sweep(T.flares);
  // ---- creatures ----
  const lit = lampOn() || p.glowT > 0;
  for (const m of T.mobs) {
    if (m.flash > 0) m.flash -= DT;
    if (frozen || m.dead) continue;
    const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy);
    if (m.t === 'lure') {
      if (m.st === 'wait') { m.x = m.ax + Math.sin(G.time * 0.8 + m.ang) * 3; m.y = m.ay + Math.cos(G.time * 0.7 + m.ang) * 3; if (!p.dead && d < 48) { m.st = 'lunge'; m.stT = 0.35; m.ang = Math.atan2(dy, dx); tone(160, 0.2, 'sawtooth', 0.07, 80); } }
      else if (m.st === 'lunge') { m.stT -= DT; tdMove(m, Math.cos(m.ang) * 210 * DT, Math.sin(m.ang) * 210 * DT, 5); if (m.stT <= 0) m.st = 'back'; }
      else { const bx = m.ax - m.x, by = m.ay - m.y, bd = Math.hypot(bx, by); if (bd < 3) { m.st = 'wait'; } else tdMove(m, bx / bd * 50 * DT, by / bd * 50 * DT, 5); }
    } else if (m.t === 'hunter') {
      let fear = null; for (const f of T.flares) if (Math.hypot(f.x - m.x, f.y - m.y) < 110) fear = f;
      const chase = !p.dead && !fear && d < 140;
      let tx, ty, sp;
      if (fear) { tx = m.x + (m.x - fear.x); ty = m.y + (m.y - fear.y); sp = 70; }
      else if (chase) { tx = p.x; ty = p.y; sp = 82; }
      else { m.wT -= DT; if (m.wT <= 0) { m.wT = 2 + rnd() * 2; m.tx = m.x + (rnd() - 0.5) * 120; m.ty = m.y + (rnd() - 0.5) * 120; } tx = m.tx; ty = m.ty; sp = 24; }
      const ex = tx - m.x, ey = ty - m.y, el2 = Math.hypot(ex, ey) || 1;
      m.vx += (ex / el2 * sp - m.vx) * Math.min(1, DT * 3); m.vy += (ey / el2 * sp - m.vy) * Math.min(1, DT * 3);
      tdMove(m, m.vx * DT, m.vy * DT, 6); m.ang = Math.atan2(m.vy, m.vx); m.chase = chase;
    } else if (m.t === 'jelly') { m.x = m.ax + Math.sin(G.time * 0.5 + m.ph) * 10; m.y = m.ay + Math.sin(G.time * 0.8 + m.ph) * 8; }
    if (!p.dead && d < m.r + 6) { if (p.shieldT > 0) { m.dead = true; boom(m.x, m.y, 8); } else killPlayer(); }
  }
  // ---- your shots ----
  for (const s2 of T.shots) {
    s2.t += DT; s2.life -= DT;
    if (s2.k === 'fire') {
      // a fireball looping round its line of flight: from above you see it corkscrew in circles
      s2.cx += s2.vx * DT; s2.cy += s2.vy * DT;
      const r = Math.min(11, s2.t * 70), a = s2.t * 13 * s2.dir, fx = Math.cos(s2.ang), fy = Math.sin(s2.ang);
      s2.x = s2.cx + (-fy * Math.cos(a) + fx * Math.sin(a)) * r; s2.y = s2.cy + (fx * Math.cos(a) + fy * Math.sin(a)) * r;
      s2.tr.push(s2.x, s2.y); if (s2.tr.length > 20) s2.tr.splice(0, 2);
    } else if (s2.k === 'homing') {
      let tg = null, bd = 220;
      for (const m of T.mobs) { if (m.dead) continue; const dd = Math.hypot(m.x - s2.x, m.y - s2.y); if (dd < bd) { bd = dd; tg = [m.x, m.y]; } }
      if (A.active && !A.dead) for (const pt of A.parts) { if (pt.hp <= 0 || (pt.k === 'core' && A.mouth < 0.6)) continue; const q = apos(A, pt.k), dd = Math.hypot(q[0] - s2.x, q[1] - s2.y); if (dd < bd + 60) { bd = dd - 60; tg = q; } }
      if (tg) { let da = Math.atan2(tg[1] - s2.y, tg[0] - s2.x) - s2.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); s2.ang += Math.max(-5 * DT, Math.min(5 * DT, da)); }
      const sp = Math.min(240, Math.hypot(s2.vx, s2.vy) + 260 * DT); s2.vx = Math.cos(s2.ang) * sp; s2.vy = Math.sin(s2.ang) * sp;
      s2.x += s2.vx * DT; s2.y += s2.vy * DT; s2.tr.push(s2.x, s2.y); if (s2.tr.length > 14) s2.tr.splice(0, 2);
    } else { s2.x += s2.vx * DT; s2.y += s2.vy * DT; }
    if (s2.life <= 0 || tdWall(s2.k === 'fire' ? s2.cx : s2.x, s2.k === 'fire' ? s2.cy : s2.y)) { s2.dead = true; spark(s2.x, s2.y); continue; }
    const hr = s2.k === 'fire' ? 5 : 3;
    for (const m of T.mobs) {
      if (m.dead || s2.hits.has(m) || Math.hypot(m.x - s2.x, m.y - s2.y) > m.r + hr) continue;
      m.hp -= s2.dmg; m.flash = 0.07; sfx.hit();
      if (m.hp <= 0) { m.dead = true; boom(m.x, m.y, 8); sfx.boom(); addScore(m.t === 'hunter' ? 300 : 150); }
      if (s2.pierce) s2.hits.add(m); else { s2.dead = true; break; }
    }
    if (!s2.dead && A.active && !A.dead) {
      for (const pt of A.parts) {
        if (pt.hp <= 0 || (pt.k === 'core' && A.mouth < 0.6) || s2.hits.has(pt)) continue;
        const [qx, qy] = apos(A, pt.k);
        if (Math.hypot(qx - s2.x, qy - s2.y) < ARAD[pt.k] + hr - 3) { tdHitBoss(pt, s2.dmg); if (s2.pierce) s2.hits.add(pt); else { s2.dead = true; break; } }
      }
      if (s2.dead) continue;
      if (!s2.pierce && Math.hypot(A.x - s2.x, A.y - s2.y) < 26) { s2.dead = true; spark(s2.x, s2.y); }
    }
  }
  sweep(T.mobs); sweep(T.shots);
  // ---- the giant anglerfish ----
  for (const pt of A.parts) if (pt.flash > 0) pt.flash -= DT;
  if (A.dead) { A.deadT -= DT; if (rnd() < 0.32) { boom(A.x + (rnd() - 0.5) * 50, A.y + (rnd() - 0.5) * 40, 10); if (rnd() < 0.4) sfx.boom(); } if (A.deadT <= 0) stageClear(); }
  else if (A.active && !frozen) {
    A.t += DT;
    const dx = p.x - A.x, dy = p.y - A.y, d = Math.hypot(dx, dy) || 1, blind = A.parts[0].hp <= 0;
    // with its lure it sees everything; once blind it only finds you by your lamp, your gunfire, or touch
    if (A.noiseT > 0) A.noiseT -= DT;
    const sense = !p.dead && (!blind || d < 75 || A.noiseT > 0);
    if (sense) { A.kx = p.x; A.ky = p.y; A.senseT = 1.2; } else if (A.senseT > 0) A.senseT -= DT;
    A.sees = sense;
    const kdx = A.kx - A.x, kdy = A.ky - A.y, fm = 1 - (apart(A, 'finL').hp <= 0 ? 0.22 : 0) - (apart(A, 'finR').hp <= 0 ? 0.22 : 0);
    if (A.mode === 'stalk') {
      let tx, ty, sp = 60 * fm;
      if (sense || A.senseT > 0) { const oa = A.t * 0.5; tx = A.kx + Math.cos(oa) * 115; ty = A.ky + Math.sin(oa) * 85; if (d < 70) { tx = A.x - dx / d * 80; ty = A.y - dy / d * 80; } A.ang = Math.atan2(kdy, kdx); } // too close: back off instead of brushing past you
      else { A.wT -= DT; if (A.wT <= 0 || Math.hypot(A.wx - A.x, A.wy - A.y) < 20) { A.wT = 2.5; A.wx = (53 + rnd() * 9) * TDT; A.wy = (7 + rnd() * 22) * TDT; } tx = A.wx; ty = A.wy; sp = 38 * fm; A.ang += Math.atan2(Math.sin(Math.atan2(A.vy, A.vx) - A.ang), Math.cos(Math.atan2(A.vy, A.vx) - A.ang)) * Math.min(1, DT * 3); }
      const ex = tx - A.x, ey = ty - A.y, el2 = Math.hypot(ex, ey) || 1;
      A.vx += (ex / el2 * sp - A.vx) * Math.min(1, DT * 2); A.vy += (ey / el2 * sp - A.vy) * Math.min(1, DT * 2);
      A.lungeT -= DT; A.inhaleT -= DT;
      if (A.inhaleT <= 0) { A.mode = 'inhale'; A.modeT = 3.2; A.vx = A.vy = 0; tone(90, 0.8, 'sawtooth', 0.06, 50); }
      else if (A.lungeT <= 0 && !p.dead && (sense || A.senseT > 0.6)) { A.mode = 'eyes'; A.modeT = 0.85; A.vx = A.vy = 0; tone(220, 0.3, 'square', 0.05, 330); }
    } else if (A.mode === 'eyes') { if (A.modeT > 0.5) A.ang = Math.atan2(kdy, kdx); A.modeT -= DT; if (A.modeT <= 0) { A.mode = 'lunge'; A.modeT = 0.6; A.vx = Math.cos(A.ang) * 240 * fm; A.vy = Math.sin(A.ang) * 240 * fm; sfx.wreck(); } }
    else if (A.mode === 'lunge') { A.modeT -= DT; if (A.modeT <= 0) { A.mode = 'recover'; A.modeT = 1.2; } }
    else if (A.mode === 'recover') { A.vx *= 0.9; A.vy *= 0.9; A.modeT -= DT; if (A.modeT <= 0) { A.mode = 'stalk'; A.lungeT = A.phase2 ? 2.6 : 3.8; } }
    else if (A.mode === 'inhale') { A.mouth = Math.min(1, A.mouth + DT / 0.4); { let da = Math.atan2(kdy, kdx) - A.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); A.ang += Math.max(-2.5 * DT, Math.min(2.5 * DT, da)); } A.modeT -= DT; if (A.modeT <= 0) { A.mode = 'stalk'; A.inhaleT = A.phase2 ? 5 : 6; } }
    if (A.mode !== 'inhale') A.mouth = Math.max(0, A.mouth - DT / 0.3);
    const ox = A.x, oy = A.y; tdMove(A, A.vx * DT, A.vy * DT, 18);
    if (A.mode === 'lunge' && (A.vx === 0 || A.vy === 0)) { A.vx = A.vy = 0; A.mode = 'recover'; A.modeT = 0.8; shake(2); }
    if (apart(A, 'sac').hp > 0) { A.spawnT -= DT; if (A.spawnT <= 0) { A.spawnT = A.phase2 ? 7 : 12; const [sx2, sy2] = apos(A, 'sac'); if (T.mobs.filter(m => m.t === 'hunter').length < (A.phase2 ? 4 : 2)) for (let i = 0; i < (A.phase2 ? 2 : 1); i++) T.mobs.push({ t: 'hunter', x: sx2 + (rnd() - 0.5) * 16, y: sy2 + (rnd() - 0.5) * 16, vx: 0, vy: 0, hp: 2, ang: 0, wT: 0, tx: A.x, ty: A.y, flash: 0, r: 6 }); } }
    if (!p.dead) { const bite = A.mouth > 0.6 && Math.hypot(A.x + Math.cos(A.ang) * 22 - p.x, A.y + Math.sin(A.ang) * 22 - p.y) < 16; if (bite || d < 24) killPlayer(); }
  }
  // camera
  G.camX = Math.max(0, Math.min(T.w * TDT - W, p.x - W / 2)); G.camY = Math.max(0, Math.min(T.h * TDT - H, p.y - H / 2 - 6));
}
// ---------- drawing ----------
let DKC = null;
function drawTDShot(s2, top) {
  if (s2.k === 'fire') {
    if (!top) { const t = s2.tr; for (let i = 2; i < t.length; i += 2) { const a = i / t.length; ctx.strokeStyle = `rgba(255,${120 + a * 80 | 0},40,${a * 0.75})`; ctx.lineWidth = 1 + a * 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(t[i - 2], t[i - 1]); ctx.lineTo(t[i], t[i + 1]); ctx.stroke(); } }
    glow(s2.x, s2.y, top ? 6 : 8, 'rgba(255,150,50,0.85)', 'rgba(255,90,20,0)'); el(s2.x, s2.y, 3, 3, '#ff6a2b'); el(s2.x, s2.y, 1.5, 1.5, '#fff2b0');
  } else if (s2.k === 'laser') {
    const l = Math.hypot(s2.vx, s2.vy) || 1, ux = s2.vx / l, uy = s2.vy / l;
    seg(s2.x - ux * 20, s2.y - uy * 20, s2.x, s2.y, top ? 1.2 : 3, top ? '#e8ffff' : 'rgba(80,220,255,0.6)');
  } else if (s2.k === 'homing') {
    if (!top) { const t = s2.tr; ctx.strokeStyle = 'rgba(180,190,200,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < t.length; i += 2) i ? ctx.lineTo(t[i], t[i + 1]) : ctx.moveTo(t[i], t[i + 1]); ctx.stroke();
      ctx.save(); ctx.translate(s2.x, s2.y); ctx.rotate(s2.ang); rr(-4, -1.4, 7, 2.8, 1.2, '#d8dde2'); el(3, 0, 1.6, 1.4, '#e84a2a'); ctx.restore(); }
    el(s2.x - Math.cos(s2.ang) * 5, s2.y - Math.sin(s2.ang) * 5, 1.6, 1.6, '#ffc060');
  } else if (top) el(s2.x, s2.y, 1.2, 1.2, '#fff6c0');
  else { glow(s2.x, s2.y, 3, 'rgba(255,230,140,0.9)', 'rgba(255,200,80,0)'); el(s2.x, s2.y, 1.1, 1.1, '#fff'); }
}
function drawTopDiver(x, y, ang, o) {
  const P = o.flash ? PAL_W : PAL_P;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const k = Math.sin((o.frame || 0) * 1.4) * 2.2;
  seg(-4, -2, -12, -3 - k, 2.6, P.pants); seg(-4, 2, -12, 3 + k, 2.6, shade(P.pants, -0.15));
  el(-13.6, -3.4 - k, 2.6, 1.2, '#2a6a8a'); el(-13.6, 3.4 + k, 2.6, 1.2, '#2a6a8a');
  el(0, 0, 6.4, 4.6, P.vest); rr(-4.4, -2, 6, 4, 1.6, '#c8ccd2');
  seg(2, -3, 8, -2, 1.8, P.skin); seg(2, 3, 8, 1, 1.8, P.skin); seg(6, 0, 13, 0, 2, P.gun);
  el(6, 0, 3, 2.8, P.hair); el(8.4, 0, 1.1, 1.1, o.lamp ? '#fff8c0' : '#3a3a3a');
  ctx.restore();
}
function renderTD() {
  C = ctx; setT();
  const T = G.td, p = G.p, A = G.angler, cx = Math.round(G.camX * R) / R, cy = Math.round(G.camY * R) / R;
  const sx = G.shake > 0 ? (rnd() - 0.5) * G.shake * 2 : 0, sy = G.shake > 0 ? (rnd() - 0.5) * G.shake * 2 : 0;
  ctx.fillStyle = '#071820'; ctx.fillRect(0, 0, W, H);
  setT(-cx + sx, -cy + sy);
  // floor and rock walls
  const i0 = Math.max(0, Math.floor(cx / TDT) - 1), i1 = Math.min(T.w, Math.ceil((cx + W) / TDT) + 1), j0 = Math.max(0, Math.floor(cy / TDT) - 1), j1 = Math.min(T.h, Math.ceil((cy + H) / TDT) + 1);
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
    const c = T.grid[j * T.w + i], x = i * TDT, y = j * TDT, r = hash(i * 31 + j * 17);
    if (c === 0) { ctx.fillStyle = r < 0.5 ? '#163a44' : '#183e48'; ctx.fillRect(x, y, TDT, TDT); if (r > 0.8) el(x + 6 + r * 10, y + 8 + r * 6, 2.4, 1.4, '#22505a'); if (r < 0.06) el(x + 12, y + 12, 3, 2, '#2a5a4a'); }
    else if (c === 1) { ctx.fillStyle = '#0a1c22'; ctx.fillRect(x, y, TDT, TDT); rr(x + 1, y + 1, TDT - 2, TDT - 2, 6, r < 0.5 ? '#1e3a44' : '#22404a'); rr(x + 3, y + 2, TDT - 8, 4, 2, 'rgba(255,255,255,0.06)'); if (r > 0.85) el(x + 8 + r * 6, y + 14, 1.3, 1.3, 'rgba(110,240,220,0.7)'); }
    else { ctx.fillStyle = '#163a44'; ctx.fillRect(x, y, TDT, TDT); if (T.gateK < 1) { const k = T.gateK; rr(x + 2, y + 2 - k * 20, TDT - 4, TDT - 4, 3, '#3a4a50'); seg(x + 4, y + 12 - k * 20, x + TDT - 4, y + 12 - k * 20, 1.4, '#8a2a2a'); } }
  }
  // beacons and items
  for (const b of T.beacons) { rr(b.x - 7, b.y - 7, 14, 14, 3, '#2a3a40'); rr(b.x - 4, b.y - 4, 8, 8, 2, b.lit ? '#9ff8ff' : '#40585e'); }
  for (const c of T.caps) if (!c.dead) { ctx.save(); ctx.translate(c.x, c.y); drawBadge(-6, -5, c.kind, (G.t >> 3) % 2); ctx.restore(); }
  for (const f of T.flares) { rr(f.x - 2, f.y - 4, 4, 8, 1, '#c83a2a'); }
  for (const n of T.nades) { ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(n.t * 9); el(0, 0, 3.4, 2.8, '#3e5a34'); rr(-1, -3.8, 2, 1.6, 0.5, '#9aa0a6'); ctx.restore(); }
  // creatures (only seen where there is light)
  for (const m of T.mobs) {
    const fl = m.flash > 0;
    if (m.t === 'lure') { const a = m.st === 'wait' ? Math.atan2(p.y - m.y, p.x - m.x) : m.ang, bx = m.x - Math.cos(a) * 14, by = m.y - Math.sin(a) * 14; ctx.save(); ctx.translate(bx, by); ctx.rotate(a); el(0, 0, 11, 8, fl ? '#fff' : '#2a2a34'); ctx.fillStyle = '#e8e8e8'; ctx.beginPath(); for (let k = -3; k <= 3; k++) { ctx.moveTo(8, k * 2); ctx.lineTo(12, k * 2 + 1); ctx.lineTo(8, k * 2 + 2); } ctx.fill(); seg(4, -6, 12, -2, 1, '#2a2a34'); el(4, -3, 1.4, 1.4, '#c8d8a0'); ctx.restore(); }
    else if (m.t === 'hunter') { ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.ang); ctx.strokeStyle = fl ? '#fff' : '#3a2e3a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(8, 0); for (let k = 1; k <= 5; k++) ctx.lineTo(8 - k * 4, Math.sin(G.time * 8 + k) * 2.4); ctx.stroke(); el(8, 0, 4.6, 3.6, fl ? '#fff' : '#4a3a4a'); ctx.restore(); }
    else if (m.t === 'jelly') { ctx.fillStyle = fl ? '#fff' : 'rgba(150,230,255,0.75)'; ctx.beginPath(); ctx.ellipse(m.x, m.y, 7, 6, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(160,240,255,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); for (let k = -2; k <= 2; k++) { ctx.moveTo(m.x + k * 2.4, m.y); ctx.quadraticCurveTo(m.x + k * 2.4 + Math.sin(G.time * 2 + k), m.y + 6, m.x + k * 2, m.y + 11); } ctx.stroke(); }
  }
  // the anglerfish body
  if (A.active || Math.abs(A.x - p.x) < 400) {
    ctx.save(); ctx.translate(A.x, A.y); ctx.rotate(A.ang);
    const dead = A.dead;
    ctx.fillStyle = dead ? '#1a1a1a' : '#2a2430'; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(-48, -15); ctx.lineTo(-43, 0); ctx.lineTo(-48, 15); ctx.closePath(); ctx.fill();
    // glowing side fins (breakable)
    for (const [k, sd] of [['finL', -1], ['finR', 1]]) {
      const q = apart(A, k), fl = q.flash > 0, wv = Math.sin(A.t * 5 + sd) * 2;
      if (q.hp > 0) { ctx.fillStyle = fl ? '#fff' : dead ? '#1e1c20' : '#33293a'; ctx.beginPath(); ctx.moveTo(8, sd * 16); ctx.quadraticCurveTo(6, sd * (34 + wv), -10, sd * (36 + wv)); ctx.lineTo(-8, sd * 18); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(120,200,255,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(4, sd * 18); ctx.lineTo(-4, sd * (32 + wv)); ctx.moveTo(-2, sd * 18); ctx.lineTo(-8, sd * (32 + wv)); ctx.stroke(); el(2, sd * 25, 3.6, 3, fl ? '#fff' : '#3a8ab0'); }
      else { ctx.fillStyle = '#1a1620'; ctx.beginPath(); ctx.moveTo(6, sd * 17); ctx.lineTo(0, sd * 24); ctx.lineTo(-4, sd * 21); ctx.lineTo(-7, sd * 18); ctx.closePath(); ctx.fill(); }
    }
    // egg sac at the back (breakable)
    { const q = apart(A, 'sac'), fl = q.flash > 0;
      if (q.hp > 0) { el(-25, 0, 10, 8.5, fl ? '#fff' : 'rgba(120,70,110,0.95)'); for (const [ex2, ey2] of [[-28, -3], [-23, 2], [-27, 4], [-21, -3]]) el(ex2, ey2, 2, 2, fl ? '#fff' : '#d8a060'); el(-27, -4, 4, 2, 'rgba(255,255,255,0.12)'); }
      else { el(-24, 0, 6, 5, '#1a1218'); } }
    el(0, 0, 30, 22, dead ? '#1e1c20' : '#3a3040'); el(-6, -6, 16, 8, 'rgba(255,255,255,0.05)');
    ctx.fillStyle = '#0c0a10'; ctx.beginPath(); ctx.ellipse(22, 0, 9, 4 + A.mouth * 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8e8e0'; ctx.beginPath(); for (let k = -4; k <= 4; k++) { const ty = k * (1 + A.mouth * 2.2); ctx.moveTo(18, ty); ctx.lineTo(24, ty + 1); ctx.lineTo(18, ty + 2); } ctx.fill();
    if (!dead) seg(10, -16, 30, -24, 1.4, '#3a3040');
    ctx.restore();
  }
  for (const s2 of T.shots) drawTDShot(s2);
  // you
  if (!p.dead) { if (!(p.invT > 0 && (G.t >> 2) % 2 === 0)) drawTopDiver(p.x, p.y, p.aim, { frame: p.anim, lamp: lampOn() }); }
  else drawTopDiver(p.x, p.y, p.aim + (1.4 - p.deadT) * 3, { flash: true });
  drawFx();
  // ---- darkness: everything outside the lights is black ----
  if (!DKC || DKC.width !== cv.width || DKC.height !== cv.height) DKC = mk(cv.width, cv.height);
  const g = DKC.getContext('2d'), toS = (x, y) => [(x - cx + sx) * R, (y - cy + sy) * R];
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, DKC.width, DKC.height);
  g.fillStyle = 'rgba(0,3,8,0.96)'; g.fillRect(0, 0, DKC.width, DKC.height);
  g.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => { const [X, Y] = toS(x, y), rg = g.createRadialGradient(X, Y, 0, X, Y, r * R); rg.addColorStop(0, `rgba(0,0,0,${a})`); rg.addColorStop(0.6, `rgba(0,0,0,${a * 0.75})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.beginPath(); g.arc(X, Y, r * R, 0, Math.PI * 2); g.fill(); };
  hole(p.x, p.y, p.glowT > 0 ? 80 : 32, 1);
  if (lampOn() && !p.dead) {
    const [X, Y] = toS(p.x, p.y), rg = g.createRadialGradient(X, Y, 0, X, Y, 150 * R); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.7, 'rgba(0,0,0,0.85)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.beginPath(); g.moveTo(X, Y); g.arc(X, Y, 150 * R, p.aim - 0.5, p.aim + 0.5); g.closePath(); g.fill();
  }
  for (const b of T.beacons) hole(b.x, b.y, b.lit ? 105 : 16, b.lit ? 1 : 0.5);
  for (const f of T.flares) hole(f.x, f.y, 125 * Math.min(1, f.t / 2), 1);
  for (const n of T.nades) hole(n.x, n.y, 14, 0.5);
  for (const m of T.mobs) if (m.t === 'jelly') hole(m.x, m.y, 20, 0.6);
  for (const fx of G.fx) if (fx.k === 'boom') hole(fx.x, fx.y, fx.s * 3, Math.max(0, 1 - fx.t / fx.life));
  if (A.active && A.mouth > 0.2) hole(A.x + Math.cos(A.ang) * 22, A.y + Math.sin(A.ang) * 22, 44 * A.mouth, 0.9);
  for (const s2 of T.shots) hole(s2.x, s2.y, s2.k === 'fire' ? 20 : 12, s2.k === 'fire' ? 0.8 : 0.6);
  g.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(DKC, 0, 0); ctx.restore();
  // ---- glows that are always visible in the dark ----
  setT(-cx + sx, -cy + sy);
  for (const b of T.beacons) { glow(b.x, b.y, b.lit ? 16 : 7, b.lit ? 'rgba(160,250,255,0.9)' : 'rgba(120,200,220,0.45)', 'rgba(120,220,255,0)'); }
  for (const m of T.mobs) {
    if (m.t === 'lure') { glow(m.x, m.y, 7, 'rgba(210,255,160,0.95)', 'rgba(200,255,140,0)'); el(m.x, m.y, 1.6, 1.6, '#fbffe0'); }
    else if (m.t === 'jelly') glow(m.x, m.y - 1, 8, 'rgba(140,230,255,0.5)', 'rgba(140,230,255,0)');
    else if (m.t === 'hunter') { const a = m.chase ? 0.9 : 0.35; for (const sd of [-1, 1]) el(m.x + Math.cos(m.ang) * 9 + Math.cos(m.ang + Math.PI / 2) * sd * 2, m.y + Math.sin(m.ang) * 9 + Math.sin(m.ang + Math.PI / 2) * sd * 2, 0.9, 0.9, `rgba(255,${m.chase ? 90 : 220},80,${a})`); }
  }
  for (const c of T.caps) if (!c.dead && (G.t >> 4) % 3 === 0) el(c.x + 4, c.y - 4, 1, 1, 'rgba(255,255,255,0.8)');
  for (const n of T.nades) glow(n.x, n.y, 4, 'rgba(255,90,60,0.8)', 'rgba(255,60,40,0)');
  for (const f of T.flares) glow(f.x, f.y, 10, 'rgba(255,120,80,0.9)', 'rgba(255,80,40,0)');
  for (const s2 of T.shots) drawTDShot(s2, true);
  if (A.active || Math.abs(A.x - p.x) < 400) {
    if (!A.dead) {
      for (const k of ['finL', 'finR']) { const q = apart(A, k); if (q.hp > 0) { const [fx, fy] = apos(A, k); glow(fx, fy, 7, q.flash > 0 ? 'rgba(255,255,255,1)' : 'rgba(90,200,255,0.75)', 'rgba(90,200,255,0)'); el(fx, fy, 1.6, 1.4, '#c8f0ff'); } }
      const sq = apart(A, 'sac'); if (sq.hp > 0) { const [qx, qy] = apos(A, 'sac'); glow(qx, qy, 9, sq.flash > 0 ? 'rgba(255,255,255,1)' : 'rgba(255,170,90,0.5)', 'rgba(255,150,80,0)'); }
      // once blind, its eyes tell you whether it can sense you
      if (A.parts[0].hp <= 0 && A.mode !== 'eyes' && A.mode !== 'lunge') for (const sd of [-1, 1]) { const ex = A.x + Math.cos(A.ang) * 12 + Math.cos(A.ang + Math.PI / 2) * sd * 8, ey = A.y + Math.sin(A.ang) * 12 + Math.sin(A.ang + Math.PI / 2) * sd * 8; el(ex, ey, 1.6, 1.6, A.sees ? 'rgba(255,190,80,0.95)' : 'rgba(150,170,190,0.45)'); }
    }
    if (!A.dead && A.parts[0].hp > 0) { const lx = A.x + Math.cos(A.ang) * 44, ly = A.y + Math.sin(A.ang) * 44; glow(lx, ly, 12, A.parts[0].flash > 0 ? 'rgba(255,255,255,1)' : 'rgba(210,255,160,0.95)', 'rgba(200,255,140,0)'); el(lx, ly, 2.4, 2.4, '#fbffe0'); }
    if (!A.dead && A.mode === 'eyes') { const k = 1 - Math.max(0, A.modeT) / 0.85; ctx.save(); ctx.translate(A.x, A.y); ctx.rotate(A.ang); const lg = ctx.createLinearGradient(20, 0, 170, 0); lg.addColorStop(0, `rgba(255,60,40,${0.1 + 0.25 * k})`); lg.addColorStop(1, 'rgba(255,60,40,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(20, -14); ctx.lineTo(170, -22); ctx.lineTo(170, 22); ctx.lineTo(20, 14); ctx.closePath(); ctx.fill(); ctx.restore(); }
    if (!A.dead && (A.mode === 'eyes' || A.mode === 'lunge')) for (const sd of [-1, 1]) { const ex = A.x + Math.cos(A.ang) * 12 + Math.cos(A.ang + Math.PI / 2) * sd * 8, ey = A.y + Math.sin(A.ang) * 12 + Math.sin(A.ang + Math.PI / 2) * sd * 8; glow(ex, ey, 6, 'rgba(255,60,40,0.9)', 'rgba(255,40,20,0)'); }
    if (!A.dead && A.mouth > 0.6) { const mx = A.x + Math.cos(A.ang) * 22, my = A.y + Math.sin(A.ang) * 22; glow(mx, my, 10, A.parts[1].flash > 0 ? 'rgba(255,255,255,1)' : 'rgba(255,140,200,0.9)', 'rgba(255,100,180,0)'); }
  }
  if (!p.dead && lampOn()) el(p.x + Math.cos(p.aim) * 8.4, p.y + Math.sin(p.aim) * 8.4, 1.4, 1.4, '#fff8c0');
  drawGuide(cx - sx, cy - sy);
  setT();
}
function drawBattery() {
  const T = G.td, y = 22;
  drawText(`信标 ${T.lit}/3`, W - 12, y + 2, T.lit >= 3 ? '#9ff8ff' : '#9fd6ff', 'right', 8);
}

// =====================================================================
// 水下第六关 海底要塞: a side view through the fortress's sealed compartments. Touch a valve to
// flood or drain the compartment you are in. A bulkhead door only opens when the water on both
// sides is at the same level. Dry rooms: you run and jump. Flooded rooms: you swim (you can only
// reach high places by swimming). Live cables electrify water, gas vents burn on dry floors.
// =====================================================================
const FT = 12, F_COLS = 223, F_ROWS = 18, F_FLOOR = 192, F_CEIL = 24, F_WET = 44, F_DRY = 192;
function initFort() {
  G.en = []; G.pods = []; G.items = []; G.camX = 0; G.camY = 0; G.shark = G.ghost = G.crab = G.queen = null;
  G.sea = { o2: 1, vents: [], pockets: [], surface: false, boats: false, diverT: 99, boatT: 99, warnT: 0 };
  const g = []; for (let j = 0; j < F_ROWS; j++) g.push(new Uint8Array(F_COLS));
  const fill = (i0, j0, i1, j1, v = 1) => { for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) g[j][i] = v; };
  fill(0, 0, F_COLS - 1, 1); fill(0, 16, F_COLS - 1, 17); fill(0, 0, 1, 17); fill(221, 0, 222, 17);
  const F = G.fort = { grid: g, comps: [], doors: [], doorAt: {}, mobs: [], shots: [], eb: [], nades: [], caps: [], vents: [], cp: 0, alarm: false, c4wet: false, ambush: false, hint1: false };
  const comp = (i0, i1, wet, pump) => { const c = { x0: i0 * FT, x1: (i1 + 1) * FT, level: wet ? F_WET : F_DRY, target: wet ? F_WET : F_DRY, moving: false, pump: pump ? { x: pump[0], y: pump[1], ready: true, spin: 0 } : null, zap: 'idle', zapT: 0, idleT: 3, auto: false, idx: F.comps.length }; F.comps.push(c); return c; };
  comp(2, 32, false, null); comp(35, 68, false, [486, 172]); comp(71, 109, true, [1272, 172]); comp(112, 145, true, [1386, 172]); comp(148, 186, false, [2160, 58]); comp(189, 220, false, null);
  F.comps[2].auto = true; // a live cable keeps arcing through compartment 2 until its junction box is shot
  const door = (b, j0, j1, L) => { fill(b, 0, b + 1, 17); fill(b, j0, b + 1, j1, 2); const d = { i: b, x: b * FT, j0, j1, y0: j0 * FT, y1: (j1 + 1) * FT, L: F.comps[L], R: F.comps[L + 1], k: 1, open: true, lock: false }; F.doors.push(d); F.doorAt[b] = F.doorAt[b + 1] = d; };
  door(33, 12, 15, 0); door(69, 12, 15, 1); door(110, 3, 6, 2); door(146, 12, 15, 3); door(187, 12, 15, 4);
  fill(20, 11, 24, 11); fill(13, 14, 15, 15);
  fill(44, 14, 47, 15); fill(52, 7, 60, 7);
  fill(84, 11, 86, 15); fill(94, 8, 99, 8);
  fill(121, 14, 123, 15); fill(129, 14, 131, 15);
  fill(152, 10, 163, 10); fill(176, 6, 184, 6);
  fill(190, 10, 194, 10); fill(215, 10, 219, 10);
  F.vents = [{ x: 1428, ph: 0 }, { x: 1518, ph: 0.9 }, { x: 1614, ph: 1.8 }];
  const sold = (x, y) => F.mobs.push({ t: 'sold', x, y, vx: 0, vy: 0, hp: 2, face: -1, cd: 1 + rnd(), anim: 0, flash: 0, drown: 0 });
  const drone = (x, y) => F.mobs.push({ t: 'drone', x, y, ax: x, ay: y, vx: 0, vy: 0, hp: 2, cd: 2 + rnd() * 2, flash: 0, gt: 0, ph: rnd() * 6, face: -1 });
  const mine = (x, y) => F.mobs.push({ t: 'mine', x, y, ax: x, ay: y, hp: 1, flash: 0 });
  F.sold = sold;
  sold(250, 192); sold(330, 192); sold(266, 132);
  sold(600, 192); sold(760, 192);
  F.mobs.push({ t: 'jbox', x: 884, y: 34, hp: 6, flash: 0 });
  mine(960, 110); mine(1080, 160); mine(1190, 84); drone(1010, 92); drone(1150, 130); drone(1240, 64);
  drone(1500, 100); drone(1660, 140); mine(1580, 70);
  sold(1900, 192); sold(2050, 192); sold(1880, 120); F.mobs.push({ t: 'tur', x: 2010, y: 30, hp: 5, cd: 2, flash: 0 });
  F.caps.push({ x: 676, y: 74, kind: 'K' }, { x: 1130, y: 182, kind: 'S' }, { x: 1700, y: 182, kind: 'T' }, { x: 1950, y: 110, kind: 'M' });
  G.fcore = { x: 2460, y: 104, active: false, dead: false, deadT: 0, phase2: false, state: 'dry', cycT: 6, sweepT: 2, sweep: null, gunT: 1.4, gunSide: 0, zapT: 0, t: 0,
    parts: [{ k: 'core', hp: 90, max: 90, flash: 0, x: 2460, y: 104, r: 22 }, { k: 'pumpL', hp: 25, max: 25, flash: 0, x: 2281, y: 86, r: 12 }, { k: 'pumpR', hp: 25, max: 25, flash: 0, x: 2639, y: 86, r: 12 }, { k: 'gunL', hp: 16, max: 16, flash: 0, x: 2424, y: 120, r: 9 }, { k: 'gunR', hp: 16, max: 16, flash: 0, x: 2496, y: 120, r: 9 }] };
  Object.assign(G.p, { x: 60, y: F_FLOOR, vx: 0, vy: 0, face: 1, ax: 1, ay: 0, airJumps: 1, insulT: 0, swim: false, onGround: true });
  banner('海底要塞：碰一下阀门给本舱注水或排水，两侧水位一样舱门才会打开', 3.2);
}
function fSolid(x, y) {
  const F = G.fort, i = Math.floor(x / FT), j = Math.floor(y / FT);
  if (i < 0 || i >= F_COLS || j < 0 || j >= F_ROWS) return true;
  const v = F.grid[j][i];
  return v === 1 || (v === 2 && F.doorAt[i].k < 0.9);
}
function fHit(x, y, hw, h) { for (const yy of [y - h + 0.5, y - h / 2, y - 0.5]) for (const xx of [x - hw, x + hw]) if (fSolid(xx, yy)) return true; return false; }
function fMove(o, dx, dy, hw, h) {
  o.ground = false;
  if (dx) { if (!fHit(o.x + dx, o.y, hw, h)) o.x += dx; else { const st = Math.sign(dx) * 0.5; for (let k = 0; k < Math.abs(dx); k += 0.5) { if (fHit(o.x + st, o.y, hw, h)) break; o.x += st; } o.vx = 0; } }
  if (dy) { if (!fHit(o.x, o.y + dy, hw, h)) o.y += dy; else { const st = Math.sign(dy) * 0.5; for (let k = 0; k < Math.abs(dy); k += 0.5) { if (fHit(o.x, o.y + st, hw, h)) break; o.y += st; } if (dy > 0) o.ground = true; o.vy = 0; } }
}
// same controls as the main stages: on the ground, down alone lies prone and down + a direction aims
// diagonally down; in the air you can aim anywhere, straight down included
function landAim(p, h, v) {
  if (!p.onGround) { p.prone = false; if (!h && !v) { p.ax = p.face; p.ay = 0; } else { p.ax = h; p.ay = v; } return; }
  p.prone = v > 0 && !h;
  if (v < 0) { p.ax = h; p.ay = -1; } else if (v > 0) { if (h) { p.ax = h; p.ay = 1; } else { p.ax = p.face; p.ay = 0; } } else { p.ax = h || p.face; p.ay = 0; }
}
function fComp(x) { const cs = G.fort.comps; for (const c of cs) if (x < c.x1 + 12) return c; return cs[cs.length - 1]; }
const fWet = c => c.level < F_FLOOR - 20;
function fToggle(c) { c.target = c.target === F_WET ? F_DRY : F_WET; tone(c.target === F_WET ? 220 : 330, 0.4, 'triangle', 0.08, c.target === F_WET ? 110 : 660); noise(0.6, 0.12, 900); }
function fBubbles(x, y) { for (let i = 0; i < 5; i++) G.fx.push({ k: 'bub', x: x + (rnd() - 0.5) * 12, y: y + rnd() * 4, vx: (rnd() - 0.5) * 16, vy: -18 - rnd() * 18, t: 0, life: 0.7 }); }
function fShoot(x, y, a, sp) { G.fort.eb.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 4 }); sfx.eshot(); }
function fMineBoom(m) {
  const F = G.fort, p = G.p; if (m.dead) return; m.dead = true; boom(m.x, m.y, 12); sfx.boom(); shake(2);
  if (!p.dead && Math.hypot(p.x - m.x, p.y - 11 - m.y) < 28) killPlayer();
  for (const o of F.mobs) if (!o.dead && o !== m && Math.hypot(o.x - m.x, o.y - m.y) < 34) { if (o.t === 'mine') fMineBoom(o); else fDmg(o, 3); }
}
function fDmg(m, d) {
  if (m.dead) return;
  if (m.t === 'mine') { addScore(100); fMineBoom(m); return; }
  m.hp -= d; m.flash = 0.07; sfx.hit();
  if (m.hp <= 0) {
    m.dead = true; boom(m.x, m.t === 'sold' ? m.y - 12 : m.y, 9); sfx.boom();
    addScore({ sold: 200, drone: 200, tur: 500, jbox: 1000 }[m.t] || 100);
    if (m.t === 'jbox') { const c = G.fort.comps[2]; c.auto = false; c.zap = 'idle'; banner('接线盒被打掉 · 2 号舱不再漏电', 1.6); }
  }
}
function fBlast(x, y) {
  const F = G.fort; boom(x, y, 20); sfx.big(); shake(3);
  for (const m of F.mobs) if (!m.dead && Math.hypot(m.x - x, (m.t === 'sold' ? m.y - 11 : m.y) - y) < 46) fDmg(m, 6);
  const B = G.fcore; if (B.active && !B.dead) for (const pt of B.parts) if (pt.hp > 0 && Math.hypot(pt.x - x, pt.y - y) < 50) fHitBoss(pt, 8);
}
const fShielded = () => G.fcore.parts[1].hp > 0 || G.fcore.parts[2].hp > 0;
function fHitBoss(pt, dmg) {
  const B = G.fcore; if (pt.hp <= 0 || B.dead) return;
  if (pt.k === 'core' && fShielded()) { pt.shieldFlash = 0.12; spark(pt.x, pt.y); return; }
  pt.hp -= dmg; pt.flash = 0.06; sfx.hit();
  if (pt.hp <= 0 && pt.k !== 'core') {
    boom(pt.x, pt.y, 14); sfx.boom(); shake(2); addScore(pt.k.startsWith('pump') ? 3000 : 1500);
    if (pt.k.startsWith('pump')) banner(fShielded() ? (pt.k === 'pumpL' ? '左' : '右') + '冷却泵被毁 · 再打掉另一台' : '冷却泵全毁 · 核心护盾解除！', 1.8);
    else banner((pt.k === 'gunL' ? '左' : '右') + '侧炮塔被毁', 1.2);
  }
  if (pt.k === 'core') {
    if (!B.phase2 && pt.hp <= pt.max / 2) { B.phase2 = true; banner('核心过载 · 注排水加速', 1.6); }
    if (pt.hp <= 0) { B.dead = true; B.deadT = 3.2; addScore(15000); for (const m of G.fort.mobs) m.dead = true; G.fort.eb.length = 0; Music.stop(); banner('要塞核心「镇海」被摧毁', 2.4); sfx.big(); }
  }
}
function fVent(v) { // 0 off, 1 warming up, 2 burning
  if (G.fort.comps[3].level < F_FLOOR - 3) return 0;
  const t = (G.time + v.ph) % 2.8; return t < 0.7 ? 1 : t < 1.9 ? 2 : 0;
}
function fRespawn() {
  const F = G.fort, c = F.comps[F.cp], x = F.cp === 5 ? c.x0 + 40 : F.cp === 3 ? c.x0 + 16 : c.x0 + 30;
  let y = fWet(c) ? Math.min(c.level + 40, F_FLOOR) : F_FLOOR;
  while (fHit(x, y, 5, 22) && y > 40) y -= 6;
  G.p = newPlayer(x); Object.assign(G.p, { x, y, vx: 0, vy: 0, face: 1, ax: 1, ay: 0, airJumps: 1, insulT: 0, invT: 3, swim: false, onGround: false });
}
function fShotStep(s2, F, B) {
  s2.t += DT; s2.life -= DT;
  if (s2.k === 'fire') {
    s2.cx += s2.vx * DT; s2.cy += s2.vy * DT;
    const r = Math.min(10, s2.t * 70), a = s2.t * 13 * s2.dir, fx = Math.cos(s2.ang), fy = Math.sin(s2.ang);
    s2.x = s2.cx + (-fy * Math.cos(a) + fx * Math.sin(a)) * r; s2.y = s2.cy + (fx * Math.cos(a) + fy * Math.sin(a)) * r;
    s2.tr.push(s2.x, s2.y); if (s2.tr.length > 20) s2.tr.splice(0, 2);
  } else if (s2.k === 'homing') {
    let tg = null, bd = 230;
    for (const m of F.mobs) { if (m.dead) continue; const my = m.t === 'sold' ? m.y - 11 : m.y, dd = Math.hypot(m.x - s2.x, my - s2.y); if (dd < bd) { bd = dd; tg = [m.x, my]; } }
    if (B.active && !B.dead) for (const pt of B.parts) { if (pt.hp <= 0 || (pt.k === 'core' && fShielded())) continue; const dd = Math.hypot(pt.x - s2.x, pt.y - s2.y); if (dd < bd + 80) { bd = dd - 80; tg = [pt.x, pt.y]; } }
    if (tg) { let da = Math.atan2(tg[1] - s2.y, tg[0] - s2.x) - s2.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); s2.ang += Math.max(-5 * DT, Math.min(5 * DT, da)); }
    const sp = Math.min(240, Math.hypot(s2.vx, s2.vy) + 260 * DT); s2.vx = Math.cos(s2.ang) * sp; s2.vy = Math.sin(s2.ang) * sp;
    s2.x += s2.vx * DT; s2.y += s2.vy * DT; s2.tr.push(s2.x, s2.y); if (s2.tr.length > 14) s2.tr.splice(0, 2);
  } else { s2.x += s2.vx * DT; s2.y += s2.vy * DT; }
  return !(s2.life <= 0 || fSolid(s2.k === 'fire' ? s2.cx : s2.x, s2.k === 'fire' ? s2.cy : s2.y));
}
const fMobHit = (m, x, y, r) => m.t === 'sold' ? Math.abs(m.x - x) < 6 + r && y > m.y - 23 - r && y < m.y + r : Math.hypot(m.x - x, m.y - y) < (m.t === 'tur' || m.t === 'jbox' ? 9 : 7) + r;
function updateFort(I) {
  const F = G.fort, p = G.p, frozen = G.freezeT > 0, B = G.fcore;
  if (p.flashT > 0) p.flashT -= DT;
  // ---- water levels, live water, doors ----
  for (const c of F.comps) {
    if (c.level !== c.target) { const st = 46 * DT; c.level = Math.abs(c.target - c.level) <= st ? c.target : c.level + Math.sign(c.target - c.level) * st; }
    c.moving = c.level !== c.target;
    if (c.pump && c.moving) c.pump.spin += DT * 6;
    if (!fWet(c)) c.zap = 'idle';
    else if (c.zap === 'warn') { c.zapT -= DT; if (c.zapT <= 0) { c.zap = 'zap'; c.zapT = 0.9; noise(0.6, 0.22, 3800); tone(70, 0.6, 'sawtooth', 0.1, 40); shake(2); } }
    else if (c.zap === 'zap') { c.zapT -= DT; if (c.zapT <= 0) c.zap = 'idle'; }
    else if (c.auto) { c.idleT -= DT; if (c.idleT <= 0) { c.zap = 'warn'; c.zapT = 1.3; c.idleT = 4; tone(500, 1.1, 'square', 0.025, 1000); } }
  }
  for (const d of F.doors) {
    d.open = !d.lock && !d.L.moving && !d.R.moving && d.L.level === d.R.level;
    const inGap = !p.dead && Math.abs(p.x - (d.x + 12)) < 19 && p.y > d.y0 && p.y - 22 < d.y1;
    if (d.open) d.k = Math.min(1, d.k + DT * 2.2); else if (!inGap) d.k = Math.max(0, d.k - DT * 2.2);
  }
  // ---- you ----
  if (p.dead) {
    p.deadT -= DT; p.vy = Math.min(p.vy + 400 * DT, 120); fMove(p, p.vx * DT * 0.4, p.vy * DT, 5, 22);
    if (p.deadT <= 0) { if (G.lives > 0) fRespawn(); else { gameOver(); return; } }
  } else {
    if (p.invT > 0) p.invT -= DT; if (p.shieldT > 0) p.shieldT -= DT; if (p.spCd > 0) p.spCd -= DT; if (p.insulT > 0) p.insulT -= DT;
    const c = fComp(p.x), cy = p.y - 11, h = (I.right ? 1 : 0) - (I.left ? 1 : 0), v = (I.down ? 1 : 0) - (I.up ? 1 : 0);
    if (h) p.face = h;
    const wasSwim = p.swim; p.swim = cy > c.level - 1 && c.level < F_FLOOR - 18; // shallow water is just wading
    if (p.swim && !wasSwim && p.vy > 120) { fBubbles(p.x, c.level + 4); sfx.splash(); }
    if (p.swim) {
      p.prone = false; p.vx += (h * 82 - p.vx) * Math.min(1, DT * 5);
      const surf = cy < c.level + 5, tv = v * 78;
      p.vy += ((surf && tv < 0 ? 0 : tv) - p.vy) * Math.min(1, DT * 5);
      if (I.jumpEdge) { if (cy < c.level + 10) { p.vy = -250; p.airJumps = 1; sfx.jump(); } else p.vy = -120; }
      if (h || v) { p.ax = h; p.ay = v; } else { p.ax = p.face; p.ay = 0; }
    } else {
      landAim(p, h, v); p.vx = p.prone ? 0 : h * 80;
      p.vy = Math.min(p.vy + 760 * DT, 330);
      if (I.jumpEdge) { if (p.onGround) { p.vy = -255; sfx.jump(); } else if (p.airJumps > 0) { p.airJumps--; p.vy = -235; sfx.jump2(); } }
    }
    fMove(p, p.vx * DT, p.vy * DT, 5, 22);
    p.onGround = p.ground; if (p.onGround) p.airJumps = 1;
    if (p.swim && p.vy > -150 && p.y - 11 < c.level + 3 && !fHit(p.x, c.level + 14, 5, 22)) { p.y = c.level + 14; if (p.vy < 0) p.vy = 0; } // float with your head out of the water
    p.anim += DT * ((h || (p.swim && v)) ? 10 : 3);
    // fire
    p.cool -= DT;
    if (I.fireEdge) p.wantFire = true;
    if ((SET.autofire === 'on' ? I.fire : p.wantFire) && p.cool <= 0) {
      p.wantFire = false; const wk = p.weapon, w = WEAP[wk], dm = wk === 'laser' || wk === 'fire' || wk === 'homing' ? 2 : 1;
      const aim = p.botAim != null ? p.botAim : Math.atan2(p.ay, p.ax || (p.ay ? 0 : p.face));
      const ox = p.swim ? p.x + Math.cos(aim) * 12 : p.prone ? p.x + p.face * 17 : p.x + Math.cos(aim) * 11, oy = p.swim ? p.y - 11 + Math.sin(aim) * 8 : p.prone ? p.y - 4 : (p.onGround ? p.y - 22 : p.y - 15) + Math.sin(aim) * 11;
      const shot = (da, o) => { const a = aim + da, sp = (o && o.sp) || 240; F.shots.push(Object.assign({ k: wk, x: ox, y: oy, cx: ox, cy: oy, ang: a, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.3, t: 0, dmg: dm, pierce: wk === 'laser', hits: new Set(), tr: [] }, o || {})); };
      if (wk === 'spread') { for (const d of [-0.3, -0.15, 0, 0.15, 0.3]) shot(d); sfx.spread(); }
      else if (wk === 'fire') { F.fireDir = -(F.fireDir || 1); shot(0, { sp: 150, life: 1.6, dir: F.fireDir }); sfx.fire(); }
      else if (wk === 'homing') { shot(0, { sp: 120, life: 1.9 }); sfx.msl(); }
      else if (wk === 'laser') { shot(0, { sp: 340 }); sfx.laser(); }
      else { shot(0, wk === 'machine' ? { sp: 270 } : null); sfx.shoot(); }
      p.cool = w.cd * (p.rapid ? 0.7 : 1); p.flashT = 0.05;
    }
    if (I.cycEdge && G.inv.length > 1) { G.sel = (G.sel + 1) % G.inv.length; sfx.hit(); }
    if (I.grenEdge) useSpecial();
    // valves: touch one to flood or drain this compartment
    for (const cc of F.comps) if (cc.pump) { const q = cc.pump, d = Math.hypot(p.x - q.x, p.y - 11 - q.y); if (d < 16 && q.ready && !cc.moving) { q.ready = false; fToggle(cc); banner(cc.target === F_WET ? `${cc.idx}号舱注水中…` : `${cc.idx}号舱排水中…`, 1.2); } else if (d > 28) q.ready = true; }
    for (const k of F.caps) if (!k.dead && Math.abs(k.x - p.x) < 10 && Math.abs(k.y - (p.y - 11)) < 16) { k.dead = true; pickItem(k.kind); }
    // checkpoints and scripted moments
    for (const cc of F.comps) if (cc.idx > F.cp && p.x > cc.x0 + 24) F.cp = cc.idx;
    if (!F.hint1 && p.x > 760 && !fWet(F.comps[1])) { F.hint1 = true; banner('隔壁 2 号舱灌满了水 · 先碰阀门给本舱注水', 2.2); }
    const c4 = F.comps[4];
    if (!F.alarm && p.x > 1830) { F.alarm = true; c4.target = F_WET; banner('警报 · 4 号舱破损进水！游到高处的阀门把水排掉', 2.6); tone(600, 1.4, 'square', 0.05, 400); }
    if (c4.level === F_WET) F.c4wet = true;
    if (F.c4wet && !F.ambush && c4.level === F_DRY) { F.ambush = true; F.sold(2010, 40); F.sold(2100, 40); banner('伏兵从天花板落下', 1.2); }
    if (!B.active && !B.dead && p.x > F.comps[5].x0 + 30) { B.active = true; F.doors[4].lock = true; B.cycT = 5; B.sweepT = 1.6; banner('警告 · 要塞核心「镇海」', 2.2); Music.start(true, 3); }
    // hazards: live water, gas flames
    if (c.zap === 'zap' && p.y - 11 > c.level + 5 && !(p.insulT > 0)) killPlayer();
    for (const vt of F.vents) if (fVent(vt) === 2 && Math.abs(p.x - vt.x) < 10 && p.y > F_FLOOR - 70 && !(p.fireproofT > 0)) killPlayer();
  }
  // ---- grenades ----
  for (const n of F.nades) {
    n.t += DT; const wet = n.y > fComp(n.x).level;
    if (wet) { n.vx *= Math.pow(0.25, DT); n.vy = n.vy * Math.pow(0.25, DT) + 50 * DT; } else n.vy += 600 * DT;
    if (fSolid(n.x + n.vx * DT, n.y)) n.vx *= -0.4;
    if (fSolid(n.x, n.y + n.vy * DT)) { n.vy *= -0.35; n.vx *= 0.7; }
    n.x += n.vx * DT; n.y += n.vy * DT;
    const touch = F.mobs.some(m => !m.dead && fMobHit(m, n.x, n.y, 3)) || (B.active && !B.dead && B.parts.some(pt => pt.hp > 0 && Math.hypot(pt.x - n.x, pt.y - n.y) < pt.r + 3));
    if (n.t > 1 || (touch && n.t > 0.06)) { n.dead = true; fBlast(n.x, n.y); }
  }
  sweep(F.nades);
  // ---- enemies ----
  for (const m of F.mobs) {
    if (m.flash > 0) m.flash -= DT;
    if (frozen || m.dead) continue;
    const c = fComp(m.x), pc = fComp(p.x), dx = p.x - m.x;
    if (m.t === 'sold') {
      if (c.level < m.y - 18) { m.drown += DT; m.y -= 8 * DT; if (m.drown > 1.2) { m.dead = true; addScore(100); fBubbles(m.x, m.y - 14); } continue; }
      m.vy = Math.min(m.vy + 700 * DT, 300);
      const near = !p.dead && Math.abs(dx) < 230 && pc === c && !p.swim;
      let tv = 0;
      if (near) { m.face = Math.sign(dx) || m.face; if (Math.abs(dx) > 120) tv = m.face * 38; else if (Math.abs(dx) < 60) tv = -m.face * 30; }
      if (tv && (!fSolid(m.x + Math.sign(tv) * 8, m.y + 4) || fSolid(m.x + Math.sign(tv) * 8, m.y - 10))) tv = 0;
      m.vx = tv; fMove(m, m.vx * DT, m.vy * DT, 5, 22); m.anim += DT * (tv ? 8 : 0);
      m.cd -= DT;
      if (near && m.cd <= 0 && Math.abs(p.y - m.y) < 60) { m.cd = 1.8 + rnd() * 0.7; const a2 = Math.max(-0.45, Math.min(0.45, Math.atan2((p.y - 13) - (m.y - 15), Math.abs(dx)))), cl = m.face > 0 ? a2 : Math.PI - a2; fShoot(m.x + m.face * 10, m.y - 15, cl, 120); }
      if (!p.dead && Math.abs(dx) < 10 && Math.abs(p.y - m.y) < 20) killPlayer();
    } else if (m.t === 'drone') {
      if (c.level > m.y - 2) { // stranded on a dry floor: it flops about and blows up
        m.vy = Math.min(m.vy + 500 * DT, 300); if (!fSolid(m.x, m.y + 5 + m.vy * DT)) m.y += m.vy * DT; else { m.vy = 0; m.gt += DT; if (m.gt > 1.2) { m.dead = true; boom(m.x, m.y, 8); sfx.boom(); addScore(100); } }
        continue;
      }
      const dy = (p.y - 11) - m.y, d = Math.hypot(dx, dy), hunt = !p.dead && p.swim && pc === c && d < 170;
      let tx = m.ax + Math.sin(G.time * 0.7 + m.ph) * 20, ty = m.ay + Math.sin(G.time * 1.1 + m.ph) * 8;
      if (hunt) { tx = p.x - dx / (d || 1) * 50; ty = p.y - 11 - dy / (d || 1) * 50; }
      const ex = tx - m.x, ey = ty - m.y, el2 = Math.hypot(ex, ey) || 1, sp = hunt ? 46 : 26;
      m.vx += (ex / el2 * sp - m.vx) * Math.min(1, DT * 2); m.vy += (ey / el2 * sp - m.vy) * Math.min(1, DT * 2);
      const nx = m.x + m.vx * DT, ny = Math.max(c.level + 6, m.y + m.vy * DT);
      if (!fSolid(nx, ny) && !fSolid(nx + Math.sign(m.vx) * 8, ny)) { m.x = nx; m.y = ny; }
      if (Math.abs(m.vx) > 3) m.face = Math.sign(m.vx);
      m.cd -= DT; if (hunt && m.cd <= 0) { m.cd = 3 + rnd(); fShoot(m.x + m.face * 8, m.y, Math.atan2(dy, dx), 70); }
      if (!p.dead && Math.hypot(dx, dy) < 11) killPlayer();
    } else if (m.t === 'mine') {
      if (c.level > m.ay - 6) { if (!fSolid(m.x, m.y + 8)) m.y = Math.min(F_FLOOR - 7, m.y + 90 * DT); }
      else { const ty = m.ay + Math.sin(G.time + m.ax) * 3; m.y += Math.max(-30 * DT, Math.min(30 * DT, ty - m.y)); }
      if (!p.dead && Math.hypot(dx, (p.y - 11) - m.y) < 13) fMineBoom(m);
    } else if (m.t === 'tur') {
      const dy = (p.y - 12) - m.y; m.ang = Math.atan2(dy, dx); m.cd -= DT;
      if (!p.dead && m.cd <= 0 && Math.hypot(dx, dy) < 260) { m.cd = 2.4; fShoot(m.x + Math.cos(m.ang) * 9, m.y + Math.sin(m.ang) * 9, m.ang, 105); }
    }
  }
  // ---- your shots ----
  for (const s2 of F.shots) {
    if (!fShotStep(s2, F, B)) { s2.dead = true; spark(s2.x, s2.y); continue; }
    const hr = s2.k === 'fire' ? 5 : 3;
    for (const m of F.mobs) {
      if (m.dead || s2.hits.has(m) || !fMobHit(m, s2.x, s2.y, hr)) continue;
      fDmg(m, s2.dmg);
      if (s2.pierce) s2.hits.add(m); else { s2.dead = true; break; }
    }
    if (s2.dead || !B.active || B.dead) continue;
    for (const pt of B.parts) {
      if (pt.hp <= 0 || s2.hits.has(pt) || Math.hypot(pt.x - s2.x, pt.y - s2.y) > pt.r + hr - 2) continue;
      fHitBoss(pt, s2.dmg);
      if (s2.pierce && !(pt.k === 'core' && fShielded())) s2.hits.add(pt); else { s2.dead = true; break; }
    }
  }
  sweep(F.mobs); sweep(F.shots);
  // ---- enemy shots ----
  for (const b of F.eb) {
    const f = b.y > fComp(b.x).level ? 0.6 : 1; b.x += b.vx * DT * f; b.y += b.vy * DT * f; b.life -= DT;
    if (b.life <= 0 || fSolid(b.x, b.y)) { b.dead = true; continue; }
    if (!p.dead && Math.abs(b.x - p.x) < (p.prone ? 10 : 6) && b.y > p.y - (p.prone ? 9 : 22) && b.y < p.y) { b.dead = true; killPlayer(); }
  }
  sweep(F.eb);
  // ---- 要塞核心「镇海」 ----
  for (const pt of B.parts) { if (pt.flash > 0) pt.flash -= DT; if (pt.shieldFlash > 0) pt.shieldFlash -= DT; }
  const Ar = F.comps[5];
  if (B.dead) { B.deadT -= DT; if (rnd() < 0.3) { boom(B.x + (rnd() - 0.5) * 70, B.y + (rnd() - 0.5) * 70, 10); if (rnd() < 0.4) sfx.boom(); } if (B.deadT <= 0) stageClear(); }
  else if (B.active && !frozen) {
    B.t += DT;
    const dur = B.phase2 ? 5 : 7;
    B.cycT -= DT;
    if (B.state === 'dry') {
      B.sweepT -= DT;
      if (B.sweepT <= 0 && !B.sweep && B.cycT > 1.6) { B.sweep = { t: 0 }; B.sweepT = B.phase2 ? 2.4 : 3.2; tone(160, 0.7, 'sawtooth', 0.06, 320); }
      if (B.cycT <= 0 && !B.sweep) { B.state = 'fill'; Ar.target = F_WET; banner('核心开始注水 · 当心漏电', 1.2); }
    } else if (B.state === 'fill') { if (Ar.level === F_WET) { B.state = 'wet'; B.cycT = dur; B.zapT = 1.6; } }
    else if (B.state === 'wet') {
      B.zapT -= DT;
      if (B.zapT <= 0 && Ar.zap === 'idle') { Ar.zap = 'warn'; Ar.zapT = 1.4; B.zapT = B.phase2 ? 2.6 : 99; tone(500, 1.2, 'square', 0.03, 1000); }
      if (B.cycT <= 0 && Ar.zap === 'idle') { B.state = 'drain'; Ar.target = F_DRY; }
    } else if (B.state === 'drain') { if (Ar.level === F_DRY) { B.state = 'dry'; B.cycT = dur; B.sweepT = 1; } }
    if (B.sweep) {
      B.sweep.t += DT; const sp = B.phase2 ? 150 : 120, d = (B.sweep.t - 0.8) * sp;
      if (d > 200 || fWet(Ar)) B.sweep = null;
      else if (d > 0 && !p.dead && p.y > F_FLOOR - 26 && (Math.abs(p.x - (B.x - d)) < 12 || Math.abs(p.x - (B.x + d)) < 12) && !(p.fireproofT > 0)) killPlayer();
    }
    B.gunT -= DT;
    if (B.gunT <= 0) {
      B.gunT = B.phase2 ? 0.9 : 1.3; B.gunSide ^= 1;
      const g2 = B.parts[3 + B.gunSide]; if (g2.hp > 0 && !p.dead) fShoot(g2.x, g2.y, Math.atan2(p.y - 12 - g2.y, p.x - g2.x), 95);
    }
    if (!p.dead && Math.hypot(p.x - B.x, p.y - 11 - B.y) < 28) killPlayer();
  }
  // camera
  G.camX = B.active ? F.comps[5].x0 : Math.max(0, Math.min(F.comps[5].x0, p.x - W * 0.4)); G.camY = 0;
}
// ---------- drawing ----------
function drawFortCore() {
  const B = G.fcore, p = G.p, dead = B.dead, sh = fShielded(), [core, pL, pR, gL, gR] = B.parts;
  seg(B.x, F_CEIL, B.x, B.y - 28, 7, '#34424c'); seg(B.x, B.y + 28, B.x, F_FLOOR, 7, '#34424c');
  for (const [pt, sd] of [[pL, -1], [pR, 1]]) {
    seg(pt.x, pt.y, B.x + sd * 28, B.y - 4, 3, pt.hp > 0 ? '#2a6a8a' : '#2a2e32');
    rr(pt.x - 9, pt.y - 17, 18, 34, 4, pt.flash > 0 ? '#fff' : '#4a5a64');
    if (pt.hp > 0) { el(pt.x, pt.y, 7, 7, '#103040'); ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(B.t * 8); for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI * 2 / 3); el(3, 0, 3.4, 1.4, '#7ad8ff'); } ctx.restore(); glow(pt.x, pt.y, 10, 'rgba(110,220,255,0.35)', 'rgba(110,220,255,0)'); }
    else { el(pt.x, pt.y, 6, 6, '#1a1a1a'); seg(pt.x - 5, pt.y - 4, pt.x + 4, pt.y + 5, 1, '#5a5a5a'); }
  }
  el(B.x, B.y, 30, 30, dead ? '#2a2a2a' : '#4a5660'); el(B.x, B.y, 30, 30, 'rgba(0,0,0,0)');
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; el(B.x + Math.cos(a) * 26, B.y + Math.sin(a) * 26, 1.4, 1.4, '#2a343c'); }
  const hot = !sh && !dead, pulse = 0.5 + 0.5 * Math.sin(B.t * 3);
  el(B.x, B.y, 21, 21, core.flash > 0 ? '#fff' : dead ? '#1a1a1a' : hot ? '#e8602a' : '#2a6a8a');
  if (!dead) { el(B.x, B.y, 10, 10, hot ? '#ffd080' : '#7ad8ff'); glow(B.x, B.y, 20, hot ? `rgba(255,140,60,${0.35 + 0.2 * pulse})` : `rgba(110,220,255,${0.2 + 0.1 * pulse})`, 'rgba(0,0,0,0)'); el(B.x - 5, B.y - 6, 4, 3, 'rgba(255,255,255,0.3)'); }
  if (sh && !dead) { ctx.strokeStyle = core.shieldFlash > 0 ? 'rgba(255,255,255,0.95)' : 'rgba(130,230,255,0.55)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(B.x, B.y, 24, 0, Math.PI * 2); ctx.stroke(); }
  for (const g2 of [gL, gR]) {
    if (g2.hp <= 0) { el(g2.x, g2.y, 4, 3, '#222'); continue; }
    const a = Math.atan2(p.y - 12 - g2.y, p.x - g2.x);
    seg(g2.x, g2.y, g2.x + Math.cos(a) * 11, g2.y + Math.sin(a) * 11, 3, '#2a3036'); rr(g2.x - 7, g2.y - 5, 14, 10, 3, g2.flash > 0 ? '#fff' : '#5a6670'); el(g2.x, g2.y, 2, 2, '#e8402a');
  }
  if (B.sweep && !dead) {
    const d = (B.sweep.t - 0.8) * (B.phase2 ? 150 : 120);
    if (d <= 0) glow(B.x, F_FLOOR - 4, 22 * (B.sweep.t / 0.8), 'rgba(255,150,60,0.7)', 'rgba(255,100,40,0)');
    else for (const sd of [-1, 1]) drawFlame(B.x + sd * d, F_FLOOR, 0, -1, 26, 9, sd);
  }
}
function renderFort() {
  C = ctx; setT();
  const F = G.fort, p = G.p, B = G.fcore, cx = Math.round(G.camX * R) / R;
  const sx = G.shake > 0 ? (rnd() - 0.5) * G.shake * 2 : 0, sy = G.shake > 0 ? (rnd() - 0.5) * G.shake * 2 : 0;
  ctx.fillStyle = '#0c161d'; ctx.fillRect(0, 0, W, H);
  setT(-cx + sx, sy);
  // back walls
  for (const c of F.comps) {
    if (c.x1 < cx || c.x0 > cx + W) continue;
    ctx.fillStyle = '#1c2a33'; ctx.fillRect(c.x0, F_CEIL, c.x1 - c.x0, F_FLOOR - F_CEIL);
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; for (let x = c.x0 + 24; x < c.x1; x += 48) ctx.fillRect(x, F_CEIL, 1, F_FLOOR - F_CEIL);
    ctx.fillStyle = '#23323d'; ctx.fillRect(c.x0, 104, c.x1 - c.x0, 5);
    seg(c.x0, 33, c.x1, 33, 3, '#33404a'); seg(c.x0, 39, c.x1, 39, 1.6, '#2c3842');
    for (let x = c.x0 + 80; x < c.x1 - 40; x += 150) { el(x, 68, 15, 15, '#46545e'); el(x, 68, 12, 12, '#05223a'); glow(x, 70, 10, 'rgba(40,120,190,0.45)', 'rgba(40,120,190,0)'); el(x - 4, 63, 4, 2.6, 'rgba(255,255,255,0.14)'); }
    if (c.idx) drawText(`${c.idx}号舱`, c.x0 + 14, 112, 'rgba(255,255,255,0.16)', 'left', 8);
  }
  // steel
  const i0 = Math.max(0, Math.floor(cx / FT) - 1), i1 = Math.min(F_COLS, Math.ceil((cx + W) / FT) + 1);
  for (let j = 0; j < F_ROWS; j++) for (let i = i0; i < i1; i++) {
    const v = F.grid[j][i], x = i * FT, y = j * FT;
    if (v === 1) {
      ctx.fillStyle = (j < 2 || j > 15) ? '#2c3842' : '#3a4852'; ctx.fillRect(x, y, FT, FT);
      if (j > 0 && F.grid[j - 1][i] !== 1) { ctx.fillStyle = '#6a7a84'; ctx.fillRect(x, y, FT, 2); if (j < 16) { ctx.fillStyle = (i % 2) ? '#c8a020' : '#222'; ctx.fillRect(x, y + 2, FT, 1.4); } }
      if ((i + j) % 2 === 0) el(x + 3, y + 4, 0.7, 0.7, '#1e2a32');
    }
  }
  // bulkhead doors
  for (const d of F.doors) {
    if (d.x > cx + W || d.x + 24 < cx) continue;
    const hh = (d.y1 - d.y0) * (1 - d.k);
    if (hh > 0.5) { rr(d.x + 1, d.y0, 22, hh, 2, '#56646e'); for (let yy = d.y0 + 6; yy < d.y0 + hh - 2; yy += 10) seg(d.x + 4, yy, d.x + 20, yy, 0.8, '#3e4a54'); ctx.fillStyle = '#c8a020'; ctx.fillRect(d.x + 1, d.y0 + hh - 3, 22, 2); }
    glow(d.x + 12, d.y0 - 6, 5, d.open ? 'rgba(90,220,90,0.7)' : 'rgba(240,70,50,0.7)', 'rgba(0,0,0,0)'); el(d.x + 12, d.y0 - 6, 2, 2, d.open ? '#7aff7a' : '#ff5a3a');
  }
  // valves
  for (const c of F.comps) if (c.pump) {
    const q = c.pump; rr(q.x - 10, q.y - 13, 20, 26, 3, '#44525c'); rr(q.x - 8, q.y - 11, 16, 22, 2, '#2c3a44');
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.spin); ctx.strokeStyle = '#d84a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.stroke(); seg(-6, 0, 6, 0, 1.4, '#d84a2a'); seg(0, -6, 0, 6, 1.4, '#d84a2a'); ctx.restore();
    drawText(c.target === F_WET ? '排水' : '注水', q.x, q.y - 22, c.moving ? '#7a8088' : '#ffe9a0', 'center', 7);
  }
  // gas vents
  for (const vt of F.vents) { rr(vt.x - 9, F_FLOOR - 2, 18, 3, 1, '#1a1a1a'); const st = fVent(vt); if (st === 1) glow(vt.x, F_FLOOR - 3, 8, 'rgba(255,150,60,0.5)', 'rgba(255,100,40,0)'); else if (st === 2) drawFlame(vt.x, F_FLOOR, 0, -1, 70, 11, vt.ph); }
  for (const k of F.caps) if (!k.dead) drawBadge(Math.round(k.x) - 6, Math.round(k.y) - 5, k.kind, (G.t >> 3) % 2);
  // enemies
  for (const m of F.mobs) {
    const fl = m.flash > 0;
    if (m.t === 'sold') { ctx.save(); if (m.drown > 0) ctx.globalAlpha = Math.max(0.2, 1 - m.drown * 0.6); drawSoldier(m.x, m.y, m.vx ? 'run' : 'stand', { face: m.face, frame: m.anim, pal: EPAL(), ax: m.face, ay: 0, flash: fl }); ctx.restore(); }
    else if (m.t === 'drone') { ctx.save(); ctx.translate(m.x, m.y); ctx.scale(m.face, 1); if (m.gt > 0) ctx.rotate(Math.sin(G.time * 14) * 0.4); rr(-8, -3.4, 15, 6.8, 3.4, fl ? '#fff' : '#5a6670'); rr(-8, -3.4, 15, 2, 1, '#78868e'); el(6, 0, 2, 2, '#e84a2a'); seg(-9, 0, -11, 0, 1, '#333'); el(-11.5, 0, 1, 3, '#9aa'); ctx.restore(); }
    else if (m.t === 'mine') { for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; seg(m.x, m.y, m.x + Math.cos(a) * 8, m.y + Math.sin(a) * 8, 1.2, '#2a2a30'); } el(m.x, m.y, 6, 6, fl ? '#fff' : '#3c3c44'); el(m.x - 2, m.y - 2, 2, 1.4, 'rgba(255,255,255,0.15)'); el(m.x, m.y, 1.5, 1.5, '#e84a2a'); }
    else if (m.t === 'tur') { rr(m.x - 9, F_CEIL, 18, 6, 2, '#3a4650'); el(m.x, m.y, 7, 6, fl ? '#fff' : '#5a6670'); const a = m.ang || Math.PI / 2; seg(m.x, m.y, m.x + Math.cos(a) * 11, m.y + Math.sin(a) * 11, 2.6, '#2a3036'); }
    else if (m.t === 'jbox') { const z = F.comps[2].zap; seg(m.x, m.y + 6, m.x, m.y + 30, 1.4, '#222'); seg(m.x, m.y + 30, m.x + 26, m.y + 40, 1.4, '#222'); rr(m.x - 9, m.y - 8, 18, 14, 2, fl ? '#fff' : '#6a6440'); ctx.fillStyle = '#222'; for (let k = 0; k < 3; k++) ctx.fillRect(m.x - 7 + k * 5, m.y - 6, 2.4, 10); if (z !== 'idle') glow(m.x, m.y, z === 'zap' ? 16 : 9, 'rgba(140,240,255,0.8)', 'rgba(140,240,255,0)'); }
  }
  if (B.active || Math.abs(B.x - p.x) < 450) drawFortCore();
  // you
  if (G.mode !== 'title' && !(p.invT > 0 && !p.dead && (G.t >> 2) % 2 === 0)) {
    if (p.swim && !p.dead) drawSwimmer(p.x, p.y - 11, { face: p.face, frame: p.anim, pal: PAL_P, ax: p.ax, ay: p.ay });
    else drawSoldier(p.x, p.y, p.dead ? 'dead' : !p.onGround ? 'spin' : p.prone ? 'prone' : p.vx ? 'run' : 'stand', { face: p.dead ? -p.face : p.face, frame: p.anim, pal: PAL_P, ax: p.ax, ay: p.ay });
    if (p.insulT > 0 && !p.dead) { ctx.strokeStyle = `rgba(255,230,90,${0.4 + 0.2 * Math.sin(G.time * 4)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y - 11, 11, 14, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
  for (const s2 of F.shots) drawTDShot(s2);
  for (const b of F.eb) { glow(b.x, b.y, 4, 'rgba(255,120,60,0.8)', 'rgba(255,80,40,0)'); el(b.x, b.y, 1.8, 1.8, '#ffd8a0'); }
  for (const n of F.nades) { ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(n.t * 9); el(0, 0, 3.2, 2.7, '#3e5a34'); rr(-1, -3.6, 2, 1.5, 0.5, '#9aa0a6'); ctx.restore(); }
  // water, drawn over whatever is under it
  for (let ci = 0; ci < F.comps.length; ci++) {
    const c = F.comps[ci]; if (c.level >= F_FLOOR - 0.5 || c.x1 < cx - 30 || c.x0 > cx + W + 30) continue;
    const nx = F.comps[ci + 1], d = F.doors[ci], joined = nx && d && d.k > 0.1 && Math.abs(nx.level - c.level) < 0.5;
    const x0 = c.x0, x1 = joined ? nx.x0 : c.x1, top = c.level, k = c.zap === 'zap' ? 1 : c.zap === 'warn' ? 0.35 * (1 - c.zapT / 1.3) : 0;
    ctx.fillStyle = `rgba(${24 + 100 * k | 0},${96 + 130 * k | 0},${150 + 100 * k | 0},${0.42 + 0.12 * k})`; ctx.fillRect(x0, top, x1 - x0, F_FLOOR - top);
    ctx.strokeStyle = 'rgba(190,235,255,0.65)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = x0; x <= x1; x += 6) { const y = top + Math.sin(x * 0.08 + G.time * 2) * 1.1; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    if (c.zap === 'zap') { ctx.strokeStyle = 'rgba(230,255,255,0.75)'; ctx.lineWidth = 1; for (let n = 0; n < 4; n++) { ctx.beginPath(); const yb = top + (n + 1) * (F_FLOOR - top) / 5; for (let x = Math.max(x0, cx - 10); x <= Math.min(x1, cx + W + 10); x += 8) { const y = yb + Math.sin(x * 0.17 + G.time * 9 + n * 2) * 5; x <= Math.max(x0, cx - 10) ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); } }
    else if (c.zap === 'warn') { ctx.strokeStyle = `rgba(160,245,255,${0.4 + 0.4 * (1 - c.zapT / 1.3)})`; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = Math.max(x0, cx - 10); x <= Math.min(x1, cx + W + 10); x += 5) { const y = top + 1 + Math.sin(x * 0.4 + G.time * 7) * 1.6; x <= Math.max(x0, cx - 10) ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  }
  drawFx();
  for (const d of F.doors) if (!d.open && Math.abs(p.x - (d.x + 12)) < 100 && !p.dead) drawText(d.lock ? '封锁' : '两侧水位不同 · 打不开', d.x + 12, d.y0 > 100 ? d.y0 - 18 : d.y1 + 8, '#ff9a7a', 'center', 7);
  setT();
}
function drawFortHud() {
  const c = fComp(G.p.x), st = c.moving ? (c.target === F_WET ? '注水中' : '排水中') : fWet(c) ? '已注水' : '已排水';
  drawText(c.idx === 5 ? '核心舱 ' + st : c.idx ? `${c.idx}号舱 ${st}` : '入口', W - 12, 24, '#9fd6ff', 'right', 8);
  if (c.zap !== 'idle') drawText(c.zap === 'warn' ? '漏电预警 · 浮到水面' : '放电中', W - 12, 34, '#9ff8ff', 'right', 8);
}

// =====================================================================
// 水下第七关 冰封海沟: you ride a steel lift down a shaft cut through the ice. It descends on its
// own; enemies come at you from the walls, from above and from below. Thick ice plugs stop the
// lift until you shoot them apart (hold down to aim straight down through the grating). At the
// bottom the lift floats on a freezing lake where the frost-fin sea dragon lives.
// =====================================================================
const L_X0 = 40, L_X1 = 344, L_DEPTH = 3600, L_SPEED = 34;
function initLift() {
  G.en = []; G.pods = []; G.items = []; G.camX = 0; G.camY = 0; G.shark = G.ghost = G.crab = G.queen = null;
  G.sea = { o2: 1, vents: [], pockets: [], surface: false, boats: false, diverT: 99, boatT: 99, warnT: 0 };
  const L = G.lift = { py: 160, py0: 160, mobs: [], shots: [], eb: [], nades: [], caps: [], plugs: [], ledges: [], stopped: false, events: [], ei: 0, crabT: 0, boss: false, bossK: 0, hintPlug: false };
  for (const d of [900, 2000, 3000]) L.plugs.push({ y: L.py0 + d + 12, hp: 12, max: 12, flash: 0 });
  const tur = (side, d) => L.mobs.push({ t: 'tur', side, x: side < 0 ? L_X0 + 7 : L_X1 - 7, y: L.py0 + d, hp: 4, cd: 1.2 + rnd(), flash: 0, ang: 0, fixed: true });
  const ledge = (side, d) => { const y = L.py0 + d; L.ledges.push({ side, y }); L.mobs.push({ t: 'sold', side, x: side < 0 ? L_X0 + 12 : L_X1 - 12, y, hp: 2, cd: 1 + rnd(), face: -side, flash: 0, fixed: true }); };
  tur(-1, 380); tur(1, 700); ledge(-1, 560); tur(-1, 1250); ledge(1, 1450); tur(1, 1700); ledge(-1, 1850); tur(-1, 2300); ledge(1, 2500); tur(1, 2700); ledge(-1, 3200); tur(1, 3350);
  for (let d = 180; d < L_DEPTH - 150; d += 110) { const r = rnd(); L.events.push([d, r < 0.4 ? 'ray' : r < 0.75 ? 'crab' : 'ice']); }
  for (const [d, k] of [[520, 'G'], [1300, 'W'], [2150, 'S'], [2750, 'M'], [3300, 'F']]) L.events.push([d, 'pod', k]);
  L.events.sort((a, b) => a[0] - b[0]);
  G.serp = { x: 20, y: 999, side: -1, dir: 1, wt: 0, active: false, dead: false, deadT: 0, phase2: false, state: 'sub', st: 2.2, t: 0, b: null, rear: null, slam: null, volleys: 0, shotT: 0, stunT: 0, stunned: false, chain: 0, segs: [], pos: {}, hit: {},
    parts: [{ k: 'core', hp: 60, max: 60, flash: 0 }, { k: 'c1', hp: 12, max: 12, flash: 0, seg: 3 }, { k: 'c2', hp: 12, max: 12, flash: 0, seg: 6 }, { k: 'c3', hp: 12, max: 12, flash: 0, seg: 9 }] };
  Object.assign(G.p, { x: 192, y: L.py, vx: 0, vy: 0, face: 1, ax: 1, ay: 0, airJumps: 1, warmT: 0, onGround: true });
  banner('升降舱会自动下降 · 冰塞挡路时跳起来按住下朝下打', 3);
}
const lCam = () => G.lift.py - 160;
function lDmg(m, d) {
  if (m.dead) return;
  m.hp -= d; m.flash = 0.07; sfx.hit();
  if (m.hp <= 0) {
    m.dead = true; boom(m.x, m.t === 'sold' ? m.y - 12 : m.y, 9); sfx.boom();
    addScore({ sold: 200, ray: 300, tur: 500, crab: 200, ice: 50, pod: 100 }[m.t] || 100);
    if (m.t === 'pod') G.lift.caps.push({ x: m.x, y: m.y, vy: -60, kind: m.kind, rest: false });
  }
}
function lHitBoss(pt, dmg) {
  const S = G.serp; if (pt.hp <= 0 || S.dead) return;
  pt.hp -= dmg; pt.flash = 0.06; sfx.hit();
  if (pt.k !== 'core' && pt.hp <= 0) {
    const q = S.pos[pt.k]; if (q) boom(q[0], q[1], 12); sfx.boom(); addScore(2500);
    const left = S.parts.filter(q2 => q2.k !== 'core' && q2.hp > 0).length;
    if (left) banner(`背上的冰晶碎了 · 还剩 ${left} 颗`, 1.4);
    else { banner('冰晶全部碎裂 · 海龙趴在舱边动弹不得！', 2); S.state = 'stun'; S.stunT = 5; S.stunned = true; S.b = null; S.slam = null; }
  }
  if (pt.k === 'core') {
    if (!S.phase2 && pt.hp <= pt.max / 2) { S.phase2 = true; banner('海龙暴怒 · 甩尾更频繁', 1.6); }
    if (pt.hp <= 0) { S.dead = true; S.deadT = 3.2; addScore(15000); for (const m of G.lift.mobs) m.dead = true; G.lift.eb.length = 0; Music.stop(); banner('霜鳍海龙被击败', 2.4); sfx.big(); }
  }
}
function lBlast(x, y, big) {
  const L = G.lift, S = G.serp, r = big ? 90 : 46; boom(x, y, big ? 30 : 20); sfx.big(); shake(big ? 5 : 3);
  for (const m of L.mobs) if (!m.dead && Math.hypot(m.x - x, (m.t === 'sold' ? m.y - 11 : m.y) - y) < r) lDmg(m, big ? 10 : 6);
  for (const pl of L.plugs) if (!pl.dead && (big ? L.stopped && pl.y - L.py < 30 : Math.abs(pl.y - y) < 40)) { pl.hp -= big ? 99 : 10; pl.flash = 0.1; if (pl.hp <= 0) lPlugBreak(pl); }
  if (S.active && !S.dead) for (const pt of S.parts) { const q = S.pos[pt.k]; if (q && S.hit[pt.k] && Math.hypot(q[0] - x, q[1] - y) < r + 4) lHitBoss(pt, big ? 14 : 8); }
}
function lPlugBreak(pl) {
  if (pl.dead) return; pl.dead = true; addScore(800); sfx.big(); shake(4); banner('冰塞碎了 · 继续下降', 1.2);
  for (let k = 0; k < 14; k++) G.fx.push({ k: 'debris', x: L_X0 + rnd() * (L_X1 - L_X0), y: pl.y + rnd() * 12, vx: (rnd() - 0.5) * 80, vy: rnd() * 60, t: 0, life: 0.9 });
}
function lShootE(x, y, a, sp) { G.lift.eb.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 4 }); sfx.eshot(); }
const lMobHit = (m, x, y, r) => m.t === 'sold' || (m.t === 'crab' && false) ? Math.abs(m.x - x) < 6 + r && y > m.y - 23 - r && y < m.y + r : Math.hypot(m.x - x, m.y - y) < ({ ray: 9, tur: 8, crab: 8, ice: 7, pod: 7 }[m.t] || 7) + r;
// the sea dragon's body, segment by segment
function lSerpBody(S) {
  const N = 16, segs = [], wt = S.wt;
  if (S.state === 'breach' && S.b) {
    const B = S.b;
    for (let i = 0; i < N; i++) { const u = B.u - i * 0.05, x = B.x0 + (B.x1 - B.x0) * u, y = u < 0 ? wt + 30 - u * 260 : u > 1 ? wt + 30 + (u - 1) * 260 : wt + 30 - 4 * B.h * u * (1 - u); segs.push({ x, y, r: 12 - i * 0.45 }); }
  } else if (S.state === 'rear' || S.state === 'rise' || S.state === 'sink') {
    for (let i = 0; i < N; i++) segs.push({ x: S.x - S.side * i * 1.5 + Math.sin(S.t * 2 + i * 0.6) * 3, y: S.y + i * 8, r: 12 - i * 0.45 });
  } else if (S.state === 'stun') {
    const hx = S.side < 0 ? L_X0 + 14 : L_X1 - 14;
    for (let i = 0; i < N; i++) segs.push({ x: hx + S.side * i * 10, y: wt - 22 + Math.min(1, i / 3) * 24 + Math.sin(S.t * 2 + i * 0.7) * 1.2, r: 12 - i * 0.45 });
  } else {
    for (let i = 0; i < N; i++) segs.push({ x: S.x + S.side * i * 10, y: wt + 60, r: 12 - i * 0.45 });
  }
  S.segs = segs; S.pos = { core: [segs[0].x, segs[0].y] };
  S.hit = { core: (S.state === 'rear' && S.rear && S.rear.hold) || S.state === 'stun' };
  for (const pt of S.parts) if (pt.k !== 'core') { const q = segs[pt.seg]; S.pos[pt.k] = [q.x, q.y - q.r * 0.8]; S.hit[pt.k] = pt.hp > 0 && q.y - q.r < wt - 2; }
}
function lRespawn() {
  const L = G.lift; G.p = newPlayer(192); Object.assign(G.p, { x: 192, y: L.py, vx: 0, vy: 0, face: 1, ax: 1, ay: 0, airJumps: 1, warmT: 0, invT: 3, onGround: true });
}
function updateLift(I) {
  const L = G.lift, p = G.p, frozen = G.freezeT > 0, S = G.serp;
  if (p.flashT > 0) p.flashT -= DT;
  // ---- the lift ----
  const prevPy = L.py;
  if (!L.boss) {
    const plug = L.plugs.find(q => !q.dead && q.y - 12 >= L.py - 0.5), target = plug ? plug.y - 12 : L.py0 + L_DEPTH;
    if (L.py < target) { L.py = Math.min(target, L.py + L_SPEED * DT); L.stopped = false; }
    else if (plug) { if (!L.stopped) { L.stopped = true; tone(140, 0.4, 'sawtooth', 0.06, 80); if (!L.hintPlug) { L.hintPlug = true; banner('冰塞挡住了 · 跳起来按住下朝下射击（I 手雷也行）', 2.2); } } }
    else { L.boss = true; S.active = true; S.wt = L.py + 18; S.st = 2; banner('警告 · 霜鳍海龙', 2.2); Music.start(true, -3); }
  }
  if (L.boss) L.bossK = Math.min(1, L.bossK + DT);
  const dpy = L.py - prevPy, camY = L.py - 160;
  // spawns by depth
  while (L.ei < L.events.length && L.events[L.ei][0] <= L.py - L.py0) {
    const [d, k, kind] = L.events[L.ei++], side = rnd() < 0.5 ? -1 : 1;
    if (k === 'ray') L.mobs.push({ t: 'ray', x: side < 0 ? L_X0 - 12 : L_X1 + 12, y: camY + 40 + rnd() * 70, ay: 0, vx: -side * 52, hp: 2, ph: rnd() * 6, flash: 0, face: -side });
    else if (k === 'crab') L.mobs.push({ t: 'crab', side, x: side < 0 ? L_X0 + 5 : L_X1 - 5, y: camY + H + 12, st: 'climb', hp: 2, flash: 0, face: -side, anim: 0 });
    else if (k === 'ice') L.mobs.push({ t: 'ice', x: Math.max(L_X0 + 16, Math.min(L_X1 - 16, p.x + (rnd() - 0.5) * 90)), y: camY - 14, st: 'warn', T: 0.9, vy: 0, hp: 1, flash: 0 });
    else if (k === 'pod') L.mobs.push({ t: 'pod', x: side < 0 ? L_X0 - 10 : L_X1 + 10, y: camY + 50 + rnd() * 40, vx: -side * 40, kind, hp: 1, flash: 0 });
  }
  if (L.stopped && !L.boss) { L.crabT -= DT; if (L.crabT <= 0) { L.crabT = 2.6; const side = rnd() < 0.5 ? -1 : 1; L.mobs.push({ t: 'crab', side, x: side < 0 ? L_X0 + 5 : L_X1 - 5, y: camY + H + 12, st: 'climb', hp: 2, flash: 0, face: -side, anim: 0 }); } }
  // ---- you ----
  if (p.dead) {
    p.deadT -= DT; p.vy = Math.min(p.vy + 500 * DT, 200); p.y += p.vy * DT;
    if (p.deadT <= 0) { if (G.lives > 0) lRespawn(); else { gameOver(); return; } }
  } else {
    if (p.invT > 0) p.invT -= DT; if (p.shieldT > 0) p.shieldT -= DT; if (p.spCd > 0) p.spCd -= DT; if (p.warmT > 0) p.warmT -= DT;
    const h = (I.right ? 1 : 0) - (I.left ? 1 : 0), v = (I.down ? 1 : 0) - (I.up ? 1 : 0);
    if (h) p.face = h;
    landAim(p, h, v);
    if (I.jumpEdge) { if (p.onGround) { p.vy = -255; p.onGround = false; sfx.jump(); } else if (p.airJumps > 0) { p.airJumps--; p.vy = -235; sfx.jump2(); } }
    p.vx = p.prone ? 0 : h * 80; p.x = Math.max(L_X0 + 8, Math.min(L_X1 - 8, p.x + p.vx * DT));
    if (p.onGround) { p.y = L.py; p.vy = 0; }
    else { p.vy = Math.min(p.vy + 760 * DT, 340); const ny = p.y + p.vy * DT; if (p.vy >= 0 && ny >= L.py && p.y <= L.py + 6) { p.y = L.py; p.vy = 0; p.onGround = true; p.airJumps = 1; } else p.y = ny; }
    p.anim += DT * (h ? 10 : 3);
    // fire
    p.cool -= DT;
    if (I.fireEdge) p.wantFire = true;
    if ((SET.autofire === 'on' ? I.fire : p.wantFire) && p.cool <= 0) {
      p.wantFire = false; const wk = p.weapon, w = WEAP[wk], dm = wk === 'laser' || wk === 'fire' || wk === 'homing' ? 2 : 1;
      const aim = p.botAim != null ? p.botAim : Math.atan2(p.ay, p.ax);
      const sx0 = p.prone ? p.x + p.face * 17 : p.x + Math.cos(aim) * 13, sy0 = p.prone ? p.y - 4 : (p.onGround ? p.y - 22 : p.y - 15) + Math.sin(aim) * 13;
      const shot = (da, o) => { const a = aim + da, sp = (o && o.sp) || 240; L.shots.push(Object.assign({ k: wk, x: sx0, y: sy0, cx: sx0, cy: sy0, ang: a, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.3, t: 0, dmg: dm, pierce: wk === 'laser', hits: new Set(), tr: [] }, o || {})); };
      if (wk === 'spread') { for (const d of [-0.3, -0.15, 0, 0.15, 0.3]) shot(d); sfx.spread(); }
      else if (wk === 'fire') { L.fireDir = -(L.fireDir || 1); shot(0, { sp: 150, life: 1.6, dir: L.fireDir }); sfx.fire(); }
      else if (wk === 'homing') { shot(0, { sp: 120, life: 1.9 }); sfx.msl(); }
      else if (wk === 'laser') { shot(0, { sp: 340 }); sfx.laser(); }
      else { shot(0, wk === 'machine' ? { sp: 270 } : null); sfx.shoot(); }
      p.cool = w.cd * (p.rapid ? 0.7 : 1); p.flashT = 0.05;
    }
    if (I.cycEdge && G.inv.length > 1) { G.sel = (G.sel + 1) % G.inv.length; sfx.hit(); }
    if (I.grenEdge) useSpecial();
  }
  // supply badges fall onto the lift and ride it
  for (const c of L.caps) {
    if (c.rest) c.y = L.py - 6; else { c.vy += 400 * DT; c.y += c.vy * DT; if (c.y >= L.py - 6 && c.vy > 0) { c.y = L.py - 6; c.rest = true; } if (c.y > camY + H + 20) c.dead = true; }
    if (!p.dead && Math.abs(c.x - p.x) < 10 && Math.abs(c.y - (p.y - 11)) < 16) { c.dead = true; pickItem(c.kind); }
  }
  sweep(L.caps);
  // ---- grenades: they fall through the grating ----
  for (const n of L.nades) {
    n.t += DT; n.vy += 600 * DT; n.x += n.vx * DT; n.y += n.vy * DT;
    if (n.x < L_X0 + 3 || n.x > L_X1 - 3) n.vx *= -0.5;
    const plug = L.plugs.find(q => !q.dead && n.y >= q.y && n.y <= q.y + 16);
    const touch = L.mobs.some(m => !m.dead && lMobHit(m, n.x, n.y, 3)) || (S.active && !S.dead && S.segs.some(q => q.y < S.wt && Math.hypot(q.x - n.x, q.y - n.y) < q.r + 3));
    if (n.t > 1.2 || plug || (touch && n.t > 0.06) || (L.boss && n.y > S.wt)) { n.dead = true; lBlast(n.x, Math.min(n.y, L.boss ? S.wt - 4 : n.y)); }
  }
  sweep(L.nades);
  // ---- enemies ----
  for (const m of L.mobs) {
    if (m.flash > 0) m.flash -= DT;
    if (m.dead) continue;
    if (m.fixed && m.y < camY - 40) { m.dead = true; continue; }
    if (frozen) continue;
    const dx = p.x - m.x, onScr = m.y > camY - 10 && m.y < camY + H + 10;
    if (m.t === 'tur') {
      const dy = (p.y - 12) - m.y; m.ang = Math.atan2(dy, dx); m.cd -= DT;
      if (onScr && !p.dead && m.cd <= 0) { m.cd = 2.5; lShootE(m.x + Math.cos(m.ang) * 9, m.y + Math.sin(m.ang) * 9, m.ang, 100); }
    } else if (m.t === 'sold') {
      m.cd -= DT;
      if (onScr && !p.dead && m.cd <= 0 && m.y < L.py + 20) { m.cd = 2 + rnd() * 0.6; lShootE(m.x + m.face * 10, m.y - 15, Math.atan2((p.y - 13) - (m.y - 15), dx), 110); }
    } else if (m.t === 'ray') {
      m.x += m.vx * DT; m.ay += DT; m.y += Math.cos(m.ay * 1.8 + m.ph) * 26 * DT + dpy;
      if (m.x < L_X0 - 30 || m.x > L_X1 + 30) m.dead = true;
      if (!p.dead && Math.hypot(dx, p.y - 11 - m.y) < 12) killPlayer();
    } else if (m.t === 'crab') {
      m.anim += DT * 8;
      if (m.st === 'climb') { m.y -= 60 * DT; if (m.y <= L.py - 4) { m.st = 'hop'; m.vy = -120; m.vx = -m.side * 50; } }
      else if (m.st === 'hop') { m.vy += 500 * DT; m.x += m.vx * DT; m.y += m.vy * DT + dpy; if (m.vy > 0 && m.y >= L.py - 5) { m.y = L.py - 5; m.st = 'walk'; } }
      else { m.y = L.py - 5; m.face = Math.sign(dx) || m.face; m.x = Math.max(L_X0 + 6, Math.min(L_X1 - 6, m.x + m.face * 34 * DT)); }
      if (!p.dead && Math.abs(dx) < 11 && Math.abs(p.y - 6 - m.y) < 14) killPlayer();
    } else if (m.t === 'ice') {
      if (m.st === 'warn') { m.T -= DT; m.y = camY - 14; if (m.T <= 0) { m.st = 'fall'; m.vy = 120; } }
      else { m.vy = Math.min(m.vy + 500 * DT, 320); m.y += m.vy * DT; if (m.y >= L.py - 6) { m.dead = true; for (let k = 0; k < 5; k++) G.fx.push({ k: 'debris', x: m.x, y: L.py - 6, vx: (rnd() - 0.5) * 70, vy: -rnd() * 60, t: 0, life: 0.6 }); noise(0.2, 0.1, 3000); }
        if (!p.dead && Math.abs(dx) < 9 && m.y + 8 > p.y - (p.prone ? 9 : 22) && m.y - 8 < p.y) { m.dead = true; if (p.warmT > 0) { G.fx.push({ k: 'puff', x: m.x, y: m.y, vx: 0, vy: -20, t: 0, life: 0.5 }); } else killPlayer(); } }
    } else if (m.t === 'pod') {
      m.x += m.vx * DT; m.y += dpy + Math.sin(G.time * 2) * 6 * DT; if (m.x < L_X0 - 30 || m.x > L_X1 + 30) m.dead = true;
    }
  }
  // ---- your shots ----
  for (const s2 of L.shots) {
    s2.t += DT; s2.life -= DT;
    if (s2.k === 'fire') {
      s2.cx += s2.vx * DT; s2.cy += s2.vy * DT;
      const r = Math.min(10, s2.t * 70), a = s2.t * 13 * s2.dir, fx = Math.cos(s2.ang), fy = Math.sin(s2.ang);
      s2.x = s2.cx + (-fy * Math.cos(a) + fx * Math.sin(a)) * r; s2.y = s2.cy + (fx * Math.cos(a) + fy * Math.sin(a)) * r;
      s2.tr.push(s2.x, s2.y); if (s2.tr.length > 20) s2.tr.splice(0, 2);
    } else if (s2.k === 'homing') {
      let tg = null, bd = 230;
      for (const m of L.mobs) { if (m.dead) continue; const my = m.t === 'sold' ? m.y - 11 : m.y, dd = Math.hypot(m.x - s2.x, my - s2.y); if (dd < bd) { bd = dd; tg = [m.x, my]; } }
      if (S.active && !S.dead) for (const pt of S.parts) { const q = S.pos[pt.k]; if (!q || !S.hit[pt.k] || pt.hp <= 0) continue; const dd = Math.hypot(q[0] - s2.x, q[1] - s2.y); if (dd < bd + 80) { bd = dd - 80; tg = q; } }
      const pl = L.stopped && L.plugs.find(q => !q.dead && q.y - L.py < 30); if (!tg && pl) tg = [s2.x, pl.y + 6];
      if (tg) { let da = Math.atan2(tg[1] - s2.y, tg[0] - s2.x) - s2.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); s2.ang += Math.max(-5 * DT, Math.min(5 * DT, da)); }
      const sp = Math.min(240, Math.hypot(s2.vx, s2.vy) + 260 * DT); s2.vx = Math.cos(s2.ang) * sp; s2.vy = Math.sin(s2.ang) * sp;
      s2.x += s2.vx * DT; s2.y += s2.vy * DT; s2.tr.push(s2.x, s2.y); if (s2.tr.length > 14) s2.tr.splice(0, 2);
    } else { s2.x += s2.vx * DT; s2.y += s2.vy * DT; }
    const wx = s2.k === 'fire' ? s2.cx : s2.x, wy = s2.k === 'fire' ? s2.cy : s2.y;
    if (s2.life <= 0 || wx < (L.boss ? -10 : L_X0) || wx > (L.boss ? W + 10 : L_X1) || wy < camY - 20 || wy > camY + H + 20 || (L.boss && wy > S.wt + 2)) { s2.dead = true; spark(s2.x, s2.y); continue; }
    const pl = L.plugs.find(q => !q.dead && wy >= q.y && wy <= q.y + 16);
    if (pl) { pl.hp -= s2.dmg; pl.flash = 0.06; sfx.hit(); s2.dead = true; spark(s2.x, pl.y); if (pl.hp <= 0) lPlugBreak(pl); continue; }
    const hr = s2.k === 'fire' ? 5 : 3;
    { const e = L.eb.find(e2 => !e2.dead && Math.abs(e2.x - s2.x) < 5 + hr && Math.abs(e2.y - s2.y) < 5 + hr); if (e) { e.dead = true; G.fx.push({ k: 'puff', x: e.x, y: e.y, vx: 0, vy: -10, t: 0, life: 0.3 }); if (!s2.pierce) { s2.dead = true; continue; } } } // ice shards can be shot down
    for (const m of L.mobs) {
      if (m.dead || s2.hits.has(m) || !lMobHit(m, s2.x, s2.y, hr)) continue;
      lDmg(m, s2.dmg);
      if (s2.pierce) s2.hits.add(m); else { s2.dead = true; break; }
    }
    if (s2.dead || !S.active || S.dead) continue;
    for (const pt of S.parts) {
      const q = S.pos[pt.k]; if (pt.hp <= 0 || !q || !S.hit[pt.k] || s2.hits.has(pt)) continue;
      if (Math.hypot(q[0] - s2.x, q[1] - s2.y) < (pt.k === 'core' ? 13 : 8) + hr) { lHitBoss(pt, pt.k === 'core' && S.state === 'stun' ? s2.dmg * 1.5 : s2.dmg); if (s2.pierce) s2.hits.add(pt); else { s2.dead = true; break; } }
    }
  }
  sweep(L.mobs); sweep(L.shots);
  for (const b of L.eb) {
    b.x += b.vx * DT; b.y += b.vy * DT; b.life -= DT;
    if (b.life <= 0 || b.y > camY + H + 10 || b.y < camY - 20 || b.x < -10 || b.x > W + 10) { b.dead = true; continue; }
    if (!p.dead && Math.abs(b.x - p.x) < (p.prone ? 10 : 6) && b.y > p.y - (p.prone ? 9 : 22) && b.y < p.y) { b.dead = true; if (p.warmT > 0) G.fx.push({ k: 'puff', x: b.x, y: b.y, vx: 0, vy: -20, t: 0, life: 0.4 }); else killPlayer(); }
  }
  sweep(L.eb);
  // ---- 霜鳍海龙 ----
  for (const pt of S.parts) if (pt.flash > 0) pt.flash -= DT;
  if (S.dead) { S.deadT -= DT; if (rnd() < 0.3) { const q = S.segs[(rnd() * S.segs.length) | 0]; if (q) boom(q.x, Math.min(q.y, S.wt - 4), 10); if (rnd() < 0.4) sfx.boom(); } if (S.deadT <= 0) stageClear(); }
  else if (S.active && !frozen) {
    S.t += DT; const wt = S.wt;
    if (S.state === 'sub') {
      S.st -= DT;
      if (S.st <= 0) {
        const r = rnd(), pB = S.chain > 0 ? 1 : S.phase2 ? 0.3 : 0.3, pR = S.phase2 ? 0.4 : 0.45;
        S.side = rnd() < 0.5 ? -1 : 1; S.x = S.side < 0 ? 20 : 364;
        if (r < pB) { S.state = 'warn'; S.st = 0.9; tone(120, 0.8, 'sawtooth', 0.06, 70); }
        else if (r < pB + pR) { S.state = 'rise'; S.y = wt + 40; S.x = S.side < 0 ? 30 : 354; }
        else { const k = Math.max(0, Math.min(2, rnd() < 0.7 ? Math.floor((p.x - L_X0) / ((L_X1 - L_X0) / 3)) : (rnd() * 3) | 0)); S.state = 'slam'; S.slam = { k, t: 0, x0: L_X0 + k * (L_X1 - L_X0) / 3, x1: L_X0 + (k + 1) * (L_X1 - L_X0) / 3, hit: false }; tone(90, 1, 'sawtooth', 0.05, 60); }
      }
    } else if (S.state === 'warn') {
      S.st -= DT; if ((G.t & 3) === 0) G.fx.push({ k: 'bub', x: S.x + (rnd() - 0.5) * 20, y: wt + 2, vx: 0, vy: -20, t: 0, life: 0.5 });
      if (S.st <= 0) { S.state = 'breach'; S.b = { x0: S.x, x1: S.side < 0 ? 364 : 20, u: -0.05, h: 150, dur: S.phase2 ? 1.25 : 1.6 }; noise(0.6, 0.2, 1200); if (S.chain > 0) S.chain--; else if (S.phase2) S.chain = 1; }
    } else if (S.state === 'breach') {
      const B = S.b; B.u += DT / B.dur; S.x = B.x0 + (B.x1 - B.x0) * Math.min(1, B.u);
      if (B.u >= 1.85) { S.state = 'sub'; S.side = -S.side; S.st = S.chain > 0 ? 0.5 : 1.4; S.b = null; noise(0.5, 0.18, 900); shake(2); }
    } else if (S.state === 'rise') { S.y -= 170 * DT; if (S.y <= wt - 80) { S.y = wt - 80; S.state = 'rear'; S.rear = { hold: true, t: 3.2 }; S.volleys = 1 + S.parts.filter(q => q.k !== 'core' && q.hp > 0).length; S.shotT = 0.6; } }
    else if (S.state === 'rear') {
      const R2 = S.rear; R2.t -= DT; S.shotT -= DT;
      if (S.shotT <= 0 && S.volleys > 0 && !p.dead) { S.volleys--; S.shotT = 2.4 / (1 + S.volleys + 0.01); const a0 = Math.atan2(p.y - 12 - S.y, p.x - S.x); for (const da of [-0.26, 0, 0.26]) lShootE(S.x - S.side * 10, S.y, a0 + da, 88); }
      if (R2.t <= 0) { S.state = 'sink'; R2.hold = false; }
    } else if (S.state === 'sink') { S.y += 190 * DT; if (S.y >= wt + 60) { S.state = 'sub'; S.st = 1.3; } }
    else if (S.state === 'slam') {
      const Sl = S.slam; Sl.t += DT;
      if (Sl.t >= 1.15 && !Sl.hit) { Sl.hit = true; shake(4); noise(0.4, 0.3, 700); if (!p.dead && p.x > Sl.x0 - 4 && p.x < Sl.x1 + 4 && p.y > L.py - 34) killPlayer(); }
      if (Sl.t >= 1.7) { S.state = 'sub'; S.st = S.phase2 ? 0.9 : 1.4; S.slam = null; }
    } else if (S.state === 'stun') { S.stunT -= DT; if (S.stunT <= 0) { S.state = 'sub'; S.st = 1.2; } }
    lSerpBody(S);
    if (!p.dead && S.state !== 'stun') for (const q of S.segs) if (q.y < wt - 2 && Math.hypot(q.x - p.x, q.y - (p.y - 11)) < q.r + 6) { killPlayer(); break; }
  }
  G.camX = 0; G.camY = L.py - 160;
}
// ---------- drawing ----------
function drawLiftSerpent() {
  const S = G.serp, segs = S.segs; if (!segs.length) return;
  const dead = S.dead, wt = S.wt;
  for (let i = segs.length - 1; i >= 0; i--) {
    const q = segs[i]; if (q.y - q.r > wt + 40) continue;
    ctx.save(); if (q.y - q.r > wt) ctx.globalAlpha = 0.35;
    const nx = i > 0 ? segs[i - 1] : { x: q.x - S.side, y: q.y }, a = Math.atan2(nx.y - q.y, nx.x - q.x);
    ctx.translate(q.x, q.y); ctx.rotate(a);
    if (i % 2 === 0 && i > 0) { ctx.fillStyle = dead ? '#3a4048' : '#8ab8d0'; ctx.beginPath(); ctx.moveTo(-4, -q.r * 0.7); ctx.lineTo(1, -q.r - 5); ctx.lineTo(4, -q.r * 0.7); ctx.closePath(); ctx.fill(); }
    el(0, 0, q.r * 1.15, q.r, dead ? '#2e343a' : '#4e7088'); el(0, q.r * 0.35, q.r * 0.95, q.r * 0.45, dead ? '#3a4046' : '#a8c8d8'); el(-1, -q.r * 0.45, q.r * 0.6, q.r * 0.25, 'rgba(255,255,255,0.15)');
    if (i === 0) {
      el(10, 0, 9, 7, dead ? '#2e343a' : '#4e7088'); ctx.fillStyle = dead ? '#3a4046' : '#a8c8d8'; ctx.beginPath(); ctx.moveTo(4, 3); ctx.lineTo(22, 2 + (S.state === 'rear' ? 3 : 0)); ctx.lineTo(4, 7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8f0f4'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(8 + k * 3.4, 1.6); ctx.lineTo(9.6 + k * 3.4, 4); ctx.lineTo(11 + k * 3.4, 1.6); ctx.fill(); }
      seg(-2, -8, -10, -15, 1.6, '#8ab8d0'); seg(2, -8, -4, -16, 1.6, '#8ab8d0');
      el(6, -3, 2.2, 2, dead ? '#222' : S.state === 'stun' ? '#ffd060' : S.hit.core ? '#ff6a4a' : '#bfefff');
      if (S.state === 'rear' && !dead) glow(16, 3, 8, S.parts[0].flash > 0 ? 'rgba(255,255,255,1)' : 'rgba(150,240,255,0.8)', 'rgba(150,240,255,0)');
      if (S.parts[0].flash > 0) el(4, 0, 12, 9, 'rgba(255,255,255,0.6)');
    }
    ctx.restore();
  }
  for (const pt of S.parts) if (pt.k !== 'core' && pt.hp > 0) {
    const q = S.pos[pt.k]; if (!q || q[1] > wt + 30) continue;
    ctx.save(); if (!S.hit[pt.k]) ctx.globalAlpha = 0.35;
    ctx.fillStyle = pt.flash > 0 ? '#fff' : '#bff4ff'; ctx.beginPath(); ctx.moveTo(q[0], q[1] - 9); ctx.lineTo(q[0] + 4.5, q[1]); ctx.lineTo(q[0], q[1] + 4); ctx.lineTo(q[0] - 4.5, q[1]); ctx.closePath(); ctx.fill();
    ctx.restore(); if (S.hit[pt.k]) glow(q[0], q[1] - 2, 9, 'rgba(140,240,255,0.6)', 'rgba(140,240,255,0)');
  }
}
function drawLiftTail(S) {
  const Sl = S.slam, L = G.lift, cx2 = (Sl.x0 + Sl.x1) / 2, sx2 = S.side < 0 ? 18 : 366, k = Math.min(1, Sl.t / 1.15), down = Sl.t >= 1.15;
  const ty = down ? L.py - 6 : L.py - 120 + k * 30;
  ctx.globalAlpha = 0.25 + 0.25 * k; ctx.fillStyle = '#ff4a3a'; ctx.fillRect(Sl.x0, L.py - 3, Sl.x1 - Sl.x0, 4); ctx.globalAlpha = 1;
  ctx.strokeStyle = '#4e7088'; ctx.lineCap = 'round'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(sx2, S.wt + 6); ctx.quadraticCurveTo(sx2 + (cx2 - sx2) * 0.3, ty - 60, cx2, ty); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = '#a8c8d8'; ctx.beginPath(); ctx.moveTo(sx2, S.wt + 6); ctx.quadraticCurveTo(sx2 + (cx2 - sx2) * 0.3, ty - 60, cx2, ty); ctx.stroke();
  ctx.fillStyle = '#6a92aa'; ctx.beginPath(); ctx.moveTo(cx2, ty); ctx.lineTo(cx2 - 22, ty + 8); ctx.lineTo(cx2 - 6, ty + 2); ctx.lineTo(cx2, ty + 10); ctx.lineTo(cx2 + 6, ty + 2); ctx.lineTo(cx2 + 22, ty + 8); ctx.closePath(); ctx.fill();
}
function renderLift() {
  C = ctx; setT();
  const L = G.lift, p = G.p, S = G.serp, camY = Math.round(G.camY * R) / R, bk = L.bossK;
  const sx = G.shake > 0 ? (rnd() - 0.5) * G.shake * 2 : 0, sy = G.shake > 0 ? (rnd() - 0.5) * G.shake * 2 : 0;
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#16405a'); bg.addColorStop(1, '#081a2a'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // the far side of the shaft, sliding by slowly
  for (let k = 0; k < 7; k++) { const y = ((k * 71 - camY * 0.4) % 500 + 500) % 500 - 60; ctx.fillStyle = 'rgba(170,220,240,0.07)'; ctx.beginPath(); ctx.moveTo(80 + k * 37, y); ctx.lineTo(96 + k * 37, y + 40); ctx.lineTo(80 + k * 37, y + 90); ctx.lineTo(64 + k * 37, y + 40); ctx.closePath(); ctx.fill(); }
  setT(sx, -camY + sy);
  // ice walls (they open up into a cavern at the bottom)
  const y0 = Math.floor(camY / 24) * 24;
  for (let y = y0 - 24; y < camY + H + 24; y += 24) {
    const r1 = hash(y * 0.37), r2 = hash(y * 0.53 + 9), op = L.boss ? Math.max(0, 1 - bk) : 1, wl = (L_X0 + r1 * 8) * (L.boss ? 1 - 0.6 * bk : 1), wr = (W - L_X1 + r2 * 8) * (L.boss ? 1 - 0.6 * bk : 1);
    rr(-4, y, wl + 4, 25, 5, '#7fb0cc'); rr(-4, y + 3, wl, 6, 3, 'rgba(255,255,255,0.18)');
    rr(W - wr, y, wr + 4, 25, 5, '#86b8d2'); rr(W - wr + 3, y + 3, wr - 4, 6, 3, 'rgba(255,255,255,0.18)');
    if (r1 > 0.7 && op > 0.5) seg(6, y + 6, 18, y + 14, 0.7, 'rgba(255,255,255,0.4)');
  }
  for (const lg of L.ledges) { const x = lg.side < 0 ? L_X0 - 4 : L_X1 - 22; rr(x, lg.y, 26, 6, 2, '#a8d4ea'); rr(x, lg.y, 26, 2, 1, '#e8f6fc'); }
  // ice plugs
  for (const pl of L.plugs) {
    if (pl.dead || pl.y > camY + H + 20 || pl.y + 16 < camY) continue;
    rr(L_X0 - 2, pl.y, L_X1 - L_X0 + 4, 16, 3, pl.flash > 0 ? '#ffffff' : '#9ccbe2'); rr(L_X0, pl.y, L_X1 - L_X0, 3, 1.5, '#e8f6fc');
    const dmg = 1 - pl.hp / pl.max; ctx.strokeStyle = 'rgba(30,60,80,0.8)'; ctx.lineWidth = 1;
    for (let k = 0; k < Math.ceil(dmg * 8); k++) { const x = L_X0 + 20 + hash(k * 7.3) * (L_X1 - L_X0 - 40); ctx.beginPath(); ctx.moveTo(x, pl.y + 2); ctx.lineTo(x + 6, pl.y + 8); ctx.lineTo(x + 2, pl.y + 14); ctx.stroke(); }
  }
  // the lake at the bottom
  if (L.boss) {
    const wt = S.wt, wg = ctx.createLinearGradient(0, wt, 0, wt + 60); wg.addColorStop(0, 'rgba(30,80,120,0.9)'); wg.addColorStop(1, 'rgba(6,20,36,1)');
    if (S.active && S.state === 'slam') drawLiftTail(S);
    drawLiftSerpent();
    ctx.fillStyle = wg; ctx.fillRect(-10, wt, W + 20, camY + H - wt + 20);
    ctx.strokeStyle = 'rgba(210,245,255,0.75)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = -10; x <= W + 10; x += 6) { const y = wt + Math.sin(x * 0.07 + G.time * 1.6); x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    if (S.state === 'warn' || S.state === 'rise') glow(S.x, wt, 22, 'rgba(200,245,255,0.5)', 'rgba(200,245,255,0)');
  }
  // the lift
  const py = L.py;
  for (const cx2 of [L_X0 + 18, L_X1 - 18]) seg(cx2, camY - 10, cx2, py, 1.4, '#9aa4ae');
  rr(L_X0, py, L_X1 - L_X0, 9, 2, '#56646e'); ctx.fillStyle = '#c8a020'; for (let x = L_X0; x < L_X1; x += 16) ctx.fillRect(x, py, 8, 2);
  ctx.fillStyle = '#2c3842'; for (let x = L_X0 + 6; x < L_X1 - 4; x += 8) ctx.fillRect(x, py + 3, 4, 4);
  for (const c of L.caps) drawBadge(Math.round(c.x) - 6, Math.round(c.y) - 5, c.kind, (G.t >> 3) % 2);
  // enemies
  for (const m of L.mobs) {
    const fl = m.flash > 0;
    if (m.t === 'tur') { const wx = m.side < 0 ? L_X0 - 4 : L_X1 - 2; rr(wx, m.y - 7, 6, 14, 2, '#5a7a8e'); el(m.x, m.y, 7, 6, fl ? '#fff' : '#9ac4da'); seg(m.x, m.y, m.x + Math.cos(m.ang) * 11, m.y + Math.sin(m.ang) * 11, 2.6, '#4a6a80'); el(m.x, m.y, 2, 2, '#4ae0ff'); }
    else if (m.t === 'sold') drawSoldier(m.x, m.y, 'stand', { face: m.face, frame: 0, pal: PAL_S, ax: Math.sign(p.x - m.x) || m.face, ay: 0, flash: fl });
    else if (m.t === 'ray') { ctx.save(); ctx.translate(m.x, m.y); ctx.scale(m.face, 1); const fw = Math.sin(G.time * 5 + m.ph) * 3; ctx.fillStyle = fl ? '#fff' : '#6a9ab8'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(0, -10 - fw, -6, -2); ctx.lineTo(-6, 2); ctx.quadraticCurveTo(0, 10 + fw, 10, 0); ctx.fill(); seg(-6, 0, -16, 0, 1, '#4a7088'); el(5, -2, 1.2, 1.2, '#dff'); ctx.restore(); }
    else if (m.t === 'crab') { ctx.save(); ctx.translate(m.x, m.y); if (m.st === 'climb') ctx.rotate(m.side * Math.PI / 2); const lg = Math.sin(m.anim) * 1.6; for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) seg(sd * 3, 1, sd * (8 + k), 5 + (k - 1) * 1.5 + lg * sd, 1, '#5a7a8e'); el(0, 0, 7, 5, fl ? '#fff' : '#8ab8d0'); el(0, -1.6, 5, 2, '#c8e6f2'); el(-6, -4, 2.6, 2, '#a8d0e0'); el(6, -4, 2.6, 2, '#a8d0e0'); el(-2, -3.4, 0.9, 0.9, '#123'); el(2, -3.4, 0.9, 0.9, '#123'); ctx.restore(); }
    else if (m.t === 'ice') {
      if (m.st === 'warn') { ctx.globalAlpha = 0.25 + 0.35 * (1 - m.T / 0.9); el(m.x, L.py - 1, 9, 2.4, '#0a1a28'); ctx.globalAlpha = 1; }
      else { ctx.fillStyle = fl ? '#fff' : '#d8f2ff'; ctx.beginPath(); ctx.moveTo(m.x - 6, m.y - 8); ctx.lineTo(m.x + 6, m.y - 8); ctx.lineTo(m.x + 3, m.y + 6); ctx.lineTo(m.x, m.y + 10); ctx.lineTo(m.x - 3, m.y + 6); ctx.closePath(); ctx.fill(); el(m.x, L.py - 1, 7 * Math.min(1, (m.y - camY) / 140), 2, 'rgba(10,26,40,0.45)'); }
    }
    else if (m.t === 'pod') { rr(m.x - 7, m.y - 6, 14, 12, 4, fl ? '#fff' : '#c83a2a'); rr(m.x - 5, m.y - 4, 10, 3, 1.5, 'rgba(255,255,255,0.35)'); drawText('?', m.x, m.y - 3, '#fff', 'center', 7); }
  }
  // you
  if (G.mode !== 'title' && !(p.invT > 0 && !p.dead && (G.t >> 2) % 2 === 0)) {
    drawSoldier(p.x, p.y, p.dead ? 'dead' : !p.onGround ? 'spin' : p.prone ? 'prone' : p.vx ? 'run' : 'stand', { face: p.dead ? -p.face : p.face, frame: p.anim, pal: PAL_P, ax: p.ax, ay: p.ay });
    if (p.warmT > 0 && !p.dead) { ctx.strokeStyle = `rgba(255,170,80,${0.4 + 0.2 * Math.sin(G.time * 4)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y - 11, 11, 14, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
  for (const s2 of L.shots) drawTDShot(s2);
  for (const b of L.eb) { const a = Math.atan2(b.vy, b.vx); seg(b.x - Math.cos(a) * 5, b.y - Math.sin(a) * 5, b.x + Math.cos(a) * 2, b.y + Math.sin(a) * 2, 2.4, 'rgba(170,235,255,0.9)'); el(b.x, b.y, 1.2, 1.2, '#fff'); }
  for (const n of L.nades) { ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(n.t * 9); el(0, 0, 3.2, 2.7, '#3e5a34'); rr(-1, -3.6, 2, 1.5, 0.5, '#9aa0a6'); ctx.restore(); }
  drawFx();
  setT();
}
function drawLiftHud() {
  const L = G.lift, k = Math.min(1, (L.py - L.py0) / L_DEPTH), x = W - 10, y0 = 40, hh = 120;
  if (L.boss) return;
  rr(x - 3, y0, 4, hh, 2, 'rgba(0,0,0,0.55)'); rr(x - 3, y0, 4, hh * k, 2, '#9fd6ff');
  for (const pl of L.plugs) { const yk = (pl.y - L.py0) / L_DEPTH; rr(x - 5, y0 + hh * yk - 1, 8, 2, 1, pl.dead ? '#4a5a64' : '#e8f6fc'); }
  el(x - 1, y0 + hh * k, 3, 3, '#ffe9a0');
  drawText(`深度 ${Math.round((L.py - L.py0) / 3)}米`, W - 18, 24, '#9fd6ff', 'right', 8);
  const pl = L.stopped && L.plugs.find(q => !q.dead && q.y - L.py < 30);
  if (pl) { drawText('打碎冰塞', W - 18, 34, '#e8f6fc', 'right', 8); rr(W - 78, 40, 56, 4, 2, 'rgba(0,0,0,0.55)'); rr(W - 78, 40, 56 * pl.hp / pl.max, 4, 2, '#9ccbe2'); }
}

// =====================================================================
// 水下第八关 远古母体: the last stage. Part one: guard a drill boring through the Ancient Mother's
// shell while her brood swarms it from the walls and the ceiling. Part two: the drill breaks
// through and you face the Mother herself — a huge eye, two tentacles and egg sacs.
// =====================================================================
const M_PLATS_A = [{ x0: 8, x1: 376, y: 192, floor: true }, { x0: 24, x1: 112, y: 140 }, { x0: 272, x1: 360, y: 140 }, { x0: 150, x1: 234, y: 92 }];
const M_PLATS_B = M_PLATS_A.slice(0, 3);
function initMom() {
  G.en = []; G.pods = []; G.items = []; G.camX = 0; G.camY = 0; G.shark = G.ghost = G.crab = G.queen = null;
  G.sea = { o2: 1, vents: [], pockets: [], surface: false, boats: false, diverT: 99, boatT: 99, warnT: 0 };
  G.mom = { phase: 'drill', plats: M_PLATS_A, mobs: [], shots: [], eb: [], nades: [], caps: [], sentries: [], drill: { hp: 100, prog: 0, jamT: 0, shieldT: 0, spin: 0 }, spawnT: 2.5, brute1: false, brute2: false,
    pods: [[18, 'Q'], [40, 'N'], [58, 'S'], [76, 'Q'], [90, 'N']], podI: 0, transT: 0, hintLaser: false };
  G.mcore = { active: false, dead: false, deadT: 0, phase2: false, state: 'idle', st: 3, t: 0, lid: 0, laser: null, slam: null, spit: 0, spitT: 0, sacT: { sacL: 4, sacR: 6.5 }, tired: 0,
    parts: [{ k: 'core', hp: 100, max: 100, flash: 0, x: 192, y: 58, r: 17 }, { k: 'armL', hp: 20, max: 20, flash: 0, x: 60, y: 110, r: 10 }, { k: 'armR', hp: 20, max: 20, flash: 0, x: 324, y: 110, r: 10 },
      { k: 'sacL', hp: 10, max: 10, flash: 0, x: 110, y: 46, r: 10 }, { k: 'sacR', hp: 10, max: 10, flash: 0, x: 274, y: 46, r: 10 }] };
  Object.assign(G.p, { x: 140, y: 192, vx: 0, vy: 0, face: 1, ax: 1, ay: 0, airJumps: 1, onGround: true, plat: M_PLATS_A[0], dropT: 0, prone: false });
  banner('守住钻机，让它钻透母体的外壳！', 2.6);
}
const mPart = k => G.mcore.parts.find(q => q.k === k);
function mRespawn() {
  const M = G.mom, top = M.phase === 'drill'; G.p = newPlayer(192);
  Object.assign(G.p, { x: top ? 192 : 192, y: top ? 92 : 192, vx: 0, vy: 0, face: 1, ax: 1, ay: 0, airJumps: 1, onGround: true, plat: top ? M_PLATS_A[3] : M_PLATS_A[0], dropT: 0, invT: 3, prone: false });
}
function mDmg(m, d) {
  if (m.dead) return;
  m.hp -= d; m.flash = 0.07; sfx.hit();
  if (m.hp <= 0) {
    m.dead = true; boom(m.x, m.t === 'spore' ? m.y : m.y - (m.t === 'brute' ? 14 : 6), m.t === 'brute' ? 18 : 9); sfx.boom();
    addScore({ crawl: 200, larva: 100, spore: 150, spit: 300, brute: 3000, pod: 100 }[m.t] || 100);
    if (m.t === 'pod') G.mom.caps.push({ x: m.x, y: m.y, vy: -60, kind: m.kind, rest: false });
    if (m.t === 'brute') banner('母体卫士被击退', 1.2);
  }
}
function mHitBoss(pt, dmg) {
  const B = G.mcore; if (pt.hp <= 0 || B.dead) return;
  if (pt.k === 'core' && B.lid < 0.5) { spark(pt.x, pt.y + 6); return; }
  pt.hp -= dmg; pt.flash = 0.06; sfx.hit();
  if (pt.k !== 'core' && pt.hp <= 0) {
    boom(pt.x, pt.y, 14); sfx.boom(); shake(2); addScore(2500);
    banner(pt.k.startsWith('arm') ? (pt.k === 'armL' ? '左' : '右') + '侧触手被打断 · 那一边不会再砸下来了' : '卵囊被打破 · 少了一路幼虫', 1.6);
    if (B.slam && B.slam.k === pt.k) B.slam = null;
  }
  if (pt.k === 'core') {
    if (!B.phase2 && pt.hp <= pt.max / 2) { B.phase2 = true; banner('远古母体狂暴 · 激光连发', 1.6); }
    if (pt.hp <= 0) { B.dead = true; B.deadT = 4; addScore(30000); for (const m of G.mom.mobs) m.dead = true; G.mom.eb.length = 0; B.laser = null; B.slam = null; Music.stop(); banner('远古母体被消灭！', 3); sfx.big(); }
  }
}
function mBlast(x, y) {
  const M = G.mom, B = G.mcore; boom(x, y, 20); sfx.big(); shake(3);
  for (const m of M.mobs) if (!m.dead && Math.hypot(m.x - x, m.y - 6 - y) < 46) mDmg(m, 6);
  if (B.active && !B.dead) for (const pt of B.parts) if (pt.hp > 0 && Math.hypot(pt.x - x, pt.y - y) < 48) mHitBoss(pt, 8);
}
function mShootE(x, y, vx, vy, g) { G.mom.eb.push({ x, y, vx, vy, g: g || 0, life: 4 }); sfx.eshot(); }
const mMobHit = (m, x, y, r) => m.t === 'brute' ? Math.abs(m.x - x) < 16 + r && y > m.y - 28 && y < m.y + r : m.t === 'spore' || m.t === 'pod' ? Math.hypot(m.x - x, m.y - y) < 8 + r : Math.abs(m.x - x) < (m.t === 'larva' ? 6 : 10) + r && y > m.y - (m.t === 'larva' ? 8 : m.t === 'spit' ? 26 : 18) - r && y < m.y + r;
function mPlatAt(x, y0, y1) { for (const pl of G.mom.plats) if (x >= pl.x0 && x <= pl.x1 && y0 <= pl.y && y1 >= pl.y) return pl; return null; }
function updateMom(I) {
  const M = G.mom, p = G.p, frozen = G.freezeT > 0, B = G.mcore, D = M.drill;
  if (p.flashT > 0) p.flashT -= DT;
  // ---- the drill ----
  if (M.phase === 'drill') {
    D.spin += DT * (D.jamT > 0 ? 1 : 12);
    if (D.shieldT > 0) D.shieldT -= DT;
    if (D.jamT > 0) { D.jamT -= DT; if (D.jamT <= 0) { D.hp = 60; banner('钻机修好了 · 继续钻探', 1.2); } }
    else {
      D.prog = Math.min(100, D.prog + DT * 100 / 72);
      if (D.hp <= 0) { D.jamT = 4; D.prog = Math.max(0, D.prog - 8); banner('钻机被咬坏了！修理中…', 1.6); noise(0.6, 0.2, 800); }
    }
    if (D.prog >= 100) { M.phase = 'breach'; M.transT = 3; for (const m of M.mobs) if (!m.dead) { m.dead = true; boom(m.x, m.y - 6, 8); } M.eb.length = 0; banner('钻透了！', 1.6); sfx.big(); Music.stop(); }
    // the brood
    M.spawnT -= DT;
    if (M.spawnT <= 0 && D.prog < 100) {
      const k = D.prog / 100, r = rnd(), side = rnd() < 0.5 ? -1 : 1, sx2 = side < 0 ? 10 : 374;
      M.spawnT = 2.3 - 1.1 * k;
      if (r < 0.4) M.mobs.push({ t: 'crawl', x: sx2, y: 192, vx: -side * 30, hp: 3, flash: 0, anim: 0, st: 'go' });
      else if (r < 0.62) for (let i = 0; i < 2; i++) M.mobs.push({ t: 'larva', x: sx2 - side * i * 12, y: 192, vx: -side * 52, hp: 1, flash: 0, anim: 0, st: 'go' });
      else if (r < 0.84) M.mobs.push({ t: 'spore', x: rnd() < 0.5 ? 96 : 288, y: 16, hp: 2, flash: 0, ph: rnd() * 6 });
      else if (M.mobs.filter(m => m.t === 'spit').length < 2) { const pl = M_PLATS_A[rnd() < 0.5 ? 1 : 2]; M.mobs.push({ t: 'spit', x: pl.x0 + 16 + rnd() * (pl.x1 - pl.x0 - 32), y: pl.y, hp: 3, flash: 0, cd: 1.5, ax: 0, ay: -1, rise: 0 }); }
    }
    if (!M.brute1 && D.prog >= 35) { M.brute1 = true; M.mobs.push({ t: 'brute', x: 6, y: 192, vx: 20, hp: 25, flash: 0, anim: 0, st: 'go' }); banner('母体卫士出现 · 别让它啃到钻机', 1.6); }
    if (!M.brute2 && D.prog >= 70) { M.brute2 = true; M.mobs.push({ t: 'brute', x: 378, y: 192, vx: -20, hp: 30, flash: 0, anim: 0, st: 'go' }); banner('母体卫士出现 · 别让它啃到钻机', 1.6); }
    while (M.podI < M.pods.length && D.prog >= M.pods[M.podI][0]) { const side = rnd() < 0.5 ? -1 : 1; M.mobs.push({ t: 'pod', x: side < 0 ? -8 : 392, y: 40 + rnd() * 20, vx: -side * 40, kind: M.pods[M.podI][1], hp: 1, flash: 0 }); M.podI++; }
  } else if (M.phase === 'breach') {
    M.transT -= DT; shake(1.5);
    if (M.transT <= 0) { M.phase = 'core'; M.plats = M_PLATS_B; B.active = true; B.st = 2.5; if (p.plat === M_PLATS_A[3]) { p.plat = null; p.onGround = false; } banner('警告 · 远古母体', 2.4); Music.start(true, 5); }
  }
  // ---- you ----
  if (p.dead) {
    p.deadT -= DT; p.vy = Math.min(p.vy + 500 * DT, 200); p.y = Math.min(200, p.y + p.vy * DT);
    if (p.deadT <= 0) { if (G.lives > 0) mRespawn(); else { gameOver(); return; } }
  } else {
    if (p.invT > 0) p.invT -= DT; if (p.shieldT > 0) p.shieldT -= DT; if (p.spCd > 0) p.spCd -= DT; if (p.dropT > 0) p.dropT -= DT;
    const h = (I.right ? 1 : 0) - (I.left ? 1 : 0), v = (I.down ? 1 : 0) - (I.up ? 1 : 0);
    if (h) p.face = h;
    landAim(p, h, v);
    if (I.jumpEdge) {
      if (p.onGround && v > 0 && p.plat && !p.plat.floor) { p.dropT = 0.25; p.dropPlat = p.plat; p.onGround = false; p.plat = null; p.vy = 40; p.prone = false; }
      else if (p.onGround) { p.vy = -255; p.onGround = false; p.plat = null; p.prone = false; sfx.jump(); }
      else if (p.airJumps > 0) { p.airJumps--; p.vy = -235; sfx.jump2(); }
    }
    p.vx = p.prone ? 0 : h * 80; p.x = Math.max(14, Math.min(370, p.x + p.vx * DT));
    if (p.onGround && p.plat && (p.x < p.plat.x0 - 2 || p.x > p.plat.x1 + 2 || !M.plats.includes(p.plat))) { p.onGround = false; p.plat = null; }
    if (p.onGround) { p.y = p.plat.y; p.vy = 0; }
    else {
      p.vy = Math.min(p.vy + 760 * DT, 340); const ny = p.y + p.vy * DT;
      const pl = p.vy >= 0 ? mPlatAt(p.x, p.y, ny) : null;
      if (pl && !(p.dropT > 0 && pl === p.dropPlat)) { p.y = pl.y; p.vy = 0; p.onGround = true; p.plat = pl; p.airJumps = 1; } else p.y = ny;
    }
    p.anim += DT * (h ? 10 : 3);
    p.cool -= DT;
    if (I.fireEdge) p.wantFire = true;
    if ((SET.autofire === 'on' ? I.fire : p.wantFire) && p.cool <= 0) {
      p.wantFire = false; const wk = p.weapon, w = WEAP[wk], dm = wk === 'laser' || wk === 'fire' || wk === 'homing' ? 2 : 1;
      const aim = p.botAim != null ? p.botAim : Math.atan2(p.ay, p.ax);
      const sx0 = p.prone ? p.x + p.face * 17 : p.x + Math.cos(aim) * 13, sy0 = p.prone ? p.y - 4 : (p.onGround ? p.y - 22 : p.y - 15) + Math.sin(aim) * 13;
      mFire(M.shots, wk, sx0, sy0, aim, dm); p.cool = w.cd * (p.rapid ? 0.7 : 1); p.flashT = 0.05;
    }
    if (I.cycEdge && G.inv.length > 1) { G.sel = (G.sel + 1) % G.inv.length; sfx.hit(); }
    if (I.grenEdge) useSpecial();
  }
  // sentry guns
  for (const st2 of M.sentries) {
    st2.t -= DT; if (st2.t <= 0) { st2.dead = true; continue; }
    st2.cd -= DT; let tg = null, bd = 260;
    for (const m of M.mobs) { if (m.dead || m.t === 'pod') continue; const d = Math.hypot(m.x - st2.x, m.y - 8 - st2.y); if (d < bd) { bd = d; tg = [m.x, m.y - 8]; } }
    if (!tg && B.active && !B.dead) for (const pt of B.parts) if (pt.hp > 0 && (pt.k !== 'core' || B.lid > 0.5)) { tg = [pt.x, pt.y]; break; }
    if (tg) { st2.ang = Math.atan2(tg[1] - (st2.y - 8), tg[0] - st2.x); if (st2.cd <= 0) { st2.cd = 0.35; mFire(M.shots, 'rifle', st2.x + Math.cos(st2.ang) * 9, st2.y - 8 + Math.sin(st2.ang) * 9, st2.ang, 1); } }
  }
  sweep(M.sentries);
  // pickups
  for (const c of M.caps) {
    if (!c.rest) { c.vy += 400 * DT; const ny = c.y + c.vy * DT, pl = c.vy > 0 ? mPlatAt(c.x, c.y + 6, ny + 6) : null; if (pl) { c.y = pl.y - 6; c.rest = true; } else c.y = ny; if (c.y > 220) c.dead = true; }
    if (c.rest && !M.plats.some(pl => c.x >= pl.x0 && c.x <= pl.x1 && Math.abs(pl.y - 6 - c.y) < 1)) c.rest = false;
    if (!p.dead && Math.abs(c.x - p.x) < 10 && Math.abs(c.y - (p.y - 11)) < 16) { c.dead = true; pickItem(c.kind); }
  }
  sweep(M.caps);
  // grenades
  for (const n of M.nades) {
    n.t += DT; n.vy += 600 * DT; const ny = n.y + n.vy * DT; n.x += n.vx * DT;
    const pl = n.vy > 0 ? mPlatAt(n.x, n.y, ny) : null; n.y = ny;
    if (n.x < 12 || n.x > 372) n.vx *= -0.5;
    const touch = M.mobs.some(m => !m.dead && m.t !== 'pod' && mMobHit(m, n.x, n.y, 3)) || (B.active && !B.dead && B.parts.some(pt => pt.hp > 0 && Math.hypot(pt.x - n.x, pt.y - n.y) < pt.r + 3));
    if (n.t > 1.1 || pl || (touch && n.t > 0.06)) { n.dead = true; mBlast(n.x, pl ? pl.y - 4 : n.y); }
  }
  sweep(M.nades);
  // ---- the brood ----
  for (const m of M.mobs) {
    if (m.flash > 0) m.flash -= DT;
    if (frozen || m.dead) continue;
    m.anim = (m.anim || 0) + DT * 8;
    const dx = p.x - m.x;
    if (m.t === 'crawl' || m.t === 'larva' || m.t === 'brute') {
      if (m.fall) { m.vy = (m.vy || 0) + 500 * DT; const ny = m.y + m.vy * DT, pl = mPlatAt(m.x, m.y, ny); if (pl) { m.y = pl.y; m.fall = false; } else m.y = ny; if (m.y > 230) m.dead = true; continue; }
      const toDrill = M.phase === 'drill', tx = toDrill ? 192 : p.x, sp = m.t === 'larva' ? 52 : m.t === 'brute' ? 20 : 30;
      if (toDrill && Math.abs(m.x - 192) < (m.t === 'brute' ? 30 : 22) && m.y >= 191) { m.st = 'bite'; m.vx = 0; if (D.shieldT <= 0 && D.jamT <= 0) D.hp -= DT * (m.t === 'brute' ? 16 : m.t === 'larva' ? 3 : 6); }
      else { m.st = 'go'; m.vx = Math.sign(tx - m.x) * sp; m.x += m.vx * DT; }
      if (!p.dead && Math.abs(dx) < (m.t === 'brute' ? 18 : m.t === 'larva' ? 8 : 12) && p.y > m.y - (m.t === 'brute' ? 30 : 14) && p.y - (p.prone ? 9 : 22) < m.y) killPlayer();
    } else if (m.t === 'spore') {
      const tx = M.phase === 'drill' ? 192 : p.x, ty = M.phase === 'drill' ? 150 : p.y - 12, ex = tx - m.x, ey = ty - m.y, d = Math.hypot(ex, ey) || 1;
      m.x += ex / d * 24 * DT + Math.sin(G.time * 2 + m.ph) * 12 * DT; m.y += ey / d * 24 * DT;
      if (M.phase === 'drill' && d < 16) { m.dead = true; boom(m.x, m.y, 10); sfx.boom(); if (D.shieldT <= 0 && D.jamT <= 0) D.hp -= 12; }
      if (!p.dead && Math.hypot(dx, p.y - 12 - m.y) < 11) { m.dead = true; boom(m.x, m.y, 10); killPlayer(); }
    } else if (m.t === 'spit') {
      m.rise = Math.min(1, m.rise + DT * 2); const a = Math.atan2(p.y - 14 - (m.y - 21), dx); m.ax = Math.cos(a); m.ay = Math.sin(a);
      m.cd -= DT; if (m.cd <= 0 && !p.dead) { m.cd = 3.2 + rnd() * 0.8; const tt = 0.9, vx = (dx + (rnd() - 0.5) * 24) / tt, vy = (p.y - 14 - (m.y - 24)) / tt - 0.5 * 300 * tt; mShootE(m.x, m.y - 24, vx, vy, 300); }
    } else if (m.t === 'pod') { m.x += m.vx * DT; m.y += Math.sin(G.time * 2) * 6 * DT; if (m.x < -20 || m.x > 404) m.dead = true; }
  }
  // ---- your shots ----
  for (const s2 of M.shots) {
    if (!mShotStep(s2, M, B)) { s2.dead = true; spark(s2.x, s2.y); continue; }
    const hr = s2.k === 'fire' ? 5 : 3;
    { const e = M.eb.find(e2 => !e2.dead && Math.abs(e2.x - s2.x) < 5 + hr && Math.abs(e2.y - s2.y) < 5 + hr); if (e) { e.dead = true; G.fx.push({ k: 'puff', x: e.x, y: e.y, vx: 0, vy: -10, t: 0, life: 0.3 }); if (!s2.pierce) { s2.dead = true; continue; } } } // acid globs can be shot down
    for (const m of M.mobs) { if (m.dead || s2.hits.has(m) || !mMobHit(m, s2.x, s2.y, hr)) continue; mDmg(m, s2.dmg); if (s2.pierce) s2.hits.add(m); else { s2.dead = true; break; } }
    if (s2.dead || !B.active || B.dead) continue;
    for (const pt of B.parts) { if (pt.hp <= 0 || s2.hits.has(pt) || Math.hypot(pt.x - s2.x, pt.y - s2.y) > pt.r + hr) continue; mHitBoss(pt, s2.dmg); if (s2.pierce && !(pt.k === 'core' && B.lid < 0.5)) s2.hits.add(pt); else { s2.dead = true; break; } }
  }
  sweep(M.mobs); sweep(M.shots);
  for (const b of M.eb) {
    b.vy += b.g * DT; b.x += b.vx * DT; b.y += b.vy * DT; b.life -= DT;
    if (b.life <= 0 || b.y > 196 || b.x < 4 || b.x > 380 || (b.g && mPlatAt(b.x, b.y - b.vy * DT, b.y))) { b.dead = true; if (b.g) G.fx.push({ k: 'puff', x: b.x, y: b.y, vx: 0, vy: -10, t: 0, life: 0.4 }); continue; }
    if (!p.dead && Math.abs(b.x - p.x) < (p.prone ? 10 : 6) && b.y > p.y - (p.prone ? 9 : 22) && b.y < p.y) { b.dead = true; killPlayer(); }
  }
  sweep(M.eb);
  // ---- 远古母体 ----
  for (const pt of B.parts) if (pt.flash > 0) pt.flash -= DT;
  if (B.dead) { B.deadT -= DT; B.lid = Math.max(0, B.lid - DT); if (rnd() < 0.35) { boom(30 + rnd() * 324, 20 + rnd() * 120, 12); if (rnd() < 0.4) sfx.boom(); } if (B.deadT <= 0) stageClear(); }
  else if (B.active && !frozen) {
    B.t += DT;
    const core = B.parts[0], aL = mPart('armL'), aR = mPart('armR');
    // tentacle tips sway unless they are slamming
    for (const [a, bx] of [[aL, 60], [aR, 324]]) if (!(B.slam && B.slam.k === a.k)) { a.x = bx + Math.sin(B.t * 0.9 + bx) * 12; a.y = 108 + Math.sin(B.t * 1.3 + bx) * 6; }
    // egg sacs drop larvae
    for (const k of ['sacL', 'sacR']) { const q = mPart(k); if (q.hp <= 0) continue; B.sacT[k] -= DT; if (B.sacT[k] <= 0) { B.sacT[k] = B.phase2 ? 5 : 7.5; M.mobs.push({ t: 'larva', x: q.x, y: q.y + 8, vx: 0, vy: 0, hp: 1, flash: 0, anim: 0, st: 'go', fall: true }); } }
    const open = B.state === 'laser' || B.state === 'tired';
    B.lid = Math.max(0, Math.min(1, B.lid + (open ? DT * 4 : -DT * 3)));
    if (B.state === 'idle') {
      B.st -= DT;
      if (B.st <= 0) {
        const arms = [aL, aR].filter(a => a.hp > 0), r = rnd();
        if (r < 0.45 || !arms.length && r < 0.7) { B.state = 'laser'; B.lq = B.phase2 ? [rnd() < 0.5 ? 'low' : 'high', rnd() < 0.5 ? 'low' : 'high'] : [rnd() < 0.5 ? 'low' : 'high']; B.laser = null; B.st = 0.4; if (!M.hintLaser) { M.hintLaser = true; banner('激光贴地时跳起来，齐胸高时趴下', 2); } }
        else if (arms.length && r < 0.8) { const a = arms.length > 1 ? (Math.abs(p.x - 60) < Math.abs(p.x - 324) ? aL : aR) : arms[0]; B.state = 'slam'; B.slam = { k: a.k, t: 0, x: a.x, hit: false }; tone(90, 0.9, 'sawtooth', 0.05, 60); }
        else { B.state = 'spit'; B.spit = B.phase2 ? 5 : 3; B.spitT = 0.3; }
      }
    } else if (B.state === 'laser') {
      if (!B.laser) { B.st -= DT; if (B.st <= 0) { if (B.lq.length) { B.laser = { y: B.lq.shift() === 'low' ? 187 : 174, t: 0 }; tone(700, 1, 'square', 0.03, 900); } else { B.state = 'tired'; B.st = 2.4; } } }
      else {
        const L2 = B.laser; L2.t += DT;
        if (L2.t >= 1.1 && L2.t < 1.6 && !p.dead) { const top = p.prone ? p.y - 9 : p.y - 22; if (L2.y + 2 > top && L2.y - 2 < p.y && !(p.y < 150)) killPlayer(); }
        if (L2.t >= 1.1 && L2.t - DT < 1.1) { noise(0.7, 0.2, 2600); shake(2); }
        if (L2.t >= 1.6) { B.laser = null; B.st = 0.35; }
      }
    } else if (B.state === 'tired') { B.st -= DT; if (B.st <= 0) { B.state = 'idle'; B.st = B.phase2 ? 1.4 : 2.2; } }
    else if (B.state === 'slam') {
      const S2 = B.slam; if (!S2) { B.state = 'idle'; B.st = 1.5; }
      else {
        const a = mPart(S2.k); S2.t += DT;
        if (S2.t < 1.0) { a.x = S2.x; a.y = 108 - Math.min(1, S2.t / 0.4) * 48; }
        else if (S2.t < 1.15) { a.y = 60 + (S2.t - 1) / 0.15 * 126; if (!S2.hit && a.y > 150) { S2.hit = true; shake(4); noise(0.4, 0.3, 700); if (!p.dead && Math.abs(p.x - S2.x) < 42) killPlayer(); } }
        else if (S2.t < 2.1) { a.y = 186; }
        else if (S2.t < 2.6) { a.y = 186 - (S2.t - 2.1) / 0.5 * 78; }
        else { B.slam = null; B.state = 'idle'; B.st = B.phase2 ? 1.2 : 1.8; }
      }
    } else if (B.state === 'spit') {
      B.spitT -= DT;
      if (B.spitT <= 0 && B.spit > 0) { B.spit--; B.spitT = 0.45; const tt = 1.1, tx = p.x + (rnd() - 0.5) * 40, vx = (tx - core.x) / tt, vy = (p.y - 10 - (core.y + 16)) / tt - 0.5 * 260 * tt; mShootE(core.x, core.y + 16, vx, vy, 260); }
      if (B.spit <= 0 && B.spitT <= 0) { B.state = 'idle'; B.st = B.phase2 ? 1.2 : 1.8; }
    }
    if (!p.dead && Math.hypot(p.x - core.x, p.y - 11 - core.y) < 26) killPlayer();
  }
  G.camX = 0; G.camY = 0;
}
function mFire(arr, wk, sx0, sy0, aim, dm) {
  const shot = (da, o) => { const a = aim + da, sp = (o && o.sp) || 240; arr.push(Object.assign({ k: wk, x: sx0, y: sy0, cx: sx0, cy: sy0, ang: a, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.3, t: 0, dmg: dm, pierce: wk === 'laser', hits: new Set(), tr: [] }, o || {})); };
  if (wk === 'spread') { for (const d of [-0.3, -0.15, 0, 0.15, 0.3]) shot(d); sfx.spread(); }
  else if (wk === 'fire') { G.mom.fireDir = -(G.mom.fireDir || 1); shot(0, { sp: 150, life: 1.6, dir: G.mom.fireDir }); sfx.fire(); }
  else if (wk === 'homing') { shot(0, { sp: 120, life: 1.9 }); sfx.msl(); }
  else if (wk === 'laser') { shot(0, { sp: 340 }); sfx.laser(); }
  else { shot(0, wk === 'machine' ? { sp: 270 } : null); sfx.shoot(); }
}
function mShotStep(s2, M, B) {
  s2.t += DT; s2.life -= DT;
  if (s2.k === 'fire') {
    s2.cx += s2.vx * DT; s2.cy += s2.vy * DT;
    const r = Math.min(10, s2.t * 70), a = s2.t * 13 * s2.dir, fx = Math.cos(s2.ang), fy = Math.sin(s2.ang);
    s2.x = s2.cx + (-fy * Math.cos(a) + fx * Math.sin(a)) * r; s2.y = s2.cy + (fx * Math.cos(a) + fy * Math.sin(a)) * r;
    s2.tr.push(s2.x, s2.y); if (s2.tr.length > 20) s2.tr.splice(0, 2);
  } else if (s2.k === 'homing') {
    let tg = null, bd = 230;
    for (const m of M.mobs) { if (m.dead) continue; const dd = Math.hypot(m.x - s2.x, m.y - 8 - s2.y); if (dd < bd) { bd = dd; tg = [m.x, m.y - 8]; } }
    if (B.active && !B.dead) for (const pt of B.parts) { if (pt.hp <= 0 || (pt.k === 'core' && B.lid < 0.5)) continue; const dd = Math.hypot(pt.x - s2.x, pt.y - s2.y); if (dd < bd + 80) { bd = dd - 80; tg = [pt.x, pt.y]; } }
    if (tg) { let da = Math.atan2(tg[1] - s2.y, tg[0] - s2.x) - s2.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); s2.ang += Math.max(-5 * DT, Math.min(5 * DT, da)); }
    const sp = Math.min(240, Math.hypot(s2.vx, s2.vy) + 260 * DT); s2.vx = Math.cos(s2.ang) * sp; s2.vy = Math.sin(s2.ang) * sp;
    s2.x += s2.vx * DT; s2.y += s2.vy * DT; s2.tr.push(s2.x, s2.y); if (s2.tr.length > 14) s2.tr.splice(0, 2);
  } else { s2.x += s2.vx * DT; s2.y += s2.vy * DT; }
  const wx = s2.k === 'fire' ? s2.cx : s2.x, wy = s2.k === 'fire' ? s2.cy : s2.y;
  return !(s2.life <= 0 || wx < 6 || wx > 378 || wy < 10 || wy > 194);
}
// ---------- drawing ----------
function drawMomBoss() {
  const B = G.mcore, p = G.p, dead = B.dead, core = B.parts[0];
  // tentacles
  for (const [k, bx] of [['armL', 14], ['armR', 370]]) {
    const a = mPart(k); if (a.hp <= 0) { el(bx + (k === 'armL' ? 10 : -10), 26, 9, 7, '#3a1632'); continue; }
    const mx = (bx + a.x) / 2 + (k === 'armL' ? -14 : 14), my = (22 + a.y) / 2 - 10, N = 12;
    for (let i = N; i >= 0; i--) { const t = i / N, x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * mx + t * t * a.x, y = (1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * my + t * t * a.y; el(x, y, 9 - t * 4, 9 - t * 4, dead ? '#2a1424' : i % 2 ? '#5a2450' : '#6a2c5e'); }
    el(a.x, a.y, 8, 8, a.flash > 0 ? '#fff' : '#8a3a78'); glow(a.x, a.y + 1, 9, 'rgba(190,240,100,0.5)', 'rgba(190,240,100,0)'); el(a.x, a.y + 1, 3.4, 3.4, '#c8f060');
  }
  // egg sacs
  for (const k of ['sacL', 'sacR']) { const q = mPart(k); seg(q.x, 12, q.x, 35, 2.4, '#4a1840'); if (q.hp <= 0) { el(q.x, 34, 5, 3, '#3a1632'); continue; } ctx.save(); ctx.translate(q.x, 34); ctx.scale(1, -1); drawSac({ x: 0, y: 0, flash: q.flash }); ctx.restore(); }
  // the eye
  el(core.x, core.y, 34, 28, dead ? '#2a1424' : '#4a1c44'); el(core.x, core.y - 4, 30, 18, '#5a2452');
  el(core.x, core.y + 2, 22, 18, core.flash > 0 ? '#fff' : '#e8dcae');
  const ix = core.x + Math.max(-8, Math.min(8, (p.x - core.x) * 0.05)), iy = core.y + 4 + Math.max(-2, Math.min(4, (p.y - core.y) * 0.02));
  el(ix, iy, 9, 9, B.laser && B.laser.t < 1.1 ? '#e8402a' : '#c8302a'); el(ix, iy, 3, 7, '#100408'); el(ix - 3, iy - 3, 2, 2, 'rgba(255,255,255,0.8)');
  const lid = 1 - B.lid; if (lid > 0.02) { ctx.fillStyle = dead ? '#2a1424' : '#6a2c5e'; ctx.beginPath(); ctx.ellipse(core.x, core.y + 2 - 18 * (1 - lid), 23, 18 * lid + 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#3a1632'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(core.x - 22, core.y + 2 + 18 * (lid * 2 - 1)); ctx.lineTo(core.x + 22, core.y + 2 + 18 * (lid * 2 - 1)); ctx.stroke(); }
  // laser
  if (B.laser && !dead) {
    const L2 = B.laser;
    if (L2.t < 1.1) { const k = L2.t / 1.1; ctx.fillStyle = `rgba(255,70,60,${0.25 + 0.35 * k})`; ctx.fillRect(10, L2.y - 0.6, 364, 1.2); drawText(L2.y > 180 ? '跳！' : '趴下！', core.x, 120, '#ff9a7a', 'center', 9); glow(core.x, core.y + 4, 10 + 8 * k, 'rgba(255,90,70,0.6)', 'rgba(255,60,40,0)'); }
    else if (L2.t < 1.6) { const g = ctx.createLinearGradient(0, L2.y - 4, 0, L2.y + 4); g.addColorStop(0, 'rgba(255,80,60,0)'); g.addColorStop(0.5, 'rgba(255,240,220,0.95)'); g.addColorStop(1, 'rgba(255,80,60,0)'); ctx.fillStyle = g; ctx.fillRect(10, L2.y - 4, 364, 8); seg(core.x, core.y + 10, core.x, L2.y, 3, 'rgba(255,200,180,0.7)'); }
  }
  if (B.slam && !dead && B.slam.t < 1.15) { const k = Math.min(1, B.slam.t / 1.0); ctx.fillStyle = `rgba(255,60,50,${0.15 + 0.25 * k})`; ctx.fillRect(B.slam.x - 42, 136, 84, 58); }
}
function renderMom() {
  C = ctx; setT();
  const M = G.mom, p = G.p, B = G.mcore, D = M.drill, core = M.phase === 'core';
  const sx = G.shake > 0 ? (rnd() - 0.5) * G.shake * 2 : 0, sy = G.shake > 0 ? (rnd() - 0.5) * G.shake * 2 : 0;
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, core ? '#3a0c22' : '#2a0c26'); bg.addColorStop(1, core ? '#1a0410' : '#12040e'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  setT(sx, sy);
  // living walls
  const pulse = 0.5 + 0.5 * Math.sin(G.time * 1.3);
  ctx.strokeStyle = `rgba(150,40,90,${0.25 + 0.15 * pulse})`; ctx.lineWidth = 1.4;
  for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(20 + k * 64, 0); ctx.bezierCurveTo(40 + k * 64, 60, 4 + k * 64, 120, 30 + k * 64, 196); ctx.stroke(); }
  ctx.fillStyle = '#4a1840'; ctx.beginPath(); ctx.moveTo(0, 0); for (let y = 0; y <= 200; y += 10) ctx.lineTo(10 + Math.sin(y * 0.09 + G.time) * 3, y); ctx.lineTo(0, 200); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W, 0); for (let y = 0; y <= 200; y += 10) ctx.lineTo(W - 10 - Math.sin(y * 0.09 + G.time + 1) * 3, y); ctx.lineTo(W, 200); ctx.fill();
  ctx.fillStyle = '#3a1232'; ctx.beginPath(); ctx.moveTo(0, 0); for (let x = 0; x <= W; x += 12) ctx.lineTo(x, 14 + Math.sin(x * 0.07 + G.time * 0.8) * 3); ctx.lineTo(W, 0); ctx.fill();
  if (!core) for (const hx of [96, 288]) { el(hx, 15, 9, 4, '#1a0410'); }
  for (const hx of [8, 376]) el(hx, 184, 5, 9, '#1a0410');
  // floor and ledges
  ctx.fillStyle = '#5a2050'; ctx.fillRect(0, 192, W, 24); ctx.fillStyle = '#7a3068'; ctx.fillRect(0, 192, W, 3);
  if (!core) { el(192, 196, 30, 5, '#9a4a7a'); el(192, 196, 18, 3, '#c86a9a'); }
  for (const pl of M.plats) { if (pl.floor) continue; rr(pl.x0, pl.y, pl.x1 - pl.x0, 7, 3, '#e8dcc0'); rr(pl.x0 + 2, pl.y + 4, pl.x1 - pl.x0 - 4, 4, 2, '#b8a888'); for (let x = pl.x0 + 8; x < pl.x1 - 4; x += 14) el(x, pl.y + 8, 2.4, 2, '#8a7a60'); }
  // the drill
  if (M.phase !== 'core') {
    const dx = 192, jam = D.jamT > 0;
    seg(170, 192, 188, 132, 2.6, '#6a7a84'); seg(214, 192, 196, 132, 2.6, '#6a7a84'); seg(176, 172, 208, 172, 1.6, '#56646e');
    rr(180, 120, 24, 16, 3, jam ? '#7a5a50' : '#56646e'); rr(182, 122, 20, 4, 2, '#c8a020'); el(192, 128, 3, 3, jam ? '#e84a2a' : '#7aff7a');
    seg(dx, 136, dx, 194, 4, '#9aa4ae'); for (let k = 0; k < 6; k++) { const y = 140 + ((k * 10 + D.spin * 12) % 56); seg(dx - 3, y, dx + 3, y + 3, 1, '#4a5660'); }
    if (D.shieldT > 0) { ctx.strokeStyle = `rgba(120,220,255,${0.5 + 0.2 * Math.sin(G.time * 5)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(192, 160, 30, 40, 0, 0, Math.PI * 2); ctx.stroke(); }
    if (jam) drawText('维修中', 192, 108, '#ffb09a', 'center', 7);
  }
  if (M.phase === 'breach') { ctx.fillStyle = '#12040e'; ctx.beginPath(); ctx.ellipse(192, 198, 30 + (3 - M.transT) * 30, 6 + (3 - M.transT) * 3, 0, 0, Math.PI * 2); ctx.fill(); }
  if (B.active || B.dead) drawMomBoss();
  for (const c of M.caps) drawBadge(Math.round(c.x) - 6, Math.round(c.y) - 5, c.kind, (G.t >> 3) % 2);
  for (const st2 of M.sentries) { rr(st2.x - 6, st2.y - 6, 12, 6, 2, '#56646e'); seg(st2.x, st2.y - 8, st2.x + Math.cos(st2.ang) * 10, st2.y - 8 + Math.sin(st2.ang) * 10, 2.4, '#2a3036'); el(st2.x, st2.y - 8, 4, 3.4, '#7a8a94'); if (st2.t < 3 && (G.t >> 3) % 2) el(st2.x, st2.y - 12, 1, 1, '#e8402a'); }
  for (const m of M.mobs) {
    if (m.t === 'crawl') drawCrawler(m);
    else if (m.t === 'brute') { ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1.9, 1.9); drawCrawler({ x: 0, y: 0, vx: m.vx || (192 - m.x), anim: m.anim, flash: m.flash }); ctx.restore(); }
    else if (m.t === 'larva') drawLarva(m);
    else if (m.t === 'spit') drawSpitter(m);
    else if (m.t === 'spore') { glow(m.x, m.y, 9, 'rgba(200,120,240,0.45)', 'rgba(200,120,240,0)'); el(m.x, m.y, 6, 5.4, m.flash > 0 ? '#fff' : '#a868c8'); el(m.x - 2, m.y - 2, 2, 1.4, 'rgba(255,255,255,0.4)'); ctx.strokeStyle = 'rgba(200,140,230,0.7)'; ctx.lineWidth = 0.7; ctx.beginPath(); for (let k = -1; k <= 1; k++) { ctx.moveTo(m.x + k * 3, m.y + 4); ctx.quadraticCurveTo(m.x + k * 3 + Math.sin(G.time * 3 + k) * 2, m.y + 8, m.x + k * 2.4, m.y + 12); } ctx.stroke(); }
    else if (m.t === 'pod') { rr(m.x - 7, m.y - 6, 14, 12, 4, m.flash > 0 ? '#fff' : '#c83a2a'); rr(m.x - 5, m.y - 4, 10, 3, 1.5, 'rgba(255,255,255,0.35)'); drawText('?', m.x, m.y - 3, '#fff', 'center', 7); }
  }
  if (G.mode !== 'title' && !(p.invT > 0 && !p.dead && (G.t >> 2) % 2 === 0)) drawSoldier(p.x, p.y, p.dead ? 'dead' : !p.onGround ? 'spin' : p.prone ? 'prone' : p.vx ? 'run' : 'stand', { face: p.dead ? -p.face : p.face, frame: p.anim, pal: PAL_P, ax: p.ax, ay: p.ay });
  if (p.shieldT > 0 && !p.dead) { ctx.strokeStyle = 'rgba(120,220,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y - 11, 11, 14, 0, 0, Math.PI * 2); ctx.stroke(); }
  for (const s2 of M.shots) drawTDShot(s2);
  for (const b of M.eb) { glow(b.x, b.y, 4.5, 'rgba(190,240,100,0.7)', 'rgba(190,240,100,0)'); el(b.x, b.y, 2.2, 2.2, '#c8f060'); }
  for (const n of M.nades) { ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(n.t * 9); el(0, 0, 3.2, 2.7, '#3e5a34'); rr(-1, -3.6, 2, 1.5, 0.5, '#9aa0a6'); ctx.restore(); }
  drawFx();
  if (M.phase === 'breach' && M.transT < 1) { ctx.fillStyle = `rgba(255,240,240,${1 - M.transT})`; ctx.fillRect(-10, -10, W + 20, H + 20); }
  setT();
}
function drawMomHud() {
  const M = G.mom, D = M.drill; if (M.phase !== 'drill') return;
  const x = W - 86, y = 22;
  drawText('钻探', x - 4, y - 1.5, '#ffe9a0', 'right', 8); rr(x, y, 74, 6, 2, 'rgba(0,0,0,0.6)'); rr(x + 1, y + 1, 72 * D.prog / 100, 4, 1.5, '#ffd25a');
  drawText(`${Math.floor(D.prog)}%`, x + 37, y + 8, '#ffe9a0', 'center', 7);
  drawText('钻机', x - 4, y + 17.5, D.hp < 30 ? '#ff7a5a' : '#9fd6ff', 'right', 8); rr(x, y + 19, 74, 5, 2, 'rgba(0,0,0,0.6)'); rr(x + 1, y + 20, Math.max(0, 72 * D.hp / 100), 3, 1.5, D.jamT > 0 ? '#7a8088' : D.shieldT > 0 ? '#9ff8ff' : D.hp < 30 ? '#ff5a3a' : '#58d854');
}

function updatePlayer(I) {
  const p = G.p;
  const previousFoot=p.y;if(p.cartCooldown>0)p.cartCooldown=Math.max(0,p.cartCooldown-DT);
  if (p.flashT > 0) p.flashT -= DT;
  if (p.dead) {
    const ready=advanceDeath(p,DT,{land:(x,from,to)=>findLand(x,from,to,5,false),bottom:G.camY+H+36,clampX:x=>Math.max(G.camX+8,Math.min(xMax(8),x))});
    if (ready) { if (G.lives > 0) respawn(); else if (!cooperative() || players().every(q => q.dead && (q.deathHidden || q.deadT <= 0))) gameOver(); }
    return;
  }
  const recoiling=isCelestial()&&advanceVitality(p,DT);
  if(recoiling)I={...I,left:false,right:false,up:false,down:false,jumpEdge:false,fire:false,fireEdge:false,grenEdge:false};
  if (p.invT > 0) p.invT -= DT;
  if (p.shieldT > 0) p.shieldT -= DT;
  if (p.camoT > 0) p.camoT -= DT;
  if (p.helmT > 0) p.helmT -= DT;
  if (p.cleatT > 0) p.cleatT -= DT;
  if (p.thermT > 0) p.thermT -= DT;
  if (p.fireproofT > 0) p.fireproofT -= DT;
  if (p.magnetT > 0) p.magnetT -= DT;
  if (p.acidT > 0) p.acidT -= DT;
  if (p.hook && (p.vy >= 0 || p.onGround)) p.hook = null;
  if (p.spCd > 0) p.spCd -= DT;
  if (p.ride) { p.rideT -= DT; if (p.rideT <= 0) { banner(p.ride === 'heli' ? '直升机时间到' : '摩托车时间到', 1); dismount(false); } }
  const changed=isCelestial()?advanceTransformation(p,I,DT):null;
  if(changed?.attack?.t===0)queueHeroSounds(G,p,changed.form==='tortoise'?'heavy':changed.form==='peng'?'qi':'spin');
  const giant = p.giantT > 0, moto = p.ride === 'moto', heli = p.ride === 'heli';
  const motoContact=moto&&p.onGround?{x:p.x,y:p.y,support:p.support,snow:G.stage===5}:null;
  const h = (I.right ? 1 : 0) - (I.left ? 1 : 0), v = (I.down ? 1 : 0) - (I.up ? 1 : 0);
  if (h) p.face = h;
  if(p.cart&&(!isMinecartRider(p)||G.stage!==7||!G.en.includes(p.cart)))leaveMinecart(p);
  if(isMinecartRider(p)&&I.jumpEdge&&minecartCanRise(p,solids)){leaveMinecart(p,JUMPV);sfx.jump();I={...I,jumpEdge:false};}

  if(isMinecartRider(p)){
    const riders=players().filter(q=>!q.dead&&q.cart===p.cart).sort((a,b)=>(a.pid||1)-(b.pid||1));
    if(riders[0]===p&&h)p.cart.driveVX=h*MINECART.speed;
    syncMinecartRider(p);p.cartDuck=v>0||!minecartCanRise(p,solids);
  }
  else if (G.subMode) subMove(I, h, v);
  else if (G.uw) {
    // swimming: free 8-way movement with inertia, a slow sink, and a dash on the jump key
    p.prone = p.dive = p.spin = p.inWater = p.onGround = false; p.support = null;
    if (p.dashT > 0) p.dashT -= DT; if (p.dashCd > 0) p.dashCd -= DT; if (p.o2T > 0) p.o2T -= DT;
    if (I.jumpEdge && !(p.dashCd > 0)) {
      p.dashT = 0.25; p.dashCd = 0.7; const dl = Math.hypot(h, v) || 1;
      p.vx = (h || (v ? 0 : p.face)) / dl * 190; p.vy = v / dl * 190; sfx.jump();
      for (let i = 0; i < 4; i++) G.fx.push({ k: 'bub', x: p.x - p.face * 10, y: p.y, vx: (rnd() - 0.5) * 20, vy: -20 - rnd() * 20, t: 0, life: 0.8 });
    }
    if (!(p.dashT > 0)) { const tx = h * 74, ty = v * 64; p.vx += (tx - p.vx) * Math.min(1, DT * 4); p.vy += (ty - p.vy) * Math.min(1, DT * 4); if (!v) p.vy += 10 * DT; }
    const x0 = p.x; p.x += p.vx * DT; p.x = Math.max(G.camX + 10, Math.min(p.x, xMax(12))); swimCollideX(p, x0);
    const y0 = p.y; p.y += p.vy * DT; { const top = G.vert ? G.camY + 4 : SEA_SURF; if (p.y < top) { p.y = top; p.vy = Math.max(0, p.vy); } } swimCollideY(p, y0);
    p.anim += DT * (Math.abs(p.vx) + Math.abs(p.vy) > 10 ? 9 : 3);
    if (G.t % 50 === 0) G.fx.push({ k: 'bub', x: p.x + p.face * 9, y: p.y - 4, vx: 0, vy: -24, t: 0, life: 1.2 });
  } else if (changed?.form==='peng') {
    p.prone=p.dive=p.spin=p.inWater=p.onGround=false;p.support=null;
    p.vx=recoiling?p.knockVX:h*TRANSFORM_FORMS.peng.speed;p.vy=v*105;
    const x0=p.x;p.x+=p.vx*DT;wallCollide(p,x0,5);
    p.x=Math.max((isSiege()?0:G.camX)+8,Math.min(p.x,xMax(12)));
    const y0=p.y;p.y=Math.max(G.camY+50,Math.min(p.y+p.vy*DT,G.camY+166));swimCollideY(p,y0);
    p.anim+=DT*10;
  } else if (heli) {
    // free flight inside the screen
    p.prone = p.dive = p.spin = p.inWater = p.onGround = false; p.support = null;
    p.vx = h * 120; p.vy = v * 100;
    const oldX=p.x,oldY=p.y;
    p.x = Math.max((isSiege()?0:G.camX) + 14, Math.min(p.x + p.vx * DT, G.stage === 3 ? W - 14 : xMax(22)));
    p.y = Math.max(G.camY + 44, Math.min(p.y + p.vy * DT, G.camY + 166));
    if(G.stage===6)collideStageSixGalleryHelicopter(p,oldX,oldY);
    if(G.stage===7){
      wallCollide(p,oldX,12);
      for(const s of solids){
        if(!s.solid||s.gone||p.x+12<=s.x||p.x-12>=s.x+s.w)continue;
        if(!s.oneWayTop&&oldY-16>=s.y+s.h&&p.y-16<s.y+s.h)p.y=s.y+s.h+16;
        if(oldY+4<=s.y&&p.y+4>s.y)p.y=s.y-4;
      }
    }
    p.anim += DT * 10;
  } else {
    p.prone = !changed && p.onGround && !p.inWater && !moto && v > 0 && h === 0 && !(isCelestial()&&(p.staff?.airCleave||p.staff?.command||p.staffCharge?.active));
    p.dive = p.inWater && v > 0 && h === 0;
    const tvx = recoiling?p.knockVX:(p.prone || p.dive) ? 0 : changed?transformationSpeed(p,h):h * (moto ? 170 : RUN * (p.magnetT > 0 ? 1.25 : 1));
    // stage 5 ice: speed changes slowly, so you keep sliding after letting go (and in the air after leaving ice)
    const slick = G.stage === 5 && !moto && !(p.cleatT > 0) && (p.onGround ? !!(p.support && p.support.ice) : p.iceAir);
    if (slick) { p.vx += (tvx - p.vx) * Math.min(1, (p.onGround ? 1.7 : 4.5) * DT); if (!tvx && Math.abs(p.vx) < 2) p.vx = 0; }
    else p.vx = tvx;
    p.skid = slick && p.onGround && Math.abs(p.vx) > 8 && (!h || Math.sign(h) !== Math.sign(p.vx));
    if (p.skid && G.t % 5 === 0) G.fx.push({ k: 'puff', x: p.x - Math.sign(p.vx) * 4, y: p.y - 1, vx: -Math.sign(p.vx) * 24, vy: -12, t: 0, life: 0.3 });
    if (p.dropT > 0) p.dropT -= DT;
    p.coyote = p.onGround ? 4 / 60 : p.coyote - DT;
    if (I.jumpEdge && !p.dive) {
      if (p.onGround || p.coyote > 0) {
        if (v > 0 && p.onGround && p.support && !p.support.g && !p.support.solid) { p.dropT = 0.22; p.onGround = false; p.y += 1; p.vy = 30; }
        else { p.vy = -(moto ? 300 : giant ? 320 : JUMPV); p.spin = !moto && !giant; p.onGround = false; p.coyote = 0; p.prone = false; p.airJumps = 1; sfx.jump(); }
      } else if (p.airJumps > 0) {
        // double jump: one extra jump per airtime, also after walking off an edge
        p.airJumps--; p.vy = -(moto ? 260 : JUMPV2); p.spin = !moto && !giant; sfx.jump2(); if(!moto)puff(p.x, p.y);
      }
    }
    const hw = giant ? 8 : moto ? 10 : 5;
    const x0 = p.x; p.x += p.vx * DT;
    if (G.stage === 5 && G.s5 && !(p.cleatT > 0) && !moto) p.x += G.s5.wind * DT; // blizzard headwind
    if (p.onGround && p.support && p.support.conv && !(p.magnetT > 0)) p.x += p.support.conv * DT; // conveyor belt
    wallCollide(p, x0, hw);
    p.x = Math.max((isSiege()?0:G.camX) + 6, Math.min(p.x, G.stage === 3 ? W - 6 : xMax(10)));
    p.vy = Math.min(p.vy + GRAV * DT, MAXFALL);
    const b0 = p.y,headOffset=p.y-(pBox(p)?.y??p.y-28); p.y += p.vy * DT;
    if((G.stage===1||G.stage===7)&&!WUKONG&&p.vy<0){
      for(const s of solids){
        if(!s.solid||s.oneWayTop||s.gone||p.x+hw<=s.x||p.x-hw>=s.x+s.w)continue;
        const underside=s.y+s.h;
        if(b0-headOffset>=underside-.001&&p.y-headOffset<underside){p.y=underside+headOffset;p.vy=0;}
      }
    }
    p.onGround = false; p.support = null;
    if (p.vy >= 0) {
      const s = findLand(p.x, b0, p.y, hw, p.dropT > 0);
      if (s) { p.y = s.y; p.vy = 0; p.onGround = true; p.support = s; p.airJumps = 1; p.iceAir = !!s.ice; if (p.spin) p.spin = false; }
    }
    const wet = p.onGround && !!p.support.water;
    if (wet && !p.wet) splash(p.x);
    p.wet = wet;
    p.inWater = wet && !giant;
    if (moto && wet) { dismount(false); banner('摩托车沉入水中', 1.2); }
    if (p.inWater) p.prone = false; else p.dive = false;
    if (p.y > G.camY + 232) { killPlayer(true); return; }
    if (p.onGround && p.vx) p.anim += DT * (moto ? 20 : 10); else if (p.spin) p.anim += DT * 16; else p.anim = moto ? p.anim : 0;
  }

  if(!WUKONG&&G.stage===7&&!p.cart&&boardMinecart(p,G.en,previousFoot))banner('矿车搭乘 · 按下伏低 · 跳跃离车',1.6);
  if(!WUKONG){
    const dust=advanceMotorcycle(p,DT),launch=motoContact&&moto&&I.jumpEdge&&!p.onGround&&Math.abs(p.vx)>50;
    if(dust||launch)G.fx.push(motorcycleDust(p,G.t,dust?{snow:G.stage===5}:motoContact));
  }
  // aim
  let ax, ay;
  if(isMinecartRider(p)){if(v<0&&!p.cartDuck){ax=h;ay=-1;}else{ax=h||p.face;ay=0;}}
  else if (heli || p.spin || G.uw) { if (h === 0 && v === 0) { ax = p.face; ay = 0; } else { ax = h; ay = v; } }
  else if (moto) { ax = p.face; ay = v < 0 ? -1 : 0; }
  else if (p.inWater) { if (v < 0) { ax = h; ay = -1; } else { ax = h || p.face; ay = 0; } }
  else if (v < 0) { ax = h; ay = -1; }
  else if (v > 0) { if (h) { ax = h; ay = 1; } else { ax = p.face; ay = 0; } }
  else { ax = h || p.face; ay = 0; }
  const len = Math.hypot(ax, ay) || 1; p.ax = ax / len; p.ay = ay / len;
  if (G.subMode) { p.ax = p.face; p.ay = 0; } // the sub's cannon only fires forward

  if (isCelestial()) {
    if(!changed)advanceStaff(p, I, DT, {
      playerActions:true,autofire:SET.autofire==='on',random:rnd,onCharge:phase=>{sfx.charge(phase);if(phase==='start')queueHeroSounds(G,p,'charge');},onRelease:()=>queueHeroSounds(G,p,'qi'),
      onSlamLand:()=>{
        const q=staffGeometry(p),u=(p.y-q.origin.y)/(q.tip.y-q.origin.y||1);
        const x=q.tip.y>=p.y&&u>=0&&u<=1?q.origin.x+(q.tip.x-q.origin.x)*u:p.x;
        G.fx.push({k:'slamLand',x,y:p.y,t:0,life:.35,size:p.giantT>0?2:1});shake(1.8);queueHeroSounds(G,p,'land');
      },
      onSwing:()=>queueHeroSounds(G,p)
    });
    if (I.cycEdge && G.inv.length > 1) { G.sel = (G.sel + 1) % G.inv.length; sfx.hit(); }
    if (I.grenEdge) useSpecial();
    return;
  }
  // fire
  p.cool -= DT;
  if (I.fireEdge) p.wantFire = true;
  const trigger = SET.autofire === 'on' ? I.fire : p.wantFire;
  if (trigger && p.cool <= 0 && !p.dive) {
    p.wantFire = false;
    const w = WEAP[p.weapon];
    if (p.weapon === 'laser') for (const b of G.pb) if (b.k === 'laser' && (b.owner || 1) === p.pid) b.dead = true; // each player has their own beam
    const live = G.pb.filter(b => !b.dead && !b.drone && !b.heliMissile && (b.owner || 1) === p.pid).length;
    if (live + w.per <= w.max) {
      let ox, oy;
      if (G.subMode) { ox = p.x + p.face * 15; oy = p.y + 2; }
      else if (G.uw) { ox = p.x + p.ax * 13; oy = p.y - 1 + p.ay * 7; }
      else if (heli) { ox = p.x + p.ax * 14; oy = p.y - 6 + p.ay * 8; }
      else if (moto) { const muzzle=motorcycleMuzzle(p);ox=muzzle.x;oy=muzzle.y; }
      else if(isMinecartRider(p)){const muzzle=minecartMuzzle(p);ox=muzzle.x;oy=muzzle.y;}
      else if (p.inWater) { ox = p.x + p.ax * 10; oy = WATER.surf - 7 + p.ay * 8; }
      else if (p.spin) { ox = p.x + p.ax * 9; oy = p.y - 15 + p.ay * 9; }
      else if (p.prone) { ox = p.x + p.face * 15; oy = p.y - 4; }
      else if (p.ay < -0.9) { ox = p.x + p.face * 2; oy = p.y - 36; }
      else { ox = p.x + p.ax * 13; oy = p.y - 20 + p.ay * 11; }
      if (giant) { ox = p.x + (ox - p.x) * 2; oy = p.y + (oy - p.y) * 2; }
      const dm = giant ? 2 : 1;
      const spd = w.spd * (p.rapid ? 1.4 : 1) * (G.uw ? 0.8 : 1), base = Math.atan2(p.ay, p.ax);
      const vx = Math.cos(base) * spd, vy = Math.sin(base) * spd;
      if (p.weapon === 'spread') { for (const d of [-0.36, -0.18, 0, 0.18, 0.36]) G.pb.push({ k: 'sp', x: ox, y: oy, vx: Math.cos(base + d) * spd, vy: Math.sin(base + d) * spd, dmg: dm }); }
      else if (p.weapon === 'laser') { G.pb.push({ k: 'laser', x: ox, y: oy, vx, vy, dmg: 2 * dm, hits: new Set() }); }
      else if (p.weapon === 'fire') { G.pb.push({ k: 'fire', x: ox, y: oy, cx: ox, cy: oy, vx, vy, t: 0, dir: p.face, dmg: 2 * dm }); }
      else if (p.weapon === 'homing') { G.pb.push({ k: 'msl', x: ox, y: oy, ang: base, spd, life: 2.4, dmg: 2 * dm }); }
      else { G.pb.push({ k: 'b', x: ox, y: oy, vx, vy, dmg: dm }); }
      p.cool = w.cd * (p.rapid ? 0.7 : 1); p.flashT = 0.05; p.fx = ox; p.fy = oy;
      playerGunshot(p);
    }
  }
  // special items
  if (I.cycEdge && G.inv.length > 1) { G.sel = (G.sel + 1) % G.inv.length; sfx.hit(); }
  if (I.grenEdge) useSpecial();
}
function grappleTarget() {
  // nearest ledge above the player that the hook can catch
  const p = G.p; let best = null;
  for (const s2 of solids) if (s2.y < p.y - 10 && s2.y > p.y - 140 && p.x >= s2.x - 6 && p.x <= s2.x + s2.w + 6 && (!best || s2.y > best.y)) best = s2;
  return best;
}
function riotBlock() {
  // the riot shield soaks one hit
  const p = G.p;
  if (!(p.riot > 0) || p.invT > 0) return false;
  p.riot--; sfx.hit(); shake(1);
  if (!p.riot) banner('防爆盾损坏', 1);
  return true;
}
function pickItem(kind) {
  const p = G.p;
  if(!WUKONG&&kind==='life'){
    G.lives++;sfx.pick();banner('生命奖励 · 增加一条命',1.8);
    G.fx.push({k:'lifeUp',x:p.x,y:p.y-30,t:0,life:1});return;
  }
  // The old ultimate pickup is now a summon; only the dedicated ultimate uses rage.
  if(isCelestial()&&kind==='g')kind='clone';
  if(isCelestial()&&HEALING_ITEMS[kind]){
    const gained=healHero(p,kind);sfx.heal();addScore(200);
    G.fx.push({k:'combatNumber',x:p.x,y:p.y-34,text:gained?'+'+gained:'已满血',heal:true,t:0,life:.85});
    G.fx.push({k:'healing',x:p.x,y:p.y-14,t:0,life:.7});
    banner(HEALING_ITEMS[kind].name+(gained?' · 生命 +'+gained:' · 生命已满'),1.5);return;
  }
  sfx.pick(); addScore(200); banner(ITEM_NAMES[kind], 1);
  if (kind === 'M') p.weapon = 'machine';
  else if (kind === 'S') p.weapon = 'spread';
  else if (kind === 'L') p.weapon = 'laser';
  else if (kind === 'F') p.weapon = 'fire';
  else if (kind === 'H') p.weapon = 'homing';
  else if (kind === 'R') p.rapid = true;
  else if (kind === 'B') p.shieldT = 10;
  else if (kind in SPECIALS) addSpecial(kind);
  if(isCelestial()&&STAFF_PICKUPS[kind])banner(STAFF_PICKUPS[kind],2.2);
}
function addSpecial(k) {
  if (G.inv.length >= INV_MAX) { G.inv.shift(); if (G.sel > 0) G.sel--; } // full: the oldest one makes room
  G.inv.push(k);
  banner('获得 ' + SPECIALS[k] + (STAGE_ONLY[k] ? '（本关限定）' : ''), 1.3);
}
function useSpecial() {
  const p = G.p;
  if (p.dead || p.dive || p.spCd > 0) return;
  if(isCelestial()&&transformation(p)){
    if(cycleTransformation(p)){p.spCd=.15;puff(p.x,p.y-14);sfx.grow();banner('七十二变 · '+TRANSFORM_FORMS[transformation(p).form].name+' · J '+TRANSFORM_FORMS[transformation(p).form].skill,1.1);}return;
  }
  if (!G.inv.length) { banner('没有特殊道具', 0.8); return; }
  const k = isCelestial()&&G.inv[G.sel]==='g'?'clone':G.inv[G.sel];
  if(WUKONG&&WUKONG_MAGIC[k]&&!isCelestial()){banner('仙术道具只在天宫关使用',1);return;}
  if ((k === 'm' || k === 'h') && isBase()) { banner('这里用不了载具', 1); return; }
  if ((k === 'm' || k === 'h' || k === 'u') && G.uw) { banner('水下用不了这个道具', 1); return; }
  if ((k === 'm' || k === 'h') && (p.ride || p.giantT > 0)) { banner(p.ride ? '已在载具上' : '变大时不能乘坐', 1); return; }
  if (k === 'u' && p.ride) { banner('乘坐载具时不能变大', 1); return; }
  let hookTo = null;
  if (k === 'k') {
    if (p.ride) { banner('乘坐载具时不能用钩爪', 1); return; }
    hookTo = grappleTarget();
    if (!hookTo) { banner('头顶没有可抓的岩架', 1); return; }
  }
  if (k === 'm' && p.inWater) { banner('水里不能骑摩托车', 1); return; }
  G.inv.splice(G.sel, 1);
  if (G.sel >= G.inv.length) G.sel = Math.max(0, G.inv.length - 1);
  p.spCd = k==='transform'?.6:SP_CD;
  if(isCelestial()&&WUKONG_MAGIC[k]){
    activateWukongMagic(p,k,solids);sfx.grow();puff(p.x,p.y-14);banner(WUKONG_MAGIC[k].description,2.2);return;
  }
  if (k === 'g') throwGrenade();
  else if (k === 'f') { G.flashT = 0.35; G.freezeT = 5; for (const b of G.eb) b.dead = true; sfx.flash(); banner('敌人冻结 5 秒', 1.2); }
  else if (k === 'm') { p.ride = 'moto'; p.rideT = 15;p.motoPitch=0;p.motoDustClock=0; p.spin = false; p.prone = false; sfx.mount(); banner('摩托车 15 秒', 1.2); }
  else if (k === 'h') { p.ride = 'heli'; p.rideT = 12; p.spin = false; p.prone = false; p.inWater = false; p.y = Math.min(p.y - 24, 150); sfx.mount(); banner('直升机 12 秒', 1.2); }
  else if (k === 'u') { startGiant(p); sfx.grow(); puff(p.x, p.y); banner('巨大化 15 秒 · 前 2 秒免疫 · 护甲 3 次', 1.8); }
  else if (k === 'c') { p.camoT = 8; sfx.mount(); banner('迷彩 8 秒：炮台和狙击兵看不见你', 1.4); }
  else if (k === 't') { G.gr.push({ tnt: true, x: p.x + p.face * 4, y: p.ride === 'heli' ? p.y + 6 : p.y, vx: 0, vy: 0, fuse: 1.6, a: 0, rest: false }); sfx.toss(); banner('炸药包 1.6 秒后爆炸', 1.2); }
  else if (k === 'e') { G.empT = 6; G.flashT = 0.12; sfx.flash(); banner('电磁脉冲 6 秒：炮台瘫痪', 1.4); }
  else if (k === 'd') { p.riot = 3; sfx.mount(); banner('防爆盾：可挡 3 次', 1.2); }
  else if (k === 'k') { p.hook = { x: p.x, y: hookTo.y }; p.vy = -Math.sqrt(2 * GRAV * (p.y - hookTo.y + 12)); p.onGround = false; p.spin = false; p.prone = false; p.dropT = 0; p.airJumps = 1; sfx.jump2(); }
  else if (k === 'j') { p.helmT = 15; sfx.mount(); banner('防落石头盔 15 秒', 1.2); }
  else if (k === 'o') { G.decoyT = 6; G.decoyX = p.x; sfx.flash(); banner('全息诱饵 6 秒：敌人改打诱饵', 1.4); }
  else if (k === 'n') { G.sweepT = 8; sfx.mount(); banner('磁暴扫雷 8 秒', 1.2); }
  else if (k === 'i') { p.cleatT = 20; sfx.mount(); banner('防滑冰爪 20 秒：冰面不打滑，狂风吹不动', 1.4); }
  else if (k === 'N') { if (G.momm && G.mom.phase === 'drill') { G.mom.drill.shieldT = 15; G.mom.drill.hp = Math.min(100, G.mom.drill.hp + 30); banner('钻机护盾 15 秒：钻机不会受到伤害', 1.4); } else { p.shieldT = 10; banner('护盾 10 秒', 1.2); } sfx.mount(); }
  else if (k === 'Q') { if (G.momm) { G.mom.sentries.push({ x: p.x, y: p.y, t: 20, cd: 0, ang: 0 }); banner('自动哨炮 20 秒：自动射击最近的敌人', 1.4); } sfx.mount(); }
  else if (k === 'G') { if (G.liftm) lBlast(p.x, p.y - 12, true); else throwGrenade(); }
  else if (k === 'W') { p.warmT = 15; sfx.mount(); banner('暖流护罩 15 秒：冰锥和冰弹碰到你就会融化', 1.4); }
  else if (k === 'K') { p.insulT = 15; sfx.mount(); banner('绝缘服 15 秒：带电的水伤不到你', 1.4); }
  else if (k === 'T') { if (G.fortm) { const c = fComp(p.x); if (c.pump && !c.moving) { fToggle(c); banner('遥控阀门：本舱' + (c.target === F_WET ? '开始注水' : '开始排水'), 1.4); } else banner('这里没有可遥控的阀门', 1.2); } sfx.mount(); }
  else if (k === 'E') { if (G.td) { G.td.flares.push({ x: p.x + Math.cos(p.aim) * 26, y: p.y + Math.sin(p.aim) * 26, t: 15 }); } sfx.toss(); banner('照明弹 15 秒：照亮一大片，猎手不敢靠近', 1.4); }
  else if (k === 'P') { p.glowT = 15; sfx.mount(); banner('荧光服 15 秒：全身发光照亮四周', 1.4); }
  else if (k === 'C') { p.vortexT = 6; sfx.mount(); banner('涡流推进器 6 秒：撞不坏，撞到东西直接冲碎', 1.4); }
  else if (k === 'D') { if (G.rl) G.rl.slowT = 8; sfx.flash(); banner('时缓水泡 8 秒：洋流变慢一半', 1.4); }
  else if (k === 'r') { if (G.sea) G.sea.heat = 0; p.coolT = 12; sfx.flash(); banner('冷却剂：热度清零，12 秒不升温', 1.4); }
  else if (k === 'A') { p.boostT = 8; sfx.mount(); banner('增压推进器 8 秒：高速，撞到敌人直接撞毁', 1.4); }
  else if (k === 'q') { if (G.sea) G.sea.pockets.push({ x: p.x - 22, y: p.y - 22, w: 44, h: 34, life: 15 }); sfx.mount(); banner('便携气囊 15 秒：在气囊里可以补氧', 1.4); }
  else if (k === 's') {
    if (G.ghost && G.ghost.active && !G.ghost.dead) G.ghost.lock = 6;
    for (const e of G.en) if (e.t === 'eel') { e.stun = 6; e.st = 'hide'; }
    G.fx.push({ k: 'ring', x: p.x, y: p.y, t: 0, life: 0.6 }); sfx.flash(); banner('声呐 6 秒：幽灵潜艇无法隐身，海鳗被震晕', 1.4);
  }
  else if (k === 'b') { if (G.sea) G.sea.o2 = 1; p.o2T = 20; sfx.mount(); banner('压缩氧气瓶：氧气回满，20 秒不消耗', 1.4); }
  else if (k === 'l') { for (const d of [-0.35, 0, 0.35]) G.pb.push({ k: 'msl', drone: true, x: p.x + p.face * 10, y: p.y, ang: (p.face > 0 ? 0 : Math.PI) + d, spd: 120, life: 3, dmg: 4 }); sfx.msl(); banner('鱼雷齐射', 1); }
  else if (k === 'p') {
    for (const e of G.en) if (!e.dead && (e.t === 'run' || e.t === 'larva' || e.t==='guardianFlyer' || e.t==='whiteFloater' || e.t==='ceilingStalker' || e.t==='hiveHatchling') && onScreen(e.x, 0)) killEnemy(e);
    for (const b of G.eb) b.dead = true; if (G.s8) G.s8.drops.length = 0;
    G.freezeT = Math.max(G.freezeT, 3); G.fx.push({ k: 'ring', x: p.x, y: p.y - 14, t: 0, life: 0.6 }); sfx.flash(); banner('声波脉冲：小型异形全灭，其余眩晕 3 秒', 1.4);
  }
  else if (k === 'z') { p.acidT = 15; sfx.mount(); banner('抗酸护甲 15 秒：酸液和爬虫伤不到你', 1.4); }
  else if (k === 'y') { p.magnetT = 15; sfx.mount(); banner('磁力靴 15 秒：传送带拖不动你，跑得更快', 1.4); }
  else if (k === 'a') { p.droneT = 12; p.droneCd = 0.4;p.dx2=p.x-p.face*12;p.dy2=p.y-44;p.droneAim=p.face>0?0:Math.PI;p.droneFace=p.face;p.droneShotT=0; sfx.mount(); banner('护卫无人机 12 秒：自动射击附近的敌人', 1.4); }
  else if (k === 'x') { p.fireproofT = 15; sfx.mount(); banner('防火服 15 秒：喷火和火浪伤不到你', 1.4); }
  else if (k === 'w') { if (G.s6) { G.s6.coolT = 8; for (const w2 of G.s6.waves) { w2.dead = true; puff(w2.x, 172); } } G.flashT = 0.15; sfx.flash(); banner('液氮罐 8 秒：所有喷火口熄火', 1.4); }
  else if (k === 'v') { p.thermT = 15; sfx.flash(); banner('热成像镜 15 秒：暴风雪中看清敌人', 1.4); }
}
function requestNade() {
  const p=G.p;
  if(p.dead||p.enteringExit||p.exitEntered||(isBase()&&(G.base.trans>0||G.base.dead)))return false;
  if (isCelestial()) {
    if(!rageReady(p)){banner('怒气不足 · 受击积攒怒气 '+Math.floor(p.rage||0)+'/'+WUKONG_RAGE.max,.9);tone(180,.06,'triangle',.035,140);return false;}
    if(startUltimate(p,rnd)){
      const move=ultimateSpec(p.staff);tone(move.id==='pillar'?110:move.id==='qi'?420:160,.4,'triangle',.12,65);noise(.22,.14,500);
      queueHeroSounds(G,p,'ultimate');
      banner(move.name+' · 怒气释放',1.3);shake(1.8);return true;
    }
    return false;
  }
  if(G.nadeCd>0){tone(180,.05,'square',.03,150);return false;}
  G.nadeCd=nadeCooldown();throwGrenade();return true;
}
function throwGrenade() {
  const p = G.p;
  if (!WUKONG && p.ride === 'heli') {
    G.pb.push({ k:'msl', heliMissile:true, owner:p.pid||1, x:p.x+p.face*16, y:p.y+5,
      ang:p.face>0?.12:Math.PI-.12, spd:150, life:2.4, dmg:16 });
    sfx.msl(); return;
  }
  if (G.rail) { railBlast(); return; }
  if (G.momm) { const up = p.ay < 0, dn = p.ay > 0 && !p.onGround; G.mom.nades.push({ x: p.x + p.face * 6, y: p.y - 18, vx: dn ? p.face * 20 : up ? p.face * 60 : p.face * 160 + p.vx * 0.3, vy: dn ? 80 : up ? -330 : -170, t: 0 }); sfx.toss(); return; }
  if (G.liftm) { const dn = p.ay > 0 && !p.ax, up = p.ay < 0; G.lift.nades.push({ x: p.x + p.face * 6, y: p.y - 18, vx: dn ? 0 : up ? p.face * 60 : p.face * 160, vy: dn ? 60 : up ? -330 : -170, t: 0 }); sfx.toss(); return; }
  if (G.fortm) { const w = p.swim, up = p.ay < 0 && !w; G.fort.nades.push({ x: p.x + p.face * 6, y: p.y - (w ? 11 : 18), vx: w ? (p.ax || p.face) * 150 : up ? p.face * 60 : p.face * 170 + p.vx * 0.3, vy: w ? (p.ay || 0) * 150 : up ? -330 : -150, t: 0 }); sfx.toss(); return; }
  if (G.tdm) { G.td.nades.push({ x: p.x + Math.cos(p.aim) * 8, y: p.y + Math.sin(p.aim) * 8, vx: Math.cos(p.aim) * 210 + p.vx * 0.5, vy: Math.sin(p.aim) * 210 + p.vy * 0.5, t: 0 }); sfx.toss(); return; }
  if (G.uw) { G.gr.push({ x: p.x + p.face * 10, y: p.y, vx: p.face * 150 + p.vx * 0.3, vy: p.ay * 120, fuse: 1.2, a: 0, uw: true }); sfx.toss(); return; }
  if (isBase()) {
    G.gr.push({ base: true, t: 0, x0: p.x, y0: p.y - 30, x: p.x, y: p.y - 30, xe: 192 + (p.x - 192) * 0.5 + (p.aimDx || 0) * 60, ye: baseShotHeight(p, G.stage,!!G.base.def.boss,G.base.bossPhase), a: 0 });
    sfx.toss(); return;
  }
  const up = p.ay < -0.5;
  const gx = p.x + p.face * (p.giantT > 0 ? 12 : 6);
  const gy = isMinecartRider(p)?minecartMuzzle(p).y:p.ride === 'heli' ? p.y : p.giantT > 0 ? p.y - 52 : p.inWater ? WATER.surf - 10 : p.prone ? p.y - 6 : p.spin ? p.y - 16 : p.y - 26;
  const vx = up ? p.face * 70 : p.face * 165 + p.vx * 0.4, vy = up ? -300 : p.prone ? -120 : p.ride === 'heli' ? 40 : -200;
  G.gr.push({ x: gx, y: gy, vx, vy, fuse: 1.6, a: 0 });
  sfx.toss();
}

// ================= enemies =================
function runner(x, y, dir) { return { t: 'run', x, y, vx: dir * 62, vy: 0, hp: isCelestial()?HEAVEN_HP.run:1, ...(isCelestial()?{maxHp:HEAVEN_HP.run}:{}), ...(!WUKONG&&G.stage===6?{fireT:.45+rnd()*.35}:{}), on: false, sup: null, dec: false, anim: rnd() * 4, flash: 0 }; }
const onScreen = (x, m) => x > G.camX - m && x < G.camX + W + m;
const inViewY = y => y > G.camY + 4 && y < G.camY + H + 24;
function ebox(e) {
  if(e.t==='fortressSaucer')return fortressSaucerBox(e);
  if(e.t==='hiveHatchling')return hiveHatchlingBox(e);
  if(e.t==='ceilingStalker')return ceilingStalkerBox(e);
  if(e.t==='ceilingParasite')return ceilingParasiteBox(e);
  if(e.t==='whiteFloater')return whiteFloaterBox(e);
  if(e.t==='guardianFlyer')return guardianFlyerBox(e);
  if(e.t==='spikeWall')return hangarPlateBox(e);
  if(e.roofGuard)return roofGuardBox(e);
  if(e.t==='waterAmbush')return {x:e.x-8,y:e.y-32,w:16,h:32};
  if(G.stage===6&&e.t==='heavyGunner')return stageSixGunnerBox(e);
  const defender=G.stage===5?snowDefenderBox(e):null;if(defender)return defender;
  if (e.t === 'fish') return { x: e.x - 6, y: e.y - 4, w: 12, h: 8 };
  if (e.t === 'tur' && G.uw) return { x: e.x - 8, y: e.y - 8, w: 16, h: 16 };
  if (e.t === 'valve') return { x: e.x - 7, y: e.y - 7, w: 14, h: 14 };
  if (e.t === 'beam') return e.rock ? { x: e.x - 6, y: e.y - 4, w: 12, h: 16 } : { x: e.x - 14, y: e.y - 3, w: 28, h: 6 };
  if (e.t === 'eel') { const hx = e.x + e.dir * e.out * e.reach; return { x: Math.min(e.x, hx) - 3, y: e.y - 4, w: Math.abs(hx - e.x) + 6, h: 8 }; }
  if (e.t === 'diver') return { x: e.x - 10, y: e.y - 6, w: 20, h: 11 };
  if (e.t === 'mine') return { x: e.x - 7, y: e.y - 7, w: 14, h: 14 };
  if (e.t === 'jelly') return { x: e.x - 8, y: e.y - 8, w: 16, h: 15 };
  if (e.t === 'msub') return { x: e.x - 17, y: e.y - 8, w: 34, h: 15 };
  if (e.t === 'boat') return { x: e.x - 20, y: e.y - 8, w: 40, h: 10 };
  if (e.t === 'larva') return { x: e.x - 5, y: e.y - 8, w: 10, h: 8 };
  if (e.t === 'sac') return { x: e.x - 11, y: e.y - 21, w: 22, h: 21 };
  if (e.t === 'alienHead') return alienGuardianBox(e);
  if (G.stage === 8 && e.t === 'run') return { x: e.x - 8, y: e.y - 20, w: 16, h: 20 };
  if (G.stage === 8 && (e.t==='tur'||e.t==='snp')) {
    const body=StageSevenArt.spitterBounds(e);
    return {x:body.x+3,y:body.y+2,w:body.w-6,h:body.h-2};
  }
  if (e.t === 'tur') return { x: e.x - 8, y: e.y - 8, w: 16, h: 24 };
  if (e.t === 'cart') return { x: e.x - 11, y: e.y - 22, w: 22, h: 22 };
  if (e.t === 'rock') return { x: e.x - e.r, y: e.y - 2 * e.r, w: 2 * e.r, h: 2 * e.r };
  if (e.t === 'box') return e.open || G.stage === 1 ? { x: e.x - 9, y: e.y - 24, w: 18, h: 24 } : { x: e.x - 10, y: e.y - 12, w: 20, h: 12 };
  return { x: e.x - 5, y: e.y - 26, w: 10, h: 26 };
}
function ebullet(x, y, vx, vy, g, r) { const k = SET.diff === 'easy' ? 0.8 : 1, bullet = { x, y, vx: vx * k, vy: vy * k, g: (g || 0) * k * k, r: r || 2 }; G.eb.push(bullet); return bullet; }
function aimAtPlayer(x, y) { const p = players().filter(q => !q.dead).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0] || G.p; return Math.atan2((p.inWater ? WATER.surf - 6 : G.uw ? p.y : p.y - 16) - y, p.x - x); }
const stageOneTarget = x => players().filter(q => !q.dead && !(q.camoT > 0) && !q.enteringExit && !q.exitEntered && pBox(q))
  .sort((a,b) => Math.abs(a.x-x)-Math.abs(b.x-x))[0];

function runnerAttack(e) {
  if (G.stage !== 1 && G.stage !== 3 && G.stage !== 6 && G.stage !== 7) return false;
  if(WUKONG){if(e.hitStun>0)return true;return advanceGuard(e,stageOneTarget(e.x),DT,{active:!G.boss.dead&&!!e.on&&onScreen(e.x,-14)&&inViewY(e.y),onAttack:()=>noise(.05,.025,700)});}
  if (e.shotFlash > 0) e.shotFlash = Math.max(0, e.shotFlash - DT);
  const target = stageOneTarget(e.x);
  if (e.dead || e.hp <= 0 || G.boss.dead || (G.stage===6&&G.golem?.dead) || !e.on || !onScreen(e.x, -14) || !inViewY(e.y) || !target || Math.abs(target.x - e.x) > 240 || Math.abs(target.x - e.x) < (G.stage===6?22:28) || Math.abs(target.y - e.y) > 100) {
    e.attack = null; e.ay = 0; return false;
  }
  if (!e.attack) {
    e.fireT = (e.fireT ?? (1.4 + rnd())) - DT;
    if (e.fireT > 0) return false;
    e.attack = { phase: 'aim', t: .32 };
  }
  if (e.attack.phase === 'aim') {
    e.fireFace = target.x < e.x ? -1 : 1; e.ay = 0;
    e.shotX = e.x + e.fireFace * 18; e.shotY = e.y - 21;
    e.shotAngle = e.fireFace < 0 ? Math.PI : 0;
  }
  e.attack.t -= DT;
  if (e.attack.t > 0) return true;
  if (e.attack.phase === 'recover') {
    e.attack = null; e.ay = 0; e.fireT = G.stage===6?1.7+rnd()*.5:3+rnd(); return false;
  }
  // One level shot after the visible warning; jumping can clear its fixed height.
  const bullet = ebullet(e.shotX, e.shotY, e.fireFace * 118, 0);
  bullet.from = 'runner'; e.shotFlash = .075; sfx.eshot();
  e.attack = { phase: 'recover', t: .18 };
  return true;
}
function updateEnemies() {
  const p = G.p, horizontal = G.stage === 1 || G.stage === 3;
  if (G.freezeT <= 0) { // frozen by a flash grenade: no spawns, no AI
  if(WUKONG&&G.stage===1&&!G.boss.dead)for(const trigger of G.wukongFlights||[])if(!trigger.done&&G.camX>=trigger.at){trigger.done=true;G.en.push(flyingGuard(G.camX+W-32));}
  // spawner
  if(!isSiege())G.spawnT -= DT;
  if (G.spawnT <= 0) {
    G.spawnT = 1.3 + rnd() * 1.6;
    if (G.stage !== 3 && G.stage !== 7 && !G.uw && G.camX < CAM_MAX - 80 && !(G.stage===5&&G.fortress?.active) && G.en.filter(e => e.t === 'run').length < 4) {
      const left = rnd() < 0.2 && G.camX > 60;
      const sx = left ? G.camX - 10 : G.camX + W + 10, s = groundAt(sx);
      if (s && !s.water && (G.stage!==6||stageSixRunnerSpawnSafe(sx,s.y,G.jets,G.time,G.s6.coolT))) G.en.push(runner(sx, s.y, left ? 1 : -1));
    }
  }
  for (const e of G.en) {
    if (e.flash > 0) e.flash -= DT;
    if(e.t==='fortressSaucer'){
      advanceFortressSaucer(e,stageOneTarget(e.x),DT,G.camX);continue;
    }
    if(e.t==='spikeWall'){
      if(players().some(p=>!p.dead&&p.x>e.x-HANGAR_PLATE.triggerRange)&&e.rise<1)e.rise=Math.min(1,e.rise+DT*HANGAR_PLATE.riseSpeed);
      continue;
    }
    if(e.t==='waterAmbush'){
      if(e.y>G.camY+H+45){e.dead=true;continue;}
      if(e.shotFlash>0)e.shotFlash=Math.max(0,e.shotFlash-DT);
      const target=stageOneTarget(e.x);
      // Wait until the full ascent is visible and a living player is nearby.
      if(G.mech?.active||!target||!onScreen(e.x,0)||e.y<G.camY+90||e.y>G.camY+H-8||Math.abs(target.y-e.y)>150)continue;
      if(e.warning>0){
        e.warning-=DT;
        if(e.warning<=0){
          const shot=ebullet(e.x+7,e.y-35,0,-180,240,2.8);
          shot.from='waterAmbush';shot.waterAmbush='rise';e.shotFlash=.12;e.fireT=3.4+rnd()*.6;sfx.eshot();
        }
      }else{e.fireT-=DT;if(e.fireT<=0)e.warning=.65;}
      continue;
    }
    if(e.roofGuard){
      const shot=advanceFortressRoofGuard(e,stageOneTarget(e.x),DT,{active:!G.boss.dead&&onScreen(e.x,-8)});
      if(shot){const b=ebullet(shot.x,shot.y,shot.vx,shot.vy);b.from='roof-guard';sfx.eshot();}
      continue;
    }
    if(e.t==='hiveHatchling'){
      advanceHiveHatchling(e,stageOneTarget(e.x),DT,G.camX);continue;
    }
    if(e.t==='ceilingStalker'){
      const event=advanceCeilingStalker(e,stageOneTarget(e.x),DT,{active:onScreen(e.x,-16)&&!G.hive?.dead,camera:G.camX,land:findLand,wall:wallCollide});
      if(event==='launch')sfx.jump();if(event==='land')puff(e.x,e.y+8.5);continue;
    }
    if(e.t==='ceilingParasite'){
      const target=stageOneTarget(e.x),active=!!target&&onScreen(e.x,20)&&Math.abs(target.x-e.x)<270&&!G.hive?.dead;
      const brood=advanceCeilingParasite(e,DT,G.en,{active});for(const child of brood){G.en.push(child);sfx.eshot();}
      continue;
    }
    if(e.t==='whiteFloater'){
      advanceWhiteFloater(e,stageOneTarget(e.x),DT,G.camX);continue;
    }
    if(e.t==='alienHead'){
      const target=stageOneTarget(e.x);
      if(!target||!onScreen(e.x,55)||Math.abs(target.x-e.x)>350)continue;
      if(!e.announced){e.announced=true;banner('洞穴守卫 · 跃上高台射击头部',2.5);}
      const brood=advanceGuardianSpit(e,DT,G.en,{active:true});
      for(const child of brood){G.en.push(child);sfx.eshot();}
      continue;
    }
    if(e.t==='guardianFlyer'){
      advanceGuardianFlyer(e,stageOneTarget(e.x),DT,G.camX);
      continue;
    }
    if(G.stage===6&&e.t==='heavyGunner'){
      if(e.x<G.camX-100){e.dead=true;continue;}
      const target=stageOneTarget(e.x),shot=advanceStageSixGunner(e,target,DT,{active:onScreen(e.x,24)&&inViewY(e.y)&&!!target&&Math.abs(target.x-e.x)<300});
      if(shot){const b=ebullet(shot.x,shot.y,shot.vx,shot.vy,0,shot.r);b.from=shot.from;sfx.eshot();}
      continue;
    }
    if(G.stage===5&&(e.t==='artillery'||e.t==='grenadier')){
      if(e.x<G.camX-100){e.dead=true;continue;}
      const target=stageOneTarget(e.x),shot=advanceSnowDefender(e,target,DT,{active:onScreen(e.x,24)&&inViewY(e.y)&&!!target&&Math.abs(target.x-e.x)<300});
      if(shot){
        const {vx,vy,g,r,...shape}=shot,projectile=ebullet(shot.x,shot.y,vx,vy,g,r);Object.assign(projectile,shape);
        if(e.t==='artillery'){sfx.boom();shake(.6);}else sfx.toss();puff(shot.x,shot.y);
      }
      continue;
    }
    if(isCelestial()&&advanceGuardRecoil(e,DT,{land:findLand,wall:wallCollide,clampX:x=>Math.max(6,Math.min(xMax(6),x)),gravity:GRAV}))continue;
    if(isCelestial()&&e.t==='fly'){
      if(e.x<G.camX-40){e.dead=true;continue;}
      if(onScreen(e.x,-8))advanceFlyingGuard(e,stageOneTarget(e.x),solids,DT);
      continue;
    }
    if (e.t === 'run') {
      if(G.stage===3&&e.waterfallEntry){
        // The offscreen approach continues the ledge at its original height until the feet reach it.
        e.x+=e.vx*DT;e.y=e.waterfallEntry.y;e.vy=0;e.on=true;e.anim+=DT*10;
        if(e.x>=8&&e.x<=W-8){e.sup=solids.find(s=>s.id===e.waterfallEntry.ledge);e.waterfallEntry=null;}
        if(e.y>G.camY+250)e.dead=true;
        continue;
      }
      const navigation=G.stage===6?navigateStageSixRunner(e,solids,G.jets,G.time,G.s6.coolT,DT):'move';
      let holding;
      if(navigation==='escape'){e.attack=null;e.ay=0;e.shotFlash=Math.max(0,(e.shotFlash||0)-DT);holding=false;}
      else {
        const attacking=runnerAttack(e);
        // Foundry soldiers keep walking while aiming, unless a flame requires
        // them to wait. A safe crossing must not cancel their firing timer.
        holding=navigation==='stop'||(G.stage!==6&&attacking);
      }
      if(isCelestial())holding=navigateGuard(e,stageOneTarget(e.x),solids,DT,{holding,gravity:GRAV,maxFall:MAXFALL,patrol:true})||holding;
      e.vy = Math.min(e.vy + GRAV * DT, MAXFALL);
      const x0 = e.x, want = e.x + (holding ? 0 : e.vx * DT); e.x = want; wallCollide(e, x0, 5);
      if (Math.abs(e.x - want) > 0.01) e.vx = -e.vx;
      const b0 = e.y; e.y += e.vy * DT; e.on = false;
      if (e.vy >= 0) { const s = findLand(e.x, b0, e.y, 4, false); if (s) { e.y = s.y; e.vy = 0; e.on = true; e.sup = s; } }
      if (e.on && e.sup.water) { if (onScreen(e.x, 0)) splash(e.x); e.dead = true; continue; }
      if (e.on && e.sup.conv) e.x += e.sup.conv * DT;
      if (e.on && !holding && G.stage!==6 && !(isCelestial())) {
        const ahead = e.x + Math.sign(e.vx) * 7;
        const footing = solids.some(o => !o.gone && o.y === e.sup.y && ahead >= o.x && ahead <= o.x + o.w);
        if (!footing) { if (!e.dec) { e.dec = true; if (rnd() < 0.55) { e.vy = -235; e.on = false; } } }
        else e.dec = false;
      }
      if (!holding) e.anim += DT * 10;
      if(G.stage===8&&!WUKONG)advanceAlienCrawler(e,x0);
      if (e.y > G.camY + 250 || e.x < G.camX - 40 || e.x > G.camX + W + 40) e.dead = true;
    } else if (e.t === 'snp') {
      if (e.x < G.camX - 40 || e.y > G.camY + H + 80) { e.dead = true; continue; }
      if (!onScreen(e.x, -6) || !inViewY(e.y)) continue;
      if(isCelestial()){advanceGuard(e,stageOneTarget(e.x),DT,{active:!G.boss.dead,onAttack:()=>noise(.05,.025,700)});continue;}
      const target = horizontal ? stageOneTarget(e.x) : p;
      const a = horizontal ? (target?.x < e.x ? Math.PI : 0) : aimAtPlayer(e.x, e.y - 20), q = Math.round(a / (Math.PI / 4)) * Math.PI / 4;
      e.ax = Math.cos(q); e.ay = Math.sin(q); e.face = e.ax < -0.1 ? -1 : e.ax > 0.1 ? 1 : e.face;
      if(horizontal){e.ax=e.face;e.ay=0;}
      e.fireT -= DT;
      if (e.fireT <= 0 && target && !target.dead && !(target.camoT > 0)) {
        e.fireT = horizontal ? 3.4 + rnd() : 1.8 + rnd() * 1.2;
        ebullet(e.x + e.ax * 11, e.y - 20 + e.ay * 11, horizontal?e.face*118:Math.cos(a)*118, horizontal?0:Math.sin(a)*118); sfx.eshot();
      }
    } else if (e.t === 'diver') {
      // frogman: swims in from the right and fires harpoons
      e.x += e.vx * DT; e.y += Math.sin(G.time * 2 + e.ph) * 22 * DT; e.anim += DT * 9;
      for (const s2 of solids) if (e.x + 9 > s2.x && e.x - 9 < s2.x + s2.w && e.y + 5 > s2.y && e.y - 7 < s2.y + s2.h) e.y = s2.y - 6;
      e.y = Math.max(SEA_SURF + 8, e.y);
      if (e.x < G.camX - 30) { e.dead = true; continue; }
      if (!onScreen(e.x, -8)) continue;
      e.fireT -= DT;
      if (e.fireT <= 0 && !p.dead) { e.fireT = 2 + rnd() * 1.2; const a2 = aimAtPlayer(e.x, e.y); ebullet(e.x + Math.cos(a2) * 10, e.y, Math.cos(a2) * 110, Math.sin(a2) * 110); sfx.eshot(); }
    } else if (e.t === 'eel') {
      // moray eel in a porthole: its eyes glow, then it lunges out and pulls back
      if (e.x < G.camX - 60) { e.dead = true; continue; }
      if (e.stun > 0) { e.stun -= DT; e.out = Math.max(0, e.out - DT * 3); continue; }
      e.cd -= DT;
      const side = (p.x - e.x) * e.dir;
      if (e.st === 'hide') { if (e.cd <= 0 && !p.dead && side > 0 && side < 80 && Math.abs(p.y - e.y) < 30) { e.st = 'warn'; e.stT = 0.5; } }
      else if (e.st === 'warn') { e.stT -= DT; if (e.stT <= 0) { e.st = 'out'; e.stT = 0.75; tone(200, 0.15, 'sawtooth', 0.06, 120); } }
      else if (e.st === 'out') { e.stT -= DT; e.out = Math.min(1, e.out + DT / 0.15); if (e.stT <= 0) e.st = 'back'; }
      else if (e.st === 'back') { e.out = Math.max(0, e.out - DT / 0.4); if (e.out <= 0) { e.st = 'hide'; e.cd = 1.6; } }
    } else if (e.t === 'fish') {
      // magma piranha: swims in a sine-wave school from the right
      e.x += e.vx * DT; e.y = e.y0 + Math.sin((G.time + e.ph) * 3) * e.amp;
      if (e.x < G.camX - 20) e.dead = true;
    } else if (e.t === 'valve') {
      // nothing to do: it waits to be shot
    } else if (e.t === 'beam') {
      // rusted girder: shudders when you swim under it, then drops
      if (e.x < G.camX - 40) { e.dead = true; continue; }
      if (e.st === 'idle') { if (!p.dead && Math.abs(p.x - e.x) < (e.rock ? 40 : 60) && p.y > e.y && p.y - e.y < 160) { e.st = 'shake'; e.stT = e.rock ? 1.0 : 0.7; tone(140, 0.3, 'sawtooth', 0.05, 90); } }
      else if (e.st === 'shake') { e.stT -= DT; if (G.t % 6 === 0) G.fx.push({ k: 'debris', x: e.x + (rnd() - 0.5) * 24, y: e.y + 3, vx: 0, vy: 10, t: 0, life: 0.5 }); if (e.stT <= 0) e.st = 'fall'; }
      else if (e.st === 'fall') { const y0 = e.y; e.vy = Math.min(e.vy + 240 * DT, 170); e.y += e.vy * DT; const s2 = findLand(e.x, y0 + 3, e.y + 3, 12, false); if (s2) { e.y = s2.y - 3; e.st = 'rest'; e.stT = 3; shake(1); noise(0.2, 0.2, 400); for (let i = 0; i < 4; i++) G.fx.push({ k: 'puff', x: e.x + (i - 1.5) * 8, y: e.y + 2, vx: (i - 1.5) * 20, vy: -10, t: 0, life: 0.4 }); } }
      else if (e.st === 'rest') { e.stT -= DT; e.a = Math.max(0, Math.min(1, e.stT)); if (e.stT <= 0) e.dead = true; }
    } else if (e.t === 'mine') {
      e.y = e.y0 + Math.sin(G.time * 1.2 + e.ph) * 3;
      if (e.x < G.camX - 40) e.dead = true;
    } else if (e.t === 'jelly') {
      e.y = e.y0 + Math.sin(G.time * 0.7 + e.ph) * 22; e.x = e.x0 + Math.sin(G.time * 0.3 + e.ph) * 10;
      if (e.x < G.camX - 40) e.dead = true;
    } else if (e.t === 'msub') {
      e.x = e.x0 + Math.sin(G.time * 0.4 + e.ph) * 40; e.y = e.y0 + Math.sin(G.time * 0.9 + e.ph) * 6;
      if (e.x < G.camX - 60) { e.dead = true; continue; }
      if (!onScreen(e.x, -10)) continue;
      e.fireT -= DT;
      if (e.fireT <= 0 && !p.dead) { e.fireT = 2.2; const a2 = aimAtPlayer(e.x, e.y); ebullet(e.x + Math.cos(a2) * 14, e.y + Math.sin(a2) * 6, Math.cos(a2) * 100, Math.sin(a2) * 100, 0, 3); sfx.eshot(); }
    } else if (e.t === 'boat') {
      // patrol boat on the surface dropping slow-sinking depth charges
      e.x += e.vx * DT;
      if (e.x < G.camX - 50) { e.dead = true; continue; }
      e.dropT -= DT;
      if (e.dropT <= 0 && onScreen(e.x, -10)) { e.dropT = 1.6; ebullet(e.x, e.y + 6, 0, 20, 70, 3); tone(260, 0.1, 'triangle', 0.06, 130); }
    } else if (e.t === 'sac') {
      // egg sac: hatches a hopping larva every few seconds while on screen
      if (e.x < G.camX - 40) { e.dead = true; continue; }
      if (e.puls > 0) e.puls -= DT;
      if (!onScreen(e.x, -10)) continue;
      e.spawnT -= DT;
      if (e.spawnT <= 0) { e.spawnT = 3.2 + rnd(); if (G.en.filter(q => q.t === 'larva').length < 5) { G.en.push(larva(e.x - 6, e.y - 14, -60, -160)); e.puls = 0.4; tone(180, 0.12, 'sine', 0.06, 90); } }
    } else if (e.t === 'larva') {
      const previouslyGrounded=e.on,previousVX=e.vx;
      e.vy = Math.min(e.vy + GRAV * DT, MAXFALL); e.x += e.vx * DT; e.anim += DT * 8;
      const b0 = e.y; e.y += e.vy * DT; e.on = false;
      if (e.vy >= 0) { const s2 = findLand(e.x, b0, e.y, 3, false); if (s2) { e.y = s2.y; e.vy = 0; e.on = true; e.vx = 0; } }
      if (e.on) { e.hopT -= DT; if (e.hopT <= 0 && !p.dead) { e.hopT = 0.7 + rnd() * 0.5; e.vx = (p.x < e.x ? -1 : 1) * (70 + rnd() * 30); e.vy = -170 - rnd() * 40; e.on = false; } }
      if ((G.stage === 7 || G.stage === 8) && G.hive && !G.hive.dead && e.x > G.hive.x - 6) { e.x = G.hive.x - 6; e.vx = -Math.abs(e.vx); }
      if(G.stage===8&&!WUKONG)advanceLarvaHop(e,previouslyGrounded,DT,previousVX);
      if (e.y > G.camY + 250 || e.x < G.camX - 40 || e.x > G.camX + W + 60) e.dead = true;
    } else if (e.t === 'cart') {
      if(G.stage===7)continue;
      // cargo cart rolling at you along the floor; it rides conveyors and drops into shafts
      e.vy = Math.min(e.vy + GRAV * DT, MAXFALL);
      const oldX=e.x;e.x += (e.vx + (e.on && e.sup && e.sup.conv ? e.sup.conv : 0)) * DT;wallCollide(e,oldX,11);if(Math.abs(e.x-oldX)<.01)e.vx=-e.vx;e.wheel += e.vx * DT * 0.3;
      const b0 = e.y; e.y += e.vy * DT; e.on = false;
      if (e.vy >= 0) { const s2 = findLand(e.x, b0, e.y, 6, true); if (s2) { e.y = s2.y; e.vy = 0; e.on = true; e.sup = s2; } }
      if (e.y > G.camY + 250 || e.x < G.camX - 40) e.dead = true;
    } else if (e.t === 'mor') {
      // lobs a shell that lands where you stand
      if (e.x < G.camX - 40) { e.dead = true; continue; }
      if (e.recoil > 0) e.recoil -= DT;
      if (!onScreen(e.x, -10)) continue;
      e.face = p.x < e.x ? -1 : 1;
      e.fireT -= DT;
      if (e.fireT <= 0 && !p.dead) {
        e.fireT = 2.6 + rnd() * 1.2; e.recoil = 0.25;
        const fl = 1.3, gv = 300, mx = e.x + e.face * 9, my = e.y - 18;
        ebullet(mx, my, (p.x - mx) / fl, ((p.y - 6) - my - 0.5 * gv * fl * fl) / fl, gv, 3); sfx.toss(); puff(mx, my);
      }
    } else if (e.t === 'box') {
      if (e.x < G.camX - 40) { e.dead = true; continue; }
      e.st -= DT;
      if (e.st <= 0) { e.open = !e.open; e.st = e.open ? 1.6 : 1.8; }
    } else if (e.t === 'rock') {
      const waterfallRock=G.stage===3&&e.waterfallRock===true;
      if(waterfallRock&&e.phase==='embedded')continue;
      if(waterfallRock&&e.phase==='warning'){
        e.warnT=Math.max(0,e.warnT-DT);
        if(G.t%8===0&&inViewY(e.y))G.fx.push({k:'debris',x:e.x+(rnd()-.5)*e.r*1.3,y:e.y-e.r*.2,vx:(rnd()-.5)*20,vy:12+rnd()*12,t:0,life:.35});
        if(e.warnT<=0){e.phase='fall';e.vx=e.releaseVx;e.vy=28;sfx.boom();}
        continue;
      }
      e.vy = Math.min(e.vy + 420 * DT, 260); e.x += e.vx * DT;
      if(waterfallRock){
        if(Math.abs(e.vx)>.01)e.spinDir=Math.sign(e.vx);
        e.rot+=(e.spinDir||1)*(1.7+Math.abs(e.vx)/e.r*.55)*DT;
      }else e.rot += e.vx * DT * 0.12;
      const r0 = e.y; e.y += e.vy * DT;
      if (e.vy > 0 && e.bounce < (waterfallRock?2:3)) { const s2 = findLand(e.x, r0, e.y, waterfallRock?e.r*.55:2, false); if (s2) { e.y = s2.y; e.vy = -110 - rnd() * 50; e.vx = (rnd() < 0.5 ? -1 : 1) * (30 + rnd() * 45); e.bounce++; if(waterfallRock)e.spinDir=Math.sign(e.vx); if (inViewY(e.y)) sfx.hit(); } }
      if(waterfallRock){
        const edge=Math.max(20,e.r+4);
        if(e.x<edge){e.x=edge;e.vx=Math.abs(e.vx);e.spinDir=1;}
        else if(e.x>W-edge){e.x=W-edge;e.vx=-Math.abs(e.vx);e.spinDir=-1;}
      }else if (e.x < 20 || e.x > W - 20) e.vx = -e.vx;
      if (e.y > G.camY + H + 40) e.dead = true;
    } else if (e.t === 'tur') {
      if (e.x < G.camX - 40 || e.y > G.camY + H + 80) { e.dead = true; continue; }
      if (!onScreen(e.x, -4) || !inViewY(e.y)) continue;
      if(isCelestial()){advanceHalberd(e,stageOneTarget(e.x),DT);continue;}
      const pivotY=e.y+(horizontal?3.5:0);
      const target=horizontal?stageOneTarget(e.x):p;
      const a = horizontal?(target?.x<e.x?Math.PI:0):aimAtPlayer(e.x, pivotY), tgt = ((Math.round(a / (Math.PI / 6)) % 12) + 12) % 12;
      if(horizontal)e.idx=tgt;
      e.rotT -= DT;
      if (e.rotT <= 0 && e.idx !== tgt) { const d = (tgt - e.idx + 12) % 12; e.idx = (e.idx + (d <= 6 ? 1 : 11)) % 12; e.rotT = 0.17; }
      e.fireT -= DT;
      if (e.fireT <= 0 && e.idx === tgt && target && !target.dead && !(target.camoT > 0)) {
        const ang = e.idx * Math.PI / 6; e.fireT = horizontal?3.2+rnd():1.5;
        const face=e.idx===6?-1:1;
        ebullet(e.x + Math.cos(ang) * 11, pivotY + (horizontal?0:Math.sin(ang)*11), horizontal?face*130:Math.cos(ang)*130, horizontal?0:Math.sin(ang)*130); sfx.eshot();
      }
    }
  }
  }
  // pods & items
  if(WUKONG&&G.stage===1){
    const fairy=scheduleSupplyFairy(G,DT,rnd);if(fairy)G.pods.push(fairy);
  }else for (const t of G.podTrig) if (!t.done && (t.downY !== undefined ? G.camY >= t.downY : t.atY !== undefined ? G.camY <= t.atY : G.camX >= t.at)) { t.done = true; const y0 = t.atY !== undefined || t.downY !== undefined ? G.camY + t.y0 : t.y0; G.pods.push({ x: G.camX - 12, y0, y: y0, t: 0, kind: t.kind }); }
  for (const pd of G.pods) {
    if(pd.fairy){advanceSupplyFairy(pd,DT,G.camX);continue;}
    pd.t += DT; pd.x += 96 * DT; pd.y = pd.y0 + Math.sin(pd.t * 3.2) * 18; if (pd.x > G.camX + W + 20) pd.dead = true;
  }
  for (const it of G.items) {
    if (it.rest) { if(isCelestial()&&it.fromPod)it.landed=true; if (it.x < G.camX - 16 || it.y > G.camY + H + 40) it.dead = true; continue; }
    it.vy = G.uw ? Math.min(it.vy + 140 * DT, 40) : Math.min(it.vy + GRAV * 0.8 * DT, 300); it.x += it.vx * DT * (G.uw ? 0.5 : 1);
    const b0 = it.y; it.y += it.vy * DT;
    if (it.vy > 0) { const s = findLand(it.x, b0, it.y, 5, false); if (s) { it.y = s.y; if(it.fromPod||it.fromFish){it.landed=true;it.rest=true;it.vx=it.vy=0;} else if (it.vy > 90) { it.vy = -it.vy * 0.35; it.vx *= 0.5; } else { it.vy = 0; it.rest = true; } } }
    if (it.y > G.camY + 240 || it.x < G.camX - 16) it.dead = true;
  }
}
function killEnemy(e,shot) {
  if (e.dead) return;
  e.dead = true;
  if(e.t==='alienHead'){
    const box=alienGuardianBox(e),wall=alienGuardianWallBox(e);
    for(let i=0;i<3;i++)boom(box.x+box.w*(i%2?.65:.35),box.y+16+i*26,16);
    for(let i=0;i<3;i++)boom(wall.x+wall.w*(i%2?.7:.3),wall.y+14+i*22,14);
    if(G.s8.guardianWall)G.s8.guardianWall.gone=true;
    for(const b of G.eb)if(b.from==='alienHead')b.dead=true;
    for(const child of G.en)if(child.t==='guardianFlyer'&&!child.dead){child.dead=true;boom(child.x,child.y,5);}
    banner('洞穴守卫已击败 · 通路开启',2);shake(3);
  }
  if(e.t==='cart')for(const actor of players())if(actor.cart===e){leaveMinecart(actor,100);actor.invT=Math.max(actor.invT,1);}
  if(e.t==='spikeWall'){
    const box=hangarPlateBox(e);for(let i=0;i<4;i++)boom(e.x,e.y-box.h*(i+.5)/4,10);
    for(let i=0;i<14;i++)G.fx.push({k:'debris',x:e.x+(rnd()-.5)*24,y:box.y+rnd()*box.h,vx:(rnd()-.5)*120,vy:-45-rnd()*95,t:0,life:.6+rnd()*.4});
    sfx.big();shake(4);
  }
  if (e.t === 'valve') { e.hatch.gone = true; banner('舱门已打开', 1); [60, 67, 72].forEach((m, i) => tone(mfreq(m), 0.08, 'square', 0.06, 0, AC && AC.currentTime + i * 0.06)); for (let i = 0; i < 6; i++) G.fx.push({ k: 'bub', x: e.hatch.x + rnd() * e.hatch.w, y: e.hatch.y + 6, vx: 0, vy: -30 - rnd() * 20, t: 0, life: 1 }); }
  const c = ebox(e), small = e.t === 'run' || e.t === 'snp' || e.t === 'fly' || e.t === 'rock' || e.t === 'waterAmbush' || e.t === 'mor' || e.t === 'grenadier' || e.t === 'larva' || e.t==='guardianFlyer' || e.t==='whiteFloater' || e.t==='ceilingStalker' || e.t==='hiveHatchling' || e.t === 'diver' || e.t === 'jelly' || e.t === 'fish' || e.t==='fortressSaucer';
  if(isCelestial()&&['run','snp','fly'].includes(e.t)){
    G.fx.push(guardDefeat(e,shot));
    queueEnemyCry(G,e,e.t==='fly'?'fly':'guard');
    const recovery=healingEnemyDrop(G,e,rnd);if(recovery)G.items.push(recovery);
    if(!shot)martialImpact(c.x+c.w/2,c.y+c.h/2,{killed:true,heavy:true,blood:true,target:c,face:-(e.face||1)});
  }else{boom(c.x + c.w / 2, c.y + c.h / 2, small ? 7 : 12); sfx.boom();}
  addScore({ artillery:800, heavyGunner:800, grenadier:300, run: 100, snp: 300, tur: 500, box: 500, rock: 100, mor: 300, cart: 200, sac: 500, larva: 50, whiteFloater:50, ceilingParasite:300, ceilingStalker:150, diver: 200, mine: 100, jelly: 100, msub: 500, boat: 500, eel: 300, valve: 200, fish: 100 }[e.t] || 100);
  if (!small) shake(2);
  if (e.t === 'box') G.items.push({ x: e.x, y: e.y - 14, vx: 20, vy: -170, kind: e.item });
}
function damageEnemy(e, dmg, x, y, shot) {
  const impact={material:['tur','box','cart','artillery','heavyGunner','spikeWall','fortressSaucer'].includes(e.t)?'metal':'body',target:ebox(e),vx:shot?.vx??1,vy:shot?.vy??0,weapon:shot?.k};
  if (e.t === 'box' && !e.open) { spark(x, y,impact); return; } // closed sensor box shrugs off hits
  e.hp -= dmg; e.flash = 0.07; spark(x, y,impact);
  if(isCelestial()){
    if(['run','snp','fly'].includes(e.t))receiveGuardHit(e,shot,dmg);
    martialImpact(x,y,{heavy:!!shot?.heavy||dmg>=4,killed:e.hp<=0,metal:impact.material==='metal',blood:['run','snp','fly'].includes(e.t),face:Math.sign(shot?.vx||1),damage:dmg,target:impact.target,weapon:shot?.k,angle:shot?.impactAngle??Math.atan2(shot?.vy||0,shot?.vx||1),form:shot?.form||null});
    if(e.hp<=0)killEnemy(e,shot);return;
  }
  if (e.hp <= 0) killEnemy(e); else sfx.hit();
}
function activeRiverFish(){
  return !WUKONG&&G.stage===1?riverFishJumps(G.time,G.camX,solids,{x0:0,x1:FORTRESS_ART.levelEnd,surf:WATER.surf},G.riverFishHits).filter(f=>f.airborne):[];
}
function hitRiverFish(fish){
  const caught=G.riverFishHits||={};
  if(!fish.airborne||caught[fish.tile]===fish.cycle)return false;
  caught[fish.tile]=fish.cycle;
  G.items.push(riverFishLifeReward(fish,solids,G.camX,WATER.surf));
  for(let i=0;i<7;i++)G.fx.push({k:'drop',x:fish.x,y:fish.y,vx:(i-3)*18,vy:-45-(i%3)*18,t:0,life:.4});
  G.fx.push({k:'fishHit',x:fish.x,y:fish.y,t:0,life:.3});sfx.hit();return true;
}
function popPod(pd) {
  if(isCelestial()){
    const peach=releaseFairyPeach(pd);if(!peach)return false;
    G.items.push(peach);tone(780,.08,'sine',.04);return true;
  }
  pd.dead = true; boom(pd.x, pd.y, 8); sfx.boom();
  G.items.push({ x: pd.x, y: pd.y, vx: 30, vy: 20, kind: pd.kind, fromPod:true, landed:false });
}

// ================= boss =================
function updateBoss() {
  if(isSiege())return;
  if (G.stage !== 1) return;
  const B = G.boss, p = G.p;
  if (!B.active && G.camX >= CAM_MAX - 0.5) { B.active = true; banner(WUKONG?'南天门守将 · 巨灵神':'警告 · 要塞炮阵', 2.2); Music.start(true); }
  if (!B.active) return;
  if(WUKONG&&!B.giant){
    B.giant={...GIANT_HOME,vx:0,vy:0,onGround:true,clock:0,gait:0,walkBlend:0,cooldown:.65,attack:null,turn:0};
    giantEncounter(B);
    B.parts[0].hp=B.parts[1].hp=0;
    Object.assign(B.parts[2],giantBody(B.giant),{hitBox:giantBody(B.giant)});
  }
  for (const pt of B.parts) if (pt.flash > 0) pt.flash -= DT;
  if (B.dead) {
    if(B.deadT>0){
      B.deadT=Math.max(0,B.deadT-DT);
      if(!WUKONG&&rnd()<.2){const r=FORTRESS_EXIT;boom(r.x+rnd()*r.w,r.y+rnd()*r.h,5+rnd()*4);}
      if(!WUKONG)shake(1.5);
    }
    if(B.deadT<=0&&!B.exitOpen){B.exitOpen=true;banner(WUKONG?'仙门已开 · 跳入仙门完成本章':'入口已打开 · 跳入缺口进入下一关',3);sfx.pick();}
    if(B.exitOpen){
      for(const actor of players())if(canEnterExit(actor,FORTRESS_EXIT))beginExitEntry(actor);
      if(teamInsideExit(players(),G.lives)){
        B.exitTransitionT=(B.exitTransitionT||0)+DT;
        if(B.exitTransitionT>=.2){const next=nextPlayableStage(1);if(next)startStage(next,true);else stageClear();}
      }
    }
    return;
  }
  if (G.freezeT > 0) return;
  if(WUKONG){
    const core=B.parts[2];
    if(giantEncounter(B).stage===1&&core.hp<=core.max/2)growGiantBoss();
    if(B.encounter.stage===3)return;
    if(B.encounter.stage===2)advanceColossus(B,stageOneTarget(B.giant.x),DT,{
      onTell:a=>{banner(a.kind==='skyAxe'?'裂空巨斧 · 看准斧路，移开闪避':'天外巨足 · 离开脚印，再跳起避震',a.windup);tone(a.kind==='skyAxe'?165:76,.24,'triangle',.07);},
      onImpact:a=>{const stomp=a.kind==='skyStomp';noise(stomp?.48:.20,stomp?.24:.17,stomp?90:850);tone(stomp?42:115,stomp?.42:.20,'triangle',.15,stomp?24:38);shake(stomp?9:6);G.hitStop=Math.max(G.hitStop||0,stomp?.055:.035);puff(stomp?a.aimX:B.giant.x,176);}
    });
    else advanceGiant(B,stageOneTarget(B.giant.x),DT,{
      onAttack:kind=>{noise(.16,.08,240);if(kind==='cleave'||kind==='leap')tone(110,.12,'triangle',.06);},
      onLand:g=>{noise(.2,.12,140);shake(2.4);puff(g.x,g.y);}
    });
    Object.assign(core,giantBody(B.giant),{hitBox:giantBody(B.giant)});
    return;
  }
  const [gA, gB, core] = B.parts;
  advanceFortressCannon(gA,DT);advanceFortressCannon(gB,DT);
  const target=stageOneTarget(gA.x);
  if (!B.phase2 && core.hp <= core.max / 2) { B.phase2 = true; banner('核心过载', 1.4); }
  if (gA.hp > 0) {
    gA.fireT -= DT;
    if (gA.fireT <= 0 && target) {
      gA.fireT = B.phase2 ? 3.2 : 3.8;
      const {x:mx,y:my}=fortressCannonMuzzle(gA);gA.shotAge=0;gA.shotSerial=(gA.shotSerial||0)+1;
      ebullet(mx, my, (target.x<mx?-1:1)*112, 0);
      sfx.eshot();
    }
  }
  if (gB.hp > 0) {
    gB.fireT -= DT;
    if (gB.fireT <= 0 && target) {
      gB.fireT = B.phase2 ? 3.8 : 4.4;
      const {x:mx,y:my}=fortressCannonMuzzle(gB);gB.shotAge=0;gB.shotSerial=(gB.shotSerial||0)+1;
      ebullet(mx,my,(target.x<mx?-1:1)*110,0);sfx.eshot();
    }
  }
  if (B.phase2) {
    B.spawnT -= DT;
    if (B.spawnT <= 0) { B.spawnT = 2.3; if (G.en.filter(e => e.t === 'run').length < 3) G.en.push(runner(3200, 176, -1)); }
  }
}
function growGiantBoss(){
  if(!enterColossus(G.boss,{left:G.camX,width:W}))return;
  for(const p of players())if(!p.dead)p.invT=Math.max(p.invT,1.8);
  G.eb=[];G.en=[];banner('第二阶段 · 巨灵神显圣',2.1);tone(70,.5,'triangle',.08,160);shake(2.5);
}
function startGiantFinale(){
  if(!enterGiantFinale(G.boss,players()))return;
  G.eb=[];G.pb=[];G.gr=[];G.en=[];G.pods=[];G.items=[];G.fx=[];G.hitStop=0;G.freezeT=0;G.bannerT=0;
  wukongHeroAudio?.resetEvents({keepDialogue:true});wukongBattleAudio?.stopAll();
}
function stepGiantFinale(){
  G.t++;G.time+=DT;
  const done=advanceGiantFinale(G.boss,players(),DT,{
    onShout:()=>{const p=players().find(p=>!p.dead)||G.p;queueHeroSounds(G,p,'finisher');},
    onImpact:i=>{const p=players().find(p=>!p.dead)||G.p;queueHeroSounds(G,p,i>=4?'heavy':'spin');queueHeroImpact(G,{x:G.boss.giant.x,y:125,heavy:i>=4,metal:true});shake(i>=4?4:2);}
  });
  updateFx();sweep(G.fx);G.shake=Math.max(0,G.shake-DT*12);
  if(done)hitPart(G.boss.parts[2],1,{k:'staff',heavy:true,finisher:true,vx:1});
}
function hitPart(pt, dmg, shot) {
  if(isSiege())return WukongSiege.hit(G,pt,dmg||1,shot,players(),siegeHooks());
  const B = G.boss;
  if (pt.hp <= 0 || B.dead) return;
  if(isCelestial()&&B.giant){
    const encounter=giantEncounter(B);
    if(encounter.stage===3||encounter.stage===2&&encounter.growth>0)return;
  }
  pt.hp -= dmg || 1; pt.flash = 0.06;
  if(isCelestial()){
    martialImpact(shot?.x??pt.x+pt.w/2,shot?.y??pt.y+pt.h*.7,{heavy:!!shot?.heavy,killed:pt.hp<=0&&B.encounter?.stage===4,metal:true,blood:true,face:Math.sign(shot?.vx||1),damage:dmg||1,target:pt,weapon:shot?.k,angle:shot?.impactAngle??Math.atan2(shot?.vy||0,shot?.vx||1)});
    const giant=B.giant;
    if(giant&&giantEncounter(B).stage===1&&shot?.heavy&&!(giant.poiseCooldown>0)&&giant.onGround!==false&&(!giant.attack||giant.attack.t<giant.attack.windup)){
      giant.hurt={t:0,duration:.24,face:Math.sign(shot.vx||1)};giant.attack=null;giant.cooldown=.55;giant.poiseCooldown=1.5;
    }
  }else sfx.hit();
  if(isCelestial()&&B.giant){
    const stage=giantEncounter(B).stage;
    if(stage===1&&pt.hp<=pt.max/2){growGiantBoss();return;}
    if(stage===2&&pt.hp<=0){startGiantFinale();return;}
  }
  if (pt.hp > 0) return;
  pt.destroyedAt = G.time;
  boom(pt.x + pt.w / 2, pt.y + pt.h / 2, 16); sfx.big(); shake(4);
  if (pt.k === 'core') {
    B.dead = true; B.deadT = 1.1; B.exitOpen=false; B.exitTransitionT=0; addScore(10000);
    if(WUKONG)queueEnemyCry(G,B.giant||{x:pt.x,y:pt.y},'giant');
    for (const gun of B.parts) if (gun.hp > 0) {
      gun.hp = 0; gun.destroyedAt = G.time;
      boom(gun.x + gun.w / 2, gun.y + gun.h / 2, 12);
    }
    for (const e of G.en) if (!e.dead) { e.dead = true; boom(e.x, e.y - 12, 7); }
    G.eb.length = 0; G.spawnT=9999;G.podTrig.forEach(trigger=>trigger.done=true);
    if(WUKONG&&B.giant){
      B.defeatRig={...B.giant,attack:B.giant.attack?{...B.giant.attack,hits:[]}:null};
      B.giant.attack=null;B.giant.vx=B.giant.vy=0;
    }
    Music.stop(); banner(WUKONG?'巨灵神败退 · 南天门已破':'核心炸裂 · 通道正在打开',1.4);
  } else addScore(1000);
}

// ================= collisions & bullets =================
function bossParts() {
  if(isSiege())return WukongSiege.targets(G);
  if (G.stage === 3) { const M = G.mech; return M && M.active && !M.dead ? M.parts : []; }
  if (G.stage === 5) { const F=G.fortress,T=G.tank;return F?.active&&!F.dead&&F.entryT<=0?F.parts:T?.active&&!T.dead?T.parts:[]; }
  if (G.stage === 6) { const Gm = G.golem; return Gm && Gm.active && !Gm.dead ? Gm.parts : []; }
  if (G.stage === 11) { const Cr = G.crab; return Cr && Cr.active && !Cr.dead ? Cr.parts : []; }
  if (G.stage === 10) { const Gh = G.ghost; return Gh && Gh.active && !Gh.dead && Gh.alpha > 0.6 ? Gh.parts : []; }
  if (G.uw) { const Sk = G.shark; return Sk && Sk.active && !Sk.dead ? Sk.parts : []; }
  if (G.stage === 7) { const gate=G.gate;return gate&&gate.active&&!gate.dead?gate.parts:[]; }
  if (G.stage === 8) { const Hv = G.hive; return Hv && Hv.active && !Hv.dead ? hiveDamageableParts(Hv) : []; }
  const B = G.boss;
  if(!B||!B.active||B.dead)return [];
  if(isCelestial()){const core=B.parts[2];return B.encounter?.stage===2&&!(core.w>0&&core.h>0)?[]:[core];}
  return B.parts;
}
const hitBossPart = (pt, d, shot) => pt.fortress ? hitFlyingFortress(pt,d) : pt.mech ? hitMech(pt, d) : pt.tank ? hitTank(pt, d) : pt.golem ? hitGolem(pt, d) : pt.gate ? hitHangarGate(pt,d) : pt.ship ? hitShip(pt, d) : pt.hive ? hitHive(pt, d) : pt.shark ? hitShark(pt, d) : pt.ghost ? hitGhost(pt, d) : pt.crab ? hitCrab(pt, d) : hitPart(pt, d, shot);
function findTarget(x, y, combatOnly = false) {
  let best = null, bd = 260;
  const consider = (cx, cy) => { const d = Math.hypot(cx - x, cy - y); if (d < bd) { bd = d; best = { x: cx, y: cy }; } };
  for (const e of G.en) {
    if (e.dead || !onScreen(e.x, 0) || (e.t === 'box' && !e.open) || e.t === 'beam' || (e.t === 'eel' && e.out < 0.3)) continue;
    if(e.t==='cart'&&G.stage===7)continue;
    const b = ebox(e); consider(b.x + b.w / 2, b.y + b.h / 2);
  }
  if(!combatOnly)for (const pd of G.pods) if (!pd.dead&&!pd.flee) consider(pd.x, pd.y);
  const B = G.boss;
  for (const pt of bossParts()) if (pt.hp > 0 && (G.stage !== 3 || waterfallTargetVulnerable(pt,G.mech))) consider(pt.x + pt.w / 2, pt.y + pt.h / 2);
  return best;
}
function updateBullets() {
  for (const b of G.pb) {
    if (b.k === 'fire') {
      b.t += DT; b.cx += b.vx * DT; b.cy += b.vy * DT;
      const r = Math.min(8, b.t * 60), a = b.t * 15 * b.dir;
      b.x = b.cx + Math.cos(a) * r; b.y = b.cy + Math.sin(a) * r;
    } else if (b.k === 'msl') {
      b.life -= DT;
      if (b.life <= 0) { if(!detonateHeliMissile(b)){b.dead = true; boom(b.x, b.y, 5);} continue; }
      const tg = findTarget(b.x, b.y, !!b.heliMissile);
      if (tg) { let d = Math.atan2(tg.y - b.y, tg.x - b.x) - b.ang; d = Math.atan2(Math.sin(d), Math.cos(d)); b.ang += Math.max(-6 * DT, Math.min(6 * DT, d)); }
      b.spd = Math.min(280, b.spd + 320 * DT);
      b.vx = Math.cos(b.ang) * b.spd; b.vy = Math.sin(b.ang) * b.spd;
      b.x += b.vx * DT; b.y += b.vy * DT;
      if ((G.t & 1) === 0) G.fx.push({ k: 'smoke', x: b.x - Math.cos(b.ang) * 5, y: b.y - Math.sin(b.ang) * 5, t: 0, life: 0.35 });
    } else { b.x += b.vx * DT; b.y += b.vy * DT; }
    const hx = b.k === 'fire' ? b.cx : b.x, hy = b.k === 'fire' ? b.cy : b.y, m = b.k === 'laser' ? 32 : 8;
    if (hx < G.camX - m || hx > G.camX + W + m || hy < G.camY - m || hy > G.camY + H + m) b.dead = true;
  }
  for (const b of G.eb) {
    if(b.dead)continue;
    if(b.waterAmbush&&G.freezeT>0)continue;
    if(b.waterAmbush==='rise'){
      const previousVy=b.vy;b.vy+=b.g*DT;b.y+=b.vy*DT;
      // One upward round becomes exactly three distinct descending rounds at its apex.
      if(previousVy<0&&b.vy>=0){
        b.dead=true;
        for(const vx of [-72,0,72]){const fragment=ebullet(b.x,b.y,vx,42,175,2.8);fragment.from='waterAmbush';fragment.waterAmbush='fall';}
        spark(b.x,b.y,{material:'body',vx:0,vy:-1});
      }
      if(b.y<G.camY-20||b.y>G.camY+H+8)b.dead=true;
      continue;
    }
    if(b.snowOrdnance){
      if(advanceSnowOrdnance(b,DT,findLand)){boom(b.x,b.y,12);sfx.boom();shake(1);}
      if(b.x<G.camX-64||b.x>G.camX+W+64||b.y<G.camY-180||b.y>G.camY+H+40)b.dead=true;
      continue;
    }
    if(b.waterfallFire){
      b.age+=DT;b.cx+=b.vx*DT;b.cy+=b.vy*DT;
      b.x=b.cx+Math.sin(b.age*7+b.seed)*5;b.y=b.cy+Math.cos(b.age*7+b.seed)*3;
    }else{b.vy += b.g * DT; b.x += b.vx * DT; b.y += b.vy * DT;}
    if (b.x < G.camX - 12 || b.x > G.camX + W + 12 || b.y < G.camY - 20 || b.y > G.camY + H + 8) b.dead = true;
    if (b.g) { const s = findLand(b.x, b.y - b.vy * DT, b.y, 1, false); if (s && b.vy > 0) { b.dead = true; boom(b.x, b.y - 3, 6); } }
  }
}
const podBox = pd => pd.fairy?{x:pd.x-28,y:pd.y-17,w:42,h:30}:({ x: pd.x - 12, y: pd.y - 6, w: 24, h: 11 });
function inWall(x, y) {
  if (G.stage === 7) {
    for(const plate of G.en){
      if(plate.t!=='spikeWall'||plate.dead||!(plate.rise>0))continue;
      const b=hangarPlateBox(plate);if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return true;
    }
    const gate=G.gate;if(!gate||gate.dead||x<=gate.x+4||y>=176)return false;
    const core=gate.parts[2];return !(core.hp>0&&y>=core.y&&y<=core.y+core.h&&x<=core.x+core.w); }
  if (G.stage === 8) { const wall=G.s8?.guardianWall;return !!(wall&&!wall.gone&&x>=wall.x&&x<=wall.x+wall.w&&y>=wall.y&&y<=wall.y+wall.h)||inHive(x,y); }
  if (G.stage === 5) return inTank(x, y);
  if (G.stage === 6) return inGolem(x, y);
  if (G.stage !== 1) return false;
  const core = G.boss.parts[2].hitBox || G.boss.parts[2];
  return x >= FORTRESS_ART.wallX && x <= FORTRESS_ART.x + FORTRESS_ART.w && y > (WUKONG?FORTRESS_ART.y:fortressRoofY(x)) && y < FORTRESS_ART.y + FORTRESS_ART.h && !(y >= core.y - 2 && y <= core.y + core.h + 2 && x < core.x + core.w);
}
function coreFiringLane(b) {
  if (G.stage !== 1 || !G.boss.active || G.boss.dead || !(b.vx > 0)) return false;
  const target = G.boss.parts[2], core = target.hitBox || target, x = b.k === 'fire' ? b.cx : b.x, y = b.k === 'fire' ? b.cy : b.y, r = b.k === 'fire' ? 8 : 2;
  if (target.hp <= 0 || x >= core.x + core.w + r) return false;
  const near = Math.max(0, (core.x - r - x) / b.vx), far = (core.x + core.w + r - x) / b.vx;
  const y0 = y + b.vy * near, y1 = y + b.vy * far;
  // Only a ray that actually reaches the reactor can enter its recessed firing lane.
  // Collision with the real weak-point box still decides damage; this never bends a bullet.
  return far >= near && Math.max(y0, y1) >= core.y - r && Math.min(y0, y1) <= core.y + core.h + r;
}
function blast(x, y, R = 64, dmg = 16, bdmg = 12) {
  // grenade defaults: wide radius, heavy damage; the demolition charge passes bigger numbers
  G.fx.push({ k: 'boom', x, y, t: 0, life: 0.7, s: Math.round(R * 0.4) });
  for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7 + 0.4; boom(x + Math.cos(a) * R * 0.44, y + Math.sin(a) * R * 0.28, Math.round(R * 0.19)); }
  sfx.big();
  shake(4);
  for (const e of G.en) {
    if (e.dead || e.t === 'beam' || (e.t === 'eel' && e.out < 0.3)) continue;
    if(e.t==='cart'&&G.stage===7)continue;
    const b = ebox(e), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    if (Math.hypot(cx - x, cy - y) <= R + 6) damageEnemy(e, dmg, cx, cy);
  }
  for (const pd of G.pods) if (!pd.dead&&!pd.flee && Math.hypot(pd.x - x, pd.y - y) <= R) popPod(pd);
  for (const fish of activeRiverFish())if(Math.hypot(fish.x-x,fish.y-y)<=R+6)hitRiverFish(fish);
  const B = G.boss;
  for (const pt of bossParts()) if (pt.hp > 0 && Math.hypot(pt.x + pt.w / 2 - x, pt.y + pt.h / 2 - y) <= R + 12) hitBossPart(pt, bdmg);
  for (const b of G.eb) if (Math.hypot(b.x - x, b.y - y) < R) b.dead = true;
}
function updateGrenades() {
  for (const g of G.gr) {
    if (g.tnt) {
      if (!g.rest) {
        g.vy = Math.min(g.vy + 600 * DT, 360);
        const t0 = g.y; g.y += g.vy * DT;
        if (g.vy > 0) { const s2 = findLand(g.x, t0, g.y, 3, false); if (s2) { g.y = s2.y; g.vy = 0; g.rest = true; } }
        if (g.y > G.camY + 232) { g.dead = true; continue; }
      }
      g.fuse -= DT;
      if (g.fuse <= 0) { g.dead = true; blast(g.x, g.y - 8, 84, 30, 25); }
      continue;
    }
    if (g.uw) { g.vy = g.vy * (1 - DT * 2) + 30 * DT; g.vx *= 1 - DT * 1.5; } else g.vy = Math.min(g.vy + 600 * DT, 360);
    g.x += g.vx * DT;
    const b0 = g.y; g.y += g.vy * DT; g.a += DT * 14; g.fuse -= DT;
    if (g.y > G.camY + 232) { g.dead = true; continue; }
    let hit = g.fuse <= 0 || inWall(g.x, g.y);
    const radius = 3;
    if (!hit && g.vy > 0) {
      const landing = findLand(g.x, b0, g.y, 1, false);
      if (landing) hit = true;
    }
    const gb = { x: g.x - radius, y: g.y - radius, w: radius * 2, h: radius * 2 };
    if (!hit) hit = G.en.some(e => !e.dead && overlap(gb, ebox(e))) || G.pods.some(pd => !pd.dead&&!pd.flee && overlap(gb, podBox(pd)));
    if (!hit) hit = bossParts().some(pt => pt.hp > 0 && overlap(gb, pt.hitBox || pt));
    if (hit) { g.dead = true; if (G.stage === 1 && g.x > WATER.x0 && g.x < WATER.x1 && g.y > WATER.surf) splash(g.x); blast(g.x, Math.min(g.y, 196), 64, 16, 12); }
  }
}
function bulletBoxes(b) {
  if (b.k === 'laser') {
    const l = Math.hypot(b.vx, b.vy) || 1, dx = b.vx / l, dy = b.vy / l;
    return [0, 8, 16, 24].map(o => ({ x: b.x - dx * o - 2, y: b.y - dy * o - 2, w: 4, h: 4 }));
  }
  const r = b.k === 'fire' ? 3 : 2;
  return [{ x: b.x - r, y: b.y - r, w: r * 2, h: r * 2 }];
}
const anyOverlap = (boxes, t) => boxes.some(bx => overlap(bx, t));
function detonateHeliMissile(b) {
  if(!b.heliMissile)return false;
  b.dead=true;
  // The aircraft changes delivery; the grenade's blast and cooldown are retained.
  blast(b.x,b.y,64,16,12);
  return true;
}
function collide() {
  const p = G.p, B = G.boss;
  const fish=activeRiverFish();
  if (isCelestial()) {
    const combat={enemies:G.en,pods:G.pods,parts:bossParts(),solids,enemyBox:ebox,podBox,
      damageEnemy,popPod,hitPart:hitBossPart,bullets:G.eb,
      onWaveImpact:(x,y,wave)=>G.fx.push({k:'qiBurst',x,y,strength:wave.strength,t:0,life:.24})};
    for(const actor of players()){resolveStaff(actor,combat);resolveWukongMagic(actor,combat);}
  }
  for (const b of G.pb) {
    if (b.dead) continue;
    const bxs = bulletBoxes(b), pierce = b.k === 'laser';
    for(const target of fish){
      if(!anyOverlap(bxs,riverFishBox(target))||!hitRiverFish(target))continue;
      if(b.heliMissile)detonateHeliMissile(b);else if(!pierce)b.dead=true;
      break;
    }
    if(b.dead)continue;
    for (const e of G.en) {
      if (e.dead || e.t === 'beam' || (e.t === 'cart'&&G.stage===7) || (e.t === 'eel' && e.out < 0.3) || (pierce && b.hits.has(e)) || !anyOverlap(bxs, ebox(e))) continue;
      if(detonateHeliMissile(b))break;
      const blocked = e.t === 'box' && !e.open;
      damageEnemy(e, b.dmg, b.x, b.y,b);
      if (pierce && !blocked) { b.hits.add(e); continue; }
      b.dead = true; break;
    }
    if (b.dead) continue;
    for (const pd of G.pods) {
      if (pd.dead||pd.flee || !anyOverlap(bxs, podBox(pd))) continue;
      if(detonateHeliMissile(b))break;
      popPod(pd);
      if (!pierce) { b.dead = true; break; }
    }
    const parts = bossParts();
    if (b.dead || !parts.length) continue;
    for (const pt of parts) {
      if (pt.hp <= 0 || (pierce && b.hits.has(pt)) || !anyOverlap(bxs, pt.hitBox || pt)) continue;
      if(detonateHeliMissile(b))break;
      spark(b.x, b.y,{material:pt.k==='core'?'core':'metal',vx:b.vx,vy:b.vy,weapon:b.k,target:pt.hitBox || pt}); hitBossPart(pt, b.dmg);
      if (pierce) b.hits.add(pt); else { b.dead = true; break; }
    }
    if (!b.dead && inWall(b.x, b.y) && !coreFiringLane(b) && !detonateHeliMissile(b)) { b.dead = true; spark(G.stage===1?FORTRESS_ART.wallX:b.x, b.y,{material:'metal',vx:b.vx,vy:b.vy,weapon:b.k}); }
  }
  collidePlayer();
  withPlayer2(collidePlayer);
}
function collidePlayer() {
  const p = G.p;
  if (p.dead) return;
  const pb = pBox(p);
  const celestial=isCelestial();
  for (const it of G.items) {
    // Resting drops are already on the floor, including restored older states
    // without the separate landed flag. Healing uses body contact, rather than
    // the narrow original damage box at the centre of the painted Wukong.
    if (it.dead || (it.fromPod&&!it.landed&&!(celestial&&it.rest)) || !pb) continue;
    const pickup=celestial&&HEALING_ITEMS[it.kind]?{x:pb.x-8,y:pb.y-2,w:pb.w+16,h:pb.h+4}:pb;
    if(!overlap(pickup,{x:it.x-6,y:it.y-10,w:12,h:10}))continue;
    it.dead = true;pickItem(it.kind);if(isSiege()&&it.siegeSupply)WukongSiege.claimSupply(G,p,it.siegeSupply,G.inv);
  }
  if (!pb) return;
  if(isSiege()){const hit=WukongSiege.playerHit(G,p,pb);if(hit){killPlayer(false,hit);return;}}
  if(WUKONG&&G.stage===1&&G.boss.active&&!G.boss.dead&&G.freezeT<=0&&p.invT<=0&&giantHitsPlayer(G.boss,p,pb,solids)){
    if(p.shieldT>0||riotBlock()||p.ride==='moto'){spark(p.x,p.y-16,{material:'shield',vx:G.boss.giant.face,vy:0});}
    else {killPlayer(false,{damage:colossusDamage(G.boss,pb),heavy:true,face:G.boss.giant.face,x:p.x,y:p.y-18});return;}
  }
  const feet = giantCrushBox(p);
  if (feet) {
    for (const e of G.en) {
      if (e.dead || e.t === 'beam' || e.t === 'valve' || e.t==='spikeWall' || e.t==='alienHead' || (e.t === 'eel' && e.out < .3)) continue;
      if (overlap(feet, ebox(e))) { killEnemy(e); giantSmashFX(e.x, p.y); }
    }
    if (G.stage === 1 && !(p.giantCrushT > 0)) for (const part of bossParts()) {
      if (part.hp > 0 && overlap(feet, part)) {
        hitBossPart(part, GIANT_POWER.crushDamage); p.giantCrushT = GIANT_POWER.crushCooldown;
        giantSmashFX(part.x + part.w / 2, p.y); break;
      }
    }
  }
  for (const b of G.eb) {
    if (b.dead) continue;
    if (overlap(pb, { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 })) {
      if (p.shieldT > 0 || riotBlock()) { b.dead = true; spark(b.x, b.y,{material:'shield',vx:b.vx,vy:b.vy}); continue; }
      if (p.invT > 0) continue;
      b.dead = true;if(b.snowOrdnance){boom(b.x,b.y,11);sfx.boom();}
      if(isCelestial())killPlayer(false,{damage:WUKONG_HEALTH.projectile,face:Math.sign(b.vx),x:b.x,y:b.y});else killPlayer();
      return;
    }
  }
  for (const e of G.en) {
    if (e.dead || e.t === 'waterAmbush' || e.t === 'box' || e.t === 'grenadier' || e.t === 'sac' || e.t === 'valve' || G.freezeT > 0 || (e.t==='rock'&&(e.phase==='embedded'||e.phase==='warning')) || (e.t === 'beam' && e.st !== 'fall') || (e.t === 'eel' && e.out < 0.3)) continue; // frozen and embedded enemies are harmless
    if(e.t==='alienHead'){
      // Power-ups protect the player; touching the gate cannot bypass its HP.
      if(alienGuardianHeadBoxes(e).some(b=>overlap(pb,b)))killPlayer();
      if(p.dead)return;continue;
    }
    if(e.t==='spikeWall'){
      if(overlap(pb,ebox(e)))killPlayer();
      if(p.dead)return;continue;
    }
    if(e.t==='tur'){
      if(isCelestial()&&p.invT<=0&&halberdHitsPlayer(e,p,pb,solids)){
        if(p.shieldT>0||riotBlock()||p.ride==='moto')spark(p.x,p.y-16,{material:'shield',vx:e.melee.face,vy:0});
        else {killPlayer(false,{damage:WUKONG_HEALTH.halberd,face:e.melee.face,heavy:true,x:p.x,y:p.y-18});return;}
      }
      continue;
    }
    if(isCelestial()&&(e.t==='run'||e.t==='snp'||e.t==='fly')){
      if(overlap(pb,ebox(e))&&(p.shieldT>0||p.ride==='moto'||p.giantT>0||p.acidT>0||p.boostT>0)){killEnemy(e);continue;}
      if(p.invT>0)continue;
      if(guardHitsPlayer(e,p,pb,solids)){
        if(p.shieldT>0||riotBlock()||p.ride==='moto'){spark(p.x,p.y-16,{material:'shield',vx:e.melee.face,vy:0});continue;}
        killPlayer(false,{damage:e.t==='fly'?WUKONG_HEALTH.fly:WUKONG_HEALTH.guard,face:e.melee.face,heavy:e.melee.kind==='sweep',x:p.x,y:p.y-18});return;
      }
      continue;
    }
    if(e.t==='cart'&&(G.stage===7||p.cart===e||p.y<=e.y-20))continue;
    if (overlap(pb, ebox(e))) {
      if (p.shieldT > 0 || p.ride === 'moto' || p.giantT > 0 || (e.t === 'rock' && p.helmT > 0) || (p.acidT > 0 && (e.t === 'run' || e.t === 'larva')) || (p.boostT > 0 && e.t !== 'beam')) { killEnemy(e); continue; } // shield, motorbike ram, giant stomp, helmet vs boulder
      if (e.t === 'mine') killEnemy(e); // the mine goes off as it hits you
      killPlayer(); return;
    }
  }
}
function updateFx() {
  for (const f of G.fx) {
    f.t += DT;
    if(isCelestial()&&f.k==='guardDefeat'){
      if(advanceGuardDefeat(f,DT,{land:findLand,wall:wallCollide,gravity:GRAV})){
        G.fx.push({k:'landingDust',x:f.x,y:f.y,t:0,life:.3});noise(.07,.06,800);
      }
    }
    else if (f.k === 'smoke') { f.y -= 10 * DT; }
    else if (f.k === 'spark' || f.k === 'drop' || f.k === 'debris' || f.k === 'acid') { f.vy += 420 * DT; f.x += f.vx * DT; f.y += f.vy * DT; }
    else if (f.k === 'puff') { f.x += f.vx * DT; f.y += f.vy * DT; }
    else if(f.k==='motoDust'){f.vx*=Math.exp(-2*DT);f.vy+=20*DT;f.x+=f.vx*DT;f.y+=f.vy*DT;}
    else if (f.k === 'bub') { f.x += f.vx * DT + Math.sin(f.t * 9) * 0.15; f.y += f.vy * DT; }
    if (f.t >= f.life) f.dead = true;
  }
}
const sweep = a => { for (let i = a.length - 1; i >= 0; i--) if (a[i].dead) a.splice(i, 1); };

// ================= step =================
function updateCamera() {
  if(isSiege()){const alive=players().filter(p=>!p.dead);if(alive.length)G.camX=Math.max(0,Math.min(CAM_MAX,Math.min(...alive.map(p=>p.x))-145));G.camY=0;return;}
  const cameraLimit=G.stage===8&&!WUKONG?alienGuardianCameraLimit(G.en,CAM_MAX):CAM_MAX;
  if (cooperative() && G.p2) {
    const alive = players().filter(p => !p.dead&&!p.enteringExit&&!p.exitEntered);
    if (!alive.length) return;
    if (G.stage === 3) {
      const lowest = alive.reduce((a, b) => a.y > b.y ? a : b);
      let target = G.mech?.active ? TOP_Y : lowest.onGround ? lowest.y - 150 : G.camY;
      if (lowest.y < G.camY + 40) target = Math.min(target, lowest.y - 40);
      if (target < G.camY) G.camY = Math.max(TOP_Y, G.camY - Math.min(G.camY - target, 150 * DT));
    } else {
      const left = Math.min(...alive.map(p => p.x)), right = Math.max(...alive.map(p => p.x));
      G.camX = Math.min(cameraLimit, Math.max(G.camX, Math.min(right - 150, left - 18)));
    }
    return;
  }
  const p = G.p;
  if (G.subMode) { if (!p.dead) G.camX = Math.min(CAM_MAX, G.camX + SUB_SCROLL * DT); return; } // auto-scroll
  if (G.vert) {
    // scroll down only: follow the diver, and never stay above the collapsing rubble
    if (p.dead) return;
    const tgt = Math.min(V_ARENA_CAM, Math.max(G.camY, p.y - 80));
    G.camY += (tgt - G.camY) * Math.min(1, DT * 5);
    G.camY = Math.min(V_ARENA_CAM, Math.max(G.camY, G.sea.colY - 40)); // keep the rubble in view at the top
    return;
  }
  if (G.stage === 3) {
    // scroll up only when the player lands higher (not on every jump apex), or is about to leave the top edge
    if (p.dead) return;
    let target = G.camY;
    if (G.mech && G.mech.active) target = TOP_Y;
    else if (p.ride === 'heli') target = p.y - 140;
    else if (p.onGround) target = p.y - 150;
    if (p.y < G.camY + 40) target = Math.min(target, p.y - 40);
    if (target < G.camY) G.camY = Math.max(TOP_Y, G.camY - Math.min(G.camY - target, (p.y < G.camY + 40 ? 400 : 150) * DT));
    return;
  }
  if (!p.dead) {const limit=G.stage===5&&!G.tank.dead?STAGE_FIVE_ROUTE.tankCamera:cameraLimit;G.camX=Math.min(limit,Math.max(G.camX,p.x-150));}
}
function step() {
  const I = readInput();
  if (G.mode === 'loading') {
    if (I.escEdge) return cancelLoading();
    if (I.upEdge) focusMenu(-1); if (I.downEdge) focusMenu(1);
    if ((I.startEdge || I.fireEdge || I.jumpEdge) && menuButtons().includes(document.activeElement)) document.activeElement.click();
    return;
  }
  if (G.mode === 'lobby') { if(I.escEdge)$('coopBack').click();else handleGamepadMenu(I,$('scrCoop'));return; }
  if (cooperative()) {
    if (coop.role === 'guest') { coop.input(I); return; }
    remoteInput = coop.remote.read();
    if (G.mode === 'play' && (remoteInput.startEdge || remoteInput.escEdge)) return pause();
    if (G.mode === 'pause' && (remoteInput.startEdge || remoteInput.escEdge)) return resume();
  }
  if (G.mode === 'settings') { if (I.escEdge) closeSettings();else handleGamepadMenu(I,$('scrSettings'));return; }
  if (G.mode === 'cine') {
    G.t++; const Cn = G.cine; Cn.t += DT;
    const partnerSkip=cooperative()&&Cn.kind==='end'&&(remoteInput.startEdge||remoteInput.fireEdge||remoteInput.jumpEdge||remoteInput.escEdge);
    if (Cn.t > 0.6 && (I.startEdge || I.fireEdge || I.jumpEdge || I.escEdge || Cn.skip || partnerSkip)) return endCine();
    if (Cn.t >= CINE_LEN[Cn.kind]) return endCine();
    updateCine();
    return;
  }
  if (G.mode === 'intro') {
    G.t++; G.introT -= DT;
    if (G.introT <= 0 || I.startEdge) beginPlay();
    return;
  }
  if (G.mode === 'play') { if (I.startEdge || I.escEdge) return pause(); }
  else {
    // menu screens: up/down moves the medal cursor, Enter / J / K / A activates
    if (G.mode === 'pause' && I.escEdge) return resume();
    if (G.mode === 'select' && I.escEdge) return setMode('title');
    if (I.upEdge) focusMenu(-1);
    if (I.downEdge) focusMenu(1);
    if (I.startEdge || I.jumpEdge || I.fireEdge) { const bs = menuButtons(); const b = bs.includes(document.activeElement) ? document.activeElement : bs[0]; if (b) b.click(); }
    if(G.mode!=='pause')G.t++;
    return;
  }
  if(isCelestial()&&G.boss.encounter?.stage===3){stepGiantFinale();return;}
  if(isCelestial()&&advanceImpactPause(G,DT,[I,remoteInput]))return;
  G.t++; G.time += DT;
  if(G.martialCombo?.remaining>0)G.martialCombo.remaining=Math.max(0,G.martialCombo.remaining-DT);
  for (const actor of players()) if (updateGiant(actor, DT)) {
    puff(actor.x, actor.y); sfx.hit(); banner('巨大化时间结束 · 恢复原尺寸', 1.4);
  }
  // Wukong spends a full rage meter; original stages keep grenade cooldowns.
  if (G.nadeCd > 0) G.nadeCd -= DT;
  if (I.nadeEdge) requestNade();
  if (G.momm) {
    updateMom(I);
    if (G.mode !== 'play') return;
    updateFx();
  } else if (G.liftm) {
    updateLift(I);
    if (G.mode !== 'play') return;
    updateFx();
  } else if (G.fortm) {
    updateFort(I);
    if (G.mode !== 'play') return;
    updateFx();
  } else if (G.tdm) {
    updateTD(I);
    if (G.mode !== 'play') return;
    updateFx();
  } else if (G.rail) {
    updateRail(I);
    if (G.mode !== 'play') return;
    updateFx();
  } else if (isBase()) {
    updateActor(I);
    updatePartner(remoteInput);
    if (G.mode !== 'play') return;
    updateBase();
    if(G.mode!=='play')return;
    updateFx();
    sweep(G.base.sol); sweep(G.base.rol);
  } else {
  if(G.stage===7)advanceStageSevenCarts();
  if(G.stage===3)advanceStageThreePlatforms(solids,players(),G.time);
  updateActor(I);
  updatePartner(remoteInput);
  if (G.mode !== 'play') return;
  if(isSiege()){
    if(G.siege.retryPending){G.siege.retryPending=false;WukongSiege.retryRoom(G,players(),siegeHooks());}
    const epoch=G.siege.epoch;WukongSiege.advance(G,players(),{1:I,2:remoteInput},DT,siegeHooks());
    if(G.mode!=='play'||G.siege.epoch!==epoch)return;
  }
  keepTeamOnScreen();
  updateCamera();
  updateEnemies();
  updateBridges();
  updateBoss();
  if(G.mode!=='play')return;
  if (G.stage === 3) updateStage3();
  if (G.stage === 5) updateStage5();
  if (G.stage === 6) { updateStage6();if(G.mode!=='play')return; }
  if (G.stage === 7) { updateStage7();if(G.mode!=='play')return; }
  if (G.stage === 8) { updateStage8();if(G.mode!=='play')return; }
  collidePartnerHazards();
  if (G.uw) updateSea();
  updateBullets();
  updateGrenades();
  if(isCelestial()){
    const world={enemies:G.en,parts:bossParts(),solids,enemyBox:ebox,camera:G.camX,width:W,bottom:G.camY+H};
    for(const actor of players())advanceWukongMagic(actor,DT,world);
  }
  collide();
  updateFx();
  }
  sweep(G.pb); sweep(G.eb); sweep(G.gr); sweep(G.en); sweep(G.pods); sweep(G.items); sweep(G.fx);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - DT * 12);
  if (G.flashT > 0) G.flashT -= DT;
  if (G.freezeT > 0) G.freezeT -= DT;
  if (G.empT > 0) G.empT -= DT;
  if (G.bannerT > 0) G.bannerT -= DT;
}

// ================= rendering =================
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// The game keeps its 384x216 logic grid, but the canvas renders at R x that size so shapes, motion and text stay smooth.
let R = 3;
let backgroundResolution = 0, resolutionStage = 0;
function setT(x = 0, y = 0) { ctx.setTransform(R, 0, 0, R, x * R, y * R); }
function setRes(r) {
  if (r !== R || cv.width !== W * r) {
    R = r; cv.width = W * R; cv.height = H * R; ctx.imageSmoothingEnabled = true;
  }
  // HD stages own their image layers; avoid unused legacy backdrops at 4K.
  if (G.stage > 8 && backgroundResolution !== R) { buildBackgrounds(); backgroundResolution = R; }
}
const UI_FONT = '"Segoe UI","Helvetica Neue","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",Arial,sans-serif';
const shadeCache = new Map();
function shade(hex, k) {
  const key = hex + '|' + k; let v = shadeCache.get(key); if (v) return v;
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  v = '#' + [r, g, b].map(q => Math.round(q).toString(16).padStart(2, '0')).join(''); shadeCache.set(key, v); return v;
}
function rr(x, y, w, h, r, c) { ctx.fillStyle = c; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); ctx.fill(); }
function el(x, y, rx, ry, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); ctx.fill(); }
function seg(x1, y1, x2, y2, w, c) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function glow(x, y, r, inner, outer) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, inner); g.addColorStop(1, outer); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
// every fill snaps to the NES 2C02 palette, so sprites, effects and HUD share the console's colours
const NES = ['#000000','#7c7c7c','#0000fc','#0000bc','#4428bc','#940084','#a80020','#a81000','#881400','#503000','#007800','#006800','#005800','#004058',
  '#bcbcbc','#0078f8','#0058f8','#6844fc','#d800cc','#e40058','#f83800','#e45c10','#ac7c00','#00b800','#00a800','#00a844','#008888',
  '#f8f8f8','#3cbcfc','#6888fc','#9878f8','#f878f8','#f85898','#f87858','#fca044','#f8b800','#b8f818','#58d854','#58f898','#00e8d8','#787878',
  '#fcfcfc','#a4e4fc','#b8b8f8','#d8b8f8','#f8b8f8','#f8a4c0','#f0d0b0','#fce0a8','#f8d878','#d8f878','#b8f8b8','#b8f8d8','#00fcfc'];
const NES_RGB = NES.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
const nesCache = new Map();
function nes(c) {
  let v = nesCache.get(c);
  if (v !== undefined) return v;
  let hex = c;
  if (hex.length === 4) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  if (hex[0] !== '#' || hex.length !== 7) { nesCache.set(c, null); return null; } // translucent or non-hex: not drawn
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  let best = 0, bd = 1e9;
  NES_RGB.forEach(([R, G2, B], i) => { const d = 2 * (R - r) ** 2 + 4 * (G2 - g) ** 2 + 3 * (B - b) ** 2; if (d < bd) { bd = d; best = i; } });
  v = NES[best]; nesCache.set(c, v); return v;
}
let C = ctx;
const F = (x, y, w, h, c) => { const k = nes(c); if (!k) return; C.fillStyle = k; C.fillRect(Math.round(x * R) / R, Math.round(y * R) / R, w, h); };
function disc(g, x, y, r, c) {
  g.fillStyle = nes(c) || c; g.beginPath(); g.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2); g.fill();
}

// ----- text: smooth system fonts with a dark outline so they read over any background -----
function drawText(str, x, y, color, align, size, scale) {
  const ascii = /^[\x20-\x7e]*$/.test(str);
  const sz = (size || (ascii ? 8 : 10)) * (scale || 1);
  ctx.font = `800 ${sz}px ${UI_FONT}`; ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.2, sz * 0.22); ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(str, x, y); ctx.fillStyle = color; ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
  return ctx.measureText(str).width;
}
const pad6 = n => String(n).padStart(6, '0');
const STAGE_NAMES = { 1: WUKONG?'云海天宫':'雨林要塞', 2: WUKONG?'南天门 · 破阵登天':'地下指挥所', 3: '峡谷瀑布', 4: '地下基地 · 双生投影', 5: '极地冰原', 6: '高温能源厂', 7: '机械机库', 8: '异形巢穴', 9: '珊瑚浅海', 10: '沉船墓场', 11: '海底火山', 12: '深海洋流', 13: '黑暗深渊', 14: '海底要塞', 15: '冰封海沟', 16: '远古母体' };
const STAGE_NUM = { 1: '第一关', 2: '第二关', 3: '第三关', 4: '第四关', 5: '第五关', 6: '第六关', 7: '第七关', 8: '第八关', 9: '水下第一关', 10: '水下第二关', 11: '水下第三关', 12: '水下第四关', 13: '水下第五关', 14: '水下第六关', 15: '水下第七关', 16: '水下第八关' };
const LAST_STAGE = 8;

let SKY, MTN, JUNGLE, CANYON, SNOWSKY, SNOWMTN, PINES, FACT_BG, FACT_MID, HANG_BG, HANG_MID, LAIR_BG, LAIR_MID, SEA_BG, SEA_MID, SEA_BG2, SEA_MID2, VOLC_BG, VOLC_MID;
function buildBackgrounds() {
  const layer = (w, h, draw) => { const c = mk(w * R, h * R), g = c.getContext('2d'); g.scale(R, R); draw(g); return c; };
  SKY = layer(W, H, g => {
    const gr = g.createLinearGradient(0, 0, 0, 176);
    gr.addColorStop(0, '#070b22'); gr.addColorStop(0.55, '#14264a'); gr.addColorStop(1, '#2b4d63');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      g.globalAlpha = 0.35 + hash(i * 5) * 0.65; g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(hash(i * 7 + 1) * W, hash(i * 13 + 3) * 90, 0.25 + hash(i * 3) * 0.45, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    const mg = g.createRadialGradient(312, 38, 0, 312, 38, 34); mg.addColorStop(0, 'rgba(255,248,214,0.45)'); mg.addColorStop(1, 'rgba(255,248,214,0)');
    g.fillStyle = mg; g.beginPath(); g.arc(312, 38, 34, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f6f0d2'; g.beginPath(); g.arc(312, 38, 11, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(190,180,150,0.45)'; for (const [cx2, cy2, r2] of [[308, 35, 2.4], [315, 42, 1.6], [316, 33, 1.2]]) { g.beginPath(); g.arc(cx2, cy2, r2, 0, Math.PI * 2); g.fill(); }
  });
  MTN = layer(768, H, g => {
    const T2 = Math.PI * 2 / 768;
    const ridge = (base, amps, top, bot) => {
      const gr = g.createLinearGradient(0, base - 30, 0, 176); gr.addColorStop(0, top); gr.addColorStop(1, bot);
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= 768; x += 2) g.lineTo(x, base + amps.reduce((a, [k, A, ph]) => a + A * Math.sin(x * T2 * k + ph), 0));
      g.lineTo(768, H); g.closePath(); g.fill();
    };
    ridge(104, [[2, 14, 0], [5, 8, 1], [13, 3, 2], [31, 1.2, 0.5]], '#20405a', '#152c3f');
    ridge(132, [[3, 10, 0.5], [7, 6, 2], [23, 2, 0], [47, 0.8, 1]], '#173a3a', '#0f2a2a');
  });
  CANYON = layer(W, 432, g => {
    g.fillStyle = '#160f1c'; g.fillRect(0, 0, W, 432);
    const T2 = Math.PI * 2 / 432;
    // waterfall
    const wf = g.createLinearGradient(132, 0, 252, 0);
    wf.addColorStop(0, 'rgba(70,120,170,0.9)'); wf.addColorStop(0.3, 'rgba(170,215,245,0.95)'); wf.addColorStop(0.5, 'rgba(220,242,255,1)'); wf.addColorStop(0.7, 'rgba(170,215,245,0.95)'); wf.addColorStop(1, 'rgba(70,120,170,0.9)');
    g.fillStyle = wf; g.fillRect(132, 0, 120, 432);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.6;
    for (let i = 0; i < 40; i++) { const x = 140 + hash(i * 11) * 104; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (hash(i) - 0.5) * 2, 432); g.stroke(); }
    // canyon walls with strata on both sides of the falls
    for (const side of [0, 1]) {
      const edge = y => side ? 262 + 16 * Math.sin(y * T2 * 2 + 1) + 8 * Math.sin(y * T2 * 5) + 3 * Math.sin(y * T2 * 13) : 122 - 16 * Math.sin(y * T2 * 2) - 8 * Math.sin(y * T2 * 5 + 2) - 3 * Math.sin(y * T2 * 13 + 1);
      const cg = g.createLinearGradient(side ? 384 : 0, 0, side ? 250 : 134, 0); cg.addColorStop(0, '#2a1d22'); cg.addColorStop(1, '#4a363a');
      g.fillStyle = cg; g.beginPath(); g.moveTo(side ? 384 : 0, 0);
      for (let y = 0; y <= 432; y += 3) g.lineTo(edge(y), y);
      g.lineTo(side ? 384 : 0, 432); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(110,84,80,0.55)'; g.lineWidth = 0.8;
      for (let y = 6; y < 432; y += 14) { g.beginPath(); const ex = edge(y); g.moveTo(side ? ex + 4 : 2, y); g.lineTo(side ? 382 : ex - 4, y + (hash(y) - 0.5) * 4); g.stroke(); }
      g.fillStyle = '#2b5a38';
      for (let i = 0; i < 9; i++) { const y = hash(i * 17 + side) * 432, ex = edge(y); g.beginPath(); g.ellipse(side ? ex + 5 : ex - 5, y, 7, 3, 0, 0, Math.PI * 2); g.fill(); }
    }
  });
  SNOWSKY = layer(W, H, g => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#4b6383'); gr.addColorStop(0.55, '#93a9c0'); gr.addColorStop(1, '#d6e0ea');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const sg = g.createRadialGradient(300, 44, 0, 300, 44, 46); sg.addColorStop(0, 'rgba(255,250,235,0.6)'); sg.addColorStop(1, 'rgba(255,250,235,0)');
    g.fillStyle = sg; g.beginPath(); g.arc(300, 44, 46, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fbf7ea'; g.beginPath(); g.arc(300, 44, 10, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.16)';
    for (let i = 0; i < 10; i++) { g.beginPath(); g.ellipse(hash(i * 7 + 2) * W, 16 + hash(i * 5) * 70, 40 + hash(i * 3) * 50, 5 + hash(i) * 6, 0, 0, Math.PI * 2); g.fill(); }
  });
  SNOWMTN = layer(768, H, g => {
    const K = Math.PI / 768;
    const ridge = (base, amps, top, bot, crest) => {
      const yAt = x => base + amps.reduce((a, [k, A, ph]) => a + A * Math.abs(Math.sin(x * K * k + ph)), 0);
      const gr = g.createLinearGradient(0, base - 10, 0, 176); gr.addColorStop(0, top); gr.addColorStop(1, bot);
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= 768; x += 2) g.lineTo(x, yAt(x));
      g.lineTo(768, H); g.closePath(); g.fill();
      if (crest) { g.strokeStyle = crest; g.lineWidth = 1.6; g.lineJoin = 'round'; g.beginPath(); for (let x = 0; x <= 768; x += 2) x ? g.lineTo(x, yAt(x) + 0.6) : g.moveTo(x, yAt(x) + 0.6); g.stroke(); }
    };
    ridge(56, [[3, 34, 0.3], [7, 14, 1.1], [17, 4, 2]], '#f6f9fc', '#a6b8ca', null);
    ridge(104, [[5, 22, 0.8], [11, 8, 0.2], [29, 2, 1.4]], '#8ea3b9', '#62778f', 'rgba(255,255,255,0.85)');
  });
  PINES = layer(768, H, g => {
    const wrap = fn => { for (const o of [-768, 0, 768]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    for (let i = 0; i < 17; i++) {
      const px = i * 45 + hash(i + 11) * 22, th = 46 + hash(i + 40) * 40, hw = th * 0.3, dark = i % 2 === 0;
      wrap(() => {
        g.fillStyle = '#3a2c22'; g.fillRect(px - 1.6, 184 - th * 0.22, 3.2, th * 0.22);
        for (let j = 0; j < 4; j++) {
          const w = hw * (1 - j * 0.2), yb = 184 - th * 0.18 - j * th * 0.2, yt = yb - th * 0.34;
          g.fillStyle = dark ? '#1b3633' : '#22443e'; g.beginPath(); g.moveTo(px - w, yb); g.lineTo(px, yt); g.lineTo(px + w, yb); g.closePath(); g.fill();
          g.fillStyle = '#eef4f8'; g.beginPath(); g.moveTo(px - w * 0.55, yt + (yb - yt) * 0.55); g.lineTo(px, yt); g.lineTo(px + w * 0.55, yt + (yb - yt) * 0.55); g.quadraticCurveTo(px, yt + (yb - yt) * 0.4, px - w * 0.55, yt + (yb - yt) * 0.55); g.fill();
          g.beginPath(); g.ellipse(px - w * 0.8, yb - 0.6, w * 0.22, 1.2, 0, 0, Math.PI * 2); g.ellipse(px + w * 0.8, yb - 0.6, w * 0.22, 1.2, 0, 0, Math.PI * 2); g.fill();
        }
      });
    }
    for (let i = 0; i < 30; i++) {
      const x = i * 26 + hash(i + 5) * 14, r = 8 + hash(i + 21) * 10;
      wrap(() => { g.fillStyle = '#c9d7e4'; g.beginPath(); g.ellipse(x, 184, r * 1.5, r * 0.7, 0, Math.PI, 0); g.fill(); g.fillStyle = '#e8eff5'; g.beginPath(); g.ellipse(x - r * 0.3, 184 - r * 0.2, r, r * 0.4, 0, Math.PI, 0); g.fill(); });
    }
  });
  FACT_BG = layer(768, H, g => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#120a0c'); gr.addColorStop(0.7, '#2a1612'); gr.addColorStop(1, '#40200f');
    g.fillStyle = gr; g.fillRect(0, 0, 768, H);
    const wrap = fn => { for (const o of [-768, 0, 768]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    for (let i = 0; i < 6; i++) {
      const x = i * 128 + hash(i + 7) * 40, w = 64 + hash(i + 3) * 34, h = 96 + hash(i + 13) * 50, top = 196 - h;
      wrap(() => {
        g.fillStyle = '#231a1c'; g.beginPath(); g.moveTo(x, 196); g.lineTo(x, top + 12); g.quadraticCurveTo(x + w / 2, top - 10, x + w, top + 12); g.lineTo(x + w, 196); g.closePath(); g.fill();
        for (let k = 0; k < 3; k++) { const yy = top + 26 + k * 24; g.fillStyle = 'rgba(255,120,40,0.32)'; g.fillRect(x + 2, yy, w - 4, 2); g.fillStyle = 'rgba(255,170,80,0.18)'; g.fillRect(x + 2, yy - 2, w - 4, 1); }
        g.fillStyle = 'rgba(255,150,60,0.55)'; for (let k = 0; k < 3; k++) g.fillRect(x + 10 + k * (w - 26) / 2, top + 16, 6, 4);
      });
    }
    for (let i = 0; i < 5; i++) { const x = i * 154 + 70 + hash(i * 3) * 30; wrap(() => { g.fillStyle = '#1b1315'; g.fillRect(x, 6, 13, 190); g.fillStyle = '#2a1e20'; g.fillRect(x, 6, 3, 190); }); }
    const bg2 = g.createLinearGradient(0, 120, 0, H); bg2.addColorStop(0, 'rgba(255,90,30,0)'); bg2.addColorStop(1, 'rgba(255,90,30,0.28)');
    g.fillStyle = bg2; g.fillRect(0, 120, 768, H - 120);
  });
  FACT_MID = layer(768, H, g => {
    const wrap = fn => { for (const o of [-768, 0, 768]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    // roof truss
    g.fillStyle = '#2c2427'; g.fillRect(0, 0, 768, 15); g.fillStyle = '#3e3438'; g.fillRect(0, 13, 768, 2);
    g.strokeStyle = '#4a3f43'; g.lineWidth = 1.2; g.beginPath(); for (let x = 0; x < 768; x += 16) { g.moveTo(x, 3); g.lineTo(x + 8, 12); g.lineTo(x + 16, 3); } g.stroke();
    // columns with braces
    for (let i = 0; i < 6; i++) {
      const x = i * 128 + 40;
      wrap(() => {
        const cg = g.createLinearGradient(x, 0, x + 12, 0); cg.addColorStop(0, '#463b3f'); cg.addColorStop(1, '#221b1e');
        g.fillStyle = cg; g.fillRect(x, 15, 12, 180);
        g.fillStyle = '#5a4e52'; for (let y = 30; y < 190; y += 22) { g.beginPath(); g.arc(x + 3, y, 0.9, 0, 7); g.arc(x + 9, y, 0.9, 0, 7); g.fill(); }
        g.strokeStyle = 'rgba(70,58,62,0.9)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + 12, 18); g.lineTo(x + 64, 46); g.moveTo(x + 116, 18); g.lineTo(x + 64, 46); g.stroke();
        // hanging lamp
        g.strokeStyle = '#3a3034'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x + 70, 15); g.lineTo(x + 70, 38); g.stroke();
        const lg = g.createRadialGradient(x + 70, 44, 0, x + 70, 44, 26); lg.addColorStop(0, 'rgba(255,190,110,0.32)'); lg.addColorStop(1, 'rgba(255,160,80,0)');
        g.fillStyle = lg; g.beginPath(); g.arc(x + 70, 44, 26, 0, 7); g.fill();
        g.fillStyle = '#4a3f43'; g.beginPath(); g.moveTo(x + 64, 42); g.lineTo(x + 70, 37); g.lineTo(x + 76, 42); g.closePath(); g.fill();
        g.fillStyle = '#ffd08a'; g.beginPath(); g.ellipse(x + 70, 42.6, 3, 1.2, 0, 0, 7); g.fill();
      });
    }
    // pipes with flanges and valves
    for (const [y, w, c] of [[70, 6, '#5a4b47'], [98, 4, '#4a3d3a']]) {
      g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(0, y); g.lineTo(768, y); g.stroke();
      g.strokeStyle = 'rgba(255,220,190,0.22)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, y - w * 0.3); g.lineTo(768, y - w * 0.3); g.stroke();
      g.fillStyle = shade(c, 0.15); for (let x = 20; x < 768; x += 48) g.fillRect(x, y - w / 2 - 1.5, 3, w + 3);
    }
    for (let i = 0; i < 4; i++) { const x = 90 + i * 192; wrap(() => { g.strokeStyle = '#6e4a3a'; g.lineWidth = 1.1; g.beginPath(); g.arc(x, 98, 4.5, 0, 7); g.moveTo(x - 5, 98); g.lineTo(x + 5, 98); g.moveTo(x, 93); g.lineTo(x, 103); g.stroke(); g.strokeStyle = '#4a3d3a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 30, 70); g.lineTo(x + 30, 196); g.stroke(); }); }
  });
  HANG_BG = layer(768, H, g => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b0f17'); gr.addColorStop(0.6, '#1a2432'); gr.addColorStop(1, '#25313f');
    g.fillStyle = gr; g.fillRect(0, 0, 768, H);
    const wrap = fn => { for (const o of [-768, 0, 768]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    // arched roof ribs and floodlights
    for (let i = 0; i < 4; i++) {
      const x = i * 192;
      wrap(() => {
        g.strokeStyle = '#26303e'; g.lineWidth = 5; g.beginPath(); g.moveTo(x, 196); g.quadraticCurveTo(x + 96, -60, x + 192, 196); g.stroke();
        g.strokeStyle = '#1c2430'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 10, 196); g.quadraticCurveTo(x + 96, -40, x + 182, 196); g.stroke();
        const lg = g.createRadialGradient(x + 96, 40, 0, x + 96, 40, 60); lg.addColorStop(0, 'rgba(210,228,255,0.22)'); lg.addColorStop(1, 'rgba(210,228,255,0)');
        g.fillStyle = lg; g.beginPath(); g.arc(x + 96, 40, 60, 0, 7); g.fill();
        g.fillStyle = '#e8f0ff'; g.beginPath(); g.ellipse(x + 96, 32, 5, 1.6, 0, 0, 7); g.fill();
      });
    }
    // big hangar doors with light strips
    for (let i = 0; i < 2; i++) {
      const x = 60 + i * 384;
      wrap(() => {
        g.fillStyle = '#18202b'; g.fillRect(x, 70, 260, 126);
        g.strokeStyle = '#222c39'; g.lineWidth = 1; g.beginPath(); for (let k = 0; k <= 260; k += 26) { g.moveTo(x + k, 70); g.lineTo(x + k, 196); } g.stroke();
        g.fillStyle = 'rgba(160,200,255,0.25)'; g.fillRect(x, 70, 260, 2);
        // parked aircraft silhouette (original design)
        const ax = x + 60, ay = 172;
        g.fillStyle = '#101620'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + 40, ay - 10); g.lineTo(ax + 120, ay - 12); g.lineTo(ax + 150, ay - 30); g.lineTo(ax + 160, ay - 30); g.lineTo(ax + 150, ay - 8); g.lineTo(ax + 120, ay + 2); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(ax + 60, ay - 8); g.lineTo(ax + 110, ay + 18); g.lineTo(ax + 120, ay + 18); g.lineTo(ax + 100, ay - 9); g.closePath(); g.fill();
        g.fillStyle = 'rgba(120,180,255,0.35)'; g.beginPath(); g.ellipse(ax + 30, ay - 10, 10, 3, -0.15, 0, 7); g.fill();
      });
    }
    const bg2 = g.createLinearGradient(0, 140, 0, H); bg2.addColorStop(0, 'rgba(120,160,220,0)'); bg2.addColorStop(1, 'rgba(120,160,220,0.12)');
    g.fillStyle = bg2; g.fillRect(0, 140, 768, H - 140);
  });
  HANG_MID = layer(768, H, g => {
    const wrap = fn => { for (const o of [-768, 0, 768]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    g.fillStyle = '#222b37'; g.fillRect(0, 0, 768, 14); g.fillStyle = '#34404e'; g.fillRect(0, 12, 768, 2);
    g.strokeStyle = '#3a4656'; g.lineWidth = 1.2; g.beginPath(); for (let x = 0; x < 768; x += 16) { g.moveTo(x, 2); g.lineTo(x + 8, 11); g.lineTo(x + 16, 2); } g.stroke();
    // gantry crane beam with a hook
    g.fillStyle = '#2c3746'; g.fillRect(0, 40, 768, 6); g.fillStyle = '#d6b23a'; for (let x = 0; x < 768; x += 24) g.fillRect(x, 41, 12, 1.4);
    for (let i = 0; i < 3; i++) { const x = 120 + i * 256; wrap(() => { g.fillStyle = '#3a4656'; g.fillRect(x - 8, 46, 16, 8); g.strokeStyle = '#56626e'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - 2, 54); g.lineTo(x - 2, 96); g.moveTo(x + 2, 54); g.lineTo(x + 2, 96); g.stroke(); g.strokeStyle = '#8a96a4'; g.lineWidth = 2; g.beginPath(); g.arc(x, 100, 4, -0.3, Math.PI + 0.6); g.stroke(); }); }
    // columns
    for (let i = 0; i < 6; i++) { const x = i * 128 + 20; wrap(() => { const cg = g.createLinearGradient(x, 0, x + 12, 0); cg.addColorStop(0, '#3a4656'); cg.addColorStop(1, '#1c242e'); g.fillStyle = cg; g.fillRect(x, 14, 12, 182); g.fillStyle = '#d6b23a'; g.fillRect(x, 150, 12, 3); g.fillStyle = '#1a1a1a'; for (let k = 0; k < 12; k += 4) g.fillRect(x + k, 150, 2, 3); }); }
    // crate stacks
    for (let i = 0; i < 5; i++) {
      const x = i * 154 + 50 + hash(i * 5) * 40, n = 1 + (hash(i * 3) * 3 | 0);
      wrap(() => { for (let k = 0; k < n; k++) { const w = 26, y = 190 - (k + 1) * 20, xx = x + (k % 2) * 6; g.fillStyle = '#4a3c2c'; g.fillRect(xx, y, w, 20); g.strokeStyle = '#2e251b'; g.lineWidth = 1; g.strokeRect(xx + 0.5, y + 0.5, w - 1, 19); g.beginPath(); g.moveTo(xx, y); g.lineTo(xx + w, y + 20); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(xx, y, w, 1.5); } });
    }
  });
  LAIR_BG = layer(768, H, g => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0d030b'); gr.addColorStop(0.6, '#22081a'); gr.addColorStop(1, '#300c22');
    g.fillStyle = gr; g.fillRect(0, 0, 768, H);
    const wrap = fn => { for (const o of [-768, 0, 768]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    // giant rib arches
    for (let i = 0; i < 6; i++) {
      const x = i * 128 + 30;
      wrap(() => {
        g.strokeStyle = '#2c0e24'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, 200); g.quadraticCurveTo(x + 20, 40, x + 90, 10); g.stroke();
        g.strokeStyle = '#3c1630'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 2, 200); g.quadraticCurveTo(x + 18, 42, x + 88, 9); g.stroke();
      });
    }
    // translucent membranes
    for (let i = 0; i < 5; i++) { const x = i * 154 + hash(i) * 60, y = 40 + hash(i * 3) * 60; wrap(() => { g.fillStyle = 'rgba(130,40,100,0.22)'; g.beginPath(); g.ellipse(x, y, 40 + hash(i * 7) * 30, 24 + hash(i * 5) * 16, hash(i) - 0.5, 0, 7); g.fill(); }); }
    // bioluminescent spots
    for (let i = 0; i < 40; i++) {
      const x = hash(i * 7 + 1) * 768, y = 20 + hash(i * 13 + 3) * 160, r = 4 + hash(i * 3) * 9;
      wrap(() => { const lg = g.createRadialGradient(x, y, 0, x, y, r); lg.addColorStop(0, 'rgba(90,230,200,0.2)'); lg.addColorStop(1, 'rgba(90,230,200,0)'); g.fillStyle = lg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    }
  });
  LAIR_MID = layer(768, H, g => {
    const wrap = fn => { for (const o of [-768, 0, 768]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    // hanging tendrils ending in glowing bulbs
    for (let i = 0; i < 14; i++) {
      const x = i * 55 + hash(i + 5) * 30, L = 40 + hash(i + 9) * 70, sw = (hash(i * 3) - 0.5) * 30;
      wrap(() => {
        g.strokeStyle = '#3a1430'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + sw, L * 0.4, x - sw, L * 0.7, x + sw * 0.3, L); g.stroke();
        const lg = g.createRadialGradient(x + sw * 0.3, L + 2, 0, x + sw * 0.3, L + 2, 8); lg.addColorStop(0, 'rgba(200,90,160,0.28)'); lg.addColorStop(1, 'rgba(200,90,160,0)');
        g.fillStyle = lg; g.beginPath(); g.arc(x + sw * 0.3, L + 2, 8, 0, 7); g.fill();
        g.fillStyle = '#6a2a5c'; g.beginPath(); g.ellipse(x + sw * 0.3, L + 2, 2.6, 3.2, 0, 0, 7); g.fill();
      });
    }
    // egg clusters near the floor
    for (let i = 0; i < 8; i++) {
      const x = i * 96 + hash(i * 11) * 50;
      wrap(() => { for (let k = 0; k < 5; k++) { const ex = x + (k - 2) * 7 + hash(i * 5 + k) * 4, ey = 188 - hash(i + k * 3) * 14; g.fillStyle = '#4a1e40'; g.beginPath(); g.ellipse(ex, ey, 5, 6.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,200,240,0.25)'; g.beginPath(); g.ellipse(ex - 1.5, ey - 2.5, 1.6, 2, 0, 0, 7); g.fill(); } });
    }
  });
  SEA_BG = layer(W, H, g => {
    const sk = g.createLinearGradient(0, 0, 0, 18); sk.addColorStop(0, '#9fd8f0'); sk.addColorStop(1, '#d8f2fa'); g.fillStyle = sk; g.fillRect(0, 0, W, 18);
    const gr = g.createLinearGradient(0, 18, 0, H); gr.addColorStop(0, '#2aa0c8'); gr.addColorStop(0.45, '#1670a0'); gr.addColorStop(1, '#0a3460');
    g.fillStyle = gr; g.fillRect(0, 18, W, H - 18);
    // static light shafts from the surface
    for (let i = 0; i < 7; i++) { const x = 20 + i * 58 + hash(i) * 20, w = 10 + hash(i * 3) * 14; const lg = g.createLinearGradient(0, 18, 0, 170); lg.addColorStop(0, 'rgba(220,250,255,0.22)'); lg.addColorStop(1, 'rgba(220,250,255,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(x, 18); g.lineTo(x + w, 18); g.lineTo(x + w + 30, 170); g.lineTo(x + 30, 170); g.closePath(); g.fill(); }
  });
  SEA_MID = layer(768, H, g => {
    const wrap = fn => { for (const o of [-768, 0, 768]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    // distant reef silhouettes and kelp
    g.fillStyle = 'rgba(10,50,90,0.55)'; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= 768; x += 4) g.lineTo(x, 170 - 18 * Math.abs(Math.sin(x * Math.PI / 768 * 5 + 0.6)) - 8 * Math.abs(Math.sin(x * Math.PI / 768 * 13)));
    g.lineTo(768, H); g.closePath(); g.fill();
    for (let i = 0; i < 16; i++) { const x = i * 48 + hash(i * 5) * 30, L = 40 + hash(i * 7) * 60; wrap(() => { g.strokeStyle = 'rgba(20,90,80,0.55)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, 196); g.bezierCurveTo(x + 8, 196 - L * 0.3, x - 8, 196 - L * 0.7, x + 4, 196 - L); g.stroke(); }); }
  });
  SEA_BG2 = layer(W, H, g => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0c4468'); gr.addColorStop(0.5, '#082c4c'); gr.addColorStop(1, '#03142a');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) { const x = 30 + i * 80 + hash(i + 3) * 20, w = 8 + hash(i * 5) * 10; const lg = g.createLinearGradient(0, 0, 0, 140); lg.addColorStop(0, 'rgba(160,220,255,0.12)'); lg.addColorStop(1, 'rgba(160,220,255,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w + 26, 140); g.lineTo(x + 26, 140); g.closePath(); g.fill(); }
  });
  SEA_MID2 = layer(768, H, g => {
    const wrap = fn => { for (const o of [-768, 0, 768]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    // distant wreck silhouettes: tilted hulls, a funnel and broken masts
    for (let i = 0; i < 3; i++) {
      const x = 60 + i * 256, y = 176 - hash(i) * 20, ang = (hash(i * 3) - 0.5) * 0.25;
      wrap(() => {
        g.save(); g.translate(x + 80, y); g.rotate(ang); g.fillStyle = 'rgba(6,26,44,0.75)';
        g.beginPath(); g.moveTo(-90, 0); g.lineTo(-80, -26); g.lineTo(84, -26); g.lineTo(100, -10); g.lineTo(90, 0); g.closePath(); g.fill();
        g.fillRect(-30, -44, 22, 18); g.fillRect(20, -70, 3, 44); g.fillRect(-60, -60, 2.5, 34); g.fillRect(14, -58, 16, 2);
        g.restore();
      });
    }
    g.fillStyle = 'rgba(6,26,44,0.6)'; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= 768; x += 4) g.lineTo(x, 188 - 6 * Math.abs(Math.sin(x * Math.PI / 768 * 7)));
    g.lineTo(768, H); g.closePath(); g.fill();
  });
  VOLC_BG = layer(W, H, g => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1a0c10'); gr.addColorStop(0.6, '#2c1210'); gr.addColorStop(1, '#4a1a0e');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const lg = g.createLinearGradient(0, 120, 0, H); lg.addColorStop(0, 'rgba(255,100,30,0)'); lg.addColorStop(1, 'rgba(255,100,30,0.25)'); g.fillStyle = lg; g.fillRect(0, 120, W, H - 120);
  });
  VOLC_MID = layer(768, H, g => {
    const wrap = fn => { for (const o of [-768, 0, 768]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 192, h = 70 + hash(i * 3) * 40, top = 196 - h;
      wrap(() => {
        g.fillStyle = 'rgba(30,12,12,0.85)'; g.beginPath(); g.moveTo(x - 70, 200); g.lineTo(x - 12, top); g.lineTo(x + 12, top); g.lineTo(x + 70, 200); g.closePath(); g.fill();
        const cg = g.createRadialGradient(x, top, 0, x, top, 30); cg.addColorStop(0, 'rgba(255,120,40,0.45)'); cg.addColorStop(1, 'rgba(255,80,20,0)'); g.fillStyle = cg; g.beginPath(); g.arc(x, top, 30, 0, 7); g.fill();
        g.strokeStyle = 'rgba(255,110,40,0.45)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 2, top + 2); g.quadraticCurveTo(x - 10, top + 30, x - 20, top + 60); g.moveTo(x + 3, top + 2); g.quadraticCurveTo(x + 12, top + 40, x + 26, top + 70); g.stroke();
      });
    }
  });
  JUNGLE = layer(768, H, g => {
    const wrap = fn => { for (const o of [-768, 0, 768]) { g.save(); g.translate(o, 0); fn(); g.restore(); } };
    // palms
    for (let i = 0; i < 13; i++) {
      const px = i * 60 + hash(i + 3) * 30, th = 64 + hash(i + 50) * 46, lean = (hash(i + 9) - 0.5) * 26, dark = i % 2 === 0;
      wrap(() => {
        const tx = px + lean, ty = 182 - th;
        g.strokeStyle = dark ? '#2a1d14' : '#3b2a1b'; g.lineWidth = 3.6; g.lineCap = 'round';
        g.beginPath(); g.moveTo(px, 182); g.quadraticCurveTo(px + lean * 0.2, 182 - th * 0.6, tx, ty); g.stroke();
        g.strokeStyle = dark ? '#3a2a1c' : '#55402a'; g.lineWidth = 1;
        for (let k = 1; k < 12; k++) { const t = k / 12, x = (1 - t) * (1 - t) * px + 2 * (1 - t) * t * (px + lean * 0.2) + t * t * tx, y = 182 - th * (t * 0.6 * 2 * (1 - t) + t * t * 1) ; g.beginPath(); g.moveTo(x - 1.6, y); g.lineTo(x + 1.6, y + 0.6); g.stroke(); }
        for (let f = 0; f < 8; f++) {
          const a = -Math.PI + f * (Math.PI / 7) + (hash(i * 7 + f) - 0.5) * 0.3, L = 20 + hash(i * 11 + f) * 8;
          const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + L * 0.35;
          g.strokeStyle = dark ? '#173d26' : '#20553a'; g.lineWidth = 2.2;
          g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - 4, ex, ey); g.stroke();
          g.strokeStyle = dark ? '#1f5233' : '#2d7048'; g.lineWidth = 0.8;
          for (let q = 1; q < 6; q++) { const t = q / 6, mx = tx + (ex - tx) * t, my = ty + (ey - ty) * t - Math.sin(t * Math.PI) * 3; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.cos(a + 1.2) * 4, my + 3.5); g.stroke(); }
        }
      });
    }
    // undergrowth
    for (let i = 0; i < 34; i++) {
      const x = i * 23 + hash(i + 77) * 12, r = 8 + hash(i + 33) * 9;
      wrap(() => {
        g.fillStyle = '#123824'; g.beginPath(); g.ellipse(x, 182, r * 1.3, r, 0, Math.PI, 0); g.fill();
        g.fillStyle = '#1b4d30'; g.beginPath(); g.ellipse(x - r * 0.3, 182 - r * 0.35, r * 0.7, r * 0.45, 0, Math.PI, 0); g.fill();
      });
    }
  });
}
const PAL_P = { skin: '#f2c29b', hair: '#4a2a18', band: '#f6c33b', vest: '#d63a24', pants: '#2f5fbf', boots: '#2a2320', gun: '#9aa4ae' };
const PAL_P2 = { ...PAL_P, band: '#3cbcfc', vest: '#0058f8', pants: '#6888fc' };
function playerPalette(palette=PAL_P){return !cooperative()&&palette===PAL_P?PAL_P2:palette;}
function drawCoopPartner(base = false) {
  if (!cooperative() || !G.p2) return;
  const p = G.p2;
  if (p.invT > 0 && !p.dead && (G.t >> 2) % 2 === 0) return;
  let pose = p.dead ? 'dead' : p.inWater ? p.dive ? 'dive' : 'water' : p.spin ? 'spin' : p.prone ? 'prone' : p.vx && p.onGround ? 'run' : 'stand';
  const o = { face: p.dead ? -p.face : p.face, frame: p.anim, pal: PAL_P2, ax: p.ax, ay: p.ay };
  ctx.save();
  if (p.giantT > 0 && !p.dead) { ctx.translate(p.x, p.y); ctx.scale(2, 2); ctx.translate(-p.x, -p.y); }
  if (base) drawBack(p.x, p.y, pose, { ...o, ax: p.aimDx || 0,aimUp:!!p.aimUp });
  else if (!p.dead && p.ride === 'heli') { drawHeli(p); drawSoldier(p.x, p.y - 2, 'stand', o); }
  else if (!p.dead && p.ride === 'moto') { drawSoldier(p.x, p.y - 9, 'stand', o); drawMoto(p); }
  else drawSoldier(p.x, p.y, pose, o);
  ctx.restore();
  if (p.shieldT > 0 && !p.dead) { const b = pBox(p); if (b) { ctx.strokeStyle = '#3cbcfc'; ctx.lineWidth = 1; ctx.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6); } }
  if (p.flashT > 0 && !p.dead && !(isBase()&&(G.base.trans>0||G.base.dead))) F(p.fx - 2, p.fy - 2, 4, 4, '#fcfcfc');
}
const PAL_E = { skin: '#e2b48c', hair: '#2b2b2b', band: '#707a84', vest: '#a7ae9e', pants: '#68705f', boots: '#2a2a26', gun: '#5d646c' };
const PAL_W = { skin: '#ffffff', hair: '#ffffff', band: '#ffffff', vest: '#ffffff', pants: '#ffffff', boots: '#ffffff', gun: '#ffffff' };

function drawSoldier(x, y, pose, o) {
  // side view, drawn facing right in local space and mirrored for the other direction
  const P = o.flash ? PAL_W : playerPalette(o.pal), f = o.face || 1, fr = o.frame || 0;
  if (pose === 'dive') { ctx.strokeStyle = '#cfeaff'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(x, WATER.surf, 5 + Math.sin(G.t * 0.2), 1.2, 0, 0, Math.PI * 2); ctx.stroke(); el(x, WATER.surf - 0.6, 1.6, 1, P.hair); return; }
  if (pose === 'water') { y = WATER.surf + 14; pose = 'stand'; }
  const role=o.pal===PAL_P?StageOneArt.playerRole(cooperative()):o.pal===PAL_P2?'blue':'enemy';
  if(stageOneArt.hdActors.ready(role)){
    ctx.save();ctx.translate(x,y);ctx.scale(f,1);
    if(o.flash)ctx.globalAlpha*=.45;
    const death=pose==='dead'?(o.pal===PAL_P2&&cooperative()?G.p2:G.p):null;
    const actorState={...death,vx:pose==='run'?(role==='enemy'?62:90):0,onGround:pose==='run',
      anim:fr,ay:o.ay||0,spin:pose==='spin',dead:pose==='dead',prone:pose==='prone'};
    stageOneArt.hdActors.draw(ctx,actorState,role,R);
    const actor=role==='enemy'?null:o.pal===PAL_P2?G.p2:G.p;
    if(actor?.helmT>0)drawImpactHelmet(ctx,stageThreeArt.images.impactHelmet,{...actorState,helmT:actor.helmT,ride:actor.ride,inWater:actor.inWater},role,G.t);
    ctx.restore();return;
  }
  ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
  const tails = Math.sin(G.t * 0.25 + x * 0.1) * 1.2;
  if (pose === 'spin') {
    ctx.translate(0, -15); ctx.rotate(fr * 1.6);
    seg(0, 3, 4.5, 6.5, 3, P.pants); seg(0, 3, -3.5, 6.5, 3, shade(P.pants, -0.2));
    el(0, 0, 5.2, 5.2, P.vest); el(-1.5, 0, 2.6, 4.4, shade(P.vest, -0.2));
    el(0, -5.6, 3, 3, P.skin); rr(-3, -7.2, 6, 1.4, 0.6, P.band);
    seg(2, -1, 5.5, -3.5, 2, P.skin);
    ctx.restore(); return;
  }
  if (pose === 'prone' || pose === 'dead') {
    seg(-12, -2.4, -4, -2.6, 3.2, shade(P.pants, -0.15)); seg(-11, -1.6, -4, -2, 3, P.pants);
    el(-13, -1.8, 1.8, 1.5, P.boots);
    rr(-4.6, -6.2, 10, 5.6, 2.4, P.vest); rr(-4.6, -6.2, 10, 2, 1.2, shade(P.vest, 0.15));
    el(7.2, -4.4, 3.3, 3.2, P.skin); el(7, -6, 3.3, 1.8, P.hair); rr(4, -6.4, 6.6, 1.4, 0.6, P.band);
    seg(4, -5.6, 1, -6.2 + tails * 0.5, 1.1, P.band);
    if (pose === 'prone') { seg(3, -2.8, 9.5, -2.6, 2.2, P.skin); seg(8, -2.8, 17, -2.8, 2.4, P.gun); el(17, -2.8, 0.9, 0.9, shade(P.gun, 0.45)); }
    ctx.restore(); return;
  }
  // legs (far leg first, slightly darker)
  const run = pose === 'run', ph = fr * Math.PI / 2;
  [Math.sin(ph + Math.PI), Math.sin(ph)].forEach((sw, i) => {
    const w0 = run ? sw : (i ? 0.15 : -0.15), c = i ? P.pants : shade(P.pants, -0.22);
    const kx = 0.5 + w0 * 4.2, ky = -6.6 - Math.max(0, w0) * 1.4;
    const fx2 = 0.5 + w0 * 6.2, fy2 = run ? -0.9 - Math.max(0, -w0) * 2.4 : -0.7;
    seg(0.5, -12.4, kx, ky, 3.4, c); seg(kx, ky, fx2, fy2, 3, c);
    rr(fx2 - 1.6, fy2 - 1.3, 4.6, 2.5, 1, i ? P.boots : shade(P.boots, -0.2));
  });
  // torso
  rr(-4, -25, 8.6, 13.6, 2.4, P.vest); rr(-4, -25, 3, 13.6, 2, shade(P.vest, -0.22));
  seg(3.1, -23.4, 3.1, -14.6, 0.9, shade(P.vest, 0.28));
  rr(-4.2, -13.7, 9, 1.9, 0.8, '#3a2a1c'); rr(1.4, -13.6, 1.7, 1.6, 0.3, '#e8c25a');
  // head
  el(-0.2, -28.2, 0.9, 1.1, shade(P.skin, -0.18));
  el(0.9, -28.6, 3.5, 3.7, P.skin);
  el(0.5, -30.6, 3.7, 2.1, P.hair); el(-2.1, -28.8, 1.4, 2.3, P.hair);
  rr(-2.9, -30.4, 7.4, 1.7, 0.7, P.band);
  seg(-2.8, -29.6, -6.8, -29.4 + tails, 1.2, P.band); seg(-2.8, -29.2, -6.1, -27.6 + tails, 1.1, shade(P.band, -0.22));
  el(3.1, -28.8, 0.55, 0.75, '#1b1b1b');
  // arm and gun
  let ax = (o.ax || 0) * f, ay = o.ay || 0;
  const l = Math.hypot(ax, ay) || 1; ax /= l; ay /= l;
  const shx = 1, shy = ay < -0.9 ? -24 : -22.5;
  const gx0 = shx + ax * 2.5, gy0 = shy + ay * 2.5, gx1 = shx + ax * 13, gy1 = shy + ay * 13;
  seg(shx - 1, shy + 0.5, shx + ax * 5.5, shy + ay * 5.5, 2.3, shade(P.skin, -0.12));
  seg(gx0, gy0, gx1, gy1, 2.6, P.gun); seg(gx0, gy0, shx + ax * 7, shy + ay * 7, 1.4, shade(P.gun, -0.4));
  el(gx1, gy1, 0.9, 0.9, shade(P.gun, 0.45));
  seg(shx + 0.5, shy + 1, shx + ax * 8, shy + ay * 8 + 0.5, 2.2, P.skin); el(shx + ax * 8, shy + ay * 8 + 0.5, 1.3, 1.3, P.skin);
  ctx.restore();
}
function gun(sx, sy, ax, ay, P, n) {
  for (let i = 0; i <= n; i++) F(sx + ax * i - 1, sy + ay * i - 1, 2, 2, i < 3 ? P.skin : P.gun);
}
function drawGround(cx) {
  for (const s of solids) {
    if (s.gone || s.x + s.w < cx - 2 || s.x > cx + W + 2 || s.y > G.camY + H + 10 || s.y + s.h < G.camY - 14) continue;
    if (s.bridge) { drawBridgeSeg(s); continue; }
    const x0 = Math.max(s.x, cx - 8), x1 = Math.min(s.x + s.w, cx + W + 8);
    if (s.g && s.water) { rr(x0, s.y, x1 - x0, s.h, 0, '#2a1d14'); continue; }
    ctx.save(); ctx.beginPath(); ctx.rect(s.x, s.y - 4, s.w, s.h + 4); ctx.clip();
    if (s.g) {
      const gr = ctx.createLinearGradient(0, s.y, 0, s.y + s.h); gr.addColorStop(0, '#4a4f58'); gr.addColorStop(1, '#2b2e35');
      ctx.fillStyle = gr; ctx.fillRect(x0, s.y + 4, x1 - x0, s.h - 4);
      // stone blocks with soft highlights and dark mortar
      for (let by2 = s.y + 6, row = 0; by2 < s.y + s.h; by2 += 9, row++) {
        const off = row % 2 ? 7 : 0;
        for (let bx2 = Math.floor((x0 - s.x - off) / 14) * 14 + s.x + off; bx2 < x1; bx2 += 14) {
          const r = hash(bx2 * 13 + by2 * 7), base = r < 0.33 ? '#6c7380' : r < 0.66 ? '#636a76' : '#747b88';
          rr(bx2 + 0.5, by2 + 0.5, 13, 8, 2.2, base);
          rr(bx2 + 1.4, by2 + 1.2, 11.2, 2, 1, shade(base, 0.18));
          rr(bx2 + 1.4, by2 + 6.4, 11.2, 1.4, 0.8, shade(base, -0.25));
          if (r > 0.7) seg(bx2 + 4, by2 + 3, bx2 + 7 + r * 3, by2 + 5.5, 0.5, '#3a3f48');
        }
      }
      // grass cap: gradient band, a soft fringe and fine blades
      const gg = ctx.createLinearGradient(0, s.y, 0, s.y + 6); gg.addColorStop(0, '#5bc25a'); gg.addColorStop(1, '#2a7a3a');
      ctx.fillStyle = gg; ctx.fillRect(x0, s.y, x1 - x0, 5.2);
      ctx.fillStyle = '#245f30';
      for (let gx = Math.floor(x0 / 5) * 5; gx < x1; gx += 5) { const r = hash(gx * 17 + 5); ctx.beginPath(); ctx.moveTo(gx, s.y + 5); ctx.lineTo(gx + 2.5, s.y + 6.5 + r * 3); ctx.lineTo(gx + 5, s.y + 5); ctx.fill(); }
      ctx.strokeStyle = '#8be07a'; ctx.lineWidth = 0.55; ctx.beginPath();
      for (let gx = Math.floor(x0 / 2) * 2; gx < x1; gx += 2) { const r = hash(gx * 31 + 9); if (r < 0.45) continue; ctx.moveTo(gx, s.y + 1); ctx.lineTo(gx + (r - 0.7) * 2, s.y - 1 - r * 2.2); }
      ctx.stroke();
    } else {
      const gr = ctx.createLinearGradient(0, s.y, 0, s.y + 8); gr.addColorStop(0, '#7a808c'); gr.addColorStop(1, '#3d424b');
      ctx.fillStyle = gr; if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(s.x, s.y, s.w, 8, [0, 0, 3, 3]); ctx.fill(); } else ctx.fillRect(s.x, s.y, s.w, 8);
      for (let lx = s.x + 9; lx < s.x + s.w - 2; lx += 12) seg(lx, s.y + 3.5, lx, s.y + 7, 0.5, '#2e3239');
      const gg = ctx.createLinearGradient(0, s.y, 0, s.y + 3.4); gg.addColorStop(0, '#5bc25a'); gg.addColorStop(1, '#2a7a3a');
      ctx.fillStyle = gg; ctx.fillRect(s.x, s.y, s.w, 3.2);
      ctx.restore(); ctx.save();
      ctx.strokeStyle = '#2f6a35'; ctx.lineWidth = 0.7; ctx.beginPath();
      for (let vx = s.x + 3; vx < s.x + s.w - 2; vx += 7) { const r = hash(vx * 13 + s.y); if (r > 0.5) { ctx.moveTo(vx, s.y + 8); ctx.quadraticCurveTo(vx + 1.5, s.y + 10 + r * 4, vx, s.y + 11 + r * 9); } }
      ctx.stroke();
    }
    ctx.restore();
  }
}
function drawBridgeSeg(s) {
  const x = s.x, y = s.y, b = s.bridge;
  // stone piers at both ends, standing in the river
  if (s.seg === 0) { F(x - 2, y + 10, 8, H - y - 10, '#3a3346'); F(x - 2, y + 10, 8, 1, '#5a5068'); }
  if (s.seg === b.n - 1) { F(x + SEG_W - 6, y + 10, 8, H - y - 10, '#3a3346'); F(x + SEG_W - 6, y + 10, 8, 1, '#5a5068'); }
  // railing
  F(x, y - 7, SEG_W, 1, '#a3a7b4');
  for (let px = x + 3; px < x + SEG_W; px += 8) F(px, y - 6, 1, 6, '#6b6f7c');
  // deck
  F(x, y, SEG_W, 4, '#868b99'); F(x, y, SEG_W, 1, '#cdd1db'); F(x, y + 4, SEG_W, 1, '#2f313a');
  for (let px = x + 7; px < x + SEG_W; px += 8) F(px, y + 1, 1, 3, '#646875');
  // truss under the deck
  F(x, y + 10, SEG_W, 1, '#4b4f5c');
  pline(x + 1, y + 5, x + 15, y + 10, '#4b4f5c'); pline(x + 16, y + 10, x + 30, y + 5, '#4b4f5c');
  pline(x + 1, y + 10, x + 15, y + 5, '#3d404b'); pline(x + 16, y + 5, x + 30, y + 10, '#3d404b');
  // warning light on an armed section that is next to go
  if (b.armed && b.next === s.seg && (G.t >> 2) % 2) F(x + 14, y - 10, 3, 3, '#ff3b3b');
}
function drawWater(cx) {
  if (WATER.x1 < cx || WATER.x0 > cx + W) return;
  const t = G.t || 0, x0 = Math.max(WATER.x0, cx - 4), x1 = Math.min(WATER.x1, cx + W + 4);
  const gr = ctx.createLinearGradient(0, WATER.surf, 0, H); gr.addColorStop(0, 'rgba(46,134,199,0.82)'); gr.addColorStop(1, 'rgba(14,44,110,0.96)');
  ctx.fillStyle = gr; ctx.fillRect(x0, WATER.surf, x1 - x0, H - WATER.surf);
  ctx.strokeStyle = '#d6f1ff'; ctx.lineWidth = 0.9; ctx.beginPath();
  for (let x = x0; x <= x1; x += 2) { const y = WATER.surf + Math.sin((x + t * 0.8) / 7) * 0.7; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(160,220,255,0.45)'; ctx.lineWidth = 0.6; ctx.beginPath();
  for (let x = Math.floor(x0 / 22) * 22; x < x1; x += 22) {
    const o1 = (t * 0.25 + x * 0.3) % 22, o2 = (t * 0.15 + x * 0.7) % 22;
    ctx.moveTo(x + o1, WATER.surf + 6); ctx.lineTo(x + o1 + 7, WATER.surf + 6);
    ctx.moveTo(x + 11 - o2 * 0.5, WATER.surf + 11); ctx.lineTo(x + 15 - o2 * 0.5, WATER.surf + 11);
  }
  ctx.stroke();
}
function drawTurret(e) {
  if(!WUKONG&&drawEquipmentTurret(ctx,stageOneArt.images.equipmentTurret,e,{frozen:G.freezeT>0}))return;
  const x = Math.round(e.x), y = Math.round(e.y), fl = e.flash > 0;
  F(x - 6, y + 8, 12, 8, fl ? '#fcfcfc' : '#7c7c7c'); if (!fl) { F(x - 6, y + 8, 12, 1, '#bcbcbc'); F(x - 6, y + 15, 12, 1, '#000000'); F(x - 4, y + 11, 2, 2, '#000000'); F(x + 2, y + 11, 2, 2, '#000000'); }
  F(x - 8, y - 8, 16, 16, fl ? '#fcfcfc' : '#000000');
  if (!fl) {
    F(x - 7, y - 7, 14, 14, '#7c7c7c'); F(x - 7, y - 7, 14, 1, '#bcbcbc'); F(x - 7, y - 7, 1, 14, '#bcbcbc');
    for (const [dx, dy] of [[-6, -6], [4, -6], [-6, 4], [4, 4]]) F(x + dx, y + dy, 2, 2, '#fcfcfc');
    disc(ctx, x, y, 5, '#000000'); disc(ctx, x, y, 3, '#7c7c7c');
  }
  const ang = e.idx * Math.PI / 6, c = Math.cos(ang), s = Math.sin(ang);
  for (let i = 2; i <= 10; i++) F(x + c * i - 1, y + s * i - 1, 3, 3, fl ? '#fcfcfc' : '#000000');
  F(x - 1, y - 1, 2, 2, (G.t >> 4) % 2 ? '#f83800' : '#a81000');
}
function drawBox(e) {
  if(!WUKONG&&drawEquipmentSupply(ctx,stageOneArt.images.equipmentSupply,e))return;
  const x = Math.round(e.x), y = Math.round(e.y), fl = e.flash > 0;
  F(x - 10, y - 10, 20, 10, fl ? '#fcfcfc' : '#7c7c7c'); F(x - 10, y - 10, 20, 1, '#bcbcbc'); F(x - 10, y - 1, 20, 1, '#000000');
  for (let i = 0; i < 5; i++) F(x - 9 + i * 4, y - 4, 2, 2, i % 2 ? '#ffc94a' : '#1b1b1b');
  if (e.open) {
    F(x - 8, y - 24, 16, 14, fl ? '#fcfcfc' : '#000000'); F(x - 8, y - 24, 16, 1, '#bcbcbc');
    disc(ctx, x, y - 16, 4, fl ? '#fff' : ((G.t >> 3) % 2 ? '#ff3b2b' : '#ffd27a'));
    F(x - 14, y - 26, 6, 2, '#bcbcbc'); F(x + 8, y - 26, 6, 2, '#bcbcbc');
  } else {
    F(x - 9, y - 12, 18, 2, fl ? '#fcfcfc' : '#bcbcbc');
    F(x - 1, y - 8, 2, 2, (G.t >> 4) % 2 ? '#8a1f1f' : '#3a1414');
  }
}
function drawMoto(p) {
  const x = Math.round(p.x), y = Math.round(p.y), f = p.face;
  const M = (dx, dy, w, h, c) => F(f > 0 ? x + dx : x - dx - w, y + dy, w, h, c);
  const spoke = Math.floor(p.anim) % 2;
  for (const wx of [-10, 9]) { const cx = f > 0 ? x + wx : x - wx; disc(ctx, cx, y - 5, 5, '#15141a'); disc(ctx, cx, y - 5, 2, '#9da1ae'); F(cx - (spoke ? 3 : 0), y - 5 - (spoke ? 0 : 3), spoke ? 7 : 1, spoke ? 1 : 7, '#4b4f5c'); }
  M(-12, -12, 22, 3, '#c43a26'); M(-6, -15, 12, 3, '#e2553a'); M(-12, -14, 5, 2, '#2a2a30');
  M(-8, -9, 9, 4, '#3a3a44'); M(-14, -8, 5, 2, '#6b6f7c');
  M(7, -18, 2, 7, '#2a2a30'); M(7, -19, 5, 2, '#9da1ae'); M(11, -13, 3, 2, '#ffe27a');
  if ((G.t >> 2) % 3 === 0 && p.vx) G.fx.push({ k: 'smoke', x: x - f * 15, y: y - 7, t: 0, life: 0.3 });
}
function drawHeli(p) {
  const x = Math.round(p.x), y = Math.round(p.y), f = p.face;
  const M = (dx, dy, w, h, c) => F(f > 0 ? x + dx : x - dx - w, y + dy, w, h, c);
  M(-28, -10, 17, 3, '#4f6b3a'); M(-30, -15, 3, 9, '#3b5230');
  M(-31, (G.t >> 1) % 2 ? -18 : -9, 1, 6, '#2a2a30');
  M(-12, -14, 24, 14, '#5c7a42'); M(-12, -14, 24, 1, '#86a86a'); M(-12, -1, 24, 1, '#2c3b22'); M(-12, -14, 2, 14, '#4f6b3a');
  M(2, -13, 9, 7, '#9fd6ff'); M(2, -13, 9, 1, '#e0f4ff');
  M(4, -12, 4, 4, PAL_P.skin); M(4, -12, 4, 1, PAL_P.band);
  M(-10, 5, 22, 1, '#2a2a30'); M(-7, 0, 1, 5, '#2a2a30'); M(6, 0, 1, 5, '#2a2a30');
  M(-1, -18, 2, 4, '#2a2a30');
  const L = (G.t >> 1) % 2 ? 30 : 16; F(x - L, y - 19, L * 2, 1, '#2a2a30'); F(x - 2, y - 20, 4, 2, '#4b4f5c');
  gun(x + f * 11, y - 5, p.ax, p.ay, PAL_P, 7);
}
function drawPod(pd) {
  if(!WUKONG&&drawSupplyDisc(ctx,stageOneArt.images.supplySaucer,pd.x,pd.y))return;
  drawSupplySaucer(ctx,pd.x,pd.y,G.t/60);
}
function pline(x0, y0, x1, y1, c) { C.strokeStyle = nes(c) || c; C.lineWidth = 0.9; C.lineCap = 'round'; C.beginPath(); C.moveTo(x0 + 0.5, y0 + 0.5); C.lineTo(x1 + 0.5, y1 + 0.5); C.stroke(); }
function drawItem(it) {
  drawBadge(Math.round(it.x) - 6, Math.round(it.y) - 10, it.kind, (G.t >> 3) % 2);
}
function drawBadge(x, y, kind, blink) {
  const st = !!STAGE_ONLY[kind], sp = kind in SPECIALS, body = st ? '#9878f8' : sp ? '#00e8d8' : '#f8b800';
  const bg = ctx.createLinearGradient(0, y, 0, y + 10);
  bg.addColorStop(0, st ? (blink ? '#f0e4ff' : '#cbb6ff') : sp ? (blink ? '#e6fffb' : '#9cf3ea') : (blink ? '#fff3c4' : '#ffe08a'));
  bg.addColorStop(1, st ? '#6a4cd8' : sp ? '#1aa79c' : '#d88a10');
  rr(x, y, 12, 10, 2.2, bg);
  ctx.strokeStyle = st ? '#3a2290' : sp ? '#0f5a54' : '#7a4a08'; ctx.lineWidth = 0.6; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x + 0.3, y + 0.3, 11.4, 9.4, 2); else ctx.rect(x + 0.3, y + 0.3, 11.4, 9.4); ctx.stroke();
  const c = st ? '#000000' : sp ? '#0d2a28' : '#3a1d0c';
  if (kind === 'c') { F(x + 5, y + 2, 3, 1, c); F(x + 4, y + 3, 5, 2, c); F(x + 3, y + 5, 5, 2, c); F(x + 2, y + 7, 2, 2, c); F(x + 6, y + 4, 1, 1, body); }
  else if (kind === 't') { for (const dx of [2, 5, 8]) F(x + dx, y + 4, 2, 5, c); F(x + 2, y + 6, 8, 1, body); F(x + 6, y + 1, 1, 3, c); F(x + 7, y + 1, 1, 1, '#f83800'); }
  else if (kind === 'e') { pline(x + 7, y + 1, x + 4, y + 5, c); F(x + 4, y + 5, 5, 1, c); pline(x + 8, y + 5, x + 5, y + 9, c); F(x + 1, y + 1, 1, 1, c); F(x + 10, y + 8, 1, 1, c); }
  else if (kind === 'k') { seg(x + 6, y + 9, x + 6, y + 3, 1, c); seg(x + 6, y + 3, x + 3, y + 1.5, 1, c); seg(x + 6, y + 3, x + 9, y + 1.5, 1, c); seg(x + 6, y + 3.5, x + 6, y + 1, 1, c); }
  else if (kind === 'j') {
    const helmet=stageThreeArt.images.impactHelmet;
    if(helmet?.naturalWidth>0)ctx.drawImage(helmet,x+.6,y+1.4,10.8,10.8*331/512);
    else {ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+6,y+7,4.2,Math.PI,0);ctx.fill();rr(x+1.2,y+7,9.6,1.4,.5,c);}
  }
  else if (kind === 'o') { el(x + 6, y + 2.6, 1.6, 1.6, c); rr(x + 4.4, y + 4.2, 3.2, 3.6, 1, c); seg(x + 2, y + 9, x + 10, y + 9, 0.8, c); seg(x + 1.5, y + 2, x + 1.5, y + 8, 0.6, c); seg(x + 10.5, y + 2, x + 10.5, y + 8, 0.6, c); }
  else if (kind === 'n') { ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 6, y + 4.5, 3.4, 0, Math.PI); ctx.stroke(); rr(x + 1.6, y + 1, 2.2, 3.6, 0.4, c); rr(x + 8.2, y + 1, 2.2, 3.6, 0.4, c); }
  else if (kind === 'N') { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 6, y + 6, 4.2, Math.PI, 0); ctx.stroke(); seg(x + 6, y + 2.6, x + 6, y + 9.6, 1.2, c); seg(x + 4, y + 9.6, x + 8, y + 9.6, 1, c); }
  else if (kind === 'Q') { rr(x + 3, y + 6, 6, 3.6, 1, c); seg(x + 6, y + 6, x + 10, y + 3, 1.3, c); seg(x + 4, y + 9.6, x + 2.6, y + 11, 0.8, c); seg(x + 8, y + 9.6, x + 9.4, y + 11, 0.8, c); }
  else if (kind === 'G') { rr(x + 2.6, y + 3.6, 6.8, 5.6, 1, c); seg(x + 4.4, y + 3.6, x + 4.4, y + 9.2, 0.6, '#333'); seg(x + 7.6, y + 3.6, x + 7.6, y + 9.2, 0.6, '#333'); seg(x + 6, y + 3.6, x + 8.4, y + 1.2, 0.8, c); el(x + 8.8, y + 1, 0.9, 0.9, '#ffb03a'); }
  else if (kind === 'W') { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 2, y + 8); ctx.quadraticCurveTo(x + 4, y + 6.4, x + 6, y + 8); ctx.quadraticCurveTo(x + 8, y + 9.6, x + 10, y + 8); ctx.stroke(); ctx.fillStyle = '#ffb03a'; ctx.beginPath(); ctx.moveTo(x + 6, y + 1.2); ctx.quadraticCurveTo(x + 8.6, y + 3.6, x + 6, y + 6); ctx.quadraticCurveTo(x + 3.4, y + 3.6, x + 6, y + 1.2); ctx.fill(); }
  else if (kind === 'K') { rr(x + 3.4, y + 3, 5.2, 6.2, 1.6, c); el(x + 6, y + 2, 1.8, 1.6, c); ctx.fillStyle = '#ffe060'; ctx.beginPath(); ctx.moveTo(x + 6.8, y + 3.4); ctx.lineTo(x + 4.8, y + 6.4); ctx.lineTo(x + 6.2, y + 6.4); ctx.lineTo(x + 5.4, y + 9.4); ctx.lineTo(x + 7.6, y + 5.6); ctx.lineTo(x + 6.2, y + 5.6); ctx.closePath(); ctx.fill(); }
  else if (kind === 'T') { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 6, y + 5.5, 3.6, 0, Math.PI * 2); ctx.stroke(); seg(x + 2.4, y + 5.5, x + 9.6, y + 5.5, 0.8, c); seg(x + 6, y + 1.9, x + 6, y + 9.1, 0.8, c); el(x + 6, y + 5.5, 1.2, 1.2, c); }
  else if (kind === 'E') { rr(x + 4.4, y + 3.4, 3.2, 6, 1, c); ctx.fillStyle = '#ffb03a'; ctx.beginPath(); ctx.moveTo(x + 6, y + 0.6); ctx.quadraticCurveTo(x + 8.4, y + 2.8, x + 6, y + 3.6); ctx.quadraticCurveTo(x + 3.6, y + 2.8, x + 6, y + 0.6); ctx.fill(); }
  else if (kind === 'P') { el(x + 6, y + 3, 2, 2, c); rr(x + 3.6, y + 4.6, 4.8, 4.4, 1.4, c); ctx.strokeStyle = '#7fffd0'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(x + 6, y + 5.4, 5, 0, Math.PI * 2); ctx.stroke(); }
  else if (kind === 'C') { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); for (let a = 0; a < 9; a += 0.3) { const r = 0.5 + a * 0.5; const px = x + 6 + Math.cos(a) * r, py = y + 5 + Math.sin(a) * r * 0.9; a ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
  else if (kind === 'D') { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 6, y + 5, 4, 0, Math.PI * 2); ctx.stroke(); seg(x + 6, y + 5, x + 6, y + 2.4, 0.9, c); seg(x + 6, y + 5, x + 8, y + 5.6, 0.9, c); }
  else if (kind === 'r') { rr(x + 4, y + 1.6, 4, 7.6, 1.4, c); rr(x + 4.8, y + 0.6, 2.4, 1.4, 0.5, c); seg(x + 6, y + 3.6, x + 6, y + 7.6, 0.7, '#9fe6ff'); seg(x + 4.6, y + 5.6, x + 7.4, y + 5.6, 0.7, '#9fe6ff'); }
  else if (kind === 'A') { el(x + 5, y + 5, 3.4, 2.4, c); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + 8, y + 3); ctx.lineTo(x + 11, y + 5); ctx.lineTo(x + 8, y + 7); ctx.closePath(); ctx.fill(); seg(x + 1, y + 3.6, x + 2.6, y + 3.6, 0.8, '#ffb03a'); seg(x + 0.6, y + 6.4, x + 2.6, y + 6.4, 0.8, '#ffb03a'); }
  else if (kind === 'q') { ctx.strokeStyle = c; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(x + 6, y + 4.4, 3.4, 0, Math.PI * 2); ctx.stroke(); rr(x + 5, y + 7.6, 2, 2, 0.5, c); el(x + 4.8, y + 3.2, 1, 0.8, c); }
  else if (kind === 's') { rr(x + 4.6, y + 4, 2.8, 5.6, 1, c); seg(x + 6, y + 4, x + 6, y + 1, 0.7, c); ctx.strokeStyle = c; ctx.lineWidth = 0.7; for (const r of [2.4, 4.2]) { ctx.beginPath(); ctx.arc(x + 6, y + 1.6, r, -2.5, -0.64); ctx.stroke(); } }
  else if (kind === 'b') { rr(x + 3.4, y + 2.6, 5.2, 7, 2, c); rr(x + 4.6, y + 1, 2.8, 2, 0.6, c); seg(x + 6, y + 1, x + 9.4, y + 1, 0.8, c); ctx.strokeStyle = body; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(x + 6, y + 6.2, 1.4, 0, Math.PI * 2); ctx.stroke(); }
  else if (kind === 'l') { for (const dy of [2.6, 5, 7.4]) { rr(x + 2, y + dy - 0.9, 7, 1.8, 0.9, c); seg(x + 9, y + dy, x + 10.4, y + dy, 0.6, c); } }
  else if (kind === 'p') { ctx.strokeStyle = c; ctx.lineCap = 'round'; for (const [r, w] of [[1.6, 1.4], [3.6, 1], [5.6, 0.9]]) { ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x + 3, y + 5, r, -0.9, 0.9); ctx.stroke(); } el(x + 2.4, y + 5, 1.3, 1.3, c); }
  else if (kind === 'z') { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + 10, y + 2); ctx.lineTo(x + 9.4, y + 6.4); ctx.lineTo(x + 6, y + 9.4); ctx.lineTo(x + 2.6, y + 6.4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#9be04a'; ctx.beginPath(); ctx.moveTo(x + 6, y + 3.4); ctx.quadraticCurveTo(x + 8, y + 6, x + 6, y + 7); ctx.quadraticCurveTo(x + 4, y + 6, x + 6, y + 3.4); ctx.fill(); }
  else if (kind === 'y') { rr(x + 2.6, y + 1.5, 4, 5.5, 1, c); rr(x + 2.6, y + 6, 7.4, 3.2, 1.2, c); ctx.strokeStyle = c; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x + 9.4, y + 3, 1.8, 0, Math.PI); ctx.stroke(); }
  else if (kind === 'a') { rr(x + 4, y + 4, 4, 3, 1, c); seg(x + 3, y + 3, x + 9, y + 8, 0.7, c); seg(x + 9, y + 3, x + 3, y + 8, 0.7, c); for (const [dx, dy] of [[2.4, 2.4], [9.6, 2.4], [2.4, 8.4], [9.6, 8.4]]) el(x + dx, y + dy, 2, 0.9, c); }
  else if (kind === 'x') { el(x + 6, y + 3, 2.7, 2.5, c); rr(x + 3, y + 5, 6, 4.6, 1.4, c); seg(x + 3.2, y + 6, x + 1.6, y + 9, 1.3, c); seg(x + 8.8, y + 6, x + 10.4, y + 9, 1.3, c); rr(x + 4.6, y + 2.3, 2.8, 1.3, 0.5, '#ff8a2a'); }
  else if (kind === 'w') { rr(x + 3.6, y + 2.2, 4.8, 7.4, 1.6, c); rr(x + 4.6, y + 1, 2.8, 1.6, 0.5, c); seg(x + 4.8, y + 4.6, x + 7.2, y + 7.4, 0.6, '#bfe9ff'); seg(x + 7.2, y + 4.6, x + 4.8, y + 7.4, 0.6, '#bfe9ff'); seg(x + 6, y + 4.2, x + 6, y + 7.8, 0.6, '#bfe9ff'); }
  else if (kind === 'i') { rr(x + 2, y + 3, 8, 3, 1, c); ctx.fillStyle = c; ctx.beginPath(); for (const dx of [2, 4.8, 7.6]) { ctx.moveTo(x + dx, y + 6); ctx.lineTo(x + dx + 1.2, y + 9.2); ctx.lineTo(x + dx + 2.4, y + 6); } ctx.fill(); seg(x + 3, y + 1.6, x + 9, y + 1.6, 0.8, c); }
  else if (kind === 'v') { seg(x + 1, y + 4.6, x + 11, y + 4.6, 0.8, c); el(x + 3.8, y + 5, 2.7, 2.3, c); el(x + 8.2, y + 5, 2.7, 2.3, c); el(x + 3.8, y + 5, 1.1, 1, '#ff8a2a'); el(x + 8.2, y + 5, 1.1, 1, '#ff8a2a'); }
  else if (kind === 'd') { F(x + 3, y + 1, 6, 6, c); F(x + 4, y + 7, 4, 1, c); F(x + 5, y + 8, 2, 1, c); F(x + 5, y + 2, 2, 4, body); }
  if (kind === 'g') { disc(C, x + 6, y + 6, 3, c); F(x + 5, y + 1, 3, 2, c); F(x + 8, y + 1, 1, 1, c); }
  else if (kind === 'f') { F(x + 5, y + 1, 2, 8, c); F(x + 2, y + 4, 8, 2, c); pline(x + 3, y + 2, x + 8, y + 7, c); pline(x + 8, y + 2, x + 3, y + 7, c); }
  else if (kind === 'm') { F(x + 1, y + 6, 3, 3, c); F(x + 8, y + 6, 3, 3, c); F(x + 3, y + 4, 6, 2, c); F(x + 8, y + 2, 1, 3, c); F(x + 8, y + 2, 3, 1, c); }
  else if (kind === 'h') { F(x + 1, y + 1, 10, 1, c); F(x + 5, y + 2, 1, 2, c); F(x + 3, y + 4, 6, 4, c); F(x + 1, y + 5, 2, 1, c); F(x + 3, y + 8, 7, 1, c); }
  else if (kind === 'u') { F(x + 3, y + 2, 6, 1, c); F(x + 2, y + 3, 8, 3, c); F(x + 5, y + 6, 2, 3, c); F(x + 4, y + 4, 1, 1, body); F(x + 7, y + 3, 1, 1, body); }
  if (kind === 'M') { pline(x + 2, y + 2, x + 5, y + 5, c); pline(x + 5, y + 5, x + 2, y + 8, c); pline(x + 6, y + 2, x + 9, y + 5, c); pline(x + 9, y + 5, x + 6, y + 8, c); }
  else if (kind === 'S') { pline(x + 2, y + 5, x + 9, y + 2, c); pline(x + 2, y + 5, x + 10, y + 5, c); pline(x + 2, y + 5, x + 9, y + 8, c); }
  else if (kind === 'R') { pline(x + 7, y + 1, x + 4, y + 5, c); pline(x + 4, y + 5, x + 8, y + 5, c); pline(x + 8, y + 5, x + 5, y + 9, c); }
  else if (kind === 'L') { F(x + 2, y + 4, 7, 2, c); F(x + 9, y + 3, 2, 4, c); }
  else if (kind === 'F') { F(x + 6, y + 1, 1, 2, c); F(x + 5, y + 3, 3, 2, c); F(x + 3, y + 5, 6, 2, c); F(x + 4, y + 7, 4, 2, c); }
  else if (kind === 'H') { pline(x + 3, y + 7, x + 8, y + 2, c); F(x + 8, y + 1, 2, 2, c); F(x + 2, y + 6, 2, 1, c); F(x + 4, y + 8, 1, 2, c); }
  else if (kind === '_unused') { F(x + 5, y + 1, 2, 8, c); F(x + 2, y + 4, 8, 2, c); pline(x + 3, y + 2, x + 8, y + 7, c); pline(x + 8, y + 2, x + 3, y + 7, c); }
  else if (kind === 'B') { F(x + 4, y + 2, 4, 1, c); F(x + 4, y + 7, 4, 1, c); F(x + 3, y + 3, 1, 4, c); F(x + 8, y + 3, 1, 4, c); }
}
function drawBoss() {
  const B = G.boss, t = G.t;
  F(BX, 40, 138, 136, '#000000');
  for (let y = 40, r = 0; y < 176; y += 8, r++) for (let x = BX + (r % 2 ? 0 : 6); x < BX + 138; x += 12) { const w = Math.min(11, BX + 138 - x); F(x, y, w, 7, '#7c7c7c'); F(x, y, w, 1, '#bcbcbc'); }
  F(BX, 40, 3, 136, '#bcbcbc');
  for (let x = BX; x < BX + 138; x += 14) { F(x, 30, 9, 10, '#7c7c7c'); F(x, 30, 9, 1, '#bcbcbc'); }
  // emblem
  for (let i = 0; i < 9; i++) { F(BX + 70 - i, 56 + i, i * 2 + 1, 1, '#a81000'); F(BX + 70 - i, 74 - i, i * 2 + 1, 1, '#a81000'); }
  F(BX + 68, 63, 5, 5, B.dead ? '#3a2a2a' : '#ff6a2b');
  // cannon ports + barrels
  for (const pt of B.parts) {
    if (pt.k === 'core') continue;
    F(BX, pt.y - 4, 12, pt.h + 8, '#000000');
    if (pt.hp > 0) {
      const fl = pt.flash > 0;
      F(pt.x, pt.y + 2, 22, 8, fl ? '#fcfcfc' : '#7c7c7c'); F(pt.x, pt.y + 2, 22, 1, fl ? '#fcfcfc' : '#bcbcbc'); F(pt.x, pt.y + 9, 22, 1, '#000000');
      F(pt.x + 14, pt.y, 4, 12, fl ? '#fcfcfc' : '#bcbcbc'); F(pt.x - 2, pt.y + 3, 2, 6, '#000000');
    } else { F(pt.x + 12, pt.y + 3, 10, 6, '#1b1820'); if (t % 12 < 6) F(pt.x + 10 + (t % 5), pt.y - 4 - (t % 8), 3, 3, '#5a4f5c'); }
  }
  // door + core
  const core = B.parts[2];
  F(BX + 4, 140, 40, 36, '#000000'); F(BX + 4, 140, 40, 2, '#bcbcbc'); F(BX + 4, 140, 2, 36, '#bcbcbc'); F(BX + 42, 140, 2, 36, '#bcbcbc');
  if (core.hp > 0) {
    const pulse = (Math.sin(t / (B.phase2 ? 4 : 8)) + 1) / 2, fl = core.flash > 0;
    F(core.x, core.y, core.w, core.h, '#7c7c7c'); F(core.x + 2, core.y + 2, core.w - 4, core.h - 4, '#000000');
    disc(ctx, core.x + 14, core.y + 16, 9, fl ? '#fff' : (B.phase2 ? '#ff3b2b' : '#ff6a2b'));
    disc(ctx, core.x + 14, core.y + 16, 5 + Math.round(pulse * 2), fl ? '#fff' : '#ffd27a');
    if (B.phase2) { pline(core.x + 3, core.y + 4, core.x + 9, core.y + 12, '#ff6a2b'); pline(core.x + 24, core.y + 26, core.x + 19, core.y + 20, '#ff6a2b'); }
  } else { F(core.x, core.y + 18, core.w, 14, '#1a1418'); F(core.x + 4, core.y + 22, 6, 4, '#3a2a2a'); }
}
function drawFx() {
  for (const f of G.fx) {
    const k = f.t / f.life;
    if (f.k === 'boom') {
      if(!WUKONG){drawExplosion(ctx,stageOneArt.images.explosionAtlas,f);continue;}
      const r = f.s * (0.45 + 0.8 * k);
      ctx.globalAlpha = Math.max(0, 1 - k * 0.9);
      if (k < 0.55) { const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, '#fff1a8'); g.addColorStop(0.55, '#ffb43a'); g.addColorStop(0.85, '#e8501c'); g.addColorStop(1, 'rgba(160,30,10,0)'); ctx.fillStyle = g; }
      else { const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r); g.addColorStop(0, 'rgba(120,100,95,0.9)'); g.addColorStop(0.7, 'rgba(70,60,60,0.7)'); g.addColorStop(1, 'rgba(40,35,35,0)'); ctx.fillStyle = g; }
      ctx.beginPath(); ctx.arc(f.x, f.y - k * 4, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    } else if (f.k === 'spark') { el(f.x, f.y, 1.1, 1.1, k < 0.5 ? '#ffe27a' : '#ff7a2a'); }
    else if (f.k === 'drop') el(f.x, f.y, 0.9, 1.2, '#bfe6ff');
    else if (f.k === 'acid') el(f.x, f.y, 0.9, 1.2, '#b8f060');
    else if (f.k === 'bub') { ctx.strokeStyle = `rgba(220,245,255,${(0.8 * (1 - k)).toFixed(3)})`; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(f.x, f.y, 1.2 + k * 1.2, 0, Math.PI * 2); ctx.stroke(); }
    else if (f.k === 'ring') { ctx.strokeStyle = `rgba(190,240,255,${(1 - k).toFixed(3)})`; ctx.lineWidth = 2.4 * (1 - k) + 0.5; ctx.beginPath(); ctx.arc(f.x, f.y, 8 + k * 260, 0, Math.PI * 2); ctx.stroke(); }
    else if (f.k === 'stomp') drawGiantStomp(ctx, f);
    else if (f.k === 'debris') rr(f.x, f.y, 2.6, 1.6, 0.4, k < 0.5 ? '#a8adb8' : '#5a5f6a');
    else if (f.k === 'smoke') { ctx.globalAlpha = 0.6 * (1 - k); el(f.x, f.y, 1.4 + k * 2, 1.4 + k * 2, '#cfc9d6'); ctx.globalAlpha = 1; }
    else if (f.k === 'hit') glow(f.x, f.y, 3.2, 'rgba(255,255,255,1)', 'rgba(255,220,120,0)');
    else if (f.k === 'puff') { ctx.globalAlpha = 1 - k; el(f.x, f.y, 1.4, 1.1, '#f4e9da'); ctx.globalAlpha = 1; }
  }
}
function dither(b, c) { ctx.save(); ctx.globalAlpha = 0.42; rr(b.x, b.y, b.w, b.h, 2, c); ctx.restore(); }
function ice(b) { dither(b, '#a4e4fc'); }
function drawMedal(x, y) {
  F(x + 1, y, 1, 5, '#f83800'); F(x + 2, y, 1, 5, '#fcfcfc'); F(x + 3, y, 1, 5, '#0058f8'); F(x + 4, y, 1, 5, '#fcfcfc'); F(x + 5, y, 1, 5, '#f83800');
  F(x + 2, y + 6, 3, 1, '#f8b800'); F(x + 1, y + 7, 5, 4, '#f8b800'); F(x + 2, y + 11, 3, 1, '#ac7c00'); F(x + 2, y + 7, 2, 1, '#fce0a8');
}
const SLOT_X = 40, SLOT_Y = 20, NADE_CD = 4;
const nadeCooldown = () => isCelestial() ? 0 : NADE_CD;
function drawHud() { if (cooperative() && coop.role === 'guest') withPlayer2(drawHudContent); else drawHudContent(); }
function drawHudContent() {
  const p = G.p, B = G.boss;
  C = ctx; setT();
  const spare = Math.max(0, G.lives - 1);
  if (infiniteLives()) { drawMedal(8, 5); drawText('×∞', 18, 6, '#fcfcfc', 'left', 9); }
  else {
    for (let i = 0; i < Math.min(spare, 5); i++) drawMedal(8 + i * 10, 5);
    if (spare > 5) drawText('x' + spare, 60, 8, '#fcfcfc');
  }
  let x = 8;
  const wk = { machine: 'M', spread: 'S', laser: 'L', fire: 'F', homing: 'H' }[p.weapon];
  if (wk) { drawBadge(x, SLOT_Y + 1, wk, 0); x += 14; }
  if (p.rapid) drawBadge(x, SLOT_Y + 1, 'R', 0);
  for (let i = 0; i < INV_MAX; i++) {
    const sx = SLOT_X + i * 16, k = G.inv[i], c = k && i === G.sel ? '#f8b800' : k ? '#bcbcbc' : '#7c7c7c';
    F(sx, SLOT_Y, 14, 12, c); F(sx + 1, SLOT_Y + 1, 12, 10, '#000000');
    if (k) drawBadge(sx + 1, SLOT_Y + 1, k, 0);
  }
  { const nx = SLOT_X + INV_MAX * 16 + 9, ny = SLOT_Y + 6, k = isCelestial()?1-Math.min(1,(p.rage||0)/(p.maxRage||100)):Math.max(0, G.nadeCd || 0) / NADE_CD, ready = k <= 0;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(nx, ny, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = ready ? '#58d854' : '#f8b800'; ctx.beginPath(); ctx.arc(nx, ny, 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k)); ctx.stroke();
    if(isCelestial()){seg(nx-3.5,ny+3.5,nx+3.5,ny-3.5,1.8,ready?'#f5d378':'#887552');seg(nx-3.5,ny+3.5,nx-2,ny+2,2.3,'#e8b851');seg(nx+2,ny-2,nx+3.5,ny-3.5,2.3,'#e8b851');}else{el(nx, ny + 0.8, 3.6, 4, ready ? '#4a7a36' : '#3a4a34'); rr(nx - 1.4, ny - 4.6, 2.8, 1.8, 0.5, ready ? '#c8ccd2' : '#7a8088'); seg(nx + 1.2, ny - 4, nx + 3.4, ny - 2.4, 0.8, ready ? '#c8ccd2' : '#7a8088');} }
  if (G.inv.length || p.spCd > 0) {
    const f = 1 - Math.max(0, p.spCd) / SP_CD;
    F(SLOT_X, SLOT_Y + 14, 46, 2, '#7c7c7c'); F(SLOT_X, SLOT_Y + 14, Math.round(46 * f), 2, f >= 1 ? '#58d854' : '#f8b800');
  }
  const fxs = [];
  if (p.shieldT > 0) fxs.push(`护盾${Math.ceil(p.shieldT)}`);
  if (p.ride === 'moto') fxs.push(`摩托${Math.ceil(p.rideT)}`);
  if (p.ride === 'heli') fxs.push(`直升机${Math.ceil(p.rideT)}`);
  if (p.giantT > 0) fxs.push(giantPowerLabel(p));
  if (G.freezeT > 0) fxs.push(`冻结${Math.ceil(G.freezeT)}`);
  if (p.camoT > 0) fxs.push(`迷彩${Math.ceil(p.camoT)}`);
  if (G.empT > 0) fxs.push(`电磁${Math.ceil(G.empT)}`);
  if (p.riot > 0) fxs.push(`防盾x${p.riot}`);
  if (G.decoyT > 0) fxs.push(`诱饵${Math.ceil(G.decoyT)}`);
  if (G.sweepT > 0) fxs.push(`扫雷${Math.ceil(G.sweepT)}`);
  if (p.cleatT > 0) fxs.push(`冰爪${Math.ceil(p.cleatT)}`);
  if (p.thermT > 0) fxs.push(`热像${Math.ceil(p.thermT)}`);
  if (p.fireproofT > 0) fxs.push(`防火${Math.ceil(p.fireproofT)}`);
  if (p.magnetT > 0) fxs.push(`磁靴${Math.ceil(p.magnetT)}`);
  if (p.droneT > 0) fxs.push(`无人机${Math.ceil(p.droneT)}`);
  if (p.acidT > 0) fxs.push(`抗酸${Math.ceil(p.acidT)}`);
  if (p.o2T > 0) fxs.push(`氧气${Math.ceil(p.o2T)}`);
  if (p.vortexT > 0) fxs.push(`涡流${Math.ceil(p.vortexT)}`);
  if (p.glowT > 0) fxs.push(`荧光${Math.ceil(p.glowT)}`);
  if (p.insulT > 0) fxs.push(`绝缘${Math.ceil(p.insulT)}`);
  if (p.warmT > 0) fxs.push(`暖流${Math.ceil(p.warmT)}`);
  if (G.rl && G.rl.slowT > 0) fxs.push(`时缓${Math.ceil(G.rl.slowT)}`);
  if (G.uw) drawO2();
  if (G.stage === 6 && G.s6 && G.s6.coolT > 0) fxs.push(`液氮${Math.ceil(G.s6.coolT)}`);
  if (fxs.length) drawText(fxs.join(' '), 8, SLOT_Y + 19, '#fcfcfc', 'left', 10);
  F(W / 2 - 72, 4, 132, 14, '#000000');
  drawText(cooperative() ? '双人协作' : '玩家一', W / 2 - 68, 6, '#f83800'); drawText(pad6(G.score), W / 2 - 12, 6, '#fcfcfc');
  const bh = isBase() ? (G.base.def.boss && !G.base.dead ? (G.base.def.boss === 'twin' ? G.base.targets.reduce((a, t2) => ({ hp: a.hp + Math.max(0, t2.hp), max: a.max + t2.max }), { hp: 0, max: 0 }) : G.base.targets[0]) : null) : G.stage === 3 ? (G.mech && G.mech.active && !G.mech.dead ? G.mech.parts[2] : null) : G.stage === 5 ? (G.tank && G.tank.active && !G.tank.dead ? G.tank.parts[2] : null) : G.stage === 6 ? (G.golem && G.golem.active && !G.golem.dead ? G.golem.parts[2] : null) : G.stage === 7 ? (G.ship && G.ship.active && !G.ship.dead ? G.ship.parts[2] : null) : G.uw ? ((B2 => B2 && B2.active && !B2.dead ? B2.parts.find(q => q.k === 'core') : null)(G.stage === 16 ? G.mcore : G.stage === 15 ? G.serp : G.stage === 14 ? G.fcore : G.stage === 13 ? G.angler : G.stage === 12 ? G.queen : G.stage === 11 ? G.crab : G.stage === 10 ? G.ghost : G.shark)) : G.stage === 8 ? (G.hive && G.hive.active && !G.hive.dead ? (G.hive.open ? G.hive.parts[2] : hiveBroodHealth(G.hive)) : null) : (B.active && !B.dead ? B.parts[2] : null);
  if (bh) {
    const bw = 60;
    F(W / 2 - 41, 15, 116, 11, '#000000');
    drawText('首领', W / 2 - 38, 17, '#fcfcfc');
    F(W / 2 - 12, 17, bw + 2, 7, '#fcfcfc'); F(W / 2 - 11, 18, bw, 5, '#000000');
    F(W / 2 - 11, 18, Math.round(bw * Math.max(0, bh.hp) / bh.max), 5, '#f83800');
  }
}
function drawBanner() {
  if (!(G.bannerT > 0) || !G.bannerText) return;
  setT();
  ctx.font = `800 11px ${UI_FONT}`;
  const w = ctx.measureText(G.bannerText).width + 18, h = 19, bx2 = (W - w) / 2, by2 = 56;
  ctx.save(); ctx.globalAlpha = Math.min(1, G.bannerT * 5);
  rr(bx2, by2, w, h, 3.5, 'rgba(6,10,24,0.82)');
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.7; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx2 + 0.5, by2 + 0.5, w - 1, h - 1, 3); else ctx.rect(bx2 + 0.5, by2 + 0.5, w - 1, h - 1); ctx.stroke();
  drawText(G.bannerText, W / 2, by2 + 4, '#ffffff', 'center', 11);
  ctx.restore();
}
function drawLogo(cx2, y) {
  ctx.save();
  ctx.font = `900 40px ${UI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(90,10,4,0.85)'; ctx.fillText('魂斗罗2026', cx2 + 2.5, y + 2.5);
  ctx.lineWidth = 5; ctx.strokeStyle = '#2a0904'; ctx.strokeText('魂斗罗2026', cx2, y);
  const g = ctx.createLinearGradient(0, y, 0, y + 44); g.addColorStop(0, '#fff6cf'); g.addColorStop(0.35, '#ffc23a'); g.addColorStop(0.7, '#f0561c'); g.addColorStop(1, '#a3180b');
  ctx.fillStyle = g; ctx.fillText('魂斗罗2026', cx2, y);
  ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(255,245,210,0.75)'; ctx.strokeText('魂斗罗2026', cx2, y);
  ctx.restore();
}
function drawTitle() {
  C = ctx; setT();
  if (coverArt.complete && coverArt.naturalWidth) {
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(coverArt, 0, 0, H, H);
    drawText('魂斗罗2026', 296, 25, '#f8b800', 'center', 15);
    drawText('单人闯关 · 双人联网', 296, 49, '#fcfcfc', 'center', 7);
    drawText('最高分 ' + pad6(HI), 296, 181, '#7c7c7c', 'center', 7);
    drawTitleToast();
    return;
  }
  const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#05060f'); gr.addColorStop(1, '#14080a');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 50; i++) { ctx.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(G.t * 0.02 + i)); el(hash(i * 7 + 1) * W, hash(i * 13 + 3) * 120, 0.35 + hash(i) * 0.4, 0.35 + hash(i) * 0.4, '#ffffff'); }
  ctx.globalAlpha = 1;
  glow(W / 2, 48, 120, 'rgba(200,60,20,0.32)', 'rgba(200,60,20,0)');
  drawLogo(W / 2, 22);
  drawText('魂斗罗2026', W / 2, 92, '#f2f2f2', 'center', 9);
  drawText('最高分 ' + pad6(HI), W / 2, 106, '#9aa0a8', 'center', 8);
  drawTitleToast();
}
function drawTitleToast(){if(G.toastUntil&&performance.now()<G.toastUntil){rr(W/2-130,3,260,17,4,'rgba(0,40,80,0.9)');drawText(G.toastText,W/2,6.5,'#7fe0ff','center',9);}}
function drawIntro() {
  C = ctx; setT();
  F(0, 0, W, H, '#000000');
  drawText('玩家一', 108, 48, '#f83800'); drawText(pad6(G.score), 148, 48, '#fcfcfc');
  drawText('剩余生命', 108, 62, '#fcfcfc'); drawText(infiniteLives() ? '∞' : String(Math.max(0, G.lives - 1)), 166, infiniteLives() ? 60 : 62, '#fcfcfc', 'left', infiniteLives() ? 11 : 8);
  drawText('最高分', 108, 76, '#f83800'); drawText(pad6(HI), 166, 76, '#fcfcfc');
  drawText(G.stage > 8 ? '水下第' + (G.stage - 8) + '关' : '第' + G.stage + '关', W / 2, 104, G.stage > 8 ? '#7fe0ff' : '#fcfcfc', 'center', 18);
  drawText(STAGE_NAMES[G.stage], W / 2, 132, '#f8c23a', 'center', 12);
}
function render() {
  document.body.classList.toggle('wukong-finale',isCelestial()&&G.boss.encounter?.stage===3);
  if (G.mode === 'loading') return wukong?wukong.loadingBackdrop(ctx,G):drawTitle();
  if (resolutionStage !== G.stage) { resolutionStage = G.stage; resize(); }
  C = ctx;
  $('stage').classList.toggle('stage-one', G.stage >= 1 && G.stage <= 6);
  $('stage').classList.toggle('stage-two',isBase());
  if (wukong && (G.mode === 'title' || G.mode === 'lobby' || G.mode === 'select' || (G.mode === 'settings' && G.settingsFrom === 'title'))) return wukong.title(ctx, G);
  if (G.mode === 'title' || G.mode === 'lobby' || G.mode === 'select' || (G.mode === 'settings' && G.settingsFrom === 'title')) return drawTitle();
  if (G.mode === 'cine') {
    if (G.stage === 1 && G.cine?.kind === 'open') stageOneArt.opening(ctx, G, { solids, online:cooperative() });
    else if (!WUKONG && G.cine?.kind === 'end') endingArt.render(ctx,G,{settings:SET,reducedMotion:reduceMotion});
    else drawCine();
    return;
  }
  if (G.stage === 1 && !['title', 'lobby', 'select', 'cine'].includes(G.mode) && !(G.mode === 'settings' && G.settingsFrom === 'title')) {
    if(WUKONG&&G.boss.encounter?.stage===3)return wukong.finalBattle(ctx,G,{solids,settings:gameplaySettings()});
    stageOneArt.render(ctx, G, { solids, water: WATER, players: players(), online: cooperative(), guest: coop?.role === 'guest', settings: gameplaySettings(), highScore: HI });
    return;
  }
  if(isSiege())return siegeArt.render(wukong,ctx,G,{solids,players:players(),online:cooperative(),guest:coop?.role==='guest',settings:gameplaySettings(),highScore:HI});
  if (G.stage === 2) {
    stageTwoArt.render(ctx,G,{players:players(),online:cooperative(),guest:coop?.role==='guest',settings:gameplaySettings(),highScore:HI});
    return;
  }
  if (G.stage === 4) {
    stageFourArt.render(ctx,G,{players:players(),online:cooperative(),guest:coop?.role==='guest',settings:gameplaySettings(),highScore:HI});
    return;
  }
  if (G.stage === 3) {
    stageThreeArt.render(ctx,G,{solids,players:players(),online:cooperative(),guest:coop?.role==='guest',settings:gameplaySettings(),highScore:HI});
    return;
  }
  if (G.stage === 5) {
    stageFiveArt.render(ctx,G,{solids,players:players(),online:cooperative(),guest:coop?.role==='guest',settings:gameplaySettings(),highScore:HI});
    return;
  }
  if (G.stage === 6) {
    stageSixArt.render(ctx,G,{solids,players:players(),online:cooperative(),guest:coop?.role==='guest',settings:gameplaySettings(),highScore:HI});
    return;
  }
  if (G.stage === 7 || G.stage === 8) {
    (G.stage===7?hangarArt:stageSevenArt).render(ctx,G,{solids,players:players(),online:cooperative(),guest:coop?.role==='guest',settings:gameplaySettings(),highScore:HI});
    return;
  }
  if (G.mode === 'intro') return drawIntro();
  if (G.momm) { renderMom(); drawHud(); drawBanner(); flashOverlay(); return; }
  if (G.liftm) { renderLift(); drawHud(); drawBanner(); flashOverlay(); return; }
  if (G.fortm) { renderFort(); drawHud(); drawBanner(); flashOverlay(); return; }
  if (G.tdm) { renderTD(); drawHud(); drawBanner(); flashOverlay(); return; }
  if (G.rail) { renderRail(); drawHud(); drawBanner(); flashOverlay(); return; }
  if (isBase()) {
    renderBase(); drawHud(); drawBanner();
    flashOverlay();
    return;
  }
  const sx = G.shake > 0 ? Math.round((rnd() - 0.5) * G.shake * 2) : 0, sy = G.shake > 0 ? Math.round((rnd() - 0.5) * G.shake * 2) : 0;
  const cx = Math.round(G.camX * R) / R, cy = Math.round(G.camY * R) / R;
  setT();
  if (G.stage === 5) drawSnowBg(cx);
  else if (G.stage === 6) drawFactoryBg(cx);
  else if (G.stage === 7) drawHangarBg(cx);
  else if (G.stage === 8) drawLairBg(cx);
  else if (G.uw) drawSeaBg(cx, cy);
  else {
    ctx.drawImage(SKY, 0, 0, W, H);
    let ox = -Math.round((cx * 0.12 % 768) * R) / R; ctx.drawImage(MTN, ox, 0, 768, H); ctx.drawImage(MTN, ox + 768, 0, 768, H);
    ox = -Math.round((cx * 0.42 % 768) * R) / R; ctx.drawImage(JUNGLE, ox, 0, 768, H); ctx.drawImage(JUNGLE, ox + 768, 0, 768, H);
  }
  setT(-cx + sx, -cy + sy);
  if (G.stage === 1 && cx + W > BX - 20) drawBoss();
  if (G.freezeT > 0 && G.boss.active && !G.boss.dead) for (const pt of G.boss.parts) if (pt.hp > 0) ice(pt);
  if (G.stage === 5) { drawSnowGround(cx); drawTank(); } else if (G.stage === 6) { drawFactoryGround(cx); drawJets(); drawGolem(); } else if (G.stage === 7) { drawHangarGround(cx); } else if (G.stage === 8) { drawLairGround(cx); drawHive(); drawLairHazards(); } else if (G.uw) { drawSeaFloor(cx); drawPockets(); if (G.stage === 11) drawCrab(); else if (G.stage === 10) drawGhost(); else drawShark(); } else drawGround(cx);
  for (const e of G.en) {
    if (!onScreen(e.x, 20)) continue;
    if (e.y < G.camY - 30 || e.y > G.camY + H + 40) continue;
    if (G.stage === 8) { drawAlien(e); if (G.freezeT > 0) ice(ebox(e)); continue; }
    if (G.uw && e.t !== 'box') { drawSeaEnemy(e); if (G.freezeT > 0) ice(ebox(e)); continue; }
    if (e.t === 'tur') { drawTurret(e); if (G.stage === 5) snowCap(e.x, e.y - 8, 9); }
    else if (e.t === 'mor') drawMortar(e);
    else if (e.t === 'cart') drawCart(e);
    else if (e.t === 'box') drawBox(e);
    else if (e.t === 'rock') drawRock(e);
    else if (e.t === 'run') drawSoldier(e.x, e.y, e.on ? 'run' : 'stand', { face: Math.sign(e.vx), frame: e.anim, pal: EPAL(), ax: Math.sign(e.vx), ay: 0, flash: e.flash > 0 });
    else drawSoldier(e.x, e.y, 'stand', { face: e.face, frame: 0, pal: EPAL(), ax: e.ax, ay: e.ay, flash: e.flash > 0 });
    if (G.freezeT > 0) ice(ebox(e));
  }
  for (const it of G.items) drawItem(it);
  for (const pd of G.pods) drawPod(pd);
  // player
  drawCoopPartner();
  const p = G.p;
  if (G.mode !== 'title') {
    const blink = (p.invT > 0 && !p.dead && (G.t >> 2) % 2 === 0);
    if (!blink) {
      const o = { face: p.dead ? -p.face : p.face, frame: p.anim, pal: PAL_P, ax: p.ax, ay: p.ay };
      if (G.subMode) drawSubPlayer(p);
      else if (G.uw) drawSwimmer(p.x, p.y, { face: p.dead ? -p.face : p.face, frame: p.anim, pal: PAL_P, ax: p.ax, ay: p.ay, dead: p.dead });
      else if (!p.dead && p.ride === 'heli') drawHeli(p);
      else if (!p.dead && p.ride === 'moto') { drawSoldier(p.x, p.y - 9, 'stand', o); drawMoto(p); }
      else {
        let pose = 'stand';
        if (p.dead) pose = 'dead'; else if (p.inWater) pose = p.dive ? 'dive' : 'water'; else if (p.spin) pose = 'spin'; else if (p.prone) pose = 'prone'; else if (p.onGround && p.vx && !p.skid) pose = 'run';
        if (p.giantT > 0 && !p.dead) {
          const rx = Math.round(p.x), ry = Math.round(p.y);
          ctx.save(); ctx.translate(rx, ry); ctx.scale(2, 2); ctx.translate(-rx, -ry); drawSoldier(rx, ry, pose, o); ctx.restore();
        } else drawSoldier(p.x, p.y, pose, o);
      }
    }
    if (p.fireproofT > 0 && !p.dead && (p.fireproofT > 2 || (G.t >> 2) % 2)) { const b = pBox(p); if (b) { ctx.save(); ctx.globalAlpha = 0.3; rr(b.x - 1, b.y - 1, b.w + 2, b.h + 2, 3, '#e4e8ec'); ctx.restore(); ctx.strokeStyle = 'rgba(255,170,60,0.9)'; ctx.lineWidth = 0.7; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(b.x - 1.5, b.y - 1.5, b.w + 3, b.h + 3, 3); else ctx.rect(b.x - 1.5, b.y - 1.5, b.w + 3, b.h + 3); ctx.stroke(); } }
    if (p.acidT > 0 && !p.dead && (p.acidT > 2 || (G.t >> 2) % 2)) { const b = pBox(p); if (b) { ctx.save(); ctx.globalAlpha = 0.25; rr(b.x - 1, b.y - 1, b.w + 2, b.h + 2, 3, '#b8f060'); ctx.restore(); ctx.strokeStyle = 'rgba(184,240,96,0.9)'; ctx.lineWidth = 0.7; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(b.x - 1.5, b.y - 1.5, b.w + 3, b.h + 3, 3); else ctx.rect(b.x - 1.5, b.y - 1.5, b.w + 3, b.h + 3); ctx.stroke(); } }
    if (p.camoT > 0 && !p.dead && (p.camoT > 2 || (G.t >> 2) % 2)) { const b = pBox(p); if (b) dither(b, '#005800'); }
    if (p.hook && !p.dead) { seg(p.x + p.face * 2, p.y - 24, p.hook.x, p.hook.y, 0.8, '#d9d2c3'); seg(p.hook.x - 3, p.hook.y + 1, p.hook.x + 3, p.hook.y + 1, 1.2, '#9aa4ae'); }
    if (p.shieldT > 0 && !p.dead && (p.shieldT > 2 || (G.t >> 2) % 2)) {
      const b = pBox(p) || { x: p.x - 6, y: WATER.surf - 6, w: 12, h: 6 };
      ctx.strokeStyle = (G.t >> 2) % 2 ? '#7ff0ff' : '#ffffff'; ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(b.x) - 3.5, Math.round(b.y) - 3.5, b.w + 7, b.h + 7);
    }
    if (p.flashT > 0 && !p.dead) { F(p.fx - 2, p.fy - 2, 5, 5, '#fff2b0'); F(p.fx - 1, p.fy - 1, 3, 3, '#ffffff'); }
  }
  if (G.stage === 7) { drawPresses(); drawShip(); drawDrone(); withPlayer2(drawDrone); }
  for (const b of G.pb) {
    if (b.k === 'sp') { glow(b.x, b.y, 3.6, 'rgba(255,190,90,0.9)', 'rgba(255,90,30,0)'); el(b.x, b.y, 1.5, 1.5, '#fff2c0'); }
    else if (b.k === 'laser') {
      const l = Math.hypot(b.vx, b.vy) || 1, dx = b.vx / l, dy = b.vy / l;
      for (let o = 0; o < 24; o++) F(b.x - dx * o - 1, b.y - dy * o - 1, 3, 3, '#3fd7ff');
      for (let o = 0; o < 24; o += 2) F(b.x - dx * o, b.y - dy * o, 1, 1, '#ffffff');
    }
    else if (b.k === 'fire') { disc(ctx, b.x, b.y, 3, '#ff6a2b'); disc(ctx, b.x, b.y, 1, '#fff2b0'); }
    else if (b.k === 'msl') {
      const c = Math.cos(b.ang), s = Math.sin(b.ang);
      for (let i = 0; i < 5; i++) F(b.x - c * i - 1, b.y - s * i - 1, 2, 2, i < 1 ? '#ffffff' : '#c3ccd6');
      F(b.x - c * 6 - 1, b.y - s * 6 - 1, 2, 2, (G.t >> 1) % 2 ? '#ffd05a' : '#ff6a2b');
    }
    else { glow(b.x, b.y, 2.8, 'rgba(255,230,140,0.85)', 'rgba(255,200,80,0)'); el(b.x, b.y, 1.1, 1.1, '#ffffff'); }
  }
  for (const g of G.gr) {
    if (g.tnt) {
      for (const dx of [-5, -1, 3]) { F(g.x + dx, g.y - 8, 3, 8, '#f83800'); F(g.x + dx, g.y - 8, 1, 8, '#f87858'); }
      F(g.x - 5, g.y - 5, 11, 1, '#000000'); F(g.x, g.y - 11, 1, 3, '#7c7c7c');
      F(g.x, g.y - 12, 1, 1, (G.t >> (g.fuse < 0.6 ? 1 : 3)) % 2 ? '#fcfcfc' : '#f8b800');
      continue;
    }
    F(g.x - 2, g.y - 2, 5, 5, '#4b5131'); F(g.x - 2, g.y - 2, 5, 1, '#8a915c');
    F(g.x + Math.cos(g.a) * 3, g.y + Math.sin(g.a) * 3 - 1, 1, 1, (G.t >> 2) % 2 ? '#ff3b2b' : '#ffd05a');
  }
  if (G.stage === 1) drawWater(cx);
  if (G.stage === 5) drawBlizzard(cx, cy, sx, sy); // enemy bullets stay visible on top of the storm
  for (const b of G.eb) { if (b.lava) { glow(b.x, b.y, b.r + 3, 'rgba(255,140,40,0.95)', 'rgba(255,60,20,0)'); el(b.x, b.y, b.r * 0.8, b.r * 0.8, '#fff0b0'); continue; } glow(b.x, b.y, b.r + 2, 'rgba(255,90,150,0.9)', 'rgba(255,60,120,0)'); el(b.x, b.y, b.r * 0.7, b.r * 0.7, '#ffffff'); }
  drawFx();
  if (G.vert) drawCollapse();
  if (G.uw) drawSeaOverlay();
  setT();
  drawHud();
  drawBanner();
  flashOverlay();
}
function flashOverlay() { if (!(G.flashT > 0)) return; ctx.save(); ctx.globalAlpha = Math.min(1, G.flashT / 0.35) * 0.75; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }


// ================= cinematics: the opening before stage 1 and the ending after stage 8 =================
// Opening and ending use the HD renderers; the same shared clock controls sound and skipping.
const CINE_LEN = { open: WUKONG ? WUKONG_OPENING_DURATION : OPENING_DURATION, end: ENDING_DURATION, uwopen: 26, uwend: 41 };
const CINE_TYPE = 16; // characters per second for the typewriter text
const OPEN_PAGES = WUKONG ? WUKONG_OPENING_PAGES : OPENING_PAGES;
const END_PAGES = ENDING_PAGES;
function startOpening() { initAudio(); if(WUKONG)Music.stop(); reset(1); G.cine = { kind: 'open', t: 0, typed: 0, skip: false, ev: {} }; setMode('cine'); Music.start(false, -5, 108); }
const UWO_PAGES = [
  { from: 0.8, to: 4.9, lines: ['黑礁群岛沉没三个月后，', '深海声呐捕捉到一阵规律的心跳声。'] },
  { from: 5.1, to: 9.2, lines: ['声源来自海沟最深处——', '陨星真正的核心「远古母体」还活着。'] },
  { from: 9.8, to: 15.8, lines: ['赤焰小队换上深潜装备，', '目标：一路下潜八关，消灭远古母体。'] },
];
const UWE_PAGES = [
  { from: 1.0, to: 6.0, lines: ['远古母体的核心崩塌了，', '整条海沟在身后轰然闭合。'] },
  { from: 11.4, to: 16.6, lines: ['阳光重新照进这片大海，', '来自深渊的心跳，终于停止了。'] },
];
function startUWOpening(carry) {
  if(!canPlayStage(9)){G.toastText=RELEASE_MESSAGE;G.toastUntil=performance.now()+3000;return false;}
  initAudio();reset(9,carry);G.uwCarry=!!carry;G.cine={kind:'uwopen',t:0,typed:0,skip:false,ev:{}};setMode('cine');Music.start(false,-8,96);
}
function startUWEnding() { G.cine = { kind: 'uwend', t: 0, typed: 0, skip: false, ev: {} }; setMode('cine'); Music.start(false, 2, 112); }
function startEnding() { G.cine = { kind: 'end', t: 0, typed: 0, skip: false, ev: {} }; setMode('cine'); Music.start(false, 0, 112); }
function endCine() {
  const k = G.cine.kind,continueMusic=WUKONG&&k==='open'; G.cine = null;
  if(!continueMusic)Music.stop();
  if (k === 'open') startStage(1,undefined,continueMusic); else if (k === 'uwopen') startStage(9, G.uwCarry); else showClear();
}
function lineStarts(pg) { const st = []; let t0 = pg.from + 0.3; for (const l of pg.lines) { st.push(t0); t0 += l.length / CINE_TYPE + 0.25; } return st; }
function typedCount(pages, t) {
  let n = 0;
  for (const pg of pages) { if (t < pg.from) continue; if(pg.instant){n+=pg.lines.reduce((sum,line)=>sum+line.length,0);continue;} lineStarts(pg).forEach((st, i) => { n += Math.max(0, Math.min(pg.lines[i].length, Math.floor((t - st) * CINE_TYPE))); }); }
  return n;
}
function cineAt(C, time, fn) { if (C.t >= time && !C.ev[time]) { C.ev[time] = 1; fn(); } }
function updateCine() {
  const C = G.cine, pages = { open: OPEN_PAGES, end: END_PAGES, uwopen: UWO_PAGES, uwend: UWE_PAGES }[C.kind], n = typedCount(pages, C.t);
  if (n > C.typed) { if ((n >> 1) !== (C.typed >> 1)) tone(1250, 0.02, 'square', 0.018, 900); C.typed = n; }
  if (C.kind === 'open') {
    if(WUKONG){
      cineAt(C,.8,()=>{tone(62,1.2,'sine',.09,42);noise(.65,.035,180);});
      cineAt(C,2.2,()=>{sfx.big();noise(.4,.14,600);});
      cineAt(C,2.38,()=>sfx.jump());
      cineAt(C,4.45,()=>{tone(95,.16,'triangle',.07,50);noise(.12,.05,350);});
      cineAt(C,6.2,()=>sfx.mount());
      cineAt(C,14.2,()=>{tone(95,.3,'triangle',.08,55);noise(.12,.07,350);});
      cineAt(C,16.6,()=>{sfx.mount();tone(220,.18,'triangle',.06,110);});
      return;
    }
    cineAt(C, 4.4, () => { sfx.big(); });
    cineAt(C, 21.3, () => { sfx.jump(); });
    cineAt(C, 22.25, () => { sfx.hit(); });
    cineAt(C, 23.0, () => { sfx.pick(); });
  } else if (C.kind === 'uwopen') {
    for (let k = 0; k < 8; k++) cineAt(C, 0.5 + k * 1.1, () => { tone(58, 0.16, 'sine', 0.32, 40); setTimeout(() => tone(52, 0.14, 'sine', 0.24, 36), 230); });
    cineAt(C, 18.9, () => { sfx.splash(); noise(0.5, 0.2, 1500); });
  } else if (C.kind === 'uwend') {
    for (let k = 0; k < 9; k++) cineAt(C, 0.5 + k * 0.6, () => sfx.boom());
    cineAt(C, 6.0, () => { sfx.big(); noise(2.4, 0.5, 300); tone(48, 2.2, 'sine', 0.4, 30); });
    cineAt(C, 14.6, () => { sfx.splash(); });
    cineAt(C, 21.0, () => { if (AC) [69, 72, 76, 81, 79, 81, 84, 88].forEach((m, i) => tone(mfreq(m), 0.22, 'square', 0.06, 0, AC.currentTime + i * 0.16)); });
  } else {
    for (let k = 0; k < 10; k++) cineAt(C, 0.4 + k * 0.55, () => sfx.boom());
    cineAt(C, 6.0, () => { sfx.big(); noise(2.4, 0.5, 300); tone(50, 2.2, 'sine', 0.4, 30); });
    cineAt(C, 21.0, () => { if (AC) [69, 72, 76, 81, 79, 81, 84].forEach((m, i) => tone(mfreq(m), 0.22, 'square', 0.06, 0, AC.currentTime + i * 0.16)); });
  }
}
const ease = u => u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u);
function drawPages(pages, t) {
  for (const pg of pages) {
    if (t < pg.from || t > pg.to) continue;
    const a = Math.min(1, (t - pg.from) / 0.3, (pg.to - t) / 0.3);
    ctx.save(); ctx.globalAlpha = Math.max(0, a);
    rr(22, 166, 340, 40, 5, 'rgba(0,0,0,0.62)');
    lineStarts(pg).forEach((st, i) => { const n = pg.instant ? pg.lines[i].length : Math.max(0, Math.min(pg.lines[i].length, Math.floor((t - st) * CINE_TYPE))); if (n) drawText(pg.lines[i].slice(0, n), 34, 172 + i * 15, '#f4f1e8', 'left', 10); });
    ctx.restore();
  }
}
function cineFade(t, edges) {
  let a = 0;
  for (const e of edges) a = Math.max(a, 1 - Math.abs(t - e) / 0.45);
  if (a > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = '#000'; ctx.fillRect(-20, -20, W + 40, H + 40); ctx.restore(); }
}
function drawCineHeli(x, y, s, f, sil) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * f, s);
  const body = sil || '#3f4f36', dark = sil || '#232c1d', glass = sil || '#9fd6ff';
  seg(-12, -1, -40, -4, 4.6, body); seg(-38, -4, -42, -12, 2.6, body);
  ctx.save(); ctx.globalAlpha = sil ? 0.5 : 0.35; el(-41, -6, 5, 5, sil || '#c8d0d8'); ctx.restore();
  el(0, 0, 16, 8.6, body);
  if (!sil) { el(-2, -4.4, 11, 2.4, '#5f7350'); rr(-7, -4, 8, 7.5, 1.2, dark); }
  el(9.5, -2, 6.4, 4.8, glass); if (!sil) el(10.5, -3.6, 3, 1.4, 'rgba(255,255,255,0.7)');
  seg(-10, 11, 11, 11, 1.3, dark); seg(-6, 8, -6, 11, 1, dark); seg(6, 8, 6, 11, 1, dark);
  seg(0, -8, 0, -11.5, 1.8, dark);
  ctx.save(); ctx.globalAlpha = sil ? 0.4 : 0.3; el(0, -12, 32, 2.2, sil || '#d8dee6'); ctx.restore();
  const a = G.t * 0.18;
  for (let i = 0; i < 2; i++) { const l = Math.cos(a + i * Math.PI / 2) * 32; seg(-l, -12, l, -12, 0.9, dark); }
  if (!sil) el(-14, 4, 1.2, 1.2, (G.t >> 4) % 2 ? '#ff4a2a' : '#6a1a10');
  ctx.restore();
}
function cineNightSea(t) {
  const sg = ctx.createLinearGradient(0, 0, 0, 140); sg.addColorStop(0, '#02030a'); sg.addColorStop(0.6, '#0b1630'); sg.addColorStop(1, '#1d2d4c');
  ctx.fillStyle = sg; ctx.fillRect(-20, -20, W + 40, 162);
  for (let i = 0; i < 90; i++) { ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t * 0.6 + i * 1.7)); el(hash(i * 7 + 1) * W, hash(i * 13 + 3) * 120, 0.3 + hash(i) * 0.45, 0.3 + hash(i) * 0.45, '#ffffff'); }
  ctx.globalAlpha = 1;
  const wg = ctx.createLinearGradient(0, 140, 0, H); wg.addColorStop(0, '#0d1a30'); wg.addColorStop(1, '#02060e');
  ctx.fillStyle = wg; ctx.fillRect(-20, 140, W + 40, H - 120);
  ctx.strokeStyle = 'rgba(140,170,220,0.18)'; ctx.lineWidth = 0.6; ctx.beginPath();
  for (let i = 0; i < 26; i++) { const y = 144 + hash(i * 5) * 70, x = hash(i * 9) * W, l = 8 + hash(i * 3) * 24; ctx.moveTo(x, y); ctx.lineTo(x + l, y); }
  ctx.stroke();
}
function cineIsland(ix, iy, sc, glow2, col) {
  ctx.save(); ctx.translate(ix, iy); ctx.scale(sc, sc);
  if (glow2 > 0) glow(8, -16, 70, `rgba(255,60,40,${0.45 * glow2})`, 'rgba(255,40,20,0)');
  ctx.fillStyle = col || '#05080a'; ctx.beginPath(); ctx.moveTo(-78, 2);
  ctx.quadraticCurveTo(-60, -14, -40, -16); ctx.quadraticCurveTo(-24, -34, -6, -30); ctx.quadraticCurveTo(10, -46, 26, -32); ctx.quadraticCurveTo(46, -26, 58, -14); ctx.quadraticCurveTo(74, -8, 86, 2); ctx.closePath(); ctx.fill();
  for (const [px, ph, lean] of [[-44, 22, -4], [-30, 28, 3], [40, 24, 5], [54, 18, -3]]) {
    seg(px, -14, px + lean, -14 - ph, 1.6, col || '#05080a');
    for (let k = 0; k < 5; k++) { const a = -Math.PI + k * Math.PI / 4; ctx.strokeStyle = col || '#05080a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(px + lean, -14 - ph); ctx.quadraticCurveTo(px + lean + Math.cos(a) * 6, -14 - ph + Math.sin(a) * 6 - 3, px + lean + Math.cos(a) * 11, -14 - ph + Math.sin(a) * 4 + 5); ctx.stroke(); }
  }
  ctx.restore();
}
function cineSmoke(ix, iy, t, k0, n, rise, wind, col) {
  for (let k = 0; k < n; k++) {
    const ph = ((t * 0.22 + k / n) % 1 + 1) % 1, y = iy - ph * rise, x = ix + Math.sin(ph * 3 + k) * 6 * ph + ph * wind, r = 4 + ph * 18;
    ctx.globalAlpha = 0.55 * (1 - ph) * k0; el(x, y, r, r * 0.8, col);
  }
  ctx.globalAlpha = 1;
}
function drawOpening(t) {
  // scene A: the meteor falls on the island
  if (t < 11.6) {
    const z = 1 + ease((t - 6.2) / 5.4) * 0.45, ix = 120, iy = 140;
    ctx.save(); ctx.translate(ix, iy); ctx.scale(z, z); ctx.translate(-ix, -iy);
    cineNightSea(t);
    const hit = t >= 4.4, g2 = hit ? Math.min(1, (t - 4.4) / 1.5) * (0.75 + 0.25 * Math.sin(t * 2.2)) : 0;
    if (hit) {
      // the crash site glows; a base and towers appear around it
      if (t > 7) { const a = Math.min(1, (t - 7) / 2); ctx.globalAlpha = a; for (const [bx2, bh] of [[96, 18], [104, 26], [140, 22], [150, 14]]) { rr(bx2, iy - 22 - bh, 5, bh, 1, '#07090c'); el(bx2 + 2.5, iy - 23 - bh, 1, 1, (G.t >> 5) % 2 ? '#ff3a2a' : '#6a1a10'); } ctx.globalAlpha = 1; }
      cineSmoke(ix + 6, iy - 30, t, Math.min(1, (t - 4.4) / 1.2), 12, 90, 22, 'rgba(70,40,45,1)');
    }
    cineIsland(ix, iy, 1, g2);
    if (hit) { glow(ix + 6, iy - 28, 10 + g2 * 6, `rgba(255,140,60,${0.8 * g2})`, 'rgba(255,60,20,0)'); el(ix + 6, iy - 28, 3, 1.6, '#ffd08a'); }
    else {
      const u = Math.pow(t / 4.4, 1.6), mx = 420 + (ix + 6 - 420) * u, my = -30 + (iy - 28 + 30) * u, dx = 420 - (ix + 6), dy = -30 - (iy - 28), l = Math.hypot(dx, dy);
      const tl2 = 70, ex = mx + dx / l * tl2, ey = my + dy / l * tl2;
      const tg = ctx.createLinearGradient(mx, my, ex, ey); tg.addColorStop(0, 'rgba(255,240,200,0.95)'); tg.addColorStop(0.3, 'rgba(255,150,60,0.7)'); tg.addColorStop(1, 'rgba(200,40,20,0)');
      ctx.strokeStyle = tg; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(ex, ey); ctx.stroke();
      glow(mx, my, 14, 'rgba(255,200,120,0.9)', 'rgba(255,90,30,0)'); el(mx, my, 2.6, 2.6, '#fff6dc');
    }
    ctx.restore();
    if (hit && t < 5.2) { ctx.save(); ctx.globalAlpha = 1 - (t - 4.4) / 0.8; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  } else if (t < 17.8) {
    // scene B: briefing on the tactical map
    const u = t - 11.6;
    ctx.fillStyle = '#04121c'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(80,200,255,0.12)'; ctx.lineWidth = 0.5; ctx.beginPath();
    for (let x = 0; x <= W; x += 16) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = 0; y <= H; y += 16) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
    const isl = [[150, 60], [176, 48], [206, 52], [232, 66], [248, 92], [240, 118], [214, 132], [184, 128], [160, 114], [142, 92]];
    ctx.fillStyle = 'rgba(60,180,255,0.1)'; ctx.strokeStyle = '#5fd0ff'; ctx.lineWidth = 1; ctx.beginPath(); isl.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(268, 74); ctx.lineTo(282, 70); ctx.lineTo(290, 82); ctx.lineTo(276, 90); ctx.closePath(); ctx.stroke();
    const a = u * 1.1; ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#5fd0ff'; ctx.beginPath(); ctx.moveTo(196, 92); ctx.arc(196, 92, 90, a - 0.4, a); ctx.closePath(); ctx.fill(); ctx.restore();
    seg(196, 92, 196 + Math.cos(a) * 90, 92 + Math.sin(a) * 90, 0.8, '#9fe6ff');
    const tx = 212, ty = 98, pr = (u * 0.8) % 1;
    ctx.strokeStyle = `rgba(255,70,50,${1 - pr})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(tx, ty, 5 + pr * 10, 0, Math.PI * 2); ctx.stroke();
    seg(tx - 7, ty, tx + 7, ty, 0.8, '#ff5a3a'); seg(tx, ty - 7, tx, ty + 7, 0.8, '#ff5a3a'); el(tx, ty, 1.6, 1.6, '#ff5a3a');
    drawText('目标：异形巢穴', tx + 10, ty + 4, '#ff7a5a', 'left', 8);
    drawText('黑礁群岛', 150, 40, '#9fe6ff', 'left', 9);
    drawText('联合防卫军 · 作战简报', 10, 8, '#cfeeff', 'left', 9);
    drawText('绝密', W - 10, 8, '#ff5a3a', 'right', 8);
    drawText('北纬07°12′  东经162°40′', 10, 150, '#5fa8c8', 'left', 7);
    ctx.strokeStyle = '#5fa8c8'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(W - 24, 44); ctx.lineTo(W - 20, 30); ctx.lineTo(W - 16, 44); ctx.stroke(); drawText('北', W - 20, 18, '#5fa8c8', 'center', 7);
    // squad insignia
    if (u > 2.4) { ctx.save(); ctx.globalAlpha = Math.min(1, (u - 2.4) / 0.6); rr(28, 64, 70, 70, 8, 'rgba(120,20,10,0.35)'); ctx.strokeStyle = '#ff8a3a'; ctx.lineWidth = 1; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(28.5, 64.5, 69, 69, 8); else ctx.rect(28.5, 64.5, 69, 69); ctx.stroke();
      ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.moveTo(63, 74); ctx.quadraticCurveTo(80, 92, 72, 112); ctx.quadraticCurveTo(66, 100, 63, 104); ctx.quadraticCurveTo(58, 96, 52, 110); ctx.quadraticCurveTo(46, 92, 63, 74); ctx.fill();
      ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.moveTo(63, 88); ctx.quadraticCurveTo(70, 98, 66, 110); ctx.quadraticCurveTo(63, 104, 60, 110); ctx.quadraticCurveTo(56, 98, 63, 88); ctx.fill();
      drawText('赤焰', 63, 116, '#ffe2b0', 'center', 9); ctx.restore(); }
  } else {
    // scene C: night insertion over the jungle
    const u = t - 17.8, d = Math.min(u, 3.2), cx = 110 * d - 110 * d * d / 6.4;
    ctx.drawImage(SKY, 0, 0, W, H);
    let ox = -((cx * 0.12) % 768); ctx.drawImage(MTN, ox, 0, 768, H); ctx.drawImage(MTN, ox + 768, 0, 768, H);
    ox = -((cx * 0.42) % 768); ctx.drawImage(JUNGLE, ox, 0, 768, H); ctx.drawImage(JUNGLE, ox + 768, 0, 768, H);
    const gr = ctx.createLinearGradient(0, 176, 0, H); gr.addColorStop(0, '#4a4f58'); gr.addColorStop(1, '#2b2e35'); ctx.fillStyle = gr; ctx.fillRect(0, 176, W, H - 176);
    const gg = ctx.createLinearGradient(0, 176, 0, 182); gg.addColorStop(0, '#5bc25a'); gg.addColorStop(1, '#2a7a3a'); ctx.fillStyle = gg; ctx.fillRect(0, 176, W, 5.2);
    ctx.strokeStyle = '#8be07a'; ctx.lineWidth = 0.55; ctx.beginPath(); for (let gx = 0; gx < W; gx += 2) { const r = hash(Math.floor(gx + cx) * 31 + 9); if (r < 0.45) continue; ctx.moveTo(gx, 177); ctx.lineTo(gx + (r - 0.7) * 2, 175 - r * 2.2); } ctx.stroke();
    let hx = -60 + 256 * ease(u / 3.2), hy = 74 + Math.sin(t * 2) * 2;
    if (u > 4.8) { const v = u - 4.8; hx += v * v * 40; hy -= v * v * 14; }
    drawCineHeli(hx, hy, 1.15, 1);
    const PJ = { face: 1, frame: 0, pal: PAL_P, ax: 1, ay: 0 };
    if (u > 3.5 && u < 4.45) { const v = (u - 3.5) / 0.95, sx = 198 + v * 10, sy = 86 + v * v * 90; drawSoldier(sx, sy, 'spin', { ...PJ, frame: u * 16 }); }
    else if (u >= 4.45) { const v = Math.max(0, u - 5.3), sx = 208 + Math.min(v, 1.6) * 40; drawSoldier(sx, 176, v > 0 && v < 1.6 ? 'run' : 'stand', { ...PJ, frame: v * 10 }); }
    if (u > 5.2) {
      const a = Math.min(1, (u - 5.2) / 0.5);
      ctx.save(); ctx.globalAlpha = a;
      glow(W / 2, 74, 110, 'rgba(200,60,20,0.35)', 'rgba(200,60,20,0)');
      drawText('行动开始', W / 2, 52, '#ffd25a', 'center', 22);
      drawText('魂斗罗2026 · 行动开始', W / 2, 84, '#ffffff', 'center', 11);
      ctx.restore();
    }
  }
  drawPages(OPEN_PAGES, t);
  cineFade(t, [0, 11.6, 17.8, CINE_LEN.open]);
}
function drawEnding(t) {
  if (t < 11) {
    // scene A: escape from the island as it blows up
    const ix = 150, iy = 142, jit = t > 6 && t < 8 ? (1 - (t - 6) / 2) * 2.4 : 0, jx = (rnd() - 0.5) * jit, jy = (rnd() - 0.5) * jit;
    ctx.save(); ctx.translate(jx, jy);
    cineNightSea(t);
    if (t < 6.3) {
      cineIsland(ix, iy, 1.3, 0.6 + 0.4 * Math.min(1, t / 6) + 0.15 * Math.sin(t * 3));
      for (let k = 0; k < 10; k++) { const et = 0.4 + k * 0.55, v = (t - et) / 0.6; if (v < 0 || v > 1) continue; const bx2 = ix - 60 + hash(k * 7) * 130, by2 = iy - 10 - hash(k * 3) * 40, r = 4 + v * 12; ctx.globalAlpha = 1 - v; glow(bx2, by2, r, 'rgba(255,240,180,1)', 'rgba(255,90,20,0)'); ctx.globalAlpha = 1; }
    }
    if (t >= 6) {
      const u = t - 6;
      ctx.save(); ctx.beginPath(); ctx.rect(-20, -20, W + 40, iy + 22); ctx.clip();
      if (u < 2.6) { const r = 30 + Math.min(u, 1.6) * 75, fg = ctx.createRadialGradient(ix, iy, 0, ix, iy, r); fg.addColorStop(0, 'rgba(255,255,240,1)'); fg.addColorStop(0.3, 'rgba(255,220,120,0.95)'); fg.addColorStop(0.65, 'rgba(255,110,40,0.85)'); fg.addColorStop(1, 'rgba(160,30,10,0)'); ctx.globalAlpha = Math.max(0, 1 - Math.max(0, u - 1.6) / 1); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(ix, iy, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      if (u > 1.2) {
        const v = u - 1.2, a = Math.min(1, v / 0.8) * Math.max(0.3, 1 - v / 6);
        const stem = ctx.createLinearGradient(ix - 10, 0, ix + 10, 0); stem.addColorStop(0, `rgba(60,36,30,${a})`); stem.addColorStop(0.5, `rgba(110,60,40,${a})`); stem.addColorStop(1, `rgba(60,36,30,${a})`);
        const capY = iy - 46 - v * 9; ctx.fillStyle = stem; ctx.fillRect(ix - 8 - v, capY, 16 + v * 2, iy - capY);
        for (let k = 0; k < 7; k++) { const ang = k / 7 * Math.PI * 2, cr = 22 + v * 4; el(ix + Math.cos(ang) * cr, capY + Math.sin(ang) * cr * 0.35, 18 + v * 3, 11 + v * 2, `rgba(${80 + k * 6},${44 + k * 3},34,${a})`); }
        glow(ix, capY + 10, 40 + v * 4, `rgba(255,120,40,${0.4 * Math.max(0, 1 - v / 4)})`, 'rgba(255,80,20,0)');
      }
      ctx.restore();
      if (u < 3) { ctx.strokeStyle = `rgba(255,220,170,${Math.max(0, 1 - u / 3)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(ix, iy + 4, u * 150, u * 13, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    const hu = Math.max(0, t - 1), hx = ix + 5 + hu * 30 + hu * hu * 1.2, hy = iy - 14 - hu * 9 + Math.sin(t * 2) * 1.5;
    drawCineHeli(hx, hy, 0.5 + Math.min(1, hu / 10) * 0.6, 1);
    ctx.restore();
    if (t >= 6 && t < 6.9) { ctx.save(); ctx.globalAlpha = 1 - (t - 6) / 0.9; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  } else if (t < 20.6) {
    // scene B: flying home into the sunrise
    const u = t - 11, sy = 162 - ease(u / 7) * 44;
    const sg = ctx.createLinearGradient(0, 0, 0, 140); sg.addColorStop(0, '#1a2a5a'); sg.addColorStop(0.55, '#7a4a7a'); sg.addColorStop(0.85, '#e0703a'); sg.addColorStop(1, '#ffc070');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, 141);
    glow(250, sy, 70, 'rgba(255,220,150,0.6)', 'rgba(255,160,80,0)');
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 140); ctx.clip(); el(250, sy, 17, 17, '#ffe8a8'); ctx.restore();
    for (let i = 0; i < 6; i++) { const cy2 = 30 + hash(i * 5) * 70, cx2 = ((hash(i * 3) * 500 + u * (4 + i)) % 500) - 60; el(cx2, cy2, 40 + hash(i) * 40, 2.4 + hash(i * 7) * 2, 'rgba(255,170,150,0.35)'); }
    const wg = ctx.createLinearGradient(0, 140, 0, H); wg.addColorStop(0, '#5a3a5a'); wg.addColorStop(1, '#0e1426'); ctx.fillStyle = wg; ctx.fillRect(0, 140, W, H - 140);
    ctx.strokeStyle = 'rgba(255,210,140,0.65)'; ctx.lineWidth = 0.9; ctx.beginPath();
    for (let i = 0; i < 18; i++) { const y = 143 + i * 4, w2 = 22 - i * 0.6 + hash(i * 3) * 8, x = 250 - w2 / 2 + Math.sin(u * 0.8 + i) * 3; ctx.moveTo(x, y); ctx.lineTo(x + w2, y); }
    ctx.stroke();
    const v = ease(u / 9.6); drawCineHeli(40 + v * 196, 70 + v * 50, 1.05 - v * 0.7, 1, '#1a1420');
  } else {
    // scene C: congratulations and the credits roll
    const u = t - 20.6;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { ctx.globalAlpha = 0.3 + 0.4 * Math.abs(Math.sin(t * 0.5 + i)); el(hash(i * 7 + 1) * W, hash(i * 13 + 3) * H, 0.35, 0.35, '#fff'); }
    ctx.globalAlpha = 1;
    const sTime = Math.floor(G.time), tm = `${Math.floor(sTime / 60)}:${String(sTime % 60).padStart(2, '0')}`;
    const rows = [
      ['恭喜通关！', '#ffd25a', 18, 0], ['恭喜你通关了全部 8 关', '#ffffff', 11, 30],
      ['最终得分  ' + pad6(G.score), '#f2f2f2', 10, 66], ['通关用时  ' + tm, '#f2f2f2', 10, 82], ['阵亡次数  ' + G.deaths, '#f2f2f2', 10, 98],
      ['— 制作人员 —', '#9fd6ff', 10, 140], ['游戏设计  魂斗罗2026制作组', '#f2f2f2', 10, 162], ['关卡与美术  魂斗罗2026制作组', '#f2f2f2', 10, 178], ['音乐音效  魂斗罗2026制作组', '#f2f2f2', 10, 194], ['制作  玩家与克劳德', '#f2f2f2', 10, 210],
      ['特别感谢', '#9fd6ff', 10, 246], ['每一位坚持到这里的玩家', '#f2f2f2', 10, 262],
      ['全剧终', '#ff7a3a', 22, 330],
    ];
    const scroll = Math.min(u * 22, 460), base = H + 10 - scroll; // THE END comes to rest in the middle
    for (const [str, c, sz, oy] of rows) { const y = base + oy; if (y < -30 || y > H + 10) continue; drawText(str, W / 2, y, c, 'center', sz); }
  }
  drawPages(END_PAGES, t);
  cineFade(t, [11, 20.6, CINE_LEN.end]);
}

// ----- the underwater cinematics: before 水下第一关 and after 水下第八关 -----
const beatK = t => { const u = ((t - 0.5) % 1.1 + 1.1) % 1.1; return Math.exp(-u * 7) + 0.6 * Math.exp(-Math.max(0, u - 0.23) * 8) * (u > 0.23 ? 1 : 0); };
function cineRays(x0, w, top, len, a) {
  for (let k = 0; k < 6; k++) { const x = x0 + k * w / 6 + Math.sin(G.time * 0.4 + k) * 6; const g = ctx.createLinearGradient(0, top, 0, top + len); g.addColorStop(0, `rgba(190,235,255,${a})`); g.addColorStop(1, 'rgba(190,235,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 10, top); ctx.lineTo(x + 34, top + len); ctx.lineTo(x + 14, top + len); ctx.closePath(); ctx.fill(); }
}
function cineBubbles(x, y, t, n, seed) { for (let k = 0; k < n; k++) { const ph = ((t * 0.7 + hash(k + seed)) % 1), bx = x + Math.sin(ph * 6 + k) * 4 + (hash(k * 3 + seed) - 0.5) * 10, by = y - ph * 40; ctx.globalAlpha = 0.7 * (1 - ph); ctx.strokeStyle = '#dff6ff'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(bx, by, 0.8 + hash(k + seed * 2) * 1.4, 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1; }
function cineShip(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#0c1018'; ctx.beginPath(); ctx.moveTo(-40, -6); ctx.lineTo(42, -6); ctx.lineTo(34, 6); ctx.lineTo(-34, 6); ctx.closePath(); ctx.fill(); rr(-20, -18, 26, 12, 2, '#0c1018'); rr(-12, -28, 4, 10, 1, '#0c1018'); seg(14, -6, 26, -30, 1.4, '#0c1018'); seg(26, -30, 32, -10, 0.8, '#0c1018'); el(-10, -30, 1.2, 1.2, (G.t >> 5) % 2 ? '#ff4a2a' : '#5a1a10'); ctx.restore(); }
function drawUWOpening(t) {
  if (t < 9.4) {
    // scene A: a quiet sea at night; a heartbeat thumps up from the deep
    const sg = ctx.createLinearGradient(0, 0, 0, 100); sg.addColorStop(0, '#05081a'); sg.addColorStop(1, '#1c2a4a'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, 100);
    for (let i = 0; i < 50; i++) { ctx.globalAlpha = 0.3 + 0.4 * Math.abs(Math.sin(t * 0.5 + i)); el(hash(i * 7 + 2) * W, hash(i * 11 + 5) * 86, 0.35, 0.35, '#fff'); } ctx.globalAlpha = 1;
    el(300, 30, 9, 9, '#e8e4d0'); el(303, 28, 8, 8, '#05081a');
    const wg = ctx.createLinearGradient(0, 100, 0, H); wg.addColorStop(0, '#0e2a48'); wg.addColorStop(1, '#020610'); ctx.fillStyle = wg; ctx.fillRect(0, 100, W, H - 100);
    ctx.strokeStyle = 'rgba(160,200,240,0.4)'; ctx.lineWidth = 0.8; ctx.beginPath(); for (let x = 0; x <= W; x += 6) { const y = 100 + Math.sin(x * 0.05 + t * 1.2) * 1.4; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    cineShip(90, 100, 1);
    const b = beatK(t), dx = 230, dy = 236;
    glow(dx, dy, 70 + b * 30, `rgba(220,40,60,${0.25 + 0.35 * b})`, 'rgba(200,20,40,0)');
    for (let k = 0; k < 4; k++) { const ph = ((t - 0.5) / 1.1 - k * 0.25) % 1; if (ph < 0 || t < 0.5) continue; ctx.strokeStyle = `rgba(255,120,130,${0.5 * (1 - ph)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(dx, dy, 20 + ph * 150, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); }
    if (t > 2) { const a = Math.min(1, (t - 2) / 1); ctx.save(); ctx.globalAlpha = a; rr(250, 112, 118, 34, 3, 'rgba(0,20,30,0.7)'); drawText('声呐', 256, 116, '#5fd0ff', 'left', 7); ctx.strokeStyle = '#ff6a5a'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x <= 104; x += 2) { const tt = t - (104 - x) * 0.02, y = 136 - beatK(tt) * 10; x ? ctx.lineTo(256 + x, y) : ctx.moveTo(256, y); } ctx.stroke(); ctx.restore(); }
  } else if (t < 16.2) {
    // scene B: the dive route on the sonar display, down to the Ancient Mother
    const u = t - 9.4;
    ctx.fillStyle = '#031418'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(80,220,200,0.1)'; ctx.lineWidth = 0.5; ctx.beginPath(); for (let x = 0; x <= W; x += 16) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = 0; y <= H; y += 16) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
    drawText('深海声呐 · 下潜路线', 10, 8, '#bff4ea', 'left', 9); drawText('深度', W - 10, 8, '#5fd0b0', 'right', 8);
    ctx.strokeStyle = '#4ad8b0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(W, 30); ctx.stroke();
    const bed = [[0, 60], [50, 66], [90, 80], [130, 76], [170, 96], [210, 104], [240, 124], [262, 136], [280, 150], [300, 158], [322, 150], [340, 128], [384, 120]];
    ctx.fillStyle = 'rgba(60,200,170,0.12)'; ctx.beginPath(); ctx.moveTo(0, H); bed.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4ad8b0'; ctx.beginPath(); bed.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    const wp = [[30, 44, '珊瑚浅海'], [74, 56, '沉船墓场'], [110, 66, '海底火山'], [150, 70, '深海洋流'], [186, 84, '黑暗深渊'], [222, 96, '海底要塞'], [252, 120, '冰封海沟'], [300, 148, '远古母体']];
    const n = Math.min(8, Math.floor(u / 0.6) + 1);
    ctx.strokeStyle = 'rgba(255,220,120,0.7)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); for (let i = 0; i < n; i++) i ? ctx.lineTo(wp[i][0], wp[i][1]) : ctx.moveTo(wp[i][0], wp[i][1]); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 0; i < n; i++) { const [x, y, nm] = wp[i], last = i === 7; if (last) { const pr = (u * 0.9) % 1; ctx.strokeStyle = `rgba(255,70,60,${1 - pr})`; ctx.beginPath(); ctx.arc(x, y, 5 + pr * 12, 0, Math.PI * 2); ctx.stroke(); glow(x, y, 10 + beatK(t) * 6, 'rgba(255,60,60,0.7)', 'rgba(255,40,40,0)'); }
      el(x, y, 2.2, 2.2, last ? '#ff5a4a' : '#ffd25a'); drawText(`${i + 1} ${nm}`, x + (last ? -6 : 5), y - (last ? 14 : 9), last ? '#ff8a7a' : '#ffe9a0', last ? 'right' : 'left', 7); }
  } else {
    // scene C: off the side of the ship and down into the blue
    const u = t - 16.2, WL = 72;
    const sg = ctx.createLinearGradient(0, 0, 0, WL); sg.addColorStop(0, '#2a3a6a'); sg.addColorStop(1, '#e09a6a'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, WL);
    const wg = ctx.createLinearGradient(0, WL, 0, H); wg.addColorStop(0, '#1e6a9a'); wg.addColorStop(1, '#06233c'); ctx.fillStyle = wg; ctx.fillRect(0, WL, W, H - WL);
    cineRays(120, 240, WL, 140, 0.12);
    ctx.fillStyle = '#121822'; ctx.beginPath(); ctx.moveTo(-10, WL - 18); ctx.lineTo(120, WL - 18); ctx.lineTo(108, WL + 10); ctx.lineTo(-10, WL + 10); ctx.closePath(); ctx.fill(); rr(-10, WL - 34, 60, 16, 2, '#121822'); seg(110, WL - 18, 110, WL - 30, 1, '#2a3440'); seg(70, WL - 18, 70, WL - 30, 1, '#2a3440'); seg(70, WL - 30, 110, WL - 30, 1, '#2a3440');
    ctx.strokeStyle = 'rgba(220,240,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x <= W; x += 6) { const y = WL + Math.sin(x * 0.06 + t * 1.4) * 1.2; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    const PJ = { face: 1, frame: 0, pal: PAL_P, ax: 1, ay: 0 };
    if (u < 2.2) drawSoldier(96, WL - 18, 'stand', PJ);
    else if (u < 2.7) { const v = (u - 2.2) / 0.5; drawSoldier(96 + v * 40, WL - 18 - Math.sin(v * Math.PI) * 26 + v * 26, 'spin', { ...PJ, frame: u * 16 }); }
    else {
      const v = u - 2.7, sx = 136 + v * 22, sy = WL + 8 + Math.min(v, 5) * 18 + Math.sin(v * 2) * 2;
      if (v < 1.2) { ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - v / 1.2)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(136, WL, 6 + v * 24, 2 + v * 3, 0, 0, Math.PI * 2); ctx.stroke(); }
      drawSwimmer(sx, sy, { face: 1, frame: v * 8, pal: PAL_P, ax: 1, ay: 0.4 }); cineBubbles(sx - 4, sy - 4, t, 6, 3);
    }
    if (u > 6) { const a = Math.min(1, (u - 6) / 0.5); ctx.save(); ctx.globalAlpha = a; glow(W / 2, 112, 110, 'rgba(40,120,200,0.35)', 'rgba(40,120,200,0)'); drawText('开始下潜', W / 2, 96, '#9ff0ff', 'center', 22); drawText('水下八关 · 作战开始', W / 2, 128, '#ffffff', 'center', 11); ctx.restore(); }
  }
  drawPages(UWO_PAGES, t);
  cineFade(t, [0, 9.4, 16.2, CINE_LEN.uwopen]);
}
function drawUWEnding(t) {
  if (t < 10.6) {
    // scene A: the trench caves in; swim for your life
    const shakeK = t < 6 ? 0.6 + t * 0.15 : t < 7.5 ? 3 * (1 - (t - 6) / 1.5) + 0.6 : 0.6, jx = (rnd() - 0.5) * shakeK * 2, jy = (rnd() - 0.5) * shakeK * 2;
    ctx.save(); ctx.translate(jx, jy);
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a0a1a'); bg.addColorStop(1, '#4a0c18'); ctx.fillStyle = bg; ctx.fillRect(-10, -10, W + 20, H + 20);
    ctx.fillStyle = '#1a0610'; ctx.beginPath(); ctx.moveTo(-10, -10); for (let y = -10; y <= H + 10; y += 12) ctx.lineTo(60 + Math.sin(y * 0.07) * 14, y); ctx.lineTo(-10, H + 10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W + 10, -10); for (let y = -10; y <= H + 10; y += 12) ctx.lineTo(W - 60 - Math.sin(y * 0.08 + 1) * 14, y); ctx.lineTo(W + 10, H + 10); ctx.fill();
    if (t < 6) { const b = 0.5 + 0.5 * Math.sin(t * 6); glow(192, 200, 60 + b * 20, `rgba(255,80,60,${0.4 + 0.2 * b})`, 'rgba(255,40,20,0)'); el(192, 206, 26, 18, '#5a1430'); el(192, 208, 12, 10, '#e8dcae'); el(192, 210, 5, 6, '#a02020'); }
    for (let k = 0; k < 9; k++) { const et = 0.5 + k * 0.6, v = (t - et) / 0.7; if (v < 0 || v > 1) continue; const bx2 = 80 + hash(k * 7) * 224, by2 = 40 + hash(k * 3) * 150, r = 6 + v * 16; ctx.globalAlpha = 1 - v; glow(bx2, by2, r, 'rgba(255,240,180,1)', 'rgba(255,90,20,0)'); ctx.globalAlpha = 1; }
    for (let k = 0; k < 10; k++) { const ph = ((t * 0.5 + hash(k * 5)) % 1), rx = 70 + hash(k * 9) * 244, ry = -10 + ph * 240; rr(rx, ry, 6 + hash(k) * 8, 5 + hash(k * 2) * 6, 2, '#3a1020'); }
    const sy = 190 - t * 17, sx = 192 + Math.sin(t * 1.4) * 10;
    drawSwimmer(sx, sy, { face: 1, frame: t * 9, pal: PAL_P, ax: 0.3, ay: -1 }); cineBubbles(sx, sy + 6, t, 6, 9);
    ctx.restore();
    if (t >= 6 && t < 7) { ctx.save(); ctx.globalAlpha = 1 - (t - 6); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  } else if (t < 20.4) {
    // scene B: up into the light, out into the morning, and a ride home
    const u = t - 10.6, WL = 84;
    const sg = ctx.createLinearGradient(0, 0, 0, WL); sg.addColorStop(0, '#3a5a9a'); sg.addColorStop(0.7, '#f0a070'); sg.addColorStop(1, '#ffd090'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, WL);
    glow(300, WL - 4, 50, 'rgba(255,220,150,0.6)', 'rgba(255,160,80,0)'); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, WL); ctx.clip(); el(300, WL - 2, 14, 14, '#ffe8a8'); ctx.restore();
    const wg = ctx.createLinearGradient(0, WL, 0, H); wg.addColorStop(0, '#2a8ab8'); wg.addColorStop(1, '#083050'); ctx.fillStyle = wg; ctx.fillRect(0, WL, W, H - WL);
    cineRays(80, 260, WL, 140, 0.16);
    ctx.strokeStyle = 'rgba(255,240,220,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x <= W; x += 6) { const y = WL + Math.sin(x * 0.06 + t * 1.4) * 1.2; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    const up = Math.min(1, u / 4), sx = 170, sy = 210 - up * (210 - WL - 6);
    let hx = 470 - ease((u - 4.6) / 2.2) * 290, hy = 34;
    if (u > 8.4) { const v = u - 8.4; hx -= v * v * 40; hy -= v * v * 10; }
    if (u > 4.4) drawCineHeli(hx, hy, 0.95, -1);
    if (u < 4.2) { drawSwimmer(sx, sy, { face: 1, frame: u * 9, pal: PAL_P, ax: 0.2, ay: -1 }); cineBubbles(sx, sy + 6, t, 6, 4); }
    else {
      const v = u - 4.2; if (v < 1) { ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - v)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(sx, WL, 6 + v * 20, 2 + v * 3, 0, 0, Math.PI * 2); ctx.stroke(); }
      if (u > 6.8) { const ladder = hx + 2, climb = Math.min(1, (u - 7.2) / 1.2), py = u < 7.2 ? WL + 6 : WL + 6 - climb * (WL + 6 - hy - 18); seg(ladder, hy + 10, ladder, Math.max(py, WL + 4), 0.8, '#d9d2c3'); drawSoldier(ladder, py + 10, u < 7.2 ? 'stand' : 'stand', { face: -1, frame: 0, pal: PAL_P, ax: 0, ay: -1 }); }
      else { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, WL + 2); ctx.clip(); drawSoldier(sx + (hx + 2 - sx) * Math.max(0, (u - 5.8) / 1), WL + 12, 'stand', { face: 1, frame: 0, pal: PAL_P, ax: 0, ay: -1 }); ctx.restore(); }
    }
  } else {
    // scene C: congratulations and credits
    const u = t - 20.4;
    ctx.fillStyle = '#00060e'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const ph = ((t * 0.12 + hash(i * 3)) % 1); ctx.globalAlpha = 0.5 * (1 - ph); ctx.strokeStyle = '#9fd6ff'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(hash(i * 7) * W, H - ph * H, 0.6 + hash(i) * 1.2, 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1;
    const sTime = Math.floor(G.time), tm = `${Math.floor(sTime / 60)}:${String(sTime % 60).padStart(2, '0')}`;
    const rows = [
      ['恭喜通关！', '#ffd25a', 18, 0], ['传说中的水下八关全部通关', '#ffffff', 11, 30],
      ['最终得分  ' + pad6(G.score), '#f2f2f2', 10, 66], ['通关用时  ' + tm, '#f2f2f2', 10, 82], ['阵亡次数  ' + G.deaths, '#f2f2f2', 10, 98],
      ['— 水下八关 —', '#9fd6ff', 10, 140], ['珊瑚浅海 · 沉船墓场 · 海底火山 · 深海洋流', '#f2f2f2', 9, 160], ['黑暗深渊 · 海底要塞 · 冰封海沟 · 远古母体', '#f2f2f2', 9, 176],
      ['— 制作人员 —', '#9fd6ff', 10, 216], ['游戏设计  魂斗罗2026制作组', '#f2f2f2', 10, 238], ['制作  玩家与克劳德', '#f2f2f2', 10, 254],
      ['感谢游玩', '#9fd6ff', 10, 290],
      ['全剧终', '#ff7a3a', 22, 380],
    ];
    const scroll = Math.min(u * 22, 510), base = H + 10 - scroll;
    for (const [str, c, sz, oy] of rows) { const y = base + oy; if (y < -30 || y > H + 10) continue; drawText(str, W / 2, y, c, 'center', sz); }
  }
  drawPages(UWE_PAGES, t);
  cineFade(t, [10.6, 20.4, CINE_LEN.uwend]);
}
function drawCine() {
  const C = G.cine; if (!C) return;
  C2D(); setT();
  if (C.kind === 'open') drawOpening(C.t); else if (C.kind === 'uwopen') drawUWOpening(C.t); else if (C.kind === 'uwend') drawUWEnding(C.t); else drawEnding(C.t);
  if (C.t > 0.6) drawText('按回车或点击屏幕跳过', W - 8, H - 12, 'rgba(255,255,255,0.55)', 'right', 7);
}
const C2D = () => { C = ctx; };

// ================= HUD & screens =================
const hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function updateHud() { if (cooperative() && coop.role === 'guest') withPlayer2(updateHudContent); else updateHudContent(); }
function updateHudContent() {
  const p = G.p,form=isCelestial()?transformation(p):null,gcd = Math.max(0, p.spCd,form?.switchCooldown||0), ready = gcd <= 0 && (G.inv.length > 0||!!form);
  setText('bGren', form?'换形 · '+TRANSFORM_FORMS[form.form].name:!G.inv.length ? '道具' : gcd > 0 ? gcd.toFixed(1) : WUKONG && G.inv[G.sel] === 'h' ? '筋斗云' : isCelestial() && G.inv[G.sel] === 'g' ? WUKONG_MAGIC_SHORT.clone : SP_SHORT[G.inv[G.sel]]);
  if(WUKONG)setText('bFire',form?TRANSFORM_FORMS[form.form].skill:'棍击 / 蓄力');
  bG.classList.toggle('dim', !ready);
  const rageMode=isCelestial(),ncd=Math.max(0,G.nadeCd||0),full=rageMode&&rageReady(p)&&!p.dead;
  setText('bNade',rageMode?(full?'大招':'怒气 '+Math.floor(p.rage||0)+'%'):ncd>0?ncd.toFixed(1):!WUKONG&&p.ride==='heli'?'导弹':'手雷');
  bN.classList.toggle('dim',rageMode?!full:ncd>0);bN.classList.toggle('rage-ready',full&&G.mode==='play');
  if(rageMode)bN.setAttribute('aria-label',full?'怒气已满，点击随机释放大招':'怒气 '+Math.floor(p.rage||0)+'%，受击积攒');
}
// special-item slots are drawn on the canvas; a tap or click on one selects it
function slotHit(clientX, clientY) {
  if (G.mode !== 'play') return false;
  const r = cv.getBoundingClientRect(), x = (clientX - r.left) / r.width * W, y = (clientY - r.top) / r.height * H;
  const guest = cooperative() && coop.role === 'guest';
  const slot = inventorySlotAt(x, y, guest ? 1 : 0);
  if (slot < 0) return false;
  if (guest) { if (slot < G.inv2.length) coop.action('select', slot); }
  else if (slot < G.inv.length) G.sel = slot;
  return true;
}
cv.addEventListener('pointerdown', e => { if (slotHit(e.clientX, e.clientY)) e.preventDefault(); });
document.addEventListener('pointerdown', () => { if (G.mode === 'cine' && G.cine && G.cine.t > 0.6) G.cine.skip = true; });
// medal-cursor menus
function menuButtons() { const scr = ['scrTitle', 'scrSelect', 'scrPause', 'scrOver', 'scrClear', 'scrLoading'].map($).find(el => !el.hidden); return scr ? [...scr.querySelectorAll('.menu .btn:not([hidden])')] : []; }
function focusMenu(d) {
  const bs = menuButtons(); if (!bs.length) return;
  let i = bs.indexOf(document.activeElement);
  i = i < 0 ? 0 : (i + d + bs.length) % bs.length;
  bs[i].focus({ preventScroll: true }); sfx.hit();
}
function handleGamepadMenu(I,root) {
  const gp=gamepads.last;
  const controls=[...root.querySelectorAll('button:not(:disabled), select:not(:disabled), input:not(:disabled):not([type="radio"]), input[type="radio"]:checked, [tabindex="0"]')].filter(el=>el.getClientRects().length);
  if(!controls.length)return;
  let focused=document.activeElement;
  const vertical=I.upEdge&&gp.up?-1:I.downEdge&&gp.down?1:0;
  if(vertical){
    const index=controls.indexOf(focused);focused=controls[index<0?0:(index+vertical+controls.length)%controls.length];
    focused.focus({preventScroll:true});focused.scrollIntoView({block:'nearest'});
  }
  const horizontal=I.leftEdge&&gp.left?-1:I.rightEdge&&gp.right?1:0;
  if(horizontal&&controls.includes(focused)){
    if(focused.tagName==='SELECT'){
      const options=[...focused.options].filter(option=>!option.disabled),index=options.indexOf(focused.selectedOptions[0]);
      const option=options[(index+horizontal+options.length)%options.length];
      if(option){focused.value=option.value;focused.dispatchEvent(new Event('change',{bubbles:true}));}
    }else if(focused.matches('input[type="radio"]')){
      const radios=[...focused.closest('fieldset').querySelectorAll('input:not(:disabled)')],index=radios.indexOf(focused);
      const next=radios[(index+horizontal+radios.length)%radios.length];next.click();next.focus({preventScroll:true});
    }else if(focused.closest('#record-player'))turnRecord(horizontal);
    else if(focused.closest('[role="tablist"]')){
      const tab=focused.id==='tabSet'?$('tabHelp'):$('tabSet');tab.click();tab.focus({preventScroll:true});
    }
  }
  if((I.jumpEdge&&gp.jump||I.fireEdge&&gp.fire||I.startEdge&&gp.start)&&controls.includes(focused))focused.click();
}
document.addEventListener('pointerover', e => { const b = e.target.closest && e.target.closest('.menu .btn'); if (b) b.focus({ preventScroll: true }); });
const screens = ['scrTitle', 'scrCoop', 'scrSelect', 'scrPause', 'scrOver', 'scrClear', 'scrSettings', 'scrLoading'];
function showScreen(id) {
  for (const s of screens) $(s).hidden = s !== id;
  $('hud').hidden = ['title', 'lobby', 'select', 'intro', 'cine', 'loading'].includes(G.mode) || (G.mode === 'settings' && G.settingsFrom === 'title');
  const first = id && !['scrSettings', 'scrLoading'].includes(id) && $(id).querySelector('.menu .btn:not([hidden])');
  if (first) first.focus({ preventScroll: true });
}
function setMode(m) {
  lifeCheat.resetInput();
  if(m!=='play')weaponAudio?.stopAll();
  if(m!=='play')wukongBattleAudio?.stopAll();
  if(m!=='play')wukongHeroAudio?.stopAll();
  if(isCelestial()&&m!=='play')for(const actor of players())cancelStaffCharge(actor,true);
  G.mode = m; prev.start = true; prev.jump = true; prev.fire = true; prev.gren = true; prev.cyc = true; prev.esc = true; prev.up = true; prev.down = true;
  prev.nade=true;prev.left=true;prev.right=true;
  tl.classList.toggle('on', m === 'play');
  if (m !== 'play') releaseTouch();
  showScreen({ title: 'scrTitle', lobby: 'scrCoop', select: 'scrSelect', pause: 'scrPause', over: 'scrOver', clear: 'scrClear', settings: 'scrSettings', loading: 'scrLoading' }[m] || null);
  if (m === 'play' || m === 'intro' || m === 'cine') { const b = document.activeElement; if (b && b.blur) b.blur(); }
  Music.sync();
  if (['cine','intro','play'].includes(m)) startBackgroundMusic();
}
function startGame() {
  return startAfterLoading(startOpening, 1);
}
function updateLoadingUI(state) {
  const percent = Math.floor(state.loaded / Math.max(1,state.total) * 100);
  $('loadingPercent').textContent = percent + '%'; $('loadingFill').style.width = percent + '%';
  $('loadingProgress').setAttribute('aria-valuenow', String(percent));
  $('loadingDetail').textContent = `${state.loaded} / ${state.total} 项已就绪 · ${state.failed.length ? state.failed.length + ' 项失败，正在完成其余资源' : '完成后自动开始'}`;
}
async function startAfterLoading(action, stage=1, retry=false) {
  if (!canPlayStage(stage)) { G.toastText=RELEASE_MESSAGE;G.toastUntil=performance.now()+3000;return false; }
  if (pendingStart && !retry) return false;
  const serial = ++loadingSerial, previousMode = pendingStart?.previousMode || G.mode;
  const startupTracks=startupMusicKeys(stage);
  if (!retry) gameResources = new ResourcePreloader(stageJobs(stage),{cache:resourceCache});
  pendingStart = {action,stage,previousMode}; initAudio(); setMode('loading');
  $('scrLoading').setAttribute('aria-busy','true'); $('loadingRetry').hidden = true;
  $('loadingStatus').textContent = WUKONG&&stage===1?'正在准备第一关 · 云海天宫':`正在准备第 ${stage} 关画面与音乐`; $('loadingStatus').focus({preventScroll:true});
  try {
    await gameResources.load(state => { if (serial === loadingSerial) updateLoadingUI(state); });
    if (serial !== loadingSerial) return false;
    $('loadingStatus').textContent = WUKONG?'正在准备配乐与招式音效':'正在准备声音';
    if (AC) await Promise.all(startupTracks.map(key=>referenceMusic.load(key,AC)));
    if (serial !== loadingSerial) return false;
    pendingStart = null; $('scrLoading').setAttribute('aria-busy','false');
    setMode(previousMode); await action(); return true;
  } catch (error) {
    if (serial !== loadingSerial) return false;
    $('scrLoading').setAttribute('aria-busy','false');
    $('loadingStatus').textContent = '部分资源未能加载';
    const failed = gameResources.inspect().failed;
    const names = failed.slice(0,3).map(id => id.split('/').pop().replace(/^music:/,''));
    $('loadingDetail').textContent = failed.length
      ? `${failed.length} 项失败：${names.join('、')}${failed.length > 3 ? ' 等' : ''}。已保留成功资源，重试可继续。`
      : `声音准备失败：${error.message || '无法解码音频'}。请重试加载。`;
    $('loadingRetry').hidden = false; $('loadingRetry').focus({preventScroll:true});
    if (['localhost','127.0.0.1','[::1]'].includes(location.hostname)) {
      try {
        await fetch('/games/'+GAME_ID+'/',{method:'HEAD',cache:'no-store',signal:AbortSignal.timeout(2500)});
      } catch {
        if (serial !== loadingSerial) return false;
        $('loadingStatus').textContent = '本地游戏服务已断开';
        $('loadingDetail').textContent = '请启动项目后点击“重试加载”。已成功加载的资源会保留。';
      }
    }
    return false;
  }
}
function cancelLoading() { ++loadingSerial; pendingStart = null; remoteWorld = null; coopBusy(false); toTitle(); }
$('loadingRetry').onclick = () => pendingStart && startAfterLoading(pendingStart.action,pendingStart.stage,true);
$('loadingCancel').onclick = cancelLoading;
function startStage(n, carry, continueMusic=false) {
  if (!canPlayStage(n)) { G.toastText=RELEASE_MESSAGE;G.toastUntil=performance.now()+3000;return false; }
  if((!WUKONG||n===2)&&!stageResourcesReady(n))return startAfterLoading(()=>startStage(n,carry,continueMusic),n);
  if(!WUKONG||n===2)gameResources=new ResourcePreloader(stageJobs(n),{cache:resourceCache});
  if(WUKONG&&n===1&&!continueMusic)Music.stop();
  initAudio(); reset(n, carry); G.introT = 2.4; setMode('intro'); Music.start(false, STAGE_MUSIC_SHIFT[n]);
  flushRemoteWorld();
}
function beginPlay() { setMode('play'); Music.start(false, STAGE_MUSIC_SHIFT[G.stage]); }
function pause() { if (cooperative() && coop.role === 'guest') { coop.action('pause'); return; } if (G.mode !== 'play') return; setMode('pause'); if (AC) AC.suspend().catch(() => {}); }
function resume() { if (cooperative() && coop.role === 'guest') { coop.action('resume'); return; } initAudio(); setMode('play'); }
let overTimer = null;
function gameOver() {
  setMode('over'); Music.stop();
  let n = 9; G.continueCount = n; $('count').textContent = n;
  clearInterval(overTimer);
  overTimer = setInterval(() => { n--; G.continueCount = Math.max(n, 0); $('count').textContent = G.continueCount; if (n < 0) { clearInterval(overTimer); toTitle(); } }, 1000);
}
function continueGame() { clearInterval(overTimer);if(isSiege()){G.lives=SET.diff==='easy'?5:3;G.p=newPlayer(G.siege.checkpointX);if(cooperative())G.p2={...newPlayer(G.siege.checkpointX+22),pid:2};WukongSiege.retryRoom(G,players(),siegeHooks());setMode('play');Music.start(false,-3);return;}startStage(G.stage || 1); }
function toTitle() { ++loadingSerial;pendingStart=null;remoteWorld=null;clearThirtyLives();if (coop?.room) coop.leave(); if (soloSettings) { Object.assign(SET, soloSettings); soloSettings = null; } $('coopBar').hidden = true; for (const id of ['btnRestart', 'btnAgain', 'btnNext', 'btnContinue', 'btnSettings']) $(id).disabled = false; clearInterval(overTimer); Music.stop(); reset(); setMode('title'); }
function stageClear() {
  if (!WUKONG && G.stage === LAST_STAGE && G.mode === 'play') { startEnding(); return; }
  if (G.stage === lastPlayableStage()) { showClear();return; }
  if (G.stage === 16 && G.mode === 'play') { startUWEnding(); return; } // the last underwater boss leads into its own ending
  if (G.stage === LAST_STAGE && G.mode === 'play') { startEnding(); return; } // the last boss leads into the ending
  showClear();
}
function showClear() {
  syncClearUI();
  setMode('clear'); Music.stop();
  if (AC) [69, 72, 76, 81, 79, 81].forEach((m, i) => tone(mfreq(m), 0.18, 'square', 0.07, 0, AC.currentTime + i * 0.13));
  $('stScore').textContent = String(G.score).padStart(6, '0');
  const s = Math.floor(G.time); $('stTime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  $('stDeaths').textContent = G.deaths;
  $('stHi').textContent = String(HI).padStart(6, '0');
}
function syncClearUI() {
  const next=nextPlayableStage(G.stage),finished=G.stage===lastPlayableStage();
  $('clearTitle').textContent=finished?(WUKONG?'大闹天宫 · 第二章通关':'前八关通关'):'关卡完成';
  $('clearSub').textContent=STAGE_NUM[G.stage]+' · '+STAGE_NAMES[G.stage]+(finished?(WUKONG?(cooperative()?' · 双人共破南天门':' · 增长天王已败退'):(cooperative()?' · 双人通关 · 后续关卡制作中':' · 试玩完成 · 后续关卡制作中')):'');
  $('btnNext').hidden=!next;$('btnNext').textContent=next?'进入'+STAGE_NUM[next]:'';
}
$('btnStart').onclick = startGame;
$('btnResume').onclick = resume;
$('btnRestart').onclick = () => startStage(G.stage || 1);
$('btnContinue').onclick = continueGame;
$('btnQuit').onclick = toTitle;
$('btnAgain').onclick = () => startStage(G.stage || 1);
$('btnNext').onclick = () => { const next=nextPlayableStage(G.stage);if(next)startStage(next,true); };
$('btnSelect').onclick = () => setMode('select');
$('btnSel1').onclick = startGame;
$('btnSel2').onclick = () => startAfterLoading(() => startStage(2), 2);
$('btnSel3').onclick = () => startAfterLoading(() => startStage(3), 3);
$('btnSel4').onclick = () => startAfterLoading(() => startStage(4), 4);
$('btnSel5').onclick = () => startStage(5);
$('btnSel6').onclick = () => startStage(6);
$('btnSel7').onclick = () => startStage(7);
$('btnSel8').onclick = () => startStage(8);
$('btnSelW1').onclick = () => startUWOpening(false);
$('btnSelW2').onclick = () => startStage(10);
$('btnSelW3').onclick = () => startStage(11);
$('btnSelW4').onclick = () => startStage(12);
$('btnSelW5').onclick = () => startStage(13);
$('btnSelW6').onclick = () => startStage(14);
$('btnSelW7').onclick = () => startStage(15);
$('btnSelW8').onclick = () => startStage(16);
// Closed stages remain locked; title cheats affect lives only.
let UW_OPEN = false; try { UW_OPEN = localStorage.getItem('chiyan-uw') === '1'; } catch (e) {}
function syncUnlock() {
  for(let stage=1;stage<=16;stage++){const button=$(stage<=8?'btnSel'+stage:'btnSelW'+(stage-8));button.hidden=button.disabled=!canPlayStage(stage);}
}
function unlockUW(msg) {
  syncUnlock();if(msg){G.toastText=RELEASE_MESSAGE;G.toastUntil=performance.now()+3000;}
}
syncUnlock();
function activateThirtyLives(){
  if(WUKONG||G.mode!=='title')return false;
  const changed=lifeCheat.enable();G.toastText='秘籍成功 · 30 条命已就绪';G.toastUntil=performance.now()+3500;
  $('lifeCheatStatus').textContent='30 条命已就绪，选择开始游戏后生效';$('btnStart').textContent='单人闯关 · 30 条命';$('btnStart').focus({preventScroll:true});
  initAudio();if(changed)sfx.pick();return true;
}
function clearThirtyLives(){
  lifeCheat.clear();G.thirtyLives=false;if(WUKONG)return;
  $('lifeCheatStatus').textContent='';$('btnStart').textContent='单人闯关';G.toastUntil=0;
}
document.addEventListener('keydown', e => {
  if(WUKONG||G.mode!=='title')return;
  if(lifeCheat.key(e.code,performance.now(),{repeat:e.repeat,modified:e.ctrlKey||e.altKey||e.metaKey}))activateThirtyLives();
});
let logoPointer=null;
document.addEventListener('pointerdown', e => {
  if(WUKONG||G.mode!=='title'||e.pointerType!=='touch'||e.isPrimary===false)return;
  const r = cv.getBoundingClientRect(), y = (e.clientY - r.top) / r.height * H, x = (e.clientX - r.left) / r.width * W;
  if(!inTitleLogo(x,y))return;
  logoPointer={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now()};if(e.cancelable)e.preventDefault();
});
document.addEventListener('pointerup',e=>{
  const pointer=logoPointer;if(!pointer||pointer.id!==e.pointerId)return;logoPointer=null;
  if(WUKONG||G.mode!=='title'||e.pointerType!=='touch')return;
  if(performance.now()-pointer.time>450||Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>12){lifeCheat.resetInput();return;}
  if(e.cancelable)e.preventDefault();if(lifeCheat.tap(performance.now()))activateThirtyLives();
});
document.addEventListener('pointercancel',()=>{logoPointer=null;lifeCheat.resetInput();});
$('btnSelBack').onclick = () => setMode('title');
let musicSettingsStage = 1;
const lastManualMusic = {};
const recordShortNames = { original: '原版', orchestral: '大交响', rock: '摇滚', epic: '史诗', industrial: '工业金属', cyberpunk: '赛博朋克', chiptune: '电子乐', off: '关闭' };
const musicStageOptions = stages => stages.map(stage => `<option value="${stage}">${STAGE_NUM[stage]} · ${STAGE_NAMES[stage]}</option>`).join('');
if(WUKONG)$('set-music-stage').innerHTML = musicStageOptions(GAME_STAGES);
function syncStageMusicUI(animate = false) {
  if(!WUKONG)return;
  $('set-music-stage').value = String(musicSettingsStage);
  const choice = SET.stageMusic[musicSettingsStage], record = gameMusicRecord(musicSettingsStage, choice);
  const options = gameMusicOptions(musicSettingsStage).filter(option => option.value !== 'random');
  const art = $('record-art'); art.src = record.art; art.alt = record.title + ' · 唱片图';
  if (animate) { art.classList.remove('record-changing'); void art.offsetWidth; art.classList.add('record-changing'); }
  $('record-player').style.setProperty('--record-accent', record.color);
  $('record-edition').textContent = record.edition;
  $('record-title').textContent = record.title;
  const listening = stageMusicSession.inspect();
  $('record-description').textContent = choice === 'random' && listening.stage === musicSettingsStage && listening.preference === 'random' && listening.choice
    ? '本次播放：' + gameMusicRecord(musicSettingsStage, listening.choice).title + '；下次入关重新抽选。' : record.description;
  $('record-count').textContent = choice === 'random' ? 'RANDOM' : String(options.findIndex(option => option.value === choice) + 1).padStart(2, '0') + ' / ' + String(options.length).padStart(2, '0');
  const shelf = $('record-shelf'), scroll = shelf.scrollLeft;
  shelf.innerHTML = options.map(option => `<button class="record-choice" type="button" data-music="${option.value}" aria-label="${option.label}" aria-pressed="${option.value === choice}"><img src="${gameMusicRecord(musicSettingsStage, option.value).art}" alt="" width="40" height="40" loading="lazy" draggable="false"><span>${WUKONG&&option.value==='original'?(musicSettingsStage===2?'破阵':'西游记'):recordShortNames[option.value]}</span></button>`).join('');
  shelf.scrollLeft = scroll;
  $('set-music-random').setAttribute('aria-pressed', String(choice === 'random'));
  $('set-music-random').hidden=WUKONG;
  $('shuffle-pool-note').hidden=WUKONG;
  $('shuffle-pool-note').textContent = `从本关 ${stageMusicPool(musicSettingsStage).length} 首音乐中抽选`;
}
function chooseStageMusic(value, focusRecord = false) {
  if(!WUKONG)return;
  if (!gameMusicOptions(musicSettingsStage).some(option => option.value === value)) return;
  if (value !== 'random') lastManualMusic[musicSettingsStage] = value;
  if (SET.stageMusic[musicSettingsStage] !== value) stageMusicSession.invalidate(musicSettingsStage);
  SET.stageMusic[musicSettingsStage] = value; saveSettings(); Music.sync(); syncStageMusicUI(true);
  if (focusRecord) { const button = $('record-shelf').querySelector(`[data-music="${value}"]`); button?.focus({ preventScroll: true }); button?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}
function turnRecord(direction, edge) {
  if(!WUKONG)return;
  const options = gameMusicOptions(musicSettingsStage).filter(option => option.value !== 'random');
  const selected = SET.stageMusic[musicSettingsStage], index = options.findIndex(option => option.value === selected);
  const next = edge === 'first' ? 0 : edge === 'last' ? options.length - 1 : index < 0 ? (direction > 0 ? 0 : options.length - 1) : (index + direction + options.length) % options.length;
  chooseStageMusic(options[next].value);
}
if(WUKONG){
$('record-art').addEventListener('animationend', () => $('record-art').classList.remove('record-changing'));
$('record-prev').onclick = () => turnRecord(-1);
$('record-next').onclick = () => turnRecord(1);
$('record-shelf').addEventListener('click', event => { const button = event.target.closest('[data-music]'); if (button) chooseStageMusic(button.dataset.music, true); });
$('record-player').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault(); event.stopPropagation();
  turnRecord(event.key === 'ArrowLeft' ? -1 : 1, event.key === 'Home' ? 'first' : event.key === 'End' ? 'last' : undefined);
});
let recordSwipe = null;
$('record-player').addEventListener('pointerdown', event => {
  if (event.target.closest('button')) return;
  recordSwipe = { x: event.clientX, y: event.clientY, id: event.pointerId };
});
$('record-player').addEventListener('pointercancel', () => { recordSwipe = null; });
$('record-player').addEventListener('pointerup', event => {
  const start = recordSwipe; recordSwipe = null;
  if (!start || start.id !== event.pointerId) return;
  const dx = event.clientX - start.x, dy = event.clientY - start.y;
  if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.4) turnRecord(dx < 0 ? 1 : -1);
});
$('set-music-random').onclick = () => {
  const current = SET.stageMusic[musicSettingsStage];
  if (current !== 'random') lastManualMusic[musicSettingsStage] = current;
  chooseStageMusic(current === 'random' ? lastManualMusic[musicSettingsStage] || stageMusicPool(musicSettingsStage)[0].value : 'random');
};
}
function syncAudioMixUI() {
  for(const [key,name]of [['music','musicVolume'],['sfx','sfxVolume']]){
    $(''+key+'-volume-control').hidden=!WUKONG;
    const slider=$('set-'+key+'-volume'),output=$(key+'-volume-value');
    slider.value=String(SET[name]);slider.setAttribute('aria-valuetext',SET[name]+'%');output.value=SET[name]+'%';output.textContent=SET[name]+'%';
  }
}
function syncSettingsUI() {
  for (const k in SET) { if (typeof SET[k] === 'object') continue; const el = $(`set-${k}-${SET[k]}`); if (el) el.checked = true; }
  for(const value of ['on','off']){const el=$('set-inf-'+value);el.disabled=!!G.thirtyLives;el.checked=value===(G.thirtyLives?'off':SET.inf);}
  $('life-rule-note').textContent=G.thirtyLives?'30 条命模式生效：本局按有限生命扣减，回到标题后恢复原设置':'关闭后按原作规则：命用完要续关，从本关开头重来';
  syncStageMusicUI();syncAudioMixUI();
  $('stage').classList.toggle('scan', SET.scan === 'on');
  $('touch').style.setProperty('--pad', { s: 0.82, m: 1, l: 1.2 }[SET.pad] || 1);
}
function selectTab(help) {
  $('tabSet').setAttribute('aria-selected', String(!help)); $('tabHelp').setAttribute('aria-selected', String(help));
  $('paneSet').hidden = help; $('paneHelp').hidden = !help;
}
function openSettings(help) {
  G.settingsFrom = G.mode; musicSettingsStage = G.settingsFrom === 'title' ? 1 : G.stage; syncSettingsUI(); selectTab(!!help); setMode('settings');
  $(help ? 'tabHelp' : 'tabSet').focus({ preventScroll: true });
}
function closeSettings() { setMode(G.settingsFrom === 'title' ? 'title' : 'pause'); }
$('scrSettings').addEventListener('input',e=>{
  const t=e.target;if(!WUKONG||!['musicVolume','sfxVolume'].includes(t.name))return;
  Object.assign(SET,normalizeAudioMix({...SET,[t.name]:t.value}));saveSettings();applyAudio();syncAudioMixUI();
});
$('scrSettings').addEventListener('change', e => {
  const t = e.target;
  if(['musicVolume','sfxVolume'].includes(t.name))return;
  if(t.name==='inf'&&G.thirtyLives){syncSettingsUI();return;}
  if (t.id === 'set-music-stage') { if(canPlayStage(Number(t.value)))musicSettingsStage=Number(t.value);syncStageMusicUI();return; }
  if (!t.name || !(t.name in SET) || typeof SET[t.name] === 'object') return;
  SET[t.name] = t.value; saveSettings(); applyAudio(); syncSettingsUI();
});
$('scrSettings').addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = [...$('scrSettings').querySelectorAll('button:not(:disabled), select, input:checked, input[type="range"], [tabindex="0"]')].filter(element => element.getClientRects().length);
  const first = controls[0], last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
});
$('tabSet').onclick = () => selectTab(false);
$('tabHelp').onclick = () => selectTab(true);
$('btnBack').onclick = closeSettings;
$('btnSettings').onclick = () => openSettings(false);
$('btnSettings2').onclick = () => openSettings(false);
syncSettingsUI();
pollPad();
$('btnHome').onclick = () => { if (AC) AC.resume().catch(() => {}); toTitle(); };
$('btnHome2').onclick = toTitle;
$('btnPause').onclick = () => (G.mode === 'play' ? pause() : G.mode === 'pause' ? resume() : null);
$('btnMute').onclick = () => { initAudio(); setMuted(!muted); };
setMuted(muted);

// ================= sizing =================
function updateRotateHint() {
  const portrait = innerHeight > innerWidth;
  $('rotate').hidden = !(document.body.classList.contains('touchmode') && portrait);
}
function resize() {
  updateRotateHint();
  const wrap = $('wrap'), aw = wrap.clientWidth, ah = wrap.clientHeight - 16;
  const dpr = window.devicePixelRatio || 1;
  const fit = Math.max(0.5, Math.min(aw / W, ah / H));
  const s = fit;
  setRes(Math.max(2, Math.min(G.stage >= 1 && G.stage <= 6 ? 10 : 4, Math.ceil(s * dpr))));
  const st = $('stage');
  st.style.width = Math.floor(W * s) + 'px'; st.style.height = Math.floor(H * s) + 'px'; st.style.setProperty('--s', s.toFixed(3));
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 150));
resize();

// ================= online two-player campaign =================
function coopMessage(message) { $('coopMessage').textContent = message; }
function coopBusy(busy) { $('coopCreate').disabled = $('coopJoin').disabled = busy; }
function showCoop() {
  setMode('lobby'); Music.stop(); $('coopBar').hidden = true;
  $('coopSetup').hidden = !!coop.room; $('coopWaiting').hidden = !coop.room;
  $('coopStage').disabled = !!coop.room;
  coopBusy(false);
}
function roomReady(message) {
  showCoop(); $('coopRoomCode').textContent = message.code;
  $('coopSeats').textContent = message.players === 2 ? '玩家一 红色 · 玩家二 蓝色 · 两人已就位' : '玩家一 红色已就位 · 等待 玩家二 蓝色';
  $('coopStart').hidden = message.role !== 'host'; $('coopStart').disabled = message.players !== 2;
  $('coopStage').value = String(message.stage);
  coopMessage(message.role === 'host' ? '把房间码或邀请链接发给朋友，由你开始游戏。' : '你是 玩家二，等待房主开始游戏。');
}
coop = new CoopClient({
  room: roomReady,
  peer() { $('coopSeats').textContent = '玩家一 红色 · 玩家二 蓝色 · 两人已就位'; $('coopStart').disabled = false; coopMessage('队友已加入，可以双人开始。'); },
  start(stage) {
    if (coop.role === 'guest' && !soloSettings) soloSettings = { inf: SET.inf, diff: SET.diff, autofire: SET.autofire };
    initAudio(); clearInterval(overTimer); snapshotClock = 0; remoteWaiting = coop.role === 'guest';
    startStage(stage); $('coopBar').hidden = false;
    for (const id of ['btnRestart', 'btnAgain', 'btnNext', 'btnContinue', 'btnSettings']) $(id).disabled = coop.role === 'guest';
    coopMessage('');
  },
  state(world) {
    if (coop.role !== 'guest' || !cooperative()) return;
    try {
      const [state, platforms, bridges, settings] = unpackWorld(world);
      if (!state?.p2 || !Array.isArray(platforms) || !Array.isArray(bridges) || !canPlayStage(state.stage)) throw Error('同步数据无效');
      // The host may still be preparing the next stage. Keep the last complete
      // scene until its snapshot arrives, then prepare that stage locally.
      if((!WUKONG||state.stage===2)&&state.mode==='loading')return;
      if((!WUKONG||state.stage===2)&&(pendingStart||!stageResourcesReady(state.stage))){
        remoteWorld=world;
        if(!pendingStart)void startAfterLoading(flushRemoteWorld,state.stage);
        return;
      }
      const oldMode = G.mode, oldShot = G.p2?.flashT || 0, oldDead = G.p2?.dead, oldReferenceTrack=sceneMusicTrack(G);
      const sameShootingScene=state.stage===G.stage&&oldMode==='play'&&state.mode==='play'&&!remoteWaiting;
      const oldActors=[G.p,G.p2].filter(Boolean).map(p=>({pid:p.pid,shotSeq:p.shotSeq,flashT:p.flashT}));
      if (state.stage !== G.stage) reset(state.stage);
      else if (state.mode === 'intro' && oldMode !== 'intro' && !remoteWaiting) stageMusicSession.begin(state.stage);
      for (const key of Object.keys(G)) delete G[key];
      Object.assign(G, state); solids.splice(0, solids.length, ...platforms); BRIDGES.splice(0, BRIDGES.length, ...bridges);
      if(isSiege()){LEVEL_W=WukongSiege.ROOM_WIDTHS[G.siege.room];CAM_MAX=LEVEL_W-W;}
      for (const key of ['inf', 'diff', 'autofire']) if (settings[key]) SET[key] = settings[key];
      if (oldMode !== G.mode || remoteWaiting) {
        setMode(G.mode);
        if (G.mode === 'play') Music.start(false, STAGE_MUSIC_SHIFT[G.stage]);
        else if (G.mode === 'pause') Music.pause();
      }
      else if((G.stage===2||G.stage===3||G.stage===4)&&oldReferenceTrack!==sceneMusicTrack(G))Music.sync();
      if(weaponAudio){if(sameShootingScene)for(const shot of receivedWeaponShots(oldActors,players()))weaponAudio.play(shot.weapon,shot.delay);}
      else if (G.p2.flashT > oldShot) sfx.shoot();
      if (G.p2.dead && !oldDead) sfx.die();
      if (G.mode === 'clear') {
        syncClearUI();
        if(G.stage!==lastPlayableStage())$('clearSub').textContent+=' · 等待房主继续';
        $('stScore').textContent = pad6(G.score); $('stTime').textContent = `${Math.floor(G.time / 60)}:${String(Math.floor(G.time) % 60).padStart(2, '0')}`;
        $('stDeaths').textContent = G.deaths; $('stHi').textContent = pad6(Math.max(HI, G.score));
      }
      if (G.mode === 'over') $('count').textContent = G.continueCount ?? 9;
      remoteWaiting = false;
    } catch { coopMessage('画面同步失败，请退出后重新加入房间'); coop.leave(); toTitle(); }
  },
  action(action, slot) { if (coop.role === 'host') { if (action === 'pause') pause(); if (action === 'resume' && G.mode === 'pause') resume(); if (action === 'select' && G.mode === 'play') withPlayer2(() => { if (slot < G.inv.length) G.sel = slot; }); } },
  lost(message) { remoteInput = {}; showCoop(); $('coopStart').disabled = true; $('coopSeats').textContent = '玩家一 已就位 · 等待 玩家二 重新加入'; coopMessage(message); },
  end(message) { toTitle(); showCoop(); coopMessage(message); },
  error(message) { coopBusy(false); coopMessage(message); }
}, { game: GAME_ID });
$('btnCoop').onclick = () => { initAudio(); showCoop(); coopMessage('创建房间，或输入朋友分享的房间码。'); };
$('coopCreate').onclick = async () => {
  const stage=Number($('coopStage').value);
  await startAfterLoading(async () => {
    coopBusy(true); coopMessage('连接中…');
    try { await coop.create(stage); } catch (e) { coopBusy(false); coopMessage(e.message); }
  },stage);
};
$('coopJoinForm').onsubmit = async event => {
  event.preventDefault(); const code=$('coopCode').value;
  // Joining reveals the real room stage; do not download the selector's guess.
  const join=async()=>{
    initAudio();coopBusy(true);coopMessage('加入中…');
    try { await coop.join(code); } catch (e) { coopBusy(false); coopMessage(e.message); }
  };
  if(WUKONG)await startAfterLoading(join,Number($('coopStage').value));else await join();
};
$('coopStart').onclick = () => coop.start(Number($('coopStage').value));
$('coopCopy').onclick = async () => {
  const url = new URL(location.href); url.search = ''; url.searchParams.set('room', coop.room);
  url.pathname = '/games/' + GAME_ID + '/';
  try { await navigator.clipboard.writeText(url.href); coopMessage('邀请链接已复制。'); }
  catch { coopMessage('邀请链接：' + url.href); }
};
$('coopBack').onclick = $('coopLeave').onclick = () => { coop.leave(); toTitle(); };
if (wukong) {
  wukong.mount(document, SET);
  void wukong.loadTitle().catch(() => {});
}
const invitedRoom = new URLSearchParams(location.search).get('room');
if (invitedRoom && /^[A-Z2-9]{6}$/i.test(invitedRoom)) { $('coopCode').value = invitedRoom.toUpperCase(); showCoop(); coopMessage('点击加入房间，以 玩家二 身份与朋友一起闯关。'); }
window[WUKONG ? 'WukongGame' : 'Contra2026'] = Object.freeze({ inspect: () => ({
  resources: {...gameResources.inspect(),stage:pendingStart?.stage||G.stage,cached:resourceCache.size},
  musicDownloads: backgroundMusic?.inspect() || null,
  gamepad:gamepads.inspect(),
  lives:{remaining:G.lives,infinite:infiniteLives(),thirty:!!G.thirtyLives,armed:lifeCheat.enabled},
  mode: G.mode, stage: G.stage, role: coop.role, room: coop.room, connected: coop.connected,
  game: GAME_ID,
  theme: null,
  combat: isCelestial() ? 'staff' : 'shooting',
  siege:isSiege()?WukongSiege.inspect(G):null,
  boss: isSiege()?{kind:'增长天王',active:G.boss.active,dead:G.boss.dead,hp:G.boss.parts[2].hp,max:G.boss.parts[2].max,phase:G.boss.king?.phase||1,attack:G.boss.king?.attack?{kind:G.boss.king.attack.kind,time:G.boss.king.attack.t}:null}:isCelestial()?{kind:'巨灵神',active:G.boss.active,dead:G.boss.dead,hp:G.boss.parts[2].hp,max:G.boss.parts[2].max,phase:G.boss.encounter?.stage||1,phaseTime:G.boss.encounter?.time||0,growing:(G.boss.encounter?.growth||0)>0,scars:(G.boss.encounter?.scars||[]).map(s=>({...s})),attack:G.boss.giant?.attack?{kind:G.boss.giant.attack.kind,time:G.boss.giant.attack.t,aimX:G.boss.giant.attack.aimX,locked:G.boss.giant.attack.locked}:null}:null,
  playing: cooperative(), tick: G.t, snapshotBytes: coop.snapshotBytes || 0, art: isSiege()?{...stageOneArt.inspect(),siege:siegeArt.inspect()}:G.stage === 1 ? stageOneArt.inspect() : G.stage===2?stageTwoArt.inspect():G.stage===3?stageThreeArt.inspect():G.stage===4?stageFourArt.inspect():G.stage===5?stageFiveArt.inspect():G.stage===6?stageSixArt.inspect():G.stage===7?hangarArt.inspect():G.stage===8?stageSevenArt.inspect():null, camera: { x: G.camX, y: G.camY },
  audio: { ...referenceMusic.inspect(), ...(weaponAudio?{weaponShots:weaponAudio.inspect()}:{}), context: AC?.state || 'locked', muted, music: SET.music, musicVolume:SET.musicVolume,sfxVolume:SET.sfxVolume,sfxGain:sfxGain?.gain.value??0,selection: WUKONG?SET.stageMusic[G.stage]:'fixed', resolved: WUKONG?stageMusicSession.inspect():{track:fixedMusicTrack(G)}, synth: Music.on, sfx: SET.sfx, gain: musGain?.gain.value ?? 0,...(WUKONG?{enemyVoices:wukongBattleAudio.inspect(),heroActions:wukongHeroAudio.inspect()}:{}) },
  exit: G.stage===1?{open:!!G.boss.exitOpen,actors:players().map(p=>({id:p.pid,entering:!!p.enteringExit,entered:!!p.exitEntered}))}:null,
  snowfield:G.stage===5?{progress:G.fortress.active?'fortress':G.tank.dead?'approach':G.tank.active?'tank':'snowfield',fortress:{active:G.fortress.active,dead:G.fortress.dead,x:G.fortress.x,y:G.fortress.y,entryT:G.fortress.entryT,phase:G.fortress.phase,parts:G.fortress.parts.map(p=>({kind:p.k,hp:p.hp,max:p.max}))},weather:{...G.s5,snowfall:'heavy'},defenders:G.en.filter(e=>!e.dead&&(e.t==='artillery'||e.t==='grenadier')).map(e=>({kind:e.t,x:e.x,y:e.y,phase:e.phase,peek:e.peek||0})),ordnance:G.eb.filter(b=>!b.dead&&b.snowOrdnance).map(b=>({kind:b.snowOrdnance,x:b.x,y:b.y,fuse:b.fuse,bounces:b.bounces||0})),tank:{active:G.tank.active,dead:G.tank.dead,mode:G.tank.mode,phase2:G.tank.phase2,parts:G.tank.parts.map(p=>({kind:p.k,hp:p.hp,max:p.max}))}}:null,
  waterfall:G.stage===3?{boss:{active:G.mech.active,dead:G.mech.dead,open:G.mech.open,exitOpen:G.mech.exitOpen,parts:G.mech.parts.map(p=>({kind:p.k,hp:p.hp,max:p.max}))},flames:flameJetBoxes(G.time).length,movingRocks:solids.filter(s=>s.drift).map(s=>({x:s.x,y:s.y}))}:null,
  foundry:G.stage===6?{gallery:solids.filter(s=>s.gallery||s.galleryWall).map(s=>({x:s.x,y:s.y,w:s.w,h:s.h,side:s.side||'wall',crown:!!s.galleryCrown,solid:!!s.solid})),galleryOutlets:G.jets.filter(j=>j.gallery).length}:null,
  hangar:G.stage===7?{section:hangarSectionAt(G.p.x).label,carts:G.en.filter(e=>e.t==='cart'&&!e.dead).map(c=>({x:c.x,y:c.y,speed:c.vx,riders:players().filter(p=>p.cart===c&&!p.dead).map(p=>p.pid)})),lowPassages:solids.filter(s=>s.cartRoof).map(s=>({x:s.x,y:s.y,w:s.w,h:s.h})),climb:solids.filter(s=>s.hangarClimb||s.climbWall).map(s=>({x:s.x,y:s.y,w:s.w,h:s.h,side:s.side||'wall'}))}:null,
  base: isBase()?{room:G.base.room,cleared:G.base.cleared,transition:G.base.trans,dead:G.base.dead,phase:G.base.bossPhase,exitReady:G.base.exitReady,devices:bossDevicesRemaining(G.base),targets:G.base.targets.map(t=>({kind:t.k,hp:t.hp,max:t.max,x:t.x,y:t.y})),bubbles:G.eb.filter(b=>b.bubble).length,rings:G.eb.filter(b=>b.ring).length,split:!!G.base.projectionSplit,lifts:players().map(p=>({id:p.pid,side:p.liftSide||0,done:!!p.liftDone}))}:null,
  players: players().map(p => ({ id: p.pid, x: p.x, y: p.y, weapon: p.weapon, dead: p.dead, invincible: p.invT,
    ...(G.stage===7?{inCart:isMinecartRider(p),cartDuck:!!p.cartDuck}:{}),
    ...(WUKONG ? { hp:p.hp,maxHp:p.maxHp,rage:p.rage,maxRage:p.maxRage,rageReady:rageReady(p),transformation:transformation(p)?{form:transformation(p).form,remaining:transformation(p).remaining,guard:transformation(p).guard,attacking:!!transformation(p).attack}:null,hurt:p.hurt?{time:p.hurt.t,heavy:p.hurt.heavy}:null,ride:p.ride,rideTime:p.rideT,rapid:p.rapid,
      charge:p.staffCharge?{time:p.staffCharge.t,active:p.staffCharge.active,ready:p.staffCharge.ready,full:p.staffCharge.full}:null,
      staffWaves:(p.staffWaves||[]).filter(b=>!b.dead).map(b=>({x:b.x,y:b.y,strength:b.strength,radius:b.radius,damage:b.damage})),
      staffThrows:(p.staffThrows||[]).filter(b=>!b.dead).map(b=>({x:b.x,y:b.y,phase:b.phase})),
      staff:p.staff?{kind:p.staff.kind,variant:p.staff.variant,command:p.staff.command||null,combo:p.staff.combo,time:p.staff.t,duration:p.staff.duration,...(p.staff.kind==='ultimate'?{ultimate:p.staff.ultimate,name:ultimateSpec(p.staff).name}:{})}:null } : {}) })),
  ...(WUKONG ? { ultimateCooldown: Math.max(0,G.nadeCd||0), guards:G.en.filter(e=>!e.dead&&['run','snp','fly'].includes(e.t)).map(e=>({type:e.t,x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp,melee:e.melee?{kind:e.melee.kind,time:e.melee.t,phase:e.melee.t<GUARD_MELEE.windup?'windup':e.melee.t<GUARD_MELEE.windup+GUARD_MELEE.strike?'strike':'recover'}:null})) } : {}),
  shots: G.pb.map(b => ({ owner: b.owner || 1, x: b.x, y: b.y })), score: G.score
}) });

// ================= loop =================
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000); last = now;
  while (acc >= DT) { step(); acc -= DT; }
  if(isCelestial()&&G.mode==='play'){
    wukongBattleAudio.observe(G.fx,{clock:G.time,camera:G.camX});
    wukongHeroAudio.observe(G.fx,{clock:G.time,camera:G.camX,actors:players()});
  }
  render(); updateHud();
  if (cooperative()) {
    if (coop.role === 'host' && now - snapshotClock >= 50) {
      coop.snapshot(packWorld([G, solids, BRIDGES, { inf: SET.inf, diff: SET.diff, autofire: SET.autofire }])); snapshotClock = now;
    }
    if (now - pingClock > 5000) { coop.send({ t: 'ping', at: Date.now() }); pingClock = now; }
    const waiting = coop.role === 'guest' && (remoteWaiting || now - coop.lastFrame > 2000);
    $('coopStatus').textContent = waiting ? '等待房主画面…' : `${coop.role === 'host' ? '玩家一 红色' : '玩家二 蓝色'} · ${coop.room} · ${coop.latency}毫秒`;
    if (coop.role === 'guest' && now - coop.lastFrame > 10000) { coop.leave(); toTitle(); showCoop(); coopMessage('房主画面中断，请重新加入房间'); }
  }
  requestAnimationFrame(frame);
}
if (G.mode !== 'lobby') setMode('title');
requestAnimationFrame(frame);
}
