# Email ofert + Kalendarz (Mac) – rozszerzenie dla CRM SuperObozy (Vercel + Supabase)

## Co nowego
- `/api/send-offer` – wysyłanie maili przez **Resend** + opcjonalny załącznik **ICS** (termin do kalendarza).
- `/api/calendar.ics` – **publiczny feed iCal** z rezerwacjami z Supabase (możesz dodać subskrypcję w Kalendarzu na Macu).
- `/offer` – prosta strona do wysyłania ofert (formularz).

## Konfiguracja w Vercel (Env Vars)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`
- `RESEND_API_KEY` – klucz z Resend.com
- (opcjonalnie) `OFFER_FROM_EMAIL` – np. `oferty@superobozy.pl` (musi być zweryfikowana domena w Resend)

## Jak dodać do Kalendarza na Macu (subskrypcja)
1. Otwórz Kalendarz (macOS).
2. **Plik → Nowa subskrypcja kalendarza…**
3. Wklej: `https://TWOJ-PROJEKT.vercel.app/calendar.ics` (podmień domenę Vercel).
4. Zapisz. Wydarzenia ładują się z tabeli `reservations` w Supabase (automatyczne odświeżanie).

## Wysyłanie ofert z ICS
- Wejdź na `/offer`, wpisz **email, temat i treść HTML** (możesz wkleić sformatowaną ofertę).
- Rozwiń „Załącz termin do kalendarza (ICS)” i podaj **start/koniec** – odbiorca w 1 klik doda termin do iCal/Outlook/Gmail.

## Uwagi bezpieczeństwa
- Klucz `service_role` i `RESEND_API_KEY` są wyłącznie na backendzie (serverless). Front nie widzi kluczy.
- Jeśli chcesz ograniczyć dostęp do `/offer` i `/calendar.ics`, możemy dodać auth (Supabase Auth / Basic auth / Secret token).

## Dalsze kroki
- Szablony HTML ofert versionowane w Supabase (wysyłka po ID szablonu).
- PDF załącznik (render HTML → PDF) – wymaga biblioteki do renderu w SSR (np. Playwright). Możemy dodać na życzenie.
