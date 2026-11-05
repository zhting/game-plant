"""Legacy v1 audio for archived demos. Current runtime uses build-natural-hero-audio.py."""
import array
import hashlib
import json
import math
from pathlib import Path
import random
import shutil
import subprocess
import wave
import zipfile

ROOT = Path(__file__).resolve().parents[3]
RAW = ROOT / '.playwright-mcp' / 'wukong-hero-audio'
DEST = ROOT / 'games' / 'wukong' / 'assets' / 'audio'
RAW.mkdir(parents=True, exist_ok=True)
DEST.mkdir(parents=True, exist_ok=True)
FFMPEG = shutil.which('ffmpeg')
if not FFMPEG:
    raise SystemExit('ffmpeg is required')
archive = ROOT / '.playwright-mcp' / 'wukong-voices' / 'hael-db-yelling.zip'
voices = [('3grunt3.wav', 'wukong-effort-1', .34), ('3grunt4.wav', 'wukong-effort-2', .36),
          ('3grunt5.wav', 'wukong-effort-3', .40), ('3grunt6.wav', 'wukong-battle-shout', .80)]
records = []
def encode(source, name, filters):
    target = DEST / (name + '.ogg')
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
                    '-af', filters, '-ac', '1', '-ar', '24000', '-c:a', 'libvorbis', '-q:a', '4', str(target)], check=True)
    records.append({'file': target.name, 'bytes': target.stat().st_size,
                    'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'source': str(source.relative_to(ROOT)), 'filters': filters})
with zipfile.ZipFile(archive) as pack:
    for filename, name, duration in voices:
        source = RAW / filename
        source.write_bytes(pack.read('yelling sounds/' + filename))
        fade = max(.03, duration - .05)
        filters = ('silenceremove=start_periods=1:start_duration=0.01:start_threshold=-38dB,'
                   'highpass=f=100,lowpass=f=5600,atempo=1.1,'
                   f'atrim=duration={duration},asetpts=PTS-STARTPTS,'
                   f'afade=t=in:d=0.004,afade=t=out:st={fade}:d=0.05,'
                   'loudnorm=I=-15:TP=-2:LRA=7')
        encode(source, name, filters)

def pulse(u, start, length):
    v = (u - start) / length
    return math.sin(math.pi * v) ** 1.15 if 0 < v < 1 else 0
for index, (name, duration) in enumerate([('swing', .23), ('heavy', .36), ('spin', .46), ('qi', .48),
                                         ('ultimate', .82), ('charge', .23), ('land', .27)]):
    rng = random.Random(4107 + index)
    samples, low, phase = [], 0.0, 0.0
    rate = 24000
    for i in range(round(rate * duration)):
        t, u = i / rate, i / rate / duration
        white = rng.uniform(-1, 1)
        low = low * .78 + white * .22
        hiss = white - low
        env = pulse(u, 0, 1)
        if name == 'spin':
            env = sum(pulse(u, x, .40) for x in [-.08, .27, .62]) * .7
        frequency = {'swing': 280, 'heavy': 135, 'spin': 240, 'qi': 380,
                     'ultimate': 105, 'charge': 440, 'land': 95}[name]
        frequency *= (1.7 - u) if name != 'charge' else (.6 + u * 2.3)
        phase += math.tau * frequency / rate
        bass = math.sin(phase) * math.exp(-u * (4 if name == 'land' else 1.4))
        value = env * (.6 * hiss + .25 * low + .16 * bass)
        if name in ('heavy', 'ultimate', 'land'):
            value += .43 * bass * min(1, u * 40) * math.exp(-u * 3)
            value += .12 * math.sin(math.tau * 1380 * t) * math.exp(-u * 13)
        if name in ('charge', 'qi'):
            value += env * (.16 * math.sin(phase * 2) + .1 * math.sin(phase * 3))
        samples.append(value)
    peak = max(abs(v) for v in samples) or 1
    pcm = array.array('h', (round(max(-1, min(1, v / peak * .82)) * 32767) for v in samples))
    source = RAW / ('staff-' + name + '.wav')
    with wave.open(str(source), 'wb') as wav:
        wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(rate); wav.writeframes(pcm.tobytes())
    encode(source, 'staff-' + name, 'highpass=f=65,lowpass=f=7500,afade=t=in:d=0.003,alimiter=limit=0.88:level=0')

(DEST / 'hero-audio-build.json').write_text(json.dumps({'voicesSource': 'https://opengameart.org/content/male-gruntyelling-sounds',
    'voiceAuthor': 'HaelDB', 'voiceLicense': 'CC0 1.0', 'sfx': 'Procedural, original project code with seeded noise and resonant tones',
    'files': records, 'totalBytes': sum(r['bytes'] for r in records)}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'files': len(records), 'totalBytes': sum(r['bytes'] for r in records)}, ensure_ascii=False))
