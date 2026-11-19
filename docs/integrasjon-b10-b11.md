# B10/B11 – frontendintegrasjon og testing

Oppdatert 6. november 2026. Implementasjonen ligger på integrasjonsbranchen.
Gruppens gjennomgang og merge må fullføres før oppgavene flyttes til Ferdig.

## B10: faktiske data i frontend

Forsiden, medlemsgrupper, lokallagsdetaljer, nyhetsoversikt/-detaljer og
kursoversikt/-detaljer bruker nå de offentlige endepunktene i
[API-avtalen](api-avtale.md). Lenker bruker ID-ene fra databasen. De gamle
eksempeldatafilene er ikke lenger datakilde for disse sidene.

`Frontend/src/api/client.js` håndterer HTTP-status, JSON og generelle feilmeldinger.
`resources.js` kontrollerer svarformatet. `useApi` håndterer lasting, avbrudd og
nytt forsøk; et gammelt svar skal ikke overskrive et nytt filtervalg.
Felles komponenter viser feil, tomme resultater, lokallagsfilter og paginering.

Kurs/nyheter henter seks elementer per side fra backend. Filter og sidenummer
ligger i URL-en. Medlemsgruppesøk, filtervalg og globalt søk henter alle
API-sidene slik at poster etter de første 100 også er med. Globalt søk starter
ved innsending. Denne enkle løsningen passer dagens lille datamengde; et
større innholdsbibliotek bør få søk på serveren.

Datoer vises på norsk i Europe/Oslo. Pris i øre konverteres til kroner;
uttrykkelig pris 0 vises som Gratis. Tidligere kurs merkes avsluttet.
Påmelding er ikke implementert i B10. Den gamle eksempelruten leder til
kursdetaljer, der brukeren får kontaktinformasjon via lokallaget.

Vite videresender `/api` til `API_PROXY_TARGET` under utvikling og preview.
`VITE_API_BASE_URL` kan endres ved separat hosting. Backendens `FRONTEND_URL`
angir tillatte origins for CORS/CSRF. Se `.env.example` i begge prosjekter.
Ved produksjonshosting må proxy, cookies og origins konfigureres for de faktiske adressene.

## B07-avhengigheten

Jovans commit `6679334` fra `feat/b07-detaljoppslag` er merget inn med hans
Git-historikk bevart. Repository, service, detalj-DTO og enhetstester kommer
fra dette arbeidet. Integrasjonsarbeidet registrerer
`GET /api/lokallag/detaljer/:id`, normaliserer feil og legger til HTTP-tester.
Jovans branch er ikke overskrevet.

## B11: testoppsett og resultat

`GET /api/health` leser databasen og returnerer `200`/`503` med minimal JSON.
Ingen telling, brukerdata eller interne feildetaljer eksponeres. Den eldre
`/my-route` gjenbruker samme kontroll.

| Kontroll | Resultat 6. november 2026 |
| --- | --- |
| Backend enhetstester, Vitest | 126 bestått |
| Backend integrasjonstester, Vitest | 118 bestått |
| Frontend API-/formatteringstester, Node | 16 bestått |
| Playwright | 29 bestått: 14 flyter på desktop og mobilvisning, samt én admintest |

TypeScript-kontroll og frontendbygg passerer. Frontendlint er uten varsler.
Backendlint har ingen feil og fire eksisterende varsler om ubrukte parametere
i den første genererte migreringen.

Integrasjonstestene oppretter hver sin midlertidige SQLite-database. De
kontrollerer HTTP-kontrakter, tomme resultater, validering, publisering,
tilgangsfeil og databaseavhengig oppførsel. Healthcheckens `503` testes ved
å la databaseoperasjonen feile kontrollert; databasen på utviklermaskinen stoppes ikke.

Nettlesertestene gjør følgende automatisk:

1. Kopierer programkoden til en midlertidig mappe uten `.env`, databasefiler,
   media eller tidligere bygg. Installerte avhengigheter gjenbrukes.
2. Oppretter en ny SQLite-database med migreringene og automatisk skjemapush avslått.
3. Lager en tilfeldig testbruker, 102 fiktive lokallag, publiserte nyheter,
   ett utkast og kommende/tidligere kurs. En unik markør bekrefter riktig database.
4. Bygger frontend og starter egne Next-/Vite-servere på ledige lokale porter.
   Admin kompileres før parallelle nettlesertester starter.
5. Kjører Chromium på desktop og med Pixel 7-visning, og rydder servere og
   midlertidige filer etterpå.

Vanlige brukerflyter går gjennom den faktiske proxyen, HTTP-rutene og databasen.
Kontrollert nettleserintersepsjon brukes bare for tregt svar, serverfeil og ugyldig
JSON. Testene dekker søk etter første API-side, filtre, paginering, detaljer,
kontakter, pris, utkast, 404, lasting, tomme resultater, nytt forsøk og gamle svar
etter filterbytte. Innlogging/utlogging, adminfelter, CORS, health og skjermbredde
kontrolleres også.

Kjøring og installasjon er beskrevet i [README](../README.md). Resultater og
feilspor ligger i `Backend/playwright-report` og `Backend/test-results`, som
ikke skal committes. Playwrights HTML-rapport åpnes ikke automatisk.

## Avgrensninger

Dette er ikke gjennomført brukertesting med målgruppen. Mobiltesten er
Chromium-emulering, ikke en fysisk telefon eller Safari. Backend kjøres med
Nexts utviklingsserver i E2E, mens frontend bygges med Vite. En produksjonsdeploy
må kontrolleres separat. Ingen reell e-postleverandør eller kurspåmelding er
bekreftet av disse testene. Tekst/logo og enkelte statiske kontaktopplysninger
må fortsatt gjennomgås med kunden.

AI har bistått med vurdering, implementering og særlig skriving/feilsøking av
testene. Se [AI-loggen](ai-logg.md). Menneskelig gjennomgang er fortsatt nødvendig
for gruppens ferdigkriterium.
