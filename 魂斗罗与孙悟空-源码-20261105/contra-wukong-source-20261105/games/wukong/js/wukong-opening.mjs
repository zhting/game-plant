export const WUKONG_OPENING_DURATION=20;
export const STONE_BIRTH=Object.freeze({burst:2.2,emerge:2.38,land:4.45,transition:5.8,heaven:6.6});
export const WUKONG_OPENING_PAGES=Object.freeze([
  {from:.4,to:6.2,tag:'石猴出世',lines:['花果山仙石，吸日月精华。','石破天惊，灵猴横空出世！']},
  {from:6.2,to:9.1,tag:'拜师取棒',lines:['拜师学艺，练就七十二变。','龙宫取棒，驾起筋斗云。']},
  {from:9.1,to:11.7,tag:'齐天大圣',lines:['不甘弼马温，重返花果山。','自号齐天大圣，天庭再招安。']},
  {from:11.7,to:14.2,tag:'蟠桃醉酒',lines:['蟠桃盛会，竟未邀俺老孙！','吃蟠桃、饮御酒，再取仙丹。']},
  {from:14.2,to:16.6,tag:'天兵列阵',lines:['玉帝震怒，天兵天将来捉拿。','南天门前，战鼓骤起。']},
  {from:16.6,to:WUKONG_OPENING_DURATION,tag:'大闹天宫',lines:['脚踏筋斗云，直闯南天门。','挥起金箍棒，闹他个天翻地覆！']},
].map(page=>Object.freeze({...page,instant:true,lines:Object.freeze(page.lines)})));

export function wukongOpeningCaption(time){
  const index=WUKONG_OPENING_PAGES.findIndex(page=>time>=page.from&&time<page.to);
  if(index<0)return null;
  const page=WUKONG_OPENING_PAGES[index];
  return {...page,index,total:WUKONG_OPENING_PAGES.length,alpha:Math.max(0,Math.min(1,(time-page.from)/.18,(page.to-time)/.18))};
}

const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
// All cinematic poses are sampled from time. Seeking, pausing and rendering do
// not advance randomness, actors, collision state or the network world.
export function stoneMonkeyBirthPose(seconds){
  const t=Math.max(0,seconds),age=t-STONE_BIRTH.burst;
  const u=Math.max(0,Math.min(1,(t-STONE_BIRTH.emerge)/(STONE_BIRTH.land-STONE_BIRTH.emerge)));
  const landed=t>=STONE_BIRTH.land,settle=landed?Math.sin(Math.PI*Math.min(1,(t-STONE_BIRTH.land)/.38)):0;
  return {charge:ease((t-.3)/1.9),age,stoneVisible:age<0,
    shake:age<0?Math.sin(t*73)*.65*ease((t-.65)/1.55):Math.sin(age*91)*.65*Math.max(0,1-age/.3),
    flash:Math.max(0,1-Math.abs(age-.07)/.22),
    visible:t>=STONE_BIRTH.emerge,landed,frame:landed?'standing':'leap',
    x:168+50*ease(u),y:143-Math.sin(Math.PI*u)*56,
    turn:landed?0:-Math.PI*2*ease(u/.88),alpha:ease((t-STONE_BIRTH.emerge)/.12),
    landBlend:ease((t-STONE_BIRTH.land+.16)/.16),
    squash:1-settle*.1,breath:landed?Math.sin((t-STONE_BIRTH.land)*3)*.003:0,
    heaven:ease((t-STONE_BIRTH.transition)/(STONE_BIRTH.heaven-STONE_BIRTH.transition))};
}
export function wukongOpeningFlight(seconds){
  const local=Math.max(0,seconds-6.2),charge=ease((seconds-16.6)/3.4);
  return {x:95+55*ease(local/8)+35*charge,
    y:111+Math.sin(local*1.25)*2.2-12*charge,
    scale:1.45+.1*charge,guards:ease((seconds-14.2)/.9)};
}
