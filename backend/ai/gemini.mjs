// Thin wrapper over @google/genai. Everything else in the backend talks to an
// `llm` object with this shape, so tests can pass a scripted fake instead.
//
//   llm.generate({ role, contents, systemInstruction, tools }) →
//     { content, functionCalls: [{id, name, args}], text, usage }
//
// `content` is the model turn exactly as returned (including thought
// signatures); callers must append it to `contents` unchanged when continuing a
// function-calling loop.
import { GoogleGenAI } from '@google/genai';

export function createGemini({ config, usage }) {
  if (!config.apiKey) return null;
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  return {
    models: config.models,
    async generate({ role = 'agent', contents, systemInstruction, tools, signal }) {
      usage?.check();
      const model = config.models[role];
      if (!model) throw new Error(`没有为角色 ${role} 配置模型`);
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
  };
}
