import type {
  DocumentKey,
  OccupancyStatus,
  OperationType,
  PropertyType,
  WizardData,
} from "@/lib/property-journey/types";

export const JOURNEY_STORAGE_KEY = "casapilot-property-journeys-v1";
export const ACTIVE_JOURNEY_STORAGE_KEY = "casapilot-active-journey-id-v1";
export const WIZARD_DRAFT_STORAGE_KEY = "casapilot-property-wizard-draft-v1";
export const JOURNEY_CHANGE_EVENT = "casapilot:journeys-changed";

export const INITIAL_WIZARD_DATA: WizardData = {
  operation: "",
  propertyType: "",
  propertyName: "",
  surface: "",
  occupancy: "",
  country: "Italia",
  city: "",
  province: "",
  address: "",
  postalCode: "",
  cadastralSheet: "",
  cadastralParcel: "",
  cadastralSubaltern: "",
  latitude: null,
  longitude: null,
  locationVerified: false,
  locationVerifiedAt: "",
  locationLabel: "",
  documents: [],
};

export const OPERATION_OPTIONS: Array<{
  id: OperationType;
  title: string;
  description: string;
  eyebrow: string;
}> = [
  {
    id: "sale",
    title: "Vendere",
    description:
      "Organizza documenti, verifiche e prossimi passaggi fino alla vendita.",
    eyebrow: "Percorso vendita",
  },
  {
    id: "rent",
    title: "Affittare",
    description:
      "Prepara immobile, documentazione e contratto per una locazione più sicura.",
    eyebrow: "Percorso affitto",
  },
];

export const PROPERTY_OPTIONS: Array<{
  id: PropertyType;
  title: string;
  description: string;
}> = [
  {
    id: "apartment",
    title: "Appartamento",
    description: "Appartamento, attico, loft o monolocale.",
  },
  {
    id: "house",
    title: "Casa o villa",
    description: "Villa, villetta o casa indipendente.",
  },
  {
    id: "commercial",
    title: "Locale commerciale",
    description: "Negozio, ufficio, laboratorio o magazzino.",
  },
  {
    id: "land",
    title: "Terreno",
    description: "Terreno edificabile, agricolo o altro appezzamento.",
  },
  {
    id: "garage",
    title: "Garage",
    description: "Box auto, posto auto o autorimessa.",
  },
];

export const OCCUPANCY_OPTIONS: Array<{
  id: OccupancyStatus;
  label: string;
}> = [
  { id: "free", label: "Libero" },
  { id: "owner", label: "Abitato dal proprietario" },
  { id: "tenant", label: "Occupato da un inquilino" },
  { id: "other", label: "Altra situazione" },
];

export type DocumentDefinition = {
  id: DocumentKey;
  title: string;
  shortTitle: string;
  description: string;
  weight: number;
  operations: OperationType[];
  propertyTypes: PropertyType[];
};

const ALL_PROPERTIES: PropertyType[] = [
  "apartment",
  "house",
  "commercial",
  "land",
  "garage",
];

const BUILDINGS: PropertyType[] = [
  "apartment",
  "house",
  "commercial",
];

export const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  {
    id: "ownership",
    title: "Atto di provenienza",
    shortTitle: "atto di provenienza",
    description: "Dimostra come e quando hai acquisito l’immobile.",
    weight: 11,
    operations: ["sale", "rent"],
    propertyTypes: ALL_PROPERTIES,
  },
  {
    id: "cadastralPlan",
    title: "Planimetria catastale",
    shortTitle: "planimetria catastale",
    description: "La rappresentazione grafica depositata al Catasto.",
    weight: 10,
    operations: ["sale", "rent"],
    propertyTypes: ALL_PROPERTIES,
  },
  {
    id: "cadastralSurvey",
    title: "Visura catastale",
    shortTitle: "visura catastale",
    description: "Contiene intestazione, rendita e principali dati catastali.",
    weight: 9,
    operations: ["sale", "rent"],
    propertyTypes: ALL_PROPERTIES,
  },
  {
    id: "energyCertificate",
    title: "Attestato di prestazione energetica",
    shortTitle: "attestato energetico",
    description: "L’APE indica la classe energetica dell’immobile.",
    weight: 9,
    operations: ["sale", "rent"],
    propertyTypes: BUILDINGS,
  },
  {
    id: "habitability",
    title: "Agibilità",
    shortTitle: "certificato di agibilità",
    description: "Documenta l’idoneità dell’immobile al suo utilizzo.",
    weight: 7,
    operations: ["sale", "rent"],
    propertyTypes: BUILDINGS,
  },
  {
    id: "systems",
    title: "Documenti degli impianti",
    shortTitle: "documenti degli impianti",
    description: "Certificazioni o dichiarazioni di conformità disponibili.",
    weight: 6,
    operations: ["sale", "rent"],
    propertyTypes: BUILDINGS,
  },
  {
    id: "condominium",
    title: "Documenti condominiali",
    shortTitle: "documenti condominiali",
    description: "Regolamento, spese e informazioni dell’amministratore.",
    weight: 5,
    operations: ["sale", "rent"],
    propertyTypes: ["apartment", "commercial", "garage"],
  },
  {
    id: "urbanCompliance",
    title: "Verifica urbanistico-catastale",
    shortTitle: "verifica urbanistico-catastale",
    description: "Aiuta a individuare difformità prima della vendita.",
    weight: 10,
    operations: ["sale"],
    propertyTypes: ALL_PROPERTIES,
  },
  {
    id: "leaseTemplate",
    title: "Bozza del contratto di locazione",
    shortTitle: "bozza del contratto",
    description: "Una base da adattare al tipo di locazione scelto.",
    weight: 8,
    operations: ["rent"],
    propertyTypes: ALL_PROPERTIES,
  },
];

export const WIZARD_STEPS = [
  {
    id: 1,
    label: "Obiettivo",
    title: "Cosa vuoi fare con l’immobile?",
    description: "Scegli il tuo obiettivo: CasaPilot adatterà automaticamente i passi successivi.",
  },
  {
    id: 2,
    label: "Immobile",
    title: "Raccontaci che immobile è",
    description: "Bastano poche informazioni per costruire un percorso utile.",
  },
  {
    id: 3,
    label: "Posizione",
    title: "Dove si trova?",
    description: "Serve per organizzare correttamente i dati e i documenti dell’immobile.",
  },
  {
    id: 4,
    label: "Documenti",
    title: "Cosa hai già disponibile?",
    description:
      "Seleziona solo i documenti che possiedi già. Potrai aggiornarli in seguito.",
  },
  {
    id: 5,
    label: "Riepilogo",
    title: "Ci siamo",
    description: "Controlla le informazioni e salva il tuo immobile.",
  },
] as const;

export function getRequiredDocuments(
  operation: OperationType | "",
  propertyType: PropertyType | "",
) {
  if (!operation || !propertyType) return [];

  return DOCUMENT_DEFINITIONS.filter(
    (document) =>
      document.operations.includes(operation) &&
      document.propertyTypes.includes(propertyType),
  );
}

export function getOperationLabel(operation: OperationType) {
  return operation === "sale" ? "Vendita" : "Affitto";
}

export function getPropertyLabel(propertyType: PropertyType) {
  return (
    PROPERTY_OPTIONS.find((option) => option.id === propertyType)?.title ??
    "Immobile"
  );
}

export function getOccupancyLabel(occupancy: OccupancyStatus | null) {
  if (!occupancy) return "Non indicata";

  return (
    OCCUPANCY_OPTIONS.find((option) => option.id === occupancy)?.label ??
    "Non indicata"
  );
}
