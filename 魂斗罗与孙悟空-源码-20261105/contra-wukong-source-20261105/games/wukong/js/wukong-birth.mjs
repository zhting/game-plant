import { stoneMonkeyBirthPose } from './wukong-opening.mjs';

export const BIRTH_ASSETS=Object.freeze({
  birthMountain:'/games/wukong/assets/opening-huaguoshan.webp',
  birthActors:'/games/wukong/assets/opening-birth.webp',
});
// Polygon crops exclude neighboring limbs in the generated atlas. The original
// alpha channel is preserved; no color key or per-frame pixel read is needed.
export const BIRTH_FRAMES=Object.freeze({
  stone:{bounds:[0,230,526,710],anchor:[267,934],scale:.084},
  leap:{bounds:[500,50,610,860],anchor:[745,865],scale:.07,
    clip:[[520,180],[725,175],[930,50],[1100,50],[1100,260],[1025,340],[950,455],[990,560],[980,710],[820,890],[630,910],[560,800],[630,620],[520,565],[500,450],[510,370],[540,350]]},
  standing:{bounds:[970,220,566,735],anchor:[1305,936],scale:.078,
    clip:[[1160,220],[1536,220],[1536,955],[1050,955],[1040,700],[1060,640],[970,590],[970,420],[1130,420],[1160,330]]},
});
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
function path(g,points){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();}
function sprite(art,name){
  const source=art.images.birthActors;if(!source?.naturalWidth)return null;
  const key='birth:'+name;if(art.cache.has(key))return art.cache.get(key);
  const frame=BIRTH_FRAMES[name],[x,y,w,h]=frame.bounds,canvas=art.createCanvas();canvas.width=w;canvas.height=h;
  const g=canvas.getContext('2d');
  if(frame.clip){path(g,frame.clip.map(([a,b])=>[a-x,b-y]));g.clip();}
  g.drawImage(source,x,y,w,h,0,0,w,h);art.cache.set(key,canvas);return canvas;
}
function drawSprite(art,name,x,y){
  const image=sprite(art,name);if(!image)return;
  const f=BIRTH_FRAMES[name],s=f.scale;
  art.g.drawImage(image,(f.bounds[0]-f.anchor[0])*s+x,(f.bounds[1]-f.anchor[1])*s+y,image.width*s,image.height*s);
}
function shadow(g,x,y,width,alpha){
  g.save();g.globalAlpha*=alpha;g.fillStyle='#24362e';g.beginPath();g.ellipse(x,y,width,2.2,0,0,TAU);g.fill();g.restore();
}
function glow(g,x,y,r,alpha){
  const light=g.createRadialGradient(x,y,0,x,y,r);light.addColorStop(0,`rgba(255,246,190,${alpha})`);light.addColorStop(.3,`rgba(255,213,115,${alpha*.5})`);light.addColorStop(1,'rgba(255,224,145,0)');
  g.fillStyle=light;g.fillRect(x-r,y-r,r*2,r*2);
}
const shards=[
  {clip:[[0,0],[.55,0],[.46,.38],[0,.52]],vx:-72,vy:-77,spin:-2.8},
  {clip:[[.55,0],[1,0],[1,.45],[.46,.38]],vx:69,vy:-92,spin:3.3},
  {clip:[[0,.52],[.46,.38],[.56,.72],[0,1]],vx:-94,vy:-30,spin:-3.8},
  {clip:[[.46,.38],[1,.45],[1,1],[0,1],[.56,.72]],vx:91,vy:-50,spin:3.1},
];
function brokenStone(art,age){
  const image=sprite(art,'stone');if(!image||age<0||age>1.6)return;
  const g=art.g,f=BIRTH_FRAMES.stone,s=f.scale;
  const x=(f.bounds[0]-f.anchor[0])*s,y=(f.bounds[1]-f.anchor[1])*s,w=image.width*s,h=image.height*s;
  for(const shard of shards){
    const cx=shard.clip.reduce((sum,q)=>sum+q[0]*w,0)/shard.clip.length+x;
    const cy=shard.clip.reduce((sum,q)=>sum+q[1]*h,0)/shard.clip.length+y;
    g.save();g.globalAlpha*=clamp((1.6-age)/.6);
    g.translate(168+cx+shard.vx*age,143+cy+shard.vy*age+125*age*age);g.rotate(shard.spin*age);g.translate(-cx,-cy);
    path(g,shard.clip.map(([a,b])=>[x+a*w,y+b*h]));g.clip();g.drawImage(image,x,y,w,h);g.restore();
  }
}
function dust(g,age,x=168,y=142){
  if(age<0||age>1.25)return;
  g.save();g.globalAlpha*=Math.sin(Math.PI*clamp(age/1.25))*.36;
  for(let i=0;i<7;i++)glow(g,x+(i-3)*age*14,y-2-Math.sin(i*1.7)*3,8+age*11,.32);
  g.restore();
}
export function drawStoneMonkeyBirth(art,seconds){
  const g=art.g,q=stoneMonkeyBirthPose(seconds),mountain=art.images.birthMountain;
  g.save();
  const zoom=1+.035*clamp(seconds/5.8);g.translate(172,138);g.scale(zoom,zoom);g.translate(-172+q.shake, -138);
  if(mountain?.naturalWidth)g.drawImage(mountain,0,0,384,216);
  else{g.fillStyle='#9dbfbd';g.fillRect(0,0,384,216);}
  // Thin coastal mist drifts across the distant sea, behind the birth action.
  for(let i=0;i<3;i++){
    const x=280+Math.sin(seconds*.3+i)*18,y=160+i*11;
    const haze=g.createRadialGradient(x,y,1,x,y,53);haze.addColorStop(0,'rgba(242,242,215,.1)');haze.addColorStop(1,'rgba(242,242,215,0)');
    g.fillStyle=haze;g.fillRect(x-53,y-53,106,106);
  }
  if(q.stoneVisible){
    shadow(g,168,143,22,.35);glow(g,168,115,28,.07+q.charge*.18);
    drawSprite(art,'stone',168+q.shake,143);
    g.save();g.globalAlpha*=q.charge*.85;g.strokeStyle='#fff0b4';g.lineWidth=.45+q.charge*.4;g.lineJoin='round';
    for(const points of [[[165,86],[169,98],[163,109],[172,120],[167,136]],[[164,110],[154,116],[148,130]],[[171,120],[181,114],[184,102]]]){
      g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x+q.shake,y):g.moveTo(x+q.shake,y));g.stroke();
    }g.restore();
  }
  if(q.age>=0){
    glow(g,168,117,29+clamp(q.age/.6)*28,q.flash*.9);brokenStone(art,q.age);dust(g,q.age);
    if(q.age<1.25){
      g.save();g.globalAlpha*=clamp((1.25-q.age)/.5);
      for(let i=0;i<18;i++){
        const a=i*2.399,velocity=30+(i%5)*15,x=168+Math.cos(a)*velocity*q.age,y=117+Math.sin(a)*velocity*q.age+100*q.age*q.age;
        g.fillStyle=i%3?'#c6b38b':'#fff0b4';path(g,[[x,y-1.1],[x+1.5,y+1],[x-1.3,y+1]]);g.fill();
      }g.restore();
    }
  }
  if(q.visible){
    shadow(g,q.x,143,12-(143-q.y)*.09,.3-(143-q.y)*.003);g.save();g.globalAlpha*=q.alpha;
    g.translate(q.x,q.y-23);g.rotate(q.turn);g.scale(1+(1-q.squash)*.4,q.squash+q.breath);g.translate(0,23);
    const alpha=g.globalAlpha;
    if(q.landBlend<1){g.globalAlpha=alpha*(1-q.landBlend);drawSprite(art,'leap',0,0);}
    if(q.landBlend>0){g.globalAlpha=alpha*q.landBlend;drawSprite(art,'standing',0,0);}
    g.restore();
    if(q.landed)dust(g,seconds-4.45,q.x,143);
  }
  g.restore();return q;
}
