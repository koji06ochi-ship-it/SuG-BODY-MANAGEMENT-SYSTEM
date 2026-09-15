import { chromium } from 'playwright';

const base = process.env.SUG_TEST_BASE || 'http://127.0.0.1:4173';
const url = `${base}/apps/body/best-of-miss-demo-v27.76.html`;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const consoleErrors = [];
const pageErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => pageErrors.push(String(err)));

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#missOfIntegratedEntry', { timeout: 15000 });
await page.click('#missiStart');
await page.waitForSelector('#missiShell:not([hidden])');

// Candidate self-photo path: file selection, preview, and reuse of the BODY photo IndexedDB.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlZ7cwAAAAASUVORK5CYII=', 'base64');
for (const [view, name] of [['front','front.png'], ['side','side.png'], ['back','back.png']]) {
  await page.locator(`input[type="file"][data-view="${view}"]`).setInputFiles({ name, mimeType: 'image/png', buffer: png });
  await page.waitForFunction(v => document.querySelector(`#missiImg_${v}`)?.src?.startsWith('blob:'), view);
}
const photoKeys = await page.evaluate(async () => {
  const db = await new Promise((resolve, reject) => {
    const r = indexedDB.open('sug_body_photos_v1', 1);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return await new Promise((resolve, reject) => {
    const r = db.transaction('photos').objectStore('photos').getAllKeys();
    r.onsuccess = () => resolve(r.result.map(String));
    r.onerror = () => reject(r.error);
  });
});
for (const view of ['front','side','back']) {
  if (!photoKeys.some(k => k.endsWith(`:${view}`) && k.startsWith('miss:'))) throw new Error(`BODY photo IndexedDB missing ${view}`);
}

// Reload to verify the full judgement/action loop without depending on external pose-model networking.
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#missOfIntegratedEntry', { timeout: 15000 });
await page.click('#missiStart');
await page.waitForSelector('#missiShell:not([hidden])');
await page.locator('[data-issue="rib"]').check();
await page.locator('[data-issue="shoulderRom"]').check();
await page.locator('[data-issue="hipExt"]').check();
await page.click('#missiAnalyze');
await page.waitForSelector('#missiMakePlan');
const differenceText = await page.locator('#missiContent').innerText();
if (!differenceText.includes('WHAT') || !differenceText.includes('WHY')) throw new Error('WHAT / WHY result missing');
await page.click('#missiMakePlan');
await page.waitForSelector('.missi-action');
const planText = await page.locator('#missiContent').innerText();
for (const required of ['課題TOP3', 'LONG TERM', 'THIS WEEK', 'TODAY']) {
  if (!planText.includes(required)) throw new Error(`Plan text missing: ${required}`);
}
await page.locator('.missi-action').first().click();
await page.waitForSelector('#missiSheet:not([hidden])');
const actionText = await page.locator('#missiSheetIn').innerText();
for (const required of ['やり方', '回数', '感じる場所', 'NG']) {
  if (!actionText.includes(required)) throw new Error(`Action guidance missing: ${required}`);
}
await page.click('#missiDoneAction');
await page.locator('[data-r="better"]').click();
await page.click('#missiCloseAction');
await page.waitForSelector('#missiReassess');
const responseText = await page.locator('#missiContent').innerText();
if (!responseText.includes('BODY RESPONSE')) throw new Error('BODY RESPONSE missing');
await page.click('#missiReassess');
await page.waitForSelector('#missiAnalyze');

const layout = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
if (layout.scrollWidth > layout.width + 1) throw new Error(`390px horizontal overflow: ${layout.scrollWidth} > ${layout.width}`);
if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(' | ')}`);
const fatalConsole = consoleErrors.filter(x => !/favicon|ERR_|Failed to load resource/i.test(x));
if (fatalConsole.length) throw new Error(`Console errors: ${fatalConsole.join(' | ')}`);

console.log('MISS OF runtime playwright OK');
await browser.close();
