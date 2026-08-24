export type DecisionLevel = "AUTO" | "REVIEW" | "AGENT_REQUIRED" | "PROFESSIONAL_REQUIRED";
export type KnowledgeStability = "STABLE" | "DYNAMIC" | "INTERNAL";
export type Severity = "info" | "warning" | "blocking" | "critical";
export type PhaseReadiness = "READY" | "REVIEW_REQUIRED" | "BLOCKED";
export type OperationType = "SALE" | "RENT_LONG_TERM" | "RENT_TRANSITORY" | "RENT_STUDENT" | "RENT_TOURIST_SHORT";
export type GateImpact =
  | "PUBLICATION" | "OFFER" | "PRELIMINARY" | "CLOSING"
  | "RENTAL_PUBLICATION" | "CANDIDATE_SELECTION" | "LEASE_SIGNING" | "LEASE_REGISTRATION" | "HANDOVER"
  | "TOURIST_PUBLICATION" | "BOOKING" | "CHECK_IN" | "GUEST_REPORTING" | "PAYOUT_TAX";

export type RuleCondition =
  | { op: "eq" | "neq"; path: string; value: unknown }
  | { op: "in" | "not_in"; path: string; values: unknown[] }
  | { op: "exists"; path: string }
  | { op: "truthy" | "falsy"; path: string }
  | { op: "gt" | "gte" | "lt" | "lte"; path: string; value: number }
  | { op: "all" | "any"; conditions: RuleCondition[] }
  | { op: "not"; condition: RuleCondition };

export interface SourceRef {
  sourceId: string;
  label: string;
  pages?: string;
  section?: string;
  sourceKind: "USER_MANUAL" | "OFFICIAL_LAW" | "OFFICIAL_GUIDANCE" | "INTERNAL_POLICY";
  normativeAuthority: boolean;
  url?: string;
  jurisdiction?: string;
  asOf?: string;
}

export interface FreshnessPolicy {
  required: boolean;
  maxAgeDays?: number;
  rulesetKey?: string;
}

export interface EvidencePolicy {
  requiredFactPaths?: string[];
  requireVerifiedEvidence?: boolean;
  acceptedProvenance?: Array<"USER_DECLARATION" | "DOCUMENT" | "OFFICIAL_SOURCE" | "AGENT" | "PROFESSIONAL" | "SYSTEM">;
}

export interface RuleOutcome {
  code: string;
  message: string;
  blockProgress?: boolean;
  suggestedActions?: string[];
  requiredFacts?: string[];
  escalationTo?: "AGENT" | "NOTARY" | "LAWYER" | "TECHNICIAN" | "ACCOUNTANT" | "BANK" | "OTHER";
  clientMessageKey?: string;
  gateImpact?: GateImpact[];
  professionalScope?: string[];
  reasonCodes?: string[];
}

export interface BrainRule {
  id: string;
  module: string;
  phase: string;
  title: string;
  description: string;
  stability: KnowledgeStability;
  decisionLevel: DecisionLevel;
  severity: Severity;
  condition: RuleCondition;
  outcome: RuleOutcome;
  sourceRefs: SourceRef[];
  freshnessPolicy?: FreshnessPolicy;
  evidencePolicy?: EvidencePolicy;
  active: boolean;
  version: number;
}

export interface FactEvidence {
  provenance: "USER_DECLARATION" | "DOCUMENT" | "OFFICIAL_SOURCE" | "AGENT" | "PROFESSIONAL" | "SYSTEM";
  sourceId?: string;
  documentId?: string;
  verified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  confidence?: number;
}

export interface BrainFact {
  path: string;
  value: unknown;
  capturedAt?: string;
  evidence?: FactEvidence[];
}

export interface LegalRulesetState {
  key: string;
  status: "CURRENT" | "STALE" | "MISSING";
  verifiedAt?: string;
  verifiedBy?: string;
  officialSources?: string[];
}

export interface BrainContext {
  facts: Record<string, unknown>;
  factRecords?: BrainFact[];
  legalRulesets?: Record<string, LegalRulesetState>;
  now?: string;
}

export interface RuleTrace {
  ruleId: string;
  matched: boolean;
  skipped: boolean;
  skipReason?: string;
  evaluatedCondition?: RuleCondition;
  factsRead: Record<string, unknown>;
}

export interface RuleHit {
  ruleId: string;
  module: string;
  phase: string;
  title: string;
  decisionLevel: DecisionLevel;
  severity: Severity;
  outcome: RuleOutcome;
  trace: RuleTrace;
  sourceRefs: SourceRef[];
}

export interface PhaseEvaluation {
  phase: string;
  readiness: PhaseReadiness;
  hits: RuleHit[];
  blockers: RuleHit[];
  reviews: RuleHit[];
  info: RuleHit[];
  summary: {
    totalRules: number;
    matchedRules: number;
    blockingRules: number;
    reviewRules: number;
  };
}

export interface WorkflowStepDefinition {
  id: string;
  phase: string;
  order: number;
  label: string;
  description: string;
  requiredFacts: string[];
  exitCriteria: string[];
  ruleIds: string[];
  clientProjection?: {
    title: string;
    description: string;
  };
}

export interface WorkflowDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  version: number;
  active: boolean;
  steps: WorkflowStepDefinition[];
}

export interface KnowledgeCard {
  code: string;
  module: string;
  title: string;
  summary: string;
  stability: KnowledgeStability;
  defaultDecisionLevel: DecisionLevel;
  trigger: string[];
  requiredFacts: string[];
  checks: string[];
  redFlags: string[];
  actions: string[];
  escalation?: string[];
  sourceRefs: SourceRef[];
  legalVerificationRequired: boolean;
  version: number;
}
