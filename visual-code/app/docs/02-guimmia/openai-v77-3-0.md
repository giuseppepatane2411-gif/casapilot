# Guimmia V77.3.0 REV2 — Luna e valutazione preliminare controllata

La V77.3.0 introduce il primo percorso verticale collegato a OpenAI:

1. il proprietario sceglie vendita o affitto;
2. inserisce zona e caratteristiche dell'immobile;
3. Guimmia invia a GPT-5.6 Luna soltanto i dati dell'immobile;
4. Luna deve eseguire una ricerca web e può usare al massimo due chiamate;
5. la risposta rispetta uno schema JSON rigido;
6. Guimmia mostra fascia, comparabili, prezzo/m², qualità, limiti, fonti e costo stimato;
7. la lead viene registrata separatamente con i recapiti del proprietario.

La REV2 aggiunge un controllo indipendente dal giudizio del modello: se le fonti o gli
annunci comparabili sono insufficienti, Guimmia riduce automaticamente l'affidabilità
della stima e lo dichiara all'utente.

## Sicurezza

- `OPENAI_API_KEY` è letta esclusivamente dal server.
- `SUPABASE_SECRET_KEY` è letta esclusivamente dal server; il browser non può scrivere direttamente lead o audit IA.
- Nome, email e telefono non vengono inclusi nella richiesta OpenAI.
- La modalità rimane `DRY_RUN`.
- L'IA non pubblica prezzi e non decide il prezzo finale.
- Ogni risultato richiede controllo umano.
- Il prezzo/m² dei comparabili viene ricalcolato dal server.
- Tre richieste ogni 30 minuti per la stessa combinazione utente/rete evitano test ripetuti accidentali.
- Il costo massimo previsto per singola richiesta è 0,05 USD.
- Terra è configurato come modello di escalation, ma l'escalation automatica è disattivata.

## Variabili d'ambiente

Configurare localmente in `.env.local` e su Vercel:

```text
OPENAI_API_KEY=sk-...
SUPABASE_SECRET_KEY=sb_secret_...
```

Non usare mai il prefisso `NEXT_PUBLIC_` per questa variabile.
Lo stesso vale per `SUPABASE_SECRET_KEY`. Nei vecchi progetti Supabase è supportato anche
`SUPABASE_SERVICE_ROLE_KEY`.

## Database

Eseguire nell'ordine:

1. `20260824_v77_3_0_OPENAI_GATEWAY_PROPERTY_VALUATION.sql`
2. `20260824_v77_3_1_VERIFY_OPENAI_GATEWAY_PROPERTY_VALUATION.sql`

Il profilo SQL imposta un budget di riferimento di 5 USD, Luna come modello predefinito,
massimo due ricerche web e nessuna escalation automatica. La funzione
`guimmia_v773_ai_budget_status` controlla la spesa mensile registrata prima di autorizzare
una nuova chiamata. Per un limite assoluto indipendente dall'applicazione è comunque
raccomandato configurare anche il limite di spesa del progetto nella piattaforma OpenAI.

## Cosa non fa

- non sostituisce una perizia;
- non conosce i prezzi effettivi delle compravendite concluse quando non sono pubblici;
- non contatta autonomamente il proprietario;
- non pubblica l'immobile;
- non stabilisce il prezzo finale.
