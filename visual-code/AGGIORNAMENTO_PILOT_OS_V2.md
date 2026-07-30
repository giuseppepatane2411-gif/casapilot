# CasaPilot — Pilot OS v2

Questa versione sostituisce la prima demo statica di Pilot OS con un vero command center interattivo collegato ai dati dell’immobile.

## Novità principali

- Mission Engine con coda ordinata di attività.
- Completamento diretto dei documenti dalla missione principale.
- Aggiornamento immediato di Health Score, prontezza e prossima missione.
- Pilot Chat contestuale funzionante anche senza API esterne.
- Domande rapide su documenti, rischi, score, annuncio e prossimi passi.
- Memoria persistente separata per ciascun immobile.
- Timeline reale delle azioni svolte e delle conversazioni con Pilot.
- Pilot Readiness diviso in dati, documenti e operatività.
- Rilevamento delle principali attenzioni della pratica.
- Modifica rapida dei dati essenziali direttamente da Pilot OS.
- Advisor con suggerimenti dinamici, azioni e possibilità di nasconderli.
- Selettore dell’immobile analizzato nel Command Center.
- Preparazione tecnica per la futura integrazione OpenAI tramite prompt builder e payload contestuale.

## Pagina principale

Aprire:

```text
http://localhost:3000/dashboard/pilot
```

## Prova consigliata

1. Creare oppure selezionare un immobile.
2. Aprire Pilot OS.
3. Premere “Segna come disponibile” nella missione principale.
4. Verificare il cambio immediato della missione, dello score e della timeline.
5. Chiedere a Pilot: “Quali documenti mancano?”.
6. Aggiornare superficie o indirizzo nel pannello “Dati essenziali”.
7. Verificare che Pilot ricalcoli analisi e priorità.

## Dati

La demo continua a salvare tutto localmente nel browser. Non utilizza ancora OpenAI e non invia dati a servizi esterni.

## Verifiche eseguite

- TypeScript: superato.
- ESLint: superato.
- Archivio ZIP: verificato.
