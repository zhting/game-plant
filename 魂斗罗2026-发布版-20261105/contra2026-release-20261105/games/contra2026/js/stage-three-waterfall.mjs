import { STAGE_THREE } from './stage-three-layout.mjs?v=boss-detail-1';

const wrap=(n,d)=>((n%d)+d)%d;
const noise=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return((n^(n>>>16))>>>0)/4294967296;};

export function summitStars(time){
  return Array.from({length:68},(_,i)=>{
    const pulse=(Math.sin(time*(.75+noise(i+712)*1.5)+noise(i+173)*Math.PI*2)+1)/2;
    return{x:5+noise(i*37+81)*374,y:STAGE_THREE.top+5+noise(i*61+24)*115,
      size:i%11===0?1.05:.45+noise(i+40)*.3,alpha:.18+pulse*pulse*(i%11===0?.72:.58),bright:i%11===0};
  });
}

function layer(art,flow){
  if(!art.loaded.has('waterfall'))return null;
  const key=flow?'waterfall:flow':'waterfall:depth';
  if(art.cache.has(key))return art.cache.get(key);
  const image=art.images.waterfall,w=Math.floor(image.naturalWidth/2),h=image.naturalHeight;
  const canvas=art.createCanvas();canvas.width=w;canvas.height=h;
  const g=canvas.getContext('2d');
  g.filter=flow?'saturate(.82) brightness(.9)':'saturate(.76) brightness(.66)';
  g.drawImage(image,flow?w:0,0,w,h,0,0,w,h);g.filter='none';
  // The opaque cliff fades in over its preceding bottom. Transparent flow also
  // fades OUT at the bottom, so overlapping .4-alpha tiles never end on a bar.
  g.globalCompositeOperation='destination-in';
  const mask=g.createLinearGradient(0,0,0,flow?h:h*.12);
  mask.addColorStop(0,'rgba(0,0,0,0)');
  if(flow){mask.addColorStop(.12,'#000');mask.addColorStop(.88,'#000');mask.addColorStop(1,'rgba(0,0,0,0)');}
  else mask.addColorStop(1,'#000');
  g.fillStyle=mask;g.fillRect(0,0,w,h);
  const result={canvas,height:384*h/w};art.cache.set(key,result);return result;
}

function loop(g,texture,phase){
  const height=texture.height,stride=height*.88,offset=wrap(phase,stride);
  for(let y=offset-stride*2;y<216;y+=stride){
    if(y+height>0)g.drawImage(texture.canvas,0,y,384,height);
  }
}

function mist(art){
  const key='waterfall:mist';if(art.cache.has(key))return art.cache.get(key);
  const canvas=art.createCanvas();canvas.width=384;canvas.height=96;
  const g=canvas.getContext('2d');g.translate(192,48);g.scale(1,.25);
  const glow=g.createRadialGradient(0,0,2,0,0,192);
  glow.addColorStop(0,'rgba(178,219,237,.4)');glow.addColorStop(.5,'rgba(143,193,220,.16)');glow.addColorStop(1,'rgba(121,174,204,0)');
  g.fillStyle=glow;g.fillRect(-192,-192,384,384);art.cache.set(key,canvas);return canvas;
}

function summitWall(art,cy){
  const top=STAGE_THREE.top+78,bottom=STAGE_THREE.stoneLine,h=bottom-top+24;
  if(cy+216<=top||cy>=bottom+24)return;
  const density=Math.min(6,art.scale),key='waterfall:summit-wall:'+density;let canvas=art.cache.get(key);
  if(!canvas){
    canvas=art.createCanvas();canvas.width=Math.ceil(384*density);canvas.height=Math.ceil(h*density);
    const g=canvas.getContext('2d');g.scale(density,density);
    // Whole volumetric stones form the skyline. No rectangular texture crop
    // cuts through their upper faces; lower rows overlap into the solid wall.
    g.fillStyle='#10191d';g.fillRect(0,43,384,h-43);
    if(art.loaded.has('boulderTurns')){
      const image=art.images.boulderTurns,cw=image.naturalWidth/4,ch=image.naturalHeight/2,pad=.045;
      g.filter='saturate(.2) brightness(.53)';
      for(let row=0;row*26<h+30;row++)for(let col=-1;col<13;col++){
        const seed=(row+1)*223+(col+3)*41,frame=Math.floor(noise(seed)*8);
        const w=44+noise(seed+1)*17,hh=31+noise(seed+2)*12;
        const x=col*33+(row%2)*16+noise(seed+3)*6,y=24+row*26+noise(seed+4)*(row===0?22:8);
        g.drawImage(image,(frame%4+pad)*cw,(Math.floor(frame/4)+pad)*ch,cw*(1-pad*2),ch*(1-pad*2),x-w/2,y-hh/2,w,hh);
      }
      g.filter='none';
    }else if(art.baseArt.loaded.has('rock')){
      g.save();g.beginPath();g.moveTo(0,h);g.lineTo(0,27);
      for(let x=0;x<=400;x+=20)g.quadraticCurveTo(x+10,8+noise(x+8)*22,x+20,24+noise(x+5)*15);
      g.lineTo(400,h);g.closePath();g.clip();g.filter='grayscale(1) brightness(.48)';
      for(let y=0;y<h;y+=192)for(let x=0;x<384;x+=192)g.drawImage(art.baseArt.images.rock,x,y,192,192);
      g.restore();
    }
    g.globalCompositeOperation='destination-in';const mask=g.createLinearGradient(0,h-46,0,h);
    mask.addColorStop(0,'#000');mask.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=mask;g.fillRect(0,0,384,h);
    art.cache.set(key,canvas);
  }
  art.g.drawImage(canvas,0,top-cy,384,h);
}

export function drawStageThreeWaterfall(art,cy,tick,solids=[]){
  const g=art.g,time=tick/60,boundary=STAGE_THREE.stoneLine-cy;
  art.rect(0,0,384,216,'#010305');
  if(cy<STAGE_THREE.stoneLine){
    g.save();
    for(const star of summitStars(time)){
      const y=star.y-cy;if(y<0||y>216)continue;
      g.globalAlpha=star.alpha;art.rect(star.x,y,star.size,star.size,star.bright?'#d5e8fa':'#adc5db');
      if(star.bright&&star.alpha>.68){g.globalAlpha=star.alpha*.42;art.line(star.x-.7,y+.5,star.x+1.7,y+.5,'#d5e8fa',.3);art.line(star.x+.5,y-.7,star.x+.5,y+1.7,'#d5e8fa',.3);}
    }
    g.restore();
  }
  if(boundary<216){
    const start=Math.max(0,boundary-20);g.save();g.beginPath();g.rect(0,start,384,216-start);g.clip();
    art.rect(0,start,384,216-start,'#102b40');
    const depth=layer(art,false),flow=layer(art,true);
    if(depth)loop(g,depth,-cy*.28);
    if(flow){g.globalAlpha=.4;loop(g,flow,time*64-cy*.76);g.globalAlpha=1;}
    // Independently moving broken foam adds speed without translating the rock
    // backdrop or returning to the old repeating rows of horizontal waves.
    for(let i=0;i<58;i++){
      const x=noise(i*97+13)*384+Math.sin(time*.7+i)*.7;
      const y=wrap(time*(84+noise(i+9)*68)+i*37-cy*.82,260)-22;
      g.globalAlpha=.12+noise(i+1)*.21;
      art.line(x,y,x+Math.sin(time+i)*.45,y+3+noise(i+5)*10,'#d5f1ff',.35+noise(i+2)*.38);
      if(i%3===0)art.disc(x+.5,y+1.7,.4,'#e5f7ff');
    }
    const vapor=mist(art);
    for(let i=0;i<3;i++){
      const x=45+noise(i+22)*285+Math.sin(time*.36+i*1.7)*19;
      const y=wrap(i*91+time*5-cy*.58,280)-30;
      g.globalAlpha=.21;g.drawImage(vapor,x-80,y-19,160,38);
    }
    // Spray stays behind the foreground ledges and below the walking lip.
    for(const s of solids){
      if(s.drift||s.flameBridge||s.summit||s.y<=STAGE_THREE.stoneLine||s.y<cy-30||s.y>cy+220)continue;
      for(const [x,dir]of [[s.x,-1],[s.x+s.w,1]]){
        if(x<6||x>378)continue;
        for(let i=0;i<4;i++){
          const p=wrap(time*1.4+i*.27+noise(Math.floor(s.y)+i),1);
          g.globalAlpha=(1-p)*.27;const xx=x+dir*(1+p*5),yy=s.y-cy+6+p*13;
          art.line(xx,yy,xx+dir*.6,yy+1.3+p*2.5,'#bddfee',.45);
        }
        g.globalAlpha=.18;g.drawImage(vapor,x-17,s.y-cy+4,34,12);
      }
    }
    g.globalAlpha=1;
    if(boundary>0){
      const shade=g.createLinearGradient(0,boundary-20,0,boundary+22);
      shade.addColorStop(0,'#111e29');shade.addColorStop(1,'rgba(17,30,41,0)');g.fillStyle=shade;g.fillRect(0,boundary-20,384,42);
    }
    g.restore();
  }
  summitWall(art,cy);
}
