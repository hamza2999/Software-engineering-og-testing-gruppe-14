# B09 – Lese-API for kurs

**Dato:** 6. november 2026

**Status:** Implementert og kontrollert på feature-branchen. Gruppens gjennomgang
og merge må registreres før Kanban-kortet lukkes. Arbeidet bygger videre på B08 og
dens migreringshistorikk; B08 skal integreres før B09.

## Funksjonalitet

- `GET /api/kurs/oversikt` returnerer komplette, kommende kurs med nærmeste starttid først.
- `lokallagId` filtrerer på lokallag; `page` og `pageSize` styrer paginering.
- «Kommende» inkluderer kurs som starter akkurat på serverens forespørselstidspunkt.
- Kurs med lik starttid sorteres på ID, slik at sidene får stabil rekkefølge.
- `GET /api/kurs/detaljer/:id` returnerer ett komplett kurs, også hvis kurset er avsluttet.
- Et kjent lokallag uten kommende kurs gir `200` med tom liste. Ukjent lokallag gir `404`.
- Ugyldige parametere gir `400`; manglende eller ufullstendige kurs gir `404`.
- Nektet lesetilgang gir `403`. Interne feil logges og gir en generell `500`-melding.

Se [API-avtalen](api-avtale.md) for felt og JSON-eksempler. Samme kurs-DTO brukes i
oversikt og detaljvisning. Frontendtilkobling og påmeldingsfunksjon inngår ikke i B09.

## Tidspunkt, sted og pris

Datoer normaliseres til ISO 8601 i UTC ved lagring. For eksempel blir
`2026-11-06T14:00:00+01:00` lagret og levert som `2026-11-06T13:00:00.000Z`.
Dette er nødvendig for korrekt datofilter og sortering i SQLite, hvor datoene er tekst.
Frontend viser tidspunktet i `Europe/Oslo`.

Sted må være utfylt og trimmes ved lagring. Pris er et sikkert heltall i øre, minst
`0`, med valuta `NOK`. `15000` betyr 150 kroner. `0` betyr gratis, og er en uttrykkelig
verdi. Et manglende prisfelt blir aldri automatisk satt til `0`.

Lagringshooken krever tidspunkt, sted, pris og et eksisterende lokallag ved både
opprettelse og endring gjennom Payload. Ved delvis oppdatering brukes eksisterende
verdier for felt som ikke er sendt inn. Å tømme et påkrevd felt gir valideringsfeil.
Oppslag fra hooken bruker samme `req`, slik at de følger transaksjonen og lesetilgangen.

## Migrering og gamle data

[Migreringen](../Backend/src/migrations/20261106_065533_kurs_sted_pris.ts) legger til
`location`, `price` og en indeks på dato. Gamle kurs beholder ID, innhold, bilde,
lokallagskobling og tidsstempler. Startdatoen normaliseres til UTC med samme tidspunkt.
En ugyldig gammel dato stopper migreringen før skjemaet endres, slik at verdien kan rettes.

De nye databasekolonnene er bevisst nullable. Kravene håndheves av lagringshooken,
slik at gamle rader kan bevares uten oppdiktet sted eller pris. Payloads genererte
typer gjenspeiler denne overgangen; domenemodellen representerer et komplett kurs.

Offentlige ruter viser bare komplette kurs, også når leseren er innlogget. Innloggede
brukere kan lese gamle ufullstendige poster i admin/Payloads vanlige ruter og fylle inn
de riktige verdiene. Kurs som mister lokallagskoblingen skjules også til den er rettet.
Tilbakeføring av migreringen fjerner sted og pris; UTC-normaliseringen av tidspunkt
beholdes. Feltene må tas vare på før en eventuell tilbakeføring som trenger disse dataene.

Nye [seed-kurs](../Backend/src/seed/data.ts) har fiktive steder og priser.
Eksisterende seed-poster endres ikke ved ny kjøring. Følg [testdataoppskriften](testdata.md)
for å starte med en tom testdatabase.

## Oppbygning

| Del | Ansvar |
| --- | --- |
| [Kurs](../Backend/src/modules/kurs/domain/Kurs.ts) | Domenemodell med API-feltene |
| [Validering](../Backend/src/modules/kurs/domain/kursValidation.ts) | Pris, sted og UTC-normalisering |
| [KursRepository](../Backend/src/modules/kurs/application/KursRepository.ts) | Kontrakt for datatilgang |
| [KursService](../Backend/src/modules/kurs/application/KursService.ts) | Parametere, klokke, ID-er, paginering og mangler-feil |
| [Payload-adapter](../Backend/src/modules/kurs/adapters/PayloadKursRepository.ts) | Filtrering, sortering, oppslag og mapping |
| [KursDTO](../Backend/src/modules/kurs/http/KursDTO.ts) | Avtalt JSON-format |
| [HTTP-endepunkter](../Backend/src/modules/kurs/http/kursEndpoints.ts) | Kobler komponentene og oversetter feil til HTTP |

Strukturen følger nyhetsmodulen, men kurs har egen logikk for starttid, pris og
fullstendige data. Modulen er uavhengig av B07s detaljendepunkt for lokallag.

## Kontroll

Kjør fra `Backend`:

```bash
npm run test:unit
npm run test:kurs
npm run test:nyheter
npm run test:lokallag
npx tsc --noEmit
npm run lint
```

Gjennomført kontroll 6. november 2026:

| Kontroll | Resultat |
| --- | --- |
| Kursservice, DTO og validering | 55 enhetstester bestått |
| Kurs gjennom HTTP og SQLite | 45 integrasjonstester bestått |
| Regresjon for nyheter og lokallag | 49 enhetstester og 60 integrasjonstester bestått |
| TypeScript | Bestått |
| ESLint | Ingen feil; 9 eksisterende advarsler i uendrede filer |
| Migrering og seeding via Payload CLI | Tre migreringer fra tom database; gjentatt kjøring og to seed-kjøringer gir 4/4/4 uten duplikater |
| Oppgradering med gammel kursrad | Data bevart, tidspunkt normalisert og ukjent pris beholdt som NULL; komplettering gjør kurset lesbart |
| Ugyldig gammel dato | Migreringen stopper uten endring av data eller skjema |
| API etter migrering | Oversikt, lokallagsfilter, detaljer, gratispris og ukjent ID kontrollert med skjemapush deaktivert |

Testene bruker egne midlertidige databaser og rydder opp etterpå. De dekker også
grensetidspunkt, tidssoneforskjeller, tom liste, stabil paginering, prisvalidering,
delvise oppdateringer, ufullstendige gamle data, slettet lokallag, tilgang og CORS.

AI er brukt til implementering, tester og dokumentasjon etter forespørsel fra
Magomed, med B08 og API-avtalen som utgangspunkt. Gruppens gjennomgang registreres i PR-en.
