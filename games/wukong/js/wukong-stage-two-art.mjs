import {ROOM_WIDTHS,ROOM_NAMES,SEALS,doors,objective,counterWindow,kingFrame} from './wukong-stage-two.mjs?v=mods-2';
export class WukongSiegeArt {
  constructor({imageFactory=()=>new Image()}={}){
    this.imageFactory=imageFactory;this.images={};this.pending={};this.meta={};
    this.assets={southGate:'/games/wukong/assets/stage-02/south-gate-bg.webp',growthKing:'/games/wukong/assets/stage-02/growth-king.webp',siegeProps:'/games/wukong/assets/stage-02/siege-props.webp'};
  }
  loadImage(key,{retry=false}={}){
    if(this.pending[key]&&!retry)return this.pending[key];
    const im=this.imageFactory();im.decoding='async';this.images[key]=im;
    return this.pending[key]=Promise.all([new Promise((resolve,reject)=>{im.onload=()=>resolve(im);im.onerror=()=>reject(Error('第二关图片加载失败'));im.src=this.assets[key];}),
      key==='southGate'?null:fetch(this.assets[key].replace('.webp','.json')).then(r=>{if(!r.ok)throw Error('第二关图集标定缺失');return r.json();}).then(data=>this.meta[key]=data)]).then(()=>im);
  }
  prop(art,id,x,y,width){
    const image=this.images.siegeProps,meta=this.meta.siegeProps,f=meta?.frames?.find(frame=>frame.id===id);if(!image?.naturalWidth||!f)return false;
    const b=f.bounds,scale=width/b[2],pivot=f.pivot||[b[0]+b[2]/2,b[1]+b[3]];
    art.g.drawImage(image,...b,x+(b[0]-pivot[0])*scale,y+(b[1]-pivot[1])*scale,b[2]*scale,b[3]*scale);return true;
  }
  king(art,G){
    const k=G.boss.king;if(!k)return;
    const a=k.attack,image=this.images.growthKing,meta=this.meta.growthKing;
    const f=kingFrame(G);
    const g=art.g;g.save();
    if(a&&a.t<a.windup){
      if(a.kind==='cleave'){
        art.disc(a.aimX,175,24,'rgba(223,90,67,.2)');art.line(a.aimX-25,174,a.aimX+25,174,'#f29b79',1.8);
        art.hudText(a.t<.35?'追踪':'落点锁定',a.aimX,160,'#ffbd94',5.2,'center');
      }else art.hudText(a.kind==='sweep'?'横扫 · 起跳':'风刃 · 看准波头',k.x,82,'#ffc4a3',5.5,'center');
    }
    if(a?.kind==='cleave'&&a.t>=a.windup+a.strike){
      const remaining=Math.max(0,a.recovery-(a.t-a.windup-a.strike));
      art.hudText(`拔剑收势 ${remaining.toFixed(1)}秒`,k.x,86,'#bff5cf',6,'center');
    }
    g.translate(k.x,176);g.scale(k.face===(meta?.face??-1)?1:-1,1);
    if(k.flash>0)g.filter='brightness(1.4)';
    if(image?.naturalWidth&&f){const b=f.bounds,anchor=f.anchor,scale=meta.scale;g.drawImage(image,...b,(b[0]-anchor[0])*scale,(b[1]-anchor[1])*scale,b[2]*scale,b[3]*scale);}
    else {art.rect(-16,-68,32,68,'#38656b');art.disc(0,-78,10,'#bcab88');art.line(-18,-40,-58,-16,'#ded3a1',5);}
    g.restore();
  }
  render(art,destination,G,options){
    art.prepare(destination);art.state=G;const g=art.g,s=G.siege,camera=G.camX,width=ROOM_WIDTHS[s.room],image=this.images.southGate;
    g.fillStyle='#567d87';g.fillRect(0,0,384,216);
    if(image?.naturalWidth)g.drawImage(image,-80-camera*.10,-24,620,349);
    const haze=g.createLinearGradient(0,0,0,216);haze.addColorStop(0,'rgba(12,35,47,.18)');haze.addColorStop(.65,'rgba(38,64,71,.04)');haze.addColorStop(1,'rgba(211,228,222,.4)');g.fillStyle=haze;g.fillRect(0,0,384,216);
    if(G.mode==='intro'){
      g.fillStyle='rgba(6,29,36,.8)';g.fillRect(0,0,384,216);
      art.hudText('第二关',192,55,'#d7bf87',10,'center');art.hudText('南天门 · 破阵登天',192,80,'#fff0bc',18,'center');
      art.hudText('夺弩 · 回雷 · 放锤',192,119,'#d7e5dc',8,'center');art.hudText('破任意两阵开门，第三阵可选',192,139,'#a5c7bc',7,'center');art.present(destination);return;
    }
    const shake=options.settings.shake==='on'&&G.shake>0?Math.sin(G.t*9)*Math.min(2,G.shake):0;
    g.save();g.translate(-camera+shake,0);
    art.river(camera,{x0:0,x1:width,surf:205},G.t);
    art.ground(options.solids,camera);
    for(let x=20;x<width;x+=130){art.line(x,176,x,162,'#8c7352',2);art.line(x,163,x+55,163,'#ab916c',1.2);}
    for(const d of doors(G)){
      const gold=d.locked?'#76877e':'#d5bb7e';
      art.rect(d.x-15,126,30,50,'rgba(13,42,47,.75)');art.line(d.x-15,126,d.x-15,176,gold,2);art.line(d.x+15,126,d.x+15,176,gold,2);art.line(d.x-19,125,d.x+19,125,gold,3);
      art.hudText(d.label,d.x,113,gold,6,'center');art.hudText(d.locked?'封印未解':'↑ 进入',d.x,151,gold,5.5,'center');
      if(options.players.some(p=>!p.dead&&Math.abs(p.x-d.x)<26))art.hudText(d.locked?'先破两阵':'按住 ↑',d.x,139,'#fcf0bd',5,'center');
    }
    if(s.room==='hub'){
      for(const [i,id]of SEALS.entries())this.seal(art,id,235+i*160,88,s.cleared.includes(id));
      art.hudText('天门前庭',125,106,'#eed9a7',9,'center');
    }
    if(s.room==='wind'){
      g.save();g.translate(867,150);g.rotate((1-s.aim)*.23);this.prop(art,'crossbow',0,0,112);g.restore();
      this.seal(art,'wind',1040,115,s.cleared.includes('wind'));
      art.hudText(s.captured?'左拨杆换向 · 右金扣发弩':'击退弩台守军',867,90,'#f3dc9c',6,'center');
      if(s.captured)art.hudText(s.aim===1?'中档 · 已瞄准':'第 '+(s.aim+1)+' 档',867,104,s.aim===1?'#bdf2cf':'#e3bea2',6,'center');
      if(s.shotT>0)art.line(920+(1-s.shotT/.6)*110,130,945+(1-s.shotT/.6)*110,130,'#fff0a0',2);
    }
    if(s.room==='bridge'||s.room==='thunder'){
      const x=s.room==='bridge'?570:650;this.prop(art,'thunder',x,132,68);this.seal(art,'thunder',x,109,s.cleared.includes('thunder'));
      art.hudText(s.room==='bridge'?'试着挥棍打回雷珠':`回雷命中 ${s.returnHits}/3`,x,91,'#f0db9d',6,'center');
    }
    if(s.room==='armor'){
      const drop=s.cleared.includes('armor')?1:s.hammerT>0?1-s.hammerT:0;
      art.line(890,0,890+drop*90,117+drop*30,'#c0a776',2);this.prop(art,'hammer',890+drop*90,128+drop*40,95);
      this.seal(art,'armor',1030,109,s.cleared.includes('armor'));
      for(const p of s.devices.slice(0,2))if(p.hp>0)art.line(p.x+10,8,p.x+10,p.y,'#bda36d',1.4);
    }
    if(s.room==='gate'){
      art.rect(264,36,60,140,'#253f45');art.line(257,35,330,35,'#dcc78e',4);
      for(let i=0;i<3;i++)this.seal(art,SEALS[i],277+i*16,67,s.cleared.includes(SEALS[i]),.38);
      if(!s.gateOpen){art.line(264,111,324,111,'#c8a15d',4);art.hudText('击断门闩',235,102,'#ffe1a0',6,'center');}
      else art.hudText('天门已开',290,100,'#c4f4c6',8,'center');
    }
    for(const d of s.devices)if(d.hp>0&&!(s.room==='wind'&&!s.captured)){
      if(d.siege==='hammer'&&s.devices.slice(0,2).some(p=>p.hp>0))continue;
      art.rect(d.x,d.y,d.w,d.h,d.flash>0?'#fff1bd':'#ab8b4b');art.rect(d.x+3,d.y+3,d.w-6,d.h-6,'#294b4c');
      art.hudText({aim:'调',fire:'发',hammer:'锤','lock-left':'锁','lock-right':'锁',gate:'闩'}[d.siege]||'',d.x+d.w/2,d.y+6,'#efd9a4',7,'center');
      if(d.max<100){art.rect(d.x,d.y-4,d.w,1.5,'#365d60');art.rect(d.x,d.y-4,d.w*d.hp/d.max,1.5,'#e2c78c');}
    }
    for(const e of G.en)if(!e.dead&&e.x>camera-50&&e.x<camera+435)art.enemy(e);
    for(const it of G.items)if(!it.dead)art.capsule(it.x,it.y-5,it.kind,false);
    this.king(art,G);
    for(const [i,p]of options.players.entries())art.actor(p,options.online?(i?'blue':'red'):'blue');
    for(const o of s.orbs){
      const x=o.x+12,y=o.y+12;
      if(o.siege==='wind-wave')art.line(x-8,y+2,x+8,y-2,'#f5cf8b',3);
      else {art.disc(x,y,8,o.reflected?'#b0e8c0':'#efc87a');art.disc(x-2,y-2,3,'#fff2c5');}
    }
    if(s.lightning)art.line(s.lightning.x,40,s.lightning.x,176,'#ffe8b2',4);
    art.bullets(G.pb);art.bullets(G.eb,true);art.grenades(G.gr,G.t);art.effects(G.fx);g.restore();
    art.hud(G,options);
    if(!options.online){art.rect(318,0,66,28,'rgba(10,32,39,.92)');art.hudText('第二关',376,4,'#efe6cb',7,'right');art.hudText('南天门 · '+ROOM_NAMES[s.room],376,17,'#c5d9c8',5.4,'right',65);}
    if(G.boss.active&&!G.boss.dead){art.rect(146,15,20,10,'#15383d');art.hudText('天王',151,17,'#eac889',5.3);}
    const tip=s.messageT>0&&s.message!==ROOM_NAMES[s.room]?s.message:objective(G);
    art.rect(16,66,352,12,'rgba(11,38,46,.78)');art.hudText(tip,192,68,'#f2e3bc',5.7,'center',342);
    for(let i=0;i<3;i++){const on=s.cleared.includes(SEALS[i]),x=175+i*17;art.disc(x,83,3.2,on?'#a2d6b0':'#6e7e78');art.hudText(['弩','雷','甲'][i],x,79.5,on?'#173c3b':'#dfcba3',4,'center');}
    if(G.flashT>0){g.globalAlpha=Math.min(.5,G.flashT*2);art.rect(0,0,384,216,'#fff0c3');g.globalAlpha=1;}
    art.present(destination);
  }
  seal(art,id,x,y,cleared,scale=1){
    const g=art.g;g.save();g.translate(x,y);g.scale(scale,scale);
    if(!this.prop(art,id==='wind'?'crossbow':id==='thunder'?'thunder':'armor',0,20,44))art.disc(0,0,16,'#426a67');
    if(cleared){g.globalAlpha=.8;art.line(-12,0,-3,9,'#b9ebc7',3);art.line(-3,9,14,-12,'#b9ebc7',3);}
    g.restore();
  }
  inspect(){return {loaded:Object.keys(this.images).filter(k=>this.images[k].naturalWidth>0),metadata:Object.keys(this.meta),stage:2};}
}
