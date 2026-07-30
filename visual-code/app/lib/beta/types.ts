import type { PropertyJourney, WizardDraft } from "@/lib/property-journey/types";
import type { JourneyPilotMemory } from "@/lib/pilot-os/types";

export type BetaMilestone =
  | "journey-created"
  | "pilot-opened"
  | "mission-completed"
  | "vault-used"
  | "feedback-shared";

export type BetaScenario = "sale" | "rent" | "inheritance";

export type BetaUsefulArea =
  | "mission"
  | "documents"
  | "vault"
  | "pilot"
  | "dashboard"
  | "wizard"
  | "other";

export type BetaWillingness = "yes" | "maybe" | "no";

export type BetaEventType =
  | "session-started"
  | "scenario-opened"
  | "journey-created"
  | "pilot-opened"
  | "mission-completed"
  | "vault-file-added"
  | "feedback-saved"
  | "feedback-shared";

export type BetaEvent = {
  id: string;
  type: BetaEventType;
  createdAt: string;
  sessionId: string | null;
  journeyId: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export type BetaTestSession = {
  id: string;
  scenario: BetaScenario;
  startedAt: string;
  completedAt: string | null;
  journeyId: string | null;
  feedbackId: string | null;
};

export type BetaFeedbackEntry = {
  id: string;
  createdAt: string;
  journeyId: string | null;
  clarity: 1 | 2 | 3 | 4 | 5;
  usefulArea: BetaUsefulArea;
  willingness: BetaWillingness;
  confusingPart: string;
  comment: string;
  sharedAt: string | null;
};

export type BetaState = {
  version: 2;
  onboardingDismissed: boolean;
  demoCreatedAt: string | null;
  milestones: BetaMilestone[];
  feedback: BetaFeedbackEntry[];
  activeSessionId: string | null;
  sessions: BetaTestSession[];
  events: BetaEvent[];
};

export type CasaPilotBackup = {
  version: 3;
  product: "CasaPilot";
  release: "beta-zero-cost-v2-test-flight";
  exportedAt: string;
  activeJourneyId: string | null;
  journeys: PropertyJourney[];
  wizardDraft: WizardDraft | null;
  pilotMemory: Record<string, JourneyPilotMemory>;
  betaState: BetaState;
};
