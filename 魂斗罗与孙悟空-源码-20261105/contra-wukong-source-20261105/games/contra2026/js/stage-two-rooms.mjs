export const BASE_ROOM_THEMES=Object.freeze([
  {id:'checkpoint',code:'01',name:'外围哨所',asset:'corridor',accent:'#9dd4e6',panel:'#0c202a',trail:'rgba(135,202,224,.16)'},
  {id:'power',code:'02',name:'动力机房',asset:'power',accent:'#e8bd72',panel:'#211b10',trail:'rgba(231,179,76,.16)'},
  {id:'armory',code:'03',name:'武备仓库',asset:'armory',accent:'#bad18b',panel:'#142016',trail:'rgba(156,192,102,.16)'},
  {id:'command',code:'04',name:'指挥中枢',asset:'command',accent:'#ed927f',panel:'#271111',trail:'rgba(220,93,77,.16)'}
].map(Object.freeze));

// Art is selected from the existing room state; no new simulation/network fields.
export function baseRoomTheme(base){
  return BASE_ROOM_THEMES[base?.def?.boss?3:Math.max(0,Math.min(2,Math.floor(base?.room||0)))];
}
export function nextBaseRoomTheme(base){
  return BASE_ROOM_THEMES[Math.min(3,BASE_ROOM_THEMES.indexOf(baseRoomTheme(base))+1)];
}
// Signals remain on the side walls, outside the rear target plane and player floor.
export function baseRoomSignals(base,time=0){
  const theme=baseRoomTheme(base),lights=[];
  for(const side of [-1,1]){
    const x=side<0?19:363;
    if(theme.id==='power')for(let i=0;i<4;i++)lights.push({x,y:67+i*8,w:2,h:2.2,
      alpha:((Math.floor(time*2)+i)%4===0)?.95:.2});
    else if(theme.id==='armory')lights.push({x:x-1,y:77,w:4,h:1.2,alpha:Math.sin(time*3)> .7?.9:.24});
    else if(theme.id==='command')lights.push({x,y:73,w:1.3,h:15,alpha:.28+.22*(1+Math.sin(time*2))});
    else lights.push({x:side<0?69:312,y:88,w:3,h:1.1,alpha:.55});
  }
  return lights;
}
