# CasaPilot UX Guidata v6.2 — Ricerca affidabile e posizione esatta

Questa versione parte dalla v6.1 e corregge in modo strutturale la ricerca di Comune e via.

## Ricerca Comune e via

- ArcGIS Autosuggest viene usato per i suggerimenti mentre l’utente scrive.
- Quando l’utente sceglie un risultato, CasaPilot lo risolve in un indirizzo completo con coordinate.
- Open-Meteo aggiunge un secondo canale dedicato a Comuni e località italiane.
- Photon rimane come ulteriore fallback.
- Il CAP completo continua a usare la ricerca postale già funzionante.
- Le chiamate passano sempre dalle API interne di CasaPilot, non direttamente dal browser.

## Mappa dell’immobile

Nel passaggio Posizione del wizard è stata aggiunta una mappa interattiva:

- mostra il punto trovato dalla ricerca;
- salva latitudine e longitudine nella pratica;
- permette di trascinare il segnaposto;
- permette di toccare/cliccare direttamente un altro punto;
- supporta zoom e correzione con le frecce della tastiera;
- permette di ricalcolare il punto partendo dall’indirizzo scritto;
- mantiene separati indirizzo testuale e posizione esatta.

La stessa mappa è disponibile quando si modificano i dati della casa. Nella pagina di dettaglio viene mostrata in sola lettura.

## Compatibilità con le pratiche esistenti

Le vecchie pratiche vengono normalizzate automaticamente. Se non possiedono coordinate, continuano a funzionare e l’utente può aggiungere la posizione successivamente.

## Perché serve in futuro

Le coordinate salvate preparano CasaPilot a funzioni future come:

- generazione di annunci immobiliari;
- inserimento della posizione sulle piattaforme di annunci;
- ricerca di servizi e professionisti vicini;
- analisi della zona;
- gestione precisa di immobili con indirizzi ambigui o numeri civici non riconosciuti.

## Verifiche eseguite

- ESLint: superato
- TypeScript: superato
- ZIP: da verificare dopo il confezionamento

Il build Next.js completo non può essere eseguito nel sandbox perché il pacchetto SWC Linux viene richiesto a un registry interno che restituisce 404. Non sono emersi errori TypeScript o ESLint.
