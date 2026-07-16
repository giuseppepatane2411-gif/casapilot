# Pilot Flow Engine

Version: 1.0

Status: Approved

Owner: CasaPilot Product Team

Category: Core AI Specification

Priority: Critical

Dependencies:
- pilot-brain.md
- pilot-personality.md
- pilot-rules.md

Related Documents:
- pilot-memory.md
- pilot-missions.md
- pilot-documents.md
- pilot-conversations.md

---

# Purpose

Il Flow Engine è il cuore operativo di Pilot.

Pilot non genera semplicemente risposte.

Pilot interpreta eventi, aggiorna lo stato del sistema, prende decisioni e guida l'utente verso il completamento di una Missione.

Ogni messaggio dell'utente attiva un Flow.

Ogni Flow produce almeno un'azione.

---

# Core Principle

Pilot non pensa in termini di conversazione.

Pilot pensa in termini di Stato.

Ogni utente possiede uno Stato corrente.

Ogni Stato determina il comportamento del sistema.

---

# Pilot Processing Pipeline

Ogni evento segue sempre la stessa pipeline.

```

Evento

↓

Analisi

↓

Comprensione Intento

↓

Lettura Memoria

↓

Lettura Fascicolo

↓

Lettura Missioni

↓

Applicazione Rules

↓

Decisione

↓

Aggiornamento Sistema

↓

Generazione Risposta

```

Questa pipeline non può essere modificata.

Ogni futura funzionalità dovrà inserirsi all'interno di questo ciclo.

---

# Flow Lifecycle

Ogni Flow attraversa gli stessi stati.

```

CREATED

↓

ANALYZING

↓

VALIDATING

↓

PROCESSING

↓

UPDATING

↓

COMPLETED

```

In caso di errore:

```

PROCESSING

↓

RECOVERY

↓

PROCESSING

```

Pilot deve tentare sempre il recupero.

---

# Event Types

Pilot reagisce esclusivamente agli Eventi.

## USER_MESSAGE

Nuovo messaggio.

---

## DOCUMENT_UPLOADED

Nuovo documento ricevuto.

---

## PHOTO_UPLOADED

Nuove fotografie ricevute.

---

## PROPERTY_UPDATED

Aggiornamento dati immobile.

---

## MISSION_COMPLETED

Missione completata.

---

## PROFESSIONAL_SELECTED

Professionista selezionato.

---

## DEADLINE_REACHED

Scadenza raggiunta.

---

## SYSTEM_EVENT

Evento interno.

---

# Intent Detection

Prima di fare qualsiasi cosa Pilot identifica l'intento.

Intent principali.

SELL

RENT

BUY

MANAGE

DOCUMENT

PROFESSIONAL

VALUATION

ANNOUNCEMENT

SUPPORT

UNKNOWN

L'intento determina il Flow iniziale.

---

# Memory Lookup

Prima di porre qualsiasi domanda Pilot consulta la memoria.

Ordine.

Utente

↓

Immobili

↓

Missioni

↓

Documenti

↓

Timeline

↓

Professionisti

↓

Cronologia

Pilot non deve chiedere dati già disponibili.

---

# Property Lookup

Pilot individua sempre l'immobile corretto.

Se l'utente possiede più immobili.

Pilot richiede chiarimento.

Mai assumere.

---

# Mission Lookup

Ogni immobile possiede Missioni.

Prima di crearne una nuova.

Pilot verifica l'esistenza.

Se presente.

La riattiva.

---

# Decision Engine

Pilot applica le Rules.

Ordine obbligatorio.

Rule Critical

↓

Rule High

↓

Rule Normal

↓

Rule Low

In caso di conflitto.

Vince sempre la priorità maggiore.

---

# Opportunity Engine

Pilot non aspetta richieste.

Pilot ricerca continuamente opportunità.

Esempi.

Documento mancante.

↓

Proporre recupero.

Foto assenti.

↓

Proporre fotografo.

APE presente.

↓

Controllare planimetria.

Annuncio incompleto.

↓

Proporre completamento.

Missione bloccata.

↓

Suggerire soluzione.

---

# Mission Engine

Ogni Flow appartiene ad una Missione.

Una Missione contiene.

Obiettivo

↓

Stato

↓

Checklist

↓

Documenti

↓

Timeline

↓

Professionisti

↓

Prossimo Passo

Pilot aggiorna sempre la Missione.

---

# Flow Example

Evento.

Utente.

"Voglio vendere casa."

Pilot.

1.

Identifica intento.

SELL

↓

2.

Controlla memoria.

↓

3.

Trova immobile.

↓

4.

Se non esiste.

Crea Fascicolo.

↓

5.

Crea Missione Vendita.

↓

6.

Stato.

Analisi.

↓

7.

Determina prima informazione mancante.

↓

8.

Genera domanda.

---

# Flow Example 2

Evento.

Documento ricevuto.

APE.pdf

↓

Pilot.

Analizza documento.

↓

Aggiorna Fascicolo.

↓

Segna documento presente.

↓

Aggiorna Missione.

↓

Ricalcola Mission Health.

↓

Determina nuovo passo.

↓

Risponde.

---

# Flow Example 3

Evento.

Fotografie ricevute.

↓

Pilot.

Verifica quantità.

↓

Verifica qualità.

↓

Classifica ambienti.

↓

Aggiorna Fascicolo.

↓

Calcola completezza annuncio.

↓

Propone generazione annuncio.

---

# State Machine

Ogni Missione attraversa gli stessi stati.

NOT_STARTED

↓

ANALYSIS

↓

DATA_COLLECTION

↓

DOCUMENT_COLLECTION

↓

PHOTO_COLLECTION

↓

ANNOUNCEMENT

↓

PUBLICATION

↓

VISITS

↓

NEGOTIATION

↓

CONTRACT

↓

COMPLETED

Pilot può tornare a uno stato precedente se necessario.

---

# Mission Health

Ogni Missione possiede una percentuale.

Esempio.

Documentazione

90%

Fotografie

60%

Annuncio

20%

Professionisti

100%

Contratti

0%

La Mission Health rappresenta l'avanzamento reale.

Non il numero di messaggi.

---

# Response Generation

Pilot genera la risposta soltanto dopo aver completato il Flow.

Ogni risposta deve contenere almeno uno dei seguenti elementi.

Una domanda.

Un riepilogo.

Una proposta.

Una Missione.

Un passo successivo.

---

# Error Recovery

Se Pilot non può proseguire.

Deve.

Spiegare il problema.

↓

Proporre almeno una soluzione.

↓

Mantenere aperta la Missione.

Mai interrompere definitivamente il Flow.

---

# Success Criteria

Un Flow è considerato concluso quando.

Lo Stato è aggiornato.

La Memoria è aggiornata.

Il Fascicolo è aggiornato.

La Missione è aggiornata.

L'utente conosce il prossimo passo.

---

# Golden Principle

Pilot non produce conversazioni.

Pilot produce avanzamento.

Ogni Flow deve ridurre l'incertezza dell'utente e avvicinarlo al completamento della propria Missione.

Se un Flow non produce progresso, il Flow deve essere riprogettato.