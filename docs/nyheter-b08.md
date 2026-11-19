# B08 – Lese-API for nyheter

**Dato:** 6. november 2026

**Status:** Implementert på feature-branchen. Gruppens gjennomgang og merge må registreres før Kanban-kortet lukkes.

## Funksjonalitet

- `GET /api/nyheter/oversikt` gir publiserte nyheter, nyeste først.
- `lokallagId` avgrenser listen til ett lokallag; `page` og `pageSize` styrer paginering.
- `GET /api/nyheter/detaljer/:id` gir én publisert nyhet med innhold.
- Et eksisterende lokallag uten nyheter gir `200` og en tom liste. Et ukjent lokallag gir `404`.
- Ugyldige parametere gir `400`. Manglende, upubliserte og framtidige nyheter gir samme `404`.
- De egne rutene viser offentlige versjoner også for innloggede brukere og ignorerer klientforsøk på å hente utkast.
- Interne feil logges på serveren og gir en generell `500`-melding. Nektet lesetilgang gir `403`.

Svarformatene og eksemplene står i [API-avtalen](api-avtale.md).
Frontendtilkoblingen er B10; frontend bruker foreløpig sine eksisterende eksempeldata.

## Oppbygning

| Del | Ansvar |
| --- | --- |
| [Nyhet](../Backend/src/modules/nyheter/domain/Nyhet.ts) | Publisert nyhet uten Payload-avhengighet |
| [NyhetRepository](../Backend/src/modules/nyheter/application/NyhetRepository.ts) | Kontrakt for datatilgang og lokallagsoppslag |
| [NyhetService](../Backend/src/modules/nyheter/application/NyhetService.ts) | Validering, normalisering av ID-er, tidsgrense, paginering og mangler-feil |
| [PayloadNyhetRepository](../Backend/src/modules/nyheter/adapters/PayloadNyhetRepository.ts) | Databasesøk, publiseringsfilter, sortering og mapping |
| [DTO-er](../Backend/src/modules/nyheter/http/NyhetDTO.ts) | Avtalte oversikts- og detaljfelt |
| [HTTP-endepunkter](../Backend/src/modules/nyheter/http/nyhetEndpoints.ts) | Kobler service og adapter, registrerer parametere og oversetter feil til HTTP |

Nyhetsmodulen leser lokallagsdata gjennom Payload og er uavhengig av B07s detaljendepunkt.

## Publisering og eksisterende data

[Nyheter-samlingen](../Backend/src/collections/Nyheter.ts) bruker `_status` og `publishedAt`.
Et utkast kan være ufullstendig. Ved publisering kreves blant annet et lokallag.
Publiseringsdatoen settes automatisk første gang og beholdes ved senere redigering
og republisering. Datoen kan ikke overskrives gjennom vanlige oppdateringer.

Nyheter som har mistet lokallagskoblingen, skjules i offentlige svar. Innloggede
brukere kan rette koblingen i admin. Innlogging er foreløpig skillet for tilgang
til utkast; egne redaktørroller er ikke implementert i prosjektet.

[Migreringen](../Backend/src/migrations/20261105_051419_nyheter_publisering.ts)
bevarer gamle nyheter og koblinger og gir dem status `draft` og tom publiseringsdato.
Disse må gjennomgås og publiseres før de blir synlige. SQL-kopieringen er rettet slik
at bare felter fra den gamle tabellen kopieres. De nye feltene får standardverdier.
Tilbakeføring fjerner versjonshistorikk og publiseringsfeltene; ufullstendige utkast
må kompletteres før de kan passe inn i den gamle tabellens påkrevde felt.

Nye nyheter fra [seed-scriptet](../Backend/src/seed/seed.ts) publiseres automatisk.
Eksisterende seed-poster oppdateres ikke ved ny kjøring. Følg [testdataoppskriften](testdata.md)
for å starte fra en ny testdatabase.

## Kontroll

Kjør fra `Backend`:

```bash
npm run test:unit
npm run test:nyheter
npm run test:lokallag
npx tsc --noEmit
npm run lint
```

Testene bruker egne midlertidige SQLite-databaser og rydder opp etterpå.
`test:nyheter` kjører publiseringstestene, repository-testene og HTTP-testene.
Enhetstestene kontrollerer service og DTO-er uten Payload eller database.

Kontrollene omfatter filtrering før paginering, stabil sortering ved lik dato,
tom liste, ukjent og ugyldig ID, dato ved første publisering og redigering,
skjuling av utkast og framtidige datoer, innlogget/utlogget lesing, versjonshistorikk,
lokallagskravet, manglende kobling, CORS og normaliserte feilsvar.

Gjennomført kontroll 6. november 2026:

| Kontroll | Resultat |
| --- | --- |
| Enhetstester | 49 bestått, inkludert 33 for nyhetsservice/DTO |
| Nyhetsintegrasjon | 53 bestått: 13 for publisering, 7 for repository og 33 for HTTP |
| Lokallagsintegrasjon | 7 bestått som regresjonskontroll |
| TypeScript | Bestått |
| ESLint | Ingen feil; 9 eksisterende advarsler i uendrede filer |
| Migrering og seeding via Payload CLI | Tom database og gjentatt migrering fungerer; to seed-kjøringer gir 4/4/4 uten nye publiseringsdatoer |
| Oppgradering fra gammelt skjema | Eksisterende nyhet beholder innhold, ID, lokallag og tidsstempler og blir utkast |
| API med migrert database | Oversikt, filtrering, detaljer og ukjent ID kontrollert med automatisk skjemapush deaktivert |

AI er brukt til veiledning, deler av implementeringen, dokumentasjonen og til å skrive
testene. Koden og testresultatene skal inngå i gruppens gjennomgang av PR-en.
