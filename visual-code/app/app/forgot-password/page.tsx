import type { Metadata } from "next";

import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Recupera password",
  description: "Recupera l’accesso al tuo account Guimmia.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Recupero accesso"
      title="Reimposta la password."
      description="Inserisci l’email usata per la registrazione. Riceverai un collegamento sicuro per scegliere una nuova password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
