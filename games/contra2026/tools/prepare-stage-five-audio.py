"""Extract the snowfield theme from the user's original mixed game recording."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

parser=argparse.ArgumentParser()
parser.add_argument('--video',type=Path,default=Path('H:/download/videoplayback.mp4'))
parser.add_argument('--mp3',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
start,duration=709,31.94875
filters=f'loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:d=0.004,afade=t=out:st={duration-.004}:d=0.004'
destination=root/'assets/audio/reference-stage5.ogg'
common=['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(start),'-i',str(args.video),'-t',str(duration),'-vn','-af',filters,'-ar','48000','-ac','2','-map_metadata','-1']
subprocess.run(common+['-c:a','libopus','-b:a','96k',str(destination)],check=True)
if args.mp3:
    args.mp3.parent.mkdir(parents=True,exist_ok=True)
    subprocess.run(common+['-c:a','libmp3lame','-b:a','192k','-metadata','title=魂斗罗第五关·极地冰原（原视频提取）',str(args.mp3)],check=True)
metadata={'source':str(args.video),'sourceStart':start,'duration':duration,'measuredSpectralRepeatSeconds':31.952,
          'processing':'FFmpeg Opus 96kbps stereo / 48kHz, -18 LUFS, 4ms edge fades; downloadable MP3 192kbps',
          'notes':['The supplied video enters the snowfield around 705.5 seconds.',
                   'The soundtrack is extracted from a mixed gameplay recording and includes original game sound effects.',
                   'One complete repeated musical phrase is used; stage five alone requests this file.'],
          'file':'../assets/audio/reference-stage5.ogg','bytes':destination.stat().st_size,
          'sha256':hashlib.sha256(destination.read_bytes()).hexdigest()}
(root/'design/stage-05-reference-audio.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(metadata,ensure_ascii=False))
