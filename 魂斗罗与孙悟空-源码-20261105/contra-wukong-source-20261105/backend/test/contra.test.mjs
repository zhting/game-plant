import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import WebSocket from 'ws';
import { attachContra } from '../contra.mjs';
import { packWorld, unpackWorld, encodeInput, InputBuffer } from '../../games/contra2026/js/coop-core.mjs';

test('同步快照保留桥梁循环引用、平台支撑与激光命中 Set', () => {
  const platform = { x: 120, gone: false }, bridge = { segs: [platform] };
  platform.bridge = bridge;
  const enemy = { hp: 2 }, player = { support: platform }, laser = { hits: new Set([enemy]) };
  const [state, platforms, bridges] = unpackWorld(JSON.parse(JSON.stringify(packWorld([{ player, enemy, laser }, [platform], [bridge]]))));
  assert.equal(state.player.support, platforms[0]);
  assert.equal(bridges[0].segs[0], platforms[0]);
  assert.equal(platforms[0].bridge, bridges[0]);
  assert.ok(state.laser.hits.has(state.enemy));
  assert.throws(() => unpackWorld({ v: 1, root: { r: 10 }, nodes: [] }));
  assert.throws(() => unpackWorld({ v: 1, root: { r: 0 }, nodes: [['o', [['__proto__', null]]]] }));
});

test('短按不会在两次模拟之间丢失，长按不重复边沿，断流释放按键', () => {
  const input = new InputBuffer();
  input.push(encodeInput({ right: true, jump: true }), 1000);
  input.push(encodeInput({ right: true }), 1001);
  assert.equal(input.read(1002).jumpEdge, true);
  assert.equal(input.read(1003).jumpEdge, false);
  assert.equal(input.read(1004).right, true);
  assert.equal(input.read(1700).right, false);
});

function inbox(ws) {
  const queue = [], waits = [];
  ws.on('message', data => {
    const m = JSON.parse(data);
    const i = waits.findIndex(w => w.type === m.t);
    if (i < 0) queue.push(m); else { const [w] = waits.splice(i, 1); clearTimeout(w.timer); w.resolve(m); }
  });
  return type => {
    const i = queue.findIndex(m => m.t === type);
    if (i >= 0) return Promise.resolve(queue.splice(i, 1)[0]);
    return new Promise((resolve, reject) => {
      const w = { type, resolve, timer: setTimeout(() => reject(Error('等待消息超时：' + type)), 3000) }; waits.push(w);
    });
  };
}

test('房间隔离、双人开局、输入与快照方向、暂停、掉线重开和房主退出', { timeout: 15000 }, async () => {
  const server = http.createServer((req, res) => res.end('ok'));
  const service = attachContra(server), clients = [];
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `ws://127.0.0.1:${server.address().port}/games/contra2026/ws`;
  async function connect() {
    const ws = new WebSocket(url), next = inbox(ws); clients.push(ws); await once(ws, 'open');
    return { ws, next, send: m => ws.send(JSON.stringify(m)) };
  }
  try {
    const host = await connect(), guest = await connect(), other = await connect();
    for(const stage of [0,9,16,'1']){host.send({t:'create',stage});assert.match((await host.next('error')).message,/开放第一关至第八关/);}
    host.send({ t: 'create', stage: 5 }); const room = await host.next('room');assert.equal(room.stage,5);
    assert.match(room.code, /^[A-Z2-9]{6}$/);
    host.send({ t: 'start', stage: 1 }); assert.match((await host.next('error')).message, /等待/);
    guest.send({ t: 'join', code: room.code }); assert.equal((await guest.next('room')).role, 'guest'); await host.next('peer');
    other.send({ t: 'join', code: room.code }); assert.match((await other.next('error')).message, /已满/);
    guest.send({ t: 'start', stage: 1 }); assert.match((await guest.next('error')).message, /房主/);
    host.send({t:'start',stage:9});assert.match((await host.next('error')).message,/开放第一关至第八关/);
    host.send({ t: 'start', stage: 1 }); await host.next('started'); await guest.next('started');
    guest.send({ t: 'input', bits: encodeInput({ fire: true, right: true }), seq: 1 });
    assert.equal((await host.next('input')).bits, encodeInput({ fire: true, right: true }));
    host.send({t:'state',world:packWorld([{stage:9}]),seq:1});assert.match((await host.next('error')).message,/开放第一关至第八关/);
    const world = packWorld({ stage: 1, players: [{ x: 10 }, { x: 30 }] });
    host.send({ t: 'state', world, seq: 1 });
    assert.deepEqual(unpackWorld((await guest.next('state')).world), { stage: 1, players: [{ x: 10 }, { x: 30 }] });
    guest.send({ t: 'action', action: 'pause' }); assert.equal((await host.next('action')).action, 'pause');
    guest.ws.close(); await host.next('peer_left');
    other.send({ t: 'join', code: room.code }); assert.equal((await other.next('room')).role, 'guest'); await host.next('peer');
    host.send({ t: 'start', stage: 2 }); assert.equal((await other.next('started')).stage, 2); await host.next('started');
    host.send({ t: 'start', stage: 3 }); assert.equal((await other.next('started')).stage, 3); await host.next('started');
    host.send({t:'start',stage:4});assert.equal((await other.next('started')).stage,4);await host.next('started');
    host.send({t:'start',stage:5});assert.equal((await other.next('started')).stage,5);await host.next('started');
    const fifth=packWorld([{stage:5,mode:'play'}]);host.send({t:'state',world:fifth,seq:2});assert.equal(unpackWorld((await other.next('state')).world)[0].stage,5);
    host.send({t:'start',stage:6});assert.equal((await other.next('started')).stage,6);await host.next('started');
    const sixth=packWorld([{stage:6,mode:'play',s6:{coolT:4},jets:[{st:'cold'}]}]);host.send({t:'state',world:sixth,seq:3});assert.deepEqual(unpackWorld((await other.next('state')).world)[0],{stage:6,mode:'play',s6:{coolT:4},jets:[{st:'cold'}]});
    host.send({t:'start',stage:7});assert.equal((await other.next('started')).stage,7);await host.next('started');
    const seventh=packWorld([{stage:7,mode:'play',gate:{active:true}}]);host.send({t:'state',world:seventh,seq:4});assert.equal(unpackWorld((await other.next('state')).world)[0].stage,7);
    host.send({t:'start',stage:8});assert.equal((await other.next('started')).stage,8);await host.next('started');
    const eighth=packWorld([{stage:8,mode:'play',hive:{active:true}}]);host.send({t:'state',world:eighth,seq:5});assert.equal(unpackWorld((await other.next('state')).world)[0].stage,8);
    host.ws.close(); assert.match((await other.next('ended')).reason, /房主/);
    assert.equal(service.stats().rooms, 0);
  } finally {
    for (const ws of clients) ws.terminate();
    await service.close(); await new Promise(resolve => server.close(resolve));
  }
});
