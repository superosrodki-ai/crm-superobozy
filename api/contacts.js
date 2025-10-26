const { createClient } = require('@supabase/supabase-js');
function readEnv(){ return { url: (process.env.SUPABASE_URL||'').trim(), role: (process.env.SUPABASE_SERVICE_ROLE||'').trim() }; }
function clientOrThrow(){
  const { url, role } = readEnv();
  if (!url) throw new Error('Missing SUPABASE_URL');
  if (!/^https?:\/\//.test(url)) throw new Error('Invalid SUPABASE_URL format');
  if (!role) throw new Error('Missing SUPABASE_SERVICE_ROLE');
  return createClient(url, role);
}
function safeJson(req){ if (req.body==null) return {}; try{ return typeof req.body==='string' ? JSON.parse(req.body||'{}') : (req.body||{});}catch(_){ return {}; } }
module.exports = async (req, res) => {
  if (req.query && (req.query.debug==='1' || req.query.debug==='true')){
    const { url, role } = readEnv();
    return res.status(200).json({
      debug:true, hasUrl:!!url, hasService:!!role,
      urlStartsWithHttp: url ? /^https?:\/\//.test(url) : null,
      serviceLen: role ? role.length : 0
    });
  }
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  try{
    const supabase = clientOrThrow();
    if (req.method==='GET'){
      const { data, error } = await supabase.from('contacts').select('id, club, person, phone, email, participants, created_at').order('created_at',{ascending:false}).limit(200);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok:true, data });
    }
    if (req.method==='POST'){
      const b = safeJson(req);
      const entry = {
        source:b.source??null, owner:b.owner??null, club:b.club??null, person:b.person??null,
        phone:b.phone??null, email:b.email??null, discipline:b.discipline??null, participants:b.participants??null,
        facilities:b.facilities??null, term:b.term??null, location:b.location??null,
        camps:Array.isArray(b.camps)?b.camps:(b.camps?[b.camps]:null), status:b.status??null, priority:b.priority??null, notes:b.notes??null
      };
      const { data, error } = await supabase.from('contacts').insert(entry).select();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok:true, data });
    }
    res.status(405).json({ error:'Method not allowed' });
  }catch(e){
    res.status(500).json({ error: e.message || 'Server error' });
  }
};
