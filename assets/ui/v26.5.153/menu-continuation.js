(()=>{
'use strict';
const VERSION='26.5.195';
const STYLE=`<style id="sug153-style">#sug153Continue{margin:14px 0 10px;padding:13px 14px;border:1px solid #5a4a25;border-radius:13px;background:linear-gradient(180deg,#1b170d,#111);color:#f3d98b;text-align:center;font-size:13px;font-weight:900;line-height:1.55;animation:sug153Pulse 1.5s ease-in-out 2}@keyframes sug153Pulse{50%{box-shadow:0 0 18px rgba(243,217,139,.28)}}#sug153Continue small{display:block;margin-top:3px;color:#aaa;font-size:10px;font-weight:600}</style>`;
function installStyle(){if(!document.getElementById('sug153-style'))document.head.insertAdjacentHTML('beforeend',STYLE)}
function menuCard(){const cards=[...document.querySelectorAll('#smart .card')].filter(x=>x.offsetParent!==null);return cards.find(c=>/今日の自動メニュー/.test(c.textContent||'')&&/鍛える場所/.test(c.textContent||''))||null}
function firstExercise(card){if(!card)return null;const els=[...card.querySelectorAll('div,section,article,li')].filter(el=>el.offsetParent!==null&&/rep/i.test(el.textContent||'')&&/RIR/i.test(el.textContent||'')&&/REST/i.test(el.textContent||''));return els.sort((a,b)=>(a.getBoundingClientRect().height||999)-(b.getBoundingClientRect().height||999))[0]||null}
function guide(){const card=menuCard();if(!card)return;document.getElementById('sug153Continue')?.remove();const target=firstExercise(card);if(!target)return;const note=document.createElement('div');note.id='sug153Continue';note.innerHTML='今日のメニューを作成しました ↓<small>内容を確認して、下のトレーニング開始へ進みます</small>';target.before(note)}
function onClick(e){if(!e.target.closest?.('#sug149Apply'))return;setTimeout(guide,650)}
installStyle();document.addEventListener('click',onClick,true);window.__SUG_MENU_CONTINUATION_VERSION__=VERSION;
})();