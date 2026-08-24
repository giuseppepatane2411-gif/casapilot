# Guimmia

Guimmia è un’applicazione Next.js per organizzare vendita e locazione di immobili attraverso percorsi guidati, checklist documentali, mappa verificata, Pilot e profili professionali.

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
