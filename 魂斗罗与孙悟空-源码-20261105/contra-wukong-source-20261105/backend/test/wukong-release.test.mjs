import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import WebSocket from 'ws';
import { attachContra } from '../contra.mjs';
import { isWukongStageOpen, WUKONG_RELEASE_MESSAGE } from '../../games/wukong/js/release-stages.mjs';
import { packWorld, unpackWorld } from '../../games/contra2026/js/coop-core.mjs';

function inbox(ws) {
  const queued = [], waiting = [];
  ws.on('message', raw => {
    const value = JSON.parse(raw.toString()), index = waiting.findIndex(item => item.type === value.t);
    if (index < 0) queued.push(value);
    else { const item = waiting.splice(index, 1)[0]; clearTimeout(item.timer); item.resolve(value); }
  });
  return type => {
    const index = queued.findIndex(value => value.t === type);
    if (index >= 0) return Promise.resolve(queued.splice(index, 1)[0]);
    return new Promise((resolve, reject) => {
      const item = { type, resolve, timer: setTimeout(() => reject(Error(`等待 ${type} 超时`)), 3000) };
      waiting.push(item);
    });
  };
}

test('悟空与魂斗罗房间隔离，悟空开放前两章并拒绝未开放关卡', { timeout: 15000 }, async () => {
  const server = http.createServer();
  const contra = attachContra(server);
  const wukong = attachContra(server, { path: '/games/wukong/ws', stageAllowed: isWukongStageOpen, releaseMessage: WUKONG_RELEASE_MESSAGE });
  const clients = [];
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  async function connect(game) {
    const ws = new WebSocket(`ws://127.0.0.1:${server.address().port}/games/${game}/ws`);
    const next = inbox(ws); clients.push(ws); await once(ws, 'open');
    return { next, send: message => ws.send(JSON.stringify(message)) };
  }
  try {
    const soldier = await connect('contra2026'), hero = await connect('wukong'), partner = await connect('wukong');
    soldier.send({ t: 'create', stage: 5 }); const militaryRoom = await soldier.next('room');
    hero.send({ t: 'join', code: militaryRoom.code }); assert.match((await hero.next('error')).message, /不存在/);
    for (const stage of [0, 3, 5, '1']) {
      hero.send({ t: 'create', stage }); assert.equal((await hero.next('error')).message, WUKONG_RELEASE_MESSAGE);
    }
    hero.send({ t: 'create', stage: 2 }); const room = await hero.next('room');
    soldier.send({ t: 'join', code: room.code }); assert.match((await soldier.next('error')).message, /不存在/);
    partner.send({ t: 'join', code: room.code }); assert.equal((await partner.next('room')).role, 'guest'); await hero.next('peer');
    hero.send({ t: 'start', stage: 3 }); assert.equal((await hero.next('error')).message, WUKONG_RELEASE_MESSAGE);
    hero.send({ t: 'start', stage: 2 }); await hero.next('started'); await partner.next('started');
    hero.send({ t: 'state', seq: 1, world: packWorld([{ stage: 3 }]) }); assert.equal((await hero.next('error')).message, WUKONG_RELEASE_MESSAGE);
    hero.send({ t: 'state', seq: 2, world: packWorld([{ stage: 2, mode: 'play', score: 10000, siege:{room:'hub',cleared:['wind','armor'],gateOpen:false} }]) });
    const [state] = unpackWorld((await partner.next('state')).world);
    assert.deepEqual(state, { stage: 2, mode: 'play', score: 10000, siege:{room:'hub',cleared:['wind','armor'],gateOpen:false} });
    assert.equal(contra.stats().rooms, 1); assert.equal(wukong.stats().rooms, 1);
  } finally {
    for (const ws of clients) ws.terminate();
    await wukong.close(); await contra.close(); await new Promise(resolve => server.close(resolve));
  }
});
