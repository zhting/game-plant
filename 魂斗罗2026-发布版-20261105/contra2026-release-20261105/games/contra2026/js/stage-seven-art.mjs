import {StageOneArt} from './stage-one-art.mjs?v=single-enemy-rifle-1';
import {HUD_PLAYER_X} from './hud-layout.mjs';
import {drawFrozenEnemy} from './enemy-freeze-art.mjs?v=larva-hop-1';
import {drawHangarAtmosphere,drawHangarRouteBackdrop} from './stage-seven-atmosphere.mjs?v=hangar-required-routes-1';
import {HANGAR_PLATE,hangarPlateBox} from './stage-seven-obstacles.mjs?v=hangar-required-routes-1';
import {MINECART,isMinecartRider,minecartMuzzle} from './minecart-rider.mjs?v=hangar-required-routes-1';
import {hangarPressBottom} from './stage-seven-layout.mjs?v=hangar-required-routes-1';
import {drawHangarBulkhead,drawHangarCartTrack} from './stage-seven-route-art.mjs?v=hangar-required-routes-1';
import {ESCORT_DRONE_ASSET,drawEscortDrone} from './escort-drone.mjs?v=escort-drone-2';
import {HIVE_MOTION_ASSETS,drawHiveSlab,drawHiveAtmosphere,drawHiveSurfacePulse} from './stage-eight-atmosphere.mjs?v=fused-tissue-3';
import {HIVE_HAZARD_ASSETS,drawHiveChasm,drawHiveSlime,drawHiveSpike,drawHiveSlimeSplash} from './stage-eight-hazards.mjs?v=organic-motion-2';
import {ALIEN_CRAWLER_ASSET,drawAlienCrawler} from './alien-crawler.mjs?v=crawler-walk-1';
import {ALIEN_GUARDIAN_WALL_ASSET,alienGuardianArtBox,alienGuardianWallBox,liveAlienGuardian,drawAlienGuardianBody,drawAlienGuardianHead} from './stage-eight-guardian.mjs?v=guardian-flyers-1';
import {HIVE_BRAIN_ASSET,HIVE_RIB_ASSET,drawHiveBrainBoss} from './hive-brain.mjs?v=hive-four-ports-1';
import {HIVE_HATCHLING_ASSET,hiveBroodRemaining,hiveBroodHealth,hiveHatchlingFrame,drawHiveHatchling} from './hive-brood.mjs?v=hive-four-ports-1';
import {LARVA_HOP_ASSET,larvaHopFrame,drawLarvaHop} from './larva-hop.mjs?v=larva-hop-1';
import {GUARDIAN_FLYER_ASSET,guardianFlyerFrame,drawGuardianFlyer} from './guardian-flyer.mjs?v=guardian-flyers-1';
import {CEILING_PARASITE_ASSETS,ceilingParasiteFrame,whiteFloaterFrame,drawCeilingNests,drawCeilingCreature} from './ceiling-parasite.mjs?v=floor-parasites-1';
import {CEILING_STALKER_ASSET,ceilingStalkerFrame,drawCeilingStalker,drawStalkerRoofs} from './ceiling-stalker.mjs?v=ceiling-stalker-1';

export const STAGE_SEVEN_ASSETS=Object.freeze({
  cavern:'/games/contra2026/assets/stage7/alien-cavern-v1.webp',
  terrain:'/games/contra2026/assets/stage7/alien-terrain-v1.webp',
  guardian:'/games/contra2026/assets/stage7/alien-guardian-v1.webp',
  guardianWall:ALIEN_GUARDIAN_WALL_ASSET,
  guardianFlyer:GUARDIAN_FLYER_ASSET,
  crawler:ALIEN_CRAWLER_ASSET,
  ceilingStalker:CEILING_STALKER_ASSET,
  spitter:'/games/contra2026/assets/stage7/alien-spitter-v1.webp',
  sac:'/games/contra2026/assets/stage7/alien-sac-v1.webp',
  larva:LARVA_HOP_ASSET,
  hiveWall:'/games/contra2026/assets/stage7/alien-hive-wall-v1.webp',
  brain:HIVE_BRAIN_ASSET,
  brainRib:HIVE_RIB_ASSET,
  hiveHatchling:HIVE_HATCHLING_ASSET,
  ...HIVE_MOTION_ASSETS,
  ...HIVE_HAZARD_ASSETS,
  ...CEILING_PARASITE_ASSETS
});
export const HANGAR_ASSETS=Object.freeze({
  hangar:'/games/contra2026/assets/stage7/hangar-background-v1.webp',
  crusherClaw:'/games/contra2026/assets/stage7/hangar-crusher-claw-v1.webp',
  minecartBody:'/games/contra2026/assets/stage7/hangar-minecart-body-v1.webp',
  platformSteel:'/games/contra2026/assets/stage7/hangar-platform-steel-v1.webp',
  defenseGate:'/games/contra2026/assets/stage7/hangar-defense-gate-v1.webp',
  gateReactor:'/games/contra2026/assets/stage7/hangar-gate-reactor-v1.webp',
  gateMortar:'/games/contra2026/assets/stage7/hangar-gate-mortar-v1.webp',
  ironPlate:'/games/contra2026/assets/stage7/hangar-spiked-iron-plate-v1.webp',
  escortDrone:ESCORT_DRONE_ASSET
});
const mod=(n,d)=>((n%d)+d)%d;

/** The simulation owns all hit boxes; art uses the same world-space positions. */
export class StageSevenArt extends StageOneArt{
  static spitterBounds(e){
    const foot=e.t==='tur'?e.y+16:e.y;
    return {x:e.x-17,y:foot-32,w:34,h:32,foot};
  }
  constructor(options){super({...options,assets:options.hangar?HANGAR_ASSETS:STAGE_SEVEN_ASSETS});this.baseArt=options.baseArt;this.hdActors=this.baseArt.hdActors;}
  frame(sheet,name,w,h){return this.baseArt.frame(sheet,name,w,h);}
  backdrop(camera){
    const g=this.g;this.rect(0,0,384,216,'#090510');
    if(this.loaded.has('cavern')){
      const image=this.images.cavern,w=216*image.naturalWidth/image.naturalHeight,overlap=Math.min(70,w*.15);
      g.save();g.translate(-camera*.2,0);this.textureSpan(g,image,camera*.2,camera*.2+384,w,216,overlap);g.restore();
      drawHiveAtmosphere(this,camera,this.state.s8?.tissueTime??this.state.time??0,w,overlap);
    }
    const shade=g.createLinearGradient(0,0,0,216);shade.addColorStop(0,'rgba(3,2,9,.25)');shade.addColorStop(.65,'rgba(11,3,18,.06)');shade.addColorStop(1,'rgba(4,2,7,.7)');this.rect(0,0,384,216,shade);
  }
  floor(solids,camera){
    const g=this.g,slabs=solids.filter(s=>s.g&&!s.gone).sort((a,b)=>a.x-b.x);
    for(const s of solids){
      if(s.gone||s.wall||s.x+s.w<camera-10||s.x>camera+394)continue;
      const left=Math.max(s.x,camera-12),right=Math.min(s.x+s.w,camera+396);
      drawHiveSlab(this,s,left,right,this.state.s8?.tissueTime??this.state.time??0);
      drawHiveSurfacePulse(this,s,left,right,this.state.s8?.tissueTime??this.state.time??0);
      this.line(left,s.y+.5,right,s.y+.5,'rgba(242,128,152,.55)',.5);
    }
    for(let i=0;i<slabs.length-1;i++){
      const a=slabs[i].x+slabs[i].w,b=slabs[i+1].x;
      if(b>camera&&a<camera+384&&b>a)drawHiveChasm(this,a,b);
    }
  }
  enemy(e){
    if(e.t==='alienHead'&&!this.freezePainting)this.guardianStalk(e);
    let bounds,poseKey;
    if(e.t==='alienHead')bounds={...alienGuardianArtBox(e),foot:124};
    if(e.t==='guardianFlyer'||e.t==='whiteFloater'||e.t==='hiveHatchling')bounds={x:e.x-13,y:e.y-13,w:26,h:26,foot:e.y+9};
    if(e.t==='ceilingParasite')bounds={x:e.x-16,y:e.y-16,w:32,h:32,foot:e.y+13};
    if(e.t==='ceilingStalker')bounds={x:e.x-15,y:e.y-15,w:30,h:30,foot:e.y+8.5};
    if(e.t==='tur'||e.t==='snp'){
      const body=StageSevenArt.spitterBounds(e);
      bounds={x:body.x-3,y:body.y-3,w:body.w+6,h:body.h+10,foot:body.foot};
    }
    if(e.t==='larva')poseKey=larvaHopFrame(e);
    if(e.t==='guardianFlyer')poseKey=guardianFlyerFrame(e);
    if(e.t==='ceilingParasite')poseKey=ceilingParasiteFrame(e);
    if(e.t==='whiteFloater')poseKey=whiteFloaterFrame(e);
    if(e.t==='ceilingStalker')poseKey=ceilingStalkerFrame(e);
    if(e.t==='hiveHatchling')poseKey=hiveHatchlingFrame(e);
    if(drawFrozenEnemy(this,e,()=>this.enemy(e),{bounds,poseKey}))return;
    if(e.t==='alienHead'){drawAlienGuardianHead(this,e);return;}
    if(e.t==='guardianFlyer'){drawGuardianFlyer(this,e);return;}
    if(e.t==='ceilingParasite'||e.t==='whiteFloater'){drawCeilingCreature(this,e);return;}
    if(e.t==='ceilingStalker'){drawCeilingStalker(this,e);return;}
    if(e.t==='hiveHatchling'){drawHiveHatchling(this,e);return;}
    if(e.t==='run'&&drawAlienCrawler(this,e))return;
    if(e.t==='larva'&&drawLarvaHop(this,e))return;
    const g=this.g;
    if(e.t==='box')return super.enemy(e);
    const key=e.t==='run'?'crawler':e.t==='sac'?'sac':e.t==='larva'?'larva':'spitter';
    const image=this.images[key];
    g.save();if(e.flash>0)g.filter='brightness(1.8)';
    {
      const spitter=key==='spitter'?StageSevenArt.spitterBounds(e):null;
      const width=spitter?.w??(key==='crawler'?27:key==='larva'?15:25);
      const height=spitter?.h??(key==='crawler'?22:key==='larva'?13:25);
      const bottom=spitter?.foot??e.y,face=(e.vx||e.face||-1)<0?1:-1;
      g.translate(e.x,bottom);g.scale(face,1);
      if(this.loaded.has(key)){
        const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;
        g.drawImage(image,-w/2,-h,w,h);
      }
      else{this.rect(-width/2,-height,width,height,'#713955');this.disc(-width*.25,-height*.55,2,'#e8b4a6');}
    }
    g.restore();
  }
  guardianStalk(e){
    drawAlienGuardianBody(this,e);
  }
  hive(H){
    drawHiveBrainBoss(this,H);
  }
  hazards(S){
    if(!S)return;
    drawHiveSlime(this,S);
    for(const s of S.spikes||[])if(!s.dead)drawHiveSpike(this,s);
  }
  effects(effects){
    super.effects(effects.filter(f=>f.k!=='slimeSplash'));
    for(const f of effects)if(f.k==='slimeSplash'&&!f.dead)drawHiveSlimeSplash(this,f);
  }
  hud(G,options){
    const g=this.g;g.save();const shade=g.createLinearGradient(0,0,0,38);shade.addColorStop(0,'rgba(10,4,16,.96)');shade.addColorStop(1,'rgba(8,3,14,0)');this.rect(0,0,384,38,shade);
    this.playerHud(G,G.p,{x:HUD_PLAYER_X[0],role:StageOneArt.playerRole(options.online),inventory:G.inv,selection:G.sel,cooldown:G.nadeCd,infinite:options.settings.inf==='on',local:!options.guest});
    if(options.online&&G.p2)this.playerHud(G,G.p2,{x:HUD_PLAYER_X[1],blue:true,inventory:G.inv2,selection:G.sel2,cooldown:G.nadeCd2,infinite:options.settings.inf==='on',local:!!options.guest});
    else{this.hudText('第八关',332,4,'#f0dfef',7,'right');this.hudText('异形巢穴',332,17,'#d59dbf',5.8,'right');}
    this.hudText('最高分  '+String(Math.max(options.highScore||0,G.score)).padStart(6,'0'),192,5,'#d8c3d5',6,'center',90);
    if(G.hive?.active&&!G.hive.dead){const h=G.hive.open?G.hive.parts[2]:hiveBroodHealth(G.hive);this.hudText(G.hive.open?'母巢大脑':'孵化机关 '+hiveBroodRemaining(G.hive)+'/4',192,18,'#f0b2c5',5,'center',90);this.rect(157,26,70,4,'#321723');this.rect(158,27,68*Math.max(0,h.hp/h.max),2,'#ec6484');}
    const guardian=liveAlienGuardian(G.en);
    if(guardian&&alienGuardianWallBox(guardian).x<G.camX+350){this.hudText('洞穴守卫',192,18,'#f0b2c5',5,'center',90);this.rect(157,26,70,4,'#321723');this.rect(158,27,68*Math.max(0,guardian.hp/guardian.max),2,'#ec6484');}
    if(G.bannerT>0&&G.bannerText){this.rect(38,42,308,15,'rgba(19,8,20,.84)');this.hudText(G.bannerText,192,46,'#f4d0db',6.5,'center',294);}g.restore();
  }
  hangarBackdrop(camera){
    const g=this.g;this.rect(0,0,384,216,'#10171a');
    if(this.loaded.has('hangar')){const image=this.images.hangar,h=216,w=h*image.naturalWidth/image.naturalHeight;g.save();g.translate(-camera*.18,0);this.textureSpan(g,image,camera*.18,camera*.18+384,w,h,Math.min(50,w*.12));g.restore();}
    this.rect(0,0,384,216,'rgba(4,10,11,.26)');
    drawHangarAtmosphere(this,camera,this.state?.time||0);
    drawHangarRouteBackdrop(this,camera,this.state?.time||0);
  }
  hangarFloor(solids,camera){
    const g=this.g;for(const s of solids){if(s.gone||s.x+s.w<camera-20||s.x>camera+404)continue;
      if(s.cartRoof||s.climbWall){drawHangarBulkhead(this,s);continue;}
      const left=Math.max(s.x,camera-12),right=Math.min(s.x+s.w,camera+396),width=right-left;
      if(s.railing){
        const rail=g.createLinearGradient(0,s.y-13,0,s.y-10);rail.addColorStop(0,'#d5a66b');rail.addColorStop(.35,'#7b542f');rail.addColorStop(1,'#292923');
        this.rect(left,s.y-13,width,2,rail);this.line(left,s.y-10,right,s.y-10,'#2f3229',.6);
        for(let x=Math.ceil(left/27)*27;x<right;x+=27){this.rect(x,s.y-12,1.5,12,'#695335');this.line(x+.3,s.y-11,x+.3,s.y-1,'#b68d58',.5);}
      }
      if(s.ceiling){this.rect(left,s.y+s.h,width,2,'#070d10');for(let x=Math.ceil(left/12)*12;x<right;x+=12){this.rect(x,s.y+s.h-3,5,4,'#515c53');this.line(x,s.y+s.h-2,x+5,s.y+s.h-2,'#a7b29d',.5);}}
      if(this.loaded.has('platformSteel')){
        const image=this.images.platformSteel,tileH=40,tileW=tileH*image.naturalWidth/image.naturalHeight;
        g.save();g.beginPath();g.rect(left,s.y,width,s.h);g.clip();
        for(let x=Math.floor(left/tileW)*tileW;x<right;x+=tileW){
          g.drawImage(image,x,s.y,tileW,tileH);
          // Raised foundations continue with the lower armor panels, without
          // adding another warning stripe partway down the same slab.
          for(let y=s.y+tileH;y<s.y+s.h;y+=28)g.drawImage(image,0,image.naturalHeight*.3,image.naturalWidth,image.naturalHeight*.7,x,y,tileW,28);
        }
        this.line(left,s.y+.15,right,s.y+.15,'rgba(240,194,124,.6)',.5);
        if(!s.g){this.rect(left,s.y+s.h-1,width,1,'#101a1b');this.line(left,s.y+s.h-1.5,right,s.y+s.h-1.5,'#869184',.6);}
        for(const x of [s.x,s.x+s.w-2.5]){this.rect(x,s.y+1,2.5,s.h-1,'#3b423c');this.line(x+.4,s.y+1,x+.4,s.y+s.h-1,'#b0a17c',.5);this.disc(x+1.3,s.y+3,.55,'#d3bc8d');}
        g.restore();continue;
      }
      const steel=g.createLinearGradient(0,s.y,0,s.y+Math.max(10,s.h));steel.addColorStop(0,'#778078');steel.addColorStop(.16,'#414c49');steel.addColorStop(.38,'#202b2c');steel.addColorStop(.62,'#64706d');steel.addColorStop(1,'#171f20');
      this.rect(left,s.y,width,s.h,steel);this.rect(left,s.y,width,3,'#b46a28');this.line(left,s.y+.6,right,s.y+.6,'#f7bc68',.6);
      g.save();g.beginPath();g.rect(left,s.y,width,Math.min(5,s.h));g.clip();for(let x=Math.floor(left/12)*12;x<right+12;x+=12){this.line(x,s.y+5,x+7,s.y,'#2a302c',2);this.line(x+2,s.y+5,x+9,s.y,'rgba(255,210,130,.32)',.5);}g.restore();
      this.rect(left,s.y+5,width,1,'#121b1b');this.rect(left,s.y+6,width,1,'#d5d4b9');this.rect(left,s.y+8,width,1,'#161e1e');
      for(let x=Math.floor(left/25)*25;x<right;x+=25){this.rect(x+1,s.y+4,2,6,'#181d1c');this.disc(x+2,s.y+6,.65,'#e5b67a');}
      if(s.g)for(let x=Math.floor(left/25)*25;x<right;x+=25){this.rect(x+2,s.y+13,21,24,'#131b1e');this.rect(x+3,s.y+13,19,1,'#737c73');this.rect(x+4,s.y+15,17,19,'#38403c');this.rect(x+5,s.y+17,15,15,'#222d2c');this.line(x+5,s.y+32,x+18,s.y+18,'rgba(128,144,132,.35)',.7);this.disc(x+7,s.y+20,.6,'#d8b083');this.disc(x+18,s.y+31,.6,'#d8b083');}
    }
  }
  hangarPresses(presses,camera){
    const g=this.g;for(const q of presses){if(q.x<camera-24||q.x>camera+408)continue;const bottom=hangarPressBottom(q);
      const mount=g.createLinearGradient(0,q.top-5,0,q.top+2);mount.addColorStop(0,'#0c1213');mount.addColorStop(.35,'#818a7e');mount.addColorStop(.55,'#414c47');mount.addColorStop(1,'#171d1d');
      this.rect(q.x-11,q.top-5,22,7,'#121819');this.rect(q.x-10,q.top-4,20,5,mount);this.line(q.x-9,q.top-3,q.x+9,q.top-3,'rgba(233,229,198,.5)',.5);
      for(const dx of [-8,8]){this.disc(q.x+dx,q.top-1.3,.9,'#181f1e');this.disc(q.x+dx-.2,q.top-1.5,.35,'#c0b6a1');}
      const rod=g.createLinearGradient(q.x-5,0,q.x+5,0);rod.addColorStop(0,'#503522');rod.addColorStop(.25,'#a46a35');rod.addColorStop(.42,'#f2c183');rod.addColorStop(.58,'#bc8650');rod.addColorStop(.82,'#574031');rod.addColorStop(1,'#211c1a');
      this.rect(q.x-5,q.top,10,Math.max(2,bottom-q.top-7),rod);
      for(let y=q.top+8;y<bottom-9;y+=13){this.rect(q.x-5.5,y,11,1,'#403328');this.rect(q.x-4.5,y+1,9,.6,'rgba(255,218,155,.45)');}
      if(q.st==='warn'){g.save();g.globalAlpha=.5+.25*Math.sin((this.state?.t||0)*.35);this.light(q.x,bottom-5,13,'rgba(255,155,60,.45)');g.restore();}
      if(this.loaded.has('crusherClaw')){
        const image=this.images.crusherClaw,w=18,h=w*image.naturalHeight/image.naturalWidth;
        g.drawImage(image,q.x-w/2,bottom-h,w,h);
      }else{
        const head=g.createLinearGradient(0,bottom-9,0,bottom);head.addColorStop(0,'#313a36');head.addColorStop(.2,q.st==='warn'?'#ffb649':'#c18b4e');head.addColorStop(.55,'#624329');head.addColorStop(1,'#262522');
        this.rect(q.x-9,bottom-8,18,5,head);this.rect(q.x-8,bottom-8,16,.8,'#f2d3a3');this.disc(q.x-6,bottom-5,.7,'#ead4ae');this.disc(q.x+6,bottom-5,.7,'#ead4ae');
        g.fillStyle='#d4b58d';for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(q.x+i*5-2,bottom-3);g.lineTo(q.x+i*5+2,bottom-3);g.lineTo(q.x+i*5,bottom);g.closePath();g.fill();}
      }
    }
  }
  hangarGate(gate){
    if(!gate)return;const x=gate.x,g=this.g,camera=this.state.camX;
    if(x<camera+404){
      this.rect(x+40,0,60,176,'#11191b');
      if(this.loaded.has('defenseGate')){
        const image=this.images.defenseGate,scale=176/image.naturalHeight,w=image.naturalWidth*scale;
        g.drawImage(image,x,0,w,176);
        if(gate.dead){
          // Only the shutter moves inside its fixed frame and hydraulic rails.
          const sx=428,sy=838,sw=294,sh=864,dx=x+sx*scale,dy=sy*scale,dw=sw*scale,dh=sh*scale;
          const open=Math.max(0,Math.min(1,(2.5-gate.deadT)/1.3));
          g.save();g.beginPath();g.rect(dx,dy,dw,dh);g.clip();
          const depth=g.createLinearGradient(dx,0,dx+dw,0);depth.addColorStop(0,'#03090a');depth.addColorStop(.5,'#0b1415');depth.addColorStop(1,'#010506');this.rect(dx,dy,dw,dh,depth);
          g.drawImage(image,sx,sy,sw,sh,dx,dy-dh*open,dw,dh);g.restore();
        }
      }else{
        this.rect(x,0,90,176,'#373f3b');for(let y=0;y<176;y+=24){this.rect(x+2,y,84,2,'#788177');this.disc(x+7,y+6,.7,'#b8a27b');}
        this.rect(x+36,79,36,95,'#3b2b1c');for(let y=83;y<174;y+=6)this.line(x+38,y,x+70,y,'#a07643',.6);
      }
    }
    for(const p of gate.parts){
      if(p.x+p.w<camera-20||p.x>camera+404)continue;
      const core=p.k==='core',key=core?'gateReactor':'gateMortar',image=this.images[key],dead=p.hp<=0,cx=p.x+p.w/2;
      if(core&&!dead){g.save();g.globalAlpha=.24+.1*Math.sin((this.state.time||0)*4);this.light(cx,p.y+p.h/2,23,'rgba(255,125,33,.42)');g.restore();}
      g.save();if(dead)g.filter='brightness(.32) saturate(.2)';else if(p.flash>0)g.filter='brightness(1.9)';
      if(this.loaded.has(key)){
        const scale=Math.min((core?p.w+2:24)/image.naturalWidth,(core?p.h+2:23)/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;
        g.drawImage(image,cx-w/2,core?p.y+(p.h-h)/2:p.y+21-h,w,h);
      }else{
        this.rect(p.x,p.y,p.w,p.h,'#4e5b55');this.disc(cx,p.y+p.h/2,core?7:4,dead?'#111b1c':'#e19648');
      }
      g.restore();
      if(dead){
        const cy=p.y+p.h*(core?.5:.45);this.disc(cx,cy,core?6:3.5,'#0c1111');
        for(const d of [-1,1]){this.line(cx,cy,cx+d*(core?11:6),cy-d*4,'#0b1212',1.4);this.line(cx+d*3,cy+d*2,cx+d*6,cy+d*7,'#715c42',.6);}
      }
      if(!core&&!dead&&!gate.dead&&p.shotFlash>0){
        const age=.35-p.shotFlash,y=p.y-1;
        if(age<.1){this.light(cx,y,9,'rgba(255,153,41,.65)');g.fillStyle='#ffdf87';g.beginPath();g.moveTo(cx-2,y);g.lineTo(cx-1,y-7);g.lineTo(cx,y-4);g.lineTo(cx+1,y-9);g.lineTo(cx+2,y);g.closePath();g.fill();}
        g.save();g.globalAlpha=Math.max(0,1-age/.35)*.3;for(let i=0;i<3;i++){const yy=y-2-age*(16+i*8),xx=cx+Math.sin(i+age*3)*(1+age*5);this.light(xx,yy,2+age*12,'rgba(161,169,148,.5)');}g.restore();
      }
    }
  }
  hangarCartRider(p,role){
    const g=this.g,pose=p.cartDuck?'prone':p.ay<-.85?'up':p.ay<-.2?'diagonalUp':'idle',frame=this.hdActors.frame(role,pose,this.scale);
    const shift=p.cartDuck?0:frame?MINECART.waist-frame.waist:16;
    g.save();g.translate(p.x,p.y);g.scale(p.face||1,1);g.beginPath();g.rect(-30,-52,60,54);g.clip();g.translate(0,shift);
    const drawn=this.hdActors.draw(g,{...p,artPose:pose,spin:false,vx:0,onGround:false,statusTime:this.state.time||0},role,this.scale);
    if(!drawn){this.disc(0,-27,3,'#e7a46d');this.rect(-3,-24,6,8,'#c48454');this.rect(3,-22,11,2,'#abb1a8');}
    g.restore();
    if(p.flashT>0){const muzzle=minecartMuzzle(p);this.muzzle(muzzle.x,muzzle.y);}
  }
  hangarCart(e){
    const g=this.g;g.save();g.translate(e.x,e.y);if(e.flash>0)g.filter='brightness(1.8)';
    // Axles and leaf springs sit behind the hopper; wheel contact stays at y=0.
    this.rect(-10,-10,20,3,'#1a2324');this.line(-9,-9,9,-9,'#8b8f7f',.8);
    for(const dx of [-7,7]){
      this.rect(dx-1.6,-12,3.2,8,'#263132');this.disc(dx,-8,1.5,'#7c7c69');
      for(let j=0;j<3;j++)this.line(dx-3,-7+j*.6,dx+3,-7+j*.6,j===1?'#958d72':'#323b39',.5);
    }
    if(this.loaded.has('minecartBody')){
      const image=this.images.minecartBody,scale=Math.min(26/image.naturalWidth,14/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;
      g.drawImage(image,-w/2,-22,w,h);
    }else{
      const body=g.createLinearGradient(0,-22,0,-9);body.addColorStop(0,'#e3a45b');body.addColorStop(.3,'#b26d2b');body.addColorStop(1,'#4e301e');
      g.fillStyle=body;g.beginPath();g.moveTo(-12,-22);g.lineTo(12,-22);g.lineTo(8,-9);g.lineTo(-8,-9);g.closePath();g.fill();this.rect(-9,-21,18,2,'#303a36');
    }
    for(const dx of [-7,7]){
      const cy=-3.8,r=3.8;this.disc(dx,cy,r,'#111a1c');
      const rim=g.createRadialGradient(dx-.8,cy-1,.2,dx,cy,r);rim.addColorStop(0,'#b4b5a1');rim.addColorStop(.35,'#596d68');rim.addColorStop(.7,'#2a3d3d');rim.addColorStop(.88,'#96a094');rim.addColorStop(1,'#202c2c');this.disc(dx,cy,r-.3,rim);
      g.save();g.translate(dx,cy);g.rotate(e.wheel||0);for(let spoke=0;spoke<5;spoke++){const a=spoke*Math.PI*2/5;this.line(Math.cos(a),Math.sin(a),Math.cos(a)*2.7,Math.sin(a)*2.7,'#b4aa8d',.6);}g.restore();
      this.disc(dx,cy,1.2,'#172b2e');this.disc(dx-.15,cy-.2,.65,'#c4b68b');
    }
    g.restore();
  }
  hangarSpikeWall(e){
    const g=this.g,box=hangarPlateBox(e),{x,y,w,h}=box;if(h<=0)return;
    this.rect(e.x-24,e.y-2,58,2,'#111b1c');this.line(e.x-23,e.y-1.5,e.x+33,e.y-1.5,'#ad8c56',.7);
    g.save();g.beginPath();g.rect(x,y,w,h);g.clip();if(e.flash>0)g.filter='brightness(1.8)';
    if(this.loaded.has('ironPlate')){
      // The rigid plate rises out of the floor at full size, rather than stretching.
      g.drawImage(this.images.ironPlate,x,y,w,HANGAR_PLATE.height);
    }else{
      const metal=g.createLinearGradient(x,0,x+w,0);metal.addColorStop(0,'#71431c');metal.addColorStop(.35,'#bd772d');metal.addColorStop(.75,'#5c3922');metal.addColorStop(1,'#202a28');
      this.rect(e.x-18,y,50,HANGAR_PLATE.height,metal);for(let yy=y+16;yy<y+HANGAR_PLATE.height-8;yy+=17){this.rect(e.x-15,yy-3,36,6,'#66513a');g.fillStyle='#c9b28b';g.beginPath();g.moveTo(e.x-17,yy-3);g.lineTo(x,yy);g.lineTo(e.x-17,yy+3);g.closePath();g.fill();}
    }
    g.filter='none';if(e.hp<e.max*.5){this.line(e.x+2,y+h*.3,e.x+11,y+h*.5,'#201d17',1.4);this.line(e.x+11,y+h*.5,e.x+6,y+h*.66,'#171c19',1.4);this.line(e.x+3,y+h*.3,e.x+12,y+h*.5,'rgba(232,168,85,.35)',.5);}
    g.restore();
  }
  renderHangar(destination,G,options){
    this.prepare(destination);this.state=G;if(this.baseArt.scale!==this.scale){this.baseArt.scale=this.scale;this.baseArt.cache.clear();this.baseArt.terrainCache.clear();this.hdActors.clear();}
    const g=this.g,camera=this.snap(G.camX);this.hangarBackdrop(camera);
    if(G.mode==='intro'){this.rect(0,0,384,216,'rgba(4,7,9,.7)');this.hudText('第七关',192,55,'#ffead0',17,'center');this.hudText('机械机库',192,84,'#e6a15b',9,'center');this.actor({x:192,y:145,face:1,anim:0,onGround:true},StageOneArt.playerRole(options.online));this.hudText('避开尖刺 · 突破防御大门',192,166,'#e8c8a2',6,'center');this.present(destination);return;}
    const shake=options.settings.shake==='on'&&G.shake>0?Math.sin(G.t*9)*Math.min(2,G.shake):0;
    g.save();g.translate(-camera+shake,0);this.hangarFloor(options.solids,camera);drawHangarCartTrack(this,camera);this.hangarGate(G.gate);this.hangarPresses(G.s7.presses,camera);
    for(const e of G.en)if(!e.dead&&e.t!=='cart'&&e.x>camera-50&&e.x<camera+434){if(e.t==='spikeWall')this.hangarSpikeWall(e);else StageOneArt.prototype.enemy.call(this,e);}
    for(const [i,p]of options.players.entries())if(isMinecartRider(p))this.hangarCartRider(p,StageOneArt.playerRole(options.online,i));
    for(const e of G.en)if(!e.dead&&e.t==='cart'&&e.x>camera-50&&e.x<camera+434)this.hangarCart(e);
    for(const it of G.items)if(!it.dead)this.capsule(it.x,it.y-5,it.kind,false);for(const pod of G.pods)if(!pod.dead)this.capsule(pod.x,pod.y,pod.kind,true,pod);
    for(const [i,p] of options.players.entries()){
      if(!isMinecartRider(p))this.actor(p,StageOneArt.playerRole(options.online,i));
      drawEscortDrone(this,p);
    }
    this.grenades(G.gr,G.t);this.bullets(G.pb);this.bullets(G.eb,true);this.effects(G.fx);g.restore();
    this.playerHud(G,G.p,{x:HUD_PLAYER_X[0],role:StageOneArt.playerRole(options.online),inventory:G.inv,selection:G.sel,cooldown:G.nadeCd,infinite:options.settings.inf==='on',local:!options.guest});
    if(options.online&&G.p2)this.playerHud(G,G.p2,{x:HUD_PLAYER_X[1],blue:true,inventory:G.inv2,selection:G.sel2,cooldown:G.nadeCd2,infinite:options.settings.inf==='on',local:!!options.guest});
    else{this.hudText('第七关',332,4,'#ffe6c6',7,'right');this.hudText('机械机库',332,17,'#e7ac68',5.8,'right');}
    this.hudText('最高分  '+String(Math.max(options.highScore||0,G.score)).padStart(6,'0'),192,5,'#e8d8c5',6,'center',90);
    if(G.gate.active&&!G.gate.dead){const h=G.gate.parts[2];this.hudText('防御大门',192,18,'#ffb66c',5,'center');this.rect(157,26,70,4,'#302321');this.rect(158,27,68*Math.max(0,h.hp/h.max),2,'#ed8a39');}
    if(G.bannerT>0&&G.bannerText)this.hudText(G.bannerText,192,46,'#f4d0aa',6.5,'center',294);
    if(G.flashT>0){g.save();g.globalAlpha=Math.min(.6,G.flashT*2);this.rect(0,0,384,216,'#fff5e9');g.restore();}this.present(destination);
  }
  render(destination,G,options){
    if(G.stage===7)return this.renderHangar(destination,G,options);
    this.prepare(destination);this.state=G;
    if(this.baseArt.scale!==this.scale){this.baseArt.scale=this.scale;this.baseArt.cache.clear();this.baseArt.terrainCache.clear();this.hdActors.clear();}
    const g=this.g,camera=this.snap(G.camX);this.backdrop(camera);
    if(G.mode==='intro'){
      this.rect(0,0,384,216,'rgba(5,2,10,.65)');this.hudText('第八关',192,55,'#f7e9f0',17,'center');this.hudText('异形巢穴',192,84,'#dd9abd',9,'center');
      this.actor({x:192,y:145,face:1,anim:0,onGround:true},StageOneArt.playerRole(options.online));this.hudText('深入巢穴 · 摧毁母巢大脑',192,166,'#e2bbd0',6,'center');this.present(destination);return;
    }
    const shake=options.settings.shake==='on'&&G.shake>0?Math.sin(G.t*9)*Math.min(2,G.shake):0;
    g.save();g.translate(-camera+shake,0);drawStalkerRoofs(this,camera,G.s8?.tissueTime??G.time??0);drawCeilingNests(this,camera);this.floor(options.solids,camera);this.hive(G.hive);this.hazards(G.s8);
    for(const e of G.en)if(!e.dead&&e.x>camera-100&&e.x<camera+484)this.enemy(e);
    for(const it of G.items)if(!it.dead)this.capsule(it.x,it.y-5,it.kind,false);
    for(const pod of G.pods)if(!pod.dead)this.capsule(pod.x,pod.y,pod.kind,true,pod);
    for(const [i,p]of options.players.entries())this.actor(p,StageOneArt.playerRole(options.online,i));
    this.grenades(G.gr,G.t);this.bullets(G.pb);this.bullets(G.eb,true);this.effects(G.fx);g.restore();this.hud(G,options);
    if(G.flashT>0){g.save();g.globalAlpha=Math.min(.6,G.flashT*2);this.rect(0,0,384,216,'#fff1f1');g.restore();}this.present(destination);
  }
}
