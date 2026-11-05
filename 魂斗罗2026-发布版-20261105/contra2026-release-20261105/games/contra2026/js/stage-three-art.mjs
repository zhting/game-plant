import { HUD_PLAYER_X } from './hud-layout.mjs';
import { StageOneArt } from './stage-one-art.mjs?v=single-enemy-rifle-1';
import { STAGE_THREE, WATERFALL_GATE, FLAME_BRIDGES, flameJetState, flameJetPositions, waterfallNodesAlive } from './stage-three-layout.mjs?v=crossing-flames-1';
import { WATERFALL_ARMS, waterfallArmPose } from './stage-three-arms.mjs?v=boss-detail-1';
import { drawStageThreeWaterfall } from './stage-three-waterfall.mjs?v=boss-detail-1';
import { FLAME_JET_ASSET, drawFlameJet } from './flame-jet-art.mjs?v=multi-stage-polish-1';
import {IMPACT_HELMET_ASSET} from './impact-helmet-art.mjs?v=helmet-detail-2';
import {drawFrozenEnemy} from './enemy-freeze-art.mjs?v=enemy-freeze-2';
import {stageThreeRockWobble} from './stage-three-rockfall.mjs?v=wall-rock-cycle-1';

export const STAGE_THREE_ASSETS=Object.freeze({enemyUniform:'/games/contra2026/assets/stage3/enemy-waterfall-upper.webp',enemyHovercraft:'/games/contra2026/assets/stage3/enemy-hovercraft-v1.webp',guardian:'/games/contra2026/assets/stage3/waterfall-guardian-v3.webp',guardianWreck:'/games/contra2026/assets/stage3/waterfall-guardian-v3-wreck.webp',flameJets:FLAME_JET_ASSET,armKit:'/games/contra2026/assets/stage3/guardian-arm-kit.webp',ledge:'/games/contra2026/assets/stage3/mossy-rock-ledge.webp',waterfall:'/games/contra2026/assets/stage3/waterfall-layers.webp',boulderTurns:'/games/contra2026/assets/stage3/boulder-turns.webp',floatingStone:'/games/contra2026/assets/stage3/floating-stone.webp',supplyHatch:'/games/contra2026/assets/stage3/supply-hatch.webp',impactHelmet:IMPACT_HELMET_ASSET});
export const SUPPLY_HATCH_ART=Object.freeze({frame:[18,58,595,546],shutter:[632,165,372,397],opening:[137,159,329,346],width:24});
// The new atlas is wide by construction. Keep the stationary body registered
// and animate only the jaw, so imperfect generated row alignment cannot move
// the door, shoulders or crown when the mouth opens.
export const GUARDIAN_ART=Object.freeze({width:1254,height:638,openY:638,openHeight:616,
  jaw:Object.freeze({x:627,y:255,rx:170,ry:125})});
export function guardianRect(){
  const scale=Math.min(WATERFALL_GATE.w/GUARDIAN_ART.width,WATERFALL_GATE.h/GUARDIAN_ART.height);
  const w=GUARDIAN_ART.width*scale,h=GUARDIAN_ART.height*scale;
  return{x:WATERFALL_GATE.x+(WATERFALL_GATE.w-w)/2,y:WATERFALL_GATE.y+WATERFALL_GATE.h-h,w,h};
}
const ARM_PARTS=Object.freeze({joint:[66,72,598,583],claw:[761,27,647,620],socket:[1487,31,653,649]});
// Actual alpha bounds of the approved rounded shelf; the walking lip is 14%
// below the back of the turf, so the shallow top plane sits behind the feet.
const LEDGE_ART=Object.freeze({bounds:Object.freeze([34,164,1713,580]),cap:360,walk:.14});
// The video platform has a projecting flat cap and a clustered, tapering belly.
// Its visible top plane sits behind the unchanged horizontal support surface.
const FLOATING_STONE_ART=Object.freeze({bounds:Object.freeze([78,228,1463,666]),height:24,walk:.15});
const noise=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return((n^(n>>>16))>>>0)/4294967296;};
const mod=(n,d)=>((n%d)+d)%d;

/** Shares HD actors/facilities and adds the waterfall guardian and rounded shelves. */
export class StageThreeArt extends StageOneArt{
  constructor(options){super({...options,assets:STAGE_THREE_ASSETS});this.baseArt=options.baseArt;this.hdActors=this.baseArt.hdActors;}
  frame(sheet,name,w,h){return this.baseArt.frame(sheet,name,w,h);}
  waterfall(cy,tick,solids){drawStageThreeWaterfall(this,cy,tick,solids);}
  stone(x,y,w,h,gray=false){
    if(h<=0)return;const g=this.g,image=this.baseArt.images.rock;
    this.rect(x,y,w,h,gray?'#32383c':'#514511');
    if(!this.baseArt.loaded.has('rock'))return;
    g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
    g.filter=gray?'grayscale(1) brightness(.88) contrast(1.13)':'saturate(.78) brightness(.8)';
    for(let yy=Math.floor(y/192)*192;yy<y+h;yy+=192)for(let xx=Math.floor(x/192)*192;xx<x+w;xx+=192)g.drawImage(image,xx,yy,192,192);
    g.restore();
  }
  ledge(s){
    const g=this.g,gray=s.y<=STAGE_THREE.stoneLine;
    if(s.drift){
      this.floatingStone(s);return;
    }
    if(s.flameBridge){this.bridge(s);return;}
    const w=s.w+4,h=Math.max(42,s.h+8),x=s.x-2,y=s.y-h*LEDGE_ART.walk;
    if(!s.summit){
      g.save();g.translate(s.x+s.w*.5,y+h+1);g.scale(1,.1);
      const r=s.w*.51,shadow=g.createRadialGradient(0,0,1,0,0,r);
      shadow.addColorStop(0,'rgba(1,18,31,.28)');shadow.addColorStop(1,'rgba(1,18,31,0)');
      g.fillStyle=shadow;g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.fill();g.restore();
    }
    const frame=this.ledgeFrame(w,h,gray);
    if(frame)g.drawImage(frame,x,y,w,h);
    else{
      g.save();g.beginPath();g.roundRect(x,y+3,w,h-3,8);g.fillStyle=gray?'#535b5d':'#6d6031';g.fill();
      g.beginPath();g.roundRect(x,y,w,10,4);g.fillStyle='#638729';g.fill();g.restore();
    }
  }
  floatingStone(s){
    if(!this.loaded.has('floatingStone')){this.boulder(s.x+s.w/2,s.y+6,s.w,18,0,false);return;}
    const {bounds,height,walk}=FLOATING_STONE_ART;
    this.g.drawImage(this.images.floatingStone,...bounds,s.x-1,s.y-height*walk,s.w+2,height);
  }
  ledgeFrame(w,h,gray){
    if(!this.loaded.has('ledge'))return null;
    const key=`shelf:${w}:${h}:${gray}:${this.scale}`;
    if(this.cache.has(key))return this.cache.get(key);
    const canvas=this.createCanvas();canvas.width=Math.ceil(w*this.scale);canvas.height=Math.ceil(h*this.scale);
    const g=canvas.getContext('2d'),[sx,sy,sw,sh]=LEDGE_ART.bounds;
    // Keep the rounded end stones at their natural proportions. Only the broad
    // central strata stretch, with adjacent source slices sharing every edge.
    const cap=Math.min(canvas.width*.24,canvas.height*LEDGE_ART.cap/sh);
    const paint=ctx=>{
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      ctx.drawImage(this.images.ledge,sx,sy,LEDGE_ART.cap,sh,0,0,cap,canvas.height);
      ctx.drawImage(this.images.ledge,sx+LEDGE_ART.cap,sy,sw-LEDGE_ART.cap*2,sh,cap,0,canvas.width-cap*2,canvas.height);
      ctx.drawImage(this.images.ledge,sx+sw-LEDGE_ART.cap,sy,LEDGE_ART.cap,sh,canvas.width-cap,0,cap,canvas.height);
    };
    paint(g);
    if(gray){
      const stone=this.createCanvas();stone.width=canvas.width;stone.height=canvas.height;
      const rock=stone.getContext('2d');rock.filter='grayscale(1) brightness(.91)';paint(rock);rock.filter='none';
      // The summit changes the stone palette, retaining the living green turf
      // and roots; a soft material transition avoids a horizontal color seam.
      rock.globalCompositeOperation='destination-in';
      const mask=rock.createLinearGradient(0,canvas.height*.31,0,canvas.height*.46);
      mask.addColorStop(0,'rgba(0,0,0,0)');mask.addColorStop(1,'#000');rock.fillStyle=mask;rock.fillRect(0,0,stone.width,stone.height);
      g.drawImage(stone,0,0);
    }
    this.cache.set(key,canvas);return canvas;
  }
  bridge(s){
    const g=this.g;
    this.rect(s.x,s.y,s.w,8,'#111a22');this.rect(s.x,s.y,s.w,1.4,'#d1d9d8');
    this.rect(s.x,s.y+6.4,s.w,1.4,'#8e9fa3');
    for(let x=s.x+4;x<s.x+s.w-3;x+=3){this.rect(x,s.y+2,1.3,4.3,'#77898d');this.rect(x+.4,s.y+2,.45,2,'#d5dcd7');}
    for(let x=s.x;x<=s.x+s.w-2;x+=26){this.rect(x,s.y-1,4.5,10,'#aebbbd');this.rect(x+.5,s.y+2,3.4,3.5,'#353f44');this.disc(x+2.2,s.y+3.5,.85,'#ae452d');}
    for(const u of [.23,.77]){
      const x=s.x+s.w*u;
      this.rect(x-6,s.y+8,12,3,'#6c4436');this.rect(x-7,s.y+9,3,2,'#cab096');
      this.rect(x+4,s.y+9,3,2,'#cab096');
    }
  }
  flames(time){
    const g=this.g;
    for(const bridge of FLAME_BRIDGES){
      if(bridge.y<this.state.camY-32||bridge.y>this.state.camY+236)continue;
      const fire=flameJetState(time,bridge.phase);
      for(const [i,x] of flameJetPositions(bridge,time).entries()){
        drawFlameJet(g,this.loaded.has('flameJets')?this.images.flameJets:null,
          x,bridge.y,fire,time,bridge.phase+i*7);
      }
    }
  }
  enemy(e){
    const freezeBounds=e.t==='waterAmbush'?{bounds:{x:e.x-28,y:e.y-40,w:56,h:56,foot:e.y}}:{};
    if(e.t!=='box'&&drawFrozenEnemy(this,e,()=>this.enemy(e),freezeBounds))return;
    if(e.t==='waterAmbush'){this.waterAmbush(e);return;}
    if(e.t==='box'){this.supplyWindow(e);return;}
    if(e.t==='rock'){
      this.fallingBoulder(e);return;
    }
    super.enemy(e);
  }
  waterAmbush(e){
    const g=this.g,t=this.state.time||0,x=e.x,y=e.y,w=52,h=w*167/1063;
    // The craft's upper surface and the soldier's boot anchor use the same y.
    // Thruster glow flickers without moving either part or its hitbox.
    if(!(this.state.freezeT>0)){
      g.save();g.globalAlpha=.45+.15*Math.sin(t*12);
      for(const dx of [-11,11])this.light(x+dx,y+h-1,5,'rgba(81,198,255,.40)');
      g.restore();
    }
    if(this.loaded.has('enemyHovercraft'))g.drawImage(this.images.enemyHovercraft,x-w/2,y,w,h);
    else{
      this.rect(x-21,y,42,5,'#303d3d');this.rect(x-16,y,32,1.2,'#a7aa94');
      this.rect(x-13,y+5,5,2,'#76d9ef');this.rect(x+8,y+5,5,2,'#76d9ef');
    }
    // Keep the full legs and boots visible; trim the horizontal rifle barrel
    // above the waist so the existing soldier can carry the raised gun.
    g.save();g.beginPath();g.rect(x-40,y-40,49,25);g.rect(x-40,y-15,80,16);g.clip();
    this.actor({...e,t:'snp',y,face:1,ay:-1,onGround:true,vx:0},'enemy',true);g.restore();
    g.save();
    this.line(x+7,y-19,x+7,y-35,'#111a19',3);
    this.line(x+6.5,y-20,x+6.5,y-34,'#84958b',.8);
    this.rect(x+5.2,y-35.5,3.6,2,'#253632');
    if(e.warning>0){g.globalAlpha=.5+.35*Math.sin(t*20);this.disc(x+7,y-35,2.6,'#ffb65b');}
    if(e.shotFlash>0)this.muzzle(x+7,y-35);
    g.restore();
  }
  supplyWindow(e){
    if(!this.loaded.has('supplyHatch'))return this.supplyWindowFallback(e);
    const g=this.g,image=this.images.supplyHatch,art=SUPPLY_HATCH_ART,[sx,sy,sw,sh]=art.frame,scale=art.width/sw,w=art.width,h=sh*scale,x=e.x-w/2,y=e.y+4-h;
    const [ox,oy,ow,oh]=art.opening,ax=x+(ox-sx)*scale,ay=y+(oy-sy)*scale,aw=ow*scale,ah=oh*scale;
    const timer=Number.isFinite(e.st)?e.st:e.open?1.2:1.5,opening=Math.max(0,Math.min(1,e.open?(1.6-timer)/.22:1-(1.8-timer)/.2));
    g.save();if(e.flash>0)g.filter='brightness(1.6) saturate(.6)';g.drawImage(image,sx,sy,sw,sh,x,y,w,h);
    if(opening<1){
      g.save();g.beginPath();g.rect(ax,ay,aw,ah);g.clip();g.drawImage(image,...art.shutter,ax,ay-opening*ah,aw,ah);g.restore();
    }
    if(opening>.75)this.hudText(e.item.toUpperCase(),ax+aw/2,ay+ah*.45,'#fff0c5',5.7,'center',aw*.65);
    g.restore();
  }
  supplyWindowFallback(e){
    const g=this.g,x=e.x-12,y=e.y-14,w=24,h=18,time=this.state.time||0;
    const face=()=>{g.beginPath();g.moveTo(x+2,y);g.lineTo(x+w-2,y);g.lineTo(x+w,y+2);g.lineTo(x+w,y+h-2);g.lineTo(x+w-2,y+h);g.lineTo(x+2,y+h);g.lineTo(x,y+h-2);g.lineTo(x,y+2);g.closePath();};
    g.save();this.rect(x+1.1,y+1.4,w+1.4,h+.8,'rgba(1,7,7,.75)');
    const edge=g.createLinearGradient(x,y,x+w,y+h);edge.addColorStop(0,'#71858a');edge.addColorStop(1,'#263236');this.rect(x+1.6,y+2,w,h,edge);
    face();const silver=g.createLinearGradient(0,y,0,y+h);silver.addColorStop(0,'#f0eee0');silver.addColorStop(.2,'#b5c0be');silver.addColorStop(.57,'#788888');silver.addColorStop(1,'#3e4b50');g.fillStyle=silver;g.fill();g.strokeStyle='#233236';g.lineWidth=.7;g.stroke();
    this.line(x+2,y+.8,x+w-2,y+.8,'#f6f2de',.65);this.line(x+.8,y+2,x+.8,y+h-2,'#d4dfd8',.65);
    this.rect(x+3,y+2.4,18,13.3,'#28383c');this.rect(x+3.8,y+3.2,16.4,11.4,'#090f12');
    this.line(x+4,y+3.3,x+19.9,y+3.3,'#45565a',.9);this.line(x+4.1,y+14.5,x+20,y+14.5,'#d1d8ce',.7);
    // The supply remains in a deep recess while a ribbed shutter slides upward.
    this.rect(x+7,y+5.5,10,7.5,'#3f1918');this.disc(e.x,y+9.2,3.8,'#7c2822');this.disc(e.x-.7,y+8.5,2.5,'#dc5a3d');
    this.rect(x+6,y+5,1,8,'#aab5ae');this.rect(x+17,y+5,1,8,'#677c7c');
    for(const dx of [-2,2]){this.rect(e.x+dx-.4,y+5.7,.8,1.1,'#e2b088');this.rect(e.x+dx-.4,y+11.2,.8,1.1,'#e2b088');}
    const timer=Number.isFinite(e.st)?e.st:e.open?1.2:1.5;
    const opening=Math.max(0,Math.min(1,e.open?(1.6-timer)/.22:1-(1.8-timer)/.2));
    g.save();g.beginPath();g.rect(x+4.2,y+3.6,15.6,10.5);g.clip();
    const shift=opening*12;
    for(let row=0;row<5;row++){
      const yy=y+3.5+row*2.4-shift,slat=g.createLinearGradient(0,yy,0,yy+2.4);slat.addColorStop(0,'#d4d9ce');slat.addColorStop(.2,'#9caaa6');slat.addColorStop(.75,'#4b5d61');slat.addColorStop(1,'#142329');
      this.rect(x+4,yy,16,2.4,slat);this.line(x+5,yy+.4,x+18.8,yy+.4,'#dce0d3',.35);
    }
    g.restore();
    if(opening>.75)this.hudText(e.item.toUpperCase(),e.x,y+5.5,'#fff0c5',6,'center',9);
    for(const [dx,dy]of [[1.8,2],[22.1,2],[1.8,15.8],[22.1,15.8]]){
      this.disc(x+dx,y+dy,.83,'#34464a');this.disc(x+dx-.16,y+dy-.18,.43,'#e4e5d8');this.line(x+dx-.35,y+dy+.25,x+dx+.3,y+dy-.2,'#172b31',.25);
    }
    for(let row=0;row<3;row++)this.rect(x+21.4,y+5+row*2.2,1.3,.8,'#24373b');
    this.rect(x+1.4,y+7,1,3.2,'#2c3d42');this.rect(x+1.55,y+7.3,.65,1,e.open&&Math.sin(time*9)>0?'#ffc879':'#b74731');
    if(e.flash>0){g.globalAlpha=Math.min(.65,e.flash/.07);face();g.fillStyle='#fff6da';g.fill();}
    g.restore();
  }
  fallingBoulder(e){
    const wobble=stageThreeRockWobble(e),anchored=e.phase==='embedded'||e.phase==='warning';
    if(anchored){
      const g=this.g;g.save();g.translate(e.x,e.y-e.r);
      const edge=[1.04,.98,1.08,.99,1.04,.96,1.06,.98,1.1,.96,1.04,.99,1.08,.97];
      g.beginPath();for(let i=0;i<edge.length;i++){const a=i*Math.PI*2/edge.length,r=e.r*edge[i],x=Math.cos(a)*r,y=Math.sin(a)*r*.94;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();
      g.fillStyle='rgba(18,22,13,.72)';g.fill();g.strokeStyle='#343627';g.lineWidth=.8;g.stroke();
      this.line(-e.r*.75,-e.r*.75,-e.r*.35,-e.r*.95,'rgba(185,169,112,.55)',.5);
      this.line(e.r*.42,e.r*.9,e.r*.83,e.r*.61,'rgba(135,133,88,.42)',.5);
      for(const side of [-1,1]){this.line(side*e.r*.8,-e.r*.7,side*e.r*1.15,-e.r*.95,'#29291d',.8);this.line(side*e.r*.9,e.r*.45,side*e.r*1.17,e.r*.7,'#29291d',.7);}
      g.restore();
    }
    if(!this.loaded.has('boulderTurns')){this.boulder(e.x+wobble.x,e.y-e.r+wobble.y,2*e.r,2*e.r,(e.rot||0)+wobble.angle,e.flash>0);return;}
    const g=this.g,image=this.images.boulderTurns,step=Math.PI/4,rotation=e.rot||0,pose=Math.round(rotation/step);
    const frame=mod(pose,8),cw=image.naturalWidth/4,ch=image.naturalHeight/2,pad=.045;
    g.save();g.translate(e.x+wobble.x,e.y-e.r+wobble.y);
    // Each pose has its own painted volume under the same world light. A small
    // residual angle between poses keeps the tumbling silhouette continuous.
    g.rotate(rotation-pose*step+wobble.angle);if(e.flash>0)g.filter='brightness(2.2) saturate(.35)';
    g.drawImage(image,(frame%4+pad)*cw,(Math.floor(frame/4)+pad)*ch,cw*(1-pad*2),ch*(1-pad*2),-e.r,-e.r,2*e.r,2*e.r);g.restore();
    if(e.vy>28){
      g.save();
      for(let i=0;i<4;i++){
        const t=mod(Math.abs(rotation)*.4+i*.27,1),side=i%2?1:-1;
        const x=e.x+side*e.r*(.25+t*.45),y=e.y-e.r*2-2-t*e.r*.8;
        g.globalAlpha=(1-t)*.48;this.line(x,y,x+side*.3,y+1.4,'#bbdcea',.5);
      }
      g.restore();
    }
  }
  boulder(x,y,w,h,rotation,flash){
    const g=this.g;g.save();g.translate(x,y);g.rotate(rotation);
    const outline=()=>{g.beginPath();for(let i=0;i<11;i++){const a=i/11*Math.PI*2,r=.86+noise(i*73+19)*.14,xx=Math.cos(a)*w*.5*r,yy=Math.sin(a)*h*.5*r;i?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.closePath();};
    outline();g.save();g.clip();g.filter=flash?'brightness(2)':'grayscale(1) brightness(1.6) contrast(1.2)';
    this.sprite('rock',-w*.5,-h*.5,w,h);g.restore();
    outline();g.strokeStyle='#17212a';g.lineWidth=.8;g.stroke();
    this.line(-w*.28,-h*.31,w*.2,-h*.38,'#b5c7d1',.7);g.restore();
  }
  guardian(boss){
    const g=this.g,gate=guardianRect(),cy=this.state.camY;
    if(cy>STAGE_THREE.top+260)return;
    const frame=this.guardianFrame(boss.dead?'wreck':boss.open?'open':'closed');
    if(frame){
      g.save();
      // Preserve crisp pixels when a large display goes beyond native density.
      g.imageSmoothingEnabled=gate.w*this.scale<=frame.width;g.imageSmoothingQuality='high';
      g.drawImage(frame,gate.x,gate.y,gate.w,gate.h);
      g.restore();
    }
    if(boss.active&&!boss.dead)for(const [i,part]of boss.parts.slice(0,2).entries())this.guardianArm(boss,part,i===0?-1:1);
  }
  guardianFrame(pose){
    const key='guardian:'+pose;if(this.cache.has(key))return this.cache.get(key);
    const asset=pose==='wreck'?'guardianWreck':'guardian';if(!this.loaded.has(asset))return null;
    const {width,height,openY,openHeight,jaw}=GUARDIAN_ART;
    const canvas=this.createCanvas();canvas.width=width;canvas.height=height;
    const g=canvas.getContext('2d');g.drawImage(this.images[asset],0,0,width,height,0,0,width,height);
    if(pose==='open'){
      const patch=this.createCanvas();patch.width=width;patch.height=height;
      const face=patch.getContext('2d');face.drawImage(this.images.guardian,0,openY,width,openHeight,0,0,width,openHeight);
      face.globalCompositeOperation='destination-in';face.save();face.translate(jaw.x,jaw.y);face.scale(jaw.rx,jaw.ry);
      const mask=face.createRadialGradient(0,0,.88,0,0,1);mask.addColorStop(0,'#000');mask.addColorStop(1,'rgba(0,0,0,0)');
      face.fillStyle=mask;face.fillRect(-2,-2,4,4);face.restore();g.drawImage(patch,0,0);
    }
    this.cache.set(key,canvas);return canvas;
  }
  armPart(name,x,y,size,angle=0,flash=false){
    const g=this.g;g.save();g.translate(x,y);g.rotate(angle);
    if(flash)g.filter='brightness(1.8) saturate(.55)';
    if(this.loaded.has('armKit'))g.drawImage(this.images.armKit,...ARM_PARTS[name],-size*.5,-size*.5,size,size);
    else{this.disc(0,0,size*.5,name==='socket'?'#7f762b':'#91a0a4');this.disc(0,0,size*.22,name==='claw'?'#e8733d':'#25353b');}
    g.restore();
  }
  guardianArm(boss,part,side){
    const g=this.g,pose=waterfallArmPose(side,boss.age,STAGE_THREE.top);
    this.armPart('socket',pose.root.x,pose.root.y,WATERFALL_ARMS.root,0,part.flash>0);
    if(part.hp<=0){this.disc(pose.root.x,pose.root.y,4.1,'#131a16');return;}
    for(let i=1;i<pose.points.length;i++){
      const a=pose.points[i-1],b=pose.points[i];this.line(a.x,a.y,b.x,b.y,'#060c10',5.2);this.line(a.x-.3,a.y-.6,b.x-.3,b.y-.6,'#66787d',1.4);
    }
    for(const point of pose.points.slice(1,-1))this.armPart('joint',point.x,point.y,WATERFALL_ARMS.joint,point.angle,part.flash>0);
    const tip=pose.tip;
    if(part.fireT<.45)this.light(tip.x,tip.y,12,'rgba(255,105,31,.42)');
    this.armPart('claw',tip.x,tip.y,WATERFALL_ARMS.claw,tip.angle*.4+Math.sin(boss.age*2.4+side)*.12,part.flash>0);
  }
  actor(p,role='blue',enemy=false){
    if(p.summitEntered||p.deathHidden)return;
    if(p.summitEntry){
      const g=this.g,t=p.summitEntry.t/.8;g.save();g.globalAlpha=1-t*.85;
      super.actor({...p,vx:40,onGround:true},role,enemy);g.restore();return;
    }
    if(!enemy&&p.invT>0&&!p.dead&&(this.state.t>>2)%2===0)return;
    super.actor(p,role,enemy);
  }
  bullets(bullets,hostile=false){
    super.bullets(bullets.filter(b=>!b.waterfallFire),hostile);
    for(const b of bullets)if(!b.dead&&b.waterfallFire){
      const g=this.g,time=this.state.t/60,r=(b.r||5)*1.45;this.light(b.x,b.y,r*1.8,'rgba(255,96,26,.25)');
      g.save();g.translate(b.x,b.y);g.rotate(time*7+(b.seed||0));
      g.beginPath();g.arc(0,0,r*.8,0,Math.PI*2);g.strokeStyle='#9b271b';g.lineWidth=r*.43;g.stroke();
      g.beginPath();g.arc(0,0,r*.8,0,Math.PI*2);g.strokeStyle='#f26a37';g.lineWidth=r*.27;g.stroke();
      g.beginPath();g.arc(0,0,r*.76,-2.9,-.3);g.strokeStyle='#fff1b1';g.lineWidth=r*.14;g.stroke();
      for(let i=0;i<4;i++){const a=i*Math.PI/2;this.disc(Math.cos(a)*r*.8,Math.sin(a)*r*.8,r*.19,'#ffc183');}
      g.restore();
    }
  }
  hud(G,options){
    const g=this.g;g.save();const shade=g.createLinearGradient(0,0,0,39);shade.addColorStop(0,'rgba(1,8,13,.94)');shade.addColorStop(.7,'rgba(1,8,13,.65)');shade.addColorStop(1,'rgba(1,8,13,0)');g.fillStyle=shade;g.fillRect(0,0,384,39);
    this.playerHud(G,G.p,{x:HUD_PLAYER_X[0],role:StageOneArt.playerRole(options.online),inventory:G.inv,selection:G.sel,cooldown:G.nadeCd,infinite:options.settings.inf==='on',local:!options.guest});
    this.hudText('最高分  '+String(Math.max(options.highScore||0,G.score)).padStart(6,'0'),192,5,'#bccbd0',6,'center',90);
    if(options.online&&G.p2)this.playerHud(G,G.p2,{x:HUD_PLAYER_X[1],blue:true,inventory:G.inv2,selection:G.sel2,cooldown:G.nadeCd2,infinite:options.settings.inf==='on',local:!!options.guest});
    else{this.hudText('第三关',376,4,'#e3e7db',7,'right');this.hudText('峡谷瀑布',376,17,'#b2c7c7',5.8,'right');}
    const boss=G.mech;
    if(boss.active&&!boss.dead){
      const nodes=waterfallNodesAlive(boss),parts=nodes?boss.parts.slice(0,2):[boss.parts[2]],health=parts.reduce((n,p)=>n+Math.max(0,p.hp),0)/parts.reduce((n,p)=>n+p.max,0);
      this.hudText(nodes?'链臂':boss.open?'口部开放':'等待张嘴',149,18,'#d6b67e',5,'right');this.rect(154,18,70,4.6,'#293e43');this.rect(155,19,68*health,2.6,nodes?'#c98147':'#dc6540');
    }else this.hudText(boss.exitOpen?'走入洞口完成第三关':'向上攀登 · 小心落石',192,19,'#aac8c6',5.2,'center',94);
    if(G.bannerT>0&&G.bannerText){this.rect(39,42,306,15,'rgba(1,10,13,.76)');this.hudText(G.bannerText,192,46,'#ead4a4',6.5,'center',292);}
    g.restore();
  }
  render(destination,G,options){
    this.prepare(destination);this.state=G;
    // Shared caches follow the actual display resolution, including DPR changes.
    if(this.baseArt.scale!==this.scale){this.baseArt.scale=this.scale;this.baseArt.cache.clear();this.baseArt.terrainCache.clear();this.hdActors.clear();}
    const g=this.g,cy=this.snap(G.camY);
    this.waterfall(cy,G.t,options.solids);
    if(G.mode==='intro'){
      g.save();g.globalAlpha=.8;this.rect(0,0,384,216,'#010608');g.globalAlpha=1;
      this.hudText('第三关',192,57,'#f0eee0',17,'center');this.hudText('峡谷瀑布',192,84,'#cebc89',9,'center');
      this.actor({x:options.online?174:192,y:148,face:1,anim:0,onGround:true},StageOneArt.playerRole(options.online));
      if(options.online)this.actor({x:213,y:148,face:1,anim:0,onGround:true},'blue');
      this.hudText('沿岩台攀登 · 躲过喷火桥与落石',192,166,'#9bbbc1',6,'center');g.restore();this.present(destination);return;
    }
    g.save();const shake=options.settings.shake==='on'&&G.shake>0?Math.sin(G.t*9)*Math.min(2,G.shake):0;g.translate(shake,-cy);
    for(const s of options.solids)if(!s.gone&&s.y+s.h>=cy-8&&s.y<=cy+232)this.ledge(s);
    this.guardian(G.mech);
    for(const e of G.en)if(!e.dead&&e.y>=cy-35&&e.y<=cy+250)this.enemy(e);
    for(const it of G.items)if(!it.dead)this.capsule(it.x,it.y-5,it.kind,false);
    for(const pod of G.pods)if(!pod.dead)this.capsule(pod.x,pod.y,pod.kind);
    for(const [i,p]of options.players.entries())this.actor(p,StageOneArt.playerRole(options.online,i));
    this.flames(G.time);this.bullets(G.pb);this.grenades(G.gr,G.t);this.bullets(G.eb,true);this.effects(G.fx);g.restore();
    this.hud(G,options);
    if(G.flashT>0){g.save();g.globalAlpha=Math.min(.6,G.flashT*2);this.rect(0,0,384,216,'#fff7e9');g.restore();}
    this.present(destination);
  }
}
