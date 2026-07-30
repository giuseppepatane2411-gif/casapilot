import type { Metadata } from "next";

import PropertyWizard from "@/components/property-wizard/PropertyWizard";

export const metadata: Metadata = {
  title: "Nuovo percorso",
  description: "Crea una nuova pratica immobiliare con CasaPilot.",
};

export default function NewPropertyPage() {
  return <PropertyWizard />;
}
