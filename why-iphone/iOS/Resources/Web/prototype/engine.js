(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory(require("./store.js"));else root.WHYEngine=factory(root.WHYStore);})(typeof globalThis!=="undefined"?globalThis:this,function(S){
"use strict";
function norm(s){return s.normalize("NFKC").replace(/[\s。！？!?、・]/g,"").toLowerCase();}
function newSession(s){const se={id:S.id(),createdAt:S.now(),status:"active",topicId:null,branchId:null,step:0,adviceAllowed:true,rejectedTopics:[]};s.sessions.push(se);return se;}
function message(s,se,role,text){const m={id:S.id(),createdAt:S.now(),sessionId:se.id,role,text,status:"current",source:role==="user"?"user-input":"mock-template",replacesId:null};s.messages.push(m);if(role==="user")s.statements.push({id:S.id(),createdAt:S.now(),messageId:m.id,type:"unclassified",text,confirmed:false,status:"current"});return m;}
function withdraw(s,se){s.hypotheses.filter(h=>h.sessionId===se.id&&h.status==="tentative").forEach(h=>h.status="withdrawn");if(se.topicId)se.rejectedTopics.push(se.topicId);se.topicId=null;se.branchId=null;se.step=0;}
function topicFor(text,cases,rejected=[]){const n=norm(text);let found=cases.find(c=>norm(c.opening)===n&&!rejected.includes(c.id));if(found)return found;const rules=[
["30",/ありたい姿.*分から|何を目指|目標.*分から/],["28",/限界.*意味|限界まで.*必要/],["29",/糖質.*悪|糖質.*言われ/],["07",/スクワット.*太|脚.*太く/],["08",/糖質.*太|糖質.*増/],["09",/休.*全部.*無駄/],["13",/30分.*10分|10分しか/],["10",/週3回.*でき/],["11",/食事.*全部.*決め/],["12",/寝方.*変|睡眠計画.*変/],["14",/一日.*食事.*準備/],["15",/早く寝られた/],["16",/変わら.*やめ|トレーニング.*やめ/],["17",/食事制限.*嫌|制限.*苦/],["18",/休みたい.*遅/],["19",/食事管理.*続/],["20",/ジム.*行けな/],["21",/早く寝られない/],["22",/歩.*忘/],["23",/食事記録.*忘/],["24",/就寝準備.*しな/],["25",/短い運動.*よ/],["26",/昼食.*空腹/],["27",/早く寝た.*疲/],["04",/初心者.*嫌|ジム.*人.*目/],["05",/家族.*食事.*変/],["06",/休憩.*評価/],["03",/休む.*苦手/],["02",/筋肉.*つけたい/],["01",/痩せたい|やせたい/]
];const match=rules.find(([id,re])=>re.test(text)&&!rejected.includes(id));return match?cases.find(c=>c.id===match[0]):null;}
function reply(original,text,cases,topicOverride=null){
if(typeof text!=="string"||!text.trim()||text.length>2000)throw new Error("1〜2000文字で入力してください");
const s=S.clone(original);let se=s.sessions[s.sessions.length-1];if(!se||se.status==="ended")se=newSession(s);
const user=message(s,se,"user",text.trim());let answer="",suggestion=null,route="fallback";
const n=norm(text);
if(/今日は終わり|今日は終了|ここで終わ|終了します|^終了$|^終わり$/.test(text)){se.status="ended";answer="ここで終わりにします。行動や目標を決めなくても大丈夫。記録は残し、新しく話したいときに再開できます。";route="end";}
else if(/今は保留|^保留$/.test(text)){withdraw(s,se);answer="今は保留にします。行動は採用せず、これまでの記録と計画は残します。";route="hold";}
else if(/胸.*痛|失神|息が.*苦|呼吸.*苦|自分を傷つけ|死にたい/.test(text)){withdraw(s,se);answer="通常の実践提案を止めます。この模擬対話では状態を判断できません。今すぐの危険や強い症状がある場合は、地域の緊急窓口や医療機関に連絡してください。";route="safety";}
else if(/それは違う|決めつけない|そうじゃない/.test(text)){withdraw(s,se);answer="その解釈は取り下げます。AIの仮説をあなたの事実として扱いません。訂正したい言葉があれば、記憶とデータからも直せます。";route="reject";}
else if(/答えたくない|聞かないで|話したくない/.test(text)){withdraw(s,se);answer="答えなくて大丈夫。この話の深掘りは止めます。別の疑問に移る、説明だけ聞く、ここで終えることもできます。";route="refuse";}
else if(/助言.*いらない|提案.*しないで|聞いてほしいだけ/.test(text)){se.adviceAllowed=false;answer="助言や行動提案は止めます。今話してくれた範囲を受け取り、結論を急ぎません。";route="listen";}
else if(/目的.*変わ|目標.*変わ/.test(text)){withdraw(s,se);s.plans.filter(p=>!p.deleted).forEach(p=>p.needsReview=true);answer="前の目的や計画は消さず、見直しが必要と表示します。今は何を大切にしたいですか？";route="purpose-change";}
else if(/^(RIR|rir).*(とは|って何|意味)|RIRとは|rirとは/.test(text)){answer="RIRは、同じ動作であと何回できそうかという残り回数の推定です。例えば、あと2回できそうならRIR約2。痛みや動作の崩れとは区別し、不明なら不明で記録できます。この説明だけで終了しても大丈夫です。";route="knowledge";}
else if(/PFC.*(とは|って何|意味)/i.test(text)){answer="PFCは、たんぱく質（P）、脂質（F）、炭水化物（C）の区分です。食事の役割を整理する道具ですが、それだけで食事全体の良し悪しや個人の適量は決まりません。数値目標の設定は必須ではありません。";route="knowledge";}
else if(["分からない","わからない","分かりません"].includes(n)&&!topicOverride&&!topicFor(text,cases,se.rejectedTopics)&&!(se.topicId&&se.step===2)){answer="分からないままで大丈夫。今は答えや目標を作らず、説明だけにする、保留する、終えることもできます。";route="unknown";}
else if(!se.adviceAllowed){answer="今話してくれた内容を受け取りました。助言や行動提案をしないという希望を保ちます。この試作には自由文を深く理解するAIは接続されていません。";route="listen";}
else {
let c=se.topicId?cases.find(c=>c.id===se.topicId):null;
const explicit=topicOverride?cases.find(c=>c.id===topicOverride):null;
const incoming=topicFor(text,cases,se.rejectedTopics);
if(explicit||(!c&&incoming)||(c&&incoming&&incoming.id!==c.id)){
 if(c)withdraw(s,se);c=explicit||incoming;se.topicId=c.id;se.branchId=null;se.step=1;answer=c.first;route="topic:"+c.id;
}else if(c&&se.step===1){
 const matches=c.branches.filter(b=>b.keywords.some(k=>text.includes(k)));
 if(matches.length===1){const b=matches[0];se.branchId=b.id;se.step=2;answer=b.dialogue[3].text;route="branch:"+c.id+b.id;s.hypotheses.push({id:S.id(),createdAt:S.now(),sessionId:se.id,topicId:c.id,branchId:b.id,label:b.assessment,status:"tentative",evidenceMessageIds:[user.id],basis:"keyword-match-prototype"});}
 else{answer="入力を受け取りました。この模擬対話では、今の文に合う分岐を一つに決められません。推測を事実にせず保留します。別の疑問に移ったり、保留・終了したりできます。";route="unmatched";}
}else if(c&&se.step===2){
 const b=c.branches.find(b=>b.id===se.branchId);
 if(b&&(norm(text)===norm(b.dialogue[4].text)||norm(text).includes(norm(b.dialogue[4].text)))){answer=b.dialogue[5].text;se.step=3;route="choice:"+c.id+b.id;suggestion={title:b.options[0],reason:"本人が比較・検討するための模擬候補。採用は未確認。",prediction:"",observe:b.reflection,topicId:c.id,branchId:b.id};}
 else{answer="その回答を、用意した台本の続きに当てはめません。この試作では未定義の分岐として保留します。記憶とデータで訂正したり、別の疑問から始めたりできます。";route="unmatched";}
}else{answer="自由入力を受け取りました。この試作はキーワードと用意した経路による模擬対話です。今の内容を理解したとは扱わず、未分類のまま残します。話題を変える、保留する、終了することができます。";route="fallback";}
}
message(s,se,"assistant",answer);S.log(s,se.id,"模擬応答:"+route,"conversation");
return {state:s,answer,route,suggestion};
}
return {norm,newSession,topicFor,reply};
});

