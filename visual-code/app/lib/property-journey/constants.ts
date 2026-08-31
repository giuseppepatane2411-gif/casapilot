import type {
  DocumentKey,
  OccupancyStatus,
  OperationType,
  PropertyType,
  RoomRentalData,
  WizardData,
} from "@/lib/property-journey/types";

export const JOURNEY_STORAGE_KEY = "casapilot-property-journeys-v1";
export const ACTIVE_JOURNEY_STORAGE_KEY = "casapilot-active-journey-id-v1";
export const WIZARD_DRAFT_STORAGE_KEY = "casapilot-property-wizard-draft-v1";
export const JOURNEY_CHANGE_EVENT = "casapilot:journeys-changed";

export const INITIAL_ROOM_RENTAL_DATA: RoomRentalData = {
  roomType: "",
  roomSurface: "",
  privateBathroom: false,
  roomFurnished: false,
  currentRoommates: "0",
  householdComposition: "not_specified",
  acceptedOccupantProfiles: [],
  genderPreference: "none",
  availableFrom: "",
  expensesIncluded: false,
  compatibilityNotes: "",
};

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
  roomRental: INITIAL_ROOM_RENTAL_DATA,
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
    id: "rent_long_term",
    title: "Affitto a lungo termine",
    description:
      "Prepara immobile, candidati, contratto e consegna per una locazione stabile.",
    eyebrow: "Locazione residenziale",
  },
  {
    id: "rent_transitory",
    title: "Affitto transitorio",
    description:
      "Organizza durata, esigenza temporanea, documenti e contratto transitorio.",
    eyebrow: "Esigenza temporanea",
  },
  {
    id: "rent_student",
    title: "Affitto a studenti",
    description:
      "Gestisci requisiti dello studente, garanzie, contratto e consegna.",
    eyebrow: "Locazione universitaria",
  },
  {
    id: "rent_room",
    title: "Affitto di una stanza",
    description:
      "Prepara stanza, convivenza, profilo compatibile, contratto e disponibilità.",
    eyebrow: "Locazione stanza",
  },
  {
    id: "rent_tourist_short",
    title: "Affitto turistico breve",
    description:
      "Verifica la conformità e organizza annuncio, prenotazioni, soggiorno e adempimenti.",
    eyebrow: "Ospitalità turistica",
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
    id: "room",
    title: "Stanza",
    description: "Stanza singola, doppia o condivisa in un immobile abitato.",
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
  "room",
];

const BUILDINGS: PropertyType[] = [
  "apartment",
  "house",
  "commercial",
  "room",
];

const ALL_RENTALS: OperationType[] = [
  "rent",
  "rent_long_term",
  "rent_transitory",
  "rent_student",
  "rent_room",
  "rent_tourist_short",
];

const RESIDENTIAL_RENTALS: OperationType[] = [
  "rent",
  "rent_long_term",
  "rent_transitory",
  "rent_student",
  "rent_room",
];

const ALL_OPERATIONS: OperationType[] = ["sale", ...ALL_RENTALS];

export const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  {
    id: "ownership",
    title: "Atto di provenienza",
    shortTitle: "atto di provenienza",
    description: "Dimostra come e quando hai acquisito l’immobile.",
    weight: 11,
    operations: ALL_OPERATIONS,
    propertyTypes: ALL_PROPERTIES,
  },
  {
    id: "cadastralPlan",
    title: "Planimetria catastale",
    shortTitle: "planimetria catastale",
    description: "La rappresentazione grafica depositata al Catasto.",
    weight: 10,
    operations: ALL_OPERATIONS,
    propertyTypes: ALL_PROPERTIES,
  },
  {
    id: "cadastralSurvey",
    title: "Visura catastale",
    shortTitle: "visura catastale",
    description: "Contiene intestazione, rendita e principali dati catastali.",
    weight: 9,
    operations: ALL_OPERATIONS,
    propertyTypes: ALL_PROPERTIES,
  },
  {
    id: "energyCertificate",
    title: "Attestato di prestazione energetica",
    shortTitle: "attestato energetico",
    description: "L’APE indica la classe energetica dell’immobile.",
    weight: 9,
    operations: ALL_OPERATIONS,
    propertyTypes: BUILDINGS,
  },
  {
    id: "habitability",
    title: "Agibilità",
    shortTitle: "certificato di agibilità",
    description: "Documenta l’idoneità dell’immobile al suo utilizzo.",
    weight: 7,
    operations: ALL_OPERATIONS,
    propertyTypes: BUILDINGS,
  },
  {
    id: "systems",
    title: "Documenti degli impianti",
    shortTitle: "documenti degli impianti",
    description: "Certificazioni o dichiarazioni di conformità disponibili.",
    weight: 6,
    operations: ALL_OPERATIONS,
    propertyTypes: BUILDINGS,
  },
  {
    id: "condominium",
    title: "Documenti condominiali",
    shortTitle: "documenti condominiali",
    description: "Regolamento, spese e informazioni dell’amministratore.",
    weight: 5,
    operations: ALL_OPERATIONS,
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
    operations: RESIDENTIAL_RENTALS,
    propertyTypes: ALL_PROPERTIES,
  },
  {
    id: "rentalAuthority",
    title: "Titolo o autorizzazione alla locazione",
    shortTitle: "titolo per la locazione",
    description:
      "Chiarisce chi può proporre l’immobile e con quale autorizzazione.",
    weight: 9,
    operations: ALL_RENTALS,
    propertyTypes: ALL_PROPERTIES,
  },
  {
    id: "transitoryReasonEvidence",
    title: "Esigenza transitoria e documentazione",
    shortTitle: "documentazione dell’esigenza transitoria",
    description:
      "Raccoglie motivo, durata ed elementi utili a verificare il percorso transitorio.",
    weight: 10,
    operations: ["rent_transitory"],
    propertyTypes: BUILDINGS,
  },
  {
    id: "studentEnrollment",
    title: "Iscrizione o percorso di studi",
    shortTitle: "documentazione dello studente",
    description:
      "Documenta iscrizione, sede e periodo del percorso di studi.",
    weight: 9,
    operations: ["rent_student"],
    propertyTypes: BUILDINGS,
  },
  {
    id: "guarantorEvidence",
    title: "Garanzia o capacità economica",
    shortTitle: "documentazione della garanzia",
    description:
      "Raccoglie gli elementi da far valutare prima della scelta del candidato.",
    weight: 9,
    operations: ["rent_student"],
    propertyTypes: BUILDINGS,
  },
  {
    id: "touristUnitCompliance",
    title: "Requisiti dell’unità per l’ospitalità",
    shortTitle: "verifica dell’unità turistica",
    description:
      "Raccoglie requisiti, eventuali registrazioni e verifiche dell’immobile.",
    weight: 11,
    operations: ["rent_tourist_short"],
    propertyTypes: BUILDINGS,
  },
  {
    id: "touristLocalRules",
    title: "Regole locali applicabili",
    shortTitle: "verifica delle regole locali",
    description:
      "Identifica gli adempimenti territoriali da confermare prima della pubblicazione.",
    weight: 10,
    operations: ["rent_tourist_short"],
    propertyTypes: BUILDINGS,
  },
  {
    id: "touristGuestReporting",
    title: "Profilo comunicazioni ospiti",
    shortTitle: "profilo comunicazioni ospiti",
    description:
      "Prepara il processo di identificazione e comunicazione da verificare con Guimmia.",
    weight: 9,
    operations: ["rent_tourist_short"],
    propertyTypes: BUILDINGS,
  },
];

export const WIZARD_STEPS = [
  {
    id: 1,
    label: "Obiettivo",
    title: "Cosa vuoi fare con l’immobile?",
    description: "Scegli il tuo obiettivo: Guimmia adatterà automaticamente i passi successivi.",
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
  const labels: Record<OperationType, string> = {
    sale: "Vendita",
    rent: "Affitto da specificare",
    rent_long_term: "Affitto a lungo termine",
    rent_transitory: "Affitto transitorio",
    rent_student: "Affitto a studenti",
    rent_room: "Affitto di una stanza",
    rent_tourist_short: "Affitto turistico breve",
  };

  return labels[operation];
}

export function isRentalOperation(operation: OperationType | "") {
  return Boolean(operation && operation !== "sale");
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
