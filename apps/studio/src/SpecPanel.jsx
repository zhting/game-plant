import { useState } from 'react';
import { api } from './api.js';

const STAGES = { 1: '雨林要塞', 2: '地下指挥所', 3: '峡谷瀑布', 4: '地下基地', 5: '极地冰原', 6: '高温能源厂', 7: '机械机库', 8: '异形巢穴' };
const nest = (path, value) => path.reduceRight((acc, key) => ({ [key]: acc }), value);
const get = (obj, path) => path.reduce((o, k) => o?.[k], obj);

/** Schema-driven parameter form. Every edit is a merge patch → a new version (undoable like AI edits). */
export default function SpecPanel({ project, schema, onChanged, onError }) {
  const [saving, setSaving] = useState('');
  if (!schema) return null;

  async function save(path, value, label) {
    setSaving(path.join('.'));
    try {
      const text = value === null ? `参数面板：${label} 恢复默认` : `参数面板：${label} → ${typeof value === 'object' ? JSON.stringify(value) : value}`;
      const result = await api.patch(project.id, nest(path, value), text);
      if (result.changed) await onChanged();
    } catch (e) { onError(e.details ? `${e.message}：${e.details.join('；')}` : e.message); }
    finally { setSaving(''); }
  }

  const field = (node, path, label) => {
    const key = path.join('.');
    const value = get(project.resolved, path);
    const overridden = get(project.spec, path) !== undefined;
    const commit = raw => {
      let v = raw;
      if (node.type === 'number') { v = Number(raw); if (raw === '' || !Number.isFinite(v)) return; }
      if (v === value) return;
      save(path, v, label);
    };
    return (
      <label key={key} className={'field' + (overridden ? ' overridden' : '') + (saving === key ? ' saving' : '')} title={node.desc}>
        <span className="name">{label}</span>
        {node.type === 'enum'
          ? <select defaultValue={value} key={value} onChange={e => commit(e.target.value)}>{node.values.map(v => <option key={v}>{v}</option>)}</select>
          : <input key={String(value)} type={node.type === 'number' ? 'number' : 'text'} defaultValue={value ?? ''} min={node.min} max={node.max}
              step={node.integer ? 1 : 'any'} placeholder={node.type === 'string' ? '（模板默认）' : ''}
              onBlur={e => commit(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }} />}
        {overridden && <button type="button" className="reset" title="恢复模板默认" onClick={() => save(path, null, label)}>↺</button>}
        {node.desc && node.desc !== label && <small>{node.desc}</small>}
      </label>
    );
  };

  const section = (node, path, title) => {
    if (node.type !== 'object') return null;
    const leaves = [], groups = [];
    for (const [k, child] of Object.entries(node.props)) {
      if (child.type === 'object') groups.push(section(child, [...path, k], child.desc || k));
      else if (['number', 'string', 'enum'].includes(child.type)) leaves.push(field(child, [...path, k], child.desc?.split('（')[0] || k));
    }
    return (
      <fieldset key={path.join('.') || 'root'}>
        {title && <legend>{title}</legend>}
        {leaves}{groups}
      </fieldset>
    );
  };

  const P = schema.schema.props;
  const types = project.resolved.enemies.types || {};
  return (
    <div className="spec">
      <p className="note">直接改数值也会生成一个版本（和 AI 修改一样可以撤销）。高亮的是和模板不同的字段。</p>
      {section(P.meta, ['meta'], '项目信息')}
      {section(P.player, ['player'], '玩家')}
      {section(P.weapons, ['weapons'], '武器')}
      {section(P.items, ['items'], '特殊道具')}
      <fieldset>
        <legend>敌人</legend>
        {field(P.enemies.props.hpScale, ['enemies', 'hpScale'], '全体血量倍率')}
        {Object.entries(types).map(([t, rule]) => (
          <div className="type-row" key={t}>
            <b>{schema.enemyTypes[t] || t}</b>
            {field(P.enemies.props.types.value.props.hp, ['enemies', 'types', t, 'hp'], '固定血量')}
            {field(P.enemies.props.types.value.props.hpScale, ['enemies', 'types', t, 'hpScale'], '血量倍率')}
            <button type="button" onClick={() => save(['enemies', 'types', t], null, `${t} 敌人规则`)}>删除</button>
            {void rule}
          </div>
        ))}
        <select value="" onChange={e => e.target.value && save(['enemies', 'types', e.target.value], { hpScale: 1 }, `添加敌人规则 ${e.target.value}`)}>
          <option value="">＋ 按类型调整…</option>
          {Object.entries(schema.enemyTypes).filter(([t]) => !types[t]).map(([t, name]) => <option key={t} value={t}>{name}（{t}）</option>)}
        </select>
      </fieldset>
      {section(P.scoring, ['scoring'], '计分')}
      <fieldset>
        <legend>关卡</legend>
        {Object.entries(STAGES).map(([n, name]) => {
          const stage = project.resolved.stages?.[n] || {};
          return (
            <div key={n} className="stage-row">
              {field(P.stages.value.props.name, ['stages', n, 'name'], `第 ${n} 关名称`)}
              <small className="drops">{name}{stage.pods ? ` · 空中补给 ${stage.pods.length} 个` : ''}{stage.boxes ? ` · 补给箱 ${stage.boxes.length} 个` : ''}</small>
            </div>
          );
        })}
        <p className="note">补给位置和道具可以让 AI 改，也可以在 game.json 页直接编辑；可视化摆放在后续版本提供。</p>
      </fieldset>
    </div>
  );
}
