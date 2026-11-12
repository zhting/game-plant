import { useState } from 'react';
import { api } from './api.js';

const CONTRA_STAGES = { 1: '雨林要塞', 2: '地下指挥所', 3: '峡谷瀑布', 4: '地下基地', 5: '极地冰原', 6: '高温能源厂', 7: '机械机库', 8: '异形巢穴' };
const WUKONG_STAGES = { 1: '花果山断崖', 2: '南天门破阵' };
const STAGE_LEN = { 1: 3200, 5: 3200, 6: 3400, 8: 3200 };
const nest = (path, value) => path.reduceRight((acc, key) => ({ [key]: acc }), value);
const get = (obj, path) => path.reduce((o, k) => o?.[k], obj);

/** Schema-driven parameter form + visual stage order & drop timeline editor. */
export default function SpecPanel({ project, schema, onChanged, onError }) {
  const [saving, setSaving] = useState('');
  const [dropStage, setDropStage] = useState('1');
  const [selDrop, setSelDrop] = useState(null); // { type: 'pod' | 'box', index: number }
  if (!schema) return null;

  const isWukong = project.spec?.template === 'wukong';
  const STAGES = isWukong ? WUKONG_STAGES : CONTRA_STAGES;

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
  const defaultOrder = isWukong ? [1, 2] : [1, 2, 3, 4, 5, 6, 7, 8];
  const rawOrder = project.resolved.stages?.order || defaultOrder;
  const stageOrder = isWukong ? (Array.isArray(project.spec?.stages?.order) ? project.spec.stages.order.filter(s => STAGES[s]) : defaultOrder) : rawOrder;
  const orderOverridden = Array.isArray(project.spec?.stages?.order);
  const openingPages = Array.isArray(project.resolved.story?.opening) ? project.resolved.story.opening : [];

  // Stage drops timeline state
  const curStageData = project.resolved.stages?.[dropStage] || {};
  const pods = curStageData.pods || [];
  const boxes = curStageData.boxes || [];
  const maxLen = STAGE_LEN[dropStage] || 3200;
  const itemKinds = schema.itemKinds || {};

  function updateOpeningPage(idx, patch) {
    const next = openingPages.map((pg, i) => i === idx ? { tag: pg.tag || '', line1: pg.line1 || '', line2: pg.line2 || '', ...patch } : pg);
    save(['story', 'opening'], next, `开场字幕第 ${idx + 1} 页`);
  }

  function addOpeningPage() {
    if (openingPages.length >= 6) return;
    const next = [...openingPages, { tag: `第 ${openingPages.length + 1} 幕`, line1: '在这里写下你的世界观背景，', line2: '开启属于你的原创冒险！' }];
    save(['story', 'opening'], next, '新增开场字幕页');
  }

  function removeOpeningPage(idx) {
    const next = openingPages.filter((_, i) => i !== idx);
    save(['story', 'opening'], next.length ? next : null, '删除开场字幕页');
  }

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
  const maxStageCount = Object.keys(STAGES).length;

  return (
    <div className="spec">
      <p className="note">
        直接改数值或摆放补给都会生成一个版本（随时可撤销）。
        {isWukong && ' 当前为「悟空大闹天宫」模板，默认自带 100 气血、金箍棒连招与怒气神通；如需高度自由改枪械/近战/8关顺序，推荐新建「魂斗罗2026」模板项目。'}
      </p>
      {section(P.meta, ['meta'], '项目信息')}
      {section(P.player, ['player'], '玩家物理与命数')}
      {!isWukong && P.rules && section(P.rules, ['rules'], '进阶玩法规则（血条 / 怒气大招 / 近战斩击）')}
      {!isWukong && P.story && (
        <fieldset>
          <legend>开场剧情与世界观文案</legend>
          {field(P.story.props.openingTitle, ['story', 'openingTitle'], '片头左上角地点/时代')}
          {field(P.story.props.openingSubtitle, ['story', 'openingSubtitle'], '片头右上角行动代号')}
          <div style={{ marginTop: 8 }}>
            <div className="stage-order-head">
              <span>开场故事字幕页（{openingPages.length} / 6 页，留空则显示原版字幕）</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {openingPages.length < 6 && <button type="button" onClick={addOpeningPage}>＋ 新增字幕页</button>}
                {project.spec?.story?.opening !== undefined && <button type="button" onClick={() => save(['story', 'opening'], null, '恢复默认开场字幕')}>↺ 恢复默认</button>}
              </div>
            </div>
            {openingPages.map((pg, idx) => (
              <div key={idx} className="drop-inspector" style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>第 {idx + 1} 页字幕</strong>
                  <button type="button" onClick={() => removeOpeningPage(idx)}>✕ 删除</button>
                </div>
                <label>章节小标题 (tag)
                  <input defaultValue={pg.tag || ''} maxLength={20} placeholder="如：第一章 · 赛博觉醒"
                    onBlur={e => e.target.value !== (pg.tag || '') && updateOpeningPage(idx, { tag: e.target.value })} />
                </label>
                <label>第一行台词
                  <input defaultValue={pg.line1 || ''} maxLength={36} placeholder="输入第一行剧情字幕（最多36字）"
                    onBlur={e => e.target.value !== (pg.line1 || '') && updateOpeningPage(idx, { line1: e.target.value })} />
                </label>
                <label>第二行台词
                  <input defaultValue={pg.line2 || ''} maxLength={36} placeholder="输入第二行剧情字幕（最多36字）"
                    onBlur={e => e.target.value !== (pg.line2 || '') && updateOpeningPage(idx, { line2: e.target.value })} />
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      )}
      {!isWukong && section(P.weapons, ['weapons'], '武器')}
      {section(P.items, ['items'], '特殊道具')}
      <fieldset>
        <legend>敌人</legend>
        {field(P.enemies.props.hpScale, ['enemies', 'hpScale'], '全体血量倍率')}
        {P.enemies.props.spawnRateScale && field(P.enemies.props.spawnRateScale, ['enemies', 'spawnRateScale'], '杂兵刷新频率倍率')}
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
          {orderOverridden && <button type="button" onClick={() => save(['stages', 'order'], null, '关卡顺序')}>↺ 恢复默认关卡</button>}
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
          {stageOrder.length < maxStageCount && (
            <select value="" onChange={e => e.target.value && save(['stages', 'order'], [...stageOrder, Number(e.target.value)], '添加关卡')}>
              <option value="">＋ 添加关卡…</option>
              {Object.entries(STAGES).filter(([n]) => !stageOrder.includes(Number(n))).map(([n, name]) => <option key={n} value={n}>第 {n} 关 · {name}</option>)}
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
        <legend>关卡补给与天色滤镜（第 {dropStage} 关）</legend>
        <div className="timeline-toolbar">
          <select value={dropStage} onChange={e => { setDropStage(e.target.value); setSelDrop(null); }}>
            {Object.entries(STAGE_LEN).map(([st, len]) => (
              <option key={st} value={st}>第 {st} 关 · {project.resolved.stages?.[st]?.name || STAGES[st]}（全长 {len}m）</option>
            ))}
          </select>
          <button type="button" onClick={addPod}>＋ 飞行胶囊</button>
          <button type="button" onClick={addBox}>＋ 地面补给箱</button>
        </div>
        {P.stages.value.props.theme && (
          <div className="stage-theme-fields">
            {field(P.stages.value.props.theme.props.skyTint, ['stages', dropStage, 'theme', 'skyTint'], `第 ${dropStage} 关天色渲染色`)}
            {field(P.stages.value.props.theme.props.tintAlpha, ['stages', dropStage, 'theme', 'tintAlpha'], `第 ${dropStage} 关天色浓度`)}
            {field(P.stages.value.props.theme.props.hue, ['stages', dropStage, 'theme', 'hue'], `第 ${dropStage} 关色相偏移`)}
          </div>
        )}

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
