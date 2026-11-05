"""Original 40-second pentatonic march. Deterministic synthesis, no samples."""
from pathlib import Path
import math,subprocess,wave
import numpy as np
RATE=24000;beat=.5;duration=40
audio=np.zeros(int(RATE*duration),dtype=np.float64);rng=np.random.default_rng(20261030)
def note(start,midi,length,amp=.1):
    n=int(length*RATE);t=np.arange(n)/RATE;f=440*2**((midi-69)/12)
    sound=(np.sin(2*math.pi*f*t)+.3*np.sin(2*math.pi*f*2*t)+.14*np.sin(2*math.pi*f*3*t))*np.minimum(1,t/.008)*np.exp(-t*4/length)*amp
    pos=int(start*RATE);count=min(n,len(audio)-pos)
    if count>0:audio[pos:pos+count]+=sound[:count]
melody=[62,65,67,69,72,69,67,65,62,67,69,74,72,69,67,65]
for i in range(80):
    start=i*beat;note(start,[38,38,41,43][i//8%4],.45,.12)
    if i%2==0:note(start,melody[(i//2)%16],.8,.075)
    n=int(.24*RATE);t=np.arange(n)/RATE
    drum=np.sin(2*math.pi*(68*t-40*t*t))*np.exp(-t*24)*(.13 if i%4==0 else .06)
    pos=int(start*RATE);audio[pos:pos+n]+=drum
    if i%4 in [1,3]:
        n=int(.1*RATE);t=np.arange(n)/RATE;audio[pos:pos+n]+=(rng.standard_normal(n)*np.exp(-t*55))*.035
audio=np.tanh(audio*1.6)*.8
root=Path(__file__).resolve().parents[1];scratch=root.parents[1]/'.playwright-mcp/wukong-stage-02';scratch.mkdir(exist_ok=True)
wav=scratch/'south-gate-march.wav'
with wave.open(str(wav),'wb') as out:out.setnchannels(1);out.setsampwidth(2);out.setframerate(RATE);out.writeframes((audio*32767).astype('<i2').tobytes())
out=root/'assets/stage-02/south-gate-march.ogg'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-c:a','libvorbis','-q:a','4',str(out)],check=True)
print(str(out),out.stat().st_size)
