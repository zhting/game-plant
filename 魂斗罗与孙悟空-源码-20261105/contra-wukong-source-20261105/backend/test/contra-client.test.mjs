import test from 'node:test';
import assert from 'node:assert/strict';
import { CoopClient } from '../../games/contra2026/js/coop-net.mjs';

test('快速退出再建房时，旧连接的延迟关闭和消息不会清除新房间', async () => {
  const saved = { WebSocket: globalThis.WebSocket, window: globalThis.window, location: globalThis.location };
  class Socket {
    static OPEN = 1; static instances = [];
    readyState = 0; bufferedAmount = 0; sent = [];
    constructor() { Socket.instances.push(this); }
    send(data) { this.sent.push(JSON.parse(data)); }
    open() { this.readyState = 1; this.onopen(); }
    close() { this.readyState = 3; }
    message(value) { this.onmessage({ data: JSON.stringify(value) }); }
  }
  globalThis.WebSocket = Socket;
  globalThis.window = { GAMES_BACKEND: {} };
  globalThis.location = { origin: 'http://localhost' };
  const ended = [];
  try {
    const client = new CoopClient({ room() {}, end: reason => ended.push(reason) });
    const creating = client.create(1), first = Socket.instances[0]; first.open(); await creating;
    first.message({ t: 'room', role: 'host', code: 'ABC234', stage: 1, players: 1 });
    client.leave();
    const next = client.create(2), second = Socket.instances[1]; second.open(); await next;
    second.message({ t: 'room', role: 'host', code: 'XYZ567', stage: 2, players: 1 });
    first.onclose(); first.message({ t: 'ended', reason: 'old room' });
    assert.equal(client.room, 'XYZ567'); assert.equal(client.connected, true); assert.equal(ended.length, 0);
    assert.equal(second.sent[0].stage, 2);
    client.leave(); second.onclose();
  } finally {
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) delete globalThis[key]; else globalThis[key] = saved[key];
    }
  }
});

test('独立悟空客户端连接专用路径，支持统一后台域名与自定义反代路径', async () => {
  const saved = { WebSocket: globalThis.WebSocket, window: globalThis.window, location: globalThis.location };
  class Socket {
    static OPEN = 1;
    readyState = 0;
    constructor(url) { this.url = String(url); queueMicrotask(() => { this.readyState = 1; this.onopen(); }); }
    send() {}
    close() { this.readyState = 3; }
  }
  globalThis.WebSocket = Socket;
  globalThis.location = { origin: 'http://localhost:4187' };
  try {
    for (const [game, config, expected] of [
      ['wukong', {}, 'ws://localhost:4187/games/wukong/ws'],
      ['wukong', { url: 'https://api.example.test', wukongPath: '/custom/wukong/ws' }, 'wss://api.example.test/custom/wukong/ws'],
      ['contra2026', {}, 'ws://localhost:4187/games/contra2026/ws'],
    ]) {
      globalThis.window = { GAMES_BACKEND: config };
      const client = new CoopClient({}, { game });
      await client.connect(); assert.equal(client.socket.url, expected); client.leave();
    }
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  }
});
