import type { Metadata } from "next";

import LocalDataSettings from "@/components/settings/LocalDataSettings";

export const metadata: Metadata = {
  title: "Impostazioni",
  description: "Esporta, importa o cancella i dati locali di CasaPilot.",
};

export default function SettingsPage() {
  return <LocalDataSettings />;
}
