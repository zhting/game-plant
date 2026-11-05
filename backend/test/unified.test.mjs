import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import WebSocket from 'ws';
import { createBackend } from '../server.mjs';

test('统一后台提供入口页、魂斗罗与大闹天宫静态资源和各自的联机路径', { timeout: 20000 }, async () => {
  const app = await createBackend();
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  try {
    const health = await (await fetch(origin + '/healthz')).json();
    assert.equal(health.ok, true);
    assert.ok(health.games.contra2026);
    assert.ok(health.games.wukong);
    for (const url of ['/', '/backend-config.js', '/contra2026', '/games/contra2026/', '/games/contra2026/js/main.mjs',
      '/wukong', '/games/wukong', '/games/wukong/', '/games/wukong/js/main.mjs',
      '/games/shared/arcade-engine.mjs', '/games/shared/arcade.css', '/assets/covers/wukong-512.webp', '/assets/covers/contra2026-zh-512.webp']) {
      assert.equal((await fetch(origin + url)).status, 200, url);
    }
    const wukongPage = await (await fetch(origin + '/games/wukong/')).text();
    assert.match(wukongPage, /data-game="wukong"/); assert.doesNotMatch(wukongPage, /<iframe|theme=wukong/);
    // Source-only folders and removed games are never served.
    for (const url of ['/games/contra2026/tools/compress-images.py', '/games/contra2026/design/DESIGN.md', '/games/wukong/tools/dialogue-lines.json',
      '/games/junqi/', '/games/gandengyan/', '/backend/contra.mjs']) {
      assert.equal((await fetch(origin + url)).status, 404, url);
    }
    for (const path of ['/games/contra2026/ws', '/games/wukong/ws']) {
      const ws = new WebSocket(origin.replace('http:', 'ws:') + path);
      await once(ws, 'open');
      ws.close();
    }
  } finally {
    await app.close();
  }
});
