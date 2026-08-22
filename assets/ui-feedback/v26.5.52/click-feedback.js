(function(){'use strict';
if(window.__SUG_CLICK_FEEDBACK_VERSION__==='26.5.52')return;
window.__SUG_CLICK_FEEDBACK_VERSION__='26.5.52';
var style=document.createElement('style');
style.id='sugClickFeedbackStyle';
style.textContent='\nbutton,.tab,[role="button"],a.primary,a.secondary,label.primary,label.secondary,summary{transition:background-color .12s ease,border-color .12s ease,color .12s ease,opacity .12s ease,transform .08s ease,filter .12s ease!important;-webkit-tap-highlight-color:transparent;}\n.sug-click-feedback{background:#555!important;background-image:none!important;border-color:#777!important;color:#fff!important;filter:none!important;box-shadow:none!important;transform:scale(.985)!important;opacity:.92!important;}\n.sug-click-feedback *{color:#fff!important;}\n.sug-click-feedback-pulse{outline:2px solid rgba(255,255,255,.24)!important;outline-offset:1px!important;}\n';
document.head.appendChild(style);
function targetFrom(e){var el=e.target&&e.target.closest?e.target.closest('button,.tab,[role="button"],a.primary,a.secondary,label.primary,label.secondary,summary'):null;if(!el||el.matches('[disabled],.disabled,[aria-disabled="true"]'))return null;return el}
var timers=new WeakMap();
function flash(el){if(!el)return;var old=timers.get(el);if(old)clearTimeout(old);el.classList.add('sug-click-feedback','sug-click-feedback-pulse');requestAnimationFrame(function(){el.classList.remove('sug-click-feedback-pulse')});var t=setTimeout(function(){el.classList.remove('sug-click-feedback');timers.delete(el)},520);timers.set(el,t)}
document.addEventListener('pointerdown',function(e){var el=targetFrom(e);if(el)flash(el)},true);
document.addEventListener('click',function(e){var el=targetFrom(e);if(el)flash(el)},true);
document.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var el=targetFrom(e);if(el)flash(el)},true);
})();