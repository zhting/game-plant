export const IMPACT_AUDIO=Object.freeze(Object.fromEntries([
  ['hitBody','body-1'],['hitBody2','body-2'],['hitMetal','metal-1'],['hitMetal2','metal-2'],
  ['heavyBody','body-heavy'],['heavyMetal','metal-heavy'],
].map(([key,name])=>[key,`/games/wukong/assets/audio/staff-impact-${name}.ogg`])));
export const IMPACT_MIX=Object.freeze({hitBody:.78,hitMetal:.70,heavyBody:.95,heavyMetal:.86});
export const impactSound=(heavy,metal)=>heavy?(metal?'heavyMetal':'heavyBody'):(metal?'hitMetal':'hitBody');

// Only confirmed contacts call this. The event uses ordinary replicated FX,
// so guests hear the same hit, and an empty swing never produces a smack.
export function queueHeroImpact(world,{x,y,heavy=false,killed=false,metal=false,owner=1}={}){
  const sound=impactSound(heavy||killed,metal);
  const nearby=world.fx.find(e=>e.k==='heroSound'&&e.impact&&e.at===world.time&&e.metal===metal&&Math.hypot(e.x-x,e.y-y)<28);
  if(nearby){if(heavy||killed)nearby.sound=sound;return nearby;}
  const event={k:'heroSound',id:`${world.t}:impact:${world.fx.length}`,sound,impact:true,metal,owner,
    at:world.time,x,y,t:0,life:1.2};
  world.fx.push(event);return event;
}
