# Konto og passord

Deltakere kan opprette en konto med e-post og passord via `POST /api/users`,
logge inn og lese eller endre sin egen konto. Payload håndterer hashing og
sesjoner. Serveren tildeler rollen `deltaker` ved offentlig registrering. Bare
en administrator kan tildele roller og lese andre kontoer.

Administratorer kan redigere kurs, nyheter, lokallag og medier. Utkast og
versjonshistorikk for nyheter og ufullstendige kurs krever administrator.
Offentlige lese-API-er beholder sine tidligere publiseringsregler. Rollen
`lokallagsansvarlig` er reservert: inntil tilhørighet til et lokallag er
implementert, har den deltakerens lesetilgang og ingen skriverett til innhold.

## Opprette administrator

På en ny database opprettes administrator fra en terminal på backendserveren.
Dette virker også hvis en deltaker registrerte seg først. Payloads offentlige
førstegangsveiviser tildeler ingen administratorrettighet. Kjør migreringene
først for en ny migreringsstyrt database. Kjør deretter fra `Backend` (Bash):

```bash
read -r -p 'Ny administrator, e-post: ' BOOTSTRAP_ADMIN_EMAIL
read -r -s -p 'Passord (minst 12 tegn): ' BOOTSTRAP_ADMIN_PASSWORD
export BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
npm run payload -- run src/scripts/createAdmin.ts
unset BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_PASSWORD
```

Velg en ny adresse. Verktøyet endrer aldri en eksisterende konto basert på en
e-postadresse. Logg inn i `/admin` med kontoen som ble opprettet. For en
eksisterende database fra hovedgrenen før roller: ta sikkerhetskopi, stopp
skriving og kjør migreringen med `PAYLOAD_DB_PUSH=false npm run payload -- migrate`
før ny appversjon startes. Migreringen bevarer eksisterende kontoers tidligere
administratortilgang. Nye kontoer får den separate standardrollen `deltaker`.
Ved bruk av utviklingsmodus med skjemapush alene kjøres ikke datamigreringens
backfill. Bruk det lokale adminverktøyet ved behov og gjennomgå eksisterende
kontoer. Tilbakerulling av rolleskjemaet stoppes hvis ikke-administratorer finnes: gammel kode ville ellers behandlet disse kontoene som administratorer.

## Tilbakestilling

Sett `PAYLOAD_PUBLIC_SERVER_URL` til den eksternt tilgjengelige backend-originen
(eksempel for lokal utvikling står i `Backend/.env.example`). Passordlenken går
til backendens norskspråklige `/tilbakestill-passord`. Tokenet ligger i
URL-fragmentet og sendes først til reset-API-et i en POST-kropp når passordet
lagres. Dette holder tokenet ute av sidens GET-adresse og referer. Bruk HTTPS
ved publisering.

Payloads standard endepunkter brukes til innlogging, utlogging og rekvirering
av passordlenker. Et faktisk e-postoppsett kreves for levering til en
postkasse. Testene verifiserer den genererte lenken, gjennomført passordbytte
og at den samme lenken bare kan brukes én gang.
