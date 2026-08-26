import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import {
  GUIMMIA_AI_MONTHLY_BUDGET_USD,
  GUIMMIA_SCHEDULING_MAX_REQUEST_COST_USD,
  GUIMMIA_SCHEDULING_RATE_LIMIT_REQUESTS,
  GUIMMIA_SCHEDULING_RATE_LIMIT_WINDOW_MINUTES,
} from "@/lib/guimmia/openai/config";
import { interpretGuimmiaScheduling } from "@/lib/guimmia/openai/scheduling-interpreter";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 45;

type RateEntry = { count: number; resetAt: number };
const globalLimits = globalThis as typeof globalThis & {
  __guimmiaScheduleInterpretLimits?: Map<string, RateEntry>;
};
const limits = globalLimits.__guimmiaScheduleInterpretLimits ?? new Map<string, RateEntry>();
globalLimits.__guimmiaScheduleInterpretLimits = limits;

function access() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

async function rest<T>(path: string, init: RequestInit = {}) {
  const current = access();
  if (!current) throw new Error("supabase_not_configured");
  const response = await fetch(`${current.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: current.key,
      Authorization: `Bearer ${current.key}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`supabase_http_${response.status}`);
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

function rateAllowed(userId: string) {
  const now = Date.now();
  const duration = GUIMMIA_SCHEDULING_RATE_LIMIT_WINDOW_MINUTES * 60_000;
  const current = limits.get(userId);
  if (!current || current.resetAt <= now) {
    limits.set(userId, { count: 1, resetAt: now + duration });
    return true;
  }
  if (current.count >= GUIMMIA_SCHEDULING_RATE_LIMIT_REQUESTS) return false;
  current.count += 1;
  return true;
}

function jsonError(status: number, message: string) {
  return NextResponse.json(
    { ok: false, message },
    { status, headers: { "cache-control": "no-store" } },
  );
}

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function validTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("it-IT", { timeZone: value }).format(new Date());
    return value;
  } catch {
    return "Europe/Rome";
  }
}

async function budgetAvailable() {
  try {
    const rows = await rest<Array<{ remaining_usd?: string | number }>>(
      "rpc/guimmia_v773_ai_budget_status",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
    return Number(rows[0]?.remaining_usd) >= GUIMMIA_SCHEDULING_MAX_REQUEST_COST_USD;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !access()) {
    return jsonError(503, "Il database Guimmia non è configurato.");
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return jsonError(400, "Richiesta agenda non valida.");
  }
  const message = clean(body.message, 1200);
  const draftId = clean(body.draftId, 120);
  const timezone = validTimezone(clean(body.timezone, 80) || "Europe/Rome");
  if (!message || !draftId) return jsonError(400, "Servono messaggio e pratica.");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return jsonError(401, "Accedi per usare l’agenda Guimmia.");
  if (!rateAllowed(data.user.id)) return jsonError(429, "Hai inviato molte richieste agenda. Riprova più tardi.");
  if (!(await budgetAvailable())) {
    return jsonError(429, `Il budget OpenAI di prova di $${GUIMMIA_AI_MONTHLY_BUDGET_USD.toFixed(2)} non è disponibile.`);
  }

  try {
    const result = await interpretGuimmiaScheduling({ message, draftId, timezone });
    if (result.usage.estimatedCostUsd > GUIMMIA_SCHEDULING_MAX_REQUEST_COST_USD) {
      throw new Error("schedule_request_cost_guard");
    }
    const interactionId = crypto.randomUUID();
    await rest("guimmia_ai_schedule_interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        id: interactionId,
        user_id: data.user.id,
        draft_id: draftId,
        request_fingerprint: createHash("sha256").update(`${data.user.id}:${draftId}:${message}`).digest("hex"),
        message_hash: createHash("sha256").update(message).digest("hex"),
        model: result.model,
        execution_mode: "PROPOSAL_ONLY",
        status: "COMPLETED",
        response_id: result.requestId,
        ai_result: result.proposal,
        input_tokens: result.usage.inputTokens,
        cached_input_tokens: result.usage.cachedInputTokens,
        output_tokens: result.usage.outputTokens,
        estimated_cost_usd: result.usage.estimatedCostUsd,
        human_confirmation_required: true,
        automatic_booking_executed: false,
      }),
    });
    await rest("guimmia_ai_usage_events", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        schedule_interaction_id: interactionId,
        request_id: result.requestId,
        use_case: "SCHEDULING_INTAKE",
        model: result.model,
        execution_mode: "DRY_RUN",
        status: "COMPLETED",
        input_tokens: result.usage.inputTokens,
        cached_input_tokens: result.usage.cachedInputTokens,
        output_tokens: result.usage.outputTokens,
        web_search_calls: 0,
        file_search_calls: 0,
        estimated_cost_usd: result.usage.estimatedCostUsd,
      }),
    });
    return NextResponse.json(
      { ok: true, proposal: result.proposal },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (cause) {
    console.error("Guimmia schedule interpretation failed", cause);
    return jsonError(502, "Non sono riuscita a interpretare giorno e orario. Puoi inserirli nell’Agenda.");
  }
}
