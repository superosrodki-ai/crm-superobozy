const { createClient } = require('@supabase/supabase-js');

function getEnv() {
  const rawUrl = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE;
  const url = (rawUrl || '').trim();
  const key = (rawKey || '').trim();
  return { url, key, rawUrl, rawKey };
}

module.exports = async (req, res) => {
  const { url, key } = getEnv();

  // DEBUG endpoint: /api/contacts?debug=1
  if (req.query && (req.query.debug === '1' || req.query.debug === 'true')) {
    return res.status(200).json({
      debug: true,
      hasUrl: Boolean(url),
      hasKey: Boolean(key),
      urlSample: url ? url.slice(0, 40) : null,
      urlEndsWithSlash: url ? url.endsWith('/') : null,
      urlStartsWithHttp: url ? /^https?:\/\//.test(url) : null,
      keyLen: key ? key.length : 0
    });
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    if (!url || !/^https?:\/\//.test(url)) {
      throw new Error('Invalid URL (SUPABASE_URL)');
    }
    if (!key) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE');
    }
    const client = createClient(url, key);

    if (req.method === 'GET') {
      const { data, error } = await client
        .from('contacts')
        .select('id, club, person, phone, email, participants, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true, data });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const entry = {
        source: body.source ?? null, owner: body.owner ?? null, club: body.club ?? null,
        person: body.person ?? null, phone: body.phone ?? null, email: body.email ?? null,
        discipline: body.discipline ?? null, participants: body.participants ?? null,
        facilities: body.facilities ?? null, term: body.term ?? null, location: body.location ?? null,
        camps: Array.isArray(body.camps) ? body.camps : (body.camps ? [body.camps] : null),
        status: body.status ?? null, priority: body.priority ?? null, notes: body.notes ?? null
      };
      const { data, error } = await client.from('contacts').insert(entry).select();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true, data });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
