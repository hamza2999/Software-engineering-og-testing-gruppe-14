# S4-07: kapasitet, kurstype og ledige plasser

Dette er første, avgrensede del av Jovans S4-07 fra Sprint 4-kanbanen. Oppgaven er
ikke ferdig. S4-03 eies av Magomed og må avklare datamodell og API før felter,
migreringer og endepunkter kobles til.

## Implementert

`Backend/src/modules/kurs/domain/KursCapacity.ts` inneholder
`calculateAvailablePlaces(capacity, activeRegistrationCount)`. Funksjonen bruker
bare tall og har ingen avhengighet til Payload, HTTP eller database. Den følger
prosjektets oppdeling med rammeverksuavhengig logikk i modulens kjerne.

Begge argumentene må være ikke-negative, sikre heltall. Ugyldige tall gir
`InvalidKursCapacityError`. For en endelig plassgrense beregnes antall ledige
plasser som `Math.max(0, capacity - activeRegistrationCount)`.

Eksempel: ti plasser og tre aktive påmeldinger gir sju ledige. Et fullt kurs
eller et kurs med flere aktive enn plassgrensen viser null ledige plasser.
Dette er en leseberegning; kontroll av endringer i kapasitet og atomisk påmelding
må implementeres i de respektive skriveoperasjonene.

En endelig plassgrense på null gir matematisk null ledige plasser. Dette
bestemmer ikke om kurs kan lagres med kapasitet null, eller hvordan et eventuelt
ubegrenset kurs skal representeres. Slike valg tilhører S4-03 og kundeavklaringen.
Funksjonen skal bare brukes for en kjent, endelig plassgrense.

Kalleren må levere antall aktive påmeldinger. Ingen statusnavn eller
påmeldingssamling er valgt her. Testen med et redusert aktivt antall kontrollerer
beregningen; den beviser ikke at avmeldte filtreres bort i databasen.

Denne delen er selvstendig og er ennå ikke kalt fra en service, DTO eller et
endepunkt. B09-kursmodulen finnes i den gjennomgåtte integrasjonsbranchen,
`feat/b10-b11-integrasjon` ved `a49893331509de4721e367e23b2d5c448e98a43c`.
Den lokale B07-branchen manglet denne modulen ved oppstart. De nye filene kan
følge kursmodulen videre uten å erstatte dens eksisterende filer. Eksisterende
B07-endringer og frontend er beholdt.

## Avklaringer før tilkobling

- Kapasitetsfeltets navn, grenser og betydningen av null eller manglende verdi.
- Tillatte kurstyper og feltnavn i datamodellen og API-et.
- Påmeldingsmodell, hvilke statuser som er aktive, og hvordan avmelding lagres.
- Verdier for eksisterende kurs og migrering uten tap av eksisterende data.
- Håndtering når ny kapasitet er lavere enn antall aktive påmeldinger.
- Hvilke kursresponser som skal inneholde kapasitet, kurstype og ledige plasser.

Disse punktene er åpne spørsmål, ikke vedtatte utvidelser av kravene.

## Videre implementering og tester

| Krav fra S4-07                                       | Status og neste kontroll                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Beregne ledige plasser                               | Domenefunksjon og enhetstester er lagt til.                                                 |
| Validert kapasitet og kurstype på kurs               | Avventer S4-03; test gyldige og ugyldige feltverdier gjennom Payload.                       |
| API viser kapasitet og korrekt tilgjengelighet       | Avventer felt/API-avtalen; utvid eksisterende kursservice, adapter og DTO-er.               |
| Avmeldte teller ikke                                 | Avventer påmeldingsmodellen; test blandede statuser og faktisk avmelding gjennom databasen. |
| Kapasitet under antall aktive håndteres etter avtale | Avventer regelen; test at endringen behandles riktig og at data bevares.                    |

Når avtalen er klar, legges modellfeltene og funksjonseiers migrering til i
samråd med Magomed. Payload-adapteren leverer det korrekte aktive antallet,
kursmodulens kjerne bruker beregningen, og DTO-ene følger den avtalte kontrakten.
Adapteren viderefører `req` og `overrideAccess: false` etter eksisterende mønster.
Oppretting av nye påmeldinger og konkurrerende forsøk på siste plass tilhører
S4-08; en tilgjengelighetsberegning alene reserverer ingen plass.

## Kontroll og AI-bruk

Kjør fra `Backend` med Node og prosjektets avhengigheter tilgjengelig:

```powershell
npm run test:unit -- tests/unit/KursCapacity.test.ts
npm run test:unit
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Kontrollert lokalt 10. november 2026 med Node.js 22.23.4 på den lokale
`feat/b07-detaljoppslag`-branchen:

| Kontroll                                   | Faktisk resultat                                               |
| ------------------------------------------ | -------------------------------------------------------------- |
| Vitest, hele den lokale enhetstestsuiten   | 57 bestått: 19 nye kapasitetstester og 38 eksisterende tester. |
| TypeScript, `--noEmit --incremental false` | Bestått.                                                       |
| ESLint, hele backend                       | Ingen feil; ni eksisterende varsler utenfor de nye filene.     |
| Prettier, de tre nye filene                | Formatert etter prosjektets konfigurasjon.                     |

Vitest ble kjørt med `--config vitest.unit.config.mts --no-cache` og returnerte
exit-kode 0. TypeScript og ESLint returnerte også 0. Antallet 57 gjelder denne
lokale branchen, som ennå ikke inneholder alle modulene i integrasjonsbranchen.
Den eksisterende Node-installasjonen i den midlertidige mappen ble brukt; ingen
nye pakker ble installert.

Ingen integrasjonstest for S4-07 er på plass ennå, siden denne delen ikke bruker
Payload eller database. Integrasjons-/nettlesertester og produksjonsbygg ble
ikke kjørt for denne endringen.

Denne avgrensede domenefunksjonen, testene og arbeidsnotatet er utarbeidet med
AI-støtte 10. november 2026. Gruppen må gjennomgå reglene og dokumentere egen
forståelse. Ingen estimerte timer er oppgitt som faktisk arbeidstid.
