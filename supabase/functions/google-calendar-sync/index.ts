import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function refreshGoogleAccessToken() {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');
  if (!clientId || !clientSecret || !refreshToken) throw new Error('Google OAuth secrets are not configured');

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

function toIso(value: any) {
  return value?.dateTime || (value?.date ? `${value.date}T00:00:00+09:00` : null);
}

function durationMinutes(startIso: string, endIso: string) {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(15, Math.round(ms / 60000));
}

function normalizeName(v: string) {
  return String(v || '').normalize('NFKC').replace(/\s+/g, '').toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID') || 'primary';
    const sb = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    const token = await refreshGoogleAccessToken();
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from.getTime() + 60 * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      maxResults: '500',
    });

    const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!calRes.ok) throw new Error(`Google Calendar fetch failed: ${calRes.status}`);
    const cal = await calRes.json();
    const events = Array.isArray(cal.items) ? cal.items : [];

    const { data: members, error: memberError } = await sb
      .from('profiles')
      .select('id,name,email,role')
      .neq('role', 'trainer');
    if (memberError) throw memberError;

    const byName = new Map<string, any>();
    const byEmail = new Map<string, any>();
    for (const m of members || []) {
      if (m.name) byName.set(normalizeName(m.name), m);
      if (m.email) byEmail.set(String(m.email).toLowerCase(), m);
    }

    let imported = 0;
    let skipped = 0;
    const unmatched: string[] = [];

    for (const ev of events) {
      if (ev.status === 'cancelled') continue;
      const startIso = toIso(ev.start);
      const endIso = toIso(ev.end);
      if (!startIso || !endIso) continue;

      const text = `${ev.summary || ''} ${ev.description || ''}`;
      const attendeeEmails = (ev.attendees || []).map((a: any) => String(a.email || '').toLowerCase()).filter(Boolean);
      let member = attendeeEmails.map((x: string) => byEmail.get(x)).find(Boolean);

      if (!member) {
        const normalizedText = normalizeName(text);
        for (const [name, row] of byName.entries()) {
          if (name && normalizedText.includes(name)) { member = row; break; }
        }
      }

      if (!member) {
        unmatched.push(ev.summary || ev.id || '名称なし');
        skipped++;
        continue;
      }

      const payload = {
        member_id: member.id,
        start_at: startIso,
        duration_minutes: durationMinutes(startIso, endIso),
        room: Number(ev.extendedProperties?.private?.room || 1),
        status: 'scheduled',
        google_event_id: ev.id,
        google_calendar_id: calendarId,
        updated_at: new Date().toISOString(),
      };

      const { error } = await sb
        .from('appointments')
        .upsert(payload, { onConflict: 'google_event_id' });
      if (error) throw error;
      imported++;
    }

    return json({ ok: true, imported, skipped, unmatched });
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: String(error?.message || error) }, 500);
  }
});