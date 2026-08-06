import type {
  CommunicationPreference,
  ContentSensitivity,
  LanguageCode,
  TranslationResult,
} from "./types";

const LEGAL_TERMS = [
  "contratto",
  "clausola",
  "procura",
  "delega",
  "atto",
  "notaio",
  "successione",
  "sfratto",
  "diffida",
  "responsabilita",
  "responsabilità",
  "firma",
  "agreement",
  "contract",
  "power of attorney",
  "legal",
  "vertrag",
  "vollmacht",
  "contrat",
  "procuration",
  "contrato",
  "poder notarial",
];

const FINANCIAL_TERMS = [
  "iva",
  "imposta",
  "tassa",
  "saldo",
  "acconto",
  "mutuo",
  "interesse",
  "commissione",
  "payment",
  "tax",
  "mortgage",
  "zahlung",
  "steuer",
  "paiement",
  "impôt",
  "pago",
  "impuesto",
];

const OFFICIAL_DOCUMENT_TERMS = [
  "documento ufficiale",
  "copia conforme",
  "certificato originale",
  "atto firmato",
  "documento firmato",
  "official document",
  "signed document",
  "certified copy",
  "amtliches dokument",
  "document officiel",
  "documento oficial",
];

const TECHNICAL_TERMS = [
  "visura",
  "catasto",
  "planimetria",
  "urbanistica",
  "difformita",
  "difformità",
  "ape",
  "agibilita",
  "agibilità",
  "impianto",
  "sopralluogo",
  "cadastral",
  "floor plan",
  "planning compliance",
  "inspection",
  "kataster",
  "grundriss",
  "cadastre",
  "plan cadastral",
];

function includesAny(text: string, values: string[]) {
  const normalized = text.toLowerCase();
  return values.some((value) => normalized.includes(value));
}

export function classifyContentSensitivity(text: string): ContentSensitivity {
  if (includesAny(text, OFFICIAL_DOCUMENT_TERMS)) return "official_document";
  if (includesAny(text, LEGAL_TERMS)) return "legal";
  if (includesAny(text, FINANCIAL_TERMS)) return "financial";
  if (includesAny(text, TECHNICAL_TERMS)) return "technical";
  return "routine";
}

export function translationPolicyFor(
  sensitivity: ContentSensitivity,
  preference: CommunicationPreference = "automatic",
) {
  if (preference === "direct_only") {
    return {
      translate: false,
      reviewRequired: false,
      originalMustRemainVisible: true,
      notice: "L'utente ha scelto comunicazioni dirette senza traduzione automatica.",
    };
  }

  if (sensitivity === "official_document") {
    return {
      translate: false,
      reviewRequired: true,
      originalMustRemainVisible: true,
      notice:
        "Il documento ufficiale non viene sostituito da una traduzione automatica. Mostrare l'originale e richiedere una traduzione professionale quando necessario.",
    };
  }

  if (sensitivity === "legal" || sensitivity === "financial") {
    return {
      translate: true,
      reviewRequired: true,
      originalMustRemainVisible: true,
      notice:
        "Traduzione informativa: per decisioni legali o economiche deve essere verificato anche il testo originale.",
    };
  }

  if (sensitivity === "technical") {
    return {
      translate: true,
      reviewRequired: false,
      originalMustRemainVisible: true,
      notice:
        "Traduzione tecnica informativa. I termini immobiliari principali restano consultabili anche in italiano.",
    };
  }

  return {
    translate: true,
    reviewRequired: false,
    originalMustRemainVisible: preference !== "translation_allowed",
    notice: "Traduzione automatica della conversazione.",
  };
}

export function communicationCompatible({
  ownerLanguage,
  professionalLanguages,
  translationEnabled,
  communicationPreference = "automatic",
}: {
  ownerLanguage: LanguageCode;
  professionalLanguages: LanguageCode[];
  translationEnabled: boolean;
  communicationPreference?: CommunicationPreference;
}) {
  const commonLanguage = professionalLanguages.includes(ownerLanguage);

  if (commonLanguage) {
    return {
      compatible: true,
      direct: true,
      blocker: false,
      scoreBonus: 7,
      reason: "Lingua in comune",
    };
  }

  if (communicationPreference === "direct_only") {
    return {
      compatible: false,
      direct: false,
      blocker: true,
      scoreBonus: 0,
      reason: "L'utente richiede una lingua in comune",
    };
  }

  if (translationEnabled) {
    return {
      compatible: true,
      direct: false,
      blocker: false,
      scoreBonus: 2,
      reason: "Traduzione di Pilot disponibile",
    };
  }

  return {
    compatible: true,
    direct: false,
    blocker: false,
    scoreBonus: 0,
    reason: "Comunicazione da concordare",
  };
}

export function applyTranslationPolicy(
  result: TranslationResult,
  preference: CommunicationPreference = "automatic",
): TranslationResult {
  const sensitivity =
    result.contentSensitivity ?? classifyContentSensitivity(result.originalText);
  const policy = translationPolicyFor(sensitivity, preference);

  if (!policy.translate) {
    return {
      ...result,
      translatedText: undefined,
      status: sensitivity === "official_document" ? "original_only" : result.status,
      method: "none",
      contentSensitivity: sensitivity,
      reviewRequired: policy.reviewRequired,
      notice: policy.notice,
    };
  }

  return {
    ...result,
    contentSensitivity: sensitivity,
    reviewRequired: policy.reviewRequired,
    status:
      policy.reviewRequired && result.status === "translated"
        ? "needs_review"
        : result.status,
    notice: policy.notice,
  };
}
