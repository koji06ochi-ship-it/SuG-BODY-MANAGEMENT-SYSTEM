import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE=(process.env.SUG_BASE_URL||'http://127.0.0.1:8080').replace(/\/$/,'');
const sessionSrc=fs.readFileSync('assets/ui/v26.5.176/session-flow.js','utf8');
const bridgeSrc=fs.readFileSync('assets/ui/v26.5.184/session-training-bridge.js','utf8');

assert.match(sessionSrc,/window\.SUG_OPEN_SESSION=openSession/,'menu → training session entry is not exposed');
assert.match(sessionSrc,/completion:stats\.status/,'completion state is not persisted');
assert.match(sessionSrc,/部分完了/,'partial completion UI missing');
assert.match(sessionSrc,/全SET完了/,'full completion UI missing');
assert.match(bridgeSrc,/addEventListener\('sug:session-complete'/,'completed TODAY FLOW is not bridged to training history');

const browser=await chromium.launch({headless:true});
const now=new Date();
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const deadline=new Date(now); deadline.setDate(deadline.getDate()+28);
const created=new Date(now); created.setDate(created.getDate()-1);
const plan={input:{goalType:'筋肥大',deadline:iso(deadline),trainingDays:3},feas:{weeks:4},week:[{parts:['胸']},{parts:['背中']},{parts:['脚']}],createdAt:created.toISOString()};

async function openSeed(sessions){
  const context=await browser.newContext();
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.stack||String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  const seed={
    sug_goal_shadow_v2:{memberKey:'',at:new Date().toISOString(),goalPlan:{idealVisionType:'physique',lastPlan:plan,generatedAt:created.toISOString()}},
    sug_ideal_shadow_v2:{memberKey:'',at:new Date().toISOString(),idealVisionType:'physique'},
    sug_training_sessions_v1:sessions
  };
  await page.addInitScript(seed=>{for(const [k,v] of Object.entries(seed))localStorage.setItem(k,JSON.stringify(v));},seed);
  await page.goto(`${BASE}/member.html?completion=${Date.now()}`,{waitUntil:'domcontentloaded'});
  await page.waitForURL(/entry=member/,{timeout:15000});
  await page.waitForTimeout(4500);
  return {context,page,errors};
}

{
  const at=new Date().toISOString();
  const complete={at,flowClosedAt:at,completion:'complete',completedSets:2,totalSets:2,totalVolumeKg:120,next:'LOAD_UP',exercises:[{name:'TEST PRESS',sets:[{set:1,load:10,reps:5,rir:2},{set:2,load:10,reps:7,rir:1}]}]};
  const {context,page,errors}=await openSeed([complete]);
  const text=await page.locator('body').innerText();
  assert.match(text,/120\s*kg/i,'HOME total volume missing');
  assert.match(text,/2\s*SET/,'HOME completed SET missing');
  assert.match(text,/1種目/,'HOME exercise count missing');
  assert.match(text,/進捗\s*\d+%/,'GOAL PROGRESS percentage missing');
  assert.match(text,/予定達成\s*\d+\/\d+｜\d+%/,'schedule adherence percentage missing');
  assert.match(text,/次回予定/,'next schedule missing');
  assert.match(text,/DAY\s*\d+/,'schedule rows missing');
  assert.ok(/予定ペース達成|次の1回|予定通り|遅れ/.test(text),'motivation message missing');
  assert.match(text,/NEXT LOAD｜LOAD_UP/,'overload candidate missing');
  assert.ok(!text.includes('今日のメニューを始める'),'start button text remains after completed flow');
  assert.ok(text.includes('本日の記録を見る')||text.includes('本日のトレーニング完了'),'completed-state action missing');
  assert.equal(errors.length,0,`complete state errors:\n${errors.join('\n')}`);
  await context.close();
}

{
  const at=new Date().toISOString();
  const partial={at,flowClosedAt:at,completion:'partial',completedSets:1,totalSets:2,totalVolumeKg:50,next:'HOLD',exercises:[{name:'TEST ROW',sets:[{set:1,load:10,reps:5,rir:2},{set:2,load:null,reps:null,rir:null}]}]};
  const {context,page,errors}=await openSeed([partial]);
  const text=await page.locator('body').innerText();
  assert.match(text,/50\s*kg/i,'partial HOME volume must count completed sets only');
  assert.match(text,/1\s*SET/,'partial HOME completed SET count wrong');
  assert.match(text,/1種目/,'partial HOME exercise count wrong');
  assert.ok(!text.includes('今日のメニューを始める'),'partial closed flow incorrectly exposes start button');
  assert.equal(errors.length,0,`partial state errors:\n${errors.join('\n')}`);
  await context.close();
}

await browser.close();
console.log(`MEMBER FLOW COMPLETION PASS ${BASE}`);
