import { HD_ACTORS } from './hd-actor-atlas.mjs?v=webp-1';
import { isRunning, isWading, runFrame, runGait, wadeGait, MOTORCYCLE_RIDER } from './stage-one-motion.mjs?v=leg-alignment-2';
import { HD_RUNS } from './hd-run-atlas.mjs?v=webp-1';
import { deathVisual } from './player-death.mjs?v=death-fall-1';
import { HD_DEATH } from './hd-death-atlas.mjs?v=webp-1';
import { HD_RUN_RIG } from './hd-run-rig.mjs?v=webp-1';
export { HD_ACTORS, HD_RUNS, HD_DEATH, HD_RUN_RIG };

export function actorPose(p,enemy=false){
  if(p.dead)return 'dead';
  if(p.ride==='moto')return 'moto';
  if(p.spin)return 'roll';
  if(p.prone)return 'prone';
  if(isWading(p))return 'wade';
  if(isRunning(p))return 'run'+runFrame(p.anim||0,p.vx,p.giantT>0&&!enemy?2:1,enemy);
  return p.ay<-.85?'up':p.ay<-.2?'diagonalUp':p.ay>.2?'diagonalDown':'idle';
}

/** Assemble movement into one figure before applying whole-body status effects. */
export class HDActorArt {
  constructor(createCanvas,images,{poseSheets=HD_ACTORS,runSheets=HD_RUNS,runRig=HD_RUN_RIG,deathSheets=HD_DEATH,deadPose='prone',proneHeight=Infinity}={}){
    this.createCanvas=createCanvas;this.images=images;this.cache=new Map();this.movingFrames=new Map();this.poseSheets=poseSheets;this.runSheets=runSheets;this.runRig=runRig;this.deathSheets=deathSheets;this.deadPose=deadPose;this.proneHeight=proneHeight;
  }
  ready(role){return this.images[this.poseSheets[role].key]?.naturalWidth>0;}
  clear(){this.cache.clear();this.movingFrames.clear();}
  frame(role,pose,density){
    const key=`${role}:${pose}:${density}`;
    if(this.cache.has(key))return this.cache.get(key);
    const sheet=pose.startsWith('rig')?this.runRig?.[role]:pose.startsWith('death')?this.deathSheets?.[role]:pose.startsWith('run')?this.runSheets[role]:this.poseSheets[role];
    const meta=sheet?.frames[pose],image=sheet&&this.images[meta?.key??sheet.key];
    if(!meta)return null;
    if(!(image?.naturalWidth>0))return null;
    const [sx,sy,sw,sh]=meta.bounds;
    const scale=meta.scale??(pose==='prone'?Math.min(sheet.scale,34/sw,this.proneHeight/sh):pose==='roll'?18/Math.max(sw,sh):pose==='dead'?Math.min(sheet.scale,38/sw,11/sh):sheet.scale);
    const scaleY=meta.scaleY??scale,w=sw*scale,h=sh*scaleY,canvas=this.createCanvas();
    canvas.width=Math.ceil(w*density);canvas.height=Math.ceil(h*density);
    const g=canvas.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    if(pose.startsWith('rigFar'))g.filter='brightness(.78) saturate(.9)';
    if(meta.clip){
      g.save();g.beginPath();meta.clip.forEach(([x,y],i)=>i?g.lineTo(x/sw*canvas.width,y/sh*canvas.height):g.moveTo(x/sw*canvas.width,y/sh*canvas.height));g.closePath();g.clip();
    }
    g.drawImage(image,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
    if(meta.clip)g.restore();
    const result={canvas,w,h,x:(sx-meta.anchor[0])*scale,y:(sy-meta.anchor[1])*scaleY,waist:(meta.waist-meta.anchor[1])*scaleY,angle:meta.angle||0,thickness:meta.thickness||1};
    this.cache.set(key,result);return result;
  }
  movingFrame(role,p,pose,density){
    const size=p.giantT>0&&role!=='enemy'?2:1,wading=pose==='wade',riding=pose==='moto';
    const gait=riding?MOTORCYCLE_RIDER:wading?wadeGait(p.anim||0,p.vx,size):runGait(p.anim||0,p.vx,size,role==='enemy');
    const aim=p.ay<-.85?'up':p.ay<-.2?'diagonalUp':p.ay>.2?'diagonalDown':'idle';
    const upper=this.frame(role,aim,density),legs=['Far','Near'].map(name=>['Shin','Thigh','Boot'].map(part=>this.frame(role,`rig${name}${part}`,density)));
    if(!upper||legs.some(parts=>parts.some(part=>!part)))return null;
    const pitch=riding?(p.motoPitch||0):0;
    const key=`${role}:${riding?'moto:':''}${density}`,signature=`${riding}:${wading}:${gait.phase}:${aim}:${pitch}`;
    let frame=this.movingFrames.get(key);
    if(!frame){
      // Fixed actor-space bounds cover every aim and stride, without moving the ground anchor.
      const canvas=this.createCanvas(),x=-24,y=-48,w=56,h=52;
      canvas.width=Math.ceil(w*density);canvas.height=Math.ceil(h*density);
      frame={canvas,x,y,w,h,version:0};this.movingFrames.set(key,frame);
    }
    if(frame.signature===signature)return frame;
    const ink=frame.canvas.getContext('2d'),waist=riding?gait.waist:-15.2+gait.bob;
    ink.setTransform(1,0,0,1,0,0);ink.clearRect(0,0,frame.canvas.width,frame.canvas.height);
    ink.imageSmoothingEnabled=true;ink.imageSmoothingQuality='high';
    ink.setTransform(density,0,0,density,-frame.x*density,-frame.y*density);
    const paint=(f,dy=0)=>ink.drawImage(f.canvas,f.x,f.y+dy,f.w,f.h);
    const segment=(f,start,end)=>{ink.save();ink.translate(start.x,start.y);ink.rotate(Math.atan2(end.y-start.y,end.x-start.x)-Math.PI/2);if(f.thickness&&f.thickness!==1)ink.scale(f.thickness,1);ink.rotate(-f.angle);paint(f);ink.restore();};
    for(const [i,leg]of gait.legs.entries()){
      const [shin,thigh,boot]=legs[i];
      segment(shin,leg.knee,leg.ankle);segment(thigh,leg.hip,leg.knee);
      ink.save();ink.translate(leg.ankle.x,leg.ankle.y);ink.rotate(leg.footAngle);paint(boot);ink.restore();
    }
    // The curved pelvis overlaps the hip sockets inside the finished, unoutlined sprite.
    ink.save();if(riding){ink.translate(gait.seatX,waist);ink.rotate(pitch);ink.translate(0,-waist);}ink.beginPath();ink.moveTo(-70,-80);ink.lineTo(70,-80);ink.lineTo(70,waist+.7);ink.lineTo(4.5,waist+.7);
    ink.quadraticCurveTo(4,waist+2.8,1,waist+3.2);ink.lineTo(-1,waist+3.2);ink.quadraticCurveTo(-4,waist+2.8,-4.5,waist+.7);ink.lineTo(-70,waist+.7);ink.closePath();ink.clip();
    ink.translate(0,waist);ink.transform(1,0,-gait.lean,1,0,0);ink.translate(0,-waist);paint(upper,waist-upper.waist);ink.restore();
    frame.waist=waist;frame.signature=signature;frame.version++;return frame;
  }
  aimedRunFrame(role,pose,aimPose,density){
    const lower=this.frame(role,pose,density),upper=this.frame(role,aimPose,density);
    if(!lower||!upper)return lower;
    const key=`${role}:aim:${density}`,signature=`${pose}:${aimPose}`;
    let frame=this.movingFrames.get(key);
    if(!frame){
      const canvas=this.createCanvas(),x=-24,y=-60,w=56,h=64;
      canvas.width=Math.ceil(w*density);canvas.height=Math.ceil(h*density);
      frame={canvas,x,y,w,h,version:0};this.movingFrames.set(key,frame);
    }
    if(frame.signature===signature)return frame;
    const ink=frame.canvas.getContext('2d'),waist=lower.waist;
    ink.setTransform(1,0,0,1,0,0);ink.clearRect(0,0,frame.canvas.width,frame.canvas.height);
    ink.imageSmoothingEnabled=true;ink.imageSmoothingQuality='high';
    ink.setTransform(density,0,0,density,-frame.x*density,-frame.y*density);
    ink.save();ink.beginPath();ink.rect(-70,waist,140,80);ink.clip();ink.drawImage(lower.canvas,lower.x,lower.y,lower.w,lower.h);ink.restore();
    ink.save();ink.beginPath();ink.moveTo(-70,-80);ink.lineTo(70,-80);ink.lineTo(70,waist+.7);ink.lineTo(4.5,waist+.7);
    ink.quadraticCurveTo(4,waist+2.8,1,waist+3.2);ink.lineTo(-1,waist+3.2);ink.quadraticCurveTo(-4,waist+2.8,-4.5,waist+.7);ink.lineTo(-70,waist+.7);ink.closePath();ink.clip();
    ink.drawImage(upper.canvas,upper.x,upper.y+waist-upper.waist,upper.w,upper.h);ink.restore();
    frame.waist=waist;frame.signature=signature;frame.version++;return frame;
  }
  tinted(frame,color){
    // Moving frames reuse their canvas; refresh tints when its assembled pose changes.
    if(!frame.tints)frame.tints=new Map();
    const cached=frame.tints.get(color);if(cached&&cached.version===frame.version)return cached.canvas;
    const canvas=cached?.canvas||this.createCanvas();
    if(canvas.width!==frame.canvas.width||canvas.height!==frame.canvas.height){canvas.width=frame.canvas.width;canvas.height=frame.canvas.height;}
    const ink=canvas.getContext('2d');ink.clearRect(0,0,canvas.width,canvas.height);ink.drawImage(frame.canvas,0,0);ink.globalCompositeOperation='source-in';
    ink.fillStyle=color;ink.fillRect(0,0,canvas.width,canvas.height);ink.globalCompositeOperation='source-over';
    frame.tints.set(color,{canvas,version:frame.version});return canvas;
  }
  draw(g,p,role,density=1){
    if(p.dead){
      const visual=deathVisual(p);if(!visual.visible)return true;
      const dedicated=this.deathSheets?.[role]&&this.images[this.deathSheets[role].key]?.naturalWidth>0;
      const pose=visual.grounded?((p.deathLandT||0)<.1?'deathImpact':'deathRest'):'deathAir';
      const body=this.frame(role,dedicated?pose:visual.grounded?this.deadPose:'idle',density);if(!body)return false;
      g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.globalAlpha*=visual.alpha;
      if(visual.grounded)g.drawImage(body.canvas,body.x,body.y,body.w,body.h);
      else {g.translate(0,-14);g.rotate(visual.angle*(dedicated ? .25 : 1));g.drawImage(body.canvas,-body.w/2,-body.h/2,body.w,body.h);}
      g.restore();return true;
    }
    const pose=p.artPose||actorPose(p,role==='enemy'),rig=(pose.startsWith('run')||pose==='wade'||pose==='moto')&&this.runRig?.[role]&&this.images[this.runRig[role].key]?.naturalWidth>0;
    const aimedRun=!rig&&pose.startsWith('run')&&Math.abs(p.ay||0)>.2;
    const action=this.actionFrame?.(this,role,p,density);
    const assembled=action||(rig?this.movingFrame(role,p,pose,density):aimedRun?this.aimedRunFrame(role,pose,p.ay<-.85?'up':p.ay<0?'diagonalUp':'diagonalDown',density):this.frame(role,pose==='wade'?'idle':pose,density));
    const frame=assembled&&(this.frameEffect?.(this,assembled,role,p,density)||assembled);
    if(!frame)return false;
    const camo=p.camoT>0,inv=p.invT>0||p.giantGraceT>0||p.giantHitT>0,time=(p.statusTime??p.anim/10)||0;
    const paint=(f,dy=0)=>{
      g.save();
      const inheritedAlpha=g.globalAlpha;
      if(camo)g.globalAlpha*=.4+.06*Math.sin(time*3.5);
      if(inv){
        const gold=this.tinted(f,'#ffdf8a');
        g.save();g.globalAlpha*=.35+.12*Math.sin(time*6);
        for(const [x,y] of [[-.45,0],[.45,0],[0,-.45],[0,.45]])g.drawImage(gold,f.x+x,f.y+dy+y,f.w,f.h);
        g.restore();
      }
      g.drawImage(f.canvas,f.x,f.y+dy,f.w,f.h);
      if(camo){
        g.save();g.globalAlpha*=.52;g.drawImage(this.tinted(f,'#6bc795'),f.x,f.y+dy,f.w,f.h);g.restore();
        // A moving refraction band is clipped by the sprite alpha, not a rectangular overlay.
        const bandY=-34+(time*9%35),sourceY=(bandY-f.y-dy)/f.h*f.canvas.height;
        const sy=Math.max(0,sourceY),sh=Math.min(f.canvas.height-sy,density*1.1);
        if(sourceY>=0&&sh>0){g.globalAlpha=inheritedAlpha*.62;g.drawImage(this.tinted(f,'#c4efd4'),0,sy,f.canvas.width,sh,f.x,f.y+dy+sy/f.canvas.height*f.h,f.w,sh/f.canvas.height*f.h);}
      }
      if(inv){g.globalAlpha*=.08+.04*Math.sin(time*6);g.drawImage(this.tinted(f,'#ffe9b3'),f.x,f.y+dy,f.w,f.h);}
      g.restore();
    };
    g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    if(rig||action)paint(frame);
    else if(pose==='roll'){
      g.translate(0,-14);g.rotate((p.anim||0)*Math.PI/2);
      g.translate(-assembled.w/2-assembled.x,-assembled.h/2-assembled.y);paint(frame);
    }else paint(frame);
    g.restore();return true;
  }
}
