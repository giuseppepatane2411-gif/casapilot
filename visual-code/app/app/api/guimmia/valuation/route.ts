import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import {
  getOpenAIConfiguration,
  GUIMMIA_AI_MAX_REQUEST_COST_USD,
  GUIMMIA_AI_MONTHLY_BUDGET_USD,
  GUIMMIA_AI_RATE_LIMIT_REQUESTS,
  GUIMMIA_AI_RATE_LIMIT_WINDOW_MINUTES,
} from "@/lib/guimmia/openai/config";
import {
  generatePropertyValuation,
  OpenAINotConfiguredError,
} from "@/lib/guimmia/openai/valuation";
import type {
  PropertyCondition,
  PropertyValuationError,
  PropertyValuationInput,
  PropertyValuationSuccess,
  ValuationOperation,
} from "@/lib/guimmia/openai/types";
import { createClient } from "@/lib/supabase/server";
import { sendValuationEmail } from "@/lib/guimmia/valuation-email";

export const runtime = "nodejs";
export const maxDuration = 60;

type RateLimitEntry = { count: number; resetAt: number };
const globalRateLimits = globalThis as typeof globalThis & {
  __guimmiaValuationRateLimits?: Map<string, RateLimitEntry>;
};
const rateLimits =
  globalRateLimits.__guimmiaValuationRateLimits ?? new Map<string, RateLimitEntry>();
globalRateLimits.__guimmiaValuationRateLimits = rateLimits;

const operations = new Set<ValuationOperation>([
  "SALE",
  "RENT_LONG_TERM",
  "RENT_SHORT_TERM",
  "RENT_ROOM",
]);
const conditions = new Set<PropertyCondition>([
  "NEW",
  "RENOVATED",
  "GOOD",
  "TO_RENOVATE",
]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanNumber(value: unknown, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max
    ? parsed
    : null;
}

function cleanBoolean(value: unknown) {
  return value === true;
}

function error(
  status: number,
  code: PropertyValuationError["error"],
  message: string,
  extra: Partial<PropertyValuationError> = {},
  headers: Record<string, string> = {},
) {
  return NextResponse.json<PropertyValuationError>(
    { ok: false, error: code, message, ...extra },
    { status, headers: { "cache-control": "no-store", ...headers } },
  );
}

function requestIdentity(request: Request, email: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}|${email}`).digest("hex");
}

function consumeRateLimit(identity: string) {
  const now = Date.now();
  const windowMs = GUIMMIA_AI_RATE_LIMIT_WINDOW_MINUTES * 60_000;
  const current = rateLimits.get(identity);

  if (!current || current.resetAt <= now) {
    rateLimits.set(identity, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= GUIMMIA_AI_RATE_LIMIT_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  rateLimits.set(identity, current);
  return { allowed: true, retryAfterSeconds: 0 };
}

function parseInput(
  body: Record<string, unknown>,
  owner: PropertyValuationInput["owner"],
): PropertyValuationInput | null {
  const operation = cleanText(body.operation, 30) as ValuationOperation;
  const rawProperty =
    body.property && typeof body.property === "object" && !Array.isArray(body.property)
      ? (body.property as Record<string, unknown>)
      : {};
  const rawRoomDetails =
    rawProperty.roomDetails &&
    typeof rawProperty.roomDetails === "object" &&
    !Array.isArray(rawProperty.roomDetails)
      ? (rawProperty.roomDetails as Record<string, unknown>)
      : {};
  const condition = cleanText(rawProperty.condition, 30) as PropertyCondition;
  const latitude =
    rawProperty.latitude === "" || rawProperty.latitude === null
      ? null
      : cleanNumber(rawProperty.latitude, -90, 90);
  const longitude =
    rawProperty.longitude === "" || rawProperty.longitude === null
      ? null
      : cleanNumber(rawProperty.longitude, -180, 180);
  const locationVerified = cleanBoolean(rawProperty.locationVerified);
  const surfaceSqm = cleanNumber(rawProperty.surfaceSqm, 10, 5000);
  const rooms = cleanNumber(rawProperty.rooms, 1, 100);
  const bedrooms = cleanNumber(rawProperty.bedrooms, 0, 50);
  const bathrooms = cleanNumber(rawProperty.bathrooms, 0, 30);
  const floor =
    rawProperty.floor === "" || rawProperty.floor === null
      ? null
      : cleanNumber(rawProperty.floor, -5, 200);
  const yearBuilt =
    rawProperty.yearBuilt === "" || rawProperty.yearBuilt === null
      ? null
      : cleanNumber(rawProperty.yearBuilt, 1500, new Date().getFullYear() + 5);
  const monthlyCondominiumFees =
    rawProperty.monthlyCondominiumFees === "" ||
    rawProperty.monthlyCondominiumFees === null
      ? null
      : cleanNumber(rawProperty.monthlyCondominiumFees, 0, 10000);
  const heating = cleanText(rawProperty.heating, 30) as PropertyValuationInput["property"]["heating"];
  const occupancy = cleanText(rawProperty.occupancy, 30) as PropertyValuationInput["property"]["occupancy"];
  const roomType = cleanText(rawRoomDetails.roomType, 30) as NonNullable<
    PropertyValuationInput["property"]["roomDetails"]
  >["roomType"];
  const roomSurfaceSqm = cleanNumber(rawRoomDetails.roomSurfaceSqm, 4, 200);
  const currentRoommates = cleanNumber(rawRoomDetails.currentRoommates, 0, 30);
  const householdComposition = cleanText(
    rawRoomDetails.householdComposition,
    30,
  ) as NonNullable<
    PropertyValuationInput["property"]["roomDetails"]
  >["householdComposition"];
  const acceptedOccupantProfiles = Array.isArray(
    rawRoomDetails.acceptedOccupantProfiles,
  )
    ? Array.from(
        new Set(
          rawRoomDetails.acceptedOccupantProfiles.filter(
            (item): item is "STUDENT" | "WORKER" =>
              item === "STUDENT" || item === "WORKER",
          ),
        ),
      )
    : [];
  const roomDetailsValid =
    operation !== "RENT_ROOM" ||
    (["SINGLE", "DOUBLE_SINGLE_USE", "SHARED"].includes(roomType) &&
      roomSurfaceSqm !== null &&
      currentRoommates !== null &&
      ["NONE", "MEN", "WOMEN", "MIXED", "UNKNOWN"].includes(
        householdComposition,
      ) &&
      acceptedOccupantProfiles.length > 0);

  if (
    !operations.has(operation) ||
    !conditions.has(condition) ||
    !cleanText(rawProperty.propertyType, 80) ||
    !cleanText(rawProperty.city, 120) ||
    !cleanText(rawProperty.province, 120) ||
    latitude === null ||
    longitude === null ||
    !locationVerified ||
    surfaceSqm === null ||
    rooms === null ||
    bedrooms === null ||
    bathrooms === null ||
    (rawProperty.floor !== "" && rawProperty.floor !== null && floor === null) ||
    (rawProperty.yearBuilt !== "" && rawProperty.yearBuilt !== null && yearBuilt === null) ||
    (rawProperty.monthlyCondominiumFees !== "" &&
      rawProperty.monthlyCondominiumFees !== null &&
      monthlyCondominiumFees === null) ||
    !["AUTONOMOUS", "CENTRAL", "HEAT_PUMP", "NONE", "UNKNOWN"].includes(heating) ||
    !["VACANT", "OWNER_OCCUPIED", "TENANTED"].includes(occupancy) ||
    !roomDetailsValid ||
    body.privacyAccepted !== true ||
    body.automatedAnalysisAccepted !== true
  ) {
    return null;
  }

  return {
    operation,
    property: {
      propertyType: cleanText(rawProperty.propertyType, 80),
      country: cleanText(rawProperty.country, 80) || "Italia",
      city: cleanText(rawProperty.city, 120),
      province: cleanText(rawProperty.province, 120),
      postalCode: cleanText(rawProperty.postalCode, 12) || undefined,
      address: cleanText(rawProperty.address, 200) || undefined,
      latitude,
      longitude,
      locationVerified: true,
      locationLabel: cleanText(rawProperty.locationLabel, 300) || undefined,
      surfaceSqm,
      rooms,
      bedrooms,
      bathrooms,
      floor,
      yearBuilt,
      elevator: cleanBoolean(rawProperty.elevator),
      condition,
      energyClass: cleanText(rawProperty.energyClass, 12) || undefined,
      heating,
      occupancy,
      monthlyCondominiumFees,
      outdoorSpace: cleanBoolean(rawProperty.outdoorSpace),
      parking: cleanBoolean(rawProperty.parking),
      furnished: cleanBoolean(rawProperty.furnished),
      roomDetails:
        operation === "RENT_ROOM"
          ? {
              roomType,
              roomSurfaceSqm: roomSurfaceSqm!,
              privateBathroom: cleanBoolean(rawRoomDetails.privateBathroom),
              currentRoommates: currentRoommates!,
              householdComposition,
              acceptedOccupantProfiles,
              availableFrom:
                cleanText(rawRoomDetails.availableFrom, 20) || undefined,
              expensesIncluded: cleanBoolean(rawRoomDetails.expensesIncluded),
            }
          : undefined,
      notes: cleanText(rawProperty.notes, 1000) || undefined,
    },
    owner,
    privacyAccepted: true,
    automatedAnalysisAccepted: true,
    website: cleanText(body.website, 100) || undefined,
  };
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
    console.error(`Guimmia ${table} insert failed`, response.status, await response.text());
    return false;
  }

  return true;
}

async function supabaseUpdate(
  table: string,
  id: string,
  value: Record<string, unknown>,
) {
  const access = supabaseAccess();
  if (!access) return false;

  const response = await fetch(
    `${access.url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        apikey: access.key,
        Authorization: `Bearer ${access.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(value),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.error(`Guimmia ${table} update failed`, response.status, await response.text());
    return false;
  }

  return true;
}

async function budgetStatus() {
  const access = supabaseAccess();
  if (!access) return { enforced: false, available: true, remainingUsd: null };

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
    if (!response.ok) return { enforced: false, available: true, remainingUsd: null };

    const rows = (await response.json()) as Array<{
      remaining_usd?: number | string;
      available?: boolean;
    }>;
    const row = rows[0];
    const remainingUsd = Number(row?.remaining_usd);
    return {
      enforced: true,
      available:
        row?.available === true &&
        Number.isFinite(remainingUsd) &&
        remainingUsd >= GUIMMIA_AI_MAX_REQUEST_COST_USD,
      remainingUsd: Number.isFinite(remainingUsd) ? remainingUsd : 0,
    };
  } catch {
    return { enforced: false, available: true, remainingUsd: null };
  }
}

type LeadAIState = {
  status: "PENDING" | "COMPLETED" | "FAILED" | "NOT_CONFIGURED" | "BLOCKED";
  requestId?: string;
  model?: string;
  result?: unknown;
  sources?: unknown;
  quality?: unknown;
  usage?: {
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
    webSearchCalls: number;
    estimatedCostUsd: number;
  };
  errorCode?: string;
};

function leadPayload(
  leadId: string,
  userId: string,
  input: PropertyValuationInput,
  ai: LeadAIState,
) {
  return {
    id: leadId,
    user_id: userId,
    registration_verified_at: new Date().toISOString(),
    operation_type: input.operation,
    owner_name: input.owner.name,
    owner_email: input.owner.email,
    owner_phone: input.owner.phone ?? null,
    property_snapshot: input.property,
    privacy_accepted_at: new Date().toISOString(),
    automated_analysis_accepted_at: new Date().toISOString(),
    source: "PUBLIC_VALUATION",
    status:
      ai.status === "PENDING"
        ? "VALUATION_REQUESTED"
        : ai.status === "COMPLETED"
          ? "VALUATION_READY"
          : "NEEDS_REVIEW",
    ai_execution_mode: "DRY_RUN",
    ai_status: ai.status,
    ai_request_id: ai.requestId ?? null,
    ai_model: ai.model ?? "gpt-5.6-luna",
    ai_result: ai.result ?? null,
    ai_sources: ai.sources ?? [],
    ai_quality: ai.quality ?? null,
    input_tokens: ai.usage?.inputTokens ?? 0,
    cached_input_tokens: ai.usage?.cachedInputTokens ?? 0,
    output_tokens: ai.usage?.outputTokens ?? 0,
    web_search_calls: ai.usage?.webSearchCalls ?? 0,
    estimated_cost_usd: ai.usage?.estimatedCostUsd ?? 0,
    error_code: ai.errorCode ?? null,
    email_delivery_status: ai.status === "COMPLETED" ? "PENDING" : "NOT_SENT",
  };
}

async function createLead(
  leadId: string,
  userId: string,
  input: PropertyValuationInput,
  ai: LeadAIState,
) {
  return supabaseInsert(
    "guimmia_property_valuation_leads",
    leadPayload(leadId, userId, input, ai),
  );
}

async function updateLead(
  leadId: string,
  userId: string,
  input: PropertyValuationInput,
  ai: LeadAIState,
) {
  return supabaseUpdate(
    "guimmia_property_valuation_leads",
    leadId,
    leadPayload(leadId, userId, input, ai),
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 32_000) {
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

  if (cleanText(body.website, 100)) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  if (!supabaseAccess()) {
    return error(
      503,
      "database_not_configured",
      "La stima non parte perché il collegamento sicuro al database non è ancora configurato.",
    );
  }

  let authenticatedUser: {
    id: string;
    email: string;
    user_metadata: Record<string, unknown>;
  } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user?.id && data.user.email) {
      authenticatedUser = {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata ?? {},
      };
    }
  } catch (caught) {
    console.error("Guimmia valuation auth check failed", caught);
  }

  if (!authenticatedUser) {
    return error(
      401,
      "registration_required",
      "Crea il tuo account o accedi per collegare la richiesta e ricevere la valutazione via email.",
    );
  }

  const metadata = authenticatedUser.user_metadata;
  const ownerName =
    cleanText(metadata.full_name, 120) ||
    cleanText(metadata.name, 120) ||
    authenticatedUser.email.split("@")[0];
  const input = parseInput(body, {
    name: ownerName,
    email: authenticatedUser.email.toLowerCase(),
    phone: cleanText(metadata.phone, 40),
  });
  if (!input) {
    return error(
      400,
      "invalid_request",
      "Controlla i campi obbligatori e i consensi prima di continuare.",
    );
  }

  const leadId = crypto.randomUUID();
  const leadCaptured = await createLead(leadId, authenticatedUser.id, input, {
    status: "PENDING",
  });
  if (!leadCaptured) {
    return error(
      503,
      "lead_capture_failed",
      "Non siamo riusciti a salvare la richiesta. La valutazione non è stata avviata e non ha consumato credito.",
      { leadId, leadSaved: false },
    );
  }

  const rateLimit = consumeRateLimit(requestIdentity(request, input.owner.email));
  if (!rateLimit.allowed) {
    await updateLead(leadId, authenticatedUser.id, input, {
      status: "BLOCKED",
      errorCode: "REQUEST_LIMIT_REACHED",
    });
    return error(
      429,
      "request_limit_reached",
      `Hai già richiesto ${GUIMMIA_AI_RATE_LIMIT_REQUESTS} stime. Riprova più tardi per proteggere il budget della sperimentazione.`,
      { leadId, leadSaved: true },
      { "retry-after": String(rateLimit.retryAfterSeconds) },
    );
  }

  const openAIConfiguration = getOpenAIConfiguration();
  const currentBudget = await budgetStatus();
  if (openAIConfiguration.configured && !currentBudget.available) {
    await updateLead(leadId, authenticatedUser.id, input, {
      status: "BLOCKED",
      errorCode: "MONTHLY_BUDGET_REACHED",
    });
    return error(
      429,
      "budget_limit_reached",
      `Il budget mensile di prova di $${GUIMMIA_AI_MONTHLY_BUDGET_USD.toFixed(2)} è stato raggiunto. La richiesta resta disponibile per Guimmia.`,
      { leadId, leadSaved: true },
    );
  }

  try {
    const ai = await generatePropertyValuation({
      operation: input.operation,
      property: input.property,
    });
    const valuationSaved = await updateLead(leadId, authenticatedUser.id, input, {
      status: "COMPLETED",
      requestId: ai.requestId,
      model: ai.model,
      result: ai.result,
      sources: ai.sources,
      quality: ai.quality,
      usage: ai.usage,
    });

    if (!valuationSaved) {
      return error(
        503,
        "valuation_persistence_failed",
        "La richiesta è stata acquisita, ma il risultato non è stato salvato correttamente. Guimmia non mostra una stima non registrata.",
        { leadId, leadSaved: true },
      );
    }

    await supabaseInsert("guimmia_ai_usage_events", {
      valuation_lead_id: leadId,
      request_id: ai.requestId,
      use_case: "PROPERTY_VALUATION",
      model: ai.model,
      execution_mode: "DRY_RUN",
      status: "COMPLETED",
      input_tokens: ai.usage.inputTokens,
      cached_input_tokens: ai.usage.cachedInputTokens,
      output_tokens: ai.usage.outputTokens,
      web_search_calls: ai.usage.webSearchCalls,
      estimated_cost_usd: ai.usage.estimatedCostUsd,
    });

    const continuationGoal =
      input.operation === "SALE"
        ? "sale"
        : input.operation === "RENT_ROOM"
          ? "rent_room"
          : "rent";
    const continuationUrl = `/dashboard/properties/new?goal=${continuationGoal}&valuationLeadId=${leadId}`;

    const emailDelivery = await sendValuationEmail({
      to: input.owner.email,
      name: input.owner.name,
      operation: input.operation,
      result: ai.result,
      continuationUrl: new URL(continuationUrl, request.url).toString(),
    });
    await supabaseUpdate("guimmia_property_valuation_leads", leadId, {
      email_delivery_status: emailDelivery,
      email_sent_at: emailDelivery === "SENT" ? new Date().toISOString() : null,
    });

    return NextResponse.json<PropertyValuationSuccess>(
      {
        ok: true,
        leadId,
        leadSaved: true,
        mode: "DRY_RUN",
        model: ai.model,
        operation: input.operation,
        result: ai.result,
        sources: ai.sources,
        usage: ai.usage,
        quality: ai.quality,
        continuationUrl,
        emailDelivery,
        humanReviewRequired: true,
      },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (caught) {
    const notConfigured = caught instanceof OpenAINotConfiguredError;
    await updateLead(leadId, authenticatedUser.id, input, {
      status: notConfigured ? "NOT_CONFIGURED" : "FAILED",
      errorCode: notConfigured ? "OPENAI_NOT_CONFIGURED" : "OPENAI_REQUEST_FAILED",
    });

    console.error("Guimmia valuation failed", caught);
    return error(
      notConfigured ? 503 : 502,
      notConfigured ? "openai_not_configured" : "valuation_failed",
      notConfigured
        ? "La richiesta è stata acquisita, ma Luna non è ancora collegata al server."
        : "L’analisi non è riuscita. La richiesta resta disponibile per il controllo Guimmia.",
      { leadId, leadSaved: true },
    );
  }
}
