import { HEALING_ITEMS, WUKONG_HEALTH } from './wukong-vitality.mjs';
import { drawMartialHit } from './wukong-impact.mjs';

export function drawHealthBar(art,p,x){
  const g=art.g,max=p.maxHp||WUKONG_HEALTH.max,hp=Math.max(0,p.hp??max),ratio=Math.min(1,hp/max);
  const bx=x+19,by=29,w=80,h=4.4;
  art.rect(x+2,27.5,127,8,'rgba(9,26,29,.83)');
  art.hudText('气血',x+5,29,'#e0cc9d',4.3);
  art.rect(bx-.6,by-.6,w+1.2,h+1.2,'#a98b57');art.rect(bx,by,w,h,'#192c31');
  art.rect(bx,by,w*Math.min(1,(p.hpTrail??hp)/max),h,'#d9ae62');
  if(ratio>0){
    const fill=g.createLinearGradient(bx,by,bx,by+h);
    fill.addColorStop(0,p.healFlash>0?'#a4e6aa':ratio<.3?'#f38a6a':'#e7a07b');
    fill.addColorStop(1,p.healFlash>0?'#398b76':ratio<.3?'#bd352b':'#b94e43');
    g.fillStyle=fill;g.fillRect(bx,by,w*ratio,h);
  }
  for(let i=1;i<5;i++)art.rect(bx+w*i/5,by,.45,h,'rgba(16,27,29,.42)');
  art.hudText(`${Math.ceil(hp)}/${max}`,x+125,29,'#fff1ce',4.5,'right');
}

// A green heart distinguishes healing peaches; pills use a golden elixir orb.
// These small UI symbols are native canvas art, so no extra download is needed.
export function drawHealingPickup(art,x,y,kind,small=false){
  if(!HEALING_ITEMS[kind])return false;
  const g=art.g,w=small?7:11,t=art.state.time||0;
  g.save();
  const aura=g.createRadialGradient(x,y,1,x,y,w*1.5);
  aura.addColorStop(0,kind==='healPill'?'rgba(255,214,98,.55)':'rgba(149,239,183,.55)');aura.addColorStop(1,'rgba(120,225,172,0)');
  g.fillStyle=aura;g.fillRect(x-w*1.5,y-w*1.5,w*3,w*3);
  if(kind==='healPill'){
    const orb=g.createRadialGradient(x-w*.15,y-w*.2,.4,x,y,w*.43);
    orb.addColorStop(0,'#fff9d8');orb.addColorStop(.4,'#fbe5a2');orb.addColorStop(.75,'#d99835');orb.addColorStop(1,'#946032');
    g.fillStyle=orb;g.beginPath();g.arc(x,y,w*.43,0,Math.PI*2);g.fill();
    g.strokeStyle='#fff1ad';g.lineWidth=.6;g.beginPath();g.ellipse(x,y,w*.66,w*.27,-.35+t*.8,0,Math.PI*2);g.stroke();
  }
  const hy=y-w*.78,hx=x+w*.35,s=small?.9:1.25;
  g.fillStyle='#b9f3bb';g.beginPath();g.moveTo(hx,hy+s*1.25);
  g.bezierCurveTo(hx-s*2,hy,hx-s*1.1,hy-s*1.6,hx,hy-s*.55);
  g.bezierCurveTo(hx+s*1.1,hy-s*1.6,hx+s*2,hy,hx,hy+s*1.25);g.fill();
  g.restore();return kind==='healPill';
}

export function drawMartialEffects(art,effects){
  const g=art.g;
  for(const f of effects){
    if(f.dead)continue;
    const u=Math.min(1,f.t/f.life);
    if(f.k==='martialImpact'){
      drawMartialHit(art,f);
    }else if(f.k==='combatNumber'){
      g.save();g.globalAlpha*=Math.min(1,(1-u)*3);
      art.hudText(f.text,f.x,f.y-u*13,f.heal?'#b3f0b4':f.player?'#ffab97':'#fff2c8',f.heal?6:5.5,'center');g.restore();
    }else if(f.k==='landingDust'){
      g.save();g.globalAlpha*=Math.sin(Math.PI*u)*.35;g.fillStyle='#e8dfc1';
      for(let i=-2;i<=2;i++){g.beginPath();g.ellipse(f.x+i*(2+u*5),f.y-.5-u,2+u*2,1+u*.9,0,0,Math.PI*2);g.fill();}g.restore();
    }else if(f.k==='qiBurst'){
      g.save();g.translate(f.x,f.y);g.globalAlpha*=(1-u)*.8;g.globalCompositeOperation='lighter';g.shadowColor='#f8d38c';g.shadowBlur=2*(art.scale||1);g.strokeStyle='#fff7dc';g.lineWidth=(f.strength===2?.65:.4)*(1-u);
      for(let i=0;i<7;i++){
        const a=i*Math.PI*2/7,r=2+u*(f.strength===2?18:11);
        g.beginPath();g.moveTo(Math.cos(a)*r*.35,Math.sin(a)*r*.35);g.lineTo(Math.cos(a)*r,Math.sin(a)*r);g.stroke();
      }g.restore();
    }else if(f.k==='slamLand'){
      const radius=(f.size||1)*(5+u*29);
      g.save();g.globalAlpha*=(1-u)*.7;g.strokeStyle='#ffe6a4';g.lineWidth=(1-u)*1.7;
      g.beginPath();g.ellipse(f.x,f.y-1,radius,2+u*4,0,0,Math.PI*2);g.stroke();
      g.globalAlpha*=.5;g.fillStyle='#f3e8cb';
      for(let i=-3;i<=3;i++){g.beginPath();g.ellipse(f.x+i*radius/3,f.y-1-u*3,2+u*3,1.2+u,0,0,Math.PI*2);g.fill();}g.restore();
    }else if(f.k==='healing'){
      g.save();g.globalAlpha*=1-u;g.strokeStyle='#b6f4ba';g.lineWidth=.7;
      for(let i=0;i<6;i++){
        const angle=i*Math.PI/3+u,r=4+u*11,x=f.x+Math.cos(angle)*r,y=f.y-u*18+Math.sin(angle)*r*.4;
        g.beginPath();g.moveTo(x-1.5,y);g.lineTo(x+1.5,y);g.moveTo(x,y-1.5);g.lineTo(x,y+1.5);g.stroke();
      }g.restore();
    }
  }
}
