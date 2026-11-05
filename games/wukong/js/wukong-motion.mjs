import { staffGeometry, staffMotion } from './wukong-combat.mjs';
import { idleMotion, visualStaffGeometry } from './wukong-idle.mjs';
import { composeGuardFrame } from './wukong-guard-art.mjs';
import { proneArmPose, composeProneFrame } from './wukong-prone.mjs';
import { RUN_BONES } from '../../contra2026/js/stage-one-motion.mjs?v=leg-alignment-2';
import { bodyPoint, locomotionBody, walkingLegs, paintLegs, torsoWithPelvisPath } from './wukong-locomotion.mjs';
import { actorRootY, riderLegs } from './wukong-mount.mjs';

// The gripping hands follow the collision staff; a released hand can guard the chest.
export function armPose(shoulder,hand,bend=1){
  const dx=hand.x-shoulder.x,dy=hand.y-shoulder.y,d=Math.max(.001,Math.hypot(dx,dy));
  const height=Math.sqrt(Math.max(0,6.8**2-(d*.5)**2));
  return {shoulder,elbow:{x:(shoulder.x+hand.x)/2-dy/d*height*bend,y:(shoulder.y+hand.y)/2+dx/d*height*bend},hand};
}
export function attackPose(p){
  if(p.prone)return proneArmPose(p,armPose);
  const idle=idleMotion(p),m=locomotionBody(p,{...staffMotion(p),...(idle.active?idle:{})}),size=(p.giantT>0?2:1)*(p.magicScale||1),face=p.staff?.face||p.face||1;
  const q=idle.active?visualStaffGeometry(p):staffGeometry(p);
  const grip={x:(q.origin.x-p.x)/size/face,y:(q.origin.y-actorRootY(p))/size};
  const axis={x:Math.cos(q.angle),y:Math.sin(q.angle)};
  const transform=(x,y)=>bodyPoint(m,x,y);
  const farOffset=(m.farGrip??-4)*(q.projection??1),nearOffset=(m.nearGrip??2)*(q.projection??1),release=m.release||0;
  const support={x:grip.x+axis.x*farOffset,y:grip.y+axis.y*farOffset},guard=transform(7,-24);
  const far=armPose(transform(3,-22),{x:support.x+(guard.x-support.x)*release,y:support.y+(guard.y-support.y)*release},-1);
  const near=armPose(transform(-4,-23),{x:grip.x+axis.x*nearOffset,y:grip.y+axis.y*nearOffset},1);
  far.gripping=release<.001;near.gripping=true;
  return {...m,far,near};
}

export function staffStance(p,pose=attackPose(p)){
  if(!p.staff||!p.onGround||p.inWater||p.ride||p.beastRider||Math.abs(p.vx||0)>2||p.staff.kind==='ultimate')return null;
  return ['Far','Near'].map((name,i)=>{
    const hip={x:(i?2:-2)+(pose.sway||0)*.35,y:-RUN_BONES.hip+pose.bob};
    const ankle={x:i?10+(pose.frontStep||0):-12+(pose.backStep||0),y:-RUN_BONES.sole};
    const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.max(.001,Math.hypot(dx,dy));
    const along=(RUN_BONES.upper**2-RUN_BONES.lower**2+d*d)/(2*d),bend=Math.sqrt(Math.max(0,RUN_BONES.upper**2-along**2));
    return {name,hip,knee:{x:hip.x+dx/d*along+dy/d*bend,y:hip.y+dy/d*along-dx/d*bend},ankle};
  });
}

export function composeStaffFrame(art,role,p,density){
  if(role==='enemy')return composeGuardFrame(art,p,density);
  if(p.prone&&!p.dead&&!p.dive&&!p.enteringExit)return composeProneFrame(art,role,p,density,attackPose(p));
  const idle=idleMotion(p);
  if(p.dead||p.prone||p.dive||p.enteringExit)return null;
  const body=art.frame(role,'idle',density),image=art.images.skinActors;if(!body||!image?.naturalWidth)return null;
  const pose=attackPose(p),riding=riderLegs(p,pose),walk=walkingLegs(p,pose),stance=staffStance(p,pose);
  const base=p.artPose==='jump'?art.frame(role,'jump',density):body;
  const key=`staff:${role}:${density}`;
  let frame=art.movingFrames.get(key);
  if(!frame){const canvas=art.createCanvas();canvas.width=Math.ceil(80*density);canvas.height=Math.ceil(64*density);frame={canvas,x:-36,y:-54,w:80,h:64,version:0};art.movingFrames.set(key,frame);}
  const g=frame.canvas.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,frame.canvas.width,frame.canvas.height);
  g.setTransform(density,0,0,density,-frame.x*density,-frame.y*density);g.imageSmoothingEnabled=true;
  // Stationary attacks use authored bow/low stances; actual movement keeps the run gait.
  if(riding||walk){
    paintLegs(art,role,density,g,riding||walk);
  }else if(stance){
    const segment=(f,a,b)=>{if(!f)return;g.save();g.translate(a.x,a.y);g.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);g.scale(f.thickness||1,1);g.rotate(-f.angle);g.drawImage(f.canvas,f.x,f.y,f.w,f.h);g.restore();};
    for(const leg of stance){
      segment(art.frame(role,'rig'+leg.name+'Shin',density),leg.knee,leg.ankle);
      segment(art.frame(role,'rig'+leg.name+'Thigh',density),leg.hip,leg.knee);
      const boot=art.frame(role,'rig'+leg.name+'Boot',density);
      if(boot){g.save();g.translate(leg.ankle.x,leg.ankle.y);g.drawImage(boot.canvas,boot.x,boot.y,boot.w,boot.h);g.restore();}
    }
  }else{
  g.save();g.beginPath();g.rect(-40,-14,90,25);g.clip();
  if(idle.active){
    const height=base.canvas.height,start=Math.max(0,Math.floor((-14-base.y)/base.h*height));
    for(let row=start;row<height;row+=2){
      const sh=Math.min(2,height-row),y=base.y+row/height*base.h;
      const weight=Math.max(0,Math.min(1,(-y-2)/12));
      g.drawImage(base.canvas,0,row,base.canvas.width,sh,base.x+idle.sway*weight,
        y+idle.bob*.12*weight,base.w,sh/height*base.h+.025);
    }
    // Repaint the soles directly to keep subpixel filtering from making planted feet shimmer.
    g.save();g.beginPath();g.rect(-40,-2,90,8);g.clip();g.clearRect(-40,-2,90,8);
    g.drawImage(base.canvas,base.x,base.y,base.w,base.h);g.restore();
  }else g.drawImage(base.canvas,base.x,base.y,base.w,base.h);
  g.restore();
  }
  const limb=(a,b,source,width)=>{
    g.save();g.translate(a.x,a.y);g.rotate(Math.atan2(b.y-a.y,b.x-a.x));
    g.drawImage(image,...source,-.4,-width/2,Math.hypot(b.x-a.x,b.y-a.y)+.8,width);g.restore();
  };
  const arm=(a,shade=false)=>{
    g.save();if(shade)g.filter='brightness(.78)';
    limb(a.shoulder,a.elbow,[198,183,37,35],3.6);
    limb(a.elbow,a.hand,[218,206,40,25],2.7);
    g.fillStyle='#be9360';g.beginPath();g.arc(a.hand.x,a.hand.y,1.15,0,Math.PI*2);g.fill();
    if(a.gripping===false){g.strokeStyle='#dec084';g.lineWidth=.6;for(let i=0;i<3;i++){g.beginPath();g.moveTo(a.hand.x-.4+i*.5,a.hand.y);g.lineTo(a.hand.x-.7+i*.6,a.hand.y-1.7);g.stroke();}}
    g.restore();
  };
  arm(pose.far,true);
  // Cache a torso with the old, stationary forearms removed from the texture.
  const torsoKey=`torso:${role}:${density}`;
  let torso=art.cache.get(torsoKey);
  if(!torso){
    const canvas=art.createCanvas();canvas.width=body.canvas.width;canvas.height=body.canvas.height;
    const ink=canvas.getContext('2d');ink.drawImage(body.canvas,0,0);
    ink.globalCompositeOperation='destination-out';
    const polygon=points=>{ink.beginPath();points.forEach(([x,y],i)=>{x=(x-8)/416*canvas.width;y=(y-6)/438*canvas.height;i?ink.lineTo(x,y):ink.moveTo(x,y);});ink.closePath();ink.fill();};
    polygon([[299,200],[340,210],[390,207],[394,252],[332,256],[295,231]]);
    polygon([[184,202],[229,205],[281,206],[282,240],[225,245],[184,230]]);
    // The painted fists overlap the chest. Restore the armour underneath before attaching moving arms.
    ink.save();ink.globalCompositeOperation='destination-over';ink.beginPath();
    [[222,185],[276,188],[302,214],[294,270],[230,267],[215,233]].forEach(([x,y],i)=>{
      x=(x-8)/416*canvas.width;y=(y-6)/438*canvas.height;i?ink.lineTo(x,y):ink.moveTo(x,y);
    });ink.closePath();ink.clip();
    ink.drawImage(image,234,228,58,40,(215-8)/416*canvas.width,(198-6)/438*canvas.height,88/416*canvas.width,73/438*canvas.height);ink.restore();
    ink.globalCompositeOperation='source-over';torso={...body,canvas};art.cache.set(torsoKey,torso);
  }
  g.save();g.translate(pose.sway||0,-14+pose.bob);g.rotate(pose.lean);g.scale(pose.width||1,pose.stretch||1);g.translate(0,14);
  if(riding||walk)torsoWithPelvisPath(g);
  else{g.beginPath();g.rect(-45,-55,90,idle.active?44:41.5);}
  g.clip();g.drawImage(torso.canvas,torso.x,torso.y,torso.w,torso.h);g.restore();
  arm(pose.near);frame.version++;return frame;
}
