import { protectContactData } from "./privacy";
import { getServicePolicy } from "./service-policy";
import { mergeRemoteConfiguration } from "@/lib/remote-layer/service-policy";
import type {
  Job,
  LeadRequest,
  Message,
  ProfessionalIdentity,
  ProfessionalOsState,
  Quote,
  Review,
  ServiceOffering,
} from "./types";

const STORAGE_KEY = "casapilot_professional_os_v70";
const LEGACY_PROFILE_KEYS = [
  "casapilot_v69_profile",
  "casapilot_v68_professional_profile",
];
const LEGACY_OFFERING_KEYS = ["casapilot_v69_2_service_offerings"];

function now() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}_${random}`;
}

function defaultRemoteCapabilities() {
  return {
    languageSkills: [{ language: "it" as const, level: "native" as const }],
    remoteConsultation: false,
    videoCallAvailable: false,
    internationalClientExperience: false,
    photoReportAvailable: false,
    delegationSupported: false,
    asynchronousUpdates: true,
    preferredContactWindows: [],
  };
}

function emptyState(): ProfessionalOsState {
  return {
    version: 72,
    identity: null,
    offerings: [],
    leads: demoLeads(),
    matches: [],
    invitations: [],
    quotes: demoQuotes(),
    messages: [],
    jobs: [],
    reviews: [],
  };
}

function demoLeads(): LeadRequest[] {
  const timestamp = now();
  return [
    {
      id: "lead_v70_photo",
      ownerId: "owner_demo_1",
      serviceId: "fotografia-immobiliare",
      categoryId: "presentazione-valorizzazione",
      propertyLabel: "Villa con giardino",
      approximateLocation: "Acireale",
      propertyType: "house",
      urgency: "within_week",
      budgetMin: 250,
      budgetMax: 500,
      answers: {
        media: ["Fotografie", "Video", "Drone"],
        rooms: 8,
        purpose: "Vendita",
      },
      notes:
        "Il proprietario vive in Germania e preferisce ricevere un report completo.",
      qualityScore: 94,
      ownerLanguage: "de",
      countryOfResidence: "Germania",
      timezone: "Europe/Berlin",
      presenceAvailability: "remote_only",
      localContactAvailable: false,
      translationEnabled: true,
      videoCallPreferred: true,
      communicationPreference: "automatic",
      showOriginalByDefault: true,
      status: "quotes_open",
      distributionStatus: "wave_1",
      maxProfessionals: 3,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "lead_v70_technical",
      ownerId: "owner_demo_2",
      serviceId: "verifica-catastale-urbanistica",
      categoryId: "documenti-conformita",
      propertyLabel: "Appartamento in Via Roma",
      approximateLocation: "Catania",
      propertyType: "apartment",
      urgency: "within_month",
      answers: {
        problem: "La planimetria non sembra corrispondere allo stato reale",
        documents: ["Planimetria", "Visura catastale"],
      },
      notes:
        "La cucina è stata spostata. Il proprietario vive nel Regno Unito, ma ha un referente locale.",
      qualityScore: 86,
      ownerLanguage: "en",
      countryOfResidence: "Regno Unito",
      timezone: "Europe/London",
      presenceAvailability: "local_contact",
      localContactAvailable: true,
      translationEnabled: true,
      videoCallPreferred: false,
      communicationPreference: "translation_allowed",
      showOriginalByDefault: true,
      localContactRole: "Familiare",
      status: "matching",
      distributionStatus: "queued",
      maxProfessionals: 3,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "lead_v70_cleaning",
      ownerId: "owner_demo_3",
      serviceId: "pulizia-profonda",
      categoryId: "pulizia-sgombero-trasloco",
      propertyLabel: "Bilocale da riconsegnare",
      approximateLocation: "Güímar",
      propertyType: "apartment",
      urgency: "asap",
      budgetMax: 250,
      answers: {
        surface: 62,
        furnished: true,
        type: "Pulizia prima della riconsegna",
      },
      notes: "L'immobile deve essere pronto entro tre giorni.",
      qualityScore: 80,
      ownerLanguage: "it",
      countryOfResidence: "Italia",
      timezone: "Atlantic/Canary",
      presenceAvailability: "available",
      localContactAvailable: false,
      translationEnabled: false,
      videoCallPreferred: false,
      communicationPreference: "direct_preferred",
      showOriginalByDefault: true,
      status: "submitted",
      distributionStatus: "queued",
      maxProfessionals: 3,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

function demoQuotes(): Quote[] {
  const timestamp = now();
  return [
    {
      id: "quote_v70_demo",
      leadId: "lead_v70_photo",
      professionalId: "professional_demo",
      offeringId: "offering_demo_photo",
      priceType: "fixed",
      priceMin: 390,
      vatIncluded: true,
      includedItems: [
        "30 fotografie professionali",
        "Video verticale",
        "Riprese con drone",
      ],
      excludedItems: ["Home staging"],
      additionalCosts: "Nessun costo aggiuntivo previsto.",
      firstAvailability: "Tra 4 giorni",
      estimatedDuration: "Consegna entro 48 ore",
      validityDays: 7,
      message:
        "Possiamo programmare le riprese nella fascia tramonto richiesta.",
      status: "sent",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

function readRaw(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function migrateIdentity(input: Record<string, unknown>): ProfessionalIdentity {
  const legacyLanguages = Array.isArray(input.languages)
    ? input.languages.map(String)
    : ["Italiano"];
  const existingRemote = input.remoteCapabilities as
    | ProfessionalIdentity["remoteCapabilities"]
    | undefined;
  const existingSkills = Array.isArray(input.languageSkills)
    ? (input.languageSkills as ProfessionalIdentity["languageSkills"])
    : legacyLanguages.map((language, index) => ({
        language:
          language.toLowerCase().includes("english") ||
          language.toLowerCase().includes("ingles")
            ? ("en" as const)
            : language.toLowerCase().includes("deutsch") ||
                language.toLowerCase().includes("tedesc")
              ? ("de" as const)
              : language.toLowerCase().includes("fran")
                ? ("fr" as const)
                : language.toLowerCase().includes("spa")
                  ? ("es" as const)
                  : ("it" as const),
        level: index === 0 ? ("native" as const) : ("intermediate" as const),
      }));

  const verificationItems = Array.isArray(input.verificationItems)
    ? (input.verificationItems as ProfessionalIdentity["verificationItems"])
    : [];

  return {
    id: String(input.id ?? makeId("professional")),
    userId: String(input.userId ?? "current-user"),
    accountType:
      (input.accountType as ProfessionalIdentity["accountType"]) ??
      "freelancer",
    displayName: String(input.displayName ?? "Professionista"),
    legalName: String(input.legalName ?? input.displayName ?? "Professionista"),
    profession: String(input.profession ?? "Professionista"),
    taxId: typeof input.taxId === "string" ? input.taxId : undefined,
    vatNumber:
      typeof input.vatNumber === "string" ? input.vatNumber : undefined,
    bio: String(input.bio ?? ""),
    yearsExperience: Number(input.yearsExperience ?? 0),
    languages: legacyLanguages,
    languageSkills: existingSkills,
    remoteCapabilities: existingRemote ?? {
      ...defaultRemoteCapabilities(),
      languageSkills: existingSkills,
      remoteConsultation: Boolean(input.onlineAvailable),
      asynchronousUpdates: true,
      preferredContactWindows: [],
    },
    generalAreas: Array.isArray(input.generalAreas)
      ? input.generalAreas.map(String)
      : Array.isArray(input.serviceAreas)
        ? input.serviceAreas.map(String)
        : [],
    onlineAvailable: Boolean(input.onlineAvailable),
    weeklyLeadLimit: Number(input.weeklyLeadLimit ?? 10),
    pauseAllLeads: Boolean(input.pauseAllLeads),
    verificationStatus:
      (input.verificationStatus as ProfessionalIdentity["verificationStatus"]) ??
      (verificationItems.length > 0 ? "pending" : "not_started"),
    verificationItems,
    createdAt: String(input.createdAt ?? now()),
    updatedAt: now(),
  };
}

function migrateOffering(
  input: Record<string, unknown>,
  identity: ProfessionalIdentity,
): ServiceOffering {
  const serviceId = String(input.serviceId);
  const policy = getServicePolicy(serviceId);
  const deliveryModes = Array.isArray(input.deliveryModes)
    ? (input.deliveryModes as ServiceOffering["deliveryModes"])
    : policy.allowedDeliveryModes.slice(0, 1);
  const remotePolicy = mergeRemoteConfiguration(serviceId, {
    remoteExecutionLevel: input.remoteExecutionLevel as ServiceOffering["remoteExecutionLevel"],
    ownerPresenceRequirement: input.ownerPresenceRequirement as ServiceOffering["ownerPresenceRequirement"],
    inspectionRequired: typeof input.inspectionRequired === "boolean" ? input.inspectionRequired : undefined,
    delegationSupported: typeof input.delegationSupported === "boolean" ? input.delegationSupported : undefined,
    photoReportAvailable: typeof input.photoReportAvailable === "boolean" ? input.photoReportAvailable : undefined,
    videoCallAvailable: typeof input.videoCallAvailable === "boolean" ? input.videoCallAvailable : undefined,
    remoteFeasibility: input.remoteFeasibility as ServiceOffering["remoteFeasibility"],
    documentHandling: input.documentHandling as ServiceOffering["documentHandling"],
    signatureMode: input.signatureMode as ServiceOffering["signatureMode"],
    localContactSufficient: typeof input.localContactSufficient === "boolean" ? input.localContactSufficient : undefined,
    ownerActionRequired: Array.isArray(input.ownerActionRequired) ? input.ownerActionRequired.map(String) : undefined,
    workflowSteps: Array.isArray(input.remoteWorkflowSteps) ? input.remoteWorkflowSteps as ServiceOffering["remoteWorkflowSteps"] : undefined,
  });

  return {
    id: String(input.id ?? makeId("offering")),
    professionalId: String(input.professionalId ?? identity.id),
    serviceId,
    activationStatus:
      (input.activationStatus as ServiceOffering["activationStatus"]) ??
      (input.enabled === false
        ? "paused"
        : input.status === "limited"
          ? "limited"
          : policy.regulated
            ? "pending_verification"
            : "active"),
    deliveryModes,
    useGeneralAreas:
      typeof input.useGeneralAreas === "boolean"
        ? input.useGeneralAreas
        : input.useProfileAreas !== false,
    areas: Array.isArray(input.areas)
      ? input.areas.map(String)
      : Array.isArray(input.serviceAreas)
        ? input.serviceAreas.map(String)
        : [],
    radiusKm: Number(input.radiusKm ?? 30),
    acceptedUrgencies: Array.isArray(input.acceptedUrgencies)
      ? (input.acceptedUrgencies as ServiceOffering["acceptedUrgencies"])
      : ["asap", "within_week", "within_month", "flexible"],
    propertyTypes: Array.isArray(input.propertyTypes)
      ? (input.propertyTypes as ServiceOffering["propertyTypes"])
      : policy.supportedPropertyTypes,
    pricingMode:
      (input.pricingMode as ServiceOffering["pricingMode"]) ??
      "after_inspection",
    priceMin: typeof input.priceMin === "number" ? input.priceMin : undefined,
    priceMax: typeof input.priceMax === "number" ? input.priceMax : undefined,
    vatIncluded:
      typeof input.vatIncluded === "boolean" ? input.vatIncluded : true,
    weeklyCapacity: Number(input.weeklyCapacity ?? 5),
    currentWeekAssigned: Number(input.currentWeekAssigned ?? 0),
    minimumLeadQuality: Number(
      input.minimumLeadQuality ?? input.minimumLeadScore ?? 50,
    ),
    responseSlaHours: Number(
      input.responseSlaHours ?? input.responseTimeHours ?? 24,
    ),
    availabilityWindows: Array.isArray(input.availabilityWindows)
      ? (input.availabilityWindows as ServiceOffering["availabilityWindows"])
      : [],
    capabilities: Array.isArray(input.capabilities)
      ? input.capabilities.map(String)
      : [],
    exclusions: Array.isArray(input.exclusions)
      ? input.exclusions.map(String)
      : [],
    verificationItemIds: Array.isArray(input.verificationItemIds)
      ? input.verificationItemIds.map(String)
      : [],
    internalNotes: String(input.internalNotes ?? input.notes ?? ""),
    autoPauseWhenFull:
      typeof input.autoPauseWhenFull === "boolean"
        ? input.autoPauseWhenFull
        : true,
    remoteExecutionLevel: remotePolicy.remoteExecutionLevel,
    ownerPresenceRequirement: remotePolicy.ownerPresenceRequirement,
    inspectionRequired: remotePolicy.inspectionRequired,
    delegationSupported:
      remotePolicy.delegationSupported ||
      identity.remoteCapabilities.delegationSupported,
    photoReportAvailable:
      remotePolicy.photoReportAvailable ||
      identity.remoteCapabilities.photoReportAvailable,
    videoCallAvailable:
      remotePolicy.videoCallAvailable ||
      identity.remoteCapabilities.videoCallAvailable,
    remoteFeasibility: remotePolicy.remoteFeasibility,
    documentHandling: remotePolicy.documentHandling,
    signatureMode: remotePolicy.signatureMode,
    localContactSufficient: remotePolicy.localContactSufficient,
    ownerActionRequired: remotePolicy.ownerActionRequired,
    remoteWorkflowSteps: remotePolicy.workflowSteps,
    createdAt: String(input.createdAt ?? now()),
    updatedAt: now(),
  };
}

function migrateLead(input: Record<string, unknown>): LeadRequest {
  return {
    ...(input as unknown as LeadRequest),
    ownerLanguage:
      (input.ownerLanguage as LeadRequest["ownerLanguage"]) ?? "it",
    countryOfResidence: String(input.countryOfResidence ?? "Italia"),
    timezone: String(input.timezone ?? "Europe/Rome"),
    presenceAvailability:
      (input.presenceAvailability as LeadRequest["presenceAvailability"]) ??
      "available",
    specificPresenceDates:
      typeof input.specificPresenceDates === "string"
        ? input.specificPresenceDates
        : undefined,
    localContactAvailable: Boolean(input.localContactAvailable),
    translationEnabled: Boolean(input.translationEnabled),
    videoCallPreferred: Boolean(input.videoCallPreferred),
    communicationPreference:
      (input.communicationPreference as LeadRequest["communicationPreference"]) ??
      (Boolean(input.translationEnabled) ? "translation_allowed" : "automatic"),
    showOriginalByDefault:
      typeof input.showOriginalByDefault === "boolean"
        ? input.showOriginalByDefault
        : true,
    localContactRole:
      typeof input.localContactRole === "string"
        ? input.localContactRole
        : undefined,
  };
}

function migrateStoredState(input: Record<string, unknown>): ProfessionalOsState {
  const identity = input.identity
    ? migrateIdentity(input.identity as Record<string, unknown>)
    : null;
  const offerings = identity && Array.isArray(input.offerings)
    ? input.offerings.map((item) =>
        migrateOffering(item as Record<string, unknown>, identity),
      )
    : [];

  return {
    version: 72,
    identity,
    offerings,
    leads: Array.isArray(input.leads)
      ? input.leads.map((item) => migrateLead(item as Record<string, unknown>))
      : demoLeads(),
    matches: Array.isArray(input.matches)
      ? (input.matches as ProfessionalOsState["matches"])
      : [],
    invitations: Array.isArray(input.invitations)
      ? (input.invitations as ProfessionalOsState["invitations"])
      : [],
    quotes: Array.isArray(input.quotes)
      ? (input.quotes as ProfessionalOsState["quotes"])
      : demoQuotes(),
    messages: Array.isArray(input.messages)
      ? (input.messages as ProfessionalOsState["messages"])
      : [],
    jobs: Array.isArray(input.jobs)
      ? (input.jobs as ProfessionalOsState["jobs"])
      : [],
    reviews: Array.isArray(input.reviews)
      ? (input.reviews as ProfessionalOsState["reviews"])
      : [],
  };
}

function migrateLegacyIdentity(): ProfessionalIdentity | null {
  for (const key of LEGACY_PROFILE_KEYS) {
    const legacy = parseJson<Record<string, unknown>>(readRaw(key));
    if (legacy) return migrateIdentity(legacy);
  }
  return null;
}

function migrateLegacyOfferings(
  identity: ProfessionalIdentity,
): ServiceOffering[] {
  for (const key of LEGACY_OFFERING_KEYS) {
    const values = parseJson<Array<Record<string, unknown>>>(readRaw(key));
    if (values) return values.map((value) => migrateOffering(value, identity));
  }
  return [];
}

function migrateOrCreateState(): ProfessionalOsState {
  const identity = migrateLegacyIdentity();
  const state = emptyState();
  if (!identity) return state;
  return {
    ...state,
    identity,
    offerings: migrateLegacyOfferings(identity),
  };
}

export function loadProfessionalState(): ProfessionalOsState {
  if (typeof window === "undefined") return emptyState();

  const raw = parseJson<Record<string, unknown>>(readRaw(STORAGE_KEY));
  if (raw) {
    const migrated = migrateStoredState(raw);
    saveProfessionalState(migrated);
    return migrated;
  }

  const migrated = migrateOrCreateState();
  saveProfessionalState(migrated);
  return migrated;
}

export function saveProfessionalState(state: ProfessionalOsState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export function updateProfessionalState(
  updater: (state: ProfessionalOsState) => ProfessionalOsState,
) {
  const next = updater(loadProfessionalState());
  saveProfessionalState(next);
  return next;
}

export function saveIdentity(identity: ProfessionalIdentity) {
  return updateProfessionalState((state) => ({
    ...state,
    identity: { ...identity, updatedAt: now() },
  })).identity;
}

export function createEmptyOffering(
  professionalId: string,
  serviceId: string,
): ServiceOffering {
  const policy = getServicePolicy(serviceId);
  const deliveryModes = policy.allowedDeliveryModes.slice(0, 1);
  const remotePolicy = mergeRemoteConfiguration(serviceId);
  return {
    id: makeId("offering"),
    professionalId,
    serviceId,
    activationStatus: "draft",
    deliveryModes,
    useGeneralAreas: true,
    areas: [],
    radiusKm: 30,
    acceptedUrgencies: [
      "asap",
      "within_week",
      "within_month",
      "flexible",
    ],
    propertyTypes: policy.supportedPropertyTypes,
    pricingMode: "after_inspection",
    vatIncluded: true,
    weeklyCapacity: 5,
    currentWeekAssigned: 0,
    minimumLeadQuality: 60,
    responseSlaHours: 24,
    availabilityWindows: [],
    capabilities: [],
    exclusions: [],
    verificationItemIds: [],
    internalNotes: "",
    autoPauseWhenFull: true,
    remoteExecutionLevel: remotePolicy.remoteExecutionLevel,
    ownerPresenceRequirement: remotePolicy.ownerPresenceRequirement,
    inspectionRequired: remotePolicy.inspectionRequired,
    delegationSupported: remotePolicy.delegationSupported,
    photoReportAvailable: remotePolicy.photoReportAvailable,
    videoCallAvailable: remotePolicy.videoCallAvailable,
    remoteFeasibility: remotePolicy.remoteFeasibility,
    documentHandling: remotePolicy.documentHandling,
    signatureMode: remotePolicy.signatureMode,
    localContactSufficient: remotePolicy.localContactSufficient,
    ownerActionRequired: remotePolicy.ownerActionRequired,
    remoteWorkflowSteps: remotePolicy.workflowSteps,
    createdAt: now(),
    updatedAt: now(),
  };
}

export function saveOffering(offering: ServiceOffering) {
  return updateProfessionalState((state) => {
    const exists = state.offerings.some((item) => item.id === offering.id);
    return {
      ...state,
      offerings: exists
        ? state.offerings.map((item) =>
            item.id === offering.id
              ? { ...offering, updatedAt: now() }
              : item,
          )
        : [...state.offerings, { ...offering, updatedAt: now() }],
    };
  }).offerings.find((item) => item.id === offering.id);
}

export function removeOffering(offeringId: string) {
  return updateProfessionalState((state) => ({
    ...state,
    offerings: state.offerings.filter((item) => item.id !== offeringId),
  }));
}

export function saveQuote(
  quote: Omit<Quote, "id" | "createdAt" | "updatedAt">,
) {
  const value: Quote = {
    ...quote,
    id: makeId("quote"),
    createdAt: now(),
    updatedAt: now(),
  };
  updateProfessionalState((state) => ({
    ...state,
    quotes: [value, ...state.quotes],
    leads: state.leads.map((lead) =>
      lead.id === quote.leadId
        ? { ...lead, status: "quotes_open", updatedAt: now() }
        : lead,
    ),
  }));
  return value;
}

export function sendProtectedMessage(
  leadId: string,
  senderRole: Message["senderRole"],
  senderId: string,
  text: string,
  contactsUnlocked: boolean,
) {
  const protectedContent = contactsUnlocked
    ? { body: text, redacted: false }
    : protectContactData(text);
  const message: Message = {
    id: makeId("message"),
    leadId,
    senderRole,
    senderId,
    body: protectedContent.body,
    redacted: protectedContent.redacted,
    createdAt: now(),
  };
  updateProfessionalState((state) => ({
    ...state,
    messages: [...state.messages, message],
  }));
  return message;
}

export function saveJob(job: Job) {
  return updateProfessionalState((state) => ({
    ...state,
    jobs: state.jobs.some((item) => item.id === job.id)
      ? state.jobs.map((item) =>
          item.id === job.id ? { ...job, updatedAt: now() } : item,
        )
      : [...state.jobs, job],
  }));
}

export function saveReview(review: Review) {
  return updateProfessionalState((state) => ({
    ...state,
    reviews: state.reviews.some((item) => item.id === review.id)
      ? state.reviews.map((item) =>
          item.id === review.id ? review : item,
        )
      : [review, ...state.reviews],
  }));
}

export function resetProfessionalDemo() {
  const state = emptyState();
  saveProfessionalState(state);
  return state;
}
