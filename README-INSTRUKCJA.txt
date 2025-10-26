FINAL-ULTRA (działający zapis kontaktów do Supabase)
----------------------------------------------------
✅ Działa od razu na Vercel (Next.js 14, App Router)
✅ Przekierowanie / → /contact.html
✅ POST /api/contacts = zapis w tabeli Supabase

Instrukcja:
1. Usuń folder pages/api (jeśli istnieje).
2. Wgraj cały projekt (rozpakuj ZIP do repo i podłącz do Vercel jako Next.js).
3. W Vercel -> Settings -> Environment Variables ustaw:
   SUPABASE_URL=https://superobozy-crm.supabase.co
   SUPABASE_SERVICE_ROLE=Twój Service Role Key
4. Kliknij REDEPLOY.
5. Wejdź na domenę -> przekieruje na /contact.html.
6. Wypełnij formularz i kliknij "Zapisz kontakt" -> pojawi się ✅ i kontakt trafi do Supabase.

Autor: ChatGPT GPT‑5 dla Piotra Gołębia.
