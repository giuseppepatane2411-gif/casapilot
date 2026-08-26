import "server-only";

import { redactCustomerText } from "@/lib/guimmia/brain/case-orchestrator/redaction";
import type { GuimmiaOperationType } from "@/lib/guimmia/brain/case-orchestrator/types";
import {
  GUIMMIA_CONDITION_OPTIONS,
  GUIMMIA_COUNTRY_OPTIONS,
  GUIMMIA_INTAKE_FIELDS,
  GUIMMIA_OBJECTIVE_OPTIONS,
  GUIMMIA_OCCUPANCY_OPTIONS,
  GUIMMIA_PROPERTY_TYPE_OPTIONS,
  GUIMMIA_RENTAL_OPTIONS,
  objectiveOption,
  type GuimmiaIntakeField,
} from "@/lib/guimmia/intake/options";
import type { GuimmiaBrainConversationMessage, GuimmiaBrainUsage } from "@/lib/guimmia/openai/brain-types";
import {
  getOpenAIConfiguration,
  GUIMMIA_INTAKE_MAX_OUTPUT_TOKENS,
} from "@/lib/guimmia/openai/config";
import type {
  GuimmiaIntakeDraft,
  GuimmiaIntakePatch,
} from "@/lib/guimmia/openai/intake-types";
import type { SiteCustomerRole } from "@/lib/guimmia/site-orchestration/types";

const nullableEnum = (values: readonly string[]) => ({
  type: ["string", "null"],
  enum: [...values, null],
});

const intakeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    objective: nullableEnum(GUIMMIA_OBJECTIVE_OPTIONS.map((item) => item.value)),
    operationType: nullableEnum([
      "SALE",
      ...GUIMMIA_RENTAL_OPTIONS.map((item) => item.value),
    ]),
    customerRole: nullableEnum([
      "OWNER",
      "SELLER",
      "BUYER",
      "LANDLORD",
      "TENANT",
      "GUEST",
      "REPRESENTATIVE",
      "UNCONFIRMED",
    ]),
    propertyType: nullableEnum(GUIMMIA_PROPERTY_TYPE_OPTIONS),
    country: nullableEnum(GUIMMIA_COUNTRY_OPTIONS),
    city: { type: ["string", "null"] },
    province: { type: ["string", "null"] },
    address: { type: ["string", "null"] },
    postalCode: { type: ["string", "null"] },
    surfaceSqm: { type: ["number", "null"] },
    rooms: { type: ["number", "null"] },
    condition: nullableEnum(GUIMMIA_CONDITION_OPTIONS),
    occupancy: nullableEnum(GUIMMIA_OCCUPANCY_OPTIONS),
    notes: { type: ["string", "null"] },
    assistantMessage: { type: "string" },
    missingField: nullableEnum(GUIMMIA_INTAKE_FIELDS),
    quickReplies: {
      type: "array",
      maxItems: 6,
      items: { type: "string" },
    },
  },
  required: [
    "objective",
    "operationType",
    "customerRole",
    "propertyType",
    "country",
    "city",
    "province",
    "address",
    "postalCode",
    "surfaceSqm",
    "rooms",
    "condition",
    "occupancy",
    "notes",
    "assistantMessage",
    "missingField",
    "quickReplies",
  ],
} as const;

type RawIntake = {
  objective: string | null;
  operationType: GuimmiaOperationType | null;
  customerRole: SiteCustomerRole | null;
  propertyType: string | null;
  country: string | null;
  city: string | null;
  province: string | null;
  address: string | null;
  postalCode: string | null;
  surfaceSqm: number | null;
  rooms: number | null;
  condition: string | null;
  occupancy: string | null;
  notes: string | null;
  assistantMessage: string;
  missingField: GuimmiaIntakeField | null;
  quickReplies: string[];
};

type OpenAIResponse = {
  id?: string;
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: { cached_tokens?: number };
  };
  error?: { message?: string };
};

function outputText(response: OpenAIResponse) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }
  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("");
}

function calculateUsage(response: OpenAIResponse): GuimmiaBrainUsage {
  const inputTokens = Math.max(0, response.usage?.input_tokens ?? 0);
  const cachedInputTokens = Math.min(
    inputTokens,
    Math.max(0, response.usage?.input_tokens_details?.cached_tokens ?? 0),
  );
  const outputTokens = Math.max(0, response.usage?.output_tokens ?? 0);
  const estimatedCostUsd =
    ((inputTokens - cachedInputTokens) / 1_000_000) * 0.2 +
    (cachedInputTokens / 1_000_000) * 0.02 +
    (outputTokens / 1_000_000) * 1.2;
  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
  };
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function allowed<T extends string>(value: unknown, values: readonly T[]): T | null {
  return typeof value === "string" && values.includes(value as T)
    ? (value as T)
    : null;
}

function positiveInteger(value: unknown, maximum: number) {
  const number = typeof value === "number" ? value : Number.NaN;
  return Number.isInteger(number) && number > 0 && number <= maximum
    ? number
    : null;
}

function positiveNumber(value: unknown, maximum: number) {
  const number = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(number) && number > 0 && number <= maximum
    ? Number(number.toFixed(2))
    : null;
}

function missingField(draft: GuimmiaIntakeDraft): GuimmiaIntakeField | null {
  if (!draft.objective) return "objective";
  if (!draft.operationType) return "operationType";
  if (!draft.propertyType) return "propertyType";
  if (!draft.city) return "city";
  if (!draft.country) return "country";
  if (!draft.locationVerified) return "locationVerified";
  if (!draft.surfaceSqm) return "surfaceSqm";
  if (!draft.condition) return "condition";
  return null;
}

function fallbackQuestion(field: GuimmiaIntakeField | null) {
  const questions: Partial<Record<GuimmiaIntakeField, string>> = {
    objective: "Cosa vuoi fare: vendere, acquistare, affittare, cercare in affitto oppure valutare l’immobile?",
    operationType: "Che tipo di affitto ti interessa: lungo termine, transitorio, studenti oppure turistico breve?",
    propertyType: "Di che tipo di immobile si tratta?",
    city: "In quale Comune si trova l’immobile?",
    country: "In quale Paese si trova l’immobile?",
    locationVerified: "Ho inserito la località. Controlla i suggerimenti nella scheda e conferma la posizione dell’immobile.",
    surfaceSqm: "Qual è la superficie indicativa dell’immobile in metri quadrati?",
    condition: "Qual è lo stato dell’immobile?",
  };
  return field ? questions[field] ?? "Controlla la scheda e completa il dato mancante." : "Ho compilato la scheda. Controllala e confermala prima di creare la pratica.";
}

function fallbackReplies(field: GuimmiaIntakeField | null) {
  if (field === "objective") return GUIMMIA_OBJECTIVE_OPTIONS.map((item) => item.label);
  if (field === "operationType") return GUIMMIA_RENTAL_OPTIONS.map((item) => item.label);
  if (field === "propertyType") return GUIMMIA_PROPERTY_TYPE_OPTIONS.slice(0, 6);
  if (field === "condition") return [...GUIMMIA_CONDITION_OPTIONS];
  return [];
}

function validateRawIntake(value: unknown, current: GuimmiaIntakeDraft) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("intake_output_invalid");
  }
  const raw = value as RawIntake;
  const patch: GuimmiaIntakePatch = {};
  const extractedFields: GuimmiaIntakeField[] = [];
  const objective = allowed(
    raw.objective,
    GUIMMIA_OBJECTIVE_OPTIONS.map((item) => item.value),
  );
  if (objective) {
    patch.objective = objective;
    extractedFields.push("objective");
    const option = objectiveOption(objective);
    if (option) {
      patch.customerRole = option.customerRole;
      extractedFields.push("customerRole");
      patch.operationType = option.operationType;
      if (option.operationType) {
        extractedFields.push("operationType");
      }
    }
  }

  const operationType = allowed(raw.operationType, [
    "SALE",
    ...GUIMMIA_RENTAL_OPTIONS.map((item) => item.value),
  ] as const);
  if (operationType) {
    patch.operationType = operationType;
    if (!extractedFields.includes("operationType")) extractedFields.push("operationType");
  }

  const customerRole = allowed(raw.customerRole, [
    "OWNER",
    "SELLER",
    "BUYER",
    "LANDLORD",
    "TENANT",
    "GUEST",
    "REPRESENTATIVE",
    "UNCONFIRMED",
  ] as const);
  if (customerRole && customerRole !== "UNCONFIRMED") {
    patch.customerRole = customerRole;
    if (!extractedFields.includes("customerRole")) extractedFields.push("customerRole");
  }

  const enumFields = [
    ["propertyType", raw.propertyType, GUIMMIA_PROPERTY_TYPE_OPTIONS],
    ["country", raw.country, GUIMMIA_COUNTRY_OPTIONS],
    ["condition", raw.condition, GUIMMIA_CONDITION_OPTIONS],
    ["occupancy", raw.occupancy, GUIMMIA_OCCUPANCY_OPTIONS],
  ] as const;
  for (const [field, rawValue, values] of enumFields) {
    const clean = allowed(rawValue, values);
    if (clean) {
      Object.assign(patch, { [field]: clean });
      extractedFields.push(field);
    }
  }

  for (const [field, rawValue, maxLength] of [
    ["city", raw.city, 120],
    ["province", raw.province, 120],
    ["address", raw.address, 240],
    ["postalCode", raw.postalCode, 12],
    ["notes", raw.notes, 700],
  ] as const) {
    const clean = cleanText(rawValue, maxLength);
    if (clean) {
      Object.assign(patch, { [field]: clean });
      extractedFields.push(field);
    }
  }

  const surfaceSqm = positiveNumber(raw.surfaceSqm, 100_000);
  if (surfaceSqm) {
    patch.surfaceSqm = surfaceSqm;
    extractedFields.push("surfaceSqm");
  }
  const rooms = positiveInteger(raw.rooms, 100);
  if (rooms) {
    patch.rooms = rooms;
    extractedFields.push("rooms");
  }

  const nextDraft: GuimmiaIntakeDraft = { ...current, ...patch };
  const nextMissingField = missingField(nextDraft);
  const modelReplies = Array.isArray(raw.quickReplies)
    ? raw.quickReplies.map((item) => cleanText(item, 80)).filter(Boolean).slice(0, 6)
    : [];
  const controlledReplies = fallbackReplies(nextMissingField);

  return {
    patch,
    extractedFields: Array.from(new Set(extractedFields)),
    missingField: nextMissingField,
    readyForConfirmation: nextMissingField === null,
    assistantMessage:
      nextMissingField === "locationVerified"
        ? fallbackQuestion(nextMissingField)
        : cleanText(raw.assistantMessage, 500) || fallbackQuestion(nextMissingField),
    quickReplies: controlledReplies.length ? controlledReplies : modelReplies,
  };
}

export class OpenAIIntakeNotConfiguredError extends Error {}

export async function generateGuimmiaIntake(input: {
  message: string;
  draft: GuimmiaIntakeDraft;
  conversation: GuimmiaBrainConversationMessage[];
}) {
  const configuration = getOpenAIConfiguration();
  if (!configuration.configured) {
    throw new OpenAIIntakeNotConfiguredError("OPENAI_API_KEY missing");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${configuration.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: configuration.model,
        store: false,
        reasoning: { effort: "low" },
        max_output_tokens: GUIMMIA_INTAKE_MAX_OUTPUT_TOKENS,
        instructions: [
          "Sei Guimmia, la guida immobiliare intelligente di un'agenzia immobiliare online con persone reali dietro il servizio.",
          "Trasforma il messaggio dell'utente in una scheda immobiliare strutturata usando soltanto i valori ammessi dallo schema.",
          "Estrai esclusivamente fatti dichiarati o inequivocabili. Non inventare località, metrature, condizioni, ruoli o dettagli mancanti.",
          "Mantieni i dati già presenti nella bozza; restituisci un valore non nullo soltanto se il nuovo messaggio lo aggiunge o lo corregge chiaramente.",
          "Per un affitto generico non scegliere il tipo di locazione: lascia operationType nullo e chiedi lungo termine, transitorio, studenti o turistico breve.",
          "Non considerare una località verificata: la conferma avviene nell'interfaccia usando i suggerimenti geografici.",
          "Fai una sola domanda utile per volta e proponi quickReplies brevi quando esistono valori controllati.",
          "Non chiedere email, telefono, codice fiscale, dati bancari o altri contatti personali.",
          "Non creare pratiche, non approvare dati e non eseguire azioni. La conferma finale spetta sempre all'utente.",
          "Se il messaggio non riguarda una pratica immobiliare, lascia i campi nulli e chiedi con semplicità cosa vuole fare con l'immobile.",
        ].join("\n"),
        input: JSON.stringify({
          useCase: "GUIMMIA_CONVERSATIONAL_INTAKE",
          executionMode: "DRY_RUN",
          customerMessage: redactCustomerText(input.message),
          currentDraft: {
            ...input.draft,
            notes: redactCustomerText(input.draft.notes).slice(0, 700),
          },
          recentConversation: input.conversation.slice(-6).map((message) => ({
            role: message.role,
            text: redactCustomerText(message.text).slice(0, 700),
          })),
        }),
        text: {
          format: {
            type: "json_schema",
            name: "guimmia_conversational_intake",
            strict: true,
            schema: intakeSchema,
          },
        },
      }),
    });

    const raw = (await response.json()) as OpenAIResponse;
    if (!response.ok) {
      throw new Error(raw.error?.message || `openai_http_${response.status}`);
    }
    const text = outputText(raw);
    if (!text) throw new Error("openai_empty_output");
    return {
      requestId: raw.id ?? crypto.randomUUID(),
      model: configuration.model,
      result: validateRawIntake(JSON.parse(text), input.draft),
      usage: calculateUsage(raw),
    };
  } finally {
    clearTimeout(timeout);
  }
}
