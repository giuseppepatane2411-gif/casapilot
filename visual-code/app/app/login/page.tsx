import type { Metadata } from "next";
import { Suspense } from "react";

import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Accedi",
  description: "Accedi al tuo spazio personale CasaPilot.",
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Accesso"
      title="Bentornato."
      description="Accedi per ritrovare il tuo profilo e continuare il percorso immobiliare dal punto in cui lo hai lasciato."
    >
      <Suspense fallback={<div className="h-80 animate-pulse rounded-3xl bg-slate-100" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
