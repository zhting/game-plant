// Independently cropped layers keep the night sky visible above the low jungle.
export const CLASSIC_LAYERS=Object.freeze({
  snow:Object.freeze([20,182,2136,492]),
  lowJungle:Object.freeze([0,298,2172,348])
});
export const CLASSIC_FACILITIES=Object.freeze({
  turret:Object.freeze([120,104,420,374]),
  sensor:Object.freeze([856,120,388,352]),
  crate:Object.freeze([126,582,388,342]),
  bridge:Object.freeze([594,680,450,230])
});
export const CLASSIC_TURRET_BASE_BOUNDS=Object.freeze([139,101,404,384]);
const noise=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return((n^(n>>>16))>>>0)/4294967296;};
export function nightStars(camera,time){
  const shift=camera*.035,points=[];
  for(let tile=Math.floor(shift/384);tile<=Math.floor((shift+384)/384);tile++){
    for(let i=0;i<54;i++){
      const seed=tile*719+i*101+829,x=tile*384+noise(seed)*384-shift;
      if(x<0||x>384)continue;
      const twinkle=(Math.sin(time*(1.35+noise(seed+71)*1.8)+noise(seed+53)*Math.PI*2)+1)/2;
      points.push({x,y:27+noise(seed+37)*90,size:i%9===0?.75:.45,
        alpha:.2+noise(seed+19)*.14+twinkle*.62,glint:i%11===0?twinkle**12:0,
        color:i%5===0?'#afc3df':'#e0e5df'});
    }
  }
  return points;
}
export function drawWingBadge(g,x,y){
  g.save();g.translate(x,y);g.lineJoin='miter';g.lineWidth=.9;g.strokeStyle='#160a08';
  for(const side of [-1,1]){
    g.save();g.scale(side,1);g.fillStyle='#bd332a';
    g.beginPath();g.moveTo(2,-2.3);g.lineTo(5,-4.3);g.lineTo(11,-4.3);g.lineTo(8.8,-1.9);
    g.lineTo(7.6,-1.9);g.lineTo(9.4,-1.9);g.lineTo(7.4,.3);g.lineTo(6,.3);g.lineTo(7,.3);
    g.lineTo(5.1,2.7);g.lineTo(2.5,2.7);g.closePath();g.fill();g.stroke();
    g.strokeStyle='#ef9e79';g.lineWidth=.5;g.beginPath();g.moveTo(4,-3.1);g.lineTo(8.7,-3.1);g.moveTo(4,-.9);g.lineTo(7,-.9);g.stroke();g.restore();
  }
  g.restore();
}
export function drawRifleSymbol(g,x,y){
  g.save();g.translate(x,y);g.fillStyle='#292826';g.strokeStyle='#292826';g.lineWidth=1.25;g.lineJoin='round';
  g.beginPath();g.moveTo(-5,-2);g.lineTo(3.5,-2);g.lineTo(3.5,-.5);g.lineTo(1,-.5);g.lineTo(.5,2.1);g.lineTo(-1,1.8);
  g.lineTo(-.7,-.4);g.lineTo(-2,-.4);g.lineTo(-3,2.2);g.lineTo(-4,1.5);g.lineTo(-3.4,-.7);g.lineTo(-5.2,0);g.closePath();g.fill();
  g.beginPath();g.moveTo(3,-1.5);g.lineTo(6,-1.5);g.moveTo(-3,-2);g.lineTo(-2.7,-3);g.lineTo(1,-3);g.stroke();g.restore();
}
export function drawClassicBullet(g,b,hostile=false){
  const rx=hostile?1.55:1.45,ry=hostile?1.25:1;
  g.save();g.translate(b.x,b.y);g.fillStyle='#6e201b';g.beginPath();g.ellipse(0,0,rx+.25,ry+.22,0,0,Math.PI*2);g.fill();
  g.fillStyle='#d5513c';g.beginPath();g.ellipse(0,0,rx,ry,0,0,Math.PI*2);g.fill();
  g.fillStyle='#f7b28a';g.beginPath();g.ellipse(-.35,-.32,rx*.46,ry*.38,0,0,Math.PI*2);g.fill();g.restore();
}
export function drawTurretBarrel(g,x,y,angle){
  g.save();g.translate(x,y);g.rotate(angle);g.strokeStyle='#171919';g.lineWidth=.6;
  const tube=g.createLinearGradient(0,-2,0,2);tube.addColorStop(0,'#dcdad1');tube.addColorStop(.28,'#a0a19b');tube.addColorStop(.55,'#494e4e');tube.addColorStop(1,'#1b2023');
  g.fillStyle=tube;g.fillRect(0,-1.8,10,3.6);g.strokeRect(0,-1.8,10,3.6);
  g.fillStyle='#d6d4ca';g.fillRect(7,-2.2,2.3,4.4);g.strokeRect(7,-2.2,2.3,4.4);
  g.fillStyle='#101615';g.fillRect(9.3,-1.6,1.2,3.2);g.restore();
}
