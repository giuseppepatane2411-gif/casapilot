# CasaPilot v6.5 · Identità di prodotto e account

## Obiettivo

Questa versione presenta CasaPilot come un prodotto operativo, non come una beta, e prepara la registrazione reale di privati e professionisti.

## Linguaggio più corretto

- `Crea la mia casa` diventa `Crea il tuo immobile`.
- Le aree principali parlano di immobili, così CasaPilot comprende abitazioni, terreni, locali commerciali, uffici, box e altri beni immobili.
- La voce principale della dashboard è `I miei immobili`.

## Impronta di prodotto finito

- Rimossi dalla home, dalla dashboard e dalle pagine pubbliche i richiami visibili alla versione beta.
- Eliminati badge e inviti che presentavano CasaPilot come ambiente di prova.
- I vecchi indirizzi interni dedicati alla beta reindirizzano alle sezioni attuali, per non rompere eventuali collegamenti salvati.
- Privacy, impostazioni e backup usano ora il linguaggio del prodotto CasaPilot.

## Registrazione degli utenti

Sono state aggiunte le schermate e la logica per:

- registrazione di un privato;
- registrazione di un professionista;
- conferma dell'indirizzo email;
- accesso e disconnessione;
- recupero e aggiornamento della password;
- pagina account personale;
- protezione della dashboard per gli utenti non autenticati, una volta collegato Supabase.

## Professionisti

La registrazione professionale raccoglie già:

- professione;
- denominazione o ragione sociale;
- partita IVA;
- eventuale albo o numero di iscrizione;
- città e provincia di attività.

La registrazione non equivale alla verifica. Lo stato di professionista verificato è separato e non può essere assegnato autonomamente dall'utente.

## Infrastruttura predisposta

La v6.5 usa l'architettura prevista per CasaPilot:

- Supabase Auth per gli account;
- PostgreSQL/Supabase per i profili;
- Row Level Security per limitare ogni profilo al proprio proprietario;
- Next.js Proxy per la sessione e la protezione della dashboard.

Lo schema SQL è in:

```text
visual-code/app/supabase/schema.sql
```

La guida di attivazione è in:

```text
visual-code/app/SUPABASE_ACCOUNT_SETUP.md
```

## Stato dei dati della pratica

In questa versione gli account sono predisposti per diventare reali dopo la configurazione di Supabase. Immobili, documenti e memoria di Pilot restano ancora sul dispositivo, così l'aggiornamento non espone né perde i dati locali esistenti.

Il passaggio tecnico successivo sarà associare e sincronizzare le pratiche con l'utente autenticato, includendo una migrazione controllata dei dati già presenti nel browser.
