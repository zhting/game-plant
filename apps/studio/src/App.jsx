import { useCallback, useEffect, useRef, useState } from 'react';
import { api, getToken, setToken, ApiError } from './api.js';
import Chat from './Chat.jsx';
import SpecPanel from './SpecPanel.jsx';
import AssetEditor from './AssetEditor.jsx';
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

  // Studio preview live controls (stage jump, checkpoint X, hitbox debug overlay, god mode)
  const iframeRef = useRef(null);
  const [newTemplate, setNewTemplate] = useState('contra');
  const [previewStage, setPreviewStage] = useState('');
  const [previewX, setPreviewX] = useState('');
  const [debugOverlay, setDebugOverlay] = useState(false);
  const [godMode, setGodMode] = useState(false);

  const sendControl = useCallback((cmd) => {
    const win = iframeRef.current?.contentWindow;
    if (win) win.postMessage({ type: 'studio:control', ...cmd }, '*');
  }, []);

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

  /** Called after anything changed game.json or assets: refresh data, project list and the preview. */
  const changed = useCallback(async () => {
    await loadProject(currentId);
    setProjects(await api.projects());
  }, [currentId, loadProject]);

  async function createProject() {
    const defTitle = newTemplate === 'wukong' ? '我的大闹天宫' : '我的横版射击';
    const title = prompt('新游戏的名字', defTitle);
    if (title === null) return;
    try {
      const { id } = await api.createProject({ title: title.trim() || undefined, template: newTemplate });
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

  const basePlayUrl = project ? `/play/${project.id}/` : null;
  const playQuery = new URLSearchParams();
  if (previewStage) playQuery.set('stage', previewStage);
  if (previewX) playQuery.set('x', previewX);
  if (debugOverlay) playQuery.set('debug', '1');
  if (godMode) playQuery.set('god', '1');
  const playUrl = basePlayUrl ? `${basePlayUrl}${playQuery.toString() ? `?${playQuery.toString()}` : ''}` : null;

  return (
    <div className="app">
      <header>
        <strong className="brand">🌱 Game Plant Studio</strong>
        <select value={currentId} onChange={e => setCurrentId(e.target.value)}>
          <option value="">选择项目…</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}（{p.id}）</option>)}
        </select>
        <select value={newTemplate} title="新建项目所用的游戏模板" onChange={e => setNewTemplate(e.target.value)}>
          <option value="contra">模板：魂斗罗2026</option>
          <option value="wukong">模板：悟空大闹天宫</option>
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
          <p>新建项目可选择「魂斗罗2026」或「悟空大闹天宫」模板。之后在左侧用中文告诉 AI 你想改什么，比如：</p>
          <ul>
            <li>“步枪射速快一倍，开局 5 条命，开启 64 点血条和怒气大招”</li>
            <li>“开启近战棍花斩击并能反弹敌弹，第一关天色改成晚霞金红”</li>
            <li>“给主角画一套银色机甲皮肤并换上”</li>
          </ul>
          <button className="primary" onClick={createProject}>＋ 新建项目</button>
        </main>
      ) : (
        <main className="workspace">
          <Chat projectId={project.id} aiReady={status?.ai.configured} onChanged={changed} onError={setError} />
          <section className="preview">
            <div className="bar">
              <span>预览 · {project.spec.meta?.title || project.id}</span>
              <select value={previewStage} title="跳关调试" onChange={e => {
                const st = e.target.value;
                setPreviewStage(st);
                if (st) sendControl({ stage: Number(st), x: previewX ? Number(previewX) : undefined, debug: debugOverlay, god: godMode });
                else setPreviewKey(k => k + 1);
              }}>
                <option value="">跳关：标题画面</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={String(n)}>第 {n} 关 · {project.resolved?.stages?.[n]?.name || `Stage ${n}`}</option>
                ))}
              </select>
              {previewStage && !['2', '3', '4', '7'].includes(previewStage) && (
                <select value={previewX} title="关卡进度位置跳转" onChange={e => {
                  const xv = e.target.value;
                  setPreviewX(xv);
                  sendControl({ stage: Number(previewStage), x: xv ? Number(xv) : 60, debug: debugOverlay, god: godMode });
                }}>
                  <option value="">起点 (60m)</option>
                  <option value="900">前段 (900m)</option>
                  <option value="1800">中段 (1800m)</option>
                  <option value="2850">Boss 前 (2850m)</option>
                </select>
              )}
              <label className="bar-toggle" title="显示碰撞框、锚点十字、地形实心线与补给触发线">
                <input type="checkbox" checked={debugOverlay} onChange={e => {
                  const v = e.target.checked;
                  setDebugOverlay(v);
                  sendControl({ debug: v });
                }} /> 碰撞框
              </label>
              <label className="bar-toggle" title="开启无敌测试模式（角色不掉血）">
                <input type="checkbox" checked={godMode} onChange={e => {
                  const v = e.target.checked;
                  setGodMode(v);
                  sendControl({ god: v });
                }} /> 无敌
              </label>
              <span className="spacer" />
              <button onClick={() => setPreviewKey(k => k + 1)}>↻ 重载</button>
              <a href={basePlayUrl} target="_blank" rel="noreferrer">新窗口 ↗</a>
            </div>
            <iframe ref={iframeRef} key={previewKey} title="游戏预览" src={playUrl} allow="fullscreen; gamepad; autoplay" />
            <p className="hint">点击画面后用键盘操作：WASD 移动，J 射击，K 跳跃，I 手雷，L 道具，Enter 开始/暂停。顶部工具栏可随时跳关、看碰撞框或开无敌。</p>
          </section>
          <aside className="side">
            <nav>
              {[
                ['params', '参数与关卡'],
                ['assets', '资源与换皮'],
                ['files', '代码与文件'],
                ['history', '版本'],
                ['json', 'game.json'],
              ].map(([key, label]) =>
                <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}
            </nav>
            {tab === 'params' && <SpecPanel project={project} schema={schema} onChanged={changed} onError={setError} />}
            {tab === 'assets' && <AssetEditor project={project} schema={schema} aiReady={status?.ai.configured} onChanged={changed} onError={setError} />}
            {tab === 'files' && <Files project={project} onChanged={changed} onError={setError} />}
            {tab === 'history' && <History project={project} onChanged={changed} onError={setError} />}
            {tab === 'json' && <RawJson project={project} onChanged={changed} onError={setError} />}
          </aside>
        </main>
      )}
    </div>
  );
}
