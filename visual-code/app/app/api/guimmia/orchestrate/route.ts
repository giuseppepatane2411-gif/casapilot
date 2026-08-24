import { NextResponse } from "next/server";

import { orchestrateSiteCase } from "@/lib/guimmia/site-orchestration/server";
import type { SiteOrchestrationRequest } from "@/lib/guimmia/site-orchestration/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const validOperations = new Set([
  "SALE",
  "RENT_LONG_TERM",
  "RENT_TRANSITORY",
  "RENT_STUDENT",
  "RENT_TOURIST_SHORT",
]);
const validCustomerRoles = new Set([
  "OWNER",
  "SELLER",
  "BUYER",
  "LANDLORD",
  "TENANT",
  "GUEST",
  "REPRESENTATIVE",
  "UNCONFIRMED",
]);
const validServiceModels = new Set(["COMPLETA", "MENSILE"]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  let body: SiteOrchestrationRequest;

  try {
    const parsed = (await request.json()) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid_json_shape");
    }
    body = parsed as SiteOrchestrationRequest;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const caseId = cleanText(body.caseId, 120);
  if (!caseId) {
    return NextResponse.json(
      { ok: false, error: "case_id_required" },
      { status: 400 },
    );
  }

  const operationType = body.operationType ?? null;
  if (operationType && !validOperations.has(operationType)) {
    return NextResponse.json(
      { ok: false, error: "operation_type_unsupported" },
      { status: 400 },
    );
  }
  const customerRole = validCustomerRoles.has(String(body.customerRole))
    ? body.customerRole
    : "UNCONFIRMED";
  const serviceModel = validServiceModels.has(String(body.serviceModel))
    ? body.serviceModel
    : undefined;

  let identityConfirmed = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json(
        { ok: false, error: "authentication_required" },
        { status: 401 },
      );
    }
    identityConfirmed = true;
  }

  try {
    const result = orchestrateSiteCase(
      {
        ...body,
        caseId,
        operationType,
        customerRole,
        serviceModel,
        progress: body.progress
          ? {
              currentPhase:
                cleanText(body.progress.currentPhase, 80) || "INTAKE",
              completedActionCodes: Array.isArray(
                body.progress.completedActionCodes,
              )
                ? body.progress.completedActionCodes
                    .map((item) => cleanText(item, 120))
                    .filter(Boolean)
                    .slice(0, 100)
                : [],
            }
          : undefined,
        property: body.property
          ? {
              ...body.property,
              id: cleanText(body.property.id, 120) || undefined,
              type: cleanText(body.property.type, 80) || undefined,
              country: cleanText(body.property.country, 80) || undefined,
              city: cleanText(body.property.city, 120) || undefined,
              province: cleanText(body.property.province, 120) || undefined,
              address: cleanText(body.property.address, 240) || undefined,
              documents: Array.isArray(body.property.documents)
                ? body.property.documents
                    .map((item) => cleanText(item, 80))
                    .filter(Boolean)
                    .slice(0, 40)
                : [],
            }
          : undefined,
      },
      { identityConfirmed },
    );

    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "orchestration_failed" },
      { status: 422 },
    );
  }
}
