import test from 'node:test';
import assert from 'node:assert/strict';
import { ThirtyLivesCheat, THIRTY_LIVES, inTitleLogo } from '../../games/contra2026/js/thirty-lives.mjs';

const keys=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA','KeyB','KeyA'];
test('PC 秘籍必须完整输入，长按重复不补齐按键，超时与修饰键会中断',()=>{
  const code=new ThirtyLivesCheat();assert.equal(THIRTY_LIVES,30);
  // The old ten-key code is only a prefix; the final B A is required.
  for(const [i,key]of keys.entries())assert.equal(code.key(key,i*100),i===keys.length-1);
  code.key('ArrowUp',2000);code.key('ArrowUp',2100,{repeat:true});
  for(const [i,key]of keys.slice(2).entries())assert.equal(code.key(key,2200+i*100),false);
  code.resetInput();for(const [i,key]of keys.entries())assert.equal(code.key(key,i?3001+i*100:0),false);
  code.resetInput();for(const [i,key]of keys.entries())assert.equal(code.key(key,i*100,{modified:i===4}),false);
});
test('错误按键会重置进度，连续多按一个上仍能识别后续完整序列',()=>{
  const code=new ThirtyLivesCheat();code.key('ArrowUp',0);code.key('KeyJ',100);
  for(const [i,key]of keys.slice(1).entries())assert.equal(code.key(key,200+i*100),false);
  code.resetInput();code.key('ArrowUp',2000);
  assert.equal(keys.map((key,i)=>code.key(key,2100+i*100)).filter(Boolean).length,1);
});
test('手机仅在四秒内完成八次轻点才匹配，退出标题清除未完成输入',()=>{
  const code=new ThirtyLivesCheat();for(let i=0;i<8;i++)assert.equal(code.tap(i*400),i===7);
  code.tap(5000);for(let i=0;i<7;i++)assert.equal(code.tap(9500+i*100),false);
  assert.equal(code.tap(10200),true);for(let i=0;i<7;i++)code.tap(11000+i*100);
  code.resetInput();assert.equal(code.tap(12000),false);
  assert.equal(inTitleLogo(296,40),true);assert.equal(inTitleLogo(108,40),true);
  assert.equal(inTitleLogo(192,130),false);assert.equal(inTitleLogo(-1,40),false);
});
test('激活不叠加生命预设，清除会撤销激活和残留输入',()=>{
  const code=new ThirtyLivesCheat();assert.equal(code.enable(),true);assert.equal(code.enable(),false);
  assert.equal(code.enabled,true);code.clear();assert.equal(code.enabled,false);assert.equal(code.keys.length,0);assert.equal(code.taps.length,0);
});
