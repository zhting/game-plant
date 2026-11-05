const TAU = Math.PI * 2;

export function isRunning(p) {
  return Math.abs(p.vx || 0) > .5 && p.onGround && !p.dead && !p.spin && !p.prone && !p.inWater && !p.ride;
}

export function isWading(p) {
  return Math.abs(p.vx || 0) > .5 && p.onGround && p.inWater && !p.dead && !p.spin && !p.prone && !p.dive && !p.ride;
}

export function runFrame(animation,speed=90,size=1,enemy=false){
  const period=(enemy?36:42)*size;
  const phase=((animation/10*Math.abs(speed)/period)%1+1)%1;
  return Math.min(11,Math.floor(phase*12));
}

export const RUN_STANCE=.38;
export const RUN_BONES=Object.freeze({upper:7.6,lower:7.5,sole:2.5,hip:13.6,hipOffset:2});
export const runStride=(enemy=false)=>enemy?36:42;
export const WADE_STANCE=.62;
export const WADE_STRIDE=26;

// Hips rest on the saddle; knees point forward and boots stay on the pegs.
// Both bones retain their walking lengths, without squeezing the painted trousers.
export const MOTORCYCLE_RIDER=Object.freeze({
  phase:0,bob:0,lean:.12,seatX:-3.8,waist:-16.3,muzzleHeight:22.5,
  legs:Object.freeze([[-5.2,-15,-3.2,-6.9],[-3.2,-14.8,-1.2,-6.4]].map(([hx,hy,ax,ay])=>{
    const hip={x:hx,y:hy},ankle={x:ax,y:ay},dx=ax-hx,dy=ay-hy,distance=Math.hypot(dx,dy);
    const along=(RUN_BONES.upper**2-RUN_BONES.lower**2+distance**2)/(2*distance);
    const bend=Math.sqrt(RUN_BONES.upper**2-along**2);
    return Object.freeze({hip:Object.freeze(hip),ankle:Object.freeze(ankle),
      knee:Object.freeze({x:hx+dx/distance*along+dy/distance*bend,y:hy+dy/distance*along-dx/distance*bend}),
      footAngle:0});
  }))
});

/** Actual painted-leg rig: fixed-length bones and a C1 foot trajectory, driven by travelled distance. */
export function runGait(animation, speed = 90, size = 1, enemy = false) {
  return legGait(animation,speed,size,enemy,false);
}

export function wadeGait(animation,speed=60,size=1){
  return legGait(animation,speed,size,false,true);
}

function legGait(animation,speed,size,enemy,wading){
  const stride=wading?WADE_STRIDE:runStride(enemy),contact=wading?WADE_STANCE:RUN_STANCE;
  const cycle=animation/10*Math.abs(speed)/(stride*size),phase=((cycle%1)+1)%1;
  const reach=stride*contact/2,bob=(wading?.28:.6)*Math.sin((phase-.03)*TAU*2);
  const legs = [0, 1].map(index => {
    const t=((phase+index*.5)%1+1)%1,stance=t<contact,u=stance?t/contact:(t-contact)/(1-contact);
    const hip={x:(index?1:-1)*RUN_BONES.hipOffset,y:-RUN_BONES.hip+bob};
    // Hermite endpoints retain the stance velocity, avoiding a snap at toe-off and touchdown.
    const tangent=-stride*(1-contact),h00=2*u**3-3*u*u+1,h10=u**3-2*u*u+u,h01=-2*u**3+3*u*u,h11=u**3-u*u;
    const foot={x:hip.x+(stance?reach-stride*t:-reach*h00+tangent*h10+reach*h01+tangent*h11),y:stance?0:-(wading?4:8.2)*Math.sin(Math.PI*u)**2};
    const ankle={x:foot.x,y:foot.y-RUN_BONES.sole};
    const dx = ankle.x - hip.x, dy = ankle.y - hip.y, distance = Math.hypot(dx, dy);
    const {upper,lower}=RUN_BONES,along=(upper**2-lower**2+distance**2)/(2*distance);
    const bend = Math.sqrt(Math.max(0, upper ** 2 - along ** 2));
    const knee = { x: hip.x + dx / distance * along + dy / distance * bend,
      y: hip.y + dy / distance * along - dx / distance * bend };
    return { hip,knee,ankle,foot,stance,footAngle:stance?0:(wading?.2:.4)*Math.sin(TAU*u)-.12*Math.sin(Math.PI*u) };
  });
  return {phase,bob,lean:wading?.02:enemy?.065:.045,legs};
}
