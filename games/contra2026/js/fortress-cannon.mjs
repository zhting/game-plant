// Coordinates in the existing 1201 x 1254 facade crop. Only the sliding tube
// moves; the collar, recoil cylinders, armor and concrete remain stationary.
export const FORTRESS_CANNON_ART=Object.freeze({
  gunA:Object.freeze({crop:Object.freeze([0,330,117,84]),muzzle:Object.freeze([2,371]),targetY:342}),
  gunB:Object.freeze({crop:Object.freeze([0,854,117,84]),muzzle:Object.freeze([2,895]),targetY:835})
});
const smooth=t=>t*t*(3-2*t);

export function fortressCannonPose(part){
  const age=part.shotAge;
  if(part.hp<=0||!Number.isFinite(age)||age<0)return {age:-1,recoil:0,flash:0};
  const recoil=age<.045?3.2*Math.sin(age/.045*Math.PI/2):age<.36?3.2*(1-smooth((age-.045)/.315)):0;
  return {age,recoil,flash:Math.max(0,1-age/.085)};
}

export function fortressCannonMuzzle(part){
  const art=FORTRESS_CANNON_ART[part.k];
  return {x:part.x+art.muzzle[0]/345*part.w,y:part.y+(art.muzzle[1]-art.targetY)/100*part.h};
}

export function advanceFortressCannon(part,dt){
  if(Number.isFinite(part.shotAge))part.shotAge=Math.min(1.2,part.shotAge+dt);
}

export function drawFortressCannonEffects(g,part){
  const pose=fortressCannonPose(part),{age,flash}=pose;
  if(age<0||age>1.15)return;
  const muzzle=fortressCannonMuzzle(part),seed=(part.shotSerial||1)+(part.k==='gunB'?13:0);
  g.save();
  // A short plume breaks into soft expanding puffs, drifting left and upward.
  for(let i=0;i<5;i++){
    const t=age-.035-i*.045;if(t<0||t>.86)continue;
    const u=t/.86,r=1.8+t*(9+i*.6),x=muzzle.x-2-t*(32-i*2.5),y=muzzle.y-t*(7+i*.8)-t*t*8+Math.sin(seed+i*2)*r*.4;
    const gradient=g.createRadialGradient(x,y,0,x,y,r);
    gradient.addColorStop(0,`rgba(159,163,151,${.42*(1-u)**1.5})`);
    gradient.addColorStop(.5,`rgba(115,126,122,${.28*(1-u)**1.5})`);
    gradient.addColorStop(1,'rgba(96,112,111,0)');
    g.fillStyle=gradient;g.beginPath();g.ellipse(x,y,r,r*.7,-.15,0,Math.PI*2);g.fill();
  }
  if(flash>0){
    const x=muzzle.x+pose.recoil,y=muzzle.y,length=(10+Math.sin(seed+age*160)*2)*Math.sqrt(flash),radius=3.4*flash;
    const glow=g.createRadialGradient(x-3,y,0,x-3,y,10);
    glow.addColorStop(0,`rgba(255,175,54,${flash*.48})`);glow.addColorStop(1,'rgba(255,114,12,0)');
    g.fillStyle=glow;g.beginPath();g.ellipse(x-3,y,10,7,0,0,Math.PI*2);g.fill();
    const flame=g.createLinearGradient(x-length,y,x+1,y);
    flame.addColorStop(0,'rgba(240,88,12,0)');flame.addColorStop(.3,'#f59c24');flame.addColorStop(.75,'#ffe49a');flame.addColorStop(1,'#fffbe2');
    g.globalAlpha=flash;g.fillStyle=flame;g.beginPath();
    [[1,-1.2],[-length*.3,-radius],[-length*.52,-radius*.42],[-length,-radius*.7],[-length*.75,0],[-length,radius*.6],[-length*.5,radius*.45],[-length*.26,radius],[1,1.2]]
      .forEach(([dx,dy],i)=>i?g.lineTo(x+dx,y+dy):g.moveTo(x+dx,y+dy));g.closePath();g.fill();
    g.fillStyle='#fff9cf';g.beginPath();g.ellipse(x-1.5,y,3.3*flash,1.3*flash,0,0,Math.PI*2);g.fill();
  }
  g.restore();
}
