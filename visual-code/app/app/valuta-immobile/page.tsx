import type { Metadata } from "next";

import PublicAgencyFooter from "@/components/agency/PublicAgencyFooter";
import PublicAgencyHeader from "@/components/agency/PublicAgencyHeader";
import PropertyValuationExperience from "@/components/valuation/PropertyValuationExperience";

export const metadata: Metadata = {
  title: "Valuta il tuo immobile | Guimmia",
  description:
    "Ottieni una fascia indicativa per vendere o affittare il tuo immobile con Guimmia, la tua guida immobiliare intelligente.",
};

export default function PropertyValuationPage() {
  return (
    <>
      <PublicAgencyHeader />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-4 py-10 text-slate-950 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <PropertyValuationExperience />
        </div>
      </main>
      <PublicAgencyFooter />
    </>
  );
}
