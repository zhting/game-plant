export const HIVE_HAZARD_ASSETS=Object.freeze({
  chasm:'/games/contra2026/assets/stage7/alien-chasm-v2.webp',
  boneSpike:'/games/contra2026/assets/stage7/alien-bone-spike-v2.webp'
});

export const hiveSpikeHeight=sp=>sp.t<.8?0:sp.t<1.5?64*Math.min(1,(sp.t-.8)/.12):64*Math.max(0,1-(sp.t-1.5)/.3);

export function drawHiveChasm(art,a,b){
  if(!art.loaded.has('chasm'))return;
  const g=art.g,width=(b-a)/.56;
  g.save();g.beginPath();g.rect(a-12,175,b-a+24,41);g.clip();
  // Register the two torn lips to the actual collision edges of the gap.
  g.drawImage(art.images.chasm,a-width*.22,176-75/958*65,width,65);
  g.restore();
}

function oval(g,x,y,rx,ry,color){g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}

/** Surface tension stretches a neck before pinch-off; speed lengthens a detached tail. */
export function hiveSlimeShape(k=0,vy=0,falling=false,age=0){
  if(falling)return {radius:2.15,neck:Math.max(0,7-age*25)+Math.min(4,vy/75),stretch:1+Math.min(.5,vy/600)};
  const u=Math.max(0,Math.min(1,k));
  return {radius:1.25+u*2.1,neck:1+u*u*7,stretch:1+u*.22,waist:Math.max(.22,1.4-u*1.2)};
}

function slimeDrop(g,x,y,shape){
  const {radius:r,neck,stretch}=shape,top=y-neck-r*stretch;
  const fill=g.createLinearGradient(x-r,top,x+r,y+r*stretch);fill.addColorStop(0,'#e4a6c8');fill.addColorStop(.25,'#bb779d');fill.addColorStop(.6,'#78365f');fill.addColorStop(1,'#41213e');
  g.fillStyle=fill;g.beginPath();g.moveTo(x,top);
  g.bezierCurveTo(x+(shape.waist||.28),y-r*stretch,x+r,y-r*.7,x+r,y+r*.2);
  g.bezierCurveTo(x+r,y+r*stretch*1.4,x-r,y+r*stretch*1.4,x-r,y+r*.2);
  g.bezierCurveTo(x-r,y-r*.7,x-(shape.waist||.28),y-r*stretch,x,top);g.fill();
  g.strokeStyle='rgba(255,222,237,.8)';g.lineWidth=.5;g.lineCap='round';g.beginPath();g.moveTo(x-.5,y-r*.65);g.quadraticCurveTo(x-r*.7,y,x-r*.45,y+r*.45);g.stroke();
}

export function drawHiveSlime(art,S){
  const g=art.g;
  for(const d of S.drips||[]){
    // A veined fleshy outlet attaches the secretion to the ceiling.
    const fill=g.createLinearGradient(d.x-4,0,d.x+4,0);fill.addColorStop(0,'#211126');fill.addColorStop(.4,'#73374f');fill.addColorStop(.65,'#9f5371');fill.addColorStop(1,'#27132c');
    g.fillStyle=fill;g.beginPath();g.moveTo(d.x-4,0);g.bezierCurveTo(d.x-2,10,d.x-4,19,d.x,21);g.bezierCurveTo(d.x+4,19,d.x+2,10,d.x+4,0);g.fill();
    art.line(d.x-.7,1,d.x-.2,18,'rgba(211,120,145,.4)',.45);
    oval(g,d.x,20.3,2.1,.8,'#2d102a');
    if(d.forming){const shape=hiveSlimeShape(d.k);slimeDrop(g,d.x,21+shape.neck,shape);}
    else oval(g,d.x,20.8,1.5,.65,'#bf84ab');
  }
  for(const d of S.drops||[])if(!d.dead)slimeDrop(g,d.x,d.y-2,hiveSlimeShape(0,d.vy,true,d.age||0));
}

export function drawHiveSpike(art,sp){
  const g=art.g,h=hiveSpikeHeight(sp),scale=64/1400;
  if(!art.loaded.has('boneSpike'))return;
  const image=art.images.boneSpike;
  if(h>0){
    g.save();g.beginPath();g.rect(sp.x-12,176-h,24,h);g.clip();
    // Rigid spike slides through its socket: its native shape never stretches.
    g.drawImage(image,260,50,460,1400,sp.x-230*scale,176-h,460*scale,64);
    g.restore();
  }
  const warn=sp.t<.8?Math.sin(Math.min(1,sp.t/.8)*Math.PI/2):1;
  const rootH=7+warn*1.5;
  g.drawImage(image,260,1250,460,200,sp.x-230*scale,176-rootH,460*scale,rootH);
  if(sp.t<.8){
    oval(g,sp.x,174.8,3+warn*1.5,1+warn*.6,'rgba(207,61,106,.38)');
    art.line(sp.x-5,175.5,sp.x+5,175.5,'rgba(248,148,171,.5)',.5);
  }
}

export function drawHiveSlimeSplash(art,fx){
  const g=art.g,t=fx.t,p=t/fx.life;
  g.save();g.globalAlpha=Math.max(0,1-p*p);
  const spread=1-Math.exp(-t*8),width=2+spread*7;
  oval(g,fx.x,fx.y-.3,width,.55+spread*.7,'rgba(94,38,78,.85)');
  oval(g,fx.x-.5,fx.y-.8,width*.8,.35,'rgba(233,171,204,.6)');
  if(t<.34)for(const [i,vx]of [-22,-11,13,24].entries()){
    const vy=-25-i%2*12,x=fx.x+vx*t,y=fx.y-1+vy*t+115*t*t;
    if(y<fx.y)slimeDrop(g,x,y,{radius:.65,neck:Math.max(0,2-t*8),stretch:1.2});
  }
  if(t<.16){g.strokeStyle='#b978a0';g.lineWidth=.65;g.beginPath();g.moveTo(fx.x-4*spread,fx.y-1);g.quadraticCurveTo(fx.x,fx.y-5*(1-t/.16),fx.x+4*spread,fx.y-1);g.stroke();}
  g.restore();
}
