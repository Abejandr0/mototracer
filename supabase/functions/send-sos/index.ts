import { withSupabase } from 'npm:@supabase/server@1';

type Contact = { id?: string; name?: string; phone?: string };
type Payload = { latitude?: number; longitude?: number; contactIds?: string[] };
const json = (value: unknown, status = 200) => Response.json(value, { status });

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, ctx) => {
    const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const token = Deno.env.get('TWILIO_AUTH_TOKEN');
    const from = Deno.env.get('TWILIO_FROM_NUMBER');
    if (!sid || !token || !from) return json({ error: 'sms_not_configured' }, 503);
    if (!/^AC[0-9a-fA-F]{32}$/.test(sid)) return json({ error: 'invalid_account_sid' }, 503);
    if (!/^\+[1-9]\d{7,14}$/.test(from)) return json({ error: 'invalid_from_number', expected: 'E.164: + followed by country code and number' }, 503);
    if (request.method === 'GET') {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(from)}&PageSize=20`;
        const response = await fetch(url, { headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}` } });
        if (response.status === 401 || response.status === 403) return json({ error: 'twilio_auth_failed' }, 503);
        if (!response.ok) return json({ error: 'twilio_number_check_failed' }, 503);
        const result = await response.json() as { incoming_phone_numbers?: { phone_number?: string; capabilities?: { sms?: boolean } }[] };
        const number = result.incoming_phone_numbers?.find((entry) => entry.phone_number === from);
        if (!number) return json({ error: 'from_number_not_in_account' }, 503);
        if (!number.capabilities?.sms) return json({ error: 'from_number_cannot_send_sms' }, 503);
        return json({ ready: true, fromLast4: from.slice(-4) });
      } catch { return json({ error: 'twilio_check_unavailable' }, 503); }
    }
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    let payload: Payload;
    try { payload = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }
    const latitude = Number(payload.latitude), longitude = Number(payload.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return json({ error: 'invalid_coordinates' }, 400);
    if (!Array.isArray(payload.contactIds) || payload.contactIds.length > 10 || payload.contactIds.some((id) => typeof id !== 'string' || id.length > 80)) return json({ error: 'invalid_contacts' }, 400);

    const { data: backup, error: backupError } = await ctx.supabase.from('rider_backups').select('data').eq('owner_id', ctx.userClaims!.id).maybeSingle();
    if (backupError) return json({ error: 'contacts_unavailable' }, 503);
    const rawContacts = (backup?.data as { contacts?: Contact[] } | null)?.contacts;
    const saved = Array.isArray(rawContacts) ? rawContacts : [];
    const requested = new Set(payload.contactIds);
    const contacts = saved.filter((contact) => typeof contact.id === 'string' && requested.has(contact.id) && typeof contact.phone === 'string' && /^\+[1-9]\d{7,14}$/.test(contact.phone.replace(/[\s()-]/g, ''))).slice(0, 5);
    if (!contacts.length) return json({ error: 'no_valid_contacts' }, 422);

    const { data: alertId, error: reserveError } = await ctx.supabase.rpc('reserve_sos_alert', { p_latitude: latitude, p_longitude: longitude });
    if (reserveError) return json({ error: 'alert_unavailable' }, 503);
    if (!alertId) return json({ error: 'rate_limited' }, 429);

    const link = `https://maps.google.com/?q=${latitude},${longitude}`;
    const body = `SOS MotoTracer: necesito ayuda. Mi ubicacion actual: ${link}`;
    const outcomes = await Promise.all(contacts.map(async (contact) => {
      const params = new URLSearchParams({ To: contact.phone!.replace(/[\s()-]/g, ''), From: from, Body: body });
      try {
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${btoa(`${sid}:${token}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params });
        return response.ok;
      } catch { return false; }
    }));
    const accepted = outcomes.filter(Boolean).length, failed = outcomes.length - accepted;
    const status = accepted === 0 ? 'failed' : failed ? 'partial' : 'accepted';
    await ctx.supabaseAdmin.from('sos_alerts').update({ status, accepted_count: accepted, failed_count: failed }).eq('id', alertId).eq('owner_id', ctx.userClaims!.id);
    return json({ status, accepted, failed, total: contacts.length }, accepted ? 200 : 502);
  }),
};
