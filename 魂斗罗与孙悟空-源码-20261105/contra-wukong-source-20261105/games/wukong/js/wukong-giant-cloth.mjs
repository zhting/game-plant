// Alpha-aware cloth loops. A whole warped frame is painted once, so adjoining
// strips cannot leave seams. Roots stay pinned while waves travel to the tips.
const SCALE=.115,PERIOD=1.6,FRAMES=48,LIMIT=192;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const root=(x,y)=>Object.freeze({x:(x-790)*SCALE,y:(y-878)*SCALE});
const layer=(x,y,dx,dy,length,amplitude,phase)=>{
  const norm=Math.hypot(dx,dy);return Object.freeze({root:root(x,y),flow:{x:dx/norm,y:dy/norm},length:length*SCALE,amplitude,phase});
};
export const GIANT_CLOTH=Object.freeze({
  cape:layer(650,240,-500,480,690,3.3,0),
  ribbonHigh:layer(650,180,-260,30,270,3.7,.8),
  ribbonLow:layer(590,260,-380,110,400,4.1,2.1),
  hair:layer(790,88,-350,70,350,2.5,1.2)
});
function displacement(meta,u,time,energy){
  u=clamp(u);const phase=time/PERIOD*Math.PI*2+meta.phase;
  const wave=(Math.sin(phase-u*5.2)+.24*Math.sin(phase*2-u*10.4))*u*u*(meta.amplitude+energy*1.3);
  return {x:-meta.flow.y*wave,y:meta.flow.x*wave};
}
export function giantClothOffset(name,point,time,energy=0){
  const meta=GIANT_CLOTH[name],u=((point.x-meta.root.x)*meta.flow.x+(point.y-meta.root.y)*meta.flow.y)/meta.length;
  return displacement(meta,u,time,energy);
}
function sourcePixels(art,frame,name){
  const key=`giant:cloth-source:${name}`,previous=art.cache.get(key);if(previous)return previous;
  const density=Math.min(2,Math.max(1,art.scale)),w=frame.w*SCALE,h=frame.h*SCALE,canvas=art.createCanvas();
  canvas.width=Math.ceil(w*density);canvas.height=Math.ceil(h*density);
  const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(frame.canvas,0,0,canvas.width,canvas.height);
  const data=g.getImageData(0,0,canvas.width,canvas.height);if(!data?.data)return null;
  const pixels=new Float32Array(data.data.length);
  for(let i=0;i<pixels.length;i+=4){const a=data.data[i+3];pixels[i]=data.data[i]*a/255;pixels[i+1]=data.data[i+1]*a/255;pixels[i+2]=data.data[i+2]*a/255;pixels[i+3]=a;}
  const result={pixels,width:canvas.width,height:canvas.height,density,x:(frame.x-790)*SCALE,y:(frame.y-878)*SCALE,w,h};
  art.cache.set(key,result);return result;
}
function warpedFrame(art,source,name,phase,energy){
  const meta=GIANT_CLOTH[name],padding=12,d=source.density,x=source.x-padding,y=source.y-padding;
  const canvas=art.createCanvas();canvas.width=Math.ceil((source.w+padding*2)*d);canvas.height=Math.ceil((source.h+padding*2)*d);
  const g=canvas.getContext('2d'),output=g.createImageData(canvas.width,canvas.height),target=output.data,input=source.pixels;
  const lut=Array.from({length:256},(_,i)=>displacement(meta,i/255,phase/FRAMES*PERIOD,energy));
  for(let yy=0;yy<canvas.height;yy++){
    const worldY=y+(yy+.5)/d;
    for(let xx=0;xx<canvas.width;xx++){
      const worldX=x+(xx+.5)/d,u=clamp(((worldX-meta.root.x)*meta.flow.x+(worldY-meta.root.y)*meta.flow.y)/meta.length);
      // Displacement is perpendicular to flow; its projection is unchanged,
      // which gives an exact inverse without per-pixel iterative geometry.
      const offset=lut[Math.round(u*255)],sx=(worldX-offset.x-source.x)/source.w*source.width-.5,sy=(worldY-offset.y-source.y)/source.h*source.height-.5;
      const ix=Math.floor(sx),iy=Math.floor(sy);if(ix<0||iy<0||ix>=source.width-1||iy>=source.height-1)continue;
      const fx=sx-ix,fy=sy-iy,a=(iy*source.width+ix)*4,b=a+4,c=a+source.width*4,e=c+4;
      const wa=(1-fx)*(1-fy),wb=fx*(1-fy),wc=(1-fx)*fy,we=fx*fy,i=(yy*canvas.width+xx)*4;
      const alpha=input[a+3]*wa+input[b+3]*wb+input[c+3]*wc+input[e+3]*we;if(alpha<.5)continue;
      target[i+3]=alpha;
      for(let channel=0;channel<3;channel++)target[i+channel]=(input[a+channel]*wa+input[b+channel]*wb+input[c+channel]*wc+input[e+channel]*we)*255/alpha;
    }
  }
  g.putImageData(output,0,0);return {canvas,x,y,w:canvas.width/d,h:canvas.height/d};
}
export function drawGiantCloth(art,frame,name,time,energy=0){
  const source=sourcePixels(art,frame,name),g=art.g;
  if(!source){g.drawImage(frame.canvas,(frame.x-790)*SCALE,(frame.y-878)*SCALE,frame.w*SCALE,frame.h*SCALE);return;}
  const phase=Math.floor((((time/PERIOD)%1+1)%1)*FRAMES),power=Math.round(clamp(energy,0,2)*4)/4,key=`${name}:${phase}:${power}`;
  const cacheKey='giant:cloth-loops';let cache=art.cache.get(cacheKey);if(!cache){cache=new Map();art.cache.set(cacheKey,cache);}
  let rendered=cache.get(key);
  if(!rendered)rendered=warpedFrame(art,source,name,phase,power);
  cache.delete(key);cache.set(key,rendered);if(cache.size>LIMIT)cache.delete(cache.keys().next().value);
  g.drawImage(rendered.canvas,rendered.x,rendered.y,rendered.w,rendered.h);
}
