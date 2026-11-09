import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import zlib from 'node:zlib';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),[mode,rootArg]=process.argv.slice(2);
if(!['--apply','--verify-final','--verify-ios-root','--check-baseline'].includes(mode)||!rootArg)throw Error('Explicit mode and source root required');
const root=path.resolve(rootArg),meta=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'))),blob=fs.readFileSync(path.join(here,'overlay.enc'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),key=process.env.SUG_SIX_BUILD_ASSET_KEY;
if(!/^[a-f0-9]{64}$/.test(key||'')||sha(blob)!==meta.ciphertextSHA256||blob.subarray(0,7).toString()!=='SUGBDY1')throw Error('Invalid authenticated package');
const decipher=crypto.createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),blob.subarray(7,19));decipher.setAAD(Buffer.from('SUG_BODY_INTEGRATED_1006_V1'));decipher.setAuthTag(blob.subarray(19,35));
const payload=JSON.parse(zlib.gunzipSync(Buffer.concat([decipher.update(blob.subarray(35)),decipher.final()]),{maxOutputLength:8*1024*1024}));
if(payload.format!=='SUG_BODY_INTEGRATED_1006_V1'||payload.files.length!==18||payload.final.length!==3583)throw Error('Unexpected BODY package');
function safe(rel){if(!rel.startsWith('BODY/iOS/')||rel.includes('\\')||rel.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Invalid BODY relative path');let p=root;for(const n of (mode==='--verify-ios-root'?rel.slice('BODY/iOS/'.length):rel).split('/')){p=path.join(p,n);if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('Link not accepted')}return p;}
function verify(entries){for(const e of entries){const p=safe(e.path);if(!fs.existsSync(p)||fs.statSync(p).size!==e.bytes||sha(fs.readFileSync(p))!==e.sha256)throw Error('Frozen file mismatch: '+e.path);}}
function checkFinal(){verify(payload.final);const folder=mode==='--verify-ios-root'?root:path.join(root,'BODY/iOS');let count=0;function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isSymbolicLink())throw Error('Link in final tree');if(e.isDirectory())walk(p);else count++;}}walk(folder);if(count!==payload.final.length)throw Error('Unexpected extra file in final iOS tree');}
if(mode==='--check-baseline'){verify(payload.baseline);console.log(JSON.stringify({baselineVerified:payload.baseline.length,writes:0}));process.exit(0);}
if(mode==='--verify-final'||mode==='--verify-ios-root'){checkFinal();console.log(JSON.stringify({finalVerified:payload.final.length,payloadFiles:18,writes:0}));process.exit(0);}
const temp=path.resolve(process.env.RUNNER_TEMP||'.');if(process.env.SUG_BODY_1006_APPROVED!=='yes'||!root.startsWith(temp+path.sep)||root===temp)throw Error('Apply only to the approved ephemeral runner tree');
if(sha(fs.readFileSync(path.join(root,'INPUT-MANIFEST.json')))!==meta.inputManifestSHA256)throw Error('Authenticated asset generation changed');
verify(payload.baseline);const original=new Map(payload.baseline.map(x=>[x.path,x]));
const mutations=payload.files.map(e=>{const p=safe(e.path),old=original.get(e.path),bytes=Buffer.from(e.contentBase64,'base64');if(sha(bytes)!==e.sha256||bytes.length!==e.bytes)throw Error('Payload mismatch');if(!old&&fs.existsSync(p))throw Error('Unexpected new target');return{p,bytes,path:e.path};});
for(const e of mutations){fs.mkdirSync(path.dirname(e.p),{recursive:true});fs.writeFileSync(e.p,e.bytes);}
checkFinal();console.log('SUG_BODY_INTEGRATION_APPLIED='+JSON.stringify({files:mutations.map(x=>x.path),fullIOSFiles:3583,build:'1006',fixedOrigin:'http://127.0.0.1:5411',originalsModified:false,otherAppsModified:false}));
