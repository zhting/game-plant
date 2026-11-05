/** Pointed red-and-ivory flying disc; its 24×10 silhouette matches the carrier hitbox. */
export function drawSupplySaucer(g,x,y,time=0){
  const plate=(points,fill)=>{
    g.beginPath();points.forEach(([px,py],i)=>i?g.lineTo(px,py):g.moveTo(px,py));g.closePath();g.fillStyle=fill;g.fill();
  };
  g.save();g.translate(x,y);
  // A raised central cap flows into a thin rim ending in two sharp tips.
  plate([[-12,0],[-8,-2.6],[-4.4,-3.5],[-2.7,-5],[2.7,-5],[4.4,-3.5],[8,-2.6],[12,0],[8,2.6],[4,4.3],[-4,4.3],[-8,2.6]],'#111b1c');
  plate([[-10.9,0],[-7.6,-2.1],[-4,-2.9],[-2.4,-4.3],[2.4,-4.3],[4,-2.9],[7.6,-2.1],[10.9,0],[7.5,1.9],[3.6,3.5],[-3.6,3.5],[-7.5,1.9]],'#a1aaa1');
  plate([[-6.6,-1.2],[-3.6,-2.9],[-2,-3.6],[2,-3.6],[3.6,-2.9],[6.6,-1.2]],'#c34538');
  plate([[-3.4,-2.7],[-1.9,-4],[1.9,-4],[3.4,-2.7]],'#eee6cf');
  plate([[-10.6,0],[-6.8,-1.4],[6.8,-1.4],[10.6,0],[6.7,1.6],[-6.7,1.6]],'#efead7');
  plate([[-8.5,0],[-4.6,-1],[4.6,-1],[8.5,0],[4.7,1.4],[-4.7,1.4]],'#b83730');
  plate([[-7.5,1.8],[-3.3,2.2],[3.3,2.2],[7.5,1.8],[3.4,3.4],[-3.4,3.4]],'#4d5c5b');
  plate([[-5.6,-.65],[5.6,-.65],[7.5,0],[5.5,.25],[-5.5,.25],[-7.5,0]],'#ed7860');
  plate([[-2.7,-.7],[2.7,-.7],[4,0],[2.7,.8],[-2.7,.8],[-4,0]],Math.floor(time*7)%2?'#fff3d6':'#eddfc3');
  g.fillStyle='#b9bcb0';g.fillRect(-2.6,2.4,5.2,.45);
  g.restore();
}
