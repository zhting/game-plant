import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { attachContra } from './backend/contra.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.woff': 'font/woff'
};
let game;
const server = http.createServer(async (req, res) => {
  const send = (code, body, type = 'text/plain; charset=utf-8') => {
    res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  try {
    if (!['GET', 'HEAD'].includes(req.method)) return send(405, 'Method not allowed');
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/healthz') return send(200, JSON.stringify({ok: true, contra2026: game.stats()}), 'application/json; charset=utf-8');
    // Use the included multiplayer service on localhost, LAN and HTTPS alike.
    if (pathname === '/backend-config.js') return send(200, "window.GAMES_BACKEND={url:'',contraPath:'/games/contra2026/ws'};", mime['.js']);
    if (['/', '/index.html', '/contra2026', '/contra2026/', '/games/contra2026', '/games/contra2026/'].includes(pathname)) pathname = '/games/contra2026/index.html';
    const allowed = pathname === '/games/contra2026/index.html' ||
      /^\/games\/contra2026\/(?:assets|css|js)\//.test(pathname) ||
      ['/games/shared/arcade-engine.mjs', '/games/shared/arcade.css'].includes(pathname);
    if (!allowed) return send(404, 'Not found');
    const target = path.resolve(root, '.' + pathname);
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return send(404, 'Not found');
    const info = await stat(target);
    if (!info.isFile()) return send(404, 'Not found');
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream',
      'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    if (req.method === 'HEAD') return res.end();
    const stream = createReadStream(target);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  } catch (error) {
    send(error.code === 'ENOENT' || error.code === 'ENOTDIR' || error instanceof URIError ? 404 : 500, 'File unavailable');
  }
});
game = attachContra(server);
server.on('upgrade', (req, socket) => {
  if (new URL(req.url, 'http://localhost').pathname !== '/games/contra2026/ws') socket.destroy();
});
server.on('error', async error => {
  console.error(error.code === 'EADDRINUSE' ? 'Port is in use. Try: set PORT=3188 && node server.mjs --open' : error.message);
  await game.close();
  process.exitCode = 1;
});
server.listen(Number(process.env.PORT || 3187), process.env.HOST || '0.0.0.0', () => {
  const url = `http://localhost:${server.address().port}/games/contra2026/`;
  console.log(`Contra 2026: ${url}\nKeep this window open. Press Ctrl+C to stop.`);
  if (process.argv.includes('--open')) {
    const command = process.platform === 'win32' ? ['cmd.exe', ['/c', 'start', '', url]] :
      process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
    const child = spawn(command[0], command[1], { detached: true, stdio: 'ignore', windowsHide: true });
    child.on('error', () => console.log('Open the URL above in your browser.'));
    child.unref();
  }
});
let closing = false;
async function stop() {
  if (closing) return;
  closing = true;
  await game.close();
  server.close();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
