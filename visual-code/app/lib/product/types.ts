import type { JourneyPilotMemory } from "@/lib/pilot-os/types";
import type { PropertyJourney, WizardDraft } from "@/lib/property-journey/types";

export type ProductMilestone =
  | "journey-created"
  | "pilot-opened"
  | "mission-completed"
  | "vault-used";

export type ProductEventType =
  | "journey-created"
  | "pilot-opened"
  | "mission-completed"
  | "vault-file-added";

export type ProductEvent = {
  id: string;
  type: ProductEventType;
  createdAt: string;
  journeyId: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export type ProductState = {
  version: 1;
  milestones: ProductMilestone[];
  events: ProductEvent[];
};

export type GuimmiaBackup = {
  version: 4;
  product: "Guimmia";
  release: "casapilot-1.0";
  exportedAt: string;
  activeJourneyId: string | null;
  journeys: PropertyJourney[];
  wizardDraft: WizardDraft | null;
  pilotMemory: Record<string, JourneyPilotMemory>;
  productState: ProductState;
};
