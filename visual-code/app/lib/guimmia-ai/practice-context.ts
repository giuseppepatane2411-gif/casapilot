import type { SiteOrchestrationRequest } from "@/lib/guimmia/site-orchestration/types";
import type {
  OperationType,
  PropertyJourney,
} from "@/lib/property-journey/types";

const operationMap: Record<
  OperationType,
  NonNullable<SiteOrchestrationRequest["operationType"]>
> = {
  sale: "SALE",
  rent: "RENT_LONG_TERM",
  rent_long_term: "RENT_LONG_TERM",
  rent_transitory: "RENT_TRANSITORY",
  rent_student: "RENT_STUDENT",
  rent_room: "RENT_LONG_TERM",
  rent_tourist_short: "RENT_TOURIST_SHORT",
};

export function practiceToAssistantCase(
  journey: PropertyJourney,
): SiteOrchestrationRequest {
  const operationType = operationMap[journey.operation];

  return {
    caseId: journey.id,
    caseVersion: journey.version,
    operationType,
    customerRole: operationType === "SALE" ? "SELLER" : "LANDLORD",
    confidence: 0.98,
    property: {
      id: journey.id,
      type: journey.property.type,
      country: journey.property.country,
      city: journey.property.city,
      province: journey.property.province,
      locationVerified: journey.property.locationVerified,
      documents: journey.documents,
    },
    progress: {
      currentPhase: "PROPERTY_READINESS",
      completedActionCodes: [],
    },
  };
}

export function practiceLabel(journey: PropertyJourney) {
  const place = [journey.property.city, journey.property.province]
    .filter(Boolean)
    .join(" · ");
  return place
    ? `${journey.property.name} · ${place}`
    : journey.property.name;
}
