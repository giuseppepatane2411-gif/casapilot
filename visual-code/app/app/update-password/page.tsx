import type { Metadata } from "next";

import AuthShell from "@/components/auth/AuthShell";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Nuova password",
  description: "Imposta una nuova password per Guimmia.",
};

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      eyebrow="Sicurezza account"
      title="Scegli una nuova password."
      description="Usa una password lunga, unica e diversa da quelle utilizzate su altri servizi."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
