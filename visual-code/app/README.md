# Guimmia

Guimmia è un’applicazione Next.js per organizzare vendita e locazione di immobili attraverso percorsi guidati, checklist documentali, mappa verificata, Pilot e profili professionali.

La V77.6 REV2 mantiene la “Stanza viva della pratica” della V77.5 REV3 e completa la home, la raccolta lead e i percorsi proprietario. La home conserva la ricerca e l’immobile in evidenza nel riquadro iniziale, ma non replica la vetrina completa nella pagina. Le valutazioni coprono vendita, affitto residenziale, affitto turistico e singola stanza: il calcolo parte solo dopo accesso o registrazione e soltanto dopo che la richiesta è stata salvata. Il risultato viene collegato all’account, inviato via email e presentato come fascia preliminare da controllare prima della pubblicazione. La vetrina dispone ora anche della pagina dettaglio dell’annuncio; per le stanze mostra dati strutturati su camera, disponibilità, spese e convivenza. Le preferenze personali restano private, non vengono pubblicate né usate per esclusioni automatiche. Restano attivi il cervello deterministico V77.4 REV2, il riuso per 15 minuti, il budget mensile di 5 USD e gli audit immutabili.

Le chiavi `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY` e `RESEND_API_KEY` devono essere configurate esclusivamente sul server o nelle variabili d’ambiente Vercel. Per l’email delle valutazioni serve anche `GUIMMIA_EMAIL_FROM`, per esempio `Guimmia <valutazioni@dominio-verificato.it>`.

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
