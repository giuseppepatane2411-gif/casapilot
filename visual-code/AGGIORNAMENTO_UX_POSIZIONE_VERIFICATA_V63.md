# CasaPilot UX Guidata v6.3 — Posizione verificata

Questa versione sostituisce la ricerca unica della v6.2 con un percorso guidato e più resistente agli errori.

## Nuovo flusso indirizzo

1. L’utente cerca e seleziona prima il Comune.
2. La ricerca di via e civico viene eseguita nel Comune selezionato.
3. Provincia e CAP restano sempre correggibili.
4. Se un servizio esterno non risponde, l’utente può usare il testo scritto e continuare manualmente.
5. Il CAP continua a compilare Comune e Provincia quando il servizio restituisce un risultato.

## Nuova mappa

- Il segnaposto rimane fermo al centro.
- L’utente trascina la mappa sotto il segnaposto, anche da smartphone.
- Un tocco sulla mappa sposta il punto.
- È possibile partire dall’indirizzo oppure dalla posizione del dispositivo.
- Il punto deve essere confermato esplicitamente.
- Dopo la conferma CasaPilot salva lo stato “Posizione confermata” e prova a riconoscere l’indirizzo vicino alle coordinate.
- Qualsiasi modifica successiva a indirizzo o mappa annulla la conferma e richiede una nuova verifica.

## Dati salvati

Per ogni immobile vengono conservati localmente:

- latitudine;
- longitudine;
- posizione confermata sì/no;
- data della conferma;
- descrizione del punto riconosciuto.

Le pratiche create con versioni precedenti vengono normalizzate automaticamente e continuano a funzionare.

## Preparazione annunci futuri

La posizione esatta resta nella pratica. La futura funzione annunci potrà chiedere all’utente se pubblicare il punto preciso oppure soltanto una zona approssimativa, senza dover ricostruire le coordinate.

## Prove consigliate

1. Cerca `Cata` nel campo Comune e seleziona Catania.
2. Cerca `Via Etnea 100` nel campo via.
3. Prova il CAP `95100`.
4. Sposta la mappa con mouse e dito.
5. Premi “Conferma questo punto”.
6. Modifica di nuovo l’indirizzo e controlla che la posizione torni “Da confermare”.
7. Modifica una casa già esistente e ripeti la verifica.
