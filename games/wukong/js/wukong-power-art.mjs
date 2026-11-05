import { staffCopies, staffPower, thrownStaffGeometry } from './wukong-combat.mjs';
export const RUYI_STAFF_ASSET='/games/wukong/assets/ruyi-staff.webp';

function texturedStaff(art,q,size){
  const image=art.images?.ruyiStaff;if(!image?.naturalWidth)return false;
  const g=art.g,dx=q.tip.x-q.butt.x,dy=q.tip.y-q.butt.y,length=Math.hypot(dx,dy);
  g.save();g.translate(q.butt.x,q.butt.y);g.rotate(Math.atan2(dy,dx));
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  // One full continuous bitmap, sampled at its transparent silhouette bounds.
  g.drawImage(image,34*image.naturalWidth/2172,312*image.naturalHeight/724,2104*image.naturalWidth/2172,86*image.naturalHeight/724,0,-1.55*size,length,3.1*size);
  g.restore();return true;
}

function rod(art,q,size=1,fire=false){
  art.line(q.butt.x,q.butt.y,q.tip.x,q.tip.y,fire?'#9e3f27':'#79452a',2.1*size);
  art.line(q.butt.x,q.butt.y,q.tip.x,q.tip.y,fire?'#ffb34f':'#c08744',1.1*size);
  const dx=q.tip.x-q.butt.x,dy=q.tip.y-q.butt.y,length=Math.hypot(dx,dy)||1;
  art.line(q.tip.x-dx/length*6*size,q.tip.y-dy/length*6*size,q.tip.x,q.tip.y,'#ffe091',2.3*size);
  art.line(q.butt.x,q.butt.y,q.butt.x+dx/length*5*size,q.butt.y+dy/length*5*size,'#e1b75a',2.3*size);
}
export function drawPowerStaff(art,p,line,size,{staff=true,throws=true,paintedBase=null}={}){
  const power=staffPower(p),g=art.g;
  for(const q of staff?staffCopies(p,line):[]){
    g.save();if(q.angle!==line.angle)g.globalAlpha*=.7;
    if(power.fire&&p.staff){g.save();g.globalAlpha*=.25;art.line(q.butt.x,q.butt.y,q.tip.x,q.tip.y,'#ff7b32',5*size);g.restore();}
    if(q.replacedStaff){if(!texturedStaff(art,q,size))rod(art,q,size,power.fire);}
    else if(!paintedBase||q.angle!==line.angle)rod(art,q,size,power.fire);
    else if(power.weapon==='laser'){
      // Length power replaces the entire visible shaft in one pass. Never
      // append a second stock-colored tip to a frame's already painted staff.
      g.shadowColor='#d1a15c';g.shadowBlur=art.scale*size;
      art.line(q.butt.x,q.butt.y,q.tip.x,q.tip.y,'#8c552d',4.2*size);
      art.line(q.butt.x,q.butt.y,q.tip.x,q.tip.y,'#c28a47',2.1*size);
      const dx=q.tip.x-q.butt.x,dy=q.tip.y-q.butt.y,length=Math.hypot(dx,dy)||1;
      art.line(q.tip.x-dx/length*5*size,q.tip.y-dy/length*5*size,q.tip.x,q.tip.y,'#dfb765',3.7*size);
      art.line(q.butt.x,q.butt.y,q.butt.x+dx/length*5*size,q.butt.y+dy/length*5*size,'#d2a75b',3.7*size);
    }
    g.restore();
  }
  if(staff&&power.fire&&p.staff){
    const t=art.state.time||art.state.t/60;g.save();g.globalAlpha=.7;
    for(let i=0;i<5;i++){
      const u=(i+.5)/5,x=line.origin.x+(line.tip.x-line.origin.x)*u,y=line.origin.y+(line.tip.y-line.origin.y)*u;
      art.line(x,y,x-Math.cos(t*13+i)*2,y-3-Math.sin(t*11+i)*2,'#ffce63',1.2);
    }g.restore();
  }
  for(const b of throws?p.staffThrows||[]:[]){
    if(b.dead)continue;const q=thrownStaffGeometry(b);
    g.save();g.globalAlpha=.16;art.disc(b.x,b.y,19*b.size,'#eec479');g.restore();
    rod(art,{butt:q.origin,tip:q.tip},b.size);
  }
}
