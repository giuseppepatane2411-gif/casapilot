import type { ReactNode } from "react";
import ProfessionalShell from "@/components/professional-os/ProfessionalShell";

export default function ProfessionistaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProfessionalShell>{children}</ProfessionalShell>;
}
