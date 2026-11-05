import { sceneryRandom, coastHeight } from './stage-one-scenery.mjs?v=coast-1';

export const RIVER_FISH_ASSET='/games/contra2026/assets/stage1/river-fish.webp';
const PERIOD=18,SPAN=256;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/** World-space schedules survive camera motion; catches are shared in snapshots. */
export function riverFishJumps(time,camera,solids,water={x0:0,x1:3334,surf:186},caught={}){
  const events=[];
  for(let tile=Math.floor((camera-40)/SPAN);tile<=Math.floor((camera+424)/SPAN);tile++){
    const phase=6+((tile%3+3)%3)*6,cycle=Math.floor((time-phase)/PERIOD);
    if(cycle<0||caught[tile]===cycle)continue;
    const seed=tile*379+cycle*971+38,age=time-phase-cycle*PERIOD,duration=1.22+sceneryRandom(seed+11)*.16;
    if(age<0||age>duration+.5)continue;
    const start=tile*SPAN+64+sceneryRandom(seed)*128,face=sceneryRandom(seed+7)>.5?1:-1,travel=46+sceneryRandom(seed+17)*10;
    const end=start+face*travel,left=Math.min(start,end)-14,right=Math.max(start,end)+14;
    if(left<water.x0||right>water.x1)continue;
    const nearBank=solids.some(s=>!s.gone&&!s.water&&s.x<right&&s.x+s.w>left&&
      (s.g&&!s.bridge||s.y<water.surf+12&&s.y+(s.h||14)>water.surf-24));
    // This foreground river layer can leap in front of the bank's rock face.
    const surface=nearBank?207:water.surf+1,height=(nearBank?30:34)+sceneryRandom(seed+23)*6;
    const u=clamp(age/duration,0,1),x=start+face*travel*u,y=surface-4*height*u*(1-u);
    if(x<camera-22||x>camera+406)continue;
    events.push({tile,cycle,age,duration,start,end,x,y,surface,height,face,width:22,
      angle:Math.atan2(-4*height*(1-2*u),travel)*face,airborne:age<duration,
      shoreline:nearBank?Math.max(coastHeight(left),coastHeight(start),coastHeight(right)):null});
  }
  return events;
}

// Follow the rotation of the painted fish and exclude its submerged portion.
export function riverFishBox(fish){
  const c=Math.abs(Math.cos(fish.angle)),s=Math.abs(Math.sin(fish.angle));
  const rx=fish.width/2*c+3.6*s,ry=fish.width/2*s+3.6*c;
  const top=fish.y-ry,bottom=Math.min(fish.y+ry,fish.surface+.5);
  return {x:fish.x-rx,y:top,w:rx*2,h:Math.max(0,bottom-top)};
}

export function riverFishLifeReward(fish,solids,camera=0,waterSurface=186){
  let landing=null,distance=Infinity;
  for(const s of solids){
    if(s.gone||s.water||s.bridge)continue;
    const left=Math.max(s.x+8,camera+8),right=Math.min(s.x+s.w-8,camera+376);
    if(right<left)continue;
    const x=clamp(fish.x,left,right),d=Math.abs(x-fish.x);
    if(d<distance){distance=d;landing={x,y:s.y};}
  }
  const item={kind:'life',fromFish:true,fishKey:fish.tile+':'+fish.cycle,x:fish.x,y:fish.y-4,vx:0,vy:0};
  // In a completely open stretch of water the medal floats within swimming reach.
  if(!landing)return {...item,y:Math.min(fish.surface,waterSurface)-6,rest:true,floating:true};
  const gravity=560,rise=Math.max(24,item.y-landing.y+24),speed=Math.sqrt(2*gravity*rise);
  const flight=(speed+Math.sqrt(Math.max(0,speed*speed+2*gravity*(landing.y-item.y))))/gravity;
  return {...item,vx:(landing.x-item.x)/flight,vy:-speed};
}

export function drawRiverFish(g,image,event){
  const {age,duration,surface,face}=event;
  g.save();
  if(event.airborne&&image){
    const width=event.width,height=width*(image.naturalHeight||image.height)/(image.naturalWidth||image.width);
    g.save();g.beginPath();g.rect(event.x-width,0,width*2,surface+.5);g.clip();
    g.translate(event.x,event.y);g.rotate(event.angle);g.scale(face,1);
    g.drawImage(image,-width/2,-height/2,width,height);g.restore();
  }
  // Larger fans of droplets and expanding rings mark both water crossings.
  for(const [at,x]of [[0,event.start],[duration,event.end]]){
    const elapsed=age-at;if(elapsed<0||elapsed>.5)continue;
    const u=elapsed/.5,alpha=(1-u)*.9;
    g.save();g.globalAlpha*=alpha;g.strokeStyle='#d6f6ff';g.lineWidth=.5;
    for(let ring=0;ring<2;ring++){
      g.beginPath();g.ellipse(x,surface+.4+ring*.65,1.5+u*(8-ring*2),.45+u*(1.3-ring*.3),0,0,Math.PI*2);g.stroke();
    }
    for(let i=0;i<7;i++){
      const spread=(i-3)*(1+u*3.3),y=surface-Math.sin(u*Math.PI)*(4.5+(i%3)*1.8);
      g.fillStyle=i%2?'#effdff':'#85d3f5';g.beginPath();g.ellipse(x+spread,y,.45,.7+(i%2)*.15,spread*.08,0,Math.PI*2);g.fill();
    }
    g.restore();
  }
  g.restore();
}
