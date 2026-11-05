import { encodeInput, InputBuffer } from './coop-core.mjs';

export class CoopClient {
  role = ''; room = ''; playing = false; connected = false; remote = new InputBuffer();
  seq = 0; lastBits = -1; lastInput = 0; lastFrame = 0; latency = 0;
  constructor(callbacks, { game = 'contra2026' } = {}) { this.callbacks = callbacks; this.game = game; }
  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.connecting) return this.connecting;
    const config = window.GAMES_BACKEND || {};
    const url = new URL(config.url || location.origin);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = this.game === 'wukong' ? config.wukongPath || '/games/wukong/ws' : config.contraPath || '/games/contra2026/ws'; url.search = ''; url.hash = '';
    const socket = this.socket = new WebSocket(url);
    this.connecting = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { socket.close(); reject(Error('连接超时，请确认联机后台已启动')); }, 10000);
      socket.onopen = () => { clearTimeout(timeout); if (this.socket !== socket) return reject(Error('连接已取消')); this.connected = true; resolve(); };
      socket.onerror = () => { clearTimeout(timeout); reject(Error('无法连接联机后台，请稍后重试')); };
      socket.onmessage = event => {
        if (this.socket !== socket) return;
        let message;
        try { message = JSON.parse(event.data); } catch { return; }
        if (message.t === 'room') { this.room = message.code; this.role = message.role; this.callbacks.room(message); }
        if (message.t === 'peer') this.callbacks.peer(message);
        if (message.t === 'started') {
          this.playing = true; this.seq = 0; this.lastBits = -1; this.lastFrame = performance.now(); this.remote.clear();
          this.callbacks.start(message.stage);
        }
        if (message.t === 'input') this.remote.push(message.bits);
        if (message.t === 'state') { this.lastFrame = performance.now(); this.snapshotBytes = event.data.length; this.callbacks.state(message.world); }
        if (message.t === 'action') this.callbacks.action(message.action, message.slot);
        if (message.t === 'peer_left') { this.playing = false; this.remote.clear(); this.callbacks.lost('队友已离开，等待重新加入后开始'); }
        if (message.t === 'ended') { this.playing = false; this.room = ''; this.role = ''; this.callbacks.end(message.reason || '房间已关闭'); }
        if (message.t === 'error') this.callbacks.error(message.message);
        if (message.t === 'pong') this.latency = Math.max(0, Date.now() - message.at);
      };
      socket.onclose = () => {
        clearTimeout(timeout); reject(Error('连接已关闭'));
        if (this.socket !== socket) return;
        this.connected = false; this.connecting = null; this.playing = false; this.remote.clear();
        if (this.room) { this.room = ''; this.role = ''; this.callbacks.end('连接已断开，请重新创建或加入房间'); }
      };
    }).finally(() => { if (this.socket === socket) this.connecting = null; });
    return this.connecting;
  }
  send(message) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    const data = JSON.stringify(message); if (message.t === 'state') this.snapshotBytes = data.length;
    this.socket.send(data); return true;
  }
  async create(stage) { await this.connect(); this.send({ t: 'create', stage }); }
  async join(code) { await this.connect(); this.send({ t: 'join', code: code.trim().toUpperCase() }); }
  start(stage) { this.send({ t: 'start', stage }); }
  action(action, slot) { this.send({ t: 'action', action, slot }); }
  input(input) {
    const bits = encodeInput(input), now = performance.now();
    if (bits !== this.lastBits || now - this.lastInput > 100) {
      this.send({ t: 'input', bits, seq: ++this.seq }); this.lastBits = bits; this.lastInput = now;
    }
  }
  snapshot(world) {
    if (this.socket?.readyState === WebSocket.OPEN && this.socket.bufferedAmount < 256 * 1024) this.send({ t: 'state', world, seq: ++this.seq });
  }
  leave() {
    this.send({ t: 'leave' }); this.playing = false; this.room = ''; this.role = ''; this.remote.clear();
    const socket = this.socket; this.socket = null; this.connected = false; this.connecting = null;
    if (socket) socket.close();
  }
}
