import type { Metadata } from "next";

import DocumentsOverview from "@/components/property-journey/DocumentsOverview";

export const metadata: Metadata = {
  title: "I miei documenti",
  description: "Checklist e file dei tuoi immobili in un unico posto.",
};

export default function DocumentsPage() {
  return <DocumentsOverview />;
}
