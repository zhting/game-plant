// A tapered light blade shared by travelling qi and contact slash arcs.
export function drawBladeCrescent(art,{radius,depth=.98,inset=.09,strength=1,fire=false,glint=true}={}){
  const g=art.g,r=radius,alpha=g.globalAlpha,weight=strength===2?1.15:1;
  const edge=fire?'#fff3d8':'#fffff3',gold=fire?'#ffbd72':'#ffe5a4',halo=fire?'#ffad58':'#f2ca79';
  const curve=()=>{g.beginPath();g.moveTo(0,-r);g.bezierCurveTo(depth*r,-r*.74,depth*r,r*.74,0,r);};
  const taper=g.createLinearGradient(0,-r,0,r);
  taper.addColorStop(0,'rgba(255,238,190,0)');taper.addColorStop(.13,gold);taper.addColorStop(.42,edge);
  taper.addColorStop(.58,edge);taper.addColorStop(.87,gold);taper.addColorStop(1,'rgba(255,238,190,0)');
  g.save();g.lineCap='round';g.lineJoin='round';
  // A fine bevel keeps the edge visible over the bright cloud panorama.
  curve();g.globalAlpha=alpha*.38;g.strokeStyle=fire?'#a85f30':'#b9934f';g.lineWidth=.72*weight;g.stroke();
  g.globalCompositeOperation='lighter';g.shadowColor=halo;g.shadowBlur=3.5*(art.scale||1);
  curve();g.globalAlpha=alpha*.19;g.strokeStyle=halo;g.lineWidth=2.2*weight;g.stroke();
  g.shadowBlur=0;g.globalAlpha=alpha;
  curve();g.bezierCurveTo((depth-inset)*r,r*.74,(depth-inset)*r,-r*.74,0,-r);g.closePath();g.fillStyle=taper;g.fill();
  curve();g.strokeStyle=taper;g.lineWidth=.42*weight;g.stroke();
  if(glint){
    const x=depth*.75*r;
    g.globalAlpha=alpha*.85;g.strokeStyle=edge;g.lineWidth=.32;
    g.beginPath();g.moveTo(x-1.7,0);g.lineTo(x+1.7,0);g.moveTo(x,-2.1);g.lineTo(x,2.1);g.stroke();
  }
  g.restore();
}
