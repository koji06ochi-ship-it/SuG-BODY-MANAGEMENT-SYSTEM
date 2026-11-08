import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(process.argv[2]),temp=path.resolve(process.env.RUNNER_TEMP||'.');
assert.equal(process.env.SUG_PRIORITY_PATCH_APPROVED,'yes');assert(root.startsWith(temp+path.sep)&&root!==temp);assert(fs.existsSync(path.join(root,'INPUT-MANIFEST.json')));
const manifest=JSON.parse(fs.readFileSync(path.join(here,'manifest.json')));assert.equal(manifest.files.length,15);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function safe(base,rel,leafMayBeNew=false){assert(!fs.lstatSync(base).isSymbolicLink());let target=base;const names=rel.split('/');for(let i=0;i<names.length;i++){const name=names[i];assert(name&&name!=='.'&&name!=='..');target=path.join(target,name);if(fs.existsSync(target))assert(!fs.lstatSync(target).isSymbolicLink());else assert(leafMayBeNew&&i===names.length-1);}return target;}
const ops=manifest.files.map(e=>{
 assert(/^(BODY|eVo|WALK|GLOW)\/iOS\//.test(e.path));const target=safe(root,e.path,e.baselineSHA256===null);
 const old=e.baselineSHA256===null?null:fs.readFileSync(target);if(old===null)assert(!fs.existsSync(target));else assert.equal(hash(old),e.baselineSHA256,e.path);
 let next;
 if(e.kind==='edits'){next=old;const edits=JSON.parse(fs.readFileSync(path.join(here,'glow-html-edits.json')));for(const edit of edits.toReversed()){assert(edit.offset>=0&&edit.length>=0&&edit.offset+edit.length<=old.length);next=Buffer.concat([next.subarray(0,edit.offset),Buffer.from(edit.text),next.subarray(edit.offset+edit.length)]);}}
 else{const source=e.reuseExistingPublicFile?path.resolve(here,e.publicSource):safe(here,e.publicSource);if(e.reuseExistingPublicFile)assert(source.startsWith(path.resolve(here,'../sug-loopback/patches/GLOW')+path.sep));next=fs.readFileSync(source);}
 assert.equal(hash(next),e.candidateSHA256,e.path);return {...e,target,next,old};
});
const baseline=path.join(root,'ci/priority-baseline');assert(!fs.existsSync(baseline));
for(const e of ops){if(e.path.endsWith('/BundleHTTPServer.swift')){const b=path.join(baseline,e.path.split('/')[0],'BundleHTTPServer.swift');fs.mkdirSync(path.dirname(b),{recursive:true});fs.writeFileSync(b,e.old,{flag:'wx'});}fs.writeFileSync(e.target+'.priority.tmp',e.next,{flag:'wx'});}
for(const e of ops){fs.renameSync(e.target+'.priority.tmp',e.target);assert.equal(hash(fs.readFileSync(e.target)),e.candidateSHA256);}
console.log('PRIORITY_PATCH_APPLIED='+JSON.stringify({files:ops.map(e=>({path:e.path,sha256:e.candidateSHA256})),originalsModified:false,oToModified:false}));

