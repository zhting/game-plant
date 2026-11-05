"""Reproduce natural-v2 staff and legacy synthetic calls; user-v3 voices use build-user-hero-calls.py."""
import argparse
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
import urllib.request
import urllib.parse

ROOT=Path(__file__).resolve().parents[3]
RAW=ROOT/'.playwright-mcp'/'wukong-natural-audio'
DEST=ROOT/'games'/'wukong'/'assets'/'audio'
RAW.mkdir(parents=True,exist_ok=True)
DEST.mkdir(parents=True,exist_ok=True)
FFMPEG=shutil.which('ffmpeg')
SOURCES=[
    ('thin','Dalesome','https://freesound.org/people/Dalesome/sounds/352719/'),
    ('soft','HoloDOOMy','https://freesound.org/people/HoloDOOMy/sounds/810065/'),
    ('short','Sadiquecat','https://freesound.org/people/Sadiquecat/sounds/802458/'),
    ('bamboo','Sadiquecat','https://freesound.org/people/Sadiquecat/sounds/855704/'),
]
CALLS=[('call-1','看棒！'),('call-2','哪里跑！'),('call-3','嘿！'),('call-4','吃俺老孙一棒！')]

def fetch():
    manifest=[]
    for key,author,page in SOURCES:
        cached=RAW/(key+'.source.json')
        if cached.exists():
            record=json.loads(cached.read_text(encoding='utf-8'))
            if (RAW/record['file']).exists():
                manifest.append(record)
                continue
        request=urllib.request.Request(page,headers={'User-Agent':'WukongGameAudio/1.0'})
        content=html.unescape(urllib.request.urlopen(request,timeout=15).read().decode()).replace('\\/','/')
        urls=sorted(set(re.findall(r'https://cdn\.freesound\.org/previews/[^\s"\'<>\\]+',content)))
        choices=[u for u in urls if u.endswith('-hq.mp3')]
        if not choices:
            raise RuntimeError('No public high-quality preview on '+page)
        preview=choices[0]
        target=RAW/(key+Path(urllib.parse.urlparse(preview).path).suffix)
        try:
            target.write_bytes(urllib.request.urlopen(preview,timeout=20).read())
        except (OSError,urllib.error.URLError):
            subprocess.run(['curl.exe','--fail','--location','--retry','1','--max-time','25','--output',str(target),preview],check=True,capture_output=True)
        record={'key':key,'author':author,'page':page,'preview':preview,'license':'CC0 1.0','file':target.name}
        cached.write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
        manifest.append(record)
    (RAW/'sources.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    return manifest

def speech():
    subprocess.run(['powershell.exe','-NoProfile','-File',str(Path(__file__).with_name('build-character-calls.ps1'))],check=True)

def encode(source,name,filters,records,**info):
    target=DEST/(name+'.ogg')
    subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-i',str(source),'-af',filters,
        '-ac','1','-ar','24000','-c:a','libvorbis','-q:a','4',str(target)],check=True)
    records.append({'file':target.name,'source':str(source.relative_to(ROOT)),'filters':filters,
        'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),**info})

def build(sources):
    records=[]
    specs=[('thin','staff-air-1-v2',1.5,.38),('soft','staff-air-2-v2',1.15,.32),
           ('short','staff-air-3-v2',1,.27),('bamboo','staff-air-heavy-v2',1.4,.46),
           ('thin','staff-air-spin-v2',1.15,.5)]
    by_key={r['key']:r for r in sources}
    for key,name,tempo,duration in specs:
        r=by_key[key]
        filters=(f'highpass=f=130,lowpass=f=6500,atempo={tempo},atrim=duration={duration},'
                 'afade=t=in:d=0.005,afade=t=out:st='+str(duration-.025)+':d=0.025,loudnorm=I=-20:TP=-4:LRA=7')
        encode(RAW/r['file'],name,filters,records,author=r['author'],license=r['license'],page=r['page'])
    for key,text in CALLS:
        encode(RAW/(key+'.wav'),'wukong-'+key+'-v2',
               'silenceremove=start_periods=1:start_duration=0.005:start_threshold=-45dB,aresample=24000,asetrate=26400,aresample=24000,highpass=f=90,lowpass=f=7500,afade=t=in:d=0.004,loudnorm=I=-16:TP=-2:LRA=7',
               records,text=text,voice='Microsoft Kangkang',rate='SAPI 2',pitch='+10%')
    report={'version':'natural-v2','sourceNotes':'Public CC0 preview files; generic Chinese local voice, no actor imitation',
            'sources':sources,'files':records,'totalNewBytes':sum(r['bytes'] for r in records)}
    (DEST/'natural-hero-audio-build.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'files':len(records),'bytes':report['totalNewBytes'],'lines':[t for _,t in CALLS]},ensure_ascii=False))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--offline',action='store_true');args=parser.parse_args()
    if args.offline:
        sources=json.loads((RAW/'sources.json').read_text(encoding='utf-8'))
    else:
        speech();sources=fetch()
    build(sources)
