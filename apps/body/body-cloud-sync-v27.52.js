(()=>{'use strict';
const VERSION='27.52';
const SUPA_URL='https://nnqzxcgkqjnmtzcvorha.supabase.co';
const SUPA_KEY='sb_publishable_zcn7r2YSKDZa1lXJvmk3sg_GulOJXwI';
const KEYS=[
  'sug_body_daily_v1','sug_body_training_log_v1','sug_body_training_draft_v1',
  'sug_v27_ideal','sug_ideal_shadow_v2','sug_body_weight_goal_v1',
  'sug_body_nutrition_weight_v1','sug_body_micronutrition_v1','sug_body_food_ai_v1',
  'sug_points_v27_16','sug_body_weekly_response_v1','sug_body_weekly_plan_v1',
  'sug_body_monthly_review_v1'
];
let sb=null,timer=0,busy=false,lastHash='';
function client(){if(sb)return sb;if(!window.supabase)return null;sb=window.supabase.createClient(SUPA_URL,SUPA_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return sb}
function parse(k){try{const v=localStorage.getItem(k);return v==null?null:JSON.parse(v)}catch{return localStorage.getItem(k)}}
function snapshot(){const data={version:VERSION,capturedAt:new Date().toISOString()};for(const k of KEYS){const v=parse(k);if(v!=null)data[k]=v}const get=id=>document.getElementById(id)?.textContent?.trim()||null;data.health={steps:get('steps'),sleep:get('sleepHealth'),heart:get('heart'),weight:get('weight')};return data}
function hash(v){try{return JSON.stringify(v)}catch{return String(Date.now())}}
async function syncNow(force=false){if(busy)return {ok:false,reason:'BUSY'};const c=client();if(!c)return {ok:false,reason:'SUPABASE_NOT_READY'};const {data:{session}}=await c.auth.getSession();if(!session?.user?.id)return {ok:false,reason:'NO_SESSION'};const payload=snapshot(),h=hash(payload);if(!force&&h===lastHash)return {ok:true,skipped:true};busy=true;try{const {error}=await c.from('body_member_data').upsert({member_id:session.user.id,payload,updated_at:new Date().toISOString()},{onConflict:'member_id'});if(error)return {ok:false,reason:error.message,code:error.code};lastHash=h;window.dispatchEvent(new CustomEvent('sug:body-cloud-sync',{detail:{ok:true,at:Date.now()}}));return {ok:true}}finally{busy=false}}
function queue(ms=700){clearTimeout(timer);timer=setTimeout(()=>syncNow(false),ms)}
function boot(){client();setTimeout(()=>syncNow(true),1200);['sug:ideal-change','sug:points-change','sug:rewards-change'].forEach(n=>window.addEventListener(n,()=>queue(400)));window.addEventListener('storage',()=>queue(600));document.addEventListener('change',()=>queue(900),true);document.addEventListener('click',e=>{if(e.target?.id==='saveTraining')queue(1200)},true);document.addEventListener('visibilitychange',()=>{if(document.hidden)syncNow(false)});setInterval(()=>syncNow(false),60000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.SuGBodyCloudSync={version:VERSION,syncNow,snapshot};
})();
