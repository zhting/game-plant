import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { loadExpress } from './mini-express.mjs';
import { createStudio } from './studio.mjs';

const express = loadExpress();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function createBackend(options = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); next(); });
  let games = { health: () => ({ ok: true, ws: false }), close: async () => {} };
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
    app.get(['/' + name, '/games/' + name, '/games/' + name + '/'], (req, res) => res.sendFile(path.join(dir, 'index.html')));
    const staticFiles = express.static(dir);
    app.use('/games/' + name, (req, res, next) => {
      if (/(?:^|\/)(?:server|lib|data|node_modules|test|scripts|public|artifacts)(?:\/|$)/.test(req.path) || req.path.includes('..')) return res.sendStatus(404);
      if (!/^\/(?:assets|css|js|shared|3d)\//.test(req.path) &&
          !/^\/(?:index\.html|favicon\.svg|logo\.png|manifest\.webmanifest|sw\.js)$/.test(req.path)) return res.sendStatus(404);
      if (!/\.(?:html|css|js|mjs|json|svg|webmanifest|png|jpg|jpeg|webp|gif|ico|mp3|ogg|wav|woff2?)$/.test(req.path)) return next();
      staticFiles(req, res, next);
    });
  }
  app.use((req, res) => res.sendStatus(404));
  const server = http.createServer(app);
  try {
    const { attachGames } = await import('./runtime.mjs');
    games = await attachGames(server, options);
  } catch (err) {
    console.warn('[后台] WebSocket 联机模块未安装（单人模式与 Studio 正常可用）:', err.message);
  }
  return {
    server, games, studio,
    async close() {
      await games.close();
      server.closeAllConnections?.();
      await new Promise(resolve => server.close(() => resolve()));
    }
  };
}

const entryBase = process.argv[1] ? path.basename(process.argv[1]).toLowerCase() : '';
const isMain = process.argv[1] && (
  path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase() ||
  entryBase === 'preview-server.mjs' ||
  entryBase === 'server.mjs'
);

if (isMain) {
  const { server, games, studio } = await createBackend();
  try {
    if ((await studio.store.list()).length === 0) {
      await studio.store.create({ id: 'wukong-stage1-demo', title: '悟空传·花果山断崖', template: 'wukong' });
      await studio.store.writeFiles('wukong-stage1-demo', [{
        path: 'modules/spells.mjs',
        content: `export default function setup(api) {\n  api.on('useItem', (player, kind, game) => {\n    if (kind === 'g') {\n      game.freezeEnemies(3);\n      game.clearEnemyBullets();\n      game.damageEnemiesInRadius(player.x, player.y, 180, 6);\n      return true;\n    }\n    if (kind === 'f') {\n      game.healPlayer(30);\n      return true;\n    }\n    return false;\n  });\n}\n`,
      }], '挂载定身术与回血毫毛模块');
      await studio.store.create({ id: 'wukong-origin', title: '大闹天宫·原版基准', template: 'wukong' });
      await studio.store.create({ id: 'contra-mod-demo', title: '魂斗罗2026·创作演示', template: 'contra' });
    }
  } catch (err) {
    console.warn('[studio] 预置示例项目跳过:', err.message);
  }

  const startPort = Number(process.env.PORT || 8787);
  const host = process.env.HOST || '0.0.0.0';
  function tryListen(port, maxAttempts = 20) {
    const onError = err => {
      if (err.code === 'EADDRINUSE' && maxAttempts > 0) {
        console.warn(`端口 ${port} 已被占用，自动切换到端口 ${port + 1}...`);
        tryListen(port + 1, maxAttempts - 1);
      } else {
        console.error('无法启动服务:', err.message);
        process.exitCode = 1;
      }
    };
    server.once('error', onError);
    server.listen(port, host, () => {
      server.removeListener('error', onError);
      const actualPort = server.address().port;
      const studioUrl = `http://localhost:${actualPort}/studio/`;
      const homeUrl = `http://localhost:${actualPort}/`;
      console.log('\n========================================');
      console.log('🌱 Game Plant 本地服务已启动！');
      console.log(`> AI 创作台 Studio: ${studioUrl}`);
      console.log(`> 游戏大厅首页:     ${homeUrl}`);
      console.log(`> 魂斗罗2026:       ${homeUrl}games/contra2026/`);
      console.log(`> 大闹天宫:         ${homeUrl}games/wukong/`);
      console.log('========================================\n');
      if (process.argv.includes('--open')) {
        const cmd = process.platform === 'win32' ? ['cmd.exe', ['/c', 'start', '', studioUrl]] :
          process.platform === 'darwin' ? ['open', [studioUrl]] : ['xdg-open', [studioUrl]];
        const child = spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore', windowsHide: true });
        child.on('error', () => {});
        child.unref();
      }
    });
  }
  tryListen(startPort);

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
