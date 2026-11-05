import {WUKONG_MAGIC,multiArmActors} from './wukong-magic.mjs';
import {staffGeometry,staffMotion} from './wukong-combat.mjs';
import {armPose} from './wukong-motion.mjs';
import {drawPowerStaff} from './wukong-power-art.mjs';
import {idleMotion} from './wukong-idle.mjs';
import {actorRootY} from './wukong-mount.mjs';

const fade=effect=>Math.min(1,effect.t/.18,effect.remaining/.45);
function drawArm(art,arm,shade){
  const g=art.g,image=art.images.skinActors;
  const limb=(a,b,source,width)=>{
    g.save();g.translate(a.x,a.y);g.rotate(Math.atan2(b.y-a.y,b.x-a.x));
    g.drawImage(image,...source,-.4,-width/2,Math.hypot(b.x-a.x,b.y-a.y)+.8,width);g.restore();
  };
  g.save();if(shade)g.filter='brightness(.83)';
  limb(arm.shoulder,arm.elbow,[198,183,37,35],3.5);limb(arm.elbow,arm.hand,[218,206,40,25],2.6);
  g.fillStyle='#d1a365';g.beginPath();g.arc(arm.hand.x,arm.hand.y,1.1,0,Math.PI*2);g.fill();g.restore();
}
export function drawSixArmForm(art,p,front){
  const actors=multiArmActors(p),image=art.images.skinActors;if(!actors.length||!image?.naturalWidth)return;
  const idle=idleMotion(p,art.state.time||art.state.t/60),m={...staffMotion(p),...(idle.active?idle:{})};
  const g=art.g,size=p.giantT>0?2:1,face=p.staff?.face||p.face||1,alpha=fade(p.magic.arms);
  const body=(x,y)=>({x:(m.sway||0)+x*(m.width||1)*Math.cos(m.lean)-(y+14)*m.stretch*Math.sin(m.lean),
    y:-14+x*(m.width||1)*Math.sin(m.lean)+(y+14)*m.stretch*Math.cos(m.lean)+m.bob});
  g.save();g.globalAlpha*=alpha;
  if(!front){
    g.save();g.translate(p.x,actorRootY(p));g.scale(face*size,size);
    const a=body(-7.5,-29.8),b=body(9,-30.7);
    // Both additional heads are cut from the existing hero atlas, with the rear
    // head facing back. No additional image download or duplicated torso.
    for(const [head,root]of [[a,body(-4,-22.5)],[b,body(4,-22.5)]]){
      g.fillStyle='#99712f';g.strokeStyle='#e2bd62';g.lineWidth=.6;g.beginPath();
      g.moveTo(head.x-1.7,head.y+2.8);g.lineTo(head.x+1.7,head.y+2.8);
      g.lineTo(root.x+2,root.y);g.lineTo(root.x-2,root.y);g.closePath();g.fill();g.stroke();
    }
    g.save();g.translate(a.x,a.y);g.scale(-1,1);g.rotate(-.1);g.drawImage(image,246,98,92,91,-4,-4.5,8.7,8.6);g.restore();
    g.save();g.translate(b.x,b.y);g.rotate(.12);g.drawImage(image,246,98,92,91,-4,-4.5,8.7,8.6);g.restore();
    g.restore();
  }
  for(const [index,actor]of actors.entries()){
    const q=staffGeometry(actor),track=staffMotion(actor),axis={x:Math.cos(q.angle),y:Math.sin(q.angle)};
    const grip={x:(q.origin.x-p.x)/face/size,y:(q.origin.y-actorRootY(p))/size};
    const hand=offset=>({x:grip.x+axis.x*offset*(q.projection||1),y:grip.y+axis.y*offset*(q.projection||1)});
    const height=index?-18.5:-25.5;
    const arm=front?armPose(body(-4,height),hand(track.nearGrip??-3.5),1):armPose(body(3.5,height+1),hand(track.farGrip??5.5),-1);
    g.save();g.translate(p.x,actorRootY(p));g.scale(face*size,size);drawArm(art,arm,!front);g.restore();
    if(front!==(track.behind>.5))drawPowerStaff(art,actor,q,size,{throws:false});
  }
  g.restore();
}

function summonFrame(art,unit,role){
  art.magicFrames??=new Map();
  const density=Math.max(1,Math.min(unit.summonKind==='troop'?1.5:2,art.scale*unit.magicScale));
  const long=(unit.staff?.weapon||unit.weapon)==='laser';
  const bounds=long?{x:-142,y:-150,w:284,h:260}:{x:-87,y:-105,w:174,h:170};
  const key=unit.owner+':'+unit.summonKind+':'+unit.index;
  // Doubles pose at 30 Hz, small monkeys at 20 Hz; retain one frame per unit.
  // Repeated paused renders
  // and the intervening 60 Hz frames reuse the complete painted figure.
  const fps=unit.summonKind==='troop'?20:30;
  const resting=!unit.staff&&unit.onGround&&Math.abs(unit.vx)<2;
  const time=resting?'idle:'+Math.floor(((art.state.time||0)%2.8)/2.8*8):Math.floor(unit.clock*fps);
  const pose=[role,density,long,time,unit.staff?.face||unit.face,unit.onGround,unit.weapon,unit.rapid,unit.staff?.variant,unit.staff?.combo].join(':');
  let frame=art.magicFrames.get(key);
  if(frame?.pose===pose)return frame;
  if(!frame||frame.w!==bounds.w||frame.density!==density){
    const canvas=art.createCanvas();canvas.width=Math.ceil(bounds.w*density);canvas.height=Math.ceil(bounds.h*density);
    frame={canvas,...bounds,density};art.magicFrames.set(key,frame);
  }
  const g=frame.canvas.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,frame.canvas.width,frame.canvas.height);
  g.setTransform(density,0,0,density,-frame.x*density,-frame.y*density);
  const local={...unit,x:0,y:0,magicScale:1,magic:undefined,giantT:0,artPose:unit.onGround?undefined:'jump',statusTime:unit.clock,staffThrows:[]};
  const painter=Object.create(art);painter.g=g;painter.scale=density;painter.actor(local,role,false);
  if(unit.summonKind==='clone'){
    g.save();g.globalCompositeOperation='source-atop';g.fillStyle='rgba(78,201,230,.3)';
    g.fillRect(frame.x,frame.y,frame.w,frame.h);g.restore();
  }
  frame.pose=pose;return frame;
}

export function drawMagicAllies(art,p,role){
  if(!p.magic||p.dead||p.enteringExit||p.exitEntered)return;
  const g=art.g;
  for(const [kind,effect]of Object.entries(p.magic))for(const unit of effect.units||[]){
    if(unit.waiting||unit.x<art.state.camX-45||unit.x>art.state.camX+429)continue;
    const size=unit.magicScale,frame=summonFrame(art,unit,role);
    g.save();g.globalAlpha*=fade(effect)*(kind==='clone'?.84:1);
    // A cool tint distinguishes the full-sized hair doubles from their owner;
    // the smaller golden monkeys retain the palette of the existing hero art.
    g.drawImage(frame.canvas,unit.x+frame.x*size,unit.y+frame.y*size,frame.w*size,frame.h*size);g.restore();
    if(unit.staffThrows?.length)drawPowerStaff(art,unit,staffGeometry(unit),size,{staff:false});
    if(unit.recallT>0){
      g.save();g.globalAlpha*=unit.recallT*1.5;g.strokeStyle=WUKONG_MAGIC[kind].color;g.lineWidth=.7;
      g.beginPath();g.ellipse(unit.x,unit.y-9*size,6+unit.recallT*15,12*size,0,0,Math.PI*2);g.stroke();g.restore();
    }
  }
}
