import { GIANT_WHOLE_FRAMES, wholeGiantPose } from './wukong-giant-frames.mjs';

// Extract full connected paintings from transparent atlases once. This is atlas
// trimming, not a limb rig: every displayed frame is one complete RGBA sprite.
export function prepareGiantAtlas(art,key){
  const image=art.images[key];if(!image?.naturalWidth)return null;
  art.giantSpriteAtlases??=new Map();const previous=art.giantSpriteAtlases.get(key);
  if(previous?.image===image)return previous;
  const frames=Object.values(GIANT_WHOLE_FRAMES).flat().filter(f=>f.sheet===key);if(!frames.length)return null;
  const canvas=art.createCanvas(),w=image.naturalWidth,h=image.naturalHeight;canvas.width=w;canvas.height=h;
  const ink=canvas.getContext('2d',{willReadFrequently:true});ink.drawImage(image,0,0);
  const pixels=ink.getImageData(0,0,w,h);if(!pixels?.data)return null;
  const rgba=pixels.data,labels=new Int32Array(w*h),queue=new Int32Array(w*h),components=[null];
  for(let start=0;start<labels.length;start++){
    if(labels[start]||rgba[start*4+3]<=96)continue;
    const id=components.length,component={id,area:0,left:w,top:h,right:0,bottom:0};let read=0,write=1;queue[0]=start;labels[start]=id;
    while(read<write){
      const p=queue[read++],x=p%w,y=Math.floor(p/w);component.area++;
      component.left=Math.min(component.left,x);component.right=Math.max(component.right,x);component.top=Math.min(component.top,y);component.bottom=Math.max(component.bottom,y);
      for(const n of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1])if(n>=0&&!labels[n]&&rgba[n*4+3]>96){labels[n]=id;queue[write++]=n;}
    }
    components.push(component);
  }
  const find=f=>{
    const x=Math.round(f.pick[0]*w/f.sourceWidth),y=Math.round(f.pick[1]*h/f.sourceHeight);
    for(let r=0;r<60;r++)for(let dy=-r;dy<=r;dy++)for(const dx of r?[-r,r]:[0]){
      const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;
      const id=labels[yy*w+xx];if(components[id]?.area>4000)return id;
    }
    throw Error('完整巨灵神帧无法定位：'+f.id);
  };
  const groups=new Map();for(const f of frames){const id=find(f);if(groups.has(id))throw Error('完整巨灵神帧不得粘连：'+f.id);groups.set(id,[f]);}
  const owner=new Int16Array(w*h);owner.fill(-1);
  const frameIndex=new Map(frames.map((f,i)=>[f,i]));
  for(const [id,candidates]of groups){
    const c=components[id];
    for(let y=c.top;y<=c.bottom;y++)for(let x=c.left;x<=c.right;x++)if(labels[y*w+x]===id){
      owner[y*w+x]=frameIndex.get(candidates[0]);
    }
  }
  // Include native antialiasing at the silhouette, preserving its alpha values.
  // Transparent RGB never becomes an opaque color-key fringe.
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const p=y*w+x;if(owner[p]>=0||rgba[p*4+3]===0||labels[p])continue;
    let picked=-1;for(let radius=1;radius<=3&&picked<0;radius++)for(let dy=-radius;dy<=radius&&picked<0;dy++)for(let dx=-radius;dx<=radius;dx++){
      const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&labels[yy*w+xx]&&owner[yy*w+xx]>=0){picked=owner[yy*w+xx];break;}
    }if(picked>=0)owner[p]=picked;
  }
  const trimmed=new Map(),bounds=frames.map(()=>({left:w,top:h,right:0,bottom:0}));
  for(let p=0;p<owner.length;p++)if(owner[p]>=0){const b=bounds[owner[p]],x=p%w,y=Math.floor(p/w);b.left=Math.min(b.left,x);b.right=Math.max(b.right,x);b.top=Math.min(b.top,y);b.bottom=Math.max(b.bottom,y);}
  for(const [index,f]of frames.entries()){
    const {left,top,right,bottom}=bounds[index];
    if(left>right)throw Error('完整巨灵神帧为空：'+f.id);
    const sw=right-left+1,sh=bottom-top+1,sprite=art.createCanvas();sprite.width=sw;sprite.height=sh;
    const g=sprite.getContext('2d'),out=g.createImageData(sw,sh);
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
      const from=(y+top)*w+x+left;if(owner[from]!==index)continue;
      const to=(y*sw+x)*4;out.data.set(rgba.subarray(from*4,from*4+4),to);
    }
    const sx=w/f.sourceWidth,sy=h/f.sourceHeight;
    g.putImageData(out,0,0);trimmed.set(f.id,{canvas:sprite,x:(left/sx-f.anchor[0])*f.scale,y:(top/sy-f.anchor[1])*f.scale,w:sw/sx*f.scale,h:sh/sy*f.scale});
  }
  const atlas={image,frames:trimmed,componentCount:groups.size};art.giantSpriteAtlases.set(key,atlas);return atlas;
}

export function drawWholeGiant(art,giant,time=giant.attack?.t??0){
  const pose=wholeGiantPose(giant,time),f=pose.frame,image=art.images[f.sheet];if(!image?.naturalWidth)return false;
  const sprite=prepareGiantAtlas(art,f.sheet)?.frames.get(f.id),g=art.g;
  g.save();g.translate(giant.x,giant.y);g.scale(pose.face,pose.stretch);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  if(sprite)g.drawImage(sprite.canvas,sprite.x,sprite.y,sprite.w,sprite.h);
  else g.drawImage(image,...f.bounds.map((n,i)=>n*(i%2?image.naturalHeight/f.sourceHeight:image.naturalWidth/f.sourceWidth)),
    (f.bounds[0]-f.anchor[0])*f.scale,(f.bounds[1]-f.anchor[1])*f.scale,f.bounds[2]*f.scale,f.bounds[3]*f.scale);
  g.restore();return true;
}
