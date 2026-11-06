import { useState } from 'react';
import { api } from './api.js';

export default function History({ project, onChanged, onError }) {
  const [diff, setDiff] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async task => { setBusy(true); try { await task(); await onChanged(); } catch (e) { onError(e.message); } finally { setBusy(false); } };
  const versions = project.history;
  return (
    <div className="history">
      <div className="row">
        <button disabled={busy || versions.length < 2} onClick={() => run(() => api.undo(project.id))}>↶ 撤销最近一次修改</button>
      </div>
      <ol>
        {versions.map((v, i) => (
          <li key={v.commit} className={i === 0 ? 'current' : ''}>
            <div className="msg">{v.message}</div>
            <div className="meta">
              <code>{v.commit.slice(0, 7)}</code> · {new Date(v.date).toLocaleString('zh-CN', { hour12: false })}
              {i === 0 && <b> · 当前</b>}
            </div>
            <div className="actions">
              <button onClick={async () => setDiff(diff?.commit === v.commit ? null : { commit: v.commit, text: await api.diff(project.id, v.commit).catch(e => e.message) })}>改动</button>
              <a href={`/play/${project.id}/?rev=${v.commit}`} target="_blank" rel="noreferrer">试玩这个版本</a>
              {i > 0 && <button disabled={busy} onClick={() => run(() => api.restore(project.id, v.commit))}>回到此版本</button>}
            </div>
            {diff?.commit === v.commit && <pre className="diff">{diff.text.split('\n').map((line, j) =>
              <span key={j} className={line.startsWith('+') && !line.startsWith('+++') ? 'add' : line.startsWith('-') && !line.startsWith('---') ? 'del' : ''}>{line + '\n'}</span>)}</pre>}
          </li>
        ))}
      </ol>
    </div>
  );
}
