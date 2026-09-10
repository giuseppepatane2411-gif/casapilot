import {
  INITIAL_ROOM_RENTAL_DATA,
  INITIAL_WIZARD_DATA,
  getPropertyLabel,
} from "@/lib/property-journey/constants";
import {
  calculateJourneyMetrics,
  journeyToWizardData,
} from "@/lib/property-journey/scoring";
import type {
  DocumentKey,
  OccupancyStatus,
  OperationType,
  PropertyJourney,
  PropertyType,
  RoomRentalData,
  WizardData,
} from "@/lib/property-journey/types";

const OPERATIONS: OperationType[] = [
  "sale",
  "rent",
  "rent_long_term",
  "rent_transitory",
  "rent_student",
  "rent_room",
  "rent_tourist_short",
];

const PROPERTY_TYPES: PropertyType[] = [
  "apartment",
  "house",
  "commercial",
  "land",
  "garage",
  "room",
];

const OCCUPANCY_STATUSES: OccupancyStatus[] = [
  "free",
  "owner",
  "tenant",
  "other",
];

const DOCUMENT_KEYS: DocumentKey[] = [
  "ownership",
  "cadastralPlan",
  "cadastralSurvey",
  "energyCertificate",
  "habitability",
  "systems",
  "condominium",
  "urbanCompliance",
  "leaseTemplate",
  "rentalAuthority",
  "transitoryReasonEvidence",
  "studentEnrollment",
  "guarantorEvidence",
  "touristUnitCompliance",
  "touristLocalRules",
  "touristGuestReporting",
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function safeText(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function safeIsoDate(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : fallback;
}

function normalizeRoomRental(value: unknown): RoomRentalData {
  const room = objectValue(value) ?? {};
  const acceptedProfiles = Array.isArray(room.acceptedOccupantProfiles)
    ? room.acceptedOccupantProfiles.filter(
        (item): item is "student" | "worker" =>
          item === "student" || item === "worker",
      )
    : [];

  return {
    ...INITIAL_ROOM_RENTAL_DATA,
    roomType:
      room.roomType === "single" ||
      room.roomType === "double" ||
      room.roomType === "shared"
        ? room.roomType
        : "",
    roomSurface: safeText(room.roomSurface, 20),
    privateBathroom: room.privateBathroom === true,
    roomFurnished: room.roomFurnished === true,
    currentRoommates: safeText(room.currentRoommates, 10),
    householdComposition:
      room.householdComposition === "none" ||
      room.householdComposition === "men" ||
      room.householdComposition === "women" ||
      room.householdComposition === "mixed" ||
      room.householdComposition === "not_specified"
        ? room.householdComposition
        : "not_specified",
    acceptedOccupantProfiles: acceptedProfiles,
    genderPreference:
      room.genderPreference === "men" || room.genderPreference === "women"
        ? room.genderPreference
        : "none",
    availableFrom: safeText(room.availableFrom, 30),
    expensesIncluded: room.expensesIncluded === true,
    compatibilityNotes: safeText(room.compatibilityNotes, 2_000),
  };
}

export function isOperationType(value: unknown): value is OperationType {
  return OPERATIONS.includes(value as OperationType);
}

export function isPropertyType(value: unknown): value is PropertyType {
  return PROPERTY_TYPES.includes(value as PropertyType);
}

export function isJourneyUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function createJourneyId() {
  return crypto.randomUUID();
}

export function buildPropertyJourney(
  data: WizardData,
  options: {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  } = {},
): PropertyJourney {
  if (!isOperationType(data.operation) || !isPropertyType(data.propertyType)) {
    throw new Error("Dati del percorso incompleti.");
  }

  const now = new Date().toISOString();
  const createdAt = safeIsoDate(options.createdAt, now);
  const updatedAt = safeIsoDate(options.updatedAt, createdAt);
  const propertyName =
    data.propertyName.trim() ||
    `${getPropertyLabel(data.propertyType)} a ${data.city.trim()}`;
  const requestedSurface = Number(data.surface);

  const journey: PropertyJourney = {
    version: 1,
    id: options.id ?? createJourneyId(),
    status: "active",
    createdAt,
    updatedAt,
    operation: data.operation,
    property: {
      type: data.propertyType,
      name: propertyName,
      surface:
        data.surface.trim() && Number.isFinite(requestedSurface) && requestedSurface > 0
          ? requestedSurface
          : null,
      occupancy: data.occupancy || null,
      country: data.country.trim(),
      city: data.city.trim(),
      province: data.province.trim(),
      address: data.address.trim(),
      postalCode: data.postalCode.trim(),
      cadastralSheet: data.cadastralSheet.trim(),
      cadastralParcel: data.cadastralParcel.trim(),
      cadastralSubaltern: data.cadastralSubaltern.trim(),
      latitude: data.latitude,
      longitude: data.longitude,
      locationVerified: data.locationVerified,
      locationVerifiedAt: data.locationVerifiedAt,
      locationLabel: data.locationLabel,
      roomRental: normalizeRoomRental(data.roomRental),
    },
    documents: [...new Set(data.documents)],
    ...calculateJourneyMetrics(data),
  };

  return normalizePropertyJourney(journey);
}

export function normalizePropertyJourney(
  journey: PropertyJourney,
): PropertyJourney {
  const normalized: PropertyJourney = {
    ...journey,
    property: {
      ...journey.property,
      name: safeText(journey.property.name, 180),
      country: safeText(journey.property.country, 80),
      city: safeText(journey.property.city, 120),
      province: safeText(journey.property.province, 120),
      address: safeText(journey.property.address, 240),
      postalCode: safeText(journey.property.postalCode, 20),
      cadastralSheet: safeText(journey.property.cadastralSheet, 80),
      cadastralParcel: safeText(journey.property.cadastralParcel, 80),
      cadastralSubaltern: safeText(journey.property.cadastralSubaltern, 80),
      latitude: safeNumber(journey.property.latitude),
      longitude: safeNumber(journey.property.longitude),
      locationVerified: journey.property.locationVerified === true,
      locationVerifiedAt: safeText(journey.property.locationVerifiedAt, 40),
      locationLabel: safeText(journey.property.locationLabel, 300),
      roomRental: normalizeRoomRental(journey.property.roomRental),
    },
    documents: Array.from(
      new Set(
        journey.documents.filter((document): document is DocumentKey =>
          DOCUMENT_KEYS.includes(document),
        ),
      ),
    ),
  };

  return {
    ...normalized,
    ...calculateJourneyMetrics(journeyToWizardData(normalized)),
  };
}

export function parsePropertyJourney(value: unknown): PropertyJourney | null {
  const candidate = objectValue(value);
  const property = objectValue(candidate?.property);
  if (
    candidate?.version !== 1 ||
    candidate.status !== "active" ||
    !isJourneyUuid(candidate.id) ||
    !isOperationType(candidate.operation) ||
    !property ||
    !isPropertyType(property.type) ||
    !Array.isArray(candidate.documents)
  ) {
    return null;
  }

  const now = new Date().toISOString();
  const occupancy = OCCUPANCY_STATUSES.includes(
    property.occupancy as OccupancyStatus,
  )
    ? (property.occupancy as OccupancyStatus)
    : null;
  const surface = safeNumber(property.surface);
  const data: WizardData = {
    ...INITIAL_WIZARD_DATA,
    operation: candidate.operation,
    propertyType: property.type,
    propertyName: safeText(property.name, 180),
    surface: surface !== null && surface > 0 ? String(surface) : "",
    occupancy: occupancy ?? "",
    country: safeText(property.country, 80),
    city: safeText(property.city, 120),
    province: safeText(property.province, 120),
    address: safeText(property.address, 240),
    postalCode: safeText(property.postalCode, 20),
    cadastralSheet: safeText(property.cadastralSheet, 80),
    cadastralParcel: safeText(property.cadastralParcel, 80),
    cadastralSubaltern: safeText(property.cadastralSubaltern, 80),
    latitude: safeNumber(property.latitude),
    longitude: safeNumber(property.longitude),
    locationVerified: property.locationVerified === true,
    locationVerifiedAt: safeText(property.locationVerifiedAt, 40),
    locationLabel: safeText(property.locationLabel, 300),
    roomRental: normalizeRoomRental(property.roomRental),
    documents: candidate.documents.filter(
      (document): document is DocumentKey => DOCUMENT_KEYS.includes(document as DocumentKey),
    ),
  };

  if (
    !data.propertyName ||
    !data.country ||
    !data.city ||
    !data.province ||
    !data.address ||
    !data.postalCode
  ) {
    return null;
  }

  if (data.propertyType === "room") {
    const roomSurface = Number(data.roomRental.roomSurface);
    const roommates = Number(data.roomRental.currentRoommates);
    if (
      !data.roomRental.roomType ||
      !Number.isFinite(roomSurface) ||
      roomSurface < 4 ||
      roomSurface > 200 ||
      !Number.isInteger(roommates) ||
      roommates < 0 ||
      roommates > 30 ||
      data.roomRental.acceptedOccupantProfiles.length === 0 ||
      !data.roomRental.availableFrom
    ) {
      return null;
    }
  }

  return buildPropertyJourney(data, {
    id: candidate.id,
    createdAt: safeIsoDate(candidate.createdAt, now),
    updatedAt: safeIsoDate(candidate.updatedAt, now),
  });
}
