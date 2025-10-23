Leads PRO+ – instrukcja szybkiego wdrożenia
1) Skopiuj pliki do projektu: leads.html i leads.js (root – obok contact.html).
2) Upewnij się, że w vercel.json masz rewrite: { "source": "/leads", "destination": "/leads.html" }.
3) Commit & push → Vercel zdeployuje.
4) Wejdź na /leads – zobaczysz listę leadów z wyszukiwarką, sortowaniem i zmianą statusu.
5) Eksport CSV – przycisk w toolbarze. KPI „na dziś” działa, gdy skonfigurowany jest Supabase i tabela followups.
