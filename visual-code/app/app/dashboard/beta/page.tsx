import type { Metadata } from "next";

import BetaLaunchpad from "@/components/beta/BetaLaunchpad";

export const metadata: Metadata = {
  title: "Test Flight",
  description: "Valida CasaPilot con scenari guidati, archivio locale e metriche senza costi.",
};

export default function BetaPage() {
  return <BetaLaunchpad />;
}
