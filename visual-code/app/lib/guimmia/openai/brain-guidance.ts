import "server-only";

import { redactCustomerText } from "@/lib/guimmia/brain/case-orchestrator/redaction";
import type { GuimmiaAssistantFocus } from "@/lib/guimmia-ai/types";
import type {
  GuimmiaBrainAnswer,
  GuimmiaBrainConversationMessage,
  GuimmiaBrainKnowledgeReference,
  GuimmiaOperationalSnapshot,
  GuimmiaBrainRequestKind,
  GuimmiaBrainRetrievalContext,
  GuimmiaBrainUsage,
} from "@/lib/guimmia/openai/brain-types";
import {
  getOpenAIConfiguration,
  GUIMMIA_BRAIN_MAX_OUTPUT_TOKENS,
} from "@/lib/guimmia/openai/config";
import type { SiteOrchestrationResponse } from "@/lib/guimmia/site-orchestration/types";

const brainAnswerSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    reply: { type: "string" },
    nextAction: { type: "string" },
    nextActionOwner: {
      type: "string",
      enum: ["CUSTOMER", "GUIMMIA", "PROFESSIONAL", "NONE"],
    },
    followUpQuestions: {
      type: "array",
      maxItems: 3,
      items: { type: "string" },
    },
    missingDocuments: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
    },
    warnings: {
      type: "array",
      maxItems: 5,
      items: { type: "string" },
    },
    handoffRequired: { type: "boolean" },
    handoffReason: { type: "string" },
    confidence: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
    knowledgeRefs: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: { type: "string", enum: ["RULE", "CARD", "WORKFLOW"] },
          code: { type: "string" },
        },
        required: ["type", "code"],
      },
    },
  },
  required: [
    "title",
    "reply",
    "nextAction",
    "nextActionOwner",
    "followUpQuestions",
    "missingDocuments",
    "warnings",
    "handoffRequired",
    "handoffReason",
    "confidence",
    "knowledgeRefs",
  ],
} as const;

type RawBrainAnswer = Omit<GuimmiaBrainAnswer, "references"> & {
  knowledgeRefs: Array<{
    type: GuimmiaBrainKnowledgeReference["type"];
    code: string;
  }>;
};

type OpenAIResponse = {
  id?: string;
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
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

function usage(response: OpenAIResponse): GuimmiaBrainUsage {
  const inputTokens = Math.max(0, response.usage?.input_tokens ?? 0);
  const cachedInputTokens = Math.min(
    inputTokens,
    Math.max(0, response.usage?.input_tokens_details?.cached_tokens ?? 0),
  );
  const outputTokens = Math.max(0, response.usage?.output_tokens ?? 0);
  const uncachedInputTokens = inputTokens - cachedInputTokens;
  const estimatedCostUsd =
    (uncachedInputTokens / 1_000_000) * 0.2 +
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

function cleanList(value: unknown, maxItems: number, maxLength: number) {
  return Array.isArray(value)
    ? value
        .map((item) => cleanText(item, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];
}

function startsWithProhibitedMaterialAction(value: string) {
  return /^(?:ora\s+|adesso\s+)?(?:approva|certifica|firma|pubblica|invia|accetta|rifiuta|seleziona|scegli|prenota|incassa|paga|concludi|stabilisci|fissa\s+il\s+prezzo)\b/i.test(
    value.trim(),
  );
}

function validateAnswer(
  value: unknown,
  context: GuimmiaBrainRetrievalContext,
  orchestration: SiteOrchestrationResponse,
): GuimmiaBrainAnswer {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("brain_answer_invalid");
  }

  const raw = value as RawBrainAnswer;
  const allowedReferences = new Map(
    context.references.map((reference) => [
      `${reference.type}:${reference.code}`,
      reference,
    ]),
  );
  const selectedReferences = (raw.knowledgeRefs ?? [])
    .map((reference) =>
      allowedReferences.get(`${reference.type}:${reference.code}`),
    )
    .filter(
      (reference): reference is GuimmiaBrainKnowledgeReference =>
        Boolean(reference),
    );
  const references = Array.from(
    new Map(
      (selectedReferences.length
        ? selectedReferences
        : context.references.slice(0, 3)
      ).map((reference) => [
        `${reference.type}:${reference.code}`,
        reference,
      ]),
    ).values(),
  ).slice(0, 10);
  const nextActionOwner = [
    "CUSTOMER",
    "GUIMMIA",
    "PROFESSIONAL",
    "NONE",
  ].includes(raw.nextActionOwner)
    ? raw.nextActionOwner
    : "GUIMMIA";
  const confidence = ["LOW", "MEDIUM", "HIGH"].includes(raw.confidence)
    ? raw.confidence
    : "LOW";
  const requiresHumanReference = references.some(
    (reference) => reference.humanReviewRequired,
  );
  const proposedNextAction = cleanText(raw.nextAction, 240);
  const prohibitedMaterialAction = startsWithProhibitedMaterialAction(
    proposedNextAction,
  );
  const handoffRequired =
    raw.handoffRequired === true ||
    requiresHumanReference ||
    Boolean(orchestration.handoff) ||
    prohibitedMaterialAction;
  const warnings = cleanList(raw.warnings, 5, 260);
  if (prohibitedMaterialAction) {
    warnings.unshift(
      "Un’indicazione operativa è stata sostituita dal percorso sicuro di Guimmia.",
    );
  }

  return {
    title: cleanText(raw.title, 120) || "Guida Guimmia",
    reply: prohibitedMaterialAction
      ? orchestration.customerExplanation ||
        "Guimmia ha mantenuto il passaggio sicuro previsto per questa pratica."
      : cleanText(raw.reply, 5000) ||
        orchestration.customerExplanation ||
        "Guimmia ha ordinato i prossimi passaggi della pratica.",
    nextAction: prohibitedMaterialAction
      ? orchestration.nextAction?.title ||
        "Attendi il controllo di Guimmia prima di procedere."
      : proposedNextAction,
    nextActionOwner: prohibitedMaterialAction ? "GUIMMIA" : nextActionOwner,
    followUpQuestions: cleanList(raw.followUpQuestions, 3, 240),
    missingDocuments: cleanList(raw.missingDocuments, 8, 160),
    warnings: warnings.slice(0, 5),
    handoffRequired,
    handoffReason: handoffRequired
      ? cleanText(raw.handoffReason, 320) ||
        (prohibitedMaterialAction
          ? "La risposta è stata fermata dal controllo di autorità e richiede la verifica di Guimmia."
          : "Questo passaggio richiede il controllo di Guimmia o di un professionista.")
      : "",
    confidence: references.length < 2 && confidence === "HIGH" ? "MEDIUM" : confidence,
    references,
  };
}

export class OpenAIBrainNotConfiguredError extends Error {}

export async function generateGuimmiaBrainGuidance(input: {
  question: string;
  requestKind: GuimmiaBrainRequestKind;
  conversation: GuimmiaBrainConversationMessage[];
  experience?: "case" | "assistant";
  focus?: GuimmiaAssistantFocus;
  orchestration: SiteOrchestrationResponse;
  knowledge: GuimmiaBrainRetrievalContext;
  property: {
    type?: string;
    country?: string;
    city?: string;
    province?: string;
    locationVerified?: boolean;
    documents?: string[];
  };
  operations: GuimmiaOperationalSnapshot;
}) {
  const configuration = getOpenAIConfiguration();
  if (!configuration.configured) {
    throw new OpenAIBrainNotConfiguredError("OPENAI_API_KEY missing");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40_000);
  const assistantExperience = input.experience === "assistant";

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
        max_output_tokens: GUIMMIA_BRAIN_MAX_OUTPUT_TOKENS,
        instructions: [
          assistantExperience
            ? "Sei Guimmia, un assistente specializzato nell'immobiliare italiano per privati, agenti e professionisti."
            : "Sei Guimmia, la guida immobiliare intelligente di un'agenzia immobiliare online con persone reali dietro il servizio.",
          assistantExperience
            ? "Rispondi prima alla domanda concreta dell'utente. La decisione deterministica descrive il perimetro di rischio: non trasformarla automaticamente in un questionario per aprire una pratica."
            : "Il motore deterministico Guimmia è la fonte di verità: non modificare decisione, stato, autorità, blocchi o handoff ricevuti.",
          "Usa regole, knowledge card e workflow forniti nel contesto come base immobiliare verificabile. Non inventare norme, documenti, prezzi, scadenze o fatti mancanti.",
          "Rispondi in italiano semplice, concreto e utile. Fai al massimo tre domande mirate per volta.",
          "Distingui sempre fatti dichiarati, ipotesi, elementi mancanti e verifiche ancora necessarie.",
          "Non approvare documenti, non certificare conformità, non scegliere candidati, non fissare prezzi finali, non accettare offerte e non eseguire azioni.",
          "Quando una regola richiede agente o professionista, imposta handoffRequired e spiegalo senza allarmismi.",
          "Quando l'utente chiede un annuncio, un messaggio, una clausola o un contratto, prepara soltanto una bozza modificabile: non presentarla come completa, valida, firmabile o sostitutiva del controllo professionale.",
          "Non affermare che una clausola di esclusione trasferisca automaticamente ogni responsabilità all'utente.",
          "Per questioni legali, fiscali o tecniche soggette a cambiamenti, evita certezze non sostenute dal contesto e indica quale verifica aggiornata serve.",
          "Lo snapshot operativo descrive documenti e agenda realmente registrati. Un documento ARCHIVED è classificato, non legalmente verificato.",
          "Non dire mai che un documento è stato inviato. Non creare o confermare appuntamenti: usa solo disponibilità e stati presenti nello snapshot.",
          "Cita in knowledgeRefs soltanto codici presenti in availableKnowledgeRefs.",
          "Non chiedere né ricostruire email, telefono, codice fiscale, dati bancari o altri contatti personali se non sono indispensabili alla bozza richiesta; in tal caso usa segnaposto.",
        ].join("\n"),
        input: JSON.stringify({
          useCase: assistantExperience
            ? "GUIMMIA_AI_BETA_ASSISTANT"
            : "GUIMMIA_FULL_BRAIN_GUIDANCE",
          experience: assistantExperience ? "ASSISTANT" : "CASE",
          focus: input.focus ?? "GENERAL",
          executionMode: "DRY_RUN",
          requestKind: input.requestKind,
          customerQuestion: redactCustomerText(input.question),
          recentConversation: input.conversation.slice(-4).map((message) => ({
            role: message.role,
            text: redactCustomerText(message.text).slice(0, 700),
          })),
          property: {
            type: input.property.type,
            country: input.property.country,
            city: input.property.city,
            province: input.property.province,
            locationVerified: input.property.locationVerified === true,
            documentCodes: (input.property.documents ?? []).slice(0, 40),
          },
          deterministicDecision: {
            operationType: input.orchestration.operationType,
            operationLabel: input.orchestration.operationLabel,
            status: input.orchestration.status,
            stage: input.orchestration.stage,
            nextAction: input.orchestration.nextAction,
            customerQuestions: input.orchestration.customerQuestions,
            customerExplanation: input.orchestration.customerExplanation,
            handoff: input.orchestration.handoff,
          },
          operationalSnapshot: input.operations,
          brainContext: {
            version: input.knowledge.brainVersion,
            workflow: input.knowledge.workflow,
            stage: input.knowledge.stage,
            rules: input.knowledge.rules,
            knowledgeCards: input.knowledge.cards,
          },
          availableKnowledgeRefs: input.knowledge.references.map(
            (reference) => ({
              type: reference.type,
              code: reference.code,
              title: reference.title,
            }),
          ),
        }),
        text: {
          format: {
            type: "json_schema",
            name: "guimmia_full_brain_guidance",
            strict: true,
            schema: brainAnswerSchema,
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
      answer: validateAnswer(JSON.parse(text), input.knowledge, input.orchestration),
      usage: usage(raw),
    };
  } finally {
    clearTimeout(timeout);
  }
}
