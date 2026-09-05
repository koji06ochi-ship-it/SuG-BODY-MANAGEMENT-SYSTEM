(() => {
  'use strict';

  const root = typeof window === 'object' ? window : globalThis;
  const VERSION = '27.82';
  const STORAGE_KEY = 'sug_beauty_initial_assessment_v1';
  const DRAFT_KEY = 'sug_beauty_initial_assessment_draft_v1';
  const PHOTO_DB = 'sug_body_photos_v1';
  const PHOTO_STORE = 'photos';
  const VIEWS = Object.freeze(['front', 'side', 'back']);
  const STEP_LABELS = Object.freeze(['PHOTO', 'RIB', 'T-SPINE', 'HIP', 'SHOULDER', 'FLEX', 'TOP3']);

  const ISSUE_CATALOG = Object.freeze({
    ribPelvis: {
      label: '胸郭―骨盤ポジション',
      why: '肋骨が前方へ開き腰椎伸展で代償すると、腹部が前方へ見えやすく、ウエストとデコルテのつながりへ影響する可能性があります。',
      what: '呼気で肋骨を下げたまま骨盤上へ胸郭を重ね、吸気を背面・側方へ広げる再現性を作ります。',
      how: ['90/90呼吸 4呼吸×2', 'ロングエクスヘイル・リーチ 5呼吸', 'デッドバグ 6回×2']
    },
    thoracicExtension: {
      label: '胸椎伸展不足',
      why: '胸椎伸展が使いにくいと、胸を開く動作を腰椎伸展や肩すくみで代償し、デコルテ・背中・肩のラインが出にくくなる可能性があります。',
      what: '腰を反らさず胸椎で伸展する動きと、肋骨位置を保った上肢挙上を作ります。',
      how: ['フォームローラー胸椎伸展 6回', 'ベンチ胸椎モビリティ 6回×2', 'ウォールスライド 8回×2']
    },
    thoracicRotation: {
      label: '胸椎回旋左右差',
      why: '胸郭の回旋左右差は、肩・ウエスト・骨盤ラインの左右差として見える可能性があります。',
      what: '骨盤を固定して胸椎回旋を左右同条件で再現し、差の大きい側を追跡します。',
      how: ['オープンブック 6回×2', '四つ這い胸椎回旋 6回×2', 'ハーフニーリング回旋 6回×2']
    },
    hipExtension: {
      label: '股関節伸展不足',
      why: '股関節伸展が使いにくいと骨盤前傾や腰椎伸展へ逃げやすく、ヒップ上部・臀部―ハム境界・脚の後面ラインへ影響する可能性があります。',
      what: '骨盤を中間位に保った股関節伸展と、臀部で支持する動きを作ります。',
      how: ['ハーフニーリング股関節前面モビリティ 30秒×2', 'グルートブリッジ 10回×2', 'スプリットスタンスRDL 8回×2']
    },
    hipRotation: {
      label: '股関節回旋左右差',
      why: '股関節内旋・外旋の左右差は、骨盤・膝・足部の向きと脚ラインの左右差へつながる可能性があります。',
      what: '骨盤を動かし過ぎず、内旋・外旋を左右同じ条件で使える範囲を増やします。',
      how: ['90/90ヒップスイッチ 6回', '座位股関節内旋リフト 6回×2', '片脚支持ドリル 20秒×2']
    },
    shoulderRom: {
      label: '肩ROM左右差',
      why: '上肢挙上の左右差は、肩の高さ・腕のライン・デコルテ・背中の左右差として見える可能性があります。',
      what: '胸郭位置を保った肩屈曲と、左右同じ軌道で上肢を挙げる動きを作ります。',
      how: ['広背筋モビリティ 30秒×2', '壁面肩屈曲 8回×2', '軽負荷Yレイズ 8回×2']
    },
    scapular: {
      label: '肩甲骨左右差',
      why: '肩甲骨位置や上方回旋の左右差は、肩ライン・鎖骨周囲・背中の広がり方へ影響する可能性があります。',
      what: '胸郭上で肩甲骨が上方回旋・後傾する動きと、肩すくみを抑えた挙上を作ります。',
      how: ['前鋸筋リーチ 8回×2', 'ウォールスライド＋リフトオフ 6回×2', '下部僧帽筋Y 8回×2']
    },
    straddle: {
      label: '開脚制限',
      why: '開脚の使いにくさは、内もも・股関節・骨盤の位置調整を難しくし、脚ラインの作り分けへ影響する可能性があります。',
      what: '痛みのない範囲で股関節外転と骨盤前傾の分離を改善し、同じ条件で角度を追跡します。',
      how: ['アダクターロックバック 8回×2', 'サイドランジ・ロック 6回×2', '開脚呼吸 4呼吸×2']
    },
    forwardFold: {
      label: '前屈制限',
      why: '前屈の使いにくさは、骨盤と股関節の分離や脚後面の動きに影響し、ヒップ―ハムのライン作りで腰へ代償しやすくなる可能性があります。',
      what: '膝をロックし過ぎず、股関節から骨盤を前へ傾ける動きと脚後面の許容量を作ります。',
      how: ['ハムストリング・フロス 8回×2', 'ヒップヒンジ壁タッチ 8回×2', '呼気を使った前屈 4呼吸']
    }
  });

  const SCALE_OPTIONS = Object.freeze({
    posture: [[0, '安定'], [1, '軽度'], [2, '明確'], [3, '強い']],
    bodyAsymmetry: [[0, 'なし'], [1, '軽度'], [2, '明確'], [3, '強い']],
    shoulderLine: [[0, 'なし'], [1, '軽度'], [2, '明確'], [3, '強い']],
    waistLine: [[0, 'なし'], [1, '軽度'], [2, '明確'], [3, '強い']],
    pelvisLine: [[0, 'なし'], [1, '軽度'], [2, '明確'], [3, '強い']],
    legLine: [[0, 'なし'], [1, '軽度'], [2, '明確'], [3, '強い']],
    ribFlare: [[0, 'なし'], [1, '軽度'], [2, '明確'], [3, '強い']],
    ribAsymmetry: [[0, 'なし'], [1, '軽度'], [2, '明確'], [3, '強い']],
    breathingExpansion: [[1, '小'], [2, '低'], [3, '中'], [4, '良'], [5, '良好']],
    ribPelvisStack: [[0, '良好'], [1, '軽度'], [2, '明確'], [3, '強い']],
    thoracicExtensionQuality: [[1, '制限'], [2, '低'], [3, '中'], [4, '良'], [5, '良好']],
    scapularAsymmetry: [[0, 'なし'], [1, '軽度'], [2, '明確'], [3, '強い']],
    overheadMovementQuality: [[1, '代償'], [2, '低'], [3, '中'], [4, '良'], [5, '良好']]
  });

  const number = value => value === '' || value == null || !Number.isFinite(Number(value)) ? null : Number(value);
  const present = value => value !== '' && value != null;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const absDiff = (a, b) => number(a) == null || number(b) == null ? null : Math.abs(number(a) - number(b));

  function calculate(input = {}) {
    const values = input.values || input;
    const photos = input.photos || {};
    const imported = input.imported || {};
    const scored = Object.fromEntries(Object.keys(ISSUE_CATALOG).map(key => [key, { key, score: 0, evidence: [] }]));
    const add = (key, score, evidence) => {
      if (!scored[key] || !Number.isFinite(score) || score <= 0) return;
      scored[key].score += score;
      if (evidence) scored[key].evidence.push(evidence);
    };

    const concern = key => number(values[key]);
    const ribFlare = concern('ribFlare');
    const ribStack = concern('ribPelvisStack');
    const breathing = number(values.breathingExpansion);
    if (ribFlare != null) add('ribPelvis', ribFlare * 22, `RIB FLARE ${ribFlare}/3`);
    if (ribStack != null) add('ribPelvis', ribStack * 20, `胸郭―骨盤位置 ${ribStack}/3`);
    if (concern('ribAsymmetry') != null) add('ribPelvis', concern('ribAsymmetry') * 10, `胸郭左右差 ${concern('ribAsymmetry')}/3`);
    if (breathing != null) add('ribPelvis', Math.max(0, 5 - breathing) * 12, `胸郭拡張 ${breathing}/5`);
    if (concern('waistLine') != null) add('ribPelvis', concern('waistLine') * 8, `ウエストライン ${concern('waistLine')}/3`);
    if (concern('posture') != null) add('ribPelvis', concern('posture') * 5, `姿勢 ${concern('posture')}/3`);

    const thoracicQuality = number(values.thoracicExtensionQuality);
    if (thoracicQuality != null) add('thoracicExtension', Math.max(0, 5 - thoracicQuality) * 18, `胸椎伸展 ${thoracicQuality}/5`);
    const thoracicDiff = absDiff(values.thoracicRotationRight, values.thoracicRotationLeft);
    if (thoracicDiff != null) add('thoracicRotation', thoracicDiff >= 20 ? 78 : thoracicDiff >= 10 ? 50 : thoracicDiff >= 5 ? 22 : 4, `右 ${number(values.thoracicRotationRight)}° / 左 ${number(values.thoracicRotationLeft)}° / 差 ${thoracicDiff.toFixed(0)}°`);
    if (concern('bodyAsymmetry') != null) add('thoracicRotation', concern('bodyAsymmetry') * 6, `全身左右差 ${concern('bodyAsymmetry')}/3`);

    const hipExtR = number(values.hipExtensionRight), hipExtL = number(values.hipExtensionLeft);
    if (hipExtR != null && hipExtL != null) {
      const minHip = Math.min(hipExtR, hipExtL), diff = Math.abs(hipExtR - hipExtL);
      add('hipExtension', minHip < 10 ? 72 : minHip < 15 ? 42 : 8, `右 ${hipExtR}° / 左 ${hipExtL}°`);
      if (diff >= 5) add('hipExtension', Math.min(28, diff * 3), `伸展左右差 ${diff.toFixed(0)}°`);
    }
    if (values.pelvisTilt && values.pelvisTilt !== 'neutral') add('hipExtension', values.pelvisTilt === 'unclear' ? 8 : 22, `骨盤傾斜 ${values.pelvisTilt}`);
    if (concern('pelvisLine') != null) add('hipExtension', concern('pelvisLine') * 7, `骨盤ライン ${concern('pelvisLine')}/3`);

    const hipIrDiff = absDiff(values.hipInternalRotationRight, values.hipInternalRotationLeft);
    const hipErDiff = absDiff(values.hipExternalRotationRight, values.hipExternalRotationLeft);
    const hipRotDiff = Math.max(hipIrDiff || 0, hipErDiff || 0);
    if (hipIrDiff != null) add('hipRotation', hipIrDiff >= 10 ? 48 : hipIrDiff >= 5 ? 22 : 4, `内旋左右差 ${hipIrDiff.toFixed(0)}°`);
    if (hipErDiff != null) add('hipRotation', hipErDiff >= 10 ? 48 : hipErDiff >= 5 ? 22 : 4, `外旋左右差 ${hipErDiff.toFixed(0)}°`);
    if (hipRotDiff && concern('legLine') != null) add('hipRotation', concern('legLine') * 7, `脚ライン ${concern('legLine')}/3`);

    const shoulderPairs = [
      ['肩屈曲', values.shoulderFlexionRight, values.shoulderFlexionLeft, 140, 155],
      ['肩外転', values.shoulderAbductionRight, values.shoulderAbductionLeft, 140, 160],
      ['肩外旋', values.shoulderExternalRotationRight, values.shoulderExternalRotationLeft, 70, 85]
    ];
    shoulderPairs.forEach(([label, rightValue, leftValue, low, near]) => {
      const right = number(rightValue), left = number(leftValue); if (right == null || left == null) return;
      const minimum = Math.min(right, left), diff = Math.abs(right - left);
      add('shoulderRom', minimum < low ? 70 : minimum < near ? 40 : 6, `${label} 右 ${right}° / 左 ${left}°`);
      if (diff >= 10) add('shoulderRom', Math.min(55, diff * 3), `${label}左右差 ${diff.toFixed(0)}°`);
    });
    const scap = concern('scapularAsymmetry'), overhead = number(values.overheadMovementQuality);
    if (scap != null) add('scapular', scap * 22, `肩甲骨位置 ${scap}/3`);
    if (overhead != null) add('scapular', Math.max(0, 5 - overhead) * 15, `上肢挙上 ${overhead}/5`);
    if (concern('shoulderLine') != null) add('scapular', concern('shoulderLine') * 9, `肩ライン ${concern('shoulderLine')}/3`);
    if (number(imported.shrScapularDiff) != null) add('scapular', number(imported.shrScapularDiff) >= 10 ? 45 : number(imported.shrScapularDiff) >= 5 ? 20 : 4, `SHR肩甲骨差 ${number(imported.shrScapularDiff).toFixed(0)}°`);
    if (number(imported.overheadArmAsymmetry) != null) add('shoulderRom', number(imported.overheadArmAsymmetry) >= 10 ? 45 : 8, `動作スクリーン左右差 ${number(imported.overheadArmAsymmetry).toFixed(0)}°`);

    const straddle = number(values.straddleAngle);
    if (straddle != null) add('straddle', straddle < 90 ? 82 : straddle < 120 ? 58 : straddle < 150 ? 32 : 6, `開脚 ${straddle.toFixed(0)}°`);
    const forward = number(values.forwardFoldCm);
    if (forward != null) add('forwardFold', forward > 15 ? 78 : forward > 5 ? 55 : forward > 0 ? 32 : 5, `指先―床 ${forward > 0 ? '+' : ''}${forward.toFixed(1)}cm`);

    const issues = Object.values(scored).map(item => ({
      ...ISSUE_CATALOG[item.key],
      key: item.key,
      score: Math.round(clamp(item.score, 0, 100)),
      evidence: item.evidence.length ? item.evidence : ['入力範囲では優先度低。前回差を継続確認']
    })).sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'ja'));

    const sections = {
      photo: VIEWS.filter(view => photos[view]).length === 3 && ['posture', 'bodyAsymmetry', 'shoulderLine', 'waistLine', 'pelvisLine', 'legLine'].filter(key => present(values[key])).length >= 3,
      rib: ['ribFlare', 'ribAsymmetry', 'breathingExpansion', 'ribPelvisStack'].filter(key => present(values[key])).length >= 3,
      thoracic: present(values.thoracicExtensionQuality) && present(values.thoracicRotationRight) && present(values.thoracicRotationLeft),
      hip: present(values.pelvisTilt) && present(values.hipExtensionRight) && present(values.hipExtensionLeft),
      shoulder: present(values.shoulderFlexionRight) && present(values.shoulderFlexionLeft) && present(values.scapularAsymmetry),
      flexibility: present(values.forwardFoldCm) && present(values.straddleAngle)
    };
    const completeSections = Object.values(sections).filter(Boolean).length;
    return { version: VERSION, top3: issues.slice(0, 3), issues, quality: { completeSections, totalSections: 6, sections }, generatedAt: new Date().toISOString() };
  }

  const state = {
    step: 0,
    type: 'initial',
    values: {},
    photos: { front: false, side: false, back: false },
    imported: {},
    result: null,
    lastSavedId: ''
  };
  const objectUrls = new Map();
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const today = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const records = () => read(STORAGE_KEY, []);

  function photoDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(PHOTO_DB, 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(PHOTO_STORE)) request.result.createObjectStore(PHOTO_STORE); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function photoPut(key, blob) {
    const db = await photoDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTO_STORE, 'readwrite');
      transaction.objectStore(PHOTO_STORE).put(blob, key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }
  async function photoGet(key) {
    const db = await photoDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(PHOTO_STORE).objectStore(PHOTO_STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  async function photoDelete(key) {
    const db = await photoDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTO_STORE, 'readwrite');
      transaction.objectStore(PHOTO_STORE).delete(key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }
  const draftPhotoKey = view => `beauty-assessment:draft:${view}`;

  function snapshot() {
    return { type: state.type, values: { ...state.values }, photos: { ...state.photos }, imported: { ...state.imported } };
  }
  function saveDraft() {
    write(DRAFT_KEY, { version: VERSION, ...snapshot(), step: state.step, lastSavedId: state.lastSavedId, updatedAt: new Date().toISOString() });
  }
  function restoreDraft() {
    const draft = read(DRAFT_KEY, null);
    state.values = { assessmentDate: today(), eventDate: '', ...(draft?.values || {}) };
    state.type = draft?.type === 'reassessment' ? 'reassessment' : 'initial';
    state.photos = { front: false, side: false, back: false, ...(draft?.photos || {}) };
    state.imported = draft?.imported || {};
    state.step = Math.max(0, Math.min(6, Number(draft?.step) || 0));
    state.lastSavedId = draft?.lastSavedId || '';
  }

  function renderProgress() {
    const progress = $('assessmentProgress');
    progress.innerHTML = STEP_LABELS.map((label, index) => `<button type="button" title="${label}" aria-label="${label}" class="${index < state.step ? 'done' : index === state.step ? 'active' : ''}" data-progress-step="${index}">${label}</button>`).join('');
    progress.querySelectorAll('button').forEach(button => button.onclick = () => { if (Number(button.dataset.progressStep) <= state.step) go(Number(button.dataset.progressStep)); });
  }
  function renderScales() {
    document.querySelectorAll('[data-scale]').forEach(container => {
      const key = container.dataset.scale, options = SCALE_OPTIONS[key] || [];
      container.classList.toggle('five', options.length === 5);
      container.innerHTML = options.map(([value, label]) => `<button type="button" data-value="${value}" class="${number(state.values[key]) === value ? 'active' : ''}"><b>${value}</b>${esc(label)}</button>`).join('');
      container.querySelectorAll('button').forEach(button => button.onclick = () => { state.values[key] = Number(button.dataset.value); renderScales(); saveDraft(); });
    });
  }
  function renderFields() {
    document.querySelectorAll('[data-field]').forEach(field => {
      const key = field.dataset.field;
      if (document.activeElement !== field) field.value = state.values[key] ?? '';
    });
    document.querySelectorAll('#assessmentType button').forEach(button => button.classList.toggle('active', button.dataset.type === state.type));
  }
  function renderPhotoStatus() {
    const count = VIEWS.filter(view => state.photos[view]).length;
    $('photoStatus').textContent = `写真 ${count} / 3${count === 3 ? '｜3方向ベースライン準備済み' : '｜同条件の3方向写真を登録'}`;
    $('photoStatus').className = `statusLine ${count === 3 ? 'ok' : 'warn'}`;
  }
  function go(step) {
    state.step = Math.max(0, Math.min(6, Number(step) || 0));
    document.querySelectorAll('[data-assessment-step]').forEach(panel => panel.classList.toggle('active', Number(panel.dataset.assessmentStep) === state.step));
    renderProgress();
    if (state.step === 6) renderResult();
    saveDraft();
    scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderResult() {
    state.result = calculate(snapshot());
    syncBeautyEngine();
    const quality = state.result.quality;
    $('assessmentQuality').className = `qualityBox ${quality.completeSections < quality.totalSections ? 'warn' : ''}`;
    $('assessmentQuality').innerHTML = `<b>DATA QUALITY ${quality.completeSections} / ${quality.totalSections}</b><br>${quality.completeSections === quality.totalSections ? '6領域の入力がそろっています。再評価では同じ測定条件を使ってください。' : '未入力領域があります。TOP3は入力済みデータ内の優先候補であり、確定診断ではありません。'}`;
    $('assessmentTop3').innerHTML = state.result.top3.map((issue, index) => `<article class="priorityCard"><div class="priorityHead"><div><i class="priorityNo">${index + 1}</i><h3>${esc(issue.label)}</h3></div><span>${issue.score >= 60 ? 'HIGH' : issue.score >= 30 ? 'CHECK' : 'MONITOR'} · ${issue.score}</span></div><div class="evidence">根拠：${issue.evidence.map(esc).join('｜')}</div><div class="explainGrid"><div><b>WHY</b><p>${esc(issue.why)}</p></div><div><b>WHAT</b><p>${esc(issue.what)}</p></div><div><b>HOW</b><ul>${issue.how.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div></div></article>`).join('');
    $('assessmentMenu').innerHTML = state.result.top3.flatMap((issue, issueIndex) => issue.how.slice(0, 2).map((item, itemIndex) => `<div class="menuRow"><i>${issueIndex + 1}.${itemIndex + 1}</i><div><b>${esc(item)}</b><span>${esc(issue.label)}｜痛みのない範囲で実施し、同条件で再評価</span></div></div>`)).join('');
    renderComparison();
    renderHistory();
  }

  function syncBeautyEngine() {
    const values = state.values;
    try {
      root.SuGBeautyBody?.setPosture?.({
        ribFlare: number(values.ribFlare),
        thoracicRestriction: number(values.thoracicExtensionQuality) == null ? null : Math.max(0, 5 - number(values.thoracicExtensionQuality)),
        scapularAnteriorTilt: number(values.scapularAsymmetry),
        forwardHead: number(values.posture)
      });
      root.SuGBeautyBody?.setGait?.({
        hipExtensionRestriction: Math.max(0, 3 - Math.min(number(values.hipExtensionRight) ?? 20, number(values.hipExtensionLeft) ?? 20) / 5),
        strideAsymmetryPct: absDiff(values.hipExtensionRight, values.hipExtensionLeft),
        pelvicDrop: number(values.pelvisLine),
        kneeValgus: number(values.legLine)
      });
    } catch (error) { console.warn('Beauty engine assessment sync skipped', error); }
  }

  function sortAt(rows) {
    return [...rows].sort((a, b) => String(a.savedAt || '').localeCompare(String(b.savedAt || '')));
  }
  function latestArom(rows, key, side) {
    return sortAt((rows || []).filter(row => row.key === key && (!side || row.side === side))).at(-1) || null;
  }
  async function importRomCare() {
    const status = $('romCareImportStatus');
    status.textContent = 'BODYセッションと共通データを確認中…'; status.className = 'statusLine';
    if (!root.SuGRomCareData?.boot) { status.textContent = '共通ROM / CAREモジュールを読み込めません。'; status.className = 'statusLine bad'; return; }
    const result = await root.SuGRomCareData.boot();
    if (!result?.ok) { status.textContent = 'BODYログイン済みセッションがないため反映できません。手入力は継続できます。'; status.className = 'statusLine warn'; return; }
    const member = root.SuGRomCareData.member() || {}, rows = member.aromAssessments || [], applied = [];
    const apply = (key, side, field) => {
      const row = latestArom(rows, key, side);
      if (!row || number(row.active) == null) return;
      state.values[field] = number(row.active); applied.push(`${row.label || key}${side ? ` ${side === 'right' ? '右' : '左'}` : ''}`);
    };
    apply('thoracic_ext', null, 'thoracicExtensionDeg');
    apply('thoracic_rot', 'right', 'thoracicRotationRight'); apply('thoracic_rot', 'left', 'thoracicRotationLeft');
    apply('hip_ext', 'right', 'hipExtensionRight'); apply('hip_ext', 'left', 'hipExtensionLeft');
    apply('hip_ir', 'right', 'hipInternalRotationRight'); apply('hip_ir', 'left', 'hipInternalRotationLeft');
    apply('hip_er', 'right', 'hipExternalRotationRight'); apply('hip_er', 'left', 'hipExternalRotationLeft');
    apply('shoulder_flex', 'right', 'shoulderFlexionRight'); apply('shoulder_flex', 'left', 'shoulderFlexionLeft');
    apply('shoulder_abd', 'right', 'shoulderAbductionRight'); apply('shoulder_abd', 'left', 'shoulderAbductionLeft');
    apply('shoulder_er', 'right', 'shoulderExternalRotationRight'); apply('shoulder_er', 'left', 'shoulderExternalRotationLeft');
    const shr = sortAt(member.shrAssessments || []), leftShr = shr.filter(row => row.side === 'left').at(-1), rightShr = shr.filter(row => row.side === 'right').at(-1);
    if (leftShr && rightShr && number(leftShr.scap) != null && number(rightShr.scap) != null) state.imported.shrScapularDiff = Math.abs(number(leftShr.scap) - number(rightShr.scap));
    const overhead = sortAt((member.movementScreens || []).filter(row => row.type === 'overhead_front')).at(-1);
    if (number(overhead?.metrics?.armAsym) != null) state.imported.overheadArmAsymmetry = number(overhead.metrics.armAsym);
    state.imported.romCareAt = new Date().toISOString(); state.imported.sources = [...new Set(applied)];
    const local = records(), remote = Array.isArray(member.beautyAssessments) ? member.beautyAssessments : [];
    if (remote.length) {
      const merged = new Map([...remote, ...local].map(record => [record.id, record]));
      write(STORAGE_KEY, sortAt([...merged.values()]).reverse().slice(0, 24));
    }
    renderFields(); saveDraft(); renderHistory();
    status.textContent = applied.length ? `${[...new Set(applied)].length}項目を反映しました。` : '共通データは同期済みですが、対象ROM記録はまだありません。';
    status.className = `statusLine ${applied.length ? 'ok' : 'warn'}`;
  }

  async function setPhotoPreview(view, blob, targetId = `assessmentPhoto${view[0].toUpperCase()}${view.slice(1)}`) {
    const image = $(targetId); if (!image) return;
    const old = objectUrls.get(targetId); if (old) URL.revokeObjectURL(old);
    if (!blob) { image.removeAttribute('src'); image.style.visibility = 'hidden'; objectUrls.delete(targetId); return; }
    const url = URL.createObjectURL(blob); objectUrls.set(targetId, url); image.src = url; image.style.visibility = 'visible';
  }
  async function loadDraftPhotos() {
    for (const view of VIEWS) {
      try { const blob = await photoGet(draftPhotoKey(view)); state.photos[view] = !!blob; await setPhotoPreview(view, blob); } catch (error) { console.warn(`Draft photo ${view}`, error); }
    }
    renderPhotoStatus(); saveDraft();
  }

  async function saveAssessment() {
    if (!state.result) renderResult();
    const id = state.lastSavedId || `beauty-${Date.now()}`;
    const photoKeys = {};
    for (const view of VIEWS) {
      const blob = await photoGet(draftPhotoKey(view));
      if (blob) { const key = `beauty-assessment:${id}:${view}`; await photoPut(key, blob); photoKeys[view] = key; }
    }
    const record = { id, version: VERSION, type: state.type, assessmentDate: state.values.assessmentDate || today(), eventDate: state.values.eventDate || '', values: { ...state.values }, imported: { ...state.imported }, result: state.result, photoKeys, photoAvailable: { ...state.photos }, savedAt: new Date().toISOString() };
    let rows = records().filter(row => row.id !== id); rows.unshift(record); write(STORAGE_KEY, rows.slice(0, 24));
    state.lastSavedId = id; saveDraft();
    if (root.SuGRomCareData?.isReady?.()) {
      const member = root.SuGRomCareData.member(); member.beautyAssessments = Array.isArray(member.beautyAssessments) ? member.beautyAssessments.filter(row => row.id !== id) : [];
      member.beautyAssessments.unshift({ ...record, photoKeys: {}, photoAvailable: { ...state.photos } });
      member.beautyAssessments = member.beautyAssessments.slice(0, 24); root.SuGRomCareData.persist(0);
    }
    $('assessmentSaveStatus').textContent = `${state.type === 'initial' ? '初回評価' : '再評価'}を保存しました。`; $('assessmentSaveStatus').className = 'statusLine ok';
    renderComparison(); renderHistory();
  }

  async function renderComparison() {
    const target = $('assessmentComparison'); if (!target) return;
    const chronological = sortAt(records()), before = chronological.find(row => row.type === 'initial') || chronological[0], after = [...chronological].reverse().find(row => row.type === 'reassessment');
    if (!before) { target.innerHTML = '<div class="statusLine">初回評価を保存すると比較を開始できます。</div>'; return; }
    target.innerHTML = `<div class="compareGrid">${VIEWS.map(view => `<div class="compareView"><b>${view === 'front' ? '正面' : view === 'side' ? '側面' : '背面'}</b><div class="comparePair"><div><span>BEFORE ${esc(before.assessmentDate || '')}</span><div class="emptyPhoto" id="compareBeforeEmpty${view}">写真なし</div><img id="compareBefore${view}" alt="Before ${view}" hidden></div><div><span>AFTER ${esc(after?.assessmentDate || '未評価')}</span><div class="emptyPhoto" id="compareAfterEmpty${view}">${after ? '写真なし' : '再評価待ち'}</div><img id="compareAfter${view}" alt="After ${view}" hidden></div></div></div>`).join('')}</div>`;
    for (const view of VIEWS) {
      for (const [prefix, record] of [['Before', before], ['After', after]]) {
        const key = record?.photoKeys?.[view]; if (!key) continue;
        const blob = await photoGet(key); if (!blob) continue;
        const image = $(`compare${prefix}${view}`), empty = $(`compare${prefix}Empty${view}`), objectKey = `compare${prefix}${view}`;
        const old = objectUrls.get(objectKey); if (old) URL.revokeObjectURL(old);
        const url = URL.createObjectURL(blob); objectUrls.set(objectKey, url); image.src = url; image.hidden = false; empty.hidden = true;
      }
    }
  }
  function renderHistory() {
    const target = $('assessmentHistory'); if (!target) return;
    const rows = records();
    target.innerHTML = rows.length ? rows.map(record => `<div class="historyItem"><b>${record.type === 'initial' ? '初回評価' : '再評価'}｜${esc(record.assessmentDate || '')}</b><span>${(record.result?.top3 || []).map((issue, index) => `${index + 1}. ${issue.label}`).join('｜') || '結果なし'}</span><small>DATA QUALITY ${record.result?.quality?.completeSections ?? 0}/6${record.eventDate ? `｜大会・撮影 ${esc(record.eventDate)}` : ''}</small></div>`).join('') : '<div class="statusLine">評価履歴はまだありません。</div>';
  }

  async function startReassessment() {
    for (const view of VIEWS) { try { await photoDelete(draftPhotoKey(view)); } catch {} }
    state.type = 'reassessment'; state.values = { assessmentDate: today(), eventDate: state.values.eventDate || '' }; state.photos = { front: false, side: false, back: false }; state.imported = {}; state.result = null; state.lastSavedId = '';
    renderFields(); renderScales(); await loadDraftPhotos(); go(0);
  }

  function reassessmentRequested() {
    return new URLSearchParams(root.location?.search || '').get('mode') === 'reassessment' && records().length > 0;
  }

  function consumeReassessmentRequest() {
    if (!root.history?.replaceState || !root.location?.href) return;
    const url = new URL(root.location.href);
    url.searchParams.delete('mode');
    root.history.replaceState({}, '', url.toString());
  }

  function bind() {
    document.querySelectorAll('[data-next]').forEach(button => button.onclick = () => go(state.step + 1));
    document.querySelectorAll('[data-back]').forEach(button => button.onclick = () => go(state.step - 1));
    document.querySelector('[data-result]').onclick = () => go(6);
    document.querySelectorAll('[data-field]').forEach(field => { const update = () => { state.values[field.dataset.field] = field.type === 'number' ? number(field.value) : field.value; saveDraft(); }; field.addEventListener('input', update); field.addEventListener('change', update); });
    document.querySelectorAll('#assessmentType button').forEach(button => button.onclick = () => { state.type = button.dataset.type; state.lastSavedId = ''; renderFields(); saveDraft(); });
    document.querySelectorAll('[data-photo]').forEach(input => input.onchange = async () => { const file = input.files?.[0]; if (!file) return; await photoPut(draftPhotoKey(input.dataset.photo), file); state.photos[input.dataset.photo] = true; await setPhotoPreview(input.dataset.photo, file); renderPhotoStatus(); saveDraft(); });
    $('importRomCare').onclick = importRomCare;
    $('saveAssessment').onclick = saveAssessment;
    $('startReassessment').onclick = startReassessment;
  }
  async function boot() {
    const startFromRomCare = reassessmentRequested();
    restoreDraft(); bind(); renderFields(); renderScales(); renderPhotoStatus(); renderHistory(); renderComparison();
    if (startFromRomCare) {
      consumeReassessmentRequest();
      await startReassessment();
      return;
    }
    await loadDraftPhotos(); go(state.step);
  }

  root.SuGBeautyAssessment = Object.freeze({ version: VERSION, issueCatalog: ISSUE_CATALOG, calculate, current: () => ({ ...snapshot(), result: state.result }), records });
  if (typeof document === 'object') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
  }
})();
