import { getRequiredDocuments } from "@/lib/property-journey/constants";
import type {
  OperationType,
  PropertyJourney,
  WizardData,
} from "@/lib/property-journey/types";

export type GoalPhaseWeights = {
  setup: number;
  documents: number;
  preparation: number;
  market: number;
  closing: number;
};

const SALE_WEIGHTS: GoalPhaseWeights = {
  setup: 12,
  documents: 38,
  preparation: 18,
  market: 14,
  closing: 18,
};

const RENT_WEIGHTS: GoalPhaseWeights = {
  setup: 12,
  documents: 33,
  preparation: 20,
  market: 15,
  closing: 20,
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function getGoalPhaseWeights(
  operation: OperationType | "",
): GoalPhaseWeights {
  return operation && operation !== "sale" ? RENT_WEIGHTS : SALE_WEIGHTS;
}

export function calculateSetupCompletion(
  data: Pick<
    WizardData,
    | "propertyName"
    | "surface"
    | "occupancy"
    | "country"
    | "city"
    | "province"
    | "address"
    | "postalCode"
    | "latitude"
    | "longitude"
    | "locationVerified"
  >,
) {
  const facts = [
    { done: hasText(data.propertyName), weight: 1 },
    { done: hasText(data.surface) && Number(data.surface) > 0, weight: 1.5 },
    { done: Boolean(data.occupancy), weight: 1 },
    {
      done:
        hasText(data.country) && hasText(data.city) && hasText(data.province),
      weight: 1.5,
    },
    {
      done: hasText(data.address) && hasText(data.postalCode),
      weight: 1.5,
    },
    {
      done:
        data.locationVerified &&
        typeof data.latitude === "number" &&
        typeof data.longitude === "number",
      weight: 2,
    },
  ];

  const totalWeight = facts.reduce((sum, fact) => sum + fact.weight, 0);
  const completedWeight = facts
    .filter((fact) => fact.done)
    .reduce((sum, fact) => sum + fact.weight, 0);

  return clamp((completedWeight / totalWeight) * 100);
}

export function calculateDocumentCompletion(
  data: Pick<
    WizardData,
    | "operation"
    | "propertyType"
    | "documents"
    | "cadastralSheet"
    | "cadastralParcel"
    | "cadastralSubaltern"
  >,
) {
  const requiredDocuments = getRequiredDocuments(
    data.operation,
    data.propertyType,
  );

  const totalWeight = requiredDocuments.reduce(
    (sum, document) => sum + document.weight,
    0,
  );

  const availableWeight = requiredDocuments
    .filter((document) => data.documents.includes(document.id))
    .reduce((sum, document) => sum + document.weight, 0);
  const documentCompletion = totalWeight
    ? (availableWeight / totalWeight) * 100
    : 0;
  const cadastralFacts = [
    hasText(data.cadastralSheet),
    hasText(data.cadastralParcel),
    hasText(data.cadastralSubaltern),
  ];
  const cadastralCompletion =
    (cadastralFacts.filter(Boolean).length / cadastralFacts.length) * 100;

  // I documenti determinano il 90% della fase; i riferimenti catastali il 10%.
  // In questo modo i campi catastali sono importanti ma non bloccano l’avvio.
  return clamp(documentCompletion * 0.9 + cadastralCompletion * 0.1);
}

export function calculateBaseGoalProgress(data: WizardData) {
  const weights = getGoalPhaseWeights(data.operation);
  const setup = calculateSetupCompletion(data);
  const documents = calculateDocumentCompletion(data);

  return Math.round(
    (setup / 100) * weights.setup +
      (documents / 100) * weights.documents,
  );
}

export function journeyProgressData(journey: PropertyJourney): WizardData {
  return {
    operation: journey.operation,
    propertyType: journey.property.type,
    propertyName: journey.property.name,
    surface: journey.property.surface?.toString() ?? "",
    occupancy: journey.property.occupancy ?? "",
    country: journey.property.country,
    city: journey.property.city,
    province: journey.property.province,
    address: journey.property.address,
    postalCode: journey.property.postalCode,
    cadastralSheet: journey.property.cadastralSheet ?? "",
    cadastralParcel: journey.property.cadastralParcel ?? "",
    cadastralSubaltern: journey.property.cadastralSubaltern ?? "",
    latitude: journey.property.latitude ?? null,
    longitude: journey.property.longitude ?? null,
    locationVerified: journey.property.locationVerified ?? false,
    locationVerifiedAt: journey.property.locationVerifiedAt ?? "",
    locationLabel: journey.property.locationLabel ?? "",
    documents: journey.documents,
  };
}
