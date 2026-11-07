(function(root){'use strict';
const number=v=>v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v));
const daysBetween=(a,b)=>(Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000;
function readiness(data,date){
 const d=data.days?.[date]||{},p=data.profile||{},reasons=[],missing=[];
 const result={mode:'normal',reasons,missing,weight:number(p.weight)?Number(p.weight):null,goal:p.goal||'',stepsAverage:null};
 if(d.pain==='あり'){result.mode='care';reasons.push('今日の痛みが「あり」のため、重量候補を止めて身体ケアへ。');return result}
 if(d.activityChoice==='今日は休む'||d.activityChoice==='回復を優先する'||d.fatigue==='強い'||d.stress==='強い'){result.mode='recovery';reasons.push('本人の休養選択、または強い疲れ・ストレスを優先します。');return result}
 for(const k of ['sleep','fatigue','stress','pain'])if(d[k]===undefined||d[k]===''||d[k]===null)missing.push(k);
 if(!p.goal||!number(p.weight))missing.push('基本情報');
 if(missing.length){result.mode='input';reasons.push('未入力を回復良好と扱わず、基本情報・今日の回復を先に保存します。');return result}
 reasons.push('目標：'+p.goal+'。体重 '+p.weight+'kg'+(number(p.target)?'／目標 '+p.target+'kg':'')+'。体重比だけで挙上重量は算出しません。');
 if(Number(d.sleep)<6){result.mode='light';reasons.push('睡眠が6時間未満のため、今回は増量せずセット数を抑える候補です。6時間は本アプリの暫定運用値で、医学的な可否判定ではありません。')}
 const prior=Object.entries(data.days||{}).filter(([k,v])=>daysBetween(date,k)>0&&daysBetween(date,k)<=7&&number(v.steps));
 if(prior.length>=3){const avg=prior.reduce((n,[,v])=>n+Number(v.steps),0)/prior.length;result.stepsAverage=Math.round(avg);if(number(d.steps)&&avg>0&&Number(d.steps)>avg*1.5){result.mode='light';reasons.push('今日の歩数が過去7日内の記録平均（'+Math.round(avg)+'歩、'+prior.length+'日）を50%以上上回るため、追加負荷を控える候補です。これも暫定運用値です。')}}
 if(!number(d.steps))reasons.push('今日の歩数は未記録。活動量が少ないとは判断せず、増量候補は保留します。');
 result.allowIncrease=result.mode==='normal'&&number(d.steps);
 return result;
}
function exercise(data,date,entry,state,increment){
 const rows=(data.workouts||[]).filter(r=>r.name===entry.name&&r.day<date).sort((a,b)=>b.day.localeCompare(a.day)||b.at.localeCompare(a.at));
 const last=rows[0],out={name:entry.name,condition:last?.condition||'',status:'初回確認',reason:'同じ種目の実績がありません。器具条件と無理なく動かせる重量を確認してください。',sets:Array.from({length:state.mode==='light'?1:entry.sets},()=>({kg:null,reps:entry.reps})),sourceIds:[]};
 if(!last)return out;
 out.sourceIds=[last.id];out.sets=last.sets.slice(0,entry.sets).map(s=>({...s}));out.status='維持';out.reason='前回 '+last.day+' の同じ器具・条件を基準にします。';
 if(last.pain&&last.pain!=='なし'){const review=root.BodyRecheck?.current(data,last,date);if(review?.result==='痛みなし・動作を確認'){out.status='再確認後・重量は手動';out.sets=[{kg:null,reps:entry.reps}];out.sourceIds.push(review.id);out.reason='今日のケアと動作の再確認を保存済み。元の重量は自動で戻さず、重量を本人確認する1セットの入力候補です。痛みが戻れば中止し相談してください。再開の安全を保証する判定ではありません。';return out}out.status='ケア確認';out.sets=[];out.reason='直近のこの種目に痛みの記録があります。改善を確認するまで自動の重量候補を止めます。';return out}
 if(last.planId){out.status='計画を確認';out.sets=[];out.reason='直近は5/3/1の実績です。計画モードで週を選び、通常の増量ルールとの重複を防ぎます。';return out}
 if(state.mode==='light'||last.movement==='途中で崩れた'||last.effort==='前回よりきつい'){
 out.status='軽減';out.sets=out.sets.slice(0,Math.max(1,out.sets.length-1));out.reason+=' 回復状態または前回のフォーム・きつさから、増量せずセット数を1つ減らす候補（最低1セット）です。重量も動作を見て調整してください。';return out}
 const prior=rows.find(r=>r.day<last.day&&r.condition===last.condition);
 const good=r=>r&&!r.planId&&r.pain==='なし'&&r.movement==='同じ条件で保てた'&&r.effort==='前回より余裕あり'&&r.sets.every(s=>s.kg>0&&s.reps>=entry.reps+2);
 const same=prior&&prior.sets.length===last.sets.length&&last.sets.every((s,i)=>s.kg===prior.sets[i].kg);
 if(state.allowIncrease&&daysBetween(date,last.day)<=14&&prior&&daysBetween(last.day,prior.day)<=14&&same&&good(last)&&good(prior)&&number(increment)&&Number(increment)>0&&last.sets.every(s=>Number(increment)/s.kg<=.1)){
 out.status='増量候補';out.sourceIds.push(prior.id);out.sets=out.sets.map(s=>({kg:Math.round((s.kg+Number(increment))*100)/100,reps:entry.reps}));out.reason='異なる2日・同じ器具条件とセット数・重量で、候補回数より2回以上多く実施。両日とも余裕あり／フォーム維持／痛みなしのため、指定した刻み '+increment+'kg を試す候補です。確定や実績保存はしません。';
 }else out.reason+=' 2日分の余裕・フォーム・痛み・回数条件、今日の活動記録、または増量幅の条件が揃わないため、自動で増量しません。';
 return out;
}
function build(data,date,entries,increment){const state=readiness(data,date);return {...state,entries:['normal','light'].includes(state.mode)?entries.map(e=>exercise(data,date,e,state,increment)):[]}}
root.BodyPrescription={readiness,exercise,build};if(typeof module!=='undefined')module.exports=root.BodyPrescription;
})(typeof globalThis!=='undefined'?globalThis:this);
