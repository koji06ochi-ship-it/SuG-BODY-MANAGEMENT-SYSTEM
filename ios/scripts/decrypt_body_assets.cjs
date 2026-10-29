#!/usr/bin/env node
'use strict';
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');

const MAGIC=Buffer.from('SUGBODYASSET1\n','ascii');
function options(){const out={};for(let i=2;i<process.argv.length;i+=2){const key=process.argv[i],value=process.argv[i+1];if(!key?.startsWith('--')||!value)throw Error(`Invalid argument near ${key||'<end>'}`);out[key.slice(2)]=value}for(const key of ['bundle','output'])if(!out[key])throw Error(`Missing --${key}`);return out}
function sha(value){return crypto.createHash('sha256').update(value).digest('hex').toUpperCase()}
function keyFromEnvironment(name){const value=(process.env[name]||'').trim();if(!value)throw Error(`${name} is empty`);const key=Buffer.from(value,'base64');if(key.length!==32)throw Error(`${name} must decode to exactly 32 bytes`);return key}
function safeName(value){if(typeof value!=='string'||path.basename(value)!==value||!/^[-A-Za-z0-9_.]+\.(?:png|jpe?g)$/i.test(value))throw Error('Encrypted asset contains an invalid file name');return value}
function main(){
 const args=options(),bundle=fs.readFileSync(path.resolve(args.bundle)),output=path.resolve(args.output),key=keyFromEnvironment(args['key-env']||'BODY_ASSET_BUNDLE_KEY_B64');
 if(bundle.length<MAGIC.length+28||!bundle.subarray(0,MAGIC.length).equals(MAGIC))throw Error('Protected BODY asset bundle header is invalid');
 const iv=bundle.subarray(MAGIC.length,MAGIC.length+12),tag=bundle.subarray(MAGIC.length+12,MAGIC.length+28),ciphertext=bundle.subarray(MAGIC.length+28);
 const decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);decipher.setAuthTag(tag);
 const plaintext=Buffer.concat([decipher.update(ciphertext),decipher.final()]);
 const payload=JSON.parse(plaintext.toString('utf8'));
 if(payload.schemaVersion!==1||!Array.isArray(payload.files)||payload.files.length!==16)throw Error('Protected BODY asset manifest is invalid');
 if(fs.existsSync(output)&&fs.readdirSync(output).length)throw Error('Refusing to overwrite a non-empty asset output directory');
 fs.mkdirSync(output,{recursive:true});let bytes=0;
 for(const item of payload.files){const name=safeName(item.path),data=Buffer.from(item.data,'base64');if(data.length!==item.bytes||sha(data)!==item.sha256)throw Error(`Protected BODY asset failed integrity validation: ${name}`);fs.writeFileSync(path.join(output,name),data,{flag:'wx'});bytes+=data.length}
 console.log(JSON.stringify({restoredFiles:payload.files.length,restoredBytes:bytes,integrity:'PASS'}));
}
main();
