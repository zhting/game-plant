import { advanceGuard } from './wukong-guards.mjs';

export const HEAVEN_HP=Object.freeze({run:6,snp:8,fly:6,tur:10});
export function flyingGuard(x,y=82){return {t:'fly',x,y,homeX:x,homeY:y,flightClock:0,vx:0,face:-1,ax:-1,ay:0,hp:HEAVEN_HP.fly,maxHp:HEAVEN_HP.fly,flash:0,anim:0};}
const approach=(from,to,speed)=>from+Math.max(-speed,Math.min(speed,to-from));
export function advanceFlyingGuard(e,target,solids,dt){
  e.flightClock+=dt;
  let x=e.x,y;
  if(target){
    const dx=target.x-e.x;e.face=e.melee?.face||(dx<0?-1:1);
    if(!e.melee&&Math.abs(dx)>33)x=approach(e.x,target.x-e.face*30,70*dt);
    y=target.y-10;
  }else{
    x=approach(e.x,e.homeX+Math.sin(e.flightClock*.9)*42,40*dt);
    y=e.homeY+Math.sin(e.flightClock*2)*8;
  }
  let ceiling=178;
  for(const s of solids)if(!s.gone&&!s.water&&x+6>s.x&&x-6<s.x+s.w)ceiling=Math.min(ceiling,s.y-6);
  y=Math.max(42,Math.min(y,ceiling));
  // Rise before crossing into a higher terrace instead of flying through its wall.
  if(e.y>ceiling+1)x=e.x;
  const old=e.x;e.x=x;e.y=approach(e.y,y,64*dt);e.vx=(e.x-old)/dt;e.anim+=dt*6;
  advanceGuard(e,target,dt,{active:true});
}
