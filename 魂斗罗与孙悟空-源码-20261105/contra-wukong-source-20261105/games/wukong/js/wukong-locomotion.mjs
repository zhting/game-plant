import { RUN_BONES, runGait, wadeGait } from '../../contra2026/js/stage-one-motion.mjs?v=leg-alignment-2';

// Anatomical hip sockets in the same idle painting used for the torso.
const scale=28/302;
export const WUKONG_RUN_LIFT=.75;
export const WUKONG_HIPS=Object.freeze([
  Object.freeze({name:'Far',x:(229-260)*scale,y:(295-433)*scale}),
  Object.freeze({name:'Near',x:(270-260)*scale,y:(290-433)*scale}),
]);
export function groundGait(p){
  if(!p.onGround||p.dead||p.prone||p.spin||p.ride||p.beastRider||p.restingOnCloud||Math.abs(p.vx||0)<=2)return null;
  return (p.inWater?wadeGait:runGait)(p.anim||0,p.vx,p.giantT>0?2:1);
}
export function locomotionBody(p,motion){
  const gait=groundGait(p);if(!gait)return motion;
  return {...motion,bob:motion.bob+gait.bob,lean:motion.lean+gait.lean};
}
// This is the identical waist transform used to paint the torso and solve arms.
export function bodyPoint(pose,x,y){
  const angle=pose.lean||0,width=pose.width||1,height=pose.stretch||1;
  return {x:(pose.sway||0)+x*width*Math.cos(angle)-(y+14)*height*Math.sin(angle),
    y:-14+x*width*Math.sin(angle)+(y+14)*height*Math.cos(angle)+(pose.bob||0)};
}
export function connectedLeg(hip,ankle,name,bones=RUN_BONES){
  const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.max(.001,Math.hypot(dx,dy));
  // Preserve foot contact during a deep moving strike. A small axial extension
  // is preferable to tearing the joints apart; trouser width never changes.
  const stretch=Math.max(1,d/(bones.upper+bones.lower-.01));
  const upper=bones.upper*stretch,lower=bones.lower*stretch;
  const along=(upper**2-lower**2+d*d)/(2*d),bend=Math.sqrt(Math.max(0,upper**2-along**2));
  return {name,hip,knee:{x:hip.x+dx/d*along+dy/d*bend,y:hip.y+dy/d*along-dx/d*bend},ankle,stretch};
}
export function walkingLegs(p,pose){
  const gait=groundGait(p);if(!gait)return null;
  return gait.legs.map((leg,i)=>{
    // A less folded swing avoids the knee whipping around its hip at toe-off.
    // Horizontal travel, contact timing and planted soles stay on the old gait.
    const foot={x:leg.foot.x,y:leg.foot.y*(p.inWater?1:WUKONG_RUN_LIFT)},ankle={x:foot.x,y:foot.y-RUN_BONES.sole};
    return {...leg,foot,...connectedLeg(bodyPoint(pose,WUKONG_HIPS[i].x,WUKONG_HIPS[i].y),ankle,WUKONG_HIPS[i].name)};
  });
}
export function paintLegs(art,role,density,g,legs){
  const segment=(f,a,b,length)=>{
    if(!f)return;
    g.save();g.translate(a.x,a.y);g.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);
    g.scale(f.thickness||1,Math.hypot(b.x-a.x,b.y-a.y)/length);g.rotate(-f.angle);
    // Extend the texture a fraction beyond the joint, under its adjoining piece.
    g.drawImage(f.canvas,f.x,f.y-.2,f.w,f.h+.4);g.restore();
  };
  for(const leg of legs){
    segment(art.frame(role,'rig'+leg.name+'Shin',density),leg.knee,leg.ankle,RUN_BONES.lower);
    segment(art.frame(role,'rig'+leg.name+'Thigh',density),leg.hip,leg.knee,RUN_BONES.upper);
    const boot=art.frame(role,'rig'+leg.name+'Boot',density);if(!boot)continue;
    g.save();g.translate(leg.ankle.x,leg.ankle.y);g.rotate(leg.footAngle||0);g.drawImage(boot.canvas,boot.x,boot.y,boot.w,boot.h);g.restore();
  }
}
// The armoured belt and hanging central skirt cover the tops of both thighs.
// A curved overlap follows the waist, instead of a screen-horizontal hard cut.
export function torsoWithPelvisPath(g){
  g.beginPath();g.moveTo(-45,-55);g.lineTo(45,-55);g.lineTo(45,-14.2);g.lineTo(10,-14.2);
  g.quadraticCurveTo(9,-10,5,-9);g.quadraticCurveTo(3,-7,1,-7);g.lineTo(-1,-7);
  g.quadraticCurveTo(-4,-7,-6,-9.5);g.quadraticCurveTo(-9,-10.5,-10,-14.2);g.lineTo(-45,-14.2);g.closePath();
}
