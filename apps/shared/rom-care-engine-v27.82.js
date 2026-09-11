'use strict';

const dateISO = date => {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};
const today = () => dateISO(new Date());
const shiftDate = days => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return dateISO(value);
};
function m() { return window.SuGRomCareData?.member?.() || null; }
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function n(id) { return Number(document.getElementById(id)?.value || 0); }
function avg(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
function safeFilePart(value) { return String(value || 'member').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60); }
function persist() { window.SuGRomCareData?.persist?.(); }
function remove(collection, index) {
  if (window.SuGRomCareData?.remove?.(collection, Number(index))) renderRomCareAll();
}
function dateAgeDays(dateStr) {
  if (!dateStr) return 9999;
  const value = new Date(`${dateStr}T12:00:00`);
  return Math.max(0, Math.floor((Date.now() - value.getTime()) / 86400000));
}
function latestRecovery() {
  return (m()?.recovery || []).slice().sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))).at(-1) || null;
}
function recScore(row) {
  if (!row) return null;
  let score = 100;
  if (Number(row.sleep || 0) < 7) score -= Math.min(25, (7 - Number(row.sleep || 0)) * 8);
  score -= Math.max(0, Number(row.fatigue || 0) - 3) * 5;
  score -= Math.max(0, Number(row.stress || 0) - 3) * 4;
  score -= Number(row.pain || 0) * 5;
  return Math.max(0, Math.round(score));
}
function smartRecoveryState() {
  const row = latestRecovery();
  if (!row) return { label: 'DATA LOW', volume: 80, rir: 'RIR 3以上', stepTarget: 0, stepReason: '回復データ未入力' };
  const score = recScore(row);
  if (Number(row.pain || 0) >= 6 || score < 35) return { label: 'STOP', volume: 0, rir: '高負荷中止', stepTarget: 0, stepReason: '回復優先' };
  if (score < 55) return { label: 'REDUCE', volume: 60, rir: 'RIR 4以上', stepTarget: 0, stepReason: '負荷縮小' };
  if (score < 75) return { label: 'CAUTION', volume: 80, rir: 'RIR 3以上', stepTarget: 0, stepReason: '軽度調整' };
  return { label: 'READY', volume: 100, rir: 'RIR 2〜3', stepTarget: 0, stepReason: '通常運用候補' };
}
function nextOverload(exercise) {
  const rows = (m()?.training || []).filter(row => row.exercise === exercise);
  const latest = rows.at(-1);
  return { txt: latest ? `前回 ${latest.weight || '--'}kg × ${latest.reps || '--'}回` : '比較データなし' };
}
function renderNextLoadPanel() {}
const CARE_SMART_RULES = {
  lowback: { conflicts: ['腰・骨盤', 'ヒンジ', 'スクワット'] },
  neck: { conflicts: ['頸部', '頭上動作'] },
  shoulder: { conflicts: ['肩', '胸', '背中', '腕'] },
  knee: { conflicts: ['膝', 'スクワット', 'ランジ'] },
  ankle: { conflicts: ['足首', '歩行', '下半身'] },
  wrist: { conflicts: ['手首', '押す・引く動作'] },
  elbow: { conflicts: ['肘', '腕', '押す・引く動作'] }
};
let sugMapLocation = null;
function updateMapLocationLabels() {
  const element = document.getElementById('medicalMapLocation');
  if (!element) return;
  element.innerHTML = sugMapLocation
    ? `<strong>現在地取得済み</strong>｜精度 約${Math.round(sugMapLocation.accuracy || 0)}m｜保存しません。`
    : 'Google Maps側の現在地を使って検索できます。';
}
function getMapCurrentLocation() {
  if (!navigator.geolocation) return alert('この端末では現在地取得に対応していません');
  navigator.geolocation.getCurrentPosition(position => {
    sugMapLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      at: Date.now()
    };
    updateMapLocationLabels();
  }, error => {
    console.warn(error);
    alert('現在地を取得できませんでした。位置情報許可を確認してください。');
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
}
function googleMapsOpen(url) {
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) location.href = url;
}
function openMedicalMap(kind = 'orthopedic') {
  const gate = (() => { try { return careReferralGate(); } catch { return null; } })();
  let query = kind === 'emergency' ? '救急外来' : '整形外科';
  if (kind === 'orthopedic' && gate?.area) query += ` ${CARE_AREA_LABELS[gate.area] || ''}`;
  if (sugMapLocation) query += ` near ${sugMapLocation.lat},${sugMapLocation.lng}`;
  googleMapsOpen(`https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query })}`);
}

const CARE_AREA_LABELS={
  lowback:"腰", neck:"首", shoulder:"肩", knee:"膝", ankle:"足首", wrist:"手首", elbow:"肘"
};
const CARE_LOCATIONS={
  lowback:["中央","右側","左側","仙骨・骨盤の後ろ側","臀部寄り","脚へ響く / 放散する"],
  neck:["中央・後ろ","右側","左側","後頭部の付け根","肩・僧帽筋寄り","腕・手へ響く / 放散する"],
  shoulder:["前側","横側","後ろ側","肩の上側・鎖骨寄り","肩甲骨周辺","上腕寄り"],
  knee:["前側","内側","外側","後ろ側","膝蓋骨まわり","すね上部・膝下"],
  ankle:["前側","内側","外側","後ろ側・アキレス腱周辺","かかと寄り","足の甲・足部寄り"],
  wrist:["手のひら側","手の甲側","親指側","小指側","中央","手・指へ響く"],
  elbow:["外側","内側","前側","後ろ側","前腕寄り","上腕寄り"]
};
const CARE_MOVEMENTS={
  lowback:["前に曲げる","後ろに反る","ひねる","立ち上がる / 座る","立つ / 歩く","長く座る"],
  neck:["前に倒す","後ろに反らす","右を向く","左を向く","横に倒す","デスク・スマホ姿勢"],
  shoulder:["前から上げる","横から上げる","背中に手を回す / 内旋","外旋","押す動作","引く動作"],
  knee:["しゃがむ","階段","曲げる","伸ばす","片脚で支える","歩く / 走る"],
  ankle:["つま先を上げる / 背屈","つま先を下げる / 底屈","内側へ動かす","外側へ動かす","歩く / 体重をかける","ジャンプ / 着地"],
  wrist:["手首を曲げる","手首を反らす","親指側へ倒す","小指側へ倒す","握る / 持つ","押す / 引く"],
  elbow:["曲げる","伸ばす","手のひらを下へ回す","手のひらを上へ回す","握る","押す / 引く"]
};
const CARE_FLAGS={
  lowback:[
    "排尿・排便のコントロールや感覚に新しい変化がある",
    "股・内もも・肛門周囲に新しいしびれ / 感覚低下がある",
    "脚に強い、または進行する脱力・感覚低下がある",
    "大きな転倒・事故などの外傷後に始まった",
    "発熱・強い体調不良を伴う"
  ],
  neck:[
    "転倒・事故・強い衝撃の後から強い首痛がある",
    "腕や脚に新しい / 悪化するしびれ・脱力がある、手先が急に不器用になった",
    "歩行・バランスが急に悪くなった",
    "発熱・強い体調不良・強い頭痛や首の強いこわばりを伴う",
    "胸痛・息苦しさ・冷汗などを伴う"
  ],
  shoulder:[
    "転倒・衝突などの外傷後で、腕が動かせない / 明らかな変形・強い腫れがある",
    "急に腕を上げられなくなった、または明らかな力の入りにくさがある",
    "しびれ・感覚低下が続く、腕が異常に冷たい / 熱い",
    "肩が赤く熱を持ち、発熱・強い体調不良を伴う",
    "胸痛や息苦しさを伴う"
  ],
  knee:[
    "膝が非常に痛く、動かせない / 体重をかけられない",
    "強く腫れた、または形が変わっている",
    "膝がロックして伸びない、または崩れて転びそうになる",
    "外傷後に急激な大きい腫れが出た",
    "膝が赤く熱を持ち、発熱・強い体調不良を伴う"
  ],
  ankle:[
    "足首・足の形が変わった / 不自然な角度になっている",
    "外傷時に強いスナップ音・破裂音・ゴリッとした音があり、その後歩けない",
    "体重をかけて歩けない",
    "強い腫れ・痛みがあり悪化している",
    "足のしびれ・感覚低下、異常な冷たさ / 色の変化がある"
  ],
  wrist:[
    "手首・手の形や色が明らかに変わった",
    "外傷時にスナップ音・破裂音・ゴリッとした音があった",
    "手首を動かせない / 物を持てない",
    "手や指の感覚が低下・消失している",
    "強い腫れ・赤み・熱感や発熱・強い体調不良を伴う"
  ],
  elbow:[
    "外傷後に強い痛みがあり、肘をほとんど動かせない",
    "外傷時にスナップ音がした、または形が変わっている",
    "腕・手にしびれ / 感覚低下がある",
    "明らかな筋力低下や手指の動かしにくさがある",
    "強い腫れ・赤み・熱感や発熱・強い体調不良を伴う"
  ]
};
const CARE_ROUTINE={
  lowback:[
    "5〜10分の軽い歩行。痛みを増やさない範囲で、同じ姿勢を続けすぎない。",
    "仰向けで骨盤をゆっくり前後に動かす。8〜10回。",
    "片膝を胸の方向へ軽く近づける。左右5回ずつ。強く引き込まない。",
    "四つ這いで背中をゆっくり丸める / 戻す。6〜8回。",
    "実施中または実施後に痛み・しびれが増える場合は中止し、状態を再確認する。"
  ],
  neck:[
    "肩の力を抜き、呼吸を止めずに楽な姿勢を作る。30〜60秒。",
    "あごを軽く引く / 戻すを小さく行う。5〜8回。強く押し込まない。",
    "痛みの少ない範囲で首を左右へゆっくり向ける。各5回。",
    "肩をすくめず、肩甲骨を軽く後ろ下へ整える。5秒×6〜8回。",
    "腕へのしびれ・脱力、めまい、強い頭痛などが出る場合は中止する。"
  ],
  shoulder:[
    "ペンデュラム：体を支え、腕を脱力して小さく揺らす。30〜60秒×2。",
    "反対の手で補助しながら、痛みの少ない範囲で腕を前に上げる。8〜10回。",
    "肩をすくめず、肩甲骨を軽く後ろ下へ整える。5秒×8回。",
    "肘を体側につけたまま、痛みの少ない範囲で軽い外旋。8〜10回。",
    "痛みが強くなる角度・負荷は避け、実施後にBEFORE / AFTERを比較する。"
  ],
  knee:[
    "痛みを増やさない範囲で短い歩行または安静姿勢からの軽い動作確認を行う。",
    "仰向けまたは座位で、かかとを滑らせて膝をゆっくり曲げ伸ばし。6〜10回。",
    "膝を伸ばした状態で太もも前面に軽く力を入れる。5秒×8回。",
    "座位で痛みの少ない範囲まで膝をゆっくり伸ばす / 戻す。6〜10回。",
    "ロック・崩れ・急な腫れ・荷重困難が出る場合は中止して医療評価を優先する。"
  ],
  ankle:[
    "座位または仰向けで足首をゆっくり上下に動かす。10〜15回。",
    "痛みの少ない範囲で足首を小さく円を描く。左右各5回。",
    "足裏を床につけ、痛みが少なければ軽い左右への荷重移動。5〜8回。",
    "歩行できる場合のみ、短い距離で歩行を確認。痛みが増えるなら中止。",
    "強い腫れ・変形・荷重不能・しびれがある場合はセルフケアを続けない。"
  ],
  wrist:[
    "手指をゆっくり開く / 握る。8〜10回。強く握り込まない。",
    "肘を支え、手首を痛みの少ない範囲で曲げる / 反らす。各6〜8回。",
    "前腕を支え、手のひらを上 / 下へゆっくり回す。各6〜8回。",
    "痛みが少なければ柔らかい物を軽く握り、2〜3秒×5回。",
    "しびれ・感覚低下、変形、物を保持できない場合は中止して医療評価を優先する。"
  ],
  elbow:[
    "腕を支え、肘を痛みの少ない範囲でゆっくり曲げ伸ばし。8〜10回。",
    "肘を体側につけ、手のひらを上 / 下へゆっくり回す。各6〜8回。",
    "痛みが少なければ手を軽く握り、2〜3秒×5回。強く握らない。",
    "肩をすくめず、前腕と肘を楽な位置に戻して30〜60秒休む。",
    "しびれ・筋力低下、強い腫れ、変形、外傷後の強い痛みがある場合は中止する。"
  ]
};
const CARE_IMAGES={
  lowback:"./care-lowback-hyottoko.png?v=26-4-2-walk-route",
  neck:"./care-neck-hyottoko.png?v=26-4-2-walk-route",
  shoulder:"./care-shoulder-hyottoko.png?v=26-4-2-walk-route",
  knee:"./care-knee-hyottoko.png?v=26-4-2-walk-route",
  ankle:"./care-ankle-hyottoko.png?v=26-4-2-walk-route",
  wrist:"./care-wrist-hyottoko.png?v=26-4-2-walk-route",
  elbow:"./care-elbow-hyottoko.png?v=26-4-2-walk-route"
};
function carePosterHTML(area){
  const label=CARE_AREA_LABELS[area]||'セルフケア';
  const src=CARE_IMAGES[area];
  if(!src)return '';
  return `<div class="carePosterBox"><div class="carePosterTitle">${esc(label)}セルフケア画像</div><img src="${src}" alt="${esc(label)}セルフケア画像"><div class="carePosterCap">痛みを増やさない範囲で実施。違和感が強い場合や危険サインがある場合は医療評価を優先。</div></div>`;
}

const CARE_BRANCHES={
  shoulder:{
    defaultFocus:"肩の負担を増やさず、軽い可動から確認",
    byLocation:{
      "前側":{focus:"前側の負担を増やさず、肩甲骨と軽い挙上から確認",routine:[
        "ペンデュラム：体を支え、腕を脱力して小さく揺らす。30〜60秒×2。",
        "反対の手で補助しながら、痛みの少ない範囲で腕を前に上げる。8〜10回。",
        "肩をすくめず、肩甲骨を軽く後ろ下へ整える。5秒×8回。",
        "強い伸張感が出る角度や、痛みが増える挙上は避ける。"
      ]},
      "横側":{focus:"横から上げる負担を抑え、肩甲骨の動きと軽い外旋を優先",routine:[
        "ペンデュラム：腕を脱力して小さく揺らす。30〜60秒×2。",
        "肩をすくめず、肩甲骨を軽く後ろ下へ整える。5秒×8回。",
        "肘を体側につけたまま、痛みの少ない範囲で軽い外旋。8〜10回。",
        "横から腕を上げる動作は、痛みが増えない高さまでにする。"
      ]},
      "後ろ側":{focus:"後方を刺激しすぎず、肩甲骨セットと軽い外旋を優先",routine:[
        "ペンデュラム：腕を脱力して小さく揺らす。30〜60秒×2。",
        "肩をすくめず、肩甲骨を軽く後ろ下へ整える。5秒×8回。",
        "肘を体側につけたまま、痛みの少ない範囲で軽い外旋。8〜10回。",
        "腕を強く後ろへ引く・強く伸ばす動作は避ける。"
      ]},
      "肩の上側・鎖骨寄り":{focus:"肩をすくめる負担を減らし、脱力と小さい可動から確認",routine:[
        "ペンデュラム：腕を脱力して小さく揺らす。30〜60秒×2。",
        "肩をすくめず、楽な位置で肩甲骨を軽く整える。5秒×6〜8回。",
        "反対の手で補助しながら、痛みの少ない範囲で腕を前に上げる。6〜8回。",
        "荷物を肩にかける、強くすくめる動作は一旦避ける。"
      ]},
      "肩甲骨周辺":{focus:"肩甲骨の位置と胸郭まわりの軽い動きを優先",routine:[
        "肩をすくめず、肩甲骨を軽く後ろ下へ整える。5秒×8回。",
        "呼吸を止めず、胸を軽く開く。5呼吸×2。",
        "痛みの少ない範囲で腕を前に上げる。6〜8回。",
        "ペンデュラム：腕を脱力して小さく揺らす。30秒×2。"
      ]},
      "上腕寄り":{focus:"上腕への負担を減らし、肩の軽い可動だけ確認",routine:[
        "ペンデュラム：腕を脱力して小さく揺らす。30〜60秒×2。",
        "反対の手で補助しながら、痛みの少ない範囲で腕を前に上げる。6〜8回。",
        "肘を体側につけたまま、痛みの少ない範囲で軽い外旋。6〜8回。",
        "押す・引く・持ち上げる動作で痛みが増える場合は負荷を避ける。"
      ]}
    },
    byMovement:{
      "前から上げる":"前方挙上は痛みの少ない範囲。反対の手の補助を使い、無理に終末域まで上げない。",
      "横から上げる":"横から上げる動作は痛みの少ない高さまで。肩をすくめて代償しない。",
      "背中に手を回す / 内旋":"背中へ強く回すストレッチは避け、痛みが出ない範囲だけ確認する。",
      "外旋":"外旋は無負荷〜ごく軽い負荷で、肘を体側につけて小さく確認する。",
      "押す動作":"高負荷のプレス系はいったん避け、痛みがない軽い可動から確認する。",
      "引く動作":"強く引き切る動作は避け、肩甲骨を軽く整える程度から確認する。"
    }
  },

  lowback:{
    defaultFocus:"同じ姿勢を続けず、痛みを増やさない軽い動きから確認",
    byLocation:{
      "中央":{focus:"腰中央を固めすぎず、骨盤の小さい動きと短い歩行を優先",routine:[
        "3〜5分の軽い歩行。痛みを増やさない速度で行う。",
        "仰向けで骨盤を小さく前後に動かす。8〜10回。",
        "四つ這いで背中をゆっくり丸める / 戻す。6〜8回。",
        "同じ姿勢を長時間続けず、こまめに姿勢を変える。"
      ]},
      "右側":{focus:"右側を強く伸ばさず、左右差を確認しながら軽く動く",routine:[
        "3〜5分の軽い歩行。左右どちらかにかばい過ぎない。",
        "仰向けで骨盤を小さく前後に動かす。8〜10回。",
        "四つ這いで背中を小さく丸める / 戻す。6〜8回。",
        "右側に鋭い痛みが増えるひねり・深い前後屈は避ける。"
      ]},
      "左側":{focus:"左側を強く伸ばさず、左右差を確認しながら軽く動く",routine:[
        "3〜5分の軽い歩行。左右どちらかにかばい過ぎない。",
        "仰向けで骨盤を小さく前後に動かす。8〜10回。",
        "四つ這いで背中を小さく丸める / 戻す。6〜8回。",
        "左側に鋭い痛みが増えるひねり・深い前後屈は避ける。"
      ]},
      "仙骨・骨盤の後ろ側":{focus:"骨盤まわりを固めず、荷重を小さく変えながら確認",routine:[
        "立位または座位で左右へ小さく荷重移動。左右5〜8回。",
        "仰向けで骨盤を小さく前後に動かす。8〜10回。",
        "痛みが少なければ短い歩行を3〜5分。",
        "片脚に強く体重を乗せ続ける姿勢は避ける。"
      ]},
      "臀部寄り":{focus:"臀部まで含めて軽い荷重と歩行を優先し、強いストレッチは避ける",routine:[
        "3〜5分の軽い歩行。",
        "仰向けで骨盤を小さく前後に動かす。8〜10回。",
        "座位からゆっくり立つ / 座るを5回。痛みが増えない範囲。",
        "臀部を強く伸ばして症状が増える場合はストレッチを中止する。"
      ]},
      "脚へ響く / 放散する":{focus:"脚へ広がる症状を増やさないことを最優先に、軽い活動だけ確認",routine:[
        "症状が脚へ強く広がらない範囲で短い歩行または姿勢変更を行う。",
        "同じ姿勢を続けず、楽な姿勢へこまめに変える。",
        "脚のしびれ・脱力が増える動作や強いストレッチは行わない。",
        "症状が広がる、強くなる、筋力低下が出る場合はセルフケアを中止する。"
      ]}
    },
    byMovement:{
      "前に曲げる":"深く前屈せず、痛みが増える手前まで。反動を使わない。",
      "後ろに反る":"強く反らさず、小さい範囲で確認する。",
      "ひねる":"痛み側へ強くひねらず、可動は小さくする。",
      "立ち上がる / 座る":"反動を使わず、必要なら手で支えてゆっくり行う。",
      "立つ / 歩く":"歩幅を小さくして短時間から。症状が増えれば中止する。",
      "長く座る":"長時間固定せず、こまめに立つ・姿勢を変える。"
    }
  },

  neck:{
    defaultFocus:"首を固定しすぎず、痛みの少ない範囲で小さく動かす",
    byLocation:{
      "中央・後ろ":{focus:"首の中央を強く反らさず、軽い回旋と姿勢リセットを優先",routine:[
        "肩の力を抜き、楽な姿勢で5呼吸。",
        "あごを軽く引く / 戻す。5〜8回。",
        "痛みの少ない範囲で左右へゆっくり向く。各5回。",
        "肩甲骨を軽く後ろ下へ整える。5秒×6回。"
      ]},
      "右側":{focus:"右側を強く伸ばさず、左右の小さい回旋から確認",routine:[
        "肩の力を抜いて5呼吸。",
        "痛みの少ない範囲で左右へ小さく向く。各5回。",
        "あごを軽く引く / 戻す。5〜8回。",
        "右側へ痛みが増える側屈・強いストレッチは避ける。"
      ]},
      "左側":{focus:"左側を強く伸ばさず、左右の小さい回旋から確認",routine:[
        "肩の力を抜いて5呼吸。",
        "痛みの少ない範囲で左右へ小さく向く。各5回。",
        "あごを軽く引く / 戻す。5〜8回。",
        "左側へ痛みが増える側屈・強いストレッチは避ける。"
      ]},
      "後頭部の付け根":{focus:"後頭部を反らしすぎず、あご引きと呼吸を優先",routine:[
        "楽な姿勢で5呼吸。肩とあごの力を抜く。",
        "あごを軽く引く / 戻す。5〜8回。",
        "首を反らさず、左右へ小さく向く。各4〜5回。",
        "頭痛・めまい・吐き気などが増える場合は中止する。"
      ]},
      "肩・僧帽筋寄り":{focus:"肩をすくめる緊張を減らし、肩甲骨と首を軽く動かす",routine:[
        "肩をすくめて脱力する。5回。",
        "肩甲骨を軽く後ろ下へ整える。5秒×6〜8回。",
        "首を左右へ小さく向く。各5回。",
        "肩を下へ強く押し込むストレッチは避ける。"
      ]},
      "腕・手へ響く / 放散する":{focus:"腕や手への症状を増やさないことを最優先に、首は小さく動かす",routine:[
        "症状が腕や手へ強く広がらない楽な姿勢で5呼吸。",
        "首を痛みの少ない範囲でごく小さく左右へ向く。各3〜5回。",
        "肩をすくめず、肩甲骨を軽く整える。5秒×5回。",
        "しびれ・脱力が増える場合は中止して状態を再確認する。"
      ]}
    },
    byMovement:{
      "前に倒す":"深くうつむかず、小さい範囲で確認する。",
      "後ろに反らす":"強く反らさず、痛み・めまいが出ない範囲にする。",
      "右を向く":"右回旋で痛みが増える手前まで。反動を使わない。",
      "左を向く":"左回旋で痛みが増える手前まで。反動を使わない。",
      "横に倒す":"耳を肩へ近づけすぎず、小さい範囲で確認する。",
      "デスク・スマホ姿勢":"同じ姿勢を続けず、画面位置を変えてこまめに姿勢をリセットする。"
    }
  },

  knee:{
    defaultFocus:"荷重を急に増やさず、曲げ伸ばしと太ももの軽い収縮から確認",
    byLocation:{
      "前側":{focus:"膝前面の負担を抑え、浅い曲げ伸ばしを優先",routine:[
        "座位または仰向けで、かかとを滑らせて膝をゆっくり曲げ伸ばし。6〜10回。",
        "膝を伸ばした状態で太もも前面に軽く力を入れる。5秒×8回。",
        "痛みが少なければ短い歩行を2〜5分。",
        "深いしゃがみ込みは避ける。"
      ]},
      "内側":{focus:"内側へ体重を崩さず、膝と足先を揃えた軽い荷重を確認",routine:[
        "座位で膝をゆっくり曲げ伸ばし。6〜10回。",
        "立位で両脚へ均等に体重を乗せる。5呼吸。",
        "太もも前面に軽く力を入れる。5秒×8回。",
        "膝が内側へ入る動きや深い片脚動作は避ける。"
      ]},
      "外側":{focus:"外側へ偏った荷重を減らし、真っすぐな曲げ伸ばしを優先",routine:[
        "座位で膝をゆっくり曲げ伸ばし。6〜10回。",
        "立位で両脚へ均等に体重を乗せる。5呼吸。",
        "痛みが少なければ短い歩行を2〜5分。",
        "痛み側へ強くひねる・片脚で踏ん張る動作は避ける。"
      ]},
      "後ろ側":{focus:"膝裏を強く伸ばさず、小さい曲げ伸ばしから確認",routine:[
        "座位で膝をゆっくり曲げ伸ばし。6〜8回。",
        "膝を伸ばした状態で太もも前面に軽く力を入れる。5秒×6回。",
        "痛みが少なければ短い歩行を2〜3分。",
        "膝裏を強く伸ばすストレッチや反動は避ける。"
      ]},
      "膝蓋骨まわり":{focus:"膝蓋骨周囲への圧を増やしすぎず、浅い可動を優先",routine:[
        "かかとを滑らせて膝をゆっくり曲げ伸ばし。6〜10回。",
        "太もも前面に軽く力を入れる。5秒×8回。",
        "浅い範囲で立ち座りを3〜5回。痛みが増えない場合のみ。",
        "深いスクワット・長い階段は一旦減らす。"
      ]},
      "すね上部・膝下":{focus:"膝下への負担を抑え、荷重と曲げ伸ばしを小さく確認",routine:[
        "座位で膝をゆっくり曲げ伸ばし。6〜8回。",
        "両脚で立ち、痛みが少なければ小さく左右荷重移動。各5回。",
        "短い歩行を2〜3分。",
        "ジャンプや強い踏み込みは避ける。"
      ]}
    },
    byMovement:{
      "しゃがむ":"深くしゃがまず、痛みの少ない浅い範囲にする。",
      "階段":"一段ずつゆっくり。痛みが強ければ手すりを使い回数を減らす。",
      "曲げる":"痛みが増える角度の手前まで。反動を使わない。",
      "伸ばす":"勢いよく伸ばし切らず、ゆっくり行う。",
      "片脚で支える":"片脚荷重は短時間から。膝が内外へ崩れない範囲で行う。",
      "歩く / 走る":"まず歩行で確認し、痛みが残る間は走行やジャンプを避ける。"
    }
  },

  ankle:{
    defaultFocus:"荷重を急に増やさず、足首の小さい可動から確認",
    byLocation:{
      "前側":{focus:"足首前面を詰め込まず、上下運動と軽い荷重から確認",routine:[
        "座位で足首をゆっくり上下に動かす。10〜15回。",
        "痛みの少ない範囲で小さく足首を回す。各5回。",
        "両脚で立ち、軽い左右荷重移動。左右5回。",
        "深く膝を前へ出す動きで痛みが増える場合は避ける。"
      ]},
      "内側":{focus:"内側へ崩れる荷重を抑え、真っすぐな荷重を優先",routine:[
        "座位で足首をゆっくり上下に動かす。10回。",
        "足裏全体を床につけ、両脚で均等に立つ。5呼吸。",
        "痛みが少なければ左右へ小さく荷重移動。各5回。",
        "内側へ強く倒す動作は避ける。"
      ]},
      "外側":{focus:"外側へひねる負担を抑え、上下運動と軽い荷重を優先",routine:[
        "座位で足首をゆっくり上下に動かす。10回。",
        "足首を小さく回す。左右各5回。",
        "両脚で均等に立ち、短い歩行を確認する。",
        "外側へ強くひねる・急な方向転換は避ける。"
      ]},
      "後ろ側・アキレス腱周辺":{focus:"後方を強く伸ばさず、足首ポンプと軽い荷重から確認",routine:[
        "座位で足首をゆっくり上下に動かす。10〜15回。",
        "両脚で立ち、痛みが少なければ小さくかかとを浮かせる。5回。",
        "短い歩行を2〜3分。",
        "強いふくらはぎストレッチや反動は避ける。"
      ]},
      "かかと寄り":{focus:"かかとへの衝撃を減らし、足首の可動を保つ",routine:[
        "座位で足首をゆっくり上下に動かす。10〜15回。",
        "足首を小さく回す。各5回。",
        "痛みが少なければ短い歩行を確認する。",
        "ジャンプ・強い着地・長時間の歩行は一旦減らす。"
      ]},
      "足の甲・足部寄り":{focus:"足部をねじらず、足首の軽い可動と荷重を確認",routine:[
        "座位で足首をゆっくり上下に動かす。10回。",
        "足指を軽く開く / 戻す。8回。",
        "痛みが少なければ両脚で均等に立つ。",
        "強い踏み返しやつま先立ちで痛む場合は避ける。"
      ]}
    },
    byMovement:{
      "つま先を上げる / 背屈":"詰まりや痛みが出る手前まで。勢いをつけない。",
      "つま先を下げる / 底屈":"つま先を強く伸ばし切らず、小さい範囲で確認する。",
      "内側へ動かす":"内側へ倒し切らず、痛みの少ない範囲にする。",
      "外側へ動かす":"外側へ倒し切らず、痛みの少ない範囲にする。",
      "歩く / 体重をかける":"短時間・短い歩幅から。荷重で痛みが増えるなら中止する。",
      "ジャンプ / 着地":"ジャンプ・着地はセルフケア段階では避け、歩行で問題ないことを先に確認する。"
    }
  },

  wrist:{
    defaultFocus:"手首を強く反らさず、手指と前腕の軽い動きから確認",
    byLocation:{
      "手のひら側":{focus:"掌側を強く伸ばさず、曲げ伸ばしを小さく確認",routine:[
        "手指をゆっくり開く / 握る。8〜10回。",
        "肘を支え、手首を小さく曲げる / 反らす。各6回。",
        "前腕を支え、手のひらを上 / 下へゆっくり回す。各6回。",
        "手のひら側を強く伸ばすストレッチは避ける。"
      ]},
      "手の甲側":{focus:"手の甲側へ強く反らさず、軽い可動を優先",routine:[
        "手指をゆっくり開く / 握る。8〜10回。",
        "手首を痛みの少ない範囲で曲げる / 反らす。各6回。",
        "前腕の回内・回外を各6回。",
        "手を床につく・強く反らす動作で痛む場合は避ける。"
      ]},
      "親指側":{focus:"親指側への偏った負担を減らし、握力を使いすぎない",routine:[
        "手指を軽く開く / 握る。8回。",
        "手首を真っすぐに保ち、曲げ伸ばしを各5〜6回。",
        "前腕をゆっくり回す。各6回。",
        "強いピンチ動作・長時間のスマホ保持は一旦減らす。"
      ]},
      "小指側":{focus:"小指側へ手首を倒し切らず、前腕の軽い動きを優先",routine:[
        "手指を軽く開く / 握る。8回。",
        "手首を真っすぐに保ち、曲げ伸ばしを各5〜6回。",
        "前腕をゆっくり回す。各6回。",
        "小指側へ強く倒す・強くひねる動作は避ける。"
      ]},
      "中央":{focus:"手首中央への負荷を減らし、可動を小さく保つ",routine:[
        "手指をゆっくり開く / 握る。8〜10回。",
        "手首を小さく曲げる / 反らす。各6回。",
        "前腕をゆっくり回す。各6回。",
        "痛みが少なければ柔らかい物を軽く握る。2秒×5回。"
      ]},
      "手・指へ響く":{focus:"手や指への症状を増やさないことを優先し、負荷をかけない",routine:[
        "手指を軽く開く / 閉じる。5〜8回。",
        "手首は中間位に近い楽な位置で休ませる。",
        "痛み・しびれが増えない範囲で前腕を小さく回す。各4〜5回。",
        "感覚低下や握力低下が増える場合は中止して状態を再確認する。"
      ]}
    },
    byMovement:{
      "手首を曲げる":"深く曲げず、痛みの少ない範囲でゆっくり。",
      "手首を反らす":"手を反らし切らず、痛みの少ない範囲で確認する。",
      "親指側へ倒す":"親指側へ強く倒し切らない。",
      "小指側へ倒す":"小指側へ強く倒し切らない。",
      "握る / 持つ":"強く握り込まず、軽い物から確認する。",
      "押す / 引く":"手首を反らせたまま体重をかける・強く引く動作は一旦減らす。"
    }
  },

  elbow:{
    defaultFocus:"肘を強く伸ばし切らず、曲げ伸ばしと前腕回旋を軽く確認",
    byLocation:{
      "外側":{focus:"外側への握り・引く負担を減らし、前腕を軽く動かす",routine:[
        "腕を支え、肘をゆっくり曲げ伸ばし。8〜10回。",
        "肘を体側につけ、手のひらを上 / 下へゆっくり回す。各6回。",
        "手を軽く開く / 握る。8回。",
        "強い握り込み・手首を反らしたまま持つ動作は避ける。"
      ]},
      "内側":{focus:"内側への握り・手首屈曲の負担を減らし、軽い可動を優先",routine:[
        "腕を支え、肘をゆっくり曲げ伸ばし。8〜10回。",
        "手のひらを上 / 下へゆっくり回す。各6回。",
        "手指を軽く開く / 握る。8回。",
        "強い握り込みや手首を曲げたまま引く動作は避ける。"
      ]},
      "前側":{focus:"肘前面を強く縮め込まず、軽い曲げ伸ばしから確認",routine:[
        "腕を支え、肘を痛みの少ない範囲で曲げ伸ばし。6〜8回。",
        "前腕をゆっくり回す。各5〜6回。",
        "肩をすくめず腕を楽な位置で30秒休める。",
        "重い物を持った肘曲げは一旦避ける。"
      ]},
      "後ろ側":{focus:"肘後方への圧と強い伸展を減らし、軽い可動を優先",routine:[
        "肘を痛みの少ない範囲でゆっくり曲げ伸ばし。6〜8回。",
        "前腕をゆっくり回す。各5〜6回。",
        "肘を机や床へ強く押しつけない。",
        "押す動作で痛む場合は負荷を下げる。"
      ]},
      "前腕寄り":{focus:"前腕の使い過ぎを抑え、肘と手首を軽く動かす",routine:[
        "肘をゆっくり曲げ伸ばし。8回。",
        "前腕を上 / 下へゆっくり回す。各6回。",
        "手首を小さく曲げる / 反らす。各5回。",
        "強い握り込みや長時間の反復作業を一旦減らす。"
      ]},
      "上腕寄り":{focus:"上腕へ負荷を集中させず、肘の軽い可動から確認",routine:[
        "肘を痛みの少ない範囲でゆっくり曲げ伸ばし。8回。",
        "前腕を上 / 下へゆっくり回す。各6回。",
        "肩をすくめず腕を楽な位置に戻して30秒休む。",
        "重い押す・引く動作は一旦避ける。"
      ]}
    },
    byMovement:{
      "曲げる":"深く曲げ込まず、痛みが増える手前まで。",
      "伸ばす":"勢いよく伸ばし切らず、ゆっくり確認する。",
      "手のひらを下へ回す":"回内は痛みの少ない範囲で小さく行う。",
      "手のひらを上へ回す":"回外は痛みの少ない範囲で小さく行う。",
      "握る":"強く握り込まず、軽い把持から確認する。",
      "押す / 引く":"高負荷のプレス・ロー系はいったん避け、軽負荷で痛みがないか確認する。"
    }
  }
};

function carePlan(area, location, movement){
  const branch=CARE_BRANCHES[area]||null;
  if(!branch){
    return {
      title:`${CARE_AREA_LABELS[area]||"部位"}の軽いセルフケア`,
      movementNote:"痛みを増やさない範囲で実施する。",
      routine:CARE_ROUTINE[area]||[]
    };
  }
  const b=branch.byLocation?.[location]||null;
  return {
    title:b?.focus||branch.defaultFocus||`${CARE_AREA_LABELS[area]||"部位"}の軽いセルフケア`,
    movementNote:branch.byMovement?.[movement]||"痛みを増やさない範囲で動作を確認する。",
    routine:b?.routine||CARE_ROUTINE[area]||[]
  };
}

// V26.5.27 READINESS SIGNAL + DAILY RHYTHM + CAFFEINE + MEAL TIMING + HYDRATION + CARE + TRAINING METHODS
const CARE_AROM_KEYS={
  shoulder:["shoulder_flex","shoulder_abd","shoulder_er","shoulder_ir","shoulder_ext","shoulder_hflex","shoulder_hext","thoracic_ext","thoracic_rot"],
  neck:["cervical_flex","cervical_ext","cervical_rot","cervical_lat","thoracic_ext","thoracic_rot"],
  lowback:["hip_flex","hip_ext","hip_er","hip_ir","thoracic_flex","thoracic_ext","thoracic_rot","thoracic_lat"],
  knee:["knee_flex","knee_ext","ankle_df","hip_flex"],
  ankle:["ankle_df","ankle_pf","foot_inv","foot_ev"],
  wrist:["wrist_flex","wrist_ext","wrist_radial","wrist_ulnar","forearm_pron","forearm_sup"],
  elbow:["elbow_flex","elbow_ext","forearm_pron","forearm_sup"]
};
function carePreferredAromKey(area,movement=""){
  const t=String(movement||"");
  const rules={
    shoulder:[[/前から|挙上/,"shoulder_flex"],[/横から/,"shoulder_abd"],[/外旋/,"shoulder_er"],[/内旋|背中に手/,"shoulder_ir"]],
    neck:[[/前に倒/,"cervical_flex"],[/後ろに反/,"cervical_ext"],[/右を向|左を向/,"cervical_rot"],[/横に倒/,"cervical_lat"]],
    knee:[[/曲げ|しゃが/,"knee_flex"],[/伸ば/,"knee_ext"]],
    ankle:[[/背屈|つま先を上/,"ankle_df"],[/底屈|つま先を下/,"ankle_pf"],[/内側/,"foot_inv"],[/外側/,"foot_ev"]],
    wrist:[[/手首を曲げ/,"wrist_flex"],[/反ら/,"wrist_ext"],[/親指側/,"wrist_radial"],[/小指側/,"wrist_ulnar"]],
    elbow:[[/曲げ/,"elbow_flex"],[/伸ば/,"elbow_ext"],[/下へ回/,"forearm_pron"],[/上へ回/,"forearm_sup"]]
  };
  for(const [re,key] of (rules[area]||[]))if(re.test(t))return key;
  return null;
}
function careLatestArom(area,movement=""){
  const rows=(m()?.aromAssessments||[]),keys=CARE_AROM_KEYS[area]||[];if(!rows.length||!keys.length)return null;
  const preferred=carePreferredAromKey(area,movement);
  const pool=rows.filter(x=>keys.includes(x.key));if(!pool.length)return null;
  const sorted=pool.slice().sort((a,b)=>String(a.savedAt||a.date||"").localeCompare(String(b.savedAt||b.date||"")));
  if(preferred){const exact=sorted.filter(x=>x.key===preferred);if(exact.length)return exact.at(-1)}
  return sorted.at(-1)||null;
}
function careAromDecision(area,movement,pain=0){
  const x=careLatestArom(area,movement);
  if(pain>=7)return {code:"PAIN_STOP",title:"痛み優先",summary:"強い痛みのためCARE TOOL選択より負荷中止・状態確認を優先。",categories:["BREATH_RELAX"],arom:x};
  if(pain>=4)return {code:"PAIN_GUARD",title:"PAIN GUARD",summary:"痛みが可動を抑えている可能性。強いストレッチや強圧より、痛みを増やさないAROM・軽い等尺性・負荷調整を優先。",categories:["AROM","ISOMETRIC","MOTOR_CONTROL"],arom:x};
  if(!x)return {code:"NO_ROM",title:"ROM DATAなし",summary:"同部位の保存済みAROM/PROMなし。軽いAROMで反応を確認し、必要ならROMタブでAROM/PROMを測定。",categories:["AROM","MOTOR_CONTROL"],arom:null};
  const ref=AROM_REFERENCE[x.key],active=Number(x.active),passive=x.passive==null?null:Number(x.passive),gap=passive==null?null:passive-active,gapTh=aromGapThreshold(x.key),normed=ref?.hasNorm!==false;
  const activeLow=normed&&Number.isFinite(active)&&active<Number(ref?.ideal?.[0]??-Infinity),passiveLow=normed&&Number.isFinite(passive)&&passive<Number(ref?.ideal?.[0]??-Infinity);
  if(passive==null){
    return {code:activeLow?"AROM_LOW_PROM_UNKNOWN":"AROM_OK_PROM_UNKNOWN",title:activeLow?"AROM低下 / PROM未測定":"AROM確保 / PROM未測定",summary:activeLow?"AROMが低いがPROM未測定。ストレッチ不足と決めつけず、PROMで可動性制限か使い切り不足かを切り分ける。":"AROMは大きく崩れていない。症状と動作を優先し、必要時のみPROMを追加。",categories:activeLow?["AROM","MOTOR_CONTROL","ISOMETRIC"]:["AROM","ACTIVATION"],arom:x,gap:null};
  }
  if(activeLow&&passiveLow)return {code:"PASSIVE_LIMIT",title:"PROM + AROM 制限",summary:"PROMもAROMも低い。可動性側の制約候補として、MOBILITY / RELEASE / 適切なSTRETCHを試し、直後AROMまで再評価。",categories:["MOBILITY","RELEASE","STRETCH","AROM"],arom:x,gap};
  if((activeLow&&!passiveLow&&gap>=gapTh)||(!activeLow&&gap>=gapTh))return {code:"ACTIVE_PASSIVE_GAP",title:"ACTIVE-PASSIVE GAP",summary:`PROMは確保されているがAROMとの差が${gap.toFixed(0)}°。さらに伸ばすより、AROM / チューブACTIVATION / MOTOR CONTROL / ISOMETRICを優先。`,categories:["AROM","ACTIVATION","MOTOR_CONTROL","ISOMETRIC"],arom:x,gap};
  return {code:"ROM_OK",title:"ROM大きな乖離なし",summary:"AROM/PROM差は大きくない。症状・動作・負荷条件を中心に、軽いAROM/ACTIVATIONで再現性を確認。",categories:["AROM","ACTIVATION","MOTOR_CONTROL"],arom:x,gap};
}

const CARE_ACUTE_PROTOCOLS={
  RICE:{label:"RICE",note:"旧来の症状管理フレーム。長い完全休養を自動推奨せず、必要な要素だけ記録する。",actions:[
    {category:"LOAD_MANAGEMENT",tool:"REST_MODIFICATION",label:"RICE｜REST MODIFICATION｜痛みを増やす動作・負荷を一時調整。完全休養を長引かせない。"},
    {category:"COLD_SYMPTOM",tool:"COLD_PACK",label:"RICE｜ICE｜必要なら短時間の冷却を痛みの緩和目的で使用。皮膚障害・感覚低下に注意。"},
    {category:"COMPRESSION",tool:"ELASTIC_COMPRESSION",label:"RICE｜COMPRESSION｜循環・感覚を妨げない軽い圧迫。しびれ・変色・冷感が出たら外す。"},
    {category:"ELEVATION",tool:"POSITIONING",label:"RICE｜ELEVATION｜腫れがある場合、可能なら患部を楽な範囲で挙上。"}
  ]},
  PRICE:{label:"PRICE",note:"Protectionを加えた急性期フレーム。保護は必要最小限にし、危険サインがあれば医療評価を優先。",actions:[
    {category:"PROTECTION",tool:"PROTECTION",label:"PRICE｜PROTECTION｜再受傷しやすい動作・高負荷を一時回避し、必要最小限の保護。"},
    {category:"LOAD_MANAGEMENT",tool:"REST_MODIFICATION",label:"PRICE｜RELATIVE REST｜痛みを増やす負荷だけ調整。"},
    {category:"COLD_SYMPTOM",tool:"COLD_PACK",label:"PRICE｜ICE｜必要時のみ短時間の症状緩和として使用。"},
    {category:"COMPRESSION",tool:"ELASTIC_COMPRESSION",label:"PRICE｜COMPRESSION｜循環を妨げない軽い圧迫。"},
    {category:"ELEVATION",tool:"POSITIONING",label:"PRICE｜ELEVATION｜腫れがある場合の挙上。"}
  ]},
  POLICE:{label:"POLICE",note:"Protection＋Optimal Loadingを重視。痛みを増やさない範囲で早期から段階的に動かす。",actions:[
    {category:"PROTECTION",tool:"PROTECTION",label:"POLICE｜PROTECTION｜再受傷リスクの高い動作を一時制限。"},
    {category:"LOAD_MANAGEMENT",tool:"OPTIMAL_LOADING",label:"POLICE｜OPTIMAL LOADING｜痛み・腫れを悪化させない範囲で軽い荷重/AROMから段階的に戻す。"},
    {category:"COLD_SYMPTOM",tool:"COLD_PACK",label:"POLICE｜ICE｜必要時のみ短時間の症状緩和。必須とは扱わない。"},
    {category:"COMPRESSION",tool:"ELASTIC_COMPRESSION",label:"POLICE｜COMPRESSION｜軽い圧迫。循環・感覚を確認。"},
    {category:"ELEVATION",tool:"POSITIONING",label:"POLICE｜ELEVATION｜腫れがある場合の挙上。"}
  ]},
  PEACE:{label:"PEACE",note:"急性期の保護・教育・圧迫・挙上を中心に整理。抗炎症介入を自動で必須化しない。",actions:[
    {category:"PROTECTION",tool:"PROTECTION",label:"PEACE｜PROTECT｜症状を増やす動作を短期間調整し、過度な固定を避ける。"},
    {category:"ELEVATION",tool:"POSITIONING",label:"PEACE｜ELEVATE｜腫れがある場合、可能なら挙上。"},
    {category:"EDUCATION",tool:"EDUCATION",label:"PEACE｜EDUCATE｜回復見込み・負荷調整・再評価条件を共有し、受け身の処置だけに依存しない。"},
    {category:"COMPRESSION",tool:"ELASTIC_COMPRESSION",label:"PEACE｜COMPRESS｜必要なら軽い圧迫。しびれ・変色・冷感が出たら中止。"}
  ]},
  LOVE:{label:"LOVE",note:"急性期を越えた回復フェーズ。段階的負荷・循環を促す活動・運動再獲得を優先。",actions:[
    {category:"LOAD_MANAGEMENT",tool:"PROGRESSIVE_LOAD",label:"LOVE｜LOAD｜痛みと24H反応を見ながら、許容できる荷重を段階的に増やす。"},
    {category:"EDUCATION",tool:"SELF_EFFICACY",label:"LOVE｜OPTIMISM / EDUCATION｜回復可能性を共有し、過度な恐怖回避を避ける。"},
    {category:"VASCULARISATION",tool:"LIGHT_CARDIO",label:"LOVE｜VASCULARISATION｜症状を増やさない軽い歩行・自転車等から再開。"},
    {category:"EXERCISE",tool:"AROM_CONTROL",label:"LOVE｜EXERCISE｜AROM・筋力・固有感覚・動作を段階的に再獲得。"}
  ]}
};
function careDaysSinceOnset(onset){
  if(!onset)return null;const d=new Date(onset+"T00:00:00"),t=new Date(today()+"T00:00:00");if(!Number.isFinite(d.getTime()))return null;return Math.max(0,Math.round((t-d)/86400000));
}
function careAcuteDecision(area,trigger,onsetDate,acuteState,pain=0){
  const days=careDaysSinceOnset(onsetDate),state=String(acuteState||"none"),trauma=trigger==="trauma";
  if(pain>=7)return {code:"ACUTE_STOP",protocol:null,title:"強い症状を優先",summary:"急性期プロトコルを自己判断で追加せず、負荷中止・危険サイン確認・必要時の医療評価を優先。",days,state,actions:[]};
  const acute=trauma||["swelling","bruise","early"].includes(state)||(days!=null&&days<=3);
  const recovering=state==="recovery"||(days!=null&&days>=4&&days<=21);
  if(acute){
    const key=(state==="bruise"||state==="swelling"||trauma)?"PEACE":"POLICE",p=CARE_ACUTE_PROTOCOLS[key];
    return {code:`ACUTE_${key}`,protocol:key,title:`${p.label}｜急性期候補`,summary:`${p.note} RICE / PRICE / POLICEも参照可能だが、長い完全休養を固定ルールにはしない。`,days,state,actions:p.actions};
  }
  if(recovering){const p=CARE_ACUTE_PROTOCOLS.LOVE;return {code:"RECOVERY_LOVE",protocol:"LOVE",title:"LOVE｜回復期候補",summary:p.note,days,state,actions:p.actions};}
  return {code:"NO_ACUTE_PROTOCOL",protocol:null,title:"急性期プロトコル優先度は低い",summary:"現入力ではRICE / PRICE / POLICE / PEACEを主軸にせず、AROM/PROM・痛む動作・CARE RESPONSEから通常CAREを選ぶ。",days,state,actions:[]};
}
function careAcuteDecisionHTML(d){
  if(!d)return "";const age=d.days==null?"発症日未入力":`発症から約${d.days}日`;
  return `<div class="careToolGroup"><div class="careToolGroupTitle"><span>${esc(d.title)}</span><span class="careToolTag">${esc(d.code)}</span></div><div class="careToolWhy">${esc(d.summary)}</div><div class="careAromLink">${esc(age)}｜急性反応 ${esc(d.state||"none")}${d.protocol?`｜優先フレーム ${esc(d.protocol)}`:""}</div></div>`;
}
function renderCareAcuteLink(){
  const box=document.getElementById("careAcuteLink");if(!box)return;
  const d=careAcuteDecision(document.getElementById("careArea")?.value||"lowback",document.getElementById("careTrigger")?.value||"unknown",document.getElementById("careOnsetDate")?.value||"",document.getElementById("careAcuteState")?.value||"none",Math.max(0,Math.min(10,Number(document.getElementById("carePainBefore")?.value||0))));
  box.innerHTML=`<strong>${esc(d.title)}</strong><br>${esc(d.summary)}`;
}
function careThermalDecision(area,trigger,onsetDate,acuteState,thermalState="auto",pain=0,symptomNote="",goal="symptom"){
  const days=careDaysSinceOnset(onsetDate),state=String(acuteState||"none"),thermal=String(thermalState||"auto"),note=String(symptomNote||"");
  const heatWords=/熱感|熱い|ほてり|腫れ|腫脹|ズキズキ|赤み|発赤/i.test(note);
  const stiffWords=/冷え|冷たい|こわば|硬い|動き出し|動きにく|張り/i.test(note);
  if(pain>=7)return {mode:"NONE",code:"THERMAL_HOLD",title:"温冷より状態確認を優先",summary:"痛みが強いため、冷却・温熱を追加して動かすより負荷中止と危険サイン確認を優先。",duration:"--",goal,actions:[]};
  if(thermal==="sensation_issue")return {mode:"NONE",code:"THERMAL_SENSORY_GUARD",title:"COLD / HEATとも保留",summary:"感覚低下や循環不安がある場合は温度刺激による皮膚障害を察知しにくいため、自己判断で冷却・温熱を行わず状態確認を優先。",duration:"--",goal,actions:[]};
  const coldExplicit=thermal==="hot_swollen",heatExplicit=thermal==="cold_stiff"||thermal==="pre_move_stiff";
  const acuteHot=state==="swelling"||state==="bruise"||coldExplicit||heatWords;
  const veryEarly=(days!=null&&days<=3)||(trigger==="trauma"&&state==="early");
  if(acuteHot || (veryEarly&&pain>=4))return {mode:"COLD",code:"COOL_SYMPTOM",title:"COOL / COLD候補",summary:"熱感・腫れ・急性痛が目立つ条件。目的は主に一時的な鎮痛・症状コントロール。氷を皮膚へ直接当てず、タオル越しで皮膚状態を確認する。",duration:"10〜15分を目安に短時間",goal,actions:[{category:"COLD_SYMPTOM",tool:"COLD_PACK",label:"COLD / COOLING｜タオル越しで10〜15分を目安に短時間。皮膚の強い白色化・痛み・しびれ・感覚低下が出たら中止。目的は症状緩和で、治癒促進を断定しない。",recommended:true,reason:"THERMAL DECISION",protocol:"THERMAL"}]};
  const noActiveHeat=!acuteHot&&state!=="swelling"&&state!=="bruise",recoveryOrChronic=state==="recovery"||state==="none"||(days!=null&&days>=4);
  if(noActiveHeat && (heatExplicit || (recoveryOrChronic&&stiffWords)))return {mode:"HEAT",code:"WARMING_MOBILITY",title:"HEAT / WARMING候補",summary:"急な腫れ・熱感が目立たず、冷え・こわばり・動き出しの硬さが中心。目的は温感と動きやすさの補助。熱すぎる温度は避け、温めた後に同じROM/動作を再評価する。",duration:"10〜20分を目安に軽く",goal,actions:[{category:"HEAT_SYMPTOM",tool:"WARM_PACK",label:"HEAT / WARMING｜心地よい温度で10〜20分を目安に軽く温める。熱感・腫れが増える、皮膚が強く赤くなる、痛みが増える場合は中止。",recommended:true,reason:"THERMAL DECISION",protocol:"THERMAL"}]};
  return {mode:"NONE",code:"THERMAL_NONE",title:"COLD / HEATどちらも必須ではない",summary:"現入力では温冷を優先する根拠が弱い。AROM/PROM、痛む動作、負荷調整、CARE RESPONSEを優先し、温冷を使う場合も前後反応で判断。",duration:"--",goal,actions:[]};
}
function careThermalDecisionHTML(d){if(!d)return "";const icon=d.mode==="COLD"?"❄":d.mode==="HEAT"?"♨":"○";return `<div class="careToolGroup"><div class="careToolGroupTitle"><span>${icon} ${esc(d.title)}</span><span class="careToolTag">${esc(d.mode)}</span></div><div class="careToolWhy">${esc(d.summary)}</div><div class="careAromLink"><strong>目安</strong>｜${esc(d.duration)}｜BEFORE → AFTER → 24Hで反応確認</div></div>`;}
function renderCareThermalLink(){
  const box=document.getElementById("careThermalLink");if(!box)return;
  const d=careThermalDecision(document.getElementById("careArea")?.value||"lowback",document.getElementById("careTrigger")?.value||"unknown",document.getElementById("careOnsetDate")?.value||"",document.getElementById("careAcuteState")?.value||"none",document.getElementById("careThermalState")?.value||"auto",Math.max(0,Math.min(10,Number(document.getElementById("carePainBefore")?.value||0))),document.getElementById("careSymptomNote")?.value||"",document.getElementById("careThermalGoal")?.value||"symptom");
  box.innerHTML=`<strong>${esc(d.title)}</strong><br>${esc(d.summary)}<br><span style="color:var(--gold2)">目安：${esc(d.duration)}</span>`;
}
function careThermalActions(d){return (d?.actions||[]).map(x=>({...x,recommended:true}));}
const CARE_TAPING_LIBRARY={
  shoulder:[
    {label:"TAPING｜KINESIO｜肩・肩甲帯の感覚入力/動作キュー。軽い張力から開始し、貼付前後で同じ挙上動作を再評価。",tool:"KINESIO_TAPE"},
    {label:"TAPING｜RIGID SUPPORT｜可動域制限・保護が必要な場合のみ。自己流で強く固定せず、習得済みの方法で使用。",tool:"RIGID_TAPE"}
  ],
  neck:[{label:"TAPING｜KINESIO｜頸部そのものを強く締めず、上背部の感覚入力/姿勢キューとして軽く使用。",tool:"KINESIO_TAPE"}],
  lowback:[{label:"TAPING｜KINESIO｜腰背部の感覚入力/動作キューとして軽く使用。腹部を締め付ける固定はしない。",tool:"KINESIO_TAPE"}],
  knee:[
    {label:"TAPING｜KINESIO｜膝周囲の感覚入力/動作補助。皮膚・循環を確認し、スクワット等で前後比較。",tool:"KINESIO_TAPE"},
    {label:"TAPING｜RIGID SUPPORT｜特定方向の動きを一時制限する場合のみ。習得済み手順で使用。",tool:"RIGID_TAPE"}
  ],
  ankle:[
    {label:"TAPING｜ELASTIC SUPPORT｜足関節の軽い支持/圧迫補助。しびれ・変色・冷感が出たら外す。",tool:"ELASTIC_TAPE"},
    {label:"TAPING｜RIGID SUPPORT｜再受傷リスクの高い方向を一時制限する場合。習得済み手順で使用。",tool:"RIGID_TAPE"}
  ],
  wrist:[{label:"TAPING｜ELASTIC / RIGID SUPPORT｜手首中間位の支持または動作制限。指先の循環・感覚を確認。",tool:"SUPPORT_TAPE"}],
  elbow:[{label:"TAPING｜KINESIO / SUPPORT｜前腕〜肘周囲の感覚入力・軽い支持。神経症状や締め付けが出たら中止。",tool:"SUPPORT_TAPE"}]
};
function careTapingActions(area,goal="none"){
  return (CARE_TAPING_LIBRARY[area]||[]).map(x=>({label:x.label,category:"TAPING",tool:x.tool,recommended:goal!=="none",reason:goal!=="none"?`TAPING目的：${goal}`:"TAPING OPTION"}));
}
function careAcuteActions(d){return (d?.actions||[]).map(x=>({...x,recommended:true,reason:d.title,protocol:d.protocol||""}));}
function updateCareTapingDetailVisibility(){
  const box=document.getElementById("careTapingDetail");if(!box)return;box.classList.toggle("hidden",![...document.querySelectorAll('.careActionDone:checked')].some(x=>x.dataset.careCategory==="TAPING"));
}

const CARE_TOOLBOX={
  shoulder:{
    STRETCH:["STRETCH｜胸部・肩周囲を痛みのない範囲で20〜30秒×1〜2。終末域へ押し込まない。"],
    RELEASE:["MASSAGE GUN｜胸・広背・三角筋周囲の筋腹へ30〜60秒/部位。肩前面の骨・関節・強い圧痛点へ直撃しない。","FOAM ROLLER｜広背筋〜胸郭周囲を30〜60秒。痛みやしびれを増やさない。"],
    MOBILITY:["STRETCH POLE｜胸椎伸展＋呼吸 5呼吸×2。腰を反りすぎない。","MOBILITY｜壁で胸椎回旋 5〜8回/側。"],
    AROM:["AROM｜痛みの少ないscaption/前方挙上 6〜10回。肩すくみを抑えて自力で使う。"],
    ACTIVATION:["TUBE｜外旋 10〜15回×1〜2。肘を体側、痛みのない軽負荷。","TUBE｜前鋸筋 wall slide 8〜12回×1〜2。"],
    MOTOR_CONTROL:["MOTOR CONTROL｜肩甲骨の上方回旋を意識したwall slide 6〜10回。代償を確認。"],
    ISOMETRIC:["ISOMETRIC｜外旋を壁/チューブで20〜30秒×2。痛みを増やさない強度。"]
  },
  neck:{
    STRETCH:["STRETCH｜強い側屈ストレッチは避け、必要なら軽い範囲20秒程度。"],RELEASE:["MASSAGE GUN｜首そのもの・前頸部には使用せず、上背部/僧帽筋筋腹へ低強度30秒程度。"],MOBILITY:["STRETCH POLE｜胸椎伸展＋呼吸 5呼吸×2。首を反らしすぎない。"],AROM:["AROM｜頸部回旋/屈伸を痛みの少ない範囲で各5回。"],ACTIVATION:["ACTIVATION｜軽いchin tuck 5秒×5〜8回。"],MOTOR_CONTROL:["MOTOR CONTROL｜頸部中間位＋肩甲骨軽セットで5呼吸。"],ISOMETRIC:["ISOMETRIC｜手で軽く抵抗し頸部中間位を5〜10秒×3。症状が出ない方向のみ。"]
  },
  lowback:{
    STRETCH:["STRETCH｜痛みを増やす強い腰部ストレッチは行わず、股関節周囲を軽く20〜30秒。"],RELEASE:["MASSAGE GUN｜腰椎へ直接当てず、臀筋/広背筋など筋腹へ30〜60秒。","FOAM ROLLER｜腰椎を直接強く転がさず、臀部/胸椎周囲を軽く。"],MOBILITY:["STRETCH POLE｜胸椎伸展＋呼吸。腰を反りすぎない。","MOBILITY｜骨盤前後傾 8〜10回。"],AROM:["AROM｜cat-camel/骨盤前後傾を小さく6〜10回。"],ACTIVATION:["TUBE｜軽い臀部外転 10〜15回×1〜2。症状が増えない場合のみ。"],MOTOR_CONTROL:["MOTOR CONTROL｜ヒップヒンジを無負荷で5〜8回。腰ではなく股関節で動く。"],ISOMETRIC:["ISOMETRIC｜腹圧を軽く入れ5〜10秒×5回。息を止めない。"]
  },
  knee:{
    STRETCH:["STRETCH｜大腿前後/下腿を痛みのない範囲20〜30秒。膝関節へ強い圧をかけない。"],RELEASE:["MASSAGE GUN｜大腿四頭筋/ハム/ふくらはぎ筋腹へ30〜60秒。膝蓋骨・関節裂隙へ当てない。","FOAM ROLLER｜大腿前面/外側/後面を30〜60秒。"],MOBILITY:["MOBILITY｜heel slide 6〜10回。必要なら足関節背屈も確認。"],AROM:["AROM｜膝の曲げ伸ばし 8〜12回。痛みの少ない範囲。"],ACTIVATION:["TUBE｜TKE 10〜15回×1〜2。","ACTIVATION｜quad set 5秒×8回。"],MOTOR_CONTROL:["MOTOR CONTROL｜浅いsit-to-stand 5〜8回。膝の内外への崩れを確認。"],ISOMETRIC:["ISOMETRIC｜膝伸展/壁押し 20〜30秒×2。痛みを増やさない角度。"]
  },
  ankle:{
    STRETCH:["STRETCH｜ふくらはぎを痛みのない範囲20〜30秒。急性痛や腫れが強い場合は行わない。"],RELEASE:["MASSAGE GUN｜腓腹筋/ヒラメ筋筋腹へ30〜60秒。アキレス腱・骨部へ直接当てない。","FOAM ROLLER｜ふくらはぎ30〜60秒。"],MOBILITY:["MOBILITY｜knee-to-wall背屈 6〜10回。痛み/詰まり手前まで。"],AROM:["AROM｜足首上下・円運動 各8〜12回。"],ACTIVATION:["TUBE｜背屈/外反を軽負荷で10〜15回×1〜2。"],MOTOR_CONTROL:["MOTOR CONTROL｜軽い左右荷重移動 5〜8回。"],ISOMETRIC:["ISOMETRIC｜足首中間位で壁/チューブへ10〜20秒×2。"]
  },
  wrist:{
    STRETCH:["STRETCH｜前腕屈筋/伸筋を痛みのない範囲20秒。しびれが出る場合は中止。"],RELEASE:["MASSAGE GUN｜前腕筋腹へ低強度20〜30秒。手首関節・骨部へ直接当てない。"],MOBILITY:["MOBILITY｜手首屈伸・橈尺屈を各5〜8回。"],AROM:["AROM｜手首/前腕回旋を各6〜10回。"],ACTIVATION:["TUBE｜手首伸展/屈曲を軽負荷10〜15回。"],MOTOR_CONTROL:["MOTOR CONTROL｜軽い握り→脱力 5〜8回。手首中間位を保つ。"],ISOMETRIC:["ISOMETRIC｜手首中間位で軽い抵抗10〜20秒×2。"]
  },
  elbow:{
    STRETCH:["STRETCH｜前腕/上腕を痛みのない範囲20秒。肘を強く伸ばし切らない。"],RELEASE:["MASSAGE GUN｜前腕/上腕筋腹へ低強度20〜30秒。肘頭・関節部へ直接当てない。"],MOBILITY:["MOBILITY｜肘屈伸＋前腕回内外 各6〜10回。"],AROM:["AROM｜肘屈伸/回内外を痛みのない範囲で各8回。"],ACTIVATION:["TUBE｜軽い回外/回内または肘伸展 10〜15回。"],MOTOR_CONTROL:["MOTOR CONTROL｜肩をすくめず肘・前腕を中間位で反復5〜8回。"],ISOMETRIC:["ISOMETRIC｜肘屈曲/伸展を10〜20秒×2。痛みのない角度。"]
  }
};
function careClassifyIntervention(label){
  const t=String(label||"");
  if(/TAPING|テーピング/.test(t))return {category:"TAPING",tool:/RIGID/.test(t)?"RIGID_TAPE":/ELASTIC/.test(t)?"ELASTIC_TAPE":"KINESIO_TAPE"};
  if(/ICE|冷却|COLD|COOLING/.test(t))return {category:"COLD_SYMPTOM",tool:"COLD_PACK"};
  if(/HEAT|WARM|温熱|温め/.test(t))return {category:"HEAT_SYMPTOM",tool:"WARM_PACK"};
  if(/COMPRESS|圧迫/.test(t))return {category:"COMPRESSION",tool:"ELASTIC_COMPRESSION"};
  if(/ELEVAT|挙上/.test(t))return {category:"ELEVATION",tool:"POSITIONING"};
  if(/PROTECT|保護|再受傷/.test(t))return {category:"PROTECTION",tool:"PROTECTION"};
  if(/VASCULAR|軽い歩行|自転車/.test(t))return {category:"VASCULARISATION",tool:"LIGHT_CARDIO"};
  if(/EDUCAT|OPTIMISM|回復見込み|恐怖回避/.test(t))return {category:"EDUCATION",tool:"EDUCATION"};
  if(/LOVE｜EXERCISE/.test(t))return {category:"EXERCISE",tool:"AROM_CONTROL"};
  if(/OPTIMAL LOADING|PROGRESSIVE_LOAD|段階的.*荷重/.test(t))return {category:"LOAD_MANAGEMENT",tool:"PROGRESSIVE_LOAD"};
  if(/マッサージガン|MASSAGE GUN|フォームローラー|FOAM ROLLER|リリース/.test(t))return {category:"RELEASE",tool:/ガン|GUN/.test(t)?"MASSAGE_GUN":"FOAM_ROLLER"};
  if(/ストレッチポール|STRETCH POLE/.test(t))return {category:"MOBILITY",tool:"STRETCH_POLE"};
  if(/STRETCH|ストレッチ/.test(t))return {category:"STRETCH",tool:"BODYWEIGHT"};
  if(/TUBE|チューブ/.test(t))return {category:"ACTIVATION",tool:"TUBE"};
  if(/ISOMETRIC|等尺|秒×/.test(t))return {category:"ISOMETRIC",tool:"BODYWEIGHT"};
  if(/MOTOR CONTROL|コントロール|ヒンジ|wall slide/.test(t))return {category:"MOTOR_CONTROL",tool:"BODYWEIGHT"};
  if(/ACTIVATION|力を入れる|quad set|肩甲骨/.test(t))return {category:"ACTIVATION",tool:"BODYWEIGHT"};
  if(/呼吸|BREATH/.test(t))return {category:"BREATH_RELAX",tool:"BODYWEIGHT"};
  if(/AROM|曲げ伸ばし|回す|上げる|動かす|可動/.test(t))return {category:"AROM",tool:"BODYWEIGHT"};
  if(/避け|中止|減ら|休/.test(t))return {category:"LOAD_MANAGEMENT",tool:"NONE"};
  return {category:"OTHER",tool:"OTHER"};
}
function careToolboxActions(area,decision,baseRoutine=[],acuteDecision=null,tapingGoal="none",thermalDecision=null){
  const cats=decision?.categories||["AROM"];const box=CARE_TOOLBOX[area]||{};const out=[];
  for(const a of careAcuteActions(acuteDecision))out.push(a);
  for(const a of careThermalActions(thermalDecision))out.push(a);
  for(const c of cats){for(const label of (box[c]||[]))out.push({label,...careClassifyIntervention(label),recommended:true,reason:decision?.title||"CARE DECISION",protocol:""})}
  for(const a of careTapingActions(area,tapingGoal))out.push(a);
  for(const label of baseRoutine||[]){const meta=careClassifyIntervention(label);out.push({label,...meta,recommended:false,reason:"症状別ベースCARE",protocol:""})}
  const seen=new Set();return out.filter(x=>{const k=(x.category==="COLD_SYMPTOM"||x.category==="HEAT_SYMPTOM")?x.category+"|"+x.tool:x.category+"|"+x.label;if(seen.has(k))return false;seen.add(k);return true}).slice(0,34);
}
function careDecisionHTML(decision){
  const x=decision?.arom;if(!decision)return "";
  const rom=x?`<div class="careDecisionGrid"><div class="careDecisionBox"><span>連携AROM</span><b>${Number(x.active).toFixed(0)}°</b></div><div class="careDecisionBox"><span>PROM</span><b>${x.passive==null?"未測定":Number(x.passive).toFixed(0)+"°"}</b></div><div class="careDecisionBox"><span>GAP</span><b>${x.passive==null?"--":(Number(x.passive)-Number(x.active)).toFixed(0)+"°"}</b></div></div>`:"";
  return `<div class="careToolGroup"><div class="careToolGroupTitle"><span>${esc(decision.title)}</span><span class="careToolTag">${esc(decision.code)}</span></div><div class="careToolWhy">${esc(decision.summary)}</div>${x?`<div class="careAromLink"><strong>${esc(x.label||x.key)}</strong>｜${esc(x.date||"")}｜痛み ${Number(x.pain||0)}/10</div>`:`<div class="careAromLink">保存済みAROM/PROMなし</div>`}${rom}</div>`;
}
function renderCareAromLink(){
  const box=document.getElementById("careAromLink");if(!box||!m())return;
  const area=document.getElementById("careArea")?.value||"lowback",movement=document.getElementById("careMovement")?.value||"",pain=Math.max(0,Math.min(10,Number(document.getElementById("carePainBefore")?.value||0))),d=careAromDecision(area,movement,pain),x=d.arom;
  box.innerHTML=x?`<strong>${esc(x.label||x.key)}</strong>｜${esc(x.date||"")}｜AROM ${Number(x.active).toFixed(0)}°｜PROM ${x.passive==null?"未測定":Number(x.passive).toFixed(0)+"°"}<br>${esc(d.title)}｜${esc(d.summary)}`:`<strong>${esc(d.title)}</strong><br>${esc(d.summary)}`;
}
let currentCareAssessment=null;
function careOptionalNumber(id,min=null,max=null){
  const el=document.getElementById(id);if(!el||String(el.value).trim()==="")return null;
  const v=Number(el.value);if(!Number.isFinite(v))return null;
  if(min!=null&&v<min)return min;if(max!=null&&v>max)return max;return v;
}
function careHash(text){
  let h=2166136261;for(const ch of String(text||"")){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
  return (h>>>0).toString(36).toUpperCase();
}
function careStepId(area,text,index=0){
  const t=String(text||"");
  const rules=[
    [/ペンデュラム/,"PENDULUM"],[/反対の手.*腕を前に上げる|補助.*腕を前に上げる/,"ASSIST_FLEXION"],[/肩甲骨.*後ろ下|肩甲骨セット/,"SCAPULA_SET"],[/外旋/,"LIGHT_EXTERNAL_ROTATION"],
    [/あごを軽く引く/,"CHIN_TUCK"],[/首を左右/,"NECK_ROTATION"],[/骨盤.*前後/,"PELVIC_TILT"],[/片膝を胸/,"SINGLE_KNEE_TO_CHEST"],[/四つ這い.*丸める|背中をゆっくり丸める/,"CAT_MOBILITY"],[/軽い歩行/,"LIGHT_WALK"],
    [/踵|かかと.*上げ/,"HEEL_RAISE"],[/足首.*回|足首.*動か/,"ANKLE_MOBILITY"],[/手首.*曲げ|手首.*伸ば/,"WRIST_MOBILITY"],[/握る|把持/,"LIGHT_GRIP"],[/肘.*曲げ|肘.*伸ば/,"ELBOW_MOBILITY"]
  ];
  const prefix=String(area||"care").toUpperCase().replace(/[^A-Z0-9]/g,"_");
  for(const [re,name] of rules)if(re.test(t))return `${prefix}_${name}`;
  return `${prefix}_STEP_${careHash(t||String(index))}`;
}
function collectCareInterventions(){
  const rows=[...document.querySelectorAll('.careActionDone:checked')].map(x=>({id:x.dataset.careId||"",label:x.dataset.careLabel||"CARE",category:x.dataset.careCategory||careClassifyIntervention(x.dataset.careLabel||"").category,tool:x.dataset.careTool||careClassifyIntervention(x.dataset.careLabel||"").tool,recommended:x.dataset.careRecommended==="1",protocol:x.dataset.careProtocol||""})).filter(x=>x.id);
  const tapingRows=rows.filter(x=>x.category==="TAPING");
  if(tapingRows.length){
    const detail={type:document.getElementById("careTapeType")?.value||"unspecified",target:(document.getElementById("careTapeTarget")?.value||"").trim(),direction:(document.getElementById("careTapeDirection")?.value||"").trim(),tension:document.getElementById("careTapeTension")?.value||"unspecified",durationHours:careOptionalNumber("careTapeDuration",0,168)};
    const sig=[detail.type,detail.target,detail.direction,detail.tension].join("|");
    tapingRows.forEach(x=>{x.taping=detail;x.id=`${x.id}_${careHash(sig)}`;x.label+=`｜TYPE ${detail.type}${detail.target?`｜部位 ${detail.target}`:""}${detail.direction?`｜方向 ${detail.direction}`:""}｜張力 ${detail.tension}${detail.durationHours!=null?`｜${detail.durationHours}h`:""}`;});
  }
  const other=(document.getElementById("careOtherAction")?.value||"").trim();
  if(other){const meta=careClassifyIntervention(other);rows.push({id:`CUSTOM_${careHash(other)}`,label:other,...meta,recommended:false,protocol:""})}
  const seen=new Set();return rows.filter(x=>{if(seen.has(x.id))return false;seen.add(x.id);return true});
}
function median(nums){
  const a=nums.filter(Number.isFinite).slice().sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
function average(nums){const a=nums.filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}
function careResponseFromRow(x){
  const pb=x?.painBefore==null?null:Number(x.painBefore),pa=x?.painAfter==null?null:Number(x.painAfter);const painDelta=Number.isFinite(pb)&&Number.isFinite(pa)?pb-pa:null;
  const rb=x?.romBefore==null?null:Number(x.romBefore),ra=x?.romAfter==null?null:Number(x.romAfter);const romDelta=Number.isFinite(rb)&&Number.isFinite(ra)?ra-rb:null;
  const mb=x?.movementBefore==null?null:Number(x.movementBefore),ma=x?.movementAfter==null?null:Number(x.movementAfter);const movementDelta=Number.isFinite(mb)&&Number.isFinite(ma)?mb-ma:null;
  return {painDelta,romDelta,movementDelta,improved:(painDelta!=null&&painDelta>0)||(romDelta!=null&&romDelta>0)||(movementDelta!=null&&movementDelta>0),worsened:(painDelta!=null&&painDelta<0)||(romDelta!=null&&romDelta<0)||(movementDelta!=null&&movementDelta<0)};
}
function careFollowupMetrics(x){
  const f=x?.followup24h;if(!f)return {available:false,durable:false,rebound:false,painDelta:null,romDelta:null,movementDelta:null,retentionPain:null};
  const pb=x?.painBefore==null?null:Number(x.painBefore),pa=x?.painAfter==null?null:Number(x.painAfter),pf=f?.pain==null?null:Number(f.pain);
  const rb=x?.romBefore==null?null:Number(x.romBefore),rf=f?.rom==null?null:Number(f.rom);
  const mb=x?.movementBefore==null?null:Number(x.movementBefore),mf=f?.movement==null?null:Number(f.movement);
  const painDelta=Number.isFinite(pb)&&Number.isFinite(pf)?pb-pf:null,romDelta=Number.isFinite(rb)&&Number.isFinite(rf)?rf-rb:null,movementDelta=Number.isFinite(mb)&&Number.isFinite(mf)?mb-mf:null;
  const immediate=Number.isFinite(pb)&&Number.isFinite(pa)?pb-pa:null;
  const retentionPain=immediate!=null&&immediate>0&&painDelta!=null?painDelta/immediate:null;
  const objectiveWorse=(painDelta!=null&&painDelta<0)||(romDelta!=null&&romDelta<0)||(movementDelta!=null&&movementDelta<0);
  const rebound=(Number.isFinite(pa)&&Number.isFinite(pf)&&pf-pa>=2)||f.status==="worse"||objectiveWorse;
  const improved=(painDelta!=null&&painDelta>0)||(romDelta!=null&&romDelta>0)||(movementDelta!=null&&movementDelta>0);
  const durable=improved&&!rebound;
  return {available:true,durable,rebound,improved,painDelta,romDelta,movementDelta,retentionPain};
}
function careFollowupCandidates(){
  return (m()?.selfCare||[]).map((x,index)=>({x,index})).filter(v=>v.x?.result==="selfcare"&&v.x?.painAfter!=null&&v.x?.date&&dateAgeDays(v.x.date)<=21).sort((a,b)=>String(b.x.savedAt||b.x.date).localeCompare(String(a.x.savedAt||a.x.date)));
}
function renderCareFollowupPanel(){
  const sel=document.getElementById("careFollowupSelect"),ctx=document.getElementById("careFollowupContext");if(!sel||!ctx||!m())return;
  const rows=careFollowupCandidates();const old=sel.value;
  if(!rows.length){sel.innerHTML='<option value="">保存済みCAREなし</option>';ctx.innerHTML='<span class="muted">実施後の再評価を保存すると、翌日フォローが使えます。</span>';return}
  sel.innerHTML=rows.map(({x,index})=>{const ints=(x.interventions||[]).map(v=>v.label||v.id).join(" ＋ ");const status=x.followup24h?"済":"未";return `<option value="${index}">${esc(x.date)}｜${esc(CARE_AREA_LABELS[x.area]||x.area)}｜${status}｜${esc(ints||x.hypothesis||"CARE")}</option>`}).join("");
  if([...sel.options].some(o=>o.value===old))sel.value=old;else{const pending=rows.find(v=>!v.x.followup24h);sel.value=String((pending||rows[0]).index)}
  loadCareFollowupForm();
}
function loadCareFollowupForm(){
  const sel=document.getElementById("careFollowupSelect"),ctx=document.getElementById("careFollowupContext");if(!sel||!ctx||!m())return;
  const i=Number(sel.value),x=m().selfCare?.[i];if(!x)return;
  const f=x.followup24h||null,ints=(x.interventions||[]).map(v=>v.label||v.id).join(" ＋ ");
  ctx.innerHTML=`<b>${esc(x.date)}｜${esc(CARE_AREA_LABELS[x.area]||x.area)}</b><br>${esc(x.location||"")}｜${esc(x.movement||"")}<br>仮説候補：${esc(x.hypothesis||"反応データから更新")}<br>直後：痛み ${x.painBefore}/10 → ${x.painAfter}/10${x.romBefore!=null&&x.romAfter!=null?`｜ROM ${Number(x.romBefore).toFixed(0)}°→${Number(x.romAfter).toFixed(0)}°`:""}<br>CARE：${esc(ints||"未記録")}`;
  const d=document.getElementById("careFollowupDate"),p=document.getElementById("careFollowupPain"),r=document.getElementById("careFollowupRom"),mv=document.getElementById("careFollowupMove"),st=document.getElementById("careFollowupStatus"),note=document.getElementById("careFollowupNote");
  if(d)d.value=f?.date||today();if(p)p.value=f?.pain??"";if(r)r.value=f?.rom??"";if(mv)mv.value=f?.movement??"";if(st)st.value=f?.status||"same";if(note)note.value=f?.note||"";
  const judge=document.getElementById("careFollowupJudge");if(judge){if(!f)judge.innerHTML='<span class="careFollowupPending">未フォロー</span>｜翌日の状態を入力すると持続反応を判定します。';else{const fm=careFollowupMetrics(x);judge.innerHTML=fm.rebound?'<span class="careFollowupPending">戻り / 悪化あり</span>｜次回は同じCAREを自動優先せず、条件を再評価。':fm.durable?'<span class="careFollowupDone">改善維持</span>｜次回優先CARE候補として信頼度を上げます。':'<span class="careFollowupDone">フォロー保存済み</span>｜大きな持続改善は未確定。';}}
}
function saveCareFollowup(){
  const sel=document.getElementById("careFollowupSelect");if(!sel||!m())return;
  const i=Number(sel.value),x=m().selfCare?.[i];if(!x)return alert("フォローするCAREを選択してください");
  const pain=careOptionalNumber("careFollowupPain",0,10);if(pain==null)return alert("翌日・24Hの痛みを0〜10で入力してください");
  x.followup24h={date:document.getElementById("careFollowupDate")?.value||today(),pain,rom:careOptionalNumber("careFollowupRom",0,360),movement:careOptionalNumber("careFollowupMove",0,10),status:document.getElementById("careFollowupStatus")?.value||"same",note:(document.getElementById("careFollowupNote")?.value||"").trim(),savedAt:new Date().toISOString()};
  const fm=careFollowupMetrics(x),judge=document.getElementById("careFollowupJudge");
  if(judge)judge.textContent=fm.rebound?"翌日反応：戻り / 悪化あり。次回は同じCAREを優先せず、負荷・動作・CARE内容を再評価。":fm.durable?"翌日反応：改善維持。CARE RESPONSE PROFILEの次回優先候補へ反映。":"翌日反応：大きな悪化なし。持続改善はまだ明確ではありません。";
  persist();renderCareHistory();renderCareResponseProfile();renderCareFollowupPanel();renderCareReferralGate();renderSmartCore();renderNextLoadPanel();renderJointByJoint();renderIntegratedAssessment();renderResponseEngine();
}
function renderCareQuestions(){
  const area=document.getElementById("careArea")?.value||"lowback";
  const medArea=document.getElementById("medicalArea");if(medArea&&!medArea.dataset.userChanged)medArea.value=area;
  const box=document.getElementById("careFlags"),loc=document.getElementById("careLocation"),mov=document.getElementById("careMovement");
  if(loc){loc.innerHTML=(CARE_LOCATIONS[area]||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");loc.onchange=()=>{renderCareResponseProfile();renderCareAromLink()}}
  if(mov){mov.innerHTML=(CARE_MOVEMENTS[area]||[]).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");mov.onchange=()=>{renderCareResponseProfile();renderCareAromLink()}}
  if(box)box.innerHTML=(CARE_FLAGS[area]||[]).map((t,i)=>`<label class="selfCareFlag"><input type="checkbox" class="careFlag" value="${i}"><span>${esc(t)}</span></label>`).join("");
  const result=document.getElementById("careResult");if(result)result.innerHTML='<span class="muted">上の項目を入力してください。</span>';
  const preview=document.getElementById("careAreaPoster");if(preview)preview.innerHTML=carePosterHTML(area);
  ["carePainAfter","careRomAfter","careMoveAfter"].forEach(id=>{const e=document.getElementById(id);if(e)e.value=""});
  const judge=document.getElementById("careAfterJudge");if(judge)judge.textContent="実施後に痛み・ROM・同じ動作を再評価します。";
  currentCareAssessment=null;renderCareResponseProfile();renderCareFollowupPanel();renderCareAromLink();renderCareAcuteLink();renderCareThermalLink();renderCareReferralGate();
}
function evaluateSelfCare(){
  const area=document.getElementById("careArea")?.value||"lowback";
  const pain=Math.max(0,Math.min(10,n("carePainBefore")));
  const trigger=document.getElementById("careTrigger")?.value||"unknown";
  const location=document.getElementById("careLocation")?.value||"";
  const movement=document.getElementById("careMovement")?.value||"";
  const flags=[...document.querySelectorAll('.careFlag:checked')].map(x=>Number(x.value));
  const box=document.getElementById("careResult");
  currentCareAssessment={date:today(),area,location,movement,painBefore:pain,painAfter:null,trigger,flags,result:"",onsetDate:document.getElementById("careOnsetDate")?.value||"",symptomNote:(document.getElementById("careSymptomNote")?.value||"").trim(),acuteState:document.getElementById("careAcuteState")?.value||"none",thermalState:document.getElementById("careThermalState")?.value||"auto",thermalGoal:document.getElementById("careThermalGoal")?.value||"symptom",tapingGoal:document.getElementById("careTapingGoal")?.value||"none",romTest:(document.getElementById("careRomTest")?.value||"").trim(),romBefore:careOptionalNumber("careRomBefore",0,360),romAfter:null,movementBefore:careOptionalNumber("careMoveBefore",0,10),movementAfter:null,interventions:[],protocolId:""};
  const traumaMedical=(area==="neck"&&trigger==="trauma");
  if(flags.length || traumaMedical){
    currentCareAssessment.result="medical";
    box.innerHTML=`<div class="smartWarn"><b>セルフケアより医療評価を優先</b><br>${esc(CARE_AREA_LABELS[area])}｜${esc(location)}｜${esc(movement)}<br>危険サインまたは外傷条件に該当しています。トレーニングを中止し、医療機関で状態を確認してください。</div><div class="carePosterWrap">${carePosterHTML(area)}</div>`;
    renderCareReferralGate();
    return;
  }
  if(pain>=7){
    currentCareAssessment.result="stop";
    box.innerHTML=`<div class="smartWarn"><b>高負荷トレーニングは中止</b><br>${esc(CARE_AREA_LABELS[area])}｜${esc(location)}｜${esc(movement)}<br>痛みが強いため、無理にストレッチや負荷を加えず、改善しない・悪化する場合は医療機関で確認してください。</div><div class="carePosterWrap">${carePosterHTML(area)}</div>`;
    renderCareReferralGate();
    return;
  }
  currentCareAssessment.result="selfcare";
  const plan=carePlan(area,location,movement),decision=careAromDecision(area,movement,pain),acuteDecision=careAcuteDecision(area,trigger,currentCareAssessment.onsetDate,currentCareAssessment.acuteState,pain),thermalDecision=careThermalDecision(area,trigger,currentCareAssessment.onsetDate,currentCareAssessment.acuteState,currentCareAssessment.thermalState,pain,currentCareAssessment.symptomNote,currentCareAssessment.thermalGoal),toolActions=careToolboxActions(area,decision,plan.routine,acuteDecision,currentCareAssessment.tapingGoal,thermalDecision);
  currentCareAssessment.hypothesis=plan.title||"";
  currentCareAssessment.movementNote=plan.movementNote||"";
  currentCareAssessment.careDecision={code:decision.code,title:decision.title,summary:decision.summary,categories:[...(decision.categories||[])],arom:decision.arom?{key:decision.arom.key,label:decision.arom.label,date:decision.arom.date,active:decision.arom.active,passive:decision.arom.passive,pain:decision.arom.pain}:null};
  currentCareAssessment.acuteDecision={code:acuteDecision.code,protocol:acuteDecision.protocol||"",title:acuteDecision.title,summary:acuteDecision.summary,days:acuteDecision.days,state:acuteDecision.state};
  currentCareAssessment.thermalDecision={mode:thermalDecision.mode,code:thermalDecision.code,title:thermalDecision.title,summary:thermalDecision.summary,duration:thermalDecision.duration,goal:thermalDecision.goal};
  const groups=new Map();for(const a of toolActions){if(!groups.has(a.category))groups.set(a.category,[]);groups.get(a.category).push(a)}
  const actions=[...groups.entries()].map(([category,items])=>`<div class="careToolGroup"><div class="careToolGroupTitle"><span>${esc(category)}</span><span class="careToolTag">${items.some(x=>x.recommended)?"推奨":"BASE"}</span></div>${items.map((x,i)=>{const id=`${area.toUpperCase()}_${category}_${careHash(x.label)}`;return `<label class="careActionCheck"><input type="checkbox" class="careActionDone" data-care-id="${esc(id)}" data-care-label="${esc(x.label)}" data-care-category="${esc(x.category)}" data-care-tool="${esc(x.tool)}" data-care-recommended="${x.recommended?"1":"0"}" data-care-protocol="${esc(x.protocol||"")}"><span><b style="color:var(--gold2)">${esc(x.tool)}｜${esc(x.category)}</b><br>${esc(x.label)}</span></label>`}).join("")}</div>`).join("");
  box.innerHTML=`<div class="smartOk"><b>${esc(CARE_AREA_LABELS[area])}CARE TOOLBOX｜痛み ${pain}/10</b><br>場所：${esc(location)}｜痛む動作：${esc(movement)}<br><span style="color:var(--gold2);font-weight:800">症状別重点：</span>${esc(plan.title)}<br><span style="color:var(--gold2);font-weight:800">動作の注意：</span>${esc(plan.movementNote)}<br>痛みを増やさない範囲で行い、終了後に同じ条件で再評価してください。</div>${careAcuteDecisionHTML(acuteDecision)}${careThermalDecisionHTML(thermalDecision)}${careDecisionHTML(decision)}<div class="carePosterWrap">${carePosterHTML(area)}</div><h3>CARE TOOLBOX｜実際に行ったものをチェック</h3><div class="muted">AROM/PROM分岐＋急性期フレーム＋COLD / HEAT＋TAPINGを統合。RICE / PRICE / POLICE / PEACE & LOVEは“名称を選ぶ”のではなく、実際に行った要素だけチェックして反応を学習します。</div><div class="careActionList">${actions}</div><div id="careTapingDetail" class="careToolGroup hidden"><div class="careToolGroupTitle"><span>TAPING DETAIL</span><span class="careToolTag">BEFORE → AFTER → 24H</span></div><div class="grid2"><div><label>テープ種類</label><select id="careTapeType"><option value="KINESIO">KINESIO</option><option value="ELASTIC">ELASTIC SUPPORT</option><option value="RIGID">RIGID</option><option value="OTHER">OTHER</option></select></div><div><label>貼付部位</label><input id="careTapeTarget" value="${esc(location)}" placeholder="例：右足関節外側"></div></div><div class="grid2" style="margin-top:8px"><div><label>方向 / 狙い</label><input id="careTapeDirection" placeholder="例：外反方向の支持 / 肩甲骨上方回旋キュー"></div><div><label>張力</label><select id="careTapeTension"><option value="LIGHT">軽い</option><option value="MODERATE">中等度</option><option value="NO_STRETCH">ほぼ伸ばさない</option><option value="RIGID_LIMIT">リジッド固定</option></select></div></div><div style="margin-top:8px"><label>貼付時間 h（任意）</label><input id="careTapeDuration" type="number" min="0" max="168" step="0.5" placeholder="例：2"></div><div class="muted" style="margin-top:7px">皮膚刺激、しびれ、変色、冷感、症状悪化が出た場合は外して再評価。骨格矯正や原因治療とは断定しません。</div></div><div style="margin-top:8px"><label>その他CARE（任意）</label><input id="careOtherAction" placeholder="表示外のCARE・器具・手技を行った場合のみ記入"></div>`;
  [...document.querySelectorAll('.careActionDone')].forEach(x=>x.addEventListener('change',updateCareTapingDetailVisibility));updateCareTapingDetailVisibility();
  renderCareReferralGate();
}
function saveSelfCareResult(){
  if(!currentCareAssessment)return alert("先にセルフケア判定を行ってください");
  if(currentCareAssessment.result!=="selfcare")return alert("セルフケア対象外の判定です。必要に応じて医療評価を優先してください。");
  const afterEl=document.getElementById("carePainAfter");
  if(!afterEl||afterEl.value==="")return alert("AFTERの痛みを0〜10で入力してください");
  const after=Number(afterEl.value);if(after<0||after>10)return alert("AFTERを0〜10で入力してください");
  const interventions=collectCareInterventions();if(!interventions.length)return alert("実際に行ったCAREを1つ以上チェックしてください");
  currentCareAssessment.painAfter=after;
  currentCareAssessment.romAfter=careOptionalNumber("careRomAfter",0,360);
  currentCareAssessment.movementAfter=careOptionalNumber("careMoveAfter",0,10);
  currentCareAssessment.interventions=interventions;
  currentCareAssessment.protocolId=interventions.map(x=>x.id).sort().join("+");
  currentCareAssessment.followup24h=null;
  currentCareAssessment.savedAt=new Date().toISOString();
  const response=careResponseFromRow(currentCareAssessment);currentCareAssessment.response=response;
  m().selfCare.push({...currentCareAssessment});
  const delta=after-currentCareAssessment.painBefore;
  const box=document.getElementById("careAfterJudge");
  const pct=currentCareAssessment.painBefore>0?Math.round((currentCareAssessment.painBefore-after)/currentCareAssessment.painBefore*100):0;
  const extra=[];if(response.romDelta!=null)extra.push(`ROM ${response.romDelta>=0?"+":""}${response.romDelta.toFixed(0)}°`);if(response.movementDelta!=null)extra.push(`動作つらさ ${response.movementDelta>=0?"-":"+"}${Math.abs(response.movementDelta).toFixed(0)}`);
  box.textContent=(delta<0?`改善：${currentCareAssessment.painBefore} → ${after}（${Math.abs(delta)}ポイント低下 / ${pct}%改善）`:delta>0?`悪化：${currentCareAssessment.painBefore} → ${after}。セルフケアを中止して状態を再確認。`:`変化なし：${after}/10。無理に追加せず経過を確認。`)+(extra.length?`｜${extra.join("｜")}`:"");
  persist();renderCareHistory();renderCareResponseProfile();renderCareFollowupPanel();renderCareReferralGate();renderSmartCore();renderNextLoadPanel();renderJointByJoint();renderIntegratedAssessment();renderResponseEngine();
}
function careProtocolStats(rows){
  const map=new Map();
  rows.forEach(x=>{
    const ints=Array.isArray(x.interventions)?x.interventions:[];if(!ints.length)return;
    const id=x.protocolId||ints.map(v=>v.id).filter(Boolean).sort().join("+");if(!id)return;
    const r=careResponseFromRow(x),f=careFollowupMetrics(x),label=ints.map(v=>v.label||v.id).join(" ＋ ");
    if(!map.has(id))map.set(id,{id,label,n:0,success:0,worsened:0,pain:[],rom:[],move:[],followups:0,durable:0,rebound:0,followPain:[],followRom:[],followMove:[]});
    const g=map.get(id);g.n++;if(r.improved)g.success++;if(r.worsened)g.worsened++;if(r.painDelta!=null)g.pain.push(r.painDelta);if(r.romDelta!=null)g.rom.push(r.romDelta);if(r.movementDelta!=null)g.move.push(r.movementDelta);
    if(f.available){g.followups++;if(f.durable)g.durable++;if(f.rebound)g.rebound++;if(f.painDelta!=null)g.followPain.push(f.painDelta);if(f.romDelta!=null)g.followRom.push(f.romDelta);if(f.movementDelta!=null)g.followMove.push(f.movementDelta)}
  });
  return [...map.values()].map(g=>{const successRate=g.n?g.success/g.n*100:0,durabilityRate=g.followups?g.durable/g.followups*100:null,reboundRate=g.followups?g.rebound/g.followups*100:null;const responseScore=durabilityRate==null?successRate:Math.max(0,Math.min(100,successRate*.5+durabilityRate*.5-(reboundRate||0)*.5));return {...g,successRate,durabilityRate,reboundRate,responseScore,medianPain:median(g.pain),avgPain:average(g.pain),avgRom:average(g.rom),avgMove:average(g.move),followMedianPain:median(g.followPain),followAvgRom:average(g.followRom),followAvgMove:average(g.followMove)}}).sort((a,b)=>{const sc=b.responseScore-a.responseScore;if(sc)return sc;const n=b.n-a.n;if(n)return n;return (b.durable||0)-(a.durable||0)});
}
function careCategoryStats(rows){
  const map=new Map();for(const x of rows){const r=careResponseFromRow(x),f=careFollowupMetrics(x),cats=[...new Set((x.interventions||[]).map(v=>v.category||careClassifyIntervention(v.label||"").category).filter(Boolean))];for(const c of cats){if(!map.has(c))map.set(c,{category:c,n:0,improved:0,worsened:0,followups:0,durable:0,rebound:0});const g=map.get(c);g.n++;if(r.improved)g.improved++;if(r.worsened)g.worsened++;if(f.available){g.followups++;if(f.durable)g.durable++;if(f.rebound)g.rebound++;}}}
  return [...map.values()].map(g=>({...g,score:Math.max(0,Math.min(100,50+(g.improved/g.n)*30-(g.worsened/g.n)*35+(g.followups?(g.durable/g.followups)*25-(g.rebound/g.followups)*35:0)))})).sort((a,b)=>b.score-a.score);
}
function renderCareResponseProfile(){
  const box=document.getElementById("careResponseProfile");if(!box||!m())return;
  const area=document.getElementById("careArea")?.value||"lowback",location=document.getElementById("careLocation")?.value||"",movement=document.getElementById("careMovement")?.value||"";
  const all=(m().selfCare||[]).filter(x=>x.result==="selfcare"&&x.painAfter!=null&&Array.isArray(x.interventions)&&x.interventions.length&&x.area===area);
  const exact=all.filter(x=>(!location||x.location===location)&&(!movement||x.movement===movement));
  const rows=exact.length>=2?exact:all,scope=exact.length>=2?`${CARE_AREA_LABELS[area]||area}｜${location||"場所未指定"}｜${movement||"動作未指定"}`:`${CARE_AREA_LABELS[area]||area}｜部位全体`;
  if(!rows.length){box.innerHTML=`<div class="notice">${esc(CARE_AREA_LABELS[area]||area)}のCARE RESPONSEデータはまだありません。セルフケア後に実施CAREと再評価を保存すると学習を開始します。</div>`;return}
  const stats=careProtocolStats(rows),pain=rows.map(x=>careResponseFromRow(x).painDelta).filter(v=>v!=null),rom=rows.map(x=>careResponseFromRow(x).romDelta).filter(v=>v!=null),move=rows.map(x=>careResponseFromRow(x).movementDelta).filter(v=>v!=null),follow=rows.map(careFollowupMetrics).filter(x=>x.available);
  const confidence=(rows.length>=6&&follow.length>=3)?"HIGH":rows.length>=3?"MEDIUM":"LOW";
  const durableRate=follow.length?Math.round(follow.filter(x=>x.durable).length/follow.length*100):null,reboundRate=follow.length?Math.round(follow.filter(x=>x.rebound).length/follow.length*100):null;
  const top=stats.slice(0,3).map((g,i)=>`<div class="careProtocolCard ${g.followups&&g.durabilityRate>=70?'careDurable':''}"><strong>${i+1}. ${esc(g.label)}</strong><span class="careResponseRank">RESPONSE ${Math.round(g.responseScore)}</span><div class="careProtocolMeta">直後 n=${g.n}｜改善 ${g.success}/${g.n}（${Math.round(g.successRate)}%）${g.medianPain==null?"":`｜痛み改善中央値 ${g.medianPain>=0?"+":""}${g.medianPain.toFixed(1)}pt`}${g.avgRom==null?"":`｜ROM平均 ${g.avgRom>=0?"+":""}${g.avgRom.toFixed(1)}°`}${g.followups?`<br>翌日 n=${g.followups}｜改善維持 ${g.durable}/${g.followups}（${Math.round(g.durabilityRate)}%）｜戻り/悪化 ${g.rebound}/${g.followups}`:"<br>翌日フォロー未蓄積"}</div></div>`).join("");
  const bad=stats.filter(g=>g.worsened>0||g.rebound>0).slice(0,3).map(g=>`<div class="careProtocolCard ${g.rebound>0?'careRebound':'careProtocolBad'}"><strong>${g.rebound>0?'翌日戻り/悪化あり':'直後悪化あり'}｜${esc(g.label)}</strong><div class="careProtocolMeta">直後悪化 ${g.worsened}/${g.n}回${g.followups?`｜翌日戻り/悪化 ${g.rebound}/${g.followups}回`:""}。次回は自動優先せず、条件を再確認する。</div></div>`).join("");
  const best=stats.find(g=>g.success>0&&g.worsened===0&&g.rebound===0),next=best?`<div class="notice" style="margin-top:8px"><b>次回優先CARE候補</b><br>${esc(best.label)}｜RESPONSE ${Math.round(best.responseScore)}｜CONFIDENCE ${confidence}${best.followups?`｜翌日維持 ${Math.round(best.durabilityRate)}%`:"｜翌日フォロー待ち"}<br><span class="muted">同じ部位・場所・動作条件を優先して比較。悪化記録がある場合は優先しません。</span></div>`:`<div class="notice" style="margin-top:8px"><b>次回優先CARE候補</b><br>現時点では安全に優先できるプロトコルを確定していません。直後・翌日反応を追加して再評価します。</div>`;
  const categoryTop=careCategoryStats(rows).slice(0,5).map(g=>`<div class="careProtocolCard"><strong>${esc(g.category)}</strong><span class="careResponseRank">RESPONSE ${Math.round(g.score)}</span><div class="careProtocolMeta">含むセッション n=${g.n}｜直後改善 ${g.improved}/${g.n}${g.followups?`｜翌日維持 ${g.durable}/${g.followups}｜戻り/悪化 ${g.rebound}/${g.followups}`:"｜翌日フォロー待ち"}</div></div>`).join("");
  box.innerHTML=`<div class="notice"><b>${esc(scope)}</b><br>CONFIDENCE ${confidence}｜保存 ${rows.length}回｜プロトコル ${stats.length}種類｜翌日フォロー ${follow.length}回${durableRate==null?"":`｜改善維持 ${durableRate}%｜戻り/悪化 ${reboundRate}%`}</div><div class="careResponseKpis"><div class="careResponseKpi"><span>痛み改善中央値</span><b>${median(pain)==null?"--":`${median(pain)>=0?"+":""}${median(pain).toFixed(1)}`}</b></div><div class="careResponseKpi"><span>ROM平均変化</span><b>${average(rom)==null?"--":`${average(rom)>=0?"+":""}${average(rom).toFixed(0)}°`}</b></div><div class="careResponseKpi"><span>翌日改善維持</span><b>${durableRate==null?"--":`${durableRate}%`}</b></div><div class="careResponseKpi"><span>CONFIDENCE</span><b>${confidence}</b></div></div>${next}${categoryTop?`<h3>CARE TYPE RESPONSE</h3>${categoryTop}`:""}${top?`<h3>反応しやすいCARE PROTOCOL TOP3</h3>${top}`:""}${bad?`<h3>注意プロトコル</h3>${bad}`:""}<div class="careProfileNote">直後反応と翌日反応を分離します。CARE TYPE RESPONSEは、そのカテゴリを含むセッションへの反応であり単独効果の断定ではありません。同一セッションで複数CAREを実施した場合は組み合わせ全体として評価し、切り分ける場合は1変数ずつ比較します。</div>`;
}
// V26.5.0 MEDICAL REFERRAL GATE
function careDateDiffDays(a,b){
  if(!a||!b)return null;const x=new Date(a+"T00:00:00"),y=new Date(b+"T00:00:00");if(!Number.isFinite(x.getTime())||!Number.isFinite(y.getTime()))return null;return Math.round((y-x)/86400000);
}
function careRecentAreaRows(area,days=28){
  const min=new Date();min.setHours(0,0,0,0);min.setDate(min.getDate()-Math.max(0,days-1));
  return (m()?.selfCare||[]).filter(x=>x.area===area&&x.date&&new Date(x.date+"T00:00:00")>=min).slice().sort((a,b)=>String(a.savedAt||a.date||"").localeCompare(String(b.savedAt||b.date||"")));
}
function careReferralGate(areaOverride=null){
  const area=areaOverride||document.getElementById("careArea")?.value||"lowback";
  const rows=careRecentAreaRows(area,28),savedLatest=rows.at(-1)||null;
  const live=(currentCareAssessment&&currentCareAssessment.area===area)?currentCareAssessment:null;
  const x=live||savedLatest||{area,date:today(),painBefore:Number(document.getElementById("carePainBefore")?.value||0),location:document.getElementById("careLocation")?.value||"",movement:document.getElementById("careMovement")?.value||"",trigger:document.getElementById("careTrigger")?.value||"unknown",flags:[...document.querySelectorAll('.careFlag:checked')].map(v=>Number(v.value)),onsetDate:document.getElementById("careOnsetDate")?.value||"",symptomNote:(document.getElementById("careSymptomNote")?.value||"").trim()};
  const fm=careFollowupMetrics(x),painNow=Number(x.followup24h?.pain??x.painAfter??x.painBefore??0),moveNow=x.followup24h?.movement??x.movementAfter??x.movementBefore;
  const flags=Array.isArray(x.flags)?x.flags:[],red=!!(x.result==="medical"||flags.length),highPain=!!(x.result==="stop"||painNow>=7),rebound=!!fm.rebound;
  const poorRecent=rows.filter(r=>{const rr=careResponseFromRow(r),ff=careFollowupMetrics(r);return rr.worsened||(!rr.improved&&Number(r.painAfter??r.painBefore)>=4)||ff.rebound;}).length;
  const repeat=rows.length,onset=x.onsetDate||document.getElementById("careOnsetDate")?.value||"",duration=careDateDiffDays(onset,today());
  const persistent=duration!=null&&duration>=14,noImmediateImprove=x.painAfter!=null&&Number(x.painAfter)>=Number(x.painBefore||0),functional=moveNow!=null&&Number(moveNow)>=7;
  const decision=careAromDecision(area,x.movement||"",painNow),romPersistent=repeat>=2&&["PASSIVE_LIMIT","ACTIVE_PASSIVE_GAP","AROM_LOW_PROM_UNKNOWN"].includes(decision.code);
  const reasons=[];let level="GREEN",title="セルフケア継続候補",action="CARE継続＋再評価";
  if(red){level="RED";title="セルフケア中止｜速やかな医療評価";action="トレーニング・セルフケアを中止し、症状に応じた医療評価を優先";reasons.push("危険サイン / 外傷条件に該当");}
  else if(highPain||(x.trigger==="trauma"&&painNow>=4)||(rebound&&painNow>=5)||functional){level="ORANGE";title="医療評価を推奨";action="高負荷を止め、早めに医療機関で評価";if(highPain)reasons.push(`痛み ${painNow}/10`);if(x.trigger==="trauma")reasons.push("外傷をきっかけに発症");if(rebound)reasons.push("翌日戻り / 悪化");if(functional)reasons.push("日常/目的動作の支障が大きい");}
  else if(painNow>=4||persistent||repeat>=2||poorRecent>=2||rebound||noImmediateImprove||romPersistent){level="YELLOW";title="経過観察＋受診候補";action="CARE反応を追跡し、改善しない/反復する場合は医療評価へ";if(painNow>=4)reasons.push(`痛み ${painNow}/10`);if(persistent)reasons.push(`発症から約${duration}日`);if(repeat>=2)reasons.push(`28日以内に同部位CARE ${repeat}回`);if(poorRecent>=2)reasons.push(`反応不十分/悪化 ${poorRecent}回`);if(rebound)reasons.push("翌日戻り / 悪化");if(noImmediateImprove)reasons.push("直後改善なし");if(romPersistent)reasons.push(`AROM/PROM制約が反復（${decision.title}）`);}
  else {if(x.painAfter!=null&&Number(x.painAfter)<Number(x.painBefore||0))reasons.push(`直後改善 ${x.painBefore}→${x.painAfter}/10`);else reasons.push("強い警告条件なし");if(fm.durable)reasons.push("翌日改善維持");}
  return {level,title,action,reasons,area,areaLabel:CARE_AREA_LABELS[area]||area,row:x,painNow,repeat,poorRecent,duration,decision};
}
function medicalCurrentGuidanceStates(){
  const rows=(m()?.medicalReferrals||[]).filter(x=>x.kind==="feedback"&&x.trainingStatus&&x.trainingStatus!=="unknown").slice().sort((a,b)=>String(a.savedAt||a.visitDate||"").localeCompare(String(b.savedAt||b.visitDate||"")));
  const states=new Map();for(const x of rows){const key=(x.trainingStatus==="stop_all"||x.area==="all")?"all":(x.area||"unknown");states.set(key,x)}return [...states.values()];
}
function latestMedicalGuidance(){const rows=(m()?.medicalReferrals||[]).filter(x=>x.kind==="feedback"&&x.trainingStatus&&x.trainingStatus!=="unknown").slice().sort((a,b)=>String(a.savedAt||a.visitDate||"").localeCompare(String(b.savedAt||b.visitDate||"")));return rows.at(-1)||null;}
function activeMedicalGuidance(){return medicalCurrentGuidanceStates().filter(x=>["stop_all","stop_area","modified"].includes(x.trainingStatus)).sort((a,b)=>String(a.savedAt||a.visitDate||"").localeCompare(String(b.savedAt||b.visitDate||""))).at(-1)||null;}
function medicalGuidanceAffectsPart(g,part){
  if(!g||g.trainingStatus==="cleared"||g.trainingStatus==="unknown")return false;if(g.trainingStatus==="stop_all"||g.area==="all")return true;const rule=CARE_SMART_RULES[g.area]||{conflicts:[]};return (rule.conflicts||[]).includes(part);
}
function medicalGuidanceForPart(part){const states=medicalCurrentGuidanceStates(),global=states.find(x=>x.area==="all"||x.trainingStatus==="stop_all");if(global&&global.trainingStatus!=="cleared")return global;const hits=states.filter(x=>medicalGuidanceAffectsPart(x,part));return hits.sort((a,b)=>String(a.savedAt||a.visitDate||"").localeCompare(String(b.savedAt||b.visitDate||""))).at(-1)||null;}
function medicalTrainingStatusLabel(v){return ({stop_all:"全身トレーニング中止",stop_area:"該当部位の負荷中止",modified:"該当部位は医療指示の範囲で調整",cleared:"トレーニング再開可",unknown:"指示未入力"})[v]||v||"--"}
function renderCareReferralGate(){
  const box=document.getElementById("careReferralGate");if(!box||!m())return;const g=careReferralGate(),cls=g.level.toLowerCase(),guidance=latestMedicalGuidance();
  const med=guidance?`<div class="notice ${guidance.trainingStatus.startsWith("stop")?"bad":guidance.trainingStatus==="cleared"?"ok":"warn"}" style="margin-top:8px"><b>最新の医療機関からの運動指示</b><br>${esc(guidance.visitDate||"")}｜${esc(guidance.facility||"医療機関名未入力")}｜${esc(medicalTrainingStatusLabel(guidance.trainingStatus))}${guidance.recheckDate?`｜再評価 ${esc(guidance.recheckDate)}`:""}${guidance.instructions?`<br>${esc(guidance.instructions)}`:""}</div>`:"";
  box.innerHTML=`<div class="medicalGate ${cls}"><div class="medicalGateHead"><div><div class="medicalGateTitle">${esc(g.level)}｜${esc(g.title)}</div><div class="medicalGateReason">${esc(g.areaLabel)}｜${esc(g.row.location||"")}｜${esc(g.row.movement||"")}<br>${esc(g.action)}</div></div><span class="badge ${g.level==="GREEN"?"ok":g.level==="RED"?"bad":"warn"}">${esc(g.level)}</span></div><div class="medicalGateReason"><b>判定理由</b>：${esc(g.reasons.join("｜")||"データ不足")}<br><span class="muted">※ 安全分岐・情報整理用。診断や傷病名の推定ではありません。</span></div></div>${med}`;
  const areaSel=document.getElementById("medicalArea");if(areaSel&&!areaSel.dataset.userChanged)areaSel.value=g.area;renderMedicalFeedbackHistory();
}
function careReferralSummaryText(){
  if(!m())return "";const g=careReferralGate(),x=g.row,p=m().profile||{},f=x.followup24h||null,ar=careLatestArom(g.area,x.movement||"");
  const flagTexts=(x.flags||[]).map(i=>CARE_FLAGS[g.area]?.[Number(i)]).filter(Boolean);const same=careRecentAreaRows(g.area,28).slice(-3);
  const shr=g.area==="shoulder"?(m().shrAssessments||[]).slice().sort((a,b)=>String(a.savedAt||a.date||"").localeCompare(String(b.savedAt||b.date||""))).at(-1):null;
  const moveType=g.area==="shoulder"||g.area==="neck"?"overhead_front":g.area==="lowback"?"hinge_side":g.area==="knee"?"sls_front":null;const mv=moveType?latestMovement(moveType):null;
  const min14=new Date();min14.setHours(0,0,0,0);min14.setDate(min14.getDate()-13);const tr=(m().training||[]).filter(r=>r.date&&new Date(r.date+"T00:00:00")>=min14).slice(-8);
  const line=[];line.push("S.u.G OSAKA｜MEDICAL REFERRAL SUMMARY",`作成：${new Date().toLocaleString("ja-JP")}`,`会員：${p.name||"会員"}`,"");
  line.push(`REFERRAL GATE：${g.level}｜${g.title}`,`理由：${g.reasons.join("｜")||"データ不足"}`,"");
  line.push("【症状・経過】",`部位：${g.areaLabel}${x.location?`｜場所：${x.location}`:""}${x.movement?`｜痛む/困る動作：${x.movement}`:""}`,`発症日：${x.onsetDate||"未入力"}${g.duration!=null?`（約${g.duration}日）`:""}`,`きっかけ：${x.trigger||"unknown"}`,`症状メモ：${x.symptomNote||"未入力"}`,`痛み：BEFORE ${x.painBefore??"--"}/10 → AFTER ${x.painAfter??"--"}/10${f?.pain!=null?` → 24H ${f.pain}/10`:""}`,`動作つらさ：${x.movementBefore??"--"} → ${x.movementAfter??"--"}${f?.movement!=null?` → 24H ${f.movement}`:""}`);
  if(flagTexts.length)line.push(`警告項目：${flagTexts.join("｜")}`);line.push("");
  line.push("【ROM / 動作評価】");if(x.romTest||x.romBefore!=null)line.push(`${x.romTest||"CARE ROM"}：${x.romBefore??"--"}° → ${x.romAfter??"--"}°${f?.rom!=null?` → 24H ${f.rom}°`:""}`);if(ar)line.push(`最新AROM/PROM：${ar.date||""}｜${AROM_REFERENCE[ar.key]?.label||ar.key}｜AROM ${Number(ar.active).toFixed(0)}°${ar.passive==null?"":` / PROM ${Number(ar.passive).toFixed(0)}°`}｜痛み ${Number(ar.pain||0)}/10`);else line.push("最新AROM/PROM：同部位データなし");if(shr)line.push(`最新SHR：${shr.date||""}｜挙上 ${Number(shr.arm||0).toFixed(0)}°｜肩甲骨上方回旋量 ${Number(shr.scap||0).toFixed(0)}°｜痛み ${Number(shr.pain||0)}/10`);if(mv)line.push(`最新動作スクリーン：${mv.date||""}｜${moveLabel(mv.type)}｜${mv.summary||""}`);line.push("");
  line.push("【実施CARE / 反応】");if(same.length)same.forEach(r=>{const ints=(r.interventions||[]).map(v=>`${v.category||careClassifyIntervention(v.label||"").category}:${v.label||v.id}`).join("＋")||"未記録";const ff=careFollowupMetrics(r);line.push(`${r.date}｜${ints}｜痛み ${r.painBefore??"--"}→${r.painAfter??"--"}${ff.available?`｜24H ${r.followup24h?.pain??"--"}（${ff.rebound?"戻り/悪化":ff.durable?"改善維持":"フォロー済"}）`:""}`)});else line.push("同部位CARE履歴なし");line.push("");
  line.push("【直近14日のトレーニング】");if(tr.length)tr.forEach(r=>line.push(`${r.date}｜${r.exercise}｜${r.part||""}｜${r.sets||0}SET × ${r.reps||0}REP｜RIR ${r.rir??"--"}`));else line.push("記録なし");line.push("");
  if(p.notes)line.push("【S.u.G会員情報の注意事項 / 既往歴メモ】",p.notes,"");line.push("【S.u.G側の位置づけ】","本書は運動・CARE経過の情報共有用です。S.u.Gでは診断、傷病名の推定、医療行為の指示を行っていません。医療機関での評価・指示を優先してください。");return line.join("\n");
}
function generateReferralSummary(){const ta=document.getElementById("careReferralSummary");if(!ta)return;ta.value=careReferralSummaryText();renderCareReferralGate();}
async function copyReferralSummary(){let ta=document.getElementById("careReferralSummary");if(!ta)return;if(!ta.value)generateReferralSummary();try{await navigator.clipboard.writeText(ta.value);alert("紹介サマリーをコピーしました");}catch(_e){ta.focus();ta.select();document.execCommand("copy");alert("紹介サマリーをコピーしました");}}
function downloadReferralSummary(){const ta=document.getElementById("careReferralSummary");if(!ta)return;if(!ta.value)generateReferralSummary();const b=new Blob([ta.value],{type:"text/plain;charset=utf-8"}),a=document.createElement("a"),u=URL.createObjectURL(b);a.href=u;a.download=`SUG_REFERRAL_${safeFilePart(m()?.profile?.name||"member")}_${today()}.txt`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function saveReferralRecord(){if(!m())return;const text=careReferralSummaryText(),g=careReferralGate();m().medicalReferrals=m().medicalReferrals||[];m().medicalReferrals.push({kind:"referral",date:today(),area:g.area,gate:g.level,title:g.title,reasons:g.reasons,summary:text,savedAt:new Date().toISOString()});const ta=document.getElementById("careReferralSummary");if(ta)ta.value=text;persist();renderMedicalFeedbackHistory();alert("紹介記録を保存しました");}
function saveMedicalFeedback(){if(!m())return;const visitDate=document.getElementById("medicalVisitDate")?.value||today(),area=document.getElementById("medicalArea")?.value||document.getElementById("careArea")?.value||"lowback",trainingStatus=document.getElementById("medicalTrainingStatus")?.value||"unknown";const row={kind:"feedback",visitDate,date:visitDate,area:trainingStatus==="stop_all"?"all":area,facility:(document.getElementById("medicalFacility")?.value||"").trim(),trainingStatus,recheckDate:document.getElementById("medicalRecheckDate")?.value||"",allowed:(document.getElementById("medicalAllowed")?.value||"").trim(),instructions:(document.getElementById("medicalInstructions")?.value||"").trim(),savedAt:new Date().toISOString()};if(trainingStatus==="unknown"&&!row.instructions&&!row.allowed)return alert("医療機関からの指示または運動・負荷指示を入力してください");m().medicalReferrals=m().medicalReferrals||[];m().medicalReferrals.push(row);persist();renderMedicalFeedbackHistory();renderCareReferralGate();renderNextLoadPanel();renderIntegratedAssessment();alert("受診後フィードバックを保存しました");}
function renderMedicalFeedbackHistory(){const box=document.getElementById("medicalFeedbackHistory");if(!box||!m())return;const rows=m().medicalReferrals||[];box.innerHTML=[...rows].reverse().slice(0,12).map((x,ri)=>{const i=rows.length-1-ri;if(x.kind==="referral")return `<div class="medicalHistoryItem"><div class="row"><div><strong>${esc(x.date||"")}｜紹介記録｜${esc(x.gate||"")} ${esc(x.title||"")}</strong><br><small>${esc((x.reasons||[]).join("｜"))}</small></div><button class="danger" onclick="remove('medicalReferrals',${i})">削除</button></div></div>`;const cls=x.trainingStatus?.startsWith("stop")?"stop":x.trainingStatus==="cleared"?"clear":"";return `<div class="medicalHistoryItem medicalInstruction ${cls}"><div class="row"><div><strong>${esc(x.visitDate||x.date||"")}｜${esc(x.facility||"医療機関")}</strong><br><small>${esc(x.area==="all"?"全身":(CARE_AREA_LABELS[x.area]||x.area||""))}｜${esc(medicalTrainingStatusLabel(x.trainingStatus))}${x.recheckDate?`｜再評価 ${esc(x.recheckDate)}`:""}${x.allowed?`<br>許可：${esc(x.allowed)}`:""}${x.instructions?`<br>指示：${esc(x.instructions)}`:""}</small></div><button class="danger" onclick="remove('medicalReferrals',${i})">削除</button></div></div>`}).join("")||'<span class="muted">紹介・受診記録なし</span>';}

function renderCareHistory(){
  const box=document.getElementById("careHistory");if(!box||!m())return;
  box.innerHTML=[...(m().selfCare||[])].reverse().slice(0,20).map((x,ri)=>{
    const i=m().selfCare.length-1-ri,area=CARE_AREA_LABELS[x.area]||x.area||"部位";
    const context=[x.location,x.movement].filter(Boolean).map(esc).join("｜"),ints=Array.isArray(x.interventions)?x.interventions:[],resp=careResponseFromRow(x),extra=[];
    if(x.romBefore!=null&&x.romAfter!=null)extra.push(`${esc(x.romTest||"ROM")} ${Number(x.romBefore).toFixed(0)}°→${Number(x.romAfter).toFixed(0)}°`);if(x.movementBefore!=null&&x.movementAfter!=null)extra.push(`動作つらさ ${Number(x.movementBefore).toFixed(0)}→${Number(x.movementAfter).toFixed(0)}`);
    const f=x.followup24h,fm=careFollowupMetrics(x);if(f)extra.push(`翌日 ${esc(f.date||"")}｜痛み ${Number(f.pain).toFixed(0)}/10${f.rom!=null?`｜ROM ${Number(f.rom).toFixed(0)}°`:""}${fm.durable?"｜改善維持":fm.rebound?"｜戻り/悪化":"｜フォロー済み"}`);
    return `<div class="item"><div class="row"><div><strong>${esc(x.date)}｜${esc(area)}</strong>${context?`<br><small>${context}</small>`:""}<br><small>BEFORE ${x.painBefore}/10 → AFTER ${x.painAfter??'--'}/10｜${x.result==='medical'?'医療評価優先':x.result==='stop'?'高負荷中止':'セルフケア'}</small>${x.hypothesis?`<br><small>仮説候補：${esc(x.hypothesis)}</small>`:""}${x.careDecision?`<br><small>AROM/PROM DECISION：${esc(x.careDecision.title||x.careDecision.code||"")}</small>`:""}${x.acuteDecision?`<br><small>ACUTE CARE：${esc(x.acuteDecision.title||x.acuteDecision.code||"")}${x.acuteDecision.protocol?`｜${esc(x.acuteDecision.protocol)}`:""}</small>`:""}${x.thermalDecision?`<br><small>THERMAL CARE：${esc(x.thermalDecision.title||x.thermalDecision.code||"")}｜${esc(x.thermalDecision.duration||"--")}</small>`:""}${ints.length?`<br><small>CARE：${ints.map(v=>`${esc(v.category||careClassifyIntervention(v.label||"").category)} / ${esc(v.tool||"")}｜${esc(v.label||v.id)}`).join(" ＋ ")}</small>`:""}${extra.length?`<br><small>${extra.join("｜")}</small>`:""}</div><button class="danger" onclick="remove('selfCare',${i})">削除</button></div></div>`
  }).join("")||'<span class="muted">履歴なし</span>';
}


let currentAromResult=null;

const AROM_REFERENCE={
  cervical_flex:{
    label:"頸椎｜屈曲", ideal:[50,70], warn:[40,80], ref:"学会参考可動域 60°｜S.u.G比較帯 50〜70°",
    function:"下を見る・デスクワーク・頸部の前方運動",
    factors:"頸椎分節運動、後頸部軟部組織、胸椎姿勢、痛み・防御性収縮",
    methodNote:"原則として腰かけ座位。頭部・体幹側面から測定。"
  },
  cervical_ext:{
    label:"頸椎｜伸展", ideal:[40,60], warn:[30,70], ref:"学会参考可動域 50°｜S.u.G比較帯 40〜60°",
    function:"上を見る・オーバーヘッド視線・頸部後方運動",
    factors:"頸椎分節運動、前頸部軟部組織、胸椎伸展、痛み・めまい等の症状",
    methodNote:"原則として腰かけ座位。頭部・体幹側面から測定。"
  },
  cervical_rot:{
    label:"頸椎｜回旋", ideal:[50,70], warn:[40,80], ref:"学会参考可動域 60°｜S.u.G比較帯 50〜70°",
    function:"左右を振り向く・運転時の後方確認・スポーツ視線",
    factors:"頸椎回旋、胸椎回旋代償、頸部筋群、痛み・防御性収縮",
    methodNote:"腰かけ座位。肩の回旋が混ざらないように同一条件で左右比較。"
  },
  cervical_lat:{
    label:"頸椎｜側屈", ideal:[40,60], warn:[30,70], ref:"学会参考可動域 50°｜S.u.G比較帯 40〜60°",
    function:"頭部の側方運動・片側荷重時の頸部制御",
    factors:"頸椎分節運動、僧帽筋上部・斜角筋群など、胸椎/肩甲帯姿勢、痛み",
    methodNote:"腰かけ座位。体幹側屈を混ぜずに左右比較。"
  },
  knee_flex:{
    label:"膝｜屈曲", ideal:[130,145], warn:[120,155], ref:"S.u.G参考帯 130〜145°",
    function:"深いしゃがみ・階段・正座/膝を深く曲げる動作",
    factors:"膝関節そのもの、前ももの軟部組織、腫れ・痛み、ハムストリングスの自動運動など"
  },
  knee_ext:{
    label:"膝｜伸展", ideal:[-5,5], warn:[-10,10], ref:"S.u.G参考帯 -5〜+5°（0°＝伸び切り）",
    function:"立位・歩行・階段・スクワット終末域での膝伸展",
    factors:"大腿四頭筋の出力/抑制、ハムストリングス・腓腹筋など後方組織、関節・腫れ・痛み"
  },
  ankle_df:{
    label:"足関節｜背屈", ideal:[10,20], warn:[5,25], ref:"S.u.G参考帯 10〜20°",
    function:"スクワット深度・階段・歩行で膝を前へ運ぶ動作",
    factors:"腓腹筋・ヒラメ筋、足関節前後の滑走、痛み・腫れ、荷重時の運動制御"
  },
  ankle_pf:{
    label:"足関節｜底屈", ideal:[40,55], warn:[30,60], ref:"S.u.G参考帯 40〜55°",
    function:"歩行の蹴り出し・カーフレイズ・走行/ジャンプ",
    factors:"下腿三頭筋の出力、前方組織の制限、足関節の痛み・腫れ"
  },
  hip_abd:{
    label:"股関節｜外転", ideal:[35,55], warn:[25,65], ref:"学会参考可動域 45°｜S.u.G比較帯 35〜55°",
    function:"片脚支持・ランジ・骨盤の側方安定・サイドステップ",
    factors:"股関節、内転筋群、臀筋群の運動制御、骨盤代償、痛み",
    methodNote:"背臥位で骨盤を固定し、下肢の外旋を混ぜない。"
  },
  hip_add:{
    label:"股関節｜内転", ideal:[10,30], warn:[0,40], ref:"学会参考可動域 20°｜S.u.G比較帯 10〜30°",
    function:"脚を身体中心へ寄せる・切り返し・片脚支持時の骨盤制御",
    factors:"股関節、外側組織、臀筋群/内転筋群、骨盤代償、痛み",
    methodNote:"背臥位で骨盤を固定。反対側下肢を避けて測定。"
  },
  hip_er:{
    label:"股関節｜外旋", ideal:[35,55], warn:[25,65], ref:"学会参考可動域 45°｜S.u.G比較帯 35〜55°",
    function:"スクワット/ランジでの股関節回旋・あぐら・方向転換",
    factors:"股関節、内旋筋/外旋筋群、後方/前方組織、骨盤代償、痛み",
    methodNote:"股関節・膝関節90°屈曲位。骨盤の代償を少なくして測定。"
  },
  hip_ir:{
    label:"股関節｜内旋", ideal:[35,55], warn:[25,65], ref:"学会参考可動域 45°｜S.u.G比較帯 35〜55°",
    function:"歩行・ランニング・スクワット/片脚動作での骨盤/大腿回旋",
    factors:"股関節、外旋筋群/後方組織、骨盤代償、痛み",
    methodNote:"股関節・膝関節90°屈曲位。骨盤の代償を少なくして測定。"
  },
  hip_flex:{
    label:"股関節｜屈曲", ideal:[110,125], warn:[100,135], ref:"S.u.G参考帯 110〜125°",
    function:"スクワット・階段・座位・ニーアップ",
    factors:"股関節、臀部/後方組織、骨盤運動、痛み、股関節屈筋群の自動運動"
  },
  hip_ext:{
    label:"股関節｜伸展", ideal:[10,20], warn:[5,25], ref:"S.u.G参考帯 10〜20°",
    function:"歩行の後方脚・ランニング・ヒップヒンジ終末域",
    factors:"腸腰筋・大腿直筋など前方組織、臀筋群の出力、骨盤前傾代償、前方痛"
  },
  shoulder_ext:{
    label:"肩｜伸展", ideal:[40,60], warn:[30,70], ref:"学会参考可動域 50°｜S.u.G比較帯 40〜60°",
    function:"腕を後方へ引く・ローイング終末・歩行時の上肢後方振り",
    factors:"肩前方組織、上腕二頭筋長頭、胸筋群、肩甲骨運動、痛み",
    methodNote:"体幹が前傾しないよう固定して測定。"
  },
  shoulder_er:{
    label:"肩｜外旋", ideal:[50,70], warn:[40,80], ref:"学会参考可動域 60°｜S.u.G比較帯 50〜70°",
    function:"オーバーヘッド・プレス/投球準備・肩甲面での上肢挙上",
    factors:"腱板外旋筋群、肩前方組織、肩甲骨、胸椎、痛み",
    methodNote:"学会基本肢位：上腕を体幹に接し、肘90°屈曲。前腕中間位。"
  },
  shoulder_ir:{
    label:"肩｜内旋", ideal:[70,90], warn:[60,100], ref:"学会参考可動域 80°｜S.u.G比較帯 70〜90°",
    function:"背中へ手を回す・プレス/ロー動作での上腕骨回旋制御",
    factors:"腱板・後方関節包/後方組織、広背筋/大円筋、肩甲骨、痛み",
    methodNote:"学会基本肢位：上腕を体幹に接し、肘90°屈曲。前腕中間位。"
  },
  shoulder_hflex:{
    label:"肩｜水平屈曲", ideal:[125,145], warn:[115,155], ref:"学会参考可動域 135°｜S.u.G比較帯 125〜145°",
    function:"胸前で腕を横切らせる・プレス/抱える動作",
    factors:"肩後方組織、肩甲骨外転、胸郭、痛み",
    methodNote:"肩関節90°外転位で測定。"
  },
  shoulder_hext:{
    label:"肩｜水平伸展", ideal:[20,40], warn:[10,50], ref:"学会参考可動域 30°｜S.u.G比較帯 20〜40°",
    function:"リアデルト・水平外転・腕を後方へ開く動作",
    factors:"胸筋群、肩前方組織、肩甲骨内転/後傾、胸椎、痛み",
    methodNote:"肩関節90°外転位で測定。"
  },
  shoulder_flex:{
    label:"肩｜屈曲", ideal:[160,180], warn:[150,185], ref:"S.u.G参考帯 160〜180°",
    function:"オーバーヘッド動作・ショルダープレス・物を上へ取る動作",
    factors:"肩甲骨上方回旋、胸椎伸展、広背筋/胸郭、三角筋・腱板の出力、痛み"
  },
  shoulder_abd:{
    label:"肩｜外転", ideal:[160,180], warn:[150,185], ref:"S.u.G参考帯 160〜180°",
    function:"サイドレイズ・オーバーヘッド・衣服の着脱",
    factors:"肩甲骨上方回旋、腱板/三角筋、胸郭・肩周囲軟部組織、痛み"
  },
  thoracic_rot:{
    label:"胸椎｜回旋", ideal:[30,52], warn:[20,60], ref:"Lumbar-locked参考：研究平均 約40.8°。測定法を固定して左右・前回比較",
    function:"歩行・投球・ゴルフ/回旋動作・肩の挙上時の胸郭協調",
    factors:"胸椎/肋椎関節の可動性、胸郭、広背筋・腹斜筋群、痛み、骨盤/腰椎の代償",
    method:"lumbar_locked"
  },
  thoracic_flex:{
    label:"胸椎｜屈曲", ideal:[0,999], warn:[0,999], hasNorm:false, ref:"測定法依存。若年成人研究では立位基準の平均 約11.5°。同一方法で前回比較を優先",
    function:"丸める動作・前方リーチ・呼吸時の胸郭運動",
    factors:"胸椎分節運動、脊柱起立筋群、胸郭、腰椎/骨盤の代償、痛み"
  },
  thoracic_ext:{
    label:"胸椎｜伸展", ideal:[0,999], warn:[0,999], hasNorm:false, ref:"測定法依存。若年成人研究では立位基準の平均 約8.7°。同一方法で前回比較を優先",
    function:"オーバーヘッド・スクワット上肢挙上・肩甲骨後傾/上方回旋を伴う動作",
    factors:"胸椎分節運動、胸郭、腹直筋/広背筋など前方・側方組織、腰椎伸展代償、痛み"
  },
  thoracic_lat:{
    label:"胸椎｜側屈", ideal:[0,999], warn:[0,999], hasNorm:false, ref:"測定法依存。絶対値より左右差・前回差を優先",
    function:"側方リーチ・歩行/ランニング時の体幹制御・片側オーバーヘッド",
    factors:"胸椎/肋骨、広背筋・腹斜筋群・脊柱起立筋群、骨盤/腰椎代償、痛み"
  },
  forearm_pron:{
    label:"前腕｜回内", ideal:[80,100], warn:[70,110], ref:"学会参考可動域 90°｜S.u.G比較帯 80〜100°",
    function:"手のひらを下へ向ける・プッシュ/グリップ・日常の手作業",
    factors:"橈尺関節、前腕回内筋群、肩の代償、痛み",
    methodNote:"肘90°屈曲。肩の回旋を混ぜずに測定。"
  },
  forearm_sup:{
    label:"前腕｜回外", ideal:[80,100], warn:[70,110], ref:"学会参考可動域 90°｜S.u.G比較帯 80〜100°",
    function:"手のひらを上へ向ける・カール/持ち上げ・日常の手作業",
    factors:"橈尺関節、上腕二頭筋/回外筋、肩の代償、痛み",
    methodNote:"肘90°屈曲。肩の回旋を混ぜずに測定。"
  },
  wrist_radial:{
    label:"手関節｜橈屈", ideal:[15,35], warn:[5,45], ref:"学会参考可動域 25°｜S.u.G比較帯 15〜35°",
    function:"グリップ・ラケット/クラブ・手首の側方制御",
    factors:"手関節、前腕筋群、尺側/橈側軟部組織、痛み",
    methodNote:"前腕回内位。第3中手骨を移動軸として測定。"
  },
  wrist_ulnar:{
    label:"手関節｜尺屈", ideal:[45,65], warn:[35,75], ref:"学会参考可動域 55°｜S.u.G比較帯 45〜65°",
    function:"グリップ・手作業・ラケット/クラブ操作",
    factors:"手関節、前腕筋群、橈側/尺側軟部組織、痛み",
    methodNote:"前腕回内位。第3中手骨を移動軸として測定。"
  },
  foot_inv:{
    label:"足部｜内がえし", ideal:[20,40], warn:[10,50], ref:"学会参考可動域 30°｜S.u.G比較帯 20〜40°",
    function:"接地時の足部適応・片脚バランス・方向転換",
    factors:"足関節/足部、腓骨筋群、後脛骨筋等、痛み・腫れ",
    methodNote:"2022年改訂用語：内がえし＝前額面で足底が内方を向く運動。"
  },
  foot_ev:{
    label:"足部｜外がえし", ideal:[10,30], warn:[0,40], ref:"学会参考可動域 20°｜S.u.G比較帯 10〜30°",
    function:"接地時の足部適応・片脚バランス・方向転換",
    factors:"足関節/足部、後脛骨筋/腓骨筋群など、痛み・腫れ",
    methodNote:"2022年改訂用語：外がえし＝前額面で足底が外方を向く運動。"
  },
  elbow_flex:{
    label:"肘｜屈曲", ideal:[135,150], warn:[125,155], ref:"S.u.G参考帯 135〜150°",
    function:"引く動作・食事・持ち上げ・カール",
    factors:"上腕二頭筋/上腕筋の出力、肘関節、前後の軟部組織、痛み・腫れ"
  },
  elbow_ext:{
    label:"肘｜伸展", ideal:[-5,5], warn:[-10,10], ref:"S.u.G参考帯 -5〜+5°（0°＝伸び切り）",
    function:"プレス・押す動作・腕を伸ばして物を取る動作",
    factors:"上腕三頭筋の出力、肘関節、屈筋群/前方組織、痛み・腫れ"
  },
  wrist_flex:{
    label:"手関節｜掌屈", ideal:[70,85], warn:[60,90], ref:"S.u.G参考帯 70〜85°",
    function:"グリップ・手作業・手首を曲げる動作",
    factors:"前腕屈筋群、手関節、伸筋側軟部組織、痛み"
  },
  wrist_ext:{
    label:"手関節｜背屈", ideal:[60,75], warn:[50,85], ref:"S.u.G参考帯 60〜75°",
    function:"プッシュアップ・ベンチ/プレスでの手首保持・床へ手をつく動作",
    factors:"前腕伸筋群、手関節、屈筋側軟部組織、痛み"
  }
};

function aromBand(v, ref){
  return window.SuGRomCare.aromBand(v,ref);
}
function aromGapThreshold(key){
  return window.SuGRomCare.aromGapThreshold(key);
}
function renderAromReference(){
  const key=document.getElementById("aromMovement")?.value||"knee_flex";
  const ref=AROM_REFERENCE[key],box=document.getElementById("aromReference");
  if(box&&ref)box.innerHTML=`<b>${esc(ref.label)}</b>｜${esc(ref.ref)}<br><small>機能例：${esc(ref.function)}</small>${ref.methodNote?`<br><small>測定：${esc(ref.methodNote)}</small>`:""}<br><small>※ 学会値は「正常値」ではなく参考可動域。S.u.G比較帯は経時・左右比較の運用帯です。</small>`;
}
function findAromOpposite(date,key,side){
  const rows=m()?.aromAssessments||[];
  const opposite=side==="right"?"left":"right";
  return [...rows].reverse().find(x=>x.date===date && x.key===key && x.side===opposite) || null;
}
function findAromPrevious(key,side,date){
  const rows=m()?.aromAssessments||[];
  return [...rows].reverse().find(x=>x.key===key && x.side===side && x.date<date) || null;
}
function analyzeAromProm(){
  if(!m())return;
  const key=document.getElementById("aromMovement")?.value||"knee_flex";
  const ref=AROM_REFERENCE[key];
  const activeEl=document.getElementById("aromActive"),passiveEl=document.getElementById("aromPassive");
  if(!activeEl || activeEl.value==="")return alert("AROMを入力してください");
  const active=Number(activeEl.value);
  const passive=(passiveEl && passiveEl.value!=="")?Number(passiveEl.value):null;
  const pain=Math.max(0,Math.min(10,Number(document.getElementById("aromPain")?.value||0)));
  const side=document.getElementById("aromSide")?.value||"right";
  const date=document.getElementById("aromDate")?.value||today();
  const memo=document.getElementById("aromMemo")?.value||"";
  const opposite=findAromOpposite(date,key,side);
  const previous=findAromPrevious(key,side,date);
  const ab=aromBand(active,ref),pb=aromBand(passive,ref);
  const gap=passive==null?null:passive-active;
  const gapTh=aromGapThreshold(key);

  let pattern="",next="",tone="notice";
  const normed=ref.hasNorm!==false;
  const activeLow=normed && active<ref.ideal[0];
  const passiveLow=normed && passive!=null && passive<ref.ideal[0];

  if(pain>=4){
    pattern="痛みで可動が制限されている可能性。数値改善を優先して無理に終末域へ押し込まない。";
    next="CAREの痛み評価と併用し、症状が強い/増える場合は医療評価を優先。";
    tone="smartWarn";
  }else if(!normed){
    if(passive!=null && Math.abs(passive-active)>=gapTh){
      pattern=`この胸椎動作は測定法による差が大きいため絶対値で正常/異常を断定しない。PROMとAROMの差は${Math.abs(passive-active).toFixed(0)}°。`;
      next="同じ測定法・同じ開始姿勢で左右差と前回差を追い、肩ROM・SHR・痛みと統合。";
    }else{
      pattern="この胸椎動作は測定法による差が大きいため、絶対値より同一条件での左右差・前回差を優先。";
      next="同じ測定法・開始姿勢で再測定し、肩ROM・SHR・痛みと統合。";
      tone="smartOk";
    }
  }else if(passive==null){
    if(activeLow){
      pattern="AROMが参考帯より低い。筋出力・運動制御・痛み抑制・関節/軟部組織制限など複数の可能性があるため、PROMで切り分け候補。";
      next="次回PROMも測定し、AROMとPROMの差を確認。";
    }else{
      pattern="AROMは参考帯内。自力で使える可動域は良好な傾向。";
      next="左右差と実際の動作ROM（スクワット等）の再現性を比較。";
      tone="smartOk";
    }
  }else if(activeLow && !passiveLow && gap>=gapTh){
    pattern=`AROMよりPROMが${gap.toFixed(0)}°大きい。関節が動く余地はあるが、自力で使えていない「active-passive gap」パターン。`;
    next="筋出力・運動制御・疼痛による抑制などを候補として、軽負荷の自動運動/コントロールを確認。";
  }else if(activeLow && passiveLow){
    pattern="AROM・PROMの両方が参考帯より低い。関節/軟部組織の可動制限や痛みなどが関与するパターン候補。";
    next="強く伸ばす前に、左右差・痛み・エンドフィール・既往を確認。必要なら医療評価。";
  }else if(gap!=null && gap>=gapTh){
    pattern=`可動域自体は確保されているが、PROMがAROMより${gap.toFixed(0)}°大きい。自動運動で使い切れていない可能性。`;
    next="自動運動の再現性、筋出力、代償動作を確認。";
  }else{
    pattern="AROMとPROMの差は大きくなく、参考帯との比較でも大きな乖離は少ない。";
    next="左右差と動作ROMを継続比較。";
    tone="smartOk";
  }

  currentAromResult={
    date,key,label:ref.label,side,
    active,passive,pain,gap,aromBand:ab.text,promBand:pb.text,pattern,next,
    functionText:ref.function,factors:ref.factors,memo,
    oppositeActive:opposite?Number(opposite.active):null,
    sideDiff:opposite?active-Number(opposite.active):null,
    previousActive:previous?Number(previous.active):null,
    previousDiff:previous?active-Number(previous.active):null
  };

  const sideText=side==="right"?"右":"左",box=document.getElementById("aromResult");
  box.innerHTML=`<div class="${tone}"><b>${esc(ref.label)}｜${sideText}</b><br>${esc(ref.ref)}</div>
  <div class="aromGrid">
    <div class="aromCard"><span>AROM</span><b>${active.toFixed(0)}°</b><small class="${ab.cls}">${ab.symbol} ${esc(ab.text)}</small></div>
    <div class="aromCard"><span>PROM</span><b>${passive==null?"未測定":passive.toFixed(0)+"°"}</b><small class="${pb.cls}">${pb.symbol} ${esc(pb.text)}</small></div>
    <div class="aromCard"><span>AROM − PROM差</span><b>${gap==null?"--":gap.toFixed(0)+"°"}</b><small>${gap==null?"PROM測定で切り分け精度UP":`差 ${gapTh}°以上は自動運動の使い切りを確認候補`}</small></div>
    <div class="aromCard"><span>痛み</span><b>${pain}/10</b><small>${pain>=4?"痛み優先で評価":"可動域と合わせて評価"}</small></div>
  </div>
  <div class="aromPattern"><strong>S.u.G解釈</strong><br>${esc(pattern)}<br><br><strong>機能への影響候補</strong><br>${esc(ref.function)}<br><br><strong>関連候補</strong><br>${esc(ref.factors)}<br><br><strong>左右比較</strong><br>${opposite?`${side==="right"?"右":"左"} ${active.toFixed(0)}°｜${side==="right"?"左":"右"} ${Number(opposite.active).toFixed(0)}°｜差 ${Math.abs(active-Number(opposite.active)).toFixed(0)}°`:"反対側の同日データなし"}<br><br><strong>前回比較</strong><br>${previous?`前回 ${Number(previous.active).toFixed(0)}° → 今回 ${active.toFixed(0)}°（${active-Number(previous.active)>=0?"+":""}${(active-Number(previous.active)).toFixed(0)}°）`:"前回データなし"}<br><br><strong>次に確認</strong><br>${esc(next)}</div>
  <div class="romLegend">※ 診断ではありません。AROM/PROM差から原因筋を断定せず、痛み・左右差・動作ROM・既往歴と合わせて評価します。S.u.G参考帯はフォーム/コンディショニング比較用の初期設定です。</div>
  <button class="secondary" style="width:100%;margin-top:9px" onclick="saveAromResult()">このAROM / PROM判定を保存</button>`;
}
function saveAromResult(){
  if(!currentAromResult||!m())return alert("先にAROM / PROM判定を行ってください");
  m().aromAssessments.push({...currentAromResult,savedAt:new Date().toISOString()});
  persist();renderAromHistory();renderAromAsymmetry();renderJointByJoint();renderIntegratedAssessment();renderCareAromLink();
  alert("AROM / PROM判定を保存しました");
}

function jbjLatestArom(key,side=null){
  const rows=(m()?.aromAssessments||[]).filter(x=>x.key===key && (!side || x.side===side));
  return rows.slice().sort((a,b)=>{
    const da=String(a.savedAt||a.date||""), db=String(b.savedAt||b.date||"");
    return da.localeCompare(db);
  }).at(-1)||null;
}
function jbjLatestCare(area){
  const rows=(m()?.selfCare||[]).filter(x=>x.area===area);
  return rows.slice().sort((a,b)=>{
    const da=String(a.savedAt||a.date||""), db=String(b.savedAt||b.date||"");
    return da.localeCompare(db);
  }).at(-1)||null;
}
function jbjLatestShr(){
  const rows=m()?.shrAssessments||[];
  return rows.slice().sort((a,b)=>{
    const da=String(a.savedAt||a.date||""), db=String(b.savedAt||b.date||"");
    return da.localeCompare(db);
  }).at(-1)||null;
}
function jbjMetricLabel(key){return AROM_REFERENCE[key]?.label||key}
function jbjEvalMobility(keys){
  let evidence=[],score=0,data=0,major=false;
  keys.forEach(key=>{
    const ref=AROM_REFERENCE[key];
    ["right","left"].forEach(side=>{
      const x=jbjLatestArom(key,side);
      if(!x)return;
      data++;
      const v=Number(x.active);
      if(ref?.hasNorm===false){
        evidence.push(`${side==="right"?"右":"左"} ${jbjMetricLabel(key)} ${v.toFixed(0)}°`);
      }else if(ref){
        if(v<ref.ideal[0] || v>ref.ideal[1]){
          const severe=v<ref.warn[0] || v>ref.warn[1];
          score+=severe?35:18; major=major||severe;
          evidence.push(`${side==="right"?"右":"左"} ${jbjMetricLabel(key)} ${v.toFixed(0)}°（${severe?"参考帯外":"参考帯付近"}）`);
        }
      }
    });
    const r=jbjLatestArom(key,"right"),l=jbjLatestArom(key,"left");
    if(r&&l){
      const d=Math.abs(Number(r.active)-Number(l.active));
      if(d>=15){score+=30;major=true;evidence.push(`${jbjMetricLabel(key)} 左右差 ${d.toFixed(0)}°`)}
      else if(d>=10){score+=15;evidence.push(`${jbjMetricLabel(key)} 左右差 ${d.toFixed(0)}°`)}
    }
  });
  return {evidence,score,data,major};
}
function jbjCareState(area){
  const c=jbjLatestCare(area);
  if(!c)return {score:0,text:"",pain:null};
  const pain=c.painAfter==null?Number(c.painBefore||0):Number(c.painAfter);
  if(pain>=4)return {score:100,text:`CARE ${CARE_AREA_LABELS[area]||area} 痛み ${pain}/10`,pain};
  if(pain>=2)return {score:45,text:`CARE ${CARE_AREA_LABELS[area]||area} 痛み ${pain}/10`,pain};
  return {score:5,text:`CARE ${CARE_AREA_LABELS[area]||area} 痛み ${pain}/10`,pain};
}
function jbjStatus(score,data,stabilityWait=false){
  if(score>=90)return {label:"痛み優先",cls:"bad"};
  if(score>=45)return {label:"要確認",cls:"warn"};
  if(score>=20)return {label:"軽度確認",cls:"warn"};
  if(stabilityWait)return {label:data?"動作評価待ち":"動作評価待ち",cls:"wait"};
  if(data)return {label:"大きな乖離少",cls:"good"};
  return {label:"未測定",cls:"wait"};
}

let currentMovementResult=null;
const MOVE_LABELS={
  sls_front:"片脚スクワット｜正面",
  lunge_side:"ランジ｜側面",
  hinge_side:"ヒップヒンジ｜側面",
  overhead_front:"両腕挙上｜正面/背面"
};
function moveLabel(v){return MOVE_LABELS[v]||v}
function moveFlagHtml(label,level="info"){
  return `<span class="moveFlag ${level}">${esc(label)}</span>`;
}
function renderMoveGuide(){
  const type=document.getElementById("moveType")?.value||"sls_front";
  const box=document.getElementById("moveGuide"); if(!box)return;
  const map={
    sls_front:"<b>撮影：</b>正面から、支持脚の足〜頭まで入れる。ボトム付近を撮影。<b>評価側＝床についている支持脚側</b>を選択。膝屈曲・前額面膝偏位・骨盤傾斜・体幹側屈を確認。",
    lunge_side:"<b>撮影：</b>真横から、前脚側の肩〜足先まで入れる。ボトム付近。膝/股関節屈曲・下腿傾斜・体幹前傾を確認。",
    hinge_side:"<b>撮影：</b>真横から、ヒンジの最深部。肩〜足まで入れる。股関節屈曲・膝屈曲・体幹/下腿傾斜を確認。",
    overhead_front:"<b>撮影：</b>正面または背面から、両腕と骨盤まで入れる。両腕をできる範囲で挙上。左右挙上角差・肩ライン傾斜・体幹側屈を確認。"
  };
  box.innerHTML=map[type];
}
function saveMovementScreen(){
  if(!currentMovementResult||!m())return alert("先に動作スクリーンを解析してください");
  m().movementScreens.push({...currentMovementResult,savedAt:new Date().toISOString()});
  persist();renderMovementHistory();renderJointByJoint();renderIntegratedAssessment();
  alert("動作スクリーンを保存しました");
}
function renderMovementHistory(){
  const box=document.getElementById("moveHistory");if(!box||!m())return;
  const rows=m().movementScreens||[];
  box.innerHTML=[...rows].reverse().slice(0,30).map((x,ri)=>{
    const i=rows.length-1-ri, side=x.side==="right"?"右":"左";
    return `<div class="item"><div class="row"><div><strong>${esc(x.date)}｜${esc(moveLabel(x.type))}${x.type==="overhead_front"?"":`｜${side}`}</strong><br><small>${esc(x.summary||"")}</small></div><button class="danger" onclick="remove('movementScreens',${i})">削除</button></div></div>`;
  }).join("")||'<span class="muted">履歴なし</span>';
}
function latestMovement(type){
  const rows=(m()?.movementScreens||[]).filter(x=>x.type===type);
  return rows.slice().sort((a,b)=>String(a.savedAt||a.date||"").localeCompare(String(b.savedAt||b.date||""))).at(-1)||null;
}


let currentIntegratedAssessment=null;

const INTEGRATED_REGION_MAP={
  cervical_flex:"頸椎",cervical_ext:"頸椎",cervical_rot:"頸椎",cervical_lat:"頸椎",
  shoulder_flex:"肩関節",shoulder_ext:"肩関節",shoulder_abd:"肩関節",shoulder_er:"肩関節",shoulder_ir:"肩関節",shoulder_hflex:"肩関節",shoulder_hext:"肩関節",
  thoracic_rot:"胸椎",thoracic_flex:"胸椎",thoracic_ext:"胸椎",thoracic_lat:"胸椎",
  hip_flex:"股関節",hip_ext:"股関節",hip_abd:"股関節",hip_add:"股関節",hip_er:"股関節",hip_ir:"股関節",
  knee_flex:"膝",knee_ext:"膝",
  ankle_df:"足部・足関節",ankle_pf:"足部・足関節",foot_inv:"足部・足関節",foot_ev:"足部・足関節",
  elbow_flex:"肘・前腕",elbow_ext:"肘・前腕",forearm_pron:"肘・前腕",forearm_sup:"肘・前腕",
  wrist_flex:"手関節",wrist_ext:"手関節",wrist_radial:"手関節",wrist_ulnar:"手関節"
};
const INTEGRATED_CARE_REGION={lowback:"腰・骨盤",neck:"頸椎",shoulder:"肩・肩甲帯",knee:"膝",ankle:"足部・足関節",wrist:"手関節",elbow:"肘・前腕"};

function intLatestByDate(rows=[]){
  return rows.slice().sort((a,b)=>String(a.savedAt||a.date||"").localeCompare(String(b.savedAt||b.date||""))).at(-1)||null;
}
function intPriority(title,score,evidence,next,source,level="warn"){
  return {title,score:Number(score||0),evidence,next,source,level};
}
function intLevel(score){
  return score>=85?"bad":score>=45?"warn":"good";
}
function intLatestTrainingDate(){
  return (m()?.training||[]).slice().sort((a,b)=>a.date.localeCompare(b.date)).at(-1)?.date||null;
}
function intDaysSince(date){
  if(!date)return null;
  const a=new Date(`${date}T12:00:00`),b=new Date(`${today()}T12:00:00`);
  return Math.max(0,Math.round((b-a)/86400000));
}
const INTEGRATED_AREA_CONFIG={
  shoulder:{label:"肩・肩甲帯",movement:["overhead_front"],shr:true,retest:"直後：同じ痛む動作＋同方向の肩AROMを再測定。必要時に両腕挙上/SHRを同条件で再確認。24H：痛み・ROM・動作つらさを再記録。"},
  neck:{label:"頸椎・上背部",movement:[],shr:false,retest:"直後：同じ頸部AROM＋症状を再確認。胸椎ROMが関与候補なら同方向も再測定。24H：痛み・動作つらさを再記録。"},
  lowback:{label:"腰・骨盤",movement:["hinge_side","lunge_side"],shr:false,retest:"直後：同じ痛む動作＋ヒップヒンジ＋関連する股関節/胸椎AROMを再確認。24H：痛み・ROM・動作つらさを再記録。"},
  knee:{label:"膝",movement:["sls_front","lunge_side"],shr:false,retest:"直後：同じ膝動作＋膝AROM、必要時は足関節背屈を再確認。片脚スクワット/ランジは同条件で比較。24H反応も記録。"},
  ankle:{label:"足部・足関節",movement:["sls_front","lunge_side"],shr:false,retest:"直後：同じ足首動作＋背屈/底屈AROMを再測定。荷重動作は同じ条件で再確認。24H反応も記録。"},
  wrist:{label:"手関節",movement:[],shr:false,retest:"直後：同じ手首/前腕AROM＋痛む動作を再確認。24H：痛み・ROM・動作つらさを再記録。"},
  elbow:{label:"肘・前腕",movement:[],shr:false,retest:"直後：同じ肘屈伸/前腕回旋AROM＋痛む動作を再確認。24H：痛み・ROM・動作つらさを再記録。"}
};
const INTEGRATED_CONSTRAINT_LABELS={
  LOCAL_IRRITABILITY:"局所疼痛・刺激耐性の制約候補",
  PAIN_LIMITED_ROM:"痛みによる可動抑制の候補",
  PASSIVE_LIMIT:"可動性側の制約候補",
  ACTIVE_PASSIVE_GAP:"AROMの使い切り・運動制御候補",
  AROM_LOW_PROM_UNKNOWN:"AROM低下｜PROM未測定",
  ASYMMETRY:"左右差・再現性の確認候補",
  MOVEMENT_CONTROL:"動作制御の制約候補",
  SHOULDER_COORDINATION:"肩甲帯協調の確認候補",
  THORACIC_MOBILITY:"胸椎可動性の制約候補",
  DATA_RECHECK:"測定条件の再確認"
};
function intLatestAreaCare(area,days=45){
  const rows=(m()?.selfCare||[]).filter(x=>x.area===area&&x.date&&dateAgeDays(x.date)<=days);
  return rows.slice().sort((a,b)=>String(a.savedAt||a.date||"").localeCompare(String(b.savedAt||b.date||""))).at(-1)||null;
}
function intCareCurrentPain(c){
  if(!c)return null;const v=c.followup24h?.pain??c.painAfter??c.painBefore;return v==null?null:Number(v);
}
function intCareSignal(area){
  const c=intLatestAreaCare(area);if(!c)return null;
  const pain=intCareCurrentPain(c),f=careFollowupMetrics(c),resp=careResponseFromRow(c);let score=8;
  if(c.result==="medical"||c.result==="stop")score=100;
  else if(pain>=6)score=100;else if(pain>=4)score=88;else if(pain>=2)score=58;else if(pain>=1)score=35;
  if(f.rebound)score=Math.max(score,92);
  if(f.durable&&pain<=1)score=Math.max(5,score-15);
  const e=[`CARE ${Number(c.painBefore||0)}/10 → ${c.painAfter==null?"--":Number(c.painAfter)+"/10"}`];
  if(f.available)e.push(`24H ${Number(c.followup24h?.pain??0)}/10｜${f.rebound?"戻り/悪化":f.durable?"改善維持":"フォロー済み"}`);
  if(c.location)e.push(c.location);if(c.movement)e.push(c.movement);
  return {type:"LOCAL_IRRITABILITY",score,evidence:e,source:"CARE / 24H",row:c,pain,followup:f,response:resp,data:1};
}
function intLatestAromAreaRows(area,days=90){
  const keys=CARE_AROM_KEYS[area]||[],map={};
  (m()?.aromAssessments||[]).filter(x=>keys.includes(x.key)&&x.date&&dateAgeDays(x.date)<=days).forEach(x=>{
    const k=`${x.key}__${x.side||"na"}`;if(!map[k]||String(map[k].savedAt||map[k].date||"")<String(x.savedAt||x.date||""))map[k]=x;
  });
  return Object.values(map);
}
function intAromSignal(area){
  const rows=intLatestAromAreaRows(area);if(!rows.length)return null;
  const signals=[],pairs={};let passiveCount=0;
  for(const x of rows){
    const ref=AROM_REFERENCE[x.key],active=Number(x.active),passive=x.passive==null?null:Number(x.passive),gap=passive==null?null:passive-active,th=aromGapThreshold(x.key),label=x.label||ref?.label||x.key,side=x.side==="right"?"右":x.side==="left"?"左":"";
    if(passive!=null)passiveCount++;
    if(Number(x.pain||0)>=4)signals.push({type:"PAIN_LIMITED_ROM",score:86,evidence:`${side} ${label}｜測定時痛み ${Number(x.pain)}/10`,source:/^thoracic_/.test(x.key)?"胸椎ROM":"AROM/PROM"});
    if(ref?.hasNorm!==false&&Number.isFinite(active)){
      const low=Number(ref?.ideal?.[0]??-Infinity),activeLow=active<low,passiveLow=passive!=null&&passive<low;
      if(activeLow&&passive!=null&&passiveLow){
        signals.push({type:/^thoracic_/.test(x.key)?"THORACIC_MOBILITY":"PASSIVE_LIMIT",score:76,evidence:`${side} ${label}｜AROM ${active.toFixed(0)}° / PROM ${passive.toFixed(0)}°`,source:/^thoracic_/.test(x.key)?"胸椎ROM":"AROM/PROM"});
      }else if(passive!=null&&gap>=th){
        signals.push({type:"ACTIVE_PASSIVE_GAP",score:70,evidence:`${side} ${label}｜AROM ${active.toFixed(0)}° / PROM ${passive.toFixed(0)}°｜GAP ${gap.toFixed(0)}°`,source:/^thoracic_/.test(x.key)?"胸椎ROM":"AROM/PROM"});
      }else if(activeLow&&passive==null){
        signals.push({type:/^thoracic_/.test(x.key)?"THORACIC_MOBILITY":"AROM_LOW_PROM_UNKNOWN",score:54,evidence:`${side} ${label}｜AROM ${active.toFixed(0)}°｜PROM未測定`,source:/^thoracic_/.test(x.key)?"胸椎ROM":"AROM/PROM"});
      }
    }
    (pairs[x.key] ||= {})[x.side||"na"]=x;
  }
  Object.entries(pairs).forEach(([key,p])=>{
    if(!p.left||!p.right)return;const d=Math.abs(Number(p.left.active)-Number(p.right.active)),label=AROM_REFERENCE[key]?.label||key;
    if(d>=15)signals.push({type:"ASYMMETRY",score:62,evidence:`${label} 左右差 ${d.toFixed(0)}°`,source:/^thoracic_/.test(key)?"胸椎ROM":"AROM/PROM"});
    else if(d>=10)signals.push({type:"ASYMMETRY",score:46,evidence:`${label} 左右差 ${d.toFixed(0)}°`,source:/^thoracic_/.test(key)?"胸椎ROM":"AROM/PROM"});
  });
  if(!signals.length)return {type:"DATA_RECHECK",score:12,evidence:[`AROM/PROM ${rows.length}件｜強い乖離は現データで少ない`],source:"AROM/PROM",rows,passiveCount,data:rows.length};
  signals.sort((a,b)=>b.score-a.score);const lead=signals[0];
  return {...lead,evidence:[...new Set(signals.slice(0,4).map(x=>x.evidence))],sources:[...new Set(signals.slice(0,4).map(x=>x.source))],rows,passiveCount,data:rows.length};
}
function intMovementSignal(area){
  const cfg=INTEGRATED_AREA_CONFIG[area],hits=[];
  for(const type of (cfg?.movement||[])){
    const x=latestMovement(type);if(!x||!x.date||dateAgeDays(x.date)>60)continue;
    let score=Math.min(80,Math.max(18,Number(x.jbjScore||0)+20));if(Number(x.pain||0)>=4)score=Math.max(score,90);
    hits.push({type:"MOVEMENT_CONTROL",score,evidence:`${moveLabel(type)}｜${x.summary||"評価記録あり"}${Number(x.pain||0)>0?`｜痛み ${Number(x.pain)}/10`:""}`,source:"動作スクリーン",row:x});
  }
  if(!hits.length)return null;hits.sort((a,b)=>b.score-a.score);return {...hits[0],evidence:hits.map(x=>x.evidence).slice(0,3),data:hits.length};
}
function intShrSignal(area){
  if(area!=="shoulder")return null;const x=jbjLatestShr();if(!x||!x.date||dateAgeDays(x.date)>60)return null;
  if(Number(x.pain||0)>=4)return {type:"SHOULDER_COORDINATION",score:86,evidence:[`SHR測定時の肩痛 ${Number(x.pain)}/10｜挙上 ${Number(x.arm||0).toFixed(0)}°｜肩甲骨上方回旋 ${Number(x.scap||0).toFixed(0)}°`],source:"SHR",row:x,data:1};
  if(Number(x.scap||0)<5)return {type:"DATA_RECHECK",score:22,evidence:[`SHR：肩甲骨上方回旋量 ${Number(x.scap||0).toFixed(1)}°｜タップ位置・撮影条件の再確認を優先`],source:"SHR",row:x,data:1,reliabilityLow:true};
  const rows=(m()?.shrAssessments||[]).filter(r=>r.date===x.date&&r.plane===x.plane&&r.phase===x.phase&&r.side!==x.side);const pair=rows.at(-1)||null;
  if(pair){const armDiff=Math.abs(Number(x.arm||0)-Number(pair.arm||0)),scapDiff=Math.abs(Number(x.scap||0)-Number(pair.scap||0));if(armDiff>=15||scapDiff>=10)return {type:"SHOULDER_COORDINATION",score:52,evidence:[`SHR左右比較｜挙上差 ${armDiff.toFixed(0)}°｜肩甲骨上方回旋差 ${scapDiff.toFixed(0)}°`,`固定の正常比ではなく左右差・前回差として扱う`],source:"SHR",row:x,data:2};}
  return {type:"DATA_RECHECK",score:18,evidence:[`SHR記録あり｜${Number(x.ratio||0).toFixed(2)}:1｜比率単独では正常/異常を決めない`],source:"SHR",row:x,data:1};
}
function intCareResponseGuidance(area,context){
  const all=(m()?.selfCare||[]).filter(x=>x.area===area&&x.result==="selfcare"&&x.painAfter!=null&&Array.isArray(x.interventions)&&x.interventions.length&&x.date&&dateAgeDays(x.date)<=180);
  const exact=context?all.filter(x=>(!context.location||x.location===context.location)&&(!context.movement||x.movement===context.movement)):[];
  const rows=exact.length>=2?exact:all;if(!rows.length)return {rows:0,followups:0,best:null,category:null,confidence:0,scope:"履歴なし"};
  const stats=careProtocolStats(rows),cat=careCategoryStats(rows),followups=rows.filter(x=>careFollowupMetrics(x).available).length;
  const best=stats.find(g=>g.success>0&&g.worsened===0&&g.rebound===0&&g.responseScore>=50)||null;
  const confidence=Math.min(100,Math.round(rows.length*12+followups*12+(exact.length>=2?10:0)));
  return {rows:rows.length,followups,best,category:cat[0]||null,confidence,scope:exact.length>=2?"同部位・同場所・同動作":"同部位"};
}
function intToolboxGuidance(area,type,pain,responseGuide){
  if(responseGuide?.best&&pain<4){
    return {intervention:"過去反応が良かったCARE組み合わせを優先",dose:responseGuide.best.label,response:`RESPONSE ${Math.round(responseGuide.best.responseScore)}｜n=${responseGuide.best.n}${responseGuide.best.followups?`｜24H ${responseGuide.best.durable}/${responseGuide.best.followups}`:"｜24Hフォロー待ち"}`};
  }
  const map={
    LOCAL_IRRITABILITY:["AROM","ISOMETRIC","MOTOR_CONTROL"],PAIN_LIMITED_ROM:["AROM","ISOMETRIC","MOTOR_CONTROL"],
    PASSIVE_LIMIT:["MOBILITY","RELEASE","STRETCH","AROM"],THORACIC_MOBILITY:["MOBILITY","AROM"],
    ACTIVE_PASSIVE_GAP:["AROM","ACTIVATION","MOTOR_CONTROL","ISOMETRIC"],AROM_LOW_PROM_UNKNOWN:["AROM","MOTOR_CONTROL","ISOMETRIC"],
    ASYMMETRY:["AROM","MOTOR_CONTROL"],MOVEMENT_CONTROL:["MOTOR_CONTROL","ACTIVATION","AROM"],SHOULDER_COORDINATION:["MOTOR_CONTROL","ACTIVATION","AROM"],DATA_RECHECK:["AROM"]
  };
  const cats=pain>=4?["AROM","ISOMETRIC","MOTOR_CONTROL"]:(map[type]||["AROM"]),box=CARE_TOOLBOX[area]||{},items=[];
  for(const c of cats){const first=(box[c]||[])[0];if(first)items.push(first);if(items.length>=2)break;}
  return {intervention:`${cats.slice(0,3).join(" → ")} を優先`,dose:items.join(" / ")||"痛みを増やさない軽いAROM 6〜10回から開始し、直後に同条件で再評価。",response:responseGuide?.rows?`CARE RESPONSE ${responseGuide.scope} n=${responseGuide.rows}｜安全に優先できる固定プロトコルは未確定`:"CARE RESPONSE履歴なし｜今回を基準として保存"};
}
function intAreaConfidence(care,rom,move,shr,responseGuide,dominant){
  let s=0;if(care)s+=22;if(care?.followup?.available)s+=12;if(rom){s+=Math.min(24,8+rom.data*3);if(rom.passiveCount>0)s+=8;}if(move)s+=12;if(shr)s+=8;if(responseGuide?.rows)s+=Math.min(18,responseGuide.rows*3);if(responseGuide?.followups)s+=Math.min(10,responseGuide.followups*3);
  s=Math.min(100,Math.round(s));if(dominant?.type==="AROM_LOW_PROM_UNKNOWN")s=Math.min(s,60);if(dominant?.source==="SHR"&&!care&&!rom&&!move)s=Math.min(s,45);if(shr?.reliabilityLow)s=Math.min(s,55);
  return {score:s,label:s>=75?"HIGH":s>=45?"MODERATE":"LOW"};
}
function intNextLoadGateForArea(area,score,pain,care,globalGate){
  const rule=CARE_SMART_RULES[area]||{conflicts:[]},targets=(rule.conflicts||[]).join("・")||"該当部位",f=care?.followup;
  const med=medicalCurrentGuidanceStates().filter(g=>g.trainingStatus==="stop_all"||g.area==="all"||g.area===area).sort((a,b)=>String(a.savedAt||a.visitDate||"").localeCompare(String(b.savedAt||b.visitDate||""))).at(-1)||null;
  if(med&&["stop_all","stop_area"].includes(med.trainingStatus))return {code:"BLOCK",cls:"bad",text:`${targets}：医療指示を優先し、自動増量を停止。`};
  if(care?.row?.result==="medical"||care?.row?.result==="stop"||pain>=5||f?.rebound)return {code:"BLOCK LOCAL",cls:"bad",text:`${targets}：重量UP・限界REP更新・追加SETを停止。別部位または回復優先。`};
  if(score>=75||pain>=3)return {code:"HOLD / MODIFIED",cls:"warn",text:`${targets}：増量は保留。SETは約60〜80%・RIR 3以上を目安にし、再テストで悪化なしを確認。`};
  if(score>=45||pain>=1)return {code:"RETEST FIRST",cls:"warn",text:`${targets}：まず負荷維持。直後＋24H再テストが安定し、痛み0〜2/10なら次回進行候補。`};
  if(globalGate.code!=="CLEAR")return {code:"GLOBAL GATE",cls:globalGate.cls,text:`局所は大きな制限が少ないが、全身回復ゲート ${globalGate.code} を優先。`};
  return {code:"CLEAR",cls:"good",text:`${targets}：局所ゲート上は進行候補。実際のNEXT LOADはRIR・REST・フォーム・前回差をそろえて判定。`};
}
function intGlobalRecoveryGate(){
  const st=smartRecoveryState(),r=latestRecovery(),med=activeMedicalGuidance();
  if(med?.trainingStatus==="stop_all")return {code:"BLOCK",cls:"bad",label:"全身STOP",detail:`MEDICAL｜${medicalTrainingStatusLabel(med.trainingStatus)}。医療指示を最優先。`,volume:0};
  if(!r)return {code:"CAUTION",cls:"warn",label:"回復データ不足",detail:`回復記録なし。控えめに開始し当日の主観・ウォームアップ反応を確認。`,volume:st.volume};
  const sc=recScore(r);
  if(st.volume===0||Number(r.pain||0)>=6)return {code:"BLOCK",cls:"bad",label:"全身回復優先",detail:`回復 ${sc}点｜睡眠 ${Number(r.sleep||0).toFixed(1)}h｜疲労 ${r.fatigue}/10｜ストレス ${r.stress}/10｜痛み ${r.pain}/10`,volume:st.volume};
  if(st.volume<=60)return {code:"REDUCE",cls:"warn",label:"全身VOLUME縮小",detail:`回復 ${sc}点｜推奨VOLUME ${st.volume}%｜${st.rir}`,volume:st.volume};
  if(st.volume<100)return {code:"CAUTION",cls:"warn",label:"軽度調整",detail:`回復 ${sc}点｜推奨VOLUME ${st.volume}%｜${st.rir}`,volume:st.volume};
  return {code:"CLEAR",cls:"good",label:"全身回復ゲート通過",detail:`回復 ${sc}点｜VOLUME ${st.volume}%｜${st.rir}`,volume:st.volume};
}
function intBuildAreaCandidate(area,globalGate){
  const cfg=INTEGRATED_AREA_CONFIG[area],care=intCareSignal(area),rom=intAromSignal(area),move=intMovementSignal(area),shr=intShrSignal(area),signals=[care,rom,move,shr].filter(Boolean);if(!signals.length)return null;
  const meaningful=signals.filter(x=>Number(x.score)>=25);if(!meaningful.length)return null;meaningful.sort((a,b)=>b.score-a.score);const dominant=meaningful[0],support=meaningful.filter(x=>x!==dominant&&Number(x.score)>=40),score=Math.min(100,Math.round(Number(dominant.score||0)+Math.min(12,support.length*6)));
  const responseGuide=intCareResponseGuidance(area,care?.row||null),confidence=intAreaConfidence(care,rom,move,shr,responseGuide,dominant),pain=care?.pain??null,guidance=intToolboxGuidance(area,dominant.type,Number(pain||0),responseGuide),gate=intNextLoadGateForArea(area,score,Number(pain||0),care,globalGate);
  const evidence=[];for(const s of meaningful.slice(0,4)){for(const e of (Array.isArray(s.evidence)?s.evidence:[s.evidence]))if(e&&!evidence.includes(e))evidence.push(e)}
  const sources=[...new Set(meaningful.flatMap(s=>s.sources||[s.source]).filter(Boolean))];if(rom||move)sources.push("Joint by Joint");if(responseGuide.rows)sources.push("CARE RESPONSE");if(care?.followup?.available)sources.push("24H");
  const typeLabel=INTEGRATED_CONSTRAINT_LABELS[dominant.type]||dominant.type;
  return {area,areaLabel:cfg?.label||CARE_AREA_LABELS[area]||area,type:dominant.type,typeLabel,score,level:intLevel(score),confidence,evidence:evidence.slice(0,5),sources:[...new Set(sources)],intervention:guidance.intervention,dose:guidance.dose,responseText:guidance.response,retest:cfg?.retest||"同じ条件で直後・24H再評価。",nextLoadGate:gate,pain,careDate:care?.row?.date||"",title:`${cfg?.label||area}｜${typeLabel}`,source:[...new Set(sources)].join(" + "),next:`${guidance.intervention} → 再テスト → ${gate.code}`};
}
function intTrainingSummary(){
  const rows=m()?.training||[];
  if(!rows.length)return {label:"記録なし",detail:"トレーニング記録を作ると進行度を統合できます。"};
  const exs=[...new Set(rows.map(x=>x.exercise))].slice(-3).reverse();const details=exs.map(ex=>`${ex}：${nextOverload(ex).txt}`),last=intLatestTrainingDate(),days=intDaysSince(last);
  return {label:last?`最終 ${days===0?"今日":days+"日前"}`:"記録なし",detail:details.join("｜")};
}
function buildIntegratedAssessment(){
  const st=smartRecoveryState(),globalGate=intGlobalRecoveryGate(),train=intTrainingSummary(),medical=activeMedicalGuidance();
  const candidates=["shoulder","neck","lowback","knee","ankle","wrist","elbow"].map(a=>intBuildAreaCandidate(a,globalGate)).filter(Boolean).sort((a,b)=>b.score-a.score||b.confidence.score-a.confidence.score),top=candidates.filter(x=>x.score>=35).slice(0,3);
  const coverage={care:(m()?.selfCare||[]).length,arom:(m()?.aromAssessments||[]).length,rom:(m()?.romAssessments||[]).length,shr:(m()?.shrAssessments||[]).length,movement:(m()?.movementScreens||[]).length,recovery:(m()?.recovery||[]).length,training:(m()?.training||[]).length,medical:(m()?.medicalReferrals||[]).length};
  let confidenceScore=top.length?Math.round(top.reduce((s,x)=>s+x.confidence.score,0)/top.length):Math.min(100,Math.round((coverage.arom>0?20:0)+(coverage.care>0?20:0)+(coverage.movement>0?15:0)+(coverage.shr>0?10:0)+(coverage.recovery>0?15:0)+(coverage.training>0?10:0)+(coverage.rom>0?10:0)));
  const integratedConfidence={score:confidenceScore,label:confidenceScore>=75?"HIGH":confidenceScore>=45?"MODERATE":"LOW"};
  let overall={label:"通常運用候補",cls:"good",detail:"全身回復と局所制約を分けて確認。強い局所ゲートがなければ通常運用候補。"};
  if(globalGate.cls==="bad"||top.some(x=>x.nextLoadGate?.cls==="bad")||medical?.trainingStatus==="stop_all")overall={label:"優先調整あり",cls:"bad",detail:"全身または局所のBLOCK条件あり。高負荷・自動増量より安全ゲートと再評価を優先。"};
  else if(globalGate.cls==="warn"||top.some(x=>x.nextLoadGate?.cls==="warn")||top[0]?.score>=45)overall={label:"調整候補あり",cls:"warn",detail:"全身回復または局所Constraint Candidateを確認し、CARE→再テスト→負荷判断の順で運用。"};
  const localGate=top.find(x=>x.nextLoadGate.cls==="bad")?.nextLoadGate||top.find(x=>x.nextLoadGate.cls==="warn")?.nextLoadGate||{code:"CLEAR",cls:"good",text:"局所BLOCK条件なし。"};
  const plan=`SYSTEMIC：${globalGate.code}｜VOLUME ${st.volume}%｜${st.rir}。LOCAL：${localGate.code}。全身回復が良くても局所BLOCKは別管理し、Priority CARE → 同条件RETEST → NEXT LOADの順に進める。`;
  return {version:"27.82",date:today(),createdAt:new Date().toISOString(),overall,top,candidates,plan,coverage,training:train,recoveryScore:latestRecovery()?recScore(latestRecovery()):null,volume:st.volume,rir:st.rir,stepTarget:st.stepTarget||0,globalGate,localGate,integratedConfidence};
}
function renderIntegratedAssessment(force=false){
  const box=document.getElementById("integratedResult");if(!box||!m())return;const a=buildIntegratedAssessment();currentIntegratedAssessment=a;const cov=a.coverage;
  const topHtml=a.top.length?a.top.map((x,i)=>`<div class="integratedConstraint ${x.level}">
    <div class="integratedConstraintHead"><div class="integratedConstraintNo">${i+1}</div><div><div class="integratedConstraintTitle">${esc(x.areaLabel)}</div><div class="integratedConstraintType">CONSTRAINT CANDIDATE｜${esc(x.typeLabel)}</div></div><div class="integratedConfidence">CONFIDENCE<b>${esc(x.confidence.label)} ${x.confidence.score}%</b></div></div>
    <div class="integratedEvidence"><b>統合根拠</b><br>${x.evidence.map(esc).join("<br>")}</div>
    <div class="integratedTags">${x.sources.map(s=>`<span class="integratedTag">${esc(s)}</span>`).join("")}</div>
    <div class="integratedActionGrid"><div class="integratedAction"><b>PRIORITY CARE</b>${esc(x.intervention)}<br><br>${esc(x.dose)}<br><small>${esc(x.responseText)}</small></div><div class="integratedAction"><b>RETEST</b>${esc(x.retest)}</div></div>
    <div class="integratedGateLine ${x.nextLoadGate.cls}"><b>NEXT LOAD GATE｜${esc(x.nextLoadGate.code)}</b><br>${esc(x.nextLoadGate.text)}</div>
  </div>`).join(""):`<div class="integratedNoData"><b>Priority CARE候補なし</b><br>保存データ上ではスコア35以上の局所Constraint Candidateは出ていません。未測定項目は「問題なし」とは扱わず、必要な部位から順次評価してください。</div>`;
  box.innerHTML=`<div class="integratedHero ${a.overall.cls}"><div class="integratedHeroTop"><div><div class="integratedHeroTitle">${esc(a.overall.label)}</div><small>${esc(a.overall.detail)}</small></div><span class="badge ${a.overall.cls}">V${esc(a.version)}</span></div><div class="integratedStats"><div class="integratedStat"><span>全身回復</span><b>${a.recoveryScore==null?"--":a.recoveryScore+"点"}</b></div><div class="integratedStat"><span>SYSTEMIC GATE</span><b>${esc(a.globalGate.code)}</b></div><div class="integratedStat"><span>LOCAL GATE</span><b>${esc(a.localGate.code)}</b></div><div class="integratedStat"><span>CONFIDENCE</span><b>${esc(a.integratedConfidence.label)} ${a.integratedConfidence.score}%</b></div></div></div>
  <div class="integratedGateGrid"><div class="integratedGate ${a.globalGate.cls}"><span class="gateCode">SYSTEMIC / 全身回復</span><b>${esc(a.globalGate.label)}</b>${esc(a.globalGate.detail)}<br><small>全身VOLUME ${a.volume}%｜${esc(a.rir)}｜歩数 ${a.stepTarget?a.stepTarget.toLocaleString()+"歩":"FREE"}</small></div><div class="integratedGate ${a.localGate.cls}"><span class="gateCode">LOCAL / 局所制約</span><b>${esc(a.localGate.code)}</b>${esc(a.localGate.text)}<br><small>全身回復が良くても局所BLOCKは解除しません。</small></div></div>
  <div class="integratedCareTitle">PRIORITY CARE TOP3</div>${topHtml}
  <div class="integratedPlan"><b>今日の統合運用</b><br>${esc(a.plan)}<br><br><b>トレーニング進行</b><br>${esc(a.training.label)}｜${esc(a.training.detail)}</div>
  <div class="integratedDataGrid"><div class="integratedData"><b>身体評価データ</b>AROM/PROM ${cov.arom}件｜ROM ${cov.rom}件｜SHR ${cov.shr}件｜動作スクリーン ${cov.movement}件<br><small>各画面で保存した記録のみ統合対象</small></div><div class="integratedData"><b>コンディションデータ</b>CARE ${cov.care}件｜医療連携 ${cov.medical||0}件｜回復 ${cov.recovery}件｜トレーニング ${cov.training}件</div></div>
  <div class="romLegend">※ Constraint Candidateは診断・傷病名・原因筋の断定ではありません。AROM/PROM、胸椎ROM、SHR、動作、CARE RESPONSE、24H反応を相互補強し、CONFIDENCE付きで「次に検証する候補」を示します。危険サイン・医療指示は常に最優先です。</div>`;
}
function saveIntegratedAssessment(){
  if(!m())return;
  if(!currentIntegratedAssessment)renderIntegratedAssessment(true);
  if(!currentIntegratedAssessment)return;
  m().integratedAssessments=m().integratedAssessments||[];
  m().integratedAssessments.push(JSON.parse(JSON.stringify(currentIntegratedAssessment)));
  persist();renderIntegratedHistory();
  alert("統合判定を保存しました");
}
function renderIntegratedHistory(){
  const box=document.getElementById("integratedHistory");if(!box||!m())return;
  const rows=m().integratedAssessments||[];
  box.innerHTML=[...rows].reverse().slice(0,20).map((x,ri)=>{
    const i=rows.length-1-ri;
    const top=(x.top||[]).map((p,j)=>`${j+1}.${p.title}`).join("｜")||"強い優先課題なし";
    return `<div class="item"><div class="row"><div><strong>${esc(x.date)}｜${esc(x.overall?.label||"統合判定")}</strong><br><small>${esc(top)}</small><br><small>VOLUME ${Number(x.volume||0)}%｜回復 ${x.recoveryScore==null?"--":x.recoveryScore+"点"}${x.globalGate?`｜SYSTEMIC ${esc(x.globalGate.code)}`:""}${x.localGate?`｜LOCAL ${esc(x.localGate.code)}`:""}${x.integratedConfidence?`｜CONF ${esc(x.integratedConfidence.label)} ${Number(x.integratedConfidence.score||0)}%`:""}</small></div><button class="danger" onclick="remove('integratedAssessments',${i})">削除</button></div></div>`;
  }).join("")||'<span class="muted">履歴なし</span>';
}

function renderJointByJoint(){
  const map=document.getElementById("jbjMap"),pri=document.getElementById("jbjPriority");
  if(!map||!pri||!m())return;

  const ankle=jbjEvalMobility(["ankle_df","ankle_pf","foot_inv","foot_ev"]);
  const hip=jbjEvalMobility(["hip_flex","hip_ext","hip_abd","hip_add","hip_er","hip_ir"]);
  const thor=jbjEvalMobility(["thoracic_rot","thoracic_flex","thoracic_ext","thoracic_lat"]);
  const shoulder=jbjEvalMobility(["shoulder_flex","shoulder_ext","shoulder_abd","shoulder_er","shoulder_ir","shoulder_hflex","shoulder_hext"]);
  const neck=jbjEvalMobility(["cervical_flex","cervical_ext","cervical_rot","cervical_lat"]);
  const kneeMob=jbjEvalMobility(["knee_flex","knee_ext"]);

  const careAnkle=jbjCareState("ankle"),careKnee=jbjCareState("knee"),careLow=jbjCareState("lowback"),
        careShoulder=jbjCareState("shoulder"),careNeck=jbjCareState("neck");

  const shr=jbjLatestShr();
  const sls=latestMovement("sls_front"),hinge=latestMovement("hinge_side"),overhead=latestMovement("overhead_front");
  let scapScore=0,scapEv=[],scapData=0;
  if(shr){
    scapData=1;
    const ratio=Number(shr.ratio),pain=Number(shr.pain||0),scapMove=Number(shr.scap||0);
    scapEv.push(`SHR ${ratio.toFixed(2)}:1｜挙上 ${Number(shr.arm).toFixed(0)}°｜肩甲骨上方回旋量 ${scapMove.toFixed(0)}°`);
    if(pain>=4)scapScore=100;
    else if(scapMove<5){scapScore=20;scapEv.push("肩甲骨タップ測定を再確認")}
    else scapScore=5; // ratio alone never labels dysfunction
  }

  const regions=[
    {name:"足部・足関節",role:"主に可動性",raw:ankle,care:careAnkle,next:"背屈・底屈・内外がえし → スクワット/片脚動作と照合"},
    {name:"膝",role:"主に安定性＋必要ROM",
      raw:{evidence:[...(kneeMob.evidence||[]),...(sls?[`片脚SQ：膝偏位 ${Number(sls.metrics?.kneeDeviationPct||0).toFixed(1)}%｜骨盤 ${Number(sls.metrics?.pelvicTilt||0).toFixed(1)}°`]:[])],
           score:Math.max(kneeMob.score||0,sls?Number(sls.jbjScore||0):0),data:(kneeMob.data||0)+(sls?1:0)},
      care:careKnee,wait:!sls,next:sls?"片脚SQの左右/前回差を継続比較":"片脚スクワット・ランジでニーイン/左右制御を確認"},
    {name:"股関節",role:"主に可動性",raw:hip,care:{score:0,text:""},next:"内外旋・屈伸・左右差 → ヒンジ/片脚動作と照合"},
    {name:"腰椎・骨盤",role:"主に安定性",
      raw:{evidence:hinge?[`ヒンジ：股 ${Number(hinge.metrics?.hipFlex||0).toFixed(0)}°｜膝 ${Number(hinge.metrics?.kneeFlex||0).toFixed(0)}°｜体幹 ${Number(hinge.metrics?.trunkLean||0).toFixed(0)}°`]:[],score:hinge?Number(hinge.jbjScore||0):0,data:hinge?1:0},
      care:careLow,wait:!hinge,next:hinge?"ヒンジの前回差・痛み・股関節ROMと統合":"ヒップヒンジ・スクワットで腰椎/骨盤代償を確認"},
    {name:"胸椎",role:"主に可動性",raw:thor,care:{score:0,text:""},next:"回旋・伸展 → 肩挙上/SHRとの関連を確認"},
    {name:"肩甲帯",role:"可動性＋協調/安定",
      raw:{evidence:[...scapEv,...(overhead?[`両腕挙上：左右差 ${Number(overhead.metrics?.armAsym||0).toFixed(1)}°｜体幹側屈 ${Number(overhead.metrics?.trunkLean||0).toFixed(1)}°`]:[])],
           score:Math.max(scapScore,overhead?Number(overhead.jbjScore||0):0),data:scapData+(overhead?1:0)},
      care:careShoulder,next:"SHR＋両腕挙上＋胸椎/肩ROMを統合"},
    {name:"肩関節",role:"可動性＋安定",raw:shoulder,care:careShoulder,next:"屈曲・外転・内外旋をSHR/胸椎と統合"},
    {name:"頸椎",role:"可動性＋制御",raw:neck,care:careNeck,next:"屈伸・回旋・側屈を胸椎/肩甲帯と照合"}
  ].map(r=>{
    const evidence=[...(r.raw.evidence||[])];
    if(r.care?.text)evidence.unshift(r.care.text);
    const score=Math.max(Number(r.raw.score||0),Number(r.care?.score||0));
    const data=Number(r.raw.data||0)+(r.care?.pain!=null?1:0);
    return {...r,evidence,score,data,status:jbjStatus(score,data,!!r.wait)};
  });

  const ranked=regions.filter(r=>r.score>0).slice().sort((a,b)=>b.score-a.score);
  const top=ranked.slice(0,3);
  pri.innerHTML=`<b>優先候補</b><br>${
    top.length?top.map((r,i)=>`${i+1}. ${esc(r.name)}｜${esc(r.status.label)}${r.evidence[0]?`｜${esc(r.evidence[0])}`:""}`).join("<br>"):
    "現時点で強い優先候補は出ていません。未測定部位は順次追加。"
  }`;

  map.innerHTML=regions.map(r=>`<div class="jbjCard">
    <h3>${esc(r.name)}</h3>
    <div class="jbjRole">${esc(r.role)}</div>
    <span class="jbjStatus ${r.status.cls}">${esc(r.status.label)}</span>
    <div class="jbjEvidence">${r.evidence.length?r.evidence.slice(0,4).map(esc).join("<br>"):"保存データなし"}<br><b style="color:#d6b75a">次：</b>${esc(r.next)}</div>
  </div>`).join("");
}
function renderAromAsymmetry(){
  const box=document.getElementById("aromAsymmetry");if(!box||!m())return;
  const rows=m().aromAssessments||[];
  const pairs=window.SuGRomCare.aromAsymmetryPairs(rows,12);
  box.innerHTML=pairs.map(x=>{
    const cls=x.diff>=15?"bad":x.diff>=10?"warn":"ok";
    const sym=x.diff>=15?"△":x.diff>=10?"○":"◎";
    return `<div class="item"><strong>${esc(x.date)}｜${esc(x.label)}</strong><br><small>右 ${x.r.toFixed(0)}°｜左 ${x.l.toFixed(0)}°｜<span class="${cls}">${sym} 左右差 ${x.diff.toFixed(0)}°</span></small></div>`;
  }).join("")||'<span class="muted">同日・同動作の左右データを保存すると表示されます。</span>';
}

function renderAromHistory(){
  const box=document.getElementById("aromHistory");if(!box||!m())return;
  const rows=m().aromAssessments||[];
  box.innerHTML=[...rows].reverse().slice(0,30).map((x,ri)=>{
    const i=rows.length-1-ri;
    const side=x.side==="right"?"右":"左";
    return `<div class="item"><div class="row"><div><strong>${esc(x.date)}｜${esc(x.label)}｜${side}</strong><br><small>AROM ${Number(x.active).toFixed(0)}°｜PROM ${x.passive==null?"--":Number(x.passive).toFixed(0)+"°"}｜差 ${x.gap==null?"--":Number(x.gap).toFixed(0)+"°"}｜痛み ${x.pain}/10</small><br><small>${esc(x.pattern)}</small></div><button class="danger" onclick="remove('aromAssessments',${i})">削除</button></div></div>`;
  }).join("")||'<span class="muted">履歴なし</span>';
}


let currentShrResult=null;
function shrPlaneLabel(v){return v==="abduction"?"外転":v==="flexion"?"屈曲":"肩甲面挙上"}
function shrPhaseLabel(v){return v==="lowering"?"下降":"挙上"}

function findShrPair(date,side,plane,phase,arm){
  const rows=m()?.shrAssessments||[];
  const opposite=side==="right"?"left":"right";
  return [...rows].reverse().find(x=>x.date===date && x.side===opposite && x.plane===plane && x.phase===phase && Math.abs(Number(x.arm)-Number(arm))<=10) || null;
}

function setShrArm(v){
  const el=document.getElementById("shrArm"); if(el) el.value=v;
}
function analyzeShr(){
  if(!m())return;
  const armEl=document.getElementById("shrArm"),startEl=document.getElementById("shrScapStart"),endEl=document.getElementById("shrScapEnd");
  if(!armEl || armEl.value==="" || !startEl || startEl.value==="" || !endEl || endEl.value==="") return alert("先に写真を自動解析して、STARTとUPそれぞれ肩甲骨を2点タップしてください");
  const arm=Number(armEl.value),scapStart=Number(startEl.value),scapEnd=Number(endEl.value);
  const scap=scapEnd-scapStart;
  if(arm<=0 || arm>180) return alert("腕の挙上角は1〜180°で入力してください");
  if(scap<=0 || scap>=arm) return alert("肩甲骨の挙上時角度は開始時より大きくしてください。上方回旋量が腕の挙上角以上にならないよう確認してください");
  const date=document.getElementById("shrDate")?.value||today();
  const side=document.getElementById("shrSide")?.value||"right";
  const plane=document.getElementById("shrPlane")?.value||"scaption";
  const phase=document.getElementById("shrPhase")?.value||"raising";
  const pain=Math.max(0,Math.min(10,Number(document.getElementById("shrPain")?.value||0)));
  const memo=document.getElementById("shrMemo")?.value||"";
  const gh=Math.max(0,arm-scap);
  const ratio=scap>0?gh/scap:null;
  const pair=findShrPair(date,side,plane,phase,arm);

  let tendency="参考値｜左右・前回比較を優先", interpretation="", related="", tone="notice";
  const scapExcursion=Number(scap);
  if(pain>=4){
    tendency="痛み優先｜SHR比は参考";
    interpretation="痛みを伴うため、SHR比の大小より症状を優先。無理な挙上を続けず、CARE・肩AROM/PROMと統合して確認。";
    related="肩関節・肩甲帯・胸椎・疼痛による運動抑制など。";
    tone="smartWarn";
  }else if(scapExcursion<5){
    tendency="測定再確認｜肩甲骨移動量が小さい";
    interpretation="2点タップで算出した肩甲骨上方回旋量が5°未満。ランドマーク位置・写真条件の影響を受けやすいため、SHR解釈より先に再測定を推奨。";
    related="同じカメラ位置・同じ挙上面で再撮影し、肩甲棘根元と肩峰後外側を再確認。";
  }else{
    tendency="参考値｜比率単独で正常/異常を決めない";
    interpretation=`今回の2D測定では、腕挙上量 ${arm.toFixed(0)}° に対して肩甲骨上方回旋量 ${scap.toFixed(0)}°、SHR ${ratio.toFixed(2)}:1。SHRは挙上区間・負荷・挙上/下降で大きく変動するため、この1回の比率だけで「肩甲骨寄与が少ない/多い」と断定しない。`;
    related="左右同条件、同側の前回値、肩AROM/PROM、胸椎ROM、痛みCARE、肩すくみ等の動作所見を統合して評価。";
    tone="smartOk";
  }

  let pairText="反対側の同条件データなし";
  if(pair){
    const scapDiff=scap-Number(pair.scap);
    const ratioDiff=ratio-Number(pair.ratio);
    pairText=`反対側との差：肩甲骨上方回旋 ${scapDiff>=0?"+":""}${scapDiff.toFixed(1)}°｜SHR ${ratioDiff>=0?"+":""}${ratioDiff.toFixed(2)}`;
  }

  currentShrResult={date,side,plane,phase,arm,scapStart,scapEnd,scap,gh,ratio,pain,memo,tendency,interpretation,related,pairText};
  const sideText=side==="right"?"右":"左";
  document.getElementById("shrResult").innerHTML=
    `<div class="${tone}"><b>${sideText}｜${esc(shrPlaneLabel(plane))}｜${esc(shrPhaseLabel(phase))}</b><br>SHRトレンド：<b>${esc(tendency)}</b></div>
     <div class="aromGrid">
       <div class="aromCard"><span>腕の挙上角</span><b>${arm.toFixed(0)}°</b><small>体側0°からの総挙上量</small></div>
       <div class="aromCard"><span>肩甲骨 上方回旋量</span><b>${scap.toFixed(0)}°</b><small>${scapStart.toFixed(0)}° → ${scapEnd.toFixed(0)}°</small></div>
       <div class="aromCard"><span>GH推定寄与</span><b>${gh.toFixed(0)}°</b><small>総挙上 − 肩甲骨上方回旋</small></div>
       <div class="aromCard"><span>SHR</span><b>${ratio==null?"--":ratio.toFixed(2)+":1"}</b><small>GH / ST。研究の全可動域平均は約2.3:1だが、区間ごとに大きく変動。単独判定しない</small></div>
     </div>
     <div class="aromPattern"><strong>S.u.G解釈</strong><br>${esc(interpretation)}<br><br><strong>関連候補</strong><br>${esc(related)}<br><br><strong>左右比較</strong><br>${esc(pairText)}<br><br><strong>統合評価</strong><br>肩AROM/PROM＋胸椎ROM＋痛みCARE＋トレーニング動作ROMと合わせて判断。</div>
     <div class="romLegend">※ SHRに固定の「正常比」は置きません。研究では全可動域平均が約2.3:1でも、挙上区間・負荷・挙上/下降で比率は大きく変動します。2D写真＋タップ値は左右・前回比較を主目的に使用します。</div>
     <button class="secondary" style="width:100%;margin-top:9px" onclick="saveShrResult()">このSHR判定を保存</button>`;
}

function saveShrResult(){
  if(!currentShrResult||!m())return alert("先にSHR判定を行ってください");
  m().shrAssessments.push({...currentShrResult,savedAt:new Date().toISOString()});
  persist();renderShrHistory();renderJointByJoint();renderIntegratedAssessment();
  alert("SHR判定を保存しました");
}

function renderShrHistory(){
  const box=document.getElementById("shrHistory"); if(!box||!m())return;
  const rows=m().shrAssessments||[];
  box.innerHTML=[...rows].reverse().slice(0,30).map((x,ri)=>{
    const i=rows.length-1-ri, side=x.side==="right"?"右":"左";
    return `<div class="item"><div class="row"><div><strong>${esc(x.date)}｜${side}｜${esc(shrPlaneLabel(x.plane))}</strong><br><small>挙上 ${Number(x.arm).toFixed(0)}°｜肩甲骨上方回旋量 ${Number(x.scap).toFixed(0)}°｜GH推定 ${Number(x.gh).toFixed(0)}°｜SHR ${Number(x.ratio).toFixed(2)}:1｜痛み ${x.pain}/10</small><br><small>${esc(x.tendency)}</small></div><button class="danger" onclick="remove('shrAssessments',${i})">削除</button></div></div>`;
  }).join("")||'<span class="muted">履歴なし</span>';
}

let currentRomResult=null;
let romImageObjectUrl=null;

function loadRomImage(input){
  const file=input?.files?.[0];
  if(!file)return;
  if(romImageObjectUrl)URL.revokeObjectURL(romImageObjectUrl);
  romImageObjectUrl=URL.createObjectURL(file);
  const img=document.getElementById("romSourceImage");
  img.onload=()=>{
    drawRomBaseImage();
    const btn=document.getElementById("romAnalyzeBtn");if(btn)btn.disabled=false;
    const r=document.getElementById("romResult");if(r)r.innerHTML='<span class="muted">画像を読み込みました。「スクワットROMを自動判定」を押してください。</span>';
  };
  img.src=romImageObjectUrl;
}

function drawRomBaseImage(){
  const img=document.getElementById("romSourceImage"),stage=document.getElementById("romStage");
  if(!img?.naturalWidth||!stage)return;
  stage.innerHTML='<canvas id="romCanvas"></canvas>';
  const c=document.getElementById("romCanvas"),ctx=c.getContext("2d");
  const maxW=1100,scale=Math.min(1,maxW/img.naturalWidth);
  c.width=Math.round(img.naturalWidth*scale);c.height=Math.round(img.naturalHeight*scale);
  ctx.drawImage(img,0,0,c.width,c.height);
}

function angle3(a,b,c){
  const v1={x:a.x-b.x,y:a.y-b.y},v2={x:c.x-b.x,y:c.y-b.y};
  const dot=v1.x*v2.x+v1.y*v2.y;
  const m1=Math.hypot(v1.x,v1.y),m2=Math.hypot(v2.x,v2.y);
  if(!m1||!m2)return null;
  return Math.acos(Math.max(-1,Math.min(1,dot/(m1*m2))))*180/Math.PI;
}
function trunkFromVertical(shoulder,hip){
  const dx=shoulder.x-hip.x,dy=shoulder.y-hip.y;
  if(!dx&&!dy)return null;
  return Math.atan2(Math.abs(dx),Math.abs(dy))*180/Math.PI;
}
function romDepthLabel(hip,knee,h){
  const d=(hip.y-knee.y)/h;
  if(d>=0.015)return {key:"below",label:"ランドマーク上は平行以下",cls:"ok",delta:d};
  if(d>=-0.02)return {key:"parallel",label:"ほぼ平行",cls:"ok",delta:d};
  return {key:"above",label:"平行より浅め",cls:"warn",delta:d};
}
function romRound(v){return v==null?"--":`${Math.round(v)}°`;}
function renderRomHistory(){
  const box=document.getElementById("romHistory");if(!box||!m())return;
  const rows=m().romAssessments||[];
  box.innerHTML=[...rows].reverse().slice(0,20).map((x,ri)=>{
    const i=rows.length-1-ri;
    return `<div class="item"><div class="row"><div><strong>${esc(x.date)}｜スクワットROM</strong><br><small>${esc(x.sideLabel||"側面")}｜深度 ${esc(x.depthLabel||"--")}｜膝 ${Math.round(x.kneeAngle||0)}°｜股 ${Math.round(x.hipAngle||0)}°｜足関節 ${Math.round(x.ankleAngle||0)}°｜体幹 ${Math.round(x.trunkAngle||0)}°</small>${x.lrKneeDiff!=null?`<br><small>左右膝角差 ${x.lrKneeDiff.toFixed(1)}°</small>`:""}</div><button class="danger" onclick="remove('romAssessments',${i})">削除</button></div></div>`;
  }).join("")||'<span class="muted">履歴なし</span>';
}
function saveRomResult(){
  if(!currentRomResult||!m())return alert("先にROM解析を行ってください");
  m().romAssessments.push({...currentRomResult,date:document.getElementById("romDate")?.value||today(),savedAt:new Date().toISOString()});
  persist();renderRomHistory();renderIntegratedAssessment();
  alert("ROM判定を保存しました");
}

const ROM_REFERENCE=window.SuGRomCare.ROM_REFERENCE;
function romBand(value,key){
  return window.SuGRomCare.romBand(value,key,ROM_REFERENCE);
}
function romMetricCard(title,valueText,key,sub,valueForBand){
  const b=romBand(valueForBand,key),r=ROM_REFERENCE[key];
  return `<div class="romMetric"><span>${esc(title)}</span><b>${esc(valueText)}</b><small>${esc(sub)}</small><small style="margin-top:6px;color:#d6b75a">${esc(r.label)}</small><small class="${b.cls}" style="font-weight:800">${b.symbol} ${esc(b.text)}</small></div>`;
}
window.__SUG_ROM_RESULT__=function(payload){
  currentRomResult=payload;
  const box=document.getElementById("romResult");if(!box)return;
  const lrText=payload.lrKneeDiff==null?"判定保留":`${payload.lrKneeDiff.toFixed(1)}°`;
  const depthPct=payload.depthDelta*100;
  const grades=[
    romBand(payload.kneeAngle,"knee"),
    romBand(payload.hipAngle,"hip"),
    romBand(payload.ankleAngle,"ankle"),
    romBand(payload.trunkAngle,"trunk"),
    romBand(depthPct,"depth")
  ];
  if(payload.lrKneeDiff!=null)grades.push(romBand(payload.lrKneeDiff,"lr"));
  const score=grades.reduce((a,g)=>a+(g.symbol==="◎"?2:g.symbol==="○"?1:0),0);
  const max=grades.length*2;
  const overall=score>=max*.8?{symbol:"◎",text:"参考帯内が多い"}:score>=max*.55?{symbol:"○",text:"一部確認"}:{symbol:"△",text:"再確認候補"};

  box.innerHTML=`<div class="romResultMain"><b>${esc(payload.depthLabel)}</b><br>総合判定：<b>${overall.symbol} ${esc(overall.text)}</b><br>検出側：${esc(payload.sideLabel)}｜ランドマーク信頼度 ${Math.round(payload.visibility*100)}%</div>
  <div class="romMetrics">
    ${romMetricCard("膝関節角度",romRound(payload.kneeAngle),"knee","股関節−膝−足首",payload.kneeAngle)}
    ${romMetricCard("股関節角度",romRound(payload.hipAngle),"hip","肩−股関節−膝",payload.hipAngle)}
    ${romMetricCard("足関節角度",romRound(payload.ankleAngle),"ankle","膝−足首−つま先",payload.ankleAngle)}
    ${romMetricCard("体幹前傾",romRound(payload.trunkAngle),"trunk","体幹線と鉛直の角度",payload.trunkAngle)}
    ${romMetricCard("左右膝角差",lrText,"lr","両側が十分見える場合のみ参考表示",payload.lrKneeDiff)}
    ${romMetricCard("深度差",`${depthPct.toFixed(1)}%`,"depth","画像高に対する股関節−膝の縦差",depthPct)}
  </div>
  <div class="notice" style="margin-top:9px"><b>ROM判定：</b>${esc(payload.advice)}</div>
  <div class="romLegend">S.u.G参考レンジはフォーム比較用の目安です。体格・スクワットスタイル・撮影条件で変動します。医療診断や競技審判の基準ではありません。</div>
  <button class="secondary" style="width:100%;margin-top:9px" onclick="saveRomResult()">このROM判定を保存</button>`;
  renderRomHistory();
}
window.__SUG_ROM_ERROR__=function(msg){
  const box=document.getElementById("romResult");if(box)box.innerHTML=`<div class="smartWarn"><b>ROM解析できませんでした</b><br>${esc(msg)}</div>`;
}


function renderRomCareAll() {
  [
    renderCareHistory,
    renderCareResponseProfile,
    renderCareFollowupPanel,
    renderCareReferralGate,
    renderMedicalFeedbackHistory,
    renderAromHistory,
    renderAromAsymmetry,
    renderAromReference,
    renderShrHistory,
    renderMovementHistory,
    renderMoveGuide,
    renderJointByJoint,
    renderIntegratedAssessment,
    renderIntegratedHistory,
    renderRomHistory
  ].forEach(render => {
    try { render(); } catch (error) { console.error(`ROM/CARE render failed: ${render.name}`, error); }
  });
}
function bootRomCareEngine() {
  ['romDate', 'aromDate', 'shrDate', 'moveDate', 'medicalVisitDate'].forEach(id => {
    const element = document.getElementById(id);
    if (element && !element.value) element.value = today();
  });
  try { renderCareQuestions(); } catch (error) { console.error('CARE questions', error); }
  updateMapLocationLabels();
  renderRomCareAll();
}
window.SuGRomCareEngine = Object.freeze({
  version: '27.82',
  boot: bootRomCareEngine,
  renderAll: renderRomCareAll,
  buildIntegratedAssessment,
  careReferralGate,
  aromReference: AROM_REFERENCE
});
window.addEventListener('sug:rom-care:data-ready', bootRomCareEngine);
window.addEventListener('sug:rom-care:data-change', renderRomCareAll);
