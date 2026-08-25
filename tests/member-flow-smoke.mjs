import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const read=p=>fs.readFileSync(p,'utf8');
const must=(src,re,msg)=>assert.match(src,re,msg);
const sw=read('sw.js');
const session=read('assets/ui/v26.5.176/session-flow.js');
const home=read('assets/ui/v26.5.192/member-home-final.js');
const next=read('assets/ui/v26.5.199/next-load-home.js');
const training=read('assets/ui/v26.5.175/training-start.js');
const migration=read('assets/ui/v26.5.193/state-migration.js');

must(sw,/flow-scroll-controller\.js','member injector inventory must be explicit');
must(sw,/skip=new Set\(\[[\s\S]*flow-scroll-controller\.js[\s\S]*startup-recovery\.js[\s\S]*flow-bootstrap\.js/,'member mode must skip legacy scroll/bootstrap controllers');
must(sw,/member-performance\.js/,'member performance patch must be injected');
must(session,/status:total&&completed===total\?'complete':completed>0\?'partial':'none'/,'partial/full completion rule missing');
must(session,/totalVolumeKg:totalVolume\(actual\)/,'session total volume persistence missing');
must(session,/LOAD_UP/,'next overload candidate missing');
must(session,/flowClosedAt:new Date\(\)\.toISOString\(\)/,'flow completion persistence missing');
for(const label of ['進捗','総重量','完了SET','予定達成','次回予定']) assert.ok(home.includes(label),`HOME progress missing ${label}`);
must(next,/NEXT LOAD/,'NEXT LOAD HOME output missing');
must(training,/本日のトレーニング完了/,'closed training state missing');
must(migration,/sug_goal_shadow_v1/,'legacy goal migration source missing');
must(migration,/sug_goal_shadow_v2/,'current goal migration target missing');
must(migration,/idealVisionType/,'ideal vision migration missing');

const browser=await chromium.launch({headless:true});
const today=new Date();
const isoDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const deadline=new Date(today); deadline.setDate(deadline.getDate()+28);

async function openSeed(seed){
  const context=await browser.newContext();
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text())});
  await page.addInitScript(seed=>{for(const [k,v] of Object.entries(seed)) localStorage.setItem(k,JSON.stringify(v));},seed);
  await page.goto('http://127.0.0.1:8080/member.html',{waitUntil:'domcontentloaded'});
  await page.waitForURL(/entry=member/,{timeout:10000});
  await page.waitForTimeout(4500);
  return {context,page,errors};
}

// 1) Legacy state must migrate and survive the member entry reload.
{
  const legacyPlan={input:{goalType:'TEST',deadline:isoDate(deadline),trainingDays:3},feas:{weeks:4},week:[{parts:['胸']},{parts:['背中']},{parts:['脚']}],createdAt:new Date().toISOString()};
  const {context,page,errors}=await openSeed({
    sug_goal_shadow_v1:{memberKey:'',at:new Date().toISOString(),goalPlan:{idealVisionType:'physique',idealVisionName:'PHYSIQUE',lastPlan:legacyPlan,generatedAt:new Date().toISOString()}},
    sug_ideal_shadow_v1:{memberKey:'',at:new Date().toISOString(),idealVisionType:'physique',idealVisionName:'PHYSIQUE'}
  });
  const migrated=await page.evaluate(()=>({g:JSON.parse(localStorage.getItem('sug_goal_shadow_v2')||'null'),i:JSON.parse(localStorage.getItem('sug_ideal_shadow_v2')||'null')}));
  assert.equal(migrated.g?.goalPlan?.idealVisionType,'physique','ideal/goal v1→v2 migration failed');
  assert.ok(migrated.g?.goalPlan?.lastPlan,'goal plan did not survive migration');
  assert.equal(migrated.i?.idealVisionType,'physique','ideal shadow migration failed');
  assert.equal(errors.length,0,`migration page errors: ${errors.join(' | ')}`);
  await context.close();
}

// 2) Completed training must populate HOME, NEXT LOAD and release guided-flow scroll locks.
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
  assert.equal(result.before,false,'completed flow still leaves sug-today-flow scroll lock active');
  for(const bad of ['flow-scroll-controller.js','startup-recovery.js','flow-bootstrap.js','movement-ai.js','trainer-clinical-guard.js']) assert.equal(result.scripts.some(x=>x.includes(bad)),false,`legacy member script still loaded: ${bad}`);
  assert.ok(result.scripts.some(x=>x.includes('member-performance.js')),'member performance patch not loaded');
  if(result.max>200) assert.ok(Math.abs(result.y-result.target)<120,`scroll position was hijacked (${result.target}→${result.y})`);
  assert.equal(errors.length,0,`completed-flow page errors: ${errors.join(' | ')}`);
  await context.close();
}

await browser.close();
console.log('MEMBER FLOW SMOKE PASS');
