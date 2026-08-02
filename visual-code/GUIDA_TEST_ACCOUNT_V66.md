# Test CasaPilot v6.6

## 1. Linguaggio prodotto

Controlla nella dashboard:

```text
Crea il tuo immobile
I miei immobili
```

Non devono comparire pulsanti o messaggi che presentano CasaPilot come versione di prova.

## 2. Account privato

1. Apri `/register?type=private`.
2. Verifica che il percorso abbia due passaggi.
3. Prova a continuare senza Comune o Provincia: deve comparire un errore chiaro.
4. Prova una password debole: la registrazione deve essere bloccata.
5. Completa la registrazione.
6. Conferma l’email.
7. Accedi e modifica i dati da `/dashboard/account`.

## 3. Account professionale

1. Apri `/register?type=professional`.
2. Verifica i tre passaggi.
3. Inserisci professione, attività e zone servite.
4. Conferma l’email e accedi.
5. Apri `/dashboard/professional-profile`.
6. Completa la presentazione con almeno 80 caratteri.
7. Salva.
8. Invia la richiesta di verifica.
9. Controlla che lo stato diventi `Richiesta inviata`.

## 4. Passaggio di ruolo

1. Accedi con un account privato.
2. Apri `/dashboard/professional-profile`.
3. Attiva il profilo professionale.
4. Controlla che l’account sia lo stesso e che le pratiche locali restino presenti.

## 5. Permessi

Da Supabase verifica che un utente autenticato:

- legga soltanto il proprio profilo;
- non possa cambiare `verification_status`;
- non possa modificare `verification_notes` o `verified_at`;
- non possa leggere richieste di altri utenti;
- non compaia nella vista pubblica prima di essere verificato e visibile.

## 6. Recupero password

1. Apri `/forgot-password`.
2. Richiedi il messaggio.
3. Apri il collegamento ricevuto.
4. Imposta una password conforme ai nuovi requisiti.
5. Accedi con la nuova password.

## 7. Backup

1. Esporta un backup dalla pagina Impostazioni.
2. Controlla che il file dichiari `version: 4`.
3. Importalo nuovamente.
4. Prova anche un backup creato con la v6.5 per verificare la migrazione.
