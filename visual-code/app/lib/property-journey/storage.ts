import {
  ACTIVE_JOURNEY_STORAGE_KEY,
  INITIAL_WIZARD_DATA,
  JOURNEY_CHANGE_EVENT,
  JOURNEY_STORAGE_KEY,
  WIZARD_DRAFT_STORAGE_KEY,
  getPropertyLabel,
} from "@/lib/property-journey/constants";
import {
  calculateJourneyMetrics,
  journeyToWizardData,
} from "@/lib/property-journey/scoring";
import type {
  DocumentKey,
  OperationType,
  PropertyJourney,
  PropertyType,
  WizardData,
  WizardDraft,
} from "@/lib/property-journey/types";

const LEGACY_JOURNEY_STORAGE_KEY = "casapilot-active-property";
const LEGACY_DRAFT_STORAGE_KEY = "casapilot-new-property-draft";

const LEGACY_DOCUMENT_MAP: Record<string, DocumentKey | undefined> = {
  ownership: "ownership",
  floorPlan: "cadastralPlan",
  cadastralPlan: "cadastralPlan",
  cadastralSurvey: "cadastralSurvey",
  energyCertificate: "energyCertificate",
  habitability: "habitability",
  systems: "systems",
  condominium: "condominium",
  urbanCompliance: "urbanCompliance",
  tenantDocuments: "leaseTemplate",
  leaseTemplate: "leaseTemplate",
};

function isBrowser() {
  return typeof window !== "undefined";
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `journey-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isOperation(value: unknown): value is OperationType {
  return value === "sale" || value === "rent";
}

function isPropertyType(value: unknown): value is PropertyType {
  return ["apartment", "house", "commercial", "land", "garage"].includes(
    String(value),
  );
}

function isJourney(value: unknown): value is PropertyJourney {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<PropertyJourney>;

  return (
    candidate.version === 1 &&
    typeof candidate.id === "string" &&
    isOperation(candidate.operation) &&
    Boolean(candidate.property) &&
    Array.isArray(candidate.documents)
  );
}


function normalizeJourney(journey: PropertyJourney): PropertyJourney {
  const normalized: PropertyJourney = {
    ...journey,
    property: {
      ...journey.property,
      cadastralSheet: journey.property.cadastralSheet ?? "",
      cadastralParcel: journey.property.cadastralParcel ?? "",
      cadastralSubaltern: journey.property.cadastralSubaltern ?? "",
      latitude:
        typeof journey.property.latitude === "number" &&
        Number.isFinite(journey.property.latitude)
          ? journey.property.latitude
          : null,
      longitude:
        typeof journey.property.longitude === "number" &&
        Number.isFinite(journey.property.longitude)
          ? journey.property.longitude
          : null,
      locationVerified: journey.property.locationVerified === true,
      locationVerifiedAt:
        typeof journey.property.locationVerifiedAt === "string"
          ? journey.property.locationVerifiedAt
          : "",
      locationLabel:
        typeof journey.property.locationLabel === "string"
          ? journey.property.locationLabel
          : "",
    },
  };
  const metrics = calculateJourneyMetrics(journeyToWizardData(normalized));

  return {
    ...normalized,
    ...metrics,
  };
}

function emitChange() {
  if (!isBrowser()) return;

  window.dispatchEvent(new Event(JOURNEY_CHANGE_EVENT));
}

function mapLegacyDocuments(value: unknown): DocumentKey[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => LEGACY_DOCUMENT_MAP[String(item)])
        .filter((item): item is DocumentKey => Boolean(item)),
    ),
  );
}

function migrateLegacyJourney(): PropertyJourney | null {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(LEGACY_JOURNEY_STORAGE_KEY);
  if (!raw) return null;

  try {
    const legacy = JSON.parse(raw) as Record<string, unknown>;
    if (!isOperation(legacy.operation) || !isPropertyType(legacy.propertyType)) {
      return null;
    }

    const operation = legacy.operation;
    const propertyType = legacy.propertyType;

    const data: WizardData = {
      ...INITIAL_WIZARD_DATA,
      operation,
      propertyType,
      propertyName:
        typeof legacy.propertyName === "string" ? legacy.propertyName : "",
      country: typeof legacy.country === "string" ? legacy.country : "Italia",
      city: typeof legacy.city === "string" ? legacy.city : "",
      province: typeof legacy.province === "string" ? legacy.province : "",
      address: typeof legacy.address === "string" ? legacy.address : "",
      postalCode:
        typeof legacy.postalCode === "string" ? legacy.postalCode : "",
      documents: mapLegacyDocuments(legacy.documents),
    };

    const now = new Date().toISOString();
    const createdAt =
      typeof legacy.createdAt === "string" ? legacy.createdAt : now;
    const id = typeof legacy.id === "string" ? legacy.id : createId();
    const metrics = calculateJourneyMetrics(data);
    const propertyName =
      data.propertyName.trim() ||
      `${getPropertyLabel(propertyType)} a ${data.city.trim() || "completare"}`;

    const journey: PropertyJourney = {
      version: 1,
      id,
      status: "active",
      createdAt,
      updatedAt: now,
      operation,
      property: {
        type: propertyType,
        name: propertyName,
        surface: null,
        occupancy: null,
        country: data.country,
        city: data.city,
        province: data.province,
        address: data.address,
        postalCode: data.postalCode,
        cadastralSheet: data.cadastralSheet,
        cadastralParcel: data.cadastralParcel,
        cadastralSubaltern: data.cadastralSubaltern,
        latitude: data.latitude,
        longitude: data.longitude,
        locationVerified: data.locationVerified,
        locationVerifiedAt: data.locationVerifiedAt,
        locationLabel: data.locationLabel,
      },
      documents: data.documents,
      ...metrics,
    };

    window.localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify([journey]));
    window.localStorage.setItem(ACTIVE_JOURNEY_STORAGE_KEY, journey.id);
    window.localStorage.removeItem(LEGACY_JOURNEY_STORAGE_KEY);

    return journey;
  } catch {
    return null;
  }
}

export function readJourneys(): PropertyJourney[] {
  if (!isBrowser()) return [];

  const raw = window.localStorage.getItem(JOURNEY_STORAGE_KEY);

  if (!raw) {
    const migratedJourney = migrateLegacyJourney();
    return migratedJourney ? [migratedJourney] : [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isJourney)
      .map(normalizeJourney)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

function writeJourneys(journeys: PropertyJourney[]) {
  if (!isBrowser()) return;

  window.localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journeys));
  emitChange();
}

export function readActiveJourneyId() {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACTIVE_JOURNEY_STORAGE_KEY);
}

export function setActiveJourneyId(journeyId: string) {
  if (!isBrowser()) return;

  window.localStorage.setItem(ACTIVE_JOURNEY_STORAGE_KEY, journeyId);
  emitChange();
}

export function readActiveJourney() {
  const journeys = readJourneys();
  const activeId = readActiveJourneyId();

  return journeys.find((journey) => journey.id === activeId) ?? journeys[0] ?? null;
}

export function createJourney(data: WizardData) {
  if (!data.operation || !data.propertyType) {
    throw new Error("Dati del percorso incompleti.");
  }

  const now = new Date().toISOString();
  const metrics = calculateJourneyMetrics(data);
  const propertyName =
    data.propertyName.trim() ||
    `${getPropertyLabel(data.propertyType)} a ${data.city.trim()}`;

  const journey: PropertyJourney = {
    version: 1,
    id: createId(),
    status: "active",
    createdAt: now,
    updatedAt: now,
    operation: data.operation,
    property: {
      type: data.propertyType,
      name: propertyName,
      surface: data.surface.trim() ? Number(data.surface) : null,
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
    },
    documents: data.documents,
    ...metrics,
  };

  const existingJourneys = readJourneys();
  writeJourneys([journey, ...existingJourneys]);
  window.localStorage.setItem(ACTIVE_JOURNEY_STORAGE_KEY, journey.id);
  emitChange();

  return journey;
}


export function replaceJourneys(
  journeys: PropertyJourney[],
  activeJourneyId: string | null = null,
) {
  if (!isBrowser()) return;

  const validJourneys = journeys.filter(isJourney).map(normalizeJourney);
  writeJourneys(validJourneys);

  const nextActiveId =
    validJourneys.find((journey) => journey.id === activeJourneyId)?.id ??
    validJourneys[0]?.id ??
    null;

  if (nextActiveId) {
    window.localStorage.setItem(ACTIVE_JOURNEY_STORAGE_KEY, nextActiveId);
  } else {
    window.localStorage.removeItem(ACTIVE_JOURNEY_STORAGE_KEY);
  }

  emitChange();
}

export function upsertJourney(journey: PropertyJourney) {
  if (!isBrowser() || !isJourney(journey)) return null;

  journey = normalizeJourney(journey);
  const journeys = readJourneys();
  const existingIndex = journeys.findIndex((item) => item.id === journey.id);
  const nextJourneys = [...journeys];

  if (existingIndex >= 0) {
    nextJourneys[existingIndex] = journey;
  } else {
    nextJourneys.unshift(journey);
  }

  writeJourneys(nextJourneys);
  window.localStorage.setItem(ACTIVE_JOURNEY_STORAGE_KEY, journey.id);
  emitChange();
  return journey;
}

export function updateJourneyDocuments(
  journeyId: string,
  documents: DocumentKey[],
) {
  const journeys = readJourneys();
  let updatedJourney: PropertyJourney | null = null;

  const updatedJourneys = journeys.map((journey) => {
    if (journey.id !== journeyId) return journey;

    const data = {
      ...journeyToWizardData(journey),
      documents,
    };
    const metrics = calculateJourneyMetrics(data);

    updatedJourney = {
      ...journey,
      documents,
      updatedAt: new Date().toISOString(),
      ...metrics,
    };

    return updatedJourney;
  });

  writeJourneys(updatedJourneys);
  return updatedJourney;
}


export function updateJourneyProperty(
  journeyId: string,
  property: Partial<PropertyJourney["property"]>,
) {
  const journeys = readJourneys();
  let updatedJourney: PropertyJourney | null = null;

  const updatedJourneys = journeys.map((journey) => {
    if (journey.id !== journeyId) return journey;

    const nextProperty = {
      ...journey.property,
      ...property,
    };
    const data = journeyToWizardData({
      ...journey,
      property: nextProperty,
    });
    const metrics = calculateJourneyMetrics(data);

    updatedJourney = {
      ...journey,
      property: nextProperty,
      updatedAt: new Date().toISOString(),
      ...metrics,
    };

    return updatedJourney;
  });

  writeJourneys(updatedJourneys);
  return updatedJourney;
}

export function deleteJourney(journeyId: string) {
  if (!isBrowser()) return false;

  const journeys = readJourneys();
  const exists = journeys.some((journey) => journey.id === journeyId);
  if (!exists) return false;

  const nextJourneys = journeys.filter((journey) => journey.id !== journeyId);
  writeJourneys(nextJourneys);

  const activeId = readActiveJourneyId();
  if (activeId === journeyId) {
    const nextActiveId = nextJourneys[0]?.id ?? null;
    if (nextActiveId) {
      window.localStorage.setItem(ACTIVE_JOURNEY_STORAGE_KEY, nextActiveId);
    } else {
      window.localStorage.removeItem(ACTIVE_JOURNEY_STORAGE_KEY);
    }
  }

  emitChange();
  return true;
}

export function saveWizardDraft(step: number, data: WizardData) {
  if (!isBrowser()) return;

  const draft: WizardDraft = {
    version: 1,
    step,
    data,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(WIZARD_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function migrateLegacyDraft(): WizardDraft | null {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(LEGACY_DRAFT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const legacy = JSON.parse(raw) as {
      step?: unknown;
      formData?: Record<string, unknown>;
    };
    const formData = legacy.formData;
    if (!formData) return null;

    const draft: WizardDraft = {
      version: 1,
      step:
        typeof legacy.step === "number"
          ? Math.min(Math.max(legacy.step, 1), 5)
          : 1,
      data: {
        ...INITIAL_WIZARD_DATA,
        operation: isOperation(formData.operation) ? formData.operation : "",
        propertyType: isPropertyType(formData.propertyType)
          ? formData.propertyType
          : "",
        propertyName:
          typeof formData.propertyName === "string"
            ? formData.propertyName
            : "",
        country:
          typeof formData.country === "string" ? formData.country : "Italia",
        city: typeof formData.city === "string" ? formData.city : "",
        province:
          typeof formData.province === "string" ? formData.province : "",
        address:
          typeof formData.address === "string" ? formData.address : "",
        postalCode:
          typeof formData.postalCode === "string" ? formData.postalCode : "",
        cadastralSheet:
          typeof formData.cadastralSheet === "string" ? formData.cadastralSheet : "",
        cadastralParcel:
          typeof formData.cadastralParcel === "string" ? formData.cadastralParcel : "",
        cadastralSubaltern:
          typeof formData.cadastralSubaltern === "string" ? formData.cadastralSubaltern : "",
        latitude:
          typeof formData.latitude === "number" && Number.isFinite(formData.latitude)
            ? formData.latitude
            : null,
        longitude:
          typeof formData.longitude === "number" && Number.isFinite(formData.longitude)
            ? formData.longitude
            : null,
        locationVerified: formData.locationVerified === true,
        locationVerifiedAt:
          typeof formData.locationVerifiedAt === "string"
            ? formData.locationVerifiedAt
            : "",
        locationLabel:
          typeof formData.locationLabel === "string" ? formData.locationLabel : "",
        documents: mapLegacyDocuments(formData.documents),
      },
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(WIZARD_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    window.localStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);

    return draft;
  } catch {
    return null;
  }
}

export function readWizardDraft(): WizardDraft | null {
  if (!isBrowser()) return null;

  const raw = window.localStorage.getItem(WIZARD_DRAFT_STORAGE_KEY);
  if (!raw) return migrateLegacyDraft();

  try {
    const parsed = JSON.parse(raw) as Partial<WizardDraft>;

    if (
      parsed.version !== 1 ||
      typeof parsed.step !== "number" ||
      !parsed.data
    ) {
      return null;
    }

    return {
      version: 1,
      step: parsed.step,
      data: {
        ...INITIAL_WIZARD_DATA,
        ...parsed.data,
        cadastralSheet: parsed.data.cadastralSheet ?? "",
        cadastralParcel: parsed.data.cadastralParcel ?? "",
        cadastralSubaltern: parsed.data.cadastralSubaltern ?? "",
        latitude:
          typeof parsed.data.latitude === "number" && Number.isFinite(parsed.data.latitude)
            ? parsed.data.latitude
            : null,
        longitude:
          typeof parsed.data.longitude === "number" && Number.isFinite(parsed.data.longitude)
            ? parsed.data.longitude
            : null,
        locationVerified: parsed.data.locationVerified === true,
        locationVerifiedAt:
          typeof parsed.data.locationVerifiedAt === "string"
            ? parsed.data.locationVerifiedAt
            : "",
        locationLabel:
          typeof parsed.data.locationLabel === "string"
            ? parsed.data.locationLabel
            : "",
      },
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearWizardDraft() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(WIZARD_DRAFT_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
}

export function subscribeToJourneyChanges(callback: () => void) {
  if (!isBrowser()) return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === JOURNEY_STORAGE_KEY ||
      event.key === ACTIVE_JOURNEY_STORAGE_KEY
    ) {
      callback();
    }
  };

  window.addEventListener(JOURNEY_CHANGE_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(JOURNEY_CHANGE_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}
