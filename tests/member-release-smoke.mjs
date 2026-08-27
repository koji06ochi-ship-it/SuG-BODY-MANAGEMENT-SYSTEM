import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE=(process.env.SUG_BASE_URL||'http://127.0.0.1:8080').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});

async function openHub(seed={}){
  const context=await browser.newContext();
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{ if(m.type()==='error') errors.push(m.text()); });
  await page.addInitScript(seed=>{ for(const [k,v] of Object.entries(seed)) localStorage.setItem(k,JSON.stringify(v)); },seed);
  await page.goto(`${BASE}/member-hub.html?v=26.5.223&release=${Date.now()}`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#view');
  let frame;
  for(let i=0;i<60;i++){
    frame=page.frames().find(x=>x!==page.mainFrame()&&x.url().includes('entry=member'));
    if(frame) break;
    await page.waitForTimeout(250);
  }
  assert.ok(frame,'BODY iframe did not enter member runtime');
  await page.waitForTimeout(6500);
  return {context,page,frame,errors};
}

const now=new Date();
const pad=n=>String(n).padStart(2,'0');
const isoDate=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const deadline=new Date(now); deadline.setDate(deadline.getDate()+28);
const plan={input:{goalType:'筋肥大',deadline:isoDate(deadline),trainingDays:3},feas:{weeks:4},week:[{parts:['胸']},{parts:['背中']},{parts:['脚']}],createdAt:now.toISOString()};

// 当日完了記録だけがHOME/TODAY FLOW/GOAL PROGRESSへ反映されること
{
  const at=new Date().toISOString();
  const complete={at,flowClosedAt:at,completion:'complete',completedSets:2,totalSets:2,totalVolumeKg:120,next:'LOAD_UP',exercises:[{name:'TEST PRESS',sets:[{set:1,load:10,reps:5,rir:2},{set:2,load:10,reps:7,rir:1}]}]};
  const {context,frame,errors}=await openHub({
    sug_goal_shadow_v2:{memberKey:'',at,goalPlan:{idealVisionType:'physique',lastPlan:plan,generatedAt:at}},
    sug_ideal_shadow_v2:{memberKey:'',at,idealVisionType:'physique'},
    sug_training_sessions_v1:[complete]
  });
  const text=await frame.locator('body').innerText();
  assert.match(text,/120\s*kg/i,'当日総重量120kgがHOMEへ反映されない');
  assert.match(text,/2\s*SET/i,'当日完了SET 2がHOMEへ反映されない');
  assert.match(text,/1種目/,'当日種目数1がHOMEへ反映されない');
  assert.match(text,/NEXT LOAD｜LOAD_UP/,'次回オーバーロード候補LOAD_UPが表示されない');
  assert.ok(!text.includes('追加トレーニングを開始'),'全完了後に追加開始ボタンが誤表示');
  assert.ok(text.includes('本日の記録を見る')||text.includes('本日のトレーニング完了'),'全完了状態が表示されない');
  assert.equal(errors.length,0,`当日完了状態でJS error:\n${errors.join('\n')}`);
  await context.close();
}

// 昨日の400kg・2SET・2種目の部分完了は今日の積み上げ/部分完了へ絶対に漏らさない
{
  const yesterday=new Date(); yesterday.setDate(yesterday.getDate()-1); yesterday.setHours(18,0,0,0);
  const at=yesterday.toISOString();
  const stale={
    at,
    flowClosedAt:at,
    completion:'partial',
    completedSets:2,
    totalSets:7,
    totalVolumeKg:400,
    next:'HOLD',
    exercises:[
      {name:'YESTERDAY PRESS',sets:[{set:1,load:20,reps:10}]},
      {name:'YESTERDAY ROW',sets:[{set:1,load:20,reps:10}]}
    ]
  };
  const {context,frame,errors}=await openHub({sug_training_sessions_v1:[stale]});
  const text=await frame.locator('body').innerText();
  assert.ok(!text.includes('本日のトレーニングは部分完了'),'昨日の部分完了が今日へ残留');
  assert.ok(!text.includes('追加トレーニングを開始'),'昨日の追加トレ開始が今日へ残留');
  assert.ok(!/今日の総重量\s*400\s*kg/i.test(text),'昨日の400kgが今日の総重量へ残留');
  assert.ok(!/今日の完了SET\s*2\s*SET/i.test(text),'昨日の2SETが今日の完了SETへ残留');
  assert.ok(!/今日の種目\s*2/.test(text),'昨日の2種目が今日の種目数へ残留');
  assert.ok(!/今日の積み上げ[\s\S]{0,300}400\s*kg/i.test(text),'昨日の400kgが「今日の積み上げ」へ残留');
  assert.ok(!/今日の積み上げ[\s\S]{0,300}2\s*SET/i.test(text),'昨日の2SETが「今日の積み上げ」へ残留');
  assert.ok(!/今日の積み上げ[\s\S]{0,300}2\s*種目/i.test(text),'昨日の2種目が「今日の積み上げ」へ残留');
  assert.equal(errors.length,0,`日付切替状態でJS error:\n${errors.join('\n')}`);
  await context.close();
}

// S.u.G受信側が歩数・睡眠・心拍・体重を受けて表示できる
{
  const {context,frame,errors}=await openHub({});
  const result=await frame.evaluate(()=>{
    try{ eval("db.current='__smoke__'; db.members.__smoke__=baseMember('Smoke Member')"); }catch(e){ return {ok:false,text:'MEMBER_SETUP:'+String(e)}; }
    if(typeof window.importSugHealthPayload!=='function') return {ok:false,text:'NO_IMPORT'};
    const r=window.importSugHealthPayload({steps:4321,sleep:7.5,heart:61,weight:67.5});
    if(typeof window.renderSugHealthSync==='function') window.renderSugHealthSync();
    return {ok:!!r?.ok,text:document.getElementById('sugHealthMetrics')?.innerText||document.body.innerText};
  });
  assert.equal(result.ok,true,`Health 4項目payloadを受信できない: ${result.text}`);
  for(const value of ['4,321','7.5','61','67.5']) assert.ok(result.text.includes(value),`Health表示不足: ${value}`);
  assert.equal(errors.length,0,`Health受信表示でJS error:\n${errors.join('\n')}`);
  await context.close();
}

// HUBからQUESTへ遷移でき、404/空画面にならない
{
  const {context,page,errors}=await openHub({});
  await page.click('button[data-page="quest"]');
  let qframe;
  for(let i=0;i<40;i++){
    qframe=page.frames().find(x=>x!==page.mainFrame()&&x.url().includes('quest.html'));
    if(qframe) break;
    await page.waitForTimeout(250);
  }
  assert.ok(qframe,'QUEST iframeへ遷移しない');
  await page.waitForTimeout(1800);
  const qtext=await qframe.locator('body').innerText();
  assert.ok(qtext.trim().length>20,'QUESTが空画面');
  assert.ok(!/404|File not found/i.test(qtext),'QUESTが404');
  assert.equal(errors.length,0,`QUEST導線でJS error:\n${errors.join('\n')}`);
  await context.close();
}

await browser.close();
console.log(`MEMBER RELEASE SMOKE PASS ${BASE}`);
