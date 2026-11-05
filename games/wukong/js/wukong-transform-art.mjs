import {TRANSFORM_FORMS,transformation} from './wukong-transform.mjs';
export const TRANSFORM_ASSET='/games/wukong/assets/hero-transform-atlas.webp';
const FRAMES={peng:[[32,10,336,386],[393,101,391,237],[786,118,421,212],[1193,121,326,276]],
  tiger:[[10,431,365,248],[381,449,401,225],[784,439,424,186],[1184,432,341,241]],
  tortoise:[[15,699,363,299],[393,717,384,280],[800,736,323,255],[1138,704,386,295]]};
export function drawTransformation(art,p){
  const state=transformation(p),image=art.images.heroTransform;if(!state||p.dead||!image?.naturalWidth)return false;
  const g=art.g,form=TRANSFORM_FORMS[state.form],a=state.attack,clock=state.t;
  const index=state.guard?2:a?Math.min(3,1+Math.floor(a.t/form.duration*3)):Math.abs(p.vx)>.5||state.form==='peng'?Math.floor(clock*5)%2:0;
  const f=FRAMES[state.form][index],w=state.form==='peng'?61:state.form==='tiger'?58:50,h=w*f[3]/f[2],face=a?.face||p.face||1;
  g.save();g.translate(p.x,p.y);g.scale(face,1);g.imageSmoothingEnabled=true;
  if(p.hurt)g.filter='brightness(1.6)';
  if(a&&state.form!=='tortoise')for(let i=3;i>0;i--){g.save();g.globalAlpha*=.09*(1-i/4);g.drawImage(image,...f,-w*.5-i*8,-h,w,h);g.restore();}
  const bob=state.form==='peng'?Math.sin(clock*7)*1.6:Math.abs(p.vx)>.5?Math.sin(clock*16)*.6:0;
  g.drawImage(image,...f,-w*.5,-h+bob,w,h);g.restore();
  if(state.shift>0){const u=1-state.shift/.35;g.save();g.globalAlpha*=Math.sin(Math.PI*Math.max(0,u))*.8;g.strokeStyle=form.color;g.lineWidth=1.4;
    for(let i=0;i<9;i++){const angle=i*Math.PI*2/9;g.beginPath();g.ellipse(p.x+Math.cos(angle)*(12+u*18),p.y-20+Math.sin(angle)*(8+u*12),4+u*4,2+u*2,angle,0,Math.PI*2);g.stroke();}g.restore();}
  if(state.guard){g.save();g.globalAlpha*=.7;g.strokeStyle='#a6ffe6';g.shadowColor='#96f4d0';g.shadowBlur=5;g.lineWidth=1.4;g.beginPath();g.ellipse(p.x,p.y-17,30,23,0,0,Math.PI*2);g.stroke();g.restore();}
  if(a){const u=a.t/form.duration,alpha=Math.sin(Math.PI*u);g.save();g.globalAlpha*=alpha;g.strokeStyle=form.color;g.shadowColor=form.color;g.shadowBlur=5;g.lineWidth=1.6;
    if(state.form==='tortoise'){g.beginPath();g.ellipse(p.x,p.y-2,12+u*60,4+u*10,0,0,Math.PI*2);g.stroke();}
    else for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(p.x-face*4,p.y-21+i*5);g.quadraticCurveTo(p.x+face*30,p.y-40+i*5,p.x+face*54,p.y-12+i*5);g.stroke();}g.restore();}
  art.hudText(form.name,p.x,p.y-h-5,'#fff1c8',5.3,'center');return true;
}
