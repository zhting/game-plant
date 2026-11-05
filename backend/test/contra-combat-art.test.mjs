import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { COMBAT_ASSETS, EXPLOSION_ART, EQUIPMENT_TURRET, EQUIPMENT_SUPPLY, drawExplosion, drawEquipmentSupply, drawEquipmentTurret, drawSupplyDisc } from '../../games/contra2026/js/combat-art.mjs';

function canvas(){
  const draws=[],states=[],rotations=[];
  const g=new Proxy({globalAlpha:.7,globalCompositeOperation:'source-over',filter:'none',
    createRadialGradient:()=>({addColorStop(){}}),
    save(){states.push([this.globalAlpha,this.globalCompositeOperation,this.filter]);},
    restore(){[this.globalAlpha,this.globalCompositeOperation,this.filter]=states.pop();},
    drawImage:(...args)=>draws.push(args),rotate:a=>rotations.push(a)
  },{get:(o,k)=>k in o?o[k]:()=>{}});
  return {g,draws,rotations};
}

test('爆炸依同步事件年龄播放十二个图集帧，结束即隐藏，光效不污染后续绘制',()=>{
  const {g,draws}=canvas(),image={width:1024,height:768};
  for(let frame=0;frame<12;frame++){
    const event=Object.freeze({x:90,y:70,s:12,t:(frame+.1)/12*.6,life:.6});
    drawExplosion(g,image,event);
    const [,sx,sy,sw,sh]=draws.at(-1);
    assert.deepEqual([sx,sy,sw,sh],[frame%4*256,Math.floor(frame/4)*256,256,256]);
    assert.equal(g.globalAlpha,.7);assert.equal(g.globalCompositeOperation,'source-over');
  }
  const count=draws.length;
  for(const event of [{t:.6,life:.6},{t:.2,life:.6,dead:true}])assert.equal(drawExplosion(g,image,{x:0,y:0,...event}),false);
  assert.equal(draws.length,count);
});

test('炮塔转向绕同一炮口锚点、冻结不后坐，补给箱开关保持同一落地基线',()=>{
  const {g,draws,rotations}=canvas(),image={width:1536,height:1024};
  for(const idx of [0,3,6,9]){
    drawEquipmentTurret(g,image,{x:40,y:80,idx,fireT:1.48},{frozen:true});
    assert.equal(rotations.at(-1),idx*Math.PI/6);
    assert.equal(draws.at(-1)[5],-2.5);
  }
  for(const open of [false,true]){
    drawEquipmentSupply(g,image,{x:40,y:80,open},26);
    const [,sx,sy,sw,sh,x,y,w,h]=draws.at(-1);
    assert.deepEqual([sx,sy,sw,sh],EQUIPMENT_SUPPLY[open?'open':'closed']);
    assert.equal(y+h,80);assert.equal(x+w/2,40);
  }
});

test('共享飞碟保持素材比例和中心，落地道具不使用飞碟渲染',()=>{
  const {g,draws}=canvas();
  drawSupplyDisc(g,{width:512,height:144},60,40);
  const [,x,y,w,h]=draws.at(-1);
  assert.equal(w,30);assert.equal(w/h,512/144);assert.equal(x+w/2,60);assert.equal(y+h/2,40);
});

test('共用素材记录匹配下载文件与透明 PNG，所有序列帧及设备部件均在图内',()=>{
  const manifest=JSON.parse(fs.readFileSync(new URL('../../games/contra2026/design/combat-art-assets.json',import.meta.url),'utf8'));
  assert.deepEqual(manifest.assets.map(a=>a.url).sort(),Object.values(COMBAT_ASSETS).sort());
  assert.ok(manifest.totalBytes<1000000);
  for(const asset of manifest.assets){
    const webp=fs.readFileSync(new URL('../..'+asset.url,import.meta.url));assert.equal(webp.length,asset.bytes);
    const png=fs.readFileSync(new URL(('../..'+asset.url).replace('.webp','.png'),import.meta.url));
    assert.equal(png[25],6);assert.equal(asset.alphaPreserved,true);
    const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
    for(const [x,y,w,h]of Object.values(asset.frames))assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height);
  }
  assert.equal(EXPLOSION_ART.frames,12);assert.equal(EQUIPMENT_TURRET.body.length,4);
});
