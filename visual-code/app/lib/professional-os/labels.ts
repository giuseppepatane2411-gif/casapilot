import type {
  DeliveryMode,
  LeadUrgency,
  OfferingActivationStatus,
  PricingMode,
  PropertyType,
} from "./types";
export {
  LANGUAGE_LABELS,
  LANGUAGE_LEVEL_LABELS,
  OWNER_PRESENCE_LABELS,
  PRESENCE_LABELS,
  REMOTE_EXECUTION_LABELS,
} from "@/lib/remote-layer/labels";

export const URGENCY_LABELS: Record<LeadUrgency, string> = {
  asap: "Il prima possibile",
  within_week: "Entro una settimana",
  within_month: "Entro un mese",
  flexible: "Senza scadenza",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Appartamento",
  house: "Casa indipendente o villa",
  commercial: "Locale commerciale",
  office: "Ufficio",
  land: "Terreno",
  condominium: "Condominio",
  garage: "Garage o deposito",
  other: "Altro",
};

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  onsite: "In presenza",
  online: "Online",
  hybrid: "Ibrido",
};

export const PRICING_MODE_LABELS: Record<PricingMode, string> = {
  fixed: "Prezzo fisso",
  starting_from: "A partire da",
  range: "Fascia di prezzo",
  hourly: "Costo orario",
  daily: "Costo giornaliero",
  per_sqm: "Prezzo al m²",
  after_inspection: "Da definire dopo sopralluogo",
};

export const OFFERING_STATUS_LABELS: Record<
  OfferingActivationStatus,
  string
> = {
  draft: "Da completare",
  pending_verification: "In verifica",
  active: "Attivo",
  limited: "Disponibilità limitata",
  paused: "In pausa",
  rejected: "Non approvato",
};
