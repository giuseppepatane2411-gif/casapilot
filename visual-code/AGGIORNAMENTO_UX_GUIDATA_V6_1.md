# CasaPilot UX Guidata v6.1 — Ricerca indirizzi corretta

Correzione mirata alla ricerca di Comune, via, indirizzo e CAP.

## Cosa cambia

- La ricerca non chiama più Photon direttamente dal browser: passa da una route interna di CasaPilot (`/api/location-search`).
- Il proxy server-side evita i problemi più comuni di richieste cross-origin e centralizza timeout, fallback ed errori.
- Ricerca *search-as-you-type* dopo 2 caratteri per Comune, via e indirizzo.
- Ricerca CAP italiano quando sono state inserite tutte e 5 le cifre.
- Per i CAP viene usato Zippopotam.us / GeoNames, perché Photon non è pensato per cercare un CAP isolato.
- Se la prima chiamata Photon non riesce, CasaPilot prova una seconda richiesta più compatibile prima di mostrare un errore.
- Stati UI espliciti: caricamento, nessun risultato, CAP incompleto, errore e pulsante Riprova.
- Selezionando un risultato vengono compilati i campi disponibili (Comune, Provincia, CAP, via/civico).

## Nota beta

Photon e Zippopotam.us sono servizi esterni gratuiti adatti al prototipo/beta. Per un prodotto con traffico importante sarà opportuno adottare un provider con SLA o un'infrastruttura dedicata.
