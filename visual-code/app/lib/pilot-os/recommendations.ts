import { getMissingDocuments } from "@/lib/property-journey/scoring";
import type { PropertyJourney } from "@/lib/property-journey/types";
import type {
  JourneyPilotMemory,
  PilotRecommendation,
} from "@/lib/pilot-os/types";

export function generateRecommendations(
  journey: PropertyJourney,
  memory: JourneyPilotMemory,
): PilotRecommendation[] {
  const recommendations: PilotRecommendation[] = [];
  const missing = getMissingDocuments(journey);

  if (missing.length >= 3) {
    recommendations.push({
      id: "document-focus",
      title: "Completa prima il fascicolo",
      description: `Mancano ancora ${missing.length} documenti. Recuperarli prima di pubblicare riduce interruzioni e richieste dell’ultimo minuto.`,
      impact: "high",
      category: "documents",
      actionLabel: "Apri checklist",
      href: `/dashboard/properties/${journey.id}#documents`,
    });
  }

  if ((journey.property.surface ?? 0) >= 140) {
    recommendations.push({
      id: "professional-photos",
      title: "Valuta fotografie professionali",
      description:
        "Per un immobile di questa metratura, immagini curate aiutano a raccontare meglio spazi e distribuzione.",
      impact: "medium",
      category: "marketing",
      actionLabel: "Vedi professionisti",
      href: "/dashboard/professionals",
    });
  }

  if (journey.property.type === "garage") {
    recommendations.push({
      id: "garage-details",
      title: "Metti in evidenza accesso e misure",
      description:
        "Larghezza dell’ingresso, facilità di manovra ed eventuale elettricità sono informazioni decisive per un garage.",
      impact: "medium",
      category: "property",
    });
  }

  if (journey.property.occupancy === "tenant") {
    recommendations.push({
      id: "tenant-status",
      title: "Organizza la locazione attuale",
      description:
        "Tieni disponibili contratto, scadenze, canone e stato dei pagamenti prima di prendere decisioni operative.",
      impact: "high",
      category: "strategy",
      actionLabel: "Parlane con Pilot",
      href: "/dashboard/pilot#pilot-chat",
    });
  }

  if (!journey.property.address || !journey.property.postalCode) {
    recommendations.push({
      id: "complete-location",
      title: "Completa la posizione dell’immobile",
      description:
        "Indirizzo e CAP rendono più preciso il fascicolo e saranno utili per servizi e professionisti locali.",
      impact: "medium",
      category: "property",
      actionLabel: "Completa dati",
      href: "/dashboard/pilot#property-data",
    });
  }

  if (journey.healthScore >= 80 && missing.length <= 2) {
    recommendations.push({
      id: "prepare-market",
      title: "Inizia a preparare la presentazione",
      description:
        "Il fascicolo è già solido. Puoi iniziare a raccogliere fotografie, caratteristiche e punti di forza senza perdere il focus sui documenti mancanti.",
      impact: "medium",
      category: "marketing",
      actionLabel: "Apri percorso",
      href: `/dashboard/properties/${journey.id}`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "ready-next-stage",
      title: "La base è ben organizzata",
      description:
        "Continua con una missione alla volta: Pilot aggiornerà automaticamente priorità e suggerimenti.",
      impact: "low",
      category: "strategy",
    });
  }

  return recommendations
    .filter(
      (recommendation) =>
        !memory.dismissedRecommendationIds.includes(recommendation.id),
    )
    .slice(0, 5);
}
