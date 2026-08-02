# CasaPilot

> Il tuo assistente immobiliare intelligente.

CasaPilot accompagna privati e professionisti nell’organizzazione di vendita e locazione di immobili. Trasforma dati, documenti e attività in un percorso comprensibile, collegato all’obiettivo dell’utente.

## Versione

**CasaPilot 1.0**

## Funzioni presenti

- creazione e gestione di più tipologie di immobile;
- indirizzo guidato e posizione verificata sulla mappa;
- avanzamento basato su vendita o affitto;
- checklist e archivio documentale locale;
- missioni e priorità di Pilot;
- backup e ripristino delle pratiche;
- registrazione privata e professionale;
- conferma email, accesso e recupero password;
- profilo professionale con percorso di verifica;
- Row Level Security sui dati dell’account.

## Principio di prodotto

CasaPilot mostra una priorità alla volta e distingue sempre:

- ciò che l’utente ha già completato;
- ciò che manca per il suo obiettivo;
- ciò che richiede un professionista abilitato;
- ciò che può essere pubblicato o condiviso.

## Architettura

| Area | Tecnologia |
|---|---|
| Applicazione | Next.js e React |
| Account e database | Supabase e PostgreSQL |
| Autorizzazione | Row Level Security |
| Hosting previsto | Vercel |
| Pratiche attuali | Archiviazione locale del browser |

## Avvio

Apri `visual-code/app` e consulta:

```text
README.md
SUPABASE_ACCOUNT_SETUP.md
```

## Licenza

Copyright © 2026 CasaPilot. Tutti i diritti riservati.
