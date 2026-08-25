import type {
  SiteOrchestrationRequest,
  SiteOrchestrationResponse,
} from "@/lib/guimmia/site-orchestration/types";

export const GUIMMIA_BRAIN_REQUEST_KINDS = [
  "GUIDANCE",
  "DOCUMENT_CHECK",
  "NEXT_ACTION",
  "COMMUNICATION_DRAFT",
] as const;

export type GuimmiaBrainRequestKind =
  (typeof GUIMMIA_BRAIN_REQUEST_KINDS)[number];

export type GuimmiaBrainConversationMessage = {
  role: "user" | "assistant";
  text: string;
};

export type GuimmiaBrainRequest = {
  question: string;
  requestKind?: GuimmiaBrainRequestKind;
  case: SiteOrchestrationRequest;
  conversation?: GuimmiaBrainConversationMessage[];
};

export type GuimmiaBrainReferenceType = "RULE" | "CARD" | "WORKFLOW";

export type GuimmiaBrainKnowledgeReference = {
  type: GuimmiaBrainReferenceType;
  code: string;
  title: string;
  module: string;
  decisionLevel?: string;
  stability?: string;
  humanReviewRequired: boolean;
};

export type GuimmiaBrainRetrievedRule = {
  code: string;
  module: string;
  phase: string;
  title: string;
  description: string;
  decisionLevel: string;
  severity: string;
  outcome: {
    message: string;
    blockProgress: boolean;
    suggestedActions: string[];
    escalationTo: string | null;
  };
  sourceLabels: string[];
};

export type GuimmiaBrainRetrievedCard = {
  code: string;
  module: string;
  title: string;
  summary: string;
  stability: string;
  decisionLevel: string;
  requiredFacts: string[];
  checks: string[];
  redFlags: string[];
  actions: string[];
  escalation: string[];
  legalVerificationRequired: boolean;
  sourceLabels: string[];
};

export type GuimmiaBrainRetrievalContext = {
  brainVersion: "77.4.0";
  operationType: string;
  workflow: {
    code: string;
    title: string;
    version: number;
  };
  stage: {
    code: string;
    title: string;
    gate: string;
    requiredFactPaths: string[];
  };
  rules: GuimmiaBrainRetrievedRule[];
  cards: GuimmiaBrainRetrievedCard[];
  references: GuimmiaBrainKnowledgeReference[];
  catalogStats: {
    totalRules: number;
    totalKnowledgeCards: number;
    totalWorkflows: number;
    rulesSelected: number;
    cardsSelected: number;
  };
};

export type GuimmiaBrainAnswer = {
  title: string;
  reply: string;
  nextAction: string;
  nextActionOwner: "CUSTOMER" | "GUIMMIA" | "PROFESSIONAL" | "NONE";
  followUpQuestions: string[];
  missingDocuments: string[];
  warnings: string[];
  handoffRequired: boolean;
  handoffReason: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  references: GuimmiaBrainKnowledgeReference[];
};

export type GuimmiaBrainUsage = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
};

export type GuimmiaBrainSuccess = {
  ok: true;
  interactionId: string;
  auditSaved: boolean;
  cacheHit: boolean;
  mode: "DRY_RUN";
  model: "gpt-5.6-luna";
  requestKind: GuimmiaBrainRequestKind;
  orchestration: SiteOrchestrationResponse;
  answer: GuimmiaBrainAnswer;
  usage: GuimmiaBrainUsage;
  knowledge: GuimmiaBrainRetrievalContext["catalogStats"] & {
    workflow: string;
    stage: string;
  };
  safety: {
    deterministicDecisionFirst: true;
    executionPerformed: false;
    humanAuthorityPreserved: true;
    personalContactDataSentToModel: false;
    outputAuthorityGuardPassed: true;
  };
};

export type GuimmiaBrainError = {
  ok: false;
  error:
    | "invalid_request"
    | "authentication_required"
    | "openai_not_configured"
    | "database_not_configured"
    | "request_limit_reached"
    | "budget_limit_reached"
    | "brain_guidance_failed";
  message: string;
};
