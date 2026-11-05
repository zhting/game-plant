import {HERO_ATLASES} from './wukong-hero-atlas.mjs';
import {wholeHeroFrame} from './wukong-hero-frames.mjs';

function longStaffBody(art,base,f){
  if(base.longCanvas)return base.longCanvas;
  const width=base.canvas.width,height=base.canvas.height;
  const pixels=base.canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,width,height);
  if(!pixels?.data)return base.canvas;
  const rgba=pixels.data,original=new Uint8ClampedArray(rgba);
  const ox=(f.origin[0]-f.anchor[0])*f.scale,oy=(f.origin[1]-f.anchor[1])*f.scale;
  const dx=f.tip[0]-f.butt[0],dy=f.tip[1]-f.butt[1],length=Math.hypot(dx,dy),ax=dx/length,ay=dy/length;
  const rear=Math.hypot(f.origin[0]-f.butt[0],f.origin[1]-f.butt[1])*f.scale,front=Math.hypot(f.tip[0]-f.origin[0],f.tip[1]-f.origin[1])*f.scale;
  const density=width/base.w;
  const opaque=(x,y)=>{x=Math.round(x);y=Math.round(y);return x>=0&&x<width&&y>=0&&y<height&&original[(y*width+x)*4+3]>96;};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;if(!rgba[i+3])continue;
    const xx=base.x+(x+.5)/width*base.w-ox,yy=base.y+(y+.5)/height*base.h-oy;
    const along=xx*ax+yy*ay,across=xx*-ay+yy*ax;
    if(Math.abs(across)>3.6||along< -rear-2||along>front+2||Math.abs(along)<4)continue;
    // Keep connected anatomy and cloth where a shaft passes in front of the
    // body. Only its isolated wood/gold pixels and end caps are replaced.
    const nx=-ay*4.2*density,ny=ax*4.2*density;
    if(opaque(x+nx,y+ny)||opaque(x-nx,y-ny))continue;
    rgba[i+3]=0;
  }
  const canvas=art.createCanvas();canvas.width=width;canvas.height=height;canvas.getContext('2d').putImageData(pixels,0,0);
  base.longCanvas=canvas;return canvas;
}

// Extract complete connected paintings once, including their native alpha edge.
// This never cuts at a waist, swaps legs or rotates a separately painted arm.
export function prepareHeroAtlas(art,key){
  const image=art.images[key],sheet=Object.values(HERO_ATLASES).find(s=>s.key===key);
  if(!image?.naturalWidth||!sheet)return null;
  art.heroSpriteAtlases??=new Map();
  const previous=art.heroSpriteAtlases.get(key);if(previous?.image===image)return previous;
  // naturalWidth can become visible before asynchronous decoding has finished.
  // The first title render must wait for the loader's decoded-image signal;
  // reading an empty canvas here used to terminate the animation loop.
  if(art.loaded&&!art.loaded.has(key))return null;
  if(sheet.isolatedCells){
    const frames=new Map(),sx=image.naturalWidth/sheet.width,sy=image.naturalHeight/sheet.height;
    for(const f of sheet.frames){
      const [x,y,w,h]=f.bounds,canvas=art.createCanvas();canvas.width=Math.ceil(w*sx);canvas.height=Math.ceil(h*sy);
      canvas.getContext('2d').drawImage(image,x*sx,y*sy,w*sx,h*sy,0,0,canvas.width,canvas.height);
      frames.set(f.id,{canvas,x:(x-f.anchor[0])*f.scale,y:(y-f.anchor[1])*f.scale,w:w*f.scale,h:h*f.scale,wholeHero:true});
    }
    const result={image,frames,componentCount:frames.size};art.heroSpriteAtlases.set(key,result);return result;
  }
  const w=image.naturalWidth,h=image.naturalHeight,canvas=art.createCanvas();canvas.width=w;canvas.height=h;
  const ink=canvas.getContext('2d',{willReadFrequently:true});ink.drawImage(image,0,0);
  const pixels=ink.getImageData(0,0,w,h);if(!pixels?.data)return null;
  const rgba=pixels.data,owner=new Int16Array(w*h),queue=new Int32Array(w*h);owner.fill(-1);
  const bounds=[];
  for(const [index,f]of sheet.frames.entries()){
    const px=Math.round(f.pick[0]*w/sheet.width),py=Math.round(f.pick[1]*h/sheet.height);
    let start=-1;
    for(let r=0;r<90&&start<0;r++)for(let dy=-r;dy<=r&&start<0;dy++)for(const dx of r?[-r,r]:[0]){
      const x=px+dx,y=py+dy,p=y*w+x;
      if(x>=0&&x<w&&y>=0&&y<h&&rgba[p*4+3]>96&&owner[p]<0){start=p;break;}
    }
    if(start<0)throw Error('悟空整帧无法定位：'+f.id);
    let read=0,write=1;queue[0]=start;owner[start]=index;
    const b={left:w,top:h,right:0,bottom:0,area:0};
    while(read<write){
      const p=queue[read++],x=p%w,y=Math.floor(p/w);b.area++;b.left=Math.min(b.left,x);b.right=Math.max(b.right,x);b.top=Math.min(b.top,y);b.bottom=Math.max(b.bottom,y);
      for(const n of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1])if(n>=0&&owner[n]<0&&rgba[n*4+3]>96){owner[n]=index;queue[write++]=n;}
    }
    if(b.area<1200)throw Error('悟空完整人物帧缺失或粘连：'+f.id);
    bounds.push(b);
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const p=y*w+x;if(owner[p]>=0||!rgba[p*4+3]||rgba[p*4+3]>96)continue;
    let found=-1;
    for(let r=1;r<=3&&found<0;r++)for(let dy=-r;dy<=r&&found<0;dy++)for(let dx=-r;dx<=r;dx++){
      const xx=x+dx,yy=y+dy;
      if(xx>=0&&xx<w&&yy>=0&&yy<h&&rgba[(yy*w+xx)*4+3]>96&&owner[yy*w+xx]>=0){found=owner[yy*w+xx];break;}
    }
    if(found>=0){owner[p]=found;const b=bounds[found];b.left=Math.min(b.left,x);b.right=Math.max(b.right,x);b.top=Math.min(b.top,y);b.bottom=Math.max(b.bottom,y);}
  }
  const frames=new Map();
  for(const [index,f]of sheet.frames.entries()){
    const b=bounds[index],sw=b.right-b.left+1,sh=b.bottom-b.top+1,sprite=art.createCanvas();sprite.width=sw;sprite.height=sh;
    const g=sprite.getContext('2d'),out=g.createImageData(sw,sh);
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
      const from=(y+b.top)*w+x+b.left;if(owner[from]!==index)continue;
      out.data.set(rgba.subarray(from*4,from*4+4),(y*sw+x)*4);
    }
    g.putImageData(out,0,0);
    frames.set(f.id,{canvas:sprite,x:(b.left*sheet.width/w-f.anchor[0])*f.scale,y:(b.top*sheet.height/h-f.anchor[1])*f.scale,w:sw*sheet.width/w*f.scale,h:sh*sheet.height/h*f.scale,wholeHero:true});
  }
  const result={image,frames,componentCount:frames.size};art.heroSpriteAtlases.set(key,result);return result;
}

export function composeWholeHeroFrame(hd,role,p,density){
  if(role==='enemy'||!p.heroFrames||p.dead)return null;
  const pose=wholeHeroFrame(p);if(!pose)return null;
  const f=pose.frame,host=hd.heroArt;
  const base=prepareHeroAtlas(host,f.sheet)?.frames.get(f.id);if(!base)return null;
  const replace=!!host.images.ruyiStaff?.naturalWidth;
  const frameKey='wholeHero:'+f.id+':'+(pose.air||pose.mounted?'air':'ground')+':'+(replace?'staffBody':'painted');
  let frame=hd.cache.get(frameKey);
  if(!frame){frame={...base,canvas:replace?longStaffBody(host,base,f):base.canvas,version:0};hd.cache.set(frameKey,frame);}
  frame.x=base.x-(pose.anchor[0]-f.anchor[0])*f.scale;
  frame.y=(base.y-(pose.anchor[1]-f.anchor[1])*f.scale)*pose.stretch+(pose.includesMount?(p.mountGroundY??p.y)-p.y:0);frame.h=base.h*pose.stretch;
  // Blend only whole figures for a few frames when switching clips. Active hits
  // remain crisp; no crossfade is applied between consecutive attack drawings.
  host.heroTransitions??=new Map();
  const key=role+':'+(p.summonKind?`${p.owner}:${p.summonKind}:${p.index}`:p.pid||1);
  const clock=p.heroAnimation?.clock??p.statusTime??0,previous=host.heroTransitions.get(key),old=previous&&clock>=previous.clock?previous:null;
  const active=p.staff&&pose.u>.16&&pose.u<.8;
  let outgoing=old?.outgoing,start=old?.start??clock;
  if(old&&old.clip!==pose.clip){outgoing=old.frame;start=clock;}
  const u=Math.max(0,Math.min(1,(clock-start)/.065));
  host.heroTransitions.set(key,{clip:pose.clip,frame,clock,outgoing:u<1?outgoing:null,start});
  if(!outgoing||u>=1||active||p.summonKind||replace)return frame;
  const cacheKey='heroBlend:'+key+':'+density;
  let result=hd.movingFrames.get(cacheKey);
  if(!result){const canvas=hd.createCanvas();canvas.width=Math.ceil(120*density);canvas.height=Math.ceil(90*density);result={canvas,x:-60,y:-65,w:120,h:90,wholeHero:true,version:0};hd.movingFrames.set(cacheKey,result);}
  const g=result.canvas.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,result.canvas.width,result.canvas.height);
  g.setTransform(density,0,0,density,-result.x*density,-result.y*density);g.imageSmoothingEnabled=true;
  g.globalAlpha=1-u;g.drawImage(outgoing.canvas,outgoing.x,outgoing.y,outgoing.w,outgoing.h);
  g.globalAlpha=u;g.drawImage(frame.canvas,frame.x,frame.y,frame.w,frame.h);g.globalAlpha=1;result.version++;
  return result;
}
