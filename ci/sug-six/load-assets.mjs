import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {decryptChunks} from './asset-crypto.mjs';
const [assetDirectory,output]=process.argv.slice(2);if(!assetDirectory||!output)throw Error('asset directory and NEW output required');
if(fs.existsSync(output))throw Error('Output already exists');const key=process.env.SUG_SIX_BUILD_ASSET_KEY;if(!/^[a-f0-9]{64}$/.test(key||''))throw Error('Missing build asset secret');
const manifest=JSON.parse(fs.readFileSync(path.join(assetDirectory,'manifest.json'))),archive=path.resolve(output)+'.authenticated.tar.gz';
await decryptChunks(manifest,Buffer.from(key,'hex'),assetDirectory,archive);
// Parse archive names, not the locale-dependent human display from tar -t.
const listing=spawnSync(process.env.SUG_ASSET_PYTHON||'python3',['-c',"import sys,tarfile,json\nwith tarfile.open(sys.argv[1],'r:gz') as t:\n m=t.getmembers()\n if any(not (x.isfile() or x.isdir()) for x in m):raise RuntimeError('Non-regular member')\n print(json.dumps([x.name for x in m],ensure_ascii=True))",archive],{encoding:'utf8',maxBuffer:8*1024*1024,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});if(listing.status!==0)throw Error('Cannot list authenticated archive');
for(const name of JSON.parse(listing.stdout)){if(name.startsWith('/')||name.includes('\\')||name.split('/').includes('..')||! /^(BODY|eVo|WALK|WAY|GLOW|oTo|ci)\/|^(INPUT-MANIFEST\.json|build-one\.sh|bundle-contract\.mjs)$/.test(name))throw Error('Unexpected archive member')}
fs.mkdirSync(output);const unpack=spawnSync('tar',['-xf',archive,'-C',output],{stdio:'inherit'});if(unpack.status!==0)throw Error('Asset extraction failed');
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),inputFile=path.join(output,'INPUT-MANIFEST.json');if(digest(inputFile)!==manifest.inputManifestSHA256)throw Error('Input manifest mismatch');
const inputs=JSON.parse(fs.readFileSync(inputFile));if(inputs.format!=='SUG_IOS_INPUTS_V1')throw Error('Wrong input format');
for(const entry of inputs.files){if(entry.path.startsWith('/')||entry.path.includes('\\')||entry.path.split('/').includes('..'))throw Error('Unsafe input path');const p=path.join(output,entry.path);if(fs.lstatSync(p).isSymbolicLink()||fs.statSync(p).size!==entry.bytes||digest(p)!==entry.sha256)throw Error('Input integrity mismatch: '+entry.path)}
for(const name of ['build-one.sh','bundle-contract.mjs'])fs.copyFileSync(path.join(output,name),path.join(output,'ci',name));
console.log(JSON.stringify({authenticated:true,verifiedFiles:inputs.files.length,apps:inputs.apps,credentialsPrinted:false}));
