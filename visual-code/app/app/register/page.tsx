import type { Metadata } from "next";
import { Suspense } from "react";

import AuthShell from "@/components/auth/AuthShell";
import RegistrationForm from "@/components/auth/RegistrationForm";

export const metadata: Metadata = {
  title: "Registrati",
  description: "Crea il tuo account Guimmia come privato o professionista.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Registrazione"
      title="Crea il tuo account."
      description="Crea il tuo account per conservare conversazioni e pratiche. Puoi entrare come privato oppure creare un profilo professionale."
    >
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-slate-100" />}>
        <RegistrationForm />
      </Suspense>
    </AuthShell>
  );
}
