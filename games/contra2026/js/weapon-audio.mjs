export const WEAPON_SHOT_SECONDS=Object.freeze({rifle:.12,machine:.075,spread:.2,laser:.17,fire:.19,homing:.24});
const TAU=Math.PI*2;

/** Local PCM, with a sharp report and a short body instead of a quiet UI beep.
 * A separate seeded noise generator keeps audio out of the game's random stream. */
export function synthesizeWeaponShot(weapon,sampleRate=48000){
  if(!Object.hasOwn(WEAPON_SHOT_SECONDS,weapon))weapon='rifle';
  const duration=WEAPON_SHOT_SECONDS[weapon],data=new Float32Array(Math.ceil(duration*sampleRate));
  let seed=0x729a13,low=0,phase=0,sum=0;
  for(let i=0;i<data.length;i++){
    const t=i/sampleRate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const white=seed/2147483648-1;low+=(1-Math.exp(-TAU*850/sampleRate))*(white-low);
    const high=white-low,attack=Math.min(1,t/.0008),tail=Math.min(1,(duration-t)/.006);
    let v;
    if(weapon==='laser'){
      phase+=TAU*(320+2250*Math.exp(-t/ .045))/sampleRate;
      v=(Math.sin(phase)+.2*Math.sin(phase*2))*.48*Math.exp(-t/.048)+high*.18*Math.exp(-t/.009);
    }else if(weapon==='fire'){
      v=low*2.1*Math.exp(-t/.065)*(.65+.35*Math.sin(TAU*61*t))+.16*high*Math.exp(-t/.025);
    }else if(weapon==='homing'){
      phase+=TAU*(180+1100*t)/sampleRate;
      v=high*.45*Math.exp(-t/.065)+Math.sin(phase)*.2*Math.exp(-t/.08)+low*1.2*Math.exp(-t/.025);
    }else{
      const machine=weapon==='machine',spread=weapon==='spread',decay=machine?.011:spread?.032:.018;
      phase+=TAU*((machine?155:spread?82:120)*Math.exp(-t/.055)+45)/sampleRate;
      v=high*.84*Math.exp(-t/decay)+low*(spread?2.2:1.3)*Math.exp(-t/(spread?.065:.032));
      v+=Math.sin(phase)*(spread?.38:.27)*Math.exp(-t/(spread?.055:.024));
      const eject=t-(machine?.022:.034);if(eject>0)v+=high*.1*Math.exp(-eject/.006);
    }
    data[i]=v*attack*tail;sum+=data[i];
  }
  // Reduce DC and keep simultaneous players below clipping at the SFX mix level.
  const mean=sum/data.length;let peak=0;
  for(let i=0;i<data.length;i++){data[i]-=mean*Math.sin(Math.PI*i/(data.length-1));peak=Math.max(peak,Math.abs(data[i]));}
  const gain=.82/Math.max(peak,.001);for(let i=0;i<data.length;i++)data[i]*=gain;
  data[0]=data[data.length-1]=0;return data;
}

export class ContraWeaponAudio{
  constructor({getContext,getOutput,enabled=()=>true,maxVoices=8}){
    this.getContext=getContext;this.getOutput=getOutput;this.enabled=enabled;this.maxVoices=maxVoices;
    this.cache=new WeakMap();this.voices=new Set();this.played=0;this.lastWeapon=null;this.bufferCount=0;
  }
  play(weapon='rifle',delay=0){
    if(!this.enabled())return false;
    const context=this.getContext(),output=this.getOutput();if(!context||context.state==='closed'||!output)return false;
    if(!Object.hasOwn(WEAPON_SHOT_SECONDS,weapon))weapon='rifle';
    let buffers=this.cache.get(context);if(!buffers){buffers=new Map();this.cache.set(context,buffers);}
    if(!buffers.has(weapon)){
      const samples=synthesizeWeaponShot(weapon,context.sampleRate),buffer=context.createBuffer(1,samples.length,context.sampleRate);
      buffer.getChannelData(0).set(samples);buffers.set(weapon,buffer);this.bufferCount++;
    }
    while(this.voices.size>=this.maxVoices)this.stop(this.voices.values().next().value);
    const source=context.createBufferSource(),gain=context.createGain(),voice={source,gain};
    source.buffer=buffers.get(weapon);gain.gain.value=.6;source.connect(gain);gain.connect(output);
    const clean=()=>{if(!this.voices.delete(voice))return;source.disconnect();gain.disconnect();};
    voice.clean=clean;source.onended=clean;this.voices.add(voice);
    // Queued sources also work on the first frame while initAudio resumes the
    // user-gesture-unlocked context. Pausing or muting explicitly stops them.
    source.start(context.currentTime+Math.max(0,Math.min(.12,delay)));this.played++;this.lastWeapon=weapon;return true;
  }
  stop(voice){if(!voice)return;try{voice.source.stop();}catch{}voice.clean();}
  stopAll(){for(const voice of [...this.voices])this.stop(voice);}
  inspect(){return {played:this.played,lastWeapon:this.lastWeapon,active:this.voices.size,cached:this.bufferCount};}
}

/** A shot counter survives snapshots whose short muzzle flash has already ended. */
export function receivedWeaponShots(previous,current){
  const byId=new Map(previous.map(p=>[p.pid,p])),shots=[];
  for(const p of current){
    const old=byId.get(p.pid);if(!old)continue;
    const counted=Number.isFinite(p.shotSeq)&&Number.isFinite(old.shotSeq);
    const count=counted?Math.max(0,Math.min(3,p.shotSeq-old.shotSeq)):p.flashT>old.flashT?1:0;
    for(let i=0;i<count;i++)shots.push({weapon:p.weapon,delay:i*.035});
  }
  return shots;
}
