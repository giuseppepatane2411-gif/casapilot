import { getOperationGoal } from "@/lib/pilot-os/knowledge";
import {
  generateMission,
  generateMissionQueue,
} from "@/lib/pilot-os/mission-engine";
import { generateRecommendations } from "@/lib/pilot-os/recommendations";
import {
  calculateReadiness,
  generateRisks,
} from "@/lib/pilot-os/readiness";
import { buildTimeline } from "@/lib/pilot-os/timeline";
import type {
  JourneyPilotMemory,
  PilotContext,
} from "@/lib/pilot-os/types";
import type { PropertyJourney } from "@/lib/property-journey/types";

function getMissingInformation(journey: PropertyJourney) {
  const missing: string[] = [];
  if (!journey.property.surface) missing.push("superficie");
  if (!journey.property.occupancy) missing.push("situazione occupazionale");
  if (!journey.property.address) missing.push("indirizzo");
  if (!journey.property.postalCode) missing.push("CAP");
  if (!journey.property.province) missing.push("provincia");
  return missing;
}

function countKnownFacts(
  journey: PropertyJourney,
  memory: JourneyPilotMemory,
) {
  const propertyValues = Object.values(journey.property).filter(
    (value) => value !== null && value !== "",
  ).length;
  const documentFacts = journey.documents.length * 3;
  const memoryFacts =
    memory.completedMissionIds.length +
    memory.timelineEvents.length +
    memory.messages.length;

  return 6 + propertyValues + documentFacts + memoryFacts;
}

export function buildPilotContext(
  journey: PropertyJourney,
  memory: JourneyPilotMemory,
): PilotContext {
  const missionQueue = generateMissionQueue(journey, memory);
  const mission = generateMission(journey, memory);
  const recommendations = generateRecommendations(journey, memory);
  const timeline = buildTimeline(journey, memory);
  const missingInformation = getMissingInformation(journey);
  const readiness = calculateReadiness(journey, memory);
  const risks = generateRisks(journey);

  return {
    journey,
    memory,
    mission,
    missionQueue,
    recommendations,
    timeline,
    missingInformation,
    readiness,
    risks,
    knownFacts: countKnownFacts(journey, memory),
    summary: `Pilot sta aiutando l’utente a ${getOperationGoal(
      journey.operation,
    )} per ${journey.property.name}. La priorità attuale è ${mission.title.toLowerCase()}.`,
  };
}
