(function(){
"use strict";
const G=window.WHYGate,B=window.WHYAppBridge,K=window.WHY_KNOWLEDGE,$=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cache=new Map();let opener=null;
function initial(ownerId){const a={ownerId,revision:0,draft:"",models:G.defaultModels(),modelId:"unset",ledger:G.newLedger(ownerId),preview:null,consent:null,persist:false,beforeReset:null};
 try{const raw=localStorage.getItem("sug-why-prep-v08-"+ownerId);if(raw){const r=G.restoreLedger(raw,ownerId);if(r.ok){a.ledger=r.ledger;a.persist=true;}else a.error=r.error;}}catch(e){a.error="試算台帳の保存を利用できません。画面内では試せます。";}return a;}
let active=initial("guest");
const currentModel=()=>active.models.find(x=>x.id===active.modelId);
function status(text){$("prep-message").textContent=text;}
function invalidate(reason){active.revision++;active.preview=null;active.consent=G.revoke(active.consent);$("grant-consent").disabled=true;if($("consent-dialog").open)$("consent-dialog-status").textContent=reason||"内容が変わりました。確認画面を開き直してください。";render();}
function persist(){if(!active.persist)return;const r=G.offlineStore(()=>localStorage,"sug-why-prep-v08-"+active.ownerId,active.ledger);if(!r.ok){active.persist=false;status("試算台帳を保存できません。画面内の内容を保持しています。JSON表示から書き出せます。");}}
function quote(){return G.estimate(currentModel(),[{input:integer("input-tokens"),output:integer("output-tokens")}]);}
function integer(id){const raw=$(id).value;if(raw==="")throw Error("空欄の数値があります。");const x=Number(raw);if(!Number.isSafeInteger(x)||x<0)throw Error("0以上の整数で入力してください。");return x;}
function money(id){const raw=$(id).value,x=Number(raw);if(raw===""||!Number.isFinite(x)||x<0||!Number.isSafeInteger(Math.round(x*1e6)))throw Error("予算は0以上の有限な金額で指定してください。");return Math.round(x*1e6);}
function render(){
 if(active.consent?.status==="granted"&&Date.now()>=active.consent.expiresAt){active.consent=G.revoke(active.consent);active.consent.status="expired";active.preview=null;}
 const who={guest:"未認証", "demo-a":"利用者A・疑似認証","demo-b":"利用者B・疑似認証"}[active.ownerId];
 $("auth-status").textContent=who+" / 本番未認証";$("profile-status").textContent=who+"。本番認証は未実装です。";$("profile-select").value=active.ownerId;
 $("model-select").value=active.modelId;const m=currentModel();$("input-rate").value=m.inputPerMillion??"";$("output-rate").value=m.outputPerMillion??"";["input-rate","output-rate","save-rates"].forEach(id=>$(id).disabled=m.id==="unset");
 const c=active.consent;let consentText="送信同意なし。";if(c?.status==="granted")consentText="表示した内容への試作内同意あり（15分で失効）。";if(c?.status==="refused")consentText="送信を拒否しました。";if(c?.status==="expired")consentText="試作内の同意は期限切れです。";if(c?.status==="revoked")consentText="試作内の同意は撤回・失効しています。";
 $("consent-status").textContent=consentText+" 実AI通信は停止、実送信0件。";$("revoke-consent").disabled=c?.status!=="granted";
 const t=G.totals(active.ledger);$("budget-status").textContent="試算枠：本日（日本時間） "+(t.day/1e6).toFixed(2)+" / "+(active.ledger.limits.day/1e6).toFixed(2)+"円、今月（日本時間） "+(t.month/1e6).toFixed(2)+" / "+(active.ledger.limits.month/1e6).toFixed(2)+"円。実費0円。すべて架空・未確認単価の計算です。";
 $("persist-ledger").checked=active.persist;
 $("ledger-list").innerHTML=active.ledger.entries.length?active.ledger.entries.map((e,i)=>'<div class="ledger-row"><p>試算 '+(i+1)+' / '+esc(active.models.find(m=>m.id===e.modelId)?.label||'過去の試算モデル')+'<br>試算予約 '+(e.reserved/1e6).toFixed(2)+'円 / '+({reserved:"予約中（未送信）",released:"枠を戻した",settled:"未送信・実費0を確定"}[e.status])+'</p>'+(e.status==="reserved"?'<button type="button" data-ledger-action="release" data-ledger-id="'+esc(e.id)+'">未送信として枠を戻す</button> <button type="button" data-ledger-action="settle" data-ledger-id="'+esc(e.id)+'">未送信・実費0を確定</button>':"")+'</div>').join(""):'<p>試算台帳は空です。実料金の請求はありません。</p>';
 $("undo-ledger-reset").disabled=!active.beforeReset;
}
function rebuildPreview(){
 const s=B.current(),m=currentModel(),categories=[["scope-turn","turn-text"],["scope-history","history"],["scope-values","values"],["scope-hypotheses","hypotheses"]].filter(([id])=>$(id).checked).map(([,scope])=>scope);
 active.preview=G.makePreview({ownerId:active.ownerId,revision:active.revision,text:$("prep-current").value,history:s.history,confirmed:s.confirmed,hypotheses:s.hypotheses,categories,modelId:m.id,modelVersion:m.version});
 const p=active.preview,lines=["送信先：未選定","モデル："+m.label,"本番認証：なし / 実通信：停止","", "今回の入力：",p.data.current?.text||"含めない","", "直近会話：",p.data.history.length?p.data.history.map(x=>(x.role==="user"?"本人":"模擬応答")+": "+x.text).join("\n"):"含まれる発言なし","", "本人が確認した情報：",p.data.confirmed.map(x=>x.text).join("\n")||"含まれる情報なし","", "AI仮説（未確認）：",p.data.hypotheses.map(x=>x.description).join("\n")||"含まれる仮説なし","", "BODY/EVOLINK実記録：0件（未連携）"];
 $("consent-payload").textContent=lines.join("\n");$("preview-owner").textContent=active.ownerId==="guest"?"未認証の画面内データを確認中。":"現在の"+(active.ownerId==="demo-a"?"利用者A":"利用者B")+"の試作データだけを確認中。";
 $("consent-dialog-status").textContent="含める範囲を変えると、同意が必要な内容も変わります。";$("grant-consent").disabled=!p.data.current;
}
function openPreview(e,fromChat=false){
 try{opener=e.currentTarget;if(fromChat){const input=B.current().text;if(input.trim()){$("prep-current").value=input;active.draft=input;}}
 active.revision++;active.consent=G.revoke(active.consent);["scope-turn","scope-history","scope-values","scope-hypotheses"].forEach((id,i)=>$(id).checked=i===0);rebuildPreview();$("consent-dialog").showModal();render();
 }catch(err){status(err.message);B.notify(err.message);}
}
$("open-consent").addEventListener("click",e=>openPreview(e));$("open-consent-chat").addEventListener("click",e=>openPreview(e,true));
$("close-consent").addEventListener("click",()=>$("consent-dialog").close());
$("consent-dialog").addEventListener("close",()=>{if(opener&&opener.getBoundingClientRect().width>0)opener.focus();});
["scope-turn","scope-history","scope-values","scope-hypotheses"].forEach(id=>$(id).addEventListener("change",()=>{active.revision++;active.consent=G.revoke(active.consent);try{rebuildPreview();}catch(e){$("consent-dialog-status").textContent=e.message;$("grant-consent").disabled=true;}render();}));
for(const [id,decision] of [["grant-consent","grant"],["refuse-consent","refuse"]])$(id).addEventListener("click",()=>{
 try{if(!active.preview||active.preview.revision!==active.revision)throw Error("入力が変わりました。確認し直してください。");active.consent=G.consent(active.preview,decision);$("consent-dialog").close();render();status(decision==="grant"?"試作内の同意操作を記録しました。実事業者への送信はできません。":"送信を拒否しました。入力は保持し、通信しません。");}catch(e){$("consent-dialog-status").textContent=e.message;}
});
$("revoke-consent").addEventListener("click",()=>{active.consent=G.revoke(active.consent);active.preview=null;render();status("同意を撤回しました。再利用しません。");});
$("prep-current").addEventListener("input",()=>{active.draft=$("prep-current").value;invalidate();});
window.addEventListener("why-data-changed",()=>invalidate("会話や本人情報が変わりました。送信内容を再確認してください。"));
$("profile-select").addEventListener("change",()=>{
 const owner=$("profile-select").value;active.consent=G.revoke(active.consent);active.preview=null;active.draft=$("prep-current").value;cache.set(active.ownerId,active);B.switchOwner(owner);active=cache.get(owner)||initial(owner);active.consent=G.revoke(active.consent);active.preview=null;active.revision++;
 $("prep-current").value=active.draft;$("ledger-export").hidden=true;$("ledger-export").value="";["turn","day","month"].forEach(k=>$("budget-"+k).value=active.ledger.limits[k]/1e6);$("input-tokens").value="5500";$("output-tokens").value="1500";$("cost-estimate").textContent="現在の利用者で試算してください。";status(active.error||"試作領域を切り替えました。前の利用者の同意は使い回しません。");render();
});
$("model-select").addEventListener("change",()=>{active.modelId=$("model-select").value;invalidate();$("cost-estimate").textContent="モデルが変わりました。再試算・再確認してください。";});
$("save-rates").addEventListener("click",()=>{try{const m=G.configureModel(currentModel(),{inputPerMillion:integer("input-rate"),outputPerMillion:integer("output-rate")});active.models=active.models.map(x=>x.id===m.id?m:x);invalidate();status("単価を未確認の仮値として更新しました。実料金とは扱いません。");}catch(e){status(e.message);}});
["input-tokens","output-tokens"].forEach(id=>$(id).addEventListener("input",()=>invalidate()));
$("estimate-cost").addEventListener("click",()=>{try{const q=quote();$("cost-estimate").textContent="仮の上限 "+q.amount.toFixed(2)+"円（入力 "+q.inputTokens+" / 出力 "+q.outputTokens+"トークン）。実料金ではありません。";}catch(e){$("cost-estimate").textContent=e.message;}});
$("update-limits").addEventListener("click",()=>{try{active.ledger=G.setLimits(active.ledger,Object.fromEntries(["turn","day","month"].map(k=>[k,money("budget-"+k)])));persist();render();status("試算上限を更新しました。実通信は停止したままです。");}catch(e){status(e.message);}});
$("reserve-budget").addEventListener("click",()=>{try{
 if(!active.preview||active.preview.revision!==active.revision)throw Error("送信内容を確認し、試作内の同意を選んでください。");
 const q=quote(),r=G.reserve(active.ledger,{id:"reservation-"+active.preview.binding,ownerId:active.ownerId,quote:q,authState:G.auth(active.ownerId),consentRecord:active.consent,preview:active.preview});
 active.ledger=r.ledger;active.beforeReset=null;persist();render();status(r.idempotent?"同じ内容の予約は二重計上しません。":"架空単価の費用枠を予約しました。実送信・実費は0です。");
 }catch(e){status(e.message);}
});
$("stop-communication").addEventListener("click",()=>{const r=G.productionGate();status("通信停止：事業者・モデル未承認、本番認証なし、実単価未確認、本番送信同意なし、通信処理なし。実送信0件。");});
$("ledger-list").addEventListener("click",e=>{const b=e.target.closest("[data-ledger-action]");if(!b)return;try{active.ledger=b.dataset.ledgerAction==="release"?G.release(active.ledger,b.dataset.ledgerId,{neverSent:true}):G.settle(active.ledger,b.dataset.ledgerId,0,{neverSent:true});persist();render();status("未送信の枠を更新しました。実費0です。");}catch(err){status(err.message);}});
$("persist-ledger").addEventListener("change",()=>{if(!$("persist-ledger").checked){try{localStorage.removeItem("sug-why-prep-v08-"+active.ownerId);active.persist=false;}catch(e){status("保存設定を解除できません。台帳は保持しています。");}}else{active.persist=true;persist();}render();});
$("export-ledger").addEventListener("click",()=>{$("ledger-export").value=JSON.stringify(active.ledger,null,2);$("ledger-export").hidden=false;});
$("reset-ledger").addEventListener("click",()=>{active.beforeReset=G.copy(active.ledger);active.ledger=G.newLedger(active.ownerId,active.ledger.limits);persist();render();status("この利用者の試算台帳を初期化しました。直後は取り消せます。");});
$("undo-ledger-reset").addEventListener("click",()=>{if(!active.beforeReset)return;active.ledger=active.beforeReset;active.beforeReset=null;persist();render();status("試算台帳の初期化を取り消しました。");});
function knowledge(){
 const data=K.filter(k=>k.topicId===$("knowledge-topic").value);
 $("knowledge-list").innerHTML=data.map(k=>'<article class="knowledge-item"><h3>'+esc(k.title)+'</h3><p>'+esc(k.claim)+'</p><p>適用条件：'+esc(k.applicability)+'<br>限界・禁止する断定：'+esc(k.limitations)+'</p><p><a target="_blank" rel="noopener noreferrer" href="'+esc(k.source.url)+'">'+esc(k.source.title)+'</a><br>対象：'+esc(k.source.population)+'<br>更新 '+esc(k.updatedAt)+' / '+esc(k.version)+' / 専門家レビュー未実施</p></article>').join("");
}
$("knowledge-topic").addEventListener("change",knowledge);
window.addEventListener("focus",render);setInterval(()=>{if(active.consent?.status==="granted"&&Date.now()>=active.consent.expiresAt)render();},30000);
if(active.error)status(active.error);render();knowledge();
})();

