import { HUD_PLAYER_X } from './hud-layout.mjs';
import { StageOneArt } from './stage-one-art.mjs?v=single-enemy-rifle-1';
import { drawExplosion } from './combat-art.mjs?v=combat-polish-1';
import { HDActorArt } from './hd-actors.mjs?v=webp-1';
import { BASE_ACTORS, BASE_KIT } from './stage-two-atlas.mjs?v=webp-1';
import { BASE_UPWARD, baseActorPose, baseGateTransitionActor, baseExitRollActor, BASE_GATE_ROLL_START } from './base-actor-poses.mjs?v=base-transition-1';
export { baseActorPose } from './base-actor-poses.mjs?v=webp-1';
import { drawShieldField } from './actor-status.mjs?v=energy-field-1';
import { BASE_SOLDIER, baseSoldierScale, baseSoldierJumpOffset } from './base-soldier.mjs?v=base-soldier-motion-2';
import { drawRiotShield } from './riot-shield.mjs?v=riot-shield-1';
import { baseRoomTheme, nextBaseRoomTheme, baseRoomSignals } from './stage-two-rooms.mjs?v=room-identities-1';
import { baseCoreShielded } from './base-shooting.mjs?v=base-up-lift-1';
import { redSupplyUniform } from './base-supply.mjs?v=red-supply-1';
import { bossDevicesRemaining, deviceAimHint, drawBossBubble, drawBossEye } from './base-boss.mjs?v=stage-two-boss-triple-2';
import {drawFrozenEnemy} from './enemy-freeze-art.mjs?v=enemy-freeze-2';
import {drawStageEnemyUniform} from './stage-enemy-uniforms.mjs?v=base-lateral-stride-1';

export const STAGE_TWO_ASSETS=Object.freeze({
  corridor:'/games/contra2026/assets/stage2/corridor-hd.webp',
  power:'/games/contra2026/assets/stage2/corridor-power.webp',
  armory:'/games/contra2026/assets/stage2/corridor-armory.webp',
  command:'/games/contra2026/assets/stage2/corridor-command.webp',
  kit:'/games/contra2026/assets/stage2/mechanisms-hd.webp',
  bossWall:'/games/contra2026/assets/stage2/control-wall-v2.webp',
  defenseDevices:'/games/contra2026/assets/stage2/defense-devices-v2.webp',
  passage:'/games/contra2026/assets/stage4/breached-passage.webp',
  rearBlue:'/games/contra2026/assets/stage2/commando-back-blue.webp',
  rearRed:'/games/contra2026/assets/stage2/commando-back-red.webp',
  rearUp:'/games/contra2026/assets/stage2/commando-upward-v1.webp',
  lateralBlue:'/games/contra2026/assets/stage2/commando-lateral-blue-v1.webp',
  lateralRed:'/games/contra2026/assets/stage2/commando-lateral-red-v1.webp',
  frontEnemy:'/games/contra2026/assets/stage2/soldier-front.webp',
  enemyUniform:'/games/contra2026/assets/stage2/enemy-base-front-aim-v1.webp',
  sideEnemyUniform:'/games/contra2026/assets/stage2/enemy-base-side.webp',
  environment:'/games/contra2026/assets/stage1/environment.webp'
});
export const BASE_VIEW=Object.freeze({floor:204,rear:{x:96,y:40,w:192,h:100},barrierZ:.3});
export const baseScale=z=>1-.5*z;
export const basePoint=(u,z)=>({x:192+u*baseScale(z),y:BASE_VIEW.floor-64*z});
// The terminals stay fixed while the discharge changes shape at 24 Hz.
export function barrierArc(time,row=0){
  const tick=Math.floor(time*24),y=184.8-(row?24:8)*.85,points=[[34,y]];
  for(let x=36;x<350;x+=2){
    const edge=Math.min(1,(x-34)/12,(350-x)/12);
    points.push([x,y+edge*(Math.sin(x*1.73+tick*2.17+row*4)*1.05+Math.sin(x*.59-tick*1.31)*.8)]);
  }
  points.push([350,y]);return points;
}
/** Stage-two simulation keeps its original projection. Only artwork uses native display pixels. */
export class StageTwoArt extends StageOneArt{
  constructor(options){
    super({...options,assets:options.assets||STAGE_TWO_ASSETS});this.baseArt=options.baseArt;
    if(this.baseArt)this.hdActors=this.baseArt.hdActors;
    // Rear-view prone art is foreshortened in depth, not a miniature standing figure.
    const sheets=Object.fromEntries(Object.entries(BASE_ACTORS).map(([role,sheet])=>{
      const scale=role==='enemy'?BASE_SOLDIER.height/sheet.frames.idle.bounds[3]:sheet.scale;
      // A horizontal body keeps the standing artwork's pixel scale. The generic
      // legacy 11-unit death-height limit would miniaturize this detailed pose.
      const lateral=role==='blue'||role==='red'?Object.fromEntries(Array.from({length:4},(_,i)=>
        [`side${i}`,{key:role==='blue'?'lateralBlue':'lateralRed',bounds:[i*400,0,400,512],anchor:[i*400+200,490],waist:270,scale:38/464}])):{};
      return[role,{...sheet,scale,frames:{...sheet.frames,...lateral,dead:{...sheet.frames.dead,scale},...(BASE_UPWARD[role]?{up:BASE_UPWARD[role]}:{})}}];
    }));
    sheets.supply={...sheets.enemy,key:'supplyEnemy'};
    this.baseActors=new HDActorArt(options.createCanvas,this.images,{poseSheets:sheets,runSheets:sheets,runRig:null,deathSheets:null,deadPose:'dead',proneHeight:26});
  }
  prepare(destination){
    const width=destination.canvas?.width||1536,height=destination.canvas?.height||864;
    if(this.surface.width!==width||this.surface.height!==height)this.baseActors.clear();
    super.prepare(destination);
  }
  kitFrame(name,w,h){
    if(!this.loaded.has('kit'))return null;
    const key=`kit:${name}:${w}:${h}`;if(this.cache.has(key))return this.cache.get(key);
    const frame=this.createCanvas();frame.width=Math.ceil(w*this.scale);frame.height=Math.ceil(h*this.scale);
    const g=frame.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    g.drawImage(this.images.kit,...BASE_KIT.frames[name],0,0,frame.width,frame.height);this.cache.set(key,frame);return frame;
  }
  kit(name,x,y,w,h){const image=this.kitFrame(name,w,h);if(image)this.g.drawImage(image,x,y,w,h);return!!image;}
  metalBeam(x,y,w,h){
    const g=this.g,vertical=h>w,shade=g.createLinearGradient(x,y,vertical?x+w:x,vertical?y:y+h);
    for(const [stop,color]of [[0,'#243330'],[.18,'#b7c3b2'],[.38,'#6d7e72'],[.65,'#485a50'],[.82,'#a4b29e'],[1,'#172522']])shade.addColorStop(stop,color);
    g.fillStyle=shade;g.fillRect(x,y,w,h);
    this.line(x,y,x+w,y,'#c7ceba',.35);this.line(x+w,y,x+w,y+h,'#07100d',.65);
    for(let pos=5;pos<(vertical?h:w)-2;pos+=13){
      const xx=vertical?x+w/2:x+pos,yy=vertical?y+pos:y+h/2;
      this.disc(xx,yy,.38,'#182721');this.disc(xx-.12,yy-.12,.13,'#e3e6cb');
    }
  }
  backdrop(B=this.state?.base){
    const theme=baseRoomTheme(B),key='corridor:'+theme.id;
    let backdrop=this.cache.get(key);
    if(!backdrop){
      backdrop=this.createCanvas();backdrop.width=this.surface.width;backdrop.height=this.surface.height;
      const g=backdrop.getContext('2d');g.fillStyle='#07151e';g.fillRect(0,0,backdrop.width,backdrop.height);
      if(this.loaded.has(theme.asset)){
        const source=this.images[theme.asset],xx=[0,540,1136,1674],yy=[0,235,558,941],dx=[0,96,288,384],dy=[0,40,140,216];
        // Register the painted back wall with the unchanged shootable surface.
        for(let row=0;row<3;row++)for(let col=0;col<3;col++)g.drawImage(source,
          xx[col]/1674*source.naturalWidth,yy[row]/941*source.naturalHeight,
          (xx[col+1]-xx[col])/1674*source.naturalWidth,(yy[row+1]-yy[row])/941*source.naturalHeight,
          dx[col]*this.scale,dy[row]*this.scale,(dx[col+1]-dx[col])*this.scale,(dy[row+1]-dy[row])*this.scale);
      }
      this.cache.set(key,backdrop);
    }
    this.g.drawImage(backdrop,0,0,384,216);
  }
  roomIdentity(B){
    if(B.def.boss==='eye')return;
    const g=this.g,theme=baseRoomTheme(B);
    for(const light of baseRoomSignals(B,this.state.time)){
      g.save();g.globalAlpha=light.alpha;this.rect(light.x,light.y,light.w,light.h,theme.accent);g.restore();
    }
  }
  mineLaunchers(B){
    if(B.def.boss||!B.def.rol||B.cleared)return;
    for(const side of [-1,1]){
      const {x,y}=basePoint(side*160,1);
      const warning=B.rollSide===side&&B.rolled<B.def.rol;
      const before=warning?Math.max(0,Math.min(1,(.36-B.rollT)/.25)):0;
      const exiting=(B.rol||[]).find(mine=>!mine.dead&&Math.sign(mine.u0)===side&&mine.z>.86);
      const after=exiting?Math.min(1,(exiting.z-.86)/.06):0;
      const open=Math.max(before,after);
      this.rect(x-13,y-10,26,10,'#172322');
      this.rect(x-10,y-7.5,20,7.5,'#040709');
      this.metalBeam(x-14,y-10.5,28,2.2);
      for(const dx of [-13,10]){
        this.metalBeam(x+dx,y-8.4,3,8.4);
        this.disc(x+dx+1.5,y-6.1,.48,'#222923');
      }
      const bottom=y-1.2-open*6.8;
      if(bottom>y-7.5){
        this.rect(x-10,y-7.5,20,bottom-y+7.5,'#43564e');
        this.line(x-9.8,bottom,x+9.8,bottom,'#81928a',.65);
        if(open<.35)this.line(x-8,y-5.3,x+8,y-5.3,'#243531',.55);
      }
      this.disc(x-11.5,y-3.5,.72,warning||exiting?'#f3b269':'#74372a');
      this.disc(x+11.5,y-3.5,.72,warning||exiting?'#f3b269':'#74372a');
      this.line(x-13,y,x+13,y,'#847f61',.6);
    }
  }
  rollingMine(mine){
    const g=this.g,scale=baseScale(mine.z);
    const {x,y}=basePoint(mine.u0+(mine.ut-mine.u0)*(1-mine.z),mine.z);
    const width=mine.spd>.5?19:17,radius=mine.spd>.5?4.7:4.1;
    g.save();g.translate(x,y);g.scale(scale,scale);
    g.fillStyle='rgba(4,7,8,.52)';g.beginPath();g.ellipse(0,.2,width*.6,1.2,0,0,Math.PI*2);g.fill();
    g.translate(0,-radius);
    const steel=g.createLinearGradient(0,-radius,0,radius);
    for(const [stop,color] of [[0,'#544436'],[.21,'#b8a47d'],[.48,'#706452'],[.75,'#40392e'],[1,'#1c1c19']])steel.addColorStop(stop,color);
    this.rect(-width/2,-radius,width,radius*2,steel);
    // Axial ridges travel over the curved front of the drum as it rotates.
    for(let i=0;i<7;i++){
      const angle=(mine.a||0)+i*Math.PI*2/7,front=Math.cos(angle);
      if(front<=0)continue;
      const yy=Math.sin(angle)*radius*.89;
      this.line(-width/2+2,yy,width/2-2,yy,'#292821',.8);
      this.line(-width/2+2,yy-.38,width/2-2,yy-.38,i===0?'#ffbb5c':'#ad9270',.35+front*.36);
    }
    for(const end of [-1,1]){
      const xx=end*(width/2-1);
      this.rect(xx-1,-radius,2,radius*2,steel);
      this.line(xx-end*.85,-radius,xx-end*.85,radius,'#c4ac7c',.55);
      g.fillStyle='#655b45';g.beginPath();g.ellipse(xx+end*.65,0,1.45,radius,0,0,Math.PI*2);g.fill();
      g.fillStyle='#242a28';g.beginPath();g.ellipse(xx+end*.86,0,.82,radius*.65,0,0,Math.PI*2);g.fill();
      this.disc(xx+end*.86,Math.sin(mine.a||0)*radius*.48,.46,'#ecb771');
    }
    g.restore();
  }
  floorEmblem(B){
    if(!B.def.boss)return;
    const g=this.g;g.save();g.translate(192,186);g.scale(1,.42);g.lineJoin='round';
    // Inlaid, foreshortened metal insignia: swept wings and a central shield.
    g.fillStyle='rgba(0,0,0,.5)';g.beginPath();g.ellipse(0,2,53,19,0,0,Math.PI*2);g.fill();
    const metal=g.createLinearGradient(0,-16,0,19);
    metal.addColorStop(0,'#e0ded0');metal.addColorStop(.24,'#8a9994');metal.addColorStop(.52,'#303c3d');metal.addColorStop(.76,'#a2aaa0');metal.addColorStop(1,'#353d3c');
    for(const side of [-1,1]){
      g.save();g.scale(side,1);g.fillStyle=metal;g.strokeStyle='#101719';g.lineWidth=2;
      g.beginPath();g.moveTo(4,-8);g.lineTo(17,-11);g.lineTo(50,-13);g.lineTo(44,-6);g.lineTo(34,-3);g.lineTo(29,3);g.lineTo(18,4);g.lineTo(13,10);g.lineTo(5,8);g.closePath();g.fill();g.stroke();
      g.strokeStyle='#d6ded2';g.lineWidth=.9;g.beginPath();g.moveTo(9,-6);g.lineTo(43,-10);g.moveTo(13,-2);g.lineTo(35,-5);g.moveTo(16,2);g.lineTo(26,0);g.stroke();g.restore();
    }
    g.fillStyle=metal;g.strokeStyle='#111a1b';g.lineWidth=2;g.beginPath();g.moveTo(-10,-12);g.lineTo(0,-15);g.lineTo(10,-12);g.lineTo(9,2);g.lineTo(0,15);g.lineTo(-9,2);g.closePath();g.fill();g.stroke();
    g.strokeStyle='#e4e8dc';g.lineWidth=1.1;g.beginPath();g.moveTo(-6,-8);g.lineTo(0,-10);g.lineTo(6,-8);g.lineTo(5,1);g.lineTo(0,8);g.lineTo(-5,1);g.closePath();g.stroke();
    g.fillStyle='#172524';g.beginPath();g.moveTo(-4,-5);g.lineTo(0,-7);g.lineTo(4,-5);g.lineTo(3,0);g.lineTo(0,4);g.lineTo(-3,0);g.closePath();g.fill();g.restore();
  }
  bossWall(B){
    const g=this.g,key='control-wall';let image=this.cache.get(key);
    if(!image){
      image=this.createCanvas();image.width=Math.ceil(248*this.scale);image.height=Math.ceil(108*this.scale);
      const ink=image.getContext('2d');ink.imageSmoothingEnabled=true;ink.imageSmoothingQuality='high';
      if(this.loaded.has('bossWall'))ink.drawImage(this.images.bossWall,0,0,image.width,image.height);
      else{ink.fillStyle='#182421';ink.fillRect(0,0,image.width,image.height);}
      this.cache.set(key,image);
    }
    g.drawImage(image,68,37,248,108);
    for(let i=0;i<13;i++)this.rect(82+i*17,42,3,.8,i%4===(this.state.t>>4)%4?'#d58f43':'#507b70');
    if(B.def.boss==='eye'){
      // Register painted recesses to the six unchanged simulation targets.
      if(this.loaded.has('bossWall')){
        const wall=this.images.bossWall;
        g.drawImage(wall,390,68,1125,204,95,50,194,35);
        g.drawImage(wall,360,265,1190,430,103,86,180,55);
      }
      if(B.bossPhase==='reveal'){
        const phase=1-Math.min(1,B.revealT/1.2);
        drawBossBubble(g,192,71,3+phase*11,2+phase*6,this.state.time,true);
      }
    }
    // The control chamber retains the original's ribbed red floor margins.
    for(let y=149;y<216;y+=3){
      const margin=7+(y-149)*.75;
      this.line(15,y,15+margin,y,'rgba(144,44,28,.65)',.65);
      this.line(369-margin,y,369,y,'rgba(144,44,28,.65)',.65);
    }
  }
  portal(B){
    if(!B.cleared||B.def.boss)return;
    if(this.loaded.has('passage')){
      const image=this.images.passage,scale=Math.min(76/image.naturalWidth,86/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;
      this.g.drawImage(image,192-w/2,140-h,w,h);return;
    }
    const g=this.g;
    g.save();g.beginPath();[[160,58],[170,53],[215,54],[225,65],[223,101],[229,137],[157,140],[162,117],[156,91]].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip();
    const dark=g.createLinearGradient(158,60,224,140);dark.addColorStop(0,'#01080c');dark.addColorStop(.65,'#03111a');dark.addColorStop(1,'#15303d');g.fillStyle=dark;g.fillRect(155,50,76,92);
    for(let i=0;i<5;i++){
      const inset=i*5;g.strokeStyle=`rgba(92,136,149,${.35-i*.045})`;g.lineWidth=.55;g.strokeRect(159+inset,56+inset,66-inset*2,84-inset*2);
    }
    g.restore();
    // Fractured steel highlights along the actual breach, rather than a solid box border.
    for(const [x,y,xx,yy]of [[160,58,168,54],[158,86,160,69],[158,107,161,117],[215,55,223,64],[224,81,222,101],[224,116,228,135]]){
      this.line(x,y,xx,yy,'#1b262e',1.6);this.line(x+.5,y,xx+.5,yy,'#8a9491',.45);
    }
    this.line(159,137,224,137,'#8e9b99',1.2);this.line(159,139,224,139,'#15222a',1.5);
  }
  target(target,B){
    const {x,y,w,h,k}=target,dead=target.hp<=0,g=this.g;
    // The core's explosion reveals the passage; no wreck remains across its floor.
    if(k==='core'&&dead)return;
    if(k==='device'){
      if(this.loaded.has('defenseDevices')){
        g.save();if(target.flash>0)g.filter='brightness(1.75) saturate(.7)';
        g.drawImage(this.images.defenseDevices,dead?512:0,0,512,320,x-7,y-4,w+14,h+8);g.restore();
      }else{
        this.kit(dead?'coreBroken':'core',x-3,y-1,w+6,h+2);
        if(!dead){
        this.metalBeam(x+4,y+2,w-8,3);
        const cx=x+w/2,cy=y+h*.57,lens=g.createRadialGradient(cx-1.4,cy-1.6,.4,cx,cy,4.5);
        lens.addColorStop(0,target.flash>0?'#fffbe4':'#ffb278');lens.addColorStop(.35,'#ed5732');lens.addColorStop(.7,'#ac231d');lens.addColorStop(1,'#3e1519');
        this.disc(cx,cy,5.3,'#192326');g.fillStyle=lens;g.beginPath();g.arc(cx,cy,4.5,0,Math.PI*2);g.fill();
        this.line(cx-2,cy-2,cx+.6,cy-2.7,'#ffe0a0',.55);
        }
      }
      if(B.def.boss==='eye'&&!dead){
        const open=Math.max(0,Math.min(1,target.aperture||0)),yy=y+h-1;
        this.rect(x+2,yy,w-4,6,'#152126');this.line(x+2,yy,x+w-2,yy,'#91a39c',.65);
        for(const d of [-8,0,8]){
          const cx=x+w/2+d;this.disc(cx,yy+2.8,2.1,'#050c10');
          if(open>.08){this.disc(cx,yy+2.8,1.45,target.shotFlash>0?'#fff3bf':'#703a22');this.disc(cx,yy+2.8,.65,target.shotFlash>0?'#fff':'#df7840');}
          if(target.shotFlash>0)this.light(cx,yy+3,4,'rgba(255,151,55,.45)');
        }
        const shutter=(w-4)*(1-open)/2;
        for(const xx of [x+2,x+w-2-shutter]){this.rect(xx,yy+1,shutter,4,'#68736c');this.line(xx,yy+1,xx+shutter,yy+1,'#c0c6ad',.55);}
      }
      return;
    }
    if(target.mover){
      if(dead)return;
      drawBossEye(g,x+w/2,y+h/2,w/2,h/2,this.state.time,target.flash>0);
      if(target.flash>0){g.save();g.globalAlpha=.5;this.disc(x+w/2,y+h/2,w*.36,'#e5edff');g.restore();}
      return;
    }
    if(k==='switch'&&B.cleared)return;
    if(k==='switch'){
      const cx=x+w/2;
      g.save();g.translate(cx,y);g.scale(1,-1);
      if(!this.kit('post',-3,0,6,19))this.rect(-2,0,4,19,'#647983');g.restore();
      this.line(cx,y+h,cx,114,'#13232a',3);this.line(cx,y+h,cx,114,dead?'#3b4c50':'#b96d43',1);
      if(!dead){const yy=y+h+((this.state.time*8)%14);this.disc(cx,yy,.8,'#ffd790');}
    }
    const name=k==='bcore'?(dead?'bossBroken':'boss'):k==='core'?(dead?'coreBroken':'core'):(dead?'gunBroken':'gun');
    const art=k==='bcore'?{x:x-10,y:y-17,w:w+20,h:h+24}:{x:x-1,y:y-1,w:w+2,h:h+2};
    if(!this.kit(name,art.x,art.y,art.w,art.h))this.rect(x,y,w,h,dead?'#17232a':'#6a7f86');
    if(dead)return;
    if(target.flash>0){
      const frame=this.kitFrame(name,art.w,art.h),key='target-flash:'+name+':'+art.w+':'+art.h;let mask=this.cache.get(key);
      if(frame&&!mask){mask=this.createCanvas();mask.width=frame.width;mask.height=frame.height;const ink=mask.getContext('2d');ink.drawImage(frame,0,0);ink.globalCompositeOperation='source-in';ink.fillStyle='#fff6d1';ink.fillRect(0,0,mask.width,mask.height);this.cache.set(key,mask);}
      if(mask){g.save();g.globalAlpha=Math.max(0,target.flash/.06)*.38;g.drawImage(mask,art.x,art.y,art.w,art.h);g.restore();}
    }
    if(k==='switch'){
      const cx=x+w/2,cy=y+h*.52;
      this.disc(cx,cy,3.3,'#0a0c10');this.disc(cx,cy,2.1,target.flash>0?'#fff3c9':'#c33b20');
      this.disc(cx,cy-.35,1.05,'#ffb65a');this.line(cx-2,y+3,cx+2,y+3,'#d4e1e0',.65);
      g.save();g.globalAlpha=.14+.1*Math.sin(this.state.time*5);this.light(cx,cy,4.5,'rgba(255,116,47,.55)');g.restore();
    }
    if(k==='core'&&baseCoreShielded(B,this.state.empT)){
      for(let i=0;i<4;i++){
        const yy=y+3+i*4;
        this.rect(x+3,yy,w-6,2.6,'#304850');this.line(x+3,yy,x+w-3,yy,'#a5b8b6',.65);
      }
    }
    if(k==='core'||k==='bcore'){
      g.save();g.globalAlpha=.18+.1*Math.sin(this.state.time*4);this.light(x+w/2,y+h*.54,w*.32,'rgba(255,133,45,.52)');g.restore();
    }
  }
  barrier(){
    const g=this.g,t=this.state.time;
    this.kit('post',26,147,10,38);this.kit('post',348,147,10,38);
    g.save();g.lineJoin='round';g.lineCap='round';
    for(let row=0;row<2;row++){
      const points=barrierArc(t,row),pulse=.75+.2*Math.sin(t*37+row*2);
      g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
      g.strokeStyle=`rgba(46,177,237,${pulse*.16})`;g.lineWidth=4;g.stroke();
      g.strokeStyle=`rgba(87,209,253,${pulse*.5})`;g.lineWidth=1.6;g.stroke();
      g.strokeStyle=`rgba(220,253,255,${pulse})`;g.lineWidth=.48;g.stroke();
      // Short forked discharges travel along each strand rather than pulsing a static line.
      for(let i=0;i<3;i++){
        const index=5+((Math.floor(t*32)+i*47+row*31)%145),[x,y]=points[index],side=(i+row)%2?1:-1;
        this.line(x,y,x+2,y+side*3,'rgba(169,240,255,.65)',.4);
        this.line(x+2,y+side*3,x+5,y+side*1.5,'rgba(169,240,255,.4)',.3);
      }
    }
    g.restore();
    this.disc(31,149,.55,'#e3faff');this.disc(353,149,.55,'#e3faff');
  }
  figure(p,role='blue',size=1,enemy=false,transition=0){
    if(p.deathHidden)return;
    if(enemy&&drawFrozenEnemy(this,p,()=>this.figure(p,role,size,enemy,transition),{role,size,
      bounds:{x:p.x-20*size,y:p.y-34*size,w:40*size,h:39*size,foot:p.y}}))return;
    const g=this.g,giant=p.giantT>0&&!enemy?2:1,world={...p,giantT:0};
    let artPose=baseActorPose(p,enemy,transition>0);
    const sideExit=!enemy&&this.state.base?.dead&&!p.liftSide&&!p.prone&&!p.spin&&!p.dead&&p.onGround&&Math.abs(p.vx||0)>.5&&
      this.hdActors?.ready(role)&&this.hdActors.images?.runLimbs?.naturalWidth>0;
    const lateral=!sideExit&&!enemy&&!transition&&!p.gateTransition&&!p.aimUp&&!p.prone&&!p.spin&&!p.dead&&p.onGround&&Math.abs(p.vx||0)>.5&&
      this.loaded?.has(role==='blue'?'lateralBlue':role==='red'?'lateralRed':'');
    if(lateral)artPose='side'+(Number(artPose.slice(3))%4);
    if(!p.spin&&!p.dead){g.save();g.fillStyle='rgba(0,7,12,.27)';g.beginPath();g.ellipse(p.x,p.y+(enemy?baseSoldierJumpOffset(p):0)-.2,(enemy?6:9)*size*giant,1.4*size*giant,0,0,Math.PI*2);g.fill();g.restore();}
    const hit=(this.state.fx||[]).find(f=>f.k==='impact'&&f.material==='shield'&&f.t<.2&&Math.abs(f.x-p.x)<20);
    if(!enemy){
      drawShieldField(g,p,this.state.time,true);
      drawRiotShield(g,p,this.state.time,hit?1-hit.t/.2:0);
    }
    g.save();g.translate(p.x,p.y);g.scale(((lateral||sideExit)&&p.vx<0?-1:1)*size*giant,size*giant);
    if(enemy&&p.flash>0)g.filter='brightness(1.65) saturate(.65)';
    if(!sideExit&&p.aimDx&&!p.prone&&!p.spin)g.transform(1,0,-p.aimDx*.2,1,0,0);
    if(transition>0)g.globalAlpha*=1-transition*.65;
    const actorState={...world,artPose,ay:p.aimUp?-1:0,statusTime:this.state.time};
    const drawBody=()=>{
      if(!sideExit)return this.baseActors.draw(g,actorState,role,this.scale*size*giant);
      g.save();g.scale(1.25,1.25);
      const result=this.hdActors.draw(g,{...world,artPose:undefined,ay:0,face:Math.sign(p.vx),inWater:false,ride:null,statusTime:this.state.time},role,this.scale*size*giant*1.25);
      g.restore();return result;
    };
    const sideLegs=enemy&&p.patrolArmed&&p.st==='walk'&&Math.abs(p.vx||0)>.5&&!(p.jumpY>0)&&
      this.hdActors?.ready('enemy')&&this.hdActors.images?.runLimbs?.naturalWidth>0;
    const drawSideLegs=sideLegs?()=>{
      g.save();g.scale((p.vx<0?-1:1)*1.25,1.25);
      this.hdActors.draw(g,{...world,artPose:undefined,ay:0,vx:Math.abs(p.vx),onGround:true,inWater:false,ride:null},'enemy',this.scale*size*1.25);
      g.restore();
    }:null;
    const uniformDrawn=enemy&&role==='enemy'&&drawStageEnemyUniform(this,p,drawBody,{front:true,drawLegs:drawSideLegs});
    if(!uniformDrawn&&enemy&&role==='supply'&&drawSideLegs){
      // Red carriers use the same articulated stride with a red uniform;
      // their original front-facing upper body and weapon stay unchanged.
      g.save();g.beginPath();g.rect(-60,-16,120,70);g.clip();
      g.filter=(g.filter&&g.filter!=='none'?g.filter+' ':'')+'grayscale(1) sepia(1) saturate(4) hue-rotate(320deg) brightness(.85)';drawSideLegs();g.restore();
      g.save();g.beginPath();g.rect(-60,-60,120,44);g.clip();drawBody();g.restore();
    }else if(!uniformDrawn)drawBody();
    g.restore();
    if(p.dead||enemy)return;
    drawShieldField(g,p,this.state.time,false,hit?1-hit.t/.2:0);
    if(p.flashT>0&&!(this.state.base?.trans>0)&&!this.state.base?.dead)this.muzzle(p.fx+(p.flashUp?0:5*giant),p.fy);
  }
  supplyUniform(){
    if(this.images.supplyEnemy?.naturalWidth)return;
    const source=this.images.frontEnemy;if(!(source?.naturalWidth>0))return;
    const canvas=this.createCanvas();canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
    const ink=canvas.getContext('2d');ink.drawImage(source,0,0);
    const pixels=ink.getImageData(0,0,canvas.width,canvas.height);redSupplyUniform(pixels.data);ink.putImageData(pixels,0,0);
    // HDActorArt accepts this CanvasImageSource using the same atlas dimensions.
    canvas.naturalWidth=canvas.width;canvas.naturalHeight=canvas.height;this.images.supplyEnemy=canvas;
  }
  sideSoldier(s,point,scale){
    const p={...s,...point,onGround:true,vx:62,ay:0,face:s.face||1};
    if(drawFrozenEnemy(this,p,()=>this.sideSoldier(s,point,scale),{role:'sideEnemy',size:scale,bounds:{x:p.x-32*scale,y:p.y-45*scale,w:64*scale,h:50*scale,foot:p.y}}))return;
    const g=this.g,size=scale*BASE_SOLDIER.height/30;
    g.save();g.fillStyle='rgba(0,7,12,.27)';g.beginPath();g.ellipse(p.x,p.y+baseSoldierJumpOffset(s)-.2,6*scale,1.4*scale,0,0,Math.PI*2);g.fill();g.restore();
    g.save();g.translate(p.x,p.y);g.scale((s.face||1)*size,size);if(s.flash>0)g.filter='brightness(1.65) saturate(.65)';
    const drawBody=()=>this.hdActors.draw(g,p,'enemy',this.scale*size);
    if(!drawStageEnemyUniform(this,p,drawBody,{key:'sideEnemyUniform'}))drawBody();g.restore();
  }
  soldiers(B,near=false){
    if(B.trans>0||B.dead)return;
    const list=[...B.sol.filter(s=>!s.dead).map(s=>({z:s.z,s})),...B.rol.filter(r=>!r.dead).map(r=>({z:r.z,r}))].sort((a,b)=>b.z-a.z);
    for(const thing of list){
      if((thing.z<.3)!==near)continue;
      if(thing.s){
        const s=thing.s,point=basePoint(s.u,s.z),scale=baseSoldierScale(s.z),moving=s.st!=='aim';
        if(s.dropKind)this.supplyUniform();
        point.y-=baseSoldierJumpOffset(s);
        // The sprite stays front-facing while the legs animate lateral movement.
        this.figure({...s,...point,onGround:true,vx:moving?62*(s.patrolDir||s.face||1):0,anim:(s.anim||0)*1.25},s.dropKind?'supply':'enemy',scale,true);
        if(s.shotFlash>0&&!(this.state.freezeT>0))this.muzzle(s.shotX,s.shotY);
      }else this.rollingMine(thing.r);
    }
  }
  shots(G){
    if(G.base?.trans>0||G.base?.dead)return;
    const g=this.g;
    for(const b of G.eb)if(!b.dead){
      if(b.bubble){drawBossBubble(g,b.x,b.y,b.rx??b.r,b.ry??b.r*.8,G.time+(b.phase||0));continue;}
      this.light(b.x,b.y,(b.r||2)+1.5,'rgba(255,111,61,.5)');this.disc(b.x,b.y,(b.r||2)*.72,'#ff9c4f');this.disc(b.x-.2,b.y-.2,(b.r||2)*.3,'#fff1cf');
    }
    for(const b of G.pb){
      if(b.dead)continue;const progress=Math.min(1,b.t||0),radius=Math.max(.5,1.5*(1-.6*progress));
      const owner=b.owner===2?G.p2:G.p,shift=b.upward?0:5*(owner?.giantT>0?2:1),x=b.x+shift*(1-progress);
      const direction=Math.atan2(b.ye-b.y0,b.xe-b.x0-shift),length=b.k==='laser'?11:4;
      this.line(x-Math.cos(direction)*length,b.y-Math.sin(direction)*length,x,b.y,b.k==='laser'?'#95eaff':'#ffe8b6',b.k==='laser'?1.4:.8);
      this.disc(x,b.y,radius,b.k==='fire'?'#ffc05c':'#fff7df');
      if(b.k==='fire')this.light(x,b.y,3,'rgba(255,144,39,.6)');
    }
    for(const grenade of G.gr)if(!grenade.dead){g.save();g.translate(grenade.x,grenade.y);g.rotate(grenade.a||0);this.kit('mine',-2.2,-2.2,4.4,4.4);g.restore();}
  }
  groundItems(G){
    const g=this.g;
    for(const item of G.items)if(!item.dead){
      g.save();g.fillStyle='rgba(0,6,9,.32)';g.beginPath();g.ellipse(item.x,BASE_VIEW.floor-.3,5,.9,0,0,Math.PI*2);g.fill();g.restore();
      this.capsule(item.x,item.y-5,item.kind,false);
    }
  }
  sideLifts(G,players){
    const B=G.base;if(!['eye','twin'].includes(B.def.boss))return;
    for(const side of [-1,1]){
      const x=side<0?13:341,rider=players.find(p=>p.liftSide===side);
      const py=rider?rider.y:204;
      if(py+6>=0&&py<216){
        this.metalBeam(x,py,30,4);
        this.rect(x,py+4,30,2,'#642c23');
        for(let xx=x+2;xx<x+29;xx+=5)this.line(xx,py+1,xx+2,py+3,'#4a5a4e',.6);
      }
    }
  }
  effects(effects){
    super.effects(effects.filter(f=>f.k!=='baseMineBlast'&&f.k!=='baseBubblePop'));
    const g=this.g;
    for(const f of effects){
      if(f.k==='baseBubblePop'&&!f.dead){
        const p=Math.min(1,f.t/f.life),rx=f.rx*(1+p*.38),ry=f.ry*(1+p*.38);
        g.save();g.globalAlpha=(1-p)*.9;g.strokeStyle='#bcecff';g.lineWidth=1.1*(1-p)+.3;
        for(let i=0;i<8;i++){g.beginPath();g.ellipse(f.x,f.y,rx,ry,0,i*Math.PI/4+p*.45,i*Math.PI/4+p*.45+.35*(1-p));g.stroke();}
        g.restore();continue;
      }
      if(f.k!=='baseMineBlast'||f.dead)continue;
      drawExplosion(g,this.baseArt.images.explosionAtlas,{...f,y:f.y-3,s:12});
      const p=Math.min(1,f.t/f.life),radius=3+23*Math.sqrt(p);
      g.save();g.globalAlpha=(1-p)*.65;g.beginPath();g.ellipse(f.x,f.y+3,radius,radius*.22,0,0,Math.PI*2);
      g.strokeStyle='#ffc98a';g.lineWidth=1.1*(1-p)+.2;g.stroke();
      this.light(f.x,f.y-3,16*(1-p),'rgba(255,157,47,.5)');g.restore();
    }
  }
  hud(G,options){
    const g=this.g,B=G.base;g.save();
    const shade=g.createLinearGradient(0,0,0,38);shade.addColorStop(0,'rgba(2,13,20,.96)');shade.addColorStop(.7,'rgba(2,13,20,.82)');shade.addColorStop(1,'rgba(2,13,20,0)');g.fillStyle=shade;g.fillRect(0,0,384,38);
    this.playerHud(G,G.p,{x:HUD_PLAYER_X[0],blue:false,role:StageOneArt.playerRole(options.online),inventory:G.inv,selection:G.sel,cooldown:G.nadeCd,infinite:options.settings.inf==='on',local:!options.guest});
    if(options.online&&G.p2)this.playerHud(G,G.p2,{x:HUD_PLAYER_X[1],blue:true,inventory:G.inv2,selection:G.sel2,cooldown:G.nadeCd2,infinite:options.settings.inf==='on',local:!!options.guest});
    else {const theme=baseRoomTheme(B);this.hudText('第二关',376,4,'#e1e6db',7,'right');this.hudText(theme.code+' · '+theme.name,376,17,theme.accent,5.8,'right');}
    this.hudText('最高分  '+String(Math.max(options.highScore||0,G.score)).padStart(6,'0'),192,5,'#b8c4b9',6,'center',84);
    const target=B.targets.find(t=>t.k==='bcore'),core=B.targets.find(t=>t.k==='core');
    if(target&&!B.dead){
      this.hudText('中枢',151,17.5,'#c9b884',5.3);this.rect(166,17.5,66,5.5,'#4b605d');this.rect(166.5,18,65,4.5,'#111c20');
      this.rect(167,18.5,64*Math.max(0,target.hp/target.max),3.5,B.phase2?'#ef8b48':'#b16c3f');
      for(let i=1;i<4;i++)this.rect(167+i*16,18.5,.45,3.5,'#19262b');
    }else this.hudText(B.dead?'中枢已摧毁':B.def.boss==='eye'?B.bossPhase==='reveal'?'上方装置启动中':`防卫装置 ${bossDevicesRemaining(B)} / 6`:B.cleared?'通道已开启':B.targets.some(t=>t.k==='switch'&&t.hp>0)?'跳跃射击上方机关':core&&baseCoreShielded(B,G.empT)?'先摧毁中层炮台':'趴下射击下层核心',192,18,'#b4c8c7',5.3,'center',90);
    if(G.bannerT>0&&G.bannerText)this.hudText(G.bannerText,192,43,'#e4c995',6,'center',230);
    const aimHint=deviceAimHint(B)||(B.bossPhase==='mover'&&!B.dead?'按上举枪 · 射击顶部装置':null);
    if(aimHint&&!(G.bannerT>0))this.hudText(aimHint,192,38,'#d9e8bd',6,'center',180);
    if(B.cleared&&B.trans<=0&&!B.def.boss){
      this.hudText('前往'+nextBaseRoomTheme(B).name+' · 按上前进',192,151,'#d9e8de',6,'center',120);
      const yy=164+Math.sin(G.time*4)*1.2;this.line(188,yy,192,yy-4,'#c1dfd8',1);this.line(192,yy-4,196,yy,'#c1dfd8',1);
    }
    if(B.exitReady)this.hudText(options.players.some(p=>p.liftSide)?'乘升降梯前往第三关':'两侧升降梯已开放 · 向左 / 右进入',192,154,'#d9e8bd',6,'center',220);
    g.restore();
  }
  transitionTunnel(opacity=1){
    const g=this.g;g.save();g.globalAlpha=opacity;this.rect(0,0,384,216,'#020504');
    // Dark rock edges evoke the shaft beyond the opened base door.
    for(let y=-16;y<232;y+=24)for(const x of [-7,370]){
      if(!this.sprite('rock',x+(Math.floor(y/24)%2)*3,y,23,26))this.rect(x,y,22,25,'#283b27');
    }
    g.restore();
  }
  render(destination,G,options){
    this.prepare(destination);this.state=G;const g=this.g,B=G.base;
    if(G.mode==='intro'){
      this.backdrop();g.save();g.globalAlpha=.82;this.rect(0,0,384,216,'#020c13');g.restore();
      this.hudText('第二关',192,63,'#e7e8db',16,'center');this.hudText('地下指挥所',192,88,'#d1b376',8,'center');
      this.figure({x:options.online?174:192,y:158,onGround:true},StageOneArt.playerRole(options.online));
      if(options.online)this.figure({x:213,y:158,onGround:true},'blue');
      this.present(destination);return;
    }
    if(Number.isFinite(B.exitRollT)){
      this.transitionTunnel();
      for(const [i,p]of options.players.entries())if(!p.dead){const visual=baseExitRollActor(p,B.exitRollT,i,options.online);this.figure(visual.player,StageOneArt.playerRole(options.online,i),visual.scale);}
      this.present(destination);return;
    }
    const trans=B.trans>0?Math.max(0,Math.min(1,1-B.trans/1.3)):0;
    g.save();if(G.shake>0)g.translate(Math.sin(G.t*1.71)*G.shake*.55,Math.cos(G.t*1.13)*G.shake*.35);
    if(trans>0){g.translate(192,105);g.scale(1+trans*trans*1.25,1+trans*trans*1.25);g.translate(-192,-105);}
    this.backdrop(B);if(B.def.boss)this.bossWall(B);this.floorEmblem(B);this.roomIdentity(B);this.mineLaunchers(B);this.portal(B);
    for(const target of B.targets)this.target(target,B);
    // Floor drops travel with the same advancing room transform, behind the actors.
    this.groundItems(G);
    g.restore();
    this.soldiers(B);if(!B.cleared&&!B.def.boss&&!B.dead)this.barrier();this.soldiers(B,true);
    this.shots(G);
    if(trans>=BASE_GATE_ROLL_START)this.transitionTunnel(Math.min(1,(trans-BASE_GATE_ROLL_START)/.08));
    this.sideLifts(G,options.players);
    if(G.decoyT>0)this.figure({x:G.decoyX,y:204,onGround:true,camoT:1},'blue');
    for(const [i,p]of options.players.entries()){
      if(trans>0){
        const visual=baseGateTransitionActor(p,trans,i,options.online);
        this.figure(visual.player,StageOneArt.playerRole(options.online,i),visual.scale);
      }else this.figure(p,StageOneArt.playerRole(options.online,i));
    }
    this.effects(G.fx);this.hud(G,options);
    if(G.flashT>0){g.save();g.globalAlpha=Math.min(.6,G.flashT*2);this.rect(0,0,384,216,'#fff7e8');g.restore();}
    this.present(destination);
  }
}
