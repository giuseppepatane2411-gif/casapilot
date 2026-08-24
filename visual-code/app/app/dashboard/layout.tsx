import type { Metadata } from "next";

import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard | Guimmia",
  description: "Gestisci il tuo percorso immobiliare con Guimmia.",
};

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}