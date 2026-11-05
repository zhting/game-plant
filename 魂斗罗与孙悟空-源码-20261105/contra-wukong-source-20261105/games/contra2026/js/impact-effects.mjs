const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const random=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return((n^(n>>>16))>>>0)/4294967296;};

export function impactContact(x,y,target,vx=1,vy=0){
  if(!target)return{x,y};
  const point={x:clamp(x,target.x,target.x+target.w),y:clamp(y,target.y,target.y+target.h)};
  if(Math.abs(vx)>=Math.abs(vy))point.x=vx>=0?target.x:target.x+target.w;
  else point.y=vy>=0?target.y:target.y+target.h;
  return point;
}

export function addImpact(effects,{x,y,material='metal',vx=1,vy=0,weapon='b',seed=0,target}={}){
  const contact=impactContact(x,y,target,vx,vy),power=weapon==='msl'?1.35:weapon==='laser'?1.1:weapon==='fire'?.8:1;
  const nearby=effects.find(f=>f.k==='impact'&&!f.dead&&f.t<.035&&f.material===material&&Math.hypot(f.x-contact.x,f.y-contact.y)<2.5);
  if(nearby){nearby.power=Math.min(1.5,nearby.power+.15);return nearby;}
  const active=effects.filter(f=>f.k==='impact'&&!f.dead);
  if(active.length>=32)effects.splice(effects.indexOf(active[0]),1);
  const effect={k:'impact',...contact,material,angle:Math.atan2(vy,vx)+Math.PI,power,seed,t:0,life:material==='body'?.19:.29};
  effects.push(effect);return effect;
}

/** One synchronized event draws a short flash and deterministic fan of fine particles. */
export function drawImpact(g,fx){
  const t=fx.t,progress=clamp(t/fx.life,0,1),fade=(1-progress)**1.4;
  if(fade<=0)return;
  const energy=fx.material==='core',shield=fx.material==='shield',body=fx.material==='body';
  const color=shield||energy?'#b9eeff':'#ffe9a0',hot=shield?'#79d9ff':energy?'#69cfff':'#ffab48';
  const power=(fx.power||1)*(body?.7:1),seed=fx.seed||0,normal=fx.angle??Math.PI;
  g.save();g.translate(fx.x,fx.y);g.lineCap='round';g.lineJoin='round';
  // Smoke stays small and translucent, so repeated hits leave the target readable.
  if(!body&&!shield&&t>.025){
    for(let i=0;i<2;i++){
      const radius=(.6+t*6+i*.25)*power;
      g.fillStyle=`rgba(124,143,145,${fade*.12})`;g.beginPath();
      g.ellipse(Math.cos(normal)*t*12+(i-.5)*1.5,-t*(8+i*3),radius,radius*.7,0,0,Math.PI*2);g.fill();
    }
  }
  if(t<.065){
    const flash=1-t/.065,radius=(body?2.2:3.9)*power;
    const light=g.createRadialGradient(0,0,0,0,0,radius*1.6);
    light.addColorStop(0,shield||energy?`rgba(160,224,255,${flash*.6})`:`rgba(255,185,78,${flash*.6})`);
    light.addColorStop(1,'rgba(255,170,50,0)');g.fillStyle=light;
    g.beginPath();g.arc(0,0,radius*1.6,0,Math.PI*2);g.fill();
    g.save();g.rotate(normal);g.scale(1,.65);g.fillStyle='#fff9df';g.globalAlpha*=flash;
    g.beginPath();g.moveTo(-radius*.45,0);g.lineTo(-.3,-radius*.4);g.lineTo(radius*.5,-radius*.15);
    g.lineTo(radius,0);g.lineTo(radius*.3,radius*.2);g.lineTo(-.2,radius*.4);g.closePath();g.fill();g.restore();
  }
  const count=body?4:energy?10:8;
  for(let i=0;i<count;i++){
    const life=.1+random(seed+i*79)*.17;if(t>life)continue;
    const a=normal+(random(seed+i*131)-.5)*2.35,speed=(25+random(seed+i*37)*65)*power;
    const x=Math.cos(a)*speed*t,y=Math.sin(a)*speed*t+95*t*t;
    const trail=Math.min(t,.014+random(seed+i*19)*.012),alpha=(1-t/life)**.7;
    g.beginPath();g.moveTo(x-Math.cos(a)*speed*trail,y-Math.sin(a)*speed*trail);g.lineTo(x,y);
    g.globalAlpha=alpha*.65;g.strokeStyle=energy||shield?'#14394b':'#4c2b0d';g.lineWidth=1.05*power;g.stroke();
    g.globalAlpha=alpha;g.strokeStyle=i%3?hot:color;g.lineWidth=(i%3?.43:.62)*power;g.stroke();
    g.fillStyle=i%2?color:'#fffceb';g.fillRect(x-.23,y-.23,.46*power,.46*power);
  }
  g.globalAlpha=fade;
  if((energy||shield)&&t<.16){
    g.strokeStyle=hot;g.lineWidth=.38;g.globalAlpha=fade*.65;
    g.beginPath();g.ellipse(0,0,(1+t*26)*power,(.6+t*18)*power,normal,0,Math.PI*2);g.stroke();
  }else if(!body){
    for(let i=0;i<2;i++){
      const a=normal+(random(seed+800+i)-.5),speed=(18+i*14)*power;
      g.save();g.translate(Math.cos(a)*speed*t,Math.sin(a)*speed*t+110*t*t);g.rotate(t*(8+i*5));
      g.fillStyle=i?'#8b9c9e':'#d0d9c8';g.beginPath();g.moveTo(-.55,-.25);g.lineTo(.65,0);g.lineTo(-.2,.6);g.closePath();g.fill();g.restore();
    }
  }
  g.restore();
}
