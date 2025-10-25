// pages/api/contacts.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const { data, error } = await supabase
      .from('contacts')
      .insert(payload)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
}
