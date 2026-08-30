(()=>{'use strict';
const FALLBACK_CONFIG={url:'https://nnqzxcgkqjnmtzcvorha.supabase.co',publishableKey:'sb_publishable_zcn7r2YSKDZa1lXJvmk3sg_GulOJXwI'};
const ROM_TYPES=new Set(['PAIN_LIMITED_ROM','PASSIVE_LIMIT','ACTIVE_PASSIVE_GAP','AROM_LOW_PROM_UNKNOWN','ASYMMETRY','THORACIC_MOBILITY','DATA_RECHECK']);
const MOVEMENT_TYPES=new Set(['MOVEMENT_CONTROL','SHOULDER_COORDINATION']);
const CARE_MAX_AGE_DAYS=45;
function cloudConfig(){
  const scopes=[window];
  try{if(window.parent&&window.parent!==window)scopes.push(window.parent)}catch(_){}
  try{if(window.top&&window.top!==window&&window.top!==window.parent)scopes.push(window.top)}catch(_){}
  for(const scope of scopes){
    try{const c=scope.SUG_CLOUD_CONFIG;if(c?.url&&c?.publishableKey)return c;}catch(_){}
  }
  return FALLBACK_CONFIG;
}
function localTodayKey(){
  const d=new Date(),p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}
function latestRecovery(data){
  const rows=Array.isArray(data?.recovery)?data.recovery:[];
  return rows.slice().sort((a,b)=>String(a?.date||'').localeCompare(String(b?.date||''))).at(-1)||null;
}
function currentRecovery(data){
  const r=latestRecovery(data);
  return r&&String(r?.date||'')===localTodayKey()?r:null;
}
function careResponseFromRow(x){
  const pb=x?.painBefore==null?null:Number(x.painBefore),pa=x?.painAfter==null?null:Number(x.painAfter);
  const painDelta=Number.isFinite(pb)&&Number.isFinite(pa)?pb-pa:null;
  const rb=x?.romBefore==null?null:Number(x.romBefore),ra=x?.romAfter==null?null:Number(x.romAfter);
  const romDelta=Number.isFinite(rb)&&Number.isFinite(ra)?ra-rb:null;
  const mb=x?.movementBefore==null?null:Number(x.movementBefore),ma=x?.movementAfter==null?null:Number(x.movementAfter);
  const movementDelta=Number.isFinite(mb)&&Number.isFinite(ma)?mb-ma:null;
  return {painDelta,romDelta,movementDelta,improved:(painDelta!=null&&painDelta>0)||(romDelta!=null&&romDelta>0)||(movementDelta!=null&&movementDelta>0),worsened:(painDelta!=null&&painDelta<0)||(romDelta!=null&&romDelta<0)||(movementDelta!=null&&movementDelta<0)};
}
function ageDays(v){
  const raw=String(v||'').trim();if(!raw)return Infinity;
  const t=Date.parse(raw.length===10?raw+'T00:00:00':raw);if(!Number.isFinite(t))return Infinity;
  return Math.max(0,(Date.now()-t)/86400000);
}
function latestCare(data,recovery){
  const signals=[];
  for(const c of (Array.isArray(data?.selfCare)?data.selfCare:[])){
    if(c?.result==='medical'||c?.result==='stop')signals.push({c,pain:Number(c.painAfter??c.painBefore??0),at:c.savedAt||c.date,signal:'immediate'});
    else if(c?.result==='selfcare'&&c?.painAfter!=null)signals.push({c,pain:Number(c.painAfter),at:c.savedAt||c.date,signal:'immediate'});
    const f=c?.followup24h;if(f?.pain!=null)signals.push({c,pain:Number(f.pain),at:f.savedAt||f.date,signal:'followup'});
  }
  const currentSignals=signals.filter(s=>ageDays(s.at)<=CARE_MAX_AGE_DAYS);
  currentSignals.sort((a,b)=>String(a?.at||'').localeCompare(String(b?.at||'')));
  const s=currentSignals.at(-1)||null;
  if(s){
    const c=s.c,f=c?.followup24h,response=careResponseFromRow(c);
    return {pain:Number.isFinite(s.pain)?s.pain:0,pain_area:c?.area||null,red_flag:c?.result==='medical'||c?.result==='stop',response_state:s.signal==='followup'?(f?.status||'same'):response.worsened?'worse':response.improved?'better':'same',care_signal:s.signal};
  }
  return {pain:Number(recovery?.pain||0),pain_area:null,red_flag:false,response_state:'unknown',care_signal:'recovery'};
}
function latestIntegrated(data){
  const rows=Array.isArray(data?.integratedAssessments)?data.integratedAssessments:[];
  return rows.slice().sort((a,b)=>String(a?.createdAt||a?.date||'').localeCompare(String(b?.createdAt||b?.date||''))).at(-1)||null;
}
function dateKey(v){const s=String(v||'').trim(),m=s.match(/^(\d{4}-\d{2}-\d{2})/);return m?m[1]:null;}
function movementAssessmentCurrent(integrated,recovery){
  const assessed=dateKey(integrated?.createdAt||integrated?.date);if(!assessed)return false;
  const recoveryDate=dateKey(recovery?.date);if(recoveryDate)return assessed>=recoveryDate;
  return assessed===localTodayKey();
}
function gateStatus(cls){const c=String(cls||'').toLowerCase();if(c==='bad')return 'FAIL';if(c==='warn')return 'CAUTION';if(c==='good')return 'PASS';return 'UNKNOWN';}
function movementFromIntegrated(data,recovery){
  const integrated=latestIntegrated(data);
  if(!integrated||!movementAssessmentCurrent(integrated,recovery))return {rom_status:'UNKNOWN',movement_status:'UNKNOWN'};
  const candidates=Array.isArray(integrated.candidates)&&integrated.candidates.length?integrated.candidates:(Array.isArray(integrated.top)?integrated.top:[]);
  function strongest(types){const rows=candidates.filter(x=>types.has(String(x?.type||'')));if(!rows.length)return 'UNKNOWN';rows.sort((a,b)=>Number(b?.score||0)-Number(a?.score||0));return gateStatus(rows[0]?.nextLoadGate?.cls||rows[0]?.level);}
  return {rom_status:strongest(ROM_TYPES),movement_status:strongest(MOVEMENT_TYPES)};
}
function conditionFromData(data){
  const r=currentRecovery(data);
  return {recovery:r?{sleep_minutes:Number(r.sleep||0)*60,fatigue:Number(r.fatigue||0),stress:Number(r.stress||0)}:null,care:latestCare(data,r),movement:movementFromIntegrated(data,r)};
}
async function read(auth){
  if(!auth?.access_token||!auth?.user?.id)return {ok:false,error:'AUTH_REQUIRED'};
  const cfg=cloudConfig();if(!cfg?.url||!cfg?.publishableKey)return {ok:false,error:'CLOUD_CONFIG_MISSING'};
  try{
    const url=cfg.url+'/rest/v1/member_data?user_id=eq.'+encodeURIComponent(auth.user.id)+'&select=data,updated_at&limit=1';
    const res=await fetch(url,{headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+auth.access_token,Accept:'application/json'}});
    const text=await res.text();let body=null;try{body=text?JSON.parse(text):null}catch(_){}
    if(!res.ok)return {ok:false,error:body?.message||`HTTP_${res.status}`};
    const row=Array.isArray(body)?body[0]:null;if(!row?.data)return {ok:false,error:'MEMBER_DATA_MISSING'};
    return {ok:true,source:'member_data',updatedAt:row.updated_at||null,condition:conditionFromData(row.data)};
  }catch(e){return {ok:false,error:String(e?.message||e||'NETWORK_ERROR')};}
}
window.SuGCanonicalCondition={read,conditionFromData,latestRecovery,currentRecovery,latestCare,careResponseFromRow,latestIntegrated,movementFromIntegrated,movementAssessmentCurrent,ageDays,localTodayKey};
})();
