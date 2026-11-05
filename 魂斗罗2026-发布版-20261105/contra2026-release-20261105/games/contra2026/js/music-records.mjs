const ROOT='/games/contra2026/assets/music-records/';
const EDITIONS=Object.freeze({
  original:{title:'原版原声',edition:'ORIGINAL',color:'#c3b469',description:'保留原游戏的旋律与节奏。'},
  orchestral:{title:'原节奏大交响',edition:'ORCHESTRAL',color:'#d7b77d',description:'YuE2 完整版 · 管弦乐铺开雨林的冒险。'},
  rock:{title:'摇滚重制版',edition:'ROCK',color:'#db785c',description:'失真吉他与鼓点，推进整场战斗。'},
  epic:{title:'史诗混合版',edition:'EPIC HYBRID',color:'#b8c6b6',description:'交响与强劲节拍交织的宏大声场。'},
  industrial:{title:'工业金属版',edition:'INDUSTRIAL',color:'#d0a06c',description:'机械律动、厚重吉他与金属冲击。'},
  cyberpunk:{title:'赛博朋克版',edition:'CYBERPUNK',color:'#82bdb8',description:'合成器与霓虹脉冲，穿行电子雨夜。'},
  chiptune:{title:'电子乐',edition:'CHIPTUNE',color:'#a6b27b',description:'方波旋律与复古节拍，回到街机年代。'},
  random:{title:'随机播放',edition:'SHUFFLE',color:'#d7b77d',description:'每次进入本关，随机选择一首本关音乐。'},
  off:{title:'关闭本关音乐',edition:'SILENCE',color:'#89918e',description:'保留战场音效，关闭这一关的背景音乐。'}
});

export function musicRecord(stage,value){
  const edition=EDITIONS[value]||EDITIONS.original;
  const original=value==='original';
  return {...edition,
    title:original?(stage<=4?'原视频音乐':'原有电子乐'):edition.title,
    description:original&&stage===2?'走廊与中枢使用各自对应的原版音乐。':original&&stage===3?'原视频瀑布主题，攀登与山巅门卫战连续播放。':original&&stage===4?'红色基地走廊主题与双生投影战斗音乐，随场景自动切换。':edition.description,
    art:ROOT+(original?`stage-${String(stage).padStart(2,'0')}`:value)+'.svg'
  };
}
