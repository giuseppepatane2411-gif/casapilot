import type { Metadata } from "next";

import PilotOSWorkspace from "@/components/pilot-os/PilotOSWorkspace";

export const metadata: Metadata = {
  title: "Pilot",
  description: "Il prossimo passo della tua pratica, spiegato in modo semplice.",
};

export default function DashboardPilotPage() {
  return <PilotOSWorkspace />;
}
