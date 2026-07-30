import { getRequiredDocuments } from "@/lib/property-journey/constants";
import type { PropertyJourney } from "@/lib/property-journey/types";
import type {
  JourneyPilotMemory,
  PilotReadiness,
  PilotRisk,
} from "@/lib/pilot-os/types";

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function calculateReadiness(
  journey: PropertyJourney,
  memory: JourneyPilotMemory,
): PilotReadiness {
  const profileFacts = [
    Boolean(journey.property.name),
    Boolean(journey.property.surface),
    Boolean(journey.property.occupancy),
    Boolean(journey.property.country),
    Boolean(journey.property.city),
    Boolean(journey.property.province),
    Boolean(journey.property.address),
    Boolean(journey.property.postalCode),
  ];
  const data = clamp(
    (profileFacts.filter(Boolean).length / profileFacts.length) * 100,
  );

  const requiredDocuments = getRequiredDocuments(
    journey.operation,
    journey.property.type,
  );
  const documents = requiredDocuments.length
    ? clamp((journey.documents.length / requiredDocuments.length) * 100)
    : 100;

  const completedExecutionMissions = memory.completedMissionIds.filter(
    (missionId) =>
      missionId === "marketing-material" || missionId === "strategy-review",
  ).length;
  const execution = clamp(
    20 + journey.progress * 0.45 + completedExecutionMissions * 20,
  );

  const overall = clamp(data * 0.3 + documents * 0.5 + execution * 0.2);
  const label =
    overall >= 85
      ? "Quasi pronto"
      : overall >= 65
        ? "Ben avviato"
        : overall >= 40
          ? "In costruzione"
          : "Da impostare";

  return {
    overall,
    data,
    documents,
    execution,
    label,
  };
}

export function generateRisks(journey: PropertyJourney): PilotRisk[] {
  const risks: PilotRisk[] = [];
  const requiredDocuments = getRequiredDocuments(
    journey.operation,
    journey.property.type,
  );
  const missingIds = requiredDocuments
    .filter((document) => !journey.documents.includes(document.id))
    .map((document) => document.id);

  if (missingIds.includes("ownership")) {
    risks.push({
      id: "missing-ownership",
      title: "Titolarità da verificare",
      description:
        "L’atto di provenienza non risulta ancora disponibile nel fascicolo.",
      severity: "high",
    });
  }

  if (
    missingIds.includes("cadastralPlan") ||
    missingIds.includes("cadastralSurvey")
  ) {
    risks.push({
      id: "cadastral-gap",
      title: "Dati catastali incompleti",
      description:
        "Planimetria o visura mancante possono rallentare controlli e confronto dei dati.",
      severity: "high",
    });
  }

  if (journey.operation === "sale" && missingIds.includes("urbanCompliance")) {
    risks.push({
      id: "urban-check",
      title: "Conformità da approfondire",
      description:
        "La verifica urbanistico-catastale non è ancora segnata come disponibile.",
      severity: "medium",
    });
  }

  if (journey.property.occupancy === "tenant") {
    risks.push({
      id: "occupied-property",
      title: "Immobile occupato",
      description:
        "Contratto, scadenze e situazione dei pagamenti devono entrare nella strategia.",
      severity: "medium",
    });
  }

  if (!journey.property.address || !journey.property.postalCode) {
    risks.push({
      id: "incomplete-location",
      title: "Posizione incompleta",
      description:
        "Senza indirizzo e CAP alcune analisi e ricerche locali saranno meno precise.",
      severity: "low",
    });
  }

  return risks.slice(0, 4);
}
