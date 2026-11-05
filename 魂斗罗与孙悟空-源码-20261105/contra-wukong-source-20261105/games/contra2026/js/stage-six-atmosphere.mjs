import { drawFlameJet } from './flame-jet-art.mjs?v=multi-stage-polish-1';

const mod=(n,d)=>((n%d)+d)%d;
// Positions are normalized to the foundry plate, not the moving gameplay camera.
const FURNACES=Object.freeze([
  {x:.125,y:130,h:20,phase:.2},
  {x:.295,y:116,h:19,phase:1.7},
  {x:.735,y:126,h:20,phase:3.1},
  {x:.885,y:135,h:17,phase:4.6}
]);

/** The same background tile, flame and smoke move together as the camera pans. */
export function foundrySources(camera,span,overlap=72){
  const stride=span-overlap,offset=camera*.22,result=[];
  for(let tile=Math.floor(offset/stride)-1;tile<=Math.floor((offset+384)/stride)+1;tile++){
    for(const source of FURNACES){
      const x=tile*stride-offset+source.x*span;
      if(x>=-45&&x<=429)result.push({...source,x,tile});
    }
  }
  return result;
}

export function drawFoundryAtmosphere(g,flames,camera,time,span){
  const sources=foundrySources(camera,span);
  for(const source of sources){
    const {x,y,h,phase}=source;
    // Semi-transparent, slow billows sit behind all gameplay and disperse upward.
    for(let i=0;i<4;i++){
      const p=mod(time*.16+i*.25+phase*.067,1),radius=3+p*8;
      const sx=x+Math.sin(time*.6+phase+i*1.9)*(1.5+p*3)+p*3,sy=y-5-p*38;
      const smoke=g.createRadialGradient(sx,sy,0,sx,sy,radius);
      smoke.addColorStop(0,`rgba(148,122,99,${.27*(1-p)})`);
      smoke.addColorStop(.45,`rgba(85,73,65,${.18*(1-p)})`);
      smoke.addColorStop(1,'rgba(35,34,34,0)');
      g.fillStyle=smoke;g.fillRect(sx-radius,sy-radius,radius*2,radius*2);
    }
    const flicker=.75+.15*Math.sin(time*7+phase)+.1*Math.sin(time*12.7+phase*2);
    const glow=g.createRadialGradient(x,y-2,0,x,y-2,h*2);
    glow.addColorStop(0,`rgba(255,154,55,${.18*flicker})`);glow.addColorStop(.45,`rgba(229,79,24,${.08*flicker})`);glow.addColorStop(1,'rgba(255,90,20,0)');
    g.fillStyle=glow;g.fillRect(x-h*2,y-h*2-2,h*4,h*4);
    if(flames){
      g.save();g.globalAlpha=.7;drawFlameJet(g,flames,x,y,{phase:'fire',height:h*(.84+.16*flicker)},time,phase*5);g.restore();
    }
    // Short irregular sparks escape the furnace intermittently.
    const burst=mod(time+phase*1.9,5.6);
    if(burst<1.15)for(let i=0;i<7;i++){
      const age=burst-i*.11;if(age<0||age>.65)continue;
      const dx=(i%2?1:-1)*(1+i*.55),px=x+dx*age*7,py=y-5-age*(16+i*2)+age*age*5;
      g.save();g.globalAlpha=(1-age/.65)*.78;g.strokeStyle=i%2?'#ffd986':'#f78b3c';g.lineWidth=.35+i%2*.15;
      g.beginPath();g.moveTo(px,py);g.lineTo(px-dx*.18,py+1.2);g.stroke();g.restore();
    }
  }
  // The warning beacon is painted into the original hall; animate its glow in place.
  const offset=camera*.22,stride=span-72,blink=mod(time,1.8);
  for(let tile=Math.floor(offset/stride)-1;tile<=Math.floor((offset+384)/stride)+1;tile++){
    const x=tile*stride-offset+.465*span,y=82;if(x<-10||x>394)continue;
    const intensity=blink<.28?1:blink<.52?.4:.1;
    const beacon=g.createRadialGradient(x,y,0,x,y,6);beacon.addColorStop(0,`rgba(255,104,55,${.8*intensity})`);beacon.addColorStop(.28,`rgba(245,48,21,${.4*intensity})`);beacon.addColorStop(1,'rgba(229,30,12,0)');
    g.fillStyle=beacon;g.fillRect(x-6,y-6,12,12);
  }
}
