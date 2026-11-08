(function(global){
'use strict';
const APP='SUG_GLOW_PHOTOS', DB='SUG_GLOW_CONFIRMED_PHOTOS_V1', LIMIT=12*1024*1024, MAX_JSON=36*1024*1024;
const sides=['before','after'], types=new Set(['image/png','image/jpeg','image/webp']);
const fail=message=>{throw Error(message)};
const digest=async blob=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join('');
function settings(value){
 const result={};
 for(const side of sides){result[side]={};for(const key of ['view','expr','light','distance']){
  const item=value?.[side]?.[key];if(typeof item!=='string'||item.length>40)fail('撮影条件を確認してください。');result[side][key]=item;
 }}return result;
}
async function image(blob){
 if(!(blob instanceof Blob)||!types.has(blob.type)||blob.size<8||blob.size>LIMIT)fail('12MB以下のJPEG・PNG・WebP画像を選んでください。');
 const b=new Uint8Array(await blob.slice(0,16).arrayBuffer());
 const valid=blob.type==='image/png'?b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10:
 blob.type==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:
 String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
 if(!valid)fail('画像の内容と形式が一致しません。');
 return {blob,sha256:await digest(blob)};
}
async function prepare(selection){
 const record={format:1,app:APP,id:crypto.randomUUID(),createdAt:new Date().toISOString(),settings:settings(selection.settings)};
 for(const side of sides)record[side]=selection.files[side]?await image(selection.files[side]):null;
 if(!record.before&&!record.after)fail('保存する写真を選んでください。');return record;
}
async function validate(record){
 if(!record||record.format!==1||record.app!==APP||typeof record.id!=='string'||!Number.isFinite(Date.parse(record.createdAt)))fail('対応するGLOW写真記録ではありません。');
 settings(record.settings);
 let count=0;
 for(const side of sides){if(!record[side])continue;count++;const item=await image(record[side].blob);if(item.sha256!==record[side].sha256)fail('写真の整合性を確認できません。既存写真は保持しています。');}
 if(!count)fail('写真がありません。');return record;
}
function open(factory=global.indexedDB){
 if(!factory) return Promise.reject(Error('この環境では写真の端末保存を利用できません。'));
 return new Promise((resolve,reject)=>{
 const request=factory.open(DB,1);let blocked=false;
 request.onupgradeneeded=()=>{const db=request.result;db.createObjectStore('snapshots',{keyPath:'id'});db.createObjectStore('state',{keyPath:'key'});};
 request.onblocked=()=>{blocked=true;reject(Error('別画面が写真保存を使用中です。閉じてから再操作してください。'));};
 request.onerror=()=>reject(Error('写真保存領域を開けません。既存写真は保持しています。'));
 request.onsuccess=()=>{const db=request.result;if(blocked){db.close();return;}db.onversionchange=()=>db.close();resolve(db);};
 });
}
function completion(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(Error('写真を保存できません。容量と端末の状態を確認してください。'));tx.onabort=()=>reject(Error('写真の変更を中断しました。以前の保存は保持しています。'));});}
function store(factory){
 async function commit(record){await validate(record);const db=await open(factory);
  try{const tx=db.transaction(['snapshots','state'],'readwrite'),done=completion(tx);tx.objectStore('snapshots').add(record);tx.objectStore('state').put({key:'active',id:record.id});await done;return record;}finally{db.close();}
 }
 async function load(){const db=await open(factory);let record=null;
  try{const tx=db.transaction(['snapshots','state'],'readonly'),done=completion(tx);const get=tx.objectStore('state').get('active');
   get.onsuccess=()=>{if(get.result){const item=tx.objectStore('snapshots').get(get.result.id);item.onsuccess=()=>{record=item.result||null;};}};await done;
  }finally{db.close();}return record?await validate(record):null;
 }
 async function clearConfirmed(){const db=await open(factory);try{const tx=db.transaction(['snapshots','state'],'readwrite'),done=completion(tx);tx.objectStore('snapshots').clear();tx.objectStore('state').clear();await done;}finally{db.close();}}
 return {save:async selection=>commit(await prepare(selection)),load,restore:commit,clearConfirmed};
}
function base64(bytes){let value='';for(let i=0;i<bytes.length;i+=32768)value+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(value);}
async function exportData(record){
 await validate(record);const out={format:APP,version:1,app:'GLOW',createdAt:record.createdAt,settings:record.settings};
 for(const side of sides){const item=record[side];out[side]=item?{type:item.blob.type,size:item.blob.size,sha256:item.sha256,base64:base64(new Uint8Array(await item.blob.arrayBuffer()))}:null;}
 const text=JSON.stringify(out);if(new TextEncoder().encode(text).length>MAX_JSON)fail('写真バックアップの上限を超えています。');return text;
}
async function importData(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_JSON)fail('36MB以下のGLOW写真バックアップを選んでください。');
 const value=JSON.parse(text);if(value.format!==APP||value.version!==1||value.app!=='GLOW')fail('GLOWの写真バックアップではありません。');
 const selection={files:{},settings:settings(value.settings)};
 for(const side of sides){const item=value[side];if(!item){selection.files[side]=null;continue;}
  if(!types.has(item.type)||!Number.isInteger(item.size)||item.size<8||item.size>LIMIT||typeof item.base64!=='string'||item.base64.length>Math.ceil(LIMIT/3)*4)fail('写真バックアップの内容が不正です。');
  const raw=atob(item.base64),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));if(bytes.length!==item.size)fail('写真サイズが一致しません。');
  const blob=new Blob([bytes],{type:item.type}),checked=await image(blob);if(checked.sha256!==item.sha256)fail('写真の整合性が一致しません。');selection.files[side]=blob;
 }return prepare(selection);
}
const api={store,prepare,validate,exportData,importData,limits:{perImageBytes:LIMIT,backupBytes:MAX_JSON}};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else global.SuGGlowPhotoStore=api;
})(typeof window!=='undefined'?window:globalThis);

