import {normalizeStageMusic} from '../../contra2026/js/reference-music.mjs?v=stage-four-1';

// One source runs through the story, stage card and gameplay. Its first pass may
// start at zero; later loops and a direct stage restart begin at the ninth second.
export const WUKONG_MUSIC_TRACKS=Object.freeze({
  stage1:Object.freeze({url:'/games/wukong/assets/journey-to-west-theme.ogg',loop:true,loopStart:8,startOffset:8}),
  stage2:Object.freeze({url:'/games/wukong/assets/stage-02/south-gate-march.ogg',loop:true,loopStart:0,startOffset:0})
});
export const WUKONG_STARTUP_MUSIC=Object.freeze(['stage1']);
export const WUKONG_MUSIC_OPTIONS=Object.freeze([
  Object.freeze({value:'original',label:'西游记片头 · 第9秒起循环'}),
  Object.freeze({value:'off',label:'关闭本关音乐'})
]);
export const WUKONG_MUSIC_RECORD=Object.freeze({
  title:'西游记片头',edition:'大闹天宫',color:'#d7b77d',
  description:'出世与第一关介绍连续播放整首音乐，进入游戏接着播放；曲终从第9秒起循环，暂停后续播。',
  art:'/games/wukong/assets/journey-to-west-record.svg'
});
export const WUKONG_SIEGE_MUSIC_OPTIONS=Object.freeze([
  Object.freeze({value:'original',label:'南天门 · 破阵行军'}),Object.freeze({value:'off',label:'关闭本关音乐'})
]);
export const WUKONG_SIEGE_MUSIC_RECORD=Object.freeze({title:'破阵行军',edition:'南天门',color:'#d7b77d',
  description:'原创五声音阶行军曲与鼓点，随攻城和天王战循环；暂停后续播。',art:'/games/wukong/assets/stage-02/south-gate-record.svg'});
export function normalizeWukongMusic(saved){
  const choices=normalizeStageMusic(saved);for(const stage of [1,2])choices[stage]=saved?.[stage]==='off'?'off':'original';return choices;
}
export function wukongMusicTrack(state,choices,fallback){
  if(state.mode==='title'||state.mode==='settings'&&state.settingsFrom==='title')return 'stage1';
  if(state.stage===2&&(state.mode==='intro'||state.mode==='play'))return !state.boss?.dead&&choices?.[2]!=='off'?'stage2':null;
  if(state.stage!==1)return fallback;
  if(state.mode==='cine'&&state.cine?.kind==='open')return 'stage1';
  if(state.mode==='intro'||state.mode==='play')return !state.boss?.dead&&choices?.[1]!=='off'?'stage1':null;
  return fallback;
}
