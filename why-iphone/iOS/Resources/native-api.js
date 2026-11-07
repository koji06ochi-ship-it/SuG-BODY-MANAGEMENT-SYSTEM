(function(){'use strict';
 const handler=window.webkit?.messageHandlers?.whyDevice;
 if(!handler||location.origin!=='http://127.0.0.1:5415')return;
 const ordinary=window.fetch.bind(window);window.WHYNative={installedApp:true};
 window.fetch=async function(input,init={}){
  const url=new URL(typeof input==='string'?input:input.url,location.href);
  if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return ordinary(input,init);
  if(typeof input!=='string'||url.search||!/^\/api\/[a-z-]+$/.test(url.pathname))throw Error('native_route_invalid');
  const result=await handler.postMessage({kind:'api',path:url.pathname,method:init.method||'GET',body:init.body||'',csrf:init.headers?.['X-WHY-CSRF']||''});
  return new Response(result.body,{status:result.status,headers:{'Content-Type':'application/json'}});
 };
 // Blob download is an explicit user export, forwarded to the native Files picker.
 document.addEventListener('click',async e=>{const a=e.target.closest?.('a[download]');if(!a||!a.href.startsWith('blob:'))return;e.preventDefault();try{const text=await(await ordinary(a.href)).text();await handler.postMessage({kind:'export',json:text});}catch{window.dispatchEvent(new CustomEvent('why-native-error',{detail:'ファイルに書き出せませんでした'}));}},true);
})();
