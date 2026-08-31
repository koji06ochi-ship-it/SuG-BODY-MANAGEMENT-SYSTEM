(()=>{
  const VERSION='26.5.213';
  const SPRITE_TEXT='./assets/quest/quest-v213-characters-sprite.webp?v='+VERSION;
  const manifestUrl='./assets/quest/characters-v26.5.213.json?v='+VERSION;
  const HIDDEN_IDS=new Set(['family-core','yuto-baseball','yuzu-baby','yuto-yuzu-go','yuto-yuzu-nice','yuto-yuzu-thanks']);
  const css=`
  .v213Characters{margin:12px 0;border:1px solid #594624;border-radius:18px;background:linear-gradient(145deg,#17120b,#090806);padding:12px}
  .v213Characters h3{margin:0;color:#ffe4a1;font-size:13px}.v213Characters p{margin:4px 0 10px;color:#938775;font:600 8px/1.5 -apple-system}
  .v213Strip{display:flex;gap:9px;overflow:auto;padding-bottom:4px}.v213Char{min-width:92px;border:1px solid #3d301d;border-radius:13px;background:#11100c;padding:7px;color:#ddd;text-align:left}
  .v213Char.on{border-color:#d1a54d;box-shadow:0 0 0 1px #d1a54d44}.v213Avatar{display:block;width:78px;height:78px;border-radius:10px;background-size:500% 400%;background-repeat:no-repeat;background-color:#21190e}
  .v213Char b{display:block;margin-top:6px;font:800 9px/1.3 -apple-system;color:#ffe3a0}.v213Char small{display:block;margin-top:3px;color:#8e8372;font:700 7px/1.3 -apple-system}
  .v213Dialogue{display:none;margin-top:10px;border:1px solid #4c3a1e;border-radius:13px;padding:10px;background:#0d0a07}.v213Dialogue.on{display:grid;grid-template-columns:56px 1fr;gap:9px;align-items:center}.v213Dialogue .v213Avatar{width:56px;height:56px;border-radius:12px}.v213Dialogue b{color:#ffe3a0;font-size:11px}.v213Dialogue span{display:block;margin-top:4px;color:#c7baa1;font:600 9px/1.55 -apple-system}
  `;
  const lines={
    'reflection-hero':'最後に今日の楽しかったこと、しんどかったこと、次どうするかを残そう。','habit-npc':'明日からやる、は禁止や。今日1個だけ終わらせよ。','daily-quest-guide':'今日やり！ まず目的地をひとつ。','training-achievement':'重量更新したらポイント獲得。動けりゃええねん。','reaction-npc':'そのあと？ 次の行動まで決めよか。','sleep-recovery-quest':'寝不足なら回復QUESTに切り替えや。','walking-route-quest':'歩けば街が解放される。次の地点まで行こ。','training-npc':'筋肉にただ積むだけや!!','history-route-boss-card':'歴史ルート解放。由緒とつながりを確認して次へ進め。'
  };
  async function loadManifest(){const r=await fetch(manifestUrl,{cache:'no-store'});if(!r.ok)throw new Error('character manifest '+r.status);return r.json()}
  async function loadSprite(){const r=await fetch(SPRITE_TEXT,{cache:'no-store'});if(!r.ok)throw new Error('character sprite '+r.status);const b64=(await r.text()).replace(/\s+/g,'');if(!b64)throw new Error('empty sprite');return 'data:image/webp;base64,'+b64}
  function pos(i){const c=i%5,r=Math.floor(i/5);return `${c*25}% ${r*(100/3)}%`}
  function setAvatar(el,i,sprite){el.style.backgroundImage=`url("${sprite}")`;el.style.backgroundPosition=pos(i)}
  async function mount(doc){
    if(!doc||doc.getElementById('v213Characters'))return;
    const style=doc.createElement('style');style.id='v213CharacterStyle';style.textContent=css;doc.head.appendChild(style);
    try{
      const [data,sprite]=await Promise.all([loadManifest(),loadSprite()]);
      const today=doc.getElementById('today');if(!today)return;
      const visible=data.characters.map((c,i)=>({c,i})).filter(x=>!HIDDEN_IDS.has(x.c.id));
      const box=doc.createElement('section');box.className='v213Characters';box.id='v213Characters';
      box.innerHTML='<h3>S.u.G QUEST CHARACTERS</h3><p>街探索・トレーニング・回復・歴史ルートで登場</p><div class="v213Strip"></div><div class="v213Dialogue"><div class="v213Avatar"></div><div><b></b><span></span></div></div>';
      const strip=box.querySelector('.v213Strip'),dlg=box.querySelector('.v213Dialogue'),dlgAvatar=dlg.querySelector('.v213Avatar'),dlgName=dlg.querySelector('b'),dlgLine=dlg.querySelector('span');
      visible.forEach(({c,i},j)=>{
        const b=doc.createElement('button');b.className='v213Char';b.dataset.character=c.id;b.innerHTML='<div class="v213Avatar"></div><b></b><small></small>';setAvatar(b.querySelector('.v213Avatar'),i,sprite);b.querySelector('b').textContent=c.name;b.querySelector('small').textContent=c.role;
        b.onclick=()=>{strip.querySelectorAll('.v213Char').forEach(x=>x.classList.remove('on'));b.classList.add('on');dlg.classList.add('on');setAvatar(dlgAvatar,i,sprite);dlgName.textContent=c.name;dlgLine.textContent=lines[c.role]||'QUESTで登場するキャラクター。'};
        strip.appendChild(b);if(j===0)setTimeout(()=>b.click(),0)
      });
      const q=today.querySelector('.quest');if(q)q.insertAdjacentElement('afterend',box);else today.appendChild(box);
    }catch(e){console.error('V213 characters',e)}
  }
  function boot(){const f=document.getElementById('questFrame');if(f){const run=()=>{try{mount(f.contentDocument)}catch(e){console.error(e)}};f.addEventListener('load',run);run()}else mount(document)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
