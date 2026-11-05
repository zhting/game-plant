// Stage 4: red-floor Base II. Simulation coordinates match the base projection.
export const STAGE_FOUR_ROOMS=Object.freeze([
  {name:'外围警戒室',code:'01',guns:[132,252],high:true,sol:6,chg:.2,rol:3,rolSpd:.48,supply:['M','d']},
  {name:'弹药输送室',code:'02',guns:[124,148,236,260],rails:1,sol:8,chg:.28,rol:5,rolSpd:.5,supply:['L','e']},
  {name:'升降控制室',code:'03',guns:[130,254],high:true,rails:2,sol:9,chg:.33,rol:6,rolSpd:.52,supply:['S','f']},
  {name:'中央防卫室',code:'04',guns:[124,148,236,260],high:true,rails:1,sol:10,chg:.38,rol:7,rolSpd:.55,supply:['M','n']},
  {name:'双生投影中枢',code:'05',boss:'twin'}
].map(Object.freeze));

export const STAGE_FOUR_DEVICES=Object.freeze([
  {id:'upper',x:178,y:78,w:28,h:18},
  ...[111,178,245].map((x,i)=>({id:'lower'+i,x,y:119,w:28,h:18}))
].map(t=>Object.freeze({...t,k:'device',hp:7,max:7,fireT:3,flash:0})));

export const makeTwinProjections=()=>[-1,1].map((side,id)=>({
  k:'twin',id,side,x:192+side*46-21,y:52,w:42,h:25,hp:30,max:30,
  solid:true,opacity:1,split:0,flash:0,fireT:1.2+id*.6
}));

export const STAGE_FOUR_GALLERY_TIERS=Object.freeze([107,137]);
const armoredKinds=new Set(['gun','rail','switch','core','device']);
export const stageFourFacilityClosed=t=>t.hp>0&&!!t.armored&&t.aperture<.995;
export function initStageFourDefenses(base){
  base.shutterTime=0;base.gallery=[];base.galleryTimers=[.8,1.45,2.1,2.75];base.galleryId=0;
  base.targets.forEach((t,i)=>{if(armoredKinds.has(t.k))Object.assign(t,{armored:true,aperture:1,armorPhase:i*.59});});
}
export function advanceStageFourShutters(base,dt){
  base.shutterTime=(base.shutterTime||0)+dt;
  for(const t of base.targets){
    if(!t.armored||t.hp<=0)continue;
    if(base.shutterTime<.85){t.aperture=1;continue;}
    const phase=(base.shutterTime-.85+t.armorPhase)%3.6;
    t.aperture=phase<1.25?1:phase<1.5?1-smooth((phase-1.25)/.25):phase<3.3?0:smooth((phase-3.3)/.3);
  }
}
export function stageFourGalleryBox(s){
  const left=s.side<0?92:230,right=s.side<0?154:292,x=Math.max(left,s.x-6),end=Math.min(right,s.x+6);
  return{x,y:s.y-24,w:Math.max(0,Math.min(12,end-x)),h:24};
}
export function stageFourGalleryTargets(base){
  return(base.gallery||[]).filter(s=>!s.dead&&s.hp>0).map(s=>({...stageFourGalleryBox(s),k:'gallery',hp:s.hp,galleryId:s.id})).filter(t=>t.w>0);
}
export function advanceStageFourGallery(base,dt){
  const shots=[];
  for(let lane=0;lane<4;lane++){
    base.galleryTimers[lane]-=dt;
    if(base.galleryTimers[lane]>0||base.gallery.some(s=>!s.dead&&s.lane===lane))continue;
    const tier=lane>>1,side=lane%2?1:-1,id=base.galleryId++;
    base.gallery.push({id,lane,tier,side,x:side<0?84:300,y:STAGE_FOUR_GALLERY_TIERS[tier],hp:1,st:'enter',anim:0,t:0});
    base.galleryTimers[lane]=5.8+(id%3)*.35;
  }
  for(const s of base.gallery){
    if(s.dead)continue;s.anim+=dt*8;if(s.flashT>0)s.flashT-=dt;
    const stop=s.side<0?(s.tier?104:131):(s.tier?280:253);
    if(s.st==='enter'){
      s.x-=s.side*Math.min(Math.abs(s.x-stop),dt*28);
      if(Math.abs(s.x-stop)<.01){s.st='aim';s.t=.85;}
    }else if(s.st==='aim'){
      s.t-=dt;if(s.t<=0){shots.push({x:s.x,y:s.y-15,tier:s.tier,id:s.id});s.st='leave';s.flashT=.09;}
    }else{s.x+=s.side*dt*34;if(s.x<78||s.x>306)s.dead=true;}
  }
  base.gallery=base.gallery.filter(s=>!s.dead);return shots;
}

const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
/** Continuous split/rejoin motion; no teleporting collision boxes. Frozen worlds
 * simply do not call this function. Every returned shot is deterministic. */
export function advanceTwinProjections(base,dt){
  base.bossTime+=dt;
  const t=base.bossTime,phase=t%8,twins=base.targets.filter(q=>q.k==='twin'&&q.hp>0),rage=twins.length===1;
  const spread=phase<2?46:phase<3?46-42*smooth(phase-2):phase<4.5?4:phase<5.5?4+54*smooth(phase-4.5):phase<7?58:58-12*smooth(phase-7);
  const center=192+Math.sin(t*.64)*35,shots=[];
  for(const twin of twins){
    twin.split=rage?0:smooth((spread-30)/24);
    twin.opacity=1-twin.split*.52;
    twin.solid=rage||spread<38;
    const destination=center+(rage?Math.sin(t*1.4)*54:twin.side*spread)-twin.w/2;
    twin.x+=(destination-twin.x)*Math.min(1,dt*9);
    twin.y=52+Math.sin(t*1.8+twin.id*.65)*2.5;
    twin.fireT-=dt;
    if(twin.fireT<=0){
      twin.fireT=rage?1.25:2.1;
      // The transparent projections are harmless until they come together.
      if(twin.solid)for(const offset of rage?[-48,0,48]:[-24,24])shots.push({
        x:twin.x+twin.w/2,y:twin.y+twin.h/2,offset,id:twin.id,phase:t
      });
    }
  }
  base.projectionSplit=twins.length>1&&twins.every(t=>!t.solid);
  return shots;
}
