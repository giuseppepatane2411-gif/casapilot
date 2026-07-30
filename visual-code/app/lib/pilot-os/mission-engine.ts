import { getRequiredDocuments } from "@/lib/property-journey/constants";
import { getMissingDocuments } from "@/lib/property-journey/scoring";
import type { PropertyJourney } from "@/lib/property-journey/types";
import { DOCUMENT_PRIORITY, DOCUMENT_TIME_MINUTES } from "@/lib/pilot-os/knowledge";
import type {
  JourneyPilotMemory,
  PilotMission,
  PilotPriority,
} from "@/lib/pilot-os/types";

function priorityFromValue(value: number): PilotPriority {
  if (value >= 95) return "critical";
  if (value >= 80) return "high";
  if (value >= 60) return "medium";
  return "low";
}

function calculateDocumentScoreGain(
  journey: PropertyJourney,
  documentWeight: number,
) {
  const required = getRequiredDocuments(
    journey.operation,
    journey.property.type,
  );
  const totalWeight = required.reduce(
    (sum, document) => sum + document.weight,
    0,
  );

  return Math.max(4, Math.round((documentWeight / totalWeight) * 55));
}

function buildProfileMissions(journey: PropertyJourney): PilotMission[] {
  const missions: PilotMission[] = [];
  const href = `/dashboard/pilot#property-data`;

  if (!journey.property.surface) {
    missions.push({
      id: "profile-surface",
      title: "Aggiungi la superficie dell’immobile",
      description:
        "Indica i metri quadrati per rendere più precisi punteggio, suggerimenti e futura valutazione.",
      reason:
        "La superficie è uno dei dati essenziali per descrivere e confrontare correttamente l’immobile.",
      estimatedMinutes: 2,
      scoreGain: 5,
      priority: "high",
      category: "profile",
      href,
      completed: false,
      actionLabel: "Completa il dato",
    });
  }

  if (!journey.property.occupancy) {
    missions.push({
      id: "profile-occupancy",
      title: "Indica la situazione dell’immobile",
      description:
        "Specifica se è libero, abitato dal proprietario o occupato da un inquilino.",
      reason:
        "La situazione occupazionale può cambiare documenti, tempi e strategia del percorso.",
      estimatedMinutes: 2,
      scoreGain: 4,
      priority: "high",
      category: "profile",
      href,
      completed: false,
      actionLabel: "Completa il dato",
    });
  }

  if (!journey.property.address || !journey.property.postalCode) {
    missions.push({
      id: "profile-location",
      title: "Completa l’indirizzo dell’immobile",
      description:
        "Aggiungi indirizzo e CAP per migliorare il fascicolo e preparare i servizi locali.",
      reason:
        "Una posizione completa renderà più utili professionisti, scadenze e analisi territoriali.",
      estimatedMinutes: 3,
      scoreGain: 8,
      priority: "medium",
      category: "profile",
      href,
      completed: false,
      actionLabel: "Completa il dato",
    });
  }

  return missions;
}

function buildDocumentMissions(journey: PropertyJourney): PilotMission[] {
  return getMissingDocuments(journey)
    .sort((a, b) => DOCUMENT_PRIORITY[b.id] - DOCUMENT_PRIORITY[a.id])
    .map((document) => {
      const priorityValue = DOCUMENT_PRIORITY[document.id];

      return {
        id: `document-${document.id}`,
        title: `Recupera ${document.shortTitle}`,
        description: `${document.description} Appena lo hai, Pilot aggiornerà immediatamente il percorso.`,
        reason:
          priorityValue >= 90
            ? "È un documento fondamentale per identificare e verificare correttamente l’immobile."
            : "Completarlo riduce i blocchi nelle fasi successive del percorso.",
        estimatedMinutes: DOCUMENT_TIME_MINUTES[document.id],
        scoreGain: calculateDocumentScoreGain(journey, document.weight),
        priority: priorityFromValue(priorityValue),
        category: "documents" as const,
        href: `/dashboard/properties/${journey.id}#documents`,
        documentId: document.id,
        completed: false,
        actionLabel: "Segna come disponibile",
      };
    });
}

function buildExecutionMissions(journey: PropertyJourney): PilotMission[] {
  return [
    {
      id: "marketing-material",
      title: "Prepara il materiale per l’annuncio",
      description:
        "Raccogli fotografie, punti di forza e informazioni essenziali da mostrare agli interessati.",
      reason:
        "Il fascicolo iniziale è organizzato: ora puoi trasformare i dati dell’immobile in una presentazione efficace.",
      estimatedMinutes: 20,
      scoreGain: 5,
      priority: "medium",
      category: "marketing",
      href: `/dashboard/properties/${journey.id}`,
      completed: false,
      actionLabel: "Segna come completata",
    },
    {
      id: "strategy-review",
      title: "Rivedi la strategia con Pilot",
      description:
        "Controlla obiettivo, stato della pratica e prossime decisioni prima di procedere.",
      reason:
        "Una revisione breve evita di pubblicare o contattare professionisti con informazioni incomplete.",
      estimatedMinutes: 8,
      scoreGain: 3,
      priority: "low",
      category: "strategy",
      href: "/dashboard/pilot#pilot-chat",
      completed: false,
      actionLabel: "Parla con Pilot",
    },
  ];
}

export function generateMissionQueue(
  journey: PropertyJourney,
  memory: JourneyPilotMemory,
): PilotMission[] {
  const candidates = [
    ...buildProfileMissions(journey),
    ...buildDocumentMissions(journey),
    ...buildExecutionMissions(journey),
  ];

  const priorityRank: Record<PilotPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return candidates
    .filter((mission) => !memory.completedMissionIds.includes(mission.id))
    .sort((a, b) => {
      const priorityDifference =
        priorityRank[b.priority] - priorityRank[a.priority];
      if (priorityDifference !== 0) return priorityDifference;
      return b.scoreGain - a.scoreGain;
    });
}

export function generateMission(
  journey: PropertyJourney,
  memory: JourneyPilotMemory,
): PilotMission {
  const mission = generateMissionQueue(journey, memory)[0];

  if (mission) return mission;

  return {
    id: "journey-complete",
    title: "Percorso iniziale completato",
    description:
      "La base dell’immobile è organizzata. Pilot continuerà a conservare memoria e suggerire il prossimo passo utile.",
    reason:
      "Hai completato tutte le missioni iniziali disponibili in questa versione di Pilot OS.",
    estimatedMinutes: 1,
    scoreGain: 0,
    priority: "low",
    category: "strategy",
    href: "/dashboard/pilot#pilot-chat",
    completed: true,
    actionLabel: "Apri Pilot",
  };
}
