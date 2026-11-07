// Cross-origin iframe load is NOT evidence that map tiles rendered.
export function createMapStatus({frame,status,retry,external,timers=globalThis,online=()=>navigator.onLine}){
 let current=null,timer=null,lastLoad=-Infinity;
 function message(text){status.textContent=text;}
 function load(url,link){
  current={url,link};external.href=link;lastLoad=Date.now();retry.disabled=true;
  if(timer!==null)timers.clearTimeout(timer);
  message(online()?'地図を読み込み中です。歩行記録は地図と独立して動作します。':'オフラインです。地図を取得できません。通信回復後に再読込してください。');
  frame.src=url;
  timer=timers.setTimeout(()=>{retry.disabled=false;message('地図の表示を確認できません。白い画面の場合は再読込、または外部地図を開いてください。');},15000);
 }
 frame.addEventListener('load',()=>{if(!current)return;if(timer!==null)timers.clearTimeout(timer);retry.disabled=false;message('地図が白い・表示されない場合は、再読込または外部地図をお試しください。');});
 frame.addEventListener('error',()=>{if(timer!==null)timers.clearTimeout(timer);retry.disabled=false;message('地図を読み込めませんでした。通信を確認して再読込、または外部地図を開いてください。');});
 retry.addEventListener('click',()=>{if(!current)return;if(Date.now()-lastLoad<5000){message('再読込は5秒以上あけてください。');return;}load(current.url,current.link);});
 return {load,offline(){message('オフラインです。地図の更新には通信が必要です。GPS記録は別に動作します。');}};
}
