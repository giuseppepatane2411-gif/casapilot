const AUTH_ERROR_MAP: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "Email o password non corretti."],
  [/email not confirmed/i, "Conferma l’indirizzo email prima di accedere."],
  [/user already registered/i, "Esiste già un account associato a questa email."],
  [/password should be at least/i, "La password non rispetta i requisiti minimi di sicurezza."],
  [/weak password/i, "Scegli una password più sicura e difficile da indovinare."],
  [/email rate limit exceeded/i, "Sono state inviate troppe email. Attendi qualche minuto e riprova."],
  [/rate limit/i, "Hai effettuato troppi tentativi. Attendi qualche minuto e riprova."],
  [/network|fetch failed/i, "Connessione non disponibile. Controlla la rete e riprova."],
];

export function getAccountErrorMessage(
  error: unknown,
  fallback = "Non è stato possibile completare l’operazione.",
) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const match = AUTH_ERROR_MAP.find(([pattern]) => pattern.test(raw));
  return match?.[1] ?? fallback;
}

export function isStrongEnoughPassword(password: string) {
  return (
    password.length >= 10 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

export function normalizeProvince(value: string) {
  return value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
}
