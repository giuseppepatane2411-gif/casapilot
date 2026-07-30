import type {
  JourneyPilotMemory,
  PilotMessage,
  PilotTimelineEvent,
} from "@/lib/pilot-os/types";

const PILOT_MEMORY_STORAGE_KEY = "casapilot-pilot-os-memory-v2";
export const PILOT_MEMORY_CHANGE_EVENT = "casapilot:pilot-memory-changed";

type PilotMemoryMap = Record<string, JourneyPilotMemory>;

function isBrowser() {
  return typeof window !== "undefined";
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emitChange() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(PILOT_MEMORY_CHANGE_EVENT));
}

function readMemoryMap(): PilotMemoryMap {
  if (!isBrowser()) return {};

  const raw = window.localStorage.getItem(PILOT_MEMORY_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as PilotMemoryMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMemoryMap(map: PilotMemoryMap) {
  if (!isBrowser()) return;
  window.localStorage.setItem(PILOT_MEMORY_STORAGE_KEY, JSON.stringify(map));
  emitChange();
}

function createEmptyMemory(journeyId: string): JourneyPilotMemory {
  return {
    version: 2,
    journeyId,
    completedMissionIds: [],
    dismissedRecommendationIds: [],
    timelineEvents: [],
    messages: [],
    lastOpenedAt: new Date().toISOString(),
  };
}

export function readJourneyPilotMemory(journeyId: string): JourneyPilotMemory {
  const map = readMemoryMap();
  const existing = map[journeyId];

  if (!existing || existing.version !== 2) {
    return createEmptyMemory(journeyId);
  }

  return existing;
}

export function touchJourneyPilotMemory(journeyId: string) {
  const map = readMemoryMap();
  const memory = map[journeyId] ?? createEmptyMemory(journeyId);

  map[journeyId] = {
    ...memory,
    lastOpenedAt: new Date().toISOString(),
  };

  writeMemoryMap(map);
}

export function completePilotMission(journeyId: string, missionId: string) {
  const map = readMemoryMap();
  const memory = map[journeyId] ?? createEmptyMemory(journeyId);

  map[journeyId] = {
    ...memory,
    completedMissionIds: Array.from(
      new Set([...memory.completedMissionIds, missionId]),
    ),
    lastOpenedAt: new Date().toISOString(),
  };

  writeMemoryMap(map);
}

export function dismissPilotRecommendation(
  journeyId: string,
  recommendationId: string,
) {
  const map = readMemoryMap();
  const memory = map[journeyId] ?? createEmptyMemory(journeyId);

  map[journeyId] = {
    ...memory,
    dismissedRecommendationIds: Array.from(
      new Set([...memory.dismissedRecommendationIds, recommendationId]),
    ),
  };

  writeMemoryMap(map);
}

export function addPilotTimelineEvent(
  journeyId: string,
  event: Omit<PilotTimelineEvent, "id" | "date"> & {
    id?: string;
    date?: string;
  },
) {
  const map = readMemoryMap();
  const memory = map[journeyId] ?? createEmptyMemory(journeyId);
  const timelineEvent: PilotTimelineEvent = {
    ...event,
    id: event.id ?? createId("event"),
    date: event.date ?? new Date().toISOString(),
  };

  map[journeyId] = {
    ...memory,
    timelineEvents: [
      timelineEvent,
      ...memory.timelineEvents.filter((item) => item.id !== timelineEvent.id),
    ].slice(0, 50),
  };

  writeMemoryMap(map);
}

export function savePilotMessages(journeyId: string, messages: PilotMessage[]) {
  const map = readMemoryMap();
  const memory = map[journeyId] ?? createEmptyMemory(journeyId);

  map[journeyId] = {
    ...memory,
    messages: messages.slice(-30),
    lastOpenedAt: new Date().toISOString(),
  };

  writeMemoryMap(map);
}

export function createPilotMessage(
  role: PilotMessage["role"],
  content: string,
): PilotMessage {
  return {
    id: createId("message"),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function subscribeToPilotMemoryChanges(callback: () => void) {
  if (!isBrowser()) return () => undefined;

  window.addEventListener(PILOT_MEMORY_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(PILOT_MEMORY_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
