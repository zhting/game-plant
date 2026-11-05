import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAudioMix,audioMixLevels} from '../../games/contra2026/js/audio-mix.mjs';

test('老设置缺少音量值时采用三成 BGM 和完整音效，原版可保留原混音',()=>{
  assert.deepEqual(normalizeAudioMix({v:2}),{musicVolume:30,sfxVolume:100});
  assert.deepEqual(normalizeAudioMix({}, {musicVolume:100,sfxVolume:100}),{musicVolume:100,sfxVolume:100});
  assert.deepEqual(audioMixLevels({music:'on',sfx:'on',musicVolume:100,sfxVolume:100}),{music:.55,sfx:.9});
});
test('音量保存后的数字字符串与零正确恢复，异常值不能让音频增益溢出',()=>{
  assert.deepEqual(normalizeAudioMix({musicVolume:'0',sfxVolume:'67'}),{musicVolume:0,sfxVolume:67});
  for(const value of [NaN,Infinity,'bad','',null,true])assert.equal(normalizeAudioMix({musicVolume:value}).musicVolume,30);
  assert.deepEqual(normalizeAudioMix({musicVolume:-20,sfxVolume:900}),{musicVolume:0,sfxVolume:100});
});
test('BGM 与音效分别控制，零音量或关闭开关不会改变另一通道',()=>{
  const set={music:'on',sfx:'on',musicVolume:30,sfxVolume:100},mix=audioMixLevels(set);
  assert.ok(Math.abs(mix.music-.165)<1e-9);assert.equal(mix.sfx,.9);
  assert.deepEqual(audioMixLevels({...set,musicVolume:0}),{music:0,sfx:.9});
  assert.deepEqual(audioMixLevels({...set,sfxVolume:0}),{music:mix.music,sfx:0});
  assert.deepEqual(audioMixLevels({...set,music:'off',sfxVolume:60}),{music:0,sfx:.54});
  assert.deepEqual(audioMixLevels({...set,sfx:'off'}),{music:mix.music,sfx:0});
});
