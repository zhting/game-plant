"""Measure alpha bounds/registration without changing generated art pixels."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

root=Path(__file__).resolve().parents[1]
sheets={}
for role in ['red','blue','enemy']:
    file=f'commando-run-{role}-hd.png'
    image=Image.open(root/'assets'/'stage1'/file)
    alpha=np.array(image)[:,:,3]
    labels,_=label(alpha>20)
    boxes=[]
    component_ids={}
    for index,r in enumerate(find_objects(labels)):
        if r and np.count_nonzero(labels[r]==index+1)>1000:
            box=[r[1].start,r[0].start,r[1].stop,r[0].stop]
            boxes.append(box);component_ids[tuple(box)]=index+1
    assert len(boxes)==12,(role,len(boxes))
    boxes.sort(key=lambda p:p[1])
    boxes=sum([sorted(boxes[i:i+3]) for i in range(0,12,3)],[])
    height=boxes[0][3]-boxes[0][1]
    baselines=[max(b[3] for b in boxes[i:i+3]) for i in range(0,12,3)]
    frames={}
    for index,(x,y,right,bottom) in enumerate(boxes):
        _,xs=np.where(alpha[y+3:y+16,x:right]>100)
        # Head is registered over the pelvis; extreme boot reach cannot shift the body.
        anchor=x+float(np.mean(xs))-height*.145
        frames[f'run{index}']={'bounds':[x,y,right-x,bottom-y],
            'anchor':[round(anchor,2),baselines[index//3]],'waist':round(y+height*.48,2)}
        owned=labels[y:bottom,x:right]==component_ids[(x,y,right,bottom)]
        foreign=(alpha[y:bottom,x:right]>20)&~owned
        if np.any(foreign):
            # Overlapping bounding rectangles can contain a neighbor's boot or muzzle.
            # A runtime vector clip keeps only this sprite; original PNG stays untouched.
            left=[];right_edge=[]
            for row in range(bottom-y):
                occupied=np.flatnonzero(owned[row])
                if occupied.size:
                    left.extend([[int(occupied[0]),row],[int(occupied[0]),row+1]])
                    right_edge.extend([[int(occupied[-1])+1,row],[int(occupied[-1])+1,row+1]])
            def simplify(points):
                result=[]
                for point in points:
                    while len(result)>1 and (result[-1][0]-result[-2][0])*(point[1]-result[-1][1])==(result[-1][1]-result[-2][1])*(point[0]-result[-1][0]):
                        result.pop()
                    result.append(point)
                return result
            frames[f'run{index}']['clip']=simplify(left)+simplify(right_edge[::-1])
    sheets[role]={'key':'run'+role.title(),'url':'/games/contra2026/assets/stage1/'+file,
        'size':list(image.size),'scale':30/height,'frames':frames}
(root/'js'/'hd-run-atlas.mjs').write_text('// Native twelve-pose running atlases, alpha measured without resampling.\nexport const HD_RUNS = '+json.dumps(sheets,separators=(',',':'))+';\n',encoding='utf-8')
print(json.dumps({k:{'size':v['size'],'height':v['frames']['run0']['bounds'][3]} for k,v in sheets.items()}))
