"""Turn the supplied staff demonstration into a measured game animation.

FFmpeg samples the original video and keys its white studio background. The
painted figure is never rebuilt or retargeted; metadata registers its feet,
grip and rigid pole so rendering and contact use the same recorded motion.
"""
import argparse
import hashlib
import json
import math
import shutil
import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
COUNT = 64
CELL, COLUMNS = (320, 256), 8
# Read back from the recorded frame contacts: during wrist rolls, a cape fold
# can beat the nearly vertical pole in an unconstrained Hough vote.
POLE_ANGLES = {4: -.08, 12: -1.41, 16: -1.37, 27: 1.44, 29: 0, 50: .23}
POLE_ROIS = {4: [20, 150, 220, 185], 12: [147, 35, 191, 218],
             16: [148, 50, 193, 219], 27: [153, 15, 188, 203],
             29: [102, 174, 291, 190], 50: [90, 101, 251, 154]}
REFERENCES = {
    'reference': {'source': '111', 'seconds': 6.7, 'angles': POLE_ANGLES, 'rois': POLE_ROIS},
    'reference2': {'source': '222', 'seconds': 6.9},
    # Cell-local measurements of both end caps and the holding hand: the dark
    # shaft during these wrist rolls is weaker than the nearby cape outline.
    'reference3': {'source': '333', 'seconds': 6.6, 'tracks': {
        33: [[141, 22], [180, 220], [160, 128]],
        41: [[109, 81], [281, 146], [196, 114]],
        42: [[149, 28], [240, 190], [191, 102]],
        43: [[185, 14], [202, 203], [193, 100]],
        46: [[121, 58], [266, 158], [202, 112]],
        47: [[165, 23], [227, 194], [196, 110]],
        50: [[110, 87], [280, 125], [198, 110]],
        56: [[193, 13], [197, 203], [195, 98]],
    }},
}


def pole_track(rgba, previous=None, expected=None, roi=None):
    rgb = rgba[:, :, :3]
    r, g, b = [rgb[:, :, i].astype(float) for i in range(3)]
    opaque = rgba[:, :, 3] > 140
    warm = opaque & (r > 40) & (r > g * 1.05) & (r < g * 2.8) & (g > b * 1.12)
    if roi is not None:
        region = np.zeros(warm.shape, dtype=bool)
        x1,y1,x2,y2 = [round(v) for v in roi]
        region[max(0,y1):y2,max(0,x1):x2] = True
        warm &= region
    edges = cv2.Canny(cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY), 45, 140)
    edges[~cv2.dilate(warm.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)] = 0
    lines = cv2.HoughLinesP(edges, 1, np.pi / 720, 35, minLineLength=65, maxLineGap=35)
    best = None
    for line in lines if lines is not None else []:
        x1, y1, x2, y2 = line[0]
        a, z = np.array([x1, y1], float), np.array([x2, y2], float)
        length = np.linalg.norm(z - a)
        # The rigid staff stays above the upper legs. Cape edges and boots must
        # not become a weapon simply because they are also warm and outlined.
        if roi is None and (max(y1, y2) > rgba.shape[0] * .94 or min(y1, y2) > rgba.shape[0] * .74):
            continue
        if z[0] < a[0]:
            a, z = z, a
        axis = (z - a) / length
        if expected is not None and abs(axis @ np.array([math.cos(expected), math.sin(expected)])) < .99:
            continue
        yy, xx = np.where(warm)
        dist = np.abs((xx - a[0]) * axis[1] - (yy - a[1]) * axis[0])
        along = (xx - a[0]) * axis[0] + (yy - a[1]) * axis[1]
        support = (dist < 4) & (along > -45) & (along < length + 45)
        if support.sum() < 70:
            continue
        lo, hi = np.percentile(along[support], [1, 99])
        score = (hi - lo) * math.sqrt(support.sum())
        if best is None or score > best[0]:
            best = (score, a + axis * lo, a + axis * hi)
    if best is None:
        if roi is not None:
            raise ValueError('Cannot locate the calibrated recorded staff')
        if previous is None:
            raise ValueError('Cannot locate the first recorded staff')
        return previous
    a, z = best[1:]
    # Put the grasp between the two hands on the measured shaft, rather than
    # using a canvas center which drifts when the hero lunges or raises arms.
    axis = (z - a) / np.linalg.norm(z - a)
    skin = opaque & (r > 100) & (g > 60) & (r > g * 1.1) & (b > g * .42) & (b < g * 1.1)
    yy, xx = np.where(skin)
    dist = np.abs((xx - a[0]) * axis[1] - (yy - a[1]) * axis[0])
    along = (xx - a[0]) * axis[0] + (yy - a[1]) * axis[1]
    length = np.linalg.norm(z - a)
    hands = (dist < 7) & (along > length * .18) & (along < length * .82)
    grip = float(np.median(along[hands])) if hands.sum() > 8 else length * .5
    return {'ends': [a.tolist(), z.tolist()], 'origin': (a + axis * grip).tolist()}


def build(source, name='reference'):
    config = REFERENCES[name]
    seconds, duration = config['seconds'], 2.15
    archive = ROOT / f"tools/sources/staff-flow-{config['source']}.mp4"
    archive.parent.mkdir(exist_ok=True)
    if source.resolve() != archive.resolve():
        shutil.copy2(source, archive)
    scratch = ROOT.parents[1] / '.playwright-mcp'
    scratch.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='wukong-staff-reference-', dir=scratch) as temp:
        assert Path(temp).resolve().parent == scratch.resolve()
        neutral = "min(r(X,Y),min(g(X,Y),b(X,Y)))"
        chroma = f"max(r(X,Y),max(g(X,Y),b(X,Y)))-{neutral}"
        clean_alpha = f"geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(gt({neutral},150)*lt({chroma},28),0,alpha(X,Y))'"
        subprocess.run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', str(archive),
            '-t', str(seconds), '-vf',
            f'fps={COUNT / seconds},scale=960:540:flags=lanczos,colorkey=0xffffff:0.18:0.03,format=rgba,{clean_alpha}',
            '-frames:v', str(COUNT), str(Path(temp) / '%03d.png')
        ], check=True)
        originals = [Image.open(path).convert('RGBA') for path in sorted(Path(temp).glob('*.png'))]
        assert len(originals) == COUNT
        boxes = [im.getchannel('A').point(lambda a: 255 if a > 96 else 0).getbbox() for im in originals]
        union = [min(b[0] for b in boxes) - 6, min(b[1] for b in boxes) - 6,
                 max(b[2] for b in boxes) + 6, min(540, max(b[3] for b in boxes) + 3)]
        factor = min((CELL[0] - 16) / (union[2] - union[0]), (CELL[1] - 12) / (union[3] - union[1]))
        size = tuple(round((union[i + 2] - union[i]) * factor) for i in range(2))
        margin = [(CELL[i] - size[i]) // 2 for i in range(2)]
        atlas = Image.new('RGBA', (CELL[0] * COLUMNS, CELL[1] * math.ceil(COUNT / COLUMNS)))
        frames, previous = [], None
        for index, original in enumerate(originals):
            rgba = np.array(original)
            measured = config.get('tracks', {}).get(index)
            if measured is not None:
                a, z, hand = [np.array([union[i] + (p[i] - margin[i]) / factor for i in range(2)]) for p in measured]
                axis = (z - a) / np.linalg.norm(z - a)
                track = {'ends': [a.tolist(), z.tolist()], 'origin': (a + axis * ((hand - a) @ axis)).tolist()}
            else:
                roi = config.get('rois', {}).get(index)
                if roi is not None:
                    roi = [union[i % 2] + (v - margin[i % 2]) / factor for i,v in enumerate(roi)]
                track = pole_track(rgba, previous, config.get('angles', {}).get(index), roi)
            previous = track
            rgb = rgba[:, :, :3].astype(float)
            pants = (rgba[:, :, 3] > 180) & (rgb[:, :, 1] > rgb[:, :, 0] * 1.16) & (rgb[:, :, 2] > rgb[:, :, 0] * 1.12)
            yy, xx = np.where(pants)
            hip = [float(np.median(xx[yy < np.percentile(yy, 35)])), float(np.percentile(yy, 15))]
            offset = [index % COLUMNS * CELL[0] + margin[0], index // COLUMNS * CELL[1] + margin[1]]
            point = lambda p: [round(offset[i] + (p[i] - union[i]) * factor, 3) for i in range(2)]
            image = original.crop(union).resize(size, Image.Resampling.LANCZOS)
            atlas.alpha_composite(image, offset)
            b = image.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
            bounds = [offset[0] + b[0], offset[1] + b[1], b[2] - b[0], b[3] - b[1]]
            a, z = [point(p) for p in track['ends']]
            frames.append({'index': index, 'label': index + 1, 'bounds': bounds, 'center': point(hip),
                           'pick': point(hip), 'hip': point(hip), 'anchor': point([hip[0], 538]),
                           'origin': point(track['origin']), 'shaft': {'ends': [a, z], 'length': math.dist(a, z)},
                           'sourceTime': round(index * seconds / COUNT, 4)})
        master = ROOT / f'assets/hero-whole-{name}.png'
        atlas.save(master)
        metadata = {'path': str(master.relative_to(ROOT)), 'width': atlas.width, 'height': atlas.height,
                    'rows': COUNT // COLUMNS, 'columns': COLUMNS, 'scale': .108 / factor,
                    'runtimeMaxSize': [atlas.width, atlas.height], 'isolatedCells': True, 'frames': frames}
        master.with_suffix('.measure.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf8')
        source_duration = float(subprocess.check_output([
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(archive)
        ], text=True).strip())
        report = {'source': str(archive.relative_to(ROOT)), 'original': str(source),
                  'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'sourceDuration': source_duration,
                  'sampledRange': [0, seconds], 'frames': COUNT, 'gameDuration': duration,
                  'method': 'FFmpeg video-frame extraction and white studio chroma key; no generated replacement poses',
                  'master': master.name, 'runtime': f'hero-whole-{name}.webp', 'crop': union, 'scale': metadata['scale']}
        (ROOT / f'assets/staff-flow-{name}.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
        print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', nargs='?', type=Path)
    parser.add_argument('--name', choices=list(REFERENCES), default='reference')
    args=parser.parse_args()
    source=args.source or ROOT / f"tools/sources/staff-flow-{REFERENCES[args.name]['source']}.mp4"
    build(source,args.name)
