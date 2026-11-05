import { bodyPoint, connectedLeg, WUKONG_HIPS } from './wukong-locomotion.mjs';

export const QILIN_ASSET='/games/wukong/assets/celestial-qilin.webp';
export const QILIN_SCALE=.067;
// Each drawing is registered at its saddle, not its changing hoof positions.
export const QILIN_FRAMES=Object.freeze([
  {bounds:[0,0,768,512],saddle:[396,218]},
  {bounds:[768,0,768,512],saddle:[424,220]},
  {bounds:[0,512,768,512],saddle:[403,207]},
  {bounds:[768,512,768,512],saddle:[423,223]},
]);
export const beastRider=p=>!p.dead&&(p.ride==='moto'||!!p.beastRider);
export function beastMotion(p){
  const moving=Math.abs(p.vx||0)>2,phase=(p.anim||0)/20*5.5*Math.PI*2;
  if(!p.onGround)return {frame:3,bob:0,lean:Math.max(-.065,Math.min(.065,(p.vy||0)/2800))};
  return moving?{frame:[1,3,2,3][Math.floor(((phase/(Math.PI*2)%1)+1)%1*4)],bob:-.55*(1-Math.cos(phase*2)),lean:.025*Math.sin(phase)}:
    {frame:0,bob:0,lean:0};
}
export function beastSeatOffset(p){
  return !p.dead&&p.ride==='moto'?-10+beastMotion(p).bob:0;
}
export function actorRootY(p){
  return p.y+beastSeatOffset(p)*(p.giantT>0?2:1)*(p.magicScale||1);
}
// The upper body can turn and lift the weapon while the pelvis stays seated.
export function mountedBodyMotion(p,motion){
  if(!beastRider(p))return motion;
  return {...motion,bob:motion.bob*.25,sway:(motion.sway||0)*.65,lean:motion.lean*.8,
    stretch:1+(motion.stretch-1)*.5};
}
export function riderLegs(p,pose){
  if(!beastRider(p))return null;
  return WUKONG_HIPS.map((hip,i)=>({...connectedLeg(bodyPoint(pose,hip.x,hip.y),
    {x:i?4.8:3.2,y:i?-3.5:-4.8},hip.name),footAngle:i?-.12:.08}));
}
export function drawQilin(art,p){
  const image=art.images.celestialQilin;if(!image?.naturalWidth)return;
  const motion=beastMotion(p),f=QILIN_FRAMES[motion.frame],g=art.g;
  g.save();g.translate(p.x,p.y-18+motion.bob);g.scale(p.face<0?-1:1,1);g.rotate(motion.lean);
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(image,...f.bounds,-f.saddle[0]*QILIN_SCALE,-f.saddle[1]*QILIN_SCALE,
    f.bounds[2]*QILIN_SCALE,f.bounds[3]*QILIN_SCALE);g.restore();
}
export function wukongMountText(value){
  return String(value).replace(/摩托车沉入水中|摩托车被击毁|摩托车|摩托/g,
    word=>word==='摩托车沉入水中'?'麒麟遁入云海':word==='摩托车被击毁'?'麒麟护主退场':'麒麟');
}
