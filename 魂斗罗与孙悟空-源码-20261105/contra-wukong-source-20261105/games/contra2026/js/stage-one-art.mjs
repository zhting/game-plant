import { versionedAssetUrl } from './asset-url.mjs?v=enemy-freeze-2';
import { HUD_PLAYER_X, inventorySlotBounds } from './hud-layout.mjs';
import { RIVER_FISH_ASSET, riverFishJumps, drawRiverFish } from './river-fish.mjs?v=fish-life-1';
import { ATLASES } from './stage-one-atlas.mjs?v=wreck-1';
import { drawSupplySaucer } from './supply-saucer.mjs?v=pointed-drop-1';
import { COMBAT_ASSETS, drawExplosion, drawSupplyDisc, drawEquipmentTurret, drawEquipmentSupply } from './combat-art.mjs?v=combat-polish-1';
import { itemLabel, WEAPON_LABELS } from './zh-cn.mjs';
import { rockCells, rotorAngle, meteorPosition, openingDrop, coastHeight, cliffEdgeProfile } from './stage-one-scenery.mjs?v=cliff-edge-1';
import { HDActorArt, HD_ACTORS, HD_RUNS, HD_DEATH, HD_RUN_RIG } from './hd-actors.mjs?v=moto-wheelie-2';
import { giantPowerLabel, drawGiantStomp } from './giant-power.mjs?v=giant-smash-1';
import { WADE_STRIDE, MOTORCYCLE_RIDER } from './stage-one-motion.mjs?v=leg-alignment-2';
import { drawShieldField } from './actor-status.mjs?v=energy-field-1';
import { drawImpact } from './impact-effects.mjs?v=hit-feedback-1';
import { openingCaption } from './opening-story.mjs?v=opening-story-1';
import { CLASSIC_LAYERS, CLASSIC_FACILITIES, CLASSIC_TURRET_BASE_BOUNDS, nightStars, drawWingBadge, drawRifleSymbol, drawClassicBullet, drawTurretBarrel } from './stage-one-classic.mjs?v=night-weather-1';
import { rainStrength, drawWindForest, drawStageOneRain, drawWindblownLeaves } from './stage-one-atmosphere.mjs?v=permanent-monsoon-1';
import {drawImpactHelmet} from './impact-helmet-art.mjs?v=helmet-detail-2';
import {TROPICAL_GRASS_ASSET,tropicalGrassFrame,paintTropicalCliff} from './tropical-grass-art.mjs?v=cliff-edge-1';
import {ENEMY_FREEZE_ASSET,drawFrozenEnemy} from './enemy-freeze-art.mjs?v=enemy-freeze-2';
import {DEMOLITION_CHARGE_ASSET,drawDemolitionCharge} from './demolition-charge-art.mjs?v=satchel-2';
import {roofGuardPose} from './fortress-roof-guard.mjs?v=roof-guard-1';
import {FORTRESS_CANNON_ART,fortressCannonPose,drawFortressCannonEffects} from './fortress-cannon.mjs?v=cannon-recoil-1';
import {motorcyclePose,motorcycleMuzzle,drawMotorcycleDust} from './motorcycle-motion.mjs?v=moto-wheelie-2';
import {drawStageEnemyUniform} from './stage-enemy-uniforms.mjs?v=stage-uniforms-1';

export const STAGE_ONE_PALETTE = Object.freeze({
  black: '#000c10', sky: '#020306', leaf: '#007838', moss: '#78d820',
  rock: '#6c6011', water: '#0959df', red: '#f83800', blue: '#3cbcfc', white: '#fcfcfc'
});
// Distance reduces contrast and saturation; gameplay surfaces retain their warm, crisp material.
export const JUNGLE_DEPTH=Object.freeze({far:'saturate(.54) brightness(.67) contrast(.82)',near:'saturate(.76) brightness(.78) contrast(.92)'});
export const STAGE_ONE_ASSETS = Object.freeze({
  snow: '/games/contra2026/assets/stage1/night-snow-mountains.webp',
  lowJungle: '/games/contra2026/assets/stage1/night-jungle-strip.webp',
  facilities: '/games/contra2026/assets/stage1/classic-facilities.webp',
  ...COMBAT_ASSETS,
  rock: '/games/contra2026/assets/stage1/rock-arcade.webp',
  turf:TROPICAL_GRASS_ASSET,
  demolitionCharge:DEMOLITION_CHARGE_ASSET,
  freezeAtlas:ENEMY_FREEZE_ASSET,
  enemyUniform:'/games/contra2026/assets/stage1/enemy-jungle-upper.webp',
  damage: '/games/contra2026/assets/stage1/fortress-wreck-realistic-v3.webp',
  environment: '/games/contra2026/assets/stage1/environment.webp',
  fortress: '/games/contra2026/assets/stage1/fortress-realistic-v3.webp',
  fortressBreach: '/games/contra2026/assets/stage1/fortress-breach-realistic-v4.webp',
  riverFish: RIVER_FISH_ASSET,
  ...Object.fromEntries([...Object.values(HD_ACTORS),...Object.values(HD_RUNS),...Object.values(HD_DEATH),...Object.values(HD_RUN_RIG)].map(sheet=>[sheet.key,sheet.url]))
});
export const FORTRESS_HD_BOUNDS=Object.freeze([29,10,1201,1254]);
// Keep the roof below the HUD and the rear pillar just beyond the final camera edge.
export const FORTRESS_ART = Object.freeze({ x: 3191, y: 28, w: 147, h: 148, wallX: 3232, levelEnd: 3334 });
// Full visual housings; the exposed reactor opening also supplies its damage box.
export const FORTRESS_DAMAGE_REGIONS = Object.freeze(Object.fromEntries([
  ['gunA',0,75,102,86],['gunB',0,214,102,87],['core',189,166,80,120]
].map(([key,x,y,w,h])=>[key,Object.freeze({x:FORTRESS_ART.x+x/328*FORTRESS_ART.w,
  y:FORTRESS_ART.y+y/340*FORTRESS_ART.h,w:w/328*FORTRESS_ART.w,h:h/340*FORTRESS_ART.h})])));
// The exposed reactor includes its opening/rim, rather than only the small flame inside it.
export const FORTRESS_TARGETS=Object.freeze([
  ...[['gunA',0,342,345,100],['gunB',0,835,345,100],['core',746,675,145,240]].map(([k,x,y,w,h])=>Object.freeze({k,
    x:FORTRESS_ART.x+x/1201*FORTRESS_ART.w,y:FORTRESS_ART.y+y/1254*FORTRESS_ART.h,
    w:w/1201*FORTRESS_ART.w,h:h/1254*FORTRESS_ART.h,...(k==='core'?{hitBox:FORTRESS_DAMAGE_REGIONS.core}:{})}))
]);
const coreBreach=FORTRESS_DAMAGE_REGIONS.core;
// Artwork follows the former reactor housing; the entry trigger stays unchanged.
export const FORTRESS_BREACH_ART=Object.freeze({x:coreBreach.x-7,y:coreBreach.y-9,w:coreBreach.w+14,h:coreBreach.h+18});
export const FORTRESS_EXIT=Object.freeze({x:coreBreach.x+5,y:coreBreach.y+7,w:FORTRESS_ART.levelEnd-8-(coreBreach.x+5),h:coreBreach.h-12,
  trigger:Object.freeze({x:coreBreach.x+6,y:coreBreach.y+9,w:coreBreach.w-12,h:coreBreach.h-16})});

const PALM_DETAIL_BOUNDS = [29, 22, 1137, 1276];
const rnd = n => { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const round = Math.round;
const score = n => String(Math.max(0, Math.floor(n || 0))).padStart(6, '0');

/** Logical coordinates stay 384×216; artwork renders at the display's backing resolution. */
export class StageOneArt {
  static playerRole(online=false,slot=0){return online&&slot===0?'red':'blue';}
  constructor({ createCanvas, imageFactory, assets=STAGE_ONE_ASSETS, priority='auto', autoLoad=true }) {
    this.assets=assets;
    this.createCanvas = createCanvas;
    this.surface = createCanvas(); this.surface.width = 384; this.surface.height = 216;
    this.g = this.surface.getContext('2d'); this.scale = 1;
    this.images = {}; this.loaded = new Set(); this.failed = []; this.cache = new Map(); this.terrainCache = new Map();
    this.hdActors = new HDActorArt(createCanvas,this.images);
    this.imageFactory = imageFactory; this.priority = priority; this.imageLoads = new Map();
    if (autoLoad) for (const key of Object.keys(this.assets)) this.loadImage(key);
  }
  loadImage(key, { retry = false } = {}) {
    if (this.loaded.has(key)) return Promise.resolve(this.images[key]);
    const previous = this.imageLoads.get(key);
    if (previous && !retry) return previous.promise;
    if (previous) {
      previous.image.onload = previous.image.onerror = null; previous.image.src = '';
      previous.reject(Error('重新加载图片')); this.imageLoads.delete(key);
    }
    const image = this.imageFactory(); this.images[key] = image;
    image.decoding = 'async'; image.fetchPriority = this.priority;
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    promise.catch(() => {});
    this.imageLoads.set(key, { image, promise, reject });
    const failed = () => {
      if (this.images[key] !== image) return;
      if (!this.failed.includes(key)) this.failed.push(key);
      this.imageLoads.delete(key); reject(Error('图片加载失败：' + key));
    };
    const ready = () => {
      if (this.images[key] !== image) return;
      this.loaded.add(key); this.failed = this.failed.filter(name => name !== key); this.imageLoads.delete(key);
      this.cache.clear(); this.terrainCache.clear(); this.hdActors.clear(); resolve(image);
    };
    image.onload = () => { if (image.decode) image.decode().then(ready, failed); else ready(); };
    image.onerror = failed; image.src = versionedAssetUrl(this.assets[key]);
    return promise;
  }
  adoptImage(key,image){
    this.images[key]=image;this.loaded.add(key);this.failed=this.failed.filter(name=>name!==key);
    this.cache.clear();this.terrainCache.clear();this.hdActors.clear();
    return image;
  }
  get ready() { return Object.keys(this.assets).filter(key=>(!this.assets.runLimbs||!['runRed','runBlue','runEnemy'].includes(key))&&!(key==='rock'&&this.assets.turf&&this.loaded.has('turf'))).every(key => this.loaded.has(key)); }
  inspect() { return { ready: this.ready, loaded: [...this.loaded], failed: [...this.failed], frameCount: this.cache.size, resolution: [this.surface.width, this.surface.height] }; }
  prepare(destination) {
    const width = destination.canvas?.width || 1536, height = destination.canvas?.height || 864;
    if (this.surface.width !== width || this.surface.height !== height) {
      this.surface.width = width; this.surface.height = height; this.cache.clear(); this.terrainCache.clear(); this.hdActors.clear();
    }
    this.scale = width / 384;
    this.g.setTransform(this.scale, 0, 0, height / 216, 0, 0);
    this.g.imageSmoothingEnabled = true; this.g.imageSmoothingQuality = 'high'; this.g.globalAlpha = 1;
  }
  snap(value) { return round(value * this.scale) / this.scale; }
  textureSpan(g, image, left, right, width, height, overlap) {
    const stride=width-overlap, sourceWidth=image.naturalWidth||image.width, sourceHeight=image.naturalHeight||image.height;
    // A narrow overlap joins different edge details without mirrored, symmetrical tree/rock shapes.
    for(let tile=Math.floor(left/stride)-1;tile<=Math.floor(right/stride);tile++) {
      const x=tile*stride, cut=overlap/width*sourceWidth;
      if(x+width<left||x>right)continue;
      g.drawImage(image,cut,0,sourceWidth-cut,sourceHeight,x+overlap,0,width-overlap,height);
      g.save();
      for(let i=0;i<16;i++) {
        const a=x+i*overlap/16, w=overlap/16;
        if(a+w<left||a>right)continue;
        g.globalAlpha=(i+.5)/16;
        g.drawImage(image,i*cut/16,0,cut/16,sourceHeight,a,0,w,height);
      }
      g.restore();
    }
  }
  rect(x, y, w, h, color) { this.g.fillStyle = color; this.g.fillRect(this.snap(x), this.snap(y), Math.max(1 / this.scale, w), Math.max(1 / this.scale, h)); }
  line(x, y, xx, yy, color, thickness = 1) {
    const g = this.g; g.strokeStyle = color; g.lineWidth = Math.max(.3, thickness * .65); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(xx, yy); g.stroke();
  }
  text(text, x, y, color = '#fcfcfc', scale = 1, align = 'left') {
    const g = this.g; g.save();
    g.font = `700 ${8 * scale}px "Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif`;
    g.textAlign = align; g.textBaseline = 'top'; g.lineJoin = 'round';
    g.lineWidth = .9 * scale; g.strokeStyle = 'rgba(0,8,12,.95)';
    g.strokeText(String(text).toUpperCase(), x, y); g.fillStyle = color; g.fillText(String(text).toUpperCase(), x, y);
    g.restore();
  }
  frame(sheet, name, w, h) {
    if(sheet==='environment'&&name==='fortress')sheet='fortress';
    if(sheet==='environment'&&name==='turret'&&this.loaded.has('turretBase'))sheet='turretBase';
    if(sheet==='environment'&&CLASSIC_FACILITIES[name]&&this.loaded.has('facilities'))sheet='facilities';
    if (!this.loaded.has(sheet)) return null;
    const key = `${sheet}:${name}:${w}:${h}`;
    if (this.cache.has(key)) return this.cache.get(key);
    let bounds = sheet==='turretBase'?CLASSIC_TURRET_BASE_BOUNDS:sheet==='facilities'?CLASSIC_FACILITIES[name]:CLASSIC_LAYERS[sheet]|| (sheet==='fortress'?FORTRESS_HD_BOUNDS:sheet === 'palm' ? PALM_DETAIL_BOUNDS : ATLASES[sheet].frames[name]); if (!bounds) return null;
    if (sheet === 'environment' && name === 'rock') bounds = [bounds[0] + 7, bounds[1] + 7, bounds[2] - 14, bounds[3] - 14];
    if (sheet === 'environment' && name === 'turret') bounds = [bounds[0] + 76, bounds[1], bounds[2] - 76, bounds[3]];
    const canvas = this.createCanvas(); canvas.width = Math.max(1, Math.ceil(w * this.scale)); canvas.height = Math.max(1, Math.ceil(h * this.scale));
    const g = canvas.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    if(sheet==='palm')g.filter=JUNGLE_DEPTH.near;
    g.drawImage(this.images[sheet], ...bounds, 0, 0, canvas.width, canvas.height);
    this.cache.set(key, canvas); return canvas;
  }
  sprite(name, x, y, w, h, flip = false) {
    const frame = this.frame(name === 'palm' ? 'palm' : 'environment', name, w, h); if (!frame) return false;
    this.g.save(); this.g.translate(this.snap(x + (flip ? w : 0)), this.snap(y));
    if (flip) this.g.scale(-1, 1); this.g.drawImage(frame, 0, 0, w, h); this.g.restore(); return true;
  }
  helicopter(x, y, w, h, tick, flip = false) {
    const g = this.g;
    g.save(); g.translate(x + (flip ? w : 0), y); if (flip) g.scale(-1, 1);
    // Exclude the baked rotor blades while retaining the mast, tail and fuselage.
    g.save(); g.beginPath(); g.rect(0, h * .125, w, h); g.clip();
    this.sprite('helicopter', 0, 0, w, h); g.restore();
    const cx = w * .60, cy = h * .09, radius = w * .405, phase = rotorAngle(tick);
    g.save(); g.translate(cx, cy); g.scale(1, .16);
    g.fillStyle = 'rgba(187,213,222,.09)'; g.beginPath(); g.arc(0, 0, radius, 0, Math.PI * 2); g.fill();
    for (let ghost = 2; ghost >= 0; ghost--) {
      g.save(); g.rotate(phase - ghost * .24); g.globalAlpha = ghost ? .12 : .9;
      for (let blade = 0; blade < 3; blade++) {
        g.rotate(Math.PI * 2 / 3);
        g.fillStyle = ghost ? '#b6cad0' : '#829aa5';
        g.beginPath(); g.moveTo(1.5, -1.3); g.lineTo(radius * .94, -2.8); g.lineTo(radius, -.6); g.lineTo(2, 1.7); g.closePath(); g.fill();
        if (!ghost) { g.strokeStyle = '#d5e1e2'; g.lineWidth = .55; g.beginPath(); g.moveTo(4, -1); g.lineTo(radius * .94, -2); g.stroke(); }
      }
      g.restore();
    }
    g.restore(); this.disc(cx, cy, w * .027, '#354852'); this.disc(cx - .3, cy - .2, w * .012, '#bbcbd0');
    // Tail rotor is a separate rotating cross in its vertical plane.
    g.save(); g.translate(w * .045, h * .46); g.rotate(-phase * 1.7);
    this.line(-h * .09, 0, h * .09, 0, '#a7b5ac', w / 70);
    this.line(0, -h * .09, 0, h * .09, '#6b8276', w / 70); g.restore();
    g.restore();
  }
  meteor(seconds) {
    const g = this.g, impactTime = 4.4, time = Math.min(seconds, impactTime), head = meteorPosition(time);
    if (seconds <= impactTime) {
      const tangent = Math.atan2(9 + time * 2.8, 90), nx = -Math.sin(tangent), ny = Math.cos(tangent);
      const tail = meteorPosition(Math.max(0, time - .8));
      for (const [width, opacity] of [[4.5, .18], [2.3, .6], [.7, 1]]) {
        const glow = g.createLinearGradient(tail.x, tail.y, head.x, head.y);
        glow.addColorStop(0, 'rgba(211,57,19,0)'); glow.addColorStop(.35, 'rgba(233,81,27,.4)');
        glow.addColorStop(.8, '#ffac44'); glow.addColorStop(1, '#fff8d5');
        g.save(); g.globalAlpha = opacity; g.fillStyle = glow; g.beginPath();
        for (const side of [1, -1]) for (let i = 0; i <= 18; i++) {
          const age = (side === 1 ? 18 - i : i) / 18, p = meteorPosition(Math.max(0, time - age * .8));
          const wake = Math.sin(age * 17 + seconds * 23) * age * .5, spread = width * Math.sin((1 - age) * Math.PI * .7) * (1 - age);
          const x = p.x + nx * (spread * side + wake), y = p.y + ny * (spread * side + wake);
          if (side === 1 && !i) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.closePath(); g.fill(); g.restore();
      }
      for (let i = 0; i < 22; i++) {
        const age = ((seconds * (1.1 + rnd(i) * .5) + rnd(i + 21)) % 1) * .65;
        if (age > seconds) continue;
        const p = meteorPosition(time - age), drift = (rnd(i + 99) - .5) * age * 18;
        g.save(); g.globalAlpha = (1 - age / .65) * .75;
        this.disc(p.x + nx * drift, p.y + ny * drift + age * age * 7, .25 + (1 - age / .65) * .55, i % 3 ? '#ffad4e' : '#fff0c0'); g.restore();
      }
      this.light(head.x, head.y, 7, 'rgba(255,146,45,.7)');
      g.save(); g.translate(head.x, head.y); g.rotate(tangent);
      g.fillStyle = '#ffb55a'; g.beginPath(); g.ellipse(0, 0, 2.5, 1.5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff8de'; g.beginPath(); g.ellipse(1, -.1, 1.35, .9, 0, 0, Math.PI * 2); g.fill();
      this.disc(-.8, .2, .65, '#9c542a'); g.restore();
    } else {
      const elapsed = seconds - impactTime;
      this.light(head.x, head.y, 14 + elapsed * 12, `rgba(255,147,67,${Math.exp(-elapsed * 3) * .8})`);
      g.save(); g.globalAlpha = Math.max(0, 1 - elapsed / 2.6) * .35;
      this.sprite('smoke', head.x - 8 - elapsed * 5, head.y - 10 - elapsed * 6, 16 + elapsed * 10, 18 + elapsed * 8); g.restore();
    }
  }
  forestPlant(kind){
    const key='plant:'+kind;if(this.cache.has(key))return this.cache.get(key);
    const source=this.images.lowJungle;if(!source?.naturalWidth)return null;
    const bounds=kind===3?[540,480,340,166]:[[250,298,320,348],[906,298,320,348],[1697,298,320,348]][kind];
    const w=kind===3?34:40,h=kind===3?18:44,canvas=this.createCanvas();canvas.width=Math.ceil(w*this.scale);canvas.height=Math.ceil(h*this.scale);
    const g=canvas.getContext('2d');g.scale(this.scale,this.scale);g.beginPath();
    if(kind===3)g.ellipse(w/2,h*.57,w/2,h*.58,0,0,Math.PI*2);
    else {g.ellipse(w/2,12,w/2,14,0,0,Math.PI*2);g.rect(w*.43,12,w*.15,h-12);g.moveTo(w*.95,h-3);g.ellipse(w/2,h-3,w*.45,6,0,0,Math.PI*2);}
    g.clip();g.drawImage(source,...bounds,0,0,w,h);this.cache.set(key,canvas);return canvas;
  }
  rainIntensity(camera,tick){return rainStrength(camera+192,tick/60);}
  background(camera, tick, solids = [],rain=this.rainIntensity(camera,tick)) {
    const g=this.g,time=tick/60;g.fillStyle=STAGE_ONE_PALETTE.sky;g.fillRect(0,0,384,216);
    for(const star of nightStars(camera,tick/60)){
      g.save();g.globalAlpha=star.alpha*(1-rain*.8);this.rect(star.x,star.y,star.size,star.size,star.color);
      if(star.glint>.35){g.globalAlpha*=star.glint*.36;this.rect(star.x-.65,star.y+.2,1.8,.22,star.color);this.rect(star.x+.2,star.y-.65,.22,1.8,star.color);}
      g.restore();
    }
    const snow=this.frame('snow','snow',250,57);
    if(snow){
      const shift=camera*.065;
      for(let i=Math.floor((shift-110)/440);i<=Math.floor((shift+384-110)/440);i++)g.drawImage(snow,110+i*440-shift,28,250,57);
    }
    const forest=this.frame('lowJungle','lowJungle',280,44);
    if(forest){
      // A subdued parallax band sits behind the river and gaps between banks.
      g.save();g.globalAlpha=.42;const shift=camera*.22;
      for(let i=Math.floor(shift/278);i<=Math.floor((shift+384)/278);i++)drawWindForest(g,forest,i*278-shift,140,280,44,time,true,rain);
      g.restore();
      // Whole plants are anchored by their roots. Crowns can overhang a bank;
      // no vertical terrain clip cuts a frond in half at a cliff.
      for(const s of solids){
        if(!s.g||s.water||s.x+s.w<camera||s.x>camera+384)continue;
        for(let i=Math.floor(s.x/31);i<=Math.ceil((s.x+s.w)/31);i++){
          const root=i*31+8+rnd(i*379)*9;if(root<s.x+7||root>s.x+s.w-7||root<camera-30||root>camera+414)continue;
          const kind=Math.floor(rnd(i*419+11)*3),plant=this.forestPlant(kind),h=36+rnd(i*97)*9,w=38+rnd(i*67)*7;
          if(plant)drawWindForest(g,plant,root-camera-w/2,s.y-h,w,h,time,false,rain,root,kind);
        }
        const fern=this.forestPlant(3);
        if(fern)for(let i=Math.floor(s.x/23);i<=Math.ceil((s.x+s.w)/23);i++){
          const root=i*23+9;if(root<s.x+4||root>s.x+s.w-4||root<camera-24||root>camera+408)continue;
          const h=15+rnd(i*283)*5;drawWindForest(g,fern,root-camera-17,s.y-h,34,h,time,false,rain,root+19,3);
        }
      }
    }
    if(rain>.001){
      g.save();g.globalAlpha=rain;
      const cloud=g.createLinearGradient(0,0,0,180);
      cloud.addColorStop(0,'rgba(12,26,43,.78)');cloud.addColorStop(.55,'rgba(12,28,43,.3)');cloud.addColorStop(1,'rgba(8,22,31,.08)');
      g.fillStyle=cloud;g.fillRect(0,0,384,216);g.restore();
    }
  }
  terrainChunk(index) {
    if (this.terrainCache.has(index)) {
      const cached = this.terrainCache.get(index); this.terrainCache.delete(index); this.terrainCache.set(index, cached); return cached;
    }
    const start = index * 128, canvas = this.createCanvas();
    canvas.width = 128 * this.scale; canvas.height = 216 * this.scale;
    const g = canvas.getContext('2d'); g.setTransform(this.scale, 0, 0, this.scale, -start * this.scale, 0);
    g.fillStyle = '#352c1b'; g.fillRect(start, 0, 128, 216);
    if(paintTropicalCliff(this,g,start)){
      // The turf and cliff now share the same weathered mossy stone palette.
    } else if (this.loaded.has('rock')) {
      // Each cache chunk samples the same continuous world texture, including partial tiles.
      g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
      this.textureSpan(g,this.images.rock,start,start+128,216,216,6);
    } else for (const cell of rockCells(start, start + 128)) {
      const points = cell.points.map(([x, y]) => [cell.x + (x - cell.x) * .976, cell.y + (y - cell.y) * .976]);
      const path = () => { g.beginPath(); points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
      const shade = rnd(cell.seed + 37), gradient = g.createLinearGradient(cell.x - 7, cell.y - 9, cell.x + 6, cell.y + 10);
      gradient.addColorStop(0, shade > .6 ? '#c49c63' : '#af844c'); gradient.addColorStop(.4, shade > .4 ? '#947041' : '#865c34'); gradient.addColorStop(1, '#493621');
      path(); g.fillStyle = gradient; g.fill(); g.save(); g.clip();
      const inner = points.map(([x, y], i) => { const inset = .82 + rnd(cell.seed + i * 31) * .12; return [cell.x + (x - cell.x) * inset, cell.y + (y - cell.y) * inset]; });
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length, a = points[i], b = points[j];
        const nx = (a[0] + b[0]) / 2 - cell.x, ny = (a[1] + b[1]) / 2 - cell.y;
        const light = (-nx * .6 - ny * .8) / (Math.hypot(nx, ny) || 1);
        g.fillStyle = light > 0 ? `rgba(225,193,130,${.12 + light * .22})` : `rgba(34,26,15,${.17 - light * .32})`;
        g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...inner[j]); g.lineTo(...inner[i]); g.closePath(); g.fill();
      }
      // Dense mineral grain, chipped inclusions and thin strata break up the flat polygon faces.
      for (let n = 0; n < 190; n++) {
        const x = cell.x + (rnd(cell.seed + n * 71) - .5) * 20, y = cell.y + (rnd(cell.seed + n * 113) - .5) * 16;
        g.fillStyle = ['rgba(230,204,151,.29)','rgba(43,34,20,.32)','rgba(157,128,78,.36)'][n % 3];
        g.fillRect(x, y, .12 + rnd(cell.seed + n) * .5, .1 + rnd(cell.seed + n * 17) * .24);
        if (n % 19 === 0) {
          g.fillStyle = 'rgba(30,26,18,.46)'; g.fillRect(x, y, .5 + rnd(cell.seed+n+20)*.8, .35);
          g.fillStyle = 'rgba(226,194,133,.38)'; g.fillRect(x, y-.2, .4, .17);
        }
      }
      for (let n=0;n<6;n++) {
        const y=cell.y+(n-3)*1.6, x=cell.x-7+rnd(cell.seed+n*37)*4;
        g.strokeStyle=n%2?'rgba(218,188,128,.2)':'rgba(39,32,19,.27)'; g.lineWidth=.16;
        g.beginPath();g.moveTo(x,y);g.lineTo(x+3,y+.25);g.lineTo(x+6+rnd(cell.seed+n+53)*4,y-.3);g.stroke();
      }
      if (shade > .25) {
        const angle = rnd(cell.seed + 911) * Math.PI * 2;
        g.save(); g.translate(cell.x, cell.y); g.rotate(angle);
        g.strokeStyle = 'rgba(34,28,17,.7)'; g.lineWidth = .22; g.beginPath();
        g.moveTo(-5, -2); g.lineTo(-2, -1); g.lineTo(0, .6); g.lineTo(2.8, .2); g.moveTo(-2, -1); g.lineTo(-1.2, -3); g.stroke(); g.restore();
      }
      for (let i=0;i<points.length;i++) {
        const a=points[i], b=points[(i+1)%points.length];
        if ((a[1]+b[1])/2>cell.y || rnd(cell.seed+i*67)<.7) continue;
        for (let n=0;n<12;n++) {
          const t=rnd(cell.seed+n*43+i*13), x=a[0]+(b[0]-a[0])*t, y=a[1]+(b[1]-a[1])*t;
          g.fillStyle=['#354b24','#526a2a','#6f8238'][n%3];
          g.fillRect(x,y,.25+rnd(cell.seed+n)*.65,.2+rnd(cell.seed+n+9)*.5);
        }
      }
      g.restore();
    }
    this.terrainCache.set(index, canvas);
    while (this.terrainCache.size > 6) this.terrainCache.delete(this.terrainCache.keys().next().value);
    return canvas;
  }
  grass(s,ends={left:true,right:true}) {
    const turf=tropicalGrassFrame(this,s,ends);
    if(turf){
      const g=this.g;g.save();
      if(s.g){
        // The high bank's new roots blend into its cliff. Low banks remain
        // clipped to the existing waterline, including its world-space waves.
        g.beginPath();g.moveTo(s.x-3,s.y-turf.top-1);g.lineTo(s.x+s.w+3,s.y-turf.top-1);
        for(let x=s.x+s.w+3;x>s.x-3;x-=1.5)g.lineTo(x,coastHeight(x));
        g.lineTo(s.x-3,coastHeight(s.x-3));g.closePath();g.clip();
      }
      g.drawImage(turf.canvas,s.x-3,s.y-turf.top,s.w+6,turf.height);g.restore();return;
    }
    const key = `grass:${s.x}:${s.y}:${s.w}:${+ends.left}:${+ends.right}`;
    let canvas = this.cache.get(key);
    if (!canvas) {
      canvas = this.createCanvas(); canvas.width = Math.ceil((s.w+6) * this.scale); canvas.height = 23 * this.scale;
      const g = canvas.getContext('2d'); g.scale(this.scale, this.scale);g.translate(3,0);
      const l=ends.left?4:0,r=ends.right?4:0;
      // Exposed sod curls down at the edge; connected slabs retain a continuous flat mat.
      g.beginPath();g.moveTo(l,2);g.lineTo(s.w-r,2);
      if(ends.right){g.quadraticCurveTo(s.w+1,2,s.w+1,8);g.quadraticCurveTo(s.w+.7,17,s.w-3,22);}
      else g.lineTo(s.w,23);
      g.lineTo(ends.left?3:0,23);
      if(ends.left){g.quadraticCurveTo(-1,17,-1,8);g.quadraticCurveTo(-1,2,4,2);}
      g.closePath();g.clip();
      // A compact sod slab, lit upper mat and overlapping fern fringe replace sparse reeds.
      g.fillStyle='#071b09';g.fillRect(0,3,s.w,8.3);
      g.fillStyle='#30331a';g.beginPath();g.moveTo(0,7);g.lineTo(s.w,7);
      for(let x=s.w;x>=0;x-=2)g.lineTo(x,10+rnd(Math.floor((s.x+x)*43))*3);
      g.closePath();g.fill();
      const shadow=g.createLinearGradient(0,8,0,16);shadow.addColorStop(0,'rgba(5,16,5,.7)');shadow.addColorStop(1,'rgba(5,16,5,0)');g.fillStyle=shadow;g.fillRect(0,8,s.w,8);
      for(let x=2;x<s.w;x+=4.5){
        const seed=Math.floor((s.x+x)*79);g.strokeStyle=rnd(seed)>.5?'#7a7040':'#273510';g.lineWidth=.3;
        const tip=11+rnd(seed+7)*5;
        g.beginPath();g.moveTo(x,8);g.quadraticCurveTo(x-1,11,x+rnd(seed+2)*2-1,tip);g.stroke();
        if(rnd(seed+13)>.5){g.beginPath();g.moveTo(x,tip-3);g.lineTo(x+1,tip-1);g.stroke();}
      }
      g.fillStyle='#285b08';g.fillRect(0,2.6,s.w,6.2);
      g.fillStyle='#65a80d';g.fillRect(0,2.2,s.w,2.5);
      g.fillStyle='#8bc817';g.fillRect(0,2.2,s.w,.65);
      for(let x=-3;x<s.w+3;x+=2.4+rnd(Math.floor((s.x+x)*53))*2.1){
        const seed=Math.floor((s.x+x)*37)+s.y*71, length=4.5+rnd(seed+3)*3;
        const direction=rnd(seed+11)>.32?1:-1, stem=x+direction, tip=stem+direction*(1.5+rnd(seed+9)*1.8);
        g.strokeStyle='#234b04';g.lineWidth=1.2;g.beginPath();g.moveTo(x,5.5);g.quadraticCurveTo(stem,8.7,tip,8+length);g.stroke();
        for(let n=0;n<4;n++){
          const y=5.5+n*(length+2)/3.6, xx=x+(tip-x)*n/4, leaf=1.8-n*.28;
          g.fillStyle=n%2?'#70b610':'#8dca18';
          g.beginPath();g.moveTo(xx,y);g.lineTo(xx-leaf,y-.35);g.lineTo(xx-.6,y+1.1);g.lineTo(xx+.45,y+1);g.closePath();g.fill();
          g.fillStyle=n%2?'#3e8008':'#66a80d';
          g.beginPath();g.moveTo(xx+.2,y+.25);g.lineTo(xx+leaf+1,y+.2);g.lineTo(xx+1.1,y+1.45);g.closePath();g.fill();
        }
        for(let n=0;n<5;n++){
          const xx=x+rnd(seed+n*43)*2.8, yy=2.3+rnd(seed+n*71)*3.5;
          g.fillStyle=['#a3dd2b','#79bd10','#315f07'][n%3];g.fillRect(xx,yy,.45+rnd(seed+n)*.8,.25);
        }
        if(rnd(seed+19)>.68){g.strokeStyle='#9acb24';g.lineWidth=.35;g.beginPath();g.moveTo(x,3);g.lineTo(x-.8,1+rnd(seed+23));g.lineTo(x+.2,2.3);g.stroke();}
      }
      // Short curved fringe at the caps breaks the straight vertical silhouette.
      for(const side of [-1,1])if(side<0?ends.left:ends.right){
        const edge=side<0?1:s.w-1;
        for(let n=0;n<4;n++){
          g.strokeStyle=n%2?'#79b919':'#366b09';g.lineWidth=.45;
          g.beginPath();g.moveTo(edge-side*n*.65,4+n*.6);g.quadraticCurveTo(edge+side*1.4,7+n,edge-side*.8,10+n*.8);g.stroke();
        }
      }
      this.cache.set(key, canvas);
    }
    this.g.drawImage(canvas, s.x-3, s.y - 3, s.w+6, 23);
  }
  ground(solids, camera) {
    const g = this.g;
    for (const s of solids) {
      if (s.gone || s.water || s.x + s.w < camera || s.x > camera + 384) continue;
      if (s.bridge) {
        // Register the deck cap at the walking plane, matching the grass lip.
        const joined=side=>s.bridge.segs.some(other=>!other.gone&&other!==s&&Math.abs(other.x-(s.x+side*s.w))<.1),tile=this.frame('environment','bridge',s.w,14);
        const bankJoined=side=>solids.some(other=>!other.gone&&!other.water&&!other.bridge&&Math.abs(other.y-s.y)<.1&&Math.abs(side<0?other.x+other.w-s.x:other.x-s.x-s.w)<.1);
        const left=joined(-1)||bankJoined(-1),right=joined(1)||bankJoined(1);
        if(tile){
          this.rect(s.x+(left?0:3),s.y+1,s.w-(left?0:3)-(right?0:3),9,'#202c36');
          const cutL=left?6:0,cutR=right?6:0;
          g.drawImage(tile,cutL*this.scale,0,(s.w-cutL-cutR)*this.scale,14*this.scale,s.x,s.y-1,s.w,14);
          this.rect(s.x+(left?0:4),s.y+1.1,s.w-(left?0:4)-(right?0:4),1.2,'#c3cbd0');
        }else {
          this.rect(s.x, s.y, s.w, 3, '#b0c4d8'); this.line(s.x, s.y + 4, s.x + s.w, s.y + 11, '#6c8094');
        }
        if (s.bridge.armed && s.bridge.next === s.seg && (this.state.t >> 2) % 2) this.rect(s.x + 14, s.y - 9, 3, 3, '#f83800');
        continue;
      }
      const depth = s.g ? Math.max(s.h, 216 - s.y) : 23;
      const left = Math.max(s.x, camera - 4), right = Math.min(s.x + s.w, camera + 388);
      const connected=x=>solids.some(other=>other!==s&&!other.gone&&!other.water&&other.x<=x&&other.x+other.w>=x&&other.y<=s.y+.1&&(other.g?216:other.y+(other.bridge?12:23))>s.y+1);
      const ends={left:!connected(s.x-.1),right:!connected(s.x+s.w+.1)};
      const higher=x=>solids.some(other=>other!==s&&!other.gone&&!other.water&&other.g&&other.x<=x&&other.x+other.w>=x&&other.y<s.y-.1);
      ends.blendLeft=!!s.g&&higher(s.x-.1);ends.blendRight=!!s.g&&higher(s.x+s.w+.1);
      if(!s.g&&this.loaded.has('turf')){this.grass(s,ends);continue;}
      const edge=side=>{
        const x=side<0?s.x:s.x+s.w;
        if(!s.g||!ends[side<0?'left':'right']||x<camera-4||x>camera+388)return null;
        const beyond=x+side*.1;
        const adjoining=solids.filter(other=>other!==s&&!other.gone&&!other.water&&other.x<=beyond&&other.x+other.w>=beyond&&other.y>s.y);
        const bottom=Math.min(coastHeight(x),...adjoining.map(other=>other.y));
        return {side,points:cliffEdgeProfile(x,s.y+3,bottom,side)};
      };
      const edgeL=edge(-1),edgeR=edge(1),paintL=left-(edgeL?4:0),paintR=right+(edgeR?4:0);
      const cornerL=left===s.x&&ends.left?3:0,cornerR=right===s.x+s.w&&ends.right?3:0;
      g.save(); g.beginPath();
      g.moveTo(left,s.y+cornerL);if(cornerL)g.quadraticCurveTo(left,s.y,left+cornerL,s.y);
      g.lineTo(right-cornerR,s.y);if(cornerR)g.quadraticCurveTo(right,s.y,right,s.y+cornerR);
      if (s.g) {
        if(edgeR)for(const point of edgeR.points)g.lineTo(...point);
        g.lineTo(right,coastHeight(right));
        for(let x=right;x>left;x-=1.5)g.lineTo(x,coastHeight(x));
        g.lineTo(left,coastHeight(left));
        if(edgeL)for(const point of edgeL.points.toReversed())g.lineTo(...point);
        g.closePath();
      }
      else {
        g.lineTo(right,s.y+depth-2);
        for (let x=right;x>left;x-=3) g.lineTo(x,s.y+depth-1-rnd(Math.floor(x)*83+s.y)*4);
        g.lineTo(left,s.y+depth-2);g.closePath();
      }
      g.clip();
      this.rect(paintL, s.y, paintR - paintL, depth, '#633000');
      for (let i = Math.floor(paintL / 128); i <= Math.floor(paintR / 128); i++) g.drawImage(this.terrainChunk(i), i * 128, 0, 128, 216);
      const soil=g.createLinearGradient(0,s.y,0,s.y+6);soil.addColorStop(0,'rgba(20,29,12,.7)');soil.addColorStop(1,'rgba(34,32,14,0)');
      g.fillStyle=soil;g.fillRect(left,s.y,right-left,6);
      if(!s.g){const underside=g.createLinearGradient(0,s.y+depth-7,0,s.y+depth);underside.addColorStop(0,'rgba(8,15,10,0)');underside.addColorStop(1,'rgba(8,15,10,.62)');g.fillStyle=underside;g.fillRect(left,s.y+depth-7,right-left,7);}
      if(s.g){const wet=g.createLinearGradient(0,190,0,201);wet.addColorStop(0,'rgba(2,20,18,0)');wet.addColorStop(1,'rgba(2,28,27,.7)');g.fillStyle=wet;g.fillRect(left,190,right-left,12);}
      for(const exposed of [edgeL,edgeR])if(exposed){
        g.beginPath();exposed.points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
        g.strokeStyle=exposed.side>0?'rgba(12,22,14,.42)':'rgba(202,171,96,.25)';g.lineWidth=1.5;g.stroke();
      }
      g.restore();
      this.grass(s,ends);
      for(const exposed of [edgeL,edgeR])if(exposed){
        const [x,y]=exposed.points[0],bottom=exposed.points.at(-1)[1];
        for(let n=0;n<3;n++){
          const length=Math.min(bottom-y-1,6+n*2.4+rnd(Math.floor(x)*31+n)*3);
          if(length<3)continue;
          g.beginPath();g.moveTo(x-exposed.side*(1+n*.8),y-1);
          g.bezierCurveTo(x+exposed.side*(1+n*.3),y+3,x-exposed.side*(1+n*.4),y+length-2,x-exposed.side*n*.3,y+length);
          g.strokeStyle=n%2?'#48542a':'#6b6440';g.lineWidth=.32;g.stroke();
        }
      }
      if(s.g)this.shore(left,right,this.state.t);
    }
  }
  shore(left,right,tick){
    const g=this.g,phase=tick*.055;
    for(const [offset,color,width] of [[1.1,'rgba(55,168,246,.8)',1.7],[0,'#e0f5ff',.72]]){
      g.beginPath();for(let x=left;x<=right+.5;x+=.5){const y=coastHeight(x)+offset+Math.sin(x*.8+phase)*.32;x===left?g.moveTo(x,y):g.lineTo(x,y);}
      g.strokeStyle=color;g.lineWidth=width;g.stroke();
    }
    for(let n=Math.floor(left/8);n<=Math.ceil(right/8);n++){
      const x=n*8+Math.sin(phase+n)*1.2;if(x<left||x+2>right)continue;
      this.line(x,coastHeight(x)+2.5+Math.sin(phase+n),x+1.4+rnd(n)*1.8,coastHeight(x)+2.6+Math.sin(phase+n),'rgba(203,239,255,.8)',.5);
    }
  }
  river(camera, water, tick, foreground = false) {
    const x0 = Math.max(water.x0, camera - 2), x1 = Math.min(water.x1, camera + 386);
    if (x0 >= x1) return;
    const gradient = this.g.createLinearGradient(0, water.surf, 0, 216);
    gradient.addColorStop(0, '#1468ea'); gradient.addColorStop(1, '#0750c5');
    this.rect(x0, foreground ? water.surf + 6 : water.surf, x1 - x0, 216 - water.surf, gradient);
    let texture=this.cache.get('water-grain');
    if (!texture) {
      texture=this.createCanvas();texture.width=96*this.scale;texture.height=30*this.scale;
      const g=texture.getContext('2d');g.scale(this.scale,this.scale);
      for (let n=0;n<520;n++) {
        const x=rnd(n*71+441)*96, y=rnd(n*113+97)*30;
        g.fillStyle=n%3?'rgba(129,199,224,.17)':'rgba(3,41,80,.23)';
        g.fillRect(x,y,.25+rnd(n*37+25)*2.2,.12+rnd(n*17+3)*.16);
      }
      this.cache.set('water-grain',texture);
    }
    this.g.save();this.g.beginPath();this.g.rect(x0,water.surf+(foreground?6:0),x1-x0,30-(foreground?6:0));this.g.clip();
    for(let x=Math.floor(x0/96)*96;x<x1;x+=96)this.g.drawImage(texture,x,water.surf,96,30);
    this.g.restore();
    for (let row = 0; row < 9; row++) {
      const y = water.surf + row * 3.5;
      for (let n = Math.floor(x0 / 23) - 1; n < Math.ceil(x1 / 23) + 1; n++) {
        const x = n * 23 - (tick / (row + 3) % 23), width = 5 + rnd(n + row * 71) * 10;
        if (x < x0 || x + width > x1 || (foreground && y < water.surf + 6)) continue;
        const yy = y + Math.sin(n * 2 + tick * .035) * .5;
        this.line(x, yy, x + width, yy + .25, row % 2 ? '#63c4f4' : '#b3e7ff', .55);
        this.line(x + 2, yy + .65, x + Math.max(3, width - 3), yy + .65, '#e4f7ff', .4);
      }
    }
    if (!foreground) this.line(x0, water.surf, x1, water.surf, '#a4e4fc', .6);
    for (const bank of [water.x0,water.x1]) if(bank>camera-8&&bank<camera+392) {
      const direction=bank===water.x0?1:-1;
      for(let i=0;i<26;i++) {
        const x=bank+direction*rnd(i*71+31)*6, y=water.surf+rnd(i*113+11)*24;
        if(foreground&&y<water.surf+6)continue;
        this.rect(x,y,.2+rnd(i+7)*1.1,.18,'rgba(174,222,226,.62)');
      }
    }
  }
  wadingWake(p,surface){
    if(!p.inWater||p.dead||p.dive||p.ride||Math.abs(p.vx||0)<.5)return;
    const phase=(p.anim||0)/10*Math.abs(p.vx)/WADE_STRIDE,stroke=Math.sin(phase*Math.PI*2);
    const side=stroke<0?-1:1,strength=Math.abs(stroke),x=p.x+side*4;
    const g=this.g;g.save();
    g.strokeStyle='rgba(191,236,249,.85)';g.lineWidth=.55;
    g.beginPath();g.ellipse(p.x-2*(p.face||1),surface+2,7+strength*2,.65,0,0,Math.PI);g.stroke();
    g.beginPath();g.moveTo(x-side*1.5,surface+.9);
    g.quadraticCurveTo(x+side*1.4,surface-1.5-strength*1.8,x+side*3.8,surface+.4);g.stroke();
    this.disc(x+side*2,surface-1.2-strength*2.2,.24,'#d2f4ff');g.restore();
  }
  drawSubmergedGround(solids,camera,surface){
    const g=this.g;g.save();g.beginPath();g.rect(camera-2,surface+6,388,216-surface-6);g.clip();
    this.ground(solids,camera);g.restore();
  }
  actor(p, role = 'red', enemy = false) {
    const tick = this.state.t;
    if(p.exitEntered)return;
    if (p.dive) return;
    const face = p.face || 1, giant = !enemy && p.giantT > 0 ? 2 : 1;
    const g = this.g;
    let y = p.y;
    const moto=!p.dead&&p.ride==='moto',ridePose=moto?motorcyclePose(p):null;
    if(moto){
      if(!enemy)drawShieldField(g,{...p,y},this.state.time||tick/60,true);
      const px=p.x+face*ridePose.rearX,py=p.y+ridePose.axleY;
      if(p.onGround){g.save();g.fillStyle='rgba(5,11,7,.45)';g.beginPath();g.ellipse(px,p.y-.15,5.2,.75,0,0,Math.PI*2);g.fill();g.restore();}
      g.save();g.translate(px,py);g.rotate(-face*ridePose.pitch);g.translate(-px,-py);
      g.save();g.translate(p.x,p.y);g.scale(face,1);this.sprite('motorcycle',-17,-21,36,21);g.restore();
    }
    if (!p.dead && p.ride === 'heli') {
      this.helicopter(p.x - 22, p.y - 27, 44, 27, tick, face < 0);
      if (p.flashT > 0) this.muzzle(p.fx, p.fy); return;
    }
    const shieldActor={...p,y};
    if(!enemy&&p.onGround&&!p.inWater&&!p.ride&&!p.enteringExit&&!p.dead){
      g.save();g.fillStyle='rgba(2,9,8,.5)';g.beginPath();g.ellipse(p.x,y-.1,(p.prone?12:5.5)*giant,.85*giant,0,0,Math.PI*2);g.fill();g.restore();
    }
    if(!enemy&&!moto)drawShieldField(g,shieldActor,this.state.time||tick/60,true);
    g.save();
    if(p.enteringExit){this.exitPath();g.clip();}
    g.translate(this.snap(p.x), this.snap(y)); g.scale(face * giant, giant);
    if (enemy && p.flash > 0) g.filter = 'brightness(1.65) saturate(.65)';
    const actorState={...p,statusTime:this.state.time||tick/60,...(p.enteringExit?{onGround:true,vx:p.enteringExit.speed||90,ay:0}:{})};
    const drawBody=()=>this.hdActors.draw(g,actorState,role,this.scale*giant);
    // The old downward-aim rifle extends below the waist clip. Use the
    // level pose for the legs and let the new upper body own the aim.
    const drawLegs=()=>this.hdActors.draw(g,{...actorState,ay:0,artPose:undefined},role,this.scale*giant);
    const uniform=enemy&&!p.roofGuard&&(p.t==='run'||p.t==='snp')&&drawStageEnemyUniform(this,p,drawBody,{drawLegs});
    if (!uniform&&!drawBody()) {
      this.rect(-4, -27, 7, 7, '#f8c080'); this.rect(-5, -20, 10, 12, role === 'enemy' ? '#688020' : '#f8b878');
      this.rect(-5, -10, 4, 10, role === 'blue' ? '#0058f8' : '#f83800'); this.rect(2, -10, 4, 10, role === 'blue' ? '#0058f8' : '#f83800');
      this.rect(4, -21, 11, 3, '#bcbcbc');
    }
    if(!enemy&&p.helmT>0){
      g.save();if(moto){const {seatX,waist}=MOTORCYCLE_RIDER;g.translate(seatX,waist);g.rotate(ridePose.pitch);g.translate(-seatX,-waist);}
      drawImpactHelmet(g,this.images.impactHelmet,p,role,tick);g.restore();
    }
    g.restore();
    if(moto)g.restore();
    if(p.dead||p.enteringExit)return;
    if (!enemy) {
      const hit=(this.state.fx||[]).find(f=>f.k==='impact'&&f.material==='shield'&&f.t<.2&&Math.hypot(f.x-p.x,f.y-(y-15*giant))<24*giant);
      drawShieldField(g,shieldActor,this.state.time||tick/60,false,hit?1-hit.t/.2:0);
      if (p.hook) this.line(p.x, p.y - 24, p.hook.x, p.hook.y, '#bcbcbc');
      if (p.flashT > 0) {const muzzle=moto?motorcycleMuzzle(p):{x:p.fx,y:p.fy};this.muzzle(muzzle.x,muzzle.y);}
    }
  }
  muzzle(x, y) {
    this.light(x, y, 4, 'rgba(255,143,24,.7)');
    this.line(x - 2.5, y, x + 3, y, '#ffd568', 1.5);
    this.line(x, y - 2.5, x, y + 2.5, '#ffb24b');
    this.disc(x, y, .85, '#fff7dc');
  }
  disc(x, y, radius, color) {
    const g = this.g; g.fillStyle = color; g.beginPath(); g.arc(x, y, radius, 0, Math.PI * 2); g.fill();
  }
  light(x, y, radius, color) {
    const g = this.g, gradient = g.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color); gradient.addColorStop(1, 'rgba(255,126,16,0)');
    this.disc(x, y, radius, gradient);
  }
  enemy(e) {
    if(e.t!=='box'&&drawFrozenEnemy(this,e,()=>this.enemy(e)))return;
    if (e.t === 'tur') {
      const image=(this.baseArt||this).images?.equipmentTurret;
      if(!drawEquipmentTurret(this.g,image,e,{frozen:this.state.freezeT>0})){
        if (!this.sprite('turret', e.x - 12, e.y - 8, 24, 24)) this.rect(e.x - 8, e.y - 8, 16, 24, '#7c7c7c');
        drawTurretBarrel(this.g,e.x,e.y+3.5,e.idx*Math.PI/6);
      }
    } else if (e.t === 'box') {
      if(!drawEquipmentSupply(this.g,(this.baseArt||this).images?.equipmentSupply,e)){
        const height=e.open?24:12;
        if (!this.sprite('crate',e.x-10,e.y-height,20,height)) this.rect(e.x-10,e.y-height,20,height,'#7c7c7c');
      }
      if (e.flash > 0) this.muzzle(e.x, e.y - 12);
    } else this.actor({ ...e, vx: e.t === 'run' && !e.attack && !e.hazardHold ? e.vx : 0, onGround: !!e.on,
      face: e.t === 'run' ? e.attack ? e.fireFace : Math.sign(e.vx) || -1 : e.face || -1, ay: e.ay || 0 }, 'enemy', true);
    if(e.shotFlash>0&&!e.dead&&!(this.state.freezeT>0))this.muzzle(e.shotX,e.shotY);
  }
  capsule(x, y, kind, flying = true) {
    if(kind==='life'){
      const g=this.g;drawWingBadge(g,x,y);
      this.rect(x-7,y-4.8,14,9.2,'#c0b484');this.rect(x-6.3,y-4.1,12.6,7.8,'#153b29');
      this.line(x-5.5,y-3.5,x+5.5,y-3.5,'#8cc67a',.6);
      this.hudText('1UP',x,y-3.1,'#e6ffc6',5.2,'center');return;
    }
    if(flying){
      if(!drawSupplyDisc(this.g,(this.baseArt||this).images?.supplySaucer,x,y))drawSupplySaucer(this.g,x,y,(this.state?.t||0)/60);
      return;
    }
    drawWingBadge(this.g,x,y);
    this.text(String(kind).toUpperCase(), x, y - 4.1, '#df594a', .95, 'center');
  }
  fortressLayers(){
    const key='fortress:cannon-layers';if(this.cache.has(key))return this.cache.get(key);
    const b=FORTRESS_ART,original=this.frame('environment','fortress',b.w,b.h);if(!original)return null;
    const facade=this.createCanvas();facade.width=original.width;facade.height=original.height;
    const ink=facade.getContext('2d');ink.drawImage(original,0,0);
    const barrels={};
    for(const [name,art]of Object.entries(FORTRESS_CANNON_ART)){
      const [x,y,w,h]=art.crop,sx=x/1201*original.width,sy=y/1254*original.height,sw=w/1201*original.width,sh=h/1254*original.height;
      const canvas=this.createCanvas();canvas.width=Math.ceil(sw);canvas.height=Math.ceil(sh);
      const g=canvas.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
      g.drawImage(original,sx,sy,sw,sh,0,0,canvas.width,canvas.height);ink.clearRect(sx,sy,sw,sh);
      barrels[name]={canvas,x:b.x+x/1201*b.w,y:b.y+y/1254*b.h,w:w/1201*b.w,h:h/1254*b.h};
    }
    const result={facade,barrels};this.cache.set(key,result);return result;
  }
  fortressFrame(boss) {
    const b=FORTRESS_ART, base=this.fortressLayers()?.facade;
    if(!base)return null;
    const mask=boss.parts.reduce((n,p,i)=>p.hp<=0?n|(1<<i):n,0);
    if(!mask)return base;
    const key='fortress-wreck:'+mask;
    if(this.cache.has(key))return this.cache.get(key);
    const canvas=this.createCanvas();canvas.width=base.width;canvas.height=base.height;
    const g=canvas.getContext('2d'),sx=canvas.width/b.w,sy=canvas.height/b.h;
    g.drawImage(base,0,0);g.setTransform(sx,0,0,sy,-b.x*sx,-b.y*sy);
    for(const part of boss.parts)if(part.hp<=0){
      const r=FORTRESS_DAMAGE_REGIONS[part.k];
      if(part.k==='core'){
        // The recess remains inside the wall; exterior turret gaps open onto the jungle.
        g.beginPath();[[.27,0],[.73,0],[1,.23],[1,.77],[.73,1],[.27,1],[0,.77],[0,.23]].forEach(([x,y],i)=>i?g.lineTo(r.x+x*r.w,r.y+y*r.h):g.moveTo(r.x+x*r.w,r.y+y*r.h));g.closePath();
        g.fillStyle='#091217';g.fill();
      }else g.clearRect(r.x-.5,r.y-3,r.w+.5,r.h+5);
    }
    this.cache.set(key,canvas);return canvas;
  }
  wreckEffects(part) {
    if(!Number.isFinite(part.destroyedAt))return;
    const age=this.state.time-part.destroyedAt;
    if(age<0||age>4)return;
    const r=FORTRESS_DAMAGE_REGIONS[part.k],fade=1-age/4,g=this.g;
    g.save();
    for(let i=0;i<3;i++){
      const phase=(age*.55+i/3)%1,size=4+Math.floor(phase*6);
      g.globalAlpha=.18*fade*(1-phase);
      this.sprite('smoke',r.x+r.w*.4+i*1.3-size/2,r.y+r.h*.45-phase*15,size,size*1.25);
    }
    g.globalAlpha=fade;
    for(let i=0;i<4;i++){
      const phase=(age*1.1+i*.27)%1,x=r.x+r.w*(.3+i*.12)+Math.sin(age*3+i)*1.2,y=r.y+r.h*.65+phase*8;
      this.disc(x,y,.13+(1-phase)*.17,i%2?'#e79548':'#bd5e2e');
    }
    g.restore();
  }
  exitPath(){
    const g=this.g,r=FORTRESS_BREACH_ART;
    // Trace the inside of the torn armor, so walking actors disappear behind it.
    g.beginPath();[[.46,.17],[.62,.16],[.73,.21],[.77,.29],[.83,.34],[.82,.43],[.89,.49],[.85,.61],[.87,.69],[.79,.77],[.72,.82],[.45,.82],[.38,.76],[.3,.72],[.28,.62],[.24,.55],[.24,.39],[.28,.29],[.35,.22]]
      .forEach(([x,y],i)=>i?g.lineTo(r.x+x*r.w,r.y+y*r.h):g.moveTo(r.x+x*r.w,r.y+y*r.h));g.closePath();
  }
  exitHole(boss){
    const g=this.g,r=FORTRESS_BREACH_ART;
    if(this.loaded.has('fortressBreach'))g.drawImage(this.images.fortressBreach,r.x,r.y,r.w,r.h);
    else{this.exitPath();g.fillStyle='#071018';g.fill();}
  }
  fortress(boss) {
    const b = FORTRESS_ART, g = this.g;
    // Painting before the facade lets the actual concrete hide his legs and body.
    if(!boss.dead)for(const e of this.state.en||[])if(e.roofGuard&&!e.dead)this.enemy(roofGuardPose(e));
    const layers=this.fortressLayers();
    for(const part of boss.parts)if(part.hp>0&&layers?.barrels[part.k]){
      const barrel=layers.barrels[part.k],pose=fortressCannonPose(part);
      g.drawImage(barrel.canvas,barrel.x+pose.recoil,barrel.y,barrel.w,barrel.h);
    }
    const facade=this.fortressFrame(boss);
    if(facade)g.drawImage(facade,b.x,b.y,b.w,b.h);
    else this.rect(b.x + 40, 0, b.w - 40, b.h, '#6c8094');
    for (const part of boss.parts) {
      if (part.hp <= 0) {
        const r=FORTRESS_DAMAGE_REGIONS[part.k],wreck=this.frame('damage',part.k,r.w,r.h);
        if(wreck&&!(part.k==='core'&&boss.dead&&this.loaded.has('fortressBreach'))){g.save();if(part.k==='core')g.filter='saturate(.55) brightness(.78)';g.drawImage(wreck,r.x,r.y,r.w,r.h);g.restore();}
        this.wreckEffects(part);
      } else if (part.flash > 0) {
        const key='part-flash:'+part.k;let mask=this.cache.get(key);
        if(!mask&&facade){
          mask=this.createCanvas();mask.width=Math.ceil(part.w*this.scale);mask.height=Math.ceil(part.h*this.scale);
          const ink=mask.getContext('2d');
          ink.drawImage(facade,(part.x-b.x)*this.scale,(part.y-b.y)*this.scale,part.w*this.scale,part.h*this.scale,0,0,mask.width,mask.height);
          ink.globalCompositeOperation='source-in';ink.fillStyle=part.k==='core'?'#bce8ff':'#fff3c9';ink.fillRect(0,0,mask.width,mask.height);this.cache.set(key,mask);
        }
        if(mask){g.save();g.globalAlpha=Math.min(1,part.flash/.06)*.34;g.drawImage(mask,part.x,part.y,part.w,part.h);g.restore();}
      }
    }
    if(!boss.dead)for(const part of boss.parts)if(FORTRESS_CANNON_ART[part.k]&&part.hp>0)drawFortressCannonEffects(g,part);
    if(boss.dead)this.exitHole(boss);
    // The contained reactor light and its reflected color are painted into the
    // chamber. A flat glowing oval would hide the new steelwork and coolant pipes.
  }
  bullets(bullets, hostile = false) {
    for (const b of bullets) {
      if (b.dead) continue;
      if (b.k === 'laser') {
        const len = Math.hypot(b.vx, b.vy) || 1, x = b.x - b.vx / len * 24, y = b.y - b.vy / len * 24;
        this.line(x, y, b.x, b.y, '#f83800', 3); this.line(x, y, b.x, b.y, '#fcfcfc');
      } else if (b.k === 'msl') {
        this.line(b.x, b.y, b.x - Math.cos(b.ang) * 5, b.y - Math.sin(b.ang) * 5, '#bcbcbc', 2);
        this.rect(b.x - Math.cos(b.ang) * 7, b.y - Math.sin(b.ang) * 7, 2, 2, '#f83800');
      } else if (b.k === 'fire') {
        this.light(b.x, b.y, 4, 'rgba(255,99,25,.85)');
        this.disc(b.x, b.y, 2, '#ffb735'); this.disc(b.x, b.y, .8, '#fff5c9');
      } else {
        drawClassicBullet(this.g,b,hostile);
      }
    }
  }
  grenades(grenades, tick) {
    for (const gr of grenades) {
      if (gr.dead) continue;
      if (gr.tnt) {
        if(gr.fuse<=0)continue;
        if(drawDemolitionCharge(this.g,(this.baseArt||this).images?.demolitionCharge,gr,tick))continue;
        this.rect(gr.x - 5, gr.y - 8, 10, 8, '#f83800'); this.rect(gr.x - 4, gr.y - 5, 8, 2, '#000000');
        this.line(gr.x, gr.y - 8, gr.x + 2, gr.y - 12, '#bcbcbc');
      } else {
        this.rect(gr.x - 2, gr.y - 3, 5, 6, '#507800'); this.rect(gr.x - 1, gr.y - 2, 2, 3, '#b8b830');
        this.rect(gr.x - 1, gr.y - 5, 3, 2, '#bcbcbc');
      }
      this.rect(gr.x + 3, gr.y - 4, 1, 1, (tick >> 2) % 2 ? '#fcfcfc' : '#f83800');
    }
  }
  effects(effects) {
    for (const fx of effects) {
      if (fx.dead) continue;
      const progress = fx.t / fx.life;
      if (fx.k === 'boom') {
        const image=(this.baseArt||this).images?.explosionAtlas;
        if(image)drawExplosion(this.g,image,fx);
        else {
          const size=Math.max(7,Math.round((fx.s||8)*(2.2-progress)));
          if(!this.sprite('explosion',fx.x-size/2,fx.y-size/2,size,size))this.muzzle(fx.x,fx.y);
        }
      } else if (fx.k === 'smoke' || fx.k === 'puff') {
        const size = 5 + Math.floor(progress * 7); this.g.globalAlpha = Math.max(0, 1 - progress);
        this.sprite('smoke', fx.x - size / 2, fx.y - size, size, size); this.g.globalAlpha = 1;
      } else if (fx.k === 'ring') {
        const size = Math.round(progress * 220);
        this.line(fx.x - size, fx.y, fx.x, fx.y - size, '#a4e4fc'); this.line(fx.x, fx.y - size, fx.x + size, fx.y, '#a4e4fc');
        this.line(fx.x + size, fx.y, fx.x, fx.y + size, '#a4e4fc'); this.line(fx.x, fx.y + size, fx.x - size, fx.y, '#a4e4fc');
      } else if (fx.k === 'stomp') drawGiantStomp(this.g,fx);
      else if(fx.k==='motoDust')drawMotorcycleDust(this.g,fx);
      else if(fx.k==='fishHit'){
        const g=this.g;g.save();g.globalAlpha=1-progress;
        for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
          const r=2+progress*9;this.line(fx.x+Math.cos(a)*r,fx.y+Math.sin(a)*r,fx.x+Math.cos(a)*(r+2),fx.y+Math.sin(a)*(r+2),'#e7ffd2',.8);
        }
        g.restore();
      }
      else if(fx.k==='lifeUp'){
        this.g.save();this.g.globalAlpha=Math.min(1,(1-progress)*2);
        this.hudText('+1 命',fx.x,fx.y-progress*14,'#dcffae',6.5,'center');this.g.restore();
      }
      else if (fx.k === 'impact') drawImpact(this.g,fx);
      else if (fx.k === 'hit') drawImpact(this.g,{...fx,material:'metal',angle:Math.PI,power:1,seed:Math.floor(fx.x*31+fx.y*97),life:.2});
      else this.rect(fx.x, fx.y, fx.k === 'debris' ? 3 : 1, fx.k === 'debris' ? 2 : 1, fx.k === 'drop' ? '#a4e4fc' : fx.k === 'debris' ? '#6c8094' : '#f8b800');
    }
  }
  life(x, y, color) {
    const frame = this.hdActors.frame(color === '#0058f8' ? 'blue' : 'red','idle',this.scale);
    if (frame) this.g.drawImage(frame.canvas, x, y - 1, 7, 9);
    else { this.disc(x + 2.5, y + 1, 1.2, '#f0d0b0'); this.line(x + 2.5, y + 3, x + 2.5, y + 7, color, 3); }
  }
  hudText(value, x, y, color = '#e6eadb', size = 6.5, align = 'left', maxWidth) {
    const g = this.g; g.save();
    const font = n => `700 ${n}px Consolas,"Microsoft YaHei","PingFang SC",sans-serif`;
    g.font = font(size);
    if (maxWidth) {
      const width = g.measureText(String(value)).width;
      if (width > maxWidth) g.font = font(size * maxWidth / width);
    }
    g.textAlign = align; g.textBaseline = 'top'; g.lineJoin = 'round';
    g.lineWidth = .65; g.strokeStyle = 'rgba(0,9,7,.85)';
    g.strokeText(String(value), x, y); g.fillStyle = color; g.fillText(String(value), x, y); g.restore();
  }
  itemLabel(kind){return itemLabel(kind);}
  playerHud(G, actor, { x, blue, role=blue?'blue':'red', inventory, selection, cooldown, infinite, local }) {
    const g = this.g, accent = role==='blue' ? '#79c6df' : '#ee895f', muted = '#9fb4a5';
    this.rect(x, 5, 1.2, 7, local ? accent : '#516f68');
    this.hudText(blue ? '玩家二' : '玩家一', x + 5, 4.5, accent, 6.5);
    this.hudText(score(G.score), x + 32, 3.5, '#f2efdb', 8, 'left', 37);
    const lives = Math.max(0, G.lives);
    for (let i = 0; i < Math.min(infinite ? 3 : lives, 3); i++) this.life(x + 77 + i * 7, 4, role==='blue' ? '#0058f8' : '#f83800');
    this.hudText(infinite ? '无限' : '×' + lives, x + 102, 6, muted, 5);
    this.hudText(WEAPON_LABELS[actor.weapon] || '步枪', x + 5, 17, '#d5ddc6', 6);
    if (actor.rapid) this.hudText('速', x + 21, 17.5, '#dfb66b', 5);
    // Empty slots are quiet notches; occupied slots keep their labels and selection cue.
    for (let i = 0; i < 3; i++) {
      const box = inventorySlotBounds(i, x), sx = box.x, item = inventory?.[i], selected = i === selection;
      if (item) {
        this.rect(sx, box.y, box.w, 9, selected ? 'rgba(182,143,71,.16)' : 'rgba(22,48,35,.4)');
        if(item==='j'&&this.images.impactHelmet?.naturalWidth>0){
          g.drawImage(this.images.impactHelmet,sx+1,16.2,8.5,8.5*331/512);
          this.hudText('盔',sx+13.4,17.2,selected?'#e5be77':muted,5,'center',6);
        }else this.hudText(this.itemLabel(item), sx + 8.5, 17, selected ? '#e5be77' : muted, 5.3, 'center', 16);
        this.rect(sx + 1, 24, 15, selected ? .8 : .4, selected ? '#c99c53' : '#4b6659');
      } else this.rect(sx + 6, 21, 5, .6, 'rgba(147,171,150,.35)');
    }
    const ready = !(cooldown > 0), gx = x + 98, aircraftMissile=actor.ride==='heli'&&!this.assets?.skinActors;
    if(aircraftMissile){
      this.line(gx+.3,22.7,gx+3.1,17.2,ready?'#d1d7c5':'#63746c',2);
      this.line(gx-.3,22.8,gx+2.6,22.1,ready?'#8faaa1':'#45594c',.7);
    }else{
      this.rect(gx, 18, 3.4, 4.8, ready ? '#819e53' : '#45594c'); this.rect(gx + .9, 16.5, 1.6, 1.5, '#b4bf9f');
    }
    this.hudText(ready ? aircraftMissile?'导弹':'就绪' : Math.ceil(cooldown) + '秒', gx + 5.5, 17.8, ready ? muted : '#d5b36c', 4.9);
    const buffs = [];
    if (actor.shieldT > 0) buffs.push('护盾' + Math.ceil(actor.shieldT) + '秒');
    if (actor.camoT > 0) buffs.push('迷彩' + Math.ceil(actor.camoT) + '秒');
    if (actor.helmT > 0) buffs.push('头盔' + Math.ceil(actor.helmT) + '秒');
    if (actor.giantT > 0) buffs.push(giantPowerLabel(actor));
    if (actor.ride) buffs.push((actor.ride === 'heli' ? '飞行' : '摩托') + Math.ceil(actor.rideT) + '秒');
    if (local && G.freezeT > 0) buffs.push('冻结' + Math.ceil(G.freezeT) + '秒');
    if (buffs.length) this.hudText(buffs.join(' · '), x + 5, 30, '#a7c6b4', 5.3, 'left', 126);
    g.globalAlpha = .4; this.line(x, 27, x + 128, 27, '#63816c', .5); g.globalAlpha = 1;
  }
  hud(G, options) {
    const { online, guest, settings, highScore } = options;
    const g = this.g; g.save();
    const shade = g.createLinearGradient(0, 0, 0, 38);
    shade.addColorStop(0, 'rgba(1,12,9,.9)'); shade.addColorStop(.56, 'rgba(2,16,11,.75)');
    shade.addColorStop(.8, 'rgba(2,16,11,.25)'); shade.addColorStop(1, 'rgba(2,16,11,0)');
    g.fillStyle = shade; g.fillRect(0, 0, 384, 38);
    this.playerHud(G, G.p, { x: HUD_PLAYER_X[0], blue: false, role:StageOneArt.playerRole(online), inventory: G.inv, selection: G.sel, cooldown: G.nadeCd,
      infinite: settings.inf === 'on', local: !guest });
    this.hudText('最高分  ' + score(Math.max(highScore || 0, G.score)), 192, 5, '#b8c4af', 6, 'center', 84);
    if (online && G.p2) this.playerHud(G, G.p2, { x: HUD_PLAYER_X[1], blue: true, inventory: G.inv2, selection: G.sel2, cooldown: G.nadeCd2,
      infinite: settings.inf === 'on', local: !!guest });
    else {
      this.hudText('第一关', 376, 4, '#e1e6d5', 7, 'right');
      this.hudText('雨林要塞', 376, 17, '#9fb4a5', 5.8, 'right');
    }
    if (G.boss.active && !G.boss.dead) {
      const core = G.boss.parts[2], health = Math.max(0, Math.min(1, core.hp / core.max));
      this.hudText('核心', 151, 17.4, '#cfb37b', 5.3);
      this.rect(166, 17.5, 66, 5.5, '#45584c'); this.rect(166.5, 18, 65, 4.5, '#101d16');
      if (health > 0) {
        const heat = g.createLinearGradient(167, 0, 231, 0);
        heat.addColorStop(0, '#a44029'); heat.addColorStop(1, '#e58d45');
        g.fillStyle = heat; g.fillRect(167, 18.5, 64 * health, 3.5);
      }
      for (let i=1;i<4;i++) this.rect(167+i*16, 18.5, .45, 3.5, 'rgba(9,20,14,.55)');
    } else if(G.boss.dead&&G.boss.exitOpen){
      const waiting=online&&options.players.some(p=>p.exitEntered);
      const complete=options.players.every(p=>p.exitEntered||(p.dead&&G.lives<=0));
      this.hudText(complete?'正在进入第二关':waiting?'等待队友进入':'跳入缺口进入下一关',192,18,'#cfb37b',5.3,'center',88);
    } else if (online) this.hudText('第一关 · 雨林要塞', 192, 18, '#99b09d', 5.5, 'center', 84);
    if (G.bannerT > 0 && G.bannerText) {
      const width = Math.min(330, G.bannerText.length * 7 + 24), left = 192 - width / 2;
      const ribbon = g.createLinearGradient(left, 0, left + width, 0);
      ribbon.addColorStop(0, 'rgba(1,14,9,0)'); ribbon.addColorStop(.18, 'rgba(1,14,9,.82)');
      ribbon.addColorStop(.82, 'rgba(1,14,9,.82)'); ribbon.addColorStop(1, 'rgba(1,14,9,0)');
      g.fillStyle = ribbon; g.fillRect(left, 42, width, 14);
      this.hudText(G.bannerText, 192, 45, '#e6d2a4', 7, 'center', width - 16);
    }
    g.restore();
  }
  present(destination) {
    destination.save(); destination.setTransform(1, 0, 0, 1, 0, 0); destination.imageSmoothingEnabled = true;
    destination.clearRect(0, 0, destination.canvas?.width || 1536, destination.canvas?.height || 864);
    destination.drawImage(this.surface, 0, 0, destination.canvas?.width || 1536, destination.canvas?.height || 864); destination.restore();
  }
  opening(destination, G, options) {
    const seconds = G.cine.t;
    this.state = { ...G, t: Math.floor(seconds * 60) };
    this.prepare(destination);
    this.background(0, this.state.t, options.solids);
    this.river(0, {x0:0,x1:FORTRESS_ART.levelEnd,surf:186}, this.state.t);
    this.ground(options.solids, 0);
    const x = Math.min(238, -60 + seconds * 20);
    if (seconds < 7) {
      this.meteor(seconds);
    } else if (seconds < 18) {
      this.helicopter(x - 42, 47, 84, 47, seconds * 60);
    } else {
      const drop = openingDrop(seconds, options.solids);
      this.helicopter(196 + (seconds - 18) * 24, 27, 84, 47, seconds * 60);
      this.actor({ ...drop, face: 1 }, StageOneArt.playerRole(options.online));
      if (drop.landingTime >= 0 && drop.landingTime < .7) {
        const age = drop.landingTime, size = 9 + age * 14;
        this.g.save(); this.g.globalAlpha = (1 - age / .7) * .55;
        this.sprite('smoke', drop.x - size - age * 9, drop.landingY - size * .5, size, size * .5);
        this.sprite('smoke', drop.x + age * 9, drop.landingY - size * .5, size, size * .5, true); this.g.restore();
      }
    }
    this.openingSubtitles(seconds);
    this.present(destination);
  }
  openingSubtitles(seconds){
    const g=this.g,page=openingCaption(seconds);g.save();
    const top=g.createLinearGradient(0,0,0,29);top.addColorStop(0,'rgba(2,12,17,.82)');top.addColorStop(1,'rgba(2,12,17,0)');
    g.fillStyle=top;g.fillRect(0,0,384,29);
    this.hudText('黑礁群岛 · 2087 年',12,9,'#d1ded7',6.1);
    this.hudText('行动代号：赤焰',372,9,'#c5b88f',6.1,'right');
    const shade=g.createLinearGradient(0,151,0,216);shade.addColorStop(0,'rgba(1,9,13,0)');shade.addColorStop(.22,'rgba(1,9,13,.92)');shade.addColorStop(1,'rgba(1,9,13,.97)');
    g.fillStyle=shade;g.fillRect(0,151,384,65);
    if(page){
      g.save();g.globalAlpha*=page.alpha;
      this.hudText(`${String(page.index+1).padStart(2,'0')} / ${String(page.total).padStart(2,'0')} · ${page.tag}`,192,159,'#cdb888',6.2,'center');
      for(const [i,line]of page.lines.entries())this.hudText(line,192,172+i*14,'#f4f2e5',9,'center',328);
      g.restore();
    }
    this.hudText('回车 / 射击键 / 点击屏幕：跳过片头',192,208,'#8caaa8',5.2,'center');g.restore();
  }
  render(destination, G, options) {
    this.prepare(destination);
    this.state = G; const g = this.g, camera = this.snap(G.camX),rain=this.rainIntensity(camera,G.t);
    this.background(camera, G.t, options.solids,rain);
    if (G.mode === 'intro') {
      this.g.globalAlpha = .8; this.rect(0, 0, 384, 216, '#000000'); this.g.globalAlpha = 1;
      this.text('第一关', 192, 66, '#fcfcfc', 2, 'center');
      this.text('雨林要塞', 192, 92, '#f8b800', 1, 'center');
      this.actor({ x: options.online ? 172 : 192, y: 157, face: 1, anim: 0 }, StageOneArt.playerRole(options.online));
      if (options.online) this.actor({ x: 212, y: 157, face: 1, anim: 0 }, 'blue');
      this.present(destination); return;
    }
    const shake = options.settings.shake === 'on' && G.shake > 0 ? Math.sin(G.t * 9) * Math.min(3, G.shake) : 0;
    g.save(); g.translate(-camera + this.snap(shake), 0);
    this.river(camera, { x0: 0, x1: FORTRESS_ART.levelEnd, surf: options.water.surf }, G.t);
    drawStageOneRain(g,camera,G.t/60,rain,options);
    drawWindblownLeaves(g,camera,G.t/60,rain,options);
    if (camera + 384 > FORTRESS_ART.x) this.fortress(G.boss);
    this.ground(options.solids, camera);
    for (const e of G.en) if (!e.dead && !e.roofGuard && e.x > camera - 40 && e.x < camera + 424) this.enemy(e);
    // Once shot, a carrier is already an item; landing never switches its appearance.
    for (const it of G.items) if (!it.dead) this.capsule(it.x, it.y - 5, it.kind, false);
    for (const pod of G.pods) if (!pod.dead) this.capsule(pod.x, pod.y, pod.kind, true, pod);
    for (const [i, p] of options.players.entries()) this.actor(p, StageOneArt.playerRole(options.online,i));
    this.bullets(G.pb); this.grenades(G.gr, G.t);
    // Foreground water shares the background's full coast and world-space phase.
    // Ending this layer at the swim collider leaves feet exposed beyond the bank.
    this.river(camera, {x0:0,x1:FORTRESS_ART.levelEnd,surf:options.water.surf}, G.t, true);
    // Restore the submerged cliff and its foam after the water covers the actors.
    // Both sides of a bank now use the same contour instead of a rectangular join.
    this.drawSubmergedGround(options.solids,camera,options.water.surf);
    if(G.stage===1&&this.loaded.has('riverFish')){
      const water={x0:0,x1:FORTRESS_ART.levelEnd,surf:options.water.surf};
      for(const event of riverFishJumps(G.time,camera,options.solids,water,G.riverFishHits))drawRiverFish(g,this.images.riverFish,event);
    }
    for(const p of options.players)this.wadingWake(p,options.water.surf);
    drawStageOneRain(g,camera,G.t/60,rain,options,true);
    drawWindblownLeaves(g,camera,G.t/60,rain,options,true);
    this.bullets(G.eb, true); this.effects(G.fx); g.restore();
    this.hud(G, options);
    if (G.flashT > 0) { g.globalAlpha = Math.min(.7, G.flashT * 2); this.rect(0, 0, 384, 216, '#fcfcfc'); g.globalAlpha = 1; }
    this.present(destination);
  }
}
