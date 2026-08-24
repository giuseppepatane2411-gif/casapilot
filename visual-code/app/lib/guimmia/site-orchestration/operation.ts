import type { GuimmiaOperationType } from "@/lib/guimmia/brain/case-orchestrator/types";
import type { OperationType } from "@/lib/property-journey/types";
import type { GoalProgressPhaseId } from "@/lib/pilot-os/goal-progress";
import type { SiteCustomerRole } from "@/lib/guimmia/site-orchestration/types";

export const OPERATION_LABELS: Record<GuimmiaOperationType, string> = {
  SALE: "Vendita o acquisto",
  RENT_LONG_TERM: "Affitto a lungo termine",
  RENT_TRANSITORY: "Affitto transitorio",
  RENT_STUDENT: "Affitto a studenti",
  RENT_TOURIST_SHORT: "Affitto turistico breve",
};

export function toGuimmiaOperationType(
  operation: OperationType,
): GuimmiaOperationType | null {
  const mapping: Partial<Record<OperationType, GuimmiaOperationType>> = {
    sale: "SALE",
    rent_long_term: "RENT_LONG_TERM",
    rent_transitory: "RENT_TRANSITORY",
    rent_student: "RENT_STUDENT",
    rent_tourist_short: "RENT_TOURIST_SHORT",
  };

  return mapping[operation] ?? null;
}

export function toSiteOperationType(
  operation: GuimmiaOperationType,
): Exclude<OperationType, "rent"> {
  const mapping: Record<
    GuimmiaOperationType,
    Exclude<OperationType, "rent">
  > = {
    SALE: "sale",
    RENT_LONG_TERM: "rent_long_term",
    RENT_TRANSITORY: "rent_transitory",
    RENT_STUDENT: "rent_student",
    RENT_TOURIST_SHORT: "rent_tourist_short",
  };

  return mapping[operation];
}

export function detectGuimmiaOperationType(
  text: string,
): GuimmiaOperationType | null {
  const value = text
    .toLocaleLowerCase("it-IT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/(turistic|vacanz|airbnb|booking|soggiorn|affitt.*breve)/.test(value)) {
    return "RENT_TOURIST_SHORT";
  }
  if (/(student|universitar|fuori sede|corso di studi)/.test(value)) {
    return "RENT_STUDENT";
  }
  if (/(transitori|temporane|esigenza temporanea)/.test(value)) {
    return "RENT_TRANSITORY";
  }
  if (/(lungo termine|residenzial|quattro piu quattro|4\s*\+\s*4)/.test(value)) {
    return "RENT_LONG_TERM";
  }
  if (/(vend|compr|acquist|compravend)/.test(value)) {
    return "SALE";
  }

  return null;
}

export function hasGenericRentalIntent(text: string) {
  return /(affitt|locaz|inquilin|canone)/i.test(text);
}

export function detectCustomerRole(text: string): SiteCustomerRole {
  const value = text.toLocaleLowerCase("it-IT");

  if (/(voglio comprare|vorrei comprare|cerco casa|acquistare casa)/.test(value)) {
    return "BUYER";
  }
  if (/(cerco in affitto|prendere in affitto|diventare inquilino)/.test(value)) {
    return "TENANT";
  }
  if (/(sono ospite|prenotare un soggiorno)/.test(value)) {
    return "GUEST";
  }
  if (/(per conto di|rappresento|procur)/.test(value)) {
    return "REPRESENTATIVE";
  }
  if (/(voglio vendere|devo vendere|mio immobile|mia casa)/.test(value)) {
    return "OWNER";
  }
  if (/(voglio affittare|dare in affitto|locare)/.test(value)) {
    return "LANDLORD";
  }

  return "UNCONFIRMED";
}

export function phaseToPlaybookStage(
  phase: GoalProgressPhaseId,
  operation: GuimmiaOperationType | null,
) {
  if (phase === "setup") return "INTAKE";
  if (phase === "documents") {
    if (operation === "RENT_TRANSITORY") return "TRANSITORY_REASON";
    if (operation === "RENT_STUDENT") return "STUDENT_EVIDENCE";
    if (operation === "RENT_TOURIST_SHORT") return "TOURIST_COMPLIANCE";
    return "PROPERTY_READINESS";
  }
  if (phase === "preparation") return "LISTING";

  if (phase === "market") {
    if (operation === "RENT_TOURIST_SHORT") return "BOOKING";
    if (operation === "RENT_TRANSITORY" || operation === "RENT_STUDENT") {
      return "SCREENING";
    }
    return "LEADS";
  }

  if (operation === "SALE") return "OFFER";
  if (operation === "RENT_TOURIST_SHORT") return "CHECK_IN";
  return "CONTRACT";
}
