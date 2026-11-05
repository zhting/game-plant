import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { STAGE_ONE_ASSETS, FORTRESS_ART, FORTRESS_TARGETS, FORTRESS_DAMAGE_REGIONS, FORTRESS_HD_BOUNDS } from '../../games/contra2026/js/stage-one-art.mjs';
import { versionedAssetUrl } from '../../games/contra2026/js/asset-url.mjs';

test('新要塞的立面、残骸和通道均为透明位图，版本与发布文件一致',()=>{
  const manifest=JSON.parse(fs.readFileSync(new URL('../../games/contra2026/design/fortress-realistic-v3.json',import.meta.url),'utf8'));
  assert.equal(manifest.generatedWith,'built-in imagegen');assert.equal(manifest.assets.length,3);
  assert.deepEqual(manifest.assets.map(asset=>asset.url),[STAGE_ONE_ASSETS.fortress,STAGE_ONE_ASSETS.damage,STAGE_ONE_ASSETS.fortressBreach]);
  for(const asset of manifest.assets){
    const url=new URL('../..'+asset.url,import.meta.url),bytes=fs.readFileSync(url);
    assert.equal(bytes.length,asset.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
    assert.ok(versionedAssetUrl(asset.url).endsWith('?v='+asset.sha256.slice(0,10)));
    const png=fs.readFileSync(new URL(url.href.replace(/\.webp$/,'.png')));
    assert.equal(png[25],6);assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],asset.dimensions);
    assert.equal(asset.alphaPreserved,true);
    for(const [x,y,w,h]of Object.values(asset.frames))assert.ok(x>=0&&y>=0&&x+w<=asset.dimensions[0]&&y+h<=asset.dimensions[1]);
  }
});

test('混凝土要塞对齐原立面、炮口和核心，不移动实体墙与入口',()=>{
  assert.deepEqual(FORTRESS_HD_BOUNDS,[29,10,1201,1254]);
  assert.deepEqual(FORTRESS_ART,{x:3191,y:28,w:147,h:148,wallX:3232,levelEnd:3334});
  assert.deepEqual(FORTRESS_TARGETS.map(part=>part.k),['gunA','gunB','core']);
  for(const part of FORTRESS_TARGETS){
    const zone=FORTRESS_DAMAGE_REGIONS[part.k];
    assert.ok(part.x>=FORTRESS_ART.x&&part.y>=FORTRESS_ART.y);
    assert.ok(part.x+part.w<=FORTRESS_ART.x+FORTRESS_ART.w&&part.y+part.h<=FORTRESS_ART.y+FORTRESS_ART.h);
    assert.ok(zone.w>0&&zone.h>0);
  }
});
