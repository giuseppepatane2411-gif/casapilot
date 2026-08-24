import {
  calculateDocumentCompletion,
  calculateSetupCompletion,
  getGoalPhaseWeights,
  journeyProgressData,
} from "@/lib/property-journey/progress-model";
import type { OperationType, PropertyJourney } from "@/lib/property-journey/types";
import { getOperationLabel } from "@/lib/property-journey/constants";
import type { JourneyPilotMemory } from "@/lib/pilot-os/types";

export type GoalProgressPhaseId =
  | "setup"
  | "documents"
  | "preparation"
  | "market"
  | "closing";

export type GoalProgressPhase = {
  id: GoalProgressPhaseId;
  label: string;
  description: string;
  weight: number;
  completion: number;
  earned: number;
  status: "completed" | "current" | "upcoming";
};

export type GoalProgress = {
  overall: number;
  title: string;
  objectiveLabel: string;
  currentPhaseId: GoalProgressPhaseId;
  currentPhaseLabel: string;
  phases: GoalProgressPhase[];
};

type PhaseDefinition = Omit<GoalProgressPhase, "completion" | "earned" | "status">;

function completionFromMissionIds(
  missionIds: string[],
  memory: JourneyPilotMemory,
) {
  if (!missionIds.length) return 0;
  const completed = missionIds.filter((id) =>
    memory.completedMissionIds.includes(id),
  ).length;
  return Math.round((completed / missionIds.length) * 100);
}

function getGoalMissionIds(operation: OperationType) {
  if (operation === "sale") {
    return {
      preparation: ["strategy-review", "marketing-material"],
      market: ["sale-publish-listing", "sale-manage-visits"],
      closing: ["sale-review-offer", "sale-close-transaction"],
    };
  }

  if (operation === "rent_tourist_short") {
    return {
      preparation: ["strategy-review", "marketing-material"],
      market: ["tourist-publish-listing", "tourist-open-booking"],
      closing: ["tourist-checkin-reporting", "tourist-turnover"],
    };
  }

  return {
    preparation: ["strategy-review", "marketing-material"],
    market: ["rent-publish-listing", "rent-screen-applicants"],
    closing: ["rent-select-tenant", "rent-sign-and-handover"],
  };
}

function getDefinitions(operation: OperationType): PhaseDefinition[] {
  const weights = getGoalPhaseWeights(operation);

  if (operation === "sale") {
    return [
      {
        id: "setup",
        label: "Dati e posizione",
        description: "Scheda immobile e posizione verificata.",
        weight: weights.setup,
      },
      {
        id: "documents",
        label: "Documenti e verifiche",
        description: "Fascicolo documentale, riferimenti catastali e verifiche per preparare la vendita.",
        weight: weights.documents,
      },
      {
        id: "preparation",
        label: "Strategia e annuncio",
        description: "Prezzo, presentazione, fotografie e contenuti dell’annuncio.",
        weight: weights.preparation,
      },
      {
        id: "market",
        label: "Pubblicazione e visite",
        description: "Annuncio pubblicato, richieste ordinate e visite gestite.",
        weight: weights.market,
      },
      {
        id: "closing",
        label: "Proposta e chiusura",
        description: "Valutazione delle offerte e passaggi conclusivi della vendita.",
        weight: weights.closing,
      },
    ];
  }

  if (operation === "rent_tourist_short") {
    return [
      {
        id: "setup",
        label: "Dati e posizione",
        description: "Scheda immobile e posizione verificata.",
        weight: weights.setup,
      },
      {
        id: "documents",
        label: "Conformità e documenti",
        description: "Requisiti dell’unità, regole locali e documenti necessari per l’ospitalità.",
        weight: weights.documents,
      },
      {
        id: "preparation",
        label: "Offerta e annuncio",
        description: "Condizioni del soggiorno, disponibilità, contenuti e approvazione dell’annuncio.",
        weight: weights.preparation,
      },
      {
        id: "market",
        label: "Prenotazioni e ospiti",
        description: "Richieste, disponibilità e conferme gestite in modo ordinato.",
        weight: weights.market,
      },
      {
        id: "closing",
        label: "Soggiorno e riassetto",
        description: "Check-in, adempimenti ospiti, check-out e preparazione del soggiorno successivo.",
        weight: weights.closing,
      },
    ];
  }

  const documentDescription =
    operation === "rent_student"
      ? "Fascicolo dell’immobile, requisiti dello studente e garanzie necessarie."
      : operation === "rent_transitory"
        ? "Fascicolo dell’immobile, esigenza transitoria e relativi elementi di supporto."
        : "Fascicolo, riferimenti catastali e verifiche per impostare una locazione più sicura.";
  const preparationLabel =
    operation === "rent_student"
      ? "Condizioni, garanzie e annuncio"
      : operation === "rent_transitory"
        ? "Durata, contratto e annuncio"
        : "Canone, contratto e annuncio";
  const marketLabel =
    operation === "rent_student"
      ? "Richieste e verifica studenti"
      : operation === "rent_transitory"
        ? "Richieste e verifica esigenza"
        : "Pubblicazione e selezione";
  const closingLabel =
    operation === "rent_student"
      ? "Studente, contratto e consegna"
      : operation === "rent_transitory"
        ? "Contratto transitorio e consegna"
        : "Inquilino, contratto e consegna";

  return [
    {
      id: "setup",
      label: "Dati e posizione",
      description: "Scheda immobile e posizione verificata.",
      weight: weights.setup,
    },
    {
      id: "documents",
      label: "Documenti e verifiche",
      description: documentDescription,
      weight: weights.documents,
    },
    {
      id: "preparation",
      label: preparationLabel,
      description: "Strategia di locazione, canone, criteri e presentazione.",
      weight: weights.preparation,
    },
    {
      id: "market",
      label: marketLabel,
      description: "Richieste, visite e prima valutazione dei candidati.",
      weight: weights.market,
    },
    {
      id: "closing",
      label: closingLabel,
      description: "Scelta finale, firma, registrazione e consegna dell’immobile.",
      weight: weights.closing,
    },
  ];
}

export function calculateGoalProgress(
  journey: PropertyJourney,
  memory: JourneyPilotMemory,
): GoalProgress {
  const data = journeyProgressData(journey);
  const missionIds = getGoalMissionIds(journey.operation);
  const completions: Record<GoalProgressPhaseId, number> = {
    setup: Math.round(calculateSetupCompletion(data)),
    documents: Math.round(calculateDocumentCompletion(data)),
    preparation: completionFromMissionIds(missionIds.preparation, memory),
    market: completionFromMissionIds(missionIds.market, memory),
    closing: completionFromMissionIds(missionIds.closing, memory),
  };

  const definitions = getDefinitions(journey.operation);
  const currentPhaseId =
    definitions.find((phase) => completions[phase.id] < 100)?.id ?? "closing";

  const phases = definitions.map<GoalProgressPhase>((phase) => ({
    ...phase,
    completion: completions[phase.id],
    earned: Math.round((completions[phase.id] / 100) * phase.weight),
    status:
      completions[phase.id] >= 100
        ? "completed"
        : phase.id === currentPhaseId
          ? "current"
          : "upcoming",
  }));

  const overall = Math.min(
    100,
    phases.reduce(
      (total, phase) => total + (phase.completion / 100) * phase.weight,
      0,
    ),
  );
  const currentPhase = phases.find((phase) => phase.id === currentPhaseId)!;

  return {
    overall: Math.round(overall),
    title:
      journey.operation === "sale"
        ? "Percorso verso la vendita"
        : `Percorso: ${getOperationLabel(journey.operation)}`,
    objectiveLabel: getOperationLabel(journey.operation),
    currentPhaseId,
    currentPhaseLabel: currentPhase.label,
    phases,
  };
}
