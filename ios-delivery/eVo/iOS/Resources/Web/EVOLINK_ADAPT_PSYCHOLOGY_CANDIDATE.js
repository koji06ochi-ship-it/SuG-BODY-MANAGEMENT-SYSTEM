/* S.u.G EVOLINK psychology-aware ADAPT companion. No generative AI, diagnosis, network, or storage. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./EVOLINK_ADAPT_ENGINE_CANDIDATE.js'):root.EVOLINK_ADAPT);if(typeof module==='object'&&module.exports)module.exports=api;else root.EVOLINK_ADAPT_PSYCHOLOGY=api;})(typeof globalThis!=='undefined'?globalThis:this,function(engine){
'use strict';
const goals=['continue','adjust','rest','unsure'];
const emotions=['frustrated','anxious','confident','neutral','unsure'];
function plan(input={}){
 const physical=engine.decide(input);
 const feeling=emotions.includes(input.feeling)?input.feeling:'unsure';
 const goal=goals.includes(input.choice)?input.choice:null;
 const phrase=typeof input.words==='string'?input.words.trim().slice(0,300):'';
 const opening=feeling==='frustrated'?'思うようにいかなかったんやな。':feeling==='anxious'?'不安もあるんやな。':feeling==='confident'?'手応えがあったんやな。':'今日はどんな感覚やった？';
 const caution=physical.status==='caution';
 const question=caution?'今の状態で無理なく選べそうなのは、休むこと？それとも状態を確認すること？':feeling==='frustrated'?'重量以外で、前回と違ったことはあった？':'今日の経験から、次に試してみたいことはある？';
 const options=caution?['休息する','状態を確認する','専門家に相談する']:['今の方法を続ける','負荷や方法を調整する','休息を選ぶ','まだ決めずに振り返る'];
 return {physical,dialogue:{opening,question,options,mode:'rule_based',generativeAIConnected:false},reflection:{userWords:phrase,feeling,choice:goal,question:'選んだあと、実際どう感じた？'},principle:'BE CONFIDENT. NEVER OVERCONFIDENT.',automaticallyApplied:false};
}
return Object.freeze({plan});
});
