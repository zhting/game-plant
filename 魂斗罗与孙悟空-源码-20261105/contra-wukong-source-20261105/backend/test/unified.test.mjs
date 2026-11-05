import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import WebSocket from 'ws';
import { io } from 'socket.io-client';
import { createBackend } from '../server.mjs';

function message(ws, type) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ws.off('message', receive); reject(new Error(`军棋等待 ${type} 超时`)); }, 4000);
    function receive(data) {
      const value = JSON.parse(data.toString());
      if (value.t !== type) return;
      clearTimeout(timer);
      ws.off('message', receive);
      resolve(value);
    }
    ws.on('message', receive);
  });
}

test('同一后台同时提供静态合集、军棋和干瞪眼，兼容轮询与 WebSocket 并分别保存玩家', { timeout: 20000 }, async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'games-backend-test-'));
  const app = await createBackend({ dataDir });
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  const sockets = [];
  const ws = new WebSocket(origin.replace('http:', 'ws:') + '/games/junqi/ws');
  try {
    await once(ws, 'open');
    const welcome = message(ws, 'welcome');
    ws.send(JSON.stringify({ t: 'hello', name: '统一后台测试' }));
    const player = await welcome;
    assert.ok(player.token);

    for (const transport of ['polling', 'websocket']) {
      const socket = io(origin, { path: '/games/gandengyan/socket.io', transports: [transport], reconnection: false });
      sockets.push(socket);
      await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
      const loggedIn = new Promise(resolve => socket.once('login', resolve));
      socket.emit('login', { guest: true });
      const login = await loggedIn;
      assert.equal(login.ok, true);
      const room = await socket.timeout(3000).emitWithAck('enter', { mode: 'practice' });
      assert.equal(room.ok, true);
      const started = await socket.timeout(3000).emitWithAck('startNow', {});
      assert.equal(started.ok, true);
      assert.equal(started.state.seats.length, 5);
      socket.emit('leaveRoom');
    }

    // 两种协议同时连接后，军棋仍能处理请求，排除升级处理器互相关闭连接的问题。
    const pong = message(ws, 'pong');
    ws.send(JSON.stringify({ t: 'ping', c: 123 }));
    assert.equal((await pong).c, 123);
    const health = await (await fetch(origin + '/healthz')).json();
    assert.equal(health.ok, true);
    assert.ok(health.games.junqi);
    assert.ok(health.games.gandengyan);
    assert.ok(health.games.wukong);
    for (const url of ['/', '/backend-config.js', '/games/game/3d', '/games/junqi/', '/games/gandengyan/', '/games/gandengyan/js/socket.io.min.js', '/games/gandengyan/js/game-shared.js', '/wukong', '/games/wukong', '/games/wukong/', '/games/wukong/js/main.mjs', '/games/shared/arcade-engine.mjs', '/games/shared/arcade.css', '/assets/covers/wukong-512.webp']) {
      assert.equal((await fetch(origin + url)).status, 200, url);
    }
    const wukongPage = await (await fetch(origin + '/games/wukong/')).text();
    assert.match(wukongPage, /data-game="wukong"/); assert.doesNotMatch(wukongPage, /<iframe|theme=wukong/);
    for (const url of ['/games/gandengyan/data/db.json', '/games/gandengyan/lib/store.js', '/games/gandengyan/server.js', '/games/junqi/server/store.js']) {
      assert.equal((await fetch(origin + url)).status, 404, url);
    }
    const legacy = new WebSocket(origin.replace('http:', 'ws:') + '/ws');
    await once(legacy, 'open');
    legacy.close();
  } finally {
    ws.close();
    for (const socket of sockets) socket.disconnect();
    await app.close();
  }
  const junqi = JSON.parse(fs.readFileSync(path.join(dataDir, 'junqi/players.json'), 'utf8'));
  const gdy = JSON.parse(fs.readFileSync(path.join(dataDir, 'gandengyan/db.json'), 'utf8'));
  assert.equal(junqi.players.length, 1);
  assert.equal(Object.keys(gdy.users).length, 2);
  const resolved = path.resolve(dataDir);
  assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('games-backend-test-'));
  fs.rmSync(resolved, { recursive: true });
});
