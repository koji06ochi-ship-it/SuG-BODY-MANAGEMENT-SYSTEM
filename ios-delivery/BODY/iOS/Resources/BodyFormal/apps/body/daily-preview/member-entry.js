(()=>{'use strict';
const main=document.querySelector('main.w');if(!main)return;
const section=document.createElement('section');section.className='card';section.id='dailyBodyEntry';
const title=document.createElement('h2');title.textContent='今日の状態から、実践と次回の調整へ。';
const desc=document.createElement('p');desc.className='sub';desc.textContent='基本情報・歩行・睡眠・回復 → 今日の提案 → 種目・重量・回数・セットの記録。既存記録とは別保存の操作候補です。';
const link=document.createElement('a');link.href='./daily-preview/index.html';link.textContent='今日のBODYを開く →';link.style.cssText='display:inline-block;padding:14px 18px;border-radius:12px;background:#f7f5f0;color:#242424;font-weight:700;text-decoration:none';
const back=document.createElement('a');back.href='../../member-hub.html';back.textContent='会員HUBへ';back.style.cssText='display:block;margin-top:14px;color:inherit';
section.append(title,desc,link,back);const hero=main.querySelector('.hero');if(hero)hero.after(section);else main.prepend(section);
})();
