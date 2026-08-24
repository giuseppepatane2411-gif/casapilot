import type { DossierAssessment } from "./types";

export interface ClientDossierProjection {
  status: "IN_RACCOLTA" | "IN_VERIFICA" | "COMPLETO_PER_PROSEGUIRE";
  missingLabels: string[];
  message: string;
}

export function projectDossierForClient(assessment: DossierAssessment): ClientDossierProjection {
  const missing = assessment.requirements.filter(r => r.applicability === "APPLICABLE" && !r.satisfied).map(r => r.documentCode);
  if (assessment.readiness === "READY") return { status: "COMPLETO_PER_PROSEGUIRE", missingLabels: [], message: "Il fascicolo documentale è organizzato e può passare alle verifiche successive." };
  if (assessment.readiness === "BLOCKED") return { status: "IN_RACCOLTA", missingLabels: missing, message: "Stiamo completando alcuni documenti o verifiche interne prima di proseguire." };
  return { status: "IN_VERIFICA", missingLabels: missing, message: "Il fascicolo è in verifica da parte del team Guimmia." };
}
