import { useEffect, useState } from 'react';
import { api } from './api.js';

/** Raw game.json editor (overrides only). Saved through PUT, which validates server-side. */
export default function RawJson({ project, onChanged, onError }) {
  const initial = JSON.stringify(project.spec, null, 2);
  const [text, setText] = useState(initial);
  const [problem, setProblem] = useState('');
  useEffect(() => { setText(JSON.stringify(project.spec, null, 2)); setProblem(''); }, [project.spec]);

  async function save() {
    let spec;
    try { spec = JSON.parse(text); } catch (e) { setProblem('JSON 格式错误：' + e.message); return; }
    try {
      const result = await api.put(project.id, spec, '手动编辑 game.json');
      setProblem('');
      if (result.changed) await onChanged();
    } catch (e) { setProblem(e.details ? e.details.join('\n') : e.message); onError(e.message); }
  }

  return (
    <div className="raw">
      <p className="note">这里只记录和模板不同的部分。完整生效值见下方只读区域。</p>
      <textarea spellCheck={false} value={text} onChange={e => setText(e.target.value)} />
      {problem && <pre className="error">{problem}</pre>}
      <div className="row">
        <button className="primary" disabled={text === initial} onClick={save}>保存为新版本</button>
        <button disabled={text === initial} onClick={() => { setText(initial); setProblem(''); }}>放弃修改</button>
      </div>
      <details>
        <summary>完整生效值（模板 + 修改）</summary>
        <pre>{JSON.stringify(project.resolved, null, 2)}</pre>
      </details>
    </div>
  );
}
