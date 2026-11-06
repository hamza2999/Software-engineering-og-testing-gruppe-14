# Software-engineering-og-testing-gruppe-14

Gruppe 14 sin kodebase for Østfold husflidslag. Gruppen består av Hamza,
Magomed, Abdullahi, Jovan og Oskar. Frontend bruker React/Vite, og backend
bruker Payload CMS/Next.js med SQLite. Oppsettet er kontrollert med Node 24.

## Installere og konfigurere

Kjør fra repo-roten:

```bash
npm ci --prefix Backend
npm ci --prefix Frontend
```

Opprett `Backend/.env` fra [Backend/.env.example](Backend/.env.example), uten å
overskrive en eksisterende fil. Sett en egen `PAYLOAD_SECRET` og databaseadresse.
For en ny database som skal styres med migreringer, sett `PAYLOAD_DB_PUSH=false`.
`true` tillater Payloads automatiske skjemaendringer under utvikling.
Behold eksisterende databaseoppsett og ta kopi før du bytter strategi på en database med data.

`FRONTEND_URL` angir tillatte frontend-origins, normalt `http://localhost:5173`
og `http://127.0.0.1:5173`. Hemmeligheter og databasefiler skal ikke inn i Git.

For en **ny, tom database**, kjør fra `Backend`:

```bash
npm run payload -- migrate
NODE_ENV=production npm run payload -- run src/seed/seed.ts
```

Seeding er valgfritt og oppretter fire fiktive lokallag, fire nyheter og fire kurs.
Gjentatt kjøring hopper over eksisterende poster. Kursdatoene er faste, så antall
kommende kurs endrer seg over tid. Se [testdata og separat testdatabase](docs/testdata.md).
En gammel database opprettet med automatisk skjemapush kan ikke uten videre
kjøre den første migreringen, som oppretter tabellene på nytt.

## Starte løsningen

Kjør fra repo-roten i hver sin terminal:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Åpne frontend på `http://localhost:5173` og admin på `http://localhost:3000/admin`.
Opprett første adminbruker i Payload hvis databasen er ny. `npm run dev` starter
også frontend. Frontend videresender `/api` til backend på port 3000.

Hvis backend har en annen adresse, opprett `Frontend/.env` fra
[Frontend/.env.example](Frontend/.env.example) og endre `API_PROXY_TARGET`.
`VITE_API_BASE_URL` er normalt `/api`. Frontendvariabler bygges inn i klienten og
skal ikke inneholde hemmeligheter. Ved publisering må `/api` rutes til backend,
eller en absolutt API-adresse med riktig CORS-/cookieoppsett brukes.

`GET http://localhost:3000/api/health` gir `{"status":"ok"}` når databasen kan
leses. `503` betyr at kontrollen fant en databasefeil.

## Tester

Fra repo-roten:

```bash
npm run test:frontend
npm run test:backend
```

Frontendtester bruker Nodes testkjører. Backend har Vitest-enhetstester og
integrasjonstester med egne midlertidige databaser.

Installer Playwrights Chromium én gang fra `Backend`:

```bash
npx playwright install chromium
```

Kjør deretter nettlesertestene fra repo-roten:

```bash
npm run test:e2e
```

Testoppsettet oppretter en egen database, kjører migreringer, lager fiktive data,
bygger frontend og starter egne servere på ledige porter. Det bruker ikke den
vanlige utviklingsdatabasen eller `.env`-filene. Midlertidig miljø ryddes etterpå.
Begge prosjektenes avhengigheter må være installert. Første kjøring kan ta noen minutter.

På Ubuntu 26.04 gjenkjenner ikke prosjektets Playwright-versjon OS-navnet.
På denne maskinen er følgende kompatibilitetsvalg kontrollert:

```bash
# Fra Backend, ved installasjon:
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npx playwright install chromium
# Fra repo-roten, ved kjøring:
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 npm run test:e2e
```

`npm test` fra repo-roten kjører frontend-, backend- og nettlesertester i rekkefølge.
Bruk samme miljøvariabel på Ubuntu 26.04. Se
[testdekning og begrensninger for B10/B11](docs/integrasjon-b10-b11.md).

## Dokumentasjon

- [API-avtale](docs/api-avtale.md)
- [Kodearkitektur med DI, DTO og diagrammer](docs/kodearkitektur-lokallag.md)
- [B08 nyheter](docs/nyheter-b08.md) og [B09 kurs](docs/kurs-b09.md)
- [Sprint 4](docs/sprint-4-kanban.md)
- [AI-logg](docs/ai-logg.md)
