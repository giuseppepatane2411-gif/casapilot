import type { Metadata } from "next";

import LocalDataSettings from "@/components/settings/LocalDataSettings";

export const metadata: Metadata = {
  title: "Impostazioni",
  description: "Gestisci i dati locali dell’MVP CasaPilot.",
};

export default function SettingsPage() {
  return <LocalDataSettings />;
}
