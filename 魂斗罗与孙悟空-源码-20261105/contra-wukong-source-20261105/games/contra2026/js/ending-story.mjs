export const ENDING_DURATION=44;
export const ENDING_PAGES=Object.freeze([
  {from:.5,to:5.6,tag:'撤离群岛',lines:['母巢正在崩溃，基地开始连锁爆炸。','赤焰小队登上直升机，撤离黑礁群岛。']},
  {from:6.5,to:10.6,tag:'母巢覆灭',lines:['最后的爆炸撕裂了岛屿，','异形的巢穴，永远沉入了大海。']},
  {from:11.6,to:16,tag:'迎着朝阳',lines:['赤焰小队完成任务，','迎着朝阳，踏上归途。']},
  {from:16.2,to:20.4,tag:'未知来客',lines:['然而在宇宙深处，','是否还有别的陨星，正朝着地球坠落……？']}
].map(p=>Object.freeze({...p,instant:true,lines:Object.freeze(p.lines)})));

export function endingEase(progress){
  const u=Math.max(0,Math.min(1,progress));
  return u*u*(3-2*u);
}
export function endingCaption(t){
  const index=ENDING_PAGES.findIndex(p=>t>=p.from&&t<p.to);if(index<0)return null;
  const p=ENDING_PAGES[index];return {...p,index,total:ENDING_PAGES.length,alpha:Math.max(0,Math.min(1,(t-p.from)/.25,(p.to-t)/.25))};
}
/** Rendering is a function of the shared cinematic clock, never wall time or random state. */
export function endingPose(t){
  const escape=endingEase(t/9.4),sink=endingEase((t-6.25)/3.3),home=endingEase((t-11)/9.6);
  return {scene:t<11?'escape':t<20.6?'home':'credits',sink,
    island:{x:18+escape*12,y:51+sink*105,w:276-escape*20},
    escapeHeli:{x:163+escape*241,y:69-escape*45+Math.sin(t*2.4)*1.2,w:58+escape*28,bank:-.025-escape*.055},
    homeHeli:{x:35+home*358,y:66+home*30+Math.sin(t*1.8)*.7,w:86-home*53,bank:.025},
    flash:t>=6&&t<6.65?Math.pow(1-(t-6)/.65,2)*.88:0,
    shake:t>=6&&t<8.4?(1-(t-6)/2.4)*1.9:0,
    creditScroll:Math.min(Math.max(0,t-20.6)*22,448)};
}
