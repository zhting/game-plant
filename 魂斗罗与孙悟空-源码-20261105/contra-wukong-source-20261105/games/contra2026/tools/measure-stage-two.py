"""Read-only alpha measurements for the stage-two production sprite atlases."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import label,find_objects

root=Path(__file__).resolve().parents[1]
def components(file):
    im=Image.open(root/'assets'/'stage2'/file)
    alpha=np.array(im)[:,:,3];labels,_=label(alpha>20)
    boxes=[]
    for i,r in enumerate(find_objects(labels)):
        if r and np.count_nonzero(labels[r]==i+1)>800:
            boxes.append([r[1].start,r[0].start,r[1].stop,r[0].stop])
    return im,alpha,boxes

actors={}
poses=['idle','prone','roll']+[f'run{i}' for i in range(8)]+['dead']
for role,file in [('blue','commando-back-blue.png'),('red','commando-back-red.png'),('enemy','soldier-front.png')]:
    im,alpha,boxes=components(file);assert len(boxes)==12,(file,len(boxes))
    boxes.sort(key=lambda b:b[1]);boxes=sum([sorted(boxes[i:i+3]) for i in range(0,12,3)],[])
    height=boxes[0][3]-boxes[0][1]
    baselines=[max(b[3] for b in boxes[i:i+3]) for i in range(0,12,3)]
    frames={}
    for index,(pose,(x,y,right,bottom)) in enumerate(zip(poses,boxes)):
        waist=y+height*(.48 if role=='enemy' or pose=='idle' else .42)
        occupied=np.where(alpha[int(waist):int(waist)+3,x:right]>100)[1]
        anchor=x+float(np.mean(occupied)) if len(occupied) else (x+right)/2
        if pose in ['prone','roll','dead']:anchor=(x+right)/2
        baseline=baselines[index//3] if pose.startswith('run') or pose=='idle' else bottom
        frames[pose]={'bounds':[x,y,right-x,bottom-y],'anchor':[round(anchor,2),baseline],'waist':round(waist,2)}
    actors[role]={'key':'rear'+role.title() if role!='enemy' else 'frontEnemy','size':list(im.size),
        'scale':(32 if role=='enemy' else 38)/height,'frames':frames}

im,alpha,boxes=components('mechanisms-hd.png');assert len(boxes)==8,len(boxes)
boxes.sort(key=lambda b:b[1]);boxes=sorted(boxes[:4])+sorted(boxes[4:])
kit={'size':list(im.size),'frames':{key:[x,y,r-x,b-y] for key,(x,y,r,b) in zip(['gun','gunBroken','core','coreBroken','boss','bossBroken','mine','post'],boxes)}}
target=root/'js'/'stage-two-atlas.mjs'
target.write_text('// Native generated RGBA bounds; PNG pixels are never resampled by this tool.\nexport const BASE_ACTORS='+json.dumps(actors,separators=(',',':'))+';\nexport const BASE_KIT='+json.dumps(kit,separators=(',',':'))+';\n',encoding='utf-8')
print(json.dumps({'actors':{k:v['size'] for k,v in actors.items()},'kit':kit}))
