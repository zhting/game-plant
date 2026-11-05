import {PLAN,siegeSummary} from './plan.mjs';
const $=id=>document.getElementById(id),cleared=new Set();
let selected='hub',last=0,hammerTimer=0;
const wind={captured:false,aim:20};
const thunder={running:false,elapsed:0,hits:0,gap:0};
const armor={left:false,right:false,released:false};
const boss={phase:'idle',elapsed:0,hits:0,lastHit:-10};
const routeById=id=>PLAN.routes.find(route=>route.id===id);
const supportHtml=()=>siegeSummary(cleared).supports.map(s=>`<li data-cleared="${s.cleared}"><span>${routeById(s.id).name}${s.cleared?' · 已破':' · 仍在护持'}</span>${s.text}</li>`).join('');
function feedback(text){$('feedback').textContent=text;}
function complete(id){
  if(cleared.has(id))return;
  cleared.add(id);const summary=siegeSummary(cleared);
  updateMap();renderDetail();
  feedback(summary.complete?'三阵已破。天王失去所有阵法护持，可以从容迎战。':summary.gateOpen?'主门封印已松动：可以进门决战，也可以继续拆掉第三阵。':'阵眼已破，回庭近路开启。再破一阵即可开门。');
}
function updateMap(){
  const summary=siegeSummary(cleared);
  $('seal-count').textContent=`${summary.count} / 3`;
  $('gate-status').textContent=summary.complete?'三阵全破，天门已开':summary.gateOpen?'主门可开，第三阵可选':'破任意两阵，即可开门';
  $('gate-status').parentElement.dataset.open=summary.gateOpen;
  document.querySelectorAll('[data-room]').forEach(node=>{
    const id=node.dataset.room;node.classList.toggle('selected',id===selected);node.classList.toggle('cleared',cleared.has(id));
    node.classList.toggle('locked',['gate','boss'].includes(id)&&!summary.gateOpen);
    node.setAttribute('aria-pressed',String(id===selected));
  });
  document.querySelectorAll('[data-path]').forEach(path=>path.classList.toggle('cleared',cleared.has(path.dataset.path)));
  const gate=$('gate-map-label');if(gate)gate.textContent=summary.gateOpen?'封印已松，主门可开':'破任意两阵，击开主门';
  $('support-list').innerHTML=supportHtml();
}
function select(id){selected=id;feedback('');updateMap();renderDetail();}
function renderDetail(){
  const route=routeById(selected),summary=siegeSummary(cleared);
  if(route){
    $('detail-content').innerHTML=`<p class="eyebrow">支路${route.number} / ${route.place}</p><h3 id="detail-title">${route.name}</h3><p class="detail-description">${route.description}</p><ol class="steps">${route.steps.map(step=>`<li>${step}</li>`).join('')}</ol><p class="effect">${route.effect}</p>${cleared.has(route.id)?'<p class="success-note">阵眼已破 · 返回近路开启</p><button class="action-button" data-action="hub">返回前庭，继续选路</button>':`<p class="demo-note">机关规则演示 / 正式关卡中通过棍击操作</p>${mechanicHtml(route.id)}`}`;
    if(selected==='wind')paintAim();
  }else if(selected==='boss'){
    $('detail-content').innerHTML=`<p class="eyebrow">关底 / 青锋巨剑</p><h3 id="detail-title">增长天王</h3><p class="detail-description">重劈起手 1.2 秒，落剑后留下 ${summary.counterWindow} 秒反击窗口。此处演示“观察 → 闪避 → 连击”的节奏。</p><ul class="support-summary">${supportHtml()}</ul>${summary.gateOpen?bossHtml():'<p class="success-note">先破任意两座阵眼，即可进入首领战演示。</p><button class="action-button" data-action="hub">返回前庭选路</button>'}`;
  }else if(selected==='gate'){
    $('detail-content').innerHTML=`<p class="eyebrow">城门 / 双印破封</p><h3 id="detail-title">${summary.gateOpen?'击开南天门':'三阵护门'}</h3><p class="detail-description">${summary.gateOpen?'两道封印已经破碎。现在可以击开主门迎战天王，也可以回头拆掉第三阵，进一步削弱首领。':'三条支路始终开放。破掉其中任意两阵，便可挥棍击开主门；第三阵由你决定是否挑战。'}</p><ul class="support-summary">${supportHtml()}</ul><button class="action-button" data-action="${summary.gateOpen?'boss':'hub'}">${summary.gateOpen?'击开主门，迎战天王':'返回前庭，选择支路'}</button>`;
  }else{
    $('detail-content').innerHTML='<p class="eyebrow">前庭 / 自由选路</p><h3 id="detail-title">三阵，三种打法。</h3><p class="detail-description">先破哪一阵，就先拆掉哪一种城防。每完成一条支路都会记录进度，并开启返回前庭的近路。</p><ol class="steps"><li>巨弩风阵：夺下弩台，瞄准阵眼开弩</li><li>回雷灵阵：看准雷珠，挥棍把它打回</li><li>镇甲力阵：破坏锁扣，放下攻城巨锤</li></ol><p class="effect">破任意两阵开门；未破阵眼会继续支援增长天王。</p><button class="action-button" data-action="wind">从巨弩风阵开始查看</button>';
  }
}
function mechanicHtml(id){
  if(id==='wind')return `<div class="demo-scene" aria-hidden="true"><svg viewBox="0 0 300 100"><path class="shade" d="M60 89L74 61 86 89Z"/><g id="crossbow-arm"><path class="line" d="M49 54Q77 34 103 54M78 43V72M53 63H112"/><path class="line" d="M78 63H112M106 58L113 63 106 68"/></g><circle class="target" cx="252" cy="32" r="17"/><circle class="target" cx="252" cy="32" r="8"/><path class="line" opacity=".3" stroke-dasharray="3 5" d="M113 63L252 32"/></svg></div>${!wind.captured?'<button class="action-button" data-action="capture">夺下弩台</button>':`<div class="aim-control"><label for="aim">转动弩架，金色刻度为阵眼方向<output id="aim-value">${wind.aim}°</output></label><input id="aim" type="range" min="0" max="100" value="${wind.aim}" aria-label="巨弩瞄准角度，目标75度"><p class="small-state">阵眼方位：75°（65–85° 可命中）</p></div><button class="action-button" data-action="fire">发弩破阵</button>`}`;
  if(id==='thunder')return `<div id="orbLane" class="orb-lane" data-ready="false" role="progressbar" aria-label="雷珠距离棍身的进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="orb"></span></div><p class="small-state">回雷 ${thunder.hits} / 3 · 雷珠进入浅色接触区后挥棍</p><button class="action-button" data-action="${thunder.running?'reflect':'start-thunder'}">${thunder.running?'挥棍回雷 · J':'开始回雷演示'}</button>`;
  return `<div class="demo-scene" aria-hidden="true"><svg viewBox="0 0 300 100"><path class="line ${armor.left?'lock-broken':''}" d="M72 5V66L125 77"/><path class="line ${armor.right?'lock-broken':''}" d="M218 5V66L165 77"/><g id="hammer-head" class="${armor.released?'hammer-released':''}"><path class="line" d="M145 0V64"/><path class="shade" d="M119 64H171V88H119Z"/></g><path class="target" d="M251 50L270 40 289 50V77L270 88 251 77Z"/></svg></div><div class="button-pair"><button class="outline-button" data-action="left-lock" ${armor.left?'disabled':''}>${armor.left?'左锁已断':'击断左锁'}</button><button class="outline-button" data-action="right-lock" ${armor.right?'disabled':''}>${armor.right?'右锁已断':'击断右锁'}</button></div><p class="small-state">两侧锁扣全断后，敲开止动扣放锤。</p><button class="action-button" data-action="hammer" ${!armor.left||!armor.right||armor.released?'disabled':''}>${armor.released?'巨锤正在撞阵…':'敲扣放锤'}</button>`;
}
function bossHtml(){return `<div id="boss-demo" class="boss-demo" data-phase="${boss.phase}"><div class="demo-scene boss-scene" aria-hidden="true"><svg viewBox="0 0 300 100"><path class="shade" d="M151 84L155 35 174 27 194 35 204 84Z"/><circle class="shade" cx="174" cy="19" r="12"/><path class="line" d="M165 45L146 62M191 43L215 54M161 82L151 91M190 82L207 91"/><g id="boss-sword"><path class="line" d="M172 35L237 79M211 70L222 56"/><path class="target" d="M242 80H270"/></g></svg></div><div class="boss-line"><span id="boss-phase">准备观察重劈</span><strong id="boss-timer">${siegeSummary(cleared).counterWindow.toFixed(1)}s</strong></div><div class="boss-meter"><span id="boss-fill"></span></div><p class="small-state" id="boss-hits">本轮成功反击 ${boss.hits} 次</p><button class="action-button" id="boss-action" data-action="${['idle','done'].includes(boss.phase)?'boss-start':'boss-hit'}">${['idle','done'].includes(boss.phase)?'开始重劈演示':'挥棍反击 · J'}</button></div>`;}
function paintAim(){const arm=$('crossbow-arm');if(arm)arm.style.transform=`rotate(${(75-wind.aim)*.55}deg)`;if($('aim-value'))$('aim-value').textContent=`${wind.aim}°`;}
function act(action){
  if(['hub','wind','thunder','armor','gate','boss'].includes(action)){select(action);return;}
  if(action==='capture'){wind.captured=true;renderDetail();feedback('弩台已夺下。转动下方弩架，让弩箭指向阵眼。');}
  else if(action==='fire'){
    if(Math.abs(wind.aim-75)<=10)complete('wind');else feedback('弩箭撞在外盾上。把角度转到 65–85° 后再试。');
  }else if(action==='start-thunder'){thunder.running=true;thunder.elapsed=0;renderDetail();feedback('雷珠变为青色时，按 J 或点击按钮挥棍。');}
  else if(action==='reflect'){
    const phase=thunder.elapsed/4;
    if(thunder.running&&thunder.gap<=0&&phase>=.62&&phase<=.95){
      thunder.hits++;thunder.elapsed=0;thunder.gap=.5;
      if(thunder.hits>=3){thunder.running=false;complete('thunder');}else{renderDetail();feedback(`回雷命中，已完成 ${thunder.hits} / 3。`);}
    }else feedback('还没碰到雷珠。等它进入浅色接触区再挥棍。');
  }else if(action==='left-lock'||action==='right-lock'){armor[action==='left-lock'?'left':'right']=true;renderDetail();feedback(armor.left&&armor.right?'两侧锁扣已断，可以敲扣放锤。':'一侧锁扣已断，继续处理另一侧。');}
  else if(action==='hammer'&&armor.left&&armor.right&&!armor.released){armor.released=true;renderDetail();hammerTimer=setTimeout(()=>complete('armor'),700);}
  else if(action==='boss-start'&&siegeSummary(cleared).gateOpen){Object.assign(boss,{phase:'windup',elapsed:0,hits:0,lastHit:-10});renderDetail();feedback('剑锋起手：正式战斗中先侧移，等巨剑插地再反击。');}
  else if(action==='boss-hit'){
    if(boss.phase==='recovery'&&boss.elapsed-boss.lastHit>=.35){boss.hits++;boss.lastHit=boss.elapsed;$('boss-hits').textContent=`本轮成功反击 ${boss.hits} 次`;feedback('棍身命中：利用拔剑的空档继续连击。');}
    else if(boss.phase!=='recovery')feedback('剑还没落地。先躲开重劈，等天王拔剑时再打。');
  }
}
function frame(time){
  const dt=Math.min((time-last)/1000||0,.05);last=time;
  if(selected==='thunder'&&thunder.running){
    if(thunder.gap>0)thunder.gap-=dt;else thunder.elapsed+=dt;
    if(thunder.elapsed>4){thunder.elapsed=0;thunder.gap=.5;feedback('雷珠飞过了，下一枚马上到来。已命中的次数会保留。');}
    const phase=thunder.elapsed/4,lane=$('orbLane'),orb=$('orb');
    if(lane&&orb){lane.dataset.ready=thunder.gap<=0&&phase>=.62&&phase<=.95;lane.setAttribute('aria-valuenow',String(Math.round(phase*100)));orb.style.transform=`translateX(${phase*(lane.clientWidth-14)}px)`;}
  }
  if(selected==='boss'&&!['idle','done'].includes(boss.phase)){
    boss.elapsed+=dt;
    const durations={windup:1.2,strike:.18,recovery:siegeSummary(cleared).counterWindow};
    if(boss.elapsed>=durations[boss.phase]){
      boss.phase=boss.phase==='windup'?'strike':boss.phase==='strike'?'recovery':'done';boss.elapsed=0;
      if(boss.phase==='done'){renderDetail();feedback(`反击窗口结束。本轮成功反击 ${boss.hits} 次；大招之间留出完整连招时间。`);}
    }
    const panel=$('boss-demo');if(panel&&!['idle','done'].includes(boss.phase)){
      const duration=durations[boss.phase];panel.dataset.phase=boss.phase;
      $('boss-phase').textContent={windup:'举剑预警 · 侧移闪避',strike:'巨剑落地 · 等待收势',recovery:'拔剑收势 · 趁机连击'}[boss.phase];
      $('boss-timer').textContent=`${Math.max(0,duration-boss.elapsed).toFixed(1)}s`;
      $('boss-fill').style.width=`${(boss.phase==='recovery'?1-boss.elapsed/duration:boss.elapsed/duration)*100}%`;
    }
  }
  requestAnimationFrame(frame);
}
$('detail-content').addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button&&!button.disabled)act(button.dataset.action);});
$('detail-content').addEventListener('input',event=>{if(event.target.id==='aim'){wind.aim=Number(event.target.value);paintAim();}});
$('view-boss').addEventListener('click',()=>{select('boss');$('route').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
$('reset').addEventListener('click',()=>{clearTimeout(hammerTimer);cleared.clear();Object.assign(wind,{captured:false,aim:20});Object.assign(thunder,{running:false,elapsed:0,hits:0,gap:0});Object.assign(armor,{left:false,right:false,released:false});Object.assign(boss,{phase:'idle',elapsed:0,hits:0,lastHit:-10});select('hub');feedback('路线与机关演示已重置。');});
addEventListener('keydown',event=>{if(event.key.toLowerCase()==='j'&&!event.repeat&&!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)){if(selected==='thunder'&&thunder.running){event.preventDefault();act('reflect');}else if(selected==='boss'&&siegeSummary(cleared).gateOpen){event.preventDefault();act('boss-hit');}}});
try{
  const response=await fetch(new URL('./route-map.svg',import.meta.url));if(!response.ok)throw new Error('Route map unavailable');
  $('route-map').innerHTML=await response.text();$('route-map').setAttribute('aria-busy','false');
  $('route-map').addEventListener('click',event=>{const node=event.target.closest('[data-room]');if(node)select(node.dataset.room);});
  $('route-map').addEventListener('keydown',event=>{const node=event.target.closest('[data-room]');if(node&&['Enter',' '].includes(event.key)){event.preventDefault();select(node.dataset.room);}});
  updateMap();renderDetail();requestAnimationFrame(frame);
}catch(error){$('route-map').setAttribute('aria-busy','false');$('route-map').textContent='路线图加载失败，请刷新页面；完整规则见制作稿。';feedback(error.message);}
