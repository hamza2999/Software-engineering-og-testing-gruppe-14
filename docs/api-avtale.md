# API-avtale – B06

**Dato:** 2. november 2026

**Sist oppdatert:** 6. november 2026 (B08 og B09)

**Status:** Utkast til felles kontrakt for frontend og backend. Gruppens gjennomgang er ikke registrert.

Avtalen beskriver offentlig lesing av lokallag, nyheter og kurs. Den konkretiserer
[datamodellen for sprint 1](datamodell-sprint1.md) og gir et grunnlag for B07–B10.
Innlogging, innholdsredigering og kurspåmelding har egne behov og inngår ikke i denne kontrakten.

«Implementert» betyr at endepunktet finnes i dagens kode. «Planlagt» beskriver
formatet vi skal bygge; slike endepunkter kan ikke tas i bruk ennå. JSON-eksemplene
er illustrative. ID-er og antall må alltid leses fra API-et.

## 1. Adresser og endepunkter

Backend kjører normalt på `http://localhost:3000` under lokal utvikling.
Frontend bruker relative adresser, for eksempel `/api/lokallag/oversikt`.
[Vite-konfigurasjonen](../Frontend/vite.config.js) videresender `/api` til backend
under utvikling. Tilsvarende ruting ved publisering må settes opp separat.

Alle endepunktene nedenfor bruker `GET`, har ingen forespørselskropp og skal kunne
leses uten innlogging. Svarene leveres som JSON.

| Metode | Sti | Formål | Status |
| --- | --- | --- | --- |
| GET | `/api/lokallag/oversikt` | Liste over lokallag | Implementert |
| GET | `/api/lokallag/detaljer/:id` | Ett lokallag med adresse og kontaktinformasjon | Planlagt i B07 |
| GET | `/api/nyheter/oversikt` | Publiserte nyheter, eventuelt for ett lokallag | Implementert i B08 |
| GET | `/api/nyheter/detaljer/:id` | Én publisert nyhet med innhold | Implementert i B08 |
| GET | `/api/kurs/oversikt` | Kommende kurs, eventuelt for ett lokallag | Implementert i B09 |
| GET | `/api/kurs/detaljer/:id` | Ett kurs med tidspunkt, sted og pris | Implementert i B09 |

`:id` erstattes med en ID fra API-et, for eksempel `/api/lokallag/detaljer/1`.
Payloads vanlige samlingsruter finnes også, men har andre svarformater.
De nye detaljrutene får derfor `/detaljer/:id` og erstatter ikke Payloads
innebygde `/api/<samling>/:id`-ruter.

## 2. Felles formater og paginering

- `id` leveres som tekst, selv om SQLite lagrer ID-en som et tall.
- Relasjoner i nyhets- og kurssvarene leveres som `lokallagId: string`.
  Frontend får dermed samme form uavhengig av Payloads `depth`-innstilling.
- Valgfrie felt som inngår i en DTO, leveres som `null` når de mangler.
- `description` og `content` er ren tekst, ikke HTML.
- Datoer leveres som ISO 8601-tidsstempler i UTC, for eksempel
  `2026-11-15T12:00:00.000Z`. Frontend viser dato og klokkeslett i `Europe/Oslo`.

Alle oversikter bruker følgende parametere. Dette er implementert for lokallag,
nyheter og kurs:

| Parameter | Type | Standard | Krav |
| --- | --- | --- | --- |
| `page` | Heltall | `1` | Positivt, sikkert heltall |
| `pageSize` | Heltall | `20` | Fra `1` til `100` |

«Sikkert heltall» betyr et heltall som JavaScript kan representere nøyaktig.
Hvis beregningen `(page - 1) * pageSize` overskrider dette området, returneres `400`.

Et listesvar inneholder alltid:

| Felt | Type | Betydning |
| --- | --- | --- |
| `items` | Array | Postene på siden |
| `page` | Number | Siden som ble forespurt |
| `pageSize` | Number | Maksimalt antall poster på siden |
| `totalItems` | Number | Antall treff etter filtrering, før paginering |
| `totalPages` | Number | Antall sider, beregnet som `Math.ceil(totalItems / pageSize)` |

En gyldig forespørsel uten treff gir `200`, ikke `404`:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

En side etter siste tilgjengelige side gir også `200` med `items: []`.
`page` beholder den forespurte verdien, og totalfeltene beholder antall treff og sider.

## 3. Lokallag

### 3.1 Oversikt – implementert

```text
GET /api/lokallag/oversikt?page=1&pageSize=20
```

Svaret sorteres stigende på `name`, deretter `id`. Hvert element har feltene
`id`, `name`, `region` og `description`, alle som tekst.

Eksempel med ett lokallag i databasen:

```json
{
  "items": [
    {
      "id": "1",
      "name": "Testlag Nord",
      "region": "Nord",
      "description": "Et fiktivt lokallag."
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

Adresse og kontaktinformasjon er ikke med i oversikten. Se
[LokallagDTO](../Backend/src/modules/lokallag/http/LokallagDTO.ts),
[HTTP-endepunktet](../Backend/src/modules/lokallag/http/lokallagEndpoints.ts) og
[servicen](../Backend/src/modules/lokallag/application/LokallagService.ts).

### 3.2 Detaljer – planlagt i B07

```text
GET /api/lokallag/detaljer/1
```

Ved treff returneres `200` og ett objekt direkte, uten `items` eller paginering:

```json
{
  "id": "1",
  "name": "Testlag Nord",
  "region": "Nord",
  "description": "Et fiktivt lokallag.",
  "address": "Storgata 1",
  "contactEmail": null,
  "contactPhone": null
}
```

`address` er tekst og påkrevd i dagens samling. `contactEmail` og `contactPhone`
er tekst eller `null`. En gyldig ID som ikke finnes, gir `404`.

## 4. Nyheter – implementert i B08

### 4.1 Oversikt

```text
GET /api/nyheter/oversikt?lokallagId=1&page=1&pageSize=20
```

`lokallagId` er valgfri. Uten parameteren returneres publiserte nyheter fra alle
lokallag. Med parameteren returneres bare nyheter fra det angitte lokallaget.

Publiseringsreglene i denne kontrakten er:

- Bare nyheter med `_status: "published"` og `publishedAt` lik eller tidligere enn
  tidspunktet for forespørselen er synlige gjennom de offentlige endepunktene.
- Nyheter sorteres på `publishedAt`, nyeste først, deretter `id` stigende ved lik dato.
- Utkast og nyheter med framtidig publiseringsdato skal heller ikke kunne hentes
  gjennom den offentlige detaljruten, selv om leseren kjenner ID-en.
- Et eksisterende lokallag uten publiserte nyheter gir `200` og en tom liste.
  Et lokallag som ikke finnes, gir `404`.
- De egne nyhetsrutene viser bare offentlige versjoner også når brukeren er innlogget.
  Parametere som `draft`, `where` og `publishedAtOrBefore` gir ikke tilgang til utkast
  eller mulighet til å endre serverens tidsgrense.
- Publisering krever et lokallag. Nyheter som har mistet koblingen, for eksempel ved
  sletting av lokallaget, skjules i offentlige svar frem til koblingen er rettet.

Eksempel med én publisert nyhet som matcher filteret:

```json
{
  "items": [
    {
      "id": "1",
      "title": "Nyheter fra Testlag Nord",
      "lokallagId": "1",
      "publishedAt": "2026-11-01T10:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

Alle feltene i hvert listeelement er tekst. Artikkelinnholdet hentes fra detaljruten.

### 4.2 Detaljer

```text
GET /api/nyheter/detaljer/1
```

Ved treff returneres `200`:

```json
{
  "id": "1",
  "title": "Nyheter fra Testlag Nord",
  "content": "Dette er innholdet i en fiktiv nyhet.",
  "lokallagId": "1",
  "publishedAt": "2026-11-01T10:00:00.000Z"
}
```

En manglende eller ikke offentlig tilgjengelig nyhet gir `404` med samme feilmelding.

**Implementert:** Samlingen bruker Payloads utkastfunksjon og feltet `publishedAt`.
Hooken setter datoen ved første publisering og beholder den ved redigering,
avpublisering og republisering. Innloggede brukere kan arbeide med utkast gjennom
admin/Payloads vanlige ruter; anonym lesing og versjonshistorikk er tilgangsstyrt.
De egne offentlige endepunktene filtrerer alltid på publisert status og tidsgrense.
Se [implementering og kontroll av B08](nyheter-b08.md).

## 5. Kurs – implementert i B09

### 5.1 Oversikt

```text
GET /api/kurs/oversikt?lokallagId=1&page=1&pageSize=20
```

`lokallagId` er valgfri og har samme betydning og feilregler som for nyheter.
Uten parameteren returneres kommende kurs fra alle lokallag.

«Kommende» betyr `date` lik eller senere enn serverens tidspunkt for forespørselen.
Filtrering og sortering skjer før paginering. Listen sorteres på `date` stigende,
deretter `id` stigende ved lik dato. Et eksisterende lokallag uten kommende kurs
gir `200` med en tom liste.

Tidspunktet beregnes på serveren for hver forespørsel. Klientparametere som
`startsAtOrAfter`, `where` og `sort` endrer ikke disse reglene. Datoer normaliseres
til UTC ved lagring, slik at ulike tidssoneangivelser sammenlignes korrekt.

Eksempel med ett kommende kurs som matcher filteret:

```json
{
  "items": [
    {
      "id": "1",
      "title": "Strikkekurs",
      "date": "2026-11-15T12:00:00.000Z",
      "description": "Et fiktivt kurs for nybegynnere.",
      "location": "Storgata 1, møterom 2",
      "price": 15000,
      "currency": "NOK",
      "image": null,
      "lokallagId": "1"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

### 5.2 Detaljer

```text
GET /api/kurs/detaljer/1
```

Ved treff returneres `200` med ett objekt direkte:

```json
{
  "id": "1",
  "title": "Strikkekurs",
  "date": "2026-11-15T12:00:00.000Z",
  "description": "Et fiktivt kurs for nybegynnere.",
  "location": "Storgata 1, møterom 2",
  "price": 15000,
  "currency": "NOK",
  "image": null,
  "lokallagId": "1"
}
```

Listeelementet og detaljsvaret bruker samme kursformat i første versjon:

| Felt | Type | Regel |
| --- | --- | --- |
| `id`, `title`, `description`, `location`, `lokallagId` | String | Påkrevd |
| `date` | String | ISO 8601-tidsstempel i UTC |
| `price` | Number | Sikkert heltall, minst `0`, angitt i øre |
| `currency` | String | Alltid `"NOK"` |
| `image` | String eller null | Bildelenke når den finnes |

`price: 15000` betyr 150 kroner, og `price: 0` betyr gratis. Frontend deler på 100
ved visning som kroner. Manglende pris skal ikke tolkes som gratis. `currency`
kan settes til `"NOK"` i DTO-en og trenger ikke et eget databasefelt.

En gyldig kurs-ID som ikke finnes eller peker på et ufullstendig kurs, gir `404`.
Detaljruten kan også vise et tidligere
kurs; «kommende»-filteret gjelder oversikten. Datoen avgjør om frontend viser at
kurset er avsluttet. Detaljvisningen innebærer ikke at en påmeldingsfunksjon er implementert.

**Implementert:** Samlingen har `location` og `price`. Lagringshooken krever et
gyldig tidspunkt, utfylt sted, gyldig pris og et eksisterende lokallag ved opprettelse
og endring. Sted trimmes, og tidspunktet lagres i UTC. Priskravet gjelder også `0`,
som må angis uttrykkelig når kurset er gratis.

Databasefeltene for sted og pris er nullable for å bevare eksisterende kurs uten
å finne på manglende verdier. Offentlige svar inneholder bare komplette kurs,
også når brukeren er innlogget. Gamle ufullstendige kurs kan leses og kompletteres
i admin/Payloads vanlige ruter av innloggede brukere. Kurs som mister lokallaget,
skjules i offentlige svar. Se [implementering og kontroll av B09](kurs-b09.md).

## 6. Feilsvar

Avtalt feilformat er et objekt med en lesbar `error`-tekst:

```json
{
  "error": "page må være et positivt heltall."
}
```

Dette formatet er implementert i nyhets- og kursrutene og for pagineringsfeil i
lokallagsoversikten. Det gjelder som krav for de øvrige planlagte rutene.

| Status | Situasjon | Eksempel på `error` | Status i kode |
| --- | --- | --- | --- |
| 400 | Ugyldig `page` | `page må være et positivt heltall.` | Implementert for alle oversikter |
| 400 | Ugyldig `pageSize` | `pageSize må være et heltall mellom 1 og 100.` | Implementert for alle oversikter |
| 400 | Sideberegningen blir for stor | `Den valgte siden er for stor.` | Implementert for alle oversikter |
| 400 | Ugyldig detalj-ID | `id må være en positiv heltalls-ID.` | Implementert for nyheter og kurs |
| 400 | Ugyldig lokallagsfilter | `lokallagId må være en positiv heltalls-ID.` | Implementert for nyheter og kurs |
| 403 | Lesetilgang nektes | `Ingen tilgang til å lese dataene.` | Implementert for nyheter og kurs |
| 404 | Lokallaget finnes ikke | `Lokallaget finnes ikke.` | Implementert for nyhets- og kursfilter |
| 404 | Nyheten finnes ikke eller er ikke offentlig | `Nyheten finnes ikke.` | Implementert |
| 404 | Kurset finnes ikke eller er ufullstendig | `Kurset finnes ikke.` | Implementert |
| 500 | Uventet serverfeil | `Kunne ikke hente data. Prøv igjen senere.` | Implementert for nyheter og kurs |

For nyhetsrutene, kursrutene og de planlagte rutene må `id` og `lokallagId` være positive heltalls-ID-er som
kan representeres sikkert i JavaScript. Tom verdi, `0`, negative tall, desimaltall
og `abc` gir `400`. Gyldig format uten en tilhørende post gir `404`. Parametere
valideres før oppslag, og et oppgitt lokallag kontrolleres før den filtrerte listen hentes.

Eksempel på en implementert valideringsfeil:

```text
GET /api/lokallag/oversikt?page=0
HTTP-status: 400
```

Eksempel på feil når et lokallagsfilter peker på et lokallag som ikke finnes
(samme format er planlagt for lokallagsdetaljer):

```json
{
  "error": "Lokallaget finnes ikke."
}
```

HTTP-statusen for dette svaret er `404`.

Uventede feil og tilgangsfeil sendes i dag videre til Payload av lokallagsendepunktet.
JSON-formatet er derfor ikke normalisert for alle feil ennå. Integrasjonstesten
verifiserer `403` dersom lesetilgangen nektes, selv om normal konfigurasjon tillater
offentlig lesing. Frontend må ha en generell feilmelding dersom `error`-feltet mangler;
den skal ikke være avhengig av Payloads interne feilstruktur.

## 7. Bruk i frontend – B10

| Frontendside | Planlagt datakilde |
| --- | --- |
| Medlemsgrupper | `/api/lokallag/oversikt` |
| Én medlemsgruppe | `/api/lokallag/detaljer/:id` |
| Nyhetsliste | `/api/nyheter/oversikt` |
| Én nyhet | `/api/nyheter/detaljer/:id` |
| Kursliste | `/api/kurs/oversikt` |
| Kursdetaljer der disse vises | `/api/kurs/detaljer/:id` |

Frontend skal:

1. Bruke `items` fra listesvar og objektet direkte fra detaljsvar.
2. Bruke ID-ene fra API-et i lenker, uten å anta faste ID-er fra eksempeldata.
3. Håndtere lasting, tom liste, `404` på detaljsider og andre feil som ulike tilstander.
4. Kontrollere `response.ok`; et HTTP-feilsvar må håndteres selv om nettverkskallet lykkes.
5. Formatere ISO-datoer og pris i øre før de vises til brukeren.
6. Bruke `totalPages` når flere sider skal hentes. Dagens lokale søk i medlemsgrupper
   dekker bare innlastede poster; dersom samme klientsøk beholdes, må alle sidene
   hentes før søket skal dekke samtlige lokallag.

## 8. Gjennomgang og videre implementering

| Oppgave | Hva som skal kontrolleres |
| --- | --- |
| B06 | Gjennomgå adresser, DTO-felt, prisformat, publiseringsregler og feilsvar med frontend |
| B07 | Beholde fungerende lokallagsoversikt og implementere detaljruten med `400` og `404` |
| B08 | Implementert og testet; gjennomgang og merge følger gruppens GitHub-flyt |
| B09 | Implementert og testet; gjennomgang og merge følger gruppens GitHub-flyt |
| B10 | Erstatte eksempeldata i frontend og håndtere tilstandene beskrevet over |
| B11 | Verifisere kontraktene med tester av svarformat, filtrering, sortering, tomme svar og feil |

Eksisterende [integrasjonstester for lokallag](../Backend/tests/int/lokallag.int.spec.ts)
dekker allerede listeformat, sortering, paginering, ugyldige parametere, en side uten
treff og nektet lesetilgang. Nyhetsrutene har egne enhets- og integrasjonstester,
inkludert HTTP-svar og skjuling av upubliserte nyheter. Kursrutene har enhets- og
integrasjonstester for kommende-filter, tidspunkt, pris, sted og feilsvar.
De øvrige planlagte endepunktene må få tilsvarende kontroller.

Avtalen er skrevet med AI-støtte og kontrollert mot eksisterende kode.
Gruppens godkjenning er ikke registrert. Status og eksempler oppdateres når
implementeringen endres; dokumentet alene betyr ikke at de planlagte rutene er ferdige.
