import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';

const SUGGESTIONS = ['步枪射速快一倍', '开局 9 条命', '敌人血量翻倍', '第一关开头先掉一把散弹枪', '撤销上一次修改'];
const TOOL_LABELS = { spec_get: '读取设置', spec_patch: '修改设置', playtest: '自动试玩', history: '查看版本', undo: '撤销' };

export default function Chat({ projectId, aiReady, onChanged, onError }) {
  const [log, setLog] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { api.chatLog(projectId).then(setLog).catch(e => onError(e.message)); }, [projectId, onError]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [log, busy]);

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
        {!log.length && <div className="tip">告诉我你想怎么改这个游戏。每次修改都会自动试玩检查、保存成一个版本，随时可以撤销。</div>}
        {log.map((m, i) => (
          <div key={i} className={'msg ' + m.role}>
            <div className="text">{m.text}</div>
            {m.steps?.length > 0 && <div className="steps">{m.steps.map((s, j) => <span key={j} className={s.ok ? 'ok' : 'fail'}>{TOOL_LABELS[s.name] || s.name}{s.ok ? '' : '✗'}</span>)}</div>}
            {m.changes?.length > 0 && <div className="changes">{m.changes.map(c => <span key={c.commit} title={c.commit}>✔ 已保存：{c.message} · {c.commit.slice(0, 7)}</span>)}</div>}
            {m.ms && <div className="meta">{(m.ms / 1000).toFixed(1)} 秒</div>}
          </div>
        ))}
        {busy && <div className="msg model thinking">AI 正在修改并试玩…</div>}
        <div ref={endRef} />
      </div>
      <div className="suggest">{SUGGESTIONS.map(s => <button key={s} disabled={busy || !aiReady} onClick={() => send(s)}>{s}</button>)}</div>
      <form onSubmit={e => { e.preventDefault(); send(text); }}>
        <textarea value={text} disabled={!aiReady} placeholder={aiReady ? '例如：第二关的炮台血量减半，补给改成激光枪（Enter 发送，Shift+Enter 换行）' : 'AI 未配置：请在服务器设置 GEMINI_API_KEY'}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(text); } }} />
        <button className="primary" disabled={busy || !aiReady || !text.trim()}>发送</button>
      </form>
    </section>
  );
}
