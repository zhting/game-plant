import { randomInt } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { INPUT_MASK, unpackWorld } from '../games/contra2026/js/coop-core.mjs';
import { isStageOpen, STAGE_RELEASE_MESSAGE } from '../games/contra2026/js/release-stages.mjs';

const PATH = '/games/contra2026/ws';
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const send = (ws, value) => { if (ws?.readyState === WebSocket.OPEN && ws.bufferedAmount < 512 * 1024) ws.send(JSON.stringify(value)); };

export function attachContra(server, { path = PATH, stageAllowed = isStageOpen, releaseMessage = STAGE_RELEASE_MESSAGE } = {}) {
  const rooms = new Map(), perIp = new Map();
  const wss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024, perMessageDeflate: { threshold: 1024 } });
  const fail = (ws, message) => send(ws, { t: 'error', message });
  function leave(ws) {
    const room = ws.room; ws.room = null;
    if (!room) return;
    if (room.host === ws) {
      rooms.delete(room.code);
      if (room.guest) { room.guest.room = null; send(room.guest, { t: 'ended', reason: '房主已离开，房间已关闭' }); }
    } else if (room.guest === ws) {
      room.guest = null; room.started = false;
      send(room.host, { t: 'peer_left' });
    }
  }
  function upgrade(req, socket, head) {
    if (new URL(req.url, 'http://localhost').pathname !== path) return;
    const allowed = process.env.GAMES_ALLOWED_ORIGINS?.split(',').map(s => s.trim());
    if (allowed && !allowed.includes('*') && req.headers.origin && !allowed.includes(req.headers.origin)) { socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return; }
    const ip = req.socket.remoteAddress;
    if ((perIp.get(ip) || 0) >= 12 || wss.clients.size >= 200) { socket.end('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n'); return; }
    wss.handleUpgrade(req, socket, head, ws => {
      ws.ip = ip; perIp.set(ip, (perIp.get(ip) || 0) + 1); wss.emit('connection', ws);
    });
  }
  server.on('upgrade', upgrade);
  wss.on('connection', ws => {
    ws.alive = true; ws.seq = -1; ws.window = Date.now(); ws.count = 0;
    ws.on('pong', () => { ws.alive = true; });
    ws.on('error', () => {});
    ws.on('close', () => { leave(ws); const n = (perIp.get(ws.ip) || 1) - 1; if (n) perIp.set(ws.ip, n); else perIp.delete(ws.ip); });
    ws.on('message', (raw, binary) => {
      if (binary) return;
      const now = Date.now(); if (now - ws.window >= 1000) { ws.window = now; ws.count = 0; }
      if (++ws.count > 120) { ws.close(1008, 'rate limit'); return; }
      let m; try { m = JSON.parse(raw.toString()); } catch { fail(ws, '消息格式错误'); return; }
      if (!m || typeof m !== 'object') return;
      if (m.t === 'ping') { if (Number.isSafeInteger(m.at)) send(ws, { t: 'pong', at: m.at }); return; }
      if (m.t === 'leave') { leave(ws); return; }
      if (m.t === 'create') {
        if (!stageAllowed(m.stage)) return fail(ws, releaseMessage);
        leave(ws);
        let code; do { code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join(''); } while (rooms.has(code));
        const room = { code, host: ws, guest: null, stage: m.stage, started: false };
        rooms.set(code, room); ws.room = room;
        send(ws, { t: 'room', code, role: 'host', stage: room.stage, players: 1 }); return;
      }
      if (m.t === 'join') {
        if (typeof m.code !== 'string' || !/^[A-Z2-9]{6}$/.test(m.code)) return fail(ws, '请输入六位房间码');
        const room = rooms.get(m.code);
        if (!room) return fail(ws, '房间不存在或已关闭');
        if (room.host === ws || room.guest === ws) return fail(ws, '你已经在这个房间里');
        if (room.guest || room.started) return fail(ws, '房间已满');
        leave(ws); room.guest = ws; ws.room = room;
        send(ws, { t: 'room', code: room.code, role: 'guest', stage: room.stage, players: 2 });
        send(room.host, { t: 'peer', players: 2 }); return;
      }
      const room = ws.room; if (!room) return fail(ws, '请先创建或加入房间');
      if (m.t === 'start') {
        if (room.host !== ws) return fail(ws, '由房主开始游戏');
        if (!room.guest) return fail(ws, '等待第二位玩家加入');
        if (!stageAllowed(m.stage)) return fail(ws, releaseMessage);
        room.started = true; room.stage = m.stage; room.host.seq = room.guest.seq = -1;
        for (const peer of [room.host, room.guest]) send(peer, { t: 'started', stage: room.stage }); return;
      }
      if (!room.started) return;
      if (m.t === 'input' && room.guest === ws) {
        if (!Number.isInteger(m.bits) || m.bits < 0 || m.bits > INPUT_MASK || !Number.isSafeInteger(m.seq) || m.seq <= ws.seq) return;
        ws.seq = m.seq; send(room.host, { t: 'input', bits: m.bits });
      }
      if (m.t === 'state' && room.host === ws) {
        if (!Number.isSafeInteger(m.seq) || m.seq <= ws.seq || m.world?.v !== 1 || !Array.isArray(m.world.nodes) || m.world.nodes.length > 16000) return;
        let state;try{const world=unpackWorld(m.world);state=Array.isArray(world)?world[0]:world;}catch{return fail(ws,'无效的游戏画面');}
        if(!stageAllowed(state?.stage))return fail(ws,releaseMessage);
        ws.seq = m.seq; send(room.guest, { t: 'state', world: m.world });
      }
      if (m.t === 'action' && room.guest === ws) {
        if (['pause', 'resume'].includes(m.action)) send(room.host, { t: 'action', action: m.action });
        if (m.action === 'select' && Number.isInteger(m.slot) && m.slot >= 0 && m.slot < 3) send(room.host, { t: 'action', action: 'select', slot: m.slot });
      }
    });
  });
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) { if (!ws.alive) ws.terminate(); else { ws.alive = false; ws.ping(); } }
  }, 15000);
  heartbeat.unref();
  return {
    stats: () => ({ rooms: rooms.size, players: wss.clients.size }),
    async close() {
      clearInterval(heartbeat); server.off('upgrade', upgrade);
      for (const ws of wss.clients) ws.terminate();
      await new Promise(resolve => wss.close(resolve)); rooms.clear();
    }
  };
}
