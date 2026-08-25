# Guimmia

Guimmia è un’applicazione Next.js per organizzare vendita e locazione di immobili attraverso percorsi guidati, checklist documentali, mappa verificata, Pilot e profili professionali.

La V77.4 REV2 estende il collegamento controllato a GPT-5.6 Luna all’intero cervello operativo di Guimmia. Il motore deterministico decide prima; un recupero locale seleziona soltanto workflow, regole e schede pertinenti; OpenAI spiega, controlla i dati dichiarati, propone il prossimo passo e prepara bozze senza eseguire azioni. La provenienza della risposta è visibile nell’interfaccia, le richieste identiche vengono riutilizzate per 15 minuti senza nuovo costo e un controllo di autorità sostituisce eventuali azioni materiali generate dal modello. Budget mensile, limite per richiesta, audit immutabile e autorità umana restano obbligatori. Le chiavi `OPENAI_API_KEY` e `SUPABASE_SECRET_KEY` devono essere configurate esclusivamente sul server o nelle variabili d’ambiente Vercel.

## Avvio locale

```powershell
npm.cmd install
npm.cmd run dev
```

Apri:

```text
http://localhost:3000
```

## Struttura principale

```text
app/                     pagine e route Next.js
components/              interfaccia e flussi utente
lib/property-journey/    pratiche e avanzamento
lib/pilot-os/            logica di Pilot
lib/account/             account e profili professionali
lib/supabase/            client SSR e sessione
supabase/schema.sql      database, funzioni e policy RLS
```

## Account

Per attivare registrazione, accesso e profili professionali segui:

```text
SUPABASE_ACCOUNT_SETUP.md
```

## Dati locali

Pratiche e documenti restano attualmente sul dispositivo. La pagina Impostazioni consente esportazione e ripristino del backup JSON.

## Controlli

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

## Prodotto

Versione applicativa: **Guimmia 1.0**
