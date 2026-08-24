# Guimmia · attivazione account e profili professionali

Questa guida collega a Supabase le funzioni già presenti nell’interfaccia:

- registrazione privata e professionale;
- conferma email e reinvio del messaggio;
- accesso, uscita e recupero password;
- modifica dei dati personali;
- passaggio da account privato a professionale;
- profilo professionale completo;
- richiesta e stato della verifica;
- pubblicazione dei soli professionisti verificati;
- protezione della dashboard e Row Level Security.

## 1. Crea il progetto Supabase

Crea un nuovo progetto e conserva in modo sicuro le credenziali amministrative. Nel frontend useremo esclusivamente:

```text
Project URL
Publishable key
```

Non inserire mai la `service_role` nel progetto Next.js pubblico o nelle variabili `NEXT_PUBLIC_*`.

## 2. Esegui lo schema completo

Nel **SQL Editor** di Supabase apri ed esegui tutto il file:

```text
supabase/schema.sql
```

Lo script può essere eseguito anche sopra lo schema della v6.5. Aggiorna tabelle, stati di verifica, funzioni protette, policy RLS e vista pubblica dei professionisti verificati.

## 3. Configura `.env.local`

Dentro `visual-code/app`, copia:

```text
.env.example
```

in:

```text
.env.local
```

Inserisci i valori reali:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TUO-PROGETTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Riavvia il server ogni volta che modifichi `.env.local`.

## 4. Configura gli URL di autenticazione

In **Authentication → URL Configuration** imposta il dominio pubblico definitivo come `Site URL`.

Aggiungi tra i Redirect URLs:

```text
http://localhost:3000/auth/callback
http://localhost:3000/update-password
https://TUO-DOMINIO/auth/callback
https://TUO-DOMINIO/update-password
```

Per le anteprime Vercel aggiungi anche il dominio di preview soltanto durante i test.

## 5. Mantieni attiva la conferma email

In **Authentication → Providers → Email** lascia attiva la conferma dell’indirizzo. Guimmia include:

```text
/check-email
```

con reinvio controllato del messaggio e collegamento all’accesso.

Prima del lancio pubblico configura un mittente SMTP del dominio Guimmia e personalizza almeno i modelli:

- conferma registrazione;
- recupero password;
- modifica email;
- notifiche di sicurezza.

## 6. Imposta requisiti password coerenti

L’interfaccia richiede almeno:

- 10 caratteri;
- una lettera maiuscola;
- una lettera minuscola;
- un numero.

Configura in Supabase requisiti uguali o più severi. Valuta anche protezione da password compromesse, CAPTCHA e MFA prima di gestire dati sensibili in cloud.

## 7. Installa e avvia

Da PowerShell:

```powershell
cd C:\Users\Lenovo\Desktop\Guimmia\visual-code\app
npm.cmd install
npm.cmd run dev
```

## 8. Prove essenziali

### Account privato

1. Apri `/register?type=private`.
2. Completa i due passaggi.
3. Conferma l’email.
4. Accedi.
5. Modifica il profilo da `/dashboard/account`.

### Account professionale

1. Apri `/register?type=professional`.
2. Completa dati personali, attività e sicurezza.
3. Conferma l’email e accedi.
4. Apri `/dashboard/professional-profile`.
5. Completa presentazione e zone servite.
6. Invia la richiesta di verifica.
7. Controlla in Supabase che lo stato sia `submitted`.

### Passaggio da privato a professionista

1. Accedi con un account privato.
2. Apri `/dashboard/professional-profile`.
3. Attiva il profilo professionale.
4. Verifica che lo stesso account mantenga accesso alle pratiche locali.

## 9. Stati della verifica

```text
draft
submitted
under_review
changes_requested
verified
suspended
```

L’utente non può modificare direttamente lo stato. L’invio passa dalla funzione protetta:

```text
submit_professional_verification()
```

La vista pubblica:

```text
verified_professionals
```

espone esclusivamente profili con stato `verified` e visibilità `is_public = true`.

## 10. Cosa resta locale

Account e profili sono remoti. In questa versione rimangono ancora sul dispositivo:

- immobili e pratiche;
- checklist e cronologia;
- memoria di Pilot;
- file dell’Archivio locale.

Prima di aggiungere la sincronizzazione cloud va progettata una migrazione esplicita, reversibile e senza duplicazioni dei dati già presenti nei browser degli utenti.
