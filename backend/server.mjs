import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { attachGames } from './runtime.mjs';
import { createStudio } from './studio.mjs';

const require = createRequire(import.meta.url);
const express = require('express');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function createBackend(options = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); next(); });
  let games;
  app.get('/healthz', (req, res) => res.json(games.health()));
  // 后台同时提供入口页面；只公开前端目录。
  for (const file of ['index.html', 'backend-config.js']) {
    app.get(file === 'index.html' ? ['/', '/index.html'] : '/backend-config.js', (req, res) => res.sendFile(path.join(root, file)));
  }
  // Studio: creator UI (built by apps/studio), its API and /play/<project>/ previews.
  const studio = createStudio({ root, ...options.studio });
  app.use(studio.router);
  const studioDist = path.join(root, 'apps', 'studio', 'dist');
  app.use('/studio', express.static(studioDist, { index: 'index.html' }));
  app.use('/assets', express.static(path.join(root, 'assets')));
  app.use('/games/shared', express.static(path.join(root, 'games/shared')));
  for (const name of ['contra2026', 'wukong']) {
    const dir = path.join(root, 'games', name);
    app.get(['/'+name, '/games/'+name, '/games/'+name+'/'], (req, res) => res.sendFile(path.join(dir, 'index.html')));
    const staticFiles = express.static(dir);
    app.use('/games/'+name, (req, res, next) => {
      if (/(?:^|\/)(?:server|lib|data|node_modules|test|scripts|public|artifacts)(?:\/|$)/.test(req.path) || req.path.includes('..')) return res.sendStatus(404);
      if (!/^\/(?:assets|css|js|shared|3d)\//.test(req.path) &&
          !/^\/(?:index\.html|favicon\.svg|logo\.png|manifest\.webmanifest|sw\.js)$/.test(req.path)) return res.sendStatus(404);
      if (!/\.(?:html|css|js|mjs|json|svg|webmanifest|png|jpg|jpeg|webp|gif|ico|mp3|ogg|wav|woff2?)$/.test(req.path)) return next();
      staticFiles(req, res, next);
    });
  }
  app.use((req, res) => res.sendStatus(404));
  const server = http.createServer(app);
  games = await attachGames(server, options);
  return {
    server, games, studio,
    async close() {
      await games.close();
      server.closeAllConnections?.();
      await new Promise(resolve => server.close(() => resolve()));
    }
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { server, games } = await createBackend();
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  server.listen(port, host, () => console.log(`游戏统一后台：http://${host}:${server.address().port}（魂斗罗 + 大闹天宫 + Studio /studio/）`));
  let closing = false;
  async function shutdown() {
    if (closing) return;
    closing = true;
    const force = setTimeout(() => process.exit(1), 5000);
    force.unref();
    await games.close();
    clearTimeout(force);
    process.exit(0);
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

}
