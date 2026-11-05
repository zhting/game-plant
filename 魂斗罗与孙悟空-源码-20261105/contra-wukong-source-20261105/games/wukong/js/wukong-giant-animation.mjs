// Host timing and compatibility pose tracks. Whole-character artwork and axe
// contact sample wukong-giant-frames; these tracks never assemble the displayed body.
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
const wrap=n=>((n%1)+1)%1;
export const GIANT_REST=Object.freeze({angle:-1.25,lean:0,roll:0,lunge:0,weight:0,lift:0,bodyScaleY:1,widthScale:1,
  nearX:-40,nearY:-8.5,farX:38,farY:-8.5,nearBoot:0,farBoot:0,clothKick:0});
const key=(at,pose={})=>({at,pose:{...GIANT_REST,...pose}});
const definitions={
  idle:{duration:2.8,loop:true,keys:[key(0),key(.25,{lift:-.45,roll:-.006,angle:-1.27}),key(.5,{lift:0,roll:0}),key(.75,{lift:.35,roll:.006,angle:-1.23}),key(1)]},
  walk:{duration:1.15,loop:true,keys:[]},
  retreat:{duration:1.15,loop:true,keys:[]},
  cleave:{duration:1.97,keys:[key(0),key(.13,{angle:-1.48,lean:-.02,roll:-.015,lift:1.3}),
    key(.28,{angle:-2.02,lean:-.05,roll:-.045,lift:2,nearX:-36,farX:36}),key(.4,{angle:-2.16,lean:-.055,roll:-.05,lift:2.4,nearX:-36,farX:36}),
    key(.48,{angle:-1.1,lean:.02,roll:.035,lunge:4,lift:.7,nearX:-36,farX:36,clothKick:.8}),
    key(.57,{angle:.65,lean:.12,roll:.08,lunge:9,lift:1.4,nearX:-36,farX:36,clothKick:1}),
    key(.64,{angle:1.08,lean:.12,roll:.07,lunge:9,lift:2.3,nearX:-36,farX:36,clothKick:.7}),
    key(.77,{angle:.27,lean:.07,roll:.045,lunge:5,lift:1.1,clothKick:.5}),key(.9,{angle:-.95,lean:.02,roll:.012,lunge:1}),key(1)]},
  sweep:{duration:1.97,keys:[key(0),key(.2,{angle:-.67,lean:-.045,roll:-.045,lift:1.7,widthScale:.96}),
    key(.4,{angle:-.68,lean:-.065,roll:-.055,lift:2,widthScale:.94,nearX:-36,farX:36}),
    key(.49,{angle:-.12,lean:.055,roll:.04,lunge:5,widthScale:.97,nearX:-36,farX:36,clothKick:.9}),
    key(.58,{angle:.63,lean:.13,roll:.07,lunge:9,lift:1.8,widthScale:1.02,nearX:-36,farX:36,clothKick:1}),
    key(.64,{angle:.86,lean:.12,roll:.06,lunge:9,lift:2,nearX:-36,farX:36,clothKick:.8}),
    key(.81,{angle:.16,lean:.04,roll:.025,lunge:3,lift:.6,clothKick:.4}),key(1)]},
  whirlwind:{duration:2.45,keys:[key(0),key(.2,{angle:-1.52,lean:-.04,roll:-.04,widthScale:.95,lift:1.2}),
    key(.4,{angle:-1.7,lean:-.05,roll:-.05,widthScale:.92,lift:2}),
    key(.47,{angle:-.4,lean:.11,roll:.075,widthScale:.88,lunge:3,clothKick:1}),
    key(.54,{angle:1.8,lean:0,roll:-.045,widthScale:.84,lift:-.6,lunge:5,clothKick:1}),
    key(.6,{angle:4.3,lean:-.09,roll:-.07,widthScale:.93,lift:.8,lunge:4,clothKick:1}),
    key(.64,{angle:5.53,lean:.08,roll:.06,lunge:4,lift:1.4,clothKick:1}),
    key(.8,{angle:5.7,lean:.025,roll:.025,lunge:2,clothKick:.5}),key(1,{angle:-1.25+Math.PI*2})]},
  stomp:{duration:2.75,keys:[key(0),key(.18,{angle:-1.52,lean:-.025,roll:-.025,lift:1.8}),
    key(.32,{angle:-1.84,lean:-.055,roll:-.04,lift:-2,nearX:-30,nearY:-16,nearBoot:-.1}),
    key(.4,{angle:-1.95,lean:-.06,roll:-.04,lift:-4,nearX:-28,nearY:-20,nearBoot:-.13}),
    key(.46,{angle:-1.69,lean:.075,roll:.05,lift:4.5,bodyScaleY:.98,nearX:-34,nearY:-8.5,clothKick:1}),
    key(.57,{angle:-1.28,lean:.075,roll:.04,lift:4,bodyScaleY:.98,clothKick:.8}),
    key(.72,{angle:-1.3,lean:.035,roll:.02,lift:2.1,clothKick:.5}),key(1)]},
  jumpStart:{duration:.72,keys:[key(0),key(.28,{angle:-1.54,lift:2.4,lean:-.025,roll:-.025,nearX:-33,farX:33}),
    key(.7,{angle:-2.15,lift:6,bodyScaleY:.98,lean:-.06,roll:-.045,nearX:-30,farX:30,clothKick:.4}),
    key(1,{angle:-2.3,lift:4.5,lean:-.07,roll:-.055,nearX:-28,farX:28,clothKick:.8})]},
  jumpAir:{duration:.68,keys:[key(0,{angle:-2.3,lean:-.07,roll:-.055,nearX:-23,nearY:-15,farX:23,farY:-13,clothKick:1}),
    key(.28,{angle:-2.32,lean:-.08,roll:-.07,lift:-.8,nearX:-18,nearY:-26,farX:23,farY:-20,nearBoot:-.16,farBoot:.16,clothKick:1}),
    key(.5,{angle:-2.3,lean:-.075,roll:-.06,nearX:-18,nearY:-24,farX:24,farY:-18,nearBoot:-.12,farBoot:.12,clothKick:1}),
    key(.7,{angle:-1.2,lean:.035,roll:.05,nearX:-24,nearY:-20,farX:30,farY:-15,clothKick:1}),
    key(.88,{angle:.5,lean:.11,roll:.08,nearX:-30,nearY:-12,farX:33,farY:-10,clothKick:1}),
    key(1,{angle:.85,lean:.1,roll:.065,lift:1.2,nearX:-34,farX:34,clothKick:1})]},
  land:{duration:.46,keys:[key(0,{angle:.85,lean:.1,roll:.065,lift:1.2,nearX:-34,farX:34,clothKick:1}),
    key(.2,{angle:.82,lean:.09,roll:.065,lift:5,bodyScaleY:.975,nearX:-34,farX:34,clothKick:1}),
    key(.48,{angle:.24,lean:.045,roll:.04,lift:2.5,nearX:-36,farX:36,clothKick:.7}),
    key(.78,{angle:-.9,lean:.015,roll:.01,lift:.4,clothKick:.3}),key(1)]}
};

// The planted part of each step is linear in travelled distance; the return arc
// raises the boot. Both directions use this same planted-foot track.
function step(phase){
  const u=wrap(phase);
  if(u<=.62)return {x:22-44*u/.62,y:-8.5,boot:0};
  const v=(u-.62)/.38;return {x:-22+44*smooth(v),y:-8.5-Math.sin(v*Math.PI)*10,boot:Math.sin(v*Math.PI)*.1};
}
for(const name of ['walk','retreat'])for(let i=0;i<=16;i++){
  const u=i/16,near=step(u),far=step(u+.5),direction=name==='retreat'?-1:1;
  definitions[name].keys.push(key(u,{angle:-1.25+Math.sin(u*Math.PI*2)*.04,lean:direction*.035,roll:Math.sin(u*Math.PI*2)*.012,
    lift:-Math.abs(Math.sin(u*Math.PI*2))*1.2,nearX:-7+near.x,nearY:near.y,farX:7+far.x,farY:far.y,
    nearBoot:near.boot,farBoot:far.boot,clothKick:.25}));
}
const fields=Object.keys(GIANT_REST);
function authoredPose(clip,u){
  const keys=clip.keys;u=clamp(u);let i=0;while(i<keys.length-2&&keys[i+1].at<u)i++;
  const a=keys[i],b=keys[i+1],p=keys[Math.max(0,i-1)],n=keys[Math.min(keys.length-1,i+2)],span=b.at-a.at,t=clamp((u-a.at)/span),pose={};
  // Bounded Hermite curves keep knees and weapon acceleration smooth without
  // sending planted soles below the floor or overshooting a wind-up pose.
  for(const field of fields){
    const av=a.pose[field],bv=b.pose[field],delta=(bv-av)/span;
    let m0=(bv-p.pose[field])/(b.at-p.at||1),m1=(n.pose[field]-av)/(n.at-a.at||1);
    if(!delta){m0=m1=0;}else{
      m0=Math.sign(m0)===Math.sign(delta)?Math.sign(delta)*Math.min(Math.abs(m0),3*Math.abs(delta)):0;
      m1=Math.sign(m1)===Math.sign(delta)?Math.sign(delta)*Math.min(Math.abs(m1),3*Math.abs(delta)):0;
    }
    pose[field]=(2*t**3-3*t*t+1)*av+(t**3-2*t*t+t)*span*m0+(-2*t**3+3*t*t)*bv+(t**3-t*t)*span*m1;
  }
  return pose;
}
export const GIANT_ANIMATIONS=Object.freeze(Object.fromEntries(Object.entries(definitions).map(([name,clip])=>{
  const frameCount=Math.ceil(clip.duration*30)+1;
  const frames=Array.from({length:frameCount},(_,i)=>Object.freeze(authoredPose(clip,i/(frameCount-1))));
  return [name,Object.freeze({...clip,fps:30,frames:Object.freeze(frames)})];
})));
export function sampleGiantClip(name,u){
  const clip=GIANT_ANIMATIONS[name]||GIANT_ANIMATIONS.idle,index=clamp(u)*(clip.frames.length-1),a=Math.floor(index),b=Math.min(a+1,clip.frames.length-1),blend=index-a,pose={};
  for(const field of fields)pose[field]=clip.frames[a][field]+(clip.frames[b][field]-clip.frames[a][field])*blend;
  return pose;
}
export function giantAnimationTrack(g,time=g.attack?.t??0){
  const a=g.attack;
  if(a?.kind==='leap'){
    const flight=a.flight||.68;
    if(time<a.windup)return {clip:'jumpStart',u:clamp(time/a.windup)};
    if(time<a.windup+flight)return {clip:'jumpAir',u:clamp((time-a.windup)/flight)};
    return {clip:'land',u:clamp((time-a.windup-flight)/.46)};
  }
  if(a){
    const strike=a.strike??.32,recovery=a.recovery??.85;
    const u=time<a.windup?.4*time/a.windup:time<a.windup+strike?.4+.24*(time-a.windup)/strike:.64+.36*(time-a.windup-strike)/recovery;
    return {clip:a.kind,u:clamp(u)};
  }
  if((g.walkBlend||0)>.15)return {clip:(g.vx||0)*(g.face||-1)<0?'retreat':'walk',u:wrap((g.gait||0)/Math.PI/2)};
  return {clip:'idle',u:wrap((g.clock||0)/GIANT_ANIMATIONS.idle.duration)};
}
function blendPose(from,to,amount){
  const result={};for(const field of fields){
    const delta=field==='angle'?Math.atan2(Math.sin(to[field]-from[field]),Math.cos(to[field]-from[field])):to[field]-from[field];
    result[field]=from[field]+delta*amount;
  }return result;
}
export function giantAnimationPose(g,time=g.attack?.t??0){
  const track=giantAnimationTrack(g,time),a=g.attack,pose=sampleGiantClip(track.clip,track.u),anim=g.animation;
  if(a&&a.kind!=='leap'&&time>a.windup+(a.strike??.32)+.12&&(g.walkBlend||0)>.05){
    const walking=sampleGiantClip('walk',wrap((g.gait||0)/Math.PI/2));
    for(const field of ['nearX','nearY','farX','farY','nearBoot','farBoot'])pose[field]+=(walking[field]-pose[field])*g.walkBlend;
  }
  const dt=a?time-a.t:0;
  return anim?.from&&anim.clip===track.clip?blendPose(anim.from,pose,smooth((anim.elapsed+dt)/anim.blendSeconds)):pose;
}
export function advanceGiantAnimation(g,dt,previous){
  const track=giantAnimationTrack(g),old=g.animation;
  const blendSeconds=track.clip==='land'?.08:track.clip==='jumpAir'?.09:.14;
  if(old?.clip!==track.clip)g.animation={clip:track.clip,elapsed:0,blendSeconds,from:previous};
  else old.elapsed=Math.min(old.blendSeconds,old.elapsed+dt);
  const anim=g.animation;if(anim.elapsed>=anim.blendSeconds)anim.from=null;
  anim.frame=Math.floor(track.u*(GIANT_ANIMATIONS[track.clip].frames.length-1));
}
