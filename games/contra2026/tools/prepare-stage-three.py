"""Prepare the stage-three guardian and soundtrack from the supplied references."""
import argparse
from pathlib import Path
import subprocess
from PIL import Image

parser=argparse.ArgumentParser()
parser.add_argument('--video',type=Path)
parser.add_argument('--guardian',type=Path)
parser.add_argument('--wreck',type=Path)
parser.add_argument('--guardian-hd',type=Path)
parser.add_argument('--wreck-hd',type=Path)
parser.add_argument('--arm-kit',type=Path)
parser.add_argument('--ledge',type=Path)
parser.add_argument('--waterfall',type=Path)
parser.add_argument('--boulders',type=Path)
parser.add_argument('--floating-stone',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
for source,name in [(args.guardian,'waterfall-guardian.webp'),(args.wreck,'waterfall-guardian-wreck.webp'),(args.guardian_hd,'waterfall-guardian-hd.webp'),(args.wreck_hd,'waterfall-guardian-hd-wreck.webp'),(args.arm_kit,'guardian-arm-kit.webp'),(args.ledge,'mossy-rock-ledge.webp'),(args.waterfall,'waterfall-layers.webp'),(args.boulders,'boulder-turns.webp'),(args.floating_stone,'floating-stone.webp')]:
    if not source:continue
    output=root/'assets/stage3'/name
    output.parent.mkdir(parents=True,exist_ok=True)
    with Image.open(source) as image:
        quality={'waterfall-guardian-hd.webp':96,'waterfall-guardian-hd-wreck.webp':96,'mossy-rock-ledge.webp':94,'waterfall-layers.webp':90,'boulder-turns.webp':92,'floating-stone.webp':94}.get(name)
        image.save(output,'WEBP',lossless=quality is None,quality=quality or 94,method=6,exact=True)
    print(output,output.stat().st_size,'bytes; original alpha preserved')
if args.video:
    output=root/'assets/audio/reference-stage3.ogg'
    duration=31.94875
    filters=f'loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:d=0.004,afade=t=out:st={duration-.004}:d=0.004'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss','398','-i',str(args.video),'-t',str(duration),'-vn',
        '-af',filters,'-ar','48000','-ac','2','-c:a','libopus','-b:a','96k','-map_metadata','-1',str(output)],check=True)
    print(output,output.stat().st_size,'bytes; 398.000–429.94875s from supplied recording')
