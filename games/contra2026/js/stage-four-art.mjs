import { HUD_PLAYER_X } from './hud-layout.mjs';
import { StageOneArt } from './stage-one-art.mjs?v=single-enemy-rifle-1';
import { StageTwoArt, STAGE_TWO_ASSETS } from './stage-two-art.mjs?v=single-enemy-rifle-1';
import { STAGE_FOUR_ROOMS, STAGE_FOUR_GALLERY_TIERS } from './stage-four-layout.mjs?v=stage-four-defense-1';
import { baseCoreShielded } from './base-shooting.mjs?v=stage-four-1';
import { bossDevicesRemaining, deviceAimHint } from './base-boss.mjs?v=polish-closeout-1';

// Shared animation atlases are deduplicated by the resource preloader.
const {power,armory,command,...sharedAssets}=STAGE_TWO_ASSETS;
export const STAGE_FOUR_ASSETS=Object.freeze({...sharedAssets,
  enemyUniform:'/games/contra2026/assets/stage4/enemy-fortress-front-aim-v1.webp',
  sideEnemyUniform:'/games/contra2026/assets/stage4/enemy-fortress-side.webp',
  corridor:'/games/contra2026/assets/stage4/corridor-alert.webp',
  bossWall:'/games/contra2026/assets/stage4/control-wall.webp',
  twinMask:'/games/contra2026/assets/stage4/twin-mask.webp',
  passage:'/games/contra2026/assets/stage4/breached-passage.webp'
});

export class StageFourArt extends StageTwoArt{
  constructor(options){super({...options,assets:STAGE_FOUR_ASSETS});}
  backdrop(){
    const key='stage4-corridor';let image=this.cache.get(key);
    if(!image){
      image=this.createCanvas();image.width=this.surface.width;image.height=this.surface.height;
      const ink=image.getContext('2d');ink.fillStyle='#080b09';ink.fillRect(0,0,image.width,image.height);
      if(this.loaded.has('corridor')){
        const source=this.images.corridor,xx=[0,536,1138,1672],yy=[0,239,574,941],dx=[0,96,288,384],dy=[0,40,140,216];
        for(let row=0;row<3;row++)for(let col=0;col<3;col++)ink.drawImage(source,
          xx[col]/1672*source.naturalWidth,yy[row]/941*source.naturalHeight,
          (xx[col+1]-xx[col])/1672*source.naturalWidth,(yy[row+1]-yy[row])/941*source.naturalHeight,
          dx[col]*this.scale,dy[row]*this.scale,(dx[col+1]-dx[col])*this.scale,(dy[row+1]-dy[row])*this.scale);
      }
      this.cache.set(key,image);
    }
    this.g.drawImage(image,0,0,384,216);
  }
  roomIdentity(B){
    if(B.def.boss)return;
    const g=this.g,pulse=.5+.5*Math.sin(this.state.time*3.4+B.room);
    for(const x of [82,300]){g.save();g.globalAlpha=.25+pulse*.55;this.light(x,73,7,'rgba(245,72,22,.4)');this.rect(x-1,69,2,8,'#e8592a');g.restore();}
    // Rails show where a moving cannon can travel before it starts to move.
    if(B.def.rails){this.metalBeam(99,123,186,2);this.line(100,125,284,125,'#1a100c',1);}
    this.drawGalleries(B);
  }
  drawGalleries(B){
    if(B.cleared||B.trans>0||B.dead)return;
    const g=this.g;
    for(const y of STAGE_FOUR_GALLERY_TIERS)for(const side of [-1,1]){
      const x=side<0?88:280;this.rect(x,y-25,16,26,'#080e0b');
      this.metalBeam(x-1,y-26,18,1.3);this.metalBeam(x-1,y,18,1.2);
      this.line(x+1,y-23,x+1,y-1,'#38483c',.7);this.line(x+14,y-23,x+14,y-1,'#18231d',.7);
    }
    if(!B.def.boss)for(const y of STAGE_FOUR_GALLERY_TIERS)for(const x of [91,230]){
      this.metalBeam(x,y,63,1.5);this.rect(x,y+1.5,63,1.2,'#111c16');
    }
    for(const s of B.gallery||[]){
      if(s.dead)continue;g.save();g.beginPath();g.rect(s.side<0?92:230,s.y-28,62,30);g.clip();
      this.figure({x:s.x,y:s.y,face:-s.side,onGround:true,vx:s.st==='aim'?0:-s.side*28,anim:s.anim},'enemy',.62,true);
      if(s.flashT>0)this.muzzle(s.x,s.y-15);g.restore();
    }
  }
  facilityArmor(t){
    if(!t.armored||t.hp<=0)return;
    const g=this.g,opening=Math.max(0,Math.min(1,t.aperture??1));
    const cx=t.x+t.w/2,y=t.y+t.h*.21,half=t.w*.42,h=t.h*.66;
    const travel=opening*half;
    const bevel=Math.min(1.8,h*.2);
    g.save();g.translate(cx,y);
    if(opening<.995){
      // Each cheek retracts into the outer casting, leaving the original housing visible.
      const plate=g.createLinearGradient(0,0,0,h);
      for(const [stop,color]of [[0,'#777a68'],[.16,'#565b52'],[.26,'#3d4743'],[.81,'#2a3431'],[1,'#151b1a']])plate.addColorStop(stop,color);
      g.save();g.beginPath();g.rect(-half,0,half*2,h);g.clip();
      for(const side of [-1,1]){
        g.save();g.scale(side,1);g.translate(travel,0);
        g.fillStyle=plate;g.strokeStyle='#161c1a';g.lineWidth=.55;g.beginPath();
        g.moveTo(.32,bevel);g.lineTo(bevel,0);g.lineTo(half,0);g.lineTo(half,h);
        g.lineTo(bevel,h);g.lineTo(.32,h-bevel);g.closePath();g.fill();g.stroke();
        this.line(bevel,.38,half,.38,'#999886',.55);
        this.line(.65,bevel,.65,h-bevel,'#74796b',.45);
        this.line(bevel,h-.8,half,h-.8,'#101918',.65);
        this.disc(half*.7,h*.51,.53,'#191f1b');
        g.restore();
      }
      g.restore();
    }
    for(const side of [-1,1]){
      const x=side*half-.65;
      this.rect(x,-.45,1.3,h+.9,'#222b26');
      this.line(x+.25,0,x+.25,h,'#727564',.46);
      this.disc(side*half,h-.7,.48,opening>.995?'#a0b780':'#c17b50');
    }
    g.restore();
  }
  portal(B){
    if(!B.cleared||B.def.boss)return;
    if(!this.loaded.has('passage'))return super.portal(B);
    const image=this.images.passage,scale=Math.min(76/image.naturalWidth,86/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;
    this.g.drawImage(image,192-w/2,140-h,w,h);
  }
  bossWall(B){
    const g=this.g;
    if(this.loaded.has('bossWall')){
      g.drawImage(this.images.bossWall,77,40,230,104);
      if(B.bossPhase==='reveal'){
        const progress=Math.max(0,1-B.revealT/1.4);g.save();g.globalAlpha=progress*.6;
        for(const x of [145,239])this.light(x,64,18*progress,'rgba(159,160,255,.55)');g.restore();
      }
      this.drawGalleries(B);
      return;
    }
    this.rect(77,40,230,104,'#252a12');
    // Olive-brass ribbed pipework surrounds the original broad black head bay.
    for(const x of [77,82,300,305])this.metalBeam(x,40,2,104);
    this.rect(88,43,208,34,'#020406');
    this.metalBeam(86,40,212,3);this.metalBeam(86,76,212,3);
    for(let i=0;i<14;i++){this.rect(90+i*14.5,41,7,1,i%3===(this.state.t>>4)%3?'#ded3a1':'#716b42');}
    for(const [cx,cy]of [[124,102],[192,102],[260,102],[124,131],[192,131],[260,131]]){
      const points=[[cx-28,cy-10],[cx-17,cy-16],[cx+17,cy-16],[cx+28,cy-10],[cx+28,cy+9],[cx+16,cy+14],[cx-18,cy+14],[cx-28,cy+9]];
      g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();
      const shade=g.createLinearGradient(cx-28,cy-12,cx+28,cy+14);shade.addColorStop(0,'#1d534c');shade.addColorStop(.4,'#123a36');shade.addColorStop(1,'#061d20');g.fillStyle=shade;g.fill();g.strokeStyle='#7b9067';g.lineWidth=1.1;g.stroke();
      this.line(cx-20,cy-8,cx+18,cy-8,'#244f48',.5);this.line(cx-20,cy+10,cx+18,cy+10,'#041112',1);
    }
    this.metalBeam(85,143,214,3);
    if(B.bossPhase==='reveal'){
      const progress=Math.max(0,1-B.revealT/1.4);g.save();g.globalAlpha=progress*.6;
      for(const x of [145,239])this.light(x,64,18*progress,'rgba(159,160,255,.55)');g.restore();
    }
    this.drawGalleries(B);
  }
  target(t,B){
    // A destroyed travelling cannon must not remain across the opened passage.
    if(t.k==='rail'&&B.cleared)return;
    if(t.k!=='twin'){super.target(t,B);this.facilityArmor(t);return;}
    if(t.hp<=0||!this.loaded.has('twinMask'))return;
    const g=this.g,image=this.images.twinMask,ratio=image.naturalWidth/image.naturalHeight,w=t.w+5,h=w/ratio;
    const draw=(x,alpha)=>{g.save();g.globalAlpha=alpha;g.drawImage(image,x+(t.w-w)/2,t.y+(t.h-h)/2,w,h);g.restore();};
    if(t.split>.02){draw(t.x-t.side*10*t.split,.17*t.split);draw(t.x+t.side*11*t.split,.2*t.split);}
    if(t.flash>0){g.save();g.filter='brightness(2)';draw(t.x,t.opacity);g.restore();}else draw(t.x,t.opacity);
    if(t.solid)this.light(t.x+t.w*.5,t.y+t.h*.3,2.2,'rgba(255,73,37,.38)');
  }
  shots(G){
    super.shots({...G,eb:G.eb.filter(b=>!b.ring)});
    if(G.base.trans>0||G.base.dead)return;
    const g=this.g;
    for(const b of G.eb)if(b.ring&&!b.dead){
      g.save();g.translate(b.x,b.y);const r=b.r;
      this.light(0,0,r*1.6,'rgba(255,77,38,.24)');
      g.beginPath();g.ellipse(0,0,r,r*.76,0,0,Math.PI*2);g.strokeStyle='#ac2d25';g.lineWidth=2.2;g.stroke();
      g.beginPath();g.ellipse(-.15,-.25,r*.88,r*.64,0,0,Math.PI*2);g.strokeStyle='#ffad83';g.lineWidth=1;g.stroke();
      g.beginPath();g.ellipse(-.3,-.45,r*.8,r*.56,0,Math.PI*1.08,Math.PI*1.78);g.strokeStyle='#fff4dc';g.lineWidth=.65;g.stroke();g.restore();
    }
  }
  hud(G,options){
    const g=this.g,B=G.base;g.save();
    const shade=g.createLinearGradient(0,0,0,37);shade.addColorStop(0,'rgba(8,12,8,.97)');shade.addColorStop(.75,'rgba(8,12,8,.83)');shade.addColorStop(1,'rgba(8,12,8,0)');g.fillStyle=shade;g.fillRect(0,0,384,37);
    this.playerHud(G,G.p,{x:HUD_PLAYER_X[0],blue:false,role:StageOneArt.playerRole(options.online),inventory:G.inv,selection:G.sel,cooldown:G.nadeCd,infinite:options.settings.inf==='on',local:!options.guest});
    if(options.online&&G.p2)this.playerHud(G,G.p2,{x:HUD_PLAYER_X[1],blue:true,inventory:G.inv2,selection:G.sel2,cooldown:G.nadeCd2,infinite:options.settings.inf==='on',local:!!options.guest});
    else{this.hudText('第四关',376,4,'#efdfbc',7,'right');this.hudText(B.def.name,376,17,'#d6ad72',5.8,'right');}
    this.hudText('最高分  '+String(Math.max(options.highScore||0,G.score)).padStart(6,'0'),192,5,'#c1c4ad',6,'center',84);
    const twins=B.targets.filter(t=>t.k==='twin'),hp=twins.reduce((sum,t)=>sum+Math.max(0,t.hp),0);
    if(twins.length&&!B.dead){
      this.hudText('双生',149,18,'#d6badc',5.3);this.rect(166,17.5,67,5,'#4b4454');this.rect(166.5,18,66,4,'#100e18');this.rect(167,18.5,65*hp/60,3,'#ae91d3');
    }else this.hudText(B.dead?'投影中枢已摧毁':B.def.boss?B.bossPhase==='reveal'?'双生投影启动中':`防卫装置 ${bossDevicesRemaining(B)} / 4`:B.cleared?'通道已开启':baseCoreShielded(B,G.empT)?'先拆除炮台和高位机关':'趴下射击下层核心',192,18,'#c8c5a9',5.3,'center',90);
    if(G.bannerT>0&&G.bannerText)this.hudText(G.bannerText,192,33,'#e8cda5',6,'center',230);
    else if(B.bossPhase==='twins'&&!B.dead)this.hudText(B.projectionSplit?'投影分散 · 等待合拢攻击':'按上举枪 · 射击合拢的实体',192,33,'#ded3f0',5.8,'center',200);
    else if(deviceAimHint(B))this.hudText(deviceAimHint(B),192,33,'#dfcda5',5.5,'center',200);
    else if(!B.cleared&&!B.dead)this.hudText('护板开启时射击 · 跳跃攻击上层',192,33,'#dfcda5',5.5,'center',200);
    if(B.cleared&&B.trans<=0&&!B.def.boss){
      const next=STAGE_FOUR_ROOMS[B.room+1];this.hudText('按上前进 · '+next.name,192,153,'#eee3be',6,'center',150);
      const y=166+Math.sin(G.time*4)*1.1;this.line(188,y,192,y-4,'#dddab3',1);this.line(192,y-4,196,y,'#dddab3',1);
    }
    if(B.exitReady)this.hudText(options.players.some(p=>p.liftSide)?'升降梯上行 · 完成第四关':'两侧升降梯已开放 · 向左 / 右进入',192,154,'#e5d3aa',6,'center',220);
    g.restore();
  }
  render(destination,G,options){
    if(G.mode!=='intro')return super.render(destination,G,options);
    this.prepare(destination);this.state=G;this.backdrop();const g=this.g;
    g.save();g.globalAlpha=.82;this.rect(0,0,384,216,'#090a05');g.restore();
    this.hudText('第四关',192,63,'#f1e7d2',16,'center');this.hudText('地下基地 · 双生投影',192,88,'#d1b479',8,'center');
    this.figure({x:options.online?174:192,y:158,onGround:true},StageOneArt.playerRole(options.online));
    if(options.online)this.figure({x:213,y:158,onGround:true},'blue');this.present(destination);
  }
}
