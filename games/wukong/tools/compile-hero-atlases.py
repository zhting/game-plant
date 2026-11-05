"""Compile measured full-sprite metadata and compressed runtime textures."""
import argparse, json, math
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parents[1]
names=['movement','mobility','sweep','cleave','flower','extra','uppercut','advance','blossom','cyclone','qilin','low','martial','reference','reference2','reference3']
parser=argparse.ArgumentParser();parser.add_argument('--texture',action='append',choices=names)
textures=set(parser.parse_args().texture or names)
atlases={};stats=[]
for name in names:
    master=root/'assets'/f'hero-whole-{name}.png'
    source=json.loads(master.with_suffix('.measure.json').read_text(encoding='utf8'))
    image=Image.open(master).convert('RGBA');rgba=np.array(image)
    columns=source.get('columns',4);cell=source['width']/columns
    scale=source.get('scale',42/(source['height']/source['rows']) if columns==2 else 44/cell)
    key='heroWhole'+name.title();rows=source['rows'];out=[]
    for f in source['frames']:
        x,y,w,h=f['bounds'];i=f['index'];hip=f['hip'];a,b=f['shaft']['ends'];origin=f['origin']
        # The upper trousers can belong to a lifted knee. Use the connected
        # figure's center instead, so a forward knee cannot drag the whole torso.
        root_x=round(f['center'][0]+cell*.055,3)
        if name=='qilin':root_x=[270,790,285,795,278,792,278,800,278,796,277,790][i]
        anchor=[root_x,y+h-1]
        if 'anchor' in f:anchor=f['anchor'];root_x=anchor[0]
        # Flight phases in the run cycle keep their authored lifted feet. The
        # baseline is shared within each painted row, not refitted to each boot.
        if name=='movement' and i>=8 or name in ['sweep','cleave','flower'] and i>=8:
            row=i//4;baseline=max(q['bounds'][1]+q['bounds'][3]-1 for q in source['frames'][row*4:row*4+4])
            anchor[1]=baseline
        body_center=hip[1]+14/scale
        # The low defensive drawings stay on the original ground without being
        # widened, flattened or resized relative to the upright head and armor.
        behind=name=='flower' and i%8 in [1,2,5] or name=='sweep' and i%8==2 or name=='martial' and i==2
        out.append(dict(id=f'{name}:{i}',sheet=key,index=i,bounds=f['bounds'],pick=f['pick'],
            anchor=[round(v,3) for v in anchor],airAnchor=[root_x,round(body_center,3)],
            origin=origin,tip=b,butt=a,scale=round(scale,8),behind=bool(behind),includesMount=name=='qilin'))
    atlases[name]=dict(key=key,width=source['width'],height=source['height'],frames=out)
    if source.get('isolatedCells'):atlases[name]['isolatedCells']=True
    runtime=master.with_suffix('.webp')
    # Keep the generated masters; the gameplay sprite is at most ~220 display
    # pixels high at 1080p, so 256px cells retain headroom without large downloads.
    if name in textures or not runtime.exists():
        image.thumbnail(tuple(source.get('runtimeMaxSize',(1024,1536) if name=='qilin' else (1024,1024))),Image.Resampling.LANCZOS)
        image.save(runtime,'WEBP',quality=83,method=4,exact=True)
    stats.append(dict(name=name,frames=len(out),masterBytes=master.stat().st_size,runtimeBytes=runtime.stat().st_size,
        transparentPixels=int((rgba[:,:,3]==0).sum()),pixels=int(rgba.shape[0]*rgba.shape[1])))
content='// Generated from complete painted sprites; regenerate with tools/compile-hero-atlases.py.\n'
content+='export const HERO_ATLASES=Object.freeze('+json.dumps(atlases,ensure_ascii=False,separators=(',',':'))+');\n'
(root/'js'/'wukong-hero-atlas.mjs').write_text(content,encoding='utf8')
(root/'assets'/'hero-whole-compiled.json').write_text(json.dumps({'frames':sum(len(a['frames']) for a in atlases.values()),'assets':stats},indent=2),encoding='utf8')
print(json.dumps({'frames':sum(len(a['frames']) for a in atlases.values()),'assets':stats},ensure_ascii=False))
