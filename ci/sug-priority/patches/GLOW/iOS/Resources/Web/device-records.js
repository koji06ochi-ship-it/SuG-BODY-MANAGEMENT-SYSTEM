(()=>{
 'use strict';
 const config=window.SuGDeviceConfig;if(!config||window.top!==window)return;
 let core;try{core=window.SuGDeviceRecordsCore.controller(localStorage,config)}catch{return}
 let dialog,pendingData=null;
 function open(){if(!dialog){
  dialog=document.createElement('dialog');dialog.setAttribute('aria-label','記録の保存と復元');
  dialog.style.cssText='width:min(92vw,480px);max-height:85dvh;overflow:auto;border:1px solid #777;border-radius:16px;background:#fff;color:#18251e;padding:22px;font:16px/1.6 system-ui';
  dialog.innerHTML='<h2 style="font-size:21px;margin-top:0">記録の保存と復元</h2><p>このアプリの端末内記録だけを扱います。書出しファイルは暗号化されません。写真は別の「写真バックアップ」で保存・復元します。</p><button type="button" data-export>ファイルへ保存</button><p><label>保存ファイルから復元<input data-import type="file" accept=".json,application/json"></label></p><p>復元は未保存の項目だけを追加します。既にある異なる記録は上書きしません。</p><output role="status" style="display:block;margin:12px 0"></output><button type="button" data-restore hidden>確認して復元</button> <button type="button" data-reload hidden>未保存入力を破棄して再読込</button> <button type="button" data-close>閉じる</button>';
  for(const b of dialog.querySelectorAll('button'))b.style.cssText='font:inherit;padding:10px 14px;min-height:44px;margin:4px 0';
  document.body.append(dialog);const status=t=>{dialog.querySelector('output').textContent=t};
  dialog.querySelector('[data-close]').onclick=()=>{pendingData=null;dialog.querySelector('[data-restore]').hidden=true;dialog.close()};
  dialog.querySelector('[data-export]').onclick=()=>{try{
   const blob=new Blob([JSON.stringify(core.exportData(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='SUG-'+config.app+'-records.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);status('保存先の選択を確認してください。');
  }catch(e){status('保存できません：'+e.message)}};
  dialog.querySelector('[data-import]').onchange=async e=>{try{
   const file=e.target.files[0];if(!file)return;if(file.size>20*1024*1024)throw Error('20MB以下のファイルを選んでください。');
   const data=JSON.parse(await file.text()),records=core.inspect(data);
   pendingData=data;status(records.length+'項目を確認しました。まだ復元していません。「確認して復元」で未保存の項目だけを追加します。');dialog.querySelector('[data-restore]').hidden=false;
  }catch(error){pendingData=null;dialog.querySelector('[data-restore]').hidden=true;status('復元できません：'+error.message)}finally{e.target.value=''}};
  dialog.querySelector('[data-restore]').onclick=()=>{if(!pendingData)return;try{const r=core.restore(pendingData);status('追加 '+r.added+'件・同じ記録 '+r.identical+'件・既存を保持 '+r.conflicts+'件。');dialog.querySelector('[data-reload]').hidden=r.added===0;pendingData=null;dialog.querySelector('[data-restore]').hidden=true}catch(error){status('復元できません：'+error.message)}};
  dialog.querySelector('[data-reload]').onclick=()=>location.reload();
 }
 dialog.showModal();}
 window.SuGDeviceRecords={open};
 function add(){if(window.webkit?.messageHandlers?.sugJSON)return;const button=document.createElement('button');button.type='button';button.textContent='記録の保存・復元';button.style.cssText='font:inherit;padding:10px 14px;min-height:44px;margin:16px';button.onclick=open;document.body.append(button)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add();
})();
