// Animate only the existing red fabric pixels; armour, face, tail and feet stay rigid.
// Time comes from the simulated world clock, so standing still never freezes the cloth.
import { PRONE_POSTURE_SCALE } from './wukong-combat.mjs';
const BASE_SCALE=28/302;
export function ribbonOffset(distance,time,{speed=0,attacking=false,lower=false}={}){
  const d=Math.max(0,distance),weight=Math.min(1,d/18)**1.35;
  const amplitude=(lower?.8:1.6)+Math.min(1,Math.abs(speed)/90)*(lower?.4:.8)+(attacking?.6:0);
  return {x:Math.sin(time*3.1-d*.21)*weight*.3,
    y:(Math.sin(time*4.4-d*.38)+Math.sin(time*7.1-d*.72)*.3)*weight*amplitude};
}

function clothLayers(art,source,p){
  art.ribbonLayers??=new WeakMap();
  let layers=art.ribbonLayers.get(source);
  if(layers&&layers.version===source.version)return layers;
  if(!layers){
    const canvas=()=>art.createCanvas();
    layers={body:canvas(),upper:canvas(),lower:canvas()};art.ribbonLayers.set(source,layers);
  }
  const width=source.canvas.width,height=source.canvas.height;
  const pixels=source.canvas.getContext('2d').getImageData(0,0,width,height);
  if(!pixels?.data)return null;
  const inks=['body','upper','lower'].map(key=>{
    const c=layers[key];if(c.width!==width||c.height!==height){c.width=width;c.height=height;}
    return c.getContext('2d');
  });
  const masks=inks.slice(1).map(g=>g.createImageData(width,height));
  const roll=p.spin&&!p.staff&&p.artPose!=='jump',scaleX=p.prone?PRONE_POSTURE_SCALE:roll?18/438/BASE_SCALE:1;
  const scaleY=roll?scaleX:1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2],a=pixels.data[i+3];
    if(!a||r<52||r<g*1.5||r<b*1.45||b<g*.42||(p.prone&&(r<g*1.8||b<g*.7)))continue;
    const xx=(source.x+(x+.5)/width*source.w)/scaleX,yy=(source.y+(y+.5)/height*source.h)/scaleY;
    const band=p.prone
      ?xx<-3&&xx>-39&&yy>-24&&yy<-10?0:xx<-5&&xx>-36&&yy>=-10&&yy<-2?1:-1
      :xx<-3.2&&xx>-25&&yy>-31&&yy<-17?0:xx<-5&&xx>-22&&yy>=-17&&yy<-5?1:-1;
    if(band<0)continue;
    masks[band].data.set(pixels.data.subarray(i,i+4),i);pixels.data[i+3]=0;
  }
  inks[0].putImageData(pixels,0,0);masks.forEach((mask,i)=>inks[i+1].putImageData(mask,0,0));
  Object.assign(layers,{version:source.version,scaleX,scaleY});return layers;
}

export function flutterRibbons(art,source,role,p,density){
  // Summons already animate through their complete cached body poses. Keep
  // the per-pixel fabric extraction for the player rather than every helper.
  if(role==='enemy'||p.dead||p.summonKind)return source;
  const layers=clothLayers(art,source,p);if(!layers)return source;
  const key=`ribbons:${role}:${density}:${p.prone?'prone':'upright'}`;
  let result=art.movingFrames.get(key);
  if(!result){
    const canvas=art.createCanvas(),bounds=p.prone?{x:-52,y:-42,w:108,h:52}:{x:-38,y:-56,w:84,h:68};
    canvas.width=Math.ceil(bounds.w*density);canvas.height=Math.ceil(bounds.h*density);
    result={canvas,...bounds,version:0};art.movingFrames.set(key,result);
  }
  const g=result.canvas.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,result.canvas.width,result.canvas.height);
  g.setTransform(density,0,0,density,-result.x*density,-result.y*density);g.imageSmoothingEnabled=true;
  const time=p.statusTime??0,width=source.canvas.width,height=source.canvas.height,step=Math.max(1,Math.round(density*.65));
  for(const [band,texture]of [layers.upper,layers.lower].entries()){
    for(let x=0;x<width;x+=step){
      const sw=Math.min(step,width-x),xx=source.x+x/width*source.w;
      const distance=(-3.2*layers.scaleX-xx)/layers.scaleX;
      const offset=ribbonOffset(distance,time,{speed:p.vx,attacking:!!p.staff,lower:band===1});
      g.drawImage(texture,x,0,sw,height,xx+offset.x*layers.scaleX,source.y+offset.y*layers.scaleY,sw/width*source.w+.04,source.h);
    }
  }
  g.drawImage(layers.body,source.x,source.y,source.w,source.h);
  result.version++;return result;
}
