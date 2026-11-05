"""Pack the approved concrete fortress into the established game coordinates.

Only crops, resizing and WebP compression are performed here. All painted
structure, material, damage and transparency come from built-in imagegen.
"""
import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path
from PIL import Image

GAME = Path(__file__).resolve().parents[1]
FACADE = (29, 10, 1201, 1254)
DAMAGE = {'gunA': (36, 311, 483, 416), 'gunB': (555, 311, 491, 415), 'core': (1109, 202, 383, 620)}


def crop_alpha(image, region=None):
    tile = image.crop(region) if region else image
    bounds = tile.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
    if not bounds:
        raise ValueError('Generated sprite has no visible alpha')
    if tile.getchannel('A').getextrema()[0] != 0:
        raise ValueError('Generated sprite must have a genuinely transparent background')
    return tile.crop(bounds), list(bounds)


def prepare(facade, damage, breach):
    sources = GAME / 'design/source-art/stage1'
    sources.mkdir(parents=True, exist_ok=True)
    records = []

    def save(name, image, source, frames, source_bounds):
        original = sources / (name + '.png')
        if source.resolve() != original.resolve():
            shutil.copy2(source, original)
        png = GAME / 'assets/stage1' / (name + '.png')
        image.save(png)
        webp = png.with_suffix('.webp')
        image.save(webp, 'WEBP', quality=88, method=6, exact=True)
        with Image.open(webp) as decoded:
            assert decoded.getchannel('A').tobytes() == image.getchannel('A').tobytes()
        record = dict(file=webp.relative_to(GAME).as_posix(), url='/games/contra2026/' + webp.relative_to(GAME).as_posix(),
                      source=original.relative_to(GAME).as_posix(), dimensions=list(image.size), frames=frames,
                      sourceBounds=source_bounds, bytes=webp.stat().st_size,
                      sha256=hashlib.sha256(webp.read_bytes()).hexdigest(), alphaPreserved=True)
        records.append(record)

    tile, bounds = crop_alpha(Image.open(facade).convert('RGBA'))
    canvas = Image.new('RGBA', (1232, 1277))
    x, y, w, h = FACADE
    canvas.paste(tile.resize((w, h), Image.Resampling.LANCZOS), (x, y))
    save('fortress-realistic-v3', canvas, facade, {'facade': list(FACADE)}, bounds)

    image = Image.open(damage).convert('RGBA')
    canvas = Image.new('RGBA', (1536, 1024))
    source_bounds = {}
    # Generation can shift a component a few pixels across an equal-third line.
    # Split at actual transparent gutters so a neighbor's mounting strip cannot
    # leak into another wreck tile.
    alpha = image.getchannel('A')
    def gutter(nominal):
        radius = round(image.width * .06)
        candidates = range(round(nominal) - radius, round(nominal) + radius)
        return min(candidates, key=lambda x: (sum(value > 16 for value in alpha.crop((x, 0, x + 1, image.height)).tobytes()), abs(x - nominal)))
    edges = [0, gutter(image.width / 3), gutter(image.width * 2 / 3), image.width]
    for index, (key, frame) in enumerate(DAMAGE.items()):
        region = (edges[index], 0, edges[index + 1], image.height)
        tile, bounds = crop_alpha(image, region)
        x, y, w, h = frame
        canvas.paste(tile.resize((w, h), Image.Resampling.LANCZOS), (x, y))
        source_bounds[key] = [bounds[0] + region[0], bounds[1], bounds[2] - bounds[0], bounds[3] - bounds[1]]
    save('fortress-wreck-realistic-v3', canvas, damage, {key: list(frame) for key, frame in DAMAGE.items()}, source_bounds)

    tile, bounds = crop_alpha(Image.open(breach).convert('RGBA'))
    image = tile.resize((640, 1008), Image.Resampling.LANCZOS)
    save('fortress-breach-realistic-v4', image, breach, {}, bounds)

    manifest = dict(generatedWith='built-in imagegen', promptFile='fortress-realistic-v3-prompts.json', assets=records,
                    totalBytes=sum(record['bytes'] for record in records),
                    geometry='Preserves facade, cannon/core targets, wall, damage crops and exit coordinates.')
    (GAME / 'design/fortress-realistic-v3.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    versions = GAME / 'js/asset-url.mjs'
    code = versions.read_text(encoding='utf-8')
    additions = ''
    for record in records:
        if '"' + record['url'] + '"' in code:
            pattern = '(' + re.escape('"' + record['url'] + '"') + r'\s*:\s*")[^"]+'
            code = re.sub(pattern, lambda match: match.group(1) + record['sha256'][:10], code)
        else:
            additions += f'  "{record["url"]}": "{record["sha256"][:10]}",\n'
    code = code.replace('const VERSIONS=Object.freeze({\n', 'const VERSIONS=Object.freeze({\n' + additions)
    versions.write_text(code, encoding='utf-8')
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--facade', type=Path, required=True)
    parser.add_argument('--damage', type=Path, required=True)
    parser.add_argument('--breach', type=Path, required=True)
    args = parser.parse_args()
    prepare(args.facade, args.damage, args.breach)
