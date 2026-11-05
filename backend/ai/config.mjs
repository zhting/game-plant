// AI configuration: backend/config/ai.json, overridable with environment variables
// so the server can switch models without a code change. The API key is read
// from the environment only and never written anywhere.
import fs from 'node:fs';
import path from 'node:path';

const ENV_MODELS = { agent: 'GEMINI_MODEL_AGENT', light: 'GEMINI_MODEL_LIGHT', image: 'GEMINI_MODEL_IMAGE', imagePro: 'GEMINI_MODEL_IMAGE_PRO', tts: 'GEMINI_MODEL_TTS' };

export function loadAiConfig({ file = new URL('../config/ai.json', import.meta.url), env = process.env } = {}) {
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [role, name] of Object.entries(ENV_MODELS)) if (env[name]) config.models[role] = env[name];
  if (env.AI_DAILY_TOKENS) config.limits.dailyTokens = Number(env.AI_DAILY_TOKENS);
  if (env.GEMINI_THINKING_LEVEL) config.agent.thinkingLevel = env.GEMINI_THINKING_LEVEL;
  config.apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY || '';
  return config;
}

/** Daily token accounting persisted next to the projects, so a runaway agent cannot burn the budget. */
export function createUsageMeter({ file, dailyTokens, now = () => new Date() }) {
  const today = () => now().toISOString().slice(0, 10);
  let state = { date: today(), tokens: 0, requests: 0, byRole: {} };
  try { const saved = JSON.parse(fs.readFileSync(file, 'utf8')); if (saved.date === state.date) state = saved; } catch { /* first run */ }
  const roll = () => { if (state.date !== today()) state = { date: today(), tokens: 0, requests: 0, byRole: {} }; };
  return {
    check() {
      roll();
      if (dailyTokens && state.tokens >= dailyTokens) {
        const error = new Error(`今天的 AI 用量已达上限（${dailyTokens} tokens），明天再试或调高 AI_DAILY_TOKENS`);
        error.status = 429; throw error;
      }
    },
    record(role, usage = {}) {
      roll();
      const tokens = usage.totalTokenCount || 0;
      state.tokens += tokens; state.requests++;
      state.byRole[role] = (state.byRole[role] || 0) + tokens;
      try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(state)); } catch { /* best effort */ }
    },
    snapshot() { roll(); return { ...state, limit: dailyTokens }; },
  };
}
