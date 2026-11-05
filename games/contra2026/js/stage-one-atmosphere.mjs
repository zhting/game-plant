import { sceneryRandom as noise } from './stage-one-scenery.mjs?v=coast-1';

const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
export const STAGE_ONE_RAIN=Object.freeze({minimum:.82,maximum:1});

// A persistent storm covers the whole first stage, including its first frame.
// Gusts vary its strength without opening dry time windows or geographical gaps.
export function rainEnvelope(time=0){
  return STAGE_ONE_RAIN.minimum+(STAGE_ONE_RAIN.maximum-STAGE_ONE_RAIN.minimum)*smooth(jungleWind(time).gust);
}
export function rainStrength(_worldX,time=0){
  return rainEnvelope(time);
}

export const FOREST_SPECIES=Object.freeze([
  {name:'tall-palm',frequency:.92,amplitude:1.45,flexibility:1},
  {name:'fan-palm',frequency:1.38,amplitude:1.15,flexibility:.78},
  {name:'broad-palm',frequency:.72,amplitude:1.65,flexibility:.9},
  {name:'fern',frequency:2.2,amplitude:.65,flexibility:.43}
].map(Object.freeze));
// The analytic wind integral keeps particles moving smoothly as gusts strengthen.
// Trees, rain and loose leaves share its direction without sharing a tree's phase.
const windTravel=time=>162*time-42.92/.82*(Math.cos(time*.82-.4)-Math.cos(-.4))-23.68/1.73*(Math.cos(time*1.73+.8)-Math.cos(.8))-7.4/3.1*(Math.cos(time*3.1+1.2)-Math.cos(1.2));
export function jungleWind(time){
  const gust=.5+.29*Math.sin(time*.82-.4)+.16*Math.sin(time*1.73+.8)+.05*Math.sin(time*3.1+1.2);
  return {gust,speed:88+gust*148,travel:windTravel(time)};
}
export function canopyOffset(time,height,far=false,rain=0,seed=0,species=0){
  const kind=FOREST_SPECIES[species%FOREST_SPECIES.length],crown=smooth((height-.14)/.86),phase=(far?1.8:0)+(seed?noise(seed*97)*Math.PI*2:0);
  if(!crown)return 0;
  const breeze=Math.sin(time*kind.frequency*1.15+phase)*kind.amplitude*2.1+Math.sin(time*kind.frequency*2.1+height*5+phase*1.7)*.75;
  const gust=jungleWind(time-(seed?noise(seed*31)*.8:0)).gust;
  const bend=(1.3+gust*4.4)*(.25+rain*2.1)*kind.flexibility,flutter=Math.sin(time*7.4+phase*2.7+height*7)*rain*(.4+gust*.7);
  return crown*(breeze*(.9+rain*1.9)-bend+flutter)*(far?.5:1);
}

// Each plant bends in strips around its fixed roots; seed and species distinguish
// individual crowns while the distant continuous band shares its tile phase.
export function drawWindForest(g,image,x,y,w,h,time,far=false,rain=0,seed=0,species=0){
  const rows=far?22:40,sourceW=image.width||image.naturalWidth||w,sourceH=image.height||image.naturalHeight||h;
  for(let row=0;row<rows;row++){
    // Share exact source-pixel edges: overlapping translucent rows make dark
    // horizontal seams, especially in the distant forest's reduced opacity.
    const from=Math.round(row*sourceH/rows),to=Math.round((row+1)*sourceH/rows);
    const top=from/sourceH*h,height=(to-from)/sourceH*h;
    const offset=canopyOffset(time,1-(top+height/2)/h,far,rain,seed,species);
    g.drawImage(image,0,from,sourceW,to-from,x+offset,y+top,w,height);
  }
}

export function rainStreaks(camera,time,strength,foreground=false){
  if(strength<=.001)return [];
  const shift=camera*(foreground?1:.64),drops=[],count=Math.round((foreground?300:430)*(.18+.82*strength)),wind=jungleWind(time),drag=foreground?2.1:1.7;
  for(let tile=Math.floor((shift-16)/384);tile<=Math.floor((shift+704)/384);tile++){
    for(let i=0;i<count;i++){
      const seed=tile*7907+i*173+(foreground?5227:37),speed=(foreground?280:220)+noise(seed+11)*(foreground?110:90),life=264/speed;
      const age=((time+noise(seed+23)*life)%life+life)%life,y=age*speed-16;
      const slope=-wind.speed*drag/speed,x=tile*384+noise(seed)*384-shift-(wind.travel-windTravel(time-age))*drag;
      if(x< -10||x>394)continue;
      const length=((foreground?12:8)+noise(seed+19)*(foreground?8:6))*(.75+strength*.65);
      drops.push({x,y,dx:slope*length,dy:length,width:(foreground?.33:.21)+noise(seed+41)*(foreground?.15:.08),
        alpha:strength*(foreground?.48+wind.gust*.2:.22+wind.gust*.08)*(.55+noise(seed+31)*.45)});
    }
  }
  return drops;
}

export function rainSurface(x,solids,water){
  let y=water?.surf??186,wet=true;
  for(const s of solids){
    if(s.gone||s.water||x<s.x||x>s.x+s.w||s.y>=y)continue;
    y=s.y;wet=false;
  }
  return {y,wet};
}

export function rainSplashes(camera,time,strength,solids,water){
  if(strength<=.001)return [];
  const splashes=[];
  for(let i=Math.floor(camera/5)-1;i<=Math.ceil((camera+384)/5);i++){
    const seed=i*313+721,phase=((time*(3.2+noise(seed)*1.5)+noise(seed+5))%1+1)%1;
    if(phase>.48)continue;
    const x=i*5+noise(seed+19)*3.5,{y,wet}=rainSurface(x,solids,water),age=phase/.48;
    splashes.push({x,y,wet,age,size:.8+noise(seed+41)*.7,lean:-jungleWind(time).speed/180*(.2+age*.8),alpha:strength*(1-age)*.9});
  }
  return splashes;
}

// Called inside the world transform; the HUD and bullets keep their own clear layer.
export function drawStageOneRain(g,camera,time,strength,{solids,water},foreground=false){
  if(strength<=.001)return;
  g.save();const opacity=g.globalAlpha;g.lineCap='round';g.strokeStyle=foreground?'#bfdce9':'#94b6ce';
  for(const drop of rainStreaks(camera,time,strength,foreground)){
    let length=drop.dy;
    if(foreground){
      const floor=rainSurface(camera+drop.x,solids,water).y;
      if(drop.y>=floor)continue;
      length=Math.min(length,floor-drop.y);
      const endFloor=rainSurface(camera+drop.x+drop.dx*length/drop.dy,solids,water).y;
      length=Math.min(length,Math.max(0,endFloor-drop.y));
      if(length<=0)continue;
    }
    g.globalAlpha=opacity*drop.alpha;g.lineWidth=drop.width;
    g.beginPath();g.moveTo(camera+drop.x,drop.y);
    g.lineTo(camera+drop.x+drop.dx*length/drop.dy,drop.y+length);g.stroke();
  }
  g.globalAlpha=opacity;
  if(foreground){
    g.strokeStyle='#d0e9ed';g.lineWidth=.42;
    for(const splash of rainSplashes(camera,time,strength,solids,water)){
      g.save();g.globalAlpha*=splash.alpha;g.beginPath();
      if(splash.wet)g.ellipse(splash.x,splash.y+.35,.7+splash.age*3.6,.2+splash.age*.55,0,0,Math.PI);
      else{
        const spread=.45+splash.age*2.7,lift=Math.sin(splash.age*Math.PI)*(2.8+splash.size*1.3),bottom=Math.min(splash.y,splash.y-lift+.85);
        for(const side of [-1,1]){
          const x=splash.x+side*spread+splash.lean,xx=x+side*.55;
          if(rainSurface(x,solids,water).y<splash.y-.5||rainSurface(xx,solids,water).y<splash.y-.5)continue;
          g.moveTo(x,splash.y-lift);g.lineTo(xx,bottom);
        }
        g.moveTo(splash.x,splash.y);g.quadraticCurveTo(splash.x+splash.lean*.5,splash.y-lift*.9,splash.x+splash.lean,splash.y-lift*.75);
      }
      g.stroke();g.restore();
    }
  }
  g.restore();
}

export function windblownLeaves(camera,time,strength,{solids=[],water}={},foreground=false){
  if(strength<=.025)return [];
  const shift=camera*(foreground?1:.64),wind=jungleWind(time),leaves=[];
  for(let emitter=Math.floor((shift-24)/56);emitter<=Math.ceil((shift+1664)/56);emitter++){
    const root=emitter*56+18+noise(emitter*331)*15;
    const bank=foreground?solids.find(s=>s.g&&!s.gone&&!s.water&&root>=s.x+5&&root<=s.x+s.w-5):null;
    if(foreground&&!bank)continue;
    const rate=1/(.32+noise(emitter*173+19)*.3),offset=noise(emitter*59+7),slot=Math.floor(time*rate+offset);
    for(let ago=0;ago<14;ago++){
      const seed=emitter*7907+(slot-ago)*173+(foreground?527:31),born=(slot-ago-offset)/rate,age=time-born,life=2.8+noise(seed+11)*1.4;
      if(age<0||age>=life)continue;
      const activation=smooth((strength-(.1+noise(seed+73)*.35))/.3);
      if(activation<=.001)continue;
      const phase=noise(seed+23)*Math.PI*2,drag=(foreground?.8:.52)+noise(seed+41)*(foreground?.45:.38);
      const x=root-shift-(wind.travel-windTravel(born))*drag+Math.sin(age*3+phase)*.9;
      const originY=foreground?bank.y-28-noise(seed+47)*18:145+noise(seed+47)*24;
      const y=originY+age*(6+noise(seed+29)*9)-Math.sin(age/life*Math.PI)*(14+noise(seed+53)*28)+Math.sin(age*7+phase)*(2+wind.gust*4);
      if(x< -12||x>396||y<22||y>190||foreground&&y>=rainSurface(camera+x,solids,water).y-1)continue;
      const length=(foreground?2.4:1.7)+noise(seed+61)*(foreground?3.2:2.4),roll=age*8+phase;
      leaves.push({id:seed,x,y,length,width:length*(.22+noise(seed+67)*.18),kind:Math.floor(noise(seed+79)*3),
        angle:phase+age*(4+noise(seed+83)*7)*(noise(seed+89)>.5?1:-1)+Math.sin(age*3+phase)*.45,flip:.15+Math.abs(Math.cos(roll))*.85,curl:Math.sin(age*4+phase)*.55,back:Math.cos(roll)<0,
        alpha:smooth(age/.2)*smooth((life-age)/.45)*activation*(foreground?.9:.55),color:Math.floor(noise(seed+97)*4)});
    }
  }
  return leaves;
}

export function drawWindblownLeaves(g,camera,time,strength,options,foreground=false){
  const colors=['#8fb943','#bdc455','#517927','#aa863f'],backs=['#517129','#7e8e3b','#35581e','#776039'];
  for(const leaf of windblownLeaves(camera,time,strength,options,foreground)){
    g.save();g.translate(camera+leaf.x,leaf.y);g.rotate(leaf.angle);g.scale(1,leaf.flip);g.globalAlpha*=leaf.alpha;
    const half=leaf.length/2,width=leaf.width*(leaf.kind===1?.6:1);
    g.fillStyle=(leaf.back?backs:colors)[leaf.color];g.beginPath();g.moveTo(-half,0);
    g.quadraticCurveTo(-half*.15,-width*(1+leaf.curl),half,leaf.curl*width*.45);g.quadraticCurveTo(half*.1,width*(.75-leaf.curl*.3),-half,0);g.fill();
    if(foreground){g.strokeStyle=leaf.back?'#91a259':'#d2d789';g.lineWidth=.16;g.beginPath();g.moveTo(-half*.65,0);g.quadraticCurveTo(0,leaf.curl*width*.4,half*.7,leaf.curl*width*.3);g.stroke();}
    g.restore();
  }
}
