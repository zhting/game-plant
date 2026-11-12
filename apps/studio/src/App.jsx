import { useCallback, useEffect, useRef, useState } from 'react';
import { api, getToken, setToken, ApiError } from './api.js';
import Chat from './Chat.jsx';
import SpecPanel from './SpecPanel.jsx';
import BricksPanel from './BricksPanel.jsx';
import AssetEditor from './AssetEditor.jsx';
import History from './History.jsx';
import Files from './Files.jsx';
import RawJson from './RawJson.jsx';
import { STARTER_THEMES, GAMEPLAY_BRICKS } from './presets.js';

export default function App() {
  const [status, setStatus] = useState(null);
  const [schema, setSchema] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentId, setCurrentId] = useState(() => new URLSearchParams(location.search).get('project') || localStorage.getItem('game-plant-project') || '');
  const [project, setProject] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [tab, setTab] = useState('params');
  const [error, setError] = useState('');

  // Inline project creation state (avoids window.prompt which is blocked in sandboxed preview iframes)
  const [newTemplate, setNewTemplate] = useState('contra');
  const [newTitle, setNewTitle] = useState('我的横版射击');
  const [showCreateBar, setShowCreateBar] = useState(false);
  const [creating, setCreating] = useState(false);

  // Studio preview live controls (stage jump, checkpoint X, hitbox debug overlay, god mode)
  const iframeRef = useRef(null);
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

  function handleTemplateChange(tpl) {
    setNewTemplate(tpl);
    if (!newTitle.trim() || newTitle === '我的横版射击' || newTitle === '我的大闹天宫') {
      setNewTitle(tpl === 'wukong' ? '我的大闹天宫' : '我的横版射击');
    }
  }

  async function submitCreateProject(e) {
    if (e) e.preventDefault();
    if (creating) return;
    const defTitle = newTemplate === 'wukong' ? '我的大闹天宫' : '我的横版射击';
    const title = (newTitle || '').trim().slice(0, 20) || defTitle;
    setCreating(true);
    setError('');
    try {
      const { id } = await api.createProject({ title, template: newTemplate });
      setProjects(await api.projects());
      setCurrentId(id);
      setShowCreateBar(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function createFromTheme(theme) {
    if (creating) return;
    setCreating(true);
    setError('');
    try {
      const { id } = await api.createProject({ title: theme.title, template: theme.template });
      if (theme.patch) {
        await api.patch(id, theme.patch, `应用创世主题包：${theme.title}`);
      }
      for (const brickId of theme.bricks || []) {
        const brick = GAMEPLAY_BRICKS.find(b => b.id === brickId);
        if (brick) {
          await api.writeFile(id, brick.path, brick.source, 'text/javascript; charset=utf-8', `预装玩法积木：${brick.title}`);
        }
      }
      setProjects(await api.projects());
      setCurrentId(id);
      setShowCreateBar(false);
    } catch (err) {
      setError(err.details ? `${err.message}：${err.details.join('；')}` : err.message);
    } finally {
      setCreating(false);
    }
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
  const installedBrickCount = (project?.files?.modules || []).length;

  return (
    <div className="app">
      <header>
        <strong className="brand" style={{ cursor: 'pointer' }} onClick={() => setCurrentId('')} title="返回项目首页与创世主题大厅">🌱 Game Plant Studio</strong>
        <select value={currentId} onChange={e => setCurrentId(e.target.value)}>
          <option value="">选择项目…</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}（{p.id}）</option>)}
        </select>
        {project ? (
          <button onClick={() => setShowCreateBar(v => !v)}>＋ 新项目 / 主题包</button>
        ) : (
          <>
            <select value={newTemplate} title="新建项目所用的游戏模板" onChange={e => handleTemplateChange(e.target.value)}>
              <option value="contra">模板：魂斗罗2026</option>
              <option value="wukong">模板：悟空大闹天宫</option>
            </select>
            <button className="primary" disabled={creating} onClick={submitCreateProject}>{creating ? '创建中…' : '＋ 空白项目'}</button>
          </>
        )}
        <span className="spacer" />
        {status && <span className={'ai ' + (status.ai.configured ? 'ok' : 'off')} title={JSON.stringify(status.ai.models, null, 1)}>
          {status.ai.mock
            ? `AI：离线智能模式（已就绪 · 今日 ${status.ai.usage.requests || 0} 次调用）`
            : status.ai.configured
              ? `AI：${status.ai.models.agent} · 今日 ${Math.round(status.ai.usage.tokens / 1000)}k / ${Math.round((status.ai.usage.limit || 0) / 1000)}k tokens`
              : 'AI 未配置（GEMINI_API_KEY）'}
        </span>}
      </header>
      {showCreateBar && project && (
        <div className="create-bar">
          <form style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} onSubmit={submitCreateProject}>
            <span>新建空白项目：</span>
            <input value={newTitle} maxLength={20} placeholder="输入新游戏名称（最多20字）" onChange={e => setNewTitle(e.target.value)} autoFocus />
            <select value={newTemplate} onChange={e => handleTemplateChange(e.target.value)}>
              <option value="contra">模板：魂斗罗2026</option>
              <option value="wukong">模板：悟空大闹天宫</option>
            </select>
            <button type="submit" className="primary" disabled={creating}>{creating ? '创建中…' : '创建空白'}</button>
          </form>
          <span style={{ color: 'var(--dim)' }}>| 一键创世主题：</span>
          {STARTER_THEMES.map(th => (
            <button key={th.id} type="button" disabled={creating} onClick={() => createFromTheme(th)} title={th.desc}>
              {th.icon} {th.title}
            </button>
          ))}
          <button type="button" onClick={() => setShowCreateBar(false)}>收起</button>
        </div>
      )}
      {error && <div className="banner error" onClick={() => setError('')}>{error}（点击关闭）</div>}
      {!project ? (
        <main className="empty">
          <h2>不写一行代码，打造你的原创横版动作游戏</h2>
          <p className="muted">点击任意「原创创世主题包」一秒生成完整差异化作品（自带定制武器弹道、天色配乐、剧情字幕与免代码玩法积木），或新建空白模板自由发挥：</p>

          <div className="theme-grid">
            {STARTER_THEMES.map(th => (
              <button key={th.id} type="button" className="theme-card" disabled={creating} onClick={() => createFromTheme(th)}>
                <div className="theme-card-top">
                  <span className="theme-icon">{th.icon}</span>
                  <strong>{th.title}</strong>
                  <span className="brick-tag">{th.badge}</span>
                </div>
                <p>{th.desc}</p>
                <small>点击一键生成并立即试玩 →</small>
              </button>
            ))}
          </div>

          <form className="empty-create-form" onSubmit={submitCreateProject}>
            <span style={{ fontSize: 13, color: 'var(--dim)' }}>或者从纯净模板开始：</span>
            <input value={newTitle} maxLength={20} placeholder="新游戏的名字（最多20字）" onChange={e => setNewTitle(e.target.value)} />
            <select value={newTemplate} onChange={e => handleTemplateChange(e.target.value)}>
              <option value="contra">模板：魂斗罗2026（8关射击/近战全自由）</option>
              <option value="wukong">模板：悟空大闹天宫（棍法神通动作底座）</option>
            </select>
            <button type="submit" className="primary" disabled={creating}>{creating ? '正在创建…' : '＋ 新建项目'}</button>
          </form>

          {projects.length > 0 && (
            <div className="existing-projects">
              <h4>继续编辑我的已有作品（{projects.length}）：</h4>
              <div className="project-cards">
                {projects.map(p => (
                  <button key={p.id} type="button" className="project-card" onClick={() => setCurrentId(p.id)}>
                    <strong>{p.title}</strong>
                    <small>{p.template === 'wukong' ? '🐒 悟空底座' : '🔫 魂斗罗底座'} · <code>{p.id}</code></small>
                  </button>
                ))}
              </div>
            </div>
          )}
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
                {(project.spec?.template === 'wukong' ? [1, 2] : [1, 2, 3, 4, 5, 6, 7, 8]).map(n => {
                  const defName = project.spec?.template === 'wukong'
                    ? ({ 1: '花果山断崖', 2: '南天门破阵' }[n])
                    : `Stage ${n}`;
                  return (
                    <option key={n} value={String(n)}>第 {n} 关 · {project.resolved?.stages?.[n]?.name || defName}</option>
                  );
                })}
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
            <p className="hint">点击画面后用键盘操作：WASD 移动，J 射击/挥砍，K 跳跃，I 手雷/大招，L 道具/法术，Enter 开始/暂停。顶部工具栏可随时跳关、看碰撞框或开无敌。</p>
          </section>
          <aside className="side">
            <nav>
              {[
                ['params', '参数与关卡'],
                ['bricks', `🧩 玩法积木${installedBrickCount ? ` (${installedBrickCount})` : ''}`],
                ['assets', '美术与配乐'],
                ['files', '代码与文件'],
                ['history', '版本'],
                ['json', 'game.json'],
              ].map(([key, label]) =>
                <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}
            </nav>
            {tab === 'params' && <SpecPanel project={project} schema={schema} onChanged={changed} onError={setError} />}
            {tab === 'bricks' && <BricksPanel project={project} onChanged={changed} onError={setError} onOpenCode={() => setTab('files')} />}
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
