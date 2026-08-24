import type { Metadata } from "next";

import CheckEmailPanel from "@/components/auth/CheckEmailPanel";
import AuthShell from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Conferma email",
  description: "Conferma l’indirizzo email associato al tuo account Guimmia.",
};

export default function CheckEmailPage() {
  return (
    <AuthShell
      eyebrow="Verifica dell’account"
      title="Controlla la tua email"
      description="La conferma dell’indirizzo completa la registrazione e protegge il tuo spazio personale."
    >
      <CheckEmailPanel />
    </AuthShell>
  );
}
