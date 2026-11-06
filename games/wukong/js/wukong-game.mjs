// Presentation for the original map. Combat simulation lives in wukong-combat.
// Rendering never writes to map, player, enemy or network state.
import { StageOneArt, STAGE_ONE_ASSETS } from '../../contra2026/js/stage-one-art.mjs?v=m4-1';
import { HDActorArt } from '../../contra2026/js/hd-actors.mjs?v=base-up-lift-1';
import { RUN_BONES } from '../../contra2026/js/stage-one-motion.mjs?v=leg-alignment-2';
import { staffGeometry, staffMotion } from './wukong-combat.mjs';
import { composeStaffFrame } from './wukong-motion.mjs';
import { flutterRibbons } from './wukong-ribbons.mjs';
import { visualStaffGeometry } from './wukong-idle.mjs';
import { WUKONG_OPENING_DURATION, stoneMonkeyBirthPose, wukongOpeningCaption, wukongOpeningFlight } from './wukong-opening.mjs';
import { BIRTH_ASSETS, drawStoneMonkeyBirth } from './wukong-birth.mjs';
import { drawFoundationSection } from './wukong-foundation.mjs';
import { drawGuardWeapon } from './wukong-guard-art.mjs';
import { drawGiant } from './wukong-boss-art.mjs?v=axe-down-2';
import { drawHalberd, drawCasket } from './wukong-props.mjs';
import { ENCOUNTER_ASSET, drawSupplyFairy, drawPeach, drawHeavenGate, heavenGatePath } from './wukong-encounter-art.mjs';
import { drawPowerStaff, RUYI_STAFF_ASSET } from './wukong-power-art.mjs';
import { drawHeavenAtmosphere } from './wukong-atmosphere.mjs';
import { PRONE_ART } from './wukong-prone.mjs';
import { WUKONG_MAGIC } from './wukong-magic.mjs';
import { STAFF_SEQUENCES } from './wukong-staff-sequences.mjs';
import { TRANSFORM_FORMS } from './wukong-transform.mjs';
import { TRANSFORM_ASSET,drawTransformation } from './wukong-transform-art.mjs';
import { drawSixArmForm, drawMagicAllies } from './wukong-magic-art.mjs';
import { QILIN_ASSET, actorRootY, drawQilin, wukongMountText } from './wukong-mount.mjs';
import { GIANT_WHOLE_ASSETS } from './wukong-giant-frames.mjs';
import { prepareGiantAtlas } from './wukong-giant-sprites.mjs';
import { HERO_WHOLE_ASSETS, wholeHeroPose } from './wukong-hero-frames.mjs';
import { composeWholeHeroFrame, prepareHeroAtlas } from './wukong-hero-sprites.mjs';
import { drawHealthBar, drawMartialEffects } from './wukong-hit-art.mjs';
import { GUARD_REACTION_ASSET, GUARD_BODY_HEIGHT, drawGuardReaction } from './wukong-guard-reactions.mjs';
import { drawSpecialStaff } from './wukong-special-staff-art.mjs';
import { drawRageBar, drawRageUltimate } from './wukong-rage-art.mjs';
import { STAFF_COMMANDS, STAFF_TRAVEL_COMMANDS } from './wukong-staff-commands.mjs';
import { drawStaffTechnique } from './wukong-staff-vfx.mjs';
import { COLOSSUS_ASSET, IMPACT_CRATER_ASSET, drawGiantFinale, drawColossusScars, drawStompWarning } from './wukong-giant-phase-art.mjs?v=crater-2';
import { colossusFootPose } from './wukong-giant-phases.mjs';

const ATLAS='/games/wukong/assets/actors.webp';
const frame=(bounds,anchor,waist,extra={})=>({bounds,anchor,waist,...extra});
const heroIdle=frame([8,6,416,438],[260,433],290);
const heroRunA=frame([454,6,399,436],[700,432],289);
const heroRunB=frame([905,6,421,432],[1130,432],289);
// Same source-to-world scale as the standing hero; never use Contra's compact roll scaling.
const heroJump=frame([1338,0,431,388],[1600,366],250,{scale:28/302});
const guardIdle=frame([7,490,404,393],[218,870],720);
export const SKIN_POSES=Object.fromEntries(['red','blue','enemy'].map(role=>{
  const idle=role==='enemy'?guardIdle:heroIdle;
  return [role,{key:'skinActors',url:ATLAS,scale:role==='enemy'?GUARD_BODY_HEIGHT/356:28/302,
    frames:{idle,up:idle,diagonalUp:idle,diagonalDown:idle,roll:idle,jump:role==='enemy'?idle:heroJump,
      prone:role==='enemy'?{...idle,scale:32/idle.bounds[2],scaleY:9/idle.bounds[3]}:PRONE_ART,dead:idle}}];
}));
export const SKIN_RUNS=Object.fromEntries(['red','blue','enemy'].map(role=>[role,{
  key:'skinActors',url:ATLAS,scale:role==='enemy'?GUARD_BODY_HEIGHT/356:28/302,
  frames:Object.fromEntries(Array.from({length:12},(_,i)=>['run'+i,role==='enemy'?guardIdle:(i<3||i>=6&&i<9?heroRunA:heroRunB)]))
}]));
export const SKIN_DEATH=Object.fromEntries(['red','blue'].map(role=>[role,{key:'skinDeath',url:'/games/wukong/assets/wukong-death.webp',scale:.075,
  frames:{deathAir:frame([5,90,742,520],[370,595],400),deathImpact:frame([748,155,694,445],[1085,588],400),
    deathRest:frame([1442,320,730,280],[1800,595],450)}}]));
// These are texture crops registered at the ORIGINAL hip/knee/ankle bones.
// HDActorArt.movingFrame and runGait remain unchanged.
function bone(bounds,start,end,length,clip){
  const k=length/Math.hypot(end[0]-start[0],end[1]-start[1]);
  return frame(bounds,start,start[1],{scale:k,scaleY:k,angle:Math.atan2(end[1]-start[1],end[0]-start[0])-Math.PI/2,
    clip:clip.map(([x,y])=>[x-bounds[0],y-bounds[1]])});
}
function limbs(enemy=false){
  const near=enemy?[[230,735],[290,785],[353,847]]:[[270,290],[326,345],[367,408]];
  const far=enemy?[[170,735],[110,794],[49,852]]:[[229,295],[169,340],[84,407]];
  const frames={};
  for(const [name,points]of [['Near',near],['Far',far]]){
    for(const [part,i,len]of [['Thigh',0,RUN_BONES.upper],['Shin',1,RUN_BONES.lower]]){
      const a=points[i],b=points[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);
      const halfWidth=(enemy?(part==='Thigh'?2.8:2.2):(part==='Thigh'?3.3:2.5))/(len/l),nx=dy/l*halfWidth,ny=-dx/l*halfWidth;
      const clip=[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]];
      const minX=Math.floor(Math.min(...clip.map(q=>q[0]))),minY=Math.floor(Math.min(...clip.map(q=>q[1])));
      const maxX=Math.ceil(Math.max(...clip.map(q=>q[0]))),maxY=Math.ceil(Math.max(...clip.map(q=>q[1])));
      frames['rig'+name+part]={...bone([minX,minY,maxX-minX,maxY-minY],a,b,len,clip),thickness:enemy?1.1:part==='Thigh'?1.18:1.35};
    }
    const ankle=points[2],sole=enemy?870:433;
    frames['rig'+name+'Boot']=frame([ankle[0]-(enemy?(name==='Far'?34:26):28),ankle[1]-9,enemy?90:92,sole-ankle[1]+12],ankle,ankle[1],
      {scale:enemy?.085:.078,scaleY:RUN_BONES.sole/(sole-ankle[1]),angle:0});
  }
  return {key:'skinActors',url:ATLAS,frames};
}
export const SKIN_RIG={red:limbs(),blue:limbs(),enemy:limbs(true)};
const translated=value=>{
  const names={'核心':'巨灵神','步枪':'金箍棒','机枪':'疾风棍','散弹':'分身棍','激光':'如意长棍','火焰':'烈焰棍','导弹':'飞旋金箍','手雷':'大招','直升机':'筋斗云','飞机':'筋斗云','雨林要塞':'云海天宫'};
  return wukongMountText(value).replace(/雨林要塞|直升机|手雷|飞机|步枪|机枪|散弹|激光|火焰|导弹|核心/g,word=>names[word]);
};
export class WukongSkin extends StageOneArt {
  constructor({createCanvas,imageFactory,autoLoad=true}){
    const assets=Object.fromEntries(Object.entries(STAGE_ONE_ASSETS).filter(([key])=>! /^(actor|run|death|explosionAtlas|supplySaucer|equipmentTurret|equipmentSupply|riverFish|fortressBreach|demolitionCharge)/.test(key)));
    super({createCanvas,imageFactory,autoLoad,assets:{...assets,...BIRTH_ASSETS,heaven:'/games/wukong/assets/heaven-panorama.webp',skinActors:ATLAS,
      somersaultCloud:'/games/wukong/assets/somersault-cloud.webp',celestialQilin:QILIN_ASSET,
      palaceFoundation:'/games/wukong/assets/palace-foundation.webp',cloudSea:'/games/wukong/assets/cloud-sea.webp',heavenProps:'/games/wukong/assets/heaven-props.webp',
      heavenCasket:'/games/wukong/assets/heaven-casket.webp',skinDeath:'/games/wukong/assets/wukong-death.webp',
      ...GIANT_WHOLE_ASSETS,...HERO_WHOLE_ASSETS,heroTransform:TRANSFORM_ASSET,giantColossus:COLOSSUS_ASSET,jadeCrater:IMPACT_CRATER_ASSET,guardReactions:GUARD_REACTION_ASSET,ruyiStaff:RUYI_STAFF_ASSET,fairy:'/games/wukong/assets/celestial-fairy.webp',skinProne:PRONE_ART.url,heavenEncounters:ENCOUNTER_ASSET}});
    const actorCanvas=()=>{const canvas=createCanvas();canvas.getContext('2d',{willReadFrequently:true});return canvas;};
    this.hdActors=new HDActorArt(actorCanvas,this.images,{poseSheets:SKIN_POSES,runSheets:SKIN_RUNS,
      runRig:SKIN_RIG,deathSheets:SKIN_DEATH,deadPose:'deathRest',proneHeight:9});
    this.hdActors.heroArt=this;
    this.hdActors.actionFrame=(...args)=>composeWholeHeroFrame(...args)||composeStaffFrame(...args);
    this.hdActors.frameEffect=(art,frame,...args)=>frame.wholeHero?frame:flutterRibbons(art,frame,...args);
  }
  loadTitle(){
    return Promise.all(['heaven','skinActors','heroWholeMovement','ruyiStaff'].map(key=>this.loadImage(key)));
  }
  loadImage(key,options){
    const promise=super.loadImage(key,options);
    if(key in HERO_WHOLE_ASSETS)return promise.then(image=>{prepareHeroAtlas(this,key);return image;});
    return key in GIANT_WHOLE_ASSETS?promise.then(image=>{prepareGiantAtlas(this,key);return image;}):promise;
  }
  inspect(){return {...super.inspect(),skin:'wukong',presentationOnly:true,
    actorsReady:!!this.images.skinActors?.naturalWidth,backgroundReady:!!this.images.heaven?.naturalWidth,
    cloudReady:!!this.images.somersaultCloud?.naturalWidth,
    sceneryReady:!!this.images.palaceFoundation?.naturalWidth&&!!this.images.cloudSea?.naturalWidth,
    heroAnimation:'whole-sprite-sequences',heroAtlases:this.heroSpriteAtlases?.size||0};}
  // Heavenly Palace has clear skies; zero also disables windblown leaves and rain splashes.
  rainIntensity(){return 0;}
  background(camera,tick){
    const g=this.g,image=this.images.heaven;
    const grad=g.createLinearGradient(0,0,0,216);grad.addColorStop(0,'#7db3c7');grad.addColorStop(1,'#e8f0db');
    g.fillStyle=grad;g.fillRect(0,0,384,216);
    if(image?.naturalWidth)g.drawImage(image,-camera*.075,0,660,220);
    g.fillStyle='rgba(236,246,238,.06)';g.fillRect(0,0,384,216);
    drawHeavenAtmosphere(this,camera,tick);
  }
  ground(solids,camera){
    for(const s of solids){
      if(s.gone||s.water||s.x+s.w<camera-4||s.x>camera+388)continue;
      drawFoundationSection(this,s,camera);
      if(s.bridge?.armed&&s.bridge.next===s.seg&&(this.state.t>>2)%2)this.disc(s.x+s.w/2,s.y-3,1.5,'#f3b45c');
    }
    drawColossusScars(this,this.state.boss);
    const boss=this.state.boss,attack=boss?.giant?.attack;
    if(!boss?.dead&&boss?.encounter?.stage===2&&attack?.kind==='skyStomp')drawStompWarning(this,attack);
  }
  // Keep the existing river region and physics, replacing its appearance with two cloud layers.
  river(camera,water,tick,foreground=false){
    const g=this.g,image=this.images.cloudSea,x0=Math.max(water.x0,camera-4),x1=Math.min(water.x1,camera+388);
    if(x0>=x1)return;
    const y=water.surf-(foreground?18:34),height=foreground?64:74;
    g.save();
    const fill=g.createLinearGradient(0,water.surf,0,216);
    fill.addColorStop(0,'rgba(225,236,242,0)');fill.addColorStop(.5,foreground?'rgba(240,244,245,.85)':'#d5e2ed');fill.addColorStop(1,'#edf2f5');
    g.fillStyle=fill;g.fillRect(x0,water.surf,x1-x0,216-water.surf);
    if(image?.naturalWidth){
      const drift=tick*(foreground?.038:.016)+camera*(foreground?.12:.28);
      g.translate(-drift,y);g.globalAlpha=foreground?.96:.88;
      this.textureSpan(g,image,x0+drift,x1+drift,foreground?270:240,height,30);
    }
    g.restore();
  }
  // Clouds obscure the base; the original underwater cliff redraw would cover them.
  drawSubmergedGround(){}
  shore(){}
  wadingWake(p,surface){
    if(!p.inWater||p.dead||p.dive||p.ride||Math.abs(p.vx||0)<.5)return;
    const g=this.g,t=this.state.t*.04;g.save();
    for(let i=0;i<3;i++){
      const x=p.x-(p.face||1)*(4+i*3),y=surface+1+Math.sin(t+i)*1.1;
      const mist=g.createRadialGradient(x,y,0,x,y,4+i);mist.addColorStop(0,'rgba(255,250,231,.45)');mist.addColorStop(1,'rgba(244,247,249,0)');
      g.fillStyle=mist;g.beginPath();g.ellipse(x,y,5+i,2.2,0,0,Math.PI*2);g.fill();
    }g.restore();
  }
  effects(effects){
    super.effects(effects.filter(f=>f.k!=='drop'));
    for(const f of effects)if(f.k==='guardDefeat'&&!f.dead)drawGuardReaction(this,f,true);
    drawMartialEffects(this,effects);
    const g=this.g;
    for(const f of effects)if(f.k==='drop'&&!f.dead){
      const u=f.t/f.life;g.save();g.globalAlpha=(1-u)*.35;
      const mist=g.createRadialGradient(f.x,f.y,0,f.x,f.y,2+u*4);
      mist.addColorStop(0,'#fff9e9');mist.addColorStop(1,'rgba(240,245,250,0)');
      g.fillStyle=mist;g.beginPath();g.ellipse(f.x,f.y,2+u*4,1+u*2,0,0,Math.PI*2);g.fill();g.restore();
    }
  }
  text(value,...args){return super.text(translated(value),...args);}
  hudText(value,...args){if(value==='核心')args[0]-=7;return super.hudText(translated(value),...args);}
  itemLabel(kind){return kind==='m'?'麒麟':WUKONG_MAGIC[kind==='g'?'clone':kind]?.short||super.itemLabel(kind);}
  playerHud(G,actor,options){
    const health=actor.maxHp>0;
    super.playerHud(health?{...G,freezeT:0}:G,health?{...actor,rapid:false,shieldT:0,camoT:0,giantT:0,ride:null}:actor.rapid?{...actor,rapid:false}:actor,options);
    if(actor.rapid)this.hudText('疾',options.x+31,17.5,'#dfb66b',4.8);
    const buffs=Object.entries(actor.magic||{}).map(([kind,effect])=>WUKONG_MAGIC[kind].short+Math.ceil(effect.remaining)+'秒');
    if(health){
      drawHealthBar(this,actor,options.x);
      drawRageBar(this,actor,options.x);
      if(actor.ride)buffs.unshift((actor.ride==='moto'?'麒麟':'筋斗云')+Math.ceil(actor.rideT)+'秒');
      if(actor.shieldT>0)buffs.unshift('金身'+Math.ceil(actor.shieldT)+'秒');
      if(actor.giantT>0)buffs.unshift('法天象地');
      if(actor.camoT>0)buffs.unshift('隐身'+Math.ceil(actor.camoT)+'秒');
      if(options.local&&G.freezeT>0)buffs.unshift('定身'+Math.ceil(G.freezeT)+'秒');
    }
    if(buffs.length)this.hudText(buffs.join(' · '),options.x+5,47,'#f0d794',4.8,'left',126);
    const move=STAFF_COMMANDS[actor.staff?.command]||STAFF_TRAVEL_COMMANDS[actor.staff?.command];
    const form=actor.magic?.transform;
    if(options.local&&form)this.hudText(TRANSFORM_FORMS[form.form].skill+' · L 换形',options.x+5,57,'#b9ffeb',5.4,'left',116);
    else if(options.local&&(move||STAFF_SEQUENCES[actor.staff?.variant]))this.hudText(move?.name||STAFF_SEQUENCES[actor.staff.variant].name,options.x+5,57,'#ffe5a2',5.4,'left',115);
    if(options.local&&G.martialCombo?.remaining>0&&G.martialCombo.hits>1)this.hudText(G.martialCombo.hits+' 连击',options.x+128,57,'#ffe5a2',7,'right');
  }
  actor(p,role='red',enemy=false){
    if(!enemy)p={...p,heroFrames:true};
    const mountAtlas=this.heroSpriteAtlases?.get('heroWholeQilin');
    if(!enemy&&!p.dead&&p.ride==='moto'&&(!mountAtlas||mountAtlas.image!==this.images.heroWholeQilin))drawQilin(this,p);
    if(!enemy){drawMagicAllies(this,p,role);if(drawTransformation(this,p))return;drawSixArmForm(this,p,false);}
    if(!enemy&&!p.dead&&!p.ride&&!p.prone&&(p.spin||p.onGround===false))p={...p,artPose:'jump'};
    // Use the facing locked at swing start for both hands, body and hit geometry.
    if(p.staff&&!enemy&&!p.dead)p={...p,face:p.staff.face};
    const whole=!enemy&&!p.dead?wholeHeroPose(p):null;
    const heroAtlas=whole&&this.heroSpriteAtlases?.get(whole.frame.sheet);
    const paintedBase=heroAtlas&&heroAtlas.image===this.images[whole.frame.sheet]?whole.painted:null;
    const longShaft=!!paintedBase&&!!this.images.ruyiStaff?.naturalWidth;
    const behind=longShaft||!enemy&&!p.dead&&!p.prone&&!p.enteringExit&&p.staff&&(paintedBase?whole.behind:staffMotion(p).behind>.5);
    if(behind){
      const size=p.giantT>0?2:1;
      this.g.save();
      if(p.staff?.airCleave&&p.staff.landed&&p.onGround){
        this.g.beginPath();this.g.rect(p.x-256,p.y-240,512,240.2);this.g.clip();
      }
      if(p.staff)this.staffTrails(p,size);drawPowerStaff(this,p,staffGeometry(p),size,{throws:false,paintedBase});
      this.g.restore();
    }
    if(!enemy&&!p.dead&&p.ride==='heli'){
      this.helicopter(p.x-22,p.y-5,44,13,this.state.t,p.face<0);
      super.actor({...p,ride:null,y:p.y,onGround:false,spin:false,restingOnCloud:true},role,enemy);
    }else if(!enemy&&!p.dead&&p.ride==='moto'){
      // Register the seated torso at the same root used by the collision staff.
      super.actor({...p,ride:null,beastRider:true,y:actorRootY(p),mountGroundY:p.y,spin:false,artPose:undefined},role,enemy);
    }else{
      this.g.save();
      if(p.hurt&&p.hurt.t<.11)this.g.filter=enemy?'brightness(1.65)':'brightness(1.3) sepia(.35) saturate(1.6)';
      super.actor(p,role,enemy);this.g.restore();
    }
    if(!enemy)drawSixArmForm(this,p,true);
    if(enemy&&p.guard&&!p.dead)drawGuardWeapon(this,p);
    if(enemy||p.dead||p.dive||p.enteringExit||p.exitEntered)return;
    const g=this.g,size=p.giantT>0?2:1,q=visualStaffGeometry(p,this.state.time||this.state.t/60);
    drawRageUltimate(this,p);
    if(p.staff&&!behind)this.staffTrails(p,size);
    drawPowerStaff(this,p,q,size,{staff:!behind,paintedBase});
    drawSpecialStaff(this,p,q);
  }
  staffTrails(p,size){
    if(p.heroFrames){drawStaffTechnique(this,p,staffGeometry);return;}
    const g=this.g;
    for(let i=3;i>=1;i--){
      const trail=staffGeometry(p,Math.max(0,p.staff.t-i*.024));
      g.save();g.globalAlpha=.06+(3-i)*.055;
      this.line(trail.butt.x,trail.butt.y,trail.tip.x,trail.tip.y,'#ffd775',3.2*size);g.restore();
    }
  }
  helicopter(x,y,w,h,tick,flip=false){
    const image=this.images.somersaultCloud;if(!image?.naturalWidth)return;
    const g=this.g,drawH=w*image.naturalHeight/image.naturalWidth;
    const bob=Math.sin(tick*.045)*h*.025;
    g.save();g.translate(x+w/2,y+h*.5+bob);g.scale(flip?-1:1,1);
    g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    g.drawImage(image,-w/2,-drawH/2,w,drawH);g.restore();
  }
  enemy(e){
    if(e.t==='run'||e.t==='snp'||e.t==='fly'){
      if(e.t==='fly'){
        this.g.save();this.g.filter='saturate(.45) brightness(1.1)';
        this.helicopter(e.x-17,e.y-2,34,10,this.state.t,e.face<0);this.g.restore();
      }
      this.g.save();if(e.flash>0)this.g.filter='brightness(1.55) saturate(.75)';
      if(!drawGuardReaction(this,e))this.actor({...e,guard:true,onGround:e.t==='snp'||!!e.on,vx:e.melee?0:e.t==='run'?e.vx:0,
        face:e.melee?.face||(e.t==='run'?Math.sign(e.vx):e.face)||-1,ay:0},'enemy',true);
      this.g.restore();
      if(this.state.freezeT>0){this.line(e.x-8,e.y-28,e.x+8,e.y-28,'#d5eff5',.7);this.line(e.x-8,e.y-28,e.x-8,e.y,'#9bcddd',.7);}
      if(e.maxHp&&e.hp<e.maxHp){this.line(e.x-9,e.y-35,e.x+9,e.y-35,'#294b53',2);this.line(e.x-9,e.y-35,e.x-9+18*Math.max(0,e.hp/e.maxHp),e.y-35,'#e8c170',1.2);}
      return;
    }
    if(e.t==='tur'){
      drawHalberd(this,e);
      return;
    }
    if(e.t==='box'){
      drawCasket(this,e);return;
    }
    return super.enemy(e);
  }
  capsule(x,y,kind,flying=true,carrier){
    if(flying)drawSupplyFairy(this,carrier||{x,y,t:this.state.time||0});
    else drawPeach(this,x,y,kind);
  }
  exitHole(boss){drawHeavenGate(this,boss);}
  exitPath(){heavenGatePath(this.g);}
  fortress(boss){
    // The gate belongs to the continuous parallax panorama painted by background().
    // A second crop here changes its scale and creates a rectangular seam at the boss.
    drawGiant(this,boss);
    if(boss.dead)this.exitHole(boss);
  }
  finalBattle(destination,state,{solids=[],settings={}}={}){
    this.prepare(destination);this.state=state;
    const ctx=this.g,clock=state.time||0;
    ctx.save();
    this.background(state.camX,state.t);
    const jitter=settings.shake==='on'&&state.shake>0?Math.sin(clock*86)*Math.min(2,state.shake*.3):0;
    ctx.translate(-state.camX,jitter);this.ground(solids,state.camX);
    drawGiantFinale(this,state.boss);ctx.restore();this.present(destination);
  }
  hud(state,options){
    super.hud(state,options);
    const boss=state.boss;if(!boss.active||boss.dead||!boss.encounter)return;
    this.hudText(boss.encounter.stage===2?'Ⅱ':'Ⅰ',236,17.3,'#efcf8c',5.8);
    if(boss.encounter.stage!==2)return;
    const a=boss.giant.attack,foot=colossusFootPose(boss.giant),tip=boss.encounter.growth>0?'巨灵显圣 · 等待落足反击':a?
      a.kind==='skyAxe'?a.locked?'斧路已锁 · 移开裂空范围':'巨斧追踪 · 留意劈落位置':a.t>=a.windup?foot.landed?'巨足停留 · 趁机连击':'巨足已抬起 · 警惕下一招':a.locked?'离开脚印，再跳起避震':'天外巨足追踪 · 准备离开落点':'警惕天外巨足 · 看准落点反击';
    const g=this.g;g.save();
    if(!(state.bannerT>0)){g.fillStyle='rgba(18,42,50,.65)';g.fillRect(55,48,274,13);this.hudText(tip,192,51,'#ffedbb',7.2,'center');}
    g.restore();
  }
  bullets(bullets,hostile=false){
    for(const b of bullets){
      if(b.dead)continue;
      const a=b.ang??Math.atan2(b.vy||0,b.vx||1),length=b.k==='laser'?24:hostile?6:8;
      this.line(b.x-Math.cos(a)*length,b.y-Math.sin(a)*length,b.x,b.y,hostile?'#bc7353':'#e5bc61',b.k==='laser'?2.2:1.1);
      this.disc(b.x,b.y,.8,hostile?'#e6b77b':'#fff0b1');
    }
  }
  opening(destination,G,options){
    const seconds=G.cine.t,birth=stoneMonkeyBirthPose(seconds);
    this.state={...G,t:Math.floor(seconds*60),time:seconds};this.prepare(destination);
    const g=this.g;
    if(birth.heaven<1)drawStoneMonkeyBirth(this,seconds);
    if(birth.heaven>0){g.save();g.globalAlpha=birth.heaven;this.openingHeaven(seconds,options);g.restore();}
    this.openingSubtitles(seconds);
    const fade=WUKONG_OPENING_DURATION-.6;
    if(seconds>fade){g.fillStyle=`rgba(9,30,39,${Math.min(1,(seconds-fade)/.6)})`;g.fillRect(0,0,384,216);}
    this.present(destination);
  }
  openingHeaven(seconds,options){
    const g=this.g,flight=wukongOpeningFlight(seconds),camera=Math.max(0,seconds-6.2)*140;
    this.background(camera,this.state.t,options.solids);
    this.river(0,{x0:0,x1:384,surf:186},this.state.t);
    this.ground(options.solids,0);
    if(flight.guards>0){
      g.save();g.globalAlpha*=flight.guards;
      for(let i=0;i<3;i++){
        const x=292+i*31,y=135+Math.sin(seconds*2+i)*2;
        this.helicopter(x-17,y-2,34,10,this.state.t,true);
        this.actor({x,y,face:-1,ax:-1,ay:0,vx:0,onGround:true,anim:0,guard:true},'enemy',true);
      }
      g.restore();
    }
    if(seconds>=9.1&&seconds<11.7){
      const x=flight.x-42,y=flight.y-47;
      this.line(x,y-5,x,y+43,'#dcb86a',1.1);
      g.save();g.fillStyle='#a73325';g.strokeStyle='#f1ce84';g.lineWidth=.5;g.beginPath();g.moveTo(x,y-3);
      g.bezierCurveTo(x-12,y-6,x-19,y+2,x-33,y-1+Math.sin(seconds*5)*2);g.lineTo(x-28,y+21);g.bezierCurveTo(x-17,y+18,x-9,y+25,x,y+20);g.closePath();g.fill();g.stroke();
      this.hudText('齐天',x-15,y+3,'#ffe9ad',6,'center');this.hudText('大圣',x-15,y+11,'#ffe9ad',6,'center');g.restore();
    }
    if(seconds>=11.7&&seconds<14.2){
      for(let i=0;i<3;i++)drawPeach(this,flight.x+43+i*16,flight.y-25+Math.sin(seconds*2.5+i)*4,null);
    }
    // The grown Wukong and his cloud share one transform; no spinning rifle pose.
    g.save();g.translate(flight.x,flight.y);g.scale(flight.scale,flight.scale);
    const density=this.scale;this.scale=density*flight.scale;
    const hero={x:0,y:0,face:1,ax:1,ay:0,ride:'heli',onGround:false,vx:0,spin:false,anim:seconds*10};
    if(seconds>=6.6&&seconds<9.1)hero.staff={kind:'sweep',variant:'figureEight',t:(seconds-6.6)%1.2,duration:1.2,combo:1,face:1,aim:0,hits:[]};
    this.actor(hero,'blue');
    this.scale=density;
    g.restore();
    this.river(0,{x0:0,x1:384,surf:186},this.state.t,true);
  }
  openingSubtitles(seconds){
    const g=this.g,page=wukongOpeningCaption(seconds);g.save();
    const top=g.createLinearGradient(0,0,0,29);top.addColorStop(0,'rgba(10,31,39,.8)');top.addColorStop(1,'rgba(10,31,39,0)');
    g.fillStyle=top;g.fillRect(0,0,384,29);
    this.hudText(seconds<6.2?'东胜神洲 · 花果山':'齐天大圣 · 孙悟空',12,9,'#f1e2b8',6.1);
    this.hudText('大闹天宫 · 南天门',372,9,'#dac18b',6.1,'right');
    const shade=g.createLinearGradient(0,150,0,216);shade.addColorStop(0,'rgba(8,27,35,0)');shade.addColorStop(.28,'rgba(8,27,35,.93)');shade.addColorStop(1,'rgba(8,27,35,.98)');
    g.fillStyle=shade;g.fillRect(0,150,384,66);
    if(page){
      g.save();g.globalAlpha*=page.alpha;
      this.hudText(`${String(page.index+1).padStart(2,'0')} / ${String(page.total).padStart(2,'0')} · ${page.tag}`,192,159,'#d8bb7b',6.2,'center');
      for(const [i,line]of page.lines.entries())this.hudText(line,192,172+i*14,'#f6edda',9,'center',338);
      g.restore();
    }
    this.hudText('回车 / 棍击 / 跳跃 / 点击屏幕：跳过片头',192,208,'#a6c1bf',5.2,'center');g.restore();
  }
  loadingBackdrop(destination,G){
    this.prepare(destination);this.state=G;this.background(1850,G.t);this.present(destination);
  }
  title(destination,G){
    this.prepare(destination);this.state=G;this.background(1850,G.t);
    const g=this.g,shade=g.createLinearGradient(0,0,270,0);
    shade.addColorStop(0,'rgba(9,39,48,.88)');shade.addColorStop(1,'rgba(9,39,48,0)');g.fillStyle=shade;g.fillRect(0,0,384,216);
    this.hudText('齐天大圣',24,30,'#e0c287',8);
    this.hudText('大闹天宫',22,48,'#ffe7a8',28);
    this.hudText('云海天宫 / 南天门 · 前两章',24,88,'#f3e4c4',9);
    this.actor({x:292,y:187,face:-1,ax:-1,ay:0,onGround:true,anim:0},'blue');
    this.present(destination);
  }
  mount(document){
    document.title='大闹天宫 · 云海天宫';document.body.classList.add('wukong');
    const $=id=>document.getElementById(id);
    $('scrTitle').querySelector('h1').textContent='大闹天宫';
    $('game').setAttribute('aria-label','大闹天宫 · 云海天宫游戏画面');
    $('scrSettings').querySelector('.settings-brand span').textContent='大闹天宫';
    $('scrSettings').querySelector('.settings-brand strong').textContent='修行设置';
    $('btnSel1').textContent='第一关 · 云海天宫';
    $('btnSel2').textContent='第二关 · 南天门 · 破阵登天';
    const firstCoopStage=$('coopStage').querySelector('option[value="1"]');if(firstCoopStage)firstCoopStage.textContent='第一关 · 云海天宫';
    $('scrLoading').querySelector('.loading-brand').textContent='齐天大圣 · 云海天宫';
    $('loadingTitle').textContent='大闹天宫';
    $('bFire').innerHTML='<b>棍击</b>方向出招';$('bNade').textContent='大招';
    $('lbl-autofire').innerHTML='棍击辅助<small>短按可预输入下一棍；长按蓄力在两种模式都可使用</small>';
    $('foot').innerHTML='<span><b>方向 + J</b> 指定棍招 · 长按蓄力</span><span><b>↓，再前 + J</b> 舞花连段</span><span><b>K</b> 二段跳 / 空中↓下劈</span><span><b>I</b> 满怒随机大招</span><span><b>L</b> 使用道具 / 七十二变换形</span><span><b>Q</b> 切换道具</span><span><b>回车</b> 暂停</span><span id="gamepad-indicator">手柄：点击游戏后按 A 激活</span>';
    $('paneHelp').innerHTML='<h3>悟空 · 云海天宫</h3><p>WASD / 方向键移动，短按 J 挥棍。行进中连续短按 J 自动轮换平抡、舞花、抡劈、马步仆扫、盘龙与云棍，空中行进攻击轮换旋棍、交叉劈和回身撩；其余方向组合仍可指定挑棍、扫堂与绕顶棍，不按方向时保留丰富的随机棍法；连续点按可衔接，收招前约 0.4 秒可预输入下一招，放开方向也不会变招。棍头和棍尾实际接触敌人才命中。</p><h4>方向出招表</h4><p>'+Object.values(STAFF_COMMANDS).map(move=>'<b>'+move.keys+'</b>：'+move.name).join('<br>')+'</p><p>舞花连段：先按↓，在约 0.3 秒内转向←或→并短按 J；可经过斜下方向。←/→均可作为出招方向。单独按↓仍是伏地；↓ + J 改为有起手、低扫和收势的扫堂棍。WASD 与方向键等效，X 也可代替 J；触屏摇杆 + 棍击、手柄方向 + X / RT 使用同一套组合。</p><p>K / 空格跳跃和二段跳。空中按 S / 下方向键，悟空会双手举棍向下劈落，落地后收招；每次腾空可触发一次，不需要再按攻击键。普通空中 J 保留旋棍、反转、交叉劈和凌空刺。</p><p>不按方向长按 J 蓄力，约 0.55 秒即可松开发出金色棍气；约 1.25 秒蓄满。方向 + J 会先完整施展棍招，继续按住才转入蓄力姿势，出招时积累的能量保留，棍气更大、威力更强。头顶进度条和音效提示可释放/满蓄。棍气能穿过数个敌人，遇墙消散，可在移动、跳跃、骑麒麟或驾云时蓄力。受击、施放大招或暂停会中断蓄力；疾风棍和疾速诀可加快蓄力，分身棍发出三道棍气，长棍增加气刃大小和射程，烈焰棍增加伤害。</p><p>怒气上限 100，每次实际受伤增加 50 点，两次有效受击即可攒满；满怒按 I / 大招 / 手柄 B，随机施放横扫天宫、定海神针、金箍风暴或万道棍气，消耗全部怒气并短暂护身，可打断受击反击。每轮四招随机轮换，相邻两次不会相同；护盾或无敌挡住的伤害不积怒，补血不改变怒气，复活从零开始。怒气只用于大招。L 使用当前道具，Q 切换；仙术、坐骑、巨大化和七十二变均不要求或消耗怒气，只使用道具库存和各自冷却。七十二变持续 18 秒，L 换形、J 攻击；金翅鹏可飞行，白虎可扑杀，玄龟按↓蓄守反震。触屏长按棍击按钮蓄力，松开发射；手柄长按 X / RT 后松开同样释放棍气，方向下为空中下劈，A 跳跃，B 大招，Y 使用道具。</p><p>天兵与巨灵神会用兵器近战；留意起手，闪避后近身连击或蓄力还击。仙女携桃飞过，击中后飞离并掉落寿桃；补血仙桃恢复 30 点，金丹恢复 60 点。击败巨灵神后跳入白玉仙门，完成云海天宫首章。</p>';
    $('paneHelp').innerHTML+='<p>寿桃道具会改变实际棍法：M 疾风棍，挥棍速度提高 70%；L 如意伸缩棍，待机保持正常长度，出棍时最多延长 45%，随后抽回；收棍稍慢且不能造成伤害；S 分身棍，三根棍影同时攻击；H 飞旋金箍，掷出后飞回，去回各能命中一次；R 疾速诀，可与其他棍法叠加提速 25%；F 烈焰棍，附带烈焰棍影与额外伤害。拾取新棍法会替换当前棍法，R 的提速保留。</p><p>普通天兵有 6 点生命，守卫有 8 点，需连打数棍；受击时出现血条和短暂停顿。腾云飞兵会从空中接近，再用长兵器近战，可以跳跃上挑、伸长棍或飞旋棍迎击。</p><p>音量：在设置中分别调整背景音乐与音效的 0–100% 音量，拖动立即生效并自动保存。默认 BGM 30%、音效 100%；设为 0 可单独静音，也可保留原开关。</p>';
    $('paneHelp').innerHTML+='<p>新增仙术寿桃：臂＝三头六臂，持续 12 秒，六只手臂同时舞动三根金箍棒；影＝身外身，召出两个分身自动挥棍助战 12 秒；猴＝猴子猴孙，召出六只小猴自动寻敌近战 10 秒。拾取后收入道具栏，Q 切换、L 使用，可与棍法强化和其他仙术同时生效。重复施放同一种仙术会刷新持续时间，死亡或进入出口后结束。</p>';
    $('paneHelp').innerHTML+='<p>悟空有 16 句战斗喊声，按普通棍招、重棍、棍气和大招轮换，最近四句不会重复。普通喊招约隔 5–8 秒，单句至少隔 24 秒；“吃俺老孙一棒”只在少数大招或终结技使用，两次至少相隔 60 秒。喊声完整播放，讲话时棍声进一步压低。人声和出招音效共用音效开关与音量，暂停时停止。</p>';
    $('paneHelp').innerHTML+='<h4>第二关 · 南天门</h4><p>在门前落地按住上方向约四分之一秒进入房间；攻击时不会误进门。前庭三条支路自由选序：巨弩风阵要击退弩台守军，挥棍敲左拨杆转到中档，再敲右金扣发弩；回雷灵阵要用棍身接触雷珠，将三枚雷珠打回阵核；镇甲力阵要击断上下两处锁扣，再敲止动扣放下攻城锤。任意破两阵即可击断主门门闩，第三阵可选。未破阵眼会支援增长天王；镇甲阵破除后，重劈收势反击时间从3秒延长到4秒。每个房间都有返回通路，已破阵眼随检查点保留。双人需靠近同一门后进入。</p>';
    const style=document.createElement('style');
    $('paneHelp').innerHTML+='<p>巨灵神有三个阶段：先留意快步追击、斧招与跳斩；半血后变成巨足战，巨斧先追踪再锁定劈落位置，移出斧路闪避；踩踏圈内环收紧表示即将落脚，先离开脚印，再跳起躲震，落足后近身反击。打空巨足血槽后，悟空自动施展法天象地并完成终结连击，期间无需战斗操作，可暂停或静音；演出结束后巨灵神倒地，仙门才会开启。</p>';
    style.textContent=`
      body.wukong{background:#102d36;color:#f0e4c7}
      .wukong #scrTitle{left:0;right:0;align-items:flex-start;justify-content:flex-end;padding:0 0 calc(var(--s)*15px) calc(var(--s)*24px)}
      .wukong #scrTitle .menu{align-items:flex-start;gap:calc(var(--s)*2px)}
      .wukong #scrTitle .btn{font-size:clamp(13px,calc(var(--s)*6px),28px);color:#f8e4ad;text-shadow:0 2px 6px #102d36}
      .wukong .screen:not(#scrTitle){background:rgba(8,34,43,.94)}
      .wukong #scrLoading.screen{background:linear-gradient(90deg,rgba(5,29,38,.94),rgba(8,34,43,.76) 62%,rgba(13,47,57,.4)),var(--loading-cover,none) center/cover no-repeat}
      .wukong #scrLoading .loading-brand{color:#dec99c}.wukong #loadingPercent{color:#ffe2a1}
      .wukong #scrLoading .loading-track{background:rgba(207,224,217,.18)}.wukong #loadingFill{background:linear-gradient(90deg,#b58338,#ffe6a1)}
      .wukong .btn{color:#efdbb1}.wukong #foot{color:#c4ccc3}
      .wukong #hud button{background:rgba(14,48,55,.78);color:#e2c17d;box-shadow:inset 0 0 0 1px #b79b61;border-radius:4px}
      .wukong.wukong-finale #touch{display:none}
      .wukong.wukong-finale #hud{left:auto!important;right:12px!important;top:auto!important;bottom:12px!important;transform:none!important}
      .wukong #bNade.rage-ready{background:#8b501ee8;color:#fff3c2;box-shadow:inset 0 0 0 3px #ffda75,0 0 18px #ffb43199,0 3px 0 #0009}
    `;document.head.appendChild(style);
  }
}
