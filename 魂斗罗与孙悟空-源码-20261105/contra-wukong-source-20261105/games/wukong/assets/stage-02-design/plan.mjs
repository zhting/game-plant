// Stage 02 design data. This demonstration does not register a released stage.
export const PLAN=Object.freeze({
  id:'south-gate',chapter:2,title:'南天门',subtitle:'破阵登天',status:'design-prototype',
  requiredSeals:2,targetMinutes:[8,12],counterWindow:3,
  routes:[
    {id:'wind',number:'壹',name:'巨弩风阵',place:'上城弩台',verb:'夺台 · 转弩 · 破阵',
      description:'沿城楼接近弩台，打退守军，把巨弩转向阵眼。用敌人的攻城兵器，拆掉护门风阵。',
      steps:['绕上弩台，击退守军','挥棍转动弩架，瞄准阵眼','发射破阵弩，开启返回前庭的近路'],
      effect:'拆除后，天王的三道风刃减为一道。',support:'三道风刃',clearedSupport:'一道风刃',
      minutes:'约 90 秒',room:{width:1152,height:216},checkpoint:'wind-cleared'},
    {id:'thunder',number:'贰',name:'回雷灵阵',place:'回雷长廊',verb:'看准 · 挥棍 · 回雷',
      description:'在宽阔安全台观察雷珠。棍身碰到雷珠便将它打回；三次回雷击碎阵核，动作无需消耗道具。',
      steps:['从侧台观察一次完整雷珠轨迹','挥棍把三枚雷珠打回阵核','阵核破碎，雷廊熄灭并开启近路'],
      effect:'拆除后，天王重劈结束时不再追加落雷。',support:'重劈追加落雷',clearedSupport:'无追加落雷',
      minutes:'约 75 秒',room:{width:768,height:216},checkpoint:'thunder-cleared'},
    {id:'armor',number:'叁',name:'镇甲力阵',place:'悬锤校场',verb:'破锁 · 放锤 · 撞阵',
      description:'从上下两侧击断悬锤锁扣，再挥棍敲开止动扣。攻城锤撞碎阵甲，把最后一阵的护持交给你来决定。',
      steps:['处理盾兵，击断左右两个锁扣','敲开止动扣，释放悬挂的攻城锤','阵甲被撞碎，落锤成为返程桥'],
      effect:'拆除后，天王大招后的反击窗口由 3 秒延长到 4 秒。',support:'反击窗口 3 秒',clearedSupport:'反击窗口 4 秒',
      minutes:'约 90 秒',room:{width:1152,height:216},checkpoint:'armor-cleared'},
  ],
  boss:{name:'增长天王',weapon:'青锋巨剑',hp:180,coopHp:270,phaseTwoAt:.5,
    moves:[
      {id:'sweep',name:'低位横扫',tell:.9,strike:.25,recovery:1.4,counter:'跳过剑锋，落在身侧反击'},
      {id:'cleave',name:'插地重劈',tell:1.2,strike:.18,recovery:3,counter:'落点锁定后侧移，趁拔剑时连击'},
      {id:'wind',name:'青锋风刃',tell:1,strike:.3,recovery:2,counter:'跳过低刃，靠近正在收剑的天王'},
    ]},
});

export function siegeSummary(cleared){
  const active=PLAN.routes.filter(route=>cleared.has(route.id));
  return {count:active.length,gateOpen:active.length>=PLAN.requiredSeals,
    complete:active.length===PLAN.routes.length,counterWindow:cleared.has('armor')?4:PLAN.counterWindow,
    supports:PLAN.routes.map(route=>({id:route.id,cleared:cleared.has(route.id),
      text:cleared.has(route.id)?route.clearedSupport:route.support}))};
}
