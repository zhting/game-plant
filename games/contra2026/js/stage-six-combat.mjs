/** Two short flame corridors meet at a climbable central wall. The right
 * catwalks step down, so crossing the wall leads back to the factory floor. */
const GALLERY_LEFT=2478, GALLERY_LEFT_WIDTH=28, GALLERY_WALL=2620, GALLERY_WALL_WIDTH=20, GALLERY_END=2754;
const GALLERY_START=GALLERY_LEFT+GALLERY_LEFT_WIDTH, GALLERY_RIGHT_START=GALLERY_WALL+GALLERY_WALL_WIDTH;
const GALLERY_CROWN=56,GALLERY_CROWN_END=2660;
const galleryOutlets=[80,120,160].flatMap((y,i)=>[
  {x:GALLERY_START,y,dir:1,range:GALLERY_WALL-GALLERY_START-6,per:3.6,off:i*1.2,gallery:true,side:'ascent'},
  {x:GALLERY_WALL,y,dir:-1,range:GALLERY_WALL-GALLERY_START-6,per:3.6,off:i*1.2,gallery:true,side:'ascent'},
  {x:GALLERY_RIGHT_START,y,dir:1,range:GALLERY_END-GALLERY_RIGHT_START-6,per:3.6,off:i*1.2+.6,gallery:true,side:'descent'},
  {x:GALLERY_END,y,dir:-1,range:GALLERY_END-GALLERY_RIGHT_START-6,per:3.6,off:i*1.2+.6,gallery:true,side:'descent'}
]);
export const STAGE_SIX_GALLERY=Object.freeze({
  left:GALLERY_LEFT,right:GALLERY_WALL,ground:176,leftWidth:GALLERY_LEFT_WIDTH,leftTop:26,rightWidth:GALLERY_WALL_WIDTH,rightTop:GALLERY_CROWN,
  crownTop:GALLERY_CROWN,crownEnd:GALLERY_CROWN_END,
  end:GALLERY_END,endWidth:18,endTop:26,
  shelves:Object.freeze([
    {x:GALLERY_START,y:96,w:GALLERY_WALL-GALLERY_START,side:'ascent'},
    {x:GALLERY_START,y:136,w:GALLERY_WALL-GALLERY_START,side:'ascent'},
    {x:GALLERY_START,y:GALLERY_CROWN,w:GALLERY_CROWN_END-GALLERY_START,side:'crown'},
    {x:GALLERY_RIGHT_START,y:96,w:60,side:'descent'},
    {x:GALLERY_RIGHT_START,y:136,w:104,side:'descent'}
  ].map(Object.freeze)),
  outlets:Object.freeze(galleryOutlets.map(Object.freeze))
});

/** Keep the complete up / crossing / down route in a single definition. */
export function createStageSixGallerySolids(){
  const q=STAGE_SIX_GALLERY;
  return [
    ...q.shelves.map(s=>({...s,h:8,g:0,gallery:true,galleryCrown:s.side==='crown',...(s.side==='crown'?{solid:true}:{})})),
    {x:q.right,y:q.rightTop,w:q.rightWidth,h:q.ground-q.rightTop,g:0,solid:true,wall:true,galleryWall:true}
  ];
}

/** The flying vehicle uses its own movement path, so resolve the same pillar
 * against its actual 24 × 20 collision box, including downward movement. */
export function collideStageSixGalleryHelicopter(p,oldX,oldY){
  const q=STAGE_SIX_GALLERY,left=q.right,right=q.right+q.rightWidth,top=q.rightTop,bottom=q.ground;
  if(p.y+4>top&&p.y-16<bottom){
    if(oldX+12<=left&&p.x+12>left)p.x=left-12;
    else if(oldX-12>=right&&p.x-12<right)p.x=right+12;
  }
  if(p.x+12>left&&p.x-12<right&&oldY+4<=top&&p.y+4>top)p.y=top-4;
}

const GUNNER_POSITIONS=Object.freeze([[746,124],[1334,96],[1714,96],[2084,124],[2360,176]].map(Object.freeze));
export function createStageSixGunners(){
  return GUNNER_POSITIONS.map(([x,y],i)=>({t:'heavyGunner',x,y,face:-1,hp:8,phase:'reload',phaseT:1.5+i*.24,shots:0,recoil:0,shotFlash:0,flash:0}));
}

/** The visible operator and cannon share a single damageable silhouette. */
export function stageSixGunnerBox(e){
  return e.face>0?{x:e.x-9,y:e.y-32,w:52,h:32}:{x:e.x-43,y:e.y-32,w:52,h:32};
}

/** An aimed warning precedes each three-shot burst; frozen or unseen gunners wait. */
export function advanceStageSixGunner(e,target,dt,{active=true}={}){
  if(e.dead)return null;
  e.recoil=Math.max(0,(e.recoil||0)-dt);e.shotFlash=Math.max(0,(e.shotFlash||0)-dt);
  if(!active||!target||target.dead||target.camoT>0)return null;
  if(e.phase==='aim')e.face=target.x<e.x?-1:1;
  e.phaseT-=dt;if(e.phaseT>0)return null;
  if(e.phase==='reload'){e.phase='aim';e.phaseT=.52;e.face=target.x<e.x?-1:1;return null;}
  if(e.phase==='aim'){e.phase='burst';e.shots=3;}
  e.shots--;e.recoil=.14;e.shotFlash=.075;
  const shot={x:e.x+e.face*41,y:e.y-24,vx:e.face*150,vy:0,r:2.5,from:'heavy-gunner'};
  if(e.shots>0)e.phaseT=.16;else{e.phase='reload';e.phaseT=2.6;}
  return shot;
}

// Bounds cover the full plume and the runner's body, with a small safety gap.
function runnerJetBounds(j,y){
  if(j.boss)return null;
  const top=j.v?112:(j.y??158.5)-6.5,bottom=j.v?176:top+13;
  if(y<=top||y-26>=bottom)return null;
  return j.v?{left:j.x-15,right:j.x+15}:
    j.dir<0?{left:j.x-(j.range??74)-14,right:j.x+14}:{left:j.x-14,right:j.x+(j.range??74)+14};
}
function jetWillFire(j,time,cooling,start,end){
  // Sample the deterministic cycle at 1/30 s; the 1.3 s fire phase cannot
  // fall between samples. Cooling ends independently of the normal cycle.
  for(let t=start;t<end+1/30;t+=1/30){
    if(t<cooling)continue;
    const phase=((time+t+j.off)%j.per+j.per)%j.per;
    if(phase>=j.per-1.3)return true;
  }
  return false;
}
export function stageSixRunnerSpawnSafe(x,y,jets,time,cooling=0){
  return !jets.some(j=>{const b=runnerJetBounds(j,y);return b&&x>=b.left&&x<=b.right&&jetWillFire(j,time,cooling,0,Math.min(x-b.left,b.right-x)/62+.12);});
}

/** Stop before a live or soon-to-fire plume, and turn away from an edge.
 * An already exposed runner takes the shortest safe exit instead of freezing.
 * Returns 'stop', 'escape', 'cross', or 'move'; state is snapshot-friendly. */
export function navigateStageSixRunner(e,solids,jets,time,cooling,dt){
  e.hazardHold=false;
  if(!e.on||!e.vx)return 'move';
  let direction=Math.sign(e.vx),speed=Math.abs(e.vx);
  const ahead=e.x+direction*(7+speed*dt);
  const solid=solids.some(s=>!s.gone&&Math.abs(s.y-e.y)<.5&&ahead>=s.x&&ahead<=s.x+s.w);
  if(!solid){e.vx=-e.vx;direction=-direction;e.dec=false;}
  let crossing=false;
  for(const j of jets){
    const b=runnerJetBounds(j,e.y);if(!b)continue;
    const inside=e.x>b.left&&e.x<b.right;
    if(inside){
      const exit=(direction>0?b.right-e.x:e.x-b.left)/speed+.05;
      if(jetWillFire(j,time,cooling,0,exit)){
        const safer=e.x-b.left<b.right-e.x?-1:1;
        if(direction!==safer)e.vx=safer*speed;
        return 'escape';
      }
      crossing=true;continue;
    }
    const distance=direction>0?b.left-e.x:e.x-b.right;
    if(distance<0||distance>speed*dt+.2)continue;
    const crossingTime=(b.right-b.left)/speed+.08;
    if(jetWillFire(j,time,cooling,0,crossingTime)){e.hazardHold=true;return 'stop';}
  }
  return crossing?'cross':'move';
}
