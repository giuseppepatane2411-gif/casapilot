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
  rentalAuthority: 92,
  transitoryReasonEvidence: 88,
  studentEnrollment: 88,
  guarantorEvidence: 84,
  touristUnitCompliance: 96,
  touristLocalRules: 94,
  touristGuestReporting: 86,
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
  rentalAuthority: 10,
  transitoryReasonEvidence: 15,
  studentEnrollment: 10,
  guarantorEvidence: 15,
  touristUnitCompliance: 20,
  touristLocalRules: 20,
  touristGuestReporting: 15,
};

export function getOperationGoal(operation: OperationType) {
  const goals: Record<OperationType, string> = {
    sale: "preparare l’immobile per una vendita ordinata e verificabile",
    rent: "definire il tipo di affitto e preparare una locazione ben documentata",
    rent_long_term: "preparare una locazione residenziale stabile e ben documentata",
    rent_transitory: "verificare l’esigenza temporanea e preparare la locazione transitoria",
    rent_student: "preparare immobile, requisiti e garanzie per la locazione a studenti",
    rent_room: "preparare stanza, convivenza, candidati e contratto per l’affitto di una camera",
    rent_tourist_short: "preparare conformità, annuncio e gestione del soggiorno turistico",
  };

  return goals[operation];
}
