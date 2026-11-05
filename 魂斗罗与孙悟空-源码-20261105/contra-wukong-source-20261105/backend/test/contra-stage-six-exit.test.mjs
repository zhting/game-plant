import test from 'node:test';
import assert from 'node:assert/strict';
import {STAGE_SIX_EXIT,canEnterStageSixExit,advanceStageSixExitEntry} from '../../games/contra2026/js/stage-six-exit.mjs';
import {StageSixArt} from '../../games/contra2026/js/stage-six-art.mjs';

test('第六关大门入口要求玩家在地面向右行走，进入后持续移动直至消失',()=>{
  const exit=STAGE_SIX_EXIT,p={x:exit.triggerX,y:176,vx:90,onGround:true};
  assert.equal(canEnterStageSixExit(p),true);
  for(const change of [{vx:0},{vx:-90},{onGround:false},{dead:true},{ride:'heli'}])assert.equal(canEnterStageSixExit({...p,...change}),false);
  p.enteringExit={t:0,x:p.x,y:p.y};p.vx=0;
  advanceStageSixExitEntry(p,exit.entrySeconds/2);assert.ok(p.x>exit.triggerX);assert.equal(p.exitEntered,undefined);
  advanceStageSixExitEntry(p,exit.entrySeconds/2);assert.equal(p.exitEntered,true);assert.equal(p.enteringExit,null);
});

test('关底大门两扇门板随开启进度分离，并且始终绘制在场景末端',()=>{
  const calls=[],gradient={addColorStop(){}},atlas={naturalWidth:1536,naturalHeight:1024};
  const g=new Proxy({createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args])});
  const art={g,rect(){},line(){},images:{exitDoor:atlas},loaded:new Set(['exitDoor'])};
  const paint=(progress,camera=2916)=>{
    calls.length=0;
    StageSixArt.prototype.exitDoor.call(art,{doorProgress:progress},camera);
    const sprites=calls.filter(([kind])=>kind==='drawImage');
    for(const [,image,sx,sy,sw,sh] of sprites){
      assert.equal(image,atlas);
      assert.ok(sx>=0&&sy>=0&&sx+sw<=atlas.naturalWidth&&sy+sh<=atlas.naturalHeight);
    }
    return sprites;
  };
  const closed=paint(0);assert.equal(closed.length,3,'two leaves and the frame');
  assert.deepEqual(closed[0].slice(2,6),closed[1].slice(2,6),'the opposite leaf uses the same sprite');
  const frame=closed.at(-1);
  assert.deepEqual(frame.slice(-4),[STAGE_SIX_EXIT.x,STAGE_SIX_EXIT.y,STAGE_SIX_EXIT.w,STAGE_SIX_EXIT.h]);
  assert.equal(paint(.5).length,3);
  const [left,right]=calls.filter(([kind])=>kind==='translate').map(([,x])=>x);
  const center=STAGE_SIX_EXIT.x+STAGE_SIX_EXIT.w/2;
  assert.ok(left<center&&right>center);
  assert.deepEqual(paint(1),[frame],'both leaves are out of the passage and the frame stays anchored');
  assert.equal(paint(0,0).length,0);
});
