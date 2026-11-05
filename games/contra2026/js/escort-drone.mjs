export const ESCORT_DRONE_ASSET='/games/contra2026/assets/stage7/escort-drone-v1.webp';
// Native alpha sprite; crop only transparent padding at draw time.
export const ESCORT_DRONE_ART=Object.freeze({bounds:[216,98,1674,580],anchor:[1088,462],width:32,rotors:[[-13.2,-5.8],[12.1,-5.8]],barrel:9.8,mountY:3.3});
const droneAngle=p=>Number.isFinite(p.droneAim)?p.droneAim:(p.face||1)>0?0:Math.PI;

export function escortDroneMuzzle(p){
  const angle=droneAngle(p);
  return {x:p.dx2+Math.cos(angle)*ESCORT_DRONE_ART.barrel,y:p.dy2+ESCORT_DRONE_ART.mountY+Math.sin(angle)*ESCORT_DRONE_ART.barrel};
}

export function aimEscortDrone(p,target){
  p.droneAim=Math.atan2(target.y-p.dy2-ESCORT_DRONE_ART.mountY,target.x-p.dx2);
  p.droneFace=Math.cos(p.droneAim)<0?-1:1;
  const muzzle=escortDroneMuzzle(p);
  return {...muzzle,vx:Math.cos(p.droneAim)*300,vy:Math.sin(p.droneAim)*300};
}

export function drawEscortDrone(art,p){
  if(!(p.droneT>0)||p.dead||!Number.isFinite(p.dx2)||!Number.isFinite(p.dy2))return;
  const g=art.g,time=art.state?.time||0,tick=art.state?.t||0;
  if(p.droneT<2&&(tick>>3)%2)return;
  const x=p.dx2,y=p.dy2,angle=droneAngle(p),face=p.droneFace||p.face||1;
  // A gimballed metal cannon stays aligned with the actual projectile origin.
  g.save();g.translate(x,y+ESCORT_DRONE_ART.mountY);g.rotate(angle);
  const gun=g.createLinearGradient(0,-.85,0,.85);gun.addColorStop(0,'#c3b494');gun.addColorStop(.2,'#777e72');gun.addColorStop(.48,'#273332');gun.addColorStop(.75,'#5e6c61');gun.addColorStop(1,'#132126');
  art.disc(0,0,1.25,'#19292a');art.disc(-.2,-.2,.85,'#8c866b');art.rect(.8,-.7,8,1.4,gun);art.line(1,-.65,8.3,-.65,'#bdbaa1',.22);art.line(1,.65,8.4,.65,'#0b181b',.3);
  for(const sx of [2.5,4.5,6.5]){art.rect(sx,-.95,.45,1.9,'#293935');art.line(sx,-.85,sx+.4,-.85,'#b9ab8d',.22);}
  art.rect(8.6,-1,1.5,2,'#30423d');art.line(8.7,-.9,9.8,-.9,'#d0ba8d',.28);art.disc(9.8,0,.45,'#071416');g.restore();
  const bank=Math.max(-.07,Math.min(.07,(p.x-x-(p.face||1)*12)*.002));
  g.save();g.translate(x,y);g.rotate(bank);g.scale(face,1);
  for(const [i,[rx,ry]]of ESCORT_DRONE_ART.rotors.entries()){
    g.save();g.translate(rx,ry);g.fillStyle='rgba(169,186,170,.16)';g.beginPath();g.ellipse(0,0,5.9,.8,0,0,Math.PI*2);g.fill();
    for(let blade=0;blade<2;blade++){
      const a=time*83+i*1.8+blade*Math.PI/2,dx=Math.cos(a)*5.7,dy=Math.sin(a)*.65;
      art.line(-dx,-dy,dx,dy,blade?'rgba(209,204,176,.6)':'#acb5a1',.45);art.line(-dx,-dy+.3,dx,dy+.3,'rgba(27,39,39,.6)',.35);
    }
    g.restore();
  }
  const image=art.images.escortDrone;
  if(image?.naturalWidth>0){
    const {bounds:[sx,sy,sw,sh],anchor:[ax,ay],width}=ESCORT_DRONE_ART,scale=width/sw;
    g.drawImage(image,sx,sy,sw,sh,(sx-ax)*scale,(sy-ay)*scale,sw*scale,sh*scale);
  }
  art.light(8.2,.1,2.3,'rgba(123,239,164,.16)');art.disc(8.2,.1,.38,'#b7ffca');g.restore();
  if(p.droneShotT>0){
    const m=escortDroneMuzzle(p);art.light(m.x,m.y,3.5,'rgba(255,188,80,.35)');
    g.save();g.translate(m.x,m.y);g.rotate(angle);g.fillStyle='#f2b94e';g.beginPath();g.moveTo(0,-.8);g.lineTo(2,-.35);g.lineTo(4.8,0);g.lineTo(1.5,.35);g.lineTo(0,.8);g.closePath();g.fill();
    g.fillStyle='#fff4c1';g.beginPath();g.moveTo(0,-.35);g.lineTo(3.8,0);g.lineTo(0,.35);g.closePath();g.fill();g.restore();
  }
}
