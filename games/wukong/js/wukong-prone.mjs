import {staffGeometry,staffMotion,PRONE_POSTURE_SCALE} from './wukong-combat.mjs';

export const PRONE_ART=Object.freeze({key:'skinProne',url:'/games/wukong/assets/wukong-prone.webp',
  bounds:Object.freeze([40,80,1475,780]),anchor:Object.freeze([1088,835]),waist:730,scale:.042*PRONE_POSTURE_SCALE});
const clamp=n=>Math.max(0,Math.min(1,n));

export function proneArmPose(p,solveArm){
  const q=staffGeometry(p),m=staffMotion(p),size=(p.giantT>0?2:1)*(p.magicScale||1),scale=PRONE_POSTURE_SCALE;
  const grip={x:(q.origin.x-p.x)/q.face/size/scale,y:(q.origin.y-p.y)/size/scale};
  const axis={x:Math.cos(q.angle),y:Math.sin(q.angle)};
  const sway=.5*m.weight,bob=p.staff?-.2*m.weight:-.14*(1+Math.sin((p.statusTime??0)*2.2));
  const shoulder=(x,y)=>{const w=clamp((-y-2)/14);return{x:x+sway*w,y:y+bob*w};};
  const near=solveArm(shoulder(5.1,-6.8),{x:grip.x-axis.x*2,y:grip.y-axis.y*2},1);
  const far=solveArm(shoulder(9.3,-6.8),{x:grip.x+axis.x*3,y:grip.y+axis.y*3},1);
  for(const arm of [near,far]){
    arm.elbow.y=Math.min(-.8,arm.elbow.y);
    for(const point of [arm.shoulder,arm.elbow,arm.hand]){point.x*=scale;point.y*=scale;}
  }
  return {...m,sway:sway*scale,bob:bob*scale,near,far};
}

function bodyWithoutArms(art,role,density){
  const body=art.frame(role,'prone',density);if(!body)return null;
  const key=`prone-body:${role}:${density}`;if(art.cache.has(key))return art.cache.get(key);
  const canvas=art.createCanvas();canvas.width=body.canvas.width;canvas.height=body.canvas.height;
  const g=canvas.getContext('2d');g.drawImage(body.canvas,0,0);
  // Replace the painted forearms once; live arms then follow the real staff.
  g.globalCompositeOperation='destination-out';
  for(const points of [
    [[1120,683],[1208,680],[1277,724],[1340,724],[1410,742],[1430,812],[1300,822],[1150,782],[1118,721]],
    [[1277,671],[1346,680],[1433,694],[1475,685],[1510,713],[1510,762],[1430,772],[1330,748],[1265,710]]
  ]){
    g.beginPath();points.forEach(([x,y],i)=>{
      x=(x-PRONE_ART.bounds[0])/PRONE_ART.bounds[2]*canvas.width;
      y=(y-PRONE_ART.bounds[1])/PRONE_ART.bounds[3]*canvas.height;
      i?g.lineTo(x,y):g.moveTo(x,y);
    });g.closePath();g.fill();
  }
  const result={...body,canvas};art.cache.set(key,result);return result;
}

export function composeProneFrame(art,role,p,density,pose){
  const body=bodyWithoutArms(art,role,density),image=art.images.skinActors;
  if(!body||!image?.naturalWidth)return null;
  const key=`prone:${role}:${density}`;let frame=art.movingFrames.get(key);
  if(!frame){
    const canvas=art.createCanvas();canvas.width=Math.ceil(100*density);canvas.height=Math.ceil(46*density);
    frame={canvas,x:-50,y:-39,w:100,h:46,version:0};art.movingFrames.set(key,frame);
  }
  const g=frame.canvas.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,frame.canvas.width,frame.canvas.height);
  g.setTransform(density,0,0,density,-frame.x*density,-frame.y*density);g.imageSmoothingEnabled=true;
  const limb=(a,b,source,width)=>{
    g.save();g.translate(a.x,a.y);g.rotate(Math.atan2(b.y-a.y,b.x-a.x));
    g.drawImage(image,...source,-.4,-width/2,Math.hypot(b.x-a.x,b.y-a.y)+.8,width);g.restore();
  };
  const arm=(a,far=false)=>{
    g.save();if(far)g.filter='brightness(.8)';
    limb(a.shoulder,a.elbow,[198,183,37,35],3.6*PRONE_POSTURE_SCALE);limb(a.elbow,a.hand,[218,206,40,25],2.7*PRONE_POSTURE_SCALE);
    g.fillStyle='#be9360';g.beginPath();g.arc(a.hand.x,a.hand.y,1.15*PRONE_POSTURE_SCALE,0,Math.PI*2);g.fill();g.restore();
  };
  arm(pose.far,true);
  // Breathing lifts the chest very slightly while the boots stay on the floor.
  const height=body.canvas.height,step=Math.max(1,Math.round(density));
  for(let row=0;row<height;row+=step){
    const sh=Math.min(step,height-row),y=body.y+row/height*body.h,weight=clamp((-y-2)/14);
    g.drawImage(body.canvas,0,row,body.canvas.width,sh,body.x+pose.sway*weight,
      y+pose.bob*weight,body.w,sh/height*body.h+.025);
  }
  arm(pose.near);frame.version++;return frame;
}
