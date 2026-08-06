import type {
  LeadRequest,
  ProfessionalProfile,
  Quote,
  Review,
} from "./types";
import { calculateLeadScore } from "./engine";
import { defaultOwnerRemotePreferences } from "@/lib/remote-layer/repository";

const K = {
  leads: "casapilot_v69_leads",
  quotes: "casapilot_v69_quotes",
  profile: "casapilot_v69_profile",
  reviews: "casapilot_v69_reviews",
};

const now = () => new Date().toISOString();
const id = (prefix: string) =>
  `${prefix}_${
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  }`;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

function migrateLead(lead: LeadRequest): LeadRequest {
  if (lead.remoteContext) return lead;
  const preferences = defaultOwnerRemotePreferences();
  return {
    ...lead,
    remoteContext: {
      ownerLanguage: preferences.preferredLanguage,
      countryOfResidence: preferences.countryOfResidence,
      timezone: preferences.timezone,
      presenceAvailability: preferences.presenceAvailability,
      localContactAvailable: preferences.localContactAvailable,
      localContactRole: preferences.localContactRole,
      translationEnabled: preferences.translationEnabled,
      translationConsent: preferences.translationConsent,
      communicationPreference: preferences.communicationPreference,
      showOriginalByDefault: preferences.showOriginalByDefault,
      videoCallPreferred: preferences.videoCallPreferred,
      preferredContactWindows: preferences.preferredContactWindows,
    },
  };
}

export function seed() {
  if (typeof window === "undefined") return;

  if (!localStorage.getItem(K.leads)) {
    write(K.leads, [
      {
        id: "lead_demo_foto",
        ownerId: "demo-owner",
        categoryId: "presentazione-valorizzazione",
        serviceId: "fotografia-immobiliare",
        propertyLabel: "Villa con giardino",
        location: "Acireale",
        answers: {
          purpose: "sale",
          media: ["photos", "video", "drone"],
          rooms: "8",
        },
        urgency: "Entro una settimana",
        budget: "250–500 €",
        notes: "Preferenza per servizio al tramonto.",
        remoteContext: {
          ownerLanguage: "de",
          countryOfResidence: "Germania",
          timezone: "Europe/Berlin",
          presenceAvailability: "remote_only",
          localContactAvailable: false,
          localContactRole: "",
          translationEnabled: true,
          translationConsent: true,
          communicationPreference: "automatic",
          showOriginalByDefault: true,
          videoCallPreferred: true,
          preferredContactWindows: [],
        },
        status: "quote_received",
        leadScore: 92,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "lead_demo_tecnico",
        ownerId: "demo-owner",
        categoryId: "documenti-conformita",
        serviceId: "verifica-catastale-urbanistica",
        propertyLabel: "Appartamento in Via Roma 24",
        location: "Catania, centro",
        answers: {
          problem: "plan",
          documents: ["floorplan", "cadastral"],
          changes: "yes_unknown",
        },
        urgency: "Entro un mese",
        budget: "Da definire",
        notes: "La cucina è stata spostata.",
        remoteContext: {
          ownerLanguage: "en",
          countryOfResidence: "Regno Unito",
          timezone: "Europe/London",
          presenceAvailability: "local_contact",
          localContactAvailable: true,
          localContactRole: "Familiare",
          translationEnabled: true,
          translationConsent: true,
          communicationPreference: "direct_preferred",
          showOriginalByDefault: true,
          videoCallPreferred: false,
          preferredContactWindows: [],
        },
        status: "matched",
        leadScore: 83,
        createdAt: now(),
        updatedAt: now(),
      },
    ] satisfies LeadRequest[]);
  } else {
    write(K.leads, read<LeadRequest[]>(K.leads, []).map(migrateLead));
  }

  if (!localStorage.getItem(K.quotes)) {
    write(K.quotes, [
      {
        id: "quote_demo_1",
        leadId: "lead_demo_foto",
        professionalId: "pro_luce",
        professionalName: "LuceCasa Studio",
        professionalTitle: "Fotografia immobiliare",
        verified: true,
        rating: 4.9,
        reviewsCount: 18,
        priceType: "fixed",
        priceMin: 390,
        vatIncluded: true,
        included: [
          "30 fotografie professionali",
          "Video verticale",
          "Riprese drone",
          "Consegna ottimizzata",
        ],
        excluded: ["Home staging"],
        additionalCosts: "Nessun costo aggiuntivo previsto.",
        firstAvailability: "Tra 4 giorni",
        estimatedDuration: "Consegna entro 48 ore",
        validUntil: "7 giorni",
        message: "Possiamo lavorare al tramonto.",
        remoteSupport: {
          remoteExecutionLevel: "mostly_remote",
          ownerPresenceRequired: false,
          videoCallAvailable: true,
          photoReportAvailable: true,
          delegationSupported: true,
          spokenLanguages: ["it", "en", "de"],
        },
        status: "sent",
        createdAt: now(),
      },
      {
        id: "quote_demo_2",
        leadId: "lead_demo_foto",
        professionalId: "pro_frame",
        professionalName: "Frame Immobiliare",
        professionalTitle: "Fotografo e videomaker",
        verified: true,
        rating: 4.7,
        reviewsCount: 31,
        priceType: "fixed",
        priceMin: 320,
        vatIncluded: false,
        included: [
          "25 fotografie professionali",
          "Video orizzontale",
          "Consegna ottimizzata",
        ],
        excluded: ["Drone"],
        additionalCosts: "Drone con supplemento di 90 €.",
        firstAvailability: "Domani",
        estimatedDuration: "Consegna entro 72 ore",
        validUntil: "10 giorni",
        message: "Posso intervenire rapidamente.",
        remoteSupport: {
          remoteExecutionLevel: "mostly_remote",
          ownerPresenceRequired: false,
          videoCallAvailable: false,
          photoReportAvailable: true,
          delegationSupported: false,
          spokenLanguages: ["it"],
        },
        status: "sent",
        createdAt: now(),
      },
    ] satisfies Quote[]);
  }
}

export function getLeads() {
  seed();
  return read<LeadRequest[]>(K.leads, []).map(migrateLead);
}

export function getLead(leadId: string) {
  return getLeads().find((item) => item.id === leadId);
}

export function createLead(
  input: Omit<LeadRequest, "id" | "createdAt" | "updatedAt" | "leadScore">,
) {
  const lead: LeadRequest = {
    ...input,
    id: id("lead"),
    leadScore: calculateLeadScore(input),
    createdAt: now(),
    updatedAt: now(),
  };
  write(K.leads, [lead, ...getLeads()]);
  return lead;
}

export function updateLead(leadId: string, patch: Partial<LeadRequest>) {
  const values = getLeads().map((item) =>
    item.id === leadId ? { ...item, ...patch, updatedAt: now() } : item,
  );
  write(K.leads, values);
  return values.find((item) => item.id === leadId);
}

export function getQuotes(leadId?: string) {
  seed();
  const values = read<Quote[]>(K.quotes, []);
  return leadId
    ? values.filter((item) => item.leadId === leadId)
    : values;
}

export function createQuote(input: Omit<Quote, "id" | "createdAt">) {
  const quote: Quote = { ...input, id: id("quote"), createdAt: now() };
  write(K.quotes, [quote, ...getQuotes()]);
  updateLead(input.leadId, { status: "quote_received" });
  return quote;
}

export function acceptQuote(quoteId: string) {
  const values = getQuotes();
  const selected = values.find((item) => item.id === quoteId);
  if (!selected) return;
  write(
    K.quotes,
    values.map((item) =>
      item.leadId !== selected.leadId
        ? item
        : {
            ...item,
            status: item.id === quoteId ? "accepted" : "rejected",
          },
    ),
  );
  updateLead(selected.leadId, { status: "contacts_unlocked" });
}

export function getProfile() {
  return read<ProfessionalProfile | null>(K.profile, null);
}

export function saveProfile(
  input: Omit<ProfessionalProfile, "id" | "updatedAt">,
) {
  const current = getProfile();
  const value = {
    ...input,
    id: current?.id ?? id("pro"),
    updatedAt: now(),
  };
  write(K.profile, value);
  return value;
}

export function getReviews() {
  return read<Review[]>(K.reviews, []);
}

export function createReview(
  input: Omit<Review, "id" | "verified" | "createdAt">,
) {
  const value: Review = {
    ...input,
    id: id("review"),
    verified: true,
    createdAt: now(),
  };
  write(K.reviews, [value, ...getReviews()]);
  updateLead(input.leadId, { status: "job_completed" });
  return value;
}
