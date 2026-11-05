"""Read-only sprite measurements; generated paintings remain unchanged."""
import argparse, json, math
from pathlib import Path
from collections import deque
import numpy as np
from PIL import Image

def components(mask):
    h,w=mask.shape; labels=np.zeros((h,w),np.int32); records=[]
    for yy,xx in zip(*np.where(mask)):
        if labels[yy,xx]: continue
        label=len(records)+1; queue=deque([(int(xx),int(yy))]); labels[yy,xx]=label
        area=0; left=right=int(xx); top=bottom=int(yy); sx=sy=0
        while queue:
            x,y=queue.popleft();area+=1;sx+=x;sy+=y
            left=min(left,x);right=max(right,x);top=min(top,y);bottom=max(bottom,y)
            for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0<=nx<w and 0<=ny<h and mask[ny,nx] and not labels[ny,nx]:
                    labels[ny,nx]=label;queue.append((nx,ny))
        records.append(dict(label=label,area=area,bounds=[left,top,right-left+1,bottom-top+1],center=[sx/area,sy/area]))
    return labels,records

ANGLES={
 'movement':[-.56]*16,
 'mobility':[-.12,-.35,-.42,-.85,-.30,-.33,-.10,-.02,-.03,-.38,.52,-.50],
 'sweep':[-.61,.44,.15,.08,.04,.45,-.40,-.61,-.60,.36,.27,-.60,.03,.70,-.40,-.61],
 'cleave':[-.66,-.72,.37,.51,.70,.54,-.65,-.65,-.55,-.65,.28,.31,.65,.55,-.60,-.65],
 'flower':[-.56,.35,.15,.09,-.03,-.37,-.84,-.61,-.60,.44,.17,.19,-.03,-.38,-.80,-.56],
 'extra':[-.54,-.95,-.30,-.14,-.087,-.40,-.47,-.73,-.72,.32,-.50,-.19,-.10,0,-.51,-.82],
 'uppercut':[-.56,.40,-1.14,-math.pi/2,-math.pi/2,.40,-.58,-.55,-.62,-.36,1.40,-.05,-math.pi/2,.40,-.34,-.60],
 'advance':[-.50,.48,.08,0,-.03,.4,-.5,-.5],
 'blossom':[-.42,.58,1.5,.02,1.4,-.35,-.5,-.43],
 'cyclone':[-.24,.30,0,.39,0,.29,.17,-.27],
 'qilin':[-.63,-.58,-.49,-.54,-.43,.29,-.24,.40,.54,.55,-.76,-.61],
 'low':[-.74,0,0,0,0,0,-.72,-.70],
 'martial':[-.37,.52,0,.38,0,-.38,0,-.42]
}

# In the fully extended forward paintings the short visible section begins
# beyond the hands. The monkey tail/waist armor otherwise wins the warm-edge
# Hough vote. Register these two drawings against their visible shaft center.
SHAFT_CALIBRATION={
 'martial':{
  3:{'ends':[[974,455.3],[1215,573]],'origin':[1038,486.55]},
  4:{'ends':[[94,837],[641,829]],'origin':[335,833.4753]},
  5:{'ends':[[953,727],[1220,620]],'origin':[1022,699.3483]}
 },
 'low':{
  1:{'ends':[[352,351],[702,351]],'origin':[528,351]},
  2:{'ends':[[754,423],[1107,423]],'origin':[950,423]},
  3:{'ends':[[1198,423],[1517,423]],'origin':[1395,423]},
  4:{'ends':[[108,861],[445,861]],'origin':[296,861]},
  5:{'ends':[[451,811],[800,811]],'origin':[619,811]}
 },
 'advance':{
  3:{'ends':[[1000,474],[1243,474]],'origin':[1022,474]},
  4:{'ends':[[402,755],[780,734]],'origin':[435,753.1667]}
 },
 'qilin':{
  7:{'ends':[[810,889],[1004,967]],'origin':[840,901.0619]},
  8:{'ends':[[328,1137],[480,1235]],'origin':[355,1154.4079]},
  9:{'ends':[[828,1140],[994,1228]],'origin':[860,1156.9639]}
 }
}
def shaft(rgba,mask,expected,search=8):
    # Hough voting on long, warm-colored opaque edges. Armor and plumes are curved;
    # the staff has two uninterrupted straight contours beyond the gripping hands.
    rgb=rgba[:,:,:3].astype(float);r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
    interior=mask.copy();interior[1:-1,1:-1]&=mask[:-2,1:-1]&mask[2:,1:-1]&mask[1:-1,:-2]&mask[1:-1,2:]
    edge=mask&~interior&(r>60)&(r>g*1.05)&(g>b*1.25)
    y,x=np.where(edge)
    best=None
    center=round(math.degrees(expected))
    for degrees in range(center-search,center+search+1):
        theta=math.radians(degrees);dx,dy=math.cos(theta),math.sin(theta)
        rho=-x*dy+y*dx;offset=int(np.ceil(max(rgba.shape[:2])*1.5))
        bins=np.rint(rho).astype(int)+offset
        votes=np.bincount(bins,minlength=offset*2+1)
        for peak in np.argpartition(votes,-2)[-2:]:
            use=np.abs(rho-(peak-offset))<2
            if use.sum()<25:continue
            along=x[use]*dx+y[use]*dy;lo,hi=np.percentile(along,[1,99]);length=hi-lo
            score=float(use.sum())*min(length/140,1.6)
            if best is None or score>best[0]:
                rr=peak-offset;best=(score,dict(angle=theta,ends=[[lo*dx-rr*dy,lo*dy+rr*dx],[hi*dx-rr*dy,hi*dy+rr*dx]],votes=int(use.sum()),length=float(length)))
    return best[1] if best else None

def measure(file,rows,columns=4):
    image=Image.open(file).convert('RGBA');rgba=np.array(image);h,w=rgba.shape[:2]
    labels,found=components(rgba[:,:,3]>96)
    large=[c for c in found if c['area']>1200]
    slots={}
    for c in large:
        col=max(0,min(columns-1,int(c['center'][0]/(w/columns))))
        row=max(0,min(rows-1,int(c['center'][1]/(h/rows))))
        slot=row*columns+col
        if slot in slots:raise ValueError(f'overlapping complete sprites in {file}: cell {slot}')
        slots[slot]=c
    if len(slots)!=rows*columns:raise ValueError(f'{file}: expected {rows*columns} complete sprites, found {len(slots)}; areas {[c["area"] for c in large]}')
    frames=[]
    for slot in range(rows*columns):
        c=slots[slot];x,y,sw,sh=c['bounds'];mask=labels[y:y+sh,x:x+sw]==c['label']
        crop=rgba[y:y+sh,x:x+sw];rgb=crop[:,:,:3].astype(float);r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
        pants=mask&(b>r*1.15)&(g>r*1.15)&(b>20)
        py,px=np.where(pants)
        if len(px):
            upper=py<=np.percentile(py,35);hip=[float(np.median(px[upper])+x),float(np.percentile(py,15)+y)]
        else:hip=[c['center'][0]+sw*.08,y+sh*.68]
        name=file.stem.replace('hero-whole-','')
        pole=shaft(crop,mask,ANGLES[name][slot],2 if name in ['advance','blossom','cyclone','qilin'] else 8)
        if pole:
            pole['ends']=[[round(px+x,2),round(py+y,2)] for px,py in pole['ends']]
            pole={k:round(v,4) if isinstance(v,float) else v for k,v in pole.items()}
            a=np.array(pole['ends'][0]);v=np.array(pole['ends'][1])-a;length=np.linalg.norm(v);axis=v/length
            skin=mask&(r>110)&(g>65)&(r>g*1.12)&(b>g*.42)&(b<g*1.15)
            sy,sx=np.where(skin);points=np.stack([sx+x,sy+y],axis=1) if len(sx) else np.empty((0,2))
            dist=np.abs((points-a)[:,0]*axis[1]-(points-a)[:,1]*axis[0]);along=(points-a)@axis
            good=(dist<6)&(along>length*.22)&(along<length*.80)
            t=float(np.median(along[good])) if good.sum()>5 else float((np.array(hip)+[sw*.07,-sh*.16]-a)@axis)
            t=np.clip(t,length*.18,length*.85);origin=(a+axis*t).tolist()
        else:origin=[hip[0],hip[1]-sh*.16]
        calibrated=SHAFT_CALIBRATION.get(name,{}).get(slot)
        if calibrated:
            a,b=calibrated['ends'];pole={**pole,'ends':[a,b],'angle':math.atan2(b[1]-a[1],b[0]-a[0]),'length':math.dist(a,b),'calibrated':True}
            origin=calibrated['origin']
        frames.append({**c,'index':slot,'pick':[round(c['center'][0]),round(c['center'][1])],'hip':[round(v,2) for v in hip],'origin':[round(v,2) for v in origin],'shaft':pole})
    return {'path':str(file),'width':w,'height':h,'rows':rows,'columns':columns,'frames':frames}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('file',type=Path);parser.add_argument('--rows',type=int,default=4);parser.add_argument('--columns',type=int,default=4)
    options=parser.parse_args();data=measure(options.file,options.rows,options.columns)
    output=options.file.with_suffix('.measure.json');output.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({'output':str(output),'size':[data['width'],data['height']],'frames':[{'i':f['index'],'bounds':f['bounds'],'pick':f['pick'],'staff':f['shaft']} for f in data['frames']]},ensure_ascii=False))
