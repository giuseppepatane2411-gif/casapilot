# Guimmia

Guimmia è un’applicazione Next.js per organizzare vendita e locazione di immobili attraverso percorsi guidati, checklist documentali, mappa verificata, Pilot e profili professionali.

La V77.3 REV2 introduce il primo collegamento controllato a GPT-5.6 Luna per la stima preliminare di vendita e affitto: comparabili pubblici, qualità delle evidenze, budget mensile, limite per richiesta e autorità umana obbligatoria. Le chiavi `OPENAI_API_KEY` e `SUPABASE_SECRET_KEY` devono essere configurate esclusivamente sul server o nelle variabili d’ambiente Vercel.

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
