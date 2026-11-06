import { useState } from 'react';
import { api } from './api.js';

const STAGES = { 1: '雨林要塞', 2: '地下指挥所', 3: '峡谷瀑布', 4: '地下基地', 5: '极地冰原', 6: '高温能源厂', 7: '机械机库', 8: '异形巢穴' };
const STAGE_LEN = { 1: 3200, 5: 3200, 6: 3400, 8: 3200 };
const nest = (path, value) => path.reduceRight((acc, key) => ({ [key]: acc }), value);
const get = (obj, path) => path.reduce((o, k) => o?.[k], obj);

/** Schema-driven parameter form + visual stage order & drop timeline editor. */
export default function SpecPanel({ project, schema, onChanged, onError }) {
  const [saving, setSaving] = useState('');
  const [dropStage, setDropStage] = useState('1');
  const [selDrop, setSelDrop] = useState(null); // { type: 'pod' | 'box', index: number }
  if (!schema) return null;

  async function save(path, value, label) {
    setSaving(path.join('.'));
    try {
      const text = value === null ? `参数面板：${label} 恢复默认` : `参数面板：${label} → ${typeof value === 'object' ? JSON.stringify(value).slice(0, 60) : value}`;
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
  const stageOrder = project.resolved.stages?.order || [1, 2, 3, 4, 5, 6, 7, 8];
  const orderOverridden = Array.isArray(project.spec?.stages?.order);

  // Stage drops timeline state
  const curStageData = project.resolved.stages?.[dropStage] || {};
  const pods = curStageData.pods || [];
  const boxes = curStageData.boxes || [];
  const maxLen = STAGE_LEN[dropStage] || 3200;
  const itemKinds = schema.itemKinds || {};

  function moveStageOrder(idx, dir) {
    const next = [...stageOrder];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    save(['stages', 'order'], next, '关卡顺序');
  }

  function removeStageAt(idx) {
    if (stageOrder.length <= 1) return;
    const next = stageOrder.filter((_, i) => i !== idx);
    save(['stages', 'order'], next, '关卡顺序');
  }

  function updatePod(idx, patch) {
    const next = pods.map((p, i) => i === idx ? { ...p, ...patch } : p);
    save(['stages', dropStage, 'pods'], next, `第 ${dropStage} 关飞行胶囊`);
  }

  function addPod() {
    const next = [...pods, { at: 800, kind: 'S', y0: 76 }].sort((a, b) => a.at - b.at);
    save(['stages', dropStage, 'pods'], next, `第 ${dropStage} 关新增飞行胶囊`);
    setSelDrop({ type: 'pod', index: next.length - 1 });
  }

  function deletePod(idx) {
    const next = pods.filter((_, i) => i !== idx);
    setSelDrop(null);
    save(['stages', dropStage, 'pods'], next, `第 ${dropStage} 关删除飞行胶囊`);
  }

  function updateBox(idx, x, kind) {
    const next = boxes.map((b, i) => i === idx ? [x, kind] : b);
    save(['stages', dropStage, 'boxes'], next, `第 ${dropStage} 关地面补给箱`);
  }

  function addBox() {
    const next = [...boxes, [1000, 'M']].sort((a, b) => a[0] - b[0]);
    save(['stages', dropStage, 'boxes'], next, `第 ${dropStage} 关新增地面补给箱`);
    setSelDrop({ type: 'box', index: next.length - 1 });
  }

  function deleteBox(idx) {
    const next = boxes.filter((_, i) => i !== idx);
    setSelDrop(null);
    save(['stages', dropStage, 'boxes'], next, `第 ${dropStage} 关删除地面补给箱`);
  }

  const activePod = selDrop?.type === 'pod' ? pods[selDrop.index] : null;
  const activeBox = selDrop?.type === 'box' ? boxes[selDrop.index] : null;

  return (
    <div className="spec">
      <p className="note">直接改数值或摆放补给都会生成一个版本（和 AI 修改一样可以撤销）。高亮的是和模板不同的字段。</p>
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
      {section(P.bosses, ['bosses'], 'Boss')}
      {section(P.scoring, ['scoring'], '计分')}

      <fieldset>
        <legend>关卡顺序与名称</legend>
        <div className="stage-order-head">
          <span>闯关顺序（共 {stageOrder.length} 关）</span>
          {orderOverridden && <button type="button" onClick={() => save(['stages', 'order'], null, '关卡顺序')}>↺ 恢复默认八关</button>}
        </div>
        <div className="stage-chips">
          {stageOrder.map((st, idx) => (
            <div key={`${st}-${idx}`} className="stage-chip">
              <b>#{idx + 1}</b> <span>S{st} {project.resolved.stages?.[st]?.name || STAGES[st]}</span>
              <button type="button" disabled={idx === 0} onClick={() => moveStageOrder(idx, -1)} title="前移">←</button>
              <button type="button" disabled={idx === stageOrder.length - 1} onClick={() => moveStageOrder(idx, 1)} title="后移">→</button>
              {stageOrder.length > 1 && <button type="button" onClick={() => removeStageAt(idx)} title="移除此关">✕</button>}
            </div>
          ))}
          {stageOrder.length < 8 && (
            <select value="" onChange={e => e.target.value && save(['stages', 'order'], [...stageOrder, Number(e.target.value)], '添加关卡')}>
              <option value="">＋ 添加关卡…</option>
              {Object.entries(STAGES).map(([n, name]) => <option key={n} value={n}>第 {n} 关 · {name}</option>)}
            </select>
          )}
        </div>
        {Object.entries(STAGES).map(([n, name]) => {
          const stage = project.resolved.stages?.[n] || {};
          return (
            <div key={n} className="stage-row">
              {field(P.stages.value.props.name, ['stages', n, 'name'], `第 ${n} 关名称`)}
              <small className="drops">{name}{stage.pods ? ` · 空中胶囊 ${stage.pods.length} 个` : ''}{stage.boxes ? ` · 地面补给 ${stage.boxes.length} 个` : ''}</small>
            </div>
          );
        })}
      </fieldset>

      <fieldset>
        <legend>关卡补给可视化摆放（时间轴）</legend>
        <div className="timeline-toolbar">
          <select value={dropStage} onChange={e => { setDropStage(e.target.value); setSelDrop(null); }}>
            {Object.entries(STAGE_LEN).map(([st, len]) => (
              <option key={st} value={st}>第 {st} 关 · {project.resolved.stages?.[st]?.name || STAGES[st]}（全长 {len}m）</option>
            ))}
          </select>
          <button type="button" onClick={addPod}>＋ 飞行胶囊</button>
          <button type="button" onClick={addBox}>＋ 地面补给箱</button>
        </div>

        <div className="timeline-track">
          <div className="timeline-ruler">
            <span>起点 0m</span>
            <span>{Math.round(maxLen * 0.25)}m</span>
            <span>{Math.round(maxLen * 0.5)}m</span>
            <span>{Math.round(maxLen * 0.75)}m</span>
            <span>Boss {maxLen}m</span>
          </div>
          <div className="timeline-lane pods-lane" title="上层：飞行补给胶囊（点击气泡编辑）">
            <span className="lane-label">胶囊</span>
            {pods.map((p, idx) => (
              <button key={idx} type="button"
                className={'drop-pin pod' + (selDrop?.type === 'pod' && selDrop.index === idx ? ' active' : '')}
                style={{ left: `${Math.min(97, Math.max(2, (p.at / maxLen) * 100))}%`, top: `${Math.min(72, Math.max(8, ((p.y0 || 72) / 140) * 100))}%` }}
                onClick={() => setSelDrop({ type: 'pod', index: idx })}
                title={`飞行胶囊 #${idx + 1}：X=${p.at}, Y=${p.y0}, 掉落=${p.kind} (${itemKinds[p.kind] || p.kind})`}>
                {p.kind}
              </button>
            ))}
          </div>
          <div className="timeline-lane boxes-lane" title="下层：地面感应补给箱（点击方块编辑）">
            <span className="lane-label">地面箱</span>
            {boxes.map(([bx, kind], idx) => (
              <button key={idx} type="button"
                className={'drop-pin box' + (selDrop?.type === 'box' && selDrop.index === idx ? ' active' : '')}
                style={{ left: `${Math.min(97, Math.max(2, (bx / maxLen) * 100))}%` }}
                onClick={() => setSelDrop({ type: 'box', index: idx })}
                title={`地面补给箱 #${idx + 1}：X=${bx}, 掉落=${kind} (${itemKinds[kind] || kind})`}>
                {kind}
              </button>
            ))}
          </div>
        </div>

        {activePod && (
          <div className="drop-inspector">
            <strong>飞行胶囊 #{selDrop.index + 1}</strong>
            <label>触发坐标 X (0~{maxLen})
              <input type="number" min="40" max={maxLen} step="20" value={activePod.at}
                onChange={e => updatePod(selDrop.index, { at: Math.max(40, Math.min(maxLen, Number(e.target.value) || 0)) })} />
            </label>
            <label>飞行高度 Y (24~140)
              <input type="number" min="24" max="140" step="4" value={activePod.y0}
                onChange={e => updatePod(selDrop.index, { y0: Math.max(24, Math.min(140, Number(e.target.value) || 72)) })} />
            </label>
            <label>掉落道具
              <select value={activePod.kind} onChange={e => updatePod(selDrop.index, { kind: e.target.value })}>
                {Object.entries(itemKinds).map(([k, desc]) => <option key={k} value={k}>{k} · {desc}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => deletePod(selDrop.index)}>🗑 删除此胶囊</button>
          </div>
        )}

        {activeBox && (
          <div className="drop-inspector">
            <strong>地面补给箱 #{selDrop.index + 1}</strong>
            <label>位置坐标 X (40~{maxLen})
              <input type="number" min="40" max={maxLen} step="20" value={activeBox[0]}
                onChange={e => updateBox(selDrop.index, Math.max(40, Math.min(maxLen, Number(e.target.value) || 0)), activeBox[1])} />
            </label>
            <label>掉落道具
              <select value={activeBox[1]} onChange={e => updateBox(selDrop.index, activeBox[0], e.target.value)}>
                {Object.entries(itemKinds).map(([k, desc]) => <option key={k} value={k}>{k} · {desc}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => deleteBox(selDrop.index)}>🗑 删除此补给箱</button>
          </div>
        )}

        {(project.spec?.stages?.[dropStage]?.pods !== undefined || project.spec?.stages?.[dropStage]?.boxes !== undefined) && (
          <button type="button" style={{ marginTop: 6 }} onClick={() => {
            save(['stages', dropStage, 'pods'], null, `第 ${dropStage} 关胶囊`);
            save(['stages', dropStage, 'boxes'], null, `第 ${dropStage} 关补给箱`);
          }}>↺ 恢复本关默认补给分布</button>
        )}
      </fieldset>
    </div>
  );
}
