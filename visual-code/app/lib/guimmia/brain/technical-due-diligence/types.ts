import type { GateImpact, DecisionLevel, Severity } from "../types";

export type TechnicalSourceKind =
  | "OWNER_DECLARATION"
  | "TITLE_DEED"
  | "CADASTRAL_CURRENT"
  | "CADASTRAL_HISTORICAL"
  | "URBAN_TITLE"
  | "MUNICIPAL_RECORD"
  | "AGIBILITY_RECORD"
  | "PROFESSIONAL_OBSERVATION"
  | "PROFESSIONAL_SIGNED_REPORT"
  | "OFFICIAL_EXTERNAL_SOURCE"
  | "AI_INFERENCE";

export type SourceDomain =
  | "IDENTITY"
  | "CADASTRE"
  | "URBAN"
  | "PHYSICAL_STATE"
  | "AGIBILITY"
  | "USE"
  | "PROTECTED_PROPERTY"
  | "TRANSFER_FORMALITIES";

export type TechnicalComparisonResult = "MATCH" | "MISMATCH" | "PARTIAL" | "UNKNOWN" | "NOT_APPLICABLE";
export type TechnicalReviewStatus = "NOT_STARTED" | "COLLECTING" | "IN_REVIEW" | "PROFESSIONAL_REQUIRED" | "APPROVED" | "REJECTED" | "STALE";
export type RecordAccessStatus = "NOT_REQUIRED" | "TO_REQUEST" | "REQUESTED" | "PARTIAL" | "COMPLETE" | "FAILED" | "STALE";
export type SignoffStatus = "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED" | "STALE";
export type GateStatus = "NOT_EVALUATED" | "READY" | "REVIEW_REQUIRED" | "BLOCKED" | "STALE";
export type RiskStatus = "OPEN" | "MITIGATED" | "ACCEPTED" | "CLOSED" | "STALE";

export interface TechnicalSource {
  id: string;
  kind: TechnicalSourceKind;
  domain: SourceDomain;
  sourceId?: string;
  documentVersionId?: string;
  evidenceAnchorId?: string;
  observedAt?: string;
  issuedAt?: string;
  isCurrent?: boolean;
  verifiedByProfessional?: boolean;
}

export interface TechnicalValue<T = unknown> {
  path: string;
  value: T;
  source: TechnicalSource;
  confidence?: number;
}

export interface TechnicalComparison {
  key: string;
  left?: TechnicalValue;
  right?: TechnicalValue;
  result: TechnicalComparisonResult;
  materiality: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  requiresProfessionalInterpretation: boolean;
  notes?: string;
}

export interface TechnicalTimelineEvent {
  id: string;
  eventType: "CONSTRUCTION" | "URBAN_TITLE" | "VARIANT" | "WORKS" | "CHANGE_OF_USE" | "SANATORIA" | "CONDONO" | "AGIBILITY" | "CADASTRAL_UPDATE" | "OTHER";
  eventDate?: string;
  sourceIds: string[];
  status: "DECLARED" | "DOCUMENTED" | "VERIFIED" | "UNKNOWN";
  details?: Record<string, unknown>;
}

export interface TechnicalFinding {
  code: string;
  title: string;
  severity: Severity;
  decisionLevel: Exclude<DecisionLevel, "AUTO">;
  gateImpact: GateImpact[];
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED" | "STALE";
  sourceIds: string[];
  evidenceIds: string[];
  reasonCodes: string[];
  professionalRole?: "TECHNICIAN" | "NOTARY" | "LAWYER" | "OTHER";
  notes?: string;
}

export interface ProfessionalReviewScope {
  reasonCodes: string[];
  requestedChecks: string[];
  sourceIds: string[];
  documentVersionIds: string[];
  outputRequirements: string[];
  legalRulesetKeys?: string[];
}

export interface TechnicalGateInput {
  gate: GateImpact;
  dossierReady: boolean;
  scopeLocked: boolean;
  sourceMapComplete: boolean;
  timelineReviewed: boolean;
  recordAccessStatus: RecordAccessStatus;
  comparisonsComplete: boolean;
  blockingFindings: number;
  criticalFindings: number;
  staleFindings: number;
  professionalRequired: boolean;
  professionalSignoffStatus: SignoffStatus;
  legalFreshnessBlocked: boolean;
  snapshotCurrent: boolean;
}

export interface TechnicalGateDecision {
  gate: GateImpact;
  status: GateStatus;
  reasons: string[];
  decidedBy: "SYSTEM_POLICY";
}

export interface RiskItem {
  code: string;
  title: string;
  severity: Severity;
  status: RiskStatus;
  gateImpact: GateImpact[];
  ownerRole: "AGENT" | "TECHNICIAN" | "NOTARY" | "LAWYER" | "OTHER";
  findingIds: string[];
  mitigation?: string;
}

export interface AgentTechnicalMemo {
  caseId: string;
  generatedAt: string;
  overallStatus: GateStatus;
  keyFacts: string[];
  openFindings: string[];
  professionalActions: string[];
  gateSummary: Record<GateImpact, GateStatus>;
  disclaimer: string;
}
