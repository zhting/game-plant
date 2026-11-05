const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const THERMAL_COLORS=Object.freeze([
  [0,7,16,38],[.2,28,43,106],[.38,103,33,137],[.54,197,39,78],
  [.68,244,103,29],[.82,255,198,54],[1,255,252,226]
]);
export const thermalSeconds=players=>Math.max(0,...players.filter(p=>!p.dead).map(p=>p.thermT||0));
const LUT=new Uint8ClampedArray(256*3);
for(let i=0;i<256;i++){
  const t=i/255,b=THERMAL_COLORS.findIndex(stop=>stop[0]>=t),hi=THERMAL_COLORS[Math.max(0,b)],lo=THERMAL_COLORS[Math.max(0,b-1)],a=hi[0]===lo[0]?0:(t-lo[0])/(hi[0]-lo[0]);
  for(let c=0;c<3;c++)LUT[i*3+c]=lo[c+1]+(hi[c+1]-lo[c+1])*a;
}
const spot=(x,y,cx,cy,rx,ry)=>Math.max(0,1-((x-cx)/rx)**2-((y-cy)/ry)**2);

export function thermalTemperature(kind,x,y,luma=.5,actor=null){
  let heat;
  if(kind==='human'){
    const ax=actor?actor.x+x*actor.w:(x-.5)*28,ay=actor?actor.y+y*actor.h:-30+y*30;
    const prone=actor?.prone,roll=actor?.roll;
    if(prone)heat=.57+.24*spot(ax,ay,6,-7,10,7)+.15*spot(ax,ay,-3,-5,15,7);
    else if(roll)heat=.64+.24*spot(x,y,.5,.5,.5,.5);
    else{
      heat=.57+.25*spot(ax,ay,-1,-25,6,6)+.16*spot(ax,ay,0,-16,8,10);
      if(ay>-7)heat-=.1;
      if(ax>8&&ay<-10&&ay>-27)heat-=.19;
    }
    heat+=luma*.14;
  }else if(kind==='operator'){
    heat=.22+luma*.15+.58*spot(x,y,.8,.54,.24,.5);
  }else if(kind==='vehicle'||kind==='wreck'){
    heat=.19+luma*.14+.35*spot(x,y,.88,.47,.26,.35)+.23*clamp((y-.64)*4);
    if(kind==='wreck')heat+=.13;
    if(y<.2)heat*=.5;
  }else if(kind==='fortress'){
    heat=.24+luma*.14+.48*spot(x,y,.5,.85,.25,.25)+.22*spot(x,y,.5,.42,.17,.36);
  }else if(kind==='turret'){
    heat=.25+luma*.14+.35*spot(x,y,.5,.52,.3,.3);
    if(y<.23)heat*=.42;
  }else if(kind==='weaponHot')heat=.55+.23*x+luma*.14;
  else if(kind==='weapon')heat=.29+.13*luma+.12*(1-x);
  else if(kind==='device')heat=.26+luma*.13+.18*spot(x,y,.5,.56,.23,.24);
  else heat=.035+luma*.21;
  return clamp(heat);
}
export function colorizeThermalPixels(pixels,width,height,kind,actor=null){
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;if(pixels[i+3]===0)continue;
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2],luma=(r*.2126+g*.7152+b*.0722)/255;
    let heat=thermalTemperature(kind,(x+.5)/width,(y+.5)/height,luma,actor);
    if(kind!=='human'&&kind!=='operator'&&kind!=='cold'&&r>g*1.16&&g>b*1.15&&r>110)heat=Math.max(heat,.72+luma*.25);
    const at=Math.round(clamp(heat)*255)*3;
    pixels[i]=LUT[at];pixels[i+1]=LUT[at+1];pixels[i+2]=LUT[at+2];
  }
  return pixels;
}

/** Each sprite keeps its real alpha silhouette. Moving actor canvases are
 * versioned; static art is converted once, at a bounded sensor resolution. */
export class ThermalMaterialCache{
  constructor(createCanvas){this.createCanvas=createCanvas;this.images=new WeakMap();this.converted=0;this.pixels=0;}
  image(source,crop,kind,{w,h,version=0,force=false,actor=null}={}){
    const [sx,sy,sw,sh]=crop,width=Math.max(1,Math.min(sw,Math.ceil(w*4))),height=Math.max(1,Math.min(sh,Math.ceil(h*4)));
    let entries=this.images.get(source);if(!entries){entries=new Map();this.images.set(source,entries);}
    const layout=actor?`${actor.x},${actor.y},${actor.w},${actor.h},${!!actor.prone},${!!actor.roll}`:'';
    const key=`${crop}:${kind}:${width}:${height}:${layout}`;
    let entry=entries.get(key);
    if(entry&&!force&&entry.version===version)return entry.canvas;
    if(!entry){const canvas=this.createCanvas();canvas.width=width;canvas.height=height;entry={canvas,version:-1};entries.set(key,entry);}
    const moving=!!actor&&typeof source.getContext==='function';
    const ink=entry.canvas.getContext('2d',moving?undefined:{willReadFrequently:true});
    if(moving){
      // Keep animated canvases on the GPU. Reading back their pixels every
      // frame also waits for the full scene's pending drawing commands.
      if(!entry.field){
        const field=this.createCanvas();field.width=width;field.height=height;const paint=field.getContext('2d'),data=paint.createImageData?.(width,height);
        if(data?.data){
          for(let y=0;y<height;y++)for(let x=0;x<width;x++){
            const i=(y*width+x)*4,at=Math.round(thermalTemperature(kind,(x+.5)/width,(y+.5)/height,.55,actor)*255)*3;
            data.data[i]=LUT[at];data.data[i+1]=LUT[at+1];data.data[i+2]=LUT[at+2];data.data[i+3]=255;
          }
          paint.putImageData(data,0,0);
        }else{
          const gradient=paint.createLinearGradient(0,0,0,height);gradient.addColorStop(0,'#fff1ab');gradient.addColorStop(1,'#d43a43');paint.fillStyle=gradient;paint.fillRect(0,0,width,height);
        }
        entry.field=field;
      }
      ink.setTransform(1,0,0,1,0,0);ink.globalAlpha=1;ink.globalCompositeOperation='copy';ink.drawImage(entry.field,0,0);
      ink.globalCompositeOperation='multiply';ink.globalAlpha=.22;ink.drawImage(source,sx,sy,sw,sh,0,0,width,height);
      ink.globalAlpha=1;ink.globalCompositeOperation='destination-in';ink.drawImage(source,sx,sy,sw,sh,0,0,width,height);ink.globalCompositeOperation='source-over';
      entry.version=version;this.converted++;this.pixels+=width*height;return entry.canvas;
    }
    ink.setTransform(1,0,0,1,0,0);ink.clearRect(0,0,width,height);ink.drawImage(source,sx,sy,sw,sh,0,0,width,height);
    let data;try{data=ink.getImageData(0,0,width,height);}catch{}
    if(data?.data){colorizeThermalPixels(data.data,width,height,kind,actor);ink.putImageData(data,0,0);}
    else{
      ink.globalCompositeOperation='source-in';const gradient=ink.createLinearGradient(0,0,0,height);
      gradient.addColorStop(0,kind==='cold'?'#294e87':'#fff1ab');gradient.addColorStop(1,kind==='cold'?'#101d48':'#d43a43');
      ink.fillStyle=gradient;ink.fillRect(0,0,width,height);ink.globalCompositeOperation='source-over';
    }
    entry.version=version;this.converted++;this.pixels+=width*height;return entry.canvas;
  }
  inspect(){return{converted:this.converted,pixels:this.pixels};}
}
