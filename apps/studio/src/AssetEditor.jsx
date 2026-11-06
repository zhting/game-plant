import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';

const BUILTIN_TRACKS = [
  ['', '（关卡默认配乐）'],
  ['stage1_orchestral', '第一关 · 交响重制'],
  ['stage1_classic', '第一关 · 经典街机'],
  ['stage1_metal', '第一关 · 重金属'],
  ['stage2_base', '第二关 · 地下指挥所'],
  ['stage3_waterfall', '第三关 · 峡谷瀑布'],
  ['stage4_fortress', '第四关 · 地下基地'],
  ['stage5_snowfield', '第五关 · 极地冰原'],
  ['stage6_energy', '第六关 · 高温能源厂'],
  ['stage7_hangar', '第七关 · 机械机库'],
  ['stage8_lair', '第八关 · 异形巢穴'],
  ['boss', '首领战音乐'],
];

const STAGES = { 1: '雨林要塞', 2: '地下指挥所', 3: '峡谷瀑布', 4: '地下基地', 5: '极地冰原', 6: '高温能源厂', 7: '机械机库', 8: '异形巢穴' };

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return { r: 255, g: 255, b: 255 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export default function AssetEditor({ project, schema, aiReady, onChanged, onError }) {
  const assets = project.files?.assets || [];
  const imageAssets = assets.filter(f => /\.(png|webp)$/i.test(f.path));
  const audioAssets = assets.filter(f => /\.(ogg|mp3|wav)$/i.test(f.path));

  const [selected, setSelected] = useState(() => imageAssets[0]?.path.replace(/^assets\//, '') || '');
  const [imgVersion, setImgVersion] = useState(0);
  const [tool, setTool] = useState('pencil'); // pencil | eraser | picker | replace | region
  const [brushSize, setBrushSize] = useState(2);
  const [color, setColor] = useState('#f2b33d');
  const [fromColor, setFromColor] = useState('#3a8a30');
  const [tolerance, setTolerance] = useState(32);
  const [zoom, setZoom] = useState(2);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  // Sprite frame & box overlay settings
  const [frames, setFrames] = useState(2);
  const [fps, setFps] = useState(10);
  const [boxW, setBoxW] = useState(26);
  const [boxH, setBoxH] = useState(34);
  const [anchor, setAnchor] = useState('feet');
  const [flipPreview, setFlipPreview] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // HSL & server recolor controls
  const [hue, setHue] = useState(0);
  const [saturate, setSaturate] = useState(1);
  const [brightness, setBrightness] = useState(1);

  // Region selection (normalized 0..1) + AI prompt
  const [region, setRegion] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [newName, setNewName] = useState('hero-skin.png');
  const [newPrompt, setNewPrompt] = useState('');

  // Skin binding target: 'player' | 'player2' | 'enemy:all' | 'enemy:run' ...
  const [skinTarget, setSkinTarget] = useState('player');

  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (!selected && imageAssets.length) setSelected(imageAssets[0].path.replace(/^assets\//, ''));
    else if (selected && !imageAssets.some(f => f.path === `assets/${selected}`)) {
      setSelected(imageAssets[0]?.path.replace(/^assets\//, '') || '');
    }
  }, [assets, selected, imageAssets]);

  // Load selected image into editing canvas
  useEffect(() => {
    if (!selected || !canvasRef.current) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = img.naturalWidth || 64;
      c.height = img.naturalHeight || 64;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      setDirty(false);
    };
    img.src = `/api/projects/${project.id}/files/assets/${selected}?v=${project.history?.[0]?.commit || ''}-${imgVersion}`;
  }, [selected, project.id, project.history, imgVersion]);

  // Live animation preview loop
  useEffect(() => {
    let raf = 0;
    const tick = (now) => {
      const src = canvasRef.current, dst = previewRef.current;
      if (src && dst && src.width > 0 && src.height > 0) {
        const ctx = dst.getContext('2d');
        const nFrames = Math.max(1, Number(frames) || 1);
        const fw = Math.max(1, Math.floor(src.width / nFrames)), fh = src.height;
        const idx = Math.floor((now / 1000) * Math.max(1, Number(fps) || 8)) % nFrames;
        ctx.clearRect(0, 0, dst.width, dst.height);
        ctx.imageSmoothingEnabled = false;
        const scale = Math.min((dst.width - 12) / fw, (dst.height - 12) / fh);
        const dw = Math.round(fw * scale), dh = Math.round(fh * scale);
        const dx = Math.round((dst.width - dw) / 2), dy = Math.round((dst.height - dh) / 2);
        ctx.save();
        if (flipPreview) {
          ctx.translate(dx + dw, dy);
          ctx.scale(-1, 1);
          ctx.drawImage(src, idx * fw, 0, fw, fh, 0, 0, dw, dh);
        } else {
          ctx.drawImage(src, idx * fw, 0, fw, fh, dx, dy, dw, dh);
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frames, fps, flipPreview]);

  // Sync skin form values when skinTarget changes
  const currentSkinConfig = (() => {
    const skins = project.resolved?.skins || {};
    if (skinTarget === 'player') return skins.player || {};
    if (skinTarget === 'player2') return skins.player2 || {};
    const et = skinTarget.replace(/^enemy:/, '');
    return skins.enemies?.[et] || {};
  })();

  function canvasCoords(e) {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0, rx: 0, ry: 0 };
    const rect = c.getBoundingClientRect();
    const rx = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const ry = Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)));
    return {
      x: Math.min(c.width - 1, Math.max(0, Math.floor(rx * c.width))),
      y: Math.min(c.height - 1, Math.max(0, Math.floor(ry * c.height))),
      rx, ry,
    };
  }

  function applyBrush(x, y) {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const sz = Math.max(1, Number(brushSize) || 1);
    const x0 = Math.floor(x - sz / 2), y0 = Math.floor(y - sz / 2);
    if (tool === 'pencil') {
      ctx.fillStyle = color;
      ctx.fillRect(x0, y0, sz, sz);
      setDirty(true);
    } else if (tool === 'eraser') {
      ctx.clearRect(x0, y0, sz, sz);
      setDirty(true);
    }
  }

  function handlePointerDown(e) {
    const c = canvasRef.current;
    if (!c) return;
    const pt = canvasCoords(e);
    if (tool === 'picker' || tool === 'replace') {
      const ctx = c.getContext('2d');
      const px = ctx.getImageData(pt.x, pt.y, 1, 1).data;
      if (px[3] > 0) {
        const hex = rgbToHex(px[0], px[1], px[2]);
        if (tool === 'picker') setColor(hex);
        setFromColor(hex);
      }
      if (tool === 'replace') replaceColorInCanvas(rgbToHex(px[0], px[1], px[2]), color, tolerance);
      return;
    }
    if (tool === 'region') {
      dragRef.current = { mode: 'region', rx0: pt.rx, ry0: pt.ry };
      setRegion({ rx: pt.rx, ry: pt.ry, rw: 0.02, rh: 0.02 });
      return;
    }
    dragRef.current = { mode: 'draw' };
    applyBrush(pt.x, pt.y);
  }

  function handlePointerMove(e) {
    if (!dragRef.current) return;
    const pt = canvasCoords(e);
    if (dragRef.current.mode === 'region') {
      const rx0 = dragRef.current.rx0, ry0 = dragRef.current.ry0;
      const xMin = Math.min(rx0, pt.rx), yMin = Math.min(ry0, pt.ry);
      const rw = Math.max(0.02, Math.abs(pt.rx - rx0)), rh = Math.max(0.02, Math.abs(pt.ry - ry0));
      setRegion({ rx: Number(xMin.toFixed(3)), ry: Number(yMin.toFixed(3)), rw: Number(rw.toFixed(3)), rh: Number(rh.toFixed(3)) });
    } else {
      applyBrush(pt.x, pt.y);
    }
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function replaceColorInCanvas(srcHex, dstHex, tol) {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    const s = hexToRgb(srcHex), t = hexToRgb(dstHex), limit = Number(tol) || 32;
    let count = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) continue;
      const dist = Math.hypot(d[i] - s.r, d[i + 1] - s.g, d[i + 2] - s.b);
      if (dist <= limit) {
        d[i] = t.r; d[i + 1] = t.g; d[i + 2] = t.b;
        count++;
      }
    }
    if (count > 0) {
      ctx.putImageData(img, 0, 0);
      setDirty(true);
    }
  }

  async function saveCanvasPixels() {
    const c = canvasRef.current;
    if (!c || !selected) return;
    setBusy(true);
    try {
      const targetName = selected.replace(/\.webp$/i, '.png');
      const blob = await new Promise(res => c.toBlob(res, 'image/png'));
      const buf = await blob.arrayBuffer();
      await api.writeFile(project.id, `assets/${targetName}`, buf, 'image/png', `像素画布保存 ${targetName}`);
      setDirty(false);
      setSelected(targetName);
      setImgVersion(v => v + 1);
      await onChanged();
    } catch (e) { onError(e.message); }
    finally { setBusy(false); }
  }

  async function runServerEdit(body, msg) {
    if (!selected) return;
    setBusy(true);
    try {
      await api.editSprite(project.id, { name: selected, ...body, message: msg });
      setImgVersion(v => v + 1);
      await onChanged();
    } catch (e) { onError(e.details ? `${e.message}：${e.details.join('；')}` : e.message); }
    finally { setBusy(false); }
  }

  async function runAiInpaint(e) {
    e.preventDefault();
    if (!selected || !aiPrompt.trim()) return;
    setBusy(true);
    try {
      if (dirty) await saveCanvasPixels();
      const targetName = selected.replace(/\.webp$/i, '.png');
      await api.aiSprite(project.id, {
        name: targetName, source: targetName, prompt: aiPrompt.trim(),
        width: boxW, height: boxH, frames,
        ...(region ? { region } : {}),
        summary: `${region ? '局部重绘' : 'AI 重绘'} ${targetName}：${aiPrompt.trim().slice(0, 30)}`,
      });
      setAiPrompt('');
      setSelected(targetName);
      setImgVersion(v => v + 1);
      await onChanged();
    } catch (err) { onError(err.message); }
    finally { setBusy(false); }
  }

  async function runAiCreate(e) {
    e.preventDefault();
    if (!newName.trim() || !newPrompt.trim()) return;
    const clean = newName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/(-png)?$/, '') + '.png';
    setBusy(true);
    try {
      await api.aiSprite(project.id, {
        name: clean, prompt: newPrompt.trim(), width: boxW, height: boxH, frames,
        summary: `AI 生成精灵 ${clean}`,
      });
      setNewPrompt('');
      setSelected(clean);
      setImgVersion(v => v + 1);
      await onChanged();
    } catch (err) { onError(err.message); }
    finally { setBusy(false); }
  }

  async function uploadAsset(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const ext = (file.name.match(/\.(png|webp|ogg|mp3|wav)$/i)?.[0] || '.png').toLowerCase();
    const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'asset';
    const name = `${base.slice(0, 36)}${ext}`;
    setBusy(true);
    try {
      await api.writeFile(project.id, `assets/${name}`, await file.arrayBuffer(), file.type, `上传资源 ${name}`);
      if (/\.(png|webp)$/.test(name)) setSelected(name);
      await onChanged();
    } catch (err) { onError(err.message); }
    finally { setBusy(false); }
  }

  async function applySkinBinding({ useSelectedSprite = true, clear = false } = {}) {
    setBusy(true);
    try {
      const value = clear ? null : {
        ...(useSelectedSprite && selected ? { sprite: selected } : currentSkinConfig.sprite ? { sprite: currentSkinConfig.sprite } : {}),
        frames: Number(frames) || 1,
        fps: Number(fps) || 10,
        width: Number(boxW) || 26,
        height: Number(boxH) || 34,
        anchor,
        hue: Number(hue) || 0,
        saturate: Number(saturate ?? 1),
        brightness: Number(brightness ?? 1),
      };
      let patch, label;
      if (skinTarget === 'player' || skinTarget === 'player2') {
        label = skinTarget === 'player' ? '1P 主角外观' : '2P 搭档外观';
        patch = { skins: { [skinTarget]: value } };
      } else {
        const et = skinTarget.replace(/^enemy:/, '');
        label = `敌人（${schema?.enemyTypes?.[et] || et}）外观`;
        patch = { skins: { enemies: { [et]: value } } };
      }
      await api.patch(project.id, patch, clear ? `恢复默认${label}` : `更新${label}`);
      await onChanged();
    } catch (e) { onError(e.details ? `${e.message}：${e.details.join('；')}` : e.message); }
    finally { setBusy(false); }
  }

  async function setStageMusic(stageNum, trackValue) {
    setBusy(true);
    try {
      const val = trackValue || null;
      await api.patch(project.id, { audio: { stages: { [stageNum]: val } } }, val ? `第 ${stageNum} 关配乐 → ${val}` : `第 ${stageNum} 关恢复默认配乐`);
      await onChanged();
    } catch (e) { onError(e.message); }
    finally { setBusy(false); }
  }

  const nFrames = Math.max(1, Number(frames) || 1);

  return (
    <div className="asset-editor">
      <fieldset>
        <legend>1. 精灵与音频资源库</legend>
        <div className="asset-bar">
          <select value={selected} onChange={e => { setSelected(e.target.value); setRegion(null); }}>
            {!imageAssets.length && <option value="">（暂无图片资源，请上传或用 AI 生成）</option>}
            {imageAssets.map(f => {
              const name = f.path.replace(/^assets\//, '');
              return <option key={name} value={name}>{name}（{(f.size / 1024).toFixed(1)} KB）</option>;
            })}
          </select>
          <label className="upload">＋ 上传图片/音频<input type="file" accept=".png,.webp,.ogg,.mp3,.wav" onChange={uploadAsset} /></label>
        </div>
        <form className="ai-new-row" onSubmit={runAiCreate}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="文件名如 cyber-hero.png" style={{ width: 135 }} />
          <input value={newPrompt} onChange={e => setNewPrompt(e.target.value)} placeholder="AI 生成新精灵：例如“银色装甲机械战士，跑步姿态”" style={{ flex: 1 }} />
          <button type="submit" className="primary" disabled={busy || !aiReady || !newPrompt.trim()}>✨ AI 生成精灵</button>
        </form>
      </fieldset>

      {selected && (
        <fieldset>
          <legend>2. 像素编辑 · 切帧动画 · 框选 AI 局部重绘（{selected}）</legend>
          <div className="tool-strip">
            {[
              ['pencil', '✏ 画笔'],
              ['eraser', '⌫ 橡皮擦'],
              ['picker', '💧 吸管'],
              ['replace', '🎨 同色替换'],
              ['region', '⬚ 框选局部重绘'],
            ].map(([id, label]) => (
              <button key={id} type="button" className={tool === id ? 'active' : ''} onClick={() => setTool(id)}>{label}</button>
            ))}
          </div>

          <div className="tool-options">
            <label>颜色 <input type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
            {(tool === 'pencil' || tool === 'eraser') && (
              <label>笔刷 <input type="number" min="1" max="16" value={brushSize} onChange={e => setBrushSize(Number(e.target.value) || 1)} style={{ width: 48 }} /></label>
            )}
            {tool === 'replace' && (
              <>
                <label>原色 <input type="color" value={fromColor} onChange={e => setFromColor(e.target.value)} /></label>
                <label>容差 <input type="number" min="1" max="128" value={tolerance} onChange={e => setTolerance(Number(e.target.value) || 32)} style={{ width: 52 }} /></label>
                <button type="button" onClick={() => replaceColorInCanvas(fromColor, color, tolerance)}>全图替换</button>
              </>
            )}
            <label>缩放
              <select value={zoom} onChange={e => setZoom(Number(e.target.value))}>
                {[1, 2, 3, 4, 6].map(z => <option key={z} value={z}>{z}x</option>)}
              </select>
            </label>
            <label><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> 切帧/碰撞框辅助线</label>
          </div>

          <div className="workbench">
            <div className="canvas-stage">
              <div className="canvas-wrap" onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}>
                <canvas ref={canvasRef} className="sprite-canvas" style={{ width: `${canvasDim.w * zoom}px`, height: `${canvasDim.h * zoom}px` }} />
                {showGrid && (
                  <div className="sprite-overlay">
                    {Array.from({ length: nFrames - 1 }, (_, i) => (
                      <div key={i} className="frame-line" style={{ left: `${((i + 1) / nFrames) * 100}%` }} />
                    ))}
                    <div className="anchor-mark" style={{ left: `${(0.5 / nFrames) * 100}%`, top: anchor === 'feet' ? '96%' : '50%' }} title={`锚点：${anchor}`} />
                  </div>
                )}
                {region && (
                  <div className="region-box" style={{
                    left: `${region.rx * 100}%`, top: `${region.ry * 100}%`,
                    width: `${region.rw * 100}%`, height: `${region.rh * 100}%`,
                  }}>
                    <span>锁定框外像素</span>
                  </div>
                )}
              </div>
            </div>

            <div className="anim-box">
              <div className="anim-head">
                <strong>动画预览</strong>
                <label><input type="checkbox" checked={flipPreview} onChange={e => setFlipPreview(e.target.checked)} /> 朝右翻转</label>
              </div>
              <canvas ref={previewRef} width="96" height="96" className="anim-canvas" />
              <div className="anim-fields">
                <label>帧数 <input type="number" min="1" max="16" value={frames} onChange={e => setFrames(Math.max(1, Number(e.target.value) || 1))} /></label>
                <label>FPS <input type="number" min="1" max="30" value={fps} onChange={e => setFps(Math.max(1, Number(e.target.value) || 8))} /></label>
                <label>宽(W) <input type="number" min="4" max="192" value={boxW} onChange={e => setBoxW(Math.max(4, Number(e.target.value) || 24))} /></label>
                <label>高(H) <input type="number" min="4" max="192" value={boxH} onChange={e => setBoxH(Math.max(4, Number(e.target.value) || 32))} /></label>
                <label>锚点
                  <select value={anchor} onChange={e => setAnchor(e.target.value)}>
                    <option value="feet">脚底 (feet)</option>
                    <option value="center">中心 (center)</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="canvas-actions">
            <button type="button" className={dirty ? 'primary' : ''} disabled={busy || !dirty} onClick={saveCanvasPixels}>
              💾 保存像素修改{dirty ? ' *' : ''}
            </button>
            <button type="button" disabled={busy} onClick={() => runServerEdit({ keyBg: true, tolerance: 70 }, `一键去背景 ${selected}`)}>
              ✂ 一键去纯色背景
            </button>
            <button type="button" disabled={busy} onClick={() => runServerEdit({ op: 'process', width: boxW, height: boxH, frames }, `重新切帧对齐 ${selected} (${frames}帧)`)}>
              📐 按 {frames} 帧对齐缩放
            </button>
            {region && <button type="button" onClick={() => setRegion(null)}>取消框选区域</button>}
          </div>

          <form className="ai-inpaint-row" onSubmit={runAiInpaint}>
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              placeholder={region ? '框选区域 AI 局部重绘（框外像素严格保留）：例如“把头盔改成金色墨镜”' : '整图 AI 改图：例如“改成红色火焰铠甲，保持动作不变”'} />
            <button type="submit" className="primary" disabled={busy || !aiReady || !aiPrompt.trim()}>
              {region ? '🪄 局部重绘选中框' : '🪄 AI 改图'}
            </button>
          </form>
        </fieldset>
      )}

      <fieldset>
        <legend>3. 角色与敌人换皮 / 调色绑定（实时生效）</legend>
        <div className="skin-row">
          <label>换皮对象
            <select value={skinTarget} onChange={e => setSkinTarget(e.target.value)}>
              <option value="player">1P 主角（比尔）</option>
              <option value="player2">2P 搭档（兰斯）</option>
              <option value="enemy:all">全体原版敌人（enemies.all）</option>
              {schema?.enemyTypes && Object.entries(schema.enemyTypes).map(([k, name]) => (
                <option key={k} value={`enemy:${k}`}>敌人：{name}（{k}）</option>
              ))}
            </select>
          </label>
          <small className="muted">
            当前绑定：{currentSkinConfig.sprite ? `图片 ${currentSkinConfig.sprite}（${currentSkinConfig.frames || 1}帧）` : '原版矢量/高清外观'}
            {currentSkinConfig.hue ? ` · 色相 ${currentSkinConfig.hue}°` : ''}
          </small>
        </div>

        <div className="hsl-sliders">
          <label>色相偏移 ({hue}°)
            <input type="range" min="-180" max="180" step="5" value={hue} onChange={e => setHue(Number(e.target.value))} />
          </label>
          <label>饱和度 ({saturate}x)
            <input type="range" min="0" max="3" step="0.1" value={saturate} onChange={e => setSaturate(Number(e.target.value))} />
          </label>
          <label>亮度 ({brightness}x)
            <input type="range" min="0.3" max="2.5" step="0.1" value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
          </label>
        </div>

        <div className="skin-actions">
          <button type="button" className="primary" disabled={busy || !selected} onClick={() => applySkinBinding({ useSelectedSprite: true })}>
            🎭 将「{selected || '选中图片'}」绑定到该角色
          </button>
          <button type="button" disabled={busy} onClick={() => applySkinBinding({ useSelectedSprite: false })}>
            🎨 仅应用色相/尺寸到该角色
          </button>
          <button type="button" disabled={busy} onClick={() => applySkinBinding({ clear: true })}>
            ↺ 恢复原版外观
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend>4. 关卡背景音乐绑定（audio.stages）</legend>
        <p className="note">支持切换内置曲目，或绑定上传到 assets/ 的 .ogg / .mp3 / .wav 音频。</p>
        {Object.entries(STAGES).map(([st, name]) => {
          const cur = project.resolved?.audio?.stages?.[st] || '';
          const over = project.spec?.audio?.stages?.[st] !== undefined;
          return (
            <label key={st} className={'field' + (over ? ' overridden' : '')}>
              <span className="name">第 {st} 关 · {name}</span>
              <select value={cur} onChange={e => setStageMusic(st, e.target.value)}>
                {BUILTIN_TRACKS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                {audioAssets.map(f => {
                  const fn = f.path.replace(/^assets\//, '');
                  return <option key={fn} value={fn}>自定义音频：{fn}</option>;
                })}
              </select>
              {over && <button type="button" className="reset" title="恢复默认配乐" onClick={() => setStageMusic(st, '')}>↺</button>}
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
