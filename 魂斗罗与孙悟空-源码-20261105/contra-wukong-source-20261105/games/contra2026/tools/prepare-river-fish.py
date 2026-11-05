"""Crop and compress the approved transparent fish for the first-stage river."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image

GAME=Path(__file__).resolve().parents[1]


def main(source):
    original=GAME/'design/source-art/stage1/river-fish.png'
    original.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,original)
    image=Image.open(source).convert('RGBA')
    bounds=image.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
    image=image.crop(bounds)
    image=image.resize((512,round(image.height*512/image.width)),Image.Resampling.LANCZOS)
    destination=GAME/'assets/stage1/river-fish.png'
    image.save(destination)
    destination=destination.with_suffix('.webp')
    image.save(destination,'WEBP',quality=90,method=6,exact=True)
    with Image.open(destination) as decoded:assert decoded.getchannel('A').tobytes()==image.getchannel('A').tobytes()
    record=dict(generatedWith='built-in imagegen',url='/games/contra2026/assets/stage1/river-fish.webp',
        file='assets/stage1/river-fish.webp',source='design/source-art/stage1/river-fish.png',
        promptFile='river-fish-prompt.txt',dimensions=list(image.size),bounds=list(bounds),
        bytes=destination.stat().st_size,sha256=hashlib.sha256(destination.read_bytes()).hexdigest(),alphaPreserved=True)
    (GAME/'design/river-fish.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    versions=GAME/'js/asset-url.mjs'
    text=versions.read_text(encoding='utf-8')
    if record['url'] not in text:
        text=text.replace('const VERSIONS=Object.freeze({\n','const VERSIONS=Object.freeze({\n'+f'  "{record["url"]}": "{record["sha256"][:10]}",\n')
        versions.write_text(text,encoding='utf-8')
    print(json.dumps(record))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',type=Path,required=True)
    main(parser.parse_args().source)
