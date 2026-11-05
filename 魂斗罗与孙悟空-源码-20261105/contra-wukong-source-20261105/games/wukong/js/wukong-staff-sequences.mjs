// Each beat plays an intact painted body clip. Both ends of that painted pole
// still drive collision; new beats have independent, once-only target lists.
export const STAFF_SEQUENCES=Object.freeze({
  lotusChain:Object.freeze({name:'莲花回环 · 舞花接劈',duration:.92,beats:[
    {sheet:'blossom',weight:.38},{sheet:'flower',reverse:true,weight:.30},{sheet:'cleave',weight:.32,heavy:true}]}),
  dragonCoil:Object.freeze({name:'盘龙绕顶 · 回身扫棍',duration:.90,beats:[
    {sheet:'cyclone',weight:.36},{sheet:'sweep',reverse:true,weight:.30},{sheet:'advance',weight:.34,heavy:true}]}),
  sweepingFinish:Object.freeze({name:'横扫千军 · 挑棍追击',duration:.86,beats:[
    {sheet:'sweep',weight:.33},{sheet:'uppercut',weight:.31},{sheet:'advance',weight:.36,heavy:true}]}),
  phoenixFling:Object.freeze({name:'凤舞甩棍 · 回旋接棒',duration:1.02,throwAt:.34,beats:[
    {sheet:'flower',reverse:true,weight:.27},{sheet:'extra',weight:.30},{sheet:'flower',weight:.43,heavy:true}]}),
  backhandOrbit:Object.freeze({name:'背身游龙 · 绕顶回扫',duration:1.10,beats:[
    {sheet:'sweep',reverse:true,weight:.30},{sheet:'cyclone',weight:.35},{sheet:'advance',weight:.35,heavy:true}]}),
  dragonReel:Object.freeze({name:'盘龙卷地 · 花棍截落',duration:1.02,beats:[
    {sheet:'low',weight:.30},{sheet:'blossom',weight:.40},{sheet:'cleave',weight:.30,heavy:true}]}),
  heavenToss:Object.freeze({name:'挑天抛接 · 金箍回环',duration:1.14,throwAt:.26,lob:true,beats:[
    {sheet:'uppercut',weight:.25},{sheet:'cyclone',weight:.38},{sheet:'advance',weight:.37,heavy:true}]}),
  cloudChase:Object.freeze({name:'流云追影 · 回身点棍',duration:.98,beats:[
    {sheet:'advance',weight:.32},{sheet:'sweep',reverse:true,weight:.34},{sheet:'extra',weight:.34,heavy:true}]}),
  thunderWheel:Object.freeze({name:'雷霆风轮 · 甩棒破阵',duration:1.12,throwAt:.48,beats:[
    {sheet:'cleave',weight:.30},{sheet:'blossom',reverse:true,weight:.34},{sheet:'cyclone',weight:.36,heavy:true}]}),
  cloudDragonFlow:Object.freeze({name:'流云盘龙 · 舞棍回扫',duration:2.15,beats:[
    {sheet:'reference',start:0,count:28,form:'figureEight',weight:28/64},
    {sheet:'reference',start:28,count:16,form:'fullSwing',weight:16/64},
    {sheet:'reference',start:44,count:20,form:'cross',weight:20/64,heavy:true}]}),
  skyPiercingFlow:Object.freeze({name:'挑云贯日 · 转棍突进',duration:2.15,beats:[
    {sheet:'reference2',start:0,count:24,form:'skyWheel',weight:24/64},
    {sheet:'reference2',start:24,count:22,form:'thrust',weight:22/64},
    {sheet:'reference2',start:46,count:18,form:'cross',weight:18/64,heavy:true}]}),
  dragonPiercingFlow:Object.freeze({name:'游龙穿花 · 平刺转棍',duration:2.15,beats:[
    {sheet:'reference3',start:0,count:29,form:'thrust',weight:29/64},
    {sheet:'reference3',start:29,count:15,form:'figureEight',weight:15/64},
    {sheet:'reference3',start:44,count:20,form:'fullSwing',weight:20/64,heavy:true}]})
});
export function staffSequenceBeat(variant,phase){
  const sequence=STAFF_SEQUENCES[variant];if(!sequence)return null;
  let from=0;
  for(let i=0;i<sequence.beats.length;i++){
    const beat=sequence.beats[i],to=from+beat.weight;
    if(phase<to||i===sequence.beats.length-1)return {...beat,index:i,phase:Math.max(0,Math.min(1,(phase-from)/beat.weight))};
    from=to;
  }
}
