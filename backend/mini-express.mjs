// Zero-dependency fallback for Express 4 when `node_modules/express` is not
// installed. Implements the exact subset of Express used by backend/server.mjs
// and backend/studio.mjs (routing, sub-routers, static files, json/raw body
// parsers, and response helpers).
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

function compilePattern(pattern, { prefix = false } = {}) {
  if (Array.isArray(pattern)) {
    const compiled = pattern.map(p => compilePattern(p, { prefix }));
    return pathname => {
      for (const fn of compiled) {
        const m = fn(pathname);
        if (m) return m;
      }
      return null;
    };
  }
  if (!pattern || pattern === '/') {
    if (prefix) return pathname => ({ params: {}, rest: pathname || '/' });
    return pathname => (pathname === '/' ? { params: {}, rest: '' } : null);
  }
  const keys = [];
  const src = pattern
    .replace(/\/+$/, match => (prefix ? '' : match))
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([A-Za-z0-9_]+)/g, (_, k) => {
      keys.push(k);
      return '([^/]+)';
    });
  const re = new RegExp(`^${src}${prefix ? '(?=/|$)' : '$'}`);
  return pathname => {
    const m = re.exec(pathname);
    if (!m) return null;
    const params = {};
    keys.forEach((k, i) => {
      try { params[k] = decodeURIComponent(m[i + 1]); } catch { params[k] = m[i + 1]; }
    });
    const rest = pathname.slice(m[0].length) || '/';
    return { params, rest };
  };
}

function readRawBody(req) {
  if (req._rawBodyPromise) return req._rawBodyPromise;
  req._rawBodyPromise = new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
  return req._rawBodyPromise;
}

function enhanceReqRes(req, res) {
  if (req._enhanced) return;
  req._enhanced = true;
  const u = new URL(req.url || '/', 'http://localhost');
  req._parsedUrl = { pathname: u.pathname, search: u.search || '' };
  req.originalUrl = req.url || '/';
  req.path = u.pathname;
  req.query = Object.fromEntries(u.searchParams.entries());
  req.params = {};
  req.get = name => req.headers[String(name || '').toLowerCase()];

  res.status = code => { res.statusCode = code; return res; };
  res.set = (k, v) => { res.setHeader(k, v); return res; };
  res.type = t => {
    const ct = t.includes('/') ? t : (MIME['.' + t.replace(/^\./, '')] || 'application/octet-stream');
    res.setHeader('Content-Type', ct);
    return res;
  };
  res.json = obj => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = data => {
    if (Buffer.isBuffer(data)) {
      if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/octet-stream');
      res.end(data);
    } else if (typeof data === 'object' && data !== null) {
      res.json(data);
    } else {
      if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(String(data ?? ''));
    }
    return res;
  };
  res.sendStatus = code => {
    res.statusCode = code;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(String(code));
    return res;
  };
  res.redirect = (codeOrUrl, maybeUrl) => {
    const code = typeof codeOrUrl === 'number' ? codeOrUrl : 302;
    const loc = typeof codeOrUrl === 'number' ? maybeUrl : codeOrUrl;
    res.statusCode = code;
    res.setHeader('Location', loc);
    res.end();
    return res;
  };
  res.sendFile = async absPath => {
    try {
      const st = await fsp.stat(absPath);
      if (!st.isFile()) return res.sendStatus(404);
      const ext = path.extname(absPath).toLowerCase();
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.setHeader('Content-Length', st.size);
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(absPath).pipe(res);
    } catch {
      res.sendStatus(404);
    }
  };
}

function createRouter() {
  const stack = [];
  const router = (req, res, outNext) => {
    enhanceReqRes(req, res);
    let idx = 0;
    const savedPath = req.path;
    const savedParams = req.params;

    const next = err => {
      req.path = savedPath;
      req.params = savedParams;
      if (err) {
        if (outNext) return outNext(err);
        res.statusCode = 500;
        return res.end(err.message || 'Internal Server Error');
      }
      const layer = stack[idx++];
      if (!layer) {
        if (outNext) return outNext();
        return res.sendStatus(404);
      }
      if (layer.method && layer.method !== req.method && !(layer.method === 'GET' && req.method === 'HEAD')) {
        return next();
      }
      const m = layer.match(savedPath);
      if (!m) return next();
      req.params = { ...savedParams, ...m.params };
      if (layer.prefix) req.path = m.rest;
      let hIdx = 0;
      const runHandler = hErr => {
        if (hErr) return next(hErr);
        const fn = layer.handlers[hIdx++];
        if (!fn) return next();
        try {
          const ret = fn(req, res, runHandler);
          if (ret && typeof ret.catch === 'function') ret.catch(runHandler);
        } catch (ex) {
          runHandler(ex);
        }
      };
      runHandler();
    };
    next();
  };

  router.disable = () => router;
  router.use = (...args) => {
    const hasPath = typeof args[0] === 'string' || Array.isArray(args[0]);
    const pattern = hasPath ? args[0] : '/';
    const handlers = (hasPath ? args.slice(1) : args).flat();
    stack.push({ method: null, prefix: true, match: compilePattern(pattern, { prefix: true }), handlers });
    return router;
  };
  for (const m of ['get', 'post', 'put', 'patch', 'delete']) {
    router[m] = (pattern, ...handlers) => {
      stack.push({ method: m.toUpperCase(), prefix: false, match: compilePattern(pattern, { prefix: false }), handlers: handlers.flat() });
      return router;
    };
  }
  router.router = router;
  return router;
}

function staticMiddleware(rootDir, opts = {}) {
  const indexFile = opts.index === undefined ? 'index.html' : opts.index;
  return async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    let rel = decodeURIComponent(req.path || '/').replace(/^\/+/, '');
    let target = path.resolve(rootDir, rel);
    if (!target.startsWith(path.resolve(rootDir))) return res.sendStatus(403);
    try {
      let st = await fsp.stat(target);
      if (st.isDirectory()) {
        if (!indexFile) return next();
        target = path.join(target, indexFile);
        st = await fsp.stat(target);
      }
      if (!st.isFile()) return next();
      const ext = path.extname(target).toLowerCase();
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.setHeader('Content-Length', st.size);
      if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=0');
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(target).pipe(res);
    } catch {
      next();
    }
  };
}

function jsonMiddleware() {
  return async (req, res, next) => {
    if (req.body !== undefined) return next();
    const ct = String(req.headers['content-type'] || '').toLowerCase();
    if (!ct.includes('application/json')) return next();
    try {
      const buf = await readRawBody(req);
      req.body = buf.length ? JSON.parse(buf.toString('utf8')) : {};
      next();
    } catch (err) {
      res.status(400).json({ error: '无效的 JSON 请求体' });
    }
  };
}

function rawMiddleware() {
  return async (req, res, next) => {
    if (Buffer.isBuffer(req.body)) return next();
    try {
      req.body = await readRawBody(req);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function loadExpress() {
  if (!process.env.FORCE_MINI_EXPRESS) {
    try {
      return require('express');
    } catch { /* fall through to built-in router */ }
  }
  const fn = () => createRouter();
  fn.Router = () => createRouter();
  fn.static = staticMiddleware;
  fn.json = jsonMiddleware;
  fn.raw = rawMiddleware;
  return fn;
}
