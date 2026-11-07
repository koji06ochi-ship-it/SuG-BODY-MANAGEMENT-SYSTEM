export const NOTE_PREFIX='sug_otohime_note_v1:';
export function reply(text){
  if(/アイデア|メモ|残したい/.test(text))return '浮かんだことを一文にすると、どんな言葉になりますか？ 下のアイデア欄から、自分で選んで保存できます。';
  if(/整理|考え|迷/.test(text))return '今気になっていることと、自分で変えられそうなことを一つずつ挙げてみませんか？';
  if(/疲|休憩|休み|眠/.test(text))return '今は休む時間を取りたいですか？ 気になっていることや、楽になりそうな過ごし方を教えてください。';
  if(/歩|散歩/.test(text))return 'どんな気分で歩きたいですか？ 今の自分に無理のない時間や、途中で休める場所を一緒に考えてみませんか？';
  return 'その中で、いちばん大切にしたいことは何ですか？ 話すだけでも、メモに残すだけでも大丈夫です。';
}
export function healthSummary(p,now=Date.now()){
  const stamp=Date.parse(p?.syncedAt), trusted=['healthkit_native','apple_health_shortcuts'].includes(p?.source);
  const status=!p?'未取得':!trusted||(p.authorizationStatus==='denied'||p.status==='denied')||!Number.isFinite(stamp)||stamp>now+300000?'日時・取得状態を確認できません':now-stamp>36*3600000?'古い同期データ（現在の状態には使いません）':'同期データあり（健康状態の判定には使いません）';
  const usable=trusted&&Number.isFinite(stamp)&&stamp<=now+300000&&p?.authorizationStatus!=='denied'&&p?.status!=='denied';
  const fields=[['歩数','steps','stepCount','歩'],['睡眠','sleepHours','sleep','時間'],['HRV','hrvMs','hrv','ms'],['安静時心拍','restingHeartRate','restingHeartRate','bpm'],['運動時間','exerciseMinutes','exerciseMinutes','分']];
  return {status,syncedAt:Number.isFinite(stamp)?new Date(stamp).toISOString():null,values:fields.map(([label,key,alias,unit])=>{const v=p?.[key]??p?.[alias];return {label,value:usable&&typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null,unit};})};
}
export function recoveryGuidance(packet,walkSession=null,now=Date.now()){
  const summary=healthSummary(packet,now);
  const trusted=['healthkit_native','apple_health_shortcuts'].includes(packet?.source);
  const synced=Date.parse(packet?.syncedAt);
  const fresh=trusted&&Number.isFinite(synced)&&synced<=now+300000&&now-synced<=36*3600000&&packet?.authorizationStatus!=='denied'&&packet?.status!=='denied';
  const general='健康データを確認できないため一般的な案内です。今日の予定とご自身の体感を見ながら、休憩するか無理のない範囲で動くかを選んでください。';
  const values=new Map(summary.values.map(item=>[item.label,item.value]));
  const guidance=[];
  if(fresh){
    const steps=values.get('歩数'),sleep=values.get('睡眠'),exercise=values.get('運動時間');
    if(steps!==null)guidance.push('同期された歩数は'+Math.round(steps).toLocaleString('ja-JP')+'歩です。計測範囲もあるため、数字だけで活動状態を決めず、歩くなら心地よい範囲にしましょう。');
    if(sleep!==null)guidance.push('同期された睡眠記録は'+sleep.toFixed(1)+'時間です。今日は予定と体感に合わせて、休憩や活動量を選んでください。');
    if(exercise!==null)guidance.push('同期された運動時間は'+Math.round(exercise)+'分です。運動を追加するか休むかは、ご自身の体感と予定を優先してください。');
  }
  const meters=walkSession?.meters,ms=walkSession?.ms;
  if(Number.isFinite(meters)&&meters>=0&&Number.isFinite(ms)&&ms>=0&&(meters>0||ms>0))guidance.push('端末内のWALK記録は約'+Math.round(meters)+'m / '+Math.floor(ms/60000)+'分です。記録時刻は確認できないため、今日の実績とは断定しません。');
  if(!fresh||guidance.length===0)return general;
  return '記録を参考にした一般的な案内です。'+guidance.join(' ');
}
export function listNotes(storage){const rows=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(!key?.startsWith(NOTE_PREFIX))continue;try{const n=JSON.parse(storage.getItem(key));if(typeof n.text==='string'&&Number.isFinite(Date.parse(n.at)))rows.push({...n,key});}catch{}}return rows.sort((a,b)=>b.at.localeCompare(a.at));}
export function saveNote(storage,text,id,now=new Date().toISOString()){text=text.trim();if(!text||text.length>2000)throw Error('1〜2000文字で入力してください。');const key=NOTE_PREFIX+id;if(storage.getItem(key)!==null)throw Error('保存IDが重複しています。再度保存してください。');storage.setItem(key,JSON.stringify({text,at:now}));return key;}
export function deleteNote(storage,key){if(!key.startsWith(NOTE_PREFIX))throw Error('メモ以外は削除できません。');storage.removeItem(key);}
