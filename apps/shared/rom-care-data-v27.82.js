(() => {
  'use strict';

  const VERSION = '27.82';
  const SUPABASE_URL = 'https://nnqzxcgkqjnmtzcvorha.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_zcn7r2YSKDZa1lXJvmk3sg_GulOJXwI';
  const LEGACY_STORAGE_KEY = 'sug-body-management-v4-auth';
  const state = {
    client: null,
    session: null,
    memberId: '',
    member: null,
    profile: null,
    saveTimer: null,
    saving: false,
    ready: false,
    localOnly: false
  };

  function baseMember(name = '会員') {
    return {
      profile: { name },
      weights: [],
      training: [],
      recovery: [],
      selfCare: [],
      romAssessments: [],
      aromAssessments: [],
      shrAssessments: [],
      movementScreens: [],
      integratedAssessments: [],
      medicalReferrals: []
    };
  }

  function status(message, kind = '') {
    const element = document.getElementById('romCareDataStatus');
    if (element) {
      element.textContent = message;
      element.className = `runtimeStatus ${kind}`.trim();
    }
    window.dispatchEvent(new CustomEvent('sug:rom-care:data-status', {
      detail: { message, kind, version: VERSION }
    }));
  }

  function clients() {
    if (!window.supabase?.createClient) return [];
    const common = { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true };
    return [
      window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: common }),
      window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { ...common, storageKey: LEGACY_STORAGE_KEY }
      })
    ];
  }

  async function authenticatedClient() {
    for (const candidate of clients()) {
      try {
        const { data, error } = await candidate.auth.getSession();
        if (!error && data?.session?.user?.id) {
          return { client: candidate, session: data.session };
        }
      } catch (error) {
        console.warn('ROM/CARE session candidate unavailable', error);
      }
    }
    return null;
  }

  async function boot() {
    status('BODYセッションを確認中…');
    const auth = await authenticatedClient();
    if (!auth) {
      state.client = null;
      state.session = null;
      state.memberId = '';
      state.profile = null;
      state.member = baseMember('未接続');
      state.ready = false;
      state.localOnly = true;
      status('共通BODYデータ未接続｜この画面単体でも評価できます');
      window.dispatchEvent(new CustomEvent('sug:rom-care:auth-required', {
        detail: { version: VERSION }
      }));
      return { ok: false, reason: 'NO_SESSION', localOnly: true, member: state.member };
    }

    state.client = auth.client;
    state.session = auth.session;
    state.localOnly = false;
    const sessionId = auth.session.user.id;
    const { data: ownProfile, error: profileError } = await state.client
      .from('profiles')
      .select('id,display_name,role')
      .eq('id', sessionId)
      .maybeSingle();
    if (profileError) {
      status(`会員情報を確認できません：${profileError.message}`, 'bad');
      return { ok: false, reason: 'PROFILE_ERROR', error: profileError };
    }

    const context = window.SuGRomCare?.queryContext?.() || {};
    const requestedId = context.memberId || window.SuGShared?.member?.()?.id || '';
    const canSelectMember = ownProfile?.role === 'trainer';
    state.memberId = canSelectMember && requestedId ? requestedId : sessionId;

    let memberProfile = ownProfile;
    if (state.memberId !== sessionId) {
      const { data } = await state.client
        .from('profiles')
        .select('id,display_name,role')
        .eq('id', state.memberId)
        .maybeSingle();
      if (data) memberProfile = data;
    }
    state.profile = memberProfile || ownProfile || { id: state.memberId, display_name: '会員', role: 'member' };

    const { data: row, error: loadError } = await state.client
      .from('member_data')
      .select('data')
      .eq('user_id', state.memberId)
      .maybeSingle();
    if (loadError) {
      status(`ROM / CAREデータを読み込めません：${loadError.message}`, 'bad');
      return { ok: false, reason: 'LOAD_ERROR', error: loadError };
    }

    const name = state.profile?.display_name || '会員';
    state.member = row?.data && typeof row.data === 'object'
      ? row.data
      : baseMember(name);
    state.member.profile = { ...(state.member.profile || {}), name: state.member.profile?.name || name };
    ['weights', 'training', 'recovery'].forEach(key => {
      if (!Array.isArray(state.member[key])) state.member[key] = [];
    });
    window.SuGRomCare.ensureMemberCollections(state.member);
    state.ready = true;
    status(`${name}｜共通データ同期済み`, 'ok');
    window.dispatchEvent(new CustomEvent('sug:rom-care:data-ready', {
      detail: { memberId: state.memberId, profile: state.profile, version: VERSION }
    }));
    return { ok: true, member: state.member, memberId: state.memberId };
  }

  async function saveNow() {
    if (!state.ready || !state.client || !state.memberId || !state.member || state.saving) {
      return { ok: false, reason: 'NOT_READY' };
    }
    state.saving = true;
    status(`${state.profile?.display_name || '会員'}｜保存中…`);
    try {
      const payload = JSON.parse(JSON.stringify(state.member));
      const { error } = await state.client.from('member_data').upsert({
        user_id: state.memberId,
        data: payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) {
        status(`保存できません：${error.message}`, 'bad');
        return { ok: false, reason: 'SAVE_ERROR', error };
      }
      status(`${state.profile?.display_name || '会員'}｜保存済み`, 'ok');
      window.dispatchEvent(new CustomEvent('sug:rom-care:data-saved', {
        detail: { memberId: state.memberId, version: VERSION }
      }));
      return { ok: true };
    } finally {
      state.saving = false;
    }
  }

  function persist(delay = 250) {
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveNow, delay);
  }

  function remove(collection, index) {
    const rows = state.member?.[collection];
    if (!Array.isArray(rows) || index < 0 || index >= rows.length) return false;
    rows.splice(index, 1);
    persist();
    window.dispatchEvent(new CustomEvent('sug:rom-care:data-change', {
      detail: { collection, version: VERSION }
    }));
    return true;
  }

  window.SuGRomCareData = Object.freeze({
    version: VERSION,
    boot,
    member: () => state.member,
    memberId: () => state.memberId,
    profile: () => state.profile,
    persist,
    saveNow,
    remove,
    isReady: () => state.ready,
    isLocalOnly: () => state.localOnly
  });
})();
