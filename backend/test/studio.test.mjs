import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createBackend } from '../server.mjs';
import { createProjectStore } from '../projects.mjs';
import { runAgentTurn, describeSchema, systemPrompt } from '../ai/agent.mjs';
import { createUsageMeter } from '../ai/config.mjs';

const root = path.resolve(new URL('../../', import.meta.url).pathname);
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'studio-test-'));
const newStore = () => createProjectStore({ dir: path.join(tmp(), 'projects'), templatesDir: path.join(root, 'templates') });

/** Scripted LLM: each entry is either {calls:[{name,args}]} or {text}. Records every request. */
function fakeLlm(script) {
  const requests = [];
  return {
    requests,
    async generate(request) {
      requests.push(structuredClone({ contents: request.contents, tools: request.tools.map(t => t.name) }));
      const next = script.shift();
      if (!next) throw new Error('fake llm: script exhausted');
      const parts = next.calls ? next.calls.map((c, i) => ({ functionCall: { id: `call-${requests.length}-${i}`, ...c }, thoughtSignature: 'sig' })) : [{ text: next.text }];
      return { content: { role: 'model', parts }, functionCalls: parts.filter(p => p.functionCall).map(p => p.functionCall), text: next.text || '' };
    },
  };
}

test('project store: create, patch, history, undo and restore are git commits', async () => {
  const store = newStore();
  const { id } = await store.create({ id: 'demo', title: '我的魂斗罗' });
  assert.equal(id, 'demo');
  assert.equal((await store.readSpec('demo')).meta.title, '我的魂斗罗');
  await assert.rejects(store.create({ id: 'demo' }), /已存在/);
  await assert.rejects(store.create({ id: 'Bad ID' }), /小写字母/);

  const a = await store.patchSpec('demo', { weapons: { rifle: { cd: 0.12 } } }, '步枪射速翻倍');
  assert.ok(a.changed);
  const b = await store.patchSpec('demo', { player: { lives: { normal: 9 } } }, '9 条命');
  assert.equal((await store.resolvedSpec('demo')).player.lives.normal, 9);
  assert.equal((await store.patchSpec('demo', { player: { lives: { normal: 9 } } }, 'same')).changed, false, 'no-op patches do not create versions');
  await assert.rejects(store.patchSpec('demo', { player: { lives: { normal: 0 } } }), err => err.status === 422 && /不能小于 1/.test(err.details.join()));

  assert.deepEqual((await store.history('demo')).map(v => v.message), ['9 条命', '步枪射速翻倍', '创建项目（模板：contra）']);
  const undo = await store.undo('demo');
  assert.equal(undo.spec.player, undefined);
  assert.equal(undo.spec.weapons.rifle.cd, 0.12);
  assert.equal((await store.history('demo'))[0].message, '撤销：9 条命');
  assert.equal((await store.readSpec('demo', b.commit)).player.lives.normal, 9, 'old versions stay readable');
  await store.restore('demo', b.commit);
  assert.equal((await store.readSpec('demo')).player.lives.normal, 9);
  assert.equal((await store.list())[0].title, '我的魂斗罗');

  const fresh = newStore();
  await fresh.create({ id: 'x' });
  await assert.rejects(fresh.undo('x'), /最初版本/);
  void a;
});

test('project store serializes concurrent writes', async () => {
  const store = newStore();
  await store.create({ id: 'race' });
  await Promise.all([1, 2, 3, 4, 5].map(n => store.patchSpec('race', { enemies: { types: { [`t${'abcde'[n - 1]}x`]: { hp: n } } } }, `改 ${n}`)));
  assert.equal(Object.keys((await store.readSpec('race')).enemies.types).length, 5);
  assert.equal((await store.history('race')).length, 6);
});

test('agent: a chat message becomes a validated, playtested, committed spec change', async () => {
  const store = newStore();
  await store.create({ id: 'chat' });
  const llm = fakeLlm([
    { calls: [{ name: 'spec_get', args: {} }] },
    { calls: [{ name: 'spec_patch', args: { patch_json: '{"weapons":{"rifle":{"cd":0}}}', summary: '射速极限' } }] },
    { calls: [{ name: 'spec_patch', args: { patch_json: '{"weapons":{"rifle":{"cd":0.12}},"player":{"lives":{"normal":5}}}', summary: '步枪射速翻倍，初始 5 条命' } }] },
    { text: '已把步枪射击间隔从 0.24 秒改成 0.12 秒，初始命数改成 5。' },
  ]);
  const turn = await runAgentTurn({ llm, store, projectId: 'chat', message: '步枪打快一倍，给 5 条命' });
  assert.match(turn.reply, /0\.12/);
  assert.deepEqual(turn.steps.map(s => [s.name, s.ok]), [['spec_get', true], ['spec_patch', false], ['spec_patch', true]]);
  assert.equal(turn.changes.length, 1);
  const spec = await store.readSpec('chat');
  assert.equal(spec.weapons.rifle.cd, 0.12);
  assert.equal(spec.player.lives.normal, 5);
  // The rejected patch reported the validation error back to the model, with the call id.
  const rejected = llm.requests[2].contents.at(-1).parts[0].functionResponse;
  assert.equal(rejected.name, 'spec_patch');
  assert.equal(rejected.id, 'call-2-0');
  assert.match(rejected.response.details.join(), /weapons\.rifle\.cd: 不能小于 0\.03/);
  // Model turns are replayed unchanged (thought signatures preserved).
  assert.equal(llm.requests[1].contents[1].parts[0].thoughtSignature, 'sig');
  assert.equal(llm.requests[3].contents.at(-1).parts[0].functionResponse.response.ok, true);
});

test('agent prompt documents every field with its template default', () => {
  const lines = describeSchema();
  assert.ok(lines.some(l => l.startsWith('weapons.rifle.cd (数字 0.03~2)') && l.includes('模板默认 0.24')), lines.join('\n'));
  assert.ok(lines.some(l => l.startsWith('player.lives.normal (整数 1~99)') && l.includes('模板默认 3')));
  assert.ok(lines.some(l => l.startsWith('stages.<键>.pods')));
  assert.ok(systemPrompt().includes('spec_patch'));
});

test('usage meter enforces the daily token limit and rolls over by date', () => {
  let day = '2026-11-05';
  const meter = createUsageMeter({ file: path.join(tmp(), 'u.json'), dailyTokens: 100, now: () => new Date(day + 'T12:00:00Z') });
  meter.check();
  meter.record('agent', { totalTokenCount: 120 });
  assert.throws(() => meter.check(), err => err.status === 429);
  day = '2026-11-06';
  meter.check();
  assert.equal(meter.snapshot().tokens, 0);
});

test('studio HTTP API: token auth, projects, chat, preview page and undo', { timeout: 20000 }, async () => {
  const llm = fakeLlm([
    { calls: [{ name: 'spec_patch', args: { patch_json: '{"enemies":{"hpScale":2}}', summary: '敌人血量翻倍' } }] },
    { text: '敌人血量已翻倍。' },
  ]);
  const app = await createBackend({ studio: { dataDir: tmp(), token: 's3cret', llm, aiConfig: { models: { agent: 'fake' }, agent: {}, limits: {} } } });
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  const call = (method, url, body, auth = true) => fetch(origin + url, {
    method, headers: { 'content-type': 'application/json', ...(auth ? { authorization: 'Bearer s3cret' } : {}) },
    body: body && JSON.stringify(body),
  });
  try {
    assert.equal((await call('GET', '/api/projects', null, false)).status, 401);
    assert.deepEqual(await (await call('GET', '/api/studio/status', null, false)).json().then(s => [s.auth, s.authorized, s.ai.configured]), [true, false, true]);
    assert.equal((await call('POST', '/api/projects', { id: 'web', title: '网页项目' })).status, 201);
    assert.equal((await (await call('GET', '/api/projects')).json())[0].id, 'web');

    const chat = await (await call('POST', '/api/projects/web/chat', { message: '敌人硬一点' })).json();
    assert.equal(chat.reply, '敌人血量已翻倍。');
    assert.equal(chat.spec.enemies.hpScale, 2);
    assert.equal((await (await call('GET', '/api/projects/web/chat')).json()).length, 2);

    // The preview page and its game.json are public so play links can be shared.
    const page = await fetch(origin + '/play/web/');
    assert.equal(page.status, 200);
    assert.match(await page.text(), /main\.mjs\?v=spec-1/);
    assert.equal((await (await fetch(origin + '/api/projects/web/game.json')).json()).enemies.hpScale, 2);
    assert.equal((await fetch(origin + '/play/missing/')).status, 404);

    const project = await (await call('GET', '/api/projects/web')).json();
    assert.equal(project.resolved.weapons.rifle.cd, 0.24);
    assert.equal(project.history[0].message, '敌人血量翻倍');
    assert.equal((await call('PATCH', '/api/projects/web/game.json', { patch: { weapons: { rifle: { cd: 9 } } } })).status, 422);
    const undone = await (await call('POST', '/api/projects/web/undo')).json();
    assert.equal(undone.spec.enemies, undefined);
    const schema = await (await call('GET', '/api/spec/schema')).json();
    assert.equal(schema.defaults.weapons.rifle.cd, 0.24);
    assert.equal(schema.schema.props.stages.key, '^[1-8]$');
  } finally {
    await app.close();
  }
});
