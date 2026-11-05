import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {impactHelmetPose,drawImpactHelmet,IMPACT_HELMET_ASSET} from '../../games/contra2026/js/impact-helmet-art.mjs';
import {versionedAssetUrl} from '../../games/contra2026/js/asset-url.mjs';

test('防落石头盔使用透明细节精灵，内容版本与资源清单一致',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../../games/contra2026/design/impact-helmet-v2.json',import.meta.url),'utf8'));
 const bytes=fs.readFileSync(new URL('../..'+IMPACT_HELMET_ASSET,import.meta.url));
 assert.equal(bytes.length,manifest.bytes);assert.ok(bytes.length<60000);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
 assert.equal(manifest.alphaPreserved,true);assert.deepEqual(manifest.dimensions,[512,331]);
 assert.ok(versionedAssetUrl(IMPACT_HELMET_ASSET).endsWith(manifest.sha256.slice(0,10)));
});

test('头盔贴合红蓝人物的各瞄准姿势，随跑步躯干起伏且继承外部镜像',()=>{
 for(const role of ['blue','red'])for(const ay of [0,-1,-.7,.7]){
  const p={helmT:15,ay};const idle=impactHelmetPose(p,role);
  assert.ok(idle.y>-30&&idle.y<-22);assert.ok(idle.width<10);
  const frames=Array.from({length:20},(_,i)=>impactHelmetPose({...p,vx:90,onGround:true,anim:i*.2},role));
  assert.ok(Math.max(...frames.map(f=>f.y))-Math.min(...frames.map(f=>f.y))>.7);
  assert.ok(frames.every(f=>Math.abs(f.y-idle.y)<2));
  const calls=[],g={save(){},restore(){},translate(...v){calls.push(['translate',...v]);},rotate(){},drawImage(...v){calls.push(v);}};
  assert.equal(drawImpactHelmet(g,{naturalWidth:512},p,role),true);assert.equal(calls.length,2);
 }
});

test('头盔不悬浮在翻滚、卧倒、死亡或载具上，末两秒仍使用原有闪烁节奏',()=>{
 for(const state of [{dead:true},{spin:true},{prone:true},{inWater:true},{ride:'heli'},{helmT:0}])
  assert.equal(impactHelmetPose({helmT:15,...state}),null);
 assert.equal(impactHelmetPose({helmT:1},'blue',0),null);
 assert.ok(impactHelmetPose({helmT:1},'blue',4));
 assert.equal(drawImpactHelmet({},null,{helmT:15}),false);
});
