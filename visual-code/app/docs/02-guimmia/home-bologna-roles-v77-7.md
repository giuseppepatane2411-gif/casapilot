# Guimmia V77.7 REV3 — home finale, vetrina immobili e separazione dei ruoli

## Obiettivo

La home presenta prima il valore distinto di Guimmia, rende la conversazione il punto di ingresso principale e sposta la ricerca immobiliare dopo il messaggio di posizionamento. Il lancio iniziale usa Bologna come contesto degli esempi. Le aree cliente e professionista sono separate sia nella navigazione sia nei controlli server.

La REV2 elimina la sottolineatura decorativa e affida l’enfasi a dimensioni e pesi tipografici differenti. La chat visibile non è più un semplice saluto: mostra nello smartphone l’avvio di una pratica, i PDF ricevuti, l’anteprima dell’annuncio e il coordinamento dei canali immobiliari.

La REV3 chiude il lavoro sulla home: elimina i blocchi ripetitivi, porta “Come funziona” subito dopo la missione, conclude con le CTA vendita e affitto e sposta ricerca e immobile in evidenza nella pagina “Vetrina immobili”. Il messaggio pubblico sul lancio da Bologna viene rimosso.

## Ordine della home

1. Missione Guimmia e differenza rispetto a un portale immobiliare.
2. Spiegazione “Come funziona”.
3. Percorsi vendita e affitto come CTA finale.

Il riquadro della ricerca mantiene tab, filtri, CTA dinamiche e immobile in evidenza nella pagina “Vetrina immobili”. La vetrina completa resta fuori dalla home.

## Lancio Bologna

- Il messaggio iniziale comunica che Guimmia parte da Bologna.
- La home cerca prioritariamente annunci pubblicati a Bologna.
- Se non esiste ancora un annuncio pubblicato a Bologna, viene mostrata una scheda dimostrativa esplicitamente contrassegnata come esempio.
- Prompt, placeholder e dati demo usano Bologna e la sua provincia.

## Separazione cliente e professionista

Il cliente vede Percorso, I miei immobili, Documenti e Servizi per l’immobile. Non vede profilo professionale, incarichi, analytics o dashboard professionale.

Un utente con ruolo `professional` o `admin` può passare all’area `/professionista`. I percorsi professionali e amministrativi sono protetti dal proxy e da controlli server nelle pagine sensibili. Digitare manualmente un URL riservato non aggira la separazione.

## Autorità e sicurezza

Guimmia prepara, organizza e propone. Il cliente controlla i dati e prende le decisioni. Le funzioni introdotte dalla V77.6 per valutazioni, lead, email e stanze restano invariate.
