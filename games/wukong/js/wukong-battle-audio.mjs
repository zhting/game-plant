export const DEATH_VOICE_URLS=Object.freeze([1,2,3].map(i=>`/games/wukong/assets/audio/enemy-death-${i}.ogg`));

// The event travels with the regular world FX so both co-op clients hear it.
export function queueEnemyCry(world,enemy,kind='guard'){
  const event={k:'enemyCry',id:`${world.t}:${enemy.x}:${world.fx.length}`,voice:kind,x:enemy.x,y:enemy.y,t:0,life:1.2};
  world.fx.push(event);return event;
}
export class WukongBattleAudio{
  constructor({getContext=()=>null,getOutput=()=>null,enabled=()=>true,fetchAudio=url=>fetch(url)}={}){
    Object.assign(this,{getContext,getOutput,enabled,fetchAudio});
    this.assets=new Map();this.failed=new Set();this.active=[];this.seen=new Set();this.turn=0;this.played=0;this.pending=null;this.generation=0;
  }
  async load({retry=false}={}){
    if(this.pending)return this.pending;
    this.pending=Promise.all(DEATH_VOICE_URLS.map(async url=>{
      try{
        let asset=this.assets.get(url);
        if(!asset){const response=await this.fetchAudio(url);if(!response.ok)throw Error('voice');asset={bytes:await response.arrayBuffer()};this.assets.set(url,asset);}
        const context=this.getContext();
        if(context&&asset.context!==context){asset.buffer=await context.decodeAudioData(asset.bytes.slice(0));asset.context=context;}
        this.failed.delete(url);
      }catch{this.failed.add(url);if(retry)this.assets.delete(url);}
    })).then(()=>this.inspect()).finally(()=>{this.pending=null;});
    return this.pending;
  }
  resourceJob(){return {id:'wukong:death-voices',load:options=>this.load(options)};}
  resetEvents(){this.stopAll();this.seen.clear();this.lastClock=undefined;}
  stopAll(){
    this.generation++;
    for(const voice of [...this.active]){try{voice.source.stop();}catch{}voice.release();}
  }
  observe(effects,{clock=0,camera=0}={}){
    if(this.lastClock!==undefined&&clock<this.lastClock)this.resetEvents();this.lastClock=clock;
    for(const event of effects)if(event.k==='enemyCry'&&!this.seen.has(event.id)){
      this.seen.add(event.id);if(this.seen.size>512)this.seen.delete(this.seen.values().next().value);
      if(!this.enabled())continue;
      void this.playDeath(event.voice,{pan:Math.max(-.75,Math.min(.75,(event.x-camera-192)/192))});
    }
  }
  async playDeath(kind='guard',{pan=0}={}){
    if(!this.enabled())return false;
    const generation=this.generation,sequence=this.turn++,index=sequence%DEATH_VOICE_URLS.length;
    await this.load();
    const context=this.getContext(),asset=this.assets.get(DEATH_VOICE_URLS[index]);
    if(generation!==this.generation||!this.enabled()||context?.state!=='running'||!asset?.buffer)return false;
    // Bound simultaneous cries without dropping the onset of a new defeat.
    if(this.active.length>=3){const oldest=this.active[0];try{oldest.source.stop();}catch{}oldest.release();}
    const source=context.createBufferSource(),gain=context.createGain(),panner=context.createStereoPanner?.();
    source.buffer=asset.buffer;source.playbackRate.value=(kind==='giant'?.78:kind==='fly'?1.04:.97)+(sequence%3-1)*.035;
    gain.gain.value=(kind==='giant'?.82:.64)/Math.sqrt(this.active.length+1);
    source.connect(gain);
    if(panner){panner.pan.value=pan;gain.connect(panner);panner.connect(this.getOutput()||context.destination);}
    else gain.connect(this.getOutput()||context.destination);
    const voice={source,release:()=>{
      const index=this.active.indexOf(voice);if(index>=0)this.active.splice(index,1);
      source.disconnect();gain.disconnect();panner?.disconnect();
    }};
    source.onended=voice.release;this.active.push(voice);source.start(context.currentTime);this.played++;return true;
  }
  inspect(){return {loaded:this.assets.size,total:DEATH_VOICE_URLS.length,decoded:[...this.assets.values()].filter(a=>a.buffer).length,failed:[...this.failed],active:this.active.length,played:this.played};}
}
