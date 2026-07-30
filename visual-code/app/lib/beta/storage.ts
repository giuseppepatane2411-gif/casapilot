import {
  BETA_STATE_CHANGE_EVENT,
  BETA_STATE_STORAGE_KEY,
  LEGACY_BETA_STATE_STORAGE_KEY,
} from "@/lib/beta/constants";
import type {
  BetaEvent,
  BetaEventType,
  BetaFeedbackEntry,
  BetaMilestone,
  BetaScenario,
  BetaState,
  BetaTestSession,
} from "@/lib/beta/types";

const INITIAL_BETA_STATE: BetaState = {
  version: 2,
  onboardingDismissed: false,
  demoCreatedAt: null,
  milestones: [],
  feedback: [],
  activeSessionId: null,
  sessions: [],
  events: [],
};

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
  window.dispatchEvent(new Event(BETA_STATE_CHANGE_EVENT));
}

function migrateLegacyState(): BetaState {
  if (!isBrowser()) return INITIAL_BETA_STATE;

  const raw = window.localStorage.getItem(LEGACY_BETA_STATE_STORAGE_KEY);
  if (!raw) return INITIAL_BETA_STATE;

  try {
    const parsed = JSON.parse(raw) as {
      version?: number;
      onboardingDismissed?: boolean;
      demoCreatedAt?: string | null;
      milestones?: BetaMilestone[];
      feedback?: BetaFeedbackEntry[];
    };

    const migrated: BetaState = {
      ...INITIAL_BETA_STATE,
      onboardingDismissed: Boolean(parsed.onboardingDismissed),
      demoCreatedAt:
        typeof parsed.demoCreatedAt === "string" ? parsed.demoCreatedAt : null,
      milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
    };

    window.localStorage.setItem(BETA_STATE_STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return INITIAL_BETA_STATE;
  }
}

export function readBetaState(): BetaState {
  if (!isBrowser()) return INITIAL_BETA_STATE;

  const raw = window.localStorage.getItem(BETA_STATE_STORAGE_KEY);
  if (!raw) return migrateLegacyState();

  try {
    const parsed = JSON.parse(raw) as Partial<BetaState>;

    if (parsed.version !== 2) return migrateLegacyState();

    return {
      ...INITIAL_BETA_STATE,
      ...parsed,
      milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      activeSessionId:
        typeof parsed.activeSessionId === "string" ? parsed.activeSessionId : null,
    };
  } catch {
    return INITIAL_BETA_STATE;
  }
}

export function writeBetaState(state: BetaState) {
  if (!isBrowser()) return;
  window.localStorage.setItem(BETA_STATE_STORAGE_KEY, JSON.stringify(state));
  emitChange();
}

export function replaceBetaState(state: BetaState) {
  if (!state || state.version !== 2) return;
  writeBetaState(state);
}

export function trackBetaEvent(
  type: BetaEventType,
  options: {
    journeyId?: string | null;
    metadata?: BetaEvent["metadata"];
    sessionId?: string | null;
  } = {},
) {
  const state = readBetaState();
  const event: BetaEvent = {
    id: createId("event"),
    type,
    createdAt: new Date().toISOString(),
    sessionId: options.sessionId ?? state.activeSessionId,
    journeyId: options.journeyId ?? null,
    metadata: options.metadata,
  };

  writeBetaState({
    ...state,
    events: [event, ...state.events].slice(0, 300),
  });

  return event;
}

export function startBetaSession(scenario: BetaScenario) {
  const state = readBetaState();
  const session: BetaTestSession = {
    id: createId("session"),
    scenario,
    startedAt: new Date().toISOString(),
    completedAt: null,
    journeyId: null,
    feedbackId: null,
  };

  const event: BetaEvent = {
    id: createId("event"),
    type: "session-started",
    createdAt: session.startedAt,
    sessionId: session.id,
    journeyId: null,
    metadata: { scenario },
  };

  writeBetaState({
    ...state,
    activeSessionId: session.id,
    sessions: [session, ...state.sessions].slice(0, 50),
    events: [event, ...state.events].slice(0, 300),
  });

  return session;
}

export function attachJourneyToActiveSession(journeyId: string) {
  const state = readBetaState();
  if (!state.activeSessionId) return;

  writeBetaState({
    ...state,
    sessions: state.sessions.map((session) =>
      session.id === state.activeSessionId ? { ...session, journeyId } : session,
    ),
  });
}

export function completeActiveBetaSession(feedbackId: string | null = null) {
  const state = readBetaState();
  if (!state.activeSessionId) return;

  writeBetaState({
    ...state,
    activeSessionId: null,
    sessions: state.sessions.map((session) =>
      session.id === state.activeSessionId
        ? {
            ...session,
            completedAt: new Date().toISOString(),
            feedbackId: feedbackId ?? session.feedbackId,
          }
        : session,
    ),
  });
}

export function markBetaMilestone(milestone: BetaMilestone) {
  const state = readBetaState();

  if (state.milestones.includes(milestone)) return;

  writeBetaState({
    ...state,
    milestones: [...state.milestones, milestone],
  });
}

export function setBetaOnboardingDismissed(value: boolean) {
  const state = readBetaState();
  writeBetaState({ ...state, onboardingDismissed: value });
}

export function markDemoCreated(journeyId?: string) {
  const state = readBetaState();
  const nextState: BetaState = {
    ...state,
    demoCreatedAt: state.demoCreatedAt ?? new Date().toISOString(),
    milestones: Array.from(new Set([...state.milestones, "journey-created"])),
  };
  writeBetaState(nextState);
  if (journeyId) attachJourneyToActiveSession(journeyId);
}

export function saveBetaFeedback(
  feedback: Omit<BetaFeedbackEntry, "id" | "createdAt" | "sharedAt">,
) {
  const state = readBetaState();
  const entry: BetaFeedbackEntry = {
    ...feedback,
    id: createId("feedback"),
    createdAt: new Date().toISOString(),
    sharedAt: null,
  };

  const feedbackEvent: BetaEvent = {
    id: createId("event"),
    type: "feedback-saved",
    createdAt: entry.createdAt,
    sessionId: state.activeSessionId,
    journeyId: entry.journeyId,
    metadata: {
      clarity: entry.clarity,
      willingness: entry.willingness,
      usefulArea: entry.usefulArea,
    },
  };

  writeBetaState({
    ...state,
    feedback: [entry, ...state.feedback].slice(0, 50),
    events: [feedbackEvent, ...state.events].slice(0, 300),
    sessions: state.sessions.map((session) =>
      session.id === state.activeSessionId
        ? {
            ...session,
            feedbackId: entry.id,
            completedAt: new Date().toISOString(),
          }
        : session,
    ),
    activeSessionId: null,
  });

  return entry;
}

export function markFeedbackShared(feedbackId: string) {
  const state = readBetaState();
  const entry = state.feedback.find((feedback) => feedback.id === feedbackId);
  const now = new Date().toISOString();
  const event: BetaEvent = {
    id: createId("event"),
    type: "feedback-shared",
    createdAt: now,
    sessionId: null,
    journeyId: entry?.journeyId ?? null,
  };

  writeBetaState({
    ...state,
    milestones: Array.from(new Set([...state.milestones, "feedback-shared"])),
    events: [event, ...state.events].slice(0, 300),
    feedback: state.feedback.map((feedback) =>
      feedback.id === feedbackId ? { ...feedback, sharedAt: now } : feedback,
    ),
  });
}

export function buildFeedbackShareText(entry: BetaFeedbackEntry) {
  const usefulLabels: Record<BetaFeedbackEntry["usefulArea"], string> = {
    mission: "Missione di oggi",
    documents: "Checklist documenti",
    vault: "Archivio locale",
    pilot: "Pilot OS",
    dashboard: "Dashboard",
    wizard: "Creazione del percorso",
    other: "Altro",
  };
  const willingnessLabels: Record<BetaFeedbackEntry["willingness"], string> = {
    yes: "Sì",
    maybe: "Forse",
    no: "No",
  };

  return [
    "FEEDBACK CASAPILOT BETA TEST FLIGHT",
    `Chiarezza: ${entry.clarity}/5`,
    `Parte più utile: ${usefulLabels[entry.usefulArea]}`,
    `Pagherebbe per continuare: ${willingnessLabels[entry.willingness]}`,
    `Parte poco chiara: ${entry.confusingPart.trim() || "Nessuna indicata"}`,
    `Commento: ${entry.comment.trim() || "Nessun commento"}`,
    `Pratica: ${entry.journeyId ?? "non indicata"}`,
    `Data: ${new Date(entry.createdAt).toLocaleString("it-IT")}`,
  ].join("\n");
}

export function subscribeToBetaStateChanges(callback: () => void) {
  if (!isBrowser()) return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === BETA_STATE_STORAGE_KEY ||
      event.key === LEGACY_BETA_STATE_STORAGE_KEY
    ) {
      callback();
    }
  };

  window.addEventListener(BETA_STATE_CHANGE_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(BETA_STATE_CHANGE_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}
