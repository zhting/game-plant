import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);

function dependencyGraph(entry) {
  const modules = new Map();
  function visit(url) {
    if (modules.has(url.href)) return;
    const file = new URL(url.pathname.slice(1), root);
    assert.ok(fs.existsSync(file), `发布缺少模块：${url.pathname}`);
    const source = fs.readFileSync(file, 'utf8');
    modules.set(url.href, source);
    for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])([^'"]+)\1/g)) {
      if (match[2].startsWith('/') || match[2].startsWith('.')) visit(new URL(match[2], url));
    }
  }
  visit(new URL(entry, 'https://game.test'));
  return modules;
}

test('魂斗罗入口不依赖悟空模块，所有本地模块和引用的美术音频均可随前端发布',()=>{
  const modules=dependencyGraph('/games/contra2026/js/main.mjs');
  assert.ok(modules.size>20);
  for (const [url,source] of modules) {
    assert.ok(!new URL(url).pathname.startsWith('/games/wukong/'),url);
    for (const match of source.matchAll(/['"](\/games\/contra2026\/assets\/[^'"\n]+\.(?:webp|png|svg|jpg|ogg|mp3|woff2?))(?:\?[^'"]*)?['"]/g)) {
      assert.ok(fs.existsSync(new URL(match[1].slice(1),root)),`发布缺少资源：${match[1]}`);
    }
  }
});

test('悟空独立入口仍显式加载自己的系统及共享引擎',()=>{
  const modules=dependencyGraph('/games/wukong/js/main.mjs');
  const paths=[...modules.keys()].map(url=>new URL(url).pathname);
  assert.ok(paths.includes('/games/wukong/js/engine-dependencies.mjs'));
  assert.ok(paths.includes('/games/wukong/js/wukong-game.mjs'));
  assert.ok(paths.includes('/games/shared/arcade-engine.mjs'));
});
