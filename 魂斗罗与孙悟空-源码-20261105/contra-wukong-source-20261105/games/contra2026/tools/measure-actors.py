"""Measure generated RGBA sprites without resampling or modifying the source PNGs."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

root=Path(__file__).resolve().parents[1]
poses=['idle','up','diagonalUp','diagonalDown','prone','roll']+[f'run{i}' for i in range(6)]
sheets={}
for role,file in [('red','commando-red-hd.png'),('blue','commando-blue-hd.png'),('enemy','soldier-hd.png')]:
    image=Image.open(root/'assets'/'stage1'/file)
    alpha=np.array(image)[:,:,3]
    labels,_=label(alpha>20)
    components=[]
    for index,region in enumerate(find_objects(labels)):
        if region and np.count_nonzero(labels[region]==index+1)>1000:
            components.append([region[1].start,region[0].start,region[1].stop,region[0].stop])
    assert len(components)==12,(role,len(components))
    components.sort(key=lambda p:p[1])
    boxes=sum([sorted(components[i:i+3]) for i in range(0,12,3)],[])
    idle_height=boxes[0][3]-boxes[0][1]
    baselines=[max(b[3] for b in boxes[i:i+3]) for i in range(0,12,3)]
    waist={'red':[260,250,260,610],'blue':[270,260,270,630],'enemy':[270,265,270,636]}[role]
    frames={}
    for index,(pose,box) in enumerate(zip(poses,boxes)):
        x,y,right,bottom=box
        row=index//3
        if index==0 or index>=6:
            _,xs=np.where(alpha[y:y+max(8,int((bottom-y)*.05)),x:right]>100)
            anchor_x=x+float(np.mean(xs))-idle_height*(.10 if index==0 else .145)
        else:
            occupied=np.any(alpha[bottom-20:bottom,x:right]>64,axis=0)
            foot_labels,_=label(occupied)
            feet=[(r[0].start+r[0].stop)/2+x for r in find_objects(foot_labels) if r and r[0].stop-r[0].start>8]
            anchor_x=float(np.mean(feet)) if feet else (x+right)/2
        baseline=baselines[row] if index>=6 or index<3 else bottom
        if pose=='prone':anchor_x=(x+right)/2
        if pose=='roll':anchor_x=(x+right)/2
        hip_y=waist[index] if index<4 else y+idle_height*.52
        frames[pose]={'bounds':[x,y,right-x,bottom-y],'anchor':[round(anchor_x,2),baseline],'waist':round(hip_y,2)}
    sheets[role]={'key':'actor'+role.title(),'url':'/games/contra2026/assets/stage1/'+file,'size':list(image.size),'scale':30/idle_height,'frames':frames}
target=root/'js'/'hd-actor-atlas.mjs'
target.write_text('// Measured native RGBA bounds; runtime never enlarges source pixels before caching.\nexport const HD_ACTORS = '+json.dumps(sheets,indent=2)+';\n',encoding='utf-8')
print(target)
