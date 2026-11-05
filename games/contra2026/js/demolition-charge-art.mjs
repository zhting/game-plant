export const DEMOLITION_CHARGE_ASSET='/games/contra2026/assets/shared/demolition-charge-v2.webp';
export const DEMOLITION_CHARGE_ART=Object.freeze({
  size:Object.freeze([512,256]),width:16,baseline:240,fuseTip:Object.freeze([498,16])
});

/** Ground anchor and fuse timer come from the shared simulation; painting never changes them. */
export function drawDemolitionCharge(g,image,charge,tick=0){
  if(!image||charge.dead||charge.fuse<=0)return false;
  const art=DEMOLITION_CHARGE_ART,scale=art.width/art.size[0];
  const left=charge.x-art.width/2,top=charge.y-art.baseline*scale;
  const x=left+art.fuseTip[0]*scale,y=top+art.fuseTip[1]*scale;
  const urgent=charge.fuse<.6,pulse=.5+.5*Math.sin(tick*(urgent?1.6:.52));
  g.save();
  if(charge.rest){
    g.fillStyle='rgba(3,10,8,.32)';g.beginPath();g.ellipse(charge.x,charge.y+.1,6.5,.65,0,0,Math.PI*2);g.fill();
  }
  g.drawImage(image,left,top,art.width,art.size[1]*scale);
  const glow=g.createRadialGradient(x,y,0,x,y,1.5+pulse*.7);
  glow.addColorStop(0,`rgba(255,211,118,${.65+pulse*.25})`);
  glow.addColorStop(.35,'rgba(255,133,36,.4)');glow.addColorStop(1,'rgba(255,96,20,0)');
  g.fillStyle=glow;g.beginPath();g.arc(x,y,2.3,0,Math.PI*2);g.fill();
  g.fillStyle=pulse>.55?'#fff2c6':'#f68e38';g.beginPath();g.arc(x,y,.3+pulse*.17,0,Math.PI*2);g.fill();
  const frame=Math.floor(tick/(urgent?2:5));
  for(let n=0;n<3;n++){
    const angle=-Math.PI*.9+((frame*7+n*11)%23)/23*Math.PI*1.1;
    const length=.65+((frame+n*5)%7)*.13;
    g.strokeStyle=n%2?'#ffbe60':'#e48635';g.lineWidth=.16;g.lineCap='round';
    g.beginPath();g.moveTo(x+Math.cos(angle)*.5,y+Math.sin(angle)*.5);
    g.lineTo(x+Math.cos(angle)*length,y+Math.sin(angle)*length);g.stroke();
  }
  g.restore();return true;
}
