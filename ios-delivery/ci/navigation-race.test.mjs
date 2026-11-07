import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source=process.argv[2]||path.join(root,'eVo/iOS/Resources/Web/EVOLINK_PAGES.js');
const text=fs.readFileSync(source,'utf8'),start=text.indexOf('async function ready('),end=text.indexOf('\nfunction stateFor(',start);
assert(start>=0&&end>start);
async function exercise(cancelled){const clicks=[],sleepResolvers=[];let active=true;
 const context=vm.createContext({document:{body:{dataset:{evoPage:'training'}}},pages:{'training-531':{section:'training',sub:'program'}},$:s=>s==='#evolink-aligned-screen'?{dataset:{trainingView:'program'}}:null,nativeClick:s=>clicks.push(s),sleep:()=>new Promise(resolve=>sleepResolvers.push(resolve)),app:()=>({snapshot:()=>({method:'5×5'})}),CSS:{escape:s=>s}});
 vm.runInContext(text.slice(start,end)+';this.run=prepare;',context);
 const pending=context.run('training-531',{},()=>active);
 await Promise.resolve();await Promise.resolve();assert.equal(sleepResolvers.length,1);
 if(cancelled)active=false;sleepResolvers.shift()();await pending;return clicks;
}
const cancelled=await exercise(true),current=await exercise(false),observed={at:new Date().toISOString(),source,cancelledNavigationClicks:cancelled,currentNavigationClicks:current,scope:'Production prepare/ready functions in controlled JS VM. No browser or iPhone runtime claim.'};
if(process.env.EXPECT_OLD_RACE==='1'){assert(cancelled.some(x=>x.includes('data-method')));observed.result='REPRODUCED_OLD_RACE';}
else{assert.deepEqual(cancelled,[]);assert(current.some(x=>x.includes('data-method')));observed.result='PASS';}
const out=path.join(root,'verification',process.env.EXPECT_OLD_RACE==='1'?'navigation-race-before.json':'navigation-race-after.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(observed,null,2));console.log(JSON.stringify(observed));
