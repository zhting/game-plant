import { staffGeometry } from './wukong-combat.mjs';
import { actorRootY } from './wukong-mount.mjs';

export function idleMotion(p,time=p.statusTime??0){
  const active=!p.staff&&!p.dead&&!p.prone&&!p.spin&&!p.dive&&!p.enteringExit&&!p.exitEntered&&
    Math.abs(p.vx||0)<.5&&(p.onGround||p.ride==='heli'||p.restingOnCloud);
  if(!active)return {active:false,bob:0,sway:0,lean:0,stretch:1};
  const phase=time*Math.PI*2/2.8,breath=Math.sin(phase);
  const bob=-.45*(1-Math.cos(phase)),sway=.35*breath;
  return {active:true,bob,sway,lean:.025*breath,stretch:1+.017*breath};
}

// Visual idle movement is shared by the hands and staff; combat and player position stay unchanged.
export function visualStaffGeometry(p,time=p.statusTime??0){
  if(p.heroFrames)return staffGeometry(p);
  const q=staffGeometry(p),m=idleMotion(p,time);if(!m.active)return q;
  const size=(p.giantT>0?2:1)*(p.magicScale||1);
  const transform=(x,y)=>({x:m.sway+x*Math.cos(m.lean)-(y+14)*m.stretch*Math.sin(m.lean),
    y:-14+x*Math.sin(m.lean)+(y+14)*m.stretch*Math.cos(m.lean)+m.bob});
  const rootY=actorRootY(p),grip=transform((q.origin.x-p.x)/q.face/size,(q.origin.y-rootY)/size),angle=q.angle+m.lean;
  const origin={x:p.x+grip.x*q.face*size,y:rootY+grip.y*size},dx=Math.cos(angle)*q.face,dy=Math.sin(angle);
  return {...q,origin,angle,tip:{x:origin.x+dx*q.reach,y:origin.y+dy*q.reach},
    butt:{x:origin.x-dx*q.rear,y:origin.y-dy*q.rear}};
}
