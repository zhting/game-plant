import { useEffect, useState } from 'react';
import { api } from './api.js';

const MODULE_NAME = /^[a-z][a-z0-9-]{0,39}$/;
const ASSET_NAME = /^[a-z0-9][a-z0-9_-]{0,59}\.(png|webp|jpg|ogg|mp3|wav)$/;
const STARTER = `export default function setup(api) {
  // 例：api.defineEnemy('myEnemy', { hp: 3, box: { w: 16, h: 16 }, spawn: { stages: [1] }, update(e, game) { e.x -= 40 * game.dt; } });
}
`;

/** Code modules (modules/*.mjs) and assets of the current project. Mostly written by the AI; editable by hand. */
export default function Files({ project, onChanged, onError }) {
  const { modules = [], assets = [] } = project.files || {};
  const [open, setOpen] = useState(null);       // { path, text, original }
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState(null);

  useEffect(() => { setOpen(null); setProblems(null); }, [project.id]);

  async function openModule(path) {
    try { const text = await api.readFile(project.id, path); setOpen({ path, text, original: text }); setProblems(null); }
    catch (e) { onError(e.message); }
  }
  async function save() {
    setBusy(true); setProblems(null);
    try {
      await api.writeFile(project.id, open.path, open.text, 'text/plain; charset=utf-8', `手动编辑 ${open.path}`);
      setOpen({ ...open, original: open.text });
      await onChanged();
    } catch (e) { setProblems([e.message, ...(e.details || [])]); }
    finally { setBusy(false); }
  }
  async function remove(path) {
    if (!confirm(`删除 ${path}？（会生成一个新版本，可以撤销）`)) return;
    setBusy(true);
    try { await api.deleteFile(project.id, path); if (open?.path === path) setOpen(null); await onChanged(); }
    catch (e) { onError(e.message); }
    finally { setBusy(false); }
  }
  function newModule() {
    const name = prompt('模块文件名（小写英文、数字、连字符）', 'my-enemy');
    if (name === null) return;
    if (!MODULE_NAME.test(name)) return onError('文件名只能用小写英文字母开头，包含字母、数字和连字符');
    setOpen({ path: `modules/${name}.mjs`, text: STARTER, original: '' });
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const name = file.name.toLowerCase().replace(/\s+/g, '-');
    if (!ASSET_NAME.test(name)) return onError('资源文件名只能用小写英文、数字、- 和 _，格式 png/webp/jpg/ogg/mp3/wav');
    setBusy(true);
    try { await api.writeFile(project.id, `assets/${name}`, file, file.type, `上传 ${name}`); await onChanged(); }
    catch (e) { onError(e.message); }
    finally { setBusy(false); }
  }

  const dirty = open && open.text !== open.original;
  return (
    <div className="files">
      <p className="note">新敌人、新玩法写在代码模块里，通常由 AI 生成。手动保存前会做加载检查，不通过不会保存。</p>
      <h4>代码模块 <button disabled={busy} onClick={newModule}>＋ 新模块</button></h4>
      {!modules.length && <p className="muted">还没有模块。试试对 AI 说"加一种会飞、会俯冲的敌人"。</p>}
      <ul className="file-list">
        {modules.map(f => (
          <li key={f.path} className={open?.path === f.path ? 'active' : ''}>
            <button className="link" onClick={() => openModule(f.path)}>{f.path.slice(8)}</button>
            <small>{(f.size / 1024).toFixed(1)} KB</small>
            <button disabled={busy} onClick={() => remove(f.path)} title="删除">✕</button>
          </li>
        ))}
      </ul>
      {open && (
        <div className="editor">
          <div className="row"><code>{open.path}</code><span className="spacer" />
            <button disabled={busy || !dirty} className="primary" onClick={save}>{busy ? '检查中…' : '检查并保存'}</button>
            <button disabled={busy} onClick={() => setOpen(null)}>关闭</button>
          </div>
          <textarea spellCheck={false} value={open.text} onChange={e => setOpen({ ...open, text: e.target.value })} />
          {problems && <ul className="problems">{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>}
        </div>
      )}
      <h4>资源 <label className="upload"><input type="file" accept=".png,.webp,.jpg,.ogg,.mp3,.wav" disabled={busy} onChange={upload} />＋ 上传</label></h4>
      {!assets.length && <p className="muted">还没有资源。模块里用 api.image('文件名.png') 读取图片。</p>}
      <ul className="file-list assets">
        {assets.map(f => (
          <li key={f.path}>
            {/\.(png|webp|jpg)$/.test(f.path) && <img src={`/api/projects/${project.id}/files/${f.path}?t=${f.size}`} alt="" />}
            <span>{f.path.slice(7)}</span>
            <small>{(f.size / 1024).toFixed(1)} KB</small>
            <button disabled={busy} onClick={() => remove(f.path)} title="删除">✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
