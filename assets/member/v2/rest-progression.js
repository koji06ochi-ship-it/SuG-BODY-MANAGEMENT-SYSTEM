(()=>{'use strict';
const SESSION_KEY='sug_training_sessions_v2';
const parseRest=v=>{const m=String(v||'').match(/\d+/);return m?Number(m[0]):null};
const best=ex=>{let out=null;(ex?.sets||[]).filter(s=>s.done&&+s.load>0&&+s.reps>0).forEach(s=>{const reps=+s.reps,load=+s.load,rir=Math.max(0,+s.rir||0),effective=Math.min(15,reps+rir),e=load*(1+effective/30);if(!out||e>out.e)out={e,load,reps,rir}});return out};
const prior=(name,sessions,currentDate)=>{for(let i=sessions.length-1;i>=0;i--){const s=sessions[i];if(!s||s.date===currentDate)continue;const ex=s.exercises?.find(x=>x.name===name);const b=best(ex);if(b)return {session:s,exercise:ex,best:b}}return null};
function classify(cur,prev,mode,curRest,prevRest){if(!cur)return {next:'DATA LOW',reason:'有効な重量・REPデータ不足'};if(mode==='CARE FIRST')return {next:'CARE FIRST',reason:'痛み・CARE判定を優先'};if(mode==='RECOVERY')return {next:'RECOVERY FIRST',reason:'全身回復判定を優先'};if(!prev)return {next:'HOLD',reason:'同種目の比較データ待ち'};
const diff=(cur.e-prev.e)/prev.e*100;
if(curRest&&prevRest&&curRest<prevRest-30&&diff<0)return {next:'REST ADJUST',reason:`REST ${prevRest}秒→${curRest}秒。短縮条件での低下なので筋力低下と判定しない`,diff};
if(Math.abs(cur.rir-prev.rir)>=2&&diff<0)return {next:'DATA LOW',reason:`RIR条件差 ${prev.rir}→${cur.rir}。同条件比較を優先`,diff};
if(cur.rir>=4)return {next:'HOLD',reason:'余力が大きいため同条件データを追加',diff};
if(diff>=2&&cur.rir>=1)return {next:'LOAD UP',reason:'同等REST/RIR条件でe1RM向上',diff};
if(diff<=-5)return {next:'LOAD DOWN',reason:'同等条件でe1RMが5%以上低下',diff};
return {next:'HOLD',reason:'変動は維持範囲',diff};}
function analyze(session,sessions){return (session?.exercises||[]).map(ex=>{const cur=best(ex);if(!cur)return null;const p=prior(ex.name,sessions,session.date),curRest=parseRest(ex.rest),prevRest=parseRest(p?.exercise?.rest),result=classify(cur,p?.best,session.mode,curRest,prevRest);return {name:ex.name,e1rm:cur.e,load:cur.load,reps:cur.reps,rir:cur.rir,previousE1rm:p?.best?.e??null,previousRir:p?.best?.rir??null,currentRest:curRest,previousRest:prevRest,...result}}).filter(Boolean)}
window.SuGRestProgression={analyze,parseRest};
window.addEventListener('sug:session-complete',e=>{try{const sessions=JSON.parse(localStorage.getItem(SESSION_KEY)||'[]');const data=analyze(e.detail,sessions);localStorage.setItem('sug_progression_rest_v2',JSON.stringify({date:e.detail?.date,at:new Date().toISOString(),items:data}))}catch(_){}});
})();