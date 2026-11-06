// Thin wrapper over @google/genai, plus a built-in Mock AI simulator when
// GEMINI_API_KEY is not configured so Studio can be tested end-to-end offline.
// Neither @google/genai nor sharp is imported at module evaluation time so
// `npm start` works even before optional AI/image packages are installed.
import { EXAMPLE_MODULE } from './mod-guide.mjs';
import { createMockSpritePng } from './sprites.mjs';

const MOCK_SPELLS_MODULE = `export default function setup(api) {
  api.on('useItem', (player, kind, game) => {
    if (kind === 'g') {
      game.freezeEnemies(3);
      game.clearEnemyBullets();
      game.damageEnemiesInRadius(player.x, player.y, 180, 6);
      return true;
    }
    if (kind === 'f') {
      game.healPlayer(30);
      return true;
    }
    return false;
  });
}
`;

function buildMockPatchFromText(text) {
  const patch = {};
  const labels = [];
  const ensure = (obj, k) => (obj[k] ||= {});

  if (/步枪|射速|打快/.test(text)) {
    ensure(ensure(patch, 'weapons'), 'rifle').cd = 0.12;
    patch.weapons.rifle.spd = 420;
    labels.push('步枪射速快一倍（冷却 0.12s）');
  }
  if (/散弹|霰弹|S弹/i.test(text)) {
    ensure(ensure(patch, 'weapons'), 'spread').per = 7;
    patch.weapons.spread.max = 21;
    labels.push('散弹枪增强为每次 7 发弹幕');
  }
  if (/激光|L弹/i.test(text)) {
    ensure(ensure(patch, 'weapons'), 'laser').cd = 0.18;
    patch.weapons.laser.spd = 520;
    labels.push('激光枪射速与弹速提升');
  }
  const livesMatch = text.match(/(\d+)\s*条命/);
  if (livesMatch || /命数|多给.*命/.test(text)) {
    const n = livesMatch ? Math.max(1, Math.min(99, Number(livesMatch[1]))) : 9;
    ensure(ensure(patch, 'player'), 'lives').normal = n;
    labels.push(`开局 ${n} 条命`);
  }
  if (/移速|跑得快|速度/.test(text)) {
    ensure(ensure(patch, 'player'), 'physics').runSpeed = 155;
    labels.push('主角奔跑速度提高到 155');
  }
  if (/跳得高|跳跃|重力/.test(text)) {
    ensure(ensure(patch, 'player'), 'physics').jumpVelocity = 340;
    labels.push('主角起跳速度提高到 340');
  }
  const hpMatch = text.match(/(\d+)\s*点?血/);
  if (hpMatch || /血条|气血/.test(text)) {
    const maxHp = hpMatch ? Math.max(1, Math.min(999, Number(hpMatch[1]))) : 64;
    ensure(patch, 'rules').health = { maxHp, hitDamage: 16, invincibleSeconds: 1, killHeal: 4, killHealEvery: 5 };
    labels.push(`开启 ${maxHp} 点气血条与杀敌回血`);
  }
  if (/怒气|大招/.test(text)) {
    ensure(patch, 'rules').rage = { enabled: 1, max: 100, onHit: 15, onKill: 25, ultimateDamage: 28, ultimateName: '破天大招' };
    labels.push('开启怒气槽与全屏大招（按 I 释放）');
  }
  if (/近战|棍花|斩击|弹反|反弹/.test(text)) {
    ensure(patch, 'rules').melee = { enabled: 1, range: 44, damage: 5, reflectBullets: 1, color: '#ffd24a' };
    labels.push('开启近战棍花斩击并可反弹敌弹');
  }
  if (/晚霞|天色|金红|夜色|滤镜/.test(text)) {
    const st1 = ensure(ensure(patch, 'stages'), '1');
    st1.theme = { skyTint: '#ff5a2a', tintAlpha: 0.28, hue: 18 };
    labels.push('第一关天色改为晚霞金红');
  }
  if (/开头先掉|补给/.test(text)) {
    const st1 = ensure(ensure(patch, 'stages'), '1');
    const kind = /激光/.test(text) ? 'L' : /火焰/.test(text) ? 'F' : 'S';
    st1.pods = [{ at: 200, y0: 92, kind }, { at: 760, y0: 88, kind: 'L' }, { at: 1420, y0: 96, kind: 'B' }];
    labels.push(`第一关开头投放 ${kind} 补给`);
  }
  if (/敌人血量|敌人硬|炮台|减半|血量翻倍/.test(text)) {
    const scale = /减半|脆|弱/.test(text) ? 0.5 : 2;
    ensure(patch, 'enemies').hpScale = scale;
    labels.push(scale < 1 ? '敌人血量减半' : '敌人血量翻倍');
  }
  if (/Boss|头目/i.test(text)) {
    ensure(patch, 'bosses').hpScale = /减半|弱/.test(text) ? 0.6 : 1.5;
    labels.push('调整 Boss 血量倍率');
  }

  if (!labels.length) {
    ensure(ensure(patch, 'weapons'), 'rifle').cd = 0.14;
    ensure(patch, 'rules').melee = { enabled: 1, range: 42, damage: 4, reflectBullets: 1, color: '#ffd24a' };
    ensure(patch, 'rules').rage = { enabled: 1, max: 100, onHit: 15, onKill: 25, ultimateDamage: 26, ultimateName: '觉醒冲击' };
    labels.push('模拟测试：提高步枪射速，开启近战斩击弹反与怒气大招');
  }
  return { patch, summary: labels.join('，') };
}

export function createMockGemini({ config = {}, usage } = {}) {
  let callSeq = 0;
  return {
    mock: true,
    models: { ...(config.models || {}), agent: 'mock-test-agent', image: 'mock-test-imagen' },
    async generate({ role = 'agent', contents = [] }) {
      usage?.check();
      usage?.record(role, { totalTokenCount: 120 });

      let lastUserIdx = -1;
      for (let i = contents.length - 1; i >= 0; i--) {
        if (contents[i].role === 'user' && contents[i].parts?.some(p => typeof p.text === 'string')) {
          lastUserIdx = i;
          break;
        }
      }
      const userText = lastUserIdx >= 0
        ? contents[lastUserIdx].parts.filter(p => p.text).map(p => p.text).join('\n').trim()
        : '';
      const toolTurns = lastUserIdx >= 0 ? contents.slice(lastUserIdx + 1) : [];
      const toolResponses = toolTurns
        .flatMap(t => t.parts || [])
        .filter(p => p.functionResponse)
        .map(p => p.functionResponse);

      const makeCall = (name, args) => {
        const fc = { id: `mock-call-${++callSeq}`, name, args };
        const parts = [{ functionCall: fc, thoughtSignature: 'mock-sig' }];
        return { content: { role: 'model', parts }, functionCalls: [fc], text: '', finishReason: 'STOP', usage: { totalTokenCount: 120 } };
      };

      if (toolResponses.length === 0) {
        if (/撤销|回退|还原/.test(userText)) {
          return makeCall('undo', {});
        }
        if (/画|皮肤|换皮|机甲|生图|精灵图/.test(userText)) {
          return makeCall('image_gen', {
            name: 'hero-mecha.png',
            prompt: userText,
            width: 24,
            height: 32,
            frames: 1,
            summary: '模拟生成银色机甲主角皮肤',
          });
        }
        if (/定身|法术|毫毛/.test(userText)) {
          return makeCall('code_write', {
            path: 'modules/spells.mjs',
            content: MOCK_SPELLS_MODULE,
            summary: '新增定身术与毫毛回血法术模块',
          });
        }
        if (/怪鸟|俯冲|新敌人|飞鸟|无人机/.test(userText)) {
          return makeCall('code_write', {
            path: 'modules/dive-bird.mjs',
            content: EXAMPLE_MODULE.replace('every: [3, 6]', 'every: [1.5, 3]'),
            summary: '新增会俯冲的机械怪鸟模块',
          });
        }
        const { patch, summary } = buildMockPatchFromText(userText);
        return makeCall('spec_patch', { patch_json: JSON.stringify(patch), summary });
      }

      const lastRes = toolResponses.at(-1);
      if (lastRes?.name === 'image_gen' && lastRes.response?.ok && !toolResponses.some(r => r.name === 'spec_patch')) {
        const fileName = String(lastRes.response.path || 'assets/hero-mecha.png').replace(/^assets\//, '');
        return makeCall('spec_patch', {
          patch_json: JSON.stringify({ skins: { player: { sprite: fileName, width: 24, height: 32, frames: 1 } } }),
          summary: `换上新生成的角色皮肤 ${fileName}`,
        });
      }

      const notes = toolResponses.map(r => {
        const res = r.response || {};
        if (!res.ok) return `工具 ${r.name} 执行提示：${res.error || '未通过'}`;
        if (r.name === 'spec_patch') return `已更新设置（${res.message || 'game.json'}），并通过自动试玩校验`;
        if (r.name === 'code_write') return `已写入代码模块 ${res.path || ''} 并通过隔离试玩检查`;
        if (r.name === 'image_gen') return `已生成模拟精灵图 ${res.path || ''}（${res.size?.width || 24}×${res.size?.height || 32}）`;
        if (r.name === 'undo') return `已撤销最近一次修改（${res.message || ''}）`;
        return `已完成 ${r.name}`;
      });
      const text = `【模拟测试模式】${notes.join('；')}。右侧预览已自动刷新，可以直接试玩体验！`;
      return {
        content: { role: 'model', parts: [{ text }] },
        functionCalls: [],
        text,
        finishReason: 'STOP',
        usage: { totalTokenCount: 120 },
      };
    },

    async image({ prompt = '', images = [] }) {
      usage?.check();
      usage?.record('image', { totalTokenCount: 200 });
      const data = await createMockSpritePng(prompt, images.length > 0);
      return { data, mimeType: 'image/png', text: 'mock sprite' };
    },
  };
}

export function createGemini({ config, usage }) {
  if (!config.apiKey) {
    if (config.mock === false) return null;
    return createMockGemini({ config, usage });
  }
  let aiPromise;
  const getAi = async () => {
    if (!aiPromise) {
      aiPromise = import('@google/genai').then(m => new m.GoogleGenAI({ apiKey: config.apiKey }));
    }
    return aiPromise;
  };
  return {
    mock: false,
    models: config.models,
    async generate({ role = 'agent', contents, systemInstruction, tools, signal }) {
      usage?.check();
      const model = config.models[role];
      if (!model) throw new Error(`没有为角色 ${role} 配置模型`);
      const ai = await getAi();
      const res = await ai.models.generateContent({
        model, contents,
        config: {
          systemInstruction, abortSignal: signal,
          ...(tools ? { tools: [{ functionDeclarations: tools }] } : {}),
          ...(role === 'agent' && config.agent?.thinkingLevel ? { thinkingConfig: { thinkingLevel: config.agent.thinkingLevel.toUpperCase() } } : {}),
        },
      });
      usage?.record(role, res.usageMetadata);
      const content = res.candidates?.[0]?.content || { role: 'model', parts: [] };
      const parts = content.parts || [];
      return {
        content,
        functionCalls: parts.filter(p => p.functionCall).map(p => p.functionCall),
        text: parts.filter(p => p.text && !p.thought).map(p => p.text).join('').trim(),
        finishReason: res.candidates?.[0]?.finishReason,
        usage: res.usageMetadata,
      };
    },
    async image({ prompt, images = [], aspectRatio = '1:1', pro = false, signal }) {
      usage?.check();
      const role = pro && config.models.imagePro ? 'imagePro' : 'image';
      const model = config.models[role];
      if (!model) throw new Error('没有配置图片模型（models.image）');
      const ai = await getAi();
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [...images.map(img => ({ inlineData: { mimeType: img.mimeType, data: Buffer.from(img.data).toString('base64') } })), { text: prompt }] }],
        config: { abortSignal: signal, responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio } },
      });
      usage?.record(role, res.usageMetadata);
      const parts = res.candidates?.[0]?.content?.parts || [];
      const image = parts.find(p => p.inlineData?.data && !p.thought) || parts.find(p => p.inlineData?.data);
      const text = parts.filter(p => p.text && !p.thought).map(p => p.text).join('').trim();
      if (!image) throw new Error(`图片模型没有返回图片${text ? '：' + text.slice(0, 200) : `（${res.candidates?.[0]?.finishReason || '无结果'}）`}`);
      return { data: Buffer.from(image.inlineData.data, 'base64'), mimeType: image.inlineData.mimeType || 'image/png', text };
    },
  };
}
