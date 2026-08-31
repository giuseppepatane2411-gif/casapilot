# Guimmia V77.6 REV2 — Home, lead di valutazione e stanze

## Home

- Il riquadro iniziale conserva ricerca e immobile in evidenza.
- La sezione bianca con la vetrina completa non viene mostrata nella home.
- La ricerca apre `/immobili` con mercato e filtri selezionati.
- Le azioni proprietario cambiano tra vendita, affitto e vacanze e aprono la valutazione corretta.
- Le tre righe “Agenzia immobiliare”, “Percorso organizzato” e “Digitale quando serve” sono rimosse.

## Valutazioni

Operazioni controllate:

- `SALE`: fascia complessiva di vendita;
- `RENT_LONG_TERM`: canone mensile e proiezione annua;
- `RENT_SHORT_TERM`: tariffa per notte e ricavo annuo lordo indicativo;
- `RENT_ROOM`: canone mensile della stanza e proiezione annua.

La bozza viene conservata per 24 ore sul dispositivo. Prima della chiamata OpenAI il cliente deve accedere o registrarsi; il server verifica la sessione Supabase e non accetta identità dichiarate dal browser. La richiesta viene collegata a `auth.users` e salvata con stato `VALUATION_REQUESTED` prima di spendere la chiamata OpenAI. Se la registrazione della lead fallisce, il calcolo non parte. Il risultato viene mostrato soltanto dopo essere stato salvato e viene inviato all’email verificata dell’account.

La fascia non viene trattata come prezzo definitivo: l’interfaccia e l’email invitano ad aprire la pratica e richiedere il controllo umano prima della pubblicazione.

L’invio usa Resend con variabili server-only:

```text
RESEND_API_KEY
GUIMMIA_EMAIL_FROM=Guimmia <valutazioni@dominio-verificato.it>
```

Se il mittente non è configurato, la valutazione resta visibile e salvata e lo stato email diventa `NOT_CONFIGURED`.

## Affitto stanza

I dati pubblici strutturati comprendono tipo e superficie della stanza, bagno privato, numero e composizione attuale dei coinquilini, profilo studente/lavoratore, disponibilità e spese incluse. Le schede della vetrina aprono una pagina dettaglio reale, con informazioni della stanza e CTA che porta alla chat già contestualizzata sull’annuncio.

La preferenza di genere dichiarata e le note di compatibilità sono archiviate separatamente in `agency_room_compatibility_private`. Questa tabella ha RLS forzata, non è leggibile dagli utenti anonimi e blocca per contratto sia la pubblicazione sia il filtraggio automatico. La scelta del candidato richiede sempre controllo umano.

## Migrazioni

```text
20260829_v77_6_0_HOME_VALUATIONS_ROOMS.sql
20260829_v77_6_1_VERIFY_HOME_VALUATIONS_ROOMS.sql
```

La verifica V77.6 REV2 restituisce 13 controlli.
