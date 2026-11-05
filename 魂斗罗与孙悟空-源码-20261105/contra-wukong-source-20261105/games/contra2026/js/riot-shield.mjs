/** Rear view of a ballistic shield held ahead of the left forearm. Draw before the actor. */
export function drawRiotShield(g,p,time=0,hit=0){
  if(!(p.riot>0)||p.dead||p.deathHidden||p.enteringExit||p.exitEntered||p.spin)return;
  const size=p.giantT>0?2:1;
  g.save();g.translate(p.x,p.y);g.scale(size,size);
  if(p.prone){g.translate(-5,-9);g.rotate(-Math.PI/2);}
  else {g.translate(-14,-18);g.rotate(Math.sin((p.anim||0)*.6)*Math.min(.025,Math.abs(p.vx||0)/3600));}
  const outline=()=>{g.beginPath();[[-8,-12],[3,-14],[8,-10],[8,10],[3,14],[-8,12]].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();};
  outline();g.fillStyle='rgba(26,49,59,.48)';g.fill();
  g.strokeStyle='#0b1820';g.lineWidth=2.2;g.stroke();
  g.strokeStyle='#7b9398';g.lineWidth=.95;g.stroke();
  g.save();outline();g.clip();
  const glass=g.createLinearGradient(-8,-13,7,12);
  glass.addColorStop(0,'rgba(187,219,220,.25)');glass.addColorStop(.45,'rgba(99,146,158,.08)');glass.addColorStop(1,'rgba(18,42,53,.24)');
  g.fillStyle=glass;g.fillRect(-8,-14,16,28);
  g.fillStyle='#273c45';g.fillRect(-8,4,16,8);
  g.strokeStyle='rgba(208,230,221,.48)';g.lineWidth=.45;g.beginPath();g.moveTo(-5,-10);g.lineTo(-1,-11);g.lineTo(-5,-1);g.stroke();
  g.strokeStyle='#526970';g.lineWidth=.6;g.beginPath();g.moveTo(-7,4);g.lineTo(7,4);g.stroke();
  // Remaining protection is readable on the outer rail without a large badge.
  for(let i=0;i<3;i++){g.fillStyle=i<p.riot?(p.riot===1?'#d6aa67':'#9ab99c'):'#35464b';g.fillRect(-6.8,6+i*1.6,1.7,.7);}
  if(hit>0){g.globalAlpha*=Math.min(1,hit);g.strokeStyle='#e6e4cd';g.lineWidth=1.6;outline();g.stroke();}
  g.restore();
  for(const y of [-10,10]){g.fillStyle='#c2ceca';g.beginPath();g.arc(-7,y,.45,0,Math.PI*2);g.fill();}
  g.restore();
}
