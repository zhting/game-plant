"""Original contact sounds: a short crack, body thump and damped armor ring."""
import array
import hashlib
import json
import math
from pathlib import Path
import random
import shutil
import subprocess
import wave

ROOT=Path(__file__).resolve().parents[3]
RAW=ROOT/'.playwright-mcp'/'wukong-impact-audio'
DEST=ROOT/'games'/'wukong'/'assets'/'audio'
RAW.mkdir(parents=True,exist_ok=True)
records=[]
for index,name in enumerate(['body-1','body-2','metal-1','metal-2','body-heavy','metal-heavy']):
    metal='metal' in name
    heavy='heavy' in name
    duration=.48 if metal and heavy else .31 if heavy or metal else .21
    rate=48000
    rng=random.Random(28431+index)
    samples=[]
    low=0
    phase=0
    for i in range(round(rate*duration)):
        t=i/rate
        white=rng.uniform(-1,1)
        low=.82*low+.18*white
        attack=min(1,t/.0015)
        crack=(white-low)*math.exp(-t/(.009 if metal else .014))*.62
        body=low*math.exp(-t/(.048 if heavy else .030))*2.4
        phase+=math.tau*(58 if heavy else 93)*(.62+.8*math.exp(-t*40))/rate
        thump=math.sin(phase)*math.exp(-t/(.10 if heavy else .055))*.75
        if metal:
            ring=sum(math.sin(math.tau*f*t)*a*math.exp(-t/d) for f,a,d in
                     [(790+index*13,.22,.12),(1371,.16,.095),(2237,.10,.055),(3647,.06,.034)])
        else:
            ring=math.sin(math.tau*(380+index*41)*t)*.14*math.exp(-t/.023)
        samples.append((crack+body+thump+ring)*attack*min(1,(duration-t)/.025))
    peak=max(abs(v) for v in samples)
    pcm=array.array('h',(round(v/peak*.86*32767) for v in samples))
    source=RAW/('staff-impact-'+name+'.wav')
    with wave.open(str(source),'wb') as wav:
        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(rate);wav.writeframes(pcm.tobytes())
    target=DEST/(source.stem+'.ogg')
    subprocess.run([shutil.which('ffmpeg'),'-hide_banner','-loglevel','error','-y','-i',str(source),
                    '-af','highpass=f=45,lowpass=f=11000','-c:a','libvorbis','-q:a','5',str(target)],check=True)
    records.append({'file':target.name,'duration':duration,'bytes':target.stat().st_size,
                    'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(DEST/'impact-audio-build.json').write_text(json.dumps({'source':'Original procedural project audio; seeded noise and damped resonances',
    'files':records},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(records))
