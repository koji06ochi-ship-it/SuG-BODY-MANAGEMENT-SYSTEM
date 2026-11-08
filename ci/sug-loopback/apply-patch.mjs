import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=path.resolve(process.argv[2]||'.');
const here=path.dirname(fileURLToPath(import.meta.url));
const temp=path.resolve(process.env.RUNNER_TEMP||'.');
assert.equal(process.env.SUG_LOOPBACK_PATCH_APPROVED,'yes','Separate loopback patch execution approval required');
assert(root.startsWith(temp+path.sep)&&root!==temp,'Only a new authenticated RUNNER_TEMP source may be patched');
assert(fs.existsSync(path.join(root,'INPUT-MANIFEST.json')),'Authenticated source manifest required');
const manifest=JSON.parse(fs.readFileSync(path.join(here,'manifest.json')));
const expected=['GLOW/iOS/Sources/BundleHTTPServer.swift','GLOW/iOS/Sources/DeviceWebView.swift','oTo/iOS/Sources/BundleHTTPServer.swift','oTo/iOS/Sources/DeviceWebView.swift'].sort();
assert.deepEqual(manifest.files.map(e=>e.path).sort(),expected);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function regularTree(base,relative){
 let p=base;
 assert(!fs.lstatSync(p).isSymbolicLink());
 for(const name of relative.split('/')){assert(name&&name!=='.'&&name!=='..');p=path.join(p,name);assert(!fs.lstatSync(p).isSymbolicLink());}
 return p;
}
const operations=manifest.files.map(e=>{
 const target=regularTree(root,e.path),source=regularTree(here,'patches/'+e.path);
 assert.equal(hash(target),e.baselineSHA256,'Unexpected existing source; no patch applied: '+e.path);
 assert.equal(hash(source),e.candidateSHA256,'Candidate hash mismatch');
 return {...e,target,source};
});
// Validate ALL four before the first write. Never alter an original app directory.
const baselineRoot=path.join(root,'ci','loopback-baseline');
assert(!fs.existsSync(baselineRoot),'Baseline destination must be new');
for(const e of operations){
 if(e.path.endsWith('/BundleHTTPServer.swift')){
  const app=e.path.split('/')[0],backup=path.join(root,'ci','loopback-baseline',app,'BundleHTTPServer.swift');
  fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(e.target,backup,fs.constants.COPYFILE_EXCL);
 }
 fs.writeFileSync(e.target+'.loopback-fix.tmp',fs.readFileSync(e.source),{flag:'wx'});
}
for(const e of operations){fs.renameSync(e.target+'.loopback-fix.tmp',e.target);assert.equal(hash(e.target),e.candidateSHA256);}
console.log('LOOPBACK_PATCH_APPLIED='+JSON.stringify({files:operations.map(e=>({path:e.path,sha256:e.candidateSHA256})),loopbackOnly:true,fixedPortsUnchanged:true,originalDirectoriesPatched:false}));
