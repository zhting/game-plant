import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { WUKONG_OPENING_DURATION, WUKONG_OPENING_PAGES, STONE_BIRTH, stoneMonkeyBirthPose, wukongOpeningCaption, wukongOpeningFlight } from '../../games/wukong/js/wukong-opening.mjs';
import { BIRTH_ASSETS, BIRTH_FRAMES } from '../../games/wukong/js/wukong-birth.mjs';

test('二十秒开场先讲石猴出世，再快速交代取棒、受封、蟠桃与大闹天宫',()=>{
  assert.equal(WUKONG_OPENING_DURATION,20);assert.equal(WUKONG_OPENING_PAGES.length,6);
  assert.deepEqual(WUKONG_OPENING_PAGES.map(p=>p.tag),['石猴出世','拜师取棒','齐天大圣','蟠桃醉酒','天兵列阵','大闹天宫']);
  assert.ok(WUKONG_OPENING_PAGES[0].to>=STONE_BIRTH.land+1.5);
  for(const [i,page]of WUKONG_OPENING_PAGES.entries()){
    if(i)assert.equal(page.from,WUKONG_OPENING_PAGES[i-1].to);
    assert.equal(page.lines.length,2);assert.ok(page.lines.every(line=>line.length<=18));
    assert.ok(page.lines.join('').length/(page.to-page.from-.36)<14,'快速梗概仍留完整阅读时间');
    const middle=wukongOpeningCaption((page.from+page.to)/2);assert.equal(middle.index,i);assert.equal(middle.alpha,1);assert.deepEqual(middle.lines,page.lines);
  }
  assert.equal(WUKONG_OPENING_PAGES.at(-1).to,WUKONG_OPENING_DURATION);
  assert.equal(wukongOpeningCaption(0),null);assert.equal(wukongOpeningCaption(20),null);
});

test('仙石先震动透光，炸裂后石猴跃出翻身，落地保持体积和脚底锚点',()=>{
  assert.ok(STONE_BIRTH.burst<STONE_BIRTH.emerge&&STONE_BIRTH.emerge<STONE_BIRTH.land);
  const before=stoneMonkeyBirthPose(STONE_BIRTH.burst-.01),burst=stoneMonkeyBirthPose(STONE_BIRTH.burst+.07);
  assert.ok(before.stoneVisible);assert.ok(before.charge>.9);assert.ok(!before.visible);
  assert.ok(!burst.stoneVisible);assert.ok(burst.flash>.99);assert.ok(!burst.visible);
  const middle=stoneMonkeyBirthPose((STONE_BIRTH.emerge+STONE_BIRTH.land)/2);
  assert.ok(middle.visible&&!middle.landed);assert.equal(middle.frame,'leap');assert.ok(middle.y<90);assert.ok(middle.x>168&&middle.x<218);
  assert.ok(middle.turn<-Math.PI&&middle.turn>-Math.PI*2);
  for(const t of [STONE_BIRTH.land,4.6,5,5.7]){
    const q=stoneMonkeyBirthPose(t);assert.equal(q.frame,'standing');assert.equal(q.x,218);assert.equal(q.y,143);assert.equal(q.turn,0);assert.ok(q.squash>=.9);
  }
  for(let t=0;t<7;t+=1/60){
    const a=stoneMonkeyBirthPose(t),b=stoneMonkeyBirthPose(t+1/60);
    assert.ok(Math.abs(a.x-b.x)<1);assert.ok(Math.abs(a.y-b.y)<1.5);assert.ok(a.heaven>=0&&a.heaven<=1);
    assert.deepEqual(a,stoneMonkeyBirthPose(t),'反复采样确定且不推进时间');
  }
});

test('花果山与天宫柔和交接，大圣驾云赶赴天兵阵，新增图片使用压缩资源',()=>{
  assert.equal(stoneMonkeyBirthPose(STONE_BIRTH.transition).heaven,0);
  assert.equal(stoneMonkeyBirthPose(STONE_BIRTH.heaven).heaven,1);
  assert.ok(stoneMonkeyBirthPose(6.2).heaven>.4&&stoneMonkeyBirthPose(6.2).heaven<.6);
  assert.equal(wukongOpeningFlight(10).guards,0);assert.equal(wukongOpeningFlight(16).guards,1);
  assert.ok(wukongOpeningFlight(19).x>wukongOpeningFlight(7).x);
  for(const url of Object.values(BIRTH_ASSETS)){
    assert.ok(url.endsWith('.webp'));assert.ok(fs.statSync(new URL('../..'+url,import.meta.url)).size<500000);
  }
  for(const f of Object.values(BIRTH_FRAMES)){
    const [x,y,w,h]=f.bounds;assert.ok(x>=0&&y>=0&&x+w<=1536&&y+h<=1024);assert.ok(f.scale>0);
    if(f.clip)for(const [a,b]of f.clip)assert.ok(a>=x&&a<=x+w&&b>=y&&b<=y+h);
  }
});
