import type { TechnicalTimelineEvent } from "./types";

const order: Record<TechnicalTimelineEvent["eventType"], number> = {
  CONSTRUCTION: 10, URBAN_TITLE: 20, VARIANT: 30, WORKS: 40, CHANGE_OF_USE: 50,
  SANATORIA: 60, CONDONO: 70, AGIBILITY: 80, CADASTRAL_UPDATE: 90, OTHER: 100,
};

export function sortTechnicalTimeline(events: TechnicalTimelineEvent[]): TechnicalTimelineEvent[] {
  return [...events].sort((a,b) => {
    const da = a.eventDate ? Date.parse(a.eventDate) : Number.MAX_SAFE_INTEGER;
    const db = b.eventDate ? Date.parse(b.eventDate) : Number.MAX_SAFE_INTEGER;
    if (da !== db) return da-db;
    return order[a.eventType]-order[b.eventType];
  });
}

export function timelineCompleteness(events: TechnicalTimelineEvent[]) {
  const documented = events.filter(x=>x.status==="DOCUMENTED" || x.status==="VERIFIED").length;
  const unknown = events.filter(x=>x.status==="UNKNOWN").length;
  return { total: events.length, documented, unknown, complete: events.length>0 && unknown===0 };
}
