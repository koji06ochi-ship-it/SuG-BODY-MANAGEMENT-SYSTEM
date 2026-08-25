(()=>{
'use strict';
const VERSION='26.5.195';
let obs=null,stopTimer=0;
function member(){try{return typeof m==='function'?m():null}catch(_e){return null}}
function todayIso(){const d=new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function latestRecoveryRow(){const x=member();const rows=Array.isArray(x?.recovery)?x.recovery:[];return rows.slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).at(-1)||null}
function todayActivityRow(){const x=member(),t=todayIso();const rows=Array.isArray(x?.activity)?x.activity:[];return rows.filter(r=>r?.date===t).at(-1)||rows.slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).at(-1)||null}
function sleepChoice(hours){hours=Number(hours);if(!Number.isFinite(hours)||hours<=0)return'';return hours>=7?'good':hours>=5?'mid':'low'}
function fatigueChoice(v){v=Number(v);if(!Number.isFinite(v)||v<=0)return'';return v<=3?'low':v<=6?'mid':'high'}
function setIfBlank(id,value){const el=document.getElementById(id);if(!el||value===''||value==null||String(el.value||'')!=='')return false;el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true}
function stop(){try{obs?.disconnect()}catch(_e){}obs=null;clearTimeout(stopTimer)}
function prefill(){const gate=document.getElementById('sug149Recovery');if(!gate||gate.dataset.autofillDone==='1')return false;const r=latestRecoveryRow(),a=todayActivityRow();setIfBlank('s149Sleep',sleepChoice(r?.sleep));setIfBlank('s149Fatigue',fatigueChoice(r?.fatigue));if(Number.isFinite(Number(a?.steps)))setIfBlank('s149Steps',Math.max(0,Math.round(Number(a.steps))));if(Number.isFinite(Number(r?.pain)))setIfBlank('s149Pain',Math.max(0,Math.min(10,Math.round(Number(r.pain)))));gate.dataset.autofillDone='1';const filled=['s149Sleep','s149Fatigue','s149Steps','s149Pain'].filter(id=>String(document.getElementById(id)?.value||'')!=='').length;let n=document.getElementById('sug152AutoNote');if(!n){n=document.createElement('div');n.id='sug152AutoNote';n.style.cssText='margin:9px 0 0;font-size:10px;line-height:1.55;color:#86d7a8';gate.querySelector('p')?.after(n)}n.textContent=filled===4?'保存済みの睡眠・疲労・歩数・痛みを自動反映しました。':'保存済みデータを自動反映しました。未取得項目だけ入力してください。';try{window.evaluateRecovery?.()}catch(_e){}stop();return true}
function arm(ms=5000){if(prefill())return;stop();obs=new MutationObserver(()=>{if(prefill())stop()});obs.observe(document.body,{childList:true,subtree:true});stopTimer=setTimeout(stop,ms);setTimeout(prefill,120);setTimeout(prefill,500)}
function boot(){arm(8000);document.addEventListener('change',e=>{if(e.target?.closest?.('#smart'))arm(2200)},true);document.addEventListener('click',e=>{if(e.target?.closest?.('#sug149Apply,.sug149-next,#smart button'))arm(2200)},true);window.addEventListener('pageshow',()=>arm(3000));window.addEventListener('sug:session-complete',stop)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.__SUG_RECOVERY_AUTOFILL_VERSION__=VERSION;
})();