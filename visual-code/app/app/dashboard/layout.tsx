import type { Metadata } from "next";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { getCurrentRoleAccess } from "@/lib/auth/role-access";

export const metadata: Metadata = {
  title: "Dashboard | Guimmia",
  description: "Gestisci il tuo percorso immobiliare con Guimmia.",
  robots: { index: false, follow: false },
};

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const access = await getCurrentRoleAccess();

  return (
    <DashboardShell
      canAccessProfessional={access.isProfessional || access.isAdmin}
    >
      {children}
    </DashboardShell>
  );
}
