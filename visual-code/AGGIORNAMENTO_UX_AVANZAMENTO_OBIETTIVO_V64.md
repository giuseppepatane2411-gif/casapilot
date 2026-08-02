# CasaPilot v6.4 — Avanzamento basato sull’obiettivo

## Problema corretto

La barra del wizard mostrava il completamento dei cinque passaggi iniziali come percentuale. Arrivando alla posizione, l’utente poteva leggere circa 60–80% e interpretarlo come avanzamento dell’intera pratica, anche se documenti e fasi operative erano ancora quasi tutti da completare.

## 1. Il wizard non finge più di misurare la pratica

La barra durante la creazione dell’immobile ora si chiama **Configurazione iniziale**.

- mostra `Passaggio X di 5`;
- non mostra più una percentuale della pratica;
- chiarisce che misura soltanto la creazione della scheda;
- anticipa che il percorso reale verrà calcolato dopo il salvataggio.

## 2. Nuova barra “Percorso verso la vendita / l’affitto”

Dopo la creazione della casa, la dashboard mostra una barra basata sull’obiettivo finale.

### Vendita

- Dati e posizione: 12%
- Documenti e verifiche: 38%
- Strategia e annuncio: 18%
- Pubblicazione e visite: 14%
- Proposta e chiusura: 18%

### Affitto

- Dati e posizione: 12%
- Documenti e verifiche: 33%
- Canone, contratto e annuncio: 20%
- Pubblicazione e selezione: 15%
- Inquilino, contratto e consegna: 20%

Inserire e verificare la posizione completa quindi soltanto una parte della prima fase. Con una scheda iniziale completa ma senza documenti, l’avanzamento resta intorno al 12%, non all’80%.

## 3. Documenti pesati per importanza

La fase documentale non conta tutti i documenti allo stesso modo. Utilizza i pesi già presenti nella checklist.

- i documenti rappresentano il 90% della fase;
- foglio, particella/mappale e subalterno rappresentano il restante 10%;
- i riferimenti catastali sono importanti ma non bloccano l’avvio del percorso.

Quando la visura risulta disponibile ma i riferimenti non sono stati inseriti, Pilot propone di riportarli nella scheda.

## 4. Missioni ordinate per fase reale

Pilot non ordina più tutto soltanto per priorità astratta. Ora segue questo ordine:

1. dati essenziali e posizione verificata;
2. documenti e riferimenti catastali;
3. strategia e preparazione;
4. pubblicazione e gestione dei contatti;
5. chiusura coerente con vendita o affitto.

Le missioni successive sono differenti in base all’obiettivo scelto.

## 5. Aggiornamento automatico delle pratiche esistenti

Quando CasaPilot legge una pratica creata con versioni precedenti, ricalcola il vecchio valore di avanzamento con il nuovo modello conservativo. Dati, documenti e mappa non vengono eliminati.

## Controlli eseguiti

- TypeScript `tsc --noEmit`: superato
- ESLint: superato
- Build Next.js: non eseguito perché il registry del sandbox non rende disponibile `@next/swc-linux-x64-gnu@16.2.10`
