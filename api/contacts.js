const { createClient } = require('@supabase/supabase-js');
function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE');
  return createClient(url, key);
}
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const supabase = client();
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, club, person, phone, email, participants, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) return res.status(400).send(JSON.stringify({ error: error.message }));
      return res.status(200).send(JSON.stringify({ ok: true, data }));
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
      const { data, error } = await supabase.from('contacts').insert(entry).select();
      if (error) return res.status(400).send(JSON.stringify({ error: error.message }));
      return res.status(200).send(JSON.stringify({ ok: true, data }));
    }
    res.status(405).send(JSON.stringify({ error: 'Method not allowed' }));
  } catch (e) {
    res.status(500).send(JSON.stringify({ error: e.message || 'Server error' }));
  }
};
