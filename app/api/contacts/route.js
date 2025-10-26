import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const payload = await req.json();
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
    const { data, error } = await supabase.from('contacts').insert(payload).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
