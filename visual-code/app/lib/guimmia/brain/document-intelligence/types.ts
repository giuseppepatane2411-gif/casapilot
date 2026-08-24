import type { BrainContext, RuleCondition } from "../types";

export type DocumentSensitivity = "NORMAL" | "PERSONAL" | "HIGH";
export type DocumentCategory = "IDENTITY" | "MANDATE" | "TITLE" | "REGISTRY" | "CADASTRAL" | "URBAN" | "ENERGY" | "CONDOMINIUM" | "LEASE" | "FINANCE" | "COMPANY" | "TAX" | "MEDIA" | "OTHER";
export type DocumentLifecycleStatus = "EXPECTED" | "REQUESTED" | "RECEIVED" | "PROCESSING" | "CLASSIFIED" | "EXTRACTED" | "REVIEW_REQUIRED" | "VERIFIED" | "REJECTED" | "SUPERSEDED";
export type DocumentQuality = "UNKNOWN" | "GOOD" | "PARTIAL" | "UNREADABLE";
export type RequirementLevel = "CORE" | "CONDITIONAL" | "OPTIONAL" | "PROFESSIONAL";
export type RequirementExitPolicy = "ROUTED" | "RECEIVED" | "VERIFIED" | "OPTIONAL";
export type Applicability = "APPLICABLE" | "NOT_APPLICABLE" | "UNKNOWN";
export type ClaimStatus = "PROPOSED" | "REVIEW_REQUIRED" | "ACCEPTED" | "REJECTED" | "SUPERSEDED";

export interface DocumentTypeDefinition {
  code: string;
  label: string;
  category: DocumentCategory;
  sensitivity: DocumentSensitivity;
  extractionProfile?: string;
  description: string;
  criticalFactPaths?: string[];
}

export interface DocumentRequirementDefinition {
  key: string;
  documentCode: string;
  level: RequirementLevel;
  exitPolicy: RequirementExitPolicy;
  reason: string;
  appliesWhen?: RuleCondition;
  legalRulesetKey?: string;
  professionalType?: "AGENT" | "NOTARY" | "LAWYER" | "TECHNICIAN" | "ACCOUNTANT" | "BANK" | "OTHER";
}

export interface CaseDocumentVersionSnapshot {
  id: string;
  recordId: string;
  documentCode?: string;
  status: DocumentLifecycleStatus;
  quality: DocumentQuality;
  sha256?: string;
  perceptualFingerprint?: string;
  storageVisibility?: "PRIVATE" | "PUBLIC" | "UNKNOWN";
  sensitivity?: DocumentSensitivity;
  extractionConfidence?: number;
  hasEvidenceAnchors?: boolean;
  processingError?: boolean;
  syntheticSource?: boolean;
  isCurrent?: boolean;
  reviewed?: boolean;
}

export interface RequirementAssessment extends DocumentRequirementDefinition {
  applicability: Applicability;
  legalRulesetCurrent: boolean | null;
  satisfied: boolean;
  routed: boolean;
  stale: boolean;
  matchingVersionIds: string[];
  reasonCode?: string;
}

export interface DossierIssueSnapshot {
  id: string;
  severity: "info" | "warning" | "blocking" | "critical";
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";
  factPath?: string;
  kind: "CLAIM_CONFLICT" | "FACT_CONFLICT" | "SOURCE_CONFLICT" | "SECURITY" | "QUALITY" | "OTHER";
}

export interface DossierAssessment {
  readiness: "READY" | "REVIEW_REQUIRED" | "BLOCKED";
  requirements: RequirementAssessment[];
  blockers: string[];
  reviews: string[];
  summary: {
    applicableRequirements: number;
    unknownRequirements: number;
    satisfiedRequirements: number;
    routedRequirements: number;
    currentDocuments: number;
    pendingReviews: number;
    openConflicts: number;
    criticalConflicts: number;
  };
  factsPatch: Record<string, unknown>;
}

export interface DossierAssessmentInput {
  context: BrainContext;
  documents: CaseDocumentVersionSnapshot[];
  issues?: DossierIssueSnapshot[];
  routedRequirementKeys?: string[];
  requirementStateFingerprints?: Record<string, { factsFingerprint?: string; currentFactsFingerprint?: string }>;
}
