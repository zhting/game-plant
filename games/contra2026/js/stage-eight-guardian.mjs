export const ALIEN_GUARDIAN=Object.freeze({x:1130,y:76,hp:28,wallOffset:-112,wallWidth:80,wallTop:104,floor:176,headOffset:-84,headTop:-22,headWidth:196,cameraLead:162});
export const ALIEN_GUARDIAN_WALL_ASSET='/games/contra2026/assets/stage7/alien-guardian-halfwall-v1.webp';

export function createAlienGuardian(){
  return {t:'alienHead',x:ALIEN_GUARDIAN.x,y:ALIEN_GUARDIAN.y,hp:ALIEN_GUARDIAN.hp,max:ALIEN_GUARDIAN.hp,fireT:1.2,flash:0};
}

/** Only the exposed head is vulnerable; the low wall is a separate solid. */
export function alienGuardianBox(e){
  return {x:e.x-70,y:e.y-42,w:104,h:88};
}

export function alienGuardianWallBox(e){
  const q=ALIEN_GUARDIAN;return {x:e.x+q.wallOffset,y:q.wallTop,w:q.wallWidth,h:q.floor-q.wallTop};
}

export function createAlienGuardianWall(e){return {...alienGuardianWallBox(e),solid:1,wall:1,guardianWall:true};}

export function alienGuardianHeadBoxes(e){
  return [alienGuardianBox(e),{x:e.x,y:4,w:74,h:76},{x:e.x+62,y:0,w:50,h:58}];
}

export function alienGuardianArtBox(e){
  const q=ALIEN_GUARDIAN;return {x:e.x+q.headOffset,y:q.headTop,w:q.headWidth,h:q.headWidth*1015/1356};
}

export function alienGuardianMouth(e){return {x:e.x-65,y:e.y+12};}

export function liveAlienGuardian(enemies){
  return enemies.find(e=>e.t==='alienHead'&&!e.dead&&e.hp>0);
}

/** Hold the arena composition so the neck continues beyond the upper-right edge. */
export function alienGuardianCameraLimit(enemies,limit){
  const e=liveAlienGuardian(enemies);return e?Math.min(limit,alienGuardianWallBox(e).x-ALIEN_GUARDIAN.cameraLead):limit;
}

export function alienGuardianLimit(enemies,limit,margin=10,body=null){
  const guardian=liveAlienGuardian(enemies);
  if(!guardian)return limit;
  const boxes=[alienGuardianWallBox(guardian),...alienGuardianHeadBoxes(guardian)];
  for(const b of boxes)if(!body||body.y+body.h>b.y+.1&&body.y<b.y+b.h-.1)limit=Math.min(limit,b.x-Math.max(12,margin));
  return limit;
}

/** A grounded, half-height chitin wall leaves the cavern above it visible. */
export function drawAlienGuardianBody(art,e){
  const {x,y,w,h}=alienGuardianWallBox(e),g=art.g;
  g.save();
  if(art.loaded.has('guardianWall'))g.drawImage(art.images.guardianWall,32,131,1188,967,x,y,w,h);
  else art.rect(x,y,w,h,'#40323d');
  g.restore();
}

export function drawAlienGuardianHead(art,e){
  const g=art.g,b=alienGuardianArtBox(e);
  g.save();if(e.flash>0)g.filter='brightness(1.8)';
  if(art.loaded.has('guardian'))g.drawImage(art.images.guardian,b.x,b.y,b.w,b.h);
  g.restore();
  if(e.shotFlash>0){
    const p=alienGuardianMouth(e),q=Math.min(1,e.shotFlash/.16);
    g.save();g.globalAlpha=q;g.strokeStyle='#d99879';g.lineWidth=.65;g.lineCap='round';
    for(const offset of [-2,2]){g.beginPath();g.moveTo(p.x+2,p.y+offset);g.bezierCurveTo(p.x-2,p.y+offset+2,p.x-6,p.y+offset+4,p.x-11*(1-q),p.y+offset+3);g.stroke();}
    g.restore();
  }
}
