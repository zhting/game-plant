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
    assert.match(await page.text(), /main\.mjs\?v=m4-1/);
    assert.equal((await (await fetch(origin + '/api/projects/web/game.json')).json()).enemies.hpScale, 2);
    assert.equal((await fetch(origin + '/play/missing/')).status, 404);

    // Wukong template project creation and preview page
    assert.equal((await call('POST', '/api/projects', { id: 'wk', title: '大圣项目', template: 'wukong' })).status, 201);
    const wkPage = await fetch(origin + '/play/wk/');
    assert.equal(wkPage.status, 200);
    assert.match(await wkPage.text(), /悟空/);

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

test('agent: code_write checks, playtests and commits a module enemy; broken code is rejected', { timeout: 60000 }, async () => {
  const { EXAMPLE_MODULE } = await import('../ai/mod-guide.mjs');
  const store = newStore();
  await store.create({ id: 'mods' });
  const broken = EXAMPLE_MODULE.replace("e.x += e.vx * game.dt;", "e.x += e.vx * game.dt; if (e.age > 0.2) throw new Error('翅膀坏了');");
  const llm = fakeLlm([
    { calls: [{ name: 'code_write', args: { path: 'modules/bird.mjs', content: "import x from 'y';\nexport default () => {}", summary: 'x' } }] },
    { calls: [{ name: 'code_write', args: { path: 'modules/bird.mjs', content: broken, summary: '新增怪鸟' } }] },
    { calls: [{ name: 'code_write', args: { path: 'modules/bird.mjs', content: EXAMPLE_MODULE.replace('every: [3, 6]', 'every: [1, 2]'), summary: '新增会俯冲的怪鸟' } }] },
    { calls: [{ name: 'code_list', args: {} }] },
    { text: '加好了：会俯冲的怪鸟。' },
  ]);
  const turn = await runAgentTurn({ llm, store, projectId: 'mods', message: '加一种会飞会俯冲的敌人' });
  assert.deepEqual(turn.steps.map(s => [s.name, s.ok]), [['code_write', false], ['code_write', false], ['code_write', true], ['code_list', true]]);
  const responses = llm.requests.slice(1).map(r => r.contents.at(-1).parts[0].functionResponse.response);
  assert.match(responses[0].details.join(), /不能使用 import/);
  assert.match(responses[1].error, /翅膀坏了/);
  assert.equal(responses[2].ok, true);
  assert.ok(responses[2].playtest[0].customEnemies.diveBird.spawned >= 1, JSON.stringify(responses[2].playtest));
  assert.deepEqual(responses[3].enemies.map(e => e.type), ['diveBird']);
  assert.equal(turn.changes.length, 1);
  assert.deepEqual((await store.listFiles('mods', 'modules')).map(f => f.path), ['modules/bird.mjs']);
  // Undo removes the module again; restore brings back the whole tree.
  const added = (await store.history('mods'))[0].commit;
  await store.undo('mods');
  assert.deepEqual(await store.listFiles('mods', 'modules'), []);
  await store.restore('mods', added);
  assert.deepEqual((await store.listFiles('mods', 'modules')).map(f => f.path), ['modules/bird.mjs']);
  assert.ok(systemPrompt().includes('api.defineEnemy'));
});

test('studio HTTP API: module and asset files + sprite edit & AI region inpaint', { timeout: 30000 }, async () => {
  const { EXAMPLE_MODULE } = await import('../ai/mod-guide.mjs');
  const sharp = (await import('sharp')).default;
  const fakeLlmImg = {
    async image() {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><circle cx="30" cy="30" r="24" fill="#e03020" stroke="#101010" stroke-width="4"/></svg>';
      const data = await sharp({ create: { width: 120, height: 120, channels: 3, background: '#ff00ff' } }).composite([{ input: Buffer.from(svg), left: 30, top: 30 }]).png().toBuffer();
      return { data, mimeType: 'image/png', text: '' };
    },
  };
  const app = await createBackend({ studio: { dataDir: tmp(), token: 't', llm: fakeLlmImg, aiConfig: { models: {}, agent: {}, limits: {} } } });
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  const auth = { authorization: 'Bearer t' };
  try {
    await fetch(origin + '/api/projects', { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ id: 'files' }) });
    const put = (rel, body, type) => fetch(`${origin}/api/projects/files/files/${rel}`, { method: 'PUT', headers: { ...auth, 'content-type': type }, body });
    assert.equal((await put('modules/bird.mjs', EXAMPLE_MODULE, 'text/plain', false)).status, 200);
    const bad = await put('modules/bad.mjs', 'export default api => api.defineEnemy("run", {})', 'text/plain');
    assert.equal(bad.status, 422);
    assert.match((await bad.json()).details.join(), /原版敌人重名/);
    assert.equal((await put('modules/../x.mjs', 'x', 'text/plain')).status, 404);
    const png = await sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 60, g: 140, b: 50, alpha: 1 } } }).png().toBuffer();
    assert.equal((await put('assets/bird.png', png, 'image/png')).status, 200);
    assert.equal((await put('assets/Bird.PNG', png, 'image/png')).status, 400);

    // Studio sprite edit endpoint (recolor)
    const editRes = await fetch(origin + '/api/projects/files/sprites/edit', {
      method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'bird.png', replace: [{ from: '#3c8c32', to: '#2060e0', tolerance: 20 }], message: '怪鸟换成蓝色' }),
    });
    assert.equal(editRes.status, 200);
    const editJson = await editRes.json();
    assert.equal(editJson.ok, true);
    assert.equal(editJson.replaced, 32 * 32);

    // Studio AI sprite generation + region inpainting endpoint
    const aiRes = await fetch(origin + '/api/projects/files/sprites/ai', {
      method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'bird.png', source: 'bird.png', prompt: '加一个红眼睛', width: 16, height: 16, frames: 1, region: { rx: 0.25, ry: 0.25, rw: 0.5, rh: 0.5 }, summary: '局部重绘怪鸟头部' }),
    });
    assert.equal(aiRes.status, 200);
    const aiJson = await aiRes.json();
    assert.equal(aiJson.ok, true);
    assert.ok(aiJson.editedRegion.w > 0);

    // Public loader endpoints (used by /play/<id>/).
    const list = await (await fetch(origin + '/api/projects/files/modules.json')).json();
    assert.equal(list.assetBase, '/api/projects/files/files/assets');
    assert.deepEqual(list.files.map(f => f.path), ['modules/bird.mjs']);
    const mod = await fetch(origin + list.files[0].url);
    assert.match(mod.headers.get('content-type'), /javascript/);
    assert.match(mod.headers.get('cache-control'), /immutable/);
    assert.equal(await mod.text(), EXAMPLE_MODULE);
    const image = await fetch(origin + '/api/projects/files/files/assets/bird.png');
    assert.equal(image.headers.get('content-type'), 'image/png');

    const project = await (await fetch(origin + '/api/projects/files', { headers: auth })).json();
    assert.deepEqual(project.files.assets.map(f => f.path), ['assets/bird.png']);
    assert.equal((await fetch(origin + '/api/projects/files/files/assets/bird.png', { method: 'DELETE', headers: auth })).status, 200);
    assert.equal((await fetch(origin + '/api/projects/files/files/assets/bird.png')).status, 404);
  } finally {
    await app.close();
  }
});

test('studio built-in Mock AI mode works without GEMINI_API_KEY', { timeout: 30000 }, async () => {
  const app = await createBackend({ studio: { dataDir: tmp(), token: '', aiConfig: { apiKey: '', models: {}, agent: {}, limits: {} } } });
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  try {
    const st = await (await fetch(origin + '/api/studio/status')).json();
    assert.equal(st.ai.configured, true);
    assert.equal(st.ai.mock, true);

    const createRes = await fetch(origin + '/api/projects', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: '模拟测试项目', template: 'wukong' }),
    });
    assert.equal(createRes.status, 201);
    const { id } = await createRes.json();

    const chatRes = await fetch(`${origin}/api/projects/${id}/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: '步枪射速快一倍，开局 5 条命，开启 64 点血条和怒气大招' }),
    });
    assert.equal(chatRes.status, 200);
    const chat = await chatRes.json();
    assert.match(chat.reply, /模拟测试模式/);
    assert.equal(chat.spec.weapons.rifle.cd, 0.12);
    assert.equal(chat.spec.player.lives.normal, 5);
    assert.equal(chat.spec.rules.health.maxHp, 64);

    const skinRes = await fetch(`${origin}/api/projects/${id}/chat`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: '给主角画一套银色机甲皮肤并换上' }),
    });
    assert.equal(skinRes.status, 200);
    const skinChat = await skinRes.json();
    assert.equal(skinChat.spec.skins.player.sprite, 'hero-mecha.png');
  } finally {
    await app.close();
  }
});
