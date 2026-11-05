"""Generate additional character lines locally from the user's supplied voice reference."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import time

ROOT=Path(__file__).resolve().parents[3]
TOOLS=Path(__file__).parent
RAW=ROOT/'.playwright-mcp/wukong-dialogue-v4'
DEST=ROOT/'games/wukong/assets/audio'
MODEL=ROOT/'.playwright-mcp/wukong-tts-model'
SOURCE=TOOLS/'sources/wukong-calls-user-20261026.mp3'
LINES=json.loads((TOOLS/'dialogue-lines.json').read_text(encoding='utf-8'))
os.environ['HF_HOME']=str(ROOT/'.playwright-mcp/wukong-tts-cache')
os.environ['HF_HUB_OFFLINE']='1'

def run(args):
    result=subprocess.run(args,check=True,capture_output=True,text=True,encoding='utf-8')
    return result.stdout

def synthesize(keys):
    import torch
    import soundfile as sf
    from qwen_tts import Qwen3TTSModel
    torch.set_num_threads(6)
    RAW.mkdir(parents=True,exist_ok=True)
    reference=RAW/'reference.wav'
    run([shutil.which('ffmpeg'),'-hide_banner','-loglevel','error','-nostdin','-y','-i',str(SOURCE),'-ac','1','-ar','24000',str(reference)])
    print(json.dumps({'loadingModel':str(MODEL)},ensure_ascii=True),flush=True)
    model=Qwen3TTSModel.from_pretrained(str(MODEL),device_map='cuda:0',dtype=torch.bfloat16,attn_implementation='sdpa')
    prompt=model.create_voice_clone_prompt(ref_audio=str(reference),ref_text='嘿！看棒！哪里跑！吃俺老孙一棒！',x_vector_only_mode=False)
    for i,line in enumerate(LINES):
        if keys and line['key'] not in keys:
            continue
        target=RAW/(line['key']+'.wav')
        if target.exists() and not keys:
            continue
        torch.manual_seed(20261026+i)
        start=time.monotonic()
        wavs,sr=model.generate_voice_clone(text=line['text'],language='Chinese',voice_clone_prompt=prompt,
            max_new_tokens=96,do_sample=True,temperature=.7,top_p=.85,repetition_penalty=1.08)
        sf.write(str(target),wavs[0],sr)
        print(json.dumps({'key':line['key'],'text':line['text'],'sampleRate':sr,'seconds':len(wavs[0])/sr,
                          'generationSeconds':round(time.monotonic()-start,2)},ensure_ascii=True),flush=True)

def encode():
    records=[]
    ffmpeg=shutil.which('ffmpeg')
    ffprobe=shutil.which('ffprobe')
    for line in LINES:
        source=RAW/(line['key']+'.wav')
        if not source.exists():
            raise FileNotFoundError(source)
        # Trim empty leading/trailing room; preserve the reference voice's pitch and speed.
        base='silenceremove=start_periods=1:start_duration=0.01:start_threshold=-42dB,areverse,silenceremove=start_periods=1:start_duration=0.04:start_threshold=-42dB,areverse,afade=t=in:d=0.004'
        trimmed=RAW/(line['key']+'.trim.wav')
        run([ffmpeg,'-hide_banner','-loglevel','error','-nostdin','-y','-i',str(source),'-af',base,'-ar','24000',str(trimmed)])
        speech_duration=float(json.loads(run([ffprobe,'-v','error','-show_entries','format=duration','-of','json',str(trimmed)]))['format']['duration'])
        # Short shouts need padding to measure a 400ms EBU window; trim it away afterwards.
        measure='apad=whole_dur=0.5'
        measured=subprocess.run([ffmpeg,'-hide_banner','-nostdin','-i',str(trimmed),'-af',measure+',loudnorm=I=-17:TP=-2:LRA=7:print_format=json','-f','null','-'],check=True,capture_output=True,text=True,encoding='utf-8').stderr
        stats=json.loads(measured[measured.rfind('{'):measured.rfind('}')+1])
        norm=('loudnorm=I=-17:TP=-2:LRA=7:linear=true:'
            f'measured_I={stats["input_i"]}:measured_TP={stats["input_tp"]}:measured_LRA={stats["input_lra"]}:'
            f'measured_thresh={stats["input_thresh"]}:offset={stats["target_offset"]}')
        target=DEST/('wukong-'+line['key']+'-dialogue-v4.ogg')
        normalized=measure+','+norm+f',atrim=duration={speech_duration}'
        run([ffmpeg,'-hide_banner','-loglevel','error','-nostdin','-y','-i',str(trimmed),'-af',normalized,
             '-map_metadata','-1','-ac','1','-ar','24000','-c:a','libvorbis','-q:a','4',str(target)])
        duration=float(json.loads(run([ffprobe,'-v','error','-show_entries','format=duration','-of','json',str(target)]))['format']['duration'])
        if not .15<=duration<=5:
            raise ValueError(f'Unexpected line duration: {line["key"]} {duration}')
        records.append({**line,'file':target.name,'source':source.relative_to(ROOT).as_posix(),'duration':duration,
            'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'filters':base+','+normalized})
    model_info=json.loads((MODEL/'wukong-download.json').read_text(encoding='utf-8'))
    manifest={'version':'dialogue-v4','sourceKind':'local synthetic voice extension from user-provided recording',
        'reference':SOURCE.relative_to(ROOT).as_posix(),'referenceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'referenceText':'嘿！看棒！哪里跑！吃俺老孙一棒！','model':model_info,'settings':{'seed':20261026,'temperature':.7,'topP':.85,'maxNewTokens':96},
        'files':records,'newVoiceBytes':sum(r['bytes'] for r in records)}
    (DEST/'dialogue-voice-build.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    bank=[{'key':r['key'],'text':r['text'],'families':r['families'],'url':'/games/wukong/assets/audio/'+r['file']} for r in records]
    (ROOT/'games/wukong/js/wukong-dialogue-bank.mjs').write_text('// Generated from tools/dialogue-lines.json by build-dialogue-voices.py.\nexport const EXTRA_HERO_VOICES=Object.freeze('+json.dumps(bank,ensure_ascii=False,indent=2)+');\n',encoding='utf-8')
    print(json.dumps({'encoded':len(records),'newVoiceBytes':manifest['newVoiceBytes']},ensure_ascii=True),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline',action='store_true',help='Only compress already-generated raw audio')
    parser.add_argument('--keys',nargs='*',help='Regenerate selected lines')
    parser.add_argument('--generate-only',action='store_true')
    args=parser.parse_args()
    if not args.offline:
        synthesize(args.keys)
    if not args.generate_only:
        encode()
