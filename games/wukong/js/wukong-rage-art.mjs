import { WUKONG_RAGE, rageReady, ultimateSpec, ultimateShape } from './wukong-rage.mjs';
import { actorRootY } from './wukong-mount.mjs';

export function drawRageBar(art,p,x){
  const g=art.g,max=p.maxRage||WUKONG_RAGE.max,rage=Math.max(0,Math.min(max,p.rage||0)),full=rageReady(p);
  const bx=x+19,by=38,w=80,h=4.4,pulse=.65+Math.sin((art.state.time||0)*7)*.2;
  art.rect(x+95,14.5,33,11,'rgba(9,26,29,.95)');
  art.hudText(full?'大招就绪':'受击蓄怒',x+97,17.8,full?'#ffe6a0':'#c0a388',4.9);
  art.rect(x+2,36.5,127,8,'rgba(9,26,29,.88)');art.hudText('怒气',x+5,38,'#e6c080',4.3);
  art.rect(bx-.6,by-.6,w+1.2,h+1.2,full?'#ffe3a0':'#9d724b');art.rect(bx,by,w,h,'#2b2223');
  if(rage){
    const fill=g.createLinearGradient(bx,by,bx,by+h);fill.addColorStop(0,full?'#fff0ac':'#e7b563');fill.addColorStop(1,full?'#e59736':'#ac502c');
    g.save();if(full){g.shadowColor='#ffc45a';g.shadowBlur=3*(art.scale||1)*pulse;}g.fillStyle=fill;g.fillRect(bx,by,w*rage/max,h);g.restore();
  }
  for(let i=1;i<4;i++)art.rect(bx+w*i/4,by,.5,h,'rgba(48,24,18,.6)');
  art.hudText(`${Math.floor(rage)}/${max}`,x+125,38,full?'#fff0be':'#e5c49c',4.5,'right');
}

export function drawRageUltimate(art,p){
  if(p.staff?.kind!=='ultimate')return;
  const g=art.g,a=p.staff,move=ultimateSpec(a),size=(p.giantT>0?2:1)*(p.magicScale||1);
  const u=Math.min(1,a.t/a.duration),fade=Math.sin(Math.PI*u)**.6,cy=actorRootY(p)-18*size;
  g.save();g.globalAlpha=fade;g.lineCap='round';
  if(move.id==='pillar'){
    const shape=ultimateShape(p),cx=shape.x+shape.w/2,ground=actorRootY(p),drop=Math.min(1,u/.30);
    const bottom=ground-(1-drop)*110*size,top=bottom-126*size;
    art.line(cx,top,cx,bottom,'#744323',15*size);art.line(cx,top,cx,bottom,'#d59a42',12*size);art.line(cx-2*size,top,cx-2*size,bottom,'#ffe9a0',3*size);
    for(const y of [top+5*size,bottom-5*size]){art.line(cx-6*size,y,cx+6*size,y,'#fff1bd',5*size);art.line(cx-6*size,y+5*size,cx+6*size,y+5*size,'#8b5429',1.3*size);}
    if(drop===1){
      g.strokeStyle='#ffe3a1';g.lineWidth=1.7*size;
      for(let i=0;i<3;i++){const r=(12+((u*.9+i*.21)%1)*48)*size;g.globalAlpha=fade*(.65-i*.12);g.beginPath();g.ellipse(cx,ground-1,r,3+i*2,0,0,Math.PI*2);g.stroke();}
      for(let i=-3;i<=3;i++)art.line(cx,ground-2,cx+i*9*size,ground-(8+Math.abs(i)*3)*size,'#eec779',.9*size);
    }
  }else if(move.id==='storm'){
    const time=a.t*12;
    for(let i=0;i<10;i++){
      const level=i/9,y=cy+23*size-level*105*size,r=(23+level*70)*size;
      g.globalAlpha=fade*(.16+level*.16);g.fillStyle='#d3ac59';g.beginPath();g.ellipse(p.x,y,r,7*size,0,0,Math.PI*2);g.fill();
      g.globalAlpha=fade*.72;g.strokeStyle=i%2?'#fff1b7':'#dbad58';g.lineWidth=(i%2?.85:1.35)*size;
      g.beginPath();g.ellipse(p.x,y,r,9*size,0,time+i*.65,time+i*.65+Math.PI*1.5);g.stroke();
    }
    for(let i=0;i<16;i++){const t=(u*1.8+i/16)%1,r=(25+t*70)*size,angle=time+i*2.4;g.globalAlpha=fade*(1-t)*.8;art.disc(p.x+Math.cos(angle)*r,cy+20*size-t*104*size,1.1*size,'#ffe6a5');}
  }else if(move.id==='qi'){
    g.strokeStyle='#ffe5a0';g.lineWidth=1.1*size;
    for(let i=0;i<3;i++){g.globalAlpha=fade*(.55-i*.12);g.beginPath();g.ellipse(p.x,cy,25*size+i*4*size,32*size+i*4*size,-a.face*.25,a.t*5+i,Math.PI*1.5+a.t*5+i);g.stroke();}
    g.globalAlpha=fade*.25;art.disc(p.x+a.face*10*size,cy,21*size,'#f7ca6e');
  }else{
    const r=move.radius*size*Math.min(1,.35+u*4);
    g.globalAlpha=.12*fade;g.fillStyle='#f6ca64';g.beginPath();g.ellipse(p.x,cy,r,r*.45,0,0,Math.PI*2);g.fill();
    g.globalAlpha=.75*fade;g.strokeStyle='#ffe5a1';g.lineWidth=1.4*size;
    for(let i=0;i<3;i++){g.beginPath();g.ellipse(p.x,cy,r-i*5*size,(r-i*5*size)*.45,0,.2+u*12+i*.8,Math.PI*1.6+u*12+i*.8);g.stroke();}
  }
  g.restore();art.hudText(move.name,p.x,actorRootY(p)-57*size,'#ffe4a0',6.3*size,'center');
}
