# DATABASE CASAPILOT

## Utente

Ogni utente può avere una o più pratiche immobiliari.

---

## Pratica Immobiliare

La pratica rappresenta un obiettivo.

Esempi:

- Vendere un appartamento
- Affittare una villa
- Acquistare una casa
- Gestire documentazione
- Cercare un professionista

Ogni pratica contiene:

- stato
- obiettivo
- data creazione
- proprietario
- immobile
- documenti
- score
- attività
- conversazioni con Pilot

---

## Immobile

Ogni pratica ha un immobile.

Dati principali:

- tipologia
- indirizzo
- comune
- provincia
- CAP
- superficie
- piano
- anno costruzione
- classe energetica
- note

---

## Documenti

Ogni documento ha:

- nome
- categoria
- stato
- data caricamento
- scadenza
- file

---

## Professionisti

La pratica può avere:

- agente immobiliare
- geometra
- notaio
- architetto
- avvocato
- commercialista
- impresa

---

## CasaPilot Score

Ogni pratica possiede un punteggio.

Lo score viene calcolato in base a:

- documentazione
- dati immobile
- verifiche completate
- stato della pratica

---

## Conversazioni Pilot

Pilot ricorda:

- domande
- risposte
- attività svolte
- suggerimenti
- obiettivi

Ogni conversazione è collegata ad una pratica.