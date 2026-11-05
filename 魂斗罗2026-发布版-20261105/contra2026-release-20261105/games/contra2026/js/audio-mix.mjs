export const WUKONG_MIX_DEFAULTS=Object.freeze({musicVolume:30,sfxVolume:100});
const percent=(value,fallback)=>{
  if(value===null||value===''||typeof value==='boolean')return fallback;
  const n=Number(value);return Number.isFinite(n)?Math.round(Math.max(0,Math.min(100,n))):fallback;
};
export function normalizeAudioMix(settings={},defaults=WUKONG_MIX_DEFAULTS){
  return {musicVolume:percent(settings.musicVolume,defaults.musicVolume),sfxVolume:percent(settings.sfxVolume,defaults.sfxVolume)};
}
export function audioMixLevels(settings){
  const mix=normalizeAudioMix(settings);
  return {music:settings.music==='on'?.55*mix.musicVolume/100:0,sfx:settings.sfx==='on'?.9*mix.sfxVolume/100:0};
}
