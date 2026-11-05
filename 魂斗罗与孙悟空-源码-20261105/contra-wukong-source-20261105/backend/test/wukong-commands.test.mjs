import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceStaff,resolveStaff,startUltimate,STAFF_VARIANTS} from '../../games/wukong/js/wukong-combat.mjs';
import {STAFF_COMMANDS} from '../../games/wukong/js/wukong-staff-commands.mjs';
import {COMMAND_CLIPS} from '../../games/wukong/js/wukong-command-clips.mjs';
import {wholeHeroFrame,wholeHeroPose} from '../../games/wukong/js/wukong-hero-frames.mjs';
import {cancelStaffCharge} from '../../games/wukong/js/wukong-special-staff.mjs';
import {newVitality,receiveHeroHit} from '../../games/wukong/js/wukong-vitality.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';

const dt=1/60;
const hero=extra=>({x:100,y:144,face:1,ax:1,ay:0,vx:0,vy:0,weapon:'rifle',onGround:true,
  heroFrames:true,cool:0,...newVitality(),...extra});
function tick(p,frames,input={},options={}){
  for(let i=0;i<frames;i++)advanceStaff(p,{...input,fireEdge:!!input.fire&&i===0},dt,{playerActions:true,random:()=>0,...options});
}
const ground=[
  [{right:true},'thrust','extra'],[{up:true},'lift','uppercut'],[{down:true},'low','low'],
  [{right:true,up:true},'wheel','cyclone'],[{right:true,down:true},'sweep','sweep']
];

test('五类方向组合固定出招，左右镜像等效，完整帧与招式相符，不消耗随机数',()=>{
  for(const [controls,id,sheet]of ground)for(const face of [-1,1]){
    const input={...controls};if(face<0&&input.right){delete input.right;input.left=true;}
    const p=hero({face,ax:face});tick(p,1,{...input,fire:true},{random:()=>{throw Error('指定招式不应抽取随机数');}});
    assert.equal(p.staff.command,id);assert.equal(p.staff.variant,STAFF_COMMANDS[id].variant);assert.equal(p.staff.face,face);
    assert.equal(p.prone,false);p.staff.t=p.staff.duration*.25;
    assert.match(wholeHeroFrame(p).frame.id,new RegExp('^'+sheet+':'));
  }
});

test('边跑边点攻击依次衔接七种棍法，直刺仅一招，左右镜像和空中动作有各自连贯序列',()=>{
  for(const face of [-1,1]){
    const p=hero({vx:90*face,face}),commands=[];
    const side=face>0?{right:true}:{left:true};
    for(let n=0;n<7;n++){
      tick(p,1,{...side,fire:true});commands.push(p.staff.command);assert.equal(p.staff.face,face);
      let limit=120;while((p.staff||p.cool>0)&&limit--)tick(p,1);assert.ok(limit>0);
    }
    assert.deepEqual(commands,['travelSweep','travelFlower','travelCleave','travelWushu','travelCoil','travelWheel','travelThrust']);
    p.onGround=false;const air=[];
    for(let n=0;n<3;n++){
      tick(p,1,{...side,fire:true});air.push(p.staff.variant);
      let limit=120;while((p.staff||p.cool>0)&&limit--)tick(p,1);
    }
    assert.deepEqual(air,['airWheel','airCross','airReverse']);
    tick(p,90);p.onGround=true;tick(p,1,{...side,fire:true});assert.equal(p.staff.command,'travelSweep');
  }
});

test('行进棍法快照恢复后接同一招，反向、定向上挑和受击会重置行进连环',()=>{
  const p=hero({vx:90});tick(p,1,{right:true,fire:true});while(p.staff||p.cool>0)tick(p,1);
  const [copy]=unpackWorld(packWorld([p]));
  for(const q of [p,copy]){tick(q,1,{right:true,fire:true});assert.equal(q.staff.command,'travelFlower');}
  while(p.staff||p.cool>0)tick(p,1);
  p.vx=-90;tick(p,1,{left:true,fire:true});assert.equal(p.staff.command,'travelSweep');
  while(p.staff||p.cool>0)tick(p,1);
  tick(p,1,{left:true,up:true,fire:true});assert.equal(p.staff.command,'wheel');assert.equal(p.staffTravelChain,undefined);
  while(p.staff||p.cool>0)tick(p,1);
  tick(p,1,{left:true,fire:true});assert.ok(p.staffTravelChain);receiveHeroHit(p,{damage:12});assert.equal(p.staffTravelChain,undefined);
});

test('收招预输入保留方向、招式与朝向，放开按键和转身后仍只衔接一次',()=>{
  const p=hero();tick(p,3,{fire:true});tick(p,2);const first=p.staff;
  tick(p,2,{left:true,up:true,fire:true});assert.equal(p.staff,first);assert.ok(p.staffIntent);
  let next;for(let i=0;i<35;i++){tick(p,1,{right:true});if(p.staff&&p.staff!==first){next=p.staff;break;}}
  assert.equal(next.command,'wheel');assert.equal(next.face,-1);assert.equal(p.staffIntent,undefined);
  tick(p,90);assert.equal(p.staff,null);assert.equal(p.wantFire,false);
});

test('中立预输入不会因为随后按上而误变挑棍，新一次预输入可覆盖旧意图',()=>{
  const p=hero({cool:.12});tick(p,1,{fire:true});tick(p,2,{up:true});tick(p,8,{up:true});
  assert.equal(p.staff.command,undefined);assert.notEqual(p.staff.kind,'lift');
  const q=hero({cool:.18});tick(q,1,{up:true,fire:true});tick(q,1);tick(q,1,{down:true,fire:true});tick(q,12);
  assert.equal(q.staff.command,'low');
});

test('下转前可经过斜下触发舞花三连段，直接斜下、过时及反向输入不会误触发',()=>{
  for(const face of [-1,1])for(const diagonal of [false,true]){
    const p=hero(),side=face>0?{right:true}:{left:true};tick(p,3,{down:true});
    if(diagonal)tick(p,2,{...side,down:true});else tick(p,2);
    tick(p,1,{...side,fire:true});assert.equal(p.staff.command,'flower');assert.equal(p.staff.face,face);
    assert.equal(p.staff.variant,'lotusChain');assert.equal(p.staffCommandMotion,undefined);
  }
  const diagonal=hero();tick(diagonal,1,{down:true,right:true,fire:true});assert.equal(diagonal.staff.command,'sweep');
  const late=hero();tick(late,25,{down:true});tick(late,1,{right:true,fire:true});assert.equal(late.staff.command,'thrust');
  const up=hero();tick(up,2,{down:true});tick(up,2,{up:true});tick(up,1,{left:true,fire:true});assert.equal(up.staff.command,'thrust');
});

test('下方向低扫不会退回伏地帧，完整姿势和两端命中线共用同一采样且绘制不改状态',()=>{
  const p=hero({prone:true});tick(p,1,{down:true,fire:true});assert.equal(p.prone,false);assert.equal(p.heroAnimation.prone,0);
  const frames=new Set();for(let i=2;i<18;i++){
    p.staff.t=p.staff.duration*i/20;const before=JSON.stringify(p),frame=wholeHeroFrame(p),line=wholeHeroPose(p);
    assert.match(frame.clip,/attack:low/);assert.equal(line.frame,frame.frame);frames.add(frame.frame.id);
    assert.ok(line.tip.y<=p.y+.5,'低扫棍头保持在台面上方');assert.equal(JSON.stringify(p),before);
  }assert.ok(frames.size>=4);
});

test('指定三段连招每拍各命中一次，重复碰撞不重复扣血，最后一拍为重击',()=>{
  for(const flower of [false,true]){
    const p=hero();if(flower)tick(p,2,{down:true});
    tick(p,1,{right:true,down:!flower,fire:true});const action=p.staff;
    const foe={x:75,y:40,w:100,h:120,hp:30},hits=[];
    const world={enemies:[foe],pods:[],parts:[],solids:[],enemyBox:e=>e,podBox:e=>e,
      damageEnemy(e,n,x,y,shot){e.hp-=n;hits.push({n,heavy:shot.heavy});},popPod(){},hitPart(){}};
    for(let i=0;i<90;i++){tick(p,1);resolveStaff(p,world);resolveStaff(p,world);}
    assert.equal(foe.hp,23);assert.deepEqual(hits,[{n:2,heavy:false},{n:2,heavy:false},{n:3,heavy:true}]);
    assert.ok(action.beatHits.every(list=>list.length===1));
  }
});

test('指定突刺确实击中前方目标，实心墙仍阻挡，强化可加长和提速',()=>{
  for(const blocked of [false,true]){
    const p=hero(),foe={x:140,y:110,w:12,h:34,hp:20};tick(p,1,{right:true,fire:true});
    const world={enemies:[foe],pods:[],parts:[],solids:blocked?[{x:125,y:-100,w:4,h:400,g:1}]:[],enemyBox:e=>e,podBox:e=>e,
      damageEnemy(e,n){e.hp-=n;},popPod(){},hitPart(){}};
    for(let i=0;i<40;i++){tick(p,1);resolveStaff(p,world);}
    assert.equal(foe.hp,blocked?20:18);
  }
  const normal=hero(),fast=hero({weapon:'machine'}),long=hero({weapon:'laser'});
  for(const p of [normal,fast,long]){tick(p,1,{right:true,fire:true});p.staff.t=p.staff.duration*.5;}
  assert.ok(fast.staff.duration<normal.staff.duration);assert.ok(long.staff.duration>normal.staff.duration);
  const l=wholeHeroPose(long),n=wholeHeroPose(normal);assert.ok(Math.abs((l.reach+l.rear)/(n.reach+n.rear)-1.45)<1e-9);assert.equal(l.rear,n.rear);
});

test('空中方向指定凌空刺与挑棍，下键优先下劈，麒麟和筋斗云可使用地面组合',()=>{
  for(const [input,id,sheet]of [[{right:true},'airThrust','extra'],[{up:true},'airLift','uppercut']]){
    const p=hero({onGround:false});tick(p,1,{...input,fire:true});assert.equal(p.staff.command,id);
    p.staff.t=p.staff.duration*.5;assert.match(wholeHeroFrame(p).frame.id,new RegExp('^'+sheet+':'));
  }
  const down=hero({onGround:false});tick(down,1,{down:true,right:true,fire:true});assert.equal(down.staff.airCleave,true);
  for(const ride of ['moto','heli']){
    const p=hero({ride,onGround:false});tick(p,1,{up:true,right:true,fire:true});assert.equal(p.staff.command,'wheel');
    assert.equal(!!wholeHeroFrame(p).mounted,ride==='moto');
  }
});

test('方向攻击先播完完整动作再转蓄力，松开只放棍气；中断、暂停与大招会清掉预输入',()=>{
  const p=hero();tick(p,38,{up:true,right:true,fire:true});assert.equal(p.staff.command,'wheel');assert.equal(p.staffCharge.active,false);
  tick(p,16,{up:true,right:true,fire:true});assert.equal(p.staff,null);assert.equal(p.staffCharge.ready,true);
  tick(p,1);assert.equal(p.staff.kind,'qiCast');assert.equal(p.staffWaves.length,1);assert.equal(p.staffIntent,undefined);
  tick(p,80);assert.equal(p.staff,null);
  for(const cancel of [q=>cancelStaffCharge(q,true),q=>receiveHeroHit(q,{damage:12}),q=>{q.rage=100;startUltimate(q,()=>0);}]){
    const q=hero({cool:.18});tick(q,1,{up:true,fire:true});assert.ok(q.staffIntent);cancel(q);
    assert.equal(q.staffIntent,undefined);assert.equal(q.wantFire,false);
  }
  const late=hero({cool:.75});tick(late,1,{down:true,fire:true});tick(late,70);assert.equal(late.staff,undefined);assert.equal(late.wantFire,false);
});

test('按住每种组合不会在0.24秒被蓄力切断，所有身体帧都可见，三段连击打完才蓄力',()=>{
  for(const [controls,id]of [...ground, [{right:true},'flower']]){
    const p=hero();if(id==='flower')tick(p,2,{down:true});
    tick(p,1,{...controls,fire:true});const action=p.staff,duration=action.duration,seen=new Set();
    assert.equal(duration,COMMAND_CLIPS[id].duration);
    while(action.t<duration-2/60){
      const frame=wholeHeroFrame(p);seen.add(frame.frame.id);
      assert.equal(p.staff,action,id+'不能被蓄力或新攻击替换');assert.equal(p.staffCharge.active,false);
      advanceStaff(p,{...controls,fire:true},dt,{playerActions:true});
    }
    assert.ok(seen.size>=7,id+'必须有完整动作帧变化');
    if(id==='flower'||id==='sweep')for(const sheet of id==='flower'?['blossom','flower','cleave']:['sweep','uppercut','advance'])assert.ok([...seen].some(id=>id.startsWith(sheet+':')));
    tick(p,5,{...controls,fire:true});assert.equal(p.staff,null);assert.equal(p.staffCharge.active,true);
  }
});

test('低扫压低身体并横向扫过脚踝，上挑走竖向轨迹，空中直刺使用团身空中帧',()=>{
  const low=hero();tick(low,1,{down:true,fire:true});
  const poses=[.26,.42,.56].map(u=>wholeHeroFrame(low,u*low.staff.duration));
  assert.ok(poses.every(p=>p.frame.id.startsWith('low:')));
  for(const u of [.26,.42,.56]){
    const q=wholeHeroPose(low,u*low.staff.duration);assert.ok(Math.abs(q.angle)<.06,'扫堂棍在脚踝附近水平扫动');
    assert.ok(low.y-q.origin.y<10,'低扫双手与棍身真实降低');
  }
  const lift=hero();tick(lift,1,{up:true,fire:true});const q=wholeHeroPose(lift,lift.staff.duration*.56);assert.ok(q.tip.y<lift.y-55&&q.angle< -1.4);
  const air=hero({onGround:false});tick(air,1,{right:true,fire:true});const a=wholeHeroFrame(air,air.staff.duration*.5);
  assert.ok(a.frame.index>=8&&a.frame.id.startsWith('extra:'),'空中刺必须用团身完整帧，而非站立帧');
});

test('预输入与搓招窗口随快照恢复，双人各自保留指令，召唤物继续随机近战',()=>{
  const p1=hero({pid:1,cool:.2}),p2=hero({pid:2,cool:.2});tick(p1,1,{up:true,fire:true});tick(p2,2,{down:true});
  const [world]=unpackWorld(packWorld([{p1,p2}]));tick(world.p1,16);tick(world.p2,1,{right:true,fire:true});tick(world.p2,16);
  assert.equal(world.p1.staff.command,'lift');assert.equal(world.p2.staff.command,'flower');assert.equal(p1.staff,undefined);
  const ally=hero();for(let i=0;i<60;i++)advanceStaff(ally,{right:true,down:true,fire:true},dt,{random:()=>0});
  assert.equal(ally.staffCharge,undefined);assert.equal(ally.staffIntent,undefined);assert.equal(ally.staffCommandMotion,undefined);
  assert.ok(STAFF_VARIANTS.includes(ally.staff.variant));assert.equal(ally.staff.command,undefined);
});
