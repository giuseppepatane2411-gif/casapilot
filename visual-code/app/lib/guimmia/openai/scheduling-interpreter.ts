import "server-only";

import type { GuimmiaBrainUsage } from "@/lib/guimmia/openai/brain-types";
import {
  getOpenAIConfiguration,
  GUIMMIA_SCHEDULING_MAX_OUTPUT_TOKENS,
} from "@/lib/guimmia/openai/config";
import {
  GUIMMIA_APPOINTMENT_TYPES,
  type GuimmiaAppointmentType,
  type GuimmiaScheduleProposal,
} from "@/lib/guimmia/operations/scheduling-types";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: {
      type: "string",
      enum: ["DECLARE_AVAILABILITY", "REQUEST_APPOINTMENT", "NONE"],
    },
    eventType: { type: ["string", "null"], enum: [...GUIMMIA_APPOINTMENT_TYPES, null] },
    startsAt: { type: ["string", "null"] },
    endsAt: { type: ["string", "null"] },
    timezone: { type: "string" },
    requiresClarification: { type: "boolean" },
    assistantMessage: { type: "string" },
    confidence: { type: "number" },
  },
  required: [
    "intent",
    "eventType",
    "startsAt",
    "endsAt",
    "timezone",
    "requiresClarification",
    "assistantMessage",
    "confidence",
  ],
} as const;

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

function text(response: OpenAIResponse) {
  return response.output_text ||
    (response.output ?? [])
      .flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text")
      .map((item) => item.text ?? "")
      .join("");
}

function usage(response: OpenAIResponse): GuimmiaBrainUsage {
  const inputTokens = Math.max(0, response.usage?.input_tokens ?? 0);
  const cachedInputTokens = Math.min(
    inputTokens,
    Math.max(0, response.usage?.input_tokens_details?.cached_tokens ?? 0),
  );
  const outputTokens = Math.max(0, response.usage?.output_tokens ?? 0);
  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    estimatedCostUsd: Number(
      (
        ((inputTokens - cachedInputTokens) / 1_000_000) * 0.2 +
        (cachedInputTokens / 1_000_000) * 0.02 +
        (outputTokens / 1_000_000) * 1.2
      ).toFixed(6),
    ),
  };
}

function validIso(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function validate(value: unknown, requestedTimezone: string): GuimmiaScheduleProposal {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("schedule_output_invalid");
  }
  const raw = value as Record<string, unknown>;
  const intent = ["DECLARE_AVAILABILITY", "REQUEST_APPOINTMENT", "NONE"].includes(
    String(raw.intent),
  )
    ? raw.intent as GuimmiaScheduleProposal["intent"]
    : "NONE";
  const eventType = GUIMMIA_APPOINTMENT_TYPES.includes(
    raw.eventType as GuimmiaAppointmentType,
  )
    ? raw.eventType as GuimmiaAppointmentType
    : null;
  const startsAt = validIso(raw.startsAt);
  const endsAt = validIso(raw.endsAt);
  const complete = Boolean(
    intent !== "NONE" &&
      eventType &&
      startsAt &&
      endsAt &&
      new Date(endsAt!).getTime() > new Date(startsAt!).getTime(),
  );
  return {
    intent,
    eventType,
    startsAt,
    endsAt,
    timezone: requestedTimezone,
    requiresClarification: raw.requiresClarification === true || !complete,
    assistantMessage:
      typeof raw.assistantMessage === "string" && raw.assistantMessage.trim()
        ? raw.assistantMessage.trim().slice(0, 500)
        : complete
          ? "Ho preparato l’orario: controllalo nell’Agenda prima di confermare."
          : "Mi servono giorno, ora di inizio e ora di fine per preparare l’agenda.",
    confidence: Number.isFinite(raw.confidence)
      ? Math.max(0, Math.min(1, Number(Number(raw.confidence).toFixed(3))))
      : 0,
  };
}

export async function interpretGuimmiaScheduling(input: {
  message: string;
  timezone: string;
  draftId: string;
}) {
  const configuration = getOpenAIConfiguration();
  if (!configuration.configured) throw new Error("OPENAI_API_KEY missing");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  const now = new Date().toISOString();
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
        max_output_tokens: GUIMMIA_SCHEDULING_MAX_OUTPUT_TOKENS,
        instructions: [
          "Interpreta esclusivamente disponibilità del proprietario o richieste di appuntamento immobiliare.",
          "Non creare né confermare appuntamenti: prepara soltanto una proposta strutturata da confermare.",
          "Usa date ISO 8601 con offset. Se giorno, ora o durata sono ambigui, usa null e requiresClarification true.",
          "Non inventare recapiti, invitati o disponibilità. Non spostare appuntamenti esistenti.",
          "Rispondi in italiano breve e cita che la proposta va controllata nell’Agenda.",
        ].join("\n"),
        input: JSON.stringify({
          useCase: "GUIMMIA_SCHEDULING_INTAKE",
          executionMode: "PROPOSAL_ONLY",
          currentTime: now,
          timezone: input.timezone,
          draftId: input.draftId,
          message: input.message.slice(0, 1200),
        }),
        text: {
          format: {
            type: "json_schema",
            name: "guimmia_schedule_proposal",
            strict: true,
            schema,
          },
        },
      }),
    });
    const raw = (await response.json()) as OpenAIResponse;
    if (!response.ok) {
      throw new Error(raw.error?.message || `openai_http_${response.status}`);
    }
    const output = text(raw);
    if (!output) throw new Error("openai_empty_output");
    return {
      requestId: raw.id ?? crypto.randomUUID(),
      model: configuration.model,
      proposal: validate(JSON.parse(output), input.timezone),
      usage: usage(raw),
    };
  } finally {
    clearTimeout(timeout);
  }
}
