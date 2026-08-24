import type { BrainContext } from "../types";
import { DOCUMENT_REQUIREMENTS } from "./requirements";
import { documentTypeByCode } from "./catalog";
import { evaluateConditionTriState } from "./triState";
import type { Applicability, CaseDocumentVersionSnapshot, DossierAssessment, DossierAssessmentInput, DocumentRequirementDefinition, RequirementAssessment } from "./types";

function rulesetCurrent(context: BrainContext, key?: string): boolean | null {
  if (!key) return null;
  return context.legalRulesets?.[key]?.status === "CURRENT";
}

function applicabilityFor(req: DocumentRequirementDefinition, context: BrainContext): Applicability {
  if (!req.appliesWhen) return "APPLICABLE";
  const tri = evaluateConditionTriState(req.appliesWhen, context.facts);
  if (tri === "TRUE") return "APPLICABLE";
  if (tri === "FALSE") return "NOT_APPLICABLE";
  return "UNKNOWN";
}

function docEligible(doc: CaseDocumentVersionSnapshot) {
  return doc.isCurrent !== false && doc.status !== "SUPERSEDED" && doc.status !== "REJECTED" && doc.quality !== "UNREADABLE";
}

function satisfies(doc: CaseDocumentVersionSnapshot, policy: DocumentRequirementDefinition["exitPolicy"]): boolean {
  if (!docEligible(doc)) return false;
  if (policy === "OPTIONAL") return true;
  if (policy === "ROUTED") return ["REQUESTED","RECEIVED","PROCESSING","CLASSIFIED","EXTRACTED","REVIEW_REQUIRED","VERIFIED"].includes(doc.status);
  if (policy === "RECEIVED") return ["RECEIVED","PROCESSING","CLASSIFIED","EXTRACTED","REVIEW_REQUIRED","VERIFIED"].includes(doc.status);
  return doc.status === "VERIFIED";
}

export function assessRequirement(req: DocumentRequirementDefinition, input: DossierAssessmentInput): RequirementAssessment {
  const applicability = applicabilityFor(req, input.context);
  const current = rulesetCurrent(input.context, req.legalRulesetKey);
  const matches = input.documents.filter(d => d.documentCode === req.documentCode && docEligible(d));
  const state = input.requirementStateFingerprints?.[req.key];
  const stale = Boolean(state?.factsFingerprint && state.currentFactsFingerprint && state.factsFingerprint !== state.currentFactsFingerprint);

  if (applicability === "NOT_APPLICABLE") return { ...req, applicability, legalRulesetCurrent: current, satisfied: true, routed: true, stale, matchingVersionIds: matches.map(d=>d.id) };
  if (applicability === "UNKNOWN") return { ...req, applicability, legalRulesetCurrent: current, satisfied: false, routed: false, stale, matchingVersionIds: matches.map(d=>d.id), reasonCode: "APPLICABILITY_UNKNOWN" };
  if (req.legalRulesetKey && current !== true) return { ...req, applicability, legalRulesetCurrent: current, satisfied: false, routed: false, stale, matchingVersionIds: matches.map(d=>d.id), reasonCode: "LEGAL_RULESET_NOT_CURRENT" };

  const satisfied = matches.some(d => satisfies(d, req.exitPolicy));
  const routed = satisfied || (input.routedRequirementKeys ?? []).includes(req.key) || matches.some(d => d.status === "REQUESTED");
  return { ...req, applicability, legalRulesetCurrent: current, satisfied, routed, stale, matchingVersionIds: matches.map(d=>d.id) };
}

export function assessDocumentDossier(input: DossierAssessmentInput): DossierAssessment {
  const currentDocs = input.documents.filter(d => d.isCurrent !== false && d.status !== "SUPERSEDED");
  const requirements = DOCUMENT_REQUIREMENTS.map(req => assessRequirement(req, input));
  const blockers: string[] = [];
  const reviews: string[] = [];

  const unknown = requirements.filter(r => r.applicability === "UNKNOWN");
  if (unknown.length) reviews.push("REQUIREMENT_APPLICABILITY_UNKNOWN");
  if (requirements.some(r => r.stale)) blockers.push("REQUIREMENTS_STALE");
  if (requirements.some(r => r.applicability === "APPLICABLE" && r.legalRulesetKey && r.legalRulesetCurrent !== true)) blockers.push("LEGAL_RULESET_NOT_CURRENT");

  for (const req of requirements) {
    if (req.applicability !== "APPLICABLE") continue;
    if (req.exitPolicy === "OPTIONAL") continue;
    if (!req.satisfied && !req.routed) blockers.push(`UNROUTED:${req.key}`);
    else if (!req.satisfied) reviews.push(`PENDING:${req.key}`);
  }

  const openIssues = (input.issues ?? []).filter(i => i.status === "OPEN" || i.status === "IN_REVIEW");
  const critical = openIssues.filter(i => i.severity === "critical" || i.severity === "blocking");
  if (critical.length) blockers.push("OPEN_BLOCKING_CONFLICTS");
  else if (openIssues.length) reviews.push("OPEN_NON_BLOCKING_CONFLICTS");

  const unreadable = currentDocs.filter(d => d.quality === "UNREADABLE");
  if (unreadable.length) blockers.push("UNREADABLE_CURRENT_DOCUMENTS");
  const partial = currentDocs.filter(d => d.quality === "PARTIAL");
  if (partial.length) reviews.push("PARTIAL_DOCUMENTS");

  const lowConfidence = currentDocs.filter(d => d.extractionConfidence !== undefined && d.extractionConfidence < 0.85);
  if (lowConfidence.length) reviews.push("LOW_CONFIDENCE_EXTRACTIONS");
  const pendingReview = currentDocs.filter(d => d.status === "REVIEW_REQUIRED" || (d.extractionConfidence !== undefined && d.extractionConfidence < 0.85));

  const highPublic = currentDocs.filter(d => (d.sensitivity ?? documentTypeByCode.get(d.documentCode ?? "")?.sensitivity) === "HIGH" && d.storageVisibility === "PUBLIC");
  if (highPublic.length) blockers.push("HIGH_SENSITIVITY_PUBLIC_STORAGE");
  if (currentDocs.some(d => d.syntheticSource)) blockers.push("SYNTHETIC_SOURCE_USED_AS_EVIDENCE");
  if (currentDocs.some(d => d.processingError)) reviews.push("PROCESSING_ERRORS");
  if (currentDocs.some(d => d.status === "EXTRACTED" && !d.hasEvidenceAnchors)) reviews.push("EXTRACTION_WITHOUT_EVIDENCE_ANCHOR");

  const readiness: DossierAssessment["readiness"] = blockers.length ? "BLOCKED" : reviews.length ? "REVIEW_REQUIRED" : "READY";

  const factsPatch = {
    "documents.inventoryStatus": "INITIALIZED",
    "documents.requirementsStatus": "GENERATED",
    "documents.unroutedMissingCount": requirements.filter(r => r.applicability === "APPLICABLE" && !r.satisfied && !r.routed).length,
    "documents.unknownApplicabilityCount": unknown.length,
    "documents.openConflictCount": openIssues.length,
    "documents.criticalConflictCount": critical.length,
    "documents.unreadableCount": unreadable.length,
    "documents.pendingReviewCount": pendingReview.length,
    "documents.publicHighSensitivityCount": highPublic.length,
    "documents.requirementsStaleCount": requirements.filter(r => r.stale).length,
    "documents.dossierReadiness": readiness,
  };

  return {
    readiness,
    requirements,
    blockers: [...new Set(blockers)],
    reviews: [...new Set(reviews)],
    summary: {
      applicableRequirements: requirements.filter(r => r.applicability === "APPLICABLE").length,
      unknownRequirements: unknown.length,
      satisfiedRequirements: requirements.filter(r => r.applicability === "APPLICABLE" && r.satisfied).length,
      routedRequirements: requirements.filter(r => r.applicability === "APPLICABLE" && r.routed).length,
      currentDocuments: currentDocs.length,
      pendingReviews: pendingReview.length,
      openConflicts: openIssues.length,
      criticalConflicts: critical.length,
    },
    factsPatch,
  };
}
