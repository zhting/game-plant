import { GIANT_HOME, giantPose, giantTiming, giantShockwaves } from './wukong-boss.mjs';
import { drawWholeGiant } from './wukong-giant-sprites.mjs';
import { drawFallenGiant, giantDefeatVisual } from './wukong-encounter-art.mjs';
import { drawColossus } from './wukong-giant-phase-art.mjs?v=impact-3';

// Each frame is a complete painted character, including both arms and the axe.
export function drawGiant(art,boss){
  if(!boss.dead&&boss.encounter?.stage===2)return drawColossus(art,boss);
  const g=art.g;
  const defeat=boss.dead?giantDefeatVisual(boss):null;
  if(defeat)drawFallenGiant(art,boss,defeat);
  if(defeat?.blend>=1)return;
  const giant=defeat?.pose||boss.giant||{...GIANT_HOME,clock:art.state.time??art.state.t/60},q=giantPose(giant),time=giant.clock||0;
  g.save();
  if(defeat){
    g.globalAlpha*=1-defeat.blend;
    g.translate(giant.x,giant.y-38);g.rotate(-q.face*defeat.fall*.65);
    g.translate(-giant.x,-giant.y+38+(176-giant.y)*defeat.fall+defeat.fall*6);
  }
  g.save();g.fillStyle='rgba(56,69,72,.18)';g.beginPath();g.ellipse(giant.x,176,Math.max(14,42-(176-giant.y)*.23),3,0,0,Math.PI*2);g.fill();g.restore();
  const a=giant.attack,active=a&&a.t>=a.windup&&a.t<a.windup+giantTiming(a).strike;
  if(active&&a.kind!=='stomp'&&!boss.dead)for(let i=3;i>0;i--){
    const prev=giantPose(giant,Math.max(a.windup,a.t-i*.025));g.save();g.globalAlpha*=.07;
    art.line(prev.origin.x,prev.origin.y,prev.tip.x,prev.tip.y,'#e5ce8e',8);g.restore();
  }
  g.save();if(boss.parts[2].flash>0)g.filter='brightness(1.35)';drawWholeGiant(art,giant);g.restore();
  if(a&&!active&&a.t<a.windup){
    g.save();g.globalAlpha*=.35+.2*Math.sin(a.t*22);art.disc(q.tip.x,q.tip.y,2.1,'#fff1ba');
    if(a.kind==='stomp'||a.kind==='leap'){g.strokeStyle='#e3c683';g.lineWidth=1;g.beginPath();g.ellipse(a.kind==='leap'?a.landingX:giant.x+q.face*56,174,a.kind==='leap'?34:53,4,0,0,Math.PI*2);g.stroke();}
    g.restore();
  }
  for(const wave of boss.dead?[]:giantShockwaves(giant)){
    g.save();g.globalAlpha*=Math.sin(Math.PI*(.1+wave.phase*.8));g.strokeStyle='#ffe4a0';g.lineWidth=2;
    g.beginPath();g.ellipse(wave.x,wave.y+2,11,4,0,0,Math.PI*2);g.stroke();
    for(let i=0;i<4;i++)art.line(wave.x-7+i*4,wave.y,wave.x-9+i*4,wave.y-4-Math.sin(time*12+i)*3,'#d8b575',1.2);
    g.restore();
  }
  if(boss.parts[2].flash>0){g.save();g.globalAlpha*=.2;art.disc(giant.x,giant.y-55+q.lift,19,'#fff2bf');g.restore();}
  g.restore();
}
