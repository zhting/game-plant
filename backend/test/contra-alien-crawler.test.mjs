import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ALIEN_CRAWLER_ART,ALIEN_CRAWLER_ASSET,drawAlienCrawler} from '../../games/contra2026/js/alien-crawler.mjs';
import {StageSevenArt} from '../../games/contra2026/js/stage-seven-art.mjs';

test('六个独立爬行单元位于原生透明图集内，素材通过本关唯一的爬虫资源入口加载',()=>{
  const png=fs.readFileSync(new URL('../../games/contra2026/assets/stage7/alien-crawler-walk-v1.png',import.meta.url)),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  assert.equal(png[25],6);assert.deepEqual([width,height],[1774,887]);
  const art=new StageSevenArt({autoLoad:false,createCanvas:()=>({getContext:()=>({})}),baseArt:{}});assert.equal(art.assets.crawler,ALIEN_CRAWLER_ASSET);
  assert.equal(ALIEN_CRAWLER_ART.frames.length,6);assert.equal(new Set(ALIEN_CRAWLER_ART.frames.map(f=>f.bounds.join(','))).size,6);
  for(const {bounds:[x,y,w,h],anchor:[ax,ay]}of ALIEN_CRAWLER_ART.frames){assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);assert.ok(ax>0&&ax<w&&ay>0&&ay<h);}
});

test('真实怪兽渲染选择动作单元，左右镜像、脚底锚点与命中闪光保持一致，不以整体旋转代替迈腿',()=>{
  for(const direction of [-1,1])for(let i=0;i<6;i++){
    const draws=[],flips=[],g=new Proxy({save(){},restore(){},translate(){},scale(...a){flips.push(a);},drawImage(...a){draws.push(a);}},{get:(o,k)=>k in o?o[k]:()=>{throw new Error('Unexpected canvas call: '+k);}});
    const image={naturalWidth:1774,naturalHeight:887},art={g,loaded:new Set(['crawler']),images:{crawler:image},state:{freezeT:0}};
    const e={t:'run',x:100,y:176,vx:direction*62,on:true,flash:.1,crawlDistance:(i+.1)*ALIEN_CRAWLER_ART.stride/6};
    StageSevenArt.prototype.enemy.call(art,e);assert.equal(draws.length,1);assert.deepEqual(draws[0].slice(1,5),ALIEN_CRAWLER_ART.frames[i].bounds);
    assert.deepEqual(flips,[[direction<0?1:-1,1]]);assert.equal(g.filter,'brightness(1.8)');
    const dy=draws[0][6],anchor=ALIEN_CRAWLER_ART.frames[i].anchor[1]*ALIEN_CRAWLER_ART.scale;assert.ok(Math.abs(dy+anchor)<1e-9,'native planted claw baseline remains on the actual ground');
  }
  assert.equal(drawAlienCrawler({images:{},loaded:new Set()},{}),false);
});
