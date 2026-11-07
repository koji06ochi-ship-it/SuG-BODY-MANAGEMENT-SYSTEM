(()=>{
'use strict';
const root=document.querySelector('.w');if(!root)return;
const labels={today:'TODAY',training:'TRAINING',recovery:'RECOVERY',nutrition:'NUTRITION',progress:'PROGRESS',details:'詳細・分析'};
const descriptions={today:'歩数・睡眠・回復と、今日の運動',training:'トレーニング記録・次回の負荷・週間計画',recovery:'睡眠・疲労を記録して回復を確認',nutrition:'食事・体重と栄養の記録',progress:'週間・月間の変化',details:'POF・RIR・ROM / CARE・既存の分析と各種設定'};
const nav=document.createElement('nav');nav.className='bodyHomeNav';nav.setAttribute('aria-label','BODYメニュー');
for(const [key,label] of Object.entries(labels)){const b=document.createElement('button');b.type='button';b.dataset.bodyView=key;b.textContent=label;b.addEventListener('click',()=>select(key));nav.appendChild(b);}
const lead=document.createElement('p');lead.className='bodyHomeLead';lead.setAttribute('aria-live','polite');
const links=document.createElement('nav');links.className='bodyHomeLinks';links.setAttribute('aria-label','S.u.Gの各機能');
const native=new URLSearchParams(location.search).get('native')==='ios';
for(const [label,href] of [['BODY HUB','./hub-v27.82.html'],['WALK','../../walk-quest.html'],['QUEST','../../shrine-quest-v26.5.208.html'],['会員証','../../?entry=member&hub=1&membercard=1'],['BEST OF MISS','./best-of-miss-demo-v27.76.html']]){const a=document.createElement('a');a.textContent=label;a.href=href+(native?(href.includes('?')?'&':'?')+'native=ios':'');links.appendChild(a);}
const hero=root.querySelector('.hero');if(!hero)return;hero.after(links,nav,lead);
let selected='today';
function group(el){
 const id=el.id||'',ey=(el.querySelector('.ey')?.textContent||'').trim();
 if(/nutrition|microNutrition|weightGoal|food|meal|partnerFood/i.test(id))return ['nutrition'];
 if(/weeklyResponse|monthly|ideal/i.test(id))return ['progress'];
 if(/weeklyPlan/.test(id))return ['training'];
 if(/HEALTH|TODAY FLOW|TODAY DECISION|TODAY MENU/.test(ey))return ['today'];
 if(/^RECOVERY/.test(ey))return ['today','recovery'];
 if(/TRAINING LOG|NEXT LOAD/.test(ey))return ['training'];
 if(/^HISTORY/.test(ey))return ['progress'];
 return ['details'];
}
function refresh(){for(const el of root.children){if(el===hero||!el.matches('section,.card,.decision'))continue;const hide=selected!=='details'&&!group(el).includes(selected);el.classList.toggle('bodyHomeHidden',hide);}}
function select(key){selected=key;for(const b of nav.children)b.setAttribute('aria-pressed',String(b.dataset.bodyView===key));lead.textContent=descriptions[key];refresh();}
// Keep existing DOM, listeners, storage and insertion anchors intact.
new MutationObserver(refresh).observe(root,{childList:true});select('today');
})();
