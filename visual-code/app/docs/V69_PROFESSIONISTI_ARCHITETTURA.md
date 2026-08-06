# Architettura V69 Professionisti

Il frontend usa un catalogo configurabile e un repository demo in localStorage per validare UX e funnel senza rischiare Supabase. Il database reale è già modellato nella migrazione inclusa.

## Eventi centrali

`lead_created → matched → viewed → quote_sent → quote_accepted → contacts_unlocked → job_completed → review_submitted`

## Metriche centrali

- qualità media lead;
- tasso risposta;
- preventivi per richiesta;
- tasso accettazione;
- categorie con domanda non coperta;
- tempo prima risposta;
- lavori completati;
- recensioni verificate.
