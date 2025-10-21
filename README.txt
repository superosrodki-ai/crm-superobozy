Instrukcja: poprawny index.html dla Vercel

- Dodany <base href="/">, aby względne ścieżki liczyły się od katalogu głównego.
- Zostaw styles.css i app.js w tym samym katalogu co index.html.

Kroki:
1) Skopiuj zawartość <body>…</body> ze starego index.html.
2) Wklej ją w sekcji <main id="app-root"> w nowym pliku.
3) Podmień CRM_SuperObozy_Web/index.html w repozytorium i wypchnij zmianę.
4) Vercel zbuduje nową wersję automatycznie.
