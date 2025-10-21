// Common helpers for API routes (extended)
export function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

export function allowCors(handler) {
  return async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }
    return handler(req, res);
  };
}

export async function supabaseInsert(table, payload) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env vars');
  }
  const endpoint = `${url.replace(/\/+$/,'')}/rest/v1/${table}`;
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  const text = await r.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch(_){ body = { raw:text }; }
  if (!r.ok) {
    const err = new Error('Supabase insert failed');
    err.status = r.status;
    err.body = body;
    throw err;
  }
  return { status: r.status, body };
}

export async function supabaseSelect(table, params = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env vars');
  }
  const q = new URLSearchParams(params).toString();
  const endpoint = `${url.replace(/\/+$/,'')}/rest/v1/${table}${q ? `?${q}` : ''}`;
  const r = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
    }
  });
  const text = await r.text();
  const body = text ? JSON.parse(text) : [];
  if (!r.ok) {
    const err = new Error('Supabase select failed');
    err.status = r.status;
    err.body = body;
    throw err;
  }
  return body;
}

export function buildICS({ uid, title, description, start, end, location }) {
  // All times as UTC in basic format YYYYMMDDTHHMMSSZ
  function fmt(d) {
    const pad = (n) => String(n).padStart(2,'0');
    const dt = new Date(d);
    return dt.getUTCFullYear()
      + pad(dt.getUTCMonth()+1)
      + pad(dt.getUTCDate()) + 'T'
      + pad(dt.getUTCHours())
      + pad(dt.getUTCMinutes())
      + pad(dt.getUTCSeconds()) + 'Z';
  }
  const now = fmt(new Date());
  const dtStart = fmt(start);
  const dtEnd = fmt(end);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CRM SuperObozy//Calendar//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(title || 'Rezerwacja')}`,
    `DESCRIPTION:${escapeICS(description || '')}`,
    location ? `LOCATION:${escapeICS(location)}` : null,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
  return lines;
}

function escapeICS(s) {
  return String(s).replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');
}
