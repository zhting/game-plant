import { drawBladeCrescent } from './wukong-blade-art.mjs';
import { staffVfxFamily } from './wukong-staff-vfx.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;};

// Keep the contact on the struck body and store only small, network-safe data.
export function martialHitEffect({x,y,target,heavy=false,killed=false,metal=false,player=false,blood=false,face=1,weapon='staff',angle=0,form=null,seed=0}={}){
  if(target){x=clamp(x,target.x,target.x+target.w);y=clamp(y,target.y,target.y+target.h);}
  blood=!!blood&&!player;
  return {k:'martialImpact',x,y,heavy,killed,metal,player,blood,face,weapon,angle,form,seed,t:0,life:blood?(killed?.58:heavy?.48:.4):(killed?.42:heavy?.36:.28)};
}
export function addMartialHit(effects,options){
  const effect=martialHitEffect(options);
  const nearby=effects.find(f=>f.k==='martialImpact'&&!f.dead&&f.t<.025&&f.player===effect.player&&f.metal===effect.metal&&Math.hypot(f.x-effect.x,f.y-effect.y)<4);
  if(nearby){nearby.heavy||=effect.heavy;nearby.killed||=effect.killed;nearby.blood||=effect.blood;nearby.life=Math.max(nearby.life,effect.life);return nearby;}
  const active=effects.filter(f=>f.k==='martialImpact'&&!f.dead);
  if(active.length>=24)active[0].dead=true;
  effects.push(effect);return effect;
}
export function drawMartialHit(art,f){
  const g=art.g,t=f.t,heavy=f.heavy||f.killed,u=clamp(t/(f.killed?.42:heavy?.36:.28),0,1);
  const radius=f.killed?20:heavy?16:11,fade=(1-u)**.8,burst=clamp(t/.025,0,1);
  const gold=f.player?'#f59a7a':f.metal?'#e2d8a9':'#efbf62',white=f.player?'#ffe8cb':'#fff8d6';
  g.save();g.translate(f.x,f.y);g.rotate(f.angle||0);
  const glow=g.createRadialGradient(0,0,0,0,0,radius*1.25);
  glow.addColorStop(0,f.player?'rgba(255,155,105,.4)':'rgba(255,238,181,.34)');glow.addColorStop(1,'rgba(255,218,131,0)');
  g.globalAlpha*=fade;g.fillStyle=glow;g.fillRect(-radius*1.25,-radius*1.25,radius*2.5,radius*2.5);
  // Keep the contact glint small so the thin blades carry the silhouette.
  if(t<.14){
    const r=radius*.42*(.6+burst*.4)*(1-u*.4);
    g.beginPath();
    for(let i=0;i<16;i++){
      const a=i*Math.PI/8,rr=i%2?r*.09:r*(i%4?.65:1),x=Math.cos(a)*rr,y=Math.sin(a)*rr*.78;
      i?g.lineTo(x,y):g.moveTo(x,y);
    }g.closePath();g.lineWidth=.45;g.strokeStyle='#c3a16a';g.stroke();g.fillStyle=white;g.fill();
    g.globalAlpha*=.9;art.disc(0,0,1.1+(heavy?.4:0),white);
  }
  g.globalAlpha=fade*.5;g.strokeStyle=gold;g.lineWidth=heavy?.55:.35;
  const ring=3+u*radius*1.6;
  g.beginPath();g.ellipse(0,0,ring,ring*.62,-.35,0,Math.PI*2);g.stroke();
  if(heavy){g.globalAlpha*=.6;g.beginPath();g.ellipse(0,0,ring*.75,ring*.46,.55,0,Math.PI*2);g.stroke();}
  // Two pointed crescent blades intersect at the actual contact.
  if(t<.2)for(const sign of [-1,1]){
    const r=radius*.95,depth=.6;
    g.save();g.rotate(-Math.PI/2+sign*.65);g.translate(-depth*.75*r,0);g.globalAlpha=fade*.95;
    drawBladeCrescent(art,{radius:r,depth,inset:.055,strength:heavy?2:1,glint:false});g.restore();
  }
  if(f.form&&t<.16){
    const family=staffVfxFamily(f.form),snap=(1-t/.16)**1.5,reach=(heavy?22:16)*(1+t*2);
    g.save();g.globalCompositeOperation='lighter';g.shadowColor=gold;g.shadowBlur=2.8*(art.scale||1);g.globalAlpha=snap*.9;
    g.strokeStyle=white;g.lineWidth=.7;
    if(family==='thrust'){
      g.beginPath();g.moveTo(-reach*.9,0);g.lineTo(reach,0);g.moveTo(-reach*.3,-2);g.lineTo(reach*.5,0);g.stroke();
    }else if(family==='lift'||family==='low'){
      g.beginPath();g.moveTo(-reach*.65,-3);g.quadraticCurveTo(0,-reach*.22,reach*.8,1);g.stroke();
    }else if(family==='wheel'||family==='flower'){
      for(let i=0;i<2;i++){g.beginPath();g.ellipse(0,0,4+t*80+i*2,3+t*45+i*2,i*.8,0,Math.PI*1.65);g.stroke();}
    }else{
      g.beginPath();g.moveTo(-reach*.7,-reach*.35);g.lineTo(reach*.7,reach*.35);g.moveTo(-reach*.4,reach*.45);g.lineTo(reach*.4,-reach*.45);g.stroke();
    }
    g.restore();
  }
  for(let i=0;i<(heavy?12:8);i++){
    const a=hash(f.seed+i*137)*Math.PI*2,speed=(35+hash(f.seed+i*47)*70)*(heavy?1.2:1);
    const x=Math.cos(a)*speed*t,y=Math.sin(a)*speed*t+80*t*t,tail=Math.min(t,.032);
    g.globalAlpha=fade*(.6+hash(f.seed+i*19)*.4);g.strokeStyle=i%3?gold:white;g.lineWidth=i%3?.35:.6;
    g.beginPath();g.moveTo(x-Math.cos(a)*speed*tail,y-Math.sin(a)*speed*tail);g.lineTo(x,y);g.stroke();
    if(f.metal||f.killed){g.fillStyle=i%2?gold:'#fff7d1';g.fillRect(x-.55,y-.45,1.1,.9);}
  }
  g.restore();
  if(f.blood)drawBloodSpray(art,f);
}

// Sample ballistic droplets from the hit event, without particle entities or RNG.
// Gravity stays vertical even when the staff strikes on a diagonal.
function drawBloodSpray(art,f){
  const g=art.g,t=f.t+.012,u=clamp(f.t/f.life,0,1),heavy=f.heavy||f.killed;
  const count=f.killed?19:heavy?15:10,force=f.killed?1.35:heavy?1.2:1;
  const angle=f.face<0&&Math.cos(f.angle||0)>.95?Math.PI:(f.angle||0);
  const travel=(1-Math.exp(-2.2*t))/2.2,fade=Math.min(1,(1-u)*2);
  g.save();g.translate(f.x,f.y);g.globalAlpha*=fade;
  for(let i=0;i<count;i++){
    const a=angle+(hash(f.seed+701+i*137)-.5)*1.65;
    const speed=(60+hash(f.seed+919+i*47)*105)*force;
    const vx=Math.cos(a)*speed,vy=Math.sin(a)*speed-18;
    const x=vx*travel,y=vy*travel+105*t*t;
    const size=(.55+hash(f.seed+337+i*19)*.95)*(heavy?1.18:1)*(1-u*.4);
    const tilt=Math.atan2(vy*Math.exp(-2.2*t)+210*t,vx*Math.exp(-2.2*t));
    const color=i%3===0?'#ed4938':i%3===1?'#c52c26':'#97231f';
    if(i<4&&t<.15){
      g.beginPath();g.moveTo(Math.cos(a)*1.5,Math.sin(a)*1.5);
      g.quadraticCurveTo(x*.48,y*.3-1,x,y);
      g.strokeStyle='#7c211e';g.lineWidth=size*1.45;g.stroke();
      g.strokeStyle=color;g.lineWidth=size*.85;g.stroke();
    }
    g.beginPath();g.ellipse(x,y,size*(1.65-u*.6),size*.72,tilt,0,Math.PI*2);
    g.fillStyle=color;g.fill();g.strokeStyle='#781c1a';g.lineWidth=.3;g.stroke();
  }
  g.restore();
}
