# CasaPilot — Aggiornamento Pilot OS v1

## Novità principali

- nuovo motore `lib/pilot-os`
- Mission Engine con priorità, tempo stimato, motivazione e impatto sul punteggio
- Advisor con suggerimenti dinamici basati sui dati reali dell’immobile
- Timeline automatica del fascicolo digitale
- contatore delle informazioni conosciute da Pilot
- analisi dei dati mancanti
- nuova esperienza completa nella pagina Dashboard > Pilot

## Installazione

Questa cartella sostituisce la precedente cartella `visual-code`.

Dal terminale di VS Code:

```powershell
cd app
npm install
npm run dev
```

Poi aprire:

```text
http://localhost:3000/dashboard/pilot
```

## Nota

Pilot OS v1 funziona localmente e non utilizza ancora le API OpenAI. Questa architettura prepara un contesto strutturato e affidabile che verrà passato al modello nel prossimo sprint.
