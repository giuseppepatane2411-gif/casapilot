# CasaPilot — UX Focus v4

Obiettivo: ridurre il carico mentale senza eliminare funzioni.

## Principio
CasaPilot deve mostrare una sola decisione importante alla volta. Le funzioni avanzate restano disponibili, ma non competono con il prossimo passo.

## Modifiche principali
- Dashboard rinominata visivamente **Da fare**.
- Home attiva ridotta a: prossimo passo, avanzamento, accesso a Pilot e dettagli espandibili.
- Rimossi dalla vista principale indicatori e card secondarie che duplicavano altre sezioni.
- Navigazione desktop e mobile semplificata: **Da fare / La mia casa / Documenti / Pilot**.
- Pagina Documenti centrata sull'immobile attivo anziché su metriche aggregate.
- I documenti mancanti vengono mostrati per primi; quelli disponibili sono in una sezione espandibile.
- Pagina La mia casa alleggerita: una sola barra di avanzamento e una CTA principale.
- Pilot ora apre prima di tutto la conversazione; Command Center, readiness, timeline e suggerimenti sono sotto "strumenti avanzati".
- Wizard reso a colonna singola e progress bar compatta. Rimossa la sidebar informativa e il punteggio dal riepilogo finale.
- Copy semplificato e più orientato all'azione.

## Controlli
- ESLint: superato
- TypeScript (`tsc --noEmit`): superato

## Nota
Non sono state eliminate le funzioni avanzate: sono state spostate in secondo piano secondo il principio di progressive disclosure.
