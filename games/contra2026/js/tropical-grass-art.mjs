// The approved waterfall shelf also supplies the jungle's turf and root layer.
export const TROPICAL_GRASS_ASSET='/games/contra2026/assets/stage3/mossy-rock-ledge.webp';
const ART=Object.freeze({bounds:[34,164,1713,580],cap:360,walk:.14});

export function paintTropicalCliff(art,g,start){
 if(!art.loaded.has('turf'))return false;
 let face=art.cache.get('turf:cliff-material');
 if(!face){
  face=art.createCanvas();face.width=993;face.height=230;
  const ink=face.getContext('2d');ink.drawImage(art.images.turf,394,414,993,230,0,0,993,230);
  ink.globalCompositeOperation='destination-in';
  const fade=ink.createLinearGradient(0,0,0,22);fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(1,'#000');
  ink.fillStyle=fade;ink.fillRect(0,0,993,230);art.cache.set('turf:cliff-material',face);
 }
 const width=144,height=width*face.height/face.width,stride=height-3;
 for(let row=-1;row*stride<216;row++){
  g.save();g.translate(0,row*stride);art.textureSpan(g,face,start,start+128,width,height,6);g.restore();
 }
 return true;
}

export function tropicalGrassFrame(art,s,ends){
 if(!art.loaded.has('turf'))return null;
 const height=s.g?42:32,top=height*ART.walk;
 const key=`turf:${s.x}:${s.w}:${!!s.g}:${+ends.left}:${+ends.right}:${+!!ends.blendLeft}:${+!!ends.blendRight}:${art.scale}`;
 if(art.cache.has(key))return{canvas:art.cache.get(key),height,top};
 const canvas=art.createCanvas(),scale=art.scale;
 canvas.width=Math.ceil((s.w+6)*scale);canvas.height=Math.ceil(height*scale);
 const g=canvas.getContext('2d'),image=art.images.turf,[sx,sy,sw,sh]=ART.bounds;
 g.scale(scale,scale);g.translate(3,0);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
 g.save();g.beginPath();g.rect(0,0,s.w,height);g.clip();
 // A fixed physical scale preserves the leaf and stone sizes on long banks.
 // Each tile fades into its neighbour, with the phase fixed in world space.
 const ratio=height/sh,middle=sw-ART.cap*2,tileWidth=middle*ratio,overlap=4,stride=tileWidth-overlap;
 for(let tile=Math.floor((s.x-tileWidth)/stride);tile*stride<s.x+s.w;tile++){
  const x=tile*stride-s.x,cut=overlap/tileWidth*middle;
  for(let band=0;band<12;band++){
   g.save();g.globalAlpha=(band+.5)/12;
   g.drawImage(image,sx+ART.cap+band*cut/12,sy,cut/12,sh,x+band*overlap/12,0,overlap/12+.05,height);g.restore();
  }
  g.drawImage(image,sx+ART.cap+cut,sy,middle-cut,sh,x+overlap,0,tileWidth-overlap,height);
 }
 g.restore();
 const cap=Math.min(s.w*.3,ART.cap*ratio),blend=3;
 for(const side of ['left','right'])if(ends[side]){
  const left=side==='left',x=left?-1:s.w-cap+1,source=left?sx:sx+sw-ART.cap;
  g.clearRect(x,0,cap,height);g.drawImage(image,source,sy,ART.cap,sh,x,0,cap,height);
  // Match the cap's terminal slice to the continuous central material.
  for(let band=0;band<12;band++){
   const offset=band*blend/12;
   g.save();g.globalAlpha=1-(band+.5)/12;
   const sourceX=left?sx+ART.cap+offset/ratio:sx+sw-ART.cap-(offset+blend/12)/ratio;
   const destX=left?x+cap+offset:x-offset-blend/12;
   g.drawImage(image,sourceX,sy,blend/12/ratio,sh,destX,0,blend/12+.04,height);g.restore();
  }
 }
 if(s.g){
  g.globalCompositeOperation='destination-in';
  const fade=g.createLinearGradient(0,height*.58,0,height);fade.addColorStop(0,'#000');fade.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=fade;g.fillRect(-3,0,s.w+6,height);
  // At a descending step the root/rock layer joins an existing higher cliff.
  // Fade that overlay sideways, keeping the grass lip crisp at the walking plane.
  g.globalCompositeOperation='destination-out';
  for(const side of ['left','right'])if(ends[side==='left'?'blendLeft':'blendRight']){
   const width=Math.min(9,s.w/3),bands=18;
   const mask=g.createLinearGradient(0,top+2,0,top+9);
   mask.addColorStop(0,'rgba(0,0,0,0)');mask.addColorStop(1,'#000');g.fillStyle=mask;
   for(let band=0;band<bands;band++){
    const offset=band*width/bands;
    g.globalAlpha=1-band/(bands-1);
    g.fillRect(side==='left'?offset:s.w-offset-width/bands,top+2,width/bands+.02,height-top-2);
   }
  }
  g.globalAlpha=1;
 }
 art.cache.set(key,canvas);return{canvas,height,top};
}
