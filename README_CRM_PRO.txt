CRM SuperObozy – PRO SUITE (ONLINE, dark, HARD-BIND)

1) Skopiuj pliki do repo (root):
   - contact.html, app.js
   - leads.html, leads.js
   - followups.html, followups.js
   - config.js
   - vercel.json
   - supabase_setup.sql  (wrzuć do Supabase → SQL Editor → RUN)

2) Supabase → SQL Editor → wklej zawartość supabase_setup.sql i RUN.
   Utworzy tabele: leads, followups, activities i polityki RLS.

3) W config.js uzupełnij:
   const SUPABASE_URL = "https://...supabase.co";
   const SUPABASE_ANON_KEY = "xx";

4) Commit & push → Vercel:
   - /contact   → dodawanie leada, szybkie wiadomości, timeline
   - /leads     → wyszukiwarka, sortowanie, status 1‑klik, eksport CSV
   - /followups → zaległe / na dziś / nadchodzące, ✔ zrobione

HARD-BIND: jeżeli zmienią się ID przycisków, app.js znajdzie je po data-action/tekście.
