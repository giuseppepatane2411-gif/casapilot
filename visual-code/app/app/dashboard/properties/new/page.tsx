import type { Metadata } from "next";
import { Suspense } from "react";

import PropertyWizard from "@/components/property-wizard/PropertyWizard";

export const metadata: Metadata = {
  title: "Nuovo percorso",
  description: "Crea una nuova pratica immobiliare con Guimmia.",
};

export default function NewPropertyPage() {
  return (
    <Suspense fallback={<PropertyWizardFallback />}>
      <PropertyWizard />
    </Suspense>
  );
}

function PropertyWizardFallback() {
  return <div className="h-[720px] animate-pulse rounded-[32px] bg-slate-100" />;
}
