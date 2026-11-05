export const GUARD_REACTION_ASSET='/games/wukong/assets/guard-reactions.webp';
export const GUARD_BODY_HEIGHT=28;
// Complete painted figures, measured in the unchanged 1536 × 1024 source.
export const GUARD_REACTION_FRAMES=Object.freeze([
  [91,3,410,282,263,280], [583,24,400,262,753,280], [1038,46,407,239,1250,280],
  [99,301,407,262,275,558], [583,295,384,273,774,563], [1076,299,403,272,1266,566],
  [71,556,415,244,268,795], [532,579,429,229,760,803], [1037,588,395,225,1260,808],
  [19,819,470,171,263,981], [511,860,499,130,775,983], [1025,865,487,127,1290,984]
]);
// The painted fall/lying figures grow within the sheet. Calibrate the body
// along head/torso/leg landmarks, excluding the loose halberd and streamers.
// Crop width is not body height: a horizontal weapon must not size the soldier.
export const GUARD_DEFEAT_BODY_SPANS=Object.freeze([304,350,330,326,360,360]);
export function guardReactionFrame(e,defeated=false){
  if(defeated)return e.landed?e.landT<.09?9:e.landT<.25?10:11:e.vy< -55?6:e.vy<80?7:8;
  if(!e.hurt)return null;
  const u=e.hurt.t/e.hurt.duration;
  return u<.45?(e.hurt.low?3:e.hurt.heavy?2:1):u<.75?4:5;
}
export function drawGuardReaction(art,e,defeated=false){
  const image=art.images.guardReactions,index=guardReactionFrame(e,defeated);
  if(index===null||!image?.naturalWidth||art.loaded&&!art.loaded.has('guardReactions'))return false;
  const [x,y,w,h,ax,ay]=GUARD_REACTION_FRAMES[index];
  const scale=index<6?.112:GUARD_BODY_HEIGHT/GUARD_DEFEAT_BODY_SPANS[index-6],g=art.g;
  g.save();g.translate(e.x,e.y);g.scale(e.face||1,1);g.imageSmoothingEnabled=true;
  if(e.flash>0)g.filter='brightness(1.6) saturate(.65)';
  if(defeated&&e.landed)g.globalAlpha*=Math.max(0,Math.min(1,(1.1-e.landT)/.45));
  g.drawImage(image,x,y,w,h,(x-ax)*scale,(y-ay)*scale,w*scale,h*scale);g.restore();return true;
}
