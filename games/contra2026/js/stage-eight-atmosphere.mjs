const TAU=Math.PI*2,mod=(n,d)=>((n%d)+d)%d;

export const HIVE_MOTION_ASSETS=Object.freeze({
  intestineMotion:'/games/contra2026/assets/stage7/alien-tissue-slab-motion-v3.webp',
  cystMotion:'/games/contra2026/assets/stage7/alien-cyst-motion-v2.webp'
});

export const HIVE_TISSUE_ART=Object.freeze({
  frames:Object.freeze([106,388,669,950].flatMap(y=>[6,633].map(x=>Object.freeze([x,y,616,213]))))
});

export function hiveSlabHeight(s){return s.g?s.h:Math.max(s.h,Math.min(24,Math.max(20,s.w*.25)));}

/** Registered anatomical poses; no source-coordinate or whole-scene deformation. */
export function hiveMotionPose(time,phase=0,kind='gut'){
  const count=kind==='gut'?8:4,rate=kind==='gut'?2.4:1.25,u=mod(time*rate+phase,count);
  return {frame:Math.floor(u),next:(Math.floor(u)+1)%count,mix:Math.max(0,(u%1-.7)/.3)};
}

function motionCell(image,kind,index){
  if(kind==='gut')return HIVE_TISSUE_ART.frames[index];
  const w=image.naturalWidth/2,h=image.naturalHeight/2;
  return [index%2*w,Math.floor(index/2)*h,w,h];
}

/** Each pose shares one destination and anchor. Only the individual organ changes. */
function motionSprite(art,key,kind,time,phase,x,y,w,h){
  if(!art.loaded.has(key))return false;
  const g=art.g,image=art.images[key],pose=hiveMotionPose(time,phase,kind);
  const draw=index=>g.drawImage(image,...motionCell(image,kind,index),x,y,w,h);
  draw(pose.frame);
  if(pose.mix>0){g.save();g.globalAlpha*=pose.mix;draw(pose.next);g.restore();}
  return true;
}

function slabOutline(g,s,h){
  g.beginPath();
  if(s.g){g.rect(s.x,s.y,s.w,h);return;}
  g.moveTo(s.x,s.y);g.lineTo(s.x+s.w,s.y);g.lineTo(s.x+s.w,s.y+h-6);
  g.quadraticCurveTo(s.x+s.w-1,s.y+h,s.x+s.w-7,s.y+h);g.lineTo(s.x+7,s.y+h);
  g.quadraticCurveTo(s.x+1,s.y+h,s.x,s.y+h-6);g.closePath();
}

/** Complete opaque tissue, with moving inner folds enclosed by a fixed fascia. */
export function drawHiveSlab(art,s,left,right,time){
  const g=art.g,h=hiveSlabHeight(s),[,,sw,sh]=HIVE_TISSUE_ART.frames[0],width=h*sw/sh,overlap=h*.16,stride=width-overlap;
  if(!s.g){
    const shade=g.createLinearGradient(0,s.y+h-1,0,s.y+h+5);shade.addColorStop(0,'rgba(5,2,7,.55)');shade.addColorStop(1,'rgba(5,2,7,0)');
    art.rect(left+2,s.y+h-1,Math.max(0,right-left-4),6,shade);
  }
  g.save();slabOutline(g,s,h);g.clip();
  art.rect(left,s.y,right-left,h,'#35151c');
  // Full-depth backing fills every pore and edge of the animated tissue.
  if(art.loaded.has('terrain')){
    const image=art.images.terrain,baseWidth=h*image.naturalWidth/image.naturalHeight;
    g.save();g.translate(0,s.y);art.textureSpan(g,image,left,right,baseWidth,h,Math.min(8,baseWidth*.1));g.restore();
  }
  if(art.loaded.has('intestineMotion'))for(let i=Math.floor(left/stride)-1;i<=Math.ceil(right/stride);i++){
    const x=i*stride;if(x+width<left||x>right)continue;
    const draw=()=>motionSprite(art,'intestineMotion','gut',time,i*.83,x,s.y,width,h);
    g.save();g.beginPath();g.rect(x+overlap,s.y,width-overlap,h);g.clip();draw();g.restore();
    // Feather only the neighboring tile join, never the vertical rim/organ bond.
    for(let j=0;j<8;j++){
      g.save();g.beginPath();g.rect(x+j*overlap/8,s.y,overlap/8,h);g.clip();g.globalAlpha*=(j+.5)/8;draw();g.restore();
    }
  }
  if(!s.g){
    const underside=g.createLinearGradient(0,s.y+h*.65,0,s.y+h);underside.addColorStop(0,'rgba(19,5,16,0)');underside.addColorStop(1,'rgba(15,4,12,.55)');
    art.rect(left,s.y+h*.65,right-left,h*.35,underside);
    for(const [edge,dir]of [[s.x,1],[s.x+s.w,-1]]){
      g.beginPath();g.moveTo(edge+dir*.7,s.y+1.2);g.bezierCurveTo(edge+dir*.4,s.y+h*.4,edge+dir*.3,s.y+h-4,edge+dir*6,s.y+h-2);
      g.strokeStyle='#310f20';g.lineWidth=3.1;g.stroke();g.strokeStyle='#8a324b';g.lineWidth=1.35;g.stroke();
      g.strokeStyle='rgba(229,129,145,.4)';g.lineWidth=.4;g.stroke();
    }
  }
  g.restore();
}

const CAVERN_GLOWS=Object.freeze([
  {u:.073,v:.18,rx:.026,ry:.085},{u:.208,v:.075,rx:.03,ry:.05},
  {u:.265,v:.24,rx:.023,ry:.065},{u:.349,v:.44,rx:.032,ry:.11},
  {u:.435,v:.42,rx:.029,ry:.085},{u:.545,v:.3,rx:.025,ry:.07},
  {u:.63,v:.44,rx:.035,ry:.12},{u:.725,v:.075,rx:.025,ry:.055},
  {u:.865,v:.42,rx:.028,ry:.105},{u:.965,v:.46,rx:.025,ry:.065}
].map(Object.freeze));

function ovalGlow(g,x,y,rx,ry,color){
  g.save();g.translate(x,y);g.scale(rx,ry);
  const glow=g.createRadialGradient(0,0,0,0,0,1);glow.addColorStop(0,color);glow.addColorStop(1,'rgba(116,30,99,0)');
  g.fillStyle=glow;g.beginPath();g.arc(0,0,1,0,TAU);g.fill();g.restore();
}

/** Cavern pixels stay rigid. Attached organs, root tips and spores move independently. */
export function drawHiveAtmosphere(art,camera,time,width,overlap){
  const g=art.g,shift=camera*.2,stride=width-overlap;
  g.save();g.translate(-shift,0);
  for(let tile=Math.floor((shift-width)/stride);tile<=Math.ceil((shift+384)/stride);tile++){
    const origin=tile*stride;
    for(const [i,p]of CAVERN_GLOWS.entries()){
      const x=origin+p.u*width;if(x<shift-40||x>shift+424)continue;
      const beat=Math.pow(.5+.5*Math.sin(time*1.8-i*.85),3);
      ovalGlow(g,x,p.v*216,p.rx*width,p.ry*216,`rgba(238,67,145,${.04+beat*.19})`);
    }
    for(const [i,u]of [.095,.39,.69,.9].entries()){
      const x=origin+u*width;if(x<shift-12||x>shift+396)continue;
      const root=13+i%2*8,length=23+i*6,sway=Math.sin(time*.85+i*2)*2.1;
      g.beginPath();g.moveTo(x,root);g.bezierCurveTo(x-1,root+length*.3,x+sway*1.5,root+length*.75,x+sway,root+length);
      g.strokeStyle='rgba(8,4,15,.8)';g.lineWidth=1.5;g.lineCap='round';g.stroke();g.strokeStyle='rgba(134,54,114,.28)';g.lineWidth=.45;g.stroke();
    }
    for(const [i,u]of [.23,.6,.89].entries()){
      const x=origin+u*width;if(x<shift-40||x>shift+424)continue;
      const size=i%2?51:42,y=12+(i%2)*17;
      g.save();g.globalAlpha=.65;
      art.line(x-.8,0,x,y+2,'#25101f',1.8);art.line(x-.9,0,x-.2,y+1,'rgba(154,64,109,.35)',.45);
      motionSprite(art,'cystMotion','cyst',time,tile*.83+i*1.2,x-size/2,y,size,size);
      g.restore();
    }
  }
  g.restore();
  // Slow near/far spore layers read as atmosphere rather than enemy fire.
  for(let i=0;i<22;i++){
    const phase=mod(time*(.033+i%4*.006)+i*.173,1),depth=i%2?.31:.12;
    const x=mod(i*79-camera*depth+Math.sin(time*.28+i)*3,414)-15,y=173-phase*141;
    g.save();g.globalAlpha=Math.sin(phase*Math.PI)*(.16+(i%3)*.055);
    art.disc(x,y,.25+(i%3)*.13,i%3?'#a67fba':'#8da2ed');g.restore();
  }
}

export function drawHiveSurfacePulse(art,s,left,right,time){
  const g=art.g,height=s.g?s.h:Math.max(12,s.h),depth=Math.min(s.h,8);
  g.save();g.beginPath();g.rect(left,s.y,right-left,depth);g.clip();
  for(let x=Math.floor(left/62)*62+31;x<right+31;x+=62){
    const beat=Math.pow(.5+.5*Math.sin(time*2.1-x*.055),3);
    ovalGlow(g,x,s.y+height*.16,15,Math.max(2,height*.17),`rgba(255,126,157,${beat*.11})`);
  }
  g.restore();
}
