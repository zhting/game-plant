import test from 'node:test';
import assert from 'node:assert/strict';
import {navigateStageSixRunner,stageSixRunnerSpawnSafe} from '../../games/contra2026/js/stage-six-combat.mjs';

test('第六关跑兵从两侧接近各方向喷口，在不同周期下均不进入正在燃烧的范围',()=>{
  const dt=1/60,solids=[{x:0,y:176,w:1000,g:1}];
  for(const j of [{x:300,v:1,per:3.2,off:0},{x:300,dir:1,per:3.4,off:1.2},{x:300,dir:-1,per:3.4,off:1.2}]){
    const flame=j.v?[294,306]:j.dir>0?[306,380]:[220,294];
    for(const direction of [-1,1])for(let phase=0;phase<j.per;phase+=.2){
      const soldier={x:direction>0?flame[0]-28:flame[1]+28,y:176,vx:direction*62,on:true,dec:false};let time=phase;
      for(let i=0;i<240;i++){
        time+=dt;const action=navigateStageSixRunner(soldier,solids,[j],time,0,dt);
        if(action!=='stop')soldier.x+=soldier.vx*dt;
        const cycle=((time+j.off)%j.per+j.per)%j.per,u=cycle-(j.per-1.3);
        const k=u>=0?Math.max(0,Math.min(1,u/.15,(1.3-u)/.2)):0;
        if(k>=.3){
          const live=j.v?[j.x-6,j.x+6]:j.dir>0?[j.x+6,j.x+6+74*k]:[j.x-6-74*k,j.x-6];
          assert.ok(soldier.x+5<=live[0]||soldier.x-5>=live[1],`jet ${JSON.stringify(j)} direction ${direction} phase ${phase} time ${time} at ${soldier.x}`);
        }
      }
    }
  }
});

test('第六关跑兵不会生成在即将喷火的位置，停止冷却的喷口可通行',()=>{
  const jet={x:300,v:1,per:3.2,off:0};
  assert.equal(stageSixRunnerSpawnSafe(300,176,[jet],2.3,0),false);
  assert.equal(stageSixRunnerSpawnSafe(300,176,[jet],2.3,8),true);
  assert.equal(stageSixRunnerSpawnSafe(250,176,[jet],2.3,0),true);
});
