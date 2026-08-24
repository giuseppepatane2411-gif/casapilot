import type { TechnicalGateDecision, TechnicalGateInput } from "./types";

export function evaluateTechnicalGate(input: TechnicalGateInput): TechnicalGateDecision {
  const reasons: string[] = [];
  if (!input.dossierReady) reasons.push("P03_DOSSIER_NOT_READY");
  if (!input.scopeLocked) reasons.push("TECH_SCOPE_NOT_LOCKED");
  if (!input.sourceMapComplete) reasons.push("SOURCE_MAP_INCOMPLETE");
  if (!input.timelineReviewed) reasons.push("TECH_TIMELINE_NOT_REVIEWED");
  if (["TO_REQUEST","REQUESTED","PARTIAL","FAILED","STALE"].includes(input.recordAccessStatus)) reasons.push(`RECORD_ACCESS_${input.recordAccessStatus}`);
  if (!input.comparisonsComplete) reasons.push("COMPARISONS_INCOMPLETE");
  if (input.blockingFindings>0) reasons.push("BLOCKING_FINDINGS_OPEN");
  if (input.criticalFindings>0) reasons.push("CRITICAL_FINDINGS_OPEN");
  if (input.staleFindings>0) reasons.push("STALE_FINDINGS");
  if (input.professionalRequired && input.professionalSignoffStatus!=="APPROVED") reasons.push("PROFESSIONAL_SIGNOFF_REQUIRED");
  if (["REJECTED","STALE"].includes(input.professionalSignoffStatus)) reasons.push(`SIGNOFF_${input.professionalSignoffStatus}`);
  if (input.legalFreshnessBlocked) reasons.push("LEGAL_RULESET_NOT_CURRENT");
  if (!input.snapshotCurrent) reasons.push("TECH_SNAPSHOT_NOT_CURRENT");

  const hard = reasons.some(r => [
    "P03_DOSSIER_NOT_READY","TECH_SCOPE_NOT_LOCKED","BLOCKING_FINDINGS_OPEN","CRITICAL_FINDINGS_OPEN",
    "PROFESSIONAL_SIGNOFF_REQUIRED","SIGNOFF_REJECTED","SIGNOFF_STALE","LEGAL_RULESET_NOT_CURRENT"
  ].includes(r));

  return {
    gate: input.gate,
    status: hard ? "BLOCKED" : reasons.length ? "REVIEW_REQUIRED" : "READY",
    reasons,
    decidedBy: "SYSTEM_POLICY",
  };
}

export const GATE_POLICY = {
  PUBLICATION: {
    purpose: "Policy interna prima della pubblicazione marketing.",
    mustNotMean: "Non equivale a certificazione legale/tecnica di commerciabilità.",
  },
  OFFER: {
    purpose: "Policy interna prima di trattare/raccogliere una proposta.",
    mustNotMean: "Non sostituisce il giudizio dell'agente o del professionista.",
  },
  PRELIMINARY: {
    purpose: "Policy interna prima del preliminare.",
    mustNotMean: "Non sostituisce notaio/avvocato/tecnico quando richiesti.",
  },
  CLOSING: {
    purpose: "Policy interna di readiness verso rogito.",
    mustNotMean: "Non è un nulla-osta notarile.",
  },
} as const;
