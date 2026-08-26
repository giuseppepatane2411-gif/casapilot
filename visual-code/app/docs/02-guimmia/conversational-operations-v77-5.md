# Guimmia V77.5 REV2 — chat operativa, fascicoli e agenda

## Obiettivo

La chat non è soltanto un punto informativo. È l’ingresso unico con cui il cliente può descrivere l’immobile, caricare documenti e indicare disponibilità. OpenAI interpreta il contenuto; il cervello deterministico di Guimmia applica regole, limiti e autorizzazioni.

## Documenti

- PDF, immagini, DOC/DOCX, RTF e testo fino a 10 MB.
- Archivio Supabase privato, senza URL pubblico.
- Lettura con `store: false`; per i PDF viene usato dettaglio basso per limitare i token.
- Proposta strutturata di tipo, categoria, nome, cartella logica e destinatari.
- Fascicoli logici per Guimmia, notaio, geometra e altri destinatari controllati.
- Documento inserito nel fascicolo soltanto dopo conferma dell’utente.
- Nessuna certificazione di validità, approvazione legale o spedizione automatica.

Il contenuto del file è trattato come dato non attendibile: eventuali istruzioni presenti nel documento non possono modificare le regole di Guimmia.

## Agenda condivisa

- Il proprietario registra le fasce disponibili dalla chat o dal pannello Agenda.
- Guimmia interpreta data, ora e tipo di appuntamento, ma produce soltanto una proposta.
- Prima dell’inserimento vengono controllati disponibilità, durata e conflitti.
- Visite, geometra, notaio, foto/video, consegna chiavi, check-in e check-out usano lo stesso calendario.
- La conferma del proprietario resta obbligatoria.
- Il futuro assistente vocale userà le medesime tabelle e le stesse regole: non verrà creato un secondo calendario.

## Collegamento al cervello

Le risposte del cervello ricevono soltanto uno snapshot operativo strutturato: stato dei documenti, cartelle, destinatari, disponibilità e appuntamenti. Non ricevono il file binario né dati di contatto completi. Un documento `ARCHIVED` significa “classificazione confermata”, non “validità legale verificata”.

## Confini della V77.5 REV2

Sono operative la classificazione dei documenti, la preparazione dei fascicoli logici, l’agenda condivisa e le proposte controllate dalla chat. Restano per aggiornamenti successivi l’invio reale di email o pacchetti, la sincronizzazione Google/Outlook, le prenotazioni provenienti dai portali e la telefonia dell’assistente vocale.
