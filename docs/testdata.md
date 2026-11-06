# Testdata – B05

Testdataene ligger i `Backend/src/seed/data.ts` og består av fire fiktive
lokallag, fire kurs og fire nyheter. `Backend/src/seed/seed.ts` oppretter
postene og kobler kurs og nyheter til riktig lokallag.
Nye testnyheter opprettes som publiserte, og publiseringshooken setter datoen.

## Opprette testdata

Backendens avhengigheter må være installert, og `PAYLOAD_SECRET` må være
satt i miljøet eller i `Backend/.env`.

Kjør kommandoene fra `Backend`-mappen, i samme terminal. Fortsett til
seeding når migreringen er fullført uten feil:

```bash
b05_test_dir=$(mktemp -d)
DATABASE_URL="file:$b05_test_dir/seed.db" npm run payload -- migrate
NODE_ENV=production DATABASE_URL="file:$b05_test_dir/seed.db" npm run payload -- run src/seed/seed.ts
```

Dette oppretter en egen, midlertidig SQLite-database med tabeller og
testdata. `DATABASE_URL` gjelder bare den enkelte kommandoen, så den
vanlige utviklingsdatabasen berøres ikke.

## Kontroll av gjentatt kjøring

Forventet resultat er fire lokallag, fire kurs og fire nyheter:

```text
Publiserte nyheter i databasen: 4
Lokallag i databasen: 4
Kurs i databasen:  4
```

Kjør seed-kommandoen én gang til i samme terminal:

```bash
NODE_ENV=production DATABASE_URL="file:$b05_test_dir/seed.db" npm run payload -- run src/seed/seed.ts
```

Antall poster skal være uendret. Scriptet gjenkjenner lokallag etter navn,
og kurs og nyheter etter kombinasjonen av tittel og lokallag. Eksisterende
poster hoppes over og oppdateres ikke dersom innholdet i `data.ts` endres.
Nyhetstellingen viser poster som kan leses uten innlogging. Dersom gamle seed-poster
allerede finnes som utkast, publiseres de ikke automatisk ved ny kjøring. Bruk en ny
testdatabase eller publiser de aktuelle testnyhetene i adminpanelet etter gjennomgang.

## Starte med tom testdatabase

Kjør alle tre kommandoene under «Opprette testdata» på nytt. `mktemp -d`
oppretter en ny midlertidig mappe, slik at migrering og seeding bruker en
ny, tom database. Den forrige testdatabasen slettes ikke.

Denne fremgangsmåten starter testmiljøet på nytt med de fiktive dataene.
Den nullstiller ikke den vanlige utviklingsdatabasen.
