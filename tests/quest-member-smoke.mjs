import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE=(process.env.SUG_BASE_URL||'http://127.0.0.1:8080').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error') errors.push(m.text())});

await page.goto(`${BASE}/quest.html?smoke=${Date.now()}`,{waitUntil:'domcontentloaded'});
await page.waitForSelector('iframe',{timeout:10000});
const deadline=Date.now()+15000;
let app=null;
while(Date.now()<deadline){
  app=page.frames().find(f=>/shrine-quest-v26\.5\.207\.html/.test(f.url()));
  if(app) break;
  await page.waitForTimeout(150);
}
assert.ok(app,'QUEST V26.5.207 iframe not loaded');
await app.waitForSelector('#home',{timeout:10000});
assert.ok(await app.locator('#home').isVisible(),'QUEST home not visible');
assert.equal(await app.locator('.shrine').count(),14,'expected 11 Kita shrines + 3 outer-route shrines');
assert.match((await app.locator('#kitaProgress').innerText()).trim(),/北区 0\/11/,'Kita 11 progress missing');
assert.equal((await app.locator('#wallet').innerText()).trim(),'0 pt','wallet should start at zero in clean context');

await app.locator('[data-check="horikawa"]').click();
assert.match((await app.locator('#kitaProgress').innerText()).trim(),/北区 1\/11/,'Kita progress did not update');
assert.equal((await app.locator('#wallet').innerText()).trim(),'100 pt','wallet did not update after check-in');
assert.match(await app.locator('[data-check="horikawa"]').innerText(),/CHECKED/,'check-in state did not persist in UI');

await app.locator('[data-page="network"]').click();
await app.waitForSelector('#map .hub',{timeout:5000});
assert.match(await app.locator('#routebox').innerText(),/北区11社/,'Kita network route missing');

await app.locator('[data-page="learn"]').click();
assert.match(await app.locator('#learn').innerText(),/●公式確認/,'evidence legend missing');
assert.match(await app.locator('#learn').innerText(),/○伝承・現地由緒/,'tradition evidence legend missing');
assert.match(await app.locator('#learn').innerText(),/△仮説/,'hypothesis evidence legend missing');

assert.equal(errors.length,0,`browser errors:\n${errors.join('\n')}`);
await browser.close();
console.log(`QUEST V26.5.207 PASS ${BASE}`);
