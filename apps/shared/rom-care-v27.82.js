(() => {
  'use strict';
  const VERSION = '27.82';
  const MESSAGE_SET_SECTION = 'sug:rom-care:set-section';
  const MESSAGE_READY = 'sug:rom-care:ready';
  const MESSAGE_SECTION = 'sug:rom-care:section';
  const COLLECTIONS = Object.freeze([
    'selfCare', 'romAssessments', 'aromAssessments', 'shrAssessments',
    'movementScreens', 'integratedAssessments', 'medicalReferrals'
  ]);
  const FEATURES = Object.freeze([
    'rom-image', 'arom-prom', 'asymmetry', 'shr', 'thoracic-rom',
    'joint-by-joint', 'movement-screen', 'care-response', '24h-follow-up',
    'integrated-care-decision', 'medical-referral-gate'
  ]);
  const ROM_REFERENCE = Object.freeze({
    knee: Object.freeze({ ideal: [70, 90], warn: [60, 100], label: '参考 70〜90°' }),
    hip: Object.freeze({ ideal: [55, 75], warn: [45, 85], label: '参考 55〜75°' }),
    ankle: Object.freeze({ ideal: [95, 115], warn: [90, 120], label: '参考 95〜115°' }),
    trunk: Object.freeze({ ideal: [25, 45], warn: [20, 50], label: '参考 25〜45°' }),
    depth: Object.freeze({ ideal: [-3, 3], warn: [-5, 5], label: '参考 -3.0〜+3.0%' }),
    lr: Object.freeze({ ideal: [0, 10], warn: [0, 15], label: '参考 0〜10°' })
  });

  const root = typeof window === 'object' ? window : globalThis;
  const doc = typeof document === 'object' ? document : null;
  const scriptUrl = (() => {
    if (!doc) return '';
    if (doc.currentScript?.src) return doc.currentScript.src;
    return [...doc.scripts].map(script => script.src)
      .find(src => /rom-care-v27\.82\.js(?:\?|$)/.test(src)) || '';
  })();

  function normalizeSection(value) {
    return String(value || '').toLowerCase() === 'care' ? 'care' : 'rom';
  }

  function normalizeSource(value) {
    return ['normal', 'miss', 'hub'].includes(value) ? value : 'hub';
  }

  function ensureMemberCollections(member) {
    if (!member || typeof member !== 'object' || Array.isArray(member)) return member;
    COLLECTIONS.forEach(key => {
      if (!Array.isArray(member[key])) member[key] = [];
    });
    return member;
  }

  function aromBand(value, reference) {
    if (value == null || !Number.isFinite(Number(value))) return { symbol: '—', text: '未測定', cls: '' };
    if (reference?.hasNorm === false) return { symbol: '↔', text: '前回・左右比較優先', cls: '' };
    const number = Number(value);
    if (number >= reference.ideal[0] && number <= reference.ideal[1]) return { symbol: '◎', text: '参考帯内', cls: 'ok' };
    if (number >= reference.warn[0] && number <= reference.warn[1]) return { symbol: '○', text: '参考帯付近', cls: 'warn' };
    return { symbol: '△', text: '参考帯外', cls: 'bad' };
  }

  function aromGapThreshold(key) {
    if (['knee_ext', 'elbow_ext'].includes(key)) return 5;
    if (['ankle_df', 'ankle_pf'].includes(key)) return 7;
    return 10;
  }

  function romBand(value, key, references = ROM_REFERENCE) {
    const reference = references[key];
    if (!reference || value == null || !Number.isFinite(Number(value))) return { symbol: '—', text: '判定保留', cls: '' };
    const number = Number(value);
    if (number >= reference.ideal[0] && number <= reference.ideal[1]) return { symbol: '◎', text: '参考帯内', cls: 'ok' };
    if (number >= reference.warn[0] && number <= reference.warn[1]) return { symbol: '○', text: '参考帯付近', cls: 'warn' };
    return { symbol: '△', text: '参考帯外', cls: 'bad' };
  }

  function aromAsymmetryPairs(rows, limit = 12) {
    const grouped = {};
    (Array.isArray(rows) ? rows : []).forEach(row => {
      if (!row || !row.date || !row.key || !['left', 'right'].includes(row.side)) return;
      const groupKey = `${row.date}__${row.key}`;
      grouped[groupKey] ||= { date: row.date, key: row.key, label: row.label || row.key, left: null, right: null };
      grouped[groupKey][row.side] = row;
    });
    return Object.values(grouped).filter(group => group.left && group.right)
      .map(group => ({ ...group,
        diff: Math.abs(Number(group.right.active) - Number(group.left.active)),
        r: Number(group.right.active), l: Number(group.left.active) }))
      .filter(group => Number.isFinite(group.diff)).sort((a, b) => b.diff - a.diff)
      .slice(0, Math.max(0, Number(limit) || 0));
  }

  function queryContext(search = root.location?.search || '') {
    const query = new URLSearchParams(search);
    return {
      native: query.get('native') === 'ios',
      section: normalizeSection(query.get('section')),
      source: normalizeSource(query.get('source')),
      memberId: (query.get('memberId') || query.get('member_id') || '').trim()
    };
  }

  function moduleRelativeUrl(relativePath) {
    const base = scriptUrl || root.location?.href;
    if (!base) return relativePath;
    return new URL(relativePath, base);
  }

  function appendContext(url, options = {}) {
    const context = { ...queryContext(), ...options };
    url.searchParams.set('v', VERSION);
    url.searchParams.set('section', normalizeSection(context.section));
    url.searchParams.set('source', normalizeSource(context.source));
    if (context.native) url.searchParams.set('native', 'ios');
    else url.searchParams.delete('native');
    if (context.memberId) url.searchParams.set('memberId', context.memberId);
    return url;
  }

  function sharedPageUrl(options = {}) {
    return appendContext(moduleRelativeUrl('../body/rom-care-v27.82.html'), options).toString();
  }

  function legacyPageUrl(options = {}) {
    const url = appendContext(moduleRelativeUrl('../../index.html'), options);
    url.searchParams.set('romCareShared', '1');
    return url.toString();
  }

  function returnUrl(options = {}) {
    const context = { ...queryContext(), ...options };
    const relative = context.source === 'normal'
      ? '../body/index.html'
      : context.source === 'miss'
        ? '../body/beauty-initial-assessment-v27.82.html'
        : '../body/hub-v27.82.html';
    const url = moduleRelativeUrl(relative);
    url.searchParams.set('v', VERSION);
    if (context.source === 'miss') url.searchParams.set('mode', 'reassessment');
    if (context.native) url.searchParams.set('native', 'ios');
    if (context.memberId) url.searchParams.set('memberId', context.memberId);
    return url.toString();
  }

  function open(options = {}) {
    if (!root.location) return sharedPageUrl(options);
    root.location.href = sharedPageUrl(options);
    return root.location.href;
  }

  function bindLaunchers(scope = doc) {
    if (!scope?.querySelectorAll) return;
    scope.querySelectorAll('[data-rom-care-launch]').forEach(button => {
      if (button.dataset.romCareBound === '1') return;
      button.dataset.romCareBound = '1';
      button.addEventListener('click', event => {
        event.preventDefault();
        open({
          section: button.dataset.romCareSection,
          source: button.dataset.romCareSource,
          native: queryContext().native
        });
      });
    });
  }

  function postToParent(payload) {
    if (!root.parent || root.parent === root) return;
    const targetOrigin = root.location?.origin && root.location.origin !== 'null' ? root.location.origin : '*';
    root.parent.postMessage(payload, targetOrigin);
  }

  function activateLegacySection(section, announce = true) {
    if (!doc) return false;
    const normalized = normalizeSection(section);
    const tab = doc.querySelector(`.tab[data-tab="${normalized}"]`);
    const panel = doc.getElementById(normalized);
    if (!tab || !panel) return false;
    tab.click();
    doc.body?.classList.add('sug-rom-care-shared-mode');
    if (announce) postToParent({ type: MESSAGE_SECTION, section: normalized, version: VERSION });
    return true;
  }

  function activateStandaloneSection(section, announce = true) {
    if (!doc?.body?.hasAttribute('data-rom-care-runtime')) return false;
    const normalized = normalizeSection(section);
    doc.querySelectorAll('[data-rom-care-mode]').forEach(button => {
      const active = normalizeSection(button.dataset.romCareMode) === normalized;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    doc.querySelectorAll('[data-rom-care-panel]').forEach(panel => {
      panel.classList.toggle('active', panel.dataset.romCarePanel === normalized);
    });
    if (announce) postToParent({ type: MESSAGE_SECTION, section: normalized, version: VERSION });
    return true;
  }

  function initStandaloneRuntime() {
    if (!doc?.body?.hasAttribute('data-rom-care-runtime')) return false;
    if (doc.body.dataset.romCareReady === '1') return true;
    doc.body.dataset.romCareReady = '1';
    const context = queryContext();
    doc.querySelectorAll('[data-rom-care-mode]').forEach(button => {
      button.addEventListener('click', () => activateStandaloneSection(button.dataset.romCareMode));
    });
    root.addEventListener('message', event => {
      if (root.location?.origin && root.location.origin !== 'null' && event.origin !== root.location.origin) return;
      if (event.data?.type !== MESSAGE_SET_SECTION) return;
      activateStandaloneSection(event.data.section);
    });
    activateStandaloneSection(context.section, false);
    postToParent({ type: MESSAGE_READY, section: context.section, features: FEATURES, version: VERSION });
    return true;
  }

  function installLegacyFocusStyle() {
    if (!doc || doc.getElementById('sug-rom-care-shared-style')) return;
    const style = doc.createElement('style');
    style.id = 'sug-rom-care-shared-style';
    style.textContent = [
      'body.sug-rom-care-shared-mode>header{display:none!important}',
      'body.sug-rom-care-shared-mode .wrap{padding-top:0!important}',
      'body.sug-rom-care-shared-mode .wrap>#memberToolbar,body.sug-rom-care-shared-mode .wrap>#sugPrimaryNavigation{display:none!important}',
      'body.sug-rom-care-shared-mode .panel{display:none!important}',
      'body.sug-rom-care-shared-mode #rom.active,body.sug-rom-care-shared-mode #care.active{display:block!important}',
      'body.sug-rom-care-shared-mode #rom,body.sug-rom-care-shared-mode #care{padding-top:4px}'
    ].join('');
    doc.head.appendChild(style);
  }

  function initLegacyRuntime() {
    if (!doc || new URLSearchParams(root.location?.search || '').get('romCareShared') !== '1') return;
    const context = queryContext();
    installLegacyFocusStyle();
    const activate = () => {
      if (!activateLegacySection(context.section, false)) return false;
      postToParent({ type: MESSAGE_READY, section: context.section, features: FEATURES, version: VERSION });
      return true;
    };
    if (!activate()) {
      let attempts = 0;
      const timer = root.setInterval(() => {
        attempts += 1;
        if (activate() || attempts >= 60) root.clearInterval(timer);
      }, 250);
    }
    root.addEventListener('message', event => {
      if (root.location?.origin && root.location.origin !== 'null' && event.origin !== root.location.origin) return;
      if (event.data?.type !== MESSAGE_SET_SECTION) return;
      activateLegacySection(event.data.section);
    });
  }

  const api = Object.freeze({
    version: VERSION,
    collectionNames: COLLECTIONS,
    features: FEATURES,
    ROM_REFERENCE,
    normalizeSection,
    ensureMemberCollections,
    aromBand,
    aromGapThreshold,
    romBand,
    aromAsymmetryPairs,
    queryContext,
    sharedPageUrl,
    legacyPageUrl,
    returnUrl,
    open,
    bindLaunchers,
    activateLegacySection,
    activateStandaloneSection,
    initStandaloneRuntime,
    messages: Object.freeze({ setSection: MESSAGE_SET_SECTION, ready: MESSAGE_READY, section: MESSAGE_SECTION })
  });

  root.SuGRomCare = api;
  if (doc) {
    bindLaunchers();
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => {
      bindLaunchers();
      initStandaloneRuntime();
      initLegacyRuntime();
    });
    else {
      initStandaloneRuntime();
      initLegacyRuntime();
    }
  }
})();
