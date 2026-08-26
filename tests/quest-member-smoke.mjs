import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE=(process.env.SUG_BASE_URL||'http://127.0.0.1:8080').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error') errors.push(m.text())});
const questFrame=async()=>{
  const deadline=Date.now()+15000;
  while(Date.now()<deadline){
    const f=page.frames().find(x=>/quest-v26\.5\.200\.html/.test(x.url()));
    if(f)return f;
    await page.waitForTimeout(150);
  }
  return null;
};

await page.goto(`${BASE}/member.html?smoke=${Date.now()}`,{waitUntil:'domcontentloaded'});
await page.waitForURL(/quest\.html/,{timeout:15000});
await page.waitForSelector('#app',{timeout:10000});
const app=await questFrame();
assert.ok(app,'QUEST iframe not loaded');
await app.waitForSelector('#choose',{timeout:10000});

const heroVisible=await app.locator('#choose').evaluate(el=>el.classList.contains('show'));
if(heroVisible){
  await app.locator('[data-hero="hyottoko"]').click();
  await app.locator('#start').click();
}
assert.ok(await app.locator('#home').isVisible(),'QUEST HOME not visible after hero selection');

await page.locator('#openFlow').click();
await page.waitForURL(/entry=member/,{timeout:15000});
await page.waitForTimeout(2500);
assert.ok(/entry=member/.test(page.url()),'TODAY FLOW did not open from QUEST');

const now=new Date().toISOString();
await page.evaluate(now=>{
  const rec={at:now,flowClosedAt:now,completion:'complete',completedSets:2,totalSets:2,totalVolumeKg:120,next:'LOAD_UP',exercises:[{name:'QUEST TEST PRESS',sets:[{set:1,load:10,reps:5,rir:2},{set:2,load:10,reps:7,rir:1}]}]};
  localStorage.setItem('sug_training_sessions_v1',JSON.stringify([rec]));
},now);

await page.goto(`${BASE}/quest.html?returntest=${Date.now()}`,{waitUntil:'domcontentloaded'});
await page.waitForSelector('#flowStatus',{timeout:10000});
await page.waitForFunction(()=>document.querySelector('#flowStatus')?.textContent?.includes('トレ完了'),null,{timeout:10000});
const app2=await questFrame();
assert.ok(app2,'QUEST iframe missing after return');
await app2.waitForSelector('#training',{state:'attached',timeout:10000});
await page.waitForTimeout(1200);
const trainingText=await app2.locator('#training').textContent();
assert.match(trainingText||'',/完了/,'QUEST did not reflect completed training');
const pointsText=await app2.locator('#pointsTop').innerText();
assert.notEqual(pointsText.trim(),'0pt','QUEST points did not update after training completion');
assert.equal(errors.length,0,`browser errors:\n${errors.join('\n')}`);
await browser.close();
console.log(`QUEST MEMBER FLOW PASS ${BASE}`);
