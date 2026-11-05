"""Cut the user's four callouts; preserve their original pitch and performance."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[3]
DEST = ROOT / 'games/wukong/assets/audio'
SOURCE = Path(__file__).with_name('sources') / 'wukong-calls-user-20261026.mp3'
VERSION = 'user-voice-v3'
# The submitted compilation is ordered: short effort, 看棒, 哪里跑, full shout.
# Preserve short pauses inside each phrase and a little room around its ends.
CALLS = [
    ('effort1', '看棒！', 1.08, 1.86),
    ('effort2', '哪里跑！', 2.74, 3.81),
    ('effort3', '嘿！', 0.0, 0.32),
    ('shout', '吃俺老孙一棒！', 4.55, 6.32),
]


def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True, encoding='utf-8').stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, help='User-supplied compilation to cache for reproducible cuts')
    args = parser.parse_args()
    if args.source:
        SOURCE.parent.mkdir(parents=True, exist_ok=True)
        if args.source.resolve() != SOURCE.resolve():
            shutil.copy2(args.source, SOURCE)
    if not SOURCE.exists():
        parser.error('Use --source to provide the original compilation once')
    ffmpeg = shutil.which('ffmpeg')
    ffprobe = shutil.which('ffprobe')
    if not ffmpeg or not ffprobe:
        parser.error('ffmpeg and ffprobe are required')
    source_duration = float(json.loads(run([ffprobe, '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', str(SOURCE)]))['format']['duration'])
    records = []
    for index, (key, text, start, end) in enumerate(CALLS, 1):
        if end > source_duration:
            raise ValueError('Compilation is shorter than the selected phrase')
        duration = end - start
        # EBU loudness measurement needs a 400ms window, including for the tiny effort clip.
        # Pad only for measurement/normalization, then remove that silence from the output.
        base = f'atrim=start={start}:end={end},asetpts=PTS-STARTPTS,afade=t=in:d=0.003,afade=t=out:st={duration-0.008:.3f}:d=0.008,apad=whole_dur=0.5'
        measured = subprocess.run([ffmpeg, '-hide_banner', '-nostdin', '-i', str(SOURCE), '-af', base + ',loudnorm=I=-16:TP=-2:LRA=7:print_format=json', '-f', 'null', '-'], check=True, capture_output=True, text=True, encoding='utf-8').stderr
        stats = json.loads(measured[measured.rfind('{'):measured.rfind('}') + 1])
        norm = ('loudnorm=I=-16:TP=-2:LRA=7:linear=true:'
                f'measured_I={stats["input_i"]}:measured_TP={stats["input_tp"]}:'
                f'measured_LRA={stats["input_lra"]}:measured_thresh={stats["input_thresh"]}:offset={stats["target_offset"]}')
        filters = base + ',' + norm + f',atrim=duration={duration:.3f}'
        target = DEST / f'wukong-call-{index}-user-v3.ogg'
        run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', str(SOURCE), '-af', filters,
             '-map_metadata', '-1', '-ac', '1', '-ar', '24000', '-c:a', 'libvorbis', '-q:a', '4', str(target)])
        records.append({'key': key, 'text': text, 'file': target.name, 'start': start, 'end': end, 'duration': round(duration, 3),
                        'filters': filters, 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
    manifest = {'version': VERSION, 'sourceKind': 'user-supplied audio', 'submittedFile': '合集.mp3',
                'source': SOURCE.relative_to(ROOT).as_posix(), 'sourceDuration': source_duration,
                'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                'processing': 'Phrase cuts, 3/8ms edge fades, two-pass loudness normalization; original pitch and speed preserved',
                'files': records, 'totalVoiceBytes': sum(r['bytes'] for r in records)}
    (DEST / 'user-hero-voice-build.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest, ensure_ascii=True))


if __name__ == '__main__':
    main()
