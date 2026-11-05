export const OPENING_DURATION=27;
export const OPENING_PAGES=Object.freeze([
  {from:.4,to:4.8,tag:'异常坠落',lines:['2087 年，黑礁群岛突然失去联络。','一颗陨星，坠入这座太平洋孤岛。']},
  {from:4.8,to:9,tag:'外星来客',lines:['陨星带来了未知的外星生命。','岛上的武装组织，将它藏进军事基地。']},
  {from:9,to:13.4,tag:'危机扩散',lines:['异形正在基地深处建立母巢，','一旦扩散，附近大陆也将受到威胁。']},
  {from:13.4,to:17.9,tag:'赤焰出动',lines:['联合防卫军派出「赤焰」特战小队。','你的任务：潜入基地，摧毁异形母巢。']},
  {from:17.9,to:22.3,tag:'空降雨林',lines:['直升机已突破外围警戒，准备空降。','先穿过雨林，攻破守住入口的要塞。']},
  {from:22.3,to:OPENING_DURATION,tag:'第一目标',lines:['摧毁要塞中央核心，炸开地下入口。','跳入缺口，继续向地下指挥所推进。']}
].map(page=>Object.freeze({...page,instant:true,lines:Object.freeze(page.lines)})));

/** Whole subtitle lines appear together; fades never delay the second line. */
export function openingCaption(time){
  const index=OPENING_PAGES.findIndex(page=>time>=page.from&&time<page.to);
  if(index<0)return null;
  const page=OPENING_PAGES[index],alpha=Math.max(0,Math.min(1,(time-page.from)/.18,(page.to-time)/.18));
  return{...page,index,total:OPENING_PAGES.length,alpha};
}
