import {HANGAR_CART_TUNNEL} from './stage-seven-layout.mjs?v=hangar-required-routes-1';

/** Visible steel occupies exactly the same rectangle as the solid obstacle. */
export function drawHangarBulkhead(art,s){
  const g=art.g,{x,y,w,h}=s;
  const metal=g.createLinearGradient(x,0,x+w,0);
  metal.addColorStop(0,'#111e20');metal.addColorStop(.1,'#69746a');metal.addColorStop(.17,'#2b3836');metal.addColorStop(.85,'#202f2d');metal.addColorStop(.94,'#7a806d');metal.addColorStop(1,'#111c1f');
  art.rect(x,y,w,h,metal);
  g.save();g.beginPath();g.rect(x+4,y,w-8,h-5);g.clip();
  const image=art.loaded.has('platformSteel')&&art.images.platformSteel;
  if(image){
    const tileH=40,tileW=tileH*image.naturalWidth/image.naturalHeight;
    for(let yy=y;yy<y+h;yy+=28)for(let xx=x;xx<x+w;xx+=tileW)g.drawImage(image,0,image.naturalHeight*.3,image.naturalWidth,image.naturalHeight*.7,xx,yy,tileW,28);
  }
  art.rect(x+4,y,w-8,h,'rgba(14,30,29,.28)');
  for(let yy=y+10;yy<y+h-8;yy+=28){
    art.rect(x+5,yy,w-10,18,'#142322');art.line(x+5,yy,x+w-5,yy,'#86907c',.6);
    for(let d=3;d<17;d+=3)art.line(x+7,yy+d,x+w-7,yy+d,'#42534b',.7);
    for(const xx of [x+6,x+w-6])art.disc(xx,yy+1.5,.6,'#d2b88a');
  }
  if(s.cartRoof){
    // Broad hanging machinery has vertical ribs, pipes and a lit pressure gauge.
    for(let xx=x+23;xx<x+w-10;xx+=29){
      art.rect(xx,y,3,h-8,'#182a29');art.line(xx+.6,y,xx+.6,y+h-9,'#8b9681',.6);
    }
    art.line(x+10,y+35,x+w-11,y+35,'#18211c',5);art.line(x+10,y+34,x+w-11,y+34,'#a0804d',2);
    for(let xx=x+18;xx<x+w-12;xx+=27)art.rect(xx,y+32,3,6,'#c5aa73');
    art.disc(x+w*.5,y+63,5,'#0a181b');art.disc(x+w*.5,y+63,3.8,'#b6b69b');
    art.line(x+w*.5,y+63,x+w*.5+2,y+61,'#8a4d2c',.8);
  }
  g.restore();
  art.line(x+1,y,x+1,y+h,'#a6a38b',.8);art.line(x+w-2,y,x+w-2,y+h,'#10191a',1.5);
  art.rect(x,y+h-5,w,4,'#bc914c');
  g.save();g.beginPath();g.rect(x,y+h-5,w,4);g.clip();
  for(let xx=x-5;xx<x+w;xx+=10)art.line(xx,y+h-1,xx+6,y+h-5,'#242b26',2.6);
  g.restore();art.line(x,y+h-.5,x+w,y+h-.5,'#d1c39c',.7);
}

/** Live rails leave the cart's insulated hopper above the electrical arcs. */
export function drawHangarCartTrack(art,camera){
  const q=HANGAR_CART_TUNNEL,g=art.g,time=art.state?.time||0;
  for(const r of q.roofs){
    if(r.x+r.w<camera-15||r.x>camera+400)continue;
    const x=r.x,y=q.ground;
    art.rect(x,y-3,r.w,3,'#15272c');art.line(x,y-2,x+r.w,y-2,'#83cbd1',.7);
    for(let xx=x+6;xx<x+r.w;xx+=14){
      art.rect(xx,y-2,4,3,'#1c2927');art.disc(xx+2,y-1,.65,'#d5bb89');
      const pulse=.45+.4*Math.pow(Math.sin(time*9+xx*.3),2),phase=Math.floor(time*18);
      const noise=n=>{const v=Math.sin(n*78.31+xx*.716+phase*4.13)*4375.19;return v-Math.floor(v);};
      g.save();g.globalAlpha=pulse;
      art.light(xx+5,y-4,10,'rgba(80,186,232,.21)');
      g.beginPath();g.moveTo(xx,y-2);
      for(let i=1;i<=5;i++)g.lineTo(xx+i*2+noise(i)*2,y-2-Math.sin(i/6*Math.PI)*(6+noise(i+7)*9));
      g.lineTo(xx+12,y-2);g.strokeStyle='rgba(69,171,244,.27)';g.lineWidth=2.6;g.stroke();
      g.strokeStyle='#6dc5f3';g.lineWidth=.8;g.stroke();g.strokeStyle='#e5fcff';g.lineWidth=.27;g.stroke();
      if(noise(18)>.6){g.beginPath();g.moveTo(xx+6,y-8);g.lineTo(xx+9,y-10);g.lineTo(xx+7,y-13);g.strokeStyle='#a9e6ff';g.lineWidth=.4;g.stroke();}g.restore();
    }
    for(const xx of [x,x+r.w-4]){art.rect(xx,y-5,4,5,'#553b26');art.rect(xx+.8,y-5,2.4,1,'#e5ad54');}
  }
  const sign=q.roofs[0].x-38;
  if(sign>camera-35&&sign<camera+400){
    art.rect(sign-15,111,30,23,'#101e20');art.line(sign-14,111,sign+14,111,'#9a9b77',.7);
    art.hudText('伏低',sign,113,'#efca85',5,'center');
    art.line(sign,122,sign,128,'#e7d19b',1);art.line(sign-2,126,sign,128,'#e7d19b',1);art.line(sign+2,126,sign,128,'#e7d19b',1);
  }
}
