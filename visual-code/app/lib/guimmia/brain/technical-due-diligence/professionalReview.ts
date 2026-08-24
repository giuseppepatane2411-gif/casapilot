import type { ProfessionalReviewScope, TechnicalFinding } from "./types";

export function buildProfessionalReviewScope(findings: TechnicalFinding[]): ProfessionalReviewScope {
  const open = findings.filter(f=>["OPEN","IN_REVIEW","STALE"].includes(f.status) && f.decisionLevel==="PROFESSIONAL_REQUIRED");
  const reasonCodes = [...new Set(open.flatMap(f=>f.reasonCodes))];
  const sourceIds = [...new Set(open.flatMap(f=>f.sourceIds))];
  return {
    reasonCodes,
    requestedChecks: open.map(f=>`Verificare: ${f.title}`),
    sourceIds,
    documentVersionIds: [],
    outputRequirements: [
      "Esito per ciascun finding assegnato",
      "Evidenze/documenti utilizzati",
      "Limitazioni della verifica",
      "Data e identità del professionista",
      "Fingerprint degli input esaminati",
    ],
  };
}

export function professionalReviewRequired(findings: TechnicalFinding[]): boolean {
  return findings.some(f => f.decisionLevel==="PROFESSIONAL_REQUIRED" && ["OPEN","IN_REVIEW","STALE"].includes(f.status));
}
