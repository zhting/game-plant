// Ambient motion uses the shared scene clock; it never adds gameplay entities.
const wrap=(n,d)=>((n%d)+d)%d;
const clamp=n=>Math.max(0,Math.min(1,n));
const noise=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return((n^(n>>>16))>>>0)/4294967296;};
export const HEAVEN_PANORAMA=Object.freeze({width:2172,height:724,drawWidth:660,drawHeight:220,parallax:.075});
// Source-pixel bounds of the waterfalls in the existing panorama.
export const HEAVEN_WATERFALLS=Object.freeze([
  {x:29,y:286,w:32,h:135,speed:70},
  {x:257,y:298,w:48,h:148,speed:91},
  {x:399,y:329,w:32,h:114,speed:78},
  {x:530,y:318,w:42,h:111,speed:73},
  {x:824,y:239,w:65,h:167,speed:106},
  {x:1150,y:342,w:64,h:133,speed:96},
  {x:1306,y:388,w:43,h:102,speed:79},
  {x:1450,y:389,w:56,h:112,speed:87}
].map(Object.freeze));

export function heavenTime(state={},tick=0){
  if(state.mode==='cine')return state.cine?.t??tick/60;
  if(['title','lobby','select'].includes(state.mode)||(state.mode==='settings'&&state.settingsFrom==='title'))return tick/60;
  return state.time??tick/60;
}

export function fairyFlight(time,camera=0){
  const cycle=Math.floor(Math.max(0,time)/38),seed=noise(cycle*73+17);
  const start=6+seed*5,duration=13+noise(cycle*31+5)*3;
  const age=time-cycle*38-start;
  if(age<0||age>duration)return null;
  const u=age/duration,face=cycle%2?-1:1;
  return {x:(face>0?-44+472*u:428-472*u)-camera*.018,
    y:43+noise(cycle*47+8)*23+Math.sin(u*Math.PI)*4+Math.sin(time*1.3)*.8,
    height:20+noise(cycle*13+22)*5,face,
    alpha:.86*clamp(age/.8)*clamp((duration-age)/1.1),phase:time*1.8+seed*4};
}

function canvas(art,w,h){
  const c=art.createCanvas();c.width=w;c.height=h;return c;
}

function cloudTexture(art){
  const image=art.images.cloudSea;if(!image?.naturalWidth)return null;
  const key='heaven:clouds';if(art.cache.has(key))return art.cache.get(key);
  const c=canvas(art,768,256),g=c.getContext('2d');
  g.drawImage(image,0,0,768,256);g.globalCompositeOperation='destination-in';
  const vertical=g.createLinearGradient(0,0,0,256);
  vertical.addColorStop(0,'#000');vertical.addColorStop(.56,'#000');vertical.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=vertical;g.fillRect(0,0,768,256);
  const horizontal=g.createLinearGradient(0,0,768,0);
  horizontal.addColorStop(0,'rgba(0,0,0,0)');horizontal.addColorStop(.09,'#000');
  horizontal.addColorStop(.91,'#000');horizontal.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=horizontal;g.fillRect(0,0,768,256);
  art.cache.set(key,c);return c;
}

function clouds(art,camera,time){
  const texture=cloudTexture(art);if(!texture)return;
  const g=art.g;g.save();
  for(const layer of [
    {w:350,h:104,y:39,speed:1.2,parallax:.035,alpha:.16,phase:63},
    {w:414,h:118,y:111,speed:2.8,parallax:.12,alpha:.32,phase:158}
  ]){
    const stride=layer.w*.84,offset=wrap(time*layer.speed+camera*layer.parallax+layer.phase,stride);
    g.globalAlpha=layer.alpha;
    const y=layer.y+Math.sin(time*.28+layer.phase)*1.8;
    for(let x=-offset-stride;x<384;x+=stride)if(x+layer.w>0)g.drawImage(texture,x,y,layer.w,layer.h);
  }
  g.restore();
}

function waterfallTexture(art,fall,index){
  const image=art.images.heaven;if(!image?.naturalWidth)return null;
  const key='heaven:waterfall:'+index;if(art.cache.has(key))return art.cache.get(key);
  const {x,y,w,h}=fall,mask=canvas(art,w,h),mg=mask.getContext('2d',{willReadFrequently:true});
  mg.drawImage(image,x,y,w,h,0,0,w,h);
  const pixels=mg.getImageData(0,0,w,h);
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
    const i=(yy*w+xx)*4,r=pixels.data[i],green=pixels.data[i+1],b=pixels.data[i+2];
    // Isolate blue-white water pixels; buildings, foliage and rock stay rigid.
    const cool=clamp((b-r+1)/18)*clamp((green-r+3)/16)*clamp((green-151)/48);
    const white=clamp((Math.min(r,green,b)-205)/25)*clamp((b-r+20)/20)*clamp((green-r+15)/15);
    const water=Math.max(cool,white);
    const feather=clamp(yy/11)*clamp((h-1-yy)/18)*clamp(xx/5)*clamp((w-1-xx)/5);
    pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;
    pixels.data[i+3]=Math.round(255*water*feather);
  }
  mg.putImageData(pixels,0,0);
  const texture=canvas(art,w,h),tg=texture.getContext('2d');
  tg.filter='brightness(1.10) saturate(.7)';
  tg.drawImage(image,x,y+h*.15,w,h*.66,0,0,w,h);
  const flow=canvas(art,w,h),fg=flow.getContext('2d');
  const result={mask,texture,flow,fg};art.cache.set(key,result);return result;
}

function waterfalls(art,camera,time){
  const image=art.images.heaven;if(!image?.naturalWidth)return;
  const sx=HEAVEN_PANORAMA.drawWidth/HEAVEN_PANORAMA.width;
  const sy=HEAVEN_PANORAMA.drawHeight/HEAVEN_PANORAMA.height;
  const shift=camera*HEAVEN_PANORAMA.parallax,g=art.g;g.save();
  for(const [index,fall]of HEAVEN_WATERFALLS.entries()){
    const x=fall.x*sx-shift,w=fall.w*sx,h=fall.h*sy;
    if(x+w<-8||x>392)continue;
    const layer=waterfallTexture(art,fall,index);if(!layer)continue;
    const fg=layer.fg,phase=wrap(time*fall.speed+index*23,fall.h);
    fg.globalCompositeOperation='source-over';fg.clearRect(0,0,fall.w,fall.h);
    for(const y of [phase-fall.h,phase])fg.drawImage(layer.texture,0,y);
    for(let i=0;i<9;i++){
      const xx=3+noise(i*17+index*91)*(fall.w-6),yy=wrap(time*(fall.speed+19)+i*31,fall.h);
      fg.strokeStyle='rgba(238,253,255,.40)';fg.lineWidth=.8+noise(i+index)*1.1;
      fg.beginPath();fg.moveTo(xx,yy-12);fg.lineTo(xx+.5,yy+7+noise(i+3)*12);fg.stroke();
    }
    fg.globalCompositeOperation='destination-in';fg.drawImage(layer.mask,0,0);
    g.globalAlpha=.53;g.drawImage(layer.flow,x,fall.y*sy,w,h);
    const mx=x+w*.52+Math.sin(time*.7+index)*1.3,my=(fall.y+fall.h)*sy;
    const mist=g.createRadialGradient(mx,my,0,mx,my,w*.85+2);
    mist.addColorStop(0,'rgba(236,250,255,.15)');mist.addColorStop(1,'rgba(236,250,255,0)');
    g.fillStyle=mist;g.globalAlpha=.6+Math.sin(time*.9+index)*.12;
    g.beginPath();g.ellipse(mx,my,w*1.2+3,3.2,0,0,Math.PI*2);g.fill();
  }
  g.restore();
}

function fairies(art,camera,time){
  const image=art.images.fairy,flight=fairyFlight(time,camera);
  if(!image?.naturalWidth||!flight)return;
  const g=art.g,fw=image.naturalWidth/2,fh=image.naturalHeight/2;
  const frame=Math.floor(wrap(flight.phase,4)),sx=(frame%2)*fw,sy=Math.floor(frame/2)*fh;
  const h=flight.height,w=h*fw/fh;
  g.save();g.translate(flight.x,flight.y);g.scale(flight.face,1);
  g.rotate(Math.sin(time*.8)*.018);g.globalAlpha=flight.alpha;
  // Keep the head steady while the lower silk hems continue to ripple.
  for(let y=0;y<fh;y+=48){
    const sh=Math.min(48,fh-y),v=y/fh,weight=clamp((v-.25)/.75);
    const sway=Math.sin(time*3.2-v*5)*weight*.65;
    g.drawImage(image,sx,sy+y,fw,sh,-w*.72+sway,-h*.32+v*h,w,sh/fh*h+.04);
  }
  g.restore();
}

export function drawHeavenAtmosphere(art,camera,tick){
  const time=heavenTime(art.state,tick);
  waterfalls(art,camera,time);clouds(art,camera,time);fairies(art,camera,time);
}
