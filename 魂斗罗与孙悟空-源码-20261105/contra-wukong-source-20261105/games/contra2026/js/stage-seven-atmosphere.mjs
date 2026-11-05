import {HANGAR_SECTIONS} from './stage-seven-layout.mjs?v=hangar-required-routes-1';
const mod=(value,period)=>((value%period)+period)%period;

/** Distinct work bays follow the actual route, rather than repeating with the texture. */
export function drawHangarRouteBackdrop(art,camera,time){
  const g=art.g;g.save();g.translate(-camera,0);
  const pipe=(x,y,w)=>{
    const copper=g.createLinearGradient(0,y-3,0,y+4);copper.addColorStop(0,'#25170d');copper.addColorStop(.25,'#b77630');copper.addColorStop(.4,'#e5a758');copper.addColorStop(.65,'#89511e');copper.addColorStop(1,'#211910');
    art.rect(x,y-3,w,7,copper);for(let xx=x+9;xx<x+w;xx+=54){art.rect(xx,y-4,4,9,'#3a3022');art.line(xx+1,y-3,xx+1,y+4,'#c39657',.65);}
  };
  for(const s of HANGAR_SECTIONS){
    if(s.end<camera||s.x>camera+384)continue;
    g.save();g.beginPath();g.rect(s.x,0,s.end-s.x,176);g.clip();
    if(s.style==='open'){
      // Keep the detailed factory wall and animated machinery visible. The
      // former opaque mask made this bay look like a missing background tile.
      const shade=g.createLinearGradient(s.x,0,s.end,0);shade.addColorStop(0,'rgba(4,10,12,0)');shade.addColorStop(.08,'rgba(4,10,12,.28)');shade.addColorStop(.92,'rgba(4,10,12,.28)');shade.addColorStop(1,'rgba(4,10,12,0)');art.rect(s.x,19,s.end-s.x,157,shade);
      // Recessed steel frames move more slowly than the foreground columns.
      const shift=mod(camera*.65,132);
      for(let x=s.x-132+shift;x<s.end+132;x+=132){
        art.rect(x,36,3,126,'rgba(62,82,76,.25)');art.line(x+.4,38,x+.4,160,'rgba(134,152,129,.22)',.6);
        art.line(x+3,43,x+131,43,'rgba(93,114,99,.3)',2.5);art.line(x+3,47,x+131,47,'rgba(8,20,22,.6)',1);
        art.line(x+4,64,x+35,151,'rgba(69,92,83,.23)',1.2);art.line(x+129,64,x+98,151,'rgba(69,92,83,.23)',1.2);
        const lamp=x+66,pulse=.8+.12*Math.sin(time*.7+x*.02);
        art.rect(lamp-5,51,10,4,'rgba(10,19,21,.7)');art.line(lamp-4,51,lamp+4,51,'rgba(137,143,115,.5)',.6);
        g.save();g.globalAlpha=pulse;art.rect(lamp-3.5,52,7,1.2,'#ad8958');art.light(lamp,55,19,'rgba(219,159,78,.1)');
        const beam=g.createLinearGradient(0,55,0,150);beam.addColorStop(0,'rgba(195,167,110,.045)');beam.addColorStop(1,'rgba(195,167,110,0)');g.fillStyle=beam;g.beginPath();g.moveTo(lamp-2,55);g.lineTo(lamp+2,55);g.lineTo(lamp+30,150);g.lineTo(lamp-30,150);g.closePath();g.fill();g.restore();
      }
    }else if(s.style==='rail'){
      art.rect(s.x,100,s.end-s.x,76,'rgba(0,10,12,.6)');
      for(const x of [s.x+56,s.x+216,s.x+390]){
        g.fillStyle='#152e2c';g.beginPath();g.moveTo(x-26,176);g.lineTo(x-26,139);g.lineTo(x-16,128);g.lineTo(x+16,128);g.lineTo(x+26,139);g.lineTo(x+26,176);g.closePath();g.fill();
        g.fillStyle='#020a0d';g.beginPath();g.moveTo(x-22,176);g.lineTo(x-22,140);g.lineTo(x-14,132);g.lineTo(x+14,132);g.lineTo(x+22,140);g.lineTo(x+22,176);g.closePath();g.fill();
        art.line(x-24,175,x-24,140,'#5f7d69',.7);art.line(x-23,139,x-15,130,'#7b8c70',.7);art.line(x-15,130,x+15,130,'#8c9675',.8);
        for(let xx=x-20;xx<x+20;xx+=4)art.line(xx,173,xx+6,168,'rgba(100,132,111,.25)',.6);
        art.disc(x+19,137,1,'#cb8d48');art.light(x+19,137,3,'rgba(210,137,57,.13)');
      }
    }else if(s.style==='press'){
      art.rect(s.x,18,s.end-s.x,11,'#172025');art.line(s.x,19,s.end,19,'#697267',.8);pipe(s.x,24,s.end-s.x);
      for(let xx=s.x+22;xx<s.end;xx+=80){art.rect(xx,27,4,10,'#283631');art.line(xx,29,xx+4,29,'#bd965d',.6);}
    }else if(s.style==='pipe'){
      art.rect(s.x,18,s.end-s.x,61,'rgba(3,9,10,.8)');for(const y of [27,40,53])pipe(s.x+8,y,s.end-s.x-16);
      for(const x of [2780,2835,2890]){art.rect(x-4,54,8,7,'#80592f');art.line(x-3,54,x+3,54,'#e4b06a',.8);}
    }
    g.restore();
    if(s.x>0&&s.id!=='pipe-hall'){
      const x=s.x+6,metal=g.createLinearGradient(x-5,0,x+5,0);metal.addColorStop(0,'#3c2717');metal.addColorStop(.35,'#a16529');metal.addColorStop(.52,'#df9d46');metal.addColorStop(.65,'#60411f');metal.addColorStop(1,'#211d16');
      art.rect(x-6,0,12,96,metal);art.line(x-4,0,x-4,94,'#d4a15a',.7);for(let y=9;y<94;y+=15){art.rect(x-5,y,10,2,'#2b2a21');art.disc(x-2,y+1,.6,'#d6b16e');}
    }
  }
  g.restore();
}

/** Background-only machinery follows world time, so pause freezes it too. */
export function hangarMachinery(camera,time){
  const shift=camera*.18,start=Math.floor((shift-160)/256),end=Math.ceil((shift+440)/256),machines=[];
  for(let i=start;i<=end;i++){
    const x=i*256+125-shift,y=66+mod(i,2)*31;
    if(x<-80||x>444)continue;
    const cycle=mod(time+i*1.7,6.8),steam=[];
    for(let j=0;j<7;j++){
      const age=cycle-j*.2;if(age<0||age>1.6)continue;
      steam.push({x:x+52+age*9+Math.sin(age*3+j)*1.5,y:y+38-age*21,r:1.8+age*4,alpha:Math.sin(age/1.6*Math.PI)*.18});
    }
    const sparks=[],weld=mod(time+i*2.2,9.4);
    if(weld<.85)for(let j=0;j<4;j++){
      const age=weld-j*.07;if(age<0)continue;
      sparks.push({x:x-48+age*(j-1.5)*8,y:y+33+age*13+age*age*19,alpha:Math.max(0,1-age/.85)});
    }
    machines.push({x,y,angle:time*(2.1+mod(i,3)*.17)+i,light:.45+.4*Math.pow(Math.sin(time*1.1+i*2.4),2),gauge:Math.sin(time*.8+i)*.35,steam,sparks});
  }
  return machines;
}

export function drawHangarAtmosphere(art,camera,time){
  const g=art.g;
  for(const m of hangarMachinery(camera,time)){
    const {x,y}=m;
    g.save();g.translate(x,y);g.scale(.72,.72);g.translate(-x,-y);g.globalAlpha=.76;
    // Inset ventilation housing: the blades turn behind a fixed protective grille.
    const panel=g.createLinearGradient(x-16,y-17,x+16,y+17);panel.addColorStop(0,'#475249');panel.addColorStop(.15,'#1a2927');panel.addColorStop(.55,'#253531');panel.addColorStop(1,'#0a1518');
    art.rect(x-17,y-18,34,36,'#10191b');art.rect(x-16,y-17,32,34,panel);
    art.line(x-15,y-16,x+15,y-16,'#697367',.65);
    for(const dx of [-13,13])for(const dy of [-14,14]){art.disc(x+dx,y+dy,1,'#0c1516');art.disc(x+dx-.2,y+dy-.2,.4,'#a1916f');}
    art.disc(x,y,13,'#080f12');art.disc(x,y,11.8,'#26373a');art.disc(x,y,10.7,'#080f12');
    g.save();g.translate(x,y);g.rotate(m.angle);
    for(let blade=0;blade<5;blade++){
      g.save();g.rotate(blade*Math.PI*2/5);const metal=g.createLinearGradient(0,0,10,-5);metal.addColorStop(0,'#152326');metal.addColorStop(.6,'#53675d');metal.addColorStop(1,'#283f3e');
      g.fillStyle=metal;g.beginPath();g.moveTo(1,-1);g.bezierCurveTo(7,-7,11,-5,10,-1);g.bezierCurveTo(8,2,4,1,1,1);g.closePath();g.fill();g.restore();
    }
    g.restore();
    for(const d of [-6,-2,2,6]){art.line(x-10,y+d,x+10,y+d,'rgba(9,18,20,.75)',.65);art.line(x+d,y-10,x+d,y+10,'rgba(15,25,26,.6)',.5);}
    art.disc(x,y,2.4,'#152326');art.disc(x-.5,y-.5,1.2,'#8d9a87');
    // Small instrument panel and pressure-controlled vent beside the fan.
    // Electrical conduit visually joins the two wall-mounted instruments.
    art.line(x+14,y+9,x+20,y+9,'#141d1e',3);art.line(x+20,y+9,x+20,y+28,'#141d1e',3);art.line(x+20,y+28,x+25,y+28,'#141d1e',3);
    art.line(x+14,y+8.5,x+20,y+8.5,'#7c7d63',.5);art.line(x+19.4,y+9,x+19.4,y+28,'#7c7d63',.5);
    const instruments=g.createLinearGradient(x+23,y+10,x+59,y+35);instruments.addColorStop(0,'#3f4d40');instruments.addColorStop(.12,'#23332e');instruments.addColorStop(.7,'#142623');instruments.addColorStop(1,'#0a171a');
    art.rect(x+23,y+10,36,25,instruments);art.line(x+24,y+10,x+58,y+10,'#66715c',.6);
    for(const dx of [25,57])for(const dy of [12,33]){art.disc(x+dx,y+dy,.6,'#0c1717');art.disc(x+dx-.1,y+dy-.1,.25,'#a4976c');}
    art.disc(x+32,y+21,5.2,'#081214');art.disc(x+32,y+21,4.5,'#525e4d');art.disc(x+32,y+21,3.6,'#999a7b');
    for(let i=0;i<5;i++){const a=-Math.PI+i*Math.PI/4;art.line(x+32+Math.cos(a)*2.7,y+21+Math.sin(a)*2.7,x+32+Math.cos(a)*3.6,y+21+Math.sin(a)*3.6,'#3b4438',.45);}
    const needle=-1.2+m.gauge;art.line(x+32,y+21,x+32+Math.cos(needle)*3.1,y+21+Math.sin(needle)*3.1,'#6e3422',.65);
    for(let i=0;i<3;i++){
      const lx=x+43+i*5;art.rect(lx-1,y+16,2.7,2.2,'#060f11');g.save();g.globalAlpha=.55+m.light*.45;
      art.disc(lx+.3,y+17,1,i===2?'#db8b39':'#80a886');g.restore();
    }
    for(let i=0;i<3;i++)art.rect(x+42,y+23+i*2.3,13,.6,'#42534c');
    art.rect(x+49,y+34,6,3,'#323f3b');art.line(x+50,y+34,x+54,y+34,'#6d7463',.6);
    for(let i=0;i<12;i++){const xx=x-14+mod(i*17.3,27),yy=y-14+mod(i*11.7,29);art.line(xx,yy,xx+1.2,yy-.25,i%3?'rgba(140,137,99,.19)':'rgba(5,14,14,.6)',.35);}
    for(const puff of m.steam){g.save();g.globalAlpha=puff.alpha;const fog=g.createRadialGradient(puff.x,puff.y,0,puff.x,puff.y,puff.r);fog.addColorStop(0,'#adc6bd');fog.addColorStop(1,'rgba(140,174,164,0)');art.disc(puff.x,puff.y,puff.r,fog);g.restore();}
    for(const spark of m.sparks){g.save();g.globalAlpha=spark.alpha*.7;art.line(spark.x,spark.y,spark.x-.5,spark.y-1.8,'#efa460',.5);g.restore();}
    g.restore();
  }
}
