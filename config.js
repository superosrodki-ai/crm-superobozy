// config.js – ustawienia Supabase (ONLINE)
const SUPABASE_URL = "https://superobozy-crm.supabase.co"; // Twój Project URL
const SUPABASE_ANON_KEY = "eyJhbGc..."; // Twój publiczny anon key

// eksport do globalnego kontekstu (dla app.js, leads.js, followups.js)
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
