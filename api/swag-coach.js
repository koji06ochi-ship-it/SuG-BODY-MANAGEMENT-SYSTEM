// Vercel serverless endpoint for S.u.G SWAG AI COACH oTo.
// Reuses existing SERIES02_GEMINI_API_KEY / GEMINI_API_KEY (or OPENAI_API_KEY) from server env vars only.
// Never hardcodes API keys, never triggers unapproved billing, enforces explicit user consent and output token cap.
const allowedOrigin = /^https:\/\/(koji06ochi-ship-it\.github\.io|[^/]+\.vercel\.app)$/i;
const MAX_QUESTION_CHARS = 1200;
const ALLOWED_TOPICS = new Set([
  'training', 'nutrition', 'sleep', 'fatigue', 'stress',
  'relationships', 'romance', 'work', 'future', 'confidence', 'habit', 'holiday'
]);
const CRISIS_RE = /(死にたい|消えたい|自殺|自傷)/;

function setCors(req, res) {
  const origin = String(req.headers.origin || '');
  if (allowedOrigin.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

async function verifyBearerToken(authHeader) {
  const m = /^Bearer\s+(.+)$/i.exec(String(authHeader || '').trim());
  if (!m) return { ok: false, reason: 'AUTH_REQUIRED' };
  const token = m[1].trim();
  if (token.length < 20) return { ok: false, reason: 'INVALID_TOKEN' };
  const sbUrl = process.env.SUPABASE_URL;
  const sbAnon = process.env.SUPABASE_ANON_KEY;
  if (!sbUrl || !sbAnon) return { ok: false, reason: 'AUTH_VERIFY_NOT_CONFIGURED' };
  {
    try {
      const r = await fetch(`${sbUrl.replace(/\/$/, '')}/auth/v1/user`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, apikey: sbAnon }
      });
      if (!r.ok) return { ok: false, reason: 'AUTH_REJECTED' };
    } catch (_) {
      return { ok: false, reason: 'AUTH_VERIFY_FAILED' };
    }
  }
  return { ok: true, token };
}

function sanitizeContext(ctx) {
  if (!ctx || typeof ctx !== 'object') return {};
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  return {
    sleepHours: num(ctx.sleepHours),
    steps: num(ctx.steps),
    timeInDaylightMinutes: num(ctx.timeInDaylightMinutes),
    mindfulMinutesToday: num(ctx.mindfulMinutesToday),
    stateOfMindValence: num(ctx.stateOfMindValence),
    recoveryStatus: typeof ctx.recoveryStatus === 'string' ? ctx.recoveryStatus.slice(0, 40) : null
  };
}

function buildSystemInstruction(customPrompt) {
  const base = [
    'あなたはS.u.G SWAG（エスユージー スワッグ）の専属AI COACH oToです。',
    'スローガンは「OWN YOUR STYLE. LIVE YOUR LIFE.」、コンセプトは「身体もしなやかに、心もしなやかに。」。',
    '心理学・行動科学・健康心理学・CBT・リフレーミング・自己決定理論・自己効力感・実装意図（If-Then）を活用し、全肯定せず共感と客観的視点を両立してください。',
    '医学的・精神科的診断は行いません。回復スコアが45未満の日は無理な負荷増加を勧めず休養・呼吸・散歩を提案してください。',
    '必ずJSONのみで返答してください: {"summary":"400文字以内の日本語アドバイス","observations":["観測点最大3件"],"suggestions":["次の小さな一歩最大3件"]}'
  ].join('\n');
  if (typeof customPrompt === 'string' && customPrompt.trim()) {
    return `${base}\n${customPrompt.trim().slice(0, 1000)}`;
  }
  return base;
}

async function callGemini(apiKey, model, systemPrompt, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 512,
        responseMimeType: 'application/json'
      }
    })
  });
  const data = await r.json();
  if (!r.ok) {
    const err = new Error(`GEMINI_HTTP_${r.status}`);
    err.status = r.status;
    throw err;
  }
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!text) throw new Error('GEMINI_EMPTY');
  const parsed = JSON.parse(text);
  return {
    summary: String(parsed.summary || '').slice(0, 400),
    observations: Array.isArray(parsed.observations) ? parsed.observations.slice(0, 8).map((v) => String(v).slice(0, 160)) : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 8).map((v) => String(v).slice(0, 160)) : [],
    provider: 'gemini',
    model,
    analysisKind: 'swag-coach-live'
  };
}

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const auth = await verifyBearerToken(req.headers.authorization);
  if (!auth.ok) return res.status(401).json({ error: auth.reason });

  const body = req.body || {};
  const question = String(body.question || '').trim();
  if (!question) return res.status(400).json({ error: 'QUESTION_REQUIRED' });
  if (question.length > MAX_QUESTION_CHARS) return res.status(413).json({ error: 'QUESTION_TOO_LONG' });

  if (CRISIS_RE.test(question)) {
    return res.status(200).json({
      summary: 'とてもつらいお気持ちを話してくれてありがとうございます。専門相談窓口へご相談ください。よりそいホットライン: 0120-279-338（24時間無料）／こころの健康相談統一ダイヤル: 0570-064-556',
      observations: ['危機キーワード検知により安全窓口を優先案内'],
      suggestions: ['よりそいホットライン (0120-279-338) へ連絡する'],
      provider: 'safety-guard',
      model: 'local-crisis-policy',
      analysisKind: 'safety-redirect'
    });
  }

  if (body.sendConsent !== true || body.costApproved !== true) {
    return res.status(403).json({ error: 'CONSENT_REQUIRED' });
  }
  // An operator must independently verify provider quota/billing limits before enabling.
  if (process.env.SWAG_LIVE_AI_ENABLED !== 'true') {
    return res.status(503).json({ error: 'AI_LIVE_DISABLED_PENDING_BUDGET_CONFIRMATION' });
  }

  const geminiKey = process.env.SERIES02_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  if (!geminiKey) {
    return res.status(503).json({ error: 'AI_API_KEY_NOT_CONFIGURED' });
  }

  const topic = ALLOWED_TOPICS.has(body.topic) ? body.topic : 'habit';
  const recScore = typeof body.recoveryScore === 'number' && Number.isFinite(body.recoveryScore) ? body.recoveryScore : null;
  const recStatus = typeof body.recoveryStatus === 'string' ? body.recoveryStatus.slice(0, 40) : '未評価';
  const healthCtx = sanitizeContext(body.healthContext);
  const model = process.env.SWAG_GEMINI_MODEL || 'gemini-2.5-flash';
  const systemPrompt = buildSystemInstruction();
  const userPrompt = JSON.stringify({
    topic,
    question,
    recoveryScore: recScore,
    recoveryStatus: recStatus,
    healthContext: healthCtx
  });

  try {
    const out = await callGemini(geminiKey, model, systemPrompt, userPrompt);
    return res.status(200).json(out);
  } catch (e) {
    console.error('swag-coach', e?.message || e);
    return res.status(502).json({ error: 'AI_UPSTREAM_FAILED', detail: String(e?.message || 'error') });
  }
};
