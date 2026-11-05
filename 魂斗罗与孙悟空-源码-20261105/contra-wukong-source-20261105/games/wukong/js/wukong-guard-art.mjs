import { guardGeometry, GUARD_MELEE } from './wukong-guards.mjs';
import { runGait, RUN_BONES } from '../../contra2026/js/stage-one-motion.mjs?v=leg-alignment-2';
import { connectedLeg, bodyPoint, paintLegs, torsoWithPelvisPath } from './wukong-locomotion.mjs';

const GUARD_SCALE=28/356,GUARD_BONES=Object.freeze({upper:6.5,lower:6.4});
export function guardWalkingPose(p){
  const q=guardGeometry(p),moving=p.onGround&&Math.abs(p.vx||0)>.5&&!p.melee;
  const gait=moving?runGait(p.anim||0,p.vx,1,true):null;
  const body={sway:q.push*.32,bob:gait?gait.bob*.6:0,lean:q.lean+(gait?.lean||0),stretch:1,width:1};
  const legs=gait?.legs.map((leg,i)=>{
    const hip=bodyPoint(body,((i?230:170)-218)*GUARD_SCALE,(735-870)*GUARD_SCALE);
    const foot={x:leg.foot.x,y:leg.foot.y*.5},ankle={x:foot.x,y:foot.y-RUN_BONES.sole};
    return {...leg,foot,...connectedLeg(hip,ankle,i?'Near':'Far',GUARD_BONES)};
  });
  return {q,body,legs};
}

function unarmedGuard(art,density){
  const key=`guard-body:${density}`;if(art.cache.has(key))return art.cache.get(key);
  const body=art.frame('enemy','idle',density);if(!body)return null;
  const canvas=art.createCanvas();canvas.width=body.canvas.width;canvas.height=body.canvas.height;
  const g=canvas.getContext('2d');g.drawImage(body.canvas,0,0);
  const pixels=g.getImageData(0,0,canvas.width,canvas.height);if(!pixels?.data)return body;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const i=(y*canvas.width+x)*4;if(!pixels.data[i+3])continue;
    const xx=218+(body.x+(x+.5)/canvas.width*body.w)/(28/356);
    const yy=870+(body.y+(y+.5)/canvas.height*body.h)/(28/356);
    // Remove the old diagonal shaft outside the hands/armour, and its isolated blade.
    const along=Math.max(0,Math.min(1,((xx-15)*388+(yy-836)*-320)/(388**2+320**2)));
    const distance=Math.hypot(xx-15-along*388,yy-836+along*320);
    const chest=xx>150&&xx<305&&yy>595&&yy<735;
    if((distance<9&&!chest)||(xx>343&&yy<570))pixels.data[i+3]=0;
  }
  g.putImageData(pixels,0,0);const result={...body,canvas};art.cache.set(key,result);return result;
}

export function composeGuardFrame(art,p,density){
  if(!p.guard||p.dead)return null;
  const body=unarmedGuard(art,density);if(!body)return null;
  const {q,body:pose,legs}=guardWalkingPose(p);
  const key=`guard-action:${density}`;let frame=art.movingFrames.get(key);
  if(!frame){const canvas=art.createCanvas();canvas.width=Math.ceil(72*density);canvas.height=Math.ceil(56*density);frame={canvas,x:-28,y:-48,w:72,h:56,version:0};art.movingFrames.set(key,frame);}
  const g=frame.canvas.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,frame.canvas.width,frame.canvas.height);
  g.setTransform(density,0,0,density,-frame.x*density,-frame.y*density);g.imageSmoothingEnabled=true;
  if(legs)paintLegs(art,'enemy',density,g,legs);
  else{g.save();g.beginPath();g.rect(-30,-14,70,25);g.clip();g.drawImage(body.canvas,body.x,body.y,body.w,body.h);g.restore();}
  g.save();g.translate(pose.sway,-14+pose.bob);g.rotate(pose.lean);g.translate(0,14);
  torsoWithPelvisPath(g);g.clip();
  g.drawImage(body.canvas,body.x,body.y,body.w,body.h);g.restore();
  const image=art.images.skinActors;
  const segment=(a,b)=>{g.save();g.translate(a.x,a.y);g.rotate(Math.atan2(b.y-a.y,b.x-a.x));g.drawImage(image,215,611,50,37,-.4,-1.4,Math.hypot(b.x-a.x,b.y-a.y)+.8,2.8);g.restore();};
  for(const [i,offset]of [-4,2].entries()){
    const hand={x:4+q.push+Math.cos(q.angle)*offset,y:-18+Math.sin(q.angle)*offset};
    const shoulder=bodyPoint(pose,i?-2:2,i?-22:-21),elbow={x:(shoulder.x+hand.x)/2-1,y:(shoulder.y+hand.y)/2+3};
    segment(shoulder,elbow);segment(elbow,hand);g.fillStyle='#c4aa88';g.beginPath();g.arc(hand.x,hand.y,1,0,Math.PI*2);g.fill();
  }
  frame.version++;return frame;
}

export function drawGuardWeapon(art,p){
  const g=art.g,q=guardGeometry(p),a=p.melee;
  if(a&&a.t>=GUARD_MELEE.windup&&a.t<=GUARD_MELEE.windup+GUARD_MELEE.strike){
    for(let i=3;i>0;i--){const trail=guardGeometry(p,Math.max(GUARD_MELEE.windup,a.t-i*.022));g.save();g.globalAlpha=.08+(3-i)*.06;
      art.line(trail.origin.x,trail.origin.y,trail.tip.x,trail.tip.y,'#e5edf3',2.2);g.restore();}
  }
  art.line(q.butt.x,q.butt.y,q.tip.x,q.tip.y,'#41565d',1.65);
  art.line(q.butt.x,q.butt.y,q.tip.x,q.tip.y,'#ab9d71',.8);
  g.save();g.translate(q.tip.x,q.tip.y);g.scale(q.face,1);g.rotate(q.angle);
  g.fillStyle='#557d90';g.beginPath();g.moveTo(0,0);g.lineTo(-6,-2.1);g.lineTo(-4.3,0);g.lineTo(-6,2.1);g.closePath();g.fill();
  g.fillStyle='#e4edf1';g.beginPath();g.moveTo(0,0);g.lineTo(-6,-2.1);g.lineTo(-4.3,0);g.closePath();g.fill();
  g.fillStyle='#648eaf';g.beginPath();g.moveTo(-7,-.7);g.quadraticCurveTo(-9,-3,-13,-2+Math.sin((art.state.time||0)*6));g.lineTo(-10,1);g.closePath();g.fill();g.restore();
}
