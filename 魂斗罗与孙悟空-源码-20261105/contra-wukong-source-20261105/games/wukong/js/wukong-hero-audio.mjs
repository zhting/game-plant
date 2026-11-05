import { STAFF_SEQUENCES } from './wukong-staff-sequences.mjs';
import { EXTRA_HERO_VOICES } from './wukong-dialogue-bank.mjs';
import { HERO_DIALOGUE_POLICY, HeroDialogue, heroVoiceFamily } from './wukong-dialogue-policy.mjs';
import { IMPACT_AUDIO, IMPACT_MIX } from './wukong-impact-audio.mjs';

export const HERO_AUDIO=Object.freeze(Object.fromEntries([
  ...[1,2,3].map((i)=>[i===1?'swing':'swing'+i,`/games/wukong/assets/audio/staff-air-${i}-v2.ogg`]),
  ...['heavy','spin'].map(name=>[name,`/games/wukong/assets/audio/staff-air-${name}-v2.ogg`]),
  ...['qi','ultimate','charge','land'].map(name=>[name,`/games/wukong/assets/audio/staff-${name}.ogg`]),
  ...[1,2,3].map(i=>['effort'+i,`/games/wukong/assets/audio/wukong-call-${i}-user-v3.ogg`]),
  ['shout','/games/wukong/assets/audio/wukong-call-4-user-v3.ogg'],
  ...EXTRA_HERO_VOICES.map(v=>[v.key,v.url]),...Object.entries(IMPACT_AUDIO)
]));
export const HERO_VOICE_INTERVAL=HERO_DIALOGUE_POLICY.interval;
export const HERO_AUDIO_MIX=Object.freeze({swing:.24,heavy:.30,spin:.20,qi:.26,ultimate:.34,charge:.16,land:.28,voice:.94,...IMPACT_MIX});
export const HERO_VOICE_LINES=Object.freeze({effort1:'看棒！',effort2:'哪里跑！',effort3:'嘿！',shout:'吃俺老孙一棒！',...Object.fromEntries(EXTRA_HERO_VOICES.map(v=>[v.key,v.text]))});
const SOUND_VARIANTS=Object.freeze({swing:['swing','swing2','swing3'],heavy:['heavy','swing3','swing2'],spin:['spin','swing2','swing'],hitBody:['hitBody','hitBody2'],hitMetal:['hitMetal','hitMetal2']});
const spinning=a=>/flower|wheel|whirl|cyclone|cloud|wushu|coil/i.test((a.command||'')+' '+(a.variant||''));

// Ordinary FX are replicated to guests. Playback never consumes combat RNG.
export function queueHeroSounds(world,p,kind='swing'){
  const a=p.staff,events=[];
  const actionId=kind==='swing'&&a?(a.audioId??=`${world.t}:${p.pid||p.owner||1}:${world.fx.length}`):null;
  const emit=(sound,delay=0,callout=null)=>{
    const event={k:'heroSound',id:`${world.t}:${p.pid||1}:${world.fx.length}`,sound,callout,owner:p.pid||p.owner||1,
      at:world.time+delay,x:p.x,y:p.y,t:0,life:delay+1.2,priority:kind==='ultimate'||kind==='finisher',
      ...(kind==='finisher'?{voiceContext:'finale'}:{}),...(actionId?{actionId}:{})};
    world.fx.push(event);events.push(event);
  };
  if(kind==='swing'&&a){
    const beats=STAFF_SEQUENCES[a.variant]?.beats||[{weight:1,heavy:a.combo===3||a.kind==='slam'}];let offset=0;
    for(const beat of beats){
      emit(beat.heavy?'heavy':spinning(a)?'spin':'swing',(offset+beat.weight*.24)*a.duration,'effort');offset+=beat.weight;
    }
  }else emit(kind==='finisher'?'ultimate':kind,0,kind==='qi'?'effort':['ultimate','finisher'].includes(kind)?'shout':null);
  return events;
}

export class WukongHeroAudio{
  constructor({getContext=()=>null,getOutput=()=>null,enabled=()=>true,fetchAudio=url=>fetch(url),voiceSeed}={}){
    Object.assign(this,{getContext,getOutput,enabled,fetchAudio});
    this.assets=new Map();this.failed=new Set();this.active=[];this.seen=new Set();this.voiceAt=new Map();
    this.soundTurns=new Map();this.nextVoiceAt=new Map();this.sampleCounts={};this.voiceCounts={};this.dialogue=new HeroDialogue({seed:voiceSeed});
    this.turn=0;this.voices=0;this.sounds=0;this.counts={};this.generation=0;this.lastVoice=-Infinity;this.lastVoiceText=null;
  }
  async load(){
    if(this.pending)return this.pending;
    this.pending=Promise.all(Object.entries(HERO_AUDIO).map(async([key,url])=>{
      try{
        let asset=this.assets.get(key);if(!asset){const response=await this.fetchAudio(url);if(!response.ok)throw Error('audio');asset={bytes:await response.arrayBuffer()};this.assets.set(key,asset);}
        const context=this.getContext();if(context&&asset.context!==context){asset.buffer=await context.decodeAudioData(asset.bytes.slice(0));asset.context=context;}
        this.failed.delete(key);
      }catch{this.failed.add(key);}
    })).then(()=>this.inspect()).finally(()=>{this.pending=null;});return this.pending;
  }
  resourceJob(){return {id:'wukong:hero-audio',load:()=>this.load()};}
  stopAll(){this.generation++;for(const sound of [...this.active]){try{sound.source.stop();}catch{}sound.release();}}
  resetEvents({keepDialogue=false}={}){
    this.stopAll();this.seen.clear();this.soundTurns.clear();this.lastClock=undefined;
    if(!keepDialogue){this.voiceAt.clear();this.nextVoiceAt.clear();this.lastVoice=-Infinity;this.dialogue.reset();}
  }
  observe(effects,{clock=0,camera=0,actors}={}){
    if(this.lastClock!==undefined&&clock<this.lastClock)this.resetEvents();this.lastClock=clock;
    for(const event of effects)if(event.k==='heroSound'&&!this.seen.has(event.id)&&clock+1e-6>=event.at){
      this.seen.add(event.id);if(this.seen.size>512)this.seen.delete(this.seen.values().next().value);
      if(actors&&event.actionId){
        const actor=actors.find(p=>(p.pid||p.owner||1)===(event.owner||1));
        if(!actor||actor.dead||actor.hurt||actor.enteringExit||actor.exitEntered||actor.staff?.audioId!==event.actionId)continue;
      }
      if(!this.enabled()||clock-event.at>.24)continue;
      void this.play(event,{clock,pan:Math.max(-.7,Math.min(.7,(event.x-camera-192)/192))});
    }
  }
  start(key,{voice=false,owner=1,pan=0,category=key}={}){
    const context=this.getContext(),buffer=this.assets.get(key)?.buffer;if(!buffer)return false;
    const channel=voice?'voice':IMPACT_AUDIO[key]?'impact':'action';
    const group=this.active.filter(a=>a.channel===channel),limit=voice?1:channel==='impact'?3:2;
    if(group.length>=limit){try{group[0].source.stop();}catch{}group[0].release();}
    const source=context.createBufferSource(),gain=context.createGain(),panner=context.createStereoPanner?.();
    source.buffer=buffer;source.playbackRate.value=voice?1:[.94,1.04,.99,1.08,.97][this.turn++%5];
    const duck=!voice&&this.active.some(a=>a.voice)?(channel==='impact'?.85:.45):1,overlap=this.active.filter(a=>a.channel===channel).length;
    gain.gain.value=(voice?HERO_AUDIO_MIX.voice:HERO_AUDIO_MIX[category]??.24)*duck/Math.sqrt(overlap+1);
    source.connect(gain);if(panner){panner.pan.value=pan;gain.connect(panner);panner.connect(this.getOutput()||context.destination);}else gain.connect(this.getOutput()||context.destination);
    let released=false;const sound={source,voice,channel,owner,key,gain:gain.gain.value,release:()=>{if(released)return;released=true;const i=this.active.indexOf(sound);if(i>=0)this.active.splice(i,1);source.disconnect();gain.disconnect();panner?.disconnect();}};
    source.onended=sound.release;this.active.push(sound);source.start(context.currentTime);
    if(voice){this.voices++;this.lastVoiceText=HERO_VOICE_LINES[key];this.voiceCounts[key]=(this.voiceCounts[key]||0)+1;}else{this.sounds++;this.counts[category]=(this.counts[category]||0)+1;this.sampleCounts[key]=(this.sampleCounts[key]||0)+1;}return true;
  }
  async play(event,{clock=0,pan=0}={}){
    if(!this.enabled())return false;
    const generation=this.generation,requestedAt=this.getContext()?.currentTime;
    await this.load();const context=this.getContext();
    if(generation!==this.generation||!this.enabled()||context?.state!=='running'||context.currentTime-requestedAt>.24)return false;
    const variants=SOUND_VARIANTS[event.sound],turn=this.soundTurns.get(event.sound)||0;
    const selected=variants?variants[turn%variants.length]:event.sound;this.soundTurns.set(event.sound,turn+1);
    const played=this.start(selected,{pan,owner:event.owner,category:event.sound});
    const owner=event.owner||1,last=this.voiceAt.get(owner)??-Infinity,next=this.nextVoiceAt.get(owner)??-Infinity;
    const finale=event.voiceContext==='finale',voiceFree=!this.active.some(a=>a.voice),ready=finale||clock>=next||event.priority&&clock-last>=HERO_DIALOGUE_POLICY.priorityGap;
    if(event.callout&&voiceFree&&ready&&(finale||clock-this.lastVoice>=HERO_DIALOGUE_POLICY.globalGap)){
      const family=heroVoiceFamily(event),key=this.dialogue.choose(family,clock,{available:k=>!!this.assets.get(k)?.buffer,finale});
      if(key&&this.start(key,{voice:true,owner,pan})){
        this.dialogue.commit(key,family,clock);this.voiceAt.set(owner,clock);this.lastVoice=clock;
        this.nextVoiceAt.set(owner,clock+HERO_VOICE_INTERVAL+[.8,1.9,0,2.6][(this.voices-1)%4]);
      }
    }
    return played;
  }
  inspect(){return {version:'impact-v5',loaded:this.assets.size,total:Object.keys(HERO_AUDIO).length,decoded:[...this.assets.values()].filter(a=>a.buffer).length,
    failed:[...this.failed],active:this.active.length,sounds:this.sounds,voices:this.voices,counts:{...this.counts},sampleCounts:{...this.sampleCounts},voiceCounts:{...this.voiceCounts},
    lastVoiceText:this.lastVoiceText,dialogue:this.dialogue.inspect(),mix:HERO_AUDIO_MIX};}
}
