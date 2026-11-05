"""Crop, scale and compress the approved imagegen satchel without repainting it."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image

GAME = Path(__file__).resolve().parents[1]


def prepare(source):
    original = GAME / 'design/source-art/shared/demolition-charge-v2.png'
    original.parent.mkdir(parents=True, exist_ok=True)
    if source.resolve() != original.resolve():
        shutil.copy2(source, original)
    image = Image.open(source).convert('RGBA')
    alpha = image.getchannel('A')
    assert alpha.getextrema() == (0, 255), 'Expected generated transparent alpha'
    bounds = alpha.point(lambda a: 255 if a > 16 else 0).getbbox()
    cropped = image.crop(bounds)
    ratio = 496 / cropped.width
    sprite = cropped.resize((496, round(cropped.height * ratio)), Image.Resampling.LANCZOS)
    packed = Image.new('RGBA', (512, 256))
    packed.paste(sprite, (8, 8))
    png = GAME / 'assets/shared/demolition-charge-v2.png'
    packed.save(png)
    webp = png.with_suffix('.webp')
    packed.save(webp, 'WEBP', quality=90, method=6, exact=True)
    assert Image.open(webp).getchannel('A').tobytes() == packed.getchannel('A').tobytes()
    record = dict(generatedWith='built-in imagegen',
                  source=original.relative_to(GAME).as_posix(), sourceBounds=list(bounds),
                  file=webp.relative_to(GAME).as_posix(),
                  url='/games/contra2026/' + webp.relative_to(GAME).as_posix(),
                  dimensions=[512, 256], baseline=240, fuseTip=[498, 16],
                  bytes=webp.stat().st_size, sha256=hashlib.sha256(webp.read_bytes()).hexdigest(),
                  alphaPreserved=True)
    (GAME / 'design/demolition-charge-v2.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf8')
    print(json.dumps(record))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    prepare(parser.parse_args().source)
