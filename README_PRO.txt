SuperObozy CRM — PRO (ONLINE + DEMO fallback)

1) Podmień pliki w repo:
   - contact.html, leads.html, followups.html
   - app.js, leads.js, followups.js
   - config.js, vercel.json
   - supabase_setup.sql

2) Supabase → SQL Editor → wklej supabase_setup.sql → RUN
   ✔ utworzy tabele: leads, followups, activities + włączy RLS + polityki

3) W config.js wklej klucze:
   const SUPABASE_URL = "https://...supabase.co";
   const SUPABASE_ANON_KEY = "...";

4) Deploy Vercel (Redeploy).

5) Test:
   - /contact → dodaj kontakt (powstaje follow-up + wpis w activities)
   - /leads → wyszukiwarka + sortowanie + status 1‑klik + CSV
   - /followups → Zaległe / Dziś / Nadchodzące, ✔ zrobione

UMD Supabase w *.html zapewnia window.supabase do createClient().
