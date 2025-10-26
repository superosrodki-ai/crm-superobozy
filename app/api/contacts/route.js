import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function client(){
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE;
  if (!url || !key) throw new Error('Brak zmiennych SUPABASE_URL / SUPABASE_SERVICE_ROLE');
  return createClient(url, key);
}

export async function GET(){
  try{
    const supabase = client();
    const { data, error } = await supabase
      .from('contacts')
      .select('id, club, person, phone, email, participants, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, data }, { status: 200 });
  }catch(e){
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req){
  try{
    const supabase = client();
    const payload = await req.json();
    const entry = {
      source: payload.source ?? null,
      owner: payload.owner ?? null,
      club: payload.club ?? null,
      person: payload.person ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      discipline: payload.discipline ?? null,
      participants: payload.participants ?? null,
      facilities: payload.facilities ?? null,
      term: payload.term ?? null,
      location: payload.location ?? null,
      camps: Array.isArray(payload.camps) ? payload.camps : (payload.camps ? [payload.camps] : null),
      status: payload.status ?? null,
      priority: payload.priority ?? null,
      notes: payload.notes ?? null
    };
    const { data, error } = await supabase.from('contacts').insert(entry).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, data }, { status: 200 });
  }catch(e){
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
