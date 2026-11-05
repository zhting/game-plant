import test from 'node:test';
import assert from 'node:assert/strict';
import {nightStars} from '../../games/contra2026/js/stage-one-classic.mjs';
import {STAGE_ONE_RAIN,rainEnvelope,rainStrength,jungleWind,FOREST_SPECIES,canopyOffset,drawWindForest,rainStreaks,rainSurface,rainSplashes,drawStageOneRain,windblownLeaves,drawWindblownLeaves} from '../../games/contra2026/js/stage-one-atmosphere.mjs';

test('树根整段固定，树冠持续随风摆动，远近层错开且相邻贴图不撕开',()=>{
  for(const far of [false,true]){
    const crowns=[];
    for(let t=0;t<8;t+=.1){
      for(const height of [0,.02,.05,.1])assert.equal(canopyOffset(t,height,far,1),0);
      crowns.push(canopyOffset(t,1,far,1));
    }
    assert.ok(Math.max(...crowns)-Math.min(...crowns)>(far?1:3));
  }
  assert.notEqual(canopyOffset(1,1),canopyOffset(1,1,true));
  const image={width:1120,height:176},draws=[];
  const g={drawImage:(...args)=>draws.push(args)};
  drawWindForest(g,image,0,68,280,44,1);
  const first=draws.splice(0);
  drawWindForest(g,image,278,68,280,44,1);
  for(let i=0;i<first.length;i++){
    assert.ok(Math.abs(draws[i][5]-first[i][5]-278)<1e-10,'tile overlap is constant at every height');
    assert.equal(draws[i][6],first[i][6]);
    assert.ok(first[i][2]+first[i][4]<=image.height+1e-9);
  }
  assert.equal(first.at(-1)[5],0);assert.equal(first.at(-1)[6]+first.at(-1)[8],112);
});

test('星点位置固定、独立闪烁明显，亮度不会越界或整片同步明灭',()=>{
  const base=nightStars(0,0),range=base.map(()=>[]);
  for(let t=0;t<6;t+=.1){
    const stars=nightStars(0,t);
    assert.deepEqual(stars.map(s=>[s.x,s.y]),base.map(s=>[s.x,s.y]));
    stars.forEach((s,i)=>{range[i].push(s.alpha);assert.ok(s.alpha>=.2&&s.alpha<=.96);});
  }
  assert.ok(range.every(a=>Math.max(...a)-Math.min(...a)>.5));
  const sample=nightStars(0,1.7);
  assert.ok(sample.some(s=>s.alpha<.35)&&sample.some(s=>s.alpha>.8));
});

test('出生点至关底始终有暴雨，原先的中段限制与停雨时间均不再生效',()=>{
  for(const x of [0,192,500,1080,1320,1600,2060,2340,3000,3334]){
    for(let t=0;t<=180;t+=.25){
      const rain=rainStrength(x,t);
      assert.ok(rain>=STAGE_ONE_RAIN.minimum&&rain<=STAGE_ONE_RAIN.maximum);
      assert.equal(rain,rainStrength(192,t),'the entire stage shares the same ongoing storm');
    }
    assert.ok(rainStreaks(x,0,rainStrength(x,0),true).length>200,'rain is visible on the very first frame');
  }
});

test('雨丝连续向左下方落下，暂停同一时刻不重排，远近层保留各自的世界视差',()=>{
  assert.deepEqual(rainStreaks(1300,1,0,true),[]);
  for(const foreground of [false,true]){
    const now=rainStreaks(1300,1,1,foreground),later=rainStreaks(1300,1.001,1,foreground);
    assert.deepEqual(now,rainStreaks(1300,1,1,foreground));
    const near=now.filter(p=>p.x>15&&p.x<370&&p.y>0&&p.y<200);
    const shift=foreground?1:.64,scrolled=rainStreaks(1301,1,1,foreground);
    for(const point of near){
      assert.ok(point.dx<0&&point.dy>0&&point.alpha>0&&point.alpha<.7);
      assert.ok(scrolled.some(p=>p.y===point.y&&Math.abs(p.x-point.x+shift)<1e-8));
      assert.ok(later.some(p=>p.y>point.y&&p.y-point.y<.5&&p.x<point.x&&point.x-p.x<.55));
    }
  }
});

test('持续暴雨的雨势随阵风平滑起伏，原来的停雨时段也保持大雨',()=>{
  const strengths=[];
  for(let t=0;t<90;t+=.1){
    const strength=rainStrength(1600,t);strengths.push(strength);
    assert.ok(strength>=.82&&strength<=1);assert.equal(strength,rainStrength(1600,t));
    assert.ok(Math.abs(strength-rainStrength(1600,t+.01))<.01);
    assert.equal(rainStrength(300,t),strength);
  }
  assert.equal(strengths.filter(s=>s===0).length,0);
  assert.ok(Math.max(...strengths)-Math.min(...strengths)>.1,'gusts still change storm strength');
  assert.ok(rainEnvelope(28)>=.82);assert.ok(rainEnvelope(43)>=.82);
  const light=rainStreaks(1600,15,.2,true),heavy=rainStreaks(1600,15,1,true);
  assert.ok(heavy.length>light.length*2);assert.ok(heavy[0].dy>light[0].dy);
});

test('棕榈、阔叶和蕨类按各自的频率及位置相位摆动，根部始终固定',()=>{
  assert.equal(new Set(FOREST_SPECIES.map(s=>s.frequency)).size,4);
  const waves=FOREST_SPECIES.map((_,type)=>Array.from({length:40},(_,i)=>canopyOffset(i/10,1,false,.6,117,type)));
  for(let type=0;type<waves.length;type++){
    assert.ok(waves[type].some(x=>Math.abs(x)>.1));
    assert.notDeepEqual(waves[type],Array.from({length:40},(_,i)=>canopyOffset(i/10,1,false,.6,148,type)));
    for(let t=0;t<4;t+=.1)assert.equal(canopyOffset(t,.1,false,1,117,type),0);
  }
  for(let a=0;a<waves.length;a++)for(let b=a+1;b<waves.length;b++)assert.notDeepEqual(waves[a],waves[b]);
});

test('雨落在最上方有效地面或水面，不穿过平台、岩层；雨停后不残留溅水',()=>{
  const solids=[{x:100,y:144,w:200,g:1},{x:150,y:90,w:40,g:0},{x:220,y:80,w:40,g:0,gone:true},{x:400,y:200,w:100,g:1,water:true}],water={surf:186};
  assert.deepEqual(rainSurface(160,solids,water),{y:90,wet:false});
  assert.deepEqual(rainSurface(230,solids,water),{y:144,wet:false});
  assert.deepEqual(rainSurface(450,solids,water),{y:186,wet:true});
  assert.deepEqual(rainSplashes(0,1,0,solids,water),[]);
  const surfaces=new Set();
  for(let t=0;t<2;t+=.1)for(const s of rainSplashes(0,t,1,solids,water)){
    assert.equal(s.y,rainSurface(s.x,solids,water).y);surfaces.add(s.wet);
  }
  assert.deepEqual([...surfaces].sort(),[false,true]);
  let start;const lines=[];
  const g=new Proxy({globalAlpha:.8,save(){},restore(){},moveTo:(x,y)=>{start={x,y};},lineTo:(x,y)=>lines.push({start,end:{x,y}})},{get:(o,k)=>k in o?o[k]:()=>{}});
  drawStageOneRain(g,0,1,1,{solids,water},true);
  for(const line of lines.filter(l=>l.end.y>=l.start.y)){
    assert.ok(line.end.y<=rainSurface(line.start.x,solids,water).y+1e-9);
  }
});

test('阵风平滑加速，树冠在暴雨中明显加大摆幅并顺风弯曲，树根仍不漂移',()=>{
  for(let t=0;t<12;t+=.05){
    const wind=jungleWind(t),later=jungleWind(t+.0001);
    assert.ok(wind.gust>=0&&wind.gust<=1&&wind.speed>=88);
    assert.ok(Math.abs((later.travel-wind.travel)/.0001-wind.speed)<.01);
  }
  for(let species=0;species<FOREST_SPECIES.length;species++){
    let calm=0,storm=0,lean=0;
    for(let t=0;t<24;t+=.1){
      calm+=canopyOffset(t,1,false,0,117,species)**2;
      const offset=canopyOffset(t,1,false,1,117,species);storm+=offset**2;lean+=offset;
      assert.equal(canopyOffset(t,.1,false,1,117,species),0);
    }
    assert.ok(storm>calm*4);assert.ok(lean<0);
  }
  const drops=[...rainStreaks(1300,15,1),...rainStreaks(1300,15,1,true)];
  assert.ok(drops.length>650,'dense foreground and background downpour');
  assert.ok(drops.reduce((sum,d)=>sum+d.dy,0)/drops.length>15,'long visible storm streaks');
  assert.ok(drops.every(d=>-d.dx/d.dy>.45),'wind drives all rain at a clear diagonal');
  for(const type of [0,1,2]){
    const crowns=Array.from({length:240},(_,i)=>canopyOffset(i/10,1,false,rainStrength(192,i/10),117,type));
    assert.ok(Math.max(...crowns)-Math.min(...crowns)>15,'tree crowns visibly bend through gusts');
  }
});

test('落叶随阵风翻卷并沿世界坐标飞行，暂停不变，镜头移动不会把叶片贴在屏幕上',()=>{
  const options={solids:[{x:1080,y:152,w:1260,h:64,g:1}],water:{surf:186}},before=JSON.stringify(options);
  for(const foreground of [false,true]){
    const now=windblownLeaves(1300,15,1,options,foreground),later=windblownLeaves(1300,15.01,1,options,foreground),scrolled=windblownLeaves(1301,15,1,options,foreground);
    assert.ok(now.length>8);assert.deepEqual(now,windblownLeaves(1300,15,1,options,foreground));
    assert.deepEqual(windblownLeaves(1300,15,0,options,foreground),[]);
    assert.ok(windblownLeaves(1300,15,.2,options,foreground).length<now.length);
    assert.ok(new Set(now.map(l=>l.kind)).size>1);
    for(const leaf of now.filter(l=>l.x>8&&l.x<376)){
      const moved=scrolled.find(l=>l.id===leaf.id),next=later.find(l=>l.id===leaf.id);
      assert.ok(moved&&next);assert.ok(Math.abs(moved.x-leaf.x+(foreground?1:.64))<1e-8);assert.equal(moved.y,leaf.y);
      assert.ok(next.x<leaf.x&&leaf.x-next.x<5);assert.notEqual(next.angle,leaf.angle);assert.ok(leaf.flip>=.15&&leaf.flip<=1);
      assert.ok(leaf.curl>=-.55&&leaf.curl<=.55);assert.equal(typeof leaf.back,'boolean');
      assert.ok(leaf.y<rainSurface(1300+leaf.x,options.solids,options.water).y||!foreground);
    }
  }
  const stack=[],g=new Proxy({globalAlpha:.6,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();}},{get:(o,k)=>k in o?o[k]:()=>{}});
  drawWindblownLeaves(g,1300,15,1,options,true);assert.equal(g.globalAlpha,.6);assert.equal(stack.length,0);assert.equal(JSON.stringify(options),before);
});

test('开始时已有翻卷落叶，雨林地面持续溅水，强阵风会同时改变雨丝斜度和树冠',()=>{
  const solids=[{x:0,y:112,w:240,g:1},{x:240,y:144,w:1000,g:1}],options={solids,water:{surf:186}};
  const initial=windblownLeaves(0,0,rainStrength(192,0),options,true);
  assert.ok(initial.length>20);assert.ok(new Set(initial.map(l=>l.back)).size===2);
  for(const t of [0,5,15,28,43,90]){
    const rain=rainStrength(0,t),splashes=rainSplashes(0,t,rain,solids,options.water);
    assert.ok(splashes.length>25,'ground splashes remain dense throughout the level');
    assert.ok(splashes.some(s=>!s.wet&&s.alpha>.5));assert.ok(splashes.every(s=>s.lean<0));
  }
  const times=Array.from({length:240},(_,i)=>i/10).sort((a,b)=>jungleWind(a).speed-jungleWind(b).speed),calm=times[0],gust=times.at(-1);
  const slope=t=>{const drops=rainStreaks(0,t,1,true);return drops.reduce((sum,d)=>sum-d.dx/d.dy,0)/drops.length;};
  assert.ok(slope(gust)>slope(calm)*1.5,'rain responds to gusts with a visibly stronger slant');
});
