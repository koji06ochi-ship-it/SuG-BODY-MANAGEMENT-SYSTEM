(()=>{'use strict';
const V='26.5.197',GK2='sug_goal_shadow_v2',IK2='sug_ideal_shadow_v2',GK1='sug_goal_shadow_v1',IK1='sug_ideal_shadow_v1',FLAG='sug197_state_migrated_reload';
function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_e){return null}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(_e){return false}}
function member(){try{return typeof window.m==='function'?window.m():null}catch(_e){return null}}
function persist(){try{if(typeof window.persist==='function')window.persist();else if(typeof window.save==='function')window.save()}catch(_e){}}
function memberKey(x){return String(x?.id||x?.memberId||x?.email||x?.name||'')}
function sameMember(saved,x){const a=String(saved?.memberKey||''),b=memberKey(x);return !a||!b||a===b}
function present(v){return v!==undefined&&v!==null&&v!==''}
const FIELDS=['goalType','deadline','targetWeight','targetBodyFat','idealNote','idealImagePath','energyAnchor','priority1','priority2','priority3','trainingDays','sessionMinutes','generatedAt','lastPlan','idealVisionType','idealVisionGender','idealVisionName','idealVisionBodyFat','idealVisionMuscle','idealVisionSelectedAt'];
function scoreGoal(g){if(!g||typeof g!=='object')return 0;let s=0;if(g.idealVisionType)s+=8;if(g.lastPlan)s+=12;if(g.generatedAt)s+=4;if(g.deadline)s+=3;if(Number(g.targetWeight)>0)s+=2;if(Number(g.targetBodyFat)>0)s+=2;if(g.idealVisionSelectedAt)s+=3;return s}
function mergeGoal(a,b){const A=a&&typeof a==='object'?a:{},B=b&&typeof b==='object'?b:{};const primary=scoreGoal(A)>=scoreGoal(B)?A:B,secondary=primary===A?B:A,out={...secondary,...primary};for(const k of FIELDS)if(!present(out[k])&&present(secondary[k]))out[k]=secondary[k];return out}
function mergeIdeal(a,b){const A=a&&typeof a==='object'?a:{},B=b&&typeof b==='object'?b:{};const sa=(A.idealVisionType?4:0)+(A.at?1:0),sb=(B.idealVisionType?4:0)+(B.at?1:0),primary=sa>=sb?A:B,secondary=primary===A?B:A;return {...secondary,...primary}}
function migrate(){let changed=false;const x=member(),oldG=read(GK1),oldI=read(IK1),newG=read(GK2),newI=read(IK2);const key=memberKey(x);
 const legacyGoal=oldG?.goalPlan&&(!x||sameMember(oldG,x))?oldG.goalPlan:null;
 const currentGoal=newG?.goalPlan&&(!x||sameMember(newG,x))?newG.goalPlan:null;
 const mergedGoal=mergeGoal(currentGoal,legacyGoal);
 if(Object.keys(mergedGoal).length){const next={memberKey:newG?.memberKey||oldG?.memberKey||key,at:new Date().toISOString(),goalPlan:mergedGoal};if(JSON.stringify(newG?.goalPlan||{})!==JSON.stringify(mergedGoal)){write(GK2,next);changed=true}}
 const legacyIdeal=oldI&&(!x||sameMember(oldI,x))?oldI:null,currentIdeal=newI&&(!x||sameMember(newI,x))?newI:null,mergedIdeal=mergeIdeal(currentIdeal,legacyIdeal);
 if(mergedIdeal?.idealVisionType&&JSON.stringify(currentIdeal||{})!==JSON.stringify(mergedIdeal)){write(IK2,{...mergedIdeal,memberKey:mergedIdeal.memberKey||key,at:new Date().toISOString()});changed=true}
 if(x){x.goalPlan=x.goalPlan||{};const shadow=read(GK2)?.goalPlan||mergedGoal,ideal=read(IK2)||mergedIdeal;const before=JSON.stringify(x.goalPlan);const richer=mergeGoal(x.goalPlan,shadow);Object.assign(x.goalPlan,richer);if(ideal?.idealVisionType&&sameMember(ideal,x)){x.goalPlan.idealVisionType=ideal.idealVisionType;if(ideal.idealVisionGender)x.goalPlan.idealVisionGender=ideal.idealVisionGender;if(ideal.idealVisionName)x.goalPlan.idealVisionName=ideal.idealVisionName;if(ideal.idealVisionBodyFat)x.goalPlan.idealVisionBodyFat=ideal.idealVisionBodyFat;if(ideal.idealVisionMuscle)x.goalPlan.idealVisionMuscle=ideal.idealVisionMuscle;if(ideal.idealVisionSelectedAt)x.goalPlan.idealVisionSelectedAt=ideal.idealVisionSelectedAt}if(before!==JSON.stringify(x.goalPlan)){persist();changed=true}}
 document.getElementById('sug189HomeProgress')?.remove();document.getElementById('sug190HomeProgress')?.remove();try{window.SUG_RENDER_MEMBER_HOME_FINAL?.()}catch(_e){}
 if(changed&&sessionStorage.getItem(FLAG)!=='1'){sessionStorage.setItem(FLAG,'1');const u=new URL(location.href);u.searchParams.set('v',V);u.searchParams.set('fresh',Date.now());location.replace(u.toString());return}sessionStorage.removeItem(FLAG);window.__SUG_STATE_MIGRATION_VERSION__=V}
function boot(){setTimeout(migrate,40);setTimeout(()=>{try{window.SUG_RENDER_MEMBER_HOME_FINAL?.()}catch(_e){}},220)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();