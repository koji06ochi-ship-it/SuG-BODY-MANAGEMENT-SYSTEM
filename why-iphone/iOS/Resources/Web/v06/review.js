'use strict';
const result=window.WHY_LIVE_RESULTS,$=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles={limits:'毎回、限界まで必要？',legs:'脚を太くしたくない',nutrition:'PFCが分からない',plateau:'頑張っているのに変わらない',correction:'その説明は違う・目的の変更',rest:'今は何もしたくない・終了'};
$('summary').textContent='記録済み17応答の使用量換算：約US$'+result.usageBasedEstimateUSD.toFixed(6)+'。不明1回を上限で加えた保守的上限：US$'+result.combinedConservativeEstimateUpperUSD.toFixed(6)+'。請求書未照合。';
$('theme').innerHTML=result.themes.map(t=>'<option value="'+t.id+'">'+esc(titles[t.id])+'</option>').join('');
function show(){const t=result.themes.find(t=>t.id===$('theme').value);$('conversation').innerHTML=t.turns.map(x=>'<article><p class="meta you">YOU / '+x.turn+'ターン目</p><p>'+esc(x.input)+'</p><p class="meta">WHY / '+(x.accepted?'実AI・記録済み':'検証停止')+'</p><p>'+esc(x.reply||'修正前の引用一致検証で停止しました。当時のraw応答・usageは未保存です。再試行していません。')+'</p>'+(x.metadata?'<p class="meta">HTTP '+x.metadata.httpStatus+' / input '+x.metadata.usage.input_tokens+'・output '+x.metadata.usage.output_tokens+' tokens / 履歴 '+x.historyMessages+'件</p>':'')+(x.validationWarnings.length?'<p class="warn">引用に一致しない解釈の抽出を除外しました。</p>':'')+'</article>').join('')}
$('theme').addEventListener('change',show);show();
