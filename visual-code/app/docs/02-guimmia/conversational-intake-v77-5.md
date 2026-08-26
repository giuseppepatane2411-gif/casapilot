# Guimmia V77.5 — chat che compila la scheda

## Obiettivo

La V77.5 elimina la compilazione manuale come percorso principale. Il cliente racconta a Guimmia ciò che vuole fare e ciò che sa dell’immobile; OpenAI estrae soltanto i fatti dichiarati e aggiorna una bozza strutturata.

## Esperienza utente

1. Il cliente scrive una frase libera, anche completa: obiettivo, immobile, Comune, metratura e stato.
2. Guimmia compila immediatamente tutti i campi riconosciuti.
3. Se manca un dato necessario, Guimmia pone una sola domanda e mostra scelte rapide quando esiste un elenco controllato.
4. La scheda laterale consente di correggere obiettivo, tipo di affitto, immobile, stato e disponibilità attraverso menu coerenti.
5. Comune, CAP e indirizzo usano i suggerimenti geografici. La posizione deve essere confermata esplicitamente dopo ogni modifica.
6. Soltanto il pulsante finale crea la pratica o apre il percorso appropriato.

## Vocabolari controllati

- obiettivo: vendere, acquistare, affittare, cercare in affitto, valutare per vendere, valutare per affittare;
- affitto: lungo termine, transitorio, studenti, turistico breve;
- tipologia: elenco immobiliare Guimmia;
- stato e disponibilità: elenchi normalizzati;
- Paese: elenco supportato;
- Comune e indirizzo: ricerca con suggerimenti e possibilità manuale soltanto come ripiego.

Superficie e note restano campi liberi perché non possono essere rappresentati correttamente da un elenco chiuso. I vani sono selezionabili da un elenco numerico.

## Contratto OpenAI

`POST /api/guimmia/intake` usa la Responses API con Structured Outputs e schema JSON rigoroso. Il modello può estrarre e spiegare, ma non può creare una pratica, confermare una posizione o eseguire azioni.

Protezione e costi:

- modello `gpt-5.6-luna`;
- modalità `DRY_RUN`;
- massimo 520 token di output;
- limite stimato di 0,01 USD per richiesta;
- massimo 20 richieste ogni 30 minuti per utente;
- riuso per 15 minuti delle richieste identiche;
- budget condiviso mensile di 5 USD;
- email, telefono e codice fiscale oscurati prima della richiesta;
- nessun testo completo della conversazione salvato nel registro;
- conferma umana e creazione manuale della pratica obbligatorie.

## Passaggio al cervello completo

Finché la scheda è una bozza, i messaggi aggiornano l’intake strutturato. Dopo la conferma e la creazione della pratica, la chat usa il ponte completo V77.4 per spiegare regole, documenti mancanti e prossimo passo sicuro.

## Configurazione

La V77.5 riusa le variabili già presenti:

- `OPENAI_API_KEY`;
- `NEXT_PUBLIC_SUPABASE_URL`;
- `SUPABASE_SECRET_KEY` oppure `SUPABASE_SERVICE_ROLE_KEY`.

Non è necessaria alcuna nuova variabile Vercel.
