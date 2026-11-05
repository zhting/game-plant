import { REFERENCE_TRACKS } from './reference-music.mjs?v=lean-load-1';

// The playable game uses fixed stage soundtracks. Legacy listening catalogs
// remain available to other skins, but cannot enter Contra's download queue.
export const CONTRA_TRACKS=Object.freeze({
  stage1rock:Object.freeze({url:'/games/contra2026/assets/audio/stage1-rock-lite.ogg',loop:true}),
  stage2:Object.freeze({url:'/games/contra2026/assets/audio/stage2-remix.ogg',loop:true}),
  stage2boss:REFERENCE_TRACKS.stage2boss,
  stage3:Object.freeze({url:'/games/contra2026/assets/audio/stage3-remix.ogg',loop:true}),
  stage4:REFERENCE_TRACKS.stage4,
  stage4boss:REFERENCE_TRACKS.stage4boss,
  stage5:Object.freeze({url:'/games/contra2026/assets/audio/reference-stage5.ogg',loop:true}),
  stage6:Object.freeze({url:'/games/contra2026/assets/audio/reference-stage6.ogg',loop:true}),
  stage7:Object.freeze({url:'/games/contra2026/assets/audio/reference-stage7.ogg',loop:true})
});
export function fixedStageMusicKeys(stage){
  return ({1:['stage1rock'],2:['stage2','stage2boss'],3:['stage3'],4:['stage4','stage4boss'],5:['stage5'],6:['stage6'],7:['stage1rock'],8:['stage7']})[stage]||[];
}
export function fixedMusicTrack(state){
  if(state.stage===8&&state.mode==='cine'&&state.cine?.kind==='end')return 'synth';
  if(state.stage===1&&state.mode==='cine'&&state.cine?.kind==='open')return 'stage1rock';
  if(!['intro','play'].includes(state.mode))return null;
  if(state.stage===1)return state.boss?.dead?null:'stage1rock';
  if(state.stage===3)return state.mech?.dead?null:'stage3';
  if(state.stage===5)return state.fortress?.dead?null:'stage5';
  if(state.stage===6)return state.golem?.dead?null:'stage6';
  if(state.stage===7)return state.gate?.dead?null:'stage1rock';
  if(state.stage===8)return state.hive?.dead?null:'stage7';
  if(state.stage===2||state.stage===4){
    if(state.base?.dead)return null;
    return 'stage'+state.stage+(state.base?.def?.boss?'boss':'');
  }
  return null;
}
