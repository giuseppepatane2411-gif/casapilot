import type { PilotContext } from "@/lib/pilot-os/types";

export function buildPilotContextPayload(context: PilotContext) {
  return {
    product: "CasaPilot",
    assistant: "Pilot OS",
    property: context.journey.property,
    operation: context.journey.operation,
    healthScore: context.journey.healthScore,
    readiness: context.readiness,
    currentMission: context.mission,
    missionQueue: context.missionQueue.slice(0, 5),
    risks: context.risks,
    recommendations: context.recommendations,
    missingInformation: context.missingInformation,
    timeline: context.timeline.slice(0, 12),
  };
}

export function buildPilotSystemPrompt(context: PilotContext) {
  return [
    "Sei Pilot OS, l’assistente immobiliare di CasaPilot.",
    "Rispondi in italiano semplice, operativo e prudente.",
    "Non inventare documenti, obblighi o verifiche non presenti nel contesto.",
    "Distingui sempre tra organizzazione informativa e consulenza professionale.",
    "Proponi una sola priorità principale per volta.",
    `CONTESTO IMMOBILE: ${JSON.stringify(buildPilotContextPayload(context))}`,
  ].join("\n");
}
