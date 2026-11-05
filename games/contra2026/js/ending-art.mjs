import {StageOneArt} from './stage-one-art.mjs?v=single-enemy-rifle-1';
import {drawExplosion} from './combat-art.mjs?v=combat-polish-1';
import {ENDING_DURATION,endingEase,endingCaption,endingPose} from './ending-story.mjs?v=ending-hd-1';

export const ENDING_ASSETS=Object.freeze({
  endingNight:'/games/contra2026/assets/ending/night-sea-v1.webp',
  endingIsland:'/games/contra2026/assets/ending/black-reef-island-v1.webp',
  endingSunrise:'/games/contra2026/assets/ending/sunrise-sea-v1.webp'
});
const noise=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const mod=(n,d)=>((n%d)+d)%d;

/** Same backing resolution, fonts, aircraft, smoke and blast atlas as the opening/game. */
export class EndingArt extends StageOneArt{
  constructor(options){super({...options,assets:ENDING_ASSETS});this.baseArt=options.baseArt;}
  frame(sheet,name){
    // Keep source frames fixed as the aircraft and plumes change size on screen.
    return name==='helicopter'?super.frame(sheet,name,98,55):super.frame(sheet,name,64,54);
  }
  backdrop(key,t,dawn=false){
    const g=this.g,image=this.images[key],horizon=dawn?143:141;
    this.rect(0,0,384,216,dawn?'#243c59':'#081427');
    if(this.loaded.has(key)){
      // A slow camera drift preserves every cloud and wave's proportions.
      g.drawImage(image,-2-Math.sin(t*.05)*1.2,-1,389,219);
    }
    // Independent haze drifts over the distant sea; the painted plate stays rigid.
    g.save();g.beginPath();g.rect(0,0,384,horizon+2);g.clip();
    for(let i=0;i<4;i++){
      const x=mod(noise(i+7)*500+t*(.55+i*.18),500)-70,y=110+i*7;
      g.save();g.translate(x,y);g.scale(1,.14);
      const mist=g.createRadialGradient(0,0,0,0,0,65);mist.addColorStop(0,dawn?'rgba(241,193,153,.055)':'rgba(119,160,194,.055)');mist.addColorStop(1,'rgba(120,160,190,0)');
      g.fillStyle=mist;g.fillRect(-65,-65,130,130);g.restore();
    }g.restore();
    // Wave crests travel at different speeds according to their distance, without UV warping.
    g.save();g.beginPath();g.rect(0,horizon,384,216-horizon);g.clip();
    for(let row=0;row<19;row++){
      const depth=(row+1)/19,y=horizon+Math.pow(depth,1.65)*(216-horizon),width=2+depth*12;
      for(let col=0;col<8;col++){
        const seed=row*71+col*13,x=mod(noise(seed)*432+t*(.4+depth*4),432)-24,crestY=y+Math.sin(t*1.3+seed)*depth*.6;
        const gold=dawn&&Math.abs(x-274)<11+depth*35;
        g.strokeStyle=gold?'rgba(255,214,144,.46)':'rgba(150,191,209,.21)';g.lineWidth=.18+depth*.24;g.beginPath();g.moveTo(x,crestY);g.bezierCurveTo(x+width*.25,crestY-.5*depth,x+width*.7,crestY+.3*depth,x+width,crestY);g.stroke();
      }
    }g.restore();
  }
  reflection(x,y,t,strength=1){
    const g=this.g;g.save();g.globalCompositeOperation='lighter';
    for(let i=0;i<19;i++){
      const d=i/18,yy=y+2+Math.pow(d,1.6)*(215-y),w=(6+d*28)*(1+.2*Math.sin(t*3+i)),xx=x+Math.sin(t*2-i*.7)*(1+d*7);
      g.strokeStyle=`rgba(255,135,58,${strength*(1-d)*.25})`;g.lineWidth=.3+d*.6;g.beginPath();g.moveTo(xx-w/2,yy);g.quadraticCurveTo(xx,yy-.5,xx+w/2,yy);g.stroke();
    }g.restore();
  }
  smoke(x,y,t,strength=1,steam=false){
    const source=this.frame('environment','smoke');
    if(!source)return;
    const key=steam?'ending-steam':'ending-smoke';
    let frame=this.cache.get(key);
    if(!frame){
      frame=this.createCanvas();frame.width=source.width;frame.height=source.height;
      const surface=frame.getContext('2d');surface.filter=steam?'grayscale(1) brightness(1.5)':'saturate(.2) brightness(.62)';surface.drawImage(source,0,0);
      this.cache.set(key,frame);
    }
    const g=this.g;g.save();
    for(let i=0;i<11;i++){
      const age=mod(t*.19+i/11,1),s=9+age*39,xx=x+age*17+Math.sin(i*7+age*3)*age*7,yy=y-age*66;
      g.globalAlpha=strength*Math.sin(age*Math.PI)*.38;
      g.drawImage(frame,xx-s*.5,yy-s*.75,s,s*.85);
    }g.restore();
  }
  blast(x,y,age,life,size){
    drawExplosion(this.g,this.baseArt.images.explosionAtlas,{x,y,t:age,life,s:size/3.6});
  }
  shockwave(t){
    const age=t-6.1;if(age<0||age>3.8)return;
    const g=this.g;g.save();g.beginPath();g.rect(0,141,384,75);g.clip();
    for(let ring=0;ring<3;ring++){
      const u=age-ring*.12;if(u<0)continue;const rx=12+u*90,ry=1+u*7;
      g.strokeStyle=`rgba(201,224,225,${Math.max(0,(1-age/3.8)*(.55-ring*.12))})`;g.lineWidth=.5-ring*.08;g.beginPath();
      for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,jitter=Math.sin(i*2.3+t*3)*.3,x=153+Math.cos(a)*(rx+jitter),y=152+Math.sin(a)*(ry+jitter*.3);i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
    }
    g.restore();
    // The shock lifts a short-lived curtain of individual water droplets.
    g.save();
    for(let i=0;i<36;i++){
      const life=.6+noise(i+22)*1.3,u=age/life;if(u>1)continue;
      const vx=(noise(i*7)-.5)*165,vy=-18-noise(i*13)*30,x=153+vx*age,y=152+vy*age+29*age*age;
      g.globalAlpha=(1-u)*.7;g.fillStyle='#afc8d3';g.fillRect(x,y,.35+noise(i)*.5,1.1+u);
    }g.restore();
  }
  aircraft(p,t,{light=false,warm=0}={}){
    const g=this.g,h=p.w*47/84,cx=p.x+p.w*.6,cy=p.y+h*.5;
    if(light){
      g.save();const beam=g.createLinearGradient(cx,cy,cx-14,154);beam.addColorStop(0,'rgba(207,222,205,.12)');beam.addColorStop(1,'rgba(207,222,205,0)');g.fillStyle=beam;g.beginPath();g.moveTo(cx+9,cy+4);g.lineTo(cx-21,155);g.lineTo(cx+46,155);g.closePath();g.fill();g.restore();
    }
    g.save();g.translate(cx,cy);g.rotate(p.bank);g.translate(-cx,-cy);
    if(warm>.05)g.filter=`brightness(${1+warm*.45}) sepia(${warm*.2})`;
    this.helicopter(p.x,p.y,p.w,h,t*60);
    const blink=Math.sin(t*8)>.6;this.disc(p.x+p.w*.27,p.y+h*.57,.55,blink?'#ff7b55':'#4b302c');
    g.restore();
  }
  escape(t,options){
    const g=this.g,p=endingPose(t);this.backdrop('endingNight',t);
    const shake=options.settings?.shake==='on'&&!options.reducedMotion?p.shake:0;
    g.save();g.translate(Math.sin(t*91)*shake,Math.sin(t*73)*shake*.6);
    const fire=clamp(t/4,0,1);
    this.reflection(158,151,t,t<6?.15+fire*.25:Math.max(0,1-(t-6)/4));
    if(this.loaded.has('endingIsland')&&p.sink<1){
      const im=this.images.endingIsland,h=p.island.w*im.naturalHeight/im.naturalWidth;
      g.save();g.beginPath();g.rect(0,0,384,152);g.clip();g.filter=`brightness(${.94-p.sink*.4}) saturate(${.94-p.sink*.25})`;
      g.drawImage(im,p.island.x,p.island.y,p.island.w,h);g.restore();
    }
    for(let i=0;i<4;i++){
      const start=.2+i*.65;if(t>start&&t<9.8)this.smoke(119+i*19,112+noise(i)*14,t-start,clamp((t-start)/1.2,0,1)*Math.min(1,(10-t)/2));
    }
    for(let i=0;i<10;i++){
      const age=t-(.4+i*.55);this.blast(83+noise(i*7+9)*135,97+noise(i*3+7)*32,age,.7,21+noise(i)*17);
    }
    if(t>=6){
      const age=t-6;
      // Successive expanding fireballs use the existing twelve-frame blast sheet.
      for(let i=0;i<12;i++){
        const u=age-i*.085;this.blast(150+(noise(i*17)-.5)*67,127-noise(i*3)*22-u*7,u,1.05+noise(i+3)*.6,44+noise(i+12)*45);
      }
      if(age<4){
        for(let i=0;i<36;i++){
          const speed=25+noise(i)*55,angle=-Math.PI*.12-noise(i*9)*Math.PI*.76,x=152+Math.cos(angle)*speed*age,y=119+Math.sin(angle)*speed*age+23*age*age;
          if(y>153)continue;g.save();g.globalAlpha=clamp(1-age/4,0,1);g.translate(x,y);g.rotate(age*(noise(i*5)-.5)*5);this.rect(-.8,-.8,1.5+noise(i)*1.2,1.3,i%4===0?'#eab16c':'#576571');this.line(-.7,-.8,.6,-.8,'#c18c65',.4);g.restore();
        }
      }
      if(age>.65){this.smoke(148,144,age-.65,Math.min(1,(age-.65)/.6));this.smoke(165,151,age-.65,Math.min(1,(age-.65)/.6)*.75,true);}
      this.shockwave(t);
    }
    if(t<8)this.aircraft(p.escapeHeli,t,{light:t<3,warm:p.flash});
    // Rotor wash skims the surface only while the helicopter is near the island.
    if(t<3){g.save();g.globalAlpha=(1-t/3)*.18;for(let i=0;i<4;i++){g.strokeStyle='#c4cdd0';g.lineWidth=.25;g.beginPath();g.ellipse(194,151,14+mod(t*12+i*6,25),1.5+i*.4,0,0,Math.PI*2);g.stroke();}g.restore();}
    g.restore();
    if(p.flash){g.save();g.globalAlpha=p.flash;this.rect(0,0,384,216,'#fff4d6');g.restore();}
  }
  home(t,credits=false){
    this.backdrop('endingSunrise',t,true);
    if(!credits)this.aircraft(endingPose(t).homeHeli,t,{warm:.1});
    else{const g=this.g;g.save();g.globalAlpha=.63*endingEase((t-20.6)/1.2);this.rect(0,0,384,216,'#030d18');g.restore();}
  }
  subtitles(t){
    const g=this.g,page=endingCaption(t);
    g.save();g.globalAlpha=.35+(page?.alpha||0)*.65;
    const shade=g.createLinearGradient(0,153,0,216);shade.addColorStop(0,'rgba(1,9,13,0)');shade.addColorStop(.32,'rgba(1,9,13,.84)');shade.addColorStop(1,'rgba(1,9,13,.96)');g.fillStyle=shade;g.fillRect(0,153,384,63);
    if(page){
      g.globalAlpha=page.alpha;
      this.hudText(`${String(page.index+1).padStart(2,'0')} / ${String(page.total).padStart(2,'0')} · ${page.tag}`,192,160,'#cdb888',6.2,'center');
      page.lines.forEach((line,i)=>this.hudText(line,192,173+i*13,'#f4f2e5',8.8,'center',338));
    }
    g.restore();
  }
  credits(G,t){
    const seconds=Math.floor(G.time||0),duration=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
    const rows=[['恭喜通关！','#e9ca8b',18,0],['赤焰小队 · 任务完成','#f4f2e5',10,30],
      ['最终得分  '+String(G.score||0).padStart(6,'0'),'#e5e5dd',9,66],['通关用时  '+duration,'#e5e5dd',9,82],['阵亡次数  '+(G.deaths||0),'#e5e5dd',9,98],
      ['— 制作人员 —','#9dbdce',9,140],['游戏设计  魂斗罗2026制作组','#e5e5dd',9,162],['关卡与美术  魂斗罗2026制作组','#e5e5dd',9,178],['音乐音效  魂斗罗2026制作组','#e5e5dd',9,194],['制作  玩家与克劳德','#e5e5dd',9,210],
      ['特别感谢','#9dbdce',9,246],['每一位坚持到这里的玩家','#e5e5dd',9,262],['全剧终','#e9ca8b',21,330]];
    const base=226-endingPose(t).creditScroll;
    for(const [text,color,size,offset]of rows){const y=base+offset;if(y<-25||y>216)continue;this.g.save();this.g.globalAlpha=clamp(Math.min((y+20)/20,(215-y)/18),0,1);this.hudText(text,192,y,color,size,'center',350);this.g.restore();}
  }
  render(destination,G,options={}){
    const t=clamp(G.cine?.t||0,0,ENDING_DURATION),g=this.g;
    for(const key of ['environment','facilities']){
      const image=this.baseArt.images[key];
      if(this.baseArt.loaded.has(key)&&this.images[key]!==image)this.adoptImage(key,image);
    }
    this.prepare(destination);
    if(t<11.5)this.escape(t,options);
    if(t>=10.6&&t<20.6){g.save();g.globalAlpha=endingEase((t-10.6)/.9);this.home(t);g.restore();}
    if(t>=20.6){this.home(t,true);this.credits(G,t);}
    if(t<20.6)this.subtitles(t);
    const top=g.createLinearGradient(0,0,0,27);top.addColorStop(0,'rgba(2,12,17,.72)');top.addColorStop(1,'rgba(2,12,17,0)');g.fillStyle=top;g.fillRect(0,0,384,27);
    this.hudText('黑礁群岛 · 作战结束',12,9,'#d1ded7',6.1);this.hudText('行动代号：赤焰',372,9,'#c5b88f',6.1,'right');
    if(t>.6)this.hudText('回车 / 射击键 / 点击屏幕：跳过片尾',192,208,'#9cb1b5',5.2,'center');
    const fade=Math.max(1-t/.55,(t-(ENDING_DURATION-.75))/.75);if(fade>0){g.save();g.globalAlpha=clamp(fade,0,1);this.rect(0,0,384,216,'#000');g.restore();}
    this.present(destination);
  }
}
