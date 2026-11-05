import { COLOSSUS, GIANT_FINALE, giantFinalePose, colossusFootPose } from './wukong-giant-phases.mjs';
import { drawWholeGiant } from './wukong-giant-sprites.mjs';
import { HERO_ATLASES } from './wukong-hero-atlas.mjs';
import { prepareHeroAtlas } from './wukong-hero-sprites.mjs';
import { ENCOUNTER_FRAMES } from './wukong-encounter-art.mjs';

export const COLOSSUS_ASSET='/games/wukong/assets/giant-colossus-atlas.webp';
export const IMPACT_CRATER_ASSET='/games/wukong/assets/jade-impact-crater-v2.webp';
const CRATER_CROP=Object.freeze([8,258,2163,386]);
const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
const FONT='"Microsoft YaHei","PingFang SC",sans-serif';
const BOOTS=[{bounds:[0,0,724,543],anchor:[338,523]},
  {bounds:[724,0,724,543],anchor:[1090,528]},{bounds:[0,543,724,543],anchor:[343,1058]}];
function label(g,text,x,y,size=9,color='#fff2cb'){
  g.save();g.font=`700 ${size}px ${FONT}`;g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
  g.lineWidth=2.5;g.strokeStyle='rgba(29,47,56,.8)';g.strokeText(text,x,y);g.fillStyle=color;g.fillText(text,x,y);g.restore();
}
function boot(art,index,x,y,scale=.45){
  const image=art.images.giantColossus;if(!image?.naturalWidth)return;
  const f=BOOTS[index],g=art.g,rx=image.naturalWidth/1448,ry=image.naturalHeight/1086;
  g.drawImage(image,...f.bounds.map((v,i)=>v*(i%2?ry:rx)),x+(f.bounds[0]-f.anchor[0])*scale,
    y+(f.bounds[1]-f.anchor[1])*scale,f.bounds[2]*scale,f.bounds[3]*scale);
}
function quake(art,state,attack){
  const g=art.g,elapsed=attack.t-attack.windup;if(elapsed<0||elapsed>.55)return;
  const u=elapsed/.55;g.save();g.globalAlpha*=1-u;
  g.strokeStyle='#fff6c2';g.shadowColor='#ffc354';g.shadowBlur=8;g.lineWidth=2.4*(1-u)+.4;
  g.beginPath();g.moveTo(state.arena.left,175);g.lineTo(state.arena.right,175);g.stroke();
  for(let i=0;i<23;i++){
    const x=state.arena.left+i*state.arena.width/22,height=(8+Math.sin(i*7)**2*13)*Math.sin(Math.PI*u);
    g.beginPath();g.moveTo(x-4,177);g.lineTo(x,177-height);g.lineTo(x+3,176);g.stroke();
  }g.restore();
}
export function drawColossusScars(art,boss){
  const g=art.g,image=art.images.jadeCrater;
  if(!image?.naturalWidth)return;
  const rx=image.naturalWidth/2172,ry=image.naturalHeight/724;
  for(const s of boss?.encounter?.scars||[]){
    // The low-angle painting contains inward walls, a rubble floor and soft
    // ash edges. Keep its lighting fixed; mirrored decals reverse sunlight.
    const width=(s.r+9)*2,height=width*CRATER_CROP[3]/CRATER_CROP[2]*(1+Math.max(0,s.depth-1)*.045);
    g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    g.drawImage(image,...CRATER_CROP.map((v,i)=>v*(i%2?ry:rx)),s.x-width/2,s.y-4.5,width,height);
    g.restore();
  }
}
function spaceRift(art,a){
  const age=a.t-a.windup;if(age<0||age>.64)return;
  const g=art.g,u=clamp(age/COLOSSUS.axeCut),fade=1-smooth((age-.16)/.48),x0=a.danger.x+a.danger.w*.91,x1=a.danger.x+a.danger.w*.08;
  g.save();g.globalAlpha*=fade;g.lineJoin='miter';
  const points=Array.from({length:18},(_,i)=>{const t=i/17;return {x:x0+(x1-x0)*t+Math.sin(i*2.7)*4,y:-18+211*t};});
  const path=offset=>{g.beginPath();for(let i=0;i<Math.max(2,Math.ceil(points.length*u));i++){const p=points[i];if(i)g.lineTo(p.x+offset,p.y);else g.moveTo(p.x+offset,p.y);}g.stroke();};
  const visible=points.slice(0,Math.max(2,Math.ceil(points.length*u))),half=5*fade+1;
  g.shadowColor='#a6b6ff';g.shadowBlur=10;g.fillStyle='#090d21';g.beginPath();
  visible.forEach((p,i)=>{const x=p.x-half*(.5+Math.sin(i*1.9)**2);if(i)g.lineTo(x,p.y);else g.moveTo(x,p.y);});
  for(let i=visible.length-1;i>=0;i--)g.lineTo(visible[i].x+half*(.5+Math.cos(i*2.3)**2),visible[i].y);g.closePath();g.fill();
  g.shadowBlur=4;g.lineWidth=.8;g.strokeStyle='#c6faff';path(-half);g.strokeStyle='#b59bff';path(half);
  g.shadowBlur=0;g.strokeStyle='#f4fbff';g.lineWidth=.5;g.globalAlpha*=Math.max(.1,1-age*4);path(0);g.globalAlpha=fade;
  for(let i=3;i<visible.length;i+=3){const p=visible[i],side=i%2?-1:1;g.strokeStyle='#c8d1ff';g.lineWidth=.55;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x+side*12,p.y-4);g.lineTo(p.x+side*17,p.y-13);g.stroke();}
  for(let i=2;i<14;i+=2){const p=points[i],off=(1-fade)*21;
    g.fillStyle=i%4?'#d9f5ff':'#9eabf4';g.globalAlpha=fade*.65;g.beginPath();g.moveTo(p.x+8+off,p.y-8);g.lineTo(p.x+17+off,p.y-2);g.lineTo(p.x+9+off,p.y+6);g.closePath();g.fill();
    g.globalAlpha=fade*.32;g.fillStyle='#122035';g.fillRect(p.x-21-off,p.y+1,13,2);
  }g.restore();
}
export function drawStompWarning(art,a){
  if(a.t>=a.windup)return;
  const g=art.g,x=a.aimX,y=COLOSSUS.floor-2,r=COLOSSUS.dropRadius,u=clamp(a.t/a.windup),urgent=smooth((u-.7)/.3),flatten=.075;
  const pulse=.5+.5*Math.sin(a.t*(7+urgent*9)),color=a.locked?'#ff7655':'#f6c77e';
  g.save();
  // Flatten the soft fill into the ground plane; the outer boundary stays at
  // the actual crush radius while the inner ring counts down to impact.
  g.save();g.translate(x,y);g.scale(1,flatten);
  const fill=g.createRadialGradient(0,0,0,0,0,r+4);
  fill.addColorStop(0,'rgba(255,148,69,.02)');fill.addColorStop(.7,`rgba(182,48,26,${.06+urgent*.08})`);
  fill.addColorStop(.92,`rgba(255,91,51,${.13+urgent*.12})`);fill.addColorStop(1,'rgba(255,98,48,0)');
  g.fillStyle=fill;g.beginPath();g.arc(0,0,r+4,0,Math.PI*2);g.fill();g.restore();
  g.lineWidth=1+urgent*.65;g.strokeStyle=color;g.shadowColor=color;g.shadowBlur=3+urgent*4;
  g.globalAlpha*=.82+urgent*.18;g.beginPath();g.ellipse(x,y,r,r*flatten,0,0,Math.PI*2);g.stroke();
  g.shadowBlur=0;g.globalAlpha*=.55;g.lineWidth=.65;g.beginPath();g.ellipse(x,y,r-4,(r-4)*flatten,0,0,Math.PI*2);g.stroke();
  const remaining=Math.max(.02,1-u),countdown=r*remaining;
  g.globalAlpha=.55+urgent*.35;g.strokeStyle='#ffe5ae';g.lineWidth=.8+urgent*.5;
  g.beginPath();g.ellipse(x,y,countdown,countdown*flatten,0,0,Math.PI*2);g.stroke();
  g.strokeStyle=color;g.lineWidth=1;g.globalAlpha=.7+urgent*.25;
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6,cos=Math.cos(angle),sin=Math.sin(angle),inner=r-(i%3?3:7);
    g.beginPath();g.moveTo(x+cos*inner,y+sin*inner*flatten);g.lineTo(x+cos*(r+2),y+sin*(r+2)*flatten);g.stroke();
  }
  // The lock pulse expands once, then settles into the stable danger outline.
  const lockAge=a.t-COLOSSUS.aimTrack;
  if(a.locked&&lockAge<.24){const k=clamp(lockAge/.24);g.globalAlpha=.45*(1-k);g.lineWidth=1.1;g.beginPath();g.ellipse(x,y,r*(1+k*.15),r*flatten*(1+k*.15),0,0,Math.PI*2);g.stroke();}
  g.globalAlpha=.65+urgent*pulse*.35;g.fillStyle=urgent>.7?'#fff2ce':color;
  g.beginPath();g.moveTo(x,y-3);g.lineTo(x+3,y);g.lineTo(x,y+3);g.lineTo(x-3,y);g.closePath();g.fill();
  g.restore();
  const view=art.state?.boss?.encounter?.arena,labelX=view?Math.max(view.left+43,Math.min(x,view.right-43)):x;
  label(g,a.locked?'落点锁定':'追踪落点',labelX,128,6.2,a.locked?'#ffb797':'#ffe1a0');
}
export function drawColossus(art,boss){
  const g=art.g,giant=boss.giant,state=boss.encounter,a=giant.attack,view=state.arena;
  g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  if(state.growth>0){
    const u=smooth(1-state.growth/COLOSSUS.growth);
    g.save();g.globalAlpha*=1-smooth(u*1.4);g.translate(giant.x,176);g.scale(1+u*3,1+u*3);g.translate(-state.from.x,-176);drawWholeGiant(art,state.from);g.restore();
    label(g,'第二阶段 · 巨灵显圣',view.left+view.width/2,60,13);g.restore();return;
  }
  if(a?.kind==='skyAxe'){
    const wind=a.t<a.windup,u=clamp(a.t/a.windup),pulse=.55+.2*Math.sin(a.t*12);
    g.save();g.globalAlpha*=wind?pulse*.28:.22;
    const danger=g.createLinearGradient(0,60,0,176);danger.addColorStop(0,'rgba(148,47,30,0)');danger.addColorStop(1,'#c85535');
    g.fillStyle=danger;g.fillRect(a.danger.x,55,a.danger.w,121);
    g.restore();
    if(wind){
      g.save();g.strokeStyle=a.locked?'#ffb28a':'#f2d2a1';g.lineWidth=.8;g.globalAlpha*=.45+.2*u;
      g.beginPath();g.moveTo(a.danger.x+a.danger.w*.91,-18);g.lineTo(a.danger.x+a.danger.w*.08,193);g.stroke();g.restore();
      label(g,a.locked?'斧路已锁 · 移开':'裂空巨斧追踪',Math.max(view.left+48,Math.min(a.aimX,view.right-48)),150,6.5,'#ffd5ad');
    }
    const image=art.images.giantColossus;if(image?.naturalWidth){
      // The painted shaft runs down-left from the axe head in the atlas.
      // Turn that vector up-right: the blade leads the fall, not the handle.
      // Complete the downward cut at the host's impact time, then pull it up.
      const drop=smooth((a.t-a.windup)/COLOSSUS.axeCut),retract=smooth((a.t-a.windup-a.strike)/.38),size=360;
      g.save();g.translate(a.aimX,-130+drop*270-retract*280);g.rotate(2.05+drop*.5-retract*.18);
      g.globalAlpha*=wind?.6+.4*u:1-retract*.88;
      g.drawImage(image,image.naturalWidth/2,image.naturalHeight/2,image.naturalWidth/2,image.naturalHeight/2,-size*.8,-size*.75*.4,size,size*.75);g.restore();
    }
    spaceRift(art,a);
  }
  if(a?.kind==='skyStomp'){
    const foot=colossusFootPose(giant);
    if(foot.visible){g.save();if(boss.parts[2].flash>0)g.filter='brightness(1.4)';g.translate(foot.x,foot.y);g.scale(-1,1);boot(art,foot.index,0,0,.43);g.restore();}
    if(a.impacted&&a.t<a.windup+.55){const u=(a.t-a.windup)/.55;g.save();g.globalAlpha*=1-u;
      for(let i=0;i<18;i++){const dir=i%2?1:-1,x=a.aimX+dir*(12+u*(24+i*4)),dy=Math.sin(i*11)*5-Math.sin(u*Math.PI)*(12+i%5*5);
        g.fillStyle=i%3?'#706354':'#d4c8a3';g.beginPath();g.ellipse(x,176+dy,3+u*8,2+u*5,0,0,Math.PI*2);g.fill();}
      g.restore();}
    quake(art,state,a);
  }
  g.restore();
}
function paintedHero(art,pose,targetX){
  const sheet=HERO_ATLASES[pose.sheet],count=pose.sheet==='movement'?8:Math.min(8,sheet.frames.length);
  const f=sheet.frames[Math.min(count-1,Math.floor(clamp(pose.u)*count))];
  const sprite=prepareHeroAtlas(art,sheet.key)?.frames.get(f.id);if(!sprite)return;
  const g=art.g;g.save();g.translate(targetX,pose.y);g.scale(pose.scale,pose.scale);
  g.drawImage(sprite.canvas,sprite.x,sprite.y,sprite.w,sprite.h);g.restore();
}
export function drawGiantFinale(art,boss){
  const g=art.g,state=boss.encounter,view=state.arena,q=giantFinalePose(state.time),left=view.left;
  g.save();g.fillStyle='rgba(29,47,58,.13)';g.fillRect(left,0,view.width,216);
  if(state.time<1.65){
    const u=smooth(state.time/1.5),x=left+q.hero.x;
    const halo=g.createRadialGradient(x,140,5,x,140,35+u*110);halo.addColorStop(0,'rgba(255,236,159,.55)');halo.addColorStop(1,'rgba(255,232,152,0)');
    g.fillStyle=halo;g.fillRect(x-150,-20,300,220);
    g.strokeStyle='#f5d38a';g.lineWidth=1;g.beginPath();g.ellipse(x,174,20+u*52,4+u*5,0,0,Math.PI*2);g.stroke();
  }
  const bossX=left+q.giant.x,recoil=state.time<7.05?Math.sin(Math.max(0,state.time-2.75)*17)*2:0;
  g.save();g.translate(bossX+recoil,176);g.scale(q.giant.scale,q.giant.scale);
  if(q.giant.fall<1){g.save();g.globalAlpha*=1-q.giant.fall;g.rotate(q.giant.fall*.35);
    const lastImpact=GIANT_FINALE.impacts.filter(at=>at<=state.time).at(-1),age=lastImpact===undefined?Infinity:state.time-lastImpact;
    drawWholeGiant(art,{x:0,y:0,face:-1,clock:state.time,vx:0,walkBlend:0,onGround:true,
      ...(age<.38?{hurt:{t:age,duration:.38}}:{})});g.restore();}
  const image=art.images.heavenEncounters;
  if(q.giant.fall>0&&image?.naturalWidth){g.globalAlpha*=q.giant.fall;
    g.drawImage(image,...ENCOUNTER_FRAMES.fallen,-1025*.14/2,5-(944-582)*.14,1025*.14,430*.14);}
  g.restore();
  const savedX=state.saved?.[0]?.x??left+q.hero.x,heroX=left+q.hero.x+(savedX-left-q.hero.x)*q.end;
  paintedHero(art,q.hero,heroX);
  for(let i=0;i<GIANT_FINALE.impacts.length;i++){
    const age=state.time-GIANT_FINALE.impacts[i];if(age<0||age>.36)continue;
    const u=age/.36,x=bossX-26,y=i>=4?155:91+(i%2)*27;
    g.save();g.globalAlpha*=1-u;g.shadowBlur=7;g.shadowColor='#ffcf67';g.strokeStyle='#fff8d6';g.lineWidth=i>=4?3:1.8;
    g.beginPath();g.ellipse(x,y,12+u*55,5+u*18,-.45,0,Math.PI*2);g.stroke();
    for(let n=0;n<10;n++){const a=n*Math.PI/5;g.beginPath();g.moveTo(x+Math.cos(a)*9,y+Math.sin(a)*9);g.lineTo(x+Math.cos(a)*(23+u*39),y+Math.sin(a)*(23+u*39));g.stroke();}
    g.restore();
  }
  g.fillStyle='rgba(15,33,42,.85)';g.fillRect(left,0,view.width,24);g.fillRect(left,191,view.width,25);
  label(g,'终章 · 法天象地',left+view.width/2,12,10);
  label(g,q.caption,left+view.width/2,202,12);
  g.restore();
}
