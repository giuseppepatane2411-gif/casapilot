import PublicAgencyFooter from "@/components/agency/PublicAgencyFooter";
import PublicAgencyHeader from "@/components/agency/PublicAgencyHeader";
import PropertyValuationExperience from "@/components/valuation/PropertyValuationExperience";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: "Valuta il tuo immobile",
  description:
    "Ottieni una fascia indicativa per vendita, affitto, vacanze o singola stanza con Guimmia.",
  path: "/valuta-immobile",
});

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
