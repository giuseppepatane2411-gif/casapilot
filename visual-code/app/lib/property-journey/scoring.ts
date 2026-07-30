import {
  DOCUMENT_DEFINITIONS,
  getRequiredDocuments,
} from "@/lib/property-journey/constants";
import type {
  DocumentKey,
  JourneyMission,
  PropertyJourney,
  WizardData,
} from "@/lib/property-journey/types";

const PROFILE_SCORE_MAX = 45;
const DOCUMENT_SCORE_MAX = 55;
const FUTURE_ACTIVITIES = 5;

function hasText(value: string) {
  return value.trim().length > 0;
}

export function calculateWizardHealthScore(data: WizardData) {
  let profileScore = 0;

  if (data.operation) profileScore += 5;
  if (data.propertyType) profileScore += 6;
  if (hasText(data.propertyName)) profileScore += 3;
  if (hasText(data.surface)) profileScore += 5;
  if (data.occupancy) profileScore += 4;
  if (hasText(data.country)) profileScore += 3;
  if (hasText(data.city)) profileScore += 4;
  if (hasText(data.province)) profileScore += 3;
  if (hasText(data.address)) profileScore += 8;
  if (hasText(data.postalCode)) profileScore += 4;

  const requiredDocuments = getRequiredDocuments(
    data.operation,
    data.propertyType,
  );

  const totalDocumentWeight = requiredDocuments.reduce(
    (total, document) => total + document.weight,
    0,
  );

  const availableDocumentWeight = requiredDocuments
    .filter((document) => data.documents.includes(document.id))
    .reduce((total, document) => total + document.weight, 0);

  const documentScore = totalDocumentWeight
    ? Math.round(
        (availableDocumentWeight / totalDocumentWeight) * DOCUMENT_SCORE_MAX,
      )
    : 0;

  return Math.min(
    100,
    Math.round(
      (profileScore / PROFILE_SCORE_MAX) * PROFILE_SCORE_MAX + documentScore,
    ),
  );
}

export function calculateJourneyMetrics(data: WizardData) {
  const requiredDocuments = getRequiredDocuments(
    data.operation,
    data.propertyType,
  );

  const profileMilestones = [
    Boolean(data.operation),
    Boolean(data.propertyType),
    hasText(data.propertyName),
    hasText(data.surface),
    Boolean(data.occupancy),
    hasText(data.city) && hasText(data.province) && hasText(data.country),
    hasText(data.address),
  ];

  const completedProfileMilestones = profileMilestones.filter(Boolean).length;
  const completedDocuments = requiredDocuments.filter((document) =>
    data.documents.includes(document.id),
  ).length;

  const totalActivities =
    profileMilestones.length + requiredDocuments.length + FUTURE_ACTIVITIES;
  const completedActivities =
    completedProfileMilestones + completedDocuments;

  return {
    healthScore: calculateWizardHealthScore(data),
    progress: Math.min(
      100,
      Math.round((completedActivities / totalActivities) * 100),
    ),
    completedActivities,
    totalActivities,
  };
}

export function journeyToWizardData(journey: PropertyJourney): WizardData {
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
    documents: journey.documents,
  };
}

export function getMissingDocuments(journey: PropertyJourney) {
  const requiredDocuments = getRequiredDocuments(
    journey.operation,
    journey.property.type,
  );

  return requiredDocuments.filter(
    (document) => !journey.documents.includes(document.id),
  );
}

export function getJourneyMission(journey: PropertyJourney): JourneyMission {
  const missingDocument = getMissingDocuments(journey)[0];

  if (missingDocument) {
    const requiredDocuments = getRequiredDocuments(
      journey.operation,
      journey.property.type,
    );
    const totalWeight = requiredDocuments.reduce(
      (total, document) => total + document.weight,
      0,
    );
    const scoreGain = Math.max(
      4,
      Math.round((missingDocument.weight / totalWeight) * DOCUMENT_SCORE_MAX),
    );

    return {
      title: `Recupera ${missingDocument.shortTitle}`,
      description: `${missingDocument.description} Segnalo come disponibile appena lo hai.` ,
      time: "Circa 3 minuti",
      scoreGain,
      href: `/dashboard/properties/${journey.id}#documents`,
    };
  }

  return {
    title: "Prepara il materiale per l’annuncio",
    description:
      "La checklist iniziale è completa. Il prossimo passo è raccogliere foto e informazioni da mostrare agli interessati.",
    time: "Circa 15 minuti",
    scoreGain: 5,
    href: `/dashboard/properties/${journey.id}`,
  };
}

export function filterDocumentsForJourney(
  documents: DocumentKey[],
  data: Pick<WizardData, "operation" | "propertyType">,
) {
  const validIds = new Set(
    getRequiredDocuments(data.operation, data.propertyType).map(
      (document) => document.id,
    ),
  );

  return documents.filter((document) => validIds.has(document));
}

export function getDocumentDefinition(documentId: DocumentKey) {
  return DOCUMENT_DEFINITIONS.find((document) => document.id === documentId);
}
