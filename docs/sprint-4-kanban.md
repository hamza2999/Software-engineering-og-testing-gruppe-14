# Sprint 4

Planutkast oppdatert 6. november 2026. Frist: **20. november 2026**. Sprinten samler gjenstående arbeid fra sprint 2, 3 og 4. Tidligere sprintstatus omskrives ikke.

Alle fem deltar: Magomed, Jovan, Abdullahi, Hamza og Oskar. Hamza er Product Owner og Oskar Scrum Master, i tråd med prosjektrapporten. Ansvar, estimater, reviewere og delmål nedenfor er forslag. Faktisk kapasitet må sammenlignes med omfanget før gruppen forplikter seg.

Målet er en sammenhengende prototype for lokallag, kurs, nyheter, konto, påmelding/avmelding og administrasjon, med intern booking, brukertesting og oppdatert rapport. P0/P1 er foreløpig estimert til **152 persontimer**. P2 kommer i tillegg med **31 timer** og inngår ikke i minimumsleveransen.

## Arbeidsmåte

- Statusene er **Å gjøre → Pågår → Test / Review → Ferdig**. Maks én oppgave i Pågår per person. Ta høyeste prioritet der avhengighetene er klare.
- Oppdater status, faktisk brukt tid og hindringer daglig. Estimatene inkluderer utviklerens egen kontroll; reviewer skal være en annen person.
- Kode er Ferdig når ferdigkriteriet er oppfylt, relevante tester passerer, en annen har gjennomgått endringen og den er merget. Dokumentasjon og avklaringer er Ferdig når de er gjennomgått og tilgjengelige.
- B08/B09 har åpne PR-er. B07 HTTP-kobling og B10/B11 er implementert og testet på integrasjonsbranchen. S4-01 følger opp gjennomgang og merge; ingen av disse markeres ferdige bare fordi kode finnes lokalt.
- Magomed samordner endringer i felles skjema, migreringer, API-avtale og konfigurasjon. Funksjonseier implementerer sin modul og skriver tester. Små PR-er reduserer konflikt når flere jobber samtidig.

## Rekkefølge

| Periode | Fokus |
| --- | --- |
| 6.–8. november | Fullføre grunnlaget, avklare omfang og avtale datamodell/API. |
| 9.–16. november | Utvikle funksjoner parallelt. Rekrutter brukertestere tidlig. |
| 17.–18. november | Samlet mobil-/tilgjengelighetskontroll og brukertesting. |
| 19.–20. november | Rette kritiske feil, kjøre akseptansetester, sluttføre rapport og levere. |

P0 er nødvendig for leveransen. P1 er planlagt funksjonalitet. Hvis tiden ikke strekker til, reduserer Product Owner omfanget eksplisitt og dokumenterer hvilke krav som utsettes. P2 tas bare etter kundeavklaring og når minimumsleveransen er stabil. Nøyaktig klokkeslett 20. november er ikke oppgitt.

## Oppgaver

| ID | Pri. | Oppgave | Ansvar (forslag) | Timer | Delmål | Avhengig av |
| --- | --- | --- | --- | ---: | --- | --- |
| S4-01 | P0 | Fullføre grunnleveransen B07–B12 | Magomed | 6 | 8. nov. | — |
| S4-02 | P0 | Avklare minste leveranse med kunden | Hamza | 3 | 7. nov. | — |
| S4-03 | P0 | Avtale datamodell og migreringer | Magomed | 6 | 8. nov. | S4-01, S4-02 |
| S4-04 | P0 | Innføre roller og tilgang per lokallag | Magomed | 6 | 10. nov. | S4-03 |
| S4-05 | P0 | Konto og passordflyt i backend | Abdullahi | 5 | 11. nov. | S4-04 |
| S4-06 | P0 | Registrering og innlogging i frontend | Hamza | 5 | 12. nov. | S4-05 |
| S4-07 | P0 | Kapasitet, kurstype og ledige plasser | Jovan | 4 | 10. nov. | S4-03 |
| S4-08 | P0 | Sikker påmelding i backend | Jovan | 7 | 12. nov. | S4-04, S4-05, S4-07 |
| S4-09 | P0 | Påmelding og bekreftelse i frontend | Hamza | 6 | 14. nov. | S4-06, S4-08 |
| S4-10 | P0 | Avmelding i backend | Jovan | 3 | 13. nov. | S4-08 |
| S4-11 | P0 | Min side med kurs og avmelding | Oskar | 5 | 15. nov. | S4-06, S4-10 |
| S4-12 | P0 | Deltakeroversikt og kursadministrasjon | Jovan | 5 | 15. nov. | S4-04, S4-08, S4-10 |
| S4-13 | P1 | E-post og varsler i testmiljø | Abdullahi | 4 | 14. nov. | S4-05, S4-08 |
| S4-14 | P1 | Kursfilter for dato, sted og type | Abdullahi | 4 | 12. nov. | S4-07 |
| S4-15 | P1 | Synlige kursfiltre i frontend | Oskar | 4 | 14. nov. | S4-14 |
| S4-16 | P1 | Intern booking og ressurskontroll | Abdullahi | 7 | 13. nov. | S4-02, S4-03, S4-04 |
| S4-17 | P1 | Grensesnitt for intern booking | Oskar | 5 | 15. nov. | S4-16 |
| S4-18 | P1 | Bildeopplasting og beskjæring | Abdullahi | 5 | 12. nov. | S4-04 |
| S4-19 | P1 | Bilder på kurs og nyheter | Hamza | 4 | 14. nov. | S4-18 |
| S4-20 | P1 | Redigerbar organisasjonsinformasjon | Abdullahi | 3 | 11. nov. | S4-03, S4-04 |
| S4-21 | P1 | Riktig innhold og felles utforming | Hamza | 4 | 15. nov. | S4-19, S4-20 |
| S4-22 | P1 | Kursarkiv for siste seks måneder | Jovan | 5 | 15. nov. | S4-14 |
| S4-23 | P1 | Deltakerhistorikk og lagringstid | Magomed | 4 | 16. nov. | S4-02, S4-12 |
| S4-24 | P1 | Søkemetadata og manuell deling | Hamza | 5 | 16. nov. | S4-19, S4-22 |
| S4-25 | P0 | Mobil, tastatur og lesbarhet | Oskar | 5 | 17. nov. | S4-09, S4-11, S4-15, S4-17, S4-21 |
| S4-26 | P0 | Rekruttere og forberede brukertest | Hamza | 2 | 9. nov. | S4-02 |
| S4-27 | P0 | Gjennomføre og loggføre brukertester | Oskar | 4 | 18. nov. | S4-25, S4-26 |
| S4-28 | P0 | Rette kritiske funn og teste på nytt | Jovan | 8 | 19. nov. | S4-27 |
| S4-29 | P0 | Demo, varig lagring og gjenoppretting | Magomed | 5 | 16. nov. | S4-01, S4-03 |
| S4-30 | P0 | Samlet akseptanse- og regresjonstest | Abdullahi | 5 | 19. nov. | S4-01, S4-11, S4-12, S4-13, S4-17, S4-22, S4-23, S4-24, S4-28, S4-29 |
| S4-31 | P0 | Oppdatere rapport, diagrammer og AI-logg | Oskar | 5 | 20. nov. | S4-30 |
| S4-32 | P0 | Felles gjennomgang og levering | Oskar | 3 | 20. nov. | S4-30, S4-31 |
| S4-33 | P2 | Finne nærmeste kurs | Abdullahi | 6 | 20. nov. | S4-14, S4-15 |
| S4-34 | P2 | Automatisk Facebook-publisering | Jovan | 6 | 20. nov. | S4-02, S4-24 |
| S4-35 | P2 | Betalingsintegrasjon i testmodus | Magomed | 10 | 20. nov. | S4-02, S4-08, S4-13 |
| S4-36 | P2 | Venteliste og varsling | Jovan | 5 | 20. nov. | S4-08, S4-10, S4-13 |
| S4-37 | P2 | Verifisert medlemsrabatt | Magomed | 4 | 20. nov. | S4-02, S4-35 |

## Ferdigkriterier og avklaringer

### S4-01 – Fullføre grunnleveransen B07–B12

**Ferdig når:** B07 er koblet til HTTP. B08/B09/B10/B11 er testet, gjennomgått og merget i riktig rekkefølge. B12 har kjørbar README, miljøoppsett og AI-logg.

**Avklaring:** B08/B09 har åpne PR-er. B07/B10/B11 er implementert og testet på integrasjonsbranchen. Gjennomgang og merge gjenstår.

**Planlagt reviewer:** Jovan.

### S4-02 – Avklare minste leveranse med kunden

**Ferdig når:** Beslutninger om konto/gjest, Checkin/betaling, avmeldingsfrist, kapasitet, bookingressurser og lagring av deltakerdata er dokumentert. P0/P1 er prioritert mot tilgjengelige timer.

**Avklaring:** Konto er foreløpig utgangspunkt fra klassediagrammet. Betaling, venteliste og rabatt krever særskilt beslutning.

**Planlagt reviewer:** Magomed.

### S4-03 – Avtale datamodell og migreringer

**Ferdig når:** Felt og API-avtaler for roller, lagtilhørighet, kapasitet, kurstype, påmelding og booking er dokumentert. Migreringer virker på tom og eksisterende database uten tap av eksisterende data.

**Avklaring:** Magomed samordner skjemaendringer. Funksjonseier skriver egne migreringer etter avtalen.

**Planlagt reviewer:** Jovan.

### S4-04 – Innføre roller og tilgang per lokallag

**Ferdig når:** Administrator, lokallagsansvarlig og deltaker har avtalte rettigheter. Brukere kan ikke gi seg selv privilegier eller lese/endre et annet lags beskyttede data. API-tester verifiserer dette.

**Avklaring:** Bygg videre på Payload-auth. Kontroller både standard-API og egne endepunkter.

**Planlagt reviewer:** Abdullahi.

### S4-05 – Konto og passordflyt i backend

**Ferdig når:** Registrering, innlogging, utlogging og passordtilbakestilling fungerer med avtalte roller. Ugyldig og duplikat e-post håndteres. Hemmeligheter og passordhash sendes ikke til frontend.

**Avklaring:** Test passordtilbakestilling mot testpostkasse i S4-13. Ikke lag et nytt passordsystem.

**Planlagt reviewer:** Magomed.

### S4-06 – Registrering og innlogging i frontend

**Ferdig når:** Skjemaer bruker faktisk API, viser valideringsfeil og ventetilstand, og bevarer ønsket kurs etter innlogging. Utlogging fjerner innlogget visning.

**Avklaring:** Ingen falsk bekreftelse når backend avviser forespørselen.

**Planlagt reviewer:** Oskar.

### S4-07 – Kapasitet, kurstype og ledige plasser

**Ferdig når:** Kurs har validert kapasitet og kurstype. API viser kapasitet og korrekte ledige plasser. Avmeldte teller ikke. Kapasitet kan ikke senkes under antall aktive påmeldinger uten avtalt håndtering.

**Avklaring:** Gjenbruk eksisterende kursmodul. Pris er allerede lagret i øre.

**Planlagt reviewer:** Magomed.

### S4-08 – Sikker påmelding i backend

**Ferdig når:** Innlogget bruker kan melde seg på. Duplikater, fulle kurs og samtidige forsøk på siste plass testes. Kontroll og lagring er atomisk, og tidligere kurs avvises.

**Avklaring:** Prioriter integrasjonstest av konkurrerende forespørsler. Dette er en av de største tekniske risikoene.

**Planlagt reviewer:** Abdullahi.

### S4-09 – Påmelding og bekreftelse i frontend

**Ferdig når:** Brukeren kan melde seg på fra kursdetaljer og får bekreftelse først etter lagring. Fullt kurs, duplikat og nettverksfeil vises forståelig. Ledige plasser oppdateres.

**Avklaring:** Betaling inngår bare hvis S4-35 velges. Avklar hvordan betalte kurs presenteres i prototypen.

**Planlagt reviewer:** Oskar.

### S4-10 – Avmelding i backend

**Ferdig når:** Brukeren kan avmelde egen påmelding innen avtalt frist. Plassen frigjøres én gang. Andre brukeres påmeldinger kan ikke avmeldes. Gjentatt avmelding gir en konsistent respons.

**Avklaring:** Avmeldingsfrist og eventuell refusjon avklares i S4-02.

**Planlagt reviewer:** Magomed.

### S4-11 – Min side med kurs og avmelding

**Ferdig når:** Min side viser brukerens faktiske påmeldinger og status. Avmelding har bekreftelsesteg og oppdatert resultat. Tom liste, utløpt innlogging og feil håndteres.

**Avklaring:** Backend må filtrere på innlogget bruker. Ikke stol på et bruker-ID-filter fra nettleseren.

**Planlagt reviewer:** Hamza.

### S4-12 – Deltakeroversikt og kursadministrasjon

**Ferdig når:** Ansvarlig kan se deltakere og administrere kurs for eget lag. Oppretting, redigering, kapasitet og sletting/avlysning håndterer eksisterende påmeldinger uten hengende koblinger.

**Avklaring:** Utvid Payload-admin. Bekreft avlysningsrutine og tilganger med kunden.

**Planlagt reviewer:** Magomed.

### S4-13 – E-post og varsler i testmiljø

**Ferdig når:** Passordlenke og avtalt påmeldingsbekreftelse når en testpostkasse. Feil ved sending håndteres uten duplikatpåmelding. Konfigurasjon dokumenteres uten hemmeligheter.

**Avklaring:** Leverandør og avsender må avklares før reell utsending. Bruk testadresser under utvikling.

**Planlagt reviewer:** Magomed.

### S4-14 – Kursfilter for dato, sted og type

**Ferdig når:** API støtter kombinerte filtre for dato, sted og kurstype med korrekt paginering. Ugyldige filtre og datoavgrensninger er testet. API-avtalen er oppdatert.

**Avklaring:** Dagens lokallagsfilter videreføres. Ikke filtrer bare én side i frontend.

**Planlagt reviewer:** Jovan.

### S4-15 – Synlige kursfiltre i frontend

**Ferdig når:** Dato-, sted- og typefiltre kan kombineres og nullstilles. URL bevarer valgene. Filterendring starter på side 1. Tomt resultat og mobilvisning er testet.

**Avklaring:** Bruk tydelige norske etiketter og tilgjengelige skjemaelementer.

**Planlagt reviewer:** Hamza.

### S4-16 – Intern booking og ressurskontroll

**Ferdig når:** Ansatte kan reservere navngitt ressurs for eget lag med fra/til og formål. Ugyldige tidsrom, overlapp og samtidige bookinger avvises. Avbestilling frigjør tidsrommet.

**Avklaring:** Avklar hvilke rom/ressurser som faktisk skal kunne bookes. Dette er intern booking for ansatte.

**Planlagt reviewer:** Jovan.

### S4-17 – Grensesnitt for intern booking

**Ferdig når:** Ansatte kan se, opprette og avbestille egne tillatte reservasjoner. Ressurs og tidsrom er tydelige. Konflikter fra backend vises med en forståelig feilmelding.

**Avklaring:** Start med en enkel liste og skjema. Avansert kalender er ikke nødvendig for første leveranse.

**Planlagt reviewer:** Hamza.

### S4-18 – Bildeopplasting og beskjæring

**Ferdig når:** Ansvarlige kan laste opp og beskjære bilder i admin. Tillatte filtyper/størrelser valideres. Kurs og artikler kan knyttes til bilder med alternativ tekst.

**Avklaring:** Gjenbruk Payload Media. Verifiser lagring og tilgang, ikke bare at opplastingsknappen finnes.

**Planlagt reviewer:** Magomed.

### S4-19 – Bilder på kurs og nyheter

**Ferdig når:** Lister og detaljer viser riktige bilder, tilpasser størrelse på mobil og har alt-tekst. Manglende bilde gir ryddig reservevisning uten ødelagte lenker.

**Avklaring:** Unngå å laste originalbilder i full størrelse i alle kort.

**Planlagt reviewer:** Oskar.

### S4-20 – Redigerbar organisasjonsinformasjon

**Ferdig når:** Ansvarlige kan oppdatere avtalt forside-/organisasjonstekst og kontaktinformasjon uten kode. Riktig lag og tilgang håndheves. Frontend får dokumentert API.

**Avklaring:** Lokallagenes eksisterende kontaktfelt gjenbrukes. Avklar hvilke tilleggstekster som trengs.

**Planlagt reviewer:** Magomed.

### S4-21 – Riktig innhold og felles utforming

**Ferdig når:** Felles sider og lokallagssider viser godkjente tekster, lenker og bilder. Logo, navigasjon, kontaktinformasjon og farger er konsistente. Plassholderinnhold er fjernet fra demoen.

**Avklaring:** Kunden må levere eller godkjenne innhold og bildemateriale.

**Planlagt reviewer:** Oskar.

### S4-22 – Kursarkiv for siste seks måneder

**Ferdig når:** Brukeren kan åpne et paginert arkiv over tidligere kurs fra siste seks måneder. Datogrenser og tomt arkiv testes. Arkivkort kan åpnes uten å tilby ny påmelding.

**Avklaring:** Dette gjelder offentlig kursinformasjon. Lagring av deltakerdata avgjøres separat i S4-23.

**Planlagt reviewer:** Oskar.

### S4-23 – Deltakerhistorikk og lagringstid

**Ferdig når:** Tilgang til deltakerhistorikk er begrenset til riktige ansvarlige. Avtalt lagringstid og rutine for sletting/anonymisering er dokumentert og testet på testdata.

**Avklaring:** Ikke anta at seks måneders offentlig kursarkiv betyr seks måneders lagring av personopplysninger.

**Planlagt reviewer:** Abdullahi.

### S4-24 – Søkemetadata og manuell deling

**Ferdig når:** Offentlige sider har norske, relevante titler og beskrivelser. Kurs/nyheter kan deles med korrekt URL. Delingsmetadata er tilgjengelige for en klient uten JavaScript. Private sider eksponeres ikke.

**Avklaring:** Avklar en enkel løsning for metadata i React/Vite. Manuell deling er første leveranse.

**Planlagt reviewer:** Oskar.

### S4-25 – Mobil, tastatur og lesbarhet

**Ferdig når:** Viktige flyter virker på mobil og med tastatur. Fokus, etiketter, kontrast og feilmeldinger er kontrollert. Ingen horisontal overflow på de avtalte skjermbreddene.

**Avklaring:** Målgruppen omfatter eldre og brukere med lite digital erfaring. Test de nye flytene samlet.

**Planlagt reviewer:** Hamza.

### S4-26 – Rekruttere og forberede brukertest

**Ferdig når:** Tid med 3–5 representative brukere og én administrativ bruker er forsøkt avtalt. Oppgaver, observasjonsskjema og testdata er klare. Eventuelle rekrutteringsbegrensninger dokumenteres.

**Avklaring:** Start tidlig. Testoppgaver: finn kurs, meld på/av, finn kontaktinformasjon og administrer eget lag.

**Planlagt reviewer:** Oskar.

### S4-27 – Gjennomføre og loggføre brukertester

**Ferdig når:** Gjennomførte oppgaver, faktiske observasjoner og hindringer er loggført uten unødvendige personopplysninger. Funn prioriteres og blir konkrete feilrettingsoppgaver.

**Avklaring:** Rapporter faktisk antall deltakere. Ikke skriv at planlagte tester er gjennomført.

**Planlagt reviewer:** Hamza.

### S4-28 – Rette kritiske funn og teste på nytt

**Ferdig når:** Kritiske feil i innlogging, påmelding, datavisning og tilgang er lukket med dokumentert retest. Åpne mindre feil er beskrevet i rapporten.

**Avklaring:** Dette er en foreløpig tidsreserve. Fordel konkrete feil på riktig funksjonseier når de er kjent.

**Planlagt reviewer:** Oskar.

### S4-29 – Demo, varig lagring og gjenoppretting

**Ferdig når:** Avtalt demomiljø kan startes fra README. Database og media bevares ved omstart. Migrering, sikkerhetskopi og gjenoppretting er prøvd med testdata.

**Avklaring:** Hosting, domene og eventuelle kostnader avklares før bestilling. Lokal demo er reserveplan.

**Planlagt reviewer:** Jovan.

### S4-30 – Samlet akseptanse- og regresjonstest

**Ferdig når:** Prioriterte krav er koblet til test, faktisk resultat og eventuelt avvik. Automatiske tester og sentrale bruker-/adminflyter passerer i demomiljøet. Testdata holdes adskilt fra reelle data.

**Avklaring:** Frys nye funksjoner før denne kontrollen. Kritiske feil går tilbake til S4-28.

**Planlagt reviewer:** Magomed.

### S4-31 – Oppdatere rapport, diagrammer og AI-logg

**Ferdig når:** Levende dokumentasjon beskriver faktisk implementasjon, testresultater, kravoppnåelse, begrensninger og AI-bruk. README og diagrammer stemmer med koden. PDF er kontrollert etter eksport.

**Avklaring:** Start løpende. Sluttfør etter testresultatene. Alle funksjonseiere leverer sine bidrag.

**Planlagt reviewer:** Hamza.

### S4-32 – Felles gjennomgang og levering

**Ferdig når:** Gruppen kan forklare egne og sentrale felles komponenter. Demoen er prøvd, riktig kodeversjon og PDF er valgt, og levering er bekreftet innen 20. november.

**Avklaring:** Klokkeslett for fristen er ikke oppgitt. Avtal intern frist i god tid før eventuell innleveringsfrist.

**Planlagt reviewer:** Hamza.

### S4-33 – Finne nærmeste kurs

**Ferdig når:** Ved valgt omfang kan brukeren velge sted og sortere etter avstand fra verifiserte koordinater. Manglende koordinater og avvist posisjon håndteres.

**Avklaring:** Ikke del av lovet minimum. Krever avklart datakilde og eventuell karttjeneste.

**Planlagt reviewer:** Oskar.

### S4-34 – Automatisk Facebook-publisering

**Ferdig når:** Hvis valgt og tilganger finnes, publiseres avtalt innhold én gang til en test-/godkjent side. Feil og duplikater håndteres. Hemmeligheter ligger ikke i repoet.

**Avklaring:** Krever side-/API-tilgang og kundeavklaring. Manuell deling i S4-24 fungerer som første løsning.

**Planlagt reviewer:** Magomed.

### S4-35 – Betalingsintegrasjon i testmodus

**Ferdig når:** Hvis Checkin skal erstattes, er en avklart testbetaling koblet til riktig påmelding. Webhook, duplikatmelding, avbrudd og refusjonsrutine er testet uten reelle belastninger.

**Avklaring:** Krever valgt leverandør og oppdatert estimat. Produksjonsbetaling er ikke lovet innen fristen.

**Planlagt reviewer:** Jovan.

### S4-36 – Venteliste og varsling

**Ferdig når:** Hvis valgt, er rekkefølge, frigitt plass, bekreftelsesfrist og varsling definert og testet uten dobbeltbooking.

**Avklaring:** Kundeavklaring først. SMS-leverandør og kostnader er ikke avklart.

**Planlagt reviewer:** Abdullahi.

### S4-37 – Verifisert medlemsrabatt

**Ferdig når:** Hvis valgt, beregner backend rabatt fra en avtalt, verifisert medlemsstatus. Pris manipuleres ikke fra klienten, og beløp testes i øre.

**Avklaring:** En brukerkonto er ikke bevis på medlemskap. Avhenger av medlemskilde og betalingsvalg.

**Planlagt reviewer:** Hamza.

## Grunnlag og AI-bruk

Planen bygger på kravene og backendmodelleringen i Software engineering 14-9.pdf, eksisterende Kanban for B01–B12, kode og API-avtale, samt Magomeds beskjed om samlet sprint og frist. Den skiller seks måneders offentlig kursarkiv fra den særskilt avklarte lagringstiden for deltakeropplysninger.

- [Eksisterende Kanban](https://docs.google.com/spreadsheets/d/1wb5zZ92pesadyIr7MBeHcgFBE3tIF7P7WtI3FXeXjc4/edit)
- [API-avtale](api-avtale.md)
- [B08](nyheter-b08.md) og [B09](kurs-b09.md)
- [PR for B08](https://github.com/hamza2999/Software-engineering-og-testing-gruppe-14/pull/10) og [PR for B09](https://github.com/hamza2999/Software-engineering-og-testing-gruppe-14/pull/11)

AI er brukt til å strukturere dette planutkastet og foreslå oppgaver, ansvar, estimater og ferdigkriterier. Gruppen må vurdere forslagene opp mot egen kapasitet og kundeavklaringer. Ingen foreslåtte estimater er registrert som faktisk brukt tid.
