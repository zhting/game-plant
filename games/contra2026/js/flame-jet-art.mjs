export const FLAME_JET_ASSET='/games/contra2026/assets/stage3/flame-jets-v2.webp';
export const FLAME_JET_FRAMES=Object.freeze(Array.from({length:8},(_,i)=>Object.freeze([i%4*256,Math.floor(i/4)*512,256,512])));
const fract=n=>n-Math.floor(n);

/** The damage envelope still comes from flameJetState; artwork adds no hazards. */
export function drawFlameJet(g,image,x,y,fire,time,seed=0){
  if(fire.phase==='off'||!image)return;
  const active=fire.phase==='fire',height=Math.max(.2,fire.height),width=height*.62;
  const tick=time*18+seed*2.37,index=Math.floor(tick)%8,mix=fract(tick);
  g.save();g.globalAlpha*=active?1:fire.phase==='warning'?.8:.35;
  const glow=g.createRadialGradient(x,y-height*.2,0,x,y-height*.2,Math.max(3,height*.68));
  glow.addColorStop(0,'rgba(255,194,70,.23)');glow.addColorStop(.45,'rgba(255,103,18,.12)');glow.addColorStop(1,'rgba(255,83,10,0)');
  g.fillStyle=glow;g.fillRect(x-height,y-height*1.25,height*2,height*1.7);
  const alpha=g.globalAlpha;
  for(const [frame,opacity]of [[index,1-mix],[(index+1)%8,mix]]){
    g.globalAlpha=alpha*opacity;
    // Generated frames leave a small transparent margin below the hot root.
    g.drawImage(image,...FLAME_JET_FRAMES[frame],x-width/2,y-height+1,width,height);
  }
  g.globalAlpha=alpha*.65;g.fillStyle=active?'#ffcb70':'#e9944d';
  g.beginPath();g.ellipse(x,y-.1,Math.max(.25,width*.13),.45,0,0,Math.PI*2);g.fill();
  if(active)for(let i=0;i<4;i++){
    const rise=fract(time*1.8+seed*.19+i*.27);
    g.globalAlpha=alpha*(1-rise)*.7;g.fillStyle=i%2?'#fff0ba':'#ff9d37';
    g.beginPath();g.ellipse(x+Math.sin(time*4+i*1.9+seed)*height*.13,y-height*(.2+rise*.95),.18+(.25*(1-rise)),.45*(1-rise)+.15,.25,0,Math.PI*2);g.fill();
  }
  g.restore();
}
