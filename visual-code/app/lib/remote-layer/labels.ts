import type {
  LanguageCode,
  LanguageLevel,
  OwnerPresenceRequirement,
  PresenceAvailability,
  RemoteExecutionLevel,
} from "./types";

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  it: "Italiano",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
};

export const LANGUAGE_LEVEL_LABELS: Record<LanguageLevel, string> = {
  basic: "Base",
  intermediate: "Intermedio",
  advanced: "Avanzato",
  native: "Madrelingua",
};

export const PRESENCE_LABELS: Record<PresenceAvailability, string> = {
  available: "Posso essere presente",
  specific_dates: "Solo in alcune date",
  remote_only: "Non posso essere presente",
  local_contact: "Ho una persona di fiducia sul posto",
};

export const REMOTE_EXECUTION_LABELS: Record<RemoteExecutionLevel, string> = {
  none: "Richiede gestione in presenza",
  consultation_only: "Solo consulenza a distanza",
  mostly_remote: "Quasi tutto gestibile a distanza",
  fully_remote: "Completamente gestibile a distanza",
};

export const OWNER_PRESENCE_LABELS: Record<OwnerPresenceRequirement, string> = {
  never: "La presenza del proprietario non serve",
  sometimes: "Può servire in alcune fasi",
  required: "La presenza del proprietario è necessaria",
};

export const COUNTRY_OPTIONS = [
  "Italia",
  "Germania",
  "Francia",
  "Spagna",
  "Regno Unito",
  "Svizzera",
  "Stati Uniti",
  "Canada",
  "Altro",
];

export const SUPPORTED_LANGUAGES = Object.keys(
  LANGUAGE_LABELS,
) as LanguageCode[];
