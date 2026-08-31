import type { GuimmiaOperationType } from "@/lib/guimmia/brain/case-orchestrator/types";
import type { SiteCustomerRole } from "@/lib/guimmia/site-orchestration/types";

export const GUIMMIA_OBJECTIVE_OPTIONS = [
  { value: "Vendere", label: "Vendere un immobile", operationType: "SALE", customerRole: "OWNER" },
  { value: "Acquistare", label: "Acquistare un immobile", operationType: "SALE", customerRole: "BUYER" },
  { value: "Affittare", label: "Affittare un immobile", operationType: null, customerRole: "LANDLORD" },
  { value: "Cercare in affitto", label: "Cercare un immobile in affitto", operationType: null, customerRole: "TENANT" },
  { value: "Valutare per vendere", label: "Valutare per vendere", operationType: "SALE", customerRole: "OWNER" },
  { value: "Valutare per affittare", label: "Valutare per affittare", operationType: "RENT_LONG_TERM", customerRole: "LANDLORD" },
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  operationType: GuimmiaOperationType | null;
  customerRole: SiteCustomerRole;
}>;

export const GUIMMIA_RENTAL_OPTIONS = [
  { value: "RENT_LONG_TERM", label: "Affitto a lungo termine" },
  { value: "RENT_TRANSITORY", label: "Affitto transitorio" },
  { value: "RENT_STUDENT", label: "Affitto per studenti" },
  { value: "RENT_TOURIST_SHORT", label: "Affitto turistico breve" },
] as const;

export const GUIMMIA_PROPERTY_TYPE_OPTIONS = [
  "Appartamento",
  "Attico",
  "Villa",
  "Villetta",
  "Casa indipendente",
  "Stanza",
  "Rustico o casale",
  "Terreno",
  "Locale commerciale",
  "Ufficio",
  "Magazzino",
  "Garage o box",
] as const;

export const GUIMMIA_COUNTRY_OPTIONS = [
  "Italia",
  "Spagna",
  "Francia",
  "Svizzera",
  "Portogallo",
  "Germania",
  "Austria",
] as const;

export const GUIMMIA_CONDITION_OPTIONS = [
  "Nuovo",
  "Ristrutturato",
  "Ottimo",
  "Buono",
  "Abitabile",
  "Da ristrutturare",
] as const;

export const GUIMMIA_OCCUPANCY_OPTIONS = [
  "Libero",
  "Occupato dal proprietario",
  "Locato",
  "In costruzione",
  "Da verificare",
] as const;

export const GUIMMIA_INTAKE_FIELDS = [
  "objective",
  "operationType",
  "customerRole",
  "propertyType",
  "country",
  "city",
  "province",
  "address",
  "postalCode",
  "locationVerified",
  "surfaceSqm",
  "rooms",
  "condition",
  "occupancy",
  "notes",
] as const;

export type GuimmiaIntakeField = (typeof GUIMMIA_INTAKE_FIELDS)[number];

export function objectiveOption(value: string) {
  return GUIMMIA_OBJECTIVE_OPTIONS.find((option) => option.value === value) ?? null;
}

export function isRentalObjective(value: string) {
  return value === "Affittare" || value === "Cercare in affitto" || value === "Valutare per affittare";
}
