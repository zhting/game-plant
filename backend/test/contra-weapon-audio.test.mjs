import test from 'node:test';
import assert from 'node:assert/strict';
import {ContraWeaponAudio,synthesizeWeaponShot,WEAPON_SHOT_SECONDS,receivedWeaponShots} from '../../games/contra2026/js/weapon-audio.mjs';

function audioRig(){
  const sources=[],buffers=[],output={};let enabled=true;
  const node=()=>({connect(to){this.output=to;},disconnect(){this.disconnected=true;}});
  const context={sampleRate:48000,currentTime:5,state:'running',
    createGain:()=>({...node(),gain:{value:1}}),
    createBuffer(channels,length,sampleRate){const data=new Float32Array(length),buffer={length,sampleRate,getChannelData:()=>data};buffers.push(buffer);return buffer;},
    createBufferSource(){const source={...node(),start(at){this.started=at;},stop(){this.stopped=true;this.onended?.();}};sources.push(source);return source;}
  };
  const sound=new ContraWeaponAudio({getContext:()=>context,getOutput:()=>output,enabled:()=>enabled,maxVoices:2});
  return {sound,context,sources,buffers,output,enable:value=>enabled=value};
}

test('六种枪械生成有明显起音、不同音色和有限峰值的短音效，尾部不产生截断爆音',()=>{
  const signatures=new Set();
  for(const weapon of Object.keys(WEAPON_SHOT_SECONDS))for(const rate of [22050,48000]){
    const pcm=synthesizeWeaponShot(weapon,rate);let peak=0,early=0,late=0;
    for(let i=0;i<pcm.length;i++){assert.ok(Number.isFinite(pcm[i]));peak=Math.max(peak,Math.abs(pcm[i]));if(i<rate*.02)early+=pcm[i]**2;if(i>=pcm.length-rate*.02)late+=pcm[i]**2;}
    assert.ok(pcm.length>=rate*.07&&pcm.length<=rate*.25);assert.ok(peak>.8&&peak<.83);assert.ok(early>late*3,weapon+' has a clear report and decays');assert.equal(pcm[0],0);assert.equal(pcm.at(-1),0);
    if(rate===48000)signatures.add(pcm.slice(0,100).join(','));
  }
  assert.equal(signatures.size,6);assert.deepEqual(synthesizeWeaponShot('unknown'),synthesizeWeaponShot('rifle'));
});

test('连续开枪复用音频数据，音效通过独立 SFX 通道播放，结束后释放声源',()=>{
  const r=audioRig();assert.equal(r.sound.play('rifle'),true);assert.equal(r.sound.play('rifle',.035),true);
  assert.equal(r.buffers.length,1);assert.equal(r.sources[0].buffer,r.sources[1].buffer);assert.equal(r.sources[0].started,5);assert.equal(r.sources[1].started,5.035);
  assert.equal(r.sources[0].output.output,r.output);assert.equal(r.sources[0].output.gain.value,.6);
  r.sources[0].onended();assert.equal(r.sound.inspect().active,1);assert.equal(r.sources[0].disconnected,true);
  r.sound.stopAll();assert.equal(r.sound.inspect().active,0);assert.equal(r.sources[1].stopped,true);
});

test('关闭音效不创建声源，首次音频解锁期间可排队，静音或暂停可清掉队列并限制叠音数量',()=>{
  const r=audioRig();r.enable(false);assert.equal(r.sound.play('machine'),false);assert.equal(r.sources.length,0);
  r.enable(true);r.context.state='suspended';assert.equal(r.sound.play('machine'),true);r.context.state='running';
  r.sound.play('spread');r.sound.play('laser');assert.equal(r.sources[0].stopped,true);assert.equal(r.sound.inspect().active,2);
  r.sound.stopAll();assert.ok(r.sources.every(s=>s.stopped));r.context.state='closed';assert.equal(r.sound.play(),false);
});

test('联机枪声按两名玩家的真实发射计数补齐，闪光消失仍能听见，重复和回退快照不重放',()=>{
  const old=[{pid:1,shotSeq:4,flashT:0},{pid:2,shotSeq:8,flashT:0}],now=[{pid:1,shotSeq:5,flashT:0,weapon:'spread'},{pid:2,shotSeq:10,flashT:0,weapon:'machine'}];
  assert.deepEqual(receivedWeaponShots(old,now),[{weapon:'spread',delay:0},{weapon:'machine',delay:0},{weapon:'machine',delay:.035}]);
  assert.deepEqual(receivedWeaponShots(now,now),[]);assert.deepEqual(receivedWeaponShots(now,old),[]);assert.deepEqual(receivedWeaponShots([],now),[]);
  assert.equal(receivedWeaponShots(old,[{pid:1,shotSeq:999,weapon:'rifle'}]).length,3,'late snapshots do not create an unbounded burst');
});
