import {HD_ACTORS} from './hd-actor-atlas.mjs?v=webp-1';
import {runGait} from './stage-one-motion.mjs?v=leg-alignment-2';

export const IMPACT_HELMET_ASSET='/games/contra2026/assets/shared/impact-helmet-v2.webp';
export const IMPACT_HELMET=Object.freeze({width:9.4,aspect:512/331,browX:.98,browY:.60});
// Front hairline registration, measured in the original pose sheets. The helmet
// covers the crown while leaving the face, bandana tails and gun readable.
const BROWS=Object.freeze({
 blue:{idle:[230,145],up:[568,145],diagonalUp:[972,145],diagonalDown:[230,510]},
 red:{idle:[224,145],up:[554,138],diagonalUp:[950,137],diagonalDown:[222,502]}
});

export function impactHelmetPose(p,role='blue',tick=0){
 if(!(p.helmT>0)||p.dead||p.ride||p.spin||p.prone||p.inWater||!BROWS[role])return null;
 if(p.helmT<=2&&!(Math.floor(tick/4)%2))return null;
 const aim=p.ay<-.85?'up':p.ay<-.2?'diagonalUp':p.ay>.2?'diagonalDown':'idle';
 const sheet=HD_ACTORS[role],frame=sheet.frames[aim],point=BROWS[role][aim];
 const scale=frame.scale??sheet.scale;
 let x=(point[0]-frame.anchor[0])*scale,y=(point[1]-frame.anchor[1])*scale;
 if(p.onGround&&Math.abs(p.vx||0)>.5){
  const gait=runGait(p.anim||0,p.vx,p.giantT>0?2:1),waist=(frame.waist-frame.anchor[1])*scale;
  x-=gait.lean*(y-waist);y+=-15.2+gait.bob-waist;
 }
 return {x,y,width:IMPACT_HELMET.width,height:IMPACT_HELMET.width/IMPACT_HELMET.aspect,
  angle:aim==='up'?-.12:aim==='diagonalUp'?-.06:aim==='diagonalDown'?.12:0};
}

/** Actor-local coordinates inherit the body's facing and giant-size transform. */
export function drawImpactHelmet(g,image,p,role='blue',tick=0){
 const pose=impactHelmetPose(p,role,tick);
 if(!pose||!(image?.naturalWidth>0))return false;
 g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 g.translate(pose.x,pose.y);g.rotate(pose.angle);
 g.drawImage(image,-pose.width*IMPACT_HELMET.browX,-pose.height*IMPACT_HELMET.browY,pose.width,pose.height);
 g.restore();return true;
}
