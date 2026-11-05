const TAU=Math.PI*2;

/** A protective surface follows the pose; never expose a collision-box outline. */
export function shieldShape(p){
  const size=p.giantT>0?2:1;
  const pose=p.prone?{x:1,y:-6,rx:21,ry:10}:p.spin?{x:0,y:-14,rx:15,ry:16}:{x:0,y:-15,rx:13.5,ry:18};
  return{x:p.x+pose.x*size,y:p.y+pose.y*size,rx:pose.rx*size,ry:pose.ry*size,size};
}

export function drawShieldField(g,p,time=0,behind=false,hit=0){
  if(p.dead||p.exitEntered||p.enteringExit||!(p.shieldT>0))return;
  const s=shieldShape(p),pulse=.86+.14*Math.sin(time*3.4);
  const fade=p.shieldT<2?.45+.55*(.5+.5*Math.sin(time*9)):1;
  g.save();g.translate(s.x,s.y);g.lineCap='round';g.globalAlpha*=fade;
  if(behind){
    g.save();g.scale(s.rx,s.ry);
    const light=g.createRadialGradient(-.3,-.25,.15,0,0,1.12);
    light.addColorStop(0,'rgba(63,200,237,0)');light.addColorStop(.7,'rgba(50,172,210,.025)');
    light.addColorStop(.93,`rgba(71,211,240,${.14*pulse})`);light.addColorStop(1,'rgba(71,211,240,0)');
    g.fillStyle=light;g.beginPath();g.arc(0,0,1.12,0,TAU);g.fill();g.restore();
  }else{
    g.strokeStyle=`rgba(99,222,244,${.22*pulse})`;g.lineWidth=.38*s.size;
    g.beginPath();g.ellipse(0,0,s.rx,s.ry,0,0,TAU);g.stroke();
    // Broken highlights circulate around the curved rim, leaving the figure unobscured.
    const phase=time*.85;
    for(let i=0;i<3;i++){
      const angle=phase+i*TAU/3;
      g.strokeStyle=i===0?'rgba(208,252,255,.8)':'rgba(92,220,244,.54)';g.lineWidth=(i===0?.7:.48)*s.size;
      g.beginPath();g.ellipse(0,0,s.rx,s.ry,0,angle,angle+.65);g.stroke();
      g.fillStyle='#c7f9ff';g.beginPath();g.arc(Math.cos(angle)*s.rx,Math.sin(angle)*s.ry,.45*s.size,0,TAU);g.fill();
    }
    // Sparse refraction glints stay at the outside edge rather than covering the gun.
    g.strokeStyle='rgba(92,214,237,.2)';g.lineWidth=.25*s.size;
    for(const side of [-1,1])for(let i=0;i<3;i++){
      const y=(i-1)*5*s.size,x=side*s.rx*Math.sqrt(1-(y/s.ry)**2)*.86;
      g.beginPath();g.moveTo(x-side*1.3*s.size,y-1.2*s.size);g.lineTo(x,y);g.lineTo(x-side*1.3*s.size,y+1.2*s.size);g.stroke();
    }
    if(hit>0){
      g.strokeStyle=`rgba(220,255,255,${Math.min(1,hit)*.85})`;g.lineWidth=1.2*s.size;
      g.beginPath();g.ellipse(0,0,s.rx+(1-hit)*2,s.ry+(1-hit)*2,0,-1.1,1.1);g.stroke();
    }
  }
  g.restore();
}
