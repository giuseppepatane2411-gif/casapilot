# Guimmia

Guimmia è un’applicazione Next.js per organizzare vendita e locazione di immobili attraverso percorsi guidati, checklist documentali, mappa verificata, Pilot e profili professionali.

La V77.5 REV3 trasforma la chat nella `Stanza viva della pratica`: Guimmia estrae i dati dal racconto, mostra ricevute del lavoro preparato, tiene una coda delle conferme e indica la prossima mossa sicura. Scheda, documenti e agenda sono viste dello stesso caso. L’utente può caricare un documento: Guimmia ne propone tipo, cartella logica e destinatari del fascicolo, conservando il file in uno spazio privato. Può inoltre dichiarare disponibilità e chiedere appuntamenti in linguaggio naturale; l’agenda controlla fasce orarie e sovrapposizioni prima di creare una proposta. Nessun documento viene certificato o inviato e nessun appuntamento viene confermato automaticamente. Restano attivi il cervello deterministico V77.4 REV2, il riuso per 15 minuti, il budget mensile di 5 USD e gli audit immutabili. Le chiavi `OPENAI_API_KEY` e `SUPABASE_SECRET_KEY` devono essere configurate esclusivamente sul server o nelle variabili d’ambiente Vercel.

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
