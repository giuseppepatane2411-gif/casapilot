# CasaPilot Beta Zero-Cost v2 — Test Flight

Questa versione non aggiunge soltanto una pagina di feedback. Trasforma CasaPilot in un prodotto locale che può essere provato, misurato e migliorato senza OpenAI, database o servizi a pagamento.

## Novità principali

### Test Flight con tre scenari

- Vendita di un appartamento
- Affitto di un immobile
- Casa ereditata e situazione iniziale confusa

Ogni scenario crea una pratica completa, una memoria di Pilot, una timeline e una missione coerente con il problema scelto.

### Archivio documentale locale

Nuova sezione:

`/dashboard/vault`

Permette di:

- allegare PDF, JPG, PNG e WEBP;
- collegare ogni file a una pratica e a un documento della checklist;
- aprire, scaricare o eliminare il file;
- aggiornare automaticamente Health Score, missioni e timeline;
- conservare i file soltanto nel browser tramite IndexedDB.

Limite della beta: 15 MB per file. I file non sono inclusi nel backup JSON.

### Metriche di validazione

CasaPilot registra localmente:

- sessioni di test avviate;
- tempo necessario per raggiungere Pilot OS;
- missioni completate;
- utilizzo dell’Archivio locale;
- feedback raccolti;
- chiarezza media e disponibilità a pagare.

Dalla pagina Feedback beta è possibile esportare:

- feedback in CSV;
- report completo del Test Flight in JSON.

### Privacy verificabile

- nessun account;
- nessun database remoto;
- nessuna API OpenAI;
- nessun analytics esterno;
- dati strutturati in localStorage;
- file in IndexedDB;
- cancellazione completa dalle Impostazioni.

## Controlli eseguiti

- ESLint: superato
- TypeScript `tsc --noEmit`: superato
- Archivio ZIP: verificato

Il build Next.js completo non può essere eseguito nell’ambiente Linux di preparazione perché il pacchetto SWC Linux non è disponibile nel registry del sandbox. Il progetto usa normalmente il pacchetto Windows quando viene avviato sul computer dell’utente.
