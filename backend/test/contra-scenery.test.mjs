import test from 'node:test';
import assert from 'node:assert/strict';
import { rockCells, palmAnchors, openingDrop } from '../../games/contra2026/js/stage-one-scenery.mjs';

test('岩壁分块边界使用完全一致的世界几何，滚动时不会重置图案或产生拼接边', () => {
  for (const boundary of [128, 256, 640, 2048, 3200]) {
    const crossing = cells => cells.filter(c => Math.min(...c.points.map(p => p[0])) < boundary && Math.max(...c.points.map(p => p[0])) > boundary)
      .sort((a, b) => a.y - b.y);
    const left = crossing(rockCells(boundary - 128, boundary)), right = crossing(rockCells(boundary, boundary + 128));
    assert.ok(left.length > 8); assert.deepEqual(left, right);
  }
});

test('细化后的岩石网格覆盖整个屏幕高度，不在底部或分块边界漏出底色', () => {
  const contains=(points,x,y)=>{
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++) {
      const a=points[i],b=points[j];
      if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    }
    return inside;
  };
  for(const left of [0,128,2944]) {
    const cells=rockCells(left,left+128);
    for(const y of [.37,90.37,200.37,215.37])for(let x=left+.31;x<left+128;x+=7.3)
      assert.ok(cells.some(cell=>contains(cell.points,x,y)),`uncovered rock surface at ${x},${y}`);
  }
});

test('树根只锚定有效陆地，镜头滚动不改变根部高度；空降加速下落后准确着地', () => {
  const solids = [{ x: 0, y: 144, w: 240, g: 1 }, { x: 240, y: 200, w: 380, g: 1, water: 1 },
    { x: 620, y: 176, w: 240, g: 1 }, { x: 380, y: 96, w: 80, g: 0 }];
  assert.deepEqual(palmAnchors(solids, 0), [{ x: 90, y: 144 }]);
  assert.deepEqual(palmAnchors(solids, 120), [{ x: 90, y: 144 }]);
  assert.deepEqual(palmAnchors(solids, 620), [{ x: 710, y: 176 }]);
  const times = [18, 18.4, 18.8, 19.2, 19.6, 20.5], poses = times.map(t => openingDrop(t, solids));
  assert.equal(poses[0].y, 80); assert.equal(poses[4].y, 144); assert.equal(poses[5].y, 144);
  assert.ok(poses[2].y - poses[1].y > poses[1].y - poses[0].y, 'fall accelerates');
  assert.ok(poses.slice(0, 4).every(p => p.spin)); assert.equal(poses[4].spin, false);
  assert.ok(poses[1].anim !== poses[2].anim, 'somersault phase advances during the drop');
});
