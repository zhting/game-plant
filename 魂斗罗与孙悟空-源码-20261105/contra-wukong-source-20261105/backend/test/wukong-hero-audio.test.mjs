import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {HERO_AUDIO,HERO_AUDIO_MIX,HERO_VOICE_INTERVAL,HERO_VOICE_LINES,WukongHeroAudio,queueHeroSounds} from '../../games/wukong/js/wukong-hero-audio.mjs';
import {packWorld,unpackWorld} from '../../games/contra2026/js/coop-core.mjs';
import {HERO_DIALOGUE_POOLS,HERO_DIALOGUE_POLICY} from '../../games/wukong/js/wukong-dialogue-policy.mjs';
import {queueHeroImpact} from '../../games/wukong/js/wukong-impact-audio.mjs';
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const audioTotal=Object.keys(HERO_AUDIO).length;
const endVoices=audio=>{for(const sound of [...audio.active])if(sound.voice){sound.source.ended=true;sound.source.onended();}};
function fixture(){
  const fetched=[],sources=[],connections=[],output={},context={state:'running',currentTime:5,destination:{}};
  const node=()=>({connect(to){connections.push(to);},disconnect(){}});
  Object.assign(context,{decodeAudioData:async()=>({duration:.4}),createGain:()=>({...node(),gain:{value:0}}),createStereoPanner:()=>({...node(),pan:{value:0}}),
    createBufferSource(){const n={...node(),playbackRate:{value:1},start(){this.started=true;},stop(){this.stopped=true;this.onended?.();}};sources.push(n);return n;}});
  let enabled=true;
  const audio=new WukongHeroAudio({getContext:()=>context,getOutput:()=>output,enabled:()=>enabled,voiceSeed:12345,
    fetchAudio:async url=>{fetched.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};}});
  return {audio,fetched,sources,connections,output,context,mute(){enabled=false;},unmute(){enabled=true;}};
}
const event=(id,extra={})=>({k:'heroSound',id,sound:'swing',callout:'effort',at:0,owner:1,x:300,...extra});

test('破风、命中、原始四句和十二句同音色合成扩充均为本地 Ogg，总计不足350KB',()=>{
  let bytes=0;for(const url of Object.values(HERO_AUDIO)){const data=fs.readFileSync(new URL('../..'+url,import.meta.url));assert.equal(data.subarray(0,4).toString(),'OggS');bytes+=data.length;}
  assert.equal(audioTotal,31);assert.ok(bytes<350000);assert.equal(Object.keys(HERO_VOICE_LINES).length,16);
  assert.ok(HERO_AUDIO.effort1.includes('-user-v3.ogg'));assert.equal(new Set([HERO_AUDIO.swing,HERO_AUDIO.swing2,HERO_AUDIO.swing3]).size,3);
  const build=JSON.parse(fs.readFileSync(new URL('../../games/wukong/assets/audio/natural-hero-audio-build.json',import.meta.url),'utf8'));
  assert.ok(build.files.filter(f=>f.page).every(f=>f.license==='CC0 1.0'));
  const voices=JSON.parse(fs.readFileSync(new URL('../../games/wukong/assets/audio/user-hero-voice-build.json',import.meta.url),'utf8'));
  assert.equal(voices.sourceKind,'user-supplied audio');
  const hash=data=>createHash('sha256').update(data).digest('hex');
  assert.equal(hash(fs.readFileSync(new URL('../../'+voices.source,import.meta.url))),voices.sourceSha256);
  assert.deepEqual(voices.files.map(f=>f.text),['effort1','effort2','effort3','shout'].map(k=>HERO_VOICE_LINES[k]));
  for(const clip of voices.files){
    assert.equal(HERO_AUDIO[clip.key].split('/').at(-1),clip.file);
    assert.equal(hash(fs.readFileSync(new URL('../..'+HERO_AUDIO[clip.key],import.meta.url))),clip.sha256);
    assert.ok(clip.end<=voices.sourceDuration&&clip.duration>0);
    assert.ok(!/asetrate|atempo|rubberband/.test(clip.filters));
  }
  const expanded=JSON.parse(fs.readFileSync(new URL('../../games/wukong/assets/audio/dialogue-voice-build.json',import.meta.url),'utf8'));
  assert.equal(expanded.referenceSha256,voices.sourceSha256);assert.equal(expanded.files.length,12);
  for(const clip of expanded.files){assert.equal(HERO_VOICE_LINES[clip.key],clip.text);assert.equal(hash(fs.readFileSync(new URL('../..'+HERO_AUDIO[clip.key],import.meta.url))),clip.sha256);}
});

test('命中独立于空挥与喊招，身体和护甲轮换音色，重击保留低频，快照重复不重播',async()=>{
  const s=fixture(),world={t:1,time:0,fx:[]},p={pid:1,x:100,y:144,staff:{kind:'sweep',duration:.4}};
  queueHeroSounds(world,p);assert.ok(world.fx.every(e=>!e.impact));
  world.fx=[];queueHeroImpact(world,{x:110,y:125});
  queueHeroImpact(world,{x:111,y:125,heavy:true});assert.equal(world.fx.length,1);assert.equal(world.fx[0].sound,'heavyBody');
  world.t++;world.time=.1;queueHeroImpact(world,{x:120,y:124,metal:true});
  world.t++;world.time=.2;queueHeroImpact(world,{x:120,y:124,metal:true});
  world.t++;world.time=.3;queueHeroImpact(world,{x:120,y:124,metal:true,heavy:true});
  const [copy]=unpackWorld(packWorld([world]));await s.audio.load();
  for(const e of copy.fx){s.audio.observe(copy.fx,{clock:e.at,actors:[{pid:1,dead:true}]});await settle();s.audio.observe(copy.fx,{clock:e.at});await settle();}
  assert.deepEqual(s.audio.inspect().sampleCounts,{heavyBody:1,hitMetal:1,hitMetal2:1,heavyMetal:1});
  assert.equal(s.audio.inspect().voices,0);assert.equal(s.audio.active.filter(a=>a.channel==='impact').length,3);
  await s.audio.play(event('swing-with-impact'),{clock:.3});
  assert.equal(s.audio.active.filter(a=>a.channel==='impact').length,3);
  assert.ok(s.audio.active.find(a=>a.key==='heavyMetal').gain>s.audio.active.find(a=>a.key==='swing').gain*2);
  assert.ok(s.connections.includes(s.output));s.audio.stopAll();assert.equal(s.audio.active.length,0);
});
test('连招按三个发力时刻分别排音，空挥也有声音；主客快照重复收到不重播',async()=>{
  const s=fixture(),world={t:20,time:0,fx:[]},p={pid:2,x:300,y:144,staff:{variant:'lotusChain',duration:1.12,combo:3}};
  const queued=queueHeroSounds(world,p);assert.equal(queued.length,3);assert.ok(queued[0].at>0&&queued[0].at<queued[1].at&&queued[1].at<queued[2].at);
  assert.equal(queued[2].sound,'heavy');assert.equal(queued[0].owner,2);
  const [remote]=unpackWorld(packWorld([world]));await s.audio.load();
  for(const e of remote.fx){s.audio.observe(remote.fx,{clock:e.at});await settle();s.audio.observe(remote.fx,{clock:e.at});await settle();}
  assert.equal(s.audio.inspect().sounds,3);assert.equal(s.audio.inspect().voices,1);assert.equal(s.audio.inspect().counts.heavy,1);
  assert.ok(s.connections.includes(s.output));assert.ok(!s.connections.includes(s.context.destination));
});
test('预载复用下载解码，中文喊招不会每次出棍播放，大招也不打断尚未说完的台词',async()=>{
  const s=fixture();await Promise.all([s.audio.load(),s.audio.load()]);await s.audio.load();assert.equal(s.fetched.length,audioTotal);assert.equal(s.audio.inspect().decoded,audioTotal);
  for(let i=0;i<6;i++)await s.audio.play(event('a'+i),{clock:i*.1});assert.equal(s.audio.inspect().sounds,6);assert.equal(s.audio.inspect().voices,1);
  await s.audio.play(event('ult',{sound:'ultimate',callout:'shout',priority:true}),{clock:.6});assert.equal(s.audio.inspect().voices,1);
  for(const active of [...s.audio.active])if(active.voice){active.source.ended=true;active.source.onended();}
  await s.audio.play(event('earlyUlt',{sound:'ultimate',callout:'shout',priority:true}),{clock:3});assert.equal(s.audio.inspect().voices,1);
  await s.audio.play(event('ult2',{sound:'ultimate',callout:'shout',priority:true}),{clock:5});assert.equal(s.audio.inspect().voices,2);assert.notEqual(s.audio.inspect().lastVoiceText,'吃俺老孙一棒！');
  assert.ok(s.audio.active.filter(a=>a.voice).length<=1);assert.ok(s.audio.active.filter(a=>!a.voice).length<=2);
  s.audio.stopAll();assert.equal(s.audio.inspect().active,0);assert.ok(s.sources.every(s=>s.stopped||s.ended));
});
test('静音、音效关闭及过期事件不补播，暂停后迟到的资源不会突然出声',async()=>{
  const s=fixture();await s.audio.load();s.mute();s.audio.observe([event('muted')],{clock:0});s.unmute();s.audio.observe([event('muted')],{clock:.1});await settle();assert.equal(s.sources.length,0);
  s.audio.observe([event('stale')],{clock:.5});await settle();assert.equal(s.sources.length,0);
  let release;const waiting=new Promise(resolve=>{release=resolve;});const pending=fixture();pending.audio.fetchAudio=async()=>{await waiting;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};};
  const playing=pending.audio.play(event('late'),{clock:0});pending.audio.stopAll();release();assert.equal(await playing,false);assert.equal(pending.sources.length,0);
  s.context.state='suspended';assert.equal(await s.audio.play(event('locked')),false);
});
test('可选语音失败不阻塞加载，恢复后重试；慢下载不让旧出招声延迟播放',async()=>{
  const s=fixture();let bad=true;s.audio.fetchAudio=async()=>{if(bad)throw Error('offline');return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};};
  await s.audio.resourceJob().load();assert.equal(s.audio.inspect().failed.length,audioTotal);bad=false;await s.audio.load();assert.equal(s.audio.inspect().failed.length,0);
  const delayed=fixture();delayed.audio.fetchAudio=async()=>{delayed.context.currentTime=6;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};};
  assert.equal(await delayed.audio.play(event('old')),false);assert.equal(delayed.sources.length,0);
});

test('打断连招后不再播放后续段声音，换招和死亡也会取消已排队的旧呼喝',async()=>{
  for(const reason of ['hurt','newAction','dead']){
    const s=fixture(),world={t:10,time:0,fx:[]},p={pid:1,x:300,y:144,staff:{variant:'lotusChain',duration:1.12,combo:3}};
    const sounds=queueHeroSounds(world,p);await s.audio.load();
    s.audio.observe(world.fx,{clock:sounds[0].at,actors:[p]});await settle();assert.equal(s.audio.inspect().sounds,1);
    if(reason==='hurt'){p.staff=null;p.hurt={t:0};}else if(reason==='newAction')p.staff={kind:'ultimate'};else p.dead=true;
    for(const sound of sounds.slice(1)){s.audio.observe(world.fx,{clock:sound.at,actors:[p]});await settle();}
    assert.equal(s.audio.inspect().sounds,1,reason);assert.equal(s.audio.inspect().voices,1,reason);
  }
});

test('双人只取消被打断者的连招，快照恢复后未打断的玩家仍按每段发声且不重复',async()=>{
  const s=fixture(),world={t:20,time:0,fx:[]},players=[1,2].map(pid=>({pid,x:300+pid*10,y:144,staff:{variant:'lotusChain',duration:1.12,combo:3}}));
  const first=queueHeroSounds(world,players[0]),second=queueHeroSounds(world,players[1]);await s.audio.load();
  s.audio.observe(world.fx,{clock:first[0].at,actors:players});await settle();assert.equal(s.audio.inspect().sounds,2);
  players[0].staff=null;const [copy]=unpackWorld(packWorld([{players,fx:world.fx}]));
  for(const sound of second.slice(1)){s.audio.observe(copy.fx,{clock:sound.at,actors:copy.players});await settle();s.audio.observe(copy.fx,{clock:sound.at,actors:copy.players});await settle();}
  assert.equal(s.audio.inspect().sounds,4);
});

test('已经发出的棍气仍有释放声，不把招式中断规则应用到已发生的物理效果',async()=>{
  const s=fixture(),world={t:30,time:0,fx:[]},p={pid:1,x:300,y:144,staff:{kind:'qiCast'}};
  queueHeroSounds(world,p,'qi');p.staff=null;p.hurt={t:0};await s.audio.load();
  s.audio.observe(world.fx,{clock:0,actors:[p]});await settle();assert.equal(s.audio.inspect().counts.qi,1);
});

test('持续攻击约十二秒只偶尔喊两次，台词不同且普通喊招间隔至少5.2秒',async()=>{
  const s=fixture(),heard=[];await s.audio.load();let last=0;
  for(let i=0;i<120;i++){
    for(const active of [...s.audio.active])if(active.voice)active.source.onended();
    await s.audio.play(event('repeat'+i),{clock:i*.1});
    if(s.audio.inspect().voices>last){heard.push({at:i*.1,text:s.audio.inspect().lastVoiceText});last++;}
  }
  assert.equal(heard.length,2);assert.equal(new Set(heard.map(h=>h.text)).size,2);
  for(let i=1;i<heard.length;i++)assert.ok(heard[i].at-heard[i-1].at>=HERO_VOICE_INTERVAL);
  assert.ok(heard.every(h=>Object.values(HERO_VOICE_LINES).includes(h.text)));
});

test('重击与棍气不再说长台词，连续十轮普通喊招不放回，最近四句不重复',async()=>{
  const s=fixture();await s.audio.load();const heard=[];
  for(let i=0;i<20;i++){
    endVoices(s.audio);await s.audio.play(event('ordinary'+i),{clock:i*10});heard.push(Object.keys(s.audio.inspect().voiceCounts).find(k=>s.audio.active.some(a=>a.voice&&a.key===k)));
  }
  assert.equal(new Set(heard.slice(0,10)).size,HERO_DIALOGUE_POOLS.ordinary.length);
  for(let i=0;i<heard.length;i++)assert.ok(!heard.slice(Math.max(0,i-4),i).includes(heard[i]));
  for(let i=0;i<30;i++){endVoices(s.audio);await s.audio.play(event('heavy'+i,{sound:i%2?'qi':'heavy',callout:'shout'}),{clock:210+i*10});}
  assert.equal(s.audio.inspect().voiceCounts.shout||0,0);
});

test('大招台词轮换，招牌长句最多每四次大招一次且间隔至少60秒，双人共用防重复记录',async()=>{
  const s=fixture(),signature=[];await s.audio.load();
  for(let i=0;i<26;i++){
    endVoices(s.audio);const before=s.audio.inspect().voiceCounts.shout||0;
    await s.audio.play(event('ultimate'+i,{sound:'ultimate',callout:'shout',priority:true,owner:i%2+1}),{clock:i*10});
    if((s.audio.inspect().voiceCounts.shout||0)>before)signature.push(i*10);
  }
  assert.ok(signature.length>=2&&signature.length<=4);for(let i=1;i<signature.length;i++)assert.ok(signature[i]-signature[i-1]>=HERO_DIALOGUE_POLICY.signatureGap);
  assert.ok(Object.keys(s.audio.inspect().voiceCounts).length>=6);
});

test('切入终结动画只清旧攻击声，保留长台词冷却与最近四句，暂停停止播放也不清历史',async()=>{
  const s=fixture();await s.audio.load();
  await s.audio.play(event('finale1',{sound:'ultimate',callout:'shout',priority:true,voiceContext:'finale'}),{clock:10});
  assert.equal(s.audio.inspect().voiceCounts.shout,1);s.audio.resetEvents({keepDialogue:true});
  await s.audio.play(event('finale2',{sound:'ultimate',callout:'shout',priority:true,voiceContext:'finale'}),{clock:11.1});
  assert.equal(s.audio.inspect().voices,2);assert.equal(s.audio.inspect().voiceCounts.shout,1);assert.notEqual(s.audio.inspect().lastVoiceText,'吃俺老孙一棒！');
  const history=s.audio.inspect().dialogue.recent;s.audio.stopAll();assert.deepEqual(s.audio.inspect().dialogue.recent,history);
});

test('挥棍交替使用三段实录，棍声比语音轻，讲话时进一步压低新发出的棍声',async()=>{
  const s=fixture();await s.audio.load();await s.audio.play(event('first'),{clock:0});
  const voice=s.audio.active.find(a=>a.voice),swing=s.audio.active.find(a=>!a.voice);assert.ok(voice.gain>=swing.gain*3);
  await s.audio.play(event('second'),{clock:.1});const second=s.audio.active.at(-1);assert.ok(!second.voice);assert.ok(second.gain<HERO_AUDIO_MIX.swing/2);
  await s.audio.play(event('third'),{clock:.2});assert.deepEqual(Object.keys(s.audio.inspect().sampleCounts),['swing','swing2','swing3']);
});
