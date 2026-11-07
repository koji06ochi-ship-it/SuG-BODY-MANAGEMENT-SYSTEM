(() => {
 'use strict';
 const handler=window.webkit?.messageHandlers?.sugJSON;
 if(!handler||location.protocol!=='http:'||location.hostname!=='127.0.0.1')return;
 function save(a){if(!/\.json$/i.test(a.download)||!a.href.startsWith('blob:'+location.origin+'/'))return false;
  fetch(a.href).then(r=>{if(!r.ok)throw Error();return r.text()}).then(json=>handler.postMessage({kind:'export',json})).catch(()=>window.dispatchEvent(new CustomEvent('sug:native-export-error')));return true;}
 const original=HTMLAnchorElement.prototype.click;
 HTMLAnchorElement.prototype.click=function(){if(!save(this))return original.call(this);};
 document.addEventListener('click',e=>{const a=e.target.closest?.('a[download]');if(a&&save(a))e.preventDefault();},true);
 window.addEventListener('sug:native-export-error',()=>{const status=document.createElement('p');status.setAttribute('role','alert');status.textContent='書き出せませんでした。保存済み記録は保持しています。';status.style.cssText='position:fixed;bottom:80px;left:16px;right:16px;z-index:9999;padding:16px;background:#fff;color:#111';document.body.append(status)});
})();
