import {STAGE_THREE} from './stage-three-layout.mjs?v=boss-detail-1';

export const WALL_ROCK_WARNING=1.5;
export const WALL_ROCK_HP=8;
export const WALL_ROCK_RESPAWN=6;

/** Rocks start embedded in visible cliff faces; the artwork and physics share
 * the same world-space anchor, rather than generating rocks in the sky. */
export function createStageThreeWallRocks(solids,random=Math.random){
  const ledges=solids.filter(s=>s.cliff&&!s.summit&&!s.gone&&s.w>=90&&s.y<=100&&s.y>=STAGE_THREE.stoneLine)
    .sort((a,b)=>b.y-a.y);
  const rocks=[];let previous=Infinity;
  for(const s of ledges){
    if(previous-s.y<88)continue;
    const r=13+random()*3,margin=r+6;
    const x=Math.max(margin,Math.min(STAGE_THREE.width-margin,s.x+s.w*(.4+random()*.2)));
    const releaseVx=(random()-.5)*34;
    rocks.push({t:'rock',waterfallRock:true,phase:'embedded',sourceId:s.id,sourceY:s.y,x,y:s.y+2*r+1,
      vx:0,vy:0,releaseVx,hp:WALL_ROCK_HP,r,rot:0,spinDir:releaseVx<0?-1:1,bounce:0,flash:0,warnT:0});
    previous=s.y;
  }
  return rocks;
}

/** Each cliff has its own respawn timer, independent of falling boulders.
 * Slots contain only plain data so online snapshots preserve the cycle. */
export function stageThreeRockSlots(rocks){
  return rocks.map(({sourceId,sourceY,x,y,r,releaseVx})=>
    ({sourceId,sourceY,x,y,r,releaseVx,respawnT:null}));
}
export function advanceStageThreeRockSlots(slots,enemies,dt){
  for(const slot of slots){
    const anchored=enemies.some(e=>e.waterfallRock&&e.sourceId===slot.sourceId&&!e.dead&&
      (e.phase==='embedded'||e.phase==='warning'));
    if(anchored){slot.respawnT=null;continue;}
    if(slot.respawnT==null){slot.respawnT=WALL_ROCK_RESPAWN;continue;}
    slot.respawnT=Math.max(0,slot.respawnT-dt);
    if(slot.respawnT>0)continue;
    enemies.push({t:'rock',waterfallRock:true,phase:'embedded',sourceId:slot.sourceId,sourceY:slot.sourceY,
      x:slot.x,y:slot.y,r:slot.r,releaseVx:slot.releaseVx,vx:0,vy:0,hp:WALL_ROCK_HP,rot:0,
      spinDir:slot.releaseVx<0?-1:1,bounce:0,flash:0,warnT:0});
    slot.respawnT=null;
  }
}

export function selectStageThreeWallRock(rocks,players,camY,random=Math.random){
  const eligible=rocks.filter(e=>e.t==='rock'&&e.waterfallRock&&e.phase==='embedded'&&!e.dead&&
    e.y-2*e.r>=camY+16&&e.y<=camY+125&&
    players.some(p=>!p.dead&&p.y-e.y>=35&&p.y-e.y<=190));
  return eligible.length?eligible[Math.min(eligible.length-1,Math.floor(random()*eligible.length))]:null;
}

export function stageThreeRockWobble(rock){
  if(rock.phase!=='warning')return {x:0,y:0,angle:0};
  const t=WALL_ROCK_WARNING-Math.max(0,rock.warnT),strength=.5+Math.min(1,t/WALL_ROCK_WARNING)*1.2;
  return {x:Math.sin(t*31)*strength,y:Math.sin(t*23)*.45,angle:Math.sin(t*27)*.035};
}
