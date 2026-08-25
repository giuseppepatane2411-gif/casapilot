# Guimmia V77.4 REV2 — ponte controllato cervello–OpenAI

## Obiettivo

La V77.4 rende utilizzabile il cervello operativo di Guimmia nella chat iniziale e nelle pratiche della dashboard. OpenAI non sostituisce il motore Guimmia e non riceve autorità operativa.

## Flusso obbligatorio

1. Il motore deterministico identifica percorso, fase, blocchi, domande e competenza richiesta.
2. Il recupero locale consulta l’intero catalogo attivo e seleziona al massimo 10 regole e 6 knowledge card pertinenti, oltre al workflow applicabile.
3. GPT-5.6 Luna riceve soltanto questo contesto ridotto e produce una risposta strutturata.
4. Il server elimina riferimenti non presenti nel contesto, impone l’handoff quando richiesto e sostituisce eventuali azioni materiali generate dal modello con il passaggio deterministico sicuro.
5. Supabase registra decisione, riferimenti, risultato, token e costo in un audit immutabile. La domanda completa non viene memorizzata: restano soltanto hash e lunghezza.

## Funzioni disponibili

- guida sulla pratica;
- controllo dei documenti dichiarati e individuazione delle informazioni mancanti;
- spiegazione del prossimo passaggio;
- bozza di comunicazione da confermare;
- segnalazione del controllo necessario da parte di Guimmia o di un professionista.

## Limiti di autorità

OpenAI non può approvare documenti, certificare conformità, stabilire prezzi definitivi, scegliere candidati, accettare o rifiutare offerte, contattare persone o modificare la pratica. Ogni risposta è in modalità `DRY_RUN` e il controllo umano resta obbligatorio.

## Protezione dei dati e dei costi

- chiavi esclusivamente lato server;
- email, telefono e codice fiscale oscurati prima della richiesta;
- indirizzo completo non inviato al modello;
- massimo 900 token di risposta;
- massimo 0,02 USD stimati per interazione del cervello;
- massimo 12 richieste ogni 30 minuti per utente;
- riuso per 15 minuti della stessa domanda sulla stessa versione della pratica, senza una nuova chiamata OpenAI;
- budget condiviso mensile di 5 USD;
- nessun deposito vettoriale necessario per le regole operative.

La ricerca vettoriale potrà essere aggiunta in futuro per manuali o PDF lunghi. Le regole operative continueranno a risiedere nel codice versionato di Guimmia.

## Punti di accesso

- `POST /api/guimmia/brain`: ponte server protetto e autenticato;
- chat Guimmia: usa OpenAI quando la pratica ha i dati minimi e ripiega sul percorso deterministico in caso di indisponibilità;
- dashboard pratica: domanda esplicita e a consumo, con fase e documenti correnti.

Entrambe le interfacce mostrano se la risposta proviene da cervello Guimmia + OpenAI, dal riuso gratuito oppure dal solo percorso deterministico.

## Configurazione

La V77.4 riusa le variabili già configurate:

- `OPENAI_API_KEY`;
- `NEXT_PUBLIC_SUPABASE_URL`;
- `SUPABASE_SECRET_KEY` oppure `SUPABASE_SERVICE_ROLE_KEY`.

Non è necessaria alcuna nuova variabile Vercel.
