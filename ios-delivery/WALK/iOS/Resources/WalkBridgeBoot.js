// Installed at document start only in the native WALK WebView.
(() => {
  // No second browser GPS owner, including child frames in this dedicated view.
  try {
    const denied = (_ok, error) => { if (typeof error === 'function') queueMicrotask(() => error({code:1,message:'Native WALK owns location. Use the native controls.'})); return 0; };
    Object.defineProperty(navigator, 'geolocation', {configurable:false,value:Object.freeze({getCurrentPosition:denied,watchPosition:denied,clearWatch(){}})});
  } catch { return; }
  if (window !== window.top || location.origin !== sugWalkBootConfig.origin || location.pathname !== sugWalkBootConfig.path) return;
  Object.defineProperty(window, '__SUG_NATIVE_WALK_OWNER__', {configurable:false,writable:false,value:Object.freeze({schema:1,streamId:sugWalkBootConfig.streamId})});
  // Old deployed pages have no adapter yet. Clearly identify the native owner.
  document.addEventListener('DOMContentLoaded', () => {
    const notice=document.createElement('p');notice.id='sugNativeOwnerNotice';notice.textContent='iOSネイティブ記録：開始・停止・保存はアプリ上部の操作パネルを使用します。';
    notice.style.cssText='margin:0;padding:12px;background:#252821;color:#ead397;font:14px/1.6 system-ui';document.body.prepend(notice);
  }, {once:true});
})();
