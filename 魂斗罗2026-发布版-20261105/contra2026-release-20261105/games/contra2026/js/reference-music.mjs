export const REFERENCE_TRACKS=Object.freeze({
  title:Object.freeze({url:'/games/contra2026/assets/audio/reference-title.ogg',loop:false}),
  opening:Object.freeze({url:'/games/contra2026/assets/audio/reference-opening.ogg',loop:true}),
  stage1:Object.freeze({url:'/games/contra2026/assets/audio/reference-stage1.ogg',loop:true}),
  stage2:Object.freeze({url:'/games/contra2026/assets/audio/reference-stage2.ogg',loop:true}),
  stage2boss:Object.freeze({url:'/games/contra2026/assets/audio/reference-stage2-boss.ogg',loop:true}),
  stage3:Object.freeze({url:'/games/contra2026/assets/audio/reference-stage3.ogg',loop:true}),
  stage4:Object.freeze({url:'/games/contra2026/assets/audio/reference-stage4.ogg',loop:true}),
  stage4boss:Object.freeze({url:'/games/contra2026/assets/audio/reference-stage4-boss.ogg',loop:true}),
  stage1orchestral:Object.freeze({url:'/games/contra2026/assets/audio/stage1-yue2-orchestral.ogg',loop:true}),
  stage1rock:Object.freeze({url:'/games/contra2026/assets/audio/stage1-rock.ogg',loop:true}),
  stage1epic:Object.freeze({url:'/games/contra2026/assets/audio/stage1-epic.ogg',loop:true}),
  stage1industrial:Object.freeze({url:'/games/contra2026/assets/audio/stage1-industrial-metal.ogg',loop:true}),
  stage1cyberpunk:Object.freeze({url:'/games/contra2026/assets/audio/stage1-cyberpunk.ogg',loop:true})
});

export function stageMusicOptions(stage){
  const original=stage===1?'原视频音乐':stage===2?'原视频音乐（含中枢）':stage===3?'原视频音乐 · 瀑布':stage===4?'原视频音乐（含双生投影）':'原有电子乐';
  return [
    {value:'original',label:original},
    ...(stage===1?[
      {value:'orchestral',label:'YuE2 原节奏大交响 · 完整版'},
      {value:'rock',label:'第一关 BGM · 摇滚重制版'},
      {value:'epic',label:'第一关 BGM · 史诗混合版'},
      {value:'industrial',label:'第一关 BGM · 工业金属版'},
      {value:'cyberpunk',label:'第一关 BGM · 赛博朋克版'}
    ]:[]),
    ...(stage<=2?[{value:'chiptune',label:'电子乐'}]:[]),
    {value:'random',label:'随机播放'},
    {value:'off',label:'关闭本关音乐'}
  ];
}

/** Only audible choices belonging to this stage can enter the shuffle pool. */
export function stageMusicPool(stage){
  return stageMusicOptions(stage).filter(({value})=>value!=='off'&&value!=='random');
}

/** Personal listening state stays outside the shared multiplayer world. A new
 * entry invalidates the draw; room changes, boss transitions and pause do not. */
export class StageMusicSession {
  constructor(random=Math.random){this.random=random;this.stage=null;this.entry=0;this.selection=null;}
  begin(stage){this.stage=stage;this.entry++;this.selection=null;}
  invalidate(stage){if(this.stage===stage)this.selection=null;}
  forScene(state,choices){
    if(!['intro','play'].includes(state.mode))return musicForScene(state,choices);
    if(this.stage!==state.stage)this.begin(state.stage);
    const preference=choices?.[state.stage];
    if(preference!=='random'){
      this.selection={preference,choice:preference};
      return musicForScene(state,choices);
    }
    if(this.selection?.preference!=='random'){
      const pool=stageMusicPool(state.stage);
      const index=Math.max(0,Math.min(pool.length-1,Math.floor(this.random()*pool.length)));
      this.selection={preference,choice:pool[index].value};
    }
    return musicForScene(state,{...choices,[state.stage]:this.selection.choice});
  }
  inspect(){return{stage:this.stage,entry:this.entry,...this.selection};}
}

// Store only catalog choices. Old settings gain the new first-stage default;
// explicit choices survive reloads and later additions to the music library.
export function normalizeStageMusic(saved){
  return Object.fromEntries(Array.from({length:16},(_,i)=>{
    const stage=i+1,value=saved&&typeof saved==='object'?saved[stage]:undefined;
    return [stage,stageMusicOptions(stage).some(option=>option.value===value)?value:stage===1?'orchestral':'original'];
  }));
}

export function referenceTrackForScene(state){
  if(['title','select','lobby'].includes(state.mode))return 'title';
  if(state.mode==='settings'&&state.settingsFrom==='title')return 'title';
  if(state.stage===3)return ['intro','play'].includes(state.mode)&&!state.mech?.dead?'stage3':null;
  if(state.stage===4){
    if(!['intro','play'].includes(state.mode)||state.base?.dead)return null;
    return state.base?.def?.boss?'stage4boss':'stage4';
  }
  if(state.stage===2){
    if(!['intro','play'].includes(state.mode)||state.base?.dead)return null;
    return state.base?.def?.boss?'stage2boss':'stage2';
  }
  if(state.stage!==1)return null;
  if(state.mode==='cine'&&state.cine?.kind==='open')return 'opening';
  if(state.mode==='intro')return 'opening';
  if(state.mode==='play'&&!state.boss?.dead)return 'stage1';
  return null;
}

/** A recorded track key, 'synth', or null for a silent scene. */
export function musicForScene(state,choices){
  const reference=referenceTrackForScene(state);
  if(state.mode==='cine')return reference||'synth';
  if(!['intro','play'].includes(state.mode))return reference;
  const bossKey={1:'boss',2:'base',3:'mech',4:'base',5:'tank',6:'golem',7:'ship',8:'hive',9:'shark',10:'ghost',11:'crab',12:'queen',13:'angler',14:'fcore',15:'serp',16:'mcore'}[state.stage];
  if(!bossKey||state[bossKey]?.dead)return null;
  const selected=choices?.[state.stage],choice=stageMusicOptions(state.stage).some(o=>o.value===selected)?selected:(state.stage===1?'orchestral':'original');
  if(choice==='off')return null;
  if(choice==='orchestral')return 'stage1orchestral';
  if(choice==='rock')return 'stage1rock';
  if(choice==='epic')return 'stage1epic';
  if(choice==='industrial')return 'stage1industrial';
  if(choice==='cyberpunk')return 'stage1cyberpunk';
  if(choice==='chiptune')return 'synth';
  return reference||'synth';
}

function trackOffset(track,offset,duration){
  const end=Math.min(track.loopEnd??duration,duration),start=Math.max(0,Math.min(track.loopStart??0,end));
  if(track.loop&&offset>=end&&end>start)return start+(offset-start)%(end-start);
  return Math.max(0,Math.min(offset,end));
}

/** AudioBuffer loops avoid the decoder restart gaps of repeated HTMLAudio playback. */
export class ReferenceMusic {
  constructor({getContext,getOutput,fetchAudio=(...args)=>globalThis.fetch(...args),tracks=REFERENCE_TRACKS}){
    this.getContext=getContext;this.getOutput=getOutput;this.fetchAudio=fetchAudio;this.tracks=tracks;
    this.buffers=new Map();this.encoded=new Map();this.track=null;this.source=null;this.offset=0;this.startedAt=0;
    this.paused=false;this.ended=false;this.version=0;this.error=null;
  }
  prefetch(key,{retry=false}={}){
    if(retry)this.encoded.delete(key);
    if(!this.encoded.has(key)){
      const pending=(async()=>{
        const response=await this.fetchAudio(this.tracks[key].url,{signal:AbortSignal.timeout(285000)});
        if(!response.ok)throw Error('音频加载失败：'+response.status);
        return response.arrayBuffer();
      })();
      this.encoded.set(key,pending);
      pending.catch(()=>{if(this.encoded.get(key)===pending)this.encoded.delete(key);});
    }
    return this.encoded.get(key);
  }
  async load(key,context){
    if(!this.buffers.has(key)){
      const pending=(async()=>{
        const encoded=await this.prefetch(key);
        return context.decodeAudioData(encoded.slice(0));
      })();
      this.buffers.set(key,pending);
      pending.catch(()=>{if(this.buffers.get(key)===pending)this.buffers.delete(key);});
    }
    return this.buffers.get(key);
  }
  detach(){
    if(this.source){const source=this.source;this.source=null;source.onended=null;
      try{source.stop();}catch{}try{source.disconnect();}catch{}}
  }
  async play(key,{offset}={}){
    const context=this.getContext(),output=this.getOutput();
    if(!context||!output||!this.tracks[key])return false;
    if(this.track===key&&this.ended){this.paused=false;return true;}
    if(this.track===key&&!this.paused&&(this.source||this.ended||this.loading))return true;
    const changed=this.track!==key;
    if(changed){this.detach();this.offset=offset??this.tracks[key].startOffset??0;this.ended=false;}
    this.track=key;this.paused=false;this.error=null;this.loading=true;
    const version=++this.version;
    try{
      const buffer=await this.load(key,context);
      if(version!==this.version||this.track!==key||this.paused)return false;
      const source=context.createBufferSource();source.buffer=buffer;source.loop=this.tracks[key].loop;
      source.loopStart=this.tracks[key].loopStart??0;source.loopEnd=Math.min(this.tracks[key].loopEnd??buffer.duration,buffer.duration);
      source.connect(output);this.offset=trackOffset(this.tracks[key],this.offset,buffer.duration);
      this.startedAt=context.currentTime;this.source=source;this.duration=buffer.duration;this.loading=false;
      source.onended=()=>{if(this.source===source){this.source=null;this.ended=true;source.disconnect();}};
      source.start(0,this.offset);return true;
    }catch(error){
      if(version===this.version){this.loading=false;this.error=error.message;}
      return false;
    }
  }
  pause(){
    if(this.source){const elapsed=this.getContext().currentTime-this.startedAt;
      this.offset=trackOffset(this.tracks[this.track],this.offset+elapsed,this.duration);}
    this.detach();this.paused=true;this.loading=false;++this.version;
  }
  stop(){this.pause();this.track=null;this.offset=0;this.ended=false;this.error=null;}
  inspect(){return{track:this.track,playing:!!this.source,paused:this.paused,loading:!!this.loading,ended:this.ended,error:this.error};}
}
