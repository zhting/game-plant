import {staffSequenceBeat} from './wukong-staff-sequences.mjs';

const clamp=n=>Math.max(0,Math.min(1,n));
export function staffVfxFamily(name=''){
  if(['thrust','airThrust','doubleTap'].includes(name))return 'thrust';
  if(['lift','airLift','uppercut','risingSpin'].includes(name))return 'lift';
  if(['low','lowSweep'].includes(name))return 'low';
  if(['wheel','skyWheel','cloud','whirlwind'].includes(name))return 'wheel';
  if(['flower','lotusChain','doubleFlower','figureEight','backFlower','carryFlower','dragonCoil','phoenixFling','backhandOrbit','heavenToss','thunderWheel'].includes(name))return 'flower';
  return 'sweep';
}
export function staffVfxState(p){
  const a=p.staff;
  if(!a||p.dead||p.dive||p.enteringExit||p.exitEntered||a.kind==='ultimate'||a.kind==='qiCast'||p.staffCharge?.active)return null;
  const phase=clamp(a.t/a.duration),beat=staffSequenceBeat(a.variant,phase),u=beat?.phase??phase;
  const envelope=clamp((u-.09)/.12)*clamp((.97-u)/.2);
  if(!envelope)return null;
  const family=staffVfxFamily(beat?.form||a.command||a.variant||a.kind);
  const history=family==='thrust'?.10:family==='wheel'||family==='flower'?.18:.14;
  return {family,phase:u,alpha:envelope,history,heavy:!!beat?.heavy||a.combo===3,
    start:beat?Math.max(0,(phase-beat.phase*beat.weight)*a.duration):0};
}

function path(g,points,close=false){
  if(!points.length)return;
  g.beginPath();g.moveTo(points[0].x,points[0].y);
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];g.quadraticCurveTo(a.x,a.y,(a.x+b.x)/2,(a.y+b.y)/2);
  }
  const last=points[points.length-1];g.lineTo(last.x,last.y);if(close)g.closePath();
}
function sweptBand(art,history,end,state,size,colors){
  const g=art.g,points=[];
  for(const q of history){
    const last=points[points.length-1];
    if(!last||Math.hypot(q[end].x-last[end].x,q[end].y-last[end].y)>.15*size)points.push(q);
  }
  if(points.length<2)return;
  const arc=[];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],aa=Math.atan2(a[end].y-a.origin.y,a[end].x-a.origin.x),ba=Math.atan2(b[end].y-b.origin.y,b[end].x-b.origin.x);
    const delta=((ba-aa+Math.PI*3)%(Math.PI*2))-Math.PI;
    const ra=Math.hypot(a[end].x-a.origin.x,a[end].y-a.origin.y),rb=Math.hypot(b[end].x-b.origin.x,b[end].y-b.origin.y);
    const steps=Math.max(3,Math.min(12,Math.ceil(Math.abs(delta)/.17)));
    for(let step=i===1?0:1;step<=steps;step++){
      const u=step/steps,origin={x:a.origin.x+(b.origin.x-a.origin.x)*u,y:a.origin.y+(b.origin.y-a.origin.y)*u};
      const angle=aa+delta*u,r=ra+(rb-ra)*u;
      arc.push({origin,edge:{x:origin.x+Math.cos(angle)*r,y:origin.y+Math.sin(angle)*r}});
    }
  }
  const outer=arc.map(q=>q.edge);
  const travel=outer.slice(1).reduce((n,q,i)=>n+Math.hypot(q.x-outer[i].x,q.y-outer[i].y),0);
  if(travel<1.4*size)return;
  const inner=arc.map((q,i)=>{
    const e=q.edge,dx=e.x-q.origin.x,dy=e.y-q.origin.y,r=Math.hypot(dx,dy)||1;
    const width=Math.min(3.7*size,r*.065)*Math.sin(Math.PI*i/(arc.length-1));
    return {x:e.x-dx/r*width,y:e.y-dy/r*width};
  });
  g.save();g.lineCap='round';g.lineJoin='round';
  // A narrow amber silhouette remains readable over white clouds. The bright
  // edge gets its own local additive pass, rather than washing out the scene.
  path(g,[...outer,...inner.reverse()],true);g.globalAlpha=state.alpha*.18;g.fillStyle=colors.dark;g.fill();
  g.globalCompositeOperation='lighter';g.globalAlpha=state.alpha*(state.heavy?.28:.22);g.fillStyle=colors.gold;g.fill();
  const first=outer[0],last=outer[outer.length-1],tail=Math.hypot(last.x-first.x,last.y-first.y)>2?first:outer[Math.floor(outer.length/2)];
  const fade=g.createLinearGradient(tail.x,tail.y,last.x,last.y);
  fade.addColorStop(0,'rgba(255,227,155,0)');fade.addColorStop(.42,'rgba(238,187,86,.20)');fade.addColorStop(.82,colors.gold);fade.addColorStop(1,colors.white);
  path(g,outer);g.shadowColor=colors.gold;g.shadowBlur=1.8*(art.scale||1);g.strokeStyle=fade;g.lineWidth=1.05*size;g.globalAlpha=state.alpha*.45;g.stroke();
  g.shadowBlur=0;g.lineWidth=.37*size;g.globalAlpha=state.alpha*.8;g.stroke();g.restore();
}

// Sample only the real painted staff trajectory, with no particle entities,
// world writes or random numbers. Tips and butt ends share collision geometry.
export function drawStaffTechnique(art,p,geometry){
  if(p.summonKind)return true;
  const state=staffVfxState(p);if(!state)return true;
  const a=p.staff,g=art.g,size=(p.giantT>0?2:1)*(p.magicScale||1),q=geometry(p);
  const colors=(a.weapon||p.weapon)==='fire'?{gold:'#ffc06a',white:'#fff6d9',dark:'#ac572c'}:{gold:'#f2c76c',white:'#fffbe6',dark:'#9e793b'};
  const history=Array.from({length:12},(_,i)=>{
    const t=Math.max(state.start,a.t-state.history*(11-i)/11),line=geometry(p,t),elapsed=a.t-t;
    const shift={x:-(p.vx||0)*elapsed,y:p.onGround?0:-(p.vy||0)*elapsed};
    return {...line,origin:{x:line.origin.x+shift.x,y:line.origin.y+shift.y},
      tip:{x:line.tip.x+shift.x,y:line.tip.y+shift.y},butt:{x:line.butt.x+shift.x,y:line.butt.y+shift.y}};
  });
  if(state.family!=='low'&&(state.family!=='thrust'||state.phase>.24&&state.phase<.78))sweptBand(art,history,'tip',state,size,colors);
  if(state.family==='wheel'||state.family==='flower'||state.family==='sweep')sweptBand(art,history,'butt',state,size,colors);
  g.save();g.lineCap='round';g.lineJoin='round';
  if(state.family==='thrust'){
    const dx=q.tip.x-q.origin.x,dy=q.tip.y-q.origin.y,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length;
    const power=Math.sin(Math.PI*clamp((state.phase-.16)/.65));
    for(const offset of [-1,1]){
      g.beginPath();g.moveTo(q.tip.x-dx*.40+nx*offset*size,q.tip.y-dy*.40+ny*offset*size);g.lineTo(q.tip.x,q.tip.y);
      g.strokeStyle=colors.dark;g.lineWidth=1.1*size;g.globalAlpha=state.alpha*power*.5;g.stroke();
      g.globalCompositeOperation='lighter';g.strokeStyle=colors.white;g.lineWidth=.38*size;g.globalAlpha=state.alpha*power*.85;g.stroke();g.globalCompositeOperation='source-over';
    }
  }else if(state.family==='wheel'&&q.origin.y<p.y-23*size){
    // A side-view projection of the real overhead staff plane, rather than a
    // top-down circle transplanted onto the platform game.
    const cx=(q.tip.x+q.butt.x)/2,cy=q.origin.y,rx=(q.reach+q.rear)*.48;
    const ry=Math.max(4*size,Math.min(10*size,Math.abs(q.tip.y-q.butt.y)*.5+2*size));
    const angle=state.phase*Math.PI*4;
    g.beginPath();g.ellipse(cx,cy,rx,ry,0,angle-Math.PI*1.3,angle);
    g.strokeStyle=colors.dark;g.lineWidth=1.25*size;g.globalAlpha=state.alpha*.48;g.stroke();
    g.globalCompositeOperation='lighter';g.shadowColor=colors.gold;g.shadowBlur=2.5*(art.scale||1);
    g.strokeStyle=colors.gold;g.lineWidth=.85*size;g.globalAlpha=state.alpha*.75;g.stroke();
    g.shadowBlur=0;g.strokeStyle=colors.white;g.lineWidth=.32*size;g.globalAlpha=state.alpha*.94;g.stroke();
  }else if(state.family==='low'&&p.onGround&&!p.ride){
    // The ground-skimming crescent is flat; uppercuts never reuse this shape.
    const y=p.y-1.1*size,x=p.x+a.face*8*size,r=Math.min(40*size,q.reach*.85);
    const fade=state.alpha*Math.sin(Math.PI*state.phase);
    g.beginPath();g.ellipse(x,y,r,3.1*size,0,.08*Math.PI,.95*Math.PI);
    g.strokeStyle=colors.dark;g.lineWidth=1.3*size;g.globalAlpha=fade*.5;g.stroke();
    g.globalCompositeOperation='lighter';g.strokeStyle=colors.gold;g.lineWidth=.55*size;g.globalAlpha=fade*.8;g.stroke();
    for(let i=0;i<5;i++){
      const u=(state.phase*1.7+i*.19)%1,xx=x+a.face*(u-.5)*r*1.7,yy=y-(1-u)*(1+i%2)*2*size;
      g.globalAlpha=fade*(1-u)*.55;g.fillStyle=i%2?colors.gold:colors.white;g.fillRect(xx,yy,.55*size,(.5+u)*size);
    }
  }
  // Small moving glints emphasize the two flower/wheel ends without drawing
  // an unrelated circular damage area around the player.
  const glints=state.family==='flower'||state.family==='wheel'?['tip','butt']:['tip'];
  for(const end of glints){
    const e=q[end],r=(state.heavy?1.8:1.25)*size;
    g.globalCompositeOperation='lighter';g.shadowColor=colors.gold;g.shadowBlur=2.4*(art.scale||1);
    g.globalAlpha=state.alpha*.78;g.strokeStyle=colors.white;g.lineWidth=.35*size;
    g.beginPath();g.moveTo(e.x-r,e.y);g.lineTo(e.x+r,e.y);g.moveTo(e.x,e.y-r*1.5);g.lineTo(e.x,e.y+r*1.5);g.stroke();
  }
  g.restore();return true;
}
