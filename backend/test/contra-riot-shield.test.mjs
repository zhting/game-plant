import test from 'node:test';
import assert from 'node:assert/strict';
import {drawRiotShield} from '../../games/contra2026/js/riot-shield.mjs';
import {StageTwoArt} from '../../games/contra2026/js/stage-two-art.mjs';

function drawing(){
  const calls=[],gradient={addColorStop(){}};
  const g=new Proxy({globalAlpha:1,createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args])});
  return{g,calls};
}

test('防爆盾绘制在人像之前，由身体遮挡，禁止借用关底核心贴图',()=>{
  const {g,calls}=drawing(),art={g,state:{time:1,fx:[]},scale:10,baseActors:{draw(){calls.push(['actor']);}},kit(name){calls.push(['kit',name]);}};
  StageTwoArt.prototype.figure.call(art,{x:192,y:204,riot:3,onGround:true},'blue');
  assert.ok(calls.findIndex(c=>c[0]==='stroke')<calls.findIndex(c=>c[0]==='actor'));
  assert.ok(!calls.some(c=>c[0]==='kit'),'no unrelated mechanism artwork is overlaid on the body');
});

test('防爆盾随巨大化和卧倒调整，耗尽、死亡或收起时不残留',()=>{
  const hidden=[{riot:0},{riot:3,dead:true},{riot:3,deathHidden:true},{riot:3,spin:true},{riot:3,enteringExit:{}},{riot:3,exitEntered:true}];
  for(const p of hidden){const{g,calls}=drawing();drawRiotShield(g,{x:100,y:204,...p});assert.equal(calls.length,0);}
  const {g,calls}=drawing();drawRiotShield(g,{x:100,y:204,riot:1,giantT:2,prone:true});
  assert.ok(calls.some(c=>c[0]==='scale'&&c[1]===2&&c[2]===2));
  assert.ok(calls.some(c=>c[0]==='rotate'&&c[1]===-Math.PI/2));
});
