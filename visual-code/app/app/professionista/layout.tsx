import type { ReactNode } from "react";
import ProfessionalShell from "@/components/professional-os/ProfessionalShell";
import { requireProfessionalAccess } from "@/lib/auth/role-access";

export default async function ProfessionistaLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireProfessionalAccess();
  return <ProfessionalShell>{children}</ProfessionalShell>;
}
