import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename);

// 读取 vercel.json 规则实现精准的本地路由模拟
let rewrites = [];
try {
  const vercelConfig = JSON.parse(readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'));
  rewrites = vercelConfig.rewrites || [];
} catch (e) {
  rewrites = [];
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

let gamesBackend;
const server = createServer((req, res) => {
  try {
    let reqUrl = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(reqUrl.pathname);
    if (pathname === '/healthz' && gamesBackend) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(gamesBackend.health()));
      return;
    }

    // 0. 特殊容错：如果客户端无斜杠访问导致请求 /games/css/* 或 /games/js/* 或 /games/*.webmanifest
    if (pathname.startsWith('/games/css/') || pathname.startsWith('/games/js/') || pathname.startsWith('/games/favicon.svg') || pathname.startsWith('/games/manifest.webmanifest')) {
      const fixedPath = pathname.replace('/games/', '/games/junqi/');
      const checkTarget = path.join(rootDir, fixedPath.replace(/^\//, ''));
      if (existsSync(checkTarget) && !statSync(checkTarget).isDirectory()) {
        pathname = fixedPath;
      }
    }

    // 1. 尝试根据 rewrites 规则重写路径
    let matchedDest = null;
    for (const rule of rewrites) {
      if (rule.source === pathname || (rule.source.endsWith('/') && pathname + '/' === rule.source)) {
        matchedDest = rule.destination;
        break;
      }
    }

    let filePath;
    if (matchedDest) {
      filePath = path.join(rootDir, matchedDest.replace(/^\//, ''));
    } else {
      filePath = path.join(rootDir, pathname.replace(/^\//, ''));
    }

    // 2. 目录规范：若缺少尾部斜杠，301 重定向以修正浏览器的 Base URL
    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      if (!reqUrl.pathname.endsWith('/')) {
        res.writeHead(301, {
          'Location': reqUrl.pathname + '/' + (reqUrl.search || '')
        });
        res.end();
        return;
      }
      filePath = path.join(filePath, 'index.html');
    }

    // 3. 尝试干净 URL (.html 后缀)
    if (!existsSync(filePath) && existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }

    // 4. 尝试 games/ 子目录容错（例如 /junqi/js/* 映射到 games/junqi/js/*）
    if (!existsSync(filePath) && !pathname.startsWith('/games/')) {
      const fallback = path.join(rootDir, 'games', pathname.replace(/^\//, ''));
      if (existsSync(fallback)) {
        if (statSync(fallback).isDirectory()) {
          if (!reqUrl.pathname.endsWith('/')) {
            res.writeHead(301, {
              'Location': reqUrl.pathname + '/' + (reqUrl.search || '')
            });
            res.end();
            return;
          }
          filePath = path.join(fallback, 'index.html');
        } else {
          filePath = fallback;
        }
      }
    }

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    createReadStream(filePath).pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`500 Server Error: ${err.message}`);
  }
});

// 预览与云端共用同一套后台挂载逻辑。
try {
  const { attachGames } = await import('./backend/runtime.mjs');
  gamesBackend = await attachGames(server);
  console.log('[后台] 军棋与干瞪眼已统一挂载');
} catch (e) {
  console.log('[后台] 未启用联机服务，请在根目录运行 npm install：', e.message);
}

const defaultPort = 3000;
function tryListen(port, maxAttempts = 10) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && maxAttempts > 0) {
      tryListen(port + 1, maxAttempts - 1);
    } else {
      console.error(`无法启动服务:`, err);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`🎮 本地小游戏站点预览服务已启动！`);
    console.log(`> 本地访问地址: http://localhost:${port}`);
    console.log(`> 局域网访问地址: http://127.0.0.1:${port}`);
    console.log(`========================================\n`);
  });
}

tryListen(defaultPort);
