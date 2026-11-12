import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';

const SUGGESTIONS = [
  '把步枪改成抛物线穿透「圣银飞斧」，开启近战弹反',
  '切换第一关为赛博霓虹夜幕，开启80点血条和怒气大招',
  '给主角画一套银色机甲皮肤并换上',
  '加一种会飞、会俯冲的机械怪鸟敌人',
  '抓一帧第一关实机画面检查效果',
];
const THINKING_STAGES = [
  '🧠 正在理解你的游戏创意并规划修改方案…',
  '⚙️ 正在写入游戏参数或模块代码…',
  '🎮 正在无头引擎中自动跑关试玩校验…',
  '💾 正在生成版本快照并刷新实时预览…',
];
const TOOL_LABELS = {
  spec_get: '读取设置',
  spec_patch: '修改设置',
  playtest: '自动试玩',
  code_list: '查看模块',
  code_read: '读取代码',
  code_write: '编写模块',
  code_delete: '删除模块',
  image_gen: '生成精灵图',
  screenshot: '画面截图',
  history: '查看版本',
  undo: '撤销',
};

export default function Chat({ projectId, aiReady, onChanged, onError }) {
  const [log, setLog] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [thinkIdx, setThinkIdx] = useState(0);
  const endRef = useRef(null);

  useEffect(() => { api.chatLog(projectId).then(setLog).catch(e => onError(e.message)); }, [projectId, onError]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [log, busy, thinkIdx]);
  useEffect(() => {
    if (!busy) { setThinkIdx(0); return undefined; }
    const timer = setInterval(() => setThinkIdx(i => Math.min(THINKING_STAGES.length - 1, i + 1)), 1350);
    return () => clearInterval(timer);
  }, [busy]);

  async function send(message) {
    message = message.trim();
    if (!message || busy) return;
    setBusy(true); setText('');
    setLog(l => [...l, { role: 'user', text: message, pending: true }]);
    const started = Date.now();
    try {
      const turn = await api.chat(projectId, message);
      setLog(l => [...l.filter(m => !m.pending), { role: 'user', text: message }, { role: 'model', text: turn.reply, changes: turn.changes, steps: turn.steps, ms: Date.now() - started }]);
      if (turn.changes.length) await onChanged();
    } catch (e) {
      setLog(l => [...l.filter(m => !m.pending), { role: 'user', text: message }, { role: 'error', text: e.message }]);
    } finally { setBusy(false); }
  }

  return (
    <section className="chat">
      <div className="messages">
        {!log.length && <div className="tip">直接用中文说出你的原创游戏点子（已内置离线智能体验与在线 Gemini 双模式）。每次改动都会自动试玩验证并保存为可撤销的版本。</div>}
        {log.map((m, i) => {
          const shots = (m.steps || []).filter(s => s.previewDataUrl);
          return (
            <div key={i} className={'msg ' + m.role}>
              <div className="text">{m.text}</div>
              {m.steps?.length > 0 && <div className="steps">{m.steps.map((s, j) => <span key={j} className={s.ok ? 'ok' : 'fail'}>{TOOL_LABELS[s.name] || s.name}{s.ok ? '' : '✗'}</span>)}</div>}
              {shots.length > 0 && (
                <div className="chat-shots">
                  {shots.map((s, j) => (
                    <figure key={j} className="chat-shot">
                      <img src={s.previewDataUrl} alt={TOOL_LABELS[s.name] || s.name} />
                      <figcaption>{s.name === 'screenshot' ? '📸 引擎实机试玩截图' : '🎨 生成精灵图预览'}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {m.changes?.length > 0 && <div className="changes">{m.changes.map(c => <span key={c.commit} title={c.commit}>✔ 已保存：{c.message} · {c.commit.slice(0, 7)}</span>)}</div>}
              {m.ms && <div className="meta">{(m.ms / 1000).toFixed(1)} 秒</div>}
            </div>
          );
        })}
        {busy && <div className="msg model thinking">{THINKING_STAGES[thinkIdx]}</div>}
        <div ref={endRef} />
      </div>
      <div className="suggest">{SUGGESTIONS.map(s => <button key={s} disabled={busy || !aiReady} onClick={() => send(s)}>{s}</button>)}</div>
      <form onSubmit={e => { e.preventDefault(); send(text); }}>
        <textarea value={text} disabled={!aiReady} placeholder={aiReady ? '例如：把步枪改成抛物线穿透飞斧，或者加一种俯冲怪鸟（Enter 发送，Shift+Enter 换行）' : 'AI 未配置：请在服务器设置 GEMINI_API_KEY'}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(text); } }} />
        <button className="primary" disabled={busy || !aiReady || !text.trim()}>发送</button>
      </form>
    </section>
  );
}
