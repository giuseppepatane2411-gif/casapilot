import AgencyLandingPage from "@/components/agency/AgencyLandingPage";
import { createPublicMetadata } from "@/lib/seo/metadata";

export const metadata = createPublicMetadata({
  title: "Agenzia immobiliare digitale",
  description:
    "Vendi o affitta casa con l’agenzia Guimmia: annunci, documenti, visite, negoziazione e contratti in un unico percorso digitale.",
  path: "/agenzia",
});

export default function AgencyPage() {
  return <AgencyLandingPage />;
}
