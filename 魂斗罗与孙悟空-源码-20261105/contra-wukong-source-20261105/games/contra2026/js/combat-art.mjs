/** Shared, snow-free equipment and deterministic explosion animation. */
export const COMBAT_ASSETS = Object.freeze({
  explosionAtlas: '/games/contra2026/assets/shared/explosions.webp',
  supplySaucer: '/games/contra2026/assets/shared/supply-saucer.webp',
  equipmentTurret: '/games/contra2026/assets/shared/turret-kit.webp',
  equipmentSupply: '/games/contra2026/assets/shared/supply-case.webp'
});
export const EXPLOSION_ART = Object.freeze({cell:256,columns:4,frames:12});
export const EQUIPMENT_TURRET = Object.freeze({body:[436,14,664,680],barrel:[175,711,1190,298],pivot:[768,347]});
export const EQUIPMENT_SUPPLY = Object.freeze({closed:[46,512,689,348],open:[810,199,691,661]});
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));

export function explosionFrame(effect) {
  const progress=clamp(effect.t/Math.max(.001,effect.life||.5),0,1);
  return {progress,index:Math.min(EXPLOSION_ART.frames-1,Math.floor(progress*EXPLOSION_ART.frames)),
    size:clamp((effect.s||8)*3.6,14,150)};
}

/** The snapshot's event age selects the frame; rendering never advances state. */
export function drawExplosion(g,image,effect) {
  if(effect.dead||effect.t<0||effect.t>=effect.life)return false;
  const {progress:p,index,size}=explosionFrame(effect),x=effect.x,y=effect.y-p*size*.06;
  g.save();
  if(p<.58){
    const energy=(1-p/.58)**1.7,radius=size*(.54+p*.3);
    g.globalCompositeOperation='lighter';
    const glow=g.createRadialGradient(x,y,0,x,y,radius);
    glow.addColorStop(0,`rgba(255,242,192,${energy*.62})`);
    glow.addColorStop(.28,`rgba(255,166,45,${energy*.35})`);
    glow.addColorStop(1,'rgba(255,83,13,0)');
    g.fillStyle=glow;g.beginPath();g.arc(x,y,radius,0,Math.PI*2);g.fill();
    g.globalCompositeOperation='source-over';
  }
  g.globalAlpha*=p>.74?clamp((1-p)/.26,0,1):1;
  if(image){
    const c=EXPLOSION_ART.cell;
    g.drawImage(image,index%4*c,Math.floor(index/4)*c,c,c,x-size/2,y-size/2,size,size);
  }else{
    g.fillStyle=p<.5?'#ffcb66':'#6c5d54';g.beginPath();g.arc(x,y,size*(.12+.14*p),0,Math.PI*2);g.fill();
  }
  if(p<.18){
    g.globalCompositeOperation='lighter';g.globalAlpha*=1-p/.18;
    g.fillStyle='#fff9dd';g.beginPath();g.ellipse(x,y,size*.12,size*.07,0,0,Math.PI*2);g.fill();
  }
  g.restore();return true;
}

export function drawSupplyDisc(g,image,x,y) {
  if(!image)return false;
  const scale=Math.min(30/(image.naturalWidth||image.width),10/(image.naturalHeight||image.height));
  const w=(image.naturalWidth||image.width)*scale,h=(image.naturalHeight||image.height)*scale;
  g.drawImage(image,x-w/2,y-h/2,w,h);return true;
}

export function drawEquipmentTurret(g,image,e,{scale=.039,pivotY=e.y+3.5,frozen=false,paintBarrel=paint=>paint()}={}) {
  if(!image)return false;
  const {body,barrel,pivot}=EQUIPMENT_TURRET,[sx,sy,sw,sh]=body,[px,py]=pivot;
  const angle=(e.idx??6)*Math.PI/6,age=1.5-e.fireT;
  g.save();
  if(e.flash>0)g.filter='brightness(1.65) saturate(.6)';else if(frozen)g.filter='saturate(.3) brightness(1.12)';
  g.drawImage(image,sx,sy,sw,sh,e.x+(sx-px)*scale,pivotY+(sy-py)*scale,sw*scale,sh*scale);
  const [bx,by,bw,bh]=barrel,w=13.5,h=w*bh/bw,recoil=!frozen&&age>=0&&age<.1?.7*(1-age/.1):0;
  g.save();g.translate(e.x,pivotY);g.rotate(angle);
  paintBarrel(()=>g.drawImage(image,bx,by,bw,bh,-2.5-recoil,-h/2,w,h));
  g.restore();g.restore();return true;
}

export function drawEquipmentSupply(g,image,e,width=20) {
  if(!image)return false;
  const [sx,sy,sw,sh]=EQUIPMENT_SUPPLY[e.open?'open':'closed'],height=width*sh/sw;
  g.save();if(e.flash>0)g.filter='brightness(1.6) saturate(.6)';
  g.drawImage(image,sx,sy,sw,sh,e.x-width/2,e.y-height,width,height);g.restore();return true;
}
