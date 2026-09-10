import type { Metadata } from "next";

import CheckEmailPanel from "@/components/auth/CheckEmailPanel";
import AuthShell from "@/components/auth/AuthShell";
import {
  firstSearchParam,
  safeNextPath,
  type PageSearchParams,
} from "@/lib/navigation/auth-flow";

export const metadata: Metadata = {
  title: "Conferma email",
  description: "Conferma l’indirizzo email associato al tuo account Guimmia.",
  robots: { index: false, follow: false },
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const source = await searchParams;
  const initialNext = safeNextPath(firstSearchParam(source.next));

  return (
    <AuthShell
      eyebrow="Verifica dell’account"
      title="Controlla la tua email"
      description="La conferma dell’indirizzo completa la registrazione e protegge il tuo spazio personale."
    >
      <CheckEmailPanel initialNext={initialNext} />
    </AuthShell>
  );
}
