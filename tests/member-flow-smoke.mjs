import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const read=p=>fs.readFileSync(p,'utf8');
const must=(src,re,msg)=>assert.match(src,re,msg);
const sw=read('sw.js');
const memberHub=read('member-hub.html');
const session=read('assets/ui/v26.5.176/session-flow.js');
const home=read('assets/ui/v26.5.192/member-home-final.js');
const next=read('assets/ui/v26.5.199/next-load-home.js');
const training=read('assets/ui/v26.5.175/training-start.js');
const health=read('assets/health-sync/v26.5.27/engine.js');
const quest=read('assets/ui/v26.5.200/quest-entry.js');
const BASE=(process.env.SUG_BASE_URL||'http://127.0.0.1:8080').replace(/\/$/,'');

must(sw,/flow-scroll-controller\.js/,'member injector inventory must be explicit');
must(sw,/skip=new Set\(\[[\s\S]*flow-scroll-controller\.js[\s\S]*startup-recovery\.js[\s\S]*flow-bootstrap\.js/,'member mode must skip legacy scroll/bootstrap controllers');
must(sw,/member-performance\.js/,'member performance patch must be injected');
must(memberHub,/entry=member&hub=1/,'member hub BODY must load member runtime mode');
must(memberHub,/quest\.html/,'member hub QUEST route missing');
must(session,/status:total&&completed===total\?'complete':completed>0\?'partial':'none'/,'partial/full completion rule missing');
must(session,/totalVolumeKg:totalVolume\(actual\)/,'session total volume persistence missing');
must(session,/LOAD_UP/,'next overload candidate missing');
must(session,/flowClosedAt:new Date\(\)\.toISOString\(\)/,'flow completion persistence missing');
for(const label of ['進捗','総重量','完了SET','予定達成','次回予定']) assert.ok(home.includes(label),`HOME progress missing ${label}`);
assert.ok(home.includes('予定ペース達成')&&home.includes('次の1回'),'HOME motivation messaging missing');
must(home,/dayKey\(d0\(r\?\.at\)\)===todayKey\(\)/,'HOME today stats must be date-scoped');
must(training,/todayKey\(r\.at\)===todayKey\(\)/,'training completion state must be date-scoped');
must(next,/NEXT LOAD/,'NEXT LOAD HOME output missing');
must(training,/本日のトレーニング完了/,'closed training state missing');
must(health,/latestWeight\(mem\)/,'health weight must fall back to latest stored value');
must(health,/steps.*sleep.*heart.*weight/s,'health import must support steps/sleep/heart/weight');
must(quest,/quest\.html/,'QUEST entry route missing');

const browser=await chromium.launch({headless:true});
const today=new Date();
const isoDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const deadline=new Date(today); deadline.setDate(deadline.getDate()+28);

async function openSeed(seed){
  const context=await browser.newContext();
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.stack||String(e)));
  page.on('console',m=>{if(m.type()==='error') errors.push(`${m.text()} @ ${m.location().url||''}:${m.location().lineNumber||0}:${m.location().columnNumber||0}`)});
  await page.addInitScript(seed=>{for(const [k,v] of Object.entries(seed)) localStorage.setItem(k,JSON.stringify(v));},seed);
  await page.goto(`${BASE}/?entry=member&smoke=${Date.now()}`,{waitUntil:'domcontentloaded'});
  await page.waitForURL(/entry=member/,{timeout:15000});
  await page.waitForTimeout(4500);
  return {context,page,errors};
}

{
  const now=new Date().toISOString();
  const plan={input:{goalType:'筋肥大',deadline:isoDate(deadline),trainingDays:3},feas:{weeks:4},week:[{parts:['胸']},{parts:['背中']},{parts:['脚']}],createdAt:now};
  const rec={at:now,flowClosedAt:now,completion:'complete',completedSets:2,totalSets:2,totalVolumeKg:120,next:'LOAD_UP',exercises:[{name:'TEST PRESS',sets:[{set:1,load:10,reps:5,rir:2},{set:2,load:10,reps:7,rir:1}]}]};
  const {context,page,errors}=await openSeed({
    sug_goal_shadow_v2:{memberKey:'',at:now,goalPlan:{idealVisionType:'physique',lastPlan:plan,generatedAt:now}},
    sug_ideal_shadow_v2:{memberKey:'',at:now,idealVisionType:'physique'},
    sug_training_sessions_v1:[rec]
  });
  const result=await page.evaluate(async()=>{
    const text=document.body.innerText;
    const scripts=[...document.scripts].map(s=>s.src).filter(Boolean);
    const before=document.body.classList.contains('sug-today-flow');
    const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
    const target=Math.min(500,max);
    window.scrollTo(0,target);
    await new Promise(r=>setTimeout(r,350));
    return {text,scripts,before,max,target,y:scrollY};
  });
  assert.ok(result.text.includes('120kg')||result.text.includes('120 kg'),'HOME total volume not rendered');
  assert.ok(result.text.includes('2 SET'),'HOME completed SET count not rendered');
  assert.ok(result.text.includes('NEXT LOAD｜LOAD_UP'),'NEXT LOAD did not render');
  assert.ok(result.text.includes('予定達成'),'goal adherence did not render');
  assert.ok(result.text.includes('次回予定'),'next schedule did not render');
  assert.ok(result.text.includes('本日の記録を見る')||result.text.includes('本日のトレーニング完了'),'completed state button/card did not render');
  assert.equal(result.before,false,'completed flow still leaves sug-today-flow scroll lock active');
  for(const bad of ['flow-scroll-controller.js','startup-recovery.js','flow-bootstrap.js','movement-ai.js','trainer-clinical-guard.js']) assert.equal(result.scripts.some(x=>x.includes(bad)),false,`legacy member script still loaded: ${bad}`);
  assert.ok(result.scripts.some(x=>x.includes('member-performance.js')),'member performance patch not loaded');
  if(result.max>200) assert.ok(Math.abs(result.y-result.target)<120,`scroll position was hijacked (${result.target}→${result.y})`);
  assert.equal(errors.length,0,`completed-flow page errors:\n${errors.join('\n---\n')}`);
  await context.close();
}

{
  const yesterday=new Date(); yesterday.setDate(yesterday.getDate()-1); yesterday.setHours(18,0,0,0);
  const at=yesterday.toISOString();
  const stale={at,flowClosedAt:at,completion:'partial',completedSets:2,totalSets:7,totalVolumeKg:350,next:'HOLD',exercises:[{name:'YESTERDAY ONLY',sets:[{set:1,load:10,reps:15},{set:2,load:10,reps:20}]}]};
  const {context,page,errors}=await openSeed({sug_training_sessions_v1:[stale]});
  const text=await page.evaluate(()=>document.body.innerText);
  assert.ok(!text.includes('本日のトレーニングは部分完了'),'yesterday partial state leaked into today');
  assert.ok(!text.includes('追加トレーニングを開始'),'yesterday add-training state leaked into today');
  assert.ok(text.includes('今日の総重量')&&text.includes('0kg'),'today total must reset when only yesterday has training');
  assert.equal(errors.length,0,`day-rollover page errors:\n${errors.join('\n---\n')}`);
  await context.close();
}

{
  const {context,page,errors}=await openSeed({});
  const healthResult=await page.evaluate(()=>{
    if(typeof window.importSugHealthPayload!=='function') return {ok:false,reason:'health import function missing'};
    const r=window.importSugHealthPayload({steps:4321,sleep:7.5,heart:61,weight:67.5});
    if(typeof window.renderSugHealthSync==='function') window.renderSugHealthSync();
    return {ok:!!r?.ok,text:document.getElementById('sugHealthMetrics')?.innerText||''};
  });
  assert.equal(healthResult.ok,true,'health 4-metric payload was not accepted');
  for(const value of ['4,321','7.5','61','67.5']) assert.ok(healthResult.text.includes(value),`health metric missing from display: ${value}`);
  assert.equal(errors.length,0,`health page errors:\n${errors.join('\n---\n')}`);
  await context.close();
}

await browser.close();
console.log(`MEMBER FLOW SMOKE PASS ${BASE}`);
