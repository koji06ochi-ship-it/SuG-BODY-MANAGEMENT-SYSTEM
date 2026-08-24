(()=>{
'use strict';
const V='26.5.164';
const q=new URLSearchParams(location.search);
const memberEntry=q.get('entry')==='member'||q.get('member')==='1';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
function rawRole(){try{return String(window.SUG_MEMBER_ACCESS?.state?.()?.role||window.currentRole||currentRole||'')}catch(_e){return String(window.currentRole||'')}}
function user(){try{return window.sessionUser||sessionUser||null}catch(_e){return window.sessionUser||null}}
function authenticatedMember(){return !!user()&&rawRole()==='member'}
function trainer(){return !!user()&&rawRole()==='trainer'}
function showPanel(panel,anchor){if(!panel)return false;$('#sugCanonicalFolder')?.remove();document.body.style.overflow='';$$('.panel').forEach(p=>{p.classList.remove('active');p.style.removeProperty('display')});panel.classList.add('active');panel.style.setProperty('display','block','important');setTimeout(()=>{try{(anchor||panel).scrollIntoView({block:'start'})}catch(_e){}},30);return true}
function panelByText(re){return $$('.panel').find(p=>re.test(p.textContent||''))||null}
function ensureMemberSecurity(){
  const r=rawRole(),u=user();
  if(memberEntry&&u&&r&&r!=='member'&&r!=='trainer')return;
  const manage=$('#sugCanonicalNav .sug98Card[data-key="manage"]');
  if(authenticatedMember()){manage?.style.setProperty('display','none','important');$('#adminBoard')?.style.setProperty('display','none','important')}
  else if(trainer())manage?.style.removeProperty('display');
}
function fallbackIdeal(){
 let o=$('#sug164Ideal');if(o)return o;
 o=document.createElement('section');o.id='sug164Ideal';o.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#070708;color:#fff;padding:max(22px,env(safe-area-inset-top)) 16px 30px;overflow:auto;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
 const types=[['slim','SLIM','スリム'],['athletic','ATHLETIC','アスレチック'],['fitness','FITNESS','フィットネス'],['muscular','MUSCULAR','マスキュラー'],['physique','PHYSIQUE','フィジーク']];
 o.innerHTML='<div style="max-width:620px;margin:auto"><button id="s164Close" style="float:right;border:1px solid #555;background:#151515;color:#fff;border-radius:50%;width:42px;height:42px">×</button><div style="color:#d8b35b;font-weight:900;font-size:12px">S.u.G OSAKA</div><h2 style="color:#f3d98b">理想の体型を選ぶ</h2><p style="color:#aaa;font-size:12px">1つ選ぶと、そのまま今日の流れへ進みます。</p><div id="s164Types" style="display:grid;gap:10px">'+types.map((t,i)=>'<button data-key="'+t[0]+'" data-name="'+t[1]+'" style="text-align:left;padding:16px;border:1px solid #5a4a25;border-radius:14px;background:#12110d;color:#fff"><b style="color:#f3d98b;font-size:16px">'+t[1]+'</b><br><small style="color:#aaa">'+t[2]+'</small></button>').join('')+'</div></div>';
 document.body.appendChild(o);$('#s164Close',o).onclick=()=>o.remove();$$('#s164Types button',o).forEach(b=>b.onclick=()=>{saveFallbackIdeal(b.dataset.key,b.dataset.name);o.remove();proceedToday()});return o
}
function saveFallbackIdeal(key,name){try{const mm=typeof m==='function'?m():null;if(mm){mm.goalPlan=mm.goalPlan||{};mm.goalPlan.idealVisionType=key;mm.goalPlan.idealVisionName=name;mm.goalPlan.idealVisionSelectedAt=new Date().toISOString();try{window.save?.()}catch(_e){}try{window.persist?.()}catch(_e){}}}catch(_e){}
}
function openIdeal(){
 const modal=$('#idealVisionModal');let opened=false;
 try{if(typeof window.openIdealVision==='function'){window.openIdealVision();opened=true}}catch(_e){}
 if(modal){modal.classList.add('open');modal.setAttribute('aria-hidden','false');modal.style.setProperty('display','block','important');modal.style.setProperty('z-index','2147483646','important');document.body.style.overflow='hidden';opened=true}
 if(!opened)fallbackIdeal();
}
function proceedToday(){
 $('#sug-guided-flow')?.remove();try{window.closeIdealVision?.()}catch(_e){}document.body.style.overflow='';
 const smart=$('#smart');if(smart)showPanel(smart);
 setTimeout(()=>{const a=$('#smartAppetite');if(a){a.disabled=false;a.style.setProperty('pointer-events','auto','important');try{a.scrollIntoView({behavior:'smooth',block:'center'})}catch(_e){}}},120)
}
function bindIdeal(){
 const b=$('#sugIdealLaunch');if(b){b.disabled=false;b.style.setProperty('pointer-events','auto','important');b.onclick=(e)=>{e.preventDefault();e.stopPropagation();openIdeal()}}
}
function inspectionRoute(label){
 const rules=[[/AROM|PROM/i,/AROM|PROM/i],[/胸椎/i,/胸椎/i],[/SHR|肩甲上腕/i,/SHR|肩甲上腕/i],[/Joint|JOINT/i,/Joint by Joint|JOINT BY JOINT/i],[/動作スクリーン|MOVEMENT/i,/動作スクリーン|MOVEMENT/i],[/特殊テスト|SPECIAL/i,/特殊テスト|SPECIAL TEST/i],[/NEURO/i,/NEURO/i],[/Before|After/i,/BEFORE|AFTER/i]];
 for(const [a,b] of rules){if(a.test(label)){const p=panelByText(b);if(p)return showPanel(p)}}return false
}
function fixInspectionFolder(){
 if(!trainer())return;const folder=$('#sugCanonicalFolder');if(!folder||!/検査/.test($('.sug98Head h1',folder)?.textContent||''))return;
 const grid=$('.sug98Grid',folder);if(!grid)return;
 const wanted=[['AROM・PROM','↔'],['胸椎ROM','↕'],['SHR','◈'],['Joint by Joint','◎'],['動作スクリーン','◇'],['特殊テスト','📋'],['NEURO','🧠'],['Before・After','◐']];
 grid.innerHTML=wanted.map((x,i)=>'<button class="sug98App" data-label="'+x[0]+'"><span>'+x[1]+'</span><b>'+x[0]+'</b></button>').join('');
 $$('.sug98App',grid).forEach(b=>b.onclick=()=>inspectionRoute(b.dataset.label||b.textContent||''));
}
function healthData(){try{return JSON.parse(localStorage.getItem('sug_health_latest')||'null')}catch(_e){return null}}
function parseHealthHash(){if(!location.hash||location.hash.length<2)return null;const p=new URLSearchParams(location.hash.slice(1));const n=(...ks)=>{for(const k of ks){const v=p.get(k);if(v!==null&&v!==''){const x=Number(v);if(Number.isFinite(x))return x}}return null};const d={steps:n('steps','step'),sleep:n('sleep','sleepHours'),hr:n('hr','heartRate'),weight:n('weight')};return Object.values(d).some(v=>v!==null)?d:null}
function paintHealth(d){if(!d)return;const vals=$$('#sugHealthMetrics .sugHealthMetric b');if(vals[0]&&d.steps!=null)vals[0].textContent=Math.round(d.steps).toLocaleString();if(vals[1]&&d.sleep!=null)vals[1].textContent=Number(d.sleep).toFixed(1)+'h';if(vals[2]&&d.hr!=null)vals[2].textContent=Math.round(d.hr)+' bpm';if(vals[3]&&d.weight!=null)vals[3].textContent=Number(d.weight).toFixed(1)+'kg';const badge=$('#sugHealthBadge');if(badge){badge.textContent='連携済';badge.classList.add('ok')}const st=$('#sugHealthStatus');if(st)st.textContent='最新のヘルスケアデータを反映済み';if(d.steps!=null){const a=$('#aSteps'),m=$('#sugHealthManualSteps');if(a)a.value=Math.round(d.steps);if(m)m.value=Math.round(d.steps)}if(d.sleep!=null){const m=$('#sugHealthManualSleep');if(m)m.value=Number(d.sleep).toFixed(1)}
}
function saveHealth(d){if(!d)return;const merged={...(healthData()||{}),...Object.fromEntries(Object.entries(d).filter(([,v])=>v!=null)),at:new Date().toISOString()};localStorage.setItem('sug_health_latest',JSON.stringify(merged));paintHealth(merged);try{window.saveSugManualHealth?.()}catch(_e){}if(location.hash)history.replaceState(null,'',location.pathname+location.search)}
function fixHealth(){const card=$('#sugHealthSyncCard');if(!card)return;const incoming=parseHealthHash();if(incoming)saveHealth(incoming);else paintHealth(healthData());const run=$$('button',card).find(b=>/ショートカット|S\.u\.G連携/.test(b.textContent||''));if(run){run.textContent='S.u.G連携を実行';run.onclick=()=>{location.href='shortcuts://run-shortcut?name='+encodeURIComponent('S.u.G Health Sync')}}const url=$('#sugHealthShortcutUrl');if(url&&user()){const base=location.origin+location.pathname+location.search.split('#')[0];url.textContent=base+'#steps=[歩数]&sleep=[睡眠]&hr=[心拍]&weight=[体重]'}
}
function recoveryAutofill(){const d=healthData();if(!d)return;const steps=$('#s149Steps'),sleep=$('#s149Sleep');if(steps&&steps.value===''&&d.steps!=null){steps.value=Math.round(d.steps);steps.dispatchEvent(new Event('input',{bubbles:true}))}if(sleep&&!sleep.value&&d.sleep!=null){sleep.value=d.sleep>=7?'good':d.sleep>=5?'mid':'low';sleep.dispatchEvent(new Event('change',{bubbles:true}))}}
function tick(){ensureMemberSecurity();bindIdeal();fixInspectionFolder();fixHealth();recoveryAutofill()}
function boot(){tick();const mo=new MutationObserver(tick);mo.observe(document.body,{childList:true,subtree:true});[100,300,700,1500,3000].forEach(t=>setTimeout(tick,t));setInterval(tick,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.__SUG_FINALIZER_VERSION__=V;
})();