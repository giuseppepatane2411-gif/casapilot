import { applyTranslationPolicy, classifyContentSensitivity } from "./policy";
import type {
  CommunicationPreference,
  GlossaryReference,
  LanguageCode,
  TranslationRequestInput,
  TranslationResult,
} from "./types";

const EXACT_TRANSLATIONS: Record<
  string,
  Partial<Record<LanguageCode, string>>
> = {
  "Per iniziare mi servono la visura catastale, la planimetria e l'atto di provenienza.": {
    en: "To begin, I need the cadastral record, the floor plan and the title deed.",
    de: "Zu Beginn benötige ich den Katasterauszug, den Grundriss und den Eigentumsnachweis.",
    fr: "Pour commencer, j'ai besoin du relevé cadastral, du plan et du titre de propriété.",
    es: "Para empezar, necesito la nota catastral, el plano y el título de propiedad.",
  },
  "Possiamo programmare il sopralluogo la prossima settimana.": {
    en: "We can schedule the inspection next week.",
    de: "Wir können die Besichtigung für nächste Woche planen.",
    fr: "Nous pouvons programmer la visite la semaine prochaine.",
    es: "Podemos programar la visita la próxima semana.",
  },
  "Vivo all'estero e non posso essere presente presso l'immobile.": {
    en: "I live abroad and I cannot be present at the property.",
    de: "Ich lebe im Ausland und kann nicht vor Ort sein.",
    fr: "Je vis à l'étranger et je ne peux pas être présent sur place.",
    es: "Vivo en el extranjero y no puedo estar presente en el inmueble.",
  },
};

const TERM_TRANSLATIONS: Record<
  LanguageCode,
  Record<string, { translation: string; explanation?: string }>
> = {
  it: {
    "cadastral record": { translation: "visura catastale" },
    "floor plan": { translation: "planimetria catastale" },
    "title deed": { translation: "atto di provenienza" },
    inspection: { translation: "sopralluogo" },
    "power of attorney": { translation: "procura" },
  },
  en: {
    "visura catastale": {
      translation: "cadastral record",
      explanation: "A record showing how the property is registered in the Italian cadastre.",
    },
    "planimetria catastale": { translation: "cadastral floor plan" },
    planimetria: { translation: "floor plan" },
    "atto di provenienza": { translation: "title deed" },
    sopralluogo: { translation: "inspection" },
    procura: { translation: "power of attorney" },
    "conformità urbanistica": { translation: "planning compliance" },
  },
  de: {
    "visura catastale": { translation: "Katasterauszug" },
    "planimetria catastale": { translation: "Katastergrundriss" },
    planimetria: { translation: "Grundriss" },
    "atto di provenienza": { translation: "Eigentumsnachweis" },
    sopralluogo: { translation: "Besichtigung" },
    procura: { translation: "Vollmacht" },
    "conformità urbanistica": { translation: "baurechtliche Konformität" },
  },
  fr: {
    "visura catastale": { translation: "relevé cadastral" },
    "planimetria catastale": { translation: "plan cadastral" },
    planimetria: { translation: "plan" },
    "atto di provenienza": { translation: "titre de propriété" },
    sopralluogo: { translation: "visite technique" },
    procura: { translation: "procuration" },
    "conformità urbanistica": { translation: "conformité urbanistique" },
  },
  es: {
    "visura catastale": { translation: "nota catastral" },
    "planimetria catastale": { translation: "plano catastral" },
    planimetria: { translation: "plano" },
    "atto di provenienza": { translation: "título de propiedad" },
    sopralluogo: { translation: "visita técnica" },
    procura: { translation: "poder notarial" },
    "conformità urbanistica": { translation: "conformidad urbanística" },
  },
};

export function detectLanguage(text: string): LanguageCode {
  const value = ` ${text.toLowerCase()} `;
  if (/\b(ich|und|nicht|der|die|das|ausland|immobilie)\b/.test(value)) return "de";
  if (/\b(the|and|need|property|abroad|cannot|inspection|owner)\b/.test(value)) return "en";
  if (/\b(je|et|pas|propriété|étranger|besoin|visite)\b/.test(value)) return "fr";
  if (/\b(yo|y|no|propiedad|extranjero|necesito|visita)\b/.test(value)) return "es";
  return "it";
}

function glossaryTranslation(
  originalText: string,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
): TranslationResult {
  let translated = originalText;
  const references: GlossaryReference[] = [];

  for (const [source, target] of Object.entries(
    TERM_TRANSLATIONS[targetLanguage],
  ).sort(([left], [right]) => right.length - left.length)) {
    const expression = new RegExp(
      source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi",
    );
    if (!expression.test(translated)) continue;

    translated = translated.replace(expression, target.translation);
    references.push({
      term: source,
      sourceLanguage,
      targetLanguage,
      explanation: target.explanation,
    });
  }

  if (references.length === 0) {
    return {
      sourceLanguage,
      targetLanguage,
      originalText,
      status: "provider_required",
      method: "none",
      quality: "unknown",
      contentSensitivity: classifyContentSensitivity(originalText),
      glossaryReferences: [],
    };
  }

  return {
    sourceLanguage,
    targetLanguage,
    originalText,
    translatedText: translated,
    status: "demo_translation",
    method: "local_glossary",
    quality: "low",
    contentSensitivity: classifyContentSensitivity(originalText),
    glossaryReferences: references,
  };
}

export function translateLocally(
  originalText: string,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  communicationPreference: CommunicationPreference = "automatic",
): TranslationResult {
  const sensitivity = classifyContentSensitivity(originalText);

  if (sourceLanguage === targetLanguage) {
    return applyTranslationPolicy(
      {
        sourceLanguage,
        targetLanguage,
        originalText,
        translatedText: originalText,
        status: "same_language",
        method: "same_language",
        quality: "high",
        contentSensitivity: sensitivity,
        glossaryReferences: [],
      },
      communicationPreference,
    );
  }

  const exact = EXACT_TRANSLATIONS[originalText]?.[targetLanguage];
  if (exact) {
    return applyTranslationPolicy(
      {
        sourceLanguage,
        targetLanguage,
        originalText,
        translatedText: exact,
        status: "demo_translation",
        method: "local_glossary",
        quality: "medium",
        contentSensitivity: sensitivity,
        glossaryReferences: [],
      },
      communicationPreference,
    );
  }

  return applyTranslationPolicy(
    glossaryTranslation(originalText, sourceLanguage, targetLanguage),
    communicationPreference,
  );
}

export async function requestTranslation(
  originalTextOrInput: string | TranslationRequestInput,
  sourceLanguage?: LanguageCode,
  targetLanguage?: LanguageCode,
  communicationPreference: CommunicationPreference = "automatic",
): Promise<TranslationResult> {
  const input: TranslationRequestInput =
    typeof originalTextOrInput === "string"
      ? {
          originalText: originalTextOrInput,
          sourceLanguage: sourceLanguage ?? detectLanguage(originalTextOrInput),
          targetLanguage: targetLanguage ?? "it",
        }
      : originalTextOrInput;

  const local = translateLocally(
    input.originalText,
    input.sourceLanguage,
    input.targetLanguage,
    communicationPreference,
  );

  if (
    local.status !== "provider_required" ||
    local.contentSensitivity === "official_document"
  ) {
    return local;
  }

  try {
    const response = await fetch("/api/pilot/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...input,
        contentSensitivity:
          input.contentSensitivity ?? local.contentSensitivity,
        communicationPreference,
      }),
    });

    if (!response.ok) return local;
    return (await response.json()) as TranslationResult;
  } catch {
    return local;
  }
}
