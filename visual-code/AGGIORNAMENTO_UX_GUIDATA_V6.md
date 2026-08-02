# CasaPilot — UX Guidata v6

Questo aggiornamento parte dalla UX Guidata v5 e aggiunge tre miglioramenti pensati per ridurre gli errori e rendere la gestione dell'immobile più naturale.

## 1. Modifica o elimina una casa

Nella pagina **La mia casa → dettaglio immobile** è disponibile la sezione **Gestisci la casa**.

- **Modifica dati** permette di correggere nome, superficie, situazione, indirizzo e dati catastali senza dover ricreare la pratica.
- **Elimina questa casa** apre una conferma esplicita prima della cancellazione.
- La cancellazione rimuove la pratica dal browser e prova a rimuovere anche memoria di Pilot e file collegati nell'Archivio locale.
- Se la casa eliminata era quella attiva, CasaPilot seleziona automaticamente un'altra casa disponibile; se non ne restano, torna allo stato iniziale.

## 2. Dati catastali

Nel passaggio **Posizione** del wizard sono stati aggiunti:

- Foglio
- Particella / mappale
- Subalterno

Sono campi importanti ma non bloccanti: l'utente può completarli anche in seguito. I dati vengono salvati nella pratica, mostrati nel riepilogo quando presenti e sono modificabili dalla pagina della casa.

## 3. Ricerca automatica dell'indirizzo

Nel passaggio **Posizione** compare ora il campo **Cerca comune, via o indirizzo**.

Mentre l'utente scrive, CasaPilot mostra suggerimenti e, selezionandone uno, prova a compilare automaticamente:

- Paese
- Comune / città
- Provincia
- CAP
- Via e numero civico

I campi rimangono sempre modificabili manualmente.

La ricerca usa il servizio Photon di Komoot, basato su dati OpenStreetMap, e non richiede una chiave API. È pensata per la beta e per traffico contenuto. La pagina Privacy è stata aggiornata per chiarire che il testo digitato nel campo di ricerca viene inviato al servizio esterno solo quando si usa questa funzione facoltativa.

## Compatibilità

Le pratiche e le bozze create con versioni precedenti restano leggibili. I nuovi campi catastali vengono inizializzati vuoti quando non esistono nei dati precedenti.

## Verifiche eseguite

- ESLint: OK
- TypeScript (`tsc --noEmit`): OK
- Build Next.js: non completabile nel sandbox Linux perché il pacchetto SWC Linux di Next.js non è disponibile nel registry interno; lo stesso limite ambientale già incontrato nelle versioni precedenti.
