import type { Metadata } from "next";

import PropertiesList from "@/components/property-journey/PropertiesList";

export const metadata: Metadata = {
  title: "I miei immobili",
  description: "Gestisci le tue pratiche immobiliari con CasaPilot.",
};

export default function PropertiesPage() {
  return <PropertiesList />;
}
