// Thin wrapper over @google/genai. Everything else in the backend talks to an
// `llm` object with this shape, so tests can pass a scripted fake instead.
//
//   llm.generate({ role, contents, systemInstruction, tools }) →
//     { content, functionCalls: [{id, name, args}], text, usage }
//   llm.image({ prompt, images, aspectRatio, pro }) → { data: Buffer, mimeType, text }
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
    /**
     * Generate or edit one image. `images` are reference/source images
     * ({ mimeType, data: Buffer }) sent before the prompt.
     * @returns {Promise<{ data: Buffer, mimeType: string, text: string }>}
     */
    async image({ prompt, images = [], aspectRatio = '1:1', pro = false, signal }) {
      usage?.check();
      const role = pro && config.models.imagePro ? 'imagePro' : 'image';
      const model = config.models[role];
      if (!model) throw new Error('没有配置图片模型（models.image）');
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
