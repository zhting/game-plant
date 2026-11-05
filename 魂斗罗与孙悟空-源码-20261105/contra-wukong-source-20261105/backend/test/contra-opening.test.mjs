import test from 'node:test';
import assert from 'node:assert/strict';
import {OPENING_DURATION,OPENING_PAGES,openingCaption} from '../../games/contra2026/js/opening-story.mjs';

test('六段开场字幕覆盖背景、威胁、出动与入口目标，每段留足完整阅读时间',()=>{
  assert.equal(OPENING_PAGES.length,6);
  for(const [i,page]of OPENING_PAGES.entries()){
    assert.equal(page.lines.length,2);
    assert.ok(page.to-page.from>=4.2);
    assert.ok(page.lines.every(line=>line.length<=23));
    assert.ok(page.lines.join('').length/(page.to-page.from-.36)<9,'under nine characters per second after fades');
    if(i)assert.equal(page.from,OPENING_PAGES[i-1].to);
  }
  assert.equal(OPENING_PAGES.at(-1).to,OPENING_DURATION);
  assert.match(OPENING_PAGES.at(-1).lines.join(''),/核心.*地下入口.*跳入缺口/);
});

test('两行字幕同时出现，段落边界不重叠，片头前后不残留字幕',()=>{
  assert.equal(openingCaption(0),null);assert.equal(openingCaption(OPENING_DURATION),null);
  for(const [index,page]of OPENING_PAGES.entries()){
    const early=openingCaption(page.from+.01),middle=openingCaption((page.from+page.to)/2);
    assert.deepEqual(early.lines,page.lines);assert.equal(early.index,index);
    assert.ok(early.alpha>0&&early.alpha<1);assert.equal(middle.alpha,1);
    assert.equal(openingCaption(page.from).index,index);
  }
});
