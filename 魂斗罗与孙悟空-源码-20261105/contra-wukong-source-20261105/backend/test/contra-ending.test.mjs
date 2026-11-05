import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {StageOneArt} from '../../games/contra2026/js/stage-one-art.mjs';
import {EndingArt,ENDING_ASSETS} from '../../games/contra2026/js/ending-art.mjs';
import {endingCaption} from '../../games/contra2026/js/ending-story.mjs';

test('高清片尾随同一时钟切换三幕和字幕，缩放烟雾与飞机不会逐帧分配画布',()=>{
  const images=new Set(),labels=new Set(),gradient={addColorStop(){}};
  let art,allocations=0;
  function createCanvas(){
    allocations++;
    const canvas={width:384,height:216};
    const context=new Proxy({canvas,createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,
      measureText:text=>({width:String(text).length*6}),
      fillText(text){if(canvas===art.surface)labels.add(text);},
      drawImage(image,...coords){
        assert.ok(image);
        assert.ok(coords.every(Number.isFinite));
        if(canvas===art?.surface)images.add(image);
      }
    },{get:(target,key)=>key in target?target[key]:()=>{}});
    canvas.getContext=()=>context;
    return canvas;
  }
  const options={createCanvas,autoLoad:false};
  const baseArt=new StageOneArt(options);
  art=new EndingArt({...options,baseArt});
  for(const key of ['environment','facilities','explosionAtlas'])baseArt.adoptImage(key,{key,naturalWidth:1536,naturalHeight:1024});
  for(const [key,url]of Object.entries(ENDING_ASSETS)){
    const png=fs.readFileSync(new URL('../..'+url.replace('.webp','.png'),import.meta.url));
    assert.ok(fs.existsSync(new URL('../..'+url,import.meta.url)));
    art.adoptImage(key,{key,naturalWidth:png.readUInt32BE(16),naturalHeight:png.readUInt32BE(20)});
    if(key==='endingIsland')assert.equal(png[25],6,'the island has a native alpha channel');
  }
  const destination=createCanvas().getContext();
  destination.canvas.width=1920;
  destination.canvas.height=1080;
  const G={cine:{kind:'end',t:0},score:123450,time:180.5,deaths:2};
  const render=t=>{G.cine.t=t;images.clear();labels.clear();art.render(destination,G,{settings:{shake:'on'}});};
  render(2);
  assert.ok(images.has(art.images.endingNight)&&images.has(art.images.endingIsland));
  assert.ok(endingCaption(2).lines.every(line=>labels.has(line)));
  render(6.45);
  assert.ok(images.has(baseArt.images.explosionAtlas));
  render(10);
  assert.equal(images.has(art.images.endingIsland),false,'the island has sunk before the shot changes');
  render(11.1);
  assert.ok(images.has(art.images.endingNight)&&images.has(art.images.endingSunrise),'the two shots dissolve');
  render(14);
  assert.ok(images.has(art.images.endingSunrise));
  assert.equal(images.has(art.images.endingNight),false);
  assert.ok(endingCaption(14).lines.every(line=>labels.has(line)));
  render(26.3);
  for(const label of ['最终得分  123450','通关用时  3:00','阵亡次数  2'])assert.ok(labels.has(label));
  render(42);
  assert.ok(labels.has('全剧终'));
  const warmCount=allocations;
  for(let i=1;i<=180;i++)render(i/18);
  assert.equal(allocations,warmCount,'dynamic effect sizes reuse the same source canvases');
  assert.deepEqual([art.surface.width,art.surface.height],[1920,1080]);
  assert.deepEqual([G.score,G.time,G.deaths],[123450,180.5,2]);
});
