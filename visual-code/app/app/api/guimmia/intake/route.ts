import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { redactCustomerText } from "@/lib/guimmia/brain/case-orchestrator/redaction";
import type { GuimmiaOperationType } from "@/lib/guimmia/brain/case-orchestrator/types";
import {
  GUIMMIA_CONDITION_OPTIONS,
  GUIMMIA_COUNTRY_OPTIONS,
  GUIMMIA_OBJECTIVE_OPTIONS,
  GUIMMIA_OCCUPANCY_OPTIONS,
  GUIMMIA_PROPERTY_TYPE_OPTIONS,
} from "@/lib/guimmia/intake/options";
import type { GuimmiaBrainConversationMessage } from "@/lib/guimmia/openai/brain-types";
import {
  getOpenAIConfiguration,
  GUIMMIA_AI_MONTHLY_BUDGET_USD,
  GUIMMIA_INTAKE_MAX_REQUEST_COST_USD,
  GUIMMIA_INTAKE_RATE_LIMIT_REQUESTS,
  GUIMMIA_INTAKE_RATE_LIMIT_WINDOW_MINUTES,
  GUIMMIA_INTAKE_REUSE_WINDOW_MINUTES,
} from "@/lib/guimmia/openai/config";
import {
  generateGuimmiaIntake,
  OpenAIIntakeNotConfiguredError,
} from "@/lib/guimmia/openai/intake";
import type {
  GuimmiaIntakeDraft,
  GuimmiaIntakeError,
  GuimmiaIntakeSuccess,
} from "@/lib/guimmia/openai/intake-types";
import type { SiteCustomerRole } from "@/lib/guimmia/site-orchestration/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type RateLimitEntry = { count: number; resetAt: number };
const globalRateLimits = globalThis as typeof globalThis & {
  __guimmiaIntakeRateLimits?: Map<string, RateLimitEntry>;
};
const rateLimits =
  globalRateLimits.__guimmiaIntakeRateLimits ?? new Map<string, RateLimitEntry>();
globalRateLimits.__guimmiaIntakeRateLimits = rateLimits;

const operationTypes = new Set<GuimmiaOperationType>([
  "SALE",
  "RENT_LONG_TERM",
  "RENT_TRANSITORY",
  "RENT_STUDENT",
  "RENT_TOURIST_SHORT",
]);
const customerRoles = new Set<SiteCustomerRole>([
  "OWNER",
  "SELLER",
  "BUYER",
  "LANDLORD",
  "TENANT",
  "GUEST",
  "REPRESENTATIVE",
  "UNCONFIRMED",
]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function enumText(value: unknown, values: readonly string[]) {
  const clean = cleanText(value, 120);
  return values.includes(clean) ? clean : "";
}

function numberOrNull(value: unknown, maximum: number) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= maximum
    ? parsed
    : null;
}

function parseDraft(value: unknown): GuimmiaIntakeDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const id = cleanText(raw.id, 120);
  if (!id) return null;
  const operationType = cleanText(raw.operationType, 40) as GuimmiaOperationType;
  const customerRole = cleanText(raw.customerRole, 40) as SiteCustomerRole;
  return {
    id,
    objective: enumText(
      raw.objective,
      GUIMMIA_OBJECTIVE_OPTIONS.map((item) => item.value),
    ),
    operationType: operationTypes.has(operationType) ? operationType : null,
    customerRole: customerRoles.has(customerRole) ? customerRole : "UNCONFIRMED",
    propertyType: enumText(raw.propertyType, GUIMMIA_PROPERTY_TYPE_OPTIONS),
    country: enumText(raw.country, GUIMMIA_COUNTRY_OPTIONS),
    city: cleanText(raw.city, 120),
    province: cleanText(raw.province, 120),
    address: cleanText(raw.address, 240),
    postalCode: cleanText(raw.postalCode, 12),
    surfaceSqm: numberOrNull(raw.surfaceSqm, 100_000),
    rooms: numberOrNull(raw.rooms, 100),
    condition: enumText(raw.condition, GUIMMIA_CONDITION_OPTIONS),
    occupancy: enumText(raw.occupancy, GUIMMIA_OCCUPANCY_OPTIONS),
    notes: cleanText(raw.notes, 700),
    locationVerified: raw.locationVerified === true,
  };
}

function parseConversation(value: unknown): GuimmiaBrainConversationMessage[] {
  return Array.isArray(value)
    ? value
        .map((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return null;
          const raw = item as Record<string, unknown>;
          const text = cleanText(raw.text, 800);
          if (!text) return null;
          return {
            role: raw.role === "assistant" ? "assistant" as const : "user" as const,
            text,
          };
        })
        .filter((item): item is GuimmiaBrainConversationMessage => Boolean(item))
        .slice(-6)
    : [];
}

function error(
  status: number,
  code: GuimmiaIntakeError["error"],
  message: string,
  headers: Record<string, string> = {},
) {
  return NextResponse.json<GuimmiaIntakeError>(
    { ok: false, error: code, message },
    { status, headers: { "cache-control": "no-store", ...headers } },
  );
}

function consumeRateLimit(identity: string) {
  const now = Date.now();
  const windowMs = GUIMMIA_INTAKE_RATE_LIMIT_WINDOW_MINUTES * 60_000;
  const current = rateLimits.get(identity);
  if (!current || current.resetAt <= now) {
    rateLimits.set(identity, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= GUIMMIA_INTAKE_RATE_LIMIT_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
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

type CachedIntake = {
  id: string;
  ai_result: Omit<
    GuimmiaIntakeSuccess,
    "ok" | "interactionId" | "cacheHit" | "auditSaved" | "usage" | "safety"
  >;
};

async function findReusableIntake(requestFingerprint: string) {
  const access = supabaseAccess();
  if (!access) return null;
  const notBefore = new Date(
    Date.now() - GUIMMIA_INTAKE_REUSE_WINDOW_MINUTES * 60_000,
  ).toISOString();
  const query = new URLSearchParams({
    select: "id,ai_result",
    request_fingerprint: `eq.${requestFingerprint}`,
    status: "eq.COMPLETED",
    created_at: `gte.${notBefore}`,
    order: "created_at.desc",
    limit: "1",
  });
  try {
    const response = await fetch(
      `${access.url}/rest/v1/guimmia_ai_intake_interactions?${query.toString()}`,
      {
        headers: { apikey: access.key, Authorization: `Bearer ${access.key}` },
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as CachedIntake[];
    return rows[0]?.ai_result ? rows[0] : null;
  } catch {
    return null;
  }
}

async function budgetAvailable() {
  const access = supabaseAccess();
  if (!access) return false;
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
    if (!response.ok) return false;
    const rows = (await response.json()) as Array<{ remaining_usd?: number | string }>;
    return Number(rows[0]?.remaining_usd) >= GUIMMIA_INTAKE_MAX_REQUEST_COST_USD;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 20_000) {
    return error(413, "invalid_request", "Il messaggio contiene troppi dati.");
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

  const message = cleanText(body.message, 2000);
  const draft = parseDraft(body.draft);
  const conversation = parseConversation(body.conversation);
  if (!message || !draft) {
    return error(400, "invalid_request", "Servono un messaggio e una bozza valida.");
  }
  if (!isSupabaseConfigured() || !supabaseAccess()) {
    return error(503, "database_not_configured", "Il database Guimmia non è configurato.");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return error(401, "authentication_required", "Accedi al tuo account per parlare con Guimmia.");
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

  const safeMessage = redactCustomerText(message);
  const safeConversation = conversation.map((item) => ({
    role: item.role,
    text: redactCustomerText(item.text),
  }));
  const requestFingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        version: "77.5.0",
        userId: data.user.id,
        message: safeMessage,
        draft,
        conversation: safeConversation,
      }),
    )
    .digest("hex");
  const cached = await findReusableIntake(requestFingerprint);
  if (cached) {
    return NextResponse.json<GuimmiaIntakeSuccess>(
      {
        ok: true,
        interactionId: cached.id,
        auditSaved: true,
        cacheHit: true,
        ...cached.ai_result,
        usage: { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 },
        safety: {
          humanConfirmationRequired: true,
          caseCreated: false,
          personalContactDataSentToModel: false,
          controlledVocabularyApplied: true,
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const configuration = getOpenAIConfiguration();
  if (!configuration.configured) {
    return error(503, "openai_not_configured", "OpenAI non è configurato.");
  }
  if (!(await budgetAvailable())) {
    return error(
      429,
      "budget_limit_reached",
      `Il budget mensile di prova di $${GUIMMIA_AI_MONTHLY_BUDGET_USD.toFixed(2)} non è disponibile.`,
    );
  }

  const interactionId = crypto.randomUUID();
  try {
    const ai = await generateGuimmiaIntake({
      message: safeMessage,
      draft,
      conversation: safeConversation,
    });
    const stableResult = {
      model: ai.model,
      mode: "DRY_RUN" as const,
      ...ai.result,
    };
    const auditSaved = await supabaseInsert("guimmia_ai_intake_interactions", {
      id: interactionId,
      user_id: data.user.id,
      draft_id: draft.id,
      request_fingerprint: requestFingerprint,
      message_hash: createHash("sha256").update(safeMessage).digest("hex"),
      message_length: safeMessage.length,
      model: ai.model,
      execution_mode: "DRY_RUN",
      status: "COMPLETED",
      response_id: ai.requestId,
      ai_result: stableResult,
      extracted_fields: ai.result.extractedFields,
      input_tokens: ai.usage.inputTokens,
      cached_input_tokens: ai.usage.cachedInputTokens,
      output_tokens: ai.usage.outputTokens,
      estimated_cost_usd: ai.usage.estimatedCostUsd,
      human_confirmation_required: true,
      automatic_case_created: false,
      personal_contact_data_sent: false,
      controlled_vocabulary_applied: true,
    });
    if (auditSaved) {
      await supabaseInsert("guimmia_ai_usage_events", {
        intake_interaction_id: interactionId,
        request_id: ai.requestId,
        use_case: "CONVERSATIONAL_INTAKE",
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
    return NextResponse.json<GuimmiaIntakeSuccess>(
      {
        ok: true,
        interactionId,
        auditSaved,
        cacheHit: false,
        ...stableResult,
        usage: ai.usage,
        safety: {
          humanConfirmationRequired: true,
          caseCreated: false,
          personalContactDataSentToModel: false,
          controlledVocabularyApplied: true,
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (cause) {
    if (cause instanceof OpenAIIntakeNotConfiguredError) {
      return error(503, "openai_not_configured", "OpenAI non è configurato.");
    }
    console.error("Guimmia intake failed", cause);
    return error(502, "intake_failed", "Guimmia non è riuscita a interpretare il messaggio. Riprova.");
  }
}
