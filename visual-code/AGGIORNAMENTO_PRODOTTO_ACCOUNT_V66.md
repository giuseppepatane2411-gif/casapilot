# CasaPilot v6.6 · prodotto e identità digitale

La v6.6 sostituisce il semplice modulo account della versione precedente con un percorso completo e coerente con un prodotto operativo.

## Identità di prodotto

- `Crea il tuo immobile` e `I miei immobili` diventano le diciture generali.
- Eliminati dall’interfaccia i riferimenti alla fase di prova.
- Le schermate pubbliche non mostrano nomi tecnici dei servizi usati internamente.
- Lo stato locale del prodotto è stato separato dalle vecchie funzioni di test, mantenendo la migrazione dei dati già presenti.
- Backup aggiornato alla versione 4, compatibile anche con i backup precedenti.

## Registrazione

Il modulo è ora progressivo e diverso per tipo di account.

### Privato

1. dati personali;
2. sicurezza, condizioni e privacy;
3. conferma email.

### Professionista

1. dati personali;
2. attività, professione e territorio;
3. sicurezza, condizioni e privacy;
4. conferma email;
5. completamento del profilo;
6. invio esplicito per la verifica.

## Account personale

L’utente può modificare:

- nome e cognome;
- telefono;
- Comune e Provincia;
- consenso facoltativo alle comunicazioni.

La pagina distingue email verificata, sicurezza dell’account e profilo professionale.

## Profilo professionale

Un account privato può aggiungere l’attività professionale senza creare un secondo account.

Il professionista può gestire:

- professione;
- studio o attività;
- partita IVA;
- albo o abilitazione;
- esperienza;
- contatti;
- sito web;
- presentazione;
- zone servite;
- visibilità pubblica dopo la verifica.

## Verifica

Stati disponibili:

```text
draft
submitted
under_review
changes_requested
verified
suspended
```

L’utente non può attribuirsi uno stato verificato. L’invio crea una fotografia dei dati e una richiesta separata. La vista pubblica espone soltanto profili verificati che hanno attivato la visibilità.

## Sicurezza

- Supabase SSR con sessione su cookie.
- `getClaims()` nel Proxy per la verifica della sessione.
- Row Level Security su profili e richieste.
- privilegi di aggiornamento limitati a specifiche colonne;
- funzioni protette per attivazione professionale e richiesta di verifica;
- nessuna chiave amministrativa nel frontend.

## Compatibilità

- Le pratiche create con le versioni precedenti restano disponibili.
- I dati tecnici locali precedenti vengono migrati al nuovo stato prodotto.
- I vecchi backup con `betaState` possono ancora essere importati.
- Lo schema SQL può essere eseguito sopra quello della v6.5.
