import test from 'node:test';
import assert from 'node:assert/strict';
import {heavenTime,fairyFlight} from '../../games/wukong/js/wukong-atmosphere.mjs';

test('天宫背景跟随场景时间，角色静止时仍推进，暂停时不跟随继续增加的菜单帧数',()=>{
  const state={mode:'play',time:3.4,t:204};
  assert.equal(heavenTime(state,204),3.4);
  state.time=4.4;assert.equal(heavenTime(state,264),4.4);
  state.mode='pause';
  const before=structuredClone(state);
  assert.equal(heavenTime(state,10000),4.4);
  assert.deepEqual(state,before);
  assert.equal(heavenTime({mode:'settings',settingsFrom:'pause',time:4.4},12000),4.4);
  assert.equal(heavenTime({mode:'title',time:0},300),5);
  assert.equal(heavenTime({mode:'cine',cine:{t:8}},480),8);
});

test('仙女间歇飞过且双向变化，轨迹和衣带相位连续，重复绘制或同步相同时间不会换位',()=>{
  assert.equal(fairyFlight(0),null);
  const samples=Array.from({length:1140},(_,i)=>({time:i/10,flight:fairyFlight(i/10)}));
  const visible=samples.filter(s=>s.flight);
  assert.ok(visible.length>250&&visible.length<600,'飞过后留出足够的空景时间');
  assert.deepEqual(new Set(visible.map(s=>s.flight.face)),new Set([-1,1]));
  for(const {time,flight}of visible){
    assert.deepEqual(fairyFlight(time),flight);
    assert.ok(flight.y>=40&&flight.y<72,'航线位于远景上空');
    assert.ok(flight.height>=20&&flight.height<=25,'比例小于前景角色');
    assert.ok(flight.alpha>=0&&flight.alpha<=.86);
    const next=fairyFlight(time+1/60);
    if(next){assert.ok(Math.abs(next.x-flight.x)<.7);assert.notEqual(next.phase,flight.phase);}
  }
  assert.ok(fairyFlight(14).x>fairyFlight(12).x);
  assert.ok(fairyFlight(54).x<fairyFlight(52).x);
  assert.equal(fairyFlight(28),null);
});
