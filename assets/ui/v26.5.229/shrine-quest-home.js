(()=>{
  const ID='sugShrineQuestHomeLauncher';
  if(document.getElementById(ID)) return;

  const style=document.createElement('style');
  style.id=ID+'Style';
  style.textContent=`
    #${ID}{margin:8px 0 12px;display:none}
    #${ID}.show{display:block}
    #${ID} .sqh-card{width:100%;appearance:none;border:1px solid #725b2c;background:linear-gradient(135deg,#17130b,#0d0d10 58%,#09090b);color:#fff;border-radius:18px;padding:10px;display:grid;grid-template-columns:78px 1fr auto;gap:12px;align-items:center;text-align:left;box-shadow:0 10px 28px rgba(0,0,0,.28)}
    #${ID} .sqh-icon{width:78px;height:78px;border-radius:17px;object-fit:cover;border:1px solid #a98536;box-shadow:0 0 20px rgba(216,179,91,.18)}
    #${ID} .sqh-kicker{font-size:9px;font-weight:900;letter-spacing:.16em;color:#e5c56e}
    #${ID} .sqh-title{font-size:19px;font-weight:950;letter-spacing:.05em;margin-top:3px}
    #${ID} .sqh-sub{font-size:10px;color:#aaa;line-height:1.55;margin-top:3px}
    #${ID} .sqh-go{font-size:22px;color:#e5c56e;padding-right:5px}
    @media(max-width:420px){#${ID} .sqh-card{grid-template-columns:68px 1fr auto;gap:10px}#${ID} .sqh-icon{width:68px;height:68px}#${ID} .sqh-title{font-size:17px}}
  `;
  document.head.appendChild(style);

  const box=document.createElement('div');
  box.id=ID;
  box.innerHTML=`<button class="sqh-card" type="button" aria-label="S.u.G Shrine Questを開く"><img class="sqh-icon" src="./assets/quest/quest-home-icon.jpg?v=229" alt="QUEST"><div><div class="sqh-kicker">S.u.G QUEST</div><div class="sqh-title">神社QUEST</div><div class="sqh-sub">歩いて、集めて、つながる。現地チェックインで神縁を解放。</div></div><div class="sqh-go">›</div></button>`;

  const nav=document.getElementById('sugPrimaryNavigation');
  if(nav) nav.insertAdjacentElement('afterend',box);
  else (document.querySelector('.wrap')||document.body).prepend(box);

  box.querySelector('button').addEventListener('click',()=>{
    location.href='./shrine-quest-v26.5.206.html?v=206&from=home';
  });

  const sync=()=>{
    const homeTab=document.querySelector('.tab[data-tab="dash"]');
    box.classList.toggle('show',!!homeTab?.classList.contains('active'));
  };
  sync();
  new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>setTimeout(sync,0)));
})();