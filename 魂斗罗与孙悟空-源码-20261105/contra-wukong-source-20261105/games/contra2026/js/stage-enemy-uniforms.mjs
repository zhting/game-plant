import {runGait} from './stage-one-motion.mjs?v=leg-alignment-2';

// The legs still come from the existing animation rig; the replacement upper
// body is registered to the same waist so it follows running and aiming.
export function drawStageEnemyUniform(art,p,drawBody,{front=false,key='enemyUniform',drawLegs=null}={}){
  const image=art.images[key];
  if(!art.loaded.has(key)||!image?.naturalWidth||p.dead||p.spin||p.prone)return false;
  const g=art.g, moving=Math.abs(p.vx||0)>.5&&p.onGround;
  const bob=moving&&!front?runGait(p.anim||0,p.vx,1,true).bob:0;
  const waist=front?-16:-14.8+bob;
  g.save();g.beginPath();g.rect(-60,waist,120,70);g.clip();
  const legFilter=({2:'saturate(.5) hue-rotate(145deg) brightness(.8)',4:'grayscale(1) brightness(.66)',6:'grayscale(.8) brightness(.7)'})[art.state?.stage];
  if(legFilter)g.filter=(g.filter&&g.filter!=='none'?g.filter+' ':'')+legFilter;
  (drawLegs||drawBody)();g.restore();
  g.save();g.translate(0,bob);
  if(!front&&Math.abs(p.ay||0)>.2){g.translate(0,-19);g.rotate(Math.max(-.32,Math.min(.32,(p.ay||0)*.45)));g.translate(0,19);}
  const height=front?24:18,width=height*image.naturalWidth/image.naturalHeight;
  if(front)g.drawImage(image,-width/2,-39,width,height);
  else g.drawImage(image,-11,-32,width,height);
  g.restore();return true;
}
