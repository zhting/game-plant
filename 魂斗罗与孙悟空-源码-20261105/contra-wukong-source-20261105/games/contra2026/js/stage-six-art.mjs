import { StageOneArt } from './stage-one-art.mjs?v=single-enemy-rifle-1';
import { HUD_PLAYER_X } from './hud-layout.mjs';
import { FLAME_JET_ASSET, drawFlameJet } from './flame-jet-art.mjs?v=multi-stage-polish-1';
import { drawFoundryAtmosphere } from './stage-six-atmosphere.mjs?v=foundry-motion-2';
import { STAGE_SIX_GALLERY } from './stage-six-combat.mjs?v=gallery-climb-return-1';
import { drawFrozenEnemy } from './enemy-freeze-art.mjs?v=enemy-freeze-2';
import {stageSixBossSpritePose} from './stage-six-boss.mjs?v=robot-jump-frames-1';
import {STAGE_SIX_EXIT} from './stage-six-exit.mjs?v=stage-six-door-1';

export const STAGE_SIX_ASSETS=Object.freeze({
  enemyUniform:'/games/contra2026/assets/stage6/enemy-foundry-upper.webp',
  foundry:'/games/contra2026/assets/stage6/foundry-hall.webp',
  robotStand:'/games/contra2026/assets/stage6/humanoid-robot-stand.webp',
  robotJump:'/games/contra2026/assets/stage6/humanoid-robot-jump.webp',
  robotJumpFrames:'/games/contra2026/assets/stage6/humanoid-robot-jump-frames-v1.webp',
  catwalk:'/games/contra2026/assets/stage6/foundry-catwalk-v2.webp',
  floorMetal:'/games/contra2026/assets/stage6/foundry-floor-v2.webp',
  lava:'/games/contra2026/assets/stage6/molten-lava-v3.webp',
  heavyGunner:'/games/contra2026/assets/stage6/heavy-gunner.webp',
  galleryColumn:'/games/contra2026/assets/stage6/flame-gallery-column.webp',
  exitDoor:'/games/contra2026/assets/stage6/foundry-exit-door-v1.webp',
  flameJets:FLAME_JET_ASSET
});
const mod=(n,d)=>((n%d)+d)%d;
const EXIT_FRAME=[264,15,706,985],EXIT_LEAF=[1060,34,278,959];

/** Factory art uses the same world coordinates as the original hazard simulation. */
export class StageSixArt extends StageOneArt {
  constructor(options){
    super({...options,assets:STAGE_SIX_ASSETS});
    this.baseArt=options.baseArt;this.hdActors=this.baseArt.hdActors;
  }
  exitDoor(state,camera){
    const d=STAGE_SIX_EXIT;if(d.x>camera+400||d.x+d.w<camera-20)return;
    const g=this.g,x=d.x,y=d.y,w=d.w,h=d.h,open=Math.max(0,Math.min(1,state.doorProgress||0));
    const left=x+8,center=x+w/2,right=x+w-8,top=y+12,floor=y+h,leafW=center-left;
    const image=this.loaded.has('exitDoor')?this.images.exitDoor:null;
    g.save();g.beginPath();g.rect(left,top,right-left,floor-top);g.clip();
    const interior=g.createLinearGradient(left,y,right,y);
    interior.addColorStop(0,'#262220');interior.addColorStop(.22,'#0d1114');
    interior.addColorStop(.76,'#080d10');interior.addColorStop(1,'#302722');
    this.rect(left,top,right-left,floor-top,interior);
    const deck=g.createLinearGradient(0,floor-18,0,floor);
    deck.addColorStop(0,'#0b0e11');deck.addColorStop(1,'#45403a');
    this.rect(left,floor-18,right-left,18,deck);
    for(const side of [-1,1]){
      const rail=center+side*leafW;
      this.line(rail,top,rail-side*6,top+9,'#59504a',.7);
      this.line(rail-side*6,top+9,rail-side*6,floor-17,'#33302d',.65);
      this.line(rail-side*6,floor-17,rail,floor,'#66564b',.8);
      this.rect(rail-side*5.6-1,top+38,2,4,'#8d5634');
    }
    this.line(left,floor-1.4,right,floor-1.4,'#7e6651',.7);
    const offset=open*open*(3-2*open)*leafW;
    if(open<1){
      g.save();g.translate(center-offset,top);
      if(image)g.drawImage(image,...EXIT_LEAF,-leafW,0,leafW,floor-top);
      else this.rect(-leafW,0,leafW,floor-top,'#39312d');
      g.restore();
      g.save();g.translate(center+offset,top);g.scale(-1,1);
      if(image)g.drawImage(image,...EXIT_LEAF,-leafW,0,leafW,floor-top);
      else this.rect(-leafW,0,leafW,floor-top,'#39312d');
      g.restore();
    }
    g.restore();
    if(image)g.drawImage(image,...EXIT_FRAME,x,y,w,h);
    else{
      this.rect(x,y,9,h,'#383530');this.rect(x+w-9,y,9,h,'#383530');this.rect(x,y,w,14,'#45413a');
    }
    const lamp=state.exitReady||open===1?'#9ce2a9':open>0?'#ffc978':'#cc8a54';
    this.rect(center-8.6,y+6.1,17.2,2.4,'#121514');
    for(let i=0;i<4;i++)this.rect(center-7.8+i*4,y+6.8,3.6,.95,lamp);
  }
  frame(sheet,name,w,h){return this.baseArt.frame(sheet,name,w,h);}
  gallery(camera){
    const q=STAGE_SIX_GALLERY;if(q.end<camera-60||q.left>camera+440)return;
    const g=this.g;
    if(this.loaded.has('galleryColumn')){
      const image=this.images.galleryColumn;
      g.drawImage(image,220,70,354,1887,q.left,q.leftTop,q.leftWidth,q.ground-q.leftTop);
      g.drawImage(image,220,70,354,1887,q.right,q.rightTop,q.rightWidth,q.ground-q.rightTop);
      g.drawImage(image,220,70,354,1887,q.end,q.endTop,q.endWidth,q.ground-q.endTop);
    }else{
      this.rect(q.left,q.leftTop,q.leftWidth,q.ground-q.leftTop,'#2c3538');
      this.rect(q.right,q.rightTop,q.rightWidth,q.ground-q.rightTop,'#2c3538');
      this.rect(q.end,q.endTop,q.endWidth,q.ground-q.endTop,'#2c3538');
    }
    // Overhead conduit joins the posts without becoming a collidable platform.
    const beamX=q.left+q.leftWidth,beamW=q.end-beamX;
    if(this.loaded.has('catwalk'))g.drawImage(this.images.catwalk,13,390,2146,120,beamX,19,beamW,7);
    else{this.rect(beamX,21,beamW,3,'#282e2d');this.line(beamX,21,q.end,21,'#8b8c80',.7);}
  }
  enemy(e){
    if(e.t!=='heavyGunner')return super.enemy(e);
    if(drawFrozenEnemy(this,e,()=>this.enemy(e),{bounds:{x:e.x-54,y:e.y-39,w:108,h:43,foot:e.y}}))return;
    const g=this.g;g.save();g.translate(e.x,e.y);if(e.face>0)g.scale(-1,1);
    if(e.flash>0)g.filter='brightness(1.7) saturate(.65)';
    const recoil=(e.recoil||0)>0?(e.recoil/.14)*1.3:0;
    if(this.loaded.has('heavyGunner'))g.drawImage(this.images.heavyGunner,105,90,1355,865,-43+recoil,-32,52,32);
    else{this.rect(-36,-24,36,4,'#707a76');this.actor({...e,x:0,y:0,onGround:true},'enemy',true);}
    g.restore();
    if(e.shotFlash>0&&!(this.state.freezeT>0))this.muzzle(e.x+e.face*41,e.y-24);
  }
  backdrop(camera){
    const g=this.g;this.rect(0,0,384,216,'#171719');
    let span=0;
    if(this.loaded.has('foundry')){
      const image=this.images.foundry,h=216,w=h*image.naturalWidth/image.naturalHeight;
      span=w;
      g.save();g.translate(-camera*.22,0);this.textureSpan(g,image,camera*.22,camera*.22+384,w,h,72);g.restore();
    }
    const shade=g.createLinearGradient(0,0,0,216);shade.addColorStop(0,'rgba(7,10,16,.18)');shade.addColorStop(.75,'rgba(18,14,15,.06)');shade.addColorStop(1,'rgba(11,9,11,.55)');this.rect(0,0,384,216,shade);
    if(span)drawFoundryAtmosphere(g,this.loaded.has('flameJets')?this.images.flameJets:null,camera,this.state.time,span);
    // Tiny drifting embers make the heat visible without obscuring projectiles.
    for(let i=0;i<24;i++){
      const phase=mod(this.state.time*(.16+(i%4)*.03)+i*.137,1);
      const x=mod(i*73-camera*.32+phase*(13+i%7),408)-12,y=190-phase*(126+i%29);
      g.globalAlpha=(1-phase)*.65;this.disc(x,y,.25+(i%3)*.13,i%3?'#f08b41':'#ffe0a1');
    }
    g.globalAlpha=1;
  }
  moltenPool(a,b){
    const g=this.g,t=this.state.time,top=186,depth=32,width=b-a;
    const wave=x=>top+.55*Math.sin(x*.14+t*1.6)+.32*Math.sin(x*.32-t*1.1);
    g.save();g.beginPath();g.moveTo(a,218);g.lineTo(a,wave(a));
    for(let x=a+2;x<b;x+=2)g.lineTo(x,wave(x));
    g.lineTo(b,wave(b));g.lineTo(b,218);g.closePath();g.clip();
    if(this.loaded.has('lava')){
      const image=this.images.lava,span=depth*image.naturalWidth/image.naturalHeight,overlap=Math.min(12,span*.16);
      const drift=t*1.4+Math.sin(t*.45)*1.5;
      g.save();g.translate(-drift,top-1);this.textureSpan(g,image,a+drift,b+drift,span,depth+2,overlap);g.restore();
      // A second, slowly counter-moving layer gives the liquid a viscous churn.
      g.save();g.globalAlpha=.15;const other=-t*.8+Math.sin(t*.7)*2;g.translate(-other,top-1);
      this.textureSpan(g,image,a+other,b+other,span,depth+2,overlap);g.restore();
    }else{
      const fallback=g.createLinearGradient(0,top,0,218);fallback.addColorStop(0,'#ffb24b');fallback.addColorStop(.35,'#d54a16');fallback.addColorStop(1,'#3e100c');this.rect(a,top,width,depth,fallback);
    }
    const depthShade=g.createLinearGradient(0,top,0,218);depthShade.addColorStop(0,'rgba(67,13,5,.04)');depthShade.addColorStop(.6,'rgba(65,5,0,.12)');depthShade.addColorStop(1,'rgba(30,3,0,.43)');this.rect(a,top,width,depth,depthShade);
    // Small, irregular gas bubbles swell and collapse inside the liquid.
    for(let i=0;i<5;i++){
      const phase=mod(t*.32+i*.231+a*.013,1),life=Math.sin(Math.PI*phase);
      const x=a+width*(.13+i*.185)+Math.sin(t*.6+i*2)*1.2,y=top+5+(i%3)*6+Math.sin(t*.8+i)*1.3,r=(.6+(i%3)*.25)*life;
      if(r<.08)continue;
      g.globalAlpha=.65*life;g.fillStyle='#521707';g.beginPath();g.ellipse(x,y,r*1.45,r*.7,0,0,Math.PI*2);g.fill();
      g.strokeStyle='#ffbb57';g.lineWidth=.35;g.beginPath();g.ellipse(x,y-.15,r*1.1,r*.53,0,Math.PI,Math.PI*1.92);g.stroke();
      g.globalAlpha=1;
    }
    g.restore();
    // Warm reflection and stray sparks stay behind the walkable deck.
    this.light((a+b)/2,top+1,width*.72,'rgba(255,107,22,.24)');
    for(let i=0;i<4;i++){
      const phase=mod(t*.4+i*.29+a*.01,1),x=a+width*(.18+i*.21)+Math.sin(t+i)*2,y=top-phase*16;
      g.save();g.globalAlpha=(1-phase)*.7;this.disc(x,y,.18+(1-phase)*.2,i%2?'#ffb04f':'#ffe29a');g.restore();
    }
  }
  floor(solids,camera){
    const g=this.g,slabs=solids.filter(s=>s.g&&!s.gone).sort((a,b)=>a.x-b.x);
    for(let i=0;i<slabs.length-1;i++){
      const a=slabs[i].x+slabs[i].w,b=slabs[i+1].x;if(b<=camera||a>=camera+384||b-a<1)continue;
      this.moltenPool(a,b);
    }
    for(const s of solids){
      if(s.gone||s.wall||s.x+s.w<camera-10||s.x>camera+394)continue;
      const left=Math.max(s.x,camera-12),right=Math.min(s.x+s.w,camera+396);
      if(s.g){
        if(this.loaded.has('floorMetal')){
          const image=this.images.floorMetal,width=s.h*image.naturalWidth/image.naturalHeight;
          g.save();g.beginPath();g.rect(s.x,s.y,s.w,s.h);g.clip();g.translate(0,s.y);
          this.textureSpan(g,image,left,right,width,s.h,Math.min(9,width*.12));g.restore();
          this.rect(left,s.y,right-left,.55,'rgba(221,195,161,.5)');
        }else{
          const metal=g.createLinearGradient(0,s.y,0,s.y+s.h);metal.addColorStop(0,'#8b7f77');metal.addColorStop(.17,'#373c3c');metal.addColorStop(1,'#151719');
          this.rect(left,s.y,right-left,s.h,metal);this.rect(left,s.y,right-left,1,'#c2aca0');
        }
        for(const x of [s.x,s.x+s.w-12])if(x>0&&x<3290){this.rect(x,s.y,12,5,'#bf963d');for(let k=0;k<12;k+=5)this.line(x+k,s.y+5,x+k+4,s.y,'#26221f',1.4);}
      }else{
        if(this.loaded.has('catwalk')){
          // The walking grate sits at s.y; handrails and supporting truss are decorative.
          g.drawImage(this.images.catwalk,13,245,2146,270,s.x,s.y-7.4,s.w,16);
        }else{
          this.rect(left,s.y,right-left,7,'#343b3d');this.rect(left,s.y,right-left,1.2,'#a9a9a0');this.rect(left,s.y+5,right-left,2,'#11191c');
          for(let x=Math.floor(left/12)*12;x<right;x+=12)this.line(x,s.y-10,x,s.y,'#5f6060',.8);
          this.line(left,s.y-10,right,s.y-10,'#69645b',.8);
        }
      }
    }
  }
  flame(x,y,dx,dy,len,width,seed){
    if(len<.2)return;const g=this.g;
    if(this.loaded.has('flameJets')){
      g.save();g.translate(x,y);g.rotate(Math.atan2(dy,dx)+Math.PI/2);g.scale(Math.min(1,width*2.8/(len*.62)),1);
      drawFlameJet(g,this.images.flameJets,0,0,{phase:len<9?'warning':'fire',height:len},this.state.time,seed);g.restore();return;
    }
    g.save();g.translate(x,y);g.rotate(Math.atan2(dy,dx));
    const sway=Math.sin(this.state.time*17+seed)*width*.32;
    const draw=(l,w,colors)=>{const grad=g.createLinearGradient(0,0,l,0);for(const [at,c]of colors)grad.addColorStop(at,c);g.fillStyle=grad;g.beginPath();g.moveTo(0,-w);g.quadraticCurveTo(l*.5,-w*1.3+sway,l,sway);g.quadraticCurveTo(l*.5,w*1.3+sway,0,w);g.closePath();g.fill();};
    draw(len,width,[[0,'rgba(255,235,166,.95)'],[.38,'rgba(255,147,35,.9)'],[.75,'rgba(218,55,15,.65)'],[1,'rgba(170,30,0,0)']]);
    draw(len*.65,width*.42,[[0,'#fffbe0'],[.5,'rgba(255,223,112,.9)'],[1,'rgba(255,170,40,0)']]);g.restore();
  }
  jets(jets,waves,camera){
    const g=this.g;
    for(const j of jets){if(j.x<camera-100||j.x>camera+484)continue;
      const hot=j.st==='fire'||j.st==='warn',cold=j.st==='cold';
      if(j.v){
        const nozzle=g.createLinearGradient(0,168,0,176);nozzle.addColorStop(0,'#a9a49b');nozzle.addColorStop(.25,'#595b58');nozzle.addColorStop(.65,'#272d2d');nozzle.addColorStop(1,'#121719');
        this.rect(j.x-11,169.5,22,6.5,'#141818');this.rect(j.x-10,169,20,5.5,nozzle);this.rect(j.x-8,170,16,3,'#202323');
        for(let i=-6;i<=6;i+=4){this.rect(j.x+i,170.5,2,2,hot?'#e48b35':cold?'#92d6ed':'#0d1011');this.line(j.x+i,173,j.x+i+1.5,173,'rgba(220,207,175,.5)',.35);}
        for(const dx of [-9,9])this.disc(j.x+dx,173.8,.55,'#d1c4ac');
        if(hot)this.light(j.x,171,15,j.st==='fire'?'rgba(255,110,20,.6)':'rgba(255,125,35,.3)');
        if(j.st==='warn')this.flame(j.x,171,0,-1,4+Math.sin(this.state.time*13)*1.5,2,j.x);
        if(j.st==='fire')this.flame(j.x,172,0,-1,64*j.k,7,j.x);
      }else if(j.gallery){
        const y=j.y,face=j.dir,x=j.x+face*5;
        const metal=g.createLinearGradient(0,y-6,0,y+6);metal.addColorStop(0,'#a6a495');metal.addColorStop(.35,'#525c55');metal.addColorStop(1,'#202928');
        this.rect(x-4,y-6,8,12,'#11191a');this.rect(x-3.5,y-5,7,10,metal);this.rect(x-3,y-3,6,6,'#202827');
        this.rect(face<0?x-4:x+2,y-2.5,2,5,cold?'#a4e6f2':hot?'#ee9b48':'#101717');
        for(const d of [-3.8,3.8])this.disc(x+1.7,y+d,.5,'#d0c5a6');
        this.disc(j.x+3,y-5,1,cold?'#a9e8f1':hot?'#f19f49':'#84b866');
        if(hot)this.light(x,y,12,'rgba(255,120,35,.4)');
        if(j.st==='warn')this.flame(j.x+face*7,y,face,0,5,2,j.x+y);
        if(j.st==='fire')this.flame(j.x+face*6,y,face,0,(j.range??74)*j.k,6.5,j.x+y);
      }else{
        const pipe=g.createLinearGradient(j.x-6,0,j.x+6,0);pipe.addColorStop(0,'#242b2b');pipe.addColorStop(.3,'#77766c');pipe.addColorStop(.52,'#555a55');pipe.addColorStop(.8,'#282d2d');pipe.addColorStop(1,'#171b1c');
        this.rect(j.x-6,134,12,42,pipe);this.rect(j.x-7,134,14,3,'#555b56');this.rect(j.x-6,134,12,.7,'#aea693');
        for(const y of [140,151,166,172]){this.rect(j.x-7,y,14,2,'#222827');this.rect(j.x-6,y,12,.5,'#a49a7d');for(const dx of [-5,5])this.disc(j.x+dx,y+1,.5,'#d2b68a');}
        g.save();g.beginPath();g.rect(j.x-6,142,12,4);g.clip();this.rect(j.x-6,142,12,4,'#b59444');for(let k=-8;k<12;k+=4)this.line(j.x+k,146,j.x+k+4,142,'#252a27',1.3);g.restore();
        const nx=j.x+(j.dir<0?-11:3),barrel=g.createLinearGradient(0,153,0,164);barrel.addColorStop(0,'#93978b');barrel.addColorStop(.3,'#454a47');barrel.addColorStop(.75,'#202524');barrel.addColorStop(1,'#111616');
        this.rect(nx,153,8,11,'#141a1a');this.rect(nx+.5,154,7,9,barrel);this.rect(j.dir<0?nx-1:nx+6.5,155,2,7,hot?'#c16d33':'#181e1d');
        this.line(nx+1,155,nx+6,155,'rgba(232,217,185,.55)',.55);this.disc(nx+4,161,.7,'#9e9682');
        if(hot)this.light(j.x+j.dir*8,158,13,'rgba(255,120,35,.45)');
        if(j.st==='warn')this.flame(j.x+j.dir*9,158,j.dir,0,5,2,j.x);
        if(j.st==='fire')this.flame(j.x+j.dir*9,158,j.dir,0,74*j.k,6.5,j.x);
      }
    }
    for(const w of waves){this.light(w.x,169,17,'rgba(255,105,24,.38)');this.flame(w.x,176,.25,-1,w.h,7,w.x);}
  }
  golem(boss){
    if(!boss)return;
    const g=this.g;
    if(boss.dead&&boss.deadT<=0)return;
    if(!boss.active||boss.x>this.state.camX+435||boss.x+60<this.state.camX-30)return;
    const airborne=boss.phase==='jump';
    const {key,source,height,width,rotation,offsetY}=stageSixBossSpritePose(boss);
    g.save();g.globalAlpha=Math.max(.12,.35-(boss.ground-boss.y)*.003);
    g.fillStyle='#080b0b';g.beginPath();g.ellipse(boss.x,boss.ground-1,airborne?28:34,4,0,0,Math.PI*2);g.fill();g.restore();
    g.save();g.translate(boss.x,boss.y+offsetY);if(boss.face>0)g.scale(-1,1);g.rotate(rotation);
    if(boss.dead)g.filter='brightness(.42) saturate(.45)';
    else if(boss.parts[2].flash>0)g.filter='brightness(1.8)';
    if(this.loaded.has(key)){
      if(source)g.drawImage(this.images[key],...source,-width/2,-height,width,height);
      else g.drawImage(this.images[key],-width/2,-height,width,height);
    }else if(this.loaded.has('robotStand'))g.drawImage(this.images.robotStand,-48,-82,96,82);
    else this.rect(-18,-75,36,75,'#974632');
    g.restore();
  }
  hud(G,options){
    const g=this.g;g.save();const shade=g.createLinearGradient(0,0,0,38);shade.addColorStop(0,'rgba(8,12,15,.94)');shade.addColorStop(1,'rgba(15,15,16,0)');this.rect(0,0,384,38,shade);
    this.playerHud(G,G.p,{x:HUD_PLAYER_X[0],role:StageOneArt.playerRole(options.online),inventory:G.inv,selection:G.sel,cooldown:G.nadeCd,infinite:options.settings.inf==='on',local:!options.guest});
    this.hudText('最高分  '+String(Math.max(options.highScore||0,G.score)).padStart(6,'0'),192,5,'#d7c7ae',6,'center',90);
    if(options.online&&G.p2)this.playerHud(G,G.p2,{x:HUD_PLAYER_X[1],blue:true,inventory:G.inv2,selection:G.sel2,cooldown:G.nadeCd2,infinite:options.settings.inf==='on',local:!!options.guest});
    else{this.hudText('第六关',376,4,'#f0ede3',7,'right');this.hudText('高温能源厂',376,17,'#e1af7e',5.8,'right');}
    if(G.golem?.active&&!G.golem.dead){const core=G.golem.parts[2];this.hudText('巨型机器人',192,18,'#eab37c',5,'center',84);this.rect(157,26,70,4,'#352922');this.rect(158,27,68*Math.max(0,core.hp/core.max),2,'#e87b3d');}
    if(G.s6.coolT>0)this.hudText('液氮 '+Math.ceil(G.s6.coolT)+'秒',192,33,'#9edbed',4.8,'center');
    for(const [i,p]of options.players.entries())if(p.fireproofT>0)this.hudText('防火 '+Math.ceil(p.fireproofT)+'秒',HUD_PLAYER_X[i]+5,36,'#ffc68b',4.8);
    if(G.bannerT>0&&G.bannerText){this.rect(38,42,308,15,'rgba(19,14,14,.82)');this.hudText(G.bannerText,192,46,'#f4c890',6.5,'center',294);}
    g.restore();
  }
  render(destination,G,options){
    this.prepare(destination);this.state=G;
    if(this.baseArt.scale!==this.scale){this.baseArt.scale=this.scale;this.baseArt.cache.clear();this.baseArt.terrainCache.clear();this.hdActors.clear();}
    const g=this.g,camera=this.snap(G.camX);this.backdrop(camera);
    if(G.mode==='intro'){
      this.rect(0,0,384,216,'rgba(8,9,11,.66)');this.hudText('第六关',192,55,'#f7eee0',17,'center');this.hudText('高温能源厂',192,84,'#efab68',9,'center');
      this.actor({x:192,y:145,face:1,anim:0,onGround:true},StageOneArt.playerRole(options.online));this.hudText('避开火焰 · 摧毁熔炉核心',192,166,'#dfbc96',6,'center');this.present(destination);return;
    }
    const shake=options.settings.shake==='on'&&G.shake>0?Math.sin(G.t*9)*Math.min(2,G.shake):0;
    g.save();g.translate(-camera+shake,0);this.gallery(camera);this.floor(options.solids,camera);this.exitDoor(G.s6,camera);this.golem(G.golem);this.jets(G.jets,G.s6.waves,camera);
    for(const e of G.en)if(!e.dead&&e.x>camera-40&&e.x<camera+424)this.enemy(e);
    for(const it of G.items)if(!it.dead)this.capsule(it.x,it.y-5,it.kind,false);
    for(const pod of G.pods)if(!pod.dead)this.capsule(pod.x,pod.y,pod.kind,true,pod);
    for(const [i,p]of options.players.entries()){
      if(p.fireproofT>0&&!p.dead){g.save();g.globalAlpha=.5;this.light(p.x,p.y-15,17,'rgba(255,152,57,.24)');g.restore();}
      if(p.enteringExit){
        const progress=Math.max(0,Math.min(1,p.enteringExit.t/STAGE_SIX_EXIT.entrySeconds));
        g.save();g.globalAlpha*=1-Math.max(0,(progress-.5)/.5);this.actor({...p,enteringExit:null,onGround:true,vx:p.enteringExit.speed||50,face:1},StageOneArt.playerRole(options.online,i));g.restore();
      }else this.actor(p,StageOneArt.playerRole(options.online,i));
    }
    this.grenades(G.gr,G.t);this.bullets(G.pb);this.bullets(G.eb,true);this.effects(G.fx);g.restore();this.hud(G,options);
    if(G.flashT>0){g.save();g.globalAlpha=Math.min(.6,G.flashT*2);this.rect(0,0,384,216,'#fff5df');g.restore();}this.present(destination);
  }
}
