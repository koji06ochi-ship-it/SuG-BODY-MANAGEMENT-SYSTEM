(function(){'use strict';
const V='26.5.80';
const GROUPS={
 training:{title:'トレ',items:[['今日のメニュー','🏋️',['smart','training','train']],['トレーニング記録','📝',['workout','trainingLog','log']],['種目マスタ','▦',['exerciseMaster']]]},
 inspection:{title:'検査',items:[['QUICK SCREEN','⚡',['#sugQuickScreen','QUICK SCREEN']],['MOVEMENT AI','🎥',['#sugMovementErrorHub','MOVEMENT AI']],['特殊テスト','🧪',['SPECIAL TEST','特殊テスト']],['NEURO','🧠',['#sugNeuroTabs','NEURO']],['AROM・PROM','↔️',['AROM','PROM']],['Before・After','◐',['BEFORE','AFTER']]]},
 life:{title:'生活',items:[['食事','🍱',['meal','food','食事']],['活動','🚶',['activity','活動']],['回復','🌙',['recovery','回復']],['体重','⚖️',['weight','体重']],['チェックイン','✓',['checkin','チェックイン']],['ケア','✚',['care','CARE','ケア']]]},
 analysis:{title:'分析',items:[['身体の変化','📈',['response','身体の変化']],['写真','📷',['photos','写真']],['レポート','📄',['reports','レポート']]]},
 manage:{title:'管理',items:[['会員管理','👥',['adminBoard','会員管理']],['セキュリティ','🔒',['security','セキュリティ']]]}
};
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function oldTabs(){return [...document.querySelectorAll('.tabs .tab,.tab[data-tab]')].filter(x=>!x.closest('#sugSixNav'))}
function clickTarget(keys){
 closeFolder();
 for(const k of keys){
  if(k[0]==='#'){const e=document.querySelector(k);if(e){showAdminIfNeeded(e);setTimeout(()=>e.scrollIntoView({behavior:'smooth',block:'start'}),80);return true}}
  const exact=oldTabs().find(e=>String(e.dataset.tab||'').toLowerCase()===String(k).toLowerCase());if(exact){exact.click();return true}
  const byId=document.getElementById(k);if(byId){showPanel(byId);return true}
 }
 const needles=keys.map(String).filter(x=>x[0]!=='#').map(x=>x.toLowerCase());
 const candidates=[...document.querySelectorAll('button,.tab,h1,h2,h3,b,strong,label')];
 for(const n of needles){const e=candidates.find(x=>(x.textContent||'').trim().toLowerCase().includes(n));if(e){const tab=e.closest('.tab,button');if(tab&&tab!==e.closest('.sug80Icon')){try{tab.click()}catch{}}showAdminIfNeeded(e);setTimeout(()=>e.scrollIntoView({behavior:'smooth',block:'start'}),80);return true}}
 return false;
}
function showPanel(p){document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));p.classList.add('active');}
function showAdminIfNeeded(e){const admin=e.closest('#adminBoard,[data-panel="adminBoard"]');if(!admin)return;const t=oldTabs().find(x=>(x.dataset.tab||'')==='adminBoard');if(t)try{t.click()}catch{}else if(admin.classList.contains('panel'))showPanel(admin)}
function home(){closeFolder();const t=oldTabs().find(x=>/^(home|dashboard)$/i.test(x.dataset.tab||'')||/HOME|ホーム/.test(x.textContent||''));if(t){t.click();return}window.scrollTo({top:0,behavior:'smooth'})}
function openFolder(key){closeFolder();const g=GROUPS[key];if(!g)return;const ov=document.createElement('div');ov.id='sug80Folder';ov.className='sug80Overlay';ov.innerHTML=`<div class="sug80Sheet"><div class="sug80Head"><b>${esc(g.title)}</b><button class="sug80Close" type="button">×</button></div><div class="sug80Grid">${g.items.map((it,i)=>`<button class="sug80Icon" type="button" data-i="${i}"><span>${it[1]}</span><small>${esc(it[0])}</small></button>`).join('')}</div></div>`;document.body.appendChild(ov);ov.querySelector('.sug80Close').onclick=closeFolder;ov.addEventListener('click',e=>{if(e.target===ov)closeFolder()});ov.querySelectorAll('.sug80Icon').forEach(b=>b.onclick=()=>clickTarget(g.items[+b.dataset.i][2]));}
function closeFolder(){document.getElementById('sug80Folder')?.remove()}
function style(){if(document.getElementById('sug80Css'))return;const s=document.createElement('style');s.id='sug80Css';s.textContent=`
#sugSixNav{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin:8px 0 12px}.sug80Main{border:1px solid #3a3a40;background:#151518;color:#ddd;border-radius:11px;padding:10px 3px;font-size:11px;font-weight:800;min-width:0}.sug80Main:active{background:#5b5b61;color:#fff}.sug80Main[data-key="inspection"]{border-color:#6a5627;color:#f3d98b}.sug80Overlay{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.50);backdrop-filter:blur(18px);display:grid;place-items:center;padding:16px}.sug80Sheet{width:min(330px,88vw);border-radius:22px;padding:16px;background:rgba(30,30,34,.96);border:1px solid #555;box-shadow:0 18px 60px rgba(0,0,0,.65)}.sug80Head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.sug80Head b{font-size:18px;color:#f3d98b}.sug80Close{width:34px;height:34px;border-radius:50%;border:1px solid #555;background:#333;color:#fff;font-size:18px}.sug80Grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px 8px}.sug80Icon{border:0;background:none;color:#fff;text-align:center;padding:0}.sug80Icon span{width:58px;height:58px;margin:auto;display:grid;place-items:center;border-radius:14px;background:linear-gradient(145deg,#2a2a30,#131317);border:1px solid #4a4a50;font-size:25px}.sug80Icon small{display:block;font-size:10px;margin-top:6px;line-height:1.25}.tabs{display:none!important}#sugInspectionPanel img[src^="data:image"],#sugInspectionPanel .sugCharacterGuide,#sugInspectionPanel .sugTrainerClient,#sugInspectionPanel .character-guide{display:none!important}@media(max-width:430px){#sugSixNav{gap:4px}.sug80Main{font-size:10px;padding:9px 1px}}
`;document.head.appendChild(s)}
function mount(){style();if(document.getElementById('sugSixNav'))return;const tabs=document.querySelector('.tabs');if(!tabs)return;const nav=document.createElement('nav');nav.id='sugSixNav';nav.setAttribute('aria-label','S.u.G main navigation');nav.innerHTML=`<button class="sug80Main" data-key="home">HOME</button><button class="sug80Main" data-key="training">トレ</button><button class="sug80Main" data-key="inspection">検査</button><button class="sug80Main" data-key="life">生活</button><button class="sug80Main" data-key="analysis">分析</button><button class="sug80Main" data-key="manage">管理</button>`;tabs.parentNode.insertBefore(nav,tabs);nav.querySelectorAll('.sug80Main').forEach(b=>b.onclick=()=>b.dataset.key==='home'?home():openFolder(b.dataset.key));
 // v26.5.80では人物・仮キャラを追加しない。旧base64人物はDOMに出さない。
 document.querySelectorAll('#sugInspectionPanel img[src^="data:image"]').forEach(x=>x.remove());
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,350));new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});setInterval(mount,1200);window.__SUG_SIX_CATEGORY_NAV__=V;
})();