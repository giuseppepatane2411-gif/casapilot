import { getRequiredDocuments } from "@/lib/property-journey/constants";
import type { PropertyJourney } from "@/lib/property-journey/types";
import type {
  JourneyPilotMemory,
  PilotTimelineEvent,
} from "@/lib/pilot-os/types";

export function buildTimeline(
  journey: PropertyJourney,
  memory: JourneyPilotMemory,
): PilotTimelineEvent[] {
  const definitions = getRequiredDocuments(
    journey.operation,
    journey.property.type,
  );
  const events: PilotTimelineEvent[] = [
    {
      id: "journey-created",
      date: journey.createdAt,
      title: "Percorso creato",
      description: `È nato il fascicolo digitale di ${journey.property.name}.`,
      type: "created",
    },
  ];

  journey.documents.forEach((documentId, index) => {
    const definition = definitions.find(
      (document) => document.id === documentId,
    );
    if (!definition) return;

    const alreadyRecorded = memory.timelineEvents.some(
      (event) => event.id === `document-${documentId}`,
    );
    if (alreadyRecorded) return;

    events.push({
      id: `document-${documentId}`,
      date: new Date(
        new Date(journey.updatedAt).getTime() + index,
      ).toISOString(),
      title: `${definition.title} disponibile`,
      description: "Documento registrato nella checklist dell’immobile.",
      type: "document",
    });
  });

  if (
    journey.documents.length === definitions.length &&
    definitions.length > 0
  ) {
    events.push({
      id: "document-checklist-complete",
      date: journey.updatedAt,
      title: "Checklist iniziale completata",
      description: "Il fascicolo documentale di base risulta organizzato.",
      type: "milestone",
    });
  }

  return [...memory.timelineEvents, ...events]
    .filter(
      (event, index, all) =>
        all.findIndex((candidate) => candidate.id === event.id) === index,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}
