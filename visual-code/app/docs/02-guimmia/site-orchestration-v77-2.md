# Guimmia V77.2 — Orchestrazione del sito

## Obiettivo

Guimmia è la nostra agenzia immobiliare online con intelligenza artificiale. Il sito deve trasformare le conoscenze del cervello in percorsi semplici per clienti, agenti e professionisti, senza attribuire all’IA autorità che non possiede.

La V77.2 crea il primo collegamento applicativo completo tra il sito e il Central Case Orchestrator V77.0. La revisione 2 trasforma questo collegamento in un percorso continuo: dalla conversazione iniziale alla pratica, dai documenti specifici alla prossima azione, fino all'eventuale passaggio a un agente o professionista.

## Principi non negoziabili

- Il cliente vede domande, fasi e azioni comprensibili, non codici interni.
- Il cervello propone e ordina; non firma, approva, pubblica o decide autonomamente azioni materiali.
- Agenti e professionisti mantengono la propria autorità.
- Il collegamento iniziale usa esclusivamente `DRY_RUN`.
- Un errore del cervello non blocca la normale consultazione della dashboard.
- I dati inviati al gateway sono limitati e ripuliti lato server.

## Percorsi riconosciuti

| Percorso del sito | Percorso del cervello |
| --- | --- |
| Vendita | `SALE` |
| Affitto a lungo termine | `RENT_LONG_TERM` |
| Affitto transitorio | `RENT_TRANSITORY` |
| Affitto a studenti | `RENT_STUDENT` |
| Affitto turistico breve | `RENT_TOURIST_SHORT` |

Il precedente valore generico `rent` resta leggibile per compatibilità, ma il cliente viene invitato a specificare il tipo esatto prima di proseguire.

## Architettura V77.2

1. Le pagine client inviano una fotografia minima della pratica a `/api/guimmia/orchestrate`.
2. Il Route Handler valida autenticazione, valori e dimensioni dell’input.
3. L’adattatore server-only costruisce il contesto del caso.
4. Il Central Case Orchestrator calcola la decisione in `DRY_RUN`.
5. Una proiezione pubblica elimina codici motivazionali, riferimenti interni e capacità di esecuzione.
6. La dashboard mostra fase, domanda o azione suggerita e l’eventuale necessità di controllo umano.
7. L'ultima indicazione pubblica sicura viene conservata localmente e può essere mostrata anche durante un errore temporaneo di collegamento.

## Superfici aggiornate

- Creazione pratica: scelta fra i cinque percorsi realmente supportati.
- Conversazione iniziale: riconoscimento del percorso, raccolta dei dati essenziali e creazione della vera pratica proprietario usata dalla dashboard.
- Ricerca immobile: acquirenti, inquilini e ospiti vengono indirizzati agli immobili Guimmia, senza generare una pratica proprietario errata.
- Dashboard: scheda “Guida Guimmia” collegata al cervello.
- Gestione immobile: possibilità di correggere anche il tipo di operazione.
- Documenti: checklist specifiche per vendita, lungo termine, transitorio, studenti e turistico breve.
- Percorsi operativi: fasi, obiettivi e attività distinti per transitorio, studenti e turistico breve.
- Continuità: ultima indicazione sicura disponibile localmente in caso di errore temporaneo.
- Autorità umana: passaggio visibile all'agente o al professionista quando serve una verifica o una decisione riservata.

## Checklist documentali iniziali

Le checklist aiutano a organizzare la pratica e non sostituiscono la verifica professionale. Oltre ai documenti comuni dell'immobile, la V77.2 distingue:

| Percorso | Elementi specifici |
| --- | --- |
| Vendita | titolo di provenienza e documenti della vendita |
| Affitto lungo termine | autorizzazione alla locazione e profilo contrattuale |
| Affitto transitorio | esigenza transitoria, evidenza e durata |
| Affitto studenti | iscrizione o corso e, quando necessario, garanzie |
| Affitto turistico breve | conformità dell'unità, regole locali e adempimenti di comunicazione ospiti |

## Limiti intenzionali della V77.2

Questa versione non esegue operazioni esterne, non pubblica annunci, non prenota appuntamenti e non rende persistenti nel database le decisioni del cervello. La continuità locale è una protezione dell'esperienza utente, non sostituisce lo stato persistente e verificabile della pratica che verrà introdotto nel blocco successivo.

## Blocchi successivi

| Versione | Blocco |
| --- | --- |
| V77.3 | Stato pratica persistente, evidenze e decisioni della dashboard |
| V77.4 | Readiness documentale, validazione e richieste assistite |
| V77.5 | Annunci, contatti, visite, disponibilità e appuntamenti |
| V77.6 | Offerte, contratti, chiusura e handoff professionali |
| V77.7 | Audit operativo, osservabilità e preparazione produzione |

Ogni blocco deve mantenere rollback locale, build applicativa obbligatoria e verifica di non esecuzione automatica.
