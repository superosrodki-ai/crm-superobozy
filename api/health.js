module.exports = async (_req,res)=>{
  const url = (process.env.SUPABASE_URL||'').trim();
  const role = (process.env.SUPABASE_SERVICE_ROLE||'').trim();
  res.status(200).json({ ok:true, env:{ hasUrl:!!url, hasServiceRole:!!role, urlLooksValid: url? /^https?:\/\//.test(url):false } });
};
