(()=>{
  'use strict';
  const VERSION='27.74';
  const AREAS={
    legs:{label:'脚ライン',build:['glute_ham_line','inner_thigh_control','calf_balance'],avoid:['quad_dominance','tfl_dominance']},
    hip:{label:'ヒップ',build:['upper_glute','glute_max','glute_medius'],avoid:['lumbar_compensation']},
    decollete:{label:'デコルテ',build:['upper_chest_support','serratus','lower_trap'],avoid:['pec_minor_tension','forward_head']},
    waist:{label:'ウエスト',build:['trunk_control','breathing','pelvic_control'],avoid:['rib_flare','lumbar_extension_bias']},
    arms:{label:'腕',build:['triceps_line','rear_delt','shoulder_control'],avoid:['upper_trap_dominance']},
    back:{label:'背中',build:['lower_trap','mid_back','lat_line'],avoid:['shoulder_elevation_bias']},
    face:{label:'FACE',build:['neck_jaw_control','facial_mobility'],avoid:['masseter_tension','neck_tension']}
  };

  const state={
    version:VERSION,
    health:null,
    goals:{legs:'line',hip:'shape',decollete:'open',waist:'line',arms:'line',back:'line',face:'balance'},
    gait:{},posture:{},face:{},manual:{pain:0,fatigue:0},
    lastResult:null
  };

  const n=v=>Number.isFinite(Number(v))?Number(v):null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const penalty=(v,threshold,weight)=>{const x=n(v);return x==null?0:Math.max(0,x-threshold)*weight};
  const bonus=(v,threshold,weight)=>{const x=n(v);return x==null?0:Math.max(0,x-threshold)*weight};

  function movementQuality(){
    let q=100;
    const g=state.gait,p=state.posture,f=state.face;
    q-=penalty(g.pelvicDrop,1,8);
    q-=penalty(g.kneeValgus,1,9);
    q-=penalty(g.footPronation,1,6);
    q-=penalty(g.hipInternalRotationBias,1,7);
    q-=penalty(g.strideAsymmetryPct,8,1.3);
    q-=penalty(g.pushOffAsymmetryPct,8,1.0);
    q-=penalty(p.forwardHead,1,6);
    q-=penalty(p.ribFlare,1,6);
    q-=penalty(p.scapularAnteriorTilt,1,7);
    q-=penalty(p.thoracicRestriction,1,7);
    q-=penalty(f.jawAsymmetry,1,4);
    q-=penalty(f.neckTension,1,3);
    return Math.round(clamp(q,0,100));
  }

  function recovery(){
    const h=state.health||{};
    const native=n(h.recoveryScore);
    if(native!=null)return clamp(native,0,100);
    let r=70;
    const sleep=n(h.sleepHours??h.sleep); if(sleep!=null){if(sleep<5.5)r-=25;else if(sleep<6.5)r-=12;else if(sleep>=7)r+=7;}
    const stress=n(h.stressScore); if(stress!=null)r-=Math.max(0,stress-50)*0.25;
    r-=Math.max(0,n(state.manual.fatigue)||0)*4;
    return Math.round(clamp(r,0,100));
  }

  function overloadGate(area){
    const q=movementQuality(), rec=recovery(), pain=n(state.manual.pain)||0;
    const buildGoal=['shape','build','round','upper_glute','line_build'].includes(state.goals[area]);
    if(pain>=4)return {allow:false,action:'CARE_FIRST',reason:'痛み優先'};
    if(q<60)return {allow:false,action:'CONTROL_FIRST',reason:'姿勢・歩行パターンを先に修正'};
    if(rec<50)return {allow:false,action:'RECOVERY_FIRST',reason:'全身回復を優先'};
    if(!buildGoal)return {allow:false,action:'SHAPE_CONTROL',reason:'見た目目標を優先し、重量更新を目的化しない'};
    return {allow:true,action:'OVERLOAD_OK',reason:'フォーム・回復条件を満たした範囲で進行'};
  }

  function legAnalysis(){
    const g=state.gait;
    const issues=[];
    if((n(g.kneeValgus)||0)>=2)issues.push('膝内側偏位');
    if((n(g.footPronation)||0)>=2)issues.push('足部回内優位');
    if((n(g.hipInternalRotationBias)||0)>=2)issues.push('股関節内旋優位');
    if((n(g.pelvicDrop)||0)>=2)issues.push('片脚支持時の骨盤安定性');
    if((n(g.hipExtensionRestriction)||0)>=2)issues.push('股関節伸展不足');
    if((n(g.pushOffAsymmetryPct)||0)>10)issues.push('蹴り出し左右差');
    const focus=[];
    if(issues.includes('股関節伸展不足'))focus.push('臀部〜ハム境界を出すため股関節伸展を先に確保');
    if(issues.includes('膝内側偏位')||issues.includes('股関節内旋優位'))focus.push('前もも/TFL優位を避け、臀筋・股関節コントロールを優先');
    if(issues.includes('足部回内優位'))focus.push('足部〜膝のラインを整えてから負荷を上げる');
    if(!focus.length)focus.push('脚ライン維持＋臀部/ハムを狙ってシルエットを作る');
    return {issues,focus,pof:{lengthened:45,mid:35,shortened:20},overload:overloadGate('legs')};
  }

  function decolleteAnalysis(){
    const p=state.posture; const issues=[]; const focus=[];
    if((n(p.forwardHead)||0)>=2)issues.push('頭部前方位');
    if((n(p.scapularAnteriorTilt)||0)>=2)issues.push('肩甲骨前傾');
    if((n(p.thoracicRestriction)||0)>=2)issues.push('胸椎伸展制限');
    if((n(p.ribFlare)||0)>=2)issues.push('肋骨前方突出');
    if(issues.length)focus.push('胸椎・肋骨・肩甲骨を整えて鎖骨〜肩のラインを出す');
    else focus.push('前鋸筋・下部僧帽筋＋必要最小限の上部胸筋でデコルテを作る');
    return {issues,focus,pof:{lengthened:30,mid:45,shortened:25},overload:overloadGate('decollete')};
  }

  function faceAnalysis(){
    const f=state.face; const issues=[]; const focus=[];
    if((n(f.masseterTension)||0)>=2)issues.push('咬筋緊張');
    if((n(f.neckTension)||0)>=2)issues.push('首前面/側面の緊張');
    if((n(f.jawAsymmetry)||0)>=2)issues.push('開閉左右差');
    if((n(f.mouthCornerAsymmetry)||0)>=2)issues.push('口角左右差');
    if((n(f.swelling)||0)>=2)issues.push('むくみ感');
    if(issues.length)focus.push('マッサージ・ストレッチ・可動ケア→再撮影で前後比較');
    else focus.push('表情筋と頸部の可動性を維持');
    return {issues,focus,overload:{allow:false,action:'CARE_RESPONSE',reason:'FACEは負荷更新ではなく可動・緊張・左右差の反応で評価'}};
  }

  function genericArea(area){
    const gate=overloadGate(area);
    const map={
      hip:'臀部の上部・丸み・臀部〜ハム境界を目標別に配分',
      waist:'呼吸・肋骨・骨盤コントロールを優先し、ウエストラインを作る',
      arms:'肩甲帯を整え、三頭・リアデルタ中心に腕のラインを作る',
      back:'肩をすくめず、背中の縦ラインと肩甲骨コントロールを作る'
    };
    return {issues:[],focus:[map[area]],pof:{lengthened:40,mid:40,shortened:20},overload:gate};
  }

  function analyze(){
    const q=movementQuality(),rec=recovery();
    const areas={
      legs:legAnalysis(),hip:genericArea('hip'),decollete:decolleteAnalysis(),waist:genericArea('waist'),arms:genericArea('arms'),back:genericArea('back'),face:faceAnalysis()
    };
    const priorities=Object.entries(areas).map(([key,v])=>({key,label:AREAS[key].label,score:(v.issues?.length||0)*20+(v.overload?.action==='CARE_FIRST'?50:v.overload?.action==='CONTROL_FIRST'?30:0)})).sort((a,b)=>b.score-a.score).slice(0,3);
    const result={version:VERSION,movementQuality:q,recovery:rec,areas,priorities,dataQuality:{gait:Object.keys(state.gait).length,posture:Object.keys(state.posture).length,face:Object.keys(state.face).length},generatedAt:new Date().toISOString()};
    state.lastResult=result;
    try{localStorage.setItem('sug_beauty_body_v1',JSON.stringify({state,result}));}catch(_){ }
    window.dispatchEvent(new CustomEvent('sug:beauty-analysis',{detail:result}));
    return result;
  }

  function setGoal(area,goal){if(AREAS[area])state.goals[area]=goal;return analyze();}
  function setGait(data){state.gait={...state.gait,...(data||{})};return analyze();}
  function setPosture(data){state.posture={...state.posture,...(data||{})};return analyze();}
  function setFace(data){state.face={...state.face,...(data||{})};return analyze();}
  function setManual(data){state.manual={...state.manual,...(data||{})};return analyze();}
  function receiveHealth(p){state.health=p||null;return analyze();}
  function getState(){return JSON.parse(JSON.stringify(state));}

  window.SuGBeautyBody={VERSION,AREAS,setGoal,setGait,setPosture,setFace,setManual,receiveHealth,analyze,getState,overloadGate};
  window.addEventListener('sug:native-health',e=>receiveHealth(e.detail));
  if(window.__SUG_NATIVE_HEALTH__)receiveHealth(window.__SUG_NATIVE_HEALTH__);else analyze();
})();
