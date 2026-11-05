"""Crop and compress the imagegen entrance, retaining its generated RGBA alpha."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image

GAME=Path(__file__).resolve().parents[1]


def main(source):
    original=GAME/'design/source-art/stage1/fortress-breach-v3.png'
    original.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,original)
    image=Image.open(source).convert('RGBA')
    bounds=image.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
    image=image.crop(bounds)
    image=image.resize((640,round(image.height*640/image.width)),Image.Resampling.LANCZOS)
    target=GAME/'assets/stage1/fortress-breach-v3.png'
    image.save(target)
    target=target.with_suffix('.webp')
    image.save(target,'WEBP',quality=92,method=6,exact=True)
    with Image.open(target) as decoded:
        assert decoded.getchannel('A').tobytes()==image.getchannel('A').tobytes()
    record=dict(generatedWith='built-in imagegen',url='/games/contra2026/assets/stage1/fortress-breach-v3.webp',
        file='assets/stage1/fortress-breach-v3.webp',source='design/source-art/stage1/fortress-breach-v3.png',
        promptFile='fortress-breach-v3-prompt.txt',dimensions=list(image.size),sourceBounds=list(bounds),
        bytes=target.stat().st_size,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),alphaPreserved=True)
    (GAME/'design/fortress-breach-v3.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    version_file=GAME/'js/asset-url.mjs'
    code=version_file.read_text(encoding='utf-8')
    if record['url'] not in code:
        code=code.replace('const VERSIONS=Object.freeze({\n',
            'const VERSIONS=Object.freeze({\n'+f'  "{record["url"]}": "{record["sha256"][:10]}",\n')
        version_file.write_text(code,encoding='utf-8')
    print(json.dumps(record))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',type=Path,required=True)
    main(parser.parse_args().source)
