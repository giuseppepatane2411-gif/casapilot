import type { Metadata } from "next";

import PilotOSWorkspace from "@/components/pilot-os/PilotOSWorkspace";

export const metadata: Metadata = {
  title: "Pilot OS",
  description: "Missioni, rischi e prossimi passi per il tuo immobile.",
};

export default function DashboardPilotPage() {
  return <PilotOSWorkspace />;
}
