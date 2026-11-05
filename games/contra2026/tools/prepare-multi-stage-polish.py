"""Pack imagegen sprites and preserve their generated alpha for stages 2–4."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image

GAME=Path(__file__).resolve().parents[1]


def main(args):
    records=[]
    def source(path,name):
        target=GAME/'design/source-art'/name
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(path,target)
        return Image.open(path).convert('RGBA')
    def save(name,image,frames=None):
        target=GAME/'assets'/name
        target.parent.mkdir(parents=True,exist_ok=True)
        image.save(target.with_suffix('.png'))
        image.save(target,'WEBP',quality=94,method=6,exact=True)
        with Image.open(target) as decoded:
            assert decoded.getchannel('A').tobytes()==image.getchannel('A').tobytes()
        records.append(dict(url='/games/contra2026/assets/'+name,file='assets/'+name,source='design/source-art/'+str(Path(name).with_suffix('.png')).replace('\\','/'),
            dimensions=list(image.size),frames=frames,bytes=target.stat().st_size,
            sha256=hashlib.sha256(target.read_bytes()).hexdigest(),alphaPreserved=True))
    for key,name in [('guardian','waterfall-guardian-v3'),('wreck','waterfall-guardian-v3-wreck')]:
        image=source(getattr(args,key),'stage3/'+name+'.png')
        split=image.height//2
        canvas=Image.new('RGBA',(1254,1254))
        canvas.paste(image.crop((0,0,image.width,split)).resize((1254,638),Image.Resampling.LANCZOS),(0,0))
        canvas.paste(image.crop((0,split,image.width,image.height)).resize((1254,616),Image.Resampling.LANCZOS),(0,638))
        save('stage3/'+name+'.webp',canvas,{'closed':[0,0,1254,638],'open':[0,638,1254,616]})
    image=source(args.flames,'stage3/flame-jets-v2.png')
    # Uniform atlas scaling only: all eight generated slots retain their alpha.
    save('stage3/flame-jets-v2.webp',image.resize((1024,1024),Image.Resampling.LANCZOS),
        {str(i):[i%4*256,i//4*512,256,512] for i in range(8)})
    image=source(args.wall,'stage2/control-wall-v2.png')
    save('stage2/control-wall-v2.webp',image)
    image=source(args.devices,'stage2/defense-devices-v2.png')
    canvas=Image.new('RGBA',(1024,320))
    for i in range(2):
        cell=image.crop((i*image.width//2,0,(i+1)*image.width//2,image.height))
        bounds=cell.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
        tile=cell.crop(bounds)
        scale=min(496/tile.width,304/tile.height)
        tile=tile.resize((round(tile.width*scale),round(tile.height*scale)),Image.Resampling.LANCZOS)
        canvas.paste(tile,(i*512+(512-tile.width)//2,(320-tile.height)//2))
    save('stage2/defense-devices-v2.webp',canvas,{'intact':[0,0,512,320],'broken':[512,0,512,320]})
    manifest=dict(generatedWith='built-in imagegen',prompts='multi-stage-polish-prompts.json',assets=records)
    (GAME/'design/multi-stage-polish.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    version_file=GAME/'js/asset-url.mjs'
    code=version_file.read_text(encoding='utf-8')
    additions=''.join(f'  "{r["url"]}": "{r["sha256"][:10]}",\n' for r in records if r['url'] not in code)
    code=code.replace('const VERSIONS=Object.freeze({\n','const VERSIONS=Object.freeze({\n'+additions)
    version_file.write_text(code,encoding='utf-8')
    print(json.dumps(manifest))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    for name in ['guardian','wreck','flames','wall','devices']:
        parser.add_argument('--'+name,type=Path,required=True)
    main(parser.parse_args())
