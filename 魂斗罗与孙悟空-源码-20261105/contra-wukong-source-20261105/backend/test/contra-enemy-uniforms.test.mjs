import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {STAGE_ONE_ASSETS} from '../../games/contra2026/js/stage-one-art.mjs';
import {STAGE_TWO_ASSETS} from '../../games/contra2026/js/stage-two-art.mjs';
import {STAGE_THREE_ASSETS} from '../../games/contra2026/js/stage-three-art.mjs';
import {STAGE_FOUR_ASSETS} from '../../games/contra2026/js/stage-four-art.mjs';
import {StageFiveArt, STAGE_FIVE_ASSETS} from '../../games/contra2026/js/stage-five-art.mjs';
import {STAGE_SIX_ASSETS} from '../../games/contra2026/js/stage-six-art.mjs';
import {drawStageEnemyUniform} from '../../games/contra2026/js/stage-enemy-uniforms.mjs';

test('六关敌兵各自加载不同的透明装备素材',()=>{
  const uniforms=[STAGE_ONE_ASSETS,STAGE_TWO_ASSETS,STAGE_THREE_ASSETS,STAGE_FOUR_ASSETS,STAGE_FIVE_ASSETS,STAGE_SIX_ASSETS].map(a=>a.enemyUniform);
  assert.equal(new Set(uniforms).size,6);
  for(const path of uniforms){
    const data=fs.readFileSync(new URL('../..'+path,import.meta.url));
    assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,16),'WEBPVP8X');assert.ok(data[20]&16);
  }
});

test('新上身保留原奔跑腿部，瞄准时跟随转向，缺少图片安全回退',()=>{
  const calls=[];
  const g=new Proxy({filter:'none',drawImage:(...args)=>calls.push(['image',...args]),rotate:a=>calls.push(['rotate',a])},
    {get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});
  const art={g,state:{stage:6},images:{enemyUniform:{naturalWidth:640,naturalHeight:360}},loaded:new Set(['enemyUniform'])};
  let legs=0;const body=()=>{legs++;};
  assert.equal(drawStageEnemyUniform(art,{vx:62,onGround:true,anim:2,ay:.7},body),true);
  assert.equal(legs,1);assert.ok(calls.some(c=>c[0]==='clip'));assert.ok(calls.some(c=>c[0]==='rotate'&&c[1]>0));assert.ok(calls.some(c=>c[0]==='image'));
  art.loaded.clear();assert.equal(drawStageEnemyUniform(art,{vx:0},body),false);assert.equal(legs,1);
});

test('第五关射手向下瞄准时，旧枪管不会随腿部一起画出来',()=>{
  const poses=[],rotations=[],images=[];
  const g=new Proxy({drawImage:(...args)=>images.push(args),rotate:angle=>rotations.push(angle)},
    {get:(o,k)=>k in o?o[k]:()=>{}});
  const uniform={naturalWidth:640,naturalHeight:381};
  const art=Object.assign(Object.create(StageFiveArt.prototype),{
    g,images:{enemyUniform:uniform},loaded:new Set(['enemyUniform']),
    state:{stage:5,t:0,freezeT:0},scale:1,snap:x=>x,
    hdActors:{draw(_g,pose){poses.push(pose);return true;}}
  });
  const sniper={t:'snp',x:130,y:106,face:-1,ay:.7};
  art.enemy(sniper);
  assert.deepEqual(poses.map(p=>p.ay),[0],'only the level pose goes through the lower-body clip');
  assert.deepEqual(images.map(([image])=>image),[uniform]);
  assert.ok(rotations.some(a=>a>0),'the visible rifle still aims downward');
  art.loaded.clear();poses.length=0;images.length=0;
  art.enemy(sniper);
  assert.deepEqual(poses.map(p=>p.ay),[.7],'the original single sprite can still aim when the uniform is missing');
  assert.equal(images.length,0);
});
