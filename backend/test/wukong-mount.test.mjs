import test from 'node:test';
import assert from 'node:assert/strict';
import { engine } from './wukong-engine.test.mjs';
import { STAFF_VARIANTS, advanceStaff, staffGeometry, staffCopies } from '../../games/wukong/js/wukong-combat.mjs';
import { attackPose } from '../../games/wukong/js/wukong-motion.mjs';
import { actorRootY, beastMotion, riderLegs } from '../../games/wukong/js/wukong-mount.mjs';
import { RUN_BONES } from '../../games/contra2026/js/stage-one-motion.mjs';
import { bodyPoint, WUKONG_HIPS } from '../../games/wukong/js/wukong-locomotion.mjs';
import { multiArmActors } from '../../games/wukong/js/wukong-magic.mjs';
import { packWorld, unpackWorld } from '../../games/contra2026/js/coop-core.mjs';
import { STAFF_SEQUENCES } from '../../games/wukong/js/wukong-staff-sequences.mjs';

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const tick=(e,n,input={})=>{for(const k of Object.keys(e.K))e.K[k]=false;Object.assign(e.K,input);for(let i=0;i<n;i++){for(let pause=0;e.G.mode==='play'&&e.G.hitStop>0&&pause<12;pause++)e.step();e.step();}};
function scene(theme=true){
  const e=engine(theme);e.G.en=[];e.G.eb=[];e.G.pods=[];e.G.podTrig=[];delete e.G.wukongFlights;
  e.G.spawnT=999;e.G.freezeT=999;e.G.p.invT=999;Object.assign(e.G.p,{x:150,y:112,onGround:true,face:1});return e;
}
function take(e,kind){e.G.items=[{kind,x:e.G.p.x,y:e.G.p.y-5,fromPod:true,landed:true,rest:true}];e.collide();assert.equal(e.G.items[0].dead,true);}
function mount(e){take(e,'m');e.G.p.spCd=0;tick(e,1,{KeyL:true});assert.equal(e.G.p.ride,'moto');}
const foe=(x=185,y=112,hp=1000)=>({t:'snp',x,y,hp,maxHp:hp,fireT:999,face:-1,ax:-1,ay:0,flash:0});

test('原摩托道具实际拾取 L 召出麒麟，保留十五秒时限、加速和二段跳物理，原版名称与载具不变',()=>{
  const skin=scene(),original=scene(false);mount(skin);mount(original);
  assert.match(skin.G.bannerText,/麒麟.*15/);assert.match(original.G.bannerText,/摩托车.*15/);
  assert.equal(skin.G.p.rideT,15);assert.equal(skin.wukong.itemLabel('m'),'麒麟');
  for(let i=0;i<65;i++){
    const input={KeyD:i<34,KeyK:i===10||i===20};tick(skin,1,input);tick(original,1,input);
    for(const key of ['x','y','vx','vy','onGround','airJumps','ride','rideT'])assert.equal(skin.G.p[key],original.G.p[key],key+' frame '+i);
  }
  const p=skin.G.p;p.rideT=.01;tick(skin,1);assert.equal(p.ride,null);assert.equal(actorRootY(p),p.y);
});

test('骑乘二十种棍法和多段连招均可实际命中，远敌无伤且不发子弹',()=>{
  for(const face of [-1,1])for(const variant of STAFF_VARIANTS){
    const e=scene();mount(e);const p=e.G.p;p.face=face;p.ax=face;p.cool=1;
    const near=foe(p.x+35*face),far=foe(p.x+200*face);e.G.en=[near,far];
    p.staff={kind:'sweep',variant,t:0,duration:.42,combo:1,face,aim:0,weapon:'rifle',hits:[]};
    tick(e,30);if(STAFF_SEQUENCES[variant]?.throwAt)assert.ok(near.hp>=989&&near.hp<=993,variant+' 去回棍与三段近战分别计伤');else assert.equal(near.hp,STAFF_SEQUENCES[variant]?993:998,variant+' '+face);assert.equal(far.hp,1000);
    assert.equal(e.G.pb.length,0);assert.equal(e.G.eb.length,0);assert.equal(p.ride,'moto');
  }
});

test('骑乘连招随机变换且腾跃中继续保持坐姿挥棍，不切换整身空翻',()=>{
  const e=scene();mount(e);const p=e.G.p,seen=new Set(),combos=new Set();
  for(let i=0;i<700;i++){tick(e,1,{KeyJ:!p.staff&&p.cool<=1/60&&!e.K.KeyJ});if(p.staff){seen.add(p.staff.variant);combos.add(p.staff.combo);}}
  assert.ok(seen.size>=12);assert.deepEqual([...combos].sort(),[1,2,3]);
  p.staff=null;p.cool=0;p.staffCombo=1;p.staffComboT=1;p.onGround=false;p.vy=-150;
  advanceStaff(p,{fire:true,down:true},0,{random:()=>.3});assert.equal(p.staff.kind,'backhand');assert.ok(STAFF_VARIANTS.includes(p.staff.variant));
  assert.equal(beastMotion(p).frame,3);assert.ok(riderLegs(p,attackPose(p)));
});

test('骑乘双方朝向和全部棍法的握点对齐同一世界坐标，弯曲双腿始终连接腰身且不被站姿替换',()=>{
  for(const face of [-1,1])for(const vx of [0,170])for(const variant of [null,...STAFF_VARIANTS])for(let i=0;i<32;i++){
    const p={x:150,y:112,ride:'moto',rideT:12,face,ax:face,ay:0,onGround:true,vx,anim:i*.12,statusTime:1.3,
      staff:variant?{kind:'sweep',variant,face,t:i/32*.4,duration:.4,combo:2,aim:0,weapon:'rifle'}:null};
    const before=JSON.stringify(p),pose=attackPose(p),q=variant?staffGeometry(p):null;
    if(q){
      const axis={x:q.tip.x-q.butt.x,y:q.tip.y-q.butt.y},length=Math.hypot(axis.x,axis.y);
      for(const arm of [pose.near,pose.far])if(arm.gripping){
        const x=p.x+face*arm.hand.x-q.butt.x,y=actorRootY(p)+arm.hand.y-q.butt.y;
        close((x*axis.y-y*axis.x)/length,0);assert.ok((x*axis.x+y*axis.y)/length**2>0);
      }
    }
    const legs=riderLegs(p,pose);assert.equal(legs.length,2);
    for(const [j,leg]of legs.entries()){
      assert.deepEqual(leg.hip,bodyPoint(pose,WUKONG_HIPS[j].x,WUKONG_HIPS[j].y));
      close(Math.hypot(leg.knee.x-leg.hip.x,leg.knee.y-leg.hip.y),RUN_BONES.upper);
      close(Math.hypot(leg.ankle.x-leg.knee.x,leg.ankle.y-leg.knee.y),RUN_BONES.lower);
      assert.ok(leg.knee.x>leg.hip.x+4,'坐姿大腿向前弯曲');assert.ok(leg.ankle.y<0,'脚踩鞍侧而非站到地面');
    }
    const rendered={...p,y:actorRootY(p),mountGroundY:p.y,ride:null,beastRider:true};
    assert.deepEqual(staffGeometry(rendered),staffGeometry(p));assert.deepEqual(attackPose(rendered),pose);
    assert.equal(JSON.stringify(p),before);
  }
});

test('骑麒麟保留长棍三棍飞旋大招与六臂效果，旋棍会回到骑乘高度',()=>{
  const e=scene();mount(e);const p=e.G.p,near=foe(185),far=foe(245);e.G.en=[near,far];
  take(e,'L');p.staff=null;p.cool=0;advanceStaff(p,{fire:true},0,{random:()=>.15});
  p.staff.t=p.staff.duration*.5;
  const long=staffGeometry(p),ordinary=staffGeometry({...p,weapon:'rifle',staff:{...p.staff,weapon:'rifle'}});
  close(long.reach+long.rear,(ordinary.reach+ordinary.rear)*1.45);close(long.rear,ordinary.rear);tick(e,27);assert.ok(near.hp<1000);
  take(e,'S');p.staff=null;p.cool=0;advanceStaff(p,{fire:true},0);assert.equal(staffCopies(p).length,3);tick(e,27);
  take(e,'H');p.staff=null;p.cool=0;advanceStaff(p,{fire:true},0);assert.equal(p.staffThrows.length,1);
  close(p.staffThrows[0].y,staffGeometry(p).origin.y);assert.ok(p.staffThrows[0].y<p.y-18);tick(e,105);assert.ok(far.hp<1000);assert.equal(p.staffThrows.length,0);
  take(e,'arms');p.spCd=0;e.useSpecial();assert.equal(multiArmActors(p).length,2);
  p.staff=null;p.cool=0;advanceStaff(p,{fire:true},0);assert.ok(multiArmActors(p).every(a=>staffGeometry(a).origin.y<actorRootY(p)-8));
  const hp=near.hp;p.rage=100;p.rageBag=['sweep'];tick(e,1,{KeyI:true});assert.equal(p.staff.kind,'ultimate');tick(e,42);assert.ok(near.hp<=hp-12);assert.equal(p.ride,'moto');
  assert.equal(e.G.pb.length,0);assert.equal(e.G.gr.length,0);
});

test('骑乘绘制使用麒麟与完整骑姿，不调用旧摩托贴图，重复绘制不会推进时间或改写联机状态',()=>{
  const e=scene();mount(e);const art=e.wukong;
  for(const [key,width,height]of [['skinActors',1774,887],['celestialQilin',1536,1024]]){art.loadImage(key);Object.assign(art.images[key],{naturalWidth:width,naturalHeight:height});}
  const sprite=art.sprite.bind(art);art.sprite=(name,...args)=>{assert.notEqual(name,'motorcycle');return sprite(name,...args);};
  const draw=art.hdActors.draw.bind(art.hdActors);let rider;
  art.hdActors.draw=(g,p,role,...args)=>{if(role!=='enemy')rider=p;return draw(g,p,role,...args);};
  for(const vx of [-170,0,170])for(const onGround of [true,false]){
    Object.assign(e.G.p,{vx,onGround,anim:.71});const before=JSON.stringify(e.G.p);e.render();e.render();
    assert.equal(JSON.stringify(e.G.p),before);assert.equal(rider.beastRider,true);assert.equal(rider.ride,null);
    close(rider.y,actorRootY(e.G.p));assert.equal(rider.artPose,undefined);
  }
});

test('骑麒麟可用棍身真实击中巨灵神，坐骑身体接触不会代替 Boss 的棍击扣血',()=>{
  const e=scene();mount(e);Object.assign(e.G.p,{x:3222,y:176,onGround:true,face:1});e.G.camX=2950;e.G.boss.active=true;
  const core=e.G.boss.parts[2],hp=core.hp;tick(e,10);assert.equal(core.hp,hp);
  tick(e,70,{KeyJ:true});assert.ok(core.hp<hp);assert.equal(e.G.p.ride,'moto');assert.equal(e.G.pb.length,0);
});

test('二号玩家独立召唤麒麟与挥棍，联机快照保留坐骑、握点与已命中引用',()=>{
  const e=engine();e.coop.playing=true;e.reset(1);e.G.en=[];e.G.pods=[];e.G.podTrig=[];delete e.G.wukongFlights;e.G.freezeT=999;
  Object.assign(e.G.p,{x:40,y:112});Object.assign(e.G.p2,{x:150,y:112,onGround:true,invT:999});e.G.inv2=['m'];e.G.sel2=0;
  e.updatePartner({grenEdge:true});assert.equal(e.G.p2.ride,'moto');assert.equal(e.G.p.ride,null);
  const target=foe(185,112,20);e.G.en=[target];
  for(let i=0;i<16;i++){e.updatePartner({fire:i===0,fireEdge:i===0});e.collide();}
  assert.equal(target.hp,18);assert.equal(e.G.pb.length,0);assert.equal(e.G.p.staff,undefined);
  const [world]=unpackWorld(packWorld([e.G]));assert.equal(world.p2.ride,'moto');
  assert.ok([...(world.p2.staff.hits||[]),...(world.p2.staff.beatHits||[]).flat()].includes(world.en[0]));assert.deepEqual(staffGeometry(world.p2),staffGeometry(e.G.p2));
});
