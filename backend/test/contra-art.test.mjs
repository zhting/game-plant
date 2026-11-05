import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ATLASES } from '../../games/contra2026/js/stage-one-atlas.mjs';
import { StageOneArt, FORTRESS_ART, FORTRESS_TARGETS, STAGE_ONE_ASSETS } from '../../games/contra2026/js/stage-one-art.mjs';
import { isRunning } from '../../games/contra2026/js/stage-one-motion.mjs';
import { HD_ACTORS, HD_RUNS, HD_DEATH, HD_RUN_RIG, HDActorArt, actorPose } from '../../games/contra2026/js/hd-actors.mjs';
import { CLASSIC_LAYERS, CLASSIC_FACILITIES, CLASSIC_TURRET_BASE_BOUNDS, nightStars } from '../../games/contra2026/js/stage-one-classic.mjs';
import { COMBAT_ASSETS } from '../../games/contra2026/js/combat-art.mjs';
import {motorcycleMuzzle} from '../../games/contra2026/js/motorcycle-motion.mjs';

test('摩托起跳射击时枪口火光跟随当前骑乘姿态，不停留在起跳前的位置',()=>{
  const flashes=[],g=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:()=>{}});
  const art={g,state:{t:30,time:.5,fx:[]},scale:1,snap:n=>n,sprite:()=>true,hdActors:{draw:()=>true},muzzle:(x,y)=>flashes.push({x,y})};
  const rider={x:180,y:110,face:1,ax:1,ay:0,ride:'moto',motoPitch:.3,onGround:false,flashT:.04,fx:160,fy:145};
  StageOneArt.prototype.actor.call(art,rider,'blue');
  assert.deepEqual(flashes,[motorcycleMuzzle(rider)]);assert.notEqual(flashes[0].y,rider.fy);
});

test('星空闪烁只改变亮度，镜头移动按远景视差移动星点而不随机重排',()=>{
  const first=nightStars(0,0),later=nightStars(0,3),scrolled=nightStars(50,0);
  assert.deepEqual(first.map(({x,y})=>[x,y]),later.map(({x,y})=>[x,y]));
  assert.ok(first.some((s,i)=>s.alpha!==later[i].alpha));
  for(const s of first.filter(s=>s.x>2)){
    assert.ok(scrolled.some(n=>n.y===s.y&&Math.abs(n.x-(s.x-1.75))<1e-8));
  }
});

test('完整树冠在岸边自然伸出，树根固定世界位置，不同种类保留独立摆动，远林保留视差',()=>{
  const forest={height:44},plants=Array.from({length:4},()=>({width:160,height:176})),solids=[{x:0,y:112,w:240,g:1},{x:240,y:144,w:380,g:1}];
  let original;
  for(const camera of [0,70,150,230,240,300]){
    const draws=[],stack=[];
    const g=new Proxy({globalAlpha:1,createLinearGradient:()=>({addColorStop(){}}),save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},
      drawImage(image,...args){const [x,y,w,h]=args.length===8?args.slice(4):args;draws.push({image,x,y,w,h,root:args.length!==8||Math.abs(args[1]+args[3]-image.height)<1e-9,alpha:this.globalAlpha});}},{get:(o,k)=>k in o?o[k]:()=>{}});
    const art={g,rainIntensity:StageOneArt.prototype.rainIntensity,rect(){},frame:sheet=>sheet==='lowJungle'?forest:null,forestPlant:kind=>plants[kind]};
    StageOneArt.prototype.background.call(art,camera,60,solids);
    const near=draws.filter(d=>d.alpha===1);
    for(const floor of solids.filter(s=>s.x+s.w>=camera)){
      const row=near.filter(d=>d.root&&Math.abs(d.y+d.h-floor.y)<1e-9);
      assert.ok(row.length);
      assert.ok(row.every(d=>d.x+d.w/2+camera>=floor.x&&d.x+d.w/2+camera<=floor.x+floor.w),'roots stay on their own bank');
    }
    const roots=near.filter(d=>d.root).map(d=>({x:d.x+d.w/2+camera,y:d.y+d.h,image:d.image}));
    if(!original){original=roots;assert.ok(near.some(d=>d.y+d.h<=112&&(d.x<0||d.x<240&&d.x+d.w>240)),'whole crowns can overhang either edge as the wind bends them');}
    else {const shared=roots.filter(d=>original.some(o=>Math.abs(o.x-d.x)<1e-8&&o.image===d.image));assert.ok(shared.length);for(const root of shared)assert.equal(root.y,original.find(o=>Math.abs(o.x-root.x)<1e-8&&o.image===root.image).y);}
    assert.ok(new Set(near.map(d=>d.image)).size>=3,'each view mixes palms and ground ferns');
    const far=draws.find(d=>d.alpha<1&&d.root&&Math.abs(d.y+d.h-184)<1e-9);assert.ok(far);
    assert.ok(Math.abs(far.x+camera*.22)<1e-8,'远林继续使用独立的慢速视差');
  }
});

test('未击落的空中补给只绘制飞碟，道具徽章显示大写武器字母',()=>{
  const gradient={addColorStop(){}},letters=[];
  const g=new Proxy({createLinearGradient:()=>gradient},{get:(o,k)=>o[k]||(()=>{})});
  const art={g,state:{t:60},sprite:()=>true,rect(){},text:value=>letters.push(value)};
  StageOneArt.prototype.capsule.call(art,120,60,'G');assert.deepEqual(letters,[]);
  StageOneArt.prototype.capsule.call(art,120,139,'G',false);assert.deepEqual(letters,['G']);
});

test('击落后第一帧及下落途中立即绘制道具图标，着地后保持同一图标',()=>{
  const draws=[],g=new Proxy({},{get:()=>()=>{}});
  const art={g,snap:n=>n,rainIntensity:StageOneArt.prototype.rainIntensity,capsule:(...args)=>draws.push(args)};
  for(const method of ['prepare','background','river','ground','drawSubmergedGround','bullets','grenades','effects','hud','present'])art[method]=()=>{};
  const item={x:120,y:60,kind:'M',fromPod:true,landed:false};
  const G={mode:'play',camX:0,t:0,en:[],items:[item],pods:[],pb:[],gr:[],eb:[],fx:[]};
  for(const [y,landed]of [[60,false],[84,false],[112,true]]){
    Object.assign(item,{y,landed});
    StageOneArt.prototype.render.call(art,{},G,{settings:{},water:{surf:186},solids:[],players:[]});
    assert.deepEqual(draws.at(-1),[120,y-5,'M',false]);
  }
});

test('进入洞口时保持原角色尺寸与不透明度，以洞口裁切遮住向右移动的身体',()=>{
  for(const giant of [1,2])for(const time of [0,.2,.5]){
    const scales=[],clips=[],actors=[];
    const g=new Proxy({globalAlpha:1,scale:(...args)=>scales.push(args),clip:()=>clips.push(true)},{get:(o,k)=>k in o?o[k]:(()=>{})});
    const art={g,state:{t:100,time:1.6},scale:10,snap:n=>n,exitPath(){},hdActors:{draw:(_g,p)=>{actors.push(p);return true;}}};
    StageOneArt.prototype.actor.call(art,{x:3300,y:145,face:1,giantT:giant===2?3:0,enteringExit:{t:time,speed:100}},'blue');
    assert.deepEqual(scales,[[giant,giant]]);assert.equal(g.globalAlpha,1);assert.equal(clips.length,1);
    assert.equal(actors[0].vx,100);assert.equal(actors[0].onGround,true);
  }
});

test('敌兵真实状态传入跑步渲染，换向同步，跳跃和固定射手不触发跑步', () => {
  const draws = [];
  const art = { state: { freezeT: 0 }, actor: (p, role) => draws.push({ p, role }) };
  for (const vx of [-62, 62]) {
    StageOneArt.prototype.enemy.call(art, { t: 'run', vx, on: true, anim: 2, face: -Math.sign(vx) });
    const { p, role } = draws.at(-1);
    assert.equal(role, 'enemy'); assert.equal(isRunning(p), true);
    assert.equal(p.anim, 2); assert.equal(p.face, Math.sign(vx));
  }
  for (const state of [{ t: 'run', vx: 62, on: false }, { t: 'run', vx: 0, on: true }, { t: 'snp', on: true }]) {
    StageOneArt.prototype.enemy.call(art, state);
    assert.equal(isRunning(draws.at(-1).p), false);
  }
});

test('跑兵攻击时停步朝目标持枪，枪口火光使用实际弹丸起点',()=>{
  const draws=[],flashes=[],art={state:{freezeT:0},actor:(p,role)=>draws.push({p,role}),muzzle:(x,y)=>flashes.push([x,y])};
  StageOneArt.prototype.enemy.call(art,{t:'run',x:200,y:144,vx:62,on:true,attack:{phase:'recover'},fireFace:-1,ay:0,shotFlash:.07,shotX:182,shotY:123});
  assert.equal(draws[0].p.vx,0);assert.equal(draws[0].p.face,-1);assert.equal(isRunning(draws[0].p),false);
  assert.deepEqual(flashes,[[182,123]]);
});

test('第一关正式位图资源存在，角色及要塞高清透明，裁切均在图像边界内', () => {
  for (const [name, url] of Object.entries(STAGE_ONE_ASSETS)) {
    const file = new URL('../..' + url, import.meta.url);
    const webp = fs.readFileSync(file);
    assert.equal(webp.toString('ascii', 0, 4), 'RIFF');
    assert.equal(webp.toString('ascii', 8, 12), 'WEBP');
    if(name==='enemyUniform'){
      assert.equal(webp.toString('ascii',12,16),'VP8X');assert.ok(webp[20]&16,'stage uniform keeps transparency');continue;
    }
    if(name==='turf'){
      // This shared shelf predates the PNG master archive; inspect WebP's
      // extended header directly instead of requiring a duplicate master.
      assert.equal(webp.toString('ascii',12,16),'VP8X');assert.ok(webp[20]&16);
      assert.deepEqual([webp.readUIntLE(24,3)+1,webp.readUIntLE(27,3)+1],[1774,887]);continue;
    }
    const png = fs.readFileSync(new URL(file.href.replace(/\.webp$/, '.png')));
    assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
    if(name==='freezeAtlas'){
      const m=JSON.parse(fs.readFileSync(new URL('../../games/contra2026/design/enemy-freeze-v2.json',import.meta.url),'utf8'));
      assert.equal(png[25],6);assert.deepEqual([width,height],m.dimensions);assert.equal(webp.length,m.bytes);
      for(const [x,y,w,h]of Object.values(m.frames))assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);
      continue;
    }
    if(name==='demolitionCharge'){assert.equal(png[25],6);assert.deepEqual([width,height],[512,256]);continue;}
    if(name==='riverFish'){assert.equal(png[25],6);assert.equal(width,512);assert.ok(height>=128);continue;}
    if(name==='fortressBreach'){assert.equal(png[25],6);assert.equal(width,640);assert.ok(height>=900);continue;}
    if(COMBAT_ASSETS[name]){assert.equal(png[25],6);assert.ok(width>=512&&height>=144);continue;}
    if (name === 'jungle' || name === 'rock') { assert.ok(width>=1000&&height>=1000); continue; }
    assert.equal(png[25], 6, `${name}: PNG RGBA transparency`);
    if(CLASSIC_LAYERS[name]||name==='facilities'||name==='turretBase'){
      assert.ok(width>=1500&&height>=700,'large-screen scenery retains native detail');
      for(const[x,y,w,h]of name==='facilities'?Object.values(CLASSIC_FACILITIES):name==='turretBase'?[CLASSIC_TURRET_BASE_BOUNDS]:[CLASSIC_LAYERS[name]]){
        assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=width&&y+h<=height,`${name}: crop inside PNG`);
      }
      continue;
    }
    if (name === 'palm') { assert.ok(width >= 1000 && height >= 1000, 'large-screen palm source retains native detail'); continue; }
    if(name==='fortress'){assert.ok(width>=1200&&height>=1200);continue;}
    if(name==='actorDeath'){
      assert.ok(width>=1500&&height>=1000);
      for(const sheet of Object.values(HD_DEATH))for(const frame of Object.values(sheet.frames)){
        const[x,y,w,h]=frame.bounds;assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);
      }
      continue;
    }
    if(name==='runLimbs'){
      for(const sheet of Object.values(HD_RUN_RIG))for(const frame of Object.values(sheet.frames)){
        const[x,y,w,h]=frame.bounds;assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);
      }
      continue;
    }
    const sheet=[...Object.values(HD_ACTORS),...Object.values(HD_RUNS)].find(sheet=>sheet.key===name);
    if(sheet){
      assert.deepEqual([width,height],sheet.size);assert.equal(Object.keys(sheet.frames).length,12);
      assert.ok((sheet.frames.idle||sheet.frames.run0).bounds[3]>=300,'native body resolution is higher than the old 168px body');
      for(const frame of Object.values(sheet.frames)){
        const [x,y,w,h]=frame.bounds;assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);
      }
      continue;
    }
    assert.equal(width, ATLASES[name].size[0]); assert.equal(height, ATLASES[name].size[1]);
    assert.equal(Object.keys(ATLASES[name].frames).length, name === 'actors' ? 24 : name === 'damage' ? 3 : 12);
    for (const [frame, [x,y,w,h]] of Object.entries(ATLASES[name].frames)) {
      assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= width && y + h <= height, frame);
    }
  }
});

test('兼容跑步姿势选择仍覆盖十二帧，停止与腾空切换姿势',()=>{
  for(const role of ['red','blue','enemy']){
    const speed=role==='enemy'?62:90,duration=(role==='enemy'?36:42)/speed;
    const frames=new Set();
    for(let i=0;i<60;i++)for(const ay of [-1,-.7,0,.7]){
      const pose=actorPose({vx:speed,onGround:true,anim:duration*i/60*10,ay},role==='enemy');
      assert.ok(pose.startsWith('run'));assert.ok(HD_RUNS[role].frames[pose]);frames.add(pose);
    }
    assert.equal(frames.size,12);
    assert.equal(actorPose({vx:0,onGround:true,ay:0}),'idle');
    assert.equal(actorPose({vx:90,onGround:false,spin:true}),'roll');
  }
});

test('高清角色按显示密度缓存，4K 与巨大化提高绘制精度而不改变逻辑尺寸',()=>{
  const images=Object.fromEntries([...Object.values(HD_ACTORS),...Object.values(HD_RUNS)].map(sheet=>[sheet.key,{naturalWidth:sheet.size[0]}]));
  const sources=[];
  const art=new HDActorArt(()=>{const canvas={};canvas.getContext=()=>({drawImage:(...args)=>sources.push(args),save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){}});return canvas;},images);
  for(const role of Object.keys(HD_ACTORS)){
    const low=art.frame(role,'run2',2),native=art.frame(role,'run2',10),giant=art.frame(role,'run2',20);
    assert.equal(low.w,native.w);assert.equal(low.h,native.h);assert.equal(native.w,giant.w);
    assert.equal(native.canvas.width,Math.ceil(native.w*10));
    assert.equal(giant.canvas.height,Math.ceil(giant.h*20));
    const count=sources.length;assert.equal(art.frame(role,'run2',10),native);assert.equal(sources.length,count);
  }
  art.clear();assert.equal(art.cache.size,0);
});

test('第一关要塞命中区域与立面坐标共用一份定义', () => {
  for (const target of FORTRESS_TARGETS) {
    assert.ok(target.x >= FORTRESS_ART.x && target.x + target.w <= FORTRESS_ART.x + FORTRESS_ART.w);
    assert.ok(target.y >= FORTRESS_ART.y && target.y + target.h <= FORTRESS_ART.y + FORTRESS_ART.h);
  }
});

test('关底要塞完整露出塔顶、基座落地，最终镜头右侧没有建筑留白', () => {
  const b = FORTRESS_ART, finalCamera = b.levelEnd - 384;
  assert.ok(b.y >= 27, 'roof must be below the HUD');
  assert.equal(b.y + b.h, 176, 'fortress base meets the ground');
  assert.ok(b.x + b.w - finalCamera >= 384, 'rear armor extends beyond the viewport edge');
  const [sx,,sw,sh] = ATLASES.environment.frames.fortress;
  const visibleRear = b.x + (346 - sx) / sw * b.w;
  assert.ok(visibleRear >= b.levelEnd, 'solid rear pillar, rather than transparent atlas margin, covers the right edge');
  assert.ok(Math.abs(b.w / b.h - sw / sh) < .04, 'retain source proportions');
});

test('全高清和 4K 使用对应精度的精灵，缩放后仍按原逻辑尺寸绘制并回收旧缓存', () => {
  const images = [], draws = [];
  const createCanvas = () => {
    const canvas = { width: 0, height: 0 };
    const context = { canvas, setTransform() {}, save() {}, restore() {}, translate() {}, scale() {},
      drawImage: (...args) => draws.push(args) };
    canvas.getContext = () => context; return canvas;
  };
  const art = new StageOneArt({ createCanvas, imageFactory: () => { const image = {}; images.push(image); return image; } });
  images.forEach(image => image.onload());
  for (const [width, height] of [[1920, 1080], [3840, 2160], [768, 432]]) {
    art.prepare({ canvas: { width, height } });
    assert.deepEqual(art.inspect().resolution, [width, height]);
    assert.equal(art.inspect().frameCount, 0, 'resolution change releases old sprite surfaces');
    art.sprite('turret', 100, 150, 20, 24);
    const draw = draws.at(-1), frame = draw[0];
    assert.equal(frame.width, 20 * width / 384); assert.equal(frame.height, 24 * height / 216);
    assert.deepEqual(draw.slice(1), [0, 0, 20, 24], 'display density must not enlarge logical hitbox artwork');
    assert.equal(art.inspect().frameCount, 1);
    art.prepare({ canvas: { width, height } });
    assert.equal(art.inspect().frameCount, 1, 'same-size frames reuse the cache');
  }
});
