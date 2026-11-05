// 萌兵军棋服务器：静态文件 + WebSocket（/ws）。
//   PORT       监听端口，默认 3000
//   HOST       监听地址，默认 0.0.0.0
//   DATA_FILE  玩家存档路径，默认 data/players.json
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';
import { Store } from './store.js';
import { Lobby } from './lobby.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const SHARED = path.join(ROOT, 'shared');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.loli.net",
    "font-src 'self' data: https://fonts.gstatic.com https://gstatic.loli.net",
    "img-src 'self' data:",
    "connect-src 'self' ws: wss:",
    "base-uri 'self'",
    "frame-ancestors 'self'"
  ].join('; ')
};

const MAX_CONN_PER_IP = +(process.env.MAX_CONN_PER_IP || 40);

/**
 * 客户端 IP：直连时用对端地址；经本机反向代理（或 TRUST_PROXY=1）时取 X-Forwarded-For 的最后一项——
 * 那是最近一层代理追加的真实地址，前面的项客户端可以随意伪造。
 */
function clientIp(req) {
  const ra = req.socket.remoteAddress || '';
  const xff = req.headers['x-forwarded-for'];
  const trust = process.env.TRUST_PROXY === '1' || /^(::1$|127\.|::ffff:127\.)/.test(ra);
  if (trust && typeof xff === 'string' && xff.trim()) {
    const parts = xff.split(',').map((x) => x.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return ra;
}

/** 解析请求路径；畸形 URL 返回 null（不能让一个坏请求把进程打挂） */
function pathnameOf(req) {
  try { return new URL(req.url, 'http://localhost').pathname; } catch { return null; }
}

/** 把请求路径映射到磁盘文件；越界返回 null */
function resolveFile(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath); } catch { return null; }
  if (p.includes('\0')) return null;
  let base = PUBLIC;
  if (p === '/' || p === '') p = '/index.html';
  if (p.startsWith('/shared/')) { base = SHARED; p = p.slice('/shared'.length); }
  const file = path.resolve(base, '.' + path.posix.normalize(p));
  if (file !== base && !file.startsWith(base + path.sep)) return null;
  return file;
}

function serveStatic(req, res, lobby) {
  const pathname = pathnameOf(req);
  if (pathname === null) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 请求地址无效');
    return;
  }
  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ok: true, ...lobby.stats() }));
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }
  const file = resolveFile(pathname);
  const notFound = () => { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS }); res.end('404 没有这个页面'); };
  if (!file) return notFound();
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return notFound();
    const etag = 'W/"' + st.size.toString(16) + '-' + Math.floor(st.mtimeMs).toString(16) + '"';
    const headers = {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      ETag: etag,
      ...SECURITY_HEADERS
    };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); res.end(); return; }
    headers['Content-Length'] = st.size;
    res.writeHead(200, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  });
}

/**
 * 创建服务器（测试里也用它）。
 * @returns {{ server: http.Server, lobby: Lobby, store: Store, listen: (port?:number, host?:string)=>Promise<number>, close: ()=>Promise<void> }}
 */
export function createServer({ dataFile = null, timing, now, bot, log = console, httpServer = null, wsPaths = ['/ws'] } = {}) {
  const store = new Store({ file: dataFile, now, log });
  const lobby = new Lobby({ store, timing, now, bot, log });
  const server = httpServer || http.createServer((req, res) => serveStatic(req, res, lobby));
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

  const perIp = new Map();
  server.on('upgrade', (req, socket, head) => {
    socket.on('error', () => {});
    if (!wsPaths.includes(pathnameOf(req))) { if (!httpServer) socket.destroy(); return; }
    // 连接数超限直接在握手阶段拒绝，不进入 WebSocket 层
    const ip = clientIp(req);
    if ((perIp.get(ip) || 0) >= MAX_CONN_PER_IP) {
      socket.end('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req, ip));
  });

  wss.on('connection', (ws, req, ip) => {
    perIp.set(ip, (perIp.get(ip) || 0) + 1);
    ws.on('close', () => {
      const left = (perIp.get(ip) || 1) - 1;
      if (left > 0) perIp.set(ip, left); else perIp.delete(ip);
    });
    const conn = {
      id: crypto.randomBytes(4).toString('hex'),
      ip,
      alive: true,
      send(obj) { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj)); },
      close(code, reason) { try { ws.close(code, reason); } catch { ws.terminate(); } }
    };
    ws.conn = conn;
    lobby.connect(conn);
    ws.on('message', (data, isBinary) => { if (!isBinary) lobby.message(conn, data.toString()); });
    ws.on('pong', () => { conn.alive = true; });
    ws.on('close', () => lobby.disconnect(conn));
    ws.on('error', () => {});
  });

  // 心跳：25 秒没回应的连接直接断开（手机切后台、网络掉线）
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.conn || !ws.conn.alive) { ws.terminate(); continue; }
      ws.conn.alive = false;
      try { ws.ping(); } catch { /* ignore */ }
    }
  }, 25000);
  const ticker = setInterval(() => {
    try { lobby.tick(); } catch (e) { log.error('[tick]', e); }
  }, 250);
  heartbeat.unref?.();

  return {
    server,
    wss,
    lobby,
    store,
    listen(port = 3000, host = '0.0.0.0') {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => resolve(server.address().port));
      });
    },
    close() {
      clearInterval(heartbeat);
      clearInterval(ticker);
      for (const ws of wss.clients) ws.terminate();
      store.flush();
      return new Promise((resolve) => server.close(() => resolve()));
    }
  };
}

// 直接运行：node server/index.js
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = +(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  const dataFile = path.resolve(ROOT, process.env.DATA_FILE || 'data/players.json');
  const app = createServer({ dataFile });
  app.listen(port, host).then((p) => {
    const shown = dataFile.startsWith(ROOT + path.sep) ? path.relative(ROOT, dataFile) : dataFile;
    console.log(`萌兵军棋已启动：http://localhost:${p}  （存档：${shown}）`);
  }).catch((e) => {
    console.error('启动失败：', e.message);
    process.exit(1);
  });
  let closing = false;
  const shutdown = (sig) => {
    if (closing) return;
    closing = true;
    console.log(`\n收到 ${sig}，保存存档后退出…`);
    app.close().then(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
