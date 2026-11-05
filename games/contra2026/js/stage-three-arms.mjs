// The reference guardian has five linked gray knuckles per arm and a red claw.
// Pose data is shared by rendering, the moving weak point, contact and firing.
export const WATERFALL_ARMS=Object.freeze({links:Object.freeze([15.5,17.5,17.5,17.5,15.5]),joint:15,claw:21,root:22});

export function waterfallArmPose(side,age,top=0){
  const direction=side<0?-1:1,phase=age*1.45+(direction<0?.15:2.05);
  const root={x:direction<0?117:267,y:top+95};
  const points=[root],sweep=Math.sin(phase)*.74,curl=Math.sin(phase*.73+.7)*1.25;
  let x=root.x,y=root.y;
  for(const [i,length]of WATERFALL_ARMS.links.entries()){
    const angle=-.19+sweep+i/4*curl+Math.sin(phase-i*.52)*.19;
    x+=direction*Math.cos(angle)*length;y+=Math.sin(angle)*length;
    points.push({x,y,angle:direction<0?Math.PI-angle:angle});
  }
  return{root,points,tip:points.at(-1),side:direction};
}

export function updateWaterfallArms(boss,top){
  for(const [i,part]of boss.parts.slice(0,2).entries()){
    if(part.hp<=0)continue;
    const tip=waterfallArmPose(i===0?-1:1,boss.age,top).tip;
    part.x=tip.x-part.w/2;part.y=tip.y-part.h/2;
  }
}

export function waterfallArmBoxes(boss,top){
  if(!boss.active||boss.dead)return[];
  return boss.parts.slice(0,2).flatMap((part,i)=>part.hp>0?
    waterfallArmPose(i===0?-1:1,boss.age,top).points.slice(1).map((p,index)=>{
      const size=index===WATERFALL_ARMS.links.length-1?WATERFALL_ARMS.claw:WATERFALL_ARMS.joint;
      return{x:p.x-size*.45,y:p.y-size*.45,w:size*.9,h:size*.9};
    }):[]);
}
