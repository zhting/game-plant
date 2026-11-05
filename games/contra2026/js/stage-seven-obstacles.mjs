import {HANGAR_IRON_PLATES} from './stage-seven-layout.mjs?v=hangar-required-routes-1';
export const HANGAR_PLATE=Object.freeze({height:160,width:66,bodyLeft:20,bodyRight:33,triggerRange:170,riseSpeed:1.6,hp:24});

export function createHangarPlates(){
  return HANGAR_IRON_PLATES.map(({x,y})=>({t:'spikeWall',x,y,hp:HANGAR_PLATE.hp,max:HANGAR_PLATE.hp,rise:0,flash:0}));
}

export function hangarPlateBox(plate,body=false){
  const height=HANGAR_PLATE.height*Math.max(0,Math.min(1,plate.rise||0));
  return {x:plate.x-(body?HANGAR_PLATE.bodyLeft:HANGAR_PLATE.width/2),y:plate.y-height,w:body?HANGAR_PLATE.bodyLeft+HANGAR_PLATE.bodyRight:HANGAR_PLATE.width,h:height};
}

/** The heavy body blocks travel while the protruding tips remain damageable. */
export function collideHangarPlates(actor,oldX,halfWidth,plates,actorBox){
  let blocked=false;
  for(const plate of plates){
    if(plate.t!=='spikeWall'||plate.dead||!(plate.rise>0))continue;
    const box=hangarPlateBox(plate,true);
    if(actorBox.y+actorBox.h<=box.y||actorBox.y>=box.y+box.h||actor.x+halfWidth<=box.x||actor.x-halfWidth>=box.x+box.w)continue;
    if(oldX+halfWidth<=box.x+.5)actor.x=box.x-halfWidth;
    else if(oldX-halfWidth>=box.x+box.w-.5)actor.x=box.x+box.w+halfWidth;
    else actor.x=oldX<box.x+box.w/2?box.x-halfWidth:box.x+box.w+halfWidth;
    blocked=true;
  }
  return blocked;
}
