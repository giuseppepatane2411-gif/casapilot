import type { Metadata } from "next";

import DocumentsOverview from "@/components/property-journey/DocumentsOverview";

export const metadata: Metadata = {
  title: "Documenti",
  description: "Controlla le checklist documentali delle tue pratiche.",
};

export default function DocumentsPage() {
  return <DocumentsOverview />;
}
