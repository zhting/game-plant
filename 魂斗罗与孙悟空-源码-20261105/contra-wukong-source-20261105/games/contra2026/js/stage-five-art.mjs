import { HUD_PLAYER_X } from './hud-layout.mjs';
import { StageOneArt } from './stage-one-art.mjs?v=single-enemy-rifle-1';
import { COMBAT_ASSETS, EQUIPMENT_SUPPLY, EQUIPMENT_TURRET, drawExplosion, drawEquipmentSupply, drawEquipmentTurret } from './combat-art.mjs?v=combat-polish-1';
import { STAGE_FIVE_ROUTE, FOREST_GRENADIERS, snowDefenderBox, fortressEscortPort } from './stage-five-combat.mjs?v=fortress-saucers-1';
import { ThermalMaterialCache, thermalSeconds } from './stage-five-thermal.mjs?v=thermal-vision-2';
import {WINTER_TANK_CORE_ASSET,drawWinterTankCore} from './winter-tank-core-art.mjs?v=tank-core-2';
import {drawFrozenEnemy} from './enemy-freeze-art.mjs?v=enemy-freeze-2';

export const STAGE_FIVE_ASSETS=Object.freeze({
  enemyUniform:'/games/contra2026/assets/stage5/enemy-snow-upper.webp',
  polar:'/games/contra2026/assets/stage5/polar-mountains.webp',
  snowPines:'/games/contra2026/assets/stage5/snow-pines.webp',
  snowLedge:'/games/contra2026/assets/stage5/snow-rock-ledge.webp',
  iceLedge:'/games/contra2026/assets/stage5/frozen-rock-ledge.webp',
  winterTank:'/games/contra2026/assets/stage5/winter-tank.webp',
  tankCore:WINTER_TANK_CORE_ASSET,
  winterWeapons:'/games/contra2026/assets/stage5/winter-weapons.webp',
  fieldArtillery:'/games/contra2026/assets/stage5/manned-field-cannon.webp',
  forestAmbusher:'/games/contra2026/assets/stage5/forest-ambusher.webp',
  flyingFortress:'/games/contra2026/assets/stage5/flying-fortress.webp',
  polarSky:'/games/contra2026/assets/stage5/polar-sky-atlas.webp',
  fieldBunkers:'/games/contra2026/assets/stage5/winter-field-bunkers.webp',
  ...COMBAT_ASSETS
});
export const WINTER_SUPPLY_ART=Object.freeze({...EQUIPMENT_SUPPLY,width:26});
export const WINTER_TURRET_ART=Object.freeze({...EQUIPMENT_TURRET,scale:.05});
export const WINTER_BUNKER_ART=Object.freeze({main:[11,17,1514,462],utility:[24,500,1500,484]});
export const POLAR_SKY=Object.freeze({cloud:[9,34,1519,482],fighter:[156,618,1266,310]});
export const FLYING_FORTRESS_ART=Object.freeze({fortress:[233,11,1070,570],base:[17,621,1502,387],width:146});
export const SNOW_LEDGE=Object.freeze({bounds:Object.freeze([30,148,2113,493]),cap:340,walk:.13});
export const ICE_LEDGE=Object.freeze({bounds:Object.freeze([26,118,2121,527]),cap:340,walk:.13});
export const WINTER_TANK=Object.freeze({bounds:Object.freeze([21,128,1734,668]),width:180});
export const WINTER_WEAPONS=Object.freeze({
  cannon:{bounds:[76,15,2018,276],scale:67/2018,anchor:[63,127],angle:.232},
  broken:{bounds:[992,284,738,244],scale:67/2018,anchor:[63,127],angle:.232},
  machineGun:{bounds:[987,538,585,171],scale:23/585,anchor:[15,153],angle:0},
  mount:{bounds:[1350,538,222,171],scale:23/585,anchor:[15,153],angle:0}
});
export const SNOW_DEFENDERS=Object.freeze({
  cannon:{idle:[326,90,893,413],fire:[316,576,991,405],scale:34/413,anchors:[[750,503],[750,981]]},
  ambusher:{cover:[125,159,233,257],windup:[551,11,342,405],release:[1065,79,448,334],scale:21/257,
    anchors:{cover:[245,416],windup:[715,416],release:[1235,413]},faces:{cover:-1,windup:1,release:1}},
  tree:[484,400,599,619]
});
const mod=(n,d)=>((n%d)+d)%d;
const noise=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return((n^(n>>>16))>>>0)/4294967296;};

/** Adjacent snow and ice belong to a single cliff, with no rounded internal cap. */
export function snowGroundGroups(solids){
  const groups=[];
  for(const slab of solids.filter(s=>s.g&&!s.gone).sort((a,b)=>a.x-b.x)){
    const last=groups.at(-1);
    if(last&&Math.abs(last.x+last.w-slab.x)<.1&&last.y===slab.y)last.w+=slab.w;
    else groups.push({...slab});
  }
  return groups;
}
export function snowParticle(index,time,wind=0,near=false){
  const seed=index+(near?901:37),speed=(near?26:13)+noise(seed*3)*(near?24:15),gust=Math.sin(time*.9+seed)*7;
  const r=(near?.6:.22)+noise(seed*31)*(near?1.05:.54);
  return {x:mod(noise(seed*13)*460+time*(wind*(near?1.25:.6)-(near?9:3))+gust,460)-38,
    y:mod(noise(seed*29)*250+time*speed,250)-17,
    length:r*4,r,angle:time*(noise(seed*7)-.5)+seed,alpha:.48+noise(seed*41)*.45};
}
export const snowfallProfile=storm=>({far:120,near:Math.floor(130+80*Math.max(0,Math.min(1,storm)))});
export function polarClouds(time,camera=0){
  return [0,1].flatMap(depth=>Array.from({length:3},(_,i)=>({
    x:mod(i*360-time*(depth?10:5)-camera*(depth?.09:.04)+Math.sin(time*.23+depth)*5,1080)-390,
    y:-19+depth*28+Math.sin(time*.09+i)*3,w:depth?410:370,alpha:depth?.43:.3
  })));
}
export function fighterFlyby(time){
  if(time<9)return[];const cycle=Math.floor((time-9)/26),age=mod(time-9,26);if(age>6.4)return[];
  const face=cycle%2?1:-1,count=cycle%3===2?3:cycle%3===1?2:1;
  return Array.from({length:count},(_,i)=>({x:face<0?454-age*88+i*26:-70+age*88-i*26,
    y:45+(cycle%3)*9+i*10+Math.sin(age*.6)*2,w:33-i*5,face,alpha:.68-i*.12}));
}

export class StageFiveArt extends StageOneArt{
  constructor(options){
    super({...options,assets:STAGE_FIVE_ASSETS});this.baseArt=options.baseArt;this.hdActors=this.baseArt.hdActors;
    this.footprints=[];this.lastFootstep=new Map();this.lastTick=-1;
    this.heatMaterials=new ThermalMaterialCache(this.createCanvas);this.heatFrames=new WeakMap();this.thermalPainting=false;this.thermalKind='cold';
  }
  inspect(){return{...super.inspect(),thermal:{active:!!this.thermalActive,...this.heatMaterials.inspect()}};}
  frame(sheet,name,w,h){return this.baseArt.frame(sheet,name,w,h);}
  withThermalMaterial(kind,paint){const previous=this.thermalKind;this.thermalKind=kind;try{return paint();}finally{this.thermalKind=previous;}}
  actor(p,role,enemy=false){
    if(!this.thermalPainting)return super.actor(p,role,enemy);
    return this.withThermalMaterial(p.ride?'vehicle':'human',()=>super.actor({...p,invT:0,giantGraceT:0,giantHitT:0,camoT:0},role,enemy));
  }
  path(points,color){const g=this.g;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=color;g.fill();}
  snowCap(x,y,r=10){
    const g=this.g;g.fillStyle='#a6c1d5';g.beginPath();g.ellipse(x,y+1,r,2.3,0,0,Math.PI*2);g.fill();
    g.fillStyle='#f0f5f4';g.beginPath();g.ellipse(x-1,y-1,r,2.5,0,0,Math.PI*2);g.fill();
    this.line(x-r*.6,y-2.2,x+r*.4,y-2.2,'#fffdf2',.6);
  }
  backdrop(cx){
    const g=this.g;this.rect(0,0,384,216,'#48677d');
    if(this.loaded.has('polar')){
      // Fade the repeating ridge into its neighbor instead of mirroring a peak.
      const span=620,overlap=92,stride=span-overlap,start=Math.floor(cx*.13/stride)-1;
      for(let tile=start;tile<start+3;tile++){
        const x=tile*stride-cx*.13;
        if(tile===start)g.drawImage(this.images.polar,x,0,span,216);
        else{
          for(let band=0;band<16;band++){g.save();g.globalAlpha=(band+.5)/16;g.drawImage(this.images.polar,band*overlap/16/span*1672,0,overlap/16/span*1672,941,x+band*overlap/16,0,overlap/16+.1,216);g.restore();}
          g.drawImage(this.images.polar,overlap/span*1672,0,(span-overlap)/span*1672,941,x+overlap,0,span-overlap,216);
        }
      }
    }
    this.skyMotion(cx);
    const fog=g.createLinearGradient(0,107,0,186);fog.addColorStop(0,'rgba(113,149,173,0)');fog.addColorStop(1,'rgba(95,132,155,.59)');this.rect(0,107,384,79,fog);
    if(this.loaded.has('snowPines'))for(const depth of [0,1]){
      const h=depth?96:64,image=this.images.snowPines,w=h*image.naturalWidth/image.naturalHeight,stride=w-18,parallax=depth?.52:.3,base=depth?187:171;
      g.save();g.globalAlpha=depth?.84:.38;g.filter=depth?'saturate(.72) brightness(.86)':'saturate(.4) brightness(.8)';
      for(let tile=Math.floor(cx*parallax/stride)-1;tile<(cx*parallax+384)/stride+1;tile++)g.drawImage(image,tile*stride-cx*parallax,base-h,w,h);
      g.restore();
    }
    this.bunkers(cx);
    this.snow(false);
  }
  bunkers(cx){
    if(!this.loaded.has('fieldBunkers'))return;
    const g=this.g;
    for(const [i,worldX]of [700,1500,2350,3110].entries()){
      const [sx,sy,sw,sh]=WINTER_BUNKER_ART[i%2?'utility':'main'],w=[116,108,120,112][i],h=w*sh/sw,x=worldX-cx*.69+40-w/2;
      if(x+w<-10||x>394)continue;
      g.save();g.globalAlpha=.94;g.filter='saturate(.72) brightness(.94)';
      g.drawImage(this.images.fieldBunkers,sx,sy,sw,sh,x,176-h,w,h);g.restore();
    }
  }
  skyMotion(cx){
    if(!this.loaded.has('polarSky'))return;const g=this.g,image=this.images.polarSky,t=this.state.time;
    const cloud=(p)=>{const [sx,sy,sw,sh]=POLAR_SKY.cloud;g.save();g.globalAlpha=p.alpha;g.drawImage(image,sx,sy,sw,sh,p.x,p.y,p.w,p.w*sh/sw);g.restore();};
    const layers=polarClouds(t,cx);for(const p of layers.slice(0,3))cloud(p);
    for(const p of fighterFlyby(t)){
      const [sx,sy,sw,sh]=POLAR_SKY.fighter;g.save();g.globalAlpha=p.alpha;g.translate(p.x,p.y);g.scale(-p.face,1);
      const trail=g.createLinearGradient(16,0,98,0);trail.addColorStop(0,'rgba(224,237,242,.36)');trail.addColorStop(1,'rgba(224,237,242,0)');
      this.line(16,1,98,2,trail,.65);this.line(16,2.1,88,3.3,trail,.4);
      g.drawImage(image,sx,sy,sw,sh,-p.w/2,-p.w*sh/sw/2,p.w,p.w*sh/sw);g.restore();
    }
    for(const p of layers.slice(3))cloud(p);
  }
  snow(near){
    const g=this.g,storm=this.state.s5?.bliz||0,count=snowfallProfile(storm)[near?'near':'far'];
    g.save();
    for(let i=0;i<count;i++){
      const p=snowParticle(i,this.state.time,this.state.s5?.wind||0,near);g.globalAlpha=p.alpha*(near?.85:.65);g.fillStyle=near?'#f5faf8':'#d5e4eb';
      if(near&&i%3===0){
        g.save();g.translate(p.x,p.y);g.rotate(p.angle);g.beginPath();g.moveTo(0,-p.r);g.lineTo(p.r*.8,-p.r*.25);g.lineTo(p.r*.65,p.r*.7);g.lineTo(-p.r*.35,p.r);g.lineTo(-p.r,p.r*.1);g.lineTo(-p.r*.55,-p.r*.65);g.closePath();g.fill();g.restore();
      }else{g.beginPath();g.ellipse(p.x,p.y,p.r,p.r*.8,0,0,Math.PI*2);g.fill();}
    }
    g.restore();
  }
  ledge(s,height,key='snowLedge',art=SNOW_LEDGE,repeat=true){
    if(!this.loaded.has(key))return;
    const g=this.g,image=this.images[key],[sx,sy,sw,sh]=art.bounds,scale=height/sh,cap=art.cap*scale;
    const y=s.y-height*art.walk,left=Math.min(cap,s.w*.23),right=left,middle=sw-2*art.cap,tileW=middle*scale;
    g.drawImage(image,sx,sy,art.cap,sh,s.x,y,left,height);
    g.save();g.beginPath();g.rect(s.x+left,y,s.w-left-right,height);g.clip();
    const overlap=Math.min(8,tileW*.1);
    if(!repeat)g.drawImage(image,sx+art.cap,sy,middle,sh,s.x+left,y,s.w-left-right,height);
    else for(let x=s.x+left;x<s.x+s.w-right;x+=tileW-overlap){
      if(x===s.x+left)g.drawImage(image,sx+art.cap,sy,middle,sh,x,y,tileW,height);
      else{
        // Fade across an actual overlap, retaining natural rock proportions.
        for(let band=0;band<8;band++){g.save();g.globalAlpha=(band+.5)/8;g.drawImage(image,sx+art.cap+band*overlap/scale/8,sy,overlap/scale/8,sh,x+band*overlap/8,y,overlap/8+.1,height);g.restore();}
        g.drawImage(image,sx+art.cap+overlap/scale,sy,middle-overlap/scale,sh,x+overlap,y,tileW-overlap,height);
      }
    }
    g.restore();g.drawImage(image,sx+sw-art.cap,sy,art.cap,sh,s.x+s.w-right,y,right,height);
  }
  iceSurface(s){
    if(!this.loaded.has('iceLedge'))return;
    const height=s.g?58:25,top=s.y-height*ICE_LEDGE.walk,key=`ice-surface:${s.x}:${s.y}:${s.w}`;
    let layer=this.cache.get(key);
    if(!layer){
      layer=this.createCanvas();layer.width=Math.ceil(s.w*this.scale);layer.height=Math.ceil(height*this.scale);
      const ink=layer.getContext('2d');ink.setTransform(this.scale,0,0,this.scale,-s.x*this.scale,-top*this.scale);
      const previous=this.g;this.g=ink;
      try{this.ledge(s,height,'iceLedge',ICE_LEDGE,false);}finally{this.g=previous;}
      // Blend the frozen material into the shared cliff instead of adding an
      // independent slab with straight borders or internal rounded end caps.
      ink.globalCompositeOperation='destination-in';
      const edge=Math.min(s.g?18:8,s.w*.2),fade=ink.createLinearGradient(s.x,0,s.x+s.w,0);
      fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(edge/s.w,'#000');fade.addColorStop(1-edge/s.w,'#000');fade.addColorStop(1,'rgba(0,0,0,0)');
      ink.fillStyle=fade;ink.fillRect(s.x,top,s.w,height);
      const depth=ink.createLinearGradient(0,top,0,top+height);depth.addColorStop(0,'#000');depth.addColorStop(.52,'#000');depth.addColorStop(.82,'rgba(0,0,0,0)');
      ink.fillStyle=depth;ink.fillRect(s.x,top,s.w,height);ink.globalCompositeOperation='source-over';
      this.cache.set(key,layer);
    }
    this.g.drawImage(layer,s.x,top,s.w,height);
  }
  ground(solids,cx){
    const groups=snowGroundGroups(solids);
    for(const s of [...groups,...solids.filter(s=>!s.g&&!s.gone)])if(s.x+s.w>=cx-20&&s.x<=cx+404)this.ledge(s,s.g?58:25);
    for(const s of solids)if(s.ice&&!s.gone&&s.x+s.w>=cx&&s.x<=cx+384)this.iceSurface(s);
    if(cx+384>STAGE_FIVE_ROUTE.steelStart){
      const x=Math.max(cx,STAGE_FIVE_ROUTE.steelStart),end=Math.min(cx+384,STAGE_FIVE_ROUTE.length);
      this.rect(x,176,end-x,40,'#1a4657');
      for(let y=177;y<216;y+=7){this.rect(x,y,end-x,2,'#72aeba');this.line(x,y+2,end,y+2,'#d6e9e6',.5);this.line(x,y+5,end,y+5,'#0a2335',1.1);}
      for(let xx=Math.floor(x/64)*64;xx<end;xx+=64){this.line(xx,176,xx,216,'#0c2a3b',1);this.disc(xx+3,179,.6,'#dce3db');}
      this.line(x,175.4,end,175.4,'#eff7f1',1.3);
    }
  }
  base(cx){
    if(!this.loaded.has('flyingFortress'))return;const x=STAGE_FIVE_ROUTE.length-265;if(x>cx+390||x+300<cx)return;
    const [sx,sy,sw,sh]=FLYING_FORTRESS_ART.base,w=300;this.g.drawImage(this.images.flyingFortress,sx,sy,sw,sh,x,176-w*sh/sw,w,w*sh/sw);
  }
  fortress(F){
    if(!F?.active)return;const g=this.g,art=FLYING_FORTRESS_ART,[sx,sy,sw,sh]=art.fortress,w=art.width,h=w*sh/sw;
    g.save();if(F.dead){g.globalAlpha=Math.max(0,F.deadT/3);g.filter='grayscale(.8) brightness(.6)';}
    else if(F.parts.some(p=>p.flash>0))g.filter='brightness(1.45)';
    if(this.loaded.has('flyingFortress'))g.drawImage(this.images.flyingFortress,sx,sy,sw,sh,F.x-w/2,F.y-h*.5,w,h);
    g.restore();if(F.dead)return;
    for(const part of F.parts.slice(0,2))if(part.hp<=0){this.disc(part.x+7,part.y+7,5,'#10202b');this.line(part.x+2,part.y+4,part.x+12,part.y+10,'#56646a',1);}
    if(F.escortWarning)for(const side of [-1,1]){
      const {x,y}=fortressEscortPort(F,side);
      this.light(x,y,8,'rgba(255,146,62,.48)');
      this.line(x-3,y,x+3,y,'#ffd8a3',1.15);
    }
    const engine=F.parts[2];this.light(F.x,F.y+28,12+Math.sin(this.state.time*16)*2,F.warning?'rgba(255,125,45,.5)':'rgba(241,102,38,.2)');
    if(F.warning){
      this.disc(F.x,F.y+25,2.4+Math.sin(this.state.time*24)*.6,'#fff0bb');
      const angle=Math.atan2(F.aimY-(F.y+27),F.aimX-F.x);g.save();g.globalAlpha=.35;
      for(let d=16;d<105;d+=11)this.line(F.x+Math.cos(angle)*d,F.y+27+Math.sin(angle)*d,F.x+Math.cos(angle)*(d+3),F.y+27+Math.sin(angle)*(d+3),'#f6b278',.7);g.restore();
    }
    if(engine.hp<engine.max*.5&&Math.floor(this.state.time*12)%3===0)this.light(F.x,F.y+10,7,'rgba(237,150,38,.25)');
  }
  traces(players){
    const G=this.state;
    if(G.t<this.lastTick){this.footprints=[];this.lastFootstep.clear();}this.lastTick=G.t;
    this.footprints=this.footprints.filter(p=>G.time-p.time<3);
    for(const [i,p]of players.entries())if(!p.dead&&p.onGround&&!p.ride&&Math.abs(p.vx)>4){
      const last=this.lastFootstep.get(i);
      if(!last||Math.abs(last.x-p.x)>9||last.y!==p.y){this.lastFootstep.set(i,{x:p.x,y:p.y});this.footprints.push({x:p.x,y:p.y,time:G.time,ice:p.support?.ice});}
    }
    for(const p of this.footprints){this.g.save();this.g.globalAlpha=(1-(G.time-p.time)/3)*.32;this.line(p.x-2,p.y+.6,p.x+1,p.y+.6,p.ice?'#e0faff':'#4a728a',1.3);this.g.restore();}
    for(const p of players)if(!p.dead&&p.onGround&&!p.ride&&Math.abs(p.vx)>7){
      for(let i=0;i<5;i++){const phase=mod(G.time*4+i*.2,1),direction=Math.sign(p.vx);this.g.save();this.g.globalAlpha=(1-phase)*.45;this.disc(p.x-direction*(3+phase*12),p.y-1-Math.sin(phase*Math.PI)*3,.3+phase*.9,'#edf5f6');this.g.restore();}
    }
  }
  escortSaucer(e){
    const g=this.g,thermal=this.thermalPainting;
    g.save();g.translate(e.x,e.y);g.rotate(Math.max(-.16,Math.min(.16,e.vx*e.vy*.000014)));
    const shell=g.createLinearGradient(0,-4.6,0,4.3);
    shell.addColorStop(0,thermal?'#a74c79':'#d1d9db');
    shell.addColorStop(.38,thermal?'#723666':'#778894');
    shell.addColorStop(.57,thermal?'#592551':'#4f6471');
    shell.addColorStop(1,thermal?'#2d2650':'#1f2a33');
    const lamp=thermal?'#ffdda5':'#ffad60';
    this.light(-Math.sign(e.vx)*7,2,5,thermal?'rgba(255,100,90,.38)':'rgba(255,123,41,.37)');
    g.beginPath();g.moveTo(-11,0);g.lineTo(-6,-2);g.lineTo(-3.5,-4.4);g.lineTo(3.5,-4.4);
    g.lineTo(6,-2);g.lineTo(11,0);g.lineTo(7,2.4);g.lineTo(3.9,3.7);g.lineTo(-3.9,3.7);g.lineTo(-7,2.4);g.closePath();
    g.fillStyle=shell;g.fill();g.strokeStyle='#111b27';g.lineWidth=.65;g.stroke();
    this.rect(-2.8,-3.5,5.6,1.8,thermal?'#75406f':'#172639');
    this.line(-2.4,-3.4,2.3,-3.4,thermal?'#cc7191':'#8db0d6',.46);
    this.line(-8.5,0,8.5,0,thermal?'#d4759a':'#b3bfc0',.55);
    for(const x of [-6,0,6])this.disc(x,1.6,x===0?.85:.53,lamp);
    this.line(-3,3.1,3,3.1,lamp,.55);
    g.restore();
  }
  enemy(e){
    if(e.t!=='box'&&drawFrozenEnemy(this,e,()=>this.enemy(e)))return;
    if(e.t==='fortressSaucer'){this.escortSaucer(e);return;}
    const g=this.g;g.save();g.filter='saturate(.2) brightness(1.22)';
    if(e.t==='tur'){
      g.filter='none';this.winterTurret(e);
    }else if(e.t==='artillery'){
      g.filter='none';const art=SNOW_DEFENDERS.cannon,fire=e.phase==='windup'||e.phase==='release',frame=fire?art.fire:art.idle,[ax,ay]=art.anchors[fire?1:0];
      if(this.loaded.has('fieldArtillery')){
        const [sx,sy,sw,sh]=frame;g.save();g.translate(e.x,e.y);g.scale(-e.face,1);if(e.flash>0)g.filter='brightness(1.6) saturate(.6)';
        g.drawImage(this.images.fieldArtillery,sx,sy,sw,sh,(sx-ax)*art.scale,(sy-ay)*art.scale,sw*art.scale,sh*art.scale);g.restore();
      }
      if(e.phase==='windup')this.light(e.x+e.face*35,e.y-30,4,'rgba(244,153,53,.3)');
      if(e.recoil>.12)this.muzzle(e.x+e.face*35,e.y-30);
    }else if(e.t==='mor'){
      super.actor({...e,x:e.x-7,vx:0,onGround:true,ay:0},'enemy',true);g.filter='none';
      const recoil=e.recoil>0?1.3:0;this.line(e.x-1,e.y-3,e.x+9-recoil,e.y-24+recoil,'#182f3c',4.8);this.line(e.x-1,e.y-4,e.x+8-recoil,e.y-24+recoil,'#9baeb8',1.2);
      this.disc(e.x+9-recoil,e.y-24+recoil,2,'#10222e');this.line(e.x+1,e.y-3,e.x+5,e.y,'#385160',1.5);
      this.snowCap(e.x,e.y-1,13);
    }else if(e.t==='box'){
      g.filter='none';this.winterSupplyCase(e);
    }else super.enemy(e);
    g.restore();
  }
  winterSupplyCase(e){
    drawEquipmentSupply(this.g,this.images.equipmentSupply,e,WINTER_SUPPLY_ART.width);
  }
  winterTurret(e){
    const angle=(e.idx??6)*Math.PI/6,frozen=(this.state?.freezeT||0)>0,age=1.5-e.fireT;
    drawEquipmentTurret(this.g,this.images.equipmentTurret,e,{scale:.05,pivotY:e.y,frozen,
      paintBarrel:paint=>this.withThermalMaterial(age>=0&&age<.2?'weaponHot':'weapon',paint)});
    if(!frozen&&age>=0&&age<.08)this.muzzle(e.x+Math.cos(angle)*11,e.y+Math.sin(angle)*11);
  }
  ambushers(enemies,cx){
    if(!this.loaded.has('forestAmbusher'))return;
    const g=this.g,art=SNOW_DEFENDERS.ambusher;
    const pose=(e,name,alpha)=>{
      if(alpha<=0)return;const g=this.g,[sx,sy,sw,sh]=art[name],[ax,ay]=art.anchors[name];g.save();g.globalAlpha=alpha;
      g.translate(e.x+e.face*(5+13*(e.peek||0)),e.y-6);g.scale(e.face/art.faces[name],1);if(e.flash>0)g.filter='brightness(1.6)';
      this.withThermalMaterial('human',()=>g.drawImage(this.images.forestAmbusher,sx,sy,sw,sh,(sx-ax)*art.scale,(sy-ay)*art.scale,sw*art.scale,sh*art.scale));g.restore();
    };
    for(const worldX of FOREST_GRENADIERS)if(worldX>cx-70&&worldX<cx+454){
      const e=enemies.find(e=>e.t==='grenadier'&&e.x===worldX&&!e.dead);
      if(e){
        const paint=()=>{const peek=e.peek||0;pose(e,'cover',1-peek);pose(e,e.phase==='release'?'release':'windup',peek);};
        if(!drawFrozenEnemy(this,e,paint))paint();
      }
      const [sx,sy,sw,sh]=SNOW_DEFENDERS.tree,h=58,w=h*sw/sh,x=worldX+6-w*.5,y=178-h;
      g.save();
      // Exclude the neighboring animation's boots from the atlas's narrow tip gutter.
      const tip=18/sh*h,middle=x+(700-sx)/sw*w;g.beginPath();g.rect(middle,y,44/sw*w,tip);g.rect(x,y+tip,w,h-tip);g.clip();
      g.filter='saturate(.7) brightness(.85)';this.withThermalMaterial('cold',()=>g.drawImage(this.images.forestAmbusher,sx,sy,sw,sh,x,y,w,h));g.restore();
    }
  }
  ordnance(bullets){
    const g=this.g;
    for(const b of bullets)if(!b.dead&&b.snowOrdnance){
      if(b.snowOrdnance==='blast'){
        drawExplosion(g,this.images.explosionAtlas,{x:b.x,y:b.y,t:.2-b.fuse,life:.2,s:12});
      }else if(b.snowOrdnance==='grenade'){
        g.save();g.translate(b.x,b.y);g.rotate(b.rotation||0);this.disc(0,0,2.6,'#162f27');this.disc(-.4,-.4,1.9,'#92aa58');
        this.line(-1.7,0,1.7,0,'#344c31',.7);this.rect(-.8,-3.3,1.6,1.6,'#b4c2b1');g.restore();
        if(b.fuse<.6&&Math.floor(b.fuse*14)%2){this.light(b.x,b.y,6,'rgba(255,114,42,.28)');this.disc(b.x,b.y-3,1,'#ffca66');}
      }else{
        this.light(b.x,b.y,8,'rgba(255,112,25,.3)');this.disc(b.x,b.y,4,'#d95122');this.disc(b.x-.8,b.y-.6,2.7,'#ffc169');this.disc(b.x-1.3,b.y-1.2,1,'#fff5c4');
      }
    }
  }
  weapon(name,T,{recoil=0,flash=false,scorched=false}={}){
    if(!this.loaded.has('winterWeapons'))return;
    const part=WINTER_WEAPONS[name],[sx,sy,sw,sh]=part.bounds,w=sw*part.scale,h=sh*part.scale,g=this.g;
    g.save();g.translate(T.x+part.anchor[0]+recoil,part.anchor[1]);g.rotate(part.angle);
    if(T.dead||scorched)g.filter='grayscale(.7) brightness(.55)';else if(flash)g.filter='brightness(1.6) saturate(.65)';
    const age=(T.phase2?2:2.8)-T.canT,hot=name==='cannon'&&age>=0&&age<.15||name==='machineGun'&&T.burst>0;
    this.withThermalMaterial(hot?'weaponHot':'weapon',()=>g.drawImage(this.images.winterWeapons,sx,sy,sw,sh,-w,-h*.5,w,h));g.restore();
  }
  tank(T){
    if(!T||T.x>this.state.camX+400||T.x+170<this.state.camX)return;
    const g=this.g,[sx,sy,sw,sh]=WINTER_TANK.bounds,w=WINTER_TANK.width,h=w*sh/sw,x=T.x-14,y=176-h;
    const [mg,can,core]=T.parts;
    g.save();if(T.dead)g.filter='grayscale(1) brightness(.48)';
    if(this.loaded.has('winterTank'))g.drawImage(this.images.winterTank,sx,sy,sw,sh,x,y,w,h);
    g.restore();
    const tread=mod(T.tread,6);
    for(let k=0;k<26;k++){const xx=T.x-4+k*6+tread;if(xx<T.x+148){this.line(xx,172,xx-1.2,175,'#9caab3',.6);this.line(xx,169,xx-1.4,170,'#182a33',.7);}}
    // The source body is never stretched. Independent weapons retain the
    // original muzzle coordinates and leave readable wrecks when destroyed.
    const shotAge=(T.phase2?2:2.8)-T.canT,recoil=T.active&&shotAge>=0&&shotAge<.14?2*(1-shotAge/.14):0;
    this.weapon(can.hp>0?'cannon':'broken',T,{recoil:can.hp>0?recoil:0,flash:can.flash>0});
    this.weapon(mg.hp>0?'machineGun':'mount',T,{flash:mg.flash>0,scorched:mg.hp<=0});
    this.withThermalMaterial(core.hp>0?'device':'wreck',()=>drawWinterTankCore(g,this.images.tankCore,T,{time:this.state.time,thermal:this.thermalPainting}));
    if(!T.dead){
      const phase=mod(this.state.time*1.7,1);g.save();g.globalAlpha=(1-phase)*.3;this.disc(T.x+145+phase*8,130-phase*21,2+phase*7,'#a6b3bc');g.restore();
      if(T.mode==='fwd'||T.mode==='back')for(let i=0;i<8;i++){const t=mod(this.state.time*2+i*.13,1);g.save();g.globalAlpha=(1-t)*.55;this.disc(T.x+(T.mode==='fwd'?1:146)+(T.mode==='fwd'?1:-1)*t*15,175-t*8,.6+t*1.8,'#dceff2');g.restore();}
    }
  }
  storm(players,cx){
    const strength=this.state.s5?.bliz||0,g=this.g,p=players[0],thermal=players.some(p=>p.thermT>0);
    if(strength>.02){
      let fog=this.cache.get('snow-fog');if(!fog){fog=this.createCanvas();this.cache.set('snow-fog',fog);}
      if(fog.width!==this.surface.width||fog.height!==this.surface.height){fog.width=this.surface.width;fog.height=this.surface.height;}
      const ink=fog.getContext('2d');ink.setTransform(1,0,0,1,0,0);ink.clearRect(0,0,fog.width,fog.height);ink.scale(this.scale,this.scale);
      ink.fillStyle=`rgba(209,227,237,${strength*(thermal?.12:.43)})`;ink.fillRect(0,0,384,216);
      if(p){ink.globalCompositeOperation='destination-out';const field=ink.createRadialGradient(p.x-cx,p.y-18,thermal?100:32,p.x-cx,p.y-18,thermal?190:104);field.addColorStop(0,'#000');field.addColorStop(1,'rgba(0,0,0,0)');ink.fillStyle=field;ink.fillRect(0,0,384,216);ink.globalCompositeOperation='source-over';}
      g.drawImage(fog,0,0,384,216);
      for(let i=0;i<4;i++){const x=mod(i*137-this.state.time*(16+i*3),520)-100,y=178+Math.sin(this.state.time+i)*6;
        g.save();g.translate(x,y);g.scale(1,.16);const mist=g.createRadialGradient(0,0,0,0,0,63);mist.addColorStop(0,`rgba(225,240,247,${strength*.15})`);mist.addColorStop(1,'rgba(225,240,247,0)');g.fillStyle=mist;g.fillRect(-63,-63,126,126);g.restore();
      }
    }
    this.snow(true);
  }
  thermal(players,options,cx){
    const G=this.state;if(!thermalSeconds(players))return;
    const g=this.g,view=this.thermalView||(this.thermalView=this.createCanvas()),sensorScale=Math.min(4,this.scale);
    if(view.width!==384*sensorScale||view.height!==216*sensorScale){view.width=384*sensorScale;view.height=216*sensorScale;}
    // Bound the cold sensor pass independently of the display resolution.
    // Live heat silhouettes and the HUD are still painted at native resolution.
    const sensor=view.getContext('2d');sensor.setTransform(sensorScale,0,0,sensorScale,0,0);
    sensor.globalCompositeOperation='copy';sensor.drawImage(this.surface,0,0,384,216);
    sensor.globalCompositeOperation='color';sensor.fillStyle='#234d9d';sensor.fillRect(0,0,384,216);
    sensor.globalCompositeOperation='multiply';const tint=sensor.createLinearGradient(0,0,0,216);tint.addColorStop(0,'#6f6688');tint.addColorStop(1,'#577189');sensor.fillStyle=tint;sensor.fillRect(0,0,384,216);sensor.globalCompositeOperation='source-over';
    g.save();g.setTransform(this.scale,0,0,this.scale,0,0);g.drawImage(view,0,0,384,216);g.restore();
    const self=this,previousEffect=this.hdActors.frameEffect;
    this.hdActors.frameEffect=(art,frame,...args)=>{const result=previousEffect?.(art,frame,...args)||frame;self.heatFrames.set(result.canvas,{version:result.version??0,prone:!!args[1]?.prone,roll:!!args[1]?.spin});return result;};
    const proxy=new Proxy(g,{
      get(target,key){
        if(key==='drawImage')return(source,...args)=>{
          const sourceW=source.naturalWidth||source.width,sourceH=source.naturalHeight||source.height;
          const [sx,sy,sw,sh,dx,dy,dw,dh]=args.length===8?args:[0,0,sourceW,sourceH,args[0],args[1],args[2]??sourceW,args[3]??sourceH];
          const frame=self.heatFrames.get(source),kind=frame?'human':self.thermalKind;
          const actor=kind==='human'?{x:dx,y:dy,w:dw,h:dh,prone:frame?.prone,roll:frame?.roll}:null;
          const image=self.heatMaterials.image(source,[sx,sy,sw,sh],kind,{w:Math.abs(dw),h:Math.abs(dh),version:frame?.version||0,force:!frame&&typeof source.getContext==='function',actor});
          target.drawImage(image,dx,dy,dw,dh);
        };
        const value=target[key];return typeof value==='function'?value.bind(target):value;
      },
      set(target,key,value){target[key]=key==='filter'?'none':value;return true;}
    });
    this.g=proxy;this.thermalPainting=true;
    try{
      this.ambushers(G.en,cx);
      this.withThermalMaterial(G.tank?.dead?'wreck':'vehicle',()=>this.tank(G.tank));
      this.withThermalMaterial('fortress',()=>this.fortress(G.fortress));
      for(const e of G.en)if(!e.dead&&e.t!=='grenadier'&&e.x>=cx-70&&e.x<=cx+454)this.withThermalMaterial(e.t==='artillery'?'operator':e.t==='tur'?'turret':e.t==='box'?'device':'human',()=>this.enemy(e));
      for(const item of G.items)if(!item.dead)this.withThermalMaterial('device',()=>this.capsule(item.x,item.y-5,item.kind,false));
      for(const pod of G.pods)if(!pod.dead)this.withThermalMaterial('device',()=>this.capsule(pod.x,pod.y,pod.kind));
      for(const [i,p]of players.entries())if(!p.dead)this.actor(p,StageOneArt.playerRole(options.online,i));
      this.withThermalMaterial('weaponHot',()=>this.effects(G.fx));
    }finally{this.g=g;this.thermalPainting=false;this.hdActors.frameEffect=previousEffect;}
  }
  hud(G,options){
    const g=this.g;g.save();const shade=g.createLinearGradient(0,0,0,39);shade.addColorStop(0,'rgba(5,19,31,.94)');shade.addColorStop(.7,'rgba(10,29,42,.65)');shade.addColorStop(1,'rgba(10,29,42,0)');this.rect(0,0,384,39,shade);
    this.playerHud(G,G.p,{x:HUD_PLAYER_X[0],role:StageOneArt.playerRole(options.online),inventory:G.inv,selection:G.sel,cooldown:G.nadeCd,infinite:options.settings.inf==='on',local:!options.guest});
    this.hudText('最高分  '+String(Math.max(options.highScore||0,G.score)).padStart(6,'0'),192,5,'#b7cbd6',6,'center',90);
    const online=options.online&&G.p2;
    if(online)this.playerHud(G,G.p2,{x:HUD_PLAYER_X[1],blue:true,inventory:G.inv2,selection:G.sel2,cooldown:G.nadeCd2,infinite:options.settings.inf==='on',local:!!options.guest});
    else {this.hudText('第五关',330,4,'#f0f0df',7,'right');this.hudText('极地冰原',330,17,'#bdcfd7',5.8,'right');}
    if(G.fortress?.active&&!G.fortress.dead){
      const core=G.fortress.parts[2];this.hudText('空中堡垒',148,19,'#e1b082',5.2,'right');this.rect(153,19,73,4,'#2b424d');this.rect(154,20,71*Math.max(0,core.hp/core.max),2,'#e38961');
    }else if(G.tank?.active&&!G.tank.dead){
      this.hudText(G.tank.phase2?'战车暴走':'重装战车',148,19,'#ddb27e',5.2,'right');this.rect(153,19,73,4,'#2b424d');this.rect(154,20,71*Math.max(0,G.tank.parts[2].hp/G.tank.parts[2].max),2,G.tank.phase2?'#e37442':'#d4a46d');
    }else this.hudText(G.tank?.dead?'穿越雪林 · 向基地前进':G.s5?.bliz>.5?'逆风 · 留意冰面滑行':'大雪 · 小心林间手雷',192,19,'#b6d0dc',5,'center',94);
    const heatTime=thermalSeconds(options.players);
    if(heatTime>0){
      this.hudText('热像 '+Math.ceil(heatTime)+'秒',online?192:330,online?27:29,'#ffe5a0',4.8,online?'center':'right');
      const scale=g.createLinearGradient(online?176:342,0,online?208:374,0);for(const [at,color]of [[0,'#1c2b6a'],[.35,'#672189'],[.55,'#c5274e'],[.75,'#f4671d'],[1,'#fffce2']])scale.addColorStop(at,color);
      // In co-op the right header belongs to player two; keep the heat key central.
      this.rect(online?176:342,online?35:8,32,3,scale);this.hudText('冷',online?164:342,online?33:15,'#77a8d8',4.3);this.hudText('热',online?220:374,online?33:15,'#fff0b1',4.3,'right');
    }
    if(G.bannerT>0&&G.bannerText){this.rect(38,42,308,15,'rgba(5,20,31,.76)');this.hudText(G.bannerText,192,46,'#ead7ad',6.5,'center',294);}
    g.restore();
  }
  render(destination,G,options){
    this.prepare(destination);this.state=G;this.thermalActive=thermalSeconds(options.players)>0;
    if(this.baseArt.scale!==this.scale){this.baseArt.scale=this.scale;this.baseArt.cache.clear();this.baseArt.terrainCache.clear();this.hdActors.clear();}
    const g=this.g,cx=this.snap(G.camX);this.backdrop(cx);
    if(G.mode==='intro'){
      g.save();g.globalAlpha=.75;this.rect(0,0,384,216,'#04111f');g.globalAlpha=1;
      this.hudText('第五关',192,56,'#f3f2e5',17,'center');this.hudText('极地冰原',192,84,'#a5cedf',9,'center');
      this.actor({x:192,y:145,face:1,anim:0,onGround:true},StageOneArt.playerRole(options.online));this.hudText('突破战车封锁 · 迎战空中堡垒',192,166,'#b6cad3',6,'center');g.restore();this.present(destination);return;
    }
    g.save();const shake=options.settings.shake==='on'&&G.shake>0?Math.sin(G.t*9)*Math.min(2,G.shake):0;g.translate(-cx+shake,0);
    this.ambushers(G.en,cx);this.base(cx);this.ground(options.solids,cx);this.traces(options.players);this.tank(G.tank);this.fortress(G.fortress);
    for(const e of G.en)if(!e.dead&&e.t!=='grenadier'&&e.x>=cx-70&&e.x<=cx+454)this.enemy(e);
    for(const item of G.items)if(!item.dead)this.capsule(item.x,item.y-5,item.kind,false);
    for(const pod of G.pods)if(!pod.dead)this.capsule(pod.x,pod.y,pod.kind);
    for(const [i,p]of options.players.entries())this.actor(p,StageOneArt.playerRole(options.online,i));
    this.effects(G.fx);g.restore();this.storm(options.players,cx);
    // Hostile shots remain in front of the whiteout and never disappear in it.
    g.save();g.translate(-cx+shake,0);this.thermal(options.players,options,cx);this.grenades(G.gr,G.t);this.bullets(G.pb);this.bullets(G.eb.filter(b=>!b.snowOrdnance),true);this.ordnance(G.eb);g.restore();this.hud(G,options);
    if(G.flashT>0){g.save();g.globalAlpha=Math.min(.6,G.flashT*2);this.rect(0,0,384,216,'#fff8e7');g.restore();}
    this.present(destination);
  }
}
