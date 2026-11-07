(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.WHYRecovery=api;})(typeof window!=="undefined"?window:this,function(){
"use strict";
// Removal must succeed before replacing live state. No access to other version keys.
function removeBeforeReplace(getStorage,key){try{getStorage().removeItem(key);return{ok:true};}catch(e){return{ok:false,error:"端末内保存を更新できませんでした。現在の内容を保持しています。JSONを書き出してから再度確認してください。",code:e.name||"StorageError"};}}
function save(getStorage,key,text){try{getStorage().setItem(key,text);return{ok:true};}catch(e){return{ok:false,error:"端末内に保存できませんでした。入力は画面内に残っています。JSONを書き出してください。",code:e.name||"StorageError"};}}
return{removeBeforeReplace,save};
});
