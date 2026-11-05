// The host owns form timers, attacks and hit references. Rendering only samples.
export const TRANSFORM_DURATION=18;
export const TRANSFORM_FORMS=Object.freeze({
  peng:Object.freeze({name:'金翅鹏',skill:'掠空飞袭',speed:135,damage:5,duration:.54,cooldown:.22,reach:54,height:42,color:'#f8d277'}),
  tiger:Object.freeze({name:'白虎',skill:'扑杀破阵',speed:126,damage:7,duration:.50,cooldown:.28,reach:57,height:33,color:'#e4f6f5'}),
  tortoise:Object.freeze({name:'玄龟',skill:'镇岳反震',speed:60,damage:8,duration:.72,cooldown:.34,reach:66,height:48,color:'#9ce8db'})
});
export const transformation=p=>p.magic?.transform;
export function beginTransformation(p){
  if(p.dead||p.dive||p.enteringExit||p.exitEntered)return false;
  p.ride=null;p.rideT=0;p.staff=null;p.staffCharge=null;p.staffThrows=[];p.staffWaves=[];
  p.prone=p.spin=false;p.wantFire=false;delete p.staffIntent;
  (p.magic??={}).transform={remaining:TRANSFORM_DURATION,t:0,form:'peng',shift:.35,switchCooldown:.55,cool:.15,attack:null,guard:false};
  p.invT=Math.max(p.invT||0,.25);return true;
}
export function cycleTransformation(p){
  const state=transformation(p);if(!state||state.switchCooldown>0||p.dead||p.hurt)return false;
  const forms=Object.keys(TRANSFORM_FORMS);state.form=forms[(forms.indexOf(state.form)+1)%forms.length];
  state.attack=null;state.guard=false;state.shift=.28;state.cool=.20;state.switchCooldown=.6;p.prone=p.spin=false;
  return true;
}
export function advanceTransformation(p,input,dt){
  const state=transformation(p);if(!state)return null;
  if(p.dead||p.enteringExit||p.exitEntered){delete p.magic.transform;return null;}
  state.t+=dt;state.remaining=Math.max(0,state.remaining-dt);state.shift=Math.max(0,state.shift-dt);
  state.switchCooldown=Math.max(0,state.switchCooldown-dt);state.cool=Math.max(0,state.cool-dt);
  if(!state.remaining){delete p.magic.transform;p.staff=null;p.cool=0;return null;}
  const form=TRANSFORM_FORMS[state.form];state.guard=state.form==='tortoise'&&!!input.down&&!!p.onGround&&!state.attack;
  if(state.attack){state.attack.t+=dt;if(state.attack.t>=form.duration){state.attack=null;state.cool=form.cooldown;}}
  if(p.hurt){state.attack=null;state.cool=Math.max(state.cool,.15);return state;}
  if((input.fire||state.counter)&&!state.attack&&state.cool<=0&&state.shift<=0){
    state.attack={form:state.form,t:0,face:p.face||1,hits:[],counter:!!state.counter};state.counter=false;state.guard=false;
  }
  return state;
}
export function transformationSpeed(p,h){
  const state=transformation(p);if(!state)return null;
  if(state.form==='tiger'&&state.attack&&state.attack.t>.065&&state.attack.t<.23)return state.attack.face*236;
  return h*TRANSFORM_FORMS[state.form].speed*(state.guard?.25:1);
}
export function transformationShape(p){
  const state=transformation(p),a=state?.attack;if(!a)return null;
  const form=TRANSFORM_FORMS[state.form];if(a.t<.11||a.t>form.duration*.74)return null;
  const reach=form.reach,face=a.face;
  return state.form==='tortoise'?{x:p.x-reach,y:p.y-form.height,w:reach*2,h:form.height+6}
    :{x:face>0?p.x-12:p.x-reach,y:p.y-form.height,w:reach+12,h:form.height+6};
}
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function blocked(from,to,solids){
  return solids.some(s=>{
    if(!s.g||s.gone||s.water)return false;
    let lo=0,hi=1;
    for(const [v,d,min,max]of [[from.x,to.x-from.x,s.x,s.x+s.w],[from.y,to.y-from.y,s.y,s.y+s.h]]){
      if(Math.abs(d)<1e-8){if(v<=min||v>=max)return false;continue;}
      const a=(min-v)/d,b=(max-v)/d;lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(hi<lo)return false;
    }return lo<.99&&hi>0;
  });
}
export function resolveTransformation(p,world){
  const state=transformation(p),shape=transformationShape(p),a=state?.attack;
  if(!shape||p.dead||p.hurt||p.enteringExit||p.exitEntered)return;
  const form=TRANSFORM_FORMS[state.form],damage=form.damage*(a.counter?1.5:1),from={x:p.x,y:p.y-15};
  const shot={k:'staff',vx:a.face,vy:0,heavy:true,owner:p.pid||p.owner,form:'七十二变 · '+form.skill};
  const hit=(target,box,apply)=>{
    if(a.hits.includes(target)||!overlaps(shape,box))return;
    const to={x:box.x+box.w/2,y:Math.min(box.y+box.h-1,Math.max(box.y+1,from.y))};
    if(blocked(from,to,world.solids))return;
    a.hits.push(target);apply(to);
  };
  for(const e of world.enemies)if(!e.dead&&e.t!=='beam'&&!(e.t==='box'&&!e.open))hit(e,world.enemyBox(e),q=>world.damageEnemy(e,damage,q.x,q.y,shot));
  for(const part of world.parts)if(part.hp>0)hit(part,part.hitBox||part,q=>world.hitPart(part,damage,{...shot,...q}));
  for(const pod of world.pods||[])if(!pod.dead&&!pod.flee)hit(pod,world.podBox(pod),()=>world.popPod(pod));
  if(state.form==='tortoise')for(const b of world.bullets||[])if(!b.dead&&overlaps(shape,{x:b.x-2,y:b.y-2,w:4,h:4}))b.dead=true;
}
