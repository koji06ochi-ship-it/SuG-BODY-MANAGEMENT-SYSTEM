(()=>{
'use strict';
const core=window.SuGGlowPhotoStore,context=window.SuGGlowPhotoContext;if(!core||!context)return;
const storage=core.store();let busy=false,version=0,message='写真は選ぶだけでは保存されません。',panel;
function confirmPhoto(text){return new Promise(resolve=>{
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','写真操作の確認');dialog.style.cssText='width:min(92vw,440px);padding:22px;border-radius:14px;border:1px solid #b993a0;font:16px/1.6 system-ui;background:white;color:#241c22';
 const question=document.createElement('p');question.textContent=text;const cancel=document.createElement('button'),ok=document.createElement('button');cancel.type=ok.type='button';cancel.textContent='キャンセル';ok.textContent='続ける';for(const b of [cancel,ok])b.style.cssText='font:inherit;min-height:44px;padding:10px 18px;margin:4px';
 let result=false;ok.onclick=()=>{result=true;dialog.close();};cancel.onclick=()=>dialog.close();dialog.onclose=()=>{dialog.remove();resolve(result);};dialog.append(question,cancel,ok);document.body.append(dialog);dialog.showModal();cancel.focus();
});}

function status(text){message=text;const out=document.getElementById('glowPhotoStatus');if(out)out.textContent=text;}
async function action(task){if(busy)return;busy=true;refresh();try{await task();}catch(error){status(error.message||'操作できません。以前の保存写真は保持しています。');}finally{busy=false;refresh();}}
function refresh(){if(!panel?.isConnected)return;panel.querySelectorAll('button,input').forEach(el=>el.disabled=busy);}
function mount(){
 const notice=document.getElementById('sugMasterContext');if(notice)notice.textContent=notice.textContent.replace('写真は一時表示。','写真は端末保存を押したものだけ保持。');
 const host=document.getElementById('clearPhotos')?.parentElement;if(!host||document.getElementById('glowPhotoActions'))return;
 panel=document.createElement('section');panel.id='glowPhotoActions';panel.style.cssText='flex-basis:100%;width:100%;margin-top:12px';
 panel.innerHTML='<button type="button" class="secondary" data-photo-save>写真を端末に保存</button><p id="glowPhotoStatus" class="note" role="status"></p><details><summary>写真の保存と復元</summary><p class="note">保存した写真はこのアプリ内だけに保持します。写真バックアップは暗号化されません。</p><button type="button" class="ghost" data-photo-show>保存した写真を表示</button> <button type="button" class="ghost" data-photo-export>写真バックアップ</button><label class="fileload">写真バックアップから復元<input type="file" accept=".json,application/json" data-photo-import></label><button type="button" class="ghost" data-photo-delete>保存した写真をすべて削除</button></details>';
 host.append(panel);status(message);
 panel.querySelector('[data-photo-save]').onclick=()=>action(async()=>{const at=version;await storage.save(context.snapshot());status(at===version?'写真と撮影条件を端末に保存しました。次回起動時にも表示します。':'選択時点の写真を保存しました。現在の選択は未保存です。');});
 panel.querySelector('[data-photo-show]').onclick=()=>action(async()=>{const at=version,record=await storage.load();if(!record){status('保存した写真はありません。');return;}if(at!==version)return;context.show(record);status('保存した写真を表示しました。');});
 panel.querySelector('[data-photo-export]').onclick=()=>action(async()=>{const record=await storage.load();if(!record){status('先に写真を端末に保存してください。');return;}if(!await confirmPhoto('写真と撮影条件を、暗号化されないJSONファイルへ書き出しますか？'))return;const text=await core.exportData(record),href=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=href;a.download='SUG-GLOW-photos.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),3000);status('保存先の選択を確認してください。写真の端末内保存は維持しています。');});
 panel.querySelector('[data-photo-import]').onchange=e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;action(async()=>{if(file.size>core.limits.backupBytes)throw Error('36MB以下の写真バックアップを選んでください。');const record=await core.importData(await file.text());if(!await confirmPhoto('写真バックアップを新しい保存版として追加して表示しますか？以前の保存版は上書きしません。'))return;await storage.restore(record);context.show(record);status('写真を新しい保存版として復元しました。');});};
 panel.querySelector('[data-photo-delete]').onclick=()=>action(async()=>{if(!await confirmPhoto('このGLOW内に保存した写真と撮影条件の全保存版を削除しますか？他の記録や写真アプリの原本は削除しません。'))return;await storage.clearConfirmed();status('GLOW内の保存写真を削除しました。現在表示している写真は一時表示です。');});
 refresh();
}
document.addEventListener('change',e=>{if(e.target.matches?.('[data-file],[data-set]')){version++;status('写真または撮影条件を変更しました。現在の選択は未保存です。');}},true);
document.addEventListener('click',e=>{if(e.target.closest?.('#clearPhotos')){version++;status('写真の表示を解除しました。保存済み写真は保持しています。');}},true);
new MutationObserver(mount).observe(document.getElementById('screen')||document.body,{childList:true,subtree:true});mount();
const initialVersion=version;
storage.load().then(record=>{const selection=context.snapshot();if(record&&version===initialVersion&&!selection.files.before&&!selection.files.after){context.show(record);status('前回保存した写真と撮影条件を表示しています。');}}).catch(error=>status(error.message));
})();

