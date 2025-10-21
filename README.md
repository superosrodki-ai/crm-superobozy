# SuperObozy — CRM (demo w chmurze)

Lekki, statyczny CRM działający na **Vercel + Supabase** (bez buildów).
- `index.html` — ekran główny + status połączenia
- `offer.html` — formularz „Wyślij ofertę” (tabela `offers`)
- `reservation.html` — formularz rezerwacji (tabela `reservations`)
- `app.js` — logika (Supabase + tryb DEMO gdy brak kluczy)
- `config.js` — ustawienia Supabase (lub puste => DEMO)
- `schema.sql` — tworzy tabele
- `styles.css` — prosty, czysty wygląd
- `vercel.json` — wyłączony cache, działanie jako strona statyczna

## Szybki start
1. Wgraj cały folder do repo (GitHub) lub bezpośrednio do Vercel (Other/Static).
2. (Opcjonalnie) W Supabase uruchom `schema.sql` (utworzy tabele).
3. Uzupełnij `config.js` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) — wtedy masz pełny zapis do bazy.  
   Jeśli zostawisz puste — strona działa w **DEMO** (bez zapisu), nic się nie wykrzaczy.

© 2025 SuperObozy
