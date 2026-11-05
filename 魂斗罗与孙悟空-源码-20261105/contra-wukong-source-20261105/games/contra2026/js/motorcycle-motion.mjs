import {MOTORCYCLE_RIDER} from './stage-one-motion.mjs?v=leg-alignment-2';

export const MOTORCYCLE_WHEELS=Object.freeze({rearX:-11.3,axleY:-5.5,frontX:13.3});

export function motorcyclePose(p){
  const pitch=Math.max(0,Math.min(.38,p.motoPitch||0)),c=Math.cos(pitch),s=Math.sin(pitch);
  const {rearX,axleY,frontX}=MOTORCYCLE_WHEELS;
  const dx=MOTORCYCLE_RIDER.seatX-rearX,dy=MOTORCYCLE_RIDER.waist-axleY;
  return {pitch,rearX,axleY,frontLift:(frontX-rearX)*s,
    hipDX:c*dx+s*dy-dx,hipDY:-s*dx+c*dy-dy};
}

export function motorcycleMuzzle(p){
  const pose=motorcyclePose(p),face=p.face||1;
  // Counter-rotating the upper body keeps the gun level while its hip moves
  // with the saddle. Projectiles and muzzle flashes share that same position.
  return {x:p.x+(p.ax??face)*13+face*pose.hipDX,
    y:p.y-MOTORCYCLE_RIDER.muzzleHeight+(p.ay||0)*11+pose.hipDY};
}

export function advanceMotorcycle(p,dt){
  if(p.ride!=='moto'||p.dead){p.motoPitch=0;p.motoDustClock=0;return false;}
  const speed=Math.abs(p.vx||0);
  const target=p.onGround?.16*Math.max(0,Math.min(1,(speed-60)/110)):
    p.vy<0?.30+.08*Math.min(1,-p.vy/300):.26-.22*Math.min(1,Math.max(0,p.vy)/240);
  const current=p.motoPitch||0,rate=target>current?15:10;
  p.motoPitch=current+(target-current)*(1-Math.exp(-rate*dt));
  if(Math.abs(p.motoPitch-target)<.0001)p.motoPitch=target;
  p.motoDustClock=Math.max(0,(p.motoDustClock||0)-dt);
  if(!p.onGround||p.inWater||speed<80){p.motoDustClock=0;return false;}
  if(p.motoDustClock>0)return false;
  p.motoDustClock=.05;return true;
}

export function motorcycleDust(p,tick,{x=p.x,y=p.y,support=p.support,snow=false}={}){
  const face=p.face||1,seed=((tick*73+(p.pid||1)*19)%101)/101;
  return {k:'motoDust',x:x+face*MOTORCYCLE_WHEELS.rearX,y:y-.5,
    vx:-face*(23+seed*15),vy:-11-seed*12,t:0,life:.38+seed*.12,seed,face,
    material:snow?'snow':support?.bridge?'bridge':'soil'};
}

export function drawMotorcycleDust(g,f){
  const t=Math.max(0,Math.min(1,f.t/f.life)),r=.9+t*6.4;
  const color=f.material==='snow'?[197,216,231]:f.material==='bridge'?[159,151,131]:[191,168,115];
  g.save();
  for(let i=0;i<3;i++){
    const x=f.x-f.face*i*r*.45,y=f.y+Math.sin(f.seed*7+i)*r*.22,rad=r*(1-i*.16);
    const gradient=g.createRadialGradient(x,y,0,x,y,rad*1.35);
    gradient.addColorStop(0,`rgba(${color},${.5*(1-t)})`);
    gradient.addColorStop(.55,`rgba(${color},${.27*(1-t)})`);gradient.addColorStop(1,`rgba(${color},0)`);
    g.fillStyle=gradient;g.beginPath();g.ellipse(x,y,rad*1.35,rad*.8,-f.face*.15,0,Math.PI*2);g.fill();
  }
  g.globalAlpha*=1-t;g.fillStyle=f.material==='snow'?'#dae8ed':'#b9a26e';
  for(let i=0;i<2;i++){
    const x=f.x-f.face*(1+t*(8+i*3)),y=f.y-Math.sin(t*Math.PI)*(2+i*2);
    g.fillRect(x,y,.45+i*.2,.4);
  }
  g.restore();
}
