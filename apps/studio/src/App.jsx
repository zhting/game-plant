import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken, ApiError } from './api.js';
import Chat from './Chat.jsx';
import SpecPanel from './SpecPanel.jsx';
import History from './History.jsx';
import Files from './Files.jsx';
import RawJson from './RawJson.jsx';

export default function App() {
  const [status, setStatus] = useState(null);
  const [schema, setSchema] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentId, setCurrentId] = useState(() => new URLSearchParams(location.search).get('project') || localStorage.getItem('game-plant-project') || '');
  const [project, setProject] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [tab, setTab] = useState('params');
  const [error, setError] = useState('');

  const boot = useCallback(async () => {
    setError('');
    const s = await api.status();
    setStatus(s);
    if (s.auth && !s.authorized) return;
    const [sch, list] = await Promise.all([api.schema(), api.projects()]);
    setSchema(sch); setProjects(list);
  }, []);
  useEffect(() => { boot().catch(e => setError(e.message)); }, [boot]);

  const loadProject = useCallback(async (id, { reloadPreview = true } = {}) => {
    if (!id) { setProject(null); return; }
    try {
      const p = await api.project(id);
      setProject(p);
      if (reloadPreview) setPreviewKey(k => k + 1);
      localStorage.setItem('game-plant-project', id);
      history.replaceState(null, '', `?project=${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) { setCurrentId(''); localStorage.removeItem('game-plant-project'); }
      else setError(e.message);
    }
  }, []);
  useEffect(() => { if (schema) loadProject(currentId); }, [currentId, schema, loadProject]);

  /** Called after anything changed game.json: refresh data, project list and the preview. */
  const changed = useCallback(async () => {
    await loadProject(currentId);
    setProjects(await api.projects());
  }, [currentId, loadProject]);

  async function createProject() {
    const title = prompt('新游戏的名字', '我的横版射击');
    if (title === null) return;
    try {
      const { id } = await api.createProject({ title: title.trim() || undefined });
      setProjects(await api.projects());
      setCurrentId(id);
    } catch (e) { setError(e.message); }
  }

  if (status?.auth && !status.authorized) {
    return (
      <div className="gate">
        <h1>🌱 Game Plant Studio</h1>
        <p>请输入 Studio 口令（服务器环境变量 STUDIO_TOKEN）。</p>
        <form onSubmit={e => { e.preventDefault(); setToken(new FormData(e.target).get('token')); boot().catch(err => setError(err.message)); }}>
          <input name="token" type="password" defaultValue={getToken()} autoFocus />
          <button>进入</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  const playUrl = project ? `/play/${project.id}/` : null;
  return (
    <div className="app">
      <header>
        <strong className="brand">🌱 Game Plant Studio</strong>
        <select value={currentId} onChange={e => setCurrentId(e.target.value)}>
          <option value="">选择项目…</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}（{p.id}）</option>)}
        </select>
        <button onClick={createProject}>＋ 新项目</button>
        <span className="spacer" />
        {status && <span className={'ai ' + (status.ai.configured ? 'ok' : 'off')} title={JSON.stringify(status.ai.models, null, 1)}>
          {status.ai.configured ? `AI：${status.ai.models.agent} · 今日 ${Math.round(status.ai.usage.tokens / 1000)}k / ${Math.round((status.ai.usage.limit || 0) / 1000)}k tokens` : 'AI 未配置（GEMINI_API_KEY）'}
        </span>}
      </header>
      {error && <div className="banner error" onClick={() => setError('')}>{error}（点击关闭）</div>}
      {!project ? (
        <main className="empty">
          <h2>用对话做一个属于你的横版射击游戏</h2>
          <p>新建项目会复制「魂斗罗2026」模板。之后在左侧用中文告诉 AI 你想改什么，比如：</p>
          <ul>
            <li>“步枪射速快一倍，开局 5 条命”</li>
            <li>“第一关的敌人血量翻倍，但每个补给都掉散弹枪”</li>
            <li>“把第五关改名叫‘冰封王座’”</li>
          </ul>
          <button className="primary" onClick={createProject}>＋ 新建项目</button>
        </main>
      ) : (
        <main className="workspace">
          <Chat projectId={project.id} aiReady={status?.ai.configured} onChanged={changed} onError={setError} />
          <section className="preview">
            <div className="bar">
              <span>预览 · {project.spec.meta?.title || project.id}</span>
              <span className="spacer" />
              <button onClick={() => setPreviewKey(k => k + 1)}>↻ 重新加载</button>
              <a href={playUrl} target="_blank" rel="noreferrer">新窗口打开 ↗</a>
            </div>
            <iframe key={previewKey} title="游戏预览" src={playUrl} allow="fullscreen; gamepad; autoplay" />
            <p className="hint">点击画面后用键盘操作：WASD 移动，J 射击，K 跳跃，I 手雷，L 道具，Enter 开始/暂停。</p>
          </section>
          <aside className="side">
            <nav>
              {[['params', '参数'], ['files', '代码与资源'], ['history', '版本'], ['json', 'game.json']].map(([key, label]) =>
                <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}
            </nav>
            {tab === 'params' && <SpecPanel project={project} schema={schema} onChanged={changed} onError={setError} />}
            {tab === 'files' && <Files project={project} onChanged={changed} onError={setError} />}
            {tab === 'history' && <History project={project} onChanged={changed} onError={setError} />}
            {tab === 'json' && <RawJson project={project} onChanged={changed} onError={setError} />}
          </aside>
        </main>
      )}
    </div>
  );
}
