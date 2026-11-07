import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {pipeline} from 'node:stream/promises';
import {Writable,Readable} from 'node:stream';
import assert from 'node:assert/strict';

export function encryptor(key,iv=crypto.randomBytes(12)){
 assert(Buffer.isBuffer(key)&&key.length===32);
 const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
 cipher.setAAD(Buffer.from('SUG_IOS_ASSETS_V1'));
 return {cipher,iv};
}
export function decryptor(key,iv,tag){
 assert(key.length===32&&iv.length===12&&tag.length===16);
 const decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);
 decipher.setAAD(Buffer.from('SUG_IOS_ASSETS_V1'));decipher.setAuthTag(tag);return decipher;
}
export function validChunk(name){return /^assets\.[0-9]{4}\.enc$/.test(name)}
export async function encryptChunks(readable,key,directory,chunkLimit=45*1024*1024){
 const {cipher,iv}=encryptor(key),chunks=[];let fd,bytes=0,h;
 function finish(){if(fd===undefined)return;fs.closeSync(fd);chunks.push({name:'assets.'+String(chunks.length).padStart(4,'0')+'.enc',bytes,sha256:h.digest('hex')});fd=undefined}
 const sink=new Writable({write(data,_encoding,callback){try{let offset=0;while(offset<data.length){if(fd===undefined){bytes=0;h=crypto.createHash('sha256');fd=fs.openSync(path.join(directory,'assets.'+String(chunks.length).padStart(4,'0')+'.enc'),'wx',0o600)}const n=Math.min(chunkLimit-bytes,data.length-offset),part=data.subarray(offset,offset+n);fs.writeFileSync(fd,part);h.update(part);bytes+=n;offset+=n;if(bytes===chunkLimit)finish()}callback()}catch(e){callback(e)}},final(callback){try{finish();callback()}catch(e){callback(e)}}});
 try{await pipeline(readable,cipher,sink)}finally{if(fd!==undefined)fs.closeSync(fd)}
 return {format:'SUG_IOS_ASSETS_V1',iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),chunks};
}
export async function decryptChunks(manifest,key,directory,output){
 assert.equal(manifest.format,'SUG_IOS_ASSETS_V1');assert(manifest.chunks.length>0&&manifest.chunks.length<1000);
 assert(/^[a-f0-9]{24}$/.test(manifest.iv)&&/^[a-f0-9]{32}$/.test(manifest.tag));
 assert.equal(new Set(manifest.chunks.map(c=>c.name)).size,manifest.chunks.length);
 // Authenticate into a NEW temporary file. Never extract unauthenticated plaintext.
 async function* bytes(){for(const [index,c]of manifest.chunks.entries()){assert(validChunk(c.name)&&c.name==='assets.'+String(index).padStart(4,'0')+'.enc');const p=path.join(directory,c.name);assert(!fs.lstatSync(p).isSymbolicLink());assert.equal(fs.statSync(p).size,c.bytes);assert(/^[a-f0-9]{64}$/.test(c.sha256));const h=crypto.createHash('sha256');for await(const b of fs.createReadStream(p)){h.update(b);yield b}assert.equal(h.digest('hex'),c.sha256,'Ciphertext checksum mismatch')}}
 await pipeline(Readable.from(bytes()),decryptor(key,Buffer.from(manifest.iv,'hex'),Buffer.from(manifest.tag,'hex')),fs.createWriteStream(output,{flags:'wx',mode:0o600}));
}
