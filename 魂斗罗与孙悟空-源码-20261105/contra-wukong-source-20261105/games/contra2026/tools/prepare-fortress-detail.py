"""Pack approved imagegen art into the existing fortress coordinate system."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image

GAME=Path(__file__).resolve().parents[1]
FACADE=(29,10,1201,1254)
DAMAGE={'gunA':(36,311,483,416),'gunB':(555,311,491,415),'core':(1109,202,383,620)}


def alpha_crop(image,region=None):
    tile=image.crop(region) if region else image
    bounds=tile.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
    if not bounds:raise ValueError('Empty sprite')
    return tile.crop(bounds),list(bounds)


def main(intact,damage):
    sources=GAME/'design/source-art/stage1'
    sources.mkdir(parents=True,exist_ok=True)
    source_files={'fortress-detail-v2':intact,'fortress-damage-detail-v2':damage}
    for name,path in source_files.items():shutil.copy2(path,sources/(name+'.png'))
    records=[]
    def save(name,image,crops):
        path=GAME/'assets/stage1'/(name+'.png')
        image.save(path)
        path=path.with_suffix('.webp')
        image.save(path,'WEBP',quality=92,method=6,exact=True)
        with Image.open(path) as decoded:assert decoded.getchannel('A').tobytes()==image.getchannel('A').tobytes()
        return dict(file=path.relative_to(GAME).as_posix(),url='/games/contra2026/'+path.relative_to(GAME).as_posix(),
            source='design/source-art/stage1/'+name+'.png',dimensions=list(image.size),frames=crops,
            bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),alphaPreserved=True)
    image=Image.open(intact).convert('RGBA')
    cut,bounds=alpha_crop(image)
    canvas=Image.new('RGBA',(1232,1277))
    x,y,w,h=FACADE
    canvas.paste(cut.resize((w,h),Image.Resampling.LANCZOS),(x,y))
    facade=save('fortress-detail-v2',canvas,dict(facade=list(FACADE)))
    facade['sourceBounds']=bounds
    records.append(facade)
    image=Image.open(damage).convert('RGBA')
    assert image.size==(1536,1024)
    canvas=Image.new('RGBA',(1536,1024))
    source_crops={}
    for (key,frame),region in zip(DAMAGE.items(),[(0,0,550,1024),(550,0,1092,1024),(1092,0,1536,1024)]):
        cut,bounds=alpha_crop(image,region)
        x,y,w,h=frame
        canvas.paste(cut.resize((w,h),Image.Resampling.LANCZOS),(x,y))
        source_crops[key]=[bounds[0]+region[0],bounds[1]+region[1],bounds[2]-bounds[0],bounds[3]-bounds[1]]
    wreck=save('fortress-damage-detail-v2',canvas,{key:list(frame) for key,frame in DAMAGE.items()})
    wreck['sourceBounds']=source_crops
    records.append(wreck)
    manifest={'generatedWith':'built-in imagegen','prompts':'fortress-detail-v2-prompts.json','assets':records,
        'totalBytes':sum(record['bytes'] for record in records),'worldFacade':{'x':3191,'y':28,'w':147,'h':148},
        'geometry':'Original facade bounds, damage crops, targets, wall boundary and exit remain unchanged.'}
    (GAME/'design/fortress-detail-v2.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    version_file=GAME/'js/asset-url.mjs'
    code=version_file.read_text(encoding='utf-8')
    marker='const VERSIONS=Object.freeze({\n'
    additions=''.join(f'  "{record["url"]}": "{record["sha256"][:10]}",\n' for record in records if '"'+record['url']+'"' not in code)
    code=code.replace(marker,marker+additions)
    version_file.write_text(code,encoding='utf-8')
    print(json.dumps(manifest))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--intact',type=Path,required=True)
    parser.add_argument('--damage',type=Path,required=True)
    args=parser.parse_args()
    main(args.intact,args.damage)
