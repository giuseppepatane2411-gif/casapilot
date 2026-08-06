import {
  PROFESSIONAL_CATEGORIES,
  findService,
} from "@/lib/professionals/catalog";
import type {
  DeliveryMode,
  PropertyType,
  ServiceCapability,
  ServicePolicy,
  ServiceRequirement,
  VerificationItem,
} from "./types";

const ALL_PROPERTY_TYPES: PropertyType[] = [
  "apartment",
  "house",
  "commercial",
  "office",
  "land",
  "condominium",
  "garage",
  "other",
];

const CATEGORY_CAPABILITIES: Record<string, ServiceCapability[]> = {
  "documenti-conformita": [
    { id: "inspection", label: "Sopralluogo tecnico" },
    { id: "records_access", label: "Accesso agli atti" },
    { id: "survey", label: "Rilievo metrico" },
    { id: "cadastre", label: "Pratiche catastali" },
    { id: "municipal", label: "Pratiche comunali" },
    { id: "signed_report", label: "Relazione tecnica firmata" },
    { id: "urgent", label: "Gestione urgenze" },
  ],
  "vendita-intermediazione": [
    { id: "valuation", label: "Valutazione comparativa" },
    { id: "sales_plan", label: "Piano di vendita" },
    { id: "visits", label: "Gestione visite" },
    { id: "negotiation", label: "Negoziazione" },
    { id: "offer_review", label: "Verifica proposte" },
    { id: "closing_support", label: "Assistenza fino alla firma" },
    { id: "international", label: "Clientela internazionale" },
  ],
  "affitto-gestione": [
    { id: "tenant_screening", label: "Selezione inquilini" },
    { id: "documents_check", label: "Verifica documentale" },
    { id: "contracts", label: "Contrattualistica" },
    { id: "registration", label: "Registrazione contratto" },
    { id: "payments", label: "Gestione pagamenti" },
    { id: "checkin", label: "Check-in e check-out" },
    { id: "maintenance", label: "Gestione manutenzioni" },
  ],
  "legale-notarile-fiscale": [
    { id: "online_consultation", label: "Consulenza online" },
    { id: "document_review", label: "Revisione documenti" },
    { id: "drafting", label: "Redazione atti" },
    { id: "representation", label: "Rappresentanza" },
    { id: "mediation", label: "Mediazione" },
    { id: "urgent", label: "Gestione urgenze" },
    { id: "international", label: "Consulenza internazionale" },
  ],
  "presentazione-valorizzazione": [
    { id: "photos", label: "Fotografie" },
    { id: "video", label: "Video" },
    { id: "drone", label: "Drone" },
    { id: "virtual_tour", label: "Virtual tour" },
    { id: "staging", label: "Home staging" },
    { id: "render", label: "Render" },
    { id: "fast_delivery", label: "Consegna rapida" },
  ],
  "lavori-manutenzione": [
    { id: "inspection", label: "Sopralluogo" },
    { id: "labor", label: "Manodopera" },
    { id: "materials", label: "Fornitura materiali" },
    { id: "emergency", label: "Pronto intervento" },
    { id: "disposal", label: "Smaltimento" },
    { id: "site_management", label: "Direzione lavori" },
    { id: "warranty", label: "Garanzia sul lavoro" },
  ],
  "pulizia-sgombero-trasloco": [
    { id: "supplies", label: "Materiali inclusi" },
    { id: "authorized_disposal", label: "Smaltimento autorizzato" },
    { id: "packing", label: "Imballaggio" },
    { id: "assembly", label: "Smontaggio e rimontaggio" },
    { id: "urgent", label: "Intervento urgente" },
    { id: "post_work", label: "Pulizia post-cantiere" },
    { id: "storage", label: "Custodia temporanea" },
  ],
  "finanza-assicurazioni-amministrazione": [
    { id: "online_consultation", label: "Consulenza online" },
    { id: "comparison", label: "Confronto offerte" },
    { id: "full_case", label: "Gestione pratica completa" },
    { id: "document_support", label: "Assistenza documentale" },
    { id: "urgent", label: "Gestione urgenze" },
    { id: "international", label: "Clientela internazionale" },
  ],
};

const CATEGORY_DELIVERY: Record<string, DeliveryMode[]> = {
  "documenti-conformita": ["onsite", "hybrid"],
  "vendita-intermediazione": ["onsite", "hybrid", "online"],
  "affitto-gestione": ["onsite", "hybrid", "online"],
  "legale-notarile-fiscale": ["online", "hybrid", "onsite"],
  "presentazione-valorizzazione": ["onsite", "hybrid", "online"],
  "lavori-manutenzione": ["onsite", "hybrid"],
  "pulizia-sgombero-trasloco": ["onsite"],
  "finanza-assicurazioni-amministrazione": ["online", "hybrid", "onsite"],
};

function requirement(
  id: string,
  label: string,
  acceptedVerificationTypes: VerificationItem["type"][],
  required = true,
  description = "",
): ServiceRequirement {
  return {
    id,
    label,
    description,
    required,
    acceptedVerificationTypes,
  };
}

const SERVICE_OVERRIDES: Record<
  string,
  Partial<ServicePolicy> & { requirements?: ServiceRequirement[] }
> = {
  "certificazione-energetica": {
    regulated: true,
    allowedDeliveryModes: ["onsite"],
    requirements: [
      requirement(
        "professional_register",
        "Abilitazione professionale compatibile",
        ["professional_register", "license"],
      ),
      requirement(
        "insurance",
        "Assicurazione professionale",
        ["insurance"],
        false,
      ),
    ],
    defaultCapabilities: [
      { id: "inspection", label: "Sopralluogo" },
      { id: "ape_release", label: "Rilascio APE" },
      { id: "urgent", label: "Gestione urgenze" },
    ],
  },
  "riprese-drone": {
    regulated: true,
    allowedDeliveryModes: ["onsite"],
    requirements: [
      requirement(
        "drone_license",
        "Abilitazione operatore drone",
        ["drone_license", "license"],
      ),
      requirement(
        "insurance",
        "Copertura assicurativa",
        ["insurance"],
        false,
      ),
    ],
    defaultCapabilities: [
      { id: "photo_drone", label: "Fotografie aeree" },
      { id: "video_drone", label: "Video aereo" },
      { id: "editing", label: "Montaggio video" },
    ],
  },
  "assistenza-notarile": {
    regulated: true,
    requirements: [
      requirement(
        "professional_register",
        "Iscrizione professionale verificata",
        ["professional_register"],
      ),
    ],
  },
  "consulenza-legale": {
    regulated: true,
    requirements: [
      requirement(
        "professional_register",
        "Iscrizione all'albo",
        ["professional_register"],
      ),
      requirement(
        "insurance",
        "Assicurazione professionale",
        ["insurance"],
        false,
      ),
    ],
  },
  "sfratti-recupero": {
    regulated: true,
    requirements: [
      requirement(
        "professional_register",
        "Iscrizione all'albo",
        ["professional_register"],
      ),
    ],
  },
  "consulenza-mutuo": {
    regulated: true,
    requirements: [
      requirement(
        "license",
        "Abilitazione o iscrizione richiesta",
        ["license", "professional_register"],
      ),
    ],
  },
  "impianto-elettrico": {
    regulated: true,
    allowedDeliveryModes: ["onsite"],
    requirements: [
      requirement(
        "license",
        "Abilitazione impiantistica",
        ["license", "certification"],
      ),
    ],
  },
  "impianto-idraulico": {
    regulated: true,
    allowedDeliveryModes: ["onsite"],
    requirements: [
      requirement(
        "license",
        "Abilitazione impiantistica",
        ["license", "certification"],
      ),
    ],
  },
};

const DEFAULT_QUOTE_TEMPLATE = [
  "Prezzo o fascia di prezzo",
  "IVA inclusa o esclusa",
  "Attività comprese",
  "Attività escluse",
  "Tempi previsti",
  "Prima disponibilità",
  "Validità",
  "Possibili costi aggiuntivi",
];

const DEFAULT_REVIEW_CRITERIA = [
  "Chiarezza del preventivo",
  "Comunicazione",
  "Rispetto dei tempi",
  "Qualità del servizio",
  "Rapporto qualità-prezzo",
];

export function getServicePolicy(serviceId: string): ServicePolicy {
  const service = findService(serviceId);
  if (!service) {
    throw new Error(`Servizio non trovato: ${serviceId}`);
  }

  const override = SERVICE_OVERRIDES[serviceId];
  const categoryCapabilities =
    CATEGORY_CAPABILITIES[service.categoryId] ?? [];

  return {
    serviceId,
    regulated: override?.regulated ?? false,
    compatibleProfessions:
      override?.compatibleProfessions ?? service.eligibleProfessions,
    requirements: override?.requirements ?? [],
    defaultCapabilities:
      override?.defaultCapabilities ?? categoryCapabilities,
    allowedDeliveryModes:
      override?.allowedDeliveryModes ??
      CATEGORY_DELIVERY[service.categoryId] ??
      ["onsite"],
    supportedPropertyTypes:
      override?.supportedPropertyTypes ?? ALL_PROPERTY_TYPES,
    quoteTemplate: override?.quoteTemplate ?? DEFAULT_QUOTE_TEMPLATE,
    reviewCriteria:
      override?.reviewCriteria ?? DEFAULT_REVIEW_CRITERIA,
  };
}

function normalise(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PROFESSION_SYNONYMS: Record<string, string[]> = {
  geometra: ["geometra", "tecnico catastale"],
  architetto: ["architetto", "studio architettura"],
  ingegnere: ["ingegnere", "studio ingegneria"],
  avvocato: ["avvocato", "legale"],
  notaio: ["notaio", "studio notarile"],
  commercialista: ["commercialista", "consulente fiscale"],
  fotografo: ["fotografo", "fotografo immobiliare"],
  agente: ["agente immobiliare", "agenzia immobiliare"],
  impresa: ["impresa", "impresa edile", "ditta"],
};

export function professionCompatibility(
  profession: string,
  compatibleProfessions: string[],
) {
  const current = normalise(profession);
  const candidates = compatibleProfessions.map(normalise);

  if (
    candidates.some(
      (candidate) =>
        current.includes(candidate) || candidate.includes(current),
    )
  ) {
    return "compatible" as const;
  }

  for (const synonyms of Object.values(PROFESSION_SYNONYMS)) {
    const normalisedSynonyms = synonyms.map(normalise);
    const currentInGroup = normalisedSynonyms.some(
      (item) => current.includes(item) || item.includes(current),
    );
    const candidateInGroup = candidates.some((candidate) =>
      normalisedSynonyms.some(
        (item) =>
          candidate.includes(item) || item.includes(candidate),
      ),
    );
    if (currentInGroup && candidateInGroup) {
      return "compatible" as const;
    }
  }

  return "requires_review" as const;
}

export function categoryPolicySummary(categoryId: string) {
  const category = PROFESSIONAL_CATEGORIES.find(
    (item) => item.id === categoryId,
  );
  if (!category) return null;

  const policies = category.services.map((service) =>
    getServicePolicy(service.id),
  );

  return {
    serviceCount: policies.length,
    regulatedCount: policies.filter((policy) => policy.regulated).length,
    modes: Array.from(
      new Set(policies.flatMap((policy) => policy.allowedDeliveryModes)),
    ),
  };
}
