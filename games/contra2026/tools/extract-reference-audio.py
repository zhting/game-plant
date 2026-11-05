"""Extract the supplied reference video's title, opening and first two stages."""
import argparse
import json
import subprocess
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('source',nargs='?',default='H:/download/videoplayback.mp4')
args=parser.parse_args()
source=Path(args.source).resolve()
root=Path(__file__).resolve().parents[1]
output=root/'assets'/'audio'
output.mkdir(parents=True,exist_ok=True)
tracks=[('title',0,5.2,False),('opening',5.25,15.97369614512471,True),('stage1',48,51.74240362811789,True),
        ('stage2',172,19.169625,True),('stage2boss',318,11.18225,True)]
records=[]
for key,start,duration,loop in tracks:
    destination=output/('reference-stage2-boss.ogg' if key=='stage2boss' else f'reference-{key}.ogg')
    lra=11 if key.startswith('stage2') else 7
    filters=f'loudnorm=I=-18:TP=-1.5:LRA={lra},afade=t=in:d=0.004,afade=t=out:st={duration-.004}:d=0.004'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(start),'-i',str(source),'-t',str(duration),'-vn',
      '-af',filters,'-ar','48000','-ac','2','-c:a','libopus','-b:a','96k','-map_metadata','-1',str(destination)],check=True)
    records.append({'key':key,'file':f'../assets/audio/{destination.name}','sourceStart':start,'duration':duration,'loop':loop})
    print(f'{key}: {start:.3f}–{start+duration:.3f}s -> {destination}')
manifest={'source':str(source),'processing':'FFmpeg, Opus 96kbps stereo / 48kHz, loudness target -18 LUFS; 4ms edge fades',
 'notes':['Title ends before the video cuts to its author-created opening at 5.205 seconds.',
          'Loop periods measured from repeated spectral phrases in the supplied video, including stage-two corridor and boss themes.',
          'These are extracts of the supplied mixed recording, not separate original soundtrack stems.'],
 'tracks':records}
(root/'design'/'reference-audio.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
