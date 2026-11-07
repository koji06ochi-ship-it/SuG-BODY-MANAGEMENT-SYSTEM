(function(){'use strict';
 if(!window.WHYNative)return;
 const key='sug-why-ios-conversation-v1',opt='sug-why-ios-retain-conversation',section=document.createElement('section');section.className='data-section';
 section.innerHTML='<h2>このiPhoneの会話保存</h2><label><input type="checkbox" id="mobile-retain">会話をこのiPhoneに保存する</label><div class="form-actions"><button type="button" id="mobile-restore">保存した会話を確認・復元</button><button type="button" id="mobile-forget">保存した会話を削除</button></div>';
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','このiPhoneの保存');dialog.append(section);
 const close=document.createElement('button');close.type='button';close.textContent='戻る';close.addEventListener('click',()=>dialog.close());dialog.append(close);document.body.append(dialog);
 const open=document.createElement('button');open.type='button';open.textContent='このiPhoneへの保存';open.addEventListener('click',()=>dialog.showModal());document.getElementById('screen-memory').append(open);const input=section.querySelector('input');
 try{input.checked=localStorage.getItem(opt)==='yes'}catch{}
 const note=t=>window.WHYAppBridge.notify(t);
 const draftKey=key+'-drafts';
 function drafts(){if(!input.checked)return;try{localStorage.setItem(draftKey,JSON.stringify(Object.fromEntries(['home-input','chat-input'].map(id=>[id,document.getElementById(id).value]))))}catch{note('入力を端末に保存できませんでした')}}
 try{if(input.checked){const d=JSON.parse(localStorage.getItem(draftKey)||'{}');for(const id of ['home-input','chat-input'])if(typeof d[id]==='string'&&d[id].length<=2000)document.getElementById(id).value=d[id]}}catch{}
 for(const id of ['home-input','chat-input'])document.getElementById(id).addEventListener('input',drafts);
 function save(){if(!input.checked)return;try{const data=window.WHYLive?.current();if(data?.messages?.length)localStorage.setItem(key,JSON.stringify({kind:'sug-why-live-export',schemaVersion:1,data}));drafts()}catch{note('端末への会話保存に失敗しました。書き出して保全できます。')}}
 input.addEventListener('change',()=>{try{if(input.checked){localStorage.setItem(opt,'yes');save()}else{localStorage.removeItem(opt);localStorage.removeItem(key);localStorage.removeItem(draftKey)}}catch{note('保存設定を変更できませんでした')}});
 window.addEventListener('why-live-updated',save);
 section.querySelector('#mobile-forget').addEventListener('click',()=>{if(!confirm('このiPhoneに保存した会話と入力を削除しますか？ サーバーの会話は別です。'))return;localStorage.removeItem(key);localStorage.removeItem(opt);localStorage.removeItem(draftKey);input.checked=false;note('このiPhoneの会話保存を削除しました')});
 section.querySelector('#mobile-restore').addEventListener('click',()=>{try{const text=localStorage.getItem(key);if(!text){note('保存した会話はありません');return}dialog.close();document.getElementById('live-restore-open').click();document.getElementById('live-restore-text').value=text;}catch{note('保存した会話を読み取れませんでした')}});
 // iOS keyboard viewport: keep one history scroller; composer remains inside the visible page.
 function viewport(){document.documentElement.style.setProperty('--app-height',(window.visualViewport?.height||innerHeight)+'px')}
 window.visualViewport?.addEventListener('resize',viewport);viewport();
})();

window.addEventListener('why-device-connected',()=>window.WHYLive?.reconnect());
