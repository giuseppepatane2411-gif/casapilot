# CasaPilot v6.6.1 — Correzioni build

Correzioni incluse:

1. Gestione sicura del risultato nullable di `supabase.auth.getClaims()` nel proxy.
2. Boundary React `Suspense` nella pagina `/dashboard` per `useSearchParams()`.
3. Boundary React `Suspense` nella pagina `/dashboard/properties/new` per `useSearchParams()`.

Verifiche eseguite:

- TypeScript: superato (`tsc --noEmit`)
- ESLint: superato
- Audit dei componenti che usano `useSearchParams`: completato

Il build completo nel sandbox non è stato eseguibile perché non è disponibile il binario SWC Linux di Next.js. Le correzioni risolvono gli errori mostrati dal build Windows dell'utente.
