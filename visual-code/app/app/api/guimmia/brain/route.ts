import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { redactCustomerText } from "@/lib/guimmia/brain/case-orchestrator/redaction";
import type { GuimmiaOperationType } from "@/lib/guimmia/brain/case-orchestrator/types";
import {
  generateGuimmiaBrainGuidance,
  OpenAIBrainNotConfiguredError,
} from "@/lib/guimmia/openai/brain-guidance";
import { retrieveGuimmiaBrainContext } from "@/lib/guimmia/openai/brain-retrieval";
import {
  GUIMMIA_BRAIN_REQUEST_KINDS,
  type GuimmiaBrainError,
  type GuimmiaBrainRequestKind,
  type GuimmiaBrainSuccess,
  type GuimmiaOperationalSnapshot,
} from "@/lib/guimmia/openai/brain-types";
import {
  getOpenAIConfiguration,
  GUIMMIA_AI_MONTHLY_BUDGET_USD,
  GUIMMIA_BRAIN_MAX_REQUEST_COST_USD,
  GUIMMIA_BRAIN_RATE_LIMIT_REQUESTS,
  GUIMMIA_BRAIN_RATE_LIMIT_WINDOW_MINUTES,
  GUIMMIA_BRAIN_REUSE_WINDOW_MINUTES,
} from "@/lib/guimmia/openai/config";
import { orchestrateSiteCase } from "@/lib/guimmia/site-orchestration/server";
import type {
  SiteOrchestrationRequest,
  SiteOrchestrationResponse,
} from "@/lib/guimmia/site-orchestration/types";
import type { GuimmiaBrainRetrievalContext } from "@/lib/guimmia/openai/brain-types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type RateLimitEntry = { count: number; resetAt: number };
const globalRateLimits = globalThis as typeof globalThis & {
  __guimmiaBrainRateLimits?: Map<string, RateLimitEntry>;
};
const rateLimits =
  globalRateLimits.__guimmiaBrainRateLimits ?? new Map<string, RateLimitEntry>();
globalRateLimits.__guimmiaBrainRateLimits = rateLimits;

const operationTypes = new Set<GuimmiaOperationType>([
  "SALE",
  "RENT_LONG_TERM",
  "RENT_TRANSITORY",
  "RENT_STUDENT",
  "RENT_TOURIST_SHORT",
]);
const customerRoles = new Set([
  "OWNER",
  "SELLER",
  "BUYER",
  "LANDLORD",
  "TENANT",
  "GUEST",
  "REPRESENTATIVE",
  "UNCONFIRMED",
]);
const serviceModels = new Set(["COMPLETA", "MENSILE"]);
const requestKinds = new Set<GuimmiaBrainRequestKind>(
  GUIMMIA_BRAIN_REQUEST_KINDS,
);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function error(
  status: number,
  code: GuimmiaBrainError["error"],
  message: string,
  headers: Record<string, string> = {},
) {
  return NextResponse.json<GuimmiaBrainError>(
    { ok: false, error: code, message },
    { status, headers: { "cache-control": "no-store", ...headers } },
  );
}

function parseCase(value: unknown):
  | (SiteOrchestrationRequest & { operationType: GuimmiaOperationType })
  | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const operationType = cleanText(raw.operationType, 40) as GuimmiaOperationType;
  const caseId = cleanText(raw.caseId, 120);
  const rawProperty =
    raw.property && typeof raw.property === "object" && !Array.isArray(raw.property)
      ? (raw.property as Record<string, unknown>)
      : {};
  const rawProgress =
    raw.progress && typeof raw.progress === "object" && !Array.isArray(raw.progress)
      ? (raw.progress as Record<string, unknown>)
      : {};
  const role = cleanText(raw.customerRole, 40);
  const serviceModel = cleanText(raw.serviceModel, 30);
  const version = Number(raw.caseVersion ?? 1);
  const confidence = Number(raw.confidence ?? 0.9);

  if (!caseId || !operationTypes.has(operationType)) return null;

  return {
    caseId,
    caseVersion: Number.isInteger(version) && version > 0 ? version : 1,
    operationType,
    customerRole: customerRoles.has(role)
      ? (role as SiteOrchestrationRequest["customerRole"])
      : "UNCONFIRMED",
    serviceModel: serviceModels.has(serviceModel)
      ? (serviceModel as SiteOrchestrationRequest["serviceModel"])
      : undefined,
    confidence:
      Number.isFinite(confidence) && confidence >= 0 && confidence <= 1
        ? confidence
        : 0.9,
    property: {
      id: cleanText(rawProperty.id, 120) || undefined,
      type: cleanText(rawProperty.type, 80) || undefined,
      country: cleanText(rawProperty.country, 80) || undefined,
      city: cleanText(rawProperty.city, 120) || undefined,
      province: cleanText(rawProperty.province, 120) || undefined,
      address: cleanText(rawProperty.address, 240) || undefined,
      locationVerified: rawProperty.locationVerified === true,
      documents: Array.isArray(rawProperty.documents)
        ? rawProperty.documents
            .map((item) => cleanText(item, 80))
            .filter(Boolean)
            .slice(0, 40)
        : [],
    },
    progress: {
      currentPhase: cleanText(rawProgress.currentPhase, 80) || "INTAKE",
      completedActionCodes: Array.isArray(rawProgress.completedActionCodes)
        ? rawProgress.completedActionCodes
            .map((item) => cleanText(item, 120))
            .filter(Boolean)
            .slice(0, 100)
        : [],
    },
  };
}

function consumeRateLimit(identity: string) {
  const now = Date.now();
  const windowMs = GUIMMIA_BRAIN_RATE_LIMIT_WINDOW_MINUTES * 60_000;
  const current = rateLimits.get(identity);

  if (!current || current.resetAt <= now) {
    rateLimits.set(identity, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= GUIMMIA_BRAIN_RATE_LIMIT_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  rateLimits.set(identity, current);
  return { allowed: true, retryAfterSeconds: 0 };
}

function supabaseAccess() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  return url && key ? { url, key } : null;
}

async function supabaseInsert(table: string, value: Record<string, unknown>) {
  const access = supabaseAccess();
  if (!access) return false;

  const response = await fetch(`${access.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: access.key,
      Authorization: `Bearer ${access.key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(value),
  });

  if (!response.ok) {
    console.error(`Guimmia ${table} insert failed`, response.status);
    return false;
  }
  return true;
}

async function operationalSnapshot(
  userId: string,
  draftId: string,
): Promise<GuimmiaOperationalSnapshot> {
  const access = supabaseAccess();
  if (!access) return { documents: [], availability: [], appointments: [] };
  const request = async <T>(table: string, query: URLSearchParams) => {
    try {
      const response = await fetch(
        `${access.url}/rest/v1/${table}?${query.toString()}`,
        {
          headers: { apikey: access.key, Authorization: `Bearer ${access.key}` },
          cache: "no-store",
        },
      );
      return response.ok ? await response.json() as T : [] as T;
    } catch {
      return [] as T;
    }
  };
  const ownerFilter = { user_id: `eq.${userId}`, draft_id: `eq.${draftId}` };
  const [documents, availability, appointments] = await Promise.all([
    request<Array<{
      document_type: string;
      folder_code: string;
      status: string;
      quality: string;
      recipient_roles: string[];
    }>>("guimmia_case_document_staging", new URLSearchParams({
      select: "document_type,folder_code,status,quality,recipient_roles",
      ...ownerFilter,
      status: "neq.REJECTED",
      order: "created_at.desc",
      limit: "40",
    })),
    request<Array<{
      starts_at: string;
      ends_at: string;
      timezone: string;
      allowed_event_types: string[];
    }>>("guimmia_availability_windows", new URLSearchParams({
      select: "starts_at,ends_at,timezone,allowed_event_types",
      ...ownerFilter,
      status: "eq.ACTIVE",
      order: "starts_at.asc",
      limit: "20",
    })),
    request<Array<{
      event_type: string;
      starts_at: string;
      ends_at: string;
      timezone: string;
      status: string;
    }>>("guimmia_case_appointments", new URLSearchParams({
      select: "event_type,starts_at,ends_at,timezone,status",
      ...ownerFilter,
      status: "neq.CANCELLED",
      order: "starts_at.asc",
      limit: "20",
    })),
  ]);
  return {
    documents: documents.map((item) => ({
      documentType: item.document_type,
      folderCode: item.folder_code,
      status: item.status,
      quality: item.quality,
      recipientRoles: item.recipient_roles ?? [],
      humanConfirmationRequired: true,
      legalValidityCertified: false,
    })),
    availability: availability.map((item) => ({
      startsAt: item.starts_at,
      endsAt: item.ends_at,
      timezone: item.timezone,
      allowedEventTypes: item.allowed_event_types ?? [],
    })),
    appointments: appointments.map((item) => ({
      eventType: item.event_type,
      startsAt: item.starts_at,
      endsAt: item.ends_at,
      timezone: item.timezone,
      status: item.status,
      ownerConfirmationRequired: true,
    })),
  };
}

type ReusableBrainInteraction = {
  id: string;
  model: "gpt-5.6-luna";
  request_kind: GuimmiaBrainRequestKind;
  ai_result: GuimmiaBrainSuccess["answer"];
};

async function findReusableBrainInteraction(requestFingerprint: string) {
  const access = supabaseAccess();
  if (!access) return null;

  const notBefore = new Date(
    Date.now() - GUIMMIA_BRAIN_REUSE_WINDOW_MINUTES * 60_000,
  ).toISOString();
  const query = new URLSearchParams({
    select: "id,model,request_kind,ai_result",
    request_fingerprint: `eq.${requestFingerprint}`,
    status: "eq.COMPLETED",
    created_at: `gte.${notBefore}`,
    order: "created_at.desc",
    limit: "1",
  });

  try {
    const response = await fetch(
      `${access.url}/rest/v1/guimmia_ai_brain_interactions?${query.toString()}`,
      {
        headers: {
          apikey: access.key,
          Authorization: `Bearer ${access.key}`,
        },
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as ReusableBrainInteraction[];
    const cached = rows[0];
    if (
      !cached ||
      cached.model !== "gpt-5.6-luna" ||
      !cached.ai_result ||
      typeof cached.ai_result.reply !== "string" ||
      !Array.isArray(cached.ai_result.references)
    ) {
      return null;
    }
    return cached;
  } catch {
    return null;
  }
}

async function budgetStatus() {
  const access = supabaseAccess();
  if (!access) return { available: false, remainingUsd: 0 };

  try {
    const response = await fetch(
      `${access.url}/rest/v1/rpc/guimmia_v773_ai_budget_status`,
      {
        method: "POST",
        headers: {
          apikey: access.key,
          Authorization: `Bearer ${access.key}`,
          "Content-Type": "application/json",
        },
        body: "{}",
        cache: "no-store",
      },
    );
    if (!response.ok) return { available: false, remainingUsd: 0 };
    const rows = (await response.json()) as Array<{
      remaining_usd?: number | string;
      available?: boolean;
    }>;
    const remainingUsd = Number(rows[0]?.remaining_usd);
    return {
      available:
        rows[0]?.available === true &&
        Number.isFinite(remainingUsd) &&
        remainingUsd >= GUIMMIA_BRAIN_MAX_REQUEST_COST_USD,
      remainingUsd: Number.isFinite(remainingUsd) ? remainingUsd : 0,
    };
  } catch {
    return { available: false, remainingUsd: 0 };
  }
}

const useCases: Record<GuimmiaBrainRequestKind, string> = {
  GUIDANCE: "BRAIN_GUIDANCE",
  DOCUMENT_CHECK: "DOCUMENT_CHECK",
  NEXT_ACTION: "NEXT_ACTION",
  COMMUNICATION_DRAFT: "COMMUNICATION_DRAFT",
};

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 24_000) {
    return error(413, "invalid_request", "La richiesta contiene troppi dati.");
  }

  let body: Record<string, unknown>;
  try {
    const parsed = (await request.json()) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid_shape");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return error(400, "invalid_request", "La richiesta non è valida.");
  }

  const question = cleanText(body.question, 2000);
  const caseInput = parseCase(body.case);
  const requestedKind = cleanText(body.requestKind, 40) as GuimmiaBrainRequestKind;
  const requestKind = requestKinds.has(requestedKind) ? requestedKind : "GUIDANCE";
  const conversation = Array.isArray(body.conversation)
    ? body.conversation
        .map((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return null;
          const raw = item as Record<string, unknown>;
          const role = raw.role === "assistant" ? "assistant" : "user";
          const text = cleanText(raw.text, 800);
          return text ? { role, text } : null;
        })
        .filter((item): item is { role: "user" | "assistant"; text: string } =>
          Boolean(item),
        )
        .slice(-4)
    : [];

  if (!question || !caseInput) {
    return error(
      400,
      "invalid_request",
      "Servono una domanda e una pratica immobiliare valida.",
    );
  }
  if (!isSupabaseConfigured() || !supabaseAccess()) {
    return error(
      503,
      "database_not_configured",
      "Il collegamento sicuro al database Guimmia non è configurato.",
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return error(
      401,
      "authentication_required",
      "Accedi al tuo account per usare la guida completa di Guimmia.",
    );
  }

  const rateLimit = consumeRateLimit(data.user.id);
  if (!rateLimit.allowed) {
    return error(
      429,
      "request_limit_reached",
      "Hai inviato molte richieste in poco tempo. Riprova più tardi.",
      { "retry-after": String(rateLimit.retryAfterSeconds) },
    );
  }

  const configuration = getOpenAIConfiguration();
  const interactionId = crypto.randomUUID();
  const safeQuestion = redactCustomerText(question);
  const questionHash = createHash("sha256").update(safeQuestion).digest("hex");
  const operations = await operationalSnapshot(data.user.id, caseInput.caseId);
  const requestFingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        bridgeVersion: "77.4.0-rev2",
        userId: data.user.id,
        requestKind,
        question: safeQuestion,
        conversation: conversation.map((item) => ({
          role: item.role,
          text: redactCustomerText(item.text),
        })),
        case: caseInput,
        operations,
      }),
    )
    .digest("hex");
  let orchestration: SiteOrchestrationResponse | undefined;
  let knowledge: GuimmiaBrainRetrievalContext | undefined;

  try {
    orchestration = orchestrateSiteCase(caseInput, {
      identityConfirmed: true,
    });
    knowledge = retrieveGuimmiaBrainContext(safeQuestion, caseInput);
    const cached = await findReusableBrainInteraction(requestFingerprint);
    if (cached) {
      return NextResponse.json<GuimmiaBrainSuccess>(
        {
          ok: true,
          interactionId: cached.id,
          auditSaved: true,
          cacheHit: true,
          mode: "DRY_RUN",
          model: cached.model,
          requestKind,
          orchestration,
          answer: cached.ai_result,
          usage: {
            inputTokens: 0,
            cachedInputTokens: 0,
            outputTokens: 0,
            estimatedCostUsd: 0,
          },
          knowledge: {
            ...knowledge.catalogStats,
            workflow: knowledge.workflow.code,
            stage: knowledge.stage.code,
          },
          safety: {
            deterministicDecisionFirst: true,
            executionPerformed: false,
            humanAuthorityPreserved: true,
            personalContactDataSentToModel: false,
            outputAuthorityGuardPassed: true,
          },
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    if (!configuration.configured) {
      throw new OpenAIBrainNotConfiguredError("OPENAI_API_KEY missing");
    }
    const budget = await budgetStatus();
    if (!budget.available) {
      return error(
        429,
        "budget_limit_reached",
        `Il budget mensile di prova di $${GUIMMIA_AI_MONTHLY_BUDGET_USD.toFixed(2)} non è disponibile.`,
      );
    }

    const ai = await generateGuimmiaBrainGuidance({
      question: safeQuestion,
      requestKind,
      conversation,
      orchestration,
      knowledge,
      property: caseInput.property ?? {},
      operations,
    });
    const auditSaved = await supabaseInsert("guimmia_ai_brain_interactions", {
      id: interactionId,
      user_id: data.user.id,
      case_id: caseInput.caseId,
      operation_type: caseInput.operationType,
      request_kind: requestKind,
      request_fingerprint: requestFingerprint,
      question_hash: questionHash,
      question_length: safeQuestion.length,
      model: ai.model,
      execution_mode: "DRY_RUN",
      status: "COMPLETED",
      response_id: ai.requestId,
      deterministic_decision_first: true,
      decision_snapshot: orchestration,
      knowledge_refs: ai.answer.references,
      ai_result: ai.answer,
      input_tokens: ai.usage.inputTokens,
      cached_input_tokens: ai.usage.cachedInputTokens,
      output_tokens: ai.usage.outputTokens,
      estimated_cost_usd: ai.usage.estimatedCostUsd,
      human_review_required: true,
      automatic_action_executed: false,
      output_authority_guard_passed: true,
    });

    if (auditSaved) {
      await supabaseInsert("guimmia_ai_usage_events", {
        brain_interaction_id: interactionId,
        request_id: ai.requestId,
        use_case: useCases[requestKind],
        model: ai.model,
        execution_mode: "DRY_RUN",
        status: "COMPLETED",
        input_tokens: ai.usage.inputTokens,
        cached_input_tokens: ai.usage.cachedInputTokens,
        output_tokens: ai.usage.outputTokens,
        web_search_calls: 0,
        file_search_calls: 0,
        estimated_cost_usd: ai.usage.estimatedCostUsd,
      });
    }

    return NextResponse.json<GuimmiaBrainSuccess>(
      {
        ok: true,
        interactionId,
        auditSaved,
        cacheHit: false,
        mode: "DRY_RUN",
        model: ai.model,
        requestKind,
        orchestration,
        answer: ai.answer,
        usage: ai.usage,
        knowledge: {
          ...knowledge.catalogStats,
          workflow: knowledge.workflow.code,
          stage: knowledge.stage.code,
        },
        safety: {
          deterministicDecisionFirst: true,
          executionPerformed: false,
          humanAuthorityPreserved: true,
          personalContactDataSentToModel: false,
          outputAuthorityGuardPassed: true,
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (caught) {
    const notConfigured = caught instanceof OpenAIBrainNotConfiguredError;
    await supabaseInsert("guimmia_ai_brain_interactions", {
      id: interactionId,
      user_id: data.user.id,
      case_id: caseInput.caseId,
      operation_type: caseInput.operationType,
      request_kind: requestKind,
      request_fingerprint: requestFingerprint,
      question_hash: questionHash,
      question_length: safeQuestion.length,
      model: configuration.model,
      execution_mode: "DRY_RUN",
      status: notConfigured ? "NOT_CONFIGURED" : "FAILED",
      deterministic_decision_first: true,
      decision_snapshot: orchestration ?? {},
      knowledge_refs: knowledge?.references ?? [],
      error_code: notConfigured
        ? "OPENAI_NOT_CONFIGURED"
        : "OPENAI_REQUEST_FAILED",
      human_review_required: true,
      automatic_action_executed: false,
      output_authority_guard_passed: true,
    });
    console.error("Guimmia brain guidance failed", caught);

    return error(
      notConfigured ? 503 : 502,
      notConfigured ? "openai_not_configured" : "brain_guidance_failed",
      notConfigured
        ? "OpenAI non è ancora collegato al cervello di Guimmia."
        : "La guida intelligente non è riuscita a completare l’analisi. Il percorso deterministico resta disponibile.",
    );
  }
}
