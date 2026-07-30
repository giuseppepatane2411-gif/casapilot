import type { DocumentKey, OperationType } from "@/lib/property-journey/types";

export const DOCUMENT_PRIORITY: Record<DocumentKey, number> = {
  ownership: 100,
  cadastralPlan: 95,
  cadastralSurvey: 90,
  energyCertificate: 85,
  urbanCompliance: 82,
  habitability: 72,
  systems: 62,
  condominium: 58,
  leaseTemplate: 55,
};

export const DOCUMENT_TIME_MINUTES: Record<DocumentKey, number> = {
  ownership: 10,
  cadastralPlan: 8,
  cadastralSurvey: 8,
  energyCertificate: 12,
  habitability: 15,
  systems: 12,
  condominium: 7,
  urbanCompliance: 15,
  leaseTemplate: 20,
};

export function getOperationGoal(operation: OperationType) {
  return operation === "sale"
    ? "preparare l’immobile per una vendita ordinata e verificabile"
    : "preparare l’immobile per una locazione sicura e ben documentata";
}
