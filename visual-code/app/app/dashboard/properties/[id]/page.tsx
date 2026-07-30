import type { Metadata } from "next";

import PropertyJourneyDetail from "@/components/property-journey/PropertyJourneyDetail";

export const metadata: Metadata = {
  title: "Percorso immobile",
  description: "Controlla la checklist e l’avanzamento della pratica.",
};

type PropertyJourneyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PropertyJourneyPage({
  params,
}: PropertyJourneyPageProps) {
  const { id } = await params;
  return <PropertyJourneyDetail journeyId={id} />;
}
