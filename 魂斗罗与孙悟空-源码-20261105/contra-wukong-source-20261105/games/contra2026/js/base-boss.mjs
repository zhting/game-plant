export const BASE_BOSS_DEVICES=Object.freeze([91,119].flatMap((y,row)=>[116,177,238].map((x,col)=>Object.freeze({k:'device',id:row*3+col,x,y,w:30,h:18,hp:8,max:8,flash:0,fireT:1.4+(row*3+col)*.5}))));
export const BASE_BOSS_MOVER=Object.freeze({k:'bcore',mover:true,x:177,y:62,w:30,h:18,hp:36,max:36,flash:0,fireT:.7});
/** A separate, visible shutter cycle for each of the six stage-two turrets. */
export function advanceStageTwoBossDevice(t,dt,random=Math.random){
  if(t.hp<=0)return false;
  t.shotFlash=Math.max(0,(t.shotFlash||0)-dt);
  t.shutterPhase ||= 'closed';t.aperture ??=0;t.fireT-=dt;
  if(t.shutterPhase==='opening')t.aperture=Math.min(1,t.aperture+dt/.24);
  if(t.shutterPhase==='closing')t.aperture=Math.max(0,t.aperture-dt/.24);
  if(t.fireT>0)return false;
  if(t.shutterPhase==='closed'){t.shutterPhase='opening';t.fireT=.24;}
  else if(t.shutterPhase==='opening'){t.aperture=1;t.shutterPhase='aim';t.fireT=.35;}
  else if(t.shutterPhase==='aim'){t.shutterPhase='hold';t.fireT=.32;t.shotFlash=.09;return true;}
  else if(t.shutterPhase==='hold'){t.shutterPhase='closing';t.fireT=.24;}
  else{t.aperture=0;t.shutterPhase='closed';t.fireT=2.4+random()*2.5;}
  return false;
}
export function bossDevicesRemaining(base){return base.targets.filter(t=>t.k==='device'&&t.hp>0).length;}
export function deviceAimHint(base){
  if(base.dead||base.bossPhase!=='devices')return null;
  const live=base.targets.filter(t=>t.k==='device'&&t.hp>0);
  if(!live.length)return null;
  return live.some(t=>t.y<110)?'按上举枪 · 射击上排装置':'松开上键 · 射击下排装置';
}
export function movingBossX(time){return 177+Math.sin(time*.92)*66;}
export function advanceBossLift(player,dt){
  if(!player.liftSide||player.liftDone)return;
  player.liftT=(player.liftT||0)+dt;
  const phase=Math.max(0,Math.min(1,(player.liftT-.25)/2.2)),ease=phase*phase*(3-2*phase);
  player.x=player.liftSide<0?28:356;player.y=204-ease*232;
  player.vx=player.vy=0;player.prone=player.spin=player.aimUp=false;player.onGround=true;
  player.aimDx=0;player.flashT=0;player.wantFire=false;
  if(phase>=1)player.liftDone=true;
}

/** Armored iris, independently animated inside the familiar blue energy ring. */
export function drawBossEye(g,x,y,rx,ry,time=0,flash=0){
  g.save();g.translate(x,y);
  const halo=g.createRadialGradient(0,0,rx*.2,0,0,rx*1.35);
  halo.addColorStop(0,'rgba(45,109,241,.25)');halo.addColorStop(.65,'rgba(85,119,255,.36)');halo.addColorStop(1,'rgba(66,93,235,0)');
  g.fillStyle=halo;g.beginPath();g.ellipse(0,0,rx*1.3,ry*1.3,0,0,Math.PI*2);g.fill();
  const metal=g.createLinearGradient(0,-ry,0,ry);metal.addColorStop(0,'#d5ddf7');metal.addColorStop(.25,'#6679b0');metal.addColorStop(.5,'#18274a');metal.addColorStop(.8,'#6274a5');metal.addColorStop(1,'#dce7ff');
  g.fillStyle=metal;g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();
  // Separate dark radial armor plates, beveled edges and tiny fasteners keep
  // the emitter legible against the detailed machinery behind it.
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5+.04,b=a+.49;
    g.strokeStyle='#182540';g.lineWidth=2.2;g.beginPath();g.ellipse(0,0,rx*.91,ry*.88,0,a,b);g.stroke();
    g.strokeStyle=i%2?'#a6bde2':'#8299c4';g.lineWidth=.55;g.beginPath();g.ellipse(0,-.15,rx*.94,ry*.9,0,a+.05,b-.08);g.stroke();
  }
  g.fillStyle='#101b36';g.beginPath();g.ellipse(0,0,rx*.79,ry*.71,0,0,Math.PI*2);g.fill();
  g.strokeStyle='#94b6ff';g.lineWidth=.7;g.beginPath();g.ellipse(0,0,rx*.79,ry*.71,0,0,Math.PI*2);g.stroke();
  for(let i=0;i<10;i++){const a=i*Math.PI/5;g.fillStyle=i%2?'#d8e9ff':'#5c81ba';g.beginPath();g.ellipse(Math.cos(a)*rx*.91,Math.sin(a)*ry*.87,.55,.45,0,0,Math.PI*2);g.fill();}
  const lens=g.createRadialGradient(-rx*.12,-ry*.12,.3,0,0,rx*.55);
  lens.addColorStop(0,flash?'#ffffff':'#c8efff');lens.addColorStop(.16,'#65cfff');lens.addColorStop(.38,'#237fd8');lens.addColorStop(.7,'#103a85');lens.addColorStop(1,'#07112d');
  g.fillStyle=lens;g.beginPath();g.ellipse(0,0,rx*.57,ry*.53,0,0,Math.PI*2);g.fill();
  g.strokeStyle='rgba(133,215,255,.45)';g.lineWidth=.35;g.beginPath();g.ellipse(0,0,rx*.42,ry*.4,0,0,Math.PI*2);g.stroke();
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8+time*.12;g.strokeStyle=i%2?'rgba(99,188,255,.62)':'rgba(18,48,105,.8)';g.lineWidth=.45;
    g.beginPath();g.moveTo(Math.cos(a)*rx*.2,Math.sin(a)*ry*.18);g.lineTo(Math.cos(a)*rx*.48,Math.sin(a)*ry*.44);g.stroke();
  }
  g.fillStyle='#071428';g.beginPath();g.ellipse(Math.sin(time*1.5)*rx*.06,0,rx*.115,ry*.15,0,0,Math.PI*2);g.fill();
  g.fillStyle='#effcff';g.beginPath();g.ellipse(-rx*.18,-ry*.22,rx*.075,ry*.07,0,0,Math.PI*2);g.fill();g.restore();
}
export function drawBossBubble(g,x,y,rx,ry,time=0,emitter=false){
  g.save();g.translate(x,y);
  const glow=g.createRadialGradient(0,0,rx*.35,0,0,rx*1.45);
  glow.addColorStop(0,'rgba(40,80,210,0)');glow.addColorStop(.55,'rgba(82,116,255,.12)');glow.addColorStop(.8,'rgba(130,154,255,.35)');glow.addColorStop(1,'rgba(56,86,230,0)');
  g.fillStyle=glow;g.beginPath();g.ellipse(0,0,rx*1.4,ry*1.4,0,0,Math.PI*2);g.fill();
  if(emitter){g.fillStyle='#050b20';g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();}
  g.lineWidth=emitter?1.7:1.05;g.strokeStyle='#4549b0';g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.stroke();
  g.lineWidth=emitter?.7:.55;g.strokeStyle='#c0c7ff';g.beginPath();g.ellipse(0,0,rx*.91,ry*.89,0,0,Math.PI*2);g.stroke();
  for(let i=0;i<9;i++){
    const angle=i*Math.PI*2/9+time*(emitter?.8:1.2),r=.94+Math.sin(time*12+i*2)*.08;
    g.strokeStyle=i%2?'#829dff':'#f0edff';g.lineWidth=emitter?1.1:.65;
    g.beginPath();g.moveTo(Math.cos(angle-.13)*rx*r,Math.sin(angle-.13)*ry*r);
    g.lineTo(Math.cos(angle)*rx*.82,Math.sin(angle)*ry*.82);g.lineTo(Math.cos(angle+.15)*rx*r,Math.sin(angle+.15)*ry*r);g.stroke();
  }
  g.strokeStyle='rgba(230,242,255,.92)';g.lineWidth=emitter?1:.6;g.beginPath();g.ellipse(-rx*.2,-ry*.23,rx*.45,ry*.48,-.2,3.3,4.8);g.stroke();
  if(emitter){g.fillStyle='#485fc0';for(const side of [-1,1])g.fillRect(side*rx*.35-1,-1,2,2);}
  g.restore();
}
