import type { DocumentKey, PropertyJourney } from "@/lib/property-journey/types";

export type PilotPriority = "critical" | "high" | "medium" | "low";

export type PilotMissionCategory =
  | "profile"
  | "documents"
  | "marketing"
  | "verification"
  | "strategy";

export type PilotMission = {
  id: string;
  title: string;
  description: string;
  reason: string;
  estimatedMinutes: number;
  scoreGain: number;
  priority: PilotPriority;
  category: PilotMissionCategory;
  href: string;
  documentId?: DocumentKey;
  completed: boolean;
  actionLabel: string;
};

export type PilotRecommendation = {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: "documents" | "marketing" | "strategy" | "property";
  actionLabel?: string;
  href?: string;
};

export type PilotTimelineEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "created" | "document" | "milestone" | "mission" | "conversation";
};

export type PilotRisk = {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
};

export type PilotReadiness = {
  overall: number;
  data: number;
  documents: number;
  execution: number;
  label: string;
};

export type PilotMessageRole = "assistant" | "user";

export type PilotMessage = {
  id: string;
  role: PilotMessageRole;
  content: string;
  createdAt: string;
};

export type JourneyPilotMemory = {
  version: 2;
  journeyId: string;
  completedMissionIds: string[];
  dismissedRecommendationIds: string[];
  timelineEvents: PilotTimelineEvent[];
  messages: PilotMessage[];
  lastOpenedAt: string;
};

export type PilotContext = {
  journey: PropertyJourney;
  mission: PilotMission;
  missionQueue: PilotMission[];
  recommendations: PilotRecommendation[];
  timeline: PilotTimelineEvent[];
  missingInformation: string[];
  knownFacts: number;
  summary: string;
  readiness: PilotReadiness;
  risks: PilotRisk[];
  memory: JourneyPilotMemory;
};
