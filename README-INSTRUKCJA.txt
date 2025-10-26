SUPEROBOZY — FIX „Failed to fetch” (ZAPIS KONTAKTU PRZEZ /api/contacts)
======================================================================

Co to jest:
-----------
Gotowy pakiet do PODMIANY. Zapis kontaktu idzie przez trasę serwerową /api/contacts
(Vercel), więc nie ma CORS i „TypeError: Failed to fetch”. Klucze Supabase są
bezpiecznie na serwerze.

Co w środku:
------------
- app/api/contacts/route.js          (App Router — Next.js 13+)
- pages/api/contacts.js              (Pages Router — Next.js <=12/13 pages/)
  >>> UŻYWASZ TYLKO JEDNEGO z nich (dopasuj do projektu).
- public/js/contact-api.js           (frontend: zbiera formularz i POST do /api/contacts)
- sql/contacts.sql                   (tabela + RLS w Supabase)
- .env.example                       (wzór zmiennych środowiskowych)
- README-INSTRUKCJA.txt              (ten plik)

KROKI „JAK DLA PRZEDSZKOLAKA”
-----------------------------
1) Supabase — utwórz tabelę i politykę RLS
   - Wejdź: Supabase -> SQL -> New query
   - Wklej zawartość pliku: sql/contacts.sql
   - RUN. (Jeśli tabela istnieje, polecenia pominą się bezpiecznie.)

2) Vercel — dodaj zmienne środowiskowe (Environment Variables)
   - SUPABASE_URL           = (Project URL z Supabase, np. https://xxx.supabase.co)
   - SUPABASE_SERVICE_ROLE  = (Service Role Key z Supabase -> Project Settings -> API)
   Zapisz. Zrób REDEPLOY.

3) Skopiuj pliki API do projektu:
   - Jeśli masz App Router (folder „app/”) → skopiuj „app/api/contacts/route.js”.
   - Jeśli masz Pages Router (folder „pages/”) → skopiuj „pages/api/contacts.js”.
   - NIE używaj obu równocześnie.

4) Podłącz frontend (formularz)
   - Upewnij się, że Twój formularz ma id="contactForm".
   - Przycisk „Zapisz nowy kontakt” ustaw id="saveContactBtn".
   - Dołącz skrypt: <script src="/js/contact-api.js" defer></script>
     (Plik przenieś do public/js/contact-api.js w projekcie).

   - Nazwy pól formularza (atrybut NAME) muszą odpowiadać kolumnom w tabeli:
       source, owner, club, person, phone, email, discipline, participants,
       facilities, term, location, camps[], status, priority, notes
     *camps* może być multi-checkbox (name="camps").

5) Test
   - Otwórz stronę /contact
   - DevTools -> Network
   - Kliknij „Zapisz nowy kontakt” → powinieneś zobaczyć 200 na /api/contacts.

6) Gdy chcesz wrócić do bezpośredniego supabase-js na froncie — NIE POLECAM.
   Na starcie trzymaj się /api/contacts (mniej błędów, bezpieczeństwo).


FAQ (szybko):
-------------
• Dostaję 400 „invalid input value” – sprawdź typy kolumn (participants = integer).
• Dostaję 401/403 – używasz anon key na froncie? Dla /api/contacts potrzebny jest SERVICE ROLE na serwerze (patrz .env).
• W Network nie ma żadnego requestu przy kliknięciu – znaczy, że event nie podpina się (sprawdź id przycisku i form).
• Chcę inne kolumny – zmień sql/contacts.sql i dopasuj atrybuty name w formularzu.

Powodzenia! — pakiet przygotowany do bezpośredniej podmiany.


---
WAŻNE (404 na Vercel):
Jeśli wrzucasz projekt metodą „Add files via upload”, Vercel uzna go za stronę statyczną,
dopóki nie ma pliku package.json. Ten ZIP zawiera package.json, więc Vercel wykryje Next.js,
zbuduje App Router i uruchomi API: /api/contacts.

Kroki:
1) Wgraj cały ZIP jako repo (albo rozpakuj i push do Git).
2) Vercel -> Import Project -> wybierz to repo -> Framework: Next.js (auto).
3) Ustaw env: SUPABASE_URL, SUPABASE_SERVICE_ROLE -> Redeploy.
4) Wejdź na / -> przekieruje do /contact.html.
