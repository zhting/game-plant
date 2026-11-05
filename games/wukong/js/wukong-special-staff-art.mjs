import { STAFF_CHARGE } from './wukong-special-staff.mjs';
import { actorRootY } from './wukong-mount.mjs';
import { drawBladeCrescent } from './wukong-blade-art.mjs';

export function drawSpecialStaff(art,p,q){
  if(p.summonKind)return;
  const g=art.g,size=(p.giantT>0?2:1)*(p.magicScale||1),c=p.staffCharge;
  if(c?.active){
    const amount=Math.min(1,c.t/STAFF_CHARGE.full),time=c.t*8,cx=q.origin.x,cy=q.origin.y;
    g.save();g.globalAlpha=.14+amount*.18;
    art.line(q.butt.x,q.butt.y,q.tip.x,q.tip.y,c.full?'#fff4bb':'#f3cf72',(5+amount*2)*size);
    g.globalAlpha=.6;g.strokeStyle=c.full?'#fff8cf':'#f1cf87';g.lineWidth=.7*size;
    for(let i=0;i<3;i++){
      g.beginPath();g.ellipse(cx,cy,(5+amount*5+i*2)*size,(3+amount*3)*size,time+i*.9,.2,Math.PI*1.45);g.stroke();
    }
    for(let i=0;i<9;i++){
      const u=(c.t*(c.full?2.4:1.6)+i/9)%1,angle=i*2.4-time*.3,r=(1-u)*21*size;
      g.globalAlpha=.2+u*.6;art.disc(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r*.65,(.35+u*.3)*size,'#fff0b0');
    }
    const x=p.x-15*size,y=actorRootY(p)-48*size,w=30*size;
    g.globalAlpha=1;art.rect(x-.5,y-.5,w+1,3.8*size,'#604e32');art.rect(x,y,w,2.8*size,'#152e35');
    art.rect(x,y,w*amount,2.8*size,c.full?'#fff0a9':c.ready?'#edc466':'#b99155');
    art.rect(x+w*STAFF_CHARGE.ready/STAFF_CHARGE.full,y,.5*size,2.8*size,'#fff0c9');
    art.hudText(c.full?'满蓄棍气':c.ready?'松开发出棍气':'蓄力',p.x,y-7*size,c.full?'#fff4be':'#e7d5a8',4.6*size,'center');
    g.restore();
  }
  for(const w of p.staffWaves||[]){
    if(w.dead)continue;
    const r=w.radius,fade=Math.max(0,Math.min(1,(w.range-w.travel)/(w.range*.13)));
    g.save();g.translate(w.x,w.y);g.scale(w.face,1);g.rotate(w.angle);g.globalAlpha=.9*fade;
    const glow=g.createRadialGradient(0,0,1,0,0,r*1.7);
    glow.addColorStop(0,w.fire?'rgba(255,190,104,.28)':'rgba(255,236,174,.2)');glow.addColorStop(1,'rgba(255,226,147,0)');
    g.fillStyle=glow;g.fillRect(-r*1.7,-r*1.7,r*3.4,r*3.4);
    drawBladeCrescent(art,{radius:r,strength:w.strength,fire:w.fire});
    for(let i=0;i<3;i++){
      g.globalAlpha=.13*fade;g.lineWidth=.28;g.strokeStyle=w.fire?'#ed9953':'#f6d98f';
      const x=-4-i*5;g.beginPath();g.moveTo(x-r*.65,-r*(.5-i*.12));g.quadraticCurveTo(x+r*.4,0,x-r*.65,r*(.5-i*.12));g.stroke();
    }g.restore();
  }
}
