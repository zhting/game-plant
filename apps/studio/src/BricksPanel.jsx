import { useState } from 'react';
import { api } from './api.js';
import { GAMEPLAY_BRICKS } from './presets.js';

/** One-click no-code Track B gameplay mechanics bricks panel. */
export default function BricksPanel({ project, onChanged, onError, onOpenCode }) {
  const [busyId, setBusyId] = useState('');
  const installedPaths = new Set((project.files?.modules || []).map(f => f.path));
  const customModules = (project.files?.modules || []).filter(f => !GAMEPLAY_BRICKS.some(b => b.path === f.path));

  async function toggleBrick(brick, enabled) {
    if (busyId) return;
    setBusyId(brick.id);
    try {
      if (enabled) {
        await api.writeFile(project.id, brick.path, brick.source, 'text/javascript; charset=utf-8', `启用玩法积木：${brick.title}`);
      } else {
        await api.deleteFile(project.id, brick.path);
      }
      await onChanged();
    } catch (e) {
      onError(e.details ? `${e.message}：${e.details.join('；')}` : e.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="bricks-panel">
      <p className="note">
        不懂写代码也能加原创玩法！勾选任意「玩法积木」，系统会自动挂载对应的游戏机制并在沙盒中安全校验，右侧预览立即生效，随时可取消或撤销。
      </p>
      <div className="brick-list">
        {GAMEPLAY_BRICKS.map(brick => {
          const active = installedPaths.has(brick.path);
          const loading = busyId === brick.id;
          return (
            <div key={brick.id} className={'brick-card' + (active ? ' active' : '')}>
              <div className="brick-head">
                <span className="brick-icon">{brick.icon}</span>
                <div className="brick-meta">
                  <strong>{brick.title} <span className="brick-tag">{brick.tag}</span></strong>
                  <p>{brick.desc}</p>
                </div>
                <button
                  type="button"
                  className={active ? '' : 'primary'}
                  disabled={Boolean(busyId)}
                  onClick={() => toggleBrick(brick, !active)}
                >
                  {loading ? '处理中…' : active ? '✓ 已启用（卸载）' : '＋ 启用积木'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {customModules.length > 0 && (
        <fieldset style={{ marginTop: 12 }}>
          <legend>AI / 自定义扩展模块（{customModules.length} 个）</legend>
          <p className="note">这些是通过 AI 对话或手动添加的专属玩法模块：</p>
          <ul className="file-list">
            {customModules.map(m => (
              <li key={m.path}>
                <code>{m.path.replace(/^modules\//, '')}</code>
                <span className="muted">{m.size} B</span>
                <span className="spacer" />
                {onOpenCode && <button type="button" onClick={onOpenCode}>查看源码</button>}
              </li>
            ))}
          </ul>
        </fieldset>
      )}
    </div>
  );
}
