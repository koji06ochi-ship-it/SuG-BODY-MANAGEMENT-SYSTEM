(()=>{
'use strict';
const V='26.5.229', K='sug_training_sessions_v1';
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
const read=()=>{try{const a=JSON.parse(localStorage.getItem(K)||'[]');return Array.isArray(a)?a:[]}catch(_e){return[]}};
const write=a=>localStorage.setItem(K,JSON.stringify(a.slice(-100)));
const volume=actual=>Math.round(actual.reduce((v,ex)=>v+(ex.sets||[]).reduce((x,s)=>x+((Number(s.reps)>0?(Number(s.load)||0)*Number(s.reps):0)),0),0));
function collect(box){
  return qa('.s176ex',box).map(e=>({
    name:(q('b',e)?.textContent||'').replace(/^\d+\.\s*/,''),
    sets:qa('.s176grid',e).map(r=>{
      const val=k=>q(`[data-role="${k}"]`,r)?.value??'';
      return {set:Number(r.dataset.set)||0,load:val('load')===''?null:Number(val('load')),reps:val('reps')===''?null:Number(val('reps')),rir:val('rir')===''?null:Number(val('rir')),restSec:r.dataset.set==='1'?null:(val('rest')===''?null:Number(val('rest')))};
    })
  }));
}
function renderReview(box,rec){
  box.dataset.stage='review';
  const planned=Number(rec.plannedSets||0), done=Number(rec.completedSets||0), partial=planned>0&&done<planned;
  box.innerHTML=`<h3>⑧ 今日の振り返り</h3><div class="s176summary"><b><span class="${partial?'s176partial':'s176complete'}">${partial?'実施分を保存':'入力SET完了'}</span></b><br>実施SET：${done}${planned?` / 予定${planned}`:''}<br>総重量：${Number(rec.totalVolumeKg||0).toLocaleString()}kg<br>セッションRPE：${rec.rpe??'—'}<br>痛み：${rec.pain??0}</div><label>今日の感覚<textarea id="s176Memo" placeholder="フォーム・効いた部位・違和感など"></textarea></label><button class="s176next" id="s176ReviewNext">次回方針を見る →</button>`;
  q('#s176ReviewNext',box)?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();renderNext(box,rec)},true);
  box.scrollIntoView({behavior:'auto',block:'start'});
}
function renderNext(box,rec){
  const memo=q('#s176Memo',box)?.value||'';
  let next='HOLD'; if(Number(rec.pain)>=5)next='CARE_FIRST'; else if(Number(rec.rpe)>=9)next='LOAD_DOWN'; else if(Number(rec.rpe)>0&&Number(rec.rpe)<=8)next='LOAD_UP';
  const a=read(); const i=a.findIndex(x=>x&&x.sessionId===rec.sessionId); if(i>=0){a[i]={...a[i],memo,next};write(a);rec=a[i]}
  box.dataset.stage='next';
  box.innerHTML=`<h3>⑨ 次回方針</h3><div class="s176summary"><b>${next}</b><br>${next==='LOAD_UP'?'完遂度と主観強度から次回は負荷またはREPを小幅に上げる候補。':next==='LOAD_DOWN'?'疲労度が高いため次回は負荷・SET数を下げる候補。':next==='CARE_FIRST'?'痛み優先。CARE評価後に次回トレーニングを判断。':'現状条件を維持して再現性を確認。'}</div><button class="s176secondary" id="s176Done">TODAY FLOW 完了</button>`;
  q('#s176Done',box)?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const arr=read();const idx=arr.findIndex(x=>x&&x.sessionId===rec.sessionId);const saved={...(idx>=0?arr[idx]:rec),flowClosedAt:new Date().toISOString(),next};if(idx>=0)arr[idx]=saved;else arr.push(saved);write(arr);box.dataset.stage='done';box.innerHTML=`<h3>✓ TODAY FLOW 完了</h3><div class="s176summary">実施した記録を保存しました。<br>実施SET ${saved.completedSets}｜総重量 ${Number(saved.totalVolumeKg||0).toLocaleString()}kg</div>`;window.dispatchEvent(new CustomEvent('sug:session-complete',{detail:{record:saved}}));},true);
}
function finish(e,btn){
  const box=btn.closest('#sug176Session'); if(!box)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  if(box.dataset.stage&&box.dataset.stage!=='entry')return;
  const actual=collect(box), planned=actual.reduce((n,x)=>n+x.sets.length,0);
  actual.forEach(x=>x.sets=(x.sets||[]).filter(s=>Number(s.reps)>0));
  const done=actual.reduce((n,x)=>n+x.sets.length,0); if(!done){alert('REPが1SETも入力されていません。');return}
  const rec={sessionId:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,at:new Date().toISOString(),rpe:Number(q('#s176Rpe',box)?.value)||null,pain:Number(q('#s176Pain',box)?.value)||0,exercises:actual.filter(x=>x.sets.length),plannedSets:planned,completedSets:done,totalSets:done,completion:planned>done?'partial':'complete',completionRatio:planned?done/planned:1,totalVolumeKg:volume(actual),stage:'review',source:'today-flow-v229'};
  const a=read();a.push(rec);write(a);renderReview(box,rec);
}
document.addEventListener('click',e=>{const b=e.target?.closest?.('#s176Finish');if(b)finish(e,b)},true);
const oldOpen=window.SUG_OPEN_SESSION;
if(typeof oldOpen==='function')window.SUG_OPEN_SESSION=function(){const box=q('#sug176Session');if(box&&['review','next','done'].includes(box.dataset.stage)){box.scrollIntoView({behavior:'auto',block:'start'});return}oldOpen.apply(this,arguments);setTimeout(()=>{const x=q('#sug176Session');if(x&&!x.dataset.stage)x.dataset.stage='entry'},0)};
window.__SUG_SESSION_REVIEW_FIX_VERSION__=V;
})();