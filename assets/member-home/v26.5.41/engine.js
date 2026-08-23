(function(){
'use strict';
function member(){try{return typeof m==='function'?m():null}catch(e){return null}}
function escx(v){try{return typeof esc==='function'?esc(String(v??'')):String(v??'')}catch(e){return String(v??'')}}
function goal(){return member()?.goalPlan||{}}
function isFemale(){return /^female_/.test(String(goal().idealVisionType||''))}
function baseKey(){return String(goal().idealVisionType||'').replace(/^female_/,'')}
function idealUrl(){const k=baseKey();if(!k)return '';return isFemale()?`assets/ideal-vision/v26.5.24/okame-${k}.webp?v=26.5.41`:`assets/ideal-vision/v26.5.20/${k}.webp?v=26.5.41`}
function latestFront(){const rows=(member()?.photos||[]).filter(x=>x&&(!x.view||x.view==='front')).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));return rows.at(-1)||null}
async function currentUrl(ph){if(!ph)return '';try{if(typeof getPhotoSignedUrl==='function'){const u=await getPhotoSignedUrl(ph);if(u)return u}}catch(e){}return ph.data||ph.url||''}
function priorities(){const g=goal(),out=[];[g.priority1,g.priority2,g.priority3].forEach(x=>{if(x&&x!=='全身'&&!out.includes(x))out.push(x)});try{if(typeof window.generateIdealDailyPlan==='function'){const p=window.generateIdealDailyPlan();const z=(p?.priorities||[]).map(x=>x?.part).filter(Boolean).slice(0,3);if(z.length)return z}}catch(e){}return out.slice(0,3)}
function go(tab){document.querySelector(`.tab[data-tab="${tab}"]`)?.click()}
window.openSugCurrentPhoto=function(){go('photos')};
window.openSugGapMenu=function(){go('smart')};
async function render(){
 const mm=member(),home=document.getElementById('dash');if(!mm||!home)return false;
 const g=goal(),k=baseKey();if(!g.idealVisionType||!k)return false;
 let card=document.getElementById('sugCurrentIdealCard');
 if(!card){card=document.createElement('div');card.id='sugCurrentIdealCard';card.className='card';card.style.cssText='border:1px solid #6b5724;background:linear-gradient(180deg,#18150e,#101012);';const anchor=document.getElementById('memberHomeIdealCard')||document.querySelector('#dash .idealTodayCard')||document.querySelector('#dash .card');if(!anchor)return false;anchor.insertAdjacentElement('afterend',card)}
 const ph=latestFront(),cur=await currentUrl(ph),ideal=idealUrl(),tops=priorities(),face=isFemale()?'おかめ':'ひょっとこ',name=g.idealVisionName||k.toUpperCase();
 card.innerHTML=`<div style="font-size:10px;color:#d8b35b;font-weight:900;letter-spacing:.06em">CURRENT ↔ IDEAL</div><div style="font-size:19px;font-weight:900;margin-top:4px">今の体 ↔ 理想${face}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><div style="overflow:hidden;border:1px solid #303038;border-radius:12px;background:#0c0c0f">${cur?`<img src="${cur}" alt="今の体" style="display:block;width:100%;aspect-ratio:3/4;object-fit:cover">`:`<div style="aspect-ratio:3/4;display:grid;place-items:center;color:#888;text-align:center;padding:10px">正面写真<br>未登録</div>`}<div style="padding:8px;font-size:10px;color:#aaa"><b style="display:block;color:#f3d98b">今の体</b>${escx(ph?.date||'写真を登録してください')}</div></div><div style="overflow:hidden;border:1px solid #303038;border-radius:12px;background:#0c0c0f"><img src="${ideal}" alt="理想${face}" style="display:block;width:100%;aspect-ratio:3/4;object-fit:cover"><div style="padding:8px;font-size:10px;color:#aaa"><b style="display:block;color:#f3d98b">理想${face}</b>${escx(name)}</div></div></div><div style="margin-top:10px;padding:10px;border:1px solid #39301c;border-radius:10px;background:#0d0d10"><span style="font-size:9px;color:#999">GAP｜優先部位 TOP3</span><b style="display:block;color:#f3d98b;font-size:15px;margin-top:4px">${escx(tops.join('・')||'評価待ち')}</b></div>${!cur?'<button type="button" class="secondary" style="width:100%;margin-top:9px" onclick="openSugCurrentPhoto()">今の体を撮影・登録する</button>':''}<button type="button" class="primary" style="width:100%;margin-top:8px" onclick="openSugGapMenu()">このGAPから今日のメニューを見る</button><div style="font-size:9px;color:#777;margin-top:7px;text-align:right">V26.5.41</div>`;
 return true;
}
window.renderSugCurrentIdealV26541=render;
function tick(){render().catch(()=>{})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(tick,200);setTimeout(tick,1000);setTimeout(tick,2500)},{once:true});else{setTimeout(tick,100);setTimeout(tick,900);setTimeout(tick,2200)}
})();