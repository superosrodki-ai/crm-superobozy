=====================================
SUPER OBOZY — PROSTY CRM W CHMURZE
=====================================

WERSJA DLA ZUPEŁNEGO LAIKA (krok po kroku)

CO OTRZYMUJESZ?
- Gotową stronę (prosty CRM) jako pliki: index.html, app.js, styles.css
- Plik config.example.js (musisz skopiować i uzupełnić jako config.js)
- Plik schema.sql (wkleisz do Supabase → SQL Editor → RUN)

CO POTRZEBA?
- Konto w Supabase (za darmo)
- Konto w Vercel (za darmo)

KROK 1 — ZAŁÓŻ SUPABASE (baza danych)
1) Wejdź: https://supabase.com
2) Zaloguj się przez Google.
3) Kliknij: New project → nazwij: superobozy-crm → wybierz region EU.
4) Po utworzeniu projektu: po lewej kliknij "SQL Editor".
5) Otwórz plik schema.sql (z tego ZIPa), skopiuj CAŁOŚĆ i wklej w Supabase, kliknij RUN.

KROK 2 — WEŹ KLUCZE Z SUPABASE
1) W Supabase kliknij: Project Settings → API
2) Skopiuj:
   - Project URL  → wkleisz do config.js jako SUPABASE_URL
   - anon public  → wkleisz do config.js jako SUPABASE_ANON_KEY

KROK 3 — POLITYKI (NAJPROSTSZA OPCJA NA START)
Najprościej na start WYŁĄCZ RLS (Row Level Security) dla tabel "leads" i "journal":
- W Table editor wejdź w tabelę → "RLS" → wyłącz przełącznik (Disable RLS)
(To znaczy: każdy znający adres strony może czytać/pisać. Na start OK. Później zrobimy logowanie.)

KROK 4 — UZUPEŁNIJ config.js
1) Skopiuj plik "config.example.js" → ZRÓB KOPIĘ i nazwij "config.js".
2) Otwórz "config.js" → wklej swoje SUPABASE_URL i SUPABASE_ANON_KEY.
3) Zapisz.

KROK 5 — URUCHOM LOKALNIE (dla testu)
1) Otwórz folder w komputerze.
2) Kliknij 2x "index.html" (strona otworzy się w przeglądarce).
3) Jeśli widzisz listę (może być pusta) i możesz dodać lead – DZIAŁA.

KROK 6 — WYŚLIJ NA VERCEL (darmowy hosting)
1) Wejdź na https://vercel.com i zaloguj się (np. przez GitHub).
2) Stwórz nowy projekt → "Import..." → "Add New..." → "Project" → "Other".
3) Wgraj pliki z tego folderu (index.html, app.js, config.js, styles.css).
4) Kliknij "Deploy".
5) Otrzymasz adres: np. https://twoj-projekt.vercel.app

KROK 7 — (opcjonalnie) PODŁĄCZ WŁASNĄ DOMENĘ .COM
- W Vercel: Project → Settings → Domains → dodaj np. crm.twojadomena.com

GOTOWE!

CO DALEJ (bezpieczna wersja z logowaniem)?
- Włącz RLS i dodaj reguły: tylko użytkownicy zalogowani mogą czytać/pisać.
- Dodamy prosty ekran logowania (Supabase Auth: magic link). To mogę przygotować w kolejnej wersji.

Miłej pracy! ✨
