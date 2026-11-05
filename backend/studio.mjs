// Studio HTTP API: projects (git-backed game.json), chat with the creation agent,
// and the /play/<project>/ preview pages. Mounted by backend/server.mjs.
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { createProjectStore, ProjectError } from './projects.mjs';
import { loadAiConfig, createUsageMeter } from './ai/config.mjs';
import { createGemini } from './ai/gemini.mjs';
import { runAgentTurn, describeSchema } from './ai/agent.mjs';
import { GAME_SPEC_SCHEMA, CONTRA_SPEC_DEFAULTS, ITEM_KINDS, ENEMY_TYPES } from '../games/shared/game-spec.mjs';

const require = createRequire(import.meta.url);
const express = require('express');

/**
 * @param {object} options
 * @param {string} options.root        repository root
 * @param {string} [options.dataDir]   where projects and usage are stored
 * @param {string} [options.token]     shared Studio token (STUDIO_TOKEN); empty = no auth (local dev only)
 * @param {object} [options.llm]       LLM override (tests); default is Gemini from backend/config/ai.json + env
 */
export function createStudio({ root, dataDir, token = process.env.STUDIO_TOKEN || '', llm, aiConfig } = {}) {
  dataDir ||= process.env.GAMES_DATA_DIR || path.join(root, 'backend', 'data');
  const store = createProjectStore({ dir: path.join(dataDir, 'projects'), templatesDir: path.join(root, 'templates') });
  aiConfig ||= loadAiConfig();
  const usage = createUsageMeter({ file: path.join(dataDir, 'ai-usage.json'), dailyTokens: aiConfig.limits?.dailyTokens });
  if (llm === undefined) llm = createGemini({ config: aiConfig, usage });
  const busy = new Set();

  const router = express.Router({ strict: true }); // strict: /play/x and /play/x/ are different routes
  const json = express.json({ limit: '1mb' });
  const wrap = handler => async (req, res) => {
    try { await handler(req, res); }
    catch (error) {
      const status = error instanceof ProjectError ? error.status : error.status || 500;
      if (status >= 500) console.error('[studio]', error);
      res.status(status).json({ error: error.message, details: error.details });
    }
  };
  const authorized = req => {
    if (!token) return true;
    const given = Buffer.from(String(req.get('authorization') || '').replace(/^Bearer\s+/i, ''));
    const expected = Buffer.from(token);
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  };
  const auth = (req, res, next) => authorized(req) ? next() : res.status(401).json({ error: '需要 Studio 口令' });

  // Public: preview pages and their game.json, so play links can be shared with testers.
  router.get('/api/projects/:id/game.json', wrap(async (req, res) => {
    res.set('Cache-Control', 'no-store').json(await store.readSpec(req.params.id, req.query.rev || undefined));
  }));
  router.get('/play/:id', (req, res) => res.redirect(301, `/play/${encodeURIComponent(req.params.id)}/` + (req._parsedUrl.search || '')));
  router.get('/play/:id/', wrap(async (req, res) => {
    const spec = await store.readSpec(req.params.id);
    if (spec.template !== 'contra') throw new ProjectError(400, `暂不支持模板 ${spec.template}`);
    res.set('Cache-Control', 'no-store').sendFile(path.join(root, 'games', 'contra2026', 'index.html'));
  }));

  router.get('/api/studio/status', (req, res) => res.json({
    auth: !!token, authorized: authorized(req), ai: { configured: !!llm, models: aiConfig.models, usage: usage.snapshot() },
  }));

  router.use('/api', auth, json);
  router.get('/api/spec/schema', (req, res) => res.json({
    schema: JSON.parse(JSON.stringify(GAME_SPEC_SCHEMA, (key, value) => value instanceof RegExp ? value.source : value)),
    defaults: CONTRA_SPEC_DEFAULTS, itemKinds: ITEM_KINDS, enemyTypes: ENEMY_TYPES, fields: describeSchema(),
  }));
  router.get('/api/projects', wrap(async (req, res) => res.json(await store.list())));
  router.post('/api/projects', wrap(async (req, res) => res.status(201).json(await store.create(req.body || {}))));
  router.get('/api/projects/:id', wrap(async (req, res) => {
    const id = req.params.id;
    res.json({ id, spec: await store.readSpec(id), resolved: await store.resolvedSpec(id), history: await store.history(id, 30) });
  }));
  router.put('/api/projects/:id/game.json', wrap(async (req, res) => res.json(await store.writeSpec(req.params.id, req.body?.spec, req.body?.message || '手动编辑 game.json'))));
  router.patch('/api/projects/:id/game.json', wrap(async (req, res) => res.json(await store.patchSpec(req.params.id, req.body?.patch, req.body?.message || '手动修改'))));
  router.get('/api/projects/:id/history', wrap(async (req, res) => res.json(await store.history(req.params.id, Number(req.query.limit) || 50))));
  router.get('/api/projects/:id/diff/:rev', wrap(async (req, res) => res.type('text/plain').send(await store.diff(req.params.id, req.params.rev))));
  router.post('/api/projects/:id/undo', wrap(async (req, res) => res.json(await store.undo(req.params.id))));
  router.post('/api/projects/:id/restore', wrap(async (req, res) => res.json(await store.restore(req.params.id, String(req.body?.commit || '')))));
  router.get('/api/projects/:id/chat', wrap(async (req, res) => res.json(await store.readChat(req.params.id))));
  router.post('/api/projects/:id/chat', wrap(async (req, res) => {
    const id = req.params.id, message = String(req.body?.message || '').trim();
    if (!message) throw new ProjectError(400, '消息不能为空');
    if (message.length > 4000) throw new ProjectError(400, '消息太长（最多 4000 字）');
    if (!llm) throw new ProjectError(503, 'AI 还没有配置：请在服务器环境变量里设置 GEMINI_API_KEY');
    await store.readSpec(id);
    if (busy.has(id)) throw new ProjectError(409, '上一条消息还在处理中');
    busy.add(id);
    try {
      const history = (await store.readChat(id)).slice(-(aiConfig.agent?.historyTurns || 12));
      const turn = await runAgentTurn({ llm, store, projectId: id, message, history, maxSteps: aiConfig.agent?.maxSteps || 8 });
      const at = new Date().toISOString();
      await store.appendChat(id, [{ role: 'user', text: message, at }, { role: 'model', text: turn.reply, changes: turn.changes, steps: turn.steps, at }]);
      res.json({ ...turn, spec: await store.readSpec(id) });
    } finally { busy.delete(id); }
  }));

  return { router, store, usage };
}
