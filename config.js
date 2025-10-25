// config.js — ustawienia Supabase (ONLINE)
const SUPABASE_URL = "https://superobozy-crm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZHNpcnRydWpzd2hmb2dlaHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDcyNjEsImV4cCI6MjA3NjQ4MzI2MX0.t2Z9EauqSdDO1sV8Ohy9gil2yDGEJdSI_h5VKihikos";

// eksport do globalnego kontekstu (dla app.js, leads.js, followups.js)
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
